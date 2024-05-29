/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2024
 *
 * @module pdf/pdf.ts-test/driver.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { uint } from "../../lib/alias.js";
import type { Cssc } from "../../lib/color/alias.js";
import type { FieldObjectsPromise } from "../alias.js";
import type { AnnotStorageValue } from "../pdf.ts-src/display/annotation_layer.js";
import type { OptionalContentConfig, PDFDocumentProxy } from "../pdf.ts-src/pdf.js";
import { GenericL10n } from "../pdf.ts-web/genericl10n.js";
type DriverOptions_ = {
    /**
     * Field displaying the number of inflight requests.
     */
    inflight: HTMLSpanElement;
    /**
     * Checkbox to disable automatic scrolling of the output container.
     */
    disableScrolling: HTMLInputElement;
    /**
     * Container for all output messages.
     */
    output: HTMLPreElement;
    /**
     * Container for all snapshots.
     */
    snapshot: HTMLPreElement;
    /**
     * Container for a completion message.
     */
    end: HTMLDivElement;
};
interface TaskJson_ {
    id: string;
    file: string;
    md5: string;
    rounds: number;
    link?: boolean;
    firstPage?: number;
    skipPages?: number[];
    lastPage?: number;
    pageColors?: {
        background: Cssc;
        foreground: Cssc;
    };
    enableXfa?: boolean;
    type: "eq" | "fbf" | "highlight" | "load" | "text" | "other";
    save?: boolean;
    print?: boolean;
    forms?: boolean;
    annotations?: boolean;
    loadAnnotations?: boolean;
    annotationStorage?: Record<string, AnnotStorageValue & {
        bitmapName: string;
    }>;
    isOffscreenCanvasSupported?: boolean;
    renderTaskOnContinue?: boolean;
    optionalContent?: Record<string, boolean>;
    enableAutoFetch?: boolean;
    useSystemFonts?: boolean;
    useWorkerFetch?: boolean;
    outputScale?: number;
    rotation?: 0 | 90 | 180 | 270;
    password?: string;
    aboud?: string;
}
interface TaskData_ extends TaskJson_ {
    round: uint;
    pageNum: number;
    stats: {
        times: unknown[];
    };
    fontRules?: string;
    pdfDoc?: PDFDocumentProxy;
    optionalContentConfigPromise?: Promise<OptionalContentConfig>;
    fieldObjects?: Awaited<FieldObjectsPromise>;
    viewportWidth?: uint;
    viewportHeight?: uint;
    renderPrint?: boolean;
}
type FilterJson_ = {
    tasks: string[];
    limit: uint;
};
export declare class Driver {
    _l10n: GenericL10n;
    inflight: HTMLSpanElement;
    disableScrolling: HTMLInputElement;
    output: HTMLPreElement;
    snapshot: HTMLPreElement;
    end: HTMLDivElement;
    browser: string;
    manifestFile: string;
    filterFile: string | undefined;
    delay: any;
    inFlightRequests: number;
    testFilter: FilterJson_;
    xfaOnly: boolean;
    canvas: HTMLCanvasElement;
    textLayerCanvas?: HTMLCanvasElement;
    annotationLayerCanvas?: HTMLCanvasElement;
    manifest: TaskData_[];
    currentTask: uint;
    constructor(options: DriverOptions_);
    run(): void;
    /**
     * A debugging tool to log to the terminal while tests are running.
     * XXX: This isn't currently referenced, but it's useful for debugging so
     * do not remove it.
     *
     * @param msg The message to log, it will be prepended with the
     *    current PDF ID if there is one.
     */
    log(msg: string): void;
    _nextTask(): void;
    _cleanup(): Promise<void[]>;
    _exceptionToString(e: unknown): string;
    _getLastPageNumber(task: TaskData_): number;
    _nextPage(task: TaskData_, loadError?: string): void;
    _clearCanvas(): void;
    _snapshot(task: TaskData_, failure: string | false): void;
    _quit(): void;
    _info(message: string): void;
    _log(message: string): void;
    _done(): void;
    _sendResult(snapshot: string, task: TaskData_, failure: string | false): Promise<void>;
    _send(url: string, message: string): Promise<void>;
}
export {};
//# sourceMappingURL=driver.d.ts.map