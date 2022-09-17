/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
import { isWhiteSpace } from "./core_utils.js";
import { DecodeStream } from "./decode_stream.js";
/*80--------------------------------------------------------------------------*/
export class Ascii85Stream extends DecodeStream {
    input = new Uint8Array(5);
    constructor(str, maybeLength) {
        // Most streams increase in size when decoded, but Ascii85 streams
        // typically shrink by ~20%.
        if (maybeLength) {
            maybeLength *= 0.8;
        }
        super(maybeLength);
        this.str = str;
        this.dict = str.dict;
    }
    /** @implement */
    readBlock() {
        const TILDA_CHAR = 0x7e; // '~'
        const Z_LOWER_CHAR = 0x7a; // 'z'
        const EOF = -1;
        const str = this.str;
        let c = str.getByte();
        while (isWhiteSpace(c)) {
            c = str.getByte();
        }
        if (c === EOF || c === TILDA_CHAR) {
            this.eof = true;
            return;
        }
        const bufferLength = this.bufferLength;
        let buffer, i;
        // special code for z
        if (c === Z_LOWER_CHAR) {
            buffer = this.ensureBuffer(bufferLength + 4);
            for (i = 0; i < 4; ++i) {
                buffer[bufferLength + i] = 0;
            }
            this.bufferLength += 4;
        }
        else {
            const input = this.input;
            input[0] = c;
            for (i = 1; i < 5; ++i) {
                c = str.getByte();
                while (isWhiteSpace(c)) {
                    c = str.getByte();
                }
                input[i] = c;
                if (c === EOF || c === TILDA_CHAR) {
                    break;
                }
            }
            buffer = this.ensureBuffer(bufferLength + i - 1);
            this.bufferLength += i - 1;
            // partial ending;
            if (i < 5) {
                for (; i < 5; ++i) {
                    input[i] = 0x21 + 84;
                }
                this.eof = true;
            }
            let t = 0;
            for (i = 0; i < 5; ++i) {
                t = t * 85 + (input[i] - 0x21);
            }
            for (i = 3; i >= 0; --i) {
                buffer[bufferLength + i] = t & 0xff;
                t >>= 8;
            }
        }
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=ascii_85_stream.js.map