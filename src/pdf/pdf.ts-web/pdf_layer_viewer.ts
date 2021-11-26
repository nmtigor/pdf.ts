/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
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

import { html } from "../../lib/dom.js";
import { type Order } from "../pdf.ts-src/core/catalog.js";
import { PDFDocumentProxy } from "../pdf.ts-src/display/api.js";
import { OptionalContentConfig } from "../pdf.ts-src/display/optional_content_config.js";
import { BaseTreeViewer, type BaseTreeViewerCtorParms } from "./base_tree_viewer.js";
import { type IL10n } from "./interfaces.js";
/*81---------------------------------------------------------------------------*/

interface PDFLayerViewerOptions extends BaseTreeViewerCtorParms
{
  /**
   * Localization service.
   */
  l10n?:IL10n;
}

interface PDFLayerViewerRenderParms
{
  /**
   * An {OptionalContentConfig} instance.
   */
  optionalContentConfig:OptionalContentConfig | undefined;

  /**
   * A {PDFDocument} instance.
   */
  pdfDocument:PDFDocumentProxy;
}

export class PDFLayerViewer extends BaseTreeViewer 
{
  l10n?:IL10n | undefined;

  #optionalContentConfig?:OptionalContentConfig | undefined;

  static create( options:PDFLayerViewerOptions )
  {
    const ret = new PDFLayerViewer( options );
    ret.reset();
    return ret;
  }
  private constructor( options:PDFLayerViewerOptions ) 
  {
    super(options);

    this.l10n = options.l10n;

    this.eventBus._on("resetlayers", this.#resetLayers );
    this.eventBus._on("togglelayerstree", this.toggleAllTreeItems$.bind(this));
  }

  override reset() {
    super.reset();
    this.#optionalContentConfig = undefined;
  }

  /** @implements */
  protected _dispatchEvent( layersCount:number ) 
  {
    this.eventBus.dispatch("layersloaded", {
      source: this,
      layersCount,
    });
  }

  /** @implements */
  protected _bindLink( element:HTMLAnchorElement, { groupId, input }:{
    groupId:string;
    input:HTMLInputElement;
  }) {
    const setVisibility = () => {
      this.#optionalContentConfig!.setVisibility(groupId, input.checked);

      this.eventBus.dispatch("optionalcontentconfig", {
        source: this,
        promise: Promise.resolve(this.#optionalContentConfig!),
      });
    };

    element.onclick = evt => {
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
    element:HTMLAnchorElement, { name=null }:{ name:string|null } ) =>
  {
    if (typeof name === "string") {
      element.textContent = this._normalizeTextContent( <string>name );
      return;
    }
    element.textContent = await this.l10n!.get("additional_layers");
    element.style.fontStyle = "italic";
  }

  #addToggleButton = ( div:HTMLDivElement, { name=null }:{ name:string|null } ) =>
  {
    super._addToggleButton(div, /* hidden = */ name === null);
  }

  protected override toggleAllTreeItems$() 
  {
    if( !this.#optionalContentConfig ) return;

    super.toggleAllTreeItems$();
  }

  /** @implements */
  render({ optionalContentConfig, pdfDocument }:PDFLayerViewerRenderParms ) 
  {
    if( this.#optionalContentConfig )
    {
      this.reset();
    }
    this.#optionalContentConfig = optionalContentConfig || undefined;
    this._pdfDocument = pdfDocument || undefined;

    const groups = optionalContentConfig?.getOrder();
    if (!groups) {
      this._dispatchEvent(/* layersCount = */ 0);
      return;
    }

    const fragment = document.createDocumentFragment();
    const queue:[{
      parent:DocumentFragment | HTMLDivElement;
      groups:Order;
    }] = [{ parent: fragment, groups }];
    let layersCount = 0,
      hasAnyNesting = false;
    while( queue.length > 0 )
    {
      const levelData = queue.shift()!;
      for( const groupId of levelData.groups )
      {
        const div = html("div");
        div.className = "treeItem";

        const element = html("a");
        div.appendChild(element);

        if( typeof groupId === "object" )
        {
          hasAnyNesting = true;
          this.#addToggleButton(div, groupId);
          this.#setNestedName(element, groupId);

          const itemsDiv = html("div");
          itemsDiv.className = "treeItems";
          div.appendChild(itemsDiv);

          queue.push({ parent: itemsDiv, groups: groupId.order });
        } 
        else {
          const group = optionalContentConfig!.getGroup(groupId);

          const input = html("input");
          this._bindLink( element, { groupId, input } );
          input.type = "checkbox";
          input.id = groupId;
          input.checked = group!.visible;

          const label = html("label");
          label.setAttribute( "for", groupId );
          label.textContent = this._normalizeTextContent( group!.name! );

          element.appendChild(input);
          element.appendChild(label);

          layersCount++;
        }

        levelData.parent.appendChild(div);
      }
    }

    this.finishRendering$(fragment, layersCount, hasAnyNesting);
  }

  #resetLayers = async () =>
  {
    if( !this.#optionalContentConfig ) return;

    // Fetch the default optional content configuration...
    const optionalContentConfig =
      await this._pdfDocument!.getOptionalContentConfig();

    this.eventBus.dispatch("optionalcontentconfig", {
      source: this,
      promise: Promise.resolve(optionalContentConfig),
    });

    // ... and reset the sidebarView to the default state.
    this.render({
      optionalContentConfig,
      pdfDocument: this._pdfDocument!,
    });
  }
}
/*81---------------------------------------------------------------------------*/
