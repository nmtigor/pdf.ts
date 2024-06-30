/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/document.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { rect_t } from "../../../lib/alias.js";
import type { AnnotStorageRecord, AnnotStorageValue } from "../display/annotation_layer.js";
import type { CMapData } from "../display/base_factory.js";
import type { MessageHandler, StreamSink, Thread } from "../shared/message_handler.js";
import { RenderingIntentFlag } from "../shared/util.js";
import type { Annotation, AnnotationGlobals, AnnotImage, AnnotSaveReturn, FieldObject } from "./annotation.js";
import { BaseStream } from "./base_stream.js";
import { Catalog } from "./catalog.js";
import { DatasetReader } from "./dataset_reader.js";
import { type TranslatedFont } from "./evaluator.js";
import type { SubstitutionInfo } from "./font_substitutions.js";
import type { GlobalImageCache } from "./image_utils.js";
import { Linearization } from "./parser.js";
import type { BasePdfManager } from "./pdf_manager.js";
import { Dict, Name, Ref, RefSet, RefSetCache } from "./primitives.js";
import { type Stream } from "./stream.js";
import { StructTreePage, type StructTreeRoot } from "./struct_tree.js";
import type { WorkerTask } from "./worker.js";
import { XFAFactory } from "./xfa/factory.js";
import { type XFAFontMetrics } from "./xfa_fonts.js";
import { XRef } from "./xref.js";
export interface LocalIdFactory extends GlobalIdFactory {
    createObjId(): string;
}
interface PageCtorP_ {
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
    systemFontCache: Map<string, SubstitutionInfo>;
    nonBlendModesSet: RefSet;
    xfaFactory?: XFAFactory | undefined;
}
interface PageGetOperatorListP_ {
    handler: MessageHandler<Thread.worker>;
    sink: StreamSink<Thread.main, "GetOperatorList">;
    task: WorkerTask;
    intent: RenderingIntentFlag;
    cacheKey: string;
    annotationStorage: AnnotStorageRecord | undefined;
}
interface ExtractTextContentP_ {
    handler: MessageHandler<Thread.worker>;
    task: WorkerTask;
    includeMarkedContent: boolean;
    disableNormalization: boolean;
    sink: StreamSink<Thread.main, "GetTextContent">;
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
    systemFontCache: Map<string, SubstitutionInfo>;
    nonBlendModesSet: RefSet;
    evaluatorOptions: Readonly<import("./pdf_manager.js").EvaluatorOptions>;
    xfaFactory: XFAFactory | undefined;
    get _localIdFactory(): LocalIdFactory;
    resourcesPromise?: Promise<Dict>;
    constructor({ pdfManager, xref, pageIndex, pageDict, ref, globalIdFactory, fontCache, builtInCMapCache, standardFontDataCache, globalImageCache, systemFontCache, nonBlendModesSet, xfaFactory, }: PageCtorP_);
    get content(): Stream | (Ref | Stream)[] | undefined;
    /**
     * Table 33
     */
    get resources(): Dict;
    _getBoundingBox(name: string): [number, number, number, number] | undefined;
    get mediaBox(): [number, number, number, number];
    get cropBox(): [number, number, number, number];
    get userUnit(): number;
    get view(): rect_t;
    get rotate(): number;
    getContentStream(): Promise<BaseStream>;
    get xfaData(): {
        bbox: [number, number, number, number];
    } | undefined;
    saveNewAnnotations(handler: MessageHandler<Thread.worker>, task: WorkerTask, annotations: AnnotStorageValue[], imagePromises: Map<string, Promise<AnnotImage>> | undefined): Promise<import("./annotation.js").AnnotSaveData[]>;
    save(handler: MessageHandler<Thread.worker>, task: WorkerTask, annotationStorage?: AnnotStorageRecord): Promise<AnnotSaveReturn[]>;
    loadResources(keys: string[]): Promise<import("./chunked_stream.js").ChunkedStream | undefined>;
    getOperatorList({ handler, sink, task, intent, cacheKey, annotationStorage, }: PageGetOperatorListP_): Promise<{
        length: number;
    }>;
    extractTextContent({ handler, task, includeMarkedContent, disableNormalization, sink, }: ExtractTextContentP_): Promise<void>;
    getStructTree(): Promise<import("../display/api.js").StructTreeNode | undefined>;
    /**
     * @private
     */
    _parseStructTree(structTreeRoot: StructTreeRoot): StructTreePage;
    getAnnotationsData(handler: MessageHandler<Thread.worker>, task: WorkerTask, intent: RenderingIntentFlag): Promise<import("./annotation.js").AnnotationData[] | Annotation[]>;
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
interface XFAStreams_ {
    "xdp:xdp": string | BaseStream;
    template: string | BaseStream;
    datasets: string | BaseStream;
    config: string | BaseStream;
    connectionSet: string | BaseStream;
    localeSet: string | BaseStream;
    stylesheet: string | BaseStream;
    "/xdp:xdp": string | BaseStream;
}
export type XFAData = XFAStreams_ & {
    name: string;
    value: string;
    attributes?: string;
    children: (XFAData | null)[];
    [key: string]: unknown;
};
export type CssFontInfo = {
    fontFamily: string;
    fontWeight: number | string | undefined;
    italicAngle: number | string;
    lineHeight?: number;
    metrics?: XFAFontMetrics | undefined;
};
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
    get linearization(): Linearization | undefined;
    get startXRef(): number;
    /**
     * Find the header, get the PDF format version and setup the
     * stream to start from the header.
     */
    checkHeader(): void;
    parseStartXRef(): void;
    get numPages(): number | Promise<number>;
    get _xfaStreams(): XFAStreams_ | undefined;
    get xfaDatasets(): DatasetReader | undefined;
    get xfaData(): any;
    get xfaFactory(): XFAFactory | undefined;
    get isPureXfa(): boolean;
    get htmlForXfa(): Promise<import("./xfa/factory.js").XFAPages> | undefined;
    loadXfaImages(): Promise<void>;
    loadXfaFonts(handler: MessageHandler<Thread.worker>, task: WorkerTask): Promise<void>;
    serializeXfaData(annotationStorage: AnnotStorageRecord | undefined): Promise<string | undefined>;
    /**
     * The specification states in section 7.5.2 that the version from
     * the catalog, if present, should overwrite the version from the header.
     */
    get version(): string | undefined;
    get formInfo(): FormInfo;
    get documentInfo(): DocumentInfo;
    get fingerprints(): [string, string | undefined];
    getPage(pageIndex: number): Promise<Page>;
    checkFirstPage(recoveryMode?: boolean): Promise<void>;
    checkLastPage(recoveryMode?: boolean): Promise<void>;
    fontFallback(id: string, handler: MessageHandler<Thread.worker>): Promise<void>;
    cleanup(manuallyTriggered?: boolean): Promise<void>;
    get fieldObjects(): Promise<Record<string, FieldObject[]> | undefined>;
    get hasJSActions(): Promise<boolean>;
    /**
     * @private
     */
    _parseHasJSActions(): Promise<boolean>;
    get calculationOrderIds(): string[] | undefined;
    get annotationGlobals(): Promise<AnnotationGlobals | undefined>;
}
export {};
//# sourceMappingURL=document.d.ts.map