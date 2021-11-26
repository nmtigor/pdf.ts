import { BaseTreeViewer, type BaseTreeViewerCtorParms } from "./base_tree_viewer.js";
import { DownloadManager } from "./download_manager.js";
interface PDFAttachmentViewerOptions extends BaseTreeViewerCtorParms {
    /**
     * The download manager.
     */
    downloadManager: DownloadManager;
}
interface PDFAttachmentViewerRenderParms {
    /**
     * A lookup table of attachment objects.
     */
    attachments?: Record<string, Attachment> | undefined;
    keepRenderedCapability?: boolean;
}
interface Attachment {
    filename: string;
    content?: Uint8Array | Uint8ClampedArray | undefined;
}
export declare class PDFAttachmentViewer extends BaseTreeViewer {
    #private;
    _attachments?: Record<string, Attachment> | undefined;
    _pendingDispatchEvent?: number | undefined;
    downloadManager: DownloadManager;
    static create(options: PDFAttachmentViewerOptions): PDFAttachmentViewer;
    private constructor();
    reset(keepRenderedCapability?: boolean): void;
    /** @implements */
    protected _dispatchEvent(attachmentsCount: number): void;
    /** @implements */
    protected _bindLink(element: HTMLAnchorElement, { content, filename }: {
        content?: Uint8Array | Uint8ClampedArray | undefined;
        filename: string;
    }): void;
    /** @implements */
    render({ attachments, keepRenderedCapability }: PDFAttachmentViewerRenderParms): void;
}
export {};
//# sourceMappingURL=pdf_attachment_viewer.d.ts.map