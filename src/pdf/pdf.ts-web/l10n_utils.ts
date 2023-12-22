/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

/* Copyright 2021 Mozilla Foundation
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
import type { FluentMessageArgs } from "@fe-3rd/fluent/dom/esm/localization.ts";
import { Locale } from "@fe-lib/Locale.ts";
import { PDFJSDev } from "@fe-src/global.ts";
import { fetchData, shadow } from "../pdf.ts-src/pdf.ts";
import type { IL10n } from "./interfaces.ts";
import { L10n } from "./l10n.ts";
/*80--------------------------------------------------------------------------*/

// /**
//  * PLEASE NOTE: This file is currently imported in both the `web/` and
//  *              `src/display/` folders, hence be EXTREMELY careful about
//  *              introducing any dependencies here since that can lead to an
//  *              unexpected/unnecessary size increase of the *built* files.
//  */

// /**
//  * A subset of the l10n strings in the `l10n/en-US/viewer.properties` file.
//  */
// const DEFAULT_L10N_STRINGS: Record<string, string> = {
//   of_pages: "of {{pagesCount}}",
//   page_of_pages: "({{pageNumber}} of {{pagesCount}})",

//   document_properties_kb: "{{size_kb}} KB ({{size_b}} bytes)",
//   document_properties_mb: "{{size_mb}} MB ({{size_b}} bytes)",
//   document_properties_date_string: "{{date}}, {{time}}",
//   document_properties_page_size_unit_inches: "in",
//   document_properties_page_size_unit_millimeters: "mm",
//   document_properties_page_size_orientation_portrait: "portrait",
//   document_properties_page_size_orientation_landscape: "landscape",
//   document_properties_page_size_name_a3: "A3",
//   document_properties_page_size_name_a4: "A4",
//   document_properties_page_size_name_letter: "Letter",
//   document_properties_page_size_name_legal: "Legal",
//   document_properties_page_size_dimension_string:
//     "{{width}} × {{height}} {{unit}} ({{orientation}})",
//   document_properties_page_size_dimension_name_string:
//     "{{width}} × {{height}} {{unit}} ({{name}}, {{orientation}})",
//   document_properties_linearized_yes: "Yes",
//   document_properties_linearized_no: "No",

//   additional_layers: "Additional Layers",
//   page_landmark: "Page {{page}}",
//   thumb_page_title: "Page {{page}}",
//   thumb_page_canvas: "Thumbnail of Page {{page}}",

//   find_reached_top: "Reached top of document, continued from bottom",
//   find_reached_bottom: "Reached end of document, continued from top",
//   "find_match_count[one]": "{{current}} of {{total}} match",
//   "find_match_count[other]": "{{current}} of {{total}} matches",
//   "find_match_count_limit[one]": "More than {{limit}} match",
//   "find_match_count_limit[other]": "More than {{limit}} matches",
//   find_not_found: "Phrase not found",

//   page_scale_width: "Page Width",
//   page_scale_fit: "Page Fit",
//   page_scale_auto: "Automatic Zoom",
//   page_scale_actual: "Actual Size",
//   page_scale_percent: "{{scale}}%",

//   loading_error: "An error occurred while loading the PDF.",
//   invalid_file_error: "Invalid or corrupted PDF file.",
//   missing_file_error: "Missing PDF file.",
//   unexpected_response_error: "Unexpected server response.",
//   rendering_error: "An error occurred while rendering the page.",

//   annotation_date_string: "{{date}}, {{time}}",

//   printing_not_supported:
//     "Warning: Printing is not fully supported by this browser.",
//   printing_not_ready: "Warning: The PDF is not fully loaded for printing.",
//   web_fonts_disabled:
//     "Web fonts are disabled: unable to use embedded PDF fonts.",

//   free_text2_default_content: "Start typing…",
//   editor_free_text2_aria_label: "Text Editor",
//   editor_ink2_aria_label: "Draw Editor",
//   editor_ink_canvas_aria_label: "User-created image",
//   editor_alt_text_button_label: "Alt text",
//   editor_alt_text_edit_button_label: "Edit alt text",
//   editor_alt_text_decorative_tooltip: "Marked as decorative",
// };
// /*#static*/ if (PDFJSDev || !MOZCENTRAL) {
//   DEFAULT_L10N_STRINGS.print_progress_percent = "{{progress}}%";
// }

// export function getL10nFallback(key: string, args: WebL10nArgs) {
//   switch (key) {
//     case "find_match_count":
//       key = `find_match_count[${+args.total === 1 ? "one" : "other"}]`;
//       break;
//     case "find_match_count_limit":
//       key = `find_match_count_limit[${+args.limit === 1 ? "one" : "other"}]`;
//       break;
//   }
//   return DEFAULT_L10N_STRINGS[key] || "";
// }

// // Replaces {{arguments}} with their values.
// export function formatL10nValue(text: string, args?: WebL10nArgs) {
//   if (!args) {
//     return text;
//   }
//   return text.replaceAll(/\{\{\s*(\w+)\s*\}\}/g, (all, name) => {
//     return name in args ? args[name] : "{{" + name + "}}";
//   });
// }

export class ConstL10n extends L10n {
  constructor(lang: Locale) {
    super({ lang });
    this._setL10n(
      new DOMLocalization([], ConstL10n.#generateBundles.bind(ConstL10n, lang)),
    );
  }

  static async *#generateBundles(lang: Locale) {
    const text = /*#static*/ PDFJSDev
      ? await fetchData(
        new URL(`./locale/${lang}/viewer.ftl`, window.location.href),
        /* type = */ "text",
      )
      // : PDFJSDev.eval("DEFAULT_FTL");
      : await fetchData(
        new URL(`./locale/${lang}/viewer.ftl`, window.location.href),
        /* type = */ "text",
      );
    const resource = new FluentResource(text);
    const bundle = new FluentBundle(lang);
    const errors = bundle.addResource(resource);
    if (errors.length) {
      console.error("L10n errors", errors);
    }
    yield bundle;
  }

  static get instance() {
    return shadow(this, "instance", new ConstL10n(Locale.en_US));
  }
}

/**
 * No-op implementation of the localization service.
 */
export const NullL10n: IL10n = {
  getLanguage() {
    return ConstL10n.instance.getLanguage();
  },

  getDirection() {
    return ConstL10n.instance.getDirection();
  },

  async get<S extends string | string[]>(
    ids: S,
    args?: FluentMessageArgs,
    fallback?: string,
  ) {
    return ConstL10n.instance.get(ids, args, fallback);
  },

  async translate(element: HTMLElement) {
    return ConstL10n.instance.translate(element);
  },

  pause() {
    return ConstL10n.instance.pause();
  },

  resume() {
    return ConstL10n.instance.resume();
  },
};
/*80--------------------------------------------------------------------------*/
