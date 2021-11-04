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

// eslint-disable-next-line max-len
/** @typedef {import("./interfaces").IPDFTextLayerFactory} IPDFTextLayerFactory */

import { html } from "../../lib/dom.js";
import { TextContent } from "../pdf.ts-src/display/api.js";
import { PageViewport } from "../pdf.ts-src/display/display_utils.js";
import { TextLayerRenderTask } from "../pdf.ts-src/display/text_layer.js";
import { renderTextLayer } from "../pdf.ts-src/pdf.js";
import { IPDFTextLayerFactory } from "./interfaces.js";
import { TextHighlighter } from "./text_highlighter.js";
import { EventBus, EventMap } from "./ui_utils.js";
/*81---------------------------------------------------------------------------*/

const EXPAND_DIVS_TIMEOUT = 300; // ms

interface TextLayerBuilderOptions
{
  /**
   * The text layer container.
   */
  textLayerDiv:HTMLDivElement;

  /**
   * The application event bus.
   */
  eventBus:EventBus;

  /**
   * The page index.
   */
  pageIndex:number;

  /**
   * The viewport of the text layer.
   */
  viewport:PageViewport;

  /**
   * Optional object that will handle
   * highlighting text from the find controller.
   */
  highlighter:TextHighlighter | undefined;

  /**
   * Option to turn on improved text selection.
   */
  enhanceTextSelection?:boolean;
 }

interface TLBMBound
{
  divIdx:number;
  offset?:number;
}
interface TextLayerBuilderMatches
{
  begin:TLBMBound;
  end:TLBMBound;
}

/**
 * The text layer builder provides text selection functionality for the PDF.
 * It does this by creating overlay divs over the PDF's text. These divs
 * contain text that matches the PDF text they are overlaying.
 */
export class TextLayerBuilder 
{
  textLayerDiv;
  eventBus;
  textContent?:TextContent | undefined;
  textContentItemsStr:string[] = [];
  textContentStream?:ReadableStream;
  renderingDone = false;
  pageNumber;
  matches:TextLayerBuilderMatches[] = [];
  viewport;
  textDivs:HTMLDivElement[] = [];
  textLayerRenderTask?:TextLayerRenderTask | undefined;
  highlighter;
  enhanceTextSelection;

  constructor({
    textLayerDiv,
    eventBus,
    pageIndex,
    viewport,
    highlighter,
    enhanceTextSelection=false,
  }:TextLayerBuilderOptions ) {
    this.textLayerDiv = textLayerDiv;
    this.eventBus = eventBus;
    this.pageNumber = pageIndex + 1;
    this.viewport = viewport;
    this.highlighter = highlighter;
    this.enhanceTextSelection = enhanceTextSelection;

    this.#bindMouse();
  }

  #finishRendering()
  {
    this.renderingDone = true;

    if (!this.enhanceTextSelection) 
    {
      const endOfContent = html("div");
      endOfContent.className = "endOfContent";
      this.textLayerDiv.appendChild(endOfContent);
    }

    this.eventBus.dispatch("textlayerrendered", {
      source: this,
      pageNumber: this.pageNumber,
      numTextDivs: this.textDivs.length,
    });
  }

  /**
   * Renders the text layer.
   *
   * @param timeout Wait for a specified amount of milliseconds before rendering.
   */
  render( timeout=0 ) 
  {
    if( !(this.textContent || this.textContentStream) || this.renderingDone )
      return;

    this.cancel();

    this.textDivs.length = 0;
    this.highlighter?.setTextMapping(this.textDivs, this.textContentItemsStr);

    const textLayerFrag = document.createDocumentFragment();
    this.textLayerRenderTask = renderTextLayer({
      textContent: this.textContent,
      textContentStream: this.textContentStream,
      container: textLayerFrag,
      viewport: this.viewport,
      textDivs: this.textDivs,
      textContentItemsStr: this.textContentItemsStr,
      timeout,
      enhanceTextSelection: this.enhanceTextSelection,
    });
    this.textLayerRenderTask.promise.then(
      () => {
        this.textLayerDiv.appendChild(textLayerFrag);
        this.#finishRendering();
        this.highlighter?.enable();
      },
      function (reason) {
        // Cancelled or failed to render text layer; skipping errors.
      }
    );
  }

  /**
   * Cancel rendering of the text layer.
   */
  cancel() 
  {
    if (this.textLayerRenderTask) 
    {
      this.textLayerRenderTask.cancel();
      this.textLayerRenderTask = undefined;
    }
    this.highlighter?.disable();
  }

  setTextContentStream( readableStream:ReadableStream ) 
  {
    this.cancel();
    this.textContentStream = readableStream;
  }

  setTextContent( textContent?:TextContent )
  {
    this.cancel();
    this.textContent = textContent;
  }

  /**
   * Improves text selection by adding an additional div where the mouse was
   * clicked. This reduces flickering of the content if the mouse is slowly
   * dragged up or down.
   */
  #bindMouse()
  {
    const div = this.textLayerDiv;
    let expandDivsTimer:number | undefined;

    div.addEventListener("mousedown", evt => {
      if (this.enhanceTextSelection && this.textLayerRenderTask) {
        this.textLayerRenderTask.expandTextDivs(true);
        // #if !MOZCENTRAL
        // if (
        //   (typeof PDFJSDev === "undefined" || !PDFJSDev.test("MOZCENTRAL")) &&
        //   expandDivsTimer
        // ) {
        if( expandDivsTimer )
        {
          clearTimeout(expandDivsTimer);
          expandDivsTimer = undefined;
        }
        // #endif
        return;
      }

      const end = div.querySelector< HTMLElement >(".endOfContent");
      if( !end ) return;

      // #if !MOZCENTRAL
        // On non-Firefox browsers, the selection will feel better if the height
        // of the `endOfContent` div is adjusted to start at mouse click
        // location. This avoids flickering when the selection moves up.
        // However it does not work when selection is started on empty space.
        let adjustTop = evt.target !== div;
        // #if GENERIC
          adjustTop =
            adjustTop &&
            window
              .getComputedStyle(end)
              .getPropertyValue("-moz-user-select") !== "none";
        // #endif
        if (adjustTop) 
        {
          const divBounds = div.getBoundingClientRect();
          const r = Math.max(0, (evt.pageY - divBounds.top) / divBounds.height);
          end.style.top = (r * 100).toFixed(2) + "%";
        }
      // #endif
      end.classList.add("active");
    });

    div.addEventListener("mouseup", () => {
      if (this.enhanceTextSelection && this.textLayerRenderTask) 
      {
        // #if !MOZCENTRAL
          expandDivsTimer = setTimeout(() => {
            if (this.textLayerRenderTask) {
              this.textLayerRenderTask.expandTextDivs(false);
            }
            expandDivsTimer = undefined;
          }, EXPAND_DIVS_TIMEOUT);
        // #else
          this.textLayerRenderTask.expandTextDivs(false);
        // #endif
        return;
      }

      const end = div.querySelector<HTMLElement>(".endOfContent");
      if( !end ) return;

      // #if !MOZCENTRAL
        end.style.top = "";
      // #endif
      end.classList.remove("active");
    });
  }
}

export class DefaultTextLayerFactory implements IPDFTextLayerFactory
{
  createTextLayerBuilder(
    textLayerDiv:HTMLDivElement,
    pageIndex:number,
    viewport:PageViewport,
    enhanceTextSelection=false,
    eventBus:EventBus,
    highlighter:TextHighlighter,
  ) {
    return new TextLayerBuilder({
      textLayerDiv,
      eventBus,
      pageIndex,
      viewport,
      highlighter,
      enhanceTextSelection,
    });
  }
}
/*81---------------------------------------------------------------------------*/
