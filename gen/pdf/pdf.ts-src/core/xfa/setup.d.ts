import { XFANsConfig } from "./config.js";
import { XFANsConnectionSet } from "./connection_set.js";
import { XFANsDatasets } from "./datasets.js";
import { XFANsLocaleSet } from "./locale_set.js";
import { XFANsName } from "./namespaces.js";
import { XFANsSignature } from "./signature.js";
import { XFANsStylesheet } from "./stylesheet.js";
import { XFANsTemplate } from "./template.js";
import { XFANsXdp } from "./xdp.js";
import { XFANsXhtml } from "./xhtml.js";
export declare type XFAKnownNs = XFANsConfig | XFANsConnectionSet | XFANsDatasets | XFANsLocaleSet | XFANsSignature | XFANsStylesheet | XFANsTemplate | XFANsXdp | XFANsXhtml;
export declare const NamespaceSetUp: {
    [_ in XFANsName]?: XFAKnownNs;
};
//# sourceMappingURL=setup.d.ts.map