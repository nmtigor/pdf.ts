/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
 */
import { DecodeStream } from "./decode_stream.js";
/*81---------------------------------------------------------------------------*/
export class RunLengthStream extends DecodeStream {
    constructor(str, maybeLength) {
        super(maybeLength);
        this.str = str;
        this.dict = str.dict;
    }
    /** @implements */
    readBlock() {
        // The repeatHeader has following format. The first byte defines type of run
        // and amount of bytes to repeat/copy: n = 0 through 127 - copy next n bytes
        // (in addition to the second byte from the header), n = 129 through 255 -
        // duplicate the second byte from the header (257 - n) times, n = 128 - end.
        const repeatHeader = this.str.getBytes(2);
        if (!repeatHeader || repeatHeader.length < 2 || repeatHeader[0] === 128) {
            this.eof = true;
            return;
        }
        let buffer;
        let bufferLength = this.bufferLength;
        let n = repeatHeader[0];
        if (n < 128) {
            // copy n bytes
            buffer = this.ensureBuffer(bufferLength + n + 1);
            buffer[bufferLength++] = repeatHeader[1];
            if (n > 0) {
                const source = this.str.getBytes(n);
                buffer.set(source, bufferLength);
                bufferLength += n;
            }
        }
        else {
            n = 257 - n;
            const b = repeatHeader[1];
            buffer = this.ensureBuffer(bufferLength + n + 1);
            for (let i = 0; i < n; i++) {
                buffer[bufferLength++] = b;
            }
        }
        this.bufferLength = bufferLength;
    }
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=run_length_stream.js.map