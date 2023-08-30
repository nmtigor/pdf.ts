/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
import { ColorConverters } from "../shared/scripting_utils.js";
import { PDFObject } from "./pdf_object.js";
export class Color extends PDFObject {
    transparent = ["T"];
    black = ["G", 0];
    white = ["G", 1];
    red = ["RGB", 1, 0, 0];
    green = ["RGB", 0, 1, 0];
    blue = ["RGB", 0, 0, 1];
    cyan = ["CMYK", 1, 0, 0, 0];
    magenta = ["CMYK", 0, 1, 0, 0];
    yellow = ["CMYK", 0, 0, 1, 0];
    dkGray = ["G", 0.25];
    gray = ["G", 0.5];
    ltGray = ["G", 0.75];
    constructor() {
        super({});
    }
    static _isValidSpace(cColorSpace) {
        return (typeof cColorSpace === "string" &&
            (cColorSpace === "T" ||
                cColorSpace === "G" ||
                cColorSpace === "RGB" ||
                cColorSpace === "CMYK"));
    }
    static _isValidColor(colorArray) {
        if (!Array.isArray(colorArray) || colorArray.length === 0) {
            return false;
        }
        const space = colorArray[0];
        if (!Color._isValidSpace(space)) {
            return false;
        }
        switch (space) {
            case "T":
                if (colorArray.length !== 1) {
                    return false;
                }
                break;
            case "G":
                if (colorArray.length !== 2) {
                    return false;
                }
                break;
            case "RGB":
                if (colorArray.length !== 4) {
                    return false;
                }
                break;
            case "CMYK":
                if (colorArray.length !== 5) {
                    return false;
                }
                break;
            default:
                return false;
        }
        return colorArray
            .slice(1)
            .every((c) => typeof c === "number" && c >= 0 && c <= 1);
    }
    static _getCorrectColor(colorArray) {
        return Color._isValidColor(colorArray)
            ? colorArray
            : ["G", 0];
    }
    convert(colorArray, cColorSpace) {
        if (!Color._isValidSpace(cColorSpace)) {
            return this.black;
        }
        if (cColorSpace === "T") {
            return ["T"];
        }
        colorArray = Color._getCorrectColor(colorArray);
        if (colorArray[0] === cColorSpace) {
            return colorArray;
        }
        if (colorArray[0] === "T") {
            return this.convert(this.black, cColorSpace);
        }
        return ColorConverters[`${colorArray[0]}_${cColorSpace}`](colorArray.slice(1));
    }
    equal(colorArray1, colorArray2) {
        colorArray1 = Color._getCorrectColor(colorArray1);
        colorArray2 = Color._getCorrectColor(colorArray2);
        if (colorArray1[0] === "T" || colorArray2[0] === "T") {
            return colorArray1[0] === "T" && colorArray2[0] === "T";
        }
        if (colorArray1[0] !== colorArray2[0]) {
            colorArray2 = this.convert(colorArray2, colorArray1[0]);
        }
        return colorArray1.slice(1)
            .every((c, i) => c === colorArray2[i + 1]);
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=color.js.map