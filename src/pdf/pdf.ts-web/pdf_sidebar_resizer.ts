/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
 */

/* Copyright 2017 Mozilla Foundation
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

import { IL10n } from "./interfaces.js";
import { EventBus } from "./ui_utils.js";
import { ViewerConfiguration } from "./viewer.js";
/*81---------------------------------------------------------------------------*/

const SIDEBAR_WIDTH_VAR = "--sidebar-width";
const SIDEBAR_MIN_WIDTH = 200; // pixels
const SIDEBAR_RESIZING_CLASS = "sidebarResizing";

export class PDFSidebarResizer 
{
  isRTL = false;
  sidebarOpen = false;
  doc;
  _width?:number;
  _outerContainerWidth?:number | undefined;
  _boundEvents = Object.create(null);

  outerContainer:HTMLDivElement;
  resizer:HTMLDivElement;

  /**
   * @param eventBus The application event bus.
   * @param l10n Localization service.
   */
  constructor( options:ViewerConfiguration['sidebarResizer'], 
    public eventBus:EventBus, 
    l10n:IL10n
  ) {
    this.doc = document.documentElement;

    this.outerContainer = options.outerContainer;
    this.resizer = options.resizer;

    l10n.getDirection().then(dir => {
      this.isRTL = dir === "rtl";
    });
    this.#addEventListeners();
  }

  get outerContainerWidth() 
  {
    return (this._outerContainerWidth ||= this.outerContainer.clientWidth);
  }

  /**
   * @return Indicating if the sidebar width was updated.
   */
  #updateWidth = ( width=0 ) =>
  {
    // Prevent the sidebar from becoming too narrow, or from occupying more
    // than half of the available viewer width.
    const maxWidth = Math.floor(this.outerContainerWidth / 2);
    if (width > maxWidth) {
      width = maxWidth;
    }
    if (width < SIDEBAR_MIN_WIDTH) {
      width = SIDEBAR_MIN_WIDTH;
    }
    // Only update the UI when the sidebar width did in fact change.
    if (width === this._width) {
      return false;
    }
    this._width = width;
    this.doc.style.setProperty(SIDEBAR_WIDTH_VAR, `${width}px`);
    return true;
  }

  #mouseMove = ( evt:MouseEvent ) =>
  {
    let width = evt.clientX;
    // For sidebar resizing to work correctly in RTL mode, invert the width.
    if (this.isRTL) {
      width = this.outerContainerWidth - width;
    }
    this.#updateWidth(width);
  }

  #mouseUp = ( evt:MouseEvent ) => 
  {
    // Re-enable the `transition-duration` rules when sidebar resizing ends...
    this.outerContainer.classList.remove(SIDEBAR_RESIZING_CLASS);
    // ... and ensure that rendering will always be triggered.
    this.eventBus.dispatch( "resize", { source: this } );

    const _boundEvents = this._boundEvents;
    window.removeEventListener("mousemove", _boundEvents.mouseMove);
    window.removeEventListener("mouseup", _boundEvents.mouseUp);
  }

  #addEventListeners = () =>
  {
    const _boundEvents = this._boundEvents;
    _boundEvents.mouseMove = this.#mouseMove.bind(this);
    _boundEvents.mouseUp = this.#mouseUp;

    this.resizer.addEventListener("mousedown", evt => {
      if (evt.button !== 0) {
        return;
      }
      // Disable the `transition-duration` rules when sidebar resizing begins,
      // in order to improve responsiveness and to avoid visual glitches.
      this.outerContainer.classList.add(SIDEBAR_RESIZING_CLASS);

      window.addEventListener("mousemove", _boundEvents.mouseMove);
      window.addEventListener("mouseup", _boundEvents.mouseUp);
    });

    this.eventBus._on("sidebarviewchanged", evt => {
      this.sidebarOpen = !!evt?.view;
    });

    this.eventBus._on("resize", evt => {
      // When the *entire* viewer is resized, such that it becomes narrower,
      // ensure that the sidebar doesn't end up being too wide.
      if( evt?.source !== window ) return;

      // Always reset the cached width when the viewer is resized.
      this._outerContainerWidth = undefined;

      if (!this._width) {
        // The sidebar hasn't been resized, hence no need to adjust its width.
        return;
      }
      // NOTE: If the sidebar is closed, we don't need to worry about
      //       visual glitches nor ensure that rendering is triggered.
      if (!this.sidebarOpen) {
        this.#updateWidth(this._width);
        return;
      }
      this.outerContainer.classList.add(SIDEBAR_RESIZING_CLASS);
      const updated = this.#updateWidth(this._width);

      Promise.resolve().then(() => {
        this.outerContainer.classList.remove(SIDEBAR_RESIZING_CLASS);
        // Trigger rendering if the sidebar width changed, to avoid
        // depending on the order in which 'resize' events are handled.
        if (updated) {
          this.eventBus.dispatch("resize", { source: this });
        }
      });
    });
  }
}
/*81---------------------------------------------------------------------------*/
