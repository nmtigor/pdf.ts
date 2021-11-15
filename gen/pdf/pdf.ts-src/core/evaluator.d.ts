import { ImageKind, matrix_t, OPS, rect_t, TextRenderingMode } from "../shared/util.js";
import { CMap } from "./cmap.js";
import { Dict, FontDict, Name, ObjNoCmd, Obj, Ref, RefSet, RefSetCache } from "./primitives.js";
import { ErrorFont, Font, Glyph, Seac } from "./fonts.js";
import { PDFFunctionFactory } from "./function.js";
import { Parser } from "./parser.js";
import { GlobalImageCache, LocalColorSpaceCache, LocalGStateCache, LocalImageCache, LocalTilingPatternCache } from "./image_utils.js";
import { ColorSpace } from "./colorspace.js";
import { Stream } from "./stream.js";
import { OperatorList } from "./operator_list.js";
import { Thread, MessageHandler, StreamSink } from "../shared/message_handler.js";
import { CssFontInfo, GlobalIdFactory } from "./document.js";
import { EvaluatorOptions } from "./pdf_manager.js";
import { WorkerTask } from "./worker.js";
import { PrivateData } from "./type1_parser.js";
import { XRef } from "./xref.js";
import { BaseStream } from "./base_stream.js";
import { DecodeStream } from "./decode_stream.js";
import { FontFlags } from "./fonts_utils.js";
import { IdentityToUnicodeMap, ToUnicodeMap } from "./to_unicode_map.js";
import { CMapData } from "../display/base_factory.js";
interface PartialEvaluatorCtorParms {
    xref: XRef;
    handler: MessageHandler<Thread.worker>;
    pageIndex: number;
    idFactory: GlobalIdFactory;
    fontCache: RefSetCache<Promise<TranslatedFont>>;
    builtInCMapCache: Map<string, CMapData>;
    standardFontDataCache: Map<string, Uint8Array | ArrayBuffer>;
    globalImageCache?: GlobalImageCache;
    options?: EvaluatorOptions;
}
export interface ImgData {
    width: number;
    height: number;
    interpolate?: boolean;
    data?: Uint8Array | Uint8ClampedArray | undefined;
    cached?: boolean;
    kind?: ImageKind;
    transform?: matrix_t;
}
interface BuildPaintImageXObjectParms {
    resources: Dict;
    image: BaseStream;
    isInline?: boolean;
    operatorList: OperatorList;
    cacheKey: string | undefined;
    localImageCache: LocalImageCache;
    localColorSpaceCache: LocalColorSpaceCache;
}
interface GetOperatorListParms {
    stream: BaseStream;
    task: WorkerTask;
    resources?: Dict | undefined;
    operatorList: OperatorList;
    initialState?: Partial<EvalState> | undefined;
    fallbackFontDict?: Dict | undefined;
}
interface SetGStateParms {
    resources: Dict;
    gState: Dict;
    operatorList: OperatorList;
    cacheKey: string;
    task: WorkerTask;
    stateManager: StateManager<EvalState>;
    localGStateCache: LocalGStateCache;
    localColorSpaceCache: LocalColorSpaceCache;
}
interface GetTextContentParms {
    stream: BaseStream;
    task: WorkerTask;
    resources: Dict;
    stateManager?: StateManager<TextState>;
    normalizeWhitespace?: boolean;
    combineTextItems?: boolean;
    includeMarkedContent?: boolean;
    sink: StreamSink<Thread.main, "GetTextContent">;
    seenStyles?: Set<string>;
}
interface CIDSystemInfo {
    registry: string;
    ordering: string;
    supplement: number;
}
export interface FontfileType {
    type: string;
    subtype?: string | undefined;
    composite?: boolean;
}
export interface FontProps extends FontfileType {
    name: string;
    file?: BaseStream | undefined;
    length1?: number | undefined;
    length2?: number | undefined;
    length3?: number | undefined;
    loadedName: string | undefined;
    fixedPitch?: boolean;
    fontMatrix?: matrix_t;
    firstChar: number;
    lastChar: number;
    bbox?: rect_t | undefined;
    ascent?: number | undefined;
    descent?: number | undefined;
    ascentScaled?: boolean;
    xHeight: number | undefined;
    capHeight: number | undefined;
    isSimulatedFlags?: boolean;
    flags: FontFlags;
    italicAngle?: number;
    isType3Font?: boolean;
    cidEncoding?: string;
    defaultEncoding?: string[] | undefined;
    differences?: string[];
    baseEncodingName?: string;
    hasEncoding?: boolean;
    dict?: FontDict;
    toUnicode: BaseStream | Name | IdentityToUnicodeMap | ToUnicodeMap | undefined;
    hasIncludedToUnicodeMap?: boolean;
    isStandardFont?: boolean;
    isInternalFont?: boolean;
    fallbackToUnicode?: string[];
    cidSystemInfo?: CIDSystemInfo;
    cidToGidMap?: number[];
    cMap?: CMap;
    vertical?: boolean;
    defaultWidth?: number;
    widths?: Record<string | number, number>;
    defaultVMetrics?: VMetric;
    vmetrics?: VMetric[];
    seacMap?: Seac[];
    builtInEncoding?: string[] | undefined;
    privateData?: PrivateData;
    glyphNames?: string[] | undefined;
    cssFontInfo?: CssFontInfo | undefined;
    scaleFactors?: number[] | undefined;
}
interface PreEvaluatedFont {
    descriptor: FontDict | undefined;
    dict: FontDict;
    baseDict: FontDict;
    composite: boolean;
    type: string;
    firstChar: number;
    lastChar: number;
    toUnicode: BaseStream | Name | undefined;
    hash: string;
    cssFontInfo?: CssFontInfo | undefined;
}
export interface BidiTextContentItem {
    str: string;
    dir: string;
    width: number;
    height: number;
    transform: matrix_t | undefined;
    fontName: string | undefined;
    hasEOL: boolean;
}
export interface TypeTextContentItem {
    type: string;
    id?: string | undefined;
    tag?: string | undefined;
    hasEOL?: boolean;
}
export interface FontStyle {
    fontFamily: string;
    ascent: number;
    descent: number;
    vertical: boolean | undefined;
}
interface ParseColorSpaceParms {
    cs: Name | Ref;
    resources: Dict;
    localColorSpaceCache: LocalColorSpaceCache;
}
declare type FontArgs = [fontName: Name | string, fontSize: number];
export declare type VMetric = [number, number, number];
export declare type VisibilityExpressionResult = (string | VisibilityExpressionResult)[];
export interface MarkedContentProps {
    type: string;
    id?: string | undefined;
    ids?: (string | undefined)[];
    policy?: string | undefined;
    expression?: VisibilityExpressionResult | undefined;
}
export interface SmaskOptions {
    subtype: string;
    backdrop: number[] | Uint8ClampedArray | undefined;
    transferMap?: Uint8Array;
}
interface ParseShadingParms {
    shading: Dict | BaseStream;
    resources: Dict;
    localColorSpaceCache: LocalColorSpaceCache;
    localShadingPatternCache: Map<Dict | BaseStream, string>;
}
/** @final */
export declare class PartialEvaluator {
    #private;
    xref: XRef;
    handler: MessageHandler<Thread.worker, Thread.main>;
    pageIndex: number;
    idFactory: GlobalIdFactory;
    fontCache: RefSetCache<Promise<TranslatedFont>>;
    builtInCMapCache: Map<string, CMapData>;
    standardFontDataCache: Map<string, Uint8Array | ArrayBuffer>;
    globalImageCache: GlobalImageCache | undefined;
    options: EvaluatorOptions;
    parsingType3Font: boolean;
    constructor({ xref, handler, pageIndex, idFactory, fontCache, builtInCMapCache, standardFontDataCache, globalImageCache, options, }: PartialEvaluatorCtorParms);
    /**
     * Since Functions are only cached (locally) by reference, we can share one
     * `PDFFunctionFactory` instance within this `PartialEvaluator` instance.
     */
    get _pdfFunctionFactory(): PDFFunctionFactory;
    clone(newOptions?: Partial<EvaluatorOptions>): any;
    hasBlendModes(resources: Dict, nonBlendModesSet: RefSet): boolean;
    fetchBuiltInCMap: (name: string) => Promise<CMapData>;
    fetchStandardFontData(name: string): Promise<Stream | undefined>;
    buildFormXObject(resources: Dict, xobj: BaseStream, smask: SmaskOptions | undefined, operatorList: OperatorList, task: WorkerTask, initialState: Partial<EvalState | TextState>, localColorSpaceCache: LocalColorSpaceCache): Promise<void>;
    buildPaintImageXObject({ resources, image, isInline, operatorList, cacheKey, localImageCache, localColorSpaceCache, }: BuildPaintImageXObjectParms): Promise<void>;
    handleSMask(smask: Dict, resources: Dict, operatorList: OperatorList, task: WorkerTask, stateManager: StateManager<EvalState>, localColorSpaceCache: LocalColorSpaceCache): Promise<void>;
    handleTransferFunction(tr?: Obj): (Uint8Array | null)[] | null;
    handleTilingType(fn: OPS, color: Uint8ClampedArray | undefined, resources: Dict, pattern: BaseStream, patternDict: Dict, operatorList: OperatorList, task: WorkerTask, localTilingPatternCache: LocalTilingPatternCache): Promise<void>;
    handleSetFont(resources: Dict, fontArgs: FontArgs | undefined, fontRef: Ref | undefined, operatorList: OperatorList, task: WorkerTask, state: Partial<EvalState | TextState>, fallbackFontDict?: FontDict, cssFontInfo?: CssFontInfo): Promise<string>;
    handleText(chars: string, state: Partial<EvalState>): Glyph[];
    ensureStateFont(state: Partial<EvalState | TextState>): void;
    setGState({ resources, gState, operatorList, cacheKey, task, stateManager, localGStateCache, localColorSpaceCache, }: SetGStateParms): Promise<void>;
    loadFont(fontName: string | undefined, font: Ref | undefined, resources: Dict, fallbackFontDict?: FontDict, cssFontInfo?: CssFontInfo): Promise<TranslatedFont>;
    buildPath(operatorList: OperatorList, fn: OPS, args: OpArgs, parsingText?: boolean): void;
    parseColorSpace({ cs, resources, localColorSpaceCache }: ParseColorSpaceParms): Promise<ColorSpace | undefined>;
    parseShading({ shading, resources, localColorSpaceCache, localShadingPatternCache, }: ParseShadingParms): string;
    handleColorN(operatorList: OperatorList, fn: OPS, args: [Name, ...number[]], cs: ColorSpace, patterns: Dict, resources: Dict, task: WorkerTask, localColorSpaceCache: LocalColorSpaceCache, localTilingPatternCache: LocalTilingPatternCache, localShadingPatternCache: Map<Dict | BaseStream, string>): Promise<void> | undefined;
    _parseVisibilityExpression(array: (Obj | undefined)[], nestingCounter: number, currentResult: VisibilityExpressionResult): void;
    parseMarkedContentProps(contentProperties: Dict | Name, resources: Dict): Promise<MarkedContentProps | undefined>;
    getOperatorList({ stream, task, resources, operatorList, initialState, fallbackFontDict, }: GetOperatorListParms): Promise<void>;
    getTextContent({ stream, task, resources, stateManager, normalizeWhitespace, combineTextItems, includeMarkedContent, sink, seenStyles, }: GetTextContentParms): Promise<void>;
    extractDataStructures(dict: FontDict, baseDict: FontDict, properties: FontProps): Promise<FontProps>;
    /**
     * Builds a char code to unicode map based on section 9.10 of the spec.
     * @param properties Font properties object.
     * @return A Promise that is resolved with a
     *   {ToUnicodeMap|IdentityToUnicodeMap} object.
     */
    buildToUnicode(properties: FontProps): Promise<IdentityToUnicodeMap | ToUnicodeMap>;
    readToUnicode(cmapObj?: Name | DecodeStream): Promise<IdentityToUnicodeMap | ToUnicodeMap | undefined>;
    readCidToGidMap(glyphsData: Uint8Array | Uint8ClampedArray, toUnicode: IdentityToUnicodeMap | ToUnicodeMap): number[];
    extractWidths(dict: FontDict, descriptor: FontDict, properties: FontProps): void;
    isSerifFont(baseFontName: string): boolean;
    getBaseFontMetrics(name: string): {
        defaultWidth: number;
        monospace: boolean;
        widths: Record<string, number>;
    };
    buildCharCodeToWidth(widthsByGlyphName: Record<string, number>, properties: FontProps): Record<number, number>;
    preEvaluateFont(dict: FontDict): PreEvaluatedFont;
    translateFont({ descriptor, dict, baseDict, composite, type, firstChar, lastChar, toUnicode, cssFontInfo, }: PreEvaluatedFont): Promise<Font>;
    static buildFontPaths(font: Font, glyphs: Glyph[], handler: MessageHandler<Thread.worker>, evaluatorOptions: EvaluatorOptions): void;
    static get fallbackFontDict(): FontDict;
}
interface TranslatedFontCtorParms {
    loadedName: string;
    font: Font | ErrorFont;
    dict: FontDict | null;
    evaluatorOptions: EvaluatorOptions | undefined;
}
export declare class TranslatedFont {
    #private;
    loadedName: string;
    font: Font | ErrorFont;
    dict: FontDict | null;
    _evaluatorOptions: EvaluatorOptions;
    type3Loaded?: Promise<void>;
    type3Dependencies: Set<string> | undefined;
    sent: boolean;
    _bbox?: rect_t;
    constructor({ loadedName, font, dict, evaluatorOptions }: TranslatedFontCtorParms);
    send(handler: MessageHandler<Thread.worker>): void;
    fallback(handler: MessageHandler<Thread.worker>): void;
    loadType3Data(evaluator: PartialEvaluator, resources: Dict, task: WorkerTask): Promise<void>;
}
declare class StateManager<S extends EvalState | TextState> {
    state: Partial<S>;
    stateStack: Partial<S>[];
    constructor(initialState: Partial<S>);
    save(): void;
    restore(): void;
    transform(args: matrix_t): void;
}
declare class TextState {
    ctm: [number, number, number, number, number, number];
    fontName: string | undefined;
    fontSize: number;
    font?: Font | ErrorFont;
    fontMatrix: [number, number, number, number, number, number];
    textMatrix: [number, number, number, number, number, number];
    textLineMatrix: [number, number, number, number, number, number];
    charSpacing: number;
    wordSpacing: number;
    leading: number;
    textHScale: number;
    textRise: number;
    setTextMatrix(a: number, b: number, c: number, d: number, e: number, f: number): void;
    setTextLineMatrix(a: number, b: number, c: number, d: number, e: number, f: number): void;
    translateTextMatrix(x: number, y: number): void;
    translateTextLineMatrix(x: number, y: number): void;
    carriageReturn(): void;
    clone(): Partial<TextState>;
}
export declare class EvalState {
    ctm: [number, number, number, number, number, number];
    font?: Font | ErrorFont;
    fontSize: number;
    fontName?: string;
    textRenderingMode: TextRenderingMode;
    fillColorSpace: ColorSpace;
    strokeColorSpace: import("./colorspace.js").DeviceGrayCS;
    clone(): Partial<EvalState>;
}
interface OpInfo {
    id: OPS;
    numArgs: number;
    variableArgs: boolean;
}
export declare type OpMap = Record<string, OpInfo | null>;
export declare type OpArgs = ObjNoCmd[] | null;
export interface Operation {
    fn: OPS;
    args: OpArgs | null;
}
export declare class EvaluatorPreprocessor {
    #private;
    static get opMap(): OpMap;
    static get MAX_INVALID_PATH_OPS(): number;
    parser: Parser;
    stateManager: StateManager<EvalState | TextState>;
    nonProcessedArgs: ObjNoCmd[];
    constructor(stream: BaseStream, xref?: XRef, stateManager?: StateManager<EvalState | TextState>);
    get savedStatesDepth(): number;
    read(operation: Operation): boolean;
    preprocessCommand(fn: OPS, args: OpArgs): void;
}
export {};
//# sourceMappingURL=evaluator.d.ts.map