import type { GetDocRequestData } from "../shared/message_handler.js";
import { MessageHandler, Thread } from "../shared/message_handler.js";
import type { AnnotSaveData } from "./annotation.js";
import type { IWorker } from "./iworker.js";
import { Ref } from "./primitives.js";
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
/** AnnotSaveData Recursive Array */
export type ASD_RR = AnnotSaveData | ASD_RR[];
export declare const WorkerMessageHandler: {
    setup(handler: MessageHandler<Thread.worker>, port: IWorker): void;
    createDocumentHandler(docParams: GetDocRequestData, port: IWorker): string;
    initializeFromPort(port: IWorker): void;
};
//# sourceMappingURL=worker.d.ts.map