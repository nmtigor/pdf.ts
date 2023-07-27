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
  assertStrictEquals,
  assertThrows,
} from "https://deno.land/std@0.190.0/testing/asserts.ts";
import { describe, it } from "https://deno.land/std@0.190.0/testing/bdd.ts";
import { XRefMock } from "../shared/test_utils.ts";
import {
  arrayBuffersToBytes,
  encodeToXmlString,
  escapePDFName,
  escapeString,
  getInheritableProperty,
  isAscii,
  isWhiteSpace,
  log2,
  numberToString,
  parseXFAPath,
  recoverJsURL,
  stringToUTF16HexString,
  stringToUTF16String,
  toRomanNumerals,
  validateCSSFont,
} from "./core_utils.ts";
import { type CssFontInfo } from "./document.ts";
import { Dict, Ref } from "./primitives.ts";
/*80--------------------------------------------------------------------------*/

describe("core_utils", () => {
  describe("arrayBuffersToBytes", () => {
    it("handles zero ArrayBuffers", () => {
      const bytes = arrayBuffersToBytes([]);

      assertEquals(bytes, new Uint8Array(0));
    });

    it("handles one ArrayBuffer", () => {
      const buffer = new Uint8Array([1, 2, 3]).buffer;
      const bytes = arrayBuffersToBytes([buffer]);

      assertEquals(bytes, new Uint8Array([1, 2, 3]));
      // Ensure that the fast-path works correctly.
      assertStrictEquals(bytes.buffer, buffer);
    });

    it("handles multiple ArrayBuffers", () => {
      const buffer1 = new Uint8Array([1, 2, 3]).buffer,
        buffer2 = new Uint8Array(0).buffer,
        buffer3 = new Uint8Array([4, 5]).buffer;
      const bytes = arrayBuffersToBytes([buffer1, buffer2, buffer3]);

      assertEquals(bytes, new Uint8Array([1, 2, 3, 4, 5]));
    });
  });

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

  describe("numberToString", () => {
    it("should stringify integers", () => {
      assertEquals(numberToString(1), "1");
      assertEquals(numberToString(0), "0");
      assertEquals(numberToString(-1), "-1");
    });

    it("should stringify floats", () => {
      assertEquals(numberToString(1.0), "1");
      assertEquals(numberToString(1.2), "1.2");
      assertEquals(numberToString(1.23), "1.23");
      assertEquals(numberToString(1.234), "1.23");
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

  describe("recoverJsURL", () => {
    it("should get valid URLs without `newWindow` property", () => {
      const inputs = [
        "window.open('https://test.local')",
        "window.open('https://test.local', true)",
        "app.launchURL('https://test.local')",
        "app.launchURL('https://test.local', false)",
        "xfa.host.gotoURL('https://test.local')",
        "xfa.host.gotoURL('https://test.local', true)",
      ];

      for (const input of inputs) {
        assertEquals(recoverJsURL(input), {
          url: "https://test.local",
          newWindow: false,
        });
      }
    });

    it("should get valid URLs with `newWindow` property", () => {
      const input = "app.launchURL('https://test.local', true)";
      assertEquals(recoverJsURL(input), {
        url: "https://test.local",
        newWindow: true,
      });
    });

    it("should not get invalid URLs", () => {
      const input = "navigateToUrl('https://test.local')";
      assertEquals(recoverJsURL(input), null);
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

  describe("escapeString", () => {
    it("should escape (, ), \\n, \\r, and \\", () => {
      assertEquals(
        escapeString("((a\\a))\n(b(b\\b)\rb)"),
        "\\(\\(a\\\\a\\)\\)\\n\\(b\\(b\\\\b\\)\\rb\\)",
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

    describe("isAscii", () => {
      it("handles ascii/non-ascii strings", () => {
        assertEquals(isAscii("hello world"), true);
        assertEquals(isAscii("こんにちは世界の"), false);
        assertEquals(
          isAscii("hello world in Japanese is こんにちは世界の"),
          false,
        );
      });
    });

    describe("stringToUTF16HexString", () => {
      it("should encode a string in UTF16 hexadecimal format", () => {
        assertEquals(
          stringToUTF16HexString("hello world"),
          "00680065006c006c006f00200077006f0072006c0064",
        );

        assertEquals(
          stringToUTF16HexString("こんにちは世界の"),
          "30533093306b3061306f4e16754c306e",
        );
      });
    });

    describe("stringToUTF16String", () => {
      it("should encode a string in UTF16", () => {
        assertEquals(
          stringToUTF16String("hello world"),
          "\0h\0e\0l\0l\0o\0 \0w\0o\0r\0l\0d",
        );

        assertEquals(
          stringToUTF16String("こんにちは世界の"),
          "\x30\x53\x30\x93\x30\x6b\x30\x61\x30\x6f\x4e\x16\x75\x4c\x30\x6e",
        );
      });

      it("should encode a string in UTF16BE with a BOM", () => {
        assertEquals(
          stringToUTF16String("hello world", /* bigEndian = */ true),
          "\xfe\xff\0h\0e\0l\0l\0o\0 \0w\0o\0r\0l\0d",
        );

        assertEquals(
          stringToUTF16String("こんにちは世界の", /* bigEndian = */ true),
          "\xfe\xff\x30\x53\x30\x93\x30\x6b\x30\x61\x30\x6f\x4e\x16\x75\x4c\x30\x6e",
        );
      });
    });
  });
});
/*80--------------------------------------------------------------------------*/
