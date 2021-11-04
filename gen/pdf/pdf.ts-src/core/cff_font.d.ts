import { CFF } from "./cff_parser.js";
import { BaseStream } from "./base_stream.js";
import { FontProps } from "./evaluator.js";
export declare class CFFFont {
    properties: FontProps;
    cff: CFF;
    seacs: number[][] | undefined;
    data: number[] | BaseStream;
    constructor(file: BaseStream, properties: FontProps);
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