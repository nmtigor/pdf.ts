/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/firefoxcom.ts
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

import type { ArrEl } from "@fe-lib/alias.ts";
import { textnode } from "@fe-lib/dom.ts";
import { GECKOVIEW, MOZCENTRAL, PDFJSDev } from "@fe-src/global.ts";
import { isPdfFile, PDFDataRangeTransport } from "../pdf.ts-src/pdf.ts";
import type { FindControlState, PDFViewerApplication } from "./app.ts";
import type { UserOptions } from "./app_options.ts";
import type { EventMap, EventName } from "./event_utils.ts";
import type { GlobalEvent } from "./external_services.ts";
import { BaseExternalServices } from "./external_services.ts";
import type {
  CreateSandboxP,
  EventInSandBox,
  IDownloadManager,
  IScripting,
} from "./interfaces.ts";
import { L10n, type L10nCtorP } from "./l10n.ts";
import type {
  FindCtrlState,
  FindType,
  MatchesCount,
} from "./pdf_find_controller.ts";
import { BasePreferences } from "./preferences.ts";
import { DEFAULT_SCALE_VALUE } from "./ui_utils.ts";
/*80--------------------------------------------------------------------------*/

/*#static*/ if (PDFJSDev || !MOZCENTRAL) {
  throw new Error(
    'Module "./firefoxcom.js" shall not be used outside MOZCENTRAL builds.',
  );
}

// type L10nData_ = Record<string, Record<string, string>>;
// interface ELS_ {
//   getLocale(): Lowercase<Locale_1>;
//   getStrings(): L10nData_;
// }
// interface DocMozL10n_ {
//   get(key: string, args?: WebL10nArgs, fallback?: string): string;
//   getLanguage(): Lowercase<Locale_1> | "";
//   getDirection(): "rtl" | "ltr";
//   getReadyState(): unknown;
//   setExternalLocalizerServices(externalLocalizerServices: ELS_): void;
//   translate(element: HTMLElement): void;
// }
// declare global {
//   interface Document {
//     mozL10n: DocMozL10n_;
//   }
// }

let viewerApp = { initialized: false } as PDFViewerApplication;
export function initCom(app: PDFViewerApplication) {
  viewerApp = app;
}

type RequestMap_ = {
  abortLoading: {
    data: undefined;
    ret: undefined;
  };
  createSandbox: {
    data: CreateSandboxP;
    ret: boolean;
  };
  destroySandbox: {
    data: undefined;
    ret: undefined;
  };
  dispatchEventInSandbox: {
    data: EventInSandBox;
    ret: undefined;
  };
  dispatchGlobalEvent: {
    data: GlobalEvent<EventName>;
    ret: undefined;
  };
  download: {
    data: {
      blobUrl: string | undefined;
      originalUrl: string;
      filename: string;
      isAttachment?: boolean;
      options?: object;
    };
    ret: undefined;
  };
  getGlobalEventNames: {
    data: undefined;
    ret: Set<EventName> | undefined;
  };
  getLocaleProperties: {
    data: undefined;
    ret: L10nCtorP;
  };
  getNimbusExperimentData: {
    data: undefined;
    ret: string;
  };
  getPreferences: {
    data: { prefs: UserOptions };
    ret: { browserPrefs?: UserOptions; prefs: UserOptions };
  };
  initPassiveLoading: {
    data: undefined;
    ret: undefined;
  };
  mlGuess: {
    data: unknown;
    ret: unknown;
  };
  reportTelemetry: {
    data: EventMap["reporttelemetry"]["details"];
    ret: undefined;
  };
  requestDataRange: {
    data: {
      begin: number;
      end: number;
    };
    ret: undefined;
  };
  updateEditorStates: {
    data: EventMap["annotationeditorstateschanged"];
    ret: undefined;
  };
  updateFindControlState: {
    data: FindControlState;
    ret: undefined;
  };
  updateFindMatchesCount: {
    data: MatchesCount;
    ret: undefined;
  };
};
type RequestAction_ = keyof RequestMap_;
type RequestData_<RA extends RequestAction_> = RequestMap_[RA]["data"];
type RequestRet_<RA extends RequestAction_> = RequestMap_[RA]["ret"];

export class FirefoxCom {
  //kkkk TOCLEANUP
  // /**
  //  * Creates an event that the extension is listening for and will
  //  * synchronously respond to.
  //  * NOTE: It is recommended to use requestAsync() instead since one day we may
  //  *       not be able to synchronously reply.
  //  * @param action The action to trigger.
  //  * @param data The data to send.
  //  * @return {*} The response.
  //  */
  // static requestSync(action: string, data?: unknown) {
  //   const request = document.createTextNode("");
  //   document.documentElement.append(request);

  //   const sender = new CustomEvent<{
  //     action: string;
  //     data?: unknown;
  //     sync: true;
  //     response?: unknown;
  //   }>("pdf.js.message", {
  //     bubbles: true,
  //     cancelable: false,
  //     detail: {
  //       action,
  //       data,
  //       sync: true,
  //     },
  //   });
  //   request.dispatchEvent(sender);
  //   const response = sender.detail.response;
  //   request.remove();

  //   return response;
  // }

  /**
   * Creates an event that the extension is listening for and will
   * asynchronously respond to.
   * @param action The action to trigger.
   * @param data The data to send.
   * @return A promise that is resolved with the response data.
   */
  static requestAsync<RA extends RequestAction_>(
    action: RA,
    data?: RequestMap_[RA]["data"],
  ): Promise<RequestRet_<RA>> {
    return new Promise<RequestRet_<RA>>((resolve) => {
      this.request(action, data, resolve);
    });
  }

  /**
   * Creates an event that the extension is listening for and will, optionally,
   * asynchronously respond to.
   * @param action The action to trigger.
   * @param data The data to send.
   */
  static request<RA extends RequestAction_>(
    action: RA,
    data?: RequestData_<RA>,
    callback?: (response: RequestData_<RA>) => void,
  ): void {
    type Detail_ = {
      action: string;
      data?: RequestData_<RA>;
      sync?: false;
      responseExpected: boolean;
      response?: RequestData_<RA>;
    };
    const request = textnode("");
    if (callback) {
      request.addEventListener(
        "pdf.js.response",
        (event) => {
          const response = (event as CustomEvent<Detail_>).detail.response!;
          (event.target as ChildNode).remove();

          callback(response);
        },
        { once: true },
      );
    }
    document.documentElement.append(request);

    const sender = new CustomEvent<Detail_>("pdf.js.message", {
      bubbles: true,
      cancelable: false,
      detail: {
        action,
        data,
        responseExpected: !!callback,
      },
    });

    request.dispatchEvent(sender);
  }
}

export class DownloadManager implements IDownloadManager {
  #openBlobUrls = new WeakMap();

  /** @implement */
  downloadData(
    data: Uint8Array | Uint8ClampedArray,
    filename: string,
    contentType: string,
  ) {
    const blobUrl = URL.createObjectURL(
      new Blob([data], { type: contentType }),
    );

    FirefoxCom.request("download", {
      blobUrl,
      originalUrl: blobUrl,
      filename,
      isAttachment: true,
    });
  }

  /**
   * @implement
   * @return Indicating if the data was opened.
   */
  openOrDownloadData(
    data: Uint8Array | Uint8ClampedArray,
    filename: string,
    dest?: string,
  ): boolean {
    const isPdfData = isPdfFile(filename);
    const contentType = isPdfData ? "application/pdf" : "";

    if (isPdfData) {
      let blobUrl = this.#openBlobUrls.get(data);
      if (!blobUrl) {
        blobUrl = URL.createObjectURL(new Blob([data], { type: contentType }));
        this.#openBlobUrls.set(data, blobUrl);
      }
      // Let Firefox's content handler catch the URL and display the PDF.
      // NOTE: This cannot use a query string for the filename, see
      //       https://bugzilla.mozilla.org/show_bug.cgi?id=1632644#c5
      let viewerUrl = blobUrl + "#filename=" + encodeURIComponent(filename);
      if (dest) {
        viewerUrl += `&filedest=${escape(dest)}`;
      }

      try {
        window.open(viewerUrl);
        return true;
      } catch (ex) {
        console.error(`openOrDownloadData: ${ex}`);
        // Release the `blobUrl`, since opening it failed, and fallback to
        // downloading the PDF file.
        URL.revokeObjectURL(blobUrl);
        this.#openBlobUrls.delete(data);
      }
    }

    this.downloadData(data, filename, contentType);
    return false;
  }

  /** @implement */
  download(
    data: BlobPart,
    url: string,
    filename: string,
    options: object = {},
  ) {
    // const blobUrl = URL.createObjectURL(data);
    const blobUrl = data
      ? URL.createObjectURL(new Blob([data], { type: "application/pdf" }))
      : undefined;

    FirefoxCom.request("download", {
      blobUrl,
      originalUrl: url,
      filename,
      options,
    });
  }
}

export class Preferences extends BasePreferences {
  /** @implement */
  protected async _readFromStorage(prefObj: { prefs: UserOptions }) {
    return FirefoxCom.requestAsync("getPreferences", prefObj);
  }
}

//kkkk TOCLEANUP
// class MozL10n implements IL10n {
//   mozL10n;

//   constructor(mozL10n: DocMozL10n_) {
//     this.mozL10n = mozL10n;
//   }

//   /** @implement */
//   async getLanguage() {
//     return this.mozL10n.getLanguage();
//   }

//   /** @implement */
//   async getDirection() {
//     return this.mozL10n.getDirection();
//   }

//   /** @implement */
//   async get(
//     key: string,
//     args: WebL10nArgs,
//     fallback = getL10nFallback(key, args),
//   ) {
//     return this.mozL10n.get(key, args, fallback);
//   }

//   /** @implement */
//   async translate(element: HTMLElement) {
//     this.mozL10n.translate(element);
//   }
// }

(/* listenFindEvents */ () => {
  const events = [
    "find",
    "findagain",
    "findhighlightallchange",
    "findcasesensitivitychange",
    "findentirewordchange",
    "findbarclose",
    "finddiacriticmatchingchange",
  ];
  const findLen = "find".length;

  const handleEvent = (
    { type, detail }: { type: string; detail?: FindCtrlState },
  ) => {
    if (!viewerApp.initialized) {
      return;
    }
    if (type === "findbarclose") {
      viewerApp.eventBus.dispatch(type, { source: window });
      return;
    }
    viewerApp.eventBus.dispatch("find", {
      source: window,
      type: type.substring(findLen) as FindType,
      query: detail!.query,
      caseSensitive: !!detail!.caseSensitive,
      entireWord: !!detail!.entireWord,
      highlightAll: !!detail!.highlightAll,
      findPrevious: !!detail!.findPrevious,
      matchDiacritics: !!detail!.matchDiacritics,
    });
  };

  for (const event of events) {
    window.addEventListener(event, handleEvent);
  }
})();

(/* listenZoomEvents */ () => {
  const events = ["zoomin", "zoomout", "zoomreset"] as const;
  const handleEvent = (
    { type, detail }: { type: ArrEl<typeof events>; detail: unknown },
  ) => {
    if (!viewerApp.initialized) {
      return;
    }
    // Avoid attempting to needlessly reset the zoom level *twice* in a row,
    // when using the `Ctrl + 0` keyboard shortcut.
    if (
      type === "zoomreset" &&
      viewerApp.pdfViewer.currentScaleValue === DEFAULT_SCALE_VALUE
    ) {
      return;
    }
    viewerApp.eventBus.dispatch(type, { source: window });
  };

  for (const event of events) {
    window.addEventListener(event, handleEvent as any);
  }
})();

(/* listenSaveEvent */ () => {
  const handleEvent = (
    { type, detail }: CustomEvent<EventMap["save"]>,
  ) => {
    if (!viewerApp.initialized) {
      return;
    }
    viewerApp.eventBus.dispatch("download", { source: window });
  };

  window.addEventListener("save", handleEvent as any);
})();

(/* listenEditingEvent */ () => {
  const handleEvent = (
    { detail }: CustomEvent<EventMap["editingaction"]>,
  ) => {
    if (!viewerApp.initialized) {
      return;
    }
    viewerApp.eventBus.dispatch("editingaction", {
      source: window,
      name: detail.name,
    });
  };

  window.addEventListener("editingaction", handleEvent as any);
})();

/*#static*/ if (GECKOVIEW) {
  (function listenQueryEvents() {
    window.addEventListener(
      "pdf.js.query" as any,
      async ({ detail: { queryId } }) => {
        let result = null;
        if (viewerApp.initialized && queryId === "canDownloadInsteadOfPrint") {
          result = false;
          const { pdfDocument, pdfViewer } = viewerApp;
          if (pdfDocument) {
            try {
              const hasUnchangedAnnotations =
                pdfDocument.annotationStorage.size === 0;
              // WillPrint is called just before printing the document and could
              // lead to have modified annotations.
              const hasWillPrint = pdfViewer.enableScripting &&
                !!(await pdfDocument.getJSActions())?.WillPrint;

              result = hasUnchangedAnnotations && !hasWillPrint;
            } catch {
              console.warn(
                "Unable to check if the document can be downloaded.",
              );
            }
          }
        }

        window.dispatchEvent(
          new CustomEvent("pdf.js.query.answer", {
            bubbles: true,
            cancelable: false,
            detail: {
              queryId,
              value: result,
            },
          }),
        );
      },
    );
  })();
}

class FirefoxComDataRangeTransport extends PDFDataRangeTransport {
  override requestDataRange(begin: number, end: number) {
    FirefoxCom.request("requestDataRange", { begin, end });
  }

  // NOTE: This method is currently not invoked in the Firefox PDF Viewer.
  override abort() {
    FirefoxCom.request("abortLoading");
  }
}

class FirefoxScripting implements IScripting {
  /** @implement */
  async createSandbox(data: CreateSandboxP) {
    const success = await FirefoxCom.requestAsync("createSandbox", data);
    if (!success) {
      throw new Error("Cannot create sandbox.");
    }
  }

  /** @implement */
  async dispatchEventInSandbox(event: EventInSandBox) {
    FirefoxCom.request("dispatchEventInSandbox", event);
  }

  /** @implement */
  async destroySandbox() {
    FirefoxCom.request("destroySandbox");
  }
}

export type NimbusExperimentData = {
  "download-button"?: unknown;
  "open-in-app-button"?: unknown;
};

export class MLManager {
  guess(data: unknown) {
    return FirefoxCom.requestAsync("mlGuess", data);
  }
}

export class ExternalServices extends BaseExternalServices {
  override updateFindControlState(data: FindControlState) {
    FirefoxCom.request("updateFindControlState", data);
  }

  override updateFindMatchesCount(data: MatchesCount) {
    FirefoxCom.request("updateFindMatchesCount", data);
  }

  override initPassiveLoading() {
    let pdfDataRangeTransport: FirefoxComDataRangeTransport;

    window.addEventListener("message", (e) => {
      if (e.source !== null) {
        // The message MUST originate from Chrome code.
        console.warn("Rejected untrusted message from " + e.origin);
        return;
      }
      const args = e.data;

      if (typeof args !== "object" || !("pdfjsLoadAction" in args)) {
        return;
      }
      switch (args.pdfjsLoadAction) {
        case "supportsRangedLoading":
          if (args.done && !args.data) {
            viewerApp._documentError(undefined);
            break;
          }
          pdfDataRangeTransport = new FirefoxComDataRangeTransport(
            args.length,
            args.data,
            args.done,
            args.filename,
          );

          viewerApp.open({ range: pdfDataRangeTransport });
          break;
        case "range":
          pdfDataRangeTransport.onDataRange(args.begin, args.chunk);
          break;
        case "rangeProgress":
          pdfDataRangeTransport.onDataProgress(args.loaded);
          break;
        case "progressiveRead":
          pdfDataRangeTransport.onDataProgressiveRead(args.chunk);

          // Don't forget to report loading progress as well, since otherwise
          // the loadingBar won't update when `disableRange=true` is set.
          pdfDataRangeTransport.onDataProgress(args.loaded, args.total);
          break;
        case "progressiveDone":
          pdfDataRangeTransport?.onDataProgressiveDone();
          break;
        case "progress":
          viewerApp.progress(args.loaded / args.total);
          break;
        case "complete":
          if (!args.data) {
            viewerApp._documentError(undefined, { message: args.errorCode });
            break;
          }
          viewerApp.open({ data: args.data, filename: args.filename });
          break;
      }
    });
    FirefoxCom.request("initPassiveLoading");
  }

  override reportTelemetry(data: EventMap["reporttelemetry"]["details"]) {
    FirefoxCom.request("reportTelemetry", data);
  }

  override updateEditorStates(data: EventMap["annotationeditorstateschanged"]) {
    FirefoxCom.request("updateEditorStates", data);
  }

  override async createL10n() {
    const [localeProperties] = await Promise.all([
      FirefoxCom.requestAsync("getLocaleProperties"),
      // document.l10n.ready, //kkkk bug?
    ]);
    return new L10n(localeProperties, document.l10n);
  }

  override createScripting() {
    return new FirefoxScripting();
  }

  //kkkk TOCLEANUP
  // override get supportsPinchToZoom() {
  //   const support = !!FirefoxCom.requestSync("supportsPinchToZoom");
  //   return shadow(this, "supportsPinchToZoom", support);
  // }

  // override get supportsIntegratedFind() {
  //   const support = <boolean> FirefoxCom.requestSync("supportsIntegratedFind");
  //   return shadow(this, "supportsIntegratedFind", support);
  // }

  // override get supportsDocumentFonts() {
  //   const support = <boolean> FirefoxCom.requestSync("supportsDocumentFonts");
  //   return shadow(this, "supportsDocumentFonts", support);
  // }

  // override get supportedMouseWheelZoomModifierKeys() {
  //   const support = <{ ctrlKey: boolean; metaKey: boolean }> FirefoxCom
  //     .requestSync(
  //       "supportedMouseWheelZoomModifierKeys",
  //     );
  //   return shadow(this, "supportedMouseWheelZoomModifierKeys", support);
  // }

  // override get isInAutomation() {
  //   // Returns the value of `Cu.isInAutomation`, which is only `true` when e.g.
  //   // various test-suites are running in mozilla-central.
  //   const isInAutomation = FirefoxCom.requestSync("isInAutomation") as boolean;
  //   return shadow(this, "isInAutomation", isInAutomation);
  // }

  // static get canvasMaxAreaInBytes() {
  //   const maxArea = FirefoxCom.requestSync("getCanvasMaxArea");
  //   return shadow(this, "canvasMaxAreaInBytes", maxArea);
  // }

  override async getNimbusExperimentData() {
    /*#static*/ if (!GECKOVIEW) {
      return undefined;
    }
    const nimbusData = await FirefoxCom.requestAsync("getNimbusExperimentData");
    // return nimbusData && JSON.parse(nimbusData) as NimbusExperimentData;
    return nimbusData
      ? JSON.parse(nimbusData) as NimbusExperimentData
      : undefined;
  }

  override async getGlobalEventNames() {
    return FirefoxCom.requestAsync("getGlobalEventNames");
  }

  override dispatchGlobalEvent<EN extends EventName>(event: GlobalEvent<EN>) {
    FirefoxCom.request("dispatchGlobalEvent", event);
  }
}

//kkkk TOCLEANUP
// // l10n.js for Firefox extension expects services to be set.
// document.mozL10n.setExternalLocalizerServices({
//   getLocale() {
//     return <Lowercase<Locale_1>> FirefoxCom.requestSync("getLocale", null);
//   },

//   getStrings() {
//     return <L10nData_> FirefoxCom.requestSync("getStrings", null);
//   },
// });
/*80--------------------------------------------------------------------------*/

//kkkk TOCLEANUP
// // Small subset of the webL10n API by Fabien Cazenave for PDF.js extension.
// ((window) => {
//   let gL10nData: L10nData_ | undefined;
//   let gLanguage: Lowercase<Locale_1> | "" = "";
//   let gExternalLocalizerServices: ELS_ | undefined;
//   let gReadyState = "loading";

//   // fetch an l10n objects
//   function getL10nData(key: string) {
//     gL10nData ||= gExternalLocalizerServices!.getStrings();

//     const data = gL10nData?.[key];
//     if (!data) {
//       console.warn("[l10n] #" + key + " missing for [" + gLanguage + "]");
//     }
//     return data;
//   }

//   // replace {{arguments}} with their values
//   function substArguments(text: string, args?: WebL10nArgs) {
//     if (!args) {
//       return text;
//     }
//     return text.replace(
//       /\{\{\s*(\w+)\s*\}\}/g,
//       (all, name) => name in args ? args[name] : "{{" + name + "}}",
//     );
//   }

//   // translate a string
//   function translateString(key: string, args?: WebL10nArgs, fallback?: string) {
//     var i = key.lastIndexOf(".");
//     var name, property;
//     if (i >= 0) {
//       name = key.substring(0, i);
//       property = key.substring(i + 1);
//     } else {
//       name = key;
//       property = "textContent";
//     }
//     var data = getL10nData(name);
//     var value = (data && data[property]) || fallback;
//     if (!value) {
//       return "{{" + key + "}}";
//     }
//     return substArguments(value, args);
//   }

//   // translate an HTML element
//   function translateElement(element: HTMLElement) {
//     if (!element || !element.dataset) {
//       return;
//     }

//     // get the related l10n object
//     var key = element.dataset.l10nId;
//     var data = getL10nData(key!);
//     if (!data) {
//       return;
//     }

//     // get arguments (if any)
//     // TODO: more flexible parser?
//     var args;
//     if (element.dataset.l10nArgs) {
//       try {
//         args = JSON.parse(element.dataset.l10nArgs);
//       } catch (e) {
//         console.warn("[l10n] could not parse arguments for #" + key + "");
//       }
//     }

//     // translate element
//     // TODO: security check?
//     for (var k in data) {
//       (<any> element)[k] = substArguments(data[k], args);
//     }
//   }

//   // translate an HTML subtree
//   function translateFragment(element: HTMLElement) {
//     element = element || document.querySelector("html");

//     // check all translatable children (= w/ a `data-l10n-id' attribute)
//     var children = element.querySelectorAll("*[data-l10n-id]");
//     var elementCount = children.length;
//     for (var i = 0; i < elementCount; i++) {
//       translateElement(<HTMLElement> children[i]);
//     }

//     // translate element itself if necessary
//     if (element.dataset.l10nId) {
//       translateElement(element);
//     }
//   }

//   // Public API
//   document.mozL10n = {
//     // get a localized string
//     get: translateString,

//     // get the document language
//     getLanguage() {
//       return gLanguage;
//     },

//     // get the direction (ltr|rtl) of the current language
//     getDirection() {
//       // http://www.w3.org/International/questions/qa-scripts
//       // Arabic, Hebrew, Farsi, Pashto, Urdu
//       var rtlList = ["ar", "he", "fa", "ps", "ur"];

//       // use the short language code for "full" codes like 'ar-sa' (issue 5440)
//       var shortCode = gLanguage.split("-")[0];

//       return rtlList.includes(shortCode) ? "rtl" : "ltr";
//     },

//     getReadyState() {
//       return gReadyState;
//     },

//     setExternalLocalizerServices(externalLocalizerServices) {
//       gExternalLocalizerServices = externalLocalizerServices;
//       gLanguage = gExternalLocalizerServices.getLocale();
//       gReadyState = "complete";
//     },

//     // translate an element or document fragment
//     translate: translateFragment,
//   };
// })(this);
/*80--------------------------------------------------------------------------*/
