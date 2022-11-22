import { CMYK, CSTag, RGB } from "../shared/scripting_utils.js";
import { PDFObject, SendData } from "./pdf_object.js";
export type CorrectColor = ["T"] | ["G", number] | ["RGB", ...RGB] | ["CMYK", ...CMYK];
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