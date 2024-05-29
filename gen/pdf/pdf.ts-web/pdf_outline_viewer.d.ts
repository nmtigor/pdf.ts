/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/pdf_outline_viewer.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { OutlineNode, PDFDocumentProxy } from "../pdf.ts-src/pdf.js";
import type { BaseTreeViewerCtorP } from "./base_tree_viewer.js";
import { BaseTreeViewer } from "./base_tree_viewer.js";
import type { IDownloadManager } from "./interfaces.js";
import type { PDFLinkService } from "./pdf_link_service.js";
import { SidebarView } from "./ui_utils.js";
interface PDFOutlineViewerOptions extends BaseTreeViewerCtorP {
    /**
     * The navigation/linking service.
     */
    linkService: PDFLinkService;
    /**
     * The download manager.
     */
    downloadManager: IDownloadManager;
}
interface _PDFOutlineViewerRenderP {
    /**
     * An array of outline objects.
     */
    outline: OutlineNode[] | undefined;
    /**
     * A {PDFDocument} instance.
     */
    pdfDocument: PDFDocumentProxy;
}
export declare class PDFOutlineViewer extends BaseTreeViewer {
    #private;
    _currentPageNumber: number;
    _sidebarView?: SidebarView;
    _isPagesLoaded: boolean | undefined;
    linkService: PDFLinkService;
    downloadManager: IDownloadManager;
    static create(options: PDFOutlineViewerOptions): PDFOutlineViewer;
    private constructor();
    reset(): void;
    /** @implement */
    protected _dispatchEvent(outlineCount: number): void;
    /** @implement */
    protected _bindLink(element: HTMLAnchorElement, { url, newWindow, action, attachment, dest, setOCGState }: OutlineNode): void;
    protected toggleAllTreeItems$(): void;
    /** @implement */
    render({ outline, pdfDocument }: _PDFOutlineViewerRenderP): void;
}
export {};
//# sourceMappingURL=pdf_outline_viewer.d.ts.map