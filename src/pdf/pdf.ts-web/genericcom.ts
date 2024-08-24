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

import { GENERIC } from "@fe-src/global.ts";
import { AppOptions, type UserOptionMap, UserOptions } from "./app_options.ts";
import { BaseExternalServices } from "./external_services.ts";
import { GenericScripting } from "./generic_scripting.ts";
import { GenericL10n } from "./genericl10n.ts";
import { BasePreferences } from "./preferences.ts";
import type { PDFViewerApplication } from "./app.ts";
/*80--------------------------------------------------------------------------*/

/*#static*/ if (!GENERIC) {
  throw new Error(
    'Module "pdfjs-web/genericcom" shall not be used outside GENERIC build.',
  );
}

export function initCom(app: PDFViewerApplication) {}

export class Preferences extends BasePreferences {
  /** @implement */
  protected async _writeToStorage(prefObj: UserOptions) {
    localStorage.setItem("pdfjs.preferences", JSON.stringify(prefObj));
  }

  /** @implement */
  protected async _readFromStorage(prefObj: UserOptions) {
    return { prefs: JSON.parse(localStorage.getItem("pdfjs.preferences")!) };
  }
}

export class MLManager {
  eventBus!: unknown;

  async isEnabledFor(_name: "altText") {
    return false;
  }

  async deleteModel(_service: unknown): Promise<unknown> {
    return undefined;
  }

  async guess() {
    return undefined;
  }
}

export class ExternalServices extends BaseExternalServices {
  override async createL10n() {
    return new GenericL10n(AppOptions.localeProperties?.lang);
  }

  override createScripting() {
    return new GenericScripting(AppOptions.sandboxBundleSrc!);
  }
}
/*80--------------------------------------------------------------------------*/
