import { AnnotationElement, FileAttachmentAnnotationElement } from "../pdf.ts-src/display/annotation_layer.js";
import { OptionalContentConfig } from "../pdf.ts-src/display/optional_content_config.js";
import { ErrorMoreInfo, PDFViewerApplication } from "./app.js";
import { BaseViewer, PDFLocation } from "./base_viewer.js";
import { PDFAttachmentViewer } from "./pdf_attachment_viewer.js";
import { CursorTool, PDFCursorTools } from "./pdf_cursor_tools.js";
import { PDFFindBar } from "./pdf_find_bar.js";
import { FindCtrlrState, FindState, MatchesCount, PDFFindController } from "./pdf_find_controller.js";
import { PDFLayerViewer } from "./pdf_layer_viewer.js";
import { PDFLinkService } from "./pdf_link_service.js";
import { PDFOutlineViewer } from "./pdf_outline_viewer.js";
import { PDFPageView } from "./pdf_page_view.js";
import { PDFPresentationMode } from "./pdf_presentation_mode.js";
import { PDFScriptingManager } from "./pdf_scripting_manager.js";
import { PDFSidebar } from "./pdf_sidebar.js";
import { PDFSidebarResizer } from "./pdf_sidebar_resizer.js";
import { SecondaryToolbar } from "./secondary_toolbar.js";
import { TextLayerBuilder } from "./text_layer_builder.js";
import { Toolbar } from "./toolbar.js";
import { PageLayout, PresentationModeState, ScrollMode, SidebarView, SpreadMode } from "./ui_utils.js";
export declare const enum WaitOnType {
    EVENT = "event",
    TIMEOUT = "timeout"
}
interface WaitOnEventOrTimeoutParms {
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
    delay: number;
}
/**
 * Allows waiting for an event or a timeout, whichever occurs first.
 * Can be used to ensure that an action always occurs, even when an event
 * arrives late or not at all.
 *
= * @return A promise that is resolved with a {WaitOnType} value.
 */
export declare function waitOnEventOrTimeout({ target, name, delay }: WaitOnEventOrTimeoutParms): Promise<unknown>;
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
    find: FindCtrlrState & {
        source: typeof window | PDFFindBar | PDFLinkService;
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
export {};
//# sourceMappingURL=event_utils.d.ts.map