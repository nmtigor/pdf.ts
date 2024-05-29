/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/firefox_print_service.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { CreatePrintServiceP } from "./interfaces.js";
import { IPDFPrintServiceFactory } from "./interfaces.js";
import { PDFPrintService } from "./pdf_print_service.js";
export declare class FirefoxPrintService extends PDFPrintService {
    layout(): void;
    destroy(): void;
}
export declare class PDFPrintServiceFactory extends IPDFPrintServiceFactory {
    static get supportsPrinting(): boolean;
    static createPrintService(params: CreatePrintServiceP): FirefoxPrintService;
}
//# sourceMappingURL=firefox_print_service.d.ts.map