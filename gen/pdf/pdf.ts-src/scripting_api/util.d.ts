import { ExternalCall } from "./initialization.js";
import { PDFObject, ScriptingData, SendData } from "./pdf_object.js";
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
declare type _Action = (value: string, data: _DateData) => void;
export declare type CFormat = 0 | 1 | 2 | string;
export declare class Util extends PDFObject<_SendUtilData> {
    _scandCache: Map<string, [string, _Action[]]>;
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