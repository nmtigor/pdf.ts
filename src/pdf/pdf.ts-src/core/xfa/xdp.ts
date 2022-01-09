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

import { ConnectionSet } from "./connection_set.js";
import { Datasets } from "./datasets.js";
import { $buildXFAObject, NamespaceIds, type XFANsName } from "./namespaces.js";
import { Template } from "./template.js";
import { type XFAAttrs } from "./alias.js";
import {
  $namespaceId,
  $nodeName,
  $onChildCheck,
  XFAObject,
  XFAObjectArray,
} from "./xfa_object.js";
/*81---------------------------------------------------------------------------*/

const XDP_NS_ID = NamespaceIds.xdp.id;

export class Xdp extends XFAObject
{
  uuid;
  timeStamp;
  config:unknown;
  connectionSet:ConnectionSet | undefined = undefined;
  override datasets:Datasets | undefined = undefined;
  localeSet:unknown;
  stylesheet = new XFAObjectArray();
  override template:Template | undefined = undefined;

  constructor( attributes:XFAAttrs )
  {
    super( XDP_NS_ID, "xdp", /* hasChildren = */ true );
    this.uuid = attributes.uuid || "";
    this.timeStamp = attributes.timeStamp || "";
  }

  override [$onChildCheck]( child:XFAObject )
  {
    const ns = NamespaceIds[<XFANsName>child[$nodeName]];
    return ns && child[$namespaceId] === ns.id;
  }
}

export type XFANsXdp = typeof XdpNamespace;
type XdpName = Exclude<keyof XFANsXdp, symbol>;
export const XdpNamespace =
{
  [$buildXFAObject]( name:string, attributes:XFAAttrs )
  {
    if (XdpNamespace.hasOwnProperty(name)) {
      return XdpNamespace[<XdpName>name]( attributes );
    }
    return undefined;
  },

  xdp( attrs:XFAAttrs ) { return new Xdp( attrs ); },
}
/*81---------------------------------------------------------------------------*/
