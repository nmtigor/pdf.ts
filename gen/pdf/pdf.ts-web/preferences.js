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
import { CHROME, GENERIC, MOZCENTRAL, PDFJSDev } from "../../global.js";
import { AppOptions, OptionKind } from "./app_options.js";
/*80--------------------------------------------------------------------------*/
/**
 * BasePreferences - Abstract base class for storing persistent settings.
 *   Used for settings that should be applied to all opened documents,
 *   or every time the viewer is loaded.
 */
export class BasePreferences {
    #defaults = Object.freeze(
    /*#static*/ AppOptions.getAll(OptionKind.PREFERENCE, /* defaultOnly = */ true));
    defaults;
    #initializedPromise;
    get initializedPromise() {
        return this.#initializedPromise;
    }
    constructor() {
        /*#static*/ 
        this.#initializedPromise = this._readFromStorage(this.#defaults)
            .then(({ browserPrefs, prefs }) => {
            /*#static*/  {
                if (AppOptions._checkDisablePreferences()) {
                    return;
                }
            }
            AppOptions.setAll({ ...browserPrefs, ...prefs }, /* prefs = */ true);
        });
        /*#static*/ 
    }
    /**
     * Reset the preferences to their default values and update storage.
     * @return A promise that is resolved when the preference values
     *  have been reset.
     */
    async reset() {
        /*#static*/ 
        await this.#initializedPromise;
        AppOptions.setAll(this.#defaults, /* prefs = */ true);
        await this._writeToStorage(this.#defaults);
    }
    /**
     * Set the value of a preference.
     * @param name The name of the preference that should be changed.
     * @param value The new value of the preference.
     * @return A promise that is resolved when the value has been set,
     *  provided that the preference exists and the types match.
     */
    async set(name, value) {
        await this.#initializedPromise;
        AppOptions.setAll({ [name]: value }, /* prefs = */ true);
        await this._writeToStorage(
        /*#static*/ AppOptions.getAll(OptionKind.PREFERENCE));
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
        return AppOptions[name];
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=preferences.js.map