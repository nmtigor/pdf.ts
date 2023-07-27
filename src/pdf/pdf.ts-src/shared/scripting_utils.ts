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

import { type TupleOf } from "../../../lib/alias.ts";
/*80--------------------------------------------------------------------------*/

function makeColorComp(n: number) {
  return Math.floor(Math.max(0, Math.min(1, n)) * 255)
    .toString(16)
    .padStart(2, "0");
}

export type RGB = TupleOf<number, 3>;
export type XYZ = TupleOf<number, 3>;
export type CMYK = TupleOf<number, 4>;

export type CSTag = "G" | "RGB" | "T" | "CMYK";
// export type ColorConvertersDetail = {
//   [ C in CSTag ]:[ C, ...number[]];
// }
export type ColorConvertersDetail = Record<string, [CSTag, ...number[]]>;

/**
 * PDF specifications section 10.3
 */
export namespace ColorConverters {
  export function CMYK_G([c, y, m, k]: CMYK) {
    return <["G", number]> [
      "G",
      1 - Math.min(1, 0.3 * c + 0.59 * m + 0.11 * y + k),
    ];
  }

  export function G_CMYK([g]: [number]) {
    return <["CMYK", ...CMYK]> ["CMYK", 0, 0, 0, 1 - g];
  }

  export function G_RGB([g]: [number]) {
    return <["RGB", ...RGB]> ["RGB", g, g, g];
  }

  export function G_HTML([g]: [number]) {
    const G = makeColorComp(g);
    return `#${G}${G}${G}`;
  }

  export function RGB_G([r, g, b]: RGB) {
    return <["G", number]> ["G", 0.3 * r + 0.59 * g + 0.11 * b];
  }

  export function RGB_HTML([r, g, b]: RGB) {
    const R = makeColorComp(r);
    const G = makeColorComp(g);
    const B = makeColorComp(b);
    return `#${R}${G}${B}`;
  }

  export function T_HTML() {
    return "#00000000";
  }

  export function CMYK_RGB([c, y, m, k]: CMYK) {
    return <["RGB", ...RGB]> [
      "RGB",
      1 - Math.min(1, c + k),
      1 - Math.min(1, m + k),
      1 - Math.min(1, y + k),
    ];
  }

  export function CMYK_HTML(components: CMYK) {
    const rgb = <RGB> CMYK_RGB(components).slice(1);
    return RGB_HTML(rgb);
  }

  export function RGB_CMYK([r, g, b]: RGB) {
    const c = 1 - r;
    const m = 1 - g;
    const y = 1 - b;
    const k = Math.min(c, m, y);
    return <["CMYK", ...CMYK]> ["CMYK", c, m, y, k];
  }
}
/*80--------------------------------------------------------------------------*/
