/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

/* Copyright 2017 Mozilla Foundation
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

/** @typedef {import("./interfaces").IL10n} IL10n */

import { webL10n, type WebL10nArgs } from "../../3rd/webL10n/l10n.ts";
import { Locale } from "../../lib/Locale.ts";
import { type IL10n } from "./interfaces.ts";
import { fixupLangCode, getL10nFallback } from "./l10n_utils.ts";
/*80--------------------------------------------------------------------------*/

// const webL10n = document.webL10n;

export class GenericL10n implements IL10n {
  _lang: Locale;
  _ready: Promise<typeof webL10n>;

  constructor(lang: Locale) {
    this._lang = lang;
    this._ready = new Promise((resolve, reject) => {
      webL10n.setLanguage(fixupLangCode(lang), () => {
        resolve(webL10n);
      });
    });
  }

  /** @implement */
  async getLanguage() {
    const l10n = await this._ready;
    return l10n.getLanguage();
  }

  /** @implement */
  async getDirection() {
    const l10n = await this._ready;
    return l10n.getDirection();
  }

  async get(
    key: string,
    args?: WebL10nArgs,
    fallback = getL10nFallback(key, args!),
  ) {
    const l10n = await this._ready;
    return l10n.get(key, args, fallback);
  }

  async translate(element: HTMLElement) {
    const l10n = await this._ready;
    return l10n.translate(element);
  }
}
/*80--------------------------------------------------------------------------*/
