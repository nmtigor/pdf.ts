import { BaseStream } from "./base_stream.js";
import { ImageStream } from "./decode_stream.js";
import { Dict } from "./primitives.js";
/**
 * For JBIG2's we use a library to decode these images and
 * the stream behaves like all the other DecodeStreams.
 */
export declare class Jbig2Stream extends ImageStream {
    constructor(stream: BaseStream, maybeLength?: number, params?: Dict);
    get bytes(): Uint8Array | Uint8ClampedArray;
    /** @implement */
    readBlock(): void;
    ensureBuffer(requested: number): any;
}
//# sourceMappingURL=jbig2_stream.d.ts.map