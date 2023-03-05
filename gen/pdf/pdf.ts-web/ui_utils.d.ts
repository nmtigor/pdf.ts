import { type IVisibleView } from "./interfaces.js";
export declare const DEFAULT_SCALE_VALUE = "auto";
export declare const DEFAULT_SCALE = 1;
export declare const DEFAULT_SCALE_DELTA = 1.1;
export declare const MIN_SCALE = 0.1;
export declare const MAX_SCALE = 10;
export declare const UNKNOWN_SCALE = 0;
export declare const MAX_AUTO_SCALE = 1.25;
export declare const SCROLLBAR_PADDING = 40;
export declare const VERTICAL_PADDING = 5;
export declare enum RenderingStates {
    INITIAL = 0,
    RUNNING = 1,
    PAUSED = 2,
    FINISHED = 3
}
export declare const enum PresentationModeState {
    UNKNOWN = 0,
    NORMAL = 1,
    CHANGING = 2,
    FULLSCREEN = 3
}
export declare const enum SidebarView {
    UNKNOWN = -1,
    NONE = 0,
    THUMBS = 1,
    OUTLINE = 2,
    ATTACHMENTS = 3,
    LAYERS = 4
}
export declare const enum RendererType {
    CANVAS = "canvas",
    SVG = "svg"
}
export declare const enum TextLayerMode {
    DISABLE = 0,
    ENABLE = 1
}
export declare enum ScrollMode {
    UNKNOWN = -1,
    VERTICAL = 0,
    HORIZONTAL = 1,
    WRAPPED = 2,
    PAGE = 3
}
export declare enum SpreadMode {
    UNKNOWN = -1,
    NONE = 0,
    ODD = 1,
    EVEN = 2
}
export declare const enum PageMode {
    UseNone = 1,
    UseOutlines = 2,
    UseThumbs = 3,
    FullScreen = 4,
    UseOC = 5,
    UseAttachments = 6
}
export declare const enum PageLayout {
    SinglePage = 1,
    OneColumn = 2,
    TwoColumnLeft = 3,
    TwoColumnRight = 4,
    TwoPageLeft = 5,
    TwoPageRight = 6
}
export declare const enum CursorTool {
    SELECT = 0,
    HAND = 1,
    ZOOM = 2
}
/**
 * Used by `PDFViewerApplication`, and by the API unit-tests.
 */
export declare const AutoPrintRegExp: RegExp;
export declare class OutputScale {
    /**
     * @type {number} Horizontal scale.
     */
    sx: number;
    /**
     * @type {number} Vertical scale.
     */
    sy: number;
    constructor();
    /**
     * @type {boolean} Returns `true` when scaling is required, `false` otherwise.
     */
    get scaled(): boolean;
}
export interface PageSpot {
    top?: number;
    left?: number;
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
export declare function scrollIntoView(element: HTMLElement, spot?: PageSpot, scrollMatches?: boolean): void;
/**
 * Helper function to start monitoring the scroll event and converting them into
 * PDF.js friendly one: with scroll debounce and scroll direction.
 */
export declare function watchScroll(viewAreaElement: HTMLDivElement, callback: (state?: unknown) => void): {
    right: boolean;
    down: boolean;
    lastX: number;
    lastY: number;
    _eventHandler: (evt: unknown) => void;
};
/**
 * Helper function to parse query string (e.g. ?param1=value&param2=...).
 */
export declare function parseQueryString(query: string): Map<string, string>;
export declare function removeNullCharacters(str: string, replaceInvisible?: boolean): string;
/**
 * Use binary search to find the index of the first item in a given array which
 * passes a given condition. The items are expected to be sorted in the sense
 * that if the condition is true for one item in the array, then it is also true
 * for all following items.
 *
 * @return Index of the first array element to pass the test,
 *  or |items.length| if no such element exists.
 */
export declare function binarySearchFirstItem<T>(items: T[], condition: (item: T) => boolean, start?: number): number;
/**
 * Approximates float number as a fraction using Farey sequence (max order
 * of 8).
 * @param x Positive float number.
 * @return Estimated fraction: the first array item is a numerator,
 *  the second one is a denominator.
 */
export declare function approximateFraction(x: number): [number, number];
export declare function roundToDivide(x: number, div: number): number;
interface _GetPageSizeInchesP {
    view: number[];
    userUnit: number;
    rotate: number;
}
interface PageSize {
    /**
     * In inches.
     */
    width: number;
    /**
     * In inches.
     */
    height: number;
}
/**
 * Gets the size of the specified page, converted from PDF units to inches.
 * @param - An Object containing the properties: {Array} `view`,
 *   {number} `userUnit`, and {number} `rotate`.
 * @return An Object containing the properties: {number} `width`
 *   and {number} `height`, given in inches.
 */
export declare function getPageSizeInches({ view, userUnit, rotate }: _GetPageSizeInchesP): PageSize;
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
export declare function backtrackBeforeAllVisibleElements(index: number, views: IVisibleView[], top: number): number;
export interface VisibleElement {
    id: number;
    x: number;
    y: number;
    view: IVisibleView;
    percent?: number;
    widthPercent?: number;
}
export interface VisibleElements {
    first?: VisibleElement;
    last?: VisibleElement;
    views: VisibleElement[];
    ids?: Set<number>;
}
interface _GetVisibleElementsP {
    /**
     * A container that can possibly scroll.
     */
    scrollEl: HTMLElement;
    /**
     * Objects with a `div` property that contains an
     * HTMLElement, which should all be descendants of `scrollEl` satisfying the
     * relevant layout assumptions.
     */
    views: IVisibleView[];
    /**
     * If `true`, the returned elements are
    l* sorted in descending order of the percent of their padding box that is
    l* visible. The default value is `false`.
     */
    sortByVisibility?: boolean;
    /**
     * If `true`, the elements are assumed to be
     * laid out horizontally instead of vertically. The default value is `false`.
     */
    horizontal?: boolean;
    /**
     * If `true`, the `scrollEl` container is assumed to
     * be in right-to-left mode. The default value is `false`.
     */
    rtl?: boolean;
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
export declare function getVisibleElements({ scrollEl, views, sortByVisibility, horizontal, rtl, }: _GetVisibleElementsP): VisibleElements;
/**
 * Event handler to suppress context menu.
 */
export declare function noContextMenuHandler(evt: Event): void;
export declare function normalizeWheelEventDirection(evt: WheelEvent): number;
export declare function normalizeWheelEventDelta(evt: WheelEvent): number;
export declare function isValidRotation(angle: unknown): boolean;
export declare function isValidScrollMode(mode: unknown): boolean;
export declare function isValidSpreadMode(mode: unknown): boolean;
export declare function isPortraitOrientation(size: {
    width: number;
    height: number;
}): boolean;
export declare const enum WaitOnType {
    EVENT = "event",
    TIMEOUT = "timeout"
}
/**
 * Promise that is resolved when DOM window becomes visible.
 */
export declare const animationStarted: Promise<unknown>;
export declare const docStyle: CSSStyleDeclaration | undefined;
export declare function clamp(v: number, min: number, max: number): number;
export declare class ProgressBar {
    #private;
    get percent(): number;
    set percent(val: number);
    _indeterminate?: boolean;
    constructor(bar: HTMLElement);
    setWidth(viewer?: HTMLDivElement): void;
    setDisableAutoFetch(delay?: number): void;
    hide(): void;
    show(): void;
}
/**
 * Get the active or focused element in current DOM.
 *
 * Recursively search for the truly active or focused element in case there are
 * shadow DOMs.
 *
 * @return the truly active or focused element.
 */
export declare function getActiveOrFocusedElement(): Element | null;
/**
 * Converts API PageLayout values to the format used by `BaseViewer`.
 * @param mode The API PageLayout value.
 * @return A value from {SpreadMode}.
 */
export declare function apiPageLayoutToViewerModes(layout: PageLayout): {
    scrollMode: ScrollMode.VERTICAL | ScrollMode.PAGE;
    spreadMode: SpreadMode.NONE | SpreadMode.ODD | SpreadMode.EVEN;
};
/**
 * Converts API PageMode values to the format used by `PDFSidebar`.
 * NOTE: There's also a "FullScreen" parameter which is not possible to support,
 *       since the Fullscreen API used in browsers requires that entering
 *       fullscreen mode only occurs as a result of a user-initiated event.
 * @param mode The API PageMode value.
 * @return A value from {SidebarView}.
 */
export declare function apiPageModeToSidebarView(mode: PageMode): SidebarView.NONE | SidebarView.THUMBS | SidebarView.OUTLINE | SidebarView.ATTACHMENTS | SidebarView.LAYERS;
export {};
//# sourceMappingURL=ui_utils.d.ts.map