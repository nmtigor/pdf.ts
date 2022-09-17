/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
import { $buildXFAObject, NamespaceIds } from "./namespaces.js";
import { StringObject, XFAObject, XFAObjectArray } from "./xfa_object.js";
/*80--------------------------------------------------------------------------*/
const CONNECTION_SET_NS_ID = NamespaceIds.connectionSet.id;
export class ConnectionSet extends XFAObject {
    wsdlConnection = new XFAObjectArray();
    xmlConnection = new XFAObjectArray();
    xsdConnection = new XFAObjectArray();
    constructor(attributes) {
        super(CONNECTION_SET_NS_ID, "connectionSet", /* hasChildren = */ true);
    }
}
class EffectiveInputPolicy extends XFAObject {
    constructor(attributes) {
        super(CONNECTION_SET_NS_ID, "effectiveInputPolicy");
        this.id = attributes.id || "";
        this.name = attributes.name || "";
        this.use = attributes.use || "";
        this.usehref = attributes.usehref || "";
    }
}
class EffectiveOutputPolicy extends XFAObject {
    constructor(attributes) {
        super(CONNECTION_SET_NS_ID, "effectiveOutputPolicy");
        this.id = attributes.id || "";
        this.name = attributes.name || "";
        this.use = attributes.use || "";
        this.usehref = attributes.usehref || "";
    }
}
class Operation extends StringObject {
    input;
    output;
    constructor(attributes) {
        super(CONNECTION_SET_NS_ID, "operation");
        this.id = attributes.id || "";
        this.input = attributes.input || "";
        this.name = attributes.name || "";
        this.output = attributes.output || "";
        this.use = attributes.use || "";
        this.usehref = attributes.usehref || "";
    }
}
class RootElement extends StringObject {
    constructor(attributes) {
        super(CONNECTION_SET_NS_ID, "rootElement");
        this.id = attributes.id || "";
        this.name = attributes.name || "";
        this.use = attributes.use || "";
        this.usehref = attributes.usehref || "";
    }
}
class SoapAction extends StringObject {
    constructor(attributes) {
        super(CONNECTION_SET_NS_ID, "soapAction");
        this.id = attributes.id || "";
        this.name = attributes.name || "";
        this.use = attributes.use || "";
        this.usehref = attributes.usehref || "";
    }
}
class SoapAddress extends StringObject {
    constructor(attributes) {
        super(CONNECTION_SET_NS_ID, "soapAddress");
        this.id = attributes.id || "";
        this.name = attributes.name || "";
        this.use = attributes.use || "";
        this.usehref = attributes.usehref || "";
    }
}
class Uri extends StringObject {
    constructor(attributes) {
        super(CONNECTION_SET_NS_ID, "uri");
        this.id = attributes.id || "";
        this.name = attributes.name || "";
        this.use = attributes.use || "";
        this.usehref = attributes.usehref || "";
    }
}
class WsdlAddress extends StringObject {
    constructor(attributes) {
        super(CONNECTION_SET_NS_ID, "wsdlAddress");
        this.id = attributes.id || "";
        this.name = attributes.name || "";
        this.use = attributes.use || "";
        this.usehref = attributes.usehref || "";
    }
}
class WsdlConnection extends XFAObject {
    dataDescription;
    effectiveInputPolicy;
    effectiveOutputPolicy;
    // operation:unknown;
    soapAction;
    soapAddress;
    wsdlAddress;
    constructor(attributes) {
        super(CONNECTION_SET_NS_ID, "wsdlConnection", /* hasChildren = */ true);
        this.dataDescription = attributes.dataDescription || "";
        this.name = attributes.name || "";
    }
}
class XmlConnection extends XFAObject {
    dataDescription;
    uri;
    constructor(attributes) {
        super(CONNECTION_SET_NS_ID, "xmlConnection", /* hasChildren = */ true);
        this.dataDescription = attributes.dataDescription || "";
        this.name = attributes.name || "";
    }
}
class XsdConnection extends XFAObject {
    dataDescription;
    rootElement;
    uri;
    constructor(attributes) {
        super(CONNECTION_SET_NS_ID, "xsdConnection", /* hasChildren = */ true);
        this.dataDescription = attributes.dataDescription || "";
        this.name = attributes.name || "";
    }
}
export const ConnectionSetNamespace = {
    [$buildXFAObject](name, attributes) {
        if (Object.hasOwn(ConnectionSetNamespace, name)) {
            return ConnectionSetNamespace[name](attributes);
        }
        return undefined;
    },
    connectionSet(attrs) {
        return new ConnectionSet(attrs);
    },
    effectiveInputPolicy(attrs) {
        return new EffectiveInputPolicy(attrs);
    },
    effectiveOutputPolicy(attrs) {
        return new EffectiveOutputPolicy(attrs);
    },
    operation(attrs) {
        return new Operation(attrs);
    },
    rootElement(attrs) {
        return new RootElement(attrs);
    },
    soapAction(attrs) {
        return new SoapAction(attrs);
    },
    soapAddress(attrs) {
        return new SoapAddress(attrs);
    },
    uri(attrs) {
        return new Uri(attrs);
    },
    wsdlAddress(attrs) {
        return new WsdlAddress(attrs);
    },
    wsdlConnection(attrs) {
        return new WsdlConnection(attrs);
    },
    xmlConnection(attrs) {
        return new XmlConnection(attrs);
    },
    xsdConnection(attrs) {
        return new XsdConnection(attrs);
    },
};
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=connection_set.js.map