/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2023
 */

/* Copyright 2014 Mozilla Foundation
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

import type { dot2d_t } from "@fe-lib/alias.ts";
import { div, html } from "@fe-lib/dom.ts";
import { PromiseCap } from "@fe-lib/util/PromiseCap.ts";
import { GECKOVIEW, GENERIC, PDFJSDev } from "@fe-src/global.ts";
import type {
  ExplicitDest,
  OptionalContentConfig,
  PDFDocumentProxy,
  PDFPageProxy,
  TextItem,
} from "../pdf.ts-src/pdf.ts";
import {
  AnnotationEditorType,
  AnnotationEditorUIManager,
  AnnotationMode,
  PermissionFlag,
  PixelsPerInch,
  shadow,
  version,
} from "../pdf.ts-src/pdf.ts";
import type { AltTextManager } from "./alt_text_manager.ts";
import { compatibilityParams } from "./app_options.ts";
import type { EventBus, EventMap } from "./event_utils.ts";
import type { IDownloadManager, IL10n, IPDFLinkService } from "./interfaces.ts";
import type { PDFFindController } from "./pdf_find_controller.ts";
import { SimpleLinkService } from "./pdf_link_service.ts";
import { PDFPageView } from "./pdf_page_view.ts";
import { PDFRenderingQueue } from "./pdf_rendering_queue.ts";
import type { PDFScriptingManager } from "./pdf_scripting_manager.ts";
import type { PageSpot, VisibleElement, VisibleElements } from "./ui_utils.ts";
import {
  DEFAULT_SCALE,
  DEFAULT_SCALE_DELTA,
  DEFAULT_SCALE_VALUE,
  docStyle,
  getVisibleElements,
  isPortraitOrientation,
  isValidRotation,
  isValidScrollMode,
  isValidSpreadMode,
  MAX_AUTO_SCALE,
  MAX_SCALE,
  MIN_SCALE,
  PresentationModeState,
  removeNullCharacters,
  RenderingStates,
  SCROLLBAR_PADDING,
  scrollIntoView,
  ScrollMode,
  SpreadMode,
  TextLayerMode,
  UNKNOWN_SCALE,
  VERTICAL_PADDING,
  watchScroll,
} from "./ui_utils.ts";

/* Ref. gulpfile.mjs of pdf.js */
const { NullL10n } = /*#static*/ GENERIC
  ? await import("./l10n_utils.ts")
  : await import("./stubs.ts");
/*80--------------------------------------------------------------------------*/

const DEFAULT_CACHE_SIZE = 10;

export const enum PagesCountLimit {
  FORCE_SCROLL_MODE_PAGE = 15000,
  FORCE_LAZY_PAGE_INIT = 7500,
  PAUSE_EAGER_PAGE_INIT = 250,
}

const ANNOTATION_EDITOR_MODE = compatibilityParams.annotationEditorMode as
  | AnnotationEditorType
  | undefined ??
  AnnotationEditorType.DISABLE;

function isValidAnnotationEditorMode(mode: AnnotationEditorType) {
  return (
    Object.values(AnnotationEditorType).includes(mode) &&
    mode !== AnnotationEditorType.DISABLE
  );
}

export type PageColors = {
  background: string;
  foreground: string;
};

export interface PDFViewerOptions {
  /**
   * The container for the viewer element.
   */
  container: HTMLDivElement;

  /**
   * The viewer element.
   */
  viewer?: HTMLDivElement;

  /**
   * The application event bus.
   */
  eventBus: EventBus;

  /**
   * The navigation/linking service.
   */
  linkService?: IPDFLinkService;

  /**
   * The download manager component.
   */
  downloadManager?: IDownloadManager;

  /** */
  altTextManager: AltTextManager | undefined;

  /**
   * The find controller component.
   */
  findController?: PDFFindController;

  /**
   * The scripting manager component.
   */
  scriptingManager: PDFScriptingManager | false | undefined;

  /**
   * The rendering queue object.
   */
  renderingQueue?: PDFRenderingQueue;

  /**
   * Removes the border shadow around the pages. The default value is `false`.
   */
  removePageBorders?: boolean;

  /**
   * Controls if the text layer used for
   * selection and searching is created, and if the improved text selection
   * behaviour is enabled. The constants from {TextLayerMode} should be used.
   * The default value is `TextLayerMode.ENABLE`.
   */
  textLayerMode: TextLayerMode | undefined;

  /**
   * Controls if the annotation layer is
   * created, and if interactive form elements or `AnnotationStorage`-data are
   * being rendered. The constants from {@link AnnotationMode} should be used;
   * see also {@link RenderParameters} and {@link GetOperatorListParameters}.
   * The default value is `AnnotationMode.ENABLE_FORMS`.
   */
  annotationMode?: AnnotationMode;

  /**
   * Enables the creation and editing
   * of new Annotations. The constants from {@link AnnotationEditorType} should
   * be used. The default value is `AnnotationEditorType.DISABLE`.
   */
  annotationEditorMode?: AnnotationEditorType;

  /**
   * Path for image resources, mainly
   * mainly for annotation icons. Include trailing slash.
   */
  imageResourcesPath: string | undefined;

  /**
   * Enables automatic rotation of
   * landscape pages upon printing. The default is `false`.
   */
  enablePrintAutoRotate: boolean | undefined;

  /**
   * Allows to use an OffscreenCanvas if needed.
   */
  isOffscreenCanvasSupported?: boolean;

  /**
   * The maximum supported canvas size in
   * total pixels, i.e. width * height. Use `-1` for no limit, or `0` for
   * CSS-only zooming. The default value is 4096 * 4096 (16 mega-pixels).
   */
  maxCanvasPixels: number | undefined;

  /**
   * Localization service.
   */
  l10n?: IL10n;

  /**
   * Enables PDF document permissions,
   * when they exist. The default value is `false`.
   */
  enablePermissions?: boolean;

  /**
   * Overwrites background and foreground colors
   * with user defined ones in order to improve readability in high contrast
   * mode.
   */
  pageColors: PageColors | undefined;
}

export class PDFPageViewBuffer {
  // Here we rely on the fact that `Set`s preserve the insertion order.
  #buf = new Set<PDFPageView>();
  has(view: PDFPageView) {
    return this.#buf.has(view);
  }
  [Symbol.iterator]() {
    return this.#buf.keys();
  }

  #size = 0;

  constructor(size: number) {
    this.#size = size;
  }

  push(view: PDFPageView) {
    const buf = this.#buf;
    if (buf.has(view)) {
      buf.delete(view); // Move the view to the "end" of the buffer.
    }
    buf.add(view);

    if (buf.size > this.#size) {
      this.#destroyFirstView();
    }
  }

  /**
   * After calling resize, the size of the buffer will be `newSize`.
   * The optional parameter `idsToKeep` is, if present, a Set of page-ids to
   * push to the back of the buffer, delaying their destruction. The size of
   * `idsToKeep` has no impact on the final size of the buffer; if `idsToKeep`
   * is larger than `newSize`, some of those pages will be destroyed anyway.
   */
  resize(newSize: number, idsToKeep?: Set<number>) {
    this.#size = newSize;

    const buf = this.#buf;
    if (idsToKeep) {
      const ii = buf.size;
      let i = 1;
      for (const view of buf) {
        if (idsToKeep.has(view.id)) {
          buf.delete(view); // Move the view to the "end" of the buffer.
          buf.add(view);
        }
        if (++i > ii) {
          break;
        }
      }
    }

    while (buf.size > this.#size) {
      this.#destroyFirstView();
    }
  }

  #destroyFirstView() {
    const firstView = this.#buf.keys().next().value;

    firstView?.destroy();
    this.#buf.delete(firstView);
  }
}

interface ScrollPageIntoViewP_ {
  /**
   * The page number.
   */
  pageNumber: number;

  /**
   * The original PDF destination array, in the
   * format: <page-ref> </XYZ|/FitXXX> <args..>
   */
  destArray?: ExplicitDest | undefined;

  /**
   * Allow negative page offsets.
   * The default value is `false`.
   */
  allowNegativeOffset?: boolean;

  /**
   * Ignore the zoom argument in
   * the destination array. The default value is `false`.
   */
  ignoreDestinationZoom?: boolean;
}

export interface PDFLocation {
  pageNumber: number;
  scale?: string | number;
  top: number;
  left: number;
  rotation: number;
  pdfOpenParams: string;
}

interface _PageView {
  div: HTMLDivElement;
  id: number;
}

export interface PageOverview {
  width: number;
  height: number;
  rotation: number;
}

interface ScrollModePageState {
  previousPageNumber: number;
  scrollDown: boolean;
  pages: PDFPageView[];
}

type ChangeScaleOptions = {
  noScroll?: boolean;
  preset?: boolean;
  drawingDelay?: number;
  scaleFactor?: number | undefined;
  steps?: number | undefined;
};

/**
 * Simple viewer control to display PDF content/pages.
 */
export class PDFViewer {
  container;
  #previousContainerHeight = 0;

  viewer;

  eventBus;
  linkService;
  downloadManager;
  findController;

  _scriptingManager;
  get enableScripting() {
    return !!this._scriptingManager;
  }

  #textLayerMode = TextLayerMode.ENABLE;

  #annotationMode = AnnotationMode.ENABLE_FORMS;
  get renderForms() {
    return this.#annotationMode === AnnotationMode.ENABLE_FORMS;
  }

  #annotationEditorUIManager: AnnotationEditorUIManager | undefined;
  #altTextManager: AltTextManager | undefined;
  #annotationEditorMode = AnnotationEditorType.NONE;
  imageResourcesPath;
  enablePrintAutoRotate;
  removePageBorders;
  isOffscreenCanvasSupported;
  maxCanvasPixels;
  l10n;
  #containerTopLeft: dot2d_t | undefined;
  #enablePermissions;
  pageColors: PageColors | undefined;

  defaultRenderingQueue: boolean;
  renderingQueue?: PDFRenderingQueue | undefined;

  scroll;
  presentationModeState = PresentationModeState.UNKNOWN;
  _onBeforeDraw: ((evt: EventMap["pagerender"]) => void) | undefined;
  _onAfterDraw: ((evt: EventMap["pagerendered"]) => void) | undefined;

  _pages!: PDFPageView[];
  get pagesCount() {
    return this._pages.length;
  }
  getPageView(index: number) {
    return this._pages[index];
  }

  protected _currentPageNumber!: number;
  get currentPageNumber() {
    return this._currentPageNumber;
  }
  /**
   * @param val The page number.
   */
  set currentPageNumber(val: number) {
    if (!Number.isInteger(val)) {
      throw new Error("Invalid page number.");
    }
    if (!this.pdfDocument) {
      return;
    }
    // The intent can be to just reset a scroll position and/or scale.
    if (!this.setCurrentPageNumber$(val, /* resetCurrentPageView = */ true)) {
      console.error(`currentPageNumber: "${val}" is not a valid page.`);
    }
  }

  /**
   * In PDF unit.
   */
  _currentScale!: number;
  get currentScale() {
    return this._currentScale !== UNKNOWN_SCALE
      ? this._currentScale
      : DEFAULT_SCALE;
  }
  /**
   * @param val Scale of the pages in percents.
   */
  set currentScale(val: number) {
    if (isNaN(val)) {
      throw new Error("Invalid numeric scale.");
    }
    if (!this.pdfDocument) {
      return;
    }
    this.#setScale(val, { noScroll: false });
  }

  #currentScaleValue: string | number = "";
  /** @final */
  get currentScaleValue() {
    return this.#currentScaleValue;
  }
  /**
   * @final
   * @param val The scale of the pages (in percent or predefined value).
   */
  set currentScaleValue(val: string | number) {
    if (!this.pdfDocument) {
      return;
    }
    this.#setScale(val, { noScroll: false });
  }

  _pageLabels?: string[] | undefined;
  /**
   * @return Returns the current page label, or `null` if no page labels exist.
   */
  get currentPageLabel() {
    return this._pageLabels?.[this._currentPageNumber - 1] ?? undefined;
  }
  /**
   * @param val The page label.
   */
  set currentPageLabel(val: string | undefined) {
    if (!this.pdfDocument) {
      return;
    }
    let page = +val! | 0; // Fallback page number.
    if (this._pageLabels) {
      const i = this._pageLabels.indexOf(val!);
      if (i >= 0) {
        page = i + 1;
      }
    }
    // The intent can be to just reset a scroll position and/or scale.
    if (!this.setCurrentPageNumber$(page, /* resetCurrentPageView = */ true)) {
      console.error(`currentPageLabel: "${val}" is not a valid page.`);
    }
  }

  #buffer!: PDFPageViewBuffer;
  getCachedPageViews() {
    return new Set(this.#buffer);
  }

  #location?: PDFLocation | undefined;

  _pagesRotation!: number;
  get pagesRotation() {
    return this._pagesRotation;
  }

  _optionalContentConfigPromise?:
    | Promise<OptionalContentConfig | undefined>
    | undefined;

  #firstPageCapability!: PromiseCap<PDFPageProxy>;
  get firstPagePromise(): Promise<PDFPageProxy> | null {
    return this.pdfDocument ? this.#firstPageCapability.promise : null;
  }

  #onePageRenderedCapability!: PromiseCap<{ timestamp: number }>;
  get onePageRendered() {
    return this.pdfDocument ? this.#onePageRenderedCapability.promise : null;
  }

  #pagesCapability!: PromiseCap;
  get pagesPromise() {
    return this.pdfDocument ? this.#pagesCapability.promise : undefined;
  }

  _scrollMode!: ScrollMode;
  /**
   * @return One of the values in {ScrollMode}.
   */
  get scrollMode(): ScrollMode {
    return this._scrollMode;
  }

  _previousScrollMode!: ScrollMode;

  _spreadMode!: SpreadMode;
  /**
   * @return One of the values in {SpreadMode}.
   */
  get spreadMode(): SpreadMode {
    return this._spreadMode;
  }

  #resizeObserver = new ResizeObserver(this.#resizeObserverCallback.bind(this));
  #scrollModePageState!: ScrollModePageState;
  #onVisibilityChange: (() => void) | undefined;
  #scaleTimeoutId: number | undefined;

  pdfDocument?: PDFDocumentProxy | undefined;

  #getAllTextInProgress = false;
  #interruptCopyCondition = false;
  #hiddenCopyElement: HTMLDivElement | undefined;
  #copyCallbackBound: ((_x: ClipboardEvent) => void) | undefined;

  constructor(options: PDFViewerOptions) {
    // const viewerVersion =
    //   typeof PDFJSDev !== "undefined" ? PDFJSDev.eval("BUNDLE_VERSION") : null;
    const viewerVersion = 0;
    if (version !== viewerVersion) {
      throw new Error(
        `The API version "${version}" does not match the Viewer version "${viewerVersion}".`,
      );
    }
    this.container = options.container;
    this.viewer = options.viewer ||
      options.container.firstElementChild as HTMLDivElement;

    /*#static*/ if (PDFJSDev || GENERIC) {
      if (this.container?.tagName !== "DIV" || this.viewer?.tagName !== "DIV") {
        throw new Error("Invalid `container` and/or `viewer` option.");
      }

      if (
        this.container.offsetParent &&
        getComputedStyle(this.container).position !== "absolute"
      ) {
        throw new Error("The `container` must be absolutely positioned.");
      }
    }
    this.#resizeObserver.observe(this.container);

    this.eventBus = options.eventBus;
    this.linkService = options.linkService || new SimpleLinkService();
    this.downloadManager = options.downloadManager;
    this.findController = options.findController;
    this.#altTextManager = options.altTextManager;

    if (this.findController) {
      this.findController.onIsPageVisible = (pageNumber) =>
        this.getVisiblePages$().ids!.has(pageNumber);
    }
    this._scriptingManager = options.scriptingManager || undefined;
    this.#textLayerMode = options.textLayerMode ?? TextLayerMode.ENABLE;
    this.#annotationMode = options.annotationMode ??
      AnnotationMode.ENABLE_FORMS;
    this.#annotationEditorMode = options.annotationEditorMode ??
      ANNOTATION_EDITOR_MODE;
    this.imageResourcesPath = options.imageResourcesPath || "";
    this.enablePrintAutoRotate = options.enablePrintAutoRotate || false;
    /*#static*/ if (PDFJSDev || GENERIC) {
      this.removePageBorders = options.removePageBorders || false;
    }
    this.isOffscreenCanvasSupported = options.isOffscreenCanvasSupported ??
      true;
    this.maxCanvasPixels = options.maxCanvasPixels;
    this.l10n = options.l10n || NullL10n;
    this.#enablePermissions = options.enablePermissions || false;
    this.pageColors = options?.pageColors;

    this.defaultRenderingQueue = !options.renderingQueue;
    if ((PDFJSDev || GENERIC) && this.defaultRenderingQueue) {
      // Custom rendering queue is not specified, using default one
      this.renderingQueue = new PDFRenderingQueue();
      this.renderingQueue.setViewer(this);
    } else {
      this.renderingQueue = options.renderingQueue;
    }

    this.scroll = watchScroll(this.container, this._scrollUpdate.bind(this));
    this.presentationModeState = PresentationModeState.UNKNOWN;
    this._onBeforeDraw = this._onAfterDraw = undefined;
    this._resetView();

    /*#static*/ if (PDFJSDev || GENERIC) {
      if (this.removePageBorders) {
        this.viewer.classList.add("removePageBorders");
      }
    }

    this.#updateContainerHeightCss();

    // Trigger API-cleanup, once thumbnail rendering has finished,
    // if the relevant pageView is *not* cached in the buffer.
    this.eventBus._on("thumbnailrendered", ({ pageNumber, pdfPage }) => {
      const pageView = this._pages[pageNumber - 1];
      if (!this.#buffer.has(pageView)) {
        pdfPage?.cleanup();
      }
    });

    /*#static*/ if (PDFJSDev || GENERIC) {
      if (this.l10n === NullL10n) {
        // Ensure that Fluent is connected in e.g. the COMPONENTS build.
        this.l10n!.translate(this.container);
      }
    }
  }

  /**
   * @return True if all {PDFPageView} objects are initialized.
   */
  get pageViewsReady() {
    // Prevent printing errors when 'disableAutoFetch' is set, by ensuring
    // that *all* pages have in fact been completely loaded.
    return (
      this.#pagesCapability.settled &&
      this._pages.every((pageView) => pageView?.pdfPage)
    );
  }

  /**
   * @final
   * @return Whether the pageNumber is valid (within bounds).
   */
  protected setCurrentPageNumber$(val: number, resetCurrentPageView = false) {
    if (this._currentPageNumber === val) {
      if (resetCurrentPageView) {
        this.#resetCurrentPageView();
      }
      return true;
    }

    if (!(0 < val && val <= this.pagesCount)) {
      return false;
    }
    const previous = this._currentPageNumber;
    this._currentPageNumber = val;

    this.eventBus.dispatch("pagechanging", {
      source: this,
      pageNumber: val,
      pageLabel: this._pageLabels?.[val - 1] ?? undefined,
      previous,
    });

    if (resetCurrentPageView) {
      this.#resetCurrentPageView();
    }
    return true;
  }

  /**
   * @param rotation The rotation of the pages (0, 90, 180, 270).
   */
  set pagesRotation(rotation: number) {
    if (!isValidRotation(rotation)) {
      throw new Error("Invalid pages rotation angle.");
    }
    if (!this.pdfDocument) {
      return;
    }
    // Normalize the rotation, by clamping it to the [0, 360) range.
    rotation %= 360;
    if (rotation < 0) {
      rotation += 360;
    }
    if (this._pagesRotation === rotation) {
      // The rotation didn't change.
      return;
    }
    this._pagesRotation = rotation;

    const pageNumber = this._currentPageNumber;

    this.refresh(true, { rotation });

    // Prevent errors in case the rotation changes *before* the scale has been
    // set to a non-default value.
    if (this.#currentScaleValue) {
      this.#setScale(this.#currentScaleValue, { noScroll: true });
    }

    this.eventBus.dispatch("rotationchanging", {
      source: this,
      pagesRotation: rotation,
      pageNumber,
    });

    if (this.defaultRenderingQueue) {
      this.update();
    }
  }

  get _layerProperties() {
    const self = this;
    return shadow(this, "_layerProperties", {
      get annotationEditorUIManager() {
        return self.#annotationEditorUIManager;
      },
      get annotationStorage() {
        return self.pdfDocument?.annotationStorage;
      },
      get downloadManager() {
        return self.downloadManager;
      },
      get enableScripting() {
        return !!self._scriptingManager;
      },
      get fieldObjectsPromise() {
        return self.pdfDocument?.getFieldObjects();
      },
      get findController() {
        return self.findController;
      },
      get hasJSActionsPromise() {
        return self.pdfDocument?.hasJSActions();
      },
      get linkService() {
        return self.linkService;
      },
    });
  }

  /**
   * Currently only *some* permissions are supported.
   */
  #initializePermissions(permissions?: PermissionFlag[]) {
    const params = {
      annotationEditorMode: this.#annotationEditorMode,
      annotationMode: this.#annotationMode,
      textLayerMode: this.#textLayerMode,
    };
    if (!permissions) {
      return params;
    }

    if (
      !permissions.includes(PermissionFlag.COPY) &&
      this.#textLayerMode === TextLayerMode.ENABLE
    ) {
      params.textLayerMode = TextLayerMode.ENABLE_PERMISSIONS;
    }

    if (!permissions.includes(PermissionFlag.MODIFY_CONTENTS)) {
      params.annotationEditorMode = AnnotationEditorType.DISABLE;
    }

    if (
      !permissions.includes(PermissionFlag.MODIFY_ANNOTATIONS) &&
      !permissions.includes(PermissionFlag.FILL_INTERACTIVE_FORMS) &&
      this.#annotationMode === AnnotationMode.ENABLE_FORMS
    ) {
      params.annotationMode = AnnotationMode.ENABLE;
    }
    return params;
  }

  #onePageRenderedOrForceFetch() {
    // Unless the viewer *and* its pages are visible, rendering won't start and
    // `this.#onePageRenderedCapability` thus won't be resolved.
    // To ensure that automatic printing, on document load, still works even in
    // those cases we force-allow fetching of all pages when:
    //  - The current window/tab is inactive, which will prevent rendering since
    //    `requestAnimationFrame` is being used; fixes bug 1746213.
    //  - The viewer is hidden in the DOM, e.g. in a `display: none` <iframe>
    //    element; fixes bug 1618621.
    //  - The viewer is visible, but none of the pages are (e.g. if the
    //    viewer is very small); fixes bug 1618955.
    if (
      document.visibilityState === "hidden" ||
      !this.container.offsetParent ||
      this.getVisiblePages$().views.length === 0
    ) {
      return Promise.resolve();
    }

    // Handle the window/tab becoming inactive *after* rendering has started;
    // fixes (another part of) bug 1746213.
    const visibilityChangePromise = new Promise<void>((resolve) => {
      this.#onVisibilityChange = () => {
        if (document.visibilityState !== "hidden") {
          return;
        }
        resolve();

        document.off("visibilitychange", this.#onVisibilityChange!);
        this.#onVisibilityChange = undefined;
      };
      document.on("visibilitychange", this.#onVisibilityChange);
    });

    return Promise.race([
      this.#onePageRenderedCapability.promise,
      visibilityChangePromise,
    ]);
  }

  async getAllText() {
    const texts = [];
    const buffer = [];
    for (
      let pageNum = 1, pagesCount = this.pdfDocument!.numPages;
      pageNum <= pagesCount;
      ++pageNum
    ) {
      if (this.#interruptCopyCondition) {
        return null;
      }
      buffer.length = 0;
      const page = await this.pdfDocument!.getPage(pageNum);
      // By default getTextContent pass disableNormalization equals to false
      // which is fine because we want a normalized string.
      const { items } = await page.getTextContent();
      for (const item of items as TextItem[]) {
        if (item.str) {
          buffer.push(item.str);
        }
        if (item.hasEOL) {
          buffer.push("\n");
        }
      }
      texts.push(removeNullCharacters(buffer.join("")));
    }

    return texts.join("\n");
  }

  #copyCallback(textLayerMode: TextLayerMode, event: ClipboardEvent) {
    const selection = document.getSelection()!;
    const { focusNode, anchorNode } = selection;
    if (
      anchorNode &&
      focusNode &&
      selection.containsNode(this.#hiddenCopyElement!)
    ) {
      // About the condition above:
      //  - having non-null anchorNode and focusNode are here to guaranty that
      //    we have at least a kind of selection.
      //  - this.#hiddenCopyElement is an invisible element which is impossible
      //    to select manually (its display is none) but ctrl+A will select all
      //    including this element so having it in the selection means that all
      //    has been selected.

      if (
        this.#getAllTextInProgress ||
        textLayerMode === TextLayerMode.ENABLE_PERMISSIONS
      ) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      this.#getAllTextInProgress = true;

      // TODO: if all the pages are rendered we don't need to wait for
      // getAllText and we could just get text from the Selection object.

      // Select all the document.
      const savedCursor = this.container.style.cursor;
      this.container.style.cursor = "wait";

      const interruptCopy = (ev: KeyboardEvent) => (
        this.#interruptCopyCondition = ev.key === "Escape"
      );
      window.on("keydown", interruptCopy);

      this.getAllText()
        .then(async (text) => {
          if (text !== null) {
            await navigator.clipboard.writeText(text);
          }
        })
        .catch((reason) => {
          console.warn(
            `Something goes wrong when extracting the text: ${reason.message}`,
          );
        })
        .finally(() => {
          this.#getAllTextInProgress = false;
          this.#interruptCopyCondition = false;
          window.off("keydown", interruptCopy);
          this.container.style.cursor = savedCursor;
        });

      event.preventDefault();
      event.stopPropagation();
    }
  }

  /** @final */
  setDocument(pdfDocument?: PDFDocumentProxy) {
    if (this.pdfDocument) {
      this.eventBus.dispatch("pagesdestroy", { source: this });

      this._cancelRendering();
      this._resetView();

      if (this.findController) {
        this.findController.setDocument();
      }
      if (this._scriptingManager) {
        this._scriptingManager.setDocument();
      }
      if (this.#annotationEditorUIManager) {
        this.#annotationEditorUIManager.destroy();
        this.#annotationEditorUIManager = undefined;
      }
    }

    this.pdfDocument = pdfDocument;
    if (!pdfDocument) {
      return;
    }
    const pagesCount = pdfDocument.numPages;
    const firstPagePromise = pdfDocument.getPage(1);
    // Rendering (potentially) depends on this, hence fetching it immediately.
    const optionalContentConfigPromise = pdfDocument.getOptionalContentConfig();
    const permissionsPromise = this.#enablePermissions
      ? pdfDocument.getPermissions()
      : Promise.resolve(undefined);

    // Given that browsers don't handle huge amounts of DOM-elements very well,
    // enforce usage of PAGE-scrolling when loading *very* long/large documents.
    if (pagesCount > PagesCountLimit.FORCE_SCROLL_MODE_PAGE) {
      console.warn(
        "Forcing PAGE-scrolling for performance reasons, given the length of the document.",
      );
      const mode = (this._scrollMode = ScrollMode.PAGE);
      this.eventBus.dispatch("scrollmodechanged", { source: this, mode });
    }

    this.#pagesCapability.promise.then(
      () => {
        this.eventBus.dispatch("pagesloaded", { source: this, pagesCount });
      },
      () => {
        /* Prevent "Uncaught (in promise)"-messages in the console. */
      },
    );

    this._onBeforeDraw = (evt: EventMap["pagerender"]) => {
      const pageView = this._pages[evt.pageNumber - 1];
      if (!pageView) {
        return;
      }
      // Add the page to the buffer at the start of drawing. That way it can be
      // evicted from the buffer and destroyed even if we pause its rendering.
      this.#buffer.push(pageView);
    };
    this.eventBus._on("pagerender", this._onBeforeDraw);

    this._onAfterDraw = (evt: EventMap["pagerendered"]) => {
      if (evt.cssTransform || this.#onePageRenderedCapability.settled) {
        return;
      }
      this.#onePageRenderedCapability.resolve({ timestamp: evt.timestamp });

      this.eventBus._off("pagerendered", this._onAfterDraw!);
      this._onAfterDraw = undefined;

      if (this.#onVisibilityChange) {
        document.off("visibilitychange", this.#onVisibilityChange);
        this.#onVisibilityChange = undefined;
      }
    };
    this.eventBus._on("pagerendered", this._onAfterDraw);

    // Fetch a single page so we can get a viewport that will be the default
    // viewport for all pages
    Promise.all([firstPagePromise, permissionsPromise])
      .then(([firstPdfPage, permissions]) => {
        if (pdfDocument !== this.pdfDocument) {
          return; // The document was closed while the first page resolved.
        }
        this.#firstPageCapability.resolve(firstPdfPage);
        this._optionalContentConfigPromise = optionalContentConfigPromise;

        const {
          annotationEditorMode,
          annotationMode,
          textLayerMode,
        } = this.#initializePermissions(permissions);

        if (textLayerMode !== TextLayerMode.DISABLE) {
          const element = (this.#hiddenCopyElement = div());
          element.id = "hiddenCopyElement";
          this.viewer.before(element);
        }

        if (annotationEditorMode !== AnnotationEditorType.DISABLE) {
          const mode = annotationEditorMode;

          if (pdfDocument.isPureXfa) {
            console.warn("Warning: XFA-editing is not implemented.");
          } else if (isValidAnnotationEditorMode(mode)) {
            this.#annotationEditorUIManager = new AnnotationEditorUIManager(
              this.container,
              this.viewer,
              this.#altTextManager,
              this.eventBus,
              pdfDocument,
              this.pageColors,
            );
            if (mode !== AnnotationEditorType.NONE) {
              this.#annotationEditorUIManager.updateMode(mode);
            }
          } else {
            console.error(`Invalid AnnotationEditor mode: ${mode}`);
          }
        }

        const viewerElement = this._scrollMode === ScrollMode.PAGE
          ? undefined
          : this.viewer;
        const scale = this.currentScale;
        const viewport = firstPdfPage.getViewport({
          scale: scale * PixelsPerInch.PDF_TO_CSS_UNITS,
        });
        // Ensure that the various layers always get the correct initial size,
        // see issue 15795.
        this.viewer.style.setProperty("--scale-factor", viewport.scale as any);
        if (
          this.pageColors?.foreground === "CanvasText" ||
          this.pageColors?.background === "Canvas"
        ) {
          this.viewer.style.setProperty(
            "--hcm-highlight-filter",
            pdfDocument.filterFactory.addHighlightHCMFilter(
              "CanvasText",
              "Canvas",
              "HighlightText",
              "Highlight",
            ),
          );
        }

        for (let pageNum = 1; pageNum <= pagesCount; ++pageNum) {
          const pageView = new PDFPageView({
            container: viewerElement,
            eventBus: this.eventBus,
            id: pageNum,
            scale,
            defaultViewport: viewport.clone(),
            optionalContentConfigPromise,
            renderingQueue: this.renderingQueue,
            textLayerMode,
            annotationMode,
            imageResourcesPath: this.imageResourcesPath,
            isOffscreenCanvasSupported: this.isOffscreenCanvasSupported,
            maxCanvasPixels: this.maxCanvasPixels,
            pageColors: this.pageColors,
            l10n: this.l10n,
            layerProperties: this._layerProperties,
          });
          this._pages.push(pageView);
        }
        // Set the first `pdfPage` immediately, since it's already loaded,
        // rather than having to repeat the `PDFDocumentProxy.getPage` call in
        // the `this.#ensurePdfPageLoaded` method before rendering can start.
        const firstPageView = this._pages[0];
        if (firstPageView) {
          firstPageView.setPdfPage(firstPdfPage);
          this.linkService.cachePageRef(1, firstPdfPage.ref);
        }

        if (this._scrollMode === ScrollMode.PAGE) {
          // Ensure that the current page becomes visible on document load.
          this.#ensurePageViewVisible();
        } else if (this._spreadMode !== SpreadMode.NONE) {
          this._updateSpreadMode();
        }

        // Fetch all the pages since the viewport is needed before printing
        // starts to create the correct size canvas. Wait until one page is
        // rendered so we don't tie up too many resources early on.
        this.#onePageRenderedOrForceFetch().then(async () => {
          this.findController?.setDocument(pdfDocument); // Enable searching.
          this._scriptingManager?.setDocument(pdfDocument); // Enable scripting.

          if (this.#hiddenCopyElement) {
            this.#copyCallbackBound = this.#copyCallback.bind(
              this,
              textLayerMode,
            );
            document.on("copy", this.#copyCallbackBound);
          }

          if (this.#annotationEditorUIManager) {
            // Ensure that the Editor buttons, in the toolbar, are updated.
            this.eventBus.dispatch("annotationeditormodechanged", {
              source: this,
              mode: this.#annotationEditorMode,
            });
          }

          // In addition to 'disableAutoFetch' being set, also attempt to reduce
          // resource usage when loading *very* long/large documents.
          if (
            pdfDocument.loadingParams.disableAutoFetch ||
            pagesCount > PagesCountLimit.FORCE_LAZY_PAGE_INIT
          ) {
            // XXX: Printing is semi-broken with auto fetch disabled.
            this.#pagesCapability.resolve();
            return;
          }
          let getPagesLeft = pagesCount - 1; // The first page was already loaded.

          if (getPagesLeft <= 0) {
            this.#pagesCapability.resolve();
            return;
          }
          for (let pageNum = 2; pageNum <= pagesCount; ++pageNum) {
            const promise = pdfDocument.getPage(pageNum).then(
              (pdfPage) => {
                const pageView = this._pages[pageNum - 1];
                if (!pageView.pdfPage) {
                  pageView.setPdfPage(pdfPage);
                }
                this.linkService.cachePageRef(pageNum, pdfPage.ref);
                if (--getPagesLeft === 0) {
                  this.#pagesCapability.resolve();
                }
              },
              (reason) => {
                console.error(
                  `Unable to get page ${pageNum} to initialize viewer`,
                  reason,
                );
                if (--getPagesLeft === 0) {
                  this.#pagesCapability.resolve();
                }
              },
            );

            if (pageNum % PagesCountLimit.PAUSE_EAGER_PAGE_INIT === 0) {
              await promise;
            }
          }
        });

        this.eventBus.dispatch("pagesinit", { source: this });

        pdfDocument.getMetadata().then(({ info }) => {
          if (pdfDocument !== this.pdfDocument) {
            // The document was closed while the metadata resolved.
            return;
          }
          if (info.Language) {
            this.viewer.lang = info.Language;
          }
        });

        if (this.defaultRenderingQueue) {
          this.update();
        }
      })
      .catch((reason) => {
        console.error("Unable to initialize viewer", reason);

        this.#pagesCapability.reject(reason);
      });
  }

  setPageLabels(labels: string[] | null) {
    if (!this.pdfDocument) {
      return;
    }
    if (!labels) {
      this._pageLabels = undefined;
    } else if (
      !(Array.isArray(labels) && this.pdfDocument.numPages === labels.length)
    ) {
      this._pageLabels = undefined;
      console.error(`setPageLabels: Invalid page labels.`);
    } else {
      this._pageLabels = labels;
    }
    // Update all the `PDFPageView` instances.
    for (let i = 0, ii = this._pages.length; i < ii; i++) {
      this._pages[i].setPageLabel(this._pageLabels?.[i] ?? undefined);
    }
  }

  protected _resetView() {
    this._pages = [];
    this._currentPageNumber = 1;
    this._currentScale = UNKNOWN_SCALE;
    this.#currentScaleValue = "";
    this._pageLabels = undefined;
    this.#buffer = new PDFPageViewBuffer(DEFAULT_CACHE_SIZE);
    this.#location = undefined;
    this._pagesRotation = 0;
    this._optionalContentConfigPromise = undefined;
    this.#firstPageCapability = new PromiseCap();
    this.#onePageRenderedCapability = new PromiseCap();
    this.#pagesCapability = new PromiseCap();
    this._scrollMode = ScrollMode.VERTICAL;
    this._previousScrollMode = ScrollMode.UNKNOWN;
    this._spreadMode = SpreadMode.NONE;

    this.#scrollModePageState = {
      previousPageNumber: 1,
      scrollDown: true,
      pages: [],
    };

    if (this._onBeforeDraw) {
      this.eventBus._off("pagerender", this._onBeforeDraw);
      this._onBeforeDraw = undefined;
    }
    if (this._onAfterDraw) {
      this.eventBus._off("pagerendered", this._onAfterDraw);
      this._onAfterDraw = undefined;
    }
    if (this.#onVisibilityChange) {
      document.off("visibilitychange", this.#onVisibilityChange);
      this.#onVisibilityChange = undefined;
    }
    // Remove the pages from the DOM...
    this.viewer.textContent = "";
    // ... and reset the Scroll mode CSS class(es) afterwards.
    this._updateScrollMode();

    this.viewer.removeAttribute("lang");

    if (this.#hiddenCopyElement) {
      document.off("copy", this.#copyCallbackBound!);
      this.#copyCallbackBound = undefined;

      this.#hiddenCopyElement.remove();
      this.#hiddenCopyElement = undefined;
    }
  }

  #ensurePageViewVisible() {
    if (this._scrollMode !== ScrollMode.PAGE) {
      throw new Error("#ensurePageViewVisible: Invalid scrollMode value.");
    }
    const pageNumber = this._currentPageNumber,
      state = this.#scrollModePageState,
      viewer = this.viewer;

    // Temporarily remove all the pages from the DOM...
    viewer.textContent = "";
    // ... and clear out the active ones.
    state.pages.length = 0;

    if (this._spreadMode === SpreadMode.NONE && !this.isInPresentationMode) {
      // Finally, append the new page to the viewer.
      const pageView = this._pages[pageNumber - 1];
      viewer.append(pageView.div);

      state.pages.push(pageView);
    } else {
      const pageIndexSet = new Set<number>(),
        parity = this._spreadMode - 1;

      // Determine the pageIndices in the new spread.
      if (parity === -1) {
        // PresentationMode is active, with `SpreadMode.NONE` set.
        pageIndexSet.add(pageNumber - 1);
      } else if (pageNumber % 2 !== parity) {
        // Left-hand side page.
        pageIndexSet.add(pageNumber - 1);
        pageIndexSet.add(pageNumber);
      } else {
        // Right-hand side page.
        pageIndexSet.add(pageNumber - 2);
        pageIndexSet.add(pageNumber - 1);
      }

      // Finally, append the new pages to the viewer and apply the spreadMode.
      const spread = div();
      spread.className = "spread";

      if (this.isInPresentationMode) {
        const dummyPage = div();
        dummyPage.className = "dummyPage";
        spread.append(dummyPage);
      }

      for (const i of pageIndexSet) {
        const pageView = this._pages[i];
        if (!pageView) {
          continue;
        }
        spread.append(pageView.div);

        state.pages.push(pageView);
      }
      viewer.append(spread);
    }

    state.scrollDown = pageNumber >= state.previousPageNumber;
    state.previousPageNumber = pageNumber;
  }

  _scrollUpdate() {
    if (this.pagesCount === 0) {
      return;
    }
    this.update();
  }

  #scrollIntoView(
    pageView: _PageView,
    pageSpot: PageSpot | undefined = undefined,
  ) {
    const { div, id } = pageView;

    // Ensure that `this._currentPageNumber` is correct, when `#scrollIntoView`
    // is called directly (and not from `#resetCurrentPageView`).
    if (this._currentPageNumber !== id) {
      this.setCurrentPageNumber$(id);
    }
    if (this._scrollMode === ScrollMode.PAGE) {
      this.#ensurePageViewVisible();
      // Ensure that rendering always occurs, to avoid showing a blank page,
      // even if the current position doesn't change when the page is scrolled.
      this.update();
    }

    if (!pageSpot && !this.isInPresentationMode) {
      const left = div.offsetLeft + div.clientLeft,
        right = left + div.clientWidth;
      const { scrollLeft, clientWidth } = this.container;
      if (
        this._scrollMode === ScrollMode.HORIZONTAL ||
        left < scrollLeft ||
        right > scrollLeft + clientWidth
      ) {
        pageSpot = { left: 0, top: 0 };
      }
    }
    scrollIntoView(div, pageSpot);

    // Ensure that the correct *initial* document position is set, when any
    // OpenParameters are used, for documents with non-default Scroll/Spread
    // modes (fixes issue 15695). This is necessary since the scroll-handler
    // invokes the `update`-method asynchronously, and `this._location` could
    // thus be wrong when the initial zooming occurs in the default viewer.
    if (!this.#currentScaleValue && this.#location) {
      this.#location = undefined;
    }
  }

  /**
   * Prevent unnecessary re-rendering of all pages when the scale changes
   * only because of limited numerical precision.
   */
  #isSameScale(newScale: number) {
    return (
      newScale === this._currentScale ||
      Math.abs(newScale - this._currentScale) < 1e-15
    );
  }

  #setScaleUpdatePages(
    newScale: number,
    newValue: number | string,
    { noScroll = false, preset = false, drawingDelay = -1 }: ChangeScaleOptions,
  ) {
    this.#currentScaleValue = newValue.toString();

    if (this.#isSameScale(newScale)) {
      if (preset) {
        this.eventBus.dispatch("scalechanging", {
          source: this,
          scale: newScale,
          presetValue: newValue,
        });
      }
      return;
    }

    this.viewer.style.setProperty(
      "--scale-factor",
      newScale * PixelsPerInch.PDF_TO_CSS_UNITS as any,
    );

    const postponeDrawing = drawingDelay >= 0 && drawingDelay < 1000;
    this.refresh(true, {
      scale: newScale,
      drawingDelay: postponeDrawing ? drawingDelay : -1,
    });

    if (postponeDrawing) {
      this.#scaleTimeoutId = setTimeout(() => {
        this.#scaleTimeoutId = undefined;
        this.refresh();
      }, drawingDelay);
    }

    this._currentScale = newScale;

    if (!noScroll) {
      let page = this._currentPageNumber;
      let dest: ExplicitDest | undefined;
      if (
        this.#location &&
        !(this.isInPresentationMode || this.isChangingPresentationMode)
      ) {
        page = this.#location.pageNumber;
        dest = [
          null,
          { name: "XYZ" },
          this.#location.left,
          this.#location.top,
          null,
        ];
      }
      this.scrollPageIntoView({
        pageNumber: page,
        destArray: dest,
        allowNegativeOffset: true,
      });
    }

    this.eventBus.dispatch("scalechanging", {
      source: this,
      scale: newScale,
      presetValue: preset ? newValue : undefined,
    });

    if (this.defaultRenderingQueue) {
      this.update();
    }
  }

  get #pageWidthScaleFactor() {
    if (
      this._spreadMode !== SpreadMode.NONE &&
      this._scrollMode !== ScrollMode.HORIZONTAL
    ) {
      return 2;
    }
    return 1;
  }

  #setScale(value: string | number, options: ChangeScaleOptions) {
    let scale = parseFloat(value as any);

    if (scale > 0) {
      options.preset = false;
      this.#setScaleUpdatePages(scale, value, options);
    } else {
      const currentPage = this._pages[this._currentPageNumber - 1];
      if (!currentPage) {
        return;
      }
      let hPadding = SCROLLBAR_PADDING,
        vPadding = VERTICAL_PADDING;

      if (this.isInPresentationMode) {
        // Pages have a 2px (transparent) border in PresentationMode, see
        // the `web/pdf_viewer.css` file.
        hPadding = vPadding = 4; // 2 * 2px
        if (this._spreadMode !== SpreadMode.NONE) {
          // Account for two pages being visible in PresentationMode, thus
          // "doubling" the total border width.
          hPadding *= 2;
        }
      } else if ((PDFJSDev || GENERIC) && this.removePageBorders) {
        hPadding = vPadding = 0;
      } else if (this._scrollMode === ScrollMode.HORIZONTAL) {
        [hPadding, vPadding] = [vPadding, hPadding]; // Swap the padding values.
      }
      const pageWidthScale =
        (((this.container.clientWidth - hPadding) / currentPage.width) *
          currentPage.scale) /
        this.#pageWidthScaleFactor;
      const pageHeightScale =
        ((this.container.clientHeight - vPadding) / currentPage.height) *
        currentPage.scale;
      switch (value) {
        case "page-actual":
          scale = 1;
          break;
        case "page-width":
          scale = pageWidthScale;
          break;
        case "page-height":
          scale = pageHeightScale;
          break;
        case "page-fit":
          scale = Math.min(pageWidthScale, pageHeightScale);
          break;
        case "auto":
          // For pages in landscape mode, fit the page height to the viewer
          // *unless* the page would thus become too wide to fit horizontally.
          const horizontalScale = isPortraitOrientation(currentPage)
            ? pageWidthScale
            : Math.min(pageHeightScale, pageWidthScale);
          scale = Math.min(MAX_AUTO_SCALE, horizontalScale);
          break;
        default:
          console.error(`#setScale: "${value}" is an unknown zoom value.`);
          return;
      }
      options.preset = true;
      this.#setScaleUpdatePages(scale, value, options);
    }
  }

  /**
   * Refreshes page view: scrolls to the current page and updates the scale.
   */
  #resetCurrentPageView() {
    const pageView = this._pages[this._currentPageNumber - 1];

    if (this.isInPresentationMode) {
      // Fixes the case when PDF has different page sizes.
      this.#setScale(this.#currentScaleValue, { noScroll: true });
    }
    this.#scrollIntoView(pageView);
  }

  /**
   * @param label The page label.
   * @return The page number corresponding to the page label,
   *   or `null` when no page labels exist and/or the input is invalid.
   */
  pageLabelToPageNumber(label: string) {
    if (!this._pageLabels) {
      return null;
    }
    const i = this._pageLabels.indexOf(label);
    if (i < 0) {
      return null;
    }
    return i + 1;
  }

  /**
   * Scrolls page into view.
   */
  scrollPageIntoView({
    pageNumber,
    destArray,
    allowNegativeOffset = false,
    ignoreDestinationZoom = false,
  }: ScrollPageIntoViewP_) {
    if (!this.pdfDocument) {
      return;
    }
    const pageView = Number.isInteger(pageNumber) &&
      this._pages[pageNumber - 1];
    if (!pageView) {
      console.error(
        `scrollPageIntoView: "${pageNumber}" is not a valid pageNumber parameter.`,
      );
      return;
    }

    if (this.isInPresentationMode || !destArray) {
      this.setCurrentPageNumber$(pageNumber, /* resetCurrentPageView = */ true);
      return;
    }
    let x: number | null = 0,
      y: number | null = 0;
    let width = 0,
      height = 0,
      widthScale,
      heightScale;
    const changeOrientation = pageView.rotation % 180 !== 0;
    const pageWidth = (changeOrientation ? pageView.height : pageView.width) /
      pageView.scale /
      PixelsPerInch.PDF_TO_CSS_UNITS;
    const pageHeight = (changeOrientation ? pageView.width : pageView.height) /
      pageView.scale /
      PixelsPerInch.PDF_TO_CSS_UNITS;
    let scale: number | string = 0;
    switch (destArray[1].name) {
      case "XYZ":
        x = destArray[2]!;
        y = destArray[3]!;
        scale = destArray[4]!;
        // If x and/or y coordinates are not supplied, default to
        // _top_ left of the page (not the obvious bottom left,
        // since aligning the bottom of the intended page with the
        // top of the window is rarely helpful).
        x = x !== null ? x : 0;
        y = y !== null ? y : pageHeight;
        break;
      case "Fit":
      case "FitB":
        scale = "page-fit";
        break;
      case "FitH":
      case "FitBH":
        y = destArray[2]!;
        scale = "page-width";
        // According to the PDF spec, section 12.3.2.2, a `null` value in the
        // parameter should maintain the position relative to the new page.
        if (y === null && this.#location) {
          x = this.#location.left;
          y = this.#location.top;
        } else if (typeof y !== "number" || y < 0) {
          // The "top" value isn't optional, according to the spec, however some
          // bad PDF generators will pretend that it is (fixes bug 1663390).
          y = pageHeight;
        }
        break;
      case "FitV":
      case "FitBV":
        x = destArray[2]!;
        width = pageWidth;
        height = pageHeight;
        scale = "page-height";
        break;
      case "FitR":
        x = destArray[2]!;
        y = destArray[3]!;
        width = (destArray[4] as number) - x;
        height = (destArray[5] as number) - y;
        let hPadding = SCROLLBAR_PADDING,
          vPadding = VERTICAL_PADDING;

        /*#static*/ if (PDFJSDev || GENERIC) {
          if (this.removePageBorders) {
            hPadding = vPadding = 0;
          }
        }
        widthScale = (this.container.clientWidth - hPadding) /
          width /
          PixelsPerInch.PDF_TO_CSS_UNITS;
        heightScale = (this.container.clientHeight - vPadding) /
          height /
          PixelsPerInch.PDF_TO_CSS_UNITS;
        scale = Math.min(Math.abs(widthScale), Math.abs(heightScale));
        break;
      default:
        console.error(
          `scrollPageIntoView: "${
            (destArray[1] as any).name
          }" is not a valid destination type.`,
        );
        return;
    }

    if (!ignoreDestinationZoom) {
      if (scale && scale !== this._currentScale) {
        this.currentScaleValue = scale;
      } else if (this._currentScale === UNKNOWN_SCALE) {
        this.currentScaleValue = DEFAULT_SCALE_VALUE;
      }
    }

    if (scale === "page-fit" && !destArray[4]) {
      this.#scrollIntoView(pageView);
      return;
    }

    const boundingRect = [
      pageView.viewport.convertToViewportPoint(x, y),
      pageView.viewport.convertToViewportPoint(x + width, y + height),
    ];
    let left = Math.min(boundingRect[0][0], boundingRect[1][0]);
    let top = Math.min(boundingRect[0][1], boundingRect[1][1]);

    if (!allowNegativeOffset) {
      // Some bad PDF generators will create destinations with e.g. top values
      // that exceeds the page height. Ensure that offsets are not negative,
      // to prevent a previous page from becoming visible (fixes bug 874482).
      left = Math.max(left, 0);
      top = Math.max(top, 0);
    }
    this.#scrollIntoView(pageView, /* pageSpot = */ { left, top });
  }

  #updateLocation(firstPage: VisibleElement) {
    const currentScale = this._currentScale;
    const currentScaleValue = this.#currentScaleValue;
    const normalizedScaleValue =
      parseFloat(currentScaleValue as any) === currentScale
        ? Math.round(currentScale * 10000) / 100
        : currentScaleValue;

    const pageNumber = firstPage.id;
    const currentPageView = this._pages[pageNumber - 1];
    const container = this.container;
    const topLeft = currentPageView.getPagePoint(
      container.scrollLeft - firstPage.x,
      container.scrollTop - firstPage.y,
    );
    const intLeft = Math.round(topLeft[0]);
    const intTop = Math.round(topLeft[1]);

    let pdfOpenParams = `#page=${pageNumber}`;
    if (!this.isInPresentationMode) {
      pdfOpenParams += `&zoom=${normalizedScaleValue},${intLeft},${intTop}`;
    }

    this.#location = {
      pageNumber,
      scale: normalizedScaleValue,
      top: intTop,
      left: intLeft,
      rotation: this._pagesRotation,
      pdfOpenParams,
    };
  }

  /** @final */
  update() {
    const visible = this.getVisiblePages$();
    const visiblePages = visible.views,
      numVisiblePages = visiblePages.length;

    if (numVisiblePages === 0) {
      return;
    }

    const newCacheSize = Math.max(DEFAULT_CACHE_SIZE, 2 * numVisiblePages + 1);
    this.#buffer.resize(newCacheSize, visible.ids);

    this.renderingQueue!.renderHighestPriority(visible);

    const isSimpleLayout = this._spreadMode === SpreadMode.NONE &&
      (this._scrollMode === ScrollMode.PAGE ||
        this._scrollMode === ScrollMode.VERTICAL);
    const currentId = this._currentPageNumber;
    let stillFullyVisible = false;

    for (const page of visiblePages) {
      if (page.percent! < 100) {
        break;
      }
      if (page.id === currentId && isSimpleLayout) {
        stillFullyVisible = true;
        break;
      }
    }
    this.setCurrentPageNumber$(
      stillFullyVisible ? currentId : visiblePages[0].id,
    );

    this.#updateLocation(visible.first!);
    this.eventBus.dispatch("updateviewarea", {
      source: this,
      location: this.#location,
    });
  }

  containsElement(element: Node | null) {
    return this.container.contains(element);
  }

  focus() {
    this.container.focus();
  }

  get _isContainerRtl() {
    return getComputedStyle(this.container).direction === "rtl";
  }

  get isInPresentationMode() {
    return this.presentationModeState === PresentationModeState.FULLSCREEN;
  }

  get isChangingPresentationMode() {
    return this.presentationModeState === PresentationModeState.CHANGING;
  }

  get isHorizontalScrollbarEnabled() {
    return this.isInPresentationMode
      ? false
      : this.container.scrollWidth > this.container.clientWidth;
  }

  get isVerticalScrollbarEnabled() {
    return this.isInPresentationMode
      ? false
      : this.container.scrollHeight > this.container.clientHeight;
  }

  /** @final */
  protected getVisiblePages$() {
    const views = this._scrollMode === ScrollMode.PAGE
        ? this.#scrollModePageState.pages
        : this._pages,
      horizontal = this._scrollMode === ScrollMode.HORIZONTAL,
      rtl = horizontal && this._isContainerRtl;

    return getVisibleElements({
      scrollEl: this.container,
      views,
      sortByVisibility: true,
      horizontal,
      rtl,
    });
  }

  cleanup() {
    for (const pageView of this._pages) {
      if (pageView.renderingState !== RenderingStates.FINISHED) {
        pageView.reset();
      }
    }
  }

  protected _cancelRendering() {
    for (const pageView of this._pages) {
      pageView.cancelRendering();
    }
  }

  async #ensurePdfPageLoaded(pageView: PDFPageView) {
    if (pageView.pdfPage) {
      return pageView.pdfPage;
    }
    try {
      const pdfPage = await this.pdfDocument!.getPage(pageView.id);
      if (!pageView.pdfPage) {
        pageView.setPdfPage(pdfPage);
      }
      if (!this.linkService._cachedPageNumber?.(pdfPage!.ref!)) {
        this.linkService.cachePageRef(pageView.id, pdfPage.ref);
      }
      return pdfPage;
    } catch (reason) {
      console.error("Unable to get page for page view", reason);
      return null; // Page error -- there is nothing that can be done.
    }
  }

  #scrollAhead(visible: VisibleElements) {
    if (visible.first?.id === 1) {
      return true;
    } else if (visible.last?.id === this.pagesCount) {
      return false;
    }
    switch (this._scrollMode) {
      case ScrollMode.PAGE:
        return this.#scrollModePageState.scrollDown;
      case ScrollMode.HORIZONTAL:
        return this.scroll.right;
    }
    return this.scroll.down;
  }

  forceRendering(currentlyVisiblePages?: VisibleElements) {
    const visiblePages = currentlyVisiblePages || this.getVisiblePages$();
    const scrollAhead = this.#scrollAhead(visiblePages);
    const preRenderExtra = this._spreadMode !== SpreadMode.NONE &&
      this._scrollMode !== ScrollMode.HORIZONTAL;

    const pageView = this.renderingQueue!.getHighestPriority(
      visiblePages,
      this._pages,
      scrollAhead,
      preRenderExtra,
    );

    if (pageView) {
      this.#ensurePdfPageLoaded(pageView as PDFPageView).then(() => {
        this.renderingQueue!.renderView(pageView);
      });
      return true;
    }
    return false;
  }

  /**
   * @return Whether all pages of the PDF document have identical
   *   widths and heights.
   */
  get hasEqualPageSizes(): boolean {
    const firstPageView = this._pages[0];
    for (let i = 1, ii = this._pages.length; i < ii; ++i) {
      const pageView = this._pages[i];
      if (
        pageView.width !== firstPageView.width ||
        pageView.height !== firstPageView.height
      ) {
        return false;
      }
    }
    return true;
  }

  /**
   * Returns sizes of the pages.
   * @return Array of objects with width/height/rotation fields.
   */
  getPagesOverview(): PageOverview[] {
    let initialOrientation: boolean | undefined;
    return this._pages.map((pageView) => {
      const viewport = pageView.pdfPage!.getViewport({ scale: 1 });
      const orientation = isPortraitOrientation(viewport);
      if (initialOrientation === undefined) {
        initialOrientation = orientation;
      } else if (
        this.enablePrintAutoRotate &&
        orientation !== initialOrientation
      ) {
        // Rotate to fit the initial orientation.
        return {
          width: viewport.height,
          height: viewport.width,
          rotation: (viewport.rotation - 90) % 360,
        };
      }
      return {
        width: viewport.width,
        height: viewport.height,
        rotation: viewport.rotation,
      };
    });
  }

  get optionalContentConfigPromise() {
    if (!this.pdfDocument) {
      return Promise.resolve(undefined);
    }
    if (!this._optionalContentConfigPromise) {
      console.error("optionalContentConfigPromise: Not initialized yet.");
      // Prevent issues if the getter is accessed *before* the `onePageRendered`
      // promise has resolved; won't (normally) happen in the default viewer.
      return this.pdfDocument.getOptionalContentConfig();
    }
    return this._optionalContentConfigPromise;
  }

  /**
   * @param promise A promise that is
   *   resolved with an {@link OptionalContentConfig} instance.
   */
  set optionalContentConfigPromise(
    promise: Promise<OptionalContentConfig | undefined>,
  ) {
    if (!(promise instanceof Promise)) {
      throw new Error(`Invalid optionalContentConfigPromise: ${promise}`);
    }
    if (!this.pdfDocument) {
      return;
    }
    if (!this._optionalContentConfigPromise) {
      // Ignore the setter *before* the `onePageRendered` promise has resolved,
      // since it'll be overwritten anyway; won't happen in the default viewer.
      return;
    }
    this._optionalContentConfigPromise = promise;

    this.refresh(false, { optionalContentConfigPromise: promise });

    this.eventBus.dispatch("optionalcontentconfigchanged", {
      source: this,
      promise,
    });
  }

  /**
   * @param mode The direction in which the document pages should be
   *   laid out within the scrolling container.
   *   The constants from {ScrollMode} should be used.
   */
  set scrollMode(mode: ScrollMode) {
    if (PDFJSDev ? (window as any).isGECKOVIEW : GECKOVIEW) {
      // NOTE: Always ignore the pageLayout in GeckoView since there's
      // no UI available to change Scroll/Spread modes for the user.
      return;
    }
    if (this._scrollMode === mode) {
      return; // The Scroll mode didn't change.
    }
    if (!isValidScrollMode(mode)) {
      throw new Error(`Invalid scroll mode: ${mode}`);
    }

    if (this.pagesCount > PagesCountLimit.FORCE_SCROLL_MODE_PAGE) {
      return; // Disabled for performance reasons.
    }
    this._previousScrollMode = this._scrollMode;

    this._scrollMode = mode;
    this.eventBus.dispatch("scrollmodechanged", { source: this, mode });

    this._updateScrollMode(/* pageNumber = */ this._currentPageNumber);
  }

  _updateScrollMode(pageNumber?: number) {
    const scrollMode = this._scrollMode,
      viewer = this.viewer;

    viewer.classList.toggle(
      "scrollHorizontal",
      scrollMode === ScrollMode.HORIZONTAL,
    );
    viewer.classList.toggle("scrollWrapped", scrollMode === ScrollMode.WRAPPED);

    if (!this.pdfDocument || !pageNumber) {
      return;
    }

    if (scrollMode === ScrollMode.PAGE) {
      this.#ensurePageViewVisible();
    } else if (this._previousScrollMode === ScrollMode.PAGE) {
      // Ensure that the current spreadMode is still applied correctly when
      // the *previous* scrollMode was `ScrollMode.PAGE`.
      this._updateSpreadMode();
    }
    // Non-numeric scale values can be sensitive to the scroll orientation.
    // Call this before re-scrolling to the current page, to ensure that any
    // changes in scale don't move the current page.
    if (this.#currentScaleValue && isNaN(this.#currentScaleValue as any)) {
      this.#setScale(this.#currentScaleValue, { noScroll: true });
    }
    this.setCurrentPageNumber$(pageNumber, /* resetCurrentPageView = */ true);
    this.update();
  }

  /**
   * @param mode Group the pages in spreads, starting with odd- or
   *   even-number pages (unless `SpreadMode.NONE` is used).
   *   The constants from {SpreadMode} should be used.
   */
  set spreadMode(mode: SpreadMode) {
    if (PDFJSDev ? (window as any).isGECKOVIEW : GECKOVIEW) {
      // NOTE: Always ignore the pageLayout in GeckoView since there's
      // no UI available to change Scroll/Spread modes for the user.
      return;
    }
    if (this._spreadMode === mode) {
      return; // The Spread mode didn't change.
    }
    if (!isValidSpreadMode(mode)) {
      throw new Error(`Invalid spread mode: ${mode}`);
    }
    this._spreadMode = mode;
    this.eventBus.dispatch("spreadmodechanged", { source: this, mode });

    this._updateSpreadMode(/* pageNumber = */ this._currentPageNumber);
  }

  _updateSpreadMode(pageNumber?: number) {
    if (!this.pdfDocument) {
      return;
    }
    const viewer = this.viewer,
      pages = this._pages;

    if (this._scrollMode === ScrollMode.PAGE) {
      this.#ensurePageViewVisible();
    } else {
      // Temporarily remove all the pages from the DOM.
      viewer.textContent = "";

      if (this._spreadMode === SpreadMode.NONE) {
        for (const pageView of this._pages) {
          viewer.append(pageView.div);
        }
      } else {
        const parity = this._spreadMode - 1;
        let spread: HTMLDivElement | undefined;
        for (let i = 0, ii = pages.length; i < ii; ++i) {
          if (spread === undefined) {
            spread = html("div");
            spread.className = "spread";
            viewer.append(spread);
          } else if (i % 2 === parity) {
            spread = spread.cloneNode(false) as HTMLDivElement;
            viewer.append(spread);
          }
          spread.append(pages[i].div);
        }
      }
    }

    if (!pageNumber) {
      return;
    }

    // Non-numeric scale values can be sensitive to the scroll orientation.
    // Call this before re-scrolling to the current page, to ensure that any
    // changes in scale don't move the current page.
    if (this.#currentScaleValue && isNaN(<any> this.#currentScaleValue)) {
      this.#setScale(this.#currentScaleValue, { noScroll: true });
    }
    this.setCurrentPageNumber$(pageNumber, /* resetCurrentPageView = */ true);
    this.update();
  }

  /**
   * @private
   */
  _getPageAdvance(currentPageNumber: number, previous = false) {
    switch (this._scrollMode) {
      case ScrollMode.WRAPPED: {
        const { views } = this.getVisiblePages$(),
          pageLayout = new Map();

        // Determine the current (visible) page layout.
        for (const { id, y, percent, widthPercent } of views) {
          if (percent === 0 || widthPercent! < 100) {
            continue;
          }
          let yArray = pageLayout.get(y);
          if (!yArray) {
            pageLayout.set(y, yArray ||= []);
          }
          yArray.push(id);
        }
        // Find the row of the current page.
        for (const yArray of pageLayout.values()) {
          const currentIndex = yArray.indexOf(currentPageNumber);
          if (currentIndex === -1) {
            continue;
          }
          const numPages = yArray.length;
          if (numPages === 1) {
            break;
          }
          // Handle documents with varying page sizes.
          if (previous) {
            for (let i = currentIndex - 1, ii = 0; i >= ii; i--) {
              const currentId = yArray[i],
                expectedId = yArray[i + 1] - 1;
              if (currentId < expectedId) {
                return currentPageNumber - expectedId;
              }
            }
          } else {
            for (let i = currentIndex + 1, ii = numPages; i < ii; i++) {
              const currentId = yArray[i],
                expectedId = yArray[i - 1] + 1;
              if (currentId > expectedId) {
                return expectedId - currentPageNumber;
              }
            }
          }
          // The current row is "complete", advance to the previous/next one.
          if (previous) {
            const firstId = yArray[0];
            if (firstId < currentPageNumber) {
              return currentPageNumber - firstId + 1;
            }
          } else {
            const lastId = yArray[numPages - 1];
            if (lastId > currentPageNumber) {
              return lastId - currentPageNumber + 1;
            }
          }
          break;
        }
        break;
      }
      case ScrollMode.HORIZONTAL: {
        break;
      }
      case ScrollMode.PAGE:
      case ScrollMode.VERTICAL: {
        if (this._spreadMode === SpreadMode.NONE) {
          break; // Normal vertical scrolling.
        }
        const parity = this._spreadMode - 1;

        if (previous && currentPageNumber % 2 !== parity) {
          break; // Left-hand side page.
        } else if (!previous && currentPageNumber % 2 === parity) {
          break; // Right-hand side page.
        }
        const { views } = this.getVisiblePages$(),
          expectedId = previous ? currentPageNumber - 1 : currentPageNumber + 1;

        for (const { id, percent, widthPercent } of views) {
          if (id !== expectedId) {
            continue;
          }
          if (percent! > 0 && widthPercent === 100) {
            return 2;
          }
          break;
        }
        break;
      }
    }
    return 1;
  }

  /**
   * Go to the next page, taking scroll/spread-modes into account.
   * @return Whether navigation occurred.
   */
  nextPage(): boolean {
    const currentPageNumber = this._currentPageNumber,
      pagesCount = this.pagesCount;

    if (currentPageNumber >= pagesCount) {
      return false;
    }
    const advance =
      this._getPageAdvance(currentPageNumber, /* previous = */ false) || 1;

    this.currentPageNumber = Math.min(currentPageNumber + advance, pagesCount);
    return true;
  }

  /**
   * Go to the previous page, taking scroll/spread-modes into account.
   * @return Whether navigation occurred.
   */
  previousPage(): boolean {
    const currentPageNumber = this._currentPageNumber;

    if (currentPageNumber <= 1) {
      return false;
    }
    const advance =
      this._getPageAdvance(currentPageNumber, /* previous = */ true) || 1;

    this.currentPageNumber = Math.max(currentPageNumber - advance, 1);
    return true;
  }

  /**
   * Increase the current zoom level one, or more, times.
   */
  increaseScale({ drawingDelay, scaleFactor, steps }: ChangeScaleOptions = {}) {
    if (!this.pdfDocument) {
      return;
    }
    let newScale: number = this._currentScale;
    if (scaleFactor! > 1) {
      newScale = Math.round(newScale * scaleFactor! * 100) / 100;
    } else {
      steps ??= 1;
      do {
        newScale =
          Math.ceil((newScale * DEFAULT_SCALE_DELTA).toFixed(2) as any * 10) /
          10;
      } while (--steps > 0 && newScale < MAX_SCALE);
    }
    this.#setScale(Math.min(MAX_SCALE, newScale), {
      noScroll: false,
      drawingDelay,
    } as ChangeScaleOptions);
  }

  /**
   * Decrease the current zoom level one, or more, times.
   */
  decreaseScale({ drawingDelay, scaleFactor, steps }: ChangeScaleOptions = {}) {
    if (!this.pdfDocument) {
      return;
    }
    let newScale: string | number = this._currentScale;
    if (0 < scaleFactor! && scaleFactor! < 1) {
      newScale = Math.round(newScale * scaleFactor! * 100) / 100;
    } else {
      steps ??= 1;
      do {
        newScale =
          Math.floor((newScale / DEFAULT_SCALE_DELTA).toFixed(2) as any * 10) /
          10;
      } while (--steps > 0 && newScale > MIN_SCALE);
    }
    this.#setScale(Math.max(MIN_SCALE, newScale), {
      noScroll: false,
      drawingDelay,
    } as ChangeScaleOptions);
  }

  #updateContainerHeightCss(height = this.container.clientHeight) {
    if (height !== this.#previousContainerHeight) {
      this.#previousContainerHeight = height;
      docStyle!.setProperty("--viewer-container-height", `${height}px`);
    }
  }

  #resizeObserverCallback(entries: ResizeObserverEntry[]) {
    for (const entry of entries) {
      if (entry.target === this.container) {
        this.#updateContainerHeightCss(
          Math.floor(entry.borderBoxSize[0].blockSize),
        );
        this.#containerTopLeft = undefined;
        break;
      }
    }
  }

  get containerTopLeft() {
    return (this.#containerTopLeft ||= [
      this.container.offsetTop,
      this.container.offsetLeft,
    ]);
  }

  get annotationEditorMode(): AnnotationEditorType {
    return this.#annotationEditorUIManager
      ? this.#annotationEditorMode
      : AnnotationEditorType.DISABLE;
  }

  set annotationEditorMode(
    { mode, editId, isFromKeyboard = false }:
      EventMap["switchannotationeditormode"],
  ) {
    if (!this.#annotationEditorUIManager) {
      throw new Error(`The AnnotationEditor is not enabled.`);
    }
    if (this.#annotationEditorMode === mode) {
      return; // The AnnotationEditor mode didn't change.
    }
    if (!isValidAnnotationEditorMode(mode!)) {
      throw new Error(`Invalid AnnotationEditor mode: ${mode}`);
    }
    if (!this.pdfDocument) {
      return;
    }
    this.#annotationEditorMode = mode!;
    this.eventBus.dispatch("annotationeditormodechanged", {
      source: this,
      mode,
    });

    this.#annotationEditorUIManager.updateMode(mode!, editId, isFromKeyboard);
  }

  // eslint-disable-next-line accessor-pairs
  set annotationEditorParams(
    { type, value }: EventMap["switchannotationeditorparams"],
  ) {
    if (!this.#annotationEditorUIManager) {
      throw new Error(`The AnnotationEditor is not enabled.`);
    }
    this.#annotationEditorUIManager.updateParams(type, value);
  }

  refresh(noUpdate = false, updateArgs = Object.create(null)) {
    if (!this.pdfDocument) {
      return;
    }
    for (const pageView of this._pages) {
      pageView.update(updateArgs);
    }
    if (this.#scaleTimeoutId !== undefined) {
      clearTimeout(this.#scaleTimeoutId);
      this.#scaleTimeoutId = undefined;
    }
    if (!noUpdate) {
      this.update();
    }
  }
}
/*80--------------------------------------------------------------------------*/
