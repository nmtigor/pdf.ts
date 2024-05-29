/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/genericcom.ts
 * @license Apache-2.0
 ******************************************************************************/
import { type UserOptions } from "./app_options.js";
import { BaseExternalServices } from "./external_services.js";
import { GenericScripting } from "./generic_scripting.js";
import { GenericL10n } from "./genericl10n.js";
import { BasePreferences } from "./preferences.js";
import type { PDFViewerApplication } from "./app.js";
export declare function initCom(app: PDFViewerApplication): void;
export declare class Preferences extends BasePreferences {
    protected _writeToStorage(prefObj: UserOptions): Promise<void>;
    /** @implement */
    protected _readFromStorage(prefObj: {
        prefs: UserOptions;
    }): Promise<{
        prefs: any;
    }>;
}
export declare class MLManager {
    guess(): Promise<undefined>;
}
export declare class ExternalServices extends BaseExternalServices {
    createL10n(): Promise<GenericL10n>;
    createScripting(): GenericScripting;
}
//# sourceMappingURL=genericcom.d.ts.map