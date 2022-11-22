import { OverlayManager } from "./overlay_manager.js";
type _ResolvePDFFileCb = (url: string, length?: number, originalUrl?: string) => void;
type _GetOriginCb = (origin?: string) => void;
export declare const ChromeCom: {
    /**
     * Creates an event that the extension is listening for and will
     * asynchronously respond by calling the callback.
     *
     * @param action The action to trigger.
     * @param data The data to send.
     * @param {Function} [callback] Response callback that will be called with
     *   one data argument. When the request cannot be handled, the callback is
     *   immediately invoked with no arguments.
     */
    request(action: string, data: string | {
        newTab: boolean;
    } | undefined, callback?: _GetOriginCb | ((_?: boolean) => void) | undefined): void;
    /**
     * Resolves a PDF file path and attempts to detects length.
     *
     * @param file Absolute URL of PDF file.
     * @param overlayManager Manager for the viewer overlays.
     * @param callback A callback with resolved URL and file length.
     */
    resolvePDFFile(file: string, overlayManager: OverlayManager, callback: _ResolvePDFFileCb): void;
};
export {};
//# sourceMappingURL=chromecom.d.ts.map