import { type AnnotStorageRecord } from "../display/annotation_layer.js";
import { MessageHandler, Thread } from "../shared/message_handler.js";
import { AbortException } from "../shared/util.js";
import { AnnotationFactory } from "./annotation.js";
import { Catalog } from "./catalog.js";
import { ChunkedStreamManager } from "./chunked_stream.js";
import { Page, PDFDocument } from "./document.js";
import { Stream } from "./stream.js";
import { WorkerTask } from "./worker.js";
import { PDFWorkerStream } from "./worker_stream.js";
import { XRef } from "./xref.js";
export interface EvaluatorOptions {
    maxImageSize: number | undefined;
    disableFontFace: boolean | undefined;
    ignoreErrors: boolean | undefined;
    isEvalSupported: boolean | undefined;
    isOffscreenCanvasSupported: boolean | undefined;
    fontExtraProperties: boolean | undefined;
    useSystemFonts: boolean | undefined;
    cMapUrl?: string | undefined;
    standardFontDataUrl: string | undefined;
}
interface BasePdfManagerCtorP_ {
    docBaseUrl?: string;
    docId: string;
    password?: string;
    enableXfa?: boolean;
    evaluatorOptions: EvaluatorOptions;
}
export declare abstract class BasePdfManager {
    private _docBaseUrl;
    get docBaseUrl(): string | undefined;
    private _docId;
    /** @final */
    get docId(): string;
    protected _password: string | undefined;
    /** @final */
    get password(): string | undefined;
    msgHandler: MessageHandler<Thread.worker>;
    enableXfa: boolean | undefined;
    evaluatorOptions: EvaluatorOptions;
    pdfDocument: PDFDocument;
    constructor(args: BasePdfManagerCtorP_);
    /** @fianl */
    ensureDoc<P extends keyof PDFDocument, A = PDFDocument[P] extends (...args: any) => any ? Parameters<PDFDocument[P]> : undefined>(prop: P, args?: A): Promise<Awaited<PDFDocument[P] extends (...args: any) => any ? ReturnType<PDFDocument[P]> : PDFDocument[P]>>;
    /** @fianl */
    ensureXRef<P extends keyof XRef, A = XRef[P] extends (...args: any) => any ? Parameters<XRef[P]> : undefined>(prop: P, args?: A): Promise<Awaited<XRef[P] extends (...args: any) => any ? ReturnType<XRef[P]> : XRef[P]>>;
    /** @fianl */
    ensureCatalog<P extends keyof Catalog, A = Catalog[P] extends (...args: any) => any ? Parameters<Catalog[P]> : undefined>(prop: P, args?: A): Promise<Awaited<Catalog[P] extends (...args: any) => any ? ReturnType<Catalog[P]> : Catalog[P]>>;
    getPage(pageIndex: number): Promise<Page>;
    fontFallback(id: string, handler: MessageHandler<Thread.worker>): Promise<void>;
    loadXfaFonts(handler: MessageHandler<Thread.worker>, task: WorkerTask): Promise<void>;
    loadXfaImages(): Promise<void>;
    serializeXfaData(annotationStorage: AnnotStorageRecord | undefined): Promise<string | undefined>;
    cleanup(manuallyTriggered?: boolean): Promise<void>;
    abstract ensure<O extends PDFDocument | Page | XRef | Catalog | AnnotationFactory, P extends keyof O, A = O[P] extends (...args: any) => any ? Parameters<O[P]> : undefined, R = O[P] extends (...args: any) => any ? ReturnType<O[P]> : O[P]>(obj: O, prop: P, args?: A): Promise<Awaited<R>>;
    abstract requestRange(begin: number, end: number): Promise<void>;
    abstract requestLoadedStream(noFetch?: boolean): Promise<Stream>;
    sendProgressiveData?(chunk: ArrayBufferLike): void;
    updatePassword(password: string): void;
    abstract terminate(reason: AbortException): void;
}
export interface LocalPdfManagerCtorP extends BasePdfManagerCtorP_ {
    source: Uint8Array | ArrayBuffer | number[];
}
export declare class LocalPdfManager extends BasePdfManager {
    #private;
    constructor(args: LocalPdfManagerCtorP);
    /** @implement */
    ensure<O extends PDFDocument | Page | XRef | Catalog | AnnotationFactory, P extends keyof O, A = O[P] extends (...args: any) => any ? Parameters<O[P]> : undefined, R = O[P] extends (...args: any) => any ? ReturnType<O[P]> : O[P]>(obj: O, prop: P, args: A): Promise<Awaited<R>>;
    /** @implement */
    requestRange(begin: number, end: number): Promise<void>;
    /** @implement */
    requestLoadedStream(noFetch?: boolean): Promise<Stream>;
    /** @implement */
    terminate(reason: AbortException): void;
}
export interface NetworkPdfManagerCtorP extends BasePdfManagerCtorP_ {
    source: PDFWorkerStream;
    handler: MessageHandler<Thread.worker>;
    length: number;
    disableAutoFetch: boolean;
    rangeChunkSize: number;
}
export declare class NetworkPdfManager extends BasePdfManager {
    streamManager: ChunkedStreamManager;
    constructor(args: NetworkPdfManagerCtorP);
    /** @implement */
    ensure<O extends PDFDocument | Page | XRef | Catalog | AnnotationFactory, P extends keyof O, A = O[P] extends (...args: any) => any ? Parameters<O[P]> : undefined, R = O[P] extends (...args: any) => any ? ReturnType<O[P]> : O[P]>(obj: O, prop: P, args: A): Promise<Awaited<R>>;
    /** @implement */
    requestRange(begin: number, end: number): Promise<void>;
    /** @implement */
    requestLoadedStream(noFetch?: boolean): Promise<import("./chunked_stream.js").ChunkedStream>;
    sendProgressiveData(chunk: ArrayBufferLike): void;
    /** @implement */
    terminate(reason: AbortException): void;
}
export {};
//# sourceMappingURL=pdf_manager.d.ts.map