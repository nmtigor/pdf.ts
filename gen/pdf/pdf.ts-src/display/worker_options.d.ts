interface GlobalWorkerOptionsType {
    /**
     * Defines global port for worker process. Overrides the `workerSrc` option.
     */
    workerPort?: Worker | undefined;
    /**
     * A string containing the path and filename of the worker file.
     *
     *   NOTE: The `workerSrc` option should always be set, in order to prevent any
     *         issues when using the PDF.js library.
     */
    workerSrc: string;
}
export declare const GlobalWorkerOptions: GlobalWorkerOptionsType;
export {};
//# sourceMappingURL=worker_options.d.ts.map