import { type ActionEventType, type ActionEventTypesType, BaseException } from "../shared/util.js";
import { BaseStream } from "./base_stream.js";
import { type CssFontInfo } from "./document.js";
import { Dict, type Obj } from "./primitives.js";
import { XRef } from "./xref.js";
export declare function getLookupTableFactory<T extends object = Record<string, number>>(initializer?: (lookup: T) => void): () => T;
export declare function getArrayLookupTableFactory(initializer?: () => (string | number)[]): () => Record<string, number>;
export declare class MissingDataException extends BaseException {
    begin: number;
    end: number;
    constructor(begin: number, end: number);
}
export declare class ParserEOFException extends BaseException {
    constructor(msg: string);
}
export declare class XRefEntryException extends BaseException {
    constructor(msg: string);
}
export declare class XRefParseException extends BaseException {
    constructor(msg: string);
}
interface GetInheritablePropertyParms {
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
export declare function getInheritableProperty({ dict, key, getArray, stopWhenFound, }: GetInheritablePropertyParms): string | number | boolean | Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array | BaseStream | Dict | XFANsName.Name | NsCmd.Cmd | typeof import("./primitives.js").EOF | (Obj | undefined)[] | null | undefined;
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
export declare type XFAPath = XFAPathCom[];
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
export declare type AnnotActions = Record<ActionEventType, string[]> & {
    Action?: string[];
};
export declare function collectActions(xref: XRef, dict: Dict, eventType: ActionEventTypesType): AnnotActions | undefined;
export declare function encodeToXmlString(str: string): string;
export declare function validateCSSFont(cssFontInfo: CssFontInfo): boolean;
export declare function recoverJsURL(str: string): {
    url: string;
    newWindow: boolean;
} | null;
export {};
//# sourceMappingURL=core_utils.d.ts.map