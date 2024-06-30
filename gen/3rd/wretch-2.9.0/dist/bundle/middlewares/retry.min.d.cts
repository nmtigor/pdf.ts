export function retry({ delayTimer: t, delayRamp: o, maxAttempts: n, until: s, onRetry: i, retryOnNetworkError: l, resolveWithLatestResponse: u, skip: c, }?: {
    delayTimer?: number | undefined;
    delayRamp?: ((e: any, r: any) => number) | undefined;
    maxAttempts?: number | undefined;
    until?: ((e: any) => any) | undefined;
    onRetry?: null | undefined;
    retryOnNetworkError?: number | undefined;
    resolveWithLatestResponse?: number | undefined;
    skip: any;
}): (e: any) => (r: any, m: any) => any;
//# sourceMappingURL=retry.min.d.cts.map