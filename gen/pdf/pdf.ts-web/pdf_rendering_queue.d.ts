/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/pdf_rendering_queue.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { IRenderableView, IVisibleView } from "./interfaces.js";
import type { PDFThumbnailViewer } from "./pdf_thumbnail_viewer.js";
import type { PDFViewer } from "./pdf_viewer.js";
import { type VisibleElements } from "./ui_utils.js";
/**
 * Controls rendering of the views for pages and thumbnails.
 */
export declare class PDFRenderingQueue {
    pdfViewer?: PDFViewer;
    setViewer(pdfViewer: PDFViewer): void;
    hasViewer: () => boolean;
    pdfThumbnailViewer?: PDFThumbnailViewer;
    setThumbnailViewer(pdfThumbnailViewer: PDFThumbnailViewer): void;
    onIdle?: () => void;
    highestPriorityPage?: string;
    isHighestPriority(view: IRenderableView): boolean;
    idleTimeout?: number | undefined;
    printing: boolean;
    isThumbnailViewEnabled: boolean;
    constructor();
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