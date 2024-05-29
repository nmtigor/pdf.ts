/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/genericl10n.ts
 * @license Apache-2.0
 ******************************************************************************/

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

import {
  FluentBundle,
  FluentResource,
} from "@fe-3rd/fluent/bundle/esm/index.ts";
import { DOMLocalization } from "@fe-3rd/fluent/dom/esm/index.ts";
import { Locale } from "@fe-lib/Locale.ts";
import { PDFJSDev, TESTING } from "@fe-src/global.ts";
import { fetchData } from "../pdf.ts-src/pdf.ts";
import { L10n } from "./l10n.ts";
import { D_res } from "../alias.ts";
/*80--------------------------------------------------------------------------*/

function createBundle(lang: Locale, text: string) {
  const resource = new FluentResource(text);
  const bundle = new FluentBundle(lang);
  const errors = bundle.addResource(resource);
  if (errors.length) {
    console.error("L10n errors", errors);
  }
  return bundle;
}

//kkkk TOCLEANUP
// const PARTIAL_LANG_CODES = <Record<string, Locale_1>> {
//   en: "en-US",
//   es: "es-ES",
//   fy: "fy-NL",
//   ga: "ga-IE",
//   gu: "gu-IN",
//   hi: "hi-IN",
//   hy: "hy-AM",
//   nb: "nb-NO",
//   ne: "ne-NP",
//   nn: "nn-NO",
//   pa: "pa-IN",
//   pt: "pt-PT",
//   sv: "sv-SE",
//   zh: "zh-CN",
// };

// // Try to support "incompletely" specified language codes (see issue 13689).
// export function fixupLangCode(langCode?: Locale) {
//   return PARTIAL_LANG_CODES[langCode?.toLowerCase()!] || langCode;
// }

export class GenericL10n extends L10n {
  constructor(lang?: Locale) {
    super({ lang });

    //kkkk TOCLEANUP
    // this._setL10n(
    //   new DOMLocalization(
    //     [],
    //     GenericL10n.#generateBundles.bind(
    //       GenericL10n,
    //       Locale.en_US,
    //       this.getLanguage(),
    //     ),
    //   ),
    // );
    const generateBundles = !lang
      ? GenericL10n.#generateBundlesFallback.bind(
        GenericL10n,
        this.getLanguage(),
      )
      : GenericL10n.#generateBundles.bind(
        GenericL10n,
        Locale.en_US,
        this.getLanguage(),
      );
    this._setL10n(new DOMLocalization([], generateBundles));
  }

  /**
   * Generate the bundles for Fluent.
   * @param defaultLang The fallback language to use for
   *   translations.
   * @param baseLang The base language to use for translations.
   */
  static async *#generateBundles(defaultLang: Locale, baseLang: Locale) {
    const { baseURL, paths } = await this.#getPaths();

    const langs = [baseLang];
    if (defaultLang !== baseLang) {
      // Also fallback to the short-format of the base language
      // (see issue 17269).
      const shortLang = baseLang.split("-", 1)[0] as Locale;

      if (shortLang !== baseLang) {
        langs.push(shortLang);
      }
      langs.push(defaultLang);
    }
    for (const lang of langs) {
      const bundle = await this.#createBundle(lang, baseURL, paths);
      if (bundle) {
        yield bundle;
      }
      if (lang === "en-US") {
        yield this.#createBundleFallback(lang);
      }
    }
  }

  static async #createBundle(
    lang: Locale,
    baseURL: string,
    paths: Record<Locale, string>,
  ) {
    const path = paths[lang];
    if (!path) {
      return undefined;
    }
    const url = new URL(path, baseURL);
    const text = await fetchData(url, /* type = */ "text");

    return createBundle(lang, text);
  }

  static async #getPaths() {
    try {
      const { href } = document.querySelector(
        `link[type="application/l10n"]`,
      ) as HTMLLinkElement;
      const paths = await fetchData(href, /* type = */ "json");

      return { baseURL: href.replace(/[^/]*$/, "") || "./", paths };
    } catch {}
    return { baseURL: "./", paths: Object.create(null) };
  }

  static async *#generateBundlesFallback(lang: Locale) {
    yield this.#createBundleFallback(lang);
  }

  static async #createBundleFallback(lang: Locale) {
    // /*#static*/ if (TESTING) {
    //   throw new Error("Not implemented: #createBundleFallback");
    // }
    const text = /*#static*/ PDFJSDev
      ? await fetchData(
        new URL(`/${D_res}/l10n/en-US/viewer.ftl`, window.location.href),
        /* type = */ "text",
      )
      // : PDFJSDev.eval("DEFAULT_FTL");
      : await fetchData(
        new URL(`/${D_res}/l10n/en-US/viewer.ftl`, window.location.href),
        /* type = */ "text",
      );

    return createBundle(lang, text);
  }

  //kkkk TOCLEANUP
  // /** @implement */
  // async getLanguage() {
  //   const l10n = await this._ready;
  //   return l10n.getLanguage();
  // }

  // /** @implement */
  // async getDirection() {
  //   const l10n = await this._ready;
  //   return l10n.getDirection();
  // }

  // async get(
  //   key: string,
  //   args?: WebL10nArgs,
  //   fallback = getL10nFallback(key, args!),
  // ) {
  //   const l10n = await this._ready;
  //   return l10n.get(key, args, fallback);
  // }

  // async translate(element: HTMLElement) {
  //   const l10n = await this._ready;
  //   return l10n.translate(element);
  // }
}
/*80--------------------------------------------------------------------------*/
