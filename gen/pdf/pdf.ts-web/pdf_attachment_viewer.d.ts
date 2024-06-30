/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/pdf_attachment_viewer.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { Attachment } from "../pdf.ts-src/pdf.js";
import type { BaseTreeViewerCtorP } from "./base_tree_viewer.js";
import { BaseTreeViewer } from "./base_tree_viewer.js";
import type { IDownloadManager } from "./interfaces.js";
interface PDFAttachmentViewerOptions extends BaseTreeViewerCtorP {
    /**
     * The download manager.
     */
    downloadManager: IDownloadManager;
}
interface PDFAttachmentViewerRenderP_ {
    /**
     * A lookup table of attachment objects.
     */
    attachments?: Record<string, Attachment> | undefined;
    keepRenderedCapability?: boolean;
}
type BindLinkO_ = {
    content?: Uint8Array | Uint8ClampedArray | undefined;
    description?: string;
    filename: string;
};
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
    protected _bindLink(element: HTMLAnchorElement, { content, description, filename }: BindLinkO_): void;
    /** @implement */
    render({ attachments, keepRenderedCapability }: PDFAttachmentViewerRenderP_): void;
}
export {};
//# sourceMappingURL=pdf_attachment_viewer.d.ts.map