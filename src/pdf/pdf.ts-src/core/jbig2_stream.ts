/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/jbig2_stream.ts
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

import { shadow } from "../shared/util.ts";
import { BaseStream } from "./base_stream.ts";
import { ImageStream } from "./decode_stream.ts";
import { type Chunk, Jbig2Image } from "./jbig2.ts";
import { Dict } from "./primitives.ts";
/*80--------------------------------------------------------------------------*/

/**
 * For JBIG2's we use a library to decode these images and
 * the stream behaves like all the other DecodeStreams.
 */
export class Jbig2Stream extends ImageStream {
  constructor(stream: BaseStream, maybeLength?: number, params?: Dict) {
    super(stream, maybeLength, params);
  }

  get bytes() {
    // If `this.maybeLength` is null, we'll get the entire stream.
    return shadow(this, "bytes", this.stream.getBytes(this.maybeLength));
  }

  /** @implement */
  readBlock() {
    if (this.eof) {
      return;
    }
    const jbig2Image = new Jbig2Image();

    const chunks: Chunk[] = [];
    if (this.params instanceof Dict) {
      const globalsStream = this.params.get("JBIG2Globals");
      if (globalsStream instanceof BaseStream) {
        const globals = globalsStream.getBytes();
        chunks.push({ data: globals, start: 0, end: globals.length });
      }
    }
    chunks.push({ data: this.bytes, start: 0, end: this.bytes.length });
    const data = jbig2Image.parseChunks(chunks)!;
    const dataLength = data.length;

    // JBIG2 had black as 1 and white as 0, inverting the colors
    for (let i = 0; i < dataLength; i++) {
      data[i] ^= 0xff;
    }
    this.buffer = data;
    this.bufferLength = dataLength;
    this.eof = true;
  }

  override ensureBuffer(requested: number) {
    // No-op, since `this.readBlock` will always parse the entire image and
    // directly insert all of its data into `this.buffer`.
    return undefined as any;
  }
}
/*80--------------------------------------------------------------------------*/
