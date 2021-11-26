/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
 */
import { normalizeWheelEventDelta, PresentationModeState, ScrollMode, SpreadMode, } from "./ui_utils.js";
/*81---------------------------------------------------------------------------*/
const DELAY_BEFORE_RESETTING_SWITCH_IN_PROGRESS = 1500; // in ms
const DELAY_BEFORE_HIDING_CONTROLS = 3000; // in ms
const ACTIVE_SELECTOR = "pdfPresentationMode";
const CONTROLS_SELECTOR = "pdfPresentationModeControls";
const MOUSE_SCROLL_COOLDOWN_TIME = 50; // in ms
const PAGE_SWITCH_THRESHOLD = 0.1;
// Number of CSS pixels for a movement to count as a swipe.
const SWIPE_MIN_DISTANCE_THRESHOLD = 50;
// Swipe angle deviation from the x or y axis before it is not
// considered a swipe in that direction any more.
const SWIPE_ANGLE_THRESHOLD = Math.PI / 6;
export class PDFPresentationMode {
    container;
    pdfViewer;
    eventBus;
    active = false;
    args;
    contextMenuOpen = false;
    mouseScrollTimeStamp = 0;
    mouseScrollDelta = 0;
    touchSwipeState;
    switchInProgress;
    controlsTimeout;
    constructor({ container, pdfViewer, eventBus, }) {
        this.container = container;
        this.pdfViewer = pdfViewer;
        this.eventBus = eventBus;
    }
    /**
     * Request the browser to enter fullscreen mode.
     * @return Indicating if the request was successful.
     */
    request() {
        if (this.switchInProgress || this.active || !this.pdfViewer.pagesCount) {
            return false;
        }
        this.#addFullscreenChangeListeners();
        this.#setSwitchInProgress();
        this.#notifyStateChange();
        if (this.container.requestFullscreen) {
            this.container.requestFullscreen();
        }
        else if (this.container.mozRequestFullScreen) {
            this.container.mozRequestFullScreen();
        }
        else if (this.container.webkitRequestFullscreen) {
            this.container.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
        else {
            return false;
        }
        this.args = {
            pageNumber: this.pdfViewer.currentPageNumber,
            scaleValue: this.pdfViewer.currentScaleValue,
            scrollMode: this.pdfViewer.scrollMode,
            spreadMode: this.pdfViewer.spreadMode,
        };
        return true;
    }
    #mouseWheel = (evt) => {
        if (!this.active) {
            return;
        }
        evt.preventDefault();
        const delta = normalizeWheelEventDelta(evt);
        const currentTime = Date.now();
        const storedTime = this.mouseScrollTimeStamp;
        // If we've already switched page, avoid accidentally switching again.
        if (currentTime > storedTime
            && currentTime - storedTime < MOUSE_SCROLL_COOLDOWN_TIME) {
            return;
        }
        // If the scroll direction changed, reset the accumulated scroll delta.
        if ((this.mouseScrollDelta > 0 && delta < 0)
            || (this.mouseScrollDelta < 0 && delta > 0)) {
            this.#resetMouseScrollState();
        }
        this.mouseScrollDelta += delta;
        if (Math.abs(this.mouseScrollDelta) >= PAGE_SWITCH_THRESHOLD) {
            const totalDelta = this.mouseScrollDelta;
            this.#resetMouseScrollState();
            const success = totalDelta > 0
                ? this.pdfViewer.previousPage()
                : this.pdfViewer.nextPage();
            if (success) {
                this.mouseScrollTimeStamp = currentTime;
            }
        }
    };
    get isFullscreen() {
        // if (typeof PDFJSDev !== "undefined" && PDFJSDev.test("MOZCENTRAL")) {
        return !!(document.fullscreenElement ||
            document.mozFullScreen ||
            document.webkitIsFullScreen);
    }
    #notifyStateChange = () => {
        let state = PresentationModeState.NORMAL;
        if (this.switchInProgress) {
            state = PresentationModeState.CHANGING;
        }
        else if (this.active) {
            state = PresentationModeState.FULLSCREEN;
        }
        this.eventBus.dispatch("presentationmodechanged", {
            source: this,
            state,
        });
    };
    /**
     * Used to initialize a timeout when requesting Presentation Mode,
     * i.e. when the browser is requested to enter fullscreen mode.
     * This timeout is used to prevent the current page from being scrolled
     * partially, or completely, out of view when entering Presentation Mode.
     * NOTE: This issue seems limited to certain zoom levels (e.g. page-width).
     */
    #setSwitchInProgress = () => {
        if (this.switchInProgress) {
            clearTimeout(this.switchInProgress);
        }
        this.switchInProgress = setTimeout(() => {
            this.#removeFullscreenChangeListeners();
            delete this.switchInProgress;
            this.#notifyStateChange();
        }, DELAY_BEFORE_RESETTING_SWITCH_IN_PROGRESS);
    };
    #resetSwitchInProgress = () => {
        if (this.switchInProgress) {
            clearTimeout(this.switchInProgress);
            delete this.switchInProgress;
        }
    };
    #enter() {
        this.active = true;
        this.#resetSwitchInProgress();
        this.#notifyStateChange();
        this.container.classList.add(ACTIVE_SELECTOR);
        // Ensure that the correct page is scrolled into view when entering
        // Presentation Mode, by waiting until fullscreen mode in enabled.
        setTimeout(() => {
            this.pdfViewer.scrollMode = ScrollMode.PAGE;
            this.pdfViewer.spreadMode = SpreadMode.NONE;
            this.pdfViewer.currentPageNumber = this.args.pageNumber;
            this.pdfViewer.currentScaleValue = "page-fit";
        }, 0);
        this.#addWindowListeners();
        this.#showControls();
        this.contextMenuOpen = false;
        // Text selection is disabled in Presentation Mode, thus it's not possible
        // for the user to deselect text that is selected (e.g. with "Select all")
        // when entering Presentation Mode, hence we remove any active selection.
        window.getSelection().removeAllRanges();
    }
    #exit() {
        const pageNumber = this.pdfViewer.currentPageNumber;
        this.container.classList.remove(ACTIVE_SELECTOR);
        // Ensure that the correct page is scrolled into view when exiting
        // Presentation Mode, by waiting until fullscreen mode is disabled.
        setTimeout(() => {
            this.active = false;
            this.#removeFullscreenChangeListeners();
            this.#notifyStateChange();
            this.pdfViewer.scrollMode = this.args.scrollMode;
            this.pdfViewer.spreadMode = this.args.spreadMode;
            this.pdfViewer.currentScaleValue = this.args.scaleValue;
            this.pdfViewer.currentPageNumber = pageNumber;
            this.args = undefined;
        }, 0);
        this.#removeWindowListeners();
        this.#hideControls();
        this.#resetMouseScrollState();
        this.contextMenuOpen = false;
    }
    #mouseDown = (evt) => {
        if (this.contextMenuOpen) {
            this.contextMenuOpen = false;
            evt.preventDefault();
            return;
        }
        if (evt.button === 0) {
            // Enable clicking of links in presentation mode. Note: only links
            // pointing to destinations in the current PDF document work.
            const isInternalLink = evt.target.href && evt.target.classList.contains("internalLink");
            if (!isInternalLink) {
                // Unless an internal link was clicked, advance one page.
                evt.preventDefault();
                if (evt.shiftKey) {
                    this.pdfViewer.previousPage();
                }
                else {
                    this.pdfViewer.nextPage();
                }
            }
        }
    };
    #contextMenu = () => {
        this.contextMenuOpen = true;
    };
    #showControls = () => {
        if (this.controlsTimeout) {
            clearTimeout(this.controlsTimeout);
        }
        else {
            this.container.classList.add(CONTROLS_SELECTOR);
        }
        this.controlsTimeout = setTimeout(() => {
            this.container.classList.remove(CONTROLS_SELECTOR);
            delete this.controlsTimeout;
        }, DELAY_BEFORE_HIDING_CONTROLS);
    };
    #hideControls = () => {
        if (!this.controlsTimeout) {
            return;
        }
        clearTimeout(this.controlsTimeout);
        this.container.classList.remove(CONTROLS_SELECTOR);
        delete this.controlsTimeout;
    };
    /**
     * Resets the properties used for tracking mouse scrolling events.
     */
    #resetMouseScrollState = () => {
        this.mouseScrollTimeStamp = 0;
        this.mouseScrollDelta = 0;
    };
    #touchSwipe = (evt) => {
        if (!this.active) {
            return;
        }
        if (evt.touches.length > 1) {
            // Multiple touch points detected; cancel the swipe.
            this.touchSwipeState = undefined;
            return;
        }
        switch (evt.type) {
            case "touchstart":
                this.touchSwipeState = {
                    startX: evt.touches[0].pageX,
                    startY: evt.touches[0].pageY,
                    endX: evt.touches[0].pageX,
                    endY: evt.touches[0].pageY,
                };
                break;
            case "touchmove":
                if (this.touchSwipeState === undefined) {
                    return;
                }
                this.touchSwipeState.endX = evt.touches[0].pageX;
                this.touchSwipeState.endY = evt.touches[0].pageY;
                // Avoid the swipe from triggering browser gestures (Chrome in
                // particular has some sort of swipe gesture in fullscreen mode).
                evt.preventDefault();
                break;
            case "touchend":
                if (this.touchSwipeState === undefined)
                    return;
                let delta = 0;
                const dx = this.touchSwipeState.endX - this.touchSwipeState.startX;
                const dy = this.touchSwipeState.endY - this.touchSwipeState.startY;
                const absAngle = Math.abs(Math.atan2(dy, dx));
                if (Math.abs(dx) > SWIPE_MIN_DISTANCE_THRESHOLD &&
                    (absAngle <= SWIPE_ANGLE_THRESHOLD ||
                        absAngle >= Math.PI - SWIPE_ANGLE_THRESHOLD)) {
                    // Horizontal swipe.
                    delta = dx;
                }
                else if (Math.abs(dy) > SWIPE_MIN_DISTANCE_THRESHOLD &&
                    Math.abs(absAngle - Math.PI / 2) <= SWIPE_ANGLE_THRESHOLD) {
                    // Vertical swipe.
                    delta = dy;
                }
                if (delta > 0) {
                    this.pdfViewer.previousPage();
                }
                else if (delta < 0) {
                    this.pdfViewer.nextPage();
                }
                break;
        }
    };
    #addWindowListeners = () => {
        // this.showControlsBind = this.#showControls.bind(this);
        // this.mouseDownBind = this.#mouseDown.bind(this);
        // this.mouseWheelBind = this.#mouseWheel.bind(this);
        // this.resetMouseScrollStateBind = this.#resetMouseScrollState.bind(this);
        // this.contextMenuBind = this.#contextMenu.bind(this);
        // this.touchSwipeBind = this.#touchSwipe.bind(this);
        window.addEventListener("mousemove", this.#showControls);
        window.addEventListener("mousedown", this.#mouseDown);
        window.addEventListener("wheel", this.#mouseWheel, { passive: false });
        window.addEventListener("keydown", this.#resetMouseScrollState);
        window.addEventListener("contextmenu", this.#contextMenu);
        window.addEventListener("touchstart", this.#touchSwipe);
        window.addEventListener("touchmove", this.#touchSwipe);
        window.addEventListener("touchend", this.#touchSwipe);
    };
    #removeWindowListeners = () => {
        window.removeEventListener("mousemove", this.#showControls);
        window.removeEventListener("mousedown", this.#mouseDown);
        window.removeEventListener("wheel", this.#mouseWheel);
        window.removeEventListener("keydown", this.#resetMouseScrollState);
        window.removeEventListener("contextmenu", this.#contextMenu);
        window.removeEventListener("touchstart", this.#touchSwipe);
        window.removeEventListener("touchmove", this.#touchSwipe);
        window.removeEventListener("touchend", this.#touchSwipe);
        delete this.showControlsBind;
        delete this.mouseDownBind;
        delete this.mouseWheelBind;
        delete this.resetMouseScrollStateBind;
        delete this.contextMenuBind;
        delete this.touchSwipeBind;
    };
    #fullscreenChange = () => {
        if (this.isFullscreen) {
            this.#enter();
        }
        else {
            this.#exit();
        }
    };
    #addFullscreenChangeListeners() {
        // this.fullscreenChangeBind = this._fullscreenChange.bind(this);
        window.addEventListener("fullscreenchange", this.#fullscreenChange);
        // if (typeof PDFJSDev === "undefined" || !PDFJSDev.test("MOZCENTRAL")) {
        window.addEventListener("mozfullscreenchange", this.#fullscreenChange);
        window.addEventListener("webkitfullscreenchange", this.#fullscreenChange);
        // }
    }
    #removeFullscreenChangeListeners = () => {
        window.removeEventListener("fullscreenchange", this.#fullscreenChange);
        // if (typeof PDFJSDev === "undefined" || !PDFJSDev.test("MOZCENTRAL")) {
        window.removeEventListener("mozfullscreenchange", this.#fullscreenChange);
        window.removeEventListener("webkitfullscreenchange", this.#fullscreenChange);
        // }
        // delete this.fullscreenChangeBind;
    };
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=pdf_presentation_mode.js.map