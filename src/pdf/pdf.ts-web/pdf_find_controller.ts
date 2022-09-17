/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

/* Copyright 2012 Mozilla Foundation
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

/** @typedef {import("../src/display/api").PDFDocumentProxy} PDFDocumentProxy */
/** @typedef {import("./event_utils").EventBus} EventBus */
/** @typedef {import("./interfaces").IPDFLinkService} IPDFLinkService */

import { createPromiseCap, PromiseCap } from "../../lib/promisecap.ts";
import {
  binarySearchFirstItem,
  PDFDocumentProxy,
  point_t,
  TextItem,
} from "../pdf.ts-src/pdf.ts";
import { EventBus } from "./event_utils.ts";
import { type IPDFLinkService } from "./interfaces.ts";
import { getCharacterType } from "./pdf_find_utils.ts";
import { scrollIntoView } from "./ui_utils.ts";
/*80--------------------------------------------------------------------------*/

export const enum FindState {
  FOUND = 0,
  NOT_FOUND = 1,
  WRAPPED = 2,
  PENDING = 3,
}

const FIND_TIMEOUT = 250; // ms
const MATCH_SCROLL_OFFSET_TOP = -50; // px
const MATCH_SCROLL_OFFSET_LEFT = -400; // px

const CHARACTERS_TO_NORMALIZE = {
  "\u2010": "-", // Hyphen
  "\u2018": "'", // Left single quotation mark
  "\u2019": "'", // Right single quotation mark
  "\u201A": "'", // Single low-9 quotation mark
  "\u201B": "'", // Single high-reversed-9 quotation mark
  "\u201C": '"', // Left double quotation mark
  "\u201D": '"', // Right double quotation mark
  "\u201E": '"', // Double low-9 quotation mark
  "\u201F": '"', // Double high-reversed-9 quotation mark
  "\u00BC": "1/4", // Vulgar fraction one quarter
  "\u00BD": "1/2", // Vulgar fraction one half
  "\u00BE": "3/4", // Vulgar fraction three quarters
};
type ToNormalizeCharacters = keyof typeof CHARACTERS_TO_NORMALIZE;

// These diacritics aren't considered as combining diacritics
// when searching in a document:
//   https://searchfox.org/mozilla-central/source/intl/unicharutil/util/is_combining_diacritic.py.
// The combining class definitions can be found:
//   https://www.unicode.org/reports/tr44/#Canonical_Combining_Class_Values
// Category 0 corresponds to [^\p{Mn}].
const DIACRITICS_EXCEPTION = new Set([
  // UNICODE_COMBINING_CLASS_KANA_VOICING
  // https://www.compart.com/fr/unicode/combining/8
  0x3099,
  0x309a,
  // UNICODE_COMBINING_CLASS_VIRAMA (under 0xFFFF)
  // https://www.compart.com/fr/unicode/combining/9
  0x094d,
  0x09cd,
  0x0a4d,
  0x0acd,
  0x0b4d,
  0x0bcd,
  0x0c4d,
  0x0ccd,
  0x0d3b,
  0x0d3c,
  0x0d4d,
  0x0dca,
  0x0e3a,
  0x0eba,
  0x0f84,
  0x1039,
  0x103a,
  0x1714,
  0x1734,
  0x17d2,
  0x1a60,
  0x1b44,
  0x1baa,
  0x1bab,
  0x1bf2,
  0x1bf3,
  0x2d7f,
  0xa806,
  0xa82c,
  0xa8c4,
  0xa953,
  0xa9c0,
  0xaaf6,
  0xabed,
  // 91
  // https://www.compart.com/fr/unicode/combining/91
  0x0c56,
  // 129
  // https://www.compart.com/fr/unicode/combining/129
  0x0f71,
  // 130
  // https://www.compart.com/fr/unicode/combining/130
  0x0f72,
  0x0f7a,
  0x0f7b,
  0x0f7c,
  0x0f7d,
  0x0f80,
  // 132
  // https://www.compart.com/fr/unicode/combining/132
  0x0f74,
]);
const DIACRITICS_EXCEPTION_STR = [...DIACRITICS_EXCEPTION.values()]
  .map((x) => String.fromCharCode(x))
  .join("");

const DIACRITICS_REG_EXP = /\p{M}+/gu;
const SPECIAL_CHARS_REG_EXP =
  /([.*+?^${}()|[\]\\])|(\p{P})|(\s+)|(\p{M})|(\p{L})/gu;
const NOT_DIACRITIC_FROM_END_REG_EXP = /([^\p{M}])\p{M}*$/u;
const NOT_DIACRITIC_FROM_START_REG_EXP = /^\p{M}*([^\p{M}])/u;

// The range [AC00-D7AF] corresponds to the Hangul syllables.
// The few other chars are some CJK Compatibility Ideographs.
const SYLLABLES_REG_EXP = /[\uAC00-\uD7AF\uFA6C\uFACF-\uFAD1\uFAD5-\uFAD7]+/g;
const SYLLABLES_LENGTHS = new Map();
// When decomposed (in using NFD) the above syllables will start
// with one of the chars in this regexp.
const FIRST_CHAR_SYLLABLES_REG_EXP =
  "[\\u1100-\\u1112\\ud7a4-\\ud7af\\ud84a\\ud84c\\ud850\\ud854\\ud857\\ud85f]";

let noSyllablesRegExp: RegExp | null = null;
let withSyllablesRegExp: RegExp | null = null;

function normalize(text: string): [string, [number, number][], boolean] {
  // The diacritics in the text or in the query can be composed or not.
  // So we use a decomposed text using NFD (and the same for the query)
  // in order to be sure that diacritics are in the same order.

  // Collect syllables length and positions.
  const syllablePositions: [number, number][] = [];
  let m;
  while ((m = SYLLABLES_REG_EXP.exec(text)) !== null) {
    let { index } = m;
    for (const char of m[0]) {
      let len = SYLLABLES_LENGTHS.get(char);
      if (!len) {
        len = char.normalize("NFD").length;
        SYLLABLES_LENGTHS.set(char, len);
      }
      syllablePositions.push([len, index++]);
    }
  }

  let normalizationRegex;
  if (syllablePositions.length === 0 && noSyllablesRegExp) {
    normalizationRegex = noSyllablesRegExp;
  } else if (syllablePositions.length > 0 && withSyllablesRegExp) {
    normalizationRegex = withSyllablesRegExp;
  } else {
    // Compile the regular expression for text normalization once.
    const replace = Object.keys(CHARACTERS_TO_NORMALIZE).join("");
    const regexp = `([${replace}])|(\\p{M}+(?:-\\n)?)|(\\S-\\n)|(\\n)`;

    if (syllablePositions.length === 0) {
      // Most of the syllables belong to Hangul so there are no need
      // to search for them in a non-Hangul document.
      // We use the \0 in order to have the same number of groups.
      normalizationRegex = noSyllablesRegExp = new RegExp(
        regexp + "|(\\u0000)",
        "gum",
      );
    } else {
      normalizationRegex = withSyllablesRegExp = new RegExp(
        regexp + `|(${FIRST_CHAR_SYLLABLES_REG_EXP})`,
        "gum",
      );
    }
  }

  // The goal of this function is to normalize the string and
  // be able to get from an index in the new string the
  // corresponding index in the old string.
  // For example if we have: abCd12ef456gh where C is replaced by ccc
  // and numbers replaced by nothing (it's the case for diacritics), then
  // we'll obtain the normalized string: abcccdefgh.
  // So here the reverse map is: [0,1,2,2,2,3,6,7,11,12].

  // The goal is to obtain the array: [[0, 0], [3, -1], [4, -2],
  // [6, 0], [8, 3]].
  // which can be used like this:
  //  - let say that i is the index in new string and j the index
  //    the old string.
  //  - if i is in [0; 3[ then j = i + 0
  //  - if i is in [3; 4[ then j = i - 1
  //  - if i is in [4; 6[ then j = i - 2
  //  ...
  // Thanks to a binary search it's easy to know where is i and what's the
  // shift.
  // Let say that the last entry in the array is [x, s] and we have a
  // substitution at index y (old string) which will replace o chars by n chars.
  // Firstly, if o === n, then no need to add a new entry: the shift is
  // the same.
  // Secondly, if o < n, then we push the n - o elements:
  // [y - (s - 1), s - 1], [y - (s - 2), s - 2], ...
  // Thirdly, if o > n, then we push the element: [y - (s - n), o + s - n]

  // Collect diacritics length and positions.
  const rawDiacriticsPositions: point_t[] = [];
  while ((m = DIACRITICS_REG_EXP.exec(text)) !== null) {
    rawDiacriticsPositions.push([m[0].length, m.index]);
  }

  let normalized = text.normalize("NFD");
  const positions: [number, number][] = [[0, 0]];
  let rawDiacriticsIndex = 0;
  let syllableIndex = 0;
  let shift = 0;
  let shiftOrigin = 0;
  let eol = 0;
  let hasDiacritics = false;

  normalized = normalized.replace(
    normalizationRegex,
    (match, p1, p2, p3, p4, p5, i) => {
      i -= shiftOrigin;
      if (p1) {
        // Maybe fractions or quotations mark...
        const replacement =
          CHARACTERS_TO_NORMALIZE[<ToNormalizeCharacters> match];
        const jj = replacement.length;
        for (let j = 1; j < jj; j++) {
          positions.push([i - shift + j, shift - j]);
        }
        shift -= jj - 1;
        return replacement;
      }

      if (p2) {
        const hasTrailingDashEOL = p2.endsWith("\n");
        const len = hasTrailingDashEOL ? p2.length - 2 : p2.length;

        // Diacritics.
        hasDiacritics = true;
        let jj = len;
        if (i + eol === rawDiacriticsPositions[rawDiacriticsIndex]?.[1]) {
          jj -= rawDiacriticsPositions[rawDiacriticsIndex][0];
          ++rawDiacriticsIndex;
        }

        for (let j = 1; j <= jj; j++) {
          // i is the position of the first diacritic
          // so (i - 1) is the position for the letter before.
          positions.push([i - 1 - shift + j, shift - j]);
        }
        shift -= jj;
        shiftOrigin += jj;

        if (hasTrailingDashEOL) {
          // Diacritics are followed by a -\n.
          // See comments in `if (p3)` block.
          i += len - 1;
          positions.push([i - shift + 1, 1 + shift]);
          shift += 1;
          shiftOrigin += 1;
          eol += 1;
          return p2.slice(0, len);
        }

        return p2;
      }

      if (p3) {
        // "X-\n" is removed because an hyphen at the end of a line
        // with not a space before is likely here to mark a break
        // in a word.
        // The \n isn't in the original text so here y = i, n = 1 and o = 2.
        positions.push([i - shift + 1, 1 + shift]);
        shift += 1;
        shiftOrigin += 1;
        eol += 1;
        return p3.charAt(0);
      }

      if (p4) {
        // eol is replaced by space: "foo\nbar" is likely equivalent to
        // "foo bar".
        positions.push([i - shift + 1, shift - 1]);
        shift -= 1;
        shiftOrigin += 1;
        eol += 1;
        return " ";
      }

      // p5
      if (i + eol === syllablePositions[syllableIndex]?.[1]) {
        // A syllable (1 char) is replaced with several chars (n) so
        // newCharsLen = n - 1.
        const newCharLen = syllablePositions[syllableIndex][0] - 1;
        ++syllableIndex;
        for (let j = 1; j <= newCharLen; j++) {
          positions.push([i - (shift - j), shift - j]);
        }
        shift -= newCharLen;
        shiftOrigin += newCharLen;
      }
      return p5;
    },
  );

  positions.push([normalized.length, shift]);

  return [normalized, positions, hasDiacritics];
}

type Diffs = [number, number][];

// Determine the original, non-normalized, match index such that highlighting of
// search results is correct in the `textLayer` for strings containing e.g. "½"
// characters; essentially "inverting" the result of the `normalize` function.
function getOriginalIndex(
  diffs: Diffs | undefined,
  pos: number,
  len: number,
): [number, number] {
  if (!diffs) return [pos, len];

  const start = pos;
  const end = pos + len;
  let i = binarySearchFirstItem(diffs, (x) => x[0] >= start);
  if (diffs[i][0] > start) {
    --i;
  }

  let j = binarySearchFirstItem(diffs, (x) => x[0] >= end, i);
  if (diffs[j][0] > end) {
    --j;
  }

  return [start + diffs[i][1], len + diffs[j][1] - diffs[i][1]];
}

interface PDFFindControllerOptions {
  /**
   * The navigation/linking service.
   */
  linkService: IPDFLinkService;

  /**
   * The application event bus.
   */
  eventBus: EventBus;
}

interface FindCtrlrOffset {
  pageIdx: number | null;
  matchIdx: number | null;
  wrapped: boolean;
}

export type FindType =
  | "again"
  | "casesensitivitychange"
  | "diacriticmatchingchange"
  | "entirewordchange"
  | "findagain"
  | "findhighlightallchange"
  | "highlightallchange";
export type FindCtrlState = {
  type: FindType | "";
  query: string;
  phraseSearch: boolean;
  caseSensitive: boolean;
  entireWord: boolean;
  highlightAll: boolean;
  findPrevious?: boolean | undefined;
  matchDiacritics: boolean;
};

interface MatchWithLength {
  match: number;
  matchLength: number;
  skipped: boolean;
}

export interface MatchesCount {
  current: number;
  total: number;
}

/**
 * Provides search functionality to find a given string in a PDF document.
 */
export class PDFFindController {
  #linkService: IPDFLinkService;
  #eventBus: EventBus;

  #highlightMatches!: boolean;
  get highlightMatches() {
    return this.#highlightMatches;
  }

  _scrollMatches!: boolean;
  _pdfDocument?: PDFDocumentProxy | undefined;

  #pageMatches!: number[][];
  get pageMatches() {
    return this.#pageMatches;
  }

  #pageMatchesLength!: number[][];
  get pageMatchesLength() {
    return this.#pageMatchesLength;
  }

  #selected!: {
    pageIdx: number;
    matchIdx: number;
  };
  get selected() {
    return this.#selected;
  }

  #state?: FindCtrlState | undefined;
  get state() {
    return this.#state;
  }

  #offset!: FindCtrlrOffset;
  #extractTextPromises!: Promise<void>[];
  #pageContents!: string[]; // Stores the normalized text for each page.
  #pageDiffs!: (Diffs | undefined)[];
  #hasDiacritics!: boolean[];
  #matchesCountTotal!: number;
  #pagesToSearch: number | undefined;
  #pendingFindMatches!: Set<number>;
  #resumePageIdx: number | undefined;
  #dirtyMatch!: boolean;
  #findTimeout?: number | undefined;

  _firstPageCapability!: PromiseCap;

  _rawQuery?: string;
  #normalizedQuery?: string;

  constructor({
    linkService,
    eventBus,
  }: PDFFindControllerOptions) {
    this.#linkService = linkService;
    this.#eventBus = eventBus;

    this.#reset();
    eventBus._on("find", this.#onFind);
    eventBus._on("findbarclose", this.#onFindBarClose);
  }

  /**
   * Set a reference to the PDF document in order to search it.
   * Note that searching is not possible if this method is not called.
   *
   * @param pdfDocument The PDF document to search.
   */
  setDocument(pdfDocument?: PDFDocumentProxy) {
    if (this._pdfDocument) {
      this.#reset();
    }
    if (!pdfDocument) {
      return;
    }
    this._pdfDocument = pdfDocument;
    this._firstPageCapability.resolve();
  }

  #onFind = (state: FindCtrlState) => {
    if (!state) {
      return;
    }

    const pdfDocument = this._pdfDocument;
    const { type } = state;

    if (this.#state === undefined || this.#shouldDirtyMatch(state)) {
      this.#dirtyMatch = true;
    }
    this.#state = state;
    if (type !== "findhighlightallchange") {
      this.#updateUIState(FindState.PENDING);
    }

    this._firstPageCapability.promise.then(() => {
      // If the document was closed before searching began, or if the search
      // operation was relevant for a previously opened document, do nothing.
      if (
        !this._pdfDocument ||
        (pdfDocument && this._pdfDocument !== pdfDocument)
      ) {
        return;
      }
      this.#extractText();

      const findbarClosed = !this.#highlightMatches;
      const pendingTimeout = !!this.#findTimeout;

      if (this.#findTimeout) {
        clearTimeout(this.#findTimeout);
        this.#findTimeout = undefined;
      }
      if (!type) {
        // Trigger the find action with a small delay to avoid starting the
        // search when the user is still typing (saving resources).
        this.#findTimeout = setTimeout(() => {
          this.#nextMatch();
          this.#findTimeout = undefined;
        }, FIND_TIMEOUT);
      } else if (this.#dirtyMatch) {
        // Immediately trigger searching for non-'find' operations, when the
        // current state needs to be reset and matches re-calculated.
        this.#nextMatch();
      } else if (type === "findagain") {
        this.#nextMatch();

        // When the findbar was previously closed, and `highlightAll` is set,
        // ensure that the matches on all active pages are highlighted again.
        if (findbarClosed && this.#state!.highlightAll) {
          this.#updateAllPages();
        }
      } else if (type === "findhighlightallchange") {
        // If there was a pending search operation, synchronously trigger a new
        // search *first* to ensure that the correct matches are highlighted.
        if (pendingTimeout) {
          this.#nextMatch();
        } else {
          this.#highlightMatches = true;
        }
        this.#updateAllPages(); // Update the highlighting on all active pages.
      } else {
        this.#nextMatch();
      }
    });
  };

  scrollMatchIntoView(
    { element, selectedLeft = 0, pageIndex = -1, matchIndex = -1 }: {
      element?: HTMLElement;
      selectedLeft: number;
      pageIndex?: number;
      matchIndex?: number;
    },
  ) {
    if (!this._scrollMatches || !element) {
      return;
    } else if (matchIndex === -1 || matchIndex !== this.#selected.matchIdx) {
      return;
    } else if (pageIndex === -1 || pageIndex !== this.#selected.pageIdx) {
      return;
    }
    this._scrollMatches = false; // Ensure that scrolling only happens once.

    const spot = {
      top: MATCH_SCROLL_OFFSET_TOP,
      left: selectedLeft + MATCH_SCROLL_OFFSET_LEFT,
    };
    scrollIntoView(element, spot, /* scrollMatches = */ true);
  }

  #reset() {
    this.#highlightMatches = false;
    this._scrollMatches = false;
    this._pdfDocument = undefined;
    this.#pageMatches = [];
    this.#pageMatchesLength = [];
    this.#state = undefined;
    // Currently selected match.
    this.#selected = {
      pageIdx: -1,
      matchIdx: -1,
    };
    // Where the find algorithm currently is in the document.
    this.#offset = {
      pageIdx: null,
      matchIdx: null,
      wrapped: false,
    };
    this.#extractTextPromises = [];
    this.#pageContents = []; // Stores the normalized text for each page.
    this.#pageDiffs = [];
    this.#hasDiacritics = [];
    this.#matchesCountTotal = 0;
    this.#pagesToSearch = undefined;
    this.#pendingFindMatches = new Set<number>();
    this.#resumePageIdx = undefined;
    this.#dirtyMatch = false;
    clearTimeout(this.#findTimeout);
    this.#findTimeout = undefined;

    this._firstPageCapability = createPromiseCap();
  }

  /**
   * @return The (current) normalized search query.
   */
  get #query() {
    if (this.#state!.query !== this._rawQuery) {
      this._rawQuery = this.#state!.query;
      [this.#normalizedQuery] = normalize(this.#state!.query);
    }
    return this.#normalizedQuery;
  }

  #shouldDirtyMatch(state: FindCtrlState) {
    // When the search query changes, regardless of the actual search command
    // used, always re-calculate matches to avoid errors (fixes bug 1030622).
    if (state.query !== this.#state!.query) {
      return true;
    }
    switch (state.type) {
      case "again":
        const pageNumber = this.#selected.pageIdx + 1;
        const linkService = this.#linkService;
        // Only treat a 'findagain' event as a new search operation when it's
        // *absolutely* certain that the currently selected match is no longer
        // visible, e.g. as a result of the user scrolling in the document.
        //
        // NOTE: If only a simple `this.#linkService.page` check was used here,
        // there's a risk that consecutive 'findagain' operations could "skip"
        // over matches at the top/bottom of pages thus making them completely
        // inaccessible when there's multiple pages visible in the viewer.
        if (
          pageNumber >= 1 &&
          pageNumber <= linkService.pagesCount &&
          pageNumber !== linkService.page &&
          !linkService.isPageVisible(pageNumber)
        ) {
          return true;
        }
        return false;
      case "highlightallchange":
        return false;
    }
    return true;
  }

  /**
   * Determine if the search query constitutes a "whole word", by comparing the
   * first/last character type with the preceding/following character type.
   */
  #isEntireWord = (content: string, startIdx: number, length: number) => {
    let match = content
      .slice(0, startIdx)
      .match(NOT_DIACRITIC_FROM_END_REG_EXP);
    if (match) {
      const first = content.charCodeAt(startIdx);
      const limit = match[1].charCodeAt(0);
      if (getCharacterType(first) === getCharacterType(limit)) {
        return false;
      }
    }

    match = content
      .slice(startIdx + length)
      .match(NOT_DIACRITIC_FROM_START_REG_EXP);
    if (match) {
      const last = content.charCodeAt(startIdx + length - 1);
      const limit = match[1].charCodeAt(0);
      if (getCharacterType(last) === getCharacterType(limit)) {
        return false;
      }
    }

    return true;
  };

  #calculateRegExpMatch(
    query: RegExp,
    entireWord: boolean,
    pageIndex: number,
    pageContent: string,
  ) {
    const matches = [],
      matchesLength = [];

    const diffs = this.#pageDiffs[pageIndex];
    let match;
    while ((match = query.exec(pageContent)) !== null) {
      if (
        entireWord &&
        !this.#isEntireWord(pageContent, match.index, match[0].length)
      ) {
        continue;
      }

      const [matchPos, matchLen] = getOriginalIndex(
        diffs,
        match.index,
        match[0].length,
      );

      if (matchLen) {
        matches.push(matchPos);
        matchesLength.push(matchLen);
      }
    }
    this.#pageMatches[pageIndex] = matches;
    this.#pageMatchesLength[pageIndex] = matchesLength;
  }

  #convertToRegExpString(
    query: string,
    hasDiacritics: boolean,
  ): [boolean, string] {
    // const matchesWithLength:MatchWithLength[] = [];
    const { matchDiacritics } = this.#state!;
    let isUnicode = false;
    query = query.replace(
      SPECIAL_CHARS_REG_EXP,
      (
        match,
        p1, /* to escape */
        p2, /* punctuation */
        p3, /* whitespaces */
        p4, /* diacritics */
        p5, /* letters */
      ) => {
        // We don't need to use a \s for whitespaces since all the different
        // kind of whitespaces are replaced by a single " ".

        if (p1) {
          // Escape characters like *+?... to not interfer with regexp syntax.
          return `[ ]*\\${p1}[ ]*`;
        }
        if (p2) {
          // Allow whitespaces around punctuation signs.
          return `[ ]*${p2}[ ]*`;
        }
        if (p3) {
          // Replace spaces by \s+ to be sure to match any spaces.
          return "[ ]+";
        }
        if (matchDiacritics) {
          return p4 || p5;
        }

        if (p4) {
          // Diacritics are removed with few exceptions.
          return DIACRITICS_EXCEPTION.has(p4.charCodeAt(0)) ? p4 : "";
        }

        // A letter has been matched and it can be followed by any diacritics
        // in normalized text.
        if (hasDiacritics) {
          isUnicode = true;
          return `${p5}\\p{M}*`;
        }
        return p5;
      },
    );

    const trailingSpaces = "[ ]*";
    if (query.endsWith(trailingSpaces)) {
      // The [ ]* has been added in order to help to match "foo . bar" but
      // it doesn't make sense to match some whitespaces after the dot
      // when it's the last character.
      query = query.slice(0, query.length - trailingSpaces.length);
    }

    if (matchDiacritics) {
      // aX must not match aXY.
      if (hasDiacritics) {
        isUnicode = true;
        query = `${query}(?=[${DIACRITICS_EXCEPTION_STR}]|[^\\p{M}]|$)`;
      }
    }

    return [isUnicode, query];
  }

  #calculateMatch(pageIndex: number) {
    let query: string | RegExp = this.#query!;
    if (query.length === 0) {
      // Do nothing: the matches should be wiped out already.
      return;
    }

    const { caseSensitive, entireWord, phraseSearch } = this.#state!;
    const pageContent = this.#pageContents[pageIndex];
    const hasDiacritics = this.#hasDiacritics[pageIndex];

    let isUnicode = false;
    if (phraseSearch) {
      [isUnicode, query] = this.#convertToRegExpString(query, hasDiacritics);
    } else {
      // Words are sorted in reverse order to be sure that "foobar" is matched
      // before "foo" in case the query is "foobar foo".
      const match = query.match(/\S+/g);
      if (match) {
        query = match
          .sort()
          .reverse()
          .map((q) => {
            const [isUnicodePart, queryPart] = this.#convertToRegExpString(
              q,
              hasDiacritics,
            );
            isUnicode ||= isUnicodePart;
            return `(${queryPart})`;
          })
          .join("|");
      }
    }

    const flags = `g${isUnicode ? "u" : ""}${caseSensitive ? "" : "i"}`;
    query = new RegExp(query, flags);

    this.#calculateRegExpMatch(query, entireWord, pageIndex, pageContent);

    // When `highlightAll` is set, ensure that the matches on previously
    // rendered (and still active) pages are correctly highlighted.
    if (this.#state!.highlightAll) {
      this.#updatePage(pageIndex);
    }
    if (this.#resumePageIdx === pageIndex) {
      this.#resumePageIdx = undefined;
      this.#nextPageMatch();
    }

    // Update the match count.
    const pageMatchesCount = this.#pageMatches[pageIndex].length;
    if (pageMatchesCount > 0) {
      this.#matchesCountTotal += pageMatchesCount;
      this.#updateUIResultsCount();
    }
  }

  #extractText() {
    if (this.#extractTextPromises.length > 0) {
      // Perform text extraction once if this method is called multiple times.
      return;
    }

    let promise = Promise.resolve();
    for (let i = 0, ii = this.#linkService.pagesCount; i < ii; i++) {
      const extractTextCapability = createPromiseCap<void>();
      this.#extractTextPromises[i] = extractTextCapability.promise;

      promise = promise.then(() => {
        return this._pdfDocument!
          .getPage(i + 1)
          .then((pdfPage) => {
            return pdfPage.getTextContent();
          })
          .then(
            (textContent) => {
              const strBuf = [];

              for (const textItem of textContent.items) {
                strBuf.push((<TextItem> textItem).str);
                if ((<TextItem> textItem).hasEOL) {
                  strBuf.push("\n");
                }
              }

              // Store the normalized page content (text items) as one string.
              [
                this.#pageContents[i],
                this.#pageDiffs[i],
                this.#hasDiacritics[i],
              ] = normalize(strBuf.join(""));
              extractTextCapability.resolve();
            },
            (reason) => {
              console.error(
                `Unable to get text content for page ${i + 1}`,
                reason,
              );
              // Page error -- assuming no text content.
              this.#pageContents[i] = "";
              this.#pageDiffs[i] = undefined;
              this.#hasDiacritics[i] = false;
              extractTextCapability.resolve();
            },
          );
      });
    }
  }

  #updatePage(index: number) {
    if (this._scrollMatches && this.#selected.pageIdx === index) {
      // If the page is selected, scroll the page into view, which triggers
      // rendering the page, which adds the text layer. Once the text layer
      // is built, it will attempt to scroll the selected match into view.
      this.#linkService.page = index + 1;
    }

    this.#eventBus.dispatch("updatetextlayermatches", {
      source: this,
      pageIndex: index,
    });
  }

  #updateAllPages() {
    this.#eventBus.dispatch("updatetextlayermatches", {
      source: this,
      pageIndex: -1,
    });
  }

  #nextMatch() {
    const previous = this.#state!.findPrevious;
    const currentPageIndex = this.#linkService.page - 1;
    const numPages = this.#linkService.pagesCount;

    this.#highlightMatches = true;

    if (this.#dirtyMatch) {
      // Need to recalculate the matches, reset everything.
      this.#dirtyMatch = false;
      this.#selected.pageIdx = this.#selected.matchIdx = -1;
      this.#offset.pageIdx = currentPageIndex;
      this.#offset.matchIdx = null;
      this.#offset.wrapped = false;
      this.#resumePageIdx = undefined;
      this.#pageMatches.length = 0;
      this.#pageMatchesLength.length = 0;
      this.#matchesCountTotal = 0;

      this.#updateAllPages(); // Wipe out any previously highlighted matches.

      for (let i = 0; i < numPages; i++) {
        // Start finding the matches as soon as the text is extracted.
        if (this.#pendingFindMatches.has(i)) {
          continue;
        }
        this.#pendingFindMatches.add(i);
        this.#extractTextPromises[i].then(() => {
          this.#pendingFindMatches.delete(i);
          this.#calculateMatch(i);
        });
      }
    }

    // If there's no query there's no point in searching.
    if (this.#query === "") {
      this.#updateUIState(FindState.FOUND);
      return;
    }
    // If we're waiting on a page, we return since we can't do anything else.
    if (this.#resumePageIdx) {
      return;
    }

    const offset = this.#offset;
    // Keep track of how many pages we should maximally iterate through.
    this.#pagesToSearch = numPages;
    // If there's already a `matchIdx` that means we are iterating through a
    // page's matches.
    if (offset.matchIdx !== null) {
      const numPageMatches = this.#pageMatches[offset.pageIdx!].length;
      if (
        (!previous && offset.matchIdx + 1 < numPageMatches) ||
        (previous && offset.matchIdx > 0)
      ) {
        // The simple case; we just have advance the matchIdx to select
        // the next match on the page.
        offset.matchIdx = previous ? offset.matchIdx - 1 : offset.matchIdx + 1;
        this.#updateMatch(/* found = */ true);
        return;
      }
      // We went beyond the current page's matches, so we advance to
      // the next page.
      this.#advanceOffsetPage(previous);
    }
    // Start searching through the page.
    this.#nextPageMatch();
  }

  #matchesReady(matches: number[]) {
    const offset = this.#offset;
    const numMatches = matches.length;
    const previous = this.#state!.findPrevious;

    if (numMatches) {
      // There were matches for the page, so initialize `matchIdx`.
      offset.matchIdx = previous ? numMatches - 1 : 0;
      this.#updateMatch(/* found = */ true);
      return true;
    }
    // No matches, so attempt to search the next page.
    this.#advanceOffsetPage(previous);
    if (offset.wrapped) {
      offset.matchIdx = null;
      if (this.#pagesToSearch! < 0) {
        // No point in wrapping again, there were no matches.
        this.#updateMatch(/* found = */ false);
        // While matches were not found, searching for a page
        // with matches should nevertheless halt.
        return true;
      }
    }
    // Matches were not found (and searching is not done).
    return false;
  }

  #nextPageMatch() {
    if (this.#resumePageIdx !== undefined) {
      console.error("There can only be one pending page.");
    }

    let matches = null;
    do {
      const pageIdx = this.#offset.pageIdx!;
      matches = this.#pageMatches[pageIdx];
      if (!matches) {
        // The matches don't exist yet for processing by `#matchesReady`,
        // so set a resume point for when they do exist.
        this.#resumePageIdx = pageIdx;
        break;
      }
    } while (!this.#matchesReady(matches));
  }

  #advanceOffsetPage = (previous?: boolean) => {
    const offset = this.#offset;
    const numPages = this.#linkService.pagesCount;
    offset.pageIdx = previous ? offset.pageIdx! - 1 : offset.pageIdx! + 1;
    offset.matchIdx = null;

    this.#pagesToSearch!--;

    if (offset.pageIdx >= numPages || offset.pageIdx < 0) {
      offset.pageIdx = previous ? numPages - 1 : 0;
      offset.wrapped = true;
    }
  };

  #updateMatch(found = false) {
    let state = FindState.NOT_FOUND;
    const wrapped = this.#offset.wrapped;
    this.#offset.wrapped = false;

    if (found) {
      const previousPage = this.#selected.pageIdx;
      this.#selected.pageIdx = this.#offset.pageIdx!;
      this.#selected.matchIdx = this.#offset.matchIdx!;
      state = wrapped ? FindState.WRAPPED : FindState.FOUND;

      // Update the currently selected page to wipe out any selected matches.
      if (previousPage !== -1 && previousPage !== this.#selected.pageIdx) {
        this.#updatePage(previousPage);
      }
    }

    this.#updateUIState(state, this.#state!.findPrevious);
    if (this.#selected.pageIdx !== -1) {
      // Ensure that the match will be scrolled into view.
      this._scrollMatches = true;

      this.#updatePage(this.#selected.pageIdx);
    }
  }

  #onFindBarClose = (evt: unknown) => {
    const pdfDocument = this._pdfDocument;
    // Since searching is asynchronous, ensure that the removal of highlighted
    // matches (from the UI) is async too such that the 'updatetextlayermatches'
    // events will always be dispatched in the expected order.
    this._firstPageCapability.promise.then(() => {
      // Only update the UI if the document is open, and is the current one.
      if (
        !this._pdfDocument ||
        (pdfDocument && this._pdfDocument !== pdfDocument)
      ) {
        return;
      }
      // Ensure that a pending, not yet started, search operation is aborted.
      if (this.#findTimeout) {
        clearTimeout(this.#findTimeout);
        this.#findTimeout = undefined;
      }
      // Abort any long running searches, to avoid a match being scrolled into
      // view *after* the findbar has been closed. In this case `this.#offset`
      // will most likely differ from `this.#selected`, hence we also ensure
      // that any new search operation will always start with a clean slate.
      if (this.#resumePageIdx) {
        this.#resumePageIdx = undefined;
        this.#dirtyMatch = true;
      }
      // Avoid the UI being in a pending state when the findbar is re-opened.
      this.#updateUIState(FindState.FOUND);

      this.#highlightMatches = false;
      this.#updateAllPages(); // Wipe out any previously highlighted matches.
    });
  };

  #requestMatchesCount(): MatchesCount {
    const { pageIdx, matchIdx } = this.#selected;
    let current = 0,
      total = this.#matchesCountTotal;
    if (matchIdx !== -1) {
      for (let i = 0; i < pageIdx; i++) {
        current += this.#pageMatches[i]?.length || 0;
      }
      current += matchIdx + 1;
    }
    // When searching starts, this method may be called before the `pageMatches`
    // have been counted (in `#calculateMatch`). Ensure that the UI won't show
    // temporarily broken state when the active find result doesn't make sense.
    if (current < 1 || current > total) {
      current = total = 0;
    }
    return { current, total };
  }

  #updateUIResultsCount() {
    this.#eventBus.dispatch("updatefindmatchescount", {
      source: this,
      matchesCount: this.#requestMatchesCount(),
    });
  }

  #updateUIState(state: FindState, previous = false) {
    this.#eventBus.dispatch("updatefindcontrolstate", {
      source: this,
      state,
      previous,
      matchesCount: this.#requestMatchesCount(),
      rawQuery: this.#state?.query ?? null,
    });
  }
}
/*80--------------------------------------------------------------------------*/
