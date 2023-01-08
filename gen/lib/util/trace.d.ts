/** 80**************************************************************************
 * @module lib/util/trace
 * @license Apache-2.0
 ******************************************************************************/
import { ts_t } from "../alias.js";
/**
 * @const @param assertion
 * @const @param msg
 */
export declare const assert: (assertion: any, msg?: string, meta?: {
    url: string;
}) => void;
export declare const warn: (msg: string, meta?: {
    url: string;
}) => void;
interface ErrorJ_ {
    ts: ts_t;
    name: string;
    message: string;
}
export interface ReportedError {
    err_j: ErrorJ_ | undefined;
    ts: ts_t;
}
declare global {
    interface Error {
        toJ(): ErrorJ_;
    }
}
/**
 * @headconst @param err_x
 */
export declare const reportError: <E extends Error>(err_x: E) => Promise<void>;
export {};
//# sourceMappingURL=trace.d.ts.map