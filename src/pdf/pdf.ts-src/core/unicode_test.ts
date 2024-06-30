/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/unicode_test.ts
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

import { assertEquals } from "@std/assert";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd.ts";
import { getDingbatsGlyphsUnicode, getGlyphsUnicode } from "./glyphlist.ts";
import {
  getCharUnicodeCategory,
  getUnicodeForGlyph,
  getUnicodeRangeFor,
  mapSpecialUnicodeValues,
} from "./unicode.ts";
/*80--------------------------------------------------------------------------*/

describe("unicode", () => {
  describe("mapSpecialUnicodeValues", () => {
    it("should not re-map normal Unicode values", () => {
      // A
      assertEquals(mapSpecialUnicodeValues(0x0041), 0x0041);
      // fi
      assertEquals(mapSpecialUnicodeValues(0xfb01), 0xfb01);
    });

    it("should re-map special Unicode values", () => {
      // copyrightsans => copyright
      assertEquals(mapSpecialUnicodeValues(0xf8e9), 0x00a9);
      // Private Use Area characters
      assertEquals(mapSpecialUnicodeValues(0xffff), 0);
    });
  });

  describe("getCharUnicodeCategory", () => {
    it("should correctly determine the character category", () => {
      const tests = {
        // Whitespace
        " ": {
          isZeroWidthDiacritic: false,
          isInvisibleFormatMark: false,
          isWhitespace: true,
        },
        "\t": {
          isZeroWidthDiacritic: false,
          isInvisibleFormatMark: false,
          isWhitespace: true,
        },
        "\u2001": {
          isZeroWidthDiacritic: false,
          isInvisibleFormatMark: false,
          isWhitespace: true,
        },
        "\uFEFF": {
          isZeroWidthDiacritic: false,
          isInvisibleFormatMark: false,
          isWhitespace: true,
        },

        // Diacritic
        "\u0302": {
          isZeroWidthDiacritic: true,
          isInvisibleFormatMark: false,
          isWhitespace: false,
        },
        "\u0344": {
          isZeroWidthDiacritic: true,
          isInvisibleFormatMark: false,
          isWhitespace: false,
        },
        "\u0361": {
          isZeroWidthDiacritic: true,
          isInvisibleFormatMark: false,
          isWhitespace: false,
        },

        // Invisible format mark
        "\u200B": {
          isZeroWidthDiacritic: false,
          isInvisibleFormatMark: true,
          isWhitespace: false,
        },
        "\u200D": {
          isZeroWidthDiacritic: false,
          isInvisibleFormatMark: true,
          isWhitespace: false,
        },

        // No whitespace or diacritic or invisible format mark
        a: {
          isZeroWidthDiacritic: false,
          isInvisibleFormatMark: false,
          isWhitespace: false,
        },
        1: {
          isZeroWidthDiacritic: false,
          isInvisibleFormatMark: false,
          isWhitespace: false,
        },
      };
      for (const [character, expectation] of Object.entries(tests)) {
        assertEquals(getCharUnicodeCategory(character), expectation);
      }
    });
  });

  describe("getUnicodeForGlyph", () => {
    let standardMap: Record<string, number>,
      dingbatsMap: Record<string, number>;

    beforeAll(() => {
      standardMap = getGlyphsUnicode();
      dingbatsMap = getDingbatsGlyphsUnicode();
    });

    afterAll(() => {
      standardMap = dingbatsMap = undefined as any;
    });

    it("should get Unicode values for valid glyph names", () => {
      assertEquals(getUnicodeForGlyph("A", standardMap), 0x0041);
      assertEquals(getUnicodeForGlyph("a1", dingbatsMap), 0x2701);
    });

    it("should recover Unicode values from uniXXXX/uXXXX{XX} glyph names", () => {
      assertEquals(getUnicodeForGlyph("uni0041", standardMap), 0x0041);
      assertEquals(getUnicodeForGlyph("u0041", standardMap), 0x0041);

      assertEquals(getUnicodeForGlyph("uni2701", dingbatsMap), 0x2701);
      assertEquals(getUnicodeForGlyph("u2701", dingbatsMap), 0x2701);
    });

    it("should not get Unicode values for invalid glyph names", () => {
      assertEquals(getUnicodeForGlyph("Qwerty", standardMap), -1);
      assertEquals(getUnicodeForGlyph("Qwerty", dingbatsMap), -1);
    });
  });

  describe("getUnicodeRangeFor", () => {
    it("should get correct Unicode range", () => {
      // A (Basic Latin)
      assertEquals(getUnicodeRangeFor(0x0041), 0);
      // fi (Alphabetic Presentation Forms)
      assertEquals(getUnicodeRangeFor(0xfb01), 62);
      // Combining diacritic (Cyrillic Extended-A)
      assertEquals(getUnicodeRangeFor(0x2dff), 9);
    });

    it("should not get a Unicode range", () => {
      assertEquals(getUnicodeRangeFor(0xaa60), -1);
    });
  });
});
/*80--------------------------------------------------------------------------*/
