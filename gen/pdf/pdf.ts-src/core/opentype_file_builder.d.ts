export declare function writeInt16(dest: Uint8Array, offset: number, num: number): void;
export declare function writeInt32(dest: Uint8Array, offset: number, num: number): void;
export declare function writeData(dest: Uint8Array, offset: number, data: Uint8Array | string | number[]): void;
export declare const VALID_TABLES: readonly ["OS/2", "cmap", "head", "hhea", "hmtx", "maxp", "name", "post", "loca", "glyf", "fpgm", "prep", "cvt ", "CFF "];
export declare type OTTag = (typeof VALID_TABLES)[number];
export interface OTTable {
    tag: OTTag;
    checksum: number;
    offset: number;
    length: number;
    data: Uint8Array;
}
export declare class OpenTypeFileBuilder {
    sfnt: string;
    tables: Record<OTTag, OTTable | Uint8Array | string | number[]>;
    constructor(sfnt: string);
    static getSearchParams(entriesCount: number, entrySize: number): {
        range: number;
        entry: number;
        rangeShift: number;
    };
    toArray(): Uint8Array;
    addTable(tag: OTTag, data: Uint8Array | string | number[]): void;
}
//# sourceMappingURL=opentype_file_builder.d.ts.map