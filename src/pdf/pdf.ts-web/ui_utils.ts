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

import { type IVisibleView } from "./interfaces.js";
/*81---------------------------------------------------------------------------*/

export const DEFAULT_SCALE_VALUE = "auto";
export const DEFAULT_SCALE = 1.0;
export const DEFAULT_SCALE_DELTA = 1.1;
export const MIN_SCALE = 0.1;
export const MAX_SCALE = 10.0;
export const UNKNOWN_SCALE = 0;
export const MAX_AUTO_SCALE = 1.25;
export const SCROLLBAR_PADDING = 40;
export const VERTICAL_PADDING = 5;

const LOADINGBAR_END_OFFSET_VAR = "--loadingBar-end-offset";

export const enum RenderingStates {
  INITIAL = 0,
  RUNNING = 1,
  PAUSED = 2,
  FINISHED = 3,
}

export const enum PresentationModeState {
  UNKNOWN = 0,
  NORMAL = 1,
  CHANGING = 2,
  FULLSCREEN = 3,
}

export const enum SidebarView {
  UNKNOWN = -1,
  NONE = 0,
  THUMBS = 1, // Default value.
  OUTLINE = 2,
  ATTACHMENTS = 3,
  LAYERS = 4,
}

export const enum RendererType {
  CANVAS = "canvas",
  SVG = "svg",
}

export const enum TextLayerMode {
  DISABLE = 0,
  ENABLE = 1,
  ENABLE_ENHANCE = 2,
}

export enum ScrollMode {
  UNKNOWN = -1,
  VERTICAL = 0, // Default value.
  HORIZONTAL = 1,
  WRAPPED = 2,
  PAGE = 3,
}

export enum SpreadMode {
  UNKNOWN = -1,
  NONE = 0, // Default value.
  ODD = 1,
  EVEN = 2,
}

export const enum PageMode {
  UseNone = 1, //!
  UseOutlines,
  UseThumbs,
  FullScreen,
  UseOC,
  UseAttachments,
}

export const enum PageLayout {
  SinglePage = 1, //!
  OneColumn,
  TwoColumnLeft,
  TwoColumnRight,
  TwoPageLeft,
  TwoPageRight,
}

/**
 * Used by `PDFViewerApplication`, and by the API unit-tests.
 */
export const AutoPrintRegExp = /\bprint\s*\(/;

// Replaces {{arguments}} with their values.
function xxxx_formatL10nValue( text:string, args:Record<string,string> | null )
{
  if (!args) {
    return text;
  }
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (all, name) => {
    return name in args ? args[name] : `{{${name}}}`;
  });
}

export interface OutputScale
{
  sx:number;
  sy:number;
  scaled:boolean;
}

/**
 * Returns scale factor for the canvas. It makes sense for the HiDPI displays.
 * @return The object with horizontal (sx) and vertical (sy)
 *  scales. The scaled property is set to false if scaling is
 *  not required, true otherwise.
 */
export function getOutputScale( ctx:CanvasRenderingContext2D ):OutputScale 
{
  const devicePixelRatio = globalThis.devicePixelRatio || 1;
  const backingStoreRatio =
    (<any>ctx).webkitBackingStorePixelRatio ||
    (<any>ctx).mozBackingStorePixelRatio ||
    (<any>ctx).backingStorePixelRatio ||
    1;
  const pixelRatio = devicePixelRatio / backingStoreRatio;
  return {
    sx: pixelRatio,
    sy: pixelRatio,
    scaled: pixelRatio !== 1,
  };
}

/**
 * Scrolls specified element into view of its parent.
 * @param element The element to be visible.
 * @param spot An object with optional top and left properties,
 *   specifying the offset from the top left edge.
 * @param scrollMatches When scrolling search results into view,
 *   ignore elements that either: Contains marked content identifiers,
 *   or have the CSS-rule `overflow: hidden;` set. The default value is `false`.
 */
export function scrollIntoView( element:HTMLElement, 
  spot?:{top?:number;left?:number;}, scrollMatches=false
) {
  // Assuming offsetParent is available (it's not available when viewer is in
  // hidden iframe or object). We have to scroll: if the offsetParent is not set
  // producing the error. See also animationStarted.
  let parent = <HTMLElement|null>element.offsetParent;
  if (!parent) 
  {
    console.error("offsetParent is not set -- cannot scroll");
    return;
  }
  let offsetY = element.offsetTop + element.clientTop;
  let offsetX = element.offsetLeft + element.clientLeft;
  while( (parent.clientHeight === parent.scrollHeight
       && parent.clientWidth === parent.scrollWidth)
   || 
   (scrollMatches &&
    (parent.classList.contains("markedContent") ||
      getComputedStyle(parent).overflow === "hidden"))
  ) {
    offsetY += parent.offsetTop;
    offsetX += parent.offsetLeft;

    parent = <HTMLElement|null>parent.offsetParent;
    if( !parent ) return; // no need to scroll
  }
  if (spot) 
  {
    if (spot.top !== undefined) 
    {
      offsetY += spot.top;
    }
    if (spot.left !== undefined) 
    {
      offsetX += spot.left;
      parent.scrollLeft = offsetX;
    }
  }
  parent.scrollTop = offsetY;
}

/**
 * Helper function to start monitoring the scroll event and converting them into
 * PDF.js friendly one: with scroll debounce and scroll direction.
 */
export function watchScroll( viewAreaElement:HTMLDivElement, callback:(state?:unknown)=>void ) 
{
  const debounceScroll = function (evt:unknown) {
    if (rAF) {
      return;
    }
    // schedule an invocation of scroll for next animation frame.
    rAF = globalThis.requestAnimationFrame(function viewAreaElementScrolled() {
      rAF = null;

      const currentX = viewAreaElement.scrollLeft;
      const lastX = state.lastX;
      if (currentX !== lastX) {
        state.right = currentX > lastX;
      }
      state.lastX = currentX;
      const currentY = viewAreaElement.scrollTop;
      const lastY = state.lastY;
      if (currentY !== lastY) {
        state.down = currentY > lastY;
      }
      state.lastY = currentY;
      callback(state);
    });
  };

  const state = {
    right: true,
    down: true,
    lastX: viewAreaElement.scrollLeft,
    lastY: viewAreaElement.scrollTop,
    _eventHandler: debounceScroll,
  };

  let rAF:number | null = null;
  viewAreaElement.addEventListener("scroll", debounceScroll, true);
  return state;
}

/**
 * Helper function to parse query string (e.g. ?param1=value&param2=...).
 */
export function parseQueryString( query:string )
{
  const params = new Map<string, string>();
  for( const [key, value] of new URLSearchParams(query) )
  {
    params.set(key.toLowerCase(), value);
  }
  return params;
}

/**
 * Use binary search to find the index of the first item in a given array which
 * passes a given condition. The items are expected to be sorted in the sense
 * that if the condition is true for one item in the array, then it is also true
 * for all following items.
 *
 * @return Index of the first array element to pass the test,
 *  or |items.length| if no such element exists.
 */
export function binarySearchFirstItem< T >( items:T[], condition:(view:T)=>boolean ):number 
{
  let minIndex = 0;
  let maxIndex = items.length - 1;

  if (maxIndex < 0 || !condition(items[maxIndex])) {
    return items.length;
  }
  if (condition(items[minIndex])) {
    return minIndex;
  }

  while (minIndex < maxIndex) {
    const currentIndex = (minIndex + maxIndex) >> 1;
    const currentItem = items[currentIndex];
    if (condition(currentItem)) {
      maxIndex = currentIndex;
    } 
    else {
      minIndex = currentIndex + 1;
    }
  }
  return minIndex; /* === maxIndex */
}

/**
 * Approximates float number as a fraction using Farey sequence (max order
 * of 8).
 * @param x Positive float number.
 * @return Estimated fraction: the first array item is a numerator,
 *  the second one is a denominator.
 */
export function approximateFraction( x:number ):[number,number]
{
  // Fast paths for int numbers or their inversions.
  if (Math.floor(x) === x) {
    return [x, 1];
  }
  const xinv = 1 / x;
  const limit = 8;
  if (xinv > limit) {
    return [1, limit];
  } 
  else if (Math.floor(xinv) === xinv) {
    return [1, xinv];
  }

  const x_ = x > 1 ? xinv : x;
  // a/b and c/d are neighbours in Farey sequence.
  let a = 0,
    b = 1,
    c = 1,
    d = 1;
  // Limiting search to order 8.
  while (true) {
    // Generating next term in sequence (order of q).
    const p = a + c,
      q = b + d;
    if (q > limit) {
      break;
    }
    if (x_ <= p / q) {
      c = p;
      d = q;
    } 
    else {
      a = p;
      b = q;
    }
  }
  let result:[number,number];
  // Select closest of the neighbours to x.
  if (x_ - a / b < c / d - x_) {
    result = x_ === x ? [a, b] : [b, a];
  } 
  else {
    result = x_ === x ? [c, d] : [d, c];
  }
  return result;
}

export function roundToDivide( x:number, div:number ) 
{
  const r = x % div;
  return r === 0 ? x : Math.round(x - r + div);
}

interface GetPageSizeInchesParms
{
  view:number[];
  userUnit:number;
  rotate:number;
}

interface PageSize
{
  /**
   * In inches.
   */
  width:number;
  /**
   * In inches.
   */
  height:number;
}

/**
 * Gets the size of the specified page, converted from PDF units to inches.
 * @param - An Object containing the properties: {Array} `view`,
 *   {number} `userUnit`, and {number} `rotate`.
 * @return An Object containing the properties: {number} `width`
 *   and {number} `height`, given in inches.
 */
export function getPageSizeInches({ view, userUnit, rotate }:GetPageSizeInchesParms 
):PageSize {
  const [x1, y1, x2, y2] = view;
  // We need to take the page rotation into account as well.
  const changeOrientation = rotate % 180 !== 0;

  const width = ((x2 - x1) / 72) * userUnit;
  const height = ((y2 - y1) / 72) * userUnit;

  return {
    width: changeOrientation ? height : width,
    height: changeOrientation ? width : height,
  };
}

/**
 * Helper function for getVisibleElements.
 * 
 * only exported for testing
 *
 * @param index initial guess at the first visible element
 * @param views array of pages, into which `index` is an index
 * @param top the top of the scroll pane
 * @return less than or equal to `index` that is definitely at or
 *   before the first visible element in `views`, but not by too much. (Usually,
 *   this will be the first element in the first partially visible row in
 *   `views`, although sometimes it goes back one row further.)
 */
export function backtrackBeforeAllVisibleElements( 
  index:number, views:IVisibleView[], top:number 
):number {
  // binarySearchFirstItem's assumption is that the input is ordered, with only
  // one index where the conditions flips from false to true: [false ...,
  // true...]. With vertical scrolling and spreads, it is possible to have
  // [false ..., true, false, true ...]. With wrapped scrolling we can have a
  // similar sequence, with many more mixed true and false in the middle.
  //
  // So there is no guarantee that the binary search yields the index of the
  // first visible element. It could have been any of the other visible elements
  // that were preceded by a hidden element.

  // Of course, if either this element or the previous (hidden) element is also
  // the first element, there's nothing to worry about.
  if (index < 2) {
    return index;
  }

  // That aside, the possible cases are represented below.
  //
  //     ****  = fully hidden
  //     A*B*  = mix of partially visible and/or hidden pages
  //     CDEF  = fully visible
  //
  // (1) Binary search could have returned A, in which case we can stop.
  // (2) Binary search could also have returned B, in which case we need to
  // check the whole row.
  // (3) Binary search could also have returned C, in which case we need to
  // check the whole previous row.
  //
  // There's one other possibility:
  //
  //     ****  = fully hidden
  //     ABCD  = mix of fully and/or partially visible pages
  //
  // (4) Binary search could only have returned A.

  // Initially assume that we need to find the beginning of the current row
  // (case 1, 2, or 4), which means finding a page that is above the current
  // page's top. If the found page is partially visible, we're definitely not in
  // case 3, and this assumption is correct.
  let elt = views[index].div;
  let pageTop = elt.offsetTop + elt.clientTop;

  if (pageTop >= top) {
    // The found page is fully visible, so we're actually either in case 3 or 4,
    // and unfortunately we can't tell the difference between them without
    // scanning the entire previous row, so we just conservatively assume that
    // we do need to backtrack to that row. In both cases, the previous page is
    // in the previous row, so use its top instead.
    elt = views[index - 1].div;
    pageTop = elt.offsetTop + elt.clientTop;
  }

  // Now we backtrack to the first page that still has its bottom below
  // `pageTop`, which is the top of a page in the first visible row (unless
  // we're in case 4, in which case it's the row before that).
  // `index` is found by binary search, so the page at `index - 1` is
  // invisible and we can start looking for potentially visible pages from
  // `index - 2`. (However, if this loop terminates on its first iteration,
  // which is the case when pages are stacked vertically, `index` should remain
  // unchanged, so we use a distinct loop variable.)
  for (let i = index - 2; i >= 0; --i) {
    elt = views[i].div;
    if (elt.offsetTop + elt.clientTop + elt.clientHeight <= pageTop) {
      // We have reached the previous row, so stop now.
      // This loop is expected to terminate relatively quickly because the
      // number of pages per row is expected to be small.
      break;
    }
    index = i;
  }
  return index;
}

export interface VisibleElement
{
  id:number;
  x:number;
  y:number
  view:IVisibleView;
  percent?:number;
  widthPercent?:number;
}
export interface VisibleElements
{
  first?:VisibleElement;
  last?:VisibleElement;
  views:VisibleElement[];
  ids?:Set<number>;
}

interface GetVisibleElementsParms
{
  /**
   * A container that can possibly scroll.
   */
  scrollEl:HTMLElement;

  /**
   * Objects with a `div` property that contains an
   * HTMLElement, which should all be descendants of `scrollEl` satisfying the
   * relevant layout assumptions.
   */
  views:IVisibleView[];

  /**
   * If `true`, the returned elements are
  l* sorted in descending order of the percent of their padding box that is
  l* visible. The default value is `false`.
   */
  sortByVisibility?:boolean;

  /**
   * If `true`, the elements are assumed to be
   * laid out horizontally instead of vertically. The default value is `false`.
   */
  horizontal?:boolean;

  /**
   * If `true`, the `scrollEl` container is assumed to
   * be in right-to-left mode. The default value is `false`.
   */
  rtl?:boolean;
}

/**
 * Generic helper to find out what elements are visible within a scroll pane.
 *
 * Well, pretty generic. There are some assumptions placed on the elements
 * referenced by `views`:
 *   - If `horizontal`, no left of any earlier element is to the right of the
 *     left of any later element.
 *   - Otherwise, `views` can be split into contiguous rows where, within a row,
 *     no top of any element is below the bottom of any other element, and
 *     between rows, no bottom of any element in an earlier row is below the
 *     top of any element in a later row.
 *
 * (Here, top, left, etc. all refer to the padding edge of the element in
 * question. For pages, that ends up being equivalent to the bounding box of the
 * rendering canvas. Earlier and later refer to index in `views`, not page
 * layout.)
 */
export function getVisibleElements({
  scrollEl,
  views,
  sortByVisibility=false,
  horizontal=false,
  rtl=false,
}:GetVisibleElementsParms ) {
  const top = scrollEl.scrollTop,
    bottom = top + scrollEl.clientHeight;
  const left = scrollEl.scrollLeft,
    right = left + scrollEl.clientWidth;

  // Throughout this "generic" function, comments will assume we're working with
  // PDF document pages, which is the most important and complex case. In this
  // case, the visible elements we're actually interested is the page canvas,
  // which is contained in a wrapper which adds no padding/border/margin, which
  // is itself contained in `view.div` which adds no padding (but does add a
  // border). So, as specified in this function's doc comment, this function
  // does all of its work on the padding edge of the provided views, starting at
  // offsetLeft/Top (which includes margin) and adding clientLeft/Top (which is
  // the border). Adding clientWidth/Height gets us the bottom-right corner of
  // the padding edge.
  function isElementBottomAfterViewTop( view:IVisibleView ) 
  {
    const element = view.div;
    const elementBottom =
      element.offsetTop + element.clientTop + element.clientHeight;
    return elementBottom > top;
  }
  function isElementNextAfterViewHorizontally( view:IVisibleView )
  {
    const element = view.div;
    const elementLeft = element.offsetLeft + element.clientLeft;
    const elementRight = elementLeft + element.clientWidth;
    return rtl ? elementLeft < right : elementRight > left;
  }

  const visible:VisibleElement[] = [],
    ids = new Set(),
    numViews = views.length;
  let firstVisibleElementInd = binarySearchFirstItem(
    views,
    horizontal
      ? isElementNextAfterViewHorizontally
      : isElementBottomAfterViewTop
  );

  // Please note the return value of the `binarySearchFirstItem` function when
  // no valid element is found (hence the `firstVisibleElementInd` check below).
  if( firstVisibleElementInd > 0
   && firstVisibleElementInd < numViews
   && !horizontal
  ) {
    // In wrapped scrolling (or vertical scrolling with spreads), with some page
    // sizes, isElementBottomAfterViewTop doesn't satisfy the binary search
    // condition: there can be pages with bottoms above the view top between
    // pages with bottoms below. This function detects and corrects that error;
    // see it for more comments.
    firstVisibleElementInd = backtrackBeforeAllVisibleElements(
      firstVisibleElementInd,
      views,
      top
    );
  }

  // lastEdge acts as a cutoff for us to stop looping, because we know all
  // subsequent pages will be hidden.
  //
  // When using wrapped scrolling or vertical scrolling with spreads, we can't
  // simply stop the first time we reach a page below the bottom of the view;
  // the tops of subsequent pages on the same row could still be visible. In
  // horizontal scrolling, we don't have that issue, so we can stop as soon as
  // we pass `right`, without needing the code below that handles the -1 case.
  let lastEdge = horizontal ? right : -1;

  for (let i = firstVisibleElementInd; i < numViews; i++) 
  {
    const view = views[i],
      element = view.div;
    const currentWidth = element.offsetLeft + element.clientLeft;
    const currentHeight = element.offsetTop + element.clientTop;
    const viewWidth = element.clientWidth,
      viewHeight = element.clientHeight;
    const viewRight = currentWidth + viewWidth;
    const viewBottom = currentHeight + viewHeight;

    if (lastEdge === -1) 
    {
      // As commented above, this is only needed in non-horizontal cases.
      // Setting lastEdge to the bottom of the first page that is partially
      // visible ensures that the next page fully below lastEdge is on the
      // next row, which has to be fully hidden along with all subsequent rows.
      if (viewBottom >= bottom) 
      {
        lastEdge = viewBottom;
      }
    } 
    else if ((horizontal ? currentWidth : currentHeight) > lastEdge) 
    {
      break;
    }

    if( viewBottom <= top
     || currentHeight >= bottom
     || viewRight <= left
     || currentWidth >= right
    ) {
      continue;
    }

    const hiddenHeight =
      Math.max(0, top - currentHeight) + Math.max(0, viewBottom - bottom);
    const hiddenWidth =
      Math.max(0, left - currentWidth) + Math.max(0, viewRight - right);

    const fractionHeight = (viewHeight - hiddenHeight) / viewHeight,
      fractionWidth = (viewWidth - hiddenWidth) / viewWidth;
    const percent = (fractionHeight * fractionWidth * 100) | 0;

    visible.push({
      id: view.id,
      x: currentWidth,
      y: currentHeight,
      view,
      percent,
      widthPercent: (fractionWidth * 100) | 0,
    });
    ids.add(view.id);
  }

  const first = visible[0],
    last = visible[visible.length - 1];

  if (sortByVisibility) 
  {
    visible.sort(function (a, b) 
    {
      const pc = a.percent! - b.percent!;
      if( Math.abs(pc) > 0.001 ) return -pc;

      return a.id - b.id; // ensure stability
    });
  }
  return <VisibleElements>{ first, last, views: visible, ids };
}

/**
 * Event handler to suppress context menu.
 */
export function noContextMenuHandler( evt:Event ) 
{
  evt.preventDefault();
}

export function normalizeWheelEventDirection( evt:WheelEvent ) 
{
  let delta = Math.hypot(evt.deltaX, evt.deltaY);
  const angle = Math.atan2(evt.deltaY, evt.deltaX);
  if (-0.25 * Math.PI < angle && angle < 0.75 * Math.PI) 
  {
    // All that is left-up oriented has to change the sign.
    delta = -delta;
  }
  return delta;
}

export function normalizeWheelEventDelta( evt:WheelEvent )
{
  let delta = normalizeWheelEventDirection(evt);

  const MOUSE_DOM_DELTA_PIXEL_MODE = 0;
  const MOUSE_DOM_DELTA_LINE_MODE = 1;
  const MOUSE_PIXELS_PER_LINE = 30;
  const MOUSE_LINES_PER_PAGE = 30;

  // Converts delta to per-page units
  if (evt.deltaMode === MOUSE_DOM_DELTA_PIXEL_MODE) 
  {
    delta /= MOUSE_PIXELS_PER_LINE * MOUSE_LINES_PER_PAGE;
  } 
  else if (evt.deltaMode === MOUSE_DOM_DELTA_LINE_MODE) 
  {
    delta /= MOUSE_LINES_PER_PAGE;
  }
  return delta;
}

export function isValidRotation( angle:unknown ) 
{
  return Number.isInteger(angle) && <number>angle % 90 === 0;
}

export function isValidScrollMode( mode:unknown )
{
  return (
    Number.isInteger(mode) &&
    Object.values(ScrollMode).includes( <ScrollMode>mode ) &&
    mode !== ScrollMode.UNKNOWN
  );
}

export function isValidSpreadMode( mode:unknown ) 
{
  return (
    Number.isInteger(mode) &&
    Object.values(SpreadMode).includes( <SpreadMode>mode ) &&
    mode !== SpreadMode.UNKNOWN
  );
}

export function isPortraitOrientation( size:{width:number;height:number;} ) 
{
  return size.width <= size.height;
}

export const enum WaitOnType {
  EVENT = "event",
  TIMEOUT = "timeout",
}

/**
 * Promise that is resolved when DOM window becomes visible.
 */
export const animationStarted = new Promise( resolve => {
  // #if LIB
    if( typeof window === "undefined" )
    {
      // Prevent "ReferenceError: window is not defined" errors when running the
      // unit-tests in Node.js environments.
      setTimeout(resolve, 20);
      return;
    }
  // #endif
  globalThis.requestAnimationFrame(resolve);
});
/*64----------------------------------------------------------*/

export function clamp( v:number, min:number, max:number ) 
{
  return Math.min(Math.max(v, min), max);
}

export class ProgressBar 
{
  visible = true;

  div;
  bar;

  height:number;
  width:number;
  units:string

  _percent = 0;
  get percent() { return this._percent; }

  _indeterminate?:boolean;

  constructor( id:string, 
    { height, width, units }:{ height?:number; width?:number; units?:string }={} 
  ) {
    // Fetch the sub-elements for later.
    this.div = <HTMLDivElement>document.querySelector(id + " .progress");
    // Get the loading bar element, so it can be resized to fit the viewer.
    this.bar = <HTMLDivElement>this.div.parentNode;

    // Get options, with sensible defaults.
    this.height = height || 100;
    this.width = width || 100;
    this.units = units || "%";

    // Initialize heights.
    this.div.style.height = this.height + this.units;
  }

  _updateBar() {
    if (this._indeterminate) {
      this.div.classList.add("indeterminate");
      this.div.style.width = this.width + this.units;
      return;
    }

    this.div.classList.remove("indeterminate");
    const progressSize = (this.width * this._percent) / 100;
    this.div.style.width = progressSize + this.units;
  }

  set percent(val) {
    this._indeterminate = isNaN(val);
    this._percent = clamp(val, 0, 100);
    this._updateBar();
  }

  setWidth( viewer?:HTMLDivElement ) 
  {
    if (!viewer) {
      return;
    }
    const container = <HTMLElement>viewer.parentNode;
    const scrollbarWidth = container.offsetWidth - viewer.offsetWidth;
    if (scrollbarWidth > 0) {
      const doc = document.documentElement;
      doc.style.setProperty(LOADINGBAR_END_OFFSET_VAR, `${scrollbarWidth}px`);
    }
  }

  hide() {
    if (!this.visible) {
      return;
    }
    this.visible = false;
    this.bar.classList.add("hidden");
  }

  show() {
    if (this.visible) {
      return;
    }
    this.visible = true;
    this.bar.classList.remove("hidden");
  }
}

/**
 * Get the active or focused element in current DOM.
 *
 * Recursively search for the truly active or focused element in case there are
 * shadow DOMs.
 *
 * @return the truly active or focused element.
 */
export function getActiveOrFocusedElement() {
  let curRoot:Document | ShadowRoot = document;
  let curActiveOrFocused =
    curRoot.activeElement || curRoot.querySelector(":focus");

  while( curActiveOrFocused?.shadowRoot )
  {
    curRoot = curActiveOrFocused.shadowRoot;
    curActiveOrFocused =
      curRoot.activeElement || curRoot.querySelector(":focus");
  }

  return curActiveOrFocused;
}

/**
 * Converts API PageLayout values to the format used by `BaseViewer`.
 * NOTE: This is supported to the extent that the viewer implements the
 *       necessary Scroll/Spread modes (since SinglePage, TwoPageLeft,
 *       and TwoPageRight all suggests using non-continuous scrolling).
 * @param mode The API PageLayout value.
 * @return A value from {SpreadMode}.
 */
export function apiPageLayoutToViewerModes( layout:PageLayout )
{
  let scrollMode = ScrollMode.VERTICAL,
    spreadMode = SpreadMode.NONE;

  switch( layout )
  {
    case PageLayout.SinglePage: scrollMode = ScrollMode.PAGE; break;
    case PageLayout.OneColumn: break;
    case PageLayout.TwoPageLeft: scrollMode = ScrollMode.PAGE; /* falls through */
    case PageLayout.TwoColumnLeft: spreadMode = SpreadMode.ODD; break;
    case PageLayout.TwoPageRight: scrollMode = ScrollMode.PAGE; /* falls through */
    case PageLayout.TwoColumnRight: spreadMode = SpreadMode.EVEN; break;
  }
  return { scrollMode, spreadMode };
}

/**
 * Converts API PageMode values to the format used by `PDFSidebar`.
 * NOTE: There's also a "FullScreen" parameter which is not possible to support,
 *       since the Fullscreen API used in browsers requires that entering
 *       fullscreen mode only occurs as a result of a user-initiated event.
 * @param mode The API PageMode value.
 * @return A value from {SidebarView}.
 */
export function apiPageModeToSidebarView( mode:PageMode )
{
  switch( mode )
  {
    case PageMode.UseNone: return SidebarView.NONE;
    case PageMode.UseThumbs: return SidebarView.THUMBS;
    case PageMode.UseOutlines: return SidebarView.OUTLINE;
    case PageMode.UseAttachments: return SidebarView.ATTACHMENTS;
    case PageMode.UseOC: return SidebarView.LAYERS;
  }
  return SidebarView.NONE; // Default value.
}
/*81---------------------------------------------------------------------------*/
