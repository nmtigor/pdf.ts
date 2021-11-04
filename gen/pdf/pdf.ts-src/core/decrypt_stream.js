/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
 */
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
    /** @implements */
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
        let bufferLength = this.bufferLength;
        const n = chunk.length, buffer = this.ensureBuffer(bufferLength + n);
        for (let i = 0; i < n; i++) {
            buffer[bufferLength++] = chunk[i];
        }
        this.bufferLength = bufferLength;
    }
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=decrypt_stream.js.map