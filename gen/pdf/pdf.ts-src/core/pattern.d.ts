import { TilingPaintType, TilingType } from "../display/pattern_helper.js";
import { MessageHandler, Thread } from "../shared/message_handler.js";
import { type matrix_t, type point_t, type rect_t } from "../shared/util.js";
import { BaseStream } from "./base_stream.js";
import { ColorSpace } from "./colorspace.js";
import { type ParsedFunction, PDFFunctionFactory } from "./function.js";
import { LocalColorSpaceCache } from "./image_utils.js";
import { type OpListIR } from "./operator_list.js";
import { Dict } from "./primitives.js";
import { XRef } from "./xref.js";
export declare const enum ShadingType {
    FUNCTION_BASED = 1,
    AXIAL = 2,
    RADIAL = 3,
    FREE_FORM_MESH = 4,
    LATTICE_FORM_MESH = 5,
    COONS_PATCH_MESH = 6,
    TENSOR_PATCH_MESH = 7
}
export declare abstract class Pattern {
    abstract getPattern(ctx: CanvasRenderingContext2D): unknown;
    static parseShading(shading: Dict | BaseStream, xref: XRef, res: Dict, handler: MessageHandler<Thread.worker>, pdfFunctionFactory: PDFFunctionFactory, localColorSpaceCache: LocalColorSpaceCache): RadialAxialShading | MeshShading | DummyShading;
}
declare abstract class BaseShading {
    /**
     * A small number to offset the first/last color stops so we can insert ones
     * to support extend. Number.MIN_VALUE is too small and breaks the extend.
     */
    static get SMALL_NUMBER(): number;
    abstract getIR(): ShadingPatternIR;
}
export declare type RadialAxialIR = [
    "RadialAxial",
    ...[
        type: ShadingType.AXIAL | ShadingType.RADIAL,
        bbox: rect_t | undefined,
        colorStops: [number, string][],
        p0: point_t,
        p1: point_t,
        r0: number,
        r1: number
    ]
];
export interface MeshFigure {
    type: "triangles" | "lattice" | "patch";
    coords: Int32Array;
    colors: Int32Array;
    verticesPerRow?: number;
}
export declare type MeshIR = [
    "Mesh",
    ...[
        shadingType: ShadingType,
        coords: Float32Array,
        colors: Uint8Array,
        figures: MeshFigure[],
        bounds: rect_t,
        bbox: rect_t | undefined,
        background: Uint8ClampedArray | undefined
    ]
];
export declare type DummyIR = ["Dummy"];
export declare type ShadingPatternIR = RadialAxialIR | MeshIR | DummyIR;
export declare type TilingPatternIR = [
    "TilingPattern",
    ...[
        color: Uint8ClampedArray | undefined,
        operatorList: OpListIR,
        matrix: matrix_t | undefined,
        bbox: rect_t,
        xstep: number,
        ystep: number,
        paintType: TilingPaintType,
        tilingType: TilingType
    ]
];
export declare type PatternIR = ShadingPatternIR | TilingPatternIR;
/**
 * Radial and axial shading have very similar implementations
 * If needed, the implementations can be broken into two classes.
 */
declare class RadialAxialShading extends BaseShading {
    coordsArr: [number, number, number, number] | [number, number, number, number, number, number];
    shadingType: ShadingType;
    bbox: [number, number, number, number] | undefined;
    extendStart: boolean;
    extendEnd: boolean;
    colorStops: [number, string][];
    constructor(dict: Dict, xref: XRef, resources: Dict, pdfFunctionFactory: PDFFunctionFactory, localColorSpaceCache: LocalColorSpaceCache);
    /** @implement */
    getIR(): ["RadialAxial", ShadingType.AXIAL | ShadingType.RADIAL, [number, number, number, number] | undefined, [number, string][], point_t, point_t, number, number];
}
/**
 * All mesh shadings. For now, they will be presented as set of the triangles
 * to be drawn on the canvas and rgb color for each vertex.
 */
declare class MeshStreamReader {
    stream: BaseStream;
    context: DecodeContext;
    buffer: number;
    bufferLength: number;
    tmpCompsBuf: Float32Array;
    tmpCsCompsBuf: Float32Array;
    constructor(stream: BaseStream, context: DecodeContext);
    get hasData(): boolean;
    readBits(n: number): number;
    align(): void;
    readFlag(): number;
    readCoordinate(): point_t;
    readComponents(): Uint8ClampedArray;
}
interface DecodeContext {
    bitsPerCoordinate: number;
    bitsPerComponent: number;
    bitsPerFlag: number;
    decode: number[];
    colorFn?: ParsedFunction;
    colorSpace: ColorSpace;
    numComps: number;
}
export declare class MeshShading extends BaseShading {
    static get MIN_SPLIT_PATCH_CHUNKS_AMOUNT(): number;
    static get MAX_SPLIT_PATCH_CHUNKS_AMOUNT(): number;
    /**
     * Count of triangles per entire mesh bounds.
     */
    static get TRIANGLE_DENSITY(): number;
    shadingType: ShadingType;
    bbox: rect_t | undefined;
    cs: ColorSpace;
    background: Uint8ClampedArray | undefined;
    coords: point_t[];
    colors: (Uint8Array | Uint8ClampedArray)[];
    figures: MeshFigure[];
    bounds?: rect_t;
    constructor(stream: BaseStream, xref: XRef, resources: Dict, pdfFunctionFactory: PDFFunctionFactory, localColorSpaceCache: LocalColorSpaceCache);
    _decodeType4Shading(reader: MeshStreamReader): void;
    _decodeType5Shading(reader: MeshStreamReader, verticesPerRow: number): void;
    _decodeType6Shading(reader: MeshStreamReader): void;
    _decodeType7Shading(reader: MeshStreamReader): void;
    _buildFigureFromPatch(index: number): void;
    _updateBounds(): void;
    _packData(): void;
    /** @implement */
    getIR(): ["Mesh", ShadingType, Float32Array, Uint8Array, MeshFigure[], [number, number, number, number], [number, number, number, number] | undefined, Uint8ClampedArray | undefined];
}
declare class DummyShading extends BaseShading {
    type: string;
    /** @implement */
    getIR(): DummyIR;
}
/**
 * Table 75
 */
export declare function getTilingPatternIR(operatorList: OpListIR, dict: Dict, color?: Uint8ClampedArray): TilingPatternIR;
export {};
//# sourceMappingURL=pattern.d.ts.map