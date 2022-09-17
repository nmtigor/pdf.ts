import { type ExplicitDest, type OutlineNode, PDFDocumentProxy } from "../pdf.ts-src/pdf.js";
import { BaseTreeViewer, type BaseTreeViewerCtorP } from "./base_tree_viewer.js";
import { PDFLinkService } from "./pdf_link_service.js";
import { SidebarView } from "./ui_utils.js";
interface PDFOutlineViewerOptions extends BaseTreeViewerCtorP {
    linkService: PDFLinkService;
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
    static create(options: PDFOutlineViewerOptions): PDFOutlineViewer;
    private constructor();
    reset(): void;
    /** @implement */
    protected _dispatchEvent(outlineCount: number): void;
    /** @implement */
    protected _bindLink(element: HTMLAnchorElement, { url, newWindow, dest }: {
        url?: string | undefined;
        newWindow?: boolean | undefined;
        dest?: ExplicitDest | string | undefined;
    }): void;
    protected toggleAllTreeItems$(): void;
    /** @implement */
    render({ outline, pdfDocument }: _PDFOutlineViewerRenderP): void;
}
export {};
//# sourceMappingURL=pdf_outline_viewer.d.ts.map