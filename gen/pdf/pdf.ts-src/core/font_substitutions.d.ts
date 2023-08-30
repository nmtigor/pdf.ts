import type { GlobalIdFactory } from "./document.js";
type Style_ = {
    style: "normal" | "italic";
    weight: string;
};
export type SubstitutionInfo = {
    css: string;
    guessFallback: boolean;
    loadedName: string;
    baseFontName: string;
    src: string;
    style: Style_ | undefined;
};
/**
 * Get a font substitution for a given font.
 * The general idea is to have enough information to create a CSS rule like
 * this:
 *   @font-face {
 *    font-family: 'Times';
 *    src: local('Times New Roman'), local('Subst1'), local('Subst2'),
 *         url(.../TimesNewRoman.ttf)
 *    font-weight: normal;
 *    font-style: normal;
 *   }
 * or use the FontFace API.
 *
 * @param systemFontCache The cache of local fonts.
 * @param idFactory The ids factory.
 * @param localFontPath Path to the fonts directory.
 * @param baseFontName The font name to be substituted.
 * @param standardFontName The standard font name to use
 *   if the base font is not available.
 * @return an Object with the CSS, the loaded name, the src and the style.
 */
export declare function getFontSubstitution(systemFontCache: Map<string, SubstitutionInfo>, idFactory: GlobalIdFactory, localFontPath: string | undefined, baseFontName: string, standardFontName: string | undefined): SubstitutionInfo | undefined;
export {};
//# sourceMappingURL=font_substitutions.d.ts.map