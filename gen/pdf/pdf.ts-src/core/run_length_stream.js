/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/run_length_stream.ts
 * @license Apache-2.0
 ******************************************************************************/
/* Copyright 2012 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { fail } from "../../../lib/util/trace.js";
import { DecodeStream } from "./decode_stream.js";
/*80--------------------------------------------------------------------------*/
export class RunLengthStream extends DecodeStream {
    constructor(str, maybeLength) {
        super(maybeLength);
        this.str = str;
        this.dict = str.dict;
    }
    /** @implement */
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
    /** @implement */
    async asyncGetBytes() {
        return fail("Not implemented");
    }
    /** @implement */
    decodeImage() {
        return fail("Not implemented");
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=run_length_stream.js.map