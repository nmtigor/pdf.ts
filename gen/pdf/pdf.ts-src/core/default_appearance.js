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
import { OPS, warn } from "../shared/util.js";
import { ColorSpace } from "./colorspace.js";
import { escapePDFName, numberToString } from "./core_utils.js";
import { EvaluatorPreprocessor } from "./evaluator.js";
import { Name } from "./primitives.js";
import { StringStream } from "./stream.js";
/*80--------------------------------------------------------------------------*/
class DefaultAppearanceEvaluator extends EvaluatorPreprocessor {
    constructor(str) {
        super(new StringStream(str));
    }
    parse() {
        const operation = {
            fn: 0,
            args: [],
        };
        const result = {
            fontSize: 0,
            fontName: "",
            fontColor: /* black = */ new Uint8ClampedArray(3),
        };
        try {
            while (true) {
                operation.args.length = 0; // Ensure that `args` it's always reset.
                if (!this.read(operation)) {
                    break;
                }
                if (this.savedStatesDepth !== 0) {
                    // Don't get info in save/restore sections.
                    continue;
                }
                const { fn, args } = operation;
                switch (fn | 0) {
                    case OPS.setFont:
                        const [fontName, fontSize] = args;
                        if (fontName instanceof Name) {
                            result.fontName = fontName.name;
                        }
                        if (typeof fontSize === "number" && fontSize > 0) {
                            result.fontSize = fontSize;
                        }
                        break;
                    case OPS.setFillRGBColor:
                        ColorSpace.singletons.rgb.getRgbItem(args, 0, result.fontColor, 0);
                        break;
                    case OPS.setFillGray:
                        ColorSpace.singletons.gray.getRgbItem(args, 0, result.fontColor, 0);
                        break;
                    case OPS.setFillColorSpace:
                        ColorSpace.singletons.cmyk.getRgbItem(args, 0, result.fontColor, 0);
                        break;
                }
            }
        }
        catch (reason) {
            warn(`parseDefaultAppearance - ignoring errors: "${reason}".`);
        }
        return result;
    }
}
// Parse DA to extract font and color information.
export function parseDefaultAppearance(str) {
    return new DefaultAppearanceEvaluator(str).parse();
}
export function getPdfColor(color, isFill) {
    if (color[0] === color[1] && color[1] === color[2]) {
        const gray = color[0] / 255;
        return `${numberToString(gray)} ${isFill ? "g" : "G"}`;
    }
    return (Array.from(color)
        .map((c) => numberToString(c / 255))
        .join(" ") + ` ${isFill ? "rg" : "RG"}`);
}
// Create default appearance string from some information.
export function createDefaultAppearance({ fontSize, fontName, fontColor }) {
    return `/${escapePDFName(fontName)} ${fontSize} Tf ${getPdfColor(fontColor, 
    /* isFill */ true)}`;
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=default_appearance.js.map