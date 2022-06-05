import { type TypedArray } from "../../../lib/alias.js";
import { BaseStream } from "./base_stream.js";
import { TranslatedFont } from "./evaluator.js";
import { XRef } from "./xref.js";
export declare const CIRCULAR_REF: unique symbol;
export declare type CIRCULAR_REF = typeof CIRCULAR_REF;
export declare const EOF: unique symbol;
export declare type EOF = typeof EOF;
declare namespace XFANsName {
    class Name {
        name: string;
        constructor(name: string);
        static get(name: string): Name;
        static _clearCache(): void;
    }
}
export import Name = XFANsName.Name;
declare namespace NsCmd {
    class Cmd {
        cmd: string;
        constructor(cmd: string);
        static get(cmd: string): Cmd;
        static _clearCache(): void;
    }
}
export import Cmd = NsCmd.Cmd;
export declare class Dict {
    #private;
    get size(): number;
    /** No dereferencing. */
    getRaw(key: string): Obj | undefined;
    getKeys(): string[];
    /** No dereferencing. */
    getRawValues(): (Obj | undefined)[];
    set(key: string, value: Obj | undefined): void;
    has(key: string): boolean;
    xref: XRef | undefined;
    assignXref(newXref: XRef): void;
    objId?: string;
    suppressEncryption: boolean;
    constructor(xref?: XRef);
    /**
     * Automatically dereferences Ref objects.
     */
    get(key1: string, key2?: string, key3?: string): Obj | undefined;
    /**
     * Same as get(), but returns a promise and uses fetchIfRefAsync().
     */
    getAsync<T extends ObjNoRef = ObjNoRef>(key1: string, key2?: string, key3?: string): Promise<T>;
    /**
     * Same as get(), but dereferences all elements if the result is an Array.
     */
    getArray(key1: string, key2?: string, key3?: string): NoRef | undefined;
    forEach(callback: (k: string, v: any) => any): void;
    static get empty(): Dict;
    static merge({ xref, dictArray, mergeSubDicts }: {
        xref: XRef;
        dictArray: (Dict | undefined)[];
        mergeSubDicts?: boolean;
    }): Dict;
}
export declare class FontDict extends Dict {
    loadedName?: string;
    translated?: Promise<TranslatedFont>;
    fontAliases?: {
        [hash: string]: {
            fontID: string;
            aliasRef?: Ref;
        };
    };
    cacheKey?: Ref | string;
}
declare namespace NsRef {
    class Ref {
        /** object number */
        num: number;
        /** generation number */
        gen: number;
        constructor(num: number, gen: number);
        toString(): string;
        static get(num: number, gen: number): Ref;
        static _clearCache(): void;
    }
}
export import Ref = NsRef.Ref;
export declare class RefSet {
    #private;
    has(ref: Ref | string): boolean;
    put(ref: Ref | string): void;
    remove(ref: Ref): void;
    [Symbol.iterator](): IterableIterator<string>;
    clear(): void;
    constructor(parent?: RefSet);
}
export declare class RefSetCache<T = Obj> {
    #private;
    get size(): number;
    get(ref: Ref | string): T | undefined;
    has(ref: Ref | string): boolean;
    put(ref: Ref | string, obj: T): void;
    putAlias(ref: Ref, aliasRef: Ref): void;
    [Symbol.iterator](): IterableIterator<T>;
    clear(): void;
}
export declare function isName(v: any, name: string): boolean;
export declare function isCmd(v: any, cmd?: string): boolean;
export declare function isDict(v: any, type: string): boolean;
export declare function isRefsEqual(v1: Ref, v2: Ref): boolean;
export declare function clearPrimitiveCaches(): void;
declare type Prm = boolean | number | string | null | Name | Cmd | CIRCULAR_REF | EOF | Dict | TypedArray | BaseStream | Ref;
export declare type Obj = Prm | (Obj | undefined)[];
export declare type ObjNoCmd = Exclude<Obj, Cmd>;
export declare type ObjNoRef = Exclude<Obj, Ref>;
export declare type PrmNoRef = Exclude<Prm, Ref>;
export declare type NoRef = PrmNoRef | (ObjNoRef | undefined)[];
export {};
//# sourceMappingURL=primitives.d.ts.map