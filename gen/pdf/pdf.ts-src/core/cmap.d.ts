import type { TupleOf } from "../../../lib/alias.js";
import type { FetchBuiltInCMap } from "../display/base_factory.js";
import { BaseStream } from "./base_stream.js";
import { Name, type ObjNoCmd } from "./primitives.js";
export interface CharCodeOut {
    charcode: number;
    length: number;
}
export declare class CMap {
    /**
     * Codespace ranges are stored as follows:
     * [[1BytePairs], [2BytePairs], [3BytePairs], [4BytePairs]]
     * where nBytePairs are ranges e.g. [low1, high1, low2, high2, ...]
     */
    codespaceRanges: TupleOf<number[], 4>;
    numCodespaceRanges: number;
    /**
     * Map entries have one of two forms.
     * - cid chars are 16-bit unsigned integers, stored as integers.
     * - bf chars are variable-length byte sequences, stored as strings, with
     *   one byte per character.
     */
    _map: (number | string | undefined)[];
    getMap(): (string | number | undefined)[];
    /**
     * This is used for both bf and cid chars.
     */
    mapOne(src: number, dst: number | string): void;
    lookup(code: number): string | number | undefined;
    contains(code: number): boolean;
    name: string;
    vertical: boolean;
    useCMap?: CMap;
    builtInCMap: boolean;
    constructor(builtInCMap?: boolean);
    addCodespaceRange(n: number, low: number, high: number): void;
    mapCidRange(low: number, high: number, dstLow: number): void;
    mapBfRange(low: number, high: number, dstLow: string): void;
    mapBfRangeToArray(low: number, high: number, array: (number | string)[]): void;
    forEach(callback: (charcode: number, cid: number | string) => void): void;
    charCodeOf(value: number | string): number;
    readCharCode(str: string, offset: number, out: CharCodeOut): void;
    getCharCodeLength(charCode: number): number;
    get length(): number;
    get isIdentityCMap(): boolean;
}
/**
 * A special case of CMap, where the _map array implicitly has a length of
 * 65536 and each element is equal to its index.
 */
export declare class IdentityCMap extends CMap {
    constructor(vertical: boolean, n: number);
    mapCidRange(low: number, high: number, dstLow: number): void;
    mapBfRange(low: number, high: number, dstLow: string): void;
    mapBfRangeToArray(low: number, high: number, array: ObjNoCmd[]): void;
    mapOne(src: number, dst: number | string): void;
    lookup(code: number): number | undefined;
    contains(code: number): boolean;
    forEach(callback: (charcode: number, cid: number | string) => void): void;
    charCodeOf(value: number): number;
    getMap(): any[];
    get length(): number;
    get isIdentityCMap(): boolean;
}
declare namespace NsCMapFactory {
    interface CMapFactoryCreateP_ {
        encoding: Name | BaseStream;
        fetchBuiltInCMap: FetchBuiltInCMap;
        useCMap?: string;
    }
    export class CMapFactory {
        static create({ encoding, fetchBuiltInCMap, useCMap }: CMapFactoryCreateP_): Promise<CMap | IdentityCMap>;
    }
    export {};
}
export import CMapFactory = NsCMapFactory.CMapFactory;
export {};
//# sourceMappingURL=cmap.d.ts.map