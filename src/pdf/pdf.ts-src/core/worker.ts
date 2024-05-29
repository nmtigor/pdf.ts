/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/worker.ts
 * @license Apache-2.0
 ******************************************************************************/

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

import { PromiseCap } from "@fe-lib/util/PromiseCap.ts";
import { assert } from "@fe-lib/util/trace.ts";
import { GENERIC, PDFJSDev, TESTING } from "@fe-src/global.ts";
import type { ReadValue } from "../interfaces.ts";
import type {
  GetDocRequestData,
  PDFInfo,
  reason_t,
} from "../shared/message_handler.ts";
import { MessageHandler, Thread } from "../shared/message_handler.ts";
import {
  AbortException,
  BaseException,
  getVerbosityLevel,
  info,
  PasswordException,
  PasswordExceptionJ,
  setVerbosityLevel,
  stringToPDFString,
  UnknownErrorException,
  VerbosityLevel,
  warn,
} from "../shared/util.ts";
import type { AnnotSaveData } from "./annotation.ts";
import { AnnotationFactory } from "./annotation.ts";
import { clearGlobalCaches } from "./cleanup_helper.ts";
import {
  arrayBuffersToBytes,
  getNewAnnotationsMap,
  XRefParseException,
} from "./core_utils.ts";
import type { Page } from "./document.ts";
import type { DedicatedWorkerGlobalScope, IWorker } from "./iworker.ts";
import type {
  BasePdfManager,
  LocalPdfManagerCtorP,
  NetworkPdfManagerCtorP,
} from "./pdf_manager.ts";
import { LocalPdfManager, NetworkPdfManager } from "./pdf_manager.ts";
import { Dict, isDict, Ref } from "./primitives.ts";
import { StructTreeRoot } from "./struct_tree.ts";
import { PDFWorkerStream } from "./worker_stream.ts";
import { incrementalUpdate } from "./writer.ts";
/*80--------------------------------------------------------------------------*/

declare var DedicatedWorkerGlobalScope: {
  prototype: DedicatedWorkerGlobalScope;
  new (): DedicatedWorkerGlobalScope;
};
/*80--------------------------------------------------------------------------*/

export class WorkerTask {
  terminated = false;
  terminate() {
    this.terminated = true;
  }

  #capability = new PromiseCap();
  get finished() {
    return this.#capability.promise;
  }
  finish() {
    this.#capability.resolve();
  }

  constructor(public name: string) {
  }

  ensureNotTerminated() {
    if (this.terminated) {
      throw new Error("Worker task was terminated");
    }
  }
}

export interface XRefInfo {
  rootRef?: Ref;
  encryptRef?: Ref;
  newRef: Ref;
  infoRef?: Ref;
  info: Record<string, string>;
  fileIds?: [string, string];
  startXRef: number;
  filename: string | undefined;
}

/** AnnotSaveData Recursive Array */
export type ASD_RR = AnnotSaveData | ASD_RR[];

export const WorkerMessageHandler = {
  setup(handler: MessageHandler<Thread.worker>, port: IWorker) {
    let testMessageProcessed = false;
    handler.on("test", (data) => {
      if (testMessageProcessed) {
        // we already processed 'test' message once
        return;
      }
      testMessageProcessed = true;

      // Ensure that `TypedArray`s can be sent to the worker.
      handler.send("test", data instanceof Uint8Array);
    });

    handler.on("configure", (data) => {
      setVerbosityLevel(data.verbosity);
    });

    handler.on("GetDocRequest", (data) => {
      return WorkerMessageHandler.createDocumentHandler(data, port);
    });
  },

  createDocumentHandler(docParams: GetDocRequestData, port: IWorker) {
    // This context is actually holds references on pdfManager and handler,
    // until the latter is destroyed.
    let pdfManager: BasePdfManager;
    let terminated = false;
    let cancelXHRs: ((reason: AbortException) => void) | undefined;
    const WorkerTasks = new Set<WorkerTask>();
    const verbosity = getVerbosityLevel();

    const { docId, apiVersion } = docParams;
    // const workerVersion =
    //   typeof PDFJSDev !== "undefined" && !PDFJSDev.test("TESTING")
    //     ? PDFJSDev.eval("BUNDLE_VERSION")
    //     : null;
    const workerVersion = 0;
    if (apiVersion !== workerVersion) {
      throw new Error(
        `The API version "${apiVersion}" does not match ` +
          `the Worker version "${workerVersion}".`,
      );
    }

    /*#static*/ if (PDFJSDev || GENERIC) {
      // Fail early, and predictably, rather than having (some) fonts fail to
      // load/render with slightly cryptic error messages in environments where
      // the `Array.prototype` has been *incorrectly* extended.
      //
      // PLEASE NOTE: We do *not* want to slow down font parsing by adding
      //              `hasOwnProperty` checks all over the code-base.
      const enumerableProperties = [];
      for (const property in []) {
        enumerableProperties.push(property);
      }
      if (enumerableProperties.length) {
        throw new Error(
          "The `Array.prototype` contains unexpected enumerable properties: " +
            enumerableProperties.join(", ") +
            "; thus breaking e.g. `for...in` iteration of `Array`s.",
        );
      }
    }
    const workerHandlerName = docId + "_worker";
    let handler = new MessageHandler<Thread.worker>(
      workerHandlerName,
      docId,
      port,
    );

    function ensureNotTerminated() {
      if (terminated) {
        throw new Error("Worker was terminated");
      }
    }

    function startWorkerTask(task: WorkerTask) {
      WorkerTasks.add(task);
    }

    function finishWorkerTask(task: WorkerTask) {
      task.finish();
      WorkerTasks.delete(task);
    }

    async function loadDocument(recoveryMode: boolean): Promise<PDFInfo> {
      await pdfManager.ensureDoc("checkHeader");
      await pdfManager.ensureDoc("parseStartXRef");
      await pdfManager.ensureDoc("parse", [recoveryMode]);

      // Check that at least the first page can be successfully loaded,
      // since otherwise the XRef table is definitely not valid.
      await pdfManager.ensureDoc("checkFirstPage", [recoveryMode]);
      // Check that the last page can be successfully loaded, to ensure that
      // `numPages` is correct, and fallback to walking the entire /Pages-tree.
      await pdfManager.ensureDoc("checkLastPage", [recoveryMode]);

      const isPureXfa = await pdfManager.ensureDoc("isPureXfa");
      if (isPureXfa) {
        const task = new WorkerTask("loadXfaFonts");
        startWorkerTask(task);
        await Promise.all([
          pdfManager
            .loadXfaFonts(handler, task)
            .catch((reason) => {
              // Ignore errors, to allow the document to load.
            })
            .then(() => finishWorkerTask(task)),
          pdfManager.loadXfaImages(),
        ]);
      }

      const [numPages, fingerprints] = await Promise.all([
        pdfManager.ensureDoc("numPages"),
        pdfManager.ensureDoc("fingerprints"),
      ]);

      // Get htmlForXfa after numPages to avoid to create HTML twice.
      const htmlForXfa = isPureXfa
        ? await pdfManager.ensureDoc("htmlForXfa")
        : undefined;

      return { numPages, fingerprints, htmlForXfa };
    }

    function getPdfManager({
      data,
      password,
      disableAutoFetch,
      rangeChunkSize,
      length,
      docBaseUrl,
      enableXfa,
      evaluatorOptions,
    }: GetDocRequestData) {
      const pdfManagerArgs = {
        disableAutoFetch,
        docBaseUrl,
        docId,
        enableXfa,
        evaluatorOptions,
        handler,
        length,
        password,
        rangeChunkSize,
      } as LocalPdfManagerCtorP | NetworkPdfManagerCtorP;
      const pdfManagerCapability = new PromiseCap<BasePdfManager>();
      let newPdfManager: BasePdfManager;

      if (data) {
        try {
          (pdfManagerArgs as LocalPdfManagerCtorP).source = data as
            | Uint8Array
            | ArrayBuffer
            | number[];

          newPdfManager = new LocalPdfManager(
            pdfManagerArgs as LocalPdfManagerCtorP,
          );
          pdfManagerCapability.resolve(newPdfManager);
        } catch (ex) {
          pdfManagerCapability.reject(ex);
        }
        return pdfManagerCapability.promise;
      }

      let pdfStream: PDFWorkerStream,
        cachedChunks: ArrayBufferLike[] = [];
      try {
        pdfStream = new PDFWorkerStream(handler);
      } catch (ex) {
        pdfManagerCapability.reject(ex);
        return pdfManagerCapability.promise;
      }

      const fullRequest = pdfStream.getFullReader();
      fullRequest.headersReady
        .then(() => {
          if (!fullRequest.isRangeSupported) {
            return;
          }
          pdfManagerArgs.source = pdfStream;
          (pdfManagerArgs as NetworkPdfManagerCtorP).length = fullRequest
            .contentLength!;
          // We don't need auto-fetch when streaming is enabled.
          (pdfManagerArgs as NetworkPdfManagerCtorP).disableAutoFetch ||=
            fullRequest.isStreamingSupported;

          newPdfManager = new NetworkPdfManager(
            pdfManagerArgs as NetworkPdfManagerCtorP,
          );
          // There may be a chance that `newPdfManager` is not initialized for
          // the first few runs of `readchunk` block of code. Be sure to send
          // all cached chunks, if any, to chunked_stream via pdf_manager.
          for (const chunk of cachedChunks) {
            newPdfManager.sendProgressiveData!(chunk);
          }

          cachedChunks = [];
          pdfManagerCapability.resolve(newPdfManager);
          cancelXHRs = undefined;
        })
        .catch((reason) => {
          pdfManagerCapability.reject(reason);
          cancelXHRs = undefined;
        });

      let loaded = 0;
      const flushChunks = () => {
        const pdfFile = arrayBuffersToBytes(cachedChunks);
        if (length && pdfFile.length !== length) {
          warn("reported HTTP length is different from actual");
        }
        // the data is array, instantiating directly from it
        try {
          pdfManagerArgs.source = pdfFile;

          newPdfManager = new LocalPdfManager(
            pdfManagerArgs as LocalPdfManagerCtorP,
          );
          pdfManagerCapability.resolve(newPdfManager);
        } catch (ex) {
          pdfManagerCapability.reject(ex);
        }
        cachedChunks = [];
      };
      new Promise((resolve, reject) => {
        const readChunk = ({ value, done }: ReadValue) => {
          try {
            ensureNotTerminated();
            if (done) {
              if (!newPdfManager) {
                flushChunks();
              }
              cancelXHRs = undefined;
              return;
            }
            /*#static*/ if (PDFJSDev || TESTING) {
              assert(
                value instanceof ArrayBuffer,
                "readChunk (getPdfManager) - expected an ArrayBuffer.",
              );
            }
            loaded += value.byteLength;

            if (!fullRequest.isStreamingSupported) {
              handler.send("DocProgress", {
                loaded,
                total: Math.max(loaded, fullRequest.contentLength || 0),
              });
            }

            if (newPdfManager) {
              newPdfManager.sendProgressiveData!(value!);
            } else {
              cachedChunks.push(value!);
            }
            fullRequest.read().then(readChunk, reject);
          } catch (e) {
            reject(e);
          }
        };
        fullRequest.read().then(readChunk, reject);
      }).catch((e) => {
        pdfManagerCapability.reject(e);
        cancelXHRs = undefined;
      });

      cancelXHRs = (reason: AbortException) => {
        pdfStream.cancelAllRequests(reason);
      };

      return pdfManagerCapability.promise;
    }

    function setupDoc(data: GetDocRequestData) {
      function onSuccess(doc: PDFInfo) {
        ensureNotTerminated();
        handler.send("GetDoc", { pdfInfo: doc });
      }

      function onFailure(ex: reason_t) {
        // console.log(ex.name);
        // console.log(ex);
        ensureNotTerminated();

        if (ex.name === "PasswordException") {
          const task = new WorkerTask(`PasswordException: response ${ex.code}`);
          startWorkerTask(task);

          const exJ = (ex instanceof PasswordException)
            ? ex.toJ()
            : ex as PasswordExceptionJ;
          handler
            .sendWithPromise("PasswordRequest", exJ)
            .then(({ password }) => {
              finishWorkerTask(task);
              pdfManager.updatePassword(password);
              pdfManagerReady();
            })
            .catch(() => {
              finishWorkerTask(task);
              handler.send("DocException", exJ);
            });
        } else if (
          ex.name === "InvalidPDFException" ||
          ex.name === "MissingPDFException" ||
          ex.name === "UnexpectedResponseException" ||
          ex.name === "UnknownErrorException"
        ) {
          handler.send(
            "DocException",
            (ex instanceof BaseException) ? ex.toJ() : ex,
          );
        } else {
          handler.send(
            "DocException",
            new UnknownErrorException(ex.message, ex.toString()).toJ(),
          );
        }
      }

      function pdfManagerReady() {
        ensureNotTerminated();

        loadDocument(false).then(onSuccess, (reason) => {
          ensureNotTerminated();

          // Try again with recoveryMode == true
          if (!(reason instanceof XRefParseException)) {
            onFailure(reason);
            return;
          }
          pdfManager.requestLoadedStream().then(() => {
            ensureNotTerminated();

            loadDocument(true).then(onSuccess, onFailure);
          });
        });
      }

      ensureNotTerminated();

      getPdfManager(data).then((newPdfManager) => {
        if (terminated) {
          // We were in a process of setting up the manager, but it got
          // terminated in the middle.
          newPdfManager.terminate(
            new AbortException("Worker was terminated."),
          );
          throw new Error("Worker was terminated");
        }
        pdfManager = newPdfManager;

        pdfManager.requestLoadedStream(/* noFetch = */ true).then((stream) => {
          handler.send("DataLoaded", { length: stream.bytes.byteLength });
        });
      })
        .then(pdfManagerReady, onFailure);
    }

    handler.on("GetPage", (data) =>
      pdfManager.getPage(data.pageIndex)
        .then((page: Page) =>
          Promise.all([
            pdfManager.ensure(page, "rotate"),
            pdfManager.ensure(page, "ref"),
            pdfManager.ensure(page, "userUnit"),
            pdfManager.ensure(page, "view"),
          ]).then(([rotate, ref, userUnit, view]) => ({
            rotate,
            ref,
            userUnit,
            view,
          }))
        ));

    handler.on("GetPageIndex", (data) => {
      const pageRef = Ref.get(data.num, data.gen);
      return pdfManager.ensureCatalog("getPageIndex", [pageRef]);
    });

    handler.on("GetDestinations", () => {
      return pdfManager.ensureCatalog("destinations");
    });

    handler.on("GetDestination", (data) => {
      return pdfManager.ensureCatalog("getDestination", [data.id]);
    });

    handler.on("GetPageLabels", () => {
      return pdfManager.ensureCatalog("pageLabels");
    });

    handler.on("GetPageLayout", () => {
      return pdfManager.ensureCatalog("pageLayout");
    });

    handler.on("GetPageMode", () => {
      return pdfManager.ensureCatalog("pageMode");
    });

    handler.on("GetViewerPreferences", () => {
      return pdfManager.ensureCatalog("viewerPreferences");
    });

    handler.on("GetOpenAction", () => {
      return pdfManager.ensureCatalog("openAction");
    });

    handler.on("GetAttachments", () => {
      return pdfManager.ensureCatalog("attachments");
    });

    handler.on("GetDocJSActions", () => {
      return pdfManager.ensureCatalog("jsActions");
    });

    handler.on("GetPageJSActions", ({ pageIndex }) => {
      return pdfManager.getPage(pageIndex).then((page) => {
        return pdfManager.ensure(page, "jsActions");
      });
    });

    handler.on("GetOutline", () => {
      return pdfManager.ensureCatalog("documentOutline");
    });

    handler.on("GetOptionalContentConfig", () => {
      return pdfManager.ensureCatalog("optionalContentConfig");
    });

    handler.on("GetPermissions", () => {
      return pdfManager.ensureCatalog("permissions");
    });

    handler.on("GetMetadata", () => {
      return Promise.all([
        pdfManager.ensureDoc("documentInfo"),
        pdfManager.ensureCatalog("metadata"),
      ]);
    });

    handler.on("GetMarkInfo", () => {
      return pdfManager.ensureCatalog("markInfo");
    });

    handler.on("GetData", () => {
      return pdfManager.requestLoadedStream().then((stream) => stream.bytes);
    });

    handler.on("GetAnnotations", ({ pageIndex, intent }) => {
      return pdfManager.getPage(pageIndex).then((page) => {
        const task = new WorkerTask(`GetAnnotations: page ${pageIndex}`);
        startWorkerTask(task);

        return page.getAnnotationsData(handler, task, intent).then(
          (data) => {
            finishWorkerTask(task);
            return data;
          },
          (reason) => {
            finishWorkerTask(task);
            throw reason;
          },
        );
      });
    });

    handler.on("GetFieldObjects", () => {
      return pdfManager.ensureDoc("fieldObjects");
    });

    handler.on("HasJSActions", async () => {
      return await pdfManager.ensureDoc("hasJSActions");
    });

    handler.on("GetCalculationOrderIds", () => {
      return pdfManager.ensureDoc("calculationOrderIds");
    });

    handler.on(
      "SaveDocument",
      async ({ isPureXfa, numPages, annotationStorage, filename }) => {
        const globalPromises = [
          pdfManager.requestLoadedStream(),
          pdfManager.ensureCatalog("acroForm"),
          pdfManager.ensureCatalog("acroFormRef"),
          pdfManager.ensureDoc("startXRef"),
          pdfManager.ensureDoc("xref"),
          pdfManager.ensureDoc("linearization"),
          pdfManager.ensureCatalog("structTreeRoot"),
        ] as const;
        const promises: Promise<ASD_RR | string | undefined>[] = [];

        const newAnnotationsByPage = !isPureXfa
          ? getNewAnnotationsMap(annotationStorage)
          : undefined;
        const [
          stream,
          acroForm,
          acroFormRef,
          startXRef,
          xref,
          linearization,
          _structTreeRoot,
        ] = await Promise.all(globalPromises);
        const catalogRef = xref.trailer!.getRaw("Root") as Ref || undefined;
        let structTreeRoot: StructTreeRoot | undefined;

        if (newAnnotationsByPage) {
          if (!_structTreeRoot) {
            if (
              await StructTreeRoot.canCreateStructureTree({
                catalogRef,
                pdfManager,
                newAnnotationsByPage,
              })
            ) {
              structTreeRoot = undefined;
            }
          } else if (
            await _structTreeRoot.canUpdateStructTree({
              pdfManager,
              xref,
              newAnnotationsByPage,
            })
          ) {
            structTreeRoot = _structTreeRoot;
          }

          const imagePromises = AnnotationFactory.generateImages(
            annotationStorage.values(),
            xref,
            pdfManager.evaluatorOptions.isOffscreenCanvasSupported,
          );
          const newAnnotationPromises = structTreeRoot === undefined
            ? promises as Promise<ASD_RR>[]
            : [];
          for (const [pageIndex, annotations] of newAnnotationsByPage) {
            newAnnotationPromises.push(
              pdfManager.getPage(pageIndex).then((page) => {
                const task = new WorkerTask(`Save (editor): page ${pageIndex}`);
                return page
                  .saveNewAnnotations(handler, task, annotations, imagePromises)
                  .finally(() => {
                    finishWorkerTask(task);
                  });
              }),
            );
          }
          if (structTreeRoot === undefined) {
            // console.log(`%crun here: 2`, `color:${LOG_cssc.runhere}`);
            // No structTreeRoot exists, so we need to create one.
            promises.push(
              Promise.all(newAnnotationPromises).then(async (newRefs) => {
                await StructTreeRoot.createStructureTree({
                  newAnnotationsByPage,
                  xref,
                  catalogRef,
                  pdfManager,
                  newRefs,
                });
                return newRefs;
              }),
            );
          } else if (structTreeRoot) {
            // console.log(`%crun here: 3`, `color:${LOG_cssc.runhere}`);
            promises.push(
              Promise.all(newAnnotationPromises).then(async (newRefs) => {
                await structTreeRoot!.updateStructureTree({
                  newAnnotationsByPage,
                  pdfManager,
                  newRefs,
                });
                return newRefs;
              }),
            );
          }
        }

        if (isPureXfa) {
          // console.log(`%crun here: 4`, `color:${LOG_cssc.runhere}`);
          promises.push(pdfManager.serializeXfaData(annotationStorage));
        } else {
          // console.log(`%crun here: 5`, `color:${LOG_cssc.runhere}`);
          for (let pageIndex = 0; pageIndex < numPages; pageIndex++) {
            promises.push(
              pdfManager.getPage(pageIndex).then((page) => {
                const task = new WorkerTask(`Save: page ${pageIndex}`);
                return page
                  .save(handler, task, annotationStorage)
                  .finally(() => {
                    finishWorkerTask(task);
                  });
              }),
            );
          }
        }

        // console.log(`%crun here: 0`, `color:${LOG_cssc.runhere}`);
        const refs = await Promise.all(promises);
        // console.log(`%crun here: 1`, `color:${LOG_cssc.runhere}`);
        let newRefs: AnnotSaveData[] = [];
        let xfaData: string | undefined;
        if (isPureXfa) {
          xfaData = refs[0] as string | undefined;
          if (!xfaData) {
            return stream.bytes;
          }
        } else {
          newRefs = refs.flat(2) as AnnotSaveData[];

          if (newRefs.length === 0) {
            // No new refs so just return the initial bytes
            return stream.bytes;
          }
        }
        // console.log("🚀 ~ newRefs:");
        // console.dir(newRefs);

        const needAppearances = acroFormRef &&
          acroForm instanceof Dict &&
          newRefs.some((ref) => ref.needAppearances);

        const xfa = (acroForm instanceof Dict &&
          acroForm.get("XFA") as (Ref | string)[]) || undefined;
        let xfaDatasetsRef: Ref | undefined;
        let hasXfaDatasetsEntry = false;
        if (Array.isArray(xfa)) {
          for (let i = 0, ii = xfa.length; i < ii; i += 2) {
            if (xfa[i] === "datasets") {
              xfaDatasetsRef = xfa[i + 1] as Ref;
              hasXfaDatasetsEntry = true;
            }
          }
          if (xfaDatasetsRef === undefined) {
            xfaDatasetsRef = xref.getNewTemporaryRef();
          }
        } else if (xfa) {
          // TODO: Support XFA streams.
          warn("Unsupported XFA type.");
        }

        let newXrefInfo = Object.create(null) as XRefInfo;
        if (xref.trailer) {
          // Get string info from Info in order to compute fileId.
          const infoObj: Record<string, string> = Object.create(null);
          const xrefInfo = xref.trailer.get("Info") || undefined;
          if (xrefInfo instanceof Dict) {
            xrefInfo.forEach((key, value) => {
              if (typeof value === "string") {
                infoObj[key] = stringToPDFString(value);
              }
            });
          }

          newXrefInfo = {
            rootRef: catalogRef,
            encryptRef: xref.trailer.getRaw("Encrypt") as Ref || undefined,
            newRef: xref.getNewTemporaryRef(),
            infoRef: xref.trailer.getRaw("Info") as Ref || undefined,
            info: infoObj,
            fileIds: xref.trailer.get("ID") as [string, string] ||
              undefined,
            startXRef: linearization
              ? startXRef
              : xref.lastXRefStreamPos ?? startXRef,
            filename,
          };
        }

        return incrementalUpdate({
          originalData: stream.bytes,
          xrefInfo: newXrefInfo,
          newRefs,
          xref,
          hasXfa: !!xfa,
          xfaDatasetsRef,
          hasXfaDatasetsEntry,
          needAppearances,
          acroFormRef,
          acroForm,
          xfaData,
          // Use the same kind of XRef as the previous one.
          useXrefStream: isDict(xref.topDict, "XRef"),
        }).finally(() => {
          xref.resetNewTemporaryRef();
        });
      },
    );

    handler.on("GetOperatorList", (data, sink) => {
      const pageIndex = data.pageIndex;
      pdfManager.getPage(pageIndex).then((page) => {
        const task = new WorkerTask(`GetOperatorList: page ${pageIndex}`);
        startWorkerTask(task);

        // NOTE: Keep this condition in sync with the `info` helper function.
        const start = verbosity >= VerbosityLevel.INFOS ? Date.now() : 0;

        // Pre compile the pdf page and fetch the fonts/images.
        page
          .getOperatorList({
            handler,
            sink,
            task,
            intent: data.intent,
            cacheKey: data.cacheKey,
            annotationStorage: data.annotationStorage,
          })
          .then(
            (operatorListInfo) => {
              finishWorkerTask(task);

              if (start) {
                info(
                  `page=${pageIndex + 1} - getOperatorList: time=${
                    Date.now() - start
                  }ms, len=${operatorListInfo.length}`,
                );
              }
              sink.close!();
            },
            (reason) => {
              finishWorkerTask(task);

              if (task.terminated) {
                return; // ignoring errors from the terminated thread
              }
              sink.error!(reason);

              // TODO: Should `reason` be re-thrown here (currently that casues
              //       "Uncaught exception: ..." messages in the console)?
            },
          );
      });
    });

    handler.on("GetTextContent", (data, sink) => {
      const { pageIndex, includeMarkedContent, disableNormalization } = data;

      pdfManager.getPage(pageIndex).then((page) => {
        const task = new WorkerTask("GetTextContent: page " + pageIndex);
        startWorkerTask(task);

        // NOTE: Keep this condition in sync with the `info` helper function.
        const start = verbosity >= VerbosityLevel.INFOS ? Date.now() : 0;

        page
          .extractTextContent({
            handler,
            task,
            sink,
            includeMarkedContent,
            disableNormalization,
          })
          .then(() => {
            finishWorkerTask(task);

            if (start) {
              info(
                `page=${pageIndex + 1} - getTextContent: time=` +
                  `${Date.now() - start}ms`,
              );
            }
            sink.close!();
          }, (reason) => {
            finishWorkerTask(task);
            if (task.terminated) {
              return; // ignoring errors from the terminated thread
            }
            sink.error!(reason);

            // TODO: Should `reason` be re-thrown here (currently that casues
            //       "Uncaught exception: ..." messages in the console)?
          });
      });
    });

    handler.on("GetStructTree", (data) => {
      return pdfManager.getPage(data.pageIndex).then(
        (page) => pdfManager.ensure(page, "getStructTree"),
      );
    });

    handler.on("FontFallback", (data) => {
      return pdfManager.fontFallback(data.id, handler);
    });

    handler.on("Cleanup", () => {
      return pdfManager.cleanup(/* manuallyTriggered = */ true);
    });

    handler.on("Terminate", () => {
      terminated = true;

      const waitOn = [];
      if (pdfManager) {
        pdfManager.terminate(new AbortException("Worker was terminated."));

        const cleanupPromise = pdfManager.cleanup();
        waitOn.push(cleanupPromise);

        pdfManager = <any> undefined;
      } else {
        clearGlobalCaches();
      }
      if (cancelXHRs) {
        cancelXHRs(new AbortException("Worker was terminated."));
      }

      for (const task of WorkerTasks) {
        waitOn.push(task.finished);
        task.terminate();
      }

      return Promise.all(waitOn).then(() => {
        // Notice that even if we destroying handler, resolved response promise
        // must be sent back.
        handler.destroy();
        handler = undefined as any;
      });
    });

    handler.on("Ready", () => {
      setupDoc(docParams);
      docParams = undefined as any; // we don't need docParams anymore -- saving memory.
    });

    /*#static*/ if (PDFJSDev || TESTING) {
      handler.on("GetXFADatasets", () => pdfManager.ensureDoc("xfaDatasets"));
      handler.on("GetXRefPrevValue", () =>
        pdfManager
          .ensureXRef("trailer")
          .then((trailer) => trailer!.get("Prev") as number));
      handler.on(
        "GetStartXRefPos",
        () => pdfManager.ensureDoc("startXRef"),
      );
      handler.on(
        "GetAnnotArray",
        (data) =>
          pdfManager.getPage(data.pageIndex).then(
            (page) => page.annotations.map((a) => a.toString()),
          ),
      );
    }

    return workerHandlerName;
  },

  initializeFromPort(port: IWorker) {
    const handler = new MessageHandler<Thread.worker>("worker", "main", port);
    WorkerMessageHandler.setup(handler, port);
    handler.send("ready", null);
  },
};

// function isMessagePort( maybePort:IWorker)
// {
//   return (
//     typeof maybePort.postMessage === "function" && "onmessage" in maybePort
//   );
// }

// Worker thread (and not Node.js)?
if (
  (globalThis as any).DedicatedWorkerGlobalScope &&
  typeof self !== "undefined" && self instanceof DedicatedWorkerGlobalScope
) {
  WorkerMessageHandler.initializeFromPort(self);
}
// if( typeof window === "undefined"
// //  && !isNodeJS
//  && typeof self !== "undefined"
//  && isMessagePort(self)
// ) {
//   WorkerMessageHandler.initializeFromPort(self);
// }
/*80--------------------------------------------------------------------------*/
