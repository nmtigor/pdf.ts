/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/app_options
 * @license Apache-2.0
 ******************************************************************************/

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

import { Locale } from "@fe-lib/Locale.ts";
import { D_rp_web, D_rpe_cmap, D_rpe_sfont } from "@fe-src/alias.ts";
import {
  CHROME,
  GENERIC,
  LIB,
  MOZCENTRAL,
  PDFJSDev,
  TESTING,
} from "@fe-src/global.ts";
import { AD_gh } from "../alias.ts";
import {
  AnnotationEditorType,
  AnnotationMode,
  VerbosityLevel,
} from "../pdf.ts-src/pdf.ts";
import { LinkTarget } from "./pdf_link_service.ts";
import {
  CursorTool,
  ScrollMode,
  SidebarView,
  SpreadMode,
  TextLayerMode,
} from "./ui_utils.ts";
/*80--------------------------------------------------------------------------*/

export enum OptionKind {
  BROWSER = 0x01,
  VIEWER = 0x02,
  API = 0x04,
  WORKER = 0x08,
  PREFERENCE = 0x80,
}

export const enum ViewOnLoad {
  UNKNOWN = -1,
  PREVIOUS = 0, // Default value.
  INITIAL = 1,
}
/*49-------------------------------------------*/

type _DefaultOptions = typeof defaultOptions;
export type OptionName = keyof _DefaultOptions;
// type _OptionType1<ON extends OptionName> = _DefaultOptions[ON]["value"];
export type OptionType = number | string | boolean | Worker;

export type UserOptions = {
  [ON in OptionName]?: OptionType | undefined;
};
const userOptions: UserOptions = Object.create(null);

/*#static*/ if (PDFJSDev || GENERIC) {
  // eslint-disable-next-line no-var
  var compatibilityParams: UserOptions = Object.create(null);
  /*#static*/ if (LIB) {
    if (typeof navigator === "undefined") {
      globalThis.navigator = Object.create(null);
    }
  }
  const userAgent = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const maxTouchPoints = navigator.maxTouchPoints || 1;

  const isAndroid = /Android/.test(userAgent);
  const isIOS = /\b(iPad|iPhone|iPod)(?=;)/.test(userAgent) ||
    (platform === "MacIntel" && maxTouchPoints > 1);

  // Limit canvas size to 5 mega-pixels on mobile.
  // Support: Android, iOS
  (/* checkCanvasSizeLimitation */ () => {
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
  canvasMaxAreaInBytes: {
    value: -1,
    kind: OptionKind.BROWSER + OptionKind.API,
  },
  isInAutomation: {
    value: false,
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

  annotationEditorMode: {
    value: AnnotationEditorType.NONE,
    kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
  },
  annotationMode: {
    value: AnnotationMode.ENABLE_FORMS,
    kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
  },
  viewerCssTheme: {
    value: undefined as number | undefined,
    kind: 0 as OptionKind,
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
    value: undefined as string | undefined,
    kind: 0 as OptionKind,
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
    kind: 0 as OptionKind,
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
  enableML: {
    value: false,
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
    value: /*#static*/ PDFJSDev || !CHROME ? true : false,
    kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
  },
  enableStampEditor: {
    // We'll probably want to make some experiments before enabling this
    // in Firefox release, but it has to be temporary.
    // TODO: remove it when unnecessary.
    value: true,
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
    value: /*#static*/ MOZCENTRAL
      // ? "resource://pdf.js/web/images/"
      ? `${AD_gh}/${D_rp_web}/images/`
      : `${AD_gh}/${D_rp_web}/images/`,
    kind: OptionKind.VIEWER,
  },
  locale: {
    value: undefined as Locale | undefined,
    kind: 0 as OptionKind,
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
      /*#static*/ PDFJSDev
        // ? "../external/bcmaps/"
        ? `${AD_gh}/${D_rpe_cmap}/`
        : /*#static*/ MOZCENTRAL
        // ? "resource://pdf.js/web/cmaps/"
        ? `${AD_gh}/${D_rpe_cmap}/`
        : `${AD_gh}/${D_rpe_cmap}/`,
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
    kind: 0 as OptionKind,
  },
  docBaseUrl: {
    value: undefined as string | undefined,
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
      /*#static*/ PDFJSDev
        // ? "../external/standard_fonts/"
        ? `${AD_gh}/${D_rpe_sfont}/`
        : /*#static*/ MOZCENTRAL
        // ? "resource://pdf.js/web/standard_fonts/"
        ? `${AD_gh}/${D_rpe_sfont}/`
        : `${AD_gh}/${D_rpe_sfont}/`,
    kind: OptionKind.API,
  },
  verbosity: {
    value: VerbosityLevel.INFOS,
    // value: VerbosityLevel.WARNINGS,
    kind: OptionKind.API,
  },

  workerPort: {
    value: undefined as Worker | undefined,
    kind: OptionKind.WORKER,
  },
  workerSrc: {
    value:
      // eslint-disable-next-line no-nested-ternary
      /*#static*/ PDFJSDev
        ? `${AD_gh}/gen/pdf/pdf.ts-src/pdf.worker.js`
        : /*#static*/ MOZCENTRAL
        // ? "resource://pdf.js/build/pdf.worker.mjs"
        ? `${AD_gh}/gen/pdf/pdf.ts-src/pdf.worker.js`
        // ? "../src/worker_loader.mjs"
        : `${AD_gh}/gen/pdf/pdf.ts-src/pdf.worker.js`,
    kind: OptionKind.WORKER,
  },
  sandboxBundleSrc: {
    value: undefined as string | undefined,
    kind: 0 as OptionKind,
  },
};
/*#static*/ if (PDFJSDev || !MOZCENTRAL) {
  defaultOptions.defaultUrl = {
    value: /*#static*/ CHROME
      ? ""
      // : "compressed.tracemonkey-pldi-09.pdf",
      : `${AD_gh}/${D_rp_web}/compressed.tracemonkey-pldi-09.pdf`,
    kind: OptionKind.VIEWER,
  };
  defaultOptions.sandboxBundleSrc = {
    value: /*#static*/ PDFJSDev
      // ? "../build/dev-sandbox/pdf.sandbox.mjs"
      ? `${AD_gh}/gen/pdf/pdf.ts-src/pdf.sandbox.js`
      // : "../build/pdf.sandbox.mjs",
      : `${AD_gh}/gen/pdf/pdf.ts-src/pdf.sandbox.js`,
    kind: OptionKind.VIEWER,
  };
  defaultOptions.viewerCssTheme = {
    /** @type {number} */
    value: /*#static*/ CHROME ? 2 : 0,
    kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
  };
}
/*#static*/ if (PDFJSDev || GENERIC) {
  defaultOptions.disablePreferences = {
    value: TESTING ? true : false,
    kind: OptionKind.VIEWER,
  };
  defaultOptions.locale = {
    value: navigator.language as Locale || Locale.en_US,
    kind: OptionKind.VIEWER,
  };
} else {
  /*#static*/ if (CHROME) {
    defaultOptions.disableTelemetry = {
      value: false,
      kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    };
  }
}

/*#static*/ if (PDFJSDev || GENERIC) {
  // Apply any compatibility-values to the user-options,
  // see also `AppOptions.remove` below.
  for (const name in compatibilityParams!) {
    userOptions[name as OptionName] = compatibilityParams[name as OptionName];
  }
}

/*#static*/ if (PDFJSDev || TESTING || LIB) {
  // Ensure that the `defaultOptions` are correctly specified.
  for (const name in defaultOptions) {
    const { value, kind } = defaultOptions[name as OptionName];

    if (kind & OptionKind.PREFERENCE) {
      if (kind === OptionKind.PREFERENCE) {
        throw new Error(`Cannot use only "PREFERENCE" kind: ${name}`);
      }
      if (kind & OptionKind.BROWSER) {
        throw new Error(`Cannot mix "PREFERENCE" and "BROWSER" kind: ${name}`);
      }
      if (
        typeof compatibilityParams! === "object" &&
        compatibilityParams[name as OptionName] !== undefined
      ) {
        throw new Error(
          `Should not have compatibility-value for "PREFERENCE" kind: ${name}`,
        );
      }
      // Only "simple" preference-values are allowed.
      if (
        typeof value !== "boolean" &&
        typeof value !== "string" &&
        !Number.isInteger(value)
      ) {
        throw new Error(`Invalid value for "PREFERENCE" kind: ${name}`);
      }
    }
  }
}

export abstract class AppOptions {
  // static get(name: OptionName) {
  //   return userOptions[name] ?? defaultOptions[name]?.value ?? undefined;
  // }

  static #get(name: OptionName): OptionType | undefined {
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

  static get canvasMaxAreaInBytes() {
    return this.#get("canvasMaxAreaInBytes") as number;
  }
  static get isInAutomation() {
    return this.#get("isInAutomation") as boolean;
  }
  static get supportsCaretBrowsingMode() {
    return this.#get("supportsCaretBrowsingMode") as boolean;
  }
  static get supportsDocumentFonts() {
    return this.#get("supportsDocumentFonts") as boolean;
  }
  static get supportsIntegratedFind() {
    return this.#get("supportsIntegratedFind") as boolean;
  }
  static get supportsMouseWheelZoomCtrlKey() {
    return this.#get("supportsMouseWheelZoomCtrlKey") as boolean;
  }
  static get supportsMouseWheelZoomMetaKey() {
    return this.#get("supportsMouseWheelZoomMetaKey") as boolean;
  }
  static get supportsPinchToZoom() {
    return this.#get("supportsPinchToZoom") as boolean;
  }

  static get annotationEditorMode() {
    return this.#get("annotationEditorMode") as AnnotationEditorType;
  }
  static get annotationMode() {
    return this.#get("annotationMode") as AnnotationMode;
  }
  static get viewerCssTheme() {
    return this.#get("annotationMode") as number | undefined;
  }
  static get cursorToolOnLoad() {
    return this.#get("cursorToolOnLoad") as CursorTool;
  }
  static get debuggerSrc() {
    return this.#get("debuggerSrc") as string;
  }
  static get defaultUrl() {
    return this.#get("defaultUrl") as string | undefined;
  }
  static get defaultZoomDelay() {
    return this.#get("defaultZoomDelay") as number;
  }
  static get defaultZoomValue() {
    return this.#get("defaultZoomValue") as string;
  }
  static get disableHistory() {
    return this.#get("disableHistory") as boolean;
  }
  static get disablePageLabels() {
    return this.#get("disablePageLabels") as boolean;
  }
  static get disablePreferences() {
    return this.#get("disablePreferences") as boolean;
  }
  static get enableHighlightEditor() {
    return this.#get("enableHighlightEditor") as boolean;
  }
  static get enableHighlightFloatingButton() {
    return this.#get("enableHighlightFloatingButton") as boolean;
  }
  static get enableML() {
    return this.#get("enableML") as boolean;
  }
  static get enablePermissions() {
    return this.#get("enablePermissions") as boolean;
  }
  static get enablePrintAutoRotate() {
    return this.#get("enablePrintAutoRotate") as boolean;
  }
  static get enableScripting() {
    return this.#get("enableScripting") as boolean;
  }
  static get enableStampEditor() {
    return this.#get("enableStampEditor") as boolean;
  }
  static get externalLinkRel() {
    return this.#get("externalLinkRel") as string;
  }
  static get externalLinkTarget() {
    return this.#get("externalLinkTarget") as LinkTarget;
  }
  static get highlightEditorColors() {
    return this.#get("highlightEditorColors") as string;
  }
  static get historyUpdateUrl() {
    return this.#get("historyUpdateUrl") as boolean;
  }
  static get ignoreDestinationZoom() {
    return this.#get("ignoreDestinationZoom") as boolean;
  }
  static get imageResourcesPath() {
    return this.#get("imageResourcesPath") as string;
  }
  static get locale() {
    return this.#get("locale") as Locale | undefined;
  }
  static get maxCanvasPixels() {
    return this.#get("maxCanvasPixels") as number;
  }
  static get forcePageColors() {
    return this.#get("forcePageColors") as boolean;
  }
  static get pageColorsBackground() {
    return this.#get("pageColorsBackground") as string;
  }
  static get pageColorsForeground() {
    return this.#get("pageColorsForeground") as string;
  }
  static get pdfBugEnabled() {
    return this.#get("pdfBugEnabled") as boolean;
  }
  static get printResolution() {
    return this.#get("printResolution") as number;
  }
  static get sidebarViewOnLoad() {
    return this.#get("sidebarViewOnLoad") as SidebarView;
  }
  static get scrollModeOnLoad() {
    return this.#get("scrollModeOnLoad") as ScrollMode;
  }
  static get spreadModeOnLoad() {
    return this.#get("spreadModeOnLoad") as SpreadMode;
  }
  static get textLayerMode() {
    return this.#get("textLayerMode") as TextLayerMode;
  }
  static get viewOnLoad() {
    return this.#get("viewOnLoad") as ViewOnLoad;
  }

  static get cMapPacked() {
    return this.#get("cMapPacked") as boolean;
  }
  static get cMapUrl() {
    return this.#get("cMapUrl") as string;
  }
  static get disableAutoFetch() {
    return this.#get("disableAutoFetch") as boolean;
  }
  static get disableFontFace() {
    return this.#get("disableFontFace") as boolean;
  }
  static get disableRange() {
    return this.#get("disableRange") as boolean;
  }
  static get disableStream() {
    return this.#get("disableStream") as boolean;
  }
  static get disableTelemetry() {
    return this.#get("disableTelemetry") as boolean;
  }
  static get docBaseUrl() {
    return this.#get("docBaseUrl") as string | undefined;
  }
  static get enableHWA() {
    return this.#get("enableHWA") as boolean;
  }
  static get enableXfa() {
    return this.#get("enableXfa") as boolean;
  }
  static get fontExtraProperties() {
    return this.#get("fontExtraProperties") as boolean;
  }
  static get isEvalSupported() {
    return this.#get("isEvalSupported") as boolean;
  }
  static get isOffscreenCanvasSupported() {
    return this.#get("isOffscreenCanvasSupported") as boolean;
  }
  static get maxImageSize() {
    return this.#get("maxImageSize") as number;
  }
  static get pdfBug() {
    return this.#get("pdfBug") as boolean;
  }
  static get standardFontDataUrl() {
    return this.#get("standardFontDataUrl") as string;
  }
  static get verbosity() {
    return this.#get("verbosity") as VerbosityLevel;
  }

  static get workerPort() {
    return this.#get("workerPort") as Worker | undefined;
  }
  static get workerSrc() {
    return this.#get("workerSrc") as string;
  }
  static get sandboxBundleSrc() {
    return this.#get("sandboxBundleSrc") as string | undefined;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  static getAll(kind?: OptionKind, defaultOnly = false) {
    const options: UserOptions = Object.create(null);
    for (const name in defaultOptions) {
      const defaultOption = defaultOptions[name as OptionName];

      if (kind && !(kind & defaultOption.kind)) {
        continue;
      }
      options[name as OptionName] = defaultOnly
        ? defaultOption.value
        : userOptions[name as OptionName] ?? defaultOption.value;
    }
    return options;
  }

  static set<ON extends OptionName>(name: ON, value: OptionType | undefined) {
    userOptions[name] = value;
  }

  static setAll(options: UserOptions, init = false) {
    /*#static*/ if (PDFJSDev || GENERIC) {
      if (init) {
        if (this.disablePreferences) {
          // Give custom implementations of the default viewer a simpler way to
          // opt-out of having the `Preferences` override existing `AppOptions`.
          return;
        }
        for (const name in userOptions) {
          // Ignore any compatibility-values in the user-options.
          if (compatibilityParams[name as OptionName] !== undefined) {
            continue;
          }
          console.warn(
            "setAll: The Preferences may override manually set AppOptions; " +
              'please use the "disablePreferences"-option in order to prevent that.',
          );
          break;
        }
      }
    }

    for (const name in options) {
      userOptions[name as OptionName] = options[name as OptionName];
    }
  }

  static remove(name: OptionName) {
    delete userOptions[name];

    /*#static*/ if (PDFJSDev || GENERIC) {
      // Re-apply a compatibility-value, if it exists, to the user-options.
      const val = compatibilityParams[name];
      if (val !== undefined) {
        userOptions[name] = val;
      }
    }
  }
}
/*80--------------------------------------------------------------------------*/
