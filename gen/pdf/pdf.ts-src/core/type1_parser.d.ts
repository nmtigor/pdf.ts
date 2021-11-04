import { Stream } from "./stream.js";
import { FontProps } from "./evaluator.js";
declare namespace NsType1Parser {
    export interface PrivateData {
        BlueValues: number[];
        OtherBlues?: number[];
        FamilyBlues?: number[];
        FamilyOtherBlues?: number[];
        BlueScale?: number;
        BlueShift?: number;
        BlueFuzz?: number;
        StemSnapH?: number[];
        StemSnapV?: number[];
        StdHW?: number;
        StdVW?: number;
        ForceBold?: 0 | 1;
        LanguageGroup?: number;
        lenIV: number;
        ExpansionFactor?: number;
    }
    export interface CharStringObject {
        glyphName: string;
        charstring: number[];
        width: number;
        lsb: number;
        seac?: number[] | undefined;
    }
    interface FontProgramProp {
        privateData: PrivateData;
    }
    export interface FontProgram {
        subrs: number[][];
        charstrings: CharStringObject[];
        properties: FontProgramProp;
    }
    export class Type1Parser {
        stream: Stream;
        seacAnalysisEnabled: boolean;
        currentChar: number;
        constructor(stream: Stream, encrypted: boolean, seacAnalysisEnabled: boolean);
        readNumberArray(): number[];
        readNumber(): number;
        readInt(): number;
        readBoolean(): 0 | 1;
        nextChar(): number;
        getToken(): string | null;
        readCharStrings(bytes: Uint8Array | Uint8ClampedArray, lenIV: number): Uint8Array | Uint8ClampedArray;
        extractFontProgram(properties: FontProps): FontProgram;
        extractFontHeader(properties: FontProps): void;
    }
    export {};
}
export import Type1Parser = NsType1Parser.Type1Parser;
export import PrivateData = NsType1Parser.PrivateData;
export import CharStringObject = NsType1Parser.CharStringObject;
export import FontProgram = NsType1Parser.FontProgram;
export {};
//# sourceMappingURL=type1_parser.d.ts.map