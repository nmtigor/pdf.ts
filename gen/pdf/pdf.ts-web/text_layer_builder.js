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
import { GENERIC, MOZCENTRAL, PDFJSDev } from "../../global.js";
import { div as createDiv, html } from "../../lib/dom.js";
import { normalizeUnicode, renderTextLayer, updateTextLayer, } from "../pdf.ts-src/pdf.js";
import { removeNullCharacters } from "./ui_utils.js";
/**
 * The text layer builder provides text selection functionality for the PDF.
 * It does this by creating overlay divs over the PDF's text. These divs
 * contain text that matches the PDF text they are overlaying.
 */
export class TextLayerBuilder {
    textContentItemsStr = [];
    renderingDone = false;
    textDivs = [];
    get numTextDivs() {
        return this.textDivs.length;
    }
    textDivProperties = new WeakMap();
    textLayerRenderTask;
    highlighter;
    accessibilityManager;
    isOffscreenCanvasSupported;
    #enablePermissions;
    /**
     * Callback used to attach the textLayer to the DOM.
     */
    onAppend;
    div;
    #rotation = 0;
    #scale = 0;
    #textContentSource;
    constructor({ highlighter, accessibilityManager = undefined, isOffscreenCanvasSupported = undefined, enablePermissions = false, }) {
        this.highlighter = highlighter;
        this.accessibilityManager = accessibilityManager;
        this.isOffscreenCanvasSupported = isOffscreenCanvasSupported;
        this.#enablePermissions = enablePermissions === true;
        this.div = createDiv();
        this.div.className = "textLayer";
    }
    #finishRendering() {
        this.renderingDone = true;
        const endOfContent = html("div");
        endOfContent.className = "endOfContent";
        this.div.append(endOfContent);
        this.#bindMouse();
    }
    /**
     * Renders the text layer.
     */
    async render(viewport) {
        if (!this.#textContentSource) {
            throw new Error('No "textContentSource" parameter specified.');
        }
        const scale = viewport.scale * (globalThis.devicePixelRatio || 1);
        const { rotation } = viewport;
        if (this.renderingDone) {
            const mustRotate = rotation !== this.#rotation;
            const mustRescale = scale !== this.#scale;
            if (mustRotate || mustRescale) {
                this.hide();
                updateTextLayer({
                    container: this.div,
                    viewport,
                    textDivs: this.textDivs,
                    textDivProperties: this.textDivProperties,
                    isOffscreenCanvasSupported: this.isOffscreenCanvasSupported,
                    mustRescale,
                    mustRotate,
                });
                this.#scale = scale;
                this.#rotation = rotation;
            }
            this.show();
            return;
        }
        this.cancel();
        this.highlighter?.setTextMapping(this.textDivs, this.textContentItemsStr);
        this.accessibilityManager?.setTextMapping(this.textDivs);
        this.textLayerRenderTask = renderTextLayer({
            textContentSource: this.#textContentSource,
            container: this.div,
            viewport,
            textDivs: this.textDivs,
            textDivProperties: this.textDivProperties,
            textContentItemsStr: this.textContentItemsStr,
            isOffscreenCanvasSupported: this.isOffscreenCanvasSupported,
        });
        await this.textLayerRenderTask.promise;
        this.#finishRendering();
        this.#scale = scale;
        this.#rotation = rotation;
        // Ensure that the textLayer is appended to the DOM *before* handling
        // e.g. a pending search operation.
        this.onAppend(this.div);
        this.highlighter?.enable();
        this.accessibilityManager?.enable();
    }
    hide() {
        if (!this.div.hidden && this.renderingDone) {
            // We turn off the highlighter in order to avoid to scroll into view an
            // element of the text layer which could be hidden.
            this.highlighter?.disable();
            this.div.hidden = true;
        }
    }
    show() {
        if (this.div.hidden && this.renderingDone) {
            this.div.hidden = false;
            this.highlighter?.enable();
        }
    }
    /**
     * Cancel rendering of the text layer.
     */
    cancel() {
        if (this.textLayerRenderTask) {
            this.textLayerRenderTask.cancel();
            this.textLayerRenderTask = undefined;
        }
        this.highlighter?.disable();
        this.accessibilityManager?.disable();
        this.textContentItemsStr.length = 0;
        this.textDivs.length = 0;
        this.textDivProperties = new WeakMap();
    }
    setTextContentSource(source) {
        this.cancel();
        this.#textContentSource = source;
    }
    /**
     * Improves text selection by adding an additional div where the mouse was
     * clicked. This reduces flickering of the content if the mouse is slowly
     * dragged up or down.
     */
    #bindMouse() {
        const { div } = this;
        div.on("mousedown", (evt) => {
            const end = div.querySelector(".endOfContent");
            if (!end) {
                return;
            }
            /*#static*/  {
                // On non-Firefox browsers, the selection will feel better if the height
                // of the `endOfContent` div is adjusted to start at mouse click
                // location. This avoids flickering when the selection moves up.
                // However it does not work when selection is started on empty space.
                let adjustTop = evt.target !== div;
                /*#static*/  {
                    adjustTop &&=
                        getComputedStyle(end).getPropertyValue("-moz-user-select") !==
                            "none";
                }
                if (adjustTop) {
                    const divBounds = div.getBoundingClientRect();
                    const r = Math.max(0, (evt.pageY - divBounds.top) / divBounds.height);
                    end.style.top = (r * 100).toFixed(2) + "%";
                }
            }
            end.classList.add("active");
        });
        div.on("mouseup", () => {
            const end = div.querySelector(".endOfContent");
            if (!end) {
                return;
            }
            /*#static*/  {
                end.style.top = "";
            }
            end.classList.remove("active");
        });
        div.on("copy", (event) => {
            if (!this.#enablePermissions) {
                const selection = document.getSelection();
                event.clipboardData.setData("text/plain", removeNullCharacters(normalizeUnicode(selection.toString())));
            }
            event.preventDefault();
            event.stopPropagation();
        });
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=text_layer_builder.js.map