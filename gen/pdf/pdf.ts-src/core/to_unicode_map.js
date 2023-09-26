/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
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
/*80--------------------------------------------------------------------------*/
export class ToUnicodeMap {
    /**
     * The elements of this.#map can be integers or strings, depending on how
     * `cmap` was created.
     */
    _map;
    get length() {
        return this._map.length;
    }
    constructor(cmap = []) {
        this._map = cmap;
    }
    forEach(callback) {
        for (const charCode in this._map) {
            callback(charCode, this._map[charCode].charCodeAt(0));
        }
    }
    has(i) {
        return this._map[i] !== undefined;
    }
    get(i) {
        return this._map[i];
    }
    charCodeOf(value) {
        // `Array.prototype.indexOf` is *extremely* inefficient for arrays which
        // are both very sparse and very large (see issue8372.pdf).
        const map = this._map;
        if (map.length <= 0x10000) {
            return map.indexOf(value);
        }
        for (const charCode in map) {
            if (map[charCode] === value) {
                return +charCode | 0;
            }
        }
        return -1;
    }
    amend(map) {
        for (const charCode in map) {
            this._map[charCode] = map[charCode];
        }
    }
}
export class IdentityToUnicodeMap {
    firstChar;
    lastChar;
    get length() {
        return this.lastChar + 1 - this.firstChar;
    }
    constructor(firstChar, lastChar) {
        this.firstChar = firstChar;
        this.lastChar = lastChar;
    }
    forEach(callback) {
        for (let i = this.firstChar, ii = this.lastChar; i <= ii; i++) {
            callback(i, i);
        }
    }
    has(i) {
        return this.firstChar <= i && i <= this.lastChar;
    }
    get(i) {
        if (this.firstChar <= i && i <= this.lastChar) {
            return String.fromCharCode(i);
        }
        return undefined;
    }
    charCodeOf(v) {
        return Number.isInteger(v) && v >= this.firstChar &&
            v <= this.lastChar
            ? v
            : -1;
    }
    amend(map) {
        fail("Should not call amend()");
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=to_unicode_map.js.map