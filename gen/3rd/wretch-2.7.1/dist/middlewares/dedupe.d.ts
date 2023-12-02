export function dedupe({ skip, key, resolver }?: {
    skip?: ((_: any, opts: any) => any) | undefined;
    key?: ((url: any, opts: any) => string) | undefined;
    resolver?: ((response: any) => any) | undefined;
}): (next: any) => (url: any, opts: any) => any;
//# sourceMappingURL=dedupe.d.ts.map