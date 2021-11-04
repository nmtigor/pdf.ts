import { DecodeStream } from "./decode_stream.js";
import { BaseStream } from "./base_stream.js";
declare type FlateTable = [Int32Array, number];
/** @final */
export declare class FlateStream extends DecodeStream {
    codeSize: number;
    codeBuf: number;
    constructor(str: BaseStream, maybeLength?: number);
    getBits(bits: number): number;
    getCode(table: FlateTable): number;
    generateHuffmanTable(lengths: Uint8Array): FlateTable;
    /** @implements */
    readBlock(): void;
}
export {};
//# sourceMappingURL=flate_stream.d.ts.map