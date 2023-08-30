/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
import { $buildXFAObject, NamespaceIds } from "./namespaces.js";
import { $namespaceId, $nodeName, $onChildCheck } from "./symbol_utils.js";
import { XFAObject, XFAObjectArray } from "./xfa_object.js";
/*80--------------------------------------------------------------------------*/
const XDP_NS_ID = NamespaceIds.xdp.id;
export class Xdp extends XFAObject {
    uuid;
    timeStamp;
    config;
    connectionSet = undefined;
    datasets = undefined;
    localeSet;
    stylesheet = new XFAObjectArray();
    template = undefined;
    constructor(attributes) {
        super(XDP_NS_ID, "xdp", /* hasChildren = */ true);
        this.uuid = attributes.uuid || "";
        this.timeStamp = attributes.timeStamp || "";
    }
    [$onChildCheck](child) {
        const ns = NamespaceIds[child[$nodeName]];
        return ns && child[$namespaceId] === ns.id;
    }
}
export const XdpNamespace = {
    [$buildXFAObject](name, attributes) {
        if (Object.hasOwn(XdpNamespace, name)) {
            return XdpNamespace[name](attributes);
        }
        return undefined;
    },
    xdp(attrs) {
        return new Xdp(attrs);
    },
};
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=xdp.js.map