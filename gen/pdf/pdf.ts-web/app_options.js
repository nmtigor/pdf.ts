/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
 */
import { ScrollMode, SpreadMode } from "./ui_utils.js";
/*81---------------------------------------------------------------------------*/
export const compatibilityParams = Object.create(null);
const userAgent = (typeof navigator !== "undefined" && navigator.userAgent) || "";
const platform = (typeof navigator !== "undefined" && navigator.platform) || "";
const maxTouchPoints = (typeof navigator !== "undefined" && navigator.maxTouchPoints) || 1;
const isAndroid = /Android/.test(userAgent);
const isIOS = /\b(iPad|iPhone|iPod)(?=;)/.test(userAgent) ||
    (platform === "MacIntel" && maxTouchPoints > 1);
const isIOSChrome = /CriOS/.test(userAgent);
// Disables URL.createObjectURL() usage in some environments.
// Support: Chrome on iOS
(function checkOnBlobSupport() {
    // Sometimes Chrome on iOS loses data created with createObjectURL(),
    // see issue 8081.
    if (isIOSChrome) {
        compatibilityParams.disableCreateObjectURL = true;
    }
})();
// Limit canvas size to 5 mega-pixels on mobile.
// Support: Android, iOS
(function checkCanvasSizeLimitation() {
    if (isIOS || isAndroid) {
        compatibilityParams.maxCanvasPixels = 5242880;
    }
})();
const D_base = "/pdf.ts";
/**
 * NOTE: These options are used to generate the `default_preferences.json` file,
 *       see `OptionKind.PREFERENCE`, hence the values below must use only
 *       primitive types and cannot rely on any imported types.
 */
const defaultOptions = {
    annotationMode: {
        /** @type {number} */
        value: 2,
        kind: 2 /* VIEWER */ + 128 /* PREFERENCE */,
    },
    cursorToolOnLoad: {
        /** @type {number} */
        value: 0,
        kind: 2 /* VIEWER */ + 128 /* PREFERENCE */,
    },
    defaultUrl: {
        /** @type {string} */
        // value: `${D_base}/res/pdf/test/pdfs/pattern_text_embedded_font.pdf`,
        // value: `${D_base}/res/pdf/test/pdfs/basicapi.pdf`,
        value: `${D_base}/res/pdf/test/pdfs/tracemonkey.pdf`,
        // value: "compressed.tracemonkey-pldi-09.pdf",
        kind: 2 /* VIEWER */,
    },
    defaultZoomValue: {
        /** @type {string} */
        value: "",
        kind: 2 /* VIEWER */ + 128 /* PREFERENCE */,
    },
    disableHistory: {
        /** @type {boolean} */
        value: false,
        kind: 2 /* VIEWER */,
    },
    disablePageLabels: {
        /** @type {boolean} */
        value: false,
        kind: 2 /* VIEWER */ + 128 /* PREFERENCE */,
    },
    disablePreferences: {
        /** @type {boolean} */
        value: false,
        kind: 0,
    },
    enablePermissions: {
        /** @type {boolean} */
        value: false,
        kind: 2 /* VIEWER */ + 128 /* PREFERENCE */,
    },
    enablePrintAutoRotate: {
        /** @type {boolean} */
        value: true,
        kind: 2 /* VIEWER */ + 128 /* PREFERENCE */,
    },
    enableScripting: {
        /** @type {boolean} */
        value: false,
        // value: /* #if CHROME */false/* #else */true/* #endif */,
        kind: 2 /* VIEWER */ + 128 /* PREFERENCE */,
    },
    externalLinkRel: {
        /** @type {string} */
        value: "noopener noreferrer nofollow",
        kind: 2 /* VIEWER */,
    },
    externalLinkTarget: {
        /** @type {number} */
        value: 0,
        kind: 2 /* VIEWER */ + 128 /* PREFERENCE */,
    },
    historyUpdateUrl: {
        /** @type {boolean} */
        value: false,
        kind: 2 /* VIEWER */ + 128 /* PREFERENCE */,
    },
    ignoreDestinationZoom: {
        /** @type {boolean} */
        value: false,
        kind: 2 /* VIEWER */ + 128 /* PREFERENCE */,
    },
    imageResourcesPath: {
        /** @type {string} */
        value: `${D_base}/res/pdf/pdf.ts-web/images/`,
        // value: "./images/",
        kind: 2 /* VIEWER */,
    },
    locale: {
        /** @type {string} */
        value: "",
        kind: 0,
    },
    maxCanvasPixels: {
        /** @type {number} */
        value: 16777216,
        compatibility: compatibilityParams.maxCanvasPixels,
        kind: 2 /* VIEWER */,
    },
    pdfBugEnabled: {
        /** @type {boolean} */
        value: true,
        // typeof PDFJSDev === "undefined" || !PDFJSDev.test("PRODUCTION"),
        kind: 2 /* VIEWER */ + 128 /* PREFERENCE */,
    },
    printResolution: {
        /** @type {number} */
        value: 150,
        kind: 2 /* VIEWER */,
    },
    renderer: {
        /** @type {RendererType} */
        value: "canvas" /* CANVAS */,
        kind: 2 /* VIEWER */,
    },
    sidebarViewOnLoad: {
        /** @type {number} */
        value: -1,
        kind: 2 /* VIEWER */ + 128 /* PREFERENCE */,
    },
    scrollModeOnLoad: {
        /** @type {ScrollMode} */
        value: ScrollMode.UNKNOWN,
        kind: 2 /* VIEWER */ + 128 /* PREFERENCE */,
    },
    spreadModeOnLoad: {
        /** @type {SpreadMode} */
        value: SpreadMode.UNKNOWN,
        kind: 2 /* VIEWER */ + 128 /* PREFERENCE */,
    },
    textLayerMode: {
        /** @type {number} */
        value: 1,
        kind: 2 /* VIEWER */ + 128 /* PREFERENCE */,
    },
    useOnlyCssZoom: {
        /** @type {boolean} */
        value: false,
        kind: 2 /* VIEWER */ + 128 /* PREFERENCE */,
    },
    viewerCssTheme: {
        /** @type {number} */
        value: 0,
        kind: 2 /* VIEWER */ + 128 /* PREFERENCE */,
    },
    viewOnLoad: {
        /** @type {boolean} */
        value: 0,
        kind: 2 /* VIEWER */ + 128 /* PREFERENCE */,
    },
    cMapPacked: {
        /** @type {boolean} */
        value: true,
        kind: 4 /* API */,
    },
    cMapUrl: {
        /** @type {string} */
        value: `${D_base}/res/pdf/pdf.ts-external/bcmaps/`
        // "../external/bcmaps/"
        ,
        // typeof PDFJSDev === "undefined" || !PDFJSDev.test("PRODUCTION")
        //   ? "../external/bcmaps/"
        //   : "../web/cmaps/",
        kind: 4 /* API */,
    },
    disableAutoFetch: {
        /** @type {boolean} */
        value: false,
        kind: 4 /* API */ + 128 /* PREFERENCE */,
    },
    disableFontFace: {
        /** @type {boolean} */
        value: false,
        kind: 4 /* API */ + 128 /* PREFERENCE */,
    },
    disableRange: {
        /** @type {boolean} */
        value: false,
        kind: 4 /* API */ + 128 /* PREFERENCE */,
    },
    disableStream: {
        /** @type {boolean} */
        value: false,
        kind: 4 /* API */ + 128 /* PREFERENCE */,
    },
    disableTelemetry: {
        /** @type {boolean} */
        value: false,
        kind: 0,
    },
    docBaseUrl: {
        /** @type {string} */
        value: "",
        kind: 4 /* API */,
    },
    enableXfa: {
        /** @type {boolean} */
        value: true,
        kind: 4 /* API */ + 128 /* PREFERENCE */,
    },
    fontExtraProperties: {
        /** @type {boolean} */
        value: false,
        kind: 4 /* API */,
    },
    isEvalSupported: {
        /** @type {boolean} */
        value: true,
        kind: 4 /* API */,
    },
    maxImageSize: {
        /** @type {number} */
        value: -1,
        kind: 4 /* API */,
    },
    pdfBug: {
        /** @type {boolean} */
        value: false,
        kind: 4 /* API */,
    },
    standardFontDataUrl: {
        /** @type {string} */
        value: `${D_base}/res/pdf/pdf.ts-external/standard_fonts/`
        // "../external/standard_fonts/"
        ,
        // typeof PDFJSDev === "undefined" || !PDFJSDev.test("PRODUCTION")
        //   ? "../external/standard_fonts/"
        //   : "../web/standard_fonts/",
        kind: 4 /* API */,
    },
    verbosity: {
        /** @type {number} */
        value: 1,
        kind: 4 /* API */,
    },
    workerPort: {
        /** @type {Object} */
        value: undefined,
        kind: 8 /* WORKER */,
    },
    workerSrc: {
        /** @type {string} */
        value: `${D_base}/gen/pdf/pdf.ts-src/pdf.worker.js`
        // "../src/worker_loader.js"
        ,
        // typeof PDFJSDev === "undefined" || !PDFJSDev.test("PRODUCTION")
        //   ? "../src/worker_loader.js"
        //   : "../build/pdf.worker.js",
        kind: 8 /* WORKER */,
    },
    sandboxBundleSrc: {
        /** @type {string} */
        value: '',
        kind: 0,
    },
};
defaultOptions.disablePreferences = {
    /** @type {boolean} */
    value: true,
    // typeof PDFJSDev !== "undefined" && PDFJSDev.test("TESTING"),
    kind: 2 /* VIEWER */,
};
defaultOptions.locale = {
    /** @type {string} */
    value: typeof navigator !== "undefined" ? navigator.language : "en-US" /* en_US */,
    kind: 2 /* VIEWER */,
};
defaultOptions.sandboxBundleSrc = {
    /** @type {string} */
    value: //kkkk
    "../build/dev-sandbox/pdf.sandbox.js",
    // typeof PDFJSDev === "undefined" || !PDFJSDev.test("PRODUCTION")
    //   ? "../build/dev-sandbox/pdf.sandbox.js"
    //   : "../build/pdf.sandbox.js",
    kind: 2 /* VIEWER */,
};
defaultOptions.renderer.kind += 128 /* PREFERENCE */;
const userOptions = Object.create(null);
export class AppOptions {
    static get(name) {
        const userOption = userOptions[name];
        if (userOption !== undefined) {
            return userOption;
        }
        const defaultOption = defaultOptions[name];
        if (defaultOption !== undefined) {
            return defaultOption.compatibility ?? defaultOption.value;
        }
        return undefined;
    }
    static getAll(kind) {
        const options = Object.create(null);
        for (const name in defaultOptions) {
            const defaultOption = defaultOptions[name];
            if (kind) {
                if ((kind & defaultOption.kind) === 0)
                    continue;
                if (kind === 128 /* PREFERENCE */) {
                    const value = defaultOption.value;
                    const valueType = typeof value;
                    if (valueType === "boolean"
                        || valueType === "string"
                        || (valueType === "number" && Number.isInteger(value))) {
                        options[name] = value;
                        continue;
                    }
                    throw new Error(`Invalid type for preference: ${name}`);
                }
            }
            const userOption = userOptions[name];
            options[name] =
                userOption !== undefined
                    ? userOption
                    : defaultOption.compatibility ?? defaultOption.value;
        }
        return options;
    }
    static set(name, value) {
        userOptions[name] = value;
    }
    static setAll(options) {
        for (const name in options) {
            userOptions[name] = options[name];
        }
    }
    static remove(name) {
        delete userOptions[name];
    }
    /**
     * @ignore
     */
    static _hasUserOptions() {
        return Object.keys(userOptions).length > 0;
    }
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=app_options.js.map