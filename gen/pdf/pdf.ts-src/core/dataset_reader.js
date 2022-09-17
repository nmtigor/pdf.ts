/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
import { stringToUTF8String, warn } from "../shared/util.js";
import { parseXFAPath } from "./core_utils.js";
import { SimpleXMLParser, } from "./xml_parser.js";
/*80--------------------------------------------------------------------------*/
function decodeString(str) {
    try {
        return stringToUTF8String(str);
    }
    catch (ex) {
        warn(`UTF-8 decoding failed: "${ex}".`);
        return str;
    }
}
class DatasetXMLParser extends SimpleXMLParser {
    node;
    constructor(options) {
        super(options);
    }
    onEndElement(name) {
        const node = super.onEndElement(name);
        if (node && name === "xfa:datasets") {
            this.node = node;
            // We don't need anything else, so just kill the parser.
            throw new Error("Aborting DatasetXMLParser.");
        }
        return undefined;
    }
}
export class DatasetReader {
    node;
    constructor(data) {
        if (data.datasets) {
            this.node = new SimpleXMLParser({ hasAttributes: true }).parseFromString(data.datasets).documentElement;
        }
        else {
            const parser = new DatasetXMLParser({ hasAttributes: true });
            try {
                parser.parseFromString(data["xdp:xdp"]);
            }
            catch (_) { }
            this.node = parser.node;
        }
    }
    getValue(path) {
        if (!this.node || !path) {
            return "";
        }
        const node = this.node.searchNode(parseXFAPath(path), 0);
        if (!node) {
            return "";
        }
        const first = node.firstChild;
        if (first && first.nodeName === "value") {
            return node.children.map((child) => decodeString(child.textContent));
        }
        return decodeString(node.textContent);
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=dataset_reader.js.map