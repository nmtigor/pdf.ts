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
import { createPromiseCap } from "../../lib/promisecap.js";
import { getCharacterType } from "./pdf_find_utils.js";
import { scrollIntoView } from "./ui_utils.js";
/*81---------------------------------------------------------------------------*/
export var FindState;
(function (FindState) {
    FindState[FindState["FOUND"] = 0] = "FOUND";
    FindState[FindState["NOT_FOUND"] = 1] = "NOT_FOUND";
    FindState[FindState["WRAPPED"] = 2] = "WRAPPED";
    FindState[FindState["PENDING"] = 3] = "PENDING";
})(FindState || (FindState = {}));
const FIND_TIMEOUT = 250; // ms
const MATCH_SCROLL_OFFSET_TOP = -50; // px
const MATCH_SCROLL_OFFSET_LEFT = -400; // px
const CHARACTERS_TO_NORMALIZE = {
    "\u2010": "-",
    "\u2018": "'",
    "\u2019": "'",
    "\u201A": "'",
    "\u201B": "'",
    "\u201C": '"',
    "\u201D": '"',
    "\u201E": '"',
    "\u201F": '"',
    "\u00BC": "1/4",
    "\u00BD": "1/2",
    "\u00BE": "3/4", // Vulgar fraction three quarters
};
let normalizationRegex = null;
function normalize(text) {
    if (!normalizationRegex) {
        // Compile the regular expression for text normalization once.
        const replace = Object.keys(CHARACTERS_TO_NORMALIZE).join("");
        normalizationRegex = new RegExp(`[${replace}]`, "g");
    }
    let diffs;
    const normalizedText = text.replace(normalizationRegex, (ch, index) => {
        const normalizedCh = CHARACTERS_TO_NORMALIZE[ch];
        const diff = normalizedCh.length - ch.length;
        if (diff !== 0) {
            (diffs ||= []).push([index, diff]);
        }
        return normalizedCh;
    });
    return [normalizedText, diffs];
}
// Determine the original, non-normalized, match index such that highlighting of
// search results is correct in the `textLayer` for strings containing e.g. "½"
// characters; essentially "inverting" the result of the `normalize` function.
function getOriginalIndex(matchIndex, diffs) {
    if (!diffs)
        return matchIndex;
    let totalDiff = 0;
    for (const [index, diff] of diffs) {
        const currentIndex = index + totalDiff;
        if (currentIndex >= matchIndex)
            break;
        if (currentIndex + diff > matchIndex) {
            totalDiff += matchIndex - currentIndex;
            break;
        }
        totalDiff += diff;
    }
    return matchIndex - totalDiff;
}
/**
 * Provides search functionality to find a given string in a PDF document.
 */
export class PDFFindController {
    #linkService;
    #eventBus;
    #highlightMatches;
    get highlightMatches() { return this.#highlightMatches; }
    _scrollMatches;
    _pdfDocument;
    #pageMatches;
    get pageMatches() { return this.#pageMatches; }
    #pageMatchesLength;
    get pageMatchesLength() { return this.#pageMatchesLength; }
    #selected;
    get selected() { return this.#selected; }
    #state;
    get state() { return this.#state; }
    #offset;
    #extractTextPromises;
    #pageContents; // Stores the normalized text for each page.
    #pageDiffs;
    #matchesCountTotal;
    #pagesToSearch;
    #pendingFindMatches;
    #resumePageIdx;
    #dirtyMatch;
    #findTimeout;
    _firstPageCapability;
    _rawQuery;
    #normalizedQuery;
    constructor({ linkService, eventBus }) {
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
    setDocument(pdfDocument) {
        if (this._pdfDocument) {
            this.#reset();
        }
        if (!pdfDocument)
            return;
        this._pdfDocument = pdfDocument;
        this._firstPageCapability.resolve();
    }
    #onFind = (state) => {
        if (!state)
            return;
        const pdfDocument = this._pdfDocument;
        const { type } = state;
        if (this.#state === undefined || this._shouldDirtyMatch(state)) {
            this.#dirtyMatch = true;
        }
        this.#state = state;
        if (type !== "findhighlightallchange") {
            this._updateUIState(FindState.PENDING);
        }
        this._firstPageCapability.promise.then(() => {
            // If the document was closed before searching began, or if the search
            // operation was relevant for a previously opened document, do nothing.
            if (!this._pdfDocument
                || (pdfDocument && this._pdfDocument !== pdfDocument)) {
                return;
            }
            this._extractText();
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
                    this._nextMatch();
                    this.#findTimeout = undefined;
                }, FIND_TIMEOUT);
            }
            else if (this.#dirtyMatch) {
                // Immediately trigger searching for non-'find' operations, when the
                // current state needs to be reset and matches re-calculated.
                this._nextMatch();
            }
            else if (type === "findagain") {
                this._nextMatch();
                // When the findbar was previously closed, and `highlightAll` is set,
                // ensure that the matches on all active pages are highlighted again.
                if (findbarClosed && this.#state.highlightAll) {
                    this._updateAllPages();
                }
            }
            else if (type === "findhighlightallchange") {
                // If there was a pending search operation, synchronously trigger a new
                // search *first* to ensure that the correct matches are highlighted.
                if (pendingTimeout) {
                    this._nextMatch();
                }
                else {
                    this.#highlightMatches = true;
                }
                this._updateAllPages(); // Update the highlighting on all active pages.
            }
            else {
                this._nextMatch();
            }
        });
    };
    scrollMatchIntoView({ element, selectedLeft = 0, pageIndex = -1, matchIndex = -1 }) {
        if (!this._scrollMatches || !element) {
            return;
        }
        else if (matchIndex === -1 || matchIndex !== this.#selected.matchIdx) {
            return;
        }
        else if (pageIndex === -1 || pageIndex !== this.#selected.pageIdx) {
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
        this.#matchesCountTotal = 0;
        this.#pagesToSearch = undefined;
        this.#pendingFindMatches = new Set();
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
        if (this.#state.query !== this._rawQuery) {
            this._rawQuery = this.#state.query;
            [this.#normalizedQuery] = normalize(this.#state.query);
        }
        return this.#normalizedQuery;
    }
    _shouldDirtyMatch(state) {
        // When the search query changes, regardless of the actual search command
        // used, always re-calculate matches to avoid errors (fixes bug 1030622).
        if (state.query !== this.#state.query)
            return true;
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
                if (pageNumber >= 1
                    && pageNumber <= linkService.pagesCount
                    && pageNumber !== linkService.page
                    && !linkService.isPageVisible(pageNumber)) {
                    return true;
                }
                return false;
            case "highlightallchange":
                return false;
        }
        return true;
    }
    /**
     * Helper for multi-term search that fills the `matchesWithLength` array
     * and handles cases where one search term includes another search term (for
     * example, "tamed tame" or "this is"). It looks for intersecting terms in
     * the `matches` and keeps elements with a longer match length.
     */
    #prepareMatches = (matchesWithLength, matches, matchesLength) => {
        function isSubTerm(currentIndex) {
            const currentElem = matchesWithLength[currentIndex];
            const nextElem = matchesWithLength[currentIndex + 1];
            // Check for cases like "TAMEd TAME".
            if (currentIndex < matchesWithLength.length - 1 &&
                currentElem.match === nextElem.match) {
                currentElem.skipped = true;
                return true;
            }
            // Check for cases like "thIS IS".
            for (let i = currentIndex - 1; i >= 0; i--) {
                const prevElem = matchesWithLength[i];
                if (prevElem.skipped) {
                    continue;
                }
                if (prevElem.match + prevElem.matchLength < currentElem.match) {
                    break;
                }
                if (prevElem.match + prevElem.matchLength >=
                    currentElem.match + currentElem.matchLength) {
                    currentElem.skipped = true;
                    return true;
                }
            }
            return false;
        }
        // Sort the array of `{ match: <match>, matchLength: <matchLength> }`
        // objects on increasing index first and on the length otherwise.
        matchesWithLength.sort(function (a, b) {
            return a.match === b.match
                ? a.matchLength - b.matchLength
                : a.match - b.match;
        });
        for (let i = 0, len = matchesWithLength.length; i < len; i++) {
            if (isSubTerm(i)) {
                continue;
            }
            matches.push(matchesWithLength[i].match);
            matchesLength.push(matchesWithLength[i].matchLength);
        }
    };
    /**
     * Determine if the search query constitutes a "whole word", by comparing the
     * first/last character type with the preceding/following character type.
     */
    #isEntireWord = (content, startIdx, length) => {
        if (startIdx > 0) {
            const first = content.charCodeAt(startIdx);
            const limit = content.charCodeAt(startIdx - 1);
            if (getCharacterType(first) === getCharacterType(limit)) {
                return false;
            }
        }
        const endIdx = startIdx + length - 1;
        if (endIdx < content.length - 1) {
            const last = content.charCodeAt(endIdx);
            const limit = content.charCodeAt(endIdx + 1);
            if (getCharacterType(last) === getCharacterType(limit)) {
                return false;
            }
        }
        return true;
    };
    #calculatePhraseMatch(query, pageIndex, pageContent, pageDiffs, entireWord) {
        const matches = [], matchesLength = [];
        const queryLen = query.length;
        let matchIdx = -queryLen;
        while (true) {
            matchIdx = pageContent.indexOf(query, matchIdx + queryLen);
            if (matchIdx === -1)
                break;
            if (entireWord && !this.#isEntireWord(pageContent, matchIdx, queryLen))
                continue;
            const originalMatchIdx = getOriginalIndex(matchIdx, pageDiffs), matchEnd = matchIdx + queryLen - 1, originalQueryLen = getOriginalIndex(matchEnd, pageDiffs) - originalMatchIdx + 1;
            matches.push(originalMatchIdx);
            matchesLength.push(originalQueryLen);
        }
        this.#pageMatches[pageIndex] = matches;
        this.#pageMatchesLength[pageIndex] = matchesLength;
    }
    #calculateWordMatch(query, pageIndex, pageContent, pageDiffs, entireWord) {
        const matchesWithLength = [];
        // Divide the query into pieces and search for text in each piece.
        const queryArray = query.match(/\S+/g);
        for (let i = 0, len = queryArray.length; i < len; i++) {
            const subquery = queryArray[i];
            const subqueryLen = subquery.length;
            let matchIdx = -subqueryLen;
            while (true) {
                matchIdx = pageContent.indexOf(subquery, matchIdx + subqueryLen);
                if (matchIdx === -1)
                    break;
                if (entireWord
                    && !this.#isEntireWord(pageContent, matchIdx, subqueryLen)) {
                    continue;
                }
                const originalMatchIdx = getOriginalIndex(matchIdx, pageDiffs), matchEnd = matchIdx + subqueryLen - 1, originalQueryLen = getOriginalIndex(matchEnd, pageDiffs) - originalMatchIdx + 1;
                // Other searches do not, so we store the length.
                matchesWithLength.push({
                    match: originalMatchIdx,
                    matchLength: originalQueryLen,
                    skipped: false,
                });
            }
        }
        // Prepare arrays for storing the matches.
        this.#pageMatchesLength[pageIndex] = [];
        this.#pageMatches[pageIndex] = [];
        // Sort `matchesWithLength`, remove intersecting terms and put the result
        // into the two arrays.
        this.#prepareMatches(matchesWithLength, this.#pageMatches[pageIndex], this.#pageMatchesLength[pageIndex]);
    }
    #calculateMatch(pageIndex) {
        let pageContent = this.#pageContents[pageIndex];
        const pageDiffs = this.#pageDiffs[pageIndex];
        let query = this.#query;
        const { caseSensitive, entireWord, phraseSearch } = this.#state;
        if (query.length === 0) {
            // Do nothing: the matches should be wiped out already.
            return;
        }
        if (!caseSensitive) {
            pageContent = pageContent.toLowerCase();
            query = query.toLowerCase();
        }
        if (phraseSearch) {
            this.#calculatePhraseMatch(query, pageIndex, pageContent, pageDiffs, entireWord);
        }
        else {
            this.#calculateWordMatch(query, pageIndex, pageContent, pageDiffs, entireWord);
        }
        // When `highlightAll` is set, ensure that the matches on previously
        // rendered (and still active) pages are correctly highlighted.
        if (this.#state.highlightAll) {
            this.#updatePage(pageIndex);
        }
        if (this.#resumePageIdx === pageIndex) {
            this.#resumePageIdx = undefined;
            this._nextPageMatch();
        }
        // Update the match count.
        const pageMatchesCount = this.#pageMatches[pageIndex].length;
        if (pageMatchesCount > 0) {
            this.#matchesCountTotal += pageMatchesCount;
            this._updateUIResultsCount();
        }
    }
    _extractText() {
        // Perform text extraction once if this method is called multiple times.
        if (this.#extractTextPromises.length > 0)
            return;
        let promise = Promise.resolve();
        for (let i = 0, ii = this.#linkService.pagesCount; i < ii; i++) {
            const extractTextCapability = createPromiseCap();
            this.#extractTextPromises[i] = extractTextCapability.promise;
            promise = promise.then(() => {
                return this._pdfDocument
                    .getPage(i + 1)
                    .then(pdfPage => {
                    return pdfPage.getTextContent({
                        normalizeWhitespace: true,
                    });
                })
                    .then(textContent => {
                    const textItems = textContent.items;
                    const strBuf = [];
                    for (let j = 0, jj = textItems.length; j < jj; j++) {
                        strBuf.push(textItems[j].str);
                    }
                    // Store the normalized page content (text items) as one string.
                    [this.#pageContents[i], this.#pageDiffs[i]] = normalize(strBuf.join(""));
                    extractTextCapability.resolve(i);
                }, reason => {
                    console.error(`Unable to get text content for page ${i + 1}`, reason);
                    // Page error -- assuming no text content.
                    this.#pageContents[i] = "";
                    this.#pageDiffs[i] = undefined;
                    extractTextCapability.resolve(i);
                });
            });
        }
    }
    #updatePage(index) {
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
    _updateAllPages() {
        this.#eventBus.dispatch("updatetextlayermatches", {
            source: this,
            pageIndex: -1,
        });
    }
    _nextMatch() {
        const previous = this.#state.findPrevious;
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
            this._updateAllPages(); // Wipe out any previously highlighted matches.
            for (let i = 0; i < numPages; i++) {
                // Start finding the matches as soon as the text is extracted.
                if (this.#pendingFindMatches.has(i))
                    continue;
                this.#pendingFindMatches.add(i);
                this.#extractTextPromises[i].then(pageIdx => {
                    this.#pendingFindMatches.delete(pageIdx);
                    this.#calculateMatch(pageIdx);
                });
            }
        }
        // If there's no query there's no point in searching.
        if (this.#query === "") {
            this._updateUIState(FindState.FOUND);
            return;
        }
        // If we're waiting on a page, we return since we can't do anything else.
        if (this.#resumePageIdx)
            return;
        const offset = this.#offset;
        // Keep track of how many pages we should maximally iterate through.
        this.#pagesToSearch = numPages;
        // If there's already a `matchIdx` that means we are iterating through a
        // page's matches.
        if (offset.matchIdx !== null) {
            const numPageMatches = this.#pageMatches[offset.pageIdx].length;
            if ((!previous && offset.matchIdx + 1 < numPageMatches)
                || (previous && offset.matchIdx > 0)) {
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
        this._nextPageMatch();
    }
    #matchesReady(matches) {
        const offset = this.#offset;
        const numMatches = matches.length;
        const previous = this.#state.findPrevious;
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
            if (this.#pagesToSearch < 0) {
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
    _nextPageMatch() {
        if (this.#resumePageIdx !== undefined) {
            console.error("There can only be one pending page.");
        }
        let matches = null;
        do {
            const pageIdx = this.#offset.pageIdx;
            matches = this.#pageMatches[pageIdx];
            if (!matches) {
                // The matches don't exist yet for processing by `#matchesReady`,
                // so set a resume point for when they do exist.
                this.#resumePageIdx = pageIdx;
                break;
            }
        } while (!this.#matchesReady(matches));
    }
    #advanceOffsetPage = (previous) => {
        const offset = this.#offset;
        const numPages = this.#linkService.pagesCount;
        offset.pageIdx = previous ? offset.pageIdx - 1 : offset.pageIdx + 1;
        offset.matchIdx = null;
        this.#pagesToSearch--;
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
            this.#selected.pageIdx = this.#offset.pageIdx;
            this.#selected.matchIdx = this.#offset.matchIdx;
            state = wrapped ? FindState.WRAPPED : FindState.FOUND;
            // Update the currently selected page to wipe out any selected matches.
            if (previousPage !== -1 && previousPage !== this.#selected.pageIdx) {
                this.#updatePage(previousPage);
            }
        }
        this._updateUIState(state, this.#state.findPrevious);
        if (this.#selected.pageIdx !== -1) {
            // Ensure that the match will be scrolled into view.
            this._scrollMatches = true;
            this.#updatePage(this.#selected.pageIdx);
        }
    }
    #onFindBarClose = (evt) => {
        const pdfDocument = this._pdfDocument;
        // Since searching is asynchronous, ensure that the removal of highlighted
        // matches (from the UI) is async too such that the 'updatetextlayermatches'
        // events will always be dispatched in the expected order.
        this._firstPageCapability.promise.then(() => {
            // Only update the UI if the document is open, and is the current one.
            if (!this._pdfDocument ||
                (pdfDocument && this._pdfDocument !== pdfDocument)) {
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
            this._updateUIState(FindState.FOUND);
            this.#highlightMatches = false;
            this._updateAllPages(); // Wipe out any previously highlighted matches.
        });
    };
    _requestMatchesCount() {
        const { pageIdx, matchIdx } = this.#selected;
        let current = 0, total = this.#matchesCountTotal;
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
    _updateUIResultsCount() {
        this.#eventBus.dispatch("updatefindmatchescount", {
            source: this,
            matchesCount: this._requestMatchesCount(),
        });
    }
    _updateUIState(state, previous = false) {
        this.#eventBus.dispatch("updatefindcontrolstate", {
            source: this,
            state,
            previous,
            matchesCount: this._requestMatchesCount(),
            rawQuery: this.#state?.query ?? null,
        });
    }
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=pdf_find_controller.js.map