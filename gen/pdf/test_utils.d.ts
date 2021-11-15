import { Dict, Name, Obj, Ref } from "./pdf.ts-src/core/primitives.js";
import { PDFWorker } from "./pdf.ts-src/pdf.js";
import { BaseStream } from "./pdf.ts-src/core/base_stream.js";
export declare const TEST_PDFS_PATH: string;
export declare const CMAP_PARAMS: {
    cMapUrl: string;
    cMapPacked: boolean;
};
export declare const STANDARD_FONT_DATA_URL: string;
declare class DOMFileReaderFactory {
    static fetch(params: {
        path: string;
    }): Promise<Uint8Array>;
}
export declare const DefaultFileReaderFactory: typeof DOMFileReaderFactory;
interface BuildGetDocumentParamsOptions {
    disableFontFace?: boolean;
    docBaseUrl?: string;
    ownerDocument?: unknown;
    password?: string;
    pdfBug?: boolean;
    stopAtErrors?: boolean;
    worker?: PDFWorker;
}
export declare function buildGetDocumentParams(filename: string, options?: BuildGetDocumentParamsOptions): any;
interface XRefMockCtorParms {
    ref: Ref;
    data: string | Name | Dict | BaseStream | [Name, Dict];
}
export declare class XRefMock {
    #private;
    stats: {
        streamTypes: any;
        fontTypes: any;
    };
    newRef?: Ref | undefined;
    constructor(array?: XRefMockCtorParms[]);
    getNewRef(): Ref;
    resetNewRef(): void;
    fetch(ref: Ref): string | BaseStream | Dict | Name | [Name, Dict];
    fetchAsync(ref: Ref): Promise<string | BaseStream | Dict | Name | [Name, Dict]>;
    fetchIfRef(obj: Obj): string | number | boolean | Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array | BaseStream | Dict | Name | NsCmd.Cmd | typeof import("./pdf.ts-src/core/primitives.js").EOF | (Obj | undefined)[] | null;
    fetchIfRefAsync(obj: Obj): Promise<string | number | boolean | Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array | BaseStream | Dict | Name | NsCmd.Cmd | typeof import("./pdf.ts-src/core/primitives.js").EOF | (Obj | undefined)[] | null>;
}
export declare function createIdFactory(pageIndex: number): import("./pdf.ts-src/core/document.js").LocalIdFactory;
export declare function isEmptyObj(obj: object): boolean;
export {};
//# sourceMappingURL=test_utils.d.ts.map