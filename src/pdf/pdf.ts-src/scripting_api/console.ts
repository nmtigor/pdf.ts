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

import { PDFObject, ScriptingData, SendData } from "./pdf_object.ts";
/*80--------------------------------------------------------------------------*/

interface _SendConsoleData extends SendData {
  command?: string;
  value?: string;
}

export interface ScriptingConsoleData extends ScriptingData<_SendConsoleData> {
}

export class Console extends PDFObject<_SendConsoleData> {
  clear() {
    this._send!({ id: "clear" });
  }

  hide() {
    /* Not implemented */
  }

  println(msg: unknown) {
    if (typeof msg === "string") {
      this._send!({ command: "println", value: "PDF.js Console:: " + msg });
    }
  }

  show() {
    /* Not implemented */
  }
}
/*80--------------------------------------------------------------------------*/
