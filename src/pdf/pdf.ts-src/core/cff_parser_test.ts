/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

/* Copyright 2020 Mozilla Foundation
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
  assert,
  assertEquals,
} from "https://deno.land/std@0.155.0/testing/asserts.ts";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  it,
} from "https://deno.land/std@0.155.0/testing/bdd.ts";
import {
  CFF,
  CFFCharset,
  CFFCompiler,
  CFFFDSelect,
  CFFParser,
  CFFPrivateDict,
  CFFStrings,
} from "./cff_parser.ts";
import { FontProps } from "./evaluator.ts";
import { SEAC_ANALYSIS_ENABLED } from "./fonts_utils.ts";
import { Stream } from "./stream.ts";
/*80--------------------------------------------------------------------------*/

describe("CFFParser", () => {
  function createWithNullProto(
    obj: Record<number, number>,
  ): Record<number, number> {
    const result = Object.create(null);
    for (const i in obj) {
      result[+i] = obj[i];
    }
    return result;
  }

  // Stub that returns `0` for any privateDict key.
  const privateDictStub = <CFFPrivateDict> {
    getByName(name: string) {
      return 0;
    },
  };

  let fontData!: Stream,
    parser!: CFFParser,
    cff!: CFF;

  beforeAll(() => {
    // deno-fmt-ignore
    // This example font comes from the CFF spec:
    // http://www.adobe.com/content/dam/Adobe/en/devnet/font/pdfs/5176.CFF.pdf
    const exampleFont =
      "0100040100010101134142434445462b" +
      "54696d65732d526f6d616e000101011f" +
      "f81b00f81c02f81d03f819041c6f000d" +
      "fb3cfb6efa7cfa1605e911b8f1120003" +
      "01010813183030312e30303754696d65" +
      "7320526f6d616e54696d657300000002" +
      "010102030e0e7d99f92a99fb7695f773" +
      "8b06f79a93fc7c8c077d99f85695f75e" +
      "9908fb6e8cf87393f7108b09a70adf0b" +
      "f78e14";
    const fontArr: number[] = [];
    for (let i = 0, ii = exampleFont.length; i < ii; i += 2) {
      const hex = exampleFont.substring(i, i + 2);
      fontArr.push(parseInt(hex, 16));
    }
    fontData = new Stream(fontArr);
  });

  afterAll(() => {
    fontData = undefined as any;
  });

  beforeEach(() => {
    parser = new CFFParser(fontData, {} as FontProps, SEAC_ANALYSIS_ENABLED);
    cff = parser.parse();
  });

  afterEach(() => {
    parser = cff = undefined as any;
  });

  it("parses header", () => {
    const header = cff.header!;
    assertEquals(header.major, 1);
    assertEquals(header.minor, 0);
    assertEquals(header.hdrSize, 4);
    assertEquals(header.offSize, 1);
  });

  it("parses name index", () => {
    const names = cff.names;
    assertEquals(names.length, 1);
    assertEquals(names[0], "ABCDEF+Times-Roman");
  });

  it("parses top dict", () => {
    const topDict = cff.topDict!;
    // 391 version 392 FullName 393 FamilyName 389 Weight 28416 UniqueID
    // -168 -218 1000 898 FontBBox 94 CharStrings 45 102 Private
    assertEquals(topDict.getByName("version"), 391);
    assertEquals(topDict.getByName("FullName"), 392);
    assertEquals(topDict.getByName("FamilyName"), 393);
    assertEquals(topDict.getByName("Weight"), 389);
    assertEquals(topDict.getByName("UniqueID"), 28416);
    assertEquals(topDict.getByName("FontBBox") as any, [-168, -218, 1000, 898]);
    assertEquals(topDict.getByName("CharStrings"), 94);
    assertEquals(topDict.getByName("Private") as any, [45, 102]);
  });

  it("refuses to add topDict key with invalid value (bug 1068432)", () => {
    const topDict = cff.topDict!;
    const defaultValue = topDict.getByName("UnderlinePosition");

    topDict.setByKey(/* [12, 3] = */ 3075, [NaN]);
    assertEquals(topDict.getByName("UnderlinePosition"), defaultValue);
  });

  it(
    "ignores reserved commands in parseDict, and refuses to add privateDict " +
      "keys with invalid values (bug 1308536)",
    () => {
      // deno-fmt-ignore
      const bytes = new Uint8Array([
        64, 39, 31, 30, 252, 114, 137, 115, 79, 30, 197, 119, 2, 99, 127, 6,
      ]);
      parser.bytes = bytes;
      const topDict = cff.topDict!;
      topDict.setByName("Private", [bytes.length, 0]);

      const parsePrivateDict = () => {
        parser.parsePrivateDict(topDict);
      };
      try {
        parsePrivateDict();
      } catch {
        assert(0, "Should not throw.");
      }

      const privateDict = topDict.privateDict!;
      assertEquals(privateDict.getByName("BlueValues"), null);
    },
  );

  it("parses a CharString having cntrmask", () => {
    // deno-fmt-ignore
    const bytes = new Uint8Array([
      0, 1, // count
      1,  // offsetSize
      0,  // offset[0]
      38, // end
      149, 149, 149, 149, 149, 149, 149, 149,
      149, 149, 149, 149, 149, 149, 149, 149,
      1,  // hstem
      149, 149, 149, 149, 149, 149, 149, 149,
      149, 149, 149, 149, 149, 149, 149, 149,
      3,  // vstem
      20, // cntrmask
      22, 22, // fail if misparsed as hmoveto
      14  // endchar
    ]);
    parser.bytes = bytes;
    const charStringsIndex = parser.parseIndex(0).obj;
    const charStrings = parser.parseCharStrings({
      charStrings: charStringsIndex,
      privateDict: privateDictStub,
    } as any).charStrings;
    assertEquals(charStrings.count, 1);
    // shouldn't be sanitized
    assertEquals(charStrings.get(0).length, 38);
  });

  it("parses a CharString endchar with 4 args w/seac enabled", () => {
    const cffParser = new CFFParser(
      fontData,
      {} as FontProps,
      /* seacAnalysisEnabled = */ true,
    );
    cffParser.parse(); // cff

    // deno-fmt-ignore
    const bytes = new Uint8Array([
      0, 1, // count
      1,  // offsetSize
      0,  // offset[0]
      237, 247, 22, 247, 72, 204, 247, 86, 14
    ]);
    cffParser.bytes = bytes;
    const charStringsIndex = cffParser.parseIndex(0).obj;
    const result = cffParser.parseCharStrings({
      charStrings: charStringsIndex,
      privateDict: privateDictStub,
    } as any);
    assertEquals(result.charStrings.count, 1);
    assertEquals(result.charStrings.get(0).length, 1);
    assertEquals(result.seacs.length, 1);
    assertEquals(result.seacs[0].length, 4);
    assertEquals(result.seacs[0][0], 130);
    assertEquals(result.seacs[0][1], 180);
    assertEquals(result.seacs[0][2], 65);
    assertEquals(result.seacs[0][3], 194);
  });

  it("parses a CharString endchar with 4 args w/seac disabled", () => {
    const cffParser = new CFFParser(
      fontData,
      {} as FontProps,
      /* seacAnalysisEnabled = */ false,
    );
    cffParser.parse(); // cff

    // deno-fmt-ignore
    const bytes = new Uint8Array([
      0, 1, // count
      1,  // offsetSize
      0,  // offset[0]
      237, 247, 22, 247, 72, 204, 247, 86, 14
    ]);
    cffParser.bytes = bytes;
    const charStringsIndex = cffParser.parseIndex(0).obj;
    const result = cffParser.parseCharStrings({
      charStrings: charStringsIndex,
      privateDict: privateDictStub,
    } as any);
    assertEquals(result.charStrings.count, 1);
    assertEquals(result.charStrings.get(0).length, 9);
    assertEquals(result.seacs.length, 0);
  });

  it("parses a CharString endchar no args", () => {
    // deno-fmt-ignore
    const bytes = new Uint8Array([
      0, 1, // count
      1,  // offsetSize
      0,  // offset[0]
      14
    ]);
    parser.bytes = bytes;
    const charStringsIndex = parser.parseIndex(0).obj;
    const result = parser.parseCharStrings({
      charStrings: charStringsIndex,
      privateDict: privateDictStub,
    } as any);
    assertEquals(result.charStrings.count, 1);
    assertEquals(result.charStrings.get(0)[0], 14);
    assertEquals(result.seacs.length, 0);
  });

  it("parses predefined charsets", () => {
    const charset = parser.parseCharsets(0, 0, <any> null, true);
    assertEquals(charset.predefined, true);
  });

  it("parses charset format 0", () => {
    // The first three bytes make the offset large enough to skip predefined.
    // deno-fmt-ignore
    const bytes = new Uint8Array([
      0x00, 0x00, 0x00,
      0x00, // format
      0x00, 0x02 // sid/cid
    ]);
    parser.bytes = bytes;
    let charset = parser.parseCharsets(3, 2, new CFFStrings(), false);
    assertEquals(charset.charset[1], "exclam");

    // CID font
    charset = parser.parseCharsets(3, 2, new CFFStrings(), true);
    assertEquals(+charset.charset[1], 2);
  });

  it("parses charset format 1", () => {
    // The first three bytes make the offset large enough to skip predefined.
    // deno-fmt-ignore
    const bytes = new Uint8Array([
      0x00, 0x00, 0x00,
      0x01, // format
      0x00, 0x08, // sid/cid start
      0x01 // sid/cid left
    ]);
    parser.bytes = bytes;
    let charset = parser.parseCharsets(3, 2, new CFFStrings(), false);
    assertEquals(charset.charset, [".notdef", "quoteright", "parenleft"]);

    // CID font
    charset = parser.parseCharsets(3, 2, new CFFStrings(), true);
    assertEquals(charset.charset, [0, 8, 9] as any);
  });

  it("parses charset format 2", () => {
    // format 2 is the same as format 1 but the left is card16
    // The first three bytes make the offset large enough to skip predefined.
    // deno-fmt-ignore
    const bytes = new Uint8Array([
      0x00, 0x00, 0x00,
      0x02, // format
      0x00, 0x08, // sid/cid start
      0x00, 0x01 // sid/cid left
    ]);
    parser.bytes = bytes;
    let charset = parser.parseCharsets(3, 2, new CFFStrings(), false);
    assertEquals(charset.charset, [".notdef", "quoteright", "parenleft"]);

    // CID font
    charset = parser.parseCharsets(3, 2, new CFFStrings(), true);
    assertEquals(charset.charset, [0, 8, 9] as any);
  });

  it("parses encoding format 0", () => {
    // The first two bytes make the offset large enough to skip predefined.
    // deno-fmt-ignore
    const bytes = new Uint8Array([
      0x00, 0x00,
      0x00, // format
      0x01, // count
      0x08  // start
    ]);
    parser.bytes = bytes;
    const encoding = parser.parseEncoding(
      2,
      {} as FontProps,
      new CFFStrings(),
      null as any,
    );
    assertEquals(encoding.encoding, createWithNullProto({ 0x8: 1 }));
  });

  it("parses encoding format 1", () => {
    // The first two bytes make the offset large enough to skip predefined.
    // deno-fmt-ignore
    const bytes = new Uint8Array([
      0x00, 0x00,
      0x01, // format
      0x01, // num ranges
      0x07, // range1 start
      0x01 // range2 left
    ]);
    parser.bytes = bytes;
    const encoding = parser.parseEncoding(
      2,
      {} as FontProps,
      new CFFStrings(),
      null as any,
    );
    assertEquals(
      encoding.encoding,
      createWithNullProto({ 0x7: 0x01, 0x08: 0x02 }),
    );
  });

  it("parses fdselect format 0", () => {
    // deno-fmt-ignore
    const bytes = new Uint8Array([
      0x00, // format
      0x00, // gid: 0 fd: 0
      0x01 // gid: 1 fd: 1
    ]);
    parser.bytes = bytes.slice();
    const fdSelect = parser.parseFDSelect(0, 2);

    assertEquals(fdSelect.fdSelect, [0, 1]);
    assertEquals(fdSelect.format, 0);
  });

  it("parses fdselect format 3", () => {
    // deno-fmt-ignore
    const bytes = new Uint8Array([
      0x03, // format
      0x00, 0x02, // range count
      0x00, 0x00, // first gid
      0x09, // font dict 1 id
      0x00, 0x02, // next gid
      0x0a, // font dict 2 id
      0x00, 0x04 // sentinel (last gid)
    ]);
    parser.bytes = bytes.slice();
    const fdSelect = parser.parseFDSelect(0, 4);

    assertEquals(fdSelect.fdSelect, [9, 9, 0xa, 0xa]);
    assertEquals(fdSelect.format, 3);
  });

  it("parses invalid fdselect format 3 (bug 1146106)", () => {
    // deno-fmt-ignore
    const bytes = new Uint8Array([
      0x03, // format
      0x00, 0x02, // range count
      0x00, 0x01, // first gid (invalid)
      0x09, // font dict 1 id
      0x00, 0x02, // next gid
      0x0a, // font dict 2 id
      0x00, 0x04 // sentinel (last gid)
    ]);
    parser.bytes = bytes.slice();
    const fdSelect = parser.parseFDSelect(0, 4);

    assertEquals(fdSelect.fdSelect, [9, 9, 0xa, 0xa]);
    assertEquals(fdSelect.format, 3);
  });

  // TODO fdArray
});

describe("CFFCompiler", () => {
  function testParser(bytes: number[]) {
    const bytes_1 = new Uint8Array(bytes);
    return new CFFParser(
      {
        getBytes: () => {
          return bytes_1;
        },
      } as any,
      {} as FontProps,
      SEAC_ANALYSIS_ENABLED,
    );
  }

  it("encodes integers", () => {
    const c = new CFFCompiler(0 as any);
    // all the examples from the spec
    assertEquals(c.encodeInteger(0), [0x8b]);
    assertEquals(c.encodeInteger(100), [0xef]);
    assertEquals(c.encodeInteger(-100), [0x27]);
    assertEquals(c.encodeInteger(1000), [0xfa, 0x7c]);
    assertEquals(c.encodeInteger(-1000), [0xfe, 0x7c]);
    assertEquals(c.encodeInteger(10000), [0x1c, 0x27, 0x10]);
    assertEquals(c.encodeInteger(-10000), [0x1c, 0xd8, 0xf0]);
    assertEquals(c.encodeInteger(100000), [0x1d, 0x00, 0x01, 0x86, 0xa0]);
    assertEquals(c.encodeInteger(-100000), [0x1d, 0xff, 0xfe, 0x79, 0x60]);
  });

  it("encodes floats", () => {
    const c = new CFFCompiler(0 as any);
    assertEquals(c.encodeFloat(-2.25), [0x1e, 0xe2, 0xa2, 0x5f]);
    assertEquals(c.encodeFloat(5e-11), [0x1e, 0x5c, 0x11, 0xff]);
  });

  it("sanitizes name index", () => {
    const c = new CFFCompiler(0 as any);
    let nameIndexCompiled = c.compileNameIndex(["[a"]);
    let parser = testParser(nameIndexCompiled);
    let nameIndex = parser.parseIndex(0);
    let names = parser.parseNameIndex(nameIndex.obj);
    assertEquals(names, ["_a"]);

    let longName = "";
    for (let i = 0; i < 129; i++) {
      longName += "_";
    }
    nameIndexCompiled = c.compileNameIndex([longName]);
    parser = testParser(nameIndexCompiled);
    nameIndex = parser.parseIndex(0);
    names = parser.parseNameIndex(nameIndex.obj);
    assertEquals(names[0].length, 127);
  });

  it("compiles fdselect format 0", () => {
    const fdSelect = new CFFFDSelect(0, [3, 2, 1]);
    const c = new CFFCompiler(0 as any);
    const out = c.compileFDSelect(fdSelect);
    assertEquals(out, [
      0, // format
      3, // gid: 0 fd 3
      2, // gid: 1 fd 3
      1, // gid: 2 fd 3
    ]);
  });

  it("compiles fdselect format 3", () => {
    const fdSelect = new CFFFDSelect(3, [0, 0, 1, 1]);
    const c = new CFFCompiler(0 as any);
    const out = c.compileFDSelect(fdSelect);
    assertEquals(out, [
      3, // format
      0, // nRanges (high)
      2, // nRanges (low)
      0, // range struct 0 - first (high)
      0, // range struct 0 - first (low)
      0, // range struct 0 - fd
      0, // range struct 0 - first (high)
      2, // range struct 0 - first (low)
      1, // range struct 0 - fd
      0, // sentinel (high)
      4, // sentinel (low)
    ]);
  });

  it("compiles fdselect format 3, single range", () => {
    const fdSelect = new CFFFDSelect(3, [0, 0]);
    const c = new CFFCompiler(0 as any);
    const out = c.compileFDSelect(fdSelect);
    assertEquals(out, [
      3, // format
      0, // nRanges (high)
      1, // nRanges (low)
      0, // range struct 0 - first (high)
      0, // range struct 0 - first (low)
      0, // range struct 0 - fd
      0, // sentinel (high)
      2, // sentinel (low)
    ]);
  });

  it("compiles charset of CID font", () => {
    const charset = new CFFCharset(0 as any, 1 as any, 2 as any);
    const c = new CFFCompiler(0 as any);
    const numGlyphs = 7;
    const out = c.compileCharset(charset, numGlyphs, new CFFStrings(), true);
    // All CID charsets get turned into a simple format 2.
    assertEquals(out, [
      2, // format
      0, // cid (high)
      0, // cid (low)
      0, // nLeft (high)
      numGlyphs - 1, // nLeft (low)
    ]);
  });

  it("compiles charset of non CID font", () => {
    const charset = new CFFCharset(false, 0, ["space", "exclam"]);
    const c = new CFFCompiler(0 as any);
    const numGlyphs = 3;
    const out = c.compileCharset(charset, numGlyphs, new CFFStrings(), false);
    // All non-CID fonts use a format 0 charset.
    assertEquals(out, [
      0, // format
      0, // sid of 'space' (high)
      1, // sid of 'space' (low)
      0, // sid of 'exclam' (high)
      2, // sid of 'exclam' (low)
    ]);
  });

  // TODO a lot more compiler tests
});
/*80--------------------------------------------------------------------------*/
