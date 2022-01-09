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
/** @typedef {import("./interfaces").IL10n} IL10n */
import { webL10n } from "../../lib/l10n.js";
import { fixupLangCode, getL10nFallback } from "./l10n_utils.js";
/*81---------------------------------------------------------------------------*/
// const webL10n = document.webL10n;
export class GenericL10n {
    _lang;
    _ready;
    constructor(lang) {
        this._lang = lang;
        this._ready = new Promise((resolve, reject) => {
            webL10n.setLanguage(fixupLangCode(lang), () => {
                resolve(webL10n);
            });
        });
    }
    /** @implements */
    async getLanguage() {
        const l10n = await this._ready;
        return l10n.getLanguage();
    }
    /** @implements */
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
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=genericl10n.js.map