import { EnumValueVisitee, EnumValueVisiteeWithNull, EnumValueVisiteeWithUndefined, EnumValueVisiteeWithNullAndUndefined } from "./EnumValueVisitee.js";
/**
 * The first step to mapping the value of an enum or string/number literal type.
 * This method creates a "mappee" wrapper object, whose "with()" method must be
 * called with a mapper implementation.
 *
 * Example: visitEnumValue(aStringEnumValue).with({ ... }).
 *
 * See also, {@link EnumValueVisitee#with} and {@link ValueMapper}.
 *
 * @template E - An enum or string/number literal type.
 *
 * @param value - The value to visit. Must be an enum or string/number literal.
 * @return A "mappee" wrapper around the provided value, whose "with()" method
 *         must be called with a mapper implementation.
 */
export declare function visitEnumValue<E extends string | number>(value: E): EnumValueVisitee<E>;
/**
 * The first step to mapping the value of an enum or string/number literal type.
 * This method creates a "mappee" wrapper object, whose "with()" method must be
 * called with a mapper implementation.
 *
 * Example: visitEnumValue(aStringEnumValue).with({ ... }).
 *
 * See also, {@link EnumValueVisiteeWithNull#with} and {@link ValueMapperWithNull}.
 *
 * @template E - An enum or string/number literal type.
 *
 * @param value - The value to visit. Must be an enum or string/number literal.
 * @return A "mappee" wrapper around the provided value, whose "with()" method
 *         must be called with a mapper implementation.
 */
export declare function visitEnumValue<E extends string | number>(value: E | null): EnumValueVisiteeWithNull<E>;
/**
 * The first step to mapping the value of an enum or string/number literal type.
 * This method creates a "mappee" wrapper object, whose "with()" method must be
 * called with a mapper implementation.
 *
 * Example: visitEnumValue(aStringEnumValue).with({ ... }).
 *
 * See also, {@link EnumValueVisiteeWithUndefined#with} and
 * {@link ValueMapperWithUndefined}.
 *
 * @template E - An enum or string/number literal type.
 *
 * @param value - The value to visit. Must be an enum or string/number literal.
 * @return A "mappee" wrapper around the provided value, whose "with()" method
 *         must be called with a mapper implementation.
 */
export declare function visitEnumValue<E extends string | number>(value: E | undefined): EnumValueVisiteeWithUndefined<E>;
/**
 * The first step to mapping the value of an enum or string/number literal type.
 * This method creates a "mappee" wrapper object, whose "with()" method must be
 * called with a mapper implementation.
 *
 * Example: visitEnumValue(aStringEnumValue).with({ ... }).
 * See also, {@link EnumValueVisiteeWithNullAndUndefined#with} and
 * {@link ValueMapperWithNullAndUndefined}.
 *
 * @template E - An enum or string/number literal type.
 *
 * @param value - The value to visit. Must be an enum or string/number literal.
 * @return A "mappee" wrapper around the provided value, whose "with()" method
 *         must be called with a mapper implementation.
 */
export declare function visitEnumValue<E extends string | number>(value: E | null | undefined): EnumValueVisiteeWithNullAndUndefined<E>;
//# sourceMappingURL=visitEnumValue.d.ts.map