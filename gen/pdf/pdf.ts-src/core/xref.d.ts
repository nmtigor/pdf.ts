import { Cmd, Dict, NoRef, Obj, Ref } from "./primitives.js";
import { Parser } from "./parser.js";
import { CipherTransformFactory } from "./crypto.js";
import { Stream } from "./stream.js";
import { ChunkedStream } from "./chunked_stream.js";
import { PDFDocumentStats } from "../display/api.js";
import { BasePdfManager } from "./pdf_manager.js";
import { BaseStream } from "./base_stream.js";
interface XRefEntry {
    offset: number;
    gen: number;
    free?: boolean;
    uncompressed?: boolean;
}
interface XRefTableState {
    entryNum: number;
    streamPos: number;
    parserBuf1: Obj;
    parserBuf2: Obj;
    firstEntryNum?: number;
    entryCount?: number;
}
interface XRefStreamState {
    entryRanges: number[];
    byteWidths: number[];
    entryNum: number;
    streamPos: number;
}
export declare class XRef {
    #private;
    stream: Stream | ChunkedStream;
    pdfManager: BasePdfManager;
    entries: XRefEntry[];
    xrefstms: number[];
    stats: PDFDocumentStats;
    getNewRef(): Ref;
    resetNewRef(): void;
    startXRefQueue?: number[];
    setStartXRef(startXRef: number): void;
    trailer?: Dict;
    encrypt?: CipherTransformFactory;
    root?: Dict;
    tableState?: XRefTableState;
    streamState?: XRefStreamState;
    topDict?: Dict;
    constructor(stream: Stream | ChunkedStream, pdfManager: BasePdfManager);
    parse(recoveryMode?: boolean): void;
    processXRefTable(parser: Parser): Dict;
    readXRefTable(parser: Parser): Obj;
    processXRefStream(stream: Stream): Dict;
    readXRefStream(stream: Stream): void;
    indexObjects(): Dict;
    readXRef(recoveryMode?: boolean): Dict | undefined;
    getEntry(i: number): XRefEntry | null;
    fetchIfRef(obj: Obj, suppressEncryption?: boolean): NoRef | undefined;
    fetch(ref: Ref, suppressEncryption?: boolean): NoRef;
    fetchUncompressed(ref: Ref, xrefEntry: XRefEntry, suppressEncryption?: boolean): NoRef;
    fetchCompressed(ref: Ref, xrefEntry: XRefEntry, suppressEncryption?: boolean): NoRef;
    fetchIfRefAsync(obj: Obj, suppressEncryption?: boolean): Promise<string | number | boolean | Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array | BaseStream | Dict | XFANsName.Name | Cmd | typeof import("./primitives.js").EOF | Obj[] | Ref | null>;
    fetchAsync<T extends Obj = Obj>(ref: Ref, suppressEncryption?: boolean): Promise<T>;
    getCatalogObj(): Dict;
}
export {};
//# sourceMappingURL=xref.d.ts.map