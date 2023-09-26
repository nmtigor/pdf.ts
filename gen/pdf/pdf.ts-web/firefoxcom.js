/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
import { GECKOVIEW, MOZCENTRAL, PDFJSDev } from "../../global.js";
import { isPdfFile, PDFDataRangeTransport, shadow } from "../pdf.ts-src/pdf.js";
import { DefaultExternalServices, viewerApp } from "./app.js";
import { getL10nFallback } from "./l10n_utils.js";
import { BasePreferences } from "./preferences.js";
import { DEFAULT_SCALE_VALUE } from "./ui_utils.js";
/*80--------------------------------------------------------------------------*/
/*#static*/  {
    throw new Error('Module "./firefoxcom.js" shall not be used outside MOZCENTRAL builds.');
}
export class FirefoxCom {
    /**
     * Creates an event that the extension is listening for and will
     * synchronously respond to.
     * NOTE: It is recommended to use requestAsync() instead since one day we may
     *       not be able to synchronously reply.
     * @param action The action to trigger.
     * @param data The data to send.
     * @return {*} The response.
     */
    static requestSync(action, data) {
        const request = document.createTextNode("");
        document.documentElement.append(request);
        const sender = new CustomEvent("pdf.js.message", {
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
        const request = document.createTextNode("");
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
                sync: false,
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
    openOrDownloadData(element, data, filename) {
        const isPdfData = isPdfFile(filename);
        const contentType = isPdfData ? "application/pdf" : "";
        if (isPdfData) {
            let blobUrl = this.#openBlobUrls.get(element);
            if (!blobUrl) {
                blobUrl = URL.createObjectURL(new Blob([data], { type: contentType }));
                this.#openBlobUrls.set(element, blobUrl);
            }
            // Let Firefox's content handler catch the URL and display the PDF.
            const viewerUrl = blobUrl + "#filename=" + encodeURIComponent(filename);
            try {
                window.open(viewerUrl);
                return true;
            }
            catch (ex) {
                console.error(`openOrDownloadData: ${ex}`);
                // Release the `blobUrl`, since opening it failed, and fallback to
                // downloading the PDF file.
                URL.revokeObjectURL(blobUrl);
                this.#openBlobUrls.delete(element);
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
class FirefoxPreferences extends BasePreferences {
    /** @implement */
    async _readFromStorage(prefObj) {
        return FirefoxCom.requestAsync("getPreferences", prefObj);
    }
}
class MozL10n {
    mozL10n;
    constructor(mozL10n) {
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
    async get(key, args, fallback = getL10nFallback(key, args)) {
        return this.mozL10n.get(key, args, fallback);
    }
    /** @implement */
    async translate(element) {
        this.mozL10n.translate(element);
    }
}
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
    abort() {
        // Sync call to ensure abort is really started.
        FirefoxCom.requestSync("abortLoading", null);
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
class FirefoxExternalServices extends DefaultExternalServices {
    updateFindControlState(data) {
        FirefoxCom.request("updateFindControlState", data);
    }
    updateFindMatchesCount(data) {
        FirefoxCom.request("updateFindMatchesCount", data);
    }
    initPassiveLoading(callbacks) {
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
                        callbacks.onError();
                        break;
                    }
                    pdfDataRangeTransport = new FirefoxComDataRangeTransport(args.length, args.data, args.done, args.filename);
                    callbacks.onOpenWithTransport(pdfDataRangeTransport);
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
    reportTelemetry(data) {
        FirefoxCom.request("reportTelemetry", JSON.stringify(data));
    }
    createDownloadManager() {
        return new DownloadManager();
    }
    createPreferences() {
        return new FirefoxPreferences();
    }
    updateEditorStates(data) {
        FirefoxCom.request("updateEditorStates", data);
    }
    createL10n(options) {
        const mozL10n = document.mozL10n;
        // TODO refactor mozL10n.setExternalLocalizerServices
        return new MozL10n(mozL10n);
    }
    createScripting(options) {
        return new FirefoxScripting();
    }
    get supportsPinchToZoom() {
        const support = !!FirefoxCom.requestSync("supportsPinchToZoom");
        return shadow(this, "supportsPinchToZoom", support);
    }
    get supportsIntegratedFind() {
        const support = FirefoxCom.requestSync("supportsIntegratedFind");
        return shadow(this, "supportsIntegratedFind", support);
    }
    get supportsDocumentFonts() {
        const support = FirefoxCom.requestSync("supportsDocumentFonts");
        return shadow(this, "supportsDocumentFonts", support);
    }
    get supportedMouseWheelZoomModifierKeys() {
        const support = FirefoxCom
            .requestSync("supportedMouseWheelZoomModifierKeys");
        return shadow(this, "supportedMouseWheelZoomModifierKeys", support);
    }
    get isInAutomation() {
        // Returns the value of `Cu.isInAutomation`, which is only `true` when e.g.
        // various test-suites are running in mozilla-central.
        const isInAutomation = FirefoxCom.requestSync("isInAutomation");
        return shadow(this, "isInAutomation", isInAutomation);
    }
    static get canvasMaxAreaInBytes() {
        const maxArea = FirefoxCom.requestSync("getCanvasMaxArea");
        return shadow(this, "canvasMaxAreaInBytes", maxArea);
    }
    static async getNimbusExperimentData() {
        const nimbusData = await FirefoxCom.requestAsync("getNimbusExperimentData", undefined);
        return nimbusData && JSON.parse(nimbusData);
    }
}
viewerApp.externalServices = new FirefoxExternalServices();
// l10n.js for Firefox extension expects services to be set.
document.mozL10n.setExternalLocalizerServices({
    getLocale() {
        return FirefoxCom.requestSync("getLocale", null);
    },
    getStrings() {
        return FirefoxCom.requestSync("getStrings", null);
    },
});
/*80--------------------------------------------------------------------------*/
// Small subset of the webL10n API by Fabien Cazenave for PDF.js extension.
((window) => {
    let gL10nData;
    let gLanguage = "";
    let gExternalLocalizerServices;
    let gReadyState = "loading";
    // fetch an l10n objects
    function getL10nData(key) {
        gL10nData ||= gExternalLocalizerServices.getStrings();
        const data = gL10nData?.[key];
        if (!data) {
            console.warn("[l10n] #" + key + " missing for [" + gLanguage + "]");
        }
        return data;
    }
    // replace {{arguments}} with their values
    function substArguments(text, args) {
        if (!args) {
            return text;
        }
        return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (all, name) => name in args ? args[name] : "{{" + name + "}}");
    }
    // translate a string
    function translateString(key, args, fallback) {
        var i = key.lastIndexOf(".");
        var name, property;
        if (i >= 0) {
            name = key.substring(0, i);
            property = key.substring(i + 1);
        }
        else {
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
    function translateElement(element) {
        if (!element || !element.dataset) {
            return;
        }
        // get the related l10n object
        var key = element.dataset.l10nId;
        var data = getL10nData(key);
        if (!data) {
            return;
        }
        // get arguments (if any)
        // TODO: more flexible parser?
        var args;
        if (element.dataset.l10nArgs) {
            try {
                args = JSON.parse(element.dataset.l10nArgs);
            }
            catch (e) {
                console.warn("[l10n] could not parse arguments for #" + key + "");
            }
        }
        // translate element
        // TODO: security check?
        for (var k in data) {
            element[k] = substArguments(data[k], args);
        }
    }
    // translate an HTML subtree
    function translateFragment(element) {
        element = element || document.querySelector("html");
        // check all translatable children (= w/ a `data-l10n-id' attribute)
        var children = element.querySelectorAll("*[data-l10n-id]");
        var elementCount = children.length;
        for (var i = 0; i < elementCount; i++) {
            translateElement(children[i]);
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
//# sourceMappingURL=firefoxcom.js.map