/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/pdf_print_service.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { OptionalContentConfig, PDFDocumentProxy, PrintAnnotationStorage } from "../pdf.ts-src/pdf.js";
import type { PDFViewerApplication } from "./app.js";
import type { CreatePrintServiceP } from "./interfaces.js";
import { IPDFPrintServiceFactory } from "./interfaces.js";
import type { PageOverview } from "./pdf_viewer.js";
export declare class PDFPrintService {
    #private;
    pdfDocument: PDFDocumentProxy;
    pagesOverview: PageOverview[];
    printContainer: HTMLDivElement;
    _printResolution: number;
    _optionalContentConfigPromise: Promise<OptionalContentConfig>;
    _printAnnotationStoragePromise: Promise<PrintAnnotationStorage | undefined>;
    currentPage: number;
    pageStyleSheet: HTMLStyleElement | undefined;
    /**
     * The temporary canvas where renderPage paints one page at a time.
     */
    scratchCanvas: HTMLCanvasElement | undefined;
    constructor({ pdfDocument, pagesOverview, printContainer, printResolution, printAnnotationStoragePromise, }: CreatePrintServiceP);
    layout(): void;
    destroy(): void;
    renderPages(): Promise<void>;
    performPrint(): Promise<void>;
    get active(): boolean;
    throwIfInactive(): void;
}
export declare class PDFPrintServiceFactory extends IPDFPrintServiceFactory {
    static initGlobals(app: PDFViewerApplication): void;
    static get supportsPrinting(): boolean;
    static createPrintService(params: CreatePrintServiceP): PDFPrintService;
}
//# sourceMappingURL=pdf_print_service.d.ts.map