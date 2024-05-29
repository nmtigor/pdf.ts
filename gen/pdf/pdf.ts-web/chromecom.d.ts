/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/chromecom.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { PDFViewerApplication } from "./app.js";
import { UserOptions } from "./app_options.js";
import { BaseExternalServices } from "./external_services.js";
import { GenericL10n } from "./genericl10n.js";
import type { IScripting } from "./interfaces.js";
import { BasePreferences } from "./preferences.js";
export declare function initCom(app: PDFViewerApplication): void;
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
     * @param callback A callback with resolved URL and file length.
     */
    resolvePDFFile(file: string, callback: _ResolvePDFFileCb): void;
};
export declare class Preferences extends BasePreferences {
    protected _writeToStorage(prefObj: UserOptions): Promise<void>;
    /** @implement */
    protected _readFromStorage(prefObj: {
        prefs: UserOptions;
    }): Promise<{
        prefs: UserOptions;
    }>;
}
export declare class MLManager {
    guess(): Promise<undefined>;
}
export declare class ExternalServices extends BaseExternalServices {
    initPassiveLoading(): void;
    createL10n(): Promise<GenericL10n>;
    createScripting(): IScripting;
}
export {};
//# sourceMappingURL=chromecom.d.ts.map