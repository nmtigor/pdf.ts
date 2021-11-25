/*81*****************************************************************************
 * api_test
** -------- */
import { css_1, css_2 } from "../../../test/alias.js";
import "../../../lib/jslang.js";
import { buildGetDocumentParams, DefaultFileReaderFactory, TEST_PDFS_PATH } from "../../test_utils.js";
import { DefaultCanvasFactory, getDocument, PDFDocumentLoadingTask, PDFDocumentProxy, PDFPageProxy, PDFWorker } from "./api.js";
import { GlobalWorkerOptions } from "./worker_options.js";
import { createPromiseCapability, PermissionFlag } from "../../pdf.ts-src/shared/util.js";
import { $enum } from "../../../3rd/ts-enum-util/src/$enum.js";
import { Metadata } from "./metadata.js";
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
    console.log("it creates pdf doc from URL-string...");
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
    console.log("it creates pdf doc from URL-object...");
    {
        // if (isNodeJS) {
        //   pending("window.location is not supported in Node.js.");
        // }
        const urlObj = new URL(TEST_PDFS_PATH + basicApiFileName, window.location.toString());
        const loadingTask = getDocument(urlObj);
        console.assert(loadingTask instanceof PDFDocumentLoadingTask);
        const pdfDocument = await loadingTask.promise;
        console.assert(urlObj instanceof URL);
        console.assert(pdfDocument instanceof PDFDocumentProxy);
        console.assert(pdfDocument.numPages === 3);
        await loadingTask.destroy();
    }
    console.log("it creates pdf doc from URL...");
    {
        const loadingTask = getDocument(basicApiGetDocumentParams);
        console.assert(loadingTask instanceof PDFDocumentLoadingTask);
        const progressReportedCapability = createPromiseCapability();
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
    console.log("it creates pdf doc from URL and aborts before worker initialized...");
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
    console.log("it creates pdf doc from URL and aborts loading after worker initialized...");
    {
        const loadingTask = getDocument(basicApiGetDocumentParams);
        console.assert(loadingTask instanceof PDFDocumentLoadingTask);
        // This can be somewhat random -- we cannot guarantee perfect
        // 'Terminate' message to the worker before/after setting up pdfManager.
        const destroyed = loadingTask._worker.promise.then(() => loadingTask.destroy());
        await destroyed;
    }
    console.log("it creates pdf doc from typed array...");
    {
        const typedArrayPdf = await DefaultFileReaderFactory.fetch({
            path: TEST_PDFS_PATH + basicApiFileName,
        });
        // Sanity check to make sure that we fetched the entire PDF file.
        console.assert(typedArrayPdf.length === basicApiFileLength);
        const loadingTask = getDocument(typedArrayPdf);
        console.assert(loadingTask instanceof PDFDocumentLoadingTask);
        const progressReportedCapability = createPromiseCapability();
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
    // console.log("it creates pdf doc from invalid PDF file...");
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
    // console.log("it creates pdf doc from non-existent URL...");
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
    // console.log("it creates pdf doc from PDF file protected with user and owner password...");
    // {
    //   const loadingTask = getDocument(buildGetDocumentParams("pr6531_1.pdf"));
    //   console.assert( loadingTask instanceof PDFDocumentLoadingTask );
    //   const passwordNeededCapability = createPromiseCapability();
    //   const passwordIncorrectCapability = createPromiseCapability();
    //   // Attach the callback that is used to request a password;
    //   // similarly to how viewer.js handles passwords.
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
    // console.log("it creates pdf doc from PDF file protected with only a user password...");
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
    // console.log("it creates pdf doc from password protected PDF file and aborts/throws in the onPassword callback (issue 7806)...");
    // {
    // }
    // console.log("it creates pdf doc from empty typed array...");
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
    console.log("it checks that `docId`s are unique and increasing...");
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
    console.log("it gets number of pages...");
    {
        console.assert(pdfDocument.numPages === 3);
    }
    console.log("it gets fingerprints...");
    {
        console.assert(pdfDocument.fingerprints.eq([
            "ea8b35919d6279a369e835bde778611b",
            undefined,
        ]));
    }
    console.log("it gets fingerprints, from modified document...");
    {
        const loadingTask = getDocument(buildGetDocumentParams("annotation-tx.pdf"));
        const pdfDoc = await loadingTask.promise;
        console.assert(pdfDoc.fingerprints.eq([
            "3ebd77c320274649a68f10dbf3b9f882",
            "e7087346aa4b4ae0911c1f1643b57345",
        ]));
        await loadingTask.destroy();
    }
    console.log("it gets page...");
    {
        const data = await pdfDocument.getPage(1);
        console.assert(data instanceof PDFPageProxy);
        console.assert(data.pageNumber === 1);
    }
    console.log("it gets non-existent page...");
    {
        let outOfRangePromise = pdfDocument.getPage(100);
        let nonIntegerPromise = pdfDocument.getPage(2.5);
        let nonNumberPromise = pdfDocument.getPage("1");
        outOfRangePromise = outOfRangePromise.then(() => {
            throw new Error("shall fail for out-of-range pageNumber parameter");
        }, reason => {
            console.assert(reason instanceof Error);
        });
        nonIntegerPromise = nonIntegerPromise.then(() => {
            throw new Error("shall fail for non-integer pageNumber parameter");
        }, reason => {
            console.assert(reason instanceof Error);
        });
        nonNumberPromise = nonNumberPromise.then(() => {
            throw new Error("shall fail for non-number pageNumber parameter");
        }, reason => {
            console.assert(reason instanceof Error);
        });
        await Promise.all([
            outOfRangePromise,
            nonIntegerPromise,
            nonNumberPromise,
        ]);
    }
    console.log("it gets page, from /Pages tree with circular reference...");
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
                console.assert(reason instanceof Error);
                console.assert(reason.message === "Pages tree contains circular reference.");
            });
        });
        await Promise.all([page1, page2]);
        await loadingTask.destroy();
    }
    // console.log("it gets page index...");
    // {
    //   const ref = { num: 17, gen: 0 }; // Reference to second page.
    //   const pageIndex = await pdfDocument.getPageIndex(ref);
    //   console.assert( pageIndex === 1 );
    // }
    console.log("it gets invalid page index...");
    {
        const ref = { num: 3, gen: 0 }; // Reference to a font dictionary.
        try {
            await pdfDocument.getPageIndex(ref);
            console.assert(!!0, "Shouldn't get here.");
        }
        catch (reason) {
            console.assert(reason instanceof Error);
        }
    }
    console.log("it gets destinations, from /Dests dictionary...");
    {
        const destinations = await pdfDocument.getDestinations();
        console.assert(destinations.eq({
            chapter1: [{ gen: 0, num: 17 }, { name: "XYZ" }, 0, 841.89, null],
        }));
    }
    console.log("it gets a destination, from /Dests dictionary...");
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
    console.log("it gets a non-existent destination, from /Dests dictionary...");
    {
        const destination = await pdfDocument.getDestination("non-existent-named-destination");
        console.assert(destination === undefined);
    }
    console.log("it gets destinations, from /Names (NameTree) dictionary...");
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
    // console.log("it gets a destination, from /Names (NameTree) dictionary...");
    // {
    //   const loadingTask = getDocument(buildGetDocumentParams("issue6204.pdf"));
    //   const pdfDoc = await loadingTask.promise;
    //   const destination = await pdfDoc.getDestination("Page.1");
    //   console.assert( destination!.eq([
    //     { num: 1, gen: 0 },
    //     { name: "XYZ" },
    //     0,
    //     375,
    //     null,
    //   ]));
    //   await loadingTask.destroy();
    // }
    // console.log("it gets a non-existent destination, from /Names (NameTree) dictionary...");
    // {
    //   const loadingTask = getDocument(buildGetDocumentParams("issue6204.pdf"));
    //   const pdfDoc = await loadingTask.promise;
    //   const destination = await pdfDoc.getDestination(
    //     "non-existent-named-destination"
    //   );
    //   console.assert( destination === undefined );
    //   await loadingTask.destroy();
    // }
    // console.log("it gets a destination, from out-of-order /Names (NameTree) dictionary (issue 10272)...");
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
    // console.log("it gets non-string destination...");
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
    console.log("it gets non-existent page labels...");
    {
        const pageLabels = await pdfDocument.getPageLabels();
        console.assert(pageLabels === null);
    }
    // console.log("it gets page labels...");
    // {
    //   // PageLabels with Roman/Arabic numerals.
    //   const loadingTask0 = getDocument(buildGetDocumentParams("bug793632.pdf"));
    //   const promise0 = loadingTask0.promise.then( pdfDoc => pdfDoc.getPageLabels() );
    //   // PageLabels with only a label prefix.
    //   const loadingTask1 = getDocument(buildGetDocumentParams("issue1453.pdf"));
    //   const promise1 = loadingTask1.promise.then( pdfDoc => pdfDoc.getPageLabels() );
    //   // PageLabels identical to standard page numbering.
    //   const loadingTask2 = getDocument(buildGetDocumentParams("rotation.pdf"));
    //   const promise2 = loadingTask2.promise.then( pdfDoc => pdfDoc.getPageLabels() );
    //   // PageLabels with bad "Prefix" entries.
    //   const loadingTask3 = getDocument(
    //     buildGetDocumentParams("bad-PageLabels.pdf")
    //   );
    //   const promise3 = loadingTask3.promise.then( pdfDoc => pdfDoc.getPageLabels() );
    //   const pageLabels = await Promise.all([
    //     promise0,
    //     promise1,
    //     promise2,
    //     promise3,
    //   ]);
    //   console.assert( pageLabels[0]!.eq(["i", "ii", "iii", "1"]));
    //   console.assert( pageLabels[1]!.eq(["Front Page1"]));
    //   console.assert( pageLabels[2]!.eq(["1", "2"]));
    //   console.assert( pageLabels[3]!.eq(["X3"]));
    //   await Promise.all([
    //     loadingTask0.destroy(),
    //     loadingTask1.destroy(),
    //     loadingTask2.destroy(),
    //     loadingTask3.destroy(),
    //   ]);
    // }
    console.log("it gets default page layout...");
    {
        const loadingTask = getDocument(buildGetDocumentParams("tracemonkey.pdf"));
        const pdfDoc = await loadingTask.promise;
        const pageLayout = await pdfDoc.getPageLayout();
        console.assert(pageLayout === undefined);
        await loadingTask.destroy();
    }
    console.log("it gets non-default page layout...");
    {
        const pageLayout = await pdfDocument.getPageLayout();
        console.assert(pageLayout === 1 /* SinglePage */);
    }
    console.log("it gets default page mode...");
    {
        const loadingTask = getDocument(buildGetDocumentParams("tracemonkey.pdf"));
        const pdfDoc = await loadingTask.promise;
        const pageMode = await pdfDoc.getPageMode();
        console.assert(pageMode === 1 /* UseNone */);
        await loadingTask.destroy();
    }
    console.log("it gets non-default page mode...");
    {
        const pageMode = await pdfDocument.getPageMode();
        console.assert(pageMode === 2 /* UseOutlines */);
    }
    console.log("it gets default viewer preferences...");
    {
        const loadingTask = getDocument(buildGetDocumentParams("tracemonkey.pdf"));
        const pdfDoc = await loadingTask.promise;
        const prefs = await pdfDoc.getViewerPreferences();
        console.assert(prefs === undefined);
        await loadingTask.destroy();
    }
    console.log("it gets non-default viewer preferences...");
    {
        const prefs = await pdfDocument.getViewerPreferences();
        console.assert(prefs.eq({ Direction: "L2R" }));
    }
    console.log("it gets default open action...");
    {
        const loadingTask = getDocument(buildGetDocumentParams("tracemonkey.pdf"));
        const pdfDoc = await loadingTask.promise;
        const openAction = await pdfDoc.getOpenAction();
        console.assert(openAction === undefined);
        await loadingTask.destroy();
    }
    console.log("it gets non-default open action (with destination)...");
    {
        const openAction = await pdfDocument.getOpenAction();
        console.assert(openAction.dest.eq([
            { num: 15, gen: 0 },
            { name: "FitH" },
            null,
        ]));
        console.assert(openAction.action === undefined);
    }
    console.log("it gets non-default open action (with Print action)...");
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
    // console.log("it gets non-existent attachments...");
    // {
    //   const attachments = await pdfDocument.getAttachments();
    //   console.assert( attachments === undefined );
    // }
    // console.log("it gets attachments...");
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
    console.log("it gets javascript...");
    {
        const javascript = await pdfDocument.getJavaScript();
        console.assert(javascript === undefined);
    }
    // console.log("it gets javascript with printing instructions (JS action)...");
    // {
    // }
    // console.log("it gets hasJSActions, in document without javaScript...");
    // {
    // }
    // console.log("it gets hasJSActions, in document with javaScript...");
    // {
    // }
    // console.log("it gets non-existent JSActions...");
    // {
    // }
    // console.log("it gets JSActions...");
    // {
    // }
    console.log("it gets non-existent outline...");
    {
        const loadingTask = getDocument(buildGetDocumentParams("tracemonkey.pdf"));
        const pdfDoc = await loadingTask.promise;
        const outline = await pdfDoc.getOutline();
        console.assert(outline === undefined);
        await loadingTask.destroy();
    }
    console.log("it gets outline...");
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
    console.log("it gets outline containing a URL...");
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
    console.log("it gets non-existent permissions...");
    {
        const permissions = await pdfDocument.getPermissions();
        console.assert(permissions === undefined);
    }
    console.log("it gets permissions...");
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
    console.log("it gets metadata...");
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
    console.log("it gets metadata, with custom info dict entries...");
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
    console.log("it gets metadata, with missing PDF header (bug 1606566)...");
    {
        const loadingTask = getDocument(buildGetDocumentParams("bug1606566.pdf"));
        const pdfDoc = await loadingTask.promise;
        const { info, metadata, contentDispositionFilename, contentLength } = await pdfDoc.getMetadata();
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
    console.log("it gets markInfo...");
    {
        const loadingTask = getDocument(buildGetDocumentParams("annotation-line.pdf"));
        const pdfDoc = await loadingTask.promise;
        const markInfo = await pdfDoc.getMarkInfo();
        console.assert(markInfo.Marked === true);
        console.assert(markInfo.UserProperties === false);
        console.assert(markInfo.Suspects === false);
        await loadingTask.destroy();
    }
    console.log("it gets data...");
    {
        const data = await pdfDocument.getData();
        console.assert(data instanceof Uint8Array);
        console.assert(data.length === basicApiFileLength);
    }
    console.log("it gets download info...");
    {
        const downloadInfo = await pdfDocument.getDownloadInfo();
        console.assert(downloadInfo.eq({ length: basicApiFileLength }));
    }
    console.log("it gets document stats...");
    {
        const stats = await pdfDocument.getStats();
        console.assert(stats.eq({ streamTypes: {}, fontTypes: {} }));
    }
    console.log("it cleans up document resources...");
    {
        await pdfDocument.cleanup();
    }
    console.log("it checks that fingerprints are unique...");
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
        console.assert(fingerprints1.eq(["2f695a83d6e7553c24fc08b7ac69712d", undefined]));
        console.assert(fingerprints2.eq(["04c7126b34a46b6d4d6e7a1eff7edcb6", undefined]));
        await Promise.all([loadingTask1.destroy(), loadingTask2.destroy()]);
    }
    // console.log("it writes a value in an annotation, save the pdf and load it...");
    // {
    //   let loadingTask = getDocument(buildGetDocumentParams("evaljs.pdf"));
    //   let pdfDoc = await loadingTask.promise;
    //   const value = "Hello World";
    //   pdfDoc.annotationStorage.setValue("55R", { value });
    //   const data = await pdfDoc.saveDocument();
    //   await loadingTask.destroy();
    //   loadingTask = getDocument(data);
    //   pdfDoc = await loadingTask.promise;
    //   const pdfPage = await pdfDoc.getPage(1);
    //   const annotations = await pdfPage.getAnnotations();
    //   const field = annotations.find(annotation => annotation.id === "55R");
    //   console.assert( !!field );
    //   console.assert( field!.fieldValue === value );
    //   await loadingTask.destroy();
    // }
    // console.log("%c>>>>>>> test Cross-origin >>>>>>>",`color:${css_1}`);
    // {
    //   //
    // }
    await pdfLoadingTask.destroy();
}
//! unsynchronized
console.log("%c>>>>>>> test Page >>>>>>>", `color:${css_1}`);
{
    let pdfLoadingTask = getDocument(basicApiGetDocumentParams);
    let pdfDocument = await pdfLoadingTask.promise;
    let page = await pdfDocument.getPage(1);
    console.log("it gets page number...");
    {
        console.assert(page.pageNumber === 1);
    }
    console.log("it gets rotate...");
    {
        console.assert(page.rotate === 0);
    }
    console.log("it gets ref...");
    {
        console.assert(page.ref.eq({ num: 15, gen: 0 }));
    }
    //
    await pdfLoadingTask.destroy();
}
//! unsynchronized
console.log("%c>>>>>>> test Multiple `getDocument` instances >>>>>>>", `color:${css_1}`);
{
    //
}
//! unsynchronized
console.log("%c>>>>>>> test PDFDataRangeTransport >>>>>>>", `color:${css_1}`);
{
    //
}
CanvasFactory = undefined;
/*81---------------------------------------------------------------------------*/
console.log(`%c:pdf/pdf.ts-src/display/api_test ${(performance.now() - strttime).toFixed(2)} ms`, `color:${css_2}`);
globalThis.ntestfile = globalThis.ntestfile ? globalThis.ntestfile + 1 : 1;
//# sourceMappingURL=api_test.js.map