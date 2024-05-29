/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/display/metadata.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { SerializedMetadata } from "../core/metadata_parser.js";
export declare class Metadata {
    #private;
    getRaw(): string;
    constructor({ parsedData, rawData }: SerializedMetadata);
    get(name: string): string | string[] | undefined;
    getAll(): Record<string, string | string[]>;
    has(name: string): boolean;
}
//# sourceMappingURL=metadata.d.ts.map