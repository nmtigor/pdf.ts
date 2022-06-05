import { type AnnotStorageRecord } from "../display/annotation_layer.js";
import { type CMapData } from "../display/base_factory.js";
import { MessageHandler, Thread, type StreamSink } from "../shared/message_handler.js";
import { RenderingIntentFlag } from "../shared/util.js";
import { Annotation, type AnnotationData, type FieldObject, type SaveReturn } from "./annotation.js";
import { BaseStream } from "./base_stream.js";
import { Catalog } from "./catalog.js";
import { DatasetReader } from "./dataset_reader.js";
import { TranslatedFont } from "./evaluator.js";
import { GlobalImageCache } from "./image_utils.js";
import { Linearization } from "./parser.js";
import { BasePdfManager } from "./pdf_manager.js";
import { Dict, Name, Ref, RefSet, RefSetCache } from "./primitives.js";
import { Stream } from "./stream.js";
import { StructTreePage, StructTreeRoot } from "./struct_tree.js";
import { WorkerTask } from "./worker.js";
import { XFAFactory } from "./xfa/factory.js";
import { type XFAFontMetrics } from "./xfa_fonts.js";
import { XRef } from "./xref.js";
export interface LocalIdFactory extends GlobalIdFactory {
    createObjId(): string;
}
interface _PageCtorP {
    pdfManager: BasePdfManager;
    xref: XRef;
    pageIndex: number;
    pageDict: Dict;
    ref: Ref | undefined;
    globalIdFactory: GlobalIdFactory;
    fontCache: RefSetCache<Promise<TranslatedFont>>;
    builtInCMapCache: Map<string, CMapData>;
    standardFontDataCache: Map<string, Uint8Array | ArrayBuffer>;
    globalImageCache: GlobalImageCache;
    nonBlendModesSet: RefSet;
    xfaFactory?: XFAFactory | undefined;
}
interface _PageGetOperatorListP {
    handler: MessageHandler<Thread.worker>;
    sink: StreamSink<Thread.main, "GetOperatorList">;
    task: WorkerTask;
    intent: RenderingIntentFlag;
    cacheKey: string;
    annotationStorage: AnnotStorageRecord | undefined;
}
interface _ExtractTextContentP {
    handler: MessageHandler<Thread.worker>;
    task: WorkerTask;
    sink: StreamSink<Thread.main, "GetTextContent">;
    includeMarkedContent: boolean;
    combineTextItems: boolean;
}
export declare class Page {
    #private;
    pdfManager: BasePdfManager;
    pageIndex: number;
    pageDict: Dict;
    xref: XRef;
    ref: Ref | undefined;
    fontCache: RefSetCache<Promise<TranslatedFont>>;
    builtInCMapCache: Map<string, CMapData>;
    standardFontDataCache: Map<string, Uint8Array | ArrayBuffer>;
    globalImageCache: GlobalImageCache;
    nonBlendModesSet: RefSet;
    evaluatorOptions: import("./pdf_manager.js").EvaluatorOptions;
    xfaFactory: XFAFactory | undefined;
    get _localIdFactory(): LocalIdFactory;
    resourcesPromise?: Promise<Dict>;
    constructor({ pdfManager, xref, pageIndex, pageDict, ref, globalIdFactory, fontCache, builtInCMapCache, standardFontDataCache, globalImageCache, nonBlendModesSet, xfaFactory, }: _PageCtorP);
    get content(): Stream | (Ref | Stream)[] | undefined;
    /**
     * Table 33
     */
    get resources(): Dict;
    _getBoundingBox(name: string): [number, number, number, number] | null;
    get mediaBox(): [number, number, number, number];
    get cropBox(): [number, number, number, number];
    get userUnit(): number;
    get view(): [number, number, number, number];
    get rotate(): number;
    getContentStream(handler: MessageHandler<Thread.worker>): Promise<BaseStream>;
    get xfaData(): {
        bbox: [number, number, number, number];
    } | null;
    save(handler: MessageHandler<Thread.worker>, task: WorkerTask, annotationStorage?: AnnotStorageRecord): Promise<(SaveReturn | null)[]>;
    loadResources(keys: string[]): Promise<import("./chunked_stream.js").ChunkedStream | undefined>;
    getOperatorList({ handler, sink, task, intent, cacheKey, annotationStorage, }: _PageGetOperatorListP): Promise<{
        length: number;
    }>;
    extractTextContent({ handler, task, includeMarkedContent, sink, combineTextItems, }: _ExtractTextContentP): Promise<void>;
    getStructTree(): Promise<import("./struct_tree.js").StructTree | undefined>;
    /**
     * @private
     */
    _parseStructTree(structTreeRoot: StructTreeRoot): StructTreePage;
    getAnnotationsData(intent: RenderingIntentFlag): Promise<AnnotationData[]>;
    get annotations(): Ref[];
    get _parsedAnnotations(): Promise<Annotation[]>;
    get jsActions(): import("./core_utils.js").AnnotActions | undefined;
}
export interface GlobalIdFactory {
    getDocId(): string;
    createFontId(): string;
    createObjId?(): string;
    getPageObjId(): string;
}
export interface DocumentInfo {
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
    Trapped?: Name;
    IsAcroFormPresent: boolean;
    IsCollectionPresent: boolean;
    IsLinearized: boolean;
    IsSignaturesPresent: boolean;
    IsXFAPresent: boolean;
    Custom?: Record<string, string | number | boolean | Name>;
}
interface FormInfo {
    hasFields: boolean;
    hasAcroForm: boolean;
    hasXfa: boolean;
    hasSignatures: boolean;
}
interface _XFAStreams {
    "xdp:xdp": string | BaseStream;
    template: string | BaseStream;
    datasets: string | BaseStream;
    config: string | BaseStream;
    connectionSet: string | BaseStream;
    localeSet: string | BaseStream;
    stylesheet: string | BaseStream;
    "/xdp:xdp": string | BaseStream;
}
export declare type XFAData = _XFAStreams & {
    name: string;
    value: string;
    attributes?: string;
    children: (XFAData | null)[];
    [key: string]: unknown;
};
export interface CssFontInfo {
    fontFamily: string;
    metrics?: XFAFontMetrics | undefined;
    fontWeight: number | string | undefined;
    italicAngle: number | string;
}
/**
 * The `PDFDocument` class holds all the (worker-thread) data of the PDF file.
 */
export declare class PDFDocument {
    #private;
    pdfManager: BasePdfManager;
    stream: Stream;
    xref: XRef;
    catalog?: Catalog;
    get _globalIdFactory(): GlobalIdFactory;
    constructor(pdfManager: BasePdfManager, stream: Stream);
    parse(recoveryMode: boolean): void;
    get linearization(): Linearization | null;
    get startXRef(): number;
    /**
     * Find the header, get the PDF format version and setup the
     * stream to start from the header.
     */
    checkHeader(): void;
    parseStartXRef(): void;
    get numPages(): number | Promise<number>;
    get _xfaStreams(): _XFAStreams | undefined;
    get xfaDatasets(): DatasetReader | undefined;
    get xfaData(): any;
    get xfaFactory(): XFAFactory | undefined;
    get isPureXfa(): boolean;
    get htmlForXfa(): Promise<import("./xfa/factory.js").XFAPages> | undefined;
    loadXfaImages(): Promise<void>;
    loadXfaFonts(handler: MessageHandler<Thread.worker>, task: WorkerTask): Promise<void>;
    serializeXfaData(annotationStorage: AnnotStorageRecord | undefined): Promise<string | undefined>;
    get formInfo(): FormInfo;
    get documentInfo(): DocumentInfo;
    get fingerprints(): [string, string | undefined];
    getPage(pageIndex: number): Promise<Page>;
    checkFirstPage(recoveryMode?: boolean): Promise<void>;
    checkLastPage(recoveryMode?: boolean): Promise<void>;
    fontFallback(id: string, handler: MessageHandler<Thread.worker>): Promise<void>;
    cleanup(manuallyTriggered?: boolean): Promise<void>;
    get fieldObjects(): Promise<undefined> | Promise<Record<string, FieldObject[]>>;
    get hasJSActions(): Promise<boolean>;
    /**
     * @private
     */
    _parseHasJSActions(): Promise<boolean>;
    get calculationOrderIds(): string[] | undefined;
}
export {};
//# sourceMappingURL=document.d.ts.map