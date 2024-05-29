/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/preferences.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { OptionName, OptionType, UserOptions } from "./app_options.js";
/**
 * BasePreferences - Abstract base class for storing persistent settings.
 *   Used for settings that should be applied to all opened documents,
 *   or every time the viewer is loaded.
 */
export declare abstract class BasePreferences {
    #private;
    defaults: Readonly<UserOptions>;
    constructor();
    /**
     * Stub function for writing preferences to storage.
     * @param prefObj The preferences that should be written to storage.
     * @return A promise that is resolved when the preference values
     *    have been written.
     */
    protected _writeToStorage(prefObj: UserOptions): Promise<void>;
    /**
     * Stub function for reading preferences from storage.
     * @param prefObj The preferences that should be read from storage.
     * @return A promise that is resolved with an {Object} containing
     *  the preferences that have been read.
     */
    protected abstract _readFromStorage(prefObj: {
        prefs: UserOptions;
    }): Promise<{
        browserPrefs?: UserOptions;
        prefs: UserOptions;
    }>;
    /**
     * Reset the preferences to their default values and update storage.
     * @return A promise that is resolved when the preference values
     *  have been reset.
     */
    reset(): Promise<void>;
    /**
     * Set the value of a preference.
     * @param name The name of the preference that should be changed.
     * @param value The new value of the preference.
     * @return A promise that is resolved when the value has been set,
     *  provided that the preference exists and the types match.
     */
    set(name: OptionName, value: OptionType): Promise<void>;
    /**
     * Get the value of a preference.
     * @param name The name of the preference whose value is requested.
     * @return A promise resolved with a {boolean|number|string}
     *  containing the value of the preference.
     */
    get(name: OptionName): Promise<OptionType>;
    get initializedPromise(): Promise<void>;
}
//# sourceMappingURL=preferences.d.ts.map