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

import { CHROME, GENERIC, MOZCENTRAL, PDFJSDev } from "@fe-src/global.ts";
import type { OptionName, OptionValue, UserOptions } from "./app_options.ts";
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
      ? AppOptions.getAll(OptionKind.PREFERENCE, /* defaultOnly = */ true)
      // : PDFJSDev.eval("DEFAULT_PREFERENCES")
      : AppOptions.getAll(OptionKind.PREFERENCE, /* defaultOnly = */ true),
  );
  defaults!: Readonly<UserOptions>;

  #initializedPromise: Promise<void>;
  get initializedPromise() {
    return this.#initializedPromise;
  }

  constructor() {
    /*#static*/ if (CHROME) {
      Object.defineProperty(this, "defaults", {
        get() {
          return this.#defaults;
        },
      });
    }

    this.#initializedPromise = this._readFromStorage(this.#defaults)
      .then(({ browserPrefs, prefs }) => {
        /*#static*/ if (PDFJSDev || GENERIC) {
          if (AppOptions._checkDisablePreferences()) {
            return;
          }
        }
        AppOptions.setAll({ ...browserPrefs, ...prefs }, /* prefs = */ true);
      });

    /*#static*/ if (MOZCENTRAL) {
      window.addEventListener(
        "updatedPreference",
        (async ({ detail: { name, value } }: CustomEvent) => {
          await this.#initializedPromise;
          AppOptions.setAll(
            { [name]: value } as UserOptions,
            /* prefs = */ true,
          );
        }) as (evt: Event) => Promise<void>,
      );
    }
  }

  /**
   * Stub function for writing preferences to storage.
   * @param prefObj The preferences that should be written to storage.
   * @return A promise that is resolved when the preference values
   *    have been written.
   */
  protected abstract _writeToStorage(prefObj: UserOptions): Promise<void>;

  /**
   * Stub function for reading preferences from storage.
   * @param prefObj The preferences that should be read from storage.
   * @return A promise that is resolved with an {Object} containing
   *  the preferences that have been read.
   */
  protected abstract _readFromStorage(
    prefObj: UserOptions,
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
  async set(name: OptionName, value: OptionValue): Promise<void> {
    await this.#initializedPromise;
    AppOptions.setAll({ [name]: value } as UserOptions, /* prefs = */ true);

    await this._writeToStorage(
      /*#static*/ MOZCENTRAL
        ? { [name]: AppOptions[name] } as UserOptions
        : AppOptions.getAll(OptionKind.PREFERENCE),
    );
  }

  /**
   * Get the value of a preference.
   * @param name The name of the preference whose value is requested.
   * @return A promise resolved with a {boolean|number|string}
   *  containing the value of the preference.
   */
  async get(name: OptionName): Promise<OptionValue | undefined> {
    /*#static*/ if (MOZCENTRAL) {
      throw new Error("Not implemented: get");
    }
    await this.#initializedPromise;
    return AppOptions[name];
  }
}
/*80--------------------------------------------------------------------------*/
