/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
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
import { Cursor } from "./constants.js";
import { PDFObject } from "./pdf_object.js";
export class FullScreen extends PDFObject {
    _backgroundColor = [];
    get backgroundColor() {
        return this._backgroundColor;
    }
    set backgroundColor(_) { }
    _clickAdvances = true;
    get clickAdvances() {
        return this._clickAdvances;
    }
    set clickAdvances(_) { }
    _cursor = Cursor.hidden;
    get cursor() {
        return this._cursor;
    }
    set cursor(_) { }
    _defaultTransition = "";
    get defaultTransition() {
        return this._defaultTransition;
    }
    set defaultTransition(_) { }
    _escapeExits = true;
    get escapeExits() {
        return this._escapeExits;
    }
    set escapeExits(_) { }
    _isFullScreen = true;
    get isFullScreen() {
        return this._isFullScreen;
    }
    set isFullScreen(_) { }
    _loop = false;
    get loop() {
        return this._loop;
    }
    set loop(_) { }
    _timeDelay = 3600;
    get timeDelay() {
        return this._timeDelay;
    }
    set timeDelay(_) { }
    _usePageTiming = false;
    get usePageTiming() {
        return this._usePageTiming;
    }
    set usePageTiming(_) { }
    _useTimer = false;
    get useTimer() {
        return this._useTimer;
    }
    set useTimer(_) { }
    constructor(data) {
        super(data);
    }
    get transitions() {
        // This list of possible value for transition has been found:
        // https://www.adobe.com/content/dam/acom/en/devnet/acrobat/pdfs/5186AcroJS.pdf#page=198
        return [
            "Replace",
            "WipeRight",
            "WipeLeft",
            "WipeDown",
            "WipeUp",
            "SplitHorizontalIn",
            "SplitHorizontalOut",
            "SplitVerticalIn",
            "SplitVerticalOut",
            "BlindsHorizontal",
            "BlindsVertical",
            "BoxIn",
            "BoxOut",
            "GlitterRight",
            "GlitterDown",
            "GlitterRightDown",
            "Dissolve",
            "Random",
        ];
    }
    set transitions(_) {
        throw new Error("fullscreen.transitions is read-only");
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=fullscreen.js.map