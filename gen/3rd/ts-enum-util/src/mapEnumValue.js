import { EnumValueMappee, EnumValueMappeeWithNull, EnumValueMappeeWithUndefined } from "./EnumValueMappee.js";
export function mapEnumValue(value) {
    // NOTE: The run time type of EnumValueMappee created does not necessarily match
    //       the compile-time type. This results in unusual EnumValueMappee.with()
    //       implementations.
    if (value === null) {
        return new EnumValueMappeeWithNull();
    }
    else if (value === undefined) {
        return new EnumValueMappeeWithUndefined();
    }
    else {
        return new EnumValueMappee(value);
    }
}
//# sourceMappingURL=mapEnumValue.js.map