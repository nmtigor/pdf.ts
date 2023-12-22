export { r as throttlingCache };
declare function r({ throttle: r, skip: a, key: s, clear: h, invalidate: i, condition: l, flagResponseOnCacheHit: f, }?: {
    throttle?: number | undefined;
    skip?: ((e: any, t: any) => any) | undefined;
    key?: ((e: any, t: any) => string) | undefined;
    clear?: ((e: any, t: any) => number) | undefined;
    invalidate?: ((e: any, t: any) => null) | undefined;
    condition?: ((e: any) => any) | undefined;
    flagResponseOnCacheHit?: string | undefined;
}): {
    (e: any): (t: any, n: any) => any;
    cacheResponse(e: any, t: any): void;
    cache: Map<any, any>;
    inflight: Map<any, any>;
    throttling: Set<any>;
};
//# sourceMappingURL=throttlingCache.min.d.mts.map