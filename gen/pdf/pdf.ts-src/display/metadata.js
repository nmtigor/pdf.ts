/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
 */
import { objectFromMap } from "../shared/util.js";
/*81---------------------------------------------------------------------------*/
export class Metadata {
    #metadataMap;
    #data;
    getRaw() { return this.#data; }
    constructor({ parsedData, rawData }) {
        this.#metadataMap = parsedData;
        this.#data = rawData;
    }
    get(name) {
        return this.#metadataMap.get(name) ?? undefined;
    }
    getAll() {
        return objectFromMap(this.#metadataMap);
    }
    has(name) {
        return this.#metadataMap.has(name);
    }
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=metadata.js.map