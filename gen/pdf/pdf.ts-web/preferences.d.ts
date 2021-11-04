import { OptionName, UserOptions } from "./app_options.js";
/**
 * BasePreferences - Abstract base class for storing persistent settings.
 *   Used for settings that should be applied to all opened documents,
 *   or every time the viewer is loaded.
 */
export declare abstract class BasePreferences {
    prefs: UserOptions;
    defaults: UserOptions;
    _initializedPromise: Promise<void>;
    constructor();
    /**
     * Stub function for writing preferences to storage.
     * @param prefObj The preferences that should be written to storage.
     * @return A promise that is resolved when the preference values
     *  have been written.
     */
    protected abstract _writeToStorage(prefObj: UserOptions): Promise<UserOptions | void>;
    /**
     * Stub function for reading preferences from storage.
     * @param prefObj The preferences that should be read from storage.
     * @return A promise that is resolved with an {Object} containing
     *  the preferences that have been read.
     */
    protected abstract _readFromStorage(prefObj: UserOptions): Promise<UserOptions>;
    /**
     * Reset the preferences to their default values and update storage.
     * @return A promise that is resolved when the preference values
     *  have been reset.
     */
    reset(): Promise<unknown>;
    /**
     * Set the value of a preference.
     * @param name The name of the preference that should be changed.
     * @param value The new value of the preference.
     * @return A promise that is resolved when the value has been set,
     *  provided that the preference exists and the types match.
     */
    set(name: OptionName, value: boolean | number | string): Promise<unknown>;
    /**
     * Get the value of a preference.
     * @param name The name of the preference whose value is requested.
     * @return A promise resolved with a {boolean|number|string}
     *  containing the value of the preference.
     */
    get(name: OptionName): Promise<string | number | boolean | Worker>;
    /**
     * Get the values of all preferences.
     * @return A promise that is resolved with an {Object} containing
     *  the values of all preferences.
     */
    getAll(): Promise<UserOptions>;
}
//# sourceMappingURL=preferences.d.ts.map