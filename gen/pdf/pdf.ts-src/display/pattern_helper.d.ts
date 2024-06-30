/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/display/pattern_helper.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { C2D } from "../../../lib/alias.js";
import type { OpListIR } from "../core/operator_list.js";
import type { RadialAxialIR, ShadingPatternIR, TilingPatternIR } from "../core/pattern.js";
import { ShadingType } from "../core/pattern.js";
import { type matrix_t } from "../shared/util.js";
import type { CanvasGraphics } from "./canvas.js";
export declare const enum PathType {
    FILL = "Fill",
    STROKE = "Stroke",
    SHADING = "Shading"
}
export interface STPattern {
    getPattern(ctx: C2D, owner: CanvasGraphics, inverse: matrix_t, pathType: PathType): CanvasPattern | CanvasGradient | string | null;
}
export interface ShadingPattern extends STPattern {
}
interface RadialAxialPattern extends ShadingPattern {
    getPattern(ctx: C2D, owner: CanvasGraphics, inverse: matrix_t, pathType: PathType): CanvasPattern | CanvasGradient | null;
}
export declare class RadialAxialShadingPattern implements RadialAxialPattern {
    _type: ShadingType.AXIAL | ShadingType.RADIAL;
    _bbox: [number, number, number, number] | undefined;
    _colorStops: [number, string][];
    _p0: import("../../../lib/alias.js").dot2d_t;
    _p1: import("../../../lib/alias.js").dot2d_t;
    _r0: number;
    _r1: number;
    matrix: matrix_t | undefined;
    constructor(IR: RadialAxialIR);
    _createGradient(ctx: C2D): CanvasGradient | null;
    /** @implement */
    getPattern(ctx: C2D, owner: CanvasGraphics, inverse: matrix_t, pathType: PathType): CanvasGradient | CanvasPattern | null;
}
export interface MeshCanvasContext {
    coords: Float32Array;
    colors: Uint8Array;
    offsetX: number;
    offsetY: number;
    scaleX: number;
    scaleY: number;
}
export declare function getShadingPattern(IR: ShadingPatternIR): ShadingPattern;
export declare const enum TilingPaintType {
    COLORED = 1,
    UNCOLORED = 2
}
export declare const enum TilingType {
    ConstantSpacing = 1,
    NoDistortion = 2,
    ConstantSpacingFasterTiling = 3
}
export declare class TilingPattern implements STPattern {
    /**
     * 10in @ 300dpi shall be enough.
     */
    static readonly MAX_PATTERN_SIZE = 3000;
    operatorList: OpListIR;
    matrix: [number, number, number, number, number, number] | undefined;
    bbox: [number, number, number, number];
    xstep: number;
    ystep: number;
    paintType: TilingPaintType;
    tilingType: TilingType;
    color: Uint8ClampedArray | undefined;
    ctx: CanvasRenderingContext2D;
    canvasGraphicsFactory: {
        createCanvasGraphics: (ctx: C2D) => CanvasGraphics;
    };
    baseTransform: [number, number, number, number, number, number];
    constructor(IR: TilingPatternIR, color: Uint8ClampedArray | undefined, ctx: C2D, canvasGraphicsFactory: {
        createCanvasGraphics: (ctx: C2D) => CanvasGraphics;
    }, baseTransform: matrix_t);
    createPatternCanvas(owner: CanvasGraphics): {
        canvas: HTMLCanvasElement;
        scaleX: number;
        scaleY: number;
        offsetX: number;
        offsetY: number;
    };
    getSizeAndScale(step: number, realOutputSize: number, scale: number): {
        scale: number;
        size: number;
    };
    clipBbox(graphics: CanvasGraphics, x0: number, y0: number, x1: number, y1: number): void;
    setFillAndStrokeStyleToContext(graphics: CanvasGraphics, paintType: TilingPaintType, color?: Uint8ClampedArray): void;
    getPattern(ctx: C2D, owner: CanvasGraphics, inverse: matrix_t, pathType: PathType): CanvasPattern | null;
}
export {};
//# sourceMappingURL=pattern_helper.d.ts.map