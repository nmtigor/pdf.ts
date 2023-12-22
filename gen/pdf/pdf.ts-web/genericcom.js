/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
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
import { assert } from "../../lib/util/trace.js";
import { GENERIC, INOUT } from "../../global.js";
import { DefaultExternalServices, viewerApp } from "./app.js";
import { AppOptions } from "./app_options.js";
import { DownloadManager } from "./download_manager.js";
import { GenericScripting } from "./generic_scripting.js";
import { GenericL10n } from "./genericl10n.js";
import { BasePreferences } from "./preferences.js";
/*80--------------------------------------------------------------------------*/
/*#static*/ 
export const GenericCom = {};
class GenericPreferences extends BasePreferences {
    async _writeToStorage(prefObj) {
        localStorage.setItem("pdfjs.preferences", JSON.stringify(prefObj));
    }
    /** @implement */
    async _readFromStorage(prefObj) {
        return { prefs: JSON.parse(localStorage.getItem("pdfjs.preferences")) };
    }
}
class GenericExternalServices extends DefaultExternalServices {
    static #initialized = false;
    constructor() {
        /*#static*/  {
            assert(!GenericExternalServices.#initialized);
        }
        super();
        GenericExternalServices.#initialized = true;
    }
    createDownloadManager() {
        return new DownloadManager();
    }
    createPreferences() {
        return new GenericPreferences();
    }
    async createL10n() {
        return new GenericL10n(AppOptions.locale);
    }
    createScripting({ sandboxBundleSrc = "" }) {
        return new GenericScripting(sandboxBundleSrc);
    }
}
viewerApp.externalServices = new GenericExternalServices();
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=genericcom.js.map