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

import { assertEquals } from "https://deno.land/std@0.170.0/testing/asserts.ts";
import { describe, it } from "https://deno.land/std@0.170.0/testing/bdd.ts";
import { bidi } from "./bidi.ts";
/*80--------------------------------------------------------------------------*/

describe("bidi");
{
  it(
    "should mark text as LTR if there's only LTR-characters, " +
      "when the string is very short",
    () => {
      const str = "foo";
      const bidiText = bidi(str, -1, false);

      assertEquals(bidiText.str, "foo");
      assertEquals(bidiText.dir, "ltr");
    },
  );

  it("should mark text as LTR if there's only LTR-characters", () => {
    const str = "Lorem ipsum dolor sit amet, consectetur adipisicing elit.";
    const bidiText = bidi(str, -1, false);

    assertEquals(
      bidiText.str,
      "Lorem ipsum dolor sit amet, consectetur adipisicing elit.",
    );
    assertEquals(bidiText.dir, "ltr");
  });

  it("should mark text as RTL if more than 30% of text is RTL", () => {
    // 33% of test text are RTL characters
    const test = "\u0645\u0635\u0631 Egypt";
    const result = "Egypt \u0631\u0635\u0645"; // "Egypt رصم"
    const bidiText = bidi(test, -1, false);

    assertEquals(bidiText.str, result);
    assertEquals(bidiText.dir, "rtl");
  });

  it("should mark text as LTR if less than 30% of text is RTL", () => {
    const test = "Egypt is known as \u0645\u0635\u0631 in Arabic.";
    const result = "Egypt is known as \u0631\u0635\u0645 in Arabic.";
    const bidiText = bidi(test, -1, false);

    assertEquals(bidiText.str, result);
    assertEquals(bidiText.dir, "ltr");
  });

  it(
    "should mark text as RTL if less than 30% of text is RTL, " +
      "when the string is very short (issue 11656)",
    () => {
      const str = "()\u05d1("; // 25% of the string is RTL characters.
      const bidiText = bidi(str, -1, false);

      assertEquals(bidiText.str, "(\u05d1)(");
      assertEquals(bidiText.dir, "rtl");
    },
  );
}
/*80--------------------------------------------------------------------------*/
