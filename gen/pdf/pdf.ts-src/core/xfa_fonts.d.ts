/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/xfa_fonts.ts
 * @license Apache-2.0
 ******************************************************************************/
import { Dict } from "./primitives.js";
export interface XFAFontMetrics {
    lineHeight: number;
    lineGap: number;
    lineNoGap?: number;
}
interface XFAFontMap {
    name: string;
    factors?: number[];
    baseWidths: number[];
    baseMapping: number[];
    metrics?: XFAFontMetrics;
}
export declare function getXfaFontName(name: string): XFAFontMap;
export declare function getXfaFontWidths(name: string): (number | number[])[] | undefined;
export declare function getXfaFontDict(name: string): Dict;
export {};
//# sourceMappingURL=xfa_fonts.d.ts.map