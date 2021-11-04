import { Dict, RefSet } from "./primitives.js";
import { XRef } from "./xref.js";
import { ChunkedStream } from "./chunked_stream.js";
/**
 * A helper for loading missing data in `Dict` graphs. It traverses the graph
 * depth first and queues up any objects that have missing data. Once it has
 * has traversed as many objects that are available it attempts to bundle the
 * missing data requests and then resume from the nodes that weren't ready.
 *
 * NOTE: It provides protection from circular references by keeping track of
 * loaded references. However, you must be careful not to load any graphs
 * that have references to the catalog or other pages since that will cause the
 * entire PDF document object graph to be traversed.
 */
export declare class ObjectLoader {
    #private;
    dict: Dict;
    keys: string[];
    xref: XRef;
    refSet: RefSet | undefined;
    constructor(dict: Dict, keys: string[], xref: XRef);
    load(): Promise<ChunkedStream | undefined>;
}
//# sourceMappingURL=object_loader.d.ts.map