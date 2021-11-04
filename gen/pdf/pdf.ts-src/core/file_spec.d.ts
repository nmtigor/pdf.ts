import { Dict } from "./primitives.js";
import { XRef } from "./xref.js";
export interface Serializable {
    filename: string;
    content?: Uint8Array | Uint8ClampedArray;
}
/**
 * "A PDF file can refer to the contents of another file by using a File
 * Specification (PDF 1.1)", see the spec (7.11) for more details.
 * NOTE: Only embedded files are supported (as part of the attachments support)
 * TODO: support the 'URL' file system (with caching if !/V), portable
 * collections attributes and related files (/RF)
 */
export declare class FileSpec {
    #private;
    xref: XRef;
    root: Dict;
    fs: import("./primitives.js").Obj | undefined;
    description: string;
    contentAvailable: boolean;
    get filename(): string;
    contentRef?: string | undefined;
    constructor(root: Dict, xref: XRef);
    get content(): Uint8Array | Uint8ClampedArray | undefined;
    get serializable(): Serializable;
}
//# sourceMappingURL=file_spec.d.ts.map