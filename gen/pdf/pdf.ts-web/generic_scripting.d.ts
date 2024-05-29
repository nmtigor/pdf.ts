/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/generic_scripting.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { PDFDocumentProxy } from "../pdf.ts-src/pdf.js";
import type { Sandbox } from "../pdf.ts-src/pdf.sandbox.js";
import type { CreateSandboxP, EventInSandBox, IScripting } from "./interfaces.js";
export declare function docProperties(pdfDocument: PDFDocumentProxy): Promise<{
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
    Trapped?: import("../pdf.ts-src/core/primitives.js").Name;
    IsAcroFormPresent: boolean;
    IsCollectionPresent: boolean;
    IsLinearized: boolean;
    IsSignaturesPresent: boolean;
    IsXFAPresent: boolean;
    Custom?: Record<string, string | number | boolean | import("../pdf.ts-src/core/primitives.js").Name>;
}>;
export declare class GenericScripting implements IScripting {
    _ready: Promise<Sandbox>;
    constructor(sandboxBundleSrc: string);
    /** @implement */
    createSandbox(data: CreateSandboxP): Promise<void>;
    /** @implement */
    dispatchEventInSandbox(event: EventInSandBox): Promise<void>;
    /** @implement */
    destroySandbox(): Promise<void>;
}
//# sourceMappingURL=generic_scripting.d.ts.map