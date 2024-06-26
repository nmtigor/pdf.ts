/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/decrypt_stream.ts
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

import type { BaseStream } from "./base_stream.ts";
import { DecodeStream } from "./decode_stream.ts";
/*80--------------------------------------------------------------------------*/

type Decrypt = (
  data: Uint8Array | Uint8ClampedArray,
  finalize: boolean,
) => Uint8Array | Uint8ClampedArray;

const chunkSize = 512;

/** @final */
export class DecryptStream extends DecodeStream {
  decrypt;

  nextChunk?: Uint8Array | Uint8ClampedArray;
  initialized = false;

  constructor(str: BaseStream, maybeLength: number, decrypt: Decrypt) {
    super(maybeLength);

    this.str = str;
    this.dict = str.dict;
    this.decrypt = decrypt;
  }

  /** @implement */
  readBlock() {
    let chunk;
    if (this.initialized) {
      chunk = this.nextChunk;
    } else {
      chunk = this.str!.getBytes(chunkSize);
      this.initialized = true;
    }
    if (!chunk || chunk.length === 0) {
      this.eof = true;
      return;
    }
    this.nextChunk = this.str!.getBytes(chunkSize);
    const hasMoreData = this.nextChunk && this.nextChunk.length > 0;

    const decrypt = this.decrypt;
    chunk = decrypt(chunk, !hasMoreData);

    const bufferLength = this.bufferLength,
      newLength = bufferLength + chunk.length,
      buffer = this.ensureBuffer(newLength);
    buffer.set(chunk, bufferLength);
    this.bufferLength = newLength;
  }
}
/*80--------------------------------------------------------------------------*/
