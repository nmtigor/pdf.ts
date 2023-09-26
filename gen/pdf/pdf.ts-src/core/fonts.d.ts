import type { C2D, dot2d_t, rect_t } from "../../../lib/alias.js";
import type { matrix_t } from "../shared/util.js";
import type { BaseStream } from "./base_stream.js";
import { CFFFont } from "./cff_font.js";
import type { CMap } from "./cmap.js";
import type { CssFontInfo } from "./document.js";
import type { FontProps, VMetric } from "./evaluator.js";
import type { SubstitutionInfo } from "./font_substitutions.js";
import type { OpListIR } from "./operator_list.js";
import { Stream } from "./stream.js";
import { IdentityToUnicodeMap, ToUnicodeMap } from "./to_unicode_map.js";
import { Type1Font } from "./type1_font.js";
import { type CharUnicodeCategory } from "./unicode.js";
export declare abstract class FontExpotData {
    name: string;
    loadedName: string | undefined;
    fallbackName: string;
    psName: string | undefined;
    type: string;
    subtype?: string | undefined;
    composite?: boolean | undefined;
    ascent: number;
    descent: number;
    lineGap?: number;
    lineHeight?: number;
    bbox?: rect_t | undefined;
    black?: boolean;
    bold?: boolean;
    charProcOperatorList?: Record<string, OpListIR>;
    data: Uint8Array | undefined;
    defaultWidth?: number;
    fontMatrix?: matrix_t | undefined;
    isMonospace: boolean;
    isSerifFont: boolean;
    isType3Font?: boolean | undefined;
    isInvalidPDFjsFont?: boolean;
    italic?: boolean;
    mimetype?: string;
    missingFile: boolean;
    remeasure?: boolean;
    vertical?: boolean;
    defaultVMetrics?: VMetric | undefined;
    cssFontInfo?: CssFontInfo | undefined;
    systemFontInfo: SubstitutionInfo | undefined;
}
export declare abstract class FontExpotDataEx extends FontExpotData {
    differences?: string[] | undefined;
    widths?: Record<string | number, number> | undefined;
    cMap?: CMap | undefined;
    defaultEncoding?: string[] | undefined;
    isSymbolicFont: boolean;
    seacMap?: Seac[] | undefined;
    toFontChar: number[];
    vmetrics?: VMetric[] | undefined;
    toUnicode?: IdentityToUnicodeMap | ToUnicodeMap | undefined;
}
interface Accent {
    fontChar: string;
    offset: {
        x: number;
        y: number;
    };
}
export declare class Glyph {
    originalCharCode: number;
    fontChar: string;
    unicode: string;
    accent: Accent | undefined;
    width: number | undefined;
    vmetric: VMetric | undefined;
    operatorListId: number | undefined;
    isSpace: boolean;
    isInFont: boolean;
    compiled?: ((c: C2D) => void) | undefined;
    constructor(originalCharCode: number, fontChar: string, unicode: string, accent: Accent | undefined, width: number | undefined, vmetric: VMetric | undefined, operatorListId: number | undefined, isSpace: boolean, isInFont: boolean);
    /**
     * This property, which is only used by `PartialEvaluator.getTextContent`,
     * is purposely made non-serializable.
     */
    get category(): CharUnicodeCategory;
}
export interface Seac {
    baseFontCharCode: number;
    accentFontCharCode: number;
    accentOffset: {
        x: number;
        y: number;
    };
}
/**
 * 'Font' is the class the outside world should use, it encapsulate all the font
 * decoding logics whatever type it is (assuming the font type is supported).
 */
export declare class Font extends FontExpotDataEx {
    #private;
    disableFontFace: boolean;
    _charsCache: Record<string, Glyph[]>;
    _glyphCache: Glyph[];
    capHeight: number;
    cidEncoding: string | undefined;
    charsCache?: Record<string, Glyph[]>;
    isOpenType?: boolean;
    isCharBBox?: boolean;
    glyphNameMap?: Record<string, string | number>;
    constructor(name: string, file: Stream | undefined, properties: FontProps);
    get renderer(): import("./font_renderer.js").TrueTypeCompiled | import("./font_renderer.js").Type2Compiled;
    exportData(extraProperties?: boolean): FontExpotDataEx;
    fallbackToSystemFont(properties: FontProps): void;
    checkAndRepair(name: string, font: BaseStream, properties: FontProps): Uint8Array;
    convert(fontName: string, font: CFFFont | Type1Font, properties: FontProps): Uint8Array;
    get spaceWidth(): number | undefined;
    charsToGlyphs(chars: string): Glyph[];
    /**
     * Chars can have different sizes (depends on the encoding).
     * @param a string encoded with font encoding.
     * @return the positions of each char in the string.
     */
    getCharPositions(chars: string): dot2d_t[];
    get glyphCacheValues(): Glyph[];
    /**
     * Encode a js string using font encoding.
     * The resulting array contains an encoded string at even positions
     * (can be empty) and a non-encoded one at odd positions.
     * @param a js string.
     * @return an array of encoded strings or non-encoded ones.
     */
    encodeString(str: string): string[];
}
export declare class ErrorFont extends FontExpotData {
    error: string;
    loadedName: string;
    missingFile: boolean;
    constructor(error: string);
    get spaceWidth(): number;
    charsToGlyphs(): never[];
    getCharPositions(chars: string): [number, number][];
    encodeString(chars: string): string[];
    exportData(extraProperties?: boolean): {
        error: string;
    };
}
export {};
//# sourceMappingURL=fonts.d.ts.map