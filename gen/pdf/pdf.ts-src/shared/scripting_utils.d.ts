/**
 * PLEASE NOTE: This file is currently imported in both the `../display/` and
 *              `../scripting_api/` folders, hence be EXTREMELY careful about
 *              introducing any dependencies here since that can lead to an
 *              unexpected/unnecessary size increase of the *built* files.
 */
import type { Ratio, TupleOf } from "../../../lib/alias.js";
import type { rgb_t } from "../../../lib/color/alias.js";
import "../../../lib/jslang.js";
export type RGB = TupleOf<Ratio, 3>;
export type CMYK = TupleOf<Ratio, 4>;
export type CSTag = "G" | "RGB" | "T" | "CMYK";
/**
 * PDF specifications section 10.3
 */
export declare class ColorConverters {
    static CMYK_G([c, y, m, k]: CMYK): ["G", number];
    static G_CMYK([g]: [Ratio]): ["CMYK", number, number, number, number];
    static G_RGB([g]: [Ratio]): ["RGB", number, number, number];
    static G_rgb([g]: [Ratio]): rgb_t;
    static G_HTML([g]: [Ratio]): string;
    static RGB_G([r, g, b]: RGB): ["G", number];
    static RGB_rgb(color: RGB): rgb_t;
    static RGB_HTML(color: RGB): string;
    static T_HTML(): string;
    static T_rgb(): never[];
    static CMYK_RGB([c, y, m, k]: CMYK): ["RGB", number, number, number];
    static CMYK_rgb([c, y, m, k]: CMYK): rgb_t;
    static CMYK_HTML(components: CMYK): string;
    static RGB_CMYK([r, g, b]: RGB): ["CMYK", number, number, number, number];
}
//# sourceMappingURL=scripting_utils.d.ts.map