/** 80**************************************************************************
 * promisecap
 ** ---------- */
/**
 * Promise Capability object.
 */
export interface PromiseCap<T = void> {
    id: number;
    /**
     * A Promise object.
     */
    promise: Promise<T>;
    /**
     * If the Promise has been fulfilled/rejected.
     */
    settled: boolean;
    /**
     * Fulfills the Promise.
     */
    resolve: (data: T) => void;
    /**
     * Rejects the Promise.
     */
    reject: (reason: any) => void;
}
/**
 * Creates a promise capability object.
 *
 * ! Notice, this could be called in worker thread, where there is no e.g.
 * ! `Node` as in mv.ts.
 */
export declare function createPromiseCap<T = void>(): PromiseCap<T>;
//# sourceMappingURL=promisecap.d.ts.map