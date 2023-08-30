/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
import { webL10n } from "../../3rd/webL10n-2015-10-24/l10n.js";
import { getL10nFallback } from "./l10n_utils.js";
/*80--------------------------------------------------------------------------*/
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
};
// Try to support "incompletely" specified language codes (see issue 13689).
export function fixupLangCode(langCode) {
    return PARTIAL_LANG_CODES[langCode?.toLowerCase()] || langCode;
}
export class GenericL10n {
    _lang;
    _ready;
    constructor(lang) {
        // const { webL10n } = document;
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
    async get(key, args, fallback = getL10nFallback(key, args)) {
        const l10n = await this._ready;
        return l10n.get(key, args, fallback);
    }
    async translate(element) {
        const l10n = await this._ready;
        return l10n.translate(element);
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=genericl10n.js.map