export function throttlingCache({ throttle, skip, key, clear, invalidate, condition, flagResponseOnCacheHit, }?: {
    throttle?: number | undefined;
    skip?: ((url: any, opts: any) => any) | undefined;
    key?: ((url: any, opts: any) => string) | undefined;
    clear?: ((url: any, opts: any) => boolean) | undefined;
    invalidate?: ((url: any, opts: any) => null) | undefined;
    condition?: ((response: any) => any) | undefined;
    flagResponseOnCacheHit?: string | undefined;
}): {
    (next: any): (url: any, opts: any) => any;
    cacheResponse(key: any, response: any): void;
    cache: Map<any, any>;
    inflight: Map<any, any>;
    throttling: Set<any>;
};
//# sourceMappingURL=throttlingCache.d.ts.map