import { type AbstractConstructor, type Constructor, type uint, type uint8 } from "./alias.js";
export declare function isObjectLike(value: unknown): value is object;
export declare function eq(lhs_x: unknown, rhs_x: unknown, valve_x?: number): boolean;
declare global {
    interface Object {
        eq(rhs_x: unknown, valve_x?: uint): boolean;
    }
}
declare global {
    interface Array<T> {
        last: T | undefined;
        /**
         * @param { headconst } rhs
         * @param { const } valve_x
         */
        eq(rhs_x: unknown, valve_x?: uint): boolean;
        fillArray(ary: []): this;
        fillArrayBack(ary: any[]): this;
    }
}
/**
 * @param { const } cp Code Point returned by `string.charCodeAt()`
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
         * in( 0 <= digits && digits <= 20 )
         */
        fixTo(digits?: uint8): number;
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
    }
}
declare global {
    interface Int8Array {
        /**
         * @param { const } rhs_x
         */
        eq(rhs_x: unknown): boolean;
    }
    interface Uint8Array {
        /**
         * @param { const } rhs_x
         */
        eq(rhs_x: unknown): boolean;
    }
    interface Uint8ClampedArray {
        /**
         * @param { const } rhs_x
         */
        eq(rhs_x: unknown): boolean;
    }
    interface Int16Array {
        /**
         * @param { const } rhs_x
         */
        eq(rhs_x: unknown): boolean;
    }
    interface Uint16Array {
        /**
         * @param { const } rhs_x
         */
        eq(rhs_x: unknown): boolean;
    }
    interface Int32Array {
        /**
         * @param { const } rhs_x
         */
        eq(rhs_x: unknown): boolean;
    }
    interface Uint32Array {
        /**
         * @param { const } rhs_x
         */
        eq(rhs_x: unknown): boolean;
    }
    interface Float32Array {
        /**
         * @param { const } rhs_x
         */
        eq(rhs_x: unknown): boolean;
    }
    interface Float64Array {
        /**
         * @param { const } rhs_x
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
 * ! should always companion with an `interface` declaration.
 *
 * @param mixins First element has highest precedence, and so on.
 */
export declare function mix(...mixins: (Constructor | AbstractConstructor)[]): AbstractConstructor<object>;
//# sourceMappingURL=jslang.d.ts.map