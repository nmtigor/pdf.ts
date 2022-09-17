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
import { FormatError, warn } from "../shared/util.js";
import { Dict, RefSet } from "./primitives.js";
/*80--------------------------------------------------------------------------*/
/**
 * A NameTree/NumberTree is like a Dict but has some advantageous properties,
 * see the specification (7.9.6 and 7.9.7) for additional details.
 * TODO: implement all the Dict functions and make this more efficient.
 */
class NameOrNumberTree {
    root;
    xref;
    #type;
    constructor(root, xref, type) {
        this.root = root;
        this.xref = xref;
        this.#type = type;
    }
    getAll() {
        const map = new Map();
        if (!this.root) {
            return map;
        }
        const xref = this.xref;
        // Reading Name/Number tree.
        const processed = new RefSet();
        processed.put(this.root);
        const queue = [this.root];
        while (queue.length > 0) {
            const obj = xref.fetchIfRef(queue.shift());
            if (!(obj instanceof Dict)) {
                continue;
            }
            if (obj.has("Kids")) {
                const kids = obj.get("Kids");
                if (!Array.isArray(kids)) {
                    continue;
                }
                for (const kid of kids) {
                    if (processed.has(kid)) {
                        throw new FormatError(`Duplicate entry in "${this.#type}" tree.`);
                    }
                    queue.push(kid);
                    processed.put(kid);
                }
                continue;
            }
            const entries = obj.get(this.#type);
            if (!Array.isArray(entries)) {
                continue;
            }
            for (let i = 0, ii = entries.length; i < ii; i += 2) {
                map.set(xref.fetchIfRef(entries[i]), xref.fetchIfRef(entries[i + 1]));
            }
        }
        return map;
    }
    get(key) {
        if (!this.root) {
            return null;
        }
        const xref = this.xref;
        let kidsOrEntries = xref.fetchIfRef(this.root);
        let loopCount = 0;
        const MAX_LEVELS = 10;
        // Perform a binary search to quickly find the entry that
        // contains the key we are looking for.
        while (kidsOrEntries.has("Kids")) {
            if (++loopCount > MAX_LEVELS) {
                warn(`Search depth limit reached for "${this.#type}" tree.`);
                return null;
            }
            const kids = kidsOrEntries.get("Kids");
            if (!Array.isArray(kids)) {
                return null;
            }
            let l = 0;
            let r = kids.length - 1;
            while (l <= r) {
                const m = (l + r) >> 1;
                const kid = xref.fetchIfRef(kids[m]);
                const limits = kid.get("Limits");
                if (key < xref.fetchIfRef(limits[0])) {
                    r = m - 1;
                }
                else if (key > xref.fetchIfRef(limits[1])) {
                    l = m + 1;
                }
                else {
                    kidsOrEntries = kid;
                    break;
                }
            }
            if (l > r) {
                return null;
            }
        }
        // If we get here, then we have found the right entry. Now go through the
        // entries in the dictionary until we find the key we're looking for.
        const entries = kidsOrEntries.get(this.#type);
        if (Array.isArray(entries)) {
            // Perform a binary search to reduce the lookup time.
            let l = 0, r = entries.length - 2;
            while (l <= r) {
                // Check only even indices (0, 2, 4, ...) because the
                // odd indices contain the actual data.
                const tmp = (l + r) >> 1, m = tmp + (tmp & 1);
                const currentKey = xref.fetchIfRef(entries[m]);
                if (key < currentKey) {
                    r = m - 2;
                }
                else if (key > currentKey) {
                    l = m + 2;
                }
                else {
                    return xref.fetchIfRef(entries[m + 1]);
                }
            }
        }
        return null;
    }
}
export class NameTree extends NameOrNumberTree {
    constructor(root, xref) {
        super(root, xref, "Names");
    }
}
export class NumberTree extends NameOrNumberTree {
    constructor(root, xref) {
        super(root, xref, "Nums");
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=name_number_tree.js.map