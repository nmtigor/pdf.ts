/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
 */

/* Copyright 2013 Rob Wu <rob@robwu.nl>
 * https://github.com/Rob--W/grab-to-pan.js
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
/*81---------------------------------------------------------------------------*/

interface GrabToPanCtorParms
{
  element:HTMLDivElement;

  /**
   * See `ignoreTarget(node)`
   */
  ignoreTarget?:( node:Element ) => boolean;

  /**
   * Called
   * when grab-to-pan is (de)activated. The first argument is a boolean that
   * shows whether grab-to-pan is activated.
   */
  onActiveChanged?:(_:boolean) => unknown;
}
/**
 * 
 * @param options.element {Element}
 * @param options.ignoreTarget {function} optional. 
 * @param options.onActiveChanged {function(boolean)} optional. 
 *  
 *  
 */
export class GrabToPan
{
  element;
  document;

  onActiveChanged?:((_:boolean) => unknown) | undefined;

  overlay:HTMLDivElement;

  active?:boolean;

  scrollLeftStart?:number;
  scrollTopStart?:number;
  clientXStart?:number;
  clientYStart?:number;

  /**
   * Construct a GrabToPan instance for a given HTML element.
   */
  constructor( options:GrabToPanCtorParms )
  {
    this.element = options.element;
    this.document = options.element.ownerDocument;
    if (typeof options.ignoreTarget === "function") {
      this.ignoreTarget = options.ignoreTarget;
    }
    this.onActiveChanged = options.onActiveChanged;
    
    // This overlay will be inserted in the document when the mouse moves during
    // a grab operation, to ensure that the cursor has the desired appearance.
    const overlay = (this.overlay = html("div"));
    overlay.className = "grab-to-pan-grabbing";
  }

  /**
   * Class name of element which can be grabbed
   */
  readonly #CSS_CLASS_GRAB = "grab-to-pan-grab";

  /**
   * Bind a mousedown event to the element to enable grab-detection.
   */
  activate = () => 
  {
    if( !this.active )
    {
      this.active = true;
      this.element.addEventListener("mousedown", this.#onmousedown, true);
      this.element.classList.add(this.#CSS_CLASS_GRAB);
      if (this.onActiveChanged) {
        this.onActiveChanged(true);
      }
    }
  }

  /**
   * Removes all events. Any pending pan session is immediately stopped.
   */
  deactivate = () => 
  {
    if (this.active) {
      this.active = false;
      this.element.removeEventListener("mousedown", this.#onmousedown, true);
      this.#endPan();
      this.element.classList.remove(this.#CSS_CLASS_GRAB);
      if (this.onActiveChanged) {
        this.onActiveChanged(false);
      }
    }
  }

  toggle = () => 
  {
    if (this.active) {
      this.deactivate();
    }
    else {
      this.activate();
    }
  }

  /**
   * Whether to not pan if the target element is clicked.
   * Override this method to change the default behaviour.
   *
   * @param node The target of the event
   * @return Whether to not react to the click event.
   */
  ignoreTarget = ( node:Element ) => 
  {
    // Check whether the clicked element is, a child of, an input element/link.
    return node.matches(
      "a[href], a[href] *, input, textarea, button, button *, select, option"
    );
  }

  #onmousedown = ( event:MouseEvent ) => 
  {
    if( event.button !== 0 || this.ignoreTarget(<Element>event.target) )
      return;

    if( (<any>event).originalTarget )
    {
      try {
        // eslint-disable-next-line no-unused-expressions
        (<any>event).originalTarget.tagName;
      } catch (e) {
        // Mozilla-specific: element is a scrollbar (XUL element)
        return;
      }
    }

    this.scrollLeftStart = this.element.scrollLeft;
    this.scrollTopStart = this.element.scrollTop;
    this.clientXStart = event.clientX;
    this.clientYStart = event.clientY;
    this.document.addEventListener("mousemove", this.#onmousemove, true);
    this.document.addEventListener("mouseup", this.#endPan, true);
    // When a scroll event occurs before a mousemove, assume that the user
    // dragged a scrollbar (necessary for Opera Presto, Safari and IE)
    // (not needed for Chrome/Firefox)
    this.element.addEventListener("scroll", this.#endPan, true);
    event.preventDefault();
    event.stopPropagation();

    const focusedElement = <HTMLElement|null>document.activeElement;
    if( focusedElement && !focusedElement.contains(<Node|null>event.target) )
    {
      focusedElement.blur();
    }
  }

  #onmousemove = ( event:MouseEvent ) =>
  {
    this.element.removeEventListener("scroll", this.#endPan, true);
    if (isLeftMouseReleased(event)) {
      this.#endPan();
      return;
    }
    const xDiff = event.clientX - this.clientXStart!;
    const yDiff = event.clientY - this.clientYStart!;
    const scrollTop = this.scrollTopStart! - yDiff;
    const scrollLeft = this.scrollLeftStart! - xDiff;
    if( this.element.scrollTo )
    {
      this.element.scrollTo({
        top: scrollTop,
        left: scrollLeft,
        behavior: <ScrollBehavior>"instant",
      });
    }
    else {
      this.element.scrollTop = scrollTop;
      this.element.scrollLeft = scrollLeft;
    }
    if (!this.overlay.parentNode) {
      document.body.appendChild(this.overlay);
    }
  }

  #endPan = () =>
  {
    this.element.removeEventListener("scroll", this.#endPan, true);
    this.document.removeEventListener("mousemove", this.#onmousemove, true);
    this.document.removeEventListener("mouseup", this.#endPan, true);
    // Note: ChildNode.remove doesn't throw if the parentNode is undefined.
    this.overlay.remove();
  }
}

/**
 * Whether the left mouse is not pressed.
 * @return True if the left mouse button is not pressed,
 *  False if unsure or if the left mouse button is pressed.
 */
function isLeftMouseReleased( event:MouseEvent ) 
{
  if ("buttons" in event) {
    // http://www.w3.org/TR/DOM-Level-3-Events/#events-MouseEvent-buttons
    // Firefox 15+
    // Chrome 43+
    // Safari 11.1+
    return !(event.buttons & 1);
  }
  // #if !MOZCENTRAL
  // if (typeof PDFJSDev === "undefined" || !PDFJSDev.test("MOZCENTRAL")) {
  // Browser sniffing because it's impossible to feature-detect
  // whether event.which for onmousemove is reliable.
  const chrome = (<any>window).chrome;
  const isChrome15OrOpera15plus = chrome && (chrome.webstore || chrome.app);
  //                                         ^ Chrome 15+       ^ Opera 15+
  const isSafari6plus =
    /Apple/.test(navigator.vendor) &&
    /Version\/([6-9]\d*|[1-5]\d+)/.test(navigator.userAgent);

  if (isChrome15OrOpera15plus || isSafari6plus) {
    // Chrome 14+
    // Opera 15+
    // Safari 6.0+
    return event.which === 0;
  }
  // }
  // #endif
  return false;
}
/*81---------------------------------------------------------------------------*/
