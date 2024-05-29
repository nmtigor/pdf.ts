/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/jpx_stream.ts
 * @license Apache-2.0
 ******************************************************************************/
import { BaseStream } from "./base_stream.js";
import { ImageStream } from "./decode_stream.js";
import { Dict } from "./primitives.js";
/**
 * For JPEG 2000's we use a library to decode these images and
 * the stream behaves like all the other DecodeStreams.
 */
export declare class JpxStream extends ImageStream {
    constructor(stream: BaseStream, maybeLength?: number, params?: Dict);
    get bytes(): Uint8Array | Uint8ClampedArray;
    /** @implement */
    readBlock(): void;
    ensureBuffer(requested: number): any;
}
//# sourceMappingURL=jpx_stream.d.ts.map