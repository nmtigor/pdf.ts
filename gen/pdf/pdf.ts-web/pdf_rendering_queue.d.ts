import { BaseViewer } from "./base_viewer.js";
import { type IRenderableView, type IVisibleView } from "./interfaces.js";
import { PDFThumbnailViewer } from "./pdf_thumbnail_viewer.js";
import { type VisibleElements } from "./ui_utils.js";
export declare enum RenderingStates {
    INITIAL = 0,
    RUNNING = 1,
    PAUSED = 2,
    FINISHED = 3
}
/**
 * Controls rendering of the views for pages and thumbnails.
 */
export declare class PDFRenderingQueue {
    pdfViewer?: BaseViewer;
    pdfThumbnailViewer?: PDFThumbnailViewer;
    onIdle?: () => void;
    highestPriorityPage?: string;
    idleTimeout?: number | undefined;
    printing: boolean;
    isThumbnailViewEnabled: boolean;
    setViewer(pdfViewer: BaseViewer): void;
    setThumbnailViewer(pdfThumbnailViewer: PDFThumbnailViewer): void;
    isHighestPriority(view: IRenderableView): boolean;
    hasViewer(): boolean;
    renderHighestPriority(currentlyVisiblePages?: VisibleElements): void;
    getHighestPriority(visible: VisibleElements, views: IVisibleView[], scrolledDown: boolean, preRenderExtra?: boolean): IVisibleView | undefined;
    isViewFinished(view: IRenderableView): boolean;
    /**
     * Render a page or thumbnail view. This calls the appropriate function
     * based on the views state. If the view is already rendered it will return
     * `false`.
     */
    renderView(view: IRenderableView): boolean;
}
//# sourceMappingURL=pdf_rendering_queue.d.ts.map