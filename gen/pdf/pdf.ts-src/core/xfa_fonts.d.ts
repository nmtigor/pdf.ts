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