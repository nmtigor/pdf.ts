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
  assertEquals,
  assertNotStrictEquals,
  assertStrictEquals,
} from "https://deno.land/std@0.190.0/testing/asserts.ts";
import {
  afterAll,
  beforeAll,
  describe,
  it,
} from "https://deno.land/std@0.190.0/testing/bdd.ts";
import { XRefMock } from "../shared/test_utils.ts";
import { ColorSpace } from "./colorspace.ts";
import { PDFFunctionFactory } from "./function.ts";
import { LocalColorSpaceCache } from "./image_utils.ts";
import { Dict, Name, Ref } from "./primitives.ts";
import { Stream, StringStream } from "./stream.ts";
/*80--------------------------------------------------------------------------*/

describe("colorspace", () => {
  describe("ColorSpace.isDefaultDecode", () => {
    it("should be true if decode is not an array", () => {
      assertEquals(ColorSpace.isDefaultDecode("string", 0), true);
    });

    it("should be true if length of decode array is not correct", () => {
      assertEquals(ColorSpace.isDefaultDecode([0], 1), true);
      assertEquals(ColorSpace.isDefaultDecode([0, 1, 0], 1), true);
    });

    it("should be true if decode map matches the default decode map", () => {
      assertEquals(ColorSpace.isDefaultDecode([], 0), true);

      assertEquals(ColorSpace.isDefaultDecode([0, 0], 1), false);
      assertEquals(ColorSpace.isDefaultDecode([0, 1], 1), true);

      assertEquals(
        ColorSpace.isDefaultDecode([0, 1, 0, 1, 0, 1], 3),
        true,
      );
      assertEquals(
        ColorSpace.isDefaultDecode([0, 1, 0, 1, 1, 1], 3),
        false,
      );

      assertEquals(
        ColorSpace.isDefaultDecode([0, 1, 0, 1, 0, 1, 0, 1], 4),
        true,
      );
      assertEquals(
        ColorSpace.isDefaultDecode([1, 0, 0, 1, 0, 1, 0, 1], 4),
        false,
      );
    });
  });

  describe("ColorSpace caching", () => {
    let localColorSpaceCache: LocalColorSpaceCache;

    beforeAll(() => {
      localColorSpaceCache = new LocalColorSpaceCache();
    });

    afterAll(() => {
      localColorSpaceCache = undefined as any;
    });

    it("caching by Name", () => {
      const xref = new XRefMock();
      const pdfFunctionFactory = new PDFFunctionFactory({
        xref: xref as any,
        isEvalSupported: undefined,
      });

      const colorSpace1 = ColorSpace.parse({
        cs: Name.get("Pattern"),
        xref: xref as any,
        resources: undefined,
        pdfFunctionFactory,
        localColorSpaceCache,
      });
      assertEquals(colorSpace1.name, "Pattern");

      const colorSpace2 = ColorSpace.parse({
        cs: Name.get("Pattern"),
        xref: xref as any,
        resources: undefined,
        pdfFunctionFactory,
        localColorSpaceCache,
      });
      assertEquals(colorSpace2.name, "Pattern");

      const colorSpaceNonCached = ColorSpace.parse({
        cs: Name.get("Pattern"),
        xref: xref as any,
        resources: undefined,
        pdfFunctionFactory,
        localColorSpaceCache: new LocalColorSpaceCache(),
      });
      assertEquals(colorSpaceNonCached.name, "Pattern");

      const colorSpaceOther = ColorSpace.parse({
        cs: Name.get("RGB"),
        xref: xref as any,
        resources: undefined,
        pdfFunctionFactory,
        localColorSpaceCache,
      });
      assertEquals(colorSpaceOther.name, "DeviceRGB");

      // These two must be *identical* if caching worked as intended.
      assertStrictEquals(colorSpace1, colorSpace2);

      assertNotStrictEquals(colorSpace1, colorSpaceNonCached);
      assertNotStrictEquals(colorSpace1, colorSpaceOther);
    });

    it("caching by Ref", () => {
      const paramsCalGray = new Dict();
      paramsCalGray.set("WhitePoint", [1, 1, 1]);
      paramsCalGray.set("BlackPoint", [0, 0, 0]);
      paramsCalGray.set("Gamma", 2.0);

      const paramsCalRGB = new Dict();
      paramsCalRGB.set("WhitePoint", [1, 1, 1]);
      paramsCalRGB.set("BlackPoint", [0, 0, 0]);
      paramsCalRGB.set("Gamma", [1, 1, 1]);
      paramsCalRGB.set("Matrix", [1, 0, 0, 0, 1, 0, 0, 0, 1]);

      const xref = new XRefMock([
        {
          ref: Ref.get(50, 0),
          data: [Name.get("CalGray"), paramsCalGray],
        },
        {
          ref: Ref.get(100, 0),
          data: [Name.get("CalRGB"), paramsCalRGB],
        },
      ]);
      const pdfFunctionFactory = new PDFFunctionFactory({
        xref: xref as any,
        isEvalSupported: undefined,
      });

      const colorSpace1 = ColorSpace.parse({
        cs: Ref.get(50, 0),
        xref: xref as any,
        resources: undefined,
        pdfFunctionFactory,
        localColorSpaceCache,
      });
      assertEquals(colorSpace1.name, "CalGray");

      const colorSpace2 = ColorSpace.parse({
        cs: Ref.get(50, 0),
        xref: xref as any,
        resources: undefined,
        pdfFunctionFactory,
        localColorSpaceCache,
      });
      assertEquals(colorSpace2.name, "CalGray");

      const colorSpaceNonCached = ColorSpace.parse({
        cs: Ref.get(50, 0),
        xref: xref as any,
        resources: undefined,
        pdfFunctionFactory,
        localColorSpaceCache: new LocalColorSpaceCache(),
      });
      assertEquals(colorSpaceNonCached.name, "CalGray");

      const colorSpaceOther = ColorSpace.parse({
        cs: Ref.get(100, 0),
        xref: xref as any,
        resources: undefined,
        pdfFunctionFactory,
        localColorSpaceCache,
      });
      assertEquals(colorSpaceOther.name, "CalRGB");

      // These two must be *identical* if caching worked as intended.
      assertStrictEquals(colorSpace1, colorSpace2);

      assertNotStrictEquals(colorSpace1, colorSpaceNonCached);
      assertNotStrictEquals(colorSpace1, colorSpaceOther);
    });
  });

  describe("DeviceGrayCS", () => {
    it("should handle the case when cs is a Name object", () => {
      const cs = Name.get("DeviceGray");
      const xref = new XRefMock([
        {
          ref: Ref.get(10, 0),
          data: new Dict(),
        },
      ]);
      const resources = new Dict();

      const pdfFunctionFactory = new PDFFunctionFactory({
        xref: xref as any,
        isEvalSupported: undefined,
      });
      const colorSpace = ColorSpace.parse({
        cs,
        xref: xref as any,
        resources,
        pdfFunctionFactory,
        localColorSpaceCache: new LocalColorSpaceCache(),
      });

      const testSrc = new Uint8Array([27, 125, 250, 131]);
      const testDest = new Uint8ClampedArray(4 * 4 * 3);
      // deno-fmt-ignore
      const expectedDest = new Uint8ClampedArray([
        27, 27, 27,
        27, 27, 27,
        125, 125, 125,
        125, 125, 125,
        27, 27, 27,
        27, 27, 27,
        125, 125, 125,
        125, 125, 125,
        250, 250, 250,
        250, 250, 250,
        131, 131, 131,
        131, 131, 131,
        250, 250, 250,
        250, 250, 250,
        131, 131, 131,
        131, 131, 131
      ]);
      colorSpace.fillRgb(testDest, 2, 2, 4, 4, 4, 8, testSrc, 0);

      assertEquals(
        colorSpace.getRgb(new Float32Array([0.1]), 0),
        new Uint8ClampedArray([26, 26, 26]),
      );
      assertEquals(colorSpace.getOutputLength(2, 0), 6);
      assertEquals(colorSpace.isPassthrough(8), false);
      assertEquals(testDest, expectedDest);
    });
    it("should handle the case when cs is an indirect object", () => {
      const cs = Ref.get(10, 0);
      const xref = new XRefMock([
        {
          ref: cs,
          data: Name.get("DeviceGray"),
        },
      ]);
      const resources = new Dict();

      const pdfFunctionFactory = new PDFFunctionFactory({
        xref: xref as any,
        isEvalSupported: undefined,
      });
      const colorSpace = ColorSpace.parse({
        cs,
        xref: xref as any,
        resources,
        pdfFunctionFactory,
        localColorSpaceCache: new LocalColorSpaceCache(),
      });

      const testSrc = new Uint8Array([27, 125, 250, 131]);
      const testDest = new Uint8ClampedArray(3 * 3 * 3);
      // deno-fmt-ignore
      const expectedDest = new Uint8ClampedArray([
        27, 27, 27,
        27, 27, 27,
        125, 125, 125,
        27, 27, 27,
        27, 27, 27,
        125, 125, 125,
        250, 250, 250,
        250, 250, 250,
        131, 131, 131
      ]);
      colorSpace.fillRgb(testDest, 2, 2, 3, 3, 3, 8, testSrc, 0);

      assertEquals(
        colorSpace.getRgb(new Float32Array([0.2]), 0),
        new Uint8ClampedArray([51, 51, 51]),
      );
      assertEquals(colorSpace.getOutputLength(3, 1), 12);
      assertEquals(colorSpace.isPassthrough(8), false);
      assertEquals(testDest, expectedDest);
    });
  });

  describe("DeviceRgbCS", () => {
    it("should handle the case when cs is a Name object", () => {
      const cs = Name.get("DeviceRGB");
      const xref = new XRefMock([
        {
          ref: Ref.get(10, 0),
          data: new Dict(),
        },
      ]);
      const resources = new Dict();

      const pdfFunctionFactory = new PDFFunctionFactory({
        xref: xref as any,
        isEvalSupported: undefined,
      });
      const colorSpace = ColorSpace.parse({
        cs,
        xref: xref as any,
        resources,
        pdfFunctionFactory,
        localColorSpaceCache: new LocalColorSpaceCache(),
      });

      // deno-fmt-ignore
      const testSrc = new Uint8Array([
        27, 125, 250,
        131, 139, 140,
        111, 25, 198,
        21, 147, 255
      ]);
      const testDest = new Uint8ClampedArray(4 * 4 * 3);
      // deno-fmt-ignore
      const expectedDest = new Uint8ClampedArray([
        27, 125, 250,
        27, 125, 250,
        131, 139, 140,
        131, 139, 140,
        27, 125, 250,
        27, 125, 250,
        131, 139, 140,
        131, 139, 140,
        111, 25, 198,
        111, 25, 198,
        21, 147, 255,
        21, 147, 255,
        111, 25, 198,
        111, 25, 198,
        21, 147, 255,
        21, 147, 255
      ]);
      colorSpace.fillRgb(testDest, 2, 2, 4, 4, 4, 8, testSrc, 0);

      assertEquals(
        colorSpace.getRgb(new Float32Array([0.1, 0.2, 0.3]), 0),
        new Uint8ClampedArray([26, 51, 77]),
      );
      assertEquals(colorSpace.getOutputLength(4, 0), 4);
      assertEquals(colorSpace.isPassthrough(8), true);
      assertEquals(testDest, expectedDest);
    });
    it("should handle the case when cs is an indirect object", () => {
      const cs = Ref.get(10, 0);
      const xref = new XRefMock([
        {
          ref: cs,
          data: Name.get("DeviceRGB"),
        },
      ]);
      const resources = new Dict();

      const pdfFunctionFactory = new PDFFunctionFactory({
        xref: xref as any,
        isEvalSupported: undefined,
      });
      const colorSpace = ColorSpace.parse({
        cs,
        xref: xref as any,
        resources,
        pdfFunctionFactory,
        localColorSpaceCache: new LocalColorSpaceCache(),
      });

      // deno-fmt-ignore
      const testSrc = new Uint8Array([
        27, 125, 250,
        131, 139, 140,
        111, 25, 198,
        21, 147, 255
      ]);
      const testDest = new Uint8ClampedArray(3 * 3 * 3);
      // deno-fmt-ignore
      const expectedDest = new Uint8ClampedArray([
        27, 125, 250,
        27, 125, 250,
        131, 139, 140,
        27, 125, 250,
        27, 125, 250,
        131, 139, 140,
        111, 25, 198,
        111, 25, 198,
        21, 147, 255
      ]);
      colorSpace.fillRgb(testDest, 2, 2, 3, 3, 3, 8, testSrc, 0);

      assertEquals(
        colorSpace.getRgb(new Float32Array([0.1, 0.2, 0.3]), 0),
        new Uint8ClampedArray([26, 51, 77]),
      );
      assertEquals(colorSpace.getOutputLength(4, 1), 5);
      assertEquals(colorSpace.isPassthrough(8), true);
      assertEquals(testDest, expectedDest);
    });
  });

  describe("DeviceCmykCS", () => {
    it("should handle the case when cs is a Name object", () => {
      const cs = Name.get("DeviceCMYK");
      const xref = new XRefMock([
        {
          ref: Ref.get(10, 0),
          data: new Dict(),
        },
      ]);
      const resources = new Dict();

      const pdfFunctionFactory = new PDFFunctionFactory({
        xref: xref as any,
        isEvalSupported: undefined,
      });
      const colorSpace = ColorSpace.parse({
        cs,
        xref: xref as any,
        resources,
        pdfFunctionFactory,
        localColorSpaceCache: new LocalColorSpaceCache(),
      });

      // deno-fmt-ignore
      const testSrc = new Uint8Array([
        27, 125, 250, 128,
        131, 139, 140, 45,
        111, 25, 198, 78,
        21, 147, 255, 69
      ]);
      const testDest = new Uint8ClampedArray(4 * 4 * 3);
      // deno-fmt-ignore
      const expectedDest = new Uint8ClampedArray([
        135, 81, 18,
        135, 81, 18,
        114, 102, 97,
        114, 102, 97,
        135, 81, 18,
        135, 81, 18,
        114, 102, 97,
        114, 102, 97,
        112, 144, 75,
        112, 144, 75,
        188, 98, 27,
        188, 98, 27,
        112, 144, 75,
        112, 144, 75,
        188, 98, 27,
        188, 98, 27
      ]);
      colorSpace.fillRgb(testDest, 2, 2, 4, 4, 4, 8, testSrc, 0);

      assertEquals(
        colorSpace.getRgb(new Float32Array([0.1, 0.2, 0.3, 1]), 0),
        new Uint8ClampedArray([32, 28, 21]),
      );
      assertEquals(colorSpace.getOutputLength(4, 0), 3);
      assertEquals(colorSpace.isPassthrough(8), false);
      assertEquals(testDest, expectedDest);
    });
    it("should handle the case when cs is an indirect object", () => {
      const cs = Ref.get(10, 0);
      const xref = new XRefMock([
        {
          ref: cs,
          data: Name.get("DeviceCMYK"),
        },
      ]);
      const resources = new Dict();

      const pdfFunctionFactory = new PDFFunctionFactory({
        xref: xref as any,
        isEvalSupported: undefined,
      });
      const colorSpace = ColorSpace.parse({
        cs,
        xref: xref as any,
        resources,
        pdfFunctionFactory,
        localColorSpaceCache: new LocalColorSpaceCache(),
      });

      // deno-fmt-ignore
      const testSrc = new Uint8Array([
        27, 125, 250, 128,
        131, 139, 140, 45,
        111, 25, 198, 78,
        21, 147, 255, 69
      ]);
      const testDest = new Uint8ClampedArray(3 * 3 * 3);
      // deno-fmt-ignore
      const expectedDest = new Uint8ClampedArray([
        135, 81, 18,
        135, 81, 18,
        114, 102, 97,
        135, 81, 18,
        135, 81, 18,
        114, 102, 97,
        112, 144, 75,
        112, 144, 75,
        188, 98, 27
      ]);
      colorSpace.fillRgb(testDest, 2, 2, 3, 3, 3, 8, testSrc, 0);

      assertEquals(
        colorSpace.getRgb(new Float32Array([0.1, 0.2, 0.3, 1]), 0),
        new Uint8ClampedArray([32, 28, 21]),
      );
      assertEquals(colorSpace.getOutputLength(4, 1), 4);
      assertEquals(colorSpace.isPassthrough(8), false);
      assertEquals(testDest, expectedDest);
    });
  });

  describe("CalGrayCS", () => {
    it("should handle the case when cs is an array", () => {
      const params = new Dict();
      params.set("WhitePoint", [1, 1, 1]);
      params.set("BlackPoint", [0, 0, 0]);
      params.set("Gamma", 2.0);

      const cs: [Name, Dict] = [Name.get("CalGray"), params];
      const xref = new XRefMock([
        {
          ref: Ref.get(10, 0),
          data: new Dict(),
        },
      ]);
      const resources = new Dict();

      const pdfFunctionFactory = new PDFFunctionFactory({
        xref: xref as any,
        isEvalSupported: undefined,
      });
      const colorSpace = ColorSpace.parse({
        cs,
        xref: xref as any,
        resources,
        pdfFunctionFactory,
        localColorSpaceCache: new LocalColorSpaceCache(),
      });

      const testSrc = new Uint8Array([27, 125, 250, 131]);
      const testDest = new Uint8ClampedArray(4 * 4 * 3);
      // deno-fmt-ignore
      const expectedDest = new Uint8ClampedArray([
        25, 25, 25,
        25, 25, 25,
        143, 143, 143,
        143, 143, 143,
        25, 25, 25,
        25, 25, 25,
        143, 143, 143,
        143, 143, 143,
        251, 251, 251,
        251, 251, 251,
        149, 149, 149,
        149, 149, 149,
        251, 251, 251,
        251, 251, 251,
        149, 149, 149,
        149, 149, 149
      ]);
      colorSpace.fillRgb(testDest, 2, 2, 4, 4, 4, 8, testSrc, 0);

      assertEquals(
        colorSpace.getRgb(new Float32Array([1.0]), 0),
        new Uint8ClampedArray([255, 255, 255]),
      );
      assertEquals(colorSpace.getOutputLength(4, 0), 12);
      assertEquals(colorSpace.isPassthrough(8), false);
      assertEquals(testDest, expectedDest);
    });
  });

  describe("CalRGBCS", () => {
    it("should handle the case when cs is an array", () => {
      const params = new Dict();
      params.set("WhitePoint", [1, 1, 1]);
      params.set("BlackPoint", [0, 0, 0]);
      params.set("Gamma", [1, 1, 1]);
      params.set("Matrix", [1, 0, 0, 0, 1, 0, 0, 0, 1]);

      const cs: [Name, Dict] = [Name.get("CalRGB"), params];
      const xref = new XRefMock([
        {
          ref: Ref.get(10, 0),
          data: new Dict(),
        },
      ]);
      const resources = new Dict();

      const pdfFunctionFactory = new PDFFunctionFactory({
        xref: xref as any,
        isEvalSupported: undefined,
      });
      const colorSpace = ColorSpace.parse({
        cs,
        xref: xref as any,
        resources,
        pdfFunctionFactory,
        localColorSpaceCache: new LocalColorSpaceCache(),
      });

      // deno-fmt-ignore
      const testSrc = new Uint8Array([
        27, 125, 250,
        131, 139, 140,
        111, 25, 198,
        21, 147, 255
      ]);
      const testDest = new Uint8ClampedArray(3 * 3 * 3);
      // deno-fmt-ignore
      const expectedDest = new Uint8ClampedArray([
        0, 238, 255,
        0, 238, 255,
        185, 196, 195,
        0, 238, 255,
        0, 238, 255,
        185, 196, 195,
        235, 0, 243,
        235, 0, 243,
        0, 255, 255
      ]);
      colorSpace.fillRgb(testDest, 2, 2, 3, 3, 3, 8, testSrc, 0);

      assertEquals(
        colorSpace.getRgb(new Float32Array([0.1, 0.2, 0.3]), 0),
        new Uint8ClampedArray([0, 147, 151]),
      );
      assertEquals(colorSpace.getOutputLength(4, 0), 4);
      assertEquals(colorSpace.isPassthrough(8), false);
      assertEquals(testDest, expectedDest);
    });
  });

  describe("LabCS", () => {
    it("should handle the case when cs is an array", () => {
      const params = new Dict();
      params.set("WhitePoint", [1, 1, 1]);
      params.set("BlackPoint", [0, 0, 0]);
      params.set("Range", [-100, 100, -100, 100]);

      const cs: [Name, Dict] = [Name.get("Lab"), params];
      const xref = new XRefMock([
        {
          ref: Ref.get(10, 0),
          data: new Dict(),
        },
      ]);
      const resources = new Dict();

      const pdfFunctionFactory = new PDFFunctionFactory({
        xref: xref as any,
        isEvalSupported: undefined,
      });
      const colorSpace = ColorSpace.parse({
        cs,
        xref: xref as any,
        resources,
        pdfFunctionFactory,
        localColorSpaceCache: new LocalColorSpaceCache(),
      });

      // deno-fmt-ignore
      const testSrc = new Uint8Array([
        27, 25, 50,
        31, 19, 40,
        11, 25, 98,
        21, 47, 55
      ]);
      const testDest = new Uint8ClampedArray(3 * 3 * 3);
      // deno-fmt-ignore
      const expectedDest = new Uint8ClampedArray([
        0, 49, 101,
        0, 49, 101,
        0, 53, 117,
        0, 49, 101,
        0, 49, 101,
        0, 53, 117,
        0, 41, 40,
        0, 41, 40,
        0, 43, 90
      ]);
      colorSpace.fillRgb(testDest, 2, 2, 3, 3, 3, 8, testSrc, 0);

      assertEquals(
        colorSpace.getRgb([55, 25, 35], 0),
        new Uint8ClampedArray([188, 100, 61]),
      );
      assertEquals(colorSpace.getOutputLength(4, 0), 4);
      assertEquals(colorSpace.isPassthrough(8), false);
      assertEquals(colorSpace.isDefaultDecode([0, 1]), true);
      assertEquals(testDest, expectedDest);
    });
  });

  describe("IndexedCS", () => {
    it("should handle the case when cs is an array", () => {
      // deno-fmt-ignore
      const lookup = new Stream(
        new Uint8Array([
          23, 155, 35,
          147, 69, 93,
          255, 109, 70
        ]),
      );
      const cs: [Name, Name, number, Stream] = [
        Name.get("Indexed"),
        Name.get("DeviceRGB"),
        2,
        lookup,
      ];
      const xref = new XRefMock([
        {
          ref: Ref.get(10, 0),
          data: new Dict(),
        },
      ]);
      const resources = new Dict();

      const pdfFunctionFactory = new PDFFunctionFactory({
        xref: xref as any,
        isEvalSupported: undefined,
      });
      const colorSpace = ColorSpace.parse({
        cs,
        xref: xref as any,
        resources,
        pdfFunctionFactory,
        localColorSpaceCache: new LocalColorSpaceCache(),
      });

      const testSrc = new Uint8Array([2, 2, 0, 1]);
      const testDest = new Uint8ClampedArray(3 * 3 * 3);
      // deno-fmt-ignore
      const expectedDest = new Uint8ClampedArray([
        255, 109, 70,
        255, 109, 70,
        255, 109, 70,
        255, 109, 70,
        255, 109, 70,
        255, 109, 70,
        23, 155, 35,
        23, 155, 35,
        147, 69, 93,
      ]);
      colorSpace.fillRgb(testDest, 2, 2, 3, 3, 3, 8, testSrc, 0);

      assertEquals(
        colorSpace.getRgb([2], 0),
        new Uint8ClampedArray([255, 109, 70]),
      );
      assertEquals(colorSpace.isPassthrough(8), false);
      assertEquals(colorSpace.isDefaultDecode([0, 1], 1), true);
      assertEquals(testDest, expectedDest);
    });
  });

  describe("AlternateCS", () => {
    it("should handle the case when cs is an array", () => {
      const fnDict = new Dict();
      fnDict.set("FunctionType", 4);
      fnDict.set("Domain", [0.0, 1.0]);
      fnDict.set("Range", [0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0]);
      fnDict.set("Length", 58);

      let fn = new StringStream(
        "{ dup 0.84 mul " +
          "exch 0.00 exch " +
          "dup 0.44 mul " +
          "exch 0.21 mul }",
      );
      fn = new Stream(fn.bytes, 0, 58, fnDict);

      const fnRef = Ref.get(10, 0);

      const cs: [Name, Name, Name, Ref] = [
        Name.get("Separation"),
        Name.get("LogoGreen"),
        Name.get("DeviceCMYK"),
        fnRef,
      ];
      const xref = new XRefMock([
        {
          ref: fnRef,
          data: fn,
        },
      ]);
      const resources = new Dict();

      const pdfFunctionFactory = new PDFFunctionFactory({
        xref: xref as any,
        isEvalSupported: undefined,
      });
      const colorSpace = ColorSpace.parse({
        cs,
        xref: xref as any,
        resources,
        pdfFunctionFactory,
        localColorSpaceCache: new LocalColorSpaceCache(),
      });

      const testSrc = new Uint8Array([27, 25, 50, 31]);
      const testDest = new Uint8ClampedArray(3 * 3 * 3);
      // deno-fmt-ignore
      const expectedDest = new Uint8ClampedArray([
        226, 242, 241,
        226, 242, 241,
        229, 244, 242,
        226, 242, 241,
        226, 242, 241,
        229, 244, 242,
        203, 232, 229,
        203, 232, 229,
        222, 241, 238
      ]);
      colorSpace.fillRgb(testDest, 2, 2, 3, 3, 3, 8, testSrc, 0);

      assertEquals(
        colorSpace.getRgb([0.1], 0),
        new Uint8ClampedArray([228, 243, 242]),
      );
      assertEquals(colorSpace.isPassthrough(8), false);
      assertEquals(colorSpace.isDefaultDecode([0, 1]), true);
      assertEquals(testDest, expectedDest);
    });
  });
});
/*80--------------------------------------------------------------------------*/
