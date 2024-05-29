/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/pdf_scripting_manager.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { PDFDocumentProxy } from "../pdf.ts-src/pdf.js";
import type { ScriptingDocProperties } from "./app.js";
import type { EventBus } from "./event_utils.js";
import type { PDFViewer } from "./pdf_viewer.js";
import type { BaseExternalServices } from "./external_services.js";
interface PDFScriptingManagerOptions {
    /**
     * The application event bus.
     */
    eventBus: EventBus;
    /**
     * The factory that is used when
     * initializing scripting; must contain a `createScripting` method.
     * PLEASE NOTE: Primarily intended for the default viewer use-case.
     */
    externalServices?: BaseExternalServices;
    /**
     * The function that is used to lookup
     * the necessary document properties.
     */
    docProperties?: (pdfDocument: PDFDocumentProxy) => Promise<ScriptingDocProperties | undefined>;
}
export declare class PDFScriptingManager {
    #private;
    setViewer(pdfViewer: PDFViewer): void;
    get destroyPromise(): Promise<void> | undefined;
    get ready(): boolean;
    constructor({ eventBus, externalServices, docProperties }: PDFScriptingManagerOptions);
    setDocument(pdfDocument?: PDFDocumentProxy): Promise<void>;
    dispatchWillSave(): Promise<void | undefined>;
    dispatchDidSave(): Promise<void | undefined>;
    dispatchWillPrint(): Promise<void>;
    dispatchDidPrint(): Promise<void | undefined>;
}
export {};
//# sourceMappingURL=pdf_scripting_manager.d.ts.map