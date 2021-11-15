import { Dict, ObjNoRef, Obj, Ref } from "./primitives.js";
import { Parser } from "./parser.js";
import { CipherTransformFactory } from "./crypto.js";
import { Stream } from "./stream.js";
import { ChunkedStream } from "./chunked_stream.js";
import { PDFDocumentStats } from "../display/api.js";
import { BasePdfManager } from "./pdf_manager.js";
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
    fetchIfRef(obj: Obj | undefined, suppressEncryption?: boolean): ObjNoRef | undefined;
    fetch(ref: Ref, suppressEncryption?: boolean): ObjNoRef;
    fetchUncompressed(ref: Ref, xrefEntry: XRefEntry, suppressEncryption?: boolean): ObjNoRef;
    fetchCompressed(ref: Ref, xrefEntry: XRefEntry, suppressEncryption?: boolean): ObjNoRef;
    fetchIfRefAsync(obj: Obj, suppressEncryption?: boolean): Promise<Obj>;
    fetchAsync<T extends Obj = Obj>(ref: Ref, suppressEncryption?: boolean): Promise<T>;
    getCatalogObj(): Dict;
}
export {};
//# sourceMappingURL=xref.d.ts.map