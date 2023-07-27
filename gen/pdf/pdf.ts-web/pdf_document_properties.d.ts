import { type PDFDocumentProxy } from "../pdf.ts-src/pdf.js";
import type { EventBus } from "./event_utils.js";
import type { IL10n } from "./interfaces.js";
import type { OverlayManager } from "./overlay_manager.js";
import type { ViewerConfiguration } from "./viewer.js";
type Fields = ViewerConfiguration["documentProperties"]["fields"];
export declare class PDFDocumentProperties {
    #private;
    dialog: HTMLDialogElement;
    fields: Fields;
    overlayManager: OverlayManager;
    l10n: IL10n;
    _fileNameLookup: () => string;
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
    constructor({ dialog, fields, closeButton, }: ViewerConfiguration["documentProperties"], overlayManager: OverlayManager, eventBus: EventBus, l10n: IL10n, fileNameLookup: () => string);
    /**
     * Open the document properties overlay.
     */
    open(): Promise<void>;
    /**
     * Close the document properties overlay.
     */
    close(): Promise<void>;
    /**
     * Set a reference to the PDF document in order to populate the dialog fields
     * with the document properties. Note that the dialog will contain no
     * information if this method is not called.
     *
     * @param pdfDocument A reference to the PDF document.
     */
    setDocument(pdfDocument?: PDFDocumentProxy): void;
}
export {};
//# sourceMappingURL=pdf_document_properties.d.ts.map