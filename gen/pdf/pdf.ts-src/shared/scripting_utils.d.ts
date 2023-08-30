/**
 * PLEASE NOTE: This file is currently imported in both the `../display/` and
 *              `../scripting_api/` folders, hence be EXTREMELY careful about
 *              introducing any dependencies here since that can lead to an
 *              unexpected/unnecessary size increase of the *built* files.
 */
import type { rgb_t } from "../../../lib/color/alias.js";
import type { TupleOf } from "../../../lib/alias.js";
export type XYZ = TupleOf<number, 3>;
export type CMYK = TupleOf<number, 4>;
export type CSTag = "G" | "RGB" | "T" | "CMYK";
export type ColorConvertersDetail = Record<string, [CSTag, ...number[]]>;
/**
 * PDF specifications section 10.3
 */
export declare namespace ColorConverters {
    function CMYK_G([c, y, m, k]: CMYK): ["G", number];
    function G_CMYK([g]: [number]): ["CMYK", number, number, number, number];
    function G_RGB([g]: [number]): ["RGB", number, number, number];
    function G_HTML([g]: [number]): string;
    function RGB_G([r, g, b]: rgb_t): ["G", number];
    function RGB_HTML([r, g, b]: rgb_t): string;
    function T_HTML(): string;
    function CMYK_RGB([c, y, m, k]: CMYK): ["RGB", number, number, number];
    function CMYK_HTML(components: CMYK): string;
    function RGB_CMYK([r, g, b]: rgb_t): ["CMYK", number, number, number, number];
}
//# sourceMappingURL=scripting_utils.d.ts.map