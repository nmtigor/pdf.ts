/*81*****************************************************************************
 * api_test
** -------- */
import { $enum } from "../../../3rd/ts-enum-util/src/$enum.js";
import { eq } from "../../../lib/jslang.js";
import { createPromiseCap } from "../../../lib/promisecap.js";
import { css_1, css_2 } from "../../../test/alias.js";
import { AnnotationMode, FontType, OPS, PermissionFlag, StreamType, UnknownErrorException } from "../../pdf.ts-src/shared/util.js";
import { PageLayout, PageMode } from "../../pdf.ts-web/ui_utils.js";
import { buildGetDocumentParams, DefaultFileReaderFactory, TEST_PDFS_PATH } from "../../test_utils.js";
import { DefaultCanvasFactory, getDocument, PDFDataRangeTransport, PDFDocumentLoadingTask, PDFDocumentProxy, PDFPageProxy, PDFWorker, PDFWorkerUtil, RenderTask } from "./api.js";
import { PageViewport, RenderingCancelledException } from "./display_utils.js";
import { Metadata } from "./metadata.js";
import { GlobalWorkerOptions } from "./worker_options.js";
const strttime = performance.now();
/*81---------------------------------------------------------------------------*/
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
//! unsynchronized
console.log("%c>>>>>>> test getDocument() >>>>>>>", `color:${css_1}`);
{
    let i = 0; // 13
    console.log(`${++i}: it creates pdf doc from URL-string...`);
    {
        const urlStr = TEST_PDFS_PATH + basicApiFileName;
        const loadingTask = getDocument(urlStr);
        console.assert(loadingTask instanceof PDFDocumentLoadingTask);
        const pdfDocument = await loadingTask.promise;
        console.assert(typeof urlStr === "string");
        console.assert(pdfDocument instanceof PDFDocumentProxy);
        console.assert(pdfDocument.numPages === 3);
        await loadingTask.destroy();
    }
    console.log(`${++i}: it creates pdf doc from URL-object...`);
    {
        // if (isNodeJS) {
        //   pending("window.location is not supported in Node.js.");
        // }
        const urlObj = new URL(TEST_PDFS_PATH + basicApiFileName, window.location);
        const loadingTask = getDocument(urlObj);
        console.assert(loadingTask instanceof PDFDocumentLoadingTask);
        const pdfDocument = await loadingTask.promise;
        console.assert(urlObj instanceof URL);
        console.assert(pdfDocument instanceof PDFDocumentProxy);
        console.assert(pdfDocument.numPages === 3);
        await loadingTask.destroy();
    }
    console.log(`${++i}: it creates pdf doc from URL...`);
    {
        const loadingTask = getDocument(basicApiGetDocumentParams);
        console.assert(loadingTask instanceof PDFDocumentLoadingTask);
        const progressReportedCapability = createPromiseCap();
        // Attach the callback that is used to report loading progress;
        // similarly to how viewer.js works.
        loadingTask.onProgress = progressData => {
            if (!progressReportedCapability.settled) {
                progressReportedCapability.resolve(progressData);
            }
        };
        const data = await Promise.all([
            progressReportedCapability.promise,
            loadingTask.promise,
        ]);
        console.assert(data[0].loaded / data[0].total >= 0);
        console.assert(data[1] instanceof PDFDocumentProxy);
        console.assert(loadingTask === data[1].loadingTask);
        await loadingTask.destroy();
    }
    console.log(`${++i}: it creates pdf doc from URL and aborts before worker initialized...`);
    {
        const loadingTask = getDocument(basicApiGetDocumentParams);
        console.assert(loadingTask instanceof PDFDocumentLoadingTask);
        const destroyed = loadingTask.destroy();
        try {
            await loadingTask.promise;
            console.assert(!!0, "Shouldn't get here.");
        }
        catch (reason) {
            await destroyed;
        }
    }
    console.log(`${++i}: it creates pdf doc from URL and aborts loading after worker initialized...`);
    {
        const loadingTask = getDocument(basicApiGetDocumentParams);
        console.assert(loadingTask instanceof PDFDocumentLoadingTask);
        // This can be somewhat random -- we cannot guarantee perfect
        // 'Terminate' message to the worker before/after setting up pdfManager.
        const destroyed = loadingTask._worker.promise.then(() => loadingTask.destroy());
        await destroyed;
    }
    console.log(`${++i}: it creates pdf doc from typed array...`);
    {
        const typedArrayPdf = await DefaultFileReaderFactory.fetch({
            path: TEST_PDFS_PATH + basicApiFileName,
        });
        // Sanity check to make sure that we fetched the entire PDF file.
        console.assert(typedArrayPdf.length === basicApiFileLength);
        const loadingTask = getDocument(typedArrayPdf);
        console.assert(loadingTask instanceof PDFDocumentLoadingTask);
        const progressReportedCapability = createPromiseCap();
        loadingTask.onProgress = data => {
            progressReportedCapability.resolve(data);
        };
        const data = await Promise.all([
            loadingTask.promise,
            progressReportedCapability.promise,
        ]);
        console.assert(data[0] instanceof PDFDocumentProxy === true);
        console.assert(data[1].loaded / data[1].total === 1);
        await loadingTask.destroy();
    }
    // console.log(`${++i}: it creates pdf doc from invalid PDF file...`);
    // {
    //   // A severely corrupt PDF file (even Adobe Reader fails to open it).
    //   const loadingTask = getDocument(buildGetDocumentParams("bug1020226.pdf"));
    //   console.assert( loadingTask instanceof PDFDocumentLoadingTask );
    //   try {
    //     await loadingTask.promise;
    //     console.assert( !!0, "Shouldn't get here.");
    //   } catch (reason) {
    //     console.assert( reason instanceof InvalidPDFException );
    //     console.assert( (<InvalidPDFException>reason).message === "Invalid PDF structure.");
    //   }
    //   await loadingTask.destroy();
    // }
    // console.log(`${++i}: it creates pdf doc from non-existent URL...`);
    // {
    //   if (!isNodeJS) {
    //     // Re-enable in https://github.com/mozilla/pdf.js/issues/13061.
    //     pending("Fails intermittently on Linux in browsers.");
    //   }
    //   const loadingTask = getDocument(
    //     buildGetDocumentParams("non-existent.pdf")
    //   );
    //   expect(loadingTask instanceof PDFDocumentLoadingTask).toEqual(true);
    //   try {
    //     await loadingTask.promise;
    //     // Shouldn't get here.
    //     expect(false).toEqual(true);
    //   } catch (reason) {
    //     expect(reason instanceof MissingPDFException).toEqual(true);
    //   }
    //   await loadingTask.destroy();
    // }
    // console.log(`${++i}: it creates pdf doc from PDF file protected with user and owner password...`);
    // {
    //   const loadingTask = getDocument(buildGetDocumentParams("pr6531_1.pdf"));
    //   console.assert( loadingTask instanceof PDFDocumentLoadingTask );
    //   const passwordNeededCapability = createPromiseCap();
    //   const passwordIncorrectCapability = createPromiseCap();
    //   // Attach the callback that is used to request a password;
    //   // similarly to how the default viewer handles passwords.
    //   loadingTask.onPassword = (updatePassword, reason) => {
    //     if( reason === PasswordResponses.NEED_PASSWORD
    //      && !passwordNeededCapability.settled
    //     ) {
    //       passwordNeededCapability.resolve();
    //       updatePassword("qwerty"); // Provide an incorrect password.
    //       return;
    //     }
    //     if( reason === PasswordResponses.INCORRECT_PASSWORD
    //      && !passwordIncorrectCapability.settled
    //     ) {
    //       passwordIncorrectCapability.resolve();
    //       updatePassword("asdfasdf"); // Provide the correct password.
    //       return;
    //     }
    //     console.assert( !!0, "Shouldn't get here.");
    //   };
    //   const data = await Promise.all([
    //     passwordNeededCapability.promise,
    //     passwordIncorrectCapability.promise,
    //     loadingTask.promise,
    //   ]);
    //   console.assert( data[2] instanceof PDFDocumentProxy );
    //   await loadingTask.destroy();
    // }
    // console.log(`${++i}: it creates pdf doc from PDF file protected with only a user password...`);
    // {
    //   const filename = "pr6531_2.pdf";
    //   const passwordNeededLoadingTask = getDocument(
    //     buildGetDocumentParams(filename, {
    //       password: "",
    //     })
    //   );
    //   console.assert( passwordNeededLoadingTask instanceof PDFDocumentLoadingTask );
    //   const result1 = passwordNeededLoadingTask.promise.then(
    //     () => {
    //       console.assert( !!0, "Shouldn't get here.");
    //       return Promise.reject(new Error("loadingTask should be rejected"));
    //     },
    //     data => {
    //       console.assert( data instanceof PasswordException );
    //       console.assert( data.code === PasswordResponses.NEED_PASSWORD );
    //       return passwordNeededLoadingTask.destroy();
    //     }
    //   );
    //   const passwordIncorrectLoadingTask = getDocument(
    //     buildGetDocumentParams(filename, {
    //       password: "qwerty",
    //     })
    //   );
    //   console.assert( passwordIncorrectLoadingTask instanceof PDFDocumentLoadingTask );
    //   const result2 = passwordIncorrectLoadingTask.promise.then(
    //     () => {
    //       console.assert( !!0, "Shouldn't get here.");
    //       return Promise.reject(new Error("loadingTask should be rejected"));
    //     },
    //     data => {
    //       console.assert( data instanceof PasswordException );
    //       console.assert( data.code === PasswordResponses.INCORRECT_PASSWORD );
    //       return passwordIncorrectLoadingTask.destroy();
    //     }
    //   );
    //   const passwordAcceptedLoadingTask = getDocument(
    //     buildGetDocumentParams(filename, {
    //       password: "asdfasdf",
    //     })
    //   );
    //   console.assert( passwordAcceptedLoadingTask instanceof PDFDocumentLoadingTask );
    //   const result3 = passwordAcceptedLoadingTask.promise.then( data => {
    //     console.assert( data instanceof PDFDocumentProxy );
    //     return passwordAcceptedLoadingTask.destroy();
    //   });
    //   await Promise.all([result1, result2, result3]);
    // }
    // console.log(`${++i}: it creates pdf doc from password protected PDF file and aborts/throws in the onPassword callback (issue 7806)...`);
    // {
    // }
    // console.log(`${++i}: it creates pdf doc from password protected PDF file and passes an Error (asynchronously) to the onPassword callback (bug 1754421)...`);
    // {
    // }
    // console.log(`${++i}: it creates pdf doc from empty typed array...`);
    // {
    //   const loadingTask = getDocument(new Uint8Array(0));
    //   console.assert( loadingTask instanceof PDFDocumentLoadingTask );
    //   try {
    //     await loadingTask.promise;
    //     console.assert( !!0, "Shouldn't get here.");
    //   } catch (reason) {
    //     console.assert( reason instanceof InvalidPDFException );
    //     console.assert( (<InvalidPDFException>reason).message ===
    //       "The PDF file is empty, i.e. its size is zero bytes."
    //     );
    //   }
    //   await loadingTask.destroy();
    // }
    console.log(`${++i}: it checks that ${"`docId`"}s are unique and increasing...`);
    {
        const loadingTask1 = getDocument(basicApiGetDocumentParams);
        console.assert(loadingTask1 instanceof PDFDocumentLoadingTask);
        await loadingTask1.promise;
        const docId1 = loadingTask1.docId;
        const loadingTask2 = getDocument(basicApiGetDocumentParams);
        console.assert(loadingTask2 instanceof PDFDocumentLoadingTask);
        await loadingTask2.promise;
        const docId2 = loadingTask2.docId;
        console.assert(docId1 !== docId2);
        const docIdRegExp = /^d(\d+)$/, docNum1 = docIdRegExp.exec(docId1)?.[1], docNum2 = docIdRegExp.exec(docId2)?.[1];
        console.assert(+docNum1 < +docNum2);
        await Promise.all([loadingTask1.destroy(), loadingTask2.destroy()]);
    }
    console.log(`${++i}: it creates pdf doc from PDF file with bad XRef entry...`);
    {
        // A corrupt PDF file, where the XRef table have (some) bogus entries.
        const loadingTask = getDocument(buildGetDocumentParams("PDFBOX-4352-0.pdf", {
            rangeChunkSize: 100,
        }));
        console.assert(loadingTask instanceof PDFDocumentLoadingTask);
        const pdfDocument = await loadingTask.promise;
        console.assert(pdfDocument.numPages === 1);
        const page = await pdfDocument.getPage(1);
        console.assert(page instanceof PDFPageProxy);
        const opList = await page.getOperatorList();
        console.assert(opList.fnArray.length === 0);
        console.assert(opList.argsArray.length === 0);
        console.assert(opList.lastChunk === true);
        await loadingTask.destroy();
    }
    console.log(`${++i}: it creates pdf doc from PDF file with bad XRef header...`);
    {
        const loadingTask = getDocument(buildGetDocumentParams("GHOSTSCRIPT-698804-1-fuzzed.pdf"));
        console.assert(loadingTask instanceof PDFDocumentLoadingTask);
        const pdfDocument = await loadingTask.promise;
        console.assert(pdfDocument.numPages === 1);
        const page = await pdfDocument.getPage(1);
        console.assert(page instanceof PDFPageProxy);
        const opList = await page.getOperatorList();
        console.assert(opList.fnArray.length === 0);
        console.assert(opList.argsArray.length === 0);
        console.assert(opList.lastChunk === true);
        await loadingTask.destroy();
    }
    // console.log(`${++i}: it creates pdf doc from PDF file with bad XRef byteWidths...`);
    // {
    //   // A corrupt PDF file, where the XRef /W-array have (some) bogus entries.
    //   const loadingTask = getDocument(
    //     buildGetDocumentParams("REDHAT-1531897-0.pdf")
    //   );
    //   console.assert( loadingTask instanceof PDFDocumentLoadingTask );
    //   try {
    //     await loadingTask.promise;
    //     console.assert( !!0, "Shouldn't get here.");
    //   } catch (reason) {
    //     console.assert( reason instanceof InvalidPDFException );
    //     console.assert( (<any>reason).message === "Invalid PDF structure." );
    //   }
    //   await loadingTask.destroy();
    // }
    // console.log(`${++i}: it creates pdf doc from PDF file with inaccessible /Pages tree...`);
    // {
    //   const loadingTask = getDocument(
    //     buildGetDocumentParams("poppler-395-0-fuzzed.pdf")
    //   );
    //   console.assert( loadingTask instanceof PDFDocumentLoadingTask );
    //   try {
    //     await loadingTask.promise;
    //     console.assert( !!0, "Shouldn't get here.");
    //   } catch (reason) {
    //     console.assert( reason instanceof InvalidPDFException );
    //     console.assert( (<any>reason).message === "Invalid Root reference." );
    //   }
    //   await loadingTask.destroy();
    // }
    console.log(`${++i}: it creates pdf doc from PDF files, with bad /Pages tree /Count...`);
    {
        const loadingTask1 = getDocument(buildGetDocumentParams("poppler-67295-0.pdf"));
        const loadingTask2 = getDocument(buildGetDocumentParams("poppler-85140-0.pdf"));
        console.assert(loadingTask1 instanceof PDFDocumentLoadingTask);
        console.assert(loadingTask2 instanceof PDFDocumentLoadingTask);
        const pdfDocument1 = await loadingTask1.promise;
        const pdfDocument2 = await loadingTask2.promise;
        console.assert(pdfDocument1.numPages === 1);
        console.assert(pdfDocument2.numPages === 1);
        const page = await pdfDocument1.getPage(1);
        console.assert(page instanceof PDFPageProxy);
        const opList = await page.getOperatorList();
        console.assert(opList.fnArray.length > 5);
        console.assert(opList.argsArray.length > 5);
        console.assert(opList.lastChunk === true);
        try {
            await pdfDocument2.getPage(1);
            console.assert(!!0, "Shouldn't get here.");
        }
        catch (reason) {
            console.assert(reason instanceof UnknownErrorException);
            console.assert(reason.message === "Bad (uncompressed) XRef entry: 3R");
        }
        await Promise.all([loadingTask1.destroy(), loadingTask2.destroy()]);
    }
    console.log(`${++i}: it creates pdf doc from PDF files, with circular references...`);
    {
        const loadingTask1 = getDocument(buildGetDocumentParams("poppler-91414-0-53.pdf"));
        const loadingTask2 = getDocument(buildGetDocumentParams("poppler-91414-0-54.pdf"));
        console.assert(loadingTask1 instanceof PDFDocumentLoadingTask);
        console.assert(loadingTask2 instanceof PDFDocumentLoadingTask);
        const pdfDocument1 = await loadingTask1.promise;
        const pdfDocument2 = await loadingTask2.promise;
        console.assert(pdfDocument1.numPages === 1);
        console.assert(pdfDocument2.numPages === 1);
        const pageA = await pdfDocument1.getPage(1);
        const pageB = await pdfDocument2.getPage(1);
        console.assert(pageA instanceof PDFPageProxy);
        console.assert(pageB instanceof PDFPageProxy);
        for (const opList of [
            await pageA.getOperatorList(),
            await pageB.getOperatorList(),
        ]) {
            console.assert(opList.fnArray.length > 5);
            console.assert(opList.argsArray.length > 5);
            console.assert(opList.lastChunk === true);
        }
        await Promise.all([loadingTask1.destroy(), loadingTask2.destroy()]);
    }
    // console.log(`${++i}: it creates pdf doc from PDF files, with bad /Pages tree /Kids entries...`);
    // {
    //   const loadingTask1 = getDocument(
    //     buildGetDocumentParams("poppler-742-0-fuzzed.pdf")
    //   );
    //   const loadingTask2 = getDocument(
    //     buildGetDocumentParams("poppler-937-0-fuzzed.pdf")
    //   );
    //   console.assert( loadingTask1 instanceof PDFDocumentLoadingTask );
    //   console.assert( loadingTask2 instanceof PDFDocumentLoadingTask );
    //   const pdfDocument1 = await loadingTask1.promise;
    //   const pdfDocument2 = await loadingTask2.promise;
    //   console.assert( pdfDocument1.numPages === 1 );
    //   console.assert( pdfDocument2.numPages === 1 );
    //   try {
    //     await pdfDocument1.getPage(1);
    //     console.assert( !!0, "Shouldn't get here.");
    //   } catch (reason) {
    //     console.assert( reason instanceof UnknownErrorException );
    //     // console.log((<any>reason).message);
    //     console.assert( (<any>reason).message ===
    //       "Illegal character: 41"
    //     );
    //   }
    //   try {
    //     await pdfDocument2.getPage(1);
    //     console.assert( !!0, "Shouldn't get here.");
    //   } catch (reason) {
    //     console.assert( reason instanceof UnknownErrorException );
    //     // console.log((<any>reason).message);
    //     console.assert( (<any>reason).message ===
    //       "End of file inside array."
    //     );
    //   }
    //   await Promise.all([loadingTask1.destroy(), loadingTask2.destroy()]);
    // }
}
console.log("%c>>>>>>> test PDFWorker >>>>>>>", `color:${css_1}`);
{
    console.log("worker created or destroyed...");
    {
        // if (isNodeJS) {
        //   pending("Worker is not supported in Node.js.");
        // }
        const worker = new PDFWorker({ name: "test1" });
        await worker.promise;
        console.assert(worker.name === "test1");
        console.assert(!!worker.port);
        console.assert(!worker.destroyed);
        console.assert(!!worker._webWorker);
        console.assert(worker.port === worker._webWorker);
        worker.destroy();
        console.assert(!worker.port);
        console.assert(worker.destroyed);
    }
    console.log("worker created or destroyed by getDocument...");
    {
        // if (isNodeJS) {
        //   pending("Worker is not supported in Node.js.");
        // }
        const loadingTask = getDocument(basicApiGetDocumentParams);
        let worker;
        loadingTask.promise.then(() => {
            worker = loadingTask._worker;
            console.assert(!!worker);
        });
        const destroyPromise = loadingTask.promise.then(() => loadingTask.destroy());
        await destroyPromise;
        const destroyedWorker = loadingTask._worker;
        console.assert(!destroyedWorker);
        console.assert(worker.destroyed);
    }
    console.log("worker created and can be used in getDocument...");
    {
        // if (isNodeJS) {
        //   pending("Worker is not supported in Node.js.");
        // }
        const worker = new PDFWorker({ name: "test1" });
        const loadingTask = getDocument(buildGetDocumentParams(basicApiFileName, {
            worker,
        }));
        loadingTask.promise.then(() => {
            const docWorker = loadingTask._worker;
            console.assert(!docWorker);
            // checking is the same port is used in the MessageHandler
            const messageHandlerPort = loadingTask._transport.messageHandler.comObj;
            console.assert(messageHandlerPort === worker.port);
        });
        const destroyPromise = loadingTask.promise.then(() => loadingTask.destroy());
        await destroyPromise;
        console.assert(!worker.destroyed);
        worker.destroy();
    }
    console.log("it creates more than one worker...");
    {
        // if (isNodeJS) {
        //   pending("Worker is not supported in Node.js.");
        // }
        const worker1 = new PDFWorker({ name: "test1" });
        const worker2 = new PDFWorker({ name: "test2" });
        const worker3 = new PDFWorker({ name: "test3" });
        await Promise.all([worker1.promise, worker2.promise, worker3.promise]);
        console.assert(worker1.port !== worker2.port
            && worker1.port !== worker3.port
            && worker2.port !== worker3.port);
        worker1.destroy();
        worker2.destroy();
        worker3.destroy();
    }
    console.log("it gets current workerSrc...");
    {
        // if (isNodeJS) {
        //   pending("Worker is not supported in Node.js.");
        // }
        const workerSrc = PDFWorker.workerSrc;
        console.assert(typeof workerSrc == "string");
        console.assert(workerSrc == GlobalWorkerOptions.workerSrc);
    }
}
//! unsynchronized
console.log("%c>>>>>>> test PDFDocument >>>>>>>", `color:${css_1}`);
{
    let pdfLoadingTask = getDocument(basicApiGetDocumentParams);
    let pdfDocument = await pdfLoadingTask.promise;
    let i = 0; // 50
    console.log(`${++i}: it gets number of pages...`);
    {
        console.assert(pdfDocument.numPages === 3);
    }
    console.log(`${++i}: it gets fingerprints...`);
    {
        console.assert(pdfDocument.fingerprints.eq([
            "ea8b35919d6279a369e835bde778611b",
            undefined,
        ]));
    }
    console.log(`${++i}: it gets fingerprints, from modified document...`);
    {
        const loadingTask = getDocument(buildGetDocumentParams("annotation-tx.pdf"));
        const pdfDoc = await loadingTask.promise;
        console.assert(pdfDoc.fingerprints.eq([
            "3ebd77c320274649a68f10dbf3b9f882",
            "e7087346aa4b4ae0911c1f1643b57345",
        ]));
        await loadingTask.destroy();
    }
    console.log(`${++i}: it gets page...`);
    {
        const data = await pdfDocument.getPage(1);
        console.assert(data instanceof PDFPageProxy);
        console.assert(data.pageNumber === 1);
    }
    console.log(`${++i}: it gets non-existent page...`);
    {
        const pageNumbers = [
            /* outOfRange = */ 100,
            /* nonInteger = */ 2.5,
            /* nonNumber = */ "1",
        ];
        for (const pageNumber of pageNumbers) {
            try {
                await pdfDocument.getPage(pageNumber);
                console.assert(!!0, "Shouldn't get here.");
            }
            catch (reason) {
                console.assert(reason instanceof Error);
                console.assert(reason.message === "Invalid page request.");
            }
        }
    }
    console.log(`${++i}: it gets page, from /Pages tree with circular reference...`);
    {
        const loadingTask = getDocument(buildGetDocumentParams("Pages-tree-refs.pdf"));
        const page1 = loadingTask.promise.then(pdfDoc => {
            return pdfDoc.getPage(1).then(pdfPage => {
                console.assert(pdfPage instanceof PDFPageProxy);
                console.assert(pdfPage.ref.eq({ num: 6, gen: 0 }));
            }, reason => {
                throw new Error("shall not fail for valid page");
            });
        });
        const page2 = loadingTask.promise.then(pdfDoc => {
            return pdfDoc.getPage(2).then(pdfPage => {
                throw new Error("shall fail for invalid page");
            }, reason => {
                console.assert(reason instanceof UnknownErrorException);
                console.assert(reason.message === "Pages tree contains circular reference.");
            });
        });
        await Promise.all([page1, page2]);
        await loadingTask.destroy();
    }
    console.log(`${++i}: it gets page multiple time, with working caches...`);
    {
        const promiseA = pdfDocument.getPage(1);
        const promiseB = pdfDocument.getPage(1);
        console.assert(promiseA instanceof Promise);
        console.assert(promiseA === promiseB);
        const pageA = await promiseA;
        const pageB = await promiseB;
        console.assert(pageA instanceof PDFPageProxy);
        console.assert(pageA === pageB);
    }
    // console.log(`${++i}: it gets page index...`);
    // {
    //   const ref = { num: 17, gen: 0 }; // Reference to second page.
    //   const pageIndex = await pdfDocument.getPageIndex(ref);
    //   console.assert( pageIndex === 1 );
    // }
    console.log(`${++i}: it gets invalid page index...`);
    {
        const pageRefs = [
            /* fontRef = */ { num: 3, gen: 0 },
            /* invalidRef = */ { num: -1, gen: 0 },
            /* nonRef = */ "qwerty",
            /* nullRef = */ null,
        ];
        const expectedErrors = [
            {
                exception: UnknownErrorException,
                message: "The reference does not point to a /Page dictionary.",
            },
            { exception: Error, message: "Invalid pageIndex request." },
            { exception: Error, message: "Invalid pageIndex request." },
            { exception: Error, message: "Invalid pageIndex request." },
        ];
        for (let i = 0, ii = pageRefs.length; i < ii; i++) {
            try {
                await pdfDocument.getPageIndex(pageRefs[i]);
                console.assert(!!0, "Shouldn't get here.");
            }
            catch (reason) {
                const { exception, message } = expectedErrors[i];
                console.assert(reason instanceof exception);
                console.assert(reason.message === message);
            }
        }
    }
    console.log(`${++i}: it gets destinations, from /Dests dictionary...`);
    {
        const destinations = await pdfDocument.getDestinations();
        console.assert(destinations.eq({
            chapter1: [{ gen: 0, num: 17 }, { name: "XYZ" }, 0, 841.89, null],
        }));
    }
    console.log(`${++i}: it gets a destination, from /Dests dictionary...`);
    {
        const destination = await pdfDocument.getDestination("chapter1");
        console.assert(destination.eq([
            { gen: 0, num: 17 },
            { name: "XYZ" },
            0,
            841.89,
            null,
        ]));
    }
    console.log(`${++i}: it gets a non-existent destination, from /Dests dictionary...`);
    {
        const destination = await pdfDocument.getDestination("non-existent-named-destination");
        console.assert(destination === undefined);
    }
    console.log(`${++i}: it gets destinations, from /Names (NameTree) dictionary...`);
    {
        const loadingTask = getDocument(buildGetDocumentParams("issue6204.pdf"));
        const pdfDoc = await loadingTask.promise;
        const destinations = await pdfDoc.getDestinations();
        console.assert(destinations.eq({
            "Page.1": [{ num: 1, gen: 0 }, { name: "XYZ" }, 0, 375, null],
            "Page.2": [{ num: 6, gen: 0 }, { name: "XYZ" }, 0, 375, null],
        }));
        await loadingTask.destroy();
    }
    // console.log(`${++i}: it gets a destination, from /Names (NameTree) dictionary...`);
    // {
    //   const loadingTask = getDocument(buildGetDocumentParams("issue6204.pdf"));
    //   const pdfDoc = await loadingTask.promise;
    //   const destination = await pdfDoc.getDestination("Page.1");
    //   console.log(destination);
    //   console.assert( destination!.eq([
    //     { num: 1, gen: 0 },
    //     { name: "XYZ" },
    //     0,
    //     375,
    //     null,
    //   ]));
    //   await loadingTask.destroy();
    // }
    // console.log(`${++i}: it gets a non-existent destination, from /Names (NameTree) dictionary...`);
    // {
    //   const loadingTask = getDocument(buildGetDocumentParams("issue6204.pdf"));
    //   const pdfDoc = await loadingTask.promise;
    //   const destination = await pdfDoc.getDestination(
    //     "non-existent-named-destination"
    //   );
    //   console.assert( destination === undefined );
    //   await loadingTask.destroy();
    // }
    // console.log(`${++i}: it gets a destination, from out-of-order /Names (NameTree) dictionary (issue 10272)...`);
    // {
    //   // if (isNodeJS) {
    //   //   pending("Linked test-cases are not supported in Node.js.");
    //   // }
    //   const loadingTask = getDocument(buildGetDocumentParams("issue10272.pdf"));
    //   const pdfDoc = await loadingTask.promise;
    //   const destination = await pdfDoc.getDestination("link_1");
    //   console.assert( destination!.eq([
    //     { num: 17, gen: 0 },
    //     { name: "XYZ" },
    //     69,
    //     125,
    //     0,
    //   ]));
    //   await loadingTask.destroy();
    // }
    // console.log(`${++i}: it gets a destination, from /Names (NameTree) dictionary with keys using PDFDocEncoding (issue 14847)...`);
    // {
    //   const loadingTask = getDocument( buildGetDocumentParams("issue14847.pdf"));
    //   const pdfDoc = await loadingTask.promise;
    //   const destination = await pdfDoc.getDestination("index");
    //   console.log(destination);
    //   console.assert( destination!.eq([
    //     { num: 10, gen: 0 },
    //     { name: "XYZ" },
    //     85.039,
    //     728.504,
    //     null,
    //   ]));
    //   await loadingTask.destroy();
    // }
    // console.log(`${++i}: it gets non-string destination...`);
    // {
    //   let numberPromise:Promise<any> = pdfDocument.getDestination(<any>4.3);
    //   let booleanPromise:Promise<any> = pdfDocument.getDestination(<any>true);
    //   let arrayPromise:Promise<any> = pdfDocument.getDestination(<any>[
    //     { num: 17, gen: 0 },
    //     { name: "XYZ" },
    //     0,
    //     841.89,
    //     null,
    //   ]);
    //   numberPromise = numberPromise.then(
    //     () => {
    //       throw new Error("shall fail for non-string destination.");
    //     },
    //     reason => {
    //       console.assert( reason instanceof Error );
    //     }
    //   );
    //   booleanPromise = booleanPromise.then(
    //     () => {
    //       throw new Error("shall fail for non-string destination.");
    //     },
    //     reason => {
    //       console.assert( reason instanceof Error );
    //     }
    //   );
    //   arrayPromise = arrayPromise.then(
    //     () => {
    //       throw new Error("shall fail for non-string destination.");
    //     },
    //     reason => {
    //       console.assert( reason instanceof Error );
    //     }
    //   );
    //   await Promise.all([numberPromise, booleanPromise, arrayPromise]);
    // }
    console.log(`${++i}: it gets non-existent page labels...`);
    {
        const pageLabels = await pdfDocument.getPageLabels();
        console.assert(pageLabels === undefined);
    }
    console.log(`${++i}: it gets page labels...`);
    {
        // PageLabels with Roman/Arabic numerals.
        const loadingTask0 = getDocument(buildGetDocumentParams("bug793632.pdf"));
        const promise0 = loadingTask0.promise.then(pdfDoc => pdfDoc.getPageLabels());
        // PageLabels with only a label prefix.
        const loadingTask1 = getDocument(buildGetDocumentParams("issue1453.pdf"));
        const promise1 = loadingTask1.promise.then(pdfDoc => pdfDoc.getPageLabels());
        // PageLabels identical to standard page numbering.
        const loadingTask2 = getDocument(buildGetDocumentParams("rotation.pdf"));
        const promise2 = loadingTask2.promise.then(pdfDoc => pdfDoc.getPageLabels());
        // PageLabels with bad "Prefix" entries.
        const loadingTask3 = getDocument(buildGetDocumentParams("bad-PageLabels.pdf"));
        const promise3 = loadingTask3.promise.then(pdfDoc => pdfDoc.getPageLabels());
        const pageLabels = await Promise.all([
            promise0,
            promise1,
            promise2,
            promise3,
        ]);
        console.assert(pageLabels[0].eq(["i", "ii", "iii", "1"]));
        console.assert(pageLabels[1].eq(["Front Page1"]));
        console.assert(pageLabels[2].eq(["1", "2"]));
        console.assert(pageLabels[3].eq(["X3"]));
        await Promise.all([
            loadingTask0.destroy(),
            loadingTask1.destroy(),
            loadingTask2.destroy(),
            loadingTask3.destroy(),
        ]);
    }
    console.log(`${++i}: it gets default page layout...`);
    {
        const loadingTask = getDocument(buildGetDocumentParams("tracemonkey.pdf"));
        const pdfDoc = await loadingTask.promise;
        const pageLayout = await pdfDoc.getPageLayout();
        console.assert(pageLayout === undefined);
        await loadingTask.destroy();
    }
    console.log(`${++i}: it gets non-default page layout...`);
    {
        const pageLayout = await pdfDocument.getPageLayout();
        console.assert(pageLayout === PageLayout.SinglePage);
    }
    console.log(`${++i}: it gets default page mode...`);
    {
        const loadingTask = getDocument(buildGetDocumentParams("tracemonkey.pdf"));
        const pdfDoc = await loadingTask.promise;
        const pageMode = await pdfDoc.getPageMode();
        console.assert(pageMode === PageMode.UseNone);
        await loadingTask.destroy();
    }
    console.log(`${++i}: it gets non-default page mode...`);
    {
        const pageMode = await pdfDocument.getPageMode();
        console.assert(pageMode === PageMode.UseOutlines);
    }
    console.log(`${++i}: it gets default viewer preferences...`);
    {
        const loadingTask = getDocument(buildGetDocumentParams("tracemonkey.pdf"));
        const pdfDoc = await loadingTask.promise;
        const prefs = await pdfDoc.getViewerPreferences();
        console.assert(prefs === undefined);
        await loadingTask.destroy();
    }
    console.log(`${++i}: it gets non-default viewer preferences...`);
    {
        const prefs = await pdfDocument.getViewerPreferences();
        console.assert(prefs.eq({ Direction: "L2R" }));
    }
    console.log(`${++i}: it gets default open action...`);
    {
        const loadingTask = getDocument(buildGetDocumentParams("tracemonkey.pdf"));
        const pdfDoc = await loadingTask.promise;
        const openAction = await pdfDoc.getOpenAction();
        console.assert(openAction === undefined);
        await loadingTask.destroy();
    }
    console.log(`${++i}: it gets non-default open action (with destination)...`);
    {
        const openAction = await pdfDocument.getOpenAction();
        console.assert(openAction.dest.eq([
            { num: 15, gen: 0 },
            { name: "FitH" },
            null,
        ]));
        console.assert(openAction.action === undefined);
    }
    console.log(`${++i}: it gets non-default open action (with Print action)...`);
    {
        // PDF document with "Print" Named action in the OpenAction dictionary.
        const loadingTask1 = getDocument(buildGetDocumentParams("bug1001080.pdf"));
        // PDF document with "Print" Named action in the OpenAction dictionary,
        // but the OpenAction dictionary is missing the `Type` entry.
        const loadingTask2 = getDocument(buildGetDocumentParams("issue11442_reduced.pdf"));
        const promise1 = loadingTask1.promise
            .then(pdfDoc => pdfDoc.getOpenAction())
            .then(openAction => {
            console.assert(openAction.dest == undefined);
            console.assert(openAction.action === "Print");
            return loadingTask1.destroy();
        });
        const promise2 = loadingTask2.promise
            .then(pdfDoc => pdfDoc.getOpenAction())
            .then(openAction => {
            console.assert(openAction.dest === undefined);
            console.assert(openAction.action === "Print");
            return loadingTask2.destroy();
        });
        await Promise.all([promise1, promise2]);
    }
    // console.log(`${++i}: it gets non-existent attachments...`);
    // {
    //   const attachments = await pdfDocument.getAttachments();
    //   console.assert( attachments === undefined );
    // }
    // console.log(`${++i}: it gets attachments...`);
    // {
    //   const loadingTask = getDocument(buildGetDocumentParams("attachment.pdf"));
    //   const pdfDoc = await loadingTask.promise;
    //   const attachments = await pdfDoc.getAttachments();
    //   const attachment = attachments["foo.txt"];
    //   console.assert( attachment.filename === "foo.txt" );
    //   console.assert( attachment.content).toEqual(
    //     new Uint8Array([98, 97, 114, 32, 98, 97, 122, 32, 10])
    //   );
    //   await loadingTask.destroy();
    // }
    console.log(`${++i}: it gets javascript...`);
    {
        const javascript = await pdfDocument.getJavaScript();
        console.assert(javascript === undefined);
    }
    // console.log(`${++i}: it gets javascript with printing instructions (JS action)...`);
    // {
    // }
    // console.log(`${++i}: it gets hasJSActions, in document without javaScript...`);
    // {
    // }
    // console.log(`${++i}: it gets hasJSActions, in document with javaScript...`);
    // {
    // }
    // console.log(`${++i}: it gets non-existent JSActions...`);
    // {
    // }
    // console.log(`${++i}: it gets JSActions...`);
    // {
    // }
    // console.log(`${++i}: it gets non-existent fieldObjects...`);
    // {
    // }
    // console.log(`${++i}: it gets fieldObjects...`);
    // {
    //   const loadingTask = getDocument(buildGetDocumentParams("js-authors.pdf"));
    //   const pdfDoc = await loadingTask.promise;
    //   const fieldObjects = await pdfDoc.getFieldObjects();
    //   console.assert( fieldObjects!.eq({
    //     Text1: [
    //       {
    //         id: "25R",
    //         value: "",
    //         defaultValue: "",
    //         multiline: false,
    //         password: false,
    //         charLimit: null,
    //         comb: false,
    //         editable: true,
    //         hidden: false,
    //         name: "Text1",
    //         rect: [24.1789, 719.66, 432.22, 741.66],
    //         actions: null,
    //         page: 0,
    //         strokeColor: null,
    //         fillColor: null,
    //         type: "text",
    //       },
    //     ],
    //     Button1: [
    //       {
    //         id: "26R",
    //         value: "Off",
    //         defaultValue: null,
    //         exportValues: undefined,
    //         editable: true,
    //         name: "Button1",
    //         rect: [455.436, 719.678, 527.436, 739.678],
    //         hidden: false,
    //         actions: {
    //           Action: [
    //             `this.getField("Text1").value = this.info.authors.join("::");`,
    //           ],
    //         },
    //         page: 0,
    //         strokeColor: null,
    //         fillColor: new Uint8ClampedArray([192, 192, 192]),
    //         type: "button",
    //       },
    //     ],
    //   }));
    //   await loadingTask.destroy();
    // }
    // console.log(`${++i}: it gets non-existent calculationOrder...`);
    // {
    // }
    // console.log(`${++i}: it gets calculationOrder...`);
    // {
    // }
    console.log(`${++i}: it gets non-existent outline...`);
    {
        const loadingTask = getDocument(buildGetDocumentParams("tracemonkey.pdf"));
        const pdfDoc = await loadingTask.promise;
        const outline = await pdfDoc.getOutline();
        console.assert(outline === undefined);
        await loadingTask.destroy();
    }
    console.log(`${++i}: it gets outline...`);
    {
        const outline = await pdfDocument.getOutline();
        // Two top level entries.
        console.assert(Array.isArray(outline));
        console.assert(outline.length === 2);
        // Make sure some basic attributes are set.
        const outlineItem = outline[1];
        console.assert(outlineItem.title === "Chapter 1");
        console.assert(Array.isArray(outlineItem.dest));
        console.assert(outlineItem.url === undefined);
        console.assert(outlineItem.unsafeUrl === undefined);
        console.assert(outlineItem.newWindow === undefined);
        console.assert(outlineItem.bold);
        console.assert(!outlineItem.italic);
        console.assert(outlineItem.color.eq(new Uint8ClampedArray([0, 64, 128])));
        console.assert(outlineItem.items.length === 1);
        console.assert(outlineItem.items[0].title === "Paragraph 1.1");
    }
    console.log(`${++i}: it gets outline containing a URL...`);
    {
        const loadingTask = getDocument(buildGetDocumentParams("issue3214.pdf"));
        const pdfDoc = await loadingTask.promise;
        const outline = await pdfDoc.getOutline();
        console.assert(Array.isArray(outline));
        console.assert(outline.length === 5);
        const outlineItemTwo = outline[2];
        console.assert(typeof outlineItemTwo.title === "string");
        console.assert(outlineItemTwo.dest === undefined);
        console.assert(outlineItemTwo.url === "http://google.com/");
        console.assert(outlineItemTwo.unsafeUrl === "http://google.com");
        console.assert(outlineItemTwo.newWindow === undefined);
        const outlineItemOne = outline[1];
        console.assert(!outlineItemOne.bold);
        console.assert(outlineItemOne.italic);
        console.assert(outlineItemOne.color.eq(new Uint8ClampedArray([0, 0, 0])));
        await loadingTask.destroy();
    }
    // console.log(`${++i}: it gets outline, with dest-strings using PDFDocEncoding (issue 14864)...`);
    // {
    //   // if (isNodeJS) {
    //   //   pending("Linked test-cases are not supported in Node.js.");
    //   // }
    //   const loadingTask = getDocument( buildGetDocumentParams("issue14864.pdf"));
    //   const pdfDoc = await loadingTask.promise;
    //   const outline = await pdfDoc.getOutline();
    //   console.assert( Array.isArray(outline) );
    //   console.assert( outline!.length === 6 );
    //   console.log(outline![4])
    //   console.assert( outline![4].eq({
    //     dest: "Händel -- Halle🎆lujah",
    //     url: null,
    //     unsafeUrl: undefined,
    //     newWindow: undefined,
    //     title: "Händel -- Halle🎆lujah",
    //     color: new Uint8ClampedArray([0, 0, 0]),
    //     count: undefined,
    //     bold: false,
    //     italic: false,
    //     items: [],
    //   }));
    //   await loadingTask.destroy();
    // }
    console.log(`${++i}: it gets outline with non-displayable chars...`);
    {
        const loadingTask = getDocument(buildGetDocumentParams("issue14267.pdf"));
        const pdfDoc = await loadingTask.promise;
        const outline = await pdfDoc.getOutline();
        console.assert(Array.isArray(outline));
        console.assert(outline.length === 1);
        const outlineItem = outline[0];
        console.assert(outlineItem.title === "hello\x11world");
        await loadingTask.destroy();
    }
    console.log(`${++i}: it gets non-existent permissions...`);
    {
        const permissions = await pdfDocument.getPermissions();
        console.assert(permissions === undefined);
    }
    console.log(`${++i}: it gets permissions...`);
    {
        // Editing not allowed.
        const loadingTask0 = getDocument(buildGetDocumentParams("issue9972-1.pdf"));
        const promise0 = loadingTask0.promise.then(pdfDoc => pdfDoc.getPermissions());
        // Printing not allowed.
        const loadingTask1 = getDocument(buildGetDocumentParams("issue9972-2.pdf"));
        const promise1 = loadingTask1.promise.then(pdfDoc => pdfDoc.getPermissions());
        // Copying not allowed.
        const loadingTask2 = getDocument(buildGetDocumentParams("issue9972-3.pdf"));
        const promise2 = loadingTask2.promise.then(pdfDoc => pdfDoc.getPermissions());
        const totalPermissionCount = $enum(PermissionFlag).length;
        const permissions = await Promise.all([promise0, promise1, promise2]);
        console.assert(permissions[0].length === totalPermissionCount - 1);
        console.assert(!permissions[0].includes(PermissionFlag.MODIFY_CONTENTS));
        console.assert(permissions[1].length === totalPermissionCount - 2);
        console.assert(!permissions[1].includes(PermissionFlag.PRINT));
        console.assert(!permissions[1].includes(PermissionFlag.PRINT_HIGH_QUALITY));
        console.assert(permissions[2].length === totalPermissionCount - 1);
        console.assert(!permissions[2].includes(PermissionFlag.COPY));
        await Promise.all([
            loadingTask0.destroy(),
            loadingTask1.destroy(),
            loadingTask2.destroy(),
        ]);
    }
    console.log(`${++i}: it gets metadata...`);
    {
        const { info, metadata, contentDispositionFilename, contentLength } = await pdfDocument.getMetadata();
        console.assert(info.Title === "Basic API Test");
        // Custom, non-standard, information dictionary entries.
        console.assert(info.Custom === undefined);
        // The following are PDF.js specific, non-standard, properties.
        console.assert(info.PDFFormatVersion === "1.7");
        console.assert(info.Language === "en");
        console.assert(info.EncryptFilterName === undefined);
        console.assert(info.IsLinearized === false);
        console.assert(info.IsAcroFormPresent === false);
        console.assert(info.IsXFAPresent === false);
        console.assert(info.IsCollectionPresent === false);
        console.assert(info.IsSignaturesPresent === false);
        console.assert(metadata instanceof Metadata);
        console.assert(metadata.get("dc:title") === "Basic API Test");
        console.assert(contentDispositionFilename === undefined);
        console.assert(contentLength === basicApiFileLength);
    }
    console.log(`${++i}: it gets metadata, with custom info dict entries...`);
    {
        const loadingTask = getDocument(buildGetDocumentParams("tracemonkey.pdf"));
        const pdfDoc = await loadingTask.promise;
        const { info, metadata, contentDispositionFilename, contentLength } = await pdfDoc.getMetadata();
        console.assert(info.Creator === "TeX");
        console.assert(info.Producer === "pdfeTeX-1.21a");
        console.assert(info.CreationDate === "D:20090401163925-07'00'");
        // Custom, non-standard, information dictionary entries.
        const custom = info.Custom;
        console.assert(typeof custom === "object" && custom !== undefined);
        console.assert(custom["PTEX.Fullbanner"] ===
            "This is pdfeTeX, " +
                "Version 3.141592-1.21a-2.2 (Web2C 7.5.4) kpathsea version 3.5.6");
        // The following are PDF.js specific, non-standard, properties.
        console.assert(info.PDFFormatVersion === "1.4");
        console.assert(info.Language === undefined);
        console.assert(info.EncryptFilterName === undefined);
        console.assert(info.IsLinearized === false);
        console.assert(info.IsAcroFormPresent === false);
        console.assert(info.IsXFAPresent === false);
        console.assert(info.IsCollectionPresent === false);
        console.assert(info.IsSignaturesPresent === false);
        console.assert(metadata === undefined);
        console.assert(contentDispositionFilename === undefined);
        console.assert(contentLength === 1016315);
        await loadingTask.destroy();
    }
    console.log(`${++i}: it gets metadata, with missing PDF header (bug 1606566)...`);
    {
        const loadingTask = getDocument(buildGetDocumentParams("bug1606566.pdf"));
        const pdfDoc = await loadingTask.promise;
        const { info, metadata, contentDispositionFilename, contentLength } = await pdfDoc.getMetadata();
        // Custom, non-standard, information dictionary entries.
        console.assert(info.Custom === undefined);
        // The following are PDF.js specific, non-standard, properties.
        console.assert(info.PDFFormatVersion === undefined);
        console.assert(info.Language === undefined);
        console.assert(info.EncryptFilterName === undefined);
        console.assert(info.IsLinearized === false);
        console.assert(info.IsAcroFormPresent === false);
        console.assert(info.IsXFAPresent === false);
        console.assert(info.IsCollectionPresent === false);
        console.assert(info.IsSignaturesPresent === false);
        console.assert(metadata === undefined);
        console.assert(contentDispositionFilename === undefined);
        console.assert(contentLength === 624);
        await loadingTask.destroy();
    }
    console.log(`${++i}: it gets metadata, with corrupt /Metadata XRef entry...`);
    {
        const loadingTask = getDocument(buildGetDocumentParams("PDFBOX-3148-2-fuzzed.pdf"));
        const pdfDoc = await loadingTask.promise;
        const { info, metadata, contentDispositionFilename, contentLength } = await pdfDoc.getMetadata();
        // Custom, non-standard, information dictionary entries.
        console.assert(info.Custom === undefined);
        // The following are PDF.js specific, non-standard, properties.
        console.assert(info.PDFFormatVersion === "1.6");
        console.assert(info.Language === undefined);
        console.assert(info.EncryptFilterName === undefined);
        console.assert(!info.IsLinearized);
        console.assert(info.IsAcroFormPresent);
        console.assert(!info.IsXFAPresent);
        console.assert(!info.IsCollectionPresent);
        console.assert(!info.IsSignaturesPresent);
        console.assert(metadata === undefined);
        console.assert(contentDispositionFilename === undefined);
        console.assert(contentLength === 244351);
        await loadingTask.destroy();
    }
    console.log(`${++i}: it gets markInfo...`);
    {
        const loadingTask = getDocument(buildGetDocumentParams("annotation-line.pdf"));
        const pdfDoc = await loadingTask.promise;
        const markInfo = await pdfDoc.getMarkInfo();
        console.assert(markInfo.Marked === true);
        console.assert(markInfo.UserProperties === false);
        console.assert(markInfo.Suspects === false);
        await loadingTask.destroy();
    }
    console.log(`${++i}: it gets data...`);
    {
        const data = await pdfDocument.getData();
        console.assert(data instanceof Uint8Array);
        console.assert(data.length === basicApiFileLength);
    }
    console.log(`${++i}: it gets download info...`);
    {
        const downloadInfo = await pdfDocument.getDownloadInfo();
        console.assert(downloadInfo.eq({ length: basicApiFileLength }));
    }
    console.log(`${++i}: it gets document stats...`);
    {
        const stats = pdfDocument.stats;
        console.assert(stats === undefined);
    }
    console.log(`${++i}: it cleans up document resources...`);
    {
        await pdfDocument.cleanup();
    }
    console.log(`${++i}: it checks that fingerprints are unique...`);
    {
        const loadingTask1 = getDocument(buildGetDocumentParams("issue4436r.pdf"));
        const loadingTask2 = getDocument(buildGetDocumentParams("issue4575.pdf"));
        const data = await Promise.all([
            loadingTask1.promise,
            loadingTask2.promise,
        ]);
        const fingerprints1 = data[0].fingerprints;
        const fingerprints2 = data[1].fingerprints;
        console.assert(fingerprints1 !== fingerprints2);
        console.assert(fingerprints1.eq(["657428c0628e329f9a281fb6d2d092d4", undefined]));
        console.assert(fingerprints2.eq(["04c7126b34a46b6d4d6e7a1eff7edcb6", undefined]));
        await Promise.all([loadingTask1.destroy(), loadingTask2.destroy()]);
    }
    console.log(`${++i}: it writes a value in an annotation, save the pdf and load it...`);
    {
        let loadingTask = getDocument(buildGetDocumentParams("evaljs.pdf"));
        let pdfDoc = await loadingTask.promise;
        const value = "Hello World";
        pdfDoc.annotationStorage.setValue("55R", { value });
        const data = await pdfDoc.saveDocument();
        await loadingTask.destroy();
        loadingTask = getDocument(data);
        pdfDoc = await loadingTask.promise;
        const pdfPage = await pdfDoc.getPage(1);
        const annotations = await pdfPage.getAnnotations();
        const field = annotations.find(annotation => annotation.id === "55R");
        console.assert(!!field);
        console.assert(field.fieldValue === value);
        await loadingTask.destroy();
    }
    // console.log("%c>>>>>>> test Cross-origin >>>>>>>",`color:${css_1}`);
    // {
    //   interface Options
    //   {
    //     withCredentials?:boolean;
    //   }
    //   let loadingTask:PDFDocumentLoadingTask | undefined;
    //   function _checkCanLoad(
    //      expectSuccess:boolean, filename:string , options?:BuildGetDocumentParamsOptions ) 
    //   {
    //     // if (isNodeJS) {
    //     //   pending("Cannot simulate cross-origin requests in Node.js");
    //     // }
    //     const params = buildGetDocumentParams(filename, options);
    //     const url = new URL( <any>params.url );
    //     if( url.hostname === "localhost" )
    //     {
    //       url.hostname = "127.0.0.1";
    //     } 
    //     else if( (<URL>params.url).hostname === "127.0.0.1" )
    //     {
    //       url.hostname = "localhost";
    //     } 
    //     else {
    //       console.warn("Can only run cross-origin test on localhost!");
    //     }
    //     params.url = url.href;
    //     loadingTask = getDocument(params);
    //     return loadingTask.promise
    //       .then( pdf => pdf.destroy() )
    //       .then(
    //         () => {
    //           console.assert( expectSuccess === true );
    //         },
    //         error => {
    //           if (expectSuccess) 
    //           {
    //             // For ease of debugging.
    //             console.assert( error === "There should not be any error" );
    //           }
    //           console.assert( expectSuccess === false );
    //         }
    //       );
    //   }
    //   function testCanLoad( filename:string, options?:BuildGetDocumentParamsOptions ) 
    //   {
    //     return _checkCanLoad(true, filename, options);
    //   }
    //   function testCannotLoad( filename:string, options?:BuildGetDocumentParamsOptions ) 
    //   {
    //     return _checkCanLoad(false, filename, options);
    //   }
    //   async function afterEach() 
    //   {
    //     if( loadingTask && !loadingTask.destroyed ) 
    //     {
    //       await loadingTask.destroy();
    //     }
    //   }
    //   console.log("server disallows cors...");
    //   {
    //     await testCannotLoad("basicapi.pdf");
    //   }
    //   await afterEach();
    // }
    await pdfLoadingTask.destroy();
}
//! unsynchronized
console.log("%c>>>>>>> test Page >>>>>>>", `color:${css_1}`);
{
    let pdfLoadingTask = getDocument(basicApiGetDocumentParams);
    let pdfDocument = await pdfLoadingTask.promise;
    let page = await pdfDocument.getPage(1);
    let i = 0; // 37
    console.log(`${++i}: it gets page number...`);
    {
        console.assert(page.pageNumber === 1);
    }
    console.log(`${++i}: it gets rotate...`);
    {
        console.assert(page.rotate === 0);
    }
    console.log(`${++i}: it gets ref...`);
    {
        console.assert(page.ref.eq({ num: 15, gen: 0 }));
    }
    console.log(`${++i}: it gets userUnit...`);
    {
        console.assert(Number.apxE(page.userUnit, 1.0));
    }
    console.log(`${++i}: it gets view...`);
    {
        console.assert(page.view.eq([0, 0, 595.28, 841.89]));
    }
    console.log(`${++i}: it gets view, with empty/invalid bounding boxes...`);
    {
        const viewLoadingTask = getDocument(buildGetDocumentParams("boundingBox_invalid.pdf"));
        const pdfDoc = await viewLoadingTask.promise;
        const numPages = pdfDoc.numPages;
        console.assert(numPages === 3);
        const viewPromises = [];
        for (let i = 0; i < numPages; i++) {
            viewPromises[i] = pdfDoc.getPage(i + 1).then(pdfPage => {
                return pdfPage.view;
            });
        }
        const [page1, page2, page3] = await Promise.all(viewPromises);
        console.assert(page1.eq([0, 0, 612, 792]));
        console.assert(page2.eq([0, 0, 800, 600]));
        console.assert(page3.eq([0, 0, 600, 800]));
        await viewLoadingTask.destroy();
    }
    console.log(`${++i}: it gets viewport...`);
    {
        const viewport = page.getViewport({ scale: 1.5, rotation: 90 });
        console.assert(viewport instanceof PageViewport);
        console.assert(viewport.viewBox.eq(page.view));
        console.assert(viewport.scale === 1.5);
        console.assert(viewport.rotation === 90);
        console.assert(viewport.transform.eq([0, 1.5, 1.5, 0, 0, 0]));
        console.assert(viewport.width === 1262.835);
        console.assert(viewport.height === 892.92);
    }
    console.log(`${++i}: it gets viewport with "offsetX/offsetY" arguments...`);
    {
        const viewport = page.getViewport({
            scale: 1,
            rotation: 0,
            offsetX: 100,
            offsetY: -100,
        });
        console.assert(viewport instanceof PageViewport);
        console.assert(viewport.transform.eq([1, 0, 0, -1, 100, 741.89]));
    }
    console.log(`${++i}: it gets viewport respecting "dontFlip" argument...`);
    {
        const scale = 1, rotation = 0;
        const viewport = page.getViewport({ scale, rotation });
        console.assert(viewport instanceof PageViewport);
        const dontFlipViewport = page.getViewport({
            scale,
            rotation,
            dontFlip: true,
        });
        console.assert(dontFlipViewport instanceof PageViewport);
        console.assert(!dontFlipViewport.eq(viewport));
        console.assert(dontFlipViewport.eq(viewport.clone({ dontFlip: true })));
        console.assert(viewport.transform.eq([1, 0, 0, -1, 0, 841.89]));
        console.assert(dontFlipViewport.transform.eq([1, 0, -0, 1, 0, 0]));
    }
    console.log(`${++i}: it gets viewport with invalid rotation...`);
    {
        try {
            page.getViewport({ scale: 1, rotation: 45 });
            console.assert(!!0, "Shouldn't get here.");
        }
        catch (reason) {
            console.assert(reason.message ===
                "PageViewport: Invalid rotation, must be a multiple of 90 degrees.");
        }
    }
    console.log(`${++i}: it gets annotations...`);
    {
        const defaultPromise = page.getAnnotations().then(data => {
            console.assert(data.length === 4);
        });
        const anyPromise = page
            .getAnnotations({ intent: "any" })
            .then(data => {
            console.assert(data.length === 4);
        });
        const displayPromise = page
            .getAnnotations({ intent: "display" })
            .then(data => {
            console.assert(data.length === 4);
        });
        const printPromise = page
            .getAnnotations({ intent: "print" })
            .then(data => {
            console.assert(data.length === 4);
        });
        await Promise.all([
            defaultPromise,
            anyPromise,
            displayPromise,
            printPromise,
        ]);
    }
    console.log(`${++i}: it gets annotations containing relative URLs (bug 766086)...`);
    {
        const filename = "bug766086.pdf";
        const defaultLoadingTask = getDocument(buildGetDocumentParams(filename));
        const defaultPromise = defaultLoadingTask.promise.then(pdfDoc => pdfDoc.getPage(1).then(pdfPage => pdfPage.getAnnotations()));
        const docBaseUrlLoadingTask = getDocument(buildGetDocumentParams(filename, {
            docBaseUrl: "http://www.example.com/test/pdfs/qwerty.pdf",
        }));
        const docBaseUrlPromise = docBaseUrlLoadingTask.promise.then(pdfDoc => pdfDoc.getPage(1).then(pdfPage => pdfPage.getAnnotations()));
        const invalidDocBaseUrlLoadingTask = getDocument(buildGetDocumentParams(filename, {
            docBaseUrl: "qwerty.pdf",
        }));
        const invalidDocBaseUrlPromise = invalidDocBaseUrlLoadingTask.promise.then(pdfDoc => pdfDoc.getPage(1).then(pdfPage => pdfPage.getAnnotations()));
        const [defaultAnnotations, docBaseUrlAnnotations, invalidDocBaseUrlAnnotations,] = await Promise.all([
            defaultPromise,
            docBaseUrlPromise,
            invalidDocBaseUrlPromise,
        ]);
        console.assert(defaultAnnotations[0].url === undefined);
        console.assert(defaultAnnotations[0].unsafeUrl ===
            "../../0021/002156/215675E.pdf#15");
        console.assert(docBaseUrlAnnotations[0].url ===
            "http://www.example.com/0021/002156/215675E.pdf#15");
        console.assert(docBaseUrlAnnotations[0].unsafeUrl ===
            "../../0021/002156/215675E.pdf#15");
        console.assert(invalidDocBaseUrlAnnotations[0].url === undefined);
        console.assert(invalidDocBaseUrlAnnotations[0].unsafeUrl ===
            "../../0021/002156/215675E.pdf#15");
        await Promise.all([
            defaultLoadingTask.destroy(),
            docBaseUrlLoadingTask.destroy(),
            invalidDocBaseUrlLoadingTask.destroy(),
        ]);
    }
    console.log(`${++i}: it gets text content...`);
    {
        const defaultPromise = page.getTextContent();
        const parametersPromise = page.getTextContent({
            disableCombineTextItems: true,
        });
        const data = await Promise.all([defaultPromise, parametersPromise]);
        console.assert(!!data[0].items);
        console.assert(data[0].items.length === 15);
        console.assert(!!data[0].styles);
        const page1 = mergeText(data[0].items);
        console.assert(page1 === `Table Of Content
Chapter 1 .......................................................... 2
Paragraph 1.1 ...................................................... 3
page 1 / 3`);
        console.assert(!!data[1].items);
        console.assert(data[1].items.length === 6);
        console.assert(!!data[1].styles);
    }
    console.log(`${++i}: it gets text content, with correct properties (issue 8276)...`);
    {
        const loadingTask = getDocument(buildGetDocumentParams("issue8276_reduced.pdf"));
        const pdfDoc = await loadingTask.promise;
        const pdfPage = await pdfDoc.getPage(1);
        const { items, styles } = await pdfPage.getTextContent();
        console.assert(items.length === 1);
        // Font name will a random object id.
        const fontName = items[0].fontName;
        console.assert(Object.keys(styles).eq([fontName]));
        console.assert(items[0].eq({
            dir: "ltr",
            fontName,
            height: 18,
            str: "Issue 8276",
            transform: [18, 0, 0, 18, 441.81, 708.4499999999999],
            width: 77.49,
            hasEOL: false,
        }));
        console.assert(styles[fontName].eq({
            fontFamily: "serif",
            // `useSystemFonts` has a different value in web environments
            // and in Node.js.
            ascent: 0.683,
            descent: -0.217,
            vertical: false,
        }));
        await loadingTask.destroy();
    }
    console.log(`${++i}: it gets text content, with no extra spaces (issue 13226)...`);
    {
        const loadingTask = getDocument(buildGetDocumentParams("issue13226.pdf"));
        const pdfDoc = await loadingTask.promise;
        const pdfPage = await pdfDoc.getPage(1);
        const { items } = await pdfPage.getTextContent();
        const text = mergeText(items);
        console.assert(text ===
            "Mitarbeiterinnen und Mitarbeiter arbeiten in über 100 Ländern engagiert im Dienste");
        await loadingTask.destroy();
    }
    console.log(`${++i}: it gets text content, with merged spaces (issue 13201)...`);
    {
        const loadingTask = getDocument(buildGetDocumentParams("issue13201.pdf"));
        const pdfDoc = await loadingTask.promise;
        const pdfPage = await pdfDoc.getPage(1);
        const { items } = await pdfPage.getTextContent();
        const text = mergeText(items);
        console.assert(text.includes("Abstract. A purely peer-to-peer version of electronic cash would allow online"));
        console.assert(text.includes("avoid mediating disputes. The cost of mediation increases transaction costs, limiting the"));
        console.assert(text.includes("system is secure as long as honest nodes collectively control more CPU power than any"));
        await loadingTask.destroy();
    }
    //   console.log(`${++i}: it gets text content, with no spaces between letters of words (issue 11913)...`);
    //   {
    //     const loadingTask = getDocument(buildGetDocumentParams("issue11913.pdf"));
    //     const pdfDoc = await loadingTask.promise;
    //     const pdfPage = await pdfDoc.getPage(1);
    //     const { items } = await pdfPage.getTextContent();
    //     const text = mergeText( <TextItem[]>items );
    //     console.assert(
    //       text.includes(
    //         "1. The first of these cases arises from the tragic handicap which has blighted the life of the Plaintiff, and from the response of the"
    //       )
    //     );
    //     console.assert(
    //       text.includes(
    //         "argued in this Court the appeal raises narrower, but important, issues which may be summarised as follows:-"
    //       )
    //     );
    //     await loadingTask.destroy();
    //   }
    //   console.log(`${++i}: it gets text content, with merged spaces (issue 10900)...`);
    //   {
    //     const loadingTask = getDocument(buildGetDocumentParams("issue10900.pdf"));
    //     const pdfDoc = await loadingTask.promise;
    //     const pdfPage = await pdfDoc.getPage(1);
    //     const { items } = await pdfPage.getTextContent();
    //     const text = mergeText( <TextItem[]>items );
    //     console.assert(
    //       text.includes(`3 3 3 3
    // 851.5 854.9 839.3 837.5
    // 633.6 727.8 789.9 796.2
    // 1,485.1 1,582.7 1,629.2 1,633.7
    // 114.2 121.7 125.3 130.7
    // 13.0x 13.0x 13.0x 12.5x`)
    //     );
    //     await loadingTask.destroy();
    //   }
    console.log(`${++i}: it gets text content, with spaces (issue 10640)...`);
    {
        const loadingTask = getDocument(buildGetDocumentParams("issue10640.pdf"));
        const pdfDoc = await loadingTask.promise;
        const pdfPage = await pdfDoc.getPage(1);
        const { items } = await pdfPage.getTextContent();
        const text = mergeText(items);
        console.assert(text.includes(`Open Sans is a humanist sans serif typeface designed by Steve Matteson.
Open Sans was designed with an upright stress, open forms and a neu-
tral, yet friendly appearance. It was optimized for print, web, and mobile
interfaces, and has excellent legibility characteristics in its letterforms (see
figure \x81 on the following page). This font is available from the Google Font
Directory [\x81] as TrueType files licensed under the Apache License version \x82.\x80.
This package provides support for this font in LATEX. It includes Type \x81
versions of the fonts, converted for this package using FontForge from its
sources, for full support with Dvips.`));
        await loadingTask.destroy();
    }
    //   console.log(`${++i}: it gets text content, with negative spaces (bug 931481)...`);
    //   {
    //     // if (isNodeJS) {
    //     //   pending("Linked test-cases are not supported in Node.js.");
    //     // }
    //     const loadingTask = getDocument(buildGetDocumentParams("bug931481.pdf"));
    //     const pdfDoc = await loadingTask.promise;
    //     const pdfPage = await pdfDoc.getPage(1);
    //     const { items } = await pdfPage.getTextContent();
    //     const text = mergeText( <TextItem[]>items );
    //     console.assert(
    //       text.includes(`Kathrin Nachbaur
    // Die promovierte Juristin ist 1979 in Graz geboren und aufgewachsen. Nach
    // erfolgreichem Studienabschluss mit Fokus auf Europarecht absolvierte sie ein
    // Praktikum bei Magna International in Kanada in der Human Resources Abteilung.
    // Anschliessend wurde sie geschult in Human Resources, Arbeitsrecht und
    // Kommunikation, währenddessen sie auch an ihrem Doktorat im Wirtschaftsrecht
    // arbeitete. Seither arbeitete sie bei Magna International als Projekt Manager in der
    // Innovationsabteilung. Seit 2009 ist sie Frank Stronachs Büroleiterin in Österreich und
    // Kanada. Zusätzlich ist sie seit 2012 Vice President, Business Development der
    // Stronach Group und Vizepräsidentin und Institutsleiterin des Stronach Institut für
    // sozialökonomische Gerechtigkeit.`)
    //     );
    //     await loadingTask.destroy();
    //   }
    console.log(`${++i}: it gets text content, with invisible text marks (issue 9186)...`);
    {
        //
    }
    console.log(`${++i}: it gets text content, with beginbfrange operator handled correctly (bug 1627427)...`);
    {
        const loadingTask = getDocument(buildGetDocumentParams("bug1627427_reduced.pdf"));
        const pdfDoc = await loadingTask.promise;
        const pdfPage = await pdfDoc.getPage(1);
        const { items } = await pdfPage.getTextContent();
        const text = mergeText(items);
        console.assert(text ===
            "침하게 흐린 품이 눈이 올 듯하더니 눈은 아니 오고 얼다가 만 비가 추");
        await loadingTask.destroy();
    }
    console.log(`${++i}: it gets text content, and check that out-of-page text is not present (bug 1755201)...`);
    {
        //
    }
    console.log(`${++i}: it gets empty structure tree...`);
    {
        const tree = await page.getStructTree();
        console.assert(tree === undefined);
    }
    console.log(`${++i}: it gets simple structure tree...`);
    {
        const loadingTask = getDocument(buildGetDocumentParams("structure_simple.pdf"));
        const pdfDoc = await loadingTask.promise;
        const pdfPage = await pdfDoc.getPage(1);
        const tree = await pdfPage.getStructTree();
        console.assert(tree.eq({
            role: "Root",
            children: [
                {
                    role: "Document",
                    lang: "en-US",
                    children: [
                        {
                            role: "H1",
                            children: [
                                {
                                    role: "NonStruct",
                                    children: [{ type: "content", id: "page2R_mcid0" }],
                                },
                            ],
                        },
                        {
                            role: "P",
                            children: [
                                {
                                    role: "NonStruct",
                                    children: [{ type: "content", id: "page2R_mcid1" }],
                                },
                            ],
                        },
                        {
                            role: "H2",
                            children: [
                                {
                                    role: "NonStruct",
                                    children: [{ type: "content", id: "page2R_mcid2" }],
                                },
                            ],
                        },
                        {
                            role: "P",
                            children: [
                                {
                                    role: "NonStruct",
                                    children: [{ type: "content", id: "page2R_mcid3" }],
                                },
                            ],
                        },
                    ],
                },
            ],
        }));
        await loadingTask.destroy();
    }
    console.log(`${++i}: it gets operator list...`);
    {
        const operatorList = await page.getOperatorList();
        console.assert(operatorList.fnArray.length > 100);
        console.assert(operatorList.argsArray.length > 100);
        console.assert(operatorList.lastChunk === true);
    }
    // console.log(`${++i}: it gets operatorList with JPEG image (issue 4888)...`);
    // {
    //   const loadingTask = getDocument(buildGetDocumentParams("cmykjpeg.pdf"));
    //   const pdfDoc = await loadingTask.promise;
    //   const pdfPage = await pdfDoc.getPage(1);
    //   const operatorList = await pdfPage.getOperatorList();
    //   const imgIndex = operatorList.fnArray.indexOf(OPS.paintImageXObject);
    //   const imgArgs = operatorList.argsArray[imgIndex];
    //   const { data } = <ImgData>pdfPage.objs.get( (<any>imgArgs)[0] );
    //   console.assert( data instanceof Uint8ClampedArray );
    //   console.assert( data!.length > 90000 );
    //   await loadingTask.destroy();
    // }
    console.log(`${++i}: it gets operatorList, from corrupt PDF file (issue 8702), with/without ${"`stopAtErrors`"} set...`);
    {
        const loadingTask1 = getDocument(buildGetDocumentParams("issue8702.pdf", {
            stopAtErrors: false, // The default value.
        }));
        const loadingTask2 = getDocument(buildGetDocumentParams("issue8702.pdf", {
            stopAtErrors: true,
        }));
        const result1 = loadingTask1.promise.then(pdfDoc => pdfDoc.getPage(1).then(pdfPage => pdfPage.getOperatorList().then(opList => {
            console.assert(opList.fnArray.length > 100);
            console.assert(opList.argsArray.length > 100);
            console.assert(opList.lastChunk === true);
            return loadingTask1.destroy();
        })));
        const result2 = loadingTask2.promise.then(pdfDoc => pdfDoc.getPage(1).then(pdfPage => pdfPage.getOperatorList().then(opList => {
            console.assert(opList.fnArray.length === 0);
            console.assert(opList.argsArray.length === 0);
            console.assert(opList.lastChunk === true);
            return loadingTask2.destroy();
        })));
        await Promise.all([result1, result2]);
    }
    console.log(`${++i}: it gets operator list, containing Annotation-operatorLists...`);
    {
        const loadingTask = getDocument(buildGetDocumentParams("annotation-line.pdf"));
        const pdfDoc = await loadingTask.promise;
        const pdfPage = await pdfDoc.getPage(1);
        const operatorList = await pdfPage.getOperatorList();
        console.assert(operatorList.fnArray.length > 20);
        console.assert(operatorList.argsArray.length > 20);
        console.assert(operatorList.lastChunk === true);
        // The `getOperatorList` method, similar to the `render` method,
        // is supposed to include any existing Annotation-operatorLists.
        console.assert(operatorList.fnArray.includes(OPS.beginAnnotation));
        console.assert(operatorList.fnArray.includes(OPS.endAnnotation));
        await loadingTask.destroy();
    }
    console.log(`${++i}: it gets operator list, with ${"`annotationMode`"}-option...`);
    {
        const loadingTask = getDocument(buildGetDocumentParams("evaljs.pdf"));
        const pdfDoc = await loadingTask.promise;
        const pdfPage = await pdfDoc.getPage(2);
        pdfDoc.annotationStorage.setValue("30R", { value: "test" });
        pdfDoc.annotationStorage.setValue("31R", { value: true });
        const opListAnnotDisable = await pdfPage.getOperatorList({
            annotationMode: AnnotationMode.DISABLE,
        });
        console.assert(opListAnnotDisable.fnArray.length === 0);
        console.assert(opListAnnotDisable.argsArray.length === 0);
        console.assert(opListAnnotDisable.lastChunk === true);
        const opListAnnotEnable = await pdfPage.getOperatorList({
            annotationMode: AnnotationMode.ENABLE,
        });
        console.assert(opListAnnotEnable.fnArray.length > 150);
        console.assert(opListAnnotEnable.argsArray.length > 150);
        console.assert(opListAnnotEnable.lastChunk === true);
        const opListAnnotEnableForms = await pdfPage.getOperatorList({
            annotationMode: AnnotationMode.ENABLE_FORMS,
        });
        console.assert(opListAnnotEnableForms.fnArray.length > 40);
        console.assert(opListAnnotEnableForms.argsArray.length > 40);
        console.assert(opListAnnotEnableForms.lastChunk === true);
        const opListAnnotEnableStorage = await pdfPage.getOperatorList({
            annotationMode: AnnotationMode.ENABLE_STORAGE,
        });
        console.assert(opListAnnotEnableStorage.fnArray.length > 170);
        console.assert(opListAnnotEnableStorage.argsArray.length > 170);
        console.assert(opListAnnotEnableStorage.lastChunk === true);
        // Sanity check to ensure that the `annotationMode` is correctly applied.
        console.assert(opListAnnotDisable.fnArray.length < opListAnnotEnableForms.fnArray.length);
        console.assert(opListAnnotEnableForms.fnArray.length < opListAnnotEnable.fnArray.length);
        console.assert(opListAnnotEnable.fnArray.length < opListAnnotEnableStorage.fnArray.length);
        await loadingTask.destroy();
    }
    console.log(`${++i}: it gets operatorList, with page resources containing corrupt /CCITTFaxDecode data...`);
    {
        const loadingTask = getDocument(buildGetDocumentParams("poppler-90-0-fuzzed.pdf"));
        console.assert(loadingTask instanceof PDFDocumentLoadingTask);
        const pdfDoc = await loadingTask.promise;
        console.assert(pdfDoc.numPages === 16);
        const pdfPage = await pdfDoc.getPage(6);
        console.assert(pdfPage instanceof PDFPageProxy);
        const opList = await pdfPage.getOperatorList();
        console.assert(opList.fnArray.length > 25);
        console.assert(opList.argsArray.length > 25);
        console.assert(opList.lastChunk === true);
        await loadingTask.destroy();
    }
    console.log(`${++i}: it gets document stats after parsing page...`);
    {
        await page.getOperatorList();
        const stats = pdfDocument.stats;
        const expectedStreamTypes = {
            [StreamType.FLATE]: true,
        };
        const expectedFontTypes = {
            [FontType.TYPE1STANDARD]: true,
            [FontType.CIDFONTTYPE2]: true,
        };
        console.assert(eq(stats, {
            streamTypes: expectedStreamTypes,
            fontTypes: expectedFontTypes,
        }));
    }
    console.log(`${++i}: it gets page stats after parsing page, without ${"`pdfBug`"} set...`);
    {
        await page.getOperatorList();
        console.assert(page.stats === null);
    }
    // console.log(`${++i}: it gets page stats after parsing page, with ${"`pdfBug`"} set...`);
    // {
    //   const loadingTask = getDocument(
    //     buildGetDocumentParams(basicApiFileName, { pdfBug: true })
    //   );
    //   const pdfDoc = await loadingTask.promise;
    //   const pdfPage = await pdfDoc.getPage(1);
    //   await pdfPage.getOperatorList();
    //   const stats = pdfPage.stats;
    //   console.assert( stats instanceof StatTimer );
    //   console.assert( stats!.times.length === 1 );
    //   const [statEntry] = stats!.times;
    //   console.assert( statEntry.name === "Page Request" );
    //   console.assert( statEntry.end - statEntry.start >= 0 );
    //   await loadingTask.destroy();
    // }
    // console.log(`${++i}: it gets page stats after rendering page, with ${"`pdfBug`"} set...`);
    // {
    //   const loadingTask = getDocument(
    //     buildGetDocumentParams(basicApiFileName, { pdfBug: true })
    //   );
    //   const pdfDoc = await loadingTask.promise;
    //   const pdfPage = await pdfDoc.getPage(1);
    //   const viewport = pdfPage.getViewport({ scale: 1 });
    //   console.assert( viewport instanceof PageViewport );
    //   const canvasAndCtx = CanvasFactory.create(
    //     viewport.width,
    //     viewport.height
    //   );
    //   const renderTask = pdfPage.render({
    //     canvasContext: canvasAndCtx.context,
    //     canvasFactory: CanvasFactory,
    //     viewport,
    //   });
    //   console.assert( renderTask instanceof RenderTask );
    //   await renderTask.promise;
    //   const stats = pdfPage.stats;
    //   console.assert( stats instanceof StatTimer );
    //   console.assert( stats!.times.length === 3 );
    //   const [statEntryOne, statEntryTwo, statEntryThree] = stats!.times;
    //   console.assert( statEntryOne.name === "Page Request" );
    //   console.assert( statEntryOne.end - statEntryOne.start >= 0 );
    //   console.assert( statEntryTwo.name === "Rendering" );
    //   console.assert( statEntryTwo.end - statEntryTwo.start > 0 );
    //   console.assert( statEntryThree.name === "Overall" );
    //   console.assert( statEntryThree.end - statEntryThree.start > 0 );
    //   CanvasFactory.destroy(canvasAndCtx);
    //   await loadingTask.destroy();
    // }
    console.log(`${++i}: it cancels rendering of page...`);
    {
        const viewport = page.getViewport({ scale: 1 });
        console.assert(viewport instanceof PageViewport);
        const canvasAndCtx = CanvasFactory.create(viewport.width, viewport.height);
        const renderTask = page.render({
            canvasContext: canvasAndCtx.context,
            canvasFactory: CanvasFactory,
            viewport,
        });
        console.assert(renderTask instanceof RenderTask);
        renderTask.cancel();
        try {
            await renderTask.promise;
            console.assert(!!0, "Shouldn't get here.");
        }
        catch (reason) {
            console.assert(reason instanceof RenderingCancelledException);
            console.assert(reason.message === "Rendering cancelled, page 1");
            console.assert(reason.type === "canvas");
        }
        CanvasFactory.destroy(canvasAndCtx);
    }
    console.log(`${++i}: it re-renders page, using the same canvas, after cancelling rendering...`);
    {
        const viewport = page.getViewport({ scale: 1 });
        console.assert(viewport instanceof PageViewport);
        const canvasAndCtx = CanvasFactory.create(viewport.width, viewport.height);
        const renderTask = page.render({
            canvasContext: canvasAndCtx.context,
            canvasFactory: CanvasFactory,
            viewport,
        });
        console.assert(renderTask instanceof RenderTask);
        renderTask.cancel();
        try {
            await renderTask.promise;
            console.assert(!!0, "Shouldn't get here.");
        }
        catch (reason) {
            console.assert(reason instanceof RenderingCancelledException);
        }
        const reRenderTask = page.render({
            canvasContext: canvasAndCtx.context,
            canvasFactory: CanvasFactory,
            viewport,
        });
        console.assert(reRenderTask instanceof RenderTask);
        await reRenderTask.promise;
        CanvasFactory.destroy(canvasAndCtx);
    }
    console.log(`${++i}: multiple render() on the same canvas...`);
    {
        const optionalContentConfigPromise = pdfDocument.getOptionalContentConfig();
        const viewport = page.getViewport({ scale: 1 });
        console.assert(viewport instanceof PageViewport);
        const canvasAndCtx = CanvasFactory.create(viewport.width, viewport.height);
        const renderTask1 = page.render({
            canvasContext: canvasAndCtx.context,
            canvasFactory: CanvasFactory,
            viewport,
            optionalContentConfigPromise,
        });
        console.assert(renderTask1 instanceof RenderTask);
        const renderTask2 = page.render({
            canvasContext: canvasAndCtx.context,
            canvasFactory: CanvasFactory,
            viewport,
            optionalContentConfigPromise,
        });
        console.assert(renderTask2 instanceof RenderTask);
        await Promise.all([
            renderTask1.promise,
            renderTask2.promise.then(() => {
                console.assert(!!0, "Shouldn't get here.");
            }, reason => {
                // It fails because we are already using this canvas.
                console.assert(/multiple render\(\)/.test(reason.message));
            }),
        ]);
    }
    console.log(`${++i}: it cleans up document resources after rendering of page...`);
    {
        const loadingTask = getDocument(buildGetDocumentParams(basicApiFileName));
        const pdfDoc = await loadingTask.promise;
        const pdfPage = await pdfDoc.getPage(1);
        const viewport = pdfPage.getViewport({ scale: 1 });
        console.assert(viewport instanceof PageViewport);
        const canvasAndCtx = CanvasFactory.create(viewport.width, viewport.height);
        const renderTask = pdfPage.render({
            canvasContext: canvasAndCtx.context,
            canvasFactory: CanvasFactory,
            viewport,
        });
        console.assert(renderTask instanceof RenderTask);
        await renderTask.promise;
        await pdfDoc.cleanup();
        CanvasFactory.destroy(canvasAndCtx);
        await loadingTask.destroy();
    }
    console.log(`${++i}: it cleans up document resources during rendering of page...`);
    {
        const loadingTask = getDocument(buildGetDocumentParams("tracemonkey.pdf"));
        const pdfDoc = await loadingTask.promise;
        const pdfPage = await pdfDoc.getPage(1);
        const viewport = pdfPage.getViewport({ scale: 1 });
        console.assert(viewport instanceof PageViewport);
        const canvasAndCtx = CanvasFactory.create(viewport.width, viewport.height);
        const renderTask = pdfPage.render({
            canvasContext: canvasAndCtx.context,
            canvasFactory: CanvasFactory,
            viewport,
        });
        console.assert(renderTask instanceof RenderTask);
        // Ensure that clean-up runs during rendering.
        renderTask.onContinue = function (cont) {
            waitSome(cont);
        };
        try {
            await pdfDoc.cleanup();
            console.assert(!!0, "Shouldn't get here.");
        }
        catch (reason) {
            console.assert(reason instanceof Error);
            console.assert(reason.message ===
                "startCleanup: Page 1 is currently rendering.");
        }
        await renderTask.promise;
        CanvasFactory.destroy(canvasAndCtx);
        await loadingTask.destroy();
    }
    // console.log(`${++i}: it caches image resources at the document/page level as expected (issue 11878)...`);
    // {
    //   const { NUM_PAGES_THRESHOLD } = GlobalImageCache,
    //     EXPECTED_WIDTH = 2550,
    //     EXPECTED_HEIGHT = 3300;
    //   const loadingTask = getDocument(buildGetDocumentParams("issue11878.pdf"));
    //   const pdfDoc = await loadingTask.promise;
    //   let firstImgData:ImgData | undefined;
    //   for (let i = 1; i <= pdfDoc.numPages; i++) 
    //   {
    //     const pdfPage = await pdfDoc.getPage(i);
    //     const opList = await pdfPage.getOperatorList();
    //     const { commonObjs, objs } = pdfPage;
    //     const imgIndex = opList.fnArray.indexOf(OPS.paintImageXObject);
    //     const [objId, width, height] = <[string,number,number]>opList.argsArray[imgIndex];
    //     if (i < NUM_PAGES_THRESHOLD) 
    //     {
    //       console.assert( objId === `img_p${i - 1}_1` );
    //       console.assert( objs.has(objId) );
    //       console.assert( !commonObjs.has(objId) );
    //     } 
    //     else {
    //       console.assert( objId ===
    //         `g_${loadingTask.docId}_img_p${NUM_PAGES_THRESHOLD - 1}_1`
    //       );
    //       console.assert( objs.has(objId) );
    //       console.assert( commonObjs.has(objId) );
    //     }
    //     console.assert( width === EXPECTED_WIDTH );
    //     console.assert( height === EXPECTED_HEIGHT );
    //     // Ensure that the actual image data is identical for all pages.
    //     if (i === 1) 
    //     {
    //       firstImgData = <ImgData>objs.get(objId);
    //       console.assert( firstImgData.width === EXPECTED_WIDTH );
    //       console.assert( firstImgData.height === EXPECTED_HEIGHT );
    //       console.assert( firstImgData.kind === ImageKind.RGB_24BPP );
    //       console.assert( firstImgData.data instanceof Uint8ClampedArray );
    //       console.assert( firstImgData.data!.length === 25245000 );
    //     } 
    //     else {
    //       const objsPool = i >= NUM_PAGES_THRESHOLD ? commonObjs : objs;
    //       const currentImgData = <ImgData>objsPool.get(objId);
    //       console.assert( currentImgData.width === firstImgData!.width );
    //       console.assert( currentImgData.height === firstImgData!.height );
    //       console.assert( currentImgData.kind === firstImgData!.kind );
    //       console.assert( currentImgData.data instanceof Uint8ClampedArray );
    //       console.assert( 
    //         currentImgData.data!.every(
    //           (value, index) => value === firstImgData!.data![index]
    //         )
    //       );
    //     }
    //   }
    //   await loadingTask.destroy();
    //   firstImgData = undefined;
    // }
    await pdfLoadingTask.destroy();
}
console.log("%c>>>>>>> test Multiple `getDocument` instances >>>>>>>", `color:${css_1}`);
{
    // Regression test for https://github.com/mozilla/pdf.js/issues/6205
    // A PDF using the Helvetica font.
    const pdf1 = buildGetDocumentParams("tracemonkey.pdf");
    // A PDF using the Times font.
    const pdf2 = buildGetDocumentParams("TAMReview.pdf");
    // A PDF using the Arial font.
    const pdf3 = buildGetDocumentParams("issue6068.pdf");
    const loadingTasks = [];
    // Render the first page of the given PDF file.
    // Fulfills the promise with the base64-encoded version of the PDF.
    async function renderPDF(filename) {
        const loadingTask = getDocument(filename);
        loadingTasks.push(loadingTask);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.2 });
        console.assert(viewport instanceof PageViewport);
        const canvasAndCtx = CanvasFactory.create(viewport.width, viewport.height);
        const renderTask = page.render({
            canvasContext: canvasAndCtx.context,
            canvasFactory: CanvasFactory,
            viewport,
        });
        await renderTask.promise;
        const data = canvasAndCtx.canvas.toDataURL();
        CanvasFactory.destroy(canvasAndCtx);
        return data;
    }
    async function afterEach() {
        // Issue 6205 reported an issue with font rendering, so clear the loaded
        // fonts so that we can see whether loading PDFs in parallel does not
        // cause any issues with the rendered fonts.
        const destroyPromises = loadingTasks.map(loadingTask => loadingTask.destroy());
        await Promise.all(destroyPromises);
    }
    console.log(`it should correctly render PDFs in parallel...`);
    {
        let baseline1, baseline2, baseline3;
        const promiseDone = renderPDF(pdf1)
            .then(data1 => {
            baseline1 = data1;
            return renderPDF(pdf2);
        })
            .then(data2 => {
            baseline2 = data2;
            return renderPDF(pdf3);
        })
            .then(data3 => {
            baseline3 = data3;
            return Promise.all([
                renderPDF(pdf1),
                renderPDF(pdf2),
                renderPDF(pdf3),
            ]);
        })
            .then(dataUrls => {
            console.assert(dataUrls[0] === baseline1);
            console.assert(dataUrls[1] === baseline2);
            console.assert(dataUrls[2] === baseline3);
            return true;
        });
        await promiseDone;
    }
    await afterEach();
}
console.log("%c>>>>>>> test PDFDataRangeTransport >>>>>>>", `color:${css_1}`);
{
    const fileName = "tracemonkey.pdf";
    let dataPromise = DefaultFileReaderFactory.fetch({
        path: TEST_PDFS_PATH + fileName,
    });
    console.log(`it should fetch document info and page using ranges...`);
    {
        const initialDataLength = 4000;
        let fetches = 0;
        const data = await dataPromise;
        const initialData = data.subarray(0, initialDataLength);
        const transport = new PDFDataRangeTransport(data.length, initialData);
        transport.requestDataRange = (begin, end) => {
            fetches++;
            waitSome(() => {
                transport.onDataProgress(4000, undefined);
                transport.onDataRange(begin, data.subarray(begin, end));
            });
        };
        const loadingTask = getDocument(transport);
        const pdfDocument = await loadingTask.promise;
        console.assert(pdfDocument.numPages === 14);
        const pdfPage = await pdfDocument.getPage(10);
        console.assert(pdfPage.rotate === 0);
        console.assert(fetches > 2);
        await loadingTask.destroy();
    }
    console.log(`it should fetch document info and page using range and streaming...`);
    {
        const initialDataLength = 4000;
        let fetches = 0;
        const data = await dataPromise;
        const initialData = data.subarray(0, initialDataLength);
        const transport = new PDFDataRangeTransport(data.length, initialData);
        transport.requestDataRange = function (begin, end) {
            fetches++;
            if (fetches === 1) {
                // Send rest of the data on first range request.
                transport.onDataProgressiveRead(data.subarray(initialDataLength));
            }
            waitSome(function () {
                transport.onDataRange(begin, data.subarray(begin, end));
            });
        };
        const loadingTask = getDocument(transport);
        const pdfDocument = await loadingTask.promise;
        console.assert(pdfDocument.numPages === 14);
        const pdfPage = await pdfDocument.getPage(10);
        console.assert(pdfPage.rotate === 0);
        console.assert(fetches === 1);
        await new Promise(resolve => {
            waitSome(resolve);
        });
        await loadingTask.destroy();
    }
    console.log(`it should fetch document info and page, without range, using complete initialData...`);
    {
        let fetches = 0;
        const data = await dataPromise;
        const transport = new PDFDataRangeTransport(data.length, data, 
        /* progressiveDone = */ true);
        transport.requestDataRange = function (begin, end) {
            fetches++;
        };
        const loadingTask = getDocument({
            disableRange: true,
            range: transport,
        });
        const pdfDocument = await loadingTask.promise;
        console.assert(pdfDocument.numPages === 14);
        const pdfPage = await pdfDocument.getPage(10);
        console.assert(pdfPage.rotate === 0);
        console.assert(fetches === 0);
        await loadingTask.destroy();
    }
    dataPromise = undefined;
}
console.log("%c>>>>>>> test PDFWorkerUtil >>>>>>>", `color:${css_1}`);
{
    console.log(">>>>>>> test isSameOrigin >>>>>>>");
    {
        const { isSameOrigin } = PDFWorkerUtil;
        console.log(`it handles invalid base URLs...`);
        {
            // The base URL is not valid.
            console.assert(!isSameOrigin("/foo", "/bar"));
            // The base URL has no origin.
            console.assert(!isSameOrigin("blob:foo", "/bar"));
        }
        console.log(`it correctly checks if the origin of both URLs matches...`);
        {
            console.assert(isSameOrigin("https://www.mozilla.org/foo", "https://www.mozilla.org/bar"));
            console.assert(!isSameOrigin("https://www.mozilla.org/foo", "https://www.example.com/bar"));
        }
    }
}
CanvasFactory = undefined;
/*81---------------------------------------------------------------------------*/
console.log(`%c:pdf/pdf.ts-src/display/api_test ${(performance.now() - strttime).toFixed(2)} ms`, `color:${css_2}`);
globalThis.ntestfile = globalThis.ntestfile ? globalThis.ntestfile + 1 : 1;
//# sourceMappingURL=api_test.js.map