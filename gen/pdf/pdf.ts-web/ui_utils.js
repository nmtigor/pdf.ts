/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/ui_utils.ts
 * @license Apache-2.0
 ******************************************************************************/
import { LIB } from "../../global.js";
/*80--------------------------------------------------------------------------*/
export const DEFAULT_SCALE_VALUE = "auto";
export const DEFAULT_SCALE = 1.0;
export const DEFAULT_SCALE_DELTA = 1.1;
export const MIN_SCALE = 0.1;
export const MAX_SCALE = 10.0;
export const UNKNOWN_SCALE = 0;
export const MAX_AUTO_SCALE = 1.25;
export const SCROLLBAR_PADDING = 40;
export const VERTICAL_PADDING = 5;
export var RenderingStates;
(function (RenderingStates) {
    RenderingStates[RenderingStates["INITIAL"] = 0] = "INITIAL";
    RenderingStates[RenderingStates["RUNNING"] = 1] = "RUNNING";
    RenderingStates[RenderingStates["PAUSED"] = 2] = "PAUSED";
    RenderingStates[RenderingStates["FINISHED"] = 3] = "FINISHED";
})(RenderingStates || (RenderingStates = {}));
export var PresentationModeState;
(function (PresentationModeState) {
    PresentationModeState[PresentationModeState["UNKNOWN"] = 0] = "UNKNOWN";
    PresentationModeState[PresentationModeState["NORMAL"] = 1] = "NORMAL";
    PresentationModeState[PresentationModeState["CHANGING"] = 2] = "CHANGING";
    PresentationModeState[PresentationModeState["FULLSCREEN"] = 3] = "FULLSCREEN";
})(PresentationModeState || (PresentationModeState = {}));
export var SidebarView;
(function (SidebarView) {
    SidebarView[SidebarView["UNKNOWN"] = -1] = "UNKNOWN";
    SidebarView[SidebarView["NONE"] = 0] = "NONE";
    SidebarView[SidebarView["THUMBS"] = 1] = "THUMBS";
    SidebarView[SidebarView["OUTLINE"] = 2] = "OUTLINE";
    SidebarView[SidebarView["ATTACHMENTS"] = 3] = "ATTACHMENTS";
    SidebarView[SidebarView["LAYERS"] = 4] = "LAYERS";
})(SidebarView || (SidebarView = {}));
export var TextLayerMode;
(function (TextLayerMode) {
    TextLayerMode[TextLayerMode["DISABLE"] = 0] = "DISABLE";
    TextLayerMode[TextLayerMode["ENABLE"] = 1] = "ENABLE";
    TextLayerMode[TextLayerMode["ENABLE_PERMISSIONS"] = 2] = "ENABLE_PERMISSIONS";
})(TextLayerMode || (TextLayerMode = {}));
export var ScrollMode;
(function (ScrollMode) {
    ScrollMode[ScrollMode["UNKNOWN"] = -1] = "UNKNOWN";
    ScrollMode[ScrollMode["VERTICAL"] = 0] = "VERTICAL";
    ScrollMode[ScrollMode["HORIZONTAL"] = 1] = "HORIZONTAL";
    ScrollMode[ScrollMode["WRAPPED"] = 2] = "WRAPPED";
    ScrollMode[ScrollMode["PAGE"] = 3] = "PAGE";
})(ScrollMode || (ScrollMode = {}));
export var SpreadMode;
(function (SpreadMode) {
    SpreadMode[SpreadMode["UNKNOWN"] = -1] = "UNKNOWN";
    SpreadMode[SpreadMode["NONE"] = 0] = "NONE";
    SpreadMode[SpreadMode["ODD"] = 1] = "ODD";
    SpreadMode[SpreadMode["EVEN"] = 2] = "EVEN";
})(SpreadMode || (SpreadMode = {}));
export var PageMode;
(function (PageMode) {
    PageMode[PageMode["UseNone"] = 1] = "UseNone";
    PageMode[PageMode["UseOutlines"] = 2] = "UseOutlines";
    PageMode[PageMode["UseThumbs"] = 3] = "UseThumbs";
    PageMode[PageMode["FullScreen"] = 4] = "FullScreen";
    PageMode[PageMode["UseOC"] = 5] = "UseOC";
    PageMode[PageMode["UseAttachments"] = 6] = "UseAttachments";
})(PageMode || (PageMode = {}));
export var PageLayout;
(function (PageLayout) {
    PageLayout[PageLayout["SinglePage"] = 1] = "SinglePage";
    PageLayout[PageLayout["OneColumn"] = 2] = "OneColumn";
    PageLayout[PageLayout["TwoColumnLeft"] = 3] = "TwoColumnLeft";
    PageLayout[PageLayout["TwoColumnRight"] = 4] = "TwoColumnRight";
    PageLayout[PageLayout["TwoPageLeft"] = 5] = "TwoPageLeft";
    PageLayout[PageLayout["TwoPageRight"] = 6] = "TwoPageRight";
})(PageLayout || (PageLayout = {}));
export var CursorTool;
(function (CursorTool) {
    CursorTool[CursorTool["SELECT"] = 0] = "SELECT";
    CursorTool[CursorTool["HAND"] = 1] = "HAND";
    CursorTool[CursorTool["ZOOM"] = 2] = "ZOOM";
})(CursorTool || (CursorTool = {}));
/**
 * Used by `PDFViewerApplication`, and by the API unit-tests.
 */
export const AutoPrintRegExp = /\bprint\s*\(/;
export class OutputScale {
    /**
     * @type {number} Horizontal scale.
     */
    sx;
    /**
     * @type {number} Vertical scale.
     */
    sy;
    constructor() {
        const pixelRatio = window.devicePixelRatio || 1;
        this.sx = pixelRatio;
        this.sy = pixelRatio;
    }
    /**
     * @type {boolean} Returns `true` when scaling is required, `false` otherwise.
     */
    get scaled() {
        return this.sx !== 1 || this.sy !== 1;
    }
}
/**
 * Scrolls specified element into view of its parent.
 * @param element The element to be visible.
 * @param spot An object with optional top and left properties,
 *   specifying the offset from the top left edge.
 * @param scrollMatches When scrolling search results into view,
 *   ignore elements that either: Contains marked content identifiers,
 *   or have the CSS-rule `overflow: hidden;` set. The default value is `false`.
 */
export function scrollIntoView(element, spot, scrollMatches = false) {
    // Assuming offsetParent is available (it's not available when viewer is in
    // hidden iframe or object). We have to scroll: if the offsetParent is not set
    // producing the error. See also animationStarted.
    let parent = element.offsetParent;
    if (!parent) {
        console.error("offsetParent is not set -- cannot scroll");
        return;
    }
    let offsetY = element.offsetTop + element.clientTop;
    let offsetX = element.offsetLeft + element.clientLeft;
    while ((parent.clientHeight === parent.scrollHeight &&
        parent.clientWidth === parent.scrollWidth) ||
        (scrollMatches &&
            (parent.classList.contains("markedContent") ||
                getComputedStyle(parent).overflow === "hidden"))) {
        offsetY += parent.offsetTop;
        offsetX += parent.offsetLeft;
        parent = parent.offsetParent;
        if (!parent)
            return; // no need to scroll
    }
    if (spot) {
        if (spot.top !== undefined) {
            offsetY += spot.top;
        }
        if (spot.left !== undefined) {
            offsetX += spot.left;
            parent.scrollLeft = offsetX;
        }
    }
    parent.scrollTop = offsetY;
}
/**
 * Helper function to start monitoring the scroll event and converting them into
 * PDF.js friendly one: with scroll debounce and scroll direction.
 */
export function watchScroll(viewAreaElement, callback, abortSignal) {
    const debounceScroll = (evt) => {
        if (rAF) {
            return;
        }
        // schedule an invocation of scroll for next animation frame.
        rAF = globalThis?.requestAnimationFrame?.(
        /* viewAreaElementScrolled */ () => {
            rAF = undefined;
            const currentX = viewAreaElement.scrollLeft;
            const lastX = state.lastX;
            if (currentX !== lastX) {
                state.right = currentX > lastX;
            }
            state.lastX = currentX;
            const currentY = viewAreaElement.scrollTop;
            const lastY = state.lastY;
            if (currentY !== lastY) {
                state.down = currentY > lastY;
            }
            state.lastY = currentY;
            callback(state);
        });
    };
    const state = {
        right: true,
        down: true,
        lastX: viewAreaElement.scrollLeft,
        lastY: viewAreaElement.scrollTop,
        _eventHandler: debounceScroll,
    };
    let rAF;
    viewAreaElement.on("scroll", debounceScroll, {
        // useCapture: true,
        capture: true,
        signal: abortSignal,
    });
    abortSignal?.on("abort", () => window.cancelAnimationFrame(rAF), { once: true });
    return state;
}
/**
 * Helper function to parse query string (e.g. ?param1=value&param2=...).
 */
export function parseQueryString(query) {
    const params = new Map();
    for (const [key, value] of new URLSearchParams(query)) {
        params.set(key.toLowerCase(), value);
    }
    return params;
}
const InvisibleCharsRegExp = /[\x00-\x1F]/g;
export function removeNullCharacters(str, replaceInvisible = false) {
    if (!InvisibleCharsRegExp.test(str)) {
        return str;
    }
    if (replaceInvisible) {
        return str.replaceAll(InvisibleCharsRegExp, (m) => m === "\x00" ? "" : " ");
    }
    return str.replaceAll("\x00", "");
}
/**
 * Use binary search to find the index of the first item in a given array which
 * passes a given condition. The items are expected to be sorted in the sense
 * that if the condition is true for one item in the array, then it is also true
 * for all following items.
 *
 * @return Index of the first array element to pass the test,
 *  or |items.length| if no such element exists.
 */
export function binarySearchFirstItem(items, condition, start = 0) {
    let minIndex = start;
    let maxIndex = items.length - 1;
    if (maxIndex < 0 || !condition(items[maxIndex])) {
        return items.length;
    }
    if (condition(items[minIndex])) {
        return minIndex;
    }
    while (minIndex < maxIndex) {
        const currentIndex = (minIndex + maxIndex) >> 1;
        const currentItem = items[currentIndex];
        if (condition(currentItem)) {
            maxIndex = currentIndex;
        }
        else {
            minIndex = currentIndex + 1;
        }
    }
    return minIndex; /* === maxIndex */
}
/**
 * Approximates float number as a fraction using Farey sequence (max order
 * of 8).
 * @param x Positive float number.
 * @return Estimated fraction: the first array item is a numerator,
 *  the second one is a denominator.\
 *  They are both natural numbers.
 */
export function approximateFraction(x) {
    // Fast paths for int numbers or their inversions.
    if (Math.floor(x) === x) {
        return [x, 1];
    }
    const xinv = 1 / x;
    const limit = 8;
    if (xinv > limit) {
        return [1, limit];
    }
    else if (Math.floor(xinv) === xinv) {
        return [1, xinv];
    }
    const x_ = x > 1 ? xinv : x;
    // a/b and c/d are neighbours in Farey sequence.
    let a = 0, b = 1, c = 1, d = 1;
    // Limiting search to order 8.
    while (true) {
        // Generating next term in sequence (order of q).
        const p = a + c, q = b + d;
        if (q > limit) {
            break;
        }
        if (x_ <= p / q) {
            c = p;
            d = q;
        }
        else {
            a = p;
            b = q;
        }
    }
    let result;
    // Select closest of the neighbours to x.
    if (x_ - a / b < c / d - x_) {
        result = x_ === x ? [a, b] : [b, a];
    }
    else {
        result = x_ === x ? [c, d] : [d, c];
    }
    return result;
}
/**
 * @param x A positive number to round to a multiple of `div`.
 * @param div A natural number.
 */
export function floorToDivide(x, div) {
    return x - (x % div);
}
/**
 * Gets the size of the specified page, converted from PDF units to inches.
 * @param - An Object containing the properties: {Array} `view`,
 *   {number} `userUnit`, and {number} `rotate`.
 * @return An Object containing the properties: {number} `width`
 *   and {number} `height`, given in inches.
 */
export function getPageSizeInches({ view, userUnit, rotate }) {
    const [x1, y1, x2, y2] = view;
    // We need to take the page rotation into account as well.
    const changeOrientation = rotate % 180 !== 0;
    const width = ((x2 - x1) / 72) * userUnit;
    const height = ((y2 - y1) / 72) * userUnit;
    return {
        width: changeOrientation ? height : width,
        height: changeOrientation ? width : height,
    };
}
/**
 * Helper function for getVisibleElements.
 *
 * only exported for testing
 *
 * @param index initial guess at the first visible element
 * @param views array of pages, into which `index` is an index
 * @param top the top of the scroll pane
 * @return less than or equal to `index` that is definitely at or
 *   before the first visible element in `views`, but not by too much. (Usually,
 *   this will be the first element in the first partially visible row in
 *   `views`, although sometimes it goes back one row further.)
 */
export function backtrackBeforeAllVisibleElements(index, views, top) {
    // binarySearchFirstItem's assumption is that the input is ordered, with only
    // one index where the conditions flips from false to true: [false ...,
    // true...]. With vertical scrolling and spreads, it is possible to have
    // [false ..., true, false, true ...]. With wrapped scrolling we can have a
    // similar sequence, with many more mixed true and false in the middle.
    //
    // So there is no guarantee that the binary search yields the index of the
    // first visible element. It could have been any of the other visible elements
    // that were preceded by a hidden element.
    // Of course, if either this element or the previous (hidden) element is also
    // the first element, there's nothing to worry about.
    if (index < 2) {
        return index;
    }
    // That aside, the possible cases are represented below.
    //
    //     ****  = fully hidden
    //     A*B*  = mix of partially visible and/or hidden pages
    //     CDEF  = fully visible
    //
    // (1) Binary search could have returned A, in which case we can stop.
    // (2) Binary search could also have returned B, in which case we need to
    // check the whole row.
    // (3) Binary search could also have returned C, in which case we need to
    // check the whole previous row.
    //
    // There's one other possibility:
    //
    //     ****  = fully hidden
    //     ABCD  = mix of fully and/or partially visible pages
    //
    // (4) Binary search could only have returned A.
    // Initially assume that we need to find the beginning of the current row
    // (case 1, 2, or 4), which means finding a page that is above the current
    // page's top. If the found page is partially visible, we're definitely not in
    // case 3, and this assumption is correct.
    let elt = views[index].div;
    let pageTop = elt.offsetTop + elt.clientTop;
    if (pageTop >= top) {
        // The found page is fully visible, so we're actually either in case 3 or 4,
        // and unfortunately we can't tell the difference between them without
        // scanning the entire previous row, so we just conservatively assume that
        // we do need to backtrack to that row. In both cases, the previous page is
        // in the previous row, so use its top instead.
        elt = views[index - 1].div;
        pageTop = elt.offsetTop + elt.clientTop;
    }
    // Now we backtrack to the first page that still has its bottom below
    // `pageTop`, which is the top of a page in the first visible row (unless
    // we're in case 4, in which case it's the row before that).
    // `index` is found by binary search, so the page at `index - 1` is
    // invisible and we can start looking for potentially visible pages from
    // `index - 2`. (However, if this loop terminates on its first iteration,
    // which is the case when pages are stacked vertically, `index` should remain
    // unchanged, so we use a distinct loop variable.)
    for (let i = index - 2; i >= 0; --i) {
        elt = views[i].div;
        if (elt.offsetTop + elt.clientTop + elt.clientHeight <= pageTop) {
            // We have reached the previous row, so stop now.
            // This loop is expected to terminate relatively quickly because the
            // number of pages per row is expected to be small.
            break;
        }
        index = i;
    }
    return index;
}
/**
 * Generic helper to find out what elements are visible within a scroll pane.
 *
 * Well, pretty generic. There are some assumptions placed on the elements
 * referenced by `views`:
 *   - If `horizontal`, no left of any earlier element is to the right of the
 *     left of any later element.
 *   - Otherwise, `views` can be split into contiguous rows where, within a row,
 *     no top of any element is below the bottom of any other element, and
 *     between rows, no bottom of any element in an earlier row is below the
 *     top of any element in a later row.
 *
 * (Here, top, left, etc. all refer to the padding edge of the element in
 * question. For pages, that ends up being equivalent to the bounding box of the
 * rendering canvas. Earlier and later refer to index in `views`, not page
 * layout.)
 */
export function getVisibleElements({ scrollEl, views, sortByVisibility = false, horizontal = false, rtl = false, }) {
    const top = scrollEl.scrollTop, bottom = top + scrollEl.clientHeight;
    const left = scrollEl.scrollLeft, right = left + scrollEl.clientWidth;
    // Throughout this "generic" function, comments will assume we're working with
    // PDF document pages, which is the most important and complex case. In this
    // case, the visible elements we're actually interested is the page canvas,
    // which is contained in a wrapper which adds no padding/border/margin, which
    // is itself contained in `view.div` which adds no padding (but does add a
    // border). So, as specified in this function's doc comment, this function
    // does all of its work on the padding edge of the provided views, starting at
    // offsetLeft/Top (which includes margin) and adding clientLeft/Top (which is
    // the border). Adding clientWidth/Height gets us the bottom-right corner of
    // the padding edge.
    function isElementBottomAfterViewTop(view) {
        const element = view.div;
        const elementBottom = element.offsetTop + element.clientTop +
            element.clientHeight;
        return elementBottom > top;
    }
    function isElementNextAfterViewHorizontally(view) {
        const element = view.div;
        const elementLeft = element.offsetLeft + element.clientLeft;
        const elementRight = elementLeft + element.clientWidth;
        return rtl ? elementLeft < right : elementRight > left;
    }
    const visible = [], ids = new Set(), numViews = views.length;
    let firstVisibleElementInd = binarySearchFirstItem(views, horizontal
        ? isElementNextAfterViewHorizontally
        : isElementBottomAfterViewTop);
    // Please note the return value of the `binarySearchFirstItem` function when
    // no valid element is found (hence the `firstVisibleElementInd` check below).
    if (firstVisibleElementInd > 0 &&
        firstVisibleElementInd < numViews &&
        !horizontal) {
        // In wrapped scrolling (or vertical scrolling with spreads), with some page
        // sizes, isElementBottomAfterViewTop doesn't satisfy the binary search
        // condition: there can be pages with bottoms above the view top between
        // pages with bottoms below. This function detects and corrects that error;
        // see it for more comments.
        firstVisibleElementInd = backtrackBeforeAllVisibleElements(firstVisibleElementInd, views, top);
    }
    // lastEdge acts as a cutoff for us to stop looping, because we know all
    // subsequent pages will be hidden.
    //
    // When using wrapped scrolling or vertical scrolling with spreads, we can't
    // simply stop the first time we reach a page below the bottom of the view;
    // the tops of subsequent pages on the same row could still be visible. In
    // horizontal scrolling, we don't have that issue, so we can stop as soon as
    // we pass `right`, without needing the code below that handles the -1 case.
    let lastEdge = horizontal ? right : -1;
    for (let i = firstVisibleElementInd; i < numViews; i++) {
        const view = views[i], element = view.div;
        const currentWidth = element.offsetLeft + element.clientLeft;
        const currentHeight = element.offsetTop + element.clientTop;
        const viewWidth = element.clientWidth, viewHeight = element.clientHeight;
        const viewRight = currentWidth + viewWidth;
        const viewBottom = currentHeight + viewHeight;
        if (lastEdge === -1) {
            // As commented above, this is only needed in non-horizontal cases.
            // Setting lastEdge to the bottom of the first page that is partially
            // visible ensures that the next page fully below lastEdge is on the
            // next row, which has to be fully hidden along with all subsequent rows.
            if (viewBottom >= bottom) {
                lastEdge = viewBottom;
            }
        }
        else if ((horizontal ? currentWidth : currentHeight) > lastEdge) {
            break;
        }
        if (viewBottom <= top ||
            currentHeight >= bottom ||
            viewRight <= left ||
            currentWidth >= right) {
            continue;
        }
        const hiddenHeight = Math.max(0, top - currentHeight) +
            Math.max(0, viewBottom - bottom);
        const hiddenWidth = Math.max(0, left - currentWidth) +
            Math.max(0, viewRight - right);
        const fractionHeight = (viewHeight - hiddenHeight) / viewHeight, fractionWidth = (viewWidth - hiddenWidth) / viewWidth;
        const percent = (fractionHeight * fractionWidth * 100) | 0;
        visible.push({
            id: view.id,
            x: currentWidth,
            y: currentHeight,
            view,
            percent,
            widthPercent: (fractionWidth * 100) | 0,
        });
        ids.add(view.id);
    }
    const first = visible[0], last = visible.at(-1);
    if (sortByVisibility) {
        visible.sort((a, b) => {
            const pc = a.percent - b.percent;
            if (Math.abs(pc) > 0.001)
                return -pc;
            return a.id - b.id; // ensure stability
        });
    }
    return { first, last, views: visible, ids };
}
export function normalizeWheelEventDirection(evt) {
    let delta = Math.hypot(evt.deltaX, evt.deltaY);
    const angle = Math.atan2(evt.deltaY, evt.deltaX);
    if (-0.25 * Math.PI < angle && angle < 0.75 * Math.PI) {
        // All that is left-up oriented has to change the sign.
        delta = -delta;
    }
    return delta;
}
export function normalizeWheelEventDelta(evt) {
    const deltaMode = evt.deltaMode; // Avoid being affected by bug 1392460.
    let delta = normalizeWheelEventDirection(evt);
    const MOUSE_PIXELS_PER_LINE = 30;
    const MOUSE_LINES_PER_PAGE = 30;
    // Converts delta to per-page units
    if (deltaMode === WheelEvent.DOM_DELTA_PIXEL) {
        delta /= MOUSE_PIXELS_PER_LINE * MOUSE_LINES_PER_PAGE;
    }
    else if (deltaMode === WheelEvent.DOM_DELTA_LINE) {
        delta /= MOUSE_LINES_PER_PAGE;
    }
    return delta;
}
export function isValidRotation(angle) {
    return Number.isInteger(angle) && angle % 90 === 0;
}
export function isValidScrollMode(mode) {
    return (Number.isInteger(mode) &&
        Object.values(ScrollMode).includes(mode) &&
        mode !== ScrollMode.UNKNOWN);
}
export function isValidSpreadMode(mode) {
    return (Number.isInteger(mode) &&
        Object.values(SpreadMode).includes(mode) &&
        mode !== SpreadMode.UNKNOWN);
}
export function isPortraitOrientation(size) {
    return size.width <= size.height;
}
export var WaitOnType;
(function (WaitOnType) {
    WaitOnType["EVENT"] = "event";
    WaitOnType["TIMEOUT"] = "timeout";
})(WaitOnType || (WaitOnType = {}));
/**
 * Promise that is resolved when DOM window becomes visible.
 */
export const animationStarted = new Promise((resolve) => {
    /*#static*/ 
    globalThis?.requestAnimationFrame?.(resolve);
});
/*64----------------------------------------------------------*/
//kkkk bug? ✅
// const docStyle =
//   typeof PDFJSDev !== "undefined" &&
//   PDFJSDev.test("LIB") &&
//   typeof document === "undefined"
//     ? null
//     : document.documentElement.style;
export const docStyle = typeof document !== "undefined"
    ? document.documentElement.style
    : undefined;
export function clamp(v, min, max) {
    return Math.min(Math.max(v, min), max);
}
export class ProgressBar {
    #classList;
    #disableAutoFetchTimeout;
    #percent = 0;
    get percent() {
        return this.#percent;
    }
    set percent(val) {
        this.#percent = clamp(val, 0, 100);
        if (isNaN(val)) {
            this.#classList.add("indeterminate");
            return;
        }
        this.#classList.remove("indeterminate");
        this.#style.setProperty("--progressBar-percent", `${this.#percent}%`);
    }
    #style;
    #visible = true;
    _indeterminate;
    constructor(bar) {
        this.#classList = bar.classList;
        this.#style = bar.style;
    }
    setWidth(viewer) {
        if (!viewer) {
            return;
        }
        const container = viewer.parentNode;
        const scrollbarWidth = container.offsetWidth - viewer.offsetWidth;
        if (scrollbarWidth > 0) {
            this.#style.setProperty("--progressBar-end-offset", `${scrollbarWidth}px`);
        }
    }
    setDisableAutoFetch(delay = /* ms = */ 5000) {
        if (this.#percent === 100 || isNaN(this.#percent)) {
            return;
        }
        if (this.#disableAutoFetchTimeout) {
            clearTimeout(this.#disableAutoFetchTimeout);
        }
        this.show();
        this.#disableAutoFetchTimeout = setTimeout(() => {
            this.#disableAutoFetchTimeout = undefined;
            this.hide();
        }, delay);
    }
    hide() {
        if (!this.#visible) {
            return;
        }
        this.#visible = false;
        this.#classList.add("hidden");
    }
    show() {
        if (this.#visible) {
            return;
        }
        this.#visible = true;
        this.#classList.remove("hidden");
    }
}
/**
 * Get the active or focused element in current DOM.
 *
 * Recursively search for the truly active or focused element in case there are
 * shadow DOMs.
 *
 * @return the truly active or focused element.
 */
export function getActiveOrFocusedElement() {
    let curRoot = document;
    let curActiveOrFocused = curRoot.activeElement ||
        curRoot.querySelector(":focus");
    while (curActiveOrFocused?.shadowRoot) {
        curRoot = curActiveOrFocused.shadowRoot;
        curActiveOrFocused = curRoot.activeElement ||
            curRoot.querySelector(":focus");
    }
    return curActiveOrFocused;
}
/**
 * Converts API PageLayout values to the format used by `BaseViewer`.
 * @param layout The API PageLayout value.
 * @return A value from {SpreadMode}.
 */
export function apiPageLayoutToViewerModes(layout) {
    let scrollMode = ScrollMode.VERTICAL, spreadMode = SpreadMode.NONE;
    switch (layout) {
        case PageLayout.SinglePage:
            scrollMode = ScrollMode.PAGE;
            break;
        case PageLayout.OneColumn:
            break;
        case PageLayout.TwoPageLeft: /* falls through */
            scrollMode = ScrollMode.PAGE;
        case PageLayout.TwoColumnLeft:
            spreadMode = SpreadMode.ODD;
            break;
        case PageLayout.TwoPageRight: /* falls through */
            scrollMode = ScrollMode.PAGE;
        case PageLayout.TwoColumnRight:
            spreadMode = SpreadMode.EVEN;
            break;
    }
    return { scrollMode, spreadMode };
}
/**
 * Converts API PageMode values to the format used by `PDFSidebar`.
 * NOTE: There's also a "FullScreen" parameter which is not possible to support,
 *       since the Fullscreen API used in browsers requires that entering
 *       fullscreen mode only occurs as a result of a user-initiated event.
 * @param mode The API PageMode value.
 * @return A value from {SidebarView}.
 */
export function apiPageModeToSidebarView(mode) {
    switch (mode) {
        case PageMode.UseNone:
            return SidebarView.NONE;
        case PageMode.UseThumbs:
            return SidebarView.THUMBS;
        case PageMode.UseOutlines:
            return SidebarView.OUTLINE;
        case PageMode.UseAttachments:
            return SidebarView.ATTACHMENTS;
        case PageMode.UseOC:
            return SidebarView.LAYERS;
    }
    return SidebarView.NONE; // Default value.
}
export function toggleCheckedBtn(button, toggle, view) {
    button.classList.toggle("toggled", toggle);
    button.setAttribute("aria-checked", toggle);
    view?.classList.toggle("hidden", !toggle);
}
export function toggleExpandedBtn(button, toggle, view) {
    button.classList.toggle("toggled", toggle);
    button.setAttribute("aria-expanded", toggle);
    view?.classList.toggle("hidden", !toggle);
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=ui_utils.js.map