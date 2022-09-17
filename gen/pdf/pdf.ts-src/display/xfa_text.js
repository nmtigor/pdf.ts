/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
/*80--------------------------------------------------------------------------*/
export class XfaText {
    /**
     * Walk an XFA tree and create an array of text nodes that is compatible
     * with a regular PDFs TextContent. Currently, only TextItem.str is supported,
     * all other fields and styles haven't been implemented.
     *
     * @param xfa An XFA fake DOM object.
     */
    static textContent(xfa) {
        const items = [];
        const output = {
            items,
            styles: Object.create(null),
        };
        function walk(node) {
            if (!node)
                return;
            let str;
            const name = node.name;
            if (name === "#text") {
                str = node.value;
            }
            else if (!XfaText.shouldBuildText(name)) {
                return;
            }
            else if (node?.attributes?.textContent) {
                str = node.attributes.textContent;
            }
            else if (node.value) {
                str = node.value;
            }
            if (str !== undefined) {
                items.push({
                    str,
                });
            }
            if (!node.children)
                return;
            for (const child of node.children) {
                walk(child);
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
    static shouldBuildText(name) {
        return !(name === "textarea" ||
            name === "input" ||
            name === "option" ||
            name === "select");
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=xfa_text.js.map