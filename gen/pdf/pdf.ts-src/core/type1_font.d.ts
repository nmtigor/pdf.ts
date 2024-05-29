/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/type1_font.ts
 * @license Apache-2.0
 ******************************************************************************/
import { type FontProps } from "./evaluator.js";
import { Stream } from "./stream.js";
import { type CharStringObject } from "./type1_parser.js";
/**
 * Type1Font is also a CIDFontType0.
 */
export declare class Type1Font {
    charstrings: CharStringObject[];
    get numGlyphs(): number;
    data: number[];
    seacs: number[][];
    constructor(name: string, file: Stream, properties: FontProps);
    getCharset(): string[];
    getGlyphMapping(properties: FontProps): any;
    hasGlyphId(id: number): boolean;
    getSeacs(charstrings: CharStringObject[]): number[][];
    getType2Charstrings(type1Charstrings: CharStringObject[]): number[][];
    getType2Subrs(type1Subrs: number[][]): number[][];
    wrap(name: string, glyphs: number[][], charstrings: CharStringObject[], subrs: number[][], properties: FontProps): number[];
}
//# sourceMappingURL=type1_font.d.ts.map