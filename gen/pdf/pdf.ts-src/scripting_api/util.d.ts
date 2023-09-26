import type { ExternalCall } from "./initialization.js";
import type { ScriptingData, SendData } from "./pdf_object.js";
import { PDFObject } from "./pdf_object.js";
interface _SendUtilData extends SendData {
}
export interface ScriptingUtilData extends ScriptingData<_SendUtilData> {
    externalCall: ExternalCall;
}
interface _DateData {
    year: number;
    month: number;
    day: number;
    dayOfWeek?: number;
    hours: number;
    minutes: number;
    seconds: number;
    am?: boolean;
}
type Action_ = (value: string, data: _DateData) => void;
export type CFormat = 0 | 1 | 2 | string;
export declare class Util extends PDFObject<_SendUtilData> {
    _scandCache: Map<string, [string, Action_[]]>;
    _months: string[];
    _days: string[];
    readonly MILLISECONDS_IN_DAY = 86400000;
    readonly MILLISECONDS_IN_WEEK = 604800000;
    /**
     * used with crackURL
     */
    _externalCall: ExternalCall;
    constructor(data: ScriptingUtilData);
    printf(...args: [string, ...number[]]): string;
    iconStreamFromIcon(): void;
    printd(cFormat: CFormat, oDate: Date): string;
    printx(cFormat: string, cSource: string): string;
    scand(cFormat: CFormat, cDate: number | string | Date): Date | undefined;
    spansToXML(): void;
    stringFromStream(): void;
    xmlToSpans(): void;
}
export {};
//# sourceMappingURL=util.d.ts.map