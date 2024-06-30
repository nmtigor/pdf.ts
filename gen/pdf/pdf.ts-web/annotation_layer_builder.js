/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/annotation_layer_builder.ts
 * @license Apache-2.0
 ******************************************************************************/
/* Copyright 2014 Mozilla Foundation
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
import { html } from "../../lib/dom.js";
import { AnnotationLayer } from "../pdf.ts-src/pdf.js";
import { PresentationModeState } from "./ui_utils.js";
export class AnnotationLayerBuilder {
    pdfPage;
    linkService;
    downloadManager;
    imageResourcesPath;
    renderForms;
    annotationStorage;
    enableScripting;
    _hasJSActionsPromise;
    _fieldObjectsPromise;
    _annotationCanvasMap;
    _accessibilityManager;
    _annotationEditorUIManager;
    #onAppend;
    annotationLayer;
    div;
    _cancelled = false;
    _eventBus;
    //kkkk TOCLEANUP
    // #onPresentationModeChanged:
    //   | ((evt: { state: PresentationModeState }) => void)
    //   | undefined;
    #eventAbortController;
    constructor({ pdfPage, linkService, downloadManager, annotationStorage, imageResourcesPath = "", renderForms = true, enableScripting = false, hasJSActionsPromise, fieldObjectsPromise, annotationCanvasMap, accessibilityManager, annotationEditorUIManager, onAppend, }) {
        this.pdfPage = pdfPage;
        this.linkService = linkService;
        this.downloadManager = downloadManager;
        this.imageResourcesPath = imageResourcesPath;
        this.renderForms = renderForms;
        this.annotationStorage = annotationStorage;
        this.enableScripting = enableScripting;
        this._hasJSActionsPromise = hasJSActionsPromise || Promise.resolve(false);
        this._fieldObjectsPromise = fieldObjectsPromise ||
            Promise.resolve(undefined);
        this._annotationCanvasMap = annotationCanvasMap;
        this._accessibilityManager = accessibilityManager;
        this._annotationEditorUIManager = annotationEditorUIManager;
        this.#onAppend = onAppend;
        this._eventBus = linkService.eventBus;
    }
    /**
     * @param viewport
     * @param intent (default value is 'display')
     * @return A promise that is resolved when rendering of the
     *   annotations is complete.
     */
    async render(viewport, intent = "display") {
        if (this.div) {
            if (this._cancelled || !this.annotationLayer) {
                return;
            }
            // If an annotationLayer already exists, refresh its children's
            // transformation matrices.
            this.annotationLayer.update({
                viewport: viewport.clone({ dontFlip: true }),
            });
            return;
        }
        const [annotations, hasJSActions, fieldObjects] = await Promise.all([
            this.pdfPage.getAnnotations({ intent }),
            this._hasJSActionsPromise,
            this._fieldObjectsPromise,
        ]);
        if (this._cancelled) {
            return;
        }
        // Create an annotation layer div and render the annotations
        // if there is at least one annotation.
        const div = (this.div = html("div"));
        div.className = "annotationLayer";
        this.#onAppend?.(div);
        if (annotations.length === 0) {
            this.hide();
            return;
        }
        this.annotationLayer = new AnnotationLayer({
            div,
            accessibilityManager: this._accessibilityManager,
            annotationCanvasMap: this._annotationCanvasMap,
            annotationEditorUIManager: this._annotationEditorUIManager,
            page: this.pdfPage,
            viewport: viewport.clone({ dontFlip: true }),
        });
        await this.annotationLayer.render({
            annotations,
            imageResourcesPath: this.imageResourcesPath,
            renderForms: this.renderForms,
            linkService: this.linkService,
            downloadManager: this.downloadManager,
            annotationStorage: this.annotationStorage,
            enableScripting: this.enableScripting,
            hasJSActions,
            fieldObjects,
        });
        // Ensure that interactive form elements in the annotationLayer are
        // disabled while PresentationMode is active (see issue 12232).
        if (this.linkService.isInPresentationMode) {
            this.#updatePresentationModeState(PresentationModeState.FULLSCREEN);
        }
        if (!this.#eventAbortController) {
            this.#eventAbortController = new AbortController();
            this._eventBus?._on("presentationmodechanged", (evt) => {
                this.#updatePresentationModeState(evt.state);
            }, { signal: this.#eventAbortController.signal });
        }
    }
    cancel() {
        this._cancelled = true;
        this.#eventAbortController?.abort();
        this.#eventAbortController = undefined;
    }
    hide() {
        if (!this.div)
            return;
        this.div.hidden = true;
    }
    #updatePresentationModeState(state) {
        if (!this.div) {
            return;
        }
        let disableFormElements = false;
        switch (state) {
            case PresentationModeState.FULLSCREEN:
                disableFormElements = true;
                break;
            case PresentationModeState.NORMAL:
                break;
            default:
                return;
        }
        for (const section of this.div.childNodes) {
            if (section.hasAttribute("data-internal-link")) {
                continue;
            }
            section.inert = disableFormElements;
        }
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=annotation_layer_builder.js.map