import { XFAObject } from "./xfa_object.js";
import { XMLAttr, XMLParserBase, XMLParserErrorCode } from "../xml_parser.js";
import { Builder } from "./builder.js";
import { XFANsAttrs, XFAPrefix } from "./alias.js";
import { XFANsXhtml } from "./xhtml.js";
export declare class XFAParser extends XMLParserBase {
    _builder: Builder;
    _stack: XFAObject[];
    _globalData: {
        usedTypefaces: Set<string>;
    };
    _ids: Map<string, XFAObject>;
    _current: XFAObject;
    _errorCode: XMLParserErrorCode;
    _whiteRegex: RegExp;
    _nbsps: RegExp;
    _richText: boolean;
    constructor(rootNameSpace?: XFANsXhtml, richText?: boolean);
    parse(data: string): XFAObject | undefined;
    onText(text: string): void;
    onCdata(text: string): void;
    _mkAttributes(attributes: XMLAttr[], tagName: string): readonly [string | undefined, XFAPrefix[] | undefined, XFANsAttrs];
    _getNameAndPrefix(name: string, nsAgnostic: boolean): readonly [string, string] | readonly [string, undefined];
    onBeginElement(tagName: string, attributes: XMLAttr[], isEmpty: boolean): void;
    onEndElement(name: string): void;
    onError(code: XMLParserErrorCode): void;
}
//# sourceMappingURL=parser.d.ts.map