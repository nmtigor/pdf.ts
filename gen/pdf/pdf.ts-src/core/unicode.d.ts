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