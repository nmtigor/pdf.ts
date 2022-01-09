import { IDownloadManager } from "./interfaces.js";
export declare class DownloadManager implements IDownloadManager {
    _openBlobUrls: WeakMap<object, any>;
    onerror?: (err: any) => void;
    downloadUrl(url: string, filename: string): void;
    downloadData(data: Uint8Array | Uint8ClampedArray, filename: string, contentType: string): void;
    /**
     * @return Indicating if the data was opened.
     */
    openOrDownloadData(element: HTMLElement, data: Uint8Array | Uint8ClampedArray | undefined, filename: string): boolean;
    /**
     * @param sourceEventType Used to signal what triggered the download.
     *   The version of PDF.js integrated with Firefox uses this to to determine
     *   which dialog to show. "save" triggers "save as" and "download" triggers
     *   the "open with" dialog.
     */
    download(blob: Blob, url: string, filename: string, sourceEventType?: string): void;
}
//# sourceMappingURL=download_manager.d.ts.map