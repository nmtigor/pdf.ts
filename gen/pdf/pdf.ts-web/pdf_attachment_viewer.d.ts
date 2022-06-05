import { BaseTreeViewer, type BaseTreeViewerCtorP } from "./base_tree_viewer.js";
import { DownloadManager } from "./download_manager.js";
interface PDFAttachmentViewerOptions extends BaseTreeViewerCtorP {
    /**
     * The download manager.
     */
    downloadManager: DownloadManager;
}
interface _PDFAttachmentViewerRenderP {
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
    downloadManager: DownloadManager;
    static create(options: PDFAttachmentViewerOptions): PDFAttachmentViewer;
    private constructor();
    reset(keepRenderedCapability?: boolean): void;
    /** @implements */
    protected _dispatchEvent(attachmentsCount: number): Promise<void>;
    /** @implements */
    protected _bindLink(element: HTMLAnchorElement, { content, filename }: {
        content?: Uint8Array | Uint8ClampedArray | undefined;
        filename: string;
    }): void;
    /** @implements */
    render({ attachments, keepRenderedCapability }: _PDFAttachmentViewerRenderP): void;
}
export {};
//# sourceMappingURL=pdf_attachment_viewer.d.ts.map