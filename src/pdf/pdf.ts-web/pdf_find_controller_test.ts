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

import { assertEquals } from "https://deno.land/std@0.170.0/testing/asserts.ts";
import { describe, it } from "https://deno.land/std@0.170.0/testing/bdd.ts";
import { getDocument, PDFDocumentProxy } from "../pdf.ts-src/pdf.ts";
import { buildGetDocumentParams } from "../pdf.ts-src/shared/test_utils.ts";
import { D_base } from "./app_options.ts";
import { EventBus, EventMap } from "./event_utils.ts";
import {
  type FindCtrlState,
  FindState,
  PDFFindController,
} from "./pdf_find_controller.ts";
import { SimpleLinkService } from "./pdf_link_service.ts";
/*80--------------------------------------------------------------------------*/

const tracemonkeyFileName = "tracemonkey.pdf";
const CMAP_PARAMS = {
  cMapUrl: `${D_base}/res/pdf/pdf.ts-external/bcmaps/`,
  // cMapUrl: isNodeJS ? "./external/bcmaps/" : "../../../external/bcmaps/",
  cMapPacked: true,
};

class MockLinkService extends SimpleLinkService {
  _page = 1;
  override get page() {
    return this._page;
  }
  override set page(value) {
    this._page = value;
  }

  _pdfDocument: PDFDocumentProxy | undefined;
  setDocument(pdfDocument?: PDFDocumentProxy) {
    this._pdfDocument = pdfDocument;
  }
  override get pagesCount() {
    return this._pdfDocument!.numPages;
  }

  constructor() {
    super();
  }
}

async function initPdfFindController(
  filename?: string,
  updateMatchesCountOnProgress = true,
) {
  const loadingTask = getDocument(
    buildGetDocumentParams(filename || tracemonkeyFileName, {
      ...CMAP_PARAMS,
    }),
  );
  const pdfDocument = await loadingTask.promise;

  const eventBus = new EventBus();

  const linkService = new MockLinkService();
  linkService.setDocument(pdfDocument);

  const pdfFindController = new PDFFindController({
    linkService,
    eventBus,
    updateMatchesCountOnProgress,
  });
  pdfFindController.setDocument(pdfDocument); // Enable searching.

  return { eventBus, pdfFindController };
}

type TestSearchP_ = {
  eventBus: EventBus;
  pdfFindController: PDFFindController;
  state: Partial<FindCtrlState>;
  matchesPerPage: number[];
  selectedMatch: {
    pageIndex: number;
    matchIndex: number;
  };
  pageMatches?: number[][];
  pageMatchesLength?: number[][];
  updateFindMatchesCount?: number[];
  updateFindControlState?: number[];
};

function testSearch({
  eventBus,
  pdfFindController,
  state,
  matchesPerPage,
  selectedMatch,
  pageMatches,
  pageMatchesLength,
  updateFindMatchesCount,
  updateFindControlState,
}: TestSearchP_) {
  return new Promise<void>(function (this: any, resolve) {
    const eventState: EventMap["find"] = Object.assign(
      Object.create(null),
      {
        source: this,
        type: "",
        query: undefined,
        caseSensitive: false,
        entireWord: false,
        phraseSearch: true,
        findPrevious: false,
        matchDiacritics: false,
      },
      state,
    );
    eventBus.dispatch("find", eventState);

    // The `updatefindmatchescount` event is only emitted if the page contains
    // at least one match for the query, so the last non-zero item in the
    // matches per page array corresponds to the page for which the final
    // `updatefindmatchescount` event is emitted. If this happens, we know
    // that any subsequent pages won't trigger the event anymore and we
    // can start comparing the matches per page. This logic is necessary
    // because we call the `pdfFindController.pageMatches` getter directly
    // after receiving the event and the underlying `_pageMatches` array
    // is only extended when a page is processed, so it will only contain
    // entries for the pages processed until the time when the final event
    // was emitted.
    let totalPages = matchesPerPage.length;
    for (let i = totalPages; i--;) {
      if (matchesPerPage[i] > 0) {
        totalPages = i + 1;
        break;
      }
    }

    const totalMatches = matchesPerPage.reduce((a, b) => a + b);

    if (updateFindControlState) {
      eventBus.on(
        "updatefindcontrolstate",
        () => {
          updateFindControlState[0] += 1;
        },
      );
    }

    eventBus.on(
      "updatefindmatchescount",
      function onUpdateFindMatchesCount(
        evt: EventMap["updatefindmatchescount"],
      ) {
        if (updateFindMatchesCount) {
          updateFindMatchesCount[0] += 1;
        }
        if (pdfFindController.pageMatches.length !== totalPages) {
          return;
        }
        eventBus.off("updatefindmatchescount", onUpdateFindMatchesCount);

        assertEquals(evt.matchesCount.total, totalMatches);
        for (let i = 0; i < totalPages; i++) {
          assertEquals(
            pdfFindController.pageMatches[i].length,
            matchesPerPage[i],
          );
        }
        assertEquals(
          pdfFindController.selected.pageIdx,
          selectedMatch.pageIndex,
        );
        assertEquals(
          pdfFindController.selected.matchIdx,
          selectedMatch.matchIndex,
        );

        if (pageMatches) {
          assertEquals(pdfFindController.pageMatches, pageMatches);
          assertEquals(pdfFindController.pageMatchesLength, pageMatchesLength);
        }

        resolve();
      },
    );
  });
}

type TestEmptySearchP_ = {
  eventBus: EventBus;
  pdfFindController: PDFFindController;
  state: {
    query: string;
  };
};

function testEmptySearch(
  { eventBus, pdfFindController, state }: TestEmptySearchP_,
) {
  return new Promise<void>(function (this: any, resolve) {
    const eventState = Object.assign(
      Object.create(null),
      {
        source: this,
        type: "",
        query: undefined,
        caseSensitive: false,
        entireWord: false,
        phraseSearch: true,
        findPrevious: false,
        matchDiacritics: false,
      },
      state,
    );
    eventBus.dispatch("find", eventState);

    eventBus.on(
      "updatefindcontrolstate",
      function onUpdatefindcontrolstate(evt) {
        if (evt.state !== FindState.NOT_FOUND) {
          return;
        }
        eventBus.off("updatefindcontrolstate", onUpdatefindcontrolstate);
        assertEquals(evt.matchesCount.total, 0);
        resolve();
      },
    );
  });
}

describe("pdf_find_controller", () => {
  it("performs a normal search", async () => {
    const { eventBus, pdfFindController } = await initPdfFindController();
    const updateFindMatchesCount = [0];

    await testSearch({
      eventBus,
      pdfFindController,
      state: {
        query: "Dynamic",
      },
      matchesPerPage: [11, 5, 0, 3, 0, 0, 0, 1, 1, 1, 0, 3, 4, 4],
      selectedMatch: {
        pageIndex: 0,
        matchIndex: 0,
      },
      updateFindMatchesCount,
    });

    assertEquals(updateFindMatchesCount[0], 9);
  });

  it("performs a normal search but the total counts is only updated one time", async () => {
    const { eventBus, pdfFindController } = await initPdfFindController(
      undefined,
      false,
    );
    const updateFindMatchesCount = [0];
    const updateFindControlState = [0];

    await testSearch({
      eventBus,
      pdfFindController,
      state: {
        query: "Dynamic",
      },
      matchesPerPage: [11, 5, 0, 3, 0, 0, 0, 1, 1, 1, 0, 3, 4, 4],
      selectedMatch: {
        pageIndex: 0,
        matchIndex: 0,
      },
      updateFindMatchesCount,
      updateFindControlState,
    });

    assertEquals(updateFindMatchesCount[0], 1);
    assertEquals(updateFindControlState[0], 0);
  });

  it("performs a normal search and finds the previous result", async () => {
    // Page 14 (with page index 13) contains five results. By default, the
    // first result (match index 0) is selected, so the previous result
    // should be the fifth result (match index 4).
    const { eventBus, pdfFindController } = await initPdfFindController();

    await testSearch({
      eventBus,
      pdfFindController,
      state: {
        query: "conference",
        findPrevious: true,
      },
      matchesPerPage: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5],
      selectedMatch: {
        pageIndex: 13,
        matchIndex: 4,
      },
    });
  });

  it("performs a case sensitive search", async () => {
    const { eventBus, pdfFindController } = await initPdfFindController();

    await testSearch({
      eventBus,
      pdfFindController,
      state: {
        query: "Dynamic",
        caseSensitive: true,
      },
      matchesPerPage: [3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 3],
      selectedMatch: {
        pageIndex: 0,
        matchIndex: 0,
      },
    });
  });

  it("performs an entire word search", async () => {
    // Page 13 contains both 'Government' and 'Governmental', so the latter
    // should not be found with entire word search.
    const { eventBus, pdfFindController } = await initPdfFindController();

    await testSearch({
      eventBus,
      pdfFindController,
      state: {
        query: "Government",
        entireWord: true,
      },
      matchesPerPage: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
      selectedMatch: {
        pageIndex: 12,
        matchIndex: 0,
      },
    });
  });

  it("performs a multiple term (no phrase) search", async () => {
    // Page 9 contains 'alternate' and pages 6 and 9 contain 'solution'.
    // Both should be found for multiple term (no phrase) search.
    const { eventBus, pdfFindController } = await initPdfFindController();

    await testSearch({
      eventBus,
      pdfFindController,
      state: {
        query: "alternate solution",
        phraseSearch: false,
      },
      matchesPerPage: [0, 0, 0, 0, 0, 1, 0, 0, 4, 0, 0, 0, 0, 0],
      selectedMatch: {
        pageIndex: 5,
        matchIndex: 0,
      },
    });
  });

  it("performs a normal search, where the text is normalized", async () => {
    const { eventBus, pdfFindController } = await initPdfFindController(
      "fraction-highlight.pdf",
    );

    await testSearch({
      eventBus,
      pdfFindController,
      state: {
        query: "fraction",
      },
      matchesPerPage: [3],
      selectedMatch: {
        pageIndex: 0,
        matchIndex: 0,
      },
      pageMatches: [[19, 46, 62]],
      pageMatchesLength: [[8, 8, 8]],
    });

    await testSearch({
      eventBus,
      pdfFindController,
      state: {
        query: "1/2",
      },
      matchesPerPage: [2],
      selectedMatch: {
        pageIndex: 0,
        matchIndex: 0,
      },
      pageMatches: [[27, 54]],
      pageMatchesLength: [[1, 1]],
    });

    await testSearch({
      eventBus,
      pdfFindController,
      state: {
        query: "½",
      },
      matchesPerPage: [2],
      selectedMatch: {
        pageIndex: 0,
        matchIndex: 0,
      },
      pageMatches: [[27, 54]],
      pageMatchesLength: [[1, 1]],
    });
  });

  it("performs a normal search, where the text with diacritics is normalized", async () => {
    const { eventBus, pdfFindController } = await initPdfFindController(
      "french_diacritics.pdf",
    );

    await testSearch({
      eventBus,
      pdfFindController,
      state: {
        query: "a",
      },
      matchesPerPage: [6],
      selectedMatch: {
        pageIndex: 0,
        matchIndex: 0,
      },
      pageMatches: [[0, 2, 4, 6, 8, 10]],
      pageMatchesLength: [[1, 1, 1, 1, 1, 1]],
    });

    await testSearch({
      eventBus,
      pdfFindController,
      state: {
        query: "u",
      },
      matchesPerPage: [6],
      selectedMatch: {
        pageIndex: 0,
        matchIndex: 0,
      },
      pageMatches: [[44, 46, 48, 50, 52, 54]],
      pageMatchesLength: [[1, 1, 1, 1, 1, 1]],
    });

    await testSearch({
      eventBus,
      pdfFindController,
      state: {
        query: "ë",
        matchDiacritics: true,
      },
      matchesPerPage: [2],
      selectedMatch: {
        pageIndex: 0,
        matchIndex: 0,
      },
      pageMatches: [[28, 30]],
      pageMatchesLength: [[1, 1]],
    });
  });

  it("performs a search where one of the results contains an hyphen", async () => {
    const { eventBus, pdfFindController } = await initPdfFindController();

    await testSearch({
      eventBus,
      pdfFindController,
      state: {
        query: "optimiz",
      },
      matchesPerPage: [1, 4, 2, 3, 3, 0, 2, 9, 1, 0, 0, 6, 3, 4],
      selectedMatch: {
        pageIndex: 0,
        matchIndex: 0,
      },
    });
  });

  it("performs a search where the result is on two lines", async () => {
    const { eventBus, pdfFindController } = await initPdfFindController();

    await testSearch({
      eventBus,
      pdfFindController,
      state: {
        query: "user experience",
      },
      matchesPerPage: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      selectedMatch: {
        pageIndex: 0,
        matchIndex: 0,
      },
      pageMatches: [[2743]],
      pageMatchesLength: [[14]],
    });
  });

  it("performs a search where the result is on two lines with a punctuation at eol", async () => {
    const { eventBus, pdfFindController } = await initPdfFindController();

    await testSearch({
      eventBus,
      pdfFindController,
      state: {
        query: "version.the",
      },
      matchesPerPage: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      selectedMatch: {
        pageIndex: 1,
        matchIndex: 0,
      },
      pageMatches: [[], [1493]],
      pageMatchesLength: [[], [11]],
    });
  });

  it("performs a search with a minus sign in the query", async () => {
    const { eventBus, pdfFindController } = await initPdfFindController();

    await testSearch({
      eventBus,
      pdfFindController,
      state: {
        query: "trace-based  just-in-time",
      },
      matchesPerPage: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      selectedMatch: {
        pageIndex: 0,
        matchIndex: 0,
      },
      pageMatches: [
        [0],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [2087],
      ],
      pageMatchesLength: [
        [24],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [24],
      ],
    });
  });

  it("performs a search with square brackets in the query", async () => {
    const { eventBus, pdfFindController } = await initPdfFindController();

    await testSearch({
      eventBus,
      pdfFindController,
      state: {
        query: "[Programming Languages]",
      },
      matchesPerPage: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      selectedMatch: {
        pageIndex: 0,
        matchIndex: 0,
      },
      pageMatches: [[1501]],
      pageMatchesLength: [[25]],
    });
  });

  it("performs a search with parenthesis in the query", async () => {
    const { eventBus, pdfFindController } = await initPdfFindController();

    await testSearch({
      eventBus,
      pdfFindController,
      state: {
        query: "\t   (checks)",
      },
      matchesPerPage: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      selectedMatch: {
        pageIndex: 1,
        matchIndex: 0,
      },
      pageMatches: [[], [201]],
      pageMatchesLength: [[], [9]],
    });
  });

  it("performs a search with a final dot in the query", async () => {
    const { eventBus, pdfFindController } = await initPdfFindController();

    // The whitespace after the dot mustn't be matched.
    const query = "complex applications.";

    await testSearch({
      eventBus,
      pdfFindController,
      state: {
        query,
      },
      matchesPerPage: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      selectedMatch: {
        pageIndex: 0,
        matchIndex: 0,
      },
      pageMatches: [[1946]],
      pageMatchesLength: [[21]],
    });
  });

  it("performs a search with a dot in the query and a missing whitespace", async () => {
    const { eventBus, pdfFindController } = await initPdfFindController();

    // The whitespace after the dot must be matched.
    const query = "complex applications.J";

    await testSearch({
      eventBus,
      pdfFindController,
      state: {
        query,
      },
      matchesPerPage: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      selectedMatch: {
        pageIndex: 0,
        matchIndex: 0,
      },
      pageMatches: [[1946]],
      pageMatchesLength: [[23]],
    });
  });

  it("performs a search with a dot followed by a whitespace in the query", async () => {
    const { eventBus, pdfFindController } = await initPdfFindController();
    const query = "complex applications. j";

    await testSearch({
      eventBus,
      pdfFindController,
      state: {
        query,
      },
      matchesPerPage: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      selectedMatch: {
        pageIndex: 0,
        matchIndex: 0,
      },
      pageMatches: [[1946]],
      pageMatchesLength: [[23]],
    });
  });

  //kkkk
  it.ignore("performs a search in a text containing diacritics before -\\n", async () => {
    // if (isNodeJS) {
    //   pending("Linked test-cases are not supported in Node.js.");
    // }

    const { eventBus, pdfFindController } = await initPdfFindController(
      "issue14562.pdf",
    );

    await testSearch({
      eventBus,
      pdfFindController,
      state: {
        query: "ä",
        matchDiacritics: true,
      },
      matchesPerPage: [80],
      selectedMatch: {
        pageIndex: 0,
        matchIndex: 0,
      },
      // deno-fmt-ignore
      pageMatches: [
        [
          302, 340, 418, 481, 628, 802, 983, 989, 1015, 1063, 1084, 1149, 1157,
          1278, 1346, 1394, 1402, 1424, 1500, 1524, 1530, 1686, 1776, 1788,
          1859, 1881, 1911, 1948, 2066, 2076, 2163, 2180, 2215, 2229, 2274,
          2324, 2360, 2402, 2413, 2424, 2463, 2532, 2538, 2553, 2562, 2576,
          2602, 2613, 2638, 2668, 2792, 2805, 2836, 2847, 2858, 2895, 2901,
          2915, 2939, 2959, 3089, 3236, 3246, 3336, 3384, 3391, 3465, 3474,
          3482, 3499, 3687, 3693, 3708, 3755, 3786, 3862, 3974, 4049, 4055,
          4068,
        ],
      ],
      // deno-fmt-ignore
      pageMatchesLength: [
        [
          1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
          1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
          1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
          1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        ],
      ],
    });
  });

  it("performs a search in a text containing some Hangul syllables", async () => {
    const { eventBus, pdfFindController } = await initPdfFindController(
      "bug1771477.pdf",
    );

    await testSearch({
      eventBus,
      pdfFindController,
      state: {
        query: "안녕하세요 세계",
      },
      matchesPerPage: [1],
      selectedMatch: {
        pageIndex: 0,
        matchIndex: 0,
      },
      pageMatches: [[139]],
      pageMatchesLength: [[8]],
    });
  });

  it("performs a search in a text containing an ideographic at the end of a line", async () => {
    const { eventBus, pdfFindController } = await initPdfFindController(
      "issue15340.pdf",
    );

    await testSearch({
      eventBus,
      pdfFindController,
      state: {
        query: "検知機構",
      },
      matchesPerPage: [1],
      selectedMatch: {
        pageIndex: 0,
        matchIndex: 0,
      },
      pageMatches: [[29]],
      pageMatchesLength: [[4]],
    });
  });

  it("performs a search in a text containing fullwidth chars", async () => {
    const { eventBus, pdfFindController } = await initPdfFindController(
      "issue15690.pdf",
    );

    await testSearch({
      eventBus,
      pdfFindController,
      state: {
        query: "o",
      },
      matchesPerPage: [13],
      selectedMatch: {
        pageIndex: 0,
        matchIndex: 0,
      },
      pageMatches: [[0, 10, 13, 30, 39, 41, 55, 60, 66, 84, 102, 117, 134]],
      pageMatchesLength: [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]],
    });
  });

  it("performs a search in a text with some Katakana at the end of a line", async () => {
    const { eventBus, pdfFindController } = await initPdfFindController(
      "issue15759.pdf",
    );

    await testSearch({
      eventBus,
      pdfFindController,
      state: {
        query: "ソレノイド",
      },
      matchesPerPage: [1],
      selectedMatch: {
        pageIndex: 0,
        matchIndex: 0,
      },
      pageMatches: [[6]],
      pageMatchesLength: [[5]],
    });
  });

  it("performs a search with a single diacritic", async function () {
    const { eventBus, pdfFindController } = await initPdfFindController();

    await testEmptySearch({
      eventBus,
      pdfFindController,
      state: {
        query: "\u064E",
      },
    });
  });
});
/*80--------------------------------------------------------------------------*/
