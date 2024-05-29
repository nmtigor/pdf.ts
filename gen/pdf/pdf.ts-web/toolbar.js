/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/toolbar.ts
 * @license Apache-2.0
 ******************************************************************************/
/* Copyright 2016 Mozilla Foundation
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
import { noContextMenu } from "../../lib/util/general.js";
import { AnnotationEditorType, ColorPicker } from "../pdf.ts-src/pdf.js";
import { DEFAULT_SCALE, DEFAULT_SCALE_VALUE, MAX_SCALE, MIN_SCALE, toggleCheckedBtn, } from "./ui_utils.js";
export class Toolbar {
    #opts;
    eventBus;
    //kkkk TOCLEANUP
    // buttons: ToolbarButton[];
    // items: ToolbarItems;
    pageNumber;
    pageLabel;
    hasPageLabels;
    pagesCount;
    pageScaleValue;
    pageScale;
    constructor(options, eventBus) {
        this.#opts = options;
        this.eventBus = eventBus;
        const buttons = [
            { element: options.previous, eventName: "previouspage" },
            { element: options.next, eventName: "nextpage" },
            { element: options.zoomIn, eventName: "zoomin" },
            { element: options.zoomOut, eventName: "zoomout" },
            { element: options.print, eventName: "print" },
            { element: options.download, eventName: "download" },
            {
                element: options.editorFreeTextButton,
                eventName: "switchannotationeditormode",
                eventDetails: {
                    get mode() {
                        const { classList } = options.editorFreeTextButton;
                        return classList.contains("toggled")
                            ? AnnotationEditorType.NONE
                            : AnnotationEditorType.FREETEXT;
                    },
                },
            },
            {
                element: options.editorHighlightButton,
                eventName: "switchannotationeditormode",
                eventDetails: {
                    get mode() {
                        const { classList } = options.editorHighlightButton;
                        return classList.contains("toggled")
                            ? AnnotationEditorType.NONE
                            : AnnotationEditorType.HIGHLIGHT;
                    },
                },
            },
            {
                element: options.editorInkButton,
                eventName: "switchannotationeditormode",
                eventDetails: {
                    get mode() {
                        const { classList } = options.editorInkButton;
                        return classList.contains("toggled")
                            ? AnnotationEditorType.NONE
                            : AnnotationEditorType.INK;
                    },
                },
            },
            {
                element: options.editorStampButton,
                eventName: "switchannotationeditormode",
                eventDetails: {
                    get mode() {
                        const { classList } = options.editorStampButton;
                        return classList.contains("toggled")
                            ? AnnotationEditorType.NONE
                            : AnnotationEditorType.STAMP;
                    },
                },
            },
        ];
        //kkkk TOCLEANUP
        // this.items = {
        //   numPages: options.numPages,
        //   pageNumber: options.pageNumber,
        //   scaleSelect: options.scaleSelect,
        //   customScaleOption: options.customScaleOption,
        //   previous: options.previous,
        //   next: options.next,
        //   zoomIn: options.zoomIn,
        //   zoomOut: options.zoomOut,
        // };
        // Bind the event listeners for click and various other actions.
        this.#bindListeners(buttons);
        if (options.editorHighlightColorPicker) {
            eventBus._on("annotationeditoruimanager", ({ uiManager }) => {
                this.#setAnnotationEditorUIManager(uiManager, options.editorHighlightColorPicker);
            }, 
            // Once the color picker has been added, we don't want to add it again.
            { once: true });
        }
        eventBus._on("showannotationeditorui", ({ mode }) => {
            switch (mode) {
                case AnnotationEditorType.HIGHLIGHT:
                    options.editorHighlightButton.click();
                    break;
            }
        });
        this.reset();
    }
    #setAnnotationEditorUIManager(uiManager, parentContainer) {
        const colorPicker = new ColorPicker({ uiManager });
        uiManager.setMainHighlightColorPicker(colorPicker);
        parentContainer.append(colorPicker.renderMainDropdown());
    }
    setPageNumber(pageNumber, pageLabel) {
        this.pageNumber = pageNumber;
        this.pageLabel = pageLabel;
        this.#updateUIState(false);
    }
    setPagesCount(pagesCount, hasPageLabels) {
        this.pagesCount = pagesCount;
        this.hasPageLabels = hasPageLabels;
        this.#updateUIState(true);
    }
    setPageScale(pageScaleValue, pageScale) {
        this.pageScaleValue = (pageScaleValue || pageScale).toString();
        this.pageScale = pageScale;
        this.#updateUIState(false);
    }
    reset() {
        this.pageNumber = 0;
        this.pageLabel = undefined;
        this.hasPageLabels = false;
        this.pagesCount = 0;
        this.pageScaleValue = DEFAULT_SCALE_VALUE;
        this.pageScale = DEFAULT_SCALE;
        this.#updateUIState(true);
        this.updateLoadingIndicatorState();
        // Reset the Editor buttons too, since they're document specific.
        this.#editorModeChanged({ mode: AnnotationEditorType.DISABLE });
    }
    #bindListeners(buttons) {
        const { eventBus } = this;
        const { pageNumber, scaleSelect } = this.#opts;
        const self = this;
        // The buttons within the toolbar.
        for (const { element, eventName, eventDetails } of buttons) {
            element.on("click", (evt) => {
                if (eventName !== null) {
                    eventBus.dispatch(eventName, {
                        source: this,
                        ...eventDetails,
                        // evt.detail is the number of clicks.
                        isFromKeyboard: evt.detail === 0,
                    });
                }
            });
        }
        // The non-button elements within the toolbar.
        pageNumber.on("click", function () {
            this.select();
        });
        pageNumber.on("change", function () {
            eventBus.dispatch("pagenumberchanged", {
                source: self,
                value: this.value,
            });
        });
        scaleSelect.on("change", function () {
            if (this.value === "custom")
                return;
            eventBus.dispatch("scalechanged", {
                source: self,
                value: this.value,
            });
        });
        // Here we depend on browsers dispatching the "click" event *after* the
        // "change" event, when the <select>-element changes.
        scaleSelect.on("click", function ({ target }) {
            // Remove focus when an <option>-element was *clicked*, to improve the UX
            // for mouse users (fixes bug 1300525 and issue 4923).
            if (this.value === self.pageScaleValue &&
                target.tagName.toUpperCase() === "OPTION") {
                this.blur();
            }
        });
        // Suppress context menus for some controls.
        scaleSelect.oncontextmenu = noContextMenu;
        eventBus._on("annotationeditormodechanged", this.#editorModeChanged.bind(this));
    }
    #editorModeChanged({ mode }) {
        const { editorFreeTextButton, editorFreeTextParamsToolbar, editorHighlightButton, editorHighlightParamsToolbar, editorInkButton, editorInkParamsToolbar, editorStampButton, editorStampParamsToolbar, } = this.#opts;
        toggleCheckedBtn(editorFreeTextButton, mode === AnnotationEditorType.FREETEXT, editorFreeTextParamsToolbar);
        toggleCheckedBtn(editorHighlightButton, mode === AnnotationEditorType.HIGHLIGHT, editorHighlightParamsToolbar);
        toggleCheckedBtn(editorInkButton, mode === AnnotationEditorType.INK, editorInkParamsToolbar);
        toggleCheckedBtn(editorStampButton, mode === AnnotationEditorType.STAMP, editorStampParamsToolbar);
        const isDisable = mode === AnnotationEditorType.DISABLE;
        editorFreeTextButton.disabled = isDisable;
        editorHighlightButton.disabled = isDisable;
        editorInkButton.disabled = isDisable;
        editorStampButton.disabled = isDisable;
        //kkkk TOCLEANUP
        // this.eventBus._on("annotationeditormodechanged", editorModeChanged);
        // this.eventBus._on("toolbarreset", (evt) => {
        //   if (evt.source === this) {
        //     editorModeChanged(
        //       {
        //         mode: AnnotationEditorType.DISABLE,
        //       } as EventMap["annotationeditormodechanged"],
        //     );
        //   }
        // });
    }
    #updateUIState = (resetNumPages = false) => {
        const { pageNumber, pagesCount, pageScaleValue, pageScale } = this;
        const opts = this.#opts;
        if (resetNumPages) {
            if (this.hasPageLabels) {
                opts.pageNumber.type = "text";
                opts.numPages.setAttribute("data-l10n-id", "pdfjs-page-of-pages");
            }
            else {
                opts.pageNumber.type = "number";
                opts.numPages.assignAttro({
                    "data-l10n-id": "pdfjs-of-pages",
                    "data-l10n-args": JSON.stringify({ pagesCount }),
                });
            }
            opts.pageNumber.max = pagesCount;
        }
        if (this.hasPageLabels) {
            opts.pageNumber.value = this.pageLabel;
            opts.numPages.setAttribute("data-l10n-args", JSON.stringify({ pageNumber, pagesCount }));
        }
        else {
            opts.pageNumber.value = pageNumber;
        }
        opts.previous.disabled = pageNumber <= 1;
        opts.next.disabled = pageNumber >= pagesCount;
        opts.zoomOut.disabled = pageScale <= MIN_SCALE;
        opts.zoomIn.disabled = pageScale >= MAX_SCALE;
        let predefinedValueFound = false;
        for (const option of opts.scaleSelect.options) {
            if (option.value !== pageScaleValue) {
                option.selected = false;
                continue;
            }
            option.selected = true;
            predefinedValueFound = true;
        }
        if (!predefinedValueFound) {
            opts.customScaleOption.selected = true;
            opts.customScaleOption.setAttribute("data-l10n-args", JSON.stringify({
                scale: Math.round(pageScale * 10000) / 100,
            }));
        }
    };
    updateLoadingIndicatorState(loading = false) {
        const { pageNumber } = this.#opts;
        pageNumber.classList.toggle("loading", loading);
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=toolbar.js.map