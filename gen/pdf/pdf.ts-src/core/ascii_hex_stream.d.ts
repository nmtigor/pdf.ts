/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/ascii_hex_stream.ts
 * @license Apache-2.0
 ******************************************************************************/
import { BaseStream } from "./base_stream.js";
import { DecodeStream } from "./decode_stream.js";
export declare class AsciiHexStream extends DecodeStream {
    firstDigit: number;
    constructor(str: BaseStream, maybeLength: number);
    /** @implement */
    readBlock(): void;
}
//# sourceMappingURL=ascii_hex_stream.d.ts.map