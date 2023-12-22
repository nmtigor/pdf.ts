/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2023
 */

/* Copyright 2023 Mozilla Foundation
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

import type { DOMLocalization } from "@fe-3rd/fluent/dom/esm/index.ts";
import type { FluentMessageArgs } from "@fe-3rd/fluent/dom/esm/localization.ts";
import { Locale } from "@fe-lib/Locale.ts";
import { TESTING } from "@fe-src/global.ts";
import type { IL10n } from "./interfaces.ts";
/*80--------------------------------------------------------------------------*/

declare global {
  interface Document {
    l10n: DOMLocalization;
  }
}

export type L10nCtorP = {
  lang?: Locale;
  isRTL?: boolean;
};

/**
//  * NOTE: The L10n-implementations should use lowercase language-codes
//  *       internally.
 */
export class L10n implements IL10n {
  #dir: "rtl" | "ltr";
  #lang;
  #l10n!: DOMLocalization;

  constructor({ lang, isRTL }: L10nCtorP, l10n?: DOMLocalization) {
    this.#lang = L10n.#fixupLangCode(lang);
    this.#l10n = l10n!;
    this.#dir = isRTL ?? L10n.#isRTL(this.#lang) ? "rtl" : "ltr";
  }

  _setL10n(l10n: DOMLocalization) {
    this.#l10n = l10n;
    /*#static*/ if (TESTING) {
      document.l10n = l10n;
    }
  }

  /** @implement */
  getLanguage() {
    return this.#lang;
  }

  /** @implement */
  getDirection() {
    return this.#dir;
  }

  /** @implement */
  async get<S extends string | string[]>(
    ids: S,
    args?: FluentMessageArgs,
    fallback?: string,
  ): Promise<S> {
    if (Array.isArray(ids)) {
      const messages = await this.#l10n.formatMessages(
        ids.map((id) => ({ id })),
      );
      return messages.map((message) => message.value!) as S;
    }

    const messages = await this.#l10n.formatMessages([{
      id: ids,
      args,
    }]);
    return (messages?.[0].value || fallback) as S;
  }

  /** @implement */
  async translate(element: HTMLElement) {
    try {
      this.#l10n.connectRoot(element);
      await this.#l10n.translateRoots();
    } catch {
      // Element is under an existing root, so there is no need to add it again.
    }
  }

  /** @implement */
  pause() {
    this.#l10n.pauseObserving();
  }

  /** @implement */
  resume() {
    this.#l10n.resumeObserving();
  }

  static #fixupLangCode(langCode: Locale = Locale.en_US) {
    // // Use only lowercase language-codes internally, and fallback to English.
    // langCode = langCode?.toLowerCase() || "en-us";

    // Try to support "incompletely" specified language codes (see issue 13689).
    const PARTIAL_LANG_CODES = {
      en: "en-US",
      es: "es-ES",
      fy: "fy-NL",
      ga: "ga-IE",
      gu: "gu-IN",
      hi: "hi-IN",
      hy: "hy-AM",
      nb: "nb-NO",
      ne: "ne-NP",
      nn: "nn-NO",
      pa: "pa-IN",
      pt: "pt-PT",
      sv: "sv-SE",
      zh: "zh-CN",
    } as Record<string, Locale>;
    return PARTIAL_LANG_CODES[langCode] || langCode;
  }

  static #isRTL(lang: Locale) {
    const shortCode = lang.split("-", 1)[0];
    return ["ar", "he", "fa", "ps", "ur"].includes(shortCode);
  }
}
/*80--------------------------------------------------------------------------*/
