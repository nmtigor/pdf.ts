/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

/* Copyright 2015 Mozilla Foundation
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

import { GENERIC } from "../../../global.ts";
import { html, span } from "../../../lib/dom.ts";
import { createPromiseCap } from "../../../lib/promisecap.ts";
import { AbortException, type matrix_t, Util } from "../shared/util.ts";
import {
  type TextContent,
  type TextItem,
  type TextMarkedContent,
  type TextStyle,
} from "./api.ts";
import { deprecated, PageViewport } from "./display_utils.ts";
/*80--------------------------------------------------------------------------*/

/**
 * Text layer render parameters.
 */
interface _TextLayerRenderP {
  /**
   * Text content to
   * render (the object is returned by the page's `getTextContent` method).
   */
  textContent?: TextContent | undefined;

  /**
   * Text content stream to
   * render (the stream is returned by the page's `streamTextContent` method).
   */
  textContentStream?: ReadableStream | undefined;

  /**
   * The DOM node that will contain the text runs.
   */
  container: DocumentFragment | HTMLElement;

  /**
   * The target viewport to properly layout the text runs.
   */
  viewport: PageViewport;

  /**
   * HTML elements that correspond to
   * the text items of the textContent input.
   * This is output and shall initially be set to an empty array.
   */
  textDivs?: HTMLSpanElement[];

  /**
   * Strings that correspond to
   * the `str` property of the text items of the textContent input.
   * This is output and shall initially be set to an empty array.
   */
  textContentItemsStr?: string[];

  /**
   * Delay in milliseconds before rendering of the text runs occurs.
   */
  timeout?: number;

  /**
   * Whether to turn on the text selection enhancement.
   */
  enhanceTextSelection?: boolean;
}

interface TextDivProps {
  angle: number;
  canvasWidth: number;
  fontSize: number;
  hasText: boolean;
  hasEOL: boolean;
  originalTransform?: string | undefined;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  scale?: number;
}

namespace Ns_renderTextLayer {
  const MAX_TEXT_DIVS_TO_RENDER = 100000;
  const DEFAULT_FONT_SIZE = 30;
  const DEFAULT_FONT_ASCENT = 0.8;
  const ascentCache = new Map();

  function getAscent(fontFamily: string, ctx: CanvasRenderingContext2D) {
    const cachedAscent = ascentCache.get(fontFamily);
    if (cachedAscent) return cachedAscent;

    ctx.save();
    ctx.font = `${DEFAULT_FONT_SIZE}px ${fontFamily}`;
    const metrics = ctx.measureText("");

    // Both properties aren't available by default in Firefox.
    let ascent = (<any> metrics).fontBoundingBoxAscent;
    let descent = Math.abs((<any> metrics).fontBoundingBoxDescent);
    if (ascent) {
      ctx.restore();
      const ratio = ascent / (ascent + descent);
      ascentCache.set(fontFamily, ratio);
      return ratio;
    }

    // Try basic heuristic to guess ascent/descent.
    // Draw a g with baseline at 0,0 and then get the line
    // number where a pixel has non-null red component (starting
    // from bottom).
    ctx.strokeStyle = "red";
    ctx.clearRect(0, 0, DEFAULT_FONT_SIZE, DEFAULT_FONT_SIZE);
    ctx.strokeText("g", 0, 0);
    let pixels = ctx.getImageData(
      0,
      0,
      DEFAULT_FONT_SIZE,
      DEFAULT_FONT_SIZE,
    ).data;
    descent = 0;
    for (let i = pixels.length - 1 - 3; i >= 0; i -= 4) {
      if (pixels[i] > 0) {
        descent = Math.ceil(i / 4 / DEFAULT_FONT_SIZE);
        break;
      }
    }

    // Draw an A with baseline at 0,DEFAULT_FONT_SIZE and then get the line
    // number where a pixel has non-null red component (starting
    // from top).
    ctx.clearRect(0, 0, DEFAULT_FONT_SIZE, DEFAULT_FONT_SIZE);
    ctx.strokeText("A", 0, DEFAULT_FONT_SIZE);
    pixels = ctx.getImageData(0, 0, DEFAULT_FONT_SIZE, DEFAULT_FONT_SIZE).data;
    ascent = 0;
    for (let i = 0, ii = pixels.length; i < ii; i += 4) {
      if (pixels[i] > 0) {
        ascent = DEFAULT_FONT_SIZE - Math.floor(i / 4 / DEFAULT_FONT_SIZE);
        break;
      }
    }

    ctx.restore();

    if (ascent) {
      const ratio = ascent / (ascent + descent);
      ascentCache.set(fontFamily, ratio);
      return ratio;
    }

    ascentCache.set(fontFamily, DEFAULT_FONT_ASCENT);
    return DEFAULT_FONT_ASCENT;
  }

  function appendText(
    task: TextLayerRenderTask,
    geom: TextItem,
    styles: Record<string, TextStyle>,
    ctx: CanvasRenderingContext2D,
  ) {
    // Initialize all used properties to keep the caches monomorphic.
    const textDiv = span();
    const textDivProperties = {
      angle: 0,
      canvasWidth: 0,
      hasText: geom.str !== "",
      hasEOL: geom.hasEOL,
      fontSize: 0,
    };
    task._textDivs.push(textDiv);

    const tx = Util.transform(task._viewport.transform, geom.transform!);
    let angle = Math.atan2(tx[1], tx[0]);
    const style = styles[geom.fontName!];
    if (style.vertical) {
      angle += Math.PI / 2;
    }
    const fontHeight = Math.hypot(tx[2], tx[3]);
    const fontAscent = fontHeight * getAscent(style.fontFamily, ctx);

    let left, top;
    if (angle === 0) {
      left = tx[4];
      top = tx[5] - fontAscent;
    } else {
      left = tx[4] + fontAscent * Math.sin(angle);
      top = tx[5] - fontAscent * Math.cos(angle);
    }
    // Setting the style properties individually, rather than all at once,
    // should be OK since the `textDiv` isn't appended to the document yet.
    textDiv.style.left = `${left}px`;
    textDiv.style.top = `${top}px`;
    textDiv.style.fontSize = `${fontHeight}px`;
    textDiv.style.fontFamily = style.fontFamily;

    textDivProperties.fontSize = fontHeight;

    // Keeps screen readers from pausing on every new text span.
    textDiv.setAttribute("role", "presentation");

    textDiv.textContent = geom.str;
    // geom.dir may be 'ttb' for vertical texts.
    textDiv.dir = geom.dir;

    // `fontName` is only used by the FontInspector, and we only use `dataset`
    // here to make the font name available in the debugger.
    if (task._fontInspectorEnabled) {
      textDiv.dataset.fontName = geom.fontName;
    }
    if (angle !== 0) {
      textDivProperties.angle = angle * (180 / Math.PI);
    }
    // We don't bother scaling single-char text divs, because it has very
    // little effect on text highlighting. This makes scrolling on docs with
    // lots of such divs a lot faster.
    let shouldScaleText = false;
    if (geom.str.length > 1) {
      shouldScaleText = true;
    } else if (geom.str !== " " && geom.transform![0] !== geom.transform![3]) {
      const absScaleX = Math.abs(geom.transform![0]),
        absScaleY = Math.abs(geom.transform![3]);
      // When the horizontal/vertical scaling differs significantly, also scale
      // even single-char text to improve highlighting (fixes issue11713.pdf).
      if (
        absScaleX !== absScaleY &&
        Math.max(absScaleX, absScaleY) / Math.min(absScaleX, absScaleY) > 1.5
      ) {
        shouldScaleText = true;
      }
    }
    if (shouldScaleText) {
      if (style.vertical) {
        textDivProperties.canvasWidth = geom.height * task._viewport.scale;
      } else {
        textDivProperties.canvasWidth = geom.width * task._viewport.scale;
      }
    }
    task._textDivProperties!.set(textDiv, textDivProperties);
    if (task._textContentStream) {
      task._layoutText(textDiv);
    }
  }

  function render(task: TextLayerRenderTask) {
    if (task._canceled) {
      return;
    }
    const textDivs = task._textDivs;
    const capability = task._capability;
    const textDivsLength = textDivs.length;

    // No point in rendering many divs as it would make the browser
    // unusable even after the divs are rendered.
    if (textDivsLength > MAX_TEXT_DIVS_TO_RENDER) {
      task._renderingDone = true;
      capability.resolve();
      return;
    }

    if (!task._textContentStream) {
      for (const textDiv of textDivs) {
        task._layoutText(textDiv);
      }
    }

    task._renderingDone = true;
    capability.resolve();
  }

  interface _TLRTCtorP {
    textContent?: TextContent | undefined;
    textContentStream?: ReadableStream | undefined;
    container: DocumentFragment | HTMLElement;
    viewport: PageViewport;
    textDivs?: HTMLSpanElement[] | undefined;
    textContentItemsStr?: string[] | undefined;
  }

  interface TLRTBound {
    left: number;
    top: number;
    right: number;
    bottom: number;
    div: HTMLSpanElement;
    size: [number, number];
    m?: matrix_t | undefined;
  }

  interface TLRTExBound {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    index: number;
    x1New?: number | undefined;
    x2New?: number | undefined;
  }

  /**
   * Text layer rendering task.
   */
  export class TextLayerRenderTask {
    _textContent?: TextContent | undefined;
    _textContentStream?: ReadableStream | undefined;
    _container: DocumentFragment | HTMLElement;
    _document: Document;
    _viewport: PageViewport;
    _textDivs: HTMLSpanElement[];
    _textContentItemsStr: string[];
    _fontInspectorEnabled: boolean;
    _devicePixelRatio;

    _reader?: ReadableStreamDefaultReader | undefined;
    _layoutTextLastFontSize: number | undefined;
    _layoutTextLastFontFamily: string | null = null;
    _layoutTextCtx: CanvasRenderingContext2D | null = null;
    _textDivProperties: WeakMap<HTMLSpanElement, TextDivProps> | undefined =
      new WeakMap();
    _renderingDone = false;
    _canceled = false;
    _capability = createPromiseCap();
    #renderTimer?: number | undefined;

    constructor({
      textContent,
      textContentStream,
      container,
      viewport,
      textDivs,
      textContentItemsStr,
    }: _TLRTCtorP) {
      this._textContent = textContent;
      this._textContentStream = textContentStream;
      this._container = container;
      this._document = container.ownerDocument;
      this._viewport = viewport;
      this._textDivs = textDivs || [];
      this._textContentItemsStr = textContentItemsStr || [];
      this._fontInspectorEnabled = !!(<any> globalThis).FontInspector?.enabled;
      this._devicePixelRatio = globalThis.devicePixelRatio || 1;

      // Always clean-up the temporary canvas once rendering is no longer pending.
      this._capability.promise
        .finally(() => {
          // The `textDiv` properties are no longer needed.
          this._textDivProperties = undefined;

          if (this._layoutTextCtx) {
            // Zeroing the width and height cause Firefox to release graphics
            // resources immediately, which can greatly reduce memory consumption.
            this._layoutTextCtx.canvas.width = 0;
            this._layoutTextCtx.canvas.height = 0;
            this._layoutTextCtx = null;
          }
        }).catch(() => {
          // Avoid "Uncaught promise" messages in the console.
        });
    }

    /**
     * Promise for textLayer rendering task completion.
     */
    get promise() {
      return this._capability.promise;
    }

    /**
     * Cancel rendering of the textLayer.
     */
    cancel() {
      this._canceled = true;
      if (this._reader) {
        this._reader
          .cancel(new AbortException("TextLayer task cancelled."))
          .catch(() => {
            // Avoid "Uncaught promise" messages in the console.
          });
        this._reader = undefined;
      }
      if (this.#renderTimer !== undefined) {
        clearTimeout(this.#renderTimer);
        this.#renderTimer = undefined;
      }
      this._capability.reject(new Error("TextLayer task cancelled."));
    }

    #processItems(
      items: (TextItem | TextMarkedContent)[],
      styleCache: Record<string, TextStyle>,
    ) {
      for (const item of items) {
        if ((item as TextItem).str === undefined) {
          if (
            (item as TextMarkedContent).type === "beginMarkedContentProps" ||
            (item as TextMarkedContent).type === "beginMarkedContent"
          ) {
            const parent = this._container;
            this._container = html("span");
            this._container.classList.add("markedContent");
            if ((item as TextMarkedContent).id !== undefined) {
              this._container.setAttribute(
                "id",
                `${(item as TextMarkedContent).id}`,
              );
            }
            parent.append(this._container);
          } else if (
            (item as TextMarkedContent).type === "endMarkedContent"
          ) {
            this._container = <HTMLElement | DocumentFragment> this._container
              .parentNode;
          }
          continue;
        }
        this._textContentItemsStr.push((item as TextItem).str);
        appendText(this, item as TextItem, styleCache, this._layoutTextCtx!);
      }
    }

    /**
     * @private
     */
    _layoutText(textDiv: HTMLSpanElement) {
      const textDivProperties = this._textDivProperties!.get(textDiv)!;

      let transform = "";
      if (textDivProperties.canvasWidth !== 0 && textDivProperties.hasText) {
        const { fontFamily } = textDiv.style;
        const { fontSize } = textDivProperties;

        // Only build font string and set to context if different from last.
        if (
          fontSize !== this._layoutTextLastFontSize ||
          fontFamily !== this._layoutTextLastFontFamily
        ) {
          this._layoutTextCtx!.font = `${
            fontSize * this._devicePixelRatio
          }px ${fontFamily}`;
          this._layoutTextLastFontSize = fontSize;
          this._layoutTextLastFontFamily = fontFamily;
        }
        // Only measure the width for multi-char text divs, see `appendText`.
        const { width } = this._layoutTextCtx!.measureText(
          textDiv.textContent!,
        );

        if (width > 0) {
          transform = `scaleX(${
            (this._devicePixelRatio * textDivProperties.canvasWidth) / width
          })`;
        }
      }
      if (textDivProperties.angle !== 0) {
        transform = `rotate(${textDivProperties.angle}deg) ${transform}`;
      }
      if (transform.length > 0) {
        textDiv.style.transform = transform;
      }

      if (textDivProperties.hasText) {
        this._container.append(textDiv);
      }
      if (textDivProperties.hasEOL) {
        const br = html("br");
        br.setAttribute("role", "presentation");
        this._container.append(br);
      }
    }

    /**
     * @private
     */
    _render(timeout?: number) {
      const capability = createPromiseCap();
      let styleCache = Object.create(null);

      // The temporary canvas is used to measure text length in the DOM.
      const canvas = html("canvas", undefined, this._document);
      canvas.height = canvas.width = DEFAULT_FONT_SIZE;

      this._layoutTextCtx = canvas.getContext("2d", { alpha: false });

      if (this._textContent) {
        const textItems = this._textContent.items;
        const textStyles = this._textContent.styles;
        this.#processItems(textItems, textStyles);
        capability.resolve();
      } else if (this._textContentStream) {
        const pump = () => {
          this._reader!.read().then(({ value, done }) => {
            if (done) {
              capability.resolve();
              return;
            }

            Object.assign(styleCache, value.styles);
            this.#processItems(value.items, styleCache);
            pump();
          }, capability.reject);
        };

        this._reader = this._textContentStream.getReader();
        pump();
      } else {
        throw new Error(
          'Neither "textContent" nor "textContentStream" parameters specified.',
        );
      }

      capability.promise.then(() => {
        styleCache = null;
        if (!timeout) {
          // Render right away
          render(this);
        } else {
          /*#static*/ if (!GENERIC) {
            throw new Error("The `timeout` parameter was removed.");
          }
          deprecated(
            "The TextLayerRender `timeout` parameter will be removed in the " +
              "future, since streaming of textContent has made it obsolete.",
          );

          // Schedule
          this.#renderTimer = setTimeout(() => {
            render(this);
            this.#renderTimer = undefined;
          }, timeout);
        }
      }, this._capability.reject);
    }
  }

  export function renderTextLayer(
    renderParameters: _TextLayerRenderP,
  ): TextLayerRenderTask {
    const task = new TextLayerRenderTask({
      textContent: renderParameters.textContent,
      textContentStream: renderParameters.textContentStream,
      container: renderParameters.container,
      viewport: renderParameters.viewport,
      textDivs: renderParameters.textDivs,
      textContentItemsStr: renderParameters.textContentItemsStr,
    });
    task._render(renderParameters.timeout);
    return task;
  }
}
export import TextLayerRenderTask = Ns_renderTextLayer.TextLayerRenderTask;
export import renderTextLayer = Ns_renderTextLayer.renderTextLayer;
/*80--------------------------------------------------------------------------*/
