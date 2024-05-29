/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/firefoxcom.ts
 * @license Apache-2.0
 ******************************************************************************/
import { textnode } from "../../lib/dom.js";
import { GECKOVIEW, MOZCENTRAL, PDFJSDev } from "../../global.js";
import { isPdfFile, PDFDataRangeTransport } from "../pdf.ts-src/pdf.js";
import { BaseExternalServices } from "./external_services.js";
import { L10n } from "./l10n.js";
import { BasePreferences } from "./preferences.js";
import { DEFAULT_SCALE_VALUE } from "./ui_utils.js";
/*80--------------------------------------------------------------------------*/
/*#static*/  {
    throw new Error('Module "./firefoxcom.js" shall not be used outside MOZCENTRAL builds.');
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
let viewerApp = { initialized: false };
export function initCom(app) {
    viewerApp = app;
}
export class FirefoxCom {
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
     * @return {Promise<any>} A promise that is resolved with the response data.
     */
    static requestAsync(action, data) {
        return new Promise((resolve) => {
            this.request(action, data, resolve);
        });
    }
    /**
     * Creates an event that the extension is listening for and will, optionally,
     * asynchronously respond to.
     * @param action The action to trigger.
     * @param data The data to send.
     */
    static request(action, data, callback) {
        const request = textnode("");
        if (callback) {
            request.addEventListener("pdf.js.response", (event) => {
                const response = event.detail.response;
                event.target.remove();
                callback(response);
            }, { once: true });
        }
        document.documentElement.append(request);
        const sender = new CustomEvent("pdf.js.message", {
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
export class DownloadManager {
    #openBlobUrls = new WeakMap();
    /** @implement */
    downloadUrl(url, filename, options = {}) {
        FirefoxCom.request("download", {
            originalUrl: url,
            filename,
            options,
        });
    }
    /** @implement */
    downloadData(data, filename, contentType) {
        const blobUrl = URL.createObjectURL(new Blob([data], { type: contentType }));
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
    openOrDownloadData(data, filename, dest) {
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
            }
            catch (ex) {
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
    download(blob, url, filename, options = {}) {
        const blobUrl = URL.createObjectURL(blob);
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
    async _readFromStorage(prefObj) {
        return FirefoxCom.requestAsync("getPreferences", prefObj);
    }
}
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
( /* listenFindEvents */() => {
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
    const handleEvent = ({ type, detail }) => {
        if (!viewerApp.initialized) {
            return;
        }
        if (type === "findbarclose") {
            viewerApp.eventBus.dispatch(type, { source: window });
            return;
        }
        viewerApp.eventBus.dispatch("find", {
            source: window,
            type: type.substring(findLen),
            query: detail.query,
            caseSensitive: !!detail.caseSensitive,
            entireWord: !!detail.entireWord,
            highlightAll: !!detail.highlightAll,
            findPrevious: !!detail.findPrevious,
            matchDiacritics: !!detail.matchDiacritics,
        });
    };
    for (const event of events) {
        window.addEventListener(event, handleEvent);
    }
})();
( /* listenZoomEvents */() => {
    const events = ["zoomin", "zoomout", "zoomreset"];
    const handleEvent = ({ type, detail }) => {
        if (!viewerApp.initialized) {
            return;
        }
        // Avoid attempting to needlessly reset the zoom level *twice* in a row,
        // when using the `Ctrl + 0` keyboard shortcut.
        if (type === "zoomreset" &&
            viewerApp.pdfViewer.currentScaleValue === DEFAULT_SCALE_VALUE) {
            return;
        }
        viewerApp.eventBus.dispatch(type, { source: window });
    };
    for (const event of events) {
        window.addEventListener(event, handleEvent);
    }
})();
( /* listenSaveEvent */() => {
    const handleEvent = ({ type, detail }) => {
        if (!viewerApp.initialized) {
            return;
        }
        viewerApp.eventBus.dispatch("download", { source: window });
    };
    window.addEventListener("save", handleEvent);
})();
( /* listenEditingEvent */() => {
    const handleEvent = ({ detail }) => {
        if (!viewerApp.initialized) {
            return;
        }
        viewerApp.eventBus.dispatch("editingaction", {
            source: window,
            name: detail.name,
        });
    };
    window.addEventListener("editingaction", handleEvent);
})();
/*#static*/ 
class FirefoxComDataRangeTransport extends PDFDataRangeTransport {
    requestDataRange(begin, end) {
        FirefoxCom.request("requestDataRange", { begin, end });
    }
    // NOTE: This method is currently not invoked in the Firefox PDF Viewer.
    abort() {
        FirefoxCom.request("abortLoading", undefined);
    }
}
class FirefoxScripting {
    /** @implement */
    async createSandbox(data) {
        const success = await FirefoxCom.requestAsync("createSandbox", data);
        if (!success) {
            throw new Error("Cannot create sandbox.");
        }
    }
    /** @implement */
    async dispatchEventInSandbox(event) {
        FirefoxCom.request("dispatchEventInSandbox", event);
    }
    /** @implement */
    async destroySandbox() {
        FirefoxCom.request("destroySandbox", undefined);
    }
}
export class MLManager {
    guess(data) {
        return FirefoxCom.requestAsync("mlGuess", data);
    }
}
export class ExternalServices extends BaseExternalServices {
    updateFindControlState(data) {
        FirefoxCom.request("updateFindControlState", data);
    }
    updateFindMatchesCount(data) {
        FirefoxCom.request("updateFindMatchesCount", data);
    }
    initPassiveLoading() {
        let pdfDataRangeTransport;
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
                    pdfDataRangeTransport = new FirefoxComDataRangeTransport(args.length, args.data, args.done, args.filename);
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
        FirefoxCom.request("initPassiveLoading", undefined);
    }
    reportTelemetry(data) {
        FirefoxCom.request("reportTelemetry", data);
    }
    updateEditorStates(data) {
        FirefoxCom.request("updateEditorStates", data);
    }
    async createL10n() {
        const [localeProperties] = await Promise.all([
            FirefoxCom.requestAsync("getLocaleProperties", undefined),
            // document.l10n.ready, //kkkk bug?
        ]);
        return new L10n(localeProperties, document.l10n);
    }
    createScripting() {
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
    async getNimbusExperimentData() {
        /*#static*/  {
            return undefined;
        }
        const nimbusData = await FirefoxCom.requestAsync("getNimbusExperimentData", undefined);
        // return nimbusData && JSON.parse(nimbusData) as NimbusExperimentData;
        return nimbusData
            ? JSON.parse(nimbusData)
            : undefined;
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
//# sourceMappingURL=firefoxcom.js.map