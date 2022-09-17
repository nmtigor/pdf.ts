import { type TupleOf } from "../../../lib/alias.js";
import { HttpStatusCode } from "../../../lib/HttpStatusCode.js";
export declare const IDENTITY_MATRIX: matrix_t;
export declare const FONT_IDENTITY_MATRIX: matrix_t;
export declare const LINE_FACTOR = 1.35;
export declare const LINE_DESCENT_FACTOR = 0.35;
/**
 * Refer to the `WorkerTransport.getRenderingIntent`-method in the API, to see
 * how these flags are being used:
 *  - ANY, DISPLAY, and PRINT are the normal rendering intents, note the
 *    `PDFPageProxy.{render, getOperatorList, getAnnotations}`-methods.
 *  - ANNOTATIONS_FORMS, ANNOTATIONS_STORAGE, ANNOTATIONS_DISABLE control which
 *    annotations are rendered onto the canvas (i.e. by being included in the
 *    operatorList), note the `PDFPageProxy.{render, getOperatorList}`-methods
 *    and their `annotationMode`-option.
 *  - OPLIST is used with the `PDFPageProxy.getOperatorList`-method, note the
 *    `OperatorList`-constructor (on the worker-thread).
 */
export declare const enum RenderingIntentFlag {
    ANY = 1,
    DISPLAY = 2,
    PRINT = 4,
    ANNOTATIONS_FORMS = 16,
    ANNOTATIONS_STORAGE = 32,
    ANNOTATIONS_DISABLE = 64,
    OPLIST = 256
}
export declare const enum AnnotationMode {
    DISABLE = 0,
    ENABLE = 1,
    ENABLE_FORMS = 2,
    ENABLE_STORAGE = 3
}
export declare const AnnotationEditorPrefix = "pdfjs_internal_editor_";
export declare enum AnnotationEditorType {
    DISABLE = -1,
    NONE = 0,
    FREETEXT = 3,
    INK = 15
}
export declare const enum AnnotationEditorParamsType {
    FREETEXT_SIZE = 1,
    FREETEXT_COLOR = 2,
    FREETEXT_OPACITY = 3,
    INK_COLOR = 11,
    INK_THICKNESS = 12,
    INK_OPACITY = 13
}
export declare enum PermissionFlag {
    PRINT = 4,
    MODIFY_CONTENTS = 8,
    COPY = 16,
    MODIFY_ANNOTATIONS = 32,
    FILL_INTERACTIVE_FORMS = 256,
    COPY_FOR_ACCESSIBILITY = 512,
    ASSEMBLE = 1024,
    PRINT_HIGH_QUALITY = 2048
}
export declare const enum TextRenderingMode {
    FILL = 0,
    STROKE = 1,
    FILL_STROKE = 2,
    INVISIBLE = 3,
    FILL_ADD_TO_PATH = 4,
    STROKE_ADD_TO_PATH = 5,
    FILL_STROKE_ADD_TO_PATH = 6,
    ADD_TO_PATH = 7,
    FILL_STROKE_MASK = 3,
    ADD_TO_PATH_FLAG = 4
}
export declare const enum ImageKind {
    GRAYSCALE_1BPP = 1,
    RGB_24BPP = 2,
    RGBA_32BPP = 3
}
export declare const enum AnnotationType {
    TEXT = 1,
    LINK = 2,
    FREETEXT = 3,
    LINE = 4,
    SQUARE = 5,
    CIRCLE = 6,
    POLYGON = 7,
    POLYLINE = 8,
    HIGHLIGHT = 9,
    UNDERLINE = 10,
    SQUIGGLY = 11,
    STRIKEOUT = 12,
    STAMP = 13,
    CARET = 14,
    INK = 15,
    POPUP = 16,
    FILEATTACHMENT = 17,
    SOUND = 18,
    MOVIE = 19,
    WIDGET = 20,
    SCREEN = 21,
    PRINTERMARK = 22,
    TRAPNET = 23,
    WATERMARK = 24,
    THREED = 25,
    REDACT = 26
}
export declare const enum AnnotationReplyType {
    GROUP = "Group",
    REPLY = "R"
}
export declare const enum AnnotationFlag {
    INVISIBLE = 1,
    HIDDEN = 2,
    PRINT = 4,
    NOZOOM = 8,
    NOROTATE = 16,
    NOVIEW = 32,
    READONLY = 64,
    LOCKED = 128,
    TOGGLENOVIEW = 256,
    LOCKEDCONTENTS = 512
}
export declare const enum AnnotationFieldFlag {
    READONLY = 1,
    REQUIRED = 2,
    NOEXPORT = 4,
    MULTILINE = 4096,
    PASSWORD = 8192,
    NOTOGGLETOOFF = 16384,
    RADIO = 32768,
    PUSHBUTTON = 65536,
    COMBO = 131072,
    EDIT = 262144,
    SORT = 524288,
    FILESELECT = 1048576,
    MULTISELECT = 2097152,
    DONOTSPELLCHECK = 4194304,
    DONOTSCROLL = 8388608,
    COMB = 16777216,
    RICHTEXT = 33554432,
    RADIOSINUNISON = 33554432,
    COMMITONSELCHANGE = 67108864
}
/**
 * PDF 1.7 Table 166 S
 */
export declare const enum AnnotationBorderStyleType {
    SOLID = 1,
    DASHED = 2,
    BEVELED = 3,
    INSET = 4,
    UNDERLINE = 5
}
export declare const AnnotationActionEventType: {
    readonly E: "Mouse Enter";
    readonly X: "Mouse Exit";
    readonly D: "Mouse Down";
    readonly U: "Mouse Up";
    readonly Fo: "Focus";
    readonly Bl: "Blur";
    readonly PO: "PageOpen";
    readonly PC: "PageClose";
    readonly PV: "PageVisible";
    readonly PI: "PageInvisible";
    readonly K: "Keystroke";
    readonly F: "Format";
    readonly V: "Validate";
    readonly C: "Calculate";
};
export declare const DocumentActionEventType: {
    readonly WC: "WillClose";
    readonly WS: "WillSave";
    readonly DS: "DidSave";
    readonly WP: "WillPrint";
    readonly DP: "DidPrint";
};
export declare const PageActionEventType: {
    readonly O: "PageOpen";
    readonly C: "PageClose";
};
export declare type ActionEventTypeType = typeof AnnotationActionEventType | typeof DocumentActionEventType | typeof PageActionEventType;
export declare type ActionEventType = keyof typeof AnnotationActionEventType | keyof typeof DocumentActionEventType | keyof typeof PageActionEventType;
export declare type ActionEventName = (typeof AnnotationActionEventType)[keyof typeof AnnotationActionEventType] | (typeof DocumentActionEventType)[keyof typeof DocumentActionEventType] | (typeof PageActionEventType)[keyof typeof PageActionEventType] | "Action";
export declare enum StreamType {
    UNKNOWN = "UNKNOWN",
    FLATE = "FLATE",
    LZW = "LZW",
    DCT = "DCT",
    JPX = "JPX",
    JBIG = "JBIG",
    A85 = "A85",
    AHX = "AHX",
    CCF = "CCF",
    RLX = "RLX"
}
export declare enum FontType {
    UNKNOWN = "UNKNOWN",
    TYPE1 = "TYPE1",
    TYPE1STANDARD = "TYPE1STANDARD",
    TYPE1C = "TYPE1C",
    CIDFONTTYPE0 = "CIDFONTTYPE0",
    CIDFONTTYPE0C = "CIDFONTTYPE0C",
    TRUETYPE = "TRUETYPE",
    CIDFONTTYPE2 = "CIDFONTTYPE2",
    TYPE3 = "TYPE3",
    OPENTYPE = "OPENTYPE",
    TYPE0 = "TYPE0",
    MMTYPE1 = "MMTYPE1"
}
export declare const enum VerbosityLevel {
    ERRORS = 0,
    WARNINGS = 1,
    INFOS = 5
}
export declare const enum CMapCompressionType {
    NONE = 0,
    BINARY = 1,
    STREAM = 2
}
export declare enum OPS {
    dependency = 1,
    setLineWidth = 2,
    setLineCap = 3,
    setLineJoin = 4,
    setMiterLimit = 5,
    setDash = 6,
    setRenderingIntent = 7,
    setFlatness = 8,
    setGState = 9,
    save = 10,
    restore = 11,
    transform = 12,
    moveTo = 13,
    lineTo = 14,
    curveTo = 15,
    curveTo2 = 16,
    curveTo3 = 17,
    closePath = 18,
    rectangle = 19,
    stroke = 20,
    closeStroke = 21,
    fill = 22,
    eoFill = 23,
    fillStroke = 24,
    eoFillStroke = 25,
    closeFillStroke = 26,
    closeEOFillStroke = 27,
    endPath = 28,
    clip = 29,
    eoClip = 30,
    beginText = 31,
    endText = 32,
    setCharSpacing = 33,
    setWordSpacing = 34,
    setHScale = 35,
    setLeading = 36,
    setFont = 37,
    setTextRenderingMode = 38,
    setTextRise = 39,
    moveText = 40,
    setLeadingMoveText = 41,
    setTextMatrix = 42,
    nextLine = 43,
    showText = 44,
    showSpacedText = 45,
    nextLineShowText = 46,
    nextLineSetSpacingShowText = 47,
    setCharWidth = 48,
    setCharWidthAndBounds = 49,
    setStrokeColorSpace = 50,
    setFillColorSpace = 51,
    setStrokeColor = 52,
    setStrokeColorN = 53,
    setFillColor = 54,
    setFillColorN = 55,
    setStrokeGray = 56,
    setFillGray = 57,
    setStrokeRGBColor = 58,
    setFillRGBColor = 59,
    setStrokeCMYKColor = 60,
    setFillCMYKColor = 61,
    shadingFill = 62,
    beginInlineImage = 63,
    beginImageData = 64,
    endInlineImage = 65,
    paintXObject = 66,
    markPoint = 67,
    markPointProps = 68,
    beginMarkedContent = 69,
    beginMarkedContentProps = 70,
    endMarkedContent = 71,
    beginCompat = 72,
    endCompat = 73,
    paintFormXObjectBegin = 74,
    paintFormXObjectEnd = 75,
    beginGroup = 76,
    endGroup = 77,
    /** @deprecated unused */
    beginAnnotations = 78,
    /** @deprecated unused */
    endAnnotations = 79,
    beginAnnotation = 80,
    endAnnotation = 81,
    /** @deprecated unused */
    paintJpegXObject = 82,
    paintImageMaskXObject = 83,
    paintImageMaskXObjectGroup = 84,
    paintImageXObject = 85,
    paintInlineImageXObject = 86,
    paintInlineImageXObjectGroup = 87,
    paintImageXObjectRepeat = 88,
    paintImageMaskXObjectRepeat = 89,
    paintSolidColorImageMask = 90,
    constructPath = 91,
    group = 92
}
export declare type OPSName = keyof typeof OPS;
export declare const enum UNSUPPORTED_FEATURES {
    /** @deprecated unused */
    unknown = "unknown",
    forms = "forms",
    javaScript = "javaScript",
    signatures = "signatures",
    smask = "smask",
    shadingPattern = "shadingPattern",
    /** @deprecated unused */
    font = "font",
    errorTilingPattern = "errorTilingPattern",
    errorExtGState = "errorExtGState",
    errorXObject = "errorXObject",
    errorFontLoadType3 = "errorFontLoadType3",
    errorFontState = "errorFontState",
    errorFontMissing = "errorFontMissing",
    errorFontTranslate = "errorFontTranslate",
    errorColorSpace = "errorColorSpace",
    errorOperatorList = "errorOperatorList",
    errorFontToUnicode = "errorFontToUnicode",
    errorFontLoadNative = "errorFontLoadNative",
    errorFontBuildPath = "errorFontBuildPath",
    errorFontGetPath = "errorFontGetPath",
    errorMarkedContent = "errorMarkedContent",
    errorContentSubStream = "errorContentSubStream"
}
export declare const enum PasswordResponses {
    NEED_PASSWORD = 1,
    INCORRECT_PASSWORD = 2
}
export declare function setVerbosityLevel(level: VerbosityLevel): void;
export declare function getVerbosityLevel(): VerbosityLevel;
/**
 * A notice for devs. These are good for things that are helpful to devs, such
 * as warning that Workers were disabled, which is important to devs but not
 * end users.
 */
export declare function info(msg: string): void;
/**
 * Non-fatal warnings.
 */
export declare function warn(msg: string, meta?: {
    url: string;
}): void;
interface _CreateValidAbsoluteUrlP {
    addDefaultProtocol?: boolean;
    tryConvertEncoding: boolean;
}
/**
 * Attempts to create a valid absolute URL.
 *
 * @param url An absolute, or relative, URL.
 * @param baseUrl An absolute URL.
 * @return Either a valid {URL}, or `null` otherwise.
 */
export declare function createValidAbsoluteUrl(url: URL | string, baseUrl?: URL | string | undefined, options?: _CreateValidAbsoluteUrlP): URL | null;
export declare function shadow<T>(obj: any, prop: string | symbol, value: T): T;
export declare abstract class BaseException extends Error {
    constructor(message: string | undefined, name: string);
}
export declare class PasswordException extends BaseException {
    code: number;
    constructor(msg: string, code: number);
}
export declare class UnknownErrorException extends BaseException {
    details?: string | undefined;
    constructor(msg: string, details?: string | undefined);
}
export declare class InvalidPDFException extends BaseException {
    constructor(msg: string);
}
export declare class MissingPDFException extends BaseException {
    constructor(msg: string);
}
export declare class UnexpectedResponseException extends BaseException {
    status: HttpStatusCode;
    constructor(msg: string, status: HttpStatusCode);
}
/**
 * Error caused during parsing PDF data.
 */
export declare class FormatError extends BaseException {
    constructor(msg: string);
}
/**
 * Error used to indicate task cancellation.
 */
export declare class AbortException extends BaseException {
    constructor(msg: string);
}
export declare function bytesToString(bytes: Uint8Array | Uint8ClampedArray): string;
export declare function stringToBytes(str: string): Uint8Array;
/**
 * Gets length of the array (Array, Uint8Array, or string) in bytes.
 */
export declare function arrayByteLength(arr: any[] | Uint8Array | string | ArrayBufferLike): number;
/**
 * Combines array items (arrays) into single Uint8Array object.
 * @param arr the array of the arrays (Array, Uint8Array, or string).
 */
export declare function arraysToBytes(arr: (any[] | Uint8Array | string | ArrayBufferLike)[]): Uint8Array;
export declare function string32(value: number): string;
export declare function objectSize(obj: {}): number;
export declare function objectFromMap<K extends string | number, V>(map: Iterable<readonly [K, V]>): Record<K, V>;
export declare class FeatureTest {
    static get isLittleEndian(): boolean;
    static get isEvalSupported(): boolean;
    static get isOffscreenCanvasSupported(): boolean;
}
export declare type point_t = [number, number];
export declare type point3d_t = [number, number, number];
export declare type rect_t = TupleOf<number, 4>;
export declare type matrix_t = TupleOf<number, 6>;
export declare type matrix3d_t = TupleOf<number, 9>;
export declare class Util {
    static makeHexColor(r: number, g: number, b: number): string;
    static scaleMinMax(transform: matrix_t, minMax: rect_t): void;
    static transform(m1: matrix_t, m2: matrix_t): matrix_t;
    static applyTransform(p: point_t | rect_t, m: matrix_t): point_t;
    static applyInverseTransform(p: point_t, m: matrix_t): point_t;
    static getAxialAlignedBoundingBox(r: rect_t, m: matrix_t): rect_t;
    static inverseTransform(m: matrix_t): matrix_t;
    static apply3dTransform(m: matrix3d_t, v: point3d_t): number[];
    static singularValueDecompose2dScale(m: matrix_t): number[];
    static normalizeRect(rect: rect_t): [number, number, number, number];
    static intersect(rect1: rect_t, rect2: rect_t): rect_t | undefined;
    static bezierBoundingBox(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): rect_t;
}
export declare function stringToPDFString(str: string): string;
export declare function escapeString(str: string): string;
export declare function isAscii(str: string): boolean;
export declare function stringToUTF16BEString(str: string): string;
export declare function stringToUTF8String(str: string): string;
export declare function utf8StringToString(str: string): string;
export declare function isArrayBuffer(v: any): boolean;
export declare function getModificationDate(date?: Date): string;
export {};
//# sourceMappingURL=util.d.ts.map