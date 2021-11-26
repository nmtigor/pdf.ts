/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
 */
import { encodeToXmlString } from "./core_utils.js";
/*81---------------------------------------------------------------------------*/
export var XMLParserErrorCode;
(function (XMLParserErrorCode) {
    XMLParserErrorCode[XMLParserErrorCode["NoError"] = 0] = "NoError";
    XMLParserErrorCode[XMLParserErrorCode["EndOfDocument"] = -1] = "EndOfDocument";
    XMLParserErrorCode[XMLParserErrorCode["UnterminatedCdat"] = -2] = "UnterminatedCdat";
    XMLParserErrorCode[XMLParserErrorCode["UnterminatedXmlDeclaration"] = -3] = "UnterminatedXmlDeclaration";
    XMLParserErrorCode[XMLParserErrorCode["UnterminatedDoctypeDeclaration"] = -4] = "UnterminatedDoctypeDeclaration";
    XMLParserErrorCode[XMLParserErrorCode["UnterminatedComment"] = -5] = "UnterminatedComment";
    XMLParserErrorCode[XMLParserErrorCode["MalformedElement"] = -6] = "MalformedElement";
    XMLParserErrorCode[XMLParserErrorCode["OutOfMemory"] = -7] = "OutOfMemory";
    XMLParserErrorCode[XMLParserErrorCode["UnterminatedAttributeValue"] = -8] = "UnterminatedAttributeValue";
    XMLParserErrorCode[XMLParserErrorCode["UnterminatedElement"] = -9] = "UnterminatedElement";
    XMLParserErrorCode[XMLParserErrorCode["ElementNeverBegun"] = -10] = "ElementNeverBegun";
})(XMLParserErrorCode || (XMLParserErrorCode = {}));
function isWhitespace(s, index) {
    const ch = s[index];
    return ch === " " || ch === "\n" || ch === "\r" || ch === "\t";
}
function isWhitespaceString(s) {
    for (let i = 0, ii = s.length; i < ii; i++) {
        if (!isWhitespace(s, i))
            return false;
    }
    return true;
}
export class XMLParserBase {
    #resolveEntities(s) {
        return s.replace(/&([^;]+);/g, (all, entity) => {
            if (entity.substring(0, 2) === "#x") {
                return String.fromCodePoint(parseInt(entity.substring(2), 16));
            }
            else if (entity.substring(0, 1) === "#") {
                return String.fromCodePoint(parseInt(entity.substring(1), 10));
            }
            switch (entity) {
                case "lt":
                    return "<";
                case "gt":
                    return ">";
                case "amp":
                    return "&";
                case "quot":
                    return '"';
                case "apos":
                    return "'";
            }
            return this.onResolveEntity(entity);
        });
    }
    #parseContent(s, start) {
        const attributes = [];
        let pos = start;
        function skipWs() {
            while (pos < s.length && isWhitespace(s, pos)) {
                ++pos;
            }
        }
        while (pos < s.length
            && !isWhitespace(s, pos)
            && s[pos] !== ">"
            && s[pos] !== "/") {
            ++pos;
        }
        const name = s.substring(start, pos);
        skipWs();
        while (pos < s.length
            && s[pos] !== ">"
            && s[pos] !== "/"
            && s[pos] !== "?") {
            skipWs();
            let attrName = "", attrValue = "";
            while (pos < s.length && !isWhitespace(s, pos) && s[pos] !== "=") {
                attrName += s[pos];
                ++pos;
            }
            skipWs();
            if (s[pos] !== "=")
                return null;
            ++pos;
            skipWs();
            const attrEndChar = s[pos];
            if (attrEndChar !== '"' && attrEndChar !== "'")
                return null;
            const attrEndIndex = s.indexOf(attrEndChar, ++pos);
            if (attrEndIndex < 0)
                return null;
            attrValue = s.substring(pos, attrEndIndex);
            attributes.push({
                name: attrName,
                value: this.#resolveEntities(attrValue),
            });
            pos = attrEndIndex + 1;
            skipWs();
        }
        return {
            name,
            attributes,
            parsed: pos - start,
        };
    }
    #parseProcessingInstruction(s, start) {
        let pos = start;
        function skipWs() {
            while (pos < s.length && isWhitespace(s, pos)) {
                ++pos;
            }
        }
        while (pos < s.length
            && !isWhitespace(s, pos)
            && s[pos] !== ">"
            && s[pos] !== "?"
            && s[pos] !== "/") {
            ++pos;
        }
        const name = s.substring(start, pos);
        skipWs();
        const attrStart = pos;
        while (pos < s.length && (s[pos] !== "?" || s[pos + 1] !== ">")) {
            ++pos;
        }
        const value = s.substring(attrStart, pos);
        return {
            name,
            value,
            parsed: pos - start,
        };
    }
    parseXml(s) {
        let i = 0;
        while (i < s.length) {
            const ch = s[i];
            let j = i;
            if (ch === "<") {
                ++j;
                const ch2 = s[j];
                let q;
                switch (ch2) {
                    case "/":
                        ++j;
                        q = s.indexOf(">", j);
                        if (q < 0) {
                            this.onError(XMLParserErrorCode.UnterminatedElement);
                            return;
                        }
                        this.onEndElement(s.substring(j, q));
                        j = q + 1;
                        break;
                    case "?":
                        ++j;
                        const pi = this.#parseProcessingInstruction(s, j);
                        if (s.substring(j + pi.parsed, j + pi.parsed + 2) !== "?>") {
                            this.onError(XMLParserErrorCode.UnterminatedXmlDeclaration);
                            return;
                        }
                        this.onPi(pi.name, pi.value);
                        j += pi.parsed + 2;
                        break;
                    case "!":
                        if (s.substring(j + 1, j + 3) === "--") {
                            q = s.indexOf("-->", j + 3);
                            if (q < 0) {
                                this.onError(XMLParserErrorCode.UnterminatedComment);
                                return;
                            }
                            this.onComment(s.substring(j + 3, q));
                            j = q + 3;
                        }
                        else if (s.substring(j + 1, j + 8) === "[CDATA[") {
                            q = s.indexOf("]]>", j + 8);
                            if (q < 0) {
                                this.onError(XMLParserErrorCode.UnterminatedCdat);
                                return;
                            }
                            this.onCdata(s.substring(j + 8, q));
                            j = q + 3;
                        }
                        else if (s.substring(j + 1, j + 8) === "DOCTYPE") {
                            const q2 = s.indexOf("[", j + 8);
                            let complexDoctype = false;
                            q = s.indexOf(">", j + 8);
                            if (q < 0) {
                                this.onError(XMLParserErrorCode.UnterminatedDoctypeDeclaration);
                                return;
                            }
                            if (q2 > 0 && q > q2) {
                                q = s.indexOf("]>", j + 8);
                                if (q < 0) {
                                    this.onError(XMLParserErrorCode.UnterminatedDoctypeDeclaration);
                                    return;
                                }
                                complexDoctype = true;
                            }
                            const doctypeContent = s.substring(j + 8, q + (complexDoctype ? 1 : 0));
                            this.onDoctype(doctypeContent);
                            j = q + (complexDoctype ? 2 : 1);
                        }
                        else {
                            this.onError(XMLParserErrorCode.MalformedElement);
                            return;
                        }
                        break;
                    default:
                        const content = this.#parseContent(s, j);
                        if (content === null) {
                            this.onError(XMLParserErrorCode.MalformedElement);
                            return;
                        }
                        let isClosed = false;
                        if (s.substring(j + content.parsed, j + content.parsed + 2) === "/>") {
                            isClosed = true;
                        }
                        else if (s.substring(j + content.parsed, j + content.parsed + 1) !== ">") {
                            this.onError(XMLParserErrorCode.UnterminatedElement);
                            return;
                        }
                        this.onBeginElement(content.name, content.attributes, isClosed);
                        j += content.parsed + (isClosed ? 2 : 1);
                        break;
                }
            }
            else {
                while (j < s.length && s[j] !== "<") {
                    j++;
                }
                const text = s.substring(i, j);
                this.onText(this.#resolveEntities(text));
            }
            i = j;
        }
    }
    onResolveEntity(name) {
        return `&${name};`;
    }
    /** @final */
    onPi(name, value) { }
    /** @final */
    onComment(text) { }
    /** @final */
    onDoctype(doctypeContent) { }
}
export class SimpleDOMNode {
    nodeName;
    nodeValue;
    parentNode = null;
    childNodes;
    get firstChild() { return this.childNodes?.[0]; }
    hasChildNodes() { return this.childNodes && this.childNodes.length > 0; }
    attributes;
    constructor(nodeName, nodeValue) {
        this.nodeName = nodeName;
        this.nodeValue = nodeValue;
        Object.defineProperty(this, "parentNode", { value: null, writable: true });
    }
    get nextSibling() {
        const childNodes = this.parentNode.childNodes;
        if (!childNodes)
            return undefined;
        const index = childNodes.indexOf(this);
        if (index === -1)
            return undefined;
        return childNodes[index + 1];
    }
    get textContent() {
        if (!this.childNodes)
            return this.nodeValue || "";
        return this.childNodes
            .map(child => child.textContent)
            .join("");
    }
    /**
     * Search a node in the tree with the given path
     * foo.bar[nnn], i.e. find the nnn-th node named
     * bar under a node named foo.
     *
     * @param paths an array of objects as returned by {parseXFAPath}.
     * @param pos the current position in the paths array.
     * @return The node corresponding to the path or null if not found.
     */
    searchNode(paths, pos) {
        if (pos >= paths.length)
            return this;
        const component = paths[pos];
        const stack = [];
        let node = this;
        while (true) {
            if (component.name === node.nodeName) {
                if (component.pos === 0) {
                    const res = node.searchNode(paths, pos + 1);
                    if (res !== null)
                        return res;
                }
                else if (stack.length === 0) {
                    return null;
                }
                else {
                    const [parent] = stack.pop();
                    let siblingPos = 0;
                    for (const child of parent.childNodes) {
                        if (component.name === child.nodeName) {
                            if (siblingPos === component.pos) {
                                return child.searchNode(paths, pos + 1);
                            }
                            siblingPos++;
                        }
                    }
                    // We didn't find the correct sibling
                    // so just return the first found node
                    return node.searchNode(paths, pos + 1);
                }
            }
            if (node.childNodes && node.childNodes.length !== 0) {
                stack.push([node, 0]);
                node = node.childNodes[0];
            }
            else if (stack.length === 0) {
                return null;
            }
            else {
                while (stack.length !== 0) {
                    const [parent, currentPos] = stack.pop();
                    const newPos = currentPos + 1;
                    if (newPos < parent.childNodes.length) {
                        stack.push([parent, newPos]);
                        node = parent.childNodes[newPos];
                        break;
                    }
                }
                if (stack.length === 0)
                    return null;
            }
        }
    }
    dump(buffer) {
        if (this.nodeName === "#text") {
            buffer.push(encodeToXmlString(this.nodeValue));
            return;
        }
        buffer.push(`<${this.nodeName}`);
        if (this.attributes) {
            for (const attribute of this.attributes) {
                buffer.push(` ${attribute.name}="${encodeToXmlString(attribute.value)}"`);
            }
        }
        if (this.hasChildNodes()) {
            buffer.push(">");
            for (const child of this.childNodes) {
                child.dump(buffer);
            }
            buffer.push(`</${this.nodeName}>`);
        }
        else if (this.nodeValue) {
            buffer.push(`>${encodeToXmlString(this.nodeValue)}</${this.nodeName}>`);
        }
        else {
            buffer.push("/>");
        }
    }
}
export class SimpleXMLParser extends XMLParserBase {
    _currentFragment = null;
    _stack = null;
    _errorCode = XMLParserErrorCode.NoError;
    _hasAttributes;
    _lowerCaseName;
    constructor({ hasAttributes = false, lowerCaseName = false }) {
        super();
        this._hasAttributes = hasAttributes;
        this._lowerCaseName = lowerCaseName;
    }
    parseFromString(data) {
        this._currentFragment = [];
        this._stack = [];
        this._errorCode = XMLParserErrorCode.NoError;
        this.parseXml(data);
        if (this._errorCode !== XMLParserErrorCode.NoError) {
            return undefined; // return undefined on error
        }
        // We should only have one root.
        const [documentElement] = this._currentFragment;
        if (!documentElement) {
            return undefined; // Return undefined if no root was found.
        }
        return { documentElement };
    }
    /** @implements */
    onText(text) {
        if (isWhitespaceString(text)) {
            return;
        }
        const node = new SimpleDOMNode("#text", text);
        this._currentFragment.push(node);
    }
    /** @implements */
    onCdata(text) {
        const node = new SimpleDOMNode("#text", text);
        this._currentFragment.push(node);
    }
    /** @implements */
    onBeginElement(name, attributes, isEmpty) {
        if (this._lowerCaseName) {
            name = name.toLowerCase();
        }
        const node = new SimpleDOMNode(name);
        node.childNodes = [];
        if (this._hasAttributes) {
            node.attributes = attributes;
        }
        this._currentFragment.push(node);
        if (isEmpty)
            return;
        this._stack.push(this._currentFragment);
        this._currentFragment = node.childNodes;
    }
    onEndElement(name) {
        this._currentFragment = this._stack.pop() || [];
        const lastElement = this._currentFragment[this._currentFragment.length - 1];
        if (!lastElement)
            return;
        for (let i = 0, ii = lastElement.childNodes.length; i < ii; i++) {
            lastElement.childNodes[i].parentNode = lastElement;
        }
    }
    /** @implements */
    onError(code) {
        this._errorCode = code;
    }
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=xml_parser.js.map