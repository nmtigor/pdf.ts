/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/xfa/locale_set.ts
 * @license Apache-2.0
 ******************************************************************************/

/* Copyright 2021 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { type XFAAttrs } from "./alias.ts";
import { $buildXFAObject, NamespaceIds } from "./namespaces.ts";
import { getInteger, getStringOption } from "./utils.ts";
import {
  ContentObject,
  StringObject,
  XFAObject,
  XFAObjectArray,
} from "./xfa_object.ts";
/*80--------------------------------------------------------------------------*/

const LOCALE_SET_NS_ID = NamespaceIds.localeSet.id;

class CalendarSymbols extends XFAObject {
  dayNames = new XFAObjectArray(2);
  eraNames: unknown;
  meridiemNames: unknown;
  monthNames = new XFAObjectArray(2);

  constructor(attributes: XFAAttrs) {
    super(LOCALE_SET_NS_ID, "calendarSymbols", /* hasChildren = */ true);
    this.name = "gregorian";
  }
}

class CurrencySymbol extends StringObject {
  constructor(attributes: XFAAttrs) {
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

  constructor(attributes: XFAAttrs) {
    super(LOCALE_SET_NS_ID, "currencySymbols", /* hasChildren = */ true);
  }
}

class DatePattern extends StringObject {
  constructor(attributes: XFAAttrs) {
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

  constructor(attributes: XFAAttrs) {
    super(LOCALE_SET_NS_ID, "datePatterns", /* hasChildren = */ true);
  }
}

class DateTimeSymbols extends ContentObject {
  // TODO: spec unclear about the format of the array.

  constructor(attributes: XFAAttrs) {
    super(LOCALE_SET_NS_ID, "dateTimeSymbols");
  }
}

class Day extends StringObject {
  constructor(attributes: XFAAttrs) {
    super(LOCALE_SET_NS_ID, "day");
  }
}

class DayNames extends XFAObject {
  abbr;
  day = new XFAObjectArray(7);

  constructor(attributes: XFAAttrs) {
    super(LOCALE_SET_NS_ID, "dayNames", /* hasChildren = */ true);
    this.abbr = getInteger({
      data: attributes.abbr,
      defaultValue: 0,
      validate: (x) => x === 1,
    });
  }
}

class Era extends StringObject {
  constructor(attributes: XFAAttrs) {
    super(LOCALE_SET_NS_ID, "era");
  }
}

class EraNames extends XFAObject {
  era = new XFAObjectArray(2);

  constructor(attributes: XFAAttrs) {
    super(LOCALE_SET_NS_ID, "eraNames", /* hasChildren = */ true);
  }
}

class Locale extends XFAObject {
  desc;
  calendarSymbols: unknown;
  currencySymbols: unknown;
  datePatterns: unknown;
  dateTimeSymbols: unknown;
  numberPatterns: unknown;
  numberSymbols: unknown;
  timePatterns: unknown;
  typeFaces: unknown;

  constructor(attributes: XFAAttrs) {
    super(LOCALE_SET_NS_ID, "locale", /* hasChildren = */ true);
    this.desc = attributes.desc || "";
    this.name = "isoname";
  }
}

class LocaleSet extends XFAObject {
  locale = new XFAObjectArray();

  constructor(attributes: XFAAttrs) {
    super(LOCALE_SET_NS_ID, "localeSet", /* hasChildren = */ true);
  }
}

class Meridiem extends StringObject {
  constructor(attributes: XFAAttrs) {
    super(LOCALE_SET_NS_ID, "meridiem");
  }
}

class MeridiemNames extends XFAObject {
  meridiem = new XFAObjectArray(2);

  constructor(attributes: XFAAttrs) {
    super(LOCALE_SET_NS_ID, "meridiemNames", /* hasChildren = */ true);
  }
}

class Month extends StringObject {
  constructor(attributes: XFAAttrs) {
    super(LOCALE_SET_NS_ID, "month");
  }
}

class MonthNames extends XFAObject {
  abbr;
  month = new XFAObjectArray(12);

  constructor(attributes: XFAAttrs) {
    super(LOCALE_SET_NS_ID, "monthNames", /* hasChildren = */ true);

    this.abbr = getInteger({
      data: attributes.abbr,
      defaultValue: 0,
      validate: (x) => x === 1,
    });
  }
}

class NumberPattern extends StringObject {
  constructor(attributes: XFAAttrs) {
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

  constructor(attributes: XFAAttrs) {
    super(LOCALE_SET_NS_ID, "numberPatterns", /* hasChildren = */ true);
  }
}

class NumberSymbol extends StringObject {
  constructor(attributes: XFAAttrs) {
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

  constructor(attributes: XFAAttrs) {
    super(LOCALE_SET_NS_ID, "numberSymbols", /* hasChildren = */ true);
  }
}

class TimePattern extends StringObject {
  constructor(attributes: XFAAttrs) {
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

  constructor(attributes: XFAAttrs) {
    super(LOCALE_SET_NS_ID, "timePatterns", /* hasChildren = */ true);
  }
}

class TypeFace extends XFAObject {
  constructor(attributes: XFAAttrs) {
    super(LOCALE_SET_NS_ID, "typeFace", /* hasChildren = */ true);
    this.name = attributes.name || "";
  }
}

class TypeFaces extends XFAObject {
  typeFace = new XFAObjectArray();

  constructor(attributes: XFAAttrs) {
    super(LOCALE_SET_NS_ID, "typeFaces", /* hasChildren = */ true);
  }
}

export type XFANsLocaleSet = typeof LocaleSetNamespace;
type LocaleSetName = Exclude<keyof XFANsLocaleSet, symbol>;
export const LocaleSetNamespace = {
  [$buildXFAObject](name: string, attributes: XFAAttrs) {
    if (Object.hasOwn(LocaleSetNamespace, name)) {
      return LocaleSetNamespace[<LocaleSetName> name](attributes);
    }
    return undefined;
  },

  calendarSymbols(attrs: XFAAttrs) {
    return new CalendarSymbols(attrs);
  },
  currencySymbol(attrs: XFAAttrs) {
    return new CurrencySymbol(attrs);
  },
  currencySymbols(attrs: XFAAttrs) {
    return new CurrencySymbols(attrs);
  },
  datePattern(attrs: XFAAttrs) {
    return new DatePattern(attrs);
  },
  datePatterns(attrs: XFAAttrs) {
    return new DatePatterns(attrs);
  },
  dateTimeSymbols(attrs: XFAAttrs) {
    return new DateTimeSymbols(attrs);
  },
  day(attrs: XFAAttrs) {
    return new Day(attrs);
  },
  dayNames(attrs: XFAAttrs) {
    return new DayNames(attrs);
  },
  era(attrs: XFAAttrs) {
    return new Era(attrs);
  },
  eraNames(attrs: XFAAttrs) {
    return new EraNames(attrs);
  },
  locale(attrs: XFAAttrs) {
    return new Locale(attrs);
  },
  localeSet(attrs: XFAAttrs) {
    return new LocaleSet(attrs);
  },
  meridiem(attrs: XFAAttrs) {
    return new Meridiem(attrs);
  },
  meridiemNames(attrs: XFAAttrs) {
    return new MeridiemNames(attrs);
  },
  month(attrs: XFAAttrs) {
    return new Month(attrs);
  },
  monthNames(attrs: XFAAttrs) {
    return new MonthNames(attrs);
  },
  numberPattern(attrs: XFAAttrs) {
    return new NumberPattern(attrs);
  },
  numberPatterns(attrs: XFAAttrs) {
    return new NumberPatterns(attrs);
  },
  numberSymbol(attrs: XFAAttrs) {
    return new NumberSymbol(attrs);
  },
  numberSymbols(attrs: XFAAttrs) {
    return new NumberSymbols(attrs);
  },
  timePattern(attrs: XFAAttrs) {
    return new TimePattern(attrs);
  },
  timePatterns(attrs: XFAAttrs) {
    return new TimePatterns(attrs);
  },
  typeFace(attrs: XFAAttrs) {
    return new TypeFace(attrs);
  },
  typeFaces(attrs: XFAAttrs) {
    return new TypeFaces(attrs);
  },
};
/*80--------------------------------------------------------------------------*/
