/**
 * @param { const } assertion
 * @param { const } msg
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
    stack: ReturnType<typeof computeStackTrace_>;
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
 * @param { headconst } err_x
 */
export declare const reportError: <E extends Error>(err_x: E) => Promise<void>;
/**
 * Computes a stack trace for an exception.
 * @param { headconst } err_x
 */
declare function computeStackTrace_(err_x: Error): {
    url: string | null;
    func: string;
    args: string[];
    line: number | null;
    column: number | null;
}[] | null;
export {};
//# sourceMappingURL=trace.d.ts.map