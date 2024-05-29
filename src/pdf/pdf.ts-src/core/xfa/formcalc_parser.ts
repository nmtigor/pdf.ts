/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/xfa/formcalc_parser.ts
 * @license Apache-2.0
 ******************************************************************************/

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

import { Lexer, TOKEN, type Token } from "./formcalc_lexer.ts";
/*80--------------------------------------------------------------------------*/

export const enum Errors {
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
  while = "Invalid token while ... endwhile declaration.",
}

const BUILTINS = new Set([
  // Arithmetic.
  "abs",
  "avg",
  "ceil",
  "count",
  "floor",
  "max",
  "min",
  "mod",
  "round",
  "sum",
  // Date and time.
  "date",
  "date2num",
  "datefmt",
  "isodate2num",
  "isotime2num",
  "localdatefmt",
  "localtimefmt",
  "num2date",
  "num2gmtime",
  "num2time",
  "time",
  "time2num",
  "timefmt",
  // Financial.
  "apr",
  "cterm",
  "fv",
  "ipmt",
  "npv",
  "pmt",
  "ppmt",
  "pv",
  "rate",
  "term",
  // Logical.
  "choose",
  "exists",
  "hasvalue",
  "oneof",
  "within",
  // String.
  "at",
  "concat",
  "decode",
  "encode",
  "format",
  "left",
  "len",
  "lower",
  "ltrim",
  "parse",
  "replace",
  "right",
  "rtrim",
  "space",
  "str",
  "stuff",
  "substr",
  "uuid",
  "upper",
  "wordnum",
  // Url.
  "get",
  "post",
  "put",
  // Miscellaneous.
  "eval",
  "ref",
  "unitvalue",
  "unittype",
  // Undocumented.
  "acos",
  "asin",
  "atan",
  "cos",
  "deg2rad",
  "exp",
  "log",
  "pi",
  "pow",
  "rad2deg",
  "sin",
  "sqrt",
  "tan",
]);

const LTR = true;
const RTL = false;

interface Operator {
  id: number;
  prec: number;
  assoc: typeof LTR | typeof RTL;
  nargs: number;
  repr?: string;
}
interface OperatorX extends Operator {
  op(x: number): number;
}
interface OperatorXY extends Operator {
  op(x: number, y: number): number;
}

const Operators = {
  dot: <Operator> { id: 0, prec: 0, assoc: RTL, nargs: 0, repr: "." },
  dotDot: <Operator> { id: 1, prec: 0, assoc: RTL, nargs: 0, repr: ".." },
  dotHash: <Operator> { id: 2, prec: 0, assoc: RTL, nargs: 0, repr: ".#" },

  call: <Operator> { id: 1, prec: 1, assoc: LTR, nargs: 0 },

  // Unary operators.
  minus: <OperatorX> {
    id: 4,
    nargs: 1,
    prec: 2,
    assoc: RTL,
    repr: "-",
    op: (x) => -x,
  },
  plus: <OperatorX> {
    id: 5,
    nargs: 1,
    prec: 2,
    assoc: RTL,
    repr: "+",
    op: (x) => +x,
  },
  not: <OperatorX> {
    id: 6,
    nargs: 1,
    prec: 2,
    assoc: RTL,
    repr: "!",
    op: (x) => (!x ? 1 : 0),
  },

  mul: <OperatorXY> {
    id: 7,
    nargs: 2,
    prec: 3,
    assoc: LTR,
    repr: "*",
    op: (x, y) => x * y,
  },
  div: <OperatorXY> {
    id: 8,
    nargs: 2,
    prec: 3,
    assoc: LTR,
    repr: "/",
    op: (x, y) => x / y,
  },

  add: <OperatorXY> {
    id: 9,
    nargs: 2,
    prec: 4,
    assoc: LTR,
    repr: "+",
    op: (x, y) => x + y,
  },
  sub: <OperatorXY> {
    id: 10,
    nargs: 2,
    prec: 4,
    assoc: LTR,
    repr: "-",
    op: (x, y) => x - y,
  },

  lt: <OperatorXY> {
    id: 11,
    nargs: 2,
    prec: 5,
    assoc: LTR,
    repr: "<",
    op: (x, y) => (x < y ? 1 : 0),
  },
  le: <OperatorXY> {
    id: 12,
    nargs: 2,
    prec: 5,
    assoc: LTR,
    repr: "<=",
    op: (x, y) => (x <= y ? 1 : 0),
  },
  gt: <OperatorXY> {
    id: 13,
    nargs: 2,
    prec: 5,
    assoc: LTR,
    repr: ">",
    op: (x, y) => (x > y ? 1 : 0),
  },
  ge: <OperatorXY> {
    id: 14,
    nargs: 2,
    prec: 5,
    assoc: LTR,
    repr: ">=",
    op: (x, y) => (x >= y ? 1 : 0),
  },

  eq: <OperatorXY> {
    id: 15,
    nargs: 2,
    prec: 6,
    assoc: LTR,
    repr: "===",
    op: (x, y) => (x === y ? 1 : 0),
  },
  ne: <OperatorXY> {
    id: 16,
    nargs: 2,
    prec: 6,
    assoc: LTR,
    repr: "!==",
    op: (x, y) => (x !== y ? 1 : 0),
  },

  and: <OperatorXY> {
    id: 17,
    nargs: 2,
    prec: 7,
    assoc: LTR,
    repr: "&&",
    op: (x, y) => (x && y ? 1 : 0),
  },

  or: <OperatorXY> {
    id: 18,
    nargs: 2,
    prec: 8,
    assoc: LTR,
    repr: "||",
    op: (x, y) => (x || y ? 1 : 0),
  },

  // Not real operators.
  paren: <Operator> { id: 19, prec: 9, assoc: RTL, nargs: 0 },
  subscript: <Operator> { id: 20, prec: 9, assoc: RTL, nargs: 0 },
};

const OPERATOR = true;
const OPERAND = false;

// How it works...
//
// There is two stacks: one for operands and one for operators.
// Each time an operand is met (number, identifier, ...),
// it's pushed on operands stack.
// Unary operators such as + or - are guessed according to the last pushed
// thing:
// for example, if an operand has been push then a '-' is a subtraction
// but if an operator has been push (e.g. '*') then a '-' is the negate
// operation ('... * - ...' can't be a subtraction).
// Each time an operator is met its precedence is compared with the one of the
// operator on top of operators stack:
//  - if top has precendence on operator then top is applied to the operands
//    on their stack;
//  - else just push the operator.
// For example: 1 + 2 * 3
//  round 1: operands: [1], operators: []
//  round 2: operands: [1], operators: [+]
//  round 3: operands: [1, 2], operators: [+]
//
//  + has not the precedence on *
//  round 4: operands: [1, 2], operators: [+, *]
//  round 5: operands: [1, 2, 3], operators: [+, *]
// no more token: apply operators on operands:
//  round 6: operands: [1, 6], operators: [+]
//  round 7: operands: [7], operators: []
// Parenthesis are treated like an operator with no precedence on the real ones.
// As a consequence, any operation is done before this fake one and when
// a right parenthesis is met then we can apply operators to operands
// until the opening parenthesis is met.
//
class SimpleExprParser {
  lexer;
  operands: Leaf[] = [];
  operators: Operator[] = [];
  last = OPERATOR;

  constructor(lexer: Lexer) {
    this.lexer = lexer;
  }

  reset() {
    this.operands.length = 0;
    this.operators.length = 0;
    this.last = OPERATOR;
  }

  parse(tok?: Token): [Token, Leaf] {
    tok ||= this.lexer.next();

    while (true) {
      // Token ids (see form_lexer.js) are consecutive in order
      // to have switch table with no holes.
      switch (tok.id) {
        case TOKEN.and:
          if (this.last === OPERAND) {
            this.pushOperator(Operators.and);
            break;
          }
          return [tok, this.getNode()];
        case TOKEN.divide:
          if (this.last === OPERAND) {
            this.pushOperator(Operators.div);
            break;
          }
          return [tok, this.getNode()];
        case TOKEN.dot:
          if (this.last === OPERAND) {
            this.pushOperator(Operators.dot);
            break;
          }
          return [tok, this.getNode()];
        case TOKEN.dotDot:
          if (this.last === OPERAND) {
            this.pushOperator(Operators.dotDot);
            break;
          }
          return [tok, this.getNode()];
        case TOKEN.dotHash:
          if (this.last === OPERAND) {
            this.pushOperator(Operators.dotHash);
            break;
          }
          return [tok, this.getNode()];
        case TOKEN.dotStar:
          if (this.last === OPERAND) {
            this.pushOperator(Operators.dot);
            this.pushOperand(new AstEveryOccurence());
            break;
          }
          return [tok, this.getNode()];
        case TOKEN.eq:
          if (this.last === OPERAND) {
            this.pushOperator(Operators.eq);
            break;
          }
          return [tok, this.getNode()];
        case TOKEN.ge:
          if (this.last === OPERAND) {
            this.pushOperator(Operators.ge);
            break;
          }
          return [tok, this.getNode()];
        case TOKEN.gt:
          if (this.last === OPERAND) {
            this.pushOperator(Operators.gt);
            break;
          }
          return [tok, this.getNode()];
        case TOKEN.le:
          if (this.last === OPERAND) {
            this.pushOperator(Operators.le);
            break;
          }
          return [tok, this.getNode()];
        case TOKEN.leftBracket:
          if (this.last === OPERAND) {
            this.flushWithOperator(Operators.subscript);
            const operand = this.operands.pop()!;
            const index = SimpleExprParser.parseIndex(this.lexer);
            this.operands.push(new AstSubscript(operand, index));
            this.last = OPERAND;
            break;
          }
          return [tok, this.getNode()];
        case TOKEN.leftParen:
          if (this.last === OPERAND) {
            const lastOperand = this.operands.at(-1);
            if (!(lastOperand instanceof AstIdentifier)) {
              return [tok, this.getNode()];
            }
            lastOperand.toLowerCase();
            const name = lastOperand.id;

            this.flushWithOperator(Operators.call);
            const callee = this.operands.pop()!;
            const params = SimpleExprParser.parseParams(this.lexer);

            if (callee instanceof AstIdentifier && BUILTINS.has(name)) {
              this.operands.push(new AstBuiltinCall(name, params));
            } else {
              this.operands.push(new AstCall(callee, params));
            }

            this.last = OPERAND;
          } else {
            this.operators.push(Operators.paren);
            this.last = OPERATOR;
          }
          break;
        case TOKEN.lt:
          if (this.last === OPERAND) {
            this.pushOperator(Operators.lt);
            break;
          }
          return [tok, this.getNode()];
        case TOKEN.minus:
          if (this.last === OPERATOR) {
            this.pushOperator(Operators.minus);
          } else {
            this.pushOperator(Operators.sub);
          }
          break;
        case TOKEN.ne:
          if (this.last === OPERAND) {
            this.pushOperator(Operators.ne);
            break;
          }
          return [tok, this.getNode()];
        case TOKEN.not:
          if (this.last === OPERAND) {
            this.pushOperator(Operators.not);
            break;
          }
          return [tok, this.getNode()];
        case TOKEN.null:
          if (this.last === OPERATOR) {
            this.pushOperand(new AstNull());
            break;
          }
          return [tok, this.getNode()];
        case TOKEN.number:
          if (this.last === OPERATOR) {
            this.pushOperand(new AstNumber(<number> tok.value));
            break;
          }
          return [tok, this.getNode()];
        case TOKEN.or:
          if (this.last === OPERAND) {
            this.pushOperator(Operators.or);
            break;
          }
          return [tok, this.getNode()];
        case TOKEN.plus:
          if (this.last === OPERATOR) {
            this.pushOperator(Operators.plus);
          } else {
            this.pushOperator(Operators.add);
          }
          break;
        case TOKEN.rightBracket:
          if (!this.flushUntil(Operators.subscript.id)) {
            return [tok, this.getNode()];
          }
          break;
        case TOKEN.rightParen:
          if (!this.flushUntil(Operators.paren.id)) {
            return [tok, this.getNode()];
          }
          break;
        case TOKEN.string:
          if (this.last === OPERATOR) {
            this.pushOperand(new AstString(<string> tok.value));
            break;
          }
          return [tok, this.getNode()];
        case TOKEN.this:
          if (this.last === OPERATOR) {
            this.pushOperand(new AstThis());
            break;
          }
          return [tok, this.getNode()];
        case TOKEN.times:
          if (this.last === OPERAND) {
            this.pushOperator(Operators.mul);
            break;
          }
          return [tok, this.getNode()];
        case TOKEN.identifier:
          if (this.last === OPERATOR) {
            this.pushOperand(new AstIdentifier(<string> tok.value));
            break;
          }
          return [tok, this.getNode()];
        default:
          return [tok, this.getNode()];
      }
      tok = this.lexer.next();
    }
  }

  static parseParams(lexer: Lexer) {
    const parser = new SimpleExprParser(lexer);
    const params = [];
    while (true) {
      const [tok, param] = parser.parse();
      if (param) {
        params.push(param);
      }
      if (tok.id === TOKEN.rightParen) {
        return params;
      } else if (tok.id !== TOKEN.comma) {
        throw new Error(Errors.params);
      }
      parser.reset();
    }
  }

  static parseIndex(lexer: Lexer) {
    let tok = lexer.next();
    if (tok.id === TOKEN.times) {
      tok = lexer.next();
      if (tok.id !== TOKEN.rightBracket) {
        throw new Error(Errors.index);
      }
      return new AstEveryOccurence();
    }
    const [token, expr] = new SimpleExprParser(lexer).parse(tok);
    if (token.id !== TOKEN.rightBracket) {
      throw new Error(Errors.index);
    }
    return expr;
  }

  pushOperator(op: Operator) {
    this.flushWithOperator(op);
    this.operators.push(op);
    this.last = OPERATOR;
  }

  pushOperand(op: Leaf) {
    this.operands.push(op);
    this.last = OPERAND;
  }

  operate(op: Operator) {
    if (op.nargs === 1) {
      const arg = this.operands.pop()!;
      this.operands.push(
        AstUnaryOperator.getOperatorOrValue(<OperatorX> op, arg),
      );
    } else {
      const arg2 = this.operands.pop()!;
      const arg1 = this.operands.pop()!;
      this.operands.push(
        AstBinaryOperator.getOperatorOrValue(<OperatorXY> op, arg1, arg2),
      );
    }
  }

  flushWithOperator(op: Operator) {
    while (true) {
      const top = this.operators.at(-1);
      if (top) {
        if (top.id >= 0 && SimpleExprParser.checkPrecedence(top, op)) {
          this.operators.pop();
          this.operate(top);
          continue;
        }
      }
      return;
    }
  }

  flush() {
    while (true) {
      const op = this.operators.pop();
      if (!op) {
        return;
      }
      this.operate(op);
    }
  }

  flushUntil(id: number) {
    while (true) {
      const op = this.operators.pop();
      if (!op) {
        return false;
      }
      if (op.id === id) {
        return true;
      }
      this.operate(op);
    }
  }

  getNode() {
    this.flush();
    return this.operands.pop()!;
  }

  static checkPrecedence(left: Operator, right: Operator) {
    return (
      left.prec < right.prec || (left.prec === right.prec && left.assoc === LTR)
    );
  }
}

abstract class Leaf<D = unknown> {
  abstract dump(): D;

  isSomPredicate() {
    return false;
  }

  isDotExpression() {
    return false;
  }

  isConstant() {
    return false;
  }

  toNumber() {
    return 0;
  }

  toComparable(): undefined | null | number {
    return undefined;
  }
}

interface AstCallDump {
  callee: unknown;
  params: unknown[];
}
class AstCall extends Leaf<AstCallDump> {
  callee;
  params;

  constructor(callee: Leaf, params: Leaf[]) {
    super();
    this.callee = callee;
    this.params = params;
  }

  /** @implement */
  dump() {
    return {
      callee: this.callee.dump(),
      params: this.params.map((x) => x.dump()),
    };
  }
}

interface AstBuiltinCallDump {
  builtin: string;
  params: unknown[];
}
class AstBuiltinCall extends Leaf<AstBuiltinCallDump> {
  id;
  params;

  constructor(id: string, params: Leaf[]) {
    super();
    this.id = id;
    this.params = params;
  }

  /** @implement */
  dump() {
    return {
      builtin: this.id,
      params: this.params.map((x) => x.dump()),
    };
  }
}

interface AstSubscriptDump {
  operand: unknown;
  index: unknown;
}
class AstSubscript extends Leaf<AstSubscriptDump> {
  operand;
  index;

  constructor(operand: Leaf, index: Leaf) {
    super();
    this.operand = operand;
    this.index = index;
  }

  /** @implement */
  dump() {
    return {
      operand: this.operand.dump(),
      index: this.index.dump(),
    };
  }
}

interface AstBinaryOperatorDump {
  operator: string | undefined;
  left: unknown;
  right: unknown;
}
class AstBinaryOperator extends Leaf<AstBinaryOperatorDump> {
  id;
  left;
  right;
  repr;

  constructor(id: number, left: Leaf, right: Leaf, repr: string | undefined) {
    super();
    this.id = id;
    this.left = left;
    this.right = right;
    this.repr = repr;
  }

  /** @implement */
  dump() {
    return {
      operator: this.repr,
      left: this.left.dump(),
      right: this.right.dump(),
    };
  }

  override isDotExpression() {
    return Operators.dot.id <= this.id && this.id <= Operators.dotHash.id;
  }

  override isSomPredicate() {
    return (this.isDotExpression() ||
      (Operators.lt.id <= this.id && this.id <= Operators.or.id &&
        ((this.left.isDotExpression() && this.right.isConstant()) ||
          (this.left.isConstant() && this.right.isDotExpression()) ||
          (this.left.isDotExpression() && this.right.isDotExpression()))));
  }

  static getOperatorOrValue(operator: OperatorXY, left: Leaf, right: Leaf) {
    if (!left.isConstant() || !right.isConstant()) {
      return new AstBinaryOperator(operator.id, left, right, operator.repr);
    }

    if (
      Operators.lt.id <= operator.id &&
      operator.id <= Operators.ne.id &&
      !(left instanceof AstNumber) &&
      !(right instanceof AstNumber)
    ) {
      return new AstNumber(
        operator.op(left.toComparable()!, right.toComparable()!),
      );
    }

    return new AstNumber(operator.op(left.toNumber(), right.toNumber()));
  }
}

interface AstUnaryOperatorDump {
  operator: string | undefined;
  arg: unknown;
}
class AstUnaryOperator extends Leaf<AstUnaryOperatorDump> {
  id;
  arg;
  repr;

  constructor(id: number, arg: Leaf, repr: string | undefined) {
    super();
    this.id = id;
    this.arg = arg;
    this.repr = repr;
  }

  /** @implement */
  dump() {
    return {
      operator: this.repr,
      arg: this.arg.dump(),
    };
  }

  static getOperatorOrValue(operator: OperatorX, arg: Leaf) {
    if (!arg.isConstant()) {
      return new AstUnaryOperator(operator.id, arg, operator.repr);
    }

    return new AstNumber(operator.op(arg.toNumber()));
  }
}

type AstNumberDump = number;
class AstNumber extends Leaf<AstNumberDump> {
  number;

  constructor(number: number) {
    super();
    this.number = number;
  }

  /** @implement */
  dump() {
    return this.number;
  }

  override isConstant() {
    return true;
  }

  override toNumber() {
    return this.number;
  }
}

type AstStringDump = string;
class AstString extends Leaf<AstStringDump> {
  str;

  constructor(str: string) {
    super();
    this.str = str;
  }

  /** @implement */
  dump() {
    return this.str;
  }

  override isConstant() {
    return true;
  }

  override toNumber() {
    return !isNaN(this.str as any) ? parseFloat(this.str) : 0;
  }

  override toComparable() {
    return +this.str;
  }
}

interface AstThisDump {
  special: "this";
}
class AstThis extends Leaf<AstThisDump> {
  /** @implement */
  dump() {
    return { special: "this" as const };
  }
}

interface AstIdentifierDump {
  id: string;
}
class AstIdentifier extends Leaf<AstIdentifierDump> {
  id;

  constructor(id: string) {
    super();
    this.id = id;
  }

  /** @implement */
  dump() {
    return { id: this.id };
  }

  toLowerCase() {
    this.id = this.id.toLowerCase();
  }
}

interface AstNullDump {
  special: null;
}
class AstNull extends Leaf<AstNullDump> {
  /** @implement */
  dump() {
    return { special: null };
  }

  override isConstant() {
    return true;
  }

  override toComparable() {
    return null;
  }
}

// class AstEveryOccurence
// {
//   dump()
//   {
//     return { special: "*" };
//   }
// }
interface AstEveryOccurenceDump {
  special: "*";
}
class AstEveryOccurence extends Leaf<AstEveryOccurenceDump> {
  /** @implement */
  dump() {
    return { special: "*" as const };
  }
}

interface VarDeclDump {
  var: string;
  expr: unknown;
}
class VarDecl extends Leaf<VarDeclDump> {
  id;
  expr;

  constructor(id: string, expr: Leaf | undefined) {
    super();
    this.id = id;
    this.expr = expr;
  }

  /** @implement */
  dump() {
    return {
      var: this.id,
      expr: this.expr!.dump(),
    };
  }
}

interface AssignmentDump {
  assignment: string;
  expr: unknown;
}
class Assignment extends Leaf<AssignmentDump> {
  id;
  expr;

  constructor(id: string, expr: Leaf) {
    super();
    this.id = id;
    this.expr = expr;
  }

  /** @implement */
  dump() {
    return {
      assignment: this.id,
      expr: this.expr.dump(),
    };
  }
}

interface FuncDeclDump {
  func: string;
  params: string[];
  body: unknown;
}
class FuncDecl extends Leaf<FuncDeclDump> {
  id;
  params;
  body;

  constructor(id: string, params: string[], body: ExprList) {
    super();
    this.id = id;
    this.params = params;
    this.body = body;
  }

  /** @implement */
  dump() {
    return {
      func: this.id,
      params: this.params,
      body: this.body.dump(),
    };
  }
}

interface IfDeclDump {
  decl: "if";
  condition: unknown;
  then: unknown[];
  elseif: ElseIfDeclDump[] | undefined;
  else: unknown[] | undefined;
}
class IfDecl extends Leaf<IfDeclDump> {
  condition;
  then;
  elseif;
  else;

  constructor(
    condition: Leaf,
    thenClause: ExprList,
    elseIfClause: ElseIfDecl[] | undefined,
    elseClause: ExprList | undefined,
  ) {
    super();
    this.condition = condition;
    this.then = thenClause;
    this.elseif = elseIfClause;
    this.else = elseClause;
  }

  /** @implement */
  dump() {
    return {
      decl: "if" as const,
      condition: this.condition.dump(),
      then: this.then.dump(),
      elseif: this.elseif ? this.elseif.map((x) => x.dump()) : undefined,
      else: this.else ? this.else.dump() : undefined,
    };
  }
}

interface ElseIfDeclDump {
  decl: "elseif";
  condition: unknown;
  then: unknown[];
}
class ElseIfDecl extends Leaf<ElseIfDeclDump> {
  condition;
  then;

  constructor(condition: Leaf, thenClause: ExprList) {
    super();
    this.condition = condition;
    this.then = thenClause;
  }

  /** @implement */
  dump() {
    return {
      decl: "elseif" as const,
      condition: this.condition.dump(),
      then: this.then.dump(),
    };
  }
}

interface WhileDeclDump {
  decl: "while";
  condition: unknown;
  body: unknown[];
}
class WhileDecl extends Leaf<WhileDeclDump> {
  condition;
  body;

  constructor(condition: Leaf, whileClause: ExprList) {
    super();
    this.condition = condition;
    this.body = whileClause;
  }

  /** @implement */
  dump() {
    return {
      decl: "while" as const,
      condition: this.condition.dump(),
      body: this.body.dump(),
    };
  }
}

interface ForDeclDump {
  decl: "for";
  assignment: AssignmentDump | VarDeclDump;
  type: "upto" | "downto";
  end: unknown;
  step: unknown;
  body: unknown[];
}
class ForDecl extends Leaf<ForDeclDump> {
  assignment;
  upto;
  end;
  step;
  body;

  constructor(
    assignment: Assignment | VarDecl,
    upto: boolean,
    end: Leaf,
    step: Leaf | undefined,
    body: ExprList,
  ) {
    super();
    this.assignment = assignment;
    this.upto = upto;
    this.end = end;
    this.step = step;
    this.body = body;
  }

  /** @implement */
  dump() {
    return {
      decl: "for" as const,
      assignment: this.assignment.dump(),
      type: this.upto ? "upto" as const : "downto" as const,
      end: this.end.dump(),
      step: this.step ? this.step.dump() : undefined,
      body: this.body.dump(),
    };
  }
}

interface ForeachDeclDump {
  decl: "foreach";
  id: string;
  params: unknown[];
  body: unknown;
}
class ForeachDecl extends Leaf<ForeachDeclDump> {
  id;
  params;
  body;

  constructor(id: string, params: Leaf[], body: ExprList) {
    super();
    this.id = id;
    this.params = params;
    this.body = body;
  }

  /** @implement */
  dump() {
    return {
      decl: "foreach" as const,
      id: this.id,
      params: this.params.map((x) => x.dump()),
      body: this.body.dump(),
    };
  }
}

interface BlockDeclDump {
  decl: "block";
  body: unknown;
}
class BlockDecl extends Leaf<BlockDeclDump> {
  body;

  constructor(body: ExprList) {
    super();
    this.body = body;
  }

  /** @implement */
  dump() {
    return {
      decl: "block" as const,
      body: this.body.dump(),
    };
  }
}

type ExprListDump = unknown[];
class ExprList extends Leaf<ExprListDump> {
  expressions;

  constructor(expressions: Leaf[]) {
    super();
    this.expressions = expressions;
  }

  /** @implement */
  dump() {
    return this.expressions.map((x) => x.dump());
  }
}

interface BreakDeclDump {
  special: "break";
}
class BreakDecl extends Leaf<BreakDeclDump> {
  /** @implement */
  dump() {
    return { special: "break" as const };
  }
}

interface ContinueDeclDump {
  special: "continue";
}
class ContinueDecl extends Leaf<ContinueDeclDump> {
  /** @implement */
  dump() {
    return { special: "continue" as const };
  }
}

export class Parser {
  lexer;

  constructor(code: string) {
    this.lexer = new Lexer(code);
  }

  parse() {
    const [tok, decls] = this.parseExprList();
    if (tok!.id !== TOKEN.eof) {
      throw new Error("Invalid token in Form code");
    }
    return decls;
  }

  parseExprList(): [Token | undefined, ExprList] {
    const expressions: Leaf[] = [];
    let tok: Token | undefined,
      expr;
    while (true) {
      [tok, expr] = this.parseExpr(tok);
      if (!expr) {
        return [tok, new ExprList(expressions)];
      }
      expressions.push(expr);
    }
  }

  parseExpr(tok: Token | undefined): [Token | undefined, Leaf] {
    tok ||= this.lexer.next();
    switch (tok.id) {
      case TOKEN.identifier:
        return this.parseAssigmentOrExpr(tok);
      case TOKEN.break:
        return [undefined, new BreakDecl()];
      case TOKEN.continue:
        return [undefined, new ContinueDecl()];
      case TOKEN.do:
        return this.parseBlock();
      case TOKEN.for:
        return this.parseFor();
      case TOKEN.foreach:
        return this.parseForeach();
      case TOKEN.func:
        return this.parseFuncDecl();
      case TOKEN.if:
        return this.parseIf();
      case TOKEN.var:
        return this.parseVarDecl();
      case TOKEN.while:
        return this.parseWhile();
      default:
        return this.parseSimpleExpr(tok);
    }
  }

  parseAssigmentOrExpr(tok: Token): [Token, Leaf] {
    const savedTok = tok;

    tok = this.lexer.next();
    if (tok.id === TOKEN.assign) {
      const [tok1, expr] = this.parseSimpleExpr();
      return [tok1, new Assignment(<string> savedTok.value, expr)];
    }

    const parser = new SimpleExprParser(this.lexer);
    parser.pushOperand(new AstIdentifier(<string> savedTok.value));

    return parser.parse(tok);
  }

  parseBlock(): [undefined, BlockDecl] {
    const [tok1, body] = this.parseExprList();

    const tok = tok1 || this.lexer.next();
    if (tok.id !== TOKEN.end) {
      throw new Error(Errors.block);
    }

    return [undefined, new BlockDecl(body)];
  }

  parseVarDecl(): [Token, VarDecl] {
    // 'var' Identifier ('=' SimpleExpression)?
    let tok = this.lexer.next();
    if (tok.id !== TOKEN.identifier) {
      throw new Error(Errors.var);
    }

    const identifier = <string> tok.value;

    tok = this.lexer.next();
    if (tok.id !== TOKEN.assign) {
      return [tok, new VarDecl(identifier, undefined)];
    }

    const [tok1, expr] = this.parseSimpleExpr();
    return [tok1, new VarDecl(identifier, expr)];
  }

  parseFuncDecl(): [undefined, FuncDecl] {
    // 'func' Identifier ParameterList 'do' ExpressionList 'endfunc'.
    let tok = this.lexer.next();
    if (tok.id !== TOKEN.identifier) {
      throw new Error(Errors.func);
    }

    const identifier = <string> tok.value;
    const params = this.parseParamList();

    tok = this.lexer.next();
    if (tok.id !== TOKEN.do) {
      throw new Error(Errors.func);
    }

    const [tok1, body] = this.parseExprList();

    tok = tok1 || this.lexer.next();
    if (tok.id !== TOKEN.endfunc) {
      throw new Error(Errors.func);
    }

    return [undefined, new FuncDecl(identifier, params, body)];
  }

  parseParamList() {
    // '(' Identifier * ')'.
    const params: string[] = [];

    let tok = this.lexer.next();
    if (tok.id !== TOKEN.leftParen) {
      throw new Error(Errors.func);
    }

    tok = this.lexer.next();
    if (tok.id === TOKEN.rightParen) {
      return params;
    }

    while (true) {
      if (tok.id !== TOKEN.identifier) {
        throw new Error(Errors.func);
      }
      params.push(<string> tok.value);
      tok = this.lexer.next();
      if (tok.id === TOKEN.rightParen) {
        return params;
      }
      if (tok.id !== TOKEN.comma) {
        throw new Error(Errors.func);
      }
      tok = this.lexer.next();
    }
  }

  parseSimpleExpr(tok?: Token) {
    return new SimpleExprParser(this.lexer).parse(tok);
  }

  parseIf(): [undefined, IfDecl] {
    // 'if' '(' SimpleExpression ')' then ExpressionList
    // ('elseif' '(' SimpleExpression ')' then ExpressionList )*
    // ('else' ExpressionList)?
    // 'endif'.
    let elseIfClause: ElseIfDecl[] | undefined = [];
    let tok = this.lexer.next();
    if (tok.id !== TOKEN.leftParen) {
      throw new Error(Errors.if);
    }

    const [tok1, condition] = this.parseSimpleExpr();

    tok = tok1 || this.lexer.next();
    if (tok.id !== TOKEN.rightParen) {
      throw new Error(Errors.if);
    }

    tok = this.lexer.next();
    if (tok.id !== TOKEN.then) {
      throw new Error(Errors.if);
    }

    const [tok2, thenClause] = this.parseExprList();
    tok = tok2 || this.lexer.next();

    while (tok.id === TOKEN.elseif) {
      tok = this.lexer.next();
      if (tok.id !== TOKEN.leftParen) {
        throw new Error(Errors.elseif);
      }

      const [tok3, elseIfCondition] = this.parseSimpleExpr();

      tok = tok3 || this.lexer.next();
      if (tok.id !== TOKEN.rightParen) {
        throw new Error(Errors.elseif);
      }

      tok = this.lexer.next();
      if (tok.id !== TOKEN.then) {
        throw new Error(Errors.elseif);
      }

      const [tok4, elseIfThenClause] = this.parseExprList();
      elseIfClause.push(new ElseIfDecl(elseIfCondition, elseIfThenClause));

      tok = tok4 || this.lexer.next();
    }

    if (elseIfClause.length === 0) {
      elseIfClause = undefined;
    }

    if (tok.id === TOKEN.endif) {
      return [
        undefined,
        new IfDecl(condition, thenClause, elseIfClause, undefined),
      ];
    }

    if (tok.id !== TOKEN.else) {
      throw new Error(Errors.if);
    }

    const [tok5, elseClause] = this.parseExprList();

    tok = tok5 || this.lexer.next();
    if (tok.id !== TOKEN.endif) {
      throw new Error(Errors.if);
    }

    return [
      undefined,
      new IfDecl(condition, thenClause, elseIfClause, elseClause),
    ];
  }

  parseWhile(): [undefined, WhileDecl] {
    // 'while' '(' SimpleExpression ')' 'do' ExprList 'endwhile'
    let tok = this.lexer.next();
    if (tok.id !== TOKEN.leftParen) {
      throw new Error(Errors.while);
    }

    const [tok1, condition] = this.parseSimpleExpr();

    tok = tok1 || this.lexer.next();
    if (tok.id !== TOKEN.rightParen) {
      throw new Error(Errors.while);
    }

    tok = this.lexer.next();
    if (tok.id !== TOKEN.do) {
      throw new Error(Errors.while);
    }

    const [tok2, whileClause] = this.parseExprList();

    tok = tok2 || this.lexer.next();
    if (tok.id !== TOKEN.endwhile) {
      throw new Error(Errors.while);
    }

    return [undefined, new WhileDecl(condition, whileClause)];
  }

  parseAssignment(): [Token, VarDecl | Assignment] {
    let tok = this.lexer.next();
    let hasVar = false;
    if (tok.id === TOKEN.var) {
      hasVar = true;
      tok = this.lexer.next();
    }

    if (tok.id !== TOKEN.identifier) {
      throw new Error(Errors.assignment);
    }

    const identifier = <string> tok.value;

    tok = this.lexer.next();
    if (tok.id !== TOKEN.assign) {
      throw new Error(Errors.assignment);
    }

    const [tok1, expr] = this.parseSimpleExpr();
    if (hasVar) {
      return [tok1, new VarDecl(identifier, expr)];
    }
    return [tok1, new Assignment(identifier, expr)];
  }

  parseFor(): [undefined, ForDecl] {
    // 'for' Assignment ('upto'|'downto') Expr ('step' Expr)? 'do'
    // ExprList 'endfor'
    let tok,
      step: Leaf | undefined;
    let upto = false;
    const [tok1, assignment] = this.parseAssignment();

    tok = tok1 || this.lexer.next();
    if (tok.id === TOKEN.upto) {
      upto = true;
    } else if (tok.id !== TOKEN.downto) {
      throw new Error(Errors.for);
    }

    const [tok2, end] = this.parseSimpleExpr();

    tok = tok2 || this.lexer.next();
    if (tok.id === TOKEN.step) {
      [tok, step] = this.parseSimpleExpr();
      tok ||= this.lexer.next();
    }

    if (tok.id !== TOKEN.do) {
      throw new Error(Errors.for);
    }

    const [tok3, body] = this.parseExprList();

    tok = tok3 || this.lexer.next();
    if (tok.id !== TOKEN.endfor) {
      throw new Error(Errors.for);
    }

    return [undefined, new ForDecl(assignment, upto, end, step, body)];
  }

  parseForeach(): [undefined, ForeachDecl] {
    // 'for' Identifier 'in' '(' ArgumentList ')' 'do'
    // ExprList 'endfor'
    let tok = this.lexer.next();
    if (tok.id !== TOKEN.identifier) {
      throw new Error(Errors.foreach);
    }

    const identifier = <string> tok.value;

    tok = this.lexer.next();
    if (tok.id !== TOKEN.in) {
      throw new Error(Errors.foreach);
    }

    tok = this.lexer.next();
    if (tok.id !== TOKEN.leftParen) {
      throw new Error(Errors.foreach);
    }

    const params = SimpleExprParser.parseParams(this.lexer);

    tok = this.lexer.next();
    if (tok.id !== TOKEN.do) {
      throw new Error(Errors.foreach);
    }

    const [tok1, body] = this.parseExprList();

    tok = tok1 || this.lexer.next();
    if (tok.id !== TOKEN.endfor) {
      throw new Error(Errors.foreach);
    }

    return [undefined, new ForeachDecl(identifier, params, body)];
  }
}
/*80--------------------------------------------------------------------------*/
