import type { IDownloadManager } from "./interfaces.js";
export declare class DownloadManager implements IDownloadManager {
    #private;
    onerror?: (err: any) => void;
    /** @implement */
    downloadUrl(url: string, filename: string, _options?: object): void;
    /** @implement */
    downloadData(data: Uint8Array | Uint8ClampedArray, filename: string, contentType: string): void;
    /**
     * @implement
     * @return Indicating if the data was opened.
     */
    openOrDownloadData(data: Uint8Array | Uint8ClampedArray, filename: string, dest?: string): boolean;
    /** @implement */
    download(blob: Blob, url: string, filename: string, _options?: object): void;
}
//# sourceMappingURL=download_manager.d.ts.map