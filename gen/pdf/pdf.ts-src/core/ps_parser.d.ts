import type { BaseStream } from "./base_stream.js";
import { EOF } from "./primitives.js";
export declare class PostScriptParser {
    lexer: PostScriptLexer;
    operators: (number | string | null)[];
    token: PostScriptToken | EOF | undefined;
    prev: PostScriptToken | EOF | undefined;
    constructor(lexer: PostScriptLexer);
    nextToken(): void;
    accept(type: PostScriptTokenTypes): boolean;
    expect(type: PostScriptTokenTypes): boolean;
    parse(): (string | number | null)[];
    parseBlock(): void;
    parseCondition(): void;
}
declare const enum PostScriptTokenTypes {
    LBRACE = 0,
    RBRACE = 1,
    NUMBER = 2,
    OPERATOR = 3,
    IF = 4,
    IFELSE = 5
}
export declare class PostScriptToken {
    static get opCache(): Record<string, PostScriptToken>;
    type: PostScriptTokenTypes;
    value: string | number;
    constructor(type: PostScriptTokenTypes, value: string | number);
    static getOperator(op: string): PostScriptToken;
    static get LBRACE(): PostScriptToken;
    static get RBRACE(): PostScriptToken;
    static get IF(): PostScriptToken;
    static get IFELSE(): PostScriptToken;
}
export declare class PostScriptLexer {
    stream: BaseStream;
    strBuf: string[];
    currentChar: number;
    constructor(stream: BaseStream);
    nextChar(): number;
    getToken(): typeof EOF | PostScriptToken;
    getNumber(): number;
}
export {};
//# sourceMappingURL=ps_parser.d.ts.map