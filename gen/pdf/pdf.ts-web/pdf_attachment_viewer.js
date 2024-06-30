/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/pdf_attachment_viewer.ts
 * @license Apache-2.0
 ******************************************************************************/
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
import { PromiseCap } from "../../lib/util/PromiseCap.js";
import { BaseTreeViewer } from "./base_tree_viewer.js";
import { waitOnEventOrTimeout } from "./event_utils.js";
export class PDFAttachmentViewer extends BaseTreeViewer {
    _attachments;
    #renderedCapability;
    #pendingDispatchEvent;
    downloadManager;
    static create(options) {
        const ret = new PDFAttachmentViewer(options);
        ret.reset();
        return ret;
    }
    constructor(options) {
        super(options);
        this.downloadManager = options.downloadManager;
        this.eventBus._on("fileattachmentannotation", this.#appendAttachment);
    }
    reset(keepRenderedCapability = false) {
        super.reset();
        this._attachments = undefined;
        if (!keepRenderedCapability) {
            // The only situation in which the `#renderedCapability` should *not* be
            // replaced is when appending FileAttachment annotations.
            this.#renderedCapability = new PromiseCap();
        }
        this.#pendingDispatchEvent = false;
    }
    /** @implement */
    async _dispatchEvent(attachmentsCount) {
        this.#renderedCapability.resolve();
        if (attachmentsCount === 0 && !this.#pendingDispatchEvent) {
            // Delay the event when no "regular" attachments exist, to allow time for
            // parsing of any FileAttachment annotations that may be present on the
            // *initially* rendered page; this reduces the likelihood of temporarily
            // disabling the attachmentsView when the `PDFSidebar` handles the event.
            this.#pendingDispatchEvent = true;
            await waitOnEventOrTimeout({
                target: this.eventBus,
                name: "annotationlayerrendered",
                delay: 1000,
            });
            if (!this.#pendingDispatchEvent) {
                // There was already another `_dispatchEvent`-call`.
                return;
            }
        }
        this.#pendingDispatchEvent = false;
        this.eventBus.dispatch("attachmentsloaded", {
            source: this,
            attachmentsCount,
        });
    }
    /** @implement */
    _bindLink(element, { content, description, filename }) {
        if (description) {
            element.title = description;
        }
        element.onclick = () => {
            this.downloadManager.openOrDownloadData(content, filename);
            return false;
        };
    }
    /** @implement */
    render({ attachments, keepRenderedCapability = false }) {
        if (this._attachments) {
            this.reset(keepRenderedCapability);
        }
        this._attachments = attachments || undefined;
        if (!attachments) {
            this._dispatchEvent(/* attachmentsCount = */ 0);
            return;
        }
        const fragment = document.createDocumentFragment();
        let attachmentsCount = 0;
        for (const name in attachments) {
            const item = attachments[name];
            const div = html("div");
            div.className = "treeItem";
            const element = html("a");
            this._bindLink(element, item);
            element.textContent = this._normalizeTextContent(item.filename);
            div.append(element);
            fragment.append(div);
            attachmentsCount++;
        }
        this.finishRendering$(fragment, attachmentsCount);
    }
    /**
     * Used to append FileAttachment annotations to the sidebar.
     */
    #appendAttachment = (item) => {
        const renderedPromise = this.#renderedCapability.promise;
        renderedPromise.then(() => {
            if (renderedPromise !== this.#renderedCapability.promise) {
                // The FileAttachment annotation belongs to a previous document.
                return;
            }
            const attachments = this._attachments ||
                Object.create(null);
            for (const name in attachments) {
                if (item.filename === name) {
                    return; // Ignore the new attachment if it already exists.
                }
            }
            attachments[item.filename] = item;
            this.render({
                attachments,
                keepRenderedCapability: true,
            });
        });
    };
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=pdf_attachment_viewer.js.map