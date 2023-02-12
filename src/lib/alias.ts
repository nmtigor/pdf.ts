/** 80**************************************************************************
 * @module lib/alias
 * @license Apache-2.0
 ******************************************************************************/

import { z } from "../3rd/zod-3.20.0/lib/index.mjs";
/*80--------------------------------------------------------------------------*/

export type int = number;
export const zInt = z.number().int();
export type uint = number;
export const zUint = zInt.min(0);
// export const Int = BigInt;
// export const UInt = BigInt;

export type int64 = int;
const zInt64 = zInt;
export type int32 = int;
export type int16 = int;
export type int8 = int;
export type uint64 = uint;
export type uint32 = uint;
export type uint16 = uint;
export type uint8 = uint;
/*49-------------------------------------------*/

/** 0 is special */
export type id_t = uint;
export const zId = zUint;

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
// export const Loff_t = Int32;
export const loff_UNDEFINED: loff_t = -256;
export const loff_MAX: loff_t = 1_000_000_000;
/** Count one "\t" as e.g. 2, 4, 8. */
export type lcol_t = loff_t;

export type lnum_t = int32;
// export const Lnum_t = Int32;
// export const lnum_UNDEFINED:lnum_t = -256n;
export const lnum_MAX: lnum_t = 1_000_000_000;

/** type of unix timestamp */
export type ts_t = int64;
export const zTs = zInt64;
/*49-------------------------------------------*/

/** recommand [0,1] */
export type Ratio = number;
export const zRatio = z.number().finite();
/*80--------------------------------------------------------------------------*/

// // deno-fmt-ignore
// export type DecDigitChar = "0"
//   | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
// // deno-fmt-ignore
// export type HexDigitChar = DecDigitChar
//   | "a" | "A" | "b" | "B" | "c" | "C" | "d" | "D" | "e" | "E" | "f" | "F";
// export type Hex8 = `${HexDigitChar}${HexDigitChar}`;
/*80--------------------------------------------------------------------------*/

export type point_t = [number, number];
export type rect_t = TupleOf<number, 4>;

export type IntegerArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array;
export type FloatArray =
  | Float32Array
  | Float64Array;
export type TypedArray = IntegerArray | FloatArray;
/*80--------------------------------------------------------------------------*/

export type CSSStyleName = keyof {
  [
    K in Extract<keyof CSSStyleDeclaration, string> as string extends K ? never
      : CSSStyleDeclaration[K] extends string ? K
      : never
  ]: never;
};
// const cname:CSSStyleName = "length";

export type CSSStyle = Partial<Record<CSSStyleName, string | number>>;

/**
 * @deprecated Use `CSSStyle` instead.
 */
export type Style = Record<string, string>;
/*80--------------------------------------------------------------------------*/

export interface Runr {
  run(): void | Promise<void>;
}
// export class DumRunr implements Runr {
//   run() {}
// }
/*80--------------------------------------------------------------------------*/

export const enum Sortart {
  asc,
  desc,
}
/*80--------------------------------------------------------------------------*/

export const enum Hover {
  none = 0,
  hover,
}

export const enum Pointer {
  none = 0,
  coarse,
  fine,
}
/*80--------------------------------------------------------------------------*/

export type Constructor<T = object> = new (...args: any[]) => T;
export type AbstractConstructor<T = object> = abstract new (
  ...args: any[]
) => T;
export type Func<This = any> = (this: This, ...args: any[]) => any;
export type Id<T> = (_x: T) => T;
/*80--------------------------------------------------------------------------*/

//#region TupleOf<>
// Ref: TSConf 2020: Keynote - Anders Hejlsberg (https://youtu.be/IGw2MRI0YV8)

type _TupleOf<T, N extends number, R extends unknown[]> = R["length"] extends N
  ? R
  : _TupleOf<T, N, [...R, T]>;
export type TupleOf<T, N extends number> = N extends N
  ? number extends N ? T[] : _TupleOf<T, N, []>
  : never;
//#endregion

//#region XOR<>
// Ref. https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types

type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
export type XOR<T, U> = (T | U) extends object
  ? (Without<T, U> & U) | (Without<U, T> & T)
  : T | U;
//#endregion

// //#region UnPromisify<>
// // Ref. https://stackoverflow.com/questions/48944552/typescript-how-to-unwrap-remove-promise-from-a-type/

// export type UnPromisify<T> = T extends Promise<infer U> ? UnPromisify<U> : T;
// //#endregion

//#region IndexOf<>
// Ref. https://youtu.be/nNse0r0aRT8

export type IndexOf<T extends readonly any[], S extends number[] = []> =
  T["length"] extends S["length"] ? S[number] : IndexOf<T, [S["length"], ...S]>;

// const a = <const>["abc","123"];
// type T = IndexOf<typeof a>;
//#endregion

//#region ArrEl<>
// Ref. https://stackoverflow.com/questions/41253310/typescript-retrieve-element-type-information-from-array-type

export type ArrEl<ArrayType extends readonly unknown[]> = ArrayType extends
  readonly (infer ElementType)[] ? ElementType : never;
//#endregion

//#region Option<>
// Ref. https://youtu.be/DYtDeasFQkU

type None_ = { _type: "none" };
type Some_<T> = { _type: "some"; value: T };
export type Option<T> = None_ | Some_<T>;
//#endregion
/*80--------------------------------------------------------------------------*/
