import { Dict, Obj, Ref } from "./core/primitives.js";
import { PDFWorker } from "./pdf.js";
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
    data: string | Dict;
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
    fetch(ref: Ref): string | Dict;
    fetchAsync(ref: Ref): Promise<string | Dict>;
    fetchIfRef(obj: Obj): string | number | boolean | import("../../lib/alias.js").TypedArray | import("./core/base_stream.js").BaseStream | Dict | XFANsName.Name | NsCmd.Cmd | typeof import("./core/primitives.js").EOF | Obj[] | null;
    fetchIfRefAsync(obj: Obj): Promise<string | number | boolean | import("../../lib/alias.js").TypedArray | import("./core/base_stream.js").BaseStream | Dict | XFANsName.Name | NsCmd.Cmd | typeof import("./core/primitives.js").EOF | Obj[] | null>;
}
export declare function createIdFactory(pageIndex: number): import("./core/document.js").LocalIdFactory;
export declare function isEmptyObj(obj: object): boolean;
export {};
//# sourceMappingURL=test_lib.d.ts.map