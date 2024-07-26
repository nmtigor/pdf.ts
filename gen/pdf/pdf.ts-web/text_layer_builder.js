/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/text_layer_builder.ts
 * @license Apache-2.0
 ******************************************************************************/
var _a;
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
import { html } from "../../lib/dom.js";
import { CHROME, MOZCENTRAL, PDFJSDev } from "../../global.js";
import { normalizeUnicode, TextLayer } from "../pdf.ts-src/pdf.js";
import { removeNullCharacters } from "./ui_utils.js";
/**
 * The text layer builder provides text selection functionality for the PDF.
 * It does this by creating overlay divs over the PDF's text. These divs
 * contain text that matches the PDF text they are overlaying.
 */
export class TextLayerBuilder {
    //kkkk TOCLEANUP
    // textContentItemsStr: string[] = [];
    //kkkk TOCLEANUP
    // textDivs: HTMLDivElement[] = [];
    // get numTextDivs() {
    //   return this.textDivs.length;
    // }
    pdfPage;
    //kkkk TOCLEANUP
    // textDivProperties = new WeakMap<HTMLElement, TextDivProps>();
    highlighter;
    accessibilityManager;
    #enablePermissions;
    #onAppend;
    #renderingDone = false;
    #textLayer;
    //kkkk TOCLEANUP
    // #textContentSource: ReadableStream<TextContent> | TextContent | undefined;
    div;
    static #textLayers = new Map();
    static #selectionChangeAbortController;
    constructor({ pdfPage, highlighter, accessibilityManager, enablePermissions = false, onAppend, }) {
        this.pdfPage = pdfPage;
        this.highlighter = highlighter;
        this.accessibilityManager = accessibilityManager;
        this.#enablePermissions = enablePermissions === true;
        this.#onAppend = onAppend;
        this.div = html("div");
        this.div.tabIndex = 0;
        this.div.className = "textLayer";
    }
    /**
     * Renders the text layer.
     */
    async render(viewport, textContentParams) {
        if (this.#renderingDone && this.#textLayer) {
            this.#textLayer.update({
                viewport,
                onBefore: this.hide.bind(this),
            });
            this.show();
            return;
        }
        this.cancel();
        this.#textLayer = new TextLayer({
            textContentSource: this.pdfPage.streamTextContent(textContentParams || {
                includeMarkedContent: true,
                disableNormalization: true,
            }),
            container: this.div,
            viewport,
        });
        const { textDivs, textContentItemsStr } = this.#textLayer;
        this.highlighter?.setTextMapping(textDivs, textContentItemsStr);
        this.accessibilityManager?.setTextMapping(textDivs);
        await this.#textLayer.render();
        this.#renderingDone = true;
        const endOfContent = html("div");
        endOfContent.className = "endOfContent";
        this.div.append(endOfContent);
        this.#bindMouse(endOfContent);
        // Ensure that the textLayer is appended to the DOM *before* handling
        // e.g. a pending search operation.
        this.#onAppend?.(this.div);
        this.highlighter?.enable();
        this.accessibilityManager?.enable();
    }
    hide() {
        if (!this.div.hidden && this.#renderingDone) {
            // We turn off the highlighter in order to avoid to scroll into view an
            // element of the text layer which could be hidden.
            this.highlighter?.disable();
            this.div.hidden = true;
        }
    }
    show() {
        if (this.div.hidden && this.#renderingDone) {
            this.div.hidden = false;
            this.highlighter?.enable();
        }
    }
    /**
     * Cancel rendering of the text layer.
     */
    cancel() {
        this.#textLayer?.cancel();
        this.#textLayer = undefined;
        this.highlighter?.disable();
        this.accessibilityManager?.disable();
        _a.#removeGlobalSelectionListener(this.div);
    }
    //kkkk TOCLEANUP
    // setTextContentSource(source: ReadableStream | TextContent) {
    //   this.cancel();
    //   this.#textContentSource = source;
    // }
    /**
     * Improves text selection by adding an additional div where the mouse was
     * clicked. This reduces flickering of the content if the mouse is slowly
     * dragged up or down.
     */
    #bindMouse(end) {
        const { div } = this;
        div.on("mousedown", (evt) => {
            //kkkk TOCLEANUP
            // const end = div.querySelector<HTMLElement>(".endOfContent");
            // if (!end) {
            //   return;
            // }
            // /*#static*/ if (PDFJSDev || !MOZCENTRAL) {
            //   // On non-Firefox browsers, the selection will feel better if the height
            //   // of the `endOfContent` div is adjusted to start at mouse click
            //   // location. This avoids flickering when the selection moves up.
            //   // However it does not work when selection is started on empty space.
            //   let adjustTop = evt.target !== div;
            //   /*#static*/ if (PDFJSDev || GENERIC) {
            //     adjustTop &&=
            //       getComputedStyle(end).getPropertyValue("-moz-user-select") !==
            //         "none";
            //   }
            //   if (adjustTop) {
            //     const divBounds = div.getBoundingClientRect();
            //     const r = Math.max(0, (evt.pageY - divBounds.top) / divBounds.height);
            //     end.style.top = (r * 100).toFixed(2) + "%";
            //   }
            // }
            end.classList.add("active");
        });
        //kkkk TOCLEANUP
        // div.on("mouseup", () => {
        //   const end = div.querySelector<HTMLElement>(".endOfContent");
        //   if (!end) {
        //     return;
        //   }
        //   /*#static*/ if (PDFJSDev || !MOZCENTRAL) {
        //     end.style.top = "";
        //   }
        //   end.classList.remove("active");
        // });
        div.on("copy", (event) => {
            if (!this.#enablePermissions) {
                const selection = document.getSelection();
                event.clipboardData.setData("text/plain", removeNullCharacters(normalizeUnicode(selection.toString())));
            }
            event.preventDefault();
            event.stopPropagation();
        });
        _a.#textLayers.set(div, end);
        _a.#enableGlobalSelectionListener();
    }
    static #removeGlobalSelectionListener(textLayerDiv) {
        this.#textLayers.delete(textLayerDiv);
        if (this.#textLayers.size === 0) {
            this.#selectionChangeAbortController?.abort();
            this.#selectionChangeAbortController = undefined;
        }
    }
    static #enableGlobalSelectionListener() {
        if (this.#selectionChangeAbortController) {
            // document-level event listeners already installed
            return;
        }
        this.#selectionChangeAbortController = new AbortController();
        const { signal } = this.#selectionChangeAbortController;
        const reset = (end, textLayer) => {
            /*#static*/  {
                textLayer.append(end);
                end.style.width = "";
                end.style.height = "";
            }
            end.classList.remove("active");
        };
        document.addEventListener("pointerup", () => {
            this.#textLayers.forEach(reset);
        }, { signal });
        /*#static*/  {
            // eslint-disable-next-line no-var
            var isFirefox, prevRange;
        }
        document.addEventListener("selectionchange", () => {
            const selection = document.getSelection();
            if (selection.rangeCount === 0) {
                this.#textLayers.forEach(reset);
                return;
            }
            // Even though the spec says that .rangeCount should be 0 or 1, Firefox
            // creates multiple ranges when selecting across multiple pages.
            // Make sure to collect all the .textLayer elements where the selection
            // is happening.
            const activeTextLayers = new Set();
            for (let i = 0; i < selection.rangeCount; i++) {
                const range = selection.getRangeAt(i);
                for (const textLayerDiv of this.#textLayers.keys()) {
                    if (!activeTextLayers.has(textLayerDiv) &&
                        range.intersectsNode(textLayerDiv)) {
                        activeTextLayers.add(textLayerDiv);
                    }
                }
            }
            for (const [textLayerDiv, endDiv] of this.#textLayers) {
                if (activeTextLayers.has(textLayerDiv)) {
                    endDiv.classList.add("active");
                }
                else {
                    reset(endDiv, textLayerDiv);
                }
            }
            /*#static*/ 
            /*#static*/  {
                isFirefox ??= getComputedStyle(this.#textLayers.values().next().value).getPropertyValue("-moz-user-select") === "none";
                if (isFirefox) {
                    return;
                }
            }
            // In non-Firefox browsers, when hovering over an empty space (thus,
            // on .endOfContent), the selection will expand to cover all the
            // text between the current selection and .endOfContent. By moving
            // .endOfContent to right after (or before, depending on which side
            // of the selection the user is moving), we limit the selection jump
            // to at most cover the enteirety of the <span> where the selection
            // is being modified.
            const range = selection.getRangeAt(0);
            const modifyStart = prevRange &&
                (range.compareBoundaryPoints(Range.END_TO_END, prevRange) === 0 ||
                    range.compareBoundaryPoints(Range.START_TO_END, prevRange) === 0);
            let anchor = modifyStart ? range.startContainer : range.endContainer;
            if (anchor.nodeType === Node.TEXT_NODE) {
                anchor = anchor.parentNode;
            }
            const parentTextLayer = anchor.parentElement.closest(".textLayer");
            const endDiv = this.#textLayers.get(parentTextLayer);
            if (endDiv) {
                endDiv.style.width = parentTextLayer.style.width;
                endDiv.style.height = parentTextLayer.style.height;
                anchor.parentElement.insertBefore(endDiv, modifyStart ? anchor : anchor.nextSibling);
            }
            prevRange = range.cloneRange();
        }, { signal });
    }
}
_a = TextLayerBuilder;
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=text_layer_builder.js.map