/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/file_spec.ts
 * @license Apache-2.0
 ******************************************************************************/
import { Dict } from "./primitives.js";
import { XRef } from "./xref.js";
export interface Attachment {
    filename: string;
    content?: Uint8Array | Uint8ClampedArray | undefined;
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
    xref: XRef | undefined;
    root: Dict | undefined;
    fs: import("./primitives.js").Obj | undefined;
    description: string | undefined;
    get filename(): string;
    contentRef?: string | undefined;
    constructor(root: Dict, xref?: XRef, skipContent?: boolean);
    get content(): Uint8Array | Uint8ClampedArray | undefined;
    get serializable(): Attachment;
}
//# sourceMappingURL=file_spec.d.ts.map