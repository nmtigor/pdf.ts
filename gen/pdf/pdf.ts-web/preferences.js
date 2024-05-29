/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/preferences.ts
 * @license Apache-2.0
 ******************************************************************************/
/* Copyright 2013 Mozilla Foundation
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
import { CHROME, MOZCENTRAL, PDFJSDev } from "../../global.js";
import { AppOptions, OptionKind } from "./app_options.js";
/**
 * BasePreferences - Abstract base class for storing persistent settings.
 *   Used for settings that should be applied to all opened documents,
 *   or every time the viewer is loaded.
 */
export class BasePreferences {
    #browserDefaults = Object.freeze(
    /*#static*/ AppOptions.getAll(OptionKind.BROWSER, /* defaultOnly = */ true));
    #defaults = Object.freeze(
    /*#static*/ AppOptions.getAll(OptionKind.PREFERENCE, /* defaultOnly = */ true));
    defaults;
    #prefs = Object.create(null);
    #initializedPromise;
    constructor() {
        /*#static*/ 
        this.#initializedPromise = this._readFromStorage({ prefs: this.#defaults })
            .then(({ browserPrefs, prefs }) => {
            const options = Object.create(null);
            for (const [name, val] of Object.entries(this.#browserDefaults)) {
                const prefVal = browserPrefs?.[name];
                options[name] = typeof prefVal === typeof val ? prefVal : val;
            }
            for (const [name, val] of Object.entries(this.#defaults)) {
                const prefVal = prefs?.[name];
                // Ignore preferences whose types don't match the default values.
                options[name] =
                    this.#prefs[name] =
                        typeof prefVal === typeof val ? prefVal : val;
            }
            AppOptions.setAll(options, /* init = */ true);
            /*#static*/ 
        });
    }
    /**
     * Stub function for writing preferences to storage.
     * @param prefObj The preferences that should be written to storage.
     * @return A promise that is resolved when the preference values
     *    have been written.
     */
    _writeToStorage(prefObj) {
        throw new Error("Not implemented: _writeToStorage");
    }
    #updatePref({ name, value }) {
        /*#static*/  {
            throw new Error("Not implemented: #updatePref");
        }
        if (name in this.#browserDefaults) {
            if (typeof value !== typeof this.#browserDefaults[name]) {
                return; // Invalid preference value.
            }
        }
        else if (name in this.#defaults) {
            if (typeof value !== typeof this.#defaults[name]) {
                return; // Invalid preference value.
            }
            this.#prefs[name] = value;
        }
        else {
            return; // Invalid preference.
        }
        AppOptions.set(name, value);
    }
    /**
     * Reset the preferences to their default values and update storage.
     * @return A promise that is resolved when the preference values
     *  have been reset.
     */
    async reset() {
        /*#static*/ 
        await this.#initializedPromise;
        const oldPrefs = structuredClone(this.#prefs);
        this.#prefs = Object.create(null);
        try {
            await this._writeToStorage(this.#defaults);
        }
        catch (reason) {
            // Revert all preference values, since writing to storage failed.
            this.#prefs = oldPrefs;
            throw reason;
        }
    }
    /**
     * Set the value of a preference.
     * @param name The name of the preference that should be changed.
     * @param value The new value of the preference.
     * @return A promise that is resolved when the value has been set,
     *  provided that the preference exists and the types match.
     */
    async set(name, value) {
        /*#static*/ 
        await this.#initializedPromise;
        const defaultValue = this.#defaults[name], oldPrefs = structuredClone(this.#prefs);
        if (defaultValue === undefined) {
            throw new Error(`Set preference: "${name}" is undefined.`);
        }
        else if (value === undefined) {
            throw new Error("Set preference: no value is specified.");
        }
        const valueType = typeof value, defaultType = typeof defaultValue;
        if (valueType !== defaultType) {
            if (valueType === "number" && defaultType === "string") {
                value = value.toString();
            }
            else {
                throw new Error(`Set preference: "${value}" is a ${valueType}, expected a ${defaultType}.`);
            }
        }
        else if (valueType === "number" && !Number.isInteger(value)) {
            throw new Error(`Set preference: "${value}" must be an integer.`);
        }
        this.#prefs[name] = value;
        try {
            await this._writeToStorage(this.#prefs);
        }
        catch (reason) {
            // Revert all preference values, since writing to storage failed.
            this.#prefs = oldPrefs;
            throw reason;
        }
    }
    /**
     * Get the value of a preference.
     * @param name The name of the preference whose value is requested.
     * @return A promise resolved with a {boolean|number|string}
     *  containing the value of the preference.
     */
    async get(name) {
        /*#static*/ 
        await this.#initializedPromise;
        const defaultValue = this.#defaults[name];
        if (defaultValue === undefined) {
            throw new Error(`Get preference: "${name}" is undefined.`);
        }
        return this.#prefs[name] ?? defaultValue;
    }
    get initializedPromise() {
        return this.#initializedPromise;
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=preferences.js.map