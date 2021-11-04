import { Locale_1, WebL10nArgs } from "../../lib/l10n";
import { Locale } from "../../lib/Locale";
import { IL10n } from "./interfaces";
export declare function getL10nFallback(key: string, args: WebL10nArgs): string;
export declare function fixupLangCode(langCode?: Locale): Locale_1;
export declare function formatL10nValue(text: string, args?: WebL10nArgs): string;
/**
 * No-op implementation of the localization service.
 */
export declare const NullL10n: IL10n;
//# sourceMappingURL=l10n_utils.d.ts.map