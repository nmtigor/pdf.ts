/**
 * Copyright (c) 2011-2013 Fabien Cazenave, Mozilla.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */
import { Locale } from "../../lib/Locale.js";
export type Locale_1 = Locale | "fy-NL" | "pa-IN" | "zh-CN";
declare namespace Ns_webL10n {
    export type L10nArgs = Record<string, string>;
    /**
     * translate an HTML subtree
     */
    function translateFragment(element?: HTMLElement): void;
    export namespace webL10n {
        /**
         * get a localized string
         */
        function get(key: string, args?: L10nArgs, fallbackString?: string): string;
        /**
         * get the document language
         */
        const getLanguage: () => "" | "br" | "hr" | "th" | "tr" | "el" | "af" | "agq" | "ak" | "am" | "ar" | "ar-001" | "as" | "asa" | "az" | "bas" | "be" | "bem" | "bez" | "bg" | "bm" | "bn" | "bo" | "brx" | "bs" | "ca" | "cgg" | "chr" | "cs" | "cy" | "da" | "dav" | "de" | "dje" | "dua" | "dyo" | "ebu" | "ee" | "en" | "eo" | "es" | "es-419" | "et" | "eu" | "ewo" | "fa" | "ff" | "fi" | "fil" | "fo" | "fr" | "ga" | "gl" | "gsw" | "gu" | "guz" | "gv" | "ha" | "haw" | "he" | "hi" | "hu" | "hy" | "id" | "ig" | "ii" | "is" | "it" | "ja" | "jmc" | "ka" | "kab" | "kam" | "kde" | "kea" | "khq" | "ki" | "kk" | "kl" | "kln" | "km" | "kn" | "ko" | "kok" | "ksb" | "ksf" | "kw" | "lag" | "lg" | "ln" | "lt" | "lu" | "luo" | "luy" | "lv" | "mas" | "mer" | "mfe" | "mg" | "mgh" | "mk" | "ml" | "mr" | "ms" | "mt" | "mua" | "my" | "naq" | "nb" | "nd" | "ne" | "nl" | "nmg" | "nn" | "nus" | "nyn" | "om" | "or" | "pa" | "pl" | "ps" | "pt" | "rm" | "rn" | "ro" | "rof" | "ru" | "rw" | "rwk" | "saq" | "sbp" | "seh" | "ses" | "sg" | "shi" | "si" | "sk" | "sl" | "sn" | "so" | "sq" | "sr" | "sv" | "sw" | "swc" | "ta" | "te" | "teo" | "ti" | "to" | "twq" | "tzm" | "uk" | "ur" | "uz" | "vai" | "vi" | "vun" | "xog" | "yav" | "yo" | "zh" | "zu" | "af-na" | "af-za" | "agq-cm" | "ak-gh" | "am-et" | "ar-ae" | "ar-bh" | "ar-dz" | "ar-eg" | "ar-iq" | "ar-jo" | "ar-kw" | "ar-lb" | "ar-ly" | "ar-ma" | "ar-om" | "ar-qa" | "ar-sa" | "ar-sd" | "ar-sy" | "ar-tn" | "ar-ye" | "as-in" | "asa-tz" | "az-cyrl" | "az-cyrl-az" | "az-latn" | "az-latn-az" | "bas-cm" | "be-by" | "bem-zm" | "bez-tz" | "bg-bg" | "bm-ml" | "bn-bd" | "bn-in" | "bo-cn" | "bo-in" | "br-fr" | "brx-in" | "bs-ba" | "ca-es" | "cgg-ug" | "chr-us" | "cs-cz" | "cy-gb" | "da-dk" | "dav-ke" | "de-at" | "de-be" | "de-ch" | "de-de" | "de-li" | "de-lu" | "dje-ne" | "dua-cm" | "dyo-sn" | "ebu-ke" | "ee-gh" | "ee-tg" | "el-cy" | "el-gr" | "en-ae" | "en-ar" | "en-as" | "en-at" | "en-au" | "en-bb" | "en-be" | "en-bg" | "en-bh" | "en-bm" | "en-br" | "en-bw" | "en-bz" | "en-ca" | "en-ch" | "en-cl" | "en-cn" | "en-co" | "en-cr" | "en-cy" | "en-cz" | "en-de" | "en-dk" | "en-do" | "en-ee" | "en-eg" | "en-es" | "en-fi" | "en-gb" | "en-ge" | "en-gf" | "en-gh" | "en-gi" | "en-gr" | "en-gu" | "en-gy" | "en-hk" | "en-hr" | "en-hu" | "en-id" | "en-ie" | "en-il" | "en-in" | "en-is" | "en-it" | "en-jm" | "en-jo" | "en-jp" | "en-kr" | "en-kw" | "en-ky" | "en-lb" | "en-li" | "en-lt" | "en-lu" | "en-lv" | "en-ma" | "en-mc" | "en-mg" | "en-mh" | "en-mk" | "en-mo" | "en-mp" | "en-mt" | "en-mu" | "en-mx" | "en-my" | "en-na" | "en-nl" | "en-no" | "en-nz" | "en-om" | "en-pe" | "en-ph" | "en-pk" | "en-pl" | "en-pr" | "en-pt" | "en-py" | "en-qa" | "en-ro" | "en-ru" | "en-sa" | "en-se" | "en-sg" | "en-sk" | "en-si" | "en-th" | "en-tr" | "en-tt" | "en-tw" | "en-ua" | "en-um" | "en-us" | "en-us-posix" | "en-uy" | "en-ve" | "en-vi" | "en-vn" | "en-za" | "en-zw" | "es-ar" | "es-bo" | "es-cl" | "es-co" | "es-cr" | "es-do" | "es-ec" | "es-es" | "es-gq" | "es-gt" | "es-hn" | "es-mx" | "es-ni" | "es-pa" | "es-pe" | "es-pr" | "es-py" | "es-sv" | "es-us" | "es-uy" | "es-ve" | "et-ee" | "eu-es" | "ewo-cm" | "fa-af" | "fa-ir" | "ff-sn" | "fi-fi" | "fil-ph" | "fo-fo" | "fr-be" | "fr-bf" | "fr-bi" | "fr-bj" | "fr-bl" | "fr-ca" | "fr-cd" | "fr-cf" | "fr-cg" | "fr-ch" | "fr-ci" | "fr-cm" | "fr-dj" | "fr-fr" | "fr-ga" | "fr-gf" | "fr-gn" | "fr-gp" | "fr-gq" | "fr-km" | "fr-lu" | "fr-mc" | "fr-mf" | "fr-mg" | "fr-ml" | "fr-mq" | "fr-ne" | "fr-re" | "fr-rw" | "fr-sn" | "fr-td" | "fr-tg" | "fr-yt" | "ga-ie" | "gl-es" | "gsw-ch" | "gu-in" | "guz-ke" | "gv-gb" | "ha-latn" | "ha-latn-gh" | "ha-latn-ne" | "ha-latn-ng" | "haw-us" | "he-il" | "hi-in" | "hr-hr" | "hu-hu" | "hy-am" | "id-id" | "ig-ng" | "ii-cn" | "is-is" | "it-ch" | "it-it" | "ja-jp" | "jmc-tz" | "ka-ge" | "kab-dz" | "kam-ke" | "kde-tz" | "kea-cv" | "khq-ml" | "ki-ke" | "kk-cyrl" | "kk-cyrl-kz" | "kl-gl" | "kln-ke" | "km-kh" | "kn-in" | "ko-kr" | "kok-in" | "ksb-tz" | "ksf-cm" | "kw-gb" | "lag-tz" | "lg-ug" | "ln-cd" | "ln-cg" | "lt-lt" | "lu-cd" | "luo-ke" | "luy-ke" | "lv-lv" | "mas-ke" | "mas-tz" | "mer-ke" | "mfe-mu" | "mg-mg" | "mgh-mz" | "mk-mk" | "ml-in" | "mr-in" | "ms-bn" | "ms-my" | "mt-mt" | "mua-cm" | "my-mm" | "naq-na" | "nb-no" | "nd-zw" | "ne-in" | "ne-np" | "nl-aw" | "nl-be" | "nl-cw" | "nl-nl" | "nl-sx" | "nmg-cm" | "nn-no" | "nus-sd" | "nyn-ug" | "om-et" | "om-ke" | "or-in" | "pa-arab" | "pa-arab-pk" | "pa-guru" | "pa-guru-in" | "pl-pl" | "ps-af" | "pt-ao" | "pt-br" | "pt-gw" | "pt-mz" | "pt-pt" | "pt-st" | "rm-ch" | "rn-bi" | "ro-md" | "ro-ro" | "rof-tz" | "ru-md" | "ru-ru" | "ru-ua" | "rw-rw" | "rwk-tz" | "saq-ke" | "sbp-tz" | "seh-mz" | "ses-ml" | "sg-cf" | "shi-latn" | "shi-latn-ma" | "shi-tfng" | "shi-tfng-ma" | "si-lk" | "sk-sk" | "sl-si" | "sn-zw" | "so-dj" | "so-et" | "so-ke" | "so-so" | "sq-al" | "sr-cyrl" | "sr-cyrl-ba" | "sr-cyrl-me" | "sr-cyrl-rs" | "sr-latn" | "sr-latn-ba" | "sr-latn-me" | "sr-latn-rs" | "sv-fi" | "sv-se" | "sw-ke" | "sw-tz" | "swc-cd" | "ta-in" | "ta-lk" | "te-in" | "teo-ke" | "teo-ug" | "th-th" | "ti-er" | "ti-et" | "to-to" | "tr-tr" | "twq-ne" | "tzm-latn" | "tzm-latn-ma" | "uk-ua" | "ur-in" | "ur-pk" | "uz-arab" | "uz-arab-af" | "uz-cyrl" | "uz-cyrl-uz" | "uz-latn" | "uz-latn-uz" | "vai-latn" | "vai-latn-lr" | "vai-vaii" | "vai-vaii-lr" | "vi-vn" | "vun-tz" | "xog-ug" | "yav-cm" | "yo-ng" | "zh-hans" | "zh-hans-ae" | "zh-hans-ar" | "zh-hans-at" | "zh-hans-au" | "zh-hans-be" | "zh-hans-bg" | "zh-hans-bh" | "zh-hans-br" | "zh-hans-bw" | "zh-hans-ca" | "zh-hans-ch" | "zh-hans-cl" | "zh-hans-cn" | "zh-hans-co" | "zh-hans-cr" | "zh-hans-cy" | "zh-hans-cz" | "zh-hans-de" | "zh-hans-dk" | "zh-hans-do" | "zh-hans-ee" | "zh-hans-eg" | "zh-hans-es" | "zh-hans-fi" | "zh-hans-gb" | "zh-hans-ge" | "zh-hans-gf" | "zh-hans-gh" | "zh-hans-gi" | "zh-hans-gr" | "zh-hans-hk" | "zh-hans-hr" | "zh-hans-hu" | "zh-hans-id" | "zh-hans-ie" | "zh-hans-il" | "zh-hans-in" | "zh-hans-is" | "zh-hans-it" | "zh-hans-jo" | "zh-hans-jp" | "zh-hans-kr" | "zh-hans-kw" | "zh-hans-ky" | "zh-hans-lb" | "zh-hans-li" | "zh-hans-lt" | "zh-hans-lu" | "zh-hans-lv" | "zh-hans-ma" | "zh-hans-mc" | "zh-hans-mg" | "zh-hans-mk" | "zh-hans-mo" | "zh-hans-mt" | "zh-hans-mu" | "zh-hans-mx" | "zh-hans-my" | "zh-hans-na" | "zh-hans-nl" | "zh-hans-no" | "zh-hans-nz" | "zh-hans-om" | "zh-hans-pe" | "zh-hans-ph" | "zh-hans-pk" | "zh-hans-pl" | "zh-hans-pr" | "zh-hans-pt" | "zh-hans-py" | "zh-hans-qa" | "zh-hans-ro" | "zh-hans-ru" | "zh-hans-sa" | "zh-hans-se" | "zh-hans-sg" | "zh-hans-sk" | "zh-hans-si" | "zh-hans-th" | "zh-hans-tr" | "zh-hans-tw" | "zh-hans-ua" | "zh-hans-us" | "zh-hans-uy" | "zh-hans-ve" | "zh-hans-vn" | "zh-hans-za" | "zh-hant" | "zh-hant-ae" | "zh-hant-ar" | "zh-hant-at" | "zh-hant-au" | "zh-hant-be" | "zh-hant-bg" | "zh-hant-bh" | "zh-hant-br" | "zh-hant-bw" | "zh-hant-ca" | "zh-hant-ch" | "zh-hant-cl" | "zh-hant-cn" | "zh-hant-co" | "zh-hant-cr" | "zh-hant-cy" | "zh-hant-cz" | "zh-hant-de" | "zh-hant-dk" | "zh-hant-do" | "zh-hant-ee" | "zh-hant-eg" | "zh-hant-es" | "zh-hant-fi" | "zh-hant-gb" | "zh-hant-ge" | "zh-hant-gf" | "zh-hant-gh" | "zh-hant-gi" | "zh-hant-gr" | "zh-hant-hk" | "zh-hant-hr" | "zh-hant-hu" | "zh-hant-id" | "zh-hant-ie" | "zh-hant-il" | "zh-hant-in" | "zh-hant-is" | "zh-hant-it" | "zh-hant-jo" | "zh-hant-jp" | "zh-hant-kr" | "zh-hant-kw" | "zh-hant-ky" | "zh-hant-lb" | "zh-hant-li" | "zh-hant-lt" | "zh-hant-lu" | "zh-hant-lv" | "zh-hant-ma" | "zh-hant-mc" | "zh-hant-mg" | "zh-hant-mk" | "zh-hant-mo" | "zh-hant-mt" | "zh-hant-mu" | "zh-hant-mx" | "zh-hant-my" | "zh-hant-na" | "zh-hant-nl" | "zh-hant-no" | "zh-hant-nz" | "zh-hant-om" | "zh-hant-pe" | "zh-hant-ph" | "zh-hant-pk" | "zh-hant-pl" | "zh-hant-pr" | "zh-hant-pt" | "zh-hant-py" | "zh-hant-qa" | "zh-hant-ro" | "zh-hant-ru" | "zh-hant-sa" | "zh-hant-se" | "zh-hant-sg" | "zh-hant-sk" | "zh-hant-si" | "zh-hant-th" | "zh-hant-tr" | "zh-hant-tw" | "zh-hant-ua" | "zh-hant-us" | "zh-hant-uy" | "zh-hant-ve" | "zh-hant-vn" | "zh-hant-za" | "zu-za" | "fy-nl" | "pa-in" | "zh-cn";
        /**
         * set the document language
         */
        function setLanguage(lang: Locale_1, callback?: () => void): void;
        /**
         * get the direction (ltr|rtl) of the current language
         */
        function getDirection(): "rtl" | "ltr";
        /**
         * translate an element or document fragment
         */
        const translate: typeof translateFragment;
    }
    export {};
}
export import webL10n = Ns_webL10n.webL10n;
export type WebL10nArgs = Ns_webL10n.L10nArgs;
export {};
//# sourceMappingURL=l10n.d.ts.map