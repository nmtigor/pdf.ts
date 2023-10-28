import { Locale } from "../../lib/Locale.js";
import "../../lib/jslang.js";
import type { DocumentInfo, Metadata, OptionalContentConfig, PDFDataRangeTransport, PDFDocumentLoadingTask, PDFDocumentProxy, PrintAnnotationStorage } from "../pdf.ts-src/pdf.js";
import { WorkerMessageHandler } from "../pdf.ts-src/pdf.js";
import { AnnotationEditorParams } from "./annotation_editor_params.js";
import { PDFBug } from "./debugger.js";
import { EventBus, type EventMap } from "./event_utils.js";
import type { NimbusExperimentData } from "./firefoxcom.js";
import type { IDownloadManager, IL10n, IScripting } from "./interfaces.js";
import { OverlayManager } from "./overlay_manager.js";
import { PasswordPrompt } from "./password_prompt.js";
import { PDFAttachmentViewer } from "./pdf_attachment_viewer.js";
import { PDFCursorTools } from "./pdf_cursor_tools.js";
import { PDFDocumentProperties } from "./pdf_document_properties.js";
import { PDFFindBar } from "./pdf_find_bar.js";
import type { FindState, MatchesCount } from "./pdf_find_controller.js";
import { PDFFindController } from "./pdf_find_controller.js";
import { PDFHistory } from "./pdf_history.js";
import { PDFLayerViewer } from "./pdf_layer_viewer.js";
import { PDFLinkService } from "./pdf_link_service.js";
import { PDFOutlineViewer } from "./pdf_outline_viewer.js";
import { PDFPresentationMode } from "./pdf_presentation_mode.js";
import type { PDFPrintService } from "./pdf_print_service.js";
import { PDFRenderingQueue } from "./pdf_rendering_queue.js";
import { PDFScriptingManager } from "./pdf_scripting_manager.js";
import { PDFSidebar } from "./pdf_sidebar.js";
import { PDFThumbnailViewer } from "./pdf_thumbnail_viewer.js";
import { type PageOverview, PDFViewer } from "./pdf_viewer.js";
import type { BasePreferences } from "./preferences.js";
import { SecondaryToolbar } from "./secondary_toolbar.js";
import { Toolbar as GeckoviewToolbar } from "./toolbar-geckoview.js";
import { Toolbar } from "./toolbar.js";
import { ProgressBar, ScrollMode, SidebarView, SpreadMode } from "./ui_utils.js";
import { ViewHistory } from "./view_history.js";
import type { ViewerConfiguration } from "./viewer.js";
export interface FindControlState {
    result: FindState;
    findPrevious?: boolean | undefined;
    matchesCount: MatchesCount;
    rawQuery: string | string[] | RegExpMatchArray | null;
}
export interface PassiveLoadingCbs {
    onOpenWithTransport(_x: PDFDataRangeTransport): void;
    onOpenWithData(data: ArrayBuffer, contentDispositionFilename: string): void;
    onOpenWithURL(url: string, length?: number, originalUrl?: string): void;
    onError(err?: ErrorMoreInfo): void;
    onProgress(loaded: number, total: number): void;
}
export declare class DefaultExternalServices {
    updateFindControlState(data: FindControlState): void;
    updateFindMatchesCount(data: MatchesCount): void;
    initPassiveLoading(callbacks: PassiveLoadingCbs): void;
    reportTelemetry(data: EventMap["reporttelemetry"]["details"]): void;
    createDownloadManager(): IDownloadManager;
    createPreferences(): BasePreferences;
    createL10n({ locale }?: {
        locale?: Locale | undefined;
    }): IL10n;
    createScripting(options: {
        sandboxBundleSrc?: string | undefined;
    }): IScripting;
    get supportsPinchToZoom(): boolean;
    get supportsIntegratedFind(): boolean;
    get supportsDocumentFonts(): boolean;
    get supportedMouseWheelZoomModifierKeys(): {
        ctrlKey: boolean;
        metaKey: boolean;
    };
    get isInAutomation(): boolean;
    updateEditorStates(data: EventMap["annotationeditorstateschanged"]): void;
    get canvasMaxAreaInBytes(): number;
    getNimbusExperimentData(): Promise<NimbusExperimentData | undefined>;
}
interface SetInitialViewP_ {
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
export interface ScriptingDocProperties extends DocumentInfo {
    baseURL: string;
    filesize?: number;
    filename: string;
    metadata?: string | undefined;
    authors?: string | string[] | undefined;
    numPages: number;
    URL: string;
}
type OpenP_ = {
    url?: string;
    length?: number | undefined;
    data?: ArrayBuffer;
    range?: PDFDataRangeTransport;
    originalUrl?: string | undefined;
};
type TouchInfo_ = {
    touch0X: number;
    touch0Y: number;
    touch1X: number;
    touch1Y: number;
};
export declare class PDFViewerApplication {
    #private;
    initialBookmark: string | undefined;
    initialRotation?: number | undefined;
    appConfig: ViewerConfiguration;
    pdfDocument: PDFDocumentProxy | undefined;
    pdfLoadingTask: PDFDocumentLoadingTask | undefined;
    printService: PDFPrintService | undefined;
    store: ViewHistory | undefined;
    eventBus: EventBus;
    overlayManager: OverlayManager;
    pdfRenderingQueue: PDFRenderingQueue;
    pdfLinkService: PDFLinkService;
    downloadManager: IDownloadManager;
    findController: PDFFindController;
    pdfScriptingManager: PDFScriptingManager;
    pdfViewer: PDFViewer;
    pdfThumbnailViewer?: PDFThumbnailViewer;
    pdfHistory: PDFHistory;
    findBar?: PDFFindBar;
    pdfDocumentProperties?: PDFDocumentProperties;
    pdfCursorTools: PDFCursorTools;
    toolbar?: Toolbar | GeckoviewToolbar;
    secondaryToolbar: SecondaryToolbar;
    pdfPresentationMode?: PDFPresentationMode;
    passwordPrompt: PasswordPrompt;
    pdfOutlineViewer: PDFOutlineViewer;
    pdfAttachmentViewer: PDFAttachmentViewer;
    pdfLayerViewer?: PDFLayerViewer;
    pdfSidebar?: PDFSidebar;
    preferences: BasePreferences;
    l10n: IL10n;
    annotationEditorParams?: AnnotationEditorParams;
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
    _wheelUnusedFactor: number;
    _touchUnusedTicks: number;
    _touchUnusedFactor: number;
    _PDFBug?: typeof PDFBug;
    _hasAnnotationEditors: boolean;
    _title: string;
    _printAnnotationStoragePromise: Promise<PrintAnnotationStorage | undefined> | undefined;
    _touchInfo: TouchInfo_ | undefined;
    _isCtrlKeyDown: boolean;
    _nimbusDataPromise?: Promise<NimbusExperimentData | undefined>;
    disableAutoFetchLoadingBarTimeout: number | undefined;
    _annotationStorageModified?: boolean;
    constructor();
    /**
     * Called once when the document is loaded.
     */
    initialize(appConfig: ViewerConfiguration): Promise<void>;
    run(config: ViewerConfiguration): Promise<void>;
    get initialized(): boolean;
    get initializedPromise(): Promise<void>;
    zoomIn(steps?: number, scaleFactor?: number): void;
    zoomOut(steps?: number, scaleFactor?: number): void;
    zoomReset(): void;
    get pagesCount(): number;
    get page(): number;
    set page(val: number);
    get supportsPrinting(): boolean;
    get supportsFullscreen(): boolean;
    get supportsPinchToZoom(): boolean;
    get supportsIntegratedFind(): boolean;
    get supportsDocumentFonts(): boolean;
    get loadingBar(): ProgressBar | null;
    get supportedMouseWheelZoomModifierKeys(): {
        ctrlKey: boolean;
        metaKey: boolean;
    };
    initPassiveLoading(file: string | undefined): void;
    setTitleUsingUrl(url?: string, downloadUrl?: string): void;
    setTitle(title?: string): void;
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
    /**
     * Opens a new PDF document.
     * @headconst @param args_x - Accepts any/all of the properties from
     *   {@link DocumentInitParameters}, and also a `originalUrl` string.
     * @return Promise that is resolved when the document is opened.
     */
    open(args_x: OpenP_ | string | ArrayBuffer): Promise<void | undefined>;
    download(options?: {}): Promise<void>;
    save(options?: {}): Promise<void>;
    downloadOrSave(options?: {}): void;
    openInExternalApp(): void;
    /**
     * Report the error; used for errors affecting loading and/or parsing of
     * the entire PDF document.
     */
    _documentError(message: string, moreInfo?: ErrorMoreInfo): void;
    /**
     * Report the error; used for errors affecting e.g. only a single page.
     *
     * @param message A message that is human readable.
     * @param moreInfo Further information about the error that is
     *  more technical. Should have a 'message' and
     *  optionally a 'stack' property.
     */
    _otherError(message: string, moreInfo?: ErrorMoreInfo): void;
    progress(level: number): void;
    load(pdfDocument: PDFDocumentProxy): void;
    setInitialView(storedHash?: string, { rotation, sidebarView, scrollMode, spreadMode }?: SetInitialViewP_): void;
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
    _accumulateTicks(ticks: number, prop: "_wheelUnusedTicks" | "_touchUnusedTicks"): number;
    _accumulateFactor(previousScale: number, factor: number, prop: "_wheelUnusedFactor" | "_touchUnusedFactor"): number;
    _centerAtPos(previousScale: number, x: number, y: number): void;
    /**
     * Used together with the integration-tests, to enable awaiting full
     * initialization of the scripting/sandbox.
     */
    get scriptingReady(): boolean;
}
export declare const viewerApp: PDFViewerApplication;
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
        createPrintService(pdfDocument: PDFDocumentProxy, pagesOverview: PageOverview[], printContainer: HTMLDivElement, printResolution: number | undefined, optionalContentConfigPromise: Promise<OptionalContentConfig | undefined> | undefined, printAnnotationStoragePromise?: Promise<PrintAnnotationStorage | undefined>, l10n?: IL10n): PDFPrintService;
    };
};
export {};
//# sourceMappingURL=app.d.ts.map