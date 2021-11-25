import { EnumValueVisitor, EnumValueVisitorWithNull, EnumValueVisitorWithUndefined, EnumValueVisitorWithNullAndUndefined } from "./EnumValueVisitor.js";
/**
 * A wrapper around a string literal or string enum value to be visited.
 * Do not use this class directly. Use the {@link visitString} function to get an instance of this class.
 *
 * @template E - A string literal type or string enum type.
 */
export declare class EnumValueVisitee<E extends string | number> {
    private readonly value;
    /**
     * Do not use this constructor directly. Use the {@link visitString} function to get an instance of this class.
     * @param value - The value to be wrapped by this "visitee".
     */
    constructor(value: E);
    /**
     * Visits the wrapped value using the supplied visitor.
     * Calls the visitor method whose name matches the wrapped value.
     *
     * @template R - The return type of the visitor methods.
     *
     * @param visitor - A visitor implementation for type E that returns type R.
     * @returns The return value of the visitor method that is called.
     */
    with<R>(visitor: EnumValueVisitor<E, R>): R;
}
/**
 * A wrapper around a string literal or string enum value to be visited.
 * For values that may be null.
 * Do not use this class directly. Use the {@link visitString} function to get an instance of this class.
 *
 * NOTE: At run time, this class is used by {@link visitString} ONLY for handling null values.
 *       {@link EnumValueVisitee} contains the core run time implementation that is applicable to all
 *       "EnumValueVisitee" classes.
 *
 * @template E - A string literal type or string enum type.
 */
export declare class EnumValueVisiteeWithNull<E extends string | number> {
    /**
     * Visits the wrapped value using the supplied visitor.
     * If the wrapped value is null, calls the visitor's {@link StringNullVisitor#handleNull} method.
     * Otherwise, calls the visitor method whose name matches the wrapped value.
     *
     * @template R - The return type of the visitor methods.
     *
     * @param visitor - A visitor implementation for type E that returns type R.
     * @returns The return value of the visitor method that is called.
     */
    with<R>(visitor: EnumValueVisitorWithNull<E, R>): R;
}
/**
 * A wrapper around a string literal or string enum value to be visited.
 * For values that may be undefined.
 * Do not use this class directly. Use the {@link visitString} function to get an instance of this class.
 *
 * NOTE: At run time, this class is used by {@link visitString} ONLY for handling undefined values.
 *       {@link EnumValueVisitee} contains the core run time implementation that is applicable to all
 *       "EnumValueVisitee" classes.
 *
 * @template E - A string literal type or string enum type.
 */
export declare class EnumValueVisiteeWithUndefined<E extends string | number> {
    /**
     * Visits the wrapped value using the supplied visitor.
     * If the wrapped value is undefined, calls the visitor's {@link StringNullVisitor#handleUndefined} method.
     * Otherwise, calls the visitor method whose name matches the wrapped value.
     *
     * @template R - The return type of the visitor methods.
     *
     * @param visitor - A visitor implementation for type E that returns type R.
     * @returns The return value of the visitor method that is called.
     */
    with<R>(visitor: EnumValueVisitorWithUndefined<E, R>): R;
}
/**
 * A wrapper around a string literal or string enum value to be visited.
 * For values that may be null and undefined.
 * Do not use this class directly. Use the {@link visitString} function to get an instance of this class.
 *
 * NOTE: No run time implementation of this class actually exists. This is only used for compile-time
 *       typing. {@link EnumValueVisitee} contains the core run time implementation that is applicable to all
 *       "EnumValueVisitee" classes, while {@link EnumValueVisiteeWithNull} and {@link EnumValueVisiteeWithUndefined}
 *       are used at run time to handle null and undefined values.
 *
 * @template E - A string literal type or string enum type.
 */
export declare class EnumValueVisiteeWithNullAndUndefined<E extends string | number> {
    /**
     * Visits the wrapped value using the supplied visitor.
     * If the wrapped value is null, calls the visitor's {@link StringNullVisitor#handleNull} method.
     * If the wrapped value is undefined, calls the visitor's {@link StringNullVisitor#handleUndefined} method.
     * Otherwise, calls the visitor method whose name matches the wrapped value.
     *
     * @template R - The return type of the visitor methods.
     *
     * @param visitor - A visitor implementation for type E that returns type R.
     * @returns The return value of the visitor method that is called.
     */
    with<R>(visitor: EnumValueVisitorWithNullAndUndefined<E, R>): R;
}
//# sourceMappingURL=EnumValueVisitee.d.ts.map