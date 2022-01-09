/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

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

import { PasswordResponses } from "../pdf.ts-src/pdf.js";
import { type IL10n } from "./interfaces.js";
import { OverlayManager } from "./overlay_manager.js";
import { type ViewerConfiguration } from "./viewer.js";
/*81---------------------------------------------------------------------------*/

export class PasswordPrompt 
{
  overlayName;
  container;
  label
  input;
  submitButton;
  cancelButton;
  overlayManager;
  l10n;
  _isViewerEmbedded;

  updateCallback?:( password:string ) => void;
  reason?:PasswordResponses;

  /**
   * @param overlayManager Manager for the viewer overlays.
   * @param l10n Localization service.
   * @param isViewerEmbedded If the viewer is embedded, in e.g.
   *   an <iframe> or an <object>. The default value is `false`.
   */
  constructor( options:ViewerConfiguration['passwordOverlay'], 
    overlayManager:OverlayManager, l10n:IL10n, isViewerEmbedded=false 
  ) {
    this.overlayName = options.overlayName;
    this.container = options.container;
    this.label = options.label;
    this.input = options.input;
    this.submitButton = options.submitButton;
    this.cancelButton = options.cancelButton;
    this.overlayManager = overlayManager;
    this.l10n = l10n;
    this._isViewerEmbedded = isViewerEmbedded;

    // this.updateCallback = null;
    // this.reason = null;

    // Attach the event listeners.
    this.submitButton.addEventListener("click", this.verify.bind(this));
    this.cancelButton.addEventListener("click", this.close.bind(this));
    this.input.addEventListener("keydown", e => {
      if (e.keyCode === /* Enter = */ 13) {
        this.verify();
      }
    });

    this.overlayManager.register(
      this.overlayName,
      this.container,
      this.close.bind(this),
      true
    );
  }

  async open() {
    await this.overlayManager.open(this.overlayName);

    const passwordIncorrect =
      this.reason === PasswordResponses.INCORRECT_PASSWORD;

    if (!this._isViewerEmbedded || passwordIncorrect) {
      this.input.focus();
    }
    this.label.textContent = await this.l10n.get(
      `password_${passwordIncorrect ? "invalid" : "label"}`
    );
  }

  close() {
    this.overlayManager.close(this.overlayName).then(() => {
      this.input.value = "";
    });
  }

  verify() {
    const password = this.input.value;
    if( password?.length > 0 )
    {
      this.close();
      this.updateCallback!(password);
    }
  }

  setUpdateCallback( 
    updateCallback:( password:string ) => void, 
    reason:PasswordResponses
  ) {
    this.updateCallback = updateCallback;
    this.reason = reason;
  }
}
/*81---------------------------------------------------------------------------*/
