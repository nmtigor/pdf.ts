import { type CMapData } from "../display/base_factory.js";
import { MessageHandler, type StreamSink, Thread } from "../shared/message_handler.js";
import { ImageKind, type matrix_t, OPS, type rect_t, TextRenderingMode } from "../shared/util.js";
import { BaseStream } from "./base_stream.js";
import { CMap } from "./cmap.js";
import { ColorSpace } from "./colorspace.js";
import { DecodeStream } from "./decode_stream.js";
import { type CssFontInfo, type GlobalIdFactory } from "./document.js";
import { ErrorFont, Font, Glyph, type Seac } from "./fonts.js";
import { FontFlags } from "./fonts_utils.js";
import { PDFFunctionFactory } from "./function.js";
import { GlobalImageCache, LocalColorSpaceCache, LocalGStateCache, LocalImageCache, LocalTilingPatternCache } from "./image_utils.js";
import { OperatorList } from "./operator_list.js";
import { Parser } from "./parser.js";
import { type EvaluatorOptions } from "./pdf_manager.js";
import { Dict, FontDict, Name, type Obj, Ref, RefSet, RefSetCache } from "./primitives.js";
import { Stream } from "./stream.js";
import { IdentityToUnicodeMap, ToUnicodeMap } from "./to_unicode_map.js";
import { type PrivateData } from "./type1_parser.js";
import { WorkerTask } from "./worker.js";
import { XRef } from "./xref.js";
interface _PartialEvaluatorCtorP {
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
    width?: number | undefined;
    height?: number | undefined;
    interpolate?: boolean | undefined;
    bitmap?: ImageBitmap;
    data?: string | Uint8Array | Uint8ClampedArray | undefined;
    count?: number | undefined;
    cached?: boolean;
    kind?: ImageKind;
    transform?: matrix_t;
    isSingleOpaquePixel?: boolean;
}
interface _BuildPaintImageXObjectP {
    resources: Dict;
    image: BaseStream;
    isInline?: boolean;
    operatorList: OperatorList;
    cacheKey: string | undefined;
    localImageCache: LocalImageCache;
    localColorSpaceCache: LocalColorSpaceCache;
}
interface _GetOperatorListP {
    stream: BaseStream;
    task: WorkerTask;
    resources?: Dict | undefined;
    operatorList: OperatorList;
    initialState?: Partial<EvalState> | undefined;
    fallbackFontDict?: Dict | undefined;
}
interface _SetGStateP {
    resources: Dict;
    gState: Dict;
    operatorList: OperatorList;
    cacheKey: string;
    task: WorkerTask;
    stateManager: StateManager<EvalState>;
    localGStateCache: LocalGStateCache;
    localColorSpaceCache: LocalColorSpaceCache;
}
interface _GetTextContentP {
    stream: BaseStream;
    task: WorkerTask;
    resources: Dict | undefined;
    stateManager?: StateManager<TextState>;
    normalizeWhitespace?: boolean;
    combineTextItems?: boolean;
    includeMarkedContent?: boolean;
    sink: StreamSink<Thread.main, "GetTextContent">;
    seenStyles?: Set<string>;
    viewBox: rect_t;
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
export interface FontStyle {
    fontFamily: string;
    ascent: number;
    descent: number;
    vertical: boolean | undefined;
}
interface _ParseColorSpaceP {
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
interface _ParseShadingP {
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
    options: EvaluatorOptions | Readonly<{
        maxImageSize: -1;
        disableFontFace: false;
        ignoreErrors: false;
        isEvalSupported: true;
        fontExtraProperties: false;
        useSystemFonts: true;
        cMapUrl: undefined;
        standardFontDataUrl: undefined;
    }>;
    parsingType3Font: boolean;
    type3FontRefs?: RefSet;
    constructor({ xref, handler, pageIndex, idFactory, fontCache, builtInCMapCache, standardFontDataCache, globalImageCache, options, }: _PartialEvaluatorCtorP);
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
    buildPaintImageXObject({ resources, image, isInline, operatorList, cacheKey, localImageCache, localColorSpaceCache, }: _BuildPaintImageXObjectP): Promise<void>;
    handleSMask(smask: Dict, resources: Dict, operatorList: OperatorList, task: WorkerTask, stateManager: StateManager<EvalState>, localColorSpaceCache: LocalColorSpaceCache): Promise<void>;
    handleTransferFunction(tr?: Obj): (Uint8Array | null)[] | null;
    handleTilingType(fn: OPS, color: Uint8ClampedArray | undefined, resources: Dict, pattern: BaseStream, patternDict: Dict, operatorList: OperatorList, task: WorkerTask, localTilingPatternCache: LocalTilingPatternCache): Promise<void>;
    handleSetFont(resources: Dict, fontArgs: FontArgs | undefined, fontRef: Ref | undefined, operatorList: OperatorList, task: WorkerTask, state: Partial<EvalState | TextState>, fallbackFontDict?: FontDict, cssFontInfo?: CssFontInfo): Promise<string>;
    handleText(chars: string, state: Partial<EvalState>): Glyph[];
    ensureStateFont(state: Partial<EvalState | TextState>): void;
    setGState({ resources, gState, operatorList, cacheKey, task, stateManager, localGStateCache, localColorSpaceCache, }: _SetGStateP): Promise<void>;
    loadFont(fontName: string | undefined, font: Ref | undefined, resources: Dict, fallbackFontDict?: FontDict, cssFontInfo?: CssFontInfo): Promise<TranslatedFont>;
    buildPath(operatorList: OperatorList, fn: OPS, args?: number[], parsingText?: boolean): void;
    parseColorSpace({ cs, resources, localColorSpaceCache, }: _ParseColorSpaceP): Promise<ColorSpace | undefined>;
    parseShading({ shading, resources, localColorSpaceCache, localShadingPatternCache, }: _ParseShadingP): string;
    handleColorN(operatorList: OperatorList, fn: OPS, args: [Name, ...number[]], cs: ColorSpace, patterns: Dict, resources: Dict, task: WorkerTask, localColorSpaceCache: LocalColorSpaceCache, localTilingPatternCache: LocalTilingPatternCache, localShadingPatternCache: Map<Dict | BaseStream, string>): Promise<void> | undefined;
    _parseVisibilityExpression(array: (Obj | undefined)[], nestingCounter: number, currentResult: VisibilityExpressionResult): void;
    parseMarkedContentProps(contentProperties: Dict | Name, resources: Dict | undefined): Promise<MarkedContentProps | undefined>;
    getOperatorList({ stream, task, resources, operatorList, initialState, fallbackFontDict, }: _GetOperatorListP): Promise<void>;
    getTextContent({ stream, task, resources, stateManager, combineTextItems, includeMarkedContent, sink, seenStyles, viewBox, }: _GetTextContentP): Promise<void>;
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
interface _TranslatedFontCtorP {
    loadedName: string;
    font: Font | ErrorFont;
    dict: FontDict | undefined;
    evaluatorOptions: EvaluatorOptions | undefined;
}
export declare class TranslatedFont {
    #private;
    loadedName: string;
    font: Font | ErrorFont;
    dict: FontDict | undefined;
    _evaluatorOptions: EvaluatorOptions | Readonly<{
        maxImageSize: -1;
        disableFontFace: false;
        ignoreErrors: false;
        isEvalSupported: true;
        fontExtraProperties: false;
        useSystemFonts: true;
        cMapUrl: undefined;
        standardFontDataUrl: undefined;
    }>;
    type3Loaded?: Promise<void>;
    type3Dependencies: Set<string> | undefined;
    sent: boolean;
    _bbox?: rect_t;
    constructor({ loadedName, font, dict, evaluatorOptions }: _TranslatedFontCtorP);
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
export declare type OpArgs = any[] | Uint8ClampedArray | null;
export interface Operation {
    fn: OPS;
    args: OpArgs;
}
export declare class EvaluatorPreprocessor {
    #private;
    static get opMap(): OpMap;
    static get MAX_INVALID_PATH_OPS(): number;
    parser: Parser;
    stateManager: StateManager<EvalState | TextState>;
    nonProcessedArgs: any[];
    _isPathOp: boolean;
    constructor(stream: BaseStream, xref?: XRef, stateManager?: StateManager<EvalState | TextState>);
    get savedStatesDepth(): number;
    read(operation: Operation): boolean;
    preprocessCommand(fn: OPS, args: OpArgs): void;
}
export {};
//# sourceMappingURL=evaluator.d.ts.map