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

import { createPromiseCap, PromiseCap } from "../../lib/promisecap.js";
import { html } from "../../lib/dom.js";
import { getFilenameFromUrl } from "../pdf.ts-src/pdf.js";
import { BaseTreeViewer, type BaseTreeViewerCtorParms } from "./base_tree_viewer.js";
import { DownloadManager } from "./download_manager.js";
import { type EventMap } from "./ui_utils.js";
/*81---------------------------------------------------------------------------*/

interface PDFAttachmentViewerOptions extends BaseTreeViewerCtorParms
{
  /**
   * The download manager.
   */
  downloadManager:DownloadManager;
}

interface PDFAttachmentViewerRenderParms
{
  /**
   * A lookup table of attachment objects.
   */
  attachments?:Record<string, Attachment> | undefined;

  keepRenderedCapability?:boolean;
}

interface Attachment
{
  filename:string;
  content?:Uint8Array | Uint8ClampedArray | undefined;
}

export class PDFAttachmentViewer extends BaseTreeViewer 
{
  _attachments?:Record<string, Attachment> | undefined;
  #renderedCapability?:PromiseCap<void>;
  _pendingDispatchEvent?:number | undefined;

  downloadManager:DownloadManager;

  static create( options:PDFAttachmentViewerOptions )
  {
    const ret = new PDFAttachmentViewer( options );
    ret.reset();
    return ret;
  }
  private constructor( options:PDFAttachmentViewerOptions ) 
  {
    super( options );

    this.downloadManager = options.downloadManager;

    this.eventBus._on( 
      "fileattachmentannotation", this.#appendAttachment );
  }

  override reset( keepRenderedCapability=false ) 
  {
    super.reset();
    this._attachments = undefined;

    if( !keepRenderedCapability )
    {
      // The only situation in which the `#renderedCapability` should *not* be
      // replaced is when appending FileAttachment annotations.
      this.#renderedCapability = createPromiseCap();
    }
    if( this._pendingDispatchEvent )
    {
      clearTimeout(this._pendingDispatchEvent);
    }
    this._pendingDispatchEvent = undefined;
  }

  /** @implements */
  protected _dispatchEvent( attachmentsCount:number ) 
  {
    this.#renderedCapability!.resolve();

    if (this._pendingDispatchEvent) 
    {
      clearTimeout(this._pendingDispatchEvent);
      this._pendingDispatchEvent = undefined;
    }
    if (attachmentsCount === 0) 
    {
      // Delay the event when no "regular" attachments exist, to allow time for
      // parsing of any FileAttachment annotations that may be present on the
      // *initially* rendered page; this reduces the likelihood of temporarily
      // disabling the attachmentsView when the `PDFSidebar` handles the event.
      this._pendingDispatchEvent = setTimeout(() => {
        this.eventBus.dispatch("attachmentsloaded", {
          source: this,
          attachmentsCount: 0,
        });
        this._pendingDispatchEvent = undefined;
      });
      return;
    }

    this.eventBus.dispatch("attachmentsloaded", {
      source: this,
      attachmentsCount,
    });
  }

  /** @implements */
  protected _bindLink( element:HTMLAnchorElement, { content, filename }:{
    content?:Uint8Array | Uint8ClampedArray | undefined;
    filename:string;
  }) {
    element.onclick = () => {
      this.downloadManager.openOrDownloadData(element, content, filename);
      return false;
    };
  }

  /** @implements */
  render({ attachments, keepRenderedCapability=false }:PDFAttachmentViewerRenderParms )
  {
    if( this._attachments )
    {
      this.reset( keepRenderedCapability );
    }
    this._attachments = attachments || undefined;

    if( !attachments )
    {
      this._dispatchEvent(/* attachmentsCount = */ 0);
      return;
    }
    const names = Object.keys(attachments).sort( (a, b) => {
      return a.toLowerCase().localeCompare( b.toLowerCase() );
    });

    const fragment = document.createDocumentFragment();
    let attachmentsCount = 0;
    for( const name of names )
    {
      const item = attachments[name];
      const content = item.content,
        filename = getFilenameFromUrl(item.filename);

      const div = html("div");
      div.className = "treeItem";

      const element = html("a");
      this._bindLink(element, { content, filename });
      element.textContent = this._normalizeTextContent(filename);

      div.appendChild(element);

      fragment.appendChild(div);
      attachmentsCount++;
    }

    this.finishRendering$(fragment, attachmentsCount);
  }

  /**
   * Used to append FileAttachment annotations to the sidebar.
   */
  #appendAttachment = ({ id, filename, content }:EventMap["fileattachmentannotation"]
  ) => {
    const renderedPromise = this.#renderedCapability!.promise;

    renderedPromise.then(() => {
      if( renderedPromise !== this.#renderedCapability!.promise )
      {
        return; // The FileAttachment annotation belongs to a previous document.
      }
      let attachments = this._attachments;

      if( !attachments )
      {
        attachments = Object.create(null);
      }
      else {
        for( const name in attachments )
        {
          if (id === name) 
          {
            return; // Ignore the new attachment if it already exists.
          }
        }
      }
      attachments![id] = {
        filename,
        content,
      };
      this.render({
        attachments,
        keepRenderedCapability: true,
      });
    });
  }
}
/*81---------------------------------------------------------------------------*/
