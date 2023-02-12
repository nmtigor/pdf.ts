import { AnnotationEditorParamsType, AnnotationEditorType, AnnotationEditorUIManager, AnnotationElement, DispatchUpdateStatesP, FileAttachmentAnnotationElement, OptionalContentConfig, PropertyToUpdate, ScriptingActionName } from "../pdf.ts-src/pdf.js";
import { AnnotationEditorParams } from "./annotation_editor_params.js";
import { ErrorMoreInfo, PDFViewerApplication } from "./app.js";
import { PDFAttachmentViewer } from "./pdf_attachment_viewer.js";
import { CursorTool, PDFCursorTools } from "./pdf_cursor_tools.js";
import { PDFFindBar } from "./pdf_find_bar.js";
import { FindCtrlState, FindState, MatchesCount, PDFFindController } from "./pdf_find_controller.js";
import { PDFLayerViewer } from "./pdf_layer_viewer.js";
import { PDFLinkService } from "./pdf_link_service.js";
import { PDFOutlineViewer } from "./pdf_outline_viewer.js";
import { PDFPageView } from "./pdf_page_view.js";
import { PDFPresentationMode } from "./pdf_presentation_mode.js";
import { PDFScriptingManager } from "./pdf_scripting_manager.js";
import { PDFSidebar } from "./pdf_sidebar.js";
import { PDFSidebarResizer } from "./pdf_sidebar_resizer.js";
import { PDFLocation, PDFViewer } from "./pdf_viewer.js";
import { SecondaryToolbar } from "./secondary_toolbar.js";
import { Toolbar } from "./toolbar.js";
import { PageLayout, PresentationModeState, ScrollMode, SidebarView, SpreadMode } from "./ui_utils.js";
export declare const enum WaitOnType {
    EVENT = "event",
    TIMEOUT = "timeout"
}
interface _WaitOnEventOrTimeoutP {
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
export declare function waitOnEventOrTimeout({ target, name, delay, }: _WaitOnEventOrTimeoutP): Promise<unknown>;
export interface EventMap {
    afterprint: {};
    annotationeditorlayerrendered: {
        source: PDFPageView;
        pageNumber: number;
        error: unknown;
    };
    annotationeditormodechanged: {
        source: PDFViewer;
        mode: AnnotationEditorType;
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
    download: {
        source: typeof window | PDFScriptingManager;
    };
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
        query: string;
        phraseSearch: boolean;
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
        source: AnnotationEditorUIManager;
        mode: AnnotationEditorType;
    };
    switchannotationeditorparams: {
        source: AnnotationEditorParams;
        type: AnnotationEditorParamsType;
        value: string | number;
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
        rawQuery: string | undefined;
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