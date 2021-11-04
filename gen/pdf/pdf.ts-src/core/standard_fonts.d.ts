/**
 * Hold a map of decoded fonts and of the standard fourteen Type1
 * fonts and their acronyms.
 */
export declare const getStdFontMap: () => Record<string, string>;
export declare const getFontNameToFileMap: () => Record<string, string>;
/**
 * Holds the map of the non-standard fonts that might be included as
 * a standard fonts without glyph data.
 */
export declare const getNonStdFontMap: () => Record<string, string>;
export declare const getSerifFonts: () => Record<string, boolean>;
export declare const getSymbolsFonts: () => Record<string, boolean>;
export declare const getGlyphMapForStandardFonts: () => Record<string, number>;
export declare const getSupplementalGlyphMapForArialBlack: () => Record<number, number>;
export declare const getSupplementalGlyphMapForCalibri: () => Record<number, number>;
export declare function getStandardFontName(name: string): string;
//# sourceMappingURL=standard_fonts.d.ts.map