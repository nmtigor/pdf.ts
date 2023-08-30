/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
/* Copyright 2012 Mozilla Foundation
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
import { isObjectLike } from "../../lib/jslang.js";
import { PromiseCap } from "../../lib/util/PromiseCap.js";
import { BaseTreeViewer } from "./base_tree_viewer.js";
import { SidebarView } from "./ui_utils.js";
export class PDFOutlineViewer extends BaseTreeViewer {
    #outline;
    #pageNumberToDestHashCapability;
    _currentPageNumber;
    _sidebarView;
    _isPagesLoaded;
    #currentOutlineItemCapability;
    linkService;
    downloadManager;
    static create(options) {
        const ret = new PDFOutlineViewer(options);
        ret.reset();
        return ret;
    }
    constructor(options) {
        super(options);
        this.linkService = options.linkService;
        this.downloadManager = options.downloadManager;
        this.eventBus._on("toggleoutlinetree", this.toggleAllTreeItems$.bind(this));
        this.eventBus._on("currentoutlineitem", this.#currentOutlineItem);
        this.eventBus._on("pagechanging", (evt) => {
            this._currentPageNumber = evt.pageNumber;
        });
        this.eventBus._on("pagesloaded", (evt) => {
            this._isPagesLoaded = !!evt.pagesCount;
            // If the capability is still pending, see the `_dispatchEvent`-method,
            // we know that the `currentOutlineItem`-button can be enabled here.
            if (this.#currentOutlineItemCapability &&
                !this.#currentOutlineItemCapability.settled) {
                this.#currentOutlineItemCapability.resolve(
                /* enabled = */ this._isPagesLoaded);
            }
        });
        this.eventBus._on("sidebarviewchanged", (evt) => {
            this._sidebarView = evt.view;
        });
    }
    reset() {
        super.reset();
        this.#outline = undefined;
        this.#pageNumberToDestHashCapability = undefined;
        this._currentPageNumber = 1;
        this._isPagesLoaded = undefined;
        if (this.#currentOutlineItemCapability &&
            !this.#currentOutlineItemCapability.settled) {
            this.#currentOutlineItemCapability.resolve(/* enabled = */ false);
        }
        this.#currentOutlineItemCapability = undefined;
    }
    /** @implement */
    _dispatchEvent(outlineCount) {
        this.#currentOutlineItemCapability = new PromiseCap();
        if (outlineCount === 0 ||
            this._pdfDocument?.loadingParams.disableAutoFetch) {
            this.#currentOutlineItemCapability.resolve(/* enabled = */ false);
        }
        else if (this._isPagesLoaded !== undefined) {
            this.#currentOutlineItemCapability.resolve(
            /* enabled = */ this._isPagesLoaded);
        }
        this.eventBus.dispatch("outlineloaded", {
            source: this,
            outlineCount,
            currentOutlineItemPromise: this.#currentOutlineItemCapability.promise,
        });
    }
    /** @implement */
    _bindLink(element, { url, newWindow, action, attachment, dest, setOCGState }) {
        const { linkService } = this;
        if (url) {
            linkService.addLinkAttributes(element, url, newWindow);
            return;
        }
        if (action) {
            element.href = linkService.getAnchorUrl("");
            element.onclick = () => {
                linkService.executeNamedAction(action);
                return false;
            };
            return;
        }
        if (attachment) {
            element.href = linkService.getAnchorUrl("");
            element.onclick = () => {
                this.downloadManager.openOrDownloadData(element, attachment.content, attachment.filename);
                return false;
            };
            return;
        }
        if (setOCGState) {
            element.href = linkService.getAnchorUrl("");
            element.onclick = () => {
                linkService.executeSetOCGState(setOCGState);
                return false;
            };
            return;
        }
        element.href = linkService.getDestinationHash(dest);
        element.onclick = (evt) => {
            this._updateCurrentTreeItem(evt.target.parentNode);
            if (dest) {
                linkService.goToDestination(dest);
            }
            return false;
        };
    }
    #setStyles(element, { bold, italic }) {
        if (bold) {
            element.style.fontWeight = "bold";
        }
        if (italic) {
            element.style.fontStyle = "italic";
        }
    }
    #addToggleButton(div, { count, items }) {
        let hidden = false;
        if (count < 0) {
            let totalCount = items.length;
            if (totalCount > 0) {
                const queue = [...items];
                while (queue.length > 0) {
                    const { count: nestedCount, items: nestedItems } = queue.shift();
                    if (nestedCount > 0 && nestedItems.length > 0) {
                        totalCount += nestedItems.length;
                        queue.push(...nestedItems);
                    }
                }
            }
            if (Math.abs(count) === totalCount) {
                hidden = true;
            }
        }
        super._addToggleButton(div, hidden);
    }
    toggleAllTreeItems$() {
        if (!this.#outline)
            return;
        super.toggleAllTreeItems$();
    }
    /** @implement */
    render({ outline, pdfDocument }) {
        if (this.#outline) {
            this.reset();
        }
        this.#outline = outline || undefined;
        this._pdfDocument = pdfDocument || undefined;
        if (!outline) {
            this._dispatchEvent(/* outlineCount = */ 0);
            return;
        }
        const fragment = document.createDocumentFragment();
        const queue = [{ parent: fragment, items: outline }];
        let outlineCount = 0, hasAnyNesting = false;
        while (queue.length > 0) {
            const levelData = queue.shift();
            for (const item of levelData.items) {
                const div = html("div");
                div.className = "treeItem";
                const element = html("a");
                this._bindLink(element, item);
                this.#setStyles(element, item);
                element.textContent = this._normalizeTextContent(item.title);
                div.append(element);
                if (item.items.length > 0) {
                    hasAnyNesting = true;
                    this.#addToggleButton(div, item);
                    const itemsDiv = html("div");
                    itemsDiv.className = "treeItems";
                    div.append(itemsDiv);
                    queue.push({ parent: itemsDiv, items: item.items });
                }
                levelData.parent.append(div);
                outlineCount++;
            }
        }
        this.finishRendering$(fragment, outlineCount, hasAnyNesting);
    }
    /**
     * Find/highlight the current outline item, corresponding to the active page.
     */
    #currentOutlineItem = async () => {
        if (!this._isPagesLoaded) {
            throw new Error("#currentOutlineItem: All pages have not been loaded.");
        }
        if (!this.#outline || !this._pdfDocument) {
            return;
        }
        const pageNumberToDestHash = await this.#getPageNumberToDestHash(this._pdfDocument);
        if (!pageNumberToDestHash) {
            return;
        }
        this._updateCurrentTreeItem(/* treeItem = */ null);
        if (this._sidebarView !== SidebarView.OUTLINE) {
            return; // The outline view is no longer visible, hence do nothing.
        }
        // When there is no destination on the current page, always check the
        // previous ones in (reverse) order.
        for (let i = this._currentPageNumber; i > 0; i--) {
            const destHash = pageNumberToDestHash.get(i);
            if (!destHash) {
                continue;
            }
            const linkElement = this.container.querySelector(`a[href="${destHash}"]`);
            if (!linkElement) {
                continue;
            }
            this._scrollToCurrentTreeItem(linkElement.parentNode);
            break;
        }
    };
    /**
     * To (significantly) simplify the overall implementation, we will only
     * consider *one* destination per page when finding/highlighting the current
     * outline item (similar to e.g. Adobe Reader); more specifically, we choose
     * the *first* outline item at the *lowest* level of the outline tree.
     */
    async #getPageNumberToDestHash(pdfDocument) {
        if (this.#pageNumberToDestHashCapability) {
            return this.#pageNumberToDestHashCapability.promise;
        }
        this.#pageNumberToDestHashCapability = new PromiseCap();
        const pageNumberToDestHash = new Map(), pageNumberNesting = new Map();
        const queue = [{ nesting: 0, items: this.#outline }];
        while (queue.length > 0) {
            const levelData = queue.shift(), currentNesting = levelData.nesting;
            for (const { dest, items } of levelData.items) {
                let explicitDest, pageNumber;
                if (typeof dest === "string") {
                    explicitDest = await pdfDocument.getDestination(dest);
                    if (pdfDocument !== this._pdfDocument) {
                        return undefined; // The document was closed while the data resolved.
                    }
                }
                else {
                    explicitDest = dest;
                }
                if (Array.isArray(explicitDest)) {
                    const [destRef] = explicitDest;
                    if (isObjectLike(destRef)) {
                        pageNumber = this.linkService._cachedPageNumber(destRef);
                        if (!pageNumber) {
                            try {
                                pageNumber = (await pdfDocument.getPageIndex(destRef)) + 1;
                                if (pdfDocument !== this._pdfDocument) {
                                    return undefined; // The document was closed while the data resolved.
                                }
                                this.linkService.cachePageRef(pageNumber, destRef);
                            }
                            catch {
                                // Invalid page reference, ignore it and continue parsing.
                            }
                        }
                    }
                    else if (Number.isInteger(destRef)) {
                        pageNumber = destRef + 1;
                    }
                    if (Number.isInteger(pageNumber) &&
                        (!pageNumberToDestHash.has(pageNumber) ||
                            currentNesting > pageNumberNesting.get(pageNumber))) {
                        const destHash = this.linkService.getDestinationHash(dest);
                        pageNumberToDestHash.set(pageNumber, destHash);
                        pageNumberNesting.set(pageNumber, currentNesting);
                    }
                }
                if (items.length > 0) {
                    queue.push({ nesting: currentNesting + 1, items });
                }
            }
        }
        this.#pageNumberToDestHashCapability.resolve(pageNumberToDestHash.size > 0 ? pageNumberToDestHash : undefined);
        return this.#pageNumberToDestHashCapability.promise;
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=pdf_outline_viewer.js.map