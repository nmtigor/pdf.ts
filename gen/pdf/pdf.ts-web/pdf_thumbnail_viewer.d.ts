/** @typedef {import("../src/display/api").PDFDocumentProxy} PDFDocumentProxy */
/** @typedef {import("../src/display/api").PDFPageProxy} PDFPageProxy */
/** @typedef {import("./event_utils").EventBus} EventBus */
/** @typedef {import("./interfaces").IL10n} IL10n */
/** @typedef {import("./interfaces").IPDFLinkService} IPDFLinkService */
/** @typedef {import("./pdf_rendering_queue").PDFRenderingQueue} PDFRenderingQueue */
import type { OptionalContentConfig, PDFDocumentProxy, PDFPageProxy } from "../pdf.ts-src/pdf.js";
import type { EventBus } from "./event_utils.js";
import type { IL10n, IPDFLinkService } from "./interfaces.js";
import type { PDFRenderingQueue } from "./pdf_rendering_queue.js";
import { PDFThumbnailView } from "./pdf_thumbnail_view.js";
import type { PageColors } from "./pdf_viewer.js";
interface PDFThumbnailViewerOptions {
    /**
     * The container for the thumbnail elements.
     */
    container: HTMLDivElement;
    /**
     * The application event bus.
     */
    eventBus: EventBus;
    /**
     * The navigation/linking service.
     */
    linkService: IPDFLinkService;
    /**
     * The rendering queue object.
     */
    renderingQueue: PDFRenderingQueue;
    /**
     * Localization service.
     */
    l10n: IL10n;
    /**
     * Overwrites background and foreground colors
     * with user defined ones in order to improve readability in high contrast
     * mode.
     */
    pageColors: PageColors | undefined;
}
/**
 * Viewer control to display thumbnails for pages in a PDF document.
 */
export declare class PDFThumbnailViewer {
    #private;
    container: HTMLDivElement;
    eventBus: EventBus;
    linkService: IPDFLinkService;
    renderingQueue: PDFRenderingQueue;
    l10n: IL10n;
    pageColors: PageColors | undefined;
    scroll: {
        right: boolean;
        down: boolean;
        lastX: number;
        lastY: number;
        _eventHandler: (evt: unknown) => void;
    };
    _thumbnails: PDFThumbnailView[];
    getThumbnail(index: number): PDFThumbnailView;
    _currentPageNumber: number;
    _pageLabels?: string[] | undefined;
    get pagesRotation(): number;
    set pagesRotation(rotation: number);
    _optionalContentConfigPromise?: Promise<OptionalContentConfig> | undefined;
    _pagesRequests: WeakMap<PDFThumbnailView, Promise<void | PDFPageProxy>>;
    _setImageDisabled: boolean;
    pdfDocument?: PDFDocumentProxy | undefined;
    constructor({ container, eventBus, linkService, renderingQueue, l10n, pageColors, }: PDFThumbnailViewerOptions);
    scrollThumbnailIntoView(pageNumber: number): void;
    cleanup(): void;
    protected _resetView(): void;
    setDocument(pdfDocument?: PDFDocumentProxy): void;
    protected _cancelRendering(): void;
    setPageLabels(labels: string[] | null): void;
    forceRendering(): boolean;
}
export {};
//# sourceMappingURL=pdf_thumbnail_viewer.d.ts.map