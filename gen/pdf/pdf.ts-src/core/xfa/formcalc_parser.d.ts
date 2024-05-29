/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/xfa/formcalc_parser.ts
 * @license Apache-2.0
 ******************************************************************************/
import { Lexer, type Token } from "./formcalc_lexer.js";
export declare const enum Errors {
    assignment = "Invalid token in assignment.",
    block = "Invalid token in do ... end declaration.",
    elseif = "Invalid elseif declaration.",
    for = "Invalid token in for ... endfor declaration.",
    foreach = "Invalid token in foreach ... endfor declaration.",
    func = "Invalid token in func declaration.",
    if = "Invalid token if ... endif declaration.",
    index = "Invalid token in index.",
    params = "Invalid token in parameter list.",
    var = "Invalid token in var declaration.",
    while = "Invalid token while ... endwhile declaration."
}
declare abstract class Leaf<D = unknown> {
    abstract dump(): D;
    isSomPredicate(): boolean;
    isDotExpression(): boolean;
    isConstant(): boolean;
    toNumber(): number;
    toComparable(): undefined | null | number;
}
interface VarDeclDump {
    var: string;
    expr: unknown;
}
declare class VarDecl extends Leaf<VarDeclDump> {
    id: string;
    expr: Leaf<unknown> | undefined;
    constructor(id: string, expr: Leaf | undefined);
    /** @implement */
    dump(): {
        var: string;
        expr: unknown;
    };
}
interface AssignmentDump {
    assignment: string;
    expr: unknown;
}
declare class Assignment extends Leaf<AssignmentDump> {
    id: string;
    expr: Leaf<unknown>;
    constructor(id: string, expr: Leaf);
    /** @implement */
    dump(): {
        assignment: string;
        expr: unknown;
    };
}
interface FuncDeclDump {
    func: string;
    params: string[];
    body: unknown;
}
declare class FuncDecl extends Leaf<FuncDeclDump> {
    id: string;
    params: string[];
    body: ExprList;
    constructor(id: string, params: string[], body: ExprList);
    /** @implement */
    dump(): {
        func: string;
        params: string[];
        body: unknown[];
    };
}
interface IfDeclDump {
    decl: "if";
    condition: unknown;
    then: unknown[];
    elseif: ElseIfDeclDump[] | undefined;
    else: unknown[] | undefined;
}
declare class IfDecl extends Leaf<IfDeclDump> {
    condition: Leaf<unknown>;
    then: ExprList;
    elseif: ElseIfDecl[] | undefined;
    else: ExprList | undefined;
    constructor(condition: Leaf, thenClause: ExprList, elseIfClause: ElseIfDecl[] | undefined, elseClause: ExprList | undefined);
    /** @implement */
    dump(): {
        decl: "if";
        condition: unknown;
        then: unknown[];
        elseif: {
            decl: "elseif";
            condition: unknown;
            then: unknown[];
        }[] | undefined;
        else: unknown[] | undefined;
    };
}
interface ElseIfDeclDump {
    decl: "elseif";
    condition: unknown;
    then: unknown[];
}
declare class ElseIfDecl extends Leaf<ElseIfDeclDump> {
    condition: Leaf<unknown>;
    then: ExprList;
    constructor(condition: Leaf, thenClause: ExprList);
    /** @implement */
    dump(): {
        decl: "elseif";
        condition: unknown;
        then: unknown[];
    };
}
interface WhileDeclDump {
    decl: "while";
    condition: unknown;
    body: unknown[];
}
declare class WhileDecl extends Leaf<WhileDeclDump> {
    condition: Leaf<unknown>;
    body: ExprList;
    constructor(condition: Leaf, whileClause: ExprList);
    /** @implement */
    dump(): {
        decl: "while";
        condition: unknown;
        body: unknown[];
    };
}
interface ForDeclDump {
    decl: "for";
    assignment: AssignmentDump | VarDeclDump;
    type: "upto" | "downto";
    end: unknown;
    step: unknown;
    body: unknown[];
}
declare class ForDecl extends Leaf<ForDeclDump> {
    assignment: VarDecl | Assignment;
    upto: boolean;
    end: Leaf<unknown>;
    step: Leaf<unknown> | undefined;
    body: ExprList;
    constructor(assignment: Assignment | VarDecl, upto: boolean, end: Leaf, step: Leaf | undefined, body: ExprList);
    /** @implement */
    dump(): {
        decl: "for";
        assignment: {
            var: string;
            expr: unknown;
        } | {
            assignment: string;
            expr: unknown;
        };
        type: "downto" | "upto";
        end: unknown;
        step: unknown;
        body: unknown[];
    };
}
interface ForeachDeclDump {
    decl: "foreach";
    id: string;
    params: unknown[];
    body: unknown;
}
declare class ForeachDecl extends Leaf<ForeachDeclDump> {
    id: string;
    params: Leaf<unknown>[];
    body: ExprList;
    constructor(id: string, params: Leaf[], body: ExprList);
    /** @implement */
    dump(): {
        decl: "foreach";
        id: string;
        params: unknown[];
        body: unknown[];
    };
}
interface BlockDeclDump {
    decl: "block";
    body: unknown;
}
declare class BlockDecl extends Leaf<BlockDeclDump> {
    body: ExprList;
    constructor(body: ExprList);
    /** @implement */
    dump(): {
        decl: "block";
        body: unknown[];
    };
}
type ExprListDump = unknown[];
declare class ExprList extends Leaf<ExprListDump> {
    expressions: Leaf<unknown>[];
    constructor(expressions: Leaf[]);
    /** @implement */
    dump(): unknown[];
}
export declare class Parser {
    lexer: Lexer;
    constructor(code: string);
    parse(): ExprList;
    parseExprList(): [Token | undefined, ExprList];
    parseExpr(tok: Token | undefined): [Token | undefined, Leaf];
    parseAssigmentOrExpr(tok: Token): [Token, Leaf];
    parseBlock(): [undefined, BlockDecl];
    parseVarDecl(): [Token, VarDecl];
    parseFuncDecl(): [undefined, FuncDecl];
    parseParamList(): string[];
    parseSimpleExpr(tok?: Token): [Token, Leaf<unknown>];
    parseIf(): [undefined, IfDecl];
    parseWhile(): [undefined, WhileDecl];
    parseAssignment(): [Token, VarDecl | Assignment];
    parseFor(): [undefined, ForDecl];
    parseForeach(): [undefined, ForeachDecl];
}
export {};
//# sourceMappingURL=formcalc_parser.d.ts.map