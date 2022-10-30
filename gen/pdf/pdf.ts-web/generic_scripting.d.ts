import { PDFDocumentProxy } from "../pdf.ts-src/pdf.js";
import { CreateSandboxP, EventInSandBox, IScripting } from "./interfaces.js";
export declare function docPropertiesLookup(pdfDocument: PDFDocumentProxy): Promise<{
    baseURL: string;
    filesize: number;
    filename: string;
    metadata: string | undefined;
    authors: string | string[] | undefined;
    numPages: number;
    URL: string;
    Title?: string;
    Author?: string;
    Subject?: string;
    Keywords?: string;
    Creator?: string;
    Producer?: string;
    PDFFormatVersion?: string | undefined;
    Language: string | undefined;
    EncryptFilterName: string | undefined;
    CreationDate?: string;
    ModDate?: string;
    Trapped?: XFANsName.Name;
    IsAcroFormPresent: boolean;
    IsCollectionPresent: boolean;
    IsLinearized: boolean;
    IsSignaturesPresent: boolean;
    IsXFAPresent: boolean;
    Custom?: Record<string, string | number | boolean | XFANsName.Name>;
}>;
export declare class GenericScripting implements IScripting {
    _ready: Promise<import("../pdf.ts-src/pdf.sandbox.js").Sandbox>;
    constructor(sandboxBundleSrc: string);
    /** @implement */
    createSandbox(data: CreateSandboxP): Promise<void>;
    /** @implement */
    dispatchEventInSandbox(event: EventInSandBox): Promise<void>;
    /** @implement */
    destroySandbox(): Promise<void>;
}
//# sourceMappingURL=generic_scripting.d.ts.map