/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
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

import { isObjectLike } from "../../lib/jslang.js";
import { html } from "../../lib/dom.js";
import { ExplicitDest } from "../pdf.ts-src/core/catalog.js";
import { Ref } from "../pdf.ts-src/core/primitives.js";
import { OutlineNode, PDFDocumentProxy } from "../pdf.ts-src/display/api.js";
import { createPromiseCapability } from "../pdf.ts-src/pdf.js";
import { PromiseCapability } from "../pdf.ts-src/shared/util.js";
import { BaseTreeViewer, BaseTreeViewerCtorParms } from "./base_tree_viewer.js";
import { PDFLinkService } from "./pdf_link_service.js";
import { SidebarView } from "./ui_utils.js";
/*81---------------------------------------------------------------------------*/

interface PDFOutlineViewerOptions extends BaseTreeViewerCtorParms
{
  linkService:PDFLinkService;
}

interface PDFOutlineViewerRenderParms
{
  /**
   * An array of outline objects.
   */
  outline:OutlineNode[] | null;

  /**
   * A {PDFDocument} instance.
   */
  pdfDocument:PDFDocumentProxy;
}

export class PDFOutlineViewer extends BaseTreeViewer 
{
  _outline!:OutlineNode[] | null;

  _pageNumberToDestHashCapability!:PromiseCapability< Map<number,string> | null > | null;
  _currentPageNumber!:number;
  _sidebarView?:SidebarView;
  
  _isPagesLoaded!:boolean;
  #currentOutlineItemCapability?:PromiseCapability<boolean> | undefined;

  linkService:PDFLinkService;

  static create( options:PDFOutlineViewerOptions )
  {
    const ret = new PDFOutlineViewer( options );
    ret.reset();
    return ret;
  }
  private constructor( options:PDFOutlineViewerOptions ) 
  {
    super(options);
    
    this.linkService = options.linkService;

    this.eventBus._on( "toggleoutlinetree", this.toggleAllTreeItems$.bind(this) );
    this.eventBus._on( "currentoutlineitem", this.#currentOutlineItem );

    this.eventBus._on("pagechanging", evt => {
      this._currentPageNumber = evt.pageNumber;
    });
    this.eventBus._on("pagesloaded", evt => {
      this._isPagesLoaded = !!evt.pagesCount;

      // If the capability is still pending, see the `_dispatchEvent`-method,
      // we know that the `currentOutlineItem`-button can be enabled here.
      if( this.#currentOutlineItemCapability 
       && !this.#currentOutlineItemCapability.settled
      ) {
        this.#currentOutlineItemCapability.resolve(
          /* enabled = */ this._isPagesLoaded
        );
      }
    });
    this.eventBus._on("sidebarviewchanged", evt => {
      this._sidebarView = evt.view;
    });
  }

  override reset()
  {
    super.reset();

    this._outline = null;

    this._pageNumberToDestHashCapability = null;
    this._currentPageNumber = 1;
    this._isPagesLoaded = false;

    if( this.#currentOutlineItemCapability
     && !this.#currentOutlineItemCapability.settled
    ) {
      this.#currentOutlineItemCapability.resolve(/* enabled = */ false);
    }
    this.#currentOutlineItemCapability = undefined;
  }

  /** @implements */
  protected _dispatchEvent( outlineCount:number ) 
  {
    this.#currentOutlineItemCapability = createPromiseCapability();
    if (
      outlineCount === 0 ||
      this._pdfDocument?.loadingParams.disableAutoFetch
    ) {
      this.#currentOutlineItemCapability.resolve(/* enabled = */ false);
    } 
    else if (this._isPagesLoaded) 
    {
      this.#currentOutlineItemCapability.resolve(/* enabled = */ true);
    }

    this.eventBus.dispatch("outlineloaded", {
      source: this,
      outlineCount,
      currentOutlineItemPromise: this.#currentOutlineItemCapability.promise,
    });
  }

  /** @implements */
  protected _bindLink( element:HTMLAnchorElement, { url, newWindow, dest }:{
    url?:string | undefined;
    newWindow?:boolean | undefined;
    dest?:ExplicitDest | string | undefined;
  }) {
    const { linkService } = this;

    if( url )
    {
      linkService.addLinkAttributes(element, url, newWindow);
      return;
    }

    element.href = linkService.getDestinationHash( dest );
    element.onclick = evt => {
      this._updateCurrentTreeItem( <HTMLElement|null>(<Node>evt.target).parentNode );

      if( dest )
      {
        linkService.goToDestination( dest );
      }
      return false;
    };
  }

  #setStyles = ( element:HTMLAnchorElement, { bold, italic }:OutlineNode ) =>
  {
    if( bold )
    {
      element.style.fontWeight = "bold";
    }
    if( italic )
    {
      element.style.fontStyle = "italic";
    }
  }

  #addToggleButton = ( div:HTMLDivElement, { count, items }:OutlineNode ) =>
  {
    let hidden = false;
    if( count! < 0 )
    {
      let totalCount = items.length;
      if( totalCount > 0 )
      {
        const queue = [...items];
        while( queue.length > 0 )
        {
          const { count: nestedCount, items: nestedItems } = queue.shift()!;
          if( nestedCount! > 0 && nestedItems.length > 0 )
          {
            totalCount += nestedItems.length;
            queue.push(...nestedItems);
          }
        }
      }
      if( Math.abs(count!) === totalCount )
      {
        hidden = true;
      }
    }
    super._addToggleButton(div, hidden);
  }

  protected override toggleAllTreeItems$() 
  {
    if( !this._outline )
    {
      return;
    }
    super.toggleAllTreeItems$();
  }

  /** @implements */
  render({ outline, pdfDocument }:PDFOutlineViewerRenderParms ) 
  {
    if( this._outline )
    {
      this.reset();
    }
    this._outline = outline || null;
    this._pdfDocument = pdfDocument || null;

    if (!outline) {
      this._dispatchEvent(/* outlineCount = */ 0);
      return;
    }

    const fragment = document.createDocumentFragment();
    const queue:[{
      parent:DocumentFragment | HTMLDivElement;
      items:OutlineNode[];
    }] = [{ parent: fragment, items: outline }];
    let outlineCount = 0,
      hasAnyNesting = false;
    while( queue.length > 0 )
    {
      const levelData = queue.shift()!;
      for( const item of levelData.items )
      {
        const div = html("div");
        div.className = "treeItem";

        const element = html("a");
        this._bindLink( element, item );
        this.#setStyles( element, item );
        element.textContent = this._normalizeTextContent( item.title );

        div.appendChild( element );

        if( item.items.length > 0 )
        {
          hasAnyNesting = true;
          this.#addToggleButton( div, item );

          const itemsDiv = html("div");
          itemsDiv.className = "treeItems";
          div.appendChild(itemsDiv);

          queue.push({ parent: itemsDiv, items: item.items });
        }

        levelData.parent.appendChild(div);
        outlineCount++;
      }
    }

    this.finishRendering$(fragment, outlineCount, hasAnyNesting);
  }

  /**
   * Find/highlight the current outline item, corresponding to the active page.
   */
  #currentOutlineItem = async () =>
  {
    if (!this._isPagesLoaded) {
      throw new Error("#currentOutlineItem: All pages have not been loaded.");
    }
    if (!this._outline || !this._pdfDocument) {
      return;
    }

    const pageNumberToDestHash = await this.#getPageNumberToDestHash(
      this._pdfDocument
    );
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
      this._scrollToCurrentTreeItem( <HTMLElement|null>linkElement.parentNode );
      break;
    }
  }

  /**
   * To (significantly) simplify the overall implementation, we will only
   * consider *one* destination per page when finding/highlighting the current
   * outline item (similar to e.g. Adobe Reader); more specifically, we choose
   * the *first* outline item at the *lowest* level of the outline tree.
   */
  #getPageNumberToDestHash = async ( pdfDocument:PDFDocumentProxy ) =>
  {
    if( this._pageNumberToDestHashCapability )
    {
      return this._pageNumberToDestHashCapability.promise;
    }
    this._pageNumberToDestHashCapability = createPromiseCapability();

    const pageNumberToDestHash = new Map< number, string >(),
      pageNumberNesting = new Map();
    const queue = [{ nesting: 0, items: this._outline }];
    while( queue.length > 0 )
    {
      const levelData = queue.shift()!,
        currentNesting = levelData.nesting;
      for( const { dest, items } of levelData.items! )
      {
        let explicitDest, pageNumber;
        if( typeof dest === "string" )
        {
          explicitDest = await pdfDocument.getDestination(dest);

          if (pdfDocument !== this._pdfDocument) {
            return null; // The document was closed while the data resolved.
          }
        } 
        else {
          explicitDest = dest;
        }
        if (Array.isArray(explicitDest)) {
          const [destRef] = explicitDest;

          if( isObjectLike(destRef) ) 
          {
            pageNumber = this.linkService._cachedPageNumber( <Ref>destRef );

            if( !pageNumber )
            {
              try {
                pageNumber = (await pdfDocument.getPageIndex( <Ref>destRef )) + 1;

                if (pdfDocument !== this._pdfDocument) 
                {
                  return null; // The document was closed while the data resolved.
                }
                this.linkService.cachePageRef( pageNumber, <Ref>destRef );
              } catch (ex) {
                // Invalid page reference, ignore it and continue parsing.
              }
            }
          } 
          else if( Number.isInteger(destRef) )
          {
            pageNumber = <number>destRef + 1;
          }

          if( Number.isInteger(pageNumber)
           && (   !pageNumberToDestHash.has( <number>pageNumber )
               || currentNesting > pageNumberNesting.get(pageNumber))
          ) {
            const destHash = this.linkService.getDestinationHash(dest);
            pageNumberToDestHash.set( <number>pageNumber, destHash );
            pageNumberNesting.set(pageNumber, currentNesting);
          }
        }

        if (items.length > 0) {
          queue.push({ nesting: currentNesting + 1, items });
        }
      }
    }

    this._pageNumberToDestHashCapability.resolve(
      pageNumberToDestHash.size > 0 ? pageNumberToDestHash : null
    );
    return this._pageNumberToDestHashCapability.promise;
  }
}
/*81---------------------------------------------------------------------------*/
