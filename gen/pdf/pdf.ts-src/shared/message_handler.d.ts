import { HttpStatusCode } from "../../../lib/HttpStatusCode.js";
import { PromiseCap } from "../../../lib/promisecap.js";
import { PageLayout, PageMode } from "../../pdf.ts-web/ui_utils.js";
import { type AnnotationData, type FieldObject } from "../core/annotation.js";
import { type ExplicitDest, type MarkInfo, type OpenAction, type OptionalContentConfigData, type ViewerPref } from "../core/catalog.js";
import { type AnnotActions } from "../core/core_utils.js";
import { type DocumentInfo, type XFAData } from "../core/document.js";
import { type BidiTextContentItem, type FontStyle, type ImgData, type TypeTextContentItem } from "../core/evaluator.js";
import { FontExpotDataEx } from "../core/fonts.js";
import { type CmdArgs } from "../core/font_renderer.js";
import { type SerializedMetadata } from "../core/metadata_parser.js";
import { type OpListIR } from "../core/operator_list.js";
import { type ShadingPatternIR } from "../core/pattern.js";
import { type StructTree } from "../core/struct_tree.js";
import { type IWorker } from "../core/worker.js";
import { type XFAElObj } from "../core/xfa/alias.js";
import { type AnnotStorageRecord } from "../display/annotation_layer.js";
import { type OutlineNode, type PDFDocumentStats, type RefProxy } from "../display/api.js";
import { type CMapData } from "../display/base_factory.js";
import { VerbosityLevel } from "../pdf.js";
import { InvalidPDFException, MissingPDFException, PasswordException, PasswordResponses, PermissionFlag, RenderingIntentFlag, UnexpectedResponseException, UnknownErrorException, UNSUPPORTED_FEATURES, type rect_t } from "./util.js";
interface reason_t {
    name?: string;
    message: string;
    code?: PasswordResponses;
    status?: HttpStatusCode;
    details?: string;
}
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
    annotationStorage?: AnnotStorageRecord | undefined;
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
        Return?: StructTree;
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
declare type MActionName = keyof MActionMap;
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
        }] | [string, "FontPath", CmdArgs[]] | [string, "Image", ImgData | undefined];
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
        Data: PasswordException | InvalidPDFException | MissingPDFException | UnexpectedResponseException | UnknownErrorException;
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
            ...["Pattern", ShadingPatternIR] | ["Image", ImgData | undefined]
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
declare type WActionName = keyof WActionMap;
export declare const enum Thread {
    main = 0,
    worker = 1
}
export declare type ActionName<Ta extends Thread> = Ta extends Thread.main ? MActionName : WActionName;
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
declare type MActionHandler<AN extends MActionName> = (data: MActionMap[AN]["Data"], sink: StreamSink<Thread.main, AN>) => MActionMap[AN]["Return"] | Promise<MActionMap[AN]["Return"]>;
declare type WActionHandler<AN extends WActionName> = (data: WActionMap[AN]["Data"], sink: StreamSink<Thread.worker, AN>) => WActionMap[AN]["Return"] | Promise<WActionMap[AN]["Return"]>;
export declare type ActionHandler<Ta extends Thread, AN extends ActionName<Ta> = ActionName<Ta>> = Ta extends Thread.main ? MActionHandler<AN & MActionName> : WActionHandler<AN & WActionName>;
export declare type ActionData<Ta extends Thread, AN extends ActionName<Ta> = ActionName<Ta>> = Ta extends Thread.main ? MActionMap[AN & MActionName]["Data"] : WActionMap[AN & WActionName]["Data"];
export declare type ActionReturn<Ta extends Thread, AN extends ActionName<Ta> = ActionName<Ta>> = Ta extends Thread.main ? MActionMap[AN & MActionName]["Return"] : WActionMap[AN & WActionName]["Return"];
export declare type ActionSinkchunk<Ta extends Thread, AN extends ActionName<Ta> = ActionName<Ta>> = Ta extends Thread.main ? MActionMap[AN & MActionName]["Sinkchunk"] : WActionMap[AN & WActionName]["Sinkchunk"];
interface StreamController<Ta extends Thread, AN extends ActionName<Ta> = ActionName<Ta>> {
    controller: ReadableStreamDefaultController<ActionSinkchunk<Ta, AN>>;
    startCall: PromiseCap;
    pullCall?: PromiseCap;
    cancelCall?: PromiseCap;
    isClosed: boolean;
}
export declare class MessageHandler<Ta extends Thread, Tn extends Thread = Ta extends Thread.main ? Thread.worker : Thread.main> {
    #private;
    sourceName: string;
    targetName: string;
    comObj: IWorker;
    readonly id: number;
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
    sendWithStream<AN extends ActionName<Ta>>(actionName: AN, data: ActionData<Ta, AN>, queueingStrategy?: QueuingStrategy<ActionSinkchunk<Ta, AN>>, transfers?: Transferable[]): ReadableStream<ActionSinkchunk<Ta, AN>>;
    destroy(): void;
}
export {};
//# sourceMappingURL=message_handler.d.ts.map