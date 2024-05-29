/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/pattern.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { C2D, dot2d_t, rect_t, TupleOf } from "../../../lib/alias.js";
import { TilingPaintType, TilingType } from "../display/pattern_helper.js";
import type { matrix_t } from "../shared/util.js";
import { BaseStream } from "./base_stream.js";
import { ColorSpace } from "./colorspace.js";
import type { ParsedFunction, PDFFunctionFactory } from "./function.js";
import type { LocalColorSpaceCache } from "./image_utils.js";
import type { OpListIR } from "./operator_list.js";
import type { Dict } from "./primitives.js";
import type { XRef } from "./xref.js";
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
    abstract getPattern(ctx: C2D): unknown;
    static parseShading(shading: Dict | BaseStream, xref: XRef, res: Dict, pdfFunctionFactory: PDFFunctionFactory, localColorSpaceCache: LocalColorSpaceCache): RadialAxialShading | MeshShading | DummyShading;
}
declare abstract class BaseShading {
    /**
     * A small number to offset the first/last color stops so we can insert ones
     * to support extend. Number.MIN_VALUE is too small and breaks the extend.
     */
    static readonly SMALL_NUMBER = 0.000001;
    abstract getIR(): ShadingPatternIR;
}
export type RadialAxialIR = [
    "RadialAxial",
    ...[
        type: ShadingType.AXIAL | ShadingType.RADIAL,
        bbox: rect_t | undefined,
        colorStops: [number, string][],
        p0: dot2d_t,
        p1: dot2d_t,
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
export type MeshIR = [
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
export type DummyIR = ["Dummy"];
export type ShadingPatternIR = RadialAxialIR | MeshIR | DummyIR;
export type TilingPatternIR = [
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
export type PatternIR = ShadingPatternIR | TilingPatternIR;
/**
 * Radial and axial shading have very similar implementations
 * If needed, the implementations can be broken into two classes.
 */
declare class RadialAxialShading extends BaseShading {
    coordsArr: TupleOf<number, 4 | 6>;
    shadingType: ShadingType;
    bbox: [number, number, number, number] | undefined;
    extendStart: boolean;
    extendEnd: boolean;
    colorStops: [number, string][];
    constructor(dict: Dict, xref: XRef, resources: Dict, pdfFunctionFactory: PDFFunctionFactory, localColorSpaceCache: LocalColorSpaceCache);
    /** @implement */
    getIR(): ["RadialAxial", type: ShadingType.AXIAL | ShadingType.RADIAL, bbox: [number, number, number, number] | undefined, colorStops: [number, string][], p0: dot2d_t, p1: dot2d_t, r0: number, r1: number];
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
    readCoordinate(): dot2d_t;
    readComponents(): Uint8ClampedArray;
}
export declare function clearPatternCaches(): void;
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
    static readonly MIN_SPLIT_PATCH_CHUNKS_AMOUNT = 3;
    static readonly MAX_SPLIT_PATCH_CHUNKS_AMOUNT = 20;
    /**
     * Count of triangles per entire mesh bounds.
     */
    static readonly TRIANGLE_DENSITY = 20;
    shadingType: ShadingType;
    bbox: rect_t | undefined;
    cs: ColorSpace;
    background: Uint8ClampedArray | undefined;
    coords: dot2d_t[];
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
    getIR(): ["Mesh", shadingType: ShadingType, coords: Float32Array, colors: Uint8Array, figures: MeshFigure[], bounds: [number, number, number, number], bbox: [number, number, number, number] | undefined, background: Uint8ClampedArray | undefined];
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