/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
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
import { $appendChild, $isNsAgnostic, $namespaceId, $nodeName, $onChild, XFAObject, XmlObject, } from "./xfa_object.js";
import { $buildXFAObject, NamespaceIds } from "./namespaces.js";
/*81---------------------------------------------------------------------------*/
const DATASETS_NS_ID = NamespaceIds.datasets.id;
class Data extends XmlObject {
    constructor(attributes) {
        super(DATASETS_NS_ID, "data", attributes);
    }
    [$isNsAgnostic]() { return true; }
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
        if (DatasetsNamespace.hasOwnProperty(name)) {
            return DatasetsNamespace[name](attributes);
        }
        return undefined;
    },
    datasets(attrs) { return new Datasets(attrs); },
    data(attrs) { return new Data(attrs); },
};
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=datasets.js.map