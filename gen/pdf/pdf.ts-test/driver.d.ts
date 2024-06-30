/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2024
 *
 * @module pdf/pdf.ts-test/driver.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { uint } from "../../lib/alias.js";
import type { StatTime } from "../pdf.ts-src/display/display_utils.js";
import type { T_browser, T_info, T_task_results } from "../../test/pdf.ts/alias.js";
import type { FieldObjectsPromise } from "../alias.js";
import type { OptionalContentConfig, PDFDocumentProxy } from "../pdf.ts-src/pdf.js";
import { GenericL10n } from "../pdf.ts-web/genericl10n.js";
import type { TestFilter, TestTask } from "./alias.js";
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
interface TaskData_ extends TestTask {
    /** 0-based */
    round: uint;
    /** 1-based */
    pageNum: uint;
    stats: {
        times: StatTime[];
    };
    fontRules?: string;
    pdfDoc?: PDFDocumentProxy;
    optionalContentConfigPromise?: Promise<OptionalContentConfig>;
    fieldObjects?: Awaited<FieldObjectsPromise>;
    viewportWidth?: uint;
    viewportHeight?: uint;
    renderPrint?: boolean;
}
export declare class Driver {
    _l10n: GenericL10n;
    inflight: HTMLSpanElement;
    disableScrolling: HTMLInputElement;
    output: HTMLPreElement;
    snapshot: HTMLPreElement;
    end: HTMLDivElement;
    browser: T_browser;
    manifestFile: string;
    filterFile: string;
    delay: any;
    inFlightRequests: number;
    testFilter: TestFilter;
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
    _getLastPageNumber(task: TaskData_): uint;
    _nextPage(task: TaskData_, loadError?: string): void;
    _clearCanvas(): void;
    _snapshot(task: TaskData_, failure: string | false): void;
    _quit(): void;
    _info(message: string): void;
    _log(message: string): void;
    _done(): void;
    _sendResult(snapshot: string, task: TaskData_, failure: string | false): Promise<void>;
    _send(url: string, message?: T_info | T_task_results | {
        browser: T_browser;
    }): Promise<void>;
}
export {};
//# sourceMappingURL=driver.d.ts.map