/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
import { $buildXFAObject, NamespaceIds } from "./namespaces.js";
import { $appendChild, $isNsAgnostic, $namespaceId, $nodeName, $onChild, } from "./symbol_utils.js";
import { XFAObject, XmlObject } from "./xfa_object.js";
/*80--------------------------------------------------------------------------*/
const DATASETS_NS_ID = NamespaceIds.datasets.id;
class Data extends XmlObject {
    constructor(attributes) {
        super(DATASETS_NS_ID, "data", attributes);
    }
    [$isNsAgnostic]() {
        return true;
    }
}
export class Datasets extends XFAObject {
    data;
    Signature;
    constructor(attributes) {
        super(DATASETS_NS_ID, "datasets", /* hasChildren = */ true);
    }
    [$onChild](child) {
        const name = child[$nodeName];
        if ((name === "data" && child[$namespaceId] === DATASETS_NS_ID) ||
            (name === "Signature" &&
                child[$namespaceId] === NamespaceIds.signature.id)) {
            this[name] = child;
        }
        this[$appendChild](child);
        return true;
    }
}
export const DatasetsNamespace = {
    [$buildXFAObject](name, attributes) {
        if (Object.hasOwn(DatasetsNamespace, name)) {
            return DatasetsNamespace[name](attributes);
        }
        return undefined;
    },
    datasets(attrs) {
        return new Datasets(attrs);
    },
    data(attrs) {
        return new Data(attrs);
    },
};
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=datasets.js.map