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

import { type XFAElObj } from "../core/xfa/alias.ts";
import {
  type TextContent,
  type TextItem,
  type TextMarkedContent,
} from "./api.ts";
/*80--------------------------------------------------------------------------*/

export abstract class XfaText {
  /**
   * Walk an XFA tree and create an array of text nodes that is compatible
   * with a regular PDFs TextContent. Currently, only TextItem.str is supported,
   * all other fields and styles haven't been implemented.
   *
   * @param xfa An XFA fake DOM object.
   */
  static textContent(xfa?: XFAElObj): TextContent {
    const items: (TextItem | TextMarkedContent)[] = [];
    const output = {
      items,
      styles: Object.create(null),
    };
    function walk(node?: XFAElObj) {
      if (!node) return;

      let str: string | undefined;
      const name = node.name;
      if (name === "#text") {
        str = node.value;
      } else if (!XfaText.shouldBuildText(name)) {
        return;
      } else if (node?.attributes?.textContent) {
        str = node.attributes.textContent;
      } else if (node.value) {
        str = node.value;
      }
      if (str !== undefined) {
        items.push({ str } as TextItem);
      }
      if (!node.children) return;

      for (const child of node.children) {
        walk(child as XFAElObj);
      }
    }
    walk(xfa);
    return output;
  }

  /**
   * @param name DOM node name. (lower case)
   *
   * @return true if the DOM node should have a corresponding text node.
   */
  static shouldBuildText(name: string) {
    return !(
      name === "textarea" ||
      name === "input" ||
      name === "option" ||
      name === "select"
    );
  }
}
/*80--------------------------------------------------------------------------*/
