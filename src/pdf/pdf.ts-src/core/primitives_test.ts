/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/primitives_test.ts
 * @license Apache-2.0
 ******************************************************************************/

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

import { XRefMock } from "@fe-pdf.ts-test/unittest_utils.ts";
import {
  assert,
  assertEquals,
  assertNotStrictEquals,
  assertStrictEquals,
  assertThrows,
} from "@std/assert";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  it,
} from "@std/testing/bdd.ts";
import { assertSpyCall, assertSpyCalls, spy } from "@std/testing/mock.ts";
import {
  Cmd,
  Dict,
  isCmd,
  isDict,
  isName,
  isRefsEqual,
  Name,
  Ref,
  RefSet,
  RefSetCache,
} from "./primitives.ts";
import { StringStream } from "./stream.ts";
/*80--------------------------------------------------------------------------*/

describe("primitives", () => {
  describe("Name", () => {
    it("should retain the given name", () => {
      const givenName = "Font";
      const name = Name.get(givenName);
      assertEquals(name.name, givenName);
    });

    it("should create only one object for a name and cache it", () => {
      const firstFont = Name.get("Font");
      const secondFont = Name.get("Font");
      const firstSubtype = Name.get("Subtype");
      const secondSubtype = Name.get("Subtype");

      assertStrictEquals(firstFont, secondFont);
      assertStrictEquals(firstSubtype, secondSubtype);
      assertNotStrictEquals(firstFont, firstSubtype);
    });

    it("should create only one object for *empty* names and cache it", () => {
      const firstEmpty = Name.get("");
      const secondEmpty = Name.get("");
      const normalName = Name.get("string");

      assertStrictEquals(firstEmpty, secondEmpty);
      assertNotStrictEquals(firstEmpty, normalName);
    });

    it("should not accept to create a non-string name", () => {
      assertThrows(
        () => {
          Name.get(123 as any);
        },
        Error,
        'Name: The "name" must be a string.',
      );
    });
  });

  describe("Cmd", () => {
    it("should retain the given cmd name", () => {
      const givenCmd = "BT";
      const cmd = Cmd.get(givenCmd);
      assertEquals(cmd.cmd, givenCmd);
    });

    it("should create only one object for a command and cache it", () => {
      const firstBT = Cmd.get("BT");
      const secondBT = Cmd.get("BT");
      const firstET = Cmd.get("ET");
      const secondET = Cmd.get("ET");

      assertStrictEquals(firstBT, secondBT);
      assertStrictEquals(firstET, secondET);
      assertNotStrictEquals(firstBT, firstET);
    });

    it("should not accept to create a non-string cmd", () => {
      assertThrows(
        () => {
          Cmd.get(123 as any);
        },
        Error,
        'Cmd: The "cmd" must be a string.',
      );
    });
  });

  describe("Dict", () => {
    const checkInvalidHasValues = (dict: Dict) => {
      assertEquals((dict as any).has(), false);
      assertEquals(dict.has("Prev"), false);
    };

    const checkInvalidKeyValues = (dict: Dict) => {
      assertEquals((dict as any).get(), undefined);
      assertEquals(dict.get("Prev"), undefined);
      assertEquals(dict.get("D", "Decode"), undefined);
      assertEquals(dict.get("FontFile", "FontFile2", "FontFile3"), undefined);
    };

    let emptyDict: Dict,
      dictWithSizeKey: Dict,
      dictWithManyKeys: Dict;
    const storedSize = 42;
    const testFontFile = "file1";
    const testFontFile2 = "file2";
    const testFontFile3 = "file3";

    beforeAll(() => {
      emptyDict = new Dict();

      dictWithSizeKey = new Dict();
      dictWithSizeKey.set("Size", storedSize);

      dictWithManyKeys = new Dict();
      dictWithManyKeys.set("FontFile", testFontFile);
      dictWithManyKeys.set("FontFile2", testFontFile2);
      dictWithManyKeys.set("FontFile3", testFontFile3);
    });

    afterAll(() => {
      emptyDict = dictWithSizeKey = dictWithManyKeys = undefined as any;
    });

    it("should allow assigning an XRef table after creation", () => {
      const dict = new Dict(undefined);
      assertEquals(dict.xref, undefined);

      const xref: any = new XRefMock([]);
      dict.assignXref(xref);
      assertEquals(dict.xref, xref);
    });

    it("should return correct size", () => {
      const dict = new Dict(undefined);
      assertEquals(dict.size, 0);

      dict.set("Type", Name.get("Page"));
      assertEquals(dict.size, 1);

      dict.set("Contents", Ref.get(10, 0));
      assertEquals(dict.size, 2);
    });

    it("should return invalid values for unknown keys", () => {
      checkInvalidHasValues(emptyDict);
      checkInvalidKeyValues(emptyDict);
    });

    it("should return correct value for stored Size key", () => {
      assertEquals(dictWithSizeKey.has("Size"), true);

      assertEquals(dictWithSizeKey.get("Size"), storedSize);
      assertEquals(dictWithSizeKey.get("Prev", "Size"), storedSize);
      assertEquals(dictWithSizeKey.get("Prev", "Root", "Size"), storedSize);
    });

    it("should return invalid values for unknown keys when Size key is stored", () => {
      checkInvalidHasValues(dictWithSizeKey);
      checkInvalidKeyValues(dictWithSizeKey);
    });

    it("should not accept to set a non-string key", () => {
      const dict = new Dict();
      assertThrows(
        () => {
          dict.set(123 as any, "val");
        },
        Error,
        'Dict.set: The "key" must be a string.',
      );

      assertEquals(dict.has(123 as any), false);

      checkInvalidKeyValues(dict);
    });

    it("should not accept to set a key with an undefined value", () => {
      const dict = new Dict();
      assertThrows(
        () => {
          (dict as any).set("Size");
        },
        Error,
        'Dict.set: The "value" cannot be undefined.',
      );

      assertEquals(dict.has("Size"), false);

      checkInvalidKeyValues(dict);
    });

    it("should return correct values for multiple stored keys", () => {
      assertEquals(dictWithManyKeys.has("FontFile"), true);
      assertEquals(dictWithManyKeys.has("FontFile2"), true);
      assertEquals(dictWithManyKeys.has("FontFile3"), true);

      assertEquals(dictWithManyKeys.get("FontFile3"), testFontFile3);
      assertEquals(
        dictWithManyKeys.get("FontFile2", "FontFile3"),
        testFontFile2,
      );
      assertEquals(
        dictWithManyKeys.get("FontFile", "FontFile2", "FontFile3"),
        testFontFile,
      );
    });

    it("should asynchronously fetch unknown keys", async () => {
      const keyPromises = [
        dictWithManyKeys.getAsync("Size"),
        dictWithSizeKey.getAsync("FontFile", "FontFile2", "FontFile3"),
      ];

      const values = await Promise.all(keyPromises);
      assertEquals(values[0], undefined);
      assertEquals(values[1], undefined);
    });

    it("should asynchronously fetch correct values for multiple stored keys", async () => {
      const keyPromises = [
        dictWithManyKeys.getAsync("FontFile3"),
        dictWithManyKeys.getAsync("FontFile2", "FontFile3"),
        dictWithManyKeys.getAsync("FontFile", "FontFile2", "FontFile3"),
      ];

      const values = await Promise.all(keyPromises);
      assertEquals(values[0], testFontFile3);
      assertEquals(values[1], testFontFile2);
      assertEquals(values[2], testFontFile);
    });

    it("should callback for each stored key", () => {
      const callbackSpy = spy();

      dictWithManyKeys.forEach(callbackSpy);

      assertSpyCall(callbackSpy, 0, {
        args: [
          "FontFile",
          testFontFile,
        ],
      });
      assertSpyCall(callbackSpy, 1, {
        args: [
          "FontFile2",
          testFontFile2,
        ],
      });
      assertSpyCall(callbackSpy, 2, {
        args: [
          "FontFile3",
          testFontFile3,
        ],
      });
      assertSpyCalls(callbackSpy, 3);
    });

    it("should handle keys pointing to indirect objects, both sync and async", async () => {
      const fontRef = Ref.get(1, 0);
      const xref: any = new XRefMock([{ ref: fontRef, data: testFontFile }]);
      const fontDict = new Dict(xref);
      fontDict.set("FontFile", fontRef);

      assertEquals(fontDict.getRaw("FontFile"), fontRef);
      assertEquals(
        fontDict.get("FontFile", "FontFile2", "FontFile3"),
        testFontFile,
      );

      const value = await fontDict.getAsync(
        "FontFile",
        "FontFile2",
        "FontFile3",
      );
      assertEquals(value, testFontFile);
    });

    it("should handle arrays containing indirect objects", () => {
      const minCoordRef = Ref.get(1, 0);
      const maxCoordRef = Ref.get(2, 0);
      const minCoord = 0;
      const maxCoord = 1;
      const xref: any = new XRefMock([
        { ref: minCoordRef, data: minCoord },
        { ref: maxCoordRef, data: maxCoord },
      ]);
      const xObjectDict = new Dict(xref);
      xObjectDict.set("BBox", [minCoord, maxCoord, minCoordRef, maxCoordRef]);

      assertEquals(xObjectDict.get("BBox"), [
        minCoord,
        maxCoord,
        minCoordRef,
        maxCoordRef,
      ]);
      assertEquals(xObjectDict.getArray("BBox"), [
        minCoord,
        maxCoord,
        minCoord,
        maxCoord,
      ]);
    });

    it("should get all key names", () => {
      const expectedKeys = ["FontFile", "FontFile2", "FontFile3"];
      const keys = dictWithManyKeys.getKeys();

      assertEquals(keys.sort(), expectedKeys);
    });

    it("should get all raw values", () => {
      // Test direct objects:
      const expectedRawValues1 = [testFontFile, testFontFile2, testFontFile3];
      const rawValues1 = dictWithManyKeys.getRawValues();

      assertEquals(rawValues1.sort(), expectedRawValues1);

      // Test indirect objects:
      const typeName = Name.get("Page");
      const resources = new Dict(undefined),
        resourcesRef = Ref.get(5, 0);
      const contents = new StringStream("data"),
        contentsRef = Ref.get(10, 0);
      const xref: any = new XRefMock([
        { ref: resourcesRef, data: resources },
        { ref: contentsRef, data: contents },
      ]);

      const dict = new Dict(xref);
      dict.set("Type", typeName);
      dict.set("Resources", resourcesRef);
      dict.set("Contents", contentsRef);

      const expectedRawValues2 = [contentsRef, resourcesRef, typeName];
      const rawValues2 = dict.getRawValues();

      assertEquals(rawValues2.sort(), expectedRawValues2);
    });

    it("should create only one object for Dict.empty", () => {
      const firstDictEmpty = Dict.empty;
      const secondDictEmpty = Dict.empty;

      assertStrictEquals(firstDictEmpty, secondDictEmpty);
      assertNotStrictEquals(firstDictEmpty, emptyDict);
    });

    it("should correctly merge dictionaries", () => {
      const expectedKeys = ["FontFile", "FontFile2", "FontFile3", "Size"];

      const fontFileDict = new Dict();
      fontFileDict.set("FontFile", "Type1 font file");
      const mergedDict = Dict.merge({
        xref: undefined as any,
        dictArray: [dictWithManyKeys, dictWithSizeKey, fontFileDict],
      });
      const mergedKeys = mergedDict.getKeys();

      assertEquals(mergedKeys.sort(), expectedKeys);
      assertEquals(mergedDict.get("FontFile"), testFontFile);
    });

    it("should correctly merge sub-dictionaries", () => {
      const localFontDict = new Dict();
      localFontDict.set("F1", "Local font one");

      const globalFontDict = new Dict();
      globalFontDict.set("F1", "Global font one");
      globalFontDict.set("F2", "Global font two");
      globalFontDict.set("F3", "Global font three");

      const localDict = new Dict();
      localDict.set("Font", localFontDict);

      const globalDict = new Dict();
      globalDict.set("Font", globalFontDict);

      const mergedDict = Dict.merge({
        xref: undefined as any,
        dictArray: [localDict, globalDict],
      });
      const mergedSubDict = Dict.merge({
        xref: undefined as any,
        dictArray: [localDict, globalDict],
        mergeSubDicts: true,
      });

      const mergedFontDict = mergedDict.get("Font");
      const mergedSubFontDict = mergedSubDict.get("Font");

      assert(mergedFontDict instanceof Dict);
      assert(mergedSubFontDict instanceof Dict);

      const mergedFontDictKeys = mergedFontDict.getKeys();
      const mergedSubFontDictKeys = mergedSubFontDict.getKeys();

      assertEquals(mergedFontDictKeys, ["F1"]);
      assertEquals(mergedSubFontDictKeys, ["F1", "F2", "F3"]);

      const mergedFontDictValues = mergedFontDict.getRawValues();
      const mergedSubFontDictValues = mergedSubFontDict.getRawValues();

      assertEquals(mergedFontDictValues, ["Local font one"]);
      assertEquals(mergedSubFontDictValues, [
        "Local font one",
        "Global font two",
        "Global font three",
      ]);
    });
  });

  describe("Ref", () => {
    it("should get a string representation", () => {
      const nonZeroRef = Ref.get(4, 2);
      assertEquals(nonZeroRef.toString(), "4R2");

      // If the generation number is 0, a shorter representation is used.
      const zeroRef = Ref.get(4, 0);
      assertEquals(zeroRef.toString(), "4R");
    });

    it("should retain the stored values", () => {
      const storedNum = 4;
      const storedGen = 2;
      const ref = Ref.get(storedNum, storedGen);
      assertEquals(ref.num, storedNum);
      assertEquals(ref.gen, storedGen);
    });

    it("should create only one object for a reference and cache it", () => {
      const firstRef = Ref.get(4, 2);
      const secondRef = Ref.get(4, 2);
      const firstOtherRef = Ref.get(5, 2);
      const secondOtherRef = Ref.get(5, 2);

      assertStrictEquals(firstRef, secondRef);
      assertStrictEquals(firstOtherRef, secondOtherRef);
      assertNotStrictEquals(firstRef, firstOtherRef);
    });
  });

  describe("RefSet", () => {
    const ref1 = Ref.get(4, 2),
      ref2 = Ref.get(5, 2);
    let refSet: RefSet;

    beforeEach(() => {
      refSet = new RefSet();
    });

    afterEach(() => {
      refSet = undefined as any;
    });

    it("should have a stored value", () => {
      refSet.put(ref1);
      assertEquals(refSet.has(ref1), true);
    });

    it("should not have an unknown value", () => {
      assertEquals(refSet.has(ref1), false);
      refSet.put(ref1);
      assertEquals(refSet.has(ref2), false);
    });

    it("should support iteration", () => {
      refSet.put(ref1);
      refSet.put(ref2);
      assertEquals([...refSet], [ref1.toString(), ref2.toString()]);
    });
  });

  describe("RefSetCache", () => {
    const ref1 = Ref.get(4, 2),
      ref2 = Ref.get(5, 2),
      obj1 = Name.get("foo"),
      obj2 = Name.get("bar");
    let cache: RefSetCache;

    beforeEach(() => {
      cache = new RefSetCache();
    });

    afterEach(() => {
      cache = undefined as any;
    });

    it("should put, have and get a value", () => {
      cache.put(ref1, obj1);
      assertEquals(cache.has(ref1), true);
      assertEquals(cache.has(ref2), false);
      assertStrictEquals(cache.get(ref1), obj1);
    });

    it("should put, have and get a value by alias", () => {
      cache.put(ref1, obj1);
      cache.putAlias(ref2, ref1);
      assertEquals(cache.has(ref1), true);
      assertEquals(cache.has(ref2), true);
      assertStrictEquals(cache.get(ref1), obj1);
      assertStrictEquals(cache.get(ref2), obj1);
    });

    it("should report the size of the cache", () => {
      cache.put(ref1, obj1);
      assertEquals(cache.size, 1);
      cache.put(ref2, obj2);
      assertEquals(cache.size, 2);
    });

    it("should clear the cache", () => {
      cache.put(ref1, obj1);
      assertEquals(cache.size, 1);
      cache.clear();
      assertEquals(cache.size, 0);
    });

    it("should support iteration", () => {
      cache.put(ref1, obj1);
      cache.put(ref2, obj2);
      assertEquals([...cache], [obj1, obj2]);
    });

    it("should support iteration over key-value pairs", () => {
      cache.put(ref1, obj1);
      cache.put(ref2, obj2);
      assertEquals([...cache.items()], [[ref1, obj1], [ref2, obj2]]);
    });
  });

  describe("isName", () => {
    /* eslint-disable no-restricted-syntax */

    it("handles non-names", () => {
      const nonName = {};
      assertEquals(isName(nonName), false);
    });

    it("handles names", () => {
      const name = Name.get("Font");
      assertEquals(isName(name), true);
    });

    it("handles names with name check", () => {
      const name = Name.get("Font");
      assertEquals(isName(name, "Font"), true);
      assertEquals(isName(name, "Subtype"), false);
    });

    it("handles *empty* names, with name check", () => {
      const emptyName = Name.get("");

      assertEquals(isName(emptyName), true);
      assertEquals(isName(emptyName, ""), true);
      assertEquals(isName(emptyName, "string"), false);
    });

    /* eslint-enable no-restricted-syntax */
  });

  describe("isCmd", () => {
    /* eslint-disable no-restricted-syntax */

    it("handles non-commands", () => {
      const nonCmd = {};
      assertEquals(isCmd(nonCmd), false);
    });

    it("handles commands", () => {
      const cmd = Cmd.get("BT");
      assertEquals(isCmd(cmd), true);
    });

    it("handles commands with cmd check", () => {
      const cmd = Cmd.get("BT");
      assertEquals(isCmd(cmd, "BT"), true);
      assertEquals(isCmd(cmd, "ET"), false);
    });

    /* eslint-enable no-restricted-syntax */
  });

  describe("isDict", () => {
    /* eslint-disable no-restricted-syntax */

    it("handles non-dictionaries", () => {
      const nonDict = {};
      assertEquals(isDict(nonDict), false);
    });

    it("handles empty dictionaries with type check", () => {
      const dict = Dict.empty;
      assertEquals(isDict(dict), true);
      assertEquals(isDict(dict, "Page"), false);
    });

    it("handles dictionaries with type check", () => {
      const dict = new Dict();
      dict.set("Type", Name.get("Page"));
      assertEquals(isDict(dict, "Page"), true);
      assertEquals(isDict(dict, "Contents"), false);
    });

    /* eslint-enable no-restricted-syntax */
  });

  describe("isRefsEqual", () => {
    it("should handle Refs pointing to the same object", () => {
      const ref1 = Ref.get(1, 0);
      const ref2 = Ref.get(1, 0);
      assertEquals(isRefsEqual(ref1, ref2), true);
    });

    it("should handle Refs pointing to different objects", () => {
      const ref1 = Ref.get(1, 0);
      const ref2 = Ref.get(2, 0);
      assertEquals(isRefsEqual(ref1, ref2), false);
    });
  });
});
/*80--------------------------------------------------------------------------*/
