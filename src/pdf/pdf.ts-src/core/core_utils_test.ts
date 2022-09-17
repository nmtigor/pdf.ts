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
  assertThrows,
} from "https://deno.land/std@0.154.0/testing/asserts.ts";
import { describe, it } from "https://deno.land/std@0.154.0/testing/bdd.ts";
import { XRefMock } from "../shared/test_utils.ts";
import {
  encodeToXmlString,
  escapePDFName,
  getInheritableProperty,
  isWhiteSpace,
  log2,
  parseXFAPath,
  toRomanNumerals,
  validateCSSFont,
} from "./core_utils.ts";
import { type CssFontInfo } from "./document.ts";
import { Dict, Ref } from "./primitives.ts";
/*80--------------------------------------------------------------------------*/

describe("core_utils", () => {
  describe("getInheritableProperty", () => {
    it("handles non-dictionary arguments", () => {
      assertEquals(
        getInheritableProperty({ dict: null as any, key: "foo" }),
        undefined,
      );
      assertEquals(
        getInheritableProperty({ dict: undefined as any, key: "foo" }),
        undefined,
      );
    });

    it("handles dictionaries that do not contain the property", () => {
      // Empty dictionary.
      const emptyDict = new Dict();
      assertEquals(
        getInheritableProperty({ dict: emptyDict, key: "foo" }),
        undefined,
      );

      // Filled dictionary with a different property.
      const filledDict = new Dict();
      filledDict.set("bar", "baz");
      assertEquals(
        getInheritableProperty({ dict: filledDict, key: "foo" }),
        undefined,
      );
    });

    it("fetches the property if it is not inherited", () => {
      const ref = Ref.get(10, 0);
      const xref = new XRefMock([{ ref, data: "quux" }]);
      const dict = new Dict(xref as any);

      // Regular values should be fetched.
      dict.set("foo", "bar");
      assertEquals(getInheritableProperty({ dict, key: "foo" }), "bar");

      // Array value should be fetched (with references resolved).
      dict.set("baz", ["qux", ref]);
      assertEquals(
        getInheritableProperty({
          dict,
          key: "baz",
          getArray: true,
        }),
        ["qux", "quux"],
      );
    });

    it("fetches the property if it is inherited and present on one level", () => {
      const ref = Ref.get(10, 0);
      const xref = new XRefMock([{ ref, data: "quux" }]);
      const firstDict = new Dict(xref as any);
      const secondDict = new Dict(xref as any);
      firstDict.set("Parent", secondDict);

      // Regular values should be fetched.
      secondDict.set("foo", "bar");
      assertEquals(
        getInheritableProperty({ dict: firstDict, key: "foo" }),
        "bar",
      );

      // Array value should be fetched (with references resolved).
      secondDict.set("baz", ["qux", ref]);
      assertEquals(
        getInheritableProperty({
          dict: firstDict,
          key: "baz",
          getArray: true,
        }),
        ["qux", "quux"],
      );
    });

    it("fetches the property if it is inherited and present on multiple levels", () => {
      const ref = Ref.get(10, 0);
      const xref = new XRefMock([{ ref, data: "quux" }]);
      const firstDict = new Dict(xref as any);
      const secondDict = new Dict(xref as any);
      firstDict.set("Parent", secondDict);

      // Regular values should be fetched.
      firstDict.set("foo", "bar1");
      secondDict.set("foo", "bar2");
      assertEquals(
        getInheritableProperty({ dict: firstDict, key: "foo" }),
        "bar1",
      );
      assertEquals(
        getInheritableProperty({
          dict: firstDict,
          key: "foo",
          getArray: false,
          stopWhenFound: false,
        }),
        ["bar1", "bar2"],
      );

      // Array value should be fetched (with references resolved).
      firstDict.set("baz", ["qux1", ref]);
      secondDict.set("baz", ["qux2", ref]);
      assertEquals(
        getInheritableProperty({
          dict: firstDict,
          key: "baz",
          getArray: true,
          stopWhenFound: false,
        }),
        [
          ["qux1", "quux"],
          ["qux2", "quux"],
        ],
      );
    });
  });

  describe("toRomanNumerals", () => {
    it("handles invalid arguments", () => {
      for (const input of ["foo", -1, 0]) {
        assertThrows(
          () => toRomanNumerals(input as any),
          Error,
          "The number should be a positive integer.",
        );
      }
    });

    it("converts numbers to uppercase Roman numerals", () => {
      assertEquals(toRomanNumerals(1), "I");
      assertEquals(toRomanNumerals(6), "VI");
      assertEquals(toRomanNumerals(7), "VII");
      assertEquals(toRomanNumerals(8), "VIII");
      assertEquals(toRomanNumerals(10), "X");
      assertEquals(toRomanNumerals(40), "XL");
      assertEquals(toRomanNumerals(100), "C");
      assertEquals(toRomanNumerals(500), "D");
      assertEquals(toRomanNumerals(1000), "M");
      assertEquals(toRomanNumerals(2019), "MMXIX");
    });

    it("converts numbers to lowercase Roman numerals", () => {
      assertEquals(toRomanNumerals(1, /* lowercase = */ true), "i");
      assertEquals(toRomanNumerals(6, /* lowercase = */ true), "vi");
      assertEquals(toRomanNumerals(7, /* lowercase = */ true), "vii");
      assertEquals(toRomanNumerals(8, /* lowercase = */ true), "viii");
      assertEquals(toRomanNumerals(10, /* lowercase = */ true), "x");
      assertEquals(toRomanNumerals(40, /* lowercase = */ true), "xl");
      assertEquals(toRomanNumerals(100, /* lowercase = */ true), "c");
      assertEquals(toRomanNumerals(500, /* lowercase = */ true), "d");
      assertEquals(toRomanNumerals(1000, /* lowercase = */ true), "m");
      assertEquals(toRomanNumerals(2019, /* lowercase = */ true), "mmxix");
    });
  });

  describe("log2", () => {
    it("handles values smaller than/equal to zero", () => {
      assertEquals(log2(0), 0);
      assertEquals(log2(-1), 0);
    });

    it("handles values larger than zero", () => {
      assertEquals(log2(1), 0);
      assertEquals(log2(2), 1);
      assertEquals(log2(3), 2);
      assertEquals(log2(3.14), 2);
    });
  });

  describe("isWhiteSpace", () => {
    it("handles space characters", () => {
      assertEquals(isWhiteSpace(0x20), true);
      assertEquals(isWhiteSpace(0x09), true);
      assertEquals(isWhiteSpace(0x0d), true);
      assertEquals(isWhiteSpace(0x0a), true);
    });

    it("handles non-space characters", () => {
      assertEquals(isWhiteSpace(0x0b), false);
      assertEquals(isWhiteSpace(null as any), false);
      assertEquals(isWhiteSpace(undefined as any), false);
    });
  });

  describe("parseXFAPath", () => {
    it("should get a correctly parsed path", () => {
      const path = "foo.bar[12].oof[3].rab.FOO[123].BAR[456]";
      assertEquals(
        parseXFAPath(path),
        [
          { name: "foo", pos: 0 },
          { name: "bar", pos: 12 },
          { name: "oof", pos: 3 },
          { name: "rab", pos: 0 },
          { name: "FOO", pos: 123 },
          { name: "BAR", pos: 456 },
        ],
      );
    });
  });

  describe("escapePDFName", () => {
    it("should escape PDF name", () => {
      assertEquals(escapePDFName("hello"), "hello");
      assertEquals(escapePDFName("\xfehello"), "#fehello");
      assertEquals(escapePDFName("he\xfell\xffo"), "he#fell#ffo");
      assertEquals(escapePDFName("\xfehe\xfell\xffo\xff"), "#fehe#fell#ffo#ff");
      assertEquals(escapePDFName("#h#e#l#l#o"), "#23h#23e#23l#23l#23o");
      assertEquals(
        escapePDFName("#()<>[]{}/%"),
        "#23#28#29#3c#3e#5b#5d#7b#7d#2f#25",
      );
    });
  });

  describe("encodeToXmlString", () => {
    it("should get a correctly encoded string with some entities", () => {
      const str = "\"\u0397ell😂' & <W😂rld>";
      assertEquals(
        encodeToXmlString(str),
        "&quot;&#x397;ell&#x1F602;&apos; &amp; &lt;W&#x1F602;rld&gt;",
      );
    });

    it("should get a correctly encoded basic ascii string", () => {
      const str = "hello world";
      assertEquals(encodeToXmlString(str), str);
    });
  });

  describe("validateCSSFont", () => {
    it("check font family", () => {
      const cssFontInfo = {
        fontFamily: `"blah blah " blah blah"`,
        fontWeight: 0,
        italicAngle: 0,
      };

      assertEquals(validateCSSFont(cssFontInfo), false);

      cssFontInfo.fontFamily = `"blah blah \\" blah blah"`;
      assertEquals(validateCSSFont(cssFontInfo), true);

      cssFontInfo.fontFamily = `'blah blah ' blah blah'`;
      assertEquals(validateCSSFont(cssFontInfo), false);

      cssFontInfo.fontFamily = `'blah blah \\' blah blah'`;
      assertEquals(validateCSSFont(cssFontInfo), true);

      cssFontInfo.fontFamily = `"blah blah `;
      assertEquals(validateCSSFont(cssFontInfo), false);

      cssFontInfo.fontFamily = `blah blah"`;
      assertEquals(validateCSSFont(cssFontInfo), false);

      cssFontInfo.fontFamily = `'blah blah `;
      assertEquals(validateCSSFont(cssFontInfo), false);

      cssFontInfo.fontFamily = `blah blah'`;
      assertEquals(validateCSSFont(cssFontInfo), false);

      cssFontInfo.fontFamily = "blah blah blah";
      assertEquals(validateCSSFont(cssFontInfo), true);

      cssFontInfo.fontFamily = "blah 0blah blah";
      assertEquals(validateCSSFont(cssFontInfo), false);

      cssFontInfo.fontFamily = "blah blah -0blah";
      assertEquals(validateCSSFont(cssFontInfo), false);

      cssFontInfo.fontFamily = "blah blah --blah";
      assertEquals(validateCSSFont(cssFontInfo), false);

      cssFontInfo.fontFamily = "blah blah -blah";
      assertEquals(validateCSSFont(cssFontInfo), true);

      cssFontInfo.fontFamily = "blah fdqAJqjHJK23kl23__--Kj blah";
      assertEquals(validateCSSFont(cssFontInfo), true);

      cssFontInfo.fontFamily = "blah fdqAJqjH$JK23kl23__--Kj blah";
      assertEquals(validateCSSFont(cssFontInfo), false);
    });

    it("check font weight", () => {
      const cssFontInfo: CssFontInfo = {
        fontFamily: "blah",
        fontWeight: 100,
        italicAngle: 0,
      };

      validateCSSFont(cssFontInfo);
      assertEquals(cssFontInfo.fontWeight, "100");

      cssFontInfo.fontWeight = "700";
      validateCSSFont(cssFontInfo);
      assertEquals(cssFontInfo.fontWeight, "700");

      cssFontInfo.fontWeight = "normal";
      validateCSSFont(cssFontInfo);
      assertEquals(cssFontInfo.fontWeight, "normal");

      cssFontInfo.fontWeight = 314;
      validateCSSFont(cssFontInfo);
      assertEquals(<any> cssFontInfo.fontWeight, "400");
    });

    it("check italic angle", () => {
      const cssFontInfo: CssFontInfo = {
        fontFamily: "blah",
        fontWeight: 100,
        italicAngle: 10,
      };

      validateCSSFont(cssFontInfo);
      assertEquals(cssFontInfo.italicAngle, "10");

      cssFontInfo.italicAngle = -123;
      validateCSSFont(cssFontInfo);
      assertEquals(cssFontInfo.italicAngle as any, "14");

      cssFontInfo.italicAngle = "91";
      validateCSSFont(cssFontInfo);
      assertEquals(cssFontInfo.italicAngle, "14");

      cssFontInfo.italicAngle = 2.718;
      validateCSSFont(cssFontInfo);
      assertEquals(cssFontInfo.italicAngle as any, "2.718");
    });
  });
});
/*80--------------------------------------------------------------------------*/
