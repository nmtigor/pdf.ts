/** 80**************************************************************************
 * @module lib/jslang
 * @license Apache-2.0
 ******************************************************************************/
import { int } from "./alias.js";
import type { AbstractConstructor, Constructor, uint, uint8 } from "./alias.js";
declare global {
    interface ObjectConstructor {
        /**
         * Determines whether an object has a property with the specified name.
         * @param o An object.
         * @param v A property name.
         */
        hasOwn<T extends PropertyKey>(o: Readonly<Record<T, unknown>>, v: unknown): v is T;
        hasOwn(o: object, v: PropertyKey): boolean;
    }
}
/** Ref. https://lodash.com/docs/4.17.15#isObjectLike */
export declare function isObjectLike(value: unknown): value is object;
export declare function eq(lhs_x: unknown, rhs_x: unknown, valve_x?: number): boolean;
declare global {
    interface Object {
        eq(rhs_x: unknown, valve_x?: uint): boolean;
    }
}
declare global {
    interface Array<T> {
        /**
         * @deprecated Use `.at(-1)`.
         */
        last: T | undefined;
        /**
         * @headconst @param rhs
         * @const @param valve_x
         */
        eq(rhs_x: unknown, valve_x?: uint): boolean;
        /**
         * @const @param ary_x
         */
        fillArray(ary_x: T[]): this;
        fillArrayBack(ary_x: T[]): this;
        become(ary_x: T[]): this;
        swap(i_x: uint, j_x: uint): this;
    }
}
/**
 * @const @param cp Code Point returned by `string.charCodeAt()`
 */
export declare function isDecimalDigit(cp: uint): boolean;
export declare function isHexDigit(cp: uint): boolean;
export declare function isOctalDigit(cp: uint): boolean;
export declare function isASCIIUpLetter(cp: uint): boolean;
export declare function isASCIILoLetter(cp: uint): boolean;
export declare function isASCIILetter(cp: uint): boolean;
declare global {
    interface Number {
        /**
         * `in( 0 <= digits && digits <= 20 )`
         */
        fixTo(digits?: uint8): number;
        reprRatio(fixTo_x?: uint8): string;
    }
    interface NumberConstructor {
        apxE(f0: number, f1: number): boolean;
        apxS(f0: number, f1: number): boolean;
        apxSE(f0: number, f1: number): boolean;
        apxG(f0: number, f1: number): boolean;
        apxGE(f0: number, f1: number): boolean;
        /**
         * [min,max]
         * ! [min,max) normaally, but could achieve `max` because of `Math.round()`.
         */
        getRandom(max: number, min?: number, fixt?: uint): number;
        /**
         * Ref. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice#parameters
         * @const @param in_x
         * @const @param to_x
         */
        normalize(in_x: int, to_x: uint): uint;
    }
}
declare global {
    interface Int8Array {
        /**
         * @const @param rhs_x
         */
        eq(rhs_x: unknown): boolean;
    }
    interface Uint8Array {
        /**
         * @const @param rhs_x
         */
        eq(rhs_x: unknown): boolean;
    }
    interface Uint8ClampedArray {
        /**
         * @const @param rhs_x
         */
        eq(rhs_x: unknown): boolean;
    }
    interface Int16Array {
        /**
         * @const @param rhs_x
         */
        eq(rhs_x: unknown): boolean;
    }
    interface Uint16Array {
        /**
         * @const @param rhs_x
         */
        eq(rhs_x: unknown): boolean;
    }
    interface Int32Array {
        /**
         * @const @param rhs_x
         */
        eq(rhs_x: unknown): boolean;
    }
    interface Uint32Array {
        /**
         * @const @param rhs_x
         */
        eq(rhs_x: unknown): boolean;
    }
    interface Float32Array {
        /**
         * @const @param rhs_x
         */
        eq(rhs_x: unknown): boolean;
    }
    interface Float64Array {
        /**
         * @const @param rhs_x
         */
        eq(rhs_x: unknown): boolean;
    }
}
declare global {
    interface Date {
        myformat(): string;
        getShiChen(): "子" | "丑" | "寅" | "卯" | "辰" | "巳" | "午" | "未" | "申" | "酉" | "戌" | "亥";
    }
    interface DateConstructor {
        date: Date;
        setHours(refdate: Date, hours: number, min?: number, sec?: number, ms?: number): number;
        setDate(refdate: Date, date: number): number;
        setMonth(refdate: Date, month: number, date?: number): number;
        setFullYear(refdate: Date, year: number, month?: number, date?: number): number;
    }
}
declare global {
    interface Math {
        clamp(min: number, val: number, max: number): number;
    }
}
/**
 * class X extends mix( Y, Z )
 * ! Should always companion with an interface declaration
 *
 * @param mixins_x
 *  Laat element has the highest precedence, and so on.
 */
export declare function mix<C extends Constructor | AbstractConstructor>(Base_x: C, ...mixins_x: (Constructor | AbstractConstructor)[]): (abstract new (...args: any[]) => {}) & C;
//# sourceMappingURL=jslang.d.ts.map