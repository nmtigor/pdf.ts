import type { rect_t } from "../../../lib/alias.js";
import type { HttpStatusCode } from "../../../lib/HttpStatusCode.js";
import { PromiseCap } from "../../../lib/util/PromiseCap.js";
import { type ErrorJ } from "../../../lib/util/trace.js";
import type { PageLayout, PageMode } from "../../pdf.ts-web/ui_utils.js";
import type { Annotation, AnnotationData, FieldObject } from "../core/annotation.js";
import type { ExplicitDest, MarkInfo, OpenAction, OptionalContentConfigData, ViewerPref } from "../core/catalog.js";
import type { AnnotActions } from "../core/core_utils.js";
import type { DatasetReader } from "../core/dataset_reader.js";
import type { DocumentInfo, XFAData } from "../core/document.js";
import type { ImgData } from "../core/evaluator.js";
import type { CmdArgs } from "../core/font_renderer.js";
import type { FontExpotDataEx } from "../core/fonts.js";
import type { IWorker } from "../core/iworker.js";
import type { SerializedMetadata } from "../core/metadata_parser.js";
import type { OpListIR } from "../core/operator_list.js";
import type { ShadingPatternIR } from "../core/pattern.js";
import type { EvaluatorOptions } from "../core/pdf_manager.js";
import type { XFAElObj } from "../core/xfa/alias.js";
import type { AnnotStorageRecord } from "../display/annotation_layer.js";
import type { OutlineNode, RefProxy, StructTreeNode, TextItem, TextMarkedContent, TextStyle } from "../display/api.js";
import type { CMapData } from "../display/base_factory.js";
import type { VerbosityLevel } from "../pdf.js";
import type { PasswordExceptionJ, PermissionFlag, RenderingIntentFlag } from "./util.js";
import { PasswordResponses } from "./util.js";
export interface reason_t {
    name: string;
    message: string;
    code?: PasswordResponses;
    status?: HttpStatusCode;
    details?: string;
}
export interface GetDocRequestData {
    docId: string;
    apiVersion: number | undefined;
    data: Uint8Array | undefined;
    password: string | undefined;
    disableAutoFetch: boolean | undefined;
    rangeChunkSize: number | undefined;
    length: number;
    docBaseUrl: string | undefined;
    enableXfa: boolean;
    evaluatorOptions: EvaluatorOptions;
}
interface PumpOperatorListP_ {
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
        Data: undefined;
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
        Return: AnnotationData[] | Annotation[];
        Sinkchunk: undefined;
    };
    GetAnnotArray: {
        Data: {
            pageIndex: number;
        };
        Return: unknown;
        Sinkchunk: unknown;
    };
    GetAttachments: {
        Data: undefined;
        Return: unknown;
        Sinkchunk: undefined;
    };
    GetCalculationOrderIds: {
        Data: undefined;
        Return?: string[];
        Sinkchunk: undefined;
    };
    GetData: {
        Data: undefined;
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
        Data: undefined;
        Return: Record<string, ExplicitDest>;
        Sinkchunk: undefined;
    };
    GetDocJSActions: {
        Data: undefined;
        Return?: AnnotActions;
        Sinkchunk: undefined;
    };
    GetDocRequest: {
        Data: GetDocRequestData;
        Return: string;
        Sinkchunk: undefined;
    };
    GetFieldObjects: {
        Data: undefined;
        Return: Record<string, FieldObject[]> | undefined;
        Sinkchunk: undefined;
    };
    GetJavaScript: {
        Data: null;
        Return?: string[];
        Sinkchunk: undefined;
    };
    GetMarkInfo: {
        Data: undefined;
        Return: MarkInfo | undefined;
        Sinkchunk: undefined;
    };
    GetMetadata: {
        Data: undefined;
        Return: [DocumentInfo, SerializedMetadata | undefined];
        Sinkchunk: undefined;
    };
    GetOpenAction: {
        Data: undefined;
        Return?: OpenAction;
        Sinkchunk: undefined;
    };
    GetOperatorList: {
        Data: PumpOperatorListP_;
        Return: void;
        Sinkchunk: OpListIR;
    };
    GetOptionalContentConfig: {
        Data: undefined;
        Return?: OptionalContentConfigData;
        Sinkchunk: undefined;
    };
    GetOutline: {
        Data: undefined;
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
        Data: undefined;
        Return: string[] | undefined;
        Sinkchunk: undefined;
    };
    GetPageLayout: {
        Data: undefined;
        Return?: PageLayout;
        Sinkchunk: undefined;
    };
    GetPageMode: {
        Data: undefined;
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
        Data: undefined;
        Return: PermissionFlag[] | undefined;
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
            includeMarkedContent: boolean;
            disableNormalization: boolean;
        };
        Return: void;
        Sinkchunk: {
            items: (TextItem | TextMarkedContent)[];
            styles: Record<string, TextStyle>;
        };
    };
    GetViewerPreferences: {
        Data: undefined;
        Return: ViewerPref | undefined;
        Sinkchunk: undefined;
    };
    GetXFADatasets: {
        Data: undefined;
        Return: DatasetReader | undefined;
        Sinkchunk: undefined;
    };
    GetXRefPrevValue: {
        Data: undefined;
        Return: number | undefined;
        Sinkchunk: undefined;
    };
    HasJSActions: {
        Data: undefined;
        Return: boolean;
        Sinkchunk: undefined;
    };
    Ready: {
        Data: undefined;
        Return: void;
        Sinkchunk: undefined;
    };
    SaveDocument: {
        Data: {
            isPureXfa: boolean;
            numPages: number;
            annotationStorage: AnnotStorageRecord;
            filename: string | undefined;
        };
        Return: Uint8Array;
        Sinkchunk: undefined;
    };
    Terminate: {
        Data: undefined;
        Return: void;
        Sinkchunk: undefined;
    };
    test: {
        Data: Uint8Array;
        Return: void;
        Sinkchunk: undefined;
    };
    fakeHandler: {
        Data: {};
        Return: Promise<number> | void;
        Sinkchunk: string | rect_t;
    };
}
type MActionName = keyof MActionMap;
export interface PDFInfo {
    numPages: number;
    fingerprints: [string, string | undefined];
    htmlForXfa: XFAElObj | undefined;
}
export interface ReaderHeaders {
    contentLength: number | undefined;
    isRangeSupported: boolean;
    isStreamingSupported: boolean;
}
export interface WActionMap {
    commonobj: {
        Data: [string, "Font", FontExpotDataEx | {
            error: string;
        }] | [string, "FontPath", CmdArgs[]] | [string, "Image", ImgData | undefined] | [string, "Pattern", ShadingPatternIR];
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
        Data: ErrorJ;
        Return: void;
        Sinkchunk: undefined;
    };
    DocProgress: {
        Data: OnProgressP;
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
            ...["Pattern", ShadingPatternIR] | ["Image", ImgData | undefined]
        ];
        Return: void;
        Sinkchunk: undefined;
    };
    PasswordRequest: {
        Data: PasswordExceptionJ;
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
}
type WActionName = keyof WActionMap;
export declare const enum Thread {
    main = 0,
    worker = 1
}
export type ActionName</** thread at */ Ta extends Thread> = Ta extends Thread.main ? MActionName : WActionName;
export interface StreamSink<Ta extends Thread, AN extends ActionName<Ta> = ActionName<Ta>> {
    enqueue(chunk: ActionSinkchunk<Ta, AN>, size?: number, transfers?: Transferable[]): void;
    close?(): void;
    error?(reason: reason_t): void;
    sinkCapability?: PromiseCap;
    onPull?(desiredSize?: number): void;
    onCancel?(reason: object): void;
    isCancelled?: boolean;
    desiredSize: number | null | undefined;
    ready: Promise<void>;
}
type MActionHandler<AN extends MActionName> = (data: MActionMap[AN]["Data"], sink: StreamSink<Thread.main, AN>) => MActionMap[AN]["Return"] | Promise<MActionMap[AN]["Return"]>;
type WActionHandler<AN extends WActionName> = (data: WActionMap[AN]["Data"], sink: StreamSink<Thread.worker, AN>) => WActionMap[AN]["Return"] | Promise<WActionMap[AN]["Return"]>;
export type ActionHandler<Ta extends Thread, AN extends ActionName<Ta> = ActionName<Ta>> = Ta extends Thread.main ? MActionHandler<AN & MActionName> : WActionHandler<AN & WActionName>;
export type ActionData<Ta extends Thread, AN extends ActionName<Ta> = ActionName<Ta>> = Ta extends Thread.main ? MActionMap[AN & MActionName]["Data"] : WActionMap[AN & WActionName]["Data"];
export type ActionReturn<Ta extends Thread, AN extends ActionName<Ta> = ActionName<Ta>> = Ta extends Thread.main ? MActionMap[AN & MActionName]["Return"] : WActionMap[AN & WActionName]["Return"];
export type ActionSinkchunk<Ta extends Thread, AN extends ActionName<Ta> = ActionName<Ta>> = Ta extends Thread.main ? MActionMap[AN & MActionName]["Sinkchunk"] : WActionMap[AN & WActionName]["Sinkchunk"];
interface StreamController<Ta extends Thread, AN extends ActionName<Ta> = ActionName<Ta>> {
    controller: ReadableStreamDefaultController<ActionSinkchunk<Ta, AN>>;
    startCall: PromiseCap;
    pullCall?: PromiseCap;
    cancelCall?: PromiseCap;
    isClosed: boolean;
}
export declare class MessageHandler<Ta extends Thread, Tn extends Thread = Ta extends Thread.main ? Thread.worker : Thread.main> {
    #private;
    readonly id: number;
    sourceName: string;
    targetName: string;
    comObj: IWorker;
    callbackId: number;
    streamId: number;
    streamSinks: StreamSink<Ta>[];
    streamControllers: StreamController<Tn>[];
    callbackCapabilities: PromiseCap<unknown>[];
    actionHandler: Record<ActionName<Tn>, ActionHandler<Tn>>;
    constructor(sourceName: string, targetName: string, comObj: IWorker);
    on<AN extends ActionName<Tn>>(actionName: AN, handler: ActionHandler<Tn, AN>): void;
    /**
     * Sends a message to the comObj to invoke the action with the supplied data.
     * @param actionName - Thread to call.
     * @param data - JSON data to send.
     * @param transfers - List of transfers/ArrayBuffers.
     */
    send<AN extends ActionName<Ta>>(actionName: AN, data: ActionData<Ta, AN>, transfers?: Transferable[]): void;
    /**
     * Sends a message to the comObj to invoke the action with the supplied data.
     * Expects that the other side will callback with the response.
     * @param actionName Thread to call.
     * @param data JSON data to send.
     * @param transfers List of transfers/ArrayBuffers.
     * @return Promise to be resolved with response data.
     */
    sendWithPromise<AN extends ActionName<Ta>>(actionName: AN, data: ActionData<Ta, AN>, transfers?: Transferable[]): Promise<ActionReturn<Ta, AN>>;
    /**
     * Sends a message to the comObj to invoke the action with the supplied data.
     * Expect that the other side will callback to signal 'start_complete'.
     * @param actionName Thread to call.
     * @param data JSON data to send.
     * @param queueingStrategy Strategy to signal backpressure based on internal queue.
     * @param transfers List of transfers/ArrayBuffers.
     * @return ReadableStream to read data in chunks.
     */
    sendWithStream<AN extends ActionName<Ta>>(actionName: AN, data: ActionData<Ta, AN>, queueingStrategy?: QueuingStrategy<ActionSinkchunk<Ta, AN>> | undefined, transfers?: Transferable[]): ReadableStream<ActionSinkchunk<Ta, AN>>;
    destroy(): void;
}
export {};
//# sourceMappingURL=message_handler.d.ts.map