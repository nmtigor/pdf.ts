/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/xfa/builder.ts
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

import { warn } from "../../shared/util.ts";
import type {
  XFAAttrs,
  XFACleanup,
  XFAIds,
  XFANsAttrs,
  XFAPrefix,
} from "./alias.ts";
import { $buildXFAObject, NamespaceIds, type XFANsName } from "./namespaces.ts";
import { NamespaceSetUp, type XFAKnownNs } from "./setup.ts";
import {
  $cleanup,
  $finalize,
  $ids,
  $isNsAgnostic,
  $nsAttributes,
  $onChild,
  $resolvePrototypes,
  $root,
} from "./symbol_utils.ts";
import { Template } from "./template.ts";
import { UnknownNamespace } from "./unknown.ts";
import { XFAObject } from "./xfa_object.ts";
/*80--------------------------------------------------------------------------*/

export class Root extends XFAObject {
  element?: XFAObject;
  [$ids]: XFAIds;

  constructor(ids: XFAIds) {
    super(-1, "root", Object.create(null));
    this[$ids] = ids;
  }

  override [$onChild](child: XFAObject) {
    this.element = child;
    return true;
  }

  override [$finalize]() {
    super[$finalize]();

    if (this.element?.template instanceof Template) {
      // Set the root element in $ids using a symbol in order
      // to avoid conflict with real IDs.
      this[$ids].set($root, this.element);

      this.element.template[$resolvePrototypes](this[$ids]);
      this.element.template[$ids] = this[$ids];
    }
  }
}

class Empty extends XFAObject {
  constructor() {
    super(-1, "", Object.create(null));
  }

  override [$onChild](_: XFAObject) {
    return false;
  }
}

interface _BuildP {
  nsPrefix: string | undefined;
  name: string;
  attributes: XFANsAttrs;
  namespace: string | undefined;
  prefixes: XFAPrefix[] | undefined;
}

type XFANs = XFAKnownNs | UnknownNamespace;

export class Builder {
  _namespaceStack: XFANs[] = [];
  _nsAgnosticLevel = 0;

  // Each prefix has its own stack
  _namespacePrefixes = new Map<string, XFANs[]>();
  _namespaces = new Map<string, XFANs>();
  _nextNsId = Math.max(
    ...Object.values(NamespaceIds).map(({ id }) => id),
  );
  _currentNamespace;

  constructor(rootNameSpace?: XFANs) {
    this._currentNamespace = rootNameSpace ||
      new UnknownNamespace(++this._nextNsId);
  }

  buildRoot(ids: XFAIds) {
    return new Root(ids);
  }

  build({ nsPrefix, name, attributes, namespace, prefixes }: _BuildP) {
    const hasNamespaceDef = namespace !== undefined;
    if (hasNamespaceDef) {
      // Define the current namespace to use.
      this._namespaceStack.push(this._currentNamespace!);
      this._currentNamespace = this._searchNamespace(namespace);
    }

    if (prefixes) {
      // The xml node may have namespace prefix definitions
      this._addNamespacePrefix(prefixes);
    }

    if (Object.hasOwn(attributes, $nsAttributes)) {
      // Only support xfa-data namespace.
      const dataTemplate = NamespaceSetUp.datasets;
      const nsAttrs = attributes[$nsAttributes]!;
      let xfaAttrs: { xfa: XFAAttrs } | undefined;
      for (const [ns, attrs] of Object.entries(nsAttrs)) {
        const nsToUse = this._getNamespaceToUse(ns);
        if (nsToUse === dataTemplate) {
          xfaAttrs = { xfa: attrs };
          break;
        }
      }
      if (xfaAttrs) {
        attributes[$nsAttributes] = xfaAttrs;
      } else {
        delete attributes[$nsAttributes];
      }
    }

    const namespaceToUse = this._getNamespaceToUse(nsPrefix);
    const node: XFAObject =
      namespaceToUse?.[$buildXFAObject](name, attributes) || new Empty();

    if (node[$isNsAgnostic]()) {
      this._nsAgnosticLevel++;
    }

    // In case the node has some namespace things,
    // we must pop the different stacks.
    if (hasNamespaceDef || prefixes || node[$isNsAgnostic]()) {
      node[$cleanup] = {
        hasNamespace: hasNamespaceDef,
        prefixes,
        nsAgnostic: node[$isNsAgnostic](),
      };
    }

    return node;
  }

  isNsAgnostic() {
    return this._nsAgnosticLevel > 0;
  }

  _searchNamespace(nsName: string) {
    let ns = this._namespaces.get(nsName);
    if (ns) return ns;

    for (const [name, { check }] of Object.entries(NamespaceIds)) {
      if (check(nsName)) {
        ns = NamespaceSetUp[<XFANsName> name];
        if (ns) {
          this._namespaces.set(nsName, ns);
          return ns;
        }
        // The namespace is known but not handled.
        break;
      }
    }

    ns = new UnknownNamespace(++this._nextNsId);
    this._namespaces.set(nsName, ns);
    return ns;
  }

  _addNamespacePrefix(prefixes: XFAPrefix[]) {
    for (const { prefix, value } of prefixes) {
      const namespace = this._searchNamespace(value);
      let prefixStack = this._namespacePrefixes.get(prefix);
      if (!prefixStack) {
        prefixStack = [];
        this._namespacePrefixes.set(prefix, prefixStack);
      }
      prefixStack.push(namespace);
    }
  }

  _getNamespaceToUse(prefix?: string) {
    if (!prefix) return this._currentNamespace;

    const prefixStack = this._namespacePrefixes.get(prefix);
    if (prefixStack && prefixStack.length > 0) {
      return prefixStack.at(-1);
    }

    warn(`Unknown namespace prefix: ${prefix}.`);
    return undefined;
  }

  clean(data: XFACleanup) {
    const { hasNamespace, prefixes, nsAgnostic } = data;
    if (hasNamespace) {
      this._currentNamespace = this._namespaceStack.pop()!;
    }
    if (prefixes) {
      prefixes.forEach(({ prefix }) => {
        this._namespacePrefixes.get(prefix)!.pop();
      });
    }
    if (nsAgnostic) {
      this._nsAgnosticLevel--;
    }
  }
}
/*80--------------------------------------------------------------------------*/
