import { XFAPath } from "../core/core_utils.js";
export declare const enum XMLParserErrorCode {
    NoError = 0,
    EndOfDocument = -1,
    UnterminatedCdat = -2,
    UnterminatedXmlDeclaration = -3,
    UnterminatedDoctypeDeclaration = -4,
    UnterminatedComment = -5,
    MalformedElement = -6,
    OutOfMemory = -7,
    UnterminatedAttributeValue = -8,
    UnterminatedElement = -9,
    ElementNeverBegun = -10
}
export interface XMLAttr {
    name: string;
    value: string;
}
export declare abstract class XMLParserBase {
    #private;
    parseXml(s: string): void;
    onResolveEntity(name: string): string;
    /** @final */
    onPi(name: string, value: string): void;
    /** @final */
    onComment(text: string): void;
    abstract onCdata(text: string): void;
    /** @final */
    onDoctype(doctypeContent: string): void;
    abstract onText(text: string): void;
    abstract onBeginElement(name: string, attributes: XMLAttr[], isEmpty: boolean): void;
    abstract onEndElement(name: string): void;
    abstract onError(code: XMLParserErrorCode): void;
}
export declare class SimpleDOMNode {
    nodeName: string;
    nodeValue?: string | undefined;
    parentNode: SimpleDOMNode | null;
    childNodes?: SimpleDOMNode[];
    get firstChild(): SimpleDOMNode | undefined;
    hasChildNodes(): boolean | undefined;
    attributes?: XMLAttr[];
    constructor(nodeName: string, nodeValue?: string | undefined);
    get nextSibling(): SimpleDOMNode | undefined;
    get textContent(): string;
    /**
     * Search a node in the tree with the given path
     * foo.bar[nnn], i.e. find the nnn-th node named
     * bar under a node named foo.
     *
     * @param paths an array of objects as returned by {parseXFAPath}.
     * @param pos the current position in the paths array.
     * @return The node corresponding to the path or null if not found.
     */
    searchNode(paths: XFAPath, pos: number): SimpleDOMNode | null;
    dump(buffer: string[]): void;
}
export declare class SimpleXMLParser extends XMLParserBase {
    _currentFragment: SimpleDOMNode[] | null;
    _stack: SimpleDOMNode[][] | null;
    _errorCode: XMLParserErrorCode;
    _hasAttributes: boolean;
    _lowerCaseName: boolean;
    constructor({ hasAttributes, lowerCaseName }: {
        hasAttributes?: boolean | undefined;
        lowerCaseName?: boolean | undefined;
    });
    parseFromString(data: string): {
        documentElement: SimpleDOMNode;
    } | undefined;
    /** @implements */
    onText(text: string): void;
    /** @implements */
    onCdata(text: string): void;
    /** @implements */
    onBeginElement(name: string, attributes: XMLAttr[], isEmpty: boolean): void;
    onEndElement(name: string): void;
    /** @implements */
    onError(code: XMLParserErrorCode): void;
}
//# sourceMappingURL=xml_parser.d.ts.map