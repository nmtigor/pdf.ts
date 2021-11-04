import { EventBus } from "./ui_utils.js";
import { PDFThumbnailView } from "./pdf_thumbnail_view.js";
import { IL10n, IPDFLinkService } from "./interfaces.js";
import { PDFRenderingQueue } from "./pdf_rendering_queue.js";
import { PDFDocumentProxy, PDFPageProxy } from '../pdf.ts-src/display/api.js';
import { OptionalContentConfig } from '../pdf.ts-src/display/optional_content_config.js';
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
}
/**
 * Viewer control to display thumbnails for pages in a PDF document.
 */
export declare class PDFThumbnailViewer {
    #private;
    container: HTMLDivElement;
    linkService: IPDFLinkService;
    renderingQueue: PDFRenderingQueue;
    l10n: IL10n;
    scroll: {
        right: boolean;
        down: boolean;
        lastX: number;
        lastY: number;
        _eventHandler: (evt: unknown) => void;
    };
    _thumbnails: PDFThumbnailView[];
    _currentPageNumber: number;
    _pageLabels?: string[] | undefined;
    _pagesRotation: number;
    _optionalContentConfigPromise?: Promise<OptionalContentConfig> | undefined;
    _pagesRequests: WeakMap<PDFThumbnailView, Promise<void | PDFPageProxy>>;
    _setImageDisabled: boolean;
    pdfDocument?: PDFDocumentProxy | undefined;
    constructor({ container, eventBus, linkService, renderingQueue, l10n, }: PDFThumbnailViewerOptions);
    getThumbnail(index: number): PDFThumbnailView;
    scrollThumbnailIntoView(pageNumber: number): void;
    get pagesRotation(): number;
    set pagesRotation(rotation: number);
    cleanup(): void;
    protected _resetView(): void;
    setDocument(pdfDocument?: PDFDocumentProxy): void;
    /** @override */
    protected _cancelRendering(): void;
    setPageLabels(labels: string[] | null): void;
    forceRendering(): boolean;
}
export {};
//# sourceMappingURL=pdf_thumbnail_viewer.d.ts.map