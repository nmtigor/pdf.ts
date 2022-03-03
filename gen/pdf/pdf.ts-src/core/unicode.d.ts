export declare function mapSpecialUnicodeValues(code: number): number;
export declare function getUnicodeForGlyph(name: string, glyphsUnicodeMap: Record<string, number>): number;
export declare function getUnicodeRangeFor(value: number): number;
export declare const getNormalizedUnicodes: () => Record<string, number>;
export declare function reverseIfRtl(chars: string): string;
export declare function getCharUnicodeCategory(char: string): any;
export declare function clearUnicodeCaches(): void;
//# sourceMappingURL=unicode.d.ts.map