/** 80**************************************************************************
 * @module lib/alias
 * @license Apache-2.0
 ******************************************************************************/
export type int = number;
export declare const zInt: import("../3rd/zod-3.22.2/lib/index.mjs").ZodNumber;
export type uint = number;
export declare const zUint: import("../3rd/zod-3.22.2/lib/index.mjs").ZodNumber;
export type int64 = int;
export type int32 = int;
export type int16 = int;
export type int8 = int;
export type uint64 = uint;
export type uint32 = uint;
export type uint16 = uint;
export declare const zUint16: import("../3rd/zod-3.22.2/lib/index.mjs").ZodNumber;
export type uint8 = uint;
export declare const zUint8: import("../3rd/zod-3.22.2/lib/index.mjs").ZodNumber;
export type unum = number;
export declare const zUnum: import("../3rd/zod-3.22.2/lib/index.mjs").ZodNumber;
/** 0 is special */
export type id_t = uint;
export declare const zId: import("../3rd/zod-3.22.2/lib/index.mjs").ZodNumber;
/** Count one "\t" as 1 */
export type llen_t = uint32;
export type loff_t = int32;
export declare const loff_UNDEFINED: llen_t;
export declare const llen_MAX: llen_t;
/** Count one "\t" as e.g. 2, 4, 8 */
export type lcol_t = llen_t;
export type lnum_t = uint32;
export declare const lnum_MAX: lnum_t;
/** Type of unix timestamp */
export type ts_t = int64;
export declare const zTs: import("../3rd/zod-3.22.2/lib/index.mjs").ZodNumber;
/** Recommand [0,1] */
export type Ratio = number;
export declare const zRatio: import("../3rd/zod-3.22.2/lib/index.mjs").ZodNumber;
/**
 * Dull string
 * String of characters 0x20 ~ 0x0_126
 */
export type Dulstr = string;
/**
 * Type of `"(😄)"[0]`, `"(😄)"[1]`, `"(😄)"[2]`, etc
 */
export type UChr = string;
/**
 * Type of each element of `[..."(😄)"]`
 */
export type Chr = string;
/**
 * Ref. http://www.unicode.org/reports/tr9/#Table_Bidirectional_Character_Types
 */
export declare enum ChrTyp {
    L = 1,
    R = 2,
    AL = 4,
    EN = 8,
    ES = 16,
    ET = 32,
    AN = 64,
    CS = 128,
    NSM = 256,
    BN = 512,
    B = 1024,
    S = 2048,
    WS = 4096,
    ON = 8192,
    LRE = 16384,
    LRO = 32768,
    RLE = 65536,
    RLO = 131072,
    PDF = 262144,
    LRI = 524288,
    RLI = 1048576,
    FSI = 2097152,
    PDI = 4194304
}
export type ChrTypName = keyof typeof ChrTyp;
export type dot2d_t = [x: number, y: number];
export type dim2d_t = [widt: number, high: number];
export type rect_t = TupleOf<number, 4>;
export type IntegerArray = Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array;
export type FloatArray = Float32Array | Float64Array;
export type TypedArray = IntegerArray | FloatArray;
export type C2D = CanvasRenderingContext2D;
export declare const C2D: {
    new (): CanvasRenderingContext2D;
    prototype: CanvasRenderingContext2D;
};
export type OC2D = OffscreenCanvasRenderingContext2D;
export declare const OC2D: {
    new (): OffscreenCanvasRenderingContext2D;
    prototype: OffscreenCanvasRenderingContext2D;
};
export type CSSStyleName = keyof {
    [K in Extract<keyof CSSStyleDeclaration, string> as string extends K ? never : CSSStyleDeclaration[K] extends string ? K : never]: never;
};
export type CSSStyle = Partial<Record<CSSStyleName, string | number>>;
/**
 * @deprecated Use `CSSStyle` instead.
 */
export type Style = Record<string, string>;
export declare enum BufrDir {
    ltr = 1,
    rtl = 2
}
export declare enum WritingMode {
    htb = 1,
    vrl = 4,
    vlr = 8
}
export declare const enum WritingDir {
    h = 1,
    v = 12
}
export type SetLayoutP = {
    bufrDir?: BufrDir;
    writingMode?: WritingMode;
};
export declare const Scrod_z = 10;
export declare const Scrobar_z = 10;
export declare const scrollO: ScrollToOptions;
export interface Runr {
    run(): void | Promise<void>;
}
export declare const enum Sortart {
    asc = 0,
    desc = 1
}
export declare const enum Hover {
    none = 0,
    hover = 1
}
export declare const enum Pointer {
    none = 0,
    coarse = 1,
    fine = 2
}
export type UpdateTheme_PUT = {
    theme_j: string;
};
export type Constructor<T = object> = new (...args: any[]) => T;
export type AbstractConstructor<T = object> = abstract new (...args: any[]) => T;
export type Func<This = any> = (this: This, ...args: any[]) => any;
type _TupleOf<T, N extends number, R extends unknown[]> = R["length"] extends N ? R : _TupleOf<T, N, [...R, T]>;
export type TupleOf<T, N extends number> = N extends N ? number extends N ? T[] : _TupleOf<T, N, []> : never;
type Without<T, U> = {
    [P in Exclude<keyof T, keyof U>]?: never;
};
export type XOR<T, U> = (T | U) extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;
export type IndexOf<T extends readonly any[], S extends number[] = []> = T["length"] extends S["length"] ? S[number] : IndexOf<T, [S["length"], ...S]>;
export type ArrEl<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[] ? ElementType : never;
type None_ = {
    _type: "none";
};
type Some_<T> = {
    _type: "some";
    value: T;
};
export type Option<T> = None_ | Some_<T>;
export type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};
export type RemoveIndex<T> = {
    [K in keyof T as string extends K ? never : number extends K ? never : symbol extends K ? never : K]: T[K];
};
export {};
//# sourceMappingURL=alias.d.ts.map