/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

/* Copyright 2020 Mozilla Foundation
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

import { assert, assertEquals, assertThrows } from "@std/testing/asserts.ts";
import { describe, it } from "@std/testing/bdd.ts";
import { Lexer, TOKEN, Token } from "./formcalc_lexer.ts";
import { Errors, Parser } from "./formcalc_parser.ts";
/*80--------------------------------------------------------------------------*/

describe("FormCalc expression parser", () => {
  const EOF = new Token(TOKEN.eof);

  describe("FormCalc lexer", () => {
    it("should lex numbers", () => {
      const lexer = new Lexer(
        "1 7 12 1.2345 .7 .12345 1e-2 1.2E+3 1e2 1.2E3 nan 12. 2.e3 infinity 99999999999999999 123456789.012345678 9e99999",
      );
      assertEquals(lexer.next(), new Token(TOKEN.number, 1));
      assertEquals(lexer.next(), new Token(TOKEN.number, 7));
      assertEquals(lexer.next(), new Token(TOKEN.number, 12));
      assertEquals(lexer.next(), new Token(TOKEN.number, 1.2345));
      assertEquals(lexer.next(), new Token(TOKEN.number, 0.7));
      assertEquals(lexer.next(), new Token(TOKEN.number, 0.12345));
      assertEquals(lexer.next(), new Token(TOKEN.number, 1e-2));
      assertEquals(lexer.next(), new Token(TOKEN.number, 1.2e3));
      assertEquals(lexer.next(), new Token(TOKEN.number, 1e2));
      assertEquals(lexer.next(), new Token(TOKEN.number, 1.2e3));
      assertEquals(lexer.next(), new Token(TOKEN.number, NaN));
      assertEquals(lexer.next(), new Token(TOKEN.number, 12));
      assertEquals(lexer.next(), new Token(TOKEN.number, 2e3));
      assertEquals(lexer.next(), new Token(TOKEN.number, Infinity));
      assertEquals(lexer.next(), new Token(TOKEN.number, 100000000000000000));
      assertEquals(lexer.next(), new Token(TOKEN.number, 123456789.01234567));
      assertEquals(lexer.next(), new Token(TOKEN.number, Infinity));
      assertEquals(lexer.next(), EOF);
    });

    it("should lex strings", () => {
      const lexer = new Lexer(
        `"hello world" "hello ""world" "hello ""world"" ""world""""hello""" "hello \\uabcdeh \\Uabcd \\u00000123abc" "a \\a \\ub \\Uc \\b"`,
      );
      assertEquals(lexer.next(), new Token(TOKEN.string, `hello world`));
      assertEquals(lexer.next(), new Token(TOKEN.string, `hello "world`));
      assertEquals(
        lexer.next(),
        new Token(TOKEN.string, `hello "world" "world""hello"`),
      );
      assertEquals(
        lexer.next(),
        new Token(TOKEN.string, `hello \uabcdeh \uabcd \u0123abc`),
      );
      assertEquals(
        lexer.next(),
        new Token(TOKEN.string, `a \\a \\ub \\Uc \\b`),
      );
      assertEquals(lexer.next(), EOF);
    });

    it("should lex operators", () => {
      const lexer = new Lexer("( , ) <= <> = == >= < > / * . .* .# [ ] & |");
      assertEquals(lexer.next(), new Token(TOKEN.leftParen));
      assertEquals(lexer.next(), new Token(TOKEN.comma));
      assertEquals(lexer.next(), new Token(TOKEN.rightParen));
      assertEquals(lexer.next(), new Token(TOKEN.le));
      assertEquals(lexer.next(), new Token(TOKEN.ne));
      assertEquals(lexer.next(), new Token(TOKEN.assign));
      assertEquals(lexer.next(), new Token(TOKEN.eq));
      assertEquals(lexer.next(), new Token(TOKEN.ge));
      assertEquals(lexer.next(), new Token(TOKEN.lt));
      assertEquals(lexer.next(), new Token(TOKEN.gt));
      assertEquals(lexer.next(), new Token(TOKEN.divide));
      assertEquals(lexer.next(), new Token(TOKEN.times));
      assertEquals(lexer.next(), new Token(TOKEN.dot));
      assertEquals(lexer.next(), new Token(TOKEN.dotStar));
      assertEquals(lexer.next(), new Token(TOKEN.dotHash));
      assertEquals(lexer.next(), new Token(TOKEN.leftBracket));
      assertEquals(lexer.next(), new Token(TOKEN.rightBracket));
      assertEquals(lexer.next(), new Token(TOKEN.and));
      assertEquals(lexer.next(), new Token(TOKEN.or));
      assertEquals(lexer.next(), EOF);
    });

    it("should skip comments", () => {
      const lexer = new Lexer(`
  
  \t\t  1 \r\n\r\n
  
  ;  blah blah blah
  
  2
  
  // blah blah blah blah blah
  
  
  3
      `);
      assertEquals(lexer.next(), new Token(TOKEN.number, 1));
      assertEquals(lexer.next(), new Token(TOKEN.number, 2));
      assertEquals(lexer.next(), new Token(TOKEN.number, 3));
      assertEquals(lexer.next(), EOF);
    });

    it("should lex identifiers", () => {
      const lexer = new Lexer(
        "eq for fore while continue hello こんにちは世界 $!hello今日は12今日は",
      );
      assertEquals(lexer.next(), new Token(TOKEN.eq));
      assertEquals(lexer.next(), new Token(TOKEN.for));
      assertEquals(lexer.next(), new Token(TOKEN.identifier, "fore"));
      assertEquals(lexer.next(), new Token(TOKEN.while));
      assertEquals(lexer.next(), new Token(TOKEN.continue));
      assertEquals(lexer.next(), new Token(TOKEN.identifier, "hello"));
      assertEquals(lexer.next(), new Token(TOKEN.identifier, "こんにちは世界"));
      assertEquals(lexer.next(), new Token(TOKEN.identifier, "$"));
      assertEquals(
        lexer.next(),
        new Token(TOKEN.identifier, "!hello今日は12今日は"),
      );
      assertEquals(lexer.next(), EOF);
    });
  });

  describe("FormCalc parser", () => {
    it("should parse basic arithmetic expression", () => {
      const parser = new Parser("1 + 2 * 3");
      assertEquals(parser.parse().dump()[0], 7);
    });

    it("should parse basic arithmetic expression with the same operator", () => {
      const parser = new Parser("1 + a + 3");
      assertEquals(parser.parse().dump()[0], {
        operator: "+",
        left: {
          operator: "+",
          left: 1,
          right: { id: "a" },
        },
        right: 3,
      });
    });

    it("should parse expressions with unary operators", () => {
      const parser = new Parser(`
  s = +x + 1
  t = -+u * 2
  t = +-u * 2
  u = -foo()
      `);
      assertEquals(parser.parse().dump(), [
        {
          assignment: "s",
          expr: {
            operator: "+",
            left: { operator: "+", arg: { id: "x" } },
            right: 1,
          },
        },
        {
          assignment: "t",
          expr: {
            operator: "*",
            left: {
              operator: "-",
              arg: {
                operator: "+",
                arg: { id: "u" },
              },
            },
            right: 2,
          },
        },
        {
          assignment: "t",
          expr: {
            operator: "*",
            left: {
              operator: "+",
              arg: {
                operator: "-",
                arg: { id: "u" },
              },
            },
            right: 2,
          },
        },
        {
          assignment: "u",
          expr: {
            operator: "-",
            arg: {
              callee: { id: "foo" },
              params: [],
            },
          },
        },
      ]);
    });

    it("should parse basic expression with a string", () => {
      const parser = new Parser(`(5 - "abc") * 3`);
      assertEquals(parser.parse().dump()[0], 15);
    });

    it("should parse basic expression with a calls", () => {
      const parser = new Parser(`foo(2, 3, a & b) or c * d + 1.234 / e`);
      assertEquals(parser.parse().dump()[0], {
        operator: "||",
        left: {
          callee: { id: "foo" },
          params: [
            2,
            3,
            {
              operator: "&&",
              left: { id: "a" },
              right: { id: "b" },
            },
          ],
        },
        right: {
          operator: "+",
          left: {
            operator: "*",
            left: { id: "c" },
            right: { id: "d" },
          },
          right: {
            operator: "/",
            left: 1.234,
            right: { id: "e" },
          },
        },
      });
    });

    it("should parse basic expression with a subscript", () => {
      let parser = new Parser(`こんにちは世界[-0]`);
      let dump: any = parser.parse().dump()[0];
      assertEquals(dump, {
        operand: { id: "こんにちは世界" },
        index: -0,
      });
      assert(Object.is(-0, dump.index));

      parser = new Parser(`こんにちは世界[+0]`);
      dump = parser.parse().dump()[0];
      assertEquals(dump, {
        operand: { id: "こんにちは世界" },
        index: +0,
      });
      assert(Object.is(+0, dump.index));

      parser = new Parser(`こんにちは世界[*]`);
      assertEquals(parser.parse().dump()[0], {
        operand: { id: "こんにちは世界" },
        index: { special: "*" },
      });
    });

    it("should parse basic expression with dots", () => {
      const parser = new Parser("a.b.c.#d..e.f..g.*");
      const exprlist = parser.parse();
      assertEquals(exprlist.expressions[0].isDotExpression(), true);
      assertEquals(exprlist.dump()[0], {
        operator: ".",
        left: { id: "a" },
        right: {
          operator: ".",
          left: { id: "b" },
          right: {
            operator: ".#",
            left: { id: "c" },
            right: {
              operator: "..",
              left: { id: "d" },
              right: {
                operator: ".",
                left: { id: "e" },
                right: {
                  operator: "..",
                  left: { id: "f" },
                  right: {
                    operator: ".",
                    left: { id: "g" },
                    right: { special: "*" },
                  },
                },
              },
            },
          },
        },
      });
    });

    it("should parse var declaration with error", () => {
      let parser = new Parser("var 123 = a");
      assertThrows(() => parser.parse(), Error, Errors.var);

      parser = new Parser(`var "123" = a`);
      assertThrows(() => parser.parse(), Error, Errors.var);

      parser = new Parser(`var for var a`);
      assertThrows(() => parser.parse(), Error, Errors.var);
    });

    it("should parse for declaration with a step", () => {
      const parser = new Parser(`
  var s = 0
  for var i = 1 upto 10 + x step 1 do
  s = s + i * 2
  endfor`);
      assertEquals(
        parser.parse().dump(),
        [
          {
            var: "s",
            expr: 0,
          },
          {
            decl: "for",
            assignment: {
              var: "i",
              expr: 1,
            },
            type: "upto",
            end: {
              operator: "+",
              left: 10,
              right: { id: "x" },
            },
            step: 1,
            body: [
              {
                assignment: "s",
                expr: {
                  operator: "+",
                  left: { id: "s" },
                  right: {
                    operator: "*",
                    left: { id: "i" },
                    right: 2,
                  },
                },
              },
            ],
          },
        ],
      );
    });

    it("should parse for declaration without a step", () => {
      const parser = new Parser(`
  for i = 1 + 2 downto 10 do
  s = foo()
  endfor`);
      assertEquals(
        parser.parse().dump(),
        [
          {
            decl: "for",
            assignment: {
              assignment: "i",
              expr: 3,
            },
            type: "downto",
            end: 10,
            step: undefined,
            body: [
              {
                assignment: "s",
                expr: {
                  callee: { id: "foo" },
                  params: [],
                },
              },
            ],
          },
        ],
      );
    });

    it("should parse for declaration with error", () => {
      let parser = new Parser("for 123 = i upto 1 do a = 1 endfor");
      assertThrows(() => parser.parse(), Error, Errors.assignment);

      parser = new Parser("for var 123 = i upto 1 do a = 1 endfor");
      assertThrows(() => parser.parse(), Error, Errors.assignment);

      parser = new Parser("for var i = 123 upt 1 do a = 1 endfor");
      assertThrows(() => parser.parse(), Error, Errors.for);

      parser = new Parser("for var i = 123 var 1 do a = 1 endfor");
      assertThrows(() => parser.parse(), Error, Errors.for);

      parser = new Parser(
        "for var i = 123 upto 1 step for var j = 1 do endfor do a = 1 endfor",
      );
      assertThrows(() => parser.parse(), Error, Errors.for);

      parser = new Parser("for var i = 123 downto 1 do a = 1 endfunc");
      assertThrows(() => parser.parse(), Error, Errors.for);

      parser = new Parser("for var i = 123 downto 1 do a = 1");
      assertThrows(() => parser.parse(), Error, Errors.for);
    });

    it("should parse foreach declaration", () => {
      const parser = new Parser(`
  foreach i in (a, b, c, d) do
  s = foo()[i]
  endfor`);
      assertEquals(
        parser.parse().dump(),
        [
          {
            decl: "foreach",
            id: "i",
            params: [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }],
            body: [
              {
                assignment: "s",
                expr: {
                  operand: {
                    callee: { id: "foo" },
                    params: [],
                  },
                  index: { id: "i" },
                },
              },
            ],
          },
        ],
      );
    });

    it("should parse foreach declaration with error", () => {
      let parser = new Parser("foreach 123 in (1, 2, 3) do a = 1 endfor");
      assertThrows(() => parser.parse(), Error, Errors.foreach);

      parser = new Parser("foreach foo in 1, 2, 3) do a = 1 endfor");
      assertThrows(() => parser.parse(), Error, Errors.foreach);

      parser = new Parser("foreach foo in (1, 2, 3 do a = 1 endfor");
      assertThrows(() => parser.parse(), Error, Errors.params);

      parser = new Parser("foreach foo in (1, 2 3) do a = 1 endfor");
      assertThrows(() => parser.parse(), Error, Errors.params);

      parser = new Parser("foreach foo in (1, 2, 3) od a = 1 endfor");
      assertThrows(() => parser.parse(), Error, Errors.foreach);

      parser = new Parser("foreach foo in (1, 2, 3) do a = 1 endforeach");
      assertThrows(() => parser.parse(), Error, Errors.foreach);

      parser = new Parser("foreach foo in (1, 2, 3) do a = 1  123");
      assertThrows(() => parser.parse(), Error, Errors.foreach);
    });

    it("should parse while declaration", () => {
      const parser = new Parser(`
  while (1) do
  if (0) then
    break
  else
    continue
  endif
  endwhile
      `);
      assertEquals(
        parser.parse().dump(),
        [
          {
            decl: "while",
            condition: 1,
            body: [
              {
                decl: "if",
                condition: 0,
                then: [{ special: "break" }],
                elseif: undefined,
                else: [{ special: "continue" }],
              },
            ],
          },
        ],
      );
    });

    it("should parse while declaration with error", () => {
      let parser = new Parser("while a == 1 do a = 2 endwhile");
      assertThrows(() => parser.parse(), Error, Errors.while);

      parser = new Parser("while (a == 1 do a = 2 endwhile");
      assertThrows(() => parser.parse(), Error, Errors.while);

      parser = new Parser("while (a == 1) var a = 2 endwhile");
      assertThrows(() => parser.parse(), Error, Errors.while);

      parser = new Parser("while (a == 1) do var a = 2 end");
      assertThrows(() => parser.parse(), Error, Errors.while);
    });

    it("should parse do declaration", () => {
      const parser = new Parser(`
  do
  x = 1
  ; a comment in the middle of the block
  y = 2
  end
    `);
      assertEquals(
        parser.parse().dump(),
        [
          {
            decl: "block",
            body: [
              {
                assignment: "x",
                expr: 1,
              },
              {
                assignment: "y",
                expr: 2,
              },
            ],
          },
        ],
      );
    });

    it("should parse do declaration with error", () => {
      const parser = new Parser(`
  do
  x = 1
  y = 2
  endfunc
      `);
      assertThrows(() => parser.parse(), Error, Errors.block);
    });

    it("should parse func declaration", () => {
      const parser = new Parser(`
  func こんにちは世界123(a, b) do
  a + b
  endfunc
      `);
      assertEquals(
        parser.parse().dump(),
        [
          {
            func: "こんにちは世界123",
            params: ["a", "b"],
            body: [
              {
                operator: "+",
                left: { id: "a" },
                right: { id: "b" },
              },
            ],
          },
        ],
      );
    });

    it("should parse func declaration with error", () => {
      let parser = new Parser("func 123(a, b) do a = 1 endfunc");
      assertThrows(() => parser.parse(), Error, Errors.func);

      parser = new Parser("func foo(a, b) for a = 1 endfunc");
      assertThrows(() => parser.parse(), Error, Errors.func);

      parser = new Parser("func foo(a, b) do a = 1 endfun");
      assertThrows(() => parser.parse(), Error, Errors.func);

      parser = new Parser("func foo(a, b, c do a = 1 endfunc");
      assertThrows(() => parser.parse(), Error, Errors.func);

      parser = new Parser("func foo(a, b, 123) do a = 1 endfunc");
      assertThrows(() => parser.parse(), Error, Errors.func);
    });

    it("should parse if declaration", () => {
      const parser = new Parser(`
  if (a & b) then
    var s = 1
  endif
  
  if (a or b) then
    var s = 1
  else
    var x = 2
  endif
  
  if (0) then
    s = 1
  elseif (1) then
    s = 2
  elseif (2) then
    s = 3
  elseif (3) then
    s = 4
  else
    s = 5
  endif
  
  // a comment
  
  if (0) then
    s = 1
  elseif (1) then
    s = 2
  endif
      `);
      assertEquals(
        parser.parse().dump(),
        [
          {
            decl: "if",
            condition: {
              operator: "&&",
              left: { id: "a" },
              right: { id: "b" },
            },
            then: [
              {
                var: "s",
                expr: 1,
              },
            ],
            elseif: undefined,
            else: undefined,
          },
          {
            decl: "if",
            condition: {
              operator: "||",
              left: { id: "a" },
              right: { id: "b" },
            },
            then: [
              {
                var: "s",
                expr: 1,
              },
            ],
            elseif: undefined,
            else: [
              {
                var: "x",
                expr: 2,
              },
            ],
          },
          {
            decl: "if",
            condition: 0,
            then: [
              {
                assignment: "s",
                expr: 1,
              },
            ],
            elseif: [
              {
                decl: "elseif",
                condition: 1,
                then: [
                  {
                    assignment: "s",
                    expr: 2,
                  },
                ],
              },
              {
                decl: "elseif",
                condition: 2,
                then: [
                  {
                    assignment: "s",
                    expr: 3,
                  },
                ],
              },
              {
                decl: "elseif",
                condition: 3,
                then: [
                  {
                    assignment: "s",
                    expr: 4,
                  },
                ],
              },
            ],
            else: [
              {
                assignment: "s",
                expr: 5,
              },
            ],
          },
          {
            decl: "if",
            condition: 0,
            then: [
              {
                assignment: "s",
                expr: 1,
              },
            ],
            elseif: [
              {
                decl: "elseif",
                condition: 1,
                then: [
                  {
                    assignment: "s",
                    expr: 2,
                  },
                ],
              },
            ],
            else: undefined,
          },
        ],
      );
    });

    it("should parse if declaration with error", () => {
      let parser = new Parser("if foo == 1 then a = 1 endif");
      assertThrows(() => parser.parse(), Error, Errors.if);

      parser = new Parser("if (foo == 1 then a = 1 endif");
      assertThrows(() => parser.parse(), Error, Errors.if);

      parser = new Parser(
        "if (foo == 1) then a = 1 elseiff (foo == 2) then a = 2 endif",
      );
      assertThrows(() => parser.parse(), Error, Errors.if);

      parser = new Parser(
        "if (foo == 1) then a = 1 elseif (foo == 2) then a = 2 end",
      );
      assertThrows(() => parser.parse(), Error, Errors.if);
    });

    it("should parse som predicate", () => {
      const parser = new Parser("a.b <= 3");
      const expr = parser.parse().expressions[0];
      assertEquals(expr.isSomPredicate(), true);
      assertEquals((expr as any).left.isSomPredicate(), true);
    });
  });
});
/*80--------------------------------------------------------------------------*/
