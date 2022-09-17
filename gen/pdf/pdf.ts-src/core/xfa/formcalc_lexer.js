/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
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
/*80--------------------------------------------------------------------------*/
const KEYWORDS = new Set([
    "and",
    "break",
    "continue",
    "do",
    "downto",
    "else",
    "elseif",
    "end",
    "endfor",
    "endfunc",
    "endif",
    "endwhile",
    "eq",
    "exit",
    "for",
    "foreach",
    "func",
    "ge",
    "gt",
    "if",
    "in",
    "infinity",
    "le",
    "lt",
    "nan",
    "ne",
    "not",
    "null",
    "or",
    "return",
    "step",
    "then",
    "this",
    "throw",
    "upto",
    "var",
    "while",
]);
export var TOKEN;
(function (TOKEN) {
    /* Appears in expression */
    TOKEN[TOKEN["and"] = 0] = "and";
    TOKEN[TOKEN["divide"] = 1] = "divide";
    TOKEN[TOKEN["dot"] = 2] = "dot";
    TOKEN[TOKEN["dotDot"] = 3] = "dotDot";
    TOKEN[TOKEN["dotHash"] = 4] = "dotHash";
    TOKEN[TOKEN["dotStar"] = 5] = "dotStar";
    TOKEN[TOKEN["eq"] = 6] = "eq";
    TOKEN[TOKEN["ge"] = 7] = "ge";
    TOKEN[TOKEN["gt"] = 8] = "gt";
    TOKEN[TOKEN["le"] = 9] = "le";
    TOKEN[TOKEN["leftBracket"] = 10] = "leftBracket";
    TOKEN[TOKEN["leftParen"] = 11] = "leftParen";
    TOKEN[TOKEN["lt"] = 12] = "lt";
    TOKEN[TOKEN["minus"] = 13] = "minus";
    TOKEN[TOKEN["ne"] = 14] = "ne";
    TOKEN[TOKEN["not"] = 15] = "not";
    TOKEN[TOKEN["null"] = 16] = "null";
    TOKEN[TOKEN["number"] = 17] = "number";
    TOKEN[TOKEN["or"] = 18] = "or";
    TOKEN[TOKEN["plus"] = 19] = "plus";
    TOKEN[TOKEN["rightBracket"] = 20] = "rightBracket";
    TOKEN[TOKEN["rightParen"] = 21] = "rightParen";
    TOKEN[TOKEN["string"] = 22] = "string";
    TOKEN[TOKEN["this"] = 23] = "this";
    TOKEN[TOKEN["times"] = 24] = "times";
    TOKEN[TOKEN["identifier"] = 25] = "identifier";
    /* Main statements */
    TOKEN[TOKEN["break"] = 26] = "break";
    TOKEN[TOKEN["continue"] = 27] = "continue";
    TOKEN[TOKEN["do"] = 28] = "do";
    TOKEN[TOKEN["for"] = 29] = "for";
    TOKEN[TOKEN["foreach"] = 30] = "foreach";
    TOKEN[TOKEN["func"] = 31] = "func";
    TOKEN[TOKEN["if"] = 32] = "if";
    TOKEN[TOKEN["var"] = 33] = "var";
    TOKEN[TOKEN["while"] = 34] = "while";
    /* Others */
    TOKEN[TOKEN["assign"] = 35] = "assign";
    TOKEN[TOKEN["comma"] = 36] = "comma";
    TOKEN[TOKEN["downto"] = 37] = "downto";
    TOKEN[TOKEN["else"] = 38] = "else";
    TOKEN[TOKEN["elseif"] = 39] = "elseif";
    TOKEN[TOKEN["end"] = 40] = "end";
    TOKEN[TOKEN["endif"] = 41] = "endif";
    TOKEN[TOKEN["endfor"] = 42] = "endfor";
    TOKEN[TOKEN["endfunc"] = 43] = "endfunc";
    TOKEN[TOKEN["endwhile"] = 44] = "endwhile";
    TOKEN[TOKEN["eof"] = 45] = "eof";
    TOKEN[TOKEN["exit"] = 46] = "exit";
    TOKEN[TOKEN["in"] = 47] = "in";
    TOKEN[TOKEN["infinity"] = 48] = "infinity";
    TOKEN[TOKEN["nan"] = 49] = "nan";
    TOKEN[TOKEN["return"] = 50] = "return";
    TOKEN[TOKEN["step"] = 51] = "step";
    TOKEN[TOKEN["then"] = 52] = "then";
    TOKEN[TOKEN["throw"] = 53] = "throw";
    TOKEN[TOKEN["upto"] = 54] = "upto";
})(TOKEN || (TOKEN = {}));
const hexPattern = /^[uU]([0-9a-fA-F]{4,8})/;
const numberPattern = /^\d*(?:\.\d*)?(?:[Ee][+-]?\d+)?/;
const dotNumberPattern = /^\d*(?:[Ee][+-]?\d+)?/;
const eolPattern = /[\r\n]+/;
const identifierPattern = new RegExp("^[\\p{L}_$!][\\p{L}\\p{N}_$]*", "u");
export class Token {
    id;
    value;
    constructor(id, value) {
        this.id = id;
        this.value = value;
    }
}
var NsSingletons;
(function (NsSingletons) {
    NsSingletons.obj = Object.create(null);
    const nonSingleton = new Set([
        "identifier",
        "string",
        "number",
        "nan",
        "infinity",
    ]);
    for (const [name, id] of Object.entries(TOKEN)) {
        if (!nonSingleton.has(name)) {
            NsSingletons.obj[name] = new Token(id);
        }
    }
    NsSingletons.obj.nan = new Token(TOKEN.number, NaN);
    NsSingletons.obj.infinity = new Token(TOKEN.number, Infinity);
})(NsSingletons || (NsSingletons = {}));
var Singletons = NsSingletons.obj;
export class Lexer {
    data;
    pos = 0;
    len;
    strBuf = [];
    constructor(data) {
        this.data = data;
        this.len = data.length;
    }
    skipUntilEOL() {
        const match = this.data.slice(this.pos).match(eolPattern);
        if (match) {
            this.pos += match.index + match[0].length;
        }
        else {
            // No eol so consume all the chars.
            this.pos = this.len;
        }
    }
    getIdentifier() {
        this.pos--;
        const match = this.data.slice(this.pos).match(identifierPattern);
        if (!match) {
            throw new Error(`Invalid token in FormCalc expression at position ${this.pos}.`);
        }
        const identifier = this.data.slice(this.pos, this.pos + match[0].length);
        this.pos += match[0].length;
        const lower = identifier.toLowerCase();
        if (!KEYWORDS.has(lower)) {
            return new Token(TOKEN.identifier, identifier);
        }
        return Singletons[lower];
    }
    getString() {
        const str = this.strBuf;
        const data = this.data;
        let start = this.pos;
        while (this.pos < this.len) {
            const char = data.charCodeAt(this.pos++);
            if (char === 0x22 /* = " */) {
                if (data.charCodeAt(this.pos) === 0x22 /* = " */) {
                    // Escaped quote.
                    str.push(data.slice(start, this.pos++));
                    start = this.pos;
                    continue;
                }
                // End of string
                break;
            }
            if (char === 0x5c /* = \ */) {
                const match = data.substring(this.pos, this.pos + 10).match(hexPattern);
                if (!match) {
                    continue;
                }
                str.push(data.slice(start, this.pos - 1));
                const code = match[1];
                if (code.length === 4) {
                    str.push(String.fromCharCode(parseInt(code, 16)));
                    start = this.pos += 5;
                }
                else if (code.length !== 8) {
                    str.push(String.fromCharCode(parseInt(code.slice(0, 4), 16)));
                    start = this.pos += 5;
                }
                else {
                    str.push(String.fromCharCode(parseInt(code, 16)));
                    start = this.pos += 9;
                }
            }
        }
        const lastChunk = data.slice(start, this.pos - 1);
        if (str.length === 0) {
            return new Token(TOKEN.string, lastChunk);
        }
        str.push(lastChunk);
        const string = str.join("");
        str.length = 0;
        return new Token(TOKEN.string, string);
    }
    getNumber(first) {
        const match = this.data.substring(this.pos).match(numberPattern);
        if (!match) {
            // return first - 0x30 /* = 0 */; //kkkk bug? ✅ 
            return new Token(TOKEN.number, first - 0x30 /* = 0 */);
        }
        const number = parseFloat(this.data.substring(this.pos - 1, this.pos + match[0].length));
        this.pos += match[0].length;
        return new Token(TOKEN.number, number);
    }
    getCompOperator(alt1, alt2) {
        if (this.data.charCodeAt(this.pos) === 0x3d /* = = */) {
            this.pos++;
            return alt1;
        }
        return alt2;
    }
    getLower() {
        const char = this.data.charCodeAt(this.pos);
        if (char === 0x3d /* = = */) {
            this.pos++;
            return Singletons.le;
        }
        if (char === 0x3e /* = > */) {
            this.pos++;
            return Singletons.ne;
        }
        return Singletons.lt;
    }
    getSlash() {
        if (this.data.charCodeAt(this.pos) === 0x2f /* = / */) {
            this.skipUntilEOL();
            return false;
        }
        return true;
    }
    getDot() {
        const char = this.data.charCodeAt(this.pos);
        if (char === 0x2e /* = . */) {
            this.pos++;
            return Singletons.dotDot;
        }
        if (char === 0x2a /* = * */) {
            this.pos++;
            return Singletons.dotStar;
        }
        if (char === 0x23 /* = # */) {
            this.pos++;
            return Singletons.dotHash;
        }
        if (0x30 /* = 0 */ <= char && char <= 0x39 /* = 9 */) {
            this.pos++;
            const match = this.data.substring(this.pos).match(dotNumberPattern);
            if (!match) {
                return new Token(TOKEN.number, (char - 0x30) /* = 0 */ / 10);
            }
            const end = this.pos + match[0].length;
            const number = parseFloat(this.data.substring(this.pos - 2, end));
            this.pos = end;
            return new Token(TOKEN.number, number);
        }
        return Singletons.dot;
    }
    next() {
        while (this.pos < this.len) {
            const char = this.data.charCodeAt(this.pos++);
            switch (char) {
                case 0x09 /* = \t */:
                case 0x0a /* = \n */:
                case 0x0b /* = \v */:
                case 0x0c /* = \f */:
                case 0x0d /* = \r */:
                case 0x20 /* =   */:
                    break;
                case 0x22 /* = " */:
                    return this.getString();
                case 0x26 /* = & */:
                    return Singletons.and;
                case 0x28 /* = ( */:
                    return Singletons.leftParen;
                case 0x29 /* = ) */:
                    return Singletons.rightParen;
                case 0x2a /* = * */:
                    return Singletons.times;
                case 0x2b /* = + */:
                    return Singletons.plus;
                case 0x2c /* = , */:
                    return Singletons.comma;
                case 0x2d /* = - */:
                    return Singletons.minus;
                case 0x2e /* = . */:
                    return this.getDot();
                case 0x2f /* = / */:
                    if (this.getSlash()) {
                        return Singletons.divide;
                    }
                    // It was a comment.
                    break;
                case 0x30 /* = 0 */:
                case 0x31 /* = 1 */:
                case 0x32 /* = 2 */:
                case 0x33 /* = 3 */:
                case 0x34 /* = 4 */:
                case 0x35 /* = 5 */:
                case 0x36 /* = 6 */:
                case 0x37 /* = 7 */:
                case 0x38 /* = 8 */:
                case 0x39 /* = 9 */:
                    return this.getNumber(char);
                case 0x3b /* = ; */:
                    this.skipUntilEOL();
                    break;
                case 0x3c /* = < */:
                    return this.getLower();
                case 0x3d /* = = */:
                    return this.getCompOperator(Singletons.eq, Singletons.assign);
                case 0x3e /* = > */:
                    return this.getCompOperator(Singletons.ge, Singletons.gt);
                case 0x5b /* = [ */:
                    return Singletons.leftBracket;
                case 0x5d /* = ] */:
                    return Singletons.rightBracket;
                case 0x7c /* = | */:
                    return Singletons.or;
                default:
                    return this.getIdentifier();
            }
        }
        return Singletons.eof;
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=formcalc_lexer.js.map