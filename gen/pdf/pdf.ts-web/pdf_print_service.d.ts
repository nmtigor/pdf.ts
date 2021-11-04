import { IL10n } from "./interfaces.js";
import { OptionalContentConfig } from "../pdf.ts-src/display/optional_content_config.js";
import { PDFDocumentProxy } from "../pdf.ts-src/display/api.js";
import { PageOverview } from "./base_viewer.js";
export declare class PDFPrintService {
    #private;
    pdfDocument: PDFDocumentProxy;
    pagesOverview: PageOverview[];
    printContainer: HTMLDivElement;
    _printResolution: number;
    _optionalContentConfigPromise: Promise<OptionalContentConfig | undefined>;
    l10n: IL10n;
    currentPage: number;
    pageStyleSheet: HTMLStyleElement | undefined;
    /**
     * The temporary canvas where renderPage paints one page at a time.
     */
    scratchCanvas: HTMLCanvasElement | undefined;
    constructor(pdfDocument: PDFDocumentProxy, pagesOverview: PageOverview[], printContainer: HTMLDivElement, printResolution: number | undefined, optionalContentConfigPromise: Promise<OptionalContentConfig | undefined> | undefined, l10n: IL10n);
    layout(): void;
    destroy(): void;
    renderPages(): Promise<void>;
    performPrint(): Promise<void>;
    get active(): boolean;
    throwIfInactive(): void;
}
//# sourceMappingURL=pdf_print_service.d.ts.map