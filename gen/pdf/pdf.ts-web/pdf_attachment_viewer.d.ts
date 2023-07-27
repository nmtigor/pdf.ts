import { type Attachment } from "../pdf.ts-src/pdf.js";
import { BaseTreeViewer, type BaseTreeViewerCtorP } from "./base_tree_viewer.js";
import type { IDownloadManager } from "./interfaces.js";
interface PDFAttachmentViewerOptions extends BaseTreeViewerCtorP {
    /**
     * The download manager.
     */
    downloadManager: IDownloadManager;
}
interface _PDFAttachmentViewerRenderP {
    /**
     * A lookup table of attachment objects.
     */
    attachments?: Record<string, Attachment> | undefined;
    keepRenderedCapability?: boolean;
}
export declare class PDFAttachmentViewer extends BaseTreeViewer {
    #private;
    _attachments?: Record<string, Attachment> | undefined;
    downloadManager: IDownloadManager;
    static create(options: PDFAttachmentViewerOptions): PDFAttachmentViewer;
    private constructor();
    reset(keepRenderedCapability?: boolean): void;
    /** @implement */
    protected _dispatchEvent(attachmentsCount: number): Promise<void>;
    /** @implement */
    protected _bindLink(element: HTMLAnchorElement, { content, filename }: {
        content?: Uint8Array | Uint8ClampedArray | undefined;
        filename: string;
    }): void;
    /** @implement */
    render({ attachments, keepRenderedCapability }: _PDFAttachmentViewerRenderP): void;
}
export {};
//# sourceMappingURL=pdf_attachment_viewer.d.ts.map