/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/secondary_toolbar.ts
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

import { GENERIC, PDFJSDev } from "@fe-src/global.ts";
import type { EventBus, EventMap } from "./event_utils.ts";
import { PagesCountLimit } from "./pdf_viewer.ts";
import {
  CursorTool,
  ScrollMode,
  SpreadMode,
  toggleCheckedBtn,
  toggleExpandedBtn,
} from "./ui_utils.ts";
import type { ViewerConfiguration } from "./viewer.ts";
import type { Anchor, Button } from "./alias.ts";
/*80--------------------------------------------------------------------------*/

export class SecondaryToolbar {
  #opts;
  //kkkk TOCLEANUP
  // toolbar: HTMLDivElement;
  // toggleButton: HTMLButtonElement;
  // buttons: (Button | Anchor)[];
  // items: {
  //   firstPage: HTMLButtonElement;
  //   lastPage: HTMLButtonElement;
  //   pageRotateCw: HTMLButtonElement;
  //   pageRotateCcw: HTMLButtonElement;
  // };

  mainContainer?: HTMLDivElement;
  eventBus: EventBus;

  opened = false;
  get isOpen(): boolean {
    return this.opened;
  }

  containerHeight?: number;
  previousContainerHeight?: number;

  pagesCount?: number;
  pageNumber?: number;

  constructor(
    options: ViewerConfiguration["secondaryToolbar"],
    eventBus: EventBus,
  ) {
    this.#opts = options;
    const buttons: (Button | Anchor)[] = [
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
    /*#static*/ if (PDFJSDev || GENERIC) {
      buttons.push({
        element: options.openFileButton!,
        eventName: "openfile",
        close: true,
      });
    }
    //kkkk TOCLEANUP
    // this.items = {
    //   firstPage: options.firstPageButton,
    //   lastPage: options.lastPageButton,
    //   pageRotateCw: options.pageRotateCwButton,
    //   pageRotateCcw: options.pageRotateCcwButton,
    // };

    this.eventBus = eventBus;
    this.opened = false;

    // Bind the event listeners for click, cursor tool, and scroll/spread mode
    // actions.
    this.#bindListeners(buttons);

    this.reset();
  }

  setPageNumber(pageNumber: number) {
    this.pageNumber = pageNumber;
    this.#updateUIState();
  }

  setPagesCount(pagesCount: number) {
    this.pagesCount = pagesCount;
    this.#updateUIState();
  }

  reset() {
    this.pageNumber = 0;
    this.pagesCount = 0;
    this.#updateUIState();

    // Reset the Scroll/Spread buttons too, since they're document specific.
    this.#scrollModeChanged({ mode: ScrollMode.VERTICAL });
    this.#spreadModeChanged({ mode: SpreadMode.NONE });
  }

  #updateUIState() {
    const {
      firstPageButton,
      lastPageButton,
      pageRotateCwButton,
      pageRotateCcwButton,
    } = this.#opts;

    firstPageButton.disabled = this.pageNumber! <= 1;
    lastPageButton.disabled = this.pageNumber! >= this.pagesCount!;
    pageRotateCwButton.disabled = this.pagesCount === 0;
    pageRotateCcwButton.disabled = this.pagesCount === 0;
  }

  #bindListeners(buttons: (Button | Anchor)[]) {
    const { eventBus } = this;
    const { toggleButton } = this.#opts;
    // Button to toggle the visibility of the secondary toolbar.
    toggleButton.on("click", this.toggle.bind(this));

    // All items within the secondary toolbar.
    for (const { element, eventName, close, eventDetails } of buttons) {
      element.on("click", (evt) => {
        if (eventName !== undefined) {
          eventBus.dispatch(eventName, { source: this, ...eventDetails });
        }
        if (close) {
          this.close();
        }
        eventBus.dispatch("reporttelemetry", {
          source: this,
          details: {
            type: "buttons",
            data: { id: element.id },
          },
        });
      });
    }

    eventBus._on("cursortoolchanged", this.#cursorToolChanged.bind(this));
    eventBus._on("scrollmodechanged", this.#scrollModeChanged.bind(this));
    eventBus._on("spreadmodechanged", this.#spreadModeChanged.bind(this));
  }

  #cursorToolChanged({ tool }: EventMap["cursortoolchanged"]) {
    const { cursorSelectToolButton, cursorHandToolButton } = this.#opts;

    toggleCheckedBtn(cursorSelectToolButton, tool === CursorTool.SELECT);
    toggleCheckedBtn(cursorHandToolButton, tool === CursorTool.HAND);
  }

  #scrollModeChanged({ mode }: EventMap["scrollmodechanged"]) {
    const {
      scrollPageButton,
      scrollVerticalButton,
      scrollHorizontalButton,
      scrollWrappedButton,
      spreadNoneButton,
      spreadOddButton,
      spreadEvenButton,
    } = this.#opts;

    //kkkk TOCLEANUP
    // const isPage = mode === ScrollMode.PAGE,
    //   isVertical = mode === ScrollMode.VERTICAL,
    //   isHorizontal = mode === ScrollMode.HORIZONTAL,
    //   isWrapped = mode === ScrollMode.WRAPPED;

    toggleCheckedBtn(scrollPageButton, mode === ScrollMode.PAGE);
    toggleCheckedBtn(scrollVerticalButton, mode === ScrollMode.VERTICAL);
    toggleCheckedBtn(scrollHorizontalButton, mode === ScrollMode.HORIZONTAL);
    toggleCheckedBtn(scrollWrappedButton, mode === ScrollMode.WRAPPED);

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
    const isHorizontal = mode === ScrollMode.HORIZONTAL;
    spreadNoneButton.disabled = isHorizontal;
    spreadOddButton.disabled = isHorizontal;
    spreadEvenButton.disabled = isHorizontal;

    //kkkk TOCLEANUP
    // this.eventBus._on("scrollmodechanged", scrollModeChanged);

    // this.eventBus._on(
    //   "secondarytoolbarreset",
    //   (evt: EventMap["secondarytoolbarreset"]) => {
    //     if (evt.source === this) {
    //       scrollModeChanged({ mode: ScrollMode.VERTICAL });
    //     }
    //   },
    // );
  }

  #spreadModeChanged({ mode }: { mode: SpreadMode }) {
    const { spreadNoneButton, spreadOddButton, spreadEvenButton } = this.#opts;

    toggleCheckedBtn(spreadNoneButton, mode === SpreadMode.NONE);
    toggleCheckedBtn(spreadOddButton, mode === SpreadMode.ODD);
    toggleCheckedBtn(spreadEvenButton, mode === SpreadMode.EVEN);

    //kkkk TOCLEANUP
    // this.eventBus._on("spreadmodechanged", spreadModeChanged);

    // this.eventBus._on("secondarytoolbarreset", (evt) => {
    //   if (evt.source === this) {
    //     spreadModeChanged({ mode: SpreadMode.NONE });
    //   }
    // });
  }

  open() {
    if (this.opened) {
      return;
    }
    this.opened = true;

    const { toggleButton, toolbar } = this.#opts;
    toggleExpandedBtn(toggleButton, true, toolbar);
  }

  close() {
    if (!this.opened) {
      return;
    }
    this.opened = false;

    const { toggleButton, toolbar } = this.#opts;
    toggleExpandedBtn(toggleButton, false, toolbar);
  }

  toggle() {
    if (this.opened) {
      this.close();
    } else {
      this.open();
    }
  }
}
/*80--------------------------------------------------------------------------*/
