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
export declare type Locale_1 = Locale | "fy-NL" | "pa-IN" | "zh-CN";
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
        const getLanguage: () => "" | "br" | "hr" | "th" | "tr" | "ff" | "af" | "af-na" | "af-za" | "agq" | "agq-cm" | "ak" | "ak-gh" | "am" | "am-et" | "ar" | "ar-001" | "ar-ae" | "ar-bh" | "ar-dz" | "ar-eg" | "ar-iq" | "ar-jo" | "ar-kw" | "ar-lb" | "ar-ly" | "ar-ma" | "ar-om" | "ar-qa" | "ar-sa" | "ar-sd" | "ar-sy" | "ar-tn" | "ar-ye" | "as" | "as-in" | "asa" | "asa-tz" | "az" | "az-cyrl" | "az-cyrl-az" | "az-latn" | "az-latn-az" | "bas" | "bas-cm" | "be" | "be-by" | "bem" | "bem-zm" | "bez" | "bez-tz" | "bg" | "bg-bg" | "bm" | "bm-ml" | "bn" | "bn-bd" | "bn-in" | "bo" | "bo-cn" | "bo-in" | "br-fr" | "brx" | "brx-in" | "bs" | "bs-ba" | "ca" | "ca-es" | "cgg" | "cgg-ug" | "chr" | "chr-us" | "cs" | "cs-cz" | "cy" | "cy-gb" | "da" | "da-dk" | "dav" | "dav-ke" | "de" | "de-at" | "de-be" | "de-ch" | "de-de" | "de-li" | "de-lu" | "dje" | "dje-ne" | "dua" | "dua-cm" | "dyo" | "dyo-sn" | "ebu" | "ebu-ke" | "ee" | "ee-gh" | "ee-tg" | "el" | "el-cy" | "el-gr" | "en" | "en-ae" | "en-ar" | "en-as" | "en-at" | "en-au" | "en-bb" | "en-be" | "en-bg" | "en-bh" | "en-bm" | "en-br" | "en-bw" | "en-bz" | "en-ca" | "en-ch" | "en-cl" | "en-cn" | "en-co" | "en-cr" | "en-cy" | "en-cz" | "en-de" | "en-dk" | "en-do" | "en-ee" | "en-eg" | "en-es" | "en-fi" | "en-gb" | "en-ge" | "en-gf" | "en-gh" | "en-gi" | "en-gr" | "en-gu" | "en-gy" | "en-hk" | "en-hr" | "en-hu" | "en-id" | "en-ie" | "en-il" | "en-in" | "en-is" | "en-it" | "en-jm" | "en-jo" | "en-jp" | "en-kr" | "en-kw" | "en-ky" | "en-lb" | "en-li" | "en-lt" | "en-lu" | "en-lv" | "en-ma" | "en-mc" | "en-mg" | "en-mh" | "en-mk" | "en-mo" | "en-mp" | "en-mt" | "en-mu" | "en-mx" | "en-my" | "en-na" | "en-nl" | "en-no" | "en-nz" | "en-om" | "en-pe" | "en-ph" | "en-pk" | "en-pl" | "en-pr" | "en-pt" | "en-py" | "en-qa" | "en-ro" | "en-ru" | "en-sa" | "en-se" | "en-sg" | "en-sk" | "en-si" | "en-th" | "en-tr" | "en-tt" | "en-tw" | "en-ua" | "en-um" | "en-us" | "en-us-posix" | "en-uy" | "en-ve" | "en-vi" | "en-vn" | "en-za" | "en-zw" | "eo" | "es" | "es-419" | "es-ar" | "es-bo" | "es-cl" | "es-co" | "es-cr" | "es-do" | "es-ec" | "es-es" | "es-gq" | "es-gt" | "es-hn" | "es-mx" | "es-ni" | "es-pa" | "es-pe" | "es-pr" | "es-py" | "es-sv" | "es-us" | "es-uy" | "es-ve" | "et" | "et-ee" | "eu" | "eu-es" | "ewo" | "ewo-cm" | "fa" | "fa-af" | "fa-ir" | "ff-sn" | "fi" | "fi-fi" | "fil" | "fil-ph" | "fo" | "fo-fo" | "fr" | "fr-be" | "fr-bf" | "fr-bi" | "fr-bj" | "fr-bl" | "fr-ca" | "fr-cd" | "fr-cf" | "fr-cg" | "fr-ch" | "fr-ci" | "fr-cm" | "fr-dj" | "fr-fr" | "fr-ga" | "fr-gf" | "fr-gn" | "fr-gp" | "fr-gq" | "fr-km" | "fr-lu" | "fr-mc" | "fr-mf" | "fr-mg" | "fr-ml" | "fr-mq" | "fr-ne" | "fr-re" | "fr-rw" | "fr-sn" | "fr-td" | "fr-tg" | "fr-yt" | "ga" | "ga-ie" | "gl" | "gl-es" | "gsw" | "gsw-ch" | "gu" | "gu-in" | "guz" | "guz-ke" | "gv" | "gv-gb" | "ha" | "ha-latn" | "ha-latn-gh" | "ha-latn-ne" | "ha-latn-ng" | "haw" | "haw-us" | "he" | "he-il" | "hi" | "hi-in" | "hr-hr" | "hu" | "hu-hu" | "hy" | "hy-am" | "id" | "id-id" | "ig" | "ig-ng" | "ii" | "ii-cn" | "is" | "is-is" | "it" | "it-ch" | "it-it" | "ja" | "ja-jp" | "jmc" | "jmc-tz" | "ka" | "ka-ge" | "kab" | "kab-dz" | "kam" | "kam-ke" | "kde" | "kde-tz" | "kea" | "kea-cv" | "khq" | "khq-ml" | "ki" | "ki-ke" | "kk" | "kk-cyrl" | "kk-cyrl-kz" | "kl" | "kl-gl" | "kln" | "kln-ke" | "km" | "km-kh" | "kn" | "kn-in" | "ko" | "ko-kr" | "kok" | "kok-in" | "ksb" | "ksb-tz" | "ksf" | "ksf-cm" | "kw" | "kw-gb" | "lag" | "lag-tz" | "lg" | "lg-ug" | "ln" | "ln-cd" | "ln-cg" | "lt" | "lt-lt" | "lu" | "lu-cd" | "luo" | "luo-ke" | "luy" | "luy-ke" | "lv" | "lv-lv" | "mas" | "mas-ke" | "mas-tz" | "mer" | "mer-ke" | "mfe" | "mfe-mu" | "mg" | "mg-mg" | "mgh" | "mgh-mz" | "mk" | "mk-mk" | "ml" | "ml-in" | "mr" | "mr-in" | "ms" | "ms-bn" | "ms-my" | "mt" | "mt-mt" | "mua" | "mua-cm" | "my" | "my-mm" | "naq" | "naq-na" | "nb" | "nb-no" | "nd" | "nd-zw" | "ne" | "ne-in" | "ne-np" | "nl" | "nl-aw" | "nl-be" | "nl-cw" | "nl-nl" | "nl-sx" | "nmg" | "nmg-cm" | "nn" | "nn-no" | "nus" | "nus-sd" | "nyn" | "nyn-ug" | "om" | "om-et" | "om-ke" | "or" | "or-in" | "pa" | "pa-arab" | "pa-arab-pk" | "pa-guru" | "pa-guru-in" | "pl" | "pl-pl" | "ps" | "ps-af" | "pt" | "pt-ao" | "pt-br" | "pt-gw" | "pt-mz" | "pt-pt" | "pt-st" | "rm" | "rm-ch" | "rn" | "rn-bi" | "ro" | "ro-md" | "ro-ro" | "rof" | "rof-tz" | "ru" | "ru-md" | "ru-ru" | "ru-ua" | "rw" | "rw-rw" | "rwk" | "rwk-tz" | "saq" | "saq-ke" | "sbp" | "sbp-tz" | "seh" | "seh-mz" | "ses" | "ses-ml" | "sg" | "sg-cf" | "shi" | "shi-latn" | "shi-latn-ma" | "shi-tfng" | "shi-tfng-ma" | "si" | "si-lk" | "sk" | "sk-sk" | "sl" | "sl-si" | "sn" | "sn-zw" | "so" | "so-dj" | "so-et" | "so-ke" | "so-so" | "sq" | "sq-al" | "sr" | "sr-cyrl" | "sr-cyrl-ba" | "sr-cyrl-me" | "sr-cyrl-rs" | "sr-latn" | "sr-latn-ba" | "sr-latn-me" | "sr-latn-rs" | "sv" | "sv-fi" | "sv-se" | "sw" | "sw-ke" | "sw-tz" | "swc" | "swc-cd" | "ta" | "ta-in" | "ta-lk" | "te" | "te-in" | "teo" | "teo-ke" | "teo-ug" | "th-th" | "ti" | "ti-er" | "ti-et" | "to" | "to-to" | "tr-tr" | "twq" | "twq-ne" | "tzm" | "tzm-latn" | "tzm-latn-ma" | "uk" | "uk-ua" | "ur" | "ur-in" | "ur-pk" | "uz" | "uz-arab" | "uz-arab-af" | "uz-cyrl" | "uz-cyrl-uz" | "uz-latn" | "uz-latn-uz" | "vai" | "vai-latn" | "vai-latn-lr" | "vai-vaii" | "vai-vaii-lr" | "vi" | "vi-vn" | "vun" | "vun-tz" | "xog" | "xog-ug" | "yav" | "yav-cm" | "yo" | "yo-ng" | "zh" | "zh-hans" | "zh-hans-ae" | "zh-hans-ar" | "zh-hans-at" | "zh-hans-au" | "zh-hans-be" | "zh-hans-bg" | "zh-hans-bh" | "zh-hans-br" | "zh-hans-bw" | "zh-hans-ca" | "zh-hans-ch" | "zh-hans-cl" | "zh-hans-cn" | "zh-hans-co" | "zh-hans-cr" | "zh-hans-cy" | "zh-hans-cz" | "zh-hans-de" | "zh-hans-dk" | "zh-hans-do" | "zh-hans-ee" | "zh-hans-eg" | "zh-hans-es" | "zh-hans-fi" | "zh-hans-gb" | "zh-hans-ge" | "zh-hans-gf" | "zh-hans-gh" | "zh-hans-gi" | "zh-hans-gr" | "zh-hans-hk" | "zh-hans-hr" | "zh-hans-hu" | "zh-hans-id" | "zh-hans-ie" | "zh-hans-il" | "zh-hans-in" | "zh-hans-is" | "zh-hans-it" | "zh-hans-jo" | "zh-hans-jp" | "zh-hans-kr" | "zh-hans-kw" | "zh-hans-ky" | "zh-hans-lb" | "zh-hans-li" | "zh-hans-lt" | "zh-hans-lu" | "zh-hans-lv" | "zh-hans-ma" | "zh-hans-mc" | "zh-hans-mg" | "zh-hans-mk" | "zh-hans-mo" | "zh-hans-mt" | "zh-hans-mu" | "zh-hans-mx" | "zh-hans-my" | "zh-hans-na" | "zh-hans-nl" | "zh-hans-no" | "zh-hans-nz" | "zh-hans-om" | "zh-hans-pe" | "zh-hans-ph" | "zh-hans-pk" | "zh-hans-pl" | "zh-hans-pr" | "zh-hans-pt" | "zh-hans-py" | "zh-hans-qa" | "zh-hans-ro" | "zh-hans-ru" | "zh-hans-sa" | "zh-hans-se" | "zh-hans-sg" | "zh-hans-sk" | "zh-hans-si" | "zh-hans-th" | "zh-hans-tr" | "zh-hans-tw" | "zh-hans-ua" | "zh-hans-us" | "zh-hans-uy" | "zh-hans-ve" | "zh-hans-vn" | "zh-hans-za" | "zh-hant" | "zh-hant-ae" | "zh-hant-ar" | "zh-hant-at" | "zh-hant-au" | "zh-hant-be" | "zh-hant-bg" | "zh-hant-bh" | "zh-hant-br" | "zh-hant-bw" | "zh-hant-ca" | "zh-hant-ch" | "zh-hant-cl" | "zh-hant-cn" | "zh-hant-co" | "zh-hant-cr" | "zh-hant-cy" | "zh-hant-cz" | "zh-hant-de" | "zh-hant-dk" | "zh-hant-do" | "zh-hant-ee" | "zh-hant-eg" | "zh-hant-es" | "zh-hant-fi" | "zh-hant-gb" | "zh-hant-ge" | "zh-hant-gf" | "zh-hant-gh" | "zh-hant-gi" | "zh-hant-gr" | "zh-hant-hk" | "zh-hant-hr" | "zh-hant-hu" | "zh-hant-id" | "zh-hant-ie" | "zh-hant-il" | "zh-hant-in" | "zh-hant-is" | "zh-hant-it" | "zh-hant-jo" | "zh-hant-jp" | "zh-hant-kr" | "zh-hant-kw" | "zh-hant-ky" | "zh-hant-lb" | "zh-hant-li" | "zh-hant-lt" | "zh-hant-lu" | "zh-hant-lv" | "zh-hant-ma" | "zh-hant-mc" | "zh-hant-mg" | "zh-hant-mk" | "zh-hant-mo" | "zh-hant-mt" | "zh-hant-mu" | "zh-hant-mx" | "zh-hant-my" | "zh-hant-na" | "zh-hant-nl" | "zh-hant-no" | "zh-hant-nz" | "zh-hant-om" | "zh-hant-pe" | "zh-hant-ph" | "zh-hant-pk" | "zh-hant-pl" | "zh-hant-pr" | "zh-hant-pt" | "zh-hant-py" | "zh-hant-qa" | "zh-hant-ro" | "zh-hant-ru" | "zh-hant-sa" | "zh-hant-se" | "zh-hant-sg" | "zh-hant-sk" | "zh-hant-si" | "zh-hant-th" | "zh-hant-tr" | "zh-hant-tw" | "zh-hant-ua" | "zh-hant-us" | "zh-hant-uy" | "zh-hant-ve" | "zh-hant-vn" | "zh-hant-za" | "zu" | "zu-za" | "fy-nl" | "pa-in" | "zh-cn";
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
export declare type WebL10nArgs = Ns_webL10n.L10nArgs;
export {};
//# sourceMappingURL=l10n.d.ts.map