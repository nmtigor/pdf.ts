import { EnumValueMapper, EnumValueMapperWithNull, EnumValueMapperWithUndefined, EnumValueMapperWithNullAndUndefined } from "./EnumValueMapper.js";
/**
 * A wrapper around an enum or string/number literal value to be mapped.
 * Do not use this class directly. Use the {@link $enum.mapValue} function to
 * get an instance of this class.
 *
 * @template E - An enum or string/number literal type.
 */
export declare class EnumValueMappee<E extends string | number> {
    private readonly value;
    /**
     * Do not use this constructor directly. Use the {@link $enum.mapValue}
     * function to get an instance of this class.
     * @param value - The value to be wrapped by this "mappee".
     */
    constructor(value: E);
    /**
     * Maps the wrapped value using the supplied mapper.
     * Returns the value of the mapper's property whose name matches the wrapped
     * value.
     *
     * @template T - The data type that the enum or string/number literal value
     *           will be mapped to.
     *
     * @param mapper - A mapper implementation for type E that returns type T.
     * @returns The mapped value from the mapper.
     */
    with<T>(mapper: EnumValueMapper<E, T>): T;
}
/**
 * A wrapper around an enum or string/number literal value to be mapped.
 * For values that may be null.
 * Do not use this class directly. Use the {@link $enum.mapValue} function to
 * get an instance of this class.
 *
 * NOTE: At run time, this class is used by {@link $enum.mapValue} ONLY for
 *       handling null values.
 *       {@link EnumValueMappee} contains the core run time implementation that is
 *       applicable to all "EnumValueMappee" classes.
 *
 * @template E - An enum or string/number literal type.
 */
export declare class EnumValueMappeeWithNull<E extends string | number> {
    /**
     * Maps the wrapped value using the supplied mapper.
     * If the wrapped value is null, returns the mapper's
     * {@link handleNull} value.
     * Otherwise, returns the value of the mapper's property whose name matches
     * the wrapped value.
     *
     * @template T - The data type that the enum or string/number literal value
     *           will be mapped to.
     *
     * @param mapper - A mapper implementation for type E that returns type T.
     * @returns The mapped value from the mapper.
     */
    with<T>(mapper: EnumValueMapperWithNull<E, T>): T;
}
/**
 * A wrapper around an enum or string/number literal value to be mapped.
 * For values that may be undefined.
 * Do not use this class directly. Use the {@link $enum.mapValue} function to
 * get an instance of this class.
 *
 * NOTE: At run time, this class is used by {@link $enum.mapValue} ONLY for
 *       handling undefined values.
 *       {@link EnumValueMappee} contains the core run time implementation that is
 *       applicable to all "EnumValueMappee" classes.
 *
 * @template E - An enum or string/number literal type.
 */
export declare class EnumValueMappeeWithUndefined<E extends string | number> {
    /**
     * Maps the wrapped value using the supplied mapper.
     * If the wrapped value is undefined, returns the mapper's
     * {@link handleUndefined} value.
     * Otherwise, returns the value of the mapper's property whose name matches
     * the wrapped value.
     *
     * @template T - The data type that the enum or string/number literal value
     *           will be mapped to.
     *
     * @param mapper - A mapper implementation for type E that returns type T.
     * @returns The mapped value from the mapper.
     */
    with<T>(mapper: EnumValueMapperWithUndefined<E, T>): T;
}
/**
 * A wrapper around an enum or string/number literal value to be mapped.
 * For values that may be null and undefined.
 * Do not use this class directly. Use the {@link $enum.mapValue} function to
 * get an instance of this class.
 *
 * NOTE: No run time implementation of this class actually exists. This is only
 *       used for compile-time typing.
 *       {@link EnumValueMappee} contains the core run time implementation that is
 *       applicable to all "EnumValueMappee" classes, while
 *       {@link EnumValueMappeeWithNull} and {@link EnumValueMappeeWithUndefined}
 *       are used at run time to handle null and undefined values.
 *
 * @template E - An enum or string/number literal type.
 */
export declare class EnumValueMappeeWithNullAndUndefined<E extends string | number> {
    /**
     * Maps the wrapped value using the supplied mapper.
     * If the wrapped value is null, returns the mapper's
     * {@link handleNull} value.
     * If the wrapped value is undefined, returns the mapper's
     * {@link handleUndefined} value.
     * Otherwise, returns the value of the mapper's property whose name matches
     * the wrapped value.
     *
     * @template T - The data type that the enum or string/number literal value
     *           will be mapped to.
     *
     * @param mapper - A mapper implementation for type E that returns type T.
     * @returns The mapped value from the mapper.
     */
    with<T>(mapper: EnumValueMapperWithNullAndUndefined<E, T>): T;
}
//# sourceMappingURL=EnumValueMappee.d.ts.map