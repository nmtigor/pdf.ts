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
import "../../lib/jslang.js";
import { Locale } from "../../lib/Locale.js";
import { createPromiseCap } from "../../lib/promisecap.js";
import { assert } from "../../lib/util/trace.js";
import { getPdfFilenameFromUrl, isPdfFile } from "../pdf.ts-src/display/display_utils.js";
import { build, getDocument, getFilenameFromUrl, GlobalWorkerOptions, InvalidPDFException, loadScript, MissingPDFException, PDFWorker, shadow, UnexpectedResponseException, UNSUPPORTED_FEATURES, version } from "../pdf.ts-src/pdf.js";
import { OPS } from "../pdf.ts-src/shared/util.js";
import { AppOptions, OptionKind, ViewOnLoad } from "./app_options.js";
import { AutomationEventBus, EventBus } from "./event_utils.js";
import { OverlayManager } from "./overlay_manager.js";
import { PasswordPrompt } from "./password_prompt.js";
import { PDFAttachmentViewer } from "./pdf_attachment_viewer.js";
import { CursorTool, PDFCursorTools } from "./pdf_cursor_tools.js";
import { PDFDocumentProperties } from "./pdf_document_properties.js";
import { PDFFindBar } from "./pdf_find_bar.js";
import { PDFFindController } from "./pdf_find_controller.js";
import { PDFHistory } from "./pdf_history.js";
import { PDFLayerViewer } from "./pdf_layer_viewer.js";
import { LinkTarget, PDFLinkService } from "./pdf_link_service.js";
import { PDFOutlineViewer } from "./pdf_outline_viewer.js";
import { PDFPresentationMode } from "./pdf_presentation_mode.js";
import { PDFRenderingQueue } from "./pdf_rendering_queue.js";
import { PDFScriptingManager } from "./pdf_scripting_manager.js";
import { PDFSidebar } from "./pdf_sidebar.js";
import { PDFSidebarResizer } from "./pdf_sidebar_resizer.js";
import { PDFThumbnailViewer } from "./pdf_thumbnail_viewer.js";
import { PDFViewer } from "./pdf_viewer.js";
import { SecondaryToolbar } from "./secondary_toolbar.js";
import { Toolbar } from "./toolbar.js";
import { animationStarted, apiPageLayoutToViewerModes, apiPageModeToSidebarView, AutoPrintRegExp, DEFAULT_SCALE_VALUE, getActiveOrFocusedElement, isValidRotation, isValidScrollMode, isValidSpreadMode, noContextMenuHandler, normalizeWheelEventDirection, parseQueryString, ProgressBar, RendererType, RenderingStates, ScrollMode, SidebarView, SpreadMode, TextLayerMode } from "./ui_utils.js";
import { ViewHistory } from "./view_history.js";
/*81---------------------------------------------------------------------------*/
const DISABLE_AUTO_FETCH_LOADING_BAR_TIMEOUT = 5000; // ms
const FORCE_PAGES_LOADED_TIMEOUT = 10000; // ms
const WHEEL_ZOOM_DISABLED_TIMEOUT = 1000; // ms
const ViewerCssTheme = {
    AUTOMATIC: 0,
    LIGHT: 1,
    DARK: 2,
};
// Keep these in sync with mozilla-central's Histograms.json.
const KNOWN_VERSIONS = [
    "1.0",
    "1.1",
    "1.2",
    "1.3",
    "1.4",
    "1.5",
    "1.6",
    "1.7",
    "1.8",
    "1.9",
    "2.0",
    "2.1",
    "2.2",
    "2.3",
];
// Keep these in sync with mozilla-central's Histograms.json.
const KNOWN_GENERATORS = [
    "acrobat distiller",
    "acrobat pdfwriter",
    "adobe livecycle",
    "adobe pdf library",
    "adobe photoshop",
    "ghostscript",
    "tcpdf",
    "cairo",
    "dvipdfm",
    "dvips",
    "pdftex",
    "pdfkit",
    "itext",
    "prince",
    "quarkxpress",
    "mac os x",
    "microsoft",
    "openoffice",
    "oracle",
    "luradocument",
    "pdf-xchange",
    "antenna house",
    "aspose.cells",
    "fpdf",
];
export class DefaultExternalServices {
    updateFindControlState(data) { }
    updateFindMatchesCount(data) { }
    initPassiveLoading(callbacks) { }
    reportTelemetry(data) { }
    createDownloadManager() {
        throw new Error("Not implemented: createDownloadManager");
    }
    createPreferences() {
        throw new Error("Not implemented: createPreferences");
    }
    createL10n({ locale = Locale.en_US } = {}) {
        throw new Error("Not implemented: createL10n");
    }
    createScripting(options) {
        throw new Error("Not implemented: createScripting");
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
}
export class PDFViewerApplication {
    initialBookmark = document.location.hash.substring(1);
    initialRotation;
    #initializedCapability = createPromiseCap();
    appConfig;
    pdfDocument;
    pdfLoadingTask;
    printService;
    store;
    eventBus;
    overlayManager;
    pdfRenderingQueue;
    pdfLinkService;
    downloadManager;
    findController;
    pdfScriptingManager;
    pdfViewer;
    pdfThumbnailViewer;
    pdfHistory;
    findBar;
    pdfDocumentProperties;
    pdfCursorTools;
    toolbar;
    secondaryToolbar;
    pdfPresentationMode;
    passwordPrompt;
    pdfOutlineViewer;
    pdfAttachmentViewer;
    pdfLayerViewer;
    pdfSidebar;
    pdfSidebarResizer;
    preferences;
    l10n;
    isInitialViewSet = false;
    downloadComplete = false;
    isViewerEmbedded = window.parent !== window;
    url = "";
    baseUrl = "";
    _downloadUrl = "";
    externalServices = new DefaultExternalServices();
    _boundEvents = Object.create(null);
    documentInfo;
    metadata;
    #contentDispositionFilename;
    _contentLength;
    _saveInProgress = false;
    _docStats;
    _wheelUnusedTicks = 0;
    _idleCallbacks = new Set();
    _PDFBug;
    disableAutoFetchLoadingBarTimeout;
    _annotationStorageModified;
    #initialized = false;
    constructor() {
        assert(!this.#initialized);
        this.#initialized = true;
    }
    /**
     * Called once when the document is loaded.
     */
    async initialize(appConfig) {
        this.preferences = this.externalServices.createPreferences();
        this.appConfig = appConfig;
        await this.#readPreferences();
        await this.#parseHashParameters();
        this.#forceCssTheme();
        await this.#initializeL10n();
        if (this.isViewerEmbedded
            && AppOptions.get("externalLinkTarget") === LinkTarget.NONE) {
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
    async #readPreferences() {
        if (AppOptions.get("disablePreferences")) {
            // Give custom implementations of the default viewer a simpler way to
            // opt-out of having the `Preferences` override existing `AppOptions`.
            return;
        }
        if (AppOptions._hasUserOptions()) {
            console.warn("_readPreferences: The Preferences may override manually set AppOptions; " +
                'please use the "disablePreferences"-option in order to prevent that.');
        }
        try {
            AppOptions.setAll(await this.preferences.getAll());
        }
        catch (reason) {
            console.error(`_readPreferences: "${reason?.message}".`);
        }
    }
    /**
     * Potentially parse special debugging flags in the hash section of the URL.
     */
    async #parseHashParameters() {
        if (!AppOptions.get("pdfBugEnabled"))
            return;
        const hash = document.location.hash.substring(1);
        if (!hash)
            return;
        const { mainContainer, viewerContainer } = this.appConfig, params = parseQueryString(hash);
        if (params.get("disableworker") === "true") {
            try {
                await loadFakeWorker();
            }
            catch (ex) {
                console.error(`_parseHashParameters: "${ex.message}".`);
            }
        }
        if (params.has("disablerange")) {
            AppOptions.set("disableRange", params.get("disablerange") === "true");
        }
        if (params.has("disablestream")) {
            AppOptions.set("disableStream", params.get("disablestream") === "true");
        }
        if (params.has("disableautofetch")) {
            AppOptions.set("disableAutoFetch", params.get("disableautofetch") === "true");
        }
        if (params.has("disablefontface")) {
            AppOptions.set("disableFontFace", params.get("disablefontface") === "true");
        }
        if (params.has("disablehistory")) {
            AppOptions.set("disableHistory", params.get("disablehistory") === "true");
        }
        if (params.has("verbosity")) {
            AppOptions.set("verbosity", +params.get("verbosity") | 0);
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
                        this._PDFBug.loadCSS();
                    }
                    catch (ex) {
                        console.error(`_parseHashParameters: "${ex.message}".`);
                    }
                    break;
            }
        }
        if (params.has("pdfbug")) {
            AppOptions.set("pdfBug", true);
            AppOptions.set("fontExtraProperties", true);
            const enabled = params.get("pdfbug").split(",");
            try {
                await loadPDFBug(this);
                this._PDFBug.init({ OPS }, mainContainer, enabled);
            }
            catch (ex) {
                console.error(`_parseHashParameters: "${ex.message}".`);
            }
        }
        // It is not possible to change locale for the (various) extension builds.
        if (params.has("locale")) {
            AppOptions.set("locale", params.get("locale"));
        }
    }
    async #initializeL10n() {
        this.l10n = this.externalServices.createL10n({ locale: AppOptions.get("locale") });
        const dir = await this.l10n.getDirection();
        document.getElementsByTagName("html")[0].dir = dir;
    }
    #forceCssTheme() {
        const cssTheme = AppOptions.get("viewerCssTheme");
        if (cssTheme === ViewerCssTheme.AUTOMATIC
            || !Object.values(ViewerCssTheme).includes(cssTheme)) {
            return;
        }
        try {
            const styleSheet = document.styleSheets[0];
            const cssRules = styleSheet?.cssRules || [];
            for (let i = 0, ii = cssRules.length; i < ii; i++) {
                const rule = cssRules[i];
                if (rule instanceof CSSMediaRule
                    && rule.media?.[0] === "(prefers-color-scheme: dark)") {
                    if (cssTheme === ViewerCssTheme.LIGHT) {
                        styleSheet.deleteRule(i);
                        return;
                    }
                    // cssTheme === ViewerCssTheme.DARK
                    const darkRules = /^@media \(prefers-color-scheme: dark\) {\n\s*([\w\s-.,:;/\\{}()]+)\n}$/.exec(rule.cssText);
                    if (darkRules?.[1]) {
                        styleSheet.deleteRule(i);
                        styleSheet.insertRule(darkRules[1], i);
                    }
                    return;
                }
            }
        }
        catch (reason) {
            console.error(`#forceCssTheme: "${reason?.message}".`);
        }
    }
    async #initializeViewerComponents() {
        const { appConfig, externalServices } = this;
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
            externalLinkTarget: AppOptions.get("externalLinkTarget"),
            externalLinkRel: AppOptions.get("externalLinkRel"),
            ignoreDestinationZoom: AppOptions.get("ignoreDestinationZoom"),
        });
        this.pdfLinkService = pdfLinkService;
        const downloadManager = externalServices.createDownloadManager();
        this.downloadManager = downloadManager;
        const findController = new PDFFindController({
            linkService: pdfLinkService,
            eventBus,
        });
        this.findController = findController;
        const pdfScriptingManager = new PDFScriptingManager({
            eventBus,
            sandboxBundleSrc: AppOptions.get("sandboxBundleSrc"),
            scriptingFactory: externalServices,
            docPropertiesLookup: this.#scriptingDocProperties,
        });
        this.pdfScriptingManager = pdfScriptingManager;
        const container = appConfig.mainContainer;
        const viewer = appConfig.viewerContainer;
        this.pdfViewer = new PDFViewer({
            container,
            viewer,
            eventBus,
            renderingQueue: pdfRenderingQueue,
            linkService: pdfLinkService,
            downloadManager,
            findController,
            scriptingManager: AppOptions.get("enableScripting") && pdfScriptingManager,
            renderer: AppOptions.get("renderer"),
            l10n: this.l10n,
            textLayerMode: AppOptions.get("textLayerMode"),
            annotationMode: AppOptions.get("annotationMode"),
            imageResourcesPath: AppOptions.get("imageResourcesPath"),
            enablePrintAutoRotate: AppOptions.get("enablePrintAutoRotate"),
            useOnlyCssZoom: AppOptions.get("useOnlyCssZoom"),
            maxCanvasPixels: AppOptions.get("maxCanvasPixels"),
            enablePermissions: AppOptions.get("enablePermissions"),
            pageColors: {
                background: AppOptions.get("pageColorsBackground"),
                foreground: AppOptions.get("pageColorsForeground"),
            },
        });
        pdfRenderingQueue.setViewer(this.pdfViewer);
        pdfLinkService.setViewer(this.pdfViewer);
        pdfScriptingManager.setViewer(this.pdfViewer);
        this.pdfThumbnailViewer = new PDFThumbnailViewer({
            container: appConfig.sidebar.thumbnailView,
            eventBus,
            renderingQueue: pdfRenderingQueue,
            linkService: pdfLinkService,
            l10n: this.l10n,
        });
        pdfRenderingQueue.setThumbnailViewer(this.pdfThumbnailViewer);
        // The browsing history is only enabled when the viewer is standalone,
        // i.e. not when it is embedded in a web page.
        if (!this.isViewerEmbedded && !AppOptions.get("disableHistory")) {
            this.pdfHistory = new PDFHistory({
                linkService: pdfLinkService,
                eventBus,
            });
            pdfLinkService.setHistory(this.pdfHistory);
        }
        if (!this.supportsIntegratedFind) {
            this.findBar = new PDFFindBar(appConfig.findBar, eventBus, this.l10n);
        }
        this.pdfDocumentProperties = new PDFDocumentProperties(appConfig.documentProperties, this.overlayManager, eventBus, this.l10n);
        this.pdfCursorTools = new PDFCursorTools({
            container,
            eventBus,
            cursorToolOnLoad: AppOptions.get("cursorToolOnLoad"),
        });
        this.toolbar = new Toolbar(appConfig.toolbar, eventBus, this.l10n);
        this.secondaryToolbar = new SecondaryToolbar(appConfig.secondaryToolbar, eventBus);
        if (this.supportsFullscreen) {
            this.pdfPresentationMode = new PDFPresentationMode({
                container,
                pdfViewer: this.pdfViewer,
                eventBus,
            });
        }
        this.passwordPrompt = new PasswordPrompt(appConfig.passwordOverlay, this.overlayManager, this.l10n, this.isViewerEmbedded);
        this.pdfOutlineViewer = PDFOutlineViewer.create({
            container: appConfig.sidebar.outlineView,
            eventBus,
            linkService: pdfLinkService,
        });
        this.pdfAttachmentViewer = PDFAttachmentViewer.create({
            container: appConfig.sidebar.attachmentsView,
            eventBus,
            downloadManager,
        });
        this.pdfLayerViewer = PDFLayerViewer.create({
            container: appConfig.sidebar.layersView,
            eventBus,
            l10n: this.l10n,
        });
        this.pdfSidebar = new PDFSidebar({
            elements: appConfig.sidebar,
            pdfViewer: this.pdfViewer,
            pdfThumbnailViewer: this.pdfThumbnailViewer,
            eventBus,
            l10n: this.l10n,
        });
        this.pdfSidebar.onToggled = this.forceRendering;
        this.pdfSidebarResizer = new PDFSidebarResizer(appConfig.sidebarResizer, eventBus, this.l10n);
    }
    run(config) {
        this.initialize(config).then(webViewerInitialized);
    }
    get initialized() {
        return this.#initializedCapability.settled;
    }
    get initializedPromise() {
        return this.#initializedCapability.promise;
    }
    zoomIn(steps) {
        if (this.pdfViewer.isInPresentationMode)
            return;
        this.pdfViewer.increaseScale(steps);
    }
    zoomOut(steps) {
        if (this.pdfViewer.isInPresentationMode)
            return;
        this.pdfViewer.decreaseScale(steps);
    }
    zoomReset() {
        if (this.pdfViewer.isInPresentationMode)
            return;
        this.pdfViewer.currentScaleValue = DEFAULT_SCALE_VALUE;
    }
    get pagesCount() {
        return this.pdfDocument ? this.pdfDocument.numPages : 0;
    }
    get page() {
        return this.pdfViewer.currentPageNumber;
    }
    set page(val) {
        this.pdfViewer.currentPageNumber = val;
    }
    get supportsPrinting() {
        return PDFPrintServiceFactory.instance.supportsPrinting;
    }
    get supportsFullscreen() {
        return shadow(this, "supportsFullscreen", document.fullscreenEnabled);
    }
    get supportsIntegratedFind() {
        return this.externalServices.supportsIntegratedFind;
    }
    get supportsDocumentFonts() {
        return this.externalServices.supportsDocumentFonts;
    }
    get loadingBar() {
        const bar = new ProgressBar("#loadingBar");
        return shadow(this, "loadingBar", bar);
    }
    get supportedMouseWheelZoomModifierKeys() {
        return this.externalServices.supportedMouseWheelZoomModifierKeys;
    }
    initPassiveLoading() {
        throw new Error("Not implemented: initPassiveLoading");
        this.externalServices.initPassiveLoading({
            onOpenWithTransport: (url, length, transport) => {
                this.open(url, { length, range: transport });
            },
            onOpenWithData: (data, contentDispositionFilename) => {
                if (isPdfFile(contentDispositionFilename)) {
                    this.#contentDispositionFilename = contentDispositionFilename;
                }
                this.open(data);
            },
            onOpenWithURL: (url, length, originalUrl) => {
                const file = originalUrl !== undefined ? { url, originalUrl } : url;
                const args = length !== undefined ? { length } : undefined;
                this.open(file, args);
            },
            onError: err => {
                this.l10n.get("loading_error").then(msg => {
                    this._documentError(msg, err);
                });
            },
            onProgress: (loaded, total) => {
                this.progress(loaded / total);
            },
        });
    }
    setTitleUsingUrl(url = "", downloadUrl) {
        this.url = url;
        this.baseUrl = url.split("#")[0];
        if (downloadUrl) {
            this._downloadUrl =
                downloadUrl === url ? this.baseUrl : downloadUrl.split("#")[0];
        }
        let title = getPdfFilenameFromUrl(url, "");
        if (!title) {
            try {
                title = decodeURIComponent(getFilenameFromUrl(url)) || url;
            }
            catch (ex) {
                // decodeURIComponent may throw URIError,
                // fall back to using the unprocessed url in that case
                title = url;
            }
        }
        this.setTitle(title);
    }
    setTitle(title) {
        if (this.isViewerEmbedded) {
            // Embedded PDF viewers should not be changing their parent page's title.
            return;
        }
        document.title = title;
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
        // URL does not reflect proper document location - hiding some buttons.
        const { toolbar, secondaryToolbar } = this.appConfig;
        toolbar.viewBookmark.hidden = true;
        secondaryToolbar.viewBookmarkButton.hidden = true;
    }
    #cancelIdleCallbacks() {
        if (!this._idleCallbacks.size)
            return;
        for (const callback of this._idleCallbacks) {
            window.cancelIdleCallback(callback);
        }
        this._idleCallbacks.clear();
    }
    /**
     * Closes opened PDF document.
     * @return Returns the promise, which is resolved when all
     *  destruction is completed.
     */
    async close() {
        this.#unblockDocumentLoadEvent();
        this._hideViewBookmark();
        const { container } = this.appConfig.errorWrapper;
        container.hidden = true;
        if (!this.pdfLoadingTask)
            return;
        if (this.pdfDocument?.annotationStorage.size > 0
            && this._annotationStorageModified) {
            try {
                // Trigger saving, to prevent data loss in forms; see issue 12257.
                await this.save({ sourceEventType: "save" });
            }
            catch (reason) {
                // Ignoring errors, to ensure that document closing won't break.
            }
        }
        const promises = [];
        promises.push(this.pdfLoadingTask.destroy());
        this.pdfLoadingTask = undefined;
        if (this.pdfDocument) {
            this.pdfDocument = undefined;
            this.pdfThumbnailViewer.setDocument();
            this.pdfViewer.setDocument();
            this.pdfLinkService.setDocument();
            this.pdfDocumentProperties.setDocument();
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
        this._docStats = undefined;
        this.#cancelIdleCallbacks();
        promises.push(this.pdfScriptingManager.destroyPromise);
        this.pdfSidebar.reset();
        this.pdfOutlineViewer.reset();
        this.pdfAttachmentViewer.reset();
        this.pdfLayerViewer.reset();
        this.pdfHistory?.reset();
        this.findBar?.reset();
        this.toolbar.reset();
        this.secondaryToolbar.reset();
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
    async open(file, args) {
        if (this.pdfLoadingTask) {
            // We need to destroy already opened document.
            await this.close();
        }
        // Set the necessary global worker parameters, using the available options.
        const workerParameters = AppOptions.getAll(OptionKind.WORKER);
        for (const key in workerParameters) {
            GlobalWorkerOptions[key] = workerParameters[key];
        }
        const parameters = Object.create(null);
        if (typeof file === "string") {
            // URL
            this.setTitleUsingUrl(file, /* downloadUrl = */ file);
            parameters.url = file;
        }
        else if (file && "byteLength" in file) {
            // ArrayBuffer
            parameters.data = file;
        }
        else if (file.url && file.originalUrl) {
            this.setTitleUsingUrl(file.originalUrl, /* downloadUrl = */ file.url);
            parameters.url = file.url;
        }
        // Set the necessary API parameters, using the available options.
        const apiParameters = AppOptions.getAll(OptionKind.API);
        for (const key in apiParameters) {
            let value = apiParameters[key];
            if (key === "docBaseUrl" && !value) {
                value = document.URL.split("#")[0];
            }
            parameters[key] = value;
        }
        // Finally, update the API parameters with the arguments (if they exist).
        if (args) {
            for (const key in args) {
                parameters[key] = args[key];
            }
        }
        const loadingTask = getDocument(parameters);
        this.pdfLoadingTask = loadingTask;
        loadingTask.onPassword = (updateCallback, reason) => {
            this.pdfLinkService.externalLinkEnabled = false;
            this.passwordPrompt.setUpdateCallback(updateCallback, reason);
            this.passwordPrompt.open();
        };
        loadingTask.onProgress = ({ loaded, total }) => {
            this.progress(loaded / total);
        };
        // Listen for unsupported features to report telemetry.
        loadingTask.onUnsupportedFeature = this.fallback;
        return loadingTask.promise.then(pdfDocument => {
            this.load(pdfDocument);
        }, reason => {
            // Ignore errors for previously opened PDF files.
            if (loadingTask !== this.pdfLoadingTask)
                return undefined;
            let key = "loading_error";
            if (reason instanceof InvalidPDFException) {
                key = "invalid_file_error";
            }
            else if (reason instanceof MissingPDFException) {
                key = "missing_file_error";
            }
            else if (reason instanceof UnexpectedResponseException) {
                key = "unexpected_response_error";
            }
            return this.l10n.get(key).then(msg => {
                this._documentError(msg, { message: reason?.message });
                throw reason;
            });
        });
    }
    #ensureDownloadComplete() {
        if (this.pdfDocument && this.downloadComplete)
            return;
        throw new Error("PDF document not downloaded.");
    }
    async download({ sourceEventType = "download" } = {}) {
        const url = this._downloadUrl, filename = this._docFilename;
        try {
            this.#ensureDownloadComplete();
            const data = await this.pdfDocument.getData();
            const blob = new Blob([data], { type: "application/pdf" });
            await this.downloadManager.download(blob, url, filename, sourceEventType);
        }
        catch (reason) {
            // When the PDF document isn't ready, or the PDF file is still
            // downloading, simply download using the URL.
            await this.downloadManager.downloadUrl(url, filename);
        }
    }
    async save({ sourceEventType = "download" } = {}) {
        if (this._saveInProgress)
            return;
        this._saveInProgress = true;
        await this.pdfScriptingManager.dispatchWillSave();
        const url = this._downloadUrl, filename = this._docFilename;
        try {
            this.#ensureDownloadComplete();
            const data = await this.pdfDocument.saveDocument();
            const blob = new Blob([data], { type: "application/pdf" });
            await this.downloadManager.download(blob, url, filename, sourceEventType);
        }
        catch (reason) {
            // When the PDF document isn't ready, or the PDF file is still
            // downloading, simply fallback to a "regular" download.
            console.error(`Error when saving the document: ${reason.message}`);
            await this.download({ sourceEventType });
        }
        finally {
            await this.pdfScriptingManager.dispatchDidSave();
            this._saveInProgress = false;
        }
    }
    downloadOrSave(options) {
        if (this.pdfDocument?.annotationStorage.size > 0) {
            this.save(options);
        }
        else {
            this.download(options);
        }
    }
    fallback = (featureId) => {
        this.externalServices.reportTelemetry({
            type: "unsupportedFeature",
            featureId,
        });
    };
    /**
     * Show the error box; used for errors affecting loading and/or parsing of
     * the entire PDF document.
     */
    _documentError(message, moreInfo) {
        this.#unblockDocumentLoadEvent();
        this._otherError(message, moreInfo);
        this.eventBus.dispatch("documenterror", {
            source: this,
            message,
            reason: moreInfo?.message ?? undefined,
        });
    }
    /**
     * Show the error box; used for errors affecting e.g. only a single page.
     *
     * @param message A message that is human readable.
     * @param moreInfo Further information about the error that is
     *  more technical.  Should have a 'message' and
     *  optionally a 'stack' property.
     */
    _otherError(message, moreInfo) {
        const moreInfoText = [
            this.l10n.get("error_version_info", {
                version: version || "?",
                build: build || "?",
            }),
        ];
        if (moreInfo) {
            moreInfoText.push(this.l10n.get("error_message", { message: moreInfo.message }));
            if (moreInfo.stack) {
                moreInfoText.push(this.l10n.get("error_stack", { stack: moreInfo.stack }));
            }
            else {
                if (moreInfo.filename) {
                    moreInfoText.push(this.l10n.get("error_file", { file: moreInfo.filename }));
                }
                if (moreInfo.lineNumber) {
                    moreInfoText.push(this.l10n.get("error_line", { line: moreInfo.lineNumber }));
                }
            }
        }
        const errorWrapperConfig = this.appConfig.errorWrapper;
        const errorWrapper = errorWrapperConfig.container;
        errorWrapper.hidden = false;
        const errorMessage = errorWrapperConfig.errorMessage;
        errorMessage.textContent = message;
        const closeButton = errorWrapperConfig.closeButton;
        closeButton.onclick = function () {
            errorWrapper.hidden = true;
        };
        const errorMoreInfo = errorWrapperConfig.errorMoreInfo;
        const moreInfoButton = errorWrapperConfig.moreInfoButton;
        const lessInfoButton = errorWrapperConfig.lessInfoButton;
        moreInfoButton.onclick = function () {
            errorMoreInfo.hidden = false;
            moreInfoButton.hidden = true;
            lessInfoButton.hidden = false;
            errorMoreInfo.style.height = errorMoreInfo.scrollHeight + "px";
        };
        lessInfoButton.onclick = function () {
            errorMoreInfo.hidden = true;
            moreInfoButton.hidden = false;
            lessInfoButton.hidden = true;
        };
        moreInfoButton.oncontextmenu = noContextMenuHandler;
        lessInfoButton.oncontextmenu = noContextMenuHandler;
        closeButton.oncontextmenu = noContextMenuHandler;
        moreInfoButton.hidden = false;
        lessInfoButton.hidden = true;
        Promise.all(moreInfoText).then(parts => {
            errorMoreInfo.value = parts.join("\n");
        });
    }
    progress(level) {
        if (this.downloadComplete) {
            // Don't accidentally show the loading bar again when the entire file has
            // already been fetched (only an issue when disableAutoFetch is enabled).
            return;
        }
        const percent = Math.round(level * 100);
        // When we transition from full request to range requests, it's possible
        // that we discard some of the loaded data. This can cause the loading
        // bar to move backwards. So prevent this by only updating the bar if it
        // increases.
        if (percent > this.loadingBar.percent || isNaN(percent)) {
            this.loadingBar.percent = percent;
            // When disableAutoFetch is enabled, it's not uncommon for the entire file
            // to never be fetched (depends on e.g. the file structure). In this case
            // the loading bar will not be completely filled, nor will it be hidden.
            // To prevent displaying a partially filled loading bar permanently, we
            // hide it when no data has been loaded during a certain amount of time.
            const disableAutoFetch = this.pdfDocument
                ? this.pdfDocument.loadingParams.disableAutoFetch
                : AppOptions.get("disableAutoFetch");
            if (disableAutoFetch && percent) {
                if (this.disableAutoFetchLoadingBarTimeout) {
                    clearTimeout(this.disableAutoFetchLoadingBarTimeout);
                    this.disableAutoFetchLoadingBarTimeout = undefined;
                }
                this.loadingBar.show();
                this.disableAutoFetchLoadingBarTimeout = setTimeout(() => {
                    this.loadingBar.hide();
                    this.disableAutoFetchLoadingBarTimeout = undefined;
                }, DISABLE_AUTO_FETCH_LOADING_BAR_TIMEOUT);
            }
        }
    }
    load(pdfDocument) {
        this.pdfDocument = pdfDocument;
        pdfDocument.getDownloadInfo().then(({ length }) => {
            this._contentLength = length; // Ensure that the correct length is used.
            this.downloadComplete = true;
            this.loadingBar.hide();
            firstPagePromise.then(() => {
                this.eventBus.dispatch("documentloaded", { source: this });
            });
        });
        // Since the `setInitialView` call below depends on this being resolved,
        // fetch it early to avoid delaying initial rendering of the PDF document.
        const pageLayoutPromise = pdfDocument.getPageLayout().catch(() => 
        /* Avoid breaking initial rendering; ignoring errors. */
        undefined);
        const pageModePromise = pdfDocument.getPageMode().catch(() => {
            /* Avoid breaking initial rendering; ignoring errors. */
        });
        const openActionPromise = pdfDocument.getOpenAction().catch(() => 
        /* Avoid breaking initial rendering; ignoring errors. */
        undefined);
        this.toolbar.setPagesCount(pdfDocument.numPages, false);
        this.secondaryToolbar.setPagesCount(pdfDocument.numPages);
        let baseDocumentUrl;
        baseDocumentUrl = undefined;
        this.pdfLinkService.setDocument(pdfDocument, baseDocumentUrl);
        this.pdfDocumentProperties.setDocument(pdfDocument, this.url);
        const pdfViewer = this.pdfViewer;
        pdfViewer.setDocument(pdfDocument);
        const { firstPagePromise, onePageRendered, pagesPromise } = pdfViewer;
        const pdfThumbnailViewer = this.pdfThumbnailViewer;
        pdfThumbnailViewer.setDocument(pdfDocument);
        const storedPromise = (this.store = new ViewHistory(pdfDocument.fingerprints[0]))
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
            return Object.create(null);
        });
        firstPagePromise.then(pdfPage => {
            this.loadingBar.setWidth(this.appConfig.viewerContainer);
            this.#initializeAnnotationStorageCallbacks(pdfDocument);
            Promise.all([
                animationStarted,
                storedPromise,
                pageLayoutPromise,
                pageModePromise,
                openActionPromise,
            ])
                .then(async ([timeStamp, stored, pageLayout, pageMode, openAction]) => {
                const viewOnLoad = AppOptions.get("viewOnLoad");
                this.#initializePdfHistory({
                    fingerprint: pdfDocument.fingerprints[0],
                    viewOnLoad,
                    initialDest: openAction?.dest,
                });
                const initialBookmark = this.initialBookmark;
                // Initialize the default values, from user preferences.
                const zoom = AppOptions.get("defaultZoomValue");
                let hash = zoom ? `zoom=${zoom}` : undefined;
                let rotation;
                let sidebarView = AppOptions.get("sidebarViewOnLoad");
                let scrollMode = AppOptions.get("scrollModeOnLoad");
                let spreadMode = AppOptions.get("spreadModeOnLoad");
                if (stored.page && viewOnLoad !== ViewOnLoad.INITIAL) {
                    hash =
                        `page=${stored.page}&zoom=${zoom || stored.zoom},` +
                            `${stored.scrollLeft},${stored.scrollTop}`;
                    rotation = parseInt(stored.rotation, 10);
                    // Always let user preference take precedence over the view history.
                    if (sidebarView === SidebarView.UNKNOWN) {
                        sidebarView = stored.sidebarView | 0;
                    }
                    if (scrollMode === ScrollMode.UNKNOWN) {
                        scrollMode = stored.scrollMode | 0;
                    }
                    if (spreadMode === SpreadMode.UNKNOWN) {
                        spreadMode = stored.spreadMode | 0;
                    }
                }
                // Always let the user preference/view history take precedence.
                if (pageMode && sidebarView === SidebarView.UNKNOWN) {
                    sidebarView = apiPageModeToSidebarView(pageMode);
                }
                if (pageLayout
                    && scrollMode === ScrollMode.UNKNOWN
                    && spreadMode === SpreadMode.UNKNOWN) {
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
                    new Promise(resolve => {
                        setTimeout(resolve, FORCE_PAGES_LOADED_TIMEOUT);
                    }),
                ]);
                if (!initialBookmark && !hash)
                    return;
                if (pdfViewer.hasEqualPageSizes)
                    return;
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
        pagesPromise.then(() => {
            this.#unblockDocumentLoadEvent();
            this.#initializeAutoPrint(pdfDocument, openActionPromise);
        }, reason => {
            this.l10n.get("loading_error").then(msg => {
                this._documentError(msg, { message: reason?.message });
            });
        });
        onePageRendered.then(data => {
            this.externalServices.reportTelemetry({
                type: "pageInfo",
                timestamp: data.timestamp,
            });
            pdfDocument.getOutline().then(outline => {
                // The document was closed while the outline resolved.
                if (pdfDocument !== this.pdfDocument)
                    return;
                this.pdfOutlineViewer.render({ outline, pdfDocument });
            });
            pdfDocument.getAttachments().then(attachments => {
                // The document was closed while the attachments resolved.
                if (pdfDocument !== this.pdfDocument)
                    return;
                this.pdfAttachmentViewer.render({ attachments });
            });
            // Ensure that the layers accurately reflects the current state in the
            // viewer itself, rather than the default state provided by the API.
            pdfViewer.optionalContentConfigPromise.then(optionalContentConfig => {
                // The document was closed while the layers resolved.
                if (pdfDocument !== this.pdfDocument)
                    return;
                this.pdfLayerViewer.render({ optionalContentConfig, pdfDocument });
            });
            const fn_ = () => {
                const callback = window.requestIdleCallback(() => {
                    this.#collectTelemetry(pdfDocument);
                    this._idleCallbacks.delete(callback);
                }, { timeout: 1000 });
                this._idleCallbacks.add(callback);
            };
            if ("requestIdleCallback" in window)
                fn_();
        });
        this.#initializePageLabels(pdfDocument);
        this.#initializeMetadata(pdfDocument);
    }
    #scriptingDocProperties = async (pdfDocument) => {
        if (!this.documentInfo) {
            // It should be *extremely* rare for metadata to not have been resolved
            // when this code runs, but ensure that we handle that case here.
            await new Promise(resolve => {
                this.eventBus._on("metadataloaded", resolve, { once: true });
            });
            if (pdfDocument !== this.pdfDocument) {
                return null; // The document was closed while the metadata resolved.
            }
        }
        if (!this._contentLength) {
            // Always waiting for the entire PDF document to be loaded will, most
            // likely, delay sandbox-creation too much in the general case for all
            // PDF documents which are not provided as binary data to the API.
            // Hence we'll simply have to trust that the `contentLength` (as provided
            // by the server), when it exists, is accurate enough here.
            await new Promise(resolve => {
                this.eventBus._on("documentloaded", resolve, { once: true });
            });
            if (pdfDocument !== this.pdfDocument) {
                return null; // The document was closed while the downloadInfo resolved.
            }
        }
        return {
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
    /**
     * A place to fetch data for telemetry after one page is rendered and the
     * viewer is idle.
     */
    async #collectTelemetry(pdfDocument) {
        const markInfo = await this.pdfDocument.getMarkInfo();
        if (pdfDocument !== this.pdfDocument) {
            return; // Document was closed while waiting for mark info.
        }
        const tagged = markInfo?.Marked || false;
        this.externalServices.reportTelemetry({
            type: "tagged",
            tagged,
        });
    }
    async #initializeAutoPrint(pdfDocument, openActionPromise) {
        const [openAction, javaScript] = await Promise.all([
            openActionPromise,
            !this.pdfViewer.enableScripting ? pdfDocument.getJavaScript() : undefined,
        ]);
        if (pdfDocument !== this.pdfDocument) {
            return; // The document was closed while the auto print data resolved.
        }
        let triggerAutoPrint = false;
        if (openAction?.action === "Print") {
            triggerAutoPrint = true;
        }
        if (javaScript) {
            javaScript.some(js => {
                if (!js) {
                    // Don't warn/fallback for empty JavaScript actions.
                    return false;
                }
                console.warn("Warning: JavaScript support is not enabled");
                this.fallback(UNSUPPORTED_FEATURES.javaScript);
                return true;
            });
            if (!triggerAutoPrint) {
                // Hack to support auto printing.
                for (const js of javaScript) {
                    if (js && AutoPrintRegExp.test(js)) {
                        triggerAutoPrint = true;
                        break;
                    }
                }
            }
        }
        if (triggerAutoPrint) {
            this.triggerPrinting();
        }
    }
    async #initializeMetadata(pdfDocument) {
        const { info, metadata, contentDispositionFilename, contentLength } = await pdfDocument.getMetadata();
        if (pdfDocument !== this.pdfDocument) {
            return; // The document was closed while the metadata resolved.
        }
        this.documentInfo = info;
        this.metadata = metadata;
        this.#contentDispositionFilename ??= contentDispositionFilename;
        this._contentLength ??= contentLength; // See `getDownloadInfo`-call above.
        // Provides some basic debug information
        console.log(`PDF ${pdfDocument.fingerprints[0]} [${info.PDFFormatVersion} ` +
            `${(info.Producer || "-").trim()} / ${(info.Creator || "-").trim()}] ` +
            `(PDF.js: ${version || "-"})`);
        let pdfTitle = info?.Title;
        const metadataTitle = metadata?.get("dc:title");
        if (metadataTitle) {
            // Ghostscript can produce invalid 'dc:title' Metadata entries:
            //  - The title may be "Untitled" (fixes bug 1031612).
            //  - The title may contain incorrectly encoded characters, which thus
            //    looks broken, hence we ignore the Metadata entry when it
            //    contains characters from the Specials Unicode block
            //    (fixes bug 1605526).
            if (metadataTitle !== "Untitled"
                && !/[\uFFF0-\uFFFF]/g.test(metadataTitle)) {
                pdfTitle = metadataTitle;
            }
        }
        if (pdfTitle) {
            this.setTitle(`${pdfTitle} - ${contentDispositionFilename || document.title}`);
        }
        else if (contentDispositionFilename) {
            this.setTitle(contentDispositionFilename);
        }
        if (info.IsXFAPresent
            && !info.IsAcroFormPresent
            && !pdfDocument.isPureXfa) {
            if (pdfDocument.loadingParams.enableXfa) {
                console.warn("Warning: XFA Foreground documents are not supported");
            }
            else {
                console.warn("Warning: XFA support is not enabled");
            }
            this.fallback(UNSUPPORTED_FEATURES.forms);
        }
        else if ((info.IsAcroFormPresent || info.IsXFAPresent)
            && !this.pdfViewer.renderForms) {
            console.warn("Warning: Interactive form support is not enabled");
            this.fallback(UNSUPPORTED_FEATURES.forms);
        }
        if (info.IsSignaturesPresent) {
            console.warn("Warning: Digital signatures validation is not supported");
            this.fallback(UNSUPPORTED_FEATURES.signatures);
        }
        // Telemetry labels must be C++ variable friendly.
        let versionId = "other";
        if (KNOWN_VERSIONS.includes(info.PDFFormatVersion)) {
            versionId = `v${info.PDFFormatVersion.replace(".", "_")}`;
        }
        let generatorId = "other";
        if (info.Producer) {
            const producer = info.Producer.toLowerCase();
            KNOWN_GENERATORS.some(generator => {
                if (!producer.includes(generator))
                    return false;
                generatorId = generator.replace(/[ .-]/g, "_");
                return true;
            });
        }
        let formType;
        if (info.IsXFAPresent) {
            formType = "xfa";
        }
        else if (info.IsAcroFormPresent) {
            formType = "acroform";
        }
        this.externalServices.reportTelemetry({
            type: "documentInfo",
            version: versionId,
            generator: generatorId,
            formType: formType,
        });
        this.eventBus.dispatch("metadataloaded", { source: this });
    }
    async #initializePageLabels(pdfDocument) {
        const labels = await pdfDocument.getPageLabels();
        // The document was closed while the page labels resolved.
        if (pdfDocument !== this.pdfDocument)
            return;
        if (!labels || AppOptions.get("disablePageLabels"))
            return;
        const numLabels = labels.length;
        // Ignore page labels that correspond to standard page numbering,
        // or page labels that are all empty.
        let standardLabels = 0, emptyLabels = 0;
        for (let i = 0; i < numLabels; i++) {
            const label = labels[i];
            if (label === (i + 1).toString())
                standardLabels++;
            else if (label === "")
                emptyLabels++;
            else
                break;
        }
        if (standardLabels >= numLabels || emptyLabels >= numLabels)
            return;
        const { pdfViewer, pdfThumbnailViewer, toolbar } = this;
        pdfViewer.setPageLabels(labels);
        pdfThumbnailViewer.setPageLabels(labels);
        // Changing toolbar page display to use labels and we need to set
        // the label of the current page.
        toolbar.setPagesCount(numLabels, true);
        toolbar.setPageNumber(pdfViewer.currentPageNumber, pdfViewer.currentPageLabel);
    }
    #initializePdfHistory({ fingerprint, viewOnLoad, initialDest }) {
        if (!this.pdfHistory)
            return;
        this.pdfHistory.initialize({
            fingerprint,
            resetHistory: viewOnLoad === ViewOnLoad.INITIAL,
            updateUrl: AppOptions.get("historyUpdateUrl"),
        });
        if (this.pdfHistory.initialBookmark) {
            this.initialBookmark = this.pdfHistory.initialBookmark;
            this.initialRotation = this.pdfHistory.initialRotation;
        }
        // Always let the browser history/document hash take precedence.
        if (initialDest
            && !this.initialBookmark
            && viewOnLoad === ViewOnLoad.UNKNOWN) {
            this.initialBookmark = JSON.stringify(initialDest);
            // TODO: Re-factor the `PDFHistory` initialization to remove this hack
            // that's currently necessary to prevent weird initial history state.
            this.pdfHistory.push({ namedDest: undefined, explicitDest: initialDest });
        }
    }
    #initializeAnnotationStorageCallbacks(pdfDocument) {
        if (pdfDocument !== this.pdfDocument)
            return;
        const { annotationStorage } = pdfDocument;
        annotationStorage.onSetModified = () => {
            window.addEventListener("beforeunload", beforeUnload);
            this._annotationStorageModified = true;
        };
        annotationStorage.onResetModified = () => {
            window.removeEventListener("beforeunload", beforeUnload);
            delete this._annotationStorageModified;
        };
    }
    setInitialView(storedHash, { rotation, sidebarView, scrollMode, spreadMode } = {}) {
        const setRotation = (angle) => {
            if (isValidRotation(angle)) {
                this.pdfViewer.pagesRotation = angle;
            }
        };
        const setViewerModes = (scroll, spread) => {
            if (isValidScrollMode(scroll)) {
                this.pdfViewer.scrollMode = scroll;
            }
            if (isValidSpreadMode(spread)) {
                this.pdfViewer.spreadMode = spread;
            }
        };
        this.isInitialViewSet = true;
        this.pdfSidebar.setInitialView(sidebarView);
        setViewerModes(scrollMode, spreadMode);
        if (this.initialBookmark) {
            setRotation(this.initialRotation);
            delete this.initialRotation;
            this.pdfLinkService.setHash(this.initialBookmark);
            this.initialBookmark = undefined;
        }
        else if (storedHash) {
            setRotation(rotation);
            this.pdfLinkService.setHash(storedHash);
        }
        // Ensure that the correct page number is displayed in the UI,
        // even if the active page didn't change during document load.
        this.toolbar.setPageNumber(this.pdfViewer.currentPageNumber, this.pdfViewer.currentPageLabel);
        this.secondaryToolbar.setPageNumber(this.pdfViewer.currentPageNumber);
        if (!this.pdfViewer.currentScaleValue) {
            // Scale was not initialized: invalid bookmark or scale was not specified.
            // Setting the default one.
            this.pdfViewer.currentScaleValue = DEFAULT_SCALE_VALUE;
        }
    }
    _cleanup = () => {
        // run cleanup when document is loaded
        if (!this.pdfDocument)
            return;
        this.pdfViewer.cleanup();
        this.pdfThumbnailViewer.cleanup();
        // We don't want to remove fonts used by active page SVGs.
        this.pdfDocument.cleanup(
        /* keepLoadedFonts = */ this.pdfViewer.renderer === RendererType.SVG);
    };
    forceRendering = () => {
        this.pdfRenderingQueue.printing = !!this.printService;
        this.pdfRenderingQueue.isThumbnailViewEnabled =
            this.pdfSidebar.isThumbnailViewVisible;
        this.pdfRenderingQueue.renderHighestPriority();
    };
    beforePrint = () => {
        // Given that the "beforeprint" browser event is synchronous, we
        // unfortunately cannot await the scripting event dispatching here.
        this.pdfScriptingManager.dispatchWillPrint();
        if (this.printService) {
            // There is no way to suppress beforePrint/afterPrint events,
            // but PDFPrintService may generate double events -- this will ignore
            // the second event that will be coming from native window.print().
            return;
        }
        if (!this.supportsPrinting) {
            this.l10n.get("printing_not_supported").then(msg => {
                this._otherError(msg);
            });
            return;
        }
        // The beforePrint is a sync method and we need to know layout before
        // returning from this method. Ensure that we can get sizes of the pages.
        if (!this.pdfViewer.pageViewsReady) {
            this.l10n.get("printing_not_ready").then(msg => {
                // eslint-disable-next-line no-alert
                window.alert(msg);
            });
            return;
        }
        const pagesOverview = this.pdfViewer.getPagesOverview();
        const printContainer = this.appConfig.printContainer;
        const printResolution = AppOptions.get("printResolution");
        const optionalContentConfigPromise = this.pdfViewer.optionalContentConfigPromise;
        const printService = PDFPrintServiceFactory.instance.createPrintService(this.pdfDocument, pagesOverview, printContainer, printResolution, optionalContentConfigPromise, this.l10n);
        this.printService = printService;
        this.forceRendering();
        printService.layout();
        this.externalServices.reportTelemetry({
            type: "print",
        });
    };
    afterPrint = () => {
        // Given that the "afterprint" browser event is synchronous, we
        // unfortunately cannot await the scripting event dispatching here.
        this.pdfScriptingManager.dispatchDidPrint();
        if (this.printService) {
            this.printService.destroy();
            this.printService = undefined;
            this.pdfDocument?.annotationStorage.resetModified();
        }
        this.forceRendering();
    };
    rotatePages(delta) {
        this.pdfViewer.pagesRotation += delta;
        // Note that the thumbnail viewer is updated, and rendering is triggered,
        // in the 'rotationchanging' event handler.
    }
    requestPresentationMode() {
        this.pdfPresentationMode?.request();
    }
    triggerPrinting() {
        if (!this.supportsPrinting)
            return;
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
        eventBus._on("print", webViewerPrint);
        eventBus._on("download", webViewerDownload);
        eventBus._on("save", webViewerSave);
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
        // if( AppOptions.get("pdfBug") )
        // {
        //   _boundEvents.reportPageStatsPDFBug = reportPageStatsPDFBug;
        //   eventBus._on("pagerendered", _boundEvents.reportPageStatsPDFBug);
        //   eventBus._on("pagechanging", _boundEvents.reportPageStatsPDFBug);
        // }
        eventBus._on("fileinputchange", webViewerFileInputChange);
        eventBus._on("openfile", webViewerOpenFile);
    }
    bindWindowEvents() {
        const { eventBus, _boundEvents } = this;
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
        _boundEvents.windowUpdateFromSandbox = (event) => {
            eventBus.dispatch("updatefromsandbox", {
                source: window,
                detail: event.detail,
            });
        };
        window.addEventListener("visibilitychange", webViewerVisibilityChange);
        window.addEventListener("wheel", webViewerWheel, { passive: false });
        window.addEventListener("touchstart", webViewerTouchStart, { passive: false });
        window.addEventListener("click", webViewerClick);
        window.addEventListener("keydown", webViewerKeyDown);
        window.addEventListener("resize", _boundEvents.windowResize);
        window.addEventListener("hashchange", _boundEvents.windowHashChange);
        window.addEventListener("beforeprint", _boundEvents.windowBeforePrint);
        window.addEventListener("afterprint", _boundEvents.windowAfterPrint);
        window.addEventListener("updatefromsandbox", _boundEvents.windowUpdateFromSandbox);
    }
    unbindEvents() {
        const { eventBus, _boundEvents } = this;
        eventBus._off("resize", webViewerResize);
        eventBus._off("hashchange", webViewerHashchange);
        eventBus._off("beforeprint", _boundEvents.beforePrint);
        eventBus._off("afterprint", _boundEvents.afterPrint);
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
        eventBus._off("save", webViewerSave);
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
        // if (_boundEvents.reportPageStatsPDFBug) {
        //   eventBus._off("pagerendered", _boundEvents.reportPageStatsPDFBug);
        //   eventBus._off("pagechanging", _boundEvents.reportPageStatsPDFBug);
        //   _boundEvents.reportPageStatsPDFBug = undefined;
        // }
        eventBus._off("fileinputchange", webViewerFileInputChange);
        eventBus._off("openfile", webViewerOpenFile);
        _boundEvents.beforePrint = undefined;
        _boundEvents.afterPrint = undefined;
    }
    unbindWindowEvents() {
        const { _boundEvents } = this;
        window.removeEventListener("visibilitychange", webViewerVisibilityChange);
        window.removeEventListener("wheel", webViewerWheel);
        window.removeEventListener("touchstart", webViewerTouchStart);
        window.removeEventListener("click", webViewerClick);
        window.removeEventListener("keydown", webViewerKeyDown);
        window.removeEventListener("resize", _boundEvents.windowResize);
        window.removeEventListener("hashchange", _boundEvents.windowHashChange);
        window.removeEventListener("beforeprint", _boundEvents.windowBeforePrint);
        window.removeEventListener("afterprint", _boundEvents.windowAfterPrint);
        window.removeEventListener("updatefromsandbox", _boundEvents.windowUpdateFromSandbox);
        _boundEvents.windowResize = undefined;
        _boundEvents.windowHashChange = undefined;
        _boundEvents.windowBeforePrint = undefined;
        _boundEvents.windowAfterPrint = undefined;
        _boundEvents.windowUpdateFromSandbox = undefined;
    }
    accumulateWheelTicks(ticks) {
        // If the scroll direction changed, reset the accumulated wheel ticks.
        if ((this._wheelUnusedTicks > 0 && ticks < 0) ||
            (this._wheelUnusedTicks < 0 && ticks > 0)) {
            this._wheelUnusedTicks = 0;
        }
        this._wheelUnusedTicks += ticks;
        const wholeTicks = Math.sign(this._wheelUnusedTicks) *
            Math.floor(Math.abs(this._wheelUnusedTicks));
        this._wheelUnusedTicks -= wholeTicks;
        return wholeTicks;
    }
    /**
     * Should be called *after* all pages have loaded, or if an error occurred,
     * to unblock the "load" event; see https://bugzilla.mozilla.org/show_bug.cgi?id=1618553
     */
    #unblockDocumentLoadEvent = () => {
        document.blockUnblockOnload?.(false);
        // Ensure that this method is only ever run once.
        this.#unblockDocumentLoadEvent = () => { };
    };
    /**
     * @ignore
     */
    _reportDocumentStatsTelemetry() {
        const { stats } = this.pdfDocument;
        if (stats !== this._docStats) {
            this._docStats = stats;
            this.externalServices.reportTelemetry({
                type: "documentStats",
                stats,
            });
        }
    }
    /**
     * Used together with the integration-tests, to enable awaiting full
     * initialization of the scripting/sandbox.
     */
    get scriptingReady() {
        return this.pdfScriptingManager.ready;
    }
}
export const viewerapp = new PDFViewerApplication();
let validateFileURL;
const HOSTED_VIEWER_ORIGINS = [
    "null",
    "http://mozilla.github.io",
    "https://mozilla.github.io",
];
validateFileURL = function (file) {
    if (!file)
        return;
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
            throw new Error("file origin does not match viewer's");
        }
    }
    catch (ex) {
        viewerapp.l10n.get("loading_error").then(msg => {
            viewerapp._documentError(msg, { message: ex?.message });
        });
        throw ex;
    }
};
async function loadFakeWorker() {
    GlobalWorkerOptions.workerSrc ||= AppOptions.get("workerSrc");
    window.pdfjsWorker = await import("../pdf.ts-src/core/worker.js");
    return;
    await loadScript(PDFWorker.workerSrc);
}
async function loadPDFBug(self) {
    const { debuggerScriptPath } = self.appConfig;
    const { PDFBug } = await import(debuggerScriptPath) // eslint-disable-line no-unsanitized/method
    ;
    self._PDFBug = PDFBug;
}
function reportPageStatsPDFBug({ pageNumber }) {
    if (!globalThis.Stats?.enabled)
        return;
    const pageView = viewerapp.pdfViewer.getPageView(
    /* index = */ pageNumber - 1);
    globalThis.Stats.add(pageNumber, pageView?.pdfPage?.stats);
}
function webViewerInitialized() {
    const { appConfig, eventBus } = viewerapp;
    const queryString = document.location.search.substring(1);
    const params = parseQueryString(queryString);
    let file = params.get("file") ?? AppOptions.get("defaultUrl");
    validateFileURL(file);
    const fileInput = appConfig.openFileInput;
    fileInput.value = null;
    fileInput.addEventListener("change", function (evt) {
        const { files } = evt.target;
        if (!files || files.length === 0)
            return;
        eventBus.dispatch("fileinputchange", {
            source: this,
            fileInput: evt.target,
        });
    });
    // Enable dragging-and-dropping a new PDF file onto the viewerContainer.
    appConfig.mainContainer.addEventListener("dragover", evt => {
        evt.preventDefault();
        evt.dataTransfer.dropEffect = "move";
    });
    appConfig.mainContainer.addEventListener("drop", function (evt) {
        evt.preventDefault();
        const { files } = evt.dataTransfer;
        if (!files || files.length === 0)
            return;
        eventBus.dispatch("fileinputchange", {
            source: this,
            fileInput: evt.dataTransfer,
        });
    });
    if (!viewerapp.supportsDocumentFonts) {
        AppOptions.set("disableFontFace", true);
        viewerapp.l10n.get("web_fonts_disabled").then(msg => {
            console.warn(msg);
        });
    }
    if (!viewerapp.supportsPrinting) {
        appConfig.toolbar.print.classList.add("hidden");
        appConfig.secondaryToolbar.printButton.classList.add("hidden");
    }
    if (!viewerapp.supportsFullscreen) {
        appConfig.toolbar.presentationModeButton.classList.add("hidden");
        appConfig.secondaryToolbar.presentationModeButton.classList.add("hidden");
    }
    if (viewerapp.supportsIntegratedFind) {
        appConfig.toolbar.viewFind.classList.add("hidden");
    }
    appConfig.mainContainer.addEventListener("transitionend", function (evt) {
        if (evt.target === /* mainContainer */ this) {
            eventBus.dispatch("resize", { source: this });
        }
    }, true);
    try {
        if (file) {
            viewerapp.open(file);
        }
        else {
            viewerapp._hideViewBookmark();
        }
    }
    catch (reason) {
        viewerapp.l10n.get("loading_error").then(msg => {
            viewerapp._documentError(msg, reason);
        });
    }
}
function webViewerPageRendered({ pageNumber, error }) {
    // If the page is still visible when it has finished rendering,
    // ensure that the page number input loading indicator is hidden.
    if (pageNumber === viewerapp.page) {
        viewerapp.toolbar.updateLoadingIndicatorState(false);
    }
    // Use the rendered page to set the corresponding thumbnail image.
    if (viewerapp.pdfSidebar.isThumbnailViewVisible) {
        const pageView = viewerapp.pdfViewer.getPageView(
        /* index = */ pageNumber - 1);
        const thumbnailView = viewerapp.pdfThumbnailViewer.getThumbnail(
        /* index = */ pageNumber - 1);
        if (pageView && thumbnailView) {
            thumbnailView.setImage(pageView);
        }
    }
    if (error) {
        viewerapp.l10n.get("rendering_error").then(msg => {
            viewerapp._otherError(msg, error);
        });
    }
    // It is a good time to report stream and font types.
    viewerapp._reportDocumentStatsTelemetry();
}
function webViewerPageMode({ mode }) {
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
    viewerapp.pdfSidebar.switchView(view, /* forceOpen = */ true);
}
function webViewerNamedAction(evt) {
    // Processing a couple of named actions that might be useful, see also
    // `PDFLinkService.executeNamedAction`.
    switch (evt.action) {
        case "GoToPage":
            viewerapp.appConfig.toolbar.pageNumber.select();
            break;
        case "Find":
            if (!viewerapp.supportsIntegratedFind) {
                viewerapp.findBar.toggle();
            }
            break;
        case "Print":
            viewerapp.triggerPrinting();
            break;
        case "SaveAs":
            webViewerSave();
            break;
    }
}
function webViewerPresentationModeChanged(evt) {
    viewerapp.pdfViewer.presentationModeState = evt.state;
}
function webViewerSidebarViewChanged(evt) {
    viewerapp.pdfRenderingQueue.isThumbnailViewEnabled =
        viewerapp.pdfSidebar.isThumbnailViewVisible;
    if (viewerapp.isInitialViewSet) {
        // Only update the storage when the document has been loaded *and* rendered.
        viewerapp.store?.set("sidebarView", evt.view).catch(() => {
            // Unable to write to storage.
        });
    }
}
function webViewerUpdateViewarea(evt) {
    const location = evt.location;
    if (viewerapp.isInitialViewSet) {
        // Only update the storage when the document has been loaded *and* rendered.
        viewerapp.store
            ?.setMultiple({
            page: location.pageNumber,
            zoom: location.scale,
            scrollLeft: location.left,
            scrollTop: location.top,
            rotation: location.rotation,
        })
            .catch(() => {
            // Unable to write to storage.
        });
    }
    const href = viewerapp.pdfLinkService.getAnchorUrl(location.pdfOpenParams);
    viewerapp.appConfig.toolbar.viewBookmark.href = href;
    viewerapp.appConfig.secondaryToolbar.viewBookmarkButton.href = href;
    // Show/hide the loading indicator in the page number input element.
    const currentPage = viewerapp.pdfViewer.getPageView(
    /* index = */ viewerapp.page - 1);
    const loading = currentPage?.renderingState !== RenderingStates.FINISHED;
    viewerapp.toolbar.updateLoadingIndicatorState(loading);
}
function webViewerScrollModeChanged(evt) {
    if (viewerapp.isInitialViewSet) {
        // Only update the storage when the document has been loaded *and* rendered.
        viewerapp.store?.set("scrollMode", evt.mode).catch(() => {
            // Unable to write to storage.
        });
    }
}
function webViewerSpreadModeChanged(evt) {
    if (viewerapp.isInitialViewSet) {
        // Only update the storage when the document has been loaded *and* rendered.
        viewerapp.store?.set("spreadMode", evt.mode).catch(() => {
            // Unable to write to storage.
        });
    }
}
function webViewerResize() {
    const { pdfDocument, pdfViewer } = viewerapp;
    pdfViewer.updateContainerHeightCss();
    if (!pdfDocument)
        return;
    const currentScaleValue = pdfViewer.currentScaleValue;
    if (currentScaleValue === "auto"
        || currentScaleValue === "page-fit"
        || currentScaleValue === "page-width") {
        // Note: the scale is constant for 'page-actual'.
        pdfViewer.currentScaleValue = currentScaleValue;
    }
    pdfViewer.update();
}
function webViewerHashchange(evt) {
    const hash = evt.hash;
    if (!hash)
        return;
    if (!viewerapp.isInitialViewSet) {
        viewerapp.initialBookmark = hash;
    }
    else if (!viewerapp.pdfHistory?.popStateInProgress) {
        viewerapp.pdfLinkService.setHash(hash);
    }
}
// eslint-disable-next-line no-var
const webViewerFileInputChange = (evt) => {
    if (viewerapp.pdfViewer?.isInPresentationMode)
        // Opening a new PDF file isn't supported in Presentation Mode.
        return;
    const file = evt.fileInput.files[0];
    let url = URL.createObjectURL(file);
    if (file.name) {
        url = { url, originalUrl: file.name };
    }
    viewerapp.open(url);
};
// eslint-disable-next-line no-var
const webViewerOpenFile = (evt) => {
    const fileInput = viewerapp.appConfig.openFileInput;
    fileInput.click();
};
function webViewerPresentationMode() {
    viewerapp.requestPresentationMode();
}
function webViewerPrint() {
    viewerapp.triggerPrinting();
}
function webViewerDownload() {
    viewerapp.downloadOrSave({ sourceEventType: "download" });
}
function webViewerSave() {
    viewerapp.downloadOrSave({ sourceEventType: "save" });
}
function webViewerFirstPage() {
    if (viewerapp.pdfDocument) {
        viewerapp.page = 1;
    }
}
function webViewerLastPage() {
    if (viewerapp.pdfDocument) {
        viewerapp.page = viewerapp.pagesCount;
    }
}
function webViewerNextPage() {
    viewerapp.pdfViewer.nextPage();
}
function webViewerPreviousPage() {
    viewerapp.pdfViewer.previousPage();
}
function webViewerZoomIn() {
    viewerapp.zoomIn();
}
function webViewerZoomOut() {
    viewerapp.zoomOut();
}
function webViewerZoomReset() {
    viewerapp.zoomReset();
}
function webViewerPageNumberChanged(evt) {
    const pdfViewer = viewerapp.pdfViewer;
    // Note that for `<input type="number">` HTML elements, an empty string will
    // be returned for non-number inputs; hence we simply do nothing in that case.
    if (evt.value !== "") {
        viewerapp.pdfLinkService.goToPage(evt.value);
    }
    // Ensure that the page number input displays the correct value, even if the
    // value entered by the user was invalid (e.g. a floating point number).
    if (evt.value !== pdfViewer.currentPageNumber.toString() &&
        evt.value !== pdfViewer.currentPageLabel) {
        viewerapp.toolbar.setPageNumber(pdfViewer.currentPageNumber, pdfViewer.currentPageLabel);
    }
}
function webViewerScaleChanged(evt) {
    viewerapp.pdfViewer.currentScaleValue = evt.value;
}
function webViewerRotateCw() {
    viewerapp.rotatePages(90);
}
function webViewerRotateCcw() {
    viewerapp.rotatePages(-90);
}
function webViewerOptionalContentConfig(evt) {
    viewerapp.pdfViewer.optionalContentConfigPromise = evt.promise;
}
function webViewerSwitchScrollMode(evt) {
    viewerapp.pdfViewer.scrollMode = evt.mode;
}
function webViewerSwitchSpreadMode(evt) {
    viewerapp.pdfViewer.spreadMode = evt.mode;
}
function webViewerDocumentProperties() {
    viewerapp.pdfDocumentProperties.open();
}
function webViewerFindFromUrlHash(evt) {
    viewerapp.eventBus.dispatch("find", {
        source: evt.source,
        type: "",
        query: evt.query,
        phraseSearch: evt.phraseSearch,
        caseSensitive: false,
        entireWord: false,
        highlightAll: true,
        findPrevious: false,
        matchDiacritics: true,
    });
}
function webViewerUpdateFindMatchesCount({ matchesCount }) {
    if (viewerapp.supportsIntegratedFind) {
        viewerapp.externalServices.updateFindMatchesCount(matchesCount);
    }
    else {
        viewerapp.findBar.updateResultsCount(matchesCount);
    }
}
function webViewerUpdateFindControlState({ state, previous, matchesCount, rawQuery, }) {
    if (viewerapp.supportsIntegratedFind) {
        viewerapp.externalServices.updateFindControlState({
            result: state,
            findPrevious: previous,
            matchesCount,
            rawQuery,
        });
    }
    else {
        viewerapp.findBar.updateUIState(state, previous, matchesCount);
    }
}
function webViewerScaleChanging(evt) {
    viewerapp.toolbar.setPageScale(evt.presetValue, evt.scale);
    viewerapp.pdfViewer.update();
}
function webViewerRotationChanging(evt) {
    viewerapp.pdfThumbnailViewer.pagesRotation = evt.pagesRotation;
    viewerapp.forceRendering();
    // Ensure that the active page doesn't change during rotation.
    viewerapp.pdfViewer.currentPageNumber = evt.pageNumber;
}
function webViewerPageChanging({ pageNumber, pageLabel }) {
    viewerapp.toolbar.setPageNumber(pageNumber, pageLabel);
    viewerapp.secondaryToolbar.setPageNumber(pageNumber);
    if (viewerapp.pdfSidebar.isThumbnailViewVisible) {
        viewerapp.pdfThumbnailViewer.scrollThumbnailIntoView(pageNumber);
    }
}
function webViewerVisibilityChange(evt) {
    if (document.visibilityState === "visible") {
        // Ignore mouse wheel zooming during tab switches (bug 1503412).
        setZoomDisabledTimeout();
    }
}
let zoomDisabledTimeout;
function setZoomDisabledTimeout() {
    if (zoomDisabledTimeout) {
        clearTimeout(zoomDisabledTimeout);
    }
    zoomDisabledTimeout = setTimeout(() => {
        zoomDisabledTimeout = undefined;
    }, WHEEL_ZOOM_DISABLED_TIMEOUT);
}
function webViewerWheel(evt) {
    const { pdfViewer, supportedMouseWheelZoomModifierKeys } = viewerapp;
    if (pdfViewer.isInPresentationMode)
        return;
    if ((evt.ctrlKey && supportedMouseWheelZoomModifierKeys.ctrlKey)
        || (evt.metaKey && supportedMouseWheelZoomModifierKeys.metaKey)) {
        // Only zoom the pages, not the entire viewer.
        evt.preventDefault();
        // NOTE: this check must be placed *after* preventDefault.
        if (zoomDisabledTimeout || document.visibilityState === "hidden")
            return;
        // It is important that we query deltaMode before delta{X,Y}, so that
        // Firefox doesn't switch to DOM_DELTA_PIXEL mode for compat with other
        // browsers, see https://bugzilla.mozilla.org/show_bug.cgi?id=1392460.
        const deltaMode = evt.deltaMode;
        const delta = normalizeWheelEventDirection(evt);
        const previousScale = pdfViewer.currentScale;
        let ticks = 0;
        if (deltaMode === WheelEvent.DOM_DELTA_LINE
            || deltaMode === WheelEvent.DOM_DELTA_PAGE) {
            // For line-based devices, use one tick per event, because different
            // OSs have different defaults for the number lines. But we generally
            // want one "clicky" roll of the wheel (which produces one event) to
            // adjust the zoom by one step.
            if (Math.abs(delta) >= 1) {
                ticks = Math.sign(delta);
            }
            else {
                // If we're getting fractional lines (I can't think of a scenario
                // this might actually happen), be safe and use the accumulator.
                ticks = viewerapp.accumulateWheelTicks(delta);
            }
        }
        else {
            // pixel-based devices
            const PIXELS_PER_LINE_SCALE = 30;
            ticks = viewerapp.accumulateWheelTicks(delta / PIXELS_PER_LINE_SCALE);
        }
        if (ticks < 0) {
            viewerapp.zoomOut(-ticks);
        }
        else if (ticks > 0) {
            viewerapp.zoomIn(ticks);
        }
        const currentScale = pdfViewer.currentScale;
        if (previousScale !== currentScale) {
            // After scaling the page via zoomIn/zoomOut, the position of the upper-
            // left corner is restored. When the mouse wheel is used, the position
            // under the cursor should be restored instead.
            const scaleCorrectionFactor = currentScale / previousScale - 1;
            const rect = pdfViewer.container.getBoundingClientRect();
            const dx = evt.clientX - rect.left;
            const dy = evt.clientY - rect.top;
            pdfViewer.container.scrollLeft += dx * scaleCorrectionFactor;
            pdfViewer.container.scrollTop += dy * scaleCorrectionFactor;
        }
    }
    else {
        setZoomDisabledTimeout();
    }
}
function webViewerTouchStart(evt) {
    if (evt.touches.length > 1) {
        // Disable touch-based zooming, because the entire UI bits gets zoomed and
        // that doesn't look great. If we do want to have a good touch-based
        // zooming experience, we need to implement smooth zoom capability (probably
        // using a CSS transform for faster visual response, followed by async
        // re-rendering at the final zoom level) and do gesture detection on the
        // touchmove events to drive it. Or if we want to settle for a less good
        // experience we can make the touchmove events drive the existing step-zoom
        // behaviour that the ctrl+mousewheel path takes.
        evt.preventDefault();
    }
}
function webViewerClick(evt) {
    if (!viewerapp.secondaryToolbar.isOpen)
        return;
    const appConfig = viewerapp.appConfig;
    if (viewerapp.pdfViewer.containsElement(evt.target)
        || (appConfig.toolbar.container.contains(evt.target)
            && evt.target !== appConfig.secondaryToolbar.toggleButton)) {
        viewerapp.secondaryToolbar.close();
    }
}
function webViewerKeyDown(evt) {
    if (viewerapp.overlayManager.active)
        return;
    const { eventBus, pdfViewer } = viewerapp;
    const isViewerInPresentationMode = pdfViewer.isInPresentationMode;
    let handled = false, ensureViewerFocused = false;
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
                if (!viewerapp.supportsIntegratedFind && !evt.shiftKey) {
                    viewerapp.findBar.open();
                    handled = true;
                }
                break;
            case 71: // g
                if (!viewerapp.supportsIntegratedFind) {
                    const { state } = viewerapp.findController;
                    if (state) {
                        const eventState = Object.assign(Object.create(null), state, {
                            source: window,
                            type: "again",
                            findPrevious: cmd === 5 || cmd === 12,
                        });
                        eventBus.dispatch("find", eventState);
                    }
                    handled = true;
                }
                break;
            case 61: // FF/Mac '='
            case 107: // FF '+' and '='
            case 187: // Chrome '+'
            case 171: // FF with German keyboard
                if (!isViewerInPresentationMode) {
                    viewerapp.zoomIn();
                }
                handled = true;
                break;
            case 173: // FF/Mac '-'
            case 109: // FF '-'
            case 189: // Chrome '-'
                if (!isViewerInPresentationMode) {
                    viewerapp.zoomOut();
                }
                handled = true;
                break;
            case 48: // '0'
            case 96: // '0' on Numpad of Swedish keyboard
                if (!isViewerInPresentationMode) {
                    // keeping it unhandled (to restore page zoom to 100%)
                    setTimeout(() => {
                        // ... and resetting the scale after browser adjusts its scale
                        viewerapp.zoomReset();
                    });
                    handled = false;
                }
                break;
            case 38: // up arrow
                if (isViewerInPresentationMode || viewerapp.page > 1) {
                    viewerapp.page = 1;
                    handled = true;
                    ensureViewerFocused = true;
                }
                break;
            case 40: // down arrow
                if (isViewerInPresentationMode ||
                    viewerapp.page < viewerapp.pagesCount) {
                    viewerapp.page = viewerapp.pagesCount;
                    handled = true;
                    ensureViewerFocused = true;
                }
                break;
        }
    }
    // CTRL or META without shift
    if (cmd === 1 || cmd === 8) {
        switch (evt.keyCode) {
            case 83: // s
                eventBus.dispatch("download", { source: window });
                handled = true;
                break;
            case 79: // o
                eventBus.dispatch("openfile", { source: window });
                handled = true;
                break;
        }
    }
    // CTRL+ALT or Option+Command
    if (cmd === 3 || cmd === 10) {
        switch (evt.keyCode) {
            case 80: // p
                viewerapp.requestPresentationMode();
                handled = true;
                break;
            case 71: // g
                // focuses input#pageNumber field
                viewerapp.appConfig.toolbar.pageNumber.select();
                handled = true;
                break;
        }
    }
    if (handled) {
        if (ensureViewerFocused && !isViewerInPresentationMode) {
            pdfViewer.focus();
        }
        evt.preventDefault();
        return;
    }
    // Some shortcuts should not get handled if a control/input element
    // is selected.
    const curElement = getActiveOrFocusedElement();
    const curElementTagName = curElement?.tagName.toUpperCase();
    if (curElementTagName === "INPUT"
        || curElementTagName === "TEXTAREA"
        || curElementTagName === "SELECT"
        || curElement?.isContentEditable) {
        // Make sure that the secondary toolbar is closed when Escape is pressed.
        if (evt.keyCode !== /* Esc = */ 27)
            return;
    }
    // No control key pressed at all.
    if (cmd === 0) {
        let turnPage = 0, turnOnlyIfPageFit = false;
        switch (evt.keyCode) {
            case 38: // up arrow
            case 33: // pg up
                // vertical scrolling using arrow/pg keys
                if (pdfViewer.isVerticalScrollbarEnabled) {
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
                if (pdfViewer.isHorizontalScrollbarEnabled) {
                    turnOnlyIfPageFit = true;
                }
            /* falls through */
            case 75: // 'k'
            case 80: // 'p'
                turnPage = -1;
                break;
            case 27: // esc key
                if (viewerapp.secondaryToolbar.isOpen) {
                    viewerapp.secondaryToolbar.close();
                    handled = true;
                }
                if (!viewerapp.supportsIntegratedFind
                    && viewerapp.findBar.opened) {
                    viewerapp.findBar.close();
                    handled = true;
                }
                break;
            case 40: // down arrow
            case 34: // pg down
                // vertical scrolling using arrow/pg keys
                if (pdfViewer.isVerticalScrollbarEnabled) {
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
                if (pdfViewer.isHorizontalScrollbarEnabled) {
                    turnOnlyIfPageFit = true;
                }
            /* falls through */
            case 74: // 'j'
            case 78: // 'n'
                turnPage = 1;
                break;
            case 36: // home
                if (isViewerInPresentationMode || viewerapp.page > 1) {
                    viewerapp.page = 1;
                    handled = true;
                    ensureViewerFocused = true;
                }
                break;
            case 35: // end
                if (isViewerInPresentationMode ||
                    viewerapp.page < viewerapp.pagesCount) {
                    viewerapp.page = viewerapp.pagesCount;
                    handled = true;
                    ensureViewerFocused = true;
                }
                break;
            case 83: // 's'
                viewerapp.pdfCursorTools.switchTool(CursorTool.SELECT);
                break;
            case 72: // 'h'
                viewerapp.pdfCursorTools.switchTool(CursorTool.HAND);
                break;
            case 82: // 'r'
                viewerapp.rotatePages(90);
                break;
            case 115: // F4
                viewerapp.pdfSidebar.toggle();
                break;
        }
        if (turnPage !== 0 &&
            (!turnOnlyIfPageFit || pdfViewer.currentScaleValue === "page-fit")) {
            if (turnPage > 0) {
                pdfViewer.nextPage();
            }
            else {
                pdfViewer.previousPage();
            }
            handled = true;
        }
    }
    // shift-key
    if (cmd === 4) {
        switch (evt.keyCode) {
            case 13: // enter key
            case 32: // spacebar
                if (!isViewerInPresentationMode &&
                    pdfViewer.currentScaleValue !== "page-fit") {
                    break;
                }
                pdfViewer.previousPage();
                handled = true;
                break;
            case 82: // 'r'
                viewerapp.rotatePages(-90);
                break;
        }
    }
    if (!handled && !isViewerInPresentationMode) {
        // 33=Page Up  34=Page Down  35=End    36=Home
        // 37=Left     38=Up         39=Right  40=Down
        // 32=Spacebar
        if ((evt.keyCode >= 33 && evt.keyCode <= 40) ||
            (evt.keyCode === 32 && curElementTagName !== "BUTTON")) {
            ensureViewerFocused = true;
        }
    }
    if (ensureViewerFocused && !pdfViewer.containsElement(curElement)) {
        // The page container is not focused, but a page navigation key has been
        // pressed. Change the focus to the viewer container to make sure that
        // navigation by keyboard works as expected.
        pdfViewer.focus();
    }
    if (handled) {
        evt.preventDefault();
    }
}
function beforeUnload(evt) {
    evt.preventDefault();
    evt.returnValue = "";
    return false;
}
/* Abstract factory for the print service. */
export const PDFPrintServiceFactory = {
    instance: {
        supportsPrinting: false,
        createPrintService(pdfDocument, pagesOverview, printContainer, printResolution, optionalContentConfigPromise, l10n) {
            throw new Error("Not implemented: createPrintService");
        },
    },
};
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=app.js.map