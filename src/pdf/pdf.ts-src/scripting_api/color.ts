/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

/* Copyright 2020 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { Ratio } from "@fe-src/lib/alias.ts";
import type { CMYK, CSTag, RGB } from "../shared/scripting_utils.ts";
import { ColorConverters } from "../shared/scripting_utils.ts";
import type { ScriptingData, SendData } from "./pdf_object.ts";
import { PDFObject } from "./pdf_object.ts";
/*80--------------------------------------------------------------------------*/

export type CorrectColor =
  | ["T"]
  | ["G", Ratio]
  | ["RGB", ...RGB]
  | ["CMYK", ...CMYK];

interface SendColorData_ extends SendData {
}

interface ScriptingColorData_ extends ScriptingData<SendColorData_> {
}

export class Color extends PDFObject<SendColorData_> {
  transparent = ["T"] as const;
  black = ["G", 0] as ["G", Ratio];
  white = ["G", 1] as ["G", Ratio];
  red = ["RGB", 1, 0, 0] as ["RGB", ...RGB];
  green = ["RGB", 0, 1, 0] as ["RGB", ...RGB];
  blue = ["RGB", 0, 0, 1] as ["RGB", ...RGB];
  cyan = ["CMYK", 1, 0, 0, 0] as ["CMYK", ...CMYK];
  magenta = ["CMYK", 0, 1, 0, 0] as ["CMYK", ...CMYK];
  yellow = ["CMYK", 0, 0, 1, 0] as ["CMYK", ...CMYK];
  dkGray = ["G", 0.25] as ["G", Ratio];
  gray = ["G", 0.5] as ["G", Ratio];
  ltGray = ["G", 0.75] as ["G", Ratio];

  constructor() {
    super({} as ScriptingColorData_);
  }

  static _isValidSpace(cColorSpace: unknown) {
    return (
      typeof cColorSpace === "string" &&
      (cColorSpace === "T" ||
        cColorSpace === "G" ||
        cColorSpace === "RGB" ||
        cColorSpace === "CMYK")
    );
  }

  static _isValidColor(colorArray: unknown) {
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

  static _getCorrectColor(colorArray: unknown): CorrectColor {
    return Color._isValidColor(colorArray)
      ? colorArray as CorrectColor
      : ["G", 0];
  }

  convert(colorArray: CorrectColor, cColorSpace: CSTag): CorrectColor {
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

    return (ColorConverters as any)[`${colorArray[0]}_${cColorSpace}`](
      colorArray.slice(1),
    );
  }

  equal(colorArray1: CorrectColor, colorArray2: CorrectColor) {
    colorArray1 = Color._getCorrectColor(colorArray1);
    colorArray2 = Color._getCorrectColor(colorArray2);

    if (colorArray1[0] === "T" || colorArray2[0] === "T") {
      return colorArray1[0] === "T" && colorArray2[0] === "T";
    }

    if (colorArray1[0] !== colorArray2[0]) {
      colorArray2 = this.convert(colorArray2, colorArray1[0]);
    }

    return (colorArray1.slice(1) as [] | [Ratio] | RGB | CMYK)
      .every((c, i) => c === colorArray2[i + 1]);
  }
}
/*80--------------------------------------------------------------------------*/
