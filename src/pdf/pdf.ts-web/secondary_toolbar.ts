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

import { PagesCountLimit } from "./base_viewer.js";
import { EventBus, EventMap } from "./event_utils.js";
import { CursorTool } from "./pdf_cursor_tools.js";
import { ScrollMode, SpreadMode } from "./ui_utils.js";
import { type ViewerConfiguration } from "./viewer.js";
/*81---------------------------------------------------------------------------*/

interface Anchor
{
  element:HTMLAnchorElement;
  eventName?:undefined;
  close:boolean;
  eventDetails?:undefined;
}

type ButtonEventName =
  | "documentproperties"
  | "download"
  | "firstpage"
  | "lastpage"
  | "openfile"
  | "presentationmode"
  | "print"
  | "rotatecw"
  | "rotateccw"
  | "switchscrollmode"
  | "switchcursortool"
  | "switchspreadmode"
;
interface Button
{
  element:HTMLButtonElement;
  eventName:ButtonEventName;
  close:boolean;
  eventDetails?:{
    tool?:CursorTool;
    mode?:ScrollMode | SpreadMode;
  }
}

export class SecondaryToolbar 
{
  toolbar:HTMLDivElement;
  toggleButton:HTMLButtonElement;
  buttons:( Button | Anchor )[];
  items:{
    firstPage:HTMLButtonElement;
    lastPage:HTMLButtonElement;
    pageRotateCw:HTMLButtonElement;
    pageRotateCcw:HTMLButtonElement;
  };

  mainContainer?:HTMLDivElement;
  eventBus:EventBus;

  opened = false;
  containerHeight?:number;
  previousContainerHeight?:number;

  pagesCount?:number;
  pageNumber?:number;

  constructor( 
    options:ViewerConfiguration["secondaryToolbar"], eventBus:EventBus )
  {
    this.toolbar = options.toolbar;
    this.toggleButton = options.toggleButton;
    this.buttons = [
      {
        element: options.presentationModeButton,
        eventName: "presentationmode",
        close: true,
      },
      { element: options.printButton, eventName: "print", close: true },
      { element: options.downloadButton, eventName: "download", close: true },
      { element: options.viewBookmarkButton, close: true },
      { element: options.firstPageButton, eventName: "firstpage", close: true },
      { element: options.lastPageButton, eventName: "lastpage", close: true },
      {
        element: options.pageRotateCwButton,
        eventName: "rotatecw",
        close: false,
      },
      {
        element: options.pageRotateCcwButton,
        eventName: "rotateccw",
        close: false,
      },
      {
        element: options.cursorSelectToolButton,
        eventName: "switchcursortool",
        eventDetails: { tool: CursorTool.SELECT },
        close: true,
      },
      {
        element: options.cursorHandToolButton,
        eventName: "switchcursortool",
        eventDetails: { tool: CursorTool.HAND },
        close: true,
      },
      {
        element: options.scrollPageButton,
        eventName: "switchscrollmode",
        eventDetails: { mode: ScrollMode.PAGE },
        close: true,
      },
      {
        element: options.scrollVerticalButton,
        eventName: "switchscrollmode",
        eventDetails: { mode: ScrollMode.VERTICAL },
        close: true,
      },
      {
        element: options.scrollHorizontalButton,
        eventName: "switchscrollmode",
        eventDetails: { mode: ScrollMode.HORIZONTAL },
        close: true,
      },
      {
        element: options.scrollWrappedButton,
        eventName: "switchscrollmode",
        eventDetails: { mode: ScrollMode.WRAPPED },
        close: true,
      },
      {
        element: options.spreadNoneButton,
        eventName: "switchspreadmode",
        eventDetails: { mode: SpreadMode.NONE },
        close: true,
      },
      {
        element: options.spreadOddButton,
        eventName: "switchspreadmode",
        eventDetails: { mode: SpreadMode.ODD },
        close: true,
      },
      {
        element: options.spreadEvenButton,
        eventName: "switchspreadmode",
        eventDetails: { mode: SpreadMode.EVEN },
        close: true,
      },
      {
        element: options.documentPropertiesButton,
        eventName: "documentproperties",
        close: true,
      },
    ];
    // #if GENERIC
      this.buttons.push({
        element: options.openFileButton,
        eventName: "openfile",
        close: true,
      });
    // #endif
    this.items = {
      firstPage: options.firstPageButton,
      lastPage: options.lastPageButton,
      pageRotateCw: options.pageRotateCwButton,
      pageRotateCcw: options.pageRotateCcwButton,
    };

    this.eventBus = eventBus;

    this.reset();

    // Bind the event listeners for click, cursor tool, and scroll/spread mode
    // actions.
    this.#bindClickListeners();
    this.#bindCursorToolsListener(options);
    this.#bindScrollModeListener(options);
    this.#bindSpreadModeListener(options);
  }

  get isOpen():boolean 
  {
    return this.opened;
  }

  setPageNumber( pageNumber:number )
  {
    this.pageNumber = pageNumber;
    this.#updateUIState();
  }

  setPagesCount( pagesCount:number )
  {
    this.pagesCount = pagesCount;
    this.#updateUIState();
  }

  reset()
  {
    this.pageNumber = 0;
    this.pagesCount = 0;
    this.#updateUIState();

    // Reset the Scroll/Spread buttons too, since they're document specific.
    this.eventBus.dispatch("secondarytoolbarreset", { source: this });
  }

  #updateUIState()
  {
    this.items.firstPage.disabled = this.pageNumber! <= 1;
    this.items.lastPage.disabled = this.pageNumber! >= this.pagesCount!;
    this.items.pageRotateCw.disabled = this.pagesCount === 0;
    this.items.pageRotateCcw.disabled = this.pagesCount === 0;
  }

  #bindClickListeners()
  {
    // Button to toggle the visibility of the secondary toolbar.
    this.toggleButton.addEventListener("click", this.toggle.bind(this));

    // All items within the secondary toolbar.
    for( const { element, eventName, close, eventDetails } of this.buttons )
    {
      element.addEventListener("click", ( evt:unknown ) => {
        if( eventName !== undefined )
        {
          const details = { source: this };
          for( const property in eventDetails )
          {
            (<any>details)[property] = (<any>eventDetails)[property];
          }
          this.eventBus.dispatch(eventName, details);
        }
        if (close) {
          this.close();
        }
      });
    }
  }

  #bindCursorToolsListener({ 
    cursorSelectToolButton, 
    cursorHandToolButton 
  }:ViewerConfiguration['secondaryToolbar'])
  {
    this.eventBus._on("cursortoolchanged", function ({ tool }) {
      const isSelect = tool === CursorTool.SELECT,
        isHand = tool === CursorTool.HAND;

      cursorSelectToolButton.classList.toggle("toggled", isSelect);
      cursorHandToolButton.classList.toggle("toggled", isHand);

      cursorSelectToolButton.setAttribute("aria-checked", <any>isSelect);
      cursorHandToolButton.setAttribute("aria-checked", <any>isHand);
    });
  }

  #bindScrollModeListener({
    scrollPageButton,
    scrollVerticalButton,
    scrollHorizontalButton,
    scrollWrappedButton,
    spreadNoneButton,
    spreadOddButton,
    spreadEvenButton,
  }:ViewerConfiguration['secondaryToolbar'])
  {
    const scrollModeChanged = ({ mode }:EventMap["scrollmodechanged"]) =>
    {
      const isPage = mode === ScrollMode.PAGE,
        isVertical = mode === ScrollMode.VERTICAL,
        isHorizontal = mode === ScrollMode.HORIZONTAL,
        isWrapped = mode === ScrollMode.WRAPPED;

      scrollPageButton.classList.toggle("toggled", isPage);
      scrollVerticalButton.classList.toggle("toggled", isVertical);
      scrollHorizontalButton.classList.toggle("toggled", isHorizontal);
      scrollWrappedButton.classList.toggle("toggled", isWrapped);

      scrollPageButton.setAttribute("aria-checked", <any>isPage);
      scrollVerticalButton.setAttribute("aria-checked", <any>isVertical);
      scrollHorizontalButton.setAttribute("aria-checked", <any>isHorizontal);
      scrollWrappedButton.setAttribute("aria-checked", <any>isWrapped);

      // Permanently *disable* the Scroll buttons when PAGE-scrolling is being
      // enforced for *very* long/large documents; please see the `BaseViewer`.
      const forceScrollModePage =
        this.pagesCount! > PagesCountLimit.FORCE_SCROLL_MODE_PAGE;
      scrollPageButton.disabled = forceScrollModePage;
      scrollVerticalButton.disabled = forceScrollModePage;
      scrollHorizontalButton.disabled = forceScrollModePage;
      scrollWrappedButton.disabled = forceScrollModePage;

      // Temporarily *disable* the Spread buttons when horizontal scrolling is
      // enabled, since the non-default Spread modes doesn't affect the layout.
      spreadNoneButton.disabled = isHorizontal;
      spreadOddButton.disabled = isHorizontal;
      spreadEvenButton.disabled = isHorizontal;
    }
    this.eventBus._on("scrollmodechanged", scrollModeChanged);

    this.eventBus._on("secondarytoolbarreset", ( evt:EventMap["secondarytoolbarreset"] ) => {
      if( evt.source === this )
      {
        scrollModeChanged({ mode: ScrollMode.VERTICAL });
      }
    });
  }

  #bindSpreadModeListener({
    spreadNoneButton,
    spreadOddButton,
    spreadEvenButton,
  }:ViewerConfiguration['secondaryToolbar'])
  {
    function spreadModeChanged({ mode }:{mode:SpreadMode} ) 
    {
      const isNone = mode === SpreadMode.NONE,
        isOdd = mode === SpreadMode.ODD,
        isEven = mode === SpreadMode.EVEN;

      spreadNoneButton.classList.toggle("toggled", isNone);
      spreadOddButton.classList.toggle("toggled", isOdd);
      spreadEvenButton.classList.toggle("toggled", isEven);

      spreadNoneButton.setAttribute("aria-checked", <any>isNone);
      spreadOddButton.setAttribute("aria-checked", <any>isOdd);
      spreadEvenButton.setAttribute("aria-checked", <any>isEven);
    }
    this.eventBus._on("spreadmodechanged", spreadModeChanged);

    this.eventBus._on("secondarytoolbarreset", evt => {
      if( evt.source === this )
      {
        spreadModeChanged({ mode: SpreadMode.NONE });
      }
    });
  }

  open()
  {
    if( this.opened ) 
      return;
    this.opened = true;
    this.toggleButton.classList.add("toggled");
    this.toggleButton.setAttribute("aria-expanded", "true");
    this.toolbar.classList.remove("hidden");
  }

  close()
  {
    if( !this.opened ) 
      return;
    this.opened = false;
    this.toolbar.classList.add("hidden");
    this.toggleButton.classList.remove("toggled");
    this.toggleButton.setAttribute("aria-expanded", "false");
  }

  toggle()
  {
    if( this.opened )
         this.close();
    else this.open();
  }
}
/*81---------------------------------------------------------------------------*/
