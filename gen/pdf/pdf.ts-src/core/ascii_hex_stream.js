/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
import { DecodeStream } from "./decode_stream.js";
/*80--------------------------------------------------------------------------*/
export class AsciiHexStream extends DecodeStream {
    firstDigit = -1;
    constructor(str, maybeLength) {
        // Most streams increase in size when decoded, but AsciiHex streams shrink
        // by 50%.
        if (maybeLength) {
            maybeLength *= 0.5;
        }
        super(maybeLength);
        this.str = str;
        this.dict = str.dict;
    }
    /** @implement */
    readBlock() {
        const UPSTREAM_BLOCK_SIZE = 8000;
        const bytes = this.str.getBytes(UPSTREAM_BLOCK_SIZE);
        if (!bytes.length) {
            this.eof = true;
            return;
        }
        const maxDecodeLength = (bytes.length + 1) >> 1;
        const buffer = this.ensureBuffer(this.bufferLength + maxDecodeLength);
        let bufferLength = this.bufferLength;
        let firstDigit = this.firstDigit;
        for (const ch of bytes) {
            let digit;
            if (ch >= /* '0' = */ 0x30 && ch <= /* '9' = */ 0x39) {
                digit = ch & 0x0f;
            }
            else if ((ch >= /* 'A' = */ 0x41 && ch <= /* 'Z' = */ 0x46) ||
                (ch >= /* 'a' = */ 0x61 && ch <= /* 'z' = */ 0x66)) {
                digit = (ch & 0x0f) + 9;
            }
            else if (ch === /* '>' = */ 0x3e) {
                this.eof = true;
                break;
            } // Probably whitespace, ignoring.
            else {
                continue;
            }
            if (firstDigit < 0) {
                firstDigit = digit;
            }
            else {
                buffer[bufferLength++] = (firstDigit << 4) | digit;
                firstDigit = -1;
            }
        }
        if (firstDigit >= 0 && this.eof) {
            // incomplete byte
            buffer[bufferLength++] = firstDigit << 4;
            firstDigit = -1;
        }
        this.firstDigit = firstDigit;
        this.bufferLength = bufferLength;
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=ascii_hex_stream.js.map