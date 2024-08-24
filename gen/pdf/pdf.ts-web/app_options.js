/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/app_options
 * @license Apache-2.0
 ******************************************************************************/
import { D_rp_web, D_rpe_cmap, D_rpe_sfont } from "../../alias.js";
import { CHROME, GECKOVIEW, GENERIC, LIB, MOZCENTRAL, PDFJSDev, TESTING, } from "../../global.js";
import { AD_gh } from "../alias.js";
import { AnnotationEditorType, AnnotationMode, VerbosityLevel, } from "../pdf.ts-src/pdf.js";
import { LinkTarget } from "./pdf_link_service.js";
import { CursorTool, ScrollMode, SidebarView, SpreadMode, TextLayerMode, } from "./ui_utils.js";
export var OptionKind;
(function (OptionKind) {
    OptionKind[OptionKind["UNDEFINED"] = 0] = "UNDEFINED";
    OptionKind[OptionKind["BROWSER"] = 1] = "BROWSER";
    OptionKind[OptionKind["VIEWER"] = 2] = "VIEWER";
    OptionKind[OptionKind["API"] = 4] = "API";
    OptionKind[OptionKind["WORKER"] = 8] = "WORKER";
    OptionKind[OptionKind["EVENT_DISPATCH"] = 16] = "EVENT_DISPATCH";
    OptionKind[OptionKind["PREFERENCE"] = 128] = "PREFERENCE";
})(OptionKind || (OptionKind = {}));
export var ToolbarDensity;
(function (ToolbarDensity) {
    /** Default value */
    ToolbarDensity[ToolbarDensity["normal"] = 0] = "normal";
    ToolbarDensity[ToolbarDensity["compact"] = 1] = "compact";
    ToolbarDensity[ToolbarDensity["touch"] = 2] = "touch";
})(ToolbarDensity || (ToolbarDensity = {}));
export var ViewOnLoad;
(function (ViewOnLoad) {
    ViewOnLoad[ViewOnLoad["UNKNOWN"] = -1] = "UNKNOWN";
    /** Default value */
    ViewOnLoad[ViewOnLoad["PREVIOUS"] = 0] = "PREVIOUS";
    ViewOnLoad[ViewOnLoad["INITIAL"] = 1] = "INITIAL";
})(ViewOnLoad || (ViewOnLoad = {}));
/** Should only be used with options that allow multiple types. */
var Type;
(function (Type) {
    Type[Type["BOOLEAN"] = 1] = "BOOLEAN";
    Type[Type["NUMBER"] = 2] = "NUMBER";
    Type[Type["OBJECT"] = 4] = "OBJECT";
    Type[Type["STRING"] = 8] = "STRING";
    Type[Type["UNDEFINED"] = 16] = "UNDEFINED";
})(Type || (Type = {}));
/**
 * NOTE: These options are used to generate the `default_preferences.json` file,
 *       see `OptionKind.PREFERENCE`, hence the values below must use only
 *       primitive types and cannot rely on any imported types.
 */
const defaultOptions = {
    allowedGlobalEvents: {
        value: null,
        kind: OptionKind.BROWSER,
    },
    canvasMaxAreaInBytes: {
        value: -1,
        kind: OptionKind.BROWSER + OptionKind.API,
    },
    isInAutomation: {
        value: false,
        kind: OptionKind.BROWSER,
    },
    localeProperties: {
        value: /*#static*/ { lang: navigator.language || "en-US" },
        kind: OptionKind.BROWSER,
    },
    nimbusDataStr: {
        value: "",
        kind: OptionKind.BROWSER,
    },
    supportsCaretBrowsingMode: {
        value: false,
        kind: OptionKind.BROWSER,
    },
    supportsDocumentFonts: {
        value: true,
        kind: OptionKind.BROWSER,
    },
    supportsIntegratedFind: {
        value: false,
        kind: OptionKind.BROWSER,
    },
    supportsMouseWheelZoomCtrlKey: {
        value: true,
        kind: OptionKind.BROWSER,
    },
    supportsMouseWheelZoomMetaKey: {
        value: true,
        kind: OptionKind.BROWSER,
    },
    supportsPinchToZoom: {
        value: true,
        kind: OptionKind.BROWSER,
    },
    toolbarDensity: {
        value: ToolbarDensity.normal,
        kind: OptionKind.BROWSER + OptionKind.EVENT_DISPATCH,
    },
    altTextLearnMoreUrl: {
        value: /*#static*/ "",
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    annotationEditorMode: {
        value: AnnotationEditorType.NONE,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    annotationMode: {
        value: AnnotationMode.ENABLE_FORMS,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    viewerCssTheme: {
        value: undefined,
        kind: OptionKind.UNDEFINED,
    },
    cursorToolOnLoad: {
        value: CursorTool.SELECT,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    debuggerSrc: {
        value: "./debugger.mjs",
        kind: OptionKind.VIEWER,
    },
    defaultUrl: {
        value: undefined,
        kind: OptionKind.UNDEFINED,
    },
    defaultZoomDelay: {
        value: 400,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    defaultZoomValue: {
        value: "",
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    disableHistory: {
        value: false,
        kind: OptionKind.VIEWER,
    },
    disablePageLabels: {
        value: false,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    enableAltText: {
        value: false,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    enableGuessAltText: {
        value: true,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    disablePreferences: {
        value: false,
        kind: OptionKind.UNDEFINED,
    },
    enableHighlightEditor: {
        // We'll probably want to make some experiments before enabling this
        // in Firefox release, but it has to be temporary.
        // TODO: remove it when unnecessary.
        value: PDFJSDev || TESTING,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    enableHighlightFloatingButton: {
        // We'll probably want to make some experiments before enabling this
        // in Firefox release, but it has to be temporary.
        // TODO: remove it when unnecessary.
        value: PDFJSDev || TESTING,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    enablePermissions: {
        value: false,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    enablePrintAutoRotate: {
        value: true,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    enableScripting: {
        value: /*#static*/ true,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    enableUpdatedAddImage: {
        // We'll probably want to make some experiments before enabling this
        // in Firefox release, but it has to be temporary.
        // TODO: remove it when unnecessary.
        value: false,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    externalLinkRel: {
        value: "noopener noreferrer nofollow",
        kind: OptionKind.VIEWER,
    },
    externalLinkTarget: {
        value: LinkTarget.NONE,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    highlightEditorColors: {
        value: "yellow=#FFFF98,green=#53FFBC,blue=#80EBFF,pink=#FFCBE6,red=#FF4F5F",
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    historyUpdateUrl: {
        value: false,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    ignoreDestinationZoom: {
        value: false,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    imageResourcesPath: {
        value: /*#static*/ `${AD_gh}/${D_rp_web}/images/`,
        kind: OptionKind.VIEWER,
    },
    maxCanvasPixels: {
        value: 2 ** 25,
        kind: OptionKind.VIEWER,
    },
    forcePageColors: {
        value: false,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    pageColorsBackground: {
        value: "Canvas",
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    pageColorsForeground: {
        value: "CanvasText",
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    pdfBugEnabled: {
        value: PDFJSDev || TESTING,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    printResolution: {
        value: 150,
        kind: OptionKind.VIEWER,
    },
    sidebarViewOnLoad: {
        value: SidebarView.UNKNOWN,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    scrollModeOnLoad: {
        value: ScrollMode.UNKNOWN,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    spreadModeOnLoad: {
        value: SpreadMode.UNKNOWN,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    textLayerMode: {
        value: TextLayerMode.ENABLE,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    viewOnLoad: {
        value: ViewOnLoad.PREVIOUS,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    cMapPacked: {
        value: true,
        kind: OptionKind.API,
    },
    cMapUrl: {
        value: 
        // eslint-disable-next-line no-nested-ternary
        /*#static*/ `${AD_gh}/${D_rpe_cmap}/`,
        kind: OptionKind.API,
    },
    disableAutoFetch: {
        value: false,
        kind: OptionKind.API + OptionKind.PREFERENCE,
    },
    disableFontFace: {
        value: false,
        kind: OptionKind.API + OptionKind.PREFERENCE,
    },
    disableRange: {
        value: false,
        kind: OptionKind.API + OptionKind.PREFERENCE,
    },
    disableStream: {
        value: false,
        kind: OptionKind.API + OptionKind.PREFERENCE,
    },
    disableTelemetry: {
        value: false,
        kind: OptionKind.UNDEFINED,
    },
    docBaseUrl: {
        value: /*#static*/ document.URL.split("#", 1)[0],
        kind: OptionKind.API,
    },
    enableHWA: {
        /** @type {boolean} */
        value: !MOZCENTRAL,
        kind: OptionKind.API + OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    enableXfa: {
        value: true,
        kind: OptionKind.API + OptionKind.PREFERENCE,
    },
    fontExtraProperties: {
        value: false,
        kind: OptionKind.API,
    },
    isEvalSupported: {
        value: true,
        kind: OptionKind.API,
    },
    isOffscreenCanvasSupported: {
        value: true,
        kind: OptionKind.API,
    },
    maxImageSize: {
        value: -1,
        kind: OptionKind.API,
    },
    pdfBug: {
        value: false,
        kind: OptionKind.API,
    },
    standardFontDataUrl: {
        value: 
        // eslint-disable-next-line no-nested-ternary
        /*#static*/ `${AD_gh}/${D_rpe_sfont}/`,
        kind: OptionKind.API,
    },
    useSystemFonts: {
        // On Android, there is almost no chance to have the font we want so we
        // don't use the system fonts in this case (bug 1882613).
        value: (
        /*#static*/ window.isGECKOVIEW)
            ? false
            : undefined,
        kind: OptionKind.API,
        type: Type.BOOLEAN + Type.UNDEFINED,
    },
    verbosity: {
        value: VerbosityLevel.INFOS,
        // value: VerbosityLevel.WARNINGS,
        kind: OptionKind.API,
    },
    workerPort: {
        value: null,
        kind: OptionKind.WORKER,
    },
    workerSrc: {
        value: 
        // eslint-disable-next-line no-nested-ternary
        /*#static*/ `${AD_gh}/gen/pdf/pdf.ts-src/pdf.worker.js`,
        kind: OptionKind.WORKER,
    },
    sandboxBundleSrc: {
        value: undefined,
        kind: OptionKind.UNDEFINED,
    },
};
/*#static*/  {
    defaultOptions.defaultUrl = {
        value: /*#static*/ `${AD_gh}/${D_rp_web}/compressed.tracemonkey-pldi-09.pdf`,
        kind: OptionKind.VIEWER,
    };
    defaultOptions.sandboxBundleSrc = {
        value: /*#static*/ `${AD_gh}/gen/pdf/pdf.ts-src/pdf.sandbox.js`,
        kind: OptionKind.VIEWER,
    };
    defaultOptions.viewerCssTheme = {
        /** @type {number} */
        value: /*#static*/ 0,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    };
}
/*#static*/  {
    defaultOptions.disablePreferences = {
        value: TESTING ? true : false,
        kind: OptionKind.VIEWER,
    };
}
/*#static*/  {
    // eslint-disable-next-line no-var
    var compatParams = new Map();
    /*#static*/ 
    const userAgent = navigator.userAgent || "";
    const platform = navigator.platform || "";
    const maxTouchPoints = navigator.maxTouchPoints || 1;
    const isAndroid = /Android/.test(userAgent);
    const isIOS = /\b(iPad|iPhone|iPod)(?=;)/.test(userAgent) ||
        (platform === "MacIntel" && maxTouchPoints > 1);
    // Limit canvas size to 5 mega-pixels on mobile.
    // Support: Android, iOS
    (() => {
        if (isIOS || isAndroid) {
            compatParams.set("maxCanvasPixels", 5242880);
        }
    })();
    // Don't use system fonts on Android (issue 18210).
    // Support: Android
    (() => {
        if (isAndroid) {
            compatParams.set("useSystemFonts", false);
        }
    })();
}
const userOptions = new Map();
/*#static*/  {
    // Apply any compatibility-values to the user-options.
    for (const [name, value] of compatParams) {
        userOptions.set(name, value);
    }
}
/*#static*/  {
    // Ensure that the `defaultOptions` are correctly specified.
    for (const name in defaultOptions) {
        const { value, kind, type } = defaultOptions[name];
        if (kind & OptionKind.PREFERENCE) {
            if (kind === OptionKind.PREFERENCE) {
                throw new Error(`Cannot use only "PREFERENCE" kind: ${name}`);
            }
            if (kind & OptionKind.BROWSER) {
                throw new Error(`Cannot mix "PREFERENCE" and "BROWSER" kind: ${name}`);
            }
            if (type !== undefined) {
                throw new Error(`Cannot have \`type\`-field for "PREFERENCE" kind: ${name}`);
            }
            if (typeof compatParams === "object" &&
                compatParams.has(name)) {
                throw new Error(`Should not have compatibility-value for "PREFERENCE" kind: ${name}`);
            }
            // Only "simple" preference-values are allowed.
            if (typeof value !== "boolean" &&
                typeof value !== "string" &&
                !Number.isInteger(value)) {
                throw new Error(`Invalid value for "PREFERENCE" kind: ${name}`);
            }
        }
        else if (kind & OptionKind.BROWSER) {
            if (type !== undefined) {
                throw new Error(`Cannot have \`type\`-field for "BROWSER" kind: ${name}`);
            }
            if (typeof compatParams === "object" &&
                compatParams.has(name)) {
                throw new Error(`Should not have compatibility-value for "BROWSER" kind: ${name}`);
            }
            if (value === undefined) {
                throw new Error(`Invalid value for "BROWSER" kind: ${name}`);
            }
        }
    }
}
export class AppOptions {
    static eventBus;
    static #get(name) {
        return userOptions.has(name)
            ? userOptions.get(name)
            : defaultOptions[name]?.value;
    }
    static get allowedGlobalEvents() {
        return this.#get("allowedGlobalEvents");
    }
    static get canvasMaxAreaInBytes() {
        return this.#get("canvasMaxAreaInBytes");
    }
    static get isInAutomation() {
        return this.#get("isInAutomation");
    }
    static get localeProperties() {
        return this.#get("localeProperties");
    }
    static get nimbusDataStr() {
        return this.#get("nimbusDataStr");
    }
    static get supportsCaretBrowsingMode() {
        return this.#get("supportsCaretBrowsingMode");
    }
    static get supportsDocumentFonts() {
        return this.#get("supportsDocumentFonts");
    }
    static get supportsIntegratedFind() {
        return this.#get("supportsIntegratedFind");
    }
    static get supportsMouseWheelZoomCtrlKey() {
        return this.#get("supportsMouseWheelZoomCtrlKey");
    }
    static get supportsMouseWheelZoomMetaKey() {
        return this.#get("supportsMouseWheelZoomMetaKey");
    }
    static get supportsPinchToZoom() {
        return this.#get("supportsPinchToZoom");
    }
    static get toolbarDensity() {
        return this.#get("toolbarDensity");
    }
    static get altTextLearnMoreUrl() {
        return this.#get("altTextLearnMoreUrl");
    }
    static get annotationEditorMode() {
        return this.#get("annotationEditorMode");
    }
    static get annotationMode() {
        return this.#get("annotationMode");
    }
    static get viewerCssTheme() {
        return this.#get("annotationMode");
    }
    static get cursorToolOnLoad() {
        return this.#get("cursorToolOnLoad");
    }
    static get debuggerSrc() {
        return this.#get("debuggerSrc");
    }
    static get defaultUrl() {
        return this.#get("defaultUrl");
    }
    static get defaultZoomDelay() {
        return this.#get("defaultZoomDelay");
    }
    static get defaultZoomValue() {
        return this.#get("defaultZoomValue");
    }
    static get disableHistory() {
        return this.#get("disableHistory");
    }
    static get disablePageLabels() {
        return this.#get("disablePageLabels");
    }
    static get enableAltText() {
        return this.#get("enableAltText");
    }
    static get enableGuessAltText() {
        return this.#get("enableGuessAltText");
    }
    static get disablePreferences() {
        return this.#get("disablePreferences");
    }
    static get enableHighlightEditor() {
        return this.#get("enableHighlightEditor");
    }
    static get enableHighlightFloatingButton() {
        return this.#get("enableHighlightFloatingButton");
    }
    static get enablePermissions() {
        return this.#get("enablePermissions");
    }
    static get enablePrintAutoRotate() {
        return this.#get("enablePrintAutoRotate");
    }
    static get enableScripting() {
        return this.#get("enableScripting");
    }
    static get enableUpdatedAddImage() {
        return this.#get("enableUpdatedAddImage");
    }
    static get externalLinkRel() {
        return this.#get("externalLinkRel");
    }
    static get externalLinkTarget() {
        return this.#get("externalLinkTarget");
    }
    static get highlightEditorColors() {
        return this.#get("highlightEditorColors");
    }
    static get historyUpdateUrl() {
        return this.#get("historyUpdateUrl");
    }
    static get ignoreDestinationZoom() {
        return this.#get("ignoreDestinationZoom");
    }
    static get imageResourcesPath() {
        return this.#get("imageResourcesPath");
    }
    static get maxCanvasPixels() {
        return this.#get("maxCanvasPixels");
    }
    static get forcePageColors() {
        return this.#get("forcePageColors");
    }
    static get pageColorsBackground() {
        return this.#get("pageColorsBackground");
    }
    static get pageColorsForeground() {
        return this.#get("pageColorsForeground");
    }
    static get pdfBugEnabled() {
        return this.#get("pdfBugEnabled");
    }
    static get printResolution() {
        return this.#get("printResolution");
    }
    static get sidebarViewOnLoad() {
        return this.#get("sidebarViewOnLoad");
    }
    static get scrollModeOnLoad() {
        return this.#get("scrollModeOnLoad");
    }
    static get spreadModeOnLoad() {
        return this.#get("spreadModeOnLoad");
    }
    static get textLayerMode() {
        return this.#get("textLayerMode");
    }
    static get viewOnLoad() {
        return this.#get("viewOnLoad");
    }
    static get cMapPacked() {
        return this.#get("cMapPacked");
    }
    static get cMapUrl() {
        return this.#get("cMapUrl");
    }
    static get disableAutoFetch() {
        return this.#get("disableAutoFetch");
    }
    static get disableFontFace() {
        return this.#get("disableFontFace");
    }
    static get disableRange() {
        return this.#get("disableRange");
    }
    static get disableStream() {
        return this.#get("disableStream");
    }
    static get disableTelemetry() {
        return this.#get("disableTelemetry");
    }
    static get docBaseUrl() {
        return this.#get("docBaseUrl");
    }
    static get enableHWA() {
        return this.#get("enableHWA");
    }
    static get enableXfa() {
        return this.#get("enableXfa");
    }
    static get fontExtraProperties() {
        return this.#get("fontExtraProperties");
    }
    static get isEvalSupported() {
        return this.#get("isEvalSupported");
    }
    static get isOffscreenCanvasSupported() {
        return this.#get("isOffscreenCanvasSupported");
    }
    static get maxImageSize() {
        return this.#get("maxImageSize");
    }
    static get pdfBug() {
        return this.#get("pdfBug");
    }
    static get standardFontDataUrl() {
        return this.#get("standardFontDataUrl");
    }
    static get useSystemFonts() {
        return this.#get("useSystemFonts");
    }
    static get verbosity() {
        return this.#get("verbosity");
    }
    static get workerPort() {
        return this.#get("workerPort");
    }
    static get workerSrc() {
        return this.#get("workerSrc");
    }
    static get sandboxBundleSrc() {
        return this.#get("sandboxBundleSrc");
    }
    /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/
    static getAll(kind, defaultOnly = false) {
        const options = Object.create(null);
        for (const name in defaultOptions) {
            const defaultOpt = defaultOptions[name];
            if (kind && !(kind & defaultOpt.kind)) {
                continue;
            }
            options[name] =
                !defaultOnly && userOptions.has(name)
                    ? userOptions.get(name)
                    : defaultOpt.value;
        }
        return options;
    }
    static set(name, value) {
        this.setAll({ [name]: value });
    }
    static setAll(options, prefs = false) {
        let events;
        for (const name in options) {
            const defaultOpt = defaultOptions[name], userOpt = options[name];
            if (!defaultOpt ||
                !(typeof userOpt === typeof defaultOpt.value ||
                    Type[(typeof userOpt).toUpperCase()] &
                        defaultOpt.type)) {
                continue;
            }
            const { kind } = defaultOpt;
            if (prefs &&
                !(kind & OptionKind.BROWSER || kind & OptionKind.PREFERENCE)) {
                continue;
            }
            if (this.eventBus && kind & OptionKind.EVENT_DISPATCH) {
                (events ||= new Map()).set(name, userOpt);
            }
            userOptions.set(name, userOpt);
        }
        if (events) {
            for (const [name, value] of events) {
                this.eventBus.dispatch(name.toLowerCase(), { source: this, value });
            }
        }
    }
    static _checkDisablePreferences;
}
/*#static*/  {
    AppOptions._checkDisablePreferences = () => {
        if (AppOptions.disablePreferences) {
            // Give custom implementations of the default viewer a simpler way to
            // opt-out of having the `Preferences` override existing `AppOptions`.
            return true;
        }
        for (const [name] of userOptions) {
            // Ignore any compatibility-values in the user-options.
            if (compatParams.has(name)) {
                continue;
            }
            console.warn("The Preferences may override manually set AppOptions; " +
                'please use the "disablePreferences"-option to prevent that.');
            break;
        }
        return false;
    };
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=app_options.js.map