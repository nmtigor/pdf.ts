/*81*****************************************************************************
 * pdf_find_controller_test
** ------------------------ */
import { css_1, css_2 } from "../../test/alias.js";
import { PDFFindController } from "./pdf_find_controller.js";
import { SimpleLinkService } from "./pdf_link_service.js";
import { getDocument } from "../pdf.ts-src/display/api.js";
import { buildGetDocumentParams } from "../test_utils.js";
import { EventBus } from "./ui_utils.js";
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
    return { eventBus, pdfFindController };
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
        for (let i = totalPages - 1; i >= 0; i--) {
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
    {
        const { eventBus, pdfFindController } = await initPdfFindController();
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
    }
}
/*81---------------------------------------------------------------------------*/
console.log(`%cpdf/pdf.ts-web/pdf_find_controller_test: ${(performance.now() - strttime).toFixed(2)} ms`, `color:${css_2}`);
globalThis.ntestfile = globalThis.ntestfile ? globalThis.ntestfile + 1 : 1;
//# sourceMappingURL=pdf_find_controller_test.js.map