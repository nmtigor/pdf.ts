import type { AnnotationEditor } from "../pdf.ts-src/display/editor/editor.js";
import type { AnnotationEditorParamsType, AnnotationEditorType, AnnotationEditorUIManager, AnnotationElement, DispatchUpdateStatesP, FileAttachmentAnnotationElement, OptionalContentConfig, PDFPageProxy, PropertyToUpdate, ScriptingActionName } from "../pdf.ts-src/pdf.js";
import type { AltTextManager, TelemetryData } from "./alt_text_manager.js";
import type { AnnotationEditorParams } from "./annotation_editor_params.js";
import type { ErrorMoreInfo, PDFViewerApplication } from "./app.js";
import type { PDFAttachmentViewer } from "./pdf_attachment_viewer.js";
import type { PDFCursorTools } from "./pdf_cursor_tools.js";
import type { PDFFindBar } from "./pdf_find_bar.js";
import type { FindCtrlState, FindState, MatchesCount, PDFFindController } from "./pdf_find_controller.js";
import type { PDFLayerViewer } from "./pdf_layer_viewer.js";
import type { PDFLinkService } from "./pdf_link_service.js";
import type { PDFOutlineViewer } from "./pdf_outline_viewer.js";
import type { PDFPageView } from "./pdf_page_view.js";
import type { PDFPresentationMode } from "./pdf_presentation_mode.js";
import type { PDFScriptingManager } from "./pdf_scripting_manager.js";
import type { PDFSidebar } from "./pdf_sidebar.js";
import type { PDFThumbnailView } from "./pdf_thumbnail_view.js";
import type { PDFLocation, PDFViewer } from "./pdf_viewer.js";
import type { SecondaryToolbar } from "./secondary_toolbar.js";
import type { Toolbar as GeckoviewToolbar } from "./toolbar-geckoview.js";
import type { Toolbar } from "./toolbar.js";
import type { CursorTool, PageLayout, PresentationModeState, ScrollMode, SidebarView, SpreadMode } from "./ui_utils.js";
export declare const enum WaitOnType {
    EVENT = "event",
    TIMEOUT = "timeout"
}
interface WaitOnEventOrTimeoutP_ {
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
export declare function waitOnEventOrTimeout({ target, name, delay, }: WaitOnEventOrTimeoutP_): Promise<unknown>;
export interface EventMap {
    afterprint: {};
    annotationeditorlayerrendered: {
        source: PDFPageView;
        pageNumber: number;
        error: unknown;
    };
    annotationeditormodechanged: {
        source: PDFViewer;
        mode: AnnotationEditorType | undefined;
    };
    annotationeditorparamschanged: {
        source: AnnotationEditorUIManager;
        details: PropertyToUpdate[];
    };
    annotationeditorstateschanged: {
        source: AnnotationEditorUIManager;
        details: DispatchUpdateStatesP;
    };
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
        source: PDFViewer;
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
            name: ScriptingActionName;
            value?: string | string[] | number | boolean | undefined;
            shift?: boolean;
            modifier?: boolean;
            willCommit?: boolean;
            commitKey?: number;
            selStart?: number | null;
            selEnd?: number | null;
            change?: unknown;
            changeEx?: string | string[] | undefined;
            keyDown?: boolean;
        };
    };
    documenterror: {
        source: PDFViewerApplication;
        message: string;
        reason: string | undefined;
    };
    documentinit: {
        source: PDFViewerApplication;
    };
    documentloaded: {
        source: PDFViewerApplication;
    };
    documentproperties: {};
    download: {};
    editingaction: {
        source: typeof window;
        name: string;
    };
    find: FindCtrlState & {
        source: typeof window | PDFFindBar | PDFLinkService;
    };
    findbarclose: {
        source: typeof window | PDFFindBar;
    };
    findfromurlhash: {
        source: PDFLinkService;
        query: string | RegExpMatchArray | null;
    };
    fileattachmentannotation: {
        source: FileAttachmentAnnotationElement;
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
    openinexternalapp: {};
    optionalcontentconfig: {
        source: PDFLayerViewer;
        promise: Promise<OptionalContentConfig | undefined>;
    };
    optionalcontentconfigchanged: {
        source: PDFViewer;
        promise: Promise<OptionalContentConfig | undefined>;
    };
    outlineloaded: {
        source: PDFOutlineViewer;
        outlineCount: number;
        currentOutlineItemPromise: Promise<boolean>;
    };
    pagechanging: {
        source: PDFViewer;
        pageNumber: number;
        pageLabel?: string | undefined;
        previous: number;
    };
    pageclose: {
        source: PDFViewer;
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
        source: PDFViewer;
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
        source: PDFViewer;
    };
    pagesinit: {
        source: PDFViewer;
    };
    pagesloaded: {
        source: PDFViewer;
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
    reporttelemetry: {
        source: AnnotationEditor | AltTextManager | SecondaryToolbar | GeckoviewToolbar;
        details: {
            type: "editing" | "buttons" | "gv-buttons" | "pageInfo";
            subtype?: string;
            timestamp?: number;
            data?: TelemetryData | {
                action: "alt_text_tooltip" | "inserted_image";
            } | {
                id: string;
            } | {
                type: "freetext" | "ink" | "print" | "save" | "stamp";
            };
        };
    };
    resize: {
        source: typeof window | HTMLDivElement | PDFSidebar;
    };
    rotatecw: {
        source: PDFPresentationMode;
    };
    rotateccw: {
        source: PDFPresentationMode;
    };
    rotationchanging: {
        source: PDFViewer;
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
        source: PDFViewer;
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
        source?: PDFViewer;
        mode: ScrollMode;
    };
    spreadmodechanged: {
        source: PDFViewer;
        mode: SpreadMode;
    };
    switchannotationeditormode: {
        source: AnnotationElement | AnnotationEditorUIManager;
        mode: AnnotationEditorType | undefined;
        editId?: string;
        isFromKeyboard?: boolean;
    };
    switchannotationeditorparams: {
        source: AnnotationEditorParams;
        type: AnnotationEditorParamsType;
        value: string | number | undefined;
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
        source: PDFPageView;
        pageNumber: number;
        numTextDivs: number;
        error: unknown;
    };
    thumbnailrendered: {
        source: PDFThumbnailView;
        pageNumber: number;
        pdfPage: PDFPageProxy | undefined;
    };
    togglelayerstree: {};
    toggleoutlinetree: {
        source: PDFSidebar;
    };
    toolbarreset: {
        source: Toolbar;
    };
    updatefindcontrolstate: {
        source: PDFFindController;
        state: FindState;
        previous?: boolean | undefined;
        matchesCount: MatchesCount;
        rawQuery: string | string[] | RegExpMatchArray | null;
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
        source: PDFViewer;
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
    test: {};
}
export type EventName = keyof EventMap;
export type ListenerMap = {
    [EN in EventName]: (evt: EventMap[EN]) => void;
};
/**
 * Simple event bus for an application. Listeners are attached using the `on`
 * and `off` methods. To raise an event, the `dispatch` method shall be used.
 */
export declare class EventBus {
    #private;
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