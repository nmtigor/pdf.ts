import { Dict } from "./primitives.js";
import { CCITTFaxDecoder } from "./ccitt.js";
import { DecodeStream } from "./decode_stream.js";
import { BaseStream } from "./base_stream.js";
export declare class CCITTFaxStream extends DecodeStream {
    ccittFaxDecoder: CCITTFaxDecoder;
    constructor(str: BaseStream, maybeLength?: number, params?: Dict);
    /** @implements */
    readBlock(): void;
}
//# sourceMappingURL=ccitt_stream.d.ts.map