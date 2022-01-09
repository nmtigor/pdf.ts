import { PDFDocumentProxy } from "../pdf.ts-src/display/api.js";
import { type IL10n } from "./interfaces.js";
import { OverlayManager } from "./overlay_manager.js";
import { type ViewerConfiguration } from "./viewer.js";
import { EventBus } from "./event_utils.js";
interface FreezeFieldDataParms {
    fileName: string;
    fileSize?: string | undefined;
    title?: string | undefined;
    author?: string | undefined;
    subject?: string | undefined;
    keywords?: string | undefined;
    creationDate?: string | undefined;
    modificationDate?: string | undefined;
    creator?: string | undefined;
    producer?: string | undefined;
    version?: string | undefined;
    pageCount: number;
    pageSize?: string | undefined;
    linearized: string;
    _currentPageNumber: number;
    _pagesRotation: number;
}
declare type Fields = ViewerConfiguration["documentProperties"]["fields"];
export declare class PDFDocumentProperties {
    #private;
    overlayManager: OverlayManager;
    l10n: IL10n;
    overlayName: string;
    fields: Fields;
    fieldData?: FreezeFieldDataParms;
    container: HTMLDivElement;
    pdfDocument?: PDFDocumentProxy | undefined;
    url?: string | undefined;
    maybeFileSize: number;
    _currentPageNumber: number;
    _pagesRotation: number;
    /**
     * @param overlayManager Manager for the viewer overlays.
     * @param eventBus The application event bus.
     * @param l10n Localization service.
     */
    constructor({ overlayName, fields, container, closeButton }: ViewerConfiguration["documentProperties"], overlayManager: OverlayManager, eventBus: EventBus, l10n: IL10n);
    /**
     * Open the document properties overlay.
     */
    open(): Promise<void>;
    /**
     * Close the document properties overlay.
     */
    close(): void;
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