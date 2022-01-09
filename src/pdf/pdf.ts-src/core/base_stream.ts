/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

/* Copyright 2021 Mozilla Foundation
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

import { bytesToString, shadow } from "../shared/util.js";
import { Dict } from "./primitives.js";
/*81---------------------------------------------------------------------------*/

export abstract class BaseStream
{
  pos = 0;
  
  start?:number;
  end?:number;
  abstract get length():number;
  abstract get isEmpty():boolean;

  get isDataLoaded() { return shadow(this, "isDataLoaded", true); }

  dict:Dict | undefined;

  cacheKey?:string;

  abstract getByte():number;
  abstract getBytes( length?:number, forceClamped?:boolean ):Uint8Array | Uint8ClampedArray;

  /** @final */
  peekByte()
  {
    const peekedByte = this.getByte();
    if( peekedByte !== -1 )
    {
      this.pos--;
    }
    return peekedByte;
  }

  /** @final */
  peekBytes( length?:number, forceClamped=false )
  {
    const bytes = this.getBytes(length, forceClamped);
    this.pos -= bytes.length;
    return bytes;
  }

  /** @final */
  getUint16()
  {
    const b0 = this.getByte();
    const b1 = this.getByte();
    if( b0 === -1 || b1 === -1 )
    {
      return -1;
    }
    return (b0 << 8) + b1;
  }

  /** @final */
  getInt32()
  {
    const b0 = this.getByte();
    const b1 = this.getByte();
    const b2 = this.getByte();
    const b3 = this.getByte();
    return (b0 << 24) + (b1 << 16) + (b2 << 8) + b3;
  }

  abstract getByteRange( begin:number, end:number ):Uint8Array

  /** @final */
  getString( length?:number )
  {
    return bytesToString( this.getBytes(length,false) );
  }

  /** @final */
  skip( n?:number ) { this.pos += n || 1; }

  abstract reset():void;
  abstract moveStart():void;

  abstract makeSubStream( start:number, length?:number, dict?:Dict ):BaseStream;

  getBaseStreams():BaseStream[] | undefined
  {
    return undefined;
  }
}
/*81---------------------------------------------------------------------------*/
