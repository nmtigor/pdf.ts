/*81*****************************************************************************
 * api_test
** -------- */
import { css_1, css_2 } from "../../../test/alias.js";
import "../../../lib/jslang.js";
import { buildGetDocumentParams, TEST_PDFS_PATH } from "../test_lib.js";
import { DefaultCanvasFactory } from "./api.js";
import { GlobalWorkerOptions } from "./worker_options.js";
const strttime = performance.now();
/*81---------------------------------------------------------------------------*/
GlobalWorkerOptions.workerSrc = "/gen/pdf/pdf.ts-src/pdf.worker.js";
const basicApiFileName = "basicapi.pdf";
const basicApiFileLength = 105779; // bytes
const basicApiGetDocumentParams = buildGetDocumentParams(basicApiFileName);
let CanvasFactory = new DefaultCanvasFactory();
function waitSome(callback) {
    const WAIT_TIMEOUT = 10;
    setTimeout(() => { callback(); }, WAIT_TIMEOUT);
}
function mergeText(items) {
    return items.map(chunk => chunk.str + (chunk.hasEOL ? "\n" : "")).join("");
}
console.log("%c>>>>>>> test getDocument() >>>>>>>", `color:${css_1}`);
{
    console.log("it creates pdf doc from URL-string...");
    {
        const urlStr = TEST_PDFS_PATH + basicApiFileName;
        // const loadingTask = getDocument(urlStr);
        // console.assert( loadingTask instanceof PDFDocumentLoadingTask )
        // const pdfDocument = await loadingTask.promise;
        // console.assert( typeof urlStr === "string" );
        // console.assert( pdfDocument instanceof PDFDocumentProxy );
        // console.assert( pdfDocument.numPages === 3 );
        // await loadingTask.destroy();
    }
}
console.log("%c>>>>>>> test PDFWorker >>>>>>>", `color:${css_1}`);
{
    console.log("worker created or destroyed...");
    {
    }
}
console.log("%c>>>>>>> test PDFDocument >>>>>>>", `color:${css_1}`);
{
    //
}
CanvasFactory = undefined;
/*81---------------------------------------------------------------------------*/
console.log(`%cpdf/pdf.ts-src/display/api_test: ${(performance.now() - strttime).toFixed(2)} ms`, `color:${css_2}`);
globalThis.ntestfile = globalThis.ntestfile ? globalThis.ntestfile + 1 : 1;
//# sourceMappingURL=api_test.js.map