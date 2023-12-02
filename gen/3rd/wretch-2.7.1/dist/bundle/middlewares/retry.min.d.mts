export { t as retry };
declare function t({ delayTimer: t, delayRamp: o, maxAttempts: n, until: s, onRetry: l, retryOnNetworkError: i, resolveWithLatestResponse: u, skip: m }?: {
    delayTimer?: number | undefined;
    delayRamp?: ((e: any, r: any) => number) | undefined;
    maxAttempts?: number | undefined;
    until?: ((e: any) => any) | undefined;
    onRetry?: null | undefined;
    retryOnNetworkError?: number | undefined;
    resolveWithLatestResponse?: number | undefined;
    skip: any;
}): (e: any) => (r: any, c: any) => any;
//# sourceMappingURL=retry.min.d.mts.map