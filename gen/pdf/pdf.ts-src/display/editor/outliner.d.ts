import type { Box, Outlines } from "../../alias.js";
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
    getOutlines(): Outlines;
}
//# sourceMappingURL=outliner.d.ts.map