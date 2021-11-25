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
import { html } from "../../lib/dom.js";
import { removeNullCharacters } from "../pdf.ts-src/pdf.js";
/*81---------------------------------------------------------------------------*/
const TREEITEM_OFFSET_TOP = -100; // px
const TREEITEM_SELECTED_CLASS = "selected";
export class BaseTreeViewer {
    container;
    eventBus;
    _pdfDocument;
    #lastToggleIsShow;
    #currentTreeItem;
    constructor(options) {
        this.container = options.container;
        this.eventBus = options.eventBus;
        // Ref. Access private method in an overriden method called from the base class constructor
        // (https://stackoverflow.com/questions/61237153/access-private-method-in-an-overriden-method-called-from-the-base-class-construc)
        // this.reset();
    }
    reset() {
        this._pdfDocument = undefined;
        this.#lastToggleIsShow = true;
        this.#currentTreeItem = null;
        // Remove the tree from the DOM.
        this.container.textContent = "";
        // Ensure that the left (right in RTL locales) margin is always reset,
        // to prevent incorrect tree alignment if a new document is opened.
        this.container.classList.remove("treeWithDeepNesting");
    }
    _normalizeTextContent(str) {
        return removeNullCharacters(str) || /* en dash = */ "\u2013";
    }
    /**
     * Prepend a button before a tree item which allows the user to collapse or
     * expand all tree items at that level; see `#toggleTreeItem`.
     */
    _addToggleButton(div, hidden = false) {
        const toggler = html("div");
        toggler.className = "treeItemToggler";
        if (hidden) {
            toggler.classList.add("treeItemsHidden");
        }
        toggler.onclick = evt => {
            evt.stopPropagation();
            toggler.classList.toggle("treeItemsHidden");
            if (evt.shiftKey) {
                const shouldShowAll = !toggler.classList.contains("treeItemsHidden");
                this.#toggleTreeItem(div, shouldShowAll);
            }
        };
        div.insertBefore(toggler, div.firstChild);
    }
    /**
     * Collapse or expand the subtree of a tree item.
     *
     * @param root the root of the item (sub)tree.
     * @param show whether to show the item (sub)tree. If false,
     *   the item subtree rooted at `root` will be collapsed.
     */
    #toggleTreeItem(root, show = false) {
        this.#lastToggleIsShow = show;
        root.querySelectorAll(".treeItemToggler").forEach(toggler => {
            toggler.classList.toggle("treeItemsHidden", !show);
        });
    }
    /**
     * Collapse or expand all subtrees of the `container`.
     */
    toggleAllTreeItems$() {
        this.#toggleTreeItem(this.container, !this.#lastToggleIsShow);
    }
    /** @final */
    finishRendering$(fragment, count, hasAnyNesting = false) {
        if (hasAnyNesting) {
            this.container.classList.add("treeWithDeepNesting");
            this.#lastToggleIsShow = !fragment.querySelector(".treeItemsHidden");
        }
        this.container.appendChild(fragment);
        this._dispatchEvent(count);
    }
    _updateCurrentTreeItem(treeItem = null) {
        if (this.#currentTreeItem) {
            // Ensure that the current treeItem-selection is always removed.
            this.#currentTreeItem.classList.remove(TREEITEM_SELECTED_CLASS);
            this.#currentTreeItem = null;
        }
        if (treeItem) {
            treeItem.classList.add(TREEITEM_SELECTED_CLASS);
            this.#currentTreeItem = treeItem;
        }
    }
    _scrollToCurrentTreeItem(treeItem) {
        if (!treeItem)
            return;
        // Ensure that the treeItem is *fully* expanded, such that it will first of
        // all be visible and secondly that scrolling it into view works correctly.
        let currentNode = treeItem.parentNode;
        while (currentNode && currentNode !== this.container) {
            if (currentNode.classList.contains("treeItem")) {
                const toggler = currentNode.firstElementChild;
                toggler?.classList.remove("treeItemsHidden");
            }
            currentNode = currentNode.parentNode;
        }
        this._updateCurrentTreeItem(treeItem);
        this.container.scrollTo(treeItem.offsetLeft, treeItem.offsetTop + TREEITEM_OFFSET_TOP);
    }
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=base_tree_viewer.js.map