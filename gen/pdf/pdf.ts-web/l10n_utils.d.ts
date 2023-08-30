import type { WebL10nArgs } from "../../3rd/webL10n-2015-10-24/l10n.js";
import type { IL10n } from "./interfaces.js";
export declare function getL10nFallback(key: string, args: WebL10nArgs): string;
export declare function formatL10nValue(text: string, args?: WebL10nArgs): string;
/**
 * No-op implementation of the localization service.
 */
export declare const NullL10n: IL10n;
//# sourceMappingURL=l10n_utils.d.ts.map