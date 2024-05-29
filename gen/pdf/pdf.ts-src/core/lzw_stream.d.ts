/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/lzw_stream.ts
 * @license Apache-2.0
 ******************************************************************************/
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
    /** @implement */
    protected readBlock(): void;
}
export {};
//# sourceMappingURL=lzw_stream.d.ts.map