/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/xfa/builder.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { XFACleanup, XFAIds, XFANsAttrs, XFAPrefix } from "./alias.js";
import { type XFAKnownNs } from "./setup.js";
import { $finalize, $ids, $onChild } from "./symbol_utils.js";
import { UnknownNamespace } from "./unknown.js";
import { XFAObject } from "./xfa_object.js";
export declare class Root extends XFAObject {
    element?: XFAObject;
    [$ids]: XFAIds;
    constructor(ids: XFAIds);
    [$onChild](child: XFAObject): boolean;
    [$finalize](): void;
}
interface _BuildP {
    nsPrefix: string | undefined;
    name: string;
    attributes: XFANsAttrs;
    namespace: string | undefined;
    prefixes: XFAPrefix[] | undefined;
}
type XFANs = XFAKnownNs | UnknownNamespace;
export declare class Builder {
    _namespaceStack: XFANs[];
    _nsAgnosticLevel: number;
    _namespacePrefixes: Map<string, XFANs[]>;
    _namespaces: Map<string, XFANs>;
    _nextNsId: number;
    _currentNamespace: XFANs;
    constructor(rootNameSpace?: XFANs);
    buildRoot(ids: XFAIds): Root;
    build({ nsPrefix, name, attributes, namespace, prefixes }: _BuildP): XFAObject;
    isNsAgnostic(): boolean;
    _searchNamespace(nsName: string): XFANs;
    _addNamespacePrefix(prefixes: XFAPrefix[]): void;
    _getNamespaceToUse(prefix?: string): XFANs | undefined;
    clean(data: XFACleanup): void;
}
export {};
//# sourceMappingURL=builder.d.ts.map