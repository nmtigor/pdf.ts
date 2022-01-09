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
// #if GENERIC
  const userAgent =
    (typeof navigator !== "undefined" && navigator.userAgent) || "";
  const platform =
    (typeof navigator !== "undefined" && navigator.platform) || "";
  const maxTouchPoints =
    (typeof navigator !== "undefined" && navigator.maxTouchPoints) || 1;

  const isAndroid = /Android/.test(userAgent);
  const isIOS =
    /\b(iPad|iPhone|iPod)(?=;)/.test(userAgent) ||
    (platform === "MacIntel" && maxTouchPoints > 1);
  const isIOSChrome = /CriOS/.test(userAgent);

  // Disables URL.createObjectURL() usage in some environments.
  // Support: Chrome on iOS
  (function checkOnBlobSupport() {
    // Sometimes Chrome on iOS loses data created with createObjectURL(),
    // see issue 8081.
    if (isIOSChrome) 
    {
      compatibilityParams.disableCreateObjectURL = true;
    }
  })();

  // Limit canvas size to 5 mega-pixels on mobile.
  // Support: Android, iOS
  (function checkCanvasSizeLimitation() {
    if (isIOS || isAndroid) 
    {
      compatibilityParams.maxCanvasPixels = 5242880;
    }
  })();
// #endif

export const enum OptionKind {
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

const D_base = "";

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
    value: 
      /* #if !PRODUCTION */ true /* #else */ false /* #endif */,
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
    value: /* #if CHROME */ 2 /* #else */ 0 /* #endif */,
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
    value:
      // #if !PRODUCTION
        `${D_base}/res/pdf/pdf.ts-external/bcmaps/`
        // "../external/bcmaps/"
      // #else
        `${D_base}/res/pdf/pdf.ts-external/bcmaps/`
        // "../web/cmaps/"
      // #endif
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
    value:
      // #if !PRODUCTION
        `${D_base}/res/pdf/pdf.ts-external/standard_fonts/`
        // "../external/standard_fonts/"
      // #else
        `${D_base}/res/pdf/pdf.ts-external/standard_fonts/`
        // "../web/standard_fonts/"
      // #endif
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
    value: <Worker | undefined>undefined,
    kind: OptionKind.WORKER,
  },
  workerSrc: {
    /** @type {string} */
    value:
      /* #if !PRODUCTION */
        `${D_base}/gen/pdf/pdf.ts-src/pdf.worker.js`
        // "../src/worker_loader.js"
      /* #else */
        `${D_base}/gen/pdf/pdf.ts-src/pdf.worker.js`
        // "../build/pdf.worker.js"
      /* #endif */,
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
// #if !PRODUCTION || GENERIC
  defaultOptions.disablePreferences = {
    /** @type {boolean} */
    value: 
      /* #if TESTING */
      true
      /* #else */
      false
      /* #endif */,
      // typeof PDFJSDev !== "undefined" && PDFJSDev.test("TESTING"),
    kind: OptionKind.VIEWER,
  };
  defaultOptions.locale = {
    /** @type {string} */
    value: typeof navigator !== "undefined" ? navigator.language : Locale.en_US,
    kind: OptionKind.VIEWER,
  };
  defaultOptions.sandboxBundleSrc = {
    /** @type {string} */
    value: //kkkk
      /* #if !PRODUCTION */
        "../build/dev-sandbox/pdf.sandbox.js"
      /* #else */
        "../build/pdf.sandbox.js"
      /* #endif */,
      // typeof PDFJSDev === "undefined" || !PDFJSDev.test("PRODUCTION")
      //   ? "../build/dev-sandbox/pdf.sandbox.js"
      //   : "../build/pdf.sandbox.js",
    kind: OptionKind.VIEWER,
  };

  defaultOptions.renderer.kind += OptionKind.PREFERENCE;
/* #else */ /* #if CHROME */
  defaultOptions.disableTelemetry = {
    /** @type {boolean} */
    value: false,
    kind: OptionKind.VIEWER + OptionKind.PREFERENCE,
  };
  defaultOptions.sandboxBundleSrc = {
    /** @type {string} */
    value: "../build/pdf.sandbox.js", //kkkk
    kind: OptionKind.VIEWER,
  };
// #endif
// #endif

type DefaultOptions = typeof defaultOptions;
export type OptionName = keyof DefaultOptions
type OptionType<ON extends OptionName> = DefaultOptions[ON]["value"];

export type UserOptions = {
  [ON in OptionName]?: OptionType<ON>
}
const userOptions:UserOptions = Object.create(null);

export abstract class AppOptions 
{
  static get<ON extends OptionName>( name:ON ):OptionType<ON>
  {
    const userOption = userOptions[name];
    if( userOption !== undefined )
    {
      return userOption;
    }
    const defaultOption = defaultOptions[name];
    if( defaultOption !== undefined )
    {
      return (<any>defaultOption).compatibility ?? defaultOption.value;
    }
    return undefined;
  }

  static getAll( kind?:OptionKind ) 
  {
    const options:UserOptions = Object.create(null);
    for( const name in defaultOptions )
    {
      const defaultOption = defaultOptions[ <OptionName>name ];
      if( kind )
      {
        if( (kind & defaultOption.kind) === 0 ) continue;

        if( kind === OptionKind.PREFERENCE )
        {
          const value = defaultOption.value;
          const valueType = typeof value;

          if( valueType === "boolean"
           || valueType === "string"
           || (valueType === "number" && Number.isInteger(value))
          ) {
            (<any>options)[name] = value;
            continue;
          }
          throw new Error(`Invalid type for preference: ${name}`);
        }
      }
      const userOption = userOptions[ <OptionName>name ];
      (<any>options)[name] =
        userOption !== undefined
          ? userOption
          : (<any>defaultOption).compatibility ?? defaultOption.value;
    }
    return options;
  }

  static set<ON extends OptionName>( name:ON, value:OptionType<ON> | undefined ) 
  {
    userOptions[name] = <any>value;
  }

  static setAll( options:UserOptions )
  {
    for( const name in options )
    {
      (<any>userOptions)[name] = options[ <OptionName>name ];
    }
  }

  static remove( name:OptionName ) 
  {
    delete userOptions[name];
  }

  /**
   * @ignore
   */
  static _hasUserOptions() 
  {
    return Object.keys(userOptions).length > 0;
  }
}

/*81---------------------------------------------------------------------------*/
