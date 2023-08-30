import { Ascii85Stream } from "./ascii_85_stream.js";
import { AsciiHexStream } from "./ascii_hex_stream.js";
import type { BaseStream } from "./base_stream.js";
import { CCITTFaxStream } from "./ccitt_stream.js";
import type { CipherTransform } from "./crypto.js";
import type { OpMap } from "./evaluator.js";
import { FlateStream } from "./flate_stream.js";
import { Jbig2Stream } from "./jbig2_stream.js";
import { JpegStream } from "./jpeg_stream.js";
import { JpxStream } from "./jpx_stream.js";
import { LZWStream } from "./lzw_stream.js";
import { PredictorStream } from "./predictor_stream.js";
import { Dict, Name, type Obj } from "./primitives.js";
import { RunLengthStream } from "./run_length_stream.js";
import { Stream } from "./stream.js";
import type { XRef } from "./xref.js";
interface _ParserCtorP {
    lexer: Lexer;
    xref?: XRef | undefined;
    allowStreams?: boolean;
    recoveryMode?: boolean;
}
/** @final */
export declare class Parser {
    lexer: Lexer;
    xref?: XRef | undefined;
    allowStreams: boolean;
    recoveryMode: boolean;
    imageCache: Record<string, any>;
    _imageId: number;
    buf1: Obj;
    buf2: Obj;
    constructor({ lexer, xref, allowStreams, recoveryMode, }: _ParserCtorP);
    refill(): void;
    shift(): void;
    tryShift(): boolean;
    getObj(cipherTransform?: CipherTransform): Obj;
    /**
     * Find the end of the stream by searching for the /EI\s/.
     * @return The inline stream length.
     */
    findDefaultInlineStreamEnd(stream: BaseStream): number;
    /**
     * Find the EOI (end-of-image) marker 0xFFD9 of the stream.
     * @return The inline stream length.
     */
    findDCTDecodeInlineStreamEnd(stream: BaseStream): number;
    /**
     * Find the EOD (end-of-data) marker '~>' (i.e. TILDE + GT) of the stream.
     * @return The inline stream length.
     */
    findASCII85DecodeInlineStreamEnd(stream: BaseStream): number;
    /**
     * Find the EOD (end-of-data) marker '>' (i.e. GT) of the stream.
     * @return The inline stream length.
     */
    findASCIIHexDecodeInlineStreamEnd(stream: BaseStream): number;
    /**
     * Skip over the /EI/ for streams where we search for an EOD marker.
     */
    inlineStreamSkipEI(stream: BaseStream): void;
    makeInlineImage(cipherTransform?: CipherTransform): any;
    _findStreamLength(startPos: number, signature: Uint8Array): number;
    makeStream(dict: Dict, cipherTransform?: CipherTransform): BaseStream;
    filter(stream: BaseStream, dict: Dict, length: number): BaseStream | Ascii85Stream | AsciiHexStream | CCITTFaxStream | FlateStream | Jbig2Stream | JpegStream | JpxStream | LZWStream | PredictorStream | RunLengthStream;
    makeFilter(stream: BaseStream, name: string, maybeLength?: number, params?: Dict): BaseStream | Ascii85Stream | AsciiHexStream | CCITTFaxStream | FlateStream | Jbig2Stream | JpegStream | JpxStream | LZWStream | PredictorStream | RunLengthStream;
}
/** @final */
export declare class Lexer {
    #private;
    stream: BaseStream;
    currentChar: number;
    /**
     * While lexing, we build up many strings one char at a time. Using += for
     * this can result in lots of garbage strings. It's better to build an
     * array of single-char strings and then join() them together at the end.
     * And reusing a single array (i.e. |this.strBuf|) over and over for this
     * purpose uses less memory than using a new array for each string.
     */
    strBuf: string[];
    /**
     * The PDFs might have "glued" commands with other commands, operands or
     * literals, e.g. "q1". The knownCommands is a dictionary of the valid
     * commands and their prefixes. The prefixes are built the following way:
     * if there a command that is a prefix of the other valid command or
     * literal (e.g. 'f' and 'false') the following prefixes must be included,
     * 'fa', 'fal', 'fals'. The prefixes are not needed, if the command has no
     * other commands or literals as a prefix. The knowCommands is optional.
     */
    knownCommands: OpMap | undefined;
    beginInlineImagePos: number;
    constructor(stream: BaseStream, knownCommands?: OpMap);
    nextChar(): number;
    peekChar(): number;
    getNumber(): number;
    getString(): string;
    getName(): Name;
    /**
     * @private
     */
    _hexStringWarn(ch: number): void;
    getHexString(): string;
    getObj(): Obj;
    skipToNextLine(): void;
}
export declare class Linearization {
    length: number;
    hints: number[];
    objectNumberFirst: number;
    endFirst: number;
    numPages: number;
    mainXRefEntriesOffset: number;
    pageFirst: number;
    static create(stream: Stream): Linearization | null;
}
export {};
//# sourceMappingURL=parser.d.ts.map