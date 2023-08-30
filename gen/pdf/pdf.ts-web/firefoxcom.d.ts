import { Locale_1, WebL10nArgs } from "../../3rd/webL10n-2015-10-24/l10n.js";
import type { IDownloadManager } from "./interfaces.js";
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
export declare class FirefoxCom {
    /**
     * Creates an event that the extension is listening for and will
     * synchronously respond to.
     * NOTE: It is recommended to use requestAsync() instead since one day we may
     *       not be able to synchronously reply.
     * @param action The action to trigger.
     * @param data The data to send.
     * @return {*} The response.
     */
    static requestSync(action: string, data?: unknown): unknown;
    /**
     * Creates an event that the extension is listening for and will
     * asynchronously respond to.
     * @param action The action to trigger.
     * @param data The data to send.
     * @return {Promise<any>} A promise that is resolved with the response data.
     */
    static requestAsync<D extends Record<string, any> | string>(action: string, data?: D): Promise<D>;
    /**
     * Creates an event that the extension is listening for and will, optionally,
     * asynchronously respond to.
     * @param action The action to trigger.
     * @param data The data to send.
     */
    static request<D extends Record<string, any> | string>(action: string, data?: D, callback?: (response: D) => void): void;
}
export declare class DownloadManager implements IDownloadManager {
    #private;
    /** @implement */
    downloadUrl(url: string, filename: string, options?: object): void;
    /** @implement */
    downloadData(data: Uint8Array | Uint8ClampedArray, filename: string, contentType: string): void;
    /**
     * @implement
     * @return Indicating if the data was opened.
     */
    openOrDownloadData(element: HTMLElement, data: Uint8Array | Uint8ClampedArray, filename: string): boolean;
    /** @implement */
    download(blob: Blob, url: string, filename: string, options?: object): void;
}
export type NimbusExperimentData = {
    "download-button"?: unknown;
    "open-in-app-button"?: unknown;
};
export {};
//# sourceMappingURL=firefoxcom.d.ts.map