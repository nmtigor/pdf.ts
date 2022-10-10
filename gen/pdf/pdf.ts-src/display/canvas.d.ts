import { PageColors } from "../../pdf.ts-web/pdf_viewer.js";
import { Stepper } from "../../pdf.ts-web/debugger.js";
import { type ImgData, type MarkedContentProps, type SmaskOptions } from "../core/evaluator.js";
import { Glyph } from "../core/fonts.js";
import { type OpListIR } from "../core/operator_list.js";
import { type PatternIR, ShadingType } from "../core/pattern.js";
import { type matrix_t, OPS, point_t, type rect_t, TextRenderingMode } from "../shared/util.js";
import { PDFCommonObjs, PDFObjects, PDFObjs } from "./api.js";
import { BaseCanvasFactory, type CanvasEntry } from "./base_factory.js";
import { PageViewport } from "./display_utils.js";
import { type AddToPath, FontFaceObject } from "./font_loader.js";
import { OptionalContentConfig } from "./optional_content_config.js";
import { PathType, type ShadingPattern, TilingPattern } from "./pattern_helper.js";
declare type C2D = CanvasRenderingContext2D;
declare global {
    interface CanvasRenderingContext2D {
        _originalSave: C2D["save"];
        __originalSave: C2D["save"];
        _originalRestore: C2D["restore"];
        __originalRestore: C2D["restore"];
        _originalRotate: C2D["rotate"];
        __originalRotate: C2D["rotate"];
        _originalScale: C2D["scale"];
        __originalScale: C2D["scale"];
        _originalTranslate: C2D["translate"];
        __originalTranslate: C2D["translate"];
        _originalTransform: C2D["transform"];
        __originalTransform: C2D["transform"];
        _originalSetTransform: C2D["setTransform"];
        __originalSetTransform: C2D["setTransform"];
        _originalResetTransform: C2D["resetTransform"];
        __originalResetTransform: C2D["resetTransform"];
        __originalClip: C2D["clip"];
        __originalMoveTo: C2D["moveTo"];
        __originalLineTo: C2D["lineTo"];
        __originalBezierCurveTo: C2D["bezierCurveTo"];
        __originalRect: C2D["rect"];
        __originalClosePath: C2D["closePath"];
        __originalBeginPath: C2D["beginPath"];
        _removeMirroring?: () => void;
        _transformMatrix: matrix_t;
        _transformStack: matrix_t[];
        _setLineWidth: (value: number) => void;
        _getLineWidth: () => number;
        mozCurrentTransform: matrix_t;
        mozCurrentTransformInverse: matrix_t;
    }
}
export declare class CachedCanvases {
    canvasFactory: BaseCanvasFactory;
    cache: Record<string, CanvasEntry>;
    constructor(canvasFactory: BaseCanvasFactory);
    getCanvas(id: string, width: number, height: number): CanvasEntry;
    delete(id: string): void;
    clear(): void;
}
interface SMask {
    canvas: HTMLCanvasElement;
    context: C2D;
    offsetX: number;
    offsetY: number;
    scaleX: number;
    scaleY: number;
    subtype: string;
    backdrop?: number[] | Uint8ClampedArray | undefined;
    transferMap?: Uint8Array | undefined;
    startTransformInverse: matrix_t | undefined;
}
declare class CanvasExtraState {
    alphaIsShape: boolean;
    fontSize: number;
    fontSizeScale: number;
    textMatrix: [number, number, number, number, number, number];
    textMatrixScale: number;
    fontMatrix: [number, number, number, number, number, number];
    leading: number;
    x: number;
    y: number;
    lineX: number;
    lineY: number;
    charSpacing: number;
    wordSpacing: number;
    textHScale: number;
    textRenderingMode: TextRenderingMode;
    textRise: number;
    fillColor: string | CanvasGradient | CanvasPattern | ShadingPattern | TilingPattern;
    strokeColor: string | CanvasPattern | CanvasGradient | ShadingPattern | TilingPattern;
    patternFill: boolean;
    fillAlpha: number;
    strokeAlpha: number;
    lineWidth: number;
    activeSMask: SMask | undefined;
    transferMaps?: (Uint8Array | null)[] | undefined;
    clipBox: rect_t;
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    fontDirection?: -1 | 1;
    font?: FontFaceObject;
    constructor(width: number, height: number);
    clone(): any;
    setCurrentPoint(x: number, y: number): void;
    updatePathMinMax(transform: matrix_t, x: number, y: number): void;
    updateRectMinMax(transform: matrix_t, rect: rect_t): void;
    updateScalingPathMinMax(transform: matrix_t, minMax: rect_t): void;
    updateCurvePathMinMax(transform: matrix_t, x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, minMax: rect_t | undefined): void;
    getPathBoundingBox(pathType?: PathType, transform?: matrix_t): rect_t;
    updateClipFromPath(): void;
    isEmptyClip(): boolean;
    startNewPathAndClipBox(box: rect_t): void;
    getClippedPathBoundingBox(pathType?: PathType, transform?: matrix_t): [number, number, number, number] | undefined;
}
export interface GroupOptions {
    matrix: matrix_t | undefined;
    bbox: rect_t | undefined;
    smask: SmaskOptions | undefined;
    isolated: boolean;
    knockout: boolean;
}
declare const enum ClipType {
    NORMAL_CLIP = 0,
    EO_CLIP = 1
}
interface _BeginDrawingP {
    transform: matrix_t | undefined;
    viewport: PageViewport;
    transparency?: boolean;
    background: string | CanvasGradient | CanvasPattern | undefined;
}
interface PIImgXObjG_map {
    transform: matrix_t;
    x: number;
    y: number;
    w: number;
    h: number;
}
interface TextPath {
    transform: matrix_t;
    x: number;
    y: number;
    fontSize: number;
    addToPath: AddToPath;
}
export declare class CanvasGraphics {
    #private;
    ctx: CanvasRenderingContext2D;
    compositeCtx?: C2D;
    current: CanvasExtraState;
    stateStack: CanvasExtraState[];
    pendingClip: ClipType | undefined;
    pendingEOFill: boolean;
    res?: unknown;
    xobjs?: unknown;
    commonObjs: PDFObjects<PDFCommonObjs>;
    objs: PDFObjects<PDFObjs | undefined>;
    canvasFactory: BaseCanvasFactory;
    groupStack: C2D[];
    processingType3: Glyph | undefined;
    /**
     * Patterns are painted relative to the initial page/form transform, see pdf
     * spec 8.7.2 NOTE 1.
     */
    baseTransform?: matrix_t;
    baseTransformStack: (matrix_t | undefined)[];
    groupLevel: number;
    smaskStack: SMask[];
    smaskCounter: number;
    tempSMask: SMask | undefined;
    suspendedCtx: C2D | undefined;
    get inSMaskMode(): boolean;
    contentVisible: boolean;
    markedContentStack: {
        visible: boolean;
    }[];
    optionalContentConfig: OptionalContentConfig | undefined;
    cachedCanvases: CachedCanvases;
    cachedPatterns: Map<ShadingType, ShadingPattern>;
    annotationCanvas?: CanvasEntry;
    annotationCanvasMap: Map<string, HTMLCanvasElement> | undefined;
    viewportScale: number;
    outputScaleX: number;
    outputScaleY: number;
    backgroundColor: string | undefined;
    foregroundColor: string | undefined;
    transparentCanvas: HTMLCanvasElement | undefined;
    pendingTextPaths?: TextPath[];
    constructor(canvasCtx: C2D, commonObjs: PDFObjects<PDFCommonObjs>, objs: PDFObjects<PDFObjs | undefined>, canvasFactory: BaseCanvasFactory, optionalContentConfig?: OptionalContentConfig, annotationCanvasMap?: Map<string, HTMLCanvasElement>, pageColors?: PageColors);
    getObject<T extends PDFCommonObjs | PDFObjs>(data: any, fallback?: T | undefined): T | undefined;
    beginDrawing({ transform, viewport, transparency, background, }: _BeginDrawingP): void;
    executeOperatorList(operatorList: OpListIR, executionStartIdx?: number, continueCallback?: () => void, stepper?: Stepper): number;
    endDrawing(): void;
    _scaleImage(img: HTMLCanvasElement, inverseTransform: matrix_t): {
        img: HTMLCanvasElement;
        paintWidth: number;
        paintHeight: number;
    };
    _createMaskCanvas(img: ImgData): {
        canvas: HTMLCanvasElement;
        offsetX: number;
        offsetY: number;
    };
    [OPS.setLineWidth](width: number): void;
    [OPS.setLineCap](style: 0 | 1 | 2): void;
    [OPS.setLineJoin](style: 0 | 1 | 2): void;
    [OPS.setMiterLimit](limit: number): void;
    [OPS.setDash](dashArray: number[], dashPhase: number): void;
    [OPS.setRenderingIntent](intent: unknown): void;
    [OPS.setFlatness](flatness: number): void;
    [OPS.setGState](states: [string, unknown][]): void;
    checkSMaskState(): void;
    /**
     * Soft mask mode takes the current main drawing canvas and replaces it with
     * a temporary canvas. Any drawing operations that happen on the temporary
     * canvas need to be composed with the main canvas that was suspended (see
     * `compose()`). The temporary canvas also duplicates many of its operations
     * on the suspended canvas to keep them in sync, so that when the soft mask
     * mode ends any clipping paths or transformations will still be active and in
     * the right order on the canvas' graphics state stack.
     */
    beginSMaskMode(): void;
    endSMaskMode(): void;
    compose(dirtyBox?: rect_t): void;
    [OPS.save](): void;
    [OPS.restore](): void;
    [OPS.transform](a: number, b: number, c: number, d: number, e: number, f: number): void;
    [OPS.constructPath](ops: OPS[], args: number[], minMax: rect_t): void;
    [OPS.closePath](): void;
    [OPS.stroke](consumePath?: boolean): void;
    [OPS.closeStroke](): void;
    [OPS.fill](consumePath?: boolean): void;
    [OPS.eoFill](): void;
    [OPS.fillStroke](): void;
    [OPS.eoFillStroke](): void;
    [OPS.closeFillStroke](): void;
    [OPS.closeEOFillStroke](): void;
    [OPS.endPath](): void;
    [OPS.clip](): void;
    [OPS.eoClip](): void;
    [OPS.beginText](): void;
    [OPS.endText](): void;
    [OPS.setCharSpacing](spacing: number): void;
    [OPS.setWordSpacing](spacing: number): void;
    [OPS.setHScale](scale: number): void;
    [OPS.setLeading](leading: number): void;
    [OPS.setFont](fontRefName: string, size: number): void;
    [OPS.setTextRenderingMode](mode: TextRenderingMode): void;
    [OPS.setTextRise](rise: number): void;
    [OPS.moveText](x: number, y: number): void;
    [OPS.setLeadingMoveText](x: number, y: number): void;
    [OPS.setTextMatrix](a: number, b: number, c: number, d: number, e: number, f: number): void;
    [OPS.nextLine](): void;
    paintChar(character: string, x: number, y: number, patternTransform: matrix_t): void;
    get isFontSubpixelAAEnabled(): boolean;
    [OPS.showText](glyphs: (Glyph | number)[]): void;
    showType3Text(glyphs: (Glyph | number)[]): void;
    [OPS.setCharWidth](xWidth: number, yWidth: number): void;
    [OPS.setCharWidthAndBounds](xWidth: number, yWidth: number, llx: number, lly: number, urx: number, ury: number): void;
    getColorN_Pattern(IR: PatternIR): ShadingPattern | TilingPattern;
    [OPS.setStrokeColorN](...IR: any[]): void;
    [OPS.setFillColorN](...IR: any[]): void;
    [OPS.setStrokeRGBColor](r: number, g: number, b: number): void;
    [OPS.setFillRGBColor](r: number, g: number, b: number): void;
    _getPattern(objId: ShadingType, matrix?: unknown): ShadingPattern;
    [OPS.shadingFill](objId: ShadingType): void;
    [OPS.beginInlineImage](): void;
    [OPS.beginImageData](): void;
    [OPS.paintFormXObjectBegin](matrix: matrix_t, bbox?: rect_t): void;
    [OPS.paintFormXObjectEnd](): void;
    [OPS.beginGroup](group: GroupOptions): void;
    [OPS.endGroup](group: GroupOptions): void;
    [OPS.beginAnnotation](id: string, rect: rect_t, transform: matrix_t, matrix: matrix_t, hasOwnCanvas: boolean): void;
    [OPS.endAnnotation](): void;
    [OPS.paintImageMaskXObject](img: ImgData): void;
    [OPS.paintImageMaskXObjectRepeat](img: ImgData, scaleX: number, skewX: number | undefined, skewY: number | undefined, scaleY: number, positions: Float32Array): void;
    [OPS.paintImageMaskXObjectGroup](images: ImgData[]): void;
    [OPS.paintImageXObject](objId: string): void;
    [OPS.paintImageXObjectRepeat](objId: string, scaleX: number, scaleY: number, positions: number[]): void;
    [OPS.paintInlineImageXObject](imgData: ImgData | HTMLCanvasElement): void;
    [OPS.paintInlineImageXObjectGroup](imgData: ImgData, map: PIImgXObjG_map[]): void;
    [OPS.paintSolidColorImageMask](): void;
    [OPS.markPoint](tag: string): void;
    [OPS.markPointProps](tag: string, properties: unknown): void;
    [OPS.beginMarkedContent](tag: string): void;
    [OPS.beginMarkedContentProps](tag: string, properties?: MarkedContentProps): void;
    [OPS.endMarkedContent](): void;
    [OPS.beginCompat](): void;
    [OPS.endCompat](): void;
    consumePath(clipBox?: rect_t): void;
    getSinglePixelWidth(): number;
    getScaleForStroking(): point_t;
    rescaleAndStroke(saveRestore: boolean): void;
    isContentVisible(): boolean;
}
export interface CanvasGraphics {
    [fnId: number]: (...args: any[]) => void;
    selectColor?: (r: number, g: number, b: number) => string;
}
export {};
//# sourceMappingURL=canvas.d.ts.map