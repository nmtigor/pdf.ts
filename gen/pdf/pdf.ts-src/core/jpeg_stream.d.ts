/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/jpeg_stream.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { BaseStream } from "./base_stream.js";
import { ImageStream } from "./decode_stream.js";
import { Dict } from "./primitives.js";
/**
 * For JPEG's we use a library to decode these images and the stream behaves
 * like all the other DecodeStreams.
 */
export declare class JpegStream extends ImageStream {
    constructor(stream: BaseStream, maybeLength?: number, params?: Dict);
    get bytes(): Uint8Array | Uint8ClampedArray;
    /** @implement */
    readBlock(): void;
    ensureBuffer(requested: number): any;
}
//# sourceMappingURL=jpeg_stream.d.ts.map