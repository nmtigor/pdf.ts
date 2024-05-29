/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/scripting_api/thermometer.ts
 * @license Apache-2.0
 ******************************************************************************/
/* Copyright 2020 Mozilla Foundation
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
import { PDFObject } from "./pdf_object.js";
export class Thermometer extends PDFObject {
    _cancelled = false;
    get cancelled() {
        return this._cancelled;
    }
    set cancelled(_) {
        throw new Error("thermometer.cancelled is read-only");
    }
    _duration = 100;
    get duration() {
        return this._duration;
    }
    set duration(val) {
        this._duration = val;
    }
    _text = "";
    get text() {
        return this._text;
    }
    set text(val) {
        this._text = val;
    }
    _value = 0;
    get value() {
        return this._value;
    }
    set value(val) {
        this._value = val;
    }
    constructor(data) {
        super(data);
    }
    begin() {
        /* TODO */
    }
    end() {
        /* TODO */
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=thermometer.js.map