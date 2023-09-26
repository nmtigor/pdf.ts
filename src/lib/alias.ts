/** 80**************************************************************************
 * @module lib/alias
 * @license Apache-2.0
 ******************************************************************************/

import { z } from "@zod";
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

/** Count one "\t" as 1 */
export type llen_t = uint32;
export type loff_t = int32;
export const loff_UNDEFINED: llen_t = -1_000_000_001;
export const llen_MAX: llen_t = 1_000_000_000;
/** Count one "\t" as e.g. 2, 4, 8 */
export type lcol_t = llen_t;

export type lnum_t = uint32;
// export const lnum_UNDEFINED:lnum_t = -256n;
export const lnum_MAX: lnum_t = 1_000_000;

/** Type of unix timestamp */
export type ts_t = int64;
export const zTs = zInt64;
/*49-------------------------------------------*/

/** Recommand [0,1] */
export type Ratio = number;
export const zRatio = z.number().finite();
/*80--------------------------------------------------------------------------*/

// export type DecDigitChar = "0"
//   | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
// export type HexDigitChar = DecDigitChar
//   | "a" | "A" | "b" | "B" | "c" | "C" | "d" | "D" | "e" | "E" | "f" | "F";
// export type Hex8 = `${HexDigitChar}${HexDigitChar}`;

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

// deno-fmt-ignore
/**
 * Ref. http://www.unicode.org/reports/tr9/#Table_Bidirectional_Character_Types
 */
export enum ChrTyp {
  // Strong
  L = 1, R = 2, AL = 4,
  // Weak
  EN = 8, ES = 0x10, ET = 0x20, AN = 0x40, CS = 0x80,
  NSM = 0x0_100, BN = 0x0_200,
  // Neutral
  B = 0x0_400, S = 0x0_800, WS = 0x1_000, ON = 0x2_000,
  // Explicit Formatting
  LRE = 0x4_000, LRO = 0x8_000, RLE = 0x10_000, RLO = 0x20_000, PDF = 0x40_000,
  LRI = 0x80_000, RLI = 0x100_000, FSI = 0x200_000, PDI = 0x400_000,
}
export type ChrTypName = keyof typeof ChrTyp;
/*80--------------------------------------------------------------------------*/

export type dot2d_t = [x: number, y: number];
export type dim2d_t = [widt: number, high: number];
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

export type C2D = CanvasRenderingContext2D;
export const C2D = globalThis.CanvasRenderingContext2D;
export type OC2D = OffscreenCanvasRenderingContext2D;
export const OC2D = globalThis.OffscreenCanvasRenderingContext2D;
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
// export type Id<T> = (_x: T) => T;
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
