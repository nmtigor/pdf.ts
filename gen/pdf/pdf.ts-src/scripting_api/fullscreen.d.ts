import { PDFObject, ScriptingData, SendData } from "./pdf_object.js";
interface _SendFullScreenData extends SendData {
}
export interface ScriptingFullScreenData extends ScriptingData<_SendFullScreenData> {
}
export declare class FullScreen extends PDFObject<_SendFullScreenData> {
    _backgroundColor: unknown[];
    get backgroundColor(): unknown[];
    set backgroundColor(_: unknown[]);
    _clickAdvances: boolean;
    get clickAdvances(): boolean;
    set clickAdvances(_: boolean);
    _cursor: number;
    get cursor(): number;
    set cursor(_: number);
    _defaultTransition: string;
    get defaultTransition(): string;
    set defaultTransition(_: string);
    _escapeExits: boolean;
    get escapeExits(): boolean;
    set escapeExits(_: boolean);
    _isFullScreen: boolean;
    get isFullScreen(): boolean;
    set isFullScreen(_: boolean);
    _loop: boolean;
    get loop(): boolean;
    set loop(_: boolean);
    _timeDelay: number;
    get timeDelay(): number;
    set timeDelay(_: number);
    _usePageTiming: boolean;
    get usePageTiming(): boolean;
    set usePageTiming(_: boolean);
    _useTimer: boolean;
    get useTimer(): boolean;
    set useTimer(_: boolean);
    constructor(data: ScriptingFullScreenData);
    get transitions(): string[];
    set transitions(_: string[]);
}
export {};
//# sourceMappingURL=fullscreen.d.ts.map