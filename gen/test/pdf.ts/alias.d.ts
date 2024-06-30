/** 80**************************************************************************
 * @module test/pdf.ts/alias
 * @license Apache-2.0
 ******************************************************************************/
import type { uint } from "../../lib/alias.js";
import type { StatTime } from "../../pdf/pdf.ts-src/display/display_utils.js";
export type T_browser = "chrome" | "firefox";
export declare const z_browser: import("../../3rd/zod-3.23.8/lib/index.mjs").ZodEnum;
export type T_info = {
    browser: T_browser;
    message: string;
};
export declare const z_info: import("../../3rd/zod-3.23.8/lib/index.mjs").ZodObject;
export type T_task_results = {
    browser: T_browser;
    id: string;
    numPages: uint;
    /** 1-based */
    lastPageNum: uint;
    failure: string | false;
    file: string;
    /** 0-based */
    round: uint;
    /** 1-based */
    page: uint;
    snapshot: string;
    stats: StatTime[];
    viewportWidth: uint | undefined;
    viewportHeight: uint | undefined;
    outputScale: number | undefined;
};
export declare const z_task_results: import("../../3rd/zod-3.23.8/lib/index.mjs").ZodObject;
export type Stat = {
    browser: T_browser;
    pdf: string;
    page: uint;
    round: uint;
    stats: StatTime[];
};
//# sourceMappingURL=alias.d.ts.map