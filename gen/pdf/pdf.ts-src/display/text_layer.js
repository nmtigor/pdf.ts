/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/display/text_layer.ts
 * @license Apache-2.0
 ******************************************************************************/
var _a;
import { html } from "../../../lib/dom.js";
import { PromiseCap } from "../../../lib/util/PromiseCap.js";
import { GENERIC, MOZCENTRAL, PDFJSDev, TESTING } from "../../../global.js";
import { AbortException, Util, warn } from "../shared/util.js";
import { deprecated, setLayerDimensions } from "./display_utils.js";
const MAX_TEXT_DIVS_TO_RENDER = 100000;
const DEFAULT_FONT_SIZE = 30;
const DEFAULT_FONT_ASCENT = 0.8;
export class TextLayer {
    #capability = new PromiseCap();
    #container;
    #disableProcessItems = false;
    #fontInspectorEnabled = !!globalThis.FontInspector?.enabled;
    #lang;
    #layoutTextParams = {};
    #pageHeight = 0;
    /* For testing purposes. */
    pageHeight;
    #pageWidth = 0;
    /* For testing purposes. */
    pageWidth;
    #reader;
    #rootContainer;
    #rotation = 0;
    #scale = 0;
    #styleCache = Object.create(null);
    #textContentItemsStr = [];
    /**
     * Strings that correspond to the `str` property of
     * the text items of the textContent input.
     * This is output and will initially be set to an empty array
     */
    get textContentItemsStr() {
        return this.#textContentItemsStr;
    }
    #textContentSource;
    #textDivs = [];
    /**
     * HTML elements that correspond to the text items
     * of the textContent input.
     * This is output and will initially be set to an empty array.
     */
    get textDivs() {
        return this.#textDivs;
    }
    #textDivProperties = new WeakMap();
    #transform;
    static #ascentCache = new Map();
    static #canvasContexts = new Map();
    static #minFontSize;
    static #pendingTextLayers = new Set();
    constructor({ textContentSource, container, viewport }) {
        if (textContentSource instanceof ReadableStream) {
            this.#textContentSource = textContentSource;
        }
        else if ((PDFJSDev || GENERIC) &&
            typeof textContentSource === "object") {
            this.#textContentSource = new ReadableStream({
                start(controller) {
                    controller.enqueue(textContentSource);
                    controller.close();
                },
            });
        }
        else {
            throw new Error('No "textContentSource" parameter specified.');
        }
        this.#container = this.#rootContainer = container;
        this.#scale = viewport.scale * (globalThis.devicePixelRatio || 1);
        this.#rotation = viewport.rotation;
        const { pageWidth, pageHeight, pageX, pageY } = viewport.rawDims;
        this.#transform = [1, 0, 0, -1, -pageX, pageY + pageHeight];
        this.#pageWidth = pageWidth;
        this.#pageHeight = pageHeight;
        _a.#ensureMinFontSizeComputed();
        setLayerDimensions(container, viewport);
        // Always clean-up the temporary canvas once rendering is no longer pending.
        this.#capability.promise
            .catch(() => {
            // Avoid "Uncaught promise" messages in the console.
        })
            .then(() => {
            _a.#pendingTextLayers.delete(this);
            this.#layoutTextParams = undefined;
            this.#styleCache = undefined;
        });
        /*#static*/  {
            /* For testing purposes. */
            Object.defineProperty(this, "pageWidth", {
                get() {
                    return this.#pageWidth;
                },
            });
            Object.defineProperty(this, "pageHeight", {
                get() {
                    return this.#pageHeight;
                },
            });
        }
    }
    /**
     * Render the textLayer.
     * @returns {Promise}
     */
    render() {
        const pump = () => {
            this.#reader.read().then(({ value, done }) => {
                if (done) {
                    this.#capability.resolve();
                    return;
                }
                this.#lang ??= value.lang;
                Object.assign(this.#styleCache, value.styles);
                this.#processItems(value.items);
                pump();
            }, this.#capability.reject);
        };
        this.#reader = this.#textContentSource.getReader();
        _a.#pendingTextLayers.add(this);
        pump();
        return this.#capability.promise;
    }
    /**
     * Update a previously rendered textLayer, if necessary.
     */
    update({ viewport, onBefore }) {
        const scale = viewport.scale * (globalThis.devicePixelRatio || 1);
        const rotation = viewport.rotation;
        if (rotation !== this.#rotation) {
            onBefore?.();
            this.#rotation = rotation;
            setLayerDimensions(this.#rootContainer, { rotation });
        }
        if (scale !== this.#scale) {
            onBefore?.();
            this.#scale = scale;
            const params = {
                ctx: _a.#getCtx(this.#lang),
            };
            for (const div of this.#textDivs) {
                params.properties = this.#textDivProperties.get(div);
                params.div = div;
                this.#layout(params);
            }
        }
    }
    /**
     * Cancel rendering of the textLayer.
     */
    cancel() {
        const abortEx = new AbortException("TextLayer task cancelled.");
        this.#reader?.cancel(abortEx).catch(() => {
            // Avoid "Uncaught promise" messages in the console.
        });
        this.#reader = undefined;
        this.#capability.reject(abortEx);
    }
    #processItems(items) {
        if (this.#disableProcessItems) {
            return;
        }
        this.#layoutTextParams.ctx ??= _a.#getCtx(this.#lang);
        const textDivs = this.#textDivs, textContentItemsStr = this.#textContentItemsStr;
        for (const item of items) {
            // No point in rendering many divs as it would make the browser
            // unusable even after the divs are rendered.
            if (textDivs.length > MAX_TEXT_DIVS_TO_RENDER) {
                warn("Ignoring additional textDivs for performance reasons.");
                this.#disableProcessItems = true; // Avoid multiple warnings for one page.
                return;
            }
            if (item.str === undefined) {
                if (item.type === "beginMarkedContentProps" ||
                    item.type === "beginMarkedContent") {
                    const parent = this.#container;
                    this.#container = html("span");
                    this.#container.classList.add("markedContent");
                    if (item.id !== undefined) {
                        this.#container.setAttribute("id", `${item.id}`);
                    }
                    parent.append(this.#container);
                }
                else if (item.type === "endMarkedContent") {
                    this.#container = this.#container.parentNode;
                }
                continue;
            }
            textContentItemsStr.push(item.str);
            this.#appendText(item);
        }
    }
    #appendText(geom) {
        // Initialize all used properties to keep the caches monomorphic.
        const textDiv = html("span");
        const textDivProperties = {
            angle: 0,
            canvasWidth: 0,
            hasText: geom.str !== "",
            hasEOL: geom.hasEOL,
            fontSize: 0,
        };
        this.#textDivs.push(textDiv);
        const tx = Util.transform(this.#transform, geom.transform);
        let angle = Math.atan2(tx[1], tx[0]);
        const style = this.#styleCache[geom.fontName];
        if (style.vertical) {
            angle += Math.PI / 2;
        }
        const fontFamily = (this.#fontInspectorEnabled && style.fontSubstitution) ||
            style.fontFamily;
        const fontHeight = Math.hypot(tx[2], tx[3]);
        const fontAscent = fontHeight *
            _a.#getAscent(fontFamily, this.#lang);
        let left, top;
        if (angle === 0) {
            left = tx[4];
            top = tx[5] - fontAscent;
        }
        else {
            left = tx[4] + fontAscent * Math.sin(angle);
            top = tx[5] - fontAscent * Math.cos(angle);
        }
        const scaleFactorStr = "calc(var(--scale-factor)*";
        const divStyle = textDiv.style;
        // Setting the style properties individually, rather than all at once,
        // should be OK since the `textDiv` isn't appended to the document yet.
        if (this.#container === this.#rootContainer) {
            divStyle.left = `${((100 * left) / this.#pageWidth).toFixed(2)}%`;
            divStyle.top = `${((100 * top) / this.#pageHeight).toFixed(2)}%`;
        }
        else {
            // We're in a marked content span, hence we can't use percents.
            divStyle.left = `${scaleFactorStr}${left.toFixed(2)}px)`;
            divStyle.top = `${scaleFactorStr}${top.toFixed(2)}px)`;
        }
        // We multiply the font size by #minFontSize, and then #layout will
        // scale the element by 1/#minFontSize. This allows us to effectively
        // ignore the minimum font size enforced by the browser, so that the text
        // layer <span>s can always match the size of the text in the canvas.
        divStyle.fontSize = `${scaleFactorStr}${(_a.#minFontSize * fontHeight).toFixed(2)}px)`;
        divStyle.fontFamily = fontFamily;
        textDivProperties.fontSize = fontHeight;
        // Keeps screen readers from pausing on every new text span.
        textDiv.setAttribute("role", "presentation");
        textDiv.textContent = geom.str;
        // geom.dir may be 'ttb' for vertical texts.
        textDiv.dir = geom.dir;
        // `fontName` is only used by the FontInspector, and we only use `dataset`
        // here to make the font name available in the debugger.
        if (this.#fontInspectorEnabled) {
            textDiv.dataset.fontName = style.fontSubstitutionLoadedName ||
                geom.fontName;
        }
        if (angle !== 0) {
            textDivProperties.angle = angle * (180 / Math.PI);
        }
        // We don't bother scaling single-char text divs, because it has very
        // little effect on text highlighting. This makes scrolling on docs with
        // lots of such divs a lot faster.
        let shouldScaleText = false;
        if (geom.str.length > 1) {
            shouldScaleText = true;
        }
        else if (geom.str !== " " && geom.transform[0] !== geom.transform[3]) {
            const absScaleX = Math.abs(geom.transform[0]), absScaleY = Math.abs(geom.transform[3]);
            // When the horizontal/vertical scaling differs significantly, also scale
            // even single-char text to improve highlighting (fixes issue11713.pdf).
            if (absScaleX !== absScaleY &&
                Math.max(absScaleX, absScaleY) / Math.min(absScaleX, absScaleY) > 1.5) {
                shouldScaleText = true;
            }
        }
        if (shouldScaleText) {
            textDivProperties.canvasWidth = style.vertical ? geom.height : geom.width;
        }
        this.#textDivProperties.set(textDiv, textDivProperties);
        // Finally, layout and append the text to the DOM.
        this.#layoutTextParams.div = textDiv;
        this.#layoutTextParams.properties = textDivProperties;
        this.#layout(this.#layoutTextParams);
        if (textDivProperties.hasText) {
            this.#container.append(textDiv);
        }
        if (textDivProperties.hasEOL) {
            const br = html("br");
            br.setAttribute("role", "presentation");
            this.#container.append(br);
        }
    }
    #layout(params) {
        const { div, properties, ctx, prevFontSize, prevFontFamily } = params;
        const { style } = div;
        let transform = "";
        if (_a.#minFontSize > 1) {
            transform = `scale(${1 / _a.#minFontSize})`;
        }
        if (properties.canvasWidth !== 0 && properties.hasText) {
            const { fontFamily } = style;
            const { canvasWidth, fontSize } = properties;
            if (prevFontSize !== fontSize || prevFontFamily !== fontFamily) {
                ctx.font = `${fontSize * this.#scale}px ${fontFamily}`;
                params.prevFontSize = fontSize;
                params.prevFontFamily = fontFamily;
            }
            // Only measure the width for multi-char text divs, see `appendText`.
            const { width } = ctx.measureText(div.textContent);
            if (width > 0) {
                transform = `scaleX(${(canvasWidth * this.#scale) / width}) ${transform}`;
            }
        }
        if (properties.angle !== 0) {
            transform = `rotate(${properties.angle}deg) ${transform}`;
        }
        if (transform.length > 0) {
            style.transform = transform;
        }
    }
    /**
     * Clean-up global textLayer data.
     * @returns {undefined}
     */
    static cleanup() {
        if (this.#pendingTextLayers.size > 0) {
            return;
        }
        this.#ascentCache.clear();
        for (const { canvas } of this.#canvasContexts.values()) {
            canvas.remove();
        }
        this.#canvasContexts.clear();
    }
    static #getCtx(lang) {
        let canvasContext = this.#canvasContexts.get(lang ||= "");
        if (!canvasContext) {
            // We don't use an OffscreenCanvas here because we use serif/sans serif
            // fonts with it and they depends on the locale.
            // In Firefox, the <html> element get a lang attribute that depends on
            // what Fluent returns for the locale and the OffscreenCanvas uses
            // the OS locale.
            // Those two locales can be different and consequently the used fonts will
            // be different (see bug 1869001).
            // Ideally, we should use in the text layer the fonts we've in the pdf (or
            // their replacements when they aren't embedded) and then we can use an
            // OffscreenCanvas.
            const canvas = html("canvas");
            canvas.className = "hiddenCanvasElement";
            canvas.lang = lang;
            document.body.append(canvas);
            canvasContext = canvas.getContext("2d", {
                alpha: false,
                willReadFrequently: true,
            });
            this.#canvasContexts.set(lang, canvasContext);
        }
        return canvasContext;
    }
    /**
     * Compute the minimum font size enforced by the browser.
     */
    static #ensureMinFontSizeComputed() {
        if (this.#minFontSize !== undefined) {
            return;
        }
        const div = html("div").assignStylo({
            opacity: 0,
            lineHeight: 1,
            fontSize: "1px",
        });
        div.textContent = "X";
        document.body.append(div);
        // In `display:block` elements contain a single line of text,
        // the height matches the line height (which, when set to 1,
        // matches the actual font size).
        this.#minFontSize = div.getBoundingClientRect().height;
        div.remove();
    }
    static #getAscent(fontFamily, lang) {
        const cachedAscent = this.#ascentCache.get(fontFamily);
        if (cachedAscent) {
            return cachedAscent;
        }
        const ctx = this.#getCtx(lang);
        const savedFont = ctx.font;
        ctx.canvas.width = ctx.canvas.height = DEFAULT_FONT_SIZE;
        ctx.font = `${DEFAULT_FONT_SIZE}px ${fontFamily}`;
        const metrics = ctx.measureText("");
        // Both properties aren't available by default in Firefox.
        let ascent = metrics.fontBoundingBoxAscent;
        let descent = Math.abs(metrics.fontBoundingBoxDescent);
        if (ascent) {
            const ratio = ascent / (ascent + descent);
            this.#ascentCache.set(fontFamily, ratio);
            ctx.canvas.width = ctx.canvas.height = 0;
            ctx.font = savedFont;
            return ratio;
        }
        // Try basic heuristic to guess ascent/descent.
        // Draw a g with baseline at 0,0 and then get the line
        // number where a pixel has non-null red component (starting
        // from bottom).
        ctx.strokeStyle = "red";
        ctx.clearRect(0, 0, DEFAULT_FONT_SIZE, DEFAULT_FONT_SIZE);
        ctx.strokeText("g", 0, 0);
        let pixels = ctx.getImageData(0, 0, DEFAULT_FONT_SIZE, DEFAULT_FONT_SIZE).data;
        descent = 0;
        for (let i = pixels.length - 1 - 3; i >= 0; i -= 4) {
            if (pixels[i] > 0) {
                descent = Math.ceil(i / 4 / DEFAULT_FONT_SIZE);
                break;
            }
        }
        // Draw an A with baseline at 0,DEFAULT_FONT_SIZE and then get the line
        // number where a pixel has non-null red component (starting
        // from top).
        ctx.clearRect(0, 0, DEFAULT_FONT_SIZE, DEFAULT_FONT_SIZE);
        ctx.strokeText("A", 0, DEFAULT_FONT_SIZE);
        pixels = ctx.getImageData(0, 0, DEFAULT_FONT_SIZE, DEFAULT_FONT_SIZE).data;
        ascent = 0;
        for (let i = 0, ii = pixels.length; i < ii; i += 4) {
            if (pixels[i] > 0) {
                ascent = DEFAULT_FONT_SIZE - Math.floor(i / 4 / DEFAULT_FONT_SIZE);
                break;
            }
        }
        ctx.canvas.width = ctx.canvas.height = 0;
        ctx.font = savedFont;
        const ratio = ascent ? ascent / (ascent + descent) : DEFAULT_FONT_ASCENT;
        this.#ascentCache.set(fontFamily, ratio);
        return ratio;
    }
}
_a = TextLayer;
export function renderTextLayer() {
    /*#static*/ 
    deprecated("`renderTextLayer`, please use `TextLayer` instead.");
    const { textContentSource, container, viewport, ...rest } = arguments[0];
    const restKeys = Object.keys(rest);
    if (restKeys.length > 0) {
        warn("Ignoring `renderTextLayer` parameters: " + restKeys.join(", "));
    }
    const textLayer = new TextLayer({
        textContentSource,
        container,
        viewport,
    });
    const { textDivs, textContentItemsStr } = textLayer;
    const promise = textLayer.render();
    // eslint-disable-next-line consistent-return
    return {
        promise,
        textDivs,
        textContentItemsStr,
    };
}
export function updateTextLayer() {
    /*#static*/ 
    deprecated("`updateTextLayer`, please use `TextLayer` instead.");
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=text_layer.js.map