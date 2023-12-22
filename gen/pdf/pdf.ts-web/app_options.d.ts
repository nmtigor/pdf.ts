import { Locale } from "../../lib/Locale.js";
import { AnnotationEditorType, AnnotationMode, VerbosityLevel } from "../pdf.ts-src/pdf.js";
import { LinkTarget } from "./pdf_link_service.js";
import { CursorTool, ScrollMode, SidebarView, SpreadMode, TextLayerMode } from "./ui_utils.js";
export declare const enum OptionKind {
    BROWSER = 1,
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
type _DefaultOptions = typeof defaultOptions;
export type OptionName = keyof _DefaultOptions;
type _OptionType = number | string | boolean | Worker;
export type UserOptions = {
    [ON in OptionName]?: _OptionType | undefined;
};
export declare const compatibilityParams: UserOptions;
/**
 * NOTE: These options are used to generate the `default_preferences.json` file,
 *       see `OptionKind.PREFERENCE`, hence the values below must use only
 *       primitive types and cannot rely on any imported types.
 */
declare const defaultOptions: {
    canvasMaxAreaInBytes: {
        value: number;
        kind: number;
    };
    isInAutomation: {
        value: boolean;
        kind: OptionKind;
    };
    supportsDocumentFonts: {
        value: boolean;
        kind: OptionKind;
    };
    supportsIntegratedFind: {
        value: boolean;
        kind: OptionKind;
    };
    supportsMouseWheelZoomCtrlKey: {
        value: boolean;
        kind: OptionKind;
    };
    supportsMouseWheelZoomMetaKey: {
        value: boolean;
        kind: OptionKind;
    };
    supportsPinchToZoom: {
        value: boolean;
        kind: OptionKind;
    };
    annotationEditorMode: {
        value: AnnotationEditorType;
        kind: number;
    };
    annotationMode: {
        value: AnnotationMode;
        kind: number;
    };
    viewerCssTheme: {
        value: number | undefined;
        kind: OptionKind;
    };
    cursorToolOnLoad: {
        value: CursorTool;
        kind: number;
    };
    defaultUrl: {
        value: string | undefined;
        kind: OptionKind;
    };
    defaultZoomDelay: {
        value: number;
        kind: number;
    };
    defaultZoomValue: {
        value: string;
        kind: number;
    };
    disableHistory: {
        value: boolean;
        kind: OptionKind;
    };
    disablePageLabels: {
        value: boolean;
        kind: number;
    };
    disablePreferences: {
        value: boolean;
        kind: OptionKind;
    };
    enablePermissions: {
        value: boolean;
        kind: number;
    };
    enablePrintAutoRotate: {
        value: boolean;
        kind: number;
    };
    enableScripting: {
        value: boolean;
        kind: number;
    };
    externalLinkRel: {
        value: string;
        kind: OptionKind;
    };
    externalLinkTarget: {
        value: LinkTarget;
        kind: number;
    };
    historyUpdateUrl: {
        value: boolean;
        kind: number;
    };
    ignoreDestinationZoom: {
        value: boolean;
        kind: number;
    };
    imageResourcesPath: {
        value: string;
        kind: OptionKind;
    };
    locale: {
        value: Locale | undefined;
        kind: OptionKind;
    };
    maxCanvasPixels: {
        value: number;
        kind: OptionKind;
    };
    forcePageColors: {
        value: boolean;
        kind: number;
    };
    pageColorsBackground: {
        value: string;
        kind: number;
    };
    pageColorsForeground: {
        value: string;
        kind: number;
    };
    pdfBugEnabled: {
        value: boolean;
        kind: number;
    };
    printResolution: {
        value: number;
        kind: OptionKind;
    };
    sidebarViewOnLoad: {
        value: SidebarView;
        kind: number;
    };
    scrollModeOnLoad: {
        value: ScrollMode;
        kind: number;
    };
    spreadModeOnLoad: {
        value: SpreadMode;
        kind: number;
    };
    textLayerMode: {
        value: TextLayerMode;
        kind: number;
    };
    viewOnLoad: {
        value: ViewOnLoad;
        kind: number;
    };
    cMapPacked: {
        value: boolean;
        kind: OptionKind;
    };
    cMapUrl: {
        value: string;
        kind: OptionKind;
    };
    disableAutoFetch: {
        value: boolean;
        kind: number;
    };
    disableFontFace: {
        value: boolean;
        kind: number;
    };
    disableRange: {
        value: boolean;
        kind: number;
    };
    disableStream: {
        value: boolean;
        kind: number;
    };
    disableTelemetry: {
        value: boolean;
        kind: OptionKind;
    };
    docBaseUrl: {
        value: string | undefined;
        kind: OptionKind;
    };
    enableXfa: {
        value: boolean;
        kind: number;
    };
    fontExtraProperties: {
        value: boolean;
        kind: OptionKind;
    };
    isEvalSupported: {
        value: boolean;
        kind: OptionKind;
    };
    isOffscreenCanvasSupported: {
        value: boolean;
        kind: OptionKind;
    };
    maxImageSize: {
        value: number;
        kind: OptionKind;
    };
    pdfBug: {
        value: boolean;
        kind: OptionKind;
    };
    standardFontDataUrl: {
        value: string;
        kind: OptionKind;
    };
    verbosity: {
        value: VerbosityLevel;
        kind: OptionKind;
    };
    workerPort: {
        value: Worker | undefined;
        kind: OptionKind;
    };
    workerSrc: {
        value: string;
        kind: OptionKind;
    };
    sandboxBundleSrc: {
        value: string | undefined;
        kind: OptionKind;
    };
};
export declare abstract class AppOptions {
    #private;
    static get canvasMaxAreaInBytes(): number;
    static get isInAutomation(): boolean;
    static get supportsDocumentFonts(): boolean;
    static get supportsIntegratedFind(): boolean;
    static get supportsMouseWheelZoomCtrlKey(): boolean;
    static get supportsMouseWheelZoomMetaKey(): boolean;
    static get supportsPinchToZoom(): boolean;
    static get annotationEditorMode(): AnnotationEditorType;
    static get annotationMode(): AnnotationMode;
    static get viewerCssTheme(): number | undefined;
    static get cursorToolOnLoad(): CursorTool;
    static get defaultUrl(): string | undefined;
    static get defaultZoomDelay(): number;
    static get defaultZoomValue(): string;
    static get disableHistory(): boolean;
    static get disablePageLabels(): boolean;
    static get disablePreferences(): boolean;
    static get enablePermissions(): boolean;
    static get enablePrintAutoRotate(): boolean;
    static get enableScripting(): boolean;
    static get externalLinkRel(): string;
    static get externalLinkTarget(): LinkTarget;
    static get historyUpdateUrl(): boolean;
    static get ignoreDestinationZoom(): boolean;
    static get imageResourcesPath(): string;
    static get locale(): Locale | undefined;
    static get maxCanvasPixels(): number;
    static get forcePageColors(): boolean;
    static get pageColorsBackground(): string;
    static get pageColorsForeground(): string;
    static get pdfBugEnabled(): boolean;
    static get printResolution(): number;
    static get sidebarViewOnLoad(): SidebarView;
    static get scrollModeOnLoad(): ScrollMode;
    static get spreadModeOnLoad(): SpreadMode;
    static get textLayerMode(): TextLayerMode;
    static get viewOnLoad(): ViewOnLoad;
    static get cMapPacked(): boolean;
    static get cMapUrl(): string;
    static get disableAutoFetch(): boolean;
    static get disableFontFace(): boolean;
    static get disableRange(): boolean;
    static get disableStream(): boolean;
    static get disableTelemetry(): boolean;
    static get docBaseUrl(): string | undefined;
    static get enableXfa(): boolean;
    static get fontExtraProperties(): boolean;
    static get isEvalSupported(): boolean;
    static get isOffscreenCanvasSupported(): boolean;
    static get maxImageSize(): number;
    static get pdfBug(): boolean;
    static get standardFontDataUrl(): string;
    static get verbosity(): VerbosityLevel;
    static get workerPort(): Worker | undefined;
    static get workerSrc(): string;
    static get sandboxBundleSrc(): string | undefined;
    static getAll(kind?: OptionKind): UserOptions;
    static set<ON extends OptionName>(name: ON, value: _OptionType | undefined): void;
    static setAll(options: UserOptions, init?: boolean): void;
    static remove(name: OptionName): void;
}
export {};
//# sourceMappingURL=app_options.d.ts.map