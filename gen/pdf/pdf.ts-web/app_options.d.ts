import { RendererType, ScrollMode, SpreadMode } from "./ui_utils.js";
import { VerbosityLevel } from "../pdf.ts-src/shared/util.js";
export declare const compatibilityParams: any;
export declare const enum OptionKind {
    VIEWER = 2,
    API = 4,
    WORKER = 8,
    PREFERENCE = 128
}
export declare const enum ViewOnLoad {
    UNKNOWN = -1,
    PREVIOUS = 0,
    INITIAL = 1
}
/**
 * NOTE: These options are used to generate the `default_preferences.json` file,
 *       see `OptionKind.PREFERENCE`, hence the values below must use only
 *       primitive types and cannot rely on any imported types.
 */
declare const defaultOptions: {
    annotationMode: {
        /** @type {number} */
        value: number;
        kind: number;
    };
    cursorToolOnLoad: {
        /** @type {number} */
        value: number;
        kind: number;
    };
    defaultUrl: {
        /** @type {string} */
        value: string;
        kind: OptionKind;
    };
    defaultZoomValue: {
        /** @type {string} */
        value: string;
        kind: number;
    };
    disableHistory: {
        /** @type {boolean} */
        value: boolean;
        kind: OptionKind;
    };
    disablePageLabels: {
        /** @type {boolean} */
        value: boolean;
        kind: number;
    };
    disablePreferences: {
        /** @type {boolean} */
        value: boolean;
        kind: number;
    };
    enablePermissions: {
        /** @type {boolean} */
        value: boolean;
        kind: number;
    };
    enablePrintAutoRotate: {
        /** @type {boolean} */
        value: boolean;
        kind: number;
    };
    enableScripting: {
        /** @type {boolean} */
        value: boolean;
        kind: number;
    };
    externalLinkRel: {
        /** @type {string} */
        value: string;
        kind: OptionKind;
    };
    externalLinkTarget: {
        /** @type {number} */
        value: number;
        kind: number;
    };
    historyUpdateUrl: {
        /** @type {boolean} */
        value: boolean;
        kind: number;
    };
    ignoreDestinationZoom: {
        /** @type {boolean} */
        value: boolean;
        kind: number;
    };
    imageResourcesPath: {
        /** @type {string} */
        value: string;
        kind: OptionKind;
    };
    locale: {
        /** @type {string} */
        value: string;
        kind: number;
    };
    maxCanvasPixels: {
        /** @type {number} */
        value: number;
        compatibility: any;
        kind: OptionKind;
    };
    pdfBugEnabled: {
        /** @type {boolean} */
        value: boolean;
        kind: number;
    };
    printResolution: {
        /** @type {number} */
        value: number;
        kind: OptionKind;
    };
    renderer: {
        /** @type {RendererType} */
        value: RendererType;
        kind: OptionKind;
    };
    sidebarViewOnLoad: {
        /** @type {number} */
        value: number;
        kind: number;
    };
    scrollModeOnLoad: {
        /** @type {ScrollMode} */
        value: ScrollMode;
        kind: number;
    };
    spreadModeOnLoad: {
        /** @type {SpreadMode} */
        value: SpreadMode;
        kind: number;
    };
    textLayerMode: {
        /** @type {number} */
        value: number;
        kind: number;
    };
    useOnlyCssZoom: {
        /** @type {boolean} */
        value: boolean;
        kind: number;
    };
    viewerCssTheme: {
        /** @type {number} */
        value: number;
        kind: number;
    };
    viewOnLoad: {
        /** @type {ViewOnLoad} */
        value: ViewOnLoad;
        kind: number;
    };
    cMapPacked: {
        /** @type {boolean} */
        value: boolean;
        kind: OptionKind;
    };
    cMapUrl: {
        /** @type {string} */
        value: string;
        kind: OptionKind;
    };
    disableAutoFetch: {
        /** @type {boolean} */
        value: boolean;
        kind: number;
    };
    disableFontFace: {
        /** @type {boolean} */
        value: boolean;
        kind: number;
    };
    disableRange: {
        /** @type {boolean} */
        value: boolean;
        kind: number;
    };
    disableStream: {
        /** @type {boolean} */
        value: boolean;
        kind: number;
    };
    disableTelemetry: {
        /** @type {boolean} */
        value: boolean;
        kind: number;
    };
    docBaseUrl: {
        /** @type {string} */
        value: string;
        kind: OptionKind;
    };
    enableXfa: {
        /** @type {boolean} */
        value: boolean;
        kind: number;
    };
    fontExtraProperties: {
        /** @type {boolean} */
        value: boolean;
        kind: OptionKind;
    };
    isEvalSupported: {
        /** @type {boolean} */
        value: boolean;
        kind: OptionKind;
    };
    maxImageSize: {
        /** @type {number} */
        value: number;
        kind: OptionKind;
    };
    pdfBug: {
        /** @type {boolean} */
        value: boolean;
        kind: OptionKind;
    };
    standardFontDataUrl: {
        /** @type {string} */
        value: string;
        kind: OptionKind;
    };
    verbosity: {
        /** @type {VerbosityLevel} */
        value: VerbosityLevel;
        kind: OptionKind;
    };
    workerPort: {
        /** @type {Object} */
        value: Worker | undefined;
        kind: OptionKind;
    };
    workerSrc: {
        /** @type {string} */
        value: string;
        kind: OptionKind;
    };
    sandboxBundleSrc: {
        /** @type {string} */
        value: string;
        kind: number;
    };
};
declare type DefaultOptions = typeof defaultOptions;
export declare type OptionName = keyof DefaultOptions;
declare type OptionType<ON extends OptionName> = DefaultOptions[ON]["value"];
export declare type UserOptions = {
    [ON in OptionName]?: OptionType<ON>;
};
export declare abstract class AppOptions {
    static get<ON extends OptionName>(name: ON): OptionType<ON>;
    static getAll(kind?: OptionKind): UserOptions;
    static set<ON extends OptionName>(name: ON, value: OptionType<ON> | undefined): void;
    static setAll(options: UserOptions): void;
    static remove(name: OptionName): void;
    /**
     * @ignore
     */
    static _hasUserOptions(): boolean;
}
export {};
//# sourceMappingURL=app_options.d.ts.map