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

/** @typedef {import("./display_utils").PageViewport} PageViewport */
/** @typedef {import("./api").TextContent} TextContent */

import { GENERIC, PDFJSDev, TESTING } from "../../../global.ts";
import type { C2D, OC2D } from "../../../lib/alias.ts";
import { html, span } from "../../../lib/dom.ts";
import { PromiseCap } from "../../../lib/util/PromiseCap.ts";
import {
  AbortException,
  FeatureTest,
  type matrix_t,
  Util,
} from "../shared/util.ts";
import type {
  TextContent,
  TextItem,
  TextMarkedContent,
  TextStyle,
} from "./api.ts";
import {
  deprecated,
  PageViewport,
  setLayerDimensions,
} from "./display_utils.ts";
/*80--------------------------------------------------------------------------*/

/**
 * Text layer render parameters.
 */
type TextLayerRenderP_ = {
  /**
   * Text content to
   * render, i.e. the value returned by the page's `streamTextContent` or
   * `getTextContent` method.
   */
  textContentSource: ReadableStream<TextContent> | TextContent;

  /**
   * The DOM node that will contain the text runs.
   */
  container: HTMLElement;

  /**
   * The target viewport to properly layout the text runs.
   */
  viewport: PageViewport;

  /**
   * HTML elements that correspond to
   * the text items of the textContent input.
   * This is output and shall initially be set to an empty array.
   */
  textDivs?: HTMLElement[];

  /**
   * Some properties
   * weakly mapped to the HTML elements used to render the text.
   */
  textDivProperties?: WeakMap<HTMLElement, TextDivProps>;

  /**
   * Strings that correspond to
   * the `str` property of the text items of the textContent input.
   * This is output and shall initially be set to an empty array.
   */
  textContentItemsStr?: string[];

  /**
   * true if we can use
   * OffscreenCanvas to measure string widths.
   */
  isOffscreenCanvasSupported?: boolean | undefined;
};

type TextLayerUpdateP_ = {
  /**
   * The DOM node that will contain the text runs.
   */
  container: HTMLDivElement;

  /**
   * The target viewport to properly layout the text runs.
   */
  viewport: PageViewport;

  /**
   * HTML elements that correspond to
   * the text items of the textContent input.
   * This is output and shall initially be set to an empty array.
   */
  textDivs?: HTMLElement[];

  /**
   * Some properties
   * weakly mapped to the HTML elements used to render the text.
   */
  textDivProperties: WeakMap<HTMLElement, TextDivProps>;

  /**
   * true if we can use
   * OffscreenCanvas to measure string widths.
   */
  isOffscreenCanvasSupported?: boolean | undefined;

  /**
   * true if the text layer must be rotated.
   */
  mustRotate?: boolean;

  /**
   * true if the text layer contents must be
   */
  mustRescale?: boolean;
};

export type TextDivProps = {
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
};

const MAX_TEXT_DIVS_TO_RENDER = 100000;
const DEFAULT_FONT_SIZE = 30;
const DEFAULT_FONT_ASCENT = 0.8;
const ascentCache = new Map<string, number>();

function getCtx(
  size: number,
  isOffscreenCanvasSupported?: boolean,
): OC2D | C2D {
  let ctx;
  if (isOffscreenCanvasSupported && FeatureTest.isOffscreenCanvasSupported) {
    ctx = new OffscreenCanvas(size, size)
      .getContext("2d", { alpha: false }) as OC2D;
  } else {
    const canvas = html("canvas");
    canvas.width = canvas.height = size;
    ctx = canvas.getContext("2d", { alpha: false })!;
  }

  return ctx;
}

function getAscent(fontFamily: string, isOffscreenCanvasSupported?: boolean) {
  const cachedAscent = ascentCache.get(fontFamily);
  if (cachedAscent) {
    return cachedAscent;
  }

  const ctx = getCtx(DEFAULT_FONT_SIZE, isOffscreenCanvasSupported)!;
  ctx.font = `${DEFAULT_FONT_SIZE}px ${fontFamily}`;
  const metrics: TextMetrics = ctx.measureText("");

  // Both properties aren't available by default in Firefox.
  let ascent = metrics.fontBoundingBoxAscent;
  let descent = Math.abs(metrics.fontBoundingBoxDescent);
  if (ascent) {
    const ratio = ascent / (ascent + descent);
    ascentCache.set(fontFamily, ratio);

    ctx.canvas.width = ctx.canvas.height = 0;
    return ratio;
  }

  // Try basic heuristic to guess ascent/descent.
  // Draw a g with baseline at 0,0 and then get the line
  // number where a pixel has non-null red component (starting
  // from bottom).
  (ctx as any).strokeStyle = "red";
  (ctx as any).clearRect(0, 0, DEFAULT_FONT_SIZE, DEFAULT_FONT_SIZE);
  (ctx as any).strokeText("g", 0, 0);
  let pixels: Uint8ClampedArray = (ctx as any).getImageData(
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
  (ctx as any).clearRect(0, 0, DEFAULT_FONT_SIZE, DEFAULT_FONT_SIZE);
  (ctx as any).strokeText("A", 0, DEFAULT_FONT_SIZE);
  pixels =
    (ctx as any).getImageData(0, 0, DEFAULT_FONT_SIZE, DEFAULT_FONT_SIZE).data;
  ascent = 0;
  for (let i = 0, ii = pixels.length; i < ii; i += 4) {
    if (pixels[i] > 0) {
      ascent = DEFAULT_FONT_SIZE - Math.floor(i / 4 / DEFAULT_FONT_SIZE);
      break;
    }
  }

  ctx.canvas.width = ctx.canvas.height = 0;

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
) {
  // Initialize all used properties to keep the caches monomorphic.
  const textDiv = span();
  const textDivProperties: TextDivProps = {
    angle: 0,
    canvasWidth: 0,
    hasText: geom.str !== "",
    hasEOL: geom.hasEOL,
    fontSize: 0,
  };
  task._textDivs.push(textDiv);

  const tx = Util.transform(task._transform, geom.transform);
  let angle = Math.atan2(tx[1], tx[0]);
  const style = styles[geom.fontName!];
  if (style.vertical) {
    angle += Math.PI / 2;
  }
  const fontHeight = Math.hypot(tx[2], tx[3]);
  const fontAscent = fontHeight *
    getAscent(style.fontFamily, task._isOffscreenCanvasSupported);

  let left, top;
  if (angle === 0) {
    left = tx[4];
    top = tx[5] - fontAscent;
  } else {
    left = tx[4] + fontAscent * Math.sin(angle);
    top = tx[5] - fontAscent * Math.cos(angle);
  }

  const scaleFactorStr = "calc(var(--scale-factor)*";
  const divStyle = textDiv.style;
  // Setting the style properties individually, rather than all at once,
  // should be OK since the `textDiv` isn't appended to the document yet.
  if (task._container === task._rootContainer) {
    divStyle.left = `${((100 * left) / task._pageWidth).toFixed(2)}%`;
    divStyle.top = `${((100 * top) / task._pageHeight).toFixed(2)}%`;
  } else {
    // We're in a marked content span, hence we can't use percents.
    divStyle.left = `${scaleFactorStr}${left.toFixed(2)}px)`;
    divStyle.top = `${scaleFactorStr}${top.toFixed(2)}px)`;
  }
  divStyle.fontSize = `${scaleFactorStr}${fontHeight.toFixed(2)}px)`;
  divStyle.fontFamily = style.fontFamily;

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
  } else if (geom.str !== " " && geom.transform[0] !== geom.transform[3]) {
    const absScaleX = Math.abs(geom.transform[0]),
      absScaleY = Math.abs(geom.transform[3]);
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
    textDivProperties.canvasWidth = style.vertical ? geom.height : geom.width;
  }
  task._textDivProperties.set(textDiv, textDivProperties);
  if (task._isReadableStream) {
    task._layoutText(textDiv);
  }
}

type LayoutTextP_ = {
  prevFontSize?: unknown;
  prevFontFamily?: unknown;
  div?: HTMLElement;
  scale: number;
  properties?: TextDivProps | undefined;
  ctx: OC2D | C2D;
};

function layout(params: LayoutTextP_) {
  const { div, scale, properties, ctx, prevFontSize, prevFontFamily } = params;
  const { style } = div!;
  let transform = "";
  if (properties!.canvasWidth !== 0 && properties!.hasText) {
    const { fontFamily } = style;
    const { canvasWidth, fontSize } = properties!;

    if (prevFontSize !== fontSize || prevFontFamily !== fontFamily) {
      (ctx as any).font = `${fontSize * scale}px ${fontFamily}`;
      params.prevFontSize = fontSize;
      params.prevFontFamily = fontFamily;
    }

    // Only measure the width for multi-char text divs, see `appendText`.
    const { width } = (ctx as any).measureText(div!.textContent) as TextMetrics;

    if (width > 0) {
      transform = `scaleX(${(canvasWidth * scale) / width})`;
    }
  }
  if (properties!.angle !== 0) {
    transform = `rotate(${properties!.angle}deg) ${transform}`;
  }
  if (transform.length > 0) {
    style.transform = transform;
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
    capability.resolve();
    return;
  }

  if (!task._isReadableStream) {
    for (const textDiv of textDivs) {
      task._layoutText(textDiv);
    }
  }
  capability.resolve();
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
  _textContentSource;
  _isReadableStream;
  _rootContainer;
  _container;
  _textDivs: HTMLSpanElement[];
  _textContentItemsStr: string[];
  _isOffscreenCanvasSupported: boolean | undefined;
  _fontInspectorEnabled: boolean;

  _reader?: ReadableStreamDefaultReader<TextContent> | undefined;
  _textDivProperties: WeakMap<HTMLSpanElement, TextDivProps>;
  _canceled = false;

  _capability = new PromiseCap();
  /**
   * Promise for textLayer rendering task completion.
   */
  get promise() {
    return this._capability.promise;
  }

  _layoutTextParams: LayoutTextP_;
  _transform;
  _pageWidth;
  _pageHeight;

  constructor({
    textContentSource,
    container,
    viewport,
    textDivs,
    textDivProperties,
    textContentItemsStr,
    isOffscreenCanvasSupported,
  }: TextLayerRenderP_) {
    this._textContentSource = textContentSource;
    this._isReadableStream = textContentSource instanceof ReadableStream;
    this._container = this._rootContainer = container;
    this._textDivs = textDivs || [];
    this._textContentItemsStr = textContentItemsStr || [];
    this._isOffscreenCanvasSupported = isOffscreenCanvasSupported;
    this._fontInspectorEnabled = !!(globalThis as any).FontInspector?.enabled;

    this._textDivProperties = textDivProperties || new WeakMap();
    this._layoutTextParams = {
      scale: viewport.scale * (globalThis.devicePixelRatio || 1),
      ctx: getCtx(0, isOffscreenCanvasSupported)!,
    };
    const { pageWidth, pageHeight, pageX, pageY } = viewport.rawDims;
    this._transform = [1, 0, 0, -1, -pageX, pageY + pageHeight] as matrix_t;
    this._pageWidth = pageWidth;
    this._pageHeight = pageHeight;

    setLayerDimensions(container, viewport);

    // Always clean-up the temporary canvas once rendering is no longer pending.
    this._capability.promise
      .finally(() => {
        this._layoutTextParams = undefined as any;
      }).catch(() => {
        // Avoid "Uncaught promise" messages in the console.
      });
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
    this._capability.reject(new AbortException("TextLayer task cancelled."));
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
          this._container = this._container.parentNode as HTMLElement;
        }
        continue;
      }
      this._textContentItemsStr.push((item as TextItem).str);
      appendText(this, item as TextItem, styleCache);
    }
  }

  /**
   * @private
   */
  _layoutText(textDiv: HTMLSpanElement) {
    // deno-fmt-ignore
    const textDivProperties 
      = this._layoutTextParams.properties 
      = this._textDivProperties.get(textDiv)!;
    this._layoutTextParams.div = textDiv;
    layout(this._layoutTextParams);

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
  _render() {
    const capability = new PromiseCap();
    let styleCache = Object.create(null);

    if (this._isReadableStream) {
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

      this._reader = (this._textContentSource as ReadableStream<TextContent>)
        .getReader();
      pump();
    } else if (this._textContentSource) {
      const { items, styles } = this._textContentSource as TextContent;
      this.#processItems(items, styles);
      capability.resolve();
    } else {
      throw new Error('No "textContentSource" parameter specified.');
    }

    capability.promise.then(() => {
      styleCache = null;
      render(this);
    }, this._capability.reject);
  }
}

export function renderTextLayer(
  params: TextLayerRenderP_,
): TextLayerRenderTask {
  /*#static*/ if (PDFJSDev || GENERIC) {
    if (
      !params.textContentSource &&
      ((params as any).textContent || (params as any).textContentStream)
    ) {
      deprecated(
        "The TextLayerRender `textContent`/`textContentStream` parameters " +
          "will be removed in the future, please use `textContentSource` instead.",
      );
      params.textContentSource = (params as any).textContent ||
        (params as any).textContentStream;
    }
  }
  /*#static*/ if (GENERIC && !TESTING) {
    const { container, viewport } = params;
    const style = getComputedStyle(container);
    const visibility = style.getPropertyValue("visibility");
    const scaleFactor = parseFloat(style.getPropertyValue("--scale-factor"));

    if (
      visibility === "visible" &&
      (!scaleFactor || Math.abs(scaleFactor - viewport.scale) > 1e-5)
    ) {
      console.error(
        "The `--scale-factor` CSS-variable must be set, " +
          "to the same value as `viewport.scale`, " +
          "either on the `container`-element itself or higher up in the DOM.",
      );
    }
  }
  const task = new TextLayerRenderTask(params);
  task._render();
  return task;
}

export function updateTextLayer({
  container,
  viewport,
  textDivs,
  textDivProperties,
  isOffscreenCanvasSupported,
  mustRotate = true,
  mustRescale = true,
}: TextLayerUpdateP_): void {
  if (mustRotate) {
    setLayerDimensions(container, { rotation: viewport.rotation });
  }

  if (mustRescale) {
    const ctx = getCtx(0, isOffscreenCanvasSupported)!;
    const scale = viewport.scale * (globalThis.devicePixelRatio || 1);
    const params: LayoutTextP_ = { scale, ctx };
    for (const div of textDivs!) {
      params.properties = textDivProperties.get(div);
      params.div = div;
      layout(params);
    }
  }
}
/*80--------------------------------------------------------------------------*/
