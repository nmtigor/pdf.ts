/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
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

/** @typedef {import("../src/display/api").PDFDocumentProxy} PDFDocumentProxy */
/** @typedef {import("../src/display/api").PDFPageProxy} PDFPageProxy */
// eslint-disable-next-line max-len
/** @typedef {import("../src/display/display_utils").PageViewport} PageViewport */
/** @typedef {import("./event_utils").EventBus} EventBus */
/** @typedef {import("./interfaces").IDownloadManager} IDownloadManager */
/** @typedef {import("./interfaces").IL10n} IL10n */
// eslint-disable-next-line max-len
/** @typedef {import("./interfaces").IPDFAnnotationLayerFactory} IPDFAnnotationLayerFactory */
/** @typedef {import("./interfaces").IPDFLinkService} IPDFLinkService */
// eslint-disable-next-line max-len
/** @typedef {import("./interfaces").IPDFStructTreeLayerFactory} IPDFStructTreeLayerFactory */
// eslint-disable-next-line max-len
/** @typedef {import("./interfaces").IPDFTextLayerFactory} IPDFTextLayerFactory */
/** @typedef {import("./interfaces").IPDFXfaLayerFactory} IPDFXfaLayerFactory */

import { createPromiseCap, PromiseCap } from "../../lib/promisecap.js";
import {
  DEFAULT_SCALE,
  DEFAULT_SCALE_DELTA,
  DEFAULT_SCALE_VALUE,
  getVisibleElements,
  isPortraitOrientation,
  isValidRotation,
  isValidScrollMode,
  isValidSpreadMode,
  MAX_AUTO_SCALE,
  MAX_SCALE,
  MIN_SCALE,
  PresentationModeState,
  RendererType,
  SCROLLBAR_PADDING,
  scrollIntoView,
  ScrollMode,
  SpreadMode,
  TextLayerMode,
  UNKNOWN_SCALE,
  VERTICAL_PADDING,
  type VisibleElement,
  type VisibleElements,
  watchScroll,
  RenderingStates,
} from "./ui_utils.js";
import { AnnotationLayerBuilder } from "./annotation_layer_builder.js";
import { PixelsPerInch } from "../pdf.ts-src/pdf.js";
import { PDFPageView } from "./pdf_page_view.js";
import { SimpleLinkService } from "./pdf_link_service.js";
import { TextLayerBuilder } from "./text_layer_builder.js";
import { 
  IDownloadManager,
  type IL10n, 
  type IPDFAnnotationLayerFactory, 
  type IPDFLinkService, 
  type IPDFStructTreeLayerFactory, 
  type IPDFTextLayerFactory, 
  type IPDFXfaLayerFactory, 
  type MouseState 
} from "./interfaces.js";
import { PDFFindController } from "./pdf_find_controller.js";
import { AnnotationMode, PermissionFlag } from "../pdf.ts-src/shared/util.js";
import { PDFDocumentProxy, PDFPageProxy, version } from "../pdf.ts-src/display/api.js";
import { OptionalContentConfig } from "../pdf.ts-src/display/optional_content_config.js";
import { PageViewport } from "../pdf.ts-src/display/display_utils.js";
import { AnnotationStorage } from "../pdf.ts-src/display/annotation_storage.js";
import { NullL10n } from "./l10n_utils.js";
import { XfaLayerBuilder } from "./xfa_layer_builder.js";
import { PDFScriptingManager } from "./pdf_scripting_manager.js";
import { type ExplicitDest } from "../pdf.ts-src/core/catalog.js";
import { StructTreeLayerBuilder } from "./struct_tree_layer_builder.js";
import { html } from "../../lib/dom.js";
import { TextHighlighter } from "./text_highlighter.js";
import { type FieldObject } from "../pdf.ts-src/core/annotation.js";
import { PDFRenderingQueue } from "./pdf_rendering_queue.js";
import { EventBus, EventMap } from "./event_utils.js";
/*81---------------------------------------------------------------------------*/

const DEFAULT_CACHE_SIZE = 10;
const ENABLE_PERMISSIONS_CLASS = "enablePermissions";

export const enum PagesCountLimit {
  FORCE_SCROLL_MODE_PAGE = 15000,
  FORCE_LAZY_PAGE_INIT = 7500,
  PAUSE_EAGER_PAGE_INIT = 500,
};

export interface PDFViewerOptions
{
  /**
   * The container for the viewer element.
   */
  container:HTMLDivElement;

  /**
   * The viewer element.
   */
  viewer?:HTMLDivElement;

  /**
   * The application event bus.
   */
  eventBus:EventBus;

  /**
   * The navigation/linking service.
   */
  linkService:IPDFLinkService;

  /**
   * The download manager component.
   */
  downloadManager?:IDownloadManager;

  /**
   * The find controller component.
   */
  findController?:PDFFindController;

  /**
   * The scripting manager component.
   */
  scriptingManager:PDFScriptingManager | false | undefined;
  
  /**
   * The rendering queue object.
   */
  renderingQueue?:PDFRenderingQueue;

  /**
   * Removes the border shadow around the pages. The default value is `false`.
   */
  removePageBorders?:boolean;

  /**
   * Controls if the text layer used for
   * selection and searching is created, and if the improved text selection
   * behaviour is enabled. The constants from {TextLayerMode} should be used.
   * The default value is `TextLayerMode.ENABLE`.
   */
  textLayerMode:TextLayerMode | undefined;

  /**
   * Controls if the annotation layer is
   * created, and if interactive form elements or `AnnotationStorage`-data are
   * being rendered. The constants from {@link AnnotationMode} should be used;
   * see also {@link RenderParameters} and {@link GetOperatorListParameters}.
   * The default value is `AnnotationMode.ENABLE_FORMS`.
   */
  annotationMode?:AnnotationMode;

  /**
   * Path for image resources, mainly
   * mainly for annotation icons. Include trailing slash.
   */
  imageResourcesPath:string | undefined;

  /**
   * Enables automatic rotation of 
   * landscape pages upon printing. The default is `false`.
   */
  enablePrintAutoRotate:boolean | undefined;

  /**
   * 'canvas' or 'svg'. The default is 'canvas'.
   */
  renderer:RendererType | undefined;

  /**
   * Enables CSS only zooming. The default value is `false`.
   */
  useOnlyCssZoom:boolean | undefined;

  /**
   * The maximum supported canvas size in
   * total pixels, i.e. width * height. Use -1 for no limit. The default value
   * is 4096 * 4096 (16 mega-pixels).
   */
  maxCanvasPixels:number | undefined;

  /**
   * Localization service.
   */
  l10n?:IL10n;

  /**
   * Enables PDF document permissions,
   * when they exist. The default value is `false`.
   */
  enablePermissions?:boolean;
}

export class PDFPageViewBuffer
{
  // Here we rely on the fact that `Set`s preserve the insertion order.
  #buf = new Set<PDFPageView>();
  has( view:PDFPageView ) { return this.#buf.has(view); }
  [Symbol.iterator]() { return this.#buf.keys(); }

  #size = 0;

  constructor( size:number ) 
  {
    this.#size = size;
  }

  push( view:PDFPageView ) 
  {
    const buf = this.#buf;
    if (buf.has(view)) 
    {
      buf.delete(view); // Move the view to the "end" of the buffer.
    }
    buf.add(view);

    if( buf.size > this.#size )
    {
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
  resize( newSize:number, idsToKeep?:Set<number> ) 
  {
    this.#size = newSize;

    const buf = this.#buf;
    if (idsToKeep) 
    {
      const ii = buf.size;
      let i = 1;
      for (const view of buf) 
      {
        if (idsToKeep.has(view.id)) 
        {
          buf.delete(view); // Move the view to the "end" of the buffer.
          buf.add(view);
        }
        if (++i > ii) break;
      }
    }

    while (buf.size > this.#size) 
    {
      this.#destroyFirstView();
    }
  }

  #destroyFirstView() 
  {
    const firstView = this.#buf.keys().next().value;

    firstView?.destroy();
    this.#buf.delete(firstView);
  }
}

interface ScrollPageIntoViewParms
{
  /**
   * The page number.
   */
  pageNumber:number;
  
  /**
   * The original PDF destination array, in the
   * format: <page-ref> </XYZ|/FitXXX> <args..>
   */
  destArray?:ExplicitDest | undefined;

  /**
   * Allow negative page offsets.
   * The default value is `false`.
   */
  allowNegativeOffset?:boolean;

  /**
   * Ignore the zoom argument in
   * the destination array. The default value is `false`.
   */
  ignoreDestinationZoom?:boolean;
}

export interface PDFLocation 
{
  pageNumber:number;
  scale?:string | number;
  top:number;
  left:number;
  rotation:number;
  pdfOpenParams:string;
}

export interface ScrollIntoViewParms
{
  pageDiv:HTMLDivElement;
  pageSpot?:{
    top?:number;
    left?:number;
  } | undefined;
  pageNumber?:number | undefined;
}

export interface PageOverview
{
  width:number;
  height:number;
  rotation:number;
}

interface ScrollModePageState
{
  previousPageNumber:number;
  scrollDown:boolean;
  pages:PDFPageView[];
}

/**
 * Simple viewer control to display PDF content/pages.
 */
export abstract class BaseViewer implements 
  IPDFAnnotationLayerFactory, 
  IPDFStructTreeLayerFactory,
  IPDFTextLayerFactory,
  IPDFXfaLayerFactory
{
  container;
  #previousContainerHeight = 0;

  viewer;

  eventBus;
  linkService;
  downloadManager;
  findController;

  _scriptingManager;
  get enableScripting() { return !!this._scriptingManager; }

  removePageBorders;
  textLayerMode;

  #annotationMode;
  get renderForms() { return this.#annotationMode === AnnotationMode.ENABLE_FORMS; }
  
  #previousAnnotationMode?:AnnotationMode | undefined;

  imageResourcesPath;
  enablePrintAutoRotate;
  renderer;
  useOnlyCssZoom;
  maxCanvasPixels;
  l10n;
  #enablePermissions;

  _mouseState?:MouseState;

  defaultRenderingQueue:boolean;
  renderingQueue?:PDFRenderingQueue | undefined;
  _doc;

  scroll;
  presentationModeState = PresentationModeState.UNKNOWN;
  _onBeforeDraw:(( evt:EventMap['pagerender'] ) => void) | undefined;
  _onAfterDraw:(( evt:EventMap['pagerendered'] ) => void) | undefined;

  _pages!:PDFPageView[];
  get pagesCount() { return this._pages.length; }
  getPageView( index:number ) { return this._pages[index]; }

  protected _currentPageNumber!:number;
  get currentPageNumber() { return this._currentPageNumber; }
  /**
   * @param val The page number.
   */
  set currentPageNumber( val:number ) 
  {
    if( !Number.isInteger(val) )
    {
      throw new Error("Invalid page number.");
    }
    if( !this.pdfDocument ) return;

    // The intent can be to just reset a scroll position and/or scale.
    if (!this.setCurrentPageNumber$(val, /* resetCurrentPageView = */ true)) 
    {
      console.error(`currentPageNumber: "${val}" is not a valid page.`);
    }
  }

  /**
   * In PDF unit.
   */
  _currentScale!:number;
  get currentScale() 
  {
    return this._currentScale !== UNKNOWN_SCALE
      ? this._currentScale
      : DEFAULT_SCALE;
  }
  /**
   * @param val Scale of the pages in percents.
   */
  set currentScale( val:number ) 
  {
    if (isNaN(val)) 
    {
      throw new Error("Invalid numeric scale.");
    }
    if( !this.pdfDocument ) return;

    this._setScale( val, false );
  }

  #currentScaleValue:string | number = "";
  /** @final */
  get currentScaleValue() { return this.#currentScaleValue; }
  /**
   * @final
   * @param val The scale of the pages (in percent or predefined value).
   */
  set currentScaleValue( val:string | number ) 
  {
    if( !this.pdfDocument ) return;

    this._setScale( val, false );
  }

  _pageLabels?:string[] | undefined;
  /**
   * @return Returns the current page label, or `null` if no page labels exist.
   */
  get currentPageLabel()
  {
    return this._pageLabels?.[this._currentPageNumber - 1] ?? undefined;
  }
  /**
   * @param val The page label.
   */
  set currentPageLabel( val:string | undefined ) 
  {
    if( !this.pdfDocument ) return;

    let page = +val! | 0; // Fallback page number.
    if (this._pageLabels) 
    {
      const i = this._pageLabels.indexOf( val! );
      if (i >= 0) 
      {
        page = i + 1;
      }
    }
    // The intent can be to just reset a scroll position and/or scale.
    if( !this.setCurrentPageNumber$(page, /* resetCurrentPageView = */ true) )
    {
      console.error(`currentPageLabel: "${val}" is not a valid page.`);
    }
  }

  #buffer!:PDFPageViewBuffer;
  #location?:PDFLocation | undefined;

  _pagesRotation!:number;
  get pagesRotation() { return this._pagesRotation; }

  _optionalContentConfigPromise?:Promise<OptionalContentConfig | undefined> | undefined;

  #firstPageCapability!:PromiseCap<PDFPageProxy >;
  get firstPagePromise():Promise<PDFPageProxy> | null
  {
    return this.pdfDocument ? this.#firstPageCapability.promise : null;
  }

  #onePageRenderedCapability!:PromiseCap<{ timestamp:number; }>;
  get onePageRendered()
  {
    return this.pdfDocument ? this.#onePageRenderedCapability.promise : null;
  }

  #pagesCapability!:PromiseCap;
  get pagesPromise()
  {
    return this.pdfDocument ? this.#pagesCapability.promise : undefined;
  }

  _scrollMode!:ScrollMode;
  _previousScrollMode!:ScrollMode;
  _spreadMode!:SpreadMode;

  #scrollModePageState!:ScrollModePageState;

  pdfDocument?:PDFDocumentProxy | undefined;

  constructor( options:PDFViewerOptions ) 
  {
    // if (this.constructor === BaseViewer) {
    //   throw new Error("Cannot initialize BaseViewer.");
    // }
    const viewerVersion = 0;
    // const viewerVersion =
    //   typeof PDFJSDev !== "undefined" ? PDFJSDev.eval("BUNDLE_VERSION") : null;
    if (version !== viewerVersion) {
      throw new Error(
        `The API version "${version}" does not match the Viewer version "${viewerVersion}".`
      );
    }
    this.container = options.container;
    this.viewer = options.viewer || <HTMLDivElement>options.container.firstElementChild;

    // #if !PRODUCTION || GENERIC
      if( !(this.container?.tagName.toUpperCase() === "DIV"
        && this.viewer?.tagName.toUpperCase() === "DIV")
      ) {
        throw new Error("Invalid `container` and/or `viewer` option.");
      }

      if( this.container.offsetParent
      && getComputedStyle(this.container).position !== "absolute"
      ) {
        throw new Error("The `container` must be absolutely positioned.");
      }
    // #endif
    this.eventBus = options.eventBus;
    this.linkService = options.linkService || new SimpleLinkService();
    this.downloadManager = options.downloadManager;
    this.findController = options.findController;
    this._scriptingManager = options.scriptingManager || null;
    this.removePageBorders = options.removePageBorders || false;
    this.textLayerMode = options.textLayerMode ?? TextLayerMode.ENABLE;
    this.#annotationMode =
      options.annotationMode ?? AnnotationMode.ENABLE_FORMS;
    this.imageResourcesPath = options.imageResourcesPath || "";
    this.enablePrintAutoRotate = options.enablePrintAutoRotate || false;
    this.renderer = options.renderer ?? RendererType.CANVAS;
    this.useOnlyCssZoom = options.useOnlyCssZoom || false;
    this.maxCanvasPixels = options.maxCanvasPixels;
    this.l10n = options.l10n || NullL10n;
    this.#enablePermissions = options.enablePermissions || false;

    this.defaultRenderingQueue = !options.renderingQueue;
    if( this.defaultRenderingQueue )
    {
      // Custom rendering queue is not specified, using default one
      this.renderingQueue = new PDFRenderingQueue();
      this.renderingQueue.setViewer(this);
    } 
    else {
      this.renderingQueue = options.renderingQueue;
    }
    this._doc = document.documentElement;

    this.scroll = watchScroll(this.container, this._scrollUpdate.bind(this));
    this._resetView();

    if (this.removePageBorders) 
    {
      this.viewer.classList.add("removePageBorders");
    }
    // Defer the dispatching of this event, to give other viewer components
    // time to initialize *and* register 'baseviewerinit' event listeners.
    Promise.resolve().then(() => {
      this.eventBus.dispatch("baseviewerinit", { source: this });
    });
  }

  /**
   * @return True if all {PDFPageView} objects are initialized.
   */
  get pageViewsReady() 
  {
    if( !this.#pagesCapability.settled ) return false;

    // Prevent printing errors when 'disableAutoFetch' is set, by ensuring
    // that *all* pages have in fact been completely loaded.
    return this._pages.every( pageView => pageView?.pdfPage );
  }

  /**
   * @final
   * @return Whether the pageNumber is valid (within bounds).
   */
  protected setCurrentPageNumber$( val:number, resetCurrentPageView=false) 
  {
    if (this._currentPageNumber === val) 
    {
      if (resetCurrentPageView) 
      {
        this.#resetCurrentPageView();
      }
      return true;
    }

    if( !(0 < val && val <= this.pagesCount) ) return false;

    const previous = this._currentPageNumber;
    this._currentPageNumber = val;

    this.eventBus.dispatch("pagechanging", {
      source: this,
      pageNumber: val,
      pageLabel: this._pageLabels?.[val - 1] ?? undefined,
      previous,
    });

    if (resetCurrentPageView) 
    {
      this.#resetCurrentPageView();
    }
    return true;
  }

  /**
   * @param rotation The rotation of the pages (0, 90, 180, 270).
   */
  set pagesRotation( rotation:number ) 
  {
    if (!isValidRotation(rotation)) 
    {
      throw new Error("Invalid pages rotation angle.");
    }
    if( !this.pdfDocument ) return;

    // Normalize the rotation, by clamping it to the [0, 360) range.
    rotation %= 360;
    if (rotation < 0) 
    {
      rotation += 360;
    }
    // The rotation didn't change.
    if( this._pagesRotation === rotation ) return; 

    this._pagesRotation = rotation;

    const pageNumber = this._currentPageNumber;

    const updateArgs = { rotation };
    for( const pageView of this._pages )
    {
      pageView.update(updateArgs);
    }
    // Prevent errors in case the rotation changes *before* the scale has been
    // set to a non-default value.
    if( this.#currentScaleValue )
    {
      this._setScale(this.#currentScaleValue, true);
    }

    this.eventBus.dispatch("rotationchanging", {
      source: this,
      pagesRotation: rotation,
      pageNumber,
    });

    if( this.defaultRenderingQueue )
    {
      this.update();
    }
  }

  /**
   * Currently only *some* permissions are supported.
   */
  #initializePermissions( permissions?:PermissionFlag[] )
  {
    if( !permissions ) return;

    if( !permissions.includes(PermissionFlag.COPY) )
    {
      this.viewer.classList.add(ENABLE_PERMISSIONS_CLASS);
    }

    if( !permissions.includes(PermissionFlag.MODIFY_ANNOTATIONS)
     && !permissions.includes(PermissionFlag.FILL_INTERACTIVE_FORMS)
    ) {
      if (this.#annotationMode === AnnotationMode.ENABLE_FORMS) 
      {
        this.#previousAnnotationMode = this.#annotationMode; // Allow resetting.
        this.#annotationMode = AnnotationMode.ENABLE;
      }
    }
  }

  #onePageRenderedOrForceFetch()
  {
    // Unless the viewer *and* its pages are visible, rendering won't start and
    // `this.#onePageRenderedCapability` thus won't be resolved.
    // To ensure that automatic printing, on document load, still works even in
    // those cases we force-allow fetching of all pages when:
    //  - The viewer is hidden in the DOM, e.g. in a `display: none` <iframe>
    //    element; fixes bug 1618621.
    //  - The viewer is visible, but none of the pages are (e.g. if the
    //    viewer is very small); fixes bug 1618955.
    if( !this.container.offsetParent
     || this.getVisiblePages$().views.length === 0
    ) {
      return Promise.resolve();
    }
    return this.#onePageRenderedCapability.promise;
  }

  /** @final */
  setDocument( pdfDocument?:PDFDocumentProxy ) 
  {
    if( this.pdfDocument )
    {
      this.eventBus.dispatch("pagesdestroy", { source: this });

      this._cancelRendering();
      this._resetView();

      if (this.findController) 
      {
        this.findController.setDocument();
      }
      if (this._scriptingManager) 
      {
        this._scriptingManager.setDocument();
      }
    }

    this.pdfDocument = pdfDocument;
    if( !pdfDocument ) return;

    const isPureXfa = pdfDocument.isPureXfa;
    const pagesCount = pdfDocument.numPages;
    const firstPagePromise = pdfDocument.getPage(1);
    // Rendering (potentially) depends on this, hence fetching it immediately.
    const optionalContentConfigPromise = pdfDocument.getOptionalContentConfig();
    const permissionsPromise = this.#enablePermissions
      ? pdfDocument.getPermissions()
      : Promise.resolve(undefined);

    // Given that browsers don't handle huge amounts of DOM-elements very well,
    // enforce usage of PAGE-scrolling when loading *very* long/large documents.
    if (pagesCount > PagesCountLimit.FORCE_SCROLL_MODE_PAGE) 
    {
      console.warn(
        "Forcing PAGE-scrolling for performance reasons, given the length of the document."
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
      }
    );

    this._onBeforeDraw = ( evt:EventMap["pagerender"] ) => 
    {
      const pageView = this._pages[evt.pageNumber - 1];
      if( !pageView ) return;

      // Add the page to the buffer at the start of drawing. That way it can be
      // evicted from the buffer and destroyed even if we pause its rendering.
      this.#buffer.push(pageView);
    };
    this.eventBus._on( "pagerender", this._onBeforeDraw );

    this._onAfterDraw = ( evt:EventMap["pagerendered"] ) => {
      if( evt.cssTransform || this.#onePageRenderedCapability.settled ) return;

      this.#onePageRenderedCapability.resolve({ timestamp: evt.timestamp });

      this.eventBus._off("pagerendered", this._onAfterDraw!);
      this._onAfterDraw = undefined;
    };
    this.eventBus._on( "pagerendered", this._onAfterDraw );

    // Fetch a single page so we can get a viewport that will be the default
    // viewport for all pages
    Promise.all([firstPagePromise, permissionsPromise])
      .then(([firstPdfPage, permissions]) => {
        // The document was closed while the first page resolved.
        if( pdfDocument !== this.pdfDocument ) return;

        this.#firstPageCapability.resolve(firstPdfPage);
        this._optionalContentConfigPromise = optionalContentConfigPromise;
        this.#initializePermissions( permissions );

        const viewerElement =
          this._scrollMode === ScrollMode.PAGE ? undefined : this.viewer;
        const scale = this.currentScale;
        const viewport = firstPdfPage.getViewport({
          scale: scale * PixelsPerInch.PDF_TO_CSS_UNITS,
        });
        const textLayerFactory =
          this.textLayerMode !== TextLayerMode.DISABLE && !isPureXfa
            ? this
            : undefined;
        const annotationLayerFactory =
          this.#annotationMode !== AnnotationMode.DISABLE ? this : undefined;
        const xfaLayerFactory = isPureXfa ? this : undefined;

        for( let pageNum = 1; pageNum <= pagesCount; ++pageNum )
        {
          const pageView = new PDFPageView({
            container: viewerElement,
            eventBus: this.eventBus,
            id: pageNum,
            scale,
            defaultViewport: viewport.clone(),
            optionalContentConfigPromise,
            renderingQueue: this.renderingQueue,
            textLayerFactory,
            textLayerMode: this.textLayerMode,
            annotationLayerFactory,
            annotationMode: this.#annotationMode,
            xfaLayerFactory,
            textHighlighterFactory: this,
            structTreeLayerFactory: this,
            imageResourcesPath: this.imageResourcesPath,
            renderer: this.renderer,
            useOnlyCssZoom: this.useOnlyCssZoom,
            maxCanvasPixels: this.maxCanvasPixels,
            l10n: this.l10n,
          });
          this._pages.push(pageView);
        }
        // Set the first `pdfPage` immediately, since it's already loaded,
        // rather than having to repeat the `PDFDocumentProxy.getPage` call in
        // the `this.#ensurePdfPageLoaded` method before rendering can start.
        const firstPageView = this._pages[0];
        if( firstPageView )
        {
          firstPageView.setPdfPage(firstPdfPage);
          this.linkService.cachePageRef( 1, firstPdfPage.ref );
        }

        if (this._scrollMode === ScrollMode.PAGE) 
        {
          // Ensure that the current page becomes visible on document load.
          this.#ensurePageViewVisible();
        } 
        else if (this._spreadMode !== SpreadMode.NONE) 
        {
          this._updateSpreadMode();
        }

        // Fetch all the pages since the viewport is needed before printing
        // starts to create the correct size canvas. Wait until one page is
        // rendered so we don't tie up too many resources early on.
        this.#onePageRenderedOrForceFetch().then( async() => {
          if (this.findController) 
          {
            this.findController.setDocument(pdfDocument); // Enable searching.
          }
          if (this._scriptingManager) 
          {
            this._scriptingManager.setDocument(pdfDocument); // Enable scripting.
          }

          // In addition to 'disableAutoFetch' being set, also attempt to reduce
          // resource usage when loading *very* long/large documents.
          if( pdfDocument.loadingParams.disableAutoFetch
           || pagesCount > PagesCountLimit.FORCE_LAZY_PAGE_INIT
          ) {
            // XXX: Printing is semi-broken with auto fetch disabled.
            this.#pagesCapability.resolve();
            return;
          }
          let getPagesLeft = pagesCount - 1; // The first page was already loaded.

          if (getPagesLeft <= 0) 
          {
            this.#pagesCapability.resolve();
            return;
          }
          for (let pageNum = 2; pageNum <= pagesCount; ++pageNum) 
          {
            const promise = pdfDocument.getPage(pageNum).then(
              pdfPage => {
                const pageView = this._pages[pageNum - 1];
                if (!pageView.pdfPage) 
                {
                  pageView.setPdfPage(pdfPage);
                }
                this.linkService.cachePageRef(pageNum, pdfPage.ref);
                if (--getPagesLeft === 0) 
                {
                  this.#pagesCapability.resolve();
                }
              },
              reason => {
                console.error(
                  `Unable to get page ${pageNum} to initialize viewer`,
                  reason
                );
                if (--getPagesLeft === 0) 
                {
                  this.#pagesCapability.resolve();
                }
              }
            );

            if (pageNum % PagesCountLimit.PAUSE_EAGER_PAGE_INIT === 0) 
            {
              await promise;
            }
          }
        });

        this.eventBus.dispatch("pagesinit", { source: this });

        pdfDocument.getMetadata().then(({ info }) => {
          // The document was closed while the metadata resolved.
          if (pdfDocument !== this.pdfDocument) return;
          
          if (info.Language) 
          {
            this.viewer.lang = info.Language;
          }
        });

        if( this.defaultRenderingQueue )
        {
          this.update();
        }
      })
      .catch(reason => {
        console.error("Unable to initialize viewer", reason);

        this.#pagesCapability.reject(reason);
      });
  }

  setPageLabels( labels:string[] | null ) 
  {
    if( !this.pdfDocument ) return;

    if( !labels )
    {
      this._pageLabels = undefined;
    } 
    else if (
      !(Array.isArray(labels) && this.pdfDocument.numPages === labels.length)
    ) {
      this._pageLabels = undefined;
      console.error(`setPageLabels: Invalid page labels.`);
    } 
    else {
      this._pageLabels = labels;
    }
    // Update all the `PDFPageView` instances.
    for( let i = 0, ii = this._pages.length; i < ii; i++ )
    {
      this._pages[i].setPageLabel( this._pageLabels?.[i] ?? undefined );
    }
  }

  protected _resetView() 
  {
    this._pages = [];
    this._currentPageNumber = 1;
    this._currentScale = UNKNOWN_SCALE;
    this.#currentScaleValue = "";
    this._pageLabels = undefined;
    this.#buffer = new PDFPageViewBuffer(DEFAULT_CACHE_SIZE);
    this.#location = undefined;
    this._pagesRotation = 0;
    this._optionalContentConfigPromise = undefined;
    this.#firstPageCapability = createPromiseCap();
    this.#onePageRenderedCapability = createPromiseCap();
    this.#pagesCapability = createPromiseCap();
    this._scrollMode = ScrollMode.VERTICAL;
    this._previousScrollMode = ScrollMode.UNKNOWN;
    this._spreadMode = SpreadMode.NONE;

    this.#scrollModePageState = {
      previousPageNumber: 1,
      scrollDown: true,
      pages: [],
    };

    if( this._onBeforeDraw )
    {
      this.eventBus._off("pagerender", this._onBeforeDraw);
      this._onBeforeDraw = undefined;
    }
    if( this._onAfterDraw )
    {
      this.eventBus._off("pagerendered", this._onAfterDraw);
      this._onAfterDraw = undefined;
    }
    // Remove the pages from the DOM...
    this.viewer.textContent = "";
    // ... and reset the Scroll mode CSS class(es) afterwards.
    this._updateScrollMode();

    this.viewer.removeAttribute("lang");
    // Reset all PDF document permissions.
    this.viewer.classList.remove(ENABLE_PERMISSIONS_CLASS);

    if( this.#previousAnnotationMode !== undefined ) 
    {
      this.#annotationMode = this.#previousAnnotationMode;
      this.#previousAnnotationMode = undefined;
    }
  }

  #ensurePageViewVisible() 
  {
    if (this._scrollMode !== ScrollMode.PAGE) 
    {
      throw new Error("#ensurePageViewVisible: Invalid scrollMode value.");
    }
    const pageNumber = this._currentPageNumber,
      state = this.#scrollModePageState,
      viewer = this.viewer;

    // Temporarily remove all the pages from the DOM...
    viewer.textContent = "";
    // ... and clear out the active ones.
    state.pages.length = 0;

    if (this._spreadMode === SpreadMode.NONE) 
    {
      // Finally, append the new page to the viewer.
      const pageView = this._pages[pageNumber - 1];

      if (this.isInPresentationMode) 
      {
        const spread = document.createElement("div");
        spread.className = "spread";
        const dummyPage = document.createElement("div");
        dummyPage.className = "dummyPage";
        dummyPage.style.height = `${this.container.clientHeight}px`;

        spread.appendChild(dummyPage);
        spread.appendChild(pageView.div);
        viewer.appendChild(spread);
      } 
      else {
        viewer.appendChild(pageView.div);
      }

      state.pages.push(pageView);
    } 
    else {
      const pageIndexSet = new Set<number>(),
        parity = this._spreadMode - 1;

      // Determine the pageIndices in the new spread.
      if (pageNumber % 2 !== parity) 
      {
        // Left-hand side page.
        pageIndexSet.add(pageNumber - 1);
        pageIndexSet.add(pageNumber);
      } 
      else {
        // Right-hand side page.
        pageIndexSet.add(pageNumber - 2);
        pageIndexSet.add(pageNumber - 1);
      }

      // Finally, append the new pages to the viewer and apply the spreadMode.
      let spread = null;
      for( const i of pageIndexSet )
      {
        const pageView = this._pages[i];
        if( !pageView ) continue;

        if( spread === null )
        {
          spread = document.createElement("div");
          spread.className = "spread";
          viewer.appendChild(spread);
        } 
        else if( i % 2 === parity )
        {
          spread = spread.cloneNode(false);
          viewer.appendChild(spread);
        }
        spread.appendChild(pageView.div);

        state.pages.push(pageView);
      }
    }

    state.scrollDown = pageNumber >= state.previousPageNumber;
    state.previousPageNumber = pageNumber;
  }

  _scrollUpdate() 
  {
    if( this.pagesCount === 0 ) return;

    this.update();
  }

  protected _scrollIntoView({ pageDiv, pageSpot }:ScrollIntoViewParms, pageNumber?:number )
  {
    if (this._scrollMode === ScrollMode.PAGE) 
    {
      if (pageNumber) 
      {
        // Ensure that `this._currentPageNumber` is correct.
        this.setCurrentPageNumber$(pageNumber);
      }
      this.#ensurePageViewVisible();
      // Ensure that rendering always occurs, to avoid showing a blank page,
      // even if the current position doesn't change when the page is scrolled.
      this.update();
    }

    if (!pageSpot && !this.isInPresentationMode) 
    {
      const left = pageDiv.offsetLeft + pageDiv.clientLeft;
      const right = left + pageDiv.clientWidth;
      const { scrollLeft, clientWidth } = this.container;
      if( this._scrollMode === ScrollMode.HORIZONTAL
       || left < scrollLeft
       || right > scrollLeft + clientWidth
      ) {
        pageSpot = { left: 0, top: 0 };
      }
    }
    scrollIntoView(pageDiv, pageSpot);
  }

  /**
   * Prevent unnecessary re-rendering of all pages when the scale changes
   * only because of limited numerical precision.
   */
  #isSameScale( newScale:number ) 
  {
    if( this.isInPresentationMode
     && this.container.clientHeight !== this.#previousContainerHeight
    ) {
      // Ensure that the current page remains centered vertically if/when
      // the window is resized while PresentationMode is active.
      return false;
    }
    return (
      newScale === this._currentScale ||
      Math.abs(newScale - this._currentScale) < 1e-15
    );
  }

  #setScaleUpdatePages( newScale:number, newValue:number | string, 
    noScroll=false, preset=false
  ) {
    this.#currentScaleValue = newValue.toString();

    if( this.#isSameScale(newScale) )
    {
      if (preset) 
      {
        this.eventBus.dispatch("scalechanging", {
          source: this,
          scale: newScale,
          presetValue: newValue,
        });
      }
      return;
    }

    this._doc.style.setProperty("--zoom-factor", <any>newScale );
    this._doc.style.setProperty(
      "--viewport-scale-factor",
      String(newScale * PixelsPerInch.PDF_TO_CSS_UNITS)
    );

    const updateArgs = { scale: newScale };
    for (const pageView of this._pages) 
    {
      pageView.update(updateArgs);
    }
    this._currentScale = newScale;

    if( !noScroll )
    {
      let page = this._currentPageNumber;
      let dest:ExplicitDest | undefined;
      if( this.#location
       && !(this.isInPresentationMode || this.isChangingPresentationMode)
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

    if( this.defaultRenderingQueue )
    {
      this.update();
    }

    this.#previousContainerHeight = this.container.clientHeight;
  }

  protected get _pageWidthScaleFactor() 
  {
    if( this._spreadMode !== SpreadMode.NONE 
     && this._scrollMode !== ScrollMode.HORIZONTAL
    ) {
      return 2;
    }
    return 1;
  }

  _setScale( value:string | number, noScroll=false ) 
  {
    let scale = parseFloat( <any>value );

    if (scale > 0) 
    {
      this.#setScaleUpdatePages(scale, value, noScroll, /* preset = */ false);
    } 
    else {
      const currentPage = this._pages[this._currentPageNumber - 1];
      if( !currentPage ) return;

      let hPadding = SCROLLBAR_PADDING,
        vPadding = VERTICAL_PADDING;

      if (this.isInPresentationMode) 
      {
        hPadding = vPadding = 4;
      } 
      else if (this.removePageBorders) 
      {
        hPadding = vPadding = 0;
      }
      if (this._scrollMode === ScrollMode.HORIZONTAL) 
      {
        [hPadding, vPadding] = [vPadding, hPadding]; // Swap the padding values.
      }
      const pageWidthScale =
        (((this.container.clientWidth - hPadding) / currentPage.width) * currentPage.scale) 
        / this._pageWidthScaleFactor;
      const pageHeightScale =
        ((this.container.clientHeight - vPadding) / currentPage.height) *
        currentPage.scale;
      switch( value )
      {
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
          console.error(`_setScale: "${value}" is an unknown zoom value.`);
          return;
      }
      this.#setScaleUpdatePages(scale, value, noScroll, /* preset = */ true);
    }
  }

  /**
   * Refreshes page view: scrolls to the current page and updates the scale.
   */
  #resetCurrentPageView()
  {
    if( this.isInPresentationMode )
    {
      // Fixes the case when PDF has different page sizes.
      this._setScale( this.#currentScaleValue, true );
    }

    const pageView = this._pages[this._currentPageNumber - 1];
    this._scrollIntoView({ pageDiv: pageView.div });
  }

  /**
   * @return The page number corresponding to the page label,
   *   or `null` when no page labels exist and/or the input is invalid.
   */
  pageLabelToPageNumber( label:string )
  {
    if( !this._pageLabels ) return null;

    const i = this._pageLabels.indexOf(label);
    if( i < 0 ) return null;

    return i + 1;
  }

  /**
   * Scrolls page into view.
   */
  scrollPageIntoView({
    pageNumber,
    destArray,
    allowNegativeOffset=false,
    ignoreDestinationZoom=false,
  }:ScrollPageIntoViewParms ) 
  {
    if( !this.pdfDocument ) return;

    const pageView =
      Number.isInteger(pageNumber) && this._pages[pageNumber - 1];
    if( !pageView )
    {
      console.error(
        `scrollPageIntoView: "${pageNumber}" is not a valid pageNumber parameter.`
      );
      return;
    }

    if( this.isInPresentationMode || !destArray )
    {
      this.setCurrentPageNumber$(pageNumber, /* resetCurrentPageView = */ true);
      return;
    }
    let x = 0,
     y = 0;
    let width = 0,
     height = 0,
     widthScale,
     heightScale;
    const changeOrientation = pageView.rotation % 180 !== 0;
    const pageWidth =
      (changeOrientation ? pageView.height : pageView.width) /
      pageView.scale /
      PixelsPerInch.PDF_TO_CSS_UNITS;
    const pageHeight =
      (changeOrientation ? pageView.width : pageView.height) /
      pageView.scale /
      PixelsPerInch.PDF_TO_CSS_UNITS;
    let scale:number | string = 0;
    switch( destArray[1].name )
    {
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
        if (y === null && this.#location) 
        {
          x = this.#location.left;
          y = this.#location.top;
        } 
        else if (typeof y !== "number" || y < 0) 
        {
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
        width = <number>destArray[4] - x;
        height = <number>destArray[5] - y;
        const hPadding = this.removePageBorders ? 0 : SCROLLBAR_PADDING;
        const vPadding = this.removePageBorders ? 0 : VERTICAL_PADDING;

        widthScale =
          (this.container.clientWidth - hPadding) /
          width /
          PixelsPerInch.PDF_TO_CSS_UNITS;
        heightScale =
          (this.container.clientHeight - vPadding) /
          height /
          PixelsPerInch.PDF_TO_CSS_UNITS;
        scale = Math.min(Math.abs(widthScale), Math.abs(heightScale));
        break;
      default:
        console.error(
          `scrollPageIntoView: "${(<any>destArray[1]).name}" is not a valid destination type.`
        );
        return;
    }

    if( !ignoreDestinationZoom )
    {
      if( scale && scale !== this._currentScale )
      {
        this.currentScaleValue = scale;
      } 
      else if( this._currentScale === UNKNOWN_SCALE )
      {
        this.currentScaleValue = DEFAULT_SCALE_VALUE;
      }
    }

    if( scale === "page-fit" && !destArray[4] )
    {
      this._scrollIntoView({
        pageDiv: pageView.div,
        pageNumber,
      });
      return;
    }

    const boundingRect = [
      pageView.viewport.convertToViewportPoint(x, y),
      pageView.viewport.convertToViewportPoint(x + width, y + height),
    ];
    let left = Math.min(boundingRect[0][0], boundingRect[1][0]);
    let top = Math.min(boundingRect[0][1], boundingRect[1][1]);

    if( !allowNegativeOffset )
    {
      // Some bad PDF generators will create destinations with e.g. top values
      // that exceeds the page height. Ensure that offsets are not negative,
      // to prevent a previous page from becoming visible (fixes bug 874482).
      left = Math.max(left, 0);
      top = Math.max(top, 0);
    }
    this._scrollIntoView({
      pageDiv: pageView.div,
      pageSpot: { left, top },
      pageNumber,
    });
  }

  #updateLocation( firstPage:VisibleElement )
  {
    const currentScale = this._currentScale;
    const currentScaleValue = this.#currentScaleValue;
    const normalizedScaleValue =
      parseFloat(<any>currentScaleValue) === currentScale
        ? Math.round(currentScale * 10000) / 100
        : currentScaleValue;

    const pageNumber = firstPage.id;
    let pdfOpenParams = "#page=" + pageNumber;
    pdfOpenParams += "&zoom=" + normalizedScaleValue;
    const currentPageView = this._pages[pageNumber - 1];
    const container = this.container;
    const topLeft = currentPageView.getPagePoint(
      container.scrollLeft - firstPage.x,
      container.scrollTop - firstPage.y
    );
    const intLeft = Math.round(topLeft[0]);
    const intTop = Math.round(topLeft[1]);
    pdfOpenParams += "," + intLeft + "," + intTop;

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
  update() 
  {
    const visible = this.getVisiblePages$();
    const visiblePages = visible.views,
      numVisiblePages = visiblePages.length;

    if( numVisiblePages === 0 ) return;

    const newCacheSize = Math.max(DEFAULT_CACHE_SIZE, 2 * numVisiblePages + 1);
    this.#buffer.resize(newCacheSize, visible.ids);

    this.renderingQueue!.renderHighestPriority( visible );

    if (!this.isInPresentationMode) 
    {
      const isSimpleLayout =
        this._spreadMode === SpreadMode.NONE &&
        (this._scrollMode === ScrollMode.PAGE ||
          this._scrollMode === ScrollMode.VERTICAL);
      let currentId = this._currentPageNumber;
      let stillFullyVisible = false;

      for (const page of visiblePages) 
      {
        if( page.percent! < 100 ) break;

        if (page.id === currentId && isSimpleLayout) 
        {
          stillFullyVisible = true;
          break;
        }
      }
      if (!stillFullyVisible) 
      {
        currentId = visiblePages[0].id;
      }
      this.setCurrentPageNumber$(currentId);
    }

    this.#updateLocation( visible.first! );
    this.eventBus.dispatch("updateviewarea", {
      source: this,
      location: this.#location,
    });
  }

  containsElement( element:Node | null ) 
  {
    return this.container.contains(element);
  }

  focus() { this.container.focus(); }

  get _isContainerRtl() 
  {
    return getComputedStyle(this.container).direction === "rtl";
  }

  get isInPresentationMode() 
  {
    return this.presentationModeState === PresentationModeState.FULLSCREEN;
  }

  get isChangingPresentationMode() 
  {
    return this.presentationModeState === PresentationModeState.CHANGING;
  }

  get isHorizontalScrollbarEnabled() 
  {
    return this.isInPresentationMode
      ? false
      : this.container.scrollWidth > this.container.clientWidth;
  }

  get isVerticalScrollbarEnabled() 
  {
    return this.isInPresentationMode
      ? false
      : this.container.scrollHeight > this.container.clientHeight;
  }

  /**
   * Helper method for `this.getVisiblePages$`. Should only ever be used when
   * the viewer can only display a single page at a time, for example:
   *  - When PresentationMode is active.
   */
  protected getCurrentVisiblePage$()
  {
    if( !this.pagesCount ) return { views: [] };

    const pageView = this._pages[this._currentPageNumber - 1];
    // NOTE: Compute the `x` and `y` properties of the current view,
    // since `this.#updateLocation` depends of them being available.
    const element = pageView.div;

    const view:VisibleElement = {
      id: pageView.id,
      x: element.offsetLeft + element.clientLeft,
      y: element.offsetTop + element.clientTop,
      view: pageView,
    };
    const ids = new Set([pageView.id]);

    return <VisibleElements>{ first: view, last: view, views: [view], ids };
  }

  /** @final */
  protected getVisiblePages$()
  {
    if( this.isInPresentationMode )
    {
      // The algorithm in `getVisibleElements` doesn't work in all browsers and
      // configurations (e.g. Chrome) when PresentationMode is active.
      return this.getCurrentVisiblePage$();
    }
    const views =
        this._scrollMode === ScrollMode.PAGE
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

  isPageVisible( pageNumber:number ) 
  {
    if( !this.pdfDocument ) return false;

    if( !( Number.isInteger(pageNumber)
     && pageNumber > 0
     && pageNumber <= this.pagesCount
    )) {
      console.error(`isPageVisible: "${pageNumber}" is not a valid page.`);
      return false;
    }
    return this.getVisiblePages$().ids!.has( pageNumber );
  }

  isPageCached( pageNumber:number )
  {
    if( !this.pdfDocument ) return false;

    if( !(Number.isInteger(pageNumber)
     && pageNumber > 0
     && pageNumber <= this.pagesCount
    )) {
      console.error(`isPageCached: "${pageNumber}" is not a valid page.`);
      return false;
    }
    const pageView = this._pages[pageNumber - 1];
    return this.#buffer.has(pageView);
  }

  cleanup() 
  {
    for (let i = 0, ii = this._pages.length; i < ii; i++) 
    {
      if( this._pages[i]
       && this._pages[i].renderingState !== RenderingStates.FINISHED
      ) {
        this._pages[i].reset();
      }
    }
  }

  protected _cancelRendering() 
  {
    for( let i = 0, ii = this._pages.length; i < ii; i++ )
    {
      if (this._pages[i]) 
      {
        this._pages[i].cancelRendering();
      }
    }
  }

  async #ensurePdfPageLoaded( pageView:PDFPageView )
  {
    if( pageView.pdfPage ) return pageView.pdfPage;

    try {
      const pdfPage = await this.pdfDocument!.getPage(pageView.id);
      if( !pageView.pdfPage )
      {
        pageView.setPdfPage(pdfPage);
      }
      if( !this.linkService._cachedPageNumber(pdfPage.ref) )
      {
        this.linkService.cachePageRef(pageView.id, pdfPage.ref);
      }
      return pdfPage;
    } catch (reason) {
      console.error("Unable to get page for page view", reason);
      return null; // Page error -- there is nothing that can be done.
    }
  }

  #scrollAhead( visible:VisibleElements )
  {
    if( visible.first?.id === 1 ) return true;
    else if( visible.last?.id === this.pagesCount ) return false;
    switch (this._scrollMode) 
    {
      case ScrollMode.PAGE: return this.#scrollModePageState.scrollDown;
      case ScrollMode.HORIZONTAL: return this.scroll.right;
    }
    return this.scroll.down;
  }

  /**
   * Only show the `loadingIcon`-spinner on visible pages (see issue 14242).
   */
  #toggleLoadingIconSpinner( visibleIds:Set<number> ) 
  {
    for (const id of visibleIds) 
    {
      const pageView = this._pages[id - 1];
      pageView?.toggleLoadingIconSpinner(/* viewVisible = */ true);
    }
    for (const pageView of this.#buffer) 
    {
      // Handled above, since the "buffer" may not contain all visible pages.
      if( visibleIds.has(pageView.id) ) continue;

      pageView.toggleLoadingIconSpinner(/* viewVisible = */ false);
    }
  }

  forceRendering( currentlyVisiblePages?:VisibleElements )
  {
    const visiblePages = currentlyVisiblePages || this.getVisiblePages$();
    const scrollAhead = this.#scrollAhead( visiblePages );
    const preRenderExtra =
      this._spreadMode !== SpreadMode.NONE &&
      this._scrollMode !== ScrollMode.HORIZONTAL;

    const pageView = this.renderingQueue!.getHighestPriority(
      visiblePages,
      this._pages,
      scrollAhead,
      preRenderExtra
    );
    this.#toggleLoadingIconSpinner( visiblePages.ids! );

    if( pageView )
    {
      this.#ensurePdfPageLoaded( <PDFPageView>pageView ).then(() => {
        this.renderingQueue!.renderView( pageView );
      });
      return true;
    }
    return false;
  }

  /** @implements */
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
      enhanceTextSelection: this.isInPresentationMode
        ? false
        : enhanceTextSelection,
    });
  }

  createTextHighlighter( pageIndex:number, eventBus:EventBus ) 
  {
    return new TextHighlighter({
      eventBus,
      pageIndex,
      findController: this.isInPresentationMode ? undefined : this.findController,
    });
  }

  /**
   * @implements
   * 
   * @param annotationStorage Storage for annotation data in forms.
   * @param imageResourcesPath Path for image resources, mainly
   *   for annotation icons. Include trailing slash.
   */
  createAnnotationLayerBuilder(
    pageDiv:HTMLDivElement,
    pdfPage:PDFPageProxy,
    annotationStorage?:AnnotationStorage,
    imageResourcesPath="",
    renderForms=true,
    l10n=NullL10n,
    enableScripting?:boolean,
    hasJSActionsPromise?:Promise<boolean>,
    mouseState?:MouseState,
    fieldObjectsPromise?:Promise<Record<string, FieldObject[]> | undefined>,
    annotationCanvasMap?:Map<string, HTMLCanvasElement>
  ) {
    return new AnnotationLayerBuilder({
      pageDiv,
      pdfPage,
      annotationStorage:
        annotationStorage || this.pdfDocument?.annotationStorage,
      imageResourcesPath,
      renderForms,
      linkService: this.linkService,
      downloadManager: this.downloadManager,
      l10n,
      enableScripting: enableScripting ?? this.enableScripting,
      hasJSActionsPromise:
        hasJSActionsPromise || this.pdfDocument?.hasJSActions(),
      fieldObjectsPromise:
        fieldObjectsPromise || this.pdfDocument?.getFieldObjects(),
      mouseState: mouseState || this._scriptingManager?.mouseState,
      annotationCanvasMap,
    });
  }

  /**
   * @param annotationStorage Storage for annotation data in forms.
   */
  createXfaLayerBuilder( 
    pageDiv:HTMLDivElement, 
    pdfPage:PDFPageProxy,
    // pdfPage:PDFPageProxy | undefined,
    annotationStorage?:AnnotationStorage
  ) {
    return new XfaLayerBuilder({
      pageDiv,
      pdfPage,
      annotationStorage:
        annotationStorage || this.pdfDocument?.annotationStorage,
      linkService: this.linkService,
    });
  }

  /** @implements */
  createStructTreeLayerBuilder( pdfPage:PDFPageProxy )
  {
    return new StructTreeLayerBuilder({
      pdfPage,
    });
  }

  /**
   * @return Whether all pages of the PDF document have identical
   *   widths and heights.
   */
  get hasEqualPageSizes():boolean 
  {
    const firstPageView = this._pages[0];
    for (let i = 1, ii = this._pages.length; i < ii; ++i) 
    {
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
  getPagesOverview():PageOverview[]
  {
    return this._pages.map( pageView => {
      const viewport = pageView.pdfPage!.getViewport({ scale: 1 });

      if (!this.enablePrintAutoRotate || isPortraitOrientation(viewport)) 
      {
        return {
          width: viewport.width,
          height: viewport.height,
          rotation: viewport.rotation,
        };
      }
      // Landscape orientation.
      return {
        width: viewport.height,
        height: viewport.width,
        rotation: (viewport.rotation - 90) % 360,
      };
    });
  }

  get optionalContentConfigPromise()
  {
    if( !this.pdfDocument )
    {
      return Promise.resolve(undefined);
    }
    if (!this._optionalContentConfigPromise) 
    {
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
  set optionalContentConfigPromise( promise:Promise<OptionalContentConfig | undefined> ) 
  {
    if (!(promise instanceof Promise)) 
    {
      throw new Error(`Invalid optionalContentConfigPromise: ${promise}`);
    }
    if( !this.pdfDocument ) return;

    if (!this._optionalContentConfigPromise) 
    {
      // Ignore the setter *before* the `onePageRendered` promise has resolved,
      // since it'll be overwritten anyway; won't happen in the default viewer.
      return;
    }
    this._optionalContentConfigPromise = promise;

    const updateArgs = { optionalContentConfigPromise: promise };
    for( const pageView of this._pages )
    {
      pageView.update(updateArgs);
    }
    this.update();

    this.eventBus.dispatch("optionalcontentconfigchanged", {
      source: this,
      promise,
    });
  }

  /**
   * @return One of the values in {ScrollMode}.
   */
  get scrollMode():ScrollMode { return this._scrollMode; }

  /**
   * @param mode The direction in which the document pages should be
   *   laid out within the scrolling container.
   *   The constants from {ScrollMode} should be used.
   */
  set scrollMode( mode:ScrollMode ) 
  {
    // The Scroll mode didn't change.
    if( this._scrollMode === mode ) return; 

    if (!isValidScrollMode(mode)) 
    {
      throw new Error(`Invalid scroll mode: ${mode}`);
    }
    // Disabled for performance reasons.
    if( this.pagesCount > PagesCountLimit.FORCE_SCROLL_MODE_PAGE ) return;

    this._previousScrollMode = this._scrollMode;

    this._scrollMode = mode;
    this.eventBus.dispatch("scrollmodechanged", { source: this, mode });

    this._updateScrollMode(/* pageNumber = */ this._currentPageNumber);
  }

  _updateScrollMode( pageNumber?:number ) 
  {
    const scrollMode = this._scrollMode,
      viewer = this.viewer;

    viewer.classList.toggle(
      "scrollHorizontal",
      scrollMode === ScrollMode.HORIZONTAL
    );
    viewer.classList.toggle("scrollWrapped", scrollMode === ScrollMode.WRAPPED);

    if( !this.pdfDocument || !pageNumber ) return;

    if( scrollMode === ScrollMode.PAGE )
    {
      this.#ensurePageViewVisible();
    } 
    else if (this._previousScrollMode === ScrollMode.PAGE) 
    {
      // Ensure that the current spreadMode is still applied correctly when
      // the *previous* scrollMode was `ScrollMode.PAGE`.
      this._updateSpreadMode();
    }
    // Non-numeric scale values can be sensitive to the scroll orientation.
    // Call this before re-scrolling to the current page, to ensure that any
    // changes in scale don't move the current page.
    if( this.#currentScaleValue && isNaN(<any>this.#currentScaleValue) ) 
    {
      this._setScale(this.#currentScaleValue, true);
    }
    this.setCurrentPageNumber$(pageNumber, /* resetCurrentPageView = */ true);
    this.update();
  }

  /**
   * @return One of the values in {SpreadMode}.
   */
  get spreadMode():SpreadMode { return this._spreadMode; }

  /**
   * @param mode Group the pages in spreads, starting with odd- or
   *   even-number pages (unless `SpreadMode.NONE` is used).
   *   The constants from {SpreadMode} should be used.
   */
  set spreadMode( mode:SpreadMode ) 
  {
    // The Spread mode didn't change.
    if( this._spreadMode === mode ) return; 

    if (!isValidSpreadMode(mode)) 
    {
      throw new Error(`Invalid spread mode: ${mode}`);
    }
    this._spreadMode = mode;
    this.eventBus.dispatch("spreadmodechanged", { source: this, mode });

    this._updateSpreadMode(/* pageNumber = */ this._currentPageNumber);
  }

  _updateSpreadMode( pageNumber?:number ) 
  {
    if( !this.pdfDocument ) return;

    const viewer = this.viewer,
      pages = this._pages;

    if( this._scrollMode === ScrollMode.PAGE )
    {
      this.#ensurePageViewVisible();
    } 
    else {
      // Temporarily remove all the pages from the DOM.
      viewer.textContent = "";

      if (this._spreadMode === SpreadMode.NONE) 
      {
        for (let i = 0, ii = pages.length; i < ii; ++i) 
        {
          viewer.appendChild(pages[i].div);
        }
      } 
      else {
        const parity = this._spreadMode - 1;
        let spread = null;
        for (let i = 0, ii = pages.length; i < ii; ++i) 
        {
          if (spread === null) 
          {
            spread = html("div");
            spread.className = "spread";
            viewer.appendChild(spread);
          } 
          else if (i % 2 === parity) 
          {
            spread = spread.cloneNode(false);
            viewer.appendChild(spread);
          }
          spread.appendChild(pages[i].div);
        }
      }
    }

    if( !pageNumber ) return;

    // Non-numeric scale values can be sensitive to the scroll orientation.
    // Call this before re-scrolling to the current page, to ensure that any
    // changes in scale don't move the current page.
    if( this.#currentScaleValue && isNaN(<any>this.#currentScaleValue) )
    {
      this._setScale(this.#currentScaleValue, true);
    }
    this.setCurrentPageNumber$(pageNumber, /* resetCurrentPageView = */ true);
    this.update();
  }

  /**
   * @private
   */
  _getPageAdvance( currentPageNumber:number, previous=false )
  {
    switch (this._scrollMode) 
    {
      case ScrollMode.WRAPPED: {
        const { views } = this.getVisiblePages$(),
          pageLayout = new Map();

        // Determine the current (visible) page layout.
        for( const { id, y, percent, widthPercent } of views )
        {
          if( percent === 0 || widthPercent! < 100 ) continue;

          let yArray = pageLayout.get(y);
          if (!yArray) 
          {
            pageLayout.set(y, (yArray ||= []));
          }
          yArray.push(id);
        }
        // Find the row of the current page.
        for (const yArray of pageLayout.values()) 
        {
          const currentIndex = yArray.indexOf(currentPageNumber);
          if( currentIndex === -1 ) continue;

          const numPages = yArray.length;
          if( numPages === 1 ) break;

          // Handle documents with varying page sizes.
          if (previous) 
          {
            for (let i = currentIndex - 1, ii = 0; i >= ii; i--) 
            {
              const currentId = yArray[i],
                expectedId = yArray[i + 1] - 1;
              if (currentId < expectedId) 
              {
                return currentPageNumber - expectedId;
              }
            }
          } 
          else {
            for (let i = currentIndex + 1, ii = numPages; i < ii; i++) 
            {
              const currentId = yArray[i],
                expectedId = yArray[i - 1] + 1;
              if (currentId > expectedId) 
              {
                return expectedId - currentPageNumber;
              }
            }
          }
          // The current row is "complete", advance to the previous/next one.
          if (previous) 
          {
            const firstId = yArray[0];
            if (firstId < currentPageNumber) 
            {
              return currentPageNumber - firstId + 1;
            }
          } 
          else {
            const lastId = yArray[numPages - 1];
            if (lastId > currentPageNumber) 
            {
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
        if (this._spreadMode === SpreadMode.NONE) 
        {
          break; // Normal vertical scrolling.
        }
        const parity = this._spreadMode - 1;

        if (previous && currentPageNumber % 2 !== parity) 
        {
          break; // Left-hand side page.
        } 
        else if (!previous && currentPageNumber % 2 === parity) 
        {
          break; // Right-hand side page.
        }
        const { views } = this.getVisiblePages$(),
          expectedId = previous ? currentPageNumber - 1 : currentPageNumber + 1;

        for (const { id, percent, widthPercent } of views) 
        {
          if( id !== expectedId ) continue;

          if( percent! > 0 && widthPercent === 100 )
          {
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
   * @return {boolean} Whether navigation occured.
   */
  nextPage() 
  {
    const currentPageNumber = this._currentPageNumber,
      pagesCount = this.pagesCount;

    if( currentPageNumber >= pagesCount ) return false;

    const advance =
      this._getPageAdvance(currentPageNumber, /* previous = */ false) || 1;

    this.currentPageNumber = Math.min(currentPageNumber + advance, pagesCount);
    return true;
  }

  /**
   * Go to the previous page, taking scroll/spread-modes into account.
   * @return Whether navigation occured.
   */
  previousPage() 
  {
    const currentPageNumber = this._currentPageNumber;

    if( currentPageNumber <= 1 ) return false;

    const advance =
      this._getPageAdvance(currentPageNumber, /* previous = */ true) || 1;

    this.currentPageNumber = Math.max(currentPageNumber - advance, 1);
    return true;
  }

  /**
   * Increase the current zoom level one, or more, times.
   * @param steps Defaults to zooming once.
   */
  increaseScale( steps=1 ) 
  {
    let newScale:number | string = this._currentScale;
    do {
      newScale = (newScale * DEFAULT_SCALE_DELTA).toFixed(2);
      newScale = Math.ceil(+newScale * 10) / 10;
      newScale = Math.min(MAX_SCALE, newScale);
    } while (--steps > 0 && newScale < MAX_SCALE);
    this.currentScaleValue = newScale;
  }

  /**
   * Decrease the current zoom level one, or more, times.
   * @param steps Defaults to zooming once.
   */
  decreaseScale( steps=1 ) 
  {
    let newScale:number | string = this._currentScale;
    do {
      newScale = (newScale / DEFAULT_SCALE_DELTA).toFixed(2);
      newScale = Math.floor(+newScale * 10) / 10;
      newScale = Math.max(MIN_SCALE, newScale);
    } while (--steps > 0 && newScale > MIN_SCALE);
    this.currentScaleValue = newScale;
  }
}
/*81---------------------------------------------------------------------------*/
