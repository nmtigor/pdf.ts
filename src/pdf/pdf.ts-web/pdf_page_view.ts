/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/pdf_page_view.ts
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

import type { dot2d_t, uint } from "@fe-lib/alias.ts";
import { html } from "@fe-lib/dom.ts";
import { COMPONENTS, GENERIC, PDFJSDev, TESTING } from "@fe-src/global.ts";
import type { FieldObjectsPromise } from "../alias.ts";
import type { RenderTask } from "../pdf.ts-src/display/api.ts";
import type {
  AnnotationEditorUIManager,
  AnnotationStorage,
  matrix_t,
  OptionalContentConfig,
  PageViewport,
  PDFPageProxy,
  RenderP,
  StatTimer,
  TextItem,
} from "../pdf.ts-src/pdf.ts";
import {
  AbortException,
  AnnotationMode,
  PixelsPerInch,
  RenderingCancelledException,
  setLayerDimensions,
  shadow,
} from "../pdf.ts-src/pdf.ts";
import { AnnotationEditorLayerBuilder } from "./annotation_editor_layer_builder.ts";
import { AnnotationLayerBuilder } from "./annotation_layer_builder.ts";
import type { ErrorMoreInfo } from "./app.ts";
import { AppOptions } from "./app_options.ts";
import { DrawLayerBuilder } from "./draw_layer_builder.ts";
import type { EventBus, EventMap } from "./event_utils.ts";
import { GenericL10n } from "./genericl10n.ts";
import type {
  IDownloadManager,
  IL10n,
  IPDFLinkService,
  IVisibleView,
} from "./interfaces.ts";
import type { PDFFindController } from "./pdf_find_controller.ts";
import { SimpleLinkService } from "./pdf_link_service.ts";
import type { PDFRenderingQueue } from "./pdf_rendering_queue.ts";
import type { PageColors } from "./pdf_viewer.ts";
import { StructTreeLayerBuilder } from "./struct_tree_layer_builder.ts";
import { TextAccessibilityManager } from "./text_accessibility.ts";
import { TextHighlighter } from "./text_highlighter.ts";
import { TextLayerBuilder } from "./text_layer_builder.ts";
import {
  approximateFraction,
  DEFAULT_SCALE,
  OutputScale,
  RenderingStates,
  roundToDivide,
  TextLayerMode,
} from "./ui_utils.ts";
import { XfaLayerBuilder } from "./xfa_layer_builder.ts";

//kkkk TOCLEANUP
// /* Ref. gulpfile.mjs of pdf.js */
// const { NullL10n } = /*#static*/ GENERIC
//   ? await import("./l10n_utils.ts")
//   : await import("./stubs.ts");
/*80--------------------------------------------------------------------------*/

interface PDFPageViewOptions {
  /**
   * The viewer element.
   */
  container: HTMLDivElement | undefined;

  /**
   * The application event bus.
   */
  eventBus: EventBus;

  /**
   * The page unique ID (normally its number).
   */
  id: number;

  /**
   * The page scale display.
   */
  scale?: number;

  /**
   * The page viewport.
   */
  defaultViewport: PageViewport;

  /**
   * A promise that is resolved with an {@link OptionalContentConfig} instance.
   * The default value is `null`.
   */
  optionalContentConfigPromise?: Promise<OptionalContentConfig | undefined>;

  /**
   * The rendering queue object.
   */
  renderingQueue?: PDFRenderingQueue | undefined;

  /**
   * Controls if the text layer used for
   * selection and searching is created. The constants from {TextLayerMode}
   * should be used. The default value is `TextLayerMode.ENABLE`.
   */
  textLayerMode?: TextLayerMode;

  /**
   * Controls if the annotation layer is
   * created, and if interactive form elements or `AnnotationStorage`-data are
   * being rendered. The constants from {@link AnnotationMode} should be used;
   * see also {@link RenderParameters} and {@link GetOperatorListParameters}.
   * The default value is `AnnotationMode.ENABLE_FORMS`.
   */
  annotationMode?: AnnotationMode;

  /**
   * Path for image resources, mainly
   * for annotation icons. Include trailing slash.
   */
  imageResourcesPath?: string;

  /**
   * The maximum supported canvas size in
   * total pixels, i.e. width * height. Use `-1` for no limit, or `0` for
   * CSS-only zooming. The default value is 4096 * 8192 (32 mega-pixels).
   */
  maxCanvasPixels?: number | undefined;

  /**
   * Overwrites background and foreground colors
   * with user defined ones in order to improve readability in high contrast
   * mode.
   */
  pageColors?: PageColors | undefined;

  /**
   * Localization service.
   */
  l10n?: IL10n | undefined;

  /**
   * The object that is used to lookup the necessary layer-properties.
   */
  layerProperties?: LayerProps;
}

//kkkk TOCLEANUP
// const MAX_CANVAS_PIXELS =
//   compatibilityParams.maxCanvasPixels as number | undefined || 16777216;

export type LayerProps = {
  annotationEditorUIManager?: AnnotationEditorUIManager | undefined;
  annotationStorage?: AnnotationStorage | undefined;
  downloadManager?: IDownloadManager | undefined;
  enableScripting: boolean;
  fieldObjectsPromise?: FieldObjectsPromise | undefined;
  findController?: PDFFindController | undefined;
  hasJSActionsPromise?: Promise<boolean> | undefined;
  linkService: IPDFLinkService;
};
const DEFAULT_LAYER_PROPERTIES: LayerProps | undefined =
  /*#static*/ PDFJSDev || !COMPONENTS ? undefined : {
    enableScripting: false,
    get linkService() {
      return new SimpleLinkService();
    },
  };

type LayerName_ =
  | "canvasWrapper"
  | "textLayer"
  | "annotationLayer"
  | "annotationEditorLayer"
  | "xfaLayer";

const LAYERS_ORDER = new Map<LayerName_, uint>([
  ["canvasWrapper", 0],
  ["textLayer", 1],
  ["annotationLayer", 2],
  ["annotationEditorLayer", 3],
  ["xfaLayer", 3],
]);

interface CSSTransformP_ {
  target: HTMLCanvasElement | SVGElement;
  redrawAnnotationLayer?: boolean;
  redrawAnnotationEditorLayer?: boolean;
  redrawXfaLayer?: boolean;
  redrawTextLayer?: boolean;
  hideTextLayer?: boolean;
}

interface PDFPageViewUpdateP_ {
  /**
   * The new scale, if specified.
   */
  scale?: number;

  /**
   * The new rotation, if specified.
   */
  rotation?: number;

  /**
   * A promise that is resolved with an {@link OptionalContentConfig}
   * instance. The default value is `null`.
   */
  optionalContentConfigPromise?: Promise<OptionalContentConfig | undefined>;

  drawingDelay?: number;
}

type CancelRenderingP_ = {
  keepZoomLayer?: boolean;
  keepAnnotationLayer?: boolean;
  keepAnnotationEditorLayer?: boolean;
  keepXfaLayer?: boolean;
  keepTextLayer?: boolean;
  cancelExtraDelay?: number;
};

export class PDFPageView implements IVisibleView {
  /** @implement */
  readonly id: number;
  /** @implement */
  readonly renderingId: string;
  #layerProperties: LayerProps | undefined;

  #loadingId: number | undefined;

  pdfPage?: PDFPageProxy;
  pageLabel?: string | undefined;
  rotation = 0;
  scale: number;

  viewport;
  get width() {
    return this.viewport.width;
  }
  get height() {
    return this.viewport.height;
  }

  pdfPageRotate: number;
  _annotationStorage?: AnnotationStorage;
  _optionalContentConfigPromise:
    | Promise<OptionalContentConfig | undefined>
    | undefined;
  #hasRestrictedScaling = false;
  #textLayerMode;
  #annotationMode;
  #previousRotation: unknown | undefined;

  #renderingState = RenderingStates.INITIAL;
  get renderingState() {
    return this.#renderingState;
  }

  imageResourcesPath: string;
  maxCanvasPixels: number;
  pageColors: PageColors | undefined;

  #useThumbnailCanvas = {
    directDrawing: true,
    initialOptionalContent: true,
    regularAnnotations: true,
  };

  eventBus: EventBus;
  renderingQueue: PDFRenderingQueue | undefined;
  l10n;

  renderTask: RenderTask | undefined;
  #viewportMap = new WeakMap<
    HTMLCanvasElement | SVGElement,
    PageViewport
  >();
  #layers = new Array<HTMLDivElement | undefined>(4);
  resume: (() => void) | undefined; /** @implement */
  #renderError?: ErrorMoreInfo | undefined;
  _isStandalone;
  _container;

  _annotationCanvasMap: Map<string, HTMLCanvasElement> | undefined;

  annotationLayer: AnnotationLayerBuilder | undefined;
  textLayer: TextLayerBuilder | undefined;
  zoomLayer: HTMLElement | undefined;
  xfaLayer: XfaLayerBuilder | undefined;
  structTreeLayer?: StructTreeLayerBuilder | undefined;
  drawLayer: DrawLayerBuilder | undefined;

  div: HTMLDivElement; /** @implement */

  stats?: StatTimer;

  canvas?: HTMLCanvasElement;
  svg?: SVGElement;

  loadingIconDiv?: HTMLDivElement;

  outputScale?: OutputScale;

  _onTextLayerRendered:
    | ((event: EventMap["textlayerrendered"]) => void)
    | undefined;

  annotationEditorLayer: AnnotationEditorLayerBuilder | undefined;

  _accessibilityManager: TextAccessibilityManager | undefined;

  constructor(options: PDFPageViewOptions) {
    const container = options.container;
    const defaultViewport = options.defaultViewport;

    this.id = options.id;
    this.renderingId = "page" + this.id;
    this.#layerProperties = options.layerProperties || DEFAULT_LAYER_PROPERTIES;

    this.scale = options.scale || DEFAULT_SCALE;
    this.viewport = defaultViewport;
    this.pdfPageRotate = defaultViewport.rotation;
    this._optionalContentConfigPromise = options.optionalContentConfigPromise;
    this.#textLayerMode = options.textLayerMode ?? TextLayerMode.ENABLE;
    this.#annotationMode = options.annotationMode ??
      AnnotationMode.ENABLE_FORMS;
    this.imageResourcesPath = options.imageResourcesPath || "";
    this.maxCanvasPixels = options.maxCanvasPixels ??
      AppOptions.maxCanvasPixels;
    this.pageColors = options.pageColors;

    this.eventBus = options.eventBus;
    this.renderingQueue = options.renderingQueue;
    this.l10n = options.l10n;
    /*#static*/ if (PDFJSDev || GENERIC) {
      this.l10n ||= new GenericL10n();
    }

    /*#static*/ if (PDFJSDev || GENERIC) {
      this._isStandalone = !this.renderingQueue?.hasViewer();
      this._container = container;
    }

    const div = html("div");
    div.className = "page";
    div.assignAttro({
      "data-page-number": this.id,
      role: "region",
      "data-l10n-id": "pdfjs-page-landmark",
      "data-l10n-args": JSON.stringify({ page: this.id }),
    });
    this.div = div;

    this.#setDimensions();
    container?.append(div);

    /*#static*/ if (PDFJSDev || GENERIC) {
      if (this._isStandalone) {
        // Ensure that the various layers always get the correct initial size,
        // see issue 15795.
        container?.style.setProperty(
          "--scale-factor",
          this.scale * PixelsPerInch.PDF_TO_CSS_UNITS as any,
        );

        const { optionalContentConfigPromise } = options;
        if (optionalContentConfigPromise) {
          // Ensure that the thumbnails always display the *initial* document
          // state, for documents with optional content.
          optionalContentConfigPromise.then((optionalContentConfig) => {
            if (
              optionalContentConfigPromise !==
                this._optionalContentConfigPromise
            ) {
              return;
            }
            this.#useThumbnailCanvas.initialOptionalContent =
              optionalContentConfig!.hasInitialVisibility;
          });
        }

        // Ensure that Fluent is connected in e.g. the COMPONENTS build.
        if (!options.l10n) {
          this.l10n!.translate(this.div);
        }
      }
    }
  }

  #addLayer(div: HTMLDivElement, name: LayerName_) {
    const pos = LAYERS_ORDER.get(name)!;
    const oldDiv = this.#layers[pos];
    this.#layers[pos] = div;
    if (oldDiv) {
      oldDiv.replaceWith(div);
      return;
    }
    for (let i = pos - 1; i >= 0; i--) {
      const layer = this.#layers[i];
      if (layer) {
        layer.after(div);
        return;
      }
    }
    this.div.prepend(div);
  }

  set renderingState(state) {
    if (state === this.#renderingState) {
      return;
    }
    this.#renderingState = state;

    if (this.#loadingId) {
      clearTimeout(this.#loadingId);
      this.#loadingId = undefined;
    }

    switch (state) {
      case RenderingStates.PAUSED:
        this.div.classList.remove("loading");
        break;
      case RenderingStates.RUNNING:
        this.div.classList.add("loadingIcon");
        this.#loadingId = setTimeout(() => {
          // Adding the loading class is slightly postponed in order to not have
          // it with loadingIcon.
          // If we don't do that the visibility of the background is changed but
          // the transition isn't triggered.
          this.div.classList.add("loading");
          this.#loadingId = undefined;
        }, 0);
        break;
      case RenderingStates.INITIAL:
      case RenderingStates.FINISHED:
        this.div.classList.remove("loadingIcon", "loading");
        break;
    }
  }

  #setDimensions() {
    const { viewport } = this;
    if (this.pdfPage) {
      if (this.#previousRotation === viewport.rotation) {
        return;
      }
      this.#previousRotation = viewport.rotation;
    }

    setLayerDimensions(
      this.div,
      viewport,
      /* mustFlip = */ true,
      /* mustRotate = */ false,
    );
  }

  setPdfPage(pdfPage: PDFPageProxy) {
    /*#static*/ if (PDFJSDev || GENERIC) {
      if (
        this._isStandalone &&
        (this.pageColors?.foreground === "CanvasText" ||
          this.pageColors?.background === "Canvas")
      ) {
        this._container?.style.setProperty(
          "--hcm-highlight-filter",
          pdfPage.filterFactory.addHighlightHCMFilter(
            "highlight",
            "CanvasText",
            "Canvas",
            "HighlightText",
            "Highlight",
          ),
        );
        this._container?.style.setProperty(
          "--hcm-highlight-selected-filter",
          pdfPage.filterFactory.addHighlightHCMFilter(
            "highlight_selected",
            "CanvasText",
            "Canvas",
            "HighlightText",
            "Highlight",
          ),
        );
      }
    }
    this.pdfPage = pdfPage;
    this.pdfPageRotate = pdfPage.rotate;

    const totalRotation = (this.rotation + this.pdfPageRotate) % 360;
    this.viewport = pdfPage.getViewport({
      scale: this.scale * PixelsPerInch.PDF_TO_CSS_UNITS,
      rotation: totalRotation,
    });
    this.#setDimensions();
    this.reset();
  }

  destroy() {
    this.reset();
    this.pdfPage?.cleanup();
  }

  get _textHighlighter() {
    return shadow(
      this,
      "_textHighlighter",
      new TextHighlighter({
        pageIndex: this.id - 1,
        eventBus: this.eventBus,
        findController: this.#layerProperties!.findController,
      }),
    );
  }

  #dispatchLayerRendered(
    name:
      | "annotationlayerrendered"
      | "annotationeditorlayerrendered"
      | "xfalayerrendered"
      | "textlayerrendered",
    error: unknown,
  ) {
    this.eventBus.dispatch(name, {
      source: this,
      pageNumber: this.id,
      error,
    });
  }

  async #renderAnnotationLayer() {
    let error: unknown;
    try {
      await this.annotationLayer!.render(this.viewport, "display");
    } catch (ex) {
      console.error(`#renderAnnotationLayer: "${ex}".`);
      error = ex;
    } finally {
      this.#dispatchLayerRendered("annotationlayerrendered", error);
    }
  }

  async #renderAnnotationEditorLayer() {
    let error: unknown;
    try {
      await this.annotationEditorLayer!.render(this.viewport, "display");
    } catch (ex) {
      console.error(`#renderAnnotationEditorLayer: "${ex}".`);
      error = ex;
    } finally {
      this.#dispatchLayerRendered("annotationeditorlayerrendered", error);
    }
  }

  async #renderDrawLayer() {
    try {
      await this.drawLayer!.render("display");
    } catch (ex) {
      console.error(`#renderDrawLayer: "${ex}".`);
    }
  }

  async #renderXfaLayer() {
    let error: unknown;
    try {
      const result = await this.xfaLayer!.render(this.viewport, "display");
      if (result?.textDivs && this._textHighlighter) {
        // Given that the following method fetches the text asynchronously we
        // can invoke it *before* appending the xfaLayer to the DOM (below),
        // since a pending search-highlight/scroll operation thus won't run
        // until after the xfaLayer is available in the viewer.
        this.#buildXfaTextContentItems(result!.textDivs);
      }
    } catch (ex) {
      console.error(`#renderXfaLayer: "${ex}".`);
      error = ex;
    } finally {
      if (this.xfaLayer?.div) {
        // Pause translation when inserting the xfaLayer in the DOM.
        this.l10n!.pause();
        this.#addLayer(this.xfaLayer.div, "xfaLayer");
        this.l10n!.resume();
      }

      this.#dispatchLayerRendered("xfalayerrendered", error);
    }
  }

  async #renderTextLayer() {
    if (!this.textLayer) {
      return;
    }

    let error: unknown;
    try {
      await this.textLayer.render(this.viewport);
    } catch (ex) {
      if (ex instanceof AbortException) {
        return;
      }
      console.error(`#renderTextLayer: "${ex}".`);
      error = ex;
    }

    this.#dispatchLayerRendered("textlayerrendered", error);

    this.#renderStructTreeLayer();
  }

  /**
   * The structure tree is currently only supported when the text layer is
   * enabled and a canvas is used for rendering.
   *
   * The structure tree must be generated after the text layer for the
   * aria-owns to work.
   */
  async #renderStructTreeLayer() {
    if (!this.textLayer) {
      return;
    }
    this.structTreeLayer ||= new StructTreeLayerBuilder();

    const tree =
      await (!this.structTreeLayer.renderingDone
        ? this.pdfPage!.getStructTree()
        : undefined);
    const treeDom = this.structTreeLayer?.render(tree);
    if (treeDom) {
      // Pause translation when inserting the structTree in the DOM.
      this.l10n!.pause();
      this.canvas?.append(treeDom);
      this.l10n!.resume();
    }
    this.structTreeLayer?.show();
  }

  async #buildXfaTextContentItems(textDivs: Text[]) {
    const text = await this.pdfPage!.getTextContent();
    const items = [];
    for (const item of text.items as TextItem[]) {
      items.push(item.str);
    }
    this._textHighlighter.setTextMapping(textDivs, items);
    this._textHighlighter.enable();
  }

  #resetZoomLayer(removeFromDOM = false) {
    if (!this.zoomLayer) return;

    const zoomLayerCanvas = this.zoomLayer.firstChild as HTMLCanvasElement;
    this.#viewportMap.delete(zoomLayerCanvas);
    // Zeroing the width and height causes Firefox to release graphics
    // resources immediately, which can greatly reduce memory consumption.
    zoomLayerCanvas.width = 0;
    zoomLayerCanvas.height = 0;

    if (removeFromDOM) {
      // Note: `ChildNode.remove` doesn't throw if the parent node is undefined.
      this.zoomLayer.remove();
    }
    this.zoomLayer = undefined;
  }

  reset({
    keepZoomLayer = false,
    keepAnnotationLayer = false,
    keepAnnotationEditorLayer = false,
    keepXfaLayer = false,
    keepTextLayer = false,
  } = {}) {
    this.cancelRendering({
      keepAnnotationLayer,
      keepAnnotationEditorLayer,
      keepXfaLayer,
      keepTextLayer,
    });
    this.renderingState = RenderingStates.INITIAL;

    const div = this.div;

    const childNodes = div.childNodes,
      zoomLayerNode = (keepZoomLayer && this.zoomLayer) || null,
      annotationLayerNode =
        (keepAnnotationLayer && this.annotationLayer?.div) || null,
      annotationEditorLayerNode =
        (keepAnnotationEditorLayer && this.annotationEditorLayer?.div) || null,
      xfaLayerNode = (keepXfaLayer && this.xfaLayer?.div) || null,
      textLayerNode = (keepTextLayer && this.textLayer?.div) || null;
    for (let i = childNodes.length; i--;) {
      const node = childNodes[i];
      switch (node) {
        case zoomLayerNode:
        case annotationLayerNode:
        case annotationEditorLayerNode:
        case xfaLayerNode:
        case textLayerNode:
          continue;
      }
      node.remove();
      const layerIndex = this.#layers.indexOf(node as HTMLDivElement);
      if (layerIndex >= 0) {
        this.#layers[layerIndex] = undefined;
      }
    }
    div.removeAttribute("data-loaded");

    if (annotationLayerNode) {
      // Hide the annotation layer until all elements are resized
      // so they are not displayed on the already resized page.
      this.annotationLayer!.hide();
    }
    if (annotationEditorLayerNode) {
      this.annotationEditorLayer!.hide();
    }
    if (xfaLayerNode) {
      // Hide the XFA layer until all elements are resized
      // so they are not displayed on the already resized page.
      this.xfaLayer!.hide();
    }
    if (textLayerNode) {
      this.textLayer!.hide();
    }
    this.structTreeLayer?.hide();

    if (!zoomLayerNode) {
      if (this.canvas) {
        this.#viewportMap.delete(this.canvas);
        // Zeroing the width and height causes Firefox to release graphics
        // resources immediately, which can greatly reduce memory consumption.
        this.canvas.width = 0;
        this.canvas.height = 0;
        delete this.canvas;
      }
      this.#resetZoomLayer();
    }
  }

  /**
   * Update e.g. the scale and/or rotation of the page.
   */
  update({
    scale = 0,
    rotation,
    optionalContentConfigPromise,
    drawingDelay = -1,
  }: PDFPageViewUpdateP_) {
    this.scale = scale || this.scale;
    if (typeof rotation === "number") {
      this.rotation = rotation; // The rotation may be zero.
    }
    if (optionalContentConfigPromise instanceof Promise) {
      this._optionalContentConfigPromise = optionalContentConfigPromise;

      // Ensure that the thumbnails always display the *initial* document state,
      // for documents with optional content.
      optionalContentConfigPromise.then((optionalContentConfig) => {
        if (
          optionalContentConfigPromise !== this._optionalContentConfigPromise
        ) {
          return;
        }
        this.#useThumbnailCanvas.initialOptionalContent =
          optionalContentConfig!.hasInitialVisibility;
      });
    }
    this.#useThumbnailCanvas.directDrawing = true;

    const totalRotation = (this.rotation + this.pdfPageRotate) % 360;
    this.viewport = this.viewport.clone({
      scale: this.scale * PixelsPerInch.PDF_TO_CSS_UNITS,
      rotation: totalRotation,
    });
    this.#setDimensions();

    /*#static*/ if (PDFJSDev || GENERIC) {
      if (this._isStandalone) {
        this._container?.style.setProperty(
          "--scale-factor",
          this.viewport.scale as any,
        );
      }
    }

    if (this.canvas) {
      let onlyCssZoom = false;
      if (this.#hasRestrictedScaling) {
        if ((PDFJSDev || GENERIC) && this.maxCanvasPixels === 0) {
          onlyCssZoom = true;
        } else if (this.maxCanvasPixels > 0) {
          const { width, height } = this.viewport;
          const { sx, sy } = this.outputScale!;
          onlyCssZoom =
            ((Math.floor(width) * sx) | 0) * ((Math.floor(height) * sy) | 0) >
              this.maxCanvasPixels;
        }
      }
      const postponeDrawing = drawingDelay >= 0 && drawingDelay < 1000;

      if (postponeDrawing || onlyCssZoom) {
        if (
          postponeDrawing &&
          !onlyCssZoom &&
          this.renderingState !== RenderingStates.FINISHED
        ) {
          this.cancelRendering({
            keepZoomLayer: true,
            keepAnnotationLayer: true,
            keepAnnotationEditorLayer: true,
            keepXfaLayer: true,
            keepTextLayer: true,
            cancelExtraDelay: drawingDelay,
          });
          // It isn't really finished, but once we have finished
          // to postpone, we'll call this.reset(...) which will set
          // the rendering state to INITIAL, hence the next call to
          // PDFViewer.update() will trigger a redraw (if it's mandatory).
          this.renderingState = RenderingStates.FINISHED;
          // Ensure that the thumbnails won't become partially (or fully) blank,
          // if the sidebar is opened before the actual rendering is done.
          this.#useThumbnailCanvas.directDrawing = false;
        }

        this.cssTransform({
          target: this.canvas,
          redrawAnnotationLayer: true,
          redrawAnnotationEditorLayer: true,
          redrawXfaLayer: true,
          redrawTextLayer: !postponeDrawing,
          hideTextLayer: postponeDrawing,
        });

        if (postponeDrawing) {
          // The "pagerendered"-event will be dispatched once the actual
          // rendering is done, hence don't dispatch it here as well.
          return;
        }
        this.eventBus.dispatch("pagerendered", {
          source: this,
          pageNumber: this.id,
          cssTransform: true,
          timestamp: performance.now(),
          error: this.#renderError,
        });
        return;
      }
      if (!this.zoomLayer && !this.canvas.hidden) {
        this.zoomLayer = this.canvas.parentNode as HTMLElement;
        this.zoomLayer.style.position = "absolute";
      }
    }
    if (this.zoomLayer) {
      this.cssTransform({
        target: this.zoomLayer.firstChild as HTMLCanvasElement | SVGSVGElement,
      });
    }
    this.reset({
      keepZoomLayer: true,
      keepAnnotationLayer: true,
      keepAnnotationEditorLayer: true,
      keepXfaLayer: true,
      keepTextLayer: true,
    });
  }

  /**
   * PLEASE NOTE: Most likely you want to use the `this.reset()` method,
   *              rather than calling this one directly.
   */
  cancelRendering({
    keepAnnotationLayer = false,
    keepAnnotationEditorLayer = false,
    keepXfaLayer = false,
    keepTextLayer = false,
    cancelExtraDelay = 0,
  } = {} as CancelRenderingP_) {
    if (this.renderTask) {
      this.renderTask.cancel(cancelExtraDelay);
      this.renderTask = undefined;
    }
    this.resume = undefined;

    if (this.textLayer && (!keepTextLayer || !this.textLayer.div)) {
      this.textLayer.cancel();
      this.textLayer = undefined;
    }
    if (this.structTreeLayer && !this.textLayer) {
      this.structTreeLayer = undefined;
    }
    if (
      this.annotationLayer &&
      (!keepAnnotationLayer || !this.annotationLayer.div)
    ) {
      this.annotationLayer.cancel();
      this.annotationLayer = undefined;
      this._annotationCanvasMap = undefined;
    }
    if (
      this.annotationEditorLayer &&
      (!keepAnnotationEditorLayer || !this.annotationEditorLayer.div)
    ) {
      if (this.drawLayer) {
        this.drawLayer.cancel();
        this.drawLayer = undefined;
      }
      this.annotationEditorLayer.cancel();
      this.annotationEditorLayer = undefined;
    }
    if (this.xfaLayer && (!keepXfaLayer || !this.xfaLayer.div)) {
      this.xfaLayer.cancel();
      this.xfaLayer = undefined;
      this._textHighlighter?.disable();
    }
  }

  cssTransform({
    target,
    redrawAnnotationLayer = false,
    redrawAnnotationEditorLayer = false,
    redrawXfaLayer = false,
    redrawTextLayer = false,
    hideTextLayer = false,
  }: CSSTransformP_) {
    // Scale target (canvas), its wrapper and page container.
    /*#static*/ if (PDFJSDev || TESTING) {
      if (!(target instanceof HTMLCanvasElement)) {
        throw new Error("Expected `target` to be a canvas.");
      }
    }
    if (!target.hasAttribute("zooming")) {
      target.setAttribute("zooming", true as any);
      const { style } = target;
      style.width = style.height = "";
    }

    const originalViewport = this.#viewportMap.get(target);
    if (this.viewport !== originalViewport) {
      // The canvas may have been originally rotated; rotate relative to that.
      const relativeRotation = this.viewport.rotation -
        originalViewport!.rotation;
      const absRotation = Math.abs(relativeRotation);
      let scaleX = 1,
        scaleY = 1;
      if (absRotation === 90 || absRotation === 270) {
        const { width, height } = this.viewport;
        // Scale x and y because of the rotation.
        scaleX = height / width;
        scaleY = width / height;
      }
      target.style.transform =
        `rotate(${relativeRotation}deg) scale(${scaleX}, ${scaleY})`;
    }

    if (redrawAnnotationLayer && this.annotationLayer) {
      this.#renderAnnotationLayer();
    }
    if (redrawAnnotationEditorLayer && this.annotationEditorLayer) {
      if (this.drawLayer) {
        this.#renderDrawLayer();
      }
      this.#renderAnnotationEditorLayer();
    }
    if (redrawXfaLayer && this.xfaLayer) {
      this.#renderXfaLayer();
    }

    if (this.textLayer) {
      if (hideTextLayer) {
        this.textLayer.hide();
        this.structTreeLayer?.hide();
      } else if (redrawTextLayer) {
        this.#renderTextLayer();
      }
    }
  }

  getPagePoint(x: number, y: number): dot2d_t {
    return this.viewport.convertToPdfPoint(x, y);
  }

  async #finishRenderTask(renderTask: RenderTask, error?: any) {
    // The renderTask may have been replaced by a new one, so only remove
    // the reference to the renderTask if it matches the one that is
    // triggering this callback.
    if (renderTask === this.renderTask) {
      this.renderTask = undefined;
    }

    if (error instanceof RenderingCancelledException) {
      this.#renderError = undefined;
      return;
    }
    this.#renderError = error;

    this.renderingState = RenderingStates.FINISHED;
    this.#resetZoomLayer(/* removeFromDOM = */ true);

    // Ensure that the thumbnails won't become partially (or fully) blank,
    // for documents that contain interactive form elements.
    this.#useThumbnailCanvas.regularAnnotations = !renderTask.separateAnnots;

    this.eventBus.dispatch("pagerendered", {
      source: this,
      pageNumber: this.id,
      cssTransform: false,
      timestamp: performance.now(),
      error: this.#renderError,
    });

    if (error) {
      throw error;
    }
  }

  /** @implement */
  async draw() {
    if (this.renderingState !== RenderingStates.INITIAL) {
      console.error("Must be in new state before drawing");
      this.reset(); // Ensure that we reset all state to prevent issues.
    }
    const { div, l10n, pageColors, pdfPage, viewport } = this;

    if (!pdfPage) {
      this.renderingState = RenderingStates.FINISHED;
      throw new Error("pdfPage is not loaded");
    }

    this.renderingState = RenderingStates.RUNNING;

    // Wrap the canvas so that if it has a CSS transform for high DPI the
    // overflow will be hidden in Firefox.
    const canvasWrapper = html("div");
    canvasWrapper.classList.add("canvasWrapper");
    this.#addLayer(canvasWrapper, "canvasWrapper");

    if (
      !this.textLayer &&
      this.#textLayerMode !== TextLayerMode.DISABLE &&
      !pdfPage.isPureXfa
    ) {
      this._accessibilityManager ||= new TextAccessibilityManager();

      this.textLayer = new TextLayerBuilder({
        pdfPage,
        highlighter: this._textHighlighter,
        accessibilityManager: this._accessibilityManager,
        enablePermissions:
          this.#textLayerMode === TextLayerMode.ENABLE_PERMISSIONS,
        onAppend: (textLayerDiv) => {
          // Pause translation when inserting the textLayer in the DOM.
          this.l10n!.pause();
          this.#addLayer(textLayerDiv, "textLayer");
          this.l10n!.resume();
        },
      });
    }

    if (
      !this.annotationLayer &&
      this.#annotationMode !== AnnotationMode.DISABLE
    ) {
      const {
        annotationStorage,
        annotationEditorUIManager,
        downloadManager,
        enableScripting,
        fieldObjectsPromise,
        hasJSActionsPromise,
        linkService,
      } = this.#layerProperties!;

      this._annotationCanvasMap ||= new Map();
      this.annotationLayer = new AnnotationLayerBuilder({
        pdfPage,
        annotationStorage,
        imageResourcesPath: this.imageResourcesPath,
        renderForms: this.#annotationMode === AnnotationMode.ENABLE_FORMS,
        linkService,
        downloadManager,
        enableScripting,
        hasJSActionsPromise,
        fieldObjectsPromise,
        annotationCanvasMap: this._annotationCanvasMap,
        accessibilityManager: this._accessibilityManager,
        annotationEditorUIManager,
        onAppend: (annotationLayerDiv) => {
          this.#addLayer(annotationLayerDiv, "annotationLayer");
        },
      });
    }

    const renderContinueCallback = (cont: () => void) => {
      showCanvas?.(false);
      if (this.renderingQueue && !this.renderingQueue.isHighestPriority(this)) {
        this.renderingState = RenderingStates.PAUSED;
        this.resume = () => {
          this.renderingState = RenderingStates.RUNNING;
          cont();
        };
        return;
      }
      cont();
    };

    const { width, height } = viewport;
    const canvas = html("canvas");
    canvas.setAttribute("role", "presentation");

    // Keep the canvas hidden until the first draw callback, or until drawing
    // is complete when `!this.renderingQueue`, to prevent black flickering.
    canvas.hidden = true;
    const hasHCM = !!(pageColors?.background && pageColors?.foreground);

    let showCanvas: ((_y: boolean) => void) | undefined = (
      isLastShow: boolean,
    ) => {
      // In HCM, a final filter is applied on the canvas which means that
      // before it's applied we've normal colors. Consequently, to avoid to have
      // a final flash we just display it once all the drawing is done.
      if (!hasHCM || isLastShow) {
        canvas.hidden = false;
        showCanvas = undefined; // Only invoke the function once.
      }
    };
    canvasWrapper.append(canvas);
    this.canvas = canvas;

    const ctx = canvas.getContext("2d", { alpha: false })!;
    const outputScale = (this.outputScale = new OutputScale());

    if ((PDFJSDev || GENERIC) && this.maxCanvasPixels === 0) {
      const invScale = 1 / this.scale;
      // Use a scale that makes the canvas have the originally intended size
      // of the page.
      outputScale.sx *= invScale;
      outputScale.sy *= invScale;
      this.#hasRestrictedScaling = true;
    } else if (this.maxCanvasPixels > 0) {
      const pixelsInViewport = width * height;
      const maxScale = Math.sqrt(this.maxCanvasPixels / pixelsInViewport);
      if (outputScale.sx > maxScale || outputScale.sy > maxScale) {
        outputScale.sx = maxScale;
        outputScale.sy = maxScale;
        this.#hasRestrictedScaling = true;
      } else {
        this.#hasRestrictedScaling = false;
      }
    }
    const sfx = approximateFraction(outputScale.sx);
    const sfy = approximateFraction(outputScale.sy);

    canvas.width = roundToDivide(width * outputScale.sx, sfx[0]);
    canvas.height = roundToDivide(height * outputScale.sy, sfy[0]);
    const { style } = canvas;
    style.width = roundToDivide(width, sfx[1]) + "px";
    style.height = roundToDivide(height, sfy[1]) + "px";

    // Add the viewport so it's known what it was originally drawn with.
    this.#viewportMap.set(canvas, viewport);

    // Rendering area
    const transform = outputScale.scaled
      ? [outputScale.sx, 0, 0, outputScale.sy, 0, 0] as matrix_t
      : undefined;
    const renderContext: RenderP = {
      canvasContext: ctx,
      transform,
      viewport,
      annotationMode: this.#annotationMode,
      optionalContentConfigPromise: this._optionalContentConfigPromise,
      annotationCanvasMap: this._annotationCanvasMap,
      pageColors,
    };
    const renderTask = (this.renderTask = pdfPage.render(renderContext));
    renderTask.onContinue = renderContinueCallback;

    const resultPromise = renderTask.promise.then(
      async () => {
        showCanvas?.(true);
        await this.#finishRenderTask(renderTask);

        this.#renderTextLayer();

        if (this.annotationLayer) {
          await this.#renderAnnotationLayer();
        }

        const { annotationEditorUIManager } = this.#layerProperties!;

        if (!annotationEditorUIManager) {
          return;
        }

        this.drawLayer ||= new DrawLayerBuilder({ pageIndex: this.id });
        await this.#renderDrawLayer();
        this.drawLayer.setParent(canvasWrapper);

        if (!this.annotationEditorLayer) {
          this.annotationEditorLayer = new AnnotationEditorLayerBuilder({
            uiManager: annotationEditorUIManager,
            pdfPage,
            l10n,
            accessibilityManager: this._accessibilityManager,
            annotationLayer: this.annotationLayer?.annotationLayer,
            textLayer: this.textLayer,
            drawLayer: this.drawLayer.getDrawLayer(),
            onAppend: (annotationEditorLayerDiv) => {
              this.#addLayer(annotationEditorLayerDiv, "annotationEditorLayer");
            },
          });
        }
        this.#renderAnnotationEditorLayer();
      },
      (error) => {
        // When zooming with a `drawingDelay` set, avoid temporarily showing
        // a black canvas if rendering was cancelled before the `onContinue`-
        // callback had been invoked at least once.
        if (!(error instanceof RenderingCancelledException)) {
          showCanvas?.(true);
        }
        return this.#finishRenderTask(renderTask, error);
      },
    );

    if (pdfPage.isPureXfa) {
      if (!this.xfaLayer) {
        const { annotationStorage, linkService } = this.#layerProperties!;

        this.xfaLayer = new XfaLayerBuilder({
          pdfPage,
          annotationStorage,
          linkService,
        });
      }
      this.#renderXfaLayer();
    }

    div.setAttribute("data-loaded", true as any);

    this.eventBus.dispatch("pagerender", {
      source: this,
      pageNumber: this.id,
    });
    return resultPromise;
  }

  setPageLabel(label?: string) {
    this.pageLabel = typeof label === "string" ? label : undefined;

    this.div.setAttribute(
      "data-l10n-args",
      JSON.stringify({ page: this.pageLabel ?? this.id }),
    );

    if (this.pageLabel !== undefined) {
      this.div.setAttribute("data-page-label", this.pageLabel);
    } else {
      this.div.removeAttribute("data-page-label");
    }
  }

  /**
   * For use by the `PDFThumbnailView.setImage`-method.
   * @ignore
   */
  get thumbnailCanvas() {
    const { directDrawing, initialOptionalContent, regularAnnotations } =
      this.#useThumbnailCanvas;
    return directDrawing && initialOptionalContent && regularAnnotations
      ? this.canvas
      : undefined;
  }
}
/*80--------------------------------------------------------------------------*/
