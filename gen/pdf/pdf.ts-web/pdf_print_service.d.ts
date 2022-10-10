import { OptionalContentConfig, PDFDocumentProxy, PrintAnnotationStorage } from "../pdf.ts-src/pdf.js";
import { type PageOverview } from "./pdf_viewer.js";
import { type IL10n } from "./interfaces.js";
export declare class PDFPrintService {
    #private;
    pdfDocument: PDFDocumentProxy;
    pagesOverview: PageOverview[];
    printContainer: HTMLDivElement;
    _printResolution: number;
    _optionalContentConfigPromise: Promise<OptionalContentConfig | undefined>;
    _printAnnotationStoragePromise: Promise<PrintAnnotationStorage | undefined>;
    l10n: IL10n | undefined;
    currentPage: number;
    pageStyleSheet: HTMLStyleElement | undefined;
    /**
     * The temporary canvas where renderPage paints one page at a time.
     */
    scratchCanvas: HTMLCanvasElement | undefined;
    constructor(pdfDocument: PDFDocumentProxy, pagesOverview: PageOverview[], printContainer: HTMLDivElement, printResolution: number | undefined, optionalContentConfigPromise: Promise<OptionalContentConfig | undefined> | undefined, printAnnotationStoragePromise?: Promise<PrintAnnotationStorage | undefined>, l10n?: IL10n);
    layout(): void;
    destroy(): void;
    renderPages(): Promise<void>;
    performPrint(): Promise<void>;
    get active(): boolean;
    throwIfInactive(): void;
}
//# sourceMappingURL=pdf_print_service.d.ts.map