/** 80**************************************************************************
 * https://github.com/material-foundation/material-color-utilities/blob/main/typescript/hct/cam16.ts
 * (2023-01-01)
 *
 * @module lib/color/cam16
 * @license Apache-2.0
 ******************************************************************************/
import { uint32 } from "../alias.js";
import type { chroma_t, hue_t } from "./alias.js";
import { ViewingConditions } from "./viewing_conditions.js";
/**
 * CAM16, a color appearance model. Colors are not just defined by their hex
 * code, but rather, a hex code and viewing conditions.
 *
 * CAM16 instances also have coordinates in the CAM16-UCS space, called J*, a*,
 * b*, or jstar, astar, bstar in code. CAM16-UCS is included in the CAM16
 * specification, and should be used when measuring distances between colors.
 *
 * In traditional color spaces, a color can be identified solely by the
 * observer's measurement of the color. Color appearance models such as CAM16
 * also use information about the environment where the color was
 * observed, known as the viewing conditions.
 *
 * For example, white under the traditional assumption of a midday sun white
 * point is accurately measured as a slightly chromatic blue by CAM16. (roughly,
 * hue 203, chroma 3, lightness 100)
 */
export declare class Cam16 {
    #private;
    readonly hue: hue_t;
    readonly chroma: chroma_t;
    readonly j: number;
    readonly q: number;
    readonly m: number;
    readonly s: number;
    readonly jstar: number;
    readonly astar: number;
    readonly bstar: number;
    /**
     * All of the CAM16 dimensions can be calculated from 3 of the dimensions, in
     * the following combinations:
     *      -  {j or q} and {c, m, or s} and hue
     *      - jstar, astar, bstar
     * Prefer using a static method that constructs from 3 of those dimensions.
     * This constructor is intended for those methods to use to return all
     * possible dimensions.
     *
     * @param hue
     * @param chroma informally, colorfulness / color intensity. like saturation
     *     in HSL, except perceptually accurate.
     * @param j lightness
     * @param q brightness; ratio of lightness to white point's lightness
     * @param m colorfulness
     * @param s saturation; ratio of chroma to white point's chroma
     * @param jstar CAM16-UCS J coordinate
     * @param astar CAM16-UCS a coordinate
     * @param bstar CAM16-UCS b coordinate
     */
    constructor(hue: hue_t, chroma: chroma_t, j: number, q: number, m: number, s: number, jstar: number, astar: number, bstar: number);
    /**
     * CAM16 instances also have coordinates in the CAM16-UCS space, called J*,
     * a*, b*, or jstar, astar, bstar in code. CAM16-UCS is included in the CAM16
     * specification, and is used to measure distances between colors.
     */
    distance(other: Cam16): number;
    /**
     * @param argb ARGB representation of a color.
     * @out @param out_x
     * @return CAM16 color, assuming the color was viewed in default viewing
     *     conditions.
     */
    static fromInt(argb: uint32, out_x?: Cam16): Cam16;
    /**
     * @param argb ARGB representation of a color.
     * @param viewingConditions Information about the environment where the color
     *     was observed.
     * @out @param out_x
     * @return CAM16 color.
     */
    static fromIntInViewingConditions(argb: uint32, viewingConditions: ViewingConditions, out_x?: Cam16): Cam16;
    /**
     * @param j CAM16 lightness
     * @param c CAM16 chroma
     * @param h CAM16 hue
     * @out @param out_x
     */
    static fromJch(j: number, c: chroma_t, h: hue_t, out_x?: Cam16): Cam16;
    /**
     * @const @param j CAM16 lightness
     * @const @param c CAM16 chroma
     * @const @param h CAM16 hue
     * @headconst @param viewingConditions Information about the environment where
     *     the color was observed.
     * @out @param out_x
     */
    static fromJchInViewingConditions(j: number, c: chroma_t, h: hue_t, viewingConditions: ViewingConditions, out_x?: Cam16): Cam16;
    /**
     * @param jstar CAM16-UCS lightness.
     * @param astar CAM16-UCS a dimension. Like a* in L*a*b*, it is a Cartesian
     *     coordinate on the Y axis.
     * @param bstar CAM16-UCS b dimension. Like a* in L*a*b*, it is a Cartesian
     *     coordinate on the X axis.
     * @out @param out_x
     */
    static fromUcs(jstar: number, astar: number, bstar: number, out_x?: Cam16): Cam16;
    /**
     * @param jstar CAM16-UCS lightness.
     * @param astar CAM16-UCS a dimension. Like a* in L*a*b*, it is a Cartesian
     *     coordinate on the Y axis.
     * @param bstar CAM16-UCS b dimension. Like a* in L*a*b*, it is a Cartesian
     *     coordinate on the X axis.
     * @param viewingConditions Information about the environment where the color
     *     was observed.
     * @out @param out_x
     */
    static fromUcsInViewingConditions(jstar: number, astar: number, bstar: number, viewingConditions: ViewingConditions, out_x?: Cam16): Cam16;
    /**
     * @return ARGB representation of color, assuming the color was viewed in
     *     default viewing conditions, which are near-identical to the default
     *     viewing conditions for sRGB.
     */
    toInt(): uint32;
    /**
     * @param viewingConditions Information about the environment where the color
     *     will be viewed.
     * @return ARGB representation of color
     */
    viewed(viewingConditions: ViewingConditions): uint32;
}
//# sourceMappingURL=cam16.d.ts.map