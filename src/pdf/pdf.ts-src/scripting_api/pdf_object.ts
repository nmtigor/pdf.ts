/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/scripting_api/pdf_object.ts
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

import type { ScriptingDocProperties } from "@pdf.ts-web/app.ts";
/*80--------------------------------------------------------------------------*/

export interface SendData {
  id?: string | undefined;
  command?: string;
}

export type Send<D extends SendData> = (data: D) => void;

export interface ScriptingData<D extends SendData>
  extends ScriptingDocProperties {
  send?: Send<D>;
  id?: string;
}

export class PDFObject<D extends SendData> {
  _expandos;
  _send;
  _id;

  constructor(data: ScriptingData<D>) {
    this._expandos = Object.create(null);
    this._send = data.send || undefined;
    this._id = data.id || undefined;
  }
}
/*80--------------------------------------------------------------------------*/
