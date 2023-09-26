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

import { assertEquals } from "@std/testing/asserts.ts";
import { describe, it } from "@std/testing/bdd.ts";
import { type dot2d_t } from "../../lib/alias.ts";
import { type IVisibleView } from "./interfaces.ts";
import {
  backtrackBeforeAllVisibleElements,
  binarySearchFirstItem,
  getPageSizeInches,
  getVisibleElements,
  isPortraitOrientation,
  isValidRotation,
  parseQueryString,
  removeNullCharacters,
  type VisibleElement,
  type VisibleElements,
} from "./ui_utils.ts";
/*80--------------------------------------------------------------------------*/

describe("ui_utils", () => {
  describe("binary search", () => {
    function isTrue(boolean: boolean) {
      return boolean;
    }
    function isGreater3(number: number) {
      return number > 3;
    }

    it("empty array", () => {
      assertEquals(binarySearchFirstItem([], isTrue), 0);
    });
    it("single boolean entry", () => {
      assertEquals(binarySearchFirstItem([false], isTrue), 1);
      assertEquals(binarySearchFirstItem([true], isTrue), 0);
    });
    it("three boolean entries", () => {
      assertEquals(binarySearchFirstItem([true, true, true], isTrue), 0);
      assertEquals(binarySearchFirstItem([false, true, true], isTrue), 1);
      assertEquals(binarySearchFirstItem([false, false, true], isTrue), 2);
      assertEquals(binarySearchFirstItem([false, false, false], isTrue), 3);
    });
    it("three numeric entries", () => {
      assertEquals(binarySearchFirstItem([0, 1, 2], isGreater3), 3);
      assertEquals(binarySearchFirstItem([2, 3, 4], isGreater3), 2);
      assertEquals(binarySearchFirstItem([4, 5, 6], isGreater3), 0);
    });
    it("three numeric entries and a start index", () => {
      assertEquals(binarySearchFirstItem([0, 1, 2, 3, 4], isGreater3, 2), 4);
      assertEquals(binarySearchFirstItem([2, 3, 4], isGreater3, 2), 2);
      assertEquals(binarySearchFirstItem([4, 5, 6], isGreater3, 1), 1);
    });
  });

  describe("isValidRotation", () => {
    it("should reject non-integer angles", () => {
      assertEquals((isValidRotation as any)(), false);
      assertEquals(isValidRotation(null), false);
      assertEquals(isValidRotation(NaN), false);
      assertEquals(isValidRotation([90]), false);
      assertEquals(isValidRotation("90"), false);
      assertEquals(isValidRotation(90.5), false);
    });

    it("should reject non-multiple of 90 degree angles", () => {
      assertEquals(isValidRotation(45), false);
      assertEquals(isValidRotation(-123), false);
    });

    it("should accept valid angles", () => {
      assertEquals(isValidRotation(0), true);
      assertEquals(isValidRotation(90), true);
      assertEquals(isValidRotation(-270), true);
      assertEquals(isValidRotation(540), true);
    });
  });

  describe("isPortraitOrientation", () => {
    it("should be portrait orientation", () => {
      assertEquals(
        isPortraitOrientation({
          width: 200,
          height: 400,
        }),
        true,
      );

      assertEquals(
        isPortraitOrientation({
          width: 500,
          height: 500,
        }),
        true,
      );
    });

    it("should be landscape orientation", () => {
      assertEquals(
        isPortraitOrientation({
          width: 600,
          height: 300,
        }),
        false,
      );
    });
  });

  describe("parseQueryString", () => {
    it("should parse one key/value pair", () => {
      const parameters = parseQueryString("key1=value1");
      assertEquals(parameters.size, 1);
      assertEquals(parameters.get("key1"), "value1");
    });

    it("should parse multiple key/value pairs", () => {
      const parameters = parseQueryString(
        "key1=value1&key2=value2&key3=value3",
      );
      assertEquals(parameters.size, 3);
      assertEquals(parameters.get("key1"), "value1");
      assertEquals(parameters.get("key2"), "value2");
      assertEquals(parameters.get("key3"), "value3");
    });

    it("should parse keys without values", () => {
      const parameters = parseQueryString("key1");
      assertEquals(parameters.size, 1);
      assertEquals(parameters.get("key1"), "");
    });

    it("should decode encoded key/value pairs", () => {
      const parameters = parseQueryString("k%C3%ABy1=valu%C3%AB1");
      assertEquals(parameters.size, 1);
      assertEquals(parameters.get("këy1"), "valuë1");
    });

    it("should convert keys to lowercase", () => {
      const parameters = parseQueryString("Key1=Value1&KEY2=Value2");
      assertEquals(parameters.size, 2);
      assertEquals(parameters.get("key1"), "Value1");
      assertEquals(parameters.get("key2"), "Value2");
    });
  });

  describe("removeNullCharacters", () => {
    it("should not modify string without null characters", () => {
      const str = "string without null chars";
      assertEquals(removeNullCharacters(str), "string without null chars");
    });

    it("should modify string with null characters", () => {
      const str = "string\x00With\x00Null\x00Chars";
      assertEquals(removeNullCharacters(str), "stringWithNullChars");
    });

    it("should modify string with non-displayable characters", () => {
      const str = Array.from(
        Array(32).keys(),
        (x) => String.fromCharCode(x) + "a",
      ).join("");
      // \x00 is replaced by an empty string.
      const expected =
        "a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a";
      assertEquals(
        removeNullCharacters(str, /* replaceInvisible */ true),
        expected,
      );
    });
  });

  describe("getPageSizeInches", () => {
    it("gets page size (in inches)", () => {
      const page = {
        view: [0, 0, 595.28, 841.89],
        userUnit: 1.0,
        rotate: 0,
      };
      const { width, height } = getPageSizeInches(page);

      assertEquals(+width.toPrecision(3), 8.27);
      assertEquals(+height.toPrecision(4), 11.69);
    });

    it("gets page size (in inches), for non-default /Rotate entry", () => {
      const pdfPage1 = { view: [0, 0, 612, 792], userUnit: 1, rotate: 0 };
      const { width: width1, height: height1 } = getPageSizeInches(pdfPage1);

      assertEquals(width1, 8.5);
      assertEquals(height1, 11);

      const pdfPage2 = { view: [0, 0, 612, 792], userUnit: 1, rotate: 90 };
      const { width: width2, height: height2 } = getPageSizeInches(pdfPage2);

      assertEquals(width2, 11);
      assertEquals(height2, 8.5);
    });
  });

  describe("getVisibleElements", () => {
    // These values are based on margin/border values in the CSS, but there
    // isn't any real need for them to be; they just need to take *some* value.
    const BORDER_WIDTH = 9;
    const SPACING = 2 * BORDER_WIDTH - 7;

    // This is a helper function for assembling an array of view stubs from an
    // array of arrays of [width, height] pairs, which represents wrapped lines
    // of pages. It uses the above constants to add realistic spacing between
    // the pages and the lines.
    //
    // If you're reading a test that calls makePages, you should think of the
    // inputs to makePages as boxes with no borders, being laid out in a
    // container that has no margins, so that the top of the tallest page in
    // the first row will be at y = 0, and the left of the first page in
    // the first row will be at x = 0. The spacing between pages in a row, and
    // the spacing between rows, is SPACING. If you wanted to construct an
    // actual HTML document with the same layout, you should give each page
    // element a margin-right and margin-bottom of SPACING, and add no other
    // margins, borders, or padding.
    //
    // If you're reading makePages itself, you'll see a somewhat more
    // complicated picture because this suite of tests is exercising
    // getVisibleElements' ability to account for the borders that real page
    // elements have. makePages tests this by subtracting a BORDER_WIDTH from
    // offsetLeft/Top and adding it to clientLeft/Top. So the element stubs that
    // getVisibleElements sees may, for example, actually have an offsetTop of
    // -9. If everything is working correctly, this detail won't leak out into
    // the tests themselves, and so the tests shouldn't use the value of
    // BORDER_WIDTH at all.
    function makePages(lines: dot2d_t[][]): IVisibleView[] {
      const result = [];
      let lineTop = 0,
        id = 0;
      for (const line of lines) {
        const lineHeight = line.reduce(
          (maxHeight, pair) => Math.max(maxHeight, pair[1]),
          0,
        );
        let offsetLeft = -BORDER_WIDTH;
        for (const [clientWidth, clientHeight] of line) {
          const offsetTop = lineTop + (lineHeight - clientHeight) / 2 -
            BORDER_WIDTH;
          const div = {
            offsetLeft,
            offsetTop,
            clientWidth,
            clientHeight,
            clientLeft: BORDER_WIDTH,
            clientTop: BORDER_WIDTH,
          } as HTMLDivElement;
          result.push({ id, div } as IVisibleView);
          ++id;
          offsetLeft += clientWidth + SPACING;
        }
        lineTop += lineHeight + SPACING;
      }
      return result;
    }

    // This is a reimplementation of getVisibleElements without the
    // optimizations.
    function slowGetVisibleElements(
      scroll: HTMLElement,
      pages: IVisibleView[],
    ): VisibleElements {
      const views: VisibleElement[] = [],
        ids = new Set<number>();
      const { scrollLeft, scrollTop } = scroll;
      const scrollRight = scrollLeft + scroll.clientWidth;
      const scrollBottom = scrollTop + scroll.clientHeight;
      for (const view of pages) {
        const { div } = view;
        const viewLeft = div.offsetLeft + div.clientLeft;
        const viewRight = viewLeft + div.clientWidth;
        const viewTop = div.offsetTop + div.clientTop;
        const viewBottom = viewTop + div.clientHeight;

        if (
          viewLeft < scrollRight &&
          viewRight > scrollLeft &&
          viewTop < scrollBottom &&
          viewBottom > scrollTop
        ) {
          const hiddenHeight = Math.max(0, scrollTop - viewTop) +
            Math.max(0, viewBottom - scrollBottom);
          const hiddenWidth = Math.max(0, scrollLeft - viewLeft) +
            Math.max(0, viewRight - scrollRight);

          const fractionHeight = (div.clientHeight - hiddenHeight) /
            div.clientHeight;
          const fractionWidth = (div.clientWidth - hiddenWidth) /
            div.clientWidth;
          const percent = (fractionHeight * fractionWidth * 100) | 0;

          views.push({
            id: view.id,
            x: viewLeft,
            y: viewTop,
            view,
            percent,
            widthPercent: (fractionWidth * 100) | 0,
          });
          ids.add(view.id);
        }
      }
      return {
        first: views[0],
        last: views.at(-1),
        views,
        ids,
      } as VisibleElements;
    }

    // This function takes a fixed layout of pages and compares the system under
    // test to the slower implementation above, for a range of scroll viewport
    // sizes and positions.
    function scrollOverDocument(
      pages: IVisibleView[],
      horizontal = false,
      rtl = false,
    ) {
      const size = pages.reduce(function (max, { div }) {
        return Math.max(
          max,
          horizontal
            ? Math.abs(div.offsetLeft + div.clientLeft + div.clientWidth)
            : div.offsetTop + div.clientTop + div.clientHeight,
        );
      }, 0);
      // The numbers (7 and 5) are mostly arbitrary, not magic: increase them to
      // make scrollOverDocument tests faster, decrease them to make the tests
      // more scrupulous, and keep them coprime to reduce the chance of missing
      // weird edge case bugs.
      for (let i = -size; i < size; i += 7) {
        // The screen height (or width) here (j - i) doubles on each inner loop
        // iteration; again, this is just to test an interesting range of cases
        // without slowing the tests down to check every possible case.
        for (let j = i + 5; j < size; j += j - i) {
          const scrollEl = horizontal
            ? {
              scrollTop: 0,
              scrollLeft: i,
              clientHeight: 10000,
              clientWidth: j - i,
            } as HTMLElement
            : {
              scrollTop: i,
              scrollLeft: 0,
              clientHeight: j - i,
              clientWidth: 10000,
            } as HTMLElement;
          assertEquals(
            getVisibleElements({
              scrollEl,
              views: pages,
              sortByVisibility: false,
              horizontal,
              rtl,
            }),
            slowGetVisibleElements(scrollEl, pages),
          );
        }
      }
    }

    it("with pages of varying height", () => {
      const pages = makePages([
        [
          [50, 20],
          [20, 50],
        ],
        [
          [30, 12],
          [12, 30],
        ],
        [
          [20, 50],
          [50, 20],
        ],
        [
          [50, 20],
          [20, 50],
        ],
      ]);
      scrollOverDocument(pages);
    });

    it("widescreen challenge", () => {
      const pages = makePages([
        [
          [10, 50],
          [10, 60],
          [10, 70],
          [10, 80],
          [10, 90],
        ],
        [
          [10, 90],
          [10, 80],
          [10, 70],
          [10, 60],
          [10, 50],
        ],
        [
          [10, 50],
          [10, 60],
          [10, 70],
          [10, 80],
          [10, 90],
        ],
      ]);
      scrollOverDocument(pages);
    });

    it("works with horizontal scrolling", () => {
      const pages = makePages([
        [
          [10, 50],
          [20, 20],
          [30, 10],
        ],
      ]);
      scrollOverDocument(pages, /* horizontal = */ true);
    });

    it("works with horizontal scrolling with RTL-documents", () => {
      const pages = makePages([
        [
          [-10, 50],
          [-20, 20],
          [-30, 10],
        ],
      ]);
      scrollOverDocument(pages, /* horizontal = */ true, /* rtl = */ true);
    });

    it("handles `sortByVisibility` correctly", () => {
      const scrollEl = {
        scrollTop: 75,
        scrollLeft: 0,
        clientHeight: 750,
        clientWidth: 1500,
      } as HTMLElement;
      const views = makePages([[[100, 150]], [[100, 150]], [[100, 150]]]);

      const visible = getVisibleElements({ scrollEl, views });
      const visibleSorted = getVisibleElements({
        scrollEl,
        views,
        sortByVisibility: true,
      });

      const viewsOrder = [],
        viewsSortedOrder = [];
      for (const view of visible.views) {
        viewsOrder.push(view.id);
      }
      for (const view of visibleSorted.views) {
        viewsSortedOrder.push(view.id);
      }
      assertEquals(viewsOrder, [0, 1, 2]);
      assertEquals(viewsSortedOrder, [1, 2, 0]);
    });

    it("handles views being empty", () => {
      const scrollEl = {
        scrollTop: 10,
        scrollLeft: 0,
        clientHeight: 750,
        clientWidth: 1500,
      } as HTMLElement;
      const views: IVisibleView[] = [];

      assertEquals(getVisibleElements({ scrollEl, views }), {
        first: undefined,
        last: undefined,
        views: [],
        ids: new Set(),
      } as any);
    });

    it("handles all views being hidden (without errors)", () => {
      const scrollEl = {
        scrollTop: 100000,
        scrollLeft: 0,
        clientHeight: 750,
        clientWidth: 1500,
      } as HTMLElement;
      const views = makePages([[[100, 150]], [[100, 150]], [[100, 150]]]);

      assertEquals(getVisibleElements({ scrollEl, views }), {
        first: undefined,
        last: undefined,
        views: [],
        ids: new Set(),
      } as any);
    });

    // This sub-suite is for a notionally internal helper function for
    // getVisibleElements.
    describe("backtrackBeforeAllVisibleElements", () => {
      // Layout elements common to all tests
      const tallPage: dot2d_t = [10, 50];
      const shortPage: dot2d_t = [10, 10];

      // A scroll position that ensures that only the tall pages in the second
      // row are visible
      const top1 = 20 +
        SPACING + // height of the first row
        40; // a value between 30 (so the short pages on the second row are
      // hidden) and 50 (so the tall pages are visible)

      // A scroll position that ensures that all of the pages in the second row
      // are visible, but the tall ones are a tiny bit cut off
      const top2 = 20 +
        SPACING + // height of the first row
        10; // a value greater than 0 but less than 30

      // These tests refer to cases enumerated in the comments of
      // backtrackBeforeAllVisibleElements.
      it("handles case 1", () => {
        const pages = makePages([
          [
            [10, 20],
            [10, 20],
            [10, 20],
            [10, 20],
          ],
          [tallPage, shortPage, tallPage, shortPage],
          [
            [10, 50],
            [10, 50],
            [10, 50],
            [10, 50],
          ],
          [
            [10, 20],
            [10, 20],
            [10, 20],
            [10, 20],
          ],
          [[10, 20]],
        ]);
        // binary search would land on the second row, first page
        const bsResult = 4;
        assertEquals(
          backtrackBeforeAllVisibleElements(bsResult, pages, top1),
          4,
        );
      });

      it("handles case 2", () => {
        const pages = makePages([
          [
            [10, 20],
            [10, 20],
            [10, 20],
            [10, 20],
          ],
          [tallPage, shortPage, tallPage, tallPage],
          [
            [10, 50],
            [10, 50],
            [10, 50],
            [10, 50],
          ],
          [
            [10, 20],
            [10, 20],
            [10, 20],
            [10, 20],
          ],
        ]);
        // binary search would land on the second row, third page
        const bsResult = 6;
        assertEquals(
          backtrackBeforeAllVisibleElements(bsResult, pages, top1),
          4,
        );
      });

      it("handles case 3", () => {
        const pages = makePages([
          [
            [10, 20],
            [10, 20],
            [10, 20],
            [10, 20],
          ],
          [tallPage, shortPage, tallPage, shortPage],
          [
            [10, 50],
            [10, 50],
            [10, 50],
            [10, 50],
          ],
          [
            [10, 20],
            [10, 20],
            [10, 20],
            [10, 20],
          ],
        ]);
        // binary search would land on the third row, first page
        const bsResult = 8;
        assertEquals(
          backtrackBeforeAllVisibleElements(bsResult, pages, top1),
          4,
        );
      });

      it("handles case 4", () => {
        const pages = makePages([
          [
            [10, 20],
            [10, 20],
            [10, 20],
            [10, 20],
          ],
          [tallPage, shortPage, tallPage, shortPage],
          [
            [10, 50],
            [10, 50],
            [10, 50],
            [10, 50],
          ],
          [
            [10, 20],
            [10, 20],
            [10, 20],
            [10, 20],
          ],
        ]);
        // binary search would land on the second row, first page
        const bsResult = 4;
        assertEquals(
          backtrackBeforeAllVisibleElements(bsResult, pages, top2),
          4,
        );
      });
    });
  });
});
/*80--------------------------------------------------------------------------*/
