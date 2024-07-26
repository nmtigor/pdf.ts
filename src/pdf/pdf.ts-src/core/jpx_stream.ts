/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/jpx_stream.ts
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

import { fail } from "@fe-lib/util/trace.ts";
import { shadow } from "../shared/util.ts";
import { BaseStream } from "./base_stream.ts";
import { ImageStream } from "./decode_stream.ts";
import type { DecoderOptions } from "./image.ts";
import { JpxImage } from "./jpx.ts";
import { Dict } from "./primitives.ts";
/*80--------------------------------------------------------------------------*/

/**
 * For JPEG 2000's we use a library to decode these images and
 * the stream behaves like all the other DecodeStreams.
 */
export class JpxStream extends ImageStream {
  constructor(stream: BaseStream, maybeLength?: number, params?: Dict) {
    super(stream, maybeLength, params);
  }

  get bytes() {
    // If `this.maybeLength` is null, we'll get the entire stream.
    return shadow(this, "bytes", this.stream.getBytes(this.maybeLength));
  }

  /** @implement */
  readBlock(decoderOptions?: DecoderOptions) {
    this.decodeImage(undefined, decoderOptions);
  }

  /** @implement */
  async asyncGetBytes() {
    return fail("Not implemented");
  }

  decodeImage(
    bytes?: Uint8Array | Uint8ClampedArray,
    decoderOptions?: DecoderOptions,
  ) {
    if (this.eof) {
      return this.buffer;
    }
    bytes ||= this.bytes;
    this.buffer = JpxImage.decode(bytes, decoderOptions) as
      | Uint8Array
      | Uint8ClampedArray;
    this.bufferLength = this.buffer.length;
    this.eof = true;

    return this.buffer;
  }

  override get canAsyncDecodeImageFromBuffer() {
    return this.stream.isAsync;
  }

  override ensureBuffer(requested: number) {
    // No-op, since `this.readBlock` will always parse the entire image and
    // directly insert all of its data into `this.buffer`.
    return undefined as any;
  }
}
/*80--------------------------------------------------------------------------*/
