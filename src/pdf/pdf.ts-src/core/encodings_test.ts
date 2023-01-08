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

import { assertEquals } from "https://deno.land/std@0.165.0/testing/asserts.ts";
import { describe, it } from "https://deno.land/std@0.165.0/testing/bdd.ts";
import { getEncoding } from "./encodings.ts";
/*80--------------------------------------------------------------------------*/

describe("encodings", () => {
  describe("getEncoding", () => {
    it("fetches a valid array for known encoding names", () => {
      const knownEncodingNames = [
        "ExpertEncoding",
        "MacExpertEncoding",
        "MacRomanEncoding",
        "StandardEncoding",
        "SymbolSetEncoding",
        "WinAnsiEncoding",
        "ZapfDingbatsEncoding",
      ];

      for (const knownEncodingName of knownEncodingNames) {
        const encoding = getEncoding(knownEncodingName)!;
        assertEquals(Array.isArray(encoding), true);
        assertEquals(encoding.length, 256);

        for (const item of encoding) {
          assertEquals(typeof item, "string");
        }
      }
    });

    it("fetches `null` for unknown encoding names", () => {
      assertEquals(getEncoding("FooBarEncoding"), undefined);
    });
  });
});
/*80--------------------------------------------------------------------------*/
