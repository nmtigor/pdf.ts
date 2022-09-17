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

/** @typedef {import("./interfaces").IRenderableView} IRenderableView */
/** @typedef {import("./pdf_viewer").PDFViewer} PDFViewer */
// eslint-disable-next-line max-len
/** @typedef {import("./pdf_thumbnail_viewer").PDFThumbnailViewer} PDFThumbnailViewer */

import { global, PDFTS_vv, _INFO } from "../../global.ts";
import { RenderingCancelledException } from "../pdf.ts-src/pdf.ts";
import { BaseViewer } from "./base_viewer.ts";
import { type IRenderableView, type IVisibleView } from "./interfaces.ts";
import { PDFThumbnailViewer } from "./pdf_thumbnail_viewer.ts";
import { RenderingStates, type VisibleElements } from "./ui_utils.ts";
/*80--------------------------------------------------------------------------*/

const CLEANUP_TIMEOUT = 30000;

/**
 * Controls rendering of the views for pages and thumbnails.
 */
export class PDFRenderingQueue {
  pdfViewer?: BaseViewer;
  pdfThumbnailViewer?: PDFThumbnailViewer;
  onIdle?: () => void;
  highestPriorityPage?: string;
  idleTimeout?: number | undefined;
  printing = false;
  isThumbnailViewEnabled = false;

  setViewer(pdfViewer: BaseViewer) {
    this.pdfViewer = pdfViewer;
  }

  setThumbnailViewer(pdfThumbnailViewer: PDFThumbnailViewer) {
    this.pdfThumbnailViewer = pdfThumbnailViewer;
  }

  isHighestPriority(view: IRenderableView) {
    return this.highestPriorityPage === view.renderingId;
  }

  hasViewer() {
    return !!this.pdfViewer;
  }

  renderHighestPriority(currentlyVisiblePages?: VisibleElements) {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
      this.idleTimeout = undefined;
    }

    // Pages have a higher priority than thumbnails, so check them first.
    if (this.pdfViewer!.forceRendering(currentlyVisiblePages)) {
      return;
    }
    // No pages needed rendering, so check thumbnails.
    if (
      this.isThumbnailViewEnabled &&
      this.pdfThumbnailViewer?.forceRendering()
    ) {
      return;
    }

    if (this.printing) {
      // If printing is currently ongoing do not reschedule cleanup.
      return;
    }

    if (this.onIdle) {
      this.idleTimeout = setTimeout(this.onIdle.bind(this), CLEANUP_TIMEOUT);
    }
  }

  getHighestPriority(
    visible: VisibleElements,
    views: IVisibleView[],
    scrolledDown: boolean,
    preRenderExtra = false,
  ) {
    /**
     * The state has changed. Figure out which page has the highest priority to
     * render next (if any).
     *
     * Priority:
     * 1. visible pages
     * 2. if last scrolled down, the page after the visible pages, or
     *    if last scrolled up, the page before the visible pages
     */
    const visibleViews = visible.views,
      numVisible = visibleViews.length;

    if (numVisible === 0) {
      return undefined;
    }
    for (let i = 0; i < numVisible; i++) {
      const view = visibleViews[i].view;
      if (!this.isViewFinished(view)) {
        return view;
      }
    }
    const firstId = visible.first!.id,
      lastId = visible.last!.id;

    // All the visible views have rendered; try to handle any "holes" in the
    // page layout (can happen e.g. with spreadModes at higher zoom levels).
    if (lastId - firstId + 1 > numVisible) {
      const visibleIds = visible.ids!;
      for (let i = 1, ii = lastId - firstId; i < ii; i++) {
        const holeId = scrolledDown ? firstId + i : lastId - i;
        if (visibleIds.has(holeId)) {
          continue;
        }
        const holeView = views[holeId - 1];
        if (!this.isViewFinished(holeView)) {
          return holeView;
        }
      }
    }

    // All the visible views have rendered; try to render next/previous page.
    // (IDs start at 1, so no need to add 1 when `scrolledDown === true`.)
    let preRenderIndex = scrolledDown ? lastId : firstId - 2;
    let preRenderView = views[preRenderIndex];

    if (preRenderView && !this.isViewFinished(preRenderView)) {
      return preRenderView;
    }
    if (preRenderExtra) {
      preRenderIndex += scrolledDown ? 1 : -1;
      preRenderView = views[preRenderIndex];

      if (preRenderView && !this.isViewFinished(preRenderView)) {
        return preRenderView;
      }
    }
    // Everything that needs to be rendered has been.
    return undefined;
  }

  isViewFinished(view: IRenderableView) {
    return view.renderingState === RenderingStates.FINISHED;
  }

  /**
   * Render a page or thumbnail view. This calls the appropriate function
   * based on the views state. If the view is already rendered it will return
   * `false`.
   */
  renderView(view: IRenderableView) {
    /*#static*/ if (_INFO && PDFTS_vv) {
      console.log(
        `${global.indent}>>>>>>> PDFRenderingQueue.renderView() >>>>>>>`,
      );
      console.log(`${global.dent}${RenderingStates[view.renderingState]}`);
    }
    switch (view.renderingState) {
      case RenderingStates.FINISHED:
        /*#static*/ if (_INFO && PDFTS_vv) {
          global.outdent;
        }
        return false;
      case RenderingStates.PAUSED:
        this.highestPriorityPage = view.renderingId;
        view.resume!();
        break;
      case RenderingStates.RUNNING:
        this.highestPriorityPage = view.renderingId;
        break;
      case RenderingStates.INITIAL:
        this.highestPriorityPage = view.renderingId;
        view
          .draw()
          .finally(() => {
            this.renderHighestPriority();
          })
          .catch((reason) => {
            if (reason instanceof RenderingCancelledException) {
              return;
            }
            console.error(`renderView: "${reason}"`);
          });
        break;
    }
    /*#static*/ if (_INFO && PDFTS_vv) {
      global.outdent;
    }
    return true;
  }
}
/*80--------------------------------------------------------------------------*/
