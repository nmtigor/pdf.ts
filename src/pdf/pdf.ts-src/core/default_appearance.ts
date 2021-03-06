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
import { escapePDFName } from "./core_utils.js";
import { EvaluatorPreprocessor } from "./evaluator.js";
import { Name, type ObjNoCmd } from "./primitives.js";
import { StringStream } from "./stream.js";
/*81---------------------------------------------------------------------------*/

class DefaultAppearanceEvaluator extends EvaluatorPreprocessor
{
  constructor( str:string )
  {
    super( new StringStream(str) );
  }

  parse() 
  {
    const operation = {
      fn: 0,
      args: <ObjNoCmd[]>[],
    };
    const result = {
      fontSize: 0,
      fontName: "",
      fontColor: /* black = */ new Uint8ClampedArray(3),
    };

    try {
      while( true )
      {
        operation.args.length = 0; // Ensure that `args` it's always reset.

        if( !this.read(operation) ) 
          break;
        if (this.savedStatesDepth !== 0) 
          // Don't get info in save/restore sections.
          continue; 
        const { fn, args } = operation;

        switch( fn | 0 )
        {
          case OPS.setFont:
            const [fontName, fontSize] = args;
            if( fontName instanceof Name )
            {
              result.fontName = fontName.name;
            }
            if (typeof fontSize === "number" && fontSize > 0) 
            {
              result.fontSize = fontSize;
            }
            break;
          case OPS.setFillRGBColor:
            ColorSpace.singletons.rgb.getRgbItem( <number[]>args, 0, result.fontColor, 0 );
            break;
          case OPS.setFillGray:
            ColorSpace.singletons.gray.getRgbItem( <number[]>args, 0, result.fontColor, 0 );
            break;
          case OPS.setFillColorSpace:
            ColorSpace.singletons.cmyk.getRgbItem( <number[]>args, 0, result.fontColor, 0 );
            break;
        }
      }
    } catch (reason) {
      warn(`parseDefaultAppearance - ignoring errors: "${reason}".`);
    }

    return result;
  }
}

export interface DefaultAppearanceData
{
  fontSize:number;
  fontName:string;
  fontColor:Uint8ClampedArray;
}

// Parse DA to extract font and color information.
export function parseDefaultAppearance( str:string )
{
  return new DefaultAppearanceEvaluator(str).parse();
}

// Create default appearance string from some information.
export function createDefaultAppearance({ fontSize, fontName, fontColor }:DefaultAppearanceData )
{
  let colorCmd;
  if (fontColor.every(c => c === 0)) {
    colorCmd = "0 g";
  } else {
    colorCmd =
      Array.from(fontColor)
        .map(c => (c / 255).toFixed(2))
        .join(" ") + " rg";
  }
  return `/${escapePDFName(fontName)} ${fontSize} Tf ${colorCmd}`;
}
/*81---------------------------------------------------------------------------*/
