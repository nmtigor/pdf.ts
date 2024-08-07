/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/xfa/stylesheet.ts
 * @license Apache-2.0
 ******************************************************************************/

/* Copyright 2021 Mozilla Foundation
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

import { type XFAAttrs } from "./alias.ts";
import { $buildXFAObject, NamespaceIds } from "./namespaces.ts";
import { XFAObject } from "./xfa_object.ts";
/*80--------------------------------------------------------------------------*/

const STYLESHEET_NS_ID = NamespaceIds.stylesheet.id;

class Stylesheet extends XFAObject {
  constructor(attributes: XFAAttrs) {
    super(STYLESHEET_NS_ID, "stylesheet", /* hasChildren = */ true);
  }
}

export type XFANsStylesheet = typeof StylesheetNamespace;
type StylesheetName = Exclude<keyof XFANsStylesheet, symbol>;
export const StylesheetNamespace = {
  [$buildXFAObject](name: string, attributes: XFAAttrs) {
    if (Object.hasOwn(StylesheetNamespace, name)) {
      return StylesheetNamespace[<StylesheetName> name](attributes);
    }
    return undefined;
  },

  stylesheet(attrs: XFAAttrs) {
    return new Stylesheet(attrs);
  },
};
/*80--------------------------------------------------------------------------*/
