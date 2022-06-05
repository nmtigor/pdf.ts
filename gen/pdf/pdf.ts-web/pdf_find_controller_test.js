/*81*****************************************************************************
 * pdf_find_controller_test
** ------------------------ */
import { css_1, css_2 } from "../../test/alias.js";
import { getDocument } from "../pdf.ts-src/display/api.js";
import { buildGetDocumentParams } from "../test_utils.js";
import { EventBus } from "./event_utils.js";
import { PDFFindController } from "./pdf_find_controller.js";
import { SimpleLinkService } from "./pdf_link_service.js";
const strttime = performance.now();
/*81---------------------------------------------------------------------------*/
const tracemonkeyFileName = "tracemonkey.pdf";
class MockLinkService extends SimpleLinkService {
    _page = 1;
    get page() { return this._page; }
    set page(value) { this._page = value; }
    _pdfDocument;
    setDocument(pdfDocument) { this._pdfDocument = pdfDocument; }
    get pagesCount() { return this._pdfDocument.numPages; }
    constructor() {
        super();
    }
}
async function initPdfFindController(filename) {
    const loadingTask = getDocument(buildGetDocumentParams(filename || tracemonkeyFileName));
    const pdfDocument = await loadingTask.promise;
    const eventBus = new EventBus();
    const linkService = new MockLinkService();
    linkService.setDocument(pdfDocument);
    const pdfFindController = new PDFFindController({
        linkService,
        eventBus,
    });
    pdfFindController.setDocument(pdfDocument); // Enable searching.
    return { eventBus, pdfFindController, loadingTask };
}
function testSearch({ eventBus, pdfFindController, state, matchesPerPage, selectedMatch, pageMatches, pageMatchesLength, }) {
    return new Promise(function (resolve) {
        const eventState = Object.assign(Object.create(null), {
            source: this,
            type: "",
            query: null,
            caseSensitive: false,
            entireWord: false,
            phraseSearch: true,
            findPrevious: false,
            matchDiacritics: false,
        }, state);
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
        const totalMatches = matchesPerPage.reduce((a, b) => {
            return a + b;
        });
        eventBus.on("updatefindmatchescount", function onUpdateFindMatchesCount(evt) {
            if (pdfFindController.pageMatches.length !== totalPages)
                return;
            eventBus.off("updatefindmatchescount", onUpdateFindMatchesCount);
            console.assert(evt.matchesCount.total === totalMatches);
            for (let i = 0; i < totalPages; i++) {
                console.assert(pdfFindController.pageMatches[i].length === matchesPerPage[i]);
            }
            console.assert(pdfFindController.selected.pageIdx === selectedMatch.pageIndex);
            console.assert(pdfFindController.selected.matchIdx === selectedMatch.matchIndex);
            if (pageMatches) {
                console.assert(pdfFindController.pageMatches.eq(pageMatches));
                console.assert(pdfFindController.pageMatchesLength.eq(pageMatchesLength));
            }
            resolve();
        });
    });
}
console.log("%c>>>>>>> test pdf_find_controller >>>>>>>", `color:${css_1}`);
{
    console.log("it performs a normal search...");
    await (async () => {
        const { eventBus, pdfFindController, loadingTask } = await initPdfFindController();
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
        });
        await loadingTask.destroy();
    })();
    console.log("it performs a normal search and finds the previous result...");
    await (async () => {
        // Page 14 (with page index 13) contains five results. By default, the
        // first result (match index 0) is selected, so the previous result
        // should be the fifth result (match index 4).
        const { eventBus, pdfFindController, loadingTask } = await initPdfFindController();
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
        await loadingTask.destroy();
    })();
    console.log("it performs a case sensitive search...");
    await (async () => {
        const { eventBus, pdfFindController, loadingTask } = await initPdfFindController();
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
        await loadingTask.destroy();
    })();
    console.log("it performs an entire word search...");
    await (async () => {
        // Page 13 contains both 'Government' and 'Governmental', so the latter
        // should not be found with entire word search.
        const { eventBus, pdfFindController, loadingTask } = await initPdfFindController();
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
        await loadingTask.destroy();
    })();
    console.log("it performs a multiple term (no phrase) search...");
    await (async () => {
        // Page 9 contains 'alternate' and pages 6 and 9 contain 'solution'.
        // Both should be found for multiple term (no phrase) search.
        const { eventBus, pdfFindController, loadingTask } = await initPdfFindController();
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
        await loadingTask.destroy();
    })();
    // console.log("it performs a normal search, where the text is normalized...");
    // await (async() => {
    //   const { eventBus, pdfFindController, loadingTask } = await initPdfFindController(
    //     "fraction-highlight.pdf"
    //   );
    //   try {
    //     await testSearch({
    //       eventBus,
    //       pdfFindController,
    //       state: {
    //         query: "fraction",
    //       },
    //       matchesPerPage: [3],
    //       selectedMatch: {
    //         pageIndex: 0,
    //         matchIndex: 0,
    //       },
    //       pageMatches: [[19, 46, 62]],
    //       pageMatchesLength: [[8, 8, 8]],
    //     });
    //   } catch( err ){
    //     console.log(err);
    //   }
    //   await loadingTask.destroy();
    // })();
}
/*81---------------------------------------------------------------------------*/
console.log(`%c:pdf/pdf.ts-web/pdf_find_controller_test ${(performance.now() - strttime).toFixed(2)} ms`, `color:${css_2}`);
globalThis.ntestfile = globalThis.ntestfile ? globalThis.ntestfile + 1 : 1;
//# sourceMappingURL=pdf_find_controller_test.js.map