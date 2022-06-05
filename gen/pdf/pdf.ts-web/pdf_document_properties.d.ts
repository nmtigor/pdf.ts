import { PDFDocumentProxy } from "../pdf.ts-src/display/api.js";
import { EventBus } from "./event_utils.js";
import { type IL10n } from "./interfaces.js";
import { OverlayManager } from "./overlay_manager.js";
import { type ViewerConfiguration } from "./viewer.js";
declare type Fields = ViewerConfiguration["documentProperties"]["fields"];
export declare class PDFDocumentProperties {
    #private;
    dialog: HTMLDialogElement;
    fields: Fields;
    overlayManager: OverlayManager;
    l10n: IL10n;
    pdfDocument: PDFDocumentProxy | undefined;
    url: string | undefined;
    maybeFileSize: number;
    _currentPageNumber: number;
    _pagesRotation: number;
    /**
     * @param overlayManager Manager for the viewer overlays.
     * @param eventBus The application event bus.
     * @param l10n Localization service.
     */
    constructor({ dialog, fields, closeButton }: ViewerConfiguration["documentProperties"], overlayManager: OverlayManager, eventBus: EventBus, l10n: IL10n);
    /**
     * Open the document properties overlay.
     */
    open(): Promise<void>;
    /**
     * Close the document properties overlay.
     */
    close(): Promise<void>;
    /**
     * Set a reference to the PDF document and the URL in order
     * to populate the overlay fields with the document properties.
     * Note that the overlay will contain no information if this method
     * is not called.
     *
     * @param pdfDocument A reference to the PDF document.
     * @param url The URL of the document.
     */
    setDocument(pdfDocument?: PDFDocumentProxy, url?: string): void;
}
export {};
//# sourceMappingURL=pdf_document_properties.d.ts.map