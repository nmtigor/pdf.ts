import { type OpListIR } from "../core/operator_list.js";
import { type RadialAxialIR, type ShadingPatternIR, ShadingType, type TilingPatternIR } from "../core/pattern.js";
import { type matrix_t } from "../shared/util.js";
import { CanvasGraphics } from "./canvas.js";
export declare const enum PathType {
    FILL = "Fill",
    STROKE = "Stroke",
    SHADING = "Shading"
}
export interface STPattern {
    getPattern(ctx: CanvasRenderingContext2D, owner: CanvasGraphics, inverse: matrix_t, pathType: PathType): CanvasPattern | CanvasGradient | string | null;
}
export interface ShadingPattern extends STPattern {
}
interface RadialAxialPattern extends ShadingPattern {
    getPattern(ctx: CanvasRenderingContext2D, owner: CanvasGraphics, inverse: matrix_t, pathType: PathType): CanvasPattern | CanvasGradient | null;
}
export declare class RadialAxialShadingPattern implements RadialAxialPattern {
    _type: ShadingType.AXIAL | ShadingType.RADIAL;
    _bbox: [number, number, number, number] | undefined;
    _colorStops: [number, string][];
    _p0: import("../../../lib/alias.js").point_t;
    _p1: import("../../../lib/alias.js").point_t;
    _r0: number;
    _r1: number;
    matrix: matrix_t | undefined;
    constructor(IR: RadialAxialIR);
    _createGradient(ctx: CanvasRenderingContext2D): CanvasGradient | null;
    /** @implement */
    getPattern(ctx: CanvasRenderingContext2D, owner: CanvasGraphics, inverse: matrix_t, pathType: PathType): CanvasGradient | CanvasPattern | null;
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
declare namespace NsTilingPattern {
    const enum PaintType {
        COLORED = 1,
        UNCOLORED = 2
    }
    const enum TilingType {
        ConstantSpacing = 1,
        NoDistortion = 2,
        ConstantSpacingFasterTiling = 3
    }
    class TilingPattern implements STPattern {
        operatorList: OpListIR;
        matrix: matrix_t;
        bbox: [number, number, number, number];
        xstep: number;
        ystep: number;
        paintType: PaintType;
        tilingType: TilingType;
        color: Uint8ClampedArray | undefined;
        ctx: CanvasRenderingContext2D;
        canvasGraphicsFactory: {
            createCanvasGraphics: (ctx: CanvasRenderingContext2D) => CanvasGraphics;
        };
        baseTransform: [number, number, number, number, number, number];
        constructor(IR: TilingPatternIR, color: Uint8ClampedArray | undefined, ctx: CanvasRenderingContext2D, canvasGraphicsFactory: {
            createCanvasGraphics: (ctx: CanvasRenderingContext2D) => CanvasGraphics;
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
        setFillAndStrokeStyleToContext(graphics: CanvasGraphics, paintType: PaintType, color?: Uint8ClampedArray): void;
        getPattern(ctx: CanvasRenderingContext2D, owner: CanvasGraphics, inverse: matrix_t, pathType: PathType): CanvasPattern | null;
    }
}
export import TilingPattern = NsTilingPattern.TilingPattern;
export import TilingPaintType = NsTilingPattern.PaintType;
export import TilingType = NsTilingPattern.TilingType;
export {};
//# sourceMappingURL=pattern_helper.d.ts.map