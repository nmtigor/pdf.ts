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

import { DENO } from "../../../global.ts";
import { type id_t, type rect_t } from "../../../lib/alias.ts";
import { LINE_DESCENT_FACTOR, LINE_FACTOR, OPS, warn } from "../shared/util.ts";
import { ColorSpace } from "./colorspace.ts";
import {
  escapePDFName,
  getRotationMatrix,
  numberToString,
  stringToUTF16HexString,
} from "./core_utils.ts";
import { EvaluatorPreprocessor } from "./evaluator.ts";
import { Dict, Name, type ObjNoCmd, Ref } from "./primitives.ts";
import { StringStream } from "./stream.ts";
import { XRef } from "./xref.ts";
/*80--------------------------------------------------------------------------*/

class DefaultAppearanceEvaluator extends EvaluatorPreprocessor {
  constructor(str: string) {
    super(new StringStream(str));
  }

  parse() {
    const operation = {
      fn: 0,
      args: <ObjNoCmd[]> [],
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
            ColorSpace.singletons.rgb.getRgbItem(
              <number[]> args,
              0,
              result.fontColor,
              0,
            );
            break;
          case OPS.setFillGray:
            ColorSpace.singletons.gray.getRgbItem(
              <number[]> args,
              0,
              result.fontColor,
              0,
            );
            break;
          case OPS.setFillColorSpace:
            ColorSpace.singletons.cmyk.getRgbItem(
              <number[]> args,
              0,
              result.fontColor,
              0,
            );
            break;
        }
      }
    } catch (reason) {
      warn(`parseDefaultAppearance - ignoring errors: "${reason}".`);
    }

    return result;
  }
}

export interface DefaultAppearanceData {
  fontSize: number;
  fontName: string;
  fontColor?: Uint8ClampedArray | undefined;
}

// Parse DA to extract font and color information.
export function parseDefaultAppearance(str: string) {
  return new DefaultAppearanceEvaluator(str).parse();
}

export function getPdfColor(color: Uint8ClampedArray, isFill: boolean) {
  if (color[0] === color[1] && color[1] === color[2]) {
    const gray = color[0] / 255;
    return `${numberToString(gray)} ${isFill ? "g" : "G"}`;
  }
  return (
    Array.from(color, (c) => numberToString(c / 255))
      .join(" ") + ` ${isFill ? "rg" : "RG"}`
  );
}

// Create default appearance string from some information.
export function createDefaultAppearance(
  { fontSize, fontName, fontColor }: DefaultAppearanceData,
) {
  return `/${escapePDFName(fontName)} ${fontSize} Tf ${
    getPdfColor(
      fontColor!,
      /* isFill */ true,
    )
  }`;
}

let denoCanvas:
  | { createCanvas: (width: number, height: number) => unknown }
  | undefined;
/*#static*/ if (DENO) {
  const P_mod = "https://deno.land/x/canvas@v1.4.1/mod.ts";
  denoCanvas = await import(P_mod);
}

export class FakeUnicodeFont {
  xref;
  widths: Map<number, number> | undefined;
  firstChar = Infinity;
  lastChar = -Infinity;
  fontFamily;

  ctxMeasure;

  static #fontNameId: id_t;
  fontName;

  static #toUnicodeRef: Ref;
  static toUnicodeStream: StringStream;
  get toUnicodeRef() {
    if (!FakeUnicodeFont.#toUnicodeRef) {
      const toUnicode = `/CIDInit /ProcSet findresource begin
12 dict begin
begincmap
/CIDSystemInfo
<< /Registry (Adobe)
/Ordering (UCS) /Supplement 0 >> def
/CMapName /Adobe-Identity-UCS def
/CMapType 2 def
1 begincodespacerange
<0000> <FFFF>
endcodespacerange
1 beginbfrange
<0000> <FFFF> <0000>
endbfrange
endcmap CMapName currentdict /CMap defineresource pop end end`;
      const toUnicodeStream =
        (FakeUnicodeFont.toUnicodeStream = new StringStream(toUnicode));
      const toUnicodeDict = new Dict(this.xref);
      toUnicodeStream.dict = toUnicodeDict;
      toUnicodeDict.set("Length", toUnicode.length);
      FakeUnicodeFont.#toUnicodeRef = this.xref.getNewPersistentRef(
        toUnicodeStream,
      );
    }

    return FakeUnicodeFont.#toUnicodeRef;
  }

  static #fontDescriptorRef: Ref;
  get fontDescriptorRef() {
    if (!FakeUnicodeFont.#fontDescriptorRef) {
      const fontDescriptor = new Dict(this.xref);
      fontDescriptor.set("Type", Name.get("FontDescriptor"));
      fontDescriptor.set("FontName", this.fontName);
      fontDescriptor.set("FontFamily", "MyriadPro Regular");
      fontDescriptor.set("FontBBox", [0, 0, 0, 0]);
      fontDescriptor.set("FontStretch", Name.get("Normal"));
      fontDescriptor.set("FontWeight", 400);
      fontDescriptor.set("ItalicAngle", 0);

      FakeUnicodeFont.#fontDescriptorRef = this.xref.getNewPersistentRef(
        fontDescriptor,
      );
    }

    return FakeUnicodeFont.#fontDescriptorRef;
  }

  constructor(xref: XRef, fontFamily: "monospace" | "sans-serif") {
    this.xref = xref;
    this.fontFamily = fontFamily;

    let canvas;
    /*#static*/ if (DENO) {
      canvas = denoCanvas!.createCanvas(1, 1);
    } else {
      canvas = new (globalThis as any).OffscreenCanvas(1, 1);
    }
    this.ctxMeasure = (canvas as any).getContext("2d");

    if (!FakeUnicodeFont.#fontNameId) {
      FakeUnicodeFont.#fontNameId = 1;
    }
    this.fontName = Name.get(
      `InvalidPDFjsFont_${fontFamily}_${FakeUnicodeFont.#fontNameId++}`,
    );
  }

  get descendantFontRef() {
    const descendantFont = new Dict(this.xref);
    descendantFont.set("BaseFont", this.fontName);
    descendantFont.set("Type", Name.get("Font"));
    descendantFont.set("Subtype", Name.get("CIDFontType0"));
    descendantFont.set("CIDToGIDMap", Name.get("Identity"));
    descendantFont.set("FirstChar", this.firstChar);
    descendantFont.set("LastChar", this.lastChar);
    descendantFont.set("FontDescriptor", this.fontDescriptorRef);
    descendantFont.set("DW", 1000);

    const widths: (number | number[])[] = [];
    const chars = [...this.widths!.entries()].sort();
    let currentChar: number | undefined;
    let currentWidths: number[] | undefined;
    for (const [char, width] of chars) {
      if (!currentChar) {
        currentChar = char;
        currentWidths = [width];
        continue;
      }
      if (char === currentChar + currentWidths!.length) {
        currentWidths!.push(width);
      } else {
        widths.push(currentChar, currentWidths!);
        currentChar = char;
        currentWidths = [width];
      }
    }

    if (currentChar) {
      widths.push(currentChar, currentWidths!);
    }

    descendantFont.set("W", widths);

    const cidSystemInfo = new Dict(this.xref);
    cidSystemInfo.set("Ordering", "Identity");
    cidSystemInfo.set("Registry", "Adobe");
    cidSystemInfo.set("Supplement", 0);
    descendantFont.set("CIDSystemInfo", cidSystemInfo);

    return this.xref.getNewPersistentRef(descendantFont);
  }

  get baseFontRef() {
    const baseFont = new Dict(this.xref);
    baseFont.set("BaseFont", this.fontName);
    baseFont.set("Type", Name.get("Font"));
    baseFont.set("Subtype", Name.get("Type0"));
    baseFont.set("Encoding", Name.get("Identity-H"));
    baseFont.set("DescendantFonts", [this.descendantFontRef]);
    baseFont.set("ToUnicode", this.toUnicodeRef);

    return this.xref.getNewPersistentRef(baseFont);
  }

  get resources() {
    const resources = new Dict(this.xref);
    const font = new Dict(this.xref);
    font.set(this.fontName.name, this.baseFontRef);
    resources.set("Font", font);

    return resources;
  }

  _createContext() {
    this.widths = new Map();
    (this.ctxMeasure as any).font = `1000px ${this.fontFamily}`;

    return this.ctxMeasure;
  }

  createFontResources(text: string) {
    const ctx = this._createContext();
    for (const line of text.split(/\r\n?|\n/)) {
      for (const char of line.split("")) {
        const code = char.charCodeAt(0);
        if (this.widths!.has(code)) {
          continue;
        }
        const metrics = (ctx as any).measureText(char);
        const width = Math.ceil(metrics.width);
        this.widths!.set(code, width);
        this.firstChar = Math.min(code, this.firstChar);
        this.lastChar = Math.max(code, this.lastChar);
      }
    }

    return this.resources;
  }

  createAppearance(
    text: string,
    rect: rect_t,
    rotation: number,
    fontSize: number,
    bgColor: Uint8ClampedArray,
    strokeAlpha: number | undefined,
  ) {
    const ctx = this._createContext();
    const lines = [];
    let maxWidth = -Infinity;
    for (const line of text.split(/\r\n?|\n/)) {
      lines.push(line);
      // The line width isn't the sum of the char widths, because in some
      // languages, like arabic, it'd be wrong because of ligatures.
      const lineWidth = (ctx as any).measureText(line).width;
      maxWidth = Math.max(maxWidth, lineWidth);
      for (const char of line.split("")) {
        const code = char.charCodeAt(0);
        let width = this.widths!.get(code);
        if (width === undefined) {
          const metrics = (ctx as any).measureText(char);
          width = Math.ceil(metrics.width);
          this.widths!.set(code, width);
          this.firstChar = Math.min(code, this.firstChar);
          this.lastChar = Math.max(code, this.lastChar);
        }
      }
    }
    maxWidth *= fontSize / 1000;

    const [x1, y1, x2, y2] = rect;
    let w = x2 - x1;
    let h = y2 - y1;

    if (rotation % 180 !== 0) {
      [w, h] = [h, w];
    }

    let hscale = 1;
    if (maxWidth > w) {
      hscale = w / maxWidth;
    }
    let vscale = 1;
    const lineHeight = LINE_FACTOR * fontSize;
    const lineDescent = LINE_DESCENT_FACTOR * fontSize;
    const maxHeight = lineHeight * lines.length;
    if (maxHeight > h) {
      vscale = h / maxHeight;
    }
    const fscale = Math.min(hscale, vscale);
    const newFontSize = fontSize * fscale;

    const buffer = [
      "q",
      `0 0 ${numberToString(w)} ${numberToString(h)} re W n`,
      `BT`,
      `1 0 0 1 0 ${numberToString(h + lineDescent)} Tm 0 Tc ${
        getPdfColor(
          bgColor,
          /* isFill */ true,
        )
      }`,
      `/${this.fontName.name} ${numberToString(newFontSize)} Tf`,
    ];

    const { resources } = this;
    strokeAlpha =
      typeof strokeAlpha === "number" && strokeAlpha >= 0 && strokeAlpha <= 1
        ? strokeAlpha
        : 1;

    if (strokeAlpha !== 1) {
      buffer.push("/R0 gs");
      const extGState = new Dict(this.xref);
      const r0 = new Dict(this.xref);
      r0.set("ca", strokeAlpha);
      r0.set("CA", strokeAlpha);
      r0.set("Type", Name.get("ExtGState"));
      extGState.set("R0", r0);
      resources.set("ExtGState", extGState);
    }

    const vShift = numberToString(lineHeight);
    for (const line of lines) {
      buffer.push(`0 -${vShift} Td <${stringToUTF16HexString(line)}> Tj`);
    }
    buffer.push("ET", "Q");
    const appearance = buffer.join("\n");

    const appearanceStreamDict = new Dict(this.xref);
    appearanceStreamDict.set("Subtype", Name.get("Form"));
    appearanceStreamDict.set("Type", Name.get("XObject"));
    appearanceStreamDict.set("BBox", [0, 0, w, h]);
    appearanceStreamDict.set("Length", appearance.length);
    appearanceStreamDict.set("Resources", resources);

    if (rotation) {
      const matrix = getRotationMatrix(rotation, w, h);
      appearanceStreamDict.set("Matrix", matrix);
    }

    const ap = new StringStream(appearance);
    ap.dict = appearanceStreamDict;

    return ap;
  }
}
/*80--------------------------------------------------------------------------*/
