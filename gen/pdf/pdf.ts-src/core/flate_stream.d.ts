/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/flate_stream.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { BaseStream } from "./base_stream.js";
import { DecodeStream } from "./decode_stream.js";
type FlateTable = [Int32Array, number];
/** @final */
export declare class FlateStream extends DecodeStream {
    #private;
    codeSize: number;
    codeBuf: number;
    constructor(str: BaseStream, maybeLength?: number);
    getBits(bits: number): number;
    getCode(table: FlateTable): number;
    generateHuffmanTable(lengths: Uint8Array): FlateTable;
    /** @implement */
    readBlock(): void;
}
export {};
//# sourceMappingURL=flate_stream.d.ts.map