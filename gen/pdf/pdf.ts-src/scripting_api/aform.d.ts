import { App } from "./app.js";
import { Color } from "./color.js";
import { Doc } from "./doc.js";
import { Event } from "./event.js";
import { CFormat, Util } from "./util.js";
declare type _CFunction = "AVG" | "SUM" | "PRD" | "MIN" | "MAX";
export declare class AForm {
    _document: Doc;
    _app: App;
    _util: Util;
    _color: Color;
    _dateFormats: string[];
    _timeFormats: string[];
    /**
     * The e-mail address regex below originates from:
     * https://html.spec.whatwg.org/multipage/input.html#valid-e-mail-address
     */
    _emailRegex: RegExp;
    constructor(document: Doc, app: App, util: Util, color: Color);
    _mkTargetName(event: Event): string;
    _parseDate(cFormat: CFormat, cDate: string): Date | undefined;
    AFMergeChange(event?: Event): string | undefined;
    AFParseDateEx(cString: string, cOrder: CFormat): Date | undefined;
    AFExtractNums(str: string | number): number[] | RegExpMatchArray | undefined;
    AFMakeNumber(str: string | number): number | undefined;
    AFMakeArrayFromList(string: string | string[]): string[];
    AFNumber_Format(nDec: number, sepStyle: number, negStyle: number, currStyle: unknown, /* unused */ strCurrency: string, bCurrencyPrepend: boolean): void;
    AFNumber_Keystroke(nDec: number, /* unused */ sepStyle: number, negStyle: number, /* unused */ currStyle: unknown, /* unused */ strCurrency: string, /* unused */ bCurrencyPrepend: boolean): void;
    AFPercent_Format(nDec: unknown, sepStyle: unknown, percentPrepend?: boolean): void;
    AFPercent_Keystroke(nDec: number, sepStyle: number): void;
    AFDate_FormatEx(cFormat: CFormat): void;
    AFDate_Format(pdf: number): void;
    AFDate_KeystrokeEx(cFormat: CFormat): void;
    AFDate_Keystroke(pdf: number): void;
    AFRange_Validate(bGreaterThan: boolean, nGreaterThan: number, bLessThan: boolean, nLessThan: number): void;
    AFSimple(cFunction: _CFunction, nValue1: string | number, nValue2: string | number): number;
    AFSimple_Calculate(cFunction: _CFunction, cFields: string[]): void;
    AFSpecial_Format(psf: number): void;
    AFSpecial_KeystrokeEx(cMask: string): void;
    AFSpecial_Keystroke(psf: number): void;
    AFTime_FormatEx(cFormat: CFormat): void;
    AFTime_Format(pdf: number): void;
    AFTime_KeystrokeEx(cFormat: CFormat): void;
    AFTime_Keystroke(pdf: number): void;
    eMailValidate(str: string): boolean;
}
export {};
//# sourceMappingURL=aform.d.ts.map