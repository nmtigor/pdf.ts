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
import { PDFDocumentProxy } from "../pdf.ts-src/display/api.js";
import { removeNullCharacters } from "./ui_utils.js";
import { EventBus } from "./event_utils.js";
/*81---------------------------------------------------------------------------*/

const TREEITEM_OFFSET_TOP = -100; // px
const TREEITEM_SELECTED_CLASS = "selected";

export interface BaseTreeViewerCtorParms
{
  /**
   * The viewer element.
   */
  container:HTMLDivElement;

  /**
   * The application event bus.
   */
  eventBus:EventBus;
}

export abstract class BaseTreeViewer 
{
  container;
  eventBus;

  protected _pdfDocument:PDFDocumentProxy | undefined;
  #lastToggleIsShow!:boolean;
  #currentTreeItem!:HTMLElement | null;

  constructor( options:BaseTreeViewerCtorParms )
  {
    this.container = options.container;
    this.eventBus = options.eventBus;

    // Ref. Access private method in an overriden method called from the base class constructor
    // (https://stackoverflow.com/questions/61237153/access-private-method-in-an-overriden-method-called-from-the-base-class-construc)
    // this.reset();
  }

  reset() 
  {
    this._pdfDocument = undefined;
    this.#lastToggleIsShow = true;
    this.#currentTreeItem = null;

    // Remove the tree from the DOM.
    this.container.textContent = "";
    // Ensure that the left (right in RTL locales) margin is always reset,
    // to prevent incorrect tree alignment if a new document is opened.
    this.container.classList.remove("treeWithDeepNesting");
  }

  protected abstract _dispatchEvent( count?:number ):void;

  protected abstract _bindLink( element:HTMLAnchorElement, params:object ):void;

  protected _normalizeTextContent( str:string ):string
  {
    // Chars in range [0x01-0x1F] will be replaced with a white space
    // and 0x00 by "".
    return (
      removeNullCharacters(str, /* replaceInvisible */ true) ||
      /* en dash = */ "\u2013"
    );
  }

  /**
   * Prepend a button before a tree item which allows the user to collapse or
   * expand all tree items at that level; see `#toggleTreeItem`.
   */
  protected _addToggleButton( div:HTMLDivElement, hidden=false ) 
  {
    const toggler = html("div");
    toggler.className = "treeItemToggler";
    if (hidden) 
    {
      toggler.classList.add("treeItemsHidden");
    }
    toggler.onclick = evt => {
      evt.stopPropagation();
      toggler.classList.toggle("treeItemsHidden");

      if (evt.shiftKey) 
      {
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
  #toggleTreeItem( root:HTMLDivElement, show=false )
  {
    this.#lastToggleIsShow = show;
    root.querySelectorAll(".treeItemToggler").forEach( toggler => {
      toggler.classList.toggle("treeItemsHidden", !show);
    });
  }

  /**
   * Collapse or expand all subtrees of the `container`.
   */
  protected toggleAllTreeItems$() 
  {
    this.#toggleTreeItem(this.container, !this.#lastToggleIsShow);
  }

  /** @final */
  protected finishRendering$( fragment:DocumentFragment, count:number, hasAnyNesting=false )
  {
    if (hasAnyNesting) {
      this.container.classList.add("treeWithDeepNesting");

      this.#lastToggleIsShow = !fragment.querySelector(".treeItemsHidden");
    }
    this.container.appendChild(fragment);

    this._dispatchEvent(count);
  }

  abstract render( params:object ):void;

  protected _updateCurrentTreeItem( treeItem:HTMLElement | null=null )
  {
    if( this.#currentTreeItem )
    {
      // Ensure that the current treeItem-selection is always removed.
      this.#currentTreeItem.classList.remove(TREEITEM_SELECTED_CLASS);
      this.#currentTreeItem = null;
    }
    if( treeItem )
    {
      treeItem.classList.add(TREEITEM_SELECTED_CLASS);
      this.#currentTreeItem = treeItem;
    }
  }

  protected _scrollToCurrentTreeItem( treeItem:HTMLElement | null )
  {
    if( !treeItem ) return;

    // Ensure that the treeItem is *fully* expanded, such that it will first of
    // all be visible and secondly that scrolling it into view works correctly.
    let currentNode = <HTMLElement|null>treeItem.parentNode;
    while( currentNode && currentNode !== this.container )
    {
      if( currentNode.classList.contains("treeItem") )
      {
        const toggler = currentNode.firstElementChild;
        toggler?.classList.remove("treeItemsHidden");
      }
      currentNode = <HTMLElement|null>currentNode.parentNode;
    }
    this._updateCurrentTreeItem( treeItem );

    this.container.scrollTo(
      treeItem.offsetLeft,
      treeItem.offsetTop + TREEITEM_OFFSET_TOP
    );
  }
}
/*81---------------------------------------------------------------------------*/
