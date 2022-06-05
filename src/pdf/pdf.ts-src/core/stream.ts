/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
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

import { stringToBytes } from "../shared/util.js";
import { BaseStream } from "./base_stream.js";
import { Dict } from "./primitives.js";
/*81---------------------------------------------------------------------------*/

export class Stream extends BaseStream
{
  readonly bytes:Uint8Array;

  override start:number;
  override end:number;
  /** @implements */
  get length() { return this.end - this.start; }
  /** @implements */
  get isEmpty() { return this.length === 0; }

  constructor( arrayBuffer:Uint8Array | ArrayLike<number> | ArrayBufferLike, 
    start?:number, length?:number, dict?:Dict
  ) {
    super();

    this.bytes =
      arrayBuffer instanceof Uint8Array
        ? arrayBuffer
        : new Uint8Array(arrayBuffer);
    
    this.start = start || 0;
    this.pos = this.start;
    this.end = (start! + length!) || this.bytes.length;
    
    this.dict = dict;
  }

  /** @implements */
  getByte()
  {
    if( this.pos >= this.end )
    {
      return -1;
    }
    return this.bytes[this.pos++];
  }

  /** @implements */
  getBytes( length?:number ) 
  {
    const bytes = this.bytes;
    const pos = this.pos;
    const strEnd = this.end;

    if( !length )
    {
      return bytes.subarray( pos, strEnd );
    }
    let end = pos + length;
    if( end > strEnd )
    {
      end = strEnd;
    }
    this.pos = end;
    return bytes.subarray( pos, end );
  }

  /** @implements */
  getByteRange( begin:number, end:number ) 
  {
    if( begin < 0 )
    {
      begin = 0;
    }
    if( end > this.end )
    {
      end = this.end;
    }
    return this.bytes.subarray(begin, end);
  }

  /** @implements */
  reset() 
  {
    this.pos = this.start;
  }

  /**
   * @implements
   * @final
   */
  moveStart() 
  {
    this.start = this.pos;
  }

  /** @implements */
  makeSubStream( start:number, length?:number, dict?:Dict ):Stream
  {
    return new Stream( this.bytes.buffer, start, length, dict );
  }
}

export class StringStream extends Stream
{
  constructor( str:string ) 
  {
    super( stringToBytes(str) );
  }
}

export class NullStream extends Stream
{
  constructor() 
  {
    super( new Uint8Array(0) );
  }
};
/*81---------------------------------------------------------------------------*/
