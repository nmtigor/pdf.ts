import { DecodeStream } from "./decode_stream.js";
import { BaseStream } from "./base_stream.js";
export declare class Ascii85Stream extends DecodeStream {
    input: Uint8Array;
    constructor(str: BaseStream, maybeLength: number);
    /** @implements */
    protected readBlock(): void;
}
//# sourceMappingURL=ascii_85_stream.d.ts.map