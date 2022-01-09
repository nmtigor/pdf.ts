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

import {
  $appendChild,
  $isNsAgnostic,
  $namespaceId,
  $nodeName,
  $onChild,
  XFAObject,
  XmlObject,
} from "./xfa_object.js";
import { $buildXFAObject, NamespaceIds } from "./namespaces.js";
import { type XFAAttrs } from "./alias.js";
/*81---------------------------------------------------------------------------*/

const DATASETS_NS_ID = NamespaceIds.datasets.id;

class Data extends XmlObject
{
  constructor( attributes:XFAAttrs )
  {
    super( DATASETS_NS_ID, "data", attributes );
  }

  override [$isNsAgnostic]() { return true; }
}

export class Datasets extends XFAObject
{
  data?:Data;
  Signature:unknown;

  constructor( attributes:XFAAttrs )
  {
    super( DATASETS_NS_ID, "datasets", /* hasChildren = */ true );
  }

  override [$onChild]( child:XFAObject )
  {
    const name = child[$nodeName];
    if (
      (name === "data" && child[$namespaceId] === DATASETS_NS_ID) ||
      (name === "Signature" &&
        child[$namespaceId] === NamespaceIds.signature.id)
    ) {
      (<any>this)[name] = child;
    } 
    this[$appendChild]( child );
    return true;
  }
}

export type XFANsDatasets = typeof DatasetsNamespace;
type DatasetsName = Exclude<keyof XFANsDatasets, symbol>;
export const DatasetsNamespace =
{
  [$buildXFAObject]( name:string, attributes:XFAAttrs )
  {
    if( DatasetsNamespace.hasOwnProperty(name) )
    {
      return DatasetsNamespace[<DatasetsName>name]( attributes );
    }
    return undefined;
  },

  datasets( attrs:XFAAttrs ) { return new Datasets( attrs ); },
  data( attrs:XFAAttrs ) { return new Data( attrs ); },
}
/*81---------------------------------------------------------------------------*/
