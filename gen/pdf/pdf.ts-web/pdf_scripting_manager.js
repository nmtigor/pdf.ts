/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
/* Copyright 2021 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/** @typedef {import("./event_utils").EventBus} EventBus */
import { CHROME, GENERIC, PDFJSDev } from "../../global.js";
import { PromiseCap } from "../../lib/util/PromiseCap.js";
import { shadow } from "../pdf.ts-src/pdf.js";
import { apiPageLayoutToViewerModes, RenderingStates } from "./ui_utils.js";
export class PDFScriptingManager {
    #pdfDocument;
    #pdfViewer;
    setViewer(pdfViewer) {
        this.#pdfViewer = pdfViewer;
    }
    #closeCapability;
    #destroyCapability;
    get destroyPromise() {
        return this.#destroyCapability?.promise || undefined;
    }
    #scripting;
    #willPrintCapability;
    #ready = false;
    get ready() {
        return this.#ready;
    }
    #eventBus;
    #sandboxBundleSrc;
    #externalServices;
    #docProperties;
    constructor({ eventBus, sandboxBundleSrc, externalServices, docProperties, }) {
        this.#eventBus = eventBus;
        /*#static*/  {
            this.#sandboxBundleSrc = sandboxBundleSrc;
        }
        this.#externalServices = externalServices;
        this.#docProperties = docProperties;
    }
    async setDocument(pdfDocument) {
        if (this.#pdfDocument) {
            await this.#destroyScripting();
        }
        this.#pdfDocument = pdfDocument;
        if (!pdfDocument) {
            return;
        }
        const [objects, calculationOrder, docActions] = await Promise.all([
            pdfDocument.getFieldObjects(),
            pdfDocument.getCalculationOrderIds(),
            pdfDocument.getJSActions(),
        ]);
        if (!objects && !docActions) {
            // No FieldObjects or JavaScript actions were found in the document.
            await this.#destroyScripting();
            return;
        }
        if (pdfDocument !== this.#pdfDocument) {
            return; // The document was closed while the data resolved.
        }
        try {
            this.#scripting = await this.#initScripting();
        }
        catch (error) {
            console.error(`setDocument: "${error.message}".`);
            await this.#destroyScripting();
            return;
        }
        this.#internalEvents.set("updatefromsandbox", (event) => {
            if (event?.source === window) {
                this.#updateFromSandbox(event.detail);
            }
        });
        this.#internalEvents.set("dispatcheventinsandbox", (event) => {
            this.#scripting?.dispatchEventInSandbox(event.detail);
        });
        this.#internalEvents.set("pagechanging", ({ pageNumber, previous }) => {
            if (pageNumber === previous) {
                return; // The current page didn't change.
            }
            this.#dispatchPageClose(previous);
            this.#dispatchPageOpen(pageNumber);
        });
        this.#internalEvents.set("pagerendered", ({ pageNumber }) => {
            if (!this.#pageOpenPending.has(pageNumber)) {
                return; // No pending "PageOpen" event for the newly rendered page.
            }
            if (pageNumber !== this.#pdfViewer.currentPageNumber) {
                return; // The newly rendered page is no longer the current one.
            }
            this.#dispatchPageOpen(pageNumber);
        });
        this.#internalEvents.set("pagesdestroy", async (event) => {
            await this.#dispatchPageClose(this.#pdfViewer.currentPageNumber);
            await this.#scripting?.dispatchEventInSandbox({
                id: "doc",
                name: "WillClose",
            });
            this.#closeCapability?.resolve();
        });
        for (const [name, listener] of this.#internalEvents) {
            this.#eventBus._on(name, listener);
        }
        try {
            const docProperties = await this.#docProperties(pdfDocument);
            if (pdfDocument !== this.#pdfDocument) {
                return; // The document was closed while the properties resolved.
            }
            await this.#scripting.createSandbox({
                objects: objects,
                calculationOrder,
                appInfo: {
                    platform: navigator.platform,
                    language: navigator.language,
                },
                docInfo: {
                    ...docProperties,
                    actions: docActions,
                },
            });
            this.#eventBus.dispatch("sandboxcreated", { source: this });
        }
        catch (error) {
            console.error(`setDocument: "${error.message}".`);
            await this.#destroyScripting();
            return;
        }
        await this.#scripting?.dispatchEventInSandbox({
            id: "doc",
            name: "Open",
        });
        await this.#dispatchPageOpen(this.#pdfViewer.currentPageNumber, 
        /* initialize = */ true);
        // Defer this slightly, to ensure that scripting is *fully* initialized.
        Promise.resolve().then(() => {
            if (pdfDocument === this.#pdfDocument) {
                this.#ready = true;
            }
        });
    }
    async dispatchWillSave() {
        return this.#scripting?.dispatchEventInSandbox({
            id: "doc",
            name: "WillSave",
        });
    }
    async dispatchDidSave() {
        return this.#scripting?.dispatchEventInSandbox({
            id: "doc",
            name: "DidSave",
        });
    }
    async dispatchWillPrint() {
        if (!this.#scripting) {
            return;
        }
        await this.#willPrintCapability?.promise;
        this.#willPrintCapability = new PromiseCap();
        try {
            await this.#scripting.dispatchEventInSandbox({
                id: "doc",
                name: "WillPrint",
            });
        }
        catch (ex) {
            this.#willPrintCapability.resolve();
            this.#willPrintCapability = undefined;
            throw ex;
        }
        await this.#willPrintCapability.promise;
    }
    async dispatchDidPrint() {
        return this.#scripting?.dispatchEventInSandbox({
            id: "doc",
            name: "DidPrint",
        });
    }
    get #internalEvents() {
        return shadow(this, "#internalEvents", new Map());
    }
    get #pageOpenPending() {
        return shadow(this, "#pageOpenPending", new Set());
    }
    get #visitedPages() {
        return shadow(this, "#visitedPages", new Map());
    }
    async #updateFromSandbox(detail) {
        const pdfViewer = this.#pdfViewer;
        // Ignore some events, see below, that don't make sense in PresentationMode.
        const isInPresentationMode = pdfViewer.isInPresentationMode ||
            pdfViewer.isChangingPresentationMode;
        const { id, siblings, command, value } = detail;
        if (!id) {
            switch (command) {
                case "clear":
                    console.clear();
                    break;
                case "error":
                    console.error(value);
                    break;
                case "layout":
                    if (!isInPresentationMode) {
                        const modes = apiPageLayoutToViewerModes(value);
                        pdfViewer.spreadMode = modes.spreadMode;
                    }
                    break;
                case "page-num":
                    pdfViewer.currentPageNumber = value + 1;
                    break;
                case "print":
                    await pdfViewer.pagesPromise;
                    this.#eventBus.dispatch("print", { source: this });
                    break;
                case "println":
                    console.log(value);
                    break;
                case "zoom":
                    if (!isInPresentationMode) {
                        pdfViewer.currentScaleValue = value;
                    }
                    break;
                case "SaveAs":
                    this.#eventBus.dispatch("download", { source: this });
                    break;
                case "FirstPage":
                    pdfViewer.currentPageNumber = 1;
                    break;
                case "LastPage":
                    pdfViewer.currentPageNumber = pdfViewer.pagesCount;
                    break;
                case "NextPage":
                    pdfViewer.nextPage();
                    break;
                case "PrevPage":
                    pdfViewer.previousPage();
                    break;
                case "ZoomViewIn":
                    if (!isInPresentationMode) {
                        pdfViewer.increaseScale();
                    }
                    break;
                case "ZoomViewOut":
                    if (!isInPresentationMode) {
                        pdfViewer.decreaseScale();
                    }
                    break;
                case "WillPrintFinished":
                    this.#willPrintCapability?.resolve();
                    this.#willPrintCapability = undefined;
                    break;
            }
            return;
        }
        if (isInPresentationMode && detail.focus) {
            return;
        }
        delete detail.id;
        delete detail.siblings;
        const ids = siblings ? [id, ...siblings] : [id];
        for (const elementId of ids) {
            const element = document.querySelector(`[data-element-id="${elementId}"]`);
            if (element) {
                element.dispatchEvent(new CustomEvent("updatefromsandbox", { detail }));
            }
            else {
                // The element hasn't been rendered yet, use the AnnotationStorage.
                this.#pdfDocument?.annotationStorage.setValue(elementId, detail);
            }
        }
    }
    async #dispatchPageOpen(pageNumber, initialize = false) {
        const pdfDocument = this.#pdfDocument, visitedPages = this.#visitedPages;
        if (initialize) {
            this.#closeCapability = new PromiseCap();
        }
        if (!this.#closeCapability) {
            return; // Scripting isn't fully initialized yet.
        }
        const pageView = this.#pdfViewer.getPageView(/* index = */ pageNumber - 1);
        if (pageView?.renderingState !== RenderingStates.FINISHED) {
            this.#pageOpenPending.add(pageNumber);
            return; // Wait for the page to finish rendering.
        }
        this.#pageOpenPending.delete(pageNumber);
        const actionsPromise = (async () => {
            // Avoid sending, and thus serializing, the `actions` data more than once.
            const actions = await (!visitedPages.has(pageNumber)
                ? pageView.pdfPage?.getJSActions()
                : undefined);
            if (pdfDocument !== this.#pdfDocument) {
                return; // The document was closed while the actions resolved.
            }
            await this.#scripting?.dispatchEventInSandbox({
                id: "page",
                name: "PageOpen",
                pageNumber,
                actions,
            });
        })();
        visitedPages.set(pageNumber, actionsPromise);
    }
    async #dispatchPageClose(pageNumber) {
        const pdfDocument = this.#pdfDocument, visitedPages = this.#visitedPages;
        if (!this.#closeCapability) {
            return; // Scripting isn't fully initialized yet.
        }
        if (this.#pageOpenPending.has(pageNumber)) {
            return; // The page is still rendering; no "PageOpen" event dispatched.
        }
        const actionsPromise = visitedPages.get(pageNumber);
        if (!actionsPromise) {
            return; // The "PageClose" event must be preceded by a "PageOpen" event.
        }
        visitedPages.set(pageNumber, null);
        // Ensure that the "PageOpen" event is dispatched first.
        await actionsPromise;
        if (pdfDocument !== this.#pdfDocument) {
            return; // The document was closed while the actions resolved.
        }
        await this.#scripting?.dispatchEventInSandbox({
            id: "page",
            name: "PageClose",
            pageNumber,
        });
    }
    #initScripting() {
        this.#destroyCapability = new PromiseCap();
        if (this.#scripting) {
            throw new Error("#initScripting: Scripting already exists.");
        }
        return this.#externalServices.createScripting({
            sandboxBundleSrc: this.#sandboxBundleSrc,
        });
    }
    async #destroyScripting() {
        if (!this.#scripting) {
            this.#pdfDocument = undefined;
            this.#destroyCapability?.resolve();
            return;
        }
        if (this.#closeCapability) {
            await Promise.race([
                this.#closeCapability.promise,
                new Promise((resolve) => {
                    // Avoid the scripting/sandbox-destruction hanging indefinitely.
                    setTimeout(resolve, 1000);
                }),
            ]).catch(() => {
                // Ignore any errors, to ensure that the sandbox is always destroyed.
            });
            this.#closeCapability = undefined;
        }
        this.#pdfDocument = undefined;
        try {
            await this.#scripting.destroySandbox();
        }
        catch (ex) { }
        this.#willPrintCapability?.reject(new Error("Scripting destroyed."));
        this.#willPrintCapability = undefined;
        for (const [name, listener] of this.#internalEvents) {
            this.#eventBus._off(name, listener);
        }
        this.#internalEvents.clear();
        this.#pageOpenPending.clear();
        this.#visitedPages.clear();
        this.#scripting = undefined;
        this.#ready = false;
        this.#destroyCapability?.resolve();
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=pdf_scripting_manager.js.map