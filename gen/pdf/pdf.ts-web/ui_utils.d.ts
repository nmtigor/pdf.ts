import { AnnotationElement, FileAttachmentAnnotationElement } from "../pdf.ts-src/display/annotation_layer.js";
import { OptionalContentConfig } from "../pdf.ts-src/display/optional_content_config.js";
import { ErrorMoreInfo, PDFViewerApplication } from "./app.js";
import { BaseViewer, PDFLocation } from "./base_viewer.js";
import { IVisibleView } from "./interfaces.js";
import { PDFAttachmentViewer } from "./pdf_attachment_viewer.js";
import { CursorTool, PDFCursorTools } from "./pdf_cursor_tools.js";
import { PDFFindBar } from "./pdf_find_bar.js";
import { FindState } from "./pdf_find_controller.js";
import { PDFLayerViewer } from "./pdf_layer_viewer.js";
import { PDFOutlineViewer } from "./pdf_outline_viewer.js";
import { PDFPresentationMode } from "./pdf_presentation_mode.js";
import { PDFScriptingManager } from "./pdf_scripting_manager.js";
import { PDFSidebar } from "./pdf_sidebar.js";
import { PDFSidebarResizer } from "./pdf_sidebar_resizer.js";
import { PDFFindController } from "./pdf_find_controller.js";
import { PDFLinkService } from "./pdf_link_service.js";
import { PDFPageView } from "./pdf_page_view.js";
import { TextLayerBuilder } from "./text_layer_builder.js";
import { SecondaryToolbar } from "./secondary_toolbar.js";
import { Toolbar } from "./toolbar.js";
export declare const DEFAULT_SCALE_VALUE = "auto";
export declare const DEFAULT_SCALE = 1;
export declare const DEFAULT_SCALE_DELTA = 1.1;
export declare const MIN_SCALE = 0.1;
export declare const MAX_SCALE = 10;
export declare const UNKNOWN_SCALE = 0;
export declare const MAX_AUTO_SCALE = 1.25;
export declare const SCROLLBAR_PADDING = 40;
export declare const VERTICAL_PADDING = 5;
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
    ENABLE = 1,
    ENABLE_ENHANCE = 2
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
/**
 * Used by `PDFViewerApplication`, and by the API unit-tests.
 */
export declare const AutoPrintRegExp: RegExp;
export interface OutputScale {
    sx: number;
    sy: number;
    scaled: boolean;
}
/**
 * Returns scale factor for the canvas. It makes sense for the HiDPI displays.
 * @return The object with horizontal (sx) and vertical (sy)
 *  scales. The scaled property is set to false if scaling is
 *  not required, true otherwise.
 */
export declare function getOutputScale(ctx: CanvasRenderingContext2D): OutputScale;
/**
 * Scrolls specified element into view of its parent.
 * @param element The element to be visible.
 * @param spot An object with optional top and left properties,
 *   specifying the offset from the top left edge.
 * @param scrollMatches When scrolling search results into view,
 *   ignore elements that either: Contains marked content identifiers,
 *   or have the CSS-rule `overflow: hidden;` set. The default value is `false`.
 */
export declare function scrollIntoView(element: HTMLElement, spot?: {
    top?: number;
    left?: number;
}, scrollMatches?: boolean): void;
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
/**
 * Use binary search to find the index of the first item in a given array which
 * passes a given condition. The items are expected to be sorted in the sense
 * that if the condition is true for one item in the array, then it is also true
 * for all following items.
 *
 * @return Index of the first array element to pass the test,
 *  or |items.length| if no such element exists.
 */
export declare function binarySearchFirstItem<T>(items: T[], condition: (view: T) => boolean): number;
/**
 * Approximates float number as a fraction using Farey sequence (max order
 * of 8).
 * @param x Positive float number.
 * @return Estimated fraction: the first array item is a numerator,
 *  the second one is a denominator.
 */
export declare function approximateFraction(x: number): [number, number];
export declare function roundToDivide(x: number, div: number): number;
interface GetPageSizeInchesParms {
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
export declare function getPageSizeInches({ view, userUnit, rotate }: GetPageSizeInchesParms): PageSize;
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
}
interface GetVisibleElementsParms {
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
export declare function getVisibleElements({ scrollEl, views, sortByVisibility, horizontal, rtl, }: GetVisibleElementsParms): VisibleElements;
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
interface WaitOnEventOrTimeoutParameters {
    /**
     * The event target, can for example be:
     * `window`, `document`, a DOM element, or an {EventBus} instance.
     */
    target: EventBus | typeof window;
    /**
     * The name of the event.
     */
    name: EventName;
    /**
     * The delay, in milliseconds, after which the
     * timeout occurs (if the event wasn't already dispatched).
     */
    delay?: number;
}
/**
 * Allows waiting for an event or a timeout, whichever occurs first.
 * Can be used to ensure that an action always occurs, even when an event
 * arrives late or not at all.
 *
 * @return A promise that is resolved with a {WaitOnType} value.
 */
export declare function waitOnEventOrTimeout({ target, name, delay }: WaitOnEventOrTimeoutParameters): Promise<unknown>;
/**
 * Promise that is resolved when DOM window becomes visible.
 */
export declare const animationStarted: Promise<unknown>;
export interface MatchesCount {
    current: number;
    total: number;
}
export interface EventMap {
    afterprint: {};
    annotationlayerrendered: {
        source: PDFPageView;
        pageNumber: number;
        error: unknown | undefined;
    };
    attachmentsloaded: {
        source: PDFAttachmentViewer;
        attachmentsCount: number;
    };
    baseviewerinit: {
        source: BaseViewer;
    };
    beforeprint: {
        source: typeof window;
    };
    currentoutlineitem: {
        source: PDFSidebar;
    };
    cursortoolchanged: {
        source: PDFCursorTools;
        tool: CursorTool;
    };
    dispatcheventinsandbox: {
        source: AnnotationElement;
        detail: {
            id: string;
            ids?: string[];
            name: string;
            value?: string | string[] | number | boolean | null;
            shift?: boolean;
            modifier?: boolean;
            willCommit?: boolean;
            commitKey?: number;
            selStart?: number | null;
            selEnd?: number | null;
            change?: unknown;
            changeEx?: unknown;
            keyDown?: boolean;
        };
    };
    documentinit: {
        source: PDFViewerApplication;
    };
    documentloaded: {
        source: PDFViewerApplication;
    };
    documentproperties: {};
    download: {
        source: typeof window;
    };
    find: {
        source: typeof window | PDFFindBar | PDFLinkService;
        type: string;
        query: string;
        phraseSearch: boolean;
        caseSensitive: boolean;
        entireWord: boolean;
        highlightAll: boolean;
        findPrevious?: boolean | undefined;
    };
    findbarclose: {
        source: PDFFindBar;
    };
    findfromurlhash: {
        source: PDFLinkService;
        query: string;
        phraseSearch: boolean;
    };
    fileattachmentannotation: {
        source: FileAttachmentAnnotationElement;
        id: string;
        filename: string;
        content?: Uint8Array | Uint8ClampedArray | undefined;
    };
    fileinputchange: {
        source: HTMLInputElement | HTMLDivElement;
        fileInput: EventTarget | DataTransfer | null;
    };
    firstpage: {
        source: PDFPresentationMode;
    };
    hashchange: {
        source: typeof window;
        hash: string;
    };
    lastpage: {
        source: PDFPresentationMode;
    };
    layersloaded: {
        source: PDFLayerViewer;
        layersCount: number;
    };
    localized: {
        source: PDFViewerApplication;
    };
    metadataloaded: {
        source: PDFViewerApplication;
    };
    namedaction: {
        source: PDFLinkService;
        action: string;
    };
    nextpage: {};
    openfile: {
        source: typeof window;
    };
    optionalcontentconfig: {
        source: PDFLayerViewer;
        promise: Promise<OptionalContentConfig | undefined>;
    };
    optionalcontentconfigchanged: {
        source: BaseViewer;
        promise: Promise<OptionalContentConfig | undefined>;
    };
    outlineloaded: {
        source: PDFOutlineViewer;
        outlineCount: number;
        currentOutlineItemPromise: Promise<boolean>;
    };
    pagechanging: {
        source: BaseViewer;
        pageNumber: number;
        pageLabel?: string | undefined;
        previous: number;
    };
    pageclose: {
        source: BaseViewer;
        pageNumber: number;
    };
    pagemode: {
        source: PDFLinkService;
        mode: string;
    };
    pagenumberchanged: {
        source: Toolbar;
        value: string;
    };
    pageopen: {
        source: BaseViewer;
        pageNumber: number;
        actionsPromise?: Promise<object>;
    };
    pagerender: {
        source: PDFPageView;
        pageNumber: number;
    };
    pagerendered: {
        source: PDFPageView;
        pageNumber: number;
        cssTransform: boolean;
        timestamp: number;
        error?: ErrorMoreInfo | undefined;
    };
    pagesdestroy: {
        source: BaseViewer;
    };
    pagesinit: {
        source: BaseViewer;
    };
    pagesloaded: {
        source: BaseViewer;
        pagesCount: number;
    };
    presentationmode: {};
    presentationmodechanged: {
        source: PDFPresentationMode;
        state: PresentationModeState;
        active?: boolean;
        switchInProgress?: boolean;
    };
    previouspage: {};
    print: {};
    resetlayers: {
        source: PDFSidebar;
    };
    resize: {
        source: typeof window | HTMLDivElement | PDFSidebarResizer;
    };
    rotatecw: {
        source: PDFPresentationMode;
    };
    rotateccw: {
        source: PDFPresentationMode;
    };
    rotationchanging: {
        source: BaseViewer;
        pagesRotation: number;
        pageNumber: number;
    };
    sandboxcreated: {
        source: PDFViewerApplication | PDFScriptingManager;
    };
    save: {};
    secondarytoolbarreset: {
        source: SecondaryToolbar;
    };
    scalechanging: {
        source: BaseViewer;
        scale: number;
        presetValue?: number | string | undefined;
    };
    scalechanged: {
        source: Toolbar;
        value: string;
    };
    sidebarviewchanged: {
        source: PDFSidebar;
        view: SidebarView;
    };
    scrollmodechanged: {
        source?: BaseViewer;
        mode: ScrollMode;
    };
    spreadmodechanged: {
        source: BaseViewer;
        mode: SpreadMode;
    };
    switchcursortool: {
        tool: CursorTool;
    };
    switchscrollmode: {
        mode: ScrollMode;
    };
    switchspreadmode: {
        mode: SpreadMode;
    };
    textlayerrendered: {
        source: TextLayerBuilder;
        pageNumber: number;
        numTextDivs: number;
    };
    togglelayerstree: {};
    toggleoutlinetree: {
        source: PDFSidebar;
    };
    updatefindcontrolstate: {
        source: PDFFindController;
        state: FindState;
        previous?: boolean | undefined;
        matchesCount: MatchesCount;
        rawQuery: string | null;
    };
    updatefindmatchescount: {
        source: PDFFindController;
        matchesCount: MatchesCount;
    };
    updatefromsandbox: {
        source: Window & typeof globalThis;
        detail: {
            id?: string;
            focus?: boolean;
            siblings?: string[];
        } & ({
            command: "layout";
            value: PageLayout;
        } | {
            command: string;
            value: number | string;
        });
    };
    updatetextlayermatches: {
        source: PDFFindController;
        pageIndex: number;
    };
    updateviewarea: {
        source: BaseViewer;
        location?: PDFLocation | undefined;
    };
    xfalayerrendered: {
        source: PDFPageView;
        pageNumber: number;
        error: unknown;
    };
    zoomin: {};
    zoomout: {};
    zoomreset: {};
}
export declare type EventName = keyof EventMap;
export declare type ListenerMap = {
    [EN in EventName]: (evt: EventMap[EN]) => void;
};
/**
 * Simple event bus for an application. Listeners are attached using the `on`
 * and `off` methods. To raise an event, the `dispatch` method shall be used.
 */
export declare class EventBus {
    #private;
    constructor();
    on<EN extends EventName>(eventName: EN, listener: ListenerMap[EN], options?: {
        once: boolean;
    }): void;
    off<EN extends EventName>(eventName: EN, listener: ListenerMap[EN]): void;
    dispatch<EN extends EventName>(eventName: EN, data: EventMap[EN]): void;
    /**
     * @ignore
     */
    _on<EN extends EventName>(eventName: EN, listener: ListenerMap[EN], options?: {
        external?: boolean;
        once?: boolean | undefined;
    }): void;
    /**
     * @ignore
     */
    _off<EN extends EventName>(eventName: EN, listener: ListenerMap[EN]): void;
}
/**
 * NOTE: Only used to support various PDF viewer tests in `mozilla-central`.
 */
export declare class AutomationEventBus extends EventBus {
    dispatch<EN extends EventName>(eventName: EN, data: EventMap[EN]): void;
}
export declare function clamp(v: number, min: number, max: number): number;
export declare class ProgressBar {
    visible: boolean;
    div: HTMLDivElement;
    bar: HTMLDivElement;
    height: number;
    width: number;
    units: string;
    _percent: number;
    get percent(): number;
    _indeterminate?: boolean;
    constructor(id: string, { height, width, units }?: {
        height?: number;
        width?: number;
        units?: string;
    });
    _updateBar(): void;
    set percent(val: number);
    setWidth(viewer?: HTMLDivElement): void;
    hide(): void;
    show(): void;
}
/**
 * Moves all elements of an array that satisfy condition to the end of the
 * array, preserving the order of the rest.
 */
export declare function moveToEndOfArray<T>(arr: T[], condition: (elt: T) => boolean): void;
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
 * NOTE: This is supported to the extent that the viewer implements the
 *       necessary Scroll/Spread modes (since SinglePage, TwoPageLeft,
 *       and TwoPageRight all suggests using non-continuous scrolling).
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