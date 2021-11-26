import { type XFAElObj } from "../core/xfa/alias.js";
import { type TextContent } from "./api.js";
export declare abstract class XfaText {
    /**
     * Walk an XFA tree and create an array of text nodes that is compatible
     * with a regular PDFs TextContent. Currently, only TextItem.str is supported,
     * all other fields and styles haven't been implemented.
     *
     * @param xfa An XFA fake DOM object.
     */
    static textContent(xfa?: XFAElObj): TextContent;
    /**
     * @param name DOM node name. (lower case)
     *
     * @return true if the DOM node should have a corresponding text node.
     */
    static shouldBuildText(name: string): boolean;
}
//# sourceMappingURL=xfa_text.d.ts.map