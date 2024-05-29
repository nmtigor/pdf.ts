/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/xfa/stylesheet.ts
 * @license Apache-2.0
 ******************************************************************************/
import { $buildXFAObject, NamespaceIds } from "./namespaces.js";
import { XFAObject } from "./xfa_object.js";
/*80--------------------------------------------------------------------------*/
const STYLESHEET_NS_ID = NamespaceIds.stylesheet.id;
class Stylesheet extends XFAObject {
    constructor(attributes) {
        super(STYLESHEET_NS_ID, "stylesheet", /* hasChildren = */ true);
    }
}
export const StylesheetNamespace = {
    [$buildXFAObject](name, attributes) {
        if (Object.hasOwn(StylesheetNamespace, name)) {
            return StylesheetNamespace[name](attributes);
        }
        return undefined;
    },
    stylesheet(attrs) {
        return new Stylesheet(attrs);
    },
};
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=stylesheet.js.map