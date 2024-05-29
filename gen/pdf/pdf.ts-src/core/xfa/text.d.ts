/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/xfa/text.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { XFAFontBase, XFAMargin } from "./alias.js";
import { type FontFinder } from "./fonts.js";
declare class FontInfo {
    lineHeight: string | number | undefined;
    paraMargin: XFAMargin;
    pdfFont: import("../fonts.js").Font | import("../fonts.js").ErrorFont | undefined;
    xfaFont: XFAFontBase | {
        typeface: string | undefined;
        posture: string | undefined;
        weight: string | undefined;
        size: number | undefined;
        letterSpacing: number | undefined;
    };
    constructor(xfaFont: XFAFontBase | undefined, margin: XFAMargin | undefined, lineHeight: string | number | undefined, fontFinder: FontFinder | undefined);
    defaultFont(fontFinder: FontFinder): readonly [import("../fonts.js").Font | import("../fonts.js").ErrorFont, XFAFontBase] | readonly [undefined, XFAFontBase];
}
declare class FontSelector {
    fontFinder: FontFinder | undefined;
    stack: FontInfo[];
    constructor(defaultXfaFont: XFAFontBase | undefined, defaultParaMargin: XFAMargin | undefined, defaultLineHeight: string | number | undefined, fontFinder: FontFinder | undefined);
    pushData(xfaFont: XFAFontBase, margin: XFAMargin, lineHeight?: string | number): void;
    popFont(): void;
    topFont(): FontInfo | undefined;
}
type XFAGlyph = [
    glyphWidth: number,
    lineHeight: number,
    firstLineHeight: number,
    char: string,
    isEOL: boolean
];
/**
 * Compute a text area dimensions based on font metrics.
 */
export declare class TextMeasure {
    glyphs: XFAGlyph[];
    fontSelector: FontSelector;
    extraHeight: number;
    constructor(defaultXfaFont: XFAFontBase | undefined, defaultParaMargin: XFAMargin | undefined, defaultLineHeight: string | number | undefined, fonts: FontFinder | undefined);
    pushData(xfaFont: XFAFontBase, margin: XFAMargin, lineHeight?: string | number): void;
    popFont(xfaFont?: XFAFontBase): void;
    addPara(): void;
    addString(str: string): void;
    compute(maxWidth: number): {
        width: number;
        height: number;
        isBroken: boolean;
    };
}
export {};
//# sourceMappingURL=text.d.ts.map