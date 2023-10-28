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

import { html } from "@fe-lib/dom.ts";
import type { Order } from "../pdf.ts-src/pdf.ts";
import { OptionalContentConfig, PDFDocumentProxy } from "../pdf.ts-src/pdf.ts";
import type { BaseTreeViewerCtorP } from "./base_tree_viewer.ts";
import { BaseTreeViewer } from "./base_tree_viewer.ts";
import { type IL10n } from "./interfaces.ts";
/*80--------------------------------------------------------------------------*/

interface PDFLayerViewerOptions extends BaseTreeViewerCtorP {
  /**
   * Localization service.
   */
  l10n?: IL10n;
}

interface _PDFLayerViewerRenderP {
  /**
   * An {OptionalContentConfig} instance.
   */
  optionalContentConfig: OptionalContentConfig | undefined;

  /**
   * A {PDFDocument} instance.
   */
  pdfDocument: PDFDocumentProxy;
}

export class PDFLayerViewer extends BaseTreeViewer {
  l10n?: IL10n | undefined;

  #optionalContentConfig: OptionalContentConfig | undefined;
  #optionalContentHash: string | undefined;

  static create(options: PDFLayerViewerOptions) {
    const ret = new PDFLayerViewer(options);
    ret.reset();
    return ret;
  }
  private constructor(options: PDFLayerViewerOptions) {
    super(options);
    this.l10n = options.l10n;

    this.eventBus._on("optionalcontentconfigchanged", (evt) => {
      this.#updateLayers(evt.promise);
    });
    this.eventBus._on("resetlayers", () => {
      this.#updateLayers();
    });
    this.eventBus._on("togglelayerstree", this.toggleAllTreeItems$.bind(this));
  }

  override reset() {
    super.reset();
    this.#optionalContentConfig = undefined;
    this.#optionalContentHash = undefined;
  }

  /** @implement */
  protected _dispatchEvent(layersCount: number) {
    this.eventBus.dispatch("layersloaded", {
      source: this,
      layersCount,
    });
  }

  /** @implement */
  protected _bindLink(element: HTMLAnchorElement, { groupId, input }: {
    groupId: string;
    input: HTMLInputElement;
  }) {
    const setVisibility = () => {
      this.#optionalContentConfig!.setVisibility(groupId, input.checked);
      this.#optionalContentHash = this.#optionalContentConfig!.getHash();

      this.eventBus.dispatch("optionalcontentconfig", {
        source: this,
        promise: Promise.resolve(this.#optionalContentConfig!),
      });
    };

    element.onclick = (evt) => {
      if (evt.target === input) {
        setVisibility();
        return true;
      } else if (evt.target !== element) {
        return true; // The target is the "label", which is handled above.
      }
      input.checked = !input.checked;
      setVisibility();
      return false;
    };
  }

  #setNestedName = async (
    element: HTMLAnchorElement,
    { name = undefined }: { name: string | undefined },
  ) => {
    if (typeof name === "string") {
      element.textContent = this._normalizeTextContent(name);
      return;
    }
    element.textContent = await this.l10n!.get("additional_layers");
    element.style.fontStyle = "italic";
  };

  #addToggleButton = (
    div: HTMLDivElement,
    { name = undefined }: { name: string | undefined },
  ) => {
    super._addToggleButton(div, /* hidden = */ name === undefined);
  };

  protected override toggleAllTreeItems$() {
    if (!this.#optionalContentConfig) {
      return;
    }
    super.toggleAllTreeItems$();
  }

  /** @implement */
  render({ optionalContentConfig, pdfDocument }: _PDFLayerViewerRenderP) {
    if (this.#optionalContentConfig) {
      this.reset();
    }
    this.#optionalContentConfig = optionalContentConfig || undefined;
    this._pdfDocument = pdfDocument || undefined;

    const groups = optionalContentConfig?.getOrder();
    if (!groups) {
      this._dispatchEvent(/* layersCount = */ 0);
      return;
    }
    this.#optionalContentHash = optionalContentConfig!.getHash();

    const fragment = document.createDocumentFragment();
    const queue: [{
      parent: DocumentFragment | HTMLDivElement;
      groups: Order;
    }] = [{ parent: fragment, groups }];
    let layersCount = 0,
      hasAnyNesting = false;
    while (queue.length > 0) {
      const levelData = queue.shift()!;
      for (const groupId of levelData.groups) {
        const div = html("div");
        div.className = "treeItem";

        const element = html("a");
        div.append(element);

        if (typeof groupId === "object") {
          hasAnyNesting = true;
          this.#addToggleButton(div, groupId);
          this.#setNestedName(element, groupId);

          const itemsDiv = html("div");
          itemsDiv.className = "treeItems";
          div.append(itemsDiv);

          queue.push({ parent: itemsDiv, groups: groupId.order });
        } else {
          const group = optionalContentConfig!.getGroup(groupId);

          const input = html("input");
          this._bindLink(element, { groupId, input });
          input.type = "checkbox";
          input.checked = group!.visible;

          const label = html("label");
          label.setAttribute("for", groupId);
          label.textContent = this._normalizeTextContent(group!.name!);

          element.append(input);
          element.append(label);

          layersCount++;
        }

        levelData.parent.append(div);
      }
    }

    this.finishRendering$(fragment, layersCount, hasAnyNesting);
  }

  #updateLayers = async (
    promise: Promise<OptionalContentConfig | undefined> | undefined = undefined,
  ) => {
    if (!this.#optionalContentConfig) {
      return;
    }
    const pdfDocument = this._pdfDocument!;
    const optionalContentConfig =
      await (promise || pdfDocument.getOptionalContentConfig());

    if (pdfDocument !== this._pdfDocument) {
      return; // The document was closed while the optional content resolved.
    }
    if (promise) {
      if (optionalContentConfig!.getHash() === this.#optionalContentHash) {
        return; // The optional content didn't change, hence no need to reset the UI.
      }
    } else {
      this.eventBus.dispatch("optionalcontentconfig", {
        source: this,
        promise: Promise.resolve(optionalContentConfig),
      });
    }

    // Reset the sidebarView to the new state.
    this.render({
      optionalContentConfig,
      pdfDocument: this._pdfDocument!,
    });
  };
}
/*80--------------------------------------------------------------------------*/
