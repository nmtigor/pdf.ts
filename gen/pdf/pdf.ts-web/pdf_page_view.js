/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
/* Copyright 2012 Mozilla Foundation
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
// eslint-disable-next-line max-len
/** @typedef {import("../src/display/display_utils").PageViewport} PageViewport */
// eslint-disable-next-line max-len
/** @typedef {import("../src/display/optional_content_config").OptionalContentConfig} OptionalContentConfig */
/** @typedef {import("./event_utils").EventBus} EventBus */
/** @typedef {import("./interfaces").IL10n} IL10n */
// eslint-disable-next-line max-len
/** @typedef {import("./interfaces").IPDFAnnotationLayerFactory} IPDFAnnotationLayerFactory */
// eslint-disable-next-line max-len
/** @typedef {import("./interfaces").IPDFStructTreeLayerFactory} IPDFStructTreeLayerFactory */
// eslint-disable-next-line max-len
/** @typedef {import("./interfaces").IPDFTextLayerFactory} IPDFTextLayerFactory */
/** @typedef {import("./interfaces").IL10n} IPDFXfaLayerFactory */
/** @typedef {import("./interfaces").IRenderableView} IRenderableView */
// eslint-disable-next-line max-len
/** @typedef {import("./pdf_rendering_queue").PDFRenderingQueue} PDFRenderingQueue */
import { html } from "../../lib/dom.js";
import { createPromiseCap } from "../../lib/promisecap.js";
import { PixelsPerInch, RenderingCancelledException, SVGGraphics } from "../pdf.ts-src/pdf.js";
import { AnnotationMode } from "../pdf.ts-src/shared/util.js";
import { compatibilityParams } from "./app_options.js";
import { NullL10n } from "./l10n_utils.js";
import { approximateFraction, DEFAULT_SCALE, OutputScale, RendererType, RenderingStates, roundToDivide, TextLayerMode } from "./ui_utils.js";
const MAX_CANVAS_PIXELS = compatibilityParams.maxCanvasPixels || 16777216;
export class PDFPageView {
    /** @implements */
    id;
    /** @implements */
    renderingId;
    pdfPage;
    pageLabel;
    rotation = 0;
    scale;
    viewport;
    get width() { return this.viewport.width; }
    get height() { return this.viewport.height; }
    pdfPageRotate;
    _annotationStorage;
    _optionalContentConfigPromise;
    hasRestrictedScaling = false;
    textLayerMode;
    #annotationMode;
    imageResourcesPath;
    useOnlyCssZoom;
    maxCanvasPixels;
    pageColors;
    eventBus;
    renderingQueue;
    textLayerFactory;
    annotationLayerFactory;
    xfaLayerFactory;
    textHighlighter;
    structTreeLayerFactory;
    renderer;
    l10n;
    paintTask;
    paintedViewportMap = new WeakMap();
    renderingState = RenderingStates.INITIAL;
    resume; /** @implements */
    _renderError;
    _isStandalone;
    _annotationCanvasMap;
    annotationLayer;
    textLayer;
    zoomLayer;
    xfaLayer;
    structTreeLayer;
    div; /** @implements */
    stats;
    canvas;
    svg;
    loadingIconDiv;
    outputScale;
    _onTextLayerRendered;
    constructor(options) {
        const container = options.container;
        const defaultViewport = options.defaultViewport;
        this.id = options.id;
        this.renderingId = "page" + this.id;
        this.scale = options.scale || DEFAULT_SCALE;
        this.viewport = defaultViewport;
        this.pdfPageRotate = defaultViewport.rotation;
        this._optionalContentConfigPromise = options.optionalContentConfigPromise;
        this.textLayerMode = options.textLayerMode ?? TextLayerMode.ENABLE;
        this.#annotationMode =
            options.annotationMode ?? AnnotationMode.ENABLE_FORMS;
        this.imageResourcesPath = options.imageResourcesPath || "";
        this.useOnlyCssZoom = options.useOnlyCssZoom || false;
        this.maxCanvasPixels = options.maxCanvasPixels || MAX_CANVAS_PIXELS;
        this.pageColors = options.pageColors;
        this.eventBus = options.eventBus;
        this.renderingQueue = options.renderingQueue;
        this.textLayerFactory = options.textLayerFactory;
        this.annotationLayerFactory = options.annotationLayerFactory;
        this.xfaLayerFactory = options.xfaLayerFactory;
        this.textHighlighter =
            options.textHighlighterFactory.createTextHighlighter(this.id - 1, this.eventBus);
        this.structTreeLayerFactory = options.structTreeLayerFactory;
        this.renderer = options.renderer || RendererType.CANVAS;
        this.l10n = options.l10n || NullL10n;
        this._isStandalone = !this.renderingQueue?.hasViewer();
        const div = html("div");
        div.className = "page";
        div.style.width = Math.floor(this.viewport.width) + "px";
        div.style.height = Math.floor(this.viewport.height) + "px";
        div.setAttribute("data-page-number", this.id);
        div.setAttribute("role", "region");
        this.l10n.get("page_landmark", { page: this.id }).then(msg => {
            div.setAttribute("aria-label", msg);
        });
        this.div = div;
        container?.appendChild(div);
    }
    setPdfPage(pdfPage) {
        this.pdfPage = pdfPage;
        this.pdfPageRotate = pdfPage.rotate;
        const totalRotation = (this.rotation + this.pdfPageRotate) % 360;
        this.viewport = pdfPage.getViewport({
            scale: this.scale * PixelsPerInch.PDF_TO_CSS_UNITS,
            rotation: totalRotation,
        });
        this.reset();
    }
    destroy() {
        this.reset();
        if (this.pdfPage) {
            this.pdfPage.cleanup();
        }
    }
    async #renderAnnotationLayer() {
        let error = undefined;
        try {
            await this.annotationLayer.render(this.viewport, "display");
        }
        catch (ex) {
            error = ex;
        }
        finally {
            this.eventBus.dispatch("annotationlayerrendered", {
                source: this,
                pageNumber: this.id,
                error,
            });
        }
    }
    async #renderXfaLayer() {
        let error = null;
        try {
            const result = await this.xfaLayer.render(this.viewport, "display");
            if (this.textHighlighter) {
                this._buildXfaTextContentItems(result.textDivs);
            }
        }
        catch (ex) {
            error = ex;
        }
        finally {
            this.eventBus.dispatch("xfalayerrendered", {
                source: this,
                pageNumber: this.id,
                error,
            });
        }
    }
    async _buildXfaTextContentItems(textDivs) {
        const text = await this.pdfPage.getTextContent();
        const items = [];
        for (const item of text.items) {
            items.push(item.str);
        }
        this.textHighlighter.setTextMapping(textDivs, items);
        this.textHighlighter.enable();
    }
    #resetZoomLayer(removeFromDOM = false) {
        if (!this.zoomLayer)
            return;
        const zoomLayerCanvas = this.zoomLayer.firstChild;
        this.paintedViewportMap.delete(zoomLayerCanvas);
        // Zeroing the width and height causes Firefox to release graphics
        // resources immediately, which can greatly reduce memory consumption.
        zoomLayerCanvas.width = 0;
        zoomLayerCanvas.height = 0;
        if (removeFromDOM) {
            // Note: `ChildNode.remove` doesn't throw if the parent node is undefined.
            this.zoomLayer.remove();
        }
        this.zoomLayer = undefined;
    }
    reset({ keepZoomLayer = false, keepAnnotationLayer = false, keepXfaLayer = false, } = {}) {
        this.cancelRendering({ keepAnnotationLayer, keepXfaLayer });
        this.renderingState = RenderingStates.INITIAL;
        const div = this.div;
        div.style.width = Math.floor(this.viewport.width) + "px";
        div.style.height = Math.floor(this.viewport.height) + "px";
        const childNodes = div.childNodes, zoomLayerNode = (keepZoomLayer && this.zoomLayer) || null, annotationLayerNode = (keepAnnotationLayer && this.annotationLayer?.div) || null, xfaLayerNode = (keepXfaLayer && this.xfaLayer?.div) || null;
        for (let i = childNodes.length; i--;) {
            const node = childNodes[i];
            switch (node) {
                case zoomLayerNode:
                case annotationLayerNode:
                case xfaLayerNode:
                    continue;
            }
            node.remove();
        }
        div.removeAttribute("data-loaded");
        if (annotationLayerNode) {
            // Hide the annotation layer until all elements are resized
            // so they are not displayed on the already resized page.
            this.annotationLayer.hide();
        }
        if (xfaLayerNode) {
            // Hide the XFA layer until all elements are resized
            // so they are not displayed on the already resized page.
            this.xfaLayer.hide();
        }
        if (!zoomLayerNode) {
            if (this.canvas) {
                this.paintedViewportMap.delete(this.canvas);
                // Zeroing the width and height causes Firefox to release graphics
                // resources immediately, which can greatly reduce memory consumption.
                this.canvas.width = 0;
                this.canvas.height = 0;
                delete this.canvas;
            }
            this.#resetZoomLayer();
        }
        if (this.svg) {
            this.paintedViewportMap.delete(this.svg);
            delete this.svg;
        }
        this.loadingIconDiv = html("div");
        this.loadingIconDiv.className = "loadingIcon notVisible";
        if (this._isStandalone) {
            this.toggleLoadingIconSpinner(/* viewVisible = */ true);
        }
        this.loadingIconDiv.setAttribute("role", "img");
        this.l10n.get("loading").then(msg => {
            this.loadingIconDiv?.setAttribute("aria-label", msg);
        });
        div.appendChild(this.loadingIconDiv);
    }
    update({ scale = 0, rotation, optionalContentConfigPromise }) {
        this.scale = scale || this.scale;
        if (typeof rotation === "number") {
            this.rotation = rotation; // The rotation may be zero.
        }
        if (optionalContentConfigPromise instanceof Promise) {
            this._optionalContentConfigPromise = optionalContentConfigPromise;
        }
        const totalRotation = (this.rotation + this.pdfPageRotate) % 360;
        this.viewport = this.viewport.clone({
            scale: this.scale * PixelsPerInch.PDF_TO_CSS_UNITS,
            rotation: totalRotation,
        });
        if (this._isStandalone) {
            const { style } = document.documentElement;
            style.setProperty("--zoom-factor", this.scale);
        }
        if (this.svg) {
            this.cssTransform({
                target: this.svg,
                redrawAnnotationLayer: true,
                redrawXfaLayer: true,
            });
            this.eventBus.dispatch("pagerendered", {
                source: this,
                pageNumber: this.id,
                cssTransform: true,
                timestamp: performance.now(),
                error: this._renderError,
            });
            return;
        }
        let isScalingRestricted = false;
        if (this.canvas && this.maxCanvasPixels > 0) {
            const outputScale = this.outputScale;
            if (((Math.floor(this.viewport.width) * outputScale.sx) | 0) *
                ((Math.floor(this.viewport.height) * outputScale.sy) | 0) >
                this.maxCanvasPixels) {
                isScalingRestricted = true;
            }
        }
        if (this.canvas) {
            if (this.useOnlyCssZoom
                || (this.hasRestrictedScaling && isScalingRestricted)) {
                this.cssTransform({
                    target: this.canvas,
                    redrawAnnotationLayer: true,
                    redrawXfaLayer: true,
                });
                this.eventBus.dispatch("pagerendered", {
                    source: this,
                    pageNumber: this.id,
                    cssTransform: true,
                    timestamp: performance.now(),
                    error: this._renderError,
                });
                return;
            }
            if (!this.zoomLayer && !this.canvas.hidden) {
                this.zoomLayer = this.canvas.parentNode;
                this.zoomLayer.style.position = "absolute";
            }
        }
        if (this.zoomLayer) {
            this.cssTransform({ target: this.zoomLayer.firstChild });
        }
        this.reset({
            keepZoomLayer: true,
            keepAnnotationLayer: true,
            keepXfaLayer: true,
        });
    }
    /**
     * PLEASE NOTE: Most likely you want to use the `this.reset()` method,
     *              rather than calling this one directly.
     */
    cancelRendering({ keepAnnotationLayer = false, keepXfaLayer = false } = {}) {
        if (this.paintTask) {
            this.paintTask.cancel();
            this.paintTask = undefined;
        }
        this.resume = undefined;
        if (this.textLayer) {
            this.textLayer.cancel();
            this.textLayer = undefined;
        }
        if (this.annotationLayer
            && (!keepAnnotationLayer || !this.annotationLayer.div)) {
            this.annotationLayer.cancel();
            this.annotationLayer = undefined;
            this._annotationCanvasMap = undefined;
        }
        if (this.xfaLayer && (!keepXfaLayer || !this.xfaLayer.div)) {
            this.xfaLayer.cancel();
            this.xfaLayer = undefined;
            this.textHighlighter?.disable();
        }
        if (this._onTextLayerRendered) {
            this.eventBus._off("textlayerrendered", this._onTextLayerRendered);
            this._onTextLayerRendered = undefined;
        }
    }
    cssTransform({ target, redrawAnnotationLayer = false, redrawXfaLayer = false, }) {
        // Scale target (canvas or svg), its wrapper and page container.
        const width = this.viewport.width;
        const height = this.viewport.height;
        const div = this.div;
        target.style.width =
            target.parentNode.style.width =
                div.style.width =
                    Math.floor(width) + "px";
        target.style.height =
            target.parentNode.style.height =
                div.style.height =
                    Math.floor(height) + "px";
        // The canvas may have been originally rotated; rotate relative to that.
        const relativeRotation = this.viewport.rotation - this.paintedViewportMap.get(target).rotation;
        const absRotation = Math.abs(relativeRotation);
        let scaleX = 1, scaleY = 1;
        if (absRotation === 90 || absRotation === 270) {
            // Scale x and y because of the rotation.
            scaleX = height / width;
            scaleY = width / height;
        }
        target.style.transform = `rotate(${relativeRotation}deg) scale(${scaleX}, ${scaleY})`;
        if (this.textLayer) {
            // Rotating the text layer is more complicated since the divs inside the
            // the text layer are rotated.
            // TODO: This could probably be simplified by drawing the text layer in
            // one orientation and then rotating overall.
            const textLayerViewport = this.textLayer.viewport;
            const textRelativeRotation = this.viewport.rotation - textLayerViewport.rotation;
            const textAbsRotation = Math.abs(textRelativeRotation);
            let scale = width / textLayerViewport.width;
            if (textAbsRotation === 90 || textAbsRotation === 270) {
                scale = width / textLayerViewport.height;
            }
            const textLayerDiv = this.textLayer.textLayerDiv;
            let transX, transY;
            switch (textAbsRotation) {
                case 0:
                    transX = transY = 0;
                    break;
                case 90:
                    transX = 0;
                    transY = "-" + textLayerDiv.style.height;
                    break;
                case 180:
                    transX = "-" + textLayerDiv.style.width;
                    transY = "-" + textLayerDiv.style.height;
                    break;
                case 270:
                    transX = "-" + textLayerDiv.style.width;
                    transY = 0;
                    break;
                default:
                    console.error("Bad rotation value.");
                    break;
            }
            textLayerDiv.style.transform =
                `rotate(${textAbsRotation}deg) ` +
                    `scale(${scale}) ` +
                    `translate(${transX}, ${transY})`;
            textLayerDiv.style.transformOrigin = "0% 0%";
        }
        if (redrawAnnotationLayer && this.annotationLayer) {
            this.#renderAnnotationLayer();
        }
        if (redrawXfaLayer && this.xfaLayer) {
            this.#renderXfaLayer();
        }
    }
    getPagePoint(x, y) {
        return this.viewport.convertToPdfPoint(x, y);
    }
    /**
     * @ignore
     */
    toggleLoadingIconSpinner(viewVisible = false) {
        this.loadingIconDiv?.classList.toggle("notVisible", !viewVisible);
    }
    draw() {
        if (this.renderingState !== RenderingStates.INITIAL) {
            console.error("Must be in new state before drawing");
            this.reset(); // Ensure that we reset all state to prevent issues.
        }
        const { div, pdfPage } = this;
        if (!pdfPage) {
            this.renderingState = RenderingStates.FINISHED;
            if (this.loadingIconDiv) {
                this.loadingIconDiv.remove();
                delete this.loadingIconDiv;
            }
            return Promise.reject(new Error("pdfPage is not loaded"));
        }
        this.renderingState = RenderingStates.RUNNING;
        // Wrap the canvas so that if it has a CSS transform for high DPI the
        // overflow will be hidden in Firefox.
        const canvasWrapper = html("div");
        canvasWrapper.style.width = div.style.width;
        canvasWrapper.style.height = div.style.height;
        canvasWrapper.classList.add("canvasWrapper");
        if (this.annotationLayer?.div) {
            // The annotation layer needs to stay on top.
            div.insertBefore(canvasWrapper, this.annotationLayer.div);
        }
        else {
            div.appendChild(canvasWrapper);
        }
        let textLayer;
        if (this.textLayerMode !== TextLayerMode.DISABLE && this.textLayerFactory) {
            const textLayerDiv = html("div");
            textLayerDiv.className = "textLayer";
            textLayerDiv.style.width = canvasWrapper.style.width;
            textLayerDiv.style.height = canvasWrapper.style.height;
            if (this.annotationLayer?.div) {
                // The annotation layer needs to stay on top.
                div.insertBefore(textLayerDiv, this.annotationLayer.div);
            }
            else {
                div.appendChild(textLayerDiv);
            }
            textLayer = this.textLayerFactory.createTextLayerBuilder(textLayerDiv, this.id - 1, this.viewport, this.textLayerMode === TextLayerMode.ENABLE_ENHANCE, this.eventBus, this.textHighlighter);
        }
        this.textLayer = textLayer;
        if (this.#annotationMode !== AnnotationMode.DISABLE
            && this.annotationLayerFactory) {
            this._annotationCanvasMap ||= new Map();
            this.annotationLayer ||=
                this.annotationLayerFactory.createAnnotationLayerBuilder(div, pdfPage, 
                /* annotationStorage = */ undefined, this.imageResourcesPath, this.#annotationMode === AnnotationMode.ENABLE_FORMS, this.l10n, 
                /* enableScripting = */ undefined, 
                /* hasJSActionsPromise = */ undefined, 
                /* mouseState = */ undefined, 
                /* fieldObjectsPromise = */ undefined, 
                /* annotationCanvasMap */ this._annotationCanvasMap);
        }
        if (this.xfaLayer?.div) {
            // The xfa layer needs to stay on top.
            div.appendChild(this.xfaLayer.div);
        }
        let renderContinueCallback;
        if (this.renderingQueue) {
            renderContinueCallback = cont => {
                if (!this.renderingQueue.isHighestPriority(this)) {
                    this.renderingState = RenderingStates.PAUSED;
                    this.resume = () => {
                        this.renderingState = RenderingStates.RUNNING;
                        cont();
                    };
                    return;
                }
                cont();
            };
        }
        const finishPaintTask = async (error) => {
            // The paintTask may have been replaced by a new one, so only remove
            // the reference to the paintTask if it matches the one that is
            // triggering this callback.
            if (paintTask === this.paintTask) {
                this.paintTask = undefined;
            }
            if (error instanceof RenderingCancelledException) {
                this._renderError = undefined;
                return;
            }
            this._renderError = error;
            this.renderingState = RenderingStates.FINISHED;
            if (this.loadingIconDiv) {
                this.loadingIconDiv.remove();
                delete this.loadingIconDiv;
            }
            this.#resetZoomLayer(/* removeFromDOM = */ true);
            this.eventBus.dispatch("pagerendered", {
                source: this,
                pageNumber: this.id,
                cssTransform: false,
                timestamp: performance.now(),
                error: this._renderError,
            });
            if (error)
                throw error;
        };
        const paintTask = this.renderer === RendererType.SVG
            ? this.paintOnSvg(canvasWrapper)
            : this.paintOnCanvas(canvasWrapper);
        paintTask.onRenderContinue = renderContinueCallback;
        this.paintTask = paintTask;
        const resultPromise = paintTask.promise.then(() => {
            return finishPaintTask().then(() => {
                if (textLayer) {
                    const readableStream = pdfPage.streamTextContent({
                        includeMarkedContent: true,
                    });
                    textLayer.setTextContentStream(readableStream);
                    textLayer.render();
                }
                if (this.annotationLayer) {
                    this.#renderAnnotationLayer();
                }
            });
        }, (reason) => finishPaintTask(reason));
        if (this.xfaLayerFactory) {
            if (!this.xfaLayer) {
                this.xfaLayer = this.xfaLayerFactory.createXfaLayerBuilder(div, pdfPage, undefined);
            }
            this.#renderXfaLayer();
        }
        // The structure tree is currently only supported when the text layer is
        // enabled and a canvas is used for rendering.
        if (this.structTreeLayerFactory && this.textLayer && this.canvas) {
            // The structure tree must be generated after the text layer for the
            // aria-owns to work.
            this._onTextLayerRendered = event => {
                if (event.pageNumber !== this.id)
                    return;
                this.eventBus._off("textlayerrendered", this._onTextLayerRendered);
                this._onTextLayerRendered = undefined;
                // The canvas was removed, prevent errors below.
                if (!this.canvas)
                    return;
                this.pdfPage.getStructTree().then(tree => {
                    if (!tree)
                        return;
                    // The canvas was removed, prevent errors below.
                    if (!this.canvas)
                        return;
                    const treeDom = this.structTreeLayer.render(tree);
                    treeDom.classList.add("structTree");
                    this.canvas.appendChild(treeDom);
                });
            };
            this.eventBus._on("textlayerrendered", this._onTextLayerRendered);
            this.structTreeLayer =
                this.structTreeLayerFactory.createStructTreeLayerBuilder(pdfPage);
        }
        div.setAttribute("data-loaded", 'true');
        this.eventBus.dispatch("pagerender", {
            source: this,
            pageNumber: this.id,
        });
        return resultPromise;
    }
    paintOnCanvas(canvasWrapper) {
        const renderCapability = createPromiseCap();
        const result = {
            promise: renderCapability.promise,
            onRenderContinue(cont) {
                cont();
            },
            cancel() {
                renderTask.cancel();
            },
        };
        const viewport = this.viewport;
        const canvas = html("canvas");
        // Keep the canvas hidden until the first draw callback, or until drawing
        // is complete when `!this.renderingQueue`, to prevent black flickering.
        canvas.hidden = true;
        let isCanvasHidden = true;
        const showCanvas = () => {
            if (isCanvasHidden) {
                canvas.hidden = false;
                isCanvasHidden = false;
            }
        };
        canvasWrapper.appendChild(canvas);
        this.canvas = canvas;
        const ctx = canvas.getContext("2d", { alpha: false });
        const outputScale = (this.outputScale = new OutputScale());
        if (this.useOnlyCssZoom) {
            const actualSizeViewport = viewport.clone({
                scale: PixelsPerInch.PDF_TO_CSS_UNITS,
            });
            // Use a scale that makes the canvas have the originally intended size
            // of the page.
            outputScale.sx *= actualSizeViewport.width / viewport.width;
            outputScale.sy *= actualSizeViewport.height / viewport.height;
        }
        if (this.maxCanvasPixels > 0) {
            const pixelsInViewport = viewport.width * viewport.height;
            const maxScale = Math.sqrt(this.maxCanvasPixels / pixelsInViewport);
            if (outputScale.sx > maxScale || outputScale.sy > maxScale) {
                outputScale.sx = maxScale;
                outputScale.sy = maxScale;
                this.hasRestrictedScaling = true;
            }
            else {
                this.hasRestrictedScaling = false;
            }
        }
        const sfx = approximateFraction(outputScale.sx);
        const sfy = approximateFraction(outputScale.sy);
        canvas.width = roundToDivide(viewport.width * outputScale.sx, sfx[0]);
        canvas.height = roundToDivide(viewport.height * outputScale.sy, sfy[0]);
        canvas.style.width = roundToDivide(viewport.width, sfx[1]) + "px";
        canvas.style.height = roundToDivide(viewport.height, sfy[1]) + "px";
        // Add the viewport so it's known what it was originally drawn with.
        this.paintedViewportMap.set(canvas, viewport);
        // Rendering area
        const transform = outputScale.scaled
            ? [outputScale.sx, 0, 0, outputScale.sy, 0, 0]
            : undefined;
        const renderContext = {
            canvasContext: ctx,
            transform,
            viewport: this.viewport,
            annotationMode: this.#annotationMode,
            optionalContentConfigPromise: this._optionalContentConfigPromise,
            annotationCanvasMap: this._annotationCanvasMap,
            pageColors: this.pageColors,
        };
        const renderTask = this.pdfPage.render(renderContext);
        renderTask.onContinue = (cont) => {
            showCanvas();
            if (result.onRenderContinue)
                result.onRenderContinue(cont);
            else
                cont();
        };
        renderTask.promise.then(() => {
            showCanvas();
            renderCapability.resolve();
        }, error => {
            showCanvas();
            renderCapability.reject(error);
        });
        return result;
    }
    paintOnSvg(wrapper) {
        // Return a mock object, to prevent errors such as e.g.
        // "TypeError: paintTask.promise is undefined".
        let cancelled = false;
        const ensureNotCancelled = () => {
            if (cancelled) {
                throw new RenderingCancelledException(`Rendering cancelled, page ${this.id}`, "svg");
            }
        };
        const pdfPage = this.pdfPage;
        const actualSizeViewport = this.viewport.clone({
            scale: PixelsPerInch.PDF_TO_CSS_UNITS,
        });
        const promise = pdfPage
            .getOperatorList({
            annotationMode: this.#annotationMode,
        })
            .then(opList => {
            ensureNotCancelled();
            const svgGfx = new SVGGraphics(pdfPage.commonObjs, pdfPage.objs);
            return svgGfx.getSVG(opList, actualSizeViewport).then((svg) => {
                ensureNotCancelled();
                this.svg = svg;
                this.paintedViewportMap.set(svg, actualSizeViewport);
                svg.style.width = wrapper.style.width;
                svg.style.height = wrapper.style.height;
                this.renderingState = RenderingStates.FINISHED;
                wrapper.appendChild(svg);
            });
        });
        return {
            promise,
            onRenderContinue(cont) {
                cont();
            },
            cancel() {
                cancelled = true;
            },
        };
    }
    setPageLabel(label) {
        this.pageLabel = typeof label === "string" ? label : undefined;
        if (this.pageLabel !== undefined) {
            this.div.setAttribute("data-page-label", this.pageLabel);
        }
        else {
            this.div.removeAttribute("data-page-label");
        }
    }
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=pdf_page_view.js.map