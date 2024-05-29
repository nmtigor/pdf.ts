/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/decode_stream.ts
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
import { BaseStream } from "./base_stream.ts";
import type { Dict } from "./primitives.ts";
import { Stream } from "./stream.ts";
/*80--------------------------------------------------------------------------*/

// Lots of DecodeStreams are created whose buffers are never used.  For these
// we share a single empty buffer. This is (a) space-efficient and (b) avoids
// having special cases that would be required if we used |null| for an empty
// buffer.
const emptyBuffer = new Uint8Array(0);

/**
 * Super class for the decoding streams.
 */
export abstract class DecodeStream extends BaseStream {
  buffer: Uint8Array | Uint8ClampedArray = emptyBuffer;

  _rawMinBufferLength;

  bufferLength = 0;
  eof = false;
  /** @implement */
  get length() {
    return fail("Abstract getter `length` accessed");
  }
  /**
   * @implement
   * @final
   */
  get isEmpty() {
    while (!this.eof && this.bufferLength === 0) {
      this.readBlock();
    }
    return this.bufferLength === 0;
  }

  minBufferLength = 512;

  str?: BaseStream;

  constructor(maybeMinBufferLength?: number) {
    super();

    this._rawMinBufferLength = maybeMinBufferLength || 0;

    if (maybeMinBufferLength) {
      // Compute the first power of two that is as big as maybeMinBufferLength.
      while (this.minBufferLength < maybeMinBufferLength) {
        this.minBufferLength *= 2;
      }
    }
  }

  protected abstract readBlock(): void;

  ensureBuffer(requested: number) {
    const buffer = this.buffer;
    if (requested <= buffer.byteLength) {
      return buffer;
    }
    let size = this.minBufferLength;
    while (size < requested) {
      size *= 2;
    }
    const buffer2 = new Uint8Array(size);
    buffer2.set(buffer);
    return (this.buffer = buffer2);
  }

  /**
   * @implement
   * @final
   */
  getByte() {
    const pos = this.pos;
    while (this.bufferLength <= pos) {
      if (this.eof) {
        return -1;
      }
      this.readBlock();
    }
    return this.buffer[this.pos++];
  }

  /**
   * @implement
   * @final
   */
  getBytes(length?: number) {
    const pos = this.pos;
    let end;

    if (length) {
      this.ensureBuffer(pos + length);
      end = pos + length;

      while (!this.eof && this.bufferLength < end) {
        this.readBlock();
      }
      const bufEnd = this.bufferLength;
      if (end > bufEnd) {
        end = bufEnd;
      }
    } else {
      while (!this.eof) {
        this.readBlock();
      }
      end = this.bufferLength;
    }

    this.pos = end;
    return this.buffer.subarray(pos, end);
  }

  /** @implement */
  reset() {
    this.pos = 0;
  }

  /** @implement */
  getByteRange(begin: number, end: number) {
    return fail("Abstract method `getByteRange` called");
  }

  /** @implement */
  moveStart() {
    fail("Abstract method `moveStart` called");
  }

  /**
   * @implement
   * @final
   */
  makeSubStream(start: number, length: number, dict?: Dict) {
    if (length === undefined) {
      while (!this.eof) {
        this.readBlock();
      }
    } else {
      const end = start + length;
      while (this.bufferLength <= end && !this.eof) {
        this.readBlock();
      }
    }
    return new Stream(this.buffer, start, length, dict);
  }

  override getBaseStreams() {
    return this.str?.getBaseStreams();
  }
}

/** @final */
export class StreamsSequenceStream extends DecodeStream {
  streams;
  _onError;

  constructor(
    streams: BaseStream[],
    onError?: (reason: unknown, objId?: string) => void,
  ) {
    let maybeLength = 0;
    for (const stream of streams) {
      maybeLength += stream instanceof DecodeStream
        ? stream._rawMinBufferLength
        : stream.length;
    }
    super(maybeLength);

    this.streams = streams;
    this._onError = onError;
  }

  /** @implement */
  readBlock() {
    const streams = this.streams;
    if (streams.length === 0) {
      this.eof = true;
      return;
    }

    const stream = streams.shift()!;
    let chunk;
    try {
      chunk = stream.getBytes();
    } catch (reason) {
      if (this._onError) {
        this._onError(reason, stream.dict?.objId);
        return;
      }
      throw reason;
    }
    const bufferLength = this.bufferLength;
    const newLength = bufferLength + chunk.length;
    const buffer = this.ensureBuffer(newLength);
    buffer.set(chunk, bufferLength);
    this.bufferLength = newLength;
  }

  override getBaseStreams() {
    const baseStreamsBuf = [];
    for (const stream of this.streams) {
      const baseStreams = stream.getBaseStreams();
      if (baseStreams) {
        baseStreamsBuf.push(...baseStreams);
      }
    }
    return baseStreamsBuf.length > 0 ? baseStreamsBuf : undefined;
  }
}
/*80--------------------------------------------------------------------------*/

export abstract class ImageStream extends DecodeStream {
  stream;
  maybeLength;
  params;

  width?: number | undefined;
  height?: number | undefined;
  bitsPerComponent?: number | undefined;
  numComps?: number | undefined;

  drawWidth?: number;
  drawHeight?: number;
  forceRGBA?: boolean;
  forceRGB?: boolean;

  constructor(stream: BaseStream, maybeLength?: number, params?: Dict) {
    super(maybeLength);

    this.stream = stream;
    this.dict = stream.dict;
    this.maybeLength = maybeLength;
    this.params = params;
  }
}
/*80--------------------------------------------------------------------------*/
