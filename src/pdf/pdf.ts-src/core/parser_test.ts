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
  assert,
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.190.0/testing/asserts.ts";
import { describe, it } from "https://deno.land/std@0.190.0/testing/bdd.ts";
import { FormatError } from "../shared/util.ts";
import { Lexer, Linearization, Parser } from "./parser.ts";
import { Cmd, EOF, Name } from "./primitives.ts";
import { StringStream } from "./stream.ts";
/*80--------------------------------------------------------------------------*/

describe("parser", () => {
  describe("Parser", () => {
    describe("inlineStreamSkipEI", () => {
      it("should skip over the EI marker if it is found", () => {
        const string = "q 1 0 0 1 0 0 cm BI /W 10 /H 10 /BPC 1 " +
          "/F /A85 ID abc123~> EI Q";
        const input = new StringStream(string);
        const parser = new Parser({
          lexer: new Lexer(input),
          xref: undefined,
          allowStreams: true,
        });

        parser.inlineStreamSkipEI(input);
        assertEquals(input.pos, string.indexOf("Q"));
        assertEquals(input.peekByte(), 0x51); // 'Q'
      });

      it("should skip to the end of stream if the EI marker is not found", () => {
        const string =
          "q 1 0 0 1 0 0 cm BI /W 10 /H 10 /BPC 1 /F /A85 ID abc123~> Q";
        const input = new StringStream(string);
        const parser = new Parser({
          lexer: new Lexer(input),
          xref: undefined,
          allowStreams: true,
        });

        parser.inlineStreamSkipEI(input);
        assertEquals(input.pos, string.length);
        assertEquals(input.peekByte(), -1);
      });
    });
  });

  describe("Lexer", () => {
    describe("nextChar", () => {
      it("should return and set -1 when the end of the stream is reached", () => {
        const input = new StringStream("");
        const lexer = new Lexer(input);
        assertEquals(lexer.nextChar(), -1);
        assertEquals(lexer.currentChar, -1);
      });

      it("should return and set the character after the current position", () => {
        const input = new StringStream("123");
        const lexer = new Lexer(input);
        assertEquals(lexer.nextChar(), 0x32); // '2'
        assertEquals(lexer.currentChar, 0x32); // '2'
      });
    });

    describe("peekChar", () => {
      it("should only return -1 when the end of the stream is reached", () => {
        const input = new StringStream("");
        const lexer = new Lexer(input);
        assertEquals(lexer.peekChar(), -1);
        assertEquals(lexer.currentChar, -1);
      });

      it("should only return the character after the current position", () => {
        const input = new StringStream("123");
        const lexer = new Lexer(input);
        assertEquals(lexer.peekChar(), 0x32); // '2'
        assertEquals(lexer.currentChar, 0x31); // '1'
      });
    });

    describe("getNumber", () => {
      it("should stop parsing numbers at the end of stream", () => {
        const input = new StringStream("11.234");
        const lexer = new Lexer(input);
        assertEquals(lexer.getNumber(), 11.234);
      });

      it("should parse PostScript numbers", () => {
        const numbers = [
          "-.002",
          "34.5",
          "-3.62",
          "123.6e10",
          "1E-5",
          "-1.",
          "0.0",
          "123",
          "-98",
          "43445",
          "0",
          "+17",
        ];
        for (const number of numbers) {
          const input = new StringStream(number);
          const lexer = new Lexer(input);

          const result = lexer.getNumber(),
            expected = parseFloat(number);

          if (result !== expected && Math.abs(result - expected) < 1e-15) {
            console.error(
              `Fuzzy matching "${result}" with "${expected}" to ` +
                "work-around rounding bugs in Chromium browsers.",
            );

            // expect(true).toEqual(true);
            continue;
          }
          assertEquals(result, expected);
        }
      });

      it("should ignore double negative before number", () => {
        const input = new StringStream("--205.88");
        const lexer = new Lexer(input);
        assertEquals(lexer.getNumber(), -205.88);
      });

      it("should ignore minus signs in the middle of number", () => {
        const input = new StringStream("205--.88");
        const lexer = new Lexer(input);
        assertEquals(lexer.getNumber(), 205.88);
      });

      it("should ignore line-breaks between operator and digit in number", () => {
        const minusInput = new StringStream("-\r\n205.88");
        const minusLexer = new Lexer(minusInput);
        assertEquals(minusLexer.getNumber(), -205.88);

        const plusInput = new StringStream("+\r\n205.88");
        const plusLexer = new Lexer(plusInput);
        assertEquals(plusLexer.getNumber(), 205.88);
      });

      it("should treat a single decimal point, or minus/plus sign, as zero", () => {
        const validNums = [".", "-", "+", "-.", "+.", "-\r\n.", "+\r\n."];
        for (const number of validNums) {
          const validInput = new StringStream(number);
          const validLexer = new Lexer(validInput);

          assertEquals(validLexer.getNumber(), 0);
        }

        const invalidNums = ["..", ".-", ".+"];
        for (const number of invalidNums) {
          const invalidInput = new StringStream(number);
          const invalidLexer = new Lexer(invalidInput);

          assertThrows(
            () => invalidLexer.getNumber(),
            FormatError,
            "Invalid number:",
          );
        }
      });

      it("should handle glued numbers and operators", () => {
        const input = new StringStream("123ET");
        const lexer = new Lexer(input);
        assertEquals(lexer.getNumber(), 123);
        // The lexer must not have consumed the 'E'
        assertEquals(lexer.currentChar, 0x45); // 'E'
      });
    });

    describe("getString", () => {
      it("should stop parsing strings at the end of stream", () => {
        const input = new StringStream("(1$4)");
        input.getByte = function (super_getByte: () => number) {
          // Simulating end of file using null (see issue 2766).
          const ch = super_getByte.call(input);
          return ch === 0x24 /* '$' */ ? -1 : ch;
        }.bind(input, input.getByte);
        const lexer = new Lexer(input);
        assertEquals(lexer.getString(), "1");
      });

      it("should ignore escaped CR and LF", () => {
        // '(\101\<CR><LF>\102)' should be parsed as 'AB'.
        const input = new StringStream("(\\101\\\r\n\\102\\\r\\103\\\n\\104)");
        const lexer = new Lexer(input);
        assertEquals(lexer.getString(), "ABCD");
      });
    });

    describe("getHexString", () => {
      it("should not throw exception on bad input", () => {
        // '7 0 2 15 5 2 2 2 4 3 2 4' should be parsed as '70 21 55 22 24 32'.
        const input = new StringStream("<7 0 2 15 5 2 2 2 4 3 2 4>");
        const lexer = new Lexer(input);
        assertEquals(lexer.getHexString(), 'p!U"$2');
      });
    });

    describe("getName", () => {
      it("should handle Names with invalid usage of NUMBER SIGN (#)", () => {
        const inputNames = ["/# 680 0 R", "/#AQwerty", "/#A<</B"];
        const expectedNames = ["#", "#AQwerty", "#A"];

        for (let i = 0, ii = inputNames.length; i < ii; i++) {
          const input = new StringStream(inputNames[i]);
          const lexer = new Lexer(input);
          assertEquals(lexer.getName(), Name.get(expectedNames[i]));
        }
      });
    });

    describe("getObj", () => {
      it(
        "should stop immediately when the start of a command is " +
          "a non-visible ASCII character (issue 13999)",
        () => {
          const input = new StringStream("\x14q\nQ");
          const lexer = new Lexer(input);

          let obj = lexer.getObj();
          assert(obj instanceof Cmd);
          assertEquals(obj.cmd, "\x14");

          obj = lexer.getObj();
          assert(obj instanceof Cmd);
          assertEquals(obj.cmd, "q");

          obj = lexer.getObj();
          assert(obj instanceof Cmd);
          assertEquals(obj.cmd, "Q");

          obj = lexer.getObj();
          assertEquals(obj, EOF);
        },
      );
    });
  });

  describe("Linearization", () => {
    it("should not find a linearization dictionary", () => {
      // Not an actual linearization dictionary.
      // prettier-ignore
      const stream1 = new StringStream(
        "3 0 obj\n" +
          "<<\n" +
          "/Length 4622\n" +
          "/Filter /FlateDecode\n" +
          ">>\n" +
          "endobj",
      );
      assertEquals(Linearization.create(stream1), null);

      // Linearization dictionary with invalid version number.
      // prettier-ignore
      const stream2 = new StringStream(
        "1 0 obj\n" +
          "<<\n" +
          "/Linearized 0\n" +
          ">>\n" +
          "endobj",
      );
      assertEquals(Linearization.create(stream2), null);
    });

    it("should accept a valid linearization dictionary", () => {
      // prettier-ignore
      const stream = new StringStream(
        "131 0 obj\n" +
          "<<\n" +
          "/Linearized 1\n" +
          "/O 133\n" +
          "/H [ 1388 863 ]\n" +
          "/L 90\n" +
          "/E 43573\n" +
          "/N 18\n" +
          "/T 193883\n" +
          ">>\n" +
          "endobj",
      );
      const expectedLinearizationDict = {
        length: 90,
        hints: [1388, 863],
        objectNumberFirst: 133,
        endFirst: 43573,
        numPages: 18,
        mainXRefEntriesOffset: 193883,
        pageFirst: 0,
      };
      assertEquals(Linearization.create(stream), expectedLinearizationDict);
    });

    it(
      "should reject a linearization dictionary with invalid " +
        "integer parameters",
      () => {
        // The /L parameter should be equal to the stream length.
        // prettier-ignore
        const stream1 = new StringStream(
          "1 0 obj\n" +
            "<<\n" +
            "/Linearized 1\n" +
            "/O 133\n" +
            "/H [ 1388 863 ]\n" +
            "/L 196622\n" +
            "/E 43573\n" +
            "/N 18\n" +
            "/T 193883\n" +
            ">>\n" +
            "endobj",
        );
        assertThrows(
          () => Linearization.create(stream1),
          Error,
          'The "L" parameter in the linearization ' +
            "dictionary does not equal the stream length.",
        );

        // The /E parameter should not be zero.
        // prettier-ignore
        const stream2 = new StringStream(
          "1 0 obj\n" +
            "<<\n" +
            "/Linearized 1\n" +
            "/O 133\n" +
            "/H [ 1388 863 ]\n" +
            "/L 84\n" +
            "/E 0\n" +
            "/N 18\n" +
            "/T 193883\n" +
            ">>\n" +
            "endobj",
        );
        assertThrows(
          () => Linearization.create(stream2),
          Error,
          'The "E" parameter in the linearization dictionary is invalid.',
        );

        // The /O parameter should be an integer.
        // prettier-ignore
        const stream3 = new StringStream(
          "1 0 obj\n" +
            "<<\n" +
            "/Linearized 1\n" +
            "/O /abc\n" +
            "/H [ 1388 863 ]\n" +
            "/L 89\n" +
            "/E 43573\n" +
            "/N 18\n" +
            "/T 193883\n" +
            ">>\n" +
            "endobj",
        );
        assertThrows(
          () => Linearization.create(stream3),
          Error,
          'The "O" parameter in the linearization dictionary is invalid.',
        );
      },
    );

    it("should reject a linearization dictionary with invalid hint parameters", () => {
      // The /H parameter should be an array.
      // prettier-ignore
      const stream1 = new StringStream(
        "1 0 obj\n" +
          "<<\n" +
          "/Linearized 1\n" +
          "/O 133\n" +
          "/H 1388\n" +
          "/L 80\n" +
          "/E 43573\n" +
          "/N 18\n" +
          "/T 193883\n" +
          ">>\n" +
          "endobj",
      );
      assertThrows(
        () => Linearization.create(stream1),
        Error,
        "Hint array in the linearization dictionary is invalid.",
      );

      // The hint array should contain two, or four, elements.
      // prettier-ignore
      const stream2 = new StringStream(
        "1 0 obj\n" +
          "<<\n" +
          "/Linearized 1\n" +
          "/O 133\n" +
          "/H [ 1388 ]\n" +
          "/L 84\n" +
          "/E 43573\n" +
          "/N 18\n" +
          "/T 193883\n" +
          ">>\n" +
          "endobj",
      );
      assertThrows(
        () => Linearization.create(stream2),
        Error,
        "Hint array in the linearization dictionary is invalid.",
      );

      // The hint array should not contain zero.
      // prettier-ignore
      const stream3 = new StringStream(
        "1 0 obj\n" +
          "<<\n" +
          "/Linearized 1\n" +
          "/O 133\n" +
          "/H [ 1388 863 0 234]\n" +
          "/L 93\n" +
          "/E 43573\n" +
          "/N 18\n" +
          "/T 193883\n" +
          ">>\n" +
          "endobj",
      );
      assertThrows(
        () => Linearization.create(stream3),
        Error,
        "Hint (2) in the linearization dictionary is invalid.",
      );
    });
  });
});
/*80--------------------------------------------------------------------------*/
