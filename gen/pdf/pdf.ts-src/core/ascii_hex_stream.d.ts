import { BaseStream } from "./base_stream.js";
import { DecodeStream } from "./decode_stream.js";
declare class AsciiHexStream extends DecodeStream {
    firstDigit: number;
    constructor(str: BaseStream, maybeLength: number);
    /** @implements */
    readBlock(): void;
}
export { AsciiHexStream };
//# sourceMappingURL=ascii_hex_stream.d.ts.map