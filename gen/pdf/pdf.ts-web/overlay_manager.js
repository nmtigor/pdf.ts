/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
/* Copyright 2014 Mozilla Foundation
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
import { isObjectLike } from "../../lib/jslang.js";
/*80--------------------------------------------------------------------------*/
export class OverlayManager {
    #overlays = new WeakMap();
    #active;
    get active() {
        return this.#active;
    }
    _dialogPolyfillCSS;
    /**
     * @param dialog The overlay's DOM element.
     * @param canForceClose Indicates if opening the overlay closes
     *  an active overlay. The default is `false`.
     * @return A promise that is resolved when the overlay has been registered.
     */
    async register(dialog, canForceClose = false) {
        if (!isObjectLike(dialog)) {
            throw new Error("Not enough parameters.");
        }
        else if (this.#overlays.has(dialog)) {
            throw new Error("The overlay is already registered.");
        }
        this.#overlays.set(dialog, { canForceClose });
        dialog.on("cancel", (evt) => {
            this.#active = undefined;
        });
    }
    /**
     * @param dialog The overlay's DOM element.
     * @return A promise that is resolved when the overlay has been opened.
     */
    async open(dialog) {
        if (!this.#overlays.has(dialog)) {
            throw new Error("The overlay does not exist.");
        }
        else if (this.#active) {
            if (this.#active === dialog) {
                throw new Error("The overlay is already active.");
            }
            else if (this.#overlays.get(dialog).canForceClose) {
                await this.close();
            }
            else {
                throw new Error("Another overlay is currently active.");
            }
        }
        this.#active = dialog;
        dialog.showModal();
    }
    /**
     * @param dialog The overlay's DOM element.
     * @return A promise that is resolved when the overlay has been closed.
     */
    async close(dialog = this.#active) {
        if (!this.#overlays.has(dialog)) {
            throw new Error("The overlay does not exist.");
        }
        else if (!this.#active) {
            throw new Error("The overlay is currently not active.");
        }
        else if (this.#active !== dialog) {
            throw new Error("Another overlay is currently active.");
        }
        dialog.close();
        this.#active = undefined;
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=overlay_manager.js.map