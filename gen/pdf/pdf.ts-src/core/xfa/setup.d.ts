import { type XFANsConfig } from "./config.js";
import { type XFANsConnectionSet } from "./connection_set.js";
import { type XFANsDatasets } from "./datasets.js";
import { type XFANsLocaleSet } from "./locale_set.js";
import { type XFANsName } from "./namespaces.js";
import { type XFANsSignature } from "./signature.js";
import { type XFANsStylesheet } from "./stylesheet.js";
import { type XFANsTemplate } from "./template.js";
import { type XFANsXdp } from "./xdp.js";
import { type XFANsXhtml } from "./xhtml.js";
export declare type XFAKnownNs = XFANsConfig | XFANsConnectionSet | XFANsDatasets | XFANsLocaleSet | XFANsSignature | XFANsStylesheet | XFANsTemplate | XFANsXdp | XFANsXhtml;
export declare const NamespaceSetUp: {
    [_ in XFANsName]?: XFAKnownNs;
};
//# sourceMappingURL=setup.d.ts.map