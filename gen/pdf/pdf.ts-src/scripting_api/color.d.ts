/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/scripting_api/color.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { Ratio } from "../../../lib/alias.js";
import type { CMYK, CSTag, RGB } from "../shared/scripting_utils.js";
import type { SendData } from "./pdf_object.js";
import { PDFObject } from "./pdf_object.js";
export type CorrectColor = ["T"] | ["G", Ratio] | ["RGB", ...RGB] | ["CMYK", ...CMYK];
interface SendColorData_ extends SendData {
}
export declare class Color extends PDFObject<SendColorData_> {
    transparent: readonly ["T"];
    black: ["G", number];
    white: ["G", number];
    red: ["RGB", number, number, number];
    green: ["RGB", number, number, number];
    blue: ["RGB", number, number, number];
    cyan: ["CMYK", number, number, number, number];
    magenta: ["CMYK", number, number, number, number];
    yellow: ["CMYK", number, number, number, number];
    dkGray: ["G", number];
    gray: ["G", number];
    ltGray: ["G", number];
    constructor();
    static _isValidSpace(cColorSpace: unknown): boolean;
    static _isValidColor(colorArray: unknown): boolean;
    static _getCorrectColor(colorArray: unknown): CorrectColor;
    convert(colorArray: CorrectColor, cColorSpace: CSTag): CorrectColor;
    equal(colorArray1: CorrectColor, colorArray2: CorrectColor): boolean;
}
export {};
//# sourceMappingURL=color.d.ts.map