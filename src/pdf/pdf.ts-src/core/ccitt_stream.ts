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

import { BaseStream } from "./base_stream.ts";
import { CCITTFaxDecoder } from "./ccitt.ts";
import { DecodeStream } from "./decode_stream.ts";
import { Dict } from "./primitives.ts";
/*80--------------------------------------------------------------------------*/

export class CCITTFaxStream extends DecodeStream {
  ccittFaxDecoder: CCITTFaxDecoder;

  constructor(str: BaseStream, maybeLength?: number, params?: Dict) {
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
      K: <number | undefined> params.get("K"),
      EndOfLine: <boolean | undefined> params.get("EndOfLine"),
      EncodedByteAlign: <boolean | undefined> params.get("EncodedByteAlign"),
      Columns: <number | undefined> params.get("Columns"),
      Rows: <number | undefined> params.get("Rows"),
      EndOfBlock: <boolean | undefined> params.get("EndOfBlock"),
      BlackIs1: <boolean | undefined> params.get("BlackIs1"),
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
}
/*80--------------------------------------------------------------------------*/
