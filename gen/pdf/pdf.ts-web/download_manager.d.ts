import { IDownloadManager } from "./interfaces.js";
export declare class DownloadManager implements IDownloadManager {
    _openBlobUrls: WeakMap<object, any>;
    onerror?: (err: any) => void;
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
//# sourceMappingURL=download_manager.d.ts.map