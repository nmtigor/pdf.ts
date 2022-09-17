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
interface ErrorJ {
    ts: number;
    name: string;
    message: string;
    stack: ReturnType<typeof _computeStackTrace>;
}
export interface ReportedError {
    err_j: ErrorJ | undefined;
    ts: number;
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
 * Computes a stack trace for an exception.
 * @headconst @param err_x
 */
declare function _computeStackTrace(err_x: Error): _StackElement[] | undefined;
interface _StackElement {
    url: string | undefined;
    line: number | undefined;
    column: number | undefined;
    func: string;
    args: string[];
}
export {};
//# sourceMappingURL=trace.d.ts.map