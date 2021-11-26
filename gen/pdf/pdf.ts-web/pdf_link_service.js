/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
 */
/* Copyright 2015 Mozilla Foundation
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
/** @typedef {import("./interfaces").IPDFLinkService} IPDFLinkService */
import { isObjectLike } from "../../lib/jslang.js";
import { parseQueryString } from "./ui_utils.js";
import { addLinkAttributes, LinkTarget } from "../pdf.ts-src/display/display_utils.js";
/**
 * Performs navigation functions inside PDF, such as opening specified page,
 * or destination.
 */
export class PDFLinkService {
    eventBus;
    externalLinkTarget;
    externalLinkRel;
    externalLinkEnabled = true;
    #ignoreDestinationZoom;
    baseUrl;
    pdfDocument;
    pdfViewer;
    pdfHistory;
    #pagesRefCache;
    constructor({ eventBus, externalLinkTarget, externalLinkRel, ignoreDestinationZoom = false, }) {
        this.eventBus = eventBus;
        this.externalLinkTarget = externalLinkTarget;
        this.externalLinkRel = externalLinkRel;
        this.#ignoreDestinationZoom = ignoreDestinationZoom;
    }
    setDocument(pdfDocument, baseUrl) {
        this.baseUrl = baseUrl;
        this.pdfDocument = pdfDocument;
        this.#pagesRefCache = Object.create(null);
    }
    setViewer(pdfViewer) {
        this.pdfViewer = pdfViewer;
    }
    setHistory(pdfHistory) {
        this.pdfHistory = pdfHistory;
    }
    get pagesCount() {
        return this.pdfDocument ? this.pdfDocument.numPages : 0;
    }
    /** @implements */
    get page() {
        return this.pdfViewer.currentPageNumber;
    }
    set page(value) {
        this.pdfViewer.currentPageNumber = value;
    }
    /** @implements */
    get rotation() {
        return this.pdfViewer.pagesRotation;
    }
    set rotation(value) {
        this.pdfViewer.pagesRotation = value;
    }
    #goToDestinationHelper = (rawDest, namedDest, explicitDest) => {
        // Dest array looks like that: <page-ref> </XYZ|/FitXXX> <args..>
        const destRef = explicitDest[0];
        let pageNumber;
        if (isObjectLike(destRef)) {
            pageNumber = this._cachedPageNumber(destRef);
            if (pageNumber === null) {
                // Fetch the page reference if it's not yet available. This could
                // only occur during loading, before all pages have been resolved.
                this.pdfDocument
                    .getPageIndex(destRef)
                    .then(pageIndex => {
                    this.cachePageRef(pageIndex + 1, destRef);
                    this.#goToDestinationHelper(rawDest, namedDest, explicitDest);
                })
                    .catch(() => {
                    console.error(`PDFLinkService.#goToDestinationHelper: "${destRef}" is not ` +
                        `a valid page reference, for dest="${rawDest}".`);
                });
                return;
            }
        }
        else if (Number.isInteger(destRef)) {
            pageNumber = destRef + 1;
        }
        else {
            console.error(`PDFLinkService.#goToDestinationHelper: "${destRef}" is not ` +
                `a valid destination reference, for dest="${rawDest}".`);
            return;
        }
        if (!pageNumber || pageNumber < 1 || pageNumber > this.pagesCount) {
            console.error(`PDFLinkService.#goToDestinationHelper: "${pageNumber}" is not ` +
                `a valid page number, for dest="${rawDest}".`);
            return;
        }
        if (this.pdfHistory) {
            // Update the browser history before scrolling the new destination into
            // view, to be able to accurately capture the current document position.
            this.pdfHistory.pushCurrentPosition();
            this.pdfHistory.push({ namedDest, explicitDest, pageNumber });
        }
        this.pdfViewer.scrollPageIntoView({
            pageNumber,
            destArray: explicitDest,
            ignoreDestinationZoom: this.#ignoreDestinationZoom,
        });
    };
    /**
     * This method will, when available, also update the browser history.
     * @implements
     * @param dest The named, or explicit, PDF destination.
     */
    async goToDestination(dest) {
        if (!this.pdfDocument)
            return;
        let namedDest, explicitDest;
        if (typeof dest === "string") {
            namedDest = dest;
            explicitDest = await this.pdfDocument.getDestination(dest);
        }
        else {
            namedDest = undefined;
            explicitDest = await dest;
        }
        if (!Array.isArray(explicitDest)) {
            console.error(`PDFLinkService.goToDestination: "${explicitDest}" is not ` +
                `a valid destination array, for dest="${dest}".`);
            return;
        }
        this.#goToDestinationHelper(dest, namedDest, explicitDest);
    }
    /**
     * This method will, when available, also update the browser history.
     *
     * @implements
     * @param val The page number, or page label.
     */
    goToPage(val) {
        if (!this.pdfDocument)
            return;
        const pageNumber = (typeof val === "string" && this.pdfViewer.pageLabelToPageNumber(val)) ||
            +val | 0;
        if (!(Number.isInteger(pageNumber)
            && pageNumber > 0
            && pageNumber <= this.pagesCount)) {
            console.error(`PDFLinkService.goToPage: "${val}" is not a valid page.`);
            return;
        }
        if (this.pdfHistory) {
            // Update the browser history before scrolling the new page into view,
            // to be able to accurately capture the current document position.
            this.pdfHistory.pushCurrentPosition();
            this.pdfHistory.pushPage(pageNumber);
        }
        this.pdfViewer.scrollPageIntoView({ pageNumber });
    }
    /**
     * Wrapper around the `addLinkAttributes`-function in the API.
     * @implements
     */
    addLinkAttributes(link, url, newWindow = false) {
        addLinkAttributes(link, {
            url,
            target: newWindow ? LinkTarget.BLANK : this.externalLinkTarget,
            rel: this.externalLinkRel,
            enabled: this.externalLinkEnabled,
        });
    }
    /**
     * @implements
     * @param dest The PDF destination object.
     * @return The hyperlink to the PDF object.
     */
    getDestinationHash(dest) {
        if (typeof dest === "string") {
            if (dest.length > 0) {
                return this.getAnchorUrl("#" + escape(dest));
            }
        }
        else if (Array.isArray(dest)) {
            const str = JSON.stringify(dest);
            if (str.length > 0) {
                return this.getAnchorUrl("#" + escape(str));
            }
        }
        return this.getAnchorUrl("");
    }
    /**
     * Prefix the full url on anchor links to make sure that links are resolved
     * relative to the current URL instead of the one defined in <base href>.
     * @implements
     * @param anchor The anchor hash, including the #.
     * @return The hyperlink to the PDF object.
     */
    getAnchorUrl(anchor) {
        return (this.baseUrl || "") + anchor;
    }
    /** @implements */
    setHash(hash) {
        if (!this.pdfDocument)
            return;
        let pageNumber, dest;
        if (hash.includes("=")) {
            const params = parseQueryString(hash);
            if (params.has("search")) {
                this.eventBus.dispatch("findfromurlhash", {
                    source: this,
                    query: params.get("search").replace(/"/g, ""),
                    phraseSearch: params.get("phrase") === "true",
                });
            }
            // borrowing syntax from "Parameters for Opening PDF Files"
            if (params.has("page")) {
                pageNumber = +params.get("page") | 0 || 1;
            }
            if (params.has("zoom")) {
                // Build the destination array.
                const zoomArgs = params.get("zoom").split(","); // scale,left,top
                const zoomArg = zoomArgs[0];
                const zoomArgNumber = parseFloat(zoomArg);
                if (!zoomArg.includes("Fit")) {
                    // If the zoomArg is a number, it has to get divided by 100. If it's
                    // a string, it should stay as it is.
                    dest = [
                        null,
                        { name: "XYZ" },
                        zoomArgs.length > 1 ? +zoomArgs[1] | 0 : null,
                        zoomArgs.length > 2 ? +zoomArgs[2] | 0 : null,
                        zoomArgNumber ? zoomArgNumber / 100 : zoomArg,
                    ];
                }
                else {
                    if (zoomArg === "Fit" || zoomArg === "FitB") {
                        dest = [null, { name: zoomArg }];
                    }
                    else if (zoomArg === "FitH"
                        || zoomArg === "FitBH"
                        || zoomArg === "FitV"
                        || zoomArg === "FitBV") {
                        dest = [
                            null,
                            { name: zoomArg },
                            zoomArgs.length > 1 ? +zoomArgs[1] | 0 : null,
                        ];
                    }
                    else if (zoomArg === "FitR") {
                        if (zoomArgs.length !== 5) {
                            console.error('PDFLinkService.setHash: Not enough parameters for "FitR".');
                        }
                        else {
                            dest = [
                                null,
                                { name: zoomArg },
                                +zoomArgs[1] | 0,
                                +zoomArgs[2] | 0,
                                +zoomArgs[3] | 0,
                                +zoomArgs[4] | 0,
                            ];
                        }
                    }
                    else {
                        console.error(`PDFLinkService.setHash: "${zoomArg}" is not a valid zoom value.`);
                    }
                }
            }
            if (dest) {
                this.pdfViewer.scrollPageIntoView({
                    pageNumber: pageNumber || this.page,
                    destArray: dest,
                    allowNegativeOffset: true,
                });
            }
            else if (pageNumber) {
                this.page = pageNumber; // simple page
            }
            if (params.has("pagemode")) {
                this.eventBus.dispatch("pagemode", {
                    source: this,
                    mode: params.get("pagemode"),
                });
            }
            // Ensure that this parameter is *always* handled last, in order to
            // guarantee that it won't be overridden (e.g. by the "page" parameter).
            if (params.has("nameddest")) {
                this.goToDestination(params.get("nameddest"));
            }
        }
        else {
            // Named (or explicit) destination.
            let dest = unescape(hash);
            try {
                dest = JSON.parse(dest);
                if (!Array.isArray(dest)) {
                    // Avoid incorrectly rejecting a valid named destination, such as
                    // e.g. "4.3" or "true", because `JSON.parse` converted its type.
                    dest = dest.toString();
                }
            }
            catch (ex) { }
            if (typeof dest === "string" || isValidExplicitDestination(dest)) {
                this.goToDestination(dest);
                return;
            }
            console.error(`PDFLinkService.setHash: "${unescape(hash)}" is not ` +
                "a valid destination.");
        }
    }
    /** @implements */
    executeNamedAction(action) {
        // See PDF reference, table 8.45 - Named action
        switch (action) {
            case "GoBack":
                this.pdfHistory?.back();
                break;
            case "GoForward":
                this.pdfHistory?.forward();
                break;
            case "NextPage":
                this.pdfViewer.nextPage();
                break;
            case "PrevPage":
                this.pdfViewer.previousPage();
                break;
            case "LastPage":
                this.page = this.pagesCount;
                break;
            case "FirstPage":
                this.page = 1;
                break;
            default:
                break; // No action according to spec
        }
        this.eventBus.dispatch("namedaction", {
            source: this,
            action,
        });
    }
    /**
     * @implements
     * @param pageNum page number.
     * @param pageRef reference to the page.
     */
    cachePageRef(pageNum, pageRef) {
        if (!pageRef)
            return;
        const refStr = pageRef.gen === 0 ? `${pageRef.num}R` : `${pageRef.num}R${pageRef.gen}`;
        this.#pagesRefCache[refStr] = pageNum;
    }
    _cachedPageNumber(pageRef) {
        const refStr = pageRef.gen === 0 ? `${pageRef.num}R` : `${pageRef.num}R${pageRef.gen}`;
        return this.#pagesRefCache?.[refStr] || null;
    }
    /** @implements */
    isPageVisible(pageNumber) {
        return this.pdfViewer.isPageVisible(pageNumber);
    }
    isPageCached(pageNumber) {
        return this.pdfViewer.isPageCached(pageNumber);
    }
}
function isValidExplicitDestination(dest) {
    if (!Array.isArray(dest))
        return false;
    const destLength = dest.length;
    if (destLength < 2)
        return false;
    const page = dest[0];
    if (!(typeof page === "object"
        && Number.isInteger(page.num)
        && Number.isInteger(page.gen)) &&
        !(Number.isInteger(page) && page >= 0)) {
        return false;
    }
    const zoom = dest[1];
    if (!(typeof zoom === "object" && typeof zoom.name === "string")) {
        return false;
    }
    let allowNull = true;
    switch (zoom.name) {
        case "XYZ":
            if (destLength !== 5) {
                return false;
            }
            break;
        case "Fit":
        case "FitB":
            return destLength === 2;
        case "FitH":
        case "FitBH":
        case "FitV":
        case "FitBV":
            if (destLength !== 3) {
                return false;
            }
            break;
        case "FitR":
            if (destLength !== 6) {
                return false;
            }
            allowNull = false;
            break;
        default:
            return false;
    }
    for (let i = 2; i < destLength; i++) {
        const param = dest[i];
        if (!(typeof param === "number" || (allowNull && param === null))) {
            return false;
        }
    }
    return true;
}
export class SimpleLinkService {
    /** @implements */
    externalLinkTarget;
    /** @implements */
    externalLinkRel;
    /** @implements */
    externalLinkEnabled = true;
    /** @implements */
    get pagesCount() { return 0; }
    /** @implements */
    get page() { return 0; }
    set page(value) { }
    /** @implements */
    get rotation() { return 0; }
    set rotation(value) { }
    /**
     * @param dest The named, or explicit, PDF destination.
     */
    async goToDestination(dest) { }
    /**
     * @param val The page number, or page label.
     */
    goToPage(val) { }
    /** @implements */
    addLinkAttributes(link, url, newWindow = false) {
        addLinkAttributes(link, { url, enabled: this.externalLinkEnabled });
    }
    /**
     * @param dest The PDF destination object.
     * @return The hyperlink to the PDF object.
     */
    getDestinationHash(dest) { return "#"; }
    /**
     * @implements
     * @param hash The PDF parameters/hash.
     * @return The hyperlink to the PDF object.
     */
    getAnchorUrl(hash) { return "#"; }
    /** @implements */
    setHash(hash) { }
    /** @implements */
    executeNamedAction(action) { }
    /**
     * @implements
     * @param pageNum page number.
     * @param pageRef reference to the page.
     */
    cachePageRef(pageNum, pageRef) { }
    /** @implements */
    isPageVisible(pageNumber) { return true; }
    /**
     * @implements
     * @param {number} pageNumber
     */
    isPageCached(pageNumber) { return true; }
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=pdf_link_service.js.map