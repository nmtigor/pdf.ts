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

import { Cursor } from "./constants.ts";
import { PDFObject, ScriptingData, SendData } from "./pdf_object.ts";
/*80--------------------------------------------------------------------------*/

interface _SendFullScreenData extends SendData {
}

export interface ScriptingFullScreenData
  extends ScriptingData<_SendFullScreenData> {
}

export class FullScreen extends PDFObject<_SendFullScreenData> {
  _backgroundColor: unknown[] = [];
  get backgroundColor() {
    return this._backgroundColor;
  }
  set backgroundColor(_) {/* TODO or not */}

  _clickAdvances = true;
  get clickAdvances() {
    return this._clickAdvances;
  }
  set clickAdvances(_) {/* TODO or not */}

  _cursor = Cursor.hidden;
  get cursor() {
    return this._cursor;
  }
  set cursor(_) {/* TODO or not */}

  _defaultTransition = "";
  get defaultTransition() {
    return this._defaultTransition;
  }
  set defaultTransition(_) {/* TODO or not */}

  _escapeExits = true;
  get escapeExits() {
    return this._escapeExits;
  }
  set escapeExits(_) {/* TODO or not */}

  _isFullScreen = true;
  get isFullScreen() {
    return this._isFullScreen;
  }
  set isFullScreen(_) {/* TODO or not */}

  _loop = false;
  get loop() {
    return this._loop;
  }
  set loop(_) {/* TODO or not */}

  _timeDelay = 3600;
  get timeDelay() {
    return this._timeDelay;
  }
  set timeDelay(_) {/* TODO or not */}

  _usePageTiming = false;
  get usePageTiming() {
    return this._usePageTiming;
  }
  set usePageTiming(_) {/* TODO or not */}

  _useTimer = false;
  get useTimer() {
    return this._useTimer;
  }
  set useTimer(_) {/* TODO or not */}

  constructor(data: ScriptingFullScreenData) {
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
