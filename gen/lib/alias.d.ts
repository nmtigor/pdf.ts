export declare type int = number;
export declare type uint = number;
export declare type int64 = int;
export declare type uint64 = uint;
export declare type int32 = int;
export declare type uint32 = uint;
export declare type int16 = int;
export declare type uint16 = uint;
export declare type int8 = int;
export declare type uint8 = uint;
export declare type id_t = uint32;
export declare type Index = uint32;
export declare type loff_t = int32; /** Count one "\t" as 1. */
export declare const loff_UNDEFINED: loff_t;
export declare const loff_MAX: loff_t;
export declare type lcol_t = loff_t; /** Count one "\t" as e.g. 2, 4, 8. */
export declare type lnum_t = int32;
export declare const lnum_MAX: lnum_t;
/** type of unix timestamp */
export declare type ts_t = int64;
/** Recommand [0,1] */
export declare type Ratio = number;
export declare type Style = Record<string, string>;
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
export declare type Constructor<T = object> = new (...args: any[]) => T;
export declare type AbstractConstructor<T = object> = abstract new (...args: any[]) => T;
export declare type Func<This = any> = (this: This, ...args: any[]) => any;
export declare type IntegerArray = Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array;
export declare type FloatArray = Float32Array | Float64Array;
export declare type TypedArray = IntegerArray | FloatArray;
declare type _TupleOf<T, N extends number, R extends unknown[]> = R["length"] extends N ? R : _TupleOf<T, N, [...R, T]>;
export declare type TupleOf<T, N extends number> = N extends N ? number extends N ? T[] : _TupleOf<T, N, []> : never;
declare type Without<T, U> = {
    [P in Exclude<keyof T, keyof U>]?: never;
};
export declare type XOR<T, U> = (T | U) extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;
export declare type UnPromisify<T> = T extends Promise<infer U> ? UnPromisify<U> : T;
export declare type IndexOf<T extends readonly any[], S extends number[] = []> = T["length"] extends S["length"] ? S[number] : IndexOf<T, [S["length"], ...S]>;
export {};
//# sourceMappingURL=alias.d.ts.map