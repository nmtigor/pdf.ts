/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
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

import { $buildXFAObject } from "./namespaces.js";
import { type XFAAttrs } from "./alias.js";
import { XmlObject } from "./xfa_object.js";
/*81---------------------------------------------------------------------------*/

export class UnknownNamespace
{
  namespaceId;

  constructor( nsId:number )
  {
    this.namespaceId = nsId;
  }

  [$buildXFAObject]( name:string, attributes:XFAAttrs )
  {
    return new XmlObject( <any>this.namespaceId, name, attributes );
  }
}
/*81---------------------------------------------------------------------------*/
