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

import { getOutputScale } from "./ui_utils.js";
import { PDFRenderingQueue, RenderingStates } from "./pdf_rendering_queue.js";
import { type IL10n, type IPDFLinkService, type IVisibleView } from "./interfaces.js";
import { PageViewport, RenderingCancelledException } from "../pdf.ts-src/display/display_utils.js";
import { OptionalContentConfig } from "../pdf.ts-src/display/optional_content_config.js";
import { PDFPageView } from "./pdf_page_view.js";
import { PDFPageProxy, RenderTask } from "../pdf.ts-src/display/api.js";
import { type matrix_t } from "../pdf.ts-src/shared/util.js";
import { html } from "../../lib/dom.js";
/*81---------------------------------------------------------------------------*/

const DRAW_UPSCALE_FACTOR = 2; // See comment in `PDFThumbnailView.draw` below.
const MAX_NUM_SCALING_STEPS = 3;
const THUMBNAIL_CANVAS_BORDER_WIDTH = 1; // px
const THUMBNAIL_WIDTH = 98; // px

interface PDFThumbnailViewOptions
{
  /**
   * The viewer element.
   */
  container:HTMLDivElement;

  /**
   * The thumbnail's unique ID (normally its number).
   */
  id:number;

  /**
   * The page viewport.
   */
  defaultViewport:PageViewport;

  /**
   * A promise that is resolved with an {@link OptionalContentConfig} instance.
   * The default value is `null`.
   */
  optionalContentConfigPromise?:Promise< OptionalContentConfig >;

  /**
   * The navigation/linking service.
   */
  linkService:IPDFLinkService;

  /**
   * The rendering queue object.
   */
  renderingQueue:PDFRenderingQueue;

  checkSetImageDisabled:() => boolean;

  /**
   * Localization service.
   */
  l10n:IL10n;
}

export class TempImageFactory 
{
  static #tempCanvas:HTMLCanvasElement | undefined;

  static getCanvas( width:number, height:number )
  {
    const tempCanvas = (this.#tempCanvas ||= document.createElement("canvas"));
    tempCanvas.width = width;
    tempCanvas.height = height;

    // Since this is a temporary canvas, we need to fill it with a white
    // background ourselves. `#getPageDrawContext` uses CSS rules for this.
    // #if MOZCENTRAL || GENERIC
      (<any>tempCanvas).mozOpaque = true;
    // #endif

    const ctx = tempCanvas.getContext("2d", { alpha: false })!;
    ctx.save();
    ctx.fillStyle = "rgb(255, 255, 255)";
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
    return <const>[tempCanvas, tempCanvas.getContext("2d")!];
  }

  static destroyCanvas() 
  {
    const tempCanvas = this.#tempCanvas;
    if( tempCanvas )
    {
      // Zeroing the width and height causes Firefox to release graphics
      // resources immediately, which can greatly reduce memory consumption.
      tempCanvas.width = 0;
      tempCanvas.height = 0;
    }
    this.#tempCanvas = undefined;
  }
}

export class PDFThumbnailView implements IVisibleView
{
  readonly id; /** @implements */
  readonly renderingId; /** @implements */
  pageLabel:string | undefined;

  pdfPage?:PDFPageProxy;
  rotation = 0;
  viewport;
  pdfPageRotate;
  _optionalContentConfigPromise;

  linkService;
  renderingQueue;

  renderTask?:RenderTask | undefined;
  renderingState = RenderingStates.INITIAL;
  resume?:(() => void) | undefined; /** @implements */
  #checkSetImageDisabled:() => boolean;

  canvasWidth;
  canvasHeight;
  scale;

  l10n;

  anchor;
  div; /** @implements */
  ring;

  canvas?:HTMLCanvasElement;
  image?:HTMLImageElement;

  constructor({
    container,
    id,
    defaultViewport,
    optionalContentConfigPromise,
    linkService,
    renderingQueue,
    checkSetImageDisabled,
    l10n,
  }:PDFThumbnailViewOptions ) 
  {
    this.id = id;
    this.renderingId = "thumbnail" + id;
    // this.pageLabel = null;

    // this.pdfPage = null;
    // this.rotation = 0;
    this.viewport = defaultViewport;
    this.pdfPageRotate = defaultViewport.rotation;
    this._optionalContentConfigPromise = optionalContentConfigPromise;

    this.linkService = linkService;
    this.renderingQueue = renderingQueue;

    // this.renderTask = null;
    // this.renderingState = RenderingStates.INITIAL;
    // this.resume = null;
    this.#checkSetImageDisabled = checkSetImageDisabled || (() => false);

    const pageWidth = this.viewport.width,
      pageHeight = this.viewport.height,
      pageRatio = pageWidth / pageHeight;

    this.canvasWidth = THUMBNAIL_WIDTH;
    this.canvasHeight = (this.canvasWidth / pageRatio) | 0;
    this.scale = this.canvasWidth / pageWidth;

    this.l10n = l10n;

    const anchor = html("a");
    anchor.href = linkService.getAnchorUrl("#page=" + id);
    this._thumbPageTitle.then(msg => {
      anchor.title = msg;
    });
    anchor.onclick = function () {
      linkService.goToPage(id);
      return false;
    };
    this.anchor = anchor;

    const div = html("div");
    div.className = "thumbnail";
    div.setAttribute("data-page-number", <any>this.id);
    this.div = div;

    const ring = html("div");
    ring.className = "thumbnailSelectionRing";
    const borderAdjustment = 2 * THUMBNAIL_CANVAS_BORDER_WIDTH;
    ring.style.width = this.canvasWidth + borderAdjustment + "px";
    ring.style.height = this.canvasHeight + borderAdjustment + "px";
    this.ring = ring;

    div.appendChild(ring);
    anchor.appendChild(div);
    container.appendChild(anchor);
  }

  setPdfPage( pdfPage:PDFPageProxy )
  {
    this.pdfPage = pdfPage;
    this.pdfPageRotate = pdfPage.rotate;
    const totalRotation = (this.rotation + this.pdfPageRotate) % 360;
    this.viewport = pdfPage.getViewport({ scale: 1, rotation: totalRotation });
    this.reset();
  }

  reset() {
    this.cancelRendering();
    this.renderingState = RenderingStates.INITIAL;

    const pageWidth = this.viewport.width,
      pageHeight = this.viewport.height,
      pageRatio = pageWidth / pageHeight;

    this.canvasHeight = (this.canvasWidth / pageRatio) | 0;
    this.scale = this.canvasWidth / pageWidth;

    this.div.removeAttribute("data-loaded");
    const ring = this.ring;
    ring.textContent = ""; // Remove the thumbnail from the DOM.
    const borderAdjustment = 2 * THUMBNAIL_CANVAS_BORDER_WIDTH;
    ring.style.width = this.canvasWidth + borderAdjustment + "px";
    ring.style.height = this.canvasHeight + borderAdjustment + "px";

    if( this.canvas )
    {
      // Zeroing the width and height causes Firefox to release graphics
      // resources immediately, which can greatly reduce memory consumption.
      this.canvas.width = 0;
      this.canvas.height = 0;
      delete this.canvas;
    }
    if (this.image) {
      this.image.removeAttribute("src");
      delete this.image;
    }
  }

  update({ rotation }:{ rotation?:number })
  {
    if( typeof rotation === "number" )
    {
      this.rotation = rotation; // The rotation may be zero.
    }
    const totalRotation = (this.rotation + this.pdfPageRotate) % 360;
    this.viewport = this.viewport.clone({
      scale: 1,
      rotation: totalRotation,
    });
    this.reset();
  }

  /**
   * PLEASE NOTE: Most likely you want to use the `this.reset()` method,
   *              rather than calling this one directly.
   */
  cancelRendering() {
    if( this.renderTask )
    {
      this.renderTask.cancel();
      this.renderTask = undefined;
    }
    this.resume = undefined;
  }

  #getPageDrawContext = ( upscaleFactor=1 ) =>
  {
    // Keep the no-thumbnail outline visible, i.e. `data-loaded === false`,
    // until rendering/image conversion is complete, to avoid display issues.
    const canvas = html("canvas");

    // #if MOZCENTRAL || GENERIC
    // if (
    //   typeof PDFJSDev === "undefined" ||
    //   PDFJSDev.test("MOZCENTRAL || GENERIC")
    // ) {
    (<any>canvas).mozOpaque = true;
    // }
    // #endif
    const ctx = canvas.getContext("2d", { alpha: false })!;
    const outputScale = getOutputScale(ctx);

    canvas.width = (upscaleFactor * this.canvasWidth * outputScale.sx) | 0;
    canvas.height = (upscaleFactor * this.canvasHeight * outputScale.sy) | 0;

    const transform = outputScale.scaled
      ? <matrix_t>[outputScale.sx, 0, 0, outputScale.sy, 0, 0]
      : undefined;

    return { ctx, canvas, transform };
  }

  #convertCanvasToImage( canvas:HTMLCanvasElement )
  {
    if (this.renderingState !== RenderingStates.FINISHED) {
      throw new Error("_convertCanvasToImage: Rendering has not finished.");
    }
    const reducedCanvas = this.#reduceImage(canvas);

    const image = html("img");
    image.className = "thumbnailImage";
    this._thumbPageCanvas.then(msg => {
      image.setAttribute("aria-label", msg);
    });
    image.style.width = this.canvasWidth + "px";
    image.style.height = this.canvasHeight + "px";

    image.src = reducedCanvas.toDataURL();
    this.image = image;

    this.div.setAttribute("data-loaded", <any>true);
    this.ring.appendChild(image);

    // Zeroing the width and height causes Firefox to release graphics
    // resources immediately, which can greatly reduce memory consumption.
    reducedCanvas.width = 0;
    reducedCanvas.height = 0;
  }

  draw() 
  {
    if (this.renderingState !== RenderingStates.INITIAL) 
    {
      console.error("Must be in new state before drawing");
      return Promise.resolve();
    }
    const { pdfPage } = this;

    if (!pdfPage) {
      this.renderingState = RenderingStates.FINISHED;
      return Promise.reject(new Error("pdfPage is not loaded"));
    }

    this.renderingState = RenderingStates.RUNNING;

    const finishRenderTask = async ( error:any=null ) => {
      // The renderTask may have been replaced by a new one, so only remove
      // the reference to the renderTask if it matches the one that is
      // triggering this callback.
      if (renderTask === this.renderTask) {
        this.renderTask = undefined;
      }

      if (error instanceof RenderingCancelledException) {
        return;
      }
      this.renderingState = RenderingStates.FINISHED;
      this.#convertCanvasToImage( canvas );

      if (error) {
        throw error;
      }
    };

    // Render the thumbnail at a larger size and downsize the canvas (similar
    // to `setImage`), to improve consistency between thumbnails created by
    // the `draw` and `setImage` methods (fixes issue 8233).
    // NOTE: To primarily avoid increasing memory usage too much, but also to
    //   reduce downsizing overhead, we purposely limit the up-scaling factor.
    const { ctx, canvas, transform } =
      this.#getPageDrawContext(DRAW_UPSCALE_FACTOR);
    const drawViewport = this.viewport.clone({
      scale: DRAW_UPSCALE_FACTOR * this.scale,
    });
    const renderContinueCallback = ( cont:()=>void ) => {
      if( !this.renderingQueue.isHighestPriority(this) )
      {
        this.renderingState = RenderingStates.PAUSED;
        this.resume = () => {
          this.renderingState = RenderingStates.RUNNING;
          cont();
        };
        return;
      }
      cont();
    };

    const renderContext = {
      canvasContext: ctx,
      transform,
      viewport: drawViewport,
      optionalContentConfigPromise: this._optionalContentConfigPromise,
    };
    const renderTask = (this.renderTask = pdfPage.render(renderContext));
    renderTask.onContinue = renderContinueCallback;

    const resultPromise = renderTask.promise.then(
      function () {
        return finishRenderTask(null);
      },
      function (error) {
        return finishRenderTask(error);
      }
    );
    resultPromise.finally(() => {
      // Zeroing the width and height causes Firefox to release graphics
      // resources immediately, which can greatly reduce memory consumption.
      canvas.width = 0;
      canvas.height = 0;

      // Only trigger cleanup, once rendering has finished, when the current
      // pageView is *not* cached on the `BaseViewer`-instance.
      const pageCached = this.linkService.isPageCached(this.id);
      if (!pageCached) {
        this.pdfPage?.cleanup();
      }
    });

    return resultPromise;
  }

  setImage( pageView:PDFPageView )
  {
    if (this.#checkSetImageDisabled()) {
      return;
    }
    if (this.renderingState !== RenderingStates.INITIAL) {
      return;
    }
    const { canvas, pdfPage } = pageView;
    if (!canvas) {
      return;
    }
    if (!this.pdfPage) {
      this.setPdfPage( pdfPage! );
    }
    this.renderingState = RenderingStates.FINISHED;
    this.#convertCanvasToImage(canvas);
  }

  #reduceImage = ( img:HTMLCanvasElement ) =>
  {
    const { ctx, canvas } = this.#getPageDrawContext();

    if (img.width <= 2 * canvas.width) {
      ctx.drawImage(
        img,
        0,
        0,
        img.width,
        img.height,
        0,
        0,
        canvas.width,
        canvas.height
      );
      return canvas;
    }
    // drawImage does an awful job of rescaling the image, doing it gradually.
    let reducedWidth = canvas.width << MAX_NUM_SCALING_STEPS;
    let reducedHeight = canvas.height << MAX_NUM_SCALING_STEPS;
    const [reducedImage, reducedImageCtx] = TempImageFactory.getCanvas(
      reducedWidth,
      reducedHeight
    );

    while (reducedWidth > img.width || reducedHeight > img.height) {
      reducedWidth >>= 1;
      reducedHeight >>= 1;
    }
    reducedImageCtx.drawImage(
      img,
      0,
      0,
      img.width,
      img.height,
      0,
      0,
      reducedWidth,
      reducedHeight
    );
    while (reducedWidth > 2 * canvas.width) {
      reducedImageCtx.drawImage(
        reducedImage,
        0,
        0,
        reducedWidth,
        reducedHeight,
        0,
        0,
        reducedWidth >> 1,
        reducedHeight >> 1
      );
      reducedWidth >>= 1;
      reducedHeight >>= 1;
    }
    ctx.drawImage(
      reducedImage,
      0,
      0,
      reducedWidth,
      reducedHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );
    return canvas;
  }

  get _thumbPageTitle()
  {
    return this.l10n.get("thumb_page_title", {
      page: this.pageLabel ?? <any>this.id,
    });
  }

  get _thumbPageCanvas() {
    return this.l10n.get("thumb_page_canvas", {
      page: this.pageLabel ?? <any>this.id,
    });
  }

  setPageLabel( label:string | null ) 
  {
    this.pageLabel = typeof label === "string" ? label : undefined;

    this._thumbPageTitle.then(msg => {
      this.anchor.title = msg;
    });

    if (this.renderingState !== RenderingStates.FINISHED) {
      return;
    }

    this._thumbPageCanvas.then(msg => {
      this.image?.setAttribute("aria-label", msg);
    });
  }
}
/*81---------------------------------------------------------------------------*/
