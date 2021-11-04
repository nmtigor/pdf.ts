import { BaseStream } from "./base_stream.js";
import { DecodeStream } from "./decode_stream.js";
interface LZWState {
    earlyChange: number;
    codeLength: number;
    prevCode?: number | undefined;
    nextCode: number;
    dictionaryValues: Uint8Array;
    dictionaryLengths: Uint16Array;
    dictionaryPrevCodes: Uint16Array;
    currentSequence: Uint8Array;
    currentSequenceLength: number;
}
export declare class LZWStream extends DecodeStream {
    cachedData: number;
    bitsCached: number;
    lzwState?: LZWState;
    constructor(str: BaseStream, maybeLength: number | undefined, earlyChange: number);
    readBits(n: number): number | undefined;
    /** @implements */
    protected readBlock(): void;
}
export {};
//# sourceMappingURL=lzw_stream.d.ts.map