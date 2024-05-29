/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/unicode.ts
 * @license Apache-2.0
 ******************************************************************************/
export declare function mapSpecialUnicodeValues(code: number): number;
export declare function getUnicodeForGlyph(name: string, glyphsUnicodeMap: Record<string, number>): number;
export declare function getUnicodeRangeFor(value: number, lastPosition?: number): number;
export interface CharUnicodeCategory {
    isWhitespace: boolean;
    isZeroWidthDiacritic: boolean;
    isInvisibleFormatMark: boolean;
}
export declare function getCharUnicodeCategory(char: string): CharUnicodeCategory;
export declare function clearUnicodeCaches(): void;
//# sourceMappingURL=unicode.d.ts.map