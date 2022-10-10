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

import { Locale_1, WebL10nArgs } from "../../3rd/webL10n/l10n.ts";
import { MOZCENTRAL } from "../../global.ts";
import { ArrEl } from "../../lib/alias.ts";
import { Locale } from "../../lib/Locale.ts";
import "../extensions/firefox/tools/l10n.ts";
import { isPdfFile, PDFDataRangeTransport, shadow } from "../pdf.ts-src/pdf.ts";
import {
  DefaultExternalServices,
  FindControlState,
  PassiveLoadingCbs,
  TelemetryData,
  viewerapp,
} from "./app.ts";
import { UserOptions } from "./app_options.ts";
import { EventMap } from "./event_utils.ts";
import {
  CreateSandboxP,
  EventInSandBox,
  IDownloadManager,
  IL10n,
  IScripting,
} from "./interfaces.ts";
import { getL10nFallback } from "./l10n_utils.ts";
import {
  FindCtrlState,
  FindType,
  MatchesCount,
} from "./pdf_find_controller.ts";
import { BasePreferences } from "./preferences.ts";
import { DEFAULT_SCALE_VALUE } from "./ui_utils.ts";
/*80--------------------------------------------------------------------------*/

/*#static*/ if (!MOZCENTRAL) {
  throw new Error(
    'Module "./firefoxcom.js" shall not be used outside MOZCENTRAL builds.',
  );
}

type _L10nData = Record<string, Record<string, string>>;
interface _ELS {
  getLocale(): Lowercase<Locale_1>;
  getStrings(): _L10nData;
}
interface _DocMozL10n {
  get(key: string, args?: WebL10nArgs, fallback?: string): string;
  getLanguage(): Lowercase<Locale_1> | "";
  getDirection(): "rtl" | "ltr";
  getReadyState(): unknown;
  setExternalLocalizerServices(externalLocalizerServices: _ELS): void;
  translate(element: HTMLElement): void;
}
declare global {
  interface Document {
    mozL10n: _DocMozL10n;
  }
}

export class FirefoxCom {
  /**
   * Creates an event that the extension is listening for and will
   * synchronously respond to.
   * NOTE: It is recommended to use requestAsync() instead since one day we may
   *       not be able to synchronously reply.
   * @param action The action to trigger.
   * @param data The data to send.
   * @returns {*} The response.
   */
  static requestSync(action: string, data?: unknown) {
    const request = document.createTextNode("");
    document.documentElement.append(request);

    const sender = new CustomEvent<{
      action: string;
      data?: unknown;
      sync: true;
      response?: unknown;
    }>("pdf.js.message", {
      bubbles: true,
      cancelable: false,
      detail: {
        action,
        data,
        sync: true,
      },
    });
    request.dispatchEvent(sender);
    const response = sender.detail.response;
    request.remove();

    return response;
  }

  /**
   * Creates an event that the extension is listening for and will
   * asynchronously respond to.
   * @param action The action to trigger.
   * @param data The data to send.
   * @returns {Promise<any>} A promise that is resolved with the response data.
   */
  static requestAsync(action: string, data?: unknown) {
    return new Promise<unknown>((resolve) => {
      this.request(action, data, resolve);
    });
  }

  /**
   * Creates an event that the extension is listening for and will, optionally,
   * asynchronously respond to.
   * @param action The action to trigger.
   * @param data The data to send.
   */
  static request(
    action: string,
    data?: unknown,
    callback?: (response: unknown) => void,
  ) {
    type Detail_ = {
      action: string;
      data?: unknown;
      sync: false;
      responseExpected: boolean;
      response?: unknown;
    };
    const request = document.createTextNode("");
    if (callback) {
      request.addEventListener(
        "pdf.js.response",
        (event) => {
          const response = (<CustomEvent<Detail_>> event).detail.response;
          (<Text> event.target).remove();

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
        sync: false,
        responseExpected: !!callback,
      },
    });

    request.dispatchEvent(sender);
  }
}

export class DownloadManager implements IDownloadManager {
  _openBlobUrls = new WeakMap();

  constructor() {
  }

  /** @implement */
  downloadUrl(url: string, filename: string) {
    FirefoxCom.request("download", {
      originalUrl: url,
      filename,
    });
  }

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
    element: HTMLElement,
    data: Uint8Array | Uint8ClampedArray,
    filename: string,
  ): boolean {
    const isPdfData = isPdfFile(filename);
    const contentType = isPdfData ? "application/pdf" : "";

    if (isPdfData) {
      let blobUrl = this._openBlobUrls.get(element);
      if (!blobUrl) {
        blobUrl = URL.createObjectURL(new Blob([data], { type: contentType }));
        this._openBlobUrls.set(element, blobUrl);
      }
      // Let Firefox's content handler catch the URL and display the PDF.
      const viewerUrl = blobUrl + "#filename=" + encodeURIComponent(filename);

      try {
        window.open(viewerUrl);
        return true;
      } catch (ex) {
        console.error(`openOrDownloadData: ${ex}`);
        // Release the `blobUrl`, since opening it failed, and fallback to
        // downloading the PDF file.
        URL.revokeObjectURL(blobUrl);
        this._openBlobUrls.delete(element);
      }
    }

    this.downloadData(data, filename, contentType);
    return false;
  }

  /** @implement */
  download(blob: Blob, url: string, filename: string) {
    const blobUrl = URL.createObjectURL(blob);

    FirefoxCom.request("download", {
      blobUrl,
      originalUrl: url,
      filename,
    });
  }
}

class FirefoxPreferences extends BasePreferences {
  /** @implement */
  protected async _writeToStorage(prefObj: UserOptions) {
    FirefoxCom.requestAsync("setPreferences", prefObj);
  }

  /** @implement */
  protected async _readFromStorage(prefObj: UserOptions) {
    const prefStr = <string> await FirefoxCom.requestAsync(
      "getPreferences",
      prefObj,
    );
    return JSON.parse(prefStr);
  }
}

class MozL10n implements IL10n {
  mozL10n;

  constructor(mozL10n: _DocMozL10n) {
    this.mozL10n = mozL10n;
  }

  /** @implement */
  async getLanguage() {
    return this.mozL10n.getLanguage();
  }

  /** @implement */
  async getDirection() {
    return this.mozL10n.getDirection();
  }

  /** @implement */
  async get(
    key: string,
    args: WebL10nArgs,
    fallback = getL10nFallback(key, args),
  ) {
    return this.mozL10n.get(key, args, fallback);
  }

  /** @implement */
  async translate(element: HTMLElement) {
    this.mozL10n.translate(element);
  }
}

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
    if (!viewerapp.initialized) {
      return;
    }
    if (type === "findbarclose") {
      viewerapp.eventBus.dispatch(type, { source: window });
      return;
    }
    viewerapp.eventBus.dispatch("find", {
      source: window,
      type: type.substring(findLen) as FindType,
      query: detail!.query,
      phraseSearch: true,
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
    if (!viewerapp.initialized) {
      return;
    }
    // Avoid attempting to needlessly reset the zoom level *twice* in a row,
    // when using the `Ctrl + 0` keyboard shortcut.
    if (
      type === "zoomreset" &&
      viewerapp.pdfViewer.currentScaleValue === DEFAULT_SCALE_VALUE
    ) {
      return;
    }
    viewerapp.eventBus.dispatch(type, { source: window });
  };

  for (const event of events) {
    window.addEventListener(event, <any> handleEvent);
  }
})();

(/* listenSaveEvent */ () => {
  const handleEvent = (
    { type, detail }: CustomEvent<EventMap["save"]>,
  ) => {
    if (!viewerapp.initialized) {
      return;
    }
    viewerapp.eventBus.dispatch("download", { source: window });
  };

  window.addEventListener("save", <any> handleEvent);
})();

(/* listenEditingEvent */ () => {
  const handleEvent = (
    { detail }: CustomEvent<EventMap["editingaction"]>,
  ) => {
    if (!viewerapp.initialized) {
      return;
    }
    viewerapp.eventBus.dispatch("editingaction", {
      source: window,
      name: detail.name,
    });
  };

  window.addEventListener("editingaction", <any> handleEvent);
})();

class FirefoxComDataRangeTransport extends PDFDataRangeTransport {
  override requestDataRange(begin: number, end: number) {
    FirefoxCom.request("requestDataRange", { begin, end });
  }

  override abort() {
    // Sync call to ensure abort is really started.
    FirefoxCom.requestSync("abortLoading", null);
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
    FirefoxCom.request("destroySandbox", null);
  }
}

class FirefoxExternalServices extends DefaultExternalServices {
  override updateFindControlState(data: FindControlState) {
    FirefoxCom.request("updateFindControlState", data);
  }

  override updateFindMatchesCount(data: MatchesCount) {
    FirefoxCom.request("updateFindMatchesCount", data);
  }

  override initPassiveLoading(callbacks: PassiveLoadingCbs) {
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
            callbacks.onError();
            break;
          }
          pdfDataRangeTransport = new FirefoxComDataRangeTransport(
            args.length,
            args.data,
            args.done,
            args.filename,
          );

          callbacks.onOpenWithTransport(
            args.pdfUrl,
            args.length,
            pdfDataRangeTransport,
          );
          break;
        case "range":
          pdfDataRangeTransport.onDataRange(args.begin, args.chunk);
          break;
        case "rangeProgress":
          // pdfDataRangeTransport.onDataProgress( args.loaded); //kkkk bug? ✅
          pdfDataRangeTransport.onDataProgress(args.loaded, args.total);
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
          callbacks.onProgress(args.loaded, args.total);
          break;
        case "complete":
          if (!args.data) {
            callbacks.onError(args.errorCode);
            break;
          }
          callbacks.onOpenWithData(args.data, args.filename);
          break;
      }
    });
    FirefoxCom.requestSync("initPassiveLoading", null);
  }

  override reportTelemetry(data: TelemetryData) {
    FirefoxCom.request("reportTelemetry", JSON.stringify(data));
  }

  override createDownloadManager() {
    return new DownloadManager();
  }

  override createPreferences() {
    return new FirefoxPreferences();
  }

  override updateEditorStates(data: EventMap["annotationeditorstateschanged"]) {
    FirefoxCom.request("updateEditorStates", data);
  }

  override createL10n(options?: { locale?: Locale }) {
    const mozL10n = document.mozL10n;
    // TODO refactor mozL10n.setExternalLocalizerServices
    return new MozL10n(mozL10n);
  }

  override createScripting(options: unknown) {
    return new FirefoxScripting();
  }

  override get supportsIntegratedFind() {
    const support = <boolean> FirefoxCom.requestSync("supportsIntegratedFind");
    return shadow(this, "supportsIntegratedFind", support);
  }

  override get supportsDocumentFonts() {
    const support = <boolean> FirefoxCom.requestSync("supportsDocumentFonts");
    return shadow(this, "supportsDocumentFonts", support);
  }

  override get supportedMouseWheelZoomModifierKeys() {
    const support = <{ ctrlKey: boolean; metaKey: boolean }> FirefoxCom
      .requestSync(
        "supportedMouseWheelZoomModifierKeys",
      );
    return shadow(this, "supportedMouseWheelZoomModifierKeys", support);
  }

  override get isInAutomation() {
    // Returns the value of `Cu.isInAutomation`, which is only `true` when e.g.
    // various test-suites are running in mozilla-central.
    const isInAutomation = <boolean> FirefoxCom.requestSync("isInAutomation");
    return shadow(this, "isInAutomation", isInAutomation);
  }
}
viewerapp.externalServices = new FirefoxExternalServices();

// l10n.js for Firefox extension expects services to be set.
document.mozL10n.setExternalLocalizerServices({
  getLocale() {
    return <Lowercase<Locale_1>> FirefoxCom.requestSync("getLocale", null);
  },

  getStrings() {
    return <_L10nData> FirefoxCom.requestSync("getStrings", null);
  },
});
/*80--------------------------------------------------------------------------*/

// Small subset of the webL10n API by Fabien Cazenave for PDF.js extension.
((window) => {
  let gL10nData: _L10nData | undefined;
  let gLanguage: Lowercase<Locale_1> | "" = "";
  let gExternalLocalizerServices: _ELS | undefined;
  let gReadyState = "loading";

  // fetch an l10n objects
  function getL10nData(key: string) {
    gL10nData ||= gExternalLocalizerServices!.getStrings();

    const data = gL10nData?.[key];
    if (!data) {
      console.warn("[l10n] #" + key + " missing for [" + gLanguage + "]");
    }
    return data;
  }

  // replace {{arguments}} with their values
  function substArguments(text: string, args?: WebL10nArgs) {
    if (!args) {
      return text;
    }
    return text.replace(
      /\{\{\s*(\w+)\s*\}\}/g,
      (all, name) => name in args ? args[name] : "{{" + name + "}}",
    );
  }

  // translate a string
  function translateString(key: string, args?: WebL10nArgs, fallback?: string) {
    var i = key.lastIndexOf(".");
    var name, property;
    if (i >= 0) {
      name = key.substring(0, i);
      property = key.substring(i + 1);
    } else {
      name = key;
      property = "textContent";
    }
    var data = getL10nData(name);
    var value = (data && data[property]) || fallback;
    if (!value) {
      return "{{" + key + "}}";
    }
    return substArguments(value, args);
  }

  // translate an HTML element
  function translateElement(element: HTMLElement) {
    if (!element || !element.dataset) {
      return;
    }

    // get the related l10n object
    var key = element.dataset.l10nId;
    var data = getL10nData(key!);
    if (!data) {
      return;
    }

    // get arguments (if any)
    // TODO: more flexible parser?
    var args;
    if (element.dataset.l10nArgs) {
      try {
        args = JSON.parse(element.dataset.l10nArgs);
      } catch (e) {
        console.warn("[l10n] could not parse arguments for #" + key + "");
      }
    }

    // translate element
    // TODO: security check?
    for (var k in data) {
      (<any> element)[k] = substArguments(data[k], args);
    }
  }

  // translate an HTML subtree
  function translateFragment(element: HTMLElement) {
    element = element || document.querySelector("html");

    // check all translatable children (= w/ a `data-l10n-id' attribute)
    var children = element.querySelectorAll("*[data-l10n-id]");
    var elementCount = children.length;
    for (var i = 0; i < elementCount; i++) {
      translateElement(<HTMLElement> children[i]);
    }

    // translate element itself if necessary
    if (element.dataset.l10nId) {
      translateElement(element);
    }
  }

  // Public API
  document.mozL10n = {
    // get a localized string
    get: translateString,

    // get the document language
    getLanguage() {
      return gLanguage;
    },

    // get the direction (ltr|rtl) of the current language
    getDirection() {
      // http://www.w3.org/International/questions/qa-scripts
      // Arabic, Hebrew, Farsi, Pashto, Urdu
      var rtlList = ["ar", "he", "fa", "ps", "ur"];

      // use the short language code for "full" codes like 'ar-sa' (issue 5440)
      var shortCode = gLanguage.split("-")[0];

      return rtlList.includes(shortCode) ? "rtl" : "ltr";
    },

    getReadyState() {
      return gReadyState;
    },

    setExternalLocalizerServices(externalLocalizerServices) {
      gExternalLocalizerServices = externalLocalizerServices;
      gLanguage = gExternalLocalizerServices.getLocale();
      gReadyState = "complete";
    },

    // translate an element or document fragment
    translate: translateFragment,
  };
})(this);
/*80--------------------------------------------------------------------------*/