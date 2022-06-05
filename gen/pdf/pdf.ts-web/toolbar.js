/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
import { animationStarted, DEFAULT_SCALE, DEFAULT_SCALE_VALUE, MAX_SCALE, MIN_SCALE, noContextMenuHandler } from "./ui_utils.js";
/*81---------------------------------------------------------------------------*/
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
        ];
        this.buttons.push({ element: options.openFile, eventName: "openfile" });
        this.items = {
            numPages: options.numPages,
            pageNumber: options.pageNumber,
            scaleSelect: options.scaleSelect,
            customScaleOption: options.customScaleOption,
            previous: options.previous,
            next: options.next,
            zoomIn: options.zoomIn,
            zoomOut: options.zoomOut,
        };
        this.reset();
        // Bind the event listeners for click and various other actions.
        this.#bindListeners();
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
    }
    #bindListeners() {
        const { pageNumber, scaleSelect } = this.items;
        const self = this;
        // The buttons within the toolbar.
        for (const { element, eventName } of this.buttons) {
            element.addEventListener("click", evt => {
                if (eventName !== null) {
                    this.eventBus.dispatch(eventName, { source: this });
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
            if (this.value === self.pageScaleValue
                && target.tagName.toUpperCase() === "OPTION") {
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
                this.l10n.get("of_pages", { pagesCount: pagesCount }).then(msg => {
                    items.numPages.textContent = msg;
                });
            }
            items.pageNumber.max = pagesCount;
        }
        if (this.hasPageLabels) {
            items.pageNumber.value = this.pageLabel;
            this.l10n.get("page_of_pages", {
                pageNumber: pageNumber,
                pagesCount: pagesCount
            }).then(msg => {
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
            .get("page_scale_percent", { scale: (Math.round(pageScale * 10000) / 100) })
            .then(msg => {
            let predefinedValueFound = false;
            const options = items.scaleSelect.options;
            for (let i = 0, LEN = options.length; i < LEN; ++i) 
            // for( const option of items.scaleSelect.options )
            {
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
        const pageNumberInput = this.items.pageNumber;
        pageNumberInput.classList.toggle(PAGE_NUMBER_LOADING_INDICATOR, loading);
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
        const canvas = document.createElement("canvas");
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
            const doc = document.documentElement;
            doc.style.setProperty("--scale-select-container-width", `${maxWidth}px`);
        }
        // Zeroing the width and height cause Firefox to release graphics resources
        // immediately, which can greatly reduce memory consumption.
        canvas.width = 0;
        canvas.height = 0;
    }
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=toolbar.js.map