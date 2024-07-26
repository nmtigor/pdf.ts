/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/ccitt_stream.ts
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
import { CCITTFaxDecoder } from "./ccitt.js";
import { DecodeStream } from "./decode_stream.js";
import { Dict } from "./primitives.js";
/*80--------------------------------------------------------------------------*/
export class CCITTFaxStream extends DecodeStream {
    ccittFaxDecoder;
    constructor(str, maybeLength, params) {
        super(maybeLength);
        this.str = str;
        this.dict = str.dict;
        if (!(params instanceof Dict)) {
            params = Dict.empty;
        }
        const source = {
            next() {
                return str.getByte();
            },
        };
        this.ccittFaxDecoder = new CCITTFaxDecoder(source, {
            K: params.get("K"),
            EndOfLine: params.get("EndOfLine"),
            EncodedByteAlign: params.get("EncodedByteAlign"),
            Columns: params.get("Columns"),
            Rows: params.get("Rows"),
            EndOfBlock: params.get("EndOfBlock"),
            BlackIs1: params.get("BlackIs1"),
        });
    }
    /** @implement */
    readBlock() {
        while (!this.eof) {
            const c = this.ccittFaxDecoder.readNextChar();
            if (c === -1) {
                this.eof = true;
                return;
            }
            this.ensureBuffer(this.bufferLength + 1);
            this.buffer[this.bufferLength++] = c;
        }
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
//# sourceMappingURL=ccitt_stream.js.map