/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
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
import { html, span } from "../../../lib/dom.js";
import { createPromiseCap } from "../../../lib/promisecap.js";
import { AbortException, Util, } from "../shared/util.js";
var Ns_renderTextLayer;
(function (Ns_renderTextLayer) {
    const MAX_TEXT_DIVS_TO_RENDER = 100000;
    const DEFAULT_FONT_SIZE = 30;
    const DEFAULT_FONT_ASCENT = 0.8;
    const ascentCache = new Map();
    function getAscent(fontFamily, ctx) {
        const cachedAscent = ascentCache.get(fontFamily);
        if (cachedAscent)
            return cachedAscent;
        ctx.save();
        ctx.font = `${DEFAULT_FONT_SIZE}px ${fontFamily}`;
        const metrics = ctx.measureText("");
        // Both properties aren't available by default in Firefox.
        let ascent = metrics.fontBoundingBoxAscent;
        let descent = Math.abs(metrics.fontBoundingBoxDescent);
        if (ascent) {
            ctx.restore();
            const ratio = ascent / (ascent + descent);
            ascentCache.set(fontFamily, ratio);
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
        ctx.restore();
        if (ascent) {
            const ratio = ascent / (ascent + descent);
            ascentCache.set(fontFamily, ratio);
            return ratio;
        }
        ascentCache.set(fontFamily, DEFAULT_FONT_ASCENT);
        return DEFAULT_FONT_ASCENT;
    }
    function appendText(task, geom, styles, ctx) {
        // Initialize all used properties to keep the caches monomorphic.
        const textDiv = span();
        const textDivProperties = {
            angle: 0,
            canvasWidth: 0,
            hasText: geom.str !== "",
            hasEOL: geom.hasEOL,
            fontSize: 0,
        };
        task._textDivs.push(textDiv);
        const tx = Util.transform(task._viewport.transform, geom.transform);
        let angle = Math.atan2(tx[1], tx[0]);
        const style = styles[geom.fontName];
        if (style.vertical) {
            angle += Math.PI / 2;
        }
        const fontHeight = Math.hypot(tx[2], tx[3]);
        const fontAscent = fontHeight * getAscent(style.fontFamily, ctx);
        let left, top;
        if (angle === 0) {
            left = tx[4];
            top = tx[5] - fontAscent;
        }
        else {
            left = tx[4] + fontAscent * Math.sin(angle);
            top = tx[5] - fontAscent * Math.cos(angle);
        }
        // Setting the style properties individually, rather than all at once,
        // should be OK since the `textDiv` isn't appended to the document yet.
        textDiv.style.left = `${left}px`;
        textDiv.style.top = `${top}px`;
        textDiv.style.fontSize = `${fontHeight}px`;
        textDiv.style.fontFamily = style.fontFamily;
        textDivProperties.fontSize = fontHeight;
        // Keeps screen readers from pausing on every new text span.
        textDiv.setAttribute("role", "presentation");
        textDiv.textContent = geom.str;
        // geom.dir may be 'ttb' for vertical texts.
        textDiv.dir = geom.dir;
        // `fontName` is only used by the FontInspector, and we only use `dataset`
        // here to make the font name available in the debugger.
        if (task._fontInspectorEnabled) {
            textDiv.dataset.fontName = geom.fontName;
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
            if (style.vertical) {
                textDivProperties.canvasWidth = geom.height * task._viewport.scale;
            }
            else {
                textDivProperties.canvasWidth = geom.width * task._viewport.scale;
            }
        }
        task._textDivProperties.set(textDiv, textDivProperties);
        if (task._textContentStream) {
            task._layoutText(textDiv);
        }
    }
    function render(task) {
        if (task._canceled) {
            return;
        }
        const textDivs = task._textDivs;
        const capability = task._capability;
        const textDivsLength = textDivs.length;
        // No point in rendering many divs as it would make the browser
        // unusable even after the divs are rendered.
        if (textDivsLength > MAX_TEXT_DIVS_TO_RENDER) {
            task._renderingDone = true;
            capability.resolve();
            return;
        }
        if (!task._textContentStream) {
            for (const textDiv of textDivs) {
                task._layoutText(textDiv);
            }
        }
        task._renderingDone = true;
        capability.resolve();
    }
    function findPositiveMin(ts, offset, count) {
        let result = 0;
        for (let i = 0; i < count; i++) {
            const t = ts[offset++];
            if (t > 0) {
                result = result ? Math.min(t, result) : t;
            }
        }
        return result;
    }
    function expand(task) {
        const bounds = task._bounds;
        const viewport = task._viewport;
        const expanded = expandBounds(viewport.width, viewport.height, bounds);
        for (let i = 0; i < expanded.length; i++) {
            const div = bounds[i].div;
            const divProperties = task._textDivProperties.get(div);
            if (divProperties.angle === 0) {
                divProperties.paddingLeft = bounds[i].left - expanded[i].left;
                divProperties.paddingTop = bounds[i].top - expanded[i].top;
                divProperties.paddingRight = expanded[i].right - bounds[i].right;
                divProperties.paddingBottom = expanded[i].bottom - bounds[i].bottom;
                task._textDivProperties.set(div, divProperties);
                continue;
            }
            // Box is rotated -- trying to find padding so rotated div will not
            // exceed its expanded bounds.
            const e = expanded[i], b = bounds[i];
            const m = b.m, c = m[0], s = m[1];
            // Finding intersections with expanded box.
            const points = [
                [0, 0],
                [0, b.size[1]],
                [b.size[0], 0],
                b.size,
            ];
            const ts = new Float64Array(64);
            for (let j = 0, jj = points.length; j < jj; j++) {
                const t = Util.applyTransform(points[j], m);
                ts[j + 0] = c && (e.left - t[0]) / c;
                ts[j + 4] = s && (e.top - t[1]) / s;
                ts[j + 8] = c && (e.right - t[0]) / c;
                ts[j + 12] = s && (e.bottom - t[1]) / s;
                ts[j + 16] = s && (e.left - t[0]) / -s;
                ts[j + 20] = c && (e.top - t[1]) / c;
                ts[j + 24] = s && (e.right - t[0]) / -s;
                ts[j + 28] = c && (e.bottom - t[1]) / c;
                ts[j + 32] = c && (e.left - t[0]) / -c;
                ts[j + 36] = s && (e.top - t[1]) / -s;
                ts[j + 40] = c && (e.right - t[0]) / -c;
                ts[j + 44] = s && (e.bottom - t[1]) / -s;
                ts[j + 48] = s && (e.left - t[0]) / s;
                ts[j + 52] = c && (e.top - t[1]) / -c;
                ts[j + 56] = s && (e.right - t[0]) / s;
                ts[j + 60] = c && (e.bottom - t[1]) / -c;
            }
            // Not based on math, but to simplify calculations, using cos and sin
            // absolute values to not exceed the box (it can but insignificantly).
            const boxScale = 1 + Math.min(Math.abs(c), Math.abs(s));
            divProperties.paddingLeft = findPositiveMin(ts, 32, 16) / boxScale;
            divProperties.paddingTop = findPositiveMin(ts, 48, 16) / boxScale;
            divProperties.paddingRight = findPositiveMin(ts, 0, 16) / boxScale;
            divProperties.paddingBottom = findPositiveMin(ts, 16, 16) / boxScale;
            task._textDivProperties.set(div, divProperties);
        }
    }
    function expandBounds(width, height, boxes) {
        const bounds = boxes.map((box, i) => {
            return {
                x1: box.left,
                y1: box.top,
                x2: box.right,
                y2: box.bottom,
                index: i,
                x1New: undefined,
                x2New: undefined,
            };
        });
        expandBoundsLTR(width, bounds);
        const expanded = new Array(boxes.length);
        for (const b of bounds) {
            const i = b.index;
            expanded[i] = {
                left: b.x1New,
                top: 0,
                right: b.x2New,
                bottom: 0,
            };
        }
        // Rotating on 90 degrees and extending extended boxes. Reusing the bounds
        // array and objects.
        boxes.map((box, i) => {
            const e = expanded[i], b = bounds[i];
            b.x1 = box.top;
            b.y1 = width - e.right;
            b.x2 = box.bottom;
            b.y2 = width - e.left;
            b.index = i;
            b.x1New = undefined;
            b.x2New = undefined;
        });
        expandBoundsLTR(height, bounds);
        for (const b of bounds) {
            const i = b.index;
            expanded[i].top = b.x1New;
            expanded[i].bottom = b.x2New;
        }
        return expanded;
    }
    function expandBoundsLTR(width, bounds) {
        // Sorting by x1 coordinate and walk by the bounds in the same order.
        bounds.sort((a, b) => a.x1 - b.x1 || a.index - b.index);
        // First we see on the horizon is a fake boundary.
        const fakeBoundary = {
            x1: -Infinity,
            y1: -Infinity,
            x2: 0,
            y2: Infinity,
            index: -1,
            x1New: 0,
            x2New: 0,
        };
        const horizon = [
            {
                start: -Infinity,
                end: Infinity,
                boundary: fakeBoundary,
            },
        ];
        for (const boundary of bounds) {
            // Searching for the affected part of horizon.
            // TODO red-black tree or simple binary search
            let i = 0;
            while (i < horizon.length && horizon[i].end <= boundary.y1) {
                i++;
            }
            let j = horizon.length - 1;
            while (j >= 0 && horizon[j].start >= boundary.y2) {
                j--;
            }
            let horizonPart, affectedBoundary;
            let q, k, maxXNew = -Infinity;
            for (q = i; q <= j; q++) {
                horizonPart = horizon[q];
                affectedBoundary = horizonPart.boundary;
                let xNew;
                if (affectedBoundary.x2 > boundary.x1) {
                    // In the middle of the previous element, new x shall be at the
                    // boundary start. Extending if further if the affected boundary
                    // placed on top of the current one.
                    xNew = affectedBoundary.index > boundary.index
                        ? affectedBoundary.x1New
                        : boundary.x1;
                }
                else if (affectedBoundary.x2New === undefined) {
                    // We have some space in between, new x in middle will be a fair
                    // choice.
                    xNew = (affectedBoundary.x2 + boundary.x1) / 2;
                }
                else {
                    // Affected boundary has x2new set, using it as new x.
                    xNew = affectedBoundary.x2New;
                }
                if (xNew > maxXNew) {
                    maxXNew = xNew;
                }
            }
            // Set new x1 for current boundary.
            boundary.x1New = maxXNew;
            // Adjusts new x2 for the affected boundaries.
            for (q = i; q <= j; q++) {
                horizonPart = horizon[q];
                affectedBoundary = horizonPart.boundary;
                if (affectedBoundary.x2New === undefined) {
                    // Was not set yet, choosing new x if possible.
                    if (affectedBoundary.x2 > boundary.x1) {
                        // Current and affected boundaries intersect. If affected boundary
                        // is placed on top of the current, shrinking the affected.
                        if (affectedBoundary.index > boundary.index) {
                            affectedBoundary.x2New = affectedBoundary.x2;
                        }
                    }
                    else {
                        affectedBoundary.x2New = maxXNew;
                    }
                }
                else if (affectedBoundary.x2New > maxXNew) {
                    // Affected boundary is touching new x, pushing it back.
                    affectedBoundary.x2New = Math.max(maxXNew, affectedBoundary.x2);
                }
            }
            // Fixing the horizon.
            const changedHorizon = [];
            let lastBoundary = null;
            for (q = i; q <= j; q++) {
                horizonPart = horizon[q];
                affectedBoundary = horizonPart.boundary;
                // Checking which boundary will be visible.
                const useBoundary = affectedBoundary.x2 > boundary.x2
                    ? affectedBoundary
                    : boundary;
                if (lastBoundary === useBoundary) {
                    // Merging with previous.
                    changedHorizon.at(-1).end = horizonPart.end;
                }
                else {
                    changedHorizon.push({
                        start: horizonPart.start,
                        end: horizonPart.end,
                        boundary: useBoundary,
                    });
                    lastBoundary = useBoundary;
                }
            }
            if (horizon[i].start < boundary.y1) {
                changedHorizon[0].start = boundary.y1;
                changedHorizon.unshift({
                    start: horizon[i].start,
                    end: boundary.y1,
                    boundary: horizon[i].boundary,
                });
            }
            if (boundary.y2 < horizon[j].end) {
                changedHorizon.at(-1).end = boundary.y2;
                changedHorizon.push({
                    start: boundary.y2,
                    end: horizon[j].end,
                    boundary: horizon[j].boundary,
                });
            }
            // Set x2 new of boundary that is no longer visible (see overlapping case
            // above).
            // TODO more efficient, e.g. via reference counting.
            for (q = i; q <= j; q++) {
                horizonPart = horizon[q];
                affectedBoundary = horizonPart.boundary;
                if (affectedBoundary.x2New !== undefined) {
                    continue;
                }
                let used = false;
                for (k = i - 1; !used && k >= 0 && horizon[k].start >= affectedBoundary.y1; k--) {
                    used = horizon[k].boundary === affectedBoundary;
                }
                for (k = j + 1; !used && k < horizon.length && horizon[k].end <= affectedBoundary.y2; k++) {
                    used = horizon[k].boundary === affectedBoundary;
                }
                for (k = 0; !used && k < changedHorizon.length; k++) {
                    used = changedHorizon[k].boundary === affectedBoundary;
                }
                if (!used) {
                    affectedBoundary.x2New = maxXNew;
                }
            }
            Array.prototype.splice.apply(horizon, [i, j - i + 1, ...changedHorizon]);
        }
        // Set new x2 for all unset boundaries.
        for (const horizonPart of horizon) {
            const affectedBoundary = horizonPart.boundary;
            if (affectedBoundary.x2New === undefined) {
                affectedBoundary.x2New = Math.max(width, affectedBoundary.x2);
            }
        }
    }
    /**
     * Text layer rendering task.
     */
    class TextLayerRenderTask {
        _textContent;
        _textContentStream;
        _container;
        _document;
        _viewport;
        _textDivs;
        _textContentItemsStr;
        _fontInspectorEnabled;
        _devicePixelRatio;
        _reader;
        _layoutTextLastFontSize;
        _layoutTextLastFontFamily = null;
        _layoutTextCtx = null;
        _textDivProperties = new WeakMap();
        _renderingDone = false;
        _canceled = false;
        _capability = createPromiseCap();
        #renderTimer;
        _bounds = [];
        constructor({ textContent, textContentStream, container, viewport, textDivs, textContentItemsStr, }) {
            this._textContent = textContent;
            this._textContentStream = textContentStream;
            this._container = container;
            this._document = container.ownerDocument;
            this._viewport = viewport;
            this._textDivs = textDivs || [];
            this._textContentItemsStr = textContentItemsStr || [];
            this._fontInspectorEnabled = !!globalThis.FontInspector?.enabled;
            this._devicePixelRatio = globalThis.devicePixelRatio || 1;
            // Always clean-up the temporary canvas once rendering is no longer pending.
            this._capability.promise
                .finally(() => {
                // The `textDiv` properties are no longer needed.
                this._textDivProperties = undefined;
                if (this._layoutTextCtx) {
                    // Zeroing the width and height cause Firefox to release graphics
                    // resources immediately, which can greatly reduce memory consumption.
                    this._layoutTextCtx.canvas.width = 0;
                    this._layoutTextCtx.canvas.height = 0;
                    this._layoutTextCtx = null;
                }
            }).catch(() => {
                // Avoid "Uncaught promise" messages in the console.
            });
        }
        /**
         * Promise for textLayer rendering task completion.
         */
        get promise() {
            return this._capability.promise;
        }
        /**
         * Cancel rendering of the textLayer.
         */
        cancel() {
            this._canceled = true;
            if (this._reader) {
                this._reader
                    .cancel(new AbortException("TextLayer task cancelled."))
                    .catch(() => {
                    // Avoid "Uncaught promise" messages in the console.
                });
                this._reader = undefined;
            }
            if (this.#renderTimer !== undefined) {
                clearTimeout(this.#renderTimer);
                this.#renderTimer = undefined;
            }
            this._capability.reject(new Error("TextLayer task cancelled."));
        }
        #processItems(items, styleCache) {
            for (const item of items) {
                if (item.str === undefined) {
                    if (item.type === "beginMarkedContentProps" ||
                        item.type === "beginMarkedContent") {
                        const parent = this._container;
                        this._container = html("span");
                        this._container.classList.add("markedContent");
                        if (item.id !== undefined) {
                            this._container.setAttribute("id", `${item.id}`);
                        }
                        parent.append(this._container);
                    }
                    else if (item.type === "endMarkedContent") {
                        this._container = this._container
                            .parentNode;
                    }
                    continue;
                }
                this._textContentItemsStr.push(item.str);
                appendText(this, item, styleCache, this._layoutTextCtx);
            }
        }
        /**
         * @private
         */
        _layoutText(textDiv) {
            const textDivProperties = this._textDivProperties.get(textDiv);
            let transform = "";
            if (textDivProperties.canvasWidth !== 0 && textDivProperties.hasText) {
                const { fontFamily } = textDiv.style;
                const { fontSize } = textDivProperties;
                // Only build font string and set to context if different from last.
                if (fontSize !== this._layoutTextLastFontSize ||
                    fontFamily !== this._layoutTextLastFontFamily) {
                    this._layoutTextCtx.font = `${fontSize * this._devicePixelRatio}px ${fontFamily}`;
                    this._layoutTextLastFontSize = fontSize;
                    this._layoutTextLastFontFamily = fontFamily;
                }
                // Only measure the width for multi-char text divs, see `appendText`.
                const { width } = this._layoutTextCtx.measureText(textDiv.textContent);
                if (width > 0) {
                    transform = `scaleX(${(this._devicePixelRatio * textDivProperties.canvasWidth) / width})`;
                }
            }
            if (textDivProperties.angle !== 0) {
                transform = `rotate(${textDivProperties.angle}deg) ${transform}`;
            }
            if (transform.length > 0) {
                textDiv.style.transform = transform;
            }
            if (textDivProperties.hasText) {
                this._container.append(textDiv);
            }
            if (textDivProperties.hasEOL) {
                const br = html("br");
                br.setAttribute("role", "presentation");
                this._container.append(br);
            }
        }
        /**
         * @private
         */
        _render(timeout) {
            const capability = createPromiseCap();
            let styleCache = Object.create(null);
            // The temporary canvas is used to measure text length in the DOM.
            const canvas = html("canvas", undefined, this._document);
            canvas.height = canvas.width = DEFAULT_FONT_SIZE;
            this._layoutTextCtx = canvas.getContext("2d", { alpha: false });
            if (this._textContent) {
                const textItems = this._textContent.items;
                const textStyles = this._textContent.styles;
                this.#processItems(textItems, textStyles);
                capability.resolve();
            }
            else if (this._textContentStream) {
                const pump = () => {
                    this._reader.read().then(({ value, done }) => {
                        if (done) {
                            capability.resolve();
                            return;
                        }
                        Object.assign(styleCache, value.styles);
                        this.#processItems(value.items, styleCache);
                        pump();
                    }, capability.reject);
                };
                this._reader = this._textContentStream.getReader();
                pump();
            }
            else {
                throw new Error('Neither "textContent" nor "textContentStream" parameters specified.');
            }
            capability.promise.then(() => {
                styleCache = null;
                if (!timeout) {
                    // Render right away
                    render(this);
                }
                else {
                    // Schedule
                    this.#renderTimer = setTimeout(() => {
                        render(this);
                        this.#renderTimer = undefined;
                    }, timeout);
                }
            }, this._capability.reject);
        }
    }
    Ns_renderTextLayer.TextLayerRenderTask = TextLayerRenderTask;
    function renderTextLayer(renderParameters) {
        const task = new TextLayerRenderTask({
            textContent: renderParameters.textContent,
            textContentStream: renderParameters.textContentStream,
            container: renderParameters.container,
            viewport: renderParameters.viewport,
            textDivs: renderParameters.textDivs,
            textContentItemsStr: renderParameters.textContentItemsStr,
        });
        task._render(renderParameters.timeout);
        return task;
    }
    Ns_renderTextLayer.renderTextLayer = renderTextLayer;
})(Ns_renderTextLayer || (Ns_renderTextLayer = {}));
export var TextLayerRenderTask = Ns_renderTextLayer.TextLayerRenderTask;
export var renderTextLayer = Ns_renderTextLayer.renderTextLayer;
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=text_layer.js.map