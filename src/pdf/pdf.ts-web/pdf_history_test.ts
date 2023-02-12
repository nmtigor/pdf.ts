/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

/* Copyright 2021 Mozilla Foundation
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
} from "https://deno.land/std@0.170.0/testing/asserts.ts";
import { describe, it } from "https://deno.land/std@0.170.0/testing/bdd.ts";
import { type ExplicitDest } from "../pdf.ts-src/pdf.ts";
import { isDestArraysEqual, isDestHashesEqual } from "./pdf_history.ts";
/*80--------------------------------------------------------------------------*/

describe("pdf_history", () => {
  describe("isDestHashesEqual", () => {
    it("should reject non-equal destination hashes", () => {
      assertEquals(isDestHashesEqual(null, "page.157"), false);
      assertEquals(isDestHashesEqual("title.0", "page.157"), false);
      assertEquals(isDestHashesEqual("page=1&zoom=auto", "page.157"), false);

      assertEquals(isDestHashesEqual("nameddest-page.157", "page.157"), false);
      assertEquals(isDestHashesEqual("page.157", "nameddest=page.157"), false);

      const destArrayString = JSON.stringify([
        { num: 3757, gen: 0 },
        { name: "XYZ" },
        92.918,
        748.972,
        null,
      ]);
      assertEquals(isDestHashesEqual(destArrayString, "page.157"), false);
      assertEquals(isDestHashesEqual("page.157", destArrayString), false);
    });

    it("should accept equal destination hashes", () => {
      assertEquals(isDestHashesEqual("page.157", "page.157"), true);
      assertEquals(isDestHashesEqual("nameddest=page.157", "page.157"), true);

      assertEquals(
        isDestHashesEqual("nameddest=page.157&zoom=100", "page.157"),
        true,
      );
    });
  });

  describe("isDestArraysEqual", () => {
    const firstDest: ExplicitDest = [
      { num: 1, gen: 0 },
      { name: "XYZ" },
      0,
      375,
      null,
    ];
    const secondDest: ExplicitDest = [
      { num: 5, gen: 0 },
      { name: "XYZ" },
      0,
      375,
      null,
    ];
    const thirdDest: ExplicitDest = [
      { num: 1, gen: 0 },
      { name: "XYZ" },
      750,
      0,
      null,
    ];
    const fourthDest: ExplicitDest = [
      { num: 1, gen: 0 },
      { name: "XYZ" },
      0,
      375,
      1.0,
    ];
    const fifthDest: ExplicitDest = [
      { gen: 0, num: 1 },
      { name: "XYZ" },
      0,
      375,
      null,
    ];

    it("should reject non-equal destination arrays", () => {
      assertEquals(isDestArraysEqual(firstDest, undefined), false);
      assertEquals(isDestArraysEqual(firstDest, [1, 2, 3, 4, 5] as any), false);

      assertEquals(isDestArraysEqual(firstDest, secondDest), false);
      assertEquals(isDestArraysEqual(firstDest, thirdDest), false);
      assertEquals(isDestArraysEqual(firstDest, fourthDest), false);
    });

    it("should accept equal destination arrays", () => {
      assertEquals(isDestArraysEqual(firstDest, firstDest), true);
      assertEquals(isDestArraysEqual(firstDest, fifthDest), true);

      const firstDestCopy = firstDest.slice() as ExplicitDest;
      assertNotStrictEquals(firstDest, firstDestCopy);

      assertEquals(isDestArraysEqual(firstDest, firstDestCopy), true);
    });
  });
});
/*80--------------------------------------------------------------------------*/
