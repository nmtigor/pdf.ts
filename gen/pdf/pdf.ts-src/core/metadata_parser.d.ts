import { SimpleDOMNode } from "./xml_parser.js";
export interface SerializedMetadata {
    parsedData: Map<string, string | string[]>;
    rawData: string;
}
export declare class MetadataParser {
    #private;
    constructor(data: string);
    _repair(data: string): string;
    _getSequence(entry: SimpleDOMNode): SimpleDOMNode[] | undefined;
    _parseArray(entry: SimpleDOMNode): void;
    _parse(xmlDocument: {
        documentElement: SimpleDOMNode;
    }): void;
    get serializable(): SerializedMetadata;
}
//# sourceMappingURL=metadata_parser.d.ts.map