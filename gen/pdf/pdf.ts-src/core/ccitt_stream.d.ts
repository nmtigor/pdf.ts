import { BaseStream } from "./base_stream.js";
import { CCITTFaxDecoder } from "./ccitt.js";
import { DecodeStream } from "./decode_stream.js";
import { Dict } from "./primitives.js";
export declare class CCITTFaxStream extends DecodeStream {
    ccittFaxDecoder: CCITTFaxDecoder;
    constructor(str: BaseStream, maybeLength?: number, params?: Dict);
    /** @implement */
    readBlock(): void;
}
//# sourceMappingURL=ccitt_stream.d.ts.map