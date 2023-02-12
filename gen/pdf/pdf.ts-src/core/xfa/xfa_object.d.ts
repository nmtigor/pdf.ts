import { type rect_t } from "../../../../lib/alias.js";
import { type AvailableSpace, type XFAAttrs, type XFACleanup, type XFAElData, type XFAExtra, type XFAGlobalData, type XFAHTMLObj, type XFAIds, type XFANsAttrs, type XFAStyleData, type XFAValue } from "./alias.js";
import { Builder } from "./builder.js";
import { type XFANsId } from "./namespaces.js";
import { HTMLResult } from "./utils.js";
export declare const $acceptWhitespace: unique symbol;
export declare const $addHTML: unique symbol;
export declare const $appendChild: unique symbol;
export declare const $childrenToHTML: unique symbol;
export declare const $clean: unique symbol;
export declare const $cleanPage: unique symbol;
export declare const $cleanup: unique symbol;
export declare const $clone: unique symbol;
export declare const $consumed: unique symbol;
export declare const $content: unique symbol;
export declare const $data: unique symbol;
export declare const $dump: unique symbol;
export declare const $extra: unique symbol;
export declare const $finalize: unique symbol;
export declare const $flushHTML: unique symbol;
export declare const $getAttributeIt: unique symbol;
export declare const $getAttributes: unique symbol;
export declare const $getAvailableSpace: unique symbol;
export declare const $getChildrenByClass: unique symbol;
export declare const $getChildrenByName: unique symbol;
export declare const $getChildrenByNameIt: unique symbol;
export declare const $getDataValue: unique symbol;
export declare const $getExtra: unique symbol;
export declare const $getRealChildrenByNameIt: unique symbol;
export declare const $getChildren: unique symbol;
export declare const $getContainedChildren: unique symbol;
export declare const $getNextPage: unique symbol;
export declare const $getSubformParent: unique symbol;
export declare const $getParent: unique symbol;
export declare const $getTemplateRoot: unique symbol;
export declare const $globalData: unique symbol;
export declare const $hasSettableValue: unique symbol;
export declare const $ids: unique symbol;
export declare const $indexOf: unique symbol;
export declare const $insertAt: unique symbol;
export declare const $isCDATAXml: unique symbol;
export declare const $isBindable: unique symbol;
export declare const $isDataValue: unique symbol;
export declare const $isDescendent: unique symbol;
export declare const $isNsAgnostic: unique symbol;
export declare const $isSplittable: unique symbol;
export declare const $isThereMoreWidth: unique symbol;
export declare const $isTransparent: unique symbol;
export declare const $isUsable: unique symbol;
export declare const $lastAttribute: unique symbol;
export declare const $namespaceId: unique symbol;
export declare const $nodeName: unique symbol;
export declare const $nsAttributes: unique symbol;
export declare const $onChild: unique symbol;
export declare const $onChildCheck: unique symbol;
export declare const $onText: unique symbol;
export declare const $pushGlyphs: unique symbol;
export declare const $popPara: unique symbol;
export declare const $pushPara: unique symbol;
export declare const $removeChild: unique symbol;
export declare const $root: unique symbol;
export declare const $resolvePrototypes: unique symbol;
export declare const $searchNode: unique symbol;
export declare const $setId: unique symbol;
export declare const $setSetAttributes: unique symbol;
export declare const $setValue: unique symbol;
export declare const $tabIndex: unique symbol;
export declare const $text: unique symbol;
export declare const $toPages: unique symbol;
export declare const $toHTML: unique symbol;
export declare const $toString: unique symbol;
export declare const $toStyle: unique symbol;
export declare const $uid: unique symbol;
declare const _applyPrototype: unique symbol;
declare const _attributes: unique symbol;
declare const _attributeNames: unique symbol;
declare const _children: unique symbol;
declare const _cloneAttribute: unique symbol;
declare const _dataValue: unique symbol;
declare const _defaultValue: unique symbol;
declare const _filteredChildrenGenerator: unique symbol;
declare const _getPrototype: unique symbol;
declare const _getUnsetAttributes: unique symbol;
declare const _hasChildren: unique symbol;
declare const _max: unique symbol;
declare const _options: unique symbol;
declare const _parent: unique symbol;
declare const _resolvePrototypesHelper: unique symbol;
declare const _setAttributes: unique symbol;
declare const _validator: unique symbol;
type NonattrValue = null | undefined | XFAObject | XFAObjectArray;
type XFAProp = NonattrValue | string;
export type Dumped = {
    $content?: string | number | Date | XFAObject | Map<string, string> | string[] | [number, number][] | [number, number];
    $name?: string;
    attributes?: XFAAttrs;
} & {
    [key: string]: string | Dumped | Dumped[] | number | Date | XFAObject | Record<string, string>;
};
type PropValueEx = XFAProp | XFAObject[] | XFAAttribute;
export declare abstract class XFAObject {
    [$namespaceId]: XFANsId;
    [$nodeName]: string;
    [_hasChildren]: boolean;
    [_parent]?: XFAObject;
    /** @final */
    [$getParent](): XFAObject | undefined;
    [_children]: XFAObject[];
    /** @final */
    [$uid]: string;
    /** @final */
    [$globalData]?: XFAGlobalData | undefined;
    id: string;
    name?: string;
    h: number | "";
    w: number | "";
    use: string;
    usehref: string;
    /** @final */
    [$cleanup]?: XFACleanup;
    [$clean](builder: Builder): void;
    [$content]?: string | number | Date | XFAObject | Map<string, string> | string[] | [number, number][] | [number, number] | undefined;
    [$onText](_: string, richText?: boolean): void;
    [$setValue](_: XFAValue): void;
    /** @final */
    [$extra]: XFAExtra | XFAObject | undefined;
    [_setAttributes]?: Set<string>;
    /** @final */
    [$setSetAttributes](attributes: Record<string, string>): void;
    _attributes?: Set<string>;
    get [_attributeNames](): Set<string>;
    /**
     * Get attribute names which have been set in the proto but not in this.
     */
    [_getUnsetAttributes](protoAttributes: Set<string>): string[];
    /** @final */
    [$tabIndex]?: number | undefined;
    assist?: unknown;
    anchorType?: string;
    border?: unknown;
    columnWidths?: number[];
    colSpan?: number;
    datasets?: unknown;
    form?: unknown;
    hAlign?: string;
    /** @final */
    layout?: string | undefined;
    margin?: unknown;
    operation?: string;
    para?: unknown;
    presence?: string | undefined;
    ref?: string | XFAObjectArray;
    rotate?: number;
    template?: unknown;
    traversal?: unknown;
    x?: number;
    y?: number;
    constructor(nsId: XFANsId, name: string, hasChildren?: boolean);
    [$onChild](child: XFAObject): boolean;
    [$onChildCheck](child: XFAObject): boolean;
    [$isNsAgnostic](): boolean;
    [$acceptWhitespace](): boolean;
    [$isCDATAXml](): boolean;
    [$isBindable](): boolean;
    /** @final */
    [$popPara](): void;
    /** @final */
    [$pushPara](): void;
    /** @final */
    [$setId](ids: Map<string, XFAObject>): void;
    /** @final */
    [$getTemplateRoot](): import("./template.js").Template | undefined;
    [$isSplittable](): boolean;
    /**
       Return true if this node (typically a container)
       can provide more width during layout.
       The goal is to help to know what a descendant must
       do in case of horizontal overflow.
     */
    [$isThereMoreWidth](): boolean;
    /** @final */
    [$appendChild](child: XFAObject): void;
    /** @final */
    [$removeChild](child: XFAObject): void;
    [$hasSettableValue](): boolean;
    [$finalize](): void;
    /** @final */
    [$indexOf](child: XFAObject): number;
    /** @final */
    [$insertAt](i: number, child: XFAObject): void;
    /**
     * If true the element is transparent when searching a node using
     * a SOM expression which means that looking for "foo.bar" in
     * <... name="foo"><toto><titi><... name="bar"></titi></toto>...
     * is fine because toto and titi are transparent.
     */
    [$isTransparent](): boolean;
    [$lastAttribute](): string;
    [$text](): string | undefined;
    /** @final */
    [$isDescendent](parent: XFAObject): boolean;
    [$getSubformParent](): XFAObject | undefined;
    [$dump](): Dumped;
    [$toStyle](_?: XFAObject): XFAStyleData | string | undefined;
    [$toHTML](availableSpace?: AvailableSpace): HTMLResult | string | undefined;
    [$getContainedChildren](): Generator<XFAObject>;
    [_filteredChildrenGenerator](filter: Set<string> | undefined, include: boolean): Generator<HTMLResult>;
    [$flushHTML](): XFAHTMLObj | undefined;
    [$addHTML](html: XFAElData, bbox?: rect_t): void;
    [$getAvailableSpace](): AvailableSpace | undefined;
    /** @final */
    [$childrenToHTML]({ filter, include }: {
        filter?: Set<string>;
        include?: boolean;
    }): HTMLResult;
    /**
     * Update the node with properties coming from a prototype and apply
     * this function recursively to all children.
     * @final
     */
    [$resolvePrototypes](ids: XFAIds, ancestors?: Set<XFAObject>): void;
    [_resolvePrototypesHelper](ids: XFAIds, ancestors: Set<XFAObject>): void;
    /** @final */
    [_getPrototype](ids: XFAIds, ancestors: Set<XFAObject>): XFAObject | undefined;
    [_applyPrototype](proto: XFAObject, ids: XFAIds, ancestors: Set<XFAObject>): void;
    static [_cloneAttribute](obj: unknown): unknown;
    /** @final */
    [$clone]<T extends XFAObject>(this: T): T;
    [$getChildren](name?: string): XFAObject[];
    [$getChildrenByClass](name: string): PropValueEx;
    /** @final */
    [$getChildrenByName](name: string, allTransparent: boolean, first?: boolean): (XFAObject | XFAAttribute)[];
    [$getChildrenByNameIt](name: string, allTransparent: boolean, first?: boolean): Generator<XFAObject | XFAAttribute>;
}
/** @final */
export declare class XFAObjectArray {
    readonly [_max]: number;
    [_children]: XFAObject[];
    get children(): XFAObject[];
    isEmpty(): boolean;
    clear(): void;
    constructor(max?: number);
    push(child: XFAObject): boolean;
    dump(): Dumped | Dumped[];
    [$clone](): XFAObjectArray;
}
/** @final */
export declare class XFAAttribute {
    [_parent]: XFAObject;
    [$getParent](): XFAObject;
    [$nodeName]: string;
    [$content]: string;
    [$text](): string;
    [$consumed]: boolean;
    [$uid]: string;
    constructor(node: XFAObject, name: string, value: string);
    [$isDataValue](): boolean;
    [$getDataValue](): string;
    [$setValue](value: XFAValue): void;
    [$isDescendent](parent: XFAObject): boolean;
}
export declare class XmlObject extends XFAObject {
    [_children]: XmlObject[];
    [$content]?: string | XmlObject | undefined;
    [$onText](str: string): void;
    [$setValue](value: XFAValue): void;
    [_dataValue]?: boolean;
    /** @final */
    [$isDataValue](): boolean | undefined;
    /** @final */
    [$consumed]: boolean;
    [_attributes]?: Map<string, XFAAttribute>;
    constructor(nsId: XFANsId, name: string, attributes?: XFANsAttrs);
    /** @final */
    [$toString](buf: string[]): void;
    [$onChild](child: XFAObject): boolean;
    [$finalize](): void;
    [$toHTML](): HTMLResult;
    [$getChildren](name?: string): XmlObject[];
    /** @final */
    [$getAttributes](): Map<string, XFAAttribute> | undefined;
    /** @final */
    [$getChildrenByClass](name: string): XFAObject[] | XFAAttribute;
    [$getChildrenByNameIt](name: string, allTransparent: boolean): Generator<XmlObject | XFAAttribute>;
    [$getAttributeIt](name: string, skipConsumed: boolean): Generator<XFAAttribute>;
    [$getRealChildrenByNameIt](name: string, allTransparent: boolean, skipConsumed: boolean): Generator<XmlObject>;
    /** @final */
    [$getDataValue](): string | undefined;
    [$dump](hasNS?: boolean): Dumped;
}
export declare abstract class ContentObject extends XFAObject {
    [$content]: string | number | Date | XFAObject | Map<string, string> | string[] | [number, number][] | [number, number] | undefined;
    [$onText](text: string): void;
    constructor(nsId: XFANsId, name: string);
    [$finalize](): void;
}
export declare abstract class OptionObject extends ContentObject {
    [_options]: string[];
    constructor(nsId: XFANsId, name: string, options: string[]);
    /** @final */
    [$finalize](): void;
    /** @final */
    [$clean](builder: Builder): void;
}
export declare abstract class StringObject extends ContentObject {
    [$content]: string | Date | string[] | [number, number][] | undefined;
    /** @final */
    [$finalize](): void;
}
export declare abstract class IntegerObject extends ContentObject {
    [$content]: string | number;
    [_defaultValue]: number;
    [_validator]: (n: number) => boolean;
    constructor(nsId: XFANsId, name: string, defaultValue: number, validator: (n: number) => boolean);
    /** @final */
    [$finalize](): void;
    /** @final */
    [$clean](builder: Builder): void;
}
export declare abstract class Option01 extends IntegerObject {
    constructor(nsId: XFANsId, name: string);
}
export declare class Option10 extends IntegerObject {
    constructor(nsId: XFANsId, name: string);
}
export {};
//# sourceMappingURL=xfa_object.d.ts.map