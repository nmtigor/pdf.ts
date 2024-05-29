/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/ascii_85_stream.ts
 * @license Apache-2.0
 ******************************************************************************/
import { BaseStream } from "./base_stream.js";
import { DecodeStream } from "./decode_stream.js";
export declare class Ascii85Stream extends DecodeStream {
    input: Uint8Array;
    constructor(str: BaseStream, maybeLength: number);
    /** @implement */
    protected readBlock(): void;
}
//# sourceMappingURL=ascii_85_stream.d.ts.map