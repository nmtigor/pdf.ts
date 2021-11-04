/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
 */
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
import { AppOptions } from "./app_options.js";
/*81---------------------------------------------------------------------------*/
/**
 * BasePreferences - Abstract base class for storing persistent settings.
 *   Used for settings that should be applied to all opened documents,
 *   or every time the viewer is loaded.
 */
export class BasePreferences {
    prefs = Object.create(null);
    defaults;
    _initializedPromise;
    constructor() {
        Object.defineProperty(this, "defaults", {
            value: Object.freeze(AppOptions.getAll(128 /* PREFERENCE */)),
            writable: false,
            enumerable: true,
            configurable: false,
        });
        this._initializedPromise = this._readFromStorage(this.defaults).then(prefs => {
            for (const name in this.defaults) {
                const prefValue = prefs?.[name];
                // Ignore preferences whose types don't match the default values.
                if (typeof prefValue === typeof this.defaults[name]) {
                    this.prefs[name] = prefValue;
                }
            }
        });
    }
    /**
     * Reset the preferences to their default values and update storage.
     * @return A promise that is resolved when the preference values
     *  have been reset.
     */
    async reset() {
        await this._initializedPromise;
        this.prefs = Object.create(null);
        return this._writeToStorage(this.defaults);
    }
    /**
     * Set the value of a preference.
     * @param name The name of the preference that should be changed.
     * @param value The new value of the preference.
     * @return A promise that is resolved when the value has been set,
     *  provided that the preference exists and the types match.
     */
    async set(name, value) {
        await this._initializedPromise;
        const defaultValue = this.defaults[name];
        if (defaultValue === undefined) {
            throw new Error(`Set preference: "${name}" is undefined.`);
        }
        else if (value === undefined) {
            throw new Error("Set preference: no value is specified.");
        }
        const valueType = typeof value;
        const defaultType = typeof defaultValue;
        if (valueType !== defaultType) {
            if (valueType === "number" && defaultType === "string") {
                value = value.toString();
            }
            else {
                throw new Error(`Set preference: "${value}" is a ${valueType}, expected a ${defaultType}.`);
            }
        }
        else {
            if (valueType === "number" && !Number.isInteger(value)) {
                throw new Error(`Set preference: "${value}" must be an integer.`);
            }
        }
        this.prefs[name] = value;
        return this._writeToStorage(this.prefs);
    }
    /**
     * Get the value of a preference.
     * @param name The name of the preference whose value is requested.
     * @return A promise resolved with a {boolean|number|string}
     *  containing the value of the preference.
     */
    async get(name) {
        await this._initializedPromise;
        const defaultValue = this.defaults[name];
        const prefValue = this.prefs[name];
        if (defaultValue === undefined) {
            throw new Error(`Get preference: "${name}" is undefined.`);
        }
        return prefValue !== undefined ? prefValue : defaultValue;
    }
    /**
     * Get the values of all preferences.
     * @return A promise that is resolved with an {Object} containing
     *  the values of all preferences.
     */
    async getAll() {
        await this._initializedPromise;
        const obj = Object.create(null);
        for (const name in this.defaults) {
            const prefValue = this.prefs[name];
            obj[name] = prefValue !== undefined ? prefValue : this.defaults[name];
        }
        return obj;
    }
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=preferences.js.map