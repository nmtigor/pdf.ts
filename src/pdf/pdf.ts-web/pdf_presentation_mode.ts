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

import { EventBus } from "./event_utils.js";
import { PDFViewer } from "./pdf_viewer.js";
import {
  normalizeWheelEventDelta,
  PresentationModeState,
  ScrollMode,
  SpreadMode
} from "./ui_utils.js";
/*81---------------------------------------------------------------------------*/

const DELAY_BEFORE_HIDING_CONTROLS = 3000; // in ms
const ACTIVE_SELECTOR = "pdfPresentationMode";
const CONTROLS_SELECTOR = "pdfPresentationModeControls";
const MOUSE_SCROLL_COOLDOWN_TIME = 50; // in ms
const PAGE_SWITCH_THRESHOLD = 0.1;

// Number of CSS pixels for a movement to count as a swipe.
const SWIPE_MIN_DISTANCE_THRESHOLD = 50;

// Swipe angle deviation from the x or y axis before it is not
// considered a swipe in that direction any more.
const SWIPE_ANGLE_THRESHOLD = Math.PI / 6;

interface PDFPresentationModeOptions
{
  /**
   * The container for the viewer element.
   */
  container:HTMLDivElement;

  /**
   * The document viewer.
   */
  pdfViewer:PDFViewer;

  /**
   * The application event bus.
   */
  eventBus:EventBus;
}

interface TouchSwipeState
{
  startX:number;
  startY:number;
  endX:number;
  endY:number;
}

interface PrsntModeArgs
{
  pageNumber:number;
  scaleValue:string | number;
  scrollMode:ScrollMode;
  spreadMode?:SpreadMode;
}

export class PDFPresentationMode 
{
  #state = PresentationModeState.UNKNOWN;
  get active() {
    return (
      this.#state === PresentationModeState.CHANGING ||
      this.#state === PresentationModeState.FULLSCREEN
    );
  }

  container;
  pdfViewer;
  eventBus;

  #args:PrsntModeArgs | undefined
  contextMenuOpen = false;
  mouseScrollTimeStamp = 0;
  mouseScrollDelta = 0;
  touchSwipeState?:TouchSwipeState | undefined;

  switchInProgress?:number;
  controlsTimeout?:number;

  constructor({ 
    container, 
    pdfViewer, 
    eventBus, 
  }:PDFPresentationModeOptions ) {
    this.container = container;
    this.pdfViewer = pdfViewer;
    this.eventBus = eventBus;
  }

  /**
   * Request the browser to enter fullscreen mode.
   * @return Indicating if the request was successful.
   */
  async request() 
  {
    const { container, pdfViewer } = this;

    if( this.active || !pdfViewer.pagesCount || !container.requestFullscreen )
      return false;
    this.#addFullscreenChangeListeners();
    this.#notifyStateChange( PresentationModeState.CHANGING );

    const promise = container.requestFullscreen();

    this.#args = {
      pageNumber: pdfViewer.currentPageNumber,
      scaleValue: pdfViewer.currentScaleValue,
      scrollMode: pdfViewer.scrollMode,
    };

    if( pdfViewer.spreadMode !== SpreadMode.NONE
     && !(pdfViewer.pageViewsReady && pdfViewer.hasEqualPageSizes)
    ) {
      console.warn(
        "Ignoring Spread modes when entering PresentationMode, " +
          "since the document may contain varying page sizes."
      );
      this.#args.spreadMode = pdfViewer.spreadMode;
    }

    try {
      await promise;
      return true;
    } catch (reason) {
      this.#removeFullscreenChangeListeners();
      this.#notifyStateChange( PresentationModeState.NORMAL );
    }
    return false;
  }

  #mouseWheel = ( evt:WheelEvent ) =>
  {
    if( !this.active ) 
      return;
    evt.preventDefault();

    const delta = normalizeWheelEventDelta(evt);
    const currentTime = Date.now();
    const storedTime = this.mouseScrollTimeStamp;

    // If we've already switched page, avoid accidentally switching again.
    if( currentTime > storedTime
     && currentTime - storedTime < MOUSE_SCROLL_COOLDOWN_TIME
    ) {
      return;
    }
    // If the scroll direction changed, reset the accumulated scroll delta.
    if( (this.mouseScrollDelta > 0 && delta < 0)
     || (this.mouseScrollDelta < 0 && delta > 0)
    ) {
      this.#resetMouseScrollState();
    }
    this.mouseScrollDelta += delta;

    if( Math.abs(this.mouseScrollDelta) >= PAGE_SWITCH_THRESHOLD )
    {
      const totalDelta = this.mouseScrollDelta;
      this.#resetMouseScrollState();
      const success =
        totalDelta > 0
          ? this.pdfViewer.previousPage()
          : this.pdfViewer.nextPage();
      if (success) {
        this.mouseScrollTimeStamp = currentTime;
      }
    }
  }

  #notifyStateChange = ( state:PresentationModeState ) =>
  {
    this.#state = state;

    this.eventBus.dispatch("presentationmodechanged", { source: this, state });
  }

  #enter()
  {
    this.#notifyStateChange( PresentationModeState.FULLSCREEN );
    this.container.classList.add( ACTIVE_SELECTOR );

    // Ensure that the correct page is scrolled into view when entering
    // Presentation Mode, by waiting until fullscreen mode in enabled.
    setTimeout(() => {
      this.pdfViewer.scrollMode = ScrollMode.PAGE;
      if( this.#args!.spreadMode !== undefined )
      {
        this.pdfViewer.spreadMode = SpreadMode.NONE;
      }
      this.pdfViewer.currentPageNumber = this.#args!.pageNumber;
      this.pdfViewer.currentScaleValue = "page-fit";
    }, 0);

    this.#addWindowListeners();
    this.#showControls();
    this.contextMenuOpen = false;

    // Text selection is disabled in Presentation Mode, thus it's not possible
    // for the user to deselect text that is selected (e.g. with "Select all")
    // when entering Presentation Mode, hence we remove any active selection.
    window.getSelection()!.removeAllRanges();
  }

  #exit()
  {
    const pageNumber = this.pdfViewer.currentPageNumber;
    this.container.classList.remove(ACTIVE_SELECTOR);

    // Ensure that the correct page is scrolled into view when exiting
    // Presentation Mode, by waiting until fullscreen mode is disabled.
    setTimeout(() => {
      this.#removeFullscreenChangeListeners();
      this.#notifyStateChange( PresentationModeState.NORMAL );

      this.pdfViewer.scrollMode = this.#args!.scrollMode;
      if( this.#args!.spreadMode !== undefined )
      {
        this.pdfViewer.spreadMode = this.#args!.spreadMode;
      }
      this.pdfViewer.currentScaleValue = this.#args!.scaleValue;
      this.pdfViewer.currentPageNumber = pageNumber;
      this.#args = undefined;
    }, 0);

    this.#removeWindowListeners();
    this.#hideControls();
    this.#resetMouseScrollState();
    this.contextMenuOpen = false;
  }

  #mouseDown = ( evt:MouseEvent ) =>
  {
    if( this.contextMenuOpen )
    {
      this.contextMenuOpen = false;
      evt.preventDefault();
      return;
    }
    if (evt.button === 0) {
      // Enable clicking of links in presentation mode. Note: only links
      // pointing to destinations in the current PDF document work.
      const isInternalLink =
        (<any>evt.target).href && (<Element>evt.target).classList.contains("internalLink");
      if( !isInternalLink )
      {
        // Unless an internal link was clicked, advance one page.
        evt.preventDefault();

        if (evt.shiftKey) {
          this.pdfViewer.previousPage();
        } 
        else {
          this.pdfViewer.nextPage();
        }
      }
    }
  }

  #contextMenu = () =>
  {
    this.contextMenuOpen = true;
  }

  #showControls = () =>
  {
    if( this.controlsTimeout )
    {
      clearTimeout(this.controlsTimeout);
    } 
    else {
      this.container.classList.add(CONTROLS_SELECTOR);
    }
    this.controlsTimeout = setTimeout(() => {
      this.container.classList.remove(CONTROLS_SELECTOR);
      delete this.controlsTimeout;
    }, DELAY_BEFORE_HIDING_CONTROLS);
  }

  #hideControls = () =>
  {
    if( !this.controlsTimeout ) return;

    clearTimeout(this.controlsTimeout);
    this.container.classList.remove(CONTROLS_SELECTOR);
    delete this.controlsTimeout;
  }

  /**
   * Resets the properties used for tracking mouse scrolling events.
   */
  #resetMouseScrollState = () =>
  {
    this.mouseScrollTimeStamp = 0;
    this.mouseScrollDelta = 0;
  }

  #touchSwipe = ( evt:TouchEvent ) =>
  {
    if (!this.active) {
      return;
    }
    if (evt.touches.length > 1) {
      // Multiple touch points detected; cancel the swipe.
      this.touchSwipeState = undefined;
      return;
    }

    switch (evt.type) {
      case "touchstart":
        this.touchSwipeState = {
          startX: evt.touches[0].pageX,
          startY: evt.touches[0].pageY,
          endX: evt.touches[0].pageX,
          endY: evt.touches[0].pageY,
        };
        break;
      case "touchmove":
        if (this.touchSwipeState === undefined) {
          return;
        }
        this.touchSwipeState.endX = evt.touches[0].pageX;
        this.touchSwipeState.endY = evt.touches[0].pageY;
        // Avoid the swipe from triggering browser gestures (Chrome in
        // particular has some sort of swipe gesture in fullscreen mode).
        evt.preventDefault();
        break;
      case "touchend":
        if( this.touchSwipeState === undefined ) return;

        let delta = 0;
        const dx = this.touchSwipeState.endX - this.touchSwipeState.startX;
        const dy = this.touchSwipeState.endY - this.touchSwipeState.startY;
        const absAngle = Math.abs(Math.atan2(dy, dx));
        if (
          Math.abs(dx) > SWIPE_MIN_DISTANCE_THRESHOLD &&
          (absAngle <= SWIPE_ANGLE_THRESHOLD ||
            absAngle >= Math.PI - SWIPE_ANGLE_THRESHOLD)
        ) {
          // Horizontal swipe.
          delta = dx;
        } 
        else if (
          Math.abs(dy) > SWIPE_MIN_DISTANCE_THRESHOLD &&
          Math.abs(absAngle - Math.PI / 2) <= SWIPE_ANGLE_THRESHOLD
        ) {
          // Vertical swipe.
          delta = dy;
        }
        if (delta > 0) {
          this.pdfViewer.previousPage();
        } 
        else if (delta < 0) {
          this.pdfViewer.nextPage();
        }
        break;
    }
  }

  #addWindowListeners = () =>
  {
    // this.showControlsBind = this.#showControls.bind(this);
    // this.mouseDownBind = this.#mouseDown.bind(this);
    // this.mouseWheelBind = this.#mouseWheel.bind(this);
    // this.resetMouseScrollStateBind = this.#resetMouseScrollState.bind(this);
    // this.contextMenuBind = this.#contextMenu.bind(this);
    // this.touchSwipeBind = this.#touchSwipe.bind(this);

    window.addEventListener("mousemove", this.#showControls);
    window.addEventListener("mousedown", this.#mouseDown);
    window.addEventListener("wheel", this.#mouseWheel, { passive: false });
    window.addEventListener("keydown", this.#resetMouseScrollState);
    window.addEventListener("contextmenu", this.#contextMenu);
    window.addEventListener("touchstart", this.#touchSwipe);
    window.addEventListener("touchmove", this.#touchSwipe);
    window.addEventListener("touchend", this.#touchSwipe);
  }

  #removeWindowListeners = () =>
  {
    window.removeEventListener("mousemove", this.#showControls);
    window.removeEventListener("mousedown", this.#mouseDown);
    window.removeEventListener("wheel", this.#mouseWheel);
    window.removeEventListener("keydown", this.#resetMouseScrollState);
    window.removeEventListener("contextmenu", this.#contextMenu);
    window.removeEventListener("touchstart", this.#touchSwipe);
    window.removeEventListener("touchmove", this.#touchSwipe);
    window.removeEventListener("touchend", this.#touchSwipe);

    delete (<any>this).showControlsBind;
    delete (<any>this).mouseDownBind;
    delete (<any>this).mouseWheelBind;
    delete (<any>this).resetMouseScrollStateBind;
    delete (<any>this).contextMenuBind;
    delete (<any>this).touchSwipeBind;
  }

  #fullscreenChange = () =>
  {
    if( /* isFullscreen = */ document.fullscreenElement )
    {
      this.#enter();
    } 
    else {
      this.#exit();
    }
  }

  #addFullscreenChangeListeners()
  {
    // this.fullscreenChangeBind = this._fullscreenChange.bind(this);

    window.addEventListener( "fullscreenchange", this.#fullscreenChange );
  }

  #removeFullscreenChangeListeners = () =>
  {
    window.removeEventListener( "fullscreenchange", this.#fullscreenChange );
    
    // delete this.fullscreenChangeBind;
  }
}
/*81---------------------------------------------------------------------------*/
