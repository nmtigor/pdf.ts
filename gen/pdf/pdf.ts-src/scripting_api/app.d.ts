import type { Doc } from "./doc.js";
import { EventDispatcher, type ScriptingEventData } from "./event.js";
import type { Field } from "./field.js";
import { FullScreen } from "./fullscreen.js";
import type { ExternalCall } from "./initialization.js";
import type { ScriptingData, SendData } from "./pdf_object.js";
import { PDFObject } from "./pdf_object.js";
import type { ScriptingProxyHandler } from "./proxy.js";
import { Thermometer } from "./thermometer.js";
export interface DocWrapped {
    obj: Doc;
    wrapped: Doc;
}
export interface FieldWrapped {
    obj: Field;
    wrapped: Field;
}
export interface SendAppData extends SendData {
    command: string;
    value?: string;
}
export interface AppInfo {
    platform: string;
    language: string;
}
export interface ScriptingAppData extends ScriptingData<SendAppData>, AppInfo {
    globalEval(expr: string): void;
    externalCall: ExternalCall;
    _document: DocWrapped;
    calculationOrder: string[] | undefined;
    proxyHandler: ScriptingProxyHandler;
}
interface Callback_ {
    callbackId: number;
    interval: boolean;
}
export declare class App extends PDFObject<SendAppData> {
    _constants?: Readonly<{
        align: Readonly<{
            readonly left: 0;
            readonly center: 1;
            readonly right: 2;
            readonly top: 3;
            readonly bottom: 4;
        }>;
    }>;
    get constants(): Readonly<{
        align: Readonly<{
            readonly left: 0;
            readonly center: 1;
            readonly right: 2;
            readonly top: 3;
            readonly bottom: 4;
        }>;
    }>;
    set constants(_: Readonly<{
        align: Readonly<{
            readonly left: 0;
            readonly center: 1;
            readonly right: 2;
            readonly top: 3;
            readonly bottom: 4;
        }>;
    }>);
    _focusRect: boolean;
    _fs?: FullScreen;
    get fs(): FullScreen;
    set fs(_: FullScreen);
    _language: string;
    _openInPlace: boolean;
    get openInPlace(): boolean;
    set openInPlace(val: boolean);
    _platform: string;
    get platform(): string;
    set platform(_: string);
    _runtimeHighlight: boolean;
    get runtimeHighlight(): boolean;
    set runtimeHighlight(val: boolean);
    _runtimeHighlightColor: string[];
    get runtimeHighlightColor(): string[];
    set runtimeHighlightColor(val: string[]);
    _thermometer?: Thermometer;
    get thermometer(): Thermometer;
    set thermometer(_: Thermometer);
    _toolbar: boolean;
    get toolbar(): boolean;
    set toolbar(val: boolean);
    _document: DocWrapped;
    _proxyHandler: ScriptingProxyHandler;
    _objects: Record<string, FieldWrapped>;
    _eventDispatcher: EventDispatcher;
    _timeoutIds: WeakMap<object, Callback_>;
    _timeoutIdsRegistry: FinalizationRegistry<Callback_> | undefined;
    _timeoutCallbackIds: Map<number, string>;
    _timeoutCallbackId: number;
    _globalEval: (expr: string) => void;
    _externalCall: ExternalCall;
    constructor(data: ScriptingAppData);
    _dispatchEvent(pdfEvent: ScriptingEventData): void;
    _registerTimeoutCallback(cExpr: string): number;
    _unregisterTimeoutCallback(id: number): void;
    _evalCallback({ callbackId, interval }: Callback_): void;
    _registerTimeout(callbackId: number, interval: boolean): any;
    _unregisterTimeout(timeout: object): void;
    _cleanTimeout({ callbackId, interval }: Callback_): void;
    static _getPlatform(platform: string): "WIN" | "MAC" | "UNIX";
    static _getLanguage(language: string): "CHS" | "CHT" | "DAN" | "DEU" | "ESP" | "FRA" | "ITA" | "KOR" | "JPN" | "NLD" | "NOR" | "PTB" | "ENU" | "SUO" | "SVE";
    get activeDocs(): Doc[];
    set activeDocs(_: Doc[]);
    get calculate(): boolean;
    set calculate(calculate: boolean);
    get focusRect(): boolean;
    set focusRect(val: boolean);
    get formsVersion(): number;
    set formsVersion(_: number);
    get fromPDFConverters(): never[];
    set fromPDFConverters(_: never[]);
    get language(): string;
    set language(_: string);
    get media(): undefined;
    set media(_: undefined);
    get monitors(): never[];
    set monitors(_: never[]);
    get numPlugins(): number;
    set numPlugins(_: number);
    get plugins(): never[];
    set plugins(_: never[]);
    get printColorProfiles(): never[];
    set printColorProfiles(_: never[]);
    get printerNames(): never[];
    set printerNames(_: never[]);
    get toolbarHorizontal(): boolean;
    set toolbarHorizontal(value: boolean);
    get toolbarVertical(): boolean;
    set toolbarVertical(value: boolean);
    get viewerType(): string;
    set viewerType(_: string);
    get viewerVariation(): string;
    set viewerVariation(_: string);
    get viewerVersion(): number;
    set viewerVersion(_: number);
    addMenuItem(): void;
    addSubMenu(): void;
    addToolButton(): void;
    alert(cMsg: string | {
        cMsg: string;
        nType: number;
    }, nIcon?: number, nType?: number, cTitle?: string, oDoc?: undefined, oCheckbox?: undefined): 0 | 4 | 1 | 3;
    beep(): void;
    beginPriv(): void;
    browseForDoc(): void;
    clearInterval(oInterval: object): void;
    clearTimeOut(oTime: object): void;
    endPriv(): void;
    execDialog(): void;
    execMenuItem(item: string): void;
    getNthPlugInName(): void;
    getPath(): void;
    goBack(): void;
    goForward(): void;
    hideMenuItem(): void;
    hideToolbarButton(): void;
    launchURL(): void;
    listMenuItems(): void;
    listToolbarButtons(): void;
    loadPolicyFile(): void;
    mailGetAddrs(): void;
    mailMsg(): void;
    newDoc(): void;
    newCollection(): void;
    newFDF(): void;
    openDoc(): void;
    openFDF(): void;
    popUpMenu(): void;
    popUpMenuEx(): void;
    removeToolButton(): void;
    response(cQuestion: string | {
        cQuestion: string;
        cDefault: string;
    }, cTitle?: string, cDefault?: string, bPassword?: string, cLabel?: string): string | null;
    setInterval(cExpr: string | {
        cExpr: string;
        nMilliseconds?: number;
    }, nMilliseconds?: number): any;
    setTimeOut(cExpr: string | {
        cExpr: string;
        nMilliseconds?: number;
    }, nMilliseconds?: number): any;
    trustedFunction(): void;
    trustPropagatorFunction(): void;
}
export {};
//# sourceMappingURL=app.d.ts.map