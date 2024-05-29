/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/decrypt_stream.ts
 * @license Apache-2.0
 ******************************************************************************/
import { DecodeStream } from "./decode_stream.js";
const chunkSize = 512;
/** @final */
export class DecryptStream extends DecodeStream {
    decrypt;
    nextChunk;
    initialized = false;
    constructor(str, maybeLength, decrypt) {
        super(maybeLength);
        this.str = str;
        this.dict = str.dict;
        this.decrypt = decrypt;
    }
    /** @implement */
    readBlock() {
        let chunk;
        if (this.initialized) {
            chunk = this.nextChunk;
        }
        else {
            chunk = this.str.getBytes(chunkSize);
            this.initialized = true;
        }
        if (!chunk || chunk.length === 0) {
            this.eof = true;
            return;
        }
        this.nextChunk = this.str.getBytes(chunkSize);
        const hasMoreData = this.nextChunk && this.nextChunk.length > 0;
        const decrypt = this.decrypt;
        chunk = decrypt(chunk, !hasMoreData);
        const bufferLength = this.bufferLength, newLength = bufferLength + chunk.length, buffer = this.ensureBuffer(newLength);
        buffer.set(chunk, bufferLength);
        this.bufferLength = newLength;
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=decrypt_stream.js.map