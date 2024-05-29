/** 80**************************************************************************
 * @module lib/color/Colr
 * @license Apache-2.0
 ******************************************************************************/
import type { Ratio } from "../alias.js";
import "../jslang.js";
import { Moo, type MooHandler } from "../Moo.js";
import type { alpha_t, chroma_t, Cssc, CsscHexNorm, CsscName, CsscRGB, hue_t, red_t, rgba_t, RRGGBB, tone_t } from "./alias.js";
/** "#123" */
type RGB_ = string;
/** "#1234" */
type RGBA_ = string;
type CsscHex_ = RGB_ | RGBA_ | CsscHexNorm;
export type ColranTyp = "rgb" | "rgba" | "hct" | "hcta";
type ColrTyp_ = ColranTyp | "hex" | "name";
/** @final */
export declare class Colr {
    #private;
    readonly id: number;
    protected get mo$(): Moo<this, any>;
    /**
     * @const @param typ_x
     * @const @param dat_x
     */
    constructor(typ_x?: ColrTyp_, ...dat_x: [CsscHex_] | rgba_t | [hue_t, chroma_t, tone_t, alpha_t?] | [CsscName] | []);
    /**
     * `in( isValidCssc(cssc_x) )`
     * @const @param cssc_x
     *    Notice, e.g. "rgb(25,55,55,.3)" rather than "rgb(25 55 55 /.3)"
     */
    setByCssc(cssc_x: Cssc): this;
    setByCsscMo(cssc_x: Cssc): this;
    /**
     * @const @param colr_x
     */
    setByColr(colr_x: Colr): this;
    setByColrMo(colr_x: Colr): this;
    dup(): Colr;
    get hex(): string;
    eq(rhs: Colr): boolean;
    get red(): red_t;
    get green(): red_t;
    get blue(): red_t;
    get hue(): hue_t;
    get chroma(): chroma_t;
    get tone(): tone_t;
    get alpha(): alpha_t;
    /**
     * ! Alpha channel is ignored
     */
    get name(): CsscName | undefined;
    /**
     * "r50"\
     * Keep `#alpha` unchanged\
     * `in( zRed.parse(val_x) )`
     * @const @param val_x
     */
    setRed(val_x: red_t): this;
    setRedMo(val_x: red_t): this;
    SetRed(val_x: red_t): Colr;
    /**
     * "g50"\
     * Keep `#alpha` unchanged\
     * `in( zRed.parse(val_x) )`
     * @const @param val_x
     */
    setGreen(val_x: red_t): this;
    setGreenMo(val_x: red_t): this;
    SetGreen(val_x: red_t): Colr;
    /**
     * "b50"\
     * Keep `#alpha` unchanged\
     * `in( zRed.parse(val_x) )`
     * @const @param val_x
     */
    setBlue(val_x: red_t): this;
    setBlueMo(val_x: red_t): this;
    SetBlue(val_x: red_t): Colr;
    /**
     * "h50"\
     * Keep `#alpha` unchanged\
     * `in( zHue.parse(val_x) )`
     * @const @param val_x
     */
    setHue(val_x: hue_t): this;
    setHueMo(val_x: hue_t): this;
    SetHue(val_x: hue_t): Colr;
    /**
     * "c50"\
     * Keep `#alpha` unchanged\
     * `in( zChroma.parse(val_x) )`
     * @const @param val_x
     */
    setChroma(val_x: chroma_t): this;
    setChromaMo(val_x: chroma_t): this;
    SetChroma(val_x: chroma_t): Colr;
    /**
     * "t50"\
     * Keep `#alpha` unchanged\
     * `in( zTone.parse(val_x) )`
     * @const @param val_x
     */
    setTone(val_x: tone_t): this;
    setToneMo(val_x: tone_t): this;
    SetTone(val_x: tone_t): Colr;
    /**
     * ! Set hue or chroma or tone alone could change the other two.
     * @const @param h_x
     * @const @param c_x
     * @const @param t_x
     */
    setHCT(h_x: hue_t, c_x: chroma_t, t_x: tone_t): this;
    setHCTMo(h_x: hue_t, c_x: chroma_t, t_x: tone_t): this;
    SetHCT(h_x: hue_t, c_x: chroma_t, t_x: tone_t): Colr;
    /**
     * "a.5"\
     * ! `#name` is not affected\
     * `in( zAlpha.parse(val_x) )`
     * @const @param val_x
     */
    setAlpha(val_x: alpha_t): this;
    setAlphaMo(val_x: alpha_t): this;
    SetAlpha(val_x: alpha_t): Colr;
    /**
     * "c+.5"
     * Keep `#alpha` unchanged
     * @const @param ratio_x
     */
    enchroma(ratio_x: Ratio): this;
    Enchroma(ratio_x: Ratio): Colr;
    /**
     * "c-.5"
     * Keep `#alpha` unchanged
     * @const @param ratio_x
     */
    unchroma(ratio_x: Ratio): this;
    Unchroma(ratio_x: Ratio): Colr;
    /**
     * "t+.5"
     * Keep `#alpha` unchanged
     * @const @param ratio_x
     */
    entone(ratio_x: Ratio): this;
    Entone(ratio_x: Ratio): Colr;
    /**
     * "t-.5"
     * Keep `#alpha` unchanged
     * @const @param ratio_x
     */
    untone(ratio_x: Ratio): this;
    Untone(ratio_x: Ratio): Colr;
    get cssc(): Cssc;
    repr(typ_x: "hex" | "rgb" | "hct"): string;
    registHandler(handler_x: MooHandler<Colr>): void;
    removeHandler(handler_x: MooHandler<Colr>): void;
    refresh(): void;
}
export declare function isColr(obj: Object): boolean;
export declare function hexcolr(hexstr_x: CsscHex_): Colr;
export declare function rgb(r_x: red_t, g_x: red_t, b_x: red_t): Colr;
export declare function rgba(r_x: red_t, g_x: red_t, b_x: red_t, a_x: alpha_t): Colr;
export declare function hct(h_x: hue_t, c_x: chroma_t, t_x: tone_t): Colr;
export declare function hcta(h_x: hue_t, c_x: chroma_t, t_x: tone_t, a_x: alpha_t): Colr;
export declare function csscname(cn_x: CsscName): Colr;
/**
 * `in( isValidCssc(cssc_x) )`
 * @const @param cssc_x
 */
export declare function createColr(cssc_x?: Cssc): Colr;
export declare function randomRed(): number;
export declare function randomCsscRRR(): CsscRGB;
export declare function randomCsscRGB(): CsscRGB;
export declare function randomRRGGBB(): RRGGBB;
export declare const csscNameMap: {
    "__#165@#map": ReadonlyMap<CsscName, CsscHexNorm>;
    "__#165@#revmap": Map<CsscHexNorm, CsscName>;
    hasN(key: string): boolean;
    getX(key: CsscName): CsscHexNorm;
    getN(key: CsscHex_): CsscName | undefined;
};
export declare function csscLess(a_x: Cssc, b_x: Cssc): boolean;
export {};
//# sourceMappingURL=Colr.d.ts.map