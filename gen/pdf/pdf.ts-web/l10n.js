/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2023
 */
import { TESTING } from "../../global.js";
export class L10n {
    #dir;
    #lang;
    #l10n;
    constructor({ lang, isRTL }, l10n) {
        this.#lang = L10n.#fixupLangCode(lang);
        this.#l10n = l10n;
        this.#dir = isRTL ?? L10n.#isRTL(this.#lang) ? "rtl" : "ltr";
    }
    _setL10n(l10n) {
        this.#l10n = l10n;
        /*#static*/ 
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
    async get(ids, args, fallback) {
        if (Array.isArray(ids)) {
            const messages = await this.#l10n.formatMessages(ids.map((id) => ({ id })));
            return messages.map((message) => message.value);
        }
        const messages = await this.#l10n.formatMessages([{
                id: ids,
                args,
            }]);
        return (messages?.[0].value || fallback);
    }
    /** @implement */
    async translate(element) {
        try {
            this.#l10n.connectRoot(element);
            await this.#l10n.translateRoots();
        }
        catch {
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
    static #fixupLangCode(langCode) {
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
        };
        return PARTIAL_LANG_CODES[langCode?.toLowerCase()] || langCode;
    }
    static #isRTL(lang) {
        const shortCode = lang.split("-", 1)[0];
        return ["ar", "he", "fa", "ps", "ur"].includes(shortCode);
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=l10n.js.map