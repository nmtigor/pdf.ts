import { type Locale_1, type WebL10nArgs } from "../../3rd/webL10n/l10n.js";
import { Locale } from "../../lib/Locale.js";
import { type IL10n } from "./interfaces.js";
export declare function getL10nFallback(key: string, args: WebL10nArgs): string;
export declare function fixupLangCode(langCode?: Locale): Locale_1;
export declare function formatL10nValue(text: string, args?: WebL10nArgs): string;
/**
 * No-op implementation of the localization service.
 */
export declare const NullL10n: IL10n;
//# sourceMappingURL=l10n_utils.d.ts.map