/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
 */
/* Copyright 2021 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { $buildXFAObject, NamespaceIds } from "./namespaces.js";
import { XFAObject } from "./xfa_object.js";
/*81---------------------------------------------------------------------------*/
const STYLESHEET_NS_ID = NamespaceIds.stylesheet.id;
class Stylesheet extends XFAObject {
    constructor(attributes) {
        super(STYLESHEET_NS_ID, "stylesheet", /* hasChildren = */ true);
    }
}
export const StylesheetNamespace = {
    [$buildXFAObject](name, attributes) {
        if (StylesheetNamespace.hasOwnProperty(name)) {
            return StylesheetNamespace[name](attributes);
        }
        return undefined;
    },
    stylesheet(attrs) { return new Stylesheet(attrs); },
};
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=stylesheet.js.map