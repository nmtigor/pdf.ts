/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/app
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

import type { dot2d_t, int } from "@fe-lib/alias.ts";
import { html } from "@fe-lib/dom.ts";
import "@fe-lib/jslang.ts";
import { PromiseCap } from "@fe-lib/util/PromiseCap.ts";
import { assert } from "@fe-lib/util/trace.ts";
import {
  CHROME,
  GECKOVIEW,
  GENERIC,
  INOUT,
  MOZCENTRAL,
  PDFJSDev,
  TESTING,
} from "@fe-src/global.ts";
import type {
  DocumentInfo,
  DocumentInitP,
  ExplicitDest,
  Metadata,
  OpenAction,
  PasswordResponses,
  PDFDataRangeTransport,
  PDFDocumentLoadingTask,
  PDFDocumentProxy,
  PrintAnnotationStorage,
} from "../pdf.ts-src/pdf.ts";
import {
  AnnotationEditorType,
  build,
  FeatureTest,
  getDocument,
  getFilenameFromUrl,
  getPdfFilenameFromUrl,
  GlobalWorkerOptions,
  isDataScheme,
  isPdfFile,
  shadow,
  version,
} from "../pdf.ts-src/pdf.ts";
import type { ActionEventName } from "../pdf.ts-src/shared/util.ts";
import { AltTextManager } from "./alt_text_manager.ts";
import { AnnotationEditorParams } from "./annotation_editor_params.ts";
import type { UserOptions } from "./app_options.ts";
import { AppOptions, OptionKind, ViewOnLoad } from "./app_options.ts";
import { CaretBrowsingMode } from "./caret_browsing.ts";
import type { MLManager as MLManager_c } from "./chromecom.ts";
import { PDFBug } from "./debugger.ts";
import { EventBus, type EventMap, FirefoxEventBus } from "./event_utils.ts";
import type { MLManager as MLManager_f } from "./firefoxcom.ts";
import type { MLManager as MLManager_g } from "./genericcom.ts";
import type { IDownloadManager, IL10n } from "./interfaces.ts";
import { OverlayManager } from "./overlay_manager.ts";
import { PasswordPrompt } from "./password_prompt.ts";
import { PDFAttachmentViewer } from "./pdf_attachment_viewer.ts";
import { PDFCursorTools } from "./pdf_cursor_tools.ts";
import { PDFDocumentProperties } from "./pdf_document_properties.ts";
import { PDFFindBar } from "./pdf_find_bar.ts";
import type {
  FindState,
  FindType,
  MatchesCount,
} from "./pdf_find_controller.ts";
import { PDFFindController } from "./pdf_find_controller.ts";
import { PDFHistory } from "./pdf_history.ts";
import { PDFLayerViewer } from "./pdf_layer_viewer.ts";
import { LinkTarget, PDFLinkService } from "./pdf_link_service.ts";
import { PDFOutlineViewer } from "./pdf_outline_viewer.ts";
import { PDFPresentationMode } from "./pdf_presentation_mode.ts";
import type { PDFPrintService } from "./pdf_print_service.ts";
import { PDFRenderingQueue } from "./pdf_rendering_queue.ts";
import { PDFScriptingManager } from "./pdf_scripting_manager.ts";
import { PDFSidebar } from "./pdf_sidebar.ts";
import { PDFThumbnailViewer } from "./pdf_thumbnail_viewer.ts";
import { PDFViewer } from "./pdf_viewer.ts";
import { SecondaryToolbar } from "./secondary_toolbar.ts";
import { Toolbar as GeckoviewToolbar } from "./toolbar-geckoview.ts";
import { Toolbar } from "./toolbar.ts";
import {
  animationStarted,
  apiPageLayoutToViewerModes,
  apiPageModeToSidebarView,
  AutoPrintRegExp,
  CursorTool,
  DEFAULT_SCALE_VALUE,
  getActiveOrFocusedElement,
  isValidRotation,
  isValidScrollMode,
  isValidSpreadMode,
  normalizeWheelEventDirection,
  parseQueryString,
  ProgressBar,
  RenderingStates,
  ScrollMode,
  SidebarView,
  SpreadMode,
  TextLayerMode,
} from "./ui_utils.ts";
import { ViewHistory } from "./view_history.ts";
import type { ViewerConfiguration } from "./viewer.ts";
import type { Locale } from "@fe-lib/Locale.ts";

/* Ref. gulpfile.mjs of pdf.js */
const { ExternalServices, initCom, MLManager } = /*#static*/ CHROME
  ? await import("./chromecom.ts")
  : /*#static*/ GENERIC
  ? await import("./genericcom.ts")
  : await import("./firefoxcom.ts");
const { DownloadManager } = /*#static*/ CHROME
  ? await import("./download_manager.ts")
  : /*#static*/ GENERIC
  ? await import("./download_manager.ts")
  : await import("./firefoxcom.ts");
const { PDFPrintServiceFactory } = /*#static*/ CHROME
  ? await import("./pdf_print_service.ts")
  : /*#static*/ GENERIC
  ? await import("./pdf_print_service.ts")
  : await import("./firefox_print_service.ts");
const { Preferences } = /*#static*/ CHROME
  ? await import("./chromecom.ts")
  : /*#static*/ GENERIC
  ? await import("./genericcom.ts")
  : await import("./firefoxcom.ts");
/*80--------------------------------------------------------------------------*/

const FORCE_PAGES_LOADED_TIMEOUT = 10000; // ms

export type FindControlState = {
  result: FindState;
  findPrevious?: boolean | undefined;
  entireWord: boolean | undefined;
  matchesCount: MatchesCount;
  rawQuery: string | string[] | RegExpMatchArray | null;
};

export type PassiveLoadingCbs = {
  onOpenWithTransport(_x: PDFDataRangeTransport): void;
  onOpenWithData(
    data: ArrayBuffer,
    contentDispositionFilename: string,
  ): void;
  onOpenWithURL(url: string, length?: number, originalUrl?: string): void;
  onError(err?: ErrorMoreInfo): void;
  onProgress(loaded: number, total: number): void;
};

//kkkk TOCLEANUP
// type TelemetryType =
//   | "buttons"
//   | "documentInfo"
//   | "documentStats"
//   | "editing"
//   | "gv-buttons"
//   | "pageInfo"
//   | "print"
//   | "tagged"
//   | "unsupportedFeature";
// export interface TelemetryData {
//   type: TelemetryType;

//   data?: {
//     type?: "save" | "freetext" | "ink" | "stamp" | "print";
//     id?: string;
//   };
//   formType?: string;
//   generator?: string;
//   tagged?: boolean;
//   timestamp?: number;
//   version?: string;
// }

//kkkk TOCLEANUP
// export class DefaultExternalServices {
//   updateFindControlState(data: FindControlState) {}

//   updateFindMatchesCount(data: MatchesCount) {}

//   initPassiveLoading(callbacks: PassiveLoadingCbs) {}

//   reportTelemetry(data: EventMap["reporttelemetry"]["details"]) {}

//   createDownloadManager(): IDownloadManager {
//     throw new Error("Not implemented: createDownloadManager");
//   }

//   createPreferences(): BasePreferences {
//     throw new Error("Not implemented: createPreferences");
//   }

//   async createL10n(): Promise<IL10n> {
//     throw new Error("Not implemented: createL10n");
//   }

//   createScripting(
//     options: { sandboxBundleSrc?: string | undefined },
//   ): IScripting {
//     throw new Error("Not implemented: createScripting");
//   }

//   updateEditorStates(data: EventMap["annotationeditorstateschanged"]) {
//     throw new Error("Not implemented: updateEditorStates");
//   }

//   getNimbusExperimentData(): Promise<NimbusExperimentData | undefined> {
//     return shadow(this, "getNimbusExperimentData", Promise.resolve(undefined));
//   }
// }

interface SetInitialViewP_ {
  rotation?: number | undefined;
  sidebarView?: SidebarView | undefined;
  scrollMode?: ScrollMode | undefined;
  spreadMode?: SpreadMode | undefined;
}

interface _InitHistoryP {
  fingerprint: string;
  viewOnLoad: ViewOnLoad;
  initialDest: ExplicitDest | undefined;
}

export interface ErrorMoreInfo {
  message: string;
  stack?: string;
  filename?: string;
  lineNumber?: number;
}

export interface ScriptingDocProperties extends DocumentInfo {
  baseURL: string;
  filesize?: number;
  filename: string;
  metadata?: string | undefined;
  authors?: string | string[] | undefined;
  numPages: number;
  URL: string;
}

type OpenP_ = {
  url?: string;
  length?: number | undefined;
  data?: ArrayBuffer;
  filename?: string;
  range?: PDFDataRangeTransport;
  originalUrl?: string | undefined;
  useSystemFonts?: boolean;
};

type TouchInfo_ = {
  touch0X: number;
  touch0Y: number;
  touch1X: number;
  touch1Y: number;
};

export class PDFViewerApplication {
  initialBookmark: string | undefined = document.location.hash.substring(1);
  initialRotation?: number | undefined;

  #initializedCapability = new PromiseCap();
  appConfig!: ViewerConfiguration;
  pdfDocument: PDFDocumentProxy | undefined;
  pdfLoadingTask: PDFDocumentLoadingTask | undefined;
  printService: PDFPrintService | undefined;
  store: ViewHistory | undefined;

  eventBus!: EventBus;
  overlayManager!: OverlayManager;
  pdfRenderingQueue!: PDFRenderingQueue;
  pdfLinkService!: PDFLinkService;
  downloadManager!: IDownloadManager;
  findController!: PDFFindController;
  pdfScriptingManager!: PDFScriptingManager;
  pdfViewer!: PDFViewer;
  pdfThumbnailViewer?: PDFThumbnailViewer;
  pdfHistory!: PDFHistory;
  findBar?: PDFFindBar;
  pdfDocumentProperties?: PDFDocumentProperties;
  pdfCursorTools!: PDFCursorTools;
  toolbar?: Toolbar | GeckoviewToolbar;
  secondaryToolbar!: SecondaryToolbar;
  pdfPresentationMode?: PDFPresentationMode;
  passwordPrompt!: PasswordPrompt;
  pdfOutlineViewer!: PDFOutlineViewer;
  pdfAttachmentViewer!: PDFAttachmentViewer;
  pdfLayerViewer?: PDFLayerViewer;
  pdfSidebar?: PDFSidebar;

  preferences = new Preferences();
  l10n!: IL10n;
  annotationEditorParams?: AnnotationEditorParams;
  isInitialViewSet = false;
  isViewerEmbedded = window.parent !== window;
  url = "";
  baseUrl = "";
  //kkkk TOCLEANUP
  // _allowedGlobalEventsPromise: Promise<Set<EventName> | undefined> | undefined;
  mlManager: MLManager_c | MLManager_f | MLManager_g | undefined;
  _downloadUrl = "";
  //kkkk TOCLEANUP
  // _boundEvents: Record<string, ((...args: any[]) => void) | undefined> = Object
  //   .create(null);
  _eventBusAbortController: AbortController | undefined;
  _windowAbortController: AbortController | undefined;
  _globalAbortController = new AbortController();
  documentInfo: DocumentInfo | undefined;
  metadata: Metadata | undefined;
  #contentDispositionFilename: string | undefined;
  _contentLength: number | undefined;

  _saveInProgress = false;
  _lastScrollTop: number | undefined;
  _lastScrollLeft: number | undefined;
  _wheelUnusedTicks = 0;
  _wheelUnusedFactor = 1;
  _touchUnusedTicks = 0;
  _touchUnusedFactor = 1;

  _PDFBug?: typeof PDFBug;
  _hasAnnotationEditors = false;
  _title = document.title;
  _printAnnotationStoragePromise:
    | Promise<PrintAnnotationStorage | undefined>
    | undefined;
  _touchInfo: TouchInfo_ | undefined;
  _isCtrlKeyDown = false;
  //kkkk TOCLEANUP
  // _nimbusDataPromise?: Promise<NimbusExperimentData | undefined>;
  _caretBrowsing: CaretBrowsingMode | undefined;
  _isScrolling = false;

  disableAutoFetchLoadingBarTimeout: number | undefined;

  _annotationStorageModified?: boolean;
  _openFileInput: HTMLInputElement | undefined;

  #initialized = false;

  constructor() {
    /*#static*/ if (INOUT) {
      assert(!this.#initialized);
    }
    this.#initialized = true;
  }

  /**
   * Called once when the document is loaded.
   */
  async initialize(appConfig: ViewerConfiguration) {
    this.appConfig = appConfig;

    // Ensure that `Preferences`, and indirectly `AppOptions`, have initialized
    // before creating e.g. the various viewer components.
    try {
      await this.preferences.initializedPromise;
    } catch (ex: any) {
      console.error(`initialize: "${ex.message}".`);
    }
    if (AppOptions.pdfBugEnabled) {
      await this.#parseHashParams();
    }

    /*#static*/ if (PDFJSDev || !MOZCENTRAL) {
      let mode;
      switch (AppOptions.viewerCssTheme) {
        case 1:
          mode = "is-light";
          break;
        case 2:
          mode = "is-dark";
          break;
      }
      if (mode) {
        document.documentElement.classList.add(mode);
      }
    } else if (AppOptions.enableAltText) {
      // We want to load the image-to-text AI engine as soon as possible.
      this.mlManager = new MLManager({
        enableGuessAltText: AppOptions.enableGuessAltText,
        altTextLearnMoreUrl: AppOptions.altTextLearnMoreUrl,
      });
    }

    // Ensure that the `L10n`-instance has been initialized before creating
    // e.g. the various viewer components.
    this.l10n = await this.externalServices.createL10n();
    document.getElementsByTagName("html")[0].dir = this.l10n.getDirection();
    // Connect Fluent, when necessary, and translate what we already have.
    /*#static*/ if (PDFJSDev || !MOZCENTRAL) {
      this.l10n.translate(appConfig.appContainer || document.documentElement);
    }

    if (
      this.isViewerEmbedded &&
      AppOptions.externalLinkTarget === LinkTarget.NONE
    ) {
      // Prevent external links from "replacing" the viewer,
      // when it's embedded in e.g. an <iframe> or an <object>.
      AppOptions.set("externalLinkTarget", LinkTarget.TOP);
    }
    await this.#initializeViewerComponents();

    // Bind the various event handlers *after* the viewer has been
    // initialized, to prevent errors if an event arrives too soon.
    this.bindEvents();
    this.bindWindowEvents();

    this.#initializedCapability.resolve();
  }

  /**
   * Potentially parse special debugging flags in the hash section of the URL.
   */
  async #parseHashParams() {
    const hash = document.location.hash.substring(1);
    if (!hash) return;

    const { mainContainer, viewerContainer } = this.appConfig,
      params = parseQueryString(hash);

    const loadPDFBug = async () => {
      if (this._PDFBug) {
        return;
      }
      const { PDFBug } = /*#static*/ PDFJSDev
        ? await import(AppOptions.debuggerSrc) // eslint-disable-line no-unsanitized/method
        // : await __non_webpack_import__(AppOptions.debuggerSrc);
        : await import(AppOptions.debuggerSrc);

      this._PDFBug = PDFBug;
    };

    if (params.get("workermodules") === "true") {
      try {
        GlobalWorkerOptions.workerSrc ||= AppOptions.workerSrc;

        /*#static*/ if (PDFJSDev) {
          (globalThis as any).pdfjsWorker = await import(
            "../pdf.ts-src/pdf.worker.ts"
          );
        } else {
          // await __non_webpack_import__(PDFWorker.workerSrc);
          (globalThis as any).pdfjsWorker = await import(
            "../pdf.ts-src/pdf.worker.ts"
          );
        }
      } catch (ex) {
        console.error(`#parseHashParams: "${(ex as any).message}".`);
      }
    }
    if (params.has("disablerange")) {
      AppOptions.set("disableRange", params.get("disablerange") === "true");
    }
    if (params.has("disablestream")) {
      AppOptions.set("disableStream", params.get("disablestream") === "true");
    }
    if (params.has("disableautofetch")) {
      AppOptions.set(
        "disableAutoFetch",
        params.get("disableautofetch") === "true",
      );
    }
    if (params.has("disablefontface")) {
      AppOptions.set(
        "disableFontFace",
        params.get("disablefontface") === "true",
      );
    }
    if (params.has("disablehistory")) {
      AppOptions.set("disableHistory", params.get("disablehistory") === "true");
    }
    if (params.has("verbosity")) {
      AppOptions.set("verbosity", +params.get("verbosity")! | 0);
    }
    if (params.has("textlayer")) {
      switch (params.get("textlayer")) {
        case "off":
          AppOptions.set("textLayerMode", TextLayerMode.DISABLE);
          break;
        case "visible":
        case "shadow":
        case "hover":
          viewerContainer.classList.add(`textLayer-${params.get("textlayer")}`);
          try {
            await loadPDFBug();
            this._PDFBug!.loadCSS();
          } catch (ex) {
            console.error(`#parseHashParams: "${(ex as any).message}".`);
          }
          break;
      }
    }
    if (params.has("pdfbug")) {
      AppOptions.setAll(
        { pdfBug: true, fontExtraProperties: true } as UserOptions,
      );

      const enabled = params.get("pdfbug")!.split(",");
      try {
        await loadPDFBug();
        this._PDFBug!.init(mainContainer, enabled);
      } catch (ex) {
        console.error(`#parseHashParams: "${(ex as any).message}".`);
      }
    }
    // It is not possible to change locale for the (various) extension builds.
    /*#static*/ if (PDFJSDev || GENERIC) {
      if (params.has("locale")) {
        // AppOptions.set("locale", params.get("locale"));
        AppOptions.set("localeProperties", {
          lang: params.get("locale") as Locale,
        });
      }
    }

    // Set some specific preferences for tests.
    /*#static*/ if (TESTING) {
      if (params.has("highlighteditorcolors")) {
        AppOptions.set(
          "highlightEditorColors",
          params.get("highlighteditorcolors"),
        );
      }
      if (params.has("maxcanvaspixels")) {
        AppOptions.set(
          "maxCanvasPixels",
          Number(params.get("maxcanvaspixels")),
        );
      }
      if (params.has("supportscaretbrowsingmode")) {
        AppOptions.set(
          "supportsCaretBrowsingMode",
          params.get("supportscaretbrowsingmode") === "true",
        );
      }
      if (params.has("spreadmodeonload")) {
        AppOptions.set(
          "spreadModeOnLoad",
          parseInt(params.get("spreadmodeonload")!),
        );
      }
    }
  }

  async #initializeViewerComponents() {
    const { appConfig, externalServices, l10n } = this;

    let eventBus;
    /*#static*/ if (MOZCENTRAL) {
      eventBus = AppOptions.eventBus = new FirefoxEventBus(
        AppOptions.allowedGlobalEvents ?? undefined,
        externalServices,
        AppOptions.isInAutomation,
      );
      if (this.mlManager) {
        this.mlManager.eventBus = eventBus;
      }
    } else {
      eventBus = new EventBus();
    }
    this.eventBus = eventBus;

    this.overlayManager = new OverlayManager();

    const pdfRenderingQueue = new PDFRenderingQueue();
    pdfRenderingQueue.onIdle = this._cleanup;
    this.pdfRenderingQueue = pdfRenderingQueue;

    const pdfLinkService = new PDFLinkService({
      eventBus,
      externalLinkTarget: AppOptions.externalLinkTarget,
      externalLinkRel: AppOptions.externalLinkRel,
      ignoreDestinationZoom: AppOptions.ignoreDestinationZoom,
    });
    this.pdfLinkService = pdfLinkService;

    const downloadManager = (this.downloadManager = new DownloadManager());

    const findController = new PDFFindController({
      linkService: pdfLinkService,
      eventBus,
      // updateMatchesCountOnProgress: /*#static*/ !GECKOVIEW ? true : false,
      updateMatchesCountOnProgress: /*#static*/ PDFJSDev
        ? !(window as any).isGECKOVIEW
        : !GECKOVIEW,
    });
    this.findController = findController;

    const pdfScriptingManager = new PDFScriptingManager({
      eventBus,
      externalServices,
      docProperties: this.#scriptingDocProperties,
    });
    this.pdfScriptingManager = pdfScriptingManager;

    const container = appConfig.mainContainer,
      viewer = appConfig.viewerContainer;
    const annotationEditorMode = AppOptions.annotationEditorMode;
    const pageColors = AppOptions.forcePageColors ||
        window.matchMedia("(forced-colors: active)").matches
      ? {
        background: AppOptions.pageColorsBackground,
        foreground: AppOptions.pageColorsForeground,
      }
      : undefined;
    const altTextManager = appConfig.altTextDialog
      ? new AltTextManager(
        appConfig.altTextDialog,
        container,
        this.overlayManager,
        eventBus,
      )
      : undefined;

    const enableHWA = AppOptions.enableHWA;
    const pdfViewer = new PDFViewer({
      container,
      viewer,
      eventBus,
      renderingQueue: pdfRenderingQueue,
      linkService: pdfLinkService,
      downloadManager,
      altTextManager,
      findController,
      scriptingManager: AppOptions.enableScripting && pdfScriptingManager,
      l10n,
      textLayerMode: AppOptions.textLayerMode,
      annotationMode: AppOptions.annotationMode,
      annotationEditorMode,
      annotationEditorHighlightColors: AppOptions.highlightEditorColors,
      enableHighlightFloatingButton: AppOptions.enableHighlightFloatingButton,
      enableUpdatedAddImage: AppOptions.enableUpdatedAddImage,
      imageResourcesPath: AppOptions.imageResourcesPath,
      enablePrintAutoRotate: AppOptions.enablePrintAutoRotate,
      maxCanvasPixels: AppOptions.maxCanvasPixels,
      enablePermissions: AppOptions.enablePermissions,
      pageColors,
      mlManager: this.mlManager,
      abortSignal: this._globalAbortController.signal,
      enableHWA,
    });
    this.pdfViewer = pdfViewer;

    pdfRenderingQueue.setViewer(pdfViewer);
    pdfLinkService.setViewer(pdfViewer);
    pdfScriptingManager.setViewer(pdfViewer);

    if (appConfig.sidebar?.thumbnailView) {
      this.pdfThumbnailViewer = new PDFThumbnailViewer({
        container: appConfig.sidebar.thumbnailView,
        eventBus,
        renderingQueue: pdfRenderingQueue,
        linkService: pdfLinkService,
        pageColors,
        abortSignal: this._globalAbortController.signal,
        enableHWA,
      });
      pdfRenderingQueue.setThumbnailViewer(this.pdfThumbnailViewer);
    }

    // The browsing history is only enabled when the viewer is standalone,
    // i.e. not when it is embedded in a web page.
    if (!this.isViewerEmbedded && !AppOptions.disableHistory) {
      this.pdfHistory = new PDFHistory({
        linkService: pdfLinkService,
        eventBus,
      });
      pdfLinkService.setHistory(this.pdfHistory);
    }

    if (!this.supportsIntegratedFind && appConfig.findBar) {
      this.findBar = new PDFFindBar(appConfig.findBar, eventBus);
    }

    if (appConfig.annotationEditorParams) {
      if (annotationEditorMode !== AnnotationEditorType.DISABLE) {
        const editorHighlightButton = appConfig.toolbar?.editorHighlightButton;
        if (editorHighlightButton && AppOptions.enableHighlightEditor) {
          editorHighlightButton.hidden = false;
        }

        this.annotationEditorParams = new AnnotationEditorParams(
          appConfig.annotationEditorParams,
          eventBus,
        );
      } else {
        for (const id of ["editorModeButtons", "editorModeSeparator"]) {
          document.getElementById(id)?.classList.add("hidden");
        }
      }
    }

    if (appConfig.documentProperties) {
      this.pdfDocumentProperties = new PDFDocumentProperties(
        appConfig.documentProperties,
        this.overlayManager,
        eventBus,
        l10n,
        /* fileNameLookup = */ () => this._docFilename,
      );
    }

    // NOTE: The cursor-tools are unlikely to be helpful/useful in GeckoView,
    // in particular the `HandTool` which basically simulates touch scrolling.
    if (appConfig.secondaryToolbar?.cursorHandToolButton) {
      this.pdfCursorTools = new PDFCursorTools({
        container,
        eventBus,
        cursorToolOnLoad: AppOptions.cursorToolOnLoad,
      });
    }

    if (appConfig.toolbar) {
      if (PDFJSDev ? (window as any).isGECKOVIEW : GECKOVIEW) {
        const nimbusData = JSON.parse(
          AppOptions.nimbusDataStr || "null",
        );
        this.toolbar = new GeckoviewToolbar(
          appConfig.toolbar as any,
          eventBus,
          nimbusData,
        );
      } else {
        this.toolbar = new Toolbar(
          appConfig.toolbar,
          eventBus,
          AppOptions.toolbarDensity,
        );
      }
    }

    if (appConfig.secondaryToolbar) {
      this.secondaryToolbar = new SecondaryToolbar(
        appConfig.secondaryToolbar,
        eventBus,
      );
    }

    if (
      this.supportsFullscreen &&
      appConfig.secondaryToolbar?.presentationModeButton
    ) {
      this.pdfPresentationMode = new PDFPresentationMode({
        container,
        pdfViewer,
        eventBus,
      });
    }

    if (appConfig.passwordOverlay) {
      this.passwordPrompt = new PasswordPrompt(
        appConfig.passwordOverlay,
        this.overlayManager,
        this.isViewerEmbedded,
      );
    }

    if (appConfig.sidebar?.outlineView) {
      this.pdfOutlineViewer = PDFOutlineViewer.create({
        container: appConfig.sidebar.outlineView,
        eventBus,
        l10n,
        linkService: pdfLinkService,
        downloadManager,
      });
    }

    if (appConfig.sidebar?.attachmentsView) {
      this.pdfAttachmentViewer = PDFAttachmentViewer.create({
        container: appConfig.sidebar.attachmentsView,
        eventBus,
        l10n,
        downloadManager,
      });
    }

    if (appConfig.sidebar?.layersView) {
      this.pdfLayerViewer = PDFLayerViewer.create({
        container: appConfig.sidebar.layersView,
        eventBus,
        l10n,
      });
    }

    if (appConfig.sidebar) {
      this.pdfSidebar = new PDFSidebar({
        elements: appConfig.sidebar,
        eventBus,
        l10n,
      });
      this.pdfSidebar.onToggled = this.forceRendering;
      this.pdfSidebar.onUpdateThumbnails = () => {
        // Use the rendered pages to set the corresponding thumbnail images.
        for (const pageView of pdfViewer.getCachedPageViews()) {
          if (pageView.renderingState === RenderingStates.FINISHED) {
            this.pdfThumbnailViewer!
              .getThumbnail(pageView.id - 1)
              ?.setImage(pageView);
          }
        }
        this.pdfThumbnailViewer!.scrollThumbnailIntoView(
          pdfViewer.currentPageNumber,
        );
      };
    }
  }

  async run(config: ViewerConfiguration) {
    await this.initialize(config);

    const { appConfig, eventBus } = this;
    const file = /*#static*/ PDFJSDev || GENERIC
      ? (() => {
        const queryString = document.location.search.substring(1);
        const params = parseQueryString(queryString);
        const file_ = params.get("file") ?? AppOptions.defaultUrl;
        validateFileURL(file_);
        return file_;
      })()
      : /*#static*/ MOZCENTRAL
      ? window.location.href
      : /*#static*/ CHROME
      ? AppOptions.defaultUrl
      : undefined;

    /*#static*/ if (PDFJSDev || GENERIC) {
      const fileInput = (this._openFileInput = html("input"));
      fileInput.id = "fileInput";
      fileInput.hidden = true;
      fileInput.type = "file";
      fileInput.value = null as any;
      document.body.append(fileInput);

      fileInput.on("change", function (this: HTMLInputElement, evt) {
        const { files } = evt.target as HTMLInputElement;
        if (!files || files.length === 0) {
          return;
        }
        eventBus.dispatch("fileinputchange", {
          source: this,
          fileInput: evt.target,
        });
      });

      // Enable dragging-and-dropping a new PDF file onto the viewerContainer.
      appConfig.mainContainer.on("dragover", (evt) => {
        for (const item of evt.dataTransfer!.items) {
          if (item.type === "application/pdf") {
            evt.dataTransfer!.dropEffect =
              evt.dataTransfer!.effectAllowed === "copy" ? "copy" : "move";
            evt.preventDefault();
            evt.stopPropagation();
            return;
          }
        }
      });
      appConfig.mainContainer.on("drop", function (this: HTMLDivElement, evt) {
        if (evt.dataTransfer!.files?.[0].type !== "application/pdf") {
          return;
        }
        evt.preventDefault();
        evt.stopPropagation();
        eventBus.dispatch("fileinputchange", {
          source: this,
          fileInput: evt.dataTransfer,
        });
      });
    }

    if (!AppOptions.supportsDocumentFonts) {
      AppOptions.set("disableFontFace", true);
      this.l10n.get("pdfjs-web-fonts-disabled").then((msg) => {
        console.warn(msg);
      });
    }

    if (!this.supportsPrinting) {
      appConfig.toolbar?.print?.classList.add("hidden");
      appConfig.secondaryToolbar?.printButton.classList.add("hidden");
    }

    if (!this.supportsFullscreen) {
      appConfig.secondaryToolbar?.presentationModeButton.classList.add(
        "hidden",
      );
    }

    if (this.supportsIntegratedFind) {
      appConfig.toolbar?.viewFind?.classList.add("hidden");
    }

    /*#static*/ if (PDFJSDev || GENERIC) {
      if (file) {
        this.open({ url: file });
      } else {
        this._hideViewBookmark();
      }
    } else {
      /*#static*/ if (MOZCENTRAL || CHROME) {
        this.setTitleUsingUrl(file, /* downloadUrl = */ file);

        this.externalServices.initPassiveLoading();
      } else {
        throw new Error("Not implemented: run");
      }
    }
  }

  get externalServices() {
    return shadow(this, "externalServices", new ExternalServices());
  }

  //kkkk TOCLEANUP
  // get mlManager() {
  //   return shadow(
  //     this,
  //     "mlManager",
  //     AppOptions.enableML === true ? new MLManager() : undefined,
  //   );
  // }

  get initialized() {
    return this.#initializedCapability.settled;
  }

  get initializedPromise() {
    return this.#initializedCapability.promise;
  }

  updateZoom(steps?: int, scaleFactor?: number, origin?: dot2d_t) {
    if (this.pdfViewer.isInPresentationMode) {
      return;
    }
    this.pdfViewer.updateScale({
      drawingDelay: AppOptions.defaultZoomDelay,
      steps,
      scaleFactor,
      origin,
    });
  }

  zoomIn() {
    this.updateZoom(1);
  }

  zoomOut() {
    this.updateZoom(-1);
  }

  zoomReset() {
    if (this.pdfViewer.isInPresentationMode) {
      return;
    }
    this.pdfViewer.currentScaleValue = DEFAULT_SCALE_VALUE;
  }

  get pagesCount() {
    return this.pdfDocument ? this.pdfDocument.numPages : 0;
  }

  get page() {
    return this.pdfViewer!.currentPageNumber;
  }

  set page(val) {
    this.pdfViewer!.currentPageNumber = val;
  }

  get supportsPrinting() {
    return PDFPrintServiceFactory.supportsPrinting;
  }

  get supportsFullscreen() {
    return shadow(this, "supportsFullscreen", document.fullscreenEnabled);
  }

  get supportsPinchToZoom() {
    return shadow(
      this,
      "supportsPinchToZoom",
      AppOptions.supportsPinchToZoom,
    );
  }

  get supportsIntegratedFind() {
    return shadow(
      this,
      "supportsIntegratedFind",
      AppOptions.supportsIntegratedFind,
    );
  }

  get loadingBar() {
    const barElement = document.getElementById("loadingBar");
    const bar = barElement ? new ProgressBar(barElement) : undefined;
    return shadow(this, "loadingBar", bar);
  }

  get supportsMouseWheelZoomCtrlKey() {
    return shadow(
      this,
      "supportsMouseWheelZoomCtrlKey",
      AppOptions.supportsMouseWheelZoomCtrlKey,
    );
  }

  get supportsMouseWheelZoomMetaKey() {
    return shadow(
      this,
      "supportsMouseWheelZoomMetaKey",
      AppOptions.supportsMouseWheelZoomMetaKey,
    );
  }

  get supportsCaretBrowsingMode() {
    return AppOptions.supportsCaretBrowsingMode;
  }

  moveCaret(isUp: boolean, select: boolean) {
    this._caretBrowsing ||= new CaretBrowsingMode(
      this.appConfig.mainContainer,
      this.appConfig.viewerContainer,
      this.appConfig.toolbar?.container,
    );
    this._caretBrowsing.moveCaret(isUp, select);
  }

  //kkkk TOCLEANUP
  // initPassiveLoading(file: string | undefined) {
  //   /*#static*/ if (PDFJSDev || !(MOZCENTRAL || CHROME)) {
  //     throw new Error("Not implemented: initPassiveLoading");
  //   }
  //   this.setTitleUsingUrl(file, /* downloadUrl = */ file);

  //   this.externalServices.initPassiveLoading({
  //     onOpenWithTransport: (range) => {
  //       this.open({ range });
  //     },
  //     onOpenWithData: (data, contentDispositionFilename) => {
  //       if (isPdfFile(contentDispositionFilename)) {
  //         this.#contentDispositionFilename = contentDispositionFilename;
  //       }
  //       this.open({ data });
  //     },
  //     onOpenWithURL: (url, length, originalUrl) => {
  //       this.open({ url, length, originalUrl });
  //     },
  //     onError: (err) => {
  //       this.l10n.get("pdfjs-loading-error").then((msg) => {
  //         this._documentError(msg, err);
  //       });
  //     },
  //     onProgress: (loaded: number, total: number) => {
  //       this.progress(loaded / total);
  //     },
  //   });
  // }

  setTitleUsingUrl(url = "", downloadUrl?: string) {
    this.url = url;
    this.baseUrl = url.split("#", 1)[0];
    if (downloadUrl) {
      this._downloadUrl = downloadUrl === url
        ? this.baseUrl
        : downloadUrl.split("#", 1)[0];
    }
    if (isDataScheme(url)) {
      this._hideViewBookmark();
    } else {
      /*#static*/ if (MOZCENTRAL || CHROME) {
        AppOptions.set("docBaseUrl", this.baseUrl);
      }
    }
    let title = getPdfFilenameFromUrl(url, "");
    if (!title) {
      try {
        // title = decodeURIComponent(getFilenameFromUrl(url)) || url;
        title = decodeURIComponent(getFilenameFromUrl(url));
      } catch {
        // decodeURIComponent may throw URIError.
      }
    }
    this.setTitle(title || url); // Always fallback to the raw URL.
  }

  setTitle(title = this._title) {
    this._title = title;

    if (this.isViewerEmbedded) {
      // Embedded PDF viewers should not be changing their parent page's title.
      return;
    }
    const editorIndicator = this._hasAnnotationEditors &&
      !this.pdfRenderingQueue.printing;
    document.title = `${editorIndicator ? "* " : ""}${title}`;
  }

  get _docFilename() {
    // Use `this.url` instead of `this.baseUrl` to perform filename detection
    // based on the reference fragment as ultimate fallback if needed.
    return this.#contentDispositionFilename || getPdfFilenameFromUrl(this.url);
  }

  /**
   * @private
   */
  _hideViewBookmark() {
    const { secondaryToolbar } = this.appConfig;
    // URL does not reflect proper document location - hiding some buttons.
    secondaryToolbar?.viewBookmarkButton.classList.add("hidden");

    // Avoid displaying multiple consecutive separators in the secondaryToolbar.
    if (secondaryToolbar?.presentationModeButton.classList.contains("hidden")) {
      document.getElementById("viewBookmarkSeparator")?.classList.add("hidden");
    }
  }

  /**
   * Closes opened PDF document.
   * @return Returns the promise, which is resolved when all
   *  destruction is completed.
   */
  async close(): Promise<void> {
    this.#unblockDocumentLoadEvent();
    this._hideViewBookmark();

    if (!this.pdfLoadingTask) {
      return;
    }
    /*#static*/ if (PDFJSDev || GENERIC && !TESTING) {
      if (
        this.pdfDocument?.annotationStorage.size! > 0 &&
        this._annotationStorageModified
      ) {
        try {
          // Trigger saving, to prevent data loss in forms; see issue 12257.
          await this.save();
        } catch {
          // Ignoring errors, to ensure that document closing won't break.
        }
      }
    }
    const promises = [];

    promises.push(this.pdfLoadingTask.destroy());
    this.pdfLoadingTask = undefined;

    if (this.pdfDocument) {
      this.pdfDocument = undefined;

      this.pdfThumbnailViewer?.setDocument();
      this.pdfViewer!.setDocument();
      this.pdfLinkService!.setDocument();
      this.pdfDocumentProperties?.setDocument();
    }
    this.pdfLinkService.externalLinkEnabled = true;
    this.store = undefined;
    this.isInitialViewSet = false;
    this.url = "";
    this.baseUrl = "";
    this._downloadUrl = "";
    this.documentInfo = undefined;
    this.metadata = undefined;
    this.#contentDispositionFilename = undefined;
    this._contentLength = undefined;
    this._saveInProgress = false;
    this._hasAnnotationEditors = false;

    promises.push(
      this.pdfScriptingManager.destroyPromise,
      this.passwordPrompt.close(),
    );

    this.setTitle();
    this.pdfSidebar?.reset();
    this.pdfOutlineViewer?.reset();
    this.pdfAttachmentViewer?.reset();
    this.pdfLayerViewer?.reset();

    this.pdfHistory?.reset();
    this.findBar?.reset();
    this.toolbar?.reset();
    this.secondaryToolbar?.reset();
    this._PDFBug?.cleanup();

    await Promise.all(promises);
  }

  /**
   * Opens PDF document specified by URL or array with additional arguments.
   * @param file PDF location or binary data.
   * @param args Additional arguments for the getDocument call,
   *  e.g. HTTP headers ('httpHeaders') or alternative data transport ('range').
   * @return Returns the promise, which is resolved when document is opened.
   */
  // async open(file: _ViewerAppOpenP_file, args?: _ViewerAppOpenP_args) {
  /**
   * Opens a new PDF document.
   * @headconst @param args_x Accepts any/all of the properties from
   *   {@link DocumentInitParameters}, and also a `originalUrl` string.
   * @return Promise that is resolved when the document is opened.
   */
  async open(args: OpenP_) {
    if (this.pdfLoadingTask) {
      // We need to destroy already opened document.
      await this.close();
    }
    // Set the necessary global worker parameters, using the available options.
    const workerParams = AppOptions.getAll(OptionKind.WORKER);
    Object.assign(GlobalWorkerOptions, workerParams);

    /*#static*/ if (MOZCENTRAL) {
      if (args.data && isPdfFile(args.filename)) {
        this.#contentDispositionFilename = args.filename;
      }
    } else if (args.url) {
      // The Firefox built-in viewer always calls `setTitleUsingUrl`, before
      // `initPassiveLoading`, and it never provides an `originalUrl` here.
      this.setTitleUsingUrl(
        args.originalUrl || args.url,
        /* downloadUrl = */ args.url,
      );
    }

    // Set the necessary API parameters, using all the available options.
    const apiParams = AppOptions.getAll(OptionKind.API);
    const loadingTask = getDocument({
      ...apiParams,
      ...args,
    } as DocumentInitP);
    this.pdfLoadingTask = loadingTask;

    loadingTask.onPassword = (
      updateCallback: (password: string | Error) => void,
      reason: PasswordResponses,
    ) => {
      if (this.isViewerEmbedded) {
        // The load event can't be triggered until the password is entered, so
        // if the viewer is in an iframe and its visibility depends on the
        // onload callback then the viewer never shows (bug 1801341).
        this.#unblockDocumentLoadEvent();
      }

      this.pdfLinkService!.externalLinkEnabled = false;
      this.passwordPrompt.setUpdateCallback(updateCallback, reason);
      this.passwordPrompt.open();
    };

    loadingTask.onProgress = ({ loaded, total }) => {
      this.progress(loaded / total);
    };

    return loadingTask.promise.then(
      (pdfDocument) => {
        this.load(pdfDocument);
      },
      (reason) => {
        if (loadingTask !== this.pdfLoadingTask) {
          return undefined; // Ignore errors for previously opened PDF files.
        }

        // console.dir(reason);
        const key = /* final switch */ {
          InvalidPDFException: "pdfjs-invalid-file-error",
          MissingPDFException: "pdfjs-missing-file-error",
          UnexpectedResponseException: "pdfjs-unexpected-response-error",
        }[reason?.name as string] ?? "pdfjs-loading-error";
        return this._documentError(key, { message: reason.message }).then(
          () => {
            throw reason;
          },
        );
      },
    );
  }

  async download(options = {}) {
    let data: BlobPart;
    try {
      data = await this.pdfDocument!.getData();
    } catch {
      // When the PDF document isn't ready, simply download using the URL.
    }
    this.downloadManager.download(
      data!,
      this._downloadUrl,
      this._docFilename,
      options,
    );
  }

  async save(options = {}) {
    if (this._saveInProgress) {
      return;
    }
    this._saveInProgress = true;
    await this.pdfScriptingManager.dispatchWillSave();

    try {
      const data = await this.pdfDocument!.saveDocument();
      this.downloadManager.download(
        data,
        this._downloadUrl,
        this._docFilename,
        options,
      );
    } catch (reason) {
      // When the PDF document isn't ready, fallback to a "regular" download.
      console.error(
        `Error when saving the document: ${(reason as any).message}`,
      );
      await this.download(options);
    } finally {
      await this.pdfScriptingManager.dispatchDidSave();
      this._saveInProgress = false;
    }

    if (this._hasAnnotationEditors) {
      this.externalServices.reportTelemetry({
        type: "editing",
        data: {
          type: "save",
          stats: this.pdfDocument?.annotationStorage.editorStats,
        },
      });
    }
  }

  async downloadOrSave(options = {}) {
    // In the Firefox case, this method MUST always trigger a download.
    // When the user is closing a modified and unsaved document, we display a
    // prompt asking for saving or not. In case they save, we must wait for
    // saving to complete before closing the tab.
    // So in case this function does not trigger a download, we must trigger a
    // a message and change PdfjsChild.sys.mjs to take it into account.
    const { classList } = this.appConfig.appContainer;
    classList.add("wait");
    await (this.pdfDocument?.annotationStorage.size! > 0
      ? this.save(options)
      : this.download(options));
    classList.remove("wait");
  }

  /**
   * Report the error; used for errors affecting loading and/or parsing of
   * the entire PDF document.
   */
  async _documentError(key: string | undefined, moreInfo?: ErrorMoreInfo) {
    this.#unblockDocumentLoadEvent();

    const message = await this._otherError(
      key || "pdfjs-loading-error",
      moreInfo,
    );

    this.eventBus.dispatch("documenterror", {
      source: this,
      message,
      reason: moreInfo?.message ?? undefined,
    });
  }

  /**
   * Report the error; used for errors affecting e.g. only a single page.
   *
   * @param key The localization key for the error.
   * @param moreInfo Further information about the error that is
   *  more technical. Should have a 'message' and
   *  optionally a 'stack' property.
   * @return A (localized) error message that is human readable.
   */
  async _otherError(
    key: string,
    moreInfo?: ErrorMoreInfo,
  ): Promise<string> {
    const message = await this.l10n.get(key);

    const moreInfoText = [`PDF.js v${version || "?"} (build: ${build || "?"})`];
    if (moreInfo) {
      moreInfoText.push(`Message: ${moreInfo.message}`);

      if (moreInfo.stack) {
        moreInfoText.push(`Stack: ${moreInfo.stack}`);
      } else {
        if (moreInfo.filename) {
          moreInfoText.push(`File: ${moreInfo.filename}`);
        }
        if (moreInfo.lineNumber) {
          moreInfoText.push(`Line: ${moreInfo.lineNumber}`);
        }
      }
    }

    console.error(`${message}\n\n${moreInfoText.join("\n")}`);
    return message;
  }

  progress(level: number) {
    const percent = Math.round(level * 100);
    // When we transition from full request to range requests, it's possible
    // that we discard some of the loaded data. This can cause the loading
    // bar to move backwards. So prevent this by only updating the bar if it
    // increases.
    if (!this.loadingBar || percent <= this.loadingBar.percent) {
      return;
    }
    this.loadingBar.percent = percent;

    // When disableAutoFetch is enabled, it's not uncommon for the entire file
    // to never be fetched (depends on e.g. the file structure). In this case
    // the loading bar will not be completely filled, nor will it be hidden.
    // To prevent displaying a partially filled loading bar permanently, we
    // hide it when no data has been loaded during a certain amount of time.
    if (
      this.pdfDocument?.loadingParams.disableAutoFetch ??
        AppOptions.disableAutoFetch
    ) {
      this.loadingBar.setDisableAutoFetch();
    }
  }

  load(pdfDocument: PDFDocumentProxy) {
    this.pdfDocument = pdfDocument;

    pdfDocument.getDownloadInfo().then(({ length }) => {
      this._contentLength = length; // Ensure that the correct length is used.
      this.loadingBar?.hide();

      firstPagePromise!.then(() => {
        this.eventBus.dispatch("documentloaded", { source: this });
      });
    });

    // Since the `setInitialView` call below depends on this being resolved,
    // fetch it early to avoid delaying initial rendering of the PDF document.
    const pageLayoutPromise = pdfDocument.getPageLayout().catch(() => {
      /* Avoid breaking initial rendering; ignoring errors. */
    });
    const pageModePromise = pdfDocument.getPageMode().catch(() => {
      /* Avoid breaking initial rendering; ignoring errors. */
    });
    const openActionPromise = pdfDocument.getOpenAction().catch(() =>
      /* Avoid breaking initial rendering; ignoring errors. */
      undefined
    );

    this.toolbar?.setPagesCount(pdfDocument.numPages, false);
    this.secondaryToolbar?.setPagesCount(pdfDocument.numPages);

    /*#static*/ if (CHROME) {
      const baseUrl = location.href.split("#", 1)[0];
      // Ignore "data:"-URLs for performance reasons, even though it may cause
      // internal links to not work perfectly in all cases (see bug 1803050).
      this.pdfLinkService.setDocument(
        pdfDocument,
        isDataScheme(baseUrl) ? undefined : baseUrl,
      );
    } else {
      this.pdfLinkService.setDocument(pdfDocument);
    }
    this.pdfDocumentProperties?.setDocument(pdfDocument);

    const pdfViewer = this.pdfViewer;
    pdfViewer.setDocument(pdfDocument);
    const { firstPagePromise, onePageRendered, pagesPromise } = pdfViewer;

    this.pdfThumbnailViewer?.setDocument(pdfDocument);

    const storedPromise = (this.store = new ViewHistory(
      pdfDocument.fingerprints[0],
    ))
      .getMultiple({
        page: undefined,
        zoom: DEFAULT_SCALE_VALUE,
        scrollLeft: 0,
        scrollTop: 0,
        rotation: undefined,
        sidebarView: SidebarView.UNKNOWN,
        scrollMode: ScrollMode.UNKNOWN,
        spreadMode: SpreadMode.UNKNOWN,
      })
      .catch(() => {
        /* Unable to read from storage; ignoring errors. */
      });

    firstPagePromise!.then((pdfPage) => {
      this.loadingBar?.setWidth(this.appConfig.viewerContainer);
      this.#initializeAnnotationStorageCallbacks(pdfDocument);

      Promise.all([
        animationStarted,
        storedPromise,
        pageLayoutPromise,
        pageModePromise,
        openActionPromise,
      ])
        .then(async ([timeStamp, stored, pageLayout, pageMode, openAction]) => {
          const viewOnLoad = AppOptions.viewOnLoad;

          this.#initializePdfHistory({
            fingerprint: pdfDocument.fingerprints[0],
            viewOnLoad,
            initialDest: <ExplicitDest | undefined> openAction?.dest,
          });
          const initialBookmark = this.initialBookmark;

          // Initialize the default values, from user preferences.
          const zoom = AppOptions.defaultZoomValue;
          let hash = zoom ? `zoom=${zoom}` : undefined;

          let rotation;
          let sidebarView = AppOptions.sidebarViewOnLoad;
          let scrollMode = AppOptions.scrollModeOnLoad;
          let spreadMode = AppOptions.spreadModeOnLoad;

          if (stored?.page && viewOnLoad !== ViewOnLoad.INITIAL) {
            hash = `page=${stored.page}&zoom=${zoom || stored.zoom},` +
              `${stored.scrollLeft},${stored.scrollTop}`;

            rotation = parseInt(stored.rotation as any, 10);
            // Always let user preference take precedence over the view history.
            if (sidebarView === SidebarView.UNKNOWN) {
              sidebarView = stored.sidebarView! | 0;
            }
            if (scrollMode === ScrollMode.UNKNOWN) {
              scrollMode = stored.scrollMode! | 0;
            }
            if (spreadMode === SpreadMode.UNKNOWN) {
              spreadMode = stored.spreadMode! | 0;
            }
          }
          // Always let the user preference/view history take precedence.
          if (pageMode && sidebarView === SidebarView.UNKNOWN) {
            sidebarView = apiPageModeToSidebarView(pageMode);
          }
          if (
            pageLayout &&
            scrollMode === ScrollMode.UNKNOWN &&
            spreadMode === SpreadMode.UNKNOWN
          ) {
            const modes = apiPageLayoutToViewerModes(pageLayout);
            // TODO: Try to improve page-switching when using the mouse-wheel
            // and/or arrow-keys before allowing the document to control this.
            // scrollMode = modes.scrollMode;
            spreadMode = modes.spreadMode;
          }

          this.setInitialView(hash, {
            rotation,
            sidebarView,
            scrollMode,
            spreadMode,
          });
          this.eventBus.dispatch("documentinit", { source: this });
          // Make all navigation keys work on document load,
          // unless the viewer is embedded in a web page.
          if (!this.isViewerEmbedded) {
            pdfViewer.focus();
          }

          // For documents with different page sizes, once all pages are
          // resolved, ensure that the correct location becomes visible on load.
          // (To reduce the risk, in very large and/or slow loading documents,
          //  that the location changes *after* the user has started interacting
          //  with the viewer, wait for either `pagesPromise` or a timeout.)
          await Promise.race([
            pagesPromise,
            new Promise((resolve) => {
              setTimeout(resolve, FORCE_PAGES_LOADED_TIMEOUT);
            }),
          ]);
          if (!initialBookmark && !hash) return;
          if (pdfViewer.hasEqualPageSizes) return;

          this.initialBookmark = initialBookmark;

          // eslint-disable-next-line no-self-assign
          pdfViewer.currentScaleValue = pdfViewer.currentScaleValue;
          // Re-apply the initial document location.
          this.setInitialView(hash);
        })
        .catch(() => {
          // Ensure that the document is always completely initialized,
          // even if there are any errors thrown above.
          this.setInitialView();
        })
        .then(() => {
          // At this point, rendering of the initial page(s) should always have
          // started (and may even have completed).
          // To prevent any future issues, e.g. the document being completely
          // blank on load, always trigger rendering here.
          pdfViewer.update();
        });
    });

    pagesPromise!.then(() => {
      this.#unblockDocumentLoadEvent();

      this.#initializeAutoPrint(pdfDocument, openActionPromise);
    }, (reason) => {
      this._documentError("pdfjs-loading-error", { message: reason.message });
    });

    onePageRendered!.then((data) => {
      this.externalServices.reportTelemetry({
        type: "pageInfo",
        timestamp: data.timestamp,
      });

      if (this.pdfOutlineViewer) {
        pdfDocument.getOutline().then((outline) => {
          if (pdfDocument !== this.pdfDocument) {
            return; // The document was closed while the outline resolved.
          }
          this.pdfOutlineViewer.render({ outline, pdfDocument });
        });
      }
      if (this.pdfAttachmentViewer) {
        pdfDocument.getAttachments().then((attachments) => {
          if (pdfDocument !== this.pdfDocument) {
            return; // The document was closed while the attachments resolved.
          }
          this.pdfAttachmentViewer.render({ attachments });
        });
      }
      if (this.pdfLayerViewer) {
        // Ensure that the layers accurately reflects the current state in the
        // viewer itself, rather than the default state provided by the API.
        pdfViewer.optionalContentConfigPromise.then((optionalContentConfig) => {
          if (pdfDocument !== this.pdfDocument) {
            return; // The document was closed while the layers resolved.
          }
          this.pdfLayerViewer?.render({ optionalContentConfig, pdfDocument });
        });
      }
    });

    this.#initializePageLabels(pdfDocument);
    this.#initializeMetadata(pdfDocument);
  }

  #scriptingDocProperties = async (pdfDocument?: PDFDocumentProxy) => {
    if (!this.documentInfo) {
      // It should be *extremely* rare for metadata to not have been resolved
      // when this code runs, but ensure that we handle that case here.
      await new Promise((resolve) => {
        this.eventBus._on("metadataloaded", resolve, { once: true });
      });
      if (pdfDocument !== this.pdfDocument) {
        return undefined; // The document was closed while the metadata resolved.
      }
    }
    if (!this._contentLength) {
      // Always waiting for the entire PDF document to be loaded will, most
      // likely, delay sandbox-creation too much in the general case for all
      // PDF documents which are not provided as binary data to the API.
      // Hence we'll simply have to trust that the `contentLength` (as provided
      // by the server), when it exists, is accurate enough here.
      await new Promise((resolve) => {
        this.eventBus._on("documentloaded", resolve, { once: true });
      });
      if (pdfDocument !== this.pdfDocument) {
        return undefined; // The document was closed while the downloadInfo resolved.
      }
    }

    return <ScriptingDocProperties> {
      ...this.documentInfo,
      baseURL: this.baseUrl,
      filesize: this._contentLength,
      filename: this._docFilename,
      metadata: this.metadata?.getRaw(),
      authors: this.metadata?.get("dc:creator"),
      numPages: this.pagesCount,
      URL: this.url,
    };
  };

  async #initializeAutoPrint(
    pdfDocument: PDFDocumentProxy,
    openActionPromise: Promise<OpenAction | undefined>,
  ) {
    const [openAction, jsActions] = await Promise.all([
      openActionPromise,
      this.pdfViewer.enableScripting ? null : pdfDocument.getJSActions(),
    ]);

    if (pdfDocument !== this.pdfDocument) {
      return; // The document was closed while the auto print data resolved.
    }
    let triggerAutoPrint = openAction?.action === "Print";

    if (jsActions) {
      console.warn("Warning: JavaScript support is not enabled");

      // Hack to support auto printing.
      for (const name in jsActions) {
        if (triggerAutoPrint) {
          break;
        }
        switch (name) {
          case "WillClose":
          case "WillSave":
          case "DidSave":
          case "WillPrint":
          case "DidPrint":
            continue;
        }
        triggerAutoPrint = jsActions[name as ActionEventName].some((js) =>
          AutoPrintRegExp.test(js)
        );
      }
    }

    if (triggerAutoPrint) {
      this.triggerPrinting();
    }
  }

  async #initializeMetadata(pdfDocument: PDFDocumentProxy) {
    const { info, metadata, contentDispositionFilename, contentLength } =
      await pdfDocument.getMetadata();

    if (pdfDocument !== this.pdfDocument) {
      return; // The document was closed while the metadata resolved.
    }
    this.documentInfo = info;
    this.metadata = metadata;
    this.#contentDispositionFilename ??= contentDispositionFilename;
    this._contentLength ??= contentLength; // See `getDownloadInfo`-call above.

    // Provides some basic debug information
    console.log(
      `PDF ${pdfDocument.fingerprints[0]} [${info.PDFFormatVersion} ` +
        `${(info.Producer || "-").trim()} / ${(info.Creator || "-").trim()}] ` +
        `(PDF.js: ${version || "?"} [${build || "?"}])`,
    );

    let pdfTitle: string | string[] | undefined = info.Title;

    const metadataTitle = metadata?.get("dc:title");
    if (metadataTitle) {
      // Ghostscript can produce invalid 'dc:title' Metadata entries:
      //  - The title may be "Untitled" (fixes bug 1031612).
      //  - The title may contain incorrectly encoded characters, which thus
      //    looks broken, hence we ignore the Metadata entry when it contains
      //    characters from the Specials Unicode block (fixes bug 1605526).
      if (
        metadataTitle !== "Untitled" &&
        !/[\uFFF0-\uFFFF]/g.test(<string> metadataTitle)
      ) {
        pdfTitle = metadataTitle;
      }
    }
    if (pdfTitle) {
      this.setTitle(
        `${pdfTitle} - ${this.#contentDispositionFilename || this._title}`,
      );
    } else if (this.#contentDispositionFilename) {
      this.setTitle(this.#contentDispositionFilename);
    }

    if (
      info.IsXFAPresent &&
      !info.IsAcroFormPresent &&
      !pdfDocument.isPureXfa
    ) {
      if (pdfDocument.loadingParams.enableXfa) {
        console.warn("Warning: XFA Foreground documents are not supported");
      } else {
        console.warn("Warning: XFA support is not enabled");
      }
    } else if (
      (info.IsAcroFormPresent || info.IsXFAPresent) &&
      !this.pdfViewer.renderForms
    ) {
      console.warn("Warning: Interactive form support is not enabled");
    }

    if (info.IsSignaturesPresent) {
      console.warn("Warning: Digital signatures validation is not supported");
    }

    this.eventBus.dispatch("metadataloaded", { source: this });
  }

  async #initializePageLabels(pdfDocument: PDFDocumentProxy) {
    /*#static*/ if (PDFJSDev ? (window as any).isGECKOVIEW : GECKOVIEW) {
      return;
    }
    const labels = await pdfDocument.getPageLabels();

    if (pdfDocument !== this.pdfDocument) {
      return; // The document was closed while the page labels resolved.
    }
    if (!labels || AppOptions.disablePageLabels) {
      return;
    }
    const numLabels = labels.length;
    // Ignore page labels that correspond to standard page numbering,
    // or page labels that are all empty.
    let standardLabels = 0,
      emptyLabels = 0;
    for (let i = 0; i < numLabels; i++) {
      const label = labels[i];
      if (label === (i + 1).toString()) standardLabels++;
      else if (label === "") emptyLabels++;
      else break;
    }
    if (standardLabels >= numLabels || emptyLabels >= numLabels) return;

    const { pdfViewer, pdfThumbnailViewer, toolbar } = this;

    pdfViewer.setPageLabels(labels);
    pdfThumbnailViewer?.setPageLabels(labels);

    // Changing toolbar page display to use labels and we need to set
    // the label of the current page.
    toolbar?.setPagesCount(numLabels, true);
    toolbar?.setPageNumber(
      pdfViewer.currentPageNumber,
      pdfViewer.currentPageLabel,
    );
  }

  #initializePdfHistory(
    { fingerprint, viewOnLoad, initialDest }: _InitHistoryP,
  ) {
    if (!this.pdfHistory) {
      return;
    }
    this.pdfHistory.initialize({
      fingerprint,
      resetHistory: viewOnLoad === ViewOnLoad.INITIAL,
      updateUrl: AppOptions.historyUpdateUrl,
    });

    if (this.pdfHistory.initialBookmark) {
      this.initialBookmark = this.pdfHistory.initialBookmark;

      this.initialRotation = this.pdfHistory.initialRotation;
    }

    // Always let the browser history/document hash take precedence.
    if (
      initialDest &&
      !this.initialBookmark &&
      viewOnLoad === ViewOnLoad.UNKNOWN
    ) {
      this.initialBookmark = JSON.stringify(initialDest);
      // TODO: Re-factor the `PDFHistory` initialization to remove this hack
      // that's currently necessary to prevent weird initial history state.
      this.pdfHistory!.push({
        namedDest: undefined,
        explicitDest: initialDest,
      });
    }
  }

  #initializeAnnotationStorageCallbacks(pdfDocument: PDFDocumentProxy) {
    if (pdfDocument !== this.pdfDocument) return;

    const { annotationStorage } = pdfDocument;

    annotationStorage.onSetModified = () => {
      window.on("beforeunload", beforeUnload);

      /*#static*/ if (PDFJSDev || GENERIC) {
        this._annotationStorageModified = true;
      }
    };
    annotationStorage.onResetModified = () => {
      window.off("beforeunload", beforeUnload);

      /*#static*/ if (PDFJSDev || GENERIC) {
        delete this._annotationStorageModified;
      }
    };
    annotationStorage.onAnnotationEditor = (typeStr) => {
      this._hasAnnotationEditors = !!typeStr;
      this.setTitle();
    };
  }

  setInitialView(
    storedHash?: string,
    { rotation, sidebarView, scrollMode, spreadMode }: SetInitialViewP_ = {},
  ) {
    const setRotation = (angle?: number) => {
      if (isValidRotation(angle)) {
        this.pdfViewer.pagesRotation = <number> angle;
      }
    };
    const setViewerModes = (scroll?: ScrollMode, spread?: SpreadMode) => {
      if (isValidScrollMode(scroll)) {
        this.pdfViewer.scrollMode = scroll!;
      }
      if (isValidSpreadMode(spread)) {
        this.pdfViewer.spreadMode = spread!;
      }
    };
    this.isInitialViewSet = true;
    this.pdfSidebar?.setInitialView(sidebarView);

    setViewerModes(scrollMode, spreadMode);

    if (this.initialBookmark) {
      setRotation(this.initialRotation);
      delete this.initialRotation;

      this.pdfLinkService.setHash(this.initialBookmark);
      this.initialBookmark = undefined;
    } else if (storedHash) {
      setRotation(rotation);

      this.pdfLinkService.setHash(storedHash);
    }

    // Ensure that the correct page number is displayed in the UI,
    // even if the active page didn't change during document load.
    this.toolbar?.setPageNumber(
      this.pdfViewer.currentPageNumber,
      this.pdfViewer.currentPageLabel,
    );
    this.secondaryToolbar?.setPageNumber(this.pdfViewer.currentPageNumber);

    if (!this.pdfViewer.currentScaleValue) {
      // Scale was not initialized: invalid bookmark or scale was not specified.
      // Setting the default one.
      this.pdfViewer.currentScaleValue = DEFAULT_SCALE_VALUE;
    }
  }

  _cleanup = () => {
    if (!this.pdfDocument) {
      return; // run cleanup when document is loaded
    }
    this.pdfViewer.cleanup();
    this.pdfThumbnailViewer?.cleanup();

    this.pdfDocument.cleanup(
      /* keepLoadedFonts = */ AppOptions.fontExtraProperties,
    );
  };

  forceRendering = () => {
    this.pdfRenderingQueue.printing = !!this.printService;
    this.pdfRenderingQueue.isThumbnailViewEnabled =
      this.pdfSidebar?.visibleView === SidebarView.THUMBS;
    this.pdfRenderingQueue.renderHighestPriority();
  };

  beforePrint = () => {
    this._printAnnotationStoragePromise = this.pdfScriptingManager
      .dispatchWillPrint()
      .catch(() => {
        /* Avoid breaking printing; ignoring errors. */
      })
      .then(() => this.pdfDocument?.annotationStorage.print);

    if (this.printService) {
      // There is no way to suppress beforePrint/afterPrint events,
      // but PDFPrintService may generate double events -- this will ignore
      // the second event that will be coming from native window.print().
      return;
    }

    if (!this.supportsPrinting) {
      this._otherError("pdfjs-printing-not-supported");
      return;
    }

    // The beforePrint is a sync method and we need to know layout before
    // returning from this method. Ensure that we can get sizes of the pages.
    if (!this.pdfViewer!.pageViewsReady) {
      this.l10n.get("pdfjs-printing-not-ready").then((msg) => {
        // eslint-disable-next-line no-alert
        window.alert(msg);
      });
      return;
    }

    this.printService = PDFPrintServiceFactory.createPrintService({
      pdfDocument: this.pdfDocument!,
      pagesOverview: this.pdfViewer.getPagesOverview(),
      printContainer: this.appConfig.printContainer,
      printResolution: AppOptions.printResolution,
      printAnnotationStoragePromise: this._printAnnotationStoragePromise,
    });
    this.forceRendering();
    // Disable the editor-indicator during printing (fixes bug 1790552).
    this.setTitle();

    this.printService.layout();

    if (this._hasAnnotationEditors) {
      this.externalServices.reportTelemetry({
        type: "editing",
        data: {
          type: "print",
          stats: this.pdfDocument?.annotationStorage.editorStats,
        },
      });
    }
  };

  afterPrint = () => {
    if (this._printAnnotationStoragePromise) {
      this._printAnnotationStoragePromise.then(() => {
        this.pdfScriptingManager.dispatchDidPrint();
      });
      this._printAnnotationStoragePromise = undefined;
    }

    if (this.printService) {
      this.printService!.destroy();
      this.printService = undefined;

      this.pdfDocument?.annotationStorage.resetModified();
    }
    this.forceRendering();
    // Re-enable the editor-indicator after printing (fixes bug 1790552).
    this.setTitle();
  };

  rotatePages(delta: number) {
    this.pdfViewer!.pagesRotation += delta;
    // Note that the thumbnail viewer is updated, and rendering is triggered,
    // in the 'rotationchanging' event handler.
  }

  requestPresentationMode() {
    this.pdfPresentationMode?.request();
  }

  triggerPrinting() {
    if (!this.supportsPrinting) {
      return;
    }
    window.print();
  }

  bindEvents() {
    if (this._eventBusAbortController) {
      return;
    }
    this._eventBusAbortController = new AbortController();

    const {
      eventBus,
      _eventBusAbortController: { signal },
    } = this;

    eventBus._on("resize", webViewerResize, { signal });
    eventBus._on("hashchange", webViewerHashchange, { signal });
    eventBus._on("beforeprint", this.beforePrint, { signal });
    eventBus._on("afterprint", this.afterPrint, { signal });
    eventBus._on("pagerender", webViewerPageRender, { signal });
    eventBus._on("pagerendered", webViewerPageRendered, { signal });
    eventBus._on("updateviewarea", webViewerUpdateViewarea, { signal });
    eventBus._on("pagechanging", webViewerPageChanging, { signal });
    eventBus._on("scalechanging", webViewerScaleChanging, { signal });
    eventBus._on("rotationchanging", webViewerRotationChanging, { signal });
    eventBus._on("sidebarviewchanged", webViewerSidebarViewChanged, { signal });
    eventBus._on("pagemode", webViewerPageMode, { signal });
    eventBus._on("namedaction", webViewerNamedAction, { signal });
    eventBus._on(
      "presentationmodechanged",
      webViewerPresentationModeChanged,
      { signal },
    );
    eventBus._on("presentationmode", webViewerPresentationMode, { signal });
    eventBus._on(
      "switchannotationeditormode",
      webViewerSwitchAnnotationEditorMode,
      { signal },
    );
    eventBus._on(
      "switchannotationeditorparams",
      webViewerSwitchAnnotationEditorParams,
      { signal },
    );
    eventBus._on("print", webViewerPrint, { signal });
    eventBus._on("download", webViewerDownload, { signal });
    eventBus._on("firstpage", webViewerFirstPage, { signal });
    eventBus._on("lastpage", webViewerLastPage, { signal });
    eventBus._on("nextpage", webViewerNextPage, { signal });
    eventBus._on("previouspage", webViewerPreviousPage, { signal });
    eventBus._on("zoomin", webViewerZoomIn, { signal });
    eventBus._on("zoomout", webViewerZoomOut, { signal });
    eventBus._on("zoomreset", webViewerZoomReset, { signal });
    eventBus._on("pagenumberchanged", webViewerPageNumberChanged, { signal });
    eventBus._on("scalechanged", webViewerScaleChanged, { signal });
    eventBus._on("rotatecw", webViewerRotateCw, { signal });
    eventBus._on("rotateccw", webViewerRotateCcw, { signal });
    eventBus._on(
      "optionalcontentconfig",
      webViewerOptionalContentConfig,
      { signal },
    );
    eventBus._on("switchscrollmode", webViewerSwitchScrollMode, { signal });
    eventBus._on("scrollmodechanged", webViewerScrollModeChanged, { signal });
    eventBus._on("switchspreadmode", webViewerSwitchSpreadMode, { signal });
    eventBus._on("spreadmodechanged", webViewerSpreadModeChanged, { signal });
    eventBus._on("documentproperties", webViewerDocumentProperties, { signal });
    eventBus._on("findfromurlhash", webViewerFindFromUrlHash, { signal });
    eventBus._on(
      "updatefindmatchescount",
      webViewerUpdateFindMatchesCount,
      { signal },
    );
    eventBus._on(
      "updatefindcontrolstate",
      webViewerUpdateFindControlState,
      { signal },
    );

    /*#static*/ if (PDFJSDev || GENERIC) {
      eventBus._on("fileinputchange", webViewerFileInputChange, { signal });
      eventBus._on("openfile", webViewerOpenFile, { signal });
    }
    /*#static*/ if (MOZCENTRAL) {
      eventBus._on(
        "annotationeditorstateschanged",
        webViewerAnnotationEditorStatesChanged,
        { signal },
      );
      eventBus._on("reporttelemetry", webViewerReportTelemetry, { signal });
      eventBus._on("setpreference", webViewerSetPreference, { signal });
    }
  }

  bindWindowEvents() {
    if (this._windowAbortController) {
      return;
    }
    this._windowAbortController = new AbortController();

    const {
      eventBus,
      appConfig: { mainContainer },
      _windowAbortController: { signal },
    } = this;

    function addWindowResolutionChange(
      evt: MediaQueryListEvent | undefined = undefined,
    ) {
      if (evt) {
        webViewerResolutionChange(evt);
      }
      const mediaQueryList = window.matchMedia(
        `(resolution: ${window.devicePixelRatio || 1}dppx)`,
      );
      mediaQueryList.addEventListener(
        "change",
        addWindowResolutionChange,
        { once: true, signal },
      );
    }
    addWindowResolutionChange();

    window.on("wheel", webViewerWheel, { passive: false, signal });
    window.on("touchstart", webViewerTouchStart, { passive: false, signal });
    window.on("touchmove", webViewerTouchMove, { passive: false, signal });
    window.on("touchend", webViewerTouchEnd, { passive: false, signal });
    window.on("click", webViewerClick, { signal });
    window.on("keydown", webViewerKeyDown, { signal });
    window.on("keyup", webViewerKeyUp, { signal });
    window.on(
      "resize",
      () => {
        eventBus.dispatch("resize", { source: window });
      },
      { signal },
    );
    window.on(
      "hashchange",
      () => {
        eventBus.dispatch("hashchange", {
          source: window,
          hash: document.location.hash.substring(1),
        });
      },
      { signal },
    );
    window.on(
      "beforeprint",
      () => {
        eventBus.dispatch("beforeprint", { source: window });
      },
      { signal },
    );
    window.on(
      "afterprint",
      () => {
        eventBus.dispatch("afterprint", { source: window });
      },
      { signal },
    );
    window.addEventListener(
      "updatefromsandbox",
      (event) => {
        eventBus.dispatch("updatefromsandbox", {
          source: window,
          detail: (event as any).detail,
        });
      },
      { signal },
    );

    /*#static*/ if (PDFJSDev || !MOZCENTRAL) {
      if (!("onscrollend" in document.documentElement)) {
        return;
      }
    }
    /*#static*/ if (PDFJSDev || !MOZCENTRAL) {
      // Using the values lastScrollTop and lastScrollLeft is a workaround to
      // https://bugzilla.mozilla.org/show_bug.cgi?id=1881974.
      // TODO: remove them once the bug is fixed.
      ({ scrollTop: this._lastScrollTop, scrollLeft: this._lastScrollLeft } =
        mainContainer);
    }

    const scrollend = () => {
      /*#static*/ if (PDFJSDev || !MOZCENTRAL) {
        ({ scrollTop: this._lastScrollTop, scrollLeft: this._lastScrollLeft } =
          mainContainer);
      }

      this._isScrolling = false;
      mainContainer.on("scroll", scroll, { passive: true, signal });
      mainContainer.off("scrollend", scrollend);
      mainContainer.off("blur", scrollend);
    };
    const scroll = () => {
      if (this._isCtrlKeyDown) {
        return;
      }
      /*#static*/ if ((PDFJSDev || !MOZCENTRAL)) {
        if (
          this._lastScrollTop === mainContainer.scrollTop &&
          this._lastScrollLeft === mainContainer.scrollLeft
        ) {
          return;
        }
      }

      mainContainer.off(
        "scroll",
        scroll,
        { passive: true } as EventListenerOptions,
      );
      this._isScrolling = true;
      mainContainer.on("scrollend", scrollend, { signal });
      mainContainer.on("blur", scrollend, { signal });
    };
    mainContainer.on("scroll", scroll, { passive: true, signal });
  }

  unbindEvents() {
    this._eventBusAbortController?.abort();
    this._eventBusAbortController = undefined;
  }

  unbindWindowEvents() {
    this._windowAbortController?.abort();
    this._windowAbortController = undefined;
  }

  /**
   * @ignore
   */
  async testingClose() {
    this.unbindEvents();
    this.unbindWindowEvents();

    this._globalAbortController?.abort();
    this._globalAbortController = undefined as any;

    this.findBar?.close();

    await Promise.all([this.l10n?.destroy(), this.close()]);
  }

  _accumulateTicks(
    ticks: number,
    prop: "_wheelUnusedTicks" | "_touchUnusedTicks",
  ) {
    // If the direction changed, reset the accumulated ticks.
    if ((this[prop] > 0 && ticks < 0) || (this[prop] < 0 && ticks > 0)) {
      this[prop] = 0;
    }
    this[prop] += ticks;
    const wholeTicks = Math.trunc(this[prop]);
    this[prop] -= wholeTicks;
    return wholeTicks;
  }

  _accumulateFactor(
    previousScale: number,
    factor: number,
    prop: "_wheelUnusedFactor" | "_touchUnusedFactor",
  ) {
    if (factor === 1) {
      return 1;
    }
    // If the direction changed, reset the accumulated factor.
    if ((this[prop] > 1 && factor < 1) || (this[prop] < 1 && factor > 1)) {
      this[prop] = 1;
    }

    const newFactor = Math.floor(previousScale * factor * this[prop] * 100) /
      (100 * previousScale);
    this[prop] = factor / newFactor;

    return newFactor;
  }

  //kkkk TOCLEANUP
  // _centerAtPos(previousScale: number, x: number, y: number) {
  //   const { pdfViewer } = this;
  //   const scaleDiff = pdfViewer.currentScale / previousScale - 1;
  //   if (scaleDiff !== 0) {
  //     const [top, left] = pdfViewer.containerTopLeft;
  //     pdfViewer.container.scrollLeft += (x - left) * scaleDiff;
  //     pdfViewer.container.scrollTop += (y - top) * scaleDiff;
  //   }
  // }

  /**
   * Should be called *after* all pages have loaded, or if an error occurred,
   * to unblock the "load" event; see https://bugzilla.mozilla.org/show_bug.cgi?id=1618553
   */
  #unblockDocumentLoadEvent = () => {
    (document as any).blockUnblockOnload?.(false);

    // Ensure that this method is only ever run once.
    this.#unblockDocumentLoadEvent = () => {};
  };

  /**
   * Used together with the integration-tests, to enable awaiting full
   * initialization of the scripting/sandbox.
   */
  get scriptingReady() {
    return this.pdfScriptingManager.ready;
  }
}

export const viewerApp = new PDFViewerApplication();
initCom(viewerApp);

/*#static*/ if (PDFJSDev || !MOZCENTRAL) {
  PDFPrintServiceFactory.initGlobals(viewerApp);
}

let validateFileURL: (file?: string) => void;
/*#static*/ if (PDFJSDev || GENERIC) {
  const HOSTED_VIEWER_ORIGINS = [
    "null",
    "http://mozilla.github.io",
    "https://mozilla.github.io",
  ];
  validateFileURL = (file) => {
    if (!file) {
      return;
    }
    try {
      const viewerOrigin = new URL(window.location.href).origin || "null";
      if (HOSTED_VIEWER_ORIGINS.includes(viewerOrigin)) {
        // Hosted or local viewer, allow for any file locations
        return;
      }
      const fileOrigin = new URL(file, window.location.href).origin;
      // Removing of the following line will not guarantee that the viewer will
      // start accepting URLs from foreign origin -- CORS headers on the remote
      // server must be properly configured.
      if (fileOrigin !== viewerOrigin) {
        console.log({ fileOrigin, viewerOrigin });
        throw new Error("file origin does not match viewer's");
      }
    } catch (ex: any) {
      viewerApp._documentError("pdfjs-loading-error", {
        message: ex.message,
      });
      throw ex;
    }
  };
}

//kkkk TOCLEANUP
// export interface PDFJSWorker {
//   WorkerMessageHandler: typeof WorkerMessageHandler;
// }

//kkkk TOCLEANUP
// declare global {
//   interface Window {
//     pdfjsWorker?: PDFJSWorker;
//   }
// }

function webViewerPageRender({ pageNumber }: EventMap["pagerender"]) {
  // If the page is (the most) visible when it starts rendering,
  // ensure that the page number input loading indicator is displayed.
  if (pageNumber === viewerApp.page) {
    viewerApp.toolbar?.updateLoadingIndicatorState(true);
  }
}

function webViewerPageRendered(
  { pageNumber, error }: EventMap["pagerendered"],
) {
  // If the page is still visible when it has finished rendering,
  // ensure that the page number input loading indicator is hidden.
  if (pageNumber === viewerApp.page) {
    viewerApp.toolbar?.updateLoadingIndicatorState(false);
  }

  // Use the rendered page to set the corresponding thumbnail image.
  if (viewerApp.pdfSidebar?.visibleView === SidebarView.THUMBS) {
    const pageView = viewerApp.pdfViewer!.getPageView(
      /* index = */ pageNumber - 1,
    );
    const thumbnailView = viewerApp.pdfThumbnailViewer?.getThumbnail(
      /* index = */ pageNumber - 1,
    );
    if (pageView) {
      thumbnailView?.setImage(pageView);
    }
  }

  if (error) {
    viewerApp._otherError("pdfjs-rendering-error", error);
  }
}

function webViewerPageMode({ mode }: EventMap["pagemode"]) {
  // Handle the 'pagemode' hash parameter, see also `PDFLinkService_setHash`.
  const view = /* final switch */ {
    thumbs: SidebarView.THUMBS,
    bookmarks: SidebarView.OUTLINE,
    outline: SidebarView.OUTLINE, // non-standard
    attachments: SidebarView.ATTACHMENTS, // non-standard
    layers: SidebarView.LAYERS, // non-standard
    none: SidebarView.NONE,
  }[mode] ??
    (console.error('Invalid "pagemode" hash parameter: ' + mode), undefined);
  if (view) {
    viewerApp.pdfSidebar?.switchView(view, /* forceOpen = */ true);
  }
}

function webViewerNamedAction(evt: EventMap["namedaction"]) {
  // Processing a couple of named actions that might be useful, see also
  // `PDFLinkService.executeNamedAction`.
  switch (evt.action) {
    case "GoToPage":
      viewerApp.appConfig.toolbar?.pageNumber.select();
      break;

    case "Find":
      if (!viewerApp.supportsIntegratedFind) {
        viewerApp.findBar?.toggle();
      }
      break;

    case "Print":
      viewerApp.triggerPrinting();
      break;

    case "SaveAs":
      viewerApp.downloadOrSave();
      break;
  }
}

function webViewerPresentationModeChanged(
  evt: EventMap["presentationmodechanged"],
) {
  viewerApp.pdfViewer!.presentationModeState = evt.state;
}

function webViewerSidebarViewChanged({ view }: EventMap["sidebarviewchanged"]) {
  viewerApp.pdfRenderingQueue.isThumbnailViewEnabled =
    view === SidebarView.THUMBS;

  if (viewerApp.isInitialViewSet) {
    // Only update the storage when the document has been loaded *and* rendered.
    viewerApp.store?.set("sidebarView", view).catch(() => {
      // Unable to write to storage.
    });
  }
}

function webViewerUpdateViewarea({ location }: EventMap["updateviewarea"]) {
  if (viewerApp.isInitialViewSet) {
    // Only update the storage when the document has been loaded *and* rendered.
    viewerApp.store
      ?.setMultiple({
        page: location!.pageNumber,
        zoom: location!.scale,
        scrollLeft: location!.left,
        scrollTop: location!.top,
        rotation: location!.rotation,
      })
      .catch(() => {
        // Unable to write to storage.
      });
  }
  if (viewerApp.appConfig.secondaryToolbar) {
    const href = viewerApp.pdfLinkService.getAnchorUrl(
      location!.pdfOpenParams,
    );
    viewerApp.appConfig.secondaryToolbar.viewBookmarkButton.href = href;
  }
}

function webViewerScrollModeChanged(evt: EventMap["scrollmodechanged"]) {
  if (
    viewerApp.isInitialViewSet &&
    !viewerApp.pdfViewer.isInPresentationMode
  ) {
    // Only update the storage when the document has been loaded *and* rendered.
    viewerApp.store?.set("scrollMode", evt.mode).catch(() => {
      // Unable to write to storage.
    });
  }
}

function webViewerSpreadModeChanged(evt: EventMap["spreadmodechanged"]) {
  if (
    viewerApp.isInitialViewSet &&
    !viewerApp.pdfViewer.isInPresentationMode
  ) {
    // Only update the storage when the document has been loaded *and* rendered.
    viewerApp.store?.set("spreadMode", evt.mode).catch(() => {
      // Unable to write to storage.
    });
  }
}

function webViewerResize() {
  const { pdfDocument, pdfViewer, pdfRenderingQueue } = viewerApp;

  if (pdfRenderingQueue.printing && window.matchMedia("print").matches) {
    // Work-around issue 15324 by ignoring "resize" events during printing.
    return;
  }

  if (!pdfDocument) {
    return;
  }
  const currentScaleValue = pdfViewer.currentScaleValue;
  if (
    currentScaleValue === "auto" ||
    currentScaleValue === "page-fit" ||
    currentScaleValue === "page-width"
  ) {
    // Note: the scale is constant for 'page-actual'.
    pdfViewer.currentScaleValue = currentScaleValue;
  }
  pdfViewer.update();
}

function webViewerHashchange(evt: EventMap["hashchange"]) {
  const hash = evt.hash;
  if (!hash) return;

  if (!viewerApp.isInitialViewSet) {
    viewerApp.initialBookmark = hash;
  } else if (!viewerApp.pdfHistory?.popStateInProgress) {
    viewerApp.pdfLinkService!.setHash(hash);
  }
}

/*#static*/ if (PDFJSDev || GENERIC) {
  // eslint-disable-next-line no-var
  var webViewerFileInputChange = (evt: EventMap["fileinputchange"]) => {
    if (viewerApp.pdfViewer?.isInPresentationMode) {
      return; // Opening a new PDF file isn't supported in Presentation Mode.
    }
    const file = (evt.fileInput as DataTransfer).files[0];

    viewerApp.open({
      url: URL.createObjectURL(file),
      originalUrl: file.name,
    });
  };

  // eslint-disable-next-line no-var
  var webViewerOpenFile = (evt: EventMap["openfile"]) => {
    viewerApp._openFileInput?.click();
  };
}

function webViewerPresentationMode() {
  viewerApp.requestPresentationMode();
}
function webViewerSwitchAnnotationEditorMode(
  evt: EventMap["switchannotationeditormode"],
) {
  viewerApp.pdfViewer.annotationEditorMode = evt;
}
function webViewerSwitchAnnotationEditorParams(
  evt: EventMap["switchannotationeditorparams"],
) {
  viewerApp.pdfViewer.annotationEditorParams = evt;
}
function webViewerPrint() {
  viewerApp.triggerPrinting();
}
function webViewerDownload() {
  viewerApp.downloadOrSave();
}
function webViewerFirstPage() {
  viewerApp.page = 1;
}
function webViewerLastPage() {
  viewerApp.page = viewerApp.pagesCount;
}
function webViewerNextPage() {
  viewerApp.pdfViewer!.nextPage();
}
function webViewerPreviousPage() {
  viewerApp.pdfViewer!.previousPage();
}
function webViewerZoomIn() {
  viewerApp.zoomIn();
}
function webViewerZoomOut() {
  viewerApp.zoomOut();
}
function webViewerZoomReset() {
  viewerApp.zoomReset();
}
function webViewerPageNumberChanged(evt: EventMap["pagenumberchanged"]) {
  const pdfViewer = viewerApp.pdfViewer;
  // Note that for `<input type="number">` HTML elements, an empty string will
  // be returned for non-number inputs; hence we simply do nothing in that case.
  if (evt.value !== "") {
    viewerApp.pdfLinkService!.goToPage(evt.value);
  }

  // Ensure that the page number input displays the correct value, even if the
  // value entered by the user was invalid (e.g. a floating point number).
  if (
    evt.value !== pdfViewer.currentPageNumber.toString() &&
    evt.value !== pdfViewer.currentPageLabel
  ) {
    viewerApp.toolbar?.setPageNumber(
      pdfViewer.currentPageNumber,
      pdfViewer.currentPageLabel,
    );
  }
}
function webViewerScaleChanged(evt: EventMap["scalechanged"]) {
  viewerApp.pdfViewer!.currentScaleValue = evt.value;
}
function webViewerRotateCw() {
  viewerApp.rotatePages(90);
}
function webViewerRotateCcw() {
  viewerApp.rotatePages(-90);
}
function webViewerOptionalContentConfig(
  evt: EventMap["optionalcontentconfig"],
) {
  viewerApp.pdfViewer!.optionalContentConfigPromise = evt.promise;
}
function webViewerSwitchScrollMode(evt: EventMap["switchscrollmode"]) {
  viewerApp.pdfViewer!.scrollMode = evt.mode;
}
function webViewerSwitchSpreadMode(evt: EventMap["switchspreadmode"]) {
  viewerApp.pdfViewer!.spreadMode = evt.mode;
}
function webViewerDocumentProperties() {
  viewerApp.pdfDocumentProperties?.open();
}

function webViewerFindFromUrlHash(evt: EventMap["findfromurlhash"]) {
  viewerApp.eventBus.dispatch("find", {
    source: evt.source,
    type: "",
    query: evt.query,
    caseSensitive: false,
    entireWord: false,
    highlightAll: true,
    findPrevious: false,
    matchDiacritics: true,
  });
}

function webViewerUpdateFindMatchesCount(
  { matchesCount }: EventMap["updatefindmatchescount"],
) {
  if (viewerApp.supportsIntegratedFind) {
    viewerApp.externalServices.updateFindMatchesCount(matchesCount);
  } else {
    viewerApp.findBar?.updateResultsCount(matchesCount);
  }
}

function webViewerUpdateFindControlState({
  state,
  previous,
  entireWord,
  matchesCount,
  rawQuery,
}: EventMap["updatefindcontrolstate"]) {
  if (viewerApp.supportsIntegratedFind) {
    viewerApp.externalServices.updateFindControlState({
      result: state,
      findPrevious: previous,
      entireWord,
      matchesCount,
      rawQuery,
    });
  } else {
    viewerApp.findBar!.updateUIState(state, previous, matchesCount);
  }
}

function webViewerScaleChanging(evt: EventMap["scalechanging"]) {
  viewerApp.toolbar?.setPageScale(evt.presetValue, evt.scale);

  viewerApp.pdfViewer.update();
}

function webViewerRotationChanging(evt: EventMap["rotationchanging"]) {
  if (viewerApp.pdfThumbnailViewer) {
    viewerApp.pdfThumbnailViewer!.pagesRotation = evt.pagesRotation;
  }

  viewerApp.forceRendering();
  // Ensure that the active page doesn't change during rotation.
  viewerApp.pdfViewer!.currentPageNumber = evt.pageNumber;
}

function webViewerPageChanging(
  { pageNumber, pageLabel }: EventMap["pagechanging"],
) {
  viewerApp.toolbar?.setPageNumber(pageNumber, pageLabel);
  viewerApp.secondaryToolbar?.setPageNumber(pageNumber);

  if (viewerApp.pdfSidebar?.visibleView === SidebarView.THUMBS) {
    viewerApp.pdfThumbnailViewer?.scrollThumbnailIntoView(pageNumber);
  }

  // Show/hide the loading indicator in the page number input element.
  const currentPage = viewerApp.pdfViewer.getPageView(
    /* index = */ pageNumber - 1,
  );
  viewerApp.toolbar?.updateLoadingIndicatorState(
    currentPage?.renderingState === RenderingStates.RUNNING,
  );
}

function webViewerResolutionChange(evt: MediaQueryListEvent) {
  viewerApp.pdfViewer.refresh();
}

function webViewerWheel(evt: WheelEvent) {
  const {
    pdfViewer,
    supportsMouseWheelZoomCtrlKey,
    supportsMouseWheelZoomMetaKey,
    supportsPinchToZoom,
  } = viewerApp;

  if (pdfViewer.isInPresentationMode) {
    return;
  }

  // Pinch-to-zoom on a trackpad maps to a wheel event with ctrlKey set to true
  // https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent#browser_compatibility
  // Hence if ctrlKey is true but ctrl key hasn't been pressed then we can
  // infer that we have a pinch-to-zoom.
  // But the ctrlKey could have been pressed outside of the browser window,
  // hence we try to do some magic to guess if the scaleFactor is likely coming
  // from a pinch-to-zoom or not.

  // It is important that we query deltaMode before delta{X,Y}, so that
  // Firefox doesn't switch to DOM_DELTA_PIXEL mode for compat with other
  // browsers, see https://bugzilla.mozilla.org/show_bug.cgi?id=1392460.
  const deltaMode = evt.deltaMode;

  // The following formula is a bit strange but it comes from:
  // https://searchfox.org/mozilla-central/rev/d62c4c4d5547064487006a1506287da394b64724/widget/InputData.cpp#618-626
  let scaleFactor = Math.exp(-evt.deltaY / 100);

  const isBuiltInMac = MOZCENTRAL && FeatureTest.platform.isMac;
  const isPinchToZoom = evt.ctrlKey &&
    !viewerApp._isCtrlKeyDown &&
    deltaMode === WheelEvent.DOM_DELTA_PIXEL &&
    evt.deltaX === 0 &&
    (Math.abs(scaleFactor - 1) < 0.05 || isBuiltInMac) &&
    evt.deltaZ === 0;
  const origin: dot2d_t = [evt.clientX, evt.clientY];

  if (
    isPinchToZoom ||
    (evt.ctrlKey && supportsMouseWheelZoomCtrlKey) ||
    (evt.metaKey && supportsMouseWheelZoomMetaKey)
  ) {
    // Only zoom the pages, not the entire viewer.
    evt.preventDefault();
    // NOTE: this check must be placed *after* preventDefault.
    if (
      viewerApp._isScrolling ||
      document.visibilityState === "hidden" ||
      viewerApp.overlayManager.active
    ) {
      return;
    }

    const previousScale = pdfViewer.currentScale;
    if (isPinchToZoom && supportsPinchToZoom) {
      scaleFactor = viewerApp._accumulateFactor(
        pdfViewer.currentScale,
        scaleFactor,
        "_wheelUnusedFactor",
      );
      viewerApp.updateZoom(undefined, scaleFactor, origin);
    } else {
      const delta = normalizeWheelEventDirection(evt);

      let ticks = 0;
      if (
        deltaMode === WheelEvent.DOM_DELTA_LINE ||
        deltaMode === WheelEvent.DOM_DELTA_PAGE
      ) {
        // For line-based devices, use one tick per event, because different
        // OSs have different defaults for the number lines. But we generally
        // want one "clicky" roll of the wheel (which produces one event) to
        // adjust the zoom by one step.
        if (Math.abs(delta) >= 1) {
          ticks = Math.sign(delta);
        } else {
          // If we're getting fractional lines (I can't think of a scenario
          // this might actually happen), be safe and use the accumulator.
          ticks = viewerApp._accumulateTicks(
            delta,
            "_wheelUnusedTicks",
          );
        }
      } else {
        // pixel-based devices
        const PIXELS_PER_LINE_SCALE = 30;
        ticks = viewerApp._accumulateTicks(
          delta / PIXELS_PER_LINE_SCALE,
          "_wheelUnusedTicks",
        );
      }

      viewerApp.updateZoom(ticks, undefined, origin);
    }
  }
}

function webViewerTouchStart(evt: TouchEvent) {
  if (
    viewerApp.pdfViewer.isInPresentationMode ||
    evt.touches.length < 2
  ) {
    return;
  }
  evt.preventDefault();

  if (evt.touches.length !== 2 || viewerApp.overlayManager.active) {
    viewerApp._touchInfo = undefined;
    return;
  }

  let [touch0, touch1] = evt.touches;
  if (touch0.identifier > touch1.identifier) {
    [touch0, touch1] = [touch1, touch0];
  }
  viewerApp._touchInfo = {
    touch0X: touch0.pageX,
    touch0Y: touch0.pageY,
    touch1X: touch1.pageX,
    touch1Y: touch1.pageY,
  };
}

function webViewerTouchMove(evt: TouchEvent) {
  if (!viewerApp._touchInfo || evt.touches.length !== 2) {
    return;
  }

  const { pdfViewer, _touchInfo, supportsPinchToZoom } = viewerApp;
  let [touch0, touch1] = evt.touches;
  if (touch0.identifier > touch1.identifier) {
    [touch0, touch1] = [touch1, touch0];
  }
  const { pageX: page0X, pageY: page0Y } = touch0;
  const { pageX: page1X, pageY: page1Y } = touch1;
  const {
    touch0X: pTouch0X,
    touch0Y: pTouch0Y,
    touch1X: pTouch1X,
    touch1Y: pTouch1Y,
  } = _touchInfo;

  if (
    Math.abs(pTouch0X - page0X) <= 1 &&
    Math.abs(pTouch0Y - page0Y) <= 1 &&
    Math.abs(pTouch1X - page1X) <= 1 &&
    Math.abs(pTouch1Y - page1Y) <= 1
  ) {
    // Touches are really too close and it's hard do some basic
    // geometry in order to guess something.
    return;
  }

  _touchInfo.touch0X = page0X;
  _touchInfo.touch0Y = page0Y;
  _touchInfo.touch1X = page1X;
  _touchInfo.touch1Y = page1Y;

  if (pTouch0X === page0X && pTouch0Y === page0Y) {
    // First touch is fixed, if the vectors are collinear then we've a pinch.
    const v1X = pTouch1X - page0X;
    const v1Y = pTouch1Y - page0Y;
    const v2X = page1X - page0X;
    const v2Y = page1Y - page0Y;
    const det = v1X * v2Y - v1Y * v2X;
    // 0.02 is approximatively sin(0.15deg).
    if (Math.abs(det) > 0.02 * Math.hypot(v1X, v1Y) * Math.hypot(v2X, v2Y)) {
      return;
    }
  } else if (pTouch1X === page1X && pTouch1Y === page1Y) {
    // Second touch is fixed, if the vectors are collinear then we've a pinch.
    const v1X = pTouch0X - page1X;
    const v1Y = pTouch0Y - page1Y;
    const v2X = page0X - page1X;
    const v2Y = page0Y - page1Y;
    const det = v1X * v2Y - v1Y * v2X;
    if (Math.abs(det) > 0.02 * Math.hypot(v1X, v1Y) * Math.hypot(v2X, v2Y)) {
      return;
    }
  } else {
    const diff0X = page0X - pTouch0X;
    const diff1X = page1X - pTouch1X;
    const diff0Y = page0Y - pTouch0Y;
    const diff1Y = page1Y - pTouch1Y;
    const dotProduct = diff0X * diff1X + diff0Y * diff1Y;
    if (dotProduct >= 0) {
      // The two touches go in almost the same direction.
      return;
    }
  }

  evt.preventDefault();

  const origin: dot2d_t = [(page0X + page1X) / 2, (page0Y + page1Y) / 2];
  const distance = Math.hypot(page0X - page1X, page0Y - page1Y) || 1;
  const pDistance = Math.hypot(pTouch0X - pTouch1X, pTouch0Y - pTouch1Y) || 1;
  const previousScale = pdfViewer.currentScale;
  if (supportsPinchToZoom) {
    const newScaleFactor = viewerApp._accumulateFactor(
      pdfViewer.currentScale,
      distance / pDistance,
      "_touchUnusedFactor",
    );
    viewerApp.updateZoom(undefined, newScaleFactor, origin);
  } else {
    const PIXELS_PER_LINE_SCALE = 30;
    const ticks = viewerApp._accumulateTicks(
      (distance - pDistance) / PIXELS_PER_LINE_SCALE,
      "_touchUnusedTicks",
    );
    viewerApp.updateZoom(ticks, undefined, origin);
  }
}

function webViewerTouchEnd(evt: TouchEvent) {
  if (!viewerApp._touchInfo) {
    return;
  }

  evt.preventDefault();
  viewerApp._touchInfo = undefined;
  viewerApp._touchUnusedTicks = 0;
  viewerApp._touchUnusedFactor = 1;
}

function webViewerClick(evt: MouseEvent) {
  if (!viewerApp.secondaryToolbar?.isOpen) {
    return;
  }
  const appConfig = viewerApp.appConfig;
  if (
    viewerApp.pdfViewer!.containsElement(evt.target as Node | null) ||
    (appConfig.toolbar?.container.contains(evt.target as Node | null) &&
      evt.target !== appConfig.secondaryToolbar?.toggleButton)
  ) {
    viewerApp.secondaryToolbar!.close();
  }
}

function webViewerKeyUp(evt: KeyboardEvent) {
  // evt.ctrlKey is false hence we use evt.key.
  if (evt.key === "Control") {
    viewerApp._isCtrlKeyDown = false;
  }
}

function webViewerKeyDown(evt: KeyboardEvent) {
  viewerApp._isCtrlKeyDown = evt.key === "Control";

  if (viewerApp.overlayManager.active) {
    return;
  }
  const { eventBus, pdfViewer } = viewerApp;
  const isViewerInPresentationMode = pdfViewer.isInPresentationMode;

  let handled = false,
    ensureViewerFocused = false;
  const cmd = (evt.ctrlKey ? 1 : 0) |
    (evt.altKey ? 2 : 0) |
    (evt.shiftKey ? 4 : 0) |
    (evt.metaKey ? 8 : 0);

  // First, handle the key bindings that are independent whether an input
  // control is selected or not.
  if (cmd === 1 || cmd === 8 || cmd === 5 || cmd === 12) {
    // either CTRL or META key with optional SHIFT.
    switch (evt.keyCode) {
      case 70: // f
        if (!viewerApp.supportsIntegratedFind && !evt.shiftKey) {
          viewerApp.findBar?.open();
          handled = true;
        }
        break;
      case 71: // g
        if (!viewerApp.supportsIntegratedFind) {
          const { state } = viewerApp.findController;
          if (state) {
            const newState = {
              source: window,
              type: "again" as FindType,
              findPrevious: cmd === 5 || cmd === 12,
            };
            eventBus.dispatch("find", { ...state, ...newState });
          }
          handled = true;
        }
        break;
      case 61: // FF/Mac '='
      case 107: // FF '+' and '='
      case 187: // Chrome '+'
      case 171: // FF with German keyboard
        viewerApp.zoomIn();
        handled = true;
        break;
      case 173: // FF/Mac '-'
      case 109: // FF '-'
      case 189: // Chrome '-'
        if (!isViewerInPresentationMode) {
          viewerApp.zoomOut();
        }
        handled = true;
        break;
      case 48: // '0'
      case 96: // '0' on Numpad of Swedish keyboard
        if (!isViewerInPresentationMode) {
          // keeping it unhandled (to restore page zoom to 100%)
          setTimeout(() => {
            // ... and resetting the scale after browser adjusts its scale
            viewerApp.zoomReset();
          });
          handled = false;
        }
        break;

      case 38: // up arrow
        if (isViewerInPresentationMode || viewerApp.page > 1) {
          viewerApp.page = 1;
          handled = true;
          ensureViewerFocused = true;
        }
        break;
      case 40: // down arrow
        if (
          isViewerInPresentationMode ||
          viewerApp.page < viewerApp.pagesCount
        ) {
          viewerApp.page = viewerApp.pagesCount;
          handled = true;
          ensureViewerFocused = true;
        }
        break;
    }
  }

  /*#static*/ if (PDFJSDev || GENERIC || CHROME) {
    // CTRL or META without shift
    if (cmd === 1 || cmd === 8) {
      switch (evt.keyCode) {
        case 83: // s
          eventBus.dispatch("download", { source: window });
          handled = true;
          break;

        case 79: // o
          /*#static*/ if (PDFJSDev || GENERIC) {
            eventBus.dispatch("openfile", { source: window });
            handled = true;
          }
          break;
      }
    }
  }

  // CTRL+ALT or Option+Command
  if (cmd === 3 || cmd === 10) {
    switch (evt.keyCode) {
      case 80: // p
        viewerApp.requestPresentationMode();
        handled = true;
        viewerApp.externalServices.reportTelemetry({
          type: "buttons",
          data: { id: "presentationModeKeyboard" },
        });
        break;
      case 71: // g
        // focuses input#pageNumber field
        if (viewerApp.appConfig.toolbar) {
          viewerApp.appConfig.toolbar.pageNumber.select();
          handled = true;
        }
        break;
    }
  }

  if (handled) {
    if (ensureViewerFocused && !isViewerInPresentationMode) {
      pdfViewer!.focus();
    }
    evt.preventDefault();
    return;
  }

  // Some shortcuts should not get handled if a control/input element
  // is selected.
  const curElement = getActiveOrFocusedElement();
  const curElementTagName = curElement?.tagName.toUpperCase();
  if (
    curElementTagName === "INPUT" ||
    curElementTagName === "TEXTAREA" ||
    curElementTagName === "SELECT" ||
    (curElementTagName === "BUTTON" &&
      (evt.keyCode === /* Enter = */ 13 || evt.keyCode === /* Space = */ 32)) ||
    (curElement as HTMLElement)?.isContentEditable
  ) {
    // Make sure that the secondary toolbar is closed when Escape is pressed.
    if (evt.keyCode !== /* Esc = */ 27) {
      return;
    }
  }

  // No control key pressed at all.
  if (cmd === 0) {
    let turnPage = 0,
      turnOnlyIfPageFit = false;
    switch (evt.keyCode) {
      case 38: // up arrow
        if (viewerApp.supportsCaretBrowsingMode) {
          viewerApp.moveCaret(
            /* isUp = */ true,
            /* select = */ false,
          );
          handled = true;
          break;
        }
      /* falls through */
      case 33: // pg up
        // vertical scrolling using arrow/pg keys
        if (pdfViewer!.isVerticalScrollbarEnabled) {
          turnOnlyIfPageFit = true;
        }
        turnPage = -1;
        break;
      case 8: // backspace
        if (!isViewerInPresentationMode) {
          turnOnlyIfPageFit = true;
        }
        turnPage = -1;
        break;
      case 37: // left arrow
        if (viewerApp.supportsCaretBrowsingMode) {
          return;
        }
        // horizontal scrolling using arrow keys
        if (pdfViewer!.isHorizontalScrollbarEnabled) {
          turnOnlyIfPageFit = true;
        }
      /* falls through */
      case 75: // 'k'
      case 80: // 'p'
        turnPage = -1;
        break;
      case 27: // esc key
        if (viewerApp.secondaryToolbar?.isOpen) {
          viewerApp.secondaryToolbar.close();
          handled = true;
        }
        if (
          !viewerApp.supportsIntegratedFind &&
          viewerApp.findBar?.opened
        ) {
          viewerApp.findBar.close();
          handled = true;
        }
        break;
      case 40: // down arrow
        if (viewerApp.supportsCaretBrowsingMode) {
          viewerApp.moveCaret(
            /* isUp = */ false,
            /* select = */ false,
          );
          handled = true;
          break;
        }
      /* falls through */
      case 34: // pg down
        // vertical scrolling using arrow/pg keys
        if (pdfViewer!.isVerticalScrollbarEnabled) {
          turnOnlyIfPageFit = true;
        }
        turnPage = 1;
        break;
      case 13: // enter key
      case 32: // spacebar
        if (!isViewerInPresentationMode) {
          turnOnlyIfPageFit = true;
        }
        turnPage = 1;
        break;
      case 39: // right arrow
        if (viewerApp.supportsCaretBrowsingMode) {
          return;
        }
        // horizontal scrolling using arrow keys
        if (pdfViewer!.isHorizontalScrollbarEnabled) {
          turnOnlyIfPageFit = true;
        }
      /* falls through */
      case 74: // 'j'
      case 78: // 'n'
        turnPage = 1;
        break;

      case 36: // home
        if (isViewerInPresentationMode || viewerApp.page > 1) {
          viewerApp.page = 1;
          handled = true;
          ensureViewerFocused = true;
        }
        break;
      case 35: // end
        if (
          isViewerInPresentationMode ||
          viewerApp.page < viewerApp.pagesCount
        ) {
          viewerApp.page = viewerApp.pagesCount;
          handled = true;
          ensureViewerFocused = true;
        }
        break;

      case 83: // 's'
        viewerApp.pdfCursorTools?.switchTool(CursorTool.SELECT);
        break;
      case 72: // 'h'
        viewerApp.pdfCursorTools?.switchTool(CursorTool.HAND);
        break;

      case 82: // 'r'
        viewerApp.rotatePages(90);
        break;

      case 115: // F4
        viewerApp.pdfSidebar?.toggle();
        break;
    }

    if (
      turnPage !== 0 &&
      (!turnOnlyIfPageFit || pdfViewer!.currentScaleValue === "page-fit")
    ) {
      if (turnPage > 0) {
        pdfViewer!.nextPage();
      } else {
        pdfViewer!.previousPage();
      }
      handled = true;
    }
  }

  // shift-key
  if (cmd === 4) {
    switch (evt.keyCode) {
      case 13: // enter key
      case 32: // spacebar
        if (
          !isViewerInPresentationMode &&
          pdfViewer!.currentScaleValue !== "page-fit"
        ) {
          break;
        }
        pdfViewer.previousPage();

        handled = true;
        break;

      case 38: // up arrow
        viewerApp.moveCaret(/* isUp = */ true, /* select = */ true);
        handled = true;
        break;
      case 40: // down arrow
        viewerApp.moveCaret(/* isUp = */ false, /* select = */ true);
        handled = true;
        break;
      case 82: // 'r'
        viewerApp.rotatePages(-90);
        break;
    }
  }

  if (!handled && !isViewerInPresentationMode) {
    // 33=Page Up  34=Page Down  35=End    36=Home
    // 37=Left     38=Up         39=Right  40=Down
    // 32=Spacebar
    if (
      (evt.keyCode >= 33 && evt.keyCode <= 40) ||
      (evt.keyCode === 32 && curElementTagName !== "BUTTON")
    ) {
      ensureViewerFocused = true;
    }
  }

  if (ensureViewerFocused && !pdfViewer!.containsElement(curElement!)) {
    // The page container is not focused, but a page navigation key has been
    // pressed. Change the focus to the viewer container to make sure that
    // navigation by keyboard works as expected.
    pdfViewer!.focus();
  }

  if (handled) {
    evt.preventDefault();
  }
}

function beforeUnload(evt: BeforeUnloadEvent) {
  evt.preventDefault();
  evt.returnValue = "";
  return false;
}

function webViewerAnnotationEditorStatesChanged(
  data: EventMap["annotationeditorstateschanged"],
) {
  viewerApp.externalServices.updateEditorStates(data);
}

function webViewerReportTelemetry({ details }: EventMap["reporttelemetry"]) {
  viewerApp.externalServices.reportTelemetry(details);
}

function webViewerSetPreference({ name, value }: EventMap["setpreference"]) {
  viewerApp.preferences.set(name, value);
}

//kkkk TOCLEANUP
// /* Abstract factory for the print service. */
// export const PDFPrintServiceFactory = {
//   instance: {
//     supportsPrinting: false,
//     createPrintService(
//       pdfDocument: PDFDocumentProxy,
//       pagesOverview: PageOverview[],
//       printContainer: HTMLDivElement,
//       printResolution: number | undefined,
//       optionalContentConfigPromise:
//         | Promise<OptionalContentConfig | undefined>
//         | undefined,
//       printAnnotationStoragePromise?: Promise<
//         PrintAnnotationStorage | undefined
//       >,
//       l10n?: IL10n,
//     ): PDFPrintService {
//       throw new Error("Not implemented: createPrintService");
//     },
//   },
// };
/*80--------------------------------------------------------------------------*/
