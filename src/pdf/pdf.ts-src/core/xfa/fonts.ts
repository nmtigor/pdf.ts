/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/xfa/fonts.ts
 * @license Apache-2.0
 ******************************************************************************/

/* Copyright 2021 Mozilla Foundation
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

import { warn } from "../../shared/util.ts";
import type { ErrorFont, Font } from "../fonts.ts";
import type { XFAFontMetrics } from "../xfa_fonts.ts";
import type { XFAFontBase } from "./alias.ts";
import { $globalData } from "./symbol_utils.ts";
import type { Font as XFAFont } from "./template.ts";
import { stripQuotes } from "./utils.ts";
/*80--------------------------------------------------------------------------*/

interface PDFFont {
  bold?: Font | ErrorFont;
  bolditalic?: Font | ErrorFont;
  italic?: Font | ErrorFont;
  regular?: Font | ErrorFont | undefined;
}

export class FontFinder {
  fonts = new Map<string, PDFFont | undefined>();
  cache = new Map<string, PDFFont>();
  warned = new Set();
  defaultFont?: PDFFont;

  constructor(pdfFonts: (Font | ErrorFont)[]) {
    this.add(pdfFonts);
  }

  add(pdfFonts: (Font | ErrorFont)[], reallyMissingFonts?: Set<string>) {
    for (const pdfFont of pdfFonts) {
      this.addPdfFont(pdfFont);
    }
    for (const pdfFont of this.fonts.values()) {
      if (!pdfFont!.regular) {
        pdfFont!.regular = pdfFont!.italic || pdfFont!.bold ||
          pdfFont!.bolditalic;
      }
    }

    if (!reallyMissingFonts || reallyMissingFonts.size === 0) {
      return;
    }
    const myriad = this.fonts.get("PdfJS-Fallback-PdfJS-XFA");
    for (const missing of reallyMissingFonts) {
      this.fonts.set(missing, myriad);
    }
  }

  addPdfFont(pdfFont: Font | ErrorFont) {
    const cssFontInfo = pdfFont.cssFontInfo!;
    const name = cssFontInfo.fontFamily;
    let font = this.fonts.get(name);
    if (!font) {
      font = <PDFFont> Object.create(null);
      this.fonts.set(name, font);
      if (!this.defaultFont) {
        this.defaultFont = font;
      }
    }
    let property: keyof PDFFont | "" = "";
    const fontWeight = parseFloat(cssFontInfo.fontWeight as any);
    if (parseFloat(cssFontInfo.italicAngle as any) !== 0) {
      property = fontWeight >= 700 ? "bolditalic" : "italic";
    } else if (fontWeight >= 700) {
      property = "bold";
    }

    if (!property) {
      if (pdfFont.name.includes("Bold") || pdfFont.psName?.includes("Bold")) {
        property = "bold";
      }
      if (
        pdfFont.name.includes("Italic") ||
        pdfFont.name.endsWith("It") ||
        pdfFont.psName?.includes("Italic") ||
        pdfFont.psName?.endsWith("It")
      ) {
        property += "italic";
      }
    }

    if (!property) {
      property = "regular";
    }

    font[<keyof PDFFont> property] = pdfFont;
  }

  getDefault() {
    return this.defaultFont;
  }

  find(fontName: string, mustWarn = true) {
    let font = this.fonts.get(fontName) || this.cache.get(fontName);
    if (font) {
      return font;
    }

    const pattern = /,|-|_| |bolditalic|bold|italic|regular|it/gi;
    let name = fontName.replaceAll(pattern, "");
    font = this.fonts.get(name);
    if (font) {
      this.cache.set(fontName, font);
      return font;
    }
    name = name.toLowerCase();

    const maybe = [];
    for (const [family, pdfFont] of this.fonts.entries()) {
      if (family.replaceAll(pattern, "").toLowerCase().startsWith(name)) {
        maybe.push(pdfFont);
      }
    }

    if (maybe.length === 0) {
      for (const [, pdfFont] of this.fonts.entries()) {
        if (
          pdfFont!.regular!.name
            ?.replaceAll(pattern, "")
            .toLowerCase()
            .startsWith(name)
        ) {
          maybe.push(pdfFont);
        }
      }
    }

    if (maybe.length === 0) {
      name = name.replaceAll(/psmt|mt/gi, "");
      for (const [family, pdfFont] of this.fonts.entries()) {
        if (family.replaceAll(pattern, "").toLowerCase().startsWith(name)) {
          maybe.push(pdfFont);
        }
      }
    }

    if (maybe.length === 0) {
      for (const pdfFont of this.fonts.values()) {
        if (
          pdfFont!.regular!.name
            ?.replaceAll(pattern, "")
            .toLowerCase()
            .startsWith(name)
        ) {
          maybe.push(pdfFont);
        }
      }
    }

    if (maybe.length >= 1) {
      if (maybe.length !== 1 && mustWarn) {
        warn(`XFA - Too many choices to guess the correct font: ${fontName}`);
      }
      this.cache.set(fontName, maybe[0]!);
      return maybe[0];
    }

    if (mustWarn && !this.warned.has(fontName)) {
      this.warned.add(fontName);
      warn(`XFA - Cannot find the font: ${fontName}`);
    }
    return undefined;
  }
}

export function selectFont(xfaFont: XFAFontBase, typeface: PDFFont) {
  if (xfaFont.posture === "italic") {
    if (xfaFont.weight === "bold") {
      return typeface.bolditalic;
    }
    return typeface.italic;
  } else if (xfaFont.weight === "bold") {
    return typeface.bold;
  }

  return typeface.regular;
}

export function getMetrics(xfaFont?: XFAFont, real = false): XFAFontMetrics {
  let pdfFont: Font | ErrorFont | undefined;
  if (xfaFont) {
    const name = stripQuotes(xfaFont.typeface!);
    const typeface = xfaFont[$globalData]!.fontFinder!.find(name);
    pdfFont = selectFont(xfaFont, typeface!);
  }

  if (!pdfFont) {
    return {
      lineHeight: 12,
      lineGap: 2,
      lineNoGap: 10,
    };
  }

  const size = xfaFont!.size || 10;
  const lineHeight = pdfFont.lineHeight
    ? Math.max(real ? 0 : 1.2, pdfFont.lineHeight)
    : 1.2;
  const lineGap = pdfFont.lineGap === undefined ? 0.2 : pdfFont.lineGap;
  return {
    lineHeight: lineHeight * size,
    lineGap: lineGap * size,
    lineNoGap: Math.max(1, lineHeight - lineGap) * size,
  };
}
/*80--------------------------------------------------------------------------*/
