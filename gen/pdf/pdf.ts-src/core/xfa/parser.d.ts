import { type XMLAttr, XMLParserBase, XMLParserErrorCode } from "../xml_parser.js";
import type { XFANsAttrs, XFAPrefix } from "./alias.js";
import { XFAObject } from "./xfa_object.js";
import type { XFANsXhtml } from "./xhtml.js";
export declare class XFAParser extends XMLParserBase {
    #private;
    _globalData: {
        usedTypefaces: Set<string>;
    };
    constructor(rootNameSpace?: XFANsXhtml, richText?: boolean);
    parse(data: string): XFAObject | undefined;
    onText(text: string): void;
    onCdata(text: string): void;
    _mkAttributes(attributes: XMLAttr[], tagName: string): readonly [string | undefined, XFAPrefix[] | undefined, XFANsAttrs];
    _getNameAndPrefix(name: string, nsAgnostic: boolean): readonly [string, string] | readonly [string, undefined];
    onBeginElement(tagName: string, attributes: XMLAttr[], isEmpty: boolean): void;
    onEndElement(name: string): undefined;
    /** @implement */
    onError(code: XMLParserErrorCode): void;
}
//# sourceMappingURL=parser.d.ts.map