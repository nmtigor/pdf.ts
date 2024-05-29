/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/standard_fonts.ts
 * @license Apache-2.0
 ******************************************************************************/
/**
 * Hold a map of decoded fonts and of the standard fourteen Type1
 * fonts and their acronyms.
 */
export declare const getStdFontMap: () => Record<string, string>;
/**
 * Contains mapping for standard fonts and xfa fonts.
 */
export declare const getFontNameToFileMap: () => Record<string, string>;
/**
 * Holds the map of the non-standard fonts that might be included as
 * a standard fonts without glyph data.
 */
export declare const getNonStdFontMap: () => Record<string, string>;
export declare const getSerifFonts: () => Record<string, boolean>;
export declare const getSymbolsFonts: () => Record<string, boolean>;
/**
 * Glyph map for well-known standard fonts. Sometimes Ghostscript uses CID
 * fonts, but does not embed the CID to GID mapping. The mapping is incomplete
 * for all glyphs, but common for some set of the standard fonts.
 */
export declare const getGlyphMapForStandardFonts: () => Record<string, number>;
/**
 * The glyph map for ArialBlack differs slightly from the glyph map used for
 * other well-known standard fonts. Hence we use this (incomplete) CID to GID
 * mapping to adjust the glyph map for non-embedded ArialBlack fonts.
 */
export declare const getSupplementalGlyphMapForArialBlack: () => Record<number, number>;
/**
 * The glyph map for Calibri (a Windows font) differs from the glyph map used
 * in the standard fonts. Hence we use this (incomplete) CID to GID mapping to
 * adjust the glyph map for non-embedded Calibri fonts.
 */
export declare const getSupplementalGlyphMapForCalibri: () => Record<number, number>;
export declare function getStandardFontName(name: string): string;
export declare function isKnownFontName(name: string): boolean;
//# sourceMappingURL=standard_fonts.d.ts.map