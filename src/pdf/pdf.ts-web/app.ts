/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
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

import { Locale } from "@fe-lib/Locale.ts";
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
} from "@fe-src/global.ts";
import type {
  DocumentInfo,
  DocumentInitP,
  ExplicitDest,
  Metadata,
  OpenAction,
  OptionalContentConfig,
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
  loadScript,
  PDFWorker,
  shadow,
  version,
  WorkerMessageHandler,
} from "../pdf.ts-src/pdf.ts";
import type { ActionEventName } from "../pdf.ts-src/shared/util.ts";
import { AltTextManager } from "./alt_text_manager.ts";
import { AnnotationEditorParams } from "./annotation_editor_params.ts";
import {
  AppOptions,
  OptionKind,
  ViewerCssTheme,
  ViewOnLoad,
} from "./app_options.ts";
import { PDFBug } from "./debugger.ts";
import { AutomationEventBus, EventBus, type EventMap } from "./event_utils.ts";
import type { NimbusExperimentData } from "./firefoxcom.ts";
import type { IDownloadManager, IL10n, IScripting } from "./interfaces.ts";
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
import { type PageOverview, PDFViewer } from "./pdf_viewer.ts";
import type { BasePreferences } from "./preferences.ts";
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
/*80--------------------------------------------------------------------------*/

const FORCE_PAGES_LOADED_TIMEOUT = 10000; // ms
const WHEEL_ZOOM_DISABLED_TIMEOUT = 1000; // ms

export interface FindControlState {
  result: FindState;
  findPrevious?: boolean | undefined;
  matchesCount: MatchesCount;
  rawQuery: string | string[] | RegExpMatchArray | null;
}

export interface PassiveLoadingCbs {
  onOpenWithTransport(_x: PDFDataRangeTransport): void;
  onOpenWithData(
    data: ArrayBuffer,
    contentDispositionFilename: string,
  ): void;
  onOpenWithURL(url: string, length?: number, originalUrl?: string): void;
  onError(err?: ErrorMoreInfo): void;
  onProgress(loaded: number, total: number): void;
}

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

export class DefaultExternalServices {
  updateFindControlState(data: FindControlState) {}

  updateFindMatchesCount(data: MatchesCount) {}

  initPassiveLoading(callbacks: PassiveLoadingCbs) {}

  reportTelemetry(data: EventMap["reporttelemetry"]["details"]) {}

  createDownloadManager(): IDownloadManager {
    throw new Error("Not implemented: createDownloadManager");
  }

  createPreferences(): BasePreferences {
    throw new Error("Not implemented: createPreferences");
  }

  createL10n({ locale = Locale.en_US } = {}): IL10n {
    throw new Error("Not implemented: createL10n");
  }

  createScripting(
    options: { sandboxBundleSrc?: string | undefined },
  ): IScripting {
    throw new Error("Not implemented: createScripting");
  }

  get supportsPinchToZoom() {
    return shadow(this, "supportsPinchToZoom", true);
  }

  get supportsIntegratedFind() {
    return shadow(this, "supportsIntegratedFind", false);
  }

  get supportsDocumentFonts() {
    return shadow(this, "supportsDocumentFonts", true);
  }

  get supportedMouseWheelZoomModifierKeys() {
    return shadow(this, "supportedMouseWheelZoomModifierKeys", {
      ctrlKey: true,
      metaKey: true,
    });
  }

  get isInAutomation() {
    return shadow(this, "isInAutomation", false);
  }

  updateEditorStates(data: EventMap["annotationeditorstateschanged"]) {
    throw new Error("Not implemented: updateEditorStates");
  }

  get canvasMaxAreaInBytes() {
    return shadow(this, "canvasMaxAreaInBytes", -1);
  }

  getNimbusExperimentData(): Promise<NimbusExperimentData | undefined> {
    return shadow(this, "getNimbusExperimentData", Promise.resolve(undefined));
  }
}

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
  range?: PDFDataRangeTransport;
  originalUrl?: string | undefined;
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

  preferences!: BasePreferences;
  l10n!: IL10n;
  annotationEditorParams?: AnnotationEditorParams;
  isInitialViewSet = false;
  downloadComplete = false;
  isViewerEmbedded = window.parent !== window;
  url = "";
  baseUrl = "";
  _downloadUrl = "";
  externalServices = new DefaultExternalServices();
  _boundEvents: Record<string, ((...args: any[]) => void) | undefined> = Object
    .create(null);
  documentInfo: DocumentInfo | undefined;
  metadata: Metadata | undefined;
  #contentDispositionFilename: string | undefined;
  _contentLength: number | undefined;

  _saveInProgress = false;
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
  _nimbusDataPromise?: Promise<NimbusExperimentData | undefined>;

  disableAutoFetchLoadingBarTimeout: number | undefined;

  _annotationStorageModified?: boolean;

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
    this.preferences = this.externalServices.createPreferences();
    this.appConfig = appConfig;

    if (PDFJSDev ? (window as any).isGECKOVIEW : GECKOVIEW) {
      this._nimbusDataPromise = this.externalServices.getNimbusExperimentData();
    }

    await this.#initializeOptions();
    this.#forceCssTheme();
    await this.#initializeL10n();

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

    // We can start UI localization now.
    const appContainer = appConfig.appContainer || document.documentElement;
    this.l10n.translate(appContainer).then(() => {
      // Dispatch the 'localized' event on the `eventBus` once the viewer
      // has been fully initialized and translated.
      this.eventBus.dispatch("localized", { source: this });
    });

    this.#initializedCapability.resolve();
  }

  async #initializeOptions() {
    /*#static*/ if (PDFJSDev || GENERIC) {
      if (AppOptions.disablePreferences) {
        if (AppOptions.pdfBugEnabled) {
          await this.#parseHashParams();
        }
        // Give custom implementations of the default viewer a simpler way to
        // opt-out of having the `Preferences` override existing `AppOptions`.
        return;
      }
      if (AppOptions._hasUserOptions()) {
        console.warn(
          "#initializeOptions: The Preferences may override manually set AppOptions; " +
            'please use the "disablePreferences"-option in order to prevent that.',
        );
      }
    }
    try {
      AppOptions.setAll(await this.preferences!.getAll());
    } catch (reason) {
      console.error(`#initializeOptions: "${(reason as any).message}".`);
    }

    if (AppOptions.pdfBugEnabled) {
      await this.#parseHashParams();
    }
  }

  /**
   * Potentially parse special debugging flags in the hash section of the URL.
   */
  async #parseHashParams() {
    const hash = document.location.hash.substring(1);
    if (!hash) return;

    const { mainContainer, viewerContainer } = this.appConfig,
      params = parseQueryString(hash);

    if (params.get("workermodules") === "true") {
      try {
        await loadFakeWorker();
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
            await loadPDFBug(this);
            this._PDFBug!.loadCSS();
          } catch (ex) {
            console.error(`#parseHashParams: "${(ex as any).message}".`);
          }
          break;
      }
    }
    if (params.has("pdfbug")) {
      AppOptions.set("pdfBug", true);
      AppOptions.set("fontExtraProperties", true);

      const enabled = params.get("pdfbug")!.split(",");
      try {
        await loadPDFBug(this);
        this._PDFBug!.init(mainContainer, enabled);
      } catch (ex) {
        console.error(`#parseHashParams: "${(ex as any).message}".`);
      }
    }
    // It is not possible to change locale for the (various) extension builds.
    /*#static*/ if (PDFJSDev || GENERIC) {
      if (params.has("locale")) {
        AppOptions.set("locale", params.get("locale"));
      }
    }
  }

  async #initializeL10n() {
    this.l10n = this.externalServices.createL10n(
      /*#static*/ PDFJSDev || GENERIC
        ? { locale: AppOptions.locale as Locale }
        : undefined,
    );
    const dir = await this.l10n.getDirection();
    document.getElementsByTagName("html")[0].dir = dir;
  }

  #forceCssTheme() {
    const cssTheme = AppOptions.viewerCssTheme;
    if (
      cssTheme === ViewerCssTheme.AUTOMATIC ||
      !Object.values(ViewerCssTheme).includes(cssTheme!)
    ) {
      return;
    }
    try {
      const styleSheet = document.styleSheets[0];
      const cssRules = styleSheet?.cssRules || [];
      for (let i = 0, ii = cssRules.length; i < ii; i++) {
        const rule = cssRules[i];
        if (
          rule instanceof CSSMediaRule &&
          rule.media?.[0] === "(prefers-color-scheme: dark)"
        ) {
          if (cssTheme === ViewerCssTheme.LIGHT) {
            styleSheet.deleteRule(i);
            return;
          }
          // cssTheme === ViewerCssTheme.DARK
          const darkRules =
            /^@media \(prefers-color-scheme: dark\) {\n\s*([\w\s-.,:;/\\{}()]+)\n}$/
              .exec(
                rule.cssText,
              );
          if (darkRules?.[1]) {
            styleSheet.deleteRule(i);
            styleSheet.insertRule(darkRules[1], i);
          }
          return;
        }
      }
    } catch (reason) {
      console.error(`#forceCssTheme: "${(reason as any)?.message}".`);
    }
  }

  async #initializeViewerComponents() {
    const { appConfig, externalServices, l10n } = this;

    const eventBus = externalServices.isInAutomation
      ? new AutomationEventBus()
      : new EventBus();
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

    const downloadManager = externalServices.createDownloadManager();
    this.downloadManager = downloadManager;

    const findController = new PDFFindController({
      linkService: pdfLinkService,
      eventBus,
      // updateMatchesCountOnProgress:
      //   typeof PDFJSDev === "undefined"
      //     ? !window.isGECKOVIEW
      //     : !PDFJSDev.test("GECKOVIEW"),
      updateMatchesCountOnProgress: /*#static*/ !GECKOVIEW ? true : false,
    });
    this.findController = findController;

    const pdfScriptingManager = new PDFScriptingManager({
      eventBus,
      sandboxBundleSrc: /*#static*/ PDFJSDev || GENERIC || CHROME
        ? AppOptions.sandboxBundleSrc
        : undefined,
      externalServices,
      docProperties: this.#scriptingDocProperties,
    });
    this.pdfScriptingManager = pdfScriptingManager;

    const container = appConfig.mainContainer,
      viewer = appConfig.viewerContainer;
    const annotationEditorMode = AppOptions.annotationEditorMode;
    const isOffscreenCanvasSupported = AppOptions.isOffscreenCanvasSupported &&
      FeatureTest.isOffscreenCanvasSupported;
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
      imageResourcesPath: AppOptions.imageResourcesPath,
      enablePrintAutoRotate: AppOptions.enablePrintAutoRotate,
      isOffscreenCanvasSupported,
      maxCanvasPixels: AppOptions.maxCanvasPixels,
      enablePermissions: AppOptions.enablePermissions,
      pageColors,
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
        l10n,
        pageColors,
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
      this.findBar = new PDFFindBar(appConfig.findBar, eventBus, l10n);
    }

    if (appConfig.annotationEditorParams) {
      if (annotationEditorMode !== AnnotationEditorType.DISABLE) {
        if (AppOptions.enableStampEditor && isOffscreenCanvasSupported) {
          appConfig.toolbar?.editorStampButton?.classList.remove("hidden");
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
        this.toolbar = new GeckoviewToolbar(
          appConfig.toolbar as any,
          eventBus,
          l10n,
          await this._nimbusDataPromise,
        );
      } else {
        this.toolbar = new Toolbar(appConfig.toolbar, eventBus, l10n);
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
        l10n,
        this.isViewerEmbedded,
      );
    }

    if (appConfig.sidebar?.outlineView) {
      this.pdfOutlineViewer = PDFOutlineViewer.create({
        container: appConfig.sidebar.outlineView,
        eventBus,
        linkService: pdfLinkService,
        downloadManager,
      });
    }

    if (appConfig.sidebar?.attachmentsView) {
      this.pdfAttachmentViewer = PDFAttachmentViewer.create({
        container: appConfig.sidebar.attachmentsView,
        eventBus,
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
      const fileInput = appConfig.openFileInput!;
      fileInput.value = null as any;

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
        evt.preventDefault();

        evt.dataTransfer!.dropEffect =
          evt.dataTransfer!.effectAllowed === "copy" ? "copy" : "move";
      });
      appConfig.mainContainer.on("drop", function (this: HTMLDivElement, evt) {
        evt.preventDefault();

        const { files } = evt.dataTransfer!;
        if (!files || files.length === 0) {
          return;
        }
        eventBus.dispatch("fileinputchange", {
          source: this,
          fileInput: evt.dataTransfer,
        });
      });
    }

    if (!this.supportsDocumentFonts) {
      AppOptions.set("disableFontFace", true);
      this.l10n.get("web_fonts_disabled").then((msg) => {
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

    appConfig.mainContainer.on(
      "transitionend",
      function (this: HTMLDivElement, evt) {
        if (evt.target === /* mainContainer */ this) {
          eventBus.dispatch("resize", { source: this });
        }
      },
      true,
    );

    /*#static*/ if (PDFJSDev || GENERIC) {
      if (file) {
        this.open({ url: file });
      } else {
        this._hideViewBookmark();
      }
    } else {
      /*#static*/ if (MOZCENTRAL || CHROME) {
        this.initPassiveLoading(file);
      } else {
        throw new Error("Not implemented: run");
      }
    }
  }

  get initialized() {
    return this.#initializedCapability.settled;
  }

  get initializedPromise() {
    return this.#initializedCapability.promise;
  }

  zoomIn(steps?: number, scaleFactor?: number) {
    if (this.pdfViewer.isInPresentationMode) {
      return;
    }
    this.pdfViewer.increaseScale({
      drawingDelay: AppOptions.defaultZoomDelay,
      steps,
      scaleFactor,
    });
  }

  zoomOut(steps?: number, scaleFactor?: number) {
    if (this.pdfViewer.isInPresentationMode) {
      return;
    }
    this.pdfViewer.decreaseScale({
      drawingDelay: AppOptions.defaultZoomDelay,
      steps,
      scaleFactor,
    });
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
    return PDFPrintServiceFactory.instance.supportsPrinting;
  }

  get supportsFullscreen() {
    return shadow(this, "supportsFullscreen", document.fullscreenEnabled);
  }

  get supportsPinchToZoom() {
    return this.externalServices.supportsPinchToZoom;
  }

  get supportsIntegratedFind() {
    return this.externalServices.supportsIntegratedFind;
  }

  get supportsDocumentFonts() {
    return this.externalServices.supportsDocumentFonts;
  }

  get loadingBar() {
    const barElement = document.getElementById("loadingBar");
    const bar = barElement ? new ProgressBar(barElement) : null;
    return shadow(this, "loadingBar", bar);
  }

  get supportedMouseWheelZoomModifierKeys() {
    return this.externalServices.supportedMouseWheelZoomModifierKeys;
  }

  initPassiveLoading(file: string | undefined) {
    /*#static*/ if (PDFJSDev || !(MOZCENTRAL || CHROME)) {
      throw new Error("Not implemented: initPassiveLoading");
    }
    this.setTitleUsingUrl(file, /* downloadUrl = */ file);

    this.externalServices.initPassiveLoading({
      onOpenWithTransport: (range) => {
        this.open({ range });
      },
      onOpenWithData: (data, contentDispositionFilename) => {
        if (isPdfFile(contentDispositionFilename)) {
          this.#contentDispositionFilename = contentDispositionFilename;
        }
        this.open({ data });
      },
      onOpenWithURL: (url, length, originalUrl) => {
        this.open({ url, length, originalUrl });
      },
      onError: (err) => {
        this.l10n.get("loading_error").then((msg) => {
          this._documentError(msg, err);
        });
      },
      onProgress: (loaded: number, total: number) => {
        this.progress(loaded / total);
      },
    });
  }

  setTitleUsingUrl(url = "", downloadUrl?: string) {
    this.url = url;
    this.baseUrl = url.split("#")[0];
    if (downloadUrl) {
      this._downloadUrl = downloadUrl === url
        ? this.baseUrl
        : downloadUrl.split("#")[0];
    }
    if (isDataScheme(url)) {
      this._hideViewBookmark();
    }
    let title = getPdfFilenameFromUrl(url, "");
    if (!title) {
      try {
        title = decodeURIComponent(getFilenameFromUrl(url)) || url;
      } catch {
        // decodeURIComponent may throw URIError,
        // fall back to using the unprocessed url in that case
        title = url;
      }
    }
    this.setTitle(title);
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
    /*#static*/ if (PDFJSDev || GENERIC) {
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
    this.downloadComplete = false;
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
   * @headconst @param args_x - Accepts any/all of the properties from
   *   {@link DocumentInitParameters}, and also a `originalUrl` string.
   * @return Promise that is resolved when the document is opened.
   */
  async open(args_x: OpenP_ | string | ArrayBuffer) {
    const args = (() => {
      let ret: OpenP_;
      /*#static*/ if (PDFJSDev || GENERIC) {
        let deprecatedArgs = false;
        if (typeof args_x === "string") {
          ret = { url: args_x }; // URL
          deprecatedArgs = true;
        } else if ((args_x as any)?.byteLength) {
          ret = { data: args_x as ArrayBuffer }; // ArrayBuffer
          deprecatedArgs = true;
        }
        if (deprecatedArgs) {
          console.error(
            "The `PDFViewerApplication.open` signature was updated, please use an object instead.",
          );
        }
        ret = args_x as OpenP_;
      } else {
        ret = args_x as OpenP_;
      }
      return ret;
    })();

    if (this.pdfLoadingTask) {
      // We need to destroy already opened document.
      await this.close();
    }
    // Set the necessary global worker parameters, using the available options.
    const workerParams = AppOptions.getAll(OptionKind.WORKER);
    Object.assign(GlobalWorkerOptions, workerParams);

    /*#static*/ if (PDFJSDev || !MOZCENTRAL) {
      if (args.url) {
        // The Firefox built-in viewer always calls `setTitleUsingUrl`, before
        // `initPassiveLoading`, and it never provides an `originalUrl` here.
        this.setTitleUsingUrl(
          args.originalUrl || args.url,
          /* downloadUrl = */ args.url,
        );
      }
    }
    // Set the necessary API parameters, using all the available options.
    const apiParams = AppOptions.getAll(OptionKind.API);
    const params = {
      canvasMaxAreaInBytes: this.externalServices.canvasMaxAreaInBytes,
      ...apiParams,
      ...args,
    } as DocumentInitP;

    /*#static*/ if (PDFJSDev) {
      params.docBaseUrl ||= document.URL.split("#")[0];
    } else {
      /*#static*/ if (MOZCENTRAL || CHROME) {
        params.docBaseUrl ||= this.baseUrl;
      }
    }
    const loadingTask = getDocument(params);
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
          InvalidPDFException: "invalid_file_error",
          MissingPDFException: "missing_file_error",
          UnexpectedResponseException: "unexpected_response_error",
        }[reason?.name as string] ?? "loading_error";
        return this.l10n.get(key).then((msg) => {
          this._documentError(msg, { message: reason?.message });
          throw reason;
        });
      },
    );
  }

  #ensureDownloadComplete() {
    if (this.pdfDocument && this.downloadComplete) return;

    throw new Error("PDF document not downloaded.");
  }

  async download(options = {}) {
    const url = this._downloadUrl,
      filename = this._docFilename;
    try {
      this.#ensureDownloadComplete();

      const data = await this.pdfDocument!.getData();
      const blob = new Blob([data], { type: "application/pdf" });

      await this.downloadManager.download(blob, url, filename, options);
    } catch {
      // When the PDF document isn't ready, or the PDF file is still
      // downloading, simply download using the URL.
      await this.downloadManager.downloadUrl(url, filename, options);
    }
  }

  async save(options = {}) {
    if (this._saveInProgress) {
      return;
    }
    this._saveInProgress = true;
    await this.pdfScriptingManager.dispatchWillSave();

    const url = this._downloadUrl,
      filename = this._docFilename;
    try {
      this.#ensureDownloadComplete();

      const data = await this.pdfDocument!.saveDocument();
      const blob = new Blob([data], { type: "application/pdf" });

      await this.downloadManager.download(blob, url, filename, options);
    } catch (reason) {
      // When the PDF document isn't ready, or the PDF file is still
      // downloading, simply fallback to a "regular" download.
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
        data: { type: "save" },
      });
    }
  }

  downloadOrSave(options = {}) {
    if (this.pdfDocument?.annotationStorage.size! > 0) {
      this.save(options);
    } else {
      this.download(options);
    }
  }

  openInExternalApp() {
    this.downloadOrSave({ openInExternalApp: true });
  }

  /**
   * Report the error; used for errors affecting loading and/or parsing of
   * the entire PDF document.
   */
  _documentError(message: string, moreInfo?: ErrorMoreInfo) {
    this.#unblockDocumentLoadEvent();

    this._otherError(message, moreInfo);

    this.eventBus.dispatch("documenterror", {
      source: this,
      message,
      reason: moreInfo?.message ?? undefined,
    });
  }

  /**
   * Report the error; used for errors affecting e.g. only a single page.
   *
   * @param message A message that is human readable.
   * @param moreInfo Further information about the error that is
   *  more technical. Should have a 'message' and
   *  optionally a 'stack' property.
   */
  _otherError(message: string, moreInfo?: ErrorMoreInfo) {
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
  }

  progress(level: number) {
    if (!this.loadingBar || this.downloadComplete) {
      // Don't accidentally show the loading bar again when the entire file has
      // already been fetched (only an issue when disableAutoFetch is enabled).
      return;
    }
    const percent = Math.round(level * 100);
    // When we transition from full request to range requests, it's possible
    // that we discard some of the loaded data. This can cause the loading
    // bar to move backwards. So prevent this by only updating the bar if it
    // increases.
    if (percent <= this.loadingBar.percent) {
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
      this.downloadComplete = true;
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
      const baseUrl = location.href.split("#")[0];
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
      this.l10n.get("loading_error").then((msg) => {
        this._documentError(msg, { message: reason?.message });
      });
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
      window.removeEventListener("beforeunload", beforeUnload);

      /*#static*/ if (PDFJSDev || GENERIC) {
        delete this._annotationStorageModified;
      }
    };
    annotationStorage.onAnnotationEditor = (typeStr) => {
      this._hasAnnotationEditors = !!typeStr;
      this.setTitle();

      if (typeStr) {
        this.externalServices.reportTelemetry({
          type: "editing",
          data: { type: typeStr },
        });
      }
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

    this.pdfDocument.cleanup();
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
      .then(() => {
        return this.pdfDocument?.annotationStorage.print;
      });

    if (this.printService) {
      // There is no way to suppress beforePrint/afterPrint events,
      // but PDFPrintService may generate double events -- this will ignore
      // the second event that will be coming from native window.print().
      return;
    }

    if (!this.supportsPrinting) {
      this.l10n.get("printing_not_supported").then((msg) => {
        this._otherError(msg);
      });
      return;
    }

    // The beforePrint is a sync method and we need to know layout before
    // returning from this method. Ensure that we can get sizes of the pages.
    if (!this.pdfViewer!.pageViewsReady) {
      this.l10n.get("printing_not_ready").then((msg) => {
        // eslint-disable-next-line no-alert
        window.alert(msg);
      });
      return;
    }

    const pagesOverview = this.pdfViewer!.getPagesOverview();
    const printContainer = this.appConfig!.printContainer;
    const printResolution = AppOptions.printResolution;
    const optionalContentConfigPromise =
      this.pdfViewer.optionalContentConfigPromise;

    const printService = PDFPrintServiceFactory.instance.createPrintService(
      this.pdfDocument!,
      pagesOverview,
      printContainer,
      printResolution,
      optionalContentConfigPromise,
      this._printAnnotationStoragePromise,
      this.l10n,
    );
    this.printService = printService;
    this.forceRendering();
    // Disable the editor-indicator during printing (fixes bug 1790552).
    this.setTitle();

    printService.layout();

    if (this._hasAnnotationEditors) {
      this.externalServices.reportTelemetry({
        type: "editing",
        data: { type: "print" },
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
    const { eventBus, _boundEvents } = this;

    _boundEvents.beforePrint = this.beforePrint;
    _boundEvents.afterPrint = this.afterPrint;

    eventBus._on("resize", webViewerResize);
    eventBus._on("hashchange", webViewerHashchange);
    eventBus._on("beforeprint", _boundEvents.beforePrint);
    eventBus._on("afterprint", _boundEvents.afterPrint);
    eventBus._on("pagerender", webViewerPageRender);
    eventBus._on("pagerendered", webViewerPageRendered);
    eventBus._on("updateviewarea", webViewerUpdateViewarea);
    eventBus._on("pagechanging", webViewerPageChanging);
    eventBus._on("scalechanging", webViewerScaleChanging);
    eventBus._on("rotationchanging", webViewerRotationChanging);
    eventBus._on("sidebarviewchanged", webViewerSidebarViewChanged);
    eventBus._on("pagemode", webViewerPageMode);
    eventBus._on("namedaction", webViewerNamedAction);
    eventBus._on("presentationmodechanged", webViewerPresentationModeChanged);
    eventBus._on("presentationmode", webViewerPresentationMode);
    eventBus._on(
      "switchannotationeditormode",
      webViewerSwitchAnnotationEditorMode,
    );
    eventBus._on(
      "switchannotationeditorparams",
      webViewerSwitchAnnotationEditorParams,
    );
    eventBus._on("print", webViewerPrint);
    eventBus._on("download", webViewerDownload);
    eventBus._on("openinexternalapp", webViewerOpenInExternalApp);
    eventBus._on("firstpage", webViewerFirstPage);
    eventBus._on("lastpage", webViewerLastPage);
    eventBus._on("nextpage", webViewerNextPage);
    eventBus._on("previouspage", webViewerPreviousPage);
    eventBus._on("zoomin", webViewerZoomIn);
    eventBus._on("zoomout", webViewerZoomOut);
    eventBus._on("zoomreset", webViewerZoomReset);
    eventBus._on("pagenumberchanged", webViewerPageNumberChanged);
    eventBus._on("scalechanged", webViewerScaleChanged);
    eventBus._on("rotatecw", webViewerRotateCw);
    eventBus._on("rotateccw", webViewerRotateCcw);
    eventBus._on("optionalcontentconfig", webViewerOptionalContentConfig);
    eventBus._on("switchscrollmode", webViewerSwitchScrollMode);
    eventBus._on("scrollmodechanged", webViewerScrollModeChanged);
    eventBus._on("switchspreadmode", webViewerSwitchSpreadMode);
    eventBus._on("spreadmodechanged", webViewerSpreadModeChanged);
    eventBus._on("documentproperties", webViewerDocumentProperties);
    eventBus._on("findfromurlhash", webViewerFindFromUrlHash);
    eventBus._on("updatefindmatchescount", webViewerUpdateFindMatchesCount);
    eventBus._on("updatefindcontrolstate", webViewerUpdateFindControlState);

    if (AppOptions.pdfBug) {
      _boundEvents.reportPageStatsPDFBug = reportPageStatsPDFBug;

      eventBus._on("pagerendered", _boundEvents.reportPageStatsPDFBug);
      eventBus._on("pagechanging", _boundEvents.reportPageStatsPDFBug);
    }
    /*#static*/ if (PDFJSDev || GENERIC) {
      eventBus._on("fileinputchange", webViewerFileInputChange!);
      eventBus._on("openfile", webViewerOpenFile!);
    }
    /*#static*/ if (MOZCENTRAL) {
      // The `unbindEvents` method is unused in MOZCENTRAL builds,
      // hence we don't need to unregister these event listeners.
      eventBus._on(
        "annotationeditorstateschanged",
        webViewerAnnotationEditorStatesChanged,
      );
      eventBus._on("reporttelemetry", webViewerReportTelemetry);
    }
  }

  bindWindowEvents() {
    const { eventBus, _boundEvents } = this;

    function addWindowResolutionChange(
      evt: MediaQueryListEvent | undefined = undefined,
    ) {
      if (evt) {
        webViewerResolutionChange(evt);
      }
      const mediaQueryList = window.matchMedia(
        `(resolution: ${window.devicePixelRatio || 1}dppx)`,
      );
      mediaQueryList.addEventListener("change", addWindowResolutionChange, {
        once: true,
      });

      /*#static*/ if (MOZCENTRAL) {
        return;
      }
      _boundEvents.removeWindowResolutionChange ||= function () {
        mediaQueryList.removeEventListener("change", addWindowResolutionChange);
        _boundEvents.removeWindowResolutionChange = undefined;
      };
    }
    addWindowResolutionChange();

    _boundEvents.windowResize = () => {
      eventBus.dispatch("resize", { source: window });
    };
    _boundEvents.windowHashChange = () => {
      eventBus.dispatch("hashchange", {
        source: window,
        hash: document.location.hash.substring(1),
      });
    };
    _boundEvents.windowBeforePrint = () => {
      eventBus.dispatch("beforeprint", { source: window });
    };
    _boundEvents.windowAfterPrint = () => {
      eventBus.dispatch("afterprint", { source: window });
    };
    _boundEvents.windowUpdateFromSandbox = (event: CustomEvent) => {
      eventBus.dispatch("updatefromsandbox", {
        source: window,
        detail: event.detail,
      });
    };

    window.on("visibilitychange", webViewerVisibilityChange);
    window.on("wheel", webViewerWheel, { passive: false });
    window.on("touchstart", webViewerTouchStart, { passive: false });
    window.on("touchmove", webViewerTouchMove, { passive: false });
    window.on("touchend", webViewerTouchEnd, { passive: false });
    window.on("click", webViewerClick);
    window.on("keydown", webViewerKeyDown);
    window.on("keyup", webViewerKeyUp);
    window.on("resize", _boundEvents.windowResize);
    window.on("hashchange", _boundEvents.windowHashChange);
    window.on("beforeprint", _boundEvents.windowBeforePrint);
    window.on("afterprint", _boundEvents.windowAfterPrint);
    window.addEventListener(
      "updatefromsandbox",
      _boundEvents.windowUpdateFromSandbox,
    );
  }

  unbindEvents() {
    /*#static*/ if (MOZCENTRAL) {
      throw new Error("Not implemented: unbindEvents");
    }
    const { eventBus, _boundEvents } = this;

    eventBus._off("resize", webViewerResize);
    eventBus._off("hashchange", webViewerHashchange);
    eventBus._off("beforeprint", _boundEvents.beforePrint!);
    eventBus._off("afterprint", _boundEvents.afterPrint!);
    eventBus._off("pagerender", webViewerPageRender);
    eventBus._off("pagerendered", webViewerPageRendered);
    eventBus._off("updateviewarea", webViewerUpdateViewarea);
    eventBus._off("pagechanging", webViewerPageChanging);
    eventBus._off("scalechanging", webViewerScaleChanging);
    eventBus._off("rotationchanging", webViewerRotationChanging);
    eventBus._off("sidebarviewchanged", webViewerSidebarViewChanged);
    eventBus._off("pagemode", webViewerPageMode);
    eventBus._off("namedaction", webViewerNamedAction);
    eventBus._off("presentationmodechanged", webViewerPresentationModeChanged);
    eventBus._off("presentationmode", webViewerPresentationMode);
    eventBus._off("print", webViewerPrint);
    eventBus._off("download", webViewerDownload);
    eventBus._off("openinexternalapp", webViewerOpenInExternalApp);
    eventBus._off("firstpage", webViewerFirstPage);
    eventBus._off("lastpage", webViewerLastPage);
    eventBus._off("nextpage", webViewerNextPage);
    eventBus._off("previouspage", webViewerPreviousPage);
    eventBus._off("zoomin", webViewerZoomIn);
    eventBus._off("zoomout", webViewerZoomOut);
    eventBus._off("zoomreset", webViewerZoomReset);
    eventBus._off("pagenumberchanged", webViewerPageNumberChanged);
    eventBus._off("scalechanged", webViewerScaleChanged);
    eventBus._off("rotatecw", webViewerRotateCw);
    eventBus._off("rotateccw", webViewerRotateCcw);
    eventBus._off("optionalcontentconfig", webViewerOptionalContentConfig);
    eventBus._off("switchscrollmode", webViewerSwitchScrollMode);
    eventBus._off("scrollmodechanged", webViewerScrollModeChanged);
    eventBus._off("switchspreadmode", webViewerSwitchSpreadMode);
    eventBus._off("spreadmodechanged", webViewerSpreadModeChanged);
    eventBus._off("documentproperties", webViewerDocumentProperties);
    eventBus._off("findfromurlhash", webViewerFindFromUrlHash);
    eventBus._off("updatefindmatchescount", webViewerUpdateFindMatchesCount);
    eventBus._off("updatefindcontrolstate", webViewerUpdateFindControlState);

    if (_boundEvents.reportPageStatsPDFBug) {
      eventBus._off("pagerendered", _boundEvents.reportPageStatsPDFBug);
      eventBus._off("pagechanging", _boundEvents.reportPageStatsPDFBug);

      _boundEvents.reportPageStatsPDFBug = undefined;
    }
    /*#static*/ if (PDFJSDev || GENERIC) {
      eventBus._off("fileinputchange", webViewerFileInputChange!);
      eventBus._off("openfile", webViewerOpenFile!);
    }

    _boundEvents.beforePrint = undefined;
    _boundEvents.afterPrint = undefined;
  }

  unbindWindowEvents() {
    /*#static*/ if (MOZCENTRAL) {
      throw new Error("Not implemented: unbindWindowEvents");
    }
    const { _boundEvents } = this;

    window.removeEventListener("visibilitychange", webViewerVisibilityChange);
    window.removeEventListener("wheel", webViewerWheel);
    window.removeEventListener("touchstart", webViewerTouchStart);
    window.removeEventListener("touchmove", webViewerTouchMove);
    window.removeEventListener("touchend", webViewerTouchEnd);
    window.removeEventListener("click", webViewerClick);
    window.removeEventListener("keydown", webViewerKeyDown);
    window.removeEventListener("keyup", webViewerKeyUp);
    window.removeEventListener("resize", _boundEvents.windowResize!);
    window.removeEventListener("hashchange", _boundEvents.windowHashChange!);
    window.removeEventListener("beforeprint", _boundEvents.windowBeforePrint!);
    window.removeEventListener("afterprint", _boundEvents.windowAfterPrint!);
    window.removeEventListener(
      "updatefromsandbox",
      _boundEvents.windowUpdateFromSandbox!,
    );

    _boundEvents.removeWindowResolutionChange?.();
    _boundEvents.windowResize = undefined;
    _boundEvents.windowHashChange = undefined;
    _boundEvents.windowBeforePrint = undefined;
    _boundEvents.windowAfterPrint = undefined;
    _boundEvents.windowUpdateFromSandbox = undefined;
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

  _centerAtPos(previousScale: number, x: number, y: number) {
    const { pdfViewer } = this;
    const scaleDiff = pdfViewer.currentScale / previousScale - 1;
    if (scaleDiff !== 0) {
      const [top, left] = pdfViewer.containerTopLeft;
      pdfViewer.container.scrollLeft += (x - left) * scaleDiff;
      pdfViewer.container.scrollTop += (y - top) * scaleDiff;
    }
  }

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
    } catch (ex) {
      viewerApp.l10n.get("loading_error").then((msg) => {
        viewerApp._documentError(msg, { message: (<Error> ex)?.message });
      });
      throw ex;
    }
  };
}

export interface PDFJSWorker {
  WorkerMessageHandler: typeof WorkerMessageHandler;
}

declare global {
  interface Window {
    pdfjsWorker?: PDFJSWorker;
  }
}

async function loadFakeWorker() {
  GlobalWorkerOptions.workerSrc ||= AppOptions.workerSrc;

  /*#static*/ if (PDFJSDev) {
    window.pdfjsWorker = await import("../pdf.ts-src/pdf.worker.ts");
  } else {
    await loadScript(PDFWorker.workerSrc);
  }
}

async function loadPDFBug(self: PDFViewerApplication) {
  const { debuggerScriptPath } = self.appConfig;
  const { PDFBug } = /*#static*/ PDFJSDev
    ? await import(debuggerScriptPath) // eslint-disable-line no-unsanitized/method
    // : await __non_webpack_import__(debuggerScriptPath); // eslint-disable-line no-undef
    : await import(debuggerScriptPath) // eslint-disable-line no-unsanitized/method
  ;

  self._PDFBug = PDFBug;
}

function reportPageStatsPDFBug({ pageNumber }: { pageNumber: number }) {
  if (!(globalThis as any).Stats?.enabled) {
    return;
  }
  const pageView = viewerApp.pdfViewer.getPageView(
    /* index = */ pageNumber - 1,
  );
  (globalThis as any).Stats.add(pageNumber, pageView?.pdfPage?.stats);
}

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
    viewerApp.l10n.get("rendering_error").then((msg) => {
      viewerApp._otherError(msg, error);
    });
  }
}

function webViewerPageMode({ mode }: EventMap["pagemode"]) {
  // Handle the 'pagemode' hash parameter, see also `PDFLinkService_setHash`.
  let view;
  switch (mode) {
    case "thumbs":
      view = SidebarView.THUMBS;
      break;
    case "bookmarks":
    case "outline": // non-standard
      view = SidebarView.OUTLINE;
      break;
    case "attachments": // non-standard
      view = SidebarView.ATTACHMENTS;
      break;
    case "layers": // non-standard
      view = SidebarView.LAYERS;
      break;
    case "none":
      view = SidebarView.NONE;
      break;
    default:
      console.error('Invalid "pagemode" hash parameter: ' + mode);
      return;
  }
  viewerApp.pdfSidebar?.switchView(view, /* forceOpen = */ true);
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

let webViewerFileInputChange:
  | ((evt: EventMap["fileinputchange"]) => void)
  | undefined;
let webViewerOpenFile: ((evt: EventMap["openfile"]) => void) | undefined;
/*#static*/ if (PDFJSDev || GENERIC) {
  // eslint-disable-next-line no-var
  webViewerFileInputChange = (evt: EventMap["fileinputchange"]) => {
    if (viewerApp.pdfViewer?.isInPresentationMode) {
      // Opening a new PDF file isn't supported in Presentation Mode.
      return;
    }
    const file = (evt.fileInput as DataTransfer).files[0];

    viewerApp.open({
      url: URL.createObjectURL(file),
      originalUrl: file.name,
    });
  };

  // eslint-disable-next-line no-var
  webViewerOpenFile = (evt: EventMap["openfile"]) => {
    const fileInput = viewerApp.appConfig.openFileInput!;
    fileInput.click();
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
function webViewerOpenInExternalApp() {
  viewerApp.openInExternalApp();
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
    viewerApp.findBar!.updateResultsCount(matchesCount);
  }
}

function webViewerUpdateFindControlState({
  state,
  previous,
  matchesCount,
  rawQuery,
}: EventMap["updatefindcontrolstate"]) {
  if (viewerApp.supportsIntegratedFind) {
    viewerApp.externalServices.updateFindControlState({
      result: state,
      findPrevious: previous,
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

function webViewerVisibilityChange(evt: unknown) {
  if (document.visibilityState === "visible") {
    // Ignore mouse wheel zooming during tab switches (bug 1503412).
    setZoomDisabledTimeout();
  }
}

let zoomDisabledTimeout: number | undefined;
function setZoomDisabledTimeout() {
  if (zoomDisabledTimeout) {
    clearTimeout(zoomDisabledTimeout);
  }
  zoomDisabledTimeout = setTimeout(() => {
    zoomDisabledTimeout = undefined;
  }, WHEEL_ZOOM_DISABLED_TIMEOUT);
}

function webViewerWheel(evt: WheelEvent) {
  const {
    pdfViewer,
    supportedMouseWheelZoomModifierKeys,
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

  if (
    isPinchToZoom ||
    (evt.ctrlKey && supportedMouseWheelZoomModifierKeys.ctrlKey) ||
    (evt.metaKey && supportedMouseWheelZoomModifierKeys.metaKey)
  ) {
    // Only zoom the pages, not the entire viewer.
    evt.preventDefault();
    // NOTE: this check must be placed *after* preventDefault.
    if (
      zoomDisabledTimeout ||
      document.visibilityState === "hidden" ||
      viewerApp.overlayManager.active
    ) {
      return;
    }

    const previousScale = pdfViewer.currentScale;
    if (isPinchToZoom && supportsPinchToZoom) {
      scaleFactor = viewerApp._accumulateFactor(
        previousScale,
        scaleFactor,
        "_wheelUnusedFactor",
      );
      if (scaleFactor < 1) {
        viewerApp.zoomOut(undefined, scaleFactor);
      } else if (scaleFactor > 1) {
        viewerApp.zoomIn(undefined, scaleFactor);
      } else {
        return;
      }
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

      if (ticks < 0) {
        viewerApp.zoomOut(-ticks);
      } else if (ticks > 0) {
        viewerApp.zoomIn(ticks);
      } else {
        return;
      }
    }

    // After scaling the page via zoomIn/zoomOut, the position of the upper-
    // left corner is restored. When the mouse wheel is used, the position
    // under the cursor should be restored instead.
    viewerApp._centerAtPos(previousScale, evt.clientX, evt.clientY);
  } else {
    setZoomDisabledTimeout();
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

  const distance = Math.hypot(page0X - page1X, page0Y - page1Y) || 1;
  const pDistance = Math.hypot(pTouch0X - pTouch1X, pTouch0Y - pTouch1Y) || 1;
  const previousScale = pdfViewer.currentScale;
  if (supportsPinchToZoom) {
    const newScaleFactor = viewerApp._accumulateFactor(
      previousScale,
      distance / pDistance,
      "_touchUnusedFactor",
    );
    if (newScaleFactor < 1) {
      viewerApp.zoomOut(undefined, newScaleFactor);
    } else if (newScaleFactor > 1) {
      viewerApp.zoomIn(undefined, newScaleFactor);
    } else {
      return;
    }
  } else {
    const PIXELS_PER_LINE_SCALE = 30;
    const ticks = viewerApp._accumulateTicks(
      (distance - pDistance) / PIXELS_PER_LINE_SCALE,
      "_touchUnusedTicks",
    );
    if (ticks < 0) {
      viewerApp.zoomOut(-ticks);
    } else if (ticks > 0) {
      viewerApp.zoomIn(ticks);
    } else {
      return;
    }
  }

  viewerApp._centerAtPos(
    previousScale,
    (page0X + page1X) / 2,
    (page0Y + page1Y) / 2,
  );
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
    (<HTMLElement> curElement)?.isContentEditable
  ) {
    // Make sure that the secondary toolbar is closed when Escape is pressed.
    if (evt.keyCode !== /* Esc = */ 27) return;
  }

  // No control key pressed at all.
  if (cmd === 0) {
    let turnPage = 0,
      turnOnlyIfPageFit = false;
    switch (evt.keyCode) {
      case 38: // up arrow
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

/* Abstract factory for the print service. */
export const PDFPrintServiceFactory = {
  instance: {
    supportsPrinting: false,
    createPrintService(
      pdfDocument: PDFDocumentProxy,
      pagesOverview: PageOverview[],
      printContainer: HTMLDivElement,
      printResolution: number | undefined,
      optionalContentConfigPromise:
        | Promise<OptionalContentConfig | undefined>
        | undefined,
      printAnnotationStoragePromise?: Promise<
        PrintAnnotationStorage | undefined
      >,
      l10n?: IL10n,
    ): PDFPrintService {
      throw new Error("Not implemented: createPrintService");
    },
  },
};
/*80--------------------------------------------------------------------------*/
