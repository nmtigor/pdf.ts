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

import { assertEquals } from "https://deno.land/std@0.195.0/assert/mod.ts";
import { describe, it } from "https://deno.land/std@0.195.0/testing/bdd.ts";
import {
  createDefaultAppearance,
  parseAppearanceStream,
  parseDefaultAppearance,
} from "./default_appearance.ts";
import { StringStream } from "./stream.ts";
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

  describe("parseAppearanceStream", () => {
    it("should parse a FreeText (from Acrobat) appearance", () => {
      const appearance = new StringStream(`
      0 w
      46.5 621.0552 156.389 18.969 re
      n
      q
      1 0 0 1 0 0 cm
      46.5 621.0552 156.389 18.969 re
      W
      n
      0 g
      1 w
      BT
      /Helv 14 Tf
      0.419998 0.850006 0.160004 rg
      46.5 626.77 Td
      (Hello ) Tj
      35.793 0 Td
      (World ) Tj
      40.448 0 Td
      (from ) Tj
      31.89 0 Td
      (Acrobat) Tj
      ET
      Q`);
      const result = {
        fontSize: 14,
        fontName: "Helv",
        fontColor: new Uint8ClampedArray([107, 217, 41]),
      };
      assertEquals(parseAppearanceStream(appearance), result);
      assertEquals(appearance.pos, 0);
    });

    it("should parse a FreeText (from Firefox) appearance", () => {
      const appearance = new StringStream(`
      q
      0 0 203.7 28.3 re W n
      BT
      1 0 0 1 0 34.6 Tm 0 Tc 0.93 0.17 0.44 rg
      /Helv 18 Tf
      0 -24.3 Td (Hello World From Firefox) Tj
      ET
      Q`);
      const result = {
        fontSize: 18,
        fontName: "Helv",
        fontColor: new Uint8ClampedArray([237, 43, 112]),
      };
      assertEquals(parseAppearanceStream(appearance), result);
      assertEquals(appearance.pos, 0);
    });

    it("should parse a FreeText (from Preview) appearance", () => {
      const appearance = new StringStream(`
      q Q q 2.128482 2.128482 247.84 26 re W n /Cs1 cs 0.52799 0.3071 0.99498 sc
      q 1 0 0 -1 -108.3364 459.8485 cm BT 22.00539 0 0 -22.00539 110.5449 452.72
      Tm /TT1 1 Tf [ (H) -0.2 (e) -0.2 (l) -0.2 (l) -0.2 (o) -0.2 ( ) 0.2 (W) 17.7
      (o) -0.2 (rl) -0.2 (d) -0.2 ( ) 0.2 (f) 0.2 (ro) -0.2 (m ) 0.2 (Pre) -0.2
      (vi) -0.2 (e) -0.2 (w) ] TJ ET Q Q`);
      const result = {
        fontSize: 22.00539,
        fontName: "TT1",
        fontColor: new Uint8ClampedArray([0, 0, 0]),
      };
      assertEquals(parseAppearanceStream(appearance), result);
      assertEquals(appearance.pos, 0);
    });

    it("should parse a FreeText (from Edge) appearance", () => {
      const appearance = new StringStream(`
      q
      0 0 292.5 18.75 re W n
      BT
      0 Tc
      0.0627451 0.486275 0.0627451 rg
      0 3.8175 Td
      /Helv 16.5 Tf
      (Hello World from Edge without Acrobat) Tj
      ET
      Q`);
      const result = {
        fontSize: 16.5,
        fontName: "Helv",
        fontColor: new Uint8ClampedArray([16, 124, 16]),
      };
      assertEquals(parseAppearanceStream(appearance), result);
      assertEquals(appearance.pos, 0);
    });

    it("should parse a FreeText (from Foxit) appearance", () => {
      const appearance = new StringStream(`
      q
      /Tx BMC
      0 -22.333 197.667 22.333 re
      W
      n
      BT
       0.584314 0.247059 0.235294 rg
      0 -18.1 Td
      /FXF0 20 Tf
      (Hello World from Foxit) Tj
      ET
      EMC
      Q`);
      const result = {
        fontSize: 20,
        fontName: "FXF0",
        fontColor: new Uint8ClampedArray([149, 63, 60]),
      };
      assertEquals(parseAppearanceStream(appearance), result);
      assertEquals(appearance.pos, 0);
    });

    it("should parse a FreeText (from Okular) appearance", () => {
      const appearance = new StringStream(`
      q
      0.00 0.00 172.65 41.46 re W n
      0.00000 0.33333 0.49804 rg
      BT 1 0 0 1 0.00 41.46 Tm
      /Invalid_font 18.00 Tf
      0.00 -18.00 Td
      (Hello World from) Tj
      /Invalid_font 18.00 Tf
      0.00 -18.00 Td
      (Okular) Tj
      ET Q`);
      const result = {
        fontSize: 18,
        fontName: "Invalid_font",
        fontColor: new Uint8ClampedArray([0, 85, 127]),
      };
      assertEquals(parseAppearanceStream(appearance), result);
      assertEquals(appearance.pos, 0);
    });
  });
});
/*80--------------------------------------------------------------------------*/
