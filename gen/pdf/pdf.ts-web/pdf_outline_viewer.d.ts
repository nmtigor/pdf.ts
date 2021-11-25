import { ExplicitDest } from "../pdf.ts-src/core/catalog.js";
import { OutlineNode, PDFDocumentProxy } from "../pdf.ts-src/display/api.js";
import { BaseTreeViewer, BaseTreeViewerCtorParms } from "./base_tree_viewer.js";
import { PDFLinkService } from "./pdf_link_service.js";
import { SidebarView } from "./ui_utils.js";
interface PDFOutlineViewerOptions extends BaseTreeViewerCtorParms {
    linkService: PDFLinkService;
}
interface PDFOutlineViewerRenderParms {
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
    _isPagesLoaded: boolean;
    linkService: PDFLinkService;
    static create(options: PDFOutlineViewerOptions): PDFOutlineViewer;
    private constructor();
    reset(): void;
    /** @implements */
    protected _dispatchEvent(outlineCount: number): void;
    /** @implements */
    protected _bindLink(element: HTMLAnchorElement, { url, newWindow, dest }: {
        url?: string | undefined;
        newWindow?: boolean | undefined;
        dest?: ExplicitDest | string | undefined;
    }): void;
    protected toggleAllTreeItems$(): void;
    /** @implements */
    render({ outline, pdfDocument }: PDFOutlineViewerRenderParms): void;
}
export {};
//# sourceMappingURL=pdf_outline_viewer.d.ts.map