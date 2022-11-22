import { Locale_1, WebL10nArgs } from "../../3rd/webL10n/l10n.js";
import "../extensions/firefox/tools/l10n.js";
import { IDownloadManager } from "./interfaces.js";
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
     * @returns {*} The response.
     */
    static requestSync(action: string, data?: unknown): unknown;
    /**
     * Creates an event that the extension is listening for and will
     * asynchronously respond to.
     * @param action The action to trigger.
     * @param data The data to send.
     * @returns {Promise<any>} A promise that is resolved with the response data.
     */
    static requestAsync(action: string, data?: unknown): Promise<unknown>;
    /**
     * Creates an event that the extension is listening for and will, optionally,
     * asynchronously respond to.
     * @param action The action to trigger.
     * @param data The data to send.
     */
    static request(action: string, data?: unknown, callback?: (response: unknown) => void): void;
}
export declare class DownloadManager implements IDownloadManager {
    #private;
    /** @implement */
    downloadUrl(url: string, filename: string): void;
    /** @implement */
    downloadData(data: Uint8Array | Uint8ClampedArray, filename: string, contentType: string): void;
    /**
     * @implement
     * @return Indicating if the data was opened.
     */
    openOrDownloadData(element: HTMLElement, data: Uint8Array | Uint8ClampedArray, filename: string): boolean;
    /** @implement */
    download(blob: Blob, url: string, filename: string): void;
}
export {};
//# sourceMappingURL=firefoxcom.d.ts.map