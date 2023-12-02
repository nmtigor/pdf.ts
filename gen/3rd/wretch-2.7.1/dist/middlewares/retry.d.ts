export function retry({ delayTimer, delayRamp, maxAttempts, until, onRetry, retryOnNetworkError, resolveWithLatestResponse, skip, }?: {
    delayTimer?: number | undefined;
    delayRamp?: ((delay: any, nbOfAttempts: any) => number) | undefined;
    maxAttempts?: number | undefined;
    until?: ((response: any) => any) | undefined;
    onRetry?: null | undefined;
    retryOnNetworkError?: boolean | undefined;
    resolveWithLatestResponse?: boolean | undefined;
    skip: any;
}): (next: any) => (url: any, opts: any) => any;
//# sourceMappingURL=retry.d.ts.map