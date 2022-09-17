import { BaseStream } from "./base_stream.js";
import { DecodeStream } from "./decode_stream.js";
export declare class AsciiHexStream extends DecodeStream {
    firstDigit: number;
    constructor(str: BaseStream, maybeLength: number);
    /** @implement */
    readBlock(): void;
}
//# sourceMappingURL=ascii_hex_stream.d.ts.map