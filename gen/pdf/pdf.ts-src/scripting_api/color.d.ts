import type { rgb_t } from "../../../lib/color/alias.js";
import type { CMYK, CSTag } from "../shared/scripting_utils.js";
import type { SendData } from "./pdf_object.js";
import { PDFObject } from "./pdf_object.js";
export type CorrectColor = ["T"] | ["G", number] | ["RGB", ...rgb_t] | ["CMYK", ...CMYK];
interface _SendColorData extends SendData {
}
export declare class Color extends PDFObject<_SendColorData> {
    transparent: [string];
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