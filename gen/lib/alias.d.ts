export type int = number;
export type uint = number;
export type int64 = int;
export type int32 = int;
export type int16 = int;
export type int8 = int;
export type uint64 = uint;
export type uint32 = uint;
export type uint16 = uint;
export type uint8 = uint;
/** 0 is special */
export type id_t = uint32;
/**
 * ! CHECK
 * Make sense?
 * Index-similar value can very likely be `-1`.
 * Is it better to just use `int`, `uint` according to contexts?
 * (see sortedarray.ts)
 */
export type Index = uint32;
/** Count one "\t" as 1. */
export type loff_t = int32;
export declare const loff_UNDEFINED: loff_t;
export declare const loff_MAX: loff_t;
/** Count one "\t" as e.g. 2, 4, 8. */
export type lcol_t = loff_t;
export type lnum_t = int32;
export declare const lnum_MAX: lnum_t;
/** type of unix timestamp */
export type ts_t = int64;
/** recommand [0,1] */
export type Ratio = number;
export type IntegerArray = Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array;
export type FloatArray = Float32Array | Float64Array;
export type TypedArray = IntegerArray | FloatArray;
export type CSSStyleName = keyof {
    [K in Extract<keyof CSSStyleDeclaration, string> as string extends K ? never : CSSStyleDeclaration[K] extends string ? K : never]: never;
};
export type CSSStyle = Partial<Record<CSSStyleName, string | number>>;
/**
 * @deprecated Use `CSSStyle` instead.
 */
export type Style = Record<string, string>;
export interface Runr {
    run(): void | Promise<void>;
}
export declare class DumRuhr implements Runr {
    run(): void;
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
export {};
//# sourceMappingURL=alias.d.ts.map