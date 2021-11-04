/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
 */

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

import { ConfigNamespace, XFANsConfig } from "./config.js";
import { ConnectionSetNamespace, XFANsConnectionSet } from "./connection_set.js";
import { DatasetsNamespace, XFANsDatasets } from "./datasets.js";
import { LocaleSetNamespace, XFANsLocaleSet } from "./locale_set.js";
import { XFANsName } from "./namespaces.js";
import { SignatureNamespace, XFANsSignature } from "./signature.js";
import { StylesheetNamespace, XFANsStylesheet } from "./stylesheet.js";
import { TemplateNamespace, XFANsTemplate } from "./template.js";
import { XdpNamespace, XFANsXdp } from "./xdp.js";
import { XFANsXhtml, XhtmlNamespace } from "./xhtml.js";
/*81---------------------------------------------------------------------------*/

export type XFAKnownNs =
  | XFANsConfig
  | XFANsConnectionSet
  | XFANsDatasets
  | XFANsLocaleSet
  | XFANsSignature
  | XFANsStylesheet
  | XFANsTemplate
  | XFANsXdp
  | XFANsXhtml
;

export const NamespaceSetUp:{
  [_ in XFANsName]?:XFAKnownNs
} = {
  config: ConfigNamespace,
  connectionSet: ConnectionSetNamespace,
  datasets: DatasetsNamespace,
  localeSet: LocaleSetNamespace,
  signature: SignatureNamespace,
  stylesheet: StylesheetNamespace,
  template: TemplateNamespace,
  xdp: XdpNamespace,
  xhtml: XhtmlNamespace,
};
/*81---------------------------------------------------------------------------*/
