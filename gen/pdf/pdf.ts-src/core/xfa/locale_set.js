/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/xfa/locale_set.ts
 * @license Apache-2.0
 ******************************************************************************/
import { $buildXFAObject, NamespaceIds } from "./namespaces.js";
import { getInteger, getStringOption } from "./utils.js";
import { ContentObject, StringObject, XFAObject, XFAObjectArray, } from "./xfa_object.js";
/*80--------------------------------------------------------------------------*/
const LOCALE_SET_NS_ID = NamespaceIds.localeSet.id;
class CalendarSymbols extends XFAObject {
    dayNames = new XFAObjectArray(2);
    eraNames;
    meridiemNames;
    monthNames = new XFAObjectArray(2);
    constructor(attributes) {
        super(LOCALE_SET_NS_ID, "calendarSymbols", /* hasChildren = */ true);
        this.name = "gregorian";
    }
}
class CurrencySymbol extends StringObject {
    constructor(attributes) {
        super(LOCALE_SET_NS_ID, "currencySymbol");
        this.name = getStringOption(attributes.name, [
            "symbol",
            "isoname",
            "decimal",
        ]);
    }
}
class CurrencySymbols extends XFAObject {
    currencySymbol = new XFAObjectArray(3);
    constructor(attributes) {
        super(LOCALE_SET_NS_ID, "currencySymbols", /* hasChildren = */ true);
    }
}
class DatePattern extends StringObject {
    constructor(attributes) {
        super(LOCALE_SET_NS_ID, "datePattern");
        this.name = getStringOption(attributes.name, [
            "full",
            "long",
            "med",
            "short",
        ]);
    }
}
class DatePatterns extends XFAObject {
    datePattern = new XFAObjectArray(4);
    constructor(attributes) {
        super(LOCALE_SET_NS_ID, "datePatterns", /* hasChildren = */ true);
    }
}
class DateTimeSymbols extends ContentObject {
    // TODO: spec unclear about the format of the array.
    constructor(attributes) {
        super(LOCALE_SET_NS_ID, "dateTimeSymbols");
    }
}
class Day extends StringObject {
    constructor(attributes) {
        super(LOCALE_SET_NS_ID, "day");
    }
}
class DayNames extends XFAObject {
    abbr;
    day = new XFAObjectArray(7);
    constructor(attributes) {
        super(LOCALE_SET_NS_ID, "dayNames", /* hasChildren = */ true);
        this.abbr = getInteger({
            data: attributes.abbr,
            defaultValue: 0,
            validate: (x) => x === 1,
        });
    }
}
class Era extends StringObject {
    constructor(attributes) {
        super(LOCALE_SET_NS_ID, "era");
    }
}
class EraNames extends XFAObject {
    era = new XFAObjectArray(2);
    constructor(attributes) {
        super(LOCALE_SET_NS_ID, "eraNames", /* hasChildren = */ true);
    }
}
class Locale extends XFAObject {
    desc;
    calendarSymbols;
    currencySymbols;
    datePatterns;
    dateTimeSymbols;
    numberPatterns;
    numberSymbols;
    timePatterns;
    typeFaces;
    constructor(attributes) {
        super(LOCALE_SET_NS_ID, "locale", /* hasChildren = */ true);
        this.desc = attributes.desc || "";
        this.name = "isoname";
    }
}
class LocaleSet extends XFAObject {
    locale = new XFAObjectArray();
    constructor(attributes) {
        super(LOCALE_SET_NS_ID, "localeSet", /* hasChildren = */ true);
    }
}
class Meridiem extends StringObject {
    constructor(attributes) {
        super(LOCALE_SET_NS_ID, "meridiem");
    }
}
class MeridiemNames extends XFAObject {
    meridiem = new XFAObjectArray(2);
    constructor(attributes) {
        super(LOCALE_SET_NS_ID, "meridiemNames", /* hasChildren = */ true);
    }
}
class Month extends StringObject {
    constructor(attributes) {
        super(LOCALE_SET_NS_ID, "month");
    }
}
class MonthNames extends XFAObject {
    abbr;
    month = new XFAObjectArray(12);
    constructor(attributes) {
        super(LOCALE_SET_NS_ID, "monthNames", /* hasChildren = */ true);
        this.abbr = getInteger({
            data: attributes.abbr,
            defaultValue: 0,
            validate: (x) => x === 1,
        });
    }
}
class NumberPattern extends StringObject {
    constructor(attributes) {
        super(LOCALE_SET_NS_ID, "numberPattern");
        this.name = getStringOption(attributes.name, [
            "full",
            "long",
            "med",
            "short",
        ]);
    }
}
class NumberPatterns extends XFAObject {
    numberPattern = new XFAObjectArray(4);
    constructor(attributes) {
        super(LOCALE_SET_NS_ID, "numberPatterns", /* hasChildren = */ true);
    }
}
class NumberSymbol extends StringObject {
    constructor(attributes) {
        super(LOCALE_SET_NS_ID, "numberSymbol");
        this.name = getStringOption(attributes.name, [
            "decimal",
            "grouping",
            "percent",
            "minus",
            "zero",
        ]);
    }
}
class NumberSymbols extends XFAObject {
    numberSymbol = new XFAObjectArray(5);
    constructor(attributes) {
        super(LOCALE_SET_NS_ID, "numberSymbols", /* hasChildren = */ true);
    }
}
class TimePattern extends StringObject {
    constructor(attributes) {
        super(LOCALE_SET_NS_ID, "timePattern");
        this.name = getStringOption(attributes.name, [
            "full",
            "long",
            "med",
            "short",
        ]);
    }
}
class TimePatterns extends XFAObject {
    timePattern = new XFAObjectArray(4);
    constructor(attributes) {
        super(LOCALE_SET_NS_ID, "timePatterns", /* hasChildren = */ true);
    }
}
class TypeFace extends XFAObject {
    constructor(attributes) {
        super(LOCALE_SET_NS_ID, "typeFace", /* hasChildren = */ true);
        this.name = attributes.name || "";
    }
}
class TypeFaces extends XFAObject {
    typeFace = new XFAObjectArray();
    constructor(attributes) {
        super(LOCALE_SET_NS_ID, "typeFaces", /* hasChildren = */ true);
    }
}
export const LocaleSetNamespace = {
    [$buildXFAObject](name, attributes) {
        if (Object.hasOwn(LocaleSetNamespace, name)) {
            return LocaleSetNamespace[name](attributes);
        }
        return undefined;
    },
    calendarSymbols(attrs) {
        return new CalendarSymbols(attrs);
    },
    currencySymbol(attrs) {
        return new CurrencySymbol(attrs);
    },
    currencySymbols(attrs) {
        return new CurrencySymbols(attrs);
    },
    datePattern(attrs) {
        return new DatePattern(attrs);
    },
    datePatterns(attrs) {
        return new DatePatterns(attrs);
    },
    dateTimeSymbols(attrs) {
        return new DateTimeSymbols(attrs);
    },
    day(attrs) {
        return new Day(attrs);
    },
    dayNames(attrs) {
        return new DayNames(attrs);
    },
    era(attrs) {
        return new Era(attrs);
    },
    eraNames(attrs) {
        return new EraNames(attrs);
    },
    locale(attrs) {
        return new Locale(attrs);
    },
    localeSet(attrs) {
        return new LocaleSet(attrs);
    },
    meridiem(attrs) {
        return new Meridiem(attrs);
    },
    meridiemNames(attrs) {
        return new MeridiemNames(attrs);
    },
    month(attrs) {
        return new Month(attrs);
    },
    monthNames(attrs) {
        return new MonthNames(attrs);
    },
    numberPattern(attrs) {
        return new NumberPattern(attrs);
    },
    numberPatterns(attrs) {
        return new NumberPatterns(attrs);
    },
    numberSymbol(attrs) {
        return new NumberSymbol(attrs);
    },
    numberSymbols(attrs) {
        return new NumberSymbols(attrs);
    },
    timePattern(attrs) {
        return new TimePattern(attrs);
    },
    timePatterns(attrs) {
        return new TimePatterns(attrs);
    },
    typeFace(attrs) {
        return new TypeFace(attrs);
    },
    typeFaces(attrs) {
        return new TypeFaces(attrs);
    },
};
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=locale_set.js.map