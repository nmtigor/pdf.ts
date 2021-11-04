/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
 */
import { $getAttributes, $getChildren, $nodeName, $setValue, $toString, $uid, } from "./xfa_object.js";
/*81---------------------------------------------------------------------------*/
export class DataHandler {
    data;
    dataset;
    constructor(root, data) {
        this.data = data;
        this.dataset = root.datasets || undefined;
    }
    serialize(storage) {
        const stack = [[-1, this.data[$getChildren]()]];
        while (stack.length > 0) {
            const last = stack[stack.length - 1];
            const [i, children] = last;
            if (i + 1 === children.length) {
                stack.pop();
                continue;
            }
            const child = children[++last[0]];
            const storageEntry = storage.get(child[$uid]);
            if (storageEntry) {
                child[$setValue](storageEntry); //kkkk
            }
            else {
                const attributes = child[$getAttributes]();
                for (const value of attributes.values()) {
                    const entry = storage.get(value[$uid]);
                    if (entry) {
                        value[$setValue](entry); //kkkk
                        break;
                    }
                }
            }
            const nodes = child[$getChildren]();
            if (nodes.length > 0) {
                stack.push([-1, nodes]);
            }
        }
        const buf = [
            `<xfa:datasets xmlns:xfa="http://www.xfa.org/schema/xfa-data/1.0/">`,
        ];
        if (this.dataset) {
            // Dump nodes other than data: they can contains for example
            // some data for choice lists.
            for (const child of this.dataset[$getChildren]()) {
                if (child[$nodeName] !== "data") {
                    child[$toString](buf);
                }
            }
        }
        this.data[$toString](buf);
        buf.push("</xfa:datasets>");
        return buf.join("");
    }
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=data.js.map