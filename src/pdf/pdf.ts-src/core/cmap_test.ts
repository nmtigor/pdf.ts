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
  assertNotEquals,
  assertThrows,
} from "https://deno.land/std@0.155.0/testing/asserts.ts";
import {
  afterAll,
  beforeAll,
  describe,
  it,
} from "https://deno.land/std@0.155.0/testing/bdd.ts";
import { DefaultCMapReaderFactory } from "../display/api.ts";
import { CMapData } from "../display/base_factory.ts";
import { CMAP_PARAMS } from "../shared/test_utils.ts";
import { type CharCodeOut, CMap, CMapFactory, IdentityCMap } from "./cmap.ts";
import { Name } from "./primitives.ts";
import { StringStream } from "./stream.ts";
/*80--------------------------------------------------------------------------*/

describe("cmap", () => {
  let fetchBuiltInCMap: (name: string) => Promise<CMapData>;

  beforeAll(() => {
    // Allow CMap testing in Node.js, e.g. for Travis.
    const CMapReaderFactory = new DefaultCMapReaderFactory({
      baseUrl: CMAP_PARAMS.cMapUrl,
      isCompressed: CMAP_PARAMS.cMapPacked,
    });

    fetchBuiltInCMap = (name: string) => CMapReaderFactory.fetch({ name });
  });

  afterAll(() => {
    fetchBuiltInCMap = undefined as any;
  });

  it("parses beginbfchar", async () => {
    const str = "2 beginbfchar\n" +
      "<03> <00>\n" +
      "<04> <01>\n" +
      "endbfchar\n";
    const stream = new StringStream(str);
    const cmap = await CMapFactory.create({ encoding: stream } as any);
    assertEquals(cmap.lookup(0x03), String.fromCharCode(0x00));
    assertEquals(cmap.lookup(0x04), String.fromCharCode(0x01));
    assertEquals(cmap.lookup(0x05), undefined);
  });

  it("parses beginbfrange with range", async () => {
    const str = "1 beginbfrange\n" +
      "<06> <0B> 0\n" +
      "endbfrange\n";
    const stream = new StringStream(str);
    const cmap = await CMapFactory.create({ encoding: stream } as any);
    assertEquals(cmap.lookup(0x05), undefined);
    assertEquals(cmap.lookup(0x06), String.fromCharCode(0x00));
    assertEquals(cmap.lookup(0x0b), String.fromCharCode(0x05));
    assertEquals(cmap.lookup(0x0c), undefined);
  });

  it("parses beginbfrange with array", async () => {
    const str = "1 beginbfrange\n" +
      "<0D> <12> [ 0 1 2 3 4 5 ]\n" +
      "endbfrange\n";
    const stream = new StringStream(str);
    const cmap = await CMapFactory.create({ encoding: stream } as any);
    assertEquals(cmap.lookup(0x0c), undefined);
    assertEquals(cmap.lookup(0x0d), 0x00);
    assertEquals(cmap.lookup(0x12), 0x05);
    assertEquals(cmap.lookup(0x13), undefined);
  });

  it("parses begincidchar", async () => {
    const str = "1 begincidchar\n" +
      "<14> 0\n" +
      "endcidchar\n";
    const stream = new StringStream(str);
    const cmap = await CMapFactory.create({ encoding: stream } as any);
    assertEquals(cmap.lookup(0x14), 0x00);
    assertEquals(cmap.lookup(0x15), undefined);
  });

  it("parses begincidrange", async () => {
    const str = "1 begincidrange\n" +
      "<0016> <001B>   0\n" +
      "endcidrange\n";
    const stream = new StringStream(str);
    const cmap = await CMapFactory.create({ encoding: stream } as any);
    assertEquals(cmap.lookup(0x15), undefined);
    assertEquals(cmap.lookup(0x16), 0x00);
    assertEquals(cmap.lookup(0x1b), 0x05);
    assertEquals(cmap.lookup(0x1c), undefined);
  });

  it("decodes codespace ranges", async () => {
    const str = "1 begincodespacerange\n" +
      "<01> <02>\n" +
      "<00000003> <00000004>\n" +
      "endcodespacerange\n";
    const stream = new StringStream(str);
    const cmap = await CMapFactory.create({ encoding: stream } as any);
    const c = {} as CharCodeOut;
    cmap.readCharCode(String.fromCharCode(1), 0, c);
    assertEquals(c.charcode, 1);
    assertEquals(c.length, 1);
    cmap.readCharCode(String.fromCharCode(0, 0, 0, 3), 0, c);
    assertEquals(c.charcode, 3);
    assertEquals(c.length, 4);
  });

  it("decodes 4 byte codespace ranges", async () => {
    const str = "1 begincodespacerange\n" +
      "<8EA1A1A1> <8EA1FEFE>\n" +
      "endcodespacerange\n";
    const stream = new StringStream(str);
    const cmap = await CMapFactory.create({ encoding: stream } as any);
    const c = {} as CharCodeOut;
    cmap.readCharCode(String.fromCharCode(0x8e, 0xa1, 0xa1, 0xa1), 0, c);
    assertEquals(c.charcode, 0x8ea1a1a1);
    assertEquals(c.length, 4);
  });

  it("read usecmap", async () => {
    const str = "/Adobe-Japan1-1 usecmap\n";
    const stream = new StringStream(str);
    const cmap = await CMapFactory.create({
      encoding: stream,
      fetchBuiltInCMap,
    });
    assert(cmap instanceof CMap);
    assertNotEquals(cmap.useCMap, undefined);
    assertEquals(cmap.builtInCMap, false);
    assertEquals(cmap.length, 0x20a7);
    assertEquals(cmap.isIdentityCMap, false);
  });

  it("parses cmapname", async () => {
    const str = "/CMapName /Identity-H def\n";
    const stream = new StringStream(str);
    const cmap = await CMapFactory.create({ encoding: stream } as any);
    assertEquals(cmap.name, "Identity-H");
  });

  it("parses wmode", async () => {
    const str = "/WMode 1 def\n";
    const stream = new StringStream(str);
    const cmap = await CMapFactory.create({ encoding: stream } as any);
    assertEquals(cmap.vertical, true);
  });

  it("loads built in cmap", async () => {
    const cmap = await CMapFactory.create({
      encoding: Name.get("Adobe-Japan1-1"),
      fetchBuiltInCMap,
    });
    assert(cmap instanceof CMap);
    assertEquals(cmap.useCMap, undefined);
    assertEquals(cmap.builtInCMap, true);
    assertEquals(cmap.length, 0x20a7);
    assertEquals(cmap.isIdentityCMap, false);
  });

  it("loads built in identity cmap", async () => {
    const cmap = await CMapFactory.create({
      encoding: Name.get("Identity-H"),
      fetchBuiltInCMap,
    });
    assert(cmap instanceof IdentityCMap);
    assertEquals(cmap.vertical, false);
    assertEquals(cmap.length, 0x10000);
    assertThrows(
      () => cmap.isIdentityCMap,
      Error,
      "should not access .isIdentityCMap",
    );
  });

  it("attempts to load a non-existent built-in CMap", async () => {
    try {
      await CMapFactory.create({
        encoding: Name.get("null"),
        fetchBuiltInCMap,
      });

      assert(0, "Shouldn't get here.");
    } catch (reason) {
      assert(reason instanceof Error);
      assertEquals(reason.message, "Unknown CMap name: null");
    }
  });

  it("attempts to load a built-in CMap without the necessary API parameters", async () => {
    function tmpFetchBuiltInCMap(name: string) {
      const CMapReaderFactory = new DefaultCMapReaderFactory(<any> {});
      return CMapReaderFactory.fetch({ name });
    }

    try {
      await CMapFactory.create({
        encoding: Name.get("Adobe-Japan1-1"),
        fetchBuiltInCMap: tmpFetchBuiltInCMap,
      });

      assert(0, "Shouldn't get here.");
    } catch (reason) {
      assert(reason instanceof Error);
      assertEquals(
        reason.message,
        'The CMap "baseUrl" parameter must be specified, ensure that ' +
          'the "cMapUrl" and "cMapPacked" API parameters are provided.',
      );
    }
  });

  it("attempts to load a built-in CMap with inconsistent API parameters", async () => {
    function tmpFetchBuiltInCMap(name: string) {
      const CMapReaderFactory = new DefaultCMapReaderFactory({
        baseUrl: CMAP_PARAMS.cMapUrl,
        isCompressed: false,
      });
      return CMapReaderFactory.fetch({ name });
    }

    try {
      await CMapFactory.create({
        encoding: Name.get("Adobe-Japan1-1"),
        fetchBuiltInCMap: tmpFetchBuiltInCMap,
      });

      assert(0, "Shouldn't get here.");
    } catch (reason) {
      assert(reason instanceof Error);
      const message = reason.message;
      assert(message.startsWith("Unable to load CMap at: "));
      assert(
        message.endsWith("/res/pdf/pdf.ts-external/bcmaps/Adobe-Japan1-1"),
      );
    }
  });
});
/*80--------------------------------------------------------------------------*/
