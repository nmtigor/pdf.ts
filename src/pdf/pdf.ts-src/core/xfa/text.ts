/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

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

import { type XFAFontBase, type XFAMargin } from "./alias.ts";
import { FontFinder, selectFont } from "./fonts.ts";
/*80--------------------------------------------------------------------------*/

const WIDTH_FACTOR = 1.02;

class FontInfo {
  lineHeight;
  paraMargin;

  pdfFont;
  xfaFont;

  constructor(
    xfaFont: XFAFontBase | undefined,
    margin: XFAMargin | undefined,
    lineHeight: string | number | undefined,
    fontFinder: FontFinder | undefined,
  ) {
    this.lineHeight = lineHeight;
    this.paraMargin = margin || {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    };

    if (!xfaFont) {
      [this.pdfFont, this.xfaFont] = this.defaultFont(fontFinder!);
      return;
    }

    this.xfaFont = {
      typeface: xfaFont.typeface,
      posture: xfaFont.posture,
      weight: xfaFont.weight,
      size: xfaFont.size,
      letterSpacing: xfaFont.letterSpacing,
    };
    const typeface = fontFinder!.find(xfaFont.typeface!);
    if (!typeface) {
      [this.pdfFont, this.xfaFont] = this.defaultFont(fontFinder!);
      return;
    }

    this.pdfFont = selectFont(xfaFont, typeface);

    if (!this.pdfFont) {
      [this.pdfFont, this.xfaFont] = this.defaultFont(fontFinder!);
    }
  }

  defaultFont(fontFinder: FontFinder) {
    // TODO: Add a default font based on Liberation.
    const font = fontFinder.find("Helvetica", false) ||
      fontFinder.find("Myriad Pro", false) ||
      fontFinder.find("Arial", false) ||
      fontFinder.getDefault();
    if (font?.regular) {
      const pdfFont = font.regular;
      const info = pdfFont.cssFontInfo!;
      const xfaFont: XFAFontBase = {
        typeface: info.fontFamily,
        posture: "normal",
        weight: "normal",
        size: 10,
        letterSpacing: 0,
      };
      return [pdfFont, xfaFont] as const;
    }

    const xfaFont: XFAFontBase = {
      typeface: "Courier",
      posture: "normal",
      weight: "normal",
      size: 10,
      letterSpacing: 0,
    };
    return [undefined, xfaFont] as const;
  }
}

class FontSelector {
  fontFinder;
  stack;

  constructor(
    defaultXfaFont: XFAFontBase | undefined,
    defaultParaMargin: XFAMargin | undefined,
    defaultLineHeight: string | number | undefined,
    fontFinder: FontFinder | undefined,
  ) {
    this.fontFinder = fontFinder;
    this.stack = [
      new FontInfo(
        defaultXfaFont,
        defaultParaMargin,
        defaultLineHeight,
        fontFinder,
      ),
    ];
  }

  pushData(
    xfaFont: XFAFontBase,
    margin: XFAMargin,
    lineHeight?: string | number,
  ) {
    const lastFont = this.stack.at(-1)!;
    for (
      const name of [
        "typeface",
        "posture",
        "weight",
        "size",
        "letterSpacing",
      ] as const
    ) {
      if (!xfaFont[name]) {
        (<any> xfaFont)[name] = lastFont.xfaFont[name];
      }
    }

    for (const name of ["top", "bottom", "left", "right"] as const) {
      if (isNaN(margin[name])) {
        margin[name] = lastFont.paraMargin[name];
      }
    }

    const fontInfo = new FontInfo(
      xfaFont,
      margin,
      lineHeight || lastFont.lineHeight,
      this.fontFinder,
    );
    if (!fontInfo.pdfFont) {
      fontInfo.pdfFont = lastFont.pdfFont;
    }

    this.stack.push(fontInfo);
  }

  popFont() {
    this.stack.pop();
  }

  topFont() {
    return this.stack.at(-1);
  }
}

type XFAGlyph = [
  glyphWidth: number,
  lineHeight: number,
  firstLineHeight: number,
  char: string,
  isEOL: boolean,
];

/**
 * Compute a text area dimensions based on font metrics.
 */
export class TextMeasure {
  glyphs: XFAGlyph[] = [];
  fontSelector;
  extraHeight = 0;

  constructor(
    defaultXfaFont: XFAFontBase | undefined,
    defaultParaMargin: XFAMargin | undefined,
    defaultLineHeight: string | number | undefined,
    fonts: FontFinder | undefined,
  ) {
    this.fontSelector = new FontSelector(
      defaultXfaFont,
      defaultParaMargin,
      defaultLineHeight,
      fonts,
    );
  }

  pushData(
    xfaFont: XFAFontBase,
    margin: XFAMargin,
    lineHeight?: string | number,
  ) {
    this.fontSelector.pushData(xfaFont, margin, lineHeight);
  }

  popFont(xfaFont?: XFAFontBase) {
    return this.fontSelector.popFont();
  }

  addPara() {
    const lastFont = this.fontSelector.topFont()!;
    this.extraHeight += lastFont.paraMargin.top + lastFont.paraMargin.bottom;
  }

  addString(str: string) {
    if (!str) return;

    const lastFont = this.fontSelector.topFont()!;
    const fontSize = lastFont.xfaFont.size;
    if (lastFont.pdfFont) {
      const letterSpacing = lastFont.xfaFont.letterSpacing;
      const pdfFont = lastFont.pdfFont;
      const fontLineHeight = pdfFont.lineHeight || 1.2;
      const lineHeight = lastFont.lineHeight ||
        Math.max(1.2, fontLineHeight) * fontSize!;
      const lineGap = pdfFont.lineGap === undefined ? 0.2 : pdfFont.lineGap;
      const noGap = fontLineHeight - lineGap;
      const firstLineHeight = Math.max(1, noGap) * fontSize!;
      const scale = fontSize! / 1000;
      const fallbackWidth = pdfFont.defaultWidth ||
        pdfFont.charsToGlyphs(" ")[0].width;

      for (const line of str.split(/[\u2029\n]/)) {
        const encodedLine = pdfFont.encodeString(line).join("");
        const glyphs = pdfFont.charsToGlyphs(encodedLine);

        for (const glyph of glyphs) {
          const width = glyph.width || fallbackWidth;
          this.glyphs.push([
            width! * scale + letterSpacing!,
            +lineHeight,
            firstLineHeight,
            glyph.unicode,
            false,
          ]);
        }

        this.glyphs.push([0, 0, 0, "\n", true]);
      }
      this.glyphs.pop();
      return;
    }

    // When we have no font in the pdf, just use the font size as default width.
    for (const line of str.split(/[\u2029\n]/)) {
      for (const char of line.split("")) {
        this.glyphs.push([fontSize!, 1.2 * fontSize!, fontSize!, char, false]);
      }

      this.glyphs.push([0, 0, 0, "\n", true]);
    }
    this.glyphs.pop();
  }

  compute(maxWidth: number) {
    let lastSpacePos = -1,
      lastSpaceWidth = 0,
      width = 0,
      height = 0,
      currentLineWidth = 0,
      currentLineHeight = 0;
    let isBroken = false;
    let isFirstLine = true;

    for (let i = 0, ii = this.glyphs.length; i < ii; i++) {
      const [glyphWidth, lineHeight, firstLineHeight, char, isEOL] =
        this.glyphs[i];
      const isSpace = char === " ";
      const glyphHeight = isFirstLine ? firstLineHeight : lineHeight;
      if (isEOL) {
        width = Math.max(width, currentLineWidth);
        currentLineWidth = 0;
        height += currentLineHeight;
        currentLineHeight = +glyphHeight;
        lastSpacePos = -1;
        lastSpaceWidth = 0;
        isFirstLine = false;
        continue;
      }

      if (isSpace) {
        if (currentLineWidth + glyphWidth > maxWidth) {
          // We can break here but the space is not taken into account.
          width = Math.max(width, currentLineWidth);
          currentLineWidth = 0;
          height += currentLineHeight;
          currentLineHeight = +glyphHeight;
          lastSpacePos = -1;
          lastSpaceWidth = 0;
          isBroken = true;
          isFirstLine = false;
        } else {
          currentLineHeight = Math.max(+glyphHeight, currentLineHeight);
          lastSpaceWidth = currentLineWidth;
          currentLineWidth += glyphWidth;
          lastSpacePos = i;
        }
        continue;
      }

      if (currentLineWidth + glyphWidth > maxWidth) {
        // We must break to the last white position (if available)
        height += currentLineHeight;
        currentLineHeight = +glyphHeight;
        if (lastSpacePos !== -1) {
          i = lastSpacePos;
          width = Math.max(width, lastSpaceWidth);
          currentLineWidth = 0;
          lastSpacePos = -1;
          lastSpaceWidth = 0;
        } else {
          // Just break in the middle of the word
          width = Math.max(width, currentLineWidth);
          currentLineWidth = glyphWidth;
        }
        isBroken = true;
        isFirstLine = false;

        continue;
      }

      currentLineWidth += glyphWidth;
      currentLineHeight = Math.max(+glyphHeight, currentLineHeight);
    }

    width = Math.max(width, currentLineWidth);
    height += currentLineHeight + this.extraHeight;

    return { width: WIDTH_FACTOR * width, height, isBroken };
  }
}
/*80--------------------------------------------------------------------------*/
