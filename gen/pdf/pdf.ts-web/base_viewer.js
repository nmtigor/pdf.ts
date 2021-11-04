/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
 */
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
import { DEFAULT_SCALE, DEFAULT_SCALE_DELTA, DEFAULT_SCALE_VALUE, getVisibleElements, isPortraitOrientation, isValidRotation, isValidScrollMode, isValidSpreadMode, MAX_AUTO_SCALE, MAX_SCALE, MIN_SCALE, moveToEndOfArray, SCROLLBAR_PADDING, scrollIntoView, ScrollMode, SpreadMode, UNKNOWN_SCALE, VERTICAL_PADDING, watchScroll, } from "./ui_utils.js";
import { PDFRenderingQueue, RenderingStates } from "./pdf_rendering_queue.js";
import { AnnotationLayerBuilder } from "./annotation_layer_builder.js";
import { createPromiseCapability, PixelsPerInch } from "../pdf.ts-src/pdf.js";
import { PDFPageView } from "./pdf_page_view.js";
import { SimpleLinkService } from "./pdf_link_service.js";
import { TextLayerBuilder } from "./text_layer_builder.js";
import { version } from "../pdf.ts-src/display/api.js";
import { NullL10n } from "./l10n_utils.js";
import { XfaLayerBuilder } from "./xfa_layer_builder.js";
import { StructTreeLayerBuilder } from "./struct_tree_layer_builder.js";
import { html } from "../../lib/dom.js";
import { TextHighlighter } from "./text_highlighter.js";
/*81---------------------------------------------------------------------------*/
const DEFAULT_CACHE_SIZE = 10;
class PDFPageViewBuffer {
    push;
    resize;
    has;
    constructor(size) {
        const data = [];
        this.push = function (view) {
            const i = data.indexOf(view);
            if (i >= 0) {
                data.splice(i, 1);
            }
            data.push(view);
            if (data.length > size) {
                data.shift().destroy();
            }
        };
        /**
         * After calling resize, the size of the buffer will be newSize. The optional
         * parameter pagesToKeep is, if present, an array of pages to push to the back
         * of the buffer, delaying their destruction. The size of pagesToKeep has no
         * impact on the final size of the buffer; if pagesToKeep has length larger
         * than newSize, some of those pages will be destroyed anyway.
         */
        this.resize = function (newSize, pagesToKeep) {
            size = newSize;
            if (pagesToKeep) {
                const pageIdsToKeep = new Set();
                for (let i = 0, iMax = pagesToKeep.length; i < iMax; ++i) {
                    pageIdsToKeep.add(pagesToKeep[i].id);
                }
                moveToEndOfArray(data, page => pageIdsToKeep.has(page.id));
            }
            while (data.length > size) {
                data.shift().destroy();
            }
        };
        this.has = function (view) {
            return data.includes(view);
        };
    }
}
function isSameScale(oldScale, newScale) {
    if (newScale === oldScale)
        return true;
    if (Math.abs(newScale - oldScale) < 1e-15) {
        // Prevent unnecessary re-rendering of all pages when the scale
        // changes only because of limited numerical precision.
        return true;
    }
    return false;
}
/**
 * Simple viewer control to display PDF content/pages.
 */
export class BaseViewer {
    container;
    viewer;
    eventBus;
    linkService;
    downloadManager;
    findController;
    _scriptingManager;
    get enableScripting() { return !!this._scriptingManager; }
    removePageBorders;
    textLayerMode;
    _annotationMode;
    get renderForms() { return this._annotationMode === 2 /* ENABLE_FORMS */; }
    imageResourcesPath;
    enablePrintAutoRotate;
    renderer;
    useOnlyCssZoom;
    maxCanvasPixels;
    l10n;
    _mouseState;
    defaultRenderingQueue;
    renderingQueue;
    _doc;
    scroll;
    presentationModeState = 0 /* UNKNOWN */;
    _onBeforeDraw;
    _onAfterDraw;
    _pages;
    get pagesCount() { return this._pages.length; }
    getPageView(index) { return this._pages[index]; }
    _currentPageNumber;
    get currentPageNumber() { return this._currentPageNumber; }
    /**
     * @param val The page number.
     */
    set currentPageNumber(val) {
        if (!Number.isInteger(val)) {
            throw new Error("Invalid page number.");
        }
        if (!this.pdfDocument)
            return;
        // The intent can be to just reset a scroll position and/or scale.
        if (!this.setCurrentPageNumber$(val, /* resetCurrentPageView = */ true)) {
            console.error(`currentPageNumber: "${val}" is not a valid page.`);
        }
    }
    _currentScale;
    get currentScale() {
        return this._currentScale !== UNKNOWN_SCALE
            ? this._currentScale
            : DEFAULT_SCALE;
    }
    /**
     * @param val Scale of the pages in percents.
     */
    set currentScale(val) {
        if (isNaN(val)) {
            throw new Error("Invalid numeric scale.");
        }
        if (!this.pdfDocument)
            return;
        this._setScale(val, false);
    }
    #currentScaleValue = "";
    /** @final */
    get currentScaleValue() { return this.#currentScaleValue; }
    /**
     * @final
     * @param val The scale of the pages (in percent or predefined value).
     */
    set currentScaleValue(val) {
        if (!this.pdfDocument)
            return;
        this._setScale(val, false);
    }
    _pageLabels;
    /**
     * @return Returns the current page label, or `null` if no page labels exist.
     */
    get currentPageLabel() {
        return this._pageLabels?.[this._currentPageNumber - 1] ?? undefined;
    }
    /**
     * @param val The page label.
     */
    set currentPageLabel(val) {
        if (!this.pdfDocument)
            return;
        let page = +val | 0; // Fallback page number.
        if (this._pageLabels) {
            const i = this._pageLabels.indexOf(val);
            if (i >= 0) {
                page = i + 1;
            }
        }
        // The intent can be to just reset a scroll position and/or scale.
        if (!this.setCurrentPageNumber$(page, /* resetCurrentPageView = */ true)) {
            console.error(`currentPageLabel: "${val}" is not a valid page.`);
        }
    }
    _buffer;
    #location;
    _pagesRotation;
    get pagesRotation() { return this._pagesRotation; }
    _optionalContentConfigPromise;
    _pagesRequests;
    #firstPageCapability;
    get firstPagePromise() {
        return this.pdfDocument ? this.#firstPageCapability.promise : null;
    }
    #onePageRenderedCapability;
    get onePageRendered() {
        return this.pdfDocument ? this.#onePageRenderedCapability.promise : null;
    }
    #pagesCapability;
    get pagesPromise() {
        return this.pdfDocument ? this.#pagesCapability.promise : null;
    }
    _scrollMode;
    _previousScrollMode;
    _spreadMode;
    #scrollModePageState;
    pdfDocument;
    constructor(options) {
        // if (this.constructor === BaseViewer) {
        //   throw new Error("Cannot initialize BaseViewer.");
        // }
        const viewerVersion = 0;
        // const viewerVersion =
        //   typeof PDFJSDev !== "undefined" ? PDFJSDev.eval("BUNDLE_VERSION") : null;
        if (version !== viewerVersion) {
            throw new Error(`The API version "${version}" does not match the Viewer version "${viewerVersion}".`);
        }
        this.container = options.container;
        this.viewer = options.viewer || options.container.firstElementChild;
        if (!(this.container?.tagName.toUpperCase() === "DIV"
            && this.viewer?.tagName.toUpperCase() === "DIV")) {
            throw new Error("Invalid `container` and/or `viewer` option.");
        }
        if (this.container.offsetParent
            && getComputedStyle(this.container).position !== "absolute") {
            throw new Error("The `container` must be absolutely positioned.");
        }
        this.eventBus = options.eventBus;
        this.linkService = options.linkService || new SimpleLinkService();
        this.downloadManager = options.downloadManager;
        this.findController = options.findController;
        this._scriptingManager = options.scriptingManager || null;
        this.removePageBorders = options.removePageBorders || false;
        this.textLayerMode = options.textLayerMode ?? 1 /* ENABLE */;
        this._annotationMode =
            options.annotationMode ?? 2 /* ENABLE_FORMS */;
        this.imageResourcesPath = options.imageResourcesPath || "";
        this.enablePrintAutoRotate = options.enablePrintAutoRotate || false;
        this.renderer = options.renderer ?? "canvas" /* CANVAS */;
        this.useOnlyCssZoom = options.useOnlyCssZoom || false;
        this.maxCanvasPixels = options.maxCanvasPixels;
        this.l10n = options.l10n || NullL10n;
        this.defaultRenderingQueue = !options.renderingQueue;
        if (this.defaultRenderingQueue) {
            // Custom rendering queue is not specified, using default one
            this.renderingQueue = new PDFRenderingQueue();
            this.renderingQueue.setViewer(this);
        }
        else {
            this.renderingQueue = options.renderingQueue;
        }
        this._doc = document.documentElement;
        this.scroll = watchScroll(this.container, this._scrollUpdate.bind(this));
        // this.presentationModeState = PresentationModeState.UNKNOWN;
        // this._onBeforeDraw = this._onAfterDraw = null;
        this._resetView();
        if (this.removePageBorders) {
            this.viewer.classList.add("removePageBorders");
        }
        // Defer the dispatching of this event, to give other viewer components
        // time to initialize *and* register 'baseviewerinit' event listeners.
        Promise.resolve().then(() => {
            this.eventBus.dispatch("baseviewerinit", { source: this });
        });
    }
    /**
     * @return True if all {PDFPageView} objects are initialized.
     */
    get pageViewsReady() {
        if (!this.#pagesCapability.settled)
            return false;
        // Prevent printing errors when 'disableAutoFetch' is set, by ensuring
        // that *all* pages have in fact been completely loaded.
        return this._pages.every(pageView => pageView?.pdfPage);
    }
    /**
     * @return Whether the pageNumber is valid (within bounds).
     */
    setCurrentPageNumber$(val, resetCurrentPageView = false) {
        if (this._currentPageNumber === val) {
            if (resetCurrentPageView) {
                this.#resetCurrentPageView();
            }
            return true;
        }
        if (!(0 < val && val <= this.pagesCount))
            return false;
        const previous = this._currentPageNumber;
        this._currentPageNumber = val;
        this.eventBus.dispatch("pagechanging", {
            source: this,
            pageNumber: val,
            pageLabel: this._pageLabels?.[val - 1] ?? undefined,
            previous,
        });
        if (resetCurrentPageView) {
            this.#resetCurrentPageView();
        }
        return true;
    }
    /**
     * @param rotation The rotation of the pages (0, 90, 180, 270).
     */
    set pagesRotation(rotation) {
        if (!isValidRotation(rotation)) {
            throw new Error("Invalid pages rotation angle.");
        }
        if (!this.pdfDocument)
            return;
        // Normalize the rotation, by clamping it to the [0, 360) range.
        rotation %= 360;
        if (rotation < 0) {
            rotation += 360;
        }
        if (this._pagesRotation === rotation) {
            return; // The rotation didn't change.
        }
        this._pagesRotation = rotation;
        const pageNumber = this._currentPageNumber;
        const updateArgs = { rotation };
        for (const pageView of this._pages) {
            pageView.update(updateArgs);
        }
        // Prevent errors in case the rotation changes *before* the scale has been
        // set to a non-default value.
        if (this.#currentScaleValue) {
            this._setScale(this.#currentScaleValue, true);
        }
        this.eventBus.dispatch("rotationchanging", {
            source: this,
            pagesRotation: rotation,
            pageNumber,
        });
        if (this.defaultRenderingQueue) {
            this.update();
        }
    }
    #onePageRenderedOrForceFetch() {
        // Unless the viewer *and* its pages are visible, rendering won't start and
        // `this.#onePageRenderedCapability` thus won't be resolved.
        // To ensure that automatic printing, on document load, still works even in
        // those cases we force-allow fetching of all pages when:
        //  - The viewer is hidden in the DOM, e.g. in a `display: none` <iframe>
        //    element; fixes bug 1618621.
        //  - The viewer is visible, but none of the pages are (e.g. if the
        //    viewer is very small); fixes bug 1618955.
        if (!this.container.offsetParent
            || this.getVisiblePages$().views.length === 0) {
            return Promise.resolve();
        }
        return this.#onePageRenderedCapability.promise;
    }
    /** @final */
    setDocument(pdfDocument) {
        if (this.pdfDocument) {
            this.eventBus.dispatch("pagesdestroy", { source: this });
            this._cancelRendering();
            this._resetView();
            if (this.findController) {
                this.findController.setDocument();
            }
            if (this._scriptingManager) {
                this._scriptingManager.setDocument();
            }
        }
        this.pdfDocument = pdfDocument;
        if (!pdfDocument)
            return;
        const isPureXfa = pdfDocument.isPureXfa;
        const pagesCount = pdfDocument.numPages;
        const firstPagePromise = pdfDocument.getPage(1);
        // Rendering (potentially) depends on this, hence fetching it immediately.
        const optionalContentConfigPromise = pdfDocument.getOptionalContentConfig();
        this.#pagesCapability.promise.then(() => {
            this.eventBus.dispatch("pagesloaded", {
                source: this,
                pagesCount,
            });
        });
        this._onBeforeDraw = (evt) => {
            const pageView = this._pages[evt.pageNumber - 1];
            if (!pageView)
                return;
            // Add the page to the buffer at the start of drawing. That way it can be
            // evicted from the buffer and destroyed even if we pause its rendering.
            this._buffer.push(pageView);
        };
        this.eventBus._on("pagerender", this._onBeforeDraw);
        this._onAfterDraw = (evt) => {
            if (evt.cssTransform || this.#onePageRenderedCapability.settled)
                return;
            this.#onePageRenderedCapability.resolve();
            this.eventBus._off("pagerendered", this._onAfterDraw);
            this._onAfterDraw = undefined;
        };
        this.eventBus._on("pagerendered", this._onAfterDraw);
        // Fetch a single page so we can get a viewport that will be the default
        // viewport for all pages
        firstPagePromise
            .then(firstPdfPage => {
            this.#firstPageCapability.resolve(firstPdfPage);
            this._optionalContentConfigPromise = optionalContentConfigPromise;
            const viewerElement = this._scrollMode === ScrollMode.PAGE ? undefined : this.viewer;
            const scale = this.currentScale;
            const viewport = firstPdfPage.getViewport({
                scale: scale * PixelsPerInch.PDF_TO_CSS_UNITS,
            });
            const textLayerFactory = this.textLayerMode !== 0 /* DISABLE */ && !isPureXfa
                ? this
                : undefined;
            const annotationLayerFactory = this._annotationMode !== 0 /* DISABLE */ ? this : undefined;
            const xfaLayerFactory = isPureXfa ? this : undefined;
            for (let pageNum = 1; pageNum <= pagesCount; ++pageNum) {
                const pageView = new PDFPageView({
                    container: viewerElement,
                    eventBus: this.eventBus,
                    id: pageNum,
                    scale,
                    defaultViewport: viewport.clone(),
                    optionalContentConfigPromise,
                    renderingQueue: this.renderingQueue,
                    textLayerFactory,
                    textLayerMode: this.textLayerMode,
                    annotationLayerFactory,
                    annotationMode: this._annotationMode,
                    xfaLayerFactory,
                    textHighlighterFactory: this,
                    structTreeLayerFactory: this,
                    imageResourcesPath: this.imageResourcesPath,
                    renderer: this.renderer,
                    useOnlyCssZoom: this.useOnlyCssZoom,
                    maxCanvasPixels: this.maxCanvasPixels,
                    l10n: this.l10n,
                });
                this._pages.push(pageView);
            }
            // Set the first `pdfPage` immediately, since it's already loaded,
            // rather than having to repeat the `PDFDocumentProxy.getPage` call in
            // the `this.#ensurePdfPageLoaded` method before rendering can start.
            const firstPageView = this._pages[0];
            if (firstPageView) {
                firstPageView.setPdfPage(firstPdfPage);
                this.linkService.cachePageRef(1, firstPdfPage.ref);
            }
            if (this._scrollMode === ScrollMode.PAGE) {
                // Since the pages are placed in a `DocumentFragment`, ensure that
                // the current page becomes visible upon loading of the document.
                this._ensurePageViewVisible();
            }
            else if (this._spreadMode !== SpreadMode.NONE) {
                this._updateSpreadMode();
            }
            // Fetch all the pages since the viewport is needed before printing
            // starts to create the correct size canvas. Wait until one page is
            // rendered so we don't tie up too many resources early on.
            this.#onePageRenderedOrForceFetch().then(() => {
                if (this.findController) {
                    this.findController.setDocument(pdfDocument); // Enable searching.
                }
                if (this._scriptingManager) {
                    this._scriptingManager.setDocument(pdfDocument); // Enable scripting.
                }
                // In addition to 'disableAutoFetch' being set, also attempt to reduce
                // resource usage when loading *very* long/large documents.
                if (pdfDocument.loadingParams.disableAutoFetch || pagesCount > 7500) {
                    // XXX: Printing is semi-broken with auto fetch disabled.
                    this.#pagesCapability.resolve();
                    return;
                }
                let getPagesLeft = pagesCount - 1; // The first page was already loaded.
                if (getPagesLeft <= 0) {
                    this.#pagesCapability.resolve();
                    return;
                }
                for (let pageNum = 2; pageNum <= pagesCount; ++pageNum) {
                    pdfDocument.getPage(pageNum).then(pdfPage => {
                        const pageView = this._pages[pageNum - 1];
                        if (!pageView.pdfPage) {
                            pageView.setPdfPage(pdfPage);
                        }
                        this.linkService.cachePageRef(pageNum, pdfPage.ref);
                        if (--getPagesLeft === 0) {
                            this.#pagesCapability.resolve();
                        }
                    }, reason => {
                        console.error(`Unable to get page ${pageNum} to initialize viewer`, reason);
                        if (--getPagesLeft === 0) {
                            this.#pagesCapability.resolve();
                        }
                    });
                }
            });
            this.eventBus.dispatch("pagesinit", { source: this });
            if (this.defaultRenderingQueue) {
                this.update();
            }
        })
            .catch(reason => {
            console.error("Unable to initialize viewer", reason);
        });
    }
    setPageLabels(labels) {
        if (!this.pdfDocument)
            return;
        if (!labels) {
            this._pageLabels = undefined;
        }
        else if (!(Array.isArray(labels) && this.pdfDocument.numPages === labels.length)) {
            this._pageLabels = undefined;
            console.error(`setPageLabels: Invalid page labels.`);
        }
        else {
            this._pageLabels = labels;
        }
        // Update all the `PDFPageView` instances.
        for (let i = 0, ii = this._pages.length; i < ii; i++) {
            this._pages[i].setPageLabel(this._pageLabels?.[i] ?? undefined);
        }
    }
    _resetView() {
        this._pages = [];
        this._currentPageNumber = 1;
        this._currentScale = UNKNOWN_SCALE;
        this.#currentScaleValue = "";
        this._pageLabels = undefined;
        this._buffer = new PDFPageViewBuffer(DEFAULT_CACHE_SIZE);
        this.#location = undefined;
        this._pagesRotation = 0;
        this._optionalContentConfigPromise = undefined;
        this._pagesRequests = new WeakMap();
        this.#firstPageCapability = createPromiseCapability();
        this.#onePageRenderedCapability = createPromiseCapability();
        this.#pagesCapability = createPromiseCapability();
        this._scrollMode = ScrollMode.VERTICAL;
        this._previousScrollMode = ScrollMode.UNKNOWN;
        this._spreadMode = SpreadMode.NONE;
        this.#scrollModePageState = {
            previousPageNumber: 1,
            scrollDown: true,
            pages: [],
        };
        if (this._onBeforeDraw) {
            this.eventBus._off("pagerender", this._onBeforeDraw);
            this._onBeforeDraw = undefined;
        }
        if (this._onAfterDraw) {
            this.eventBus._off("pagerendered", this._onAfterDraw);
            this._onAfterDraw = undefined;
        }
        // Remove the pages from the DOM...
        this.viewer.textContent = "";
        // ... and reset the Scroll mode CSS class(es) afterwards.
        this._updateScrollMode();
    }
    _ensurePageViewVisible() {
        if (this._scrollMode !== ScrollMode.PAGE) {
            throw new Error("_ensurePageViewVisible: Invalid scrollMode value.");
        }
        const pageNumber = this._currentPageNumber, state = this.#scrollModePageState, viewer = this.viewer;
        // Temporarily remove all the pages from the DOM...
        viewer.textContent = "";
        // ... and clear out the active ones.
        state.pages.length = 0;
        if (this._spreadMode === SpreadMode.NONE) {
            // Finally, append the new page to the viewer.
            const pageView = this._pages[pageNumber - 1];
            viewer.appendChild(pageView.div);
            state.pages.push(pageView);
        }
        else {
            const pageIndexSet = new Set(), parity = this._spreadMode - 1;
            // Determine the pageIndices in the new spread.
            if (pageNumber % 2 !== parity) {
                // Left-hand side page.
                pageIndexSet.add(pageNumber - 1);
                pageIndexSet.add(pageNumber);
            }
            else {
                // Right-hand side page.
                pageIndexSet.add(pageNumber - 2);
                pageIndexSet.add(pageNumber - 1);
            }
            // Finally, append the new pages to the viewer and apply the spreadMode.
            let spread = null;
            for (let i = 0, ii = this._pages.length; i < ii; ++i) {
                if (!pageIndexSet.has(i)) {
                    continue;
                }
                if (spread === null) {
                    spread = document.createElement("div");
                    spread.className = "spread";
                    viewer.appendChild(spread);
                }
                else if (i % 2 === parity) {
                    spread = spread.cloneNode(false);
                    viewer.appendChild(spread);
                }
                const pageView = this._pages[i];
                spread.appendChild(pageView.div);
                state.pages.push(pageView);
            }
        }
        state.scrollDown = pageNumber >= state.previousPageNumber;
        state.previousPageNumber = pageNumber;
    }
    _scrollUpdate() {
        if (this.pagesCount === 0)
            return;
        this.update();
    }
    _scrollIntoView({ pageDiv, pageSpot }, pageNumber) {
        if (this._scrollMode === ScrollMode.PAGE) {
            if (pageNumber) {
                // Ensure that `this._currentPageNumber` is correct.
                this.setCurrentPageNumber$(pageNumber);
            }
            this._ensurePageViewVisible();
            // Ensure that rendering always occurs, to avoid showing a blank page,
            // even if the current position doesn't change when the page is scrolled.
            this.update();
        }
        if (!pageSpot && !this.isInPresentationMode) {
            const left = pageDiv.offsetLeft + pageDiv.clientLeft;
            const right = left + pageDiv.clientWidth;
            const { scrollLeft, clientWidth } = this.container;
            if (this._scrollMode === ScrollMode.HORIZONTAL
                || left < scrollLeft
                || right > scrollLeft + clientWidth) {
                pageSpot = { left: 0, top: 0 };
            }
        }
        scrollIntoView(pageDiv, pageSpot);
    }
    #setScaleUpdatePages(newScale, newValue, noScroll = false, preset = false) {
        this.#currentScaleValue = newValue.toString();
        if (isSameScale(this._currentScale, newScale)) {
            if (preset) {
                this.eventBus.dispatch("scalechanging", {
                    source: this,
                    scale: newScale,
                    presetValue: newValue,
                });
            }
            return;
        }
        this._doc.style.setProperty("--zoom-factor", newScale);
        const updateArgs = { scale: newScale };
        for (const pageView of this._pages) {
            pageView.update(updateArgs);
        }
        this._currentScale = newScale;
        if (!noScroll) {
            let page = this._currentPageNumber;
            let dest;
            if (this.#location
                && !(this.isInPresentationMode || this.isChangingPresentationMode)) {
                page = this.#location.pageNumber;
                dest = [
                    null,
                    { name: "XYZ" },
                    this.#location.left,
                    this.#location.top,
                    null,
                ];
            }
            this.scrollPageIntoView({
                pageNumber: page,
                destArray: dest,
                allowNegativeOffset: true,
            });
        }
        this.eventBus.dispatch("scalechanging", {
            source: this,
            scale: newScale,
            presetValue: preset ? newValue : undefined,
        });
        if (this.defaultRenderingQueue) {
            this.update();
        }
    }
    get _pageWidthScaleFactor() {
        if (this._spreadMode !== SpreadMode.NONE
            && this._scrollMode !== ScrollMode.HORIZONTAL) {
            return 2;
        }
        return 1;
    }
    _setScale(value, noScroll = false) {
        let scale = parseFloat(value);
        if (scale > 0) {
            this.#setScaleUpdatePages(scale, value, noScroll, /* preset = */ false);
        }
        else {
            const currentPage = this._pages[this._currentPageNumber - 1];
            if (!currentPage)
                return;
            const noPadding = this.isInPresentationMode || this.removePageBorders;
            let hPadding = noPadding ? 0 : SCROLLBAR_PADDING;
            let vPadding = noPadding ? 0 : VERTICAL_PADDING;
            if (!noPadding && this._scrollMode === ScrollMode.HORIZONTAL) {
                [hPadding, vPadding] = [vPadding, hPadding]; // Swap the padding values.
            }
            const pageWidthScale = (((this.container.clientWidth - hPadding) / currentPage.width) * currentPage.scale)
                / this._pageWidthScaleFactor;
            const pageHeightScale = ((this.container.clientHeight - vPadding) / currentPage.height) *
                currentPage.scale;
            switch (value) {
                case "page-actual":
                    scale = 1;
                    break;
                case "page-width":
                    scale = pageWidthScale;
                    break;
                case "page-height":
                    scale = pageHeightScale;
                    break;
                case "page-fit":
                    scale = Math.min(pageWidthScale, pageHeightScale);
                    break;
                case "auto":
                    // For pages in landscape mode, fit the page height to the viewer
                    // *unless* the page would thus become too wide to fit horizontally.
                    const horizontalScale = isPortraitOrientation(currentPage)
                        ? pageWidthScale
                        : Math.min(pageHeightScale, pageWidthScale);
                    scale = Math.min(MAX_AUTO_SCALE, horizontalScale);
                    break;
                default:
                    console.error(`_setScale: "${value}" is an unknown zoom value.`);
                    return;
            }
            this.#setScaleUpdatePages(scale, value, noScroll, /* preset = */ true);
        }
    }
    /**
     * Refreshes page view: scrolls to the current page and updates the scale.
     */
    #resetCurrentPageView() {
        if (this.isInPresentationMode) {
            // Fixes the case when PDF has different page sizes.
            this._setScale(this.#currentScaleValue, true);
        }
        const pageView = this._pages[this._currentPageNumber - 1];
        this._scrollIntoView({ pageDiv: pageView.div });
    }
    /**
     * @return The page number corresponding to the page label,
     *   or `null` when no page labels exist and/or the input is invalid.
     */
    pageLabelToPageNumber(label) {
        if (!this._pageLabels)
            return null;
        const i = this._pageLabels.indexOf(label);
        if (i < 0)
            return null;
        return i + 1;
    }
    /**
     * Scrolls page into view.
     */
    scrollPageIntoView({ pageNumber, destArray, allowNegativeOffset = false, ignoreDestinationZoom = false, }) {
        if (!this.pdfDocument)
            return;
        const pageView = Number.isInteger(pageNumber) && this._pages[pageNumber - 1];
        if (!pageView) {
            console.error(`scrollPageIntoView: "${pageNumber}" is not a valid pageNumber parameter.`);
            return;
        }
        if (this.isInPresentationMode || !destArray) {
            this.setCurrentPageNumber$(pageNumber, /* resetCurrentPageView = */ true);
            return;
        }
        let x = 0, y = 0;
        let width = 0, height = 0, widthScale, heightScale;
        const changeOrientation = pageView.rotation % 180 !== 0;
        const pageWidth = (changeOrientation ? pageView.height : pageView.width) /
            pageView.scale /
            PixelsPerInch.PDF_TO_CSS_UNITS;
        const pageHeight = (changeOrientation ? pageView.width : pageView.height) /
            pageView.scale /
            PixelsPerInch.PDF_TO_CSS_UNITS;
        let scale = 0;
        switch (destArray[1].name) {
            case "XYZ":
                x = destArray[2];
                y = destArray[3];
                scale = destArray[4];
                // If x and/or y coordinates are not supplied, default to
                // _top_ left of the page (not the obvious bottom left,
                // since aligning the bottom of the intended page with the
                // top of the window is rarely helpful).
                x = x !== null ? x : 0;
                y = y !== null ? y : pageHeight;
                break;
            case "Fit":
            case "FitB":
                scale = "page-fit";
                break;
            case "FitH":
            case "FitBH":
                y = destArray[2];
                scale = "page-width";
                // According to the PDF spec, section 12.3.2.2, a `null` value in the
                // parameter should maintain the position relative to the new page.
                if (y === null && this.#location) {
                    x = this.#location.left;
                    y = this.#location.top;
                }
                else if (typeof y !== "number") {
                    // The "top" value isn't optional, according to the spec, however some
                    // bad PDF generators will pretend that it is (fixes bug 1663390).
                    y = pageHeight;
                }
                break;
            case "FitV":
            case "FitBV":
                x = destArray[2];
                width = pageWidth;
                height = pageHeight;
                scale = "page-height";
                break;
            case "FitR":
                x = destArray[2];
                y = destArray[3];
                width = destArray[4] - x;
                height = destArray[5] - y;
                const hPadding = this.removePageBorders ? 0 : SCROLLBAR_PADDING;
                const vPadding = this.removePageBorders ? 0 : VERTICAL_PADDING;
                widthScale =
                    (this.container.clientWidth - hPadding) /
                        width /
                        PixelsPerInch.PDF_TO_CSS_UNITS;
                heightScale =
                    (this.container.clientHeight - vPadding) /
                        height /
                        PixelsPerInch.PDF_TO_CSS_UNITS;
                scale = Math.min(Math.abs(widthScale), Math.abs(heightScale));
                break;
            default:
                console.error(`scrollPageIntoView: "${destArray[1].name}" is not a valid destination type.`);
                return;
        }
        if (!ignoreDestinationZoom) {
            if (scale && scale !== this._currentScale) {
                this.currentScaleValue = scale;
            }
            else if (this._currentScale === UNKNOWN_SCALE) {
                this.currentScaleValue = DEFAULT_SCALE_VALUE;
            }
        }
        if (scale === "page-fit" && !destArray[4]) {
            this._scrollIntoView({
                pageDiv: pageView.div,
                pageNumber,
            });
            return;
        }
        const boundingRect = [
            pageView.viewport.convertToViewportPoint(x, y),
            pageView.viewport.convertToViewportPoint(x + width, y + height),
        ];
        let left = Math.min(boundingRect[0][0], boundingRect[1][0]);
        let top = Math.min(boundingRect[0][1], boundingRect[1][1]);
        if (!allowNegativeOffset) {
            // Some bad PDF generators will create destinations with e.g. top values
            // that exceeds the page height. Ensure that offsets are not negative,
            // to prevent a previous page from becoming visible (fixes bug 874482).
            left = Math.max(left, 0);
            top = Math.max(top, 0);
        }
        this._scrollIntoView({
            pageDiv: pageView.div,
            pageSpot: { left, top },
            pageNumber,
        });
    }
    #updateLocation(firstPage) {
        const currentScale = this._currentScale;
        const currentScaleValue = this.#currentScaleValue;
        const normalizedScaleValue = parseFloat(currentScaleValue) === currentScale
            ? Math.round(currentScale * 10000) / 100
            : currentScaleValue;
        const pageNumber = firstPage.id;
        let pdfOpenParams = "#page=" + pageNumber;
        pdfOpenParams += "&zoom=" + normalizedScaleValue;
        const currentPageView = this._pages[pageNumber - 1];
        const container = this.container;
        const topLeft = currentPageView.getPagePoint(container.scrollLeft - firstPage.x, container.scrollTop - firstPage.y);
        const intLeft = Math.round(topLeft[0]);
        const intTop = Math.round(topLeft[1]);
        pdfOpenParams += "," + intLeft + "," + intTop;
        this.#location = {
            pageNumber,
            scale: normalizedScaleValue,
            top: intTop,
            left: intLeft,
            rotation: this._pagesRotation,
            pdfOpenParams,
        };
    }
    /** @final */
    update() {
        const visible = this.getVisiblePages$();
        const visiblePages = visible.views, numVisiblePages = visiblePages.length;
        if (numVisiblePages === 0)
            return;
        const newCacheSize = Math.max(DEFAULT_CACHE_SIZE, 2 * numVisiblePages + 1);
        this._buffer.resize(newCacheSize, visiblePages);
        this.renderingQueue.renderHighestPriority(visible);
        if (!this.isInPresentationMode) {
            const isSimpleLayout = this._spreadMode === SpreadMode.NONE &&
                (this._scrollMode === ScrollMode.PAGE ||
                    this._scrollMode === ScrollMode.VERTICAL);
            let currentId = this._currentPageNumber;
            let stillFullyVisible = false;
            for (const page of visiblePages) {
                if (page.percent < 100)
                    break;
                if (page.id === currentId && isSimpleLayout) {
                    stillFullyVisible = true;
                    break;
                }
            }
            if (!stillFullyVisible) {
                currentId = visiblePages[0].id;
            }
            this.setCurrentPageNumber$(currentId);
        }
        this.#updateLocation(visible.first);
        this.eventBus.dispatch("updateviewarea", {
            source: this,
            location: this.#location,
        });
    }
    containsElement(element) {
        return this.container.contains(element);
    }
    focus() { this.container.focus(); }
    get _isContainerRtl() {
        return getComputedStyle(this.container).direction === "rtl";
    }
    get isInPresentationMode() {
        return this.presentationModeState === 3 /* FULLSCREEN */;
    }
    get isChangingPresentationMode() {
        return this.presentationModeState === 2 /* CHANGING */;
    }
    get isHorizontalScrollbarEnabled() {
        return this.isInPresentationMode
            ? false
            : this.container.scrollWidth > this.container.clientWidth;
    }
    get isVerticalScrollbarEnabled() {
        return this.isInPresentationMode
            ? false
            : this.container.scrollHeight > this.container.clientHeight;
    }
    /**
     * Helper method for `this.getVisiblePages$`. Should only ever be used when
     * the viewer can only display a single page at a time, for example:
     *  - When PresentationMode is active.
     */
    getCurrentVisiblePage$() {
        if (!this.pagesCount)
            return { views: [] };
        const pageView = this._pages[this._currentPageNumber - 1];
        // NOTE: Compute the `x` and `y` properties of the current view,
        // since `this.#updateLocation` depends of them being available.
        const element = pageView.div;
        const view = {
            id: pageView.id,
            x: element.offsetLeft + element.clientLeft,
            y: element.offsetTop + element.clientTop,
            view: pageView,
        };
        return { first: view, last: view, views: [view] };
    }
    getVisiblePages$() {
        if (this.isInPresentationMode) {
            // The algorithm in `getVisibleElements` doesn't work in all browsers and
            // configurations (e.g. Chrome) when PresentationMode is active.
            return this.getCurrentVisiblePage$();
        }
        const views = this._scrollMode === ScrollMode.PAGE
            ? this.#scrollModePageState.pages
            : this._pages, horizontal = this._scrollMode === ScrollMode.HORIZONTAL, rtl = horizontal && this._isContainerRtl;
        return getVisibleElements({
            scrollEl: this.container,
            views,
            sortByVisibility: true,
            horizontal,
            rtl,
        });
    }
    isPageVisible(pageNumber) {
        if (!this.pdfDocument)
            return false;
        if (!(Number.isInteger(pageNumber)
            && pageNumber > 0
            && pageNumber <= this.pagesCount)) {
            console.error(`isPageVisible: "${pageNumber}" is not a valid page.`);
            return false;
        }
        return this.getVisiblePages$().views.some(view => view.id === pageNumber);
    }
    isPageCached(pageNumber) {
        if (!this.pdfDocument || !this._buffer)
            return false;
        if (!(Number.isInteger(pageNumber)
            && pageNumber > 0
            && pageNumber <= this.pagesCount)) {
            console.error(`isPageCached: "${pageNumber}" is not a valid page.`);
            return false;
        }
        const pageView = this._pages[pageNumber - 1];
        if (!pageView)
            return false;
        return this._buffer.has(pageView);
    }
    cleanup() {
        for (let i = 0, ii = this._pages.length; i < ii; i++) {
            if (this._pages[i] &&
                this._pages[i].renderingState !== RenderingStates.FINISHED) {
                this._pages[i].reset();
            }
        }
    }
    _cancelRendering() {
        for (let i = 0, ii = this._pages.length; i < ii; i++) {
            if (this._pages[i]) {
                this._pages[i].cancelRendering();
            }
        }
    }
    /**
     * @return Returns a promise containing a {PDFPageProxy} object.
     */
    #ensurePdfPageLoaded(pageView) {
        if (pageView.pdfPage) {
            return Promise.resolve(pageView.pdfPage);
        }
        if (this._pagesRequests.has(pageView)) {
            return this._pagesRequests.get(pageView);
        }
        const promise = this.pdfDocument
            .getPage(pageView.id)
            .then(pdfPage => {
            if (!pageView.pdfPage) {
                pageView.setPdfPage(pdfPage);
            }
            this._pagesRequests.delete(pageView);
            return pdfPage;
        })
            .catch(reason => {
            console.error("Unable to get page for page view", reason);
            // Page error -- there is nothing that can be done.
            this._pagesRequests.delete(pageView);
        });
        this._pagesRequests.set(pageView, promise);
        return promise;
    }
    #scrollAhead(visible) {
        if (visible.first?.id === 1)
            return true;
        else if (visible.last?.id === this.pagesCount)
            return false;
        switch (this._scrollMode) {
            case ScrollMode.PAGE: return this.#scrollModePageState.scrollDown;
            case ScrollMode.HORIZONTAL: return this.scroll.right;
        }
        return this.scroll.down;
    }
    forceRendering(currentlyVisiblePages) {
        const visiblePages = currentlyVisiblePages || this.getVisiblePages$();
        const scrollAhead = this.#scrollAhead(visiblePages);
        const preRenderExtra = this._spreadMode !== SpreadMode.NONE &&
            this._scrollMode !== ScrollMode.HORIZONTAL;
        const pageView = this.renderingQueue.getHighestPriority(visiblePages, this._pages, scrollAhead, preRenderExtra);
        if (pageView) {
            this.#ensurePdfPageLoaded(pageView).then(() => {
                this.renderingQueue.renderView(pageView);
            });
            return true;
        }
        return false;
    }
    /** @implements */
    createTextLayerBuilder(textLayerDiv, pageIndex, viewport, enhanceTextSelection = false, eventBus, highlighter) {
        return new TextLayerBuilder({
            textLayerDiv,
            eventBus,
            pageIndex,
            viewport,
            highlighter,
            enhanceTextSelection: this.isInPresentationMode
                ? false
                : enhanceTextSelection,
        });
    }
    createTextHighlighter(pageIndex, eventBus) {
        return new TextHighlighter({
            eventBus,
            pageIndex,
            findController: this.isInPresentationMode ? undefined : this.findController,
        });
    }
    /**
     * @implements
     * @param imageResourcesPath Path for image resources, mainly
     *   for annotation icons. Include trailing slash.
     */
    createAnnotationLayerBuilder(pageDiv, pdfPage, annotationStorage, imageResourcesPath = "", renderForms = true, l10n = NullL10n, enableScripting, hasJSActionsPromise, mouseState, fieldObjectsPromise) {
        return new AnnotationLayerBuilder({
            pageDiv,
            pdfPage,
            annotationStorage: annotationStorage || this.pdfDocument?.annotationStorage,
            imageResourcesPath,
            renderForms,
            linkService: this.linkService,
            downloadManager: this.downloadManager,
            l10n,
            enableScripting: enableScripting ?? this.enableScripting,
            hasJSActionsPromise: hasJSActionsPromise || this.pdfDocument?.hasJSActions(),
            fieldObjectsPromise: fieldObjectsPromise || this.pdfDocument?.getFieldObjects(),
            mouseState: mouseState || this._scriptingManager?.mouseState,
        });
    }
    /**
     * @param annotationStorage Storage for annotation data in forms.
     */
    createXfaLayerBuilder(pageDiv, pdfPage, annotationStorage) {
        return new XfaLayerBuilder({
            pageDiv,
            pdfPage,
            annotationStorage: annotationStorage || this.pdfDocument?.annotationStorage,
            linkService: this.linkService,
        });
    }
    /** @implements */
    createStructTreeLayerBuilder(pdfPage) {
        return new StructTreeLayerBuilder({
            pdfPage,
        });
    }
    /**
     * @return Whether all pages of the PDF document have identical
     *   widths and heights.
     */
    get hasEqualPageSizes() {
        const firstPageView = this._pages[0];
        for (let i = 1, ii = this._pages.length; i < ii; ++i) {
            const pageView = this._pages[i];
            if (pageView.width !== firstPageView.width ||
                pageView.height !== firstPageView.height) {
                return false;
            }
        }
        return true;
    }
    /**
     * Returns sizes of the pages.
     * @return Array of objects with width/height/rotation fields.
     */
    getPagesOverview() {
        return this._pages.map(pageView => {
            const viewport = pageView.pdfPage.getViewport({ scale: 1 });
            if (!this.enablePrintAutoRotate || isPortraitOrientation(viewport)) {
                return {
                    width: viewport.width,
                    height: viewport.height,
                    rotation: viewport.rotation,
                };
            }
            // Landscape orientation.
            return {
                width: viewport.height,
                height: viewport.width,
                rotation: (viewport.rotation - 90) % 360,
            };
        });
    }
    get optionalContentConfigPromise() {
        if (!this.pdfDocument) {
            return Promise.resolve(undefined);
        }
        if (!this._optionalContentConfigPromise) {
            // Prevent issues if the getter is accessed *before* the `onePageRendered`
            // promise has resolved; won't (normally) happen in the default viewer.
            return this.pdfDocument.getOptionalContentConfig();
        }
        return this._optionalContentConfigPromise;
    }
    /**
     * @param promise A promise that is
     *   resolved with an {@link OptionalContentConfig} instance.
     */
    set optionalContentConfigPromise(promise) {
        if (!(promise instanceof Promise)) {
            throw new Error(`Invalid optionalContentConfigPromise: ${promise}`);
        }
        if (!this.pdfDocument)
            return;
        if (!this._optionalContentConfigPromise) {
            // Ignore the setter *before* the `onePageRendered` promise has resolved,
            // since it'll be overwritten anyway; won't happen in the default viewer.
            return;
        }
        this._optionalContentConfigPromise = promise;
        const updateArgs = { optionalContentConfigPromise: promise };
        for (const pageView of this._pages) {
            pageView.update(updateArgs);
        }
        this.update();
        this.eventBus.dispatch("optionalcontentconfigchanged", {
            source: this,
            promise,
        });
    }
    /**
     * @return One of the values in {ScrollMode}.
     */
    get scrollMode() { return this._scrollMode; }
    /**
     * @param mode The direction in which the document pages should be
     *   laid out within the scrolling container.
     *   The constants from {ScrollMode} should be used.
     */
    set scrollMode(mode) {
        // The Scroll mode didn't change.
        if (this._scrollMode === mode)
            return;
        if (!isValidScrollMode(mode)) {
            throw new Error(`Invalid scroll mode: ${mode}`);
        }
        this._previousScrollMode = this._scrollMode;
        this._scrollMode = mode;
        this.eventBus.dispatch("scrollmodechanged", { source: this, mode });
        this._updateScrollMode(/* pageNumber = */ this._currentPageNumber);
    }
    _updateScrollMode(pageNumber) {
        const scrollMode = this._scrollMode, viewer = this.viewer;
        viewer.classList.toggle("scrollHorizontal", scrollMode === ScrollMode.HORIZONTAL);
        viewer.classList.toggle("scrollWrapped", scrollMode === ScrollMode.WRAPPED);
        if (!this.pdfDocument || !pageNumber)
            return;
        if (scrollMode === ScrollMode.PAGE) {
            this._ensurePageViewVisible();
        }
        else if (this._previousScrollMode === ScrollMode.PAGE) {
            // Ensure that the current spreadMode is still applied correctly when
            // the *previous* scrollMode was `ScrollMode.PAGE`.
            this._updateSpreadMode();
        }
        // Non-numeric scale values can be sensitive to the scroll orientation.
        // Call this before re-scrolling to the current page, to ensure that any
        // changes in scale don't move the current page.
        if (this.#currentScaleValue && isNaN(this.#currentScaleValue)) {
            this._setScale(this.#currentScaleValue, true);
        }
        this.setCurrentPageNumber$(pageNumber, /* resetCurrentPageView = */ true);
        this.update();
    }
    /**
     * @return One of the values in {SpreadMode}.
     */
    get spreadMode() { return this._spreadMode; }
    /**
     * @param mode - Group the pages in spreads, starting with odd- or
     *   even-number pages (unless `SpreadMode.NONE` is used).
     *   The constants from {SpreadMode} should be used.
     */
    set spreadMode(mode) {
        // The Spread mode didn't change.
        if (this._spreadMode === mode)
            return;
        if (!isValidSpreadMode(mode)) {
            throw new Error(`Invalid spread mode: ${mode}`);
        }
        this._spreadMode = mode;
        this.eventBus.dispatch("spreadmodechanged", { source: this, mode });
        this._updateSpreadMode(/* pageNumber = */ this._currentPageNumber);
    }
    _updateSpreadMode(pageNumber) {
        if (!this.pdfDocument)
            return;
        const viewer = this.viewer, pages = this._pages;
        if (this._scrollMode === ScrollMode.PAGE) {
            this._ensurePageViewVisible();
        }
        else {
            // Temporarily remove all the pages from the DOM.
            viewer.textContent = "";
            if (this._spreadMode === SpreadMode.NONE) {
                for (let i = 0, ii = pages.length; i < ii; ++i) {
                    viewer.appendChild(pages[i].div);
                }
            }
            else {
                const parity = this._spreadMode - 1;
                let spread = null;
                for (let i = 0, ii = pages.length; i < ii; ++i) {
                    if (spread === null) {
                        spread = html("div");
                        spread.className = "spread";
                        viewer.appendChild(spread);
                    }
                    else if (i % 2 === parity) {
                        spread = spread.cloneNode(false);
                        viewer.appendChild(spread);
                    }
                    spread.appendChild(pages[i].div);
                }
            }
        }
        if (!pageNumber)
            return;
        // Non-numeric scale values can be sensitive to the scroll orientation.
        // Call this before re-scrolling to the current page, to ensure that any
        // changes in scale don't move the current page.
        if (this.#currentScaleValue && isNaN(this.#currentScaleValue)) {
            this._setScale(this.#currentScaleValue, true);
        }
        this.setCurrentPageNumber$(pageNumber, /* resetCurrentPageView = */ true);
        this.update();
    }
    /**
     * @private
     */
    _getPageAdvance(currentPageNumber, previous = false) {
        switch (this._scrollMode) {
            case ScrollMode.WRAPPED: {
                const { views } = this.getVisiblePages$(), pageLayout = new Map();
                // Determine the current (visible) page layout.
                for (const { id, y, percent, widthPercent } of views) {
                    if (percent === 0 || widthPercent < 100)
                        continue;
                    let yArray = pageLayout.get(y);
                    if (!yArray) {
                        pageLayout.set(y, (yArray ||= []));
                    }
                    yArray.push(id);
                }
                // Find the row of the current page.
                for (const yArray of pageLayout.values()) {
                    const currentIndex = yArray.indexOf(currentPageNumber);
                    if (currentIndex === -1)
                        continue;
                    const numPages = yArray.length;
                    if (numPages === 1)
                        break;
                    // Handle documents with varying page sizes.
                    if (previous) {
                        for (let i = currentIndex - 1, ii = 0; i >= ii; i--) {
                            const currentId = yArray[i], expectedId = yArray[i + 1] - 1;
                            if (currentId < expectedId) {
                                return currentPageNumber - expectedId;
                            }
                        }
                    }
                    else {
                        for (let i = currentIndex + 1, ii = numPages; i < ii; i++) {
                            const currentId = yArray[i], expectedId = yArray[i - 1] + 1;
                            if (currentId > expectedId) {
                                return expectedId - currentPageNumber;
                            }
                        }
                    }
                    // The current row is "complete", advance to the previous/next one.
                    if (previous) {
                        const firstId = yArray[0];
                        if (firstId < currentPageNumber) {
                            return currentPageNumber - firstId + 1;
                        }
                    }
                    else {
                        const lastId = yArray[numPages - 1];
                        if (lastId > currentPageNumber) {
                            return lastId - currentPageNumber + 1;
                        }
                    }
                    break;
                }
                break;
            }
            case ScrollMode.HORIZONTAL: {
                break;
            }
            case ScrollMode.PAGE:
            case ScrollMode.VERTICAL: {
                if (this._spreadMode === SpreadMode.NONE) {
                    break; // Normal vertical scrolling.
                }
                const parity = this._spreadMode - 1;
                if (previous && currentPageNumber % 2 !== parity) {
                    break; // Left-hand side page.
                }
                else if (!previous && currentPageNumber % 2 === parity) {
                    break; // Right-hand side page.
                }
                const { views } = this.getVisiblePages$(), expectedId = previous ? currentPageNumber - 1 : currentPageNumber + 1;
                for (const { id, percent, widthPercent } of views) {
                    if (id !== expectedId)
                        continue;
                    if (percent > 0 && widthPercent === 100) {
                        return 2;
                    }
                    break;
                }
                break;
            }
        }
        return 1;
    }
    /**
     * Go to the next page, taking scroll/spread-modes into account.
     * @return {boolean} Whether navigation occured.
     */
    nextPage() {
        const currentPageNumber = this._currentPageNumber, pagesCount = this.pagesCount;
        if (currentPageNumber >= pagesCount)
            return false;
        const advance = this._getPageAdvance(currentPageNumber, /* previous = */ false) || 1;
        this.currentPageNumber = Math.min(currentPageNumber + advance, pagesCount);
        return true;
    }
    /**
     * Go to the previous page, taking scroll/spread-modes into account.
     * @return Whether navigation occured.
     */
    previousPage() {
        const currentPageNumber = this._currentPageNumber;
        if (currentPageNumber <= 1)
            return false;
        const advance = this._getPageAdvance(currentPageNumber, /* previous = */ true) || 1;
        this.currentPageNumber = Math.max(currentPageNumber - advance, 1);
        return true;
    }
    /**
     * Increase the current zoom level one, or more, times.
     * @param steps Defaults to zooming once.
     */
    increaseScale(steps = 1) {
        let newScale = this._currentScale;
        do {
            newScale = (newScale * DEFAULT_SCALE_DELTA).toFixed(2);
            newScale = Math.ceil(+newScale * 10) / 10;
            newScale = Math.min(MAX_SCALE, newScale);
        } while (--steps > 0 && newScale < MAX_SCALE);
        this.currentScaleValue = newScale;
    }
    /**
     * Decrease the current zoom level one, or more, times.
     * @param steps Defaults to zooming once.
     */
    decreaseScale(steps = 1) {
        let newScale = this._currentScale;
        do {
            newScale = (newScale / DEFAULT_SCALE_DELTA).toFixed(2);
            newScale = Math.floor(+newScale * 10) / 10;
            newScale = Math.max(MIN_SCALE, newScale);
        } while (--steps > 0 && newScale > MIN_SCALE);
        this.currentScaleValue = newScale;
    }
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=base_viewer.js.map