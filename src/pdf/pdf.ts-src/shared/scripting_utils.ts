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

/**
 * PLEASE NOTE: This file is currently imported in both the `../display/` and
 *              `../scripting_api/` folders, hence be EXTREMELY careful about
 *              introducing any dependencies here since that can lead to an
 *              unexpected/unnecessary size increase of the *built* files.
 */

import type { Ratio, TupleOf } from "@fe-lib/alias.ts";
import type { red_t, rgb_t } from "@fe-lib/color/alias.ts";
import "@fe-lib/jslang.ts";
/*80--------------------------------------------------------------------------*/

export type RGB = TupleOf<Ratio, 3>;
export type CMYK = TupleOf<Ratio, 4>;

export type CSTag = "G" | "RGB" | "T" | "CMYK";
// export type ColorConvertersDetail = {
//   [ C in CSTag ]:[ C, ...number[]];
// }

function makeColorComp(n: Ratio) {
  return Math.floor(Math.clamp(0, n, 1) * 255)
    .toString(16)
    .padStart(2, "0");
}

function scaleAndClamp(x: Ratio): red_t {
  return Math.clamp(0, 255 * x, 255);
}

/**
 * PDF specifications section 10.3
 */
export class ColorConverters {
  static CMYK_G([c, y, m, k]: CMYK) {
    return [
      "G",
      1 - Math.min(1, 0.3 * c + 0.59 * m + 0.11 * y + k),
    ] as ["G", Ratio];
  }

  static G_CMYK([g]: [Ratio]) {
    return ["CMYK", 0, 0, 0, 1 - g] as ["CMYK", ...CMYK];
  }

  static G_RGB([g]: [Ratio]) {
    return ["RGB", g, g, g] as ["RGB", ...RGB];
  }

  static G_rgb([g]: [Ratio]) {
    g = scaleAndClamp(g);
    return [g, g, g] as rgb_t;
  }

  static G_HTML([g]: [Ratio]) {
    const G = makeColorComp(g);
    return `#${G}${G}${G}`;
  }

  static RGB_G([r, g, b]: RGB) {
    return ["G", 0.3 * r + 0.59 * g + 0.11 * b] as ["G", Ratio];
  }

  static RGB_rgb(color: RGB) {
    return color.map(scaleAndClamp) as rgb_t;
  }

  static RGB_HTML(color: RGB) {
    return `#${color.map(makeColorComp).join("")}`;
  }

  static T_HTML() {
    return "#00000000";
  }

  static T_rgb() {
    return [];
  }

  static CMYK_RGB([c, y, m, k]: CMYK) {
    return [
      "RGB",
      1 - Math.min(1, c + k),
      1 - Math.min(1, m + k),
      1 - Math.min(1, y + k),
    ] as ["RGB", ...RGB];
  }

  static CMYK_rgb([c, y, m, k]: CMYK) {
    return [
      scaleAndClamp(1 - Math.min(1, c + k)),
      scaleAndClamp(1 - Math.min(1, m + k)),
      scaleAndClamp(1 - Math.min(1, y + k)),
    ] as rgb_t;
  }

  static CMYK_HTML(components: CMYK) {
    const rgb = this.CMYK_RGB(components).slice(1) as RGB;
    return this.RGB_HTML(rgb);
  }

  static RGB_CMYK([r, g, b]: RGB) {
    const c = 1 - r;
    const m = 1 - g;
    const y = 1 - b;
    const k = Math.min(c, m, y);
    return ["CMYK", c, m, y, k] as ["CMYK", ...CMYK];
  }
}
/*80--------------------------------------------------------------------------*/
