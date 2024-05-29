/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/dataset_reader.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { XOR } from "../../../lib/alias.js";
import type { SimpleDOMNode } from "./xml_parser.js";
export type DatasetReaderCtorP = XOR<{
    datasets: string;
}, {
    "xdp:xdp": string;
}>;
export declare class DatasetReader {
    node: SimpleDOMNode | undefined;
    constructor(data: DatasetReaderCtorP);
    getValue(path: string): string | string[];
}
//# sourceMappingURL=dataset_reader.d.ts.map