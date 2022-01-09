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

import {
  CFF,
  CFFCharset,
  CFFCompiler,
  CFFHeader,
  CFFIndex,
  CFFPrivateDict,
  CFFStandardStrings,
  CFFStrings,
  CFFTopDict,
  NUM_STANDARD_CFF_STRINGS,
} from "./cff_parser.js";
import { SEAC_ANALYSIS_ENABLED, type1FontGlyphMapping } from "./fonts_utils.js";
import { isWhiteSpace } from "./core_utils.js";
import { Stream } from "./stream.js";
import { type CharStringObject, type FontProgram, type PrivateData, Type1Parser } from "./type1_parser.js";
import { warn } from "../shared/util.js";
import { BaseStream } from "./base_stream.js";
import { type FontProps } from "./evaluator.js";
/*81---------------------------------------------------------------------------*/

function findBlock( streamBytes:Uint8Array | Uint8ClampedArray, signature:number[], startIndex:number )
{
  const streamBytesLength = streamBytes.length;
  const signatureLength = signature.length;
  const scanLength = streamBytesLength - signatureLength;

  let i = startIndex,
    found = false;
  while (i < scanLength) {
    let j = 0;
    while (j < signatureLength && streamBytes[i + j] === signature[j]) {
      j++;
    }
    if (j >= signatureLength) {
      // `signature` found, skip over whitespace.
      i += j;
      while (i < streamBytesLength && isWhiteSpace(streamBytes[i])) {
        i++;
      }
      found = true;
      break;
    }
    i++;
  }
  return {
    found,
    length: i,
  };
}

function getHeaderBlock( stream:BaseStream, suggestedLength?:number )
{
  const EEXEC_SIGNATURE = [0x65, 0x65, 0x78, 0x65, 0x63];

  const streamStartPos = stream.pos; // Save the initial stream position.
  let headerBytes:Uint8Array | Uint8ClampedArray | undefined;
  let headerBytesLength;
  let block:{ found:boolean; length:number } | undefined;
try {
    headerBytes = stream.getBytes(suggestedLength);
    headerBytesLength = headerBytes.length;
  } catch (ex) {
    // Ignore errors if the `suggestedLength` is huge enough that a Uint8Array
    // cannot hold the result of `getBytes`, and fallback to simply checking
    // the entire stream (fixes issue3928.pdf).
  }

  if (headerBytesLength === suggestedLength) {
    // Most of the time `suggestedLength` is correct, so to speed things up we
    // initially only check the last few bytes to see if the header was found.
    // Otherwise we (potentially) check the entire stream to prevent errors in
    // `Type1Parser` (fixes issue5686.pdf).
    block = findBlock(
      headerBytes!,
      EEXEC_SIGNATURE,
      suggestedLength! - 2 * EEXEC_SIGNATURE.length
    );

    if (block.found && block.length === suggestedLength) {
      return {
        stream: new Stream( headerBytes! ),
        length: suggestedLength,
      };
    }
  }
  warn('Invalid "Length1" property in Type1 font -- trying to recover.');
  stream.pos = streamStartPos; // Reset the stream position.

  const SCAN_BLOCK_LENGTH = 2048;
  let actualLength;
  while (true) {
    const scanBytes = stream.peekBytes(SCAN_BLOCK_LENGTH);
    block = findBlock(scanBytes, EEXEC_SIGNATURE, 0);

    if (block.length === 0) {
      break;
    }
    stream.pos += block.length; // Update the stream position.

    if (block.found) {
      actualLength = stream.pos - streamStartPos;
      break;
    }
  }
  stream.pos = streamStartPos; // Reset the stream position.

  if (actualLength) {
    return {
      stream: new Stream(stream.getBytes(actualLength)),
      length: actualLength,
    };
  }
  warn('Unable to recover "Length1" property in Type1 font -- using as is.');
  return {
    stream: new Stream(stream.getBytes(suggestedLength)),
    length: suggestedLength,
  };
}

function getEexecBlock( stream:BaseStream, suggestedLength?:number )
{
  // We should ideally parse the eexec block to ensure that `suggestedLength`
  // is correct, so we don't truncate the block data if it's too small.
  // However, this would also require checking if the fixed-content portion
  // exists (using the 'Length3' property), and ensuring that it's valid.
  //
  // Given that `suggestedLength` almost always is correct, all the validation
  // would require a great deal of unnecessary parsing for most fonts.
  // To save time, we always fetch the entire stream instead, which also avoid
  // issues if `suggestedLength` is huge (see comment in `getHeaderBlock`).
  //
  // NOTE: This means that the function can include the fixed-content portion
  // in the returned eexec block. In practice this does *not* seem to matter,
  // since `Type1Parser_extractFontProgram` will skip over any non-commands.
  const eexecBytes = stream.getBytes();
  return {
    stream: new Stream(eexecBytes),
    length: eexecBytes.length,
  };
}

/**
 * Type1Font is also a CIDFontType0.
 */
export class Type1Font
{
  charstrings:CharStringObject[];
  get numGlyphs() { return this.charstrings.length + 1; }

  data:number[];
  seacs:number[][];

  constructor( name:string, file:BaseStream, properties:FontProps )
  {
    // Some bad generators embed pfb file as is, we have to strip 6-byte header.
    // Also, length1 and length2 might be off by 6 bytes as well.
    // http://www.math.ubc.ca/~cass/piscript/type1.pdf
    const PFB_HEADER_SIZE = 6;
    let headerBlockLength = properties.length1;
    let eexecBlockLength = properties.length2;
    let pfbHeader = file.peekBytes(PFB_HEADER_SIZE);
    const pfbHeaderPresent = pfbHeader[0] === 0x80 && pfbHeader[1] === 0x01;
    if (pfbHeaderPresent) {
      file.skip(PFB_HEADER_SIZE);
      headerBlockLength =
        (pfbHeader[5] << 24) |
        (pfbHeader[4] << 16) |
        (pfbHeader[3] << 8) |
        pfbHeader[2];
    }

    // Get the data block containing glyphs and subrs information
    const headerBlock = getHeaderBlock(file, headerBlockLength);
    const headerBlockParser = new Type1Parser(
      headerBlock.stream,
      false,
      SEAC_ANALYSIS_ENABLED
    );
    headerBlockParser.extractFontHeader(properties);

    if (pfbHeaderPresent) {
      pfbHeader = file.getBytes(PFB_HEADER_SIZE);
      eexecBlockLength =
        (pfbHeader[5] << 24) |
        (pfbHeader[4] << 16) |
        (pfbHeader[3] << 8) |
        pfbHeader[2];
    }

    // Decrypt the data blocks and retrieve it's content
    const eexecBlock = getEexecBlock(file, eexecBlockLength);
    const eexecBlockParser = new Type1Parser(
      eexecBlock.stream,
      true,
      SEAC_ANALYSIS_ENABLED
    );
    const data:FontProgram = eexecBlockParser.extractFontProgram(properties);
    for( const key in data.properties )
    {
      (<any>properties)[key] = (<any>data.properties)[key];
    }

    const charstrings = data.charstrings;
    const type2Charstrings = this.getType2Charstrings(charstrings);
    const subrs = this.getType2Subrs(data.subrs);

    this.charstrings = charstrings;
    this.data = this.wrap(
      name,
      type2Charstrings,
      this.charstrings,
      subrs,
      properties
    );
    this.seacs = this.getSeacs(data.charstrings);
  }

  getCharset() {
    const charset = [".notdef"];
    const charstrings = this.charstrings;
    for (let glyphId = 0; glyphId < charstrings.length; glyphId++) {
      charset.push(charstrings[glyphId].glyphName);
    }
    return charset;
  }

  getGlyphMapping( properties:FontProps )
  {
    const charstrings = this.charstrings;

    if (properties.composite) {
      const charCodeToGlyphId = Object.create(null);
      // Map CIDs directly to GIDs.
      for (
        let glyphId = 0, charstringsLen = charstrings.length;
        glyphId < charstringsLen;
        glyphId++
      ) {
        const charCode = properties.cMap!.charCodeOf(glyphId);
        // Add 1 because glyph 0 is duplicated.
        charCodeToGlyphId[charCode] = glyphId + 1;
      }
      return charCodeToGlyphId;
    }

    const glyphNames = [".notdef"];
    let builtInEncoding, glyphId;
    for (glyphId = 0; glyphId < charstrings.length; glyphId++) {
      glyphNames.push(charstrings[glyphId].glyphName);
    }
    const encoding = properties.builtInEncoding;
    if (encoding) {
      builtInEncoding = Object.create(null);
      for (const charCode in encoding) {
        glyphId = glyphNames.indexOf(encoding[charCode]);
        if (glyphId >= 0) {
          builtInEncoding[charCode] = glyphId;
        }
      }
    }

    return type1FontGlyphMapping(properties, builtInEncoding, glyphNames);
  }

  hasGlyphId( id:number )
  {
    if (id < 0 || id >= this.numGlyphs) {
      return false;
    }
    if (id === 0) {
      // notdef is always defined.
      return true;
    }
    const glyph = this.charstrings[id - 1];
    return glyph.charstring.length > 0;
  }

  getSeacs( charstrings:CharStringObject[] )
  {
    const seacMap:number[][] = [];
    for (let i = 0, ii = charstrings.length; i < ii; i++) {
      const charstring = charstrings[i];
      if (charstring.seac) {
        // Offset by 1 for .notdef
        seacMap[i + 1] = charstring.seac;
      }
    }
    return seacMap;
  }

  getType2Charstrings( type1Charstrings:CharStringObject[] )
  {
    const type2Charstrings = [];
    for (let i = 0, ii = type1Charstrings.length; i < ii; i++) {
      type2Charstrings.push(type1Charstrings[i].charstring);
    }
    return type2Charstrings;
  }

  getType2Subrs( type1Subrs:number[][] )
  {
    let bias = 0;
    const count = type1Subrs.length;
    if (count < 1133) {
      bias = 107;
    } else if (count < 33769) {
      bias = 1131;
    } else {
      bias = 32768;
    }

    // Add a bunch of empty subrs to deal with the Type2 bias
    const type2Subrs = [];
    let i;
    for (i = 0; i < bias; i++) {
      type2Subrs.push([0x0b]);
    }

    for (i = 0; i < count; i++) {
      type2Subrs.push(type1Subrs[i]);
    }

    return type2Subrs;
  }

  wrap(
    name:string,
    glyphs:number[][],
    charstrings:CharStringObject[],
    subrs:number[][],
    properties:FontProps
  ) {
  const cff = new CFF();
    cff.header = new CFFHeader(1, 0, 4, 4);

    cff.names = [name];

    const topDict = new CFFTopDict();
    // CFF strings IDs 0...390 are predefined names, so refering
    // to entries in our own String INDEX starts at SID 391.
    topDict.setByName("version", NUM_STANDARD_CFF_STRINGS);
    topDict.setByName("Notice", NUM_STANDARD_CFF_STRINGS+1);
    topDict.setByName("FullName", NUM_STANDARD_CFF_STRINGS+2);
    topDict.setByName("FamilyName", NUM_STANDARD_CFF_STRINGS+3);
    topDict.setByName("Weight", NUM_STANDARD_CFF_STRINGS+4);
    topDict.setByName("Encoding"); // placeholder
    topDict.setByName("FontMatrix", properties.fontMatrix);
    topDict.setByName("FontBBox", properties.bbox);
    topDict.setByName("charset"); // placeholder
    topDict.setByName("CharStrings"); // placeholder
    topDict.setByName("Private"); // placeholder
    cff.topDict = topDict;

    const strings = new CFFStrings();
    strings.add("Version 0.11"); // Version
    strings.add("See original notice"); // Notice
    strings.add(name); // FullName
    strings.add(name); // FamilyName
    strings.add("Medium"); // Weight
    cff.strings = strings;

    cff.globalSubrIndex = new CFFIndex<Uint8Array | Uint8ClampedArray>();

    const count = glyphs.length;
    const charsetArray = [".notdef"];
    let i, ii;
    for (i = 0; i < count; i++) {
      const glyphName = charstrings[i].glyphName;
      const index = CFFStandardStrings.indexOf(glyphName);
      if (index === -1) {
        strings.add(glyphName);
      }
      charsetArray.push(glyphName);
    }
    cff.charset = new CFFCharset(false, 0, charsetArray);

    const charStringsIndex = new CFFIndex();
    charStringsIndex.add([0x8b, 0x0e]); // .notdef
    for (i = 0; i < count; i++) {
      charStringsIndex.add(glyphs[i]);
    }
    cff.charStrings = charStringsIndex;

    const privateDict = new CFFPrivateDict();
    privateDict.setByName("Subrs"); // placeholder
    const fields = [
      "BlueValues",
      "OtherBlues",
      "FamilyBlues",
      "FamilyOtherBlues",
      "StemSnapH",
      "StemSnapV",
      "BlueShift",
      "BlueFuzz",
      "BlueScale",
      "LanguageGroup",
      "ExpansionFactor",
      "ForceBold",
      "StdHW",
      "StdVW",
    ];
    for (i = 0, ii = fields.length; i < ii; i++) 
    {
      const field:string = fields[i];
      if( !(field in properties.privateData!) )
      {
        continue;
      }
      const value = properties.privateData![<keyof PrivateData>field];
      if (Array.isArray(value))
      {
        // All of the private dictionary array data in CFF must be stored as
        // "delta-encoded" numbers.
        for (let j = value.length - 1; j > 0; j--) {
          value[j] -= value[j - 1]; // ... difference from previous value
        }
      }
      privateDict.setByName(field, value);
    }
    cff.topDict.privateDict = privateDict;

    const subrIndex = new CFFIndex();
    for (i = 0, ii = subrs.length; i < ii; i++) {
      subrIndex.add(subrs[i]);
    }
    privateDict.subrsIndex = subrIndex;

    const compiler = new CFFCompiler(cff);
    return compiler.compile();
  }
}
/*81---------------------------------------------------------------------------*/
