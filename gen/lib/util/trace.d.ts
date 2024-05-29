/** 80**************************************************************************
 * @module lib/util/trace
 * @license Apache-2.0
 ******************************************************************************/
import type { ts_t } from "../alias.js";
/**
 * @const @param assertion
 * @const @param msg
 */
export declare function assert(assertion: any, ...data: any[]): void;
export declare function fail(...data: any[]): never;
export declare function warn(...data: any[]): void;
export interface ErrorJ {
    name: string;
    message: string;
}
export interface ReportedError {
    err_j: ErrorJ | undefined;
    ts: ts_t;
}
declare global {
    interface Error {
        toJ(): ErrorJ;
    }
}
/**
 * @headconst @param err_x
 */
export declare const reportError: <E extends Error>(err_x: E) => Promise<void>;
/**
 * Ref. https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/#decorators
 * @headconst @param tgt_x
 * @headconst @param ctx_x
 */
export declare const bind: (tgt_x: any, ctx_x: ClassMethodDecoratorContext) => void;
/**
 * Ref. https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/#decorators
 * @const @param _x
 */
export declare const traceOut: (_x: boolean) => <This, Args extends any[], Return>(tgt_x: (this: This, ...args: Args) => Return, ctx_x: ClassMethodDecoratorContext) => (this: This, ...args: Args) => Return;
//# sourceMappingURL=trace.d.ts.map