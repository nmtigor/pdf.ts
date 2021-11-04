export declare class ToUnicodeMap {
    /**
     * The elements of this.#map can be integers or strings, depending on how
     * `cmap` was created.
     */
    _map: (string | number | undefined)[];
    get length(): number;
    constructor(cmap?: (string | number | undefined)[]);
    forEach(callback: (charCode: number | string, unicodeCharCode: number) => void): void;
    has(i: number): boolean;
    get(i: number): string | number | undefined;
    charCodeOf(value: number | string): number;
    amend(map: string[]): void;
}
export declare class IdentityToUnicodeMap {
    firstChar: number;
    lastChar: number;
    get length(): number;
    constructor(firstChar: number, lastChar: number);
    forEach(callback: (charCode: number, unicodeCharCode: number) => void): void;
    has(i: number): boolean;
    get(i: number): string | undefined;
    charCodeOf(v: unknown): number;
    amend(map: string[]): void;
}
//# sourceMappingURL=to_unicode_map.d.ts.map