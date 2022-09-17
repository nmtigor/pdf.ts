/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

/* Copyright 2017 Mozilla Foundation
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

import {
  assertEquals,
  assertNotEquals,
  assertThrows,
} from "https://deno.land/std@0.154.0/testing/asserts.ts";
import { describe, it } from "https://deno.land/std@0.154.0/testing/bdd.ts";
import { PostScriptCompiler, PostScriptEvaluator } from "./function.ts";
import { PostScriptLexer, PostScriptParser } from "./ps_parser.ts";
import { StringStream } from "./stream.ts";
/*80--------------------------------------------------------------------------*/

describe("function", () => {
  describe("PostScriptParser", () => {
    function parse(program: string) {
      const stream = new StringStream(program);
      const parser = new PostScriptParser(new PostScriptLexer(stream));
      return parser.parse();
    }
    it("parses empty programs", () => {
      const output = parse("{}");
      assertEquals(output.length, 0);
    });
    it("parses positive numbers", () => {
      const number = 999;
      const program = parse("{ " + number + " }");
      const expectedProgram = [number];
      assertEquals(program, expectedProgram);
    });
    it("parses negative numbers", () => {
      const number = -999;
      const program = parse("{ " + number + " }");
      const expectedProgram = [number];
      assertEquals(program, expectedProgram);
    });
    it("parses negative floats", () => {
      const number = 3.3;
      const program = parse("{ " + number + " }");
      const expectedProgram = [number];
      assertEquals(program, expectedProgram);
    });
    it("parses operators", () => {
      const program = parse("{ sub }");
      const expectedProgram = ["sub"];
      assertEquals(program, expectedProgram);
    });
    it("parses if statements", () => {
      const program = parse("{ { 99 } if }");
      const expectedProgram = [3, "jz", 99];
      assertEquals(program, expectedProgram);
    });
    it("parses ifelse statements", () => {
      const program = parse("{ { 99 } { 44 } ifelse }");
      const expectedProgram = [5, "jz", 99, 6, "j", 44];
      assertEquals(program, expectedProgram);
    });
    it("handles missing brackets", () => {
      assertThrows(
        () => {
          parse("{");
        },
        Error,
        "Unexpected symbol: found undefined expected 1.",
      );
    });
    it("handles junk after the end", () => {
      const number = 3.3;
      const program = parse("{ " + number + " }#");
      const expectedProgram = [number];
      assertEquals(program, expectedProgram);
    });
  });

  describe("PostScriptEvaluator", () => {
    function evaluate(program: string) {
      const stream = new StringStream(program);
      const parser = new PostScriptParser(new PostScriptLexer(stream));
      const code = parser.parse();
      const evaluator = new PostScriptEvaluator(code);
      const output = evaluator.execute(undefined as any);
      return output;
    }

    it("pushes stack", () => {
      const stack = evaluate("{ 99 }");
      const expectedStack = [99];
      assertEquals(stack, expectedStack);
    });
    it("handles if with true", () => {
      const stack = evaluate("{ 1 {99} if }");
      const expectedStack = [99];
      assertEquals(stack, expectedStack);
    });
    it("handles if with false", () => {
      const stack = evaluate("{ 0 {99} if }");
      const expectedStack: (number | boolean)[] = [];
      assertEquals(stack, expectedStack);
    });
    it("handles ifelse with true", () => {
      const stack = evaluate("{ 1 {99} {77} ifelse }");
      const expectedStack = [99];
      assertEquals(stack, expectedStack);
    });
    it("handles ifelse with false", () => {
      const stack = evaluate("{ 0 {99} {77} ifelse }");
      const expectedStack = [77];
      assertEquals(stack, expectedStack);
    });
    it("handles nested if", () => {
      const stack = evaluate("{ 1 {1 {77} if} if }");
      const expectedStack = [77];
      assertEquals(stack, expectedStack);
    });

    it("abs", () => {
      const stack = evaluate("{ -2 abs }");
      const expectedStack = [2];
      assertEquals(stack, expectedStack);
    });
    it("adds", () => {
      const stack = evaluate("{ 1 2 add }");
      const expectedStack = [3];
      assertEquals(stack, expectedStack);
    });
    it("boolean and", () => {
      const stack = evaluate("{ true false and }");
      const expectedStack = [false];
      assertEquals(stack, expectedStack);
    });
    it("bitwise and", () => {
      const stack = evaluate("{ 254 1 and }");
      const expectedStack = [254 & 1];
      assertEquals(stack, expectedStack);
    });
    it("calculates the inverse tangent of a number", () => {
      const stack = evaluate("{ 90 atan }");
      const expectedStack = [Math.atan(90)];
      assertEquals(stack, expectedStack);
    });
    it("handles bitshifting ", () => {
      const stack = evaluate("{ 50 2 bitshift }");
      const expectedStack = [200];
      assertEquals(stack, expectedStack);
    });
    it("calculates the ceiling value", () => {
      const stack = evaluate("{ 9.9 ceiling }");
      const expectedStack = [10];
      assertEquals(stack, expectedStack);
    });
    it("copies", () => {
      const stack = evaluate("{ 99 98 2 copy }");
      const expectedStack = [99, 98, 99, 98];
      assertEquals(stack, expectedStack);
    });
    it("calculates the cosine of a number", () => {
      const stack = evaluate("{ 90 cos }");
      const expectedStack = [Math.cos(90)];
      assertEquals(stack, expectedStack);
    });
    it("converts to int", () => {
      const stack = evaluate("{ 9.9 cvi }");
      const expectedStack = [9];
      assertEquals(stack, expectedStack);
    });
    it("converts negatives to int", () => {
      const stack = evaluate("{ -9.9 cvi }");
      const expectedStack = [-9];
      assertEquals(stack, expectedStack);
    });
    it("converts to real", () => {
      const stack = evaluate("{ 55.34 cvr }");
      const expectedStack = [55.34];
      assertEquals(stack, expectedStack);
    });
    it("divides", () => {
      const stack = evaluate("{ 6 5 div }");
      const expectedStack = [1.2];
      assertEquals(stack, expectedStack);
    });
    it("maps division by zero to infinity", () => {
      const stack = evaluate("{ 6 0 div }");
      const expectedStack = [Infinity];
      assertEquals(stack, expectedStack);
    });
    it("duplicates", () => {
      const stack = evaluate("{ 99 dup }");
      const expectedStack = [99, 99];
      assertEquals(stack, expectedStack);
    });
    it("accepts an equality", () => {
      const stack = evaluate("{ 9 9 eq }");
      const expectedStack = [true];
      assertEquals(stack, expectedStack);
    });
    it("rejects an inequality", () => {
      const stack = evaluate("{ 9 8 eq }");
      const expectedStack = [false];
      assertEquals(stack, expectedStack);
    });
    it("exchanges", () => {
      const stack = evaluate("{ 44 99 exch }");
      const expectedStack = [99, 44];
      assertEquals(stack, expectedStack);
    });
    it("handles exponentiation", () => {
      const stack = evaluate("{ 10 2 exp }");
      const expectedStack = [100];
      assertEquals(stack, expectedStack);
    });
    it("pushes false onto the stack", () => {
      const stack = evaluate("{ false }");
      const expectedStack = [false];
      assertEquals(stack, expectedStack);
    });
    it("calculates the floor value", () => {
      const stack = evaluate("{ 9.9 floor }");
      const expectedStack = [9];
      assertEquals(stack, expectedStack);
    });
    it("handles greater than or equal to", () => {
      const stack = evaluate("{ 10 9 ge }");
      const expectedStack = [true];
      assertEquals(stack, expectedStack);
    });
    it("rejects less than for greater than or equal to", () => {
      const stack = evaluate("{ 8 9 ge }");
      const expectedStack = [false];
      assertEquals(stack, expectedStack);
    });
    it("handles greater than", () => {
      const stack = evaluate("{ 10 9 gt }");
      const expectedStack = [true];
      assertEquals(stack, expectedStack);
    });
    it("rejects less than or equal for greater than", () => {
      const stack = evaluate("{ 9 9 gt }");
      const expectedStack = [false];
      assertEquals(stack, expectedStack);
    });
    it("divides to integer", () => {
      const stack = evaluate("{ 2 3 idiv }");
      const expectedStack = [0];
      assertEquals(stack, expectedStack);
    });
    it("divides to negative integer", () => {
      const stack = evaluate("{ -2 3 idiv }");
      const expectedStack = [0];
      assertEquals(stack, expectedStack);
    });
    it("duplicates index", () => {
      const stack = evaluate("{ 4 3 2 1 2 index }");
      const expectedStack = [4, 3, 2, 1, 3];
      assertEquals(stack, expectedStack);
    });
    it("handles less than or equal to", () => {
      const stack = evaluate("{ 9 10 le }");
      const expectedStack = [true];
      assertEquals(stack, expectedStack);
    });
    it("rejects greater than for less than or equal to", () => {
      const stack = evaluate("{ 10 9 le }");
      const expectedStack = [false];
      assertEquals(stack, expectedStack);
    });
    it("calculates the natural logarithm", () => {
      const stack = evaluate("{ 10 ln }");
      const expectedStack = [Math.log(10)];
      assertEquals(stack, expectedStack);
    });
    it("calculates the base 10 logarithm", () => {
      const stack = evaluate("{ 100 log }");
      const expectedStack = [2];
      assertEquals(stack, expectedStack);
    });
    it("handles less than", () => {
      const stack = evaluate("{ 9 10 lt }");
      const expectedStack = [true];
      assertEquals(stack, expectedStack);
    });
    it("rejects greater than or equal to for less than", () => {
      const stack = evaluate("{ 10 9 lt }");
      const expectedStack = [false];
      assertEquals(stack, expectedStack);
    });
    it("performs the modulo operation", () => {
      const stack = evaluate("{ 4 3 mod }");
      const expectedStack = [1];
      assertEquals(stack, expectedStack);
    });
    it("multiplies two numbers (positive result)", () => {
      const stack = evaluate("{ 9 8 mul }");
      const expectedStack = [72];
      assertEquals(stack, expectedStack);
    });
    it("multiplies two numbers (negative result)", () => {
      const stack = evaluate("{ 9 -8 mul }");
      const expectedStack = [-72];
      assertEquals(stack, expectedStack);
    });
    it("accepts an inequality", () => {
      const stack = evaluate("{ 9 8 ne }");
      const expectedStack = [true];
      assertEquals(stack, expectedStack);
    });
    it("rejects an equality", () => {
      const stack = evaluate("{ 9 9 ne }");
      const expectedStack = [false];
      assertEquals(stack, expectedStack);
    });
    it("negates", () => {
      const stack = evaluate("{ 4.5 neg }");
      const expectedStack = [-4.5];
      assertEquals(stack, expectedStack);
    });
    it("boolean not", () => {
      const stack = evaluate("{ true not }");
      const expectedStack = [false];
      assertEquals(stack, expectedStack);
    });
    it("bitwise not", () => {
      const stack = evaluate("{ 12 not }");
      const expectedStack = [-13];
      assertEquals(stack, expectedStack);
    });
    it("boolean or", () => {
      const stack = evaluate("{ true false or }");
      const expectedStack = [true];
      assertEquals(stack, expectedStack);
    });
    it("bitwise or", () => {
      const stack = evaluate("{ 254 1 or }");
      const expectedStack = [254 | 1];
      assertEquals(stack, expectedStack);
    });
    it("pops stack", () => {
      const stack = evaluate("{ 1 2 pop }");
      const expectedStack = [1];
      assertEquals(stack, expectedStack);
    });
    it("rolls stack right", () => {
      const stack = evaluate("{ 1 3 2 2 4 1 roll }");
      const expectedStack = [2, 1, 3, 2];
      assertEquals(stack, expectedStack);
    });
    it("rolls stack left", () => {
      const stack = evaluate("{ 1 3 2 2 4 -1 roll }");
      const expectedStack = [3, 2, 2, 1];
      assertEquals(stack, expectedStack);
    });
    it("rounds a number", () => {
      const stack = evaluate("{ 9.52 round }");
      const expectedStack = [10];
      assertEquals(stack, expectedStack);
    });
    it("calculates the sine of a number", () => {
      const stack = evaluate("{ 90 sin }");
      const expectedStack = [Math.sin(90)];
      assertEquals(stack, expectedStack);
    });
    it("calculates a square root (integer)", () => {
      const stack = evaluate("{ 100 sqrt }");
      const expectedStack = [10];
      assertEquals(stack, expectedStack);
    });
    it("calculates a square root (float)", () => {
      const stack = evaluate("{ 99 sqrt }");
      const expectedStack = [Math.sqrt(99)];
      assertEquals(stack, expectedStack);
    });
    it("subtracts (positive result)", () => {
      const stack = evaluate("{ 6 4 sub }");
      const expectedStack = [2];
      assertEquals(stack, expectedStack);
    });
    it("subtracts (negative result)", () => {
      const stack = evaluate("{ 4 6 sub }");
      const expectedStack = [-2];
      assertEquals(stack, expectedStack);
    });
    it("pushes true onto the stack", () => {
      const stack = evaluate("{ true }");
      const expectedStack = [true];
      assertEquals(stack, expectedStack);
    });
    it("truncates a number", () => {
      const stack = evaluate("{ 35.004 truncate }");
      const expectedStack = [35];
      assertEquals(stack, expectedStack);
    });
    it("calculates an exclusive or value", () => {
      const stack = evaluate("{ 3 9 xor }");
      const expectedStack = [10];
      assertEquals(stack, expectedStack);
    });
  });

  describe("PostScriptCompiler", () => {
    function check(
      code: (number | string)[],
      domain: number[],
      range: number[],
      samples: [{ input: number[]; output: number[] }] | undefined,
    ) {
      const compiler = new PostScriptCompiler();
      const compiledCode = compiler.compile(code, domain, range);
      if (samples === undefined) {
        assertEquals(compiledCode, null);
      } else {
        assertNotEquals(compiledCode, null);
        // eslint-disable-next-line no-new-func
        const fn = new Function(
          "src",
          "srcOffset",
          "dest",
          "destOffset",
          compiledCode!,
        );
        for (const { input, output } of samples) {
          const out = new Float32Array(output.length);
          fn(input, 0, out, 0);
          assertEquals(Array.prototype.slice.call(out, 0), output);
        }
      }
    }

    it("check compiled add", () => {
      check([0.25, 0.5, "add"], [], [0, 1], [{ input: [], output: [0.75] }]);
      check([0, "add"], [0, 1], [0, 1], [{ input: [0.25], output: [0.25] }]);
      check([0.5, "add"], [0, 1], [0, 1], [{ input: [0.25], output: [0.75] }]);
      check(
        [0, "exch", "add"],
        [0, 1],
        [0, 1],
        [{ input: [0.25], output: [0.25] }],
      );
      check(
        [0.5, "exch", "add"],
        [0, 1],
        [0, 1],
        [{ input: [0.25], output: [0.75] }],
      );
      check(
        ["add"],
        [0, 1, 0, 1],
        [0, 1],
        [{ input: [0.25, 0.5], output: [0.75] }],
      );
      check(["add"], [0, 1], [0, 1], undefined);
    });
    it("check compiled sub", () => {
      check([0.5, 0.25, "sub"], [], [0, 1], [{ input: [], output: [0.25] }]);
      check([0, "sub"], [0, 1], [0, 1], [{ input: [0.25], output: [0.25] }]);
      check([0.5, "sub"], [0, 1], [0, 1], [{ input: [0.75], output: [0.25] }]);
      check(
        [0, "exch", "sub"],
        [0, 1],
        [-1, 1],
        [{ input: [0.25], output: [-0.25] }],
      );
      check(
        [0.75, "exch", "sub"],
        [0, 1],
        [-1, 1],
        [{ input: [0.25], output: [0.5] }],
      );
      check(
        ["sub"],
        [0, 1, 0, 1],
        [-1, 1],
        [{ input: [0.25, 0.5], output: [-0.25] }],
      );
      check(["sub"], [0, 1], [0, 1], undefined);

      check(
        [1, "dup", 3, 2, "roll", "sub", "sub"],
        [0, 1],
        [0, 1],
        [{ input: [0.75], output: [0.75] }],
      );
    });
    it("check compiled mul", () => {
      check([0.25, 0.5, "mul"], [], [0, 1], [{ input: [], output: [0.125] }]);
      check([0, "mul"], [0, 1], [0, 1], [{ input: [0.25], output: [0] }]);
      check([0.5, "mul"], [0, 1], [0, 1], [{ input: [0.25], output: [0.125] }]);
      check([1, "mul"], [0, 1], [0, 1], [{ input: [0.25], output: [0.25] }]);
      check(
        [0, "exch", "mul"],
        [0, 1],
        [0, 1],
        [{ input: [0.25], output: [0] }],
      );
      check(
        [0.5, "exch", "mul"],
        [0, 1],
        [0, 1],
        [{ input: [0.25], output: [0.125] }],
      );
      check(
        [1, "exch", "mul"],
        [0, 1],
        [0, 1],
        [{ input: [0.25], output: [0.25] }],
      );
      check(
        ["mul"],
        [0, 1, 0, 1],
        [0, 1],
        [{ input: [0.25, 0.5], output: [0.125] }],
      );
      check(["mul"], [0, 1], [0, 1], undefined);
    });
    it("check compiled max", () => {
      check(
        ["dup", 0.75, "gt", 7, "jz", "pop", 0.75],
        [0, 1],
        [0, 1],
        [{ input: [0.5], output: [0.5] }],
      );
      check(
        ["dup", 0.75, "gt", 7, "jz", "pop", 0.75],
        [0, 1],
        [0, 1],
        [{ input: [1], output: [0.75] }],
      );
      check(
        ["dup", 0.75, "gt", 5, "jz", "pop", 0.75],
        [0, 1],
        [0, 1],
        undefined,
      );
    });
    it("check pop/roll/index", () => {
      check([1, "pop"], [0, 1], [0, 1], [{ input: [0.5], output: [0.5] }]);
      check(
        [1, 3, -1, "roll"],
        [0, 1, 0, 1],
        [0, 1, 0, 1, 0, 1],
        [{ input: [0.25, 0.5], output: [0.5, 1, 0.25] }],
      );
      check(
        [1, 3, 1, "roll"],
        [0, 1, 0, 1],
        [0, 1, 0, 1, 0, 1],
        [{ input: [0.25, 0.5], output: [1, 0.25, 0.5] }],
      );
      check([1, 3, 1.5, "roll"], [0, 1, 0, 1], [0, 1, 0, 1, 0, 1], undefined);
      check(
        [1, 1, "index"],
        [0, 1],
        [0, 1, 0, 1, 0, 1],
        [{ input: [0.5], output: [0.5, 1, 0.5] }],
      );
      check([1, 3, "index", "pop"], [0, 1], [0, 1], undefined);
      check([1, 0.5, "index", "pop"], [0, 1], [0, 1], undefined);
    });
    it("check input boundaries", () => {
      check([], [0, 0.5], [0, 1], [{ input: [1], output: [0.5] }]);
      check([], [0.5, 1], [0, 1], [{ input: [0], output: [0.5] }]);
      check(
        ["dup"],
        [0.5, 0.75],
        [0, 1, 0, 1],
        [{ input: [0], output: [0.5, 0.5] }],
      );
      check([], [100, 1001], [0, 10000], [{ input: [1000], output: [1000] }]);
    });
    it("check output boundaries", () => {
      check([], [0, 1], [0, 0.5], [{ input: [1], output: [0.5] }]);
      check([], [0, 1], [0.5, 1], [{ input: [0], output: [0.5] }]);
      check(
        ["dup"],
        [0, 1],
        [0.5, 1, 0.75, 1],
        [{ input: [0], output: [0.5, 0.75] }],
      );
      check([], [0, 10000], [100, 1001], [{ input: [1000], output: [1000] }]);
    });
    it("compile optimized", () => {
      const compiler = new PostScriptCompiler();
      const code = [0, "add", 1, 1, 3, -1, "roll", "sub", "sub", 1, "mul"];
      const compiledCode = compiler.compile(code, [0, 1], [0, 1]);
      assertEquals(
        compiledCode,
        "dest[destOffset + 0] = Math.max(0, Math.min(1, src[srcOffset + 0]));",
      );
    });
  });
});
/*80--------------------------------------------------------------------------*/
