/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
 */
/* Copyright 2021 Mozilla Foundation
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
import { bytesToString, shadow } from "../shared/util.js";
/*81---------------------------------------------------------------------------*/
export class BaseStream {
    pos = 0;
    start;
    end;
    get isDataLoaded() { return shadow(this, "isDataLoaded", true); }
    dict;
    cacheKey;
    /** @final */
    peekByte() {
        const peekedByte = this.getByte();
        if (peekedByte !== -1) {
            this.pos--;
        }
        return peekedByte;
    }
    /** @final */
    peekBytes(length, forceClamped = false) {
        const bytes = this.getBytes(length, forceClamped);
        this.pos -= bytes.length;
        return bytes;
    }
    /** @final */
    getUint16() {
        const b0 = this.getByte();
        const b1 = this.getByte();
        if (b0 === -1 || b1 === -1) {
            return -1;
        }
        return (b0 << 8) + b1;
    }
    /** @final */
    getInt32() {
        const b0 = this.getByte();
        const b1 = this.getByte();
        const b2 = this.getByte();
        const b3 = this.getByte();
        return (b0 << 24) + (b1 << 16) + (b2 << 8) + b3;
    }
    /** @final */
    getString(length) {
        return bytesToString(this.getBytes(length, false));
    }
    /** @final */
    skip(n) { this.pos += n || 1; }
    getBaseStreams() {
        return undefined;
    }
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=base_stream.js.map