/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

/* Copyright 2016 Mozilla Foundation
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

import { noContextMenu } from "@fe-lib/util/general.ts";
import { AnnotationEditorType } from "../pdf.ts-src/pdf.ts";
import type { EventBus, EventMap, EventName } from "./event_utils.ts";
import {
  DEFAULT_SCALE,
  DEFAULT_SCALE_VALUE,
  MAX_SCALE,
  MIN_SCALE,
  toggleCheckedBtn,
} from "./ui_utils.ts";
import type { ViewerConfiguration } from "./viewer.ts";
/*80--------------------------------------------------------------------------*/

interface ToolbarButton {
  element: HTMLElement;
  eventName: EventName | null;
  eventDetails?: {
    mode: AnnotationEditorType;
  };
}

interface ToolbarItems {
  numPages: HTMLSpanElement;
  pageNumber: HTMLInputElement;
  scaleSelect: HTMLSelectElement;
  customScaleOption: HTMLOptionElement;
  previous: HTMLButtonElement;
  next: HTMLButtonElement;
  zoomIn: HTMLButtonElement;
  zoomOut: HTMLButtonElement;
}

export class Toolbar {
  toolbar;
  eventBus;
  buttons: ToolbarButton[];
  items: ToolbarItems;

  pageNumber!: number;
  pageLabel?: string | undefined;
  hasPageLabels!: boolean;
  pagesCount!: number;
  pageScaleValue!: string;
  pageScale!: number;

  constructor(options: ViewerConfiguration["toolbar"], eventBus: EventBus) {
    this.toolbar = options.container;
    this.eventBus = eventBus;
    this.buttons = [
      { element: options.previous, eventName: "previouspage" },
      { element: options.next, eventName: "nextpage" },
      { element: options.zoomIn, eventName: "zoomin" },
      { element: options.zoomOut, eventName: "zoomout" },
      { element: options.print, eventName: "print" },
      { element: options.download, eventName: "download" },
      {
        element: options.editorFreeTextButton,
        eventName: "switchannotationeditormode",
        eventDetails: {
          get mode() {
            const { classList } = options.editorFreeTextButton;
            return classList.contains("toggled")
              ? AnnotationEditorType.NONE
              : AnnotationEditorType.FREETEXT;
          },
        },
      },
      {
        element: options.editorInkButton,
        eventName: "switchannotationeditormode",
        eventDetails: {
          get mode() {
            const { classList } = options.editorInkButton;
            return classList.contains("toggled")
              ? AnnotationEditorType.NONE
              : AnnotationEditorType.INK;
          },
        },
      },
      {
        element: options.editorStampButton,
        eventName: "switchannotationeditormode",
        eventDetails: {
          get mode() {
            const { classList } = options.editorStampButton;
            return classList.contains("toggled")
              ? AnnotationEditorType.NONE
              : AnnotationEditorType.STAMP;
          },
        },
      },
    ];
    this.items = {
      numPages: options.numPages,
      pageNumber: options.pageNumber,
      scaleSelect: options.scaleSelect,
      customScaleOption: options.customScaleOption,
      previous: options.previous,
      next: options.next,
      zoomIn: options.zoomIn,
      zoomOut: options.zoomOut,
    };

    // Bind the event listeners for click and various other actions.
    this.#bindListeners(options);

    this.reset();
  }

  setPageNumber(pageNumber: number, pageLabel?: string) {
    this.pageNumber = pageNumber;
    this.pageLabel = pageLabel;
    this.#updateUIState(false);
  }

  setPagesCount(pagesCount: number, hasPageLabels: boolean) {
    this.pagesCount = pagesCount;
    this.hasPageLabels = hasPageLabels;
    this.#updateUIState(true);
  }

  setPageScale(pageScaleValue: string | number | undefined, pageScale: number) {
    this.pageScaleValue = (pageScaleValue || pageScale).toString();
    this.pageScale = pageScale;
    this.#updateUIState(false);
  }

  reset() {
    this.pageNumber = 0;
    this.pageLabel = undefined;
    this.hasPageLabels = false;
    this.pagesCount = 0;
    this.pageScaleValue = DEFAULT_SCALE_VALUE;
    this.pageScale = DEFAULT_SCALE;
    this.#updateUIState(true);
    this.updateLoadingIndicatorState();

    // Reset the Editor buttons too, since they're document specific.
    this.eventBus.dispatch("toolbarreset", { source: this });
  }

  #bindListeners(options: ViewerConfiguration["toolbar"]) {
    const { pageNumber, scaleSelect } = this.items;
    const self = this;

    // The buttons within the toolbar.
    for (const { element, eventName, eventDetails } of this.buttons) {
      element.on("click", (evt) => {
        if (eventName !== null) {
          this.eventBus.dispatch(eventName, {
            source: this,
            ...eventDetails,
            // evt.detail is the number of clicks.
            isFromKeyboard: evt.detail === 0,
          });
        }
      });
    }
    // The non-button elements within the toolbar.
    pageNumber.on("click", function (this: HTMLInputElement) {
      this.select();
    });
    pageNumber.on("change", function (this: HTMLInputElement) {
      self.eventBus.dispatch("pagenumberchanged", {
        source: self,
        value: this.value,
      });
    });

    scaleSelect.on("change", function (this: HTMLSelectElement) {
      if (this.value === "custom") return;

      self.eventBus.dispatch("scalechanged", {
        source: self,
        value: this.value,
      });
    });
    // Here we depend on browsers dispatching the "click" event *after* the
    // "change" event, when the <select>-element changes.
    scaleSelect.on("click", function (this: HTMLSelectElement, evt) {
      const target = evt.target;
      // Remove focus when an <option>-element was *clicked*, to improve the UX
      // for mouse users (fixes bug 1300525 and issue 4923).
      if (
        this.value === self.pageScaleValue &&
        (target as Element).tagName.toUpperCase() === "OPTION"
      ) {
        this.blur();
      }
    });
    // Suppress context menus for some controls.
    scaleSelect.oncontextmenu = noContextMenu;

    this.#bindEditorToolsListener(options);
  }

  #bindEditorToolsListener({
    editorFreeTextButton,
    editorFreeTextParamsToolbar,
    editorInkButton,
    editorInkParamsToolbar,
    editorStampButton,
    editorStampParamsToolbar,
  }: ViewerConfiguration["toolbar"]) {
    const editorModeChanged = (
      { mode }: EventMap["annotationeditormodechanged"],
    ) => {
      toggleCheckedBtn(
        editorFreeTextButton,
        mode === AnnotationEditorType.FREETEXT,
        editorFreeTextParamsToolbar,
      );
      toggleCheckedBtn(
        editorInkButton,
        mode === AnnotationEditorType.INK,
        editorInkParamsToolbar,
      );
      toggleCheckedBtn(
        editorStampButton,
        mode === AnnotationEditorType.STAMP,
        editorStampParamsToolbar,
      );

      const isDisable = mode === AnnotationEditorType.DISABLE;
      editorFreeTextButton.disabled = isDisable;
      editorInkButton.disabled = isDisable;
      editorStampButton.disabled = isDisable;
    };
    this.eventBus._on("annotationeditormodechanged", editorModeChanged);

    this.eventBus._on("toolbarreset", (evt) => {
      if (evt.source === this) {
        editorModeChanged(
          {
            mode: AnnotationEditorType.DISABLE,
          } as EventMap["annotationeditormodechanged"],
        );
      }
    });
  }

  #updateUIState = (resetNumPages = false) => {
    const { pageNumber, pagesCount, pageScaleValue, pageScale, items } = this;

    if (resetNumPages) {
      if (this.hasPageLabels) {
        items.pageNumber.type = "text";

        items.numPages.setAttribute("data-l10n-id", "pdfjs-page-of-pages");
      } else {
        items.pageNumber.type = "number";

        items.numPages.assignAttro({
          "data-l10n-id": "pdfjs-of-pages",
          "data-l10n-args": JSON.stringify({ pagesCount }),
        });
      }
      items.pageNumber.max = pagesCount as any;
    }

    if (this.hasPageLabels) {
      items.pageNumber.value = this.pageLabel!;

      items.numPages.setAttribute(
        "data-l10n-args",
        JSON.stringify({ pageNumber, pagesCount }),
      );
    } else {
      items.pageNumber.value = `${pageNumber}`;
    }

    items.previous.disabled = pageNumber <= 1;
    items.next.disabled = pageNumber >= pagesCount;

    items.zoomOut.disabled = pageScale <= MIN_SCALE;
    items.zoomIn.disabled = pageScale >= MAX_SCALE;

    let predefinedValueFound = false;
    const options = items.scaleSelect.options;
    for (let i = 0, LEN = options.length; i < LEN; ++i) { // for( const option of items.scaleSelect.options )
      if (options[i].value !== pageScaleValue) {
        options[i].selected = false;
        continue;
      }
      options[i].selected = true;
      predefinedValueFound = true;
    }
    if (!predefinedValueFound) {
      items.customScaleOption.selected = true;
      items.customScaleOption.setAttribute(
        "data-l10n-args",
        JSON.stringify({
          scale: Math.round(pageScale * 10000) / 100,
        }),
      );
    }
  };

  updateLoadingIndicatorState(loading = false) {
    const { pageNumber } = this.items;

    pageNumber.classList.toggle("loading", loading);
  }
}
/*80--------------------------------------------------------------------------*/
