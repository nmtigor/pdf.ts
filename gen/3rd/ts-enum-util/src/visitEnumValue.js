import { EnumValueVisitee, EnumValueVisiteeWithNull, EnumValueVisiteeWithUndefined } from "./EnumValueVisitee.js";
export function visitEnumValue(value) {
    // NOTE: The run time type of EnumValueVisitee created does not necessarily match
    //       the compile-time type. This results in unusual EnumValueVisitee.with()
    //       implementations.
    if (value === null) {
        return new EnumValueVisiteeWithNull();
    }
    else if (value === undefined) {
        return new EnumValueVisiteeWithUndefined();
    }
    else {
        return new EnumValueVisitee(value);
    }
}
//# sourceMappingURL=visitEnumValue.js.map