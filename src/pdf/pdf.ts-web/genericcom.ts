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

import { GENERIC, INOUT } from "../../global.ts";
import { Locale } from "../../lib/Locale.ts";
import { assert } from "../../lib/util/trace.ts";
import { DefaultExternalServices, viewerApp } from "./app.ts";
import { type UserOptions } from "./app_options.ts";
import { DownloadManager } from "./download_manager.ts";
import { GenericL10n } from "./genericl10n.ts";
import { GenericScripting } from "./generic_scripting.ts";
import { BasePreferences } from "./preferences.ts";
/*80--------------------------------------------------------------------------*/

/*#static*/ if (!GENERIC) {
  throw new Error(
    'Module "pdfjs-web/genericcom" shall not be used outside GENERIC build.',
  );
}

export const GenericCom = {};

class GenericPreferences extends BasePreferences {
  /** @implement */
  protected async _writeToStorage(prefObj: UserOptions) {
    localStorage.setItem("pdfjs.preferences", JSON.stringify(prefObj));
  }

  /** @implement */
  protected async _readFromStorage(prefObj: UserOptions) {
    return JSON.parse(localStorage.getItem("pdfjs.preferences")!);
  }
}

class GenericExternalServices extends DefaultExternalServices {
  static #initialized = false;

  constructor() {
    /*#static*/ if (INOUT) {
      assert(!GenericExternalServices.#initialized);
    }
    super();

    GenericExternalServices.#initialized = true;
  }

  override createDownloadManager() {
    return new DownloadManager();
  }

  override createPreferences() {
    return new GenericPreferences();
  }

  override createL10n({ locale = Locale.en_US } = {}) {
    return new GenericL10n(locale);
  }

  override createScripting({ sandboxBundleSrc = "" }) {
    return new GenericScripting(sandboxBundleSrc);
  }
}
viewerApp.externalServices = new GenericExternalServices();
/*80--------------------------------------------------------------------------*/
