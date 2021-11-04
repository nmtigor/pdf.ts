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

import { assert } from '../../lib/util/trace.js';
import { Locale } from '../../lib/Locale.js';
import { viewerapp, DefaultExternalServices } from "./app.js";
import { BasePreferences } from "./preferences.js";
import { DownloadManager } from "./download_manager.js";
import { GenericL10n } from "./genericl10n.js";
import { UserOptions } from "./app_options.js";
// import { GenericScripting } from "./generic_scripting.js";
/*81---------------------------------------------------------------------------*/

// #if !GENERIC
  // if (typeof PDFJSDev !== "undefined" && !PDFJSDev.test("GENERIC")) {
  throw new Error(
    'Module "pdfjs-web/genericcom" shall not be used outside ' +
    "GENERIC build."
  );
  // }
// #endif

export const GenericCom = {};

class GenericPreferences extends BasePreferences 
{
  /** @implements */
  protected async _writeToStorage( prefObj:UserOptions ) 
  {
    localStorage.setItem("pdfjs.preferences", JSON.stringify(prefObj));
  }

  /** @implements */
  protected async _readFromStorage( prefObj:UserOptions ) 
  {
    return JSON.parse( localStorage.getItem("pdfjs.preferences")! );
  }
}

class GenericExternalServices extends DefaultExternalServices 
{
  static #initialized = false;

  constructor()
  {
    // #if INOUT
      assert( !GenericExternalServices.#initialized );
    // #endif
    super();
    
    GenericExternalServices.#initialized = true;
  }

  override createDownloadManager() { return new DownloadManager(); }

  override createPreferences() { return new GenericPreferences(); }

  override createL10n({ locale=Locale.en_US }={} )
  {
    return new GenericL10n(locale);
  }

  // override createScripting({ sandboxBundleSrc='' })
  // {
  //   return new GenericScripting(sandboxBundleSrc);
  // }
}
viewerapp.externalServices = new GenericExternalServices();
/*81---------------------------------------------------------------------------*/
