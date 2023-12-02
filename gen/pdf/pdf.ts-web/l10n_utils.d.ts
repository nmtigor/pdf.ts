import { Locale } from "../../lib/Locale.js";
import type { IL10n } from "./interfaces.js";
import { L10n } from "./l10n.js";
export declare class ConstL10n extends L10n {
    #private;
    constructor(lang: Locale);
    static get instance(): ConstL10n;
}
/**
 * No-op implementation of the localization service.
 */
export declare const NullL10n: IL10n;
//# sourceMappingURL=l10n_utils.d.ts.map