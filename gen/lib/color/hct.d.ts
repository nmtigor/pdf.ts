/** 80**************************************************************************
 * A color system built using CAM16 hue and chroma, and L* from
 * L*a*b*.
 *
 * Using L* creates a link between the color system, contrast, and thus
 * accessibility. Contrast ratio depends on relative luminance, or Y in the XYZ
 * color space. L*, or perceptual luminance can be calculated from Y.
 *
 * Unlike Y, L* is linear to human perception, allowing trivial creation of
 * accurate color tones.
 *
 * Unlike contrast ratio, measuring contrast in L* is linear, and simple to
 * calculate. A difference of 40 in HCT tone guarantees a contrast ratio >= 3.0,
 * and a difference of 50 guarantees a contrast ratio >= 4.5.
 *
 * https://github.com/material-foundation/material-color-utilities/blob/main/typescript/hct/hct.ts
 * (2023-01-01)
 *
 * @module lib/color/hct
 * @license Apache-2.0
 ******************************************************************************/
import type { uint32 } from "../alias.js";
import type { chroma_t, hue_t, tone_t } from "./alias.js";
/**
 * HCT, hue, chroma, and tone. A color system that provides a perceptually
 * accurate color measurement system that can also accurately render what colors
 * will appear as in different lighting environments.
 */
export declare class Hct {
    #private;
    private argb;
    /**
     * @param hue 0 <= hue < 360; invalid values are corrected.
     * @param chroma 0 <= chroma < ?; Informally, colorfulness. The color
     *     returned may be lower than the requested chroma. Chroma has a different
     *     maximum for any given hue and tone.
     * @param tone 0 <= tone <= 100; invalid values are corrected.
     * @return HCT representation of a color in default viewing conditions.
     */
    internalHue: hue_t;
    internalChroma: chroma_t;
    internalTone: tone_t;
    static from(hue: hue_t, chroma: chroma_t, tone: tone_t): Hct;
    /**
     * @param argb ARGB representation of a color.
     * @return HCT representation of a color in default viewing conditions
     */
    static fromInt(argb: uint32): Hct;
    toInt(): uint32;
    /**
     * A number, in degrees, representing ex. red, orange, yellow, etc.
     * Ranges from 0 <= hue < 360.
     */
    get hue(): hue_t;
    /**
     * @param newHue 0 <= newHue < 360; invalid values are corrected.
     * Chroma may decrease because chroma has a different maximum for any given
     * hue and tone.
     */
    set hue(newHue: hue_t);
    get chroma(): chroma_t;
    /**
     * @param newChroma 0 <= newChroma < ?
     * Chroma may decrease because chroma has a different maximum for any given
     * hue and tone.
     */
    set chroma(newChroma: chroma_t);
    /** Lightness. Ranges from 0 to 100. */
    get tone(): tone_t;
    /**
     * @param newTone 0 <= newTone <= 100; invalid valids are corrected.
     * Chroma may decrease because chroma has a different maximum for any given
     * hue and tone.
     */
    set tone(newTone: tone_t);
    get valid(): boolean;
    invalidate(): void;
    private constructor();
    setInternalState(argb: uint32): void;
}
//# sourceMappingURL=hct.d.ts.map