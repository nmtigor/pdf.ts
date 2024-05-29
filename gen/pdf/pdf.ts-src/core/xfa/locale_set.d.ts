/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/xfa/locale_set.ts
 * @license Apache-2.0
 ******************************************************************************/
import { type XFAAttrs } from "./alias.js";
import { $buildXFAObject } from "./namespaces.js";
import { ContentObject, StringObject, XFAObject, XFAObjectArray } from "./xfa_object.js";
declare class CalendarSymbols extends XFAObject {
    dayNames: XFAObjectArray;
    eraNames: unknown;
    meridiemNames: unknown;
    monthNames: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
declare class CurrencySymbol extends StringObject {
    constructor(attributes: XFAAttrs);
}
declare class CurrencySymbols extends XFAObject {
    currencySymbol: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
declare class DatePattern extends StringObject {
    constructor(attributes: XFAAttrs);
}
declare class DatePatterns extends XFAObject {
    datePattern: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
declare class DateTimeSymbols extends ContentObject {
    constructor(attributes: XFAAttrs);
}
declare class Day extends StringObject {
    constructor(attributes: XFAAttrs);
}
declare class DayNames extends XFAObject {
    abbr: number;
    day: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
declare class Era extends StringObject {
    constructor(attributes: XFAAttrs);
}
declare class EraNames extends XFAObject {
    era: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
declare class Locale extends XFAObject {
    desc: string;
    calendarSymbols: unknown;
    currencySymbols: unknown;
    datePatterns: unknown;
    dateTimeSymbols: unknown;
    numberPatterns: unknown;
    numberSymbols: unknown;
    timePatterns: unknown;
    typeFaces: unknown;
    constructor(attributes: XFAAttrs);
}
declare class LocaleSet extends XFAObject {
    locale: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
declare class Meridiem extends StringObject {
    constructor(attributes: XFAAttrs);
}
declare class MeridiemNames extends XFAObject {
    meridiem: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
declare class Month extends StringObject {
    constructor(attributes: XFAAttrs);
}
declare class MonthNames extends XFAObject {
    abbr: number;
    month: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
declare class NumberPattern extends StringObject {
    constructor(attributes: XFAAttrs);
}
declare class NumberPatterns extends XFAObject {
    numberPattern: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
declare class NumberSymbol extends StringObject {
    constructor(attributes: XFAAttrs);
}
declare class NumberSymbols extends XFAObject {
    numberSymbol: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
declare class TimePattern extends StringObject {
    constructor(attributes: XFAAttrs);
}
declare class TimePatterns extends XFAObject {
    timePattern: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
declare class TypeFace extends XFAObject {
    constructor(attributes: XFAAttrs);
}
declare class TypeFaces extends XFAObject {
    typeFace: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
export type XFANsLocaleSet = typeof LocaleSetNamespace;
export declare const LocaleSetNamespace: {
    [$buildXFAObject](name: string, attributes: XFAAttrs): CalendarSymbols | CurrencySymbol | CurrencySymbols | DatePattern | DatePatterns | DateTimeSymbols | Day | DayNames | Era | EraNames | Locale | LocaleSet | Meridiem | MeridiemNames | Month | MonthNames | NumberPattern | NumberPatterns | NumberSymbol | NumberSymbols | TimePattern | TimePatterns | TypeFace | TypeFaces | undefined;
    calendarSymbols(attrs: XFAAttrs): CalendarSymbols;
    currencySymbol(attrs: XFAAttrs): CurrencySymbol;
    currencySymbols(attrs: XFAAttrs): CurrencySymbols;
    datePattern(attrs: XFAAttrs): DatePattern;
    datePatterns(attrs: XFAAttrs): DatePatterns;
    dateTimeSymbols(attrs: XFAAttrs): DateTimeSymbols;
    day(attrs: XFAAttrs): Day;
    dayNames(attrs: XFAAttrs): DayNames;
    era(attrs: XFAAttrs): Era;
    eraNames(attrs: XFAAttrs): EraNames;
    locale(attrs: XFAAttrs): Locale;
    localeSet(attrs: XFAAttrs): LocaleSet;
    meridiem(attrs: XFAAttrs): Meridiem;
    meridiemNames(attrs: XFAAttrs): MeridiemNames;
    month(attrs: XFAAttrs): Month;
    monthNames(attrs: XFAAttrs): MonthNames;
    numberPattern(attrs: XFAAttrs): NumberPattern;
    numberPatterns(attrs: XFAAttrs): NumberPatterns;
    numberSymbol(attrs: XFAAttrs): NumberSymbol;
    numberSymbols(attrs: XFAAttrs): NumberSymbols;
    timePattern(attrs: XFAAttrs): TimePattern;
    timePatterns(attrs: XFAAttrs): TimePatterns;
    typeFace(attrs: XFAAttrs): TypeFace;
    typeFaces(attrs: XFAAttrs): TypeFaces;
};
export {};
//# sourceMappingURL=locale_set.d.ts.map