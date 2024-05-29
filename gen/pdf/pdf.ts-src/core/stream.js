/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/stream.ts
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
import { stringToBytes } from "../shared/util.js";
import { BaseStream } from "./base_stream.js";
/*80--------------------------------------------------------------------------*/
export class Stream extends BaseStream {
    bytes;
    start;
    end;
    /** @implement */
    get length() {
        return this.end - this.start;
    }
    /** @implement */
    get isEmpty() {
        return this.length === 0;
    }
    constructor(arrayBuffer, start, length, dict) {
        super();
        this.bytes = arrayBuffer instanceof Uint8Array
            ? arrayBuffer
            : new Uint8Array(arrayBuffer);
        this.start = start || 0;
        this.pos = this.start;
        this.end = (start + length) || this.bytes.length;
        this.dict = dict;
    }
    /** @implement */
    getByte() {
        if (this.pos >= this.end) {
            return -1;
        }
        return this.bytes[this.pos++];
    }
    /** @implement */
    getBytes(length) {
        const bytes = this.bytes;
        const pos = this.pos;
        const strEnd = this.end;
        if (!length) {
            return bytes.subarray(pos, strEnd);
        }
        let end = pos + length;
        if (end > strEnd) {
            end = strEnd;
        }
        this.pos = end;
        return bytes.subarray(pos, end);
    }
    /** @implement */
    getByteRange(begin, end) {
        if (begin < 0) {
            begin = 0;
        }
        if (end > this.end) {
            end = this.end;
        }
        return this.bytes.subarray(begin, end);
    }
    /** @implement */
    reset() {
        this.pos = this.start;
    }
    /**
     * @implement
     * @final
     */
    moveStart() {
        this.start = this.pos;
    }
    /** @implement */
    makeSubStream(start, length, dict) {
        return new Stream(this.bytes.buffer, start, length, dict);
    }
}
export class StringStream extends Stream {
    constructor(str) {
        super(stringToBytes(str));
    }
}
export class NullStream extends Stream {
    constructor() {
        super(new Uint8Array(0));
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=stream.js.map