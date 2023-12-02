/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
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

import { CHROME, MOZCENTRAL, PDFJSDev } from "@fe-src/global.ts";
import type { OptionName, UserOptions } from "./app_options.ts";
import { AppOptions, OptionKind } from "./app_options.ts";
/*80--------------------------------------------------------------------------*/

/**
 * BasePreferences - Abstract base class for storing persistent settings.
 *   Used for settings that should be applied to all opened documents,
 *   or every time the viewer is loaded.
 */
export abstract class BasePreferences {
  #defaults = Object.freeze(
    /*#static*/ PDFJSDev
      ? AppOptions.getAll(OptionKind.PREFERENCE)
      // : PDFJSDev.eval("DEFAULT_PREFERENCES")
      : AppOptions.getAll(OptionKind.PREFERENCE),
  );
  defaults!: Readonly<UserOptions>;

  #prefs: UserOptions = Object.create(null);
  #initializedPromise: Promise<void>;

  constructor() {
    /*#static*/ if (CHROME) {
      Object.defineProperty(this, "defaults", {
        get() {
          return this.#defaults;
        },
      });
    }

    this.#initializedPromise = this._readFromStorage({ prefs: this.#defaults })
      .then(
        ({ browserPrefs, prefs }) => {
          const BROWSER_PREFS = /*#static*/ PDFJSDev
            ? AppOptions.getAll(OptionKind.BROWSER)
            // : PDFJSDev.eval("BROWSER_PREFERENCES");
            : AppOptions.getAll(OptionKind.BROWSER);
          const options = Object.create(null);

          for (const [name, defaultVal] of Object.entries(BROWSER_PREFS)) {
            const prefVal = browserPrefs?.[name as OptionName];
            options[name] = typeof prefVal === typeof defaultVal
              ? prefVal
              : defaultVal;
          }
          for (const [name, defaultVal] of Object.entries(this.#defaults)) {
            const prefVal = prefs?.[name as OptionName];
            // Ignore preferences whose types don't match the default values.
            options[name] =
              this.#prefs[name as OptionName] =
                typeof prefVal === typeof defaultVal ? prefVal : defaultVal;
          }
          AppOptions.setAll(options, /* init = */ true);
        },
      );
  }

  /**
   * Stub function for writing preferences to storage.
   * @param prefObj The preferences that should be written to storage.
   * @return A promise that is resolved when the preference values
   *    have been written.
   */
  protected _writeToStorage(prefObj: UserOptions): Promise<void> {
    throw new Error("Not implemented: _writeToStorage");
  }

  /**
   * Stub function for reading preferences from storage.
   * @param prefObj The preferences that should be read from storage.
   * @return A promise that is resolved with an {Object} containing
   *  the preferences that have been read.
   */
  protected abstract _readFromStorage(
    prefObj: { prefs: UserOptions },
  ): Promise<{ browserPrefs?: UserOptions; prefs: UserOptions }>;

  /**
   * Reset the preferences to their default values and update storage.
   * @return A promise that is resolved when the preference values
   *  have been reset.
   */
  async reset(): Promise<void> {
    /*#static*/ if (MOZCENTRAL) {
      throw new Error("Please use `about:config` to change preferences.");
    }
    await this.#initializedPromise;
    const prefs = this.#prefs;

    this.#prefs = Object.create(null);
    return this._writeToStorage(this.#defaults).catch((reason) => {
      // Revert all preference values, since writing to storage failed.
      this.#prefs = prefs;
      throw reason;
    });
  }

  /**
   * Set the value of a preference.
   * @param name The name of the preference that should be changed.
   * @param value The new value of the preference.
   * @return A promise that is resolved when the value has been set,
   *  provided that the preference exists and the types match.
   */
  async set(
    name: OptionName,
    value: boolean | number | string,
  ): Promise<unknown> {
    /*#static*/ if (MOZCENTRAL) {
      throw new Error("Please use `about:config` to change preferences.");
    }
    await this.#initializedPromise;
    const defaultValue = this.#defaults[name],
      prefs = this.#prefs;

    if (defaultValue === undefined) {
      throw new Error(`Set preference: "${name}" is undefined.`);
    } else if (value === undefined) {
      throw new Error("Set preference: no value is specified.");
    }
    const valueType = typeof value,
      defaultType = typeof defaultValue;

    if (valueType !== defaultType) {
      if (valueType === "number" && defaultType === "string") {
        value = value.toString();
      } else {
        throw new Error(
          `Set preference: "${value}" is a ${valueType}, expected a ${defaultType}.`,
        );
      }
    } else if (valueType === "number" && !Number.isInteger(value)) {
      throw new Error(`Set preference: "${value}" must be an integer.`);
    }

    (<any> this.#prefs)[name] = value;
    return this._writeToStorage(this.#prefs).catch((reason) => {
      // Revert all preference values, since writing to storage failed.
      this.#prefs = prefs;
      throw reason;
    });
  }

  /**
   * Get the value of a preference.
   * @param name The name of the preference whose value is requested.
   * @return A promise resolved with a {boolean|number|string}
   *  containing the value of the preference.
   */
  async get(name: OptionName) {
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

  // /**
  //  * Get the values of all preferences.
  //  * @return A promise that is resolved with an {Object} containing
  //  *  the values of all preferences.
  //  */
  // async getAll() {
  //   await this.#initializedPromise;
  //   const obj: UserOptions = Object.create(null);

  //   for (const name in this.#defaults) {
  //     (<any> obj)[name] = this.#prefs[<OptionName> name] ??
  //       this.#defaults[<OptionName> name];
  //   }
  //   return obj;
  // }
}
/*80--------------------------------------------------------------------------*/
