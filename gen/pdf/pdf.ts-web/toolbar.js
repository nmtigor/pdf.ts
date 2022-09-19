/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
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
import { GENERIC } from "../../global.js";
import { html } from "../../lib/dom.js";
import { AnnotationEditorType } from "../pdf.ts-src/pdf.js";
import { animationStarted, DEFAULT_SCALE, DEFAULT_SCALE_VALUE, docStyle, MAX_SCALE, MIN_SCALE, noContextMenuHandler, } from "./ui_utils.js";
/*80--------------------------------------------------------------------------*/
const PAGE_NUMBER_LOADING_INDICATOR = "visiblePageIsLoading";
export class Toolbar {
    toolbar;
    eventBus;
    l10n;
    buttons;
    items;
    _wasLocalized = false;
    pageNumber;
    pageLabel;
    hasPageLabels;
    pagesCount;
    pageScaleValue;
    pageScale;
    constructor(options, eventBus, l10n) {
        this.toolbar = options.container;
        this.eventBus = eventBus;
        this.l10n = l10n;
        this.buttons = [
            { element: options.previous, eventName: "previouspage" },
            { element: options.next, eventName: "nextpage" },
            { element: options.zoomIn, eventName: "zoomin" },
            { element: options.zoomOut, eventName: "zoomout" },
            { element: options.print, eventName: "print" },
            {
                element: options.presentationModeButton,
                eventName: "presentationmode",
            },
            { element: options.download, eventName: "download" },
            { element: options.viewBookmark, eventName: null },
            {
                element: options.editorNoneButton,
                eventName: "switchannotationeditormode",
                eventDetails: { mode: AnnotationEditorType.NONE },
            },
            {
                element: options.editorFreeTextButton,
                eventName: "switchannotationeditormode",
                eventDetails: { mode: AnnotationEditorType.FREETEXT },
            },
            {
                element: options.editorInkButton,
                eventName: "switchannotationeditormode",
                eventDetails: { mode: AnnotationEditorType.INK },
            },
        ];
        /*#static*/  {
            this.buttons.push({ element: options.openFile, eventName: "openfile" });
        }
        this.items = {
            numPages: options.numPages,
            pageNumber: options.pageNumber,
            scaleSelect: options.scaleSelect,
            customScaleOption: options.customScaleOption,
            previous: options.previous,
            next: options.next,
            zoomIn: options.zoomIn,
            zoomOut: options.zoomOut,
            editorNoneButton: options.editorNoneButton,
            editorFreeTextButton: options.editorFreeTextButton,
            editorFreeTextParamsToolbar: options.editorFreeTextParamsToolbar,
            editorInkButton: options.editorInkButton,
            editorInkParamsToolbar: options.editorInkParamsToolbar,
        };
        this.reset();
        // Bind the event listeners for click and various other actions.
        this.#bindListeners(options);
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
        this.eventBus.dispatch("toolbarreset", { source: this });
    }
    #bindListeners(options) {
        const { pageNumber, scaleSelect } = this.items;
        const self = this;
        // The buttons within the toolbar.
        for (const { element, eventName, eventDetails } of this.buttons) {
            element.addEventListener("click", (evt) => {
                if (eventName !== null) {
                    const details = { source: this };
                    if (eventDetails) {
                        for (const property in eventDetails) {
                            details[property] =
                                eventDetails[property];
                        }
                    }
                    this.eventBus.dispatch(eventName, details);
                }
            });
        }
        // The non-button elements within the toolbar.
        pageNumber.addEventListener("click", function () {
            this.select();
        });
        pageNumber.addEventListener("change", function () {
            self.eventBus.dispatch("pagenumberchanged", {
                source: self,
                value: this.value,
            });
        });
        scaleSelect.addEventListener("change", function () {
            if (this.value === "custom")
                return;
            self.eventBus.dispatch("scalechanged", {
                source: self,
                value: this.value,
            });
        });
        // Here we depend on browsers dispatching the "click" event *after* the
        // "change" event, when the <select>-element changes.
        scaleSelect.addEventListener("click", function (evt) {
            const target = evt.target;
            // Remove focus when an <option>-element was *clicked*, to improve the UX
            // for mouse users (fixes bug 1300525 and issue 4923).
            if (this.value === self.pageScaleValue &&
                target.tagName.toUpperCase() === "OPTION") {
                this.blur();
            }
        });
        // Suppress context menus for some controls.
        scaleSelect.oncontextmenu = noContextMenuHandler;
        this.eventBus._on("localized", () => {
            this._wasLocalized = true;
            this.#adjustScaleWidth();
            this.#updateUIState(true);
        });
        this.#bindEditorToolsListener(options);
    }
    #bindEditorToolsListener({ editorNoneButton, editorFreeTextButton, editorFreeTextParamsToolbar, editorInkButton, editorInkParamsToolbar, }) {
        const editorModeChanged = (evt, disableButtons = false) => {
            const editorButtons = [
                { mode: AnnotationEditorType.NONE, button: editorNoneButton },
                {
                    mode: AnnotationEditorType.FREETEXT,
                    button: editorFreeTextButton,
                    toolbar: editorFreeTextParamsToolbar,
                },
                {
                    mode: AnnotationEditorType.INK,
                    button: editorInkButton,
                    toolbar: editorInkParamsToolbar,
                },
            ];
            for (const { mode, button, toolbar } of editorButtons) {
                const checked = mode === evt.mode;
                button.classList.toggle("toggled", checked);
                button.setAttribute("aria-checked", checked);
                button.disabled = disableButtons;
                if (toolbar) {
                    toolbar.classList.toggle("hidden", !checked);
                }
            }
        };
        this.eventBus._on("annotationeditormodechanged", editorModeChanged);
        this.eventBus._on("toolbarreset", (evt) => {
            if (evt.source === this) {
                editorModeChanged({
                    mode: AnnotationEditorType.NONE,
                }, 
                /* disableButtons = */ true);
            }
        });
    }
    #updateUIState = (resetNumPages = false) => {
        // Don't update the UI state until we localize the toolbar.
        if (!this._wasLocalized)
            return;
        const { pageNumber, pagesCount, pageScaleValue, pageScale, items } = this;
        if (resetNumPages) {
            if (this.hasPageLabels) {
                items.pageNumber.type = "text";
            }
            else {
                items.pageNumber.type = "number";
                this.l10n.get("of_pages", { pagesCount: pagesCount }).then((msg) => {
                    items.numPages.textContent = msg;
                });
            }
            items.pageNumber.max = pagesCount;
        }
        if (this.hasPageLabels) {
            items.pageNumber.value = this.pageLabel;
            this.l10n.get("page_of_pages", {
                pageNumber: pageNumber,
                pagesCount: pagesCount,
            }).then((msg) => {
                items.numPages.textContent = msg;
            });
        }
        else {
            items.pageNumber.value = `${pageNumber}`;
        }
        items.previous.disabled = pageNumber <= 1;
        items.next.disabled = pageNumber >= pagesCount;
        items.zoomOut.disabled = pageScale <= MIN_SCALE;
        items.zoomIn.disabled = pageScale >= MAX_SCALE;
        this.l10n
            .get("page_scale_percent", {
            scale: (Math.round(pageScale * 10000) / 100),
        })
            .then((msg) => {
            let predefinedValueFound = false;
            const options = items.scaleSelect.options;
            for (let i = 0, LEN = options.length; i < LEN; ++i) { // for( const option of items.scaleSelect.options )
                if (options[i].value !== pageScaleValue) {
                    options[i].selected = false;
                    continue;
                }
                options[i].selected = true;
                predefinedValueFound = true;
            }
            if (!predefinedValueFound) {
                items.customScaleOption.textContent = msg;
                items.customScaleOption.selected = true;
            }
        });
    };
    updateLoadingIndicatorState(loading = false) {
        const { pageNumber } = this.items;
        pageNumber.classList.toggle(PAGE_NUMBER_LOADING_INDICATOR, loading);
    }
    /**
     * Increase the width of the zoom dropdown DOM element if, and only if, it's
     * too narrow to fit the *longest* of the localized strings.
     */
    async #adjustScaleWidth() {
        const { items, l10n } = this;
        const predefinedValuesPromise = Promise.all([
            l10n.get("page_scale_auto"),
            l10n.get("page_scale_actual"),
            l10n.get("page_scale_fit"),
            l10n.get("page_scale_width"),
        ]);
        await animationStarted;
        const style = getComputedStyle(items.scaleSelect), scaleSelectContainerWidth = parseInt(style.getPropertyValue("--scale-select-container-width"), 10), scaleSelectOverflow = parseInt(style.getPropertyValue("--scale-select-overflow"), 10);
        // The temporary canvas is used to measure text length in the DOM.
        const canvas = html("canvas");
        const ctx = canvas.getContext("2d", { alpha: false });
        ctx.font = `${style.fontSize} ${style.fontFamily}`;
        let maxWidth = 0;
        for (const predefinedValue of await predefinedValuesPromise) {
            const { width } = ctx.measureText(predefinedValue);
            if (width > maxWidth) {
                maxWidth = width;
            }
        }
        maxWidth += 2 * scaleSelectOverflow;
        if (maxWidth > scaleSelectContainerWidth) {
            docStyle.setProperty("--scale-select-container-width", `${maxWidth}px`);
        }
        // Zeroing the width and height cause Firefox to release graphics resources
        // immediately, which can greatly reduce memory consumption.
        canvas.width = 0;
        canvas.height = 0;
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=toolbar.js.map