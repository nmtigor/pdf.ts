/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
/* Copyright 2018 Mozilla Foundation
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
import { Locale } from "../../lib/Locale.js";
import { RendererType, ScrollMode, SpreadMode } from "./ui_utils.js";
import { VerbosityLevel } from "../pdf.ts-src/shared/util.js";
/*81---------------------------------------------------------------------------*/
export const compatibilityParams = Object.create(null);
const userAgent = navigator.userAgent || "";
const platform = navigator.platform || "";
const maxTouchPoints = navigator.maxTouchPoints || 1;
const isAndroid = /Android/.test(userAgent);
const isIOS = /\b(iPad|iPhone|iPod)(?=;)/.test(userAgent) ||
    (platform === "MacIntel" && maxTouchPoints > 1);
// Limit canvas size to 5 mega-pixels on mobile.
// Support: Android, iOS
(function checkCanvasSizeLimitation() {
    if (isIOS || isAndroid) {
        compatibilityParams.maxCanvasPixels = 5242880;
    }
})();
export var OptionKind;
(function (OptionKind) {
    OptionKind[OptionKind["VIEWER"] = 2] = "VIEWER";
    OptionKind[OptionKind["API"] = 4] = "API";
    OptionKind[OptionKind["WORKER"] = 8] = "WORKER";
    OptionKind[OptionKind["PREFERENCE"] = 128] = "PREFERENCE";
})(OptionKind || (OptionKind = {}));
export var ViewOnLoad;
(function (ViewOnLoad) {
    ViewOnLoad[ViewOnLoad["UNKNOWN"] = -1] = "UNKNOWN";
    ViewOnLoad[ViewOnLoad["PREVIOUS"] = 0] = "PREVIOUS";
    ViewOnLoad[ViewOnLoad["INITIAL"] = 1] = "INITIAL";
})(ViewOnLoad || (ViewOnLoad = {}));
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
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    cursorToolOnLoad: {
        /** @type {number} */
        value: 0,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    defaultUrl: {
        /** @type {string} */
        // value: `${D_base}/res/pdf/test/pdfs/pattern_text_embedded_font.pdf`,
        // value: `${D_base}/res/pdf/test/pdfs/basicapi.pdf`,
        value: `${D_base}/res/pdf/test/pdfs/tracemonkey.pdf`,
        // value: `${D_base}/res/pdf/test/pdfs-1/math.pdf`,
        // value: "compressed.tracemonkey-pldi-09.pdf",
        kind: OptionKind.VIEWER,
    },
    defaultZoomValue: {
        /** @type {string} */
        value: "",
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    disableHistory: {
        /** @type {boolean} */
        value: false,
        kind: OptionKind.VIEWER,
    },
    disablePageLabels: {
        /** @type {boolean} */
        value: false,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    disablePreferences: {
        /** @type {boolean} */
        value: false,
        kind: 0,
    },
    enablePermissions: {
        /** @type {boolean} */
        value: false,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    enablePrintAutoRotate: {
        /** @type {boolean} */
        value: true,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    enableScripting: {
        /** @type {boolean} */
        value: false,
        // value: /* #if CHROME */false/* #else */true/* #endif */,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    externalLinkRel: {
        /** @type {string} */
        value: "noopener noreferrer nofollow",
        kind: OptionKind.VIEWER,
    },
    externalLinkTarget: {
        /** @type {number} */
        value: 0,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    historyUpdateUrl: {
        /** @type {boolean} */
        value: false,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    ignoreDestinationZoom: {
        /** @type {boolean} */
        value: false,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    imageResourcesPath: {
        /** @type {string} */
        value: `${D_base}/res/pdf/pdf.ts-web/images/`,
        // value: "./images/",
        kind: OptionKind.VIEWER,
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
        kind: OptionKind.VIEWER,
    },
    pdfBugEnabled: {
        /** @type {boolean} */
        value: true,
        // typeof PDFJSDev === "undefined" || !PDFJSDev.test("PRODUCTION"),
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    printResolution: {
        /** @type {number} */
        value: 150,
        kind: OptionKind.VIEWER,
    },
    renderer: {
        /** @type {RendererType} */
        value: RendererType.CANVAS,
        kind: OptionKind.VIEWER,
    },
    sidebarViewOnLoad: {
        /** @type {number} */
        value: -1,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    scrollModeOnLoad: {
        /** @type {ScrollMode} */
        value: ScrollMode.UNKNOWN,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    spreadModeOnLoad: {
        /** @type {SpreadMode} */
        value: SpreadMode.UNKNOWN,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    textLayerMode: {
        /** @type {number} */
        value: 1,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    useOnlyCssZoom: {
        /** @type {boolean} */
        value: false,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    viewerCssTheme: {
        /** @type {number} */
        value: 0,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    viewOnLoad: {
        /** @type {ViewOnLoad} */
        value: ViewOnLoad.PREVIOUS,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    cMapPacked: {
        /** @type {boolean} */
        value: true,
        kind: OptionKind.API,
    },
    cMapUrl: {
        /** @type {string} */
        value: `${D_base}/res/pdf/pdf.ts-external/bcmaps/`
        // "../external/bcmaps/"
        ,
        // typeof PDFJSDev === "undefined" || !PDFJSDev.test("PRODUCTION")
        //   ? "../external/bcmaps/"
        //   : "../web/cmaps/",
        kind: OptionKind.API,
    },
    disableAutoFetch: {
        /** @type {boolean} */
        value: false,
        kind: OptionKind.API + OptionKind.PREFERENCE,
    },
    disableFontFace: {
        /** @type {boolean} */
        value: false,
        kind: OptionKind.API + OptionKind.PREFERENCE,
    },
    disableRange: {
        /** @type {boolean} */
        value: false,
        kind: OptionKind.API + OptionKind.PREFERENCE,
    },
    disableStream: {
        /** @type {boolean} */
        value: false,
        kind: OptionKind.API + OptionKind.PREFERENCE,
    },
    disableTelemetry: {
        /** @type {boolean} */
        value: false,
        kind: 0,
    },
    docBaseUrl: {
        /** @type {string} */
        value: "",
        kind: OptionKind.API,
    },
    enableXfa: {
        /** @type {boolean} */
        value: true,
        kind: OptionKind.API + OptionKind.PREFERENCE,
    },
    fontExtraProperties: {
        /** @type {boolean} */
        value: false,
        kind: OptionKind.API,
    },
    isEvalSupported: {
        /** @type {boolean} */
        value: true,
        kind: OptionKind.API,
    },
    maxImageSize: {
        /** @type {number} */
        value: -1,
        kind: OptionKind.API,
    },
    pdfBug: {
        /** @type {boolean} */
        value: false,
        kind: OptionKind.API,
    },
    standardFontDataUrl: {
        /** @type {string} */
        value: `${D_base}/res/pdf/pdf.ts-external/standard_fonts/`
        // "../external/standard_fonts/"
        ,
        // typeof PDFJSDev === "undefined" || !PDFJSDev.test("PRODUCTION")
        //   ? "../external/standard_fonts/"
        //   : "../web/standard_fonts/",
        kind: OptionKind.API,
    },
    verbosity: {
        /** @type {VerbosityLevel} */
        // value: VerbosityLevel.INFOS,
        value: VerbosityLevel.WARNINGS,
        kind: OptionKind.API,
    },
    workerPort: {
        /** @type {Object} */
        value: undefined,
        kind: OptionKind.WORKER,
    },
    workerSrc: {
        /** @type {string} */
        value: `${D_base}/gen/pdf/pdf.ts-src/pdf.worker.js`
        // "../src/worker_loader.js"
        ,
        // typeof PDFJSDev === "undefined" || !PDFJSDev.test("PRODUCTION")
        //   ? "../src/worker_loader.js"
        //   : "../build/pdf.worker.js",
        kind: OptionKind.WORKER,
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
    kind: OptionKind.VIEWER,
};
defaultOptions.locale = {
    /** @type {string} */
    value: navigator.language || Locale.en_US,
    kind: OptionKind.VIEWER,
};
defaultOptions.sandboxBundleSrc = {
    /** @type {string} */
    value: //kkkk
    "../build/dev-sandbox/pdf.sandbox.js",
    // typeof PDFJSDev === "undefined" || !PDFJSDev.test("PRODUCTION")
    //   ? "../build/dev-sandbox/pdf.sandbox.js"
    //   : "../build/pdf.sandbox.js",
    kind: OptionKind.VIEWER,
};
defaultOptions.renderer.kind += OptionKind.PREFERENCE;
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
                if (kind === OptionKind.PREFERENCE) {
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