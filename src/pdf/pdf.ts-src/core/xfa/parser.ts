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

import { warn } from "../../shared/util.ts";
import {
  type XMLAttr,
  XMLParserBase,
  XMLParserErrorCode,
} from "../xml_parser.ts";
import type { XFANsAttrs, XFAPrefix } from "./alias.ts";
import { Builder, Root } from "./builder.ts";
import {
  $acceptWhitespace,
  $clean,
  $content,
  $finalize,
  $globalData,
  $isCDATAXml,
  $nsAttributes,
  $onChild,
  $onText,
  $setId,
  XFAObject,
} from "./xfa_object.ts";
import type { XFANsXhtml } from "./xhtml.ts";
/*80--------------------------------------------------------------------------*/

export class XFAParser extends XMLParserBase {
  readonly #builder;
  readonly #stack: XFAObject[] = [];
  _globalData = {
    usedTypefaces: new Set<string>(),
  };
  readonly #ids = new Map<string, XFAObject>();
  #current: XFAObject;
  readonly #whiteRegex = /^\s+$/;
  readonly #nbsps = /\xa0+/g;
  readonly #richText;

  constructor(rootNameSpace?: XFANsXhtml, richText = false) {
    super();
    this.#builder = new Builder(rootNameSpace);
    this.#current = this.#builder.buildRoot(this.#ids);
    this.#richText = richText;
  }

  parse(data: string) {
    this.parseXml(data);

    if (this._errorCode !== XMLParserErrorCode.NoError) {
      return undefined;
    }

    this.#current[$finalize]();

    return (<Root> this.#current).element;
  }

  onText(text: string) {
    // Normally by definition a &nbsp is unbreakable
    // but in real life Acrobat can break strings on &nbsp.
    text = text.replace(this.#nbsps, (match) => match.slice(1) + " ");
    if (this.#richText || this.#current[$acceptWhitespace]()) {
      this.#current[$onText](text, this.#richText);
      return;
    }

    if (this.#whiteRegex.test(text)) {
      return;
    }
    this.#current[$onText](text.trim());
  }

  onCdata(text: string) {
    this.#current[$onText](text);
  }

  _mkAttributes(attributes: XMLAttr[], tagName: string) {
    // Transform attributes into an object and get out
    // namespaces information.
    let namespace: string | undefined;
    let prefixes: XFAPrefix[] | undefined;
    const attributeObj: XFANsAttrs = Object.create({});
    for (const { name, value } of attributes) {
      if (name === "xmlns") {
        if (!namespace) {
          namespace = value;
        } else {
          warn(`XFA - multiple namespace definition in <${tagName}>`);
        }
      } else if (name.startsWith("xmlns:")) {
        const prefix = name.substring("xmlns:".length);
        if (!prefixes) {
          prefixes = [];
        }
        prefixes.push({ prefix, value });
      } else {
        const i = name.indexOf(":");
        if (i === -1) {
          attributeObj[name] = value;
        } else {
          // Attributes can have their own namespace.
          // For example in data, we can have <foo xfa:dataNode="dataGroup"/>
          let nsAttrs = attributeObj[$nsAttributes];
          if (!nsAttrs) {
            nsAttrs = attributeObj[$nsAttributes] = Object.create(null);
          }
          const [ns, attrName] = [name.slice(0, i), name.slice(i + 1)];
          const attrs = (nsAttrs![ns] ||= Object.create(null));
          attrs[attrName] = value;
        }
      }
    }

    return [namespace, prefixes, attributeObj] as const;
  }

  _getNameAndPrefix(name: string, nsAgnostic: boolean) {
    const i = name.indexOf(":");
    if (i === -1) {
      return [name, undefined] as const;
    }
    return [
      name.substring(i + 1),
      nsAgnostic ? "" : name.substring(0, i),
    ] as const;
  }

  onBeginElement(tagName: string, attributes: XMLAttr[], isEmpty: boolean) {
    const [namespace, prefixes, attributesObj] = this._mkAttributes(
      attributes,
      tagName,
    );
    const [name, nsPrefix] = this._getNameAndPrefix(
      tagName,
      this.#builder.isNsAgnostic(),
    );
    const node = this.#builder.build({
      nsPrefix,
      name,
      attributes: attributesObj,
      namespace,
      prefixes,
    });
    node[$globalData] = this._globalData;

    if (isEmpty) {
      // No children: just push the node into its parent.
      node[$finalize]();
      if (this.#current[$onChild](node)) {
        node[$setId](this.#ids);
      }
      node[$clean](this.#builder);
      return;
    }

    this.#stack.push(this.#current);
    this.#current = node;
  }

  override onEndElement(name: string) {
    const node = this.#current;
    if (node[$isCDATAXml]() && typeof node[$content] === "string") {
      const parser = new XFAParser();
      parser._globalData = this._globalData;
      const root = parser.parse(<string> node[$content]);
      node[$content] = undefined;
      node[$onChild](root!);
    }

    node[$finalize]();
    this.#current = this.#stack.pop()!;
    if (this.#current[$onChild](node)) {
      node[$setId](this.#ids);
    }
    node[$clean](this.#builder);
    return undefined;
  }

  /** @implement */
  onError(code: XMLParserErrorCode) {
    this._errorCode = code;
  }
}
/*80--------------------------------------------------------------------------*/
