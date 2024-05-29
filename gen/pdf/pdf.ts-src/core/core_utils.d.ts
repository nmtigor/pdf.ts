/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/core_utils.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { uint } from "../../../lib/alias.js";
import type { AnnotStorageRecord, AnnotStorageValue } from "../display/annotation_layer.js";
import type { ActionEventName, ActionEventTypeType, matrix_t } from "../shared/util.js";
import { BaseException } from "../shared/util.js";
import { BaseStream } from "./base_stream.js";
import type { CssFontInfo } from "./document.js";
import type { Obj } from "./primitives.js";
import { Dict } from "./primitives.js";
import type { XRef } from "./xref.js";
export declare const PDF_VERSION_REGEXP: RegExp;
export declare function getLookupTableFactory<T extends object = Record<string, number>>(initializer?: (lookup: T) => void): () => T;
export declare class MissingDataException extends BaseException {
    begin: number;
    end: number;
    constructor(begin: number, end: number);
}
export declare class ParserEOFException extends BaseException {
    constructor(msg: string);
}
export declare class XRefEntryException extends BaseException {
    constructor(msg?: string);
}
export declare class XRefParseException extends BaseException {
    constructor(msg?: string);
}
/**
 * Combines multiple ArrayBuffers into a single Uint8Array.
 * @param arr An array of ArrayBuffers.
 */
export declare function arrayBuffersToBytes(arr: ArrayBuffer[]): Uint8Array;
interface GetInheritablePropertyP_ {
    /**
     * Dictionary from where to start the traversal.
     */
    dict?: Dict;
    /**
     * The key of the property to find the value for.
     */
    key: string;
    /**
     * Whether or not the value should be fetched as an
     * array. The default value is `false`.
     */
    getArray?: boolean;
    /**
     * Whether or not to stop the traversal when
     * the key is found. If set to `false`, we always walk up the entire parent
     * chain, for example to be able to find `\Resources` placed on multiple
     * levels of the tree. The default value is `true`.
     */
    stopWhenFound?: boolean;
}
/**
 * Get the value of an inheritable property.
 *
 * If the PDF specification explicitly lists a property in a dictionary as
 * inheritable, then the value of the property may be present in the dictionary
 * itself or in one or more parents of the dictionary.
 *
 * If the key is not found in the tree, `undefined` is returned. Otherwise,
 * the value for the key is returned or, if `stopWhenFound` is `false`, a list
 * of values is returned.
 */
export declare function getInheritableProperty({ dict, key, getArray, stopWhenFound, }: GetInheritablePropertyP_): string | number | boolean | Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array | import("./primitives.js").Name | BaseStream | Dict | import("./primitives.js").Cmd | typeof import("./primitives.js").CIRCULAR_REF | typeof import("./primitives.js").EOF | (Obj | undefined)[] | null | undefined;
/**
 * Converts positive integers to (upper case) Roman numerals.
 * @param number The number that should be converted.
 * @param lowerCase Indicates if the result should be converted
 *   to lower case letters. The default value is `false`.
 * @return The resulting Roman number.
 */
export declare function toRomanNumerals(number: number, lowerCase?: boolean): string;
export declare function log2(x: number): number;
export declare function readInt8(data: Uint8Array | Uint8ClampedArray, offset: number): number;
export declare function readUint16(data: Uint8Array | Uint8ClampedArray, offset: number): number;
export declare function readUint32(data: Uint8Array | Uint8ClampedArray, offset: number): number;
/**
 * Checks if ch is one of the following characters: SPACE, TAB, CR or LF.
 */
export declare function isWhiteSpace(ch: number): boolean;
interface XFAPathCom {
    name: string;
    pos: number;
}
export type XFAPath = XFAPathCom[];
/**
 * AcroForm field names use an array like notation to refer to
 * repeated XFA elements e.g. foo.bar[nnn].
 * see: XFA Spec Chapter 3 - Repeated Elements
 *
 * @param path XFA path name.
 * @return Array of Objects with the name and pos of each part of the path.
 */
export declare function parseXFAPath(path: string): XFAPath;
export declare function escapePDFName(str: string): string;
export declare function escapeString(str: string): string;
export type AnnotActions = Record<ActionEventName, string[]>;
export declare function collectActions(xref: XRef, dict: Dict, eventType: ActionEventTypeType): AnnotActions | undefined;
export declare function codePointIter(str: string): Generator<number, void, unknown>;
export declare function encodeToXmlString(str: string): string;
export declare function validateFontName(fontFamily: string, mustWarn?: boolean): boolean;
export declare function validateCSSFont(cssFontInfo: CssFontInfo): boolean;
export declare function recoverJsURL(str: string): {
    url: string;
    newWindow: boolean;
} | undefined;
export declare function numberToString(value: number): string;
export declare function getNewAnnotationsMap(annotationStorage: AnnotStorageRecord | undefined): Map<number, AnnotStorageValue[]> | undefined;
export declare function isAscii(str: string): boolean;
export declare function stringToUTF16HexString(str: string): string;
export declare function stringToUTF16String(str: string, bigEndian?: boolean): string;
export declare function getRotationMatrix(rotation: number, width: number, height: number): matrix_t;
/**
 * Get the number of bytes to use to represent the given positive integer.
 * If n is zero, the function returns 0 which means that we don't need to waste
 * a byte to represent it.
 */
export declare function getSizeInBytes(x: uint): uint;
export {};
//# sourceMappingURL=core_utils.d.ts.map