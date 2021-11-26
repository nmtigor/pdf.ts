import "../../lib/jslang.js";
import { EventBus, ProgressBar, ScrollMode, SidebarView, SpreadMode } from "./ui_utils.js";
import { UNSUPPORTED_FEATURES } from "../pdf.ts-src/pdf.js";
import { PDFCursorTools } from "./pdf_cursor_tools.js";
import { PDFRenderingQueue } from "./pdf_rendering_queue.js";
import { OverlayManager } from "./overlay_manager.js";
import { PasswordPrompt } from "./password_prompt.js";
import { PDFAttachmentViewer } from "./pdf_attachment_viewer.js";
import { PDFDocumentProperties } from "./pdf_document_properties.js";
import { PDFFindBar } from "./pdf_find_bar.js";
import { FindState, type MatchesCount, PDFFindController } from "./pdf_find_controller.js";
import { PDFHistory } from "./pdf_history.js";
import { PDFLayerViewer } from "./pdf_layer_viewer.js";
import { PDFLinkService } from "./pdf_link_service.js";
import { PDFOutlineViewer } from "./pdf_outline_viewer.js";
import { PDFPresentationMode } from "./pdf_presentation_mode.js";
import { PDFSidebarResizer } from "./pdf_sidebar_resizer.js";
import { PDFThumbnailViewer } from "./pdf_thumbnail_viewer.js";
import { PDFViewer } from "./pdf_viewer.js";
import { SecondaryToolbar } from "./secondary_toolbar.js";
import { Toolbar } from "./toolbar.js";
import { ViewHistory } from "./view_history.js";
import { DownloadManager } from "./download_manager.js";
import { type ViewerConfiguration } from "./viewer.js";
import { BasePreferences } from "./preferences.js";
import { Locale } from "../../lib/Locale.js";
import { PDFDataRangeTransport, PDFDocumentLoadingTask, PDFDocumentProxy, type PDFDocumentStats } from "../pdf.ts-src/display/api.js";
import { Metadata } from "../pdf.ts-src/display/metadata.js";
import { type PageOverview } from "./base_viewer.js";
import { OptionalContentConfig } from "../pdf.ts-src/display/optional_content_config.js";
import { PDFPrintService } from "./pdf_print_service.js";
import { PDFSidebar } from "./pdf_sidebar.js";
import { type DocumentInfo } from "../pdf.ts-src/core/document.js";
import { type IL10n, IScripting } from "./interfaces.js";
import { PDFScriptingManager } from "./pdf_scripting_manager.js";
import { WorkerMessageHandler } from "../pdf.ts-src/core/worker.js";
export interface FindControlState {
    result: FindState;
    findPrevious?: boolean | undefined;
    matchesCount: MatchesCount;
    rawQuery: string | null;
}
export interface PassiveLoadingCbs {
    onOpenWithTransport(url: ViewerAppOpenParms_file, length: number, transport: PDFDataRangeTransport): void;
    onOpenWithData(data: ViewerAppOpenParms_file, contentDispositionFilename: string): void;
    onOpenWithURL(url: string, length?: number, originalUrl?: string): void;
    onError(err?: ErrorMoreInfo): void;
    onProgress(loaded: number, total: number): void;
}
declare type TelemetryType = 'documentInfo' | 'documentStats' | 'pageInfo' | 'print' | 'tagged' | 'unsupportedFeature';
interface TelemetryData {
    type: TelemetryType;
    featureId?: UNSUPPORTED_FEATURES | undefined;
    formType?: string;
    generator?: string;
    stats?: PDFDocumentStats;
    tagged?: boolean;
    timestamp?: number;
    version?: string;
}
export interface FallbackParams {
    featureId: UNSUPPORTED_FEATURES | undefined;
    url: string;
}
export declare class DefaultExternalServices {
    updateFindControlState(data: FindControlState): void;
    updateFindMatchesCount(data: MatchesCount): void;
    initPassiveLoading(callbacks: PassiveLoadingCbs): void;
    fallback(data: FallbackParams): Promise<unknown>;
    reportTelemetry(data: TelemetryData): void;
    createDownloadManager(): DownloadManager;
    createPreferences(): BasePreferences;
    createL10n({ locale }?: {
        locale?: Locale | undefined;
    }): IL10n;
    createScripting(options: {
        sandboxBundleSrc?: string | undefined;
    }): IScripting;
    get supportsIntegratedFind(): boolean;
    get supportsDocumentFonts(): boolean;
    get supportedMouseWheelZoomModifierKeys(): {
        ctrlKey: boolean;
        metaKey: boolean;
    };
    get isInAutomation(): boolean;
}
interface SetInitialViewParms {
    rotation?: number | undefined;
    sidebarView?: SidebarView | undefined;
    scrollMode?: ScrollMode | undefined;
    spreadMode?: SpreadMode | undefined;
}
export interface ErrorMoreInfo {
    message: string;
    stack?: string;
    filename?: string;
    lineNumber?: number;
}
export declare type ScriptingDocProperties = DocumentInfo & {
    baseURL: string;
    filesize?: number;
    filename: string;
    metadata?: string;
    authors?: string | string[];
    numPages: number;
    URL: string;
};
declare type ViewerAppOpenParms_file = string | Uint8Array | {
    url: string;
    originalUrl: string;
};
interface ViewerAppOpenParms_args {
    length: number;
    range?: PDFDataRangeTransport;
}
export declare class PDFViewerApplication {
    #private;
    initialBookmark: string | undefined;
    initialRotation?: number | undefined;
    _fellback: boolean;
    appConfig: ViewerConfiguration;
    pdfDocument: PDFDocumentProxy | undefined;
    pdfLoadingTask: PDFDocumentLoadingTask | undefined;
    printService: PDFPrintService | undefined;
    store: ViewHistory | undefined;
    eventBus: EventBus;
    overlayManager: OverlayManager;
    pdfRenderingQueue: PDFRenderingQueue;
    pdfLinkService: PDFLinkService;
    downloadManager: DownloadManager;
    findController: PDFFindController;
    pdfScriptingManager: PDFScriptingManager;
    pdfViewer: PDFViewer;
    pdfThumbnailViewer: PDFThumbnailViewer;
    pdfHistory: PDFHistory;
    findBar?: PDFFindBar;
    pdfDocumentProperties: PDFDocumentProperties;
    pdfCursorTools: PDFCursorTools;
    toolbar: Toolbar;
    secondaryToolbar: SecondaryToolbar;
    pdfPresentationMode?: PDFPresentationMode;
    passwordPrompt: PasswordPrompt;
    pdfOutlineViewer: PDFOutlineViewer;
    pdfAttachmentViewer: PDFAttachmentViewer;
    pdfLayerViewer: PDFLayerViewer;
    pdfSidebar: PDFSidebar;
    pdfSidebarResizer: PDFSidebarResizer;
    preferences: BasePreferences;
    l10n: IL10n;
    isInitialViewSet: boolean;
    downloadComplete: boolean;
    isViewerEmbedded: boolean;
    url: string;
    baseUrl: string;
    _downloadUrl: string;
    externalServices: DefaultExternalServices;
    _boundEvents: Record<string, ((...args: any[]) => void) | undefined>;
    documentInfo: DocumentInfo | undefined;
    metadata: Metadata | undefined;
    _contentLength: number | undefined;
    _saveInProgress: boolean;
    _wheelUnusedTicks: number;
    _idleCallbacks: Set<unknown>;
    disableAutoFetchLoadingBarTimeout: number | undefined;
    _annotationStorageModified?: boolean;
    constructor();
    /**
     * Called once when the document is loaded.
     */
    initialize(appConfig: ViewerConfiguration): Promise<void>;
    run(config: ViewerConfiguration): void;
    get initialized(): boolean;
    get initializedPromise(): Promise<void>;
    zoomIn(steps?: number): void;
    zoomOut(steps?: number): void;
    zoomReset(): void;
    get pagesCount(): number;
    get page(): number;
    set page(val: number);
    get supportsPrinting(): boolean;
    get supportsFullscreen(): any;
    get supportsIntegratedFind(): boolean;
    get supportsDocumentFonts(): boolean;
    get loadingBar(): ProgressBar;
    get supportedMouseWheelZoomModifierKeys(): {
        ctrlKey: boolean;
        metaKey: boolean;
    };
    initPassiveLoading(): void;
    setTitleUsingUrl(url?: string, downloadUrl?: string): void;
    setTitle(title: string): void;
    get _docFilename(): string;
    /**
     * @private
     */
    _hideViewBookmark(): void;
    /**
     * Closes opened PDF document.
     * @return Returns the promise, which is resolved when all
     *  destruction is completed.
     */
    close(): Promise<void>;
    /**
     * Opens PDF document specified by URL or array with additional arguments.
     * @param file PDF location or binary data.
     * @param args Additional arguments for the getDocument call,
     *  e.g. HTTP headers ('httpHeaders') or alternative data transport ('range').
     * @return Returns the promise, which is resolved when document is opened.
     */
    open(file: ViewerAppOpenParms_file, args?: ViewerAppOpenParms_args): Promise<void | undefined>;
    download({ sourceEventType }?: {
        sourceEventType?: string | undefined;
    }): Promise<void>;
    save({ sourceEventType }?: {
        sourceEventType?: string | undefined;
    }): Promise<void>;
    downloadOrSave(options: {
        sourceEventType: "download" | "save";
    }): void;
    fallback: (featureId?: UNSUPPORTED_FEATURES | undefined) => void;
    /**
     * Show the error box; used for errors affecting loading and/or parsing of
     * the entire PDF document.
     */
    _documentError(message: string, moreInfo?: ErrorMoreInfo): void;
    /**
     * Show the error box; used for errors affecting e.g. only a single page.
     *
     * @param message A message that is human readable.
     * @param moreInfo Further information about the error that is
     *  more technical.  Should have a 'message' and
     *  optionally a 'stack' property.
     */
    _otherError(message: string, moreInfo?: ErrorMoreInfo): void;
    progress(level: number): void;
    load(pdfDocument: PDFDocumentProxy): void;
    setInitialView(storedHash?: string, { rotation, sidebarView, scrollMode, spreadMode }?: SetInitialViewParms): void;
    _cleanup: () => void;
    forceRendering: () => void;
    beforePrint: () => void;
    afterPrint: () => void;
    rotatePages(delta: number): void;
    requestPresentationMode(): void;
    triggerPrinting(): void;
    bindEvents(): void;
    bindWindowEvents(): void;
    unbindEvents(): void;
    unbindWindowEvents(): void;
    accumulateWheelTicks(ticks: number): number;
    /**
     * Used together with the integration-tests, to enable awaiting full
     * initialization of the scripting/sandbox.
     */
    get scriptingReady(): boolean;
}
export declare const viewerapp: PDFViewerApplication;
export interface PDFJSWorker {
    WorkerMessageHandler: typeof WorkerMessageHandler;
}
declare global {
    interface Window {
        pdfjsWorker?: PDFJSWorker;
    }
}
export declare const PDFPrintServiceFactory: {
    instance: {
        supportsPrinting: boolean;
        createPrintService(pdfDocument: PDFDocumentProxy, pagesOverview: PageOverview[], printContainer: HTMLDivElement, printResolution: number | undefined, optionalContentConfigPromise: Promise<OptionalContentConfig | undefined> | undefined, l10n: IL10n): PDFPrintService;
    };
};
export {};
//# sourceMappingURL=app.d.ts.map