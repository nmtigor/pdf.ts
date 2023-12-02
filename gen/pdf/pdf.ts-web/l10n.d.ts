import type { FluentMessageArgs } from "../../3rd/fluent/dom/esm/localization.js";
import type { Locale } from "../../lib/Locale.js";
import type { DOMLocalization } from "../../3rd/fluent/dom/esm/index.js";
import type { IL10n } from "./interfaces.js";
declare global {
    interface Document {
        l10n: DOMLocalization;
    }
}
export type L10nCtorP = {
    lang: Locale;
    isRTL?: boolean;
};
export declare class L10n implements IL10n {
    #private;
    constructor({ lang, isRTL }: L10nCtorP, l10n?: DOMLocalization);
    _setL10n(l10n: DOMLocalization): void;
    /** @implement */
    getLanguage(): Locale;
    /** @implement */
    getDirection(): "rtl" | "ltr";
    /** @implement */
    get<S extends string | string[]>(ids: S, args?: FluentMessageArgs, fallback?: string): Promise<S>;
    /** @implement */
    translate(element: HTMLElement): Promise<void>;
    /** @implement */
    pause(): void;
    /** @implement */
    resume(): void;
}
//# sourceMappingURL=l10n.d.ts.map