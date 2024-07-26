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
 * (2023-06-22)
 *
 * @module lib/color/hct
 * @license Apache-2.0
 ******************************************************************************/
import { Cam16 } from "./cam16.js";
import { lstarFromArgb } from "./color_utils.js";
import { HctSolver } from "./hct_solver.js";
/*80--------------------------------------------------------------------------*/
/**
 * HCT, hue, chroma, and tone. A color system that provides a perceptually
 * accurate color measurement system that can also accurately render what colors
 * will appear as in different lighting environments.
 */
export class Hct {
    argb;
    /**
     * @param hue 0 <= hue < 360; invalid values are corrected.
     * @param chroma 0 <= chroma < ?; Informally, colorfulness. The color
     *     returned may be lower than the requested chroma. Chroma has a different
     *     maximum for any given hue and tone.
     * @param tone 0 <= tone <= 100; invalid values are corrected.
     * @return HCT representation of a color in default viewing conditions.
     */
    internalHue;
    internalChroma;
    internalTone;
    static from(hue, chroma, tone) {
        return new Hct(HctSolver.solveToInt(hue, chroma, tone));
    }
    /**
     * @param argb ARGB representation of a color.
     * @return HCT representation of a color in default viewing conditions
     */
    static fromInt(argb) {
        return new Hct(argb);
    }
    toInt() {
        return this.argb;
    }
    /**
     * A number, in degrees, representing ex. red, orange, yellow, etc.
     * Ranges from 0 <= hue < 360.
     */
    get hue() {
        return this.internalHue;
    }
    /**
     * @param newHue 0 <= newHue < 360; invalid values are corrected.
     * Chroma may decrease because chroma has a different maximum for any given
     * hue and tone.
     */
    set hue(newHue) {
        this.setInternalState(HctSolver.solveToInt(newHue, this.internalChroma, this.internalTone));
    }
    get chroma() {
        return this.internalChroma;
    }
    /**
     * @param newChroma 0 <= newChroma < ?
     * Chroma may decrease because chroma has a different maximum for any given
     * hue and tone.
     */
    set chroma(newChroma) {
        this.setInternalState(HctSolver.solveToInt(this.internalHue, newChroma, this.internalTone));
    }
    /** Lightness. Ranges from 0 to 100. */
    get tone() {
        return this.internalTone;
    }
    /**
     * @param newTone 0 <= newTone <= 100; invalid valids are corrected.
     * Chroma may decrease because chroma has a different maximum for any given
     * hue and tone.
     */
    set tone(newTone) {
        this.setInternalState(HctSolver.solveToInt(this.internalHue, this.internalChroma, newTone));
    }
    #cam;
    #valid = false;
    get valid() {
        return this.#valid;
    }
    invalidate() {
        this.#valid = false;
    }
    constructor(argb) {
        this.argb = argb;
        const cam = Cam16.fromInt(argb);
        this.internalHue = cam.hue;
        this.internalChroma = cam.chroma;
        this.internalTone = lstarFromArgb(argb);
        this.argb = argb;
        this.#cam = cam;
        this.#valid = true;
    }
    setInternalState(argb) {
        const cam = Cam16.fromInt(argb, this.#cam);
        this.internalHue = cam.hue;
        this.internalChroma = cam.chroma;
        this.internalTone = lstarFromArgb(argb);
        this.argb = argb;
        this.#valid = true;
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=hct.js.map