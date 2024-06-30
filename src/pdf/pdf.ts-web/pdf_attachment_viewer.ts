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

import { html } from "@fe-lib/dom.ts";
import { PromiseCap } from "@fe-lib/util/PromiseCap.ts";
import type { Attachment } from "../pdf.ts-src/pdf.ts";
import type { BaseTreeViewerCtorP } from "./base_tree_viewer.ts";
import { BaseTreeViewer } from "./base_tree_viewer.ts";
import type { EventMap } from "./event_utils.ts";
import { waitOnEventOrTimeout } from "./event_utils.ts";
import type { IDownloadManager } from "./interfaces.ts";
/*80--------------------------------------------------------------------------*/

interface PDFAttachmentViewerOptions extends BaseTreeViewerCtorP {
  /**
   * The download manager.
   */
  downloadManager: IDownloadManager;
}

interface PDFAttachmentViewerRenderP_ {
  /**
   * A lookup table of attachment objects.
   */
  attachments?: Record<string, Attachment> | undefined;

  keepRenderedCapability?: boolean;
}

type BindLinkO_ = {
  content?: Uint8Array | Uint8ClampedArray | undefined;
  description?: string;
  filename: string;
};

export class PDFAttachmentViewer extends BaseTreeViewer {
  _attachments?: Record<string, Attachment> | undefined;
  #renderedCapability?: PromiseCap<void>;
  #pendingDispatchEvent!: boolean;

  downloadManager: IDownloadManager;

  static create(options: PDFAttachmentViewerOptions) {
    const ret = new PDFAttachmentViewer(options);
    ret.reset();
    return ret;
  }
  private constructor(options: PDFAttachmentViewerOptions) {
    super(options);
    this.downloadManager = options.downloadManager;

    this.eventBus._on(
      "fileattachmentannotation",
      this.#appendAttachment,
    );
  }

  override reset(keepRenderedCapability = false) {
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
  protected async _dispatchEvent(attachmentsCount: number) {
    this.#renderedCapability!.resolve();

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
  protected _bindLink(
    element: HTMLAnchorElement,
    { content, description, filename }: BindLinkO_,
  ) {
    if (description) {
      element.title = description;
    }
    element.onclick = () => {
      this.downloadManager.openOrDownloadData(content!, filename);
      return false;
    };
  }

  /** @implement */
  render(
    { attachments, keepRenderedCapability = false }:
      PDFAttachmentViewerRenderP_,
  ) {
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
  #appendAttachment = (item: EventMap["fileattachmentannotation"]) => {
    const renderedPromise = this.#renderedCapability!.promise;

    renderedPromise.then(() => {
      if (renderedPromise !== this.#renderedCapability!.promise) {
        // The FileAttachment annotation belongs to a previous document.
        return;
      }
      const attachments = this._attachments ||
        Object.create(null) as Record<string, Attachment>;

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
