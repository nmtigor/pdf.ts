import { BaseStream } from "./base_stream.js";
import { DecodeStream } from "./decode_stream.js";
declare type Decrypt = (data: Uint8Array | Uint8ClampedArray, finalize: boolean) => Uint8Array | Uint8ClampedArray;
/** @final */
export declare class DecryptStream extends DecodeStream {
    decrypt: Decrypt;
    nextChunk?: Uint8Array | Uint8ClampedArray;
    initialized: boolean;
    constructor(str: BaseStream, maybeLength: number, decrypt: Decrypt);
    /** @implement */
    readBlock(): void;
}
export {};
//# sourceMappingURL=decrypt_stream.d.ts.map