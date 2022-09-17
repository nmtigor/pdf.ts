import { CFF } from "./cff_parser.js";
import { type FontProps } from "./evaluator.js";
import { Stream } from "./stream.js";
export declare class CFFFont {
    properties: FontProps;
    cff: CFF;
    seacs: number[][] | undefined;
    data: number[] | Stream;
    constructor(file: Stream, properties: FontProps);
    get numGlyphs(): number;
    getCharset(): string[];
    getGlyphMapping(): Record<number, string | number>;
    hasGlyphId(id: number): boolean;
    /**
     * @private
     */
    _createBuiltInEncoding(): void;
}
//# sourceMappingURL=cff_font.d.ts.map