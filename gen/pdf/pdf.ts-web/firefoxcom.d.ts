import type { IDownloadManager } from "./interfaces.js";
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
    openOrDownloadData(data: Uint8Array | Uint8ClampedArray, filename: string, dest?: string): boolean;
    /** @implement */
    download(blob: Blob, url: string, filename: string, options?: object): void;
}
export type NimbusExperimentData = {
    "download-button"?: unknown;
    "open-in-app-button"?: unknown;
};
//# sourceMappingURL=firefoxcom.d.ts.map