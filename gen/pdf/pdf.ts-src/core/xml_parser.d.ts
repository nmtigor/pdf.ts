import type { XFAPath } from "../core/core_utils.js";
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
    _errorCode: XMLParserErrorCode;
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
    abstract onEndElement(name: string): undefined | SimpleDOMNode;
    abstract onError(code: XMLParserErrorCode): void;
}
export declare class SimpleDOMNode {
    nodeName: string;
    nodeValue: string | undefined;
    parentNode: SimpleDOMNode | undefined;
    childNodes?: SimpleDOMNode[];
    get firstChild(): SimpleDOMNode | undefined;
    get children(): SimpleDOMNode[];
    hasChildNodes(): boolean;
    attributes?: XMLAttr[];
    constructor(nodeName: string, nodeValue?: string);
    get nextSibling(): SimpleDOMNode | undefined;
    get textContent(): string;
    /**
     * Search a node in the tree with the given path
     * foo.bar[nnn], i.e. find the nnn-th node named
     * bar under a node named foo.
     *
     * @param paths an array of objects as returned by {parseXFAPath}.
     * @param pos the current position in the paths array.
     * @return The node corresponding to the path or undefined if not found.
     */
    searchNode(paths: XFAPath, pos: number): SimpleDOMNode | undefined;
    dump(buffer: string[]): void;
}
export interface SimpleXMLParserCtorP {
    hasAttributes?: boolean;
    lowerCaseName?: boolean;
}
export declare class SimpleXMLParser extends XMLParserBase {
    #private;
    constructor({ hasAttributes, lowerCaseName }: SimpleXMLParserCtorP);
    parseFromString(data: string): {
        documentElement: SimpleDOMNode;
    } | undefined;
    /** @implement */
    onText(text: string): void;
    /** @implement */
    onCdata(text: string): void;
    /** @implement */
    onBeginElement(name: string, attributes: XMLAttr[], isEmpty: boolean): void;
    /** @implement */
    onEndElement(name: string): SimpleDOMNode | undefined;
    /** @implement */
    onError(code: XMLParserErrorCode): void;
}
//# sourceMappingURL=xml_parser.d.ts.map