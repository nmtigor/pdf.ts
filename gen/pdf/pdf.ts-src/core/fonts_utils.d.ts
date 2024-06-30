/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/fonts_utils.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { FontProps } from "./evaluator.js";
export declare const SEAC_ANALYSIS_ENABLED = true;
export declare const enum FontFlags {
    unknown = 0,
    FixedPitch = 1,
    Serif = 2,
    Symbolic = 4,
    Script = 8,
    Nonsymbolic = 32,
    Italic = 64,
    AllCap = 65536,
    SmallCap = 131072,
    ForceBold = 262144
}
export declare const MacStandardGlyphOrdering: string[];
export declare function recoverGlyphName(name: string, glyphsUnicodeMap: Record<string, number>): string;
/**
 * Shared logic for building a char code to glyph id mapping for Type1 and
 * simple CFF fonts. See section 9.6.6.2 of the spec.
 * @param properties Font properties object.
 * @param builtInEncoding The encoding contained within the actual font data.
 * @param glyphNames Array of glyph names where the index is the glyph ID.
 * @return A char code to glyph ID map.
 */
export declare function type1FontGlyphMapping(properties: FontProps, builtInEncoding: (number | string)[] | undefined, glyphNames: (string | number)[]): Record<number, string | number>;
export declare function normalizeFontName(name: string): string;
//# sourceMappingURL=fonts_utils.d.ts.map