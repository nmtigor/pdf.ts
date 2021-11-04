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

import {
  EventBus,
  getVisibleElements,
  isValidRotation,
  scrollIntoView,
  VisibleElements,
  watchScroll,
} from "./ui_utils.js";
import { PDFThumbnailView, TempImageFactory } from "./pdf_thumbnail_view.js";
import { IL10n, IPDFLinkService, IRenderableView } from "./interfaces.js";
import { PDFRenderingQueue, RenderingStates } from "./pdf_rendering_queue.js";
import { PDFDocumentProxy, PDFPageProxy } from '../pdf.ts-src/display/api.js';
import { OptionalContentConfig } from '../pdf.ts-src/display/optional_content_config.js';
/*81---------------------------------------------------------------------------*/

const THUMBNAIL_SCROLL_MARGIN = -19;
const THUMBNAIL_SELECTED_CLASS = "selected";

interface PDFThumbnailViewerOptions
{
  /**
   * The container for the thumbnail elements.
   */
  container:HTMLDivElement;

  /**
   * The application event bus.
   */
  eventBus:EventBus;

  /**
   * The navigation/linking service.
   */
  linkService:IPDFLinkService;

  /**
   * The rendering queue object.
   */
  renderingQueue:PDFRenderingQueue;

  /**
   * Localization service.
   */
  l10n:IL10n;
}

/**
 * Viewer control to display thumbnails for pages in a PDF document.
 */
export class PDFThumbnailViewer// implements IRenderableView
{
  container;
  linkService;
  renderingQueue;
  l10n;

  scroll;

  _thumbnails!:PDFThumbnailView[];
  _currentPageNumber!:number;
  _pageLabels?:string[] | undefined;
  _pagesRotation!:number;
  _optionalContentConfigPromise?:Promise<OptionalContentConfig> | undefined;
  _pagesRequests!:WeakMap< PDFThumbnailView, Promise<void|PDFPageProxy> >;
  _setImageDisabled!:boolean;

  pdfDocument?:PDFDocumentProxy | undefined;

  constructor({
    container,
    eventBus,
    linkService,
    renderingQueue,
    l10n,
  }:PDFThumbnailViewerOptions ) {
    this.container = container;
    this.linkService = linkService;
    this.renderingQueue = renderingQueue;
    this.l10n = l10n;

    this.scroll = watchScroll( this.container, this.#scrollUpdated );
    this._resetView();

    eventBus._on("optionalcontentconfigchanged", () => {
      // Ensure that the thumbnails always render with the *default* optional
      // content configuration.
      this._setImageDisabled = true;
    });
  }

  #scrollUpdated = () => 
  {
    this.renderingQueue.renderHighestPriority();
  }

  getThumbnail( index:number ) 
  {
    return this._thumbnails[index];
  }

  #getVisibleThumbs = () =>
  {
    return getVisibleElements({
      scrollEl: this.container,
      views: this._thumbnails,
    });
  }

  scrollThumbnailIntoView( pageNumber:number ) 
  {
    if (!this.pdfDocument) {
      return;
    }
    const thumbnailView = this._thumbnails[pageNumber - 1];

    if (!thumbnailView) {
      console.error('scrollThumbnailIntoView: Invalid "pageNumber" parameter.');
      return;
    }

    if( pageNumber !== this._currentPageNumber )
    {
      const prevThumbnailView = this._thumbnails[this._currentPageNumber - 1];
      // Remove the highlight from the previous thumbnail...
      prevThumbnailView.div.classList.remove(THUMBNAIL_SELECTED_CLASS);
      // ... and add the highlight to the new thumbnail.
      thumbnailView.div.classList.add(THUMBNAIL_SELECTED_CLASS);
    }
    const visibleThumbs = this.#getVisibleThumbs();
    const numVisibleThumbs = visibleThumbs.views.length;

    // If the thumbnail isn't currently visible, scroll it into view.
    if( numVisibleThumbs > 0 )
    {
      const first = visibleThumbs.first!.id;
      // Account for only one thumbnail being visible.
      const last = numVisibleThumbs > 1 ? visibleThumbs.last!.id : first;

      let shouldScroll = false;
      if (pageNumber <= first || pageNumber >= last) {
        shouldScroll = true;
      } 
      else {
        visibleThumbs.views.some(function (view) {
          if (view.id !== pageNumber) {
            return false;
          }
          shouldScroll = view.percent! < 100;
          return true;
        });
      }
      if (shouldScroll) {
        scrollIntoView(thumbnailView.div, { top: THUMBNAIL_SCROLL_MARGIN });
      }
    }

    this._currentPageNumber = pageNumber;
  }

  get pagesRotation() 
  {
    return this._pagesRotation;
  }

  set pagesRotation(rotation) 
  {
    if (!isValidRotation(rotation)) 
    {
      throw new Error("Invalid thumbnails rotation angle.");
    }
    if (!this.pdfDocument) 
    {
      return;
    }
    if (this._pagesRotation === rotation) 
    {
      return; // The rotation didn't change.
    }
    this._pagesRotation = rotation;

    const updateArgs = { rotation };
    for( const thumbnail of this._thumbnails )
    {
      thumbnail.update( updateArgs );
    }
  }

  cleanup() {
    for (let i = 0, ii = this._thumbnails.length; i < ii; i++) {
      if (
        this._thumbnails[i] &&
        this._thumbnails[i].renderingState !== RenderingStates.FINISHED
      ) {
        this._thumbnails[i].reset();
      }
    }
    TempImageFactory.destroyCanvas();
  }

  protected _resetView() 
  {
    this._thumbnails = [];
    this._currentPageNumber = 1;
    this._pageLabels = undefined;
    this._pagesRotation = 0;
    this._optionalContentConfigPromise = undefined;
    this._pagesRequests = new WeakMap();
    this._setImageDisabled = false;

    // Remove the thumbnails from the DOM.
    this.container.textContent = "";
  }

  setDocument( pdfDocument?:PDFDocumentProxy ) 
  {
    if (this.pdfDocument) {
      this._cancelRendering();
      this._resetView();
    }

    this.pdfDocument = pdfDocument;
    if (!pdfDocument) {
      return;
    }
    const firstPagePromise = pdfDocument.getPage(1);
    const optionalContentConfigPromise = pdfDocument.getOptionalContentConfig();

    firstPagePromise
      .then(firstPdfPage => {
        this._optionalContentConfigPromise = optionalContentConfigPromise;

        const pagesCount = pdfDocument.numPages;
        const viewport = firstPdfPage.getViewport({ scale: 1 });
        const checkSetImageDisabled = () => {
          return this._setImageDisabled;
        };

        for (let pageNum = 1; pageNum <= pagesCount; ++pageNum) {
          const thumbnail = new PDFThumbnailView({
            container: this.container,
            id: pageNum,
            defaultViewport: viewport.clone(),
            optionalContentConfigPromise,
            linkService: this.linkService,
            renderingQueue: this.renderingQueue,
            checkSetImageDisabled,
            l10n: this.l10n,
          });
          this._thumbnails.push(thumbnail);
        }
        // Set the first `pdfPage` immediately, since it's already loaded,
        // rather than having to repeat the `PDFDocumentProxy.getPage` call in
        // the `this.#ensurePdfPageLoaded` method before rendering can start.
        const firstThumbnailView = this._thumbnails[0];
        if (firstThumbnailView) {
          firstThumbnailView.setPdfPage(firstPdfPage);
        }

        // Ensure that the current thumbnail is always highlighted on load.
        const thumbnailView = this._thumbnails[this._currentPageNumber - 1];
        thumbnailView.div.classList.add(THUMBNAIL_SELECTED_CLASS);
      })
      .catch(reason => {
        console.error("Unable to initialize thumbnail viewer", reason);
      });
  }

  /** @override */
  protected _cancelRendering() 
  {
    for (let i = 0, ii = this._thumbnails.length; i < ii; i++) {
      if (this._thumbnails[i]) {
        this._thumbnails[i].cancelRendering();
      }
    }
  }

  setPageLabels( labels:string[] | null ) 
  {
    if (!this.pdfDocument) {
      return;
    }
    if (!labels) {
      this._pageLabels = undefined;
    } 
    else if (
      !(Array.isArray(labels) && this.pdfDocument.numPages === labels.length)
    ) {
      this._pageLabels = undefined;
      console.error("PDFThumbnailViewer_setPageLabels: Invalid page labels.");
    } 
    else {
      this._pageLabels = labels;
    }
    // Update all the `PDFThumbnailView` instances.
    for( let i = 0, ii = this._thumbnails.length; i < ii; i++ )
    {
      this._thumbnails[i].setPageLabel(this._pageLabels?.[i] ?? null);
    }
  }

  #ensurePdfPageLoaded = ( thumbView:PDFThumbnailView ) =>
  {
    if( thumbView.pdfPage )
    {
      return Promise.resolve(thumbView.pdfPage);
    }
    if( this._pagesRequests.has(thumbView) )
    {
      return this._pagesRequests.get(thumbView)!;
    }
    const promise = this.pdfDocument!
      .getPage(thumbView.id)
      .then(pdfPage => {
        if (!thumbView.pdfPage) {
          thumbView.setPdfPage(pdfPage);
        }
        this._pagesRequests.delete(thumbView);
        return pdfPage;
      })
      .catch(reason => {
        console.error("Unable to get page for thumb view", reason);
        // Page error -- there is nothing that can be done.
        this._pagesRequests.delete(thumbView);
      });
    this._pagesRequests.set(thumbView, promise);
    return promise;
  }

  #getScrollAhead( visible:VisibleElements ) 
  {
    if( visible.first?.id === 1 ) return true;
    else if( visible.last?.id === this._thumbnails.length ) return false;
    return this.scroll.down;
  }

  forceRendering()
  {
    const visibleThumbs = this.#getVisibleThumbs();
    const scrollAhead = this.#getScrollAhead( visibleThumbs );
    const thumbView = this.renderingQueue.getHighestPriority(
      visibleThumbs,
      this._thumbnails,
      scrollAhead
    );
    if( thumbView )
    {
      this.#ensurePdfPageLoaded( <PDFThumbnailView>thumbView ).then(() => {
        this.renderingQueue.renderView(thumbView);
      });
      return true;
    }
    return false;
  }
}
/*81---------------------------------------------------------------------------*/
