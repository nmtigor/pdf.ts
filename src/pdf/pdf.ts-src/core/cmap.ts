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

import { assert } from "../../../lib/util/trace.js";
import {
  CMapCompressionType,
  FormatError,
  warn,
} from "../shared/util.js";
import { Cmd, EOF, isCmd, Name, type ObjNoCmd } from "./primitives.js";
import { Lexer } from "./parser.js";
import { MissingDataException } from "./core_utils.js";
import { Stream } from "./stream.js";
import { type TupleOf } from "../../../lib/alias.js";
import { BaseStream } from "./base_stream.js";
import { type FetchBuiltInCMap } from "../display/base_factory.js";
/*81---------------------------------------------------------------------------*/

const BUILT_IN_CMAPS = [
  // << Start unicode maps.
  "Adobe-GB1-UCS2",
  "Adobe-CNS1-UCS2",
  "Adobe-Japan1-UCS2",
  "Adobe-Korea1-UCS2",
  // >> End unicode maps.
  "78-EUC-H",
  "78-EUC-V",
  "78-H",
  "78-RKSJ-H",
  "78-RKSJ-V",
  "78-V",
  "78ms-RKSJ-H",
  "78ms-RKSJ-V",
  "83pv-RKSJ-H",
  "90ms-RKSJ-H",
  "90ms-RKSJ-V",
  "90msp-RKSJ-H",
  "90msp-RKSJ-V",
  "90pv-RKSJ-H",
  "90pv-RKSJ-V",
  "Add-H",
  "Add-RKSJ-H",
  "Add-RKSJ-V",
  "Add-V",
  "Adobe-CNS1-0",
  "Adobe-CNS1-1",
  "Adobe-CNS1-2",
  "Adobe-CNS1-3",
  "Adobe-CNS1-4",
  "Adobe-CNS1-5",
  "Adobe-CNS1-6",
  "Adobe-GB1-0",
  "Adobe-GB1-1",
  "Adobe-GB1-2",
  "Adobe-GB1-3",
  "Adobe-GB1-4",
  "Adobe-GB1-5",
  "Adobe-Japan1-0",
  "Adobe-Japan1-1",
  "Adobe-Japan1-2",
  "Adobe-Japan1-3",
  "Adobe-Japan1-4",
  "Adobe-Japan1-5",
  "Adobe-Japan1-6",
  "Adobe-Korea1-0",
  "Adobe-Korea1-1",
  "Adobe-Korea1-2",
  "B5-H",
  "B5-V",
  "B5pc-H",
  "B5pc-V",
  "CNS-EUC-H",
  "CNS-EUC-V",
  "CNS1-H",
  "CNS1-V",
  "CNS2-H",
  "CNS2-V",
  "ETHK-B5-H",
  "ETHK-B5-V",
  "ETen-B5-H",
  "ETen-B5-V",
  "ETenms-B5-H",
  "ETenms-B5-V",
  "EUC-H",
  "EUC-V",
  "Ext-H",
  "Ext-RKSJ-H",
  "Ext-RKSJ-V",
  "Ext-V",
  "GB-EUC-H",
  "GB-EUC-V",
  "GB-H",
  "GB-V",
  "GBK-EUC-H",
  "GBK-EUC-V",
  "GBK2K-H",
  "GBK2K-V",
  "GBKp-EUC-H",
  "GBKp-EUC-V",
  "GBT-EUC-H",
  "GBT-EUC-V",
  "GBT-H",
  "GBT-V",
  "GBTpc-EUC-H",
  "GBTpc-EUC-V",
  "GBpc-EUC-H",
  "GBpc-EUC-V",
  "H",
  "HKdla-B5-H",
  "HKdla-B5-V",
  "HKdlb-B5-H",
  "HKdlb-B5-V",
  "HKgccs-B5-H",
  "HKgccs-B5-V",
  "HKm314-B5-H",
  "HKm314-B5-V",
  "HKm471-B5-H",
  "HKm471-B5-V",
  "HKscs-B5-H",
  "HKscs-B5-V",
  "Hankaku",
  "Hiragana",
  "KSC-EUC-H",
  "KSC-EUC-V",
  "KSC-H",
  "KSC-Johab-H",
  "KSC-Johab-V",
  "KSC-V",
  "KSCms-UHC-H",
  "KSCms-UHC-HW-H",
  "KSCms-UHC-HW-V",
  "KSCms-UHC-V",
  "KSCpc-EUC-H",
  "KSCpc-EUC-V",
  "Katakana",
  "NWP-H",
  "NWP-V",
  "RKSJ-H",
  "RKSJ-V",
  "Roman",
  "UniCNS-UCS2-H",
  "UniCNS-UCS2-V",
  "UniCNS-UTF16-H",
  "UniCNS-UTF16-V",
  "UniCNS-UTF32-H",
  "UniCNS-UTF32-V",
  "UniCNS-UTF8-H",
  "UniCNS-UTF8-V",
  "UniGB-UCS2-H",
  "UniGB-UCS2-V",
  "UniGB-UTF16-H",
  "UniGB-UTF16-V",
  "UniGB-UTF32-H",
  "UniGB-UTF32-V",
  "UniGB-UTF8-H",
  "UniGB-UTF8-V",
  "UniJIS-UCS2-H",
  "UniJIS-UCS2-HW-H",
  "UniJIS-UCS2-HW-V",
  "UniJIS-UCS2-V",
  "UniJIS-UTF16-H",
  "UniJIS-UTF16-V",
  "UniJIS-UTF32-H",
  "UniJIS-UTF32-V",
  "UniJIS-UTF8-H",
  "UniJIS-UTF8-V",
  "UniJIS2004-UTF16-H",
  "UniJIS2004-UTF16-V",
  "UniJIS2004-UTF32-H",
  "UniJIS2004-UTF32-V",
  "UniJIS2004-UTF8-H",
  "UniJIS2004-UTF8-V",
  "UniJISPro-UCS2-HW-V",
  "UniJISPro-UCS2-V",
  "UniJISPro-UTF8-V",
  "UniJISX0213-UTF32-H",
  "UniJISX0213-UTF32-V",
  "UniJISX02132004-UTF32-H",
  "UniJISX02132004-UTF32-V",
  "UniKS-UCS2-H",
  "UniKS-UCS2-V",
  "UniKS-UTF16-H",
  "UniKS-UTF16-V",
  "UniKS-UTF32-H",
  "UniKS-UTF32-V",
  "UniKS-UTF8-H",
  "UniKS-UTF8-V",
  "V",
  "WP-Symbol",
];

// Heuristic to avoid hanging the worker-thread for CMap data with ridiculously
// large ranges, such as e.g. 0xFFFFFFFF (fixes issue11922_reduced.pdf).
const MAX_MAP_RANGE = 2 ** 24 - 1; // = 0xFFFFFF

export interface CharCodeOut
{
  charcode:number;
  length:number;
}

// CMap, not to be confused with TrueType's cmap.
export class CMap 
{
  /**
   * Codespace ranges are stored as follows:
   * [[1BytePairs], [2BytePairs], [3BytePairs], [4BytePairs]]
   * where nBytePairs are ranges e.g. [low1, high1, low2, high2, ...]
   */
  codespaceRanges:TupleOf< number[], 4 > = [ [], [], [], [] ];
  numCodespaceRanges = 0;

  /**
   * Map entries have one of two forms.
   * - cid chars are 16-bit unsigned integers, stored as integers.
   * - bf chars are variable-length byte sequences, stored as strings, with
   *   one byte per character.
   */
  _map:(number | string | undefined)[] = [];
  getMap() { return this._map; }
  /**
   * This is used for both bf and cid chars.
   */
  mapOne( src:number, dst:number | string ) { this._map[src] = dst; }
  lookup( code:number ) { return this._map[code]; }
  contains( code:number ) { return this._map[code] !== undefined; }

  name = "";
  vertical = false;
  useCMap?:CMap;
  builtInCMap:boolean;

  constructor( builtInCMap=false )
  {
    this.builtInCMap = builtInCMap;
  }

  addCodespaceRange( n:number, low:number, high:number ) 
  {
    this.codespaceRanges[n - 1].push(low, high);
    this.numCodespaceRanges++;
  }

  mapCidRange( low:number, high:number, dstLow:number )
  {
    if (high - low > MAX_MAP_RANGE) {
      throw new Error("mapCidRange - ignoring data above MAX_MAP_RANGE.");
    }
    while (low <= high) {
      this._map[low++] = dstLow++;
    }
  }

  mapBfRange( low:number, high:number, dstLow:string ) 
  {
    if (high - low > MAX_MAP_RANGE) 
    {
      throw new Error("mapBfRange - ignoring data above MAX_MAP_RANGE.");
    }
    const lastByte = dstLow.length - 1;
    while( low <= high )
    {
      this._map[low++] = dstLow;
      // Only the last byte has to be incremented (in the normal case).
      const nextCharCode = dstLow.charCodeAt(lastByte) + 1;
      if (nextCharCode > 0xff) 
      {
        dstLow =
          dstLow.substring(0, lastByte - 1) +
          String.fromCharCode(dstLow.charCodeAt(lastByte - 1) + 1) +
          "\x00";
        continue;
      }
      dstLow =
        dstLow.substring(0, lastByte) + String.fromCharCode(nextCharCode);
    }
  }

  mapBfRangeToArray( low:number, high:number, array:(number|string)[] ) 
  {
    if (high - low > MAX_MAP_RANGE) {
      throw new Error("mapBfRangeToArray - ignoring data above MAX_MAP_RANGE.");
    }
    const ii = array.length;
    let i = 0;
    while( low <= high && i < ii )
    {
      this._map[low] = array[i++];
      ++low;
    }
  }

  forEach( callback:(charcode:number,cid:number|string)=>void )
  {
    // Most maps have fewer than 65536 entries, and for those we use normal
    // array iteration. But really sparse tables are possible -- e.g. with
    // indices in the *billions*. For such tables we use for..in, which isn't
    // ideal because it stringifies the indices for all present elements, but
    // it does avoid iterating over every undefined entry.
    const map = this._map;
    const length = map.length;
    if( length <= 0x10000 )
    {
      for( let i = 0; i < length; i++ )
      {
        if (map[i] !== undefined) {
          callback( i, map[i]! );
        }
      }
    } 
    else {
      for (const i in map) {
        callback( +i, map[i]! );
      }
    }
  }

  charCodeOf( value:number | string )
  {
    // `Array.prototype.indexOf` is *extremely* inefficient for arrays which
    // are both very sparse and very large (see issue8372.pdf).
    const map = this._map;
    if (map.length <= 0x10000) 
    {
      return map.indexOf(value);
    }
    for (const charCode in map) 
    {
      if (map[charCode] === value) 
      {
        return +charCode | 0;
      }
    }
    return -1;
  }

  readCharCode( str:string, offset:number, out:CharCodeOut )
  {
    let c = 0;
    const codespaceRanges = this.codespaceRanges;
    // 9.7.6.2 CMap Mapping
    // The code length is at most 4.
    for (let n = 0, nn = codespaceRanges.length; n < nn; n++) 
    {
      c = ((c << 8) | str.charCodeAt(offset + n)) >>> 0;
      // Check each codespace range to see if it falls within.
      const codespaceRange = codespaceRanges[n];
      for (let k = 0, kk = codespaceRange.length; k < kk; ) 
      {
        const low = codespaceRange[k++];
        const high = codespaceRange[k++];
        if (c >= low && c <= high) 
        {
          out.charcode = c;
          out.length = n + 1;
          return;
        }
      }
    }
    out.charcode = 0;
    out.length = 1;
  }

  getCharCodeLength( charCode:number )
  {
    const codespaceRanges = this.codespaceRanges;
    for (let n = 0, nn = codespaceRanges.length; n < nn; n++) {
      // Check each codespace range to see if it falls within.
      const codespaceRange = codespaceRanges[n];
      for (let k = 0, kk = codespaceRange.length; k < kk; ) {
        const low = codespaceRange[k++];
        const high = codespaceRange[k++];
        if (charCode >= low && charCode <= high) {
          return n + 1;
        }
      }
    }
    return 1;
  }

  get length() { return this._map.length; }

  get isIdentityCMap()
  {
    if( !(this.name === "Identity-H" || this.name === "Identity-V") )
      return false;

    if (this._map.length !== 0x10000) return false;

    for (let i = 0; i < 0x10000; i++) 
    {
      if( this._map[i] !== i ) return false;
    }
    return true;
  }
}

/**
 * A special case of CMap, where the _map array implicitly has a length of
 * 65536 and each element is equal to its index.
 */
export class IdentityCMap extends CMap 
{
  constructor( vertical:boolean, n:number ) 
  {
    super();

    this.vertical = vertical;
    this.addCodespaceRange(n, 0, 0xffff);
  }

  override mapCidRange( low:number, high:number, dstLow:number )
  {
    assert( 0, "should not call mapCidRange" );
  }

  override mapBfRange( low:number, high:number, dstLow:string ) 
  {
    assert( 0, "should not call mapBfRange" );
  }

  override mapBfRangeToArray( low:number, high:number, array:ObjNoCmd[] ) 
  {
    assert( 0, "should not call mapBfRangeToArray" );
  }

  override mapOne( src:number, dst:number | string ) 
  { 
    assert( 0, "should not call mapCidOne" ); 
  }
  
  override lookup( code:number ) 
  {
    return Number.isInteger(code) && code <= 0xffff ? code : undefined;
  }

  override contains( code:number ) 
  {
    return Number.isInteger(code) && code <= 0xffff;
  }

  override forEach( callback:(charcode:number,cid:number|string)=>void )
  {
    for( let i = 0; i <= 0xffff; i++ )
    {
      callback(i, i);
    }
  }

  override charCodeOf( value:number ) 
  {
    return Number.isInteger(value) && <number>value <= 0xffff ? value : -1;
  }

  override getMap() {
    // Sometimes identity maps must be instantiated, but it's rare.
    const map = new Array(0x10000);
    for (let i = 0; i <= 0xffff; i++) {
      map[i] = i;
    }
    return map;
  }

  override get length() { return 0x10000; }

  // eslint-disable-next-line getter-return
  override get isIdentityCMap()
  {
    assert( 0, "should not access .isIdentityCMap" );
    return false;
  }
}

namespace NsBinaryCMapReader
{
  function hexToInt( a:Uint8Array, size:number )
  {
    let n = 0;
    for( let i = 0; i <= size; i++ )
    {
      n = (n << 8) | a[i];
    }
    return n >>> 0;
  }

  function hexToStr( a:Uint8Array, size:number ) 
  {
    // This code is hot. Special-case some common values to avoid creating an
    // object with subarray().
    if (size === 1) {
      return String.fromCharCode(a[0], a[1]);
    }
    if (size === 3) {
      return String.fromCharCode(a[0], a[1], a[2], a[3]);
    }
    return String.fromCharCode( ...a.subarray(0, size + 1) );
  }

  function addHex( a:Uint8Array, b:Uint8Array, size:number ) 
  {
    let c = 0;
    for( let i = size; i >= 0; i-- )
    {
      c += a[i] + b[i];
      a[i] = c & 255;
      c >>= 8;
    }
  }

  function incHex( a:Uint8Array, size:number ) 
  {
    let c = 1;
    for( let i = size; i >= 0 && c > 0; i-- )
    {
      c += a[i];
      a[i] = c & 255;
      c >>= 8;
    }
  }

  const MAX_NUM_SIZE = 16;
  const MAX_ENCODED_NUM_SIZE = 19; // ceil(MAX_NUM_SIZE * 7 / 8)

  class BinaryCMapStream
  {
    buffer;
    pos = 0;
    end:number;
    tmpBuf = new Uint8Array(MAX_ENCODED_NUM_SIZE);

    constructor( data:Uint8Array )
    {
      this.buffer = data;
      // this.pos = 0;
      this.end = data.length;
      // this.tmpBuf = new Uint8Array(MAX_ENCODED_NUM_SIZE);
    }

    readByte() {
      if (this.pos >= this.end) {
        return -1;
      }
      return this.buffer[this.pos++];
    }
    readNumber() {
      let n = 0;
      let last;
      do {
        const b = this.readByte();
        if (b < 0) {
          throw new FormatError("unexpected EOF in bcmap");
        }
        last = !(b & 0x80);
        n = (n << 7) | (b & 0x7f);
      } while (!last);
      return n;
    }
    readSigned() {
      const n = this.readNumber();
      return n & 1 ? ~(n >>> 1) : n >>> 1;
    }
    readHex( num:Uint8Array, size:number ) 
    {
      num.set(this.buffer.subarray(this.pos, this.pos + size + 1));
      this.pos += size + 1;
    }
    readHexNumber( num:Uint8Array, size:number ) 
    {
      let last;
      const stack = this.tmpBuf;
      let sp = 0;
      do {
        const b = this.readByte();
        if (b < 0) {
          throw new FormatError("unexpected EOF in bcmap");
        }
        last = !(b & 0x80);
        stack[sp++] = b & 0x7f;
      } while (!last);
      let i = size;
      let buffer = 0;
      let bufferSize = 0;
      while (i >= 0) {
        while (bufferSize < 8 && stack.length > 0) {
          buffer |= stack[--sp] << bufferSize;
          bufferSize += 7;
        }
        num[i] = buffer & 255;
        i--;
        buffer >>= 8;
        bufferSize -= 8;
      }
    }
    readHexSigned( num:Uint8Array, size:number ) 
    {
      this.readHexNumber(num, size);
      const sign = num[size] & 1 ? 255 : 0;
      let c = 0;
      for( let i = 0; i <= size; i++ )
      {
        c = ((c & 1) << 8) | num[i];
        num[i] = (c >> 1) ^ sign;
      }
    }
    readString() {
      const len = this.readNumber();
      let s = "";
      for( let i = 0; i < len; i++ )
      {
        s += String.fromCharCode(this.readNumber());
      }
      return s;
    }
  }

  // eslint-disable-next-line no-shadow
  export class BinaryCMapReader
  {
    async process( data:Uint8Array, cMap:CMap, extend:(useCMap:string)=>Promise<CMap> )
    {
      const stream = new BinaryCMapStream(data);
      const header = stream.readByte();
      cMap.vertical = !!(header & 1);

      let useCMap = null;
      const start = new Uint8Array(MAX_NUM_SIZE);
      const end = new Uint8Array(MAX_NUM_SIZE);
      const char = new Uint8Array(MAX_NUM_SIZE);
      const charCode = new Uint8Array(MAX_NUM_SIZE);
      const tmp = new Uint8Array(MAX_NUM_SIZE);
      let code;

      let b;
      while ((b = stream.readByte()) >= 0) {
        const type = b >> 5;
        if (type === 7) {
          // metadata, e.g. comment or usecmap
          switch (b & 0x1f) {
            case 0:
              stream.readString(); // skipping comment
              break;
            case 1:
              useCMap = stream.readString();
              break;
          }
          continue;
        }
        const sequence = !!(b & 0x10);
        const dataSize = b & 15;

        if (dataSize + 1 > MAX_NUM_SIZE) {
          throw new Error("BinaryCMapReader.process: Invalid dataSize.");
        }

        const ucs2DataSize = 1;
        const subitemsCount = stream.readNumber();
        switch( type )
        {
          case 0: // codespacerange
            stream.readHex(start, dataSize);
            stream.readHexNumber(end, dataSize);
            addHex(end, start, dataSize);
            cMap.addCodespaceRange(
              dataSize + 1,
              hexToInt(start, dataSize),
              hexToInt(end, dataSize)
            );
            for( let i = 1; i < subitemsCount; i++ )
            {
              incHex(end, dataSize);
              stream.readHexNumber(start, dataSize);
              addHex(start, end, dataSize);
              stream.readHexNumber(end, dataSize);
              addHex(end, start, dataSize);
              cMap.addCodespaceRange(
                dataSize + 1,
                hexToInt(start, dataSize),
                hexToInt(end, dataSize)
              );
            }
            break;
          case 1: // notdefrange
            stream.readHex(start, dataSize);
            stream.readHexNumber(end, dataSize);
            addHex(end, start, dataSize);
            stream.readNumber(); // code
            // undefined range, skipping
            for( let i = 1; i < subitemsCount; i++ )
            {
              incHex(end, dataSize);
              stream.readHexNumber(start, dataSize);
              addHex(start, end, dataSize);
              stream.readHexNumber(end, dataSize);
              addHex(end, start, dataSize);
              stream.readNumber(); // code
              // nop
            }
            break;
          case 2: // cidchar
            stream.readHex(char, dataSize);
            code = stream.readNumber();
            cMap.mapOne( hexToInt(char, dataSize), code );
            for( let i = 1; i < subitemsCount; i++ )
            {
              incHex(char, dataSize);
              if (!sequence) {
                stream.readHexNumber(tmp, dataSize);
                addHex(char, tmp, dataSize);
              }
              code = stream.readSigned() + (code + 1);
              cMap.mapOne( hexToInt(char, dataSize), code );
            }
            break;
          case 3: // cidrange
            stream.readHex(start, dataSize);
            stream.readHexNumber(end, dataSize);
            addHex(end, start, dataSize);
            code = stream.readNumber();
            cMap.mapCidRange(
              hexToInt(start, dataSize),
              hexToInt(end, dataSize),
              code
            );
            for( let i = 1; i < subitemsCount; i++ )
            {
              incHex(end, dataSize);
              if (!sequence) {
                stream.readHexNumber(start, dataSize);
                addHex(start, end, dataSize);
              } 
              else {
                start.set(end);
              }
              stream.readHexNumber(end, dataSize);
              addHex(end, start, dataSize);
              code = stream.readNumber();
              cMap.mapCidRange(
                hexToInt(start, dataSize),
                hexToInt(end, dataSize),
                code
              );
            }
            break;
          case 4: // bfchar
            stream.readHex(char, ucs2DataSize);
            stream.readHex(charCode, dataSize);
            cMap.mapOne(
              hexToInt(char, ucs2DataSize),
              hexToStr(charCode, dataSize)
            );
            for( let i = 1; i < subitemsCount; i++ )
            {
              incHex(char, ucs2DataSize);
              if (!sequence) {
                stream.readHexNumber(tmp, ucs2DataSize);
                addHex(char, tmp, ucs2DataSize);
              }
              incHex(charCode, dataSize);
              stream.readHexSigned(tmp, dataSize);
              addHex(charCode, tmp, dataSize);
              cMap.mapOne(
                hexToInt(char, ucs2DataSize),
                hexToStr(charCode, dataSize)
              );
            }
            break;
          case 5: // bfrange
            stream.readHex(start, ucs2DataSize);
            stream.readHexNumber(end, ucs2DataSize);
            addHex(end, start, ucs2DataSize);
            stream.readHex(charCode, dataSize);
            cMap.mapBfRange(
              hexToInt(start, ucs2DataSize),
              hexToInt(end, ucs2DataSize),
              hexToStr(charCode, dataSize)
            );
            for( let i = 1; i < subitemsCount; i++ )
            {
              incHex(end, ucs2DataSize);
              if (!sequence) {
                stream.readHexNumber(start, ucs2DataSize);
                addHex(start, end, ucs2DataSize);
              } 
              else {
                start.set(end);
              }
              stream.readHexNumber(end, ucs2DataSize);
              addHex(end, start, ucs2DataSize);
              stream.readHex(charCode, dataSize);
              cMap.mapBfRange(
                hexToInt(start, ucs2DataSize),
                hexToInt(end, ucs2DataSize),
                hexToStr(charCode, dataSize)
              );
            }
            break;
          default:
            throw new Error(`BinaryCMapReader.process - unknown type: ${type}`);
        }
      }

      if (useCMap) {
        return extend(useCMap);
      }
      return cMap;
    }
  }
}
import BinaryCMapReader = NsBinaryCMapReader.BinaryCMapReader;

namespace NsCMapFactory
{
  function strToInt( str:string ) 
  {
    let a = 0;
    for( let i = 0; i < str.length; i++ )
    {
      a = (a << 8) | str.charCodeAt(i);
    }
    return a >>> 0;
  }

  function expectString( obj:unknown ) 
  {
    if( typeof obj !== "string" )
    {
      throw new FormatError("Malformed CMap: expected string.");
    }
  }

  function expectInt( obj:unknown ) 
  {
    if (!Number.isInteger(obj)) {
      throw new FormatError("Malformed CMap: expected int.");
    }
  }

  function parseBfChar( cMap:CMap, lexer:Lexer )
  {
    while (true) 
    {
      let obj = lexer.getObj();
      if (obj === EOF) break;

      if (isCmd(obj, "endbfchar")) return;

      expectString(obj);
      const src = strToInt( <string>obj );
      obj = lexer.getObj();
      // TODO are /dstName used?
      expectString(obj);
      const dst = <string>obj;
      cMap.mapOne(src, dst);
    }
  }

  function parseBfRange( cMap:CMap, lexer:Lexer )
  {
    while (true) {
      let obj = lexer.getObj();
      if (obj === EOF) break;

      if (isCmd(obj, "endbfrange")) return;

      expectString(obj);
      const low = strToInt( <string>obj );
      obj = lexer.getObj();
      expectString(obj);
      const high = strToInt( <string>obj );
      obj = lexer.getObj();
      if( Number.isInteger(obj) || typeof obj === "string" )
      {
        const dstLow = Number.isInteger(obj) ? String.fromCharCode(<number>obj) : <string>obj;
        cMap.mapBfRange(low, high, dstLow);
      } 
      else if( isCmd(obj, "[") )
      {
        obj = lexer.getObj();
        const array = [];
        while( !isCmd(obj, "]") && obj !== EOF )
        {
          array.push( <number|string>obj);
          obj = lexer.getObj();
        }
        cMap.mapBfRangeToArray(low, high, array);
      } 
      else {
        break;
      }
    }
    throw new FormatError("Invalid bf range.");
  }

  function parseCidChar( cMap:CMap, lexer:Lexer )
  {
    while (true) 
    {
      let obj = lexer.getObj();
      if (obj === EOF) break;

      if (isCmd(obj, "endcidchar")) return;

      expectString(obj);
      const src = strToInt( <string>obj );
      obj = lexer.getObj();
      expectInt(obj);
      const dst = <number>obj;
      cMap.mapOne( src, dst );
    }
  }

  function parseCidRange( cMap:CMap, lexer:Lexer )
  {
    while (true) 
    {
      let obj = lexer.getObj();
      if (obj === EOF) break;

      if (isCmd(obj, "endcidrange")) return;

      expectString(obj);
      const low = strToInt( <string>obj );
      obj = lexer.getObj();
      expectString(obj);
      const high = strToInt( <string>obj );
      obj = lexer.getObj();
      expectInt(obj);
      const dstLow = <number>obj;
      cMap.mapCidRange(low, high, dstLow);
    }
  }

  function parseCodespaceRange( cMap:CMap, lexer:Lexer )
  {
    while( true )
    {
      let obj = lexer.getObj();
      if( obj === EOF ) break;

      if( isCmd(obj, "endcodespacerange") ) return;

      if( typeof obj !== "string" ) break;

      const low = strToInt( obj );
      obj = lexer.getObj();
      if( typeof obj !== "string" ) break;

      const high = strToInt( obj );
      cMap.addCodespaceRange( obj.length, low, high);
    }
    throw new FormatError("Invalid codespace range.");
  }

  function parseWMode( cMap:CMap, lexer:Lexer )
  {
    const obj = lexer.getObj();
    if( Number.isInteger(obj) )
    {
      cMap.vertical = !!obj;
    }
  }

  function parseCMapName( cMap:CMap, lexer:Lexer )
  {
    const obj = lexer.getObj();
    if( obj instanceof Name )
    {
      cMap.name = obj.name;
    }
  }

  async function parseCMap( cMap:CMap, lexer:Lexer, 
    fetchBuiltInCMap:FetchBuiltInCMap, useCMap?:string
  ) {
    let previous, embeddedUseCMap;
    objLoop: while (true) {
      try {
        const obj = lexer.getObj();
        if( obj === EOF )
        {
          break;
        } 
        else if( obj instanceof Name )
        {
         if( obj.name === "WMode" )
          {
            parseWMode(cMap, lexer);
          } 
          else if( obj.name === "CMapName" )
          {
            parseCMapName(cMap, lexer);
          }
          previous = obj;
        } 
        else if( obj instanceof Cmd )
        {
          switch( obj.cmd )
          {
            case "endcmap":
              break objLoop;
            case "usecmap":
              if( previous instanceof Name )
              {
                embeddedUseCMap = previous.name;
              }
              break;
            case "begincodespacerange":
              parseCodespaceRange(cMap, lexer);
              break;
            case "beginbfchar":
              parseBfChar(cMap, lexer);
              break;
            case "begincidchar":
              parseCidChar(cMap, lexer);
              break;
            case "beginbfrange":
              parseBfRange(cMap, lexer);
              break;
            case "begincidrange":
              parseCidRange(cMap, lexer);
              break;
          }
        }
      } catch (ex) {
        if (ex instanceof MissingDataException) {
          throw ex;
        }
        warn("Invalid cMap data: " + ex);
        continue;
      }
    }

    if (!useCMap && embeddedUseCMap) {
      // Load the useCMap definition from the file only if there wasn't one
      // specified.
      useCMap = embeddedUseCMap;
    }
    if (useCMap) {
      return extendCMap(cMap, fetchBuiltInCMap, useCMap);
    }
    return cMap;
  }

  async function extendCMap( cMap:CMap, fetchBuiltInCMap:FetchBuiltInCMap, useCMap:string )
  {
    cMap.useCMap = await createBuiltInCMap(useCMap, fetchBuiltInCMap);
    // If there aren't any code space ranges defined clone all the parent ones
    // into this cMap.
    if( cMap.numCodespaceRanges === 0 )
    {
      const useCodespaceRanges = cMap.useCMap.codespaceRanges;
      for( let i = 0; i < useCodespaceRanges.length; i++ )
      {
        cMap.codespaceRanges[i] = useCodespaceRanges[i].slice();
      }
      cMap.numCodespaceRanges = cMap.useCMap.numCodespaceRanges;
    }
    // Merge the map into the current one, making sure not to override
    // any previously defined entries.
    cMap.useCMap.forEach( (key, value) => {
      if( !cMap.contains(key) )
      {
        cMap.mapOne( key, cMap.useCMap!.lookup(key)! );
      }
    });

    return cMap;
  }

  async function createBuiltInCMap( name:string, fetchBuiltInCMap:FetchBuiltInCMap )
  {
    if (name === "Identity-H") {
      return new IdentityCMap(false, 2);
    } else if (name === "Identity-V") {
      return new IdentityCMap(true, 2);
    }
    if (!BUILT_IN_CMAPS.includes(name)) {
      throw new Error("Unknown CMap name: " + name);
    }
    if (!fetchBuiltInCMap) {
      throw new Error("Built-in CMap parameters are not provided.");
    }

    const { cMapData, compressionType } = await fetchBuiltInCMap(name);
    const cMap = new CMap(true);

    if (compressionType === CMapCompressionType.BINARY) {
      return new BinaryCMapReader().process(cMapData, cMap, useCMap => {
        return extendCMap(cMap, fetchBuiltInCMap, useCMap);
      });
    }
    if (compressionType === CMapCompressionType.NONE) {
      const lexer = new Lexer(new Stream(cMapData));
      return parseCMap( cMap, lexer, fetchBuiltInCMap );
    }
    throw new Error(
      "TODO: Only BINARY/NONE CMap compression is currently supported."
    );
  }

  export interface CMapFactoryCreateParms
  {
    encoding:Name | BaseStream;
    fetchBuiltInCMap:FetchBuiltInCMap;
    useCMap?:string;
  }

  export const CMapFactory = {
    async create( params:CMapFactoryCreateParms ) 
    {
      const encoding = params.encoding;
      const fetchBuiltInCMap = params.fetchBuiltInCMap;
      const useCMap = params.useCMap;

      if( encoding instanceof Name )
      {
        return createBuiltInCMap( encoding.name, fetchBuiltInCMap );
      } 
      else if( encoding instanceof BaseStream )
      {
        const parsedCMap = await parseCMap(
          /* cMap = */ new CMap(),
          /* lexer = */ new Lexer( encoding ),
          fetchBuiltInCMap,
          useCMap
        );

        if( parsedCMap.isIdentityCMap )
        {
          return createBuiltInCMap(parsedCMap.name, fetchBuiltInCMap);
        }
        return parsedCMap;
      }
      throw new Error("Encoding required.");
    },
  };
}
export import CMapFactory = NsCMapFactory.CMapFactory;
/*81---------------------------------------------------------------------------*/
