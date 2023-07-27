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

import { assertEquals } from "https://deno.land/std@0.190.0/testing/asserts.ts";
import { describe, it } from "https://deno.land/std@0.190.0/testing/bdd.ts";
import {
  createDefaultAppearance,
  parseDefaultAppearance,
} from "./default_appearance.ts";
/*80--------------------------------------------------------------------------*/

describe("Default appearance", () => {
  describe("parseDefaultAppearance and createDefaultAppearance", () => {
    it("should parse and create default appearance", () => {
      const da = "/F1 12 Tf 0.1 0.2 0.3 rg";
      const result = {
        fontSize: 12,
        fontName: "F1",
        fontColor: new Uint8ClampedArray([26, 51, 76]),
      };
      assertEquals(parseDefaultAppearance(da), result);
      assertEquals(createDefaultAppearance(result), da);

      assertEquals(
        parseDefaultAppearance(
          "0.1 0.2 0.3 rg /F1 12 Tf 0.3 0.2 0.1 rg /F2 13 Tf",
        ),
        {
          fontSize: 13,
          fontName: "F2",
          fontColor: new Uint8ClampedArray([76, 51, 26]),
        },
      );
    });

    it("should parse default appearance with save/restore", () => {
      const da = "q Q 0.1 0.2 0.3 rg /F1 12 Tf q 0.3 0.2 0.1 rg /F2 13 Tf Q";
      assertEquals(parseDefaultAppearance(da), {
        fontSize: 12,
        fontName: "F1",
        fontColor: new Uint8ClampedArray([26, 51, 76]),
      });
    });
  });
});
/*80--------------------------------------------------------------------------*/
