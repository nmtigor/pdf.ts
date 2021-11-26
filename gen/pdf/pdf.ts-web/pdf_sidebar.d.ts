import { EventBus, SidebarView } from "./ui_utils.js";
import { PDFThumbnailViewer } from "./pdf_thumbnail_viewer.js";
import { PDFViewer } from "./pdf_viewer.js";
import { type IL10n } from "./interfaces.js";
import { type ViewerConfiguration } from "./viewer.js";
interface PDFSidebarOptions {
    /**
     * The DOM elements.
     */
    elements: ViewerConfiguration['sidebar'];
    /**
     * The document viewer.
     */
    pdfViewer: PDFViewer;
    /**
     * The thumbnail viewer.
     */
    pdfThumbnailViewer: PDFThumbnailViewer;
    /**
     * The application event bus.
     */
    eventBus: EventBus;
    /**
     * The localization service.
     */
    l10n: IL10n;
}
export declare class PDFSidebar {
    #private;
    isOpen: boolean;
    active: SidebarView;
    isInitialViewSet: boolean;
    /**
     * Callback used when the sidebar has been opened/closed, to ensure that
     * the viewers (PDFViewer/PDFThumbnailViewer) are updated correctly.
     */
    onToggled?: () => void;
    pdfViewer: PDFViewer;
    pdfThumbnailViewer: PDFThumbnailViewer;
    outerContainer: HTMLDivElement;
    viewerContainer: HTMLDivElement;
    toggleButton: HTMLButtonElement;
    thumbnailButton: HTMLButtonElement;
    outlineButton: HTMLButtonElement;
    attachmentsButton: HTMLButtonElement;
    layersButton: HTMLButtonElement;
    thumbnailView: HTMLDivElement;
    outlineView: HTMLDivElement;
    attachmentsView: HTMLDivElement;
    layersView: HTMLDivElement;
    _outlineOptionsContainer: HTMLDivElement;
    _currentOutlineItemButton: HTMLButtonElement;
    eventBus: EventBus;
    l10n: IL10n;
    constructor({ elements, pdfViewer, pdfThumbnailViewer, eventBus, l10n, }: PDFSidebarOptions);
    reset(): void;
    /**
     * @return One of the values in {SidebarView}.
     */
    get visibleView(): number;
    get isThumbnailViewVisible(): boolean;
    get isOutlineViewVisible(): boolean;
    get isAttachmentsViewVisible(): boolean;
    get isLayersViewVisible(): boolean;
    /**
     * @param view The sidebar view that should become visible,
     *  must be one of the values in {SidebarView}.
     */
    setInitialView(view?: SidebarView): void;
    /**
     * @param view - The sidebar view that should be switched to,
     *  must be one of the values in {SidebarView}.
     * @param forceOpen - Ensure that the sidebar is open. The default value is `false`.
     */
    switchView(view: number, forceOpen?: boolean): void;
    open(): void;
    close(): void;
    toggle(): void;
    protected _dispatchEvent(): void;
}
export {};
//# sourceMappingURL=pdf_sidebar.d.ts.map