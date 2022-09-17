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

/*80--------------------------------------------------------------------------*/

export const $buildXFAObject = Symbol();

type NsIds = typeof NamespaceIds;
export type XFANsName = keyof NsIds;
export type XFANsId = NsIds[XFANsName]["id"] | -1;

export const NamespaceIds = {
  config: {
    id: 0,
    check: (ns: string) => ns.startsWith("http://www.xfa.org/schema/xci/"),
  },
  connectionSet: {
    id: 1,
    check: (ns: string) =>
      ns.startsWith("http://www.xfa.org/schema/xfa-connection-set/"),
  },
  datasets: {
    id: 2,
    check: (ns: string) => ns.startsWith("http://www.xfa.org/schema/xfa-data/"),
  },
  form: {
    id: 3,
    check: (ns: string) => ns.startsWith("http://www.xfa.org/schema/xfa-form/"),
  },
  localeSet: {
    id: 4,
    check: (ns: string) =>
      ns.startsWith("http://www.xfa.org/schema/xfa-locale-set/"),
  },
  pdf: {
    id: 5,
    check: (ns: string) => ns === "http://ns.adobe.com/xdp/pdf/",
  },
  signature: {
    id: 6,
    check: (ns: string) => ns === "http://www.w3.org/2000/09/xmldsig#",
  },
  sourceSet: {
    id: 7,
    check: (ns: string) =>
      ns.startsWith("http://www.xfa.org/schema/xfa-source-set/"),
  },
  stylesheet: {
    id: 8,
    check: (ns: string) => ns === "http://www.w3.org/1999/XSL/Transform",
  },
  template: {
    id: 9,
    check: (ns: string) =>
      ns.startsWith("http://www.xfa.org/schema/xfa-template/"),
  },
  xdc: {
    id: 10,
    check: (ns: string) => ns.startsWith("http://www.xfa.org/schema/xdc/"),
  },
  xdp: {
    id: 11,
    check: (ns: string) => ns === "http://ns.adobe.com/xdp/",
  },
  xfdf: {
    id: 12,
    check: (ns: string) => ns === "http://ns.adobe.com/xfdf/",
  },
  xhtml: {
    id: 13,
    check: (ns: string) => ns === "http://www.w3.org/1999/xhtml",
  },
  xmpmeta: {
    id: 14,
    check: (ns: string) => ns === "http://ns.adobe.com/xmpmeta/",
  },
} as const;
/*80--------------------------------------------------------------------------*/
