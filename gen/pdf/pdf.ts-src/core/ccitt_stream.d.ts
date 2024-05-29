/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/ccitt_stream.ts
 * @license Apache-2.0
 ******************************************************************************/
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