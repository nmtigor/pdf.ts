/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2023
 *
 * @module pdf/pdf.ts-src/display/editor/outliner.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { rect_t } from "../../../../lib/alias.js";
import type { Box, Dot } from "../../alias.js";
export interface Outlines extends Array<number[]> {
    points?: (number[] | Float64Array)[];
    outline: number[] | Float64Array;
}
export declare class Outliner {
    #private;
    /**
     * Construct an outliner.
     * @param boxes An array of axis-aligned rectangles.
     * @param borderWidth The width of the border of the boxes, it
     *   allows to make the boxes bigger (or smaller).
     * @param innerMargin The margin between the boxes and the
     *   outlines. It's important to not have a null innerMargin when we want to
     *   draw the outline else the stroked outline could be clipped because of its
     *   width.
     * @param isLTR true if we're in LTR mode. It's used to determine
     *   the last point of the boxes.
     */
    constructor(boxes: Box[], borderWidth?: number, innerMargin?: number, isLTR?: boolean);
    getOutlines(): HighlightOutline;
}
export declare abstract class Outline {
    /**
     * @return The SVG path of the outline.
     */
    abstract toSVGPath(): string;
    /**
     * The bounding box of the outline.
     */
    abstract get box(): Box | undefined;
    /**
     * Serialize the outlines into the PDF page coordinate system.
     * @param _bbox the bounding box of the annotation.
     * @param _rotation the rotation of the annotation.
     */
    abstract serialize(_bbox: rect_t, _rotation: number): Outlines;
    get free(): boolean;
    abstract getNewOutline(thickness: number, innerMargin?: number): Outline;
}
export declare class HighlightOutline extends Outline {
    #private;
    constructor(outlines: number[][], box: Box);
    /** @implement */
    toSVGPath(): string;
    /** @implement */
    serialize([blX, blY, trX, trY]: rect_t, _rotation: number): Outlines;
    /** @implement */
    get box(): Box;
    /** @implement */
    getNewOutline(thickness: number, innerMargin?: number): HighlightOutline;
}
export declare class FreeOutliner {
    #private;
    constructor({ x, y }: Dot, box: rect_t, scaleFactor: number, thickness: number, isLTR: boolean, innerMargin?: number);
    get free(): boolean;
    isEmpty(): boolean;
    add({ x, y }: Dot): boolean;
    /** @implement */
    toSVGPath(): string;
    getOutlines(): FreeHighlightOutline;
}
export declare class FreeHighlightOutline extends Outline {
    #private;
    constructor(outline: Float64Array, points: Float64Array, box: rect_t, scaleFactor: number, innerMargin: number, isLTR: boolean);
    toSVGPath(): string;
    /** @implement */
    serialize([blX, blY, trX, trY]: rect_t, rotation: number): Outlines;
    /** @implement */
    get box(): Box | undefined;
    /** @implement */
    getNewOutline(thickness: number, innerMargin?: number): FreeHighlightOutline;
}
//# sourceMappingURL=outliner.d.ts.map