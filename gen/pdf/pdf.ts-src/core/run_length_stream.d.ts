import { BaseStream } from "./base_stream.js";
import { DecodeStream } from "./decode_stream.js";
export declare class RunLengthStream extends DecodeStream {
    constructor(str: BaseStream, maybeLength?: number);
    /** @implements */
    readBlock(): void;
}
//# sourceMappingURL=run_length_stream.d.ts.map