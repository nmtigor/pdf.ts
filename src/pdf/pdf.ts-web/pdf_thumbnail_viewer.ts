/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/pdf_thumbnail_viewer.ts
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

import type {
  OptionalContentConfig,
  PDFDocumentProxy,
  PDFPageProxy,
} from "../pdf.ts-src/pdf.ts";
import type { EventBus } from "./event_utils.ts";
import type { IPDFLinkService } from "./interfaces.ts";
import type { PDFRenderingQueue } from "./pdf_rendering_queue.ts";
import { PDFThumbnailView, TempImageFactory } from "./pdf_thumbnail_view.ts";
import type { PageColors } from "./pdf_viewer.ts";
import type { VisibleElements } from "./ui_utils.ts";
import {
  getVisibleElements,
  isValidRotation,
  RenderingStates,
  scrollIntoView,
  watchScroll,
} from "./ui_utils.ts";
/*80--------------------------------------------------------------------------*/

const THUMBNAIL_SCROLL_MARGIN = -19;
const THUMBNAIL_SELECTED_CLASS = "selected";

interface PDFThumbnailViewerOptions {
  /**
   * The container for the thumbnail elements.
   */
  container: HTMLDivElement;

  /**
   * The application event bus.
   */
  eventBus: EventBus;

  /**
   * The navigation/linking service.
   */
  linkService: IPDFLinkService;

  /**
   * The rendering queue object.
   */
  renderingQueue: PDFRenderingQueue;

  /**
   * Overwrites background and foreground colors
   * with user defined ones in order to improve readability in high contrast
   * mode.
   */
  pageColors: PageColors | undefined;
}

/**
 * Viewer control to display thumbnails for pages in a PDF document.
 */
export class PDFThumbnailViewer {
  container;
  eventBus;
  linkService;
  renderingQueue;
  pageColors;

  scroll;

  _thumbnails!: PDFThumbnailView[];
  getThumbnail(index: number) {
    return this._thumbnails[index];
  }

  _currentPageNumber!: number;
  _pageLabels?: string[] | undefined;

  /* #pagesRotation */
  #pagesRotation!: number;
  get pagesRotation() {
    return this.#pagesRotation;
  }
  set pagesRotation(rotation) {
    if (!isValidRotation(rotation)) {
      throw new Error("Invalid thumbnails rotation angle.");
    }
    if (!this.pdfDocument) {
      return;
    }
    if (this.#pagesRotation === rotation) {
      return; // The rotation didn't change.
    }
    this.#pagesRotation = rotation;

    const updateArgs = { rotation };
    for (const thumbnail of this._thumbnails) {
      thumbnail.update(updateArgs);
    }
  }
  /* ~ */

  _optionalContentConfigPromise?: Promise<OptionalContentConfig> | undefined;
  _pagesRequests!: WeakMap<PDFThumbnailView, Promise<void | PDFPageProxy>>;
  _setImageDisabled!: boolean;

  pdfDocument?: PDFDocumentProxy | undefined;

  constructor({
    container,
    eventBus,
    linkService,
    renderingQueue,
    pageColors,
  }: PDFThumbnailViewerOptions) {
    this.container = container;
    this.eventBus = eventBus;
    this.linkService = linkService;
    this.renderingQueue = renderingQueue;
    this.pageColors = pageColors || undefined;

    this.scroll = watchScroll(this.container, this.#scrollUpdated);
    this.#resetView();
  }

  #scrollUpdated = () => {
    this.renderingQueue.renderHighestPriority();
  };

  #getVisibleThumbs() {
    return getVisibleElements({
      scrollEl: this.container,
      views: this._thumbnails,
    });
  }

  scrollThumbnailIntoView(pageNumber: number) {
    if (!this.pdfDocument) {
      return;
    }
    const thumbnailView = this._thumbnails[pageNumber - 1];

    if (!thumbnailView) {
      console.error('scrollThumbnailIntoView: Invalid "pageNumber" parameter.');
      return;
    }

    if (pageNumber !== this._currentPageNumber) {
      const prevThumbnailView = this._thumbnails[this._currentPageNumber - 1];
      // Remove the highlight from the previous thumbnail...
      prevThumbnailView.div.classList.remove(THUMBNAIL_SELECTED_CLASS);
      // ... and add the highlight to the new thumbnail.
      thumbnailView.div.classList.add(THUMBNAIL_SELECTED_CLASS);
    }
    const { first, last, views } = this.#getVisibleThumbs();

    // If the thumbnail isn't currently visible, scroll it into view.
    if (views.length > 0) {
      let shouldScroll = false;
      if (pageNumber <= first!.id || pageNumber >= last!.id) {
        shouldScroll = true;
      } else {
        for (const { id, percent } of views) {
          if (id !== pageNumber) {
            continue;
          }
          shouldScroll = percent! < 100;
          break;
        }
      }
      if (shouldScroll) {
        scrollIntoView(thumbnailView.div, { top: THUMBNAIL_SCROLL_MARGIN });
      }
    }

    this._currentPageNumber = pageNumber;
  }

  cleanup() {
    for (const thumbnail of this._thumbnails) {
      if (thumbnail.renderingState !== RenderingStates.FINISHED) {
        thumbnail.reset();
      }
    }
    TempImageFactory.destroyCanvas();
  }

  #resetView() {
    this._thumbnails = [];
    this._currentPageNumber = 1;
    this._pageLabels = undefined;
    this.#pagesRotation = 0;

    // Remove the thumbnails from the DOM.
    this.container.textContent = "";
  }

  setDocument(pdfDocument?: PDFDocumentProxy) {
    if (this.pdfDocument) {
      this.#cancelRendering();
      this.#resetView();
    }

    this.pdfDocument = pdfDocument;
    if (!pdfDocument) {
      return;
    }
    const firstPagePromise = pdfDocument.getPage(1);
    const optionalContentConfigPromise = pdfDocument.getOptionalContentConfig({
      intent: "display",
    });

    firstPagePromise
      .then((firstPdfPage) => {
        const pagesCount = pdfDocument.numPages;
        const viewport = firstPdfPage.getViewport({ scale: 1 });

        for (let pageNum = 1; pageNum <= pagesCount; ++pageNum) {
          const thumbnail = new PDFThumbnailView({
            container: this.container,
            eventBus: this.eventBus,
            id: pageNum,
            defaultViewport: viewport.clone(),
            optionalContentConfigPromise,
            linkService: this.linkService,
            renderingQueue: this.renderingQueue,
            pageColors: this.pageColors,
          });
          this._thumbnails.push(thumbnail);
        }
        // Set the first `pdfPage` immediately, since it's already loaded,
        // rather than having to repeat the `PDFDocumentProxy.getPage` call in
        // the `this.#ensurePdfPageLoaded` method before rendering can start.
        this._thumbnails[0]?.setPdfPage(firstPdfPage);

        // Ensure that the current thumbnail is always highlighted on load.
        const thumbnailView = this._thumbnails[this._currentPageNumber - 1];
        thumbnailView.div.classList.add(THUMBNAIL_SELECTED_CLASS);
      })
      .catch((reason) => {
        console.error("Unable to initialize thumbnail viewer", reason);
      });
  }

  #cancelRendering() {
    for (const thumbnail of this._thumbnails) {
      thumbnail.cancelRendering();
    }
  }

  setPageLabels(labels: string[] | null) {
    if (!this.pdfDocument) {
      return;
    }
    if (!labels) {
      this._pageLabels = undefined;
    } else if (
      !(Array.isArray(labels) && this.pdfDocument.numPages === labels.length)
    ) {
      this._pageLabels = undefined;
      console.error("PDFThumbnailViewer_setPageLabels: Invalid page labels.");
    } else {
      this._pageLabels = labels;
    }
    // Update all the `PDFThumbnailView` instances.
    for (let i = 0, ii = this._thumbnails.length; i < ii; i++) {
      this._thumbnails[i].setPageLabel(this._pageLabels?.[i] ?? null);
    }
  }

  async #ensurePdfPageLoaded(thumbView: PDFThumbnailView) {
    if (thumbView.pdfPage) {
      return thumbView.pdfPage;
    }
    try {
      const pdfPage = await this.pdfDocument!.getPage(thumbView.id);
      if (!thumbView.pdfPage) {
        thumbView.setPdfPage(pdfPage);
      }
      return pdfPage;
    } catch (reason) {
      console.error("Unable to get page for thumb view", reason);
      return null; // Page error -- there is nothing that can be done.
    }
  }

  #getScrollAhead(visible: VisibleElements) {
    if (visible.first?.id === 1) {
      return true;
    } else if (visible.last?.id === this._thumbnails.length) {
      return false;
    }
    return this.scroll.down;
  }

  forceRendering() {
    const visibleThumbs = this.#getVisibleThumbs();
    const scrollAhead = this.#getScrollAhead(visibleThumbs);
    const thumbView = this.renderingQueue.getHighestPriority(
      visibleThumbs,
      this._thumbnails,
      scrollAhead,
    );
    if (thumbView) {
      this.#ensurePdfPageLoaded(<PDFThumbnailView> thumbView).then(() => {
        this.renderingQueue.renderView(thumbView);
      });
      return true;
    }
    return false;
  }
}
/*80--------------------------------------------------------------------------*/
