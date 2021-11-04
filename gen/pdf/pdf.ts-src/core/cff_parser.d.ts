import { Constructor } from "../../../lib/alias.js";
import { BaseStream } from "./base_stream.js";
import { FontProps } from "./evaluator.js";
/**
 * The CFF class takes a Type1 file and wrap it into a
 * 'Compact Font Format' which itself embed Type2 charstrings.
 */
export declare const CFFStandardStrings: string[];
export declare const NUM_STANDARD_CFF_STRINGS = 391;
declare namespace NsCFFParser {
    interface ParseCharStringsParms {
        charStrings: CFFIndex;
        localSubrIndex?: CFFIndex | undefined;
        globalSubrIndex: CFFIndex;
        fdSelect?: CFFFDSelect | undefined;
        fdArray: CFFTopDict[];
        privateDict: CFFPrivateDict;
    }
    interface ParseCharStringState {
        callDepth: number;
        stackSize: number;
        stack: number[];
        undefStack: boolean;
        hints: number;
        firstStackClearing: boolean;
        seac: number[] | null;
        width: number | null;
        hasVStems: boolean;
    }
    type CFFDictParsed = [number, number[]][];
    export class CFFParser {
        bytes: Uint8Array | Uint8ClampedArray;
        properties: FontProps;
        seacAnalysisEnabled: boolean;
        cff?: CFF;
        constructor(file: BaseStream, properties: FontProps, seacAnalysisEnabled: boolean);
        /**
         * Ref. The Compact Font Format Specification
         * [CFF] http://wwwimages.adobe.com/content/dam/acom/en/devnet/font/pdfs/5176.CFF.pdf
         */
        parse(): CFF;
        /**
         * [CFF] Table 8
         */
        parseHeader(): {
            obj: CFFHeader;
            endPos: number;
        };
        parseDict<T extends number[] | Uint8Array | Uint8ClampedArray>(dict: T): CFFDictParsed;
        /**
         * [CFF] Table 7
         */
        parseIndex(pos: number): {
            obj: CFFIndex<Uint8Array | Uint8ClampedArray>;
            endPos: number;
        };
        parseNameIndex(index: CFFIndex<Uint8Array | Uint8ClampedArray>): string[];
        parseStringIndex(index: CFFIndex<Uint8Array | Uint8ClampedArray>): CFFStrings;
        createDict<T extends CFFDict>(Type: Constructor<T>, dict: CFFDictParsed, strings?: CFFStrings): T;
        parseCharString(state: ParseCharStringState, data: Uint8Array | Uint8ClampedArray | number[], localSubrIndex: CFFIndex | undefined, globalSubrIndex: CFFIndex): boolean;
        parseCharStrings({ charStrings, localSubrIndex, globalSubrIndex, fdSelect, fdArray, privateDict, }: ParseCharStringsParms): {
            charStrings: CFFIndex<Uint8Array | Uint8ClampedArray | number[]>;
            seacs: number[][];
            widths: number[];
        };
        emptyPrivateDictionary(parentDict: CFFTopDict): void;
        parsePrivateDict(parentDict: CFFTopDict): void;
        parseCharsets(pos: number, length: number, strings: CFFStrings, cid: boolean): CFFCharset;
        parseEncoding(pos: number, properties: FontProps, strings: CFFStrings, charset: (string | number)[]): CFFEncoding;
        parseFDSelect(pos: number, length: number): CFFFDSelect;
    }
    export {};
}
export import CFFParser = NsCFFParser.CFFParser;
export declare class CFF {
    header?: CFFHeader;
    names: string[];
    topDict?: CFFTopDict;
    strings: CFFStrings;
    globalSubrIndex?: CFFIndex;
    encoding?: CFFEncoding | undefined;
    charset?: CFFCharset;
    charStrings?: CFFIndex;
    fdArray: CFFTopDict[];
    fdSelect?: CFFFDSelect;
    isCIDFont: boolean;
    seacs?: number[][];
    widths?: number[];
    duplicateFirstGlyph(): void;
    hasGlyphId(id: number): boolean;
}
export declare class CFFHeader {
    major: number;
    minor: number;
    hdrSize: number;
    offSize: number;
    constructor(major: number, minor: number, hdrSize: number, offSize: number);
}
export declare class CFFStrings {
    strings: string[];
    get count(): number;
    get(index: number): string;
    getSID(str: string): number;
    add(value: string): void;
}
export declare class CFFIndex<T extends number[] | Uint8Array | Uint8ClampedArray = number[] | Uint8Array | Uint8ClampedArray> {
    objects: T[];
    get count(): number;
    length: number;
    add(data: T): void;
    set(index: number, data: T): void;
    get(index: number): T;
}
interface CFFTables {
    keyToNameMap: string[];
    nameToKeyMap: Record<string, number>;
    types: (string[] | string)[];
    defaults: (number[] | number | null)[];
    opcodes: ([number, number] | [number])[];
    order: number[];
}
declare abstract class CFFDict {
    strings?: CFFStrings | undefined;
    keyToNameMap: string[];
    nameToKeyMap: Record<string, number>;
    defaults: (number | number[] | null)[];
    types: (string | string[])[];
    opcodes: ([number] | [number, number])[];
    order: number[];
    values: (number[] | number | undefined)[];
    constructor(tables: CFFTables, strings?: CFFStrings | undefined);
    setByKey(key: number, value: number[]): boolean;
    setByName(name: string, value?: number | number[]): void;
    hasName(name: string): boolean;
    getByName(name: string): number | number[] | null | undefined;
    removeByName(name: string): void;
    static createTables(layout: CFFLayout): CFFTables;
}
declare type CFFLayoutEntry = [
    key: [number, number] | number,
    name: string,
    types: string[] | string,
    defaults: number[] | number | null
];
declare type CFFLayout = CFFLayoutEntry[];
declare namespace NsCFFTopDict {
    /**
     * [CFF] Table 9
     */
    class CFFTopDict extends CFFDict {
        privateDict?: CFFPrivateDict;
        constructor(strings?: CFFStrings);
    }
}
export import CFFTopDict = NsCFFTopDict.CFFTopDict;
declare namespace NsCFFPrivateDict {
    class CFFPrivateDict extends CFFDict {
        subrsIndex?: CFFIndex;
        constructor(strings?: CFFStrings);
    }
}
export import CFFPrivateDict = NsCFFPrivateDict.CFFPrivateDict;
export declare const enum CFFCharsetPredefinedTypes {
    ISO_ADOBE = 0,
    EXPERT = 1,
    EXPERT_SUBSET = 2
}
export declare class CFFCharset {
    predefined: boolean;
    format: CFFCharsetPredefinedTypes;
    charset: string[];
    raw?: Uint8Array | Uint8ClampedArray | undefined;
    constructor(predefined: boolean, format: CFFCharsetPredefinedTypes, charset: string[], raw?: Uint8Array | Uint8ClampedArray | undefined);
}
declare class CFFEncoding {
    predefined: boolean;
    format: number;
    encoding: number[];
    raw?: Uint8Array | Uint8ClampedArray | undefined;
    constructor(predefined: boolean, format: number, encoding: number[], raw?: Uint8Array | Uint8ClampedArray | undefined);
}
export declare class CFFFDSelect {
    format: 0 | 3;
    fdSelect: number[];
    constructor(format: 0 | 3, fdSelect: number[]);
    getFDIndex(glyphIndex: number): number;
}
declare class CFFOffsetTracker {
    offsets: any;
    isTracking(key: string): boolean;
    track(key: string, location: number): void;
    offset(value: number): void;
    setEntryLocation(key: string, values: number[], output: CompileOutput): void;
}
interface CompileOutput {
    data: number[];
    length: number;
    add: (data: number[]) => void;
}
export declare class CFFCompiler {
    cff: CFF;
    constructor(cff: CFF);
    compile(): number[];
    encodeNumber(value: number): number[];
    static get EncodeFloatRegExp(): RegExp;
    encodeFloat(num: number): number[];
    encodeInteger(value: number): number[];
    compileHeader(header: CFFHeader): number[];
    compileNameIndex(names: string[]): number[];
    compileTopDicts(dicts: CFFTopDict[], length: number, removeCidKeys: boolean): {
        trackers: CFFOffsetTracker[];
        output: number[];
    };
    compilePrivateDicts(dicts: CFFTopDict[], trackers: CFFOffsetTracker[], output: CompileOutput): void;
    compileDict(dict: CFFDict, offsetTracker: CFFOffsetTracker): number[];
    compileStringIndex(strings: string[]): number[];
    compileCharStrings(charStrings: CFFIndex): number[];
    compileCharset(charset: CFFCharset, numGlyphs: number, strings: CFFStrings, isCIDFont: boolean): number[];
    compileEncoding(encoding: CFFEncoding): number[];
    compileFDSelect(fdSelect: CFFFDSelect): number[];
    compileTypedArray(data: Uint8Array | Uint8ClampedArray): number[];
    compileIndex<T extends number[] | Uint8Array | Uint8ClampedArray>(index: CFFIndex<T>, trackers?: CFFOffsetTracker[]): number[];
}
export {};
//# sourceMappingURL=cff_parser.d.ts.map