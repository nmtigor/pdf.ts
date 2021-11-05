/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
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

import { BaseStream } from "./base_stream.js";
import { DecodeStream } from "./decode_stream.js";
/*81---------------------------------------------------------------------------*/

class AsciiHexStream extends DecodeStream
{
  firstDigit = -1;

  constructor( str:BaseStream, maybeLength:number )
  {
    // Most streams increase in size when decoded, but AsciiHex streams shrink
    // by 50%.
    if (maybeLength) {
      maybeLength *= 0.5;
    }
    super( maybeLength );

    this.str = str;
    this.dict = str.dict;
  }

  /** @implements */
  readBlock()
  {
    const UPSTREAM_BLOCK_SIZE = 8000;
    const bytes = this.str!.getBytes(UPSTREAM_BLOCK_SIZE);
    if (!bytes.length) {
      this.eof = true;
      return;
    }

    const maxDecodeLength = (bytes.length + 1) >> 1;
    const buffer = this.ensureBuffer(this.bufferLength + maxDecodeLength);
    let bufferLength = this.bufferLength;

    let firstDigit = this.firstDigit;
    for (const ch of bytes) {
      let digit;
      if (ch >= /* '0' = */ 0x30 && ch <= /* '9' = */ 0x39) {
        digit = ch & 0x0f;
      } 
      else if (
        (ch >= /* 'A' = */ 0x41 && ch <= /* 'Z' = */ 0x46) ||
        (ch >= /* 'a' = */ 0x61 && ch <= /* 'z' = */ 0x66)
      ) {
        digit = (ch & 0x0f) + 9;
      } 
      else if (ch === /* '>' = */ 0x3e) {
        this.eof = true;
        break;
      } 
      else {
        // Probably whitespace, ignoring.
        continue;
      }
      if (firstDigit < 0) {
        firstDigit = digit;
      } 
      else {
        buffer[bufferLength++] = (firstDigit << 4) | digit;
        firstDigit = -1;
      }
    }
    if (firstDigit >= 0 && this.eof) {
      // incomplete byte
      buffer[bufferLength++] = firstDigit << 4;
      firstDigit = -1;
    }
    this.firstDigit = firstDigit;
    this.bufferLength = bufferLength;
  }
}

export { AsciiHexStream };
/*81---------------------------------------------------------------------------*/
