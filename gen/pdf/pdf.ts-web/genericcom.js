/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/genericcom.ts
 * @license Apache-2.0
 ******************************************************************************/
/* Copyright 2017 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { GENERIC } from "../../global.js";
import { AppOptions } from "./app_options.js";
import { BaseExternalServices } from "./external_services.js";
import { GenericScripting } from "./generic_scripting.js";
import { GenericL10n } from "./genericl10n.js";
import { BasePreferences } from "./preferences.js";
/*80--------------------------------------------------------------------------*/
/*#static*/ 
export function initCom(app) { }
export class Preferences extends BasePreferences {
    /** @implement */
    async _writeToStorage(prefObj) {
        localStorage.setItem("pdfjs.preferences", JSON.stringify(prefObj));
    }
    /** @implement */
    async _readFromStorage(prefObj) {
        return { prefs: JSON.parse(localStorage.getItem("pdfjs.preferences")) };
    }
}
export class MLManager {
    eventBus;
    async isEnabledFor(_name) {
        return false;
    }
    async deleteModel(_service) {
        return undefined;
    }
    async guess() {
        return undefined;
    }
}
export class ExternalServices extends BaseExternalServices {
    async createL10n() {
        return new GenericL10n(AppOptions.localeProperties?.lang);
    }
    createScripting() {
        return new GenericScripting(AppOptions.sandboxBundleSrc);
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=genericcom.js.map