import { Thread, type GetDocRequestData, MessageHandler } from "../shared/message_handler.js";
import { Ref } from "./primitives.js";
export interface IWorker {
    postMessage(message: any, transfer: Transferable[]): void;
    postMessage(message: any, options?: StructuredSerializeOptions): void;
    addEventListener<K extends keyof WorkerEventMap>(type: K, listener: (this: Worker, ev: WorkerEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    removeEventListener<K extends keyof WorkerEventMap>(type: K, listener: (this: Worker, ev: WorkerEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}
export declare class WorkerTask {
    #private;
    name: string;
    terminated: boolean;
    terminate(): void;
    get finished(): Promise<void>;
    finish(): void;
    constructor(name: string);
    ensureNotTerminated(): void;
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
export declare const WorkerMessageHandler: {
    setup(handler: MessageHandler<Thread.worker>, port: IWorker): void;
    createDocumentHandler(docParms: GetDocRequestData, port: IWorker): string;
    initializeFromPort(port: IWorker): void;
};
//# sourceMappingURL=worker.d.ts.map