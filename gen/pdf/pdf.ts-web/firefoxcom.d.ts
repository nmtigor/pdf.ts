/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/firefoxcom.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { FindControlState, PDFViewerApplication } from "./app.js";
import type { UserOptions } from "./app_options.js";
import type { EventMap } from "./event_utils.js";
import { BaseExternalServices } from "./external_services.js";
import type { CreateSandboxP, EventInSandBox, IDownloadManager, IScripting } from "./interfaces.js";
import { L10n } from "./l10n.js";
import type { MatchesCount } from "./pdf_find_controller.js";
import { BasePreferences } from "./preferences.js";
export declare function initCom(app: PDFViewerApplication): void;
export declare class FirefoxCom {
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
export declare class Preferences extends BasePreferences {
    /** @implement */
    protected _readFromStorage(prefObj: {
        prefs: UserOptions;
    }): Promise<{
        prefs: UserOptions;
    }>;
}
declare class FirefoxScripting implements IScripting {
    /** @implement */
    createSandbox(data: CreateSandboxP): Promise<void>;
    /** @implement */
    dispatchEventInSandbox(event: EventInSandBox): Promise<void>;
    /** @implement */
    destroySandbox(): Promise<void>;
}
export type NimbusExperimentData = {
    "download-button"?: unknown;
    "open-in-app-button"?: unknown;
};
export declare class MLManager {
    guess(data: unknown): Promise<any>;
}
export declare class ExternalServices extends BaseExternalServices {
    updateFindControlState(data: FindControlState): void;
    updateFindMatchesCount(data: MatchesCount): void;
    initPassiveLoading(): void;
    reportTelemetry(data: EventMap["reporttelemetry"]["details"]): void;
    updateEditorStates(data: EventMap["annotationeditorstateschanged"]): void;
    createL10n(): Promise<L10n>;
    createScripting(): FirefoxScripting;
    getNimbusExperimentData(): Promise<NimbusExperimentData | undefined>;
}
export {};
//# sourceMappingURL=firefoxcom.d.ts.map