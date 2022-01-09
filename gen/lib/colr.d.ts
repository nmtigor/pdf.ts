import { uint8, Ratio } from "./alias.js";
declare type CsscHex = string; /** "#123" or "#1234" or "#123456" or "#12345678" */
declare type CsscRGB = string; /** "rgb(25, 55, 55)" */
declare type CsscRGBA = string; /** "rgb(25, 55, 55, .3)" */
declare type CsscHSL = string; /** "hsl(120, 60%, 10%)" */
declare type CsscHSLA = string; /** "hsl(120, 60%, 10%, .7)" */
declare type ColrTyp = "hex" | "rgb" | "rgba" | "hsl" | "hsla" | "name";
export declare type X_t = CsscHex; /** normalized CsscHex, i.e., "#12abc6" or "#12abc678" */
declare type R_t = uint8;
declare type G_t = uint8;
declare type B_t = uint8;
declare type H_t = number;
declare type S_t = number;
declare type L_t = number;
declare type A_t = Ratio;
/**
 * css color string excluding `currentcolor`
 * ref. https://www.w3schools.com/cssref/css_colors_legal.asp
 */
export declare type Cssc = CsscHex | CsscRGB | CsscRGBA | CsscHSL | CsscHSLA | CsscName;
/** @final */
export declare class Colr {
    #private;
    /**
     * @param { const } typ_x
     * @param { const } dat_x
     */
    constructor(typ_x?: ColrTyp, ...dat_x: [(CsscHex | R_t | H_t | CsscName)?, (G_t | S_t)?, (B_t | L_t)?, A_t?]);
    /**
     * in( isValidCssc(cssc) );
     * @param { const } cssc
     */
    set_by_s(cssc: Cssc): this;
    /**
     * in( colr );
     * @param { const } colr
     */
    set_by_c(colr: Colr): this;
    dup(): Colr;
    get x(): X_t;
    eq(rhs: Colr): boolean;
    get r(): R_t;
    get g(): G_t;
    get b(): B_t;
    get h(): H_t;
    get s(): S_t;
    get l(): L_t;
    get a(): A_t;
    get name(): CsscName | undefined;
    /**
     * "n"
     */
    negate(): this;
    get isdark(): boolean;
    get isligt(): boolean;
    /**
     * "l+.5"
     * @param { const } ratio_x
     */
    ligten(ratio_x: Ratio): this;
    /**
     * "l-.5"
     * @param { const } ratio_x
     */
    darken(ratio_x: Ratio): this;
    /**
     * "s+.5"
     * @param { const } ratio_x
     */
    saturate(ratio_x: Ratio): this;
    /**
     * "s-.5"
     * @param { const } ratio_x
     */
    desaturate(ratio_x: Ratio): this;
    /**
     * "r50"
     * in( 0 <= val_x && val_x < 256 )
     * @param { const } val_x - [0,255]
     */
    setR(val_x: R_t): this;
    /**
     * "g50"
     * in( 0 <= val_x && val_x < 256 )
     * @param { const } val_x - [0,255]
     */
    setG(val_x: G_t): this;
    /**
     * "b50"
     * in( 0 <= val_x && val_x < 256 )
     * @param { const } val_x - [0,255]
     */
    setB(val_x: B_t): this;
    /**
     * "h50"
     * in( 0 <= val_x && val_x < 360 )
     * @param { const } val_x - [0,360)
     */
    setH(val_x: H_t): this;
    /**
     * "s50"
     * in( 0 <= val_x && val_x <= 100 )
     * @param { const } val_x - [0,100]
     */
    setS(val_x: S_t): this;
    /**
     * "l50"
     * in( 0 <= val_x && val_x <= 100 )
     * @param { const } val_x - [0,100]
     */
    setL(val_x: L_t): this;
    /**
     * "a.5"
     * in( 0 <= val_x && val_x <= 1 )
     * @param { const } val_x
     */
    setA(val_x: A_t): this;
    get cssc(): Cssc;
}
export declare function isColr(obj: Object): boolean;
/**
 * (L1 + 0.05) / (L2 + 0.05)
 * Ref. "contrast ratio" in https://www.w3.org/TR/WCAG20/#glossary
 * in( isColr(colr1) )
 * in( isColr(colr2) )
 * @param { headconst } colr1
 * @param { headconst } colr2
 * @return (0,1]
 */
export declare function contrastRatioOf(colr1: Colr, colr2: Colr): number;
/**
 * @param { const } cssc
 */
export declare function isValidCssc(cssc: string): Cssc | false;
export declare function hexcolr(hexstr: CsscHex): Colr;
export declare function rgb(r: R_t, g: G_t, b: B_t): Colr;
export declare function rgba(r: R_t, g: G_t, b: B_t, a: A_t): Colr;
export declare function hsl(h: H_t, s: S_t, l: L_t): Colr;
export declare function hsla(h: H_t, s: S_t, l: L_t, a: A_t): Colr;
export declare function csscname(cn: CsscName): Colr;
/**
 * in( isValidCssc(cssc) )
 * @param { const } cssc
 */
export declare function createColr(cssc?: Cssc): Colr;
/**
 * Ref. https://www.w3schools.com/colors/colors_groups.asp
 */
declare type CsscName = "pink" | "lightpink" | "hotpink" | "deeppink" | "palevioletred" | "mediumvioletred" | "lavender" | "thistle" | "plum" | "orchid" | "violet" | "fuchsia" | "magenta" | "mediumorchid" | "darkorchid" | "darkviolet" | "blueviolet" | "darkmagenta" | "purple" | "mediumpurple" | "mediumslateblue" | "slateblue" | "darkslateblue" | "rebeccapurple" | "indigo" | "lightsalmon" | "salmon" | "darksalmon" | "lightcoral" | "indianred" | "crimson" | "red" | "firebrick" | "darkred" | "orange" | "darkorange" | "coral" | "tomato" | "orangered" | "gold" | "yellow" | "lightyellow" | "lemonchiffon" | "lightgoldenrodyellow" | "papayawhip" | "moccasin" | "peachpuff" | "palegoldenrod" | "khaki" | "darkkhaki" | "greenyellow" | "chartreuse" | "lawngreen" | "lime" | "limegreen" | "palegreen" | "lightgreen" | "mediumspringgreen" | "springgreen" | "mediumseagreen" | "seagreen" | "forestgreen" | "green" | "darkgreen" | "yellowgreen" | "olivedrab" | "darkolivegreen" | "mediumaquamarine" | "darkseagreen" | "lightseagreen" | "darkcyan" | "teal" | "aqua" | "cyan" | "lightcyan" | "paleturquoise" | "aquamarine" | "turquoise" | "mediumturquoise" | "darkturquoise" | "cadetblue" | "steelblue" | "lightsteelblue" | "lightblue" | "powderblue" | "lightskyblue" | "skyblue" | "cornflowerblue" | "deepskyblue" | "dodgerblue" | "royalblue" | "blue" | "mediumblue" | "darkblue" | "navy" | "midnightblue" | "cornsilk" | "blanchedalmond" | "bisque" | "navajowhite" | "wheat" | "burlywood" | "tan" | "rosybrown" | "sandybrown" | "goldenrod" | "darkgoldenrod" | "peru" | "chocolate" | "olive" | "saddlebrown" | "sienna" | "brown" | "maroon" | "white" | "snow" | "honeydew" | "mintcream" | "azure" | "aliceblue" | "ghostwhite" | "whitesmoke" | "seashell" | "beige" | "oldlace" | "floralwhite" | "ivory" | "antiquewhite" | "linen" | "lavenderblush" | "mistyrose" | "gainsboro" | "lightgray" | "silver" | "darkgray" | "dimgray" | "gray" | "lightslategray" | "slategray" | "darkslategray" | "black";
/** @final */
declare class CsscNameMap {
    #private;
    constructor(marg: any);
    hasN(key: string): boolean;
    getX(key: CsscName): X_t | undefined;
    getN(key: CsscHex): CsscName | undefined;
}
export declare const csscname_m: CsscNameMap;
export {};
//# sourceMappingURL=colr.d.ts.map