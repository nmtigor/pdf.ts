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

import type { AnnotStorageRecord } from "../../display/annotation_layer.ts";
import { Datasets } from "./datasets.ts";
import {
  $getAttributes,
  $getChildren,
  $nodeName,
  $setValue,
  $toString,
  $uid,
} from "./symbol_utils.ts";
import type { XFAObject, XmlObject } from "./xfa_object.ts";
/*80--------------------------------------------------------------------------*/

export class DataHandler {
  data;
  dataset;

  constructor(root: XFAObject, data: XmlObject) {
    this.data = data;
    this.dataset = <Datasets | undefined> root.datasets || undefined;
  }

  serialize(storage: AnnotStorageRecord | undefined) {
    const stack: ([number, XFAObject[]])[] = [[-1, this.data[$getChildren]()]];

    while (stack.length > 0) {
      const last = stack.at(-1)!;
      const [i, children] = last;
      if (i + 1 === children.length) {
        stack.pop();
        continue;
      }

      const child = children[++last[0]] as XmlObject;
      const storageEntry = storage!.get(child[$uid]);
      if (storageEntry) {
        child[$setValue](storageEntry as any); //kkkk
      } else {
        const attributes = child[$getAttributes]();
        for (const value of attributes!.values()) {
          const entry = storage!.get(value[$uid]);
          if (entry) {
            value[$setValue](entry as any); //kkkk
            break;
          }
        }
      }

      const nodes = child[$getChildren]();
      if (nodes.length > 0) {
        stack.push([-1, nodes]);
      }
    }

    const buf = [
      `<xfa:datasets xmlns:xfa="http://www.xfa.org/schema/xfa-data/1.0/">`,
    ];
    if (this.dataset) {
      // Dump nodes other than data: they can contains for example
      // some data for choice lists.
      for (const child of this.dataset[$getChildren]()) {
        if (child[$nodeName] !== "data") {
          (child as XmlObject)[$toString](buf);
        }
      }
    }
    this.data[$toString](buf);
    buf.push("</xfa:datasets>");

    return buf.join("");
  }
}
/*80--------------------------------------------------------------------------*/
