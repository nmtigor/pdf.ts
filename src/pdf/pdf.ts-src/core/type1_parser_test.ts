/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

/* Copyright 2017 Mozilla Foundation
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

import { assertEquals } from "https://deno.land/std@0.190.0/testing/asserts.ts";
import { describe, it } from "https://deno.land/std@0.190.0/testing/bdd.ts";
import { FontProps } from "./evaluator.ts";
import { SEAC_ANALYSIS_ENABLED } from "./fonts_utils.ts";
import { StringStream } from "./stream.ts";
import { Type1Parser } from "./type1_parser.ts";
/*80--------------------------------------------------------------------------*/

describe("Type1Parser", () => {
  it("splits tokens", () => {
    const stream = new StringStream("/BlueValues[-17 0]noaccess def");
    const parser = new Type1Parser(stream, false, SEAC_ANALYSIS_ENABLED);
    assertEquals(parser.getToken(), "/");
    assertEquals(parser.getToken(), "BlueValues");
    assertEquals(parser.getToken(), "[");
    assertEquals(parser.getToken(), "-17");
    assertEquals(parser.getToken(), "0");
    assertEquals(parser.getToken(), "]");
    assertEquals(parser.getToken(), "noaccess");
    assertEquals(parser.getToken(), "def");
    assertEquals(parser.getToken(), null);
  });

  it("handles glued tokens", () => {
    const stream = new StringStream("dup/CharStrings");
    const parser = new Type1Parser(stream, false, SEAC_ANALYSIS_ENABLED);
    assertEquals(parser.getToken(), "dup");
    assertEquals(parser.getToken(), "/");
    assertEquals(parser.getToken(), "CharStrings");
  });

  it("ignores whitespace", () => {
    const stream = new StringStream("\nab   c\t");
    const parser = new Type1Parser(stream, false, SEAC_ANALYSIS_ENABLED);
    assertEquals(parser.getToken(), "ab");
    assertEquals(parser.getToken(), "c");
  });

  it("parses numbers", () => {
    const stream = new StringStream("123");
    const parser = new Type1Parser(stream, false, SEAC_ANALYSIS_ENABLED);
    assertEquals(parser.readNumber(), 123);
  });

  it("parses booleans", () => {
    const stream = new StringStream("true false");
    const parser = new Type1Parser(stream, false, SEAC_ANALYSIS_ENABLED);
    assertEquals(parser.readBoolean(), 1);
    assertEquals(parser.readBoolean(), 0);
  });

  it("parses number arrays", () => {
    let stream = new StringStream("[1 2]");
    let parser = new Type1Parser(stream, false, SEAC_ANALYSIS_ENABLED);
    assertEquals(parser.readNumberArray(), [1, 2]);
    // Variation on spacing.
    stream = new StringStream("[ 1 2 ]");
    parser = new Type1Parser(stream, false, SEAC_ANALYSIS_ENABLED);
    assertEquals(parser.readNumberArray(), [1, 2]);
  });

  it("skips comments", () => {
    const stream = new StringStream(
      "%!PS-AdobeFont-1.0: CMSY10 003.002\n" +
        "%%Title: CMSY10\n" +
        "%Version: 003.002\n" +
        "FontDirectory",
    );
    const parser = new Type1Parser(stream, false, SEAC_ANALYSIS_ENABLED);
    assertEquals(parser.getToken(), "FontDirectory");
  });

  it("parses font program", () => {
    const stream = new StringStream(
      "/ExpansionFactor  99\n" +
        "/Subrs 1 array\n" +
        "dup 0 1 RD x noaccess put\n" +
        "end\n" +
        "/CharStrings 46 dict dup begin\n" +
        "/.notdef 1 RD x ND\n" +
        "end",
    );
    const parser = new Type1Parser(stream, false, SEAC_ANALYSIS_ENABLED);
    const program = parser.extractFontProgram({} as FontProps);
    assertEquals(program.charstrings.length, 1);
    assertEquals(program.properties.privateData.ExpansionFactor, 99);
  });

  it("parses font header font matrix", () => {
    const stream = new StringStream(
      "/FontMatrix [0.001 0 0 0.001 0 0 ]readonly def\n",
    );
    const parser = new Type1Parser(stream, false, SEAC_ANALYSIS_ENABLED);
    const props = {} as FontProps;
    parser.extractFontHeader(props);
    assertEquals(props.fontMatrix, [0.001, 0, 0, 0.001, 0, 0]);
  });

  it("parses font header encoding", () => {
    const stream = new StringStream(
      "/Encoding 256 array\n" +
        "0 1 255 {1 index exch /.notdef put} for\n" +
        "dup 33 /arrowright put\n" +
        "readonly def\n",
    );
    const parser = new Type1Parser(stream, false, SEAC_ANALYSIS_ENABLED);
    const props: any = { overridableEncoding: true };
    parser.extractFontHeader(props);
    assertEquals(props.builtInEncoding[33], "arrowright");
  });
});
/*80--------------------------------------------------------------------------*/
