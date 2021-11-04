/**
 * @param { const } assertion
 * @param { const } msg
 */
export declare const assert: (assertion: any, msg?: string | undefined, meta?: {
    url: string;
} | undefined) => void;
export declare const warn: (msg: string, meta?: {
    url: string;
} | undefined) => void;
declare global {
    interface Error {
        toJ(): any;
    }
}
/**
 * @param { headconst } err_x
 */
export declare const reportError: <E extends Error>(err_x: E) => Promise<void>;
//# sourceMappingURL=trace.d.ts.map