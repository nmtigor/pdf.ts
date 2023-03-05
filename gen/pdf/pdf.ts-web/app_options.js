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
import { CHROME, DENO, GENERIC, LIB, PRODUCTION, TESTING, } from "../../global.js";
import { Locale } from "../../lib/Locale.js";
import { AnnotationEditorType, AnnotationMode, VerbosityLevel, } from "../pdf.ts-src/pdf.js";
import { LinkTarget } from "./pdf_link_service.js";
import { CursorTool, RendererType, ScrollMode, SidebarView, SpreadMode, TextLayerMode, } from "./ui_utils.js";
/*80--------------------------------------------------------------------------*/
export var OptionKind;
(function (OptionKind) {
    OptionKind[OptionKind["VIEWER"] = 2] = "VIEWER";
    OptionKind[OptionKind["API"] = 4] = "API";
    OptionKind[OptionKind["WORKER"] = 8] = "WORKER";
    OptionKind[OptionKind["PREFERENCE"] = 128] = "PREFERENCE";
})(OptionKind || (OptionKind = {}));
export var ViewerCssTheme;
(function (ViewerCssTheme) {
    ViewerCssTheme[ViewerCssTheme["AUTOMATIC"] = 0] = "AUTOMATIC";
    ViewerCssTheme[ViewerCssTheme["LIGHT"] = 1] = "LIGHT";
    ViewerCssTheme[ViewerCssTheme["DARK"] = 2] = "DARK";
})(ViewerCssTheme || (ViewerCssTheme = {}));
export var ViewOnLoad;
(function (ViewOnLoad) {
    ViewOnLoad[ViewOnLoad["UNKNOWN"] = -1] = "UNKNOWN";
    ViewOnLoad[ViewOnLoad["PREVIOUS"] = 0] = "PREVIOUS";
    ViewOnLoad[ViewOnLoad["INITIAL"] = 1] = "INITIAL";
})(ViewOnLoad || (ViewOnLoad = {}));
/*49-------------------------------------------*/
export const D_base = /*#static*/ "/pdf.ts";
const userOptions = Object.create(null);
export const compatibilityParams = Object.create(null);
/*#static*/  {
    /*#static*/ 
    const userAgent = navigator.userAgent || "";
    const platform = navigator.platform || "";
    const maxTouchPoints = navigator.maxTouchPoints || 1;
    const isAndroid = /Android/.test(userAgent);
    const isIOS = /\b(iPad|iPhone|iPod)(?=;)/.test(userAgent) ||
        (platform === "MacIntel" && maxTouchPoints > 1);
    // Limit canvas size to 5 mega-pixels on mobile.
    // Support: Android, iOS
    ( /* checkCanvasSizeLimitation */() => {
        if (isIOS || isAndroid) {
            compatibilityParams.maxCanvasPixels = 5242880;
        }
    })();
}
/**
 * NOTE: These options are used to generate the `default_preferences.json` file,
 *       see `OptionKind.PREFERENCE`, hence the values below must use only
 *       primitive types and cannot rely on any imported types.
 */
const defaultOptions = {
    annotationEditorMode: {
        value: AnnotationEditorType.NONE,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    annotationMode: {
        value: AnnotationMode.ENABLE_FORMS,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    cursorToolOnLoad: {
        value: CursorTool.SELECT,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    defaultUrl: {
        value: undefined,
        kind: 0,
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
    disablePreferences: {
        value: false,
        kind: 0,
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
    externalLinkRel: {
        value: "noopener noreferrer nofollow",
        kind: OptionKind.VIEWER,
    },
    externalLinkTarget: {
        value: LinkTarget.NONE,
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
        value: `${D_base}/res/pdf/pdf.ts-web/images/`,
        // value: "./images/",
        kind: OptionKind.VIEWER,
    },
    locale: {
        value: undefined,
        kind: 0,
    },
    maxCanvasPixels: {
        value: 16777216,
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
        value: /*#static*/ true,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    printResolution: {
        value: 150,
        kind: OptionKind.VIEWER,
    },
    renderer: {
        value: undefined,
        kind: 0,
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
    useOnlyCssZoom: {
        value: false,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    },
    viewerCssTheme: {
        value: /*#static*/ ViewerCssTheme.AUTOMATIC,
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
        value: /*#static*/ `${D_base}/res/pdf/pdf.ts-external/bcmaps/`,
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
        kind: 0,
    },
    docBaseUrl: {
        value: undefined,
        kind: OptionKind.API,
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
        value: /*#static*/ `${D_base}/res/pdf/pdf.ts-external/standard_fonts/`,
        kind: OptionKind.API,
    },
    verbosity: {
        // value: VerbosityLevel.INFOS,
        value: VerbosityLevel.WARNINGS,
        kind: OptionKind.API,
    },
    workerPort: {
        value: undefined,
        kind: OptionKind.WORKER,
    },
    workerSrc: {
        value: /*#static*/ `${D_base}/gen/pdf/pdf.ts-src/pdf.worker.js`,
        kind: OptionKind.WORKER,
    },
    sandboxBundleSrc: {
        value: undefined,
        kind: 0,
    },
};
/*#static*/  {
    defaultOptions.defaultUrl = {
        // value: `${D_base}/res/pdf/test/pdfs/pattern_text_embedded_font.pdf`,
        // value: `${D_base}/res/pdf/test/pdfs/basicapi.pdf`,
        value: `${D_base}/res/pdf/test/pdfs/tracemonkey.pdf`,
        // value: `${D_base}/res/pdf/test/pdfs-1/math.pdf`,
        // value: "compressed.tracemonkey-pldi-09.pdf",
        kind: OptionKind.VIEWER,
    };
    defaultOptions.disablePreferences = {
        value: TESTING ? true : false,
        kind: OptionKind.VIEWER,
    };
    defaultOptions.locale = {
        value: navigator.language || Locale.en_US,
        kind: OptionKind.VIEWER,
    };
    defaultOptions.renderer = {
        value: RendererType.CANVAS,
        kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    };
    defaultOptions.sandboxBundleSrc = {
        value: /*#static*/ `${D_base}/gen/pdf/pdf.ts-src/pdf.sandbox.js`,
        kind: OptionKind.VIEWER,
    };
}
export class AppOptions {
    // static get<ON extends OptionName>(name: ON): _OptionType1<ON> {
    //   const userOption = userOptions[name];
    //   if (userOption !== undefined) {
    //     return userOption;
    //   }
    //   const defaultOption = defaultOptions[name];
    //   if (defaultOption !== undefined) {
    //     return compatibilityParams[name] ?? defaultOption.value;
    //   }
    //   return undefined;
    // }
    static #get(name) {
        const userOption = userOptions[name];
        if (userOption !== undefined) {
            return userOption;
        }
        const defaultOption = defaultOptions[name];
        if (defaultOption !== undefined) {
            return compatibilityParams[name] ?? defaultOption.value;
        }
        return undefined;
    }
    static get annotationEditorMode() {
        return this.#get("annotationEditorMode");
    }
    static get annotationMode() {
        return this.#get("annotationMode");
    }
    static get cursorToolOnLoad() {
        return this.#get("cursorToolOnLoad");
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
    static get disablePreferences() {
        return this.#get("disablePreferences");
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
    static get externalLinkRel() {
        return this.#get("externalLinkRel");
    }
    static get externalLinkTarget() {
        return this.#get("externalLinkTarget");
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
    static get locale() {
        return this.#get("locale");
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
    static get renderer() {
        return this.#get("renderer");
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
    static get useOnlyCssZoom() {
        return this.#get("useOnlyCssZoom");
    }
    static get viewerCssTheme() {
        return this.#get("viewerCssTheme");
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
    static getAll(kind) {
        const options = Object.create(null);
        for (const name in defaultOptions) {
            const defaultOption = defaultOptions[name];
            if (kind) {
                if ((kind & defaultOption.kind) === 0) {
                    continue;
                }
                if (kind === OptionKind.PREFERENCE) {
                    const value = defaultOption.value;
                    const valueType = typeof value;
                    if (valueType === "boolean" ||
                        valueType === "string" ||
                        (valueType === "number" && Number.isInteger(value))) {
                        options[name] = value;
                        continue;
                    }
                    throw new Error(`Invalid type for preference: ${name}`);
                }
            }
            const userOption = userOptions[name];
            options[name] = userOption !== undefined
                ? userOption
                : compatibilityParams[name] ?? defaultOption.value;
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
    static _hasUserOptions;
}
/*#static*/  {
    AppOptions._hasUserOptions = () => {
        return Object.keys(userOptions).length > 0;
    };
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=app_options.js.map