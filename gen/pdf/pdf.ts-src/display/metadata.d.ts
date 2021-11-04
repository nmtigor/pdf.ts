import { SerializedMetadata } from "../core/metadata_parser.js";
export declare class Metadata {
    #private;
    getRaw(): string;
    constructor({ parsedData, rawData }: SerializedMetadata);
    get(name: string): string | string[] | undefined;
    getAll(): Record<string, string | string[]>;
    has(name: string): boolean;
}
//# sourceMappingURL=metadata.d.ts.map