import { XOR } from "../../../lib/alias.js";
import { SimpleDOMNode } from "./xml_parser.js";
export declare type DatasetReaderCtorP = XOR<{
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