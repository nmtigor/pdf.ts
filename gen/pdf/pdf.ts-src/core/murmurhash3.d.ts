export declare class MurmurHash3_64 {
    h1: number;
    h2: number;
    constructor(seed?: number);
    update(input: string | ArrayBufferLike): void;
    hexdigest(): string;
}
//# sourceMappingURL=murmurhash3.d.ts.map