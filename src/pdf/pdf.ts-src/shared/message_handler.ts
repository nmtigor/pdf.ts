/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

/* Copyright 2018 Mozilla Foundation
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

import { _INFO, _PDFDEV, global, PDFTS_vv } from "../../../global.ts";
import { HttpStatusCode } from "../../../lib/HttpStatusCode.ts";
import { isObjectLike } from "../../../lib/jslang.ts";
import { createPromiseCap, PromiseCap } from "../../../lib/promisecap.ts";
import { assert } from "../../../lib/util/trace.ts";
import { PageLayout, PageMode } from "../../pdf.ts-web/ui_utils.ts";
import { type AnnotationData, type FieldObject } from "../core/annotation.ts";
import {
  type ExplicitDest,
  type MarkInfo,
  type OpenAction,
  type OptionalContentConfigData,
  type ViewerPref,
} from "../core/catalog.ts";
import { type AnnotActions } from "../core/core_utils.ts";
import { type DocumentInfo, type XFAData } from "../core/document.ts";
import {
  type BidiTextContentItem,
  type FontStyle,
  type ImgData,
  type TypeTextContentItem,
} from "../core/evaluator.ts";
import { FontExpotDataEx } from "../core/fonts.ts";
import { type CmdArgs } from "../core/font_renderer.ts";
import { type IWorker } from "../core/iworker.ts";
import { type SerializedMetadata } from "../core/metadata_parser.ts";
import { type OpListIR } from "../core/operator_list.ts";
import { type ShadingPatternIR } from "../core/pattern.ts";
import { type XFAElObj } from "../core/xfa/alias.ts";
import { type AnnotStorageRecord } from "../display/annotation_layer.ts";
import {
  StructTreeNode,
  type OutlineNode,
  type PDFDocumentStats,
  type RefProxy,
} from "../display/api.ts";
import { type CMapData } from "../display/base_factory.ts";
import { VerbosityLevel } from "../pdf.ts";
import {
  AbortException,
  InvalidPDFException,
  MissingPDFException,
  PasswordException,
  PasswordResponses,
  PermissionFlag,
  type rect_t,
  RenderingIntentFlag,
  UnexpectedResponseException,
  UnknownErrorException,
  UNSUPPORTED_FEATURES,
} from "./util.ts";
/*80--------------------------------------------------------------------------*/

enum CallbackKind {
  UNKNOWN = 0,
  DATA,
  ERROR,
}

enum StreamKind {
  UNKNOWN = 0,
  CANCEL,
  CANCEL_COMPLETE,
  CLOSE,
  ENQUEUE,
  ERROR,
  PULL,
  PULL_COMPLETE,
  START_COMPLETE,
}

interface reason_t {
  name?: string;
  message: string;

  code?: PasswordResponses;
  status?: HttpStatusCode;
  details?: string;
}

function wrapReason(reason: reason_t) {
  if (!(reason instanceof Error || isObjectLike(reason))) {
    assert(0, 'wrapReason: Expected "reason" to be a (possibly cloned) Error.');
  }
  switch (reason.name) {
    case "AbortException":
      return new AbortException(reason.message);
    case "MissingPDFException":
      return new MissingPDFException(reason.message);
    case "PasswordException":
      return new PasswordException(reason.message, reason.code!);
    case "UnexpectedResponseException":
      return new UnexpectedResponseException(reason.message, reason.status!);
    case "UnknownErrorException":
      return new UnknownErrorException(reason.message, reason.details);
    default:
      return new UnknownErrorException(reason.message, reason.toString());
  }
}
/*49-------------------------------------------*/

export interface GetDocRequestData {
  docId: string;
  apiVersion: number;
  source: {
    data: Uint8Array | number[] | undefined;
    url: string | URL | undefined;
    password: string | undefined;
    disableAutoFetch: boolean | undefined;
    rangeChunkSize: number | undefined;
    length: number | undefined;
  };
  maxImageSize: number | undefined;
  disableFontFace: boolean | undefined;
  docBaseUrl: string | undefined;
  ignoreErrors: boolean | undefined;
  isEvalSupported: boolean | undefined;
  fontExtraProperties: boolean | undefined;
  useSystemFonts: boolean | undefined;
  cMapUrl: string | undefined;
  standardFontDataUrl?: string | undefined;
  enableXfa: boolean | undefined;
}

export interface _PumpOperatorListP {
  pageIndex: number;
  intent: RenderingIntentFlag;
  cacheKey: string;
  annotationStorage: AnnotStorageRecord | undefined;
}

export interface PageInfo {
  rotate: number;
  ref: RefProxy | undefined;
  userUnit: number;
  view: rect_t;
}

export interface MActionMap {
  configure: {
    Data: {
      verbosity: VerbosityLevel;
    };
    Return: void;
    Sinkchunk: undefined;
  };
  Cleanup: {
    Data: null;
    Return: Promise<void>;
    Sinkchunk: undefined;
  };
  FontFallback: {
    Data: {
      id: string;
    };
    Return: void;
    Sinkchunk: undefined;
  };
  GetAnnotations: {
    Data: {
      pageIndex: number;
      intent: RenderingIntentFlag;
    };
    Return: AnnotationData[];
    Sinkchunk: undefined;
  };
  GetAttachments: {
    Data: null;
    Return: unknown;
    Sinkchunk: undefined;
  };
  GetCalculationOrderIds: {
    Data: unknown;
    Return?: string[];
    Sinkchunk: undefined;
  };
  GetData: {
    Data: null;
    Return: Uint8Array;
    Sinkchunk: undefined;
  };
  GetDestination: {
    Data: {
      id: string;
    };
    Return?: ExplicitDest;
    Sinkchunk: undefined;
  };
  GetDestinations: {
    Data: null;
    Return: Record<string, ExplicitDest>;
    Sinkchunk: undefined;
  };
  GetDocJSActions: {
    Data: null;
    Return?: AnnotActions;
    Sinkchunk: undefined;
  };
  GetDocRequest: {
    Data: GetDocRequestData;
    Return: string;
    Sinkchunk: undefined;
  };
  GetFieldObjects: {
    Data: null;
    Return: Record<string, FieldObject[]> | undefined;
    Sinkchunk: undefined;
  };
  GetJavaScript: {
    Data: null;
    Return?: string[];
    Sinkchunk: undefined;
  };
  GetMarkInfo: {
    Data: null;
    Return: MarkInfo | undefined;
    Sinkchunk: undefined;
  };
  GetMetadata: {
    Data: null;
    Return: [DocumentInfo, SerializedMetadata | undefined];
    Sinkchunk: undefined;
  };
  GetOpenAction: {
    Data: null;
    Return?: OpenAction;
    Sinkchunk: undefined;
  };
  GetOperatorList: {
    Data: _PumpOperatorListP;
    Return: void;
    Sinkchunk: OpListIR;
  };
  GetOptionalContentConfig: {
    Data: null;
    Return?: OptionalContentConfigData;
    Sinkchunk: undefined;
  };
  GetOutline: {
    Data: null;
    Return: OutlineNode[] | undefined;
    Sinkchunk: undefined;
  };
  GetPage: {
    Data: {
      pageIndex: number;
    };
    Return: PageInfo;
    Sinkchunk: undefined;
  };
  GetPageIndex: {
    Data: RefProxy;
    Return: number;
    Sinkchunk: undefined;
  };
  GetPageJSActions: {
    Data: {
      pageIndex: number;
    };
    Return?: AnnotActions;
    Sinkchunk: undefined;
  };
  GetPageLabels: {
    Data: null;
    Return: string[] | undefined;
    Sinkchunk: undefined;
  };
  GetPageLayout: {
    Data: null;
    Return?: PageLayout;
    Sinkchunk: undefined;
  };
  GetPageMode: {
    Data: null;
    Return: PageMode;
    Sinkchunk: undefined;
  };
  GetPageXfa: {
    Data: {
      pageIndex: number;
    };
    Return?: XFAData;
    Sinkchunk: undefined;
  };
  GetPermissions: {
    Data: null;
    Return: PermissionFlag[] | undefined;
    Sinkchunk: undefined;
  };
  GetStats: {
    Data: null;
    Return: PDFDocumentStats;
    Sinkchunk: undefined;
  };
  GetStructTree: {
    Data: {
      pageIndex: number;
    };
    Return?: StructTreeNode;
    Sinkchunk: undefined;
  };
  GetTextContent: {
    Data: {
      pageIndex: number;
      combineTextItems: boolean;
      includeMarkedContent: boolean;
    };
    Return: void;
    Sinkchunk: {
      items: (BidiTextContentItem | TypeTextContentItem)[];
      styles: Record<string, FontStyle>;
    };
  };
  GetViewerPreferences: {
    Data: null;
    Return: ViewerPref | undefined;
    Sinkchunk: undefined;
  };
  HasJSActions: {
    Data: null;
    Return: boolean;
    Sinkchunk: undefined;
  };
  Ready: {
    Data: null;
    Return: void;
    Sinkchunk: undefined;
  };
  SaveDocument: {
    Data: {
      isPureXfa: boolean;
      numPages: number;
      annotationStorage: AnnotStorageRecord | undefined;
      filename: string | undefined;
    };
    Return: Uint8Array;
    Sinkchunk: undefined;
  };
  Terminate: {
    Data: null;
    Return: void;
    Sinkchunk: undefined;
  };
  test: {
    Data: Uint8Array;
    Return: void;
    Sinkchunk: undefined;
  };
}

type MActionName = keyof MActionMap;
/*25-------------------*/

export interface PDFInfo {
  numPages: number;
  // fingerprint:string,
  fingerprints: [string, string | undefined];
  // isPureXfa:boolean;
  htmlForXfa: XFAElObj | undefined;
}

export interface ReaderHeaders {
  contentLength: number | undefined;
  isRangeSupported: boolean;
  isStreamingSupported: boolean;
}

export interface WActionMap {
  commonobj: {
    Data:
      | [string, "Font", FontExpotDataEx | { error: string }]
      | [string, "FontPath", CmdArgs[]]
      | [string, "Image", ImgData | undefined];
    Return: void;
    Sinkchunk: undefined;
  };
  DataLoaded: {
    Data: {
      length: number;
    };
    Return: void;
    Sinkchunk: undefined;
  };
  DocException: {
    Data:
      | PasswordException
      | InvalidPDFException
      | MissingPDFException
      | UnexpectedResponseException
      | UnknownErrorException;
    Return: void;
    Sinkchunk: undefined;
  };
  DocProgress: {
    Data: OnProgressP;
    Return: void;
    Sinkchunk: undefined;
  };
  DocStats: {
    Data: PDFDocumentStats;
    Return: void;
    Sinkchunk: undefined;
  };
  FetchBuiltInCMap: {
    Data: {
      name: string;
    };
    Return: Promise<CMapData>;
    Sinkchunk: CMapData;
  };
  FetchStandardFontData: {
    Data: {
      filename: string;
    };
    Return: Promise<Uint8Array>;
    Sinkchunk: unknown;
  };
  GetDoc: {
    Data: {
      pdfInfo: PDFInfo;
    };
    Return: void;
    Sinkchunk: undefined;
  };
  GetRangeReader: {
    Data: {
      begin: number;
      end: number;
    };
    Return: void;
    Sinkchunk: Uint8Array;
  };
  GetReader: {
    Data: null;
    Return: void;
    Sinkchunk: Uint8Array;
  };
  obj: {
    Data: [
      string,
      number,
      ...["Pattern", ShadingPatternIR] | ["Image", ImgData | undefined],
    ];
    Return: void;
    Sinkchunk: undefined;
  };
  PasswordRequest: {
    Data: PasswordException;
    Return: {
      password: string;
    };
    Sinkchunk: undefined;
  };
  ReaderHeadersReady: {
    Data: null;
    Return: ReaderHeaders;
    Sinkchunk: undefined;
  };
  ready: {
    Data: null;
    Return: void;
    Sinkchunk: undefined;
  };
  StartRenderPage: {
    Data: {
      transparency: boolean;
      pageIndex: number;
      cacheKey: string;
    };
    Return: void;
    Sinkchunk: undefined;
  };
  test: {
    Data: boolean;
    Return: void;
    Sinkchunk: undefined;
  };
  UnsupportedFeature: {
    Data: {
      featureId: UNSUPPORTED_FEATURES;
    };
    Return: void;
    Sinkchunk: undefined;
  };
}

type WActionName = keyof WActionMap;
/*25-------------------*/

export const enum Thread {
  main,
  worker,
}

export type ActionName<Ta extends Thread> = Ta extends Thread.main ? MActionName
  : WActionName;
// export type ActionDataMap< Ta extends Thread > = Ta extends Thread.main ? MActionMap : WActionMap;

export interface StreamSink<
  Ta extends Thread,
  AN extends ActionName<Ta> = ActionName<Ta>,
> {
  enqueue(
    chunk: ActionSinkchunk<Ta, AN>,
    size?: number,
    transfers?: Transferable[],
  ): void;
  close?(): void;
  error?(reason: reason_t): void;

  sinkCapability?: PromiseCap;
  onPull?(desiredSize?: number): void;
  onCancel?(reason: object): void;
  isCancelled?: boolean;
  desiredSize: number | null | undefined;
  ready: Promise<void>;
}

type MActionHandler<AN extends MActionName> = (
  data: MActionMap[AN]["Data"],
  sink: StreamSink<Thread.main, AN>,
) => MActionMap[AN]["Return"] | Promise<MActionMap[AN]["Return"]>;
type WActionHandler<AN extends WActionName> = (
  data: WActionMap[AN]["Data"],
  sink: StreamSink<Thread.worker, AN>,
) => WActionMap[AN]["Return"] | Promise<WActionMap[AN]["Return"]>;
// type WActionHandler< AN extends WActionName > = ( data:WActionMap[AN], sink? ) => void | string;
export type ActionHandler<
  Ta extends Thread,
  AN extends ActionName<Ta> = ActionName<Ta>,
> = Ta extends Thread.main ? MActionHandler<AN & MActionName>
  : WActionHandler<AN & WActionName>;

export type ActionData<
  Ta extends Thread,
  AN extends ActionName<Ta> = ActionName<Ta>,
> = Ta extends Thread.main ? MActionMap[AN & MActionName]["Data"]
  : WActionMap[AN & WActionName]["Data"];

export type ActionReturn<
  Ta extends Thread,
  AN extends ActionName<Ta> = ActionName<Ta>,
> = Ta extends Thread.main ? MActionMap[AN & MActionName]["Return"]
  : WActionMap[AN & WActionName]["Return"];

export type ActionSinkchunk<
  Ta extends Thread,
  AN extends ActionName<Ta> = ActionName<Ta>,
> = Ta extends Thread.main ? MActionMap[AN & MActionName]["Sinkchunk"]
  : WActionMap[AN & WActionName]["Sinkchunk"];

interface Message<
  Ta extends Thread,
  AN extends ActionName<Ta> = ActionName<Ta>,
> {
  sourceName: string;
  targetName: string;

  stream?: StreamKind;
  streamId?: number;

  callback?: CallbackKind;
  callbackId?: number;

  action?: AN;
  data?: ActionData<Ta, AN>;
  desiredSize?: number | null;
  reason?: reason_t;
  success?: boolean;

  chunk?: ActionSinkchunk<Ta, AN>;
}
// #if _INFO && PDFTS
function stringof<Ta extends Thread>(msg: Message<Ta>) {
  return `[${msg.sourceName} -> ${msg.targetName}]` +
    (msg.stream ? ` stream_${msg.streamId}: ${StreamKind[msg.stream]}` : "") +
    (msg.callback
      ? ` callback_${msg.callbackId}: ${CallbackKind[msg.callback]}`
      : "") +
    (msg.action ? ` "${msg.action}"` : "");
}
// #endif
/*49-------------------------------------------*/

interface StreamController<
  Ta extends Thread,
  AN extends ActionName<Ta> = ActionName<Ta>,
> {
  controller: ReadableStreamDefaultController<ActionSinkchunk<Ta, AN>>;
  startCall: PromiseCap;
  pullCall?: PromiseCap;
  cancelCall?: PromiseCap;
  isClosed: boolean;
}

export class MessageHandler<
  Ta extends Thread,
  Tn extends Thread = Ta extends Thread.main ? Thread.worker : Thread.main,
> {
  static #ID = 0;
  readonly id = ++MessageHandler.#ID;

  sourceName;
  targetName;
  comObj;
  callbackId = 1;
  streamId = 1;
  streamSinks: StreamSink<Ta>[] = Object.create(null);
  streamControllers: StreamController<Tn>[] = Object.create(null);
  callbackCapabilities: PromiseCap<unknown>[] = Object.create(null);
  actionHandler: Record<ActionName<Tn>, ActionHandler<Tn>> = Object.create(
    null,
  );

  constructor(sourceName: string, targetName: string, comObj: IWorker) {
    this.sourceName = sourceName;
    this.targetName = targetName;
    this.comObj = comObj;

    comObj.addEventListener("message", this.#onComObjOnMessage);
  }

  #onComObjOnMessage = (event: MessageEvent<Message<Tn>>) => {
    const data = event.data;
    if (data.targetName !== this.sourceName) {
      return;
    }
    /*#static*/ if (_INFO && PDFTS_vv) {
      console.log(
        `${global.indent}>>>>>>> MessageHandler_${this.sourceName}_${this.id}.#onComObjOnMessage() >>>>>>>`,
      );
      console.log(`${global.dent}${stringof(event.data)}`);
    }
    if (data.stream) {
      this.#processStreamMessage(data);
      /*#static*/ if (_INFO && PDFTS_vv) {
        global.outdent;
      }
      return;
    }
    if (data.callback) {
      const callbackId = data.callbackId!;
      const capability = this.callbackCapabilities[callbackId];
      if (!capability) {
        throw new Error(`Cannot resolve callback ${callbackId}`);
      }
      delete this.callbackCapabilities[callbackId];

      if (data.callback === CallbackKind.DATA) {
        capability.resolve(data.data);
      } else if (data.callback === CallbackKind.ERROR) {
        capability.reject(wrapReason(data.reason!));
      } else {
        throw new Error("Unexpected callback case");
      }
      /*#static*/ if (_INFO && PDFTS_vv) {
        global.outdent;
      }
      return;
    }
    const action = this.actionHandler[data.action!];
    if (!action) {
      throw new Error(`Unknown action from worker: ${data.action}`);
    }
    if (data.callbackId) {
      const comObj = this.comObj;
      const cbSourceName = this.sourceName;
      const cbTargetName = data.sourceName;

      new Promise((resolve) => {
        resolve(action(<any> data.data, <any> undefined));
      }).then(
        (result) => {
          comObj.postMessage({
            sourceName: cbSourceName,
            targetName: cbTargetName,
            callback: CallbackKind.DATA,
            callbackId: data.callbackId,
            data: result,
          }, undefined);
        },
        (reason) => {
          comObj.postMessage({
            sourceName: cbSourceName,
            targetName: cbTargetName,
            callback: CallbackKind.ERROR,
            callbackId: data.callbackId,
            reason: wrapReason(reason),
          }, undefined);
        },
      );
      /*#static*/ if (_INFO && PDFTS_vv) {
        global.outdent;
      }
      return;
    }
    if (data.streamId) {
      this.#createStreamSink(data);
      /*#static*/ if (_INFO && PDFTS_vv) {
        global.outdent;
      }
      return;
    }
    action(<any> data.data, <any> undefined);
    /*#static*/ if (_INFO && PDFTS_vv) {
      global.outdent;
    }
  };

  on<AN extends ActionName<Tn>>(
    actionName: AN,
    handler: ActionHandler<Tn, AN>,
  ) {
    /*#static*/ if (_PDFDEV) {
      assert(
        typeof handler === "function",
        'MessageHandler.on: Expected "handler" to be a function.',
      );
    }
    const ah = this.actionHandler;
    if (ah[actionName]) {
      throw new Error(`There is already an actionName called "${actionName}"`);
    }
    ah[actionName] = <ActionHandler<Tn>> <unknown> handler;
  }

  /**
   * Sends a message to the comObj to invoke the action with the supplied data.
   * @param actionName - Thread to call.
   * @param data - JSON data to send.
   * @param transfers - List of transfers/ArrayBuffers.
   */
  send<AN extends ActionName<Ta>>(
    actionName: AN,
    data: ActionData<Ta, AN>,
    transfers?: Transferable[],
  ) {
    this.comObj.postMessage(
      {
        sourceName: this.sourceName,
        targetName: this.targetName,
        action: actionName,
        data,
      },
      <any> transfers,
    );
  }

  /**
   * Sends a message to the comObj to invoke the action with the supplied data.
   * Expects that the other side will callback with the response.
   * @param actionName Thread to call.
   * @param data JSON data to send.
   * @param transfers List of transfers/ArrayBuffers.
   * @return Promise to be resolved with response data.
   */
  sendWithPromise<AN extends ActionName<Ta>>(
    actionName: AN,
    data: ActionData<Ta, AN>,
    transfers?: Transferable[],
  ): Promise<ActionReturn<Ta, AN>> {
    const callbackId = this.callbackId++;
    const capability = createPromiseCap<ActionReturn<Ta, AN>>();
    this.callbackCapabilities[callbackId] = <PromiseCap<unknown>> capability;
    try {
      this.comObj.postMessage(
        {
          sourceName: this.sourceName,
          targetName: this.targetName,
          action: actionName,
          callbackId,
          data,
        },
        <any> transfers,
      );
    } catch (ex) {
      capability.reject(ex);
    }
    return capability.promise;
  }

  /**
   * Sends a message to the comObj to invoke the action with the supplied data.
   * Expect that the other side will callback to signal 'start_complete'.
   * @param actionName Thread to call.
   * @param data JSON data to send.
   * @param queueingStrategy Strategy to signal backpressure based on internal queue.
   * @param transfers List of transfers/ArrayBuffers.
   * @return ReadableStream to read data in chunks.
   */
  sendWithStream<AN extends ActionName<Ta>>(
    actionName: AN,
    data: ActionData<Ta, AN>,
    queueingStrategy?: QueuingStrategy<ActionSinkchunk<Ta, AN>>,
    transfers?: Transferable[],
  ) {
    const streamId = this.streamId++,
      sourceName = this.sourceName,
      targetName = this.targetName,
      comObj = this.comObj;

    return new ReadableStream<ActionSinkchunk<Ta, AN>>(
      {
        start: (controller: ReadableStreamDefaultController) => {
          const startCapability = createPromiseCap();
          this.streamControllers[streamId] = {
            controller,
            startCall: startCapability,
            isClosed: false,
          };
          comObj.postMessage(
            {
              sourceName,
              targetName,
              action: actionName,
              streamId,
              data,
              desiredSize: controller.desiredSize,
            },
            <any> transfers,
          );
          // Return Promise for Async process, to signal success/failure.
          return startCapability.promise;
        },

        pull: (controller: ReadableStreamDefaultController) => {
          const pullCapability = createPromiseCap();
          this.streamControllers[streamId].pullCall = pullCapability;
          comObj.postMessage({
            sourceName,
            targetName,
            stream: StreamKind.PULL,
            streamId,
            desiredSize: controller.desiredSize,
          }, undefined);
          // Returning Promise will not call "pull"
          // again until current pull is resolved.
          return pullCapability.promise;
        },

        cancel: (reason: reason_t) => {
          // assert(reason instanceof Error, "cancel must have a valid reason");
          const cancelCapability = createPromiseCap();
          this.streamControllers[streamId].cancelCall = cancelCapability;
          this.streamControllers[streamId].isClosed = true;
          comObj.postMessage({
            sourceName,
            targetName,
            stream: StreamKind.CANCEL,
            streamId,
            reason: wrapReason(reason),
          });
          // Return Promise to signal success or failure.
          return cancelCapability.promise;
        },
      },
      queueingStrategy,
    );
  }

  #createStreamSink(data: Message<Tn>) {
    const streamId = data.streamId!,
      sourceName = this.sourceName,
      targetName = data.sourceName,
      comObj = this.comObj;
    const self = this,
      action = this.actionHandler[data.action!];

    const sinkCapability = createPromiseCap();
    const streamSink: StreamSink<Ta> = {
      enqueue(chunk, size = 1, transfers) {
        if (this.isCancelled) {
          return;
        }
        const lastDesiredSize = this.desiredSize!;
        this.desiredSize! -= size;
        // Enqueue decreases the desiredSize property of sink,
        // so when it changes from positive to negative,
        // set ready as unresolved promise.
        if (lastDesiredSize > 0 && this.desiredSize! <= 0) {
          this.sinkCapability = createPromiseCap();
          this.ready = this.sinkCapability.promise;
        }
        comObj.postMessage(
          {
            sourceName,
            targetName,
            stream: StreamKind.ENQUEUE,
            streamId,
            chunk,
          },
          <any> transfers,
        );
      },

      close() {
        if (this.isCancelled) {
          return;
        }
        this.isCancelled = true;
        comObj.postMessage({
          sourceName,
          targetName,
          stream: StreamKind.CLOSE,
          streamId,
        });
        delete self.streamSinks[streamId];
      },

      error(reason) {
        assert(reason instanceof Error, "error must have a valid reason");
        if (this.isCancelled) {
          return;
        }
        this.isCancelled = true;
        comObj.postMessage({
          sourceName,
          targetName,
          stream: StreamKind.ERROR,
          streamId,
          reason: wrapReason(reason),
        }, undefined);
      },

      sinkCapability,
      isCancelled: false,
      desiredSize: data.desiredSize,
      ready: sinkCapability.promise,
    };

    sinkCapability.resolve();
    this.streamSinks[streamId] = streamSink;

    new Promise((resolve) => {
      resolve(action(<any> data.data, <any> streamSink));
    }).then(
      () => {
        comObj.postMessage({
          sourceName,
          targetName,
          stream: StreamKind.START_COMPLETE,
          streamId,
          success: true,
        });
      },
      (reason) => {
        comObj.postMessage({
          sourceName,
          targetName,
          stream: StreamKind.START_COMPLETE,
          streamId,
          reason: wrapReason(reason),
        });
      },
    );
  }

  #processStreamMessage(data: Message<Tn>) {
    const streamId = data.streamId!,
      sourceName = this.sourceName,
      targetName = data.sourceName,
      comObj = this.comObj;
    const streamController = this.streamControllers[streamId],
      streamSink = this.streamSinks[streamId];

    switch (data.stream) {
      case StreamKind.START_COMPLETE:
        if (data.success) {
          streamController.startCall.resolve();
        } else {
          streamController.startCall.reject(wrapReason(data.reason!));
        }
        break;
      case StreamKind.PULL_COMPLETE:
        if (data.success) {
          streamController.pullCall!.resolve();
        } else {
          streamController.pullCall!.reject(wrapReason(data.reason!));
        }
        break;
      case StreamKind.PULL:
        // Ignore any pull after close is called.
        if (!streamSink) {
          comObj.postMessage({
            sourceName,
            targetName,
            stream: StreamKind.PULL_COMPLETE,
            streamId,
            success: true,
          });
          break;
        }
        // Pull increases the desiredSize property of sink, so when it changes
        // from negative to positive, set ready property as resolved promise.
        if (streamSink.desiredSize! <= 0 && data.desiredSize! > 0) {
          streamSink.sinkCapability!.resolve();
        }
        // Reset desiredSize property of sink on every pull.
        streamSink.desiredSize = data.desiredSize;

        new Promise((resolve) => {
          resolve(streamSink.onPull && streamSink.onPull());
        }).then(
          () => {
            comObj.postMessage({
              sourceName,
              targetName,
              stream: StreamKind.PULL_COMPLETE,
              streamId,
              success: true,
            });
          },
          (reason) => {
            comObj.postMessage({
              sourceName,
              targetName,
              stream: StreamKind.PULL_COMPLETE,
              streamId,
              reason: wrapReason(reason),
            });
          },
        );
        break;
      case StreamKind.ENQUEUE:
        assert(streamController, "enqueue should have stream controller");
        if (streamController.isClosed) {
          break;
        }
        streamController.controller.enqueue(data.chunk);
        break;
      case StreamKind.CLOSE:
        assert(streamController, "close should have stream controller");
        if (streamController.isClosed) {
          break;
        }
        streamController.isClosed = true;
        streamController.controller.close();
        this.#deleteStreamController(streamController, streamId);
        break;
      case StreamKind.ERROR:
        assert(streamController, "error should have stream controller");
        streamController.controller.error(wrapReason(data.reason!));
        this.#deleteStreamController(streamController, streamId);
        break;
      case StreamKind.CANCEL_COMPLETE:
        if (data.success) {
          streamController.cancelCall!.resolve();
        } else {
          streamController.cancelCall!.reject(wrapReason(data.reason!));
        }
        this.#deleteStreamController(streamController, streamId);
        break;
      case StreamKind.CANCEL:
        if (!streamSink) {
          break;
        }

        new Promise((resolve) => {
          resolve(
            streamSink.onCancel &&
              streamSink.onCancel(wrapReason(data.reason!)),
          );
        }).then(
          () => {
            comObj.postMessage({
              sourceName,
              targetName,
              stream: StreamKind.CANCEL_COMPLETE,
              streamId,
              success: true,
            });
          },
          (reason) => {
            comObj.postMessage({
              sourceName,
              targetName,
              stream: StreamKind.CANCEL_COMPLETE,
              streamId,
              reason: wrapReason(reason),
            });
          },
        );
        streamSink.sinkCapability!.reject(wrapReason(data.reason!));
        streamSink.isCancelled = true;
        delete this.streamSinks[streamId];
        break;
      default:
        throw new Error("Unexpected stream case");
    }
  }

  async #deleteStreamController(
    streamController: StreamController<Tn>,
    streamId: number,
  ) {
    // Delete the `streamController` only when the start, pull, and cancel
    // capabilities have settled, to prevent `TypeError`s.
    await Promise.allSettled([
      streamController.startCall && streamController.startCall.promise,
      streamController.pullCall && streamController.pullCall.promise,
      streamController.cancelCall && streamController.cancelCall.promise,
    ]);
    delete this.streamControllers[streamId];
  }

  destroy() {
    this.comObj.removeEventListener("message", this.#onComObjOnMessage);
  }
}
/*80--------------------------------------------------------------------------*/
