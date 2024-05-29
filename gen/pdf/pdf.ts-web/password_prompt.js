/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/password_prompt.ts
 * @license Apache-2.0
 ******************************************************************************/
/* Copyright 2012 Mozilla Foundation
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
import { PromiseCap } from "../../lib/util/PromiseCap.js";
import { PasswordResponses } from "../pdf.ts-src/pdf.js";
/*80--------------------------------------------------------------------------*/
export class PasswordPrompt {
    dialog;
    label;
    input;
    submitButton;
    cancelButton;
    overlayManager;
    _isViewerEmbedded;
    #activeCapability;
    #updateCallback;
    #reason;
    /**
     * @param overlayManager Manager for the viewer overlays.
     * @param l10n Localization service.
     * @param isViewerEmbedded If the viewer is embedded, in e.g.
     *   an <iframe> or an <object>. The default value is `false`.
     */
    constructor(options, overlayManager, isViewerEmbedded = false) {
        this.dialog = options.dialog;
        this.label = options.label;
        this.input = options.input;
        this.submitButton = options.submitButton;
        this.cancelButton = options.cancelButton;
        this.overlayManager = overlayManager;
        this._isViewerEmbedded = isViewerEmbedded;
        // Attach the event listeners.
        this.submitButton.on("click", this.#verify);
        this.cancelButton.on("click", this.close);
        this.input.on("keydown", (e) => {
            if (e.keyCode === /* Enter = */ 13) {
                this.#verify();
            }
        });
        this.overlayManager.register(this.dialog, /* canForceClose = */ true);
        this.dialog.on("close", this.#cancel);
    }
    async open() {
        await this.#activeCapability?.promise;
        this.#activeCapability = new PromiseCap();
        try {
            await this.overlayManager.open(this.dialog);
        }
        catch (ex) {
            this.#activeCapability.resolve();
            throw ex;
        }
        const passwordIncorrect = this.#reason === PasswordResponses.INCORRECT_PASSWORD;
        if (!this._isViewerEmbedded || passwordIncorrect) {
            this.input.focus();
        }
        this.label.setAttribute("data-l10n-id", `pdfjs-password-${passwordIncorrect ? "invalid" : "label"}`);
    }
    close = async () => {
        if (this.overlayManager.active === this.dialog) {
            this.overlayManager.close(this.dialog);
        }
    };
    #verify = () => {
        const password = this.input.value;
        if (password?.length > 0) {
            this.#invokeCallback(password);
        }
    };
    #cancel = () => {
        this.#invokeCallback(new Error("PasswordPrompt cancelled."));
        this.#activeCapability.resolve();
    };
    #invokeCallback(password) {
        if (!this.#updateCallback) {
            // Ensure that the callback is only invoked once.
            return;
        }
        this.close();
        this.input.value = "";
        this.#updateCallback(password);
        this.#updateCallback = undefined;
    }
    async setUpdateCallback(updateCallback, reason) {
        if (this.#activeCapability) {
            await this.#activeCapability.promise;
        }
        this.#updateCallback = updateCallback;
        this.#reason = reason;
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=password_prompt.js.map