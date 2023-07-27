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
import { warn } from "../../shared/util.js";
import { NamespaceIds } from "./namespaces.js";
import { createDataNode, searchNode } from "./som.js";
import { BindItems, Field, Items, SetProperty, Text, } from "./template.js";
import { $appendChild, $clone, $consumed, $content, $data, $finalize, $getAttributeIt, $getChildren, $getDataValue, $getParent, $getRealChildrenByNameIt, $hasSettableValue, $indexOf, $insertAt, $isBindable, $isDataValue, $isDescendent, $namespaceId, $nodeName, $removeChild, $setValue, $text, XFAAttribute, XFAObjectArray, XmlObject, } from "./xfa_object.js";
/*80--------------------------------------------------------------------------*/
const NS_DATASETS = NamespaceIds.datasets.id;
function createText(content) {
    const node = new Text({});
    node[$content] = content;
    return node;
}
export class Binder {
    root;
    datasets;
    emptyMerge;
    _mergeMode;
    data;
    getData() {
        return this.data;
    }
    form; //kkkk
    constructor(root) {
        this.root = root;
        this.datasets = root.datasets;
        if (root.datasets && root.datasets.data) {
            this.data = root.datasets.data;
        }
        else {
            this.data = new XmlObject(NamespaceIds.datasets.id, "data");
        }
        this.emptyMerge = this.data[$getChildren]().length === 0;
        this.root.form = this.form = root.template[$clone]();
    }
    #isConsumeData = () => {
        return !this.emptyMerge && this._mergeMode;
    };
    #isMatchTemplate = () => {
        return !this.#isConsumeData();
    };
    bind() {
        this.#bindElement(this.form, this.data);
        return this.form;
    }
    #bindValue(formNode, data, picture) {
        // Nodes must have the same "type": container or value.
        // Here we make the link between form node and
        // data node (through $data property): we'll use it
        // to save form data.
        formNode[$data] = data;
        if (formNode[$hasSettableValue]()) {
            if (data[$isDataValue]()) {
                const value = data[$getDataValue]();
                // TODO: use picture.
                formNode[$setValue](createText(value));
            }
            else if (formNode instanceof Field &&
                formNode.ui &&
                formNode.ui.choiceList &&
                formNode.ui.choiceList.open === "multiSelect") {
                const value = data[$getChildren]()
                    .map((child) => child[$content].trim())
                    .join("\n");
                formNode[$setValue](createText(value));
            }
            else if (this.#isConsumeData()) {
                warn(`XFA - Nodes haven't the same type.`);
            }
        }
        else if (!data[$isDataValue]() || this.#isMatchTemplate()) {
            this.#bindElement(formNode, data);
        }
        else {
            warn(`XFA - Nodes haven't the same type.`);
        }
    }
    #findDataByNameToConsume(name, isValue, dataNode, global) {
        if (!name) {
            return undefined;
        }
        // Firstly, we try to find a node with the given name:
        //  - in dataNode;
        //  - if not found, then in parent;
        //  - and if not in found, then in grand-parent.
        let generator, match;
        for (let i = 0; i < 3; i++) {
            generator = dataNode[$getRealChildrenByNameIt](name, 
            /* allTransparent = */ false, 
            /* skipConsumed = */ true);
            // Try to find a match of the same kind.
            while (true) {
                match = generator.next().value;
                if (!match) {
                    break;
                }
                if (isValue === match[$isDataValue]()) {
                    return match;
                }
            }
            if (dataNode[$namespaceId] === NamespaceIds.datasets.id &&
                dataNode[$nodeName] === "data") {
                break;
            }
            dataNode = dataNode[$getParent]();
        }
        if (!global) {
            return undefined;
        }
        // Secondly, if global try to find it just under the root of datasets
        // (which is the location of global variables).
        generator = this.data[$getRealChildrenByNameIt](name, 
        /* allTransparent = */ true, 
        /* skipConsumed = */ false);
        match = generator.next().value;
        if (match) {
            return match;
        }
        // Thirdly, try to find it in attributes.
        generator = this.data[$getAttributeIt](name, /* skipConsumed = */ true);
        match = generator.next().value;
        if (match && match[$isDataValue]()) {
            return match;
        }
        return undefined;
    }
    #setProperties(formNode, dataNode) {
        // For example:
        // <field name="LastName" ...>
        //   <setProperty ref="$data.Main.Style.NameFont" target="font.typeface"/>
        //   <setProperty ref="$data.Main.Style.NameSize" target="font.size"/>
        //   <setProperty ref="$data.Main.Help.LastName" target="assist.toolTip"/>
        // </field>
        if (!Object.hasOwn(formNode, "setProperty")) {
            return;
        }
        for (const { ref, target, connection } of formNode.setProperty
            .children) {
            if (connection) {
                // TODO: evaluate if we should implement this feature.
                // Skip for security reasons.
                continue;
            }
            if (!ref) {
                continue;
            }
            const nodes = searchNode(this.root, dataNode, ref, false, /* = dotDotAllowed */ false);
            if (!nodes) {
                warn(`XFA - Invalid reference: ${ref}.`);
                continue;
            }
            const [node] = nodes;
            if (!node[$isDescendent](this.data)) {
                warn(`XFA - Invalid node: must be a data node.`);
                continue;
            }
            const targetNodes = searchNode(this.root, formNode, target, false, /* = dotDotAllowed */ false);
            if (!targetNodes) {
                warn(`XFA - Invalid target: ${target}.`);
                continue;
            }
            const [targetNode] = targetNodes;
            if (!targetNode[$isDescendent](formNode)) {
                warn(`XFA - Invalid target: must be a property or subproperty.`);
                continue;
            }
            const targetParent = targetNode[$getParent]();
            if (targetNode instanceof SetProperty ||
                targetParent instanceof SetProperty) {
                warn(`XFA - Invalid target: cannot be a setProperty or one of its properties.`);
                continue;
            }
            if (targetNode instanceof BindItems ||
                targetParent instanceof BindItems) {
                warn(`XFA - Invalid target: cannot be a bindItems or one of its properties.`);
                continue;
            }
            const content = node[$text]();
            const name = targetNode[$nodeName];
            if (targetNode instanceof XFAAttribute) {
                const attrs = Object.create(null);
                attrs[name] = content;
                const obj = Reflect.construct(Object.getPrototypeOf(targetParent).constructor, [attrs]);
                targetParent[name] = obj[name];
                continue;
            }
            if (!Object.hasOwn(targetNode, $content)) {
                warn(`XFA - Invalid node to use in setProperty`);
                continue;
            }
            targetNode[$data] = node;
            targetNode[$content] = content;
            targetNode[$finalize]();
        }
    }
    #bindItems(formNode, dataNode) {
        // For example:
        // <field name="CardName"...>
        //   <bindItems ref="$data.main.ccs.cc[*]" labelRef="uiname"
        //              valueRef="token"/>
        //   <ui><choiceList/></ui>
        // </field>
        if (!Object.hasOwn(formNode, "items") ||
            !Object.hasOwn(formNode, "bindItems") ||
            formNode.bindItems.isEmpty()) {
            return;
        }
        for (const item of formNode.items.children) {
            formNode[$removeChild](item);
        }
        formNode.items.clear();
        const labels = new Items({});
        const values = new Items({});
        formNode[$appendChild](labels);
        formNode.items.push(labels);
        formNode[$appendChild](values);
        formNode.items.push(values);
        for (const { ref, labelRef, valueRef, connection } of formNode.bindItems.children) {
            if (connection) {
                // TODO: evaluate if we should implement this feature.
                // Skip for security reasons.
                continue;
            }
            if (!ref) {
                continue;
            }
            const nodes = searchNode(this.root, dataNode, ref, false, /* = dotDotAllowed */ false);
            if (!nodes) {
                warn(`XFA - Invalid reference: ${ref}.`);
                continue;
            }
            for (const node of nodes) {
                if (!node[$isDescendent](this.datasets)) {
                    warn(`XFA - Invalid ref (${ref}): must be a datasets child.`);
                    continue;
                }
                const labelNodes = searchNode(this.root, node, labelRef, true, /* = dotDotAllowed */ false);
                if (!labelNodes) {
                    warn(`XFA - Invalid label: ${labelRef}.`);
                    continue;
                }
                const [labelNode] = labelNodes;
                if (!labelNode[$isDescendent](this.datasets)) {
                    warn(`XFA - Invalid label: must be a datasets child.`);
                    continue;
                }
                const valueNodes = searchNode(this.root, node, valueRef, true, /* = dotDotAllowed */ false);
                if (!valueNodes) {
                    warn(`XFA - Invalid value: ${valueRef}.`);
                    continue;
                }
                const [valueNode] = valueNodes;
                if (!valueNode[$isDescendent](this.datasets)) {
                    warn(`XFA - Invalid value: must be a datasets child.`);
                    continue;
                }
                const label = createText(labelNode[$text]());
                const value = createText(valueNode[$text]());
                labels[$appendChild](label);
                labels.text.push(label);
                values[$appendChild](value);
                values.text.push(value);
            }
        }
    }
    #bindOccurrences(formNode, matches, picture) {
        // Insert nodes which are not in the template but reflect
        // what we've in data tree.
        let baseClone;
        if (matches.length > 1) {
            // Clone before binding to avoid bad state.
            baseClone = formNode[$clone]();
            baseClone[$removeChild](baseClone.occur);
            baseClone.occur = undefined;
        }
        this.#bindValue(formNode, matches[0], picture);
        this.#setProperties(formNode, matches[0]);
        this.#bindItems(formNode, matches[0]);
        if (matches.length === 1) {
            return;
        }
        const parent = formNode[$getParent]();
        const name = formNode[$nodeName];
        const pos = parent[$indexOf](formNode);
        for (let i = 1, ii = matches.length; i < ii; i++) {
            const match = matches[i];
            const clone = baseClone[$clone]();
            parent[name].push(clone);
            parent[$insertAt](pos + i, clone);
            this.#bindValue(clone, match, picture);
            this.#setProperties(clone, match);
            this.#bindItems(clone, match);
        }
    }
    #createOccurrences(formNode) {
        if (!this.emptyMerge) {
            return;
        }
        const { occur } = formNode;
        if (!occur || +occur.initial <= 1) {
            return;
        }
        const parent = formNode[$getParent]();
        const name = formNode[$nodeName];
        if (!(parent[name] instanceof XFAObjectArray)) {
            return;
        }
        let currentNumber;
        if (formNode.name) {
            currentNumber = parent[name].children.filter((e) => e.name === formNode.name).length;
        }
        else {
            currentNumber = parent[name].children.length;
        }
        const pos = parent[$indexOf](formNode) + 1;
        const ii = +occur.initial - currentNumber;
        if (ii) {
            const nodeClone = formNode[$clone]();
            nodeClone[$removeChild](nodeClone.occur);
            nodeClone.occur = undefined;
            parent[name].push(nodeClone);
            parent[$insertAt](pos, nodeClone);
            for (let i = 1; i < ii; i++) {
                const clone = nodeClone[$clone]();
                parent[name].push(clone);
                parent[$insertAt](pos + i, clone);
            }
        }
    }
    #getOccurInfo(formNode) {
        const { occur } = formNode;
        const dataName = formNode.name;
        if (!occur || !dataName) {
            return [1, 1];
        }
        const max = occur.max === -1 ? Infinity : +occur.max;
        return [+occur.min, max];
    }
    #setAndBind(formNode, dataNode) {
        this.#setProperties(formNode, dataNode);
        this.#bindItems(formNode, dataNode);
        this.#bindElement(formNode, dataNode);
    }
    #bindElement(formNode, dataNode) {
        // Some nodes can be useless because min=0 so remove them
        // after the loop to avoid bad things.
        const uselessNodes = [];
        this.#createOccurrences(formNode);
        for (const child of formNode[$getChildren]()) {
            if (child[$data]) {
                // Already bound.
                continue;
            }
            if (this._mergeMode === undefined && child[$nodeName] === "subform") {
                this._mergeMode = child.mergeMode === "consumeData";
                // XFA specs p. 182:
                // The highest-level subform and the data node representing
                // the current record are special; they are always
                // bound even if their names don't match.
                const dataChildren = dataNode[$getChildren]();
                if (dataChildren.length > 0) {
                    this.#bindOccurrences(child, [
                        dataChildren[0],
                    ], undefined);
                }
                else if (this.emptyMerge) {
                    const nsId = dataNode[$namespaceId] === NS_DATASETS
                        ? -1
                        : dataNode[$namespaceId];
                    const dataChild = (child[$data] = new XmlObject(nsId, child.name || "root"));
                    dataNode[$appendChild](dataChild);
                    this.#bindElement(child, dataChild);
                }
                continue;
            }
            if (!child[$isBindable]()) {
                // The node cannot contain some new data so there is nothing
                // to create in the data node.
                continue;
            }
            let global = false;
            let picture;
            let ref;
            let match;
            if (child.bind) {
                switch (child.bind.match) {
                    case "none":
                        this.#setAndBind(child, dataNode);
                        continue;
                    case "global":
                        global = true;
                        break;
                    case "dataRef":
                        if (!child.bind.ref) {
                            warn(`XFA - ref is empty in node ${child[$nodeName]}.`);
                            this.#setAndBind(child, dataNode);
                            continue;
                        }
                        ref = child.bind.ref;
                        break;
                    default:
                        break;
                }
                if (child.bind.picture) {
                    picture =
                        child.bind.picture[$content];
                }
            }
            const [min, max] = this.#getOccurInfo(child);
            if (ref) {
                // Don't use a cache for searching: nodes can change during binding.
                match = searchNode(this.root, dataNode, ref, true, /* = dotDotAllowed */ false);
                if (match === undefined) {
                    // Nothing found: we must create some nodes in data in order
                    // to have something to match with the given expression.
                    // See http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.364.2157&rep=rep1&type=pdf#page=199
                    match = createDataNode(this.data, dataNode, ref);
                    if (!match) {
                        // For example if the node contains a .(...) then it isn't
                        // findable.
                        // TODO: remove this when .(...) is implemented.
                        continue;
                    }
                    if (this.#isConsumeData()) {
                        match[$consumed] = true;
                    }
                    // Don't bind the value in newly created node because it's empty.
                    this.#setAndBind(child, match);
                    continue;
                }
                else {
                    if (this.#isConsumeData()) {
                        // Filter out consumed nodes.
                        match = match.filter((node) => !node[$consumed]);
                    }
                    if (match.length > max) {
                        match = match.slice(0, max);
                    }
                    else if (match.length === 0) {
                        match = undefined;
                    }
                    if (match && this.#isConsumeData()) {
                        match.forEach((node) => {
                            node[$consumed] = true;
                        });
                    }
                }
            }
            else {
                if (!child.name) {
                    this.#setAndBind(child, dataNode);
                    continue;
                }
                if (this.#isConsumeData()) {
                    // In consumeData mode, search for the next node with the given name.
                    // occurs.max gives us the max number of node to match.
                    const matches = [];
                    while (matches.length < max) {
                        const found = this.#findDataByNameToConsume(child.name, child[$hasSettableValue](), dataNode, global);
                        if (!found) {
                            break;
                        }
                        found[$consumed] = true;
                        matches.push(found);
                    }
                    match = matches.length > 0 ? matches : undefined;
                }
                else {
                    // If we've an empty merge, there are no reason
                    // to make multiple bind so skip consumed nodes.
                    match = dataNode[$getRealChildrenByNameIt](child.name, 
                    /* allTransparent = */ false, 
                    /* skipConsumed = */ this.emptyMerge).next().value;
                    if (!match) {
                        // If there is no match (no data) and `min === 0` then
                        // the container is entirely excluded.
                        // https://www.pdfa.org/norm-refs/XFA-3_3.pdf#G12.1428332
                        if (min === 0) {
                            uselessNodes.push(child);
                            continue;
                        }
                        // We're in matchTemplate mode so create a node in data to reflect
                        // what we've in template.
                        const nsId = dataNode[$namespaceId] === NS_DATASETS
                            ? -1
                            : dataNode[$namespaceId];
                        match =
                            child[$data] =
                                new XmlObject(nsId, child.name);
                        if (this.emptyMerge) {
                            match[$consumed] = true;
                        }
                        dataNode[$appendChild](match);
                        // Don't bind the value in newly created node because it's empty.
                        this.#setAndBind(child, match);
                        continue;
                    }
                    if (this.emptyMerge) {
                        match[$consumed] = true;
                    }
                    match = [match];
                }
            }
            if (match) {
                this.#bindOccurrences(child, match, picture);
            }
            else if (min > 0) {
                this.#setAndBind(child, dataNode);
            }
            else {
                uselessNodes.push(child);
            }
        }
        uselessNodes.forEach((node) => node[$getParent]()[$removeChild](node));
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=bind.js.map