/*81*****************************************************************************
 * alias
** ---- */

export type int = number;
export type uint = number;
// export const Int = BigInt;
// export const UInt = BigInt;

export type int64 = int;
export type uint64 = uint;

export type int32 = int;
export type uint32 = uint;

export type int16 = int;
export type uint16= uint;

export type int8 = int;
export type uint8 = uint;
/*49-------------------------------------------*/

export type id_t = uint32;

export type Index = uint32;

export type loff_t = int32; /** Count one "\t" as 1. */
// export const Loff_t = Int32;
export const loff_UNDEFINED:loff_t = -256;
export const loff_MAX:loff_t = 1_000_000_000;
export type lcol_t = loff_t; /** Count one "\t" as e.g. 2, 4, 8. */

export type lnum_t = int32;
// export const Lnum_t = Int32;
// export const lnum_UNDEFINED:lnum_t = -256n;
export const lnum_MAX:lnum_t = 1_000_000_000;

/** type of unix timestamp */
export type ts_t = int64;
/*49-------------------------------------------*/

/** Recommand [0,1] */
export type Ratio = number; 
/*81---------------------------------------------------------------------------*/

export type Style = Record<string, string>;

export interface Runr
{
  run():void | Promise<void>;
}
export class DumRuhr implements Runr
{
  run() {}
}

export const enum Sortart { asc, desc }
/*81---------------------------------------------------------------------------*/

export type Constructor<T=object> = new(...args: any[]) => T;
export type AbstractConstructor<T=object> = abstract new(...args: any[]) => T;
export type Func<This=any> = (this:This, ...args:any[]) => any;

export type IntegerArray = 
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
;
export type FloatArray = 
  | Float32Array
  | Float64Array
;
export type TypedArray = IntegerArray | FloatArray;

//#region TupleOf<>
// Ref: TSConf 2020: Keynote - Anders Hejlsberg (https://youtu.be/IGw2MRI0YV8)

type _TupleOf< T, N extends number, R extends unknown[] > =
  R["length"] extends N ? R : _TupleOf< T, N, [...R,T] >;
export type TupleOf< T, N extends number > =
  N extends N ? number extends N ? T[] : _TupleOf<T,N,[]> : never;
//#endregion

//#region XOR<>
// Ref. https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types

type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
export type XOR<T, U> = (T | U) extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;
//#endregion

// //#region UnPromisify<>
// // Ref. https://stackoverflow.com/questions/48944552/typescript-how-to-unwrap-remove-promise-from-a-type/

// export type UnPromisify<T> = T extends Promise<infer U> ? UnPromisify<U> : T;
// //#endregion

//#region IndexOf<>
// Ref. https://youtu.be/nNse0r0aRT8

export type IndexOf<T extends readonly any[], S extends number[]=[]> = 
  T["length"] extends S["length"] ? S[number] : IndexOf<T, [S["length"], ...S]>;

// const a = <const>["abc","123"];
// type T = IndexOf<typeof a>;
//#endregion
/*81---------------------------------------------------------------------------*/
