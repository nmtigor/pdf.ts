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
/** @typedef {import("./event_utils").EventBus} EventBus */
/** @typedef {import("./text_highlighter").TextHighlighter} TextHighlighter */
// eslint-disable-next-line max-len
/** @typedef {import("./text_accessibility.js").TextAccessibilityManager} TextAccessibilityManager */
import { GENERIC, MOZCENTRAL } from "../../global.js";
import { html } from "../../lib/dom.js";
import { renderTextLayer, } from "../pdf.ts-src/pdf.js";
/**
 * The text layer builder provides text selection functionality for the PDF.
 * It does this by creating overlay divs over the PDF's text. These divs
 * contain text that matches the PDF text they are overlaying.
 */
export class TextLayerBuilder {
    textLayerDiv;
    eventBus;
    textContent;
    textContentItemsStr = [];
    textContentStream;
    renderingDone = false;
    pageNumber;
    matches = [];
    viewport;
    textDivs = [];
    textLayerRenderTask;
    highlighter;
    accessibilityManager;
    constructor({ textLayerDiv, eventBus, pageIndex, viewport, highlighter, accessibilityManager = undefined, }) {
        this.textLayerDiv = textLayerDiv;
        this.eventBus = eventBus;
        this.pageNumber = pageIndex + 1;
        this.viewport = viewport;
        this.highlighter = highlighter;
        this.accessibilityManager = accessibilityManager;
        this.#bindMouse();
    }
    #finishRendering() {
        this.renderingDone = true;
        const endOfContent = html("div");
        endOfContent.className = "endOfContent";
        this.textLayerDiv.append(endOfContent);
        this.eventBus.dispatch("textlayerrendered", {
            source: this,
            pageNumber: this.pageNumber,
            numTextDivs: this.textDivs.length,
        });
    }
    /**
     * Renders the text layer.
     *
     * @param timeout Wait for a specified amount of milliseconds before rendering.
     */
    render(timeout = 0) {
        if (!(this.textContent || this.textContentStream) || this.renderingDone) {
            return;
        }
        this.cancel();
        this.textDivs.length = 0;
        this.highlighter?.setTextMapping(this.textDivs, this.textContentItemsStr);
        this.accessibilityManager?.setTextMapping(this.textDivs);
        const textLayerFrag = document.createDocumentFragment();
        this.textLayerRenderTask = renderTextLayer({
            textContent: this.textContent,
            textContentStream: this.textContentStream,
            container: textLayerFrag,
            viewport: this.viewport,
            textDivs: this.textDivs,
            textContentItemsStr: this.textContentItemsStr,
            timeout,
        });
        this.textLayerRenderTask.promise.then(() => {
            this.textLayerDiv.append(textLayerFrag);
            this.#finishRendering();
            this.highlighter?.enable();
            this.accessibilityManager?.enable();
        }, (reason) => {
            // Cancelled or failed to render text layer; skipping errors.
        });
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
    }
    setTextContentStream(readableStream) {
        this.cancel();
        this.textContentStream = readableStream;
    }
    setTextContent(textContent) {
        this.cancel();
        this.textContent = textContent;
    }
    /**
     * Improves text selection by adding an additional div where the mouse was
     * clicked. This reduces flickering of the content if the mouse is slowly
     * dragged up or down.
     */
    #bindMouse() {
        const div = this.textLayerDiv;
        // let expandDivsTimer: number | undefined;
        div.addEventListener("mousedown", (evt) => {
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
        div.addEventListener("mouseup", () => {
            const end = div.querySelector(".endOfContent");
            if (!end) {
                return;
            }
            /*#static*/  {
                end.style.top = "";
            }
            end.classList.remove("active");
        });
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=text_layer_builder.js.map