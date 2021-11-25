/**
 * Creates an Error with a message explaining that an unhandled
 * value was encountered.
 * @param unhandledValue - The unhandled value.
 * @return an Error with a message explaining that an unhandled
 * value was encountered.
 */
export function createUnhandledEntryError(unhandledValue) {
    return new Error(`Unhandled value: ${unhandledValue}`);
}
//# sourceMappingURL=createUnhandledEntryError.js.map