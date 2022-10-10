/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
/* Copyright 2020 Mozilla Foundation
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
import { assert } from "../../../lib/util/trace.js";
import { MurmurHash3_64 } from "../shared/murmurhash3.js";
import { objectFromMap, warn } from "../shared/util.js";
/*80--------------------------------------------------------------------------*/
const INTERNAL = Symbol("INTERNAL");
class OptionalContentGroup {
    name;
    intent;
    #visible = true;
    get visible() {
        return this.#visible;
    }
    /** @ignore */
    _setVisible(internal, visible) {
        if (internal !== INTERNAL) {
            assert(0, "Internal method `_setVisible` called.");
        }
        this.#visible = visible;
    }
    constructor(name, intent) {
        this.name = name;
        this.intent = intent;
    }
}
export class OptionalContentConfig {
    name = null;
    creator = null;
    #cachedGetHash;
    #groups = new Map();
    #initialHash;
    #order = null;
    constructor(data) {
        if (data === undefined) {
            return;
        }
        this.name = data.name;
        this.creator = data.creator;
        this.#order = data.order;
        for (const group of data.groups) {
            this.#groups.set(group.id, new OptionalContentGroup(group.name, group.intent));
        }
        if (data.baseState === "OFF") {
            for (const group of this.#groups.values()) {
                group._setVisible(INTERNAL, false);
            }
        }
        for (const on of data.on) {
            this.#groups.get(on)._setVisible(INTERNAL, true);
        }
        for (const off of data.off) {
            this.#groups.get(off)._setVisible(INTERNAL, false);
        }
        // The following code must always run *last* in the constructor.
        this.#initialHash = this.getHash();
    }
    #evaluateVisibilityExpression(array) {
        const length = array.length;
        if (length < 2) {
            return true;
        }
        const operator = array[0];
        for (let i = 1; i < length; i++) {
            const element = array[i];
            let state;
            if (Array.isArray(element)) {
                state = this.#evaluateVisibilityExpression(element);
            }
            else if (this.#groups.has(element)) {
                state = this.#groups.get(element).visible;
            }
            else {
                warn(`Optional content group not found: ${element}`);
                return true;
            }
            switch (operator) {
                case "And":
                    if (!state) {
                        return false;
                    }
                    break;
                case "Or":
                    if (state) {
                        return true;
                    }
                    break;
                case "Not":
                    return !state;
                default:
                    return true;
            }
        }
        return operator === "And";
    }
    isVisible(group) {
        if (this.#groups.size === 0) {
            return true;
        }
        if (!group) {
            warn("Optional content group not defined.");
            return true;
        }
        if (group.type === "OCG") {
            if (!this.#groups.has(group.id)) {
                warn(`Optional content group not found: ${group.id}`);
                return true;
            }
            return this.#groups.get(group.id).visible;
        }
        else if (group.type === "OCMD") {
            // Per the spec, the expression should be preferred if available.
            if (group.expression) {
                return this.#evaluateVisibilityExpression(group.expression);
            }
            if (!group.policy || group.policy === "AnyOn") {
                // Default
                for (const id of group.ids) {
                    if (!this.#groups.has(id)) {
                        warn(`Optional content group not found: ${id}`);
                        return true;
                    }
                    if (this.#groups.get(id).visible) {
                        return true;
                    }
                }
                return false;
            }
            else if (group.policy === "AllOn") {
                for (const id of group.ids) {
                    if (!this.#groups.has(id)) {
                        warn(`Optional content group not found: ${id}`);
                        return true;
                    }
                    if (!this.#groups.get(id).visible) {
                        return false;
                    }
                }
                return true;
            }
            else if (group.policy === "AnyOff") {
                for (const id of group.ids) {
                    if (!this.#groups.has(id)) {
                        warn(`Optional content group not found: ${id}`);
                        return true;
                    }
                    if (!this.#groups.get(id).visible) {
                        return true;
                    }
                }
                return false;
            }
            else if (group.policy === "AllOff") {
                for (const id of group.ids) {
                    if (!this.#groups.has(id)) {
                        warn(`Optional content group not found: ${id}`);
                        return true;
                    }
                    if (this.#groups.get(id).visible) {
                        return false;
                    }
                }
                return true;
            }
            warn(`Unknown optional content policy ${group.policy}.`);
            return true;
        }
        warn(`Unknown group type ${group.type}.`);
        return true;
    }
    setVisibility(id, visible = true) {
        if (!this.#groups.has(id)) {
            warn(`Optional content group not found: ${id}`);
            return;
        }
        this.#groups.get(id)._setVisible(INTERNAL, !!visible);
        this.#cachedGetHash = undefined;
    }
    get hasInitialVisibility() {
        return this.getHash() === this.#initialHash;
    }
    getOrder() {
        if (!this.#groups.size) {
            return null;
        }
        if (this.#order) {
            return this.#order.slice();
        }
        return [...this.#groups.keys()];
    }
    getGroups() {
        return this.#groups.size > 0 ? objectFromMap(this.#groups) : null;
    }
    getGroup(id) {
        return this.#groups.get(id) || null;
    }
    getHash() {
        if (this.#cachedGetHash !== undefined) {
            return this.#cachedGetHash;
        }
        const hash = new MurmurHash3_64();
        for (const [id, group] of this.#groups) {
            hash.update(`${id}:${group.visible}`);
        }
        return (this.#cachedGetHash = hash.hexdigest());
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=optional_content_config.js.map