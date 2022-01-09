/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
import { objectFromMap, warn } from "../shared/util.js";
/*81---------------------------------------------------------------------------*/
class OptionalContentGroup {
    name;
    intent;
    visible = true;
    constructor(name, intent) {
        this.name = name;
        this.intent = intent;
    }
}
export class OptionalContentConfig {
    name = null;
    creator = null;
    #order = null;
    #groups = new Map();
    constructor(data) {
        if (data === undefined)
            return;
        this.name = data.name;
        this.creator = data.creator;
        this.#order = data.order;
        for (const group of data.groups) {
            this.#groups.set(group.id, new OptionalContentGroup(group.name, group.intent));
        }
        if (data.baseState === "OFF") {
            for (const group of this.#groups.values()) {
                group.visible = false;
            }
        }
        for (const on of data.on) {
            this.#groups.get(on).visible = true;
        }
        for (const off of data.off) {
            this.#groups.get(off).visible = false;
        }
    }
    #evaluateVisibilityExpression(array) {
        const length = array.length;
        if (length < 2)
            return true;
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
        if (this.#groups.size === 0)
            return true;
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
        this.#groups.get(id).visible = !!visible;
    }
    getOrder() {
        if (!this.#groups.size) {
            return null;
        }
        if (this.#order) {
            return this.#order.slice();
        }
        return Array.from(this.#groups.keys());
    }
    getGroups() {
        return this.#groups.size > 0 ? objectFromMap(this.#groups) : null;
    }
    getGroup(id) {
        return this.#groups.get(id) || null;
    }
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=optional_content_config.js.map