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
  GECKOVIEW,
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
import type { EventName, FirefoxEventBus } from "./event_utils.ts";
import { LinkTarget } from "./pdf_link_service.ts";
import {
  CursorTool,
  ScrollMode,
  SidebarView,
  SpreadMode,
  TextLayerMode,
} from "./ui_utils.ts";
/*80--------------------------------------------------------------------------*/

// type _OptionValue1<ON extends OptionName> = _DefaultOptions[ON]["value"];
export type OptionValue =
  | null
  | number
  | string
  | boolean
  | Set<EventName>
  | { lang: Locale }
  | Worker;
type Option = {
  value: OptionValue | undefined;
  kind: OptionKind;
  type?: Type;
};

export enum OptionKind {
  UNDEFINED = 0,
  BROWSER = 0x01,
  VIEWER = 0x02,
  API = 0x04,
  WORKER = 0x08,
  EVENT_DISPATCH = 0x10,
  PREFERENCE = 0x80,
}

export const enum ToolbarDensity {
  /** Default value */
  normal = 0,
  compact = 1,
  touch = 2,
}

export const enum ViewOnLoad {
  UNKNOWN = -1,
  /** Default value */
  PREVIOUS = 0,
  INITIAL = 1,
}

/** Should only be used with options that allow multiple types. */
enum Type {
  BOOLEAN = 0x01,
  NUMBER = 0x02,
  OBJECT = 0x04,
  STRING = 0x08,
  UNDEFINED = 0x10,
}

/**
 * NOTE: These options are used to generate the `default_preferences.json` file,
 *       see `OptionKind.PREFERENCE`, hence the values below must use only
 *       primitive types and cannot rely on any imported types.
 */
const defaultOptions = {
  allowedGlobalEvents: {
    value: null as Set<EventName> | null,
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
    value: /*#static*/ PDFJSDev || GENERIC
      ? { lang: navigator.language as Locale || "en-US" }
      : null,
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
    value: /*#static*/ MOZCENTRAL
      ? "https://support.mozilla.org/1/firefox/%VERSION%/%OS%/%LOCALE%/pdf-alt-text"
      : "",
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
    value: undefined as number | undefined,
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
    value: undefined as string | undefined,
    kind: OptionKind.UNDEFINED as OptionKind,
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
    value: false as boolean,
    kind: OptionKind.UNDEFINED as OptionKind,
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
    value: /*#static*/ PDFJSDev || !CHROME ? true : false,
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
    value: /*#static*/ MOZCENTRAL
      // ? "resource://pdf.js/web/images/"
      ? `${AD_gh}/${D_rp_web}/images/`
      : `${AD_gh}/${D_rp_web}/images/`,
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
    kind: OptionKind.UNDEFINED,
  },
  docBaseUrl: {
    value: /*#static*/ PDFJSDev ? document.URL.split("#", 1)[0] : "",
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
  useSystemFonts: {
    // On Android, there is almost no chance to have the font we want so we
    // don't use the system fonts in this case (bug 1882613).
    value: (
        /*#static*/ PDFJSDev ? (window as any).isGECKOVIEW : GECKOVIEW
      )
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
    value: null as Worker | null,
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
    kind: OptionKind.UNDEFINED as OptionKind,
  },
} satisfies Record<string, Option>;

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
} else {
  /*#static*/ if (CHROME) {
    defaultOptions.disableTelemetry = {
      value: false,
      kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
    };
  }
}

type _DefaultOptions = typeof defaultOptions;
export type OptionName = keyof _DefaultOptions;

export type UserOptionMap = Map<OptionName, OptionValue | undefined>;
export type UserOptions = Record<OptionName, OptionValue | undefined>;

/*#static*/ if (PDFJSDev || GENERIC) {
  // eslint-disable-next-line no-var
  var compatParams: UserOptionMap = new Map();
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

const userOptions: UserOptionMap = new Map();

/*#static*/ if (PDFJSDev || GENERIC) {
  // Apply any compatibility-values to the user-options.
  for (const [name, value] of compatParams!) {
    userOptions.set(name, value);
  }
}

/*#static*/ if (PDFJSDev || TESTING || LIB) {
  // Ensure that the `defaultOptions` are correctly specified.
  for (const name in defaultOptions) {
    const { value, kind, type } =
      (defaultOptions as Record<OptionName, Option>)[name as OptionName];

    if (kind & OptionKind.PREFERENCE) {
      if (kind === OptionKind.PREFERENCE) {
        throw new Error(`Cannot use only "PREFERENCE" kind: ${name}`);
      }
      if (kind & OptionKind.BROWSER) {
        throw new Error(`Cannot mix "PREFERENCE" and "BROWSER" kind: ${name}`);
      }
      if (type !== undefined) {
        throw new Error(
          `Cannot have \`type\`-field for "PREFERENCE" kind: ${name}`,
        );
      }
      if (
        typeof compatParams! === "object" &&
        compatParams.has(name as OptionName)
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
    } else if (kind & OptionKind.BROWSER) {
      if (type !== undefined) {
        throw new Error(
          `Cannot have \`type\`-field for "BROWSER" kind: ${name}`,
        );
      }
      if (
        typeof compatParams! === "object" &&
        compatParams.has(name as OptionName)
      ) {
        throw new Error(
          `Should not have compatibility-value for "BROWSER" kind: ${name}`,
        );
      }
      if (value === undefined) {
        throw new Error(`Invalid value for "BROWSER" kind: ${name}`);
      }
    }
  }
}

export abstract class AppOptions {
  static eventBus: FirefoxEventBus | undefined;

  static #get<N extends OptionName>(name: N) {
    return userOptions.has(name)
      ? userOptions.get(name)
      : defaultOptions[name]?.value;
  }

  static get allowedGlobalEvents() {
    return this.#get("allowedGlobalEvents") as Set<EventName> | null;
  }
  static get canvasMaxAreaInBytes() {
    return this.#get("canvasMaxAreaInBytes") as number;
  }
  static get isInAutomation() {
    return this.#get("isInAutomation") as boolean;
  }
  static get localeProperties() {
    return this.#get("localeProperties") as { lang: Locale } | null;
  }
  static get nimbusDataStr() {
    return this.#get("nimbusDataStr") as string;
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
  static get toolbarDensity() {
    return this.#get("toolbarDensity") as ToolbarDensity;
  }

  static get altTextLearnMoreUrl() {
    return this.#get("altTextLearnMoreUrl") as string;
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
  static get enableAltText() {
    return this.#get("enableAltText") as boolean;
  }
  static get enableGuessAltText() {
    return this.#get("enableGuessAltText") as boolean;
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
  static get enablePermissions() {
    return this.#get("enablePermissions") as boolean;
  }
  static get enablePrintAutoRotate() {
    return this.#get("enablePrintAutoRotate") as boolean;
  }
  static get enableScripting() {
    return this.#get("enableScripting") as boolean;
  }
  static get enableUpdatedAddImage() {
    return this.#get("enableUpdatedAddImage") as boolean;
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
    return this.#get("docBaseUrl") as string;
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
  static get useSystemFonts() {
    return this.#get("useSystemFonts") as boolean | undefined;
  }
  static get verbosity() {
    return this.#get("verbosity") as VerbosityLevel;
  }

  static get workerPort() {
    return this.#get("workerPort") as Worker | null;
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
      const defaultOpt = defaultOptions[name as OptionName];

      if (kind && !(kind & defaultOpt.kind)) {
        continue;
      }
      options[name as OptionName] =
        !defaultOnly && userOptions.has(name as OptionName)
          ? userOptions.get(name as OptionName)
          : defaultOpt.value;
    }
    return options;
  }

  static set(name: OptionName, value: OptionValue | undefined) {
    this.setAll({ [name]: value } as UserOptions);
  }

  static setAll(options: UserOptions, prefs = false) {
    let events;

    for (const name in options) {
      const defaultOpt = defaultOptions[name as OptionName] as Option,
        userOpt = options[name as OptionName];

      if (
        !defaultOpt ||
        !(
          typeof userOpt === typeof defaultOpt.value ||
          Type[(typeof userOpt).toUpperCase() as keyof typeof Type] &
            defaultOpt.type!
        )
      ) {
        continue;
      }
      const { kind } = defaultOpt;

      if (
        prefs &&
        !(kind & OptionKind.BROWSER || kind & OptionKind.PREFERENCE)
      ) {
        continue;
      }
      if (this.eventBus && kind & OptionKind.EVENT_DISPATCH) {
        (events ||= new Map()).set(name, userOpt);
      }
      userOptions.set(name as OptionName, userOpt);
    }

    if (events) {
      for (const [name, value] of events) {
        this.eventBus!.dispatch(name.toLowerCase(), { source: this, value });
      }
    }
  }

  static _checkDisablePreferences: () => boolean;
}

/*#static*/ if (PDFJSDev || GENERIC) {
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
      console.warn(
        "The Preferences may override manually set AppOptions; " +
          'please use the "disablePreferences"-option to prevent that.',
      );
      break;
    }
    return false;
  };
}
/*80--------------------------------------------------------------------------*/
