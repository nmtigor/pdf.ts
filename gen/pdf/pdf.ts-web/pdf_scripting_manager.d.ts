import { PDFDocumentProxy } from "../pdf.ts-src/display/api.js";
import { PDFViewer } from "./pdf_viewer.js";
import { IScripting, type MouseState } from "./interfaces.js";
import { DefaultExternalServices, type ScriptingDocProperties } from "./app.js";
import { EventBus } from "./event_utils.js";
interface PDFScriptingManagerOptions {
    /**
     * The application event bus.
     */
    eventBus: EventBus;
    /**
     * The path and filename of the scripting bundle.
     */
    sandboxBundleSrc: string | undefined;
    /**
     * The factory that is used when
     * initializing scripting; must contain a `createScripting` method.
     * PLEASE NOTE: Primarily intended for the default viewer use-case.
     */
    scriptingFactory?: DefaultExternalServices;
    /**
     * The function that is used to
     * lookup the necessary document properties.
     */
    docPropertiesLookup?: (pdfDocument?: PDFDocumentProxy) => Promise<ScriptingDocProperties | null>;
}
export declare class PDFScriptingManager {
    #private;
    setViewer(pdfViewer: PDFViewer): void;
    get destroyPromise(): Promise<void> | undefined;
    _scripting: IScripting | undefined;
    get mouseState(): MouseState;
    _ready: boolean;
    constructor({ eventBus, sandboxBundleSrc, scriptingFactory, docPropertiesLookup, }: PDFScriptingManagerOptions);
    setDocument(pdfDocument?: PDFDocumentProxy): Promise<void>;
    dispatchWillSave(detail?: unknown): Promise<void | undefined>;
    dispatchDidSave(detail?: unknown): Promise<void | undefined>;
    dispatchWillPrint(detail?: unknown): Promise<void | undefined>;
    dispatchDidPrint(detail?: unknown): Promise<void | undefined>;
    get ready(): boolean;
}
export {};
//# sourceMappingURL=pdf_scripting_manager.d.ts.map