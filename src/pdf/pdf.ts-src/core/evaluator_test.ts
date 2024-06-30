/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/evaluator_test.ts
 * @license Apache-2.0
 ******************************************************************************/

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

import { assert, assertEquals, fail } from "@std/assert";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd.ts";
import { createIdFactory, XRefMock } from "@fe-pdf.ts-test/test_utils.ts";
import { FormatError, OPS } from "../shared/util.ts";
import { BaseStream } from "./base_stream.ts";
import { PartialEvaluator } from "./evaluator.ts";
import { OperatorList } from "./operator_list.ts";
import { Dict, Name } from "./primitives.ts";
import { Stream, StringStream } from "./stream.ts";
import { WorkerTask } from "./worker.ts";
/*80--------------------------------------------------------------------------*/

describe("evaluator", () => {
  class HandlerMock {
    inputs: {
      name: string;
      data: unknown;
    }[] = [];

    send(name: string, data: unknown) {
      this.inputs.push({ name, data });
    }
  }

  class ResourcesMock {
    [name: string]: unknown;

    get(name: string) {
      return this[name];
    }
  }

  async function runOperatorListCheck(
    evaluator: PartialEvaluator,
    stream: BaseStream,
    resources: Dict | ResourcesMock,
  ) {
    const operatorList = new OperatorList();
    const task = new WorkerTask("OperatorListCheck");
    await evaluator.getOperatorList({
      stream,
      task,
      resources: resources as any,
      operatorList,
    });
    return operatorList;
  }

  let partialEvaluator: PartialEvaluator;

  beforeAll(() => {
    partialEvaluator = new PartialEvaluator({
      xref: new XRefMock(),
      handler: new HandlerMock(),
      pageIndex: 0,
      idFactory: createIdFactory(/* pageIndex = */ 0),
    } as any);
  });

  afterAll(() => {
    partialEvaluator = undefined as any;
  });

  describe("splitCombinedOperations", () => {
    it("should reject unknown operations", async () => {
      const stream = new StringStream("fTT");
      const result = await runOperatorListCheck(
        partialEvaluator,
        stream,
        new ResourcesMock(),
      );
      assert(!!result.fnArray && !!result.argsArray);
      assertEquals(result.fnArray.length, 1);
      assertEquals(result.fnArray[0], OPS.fill);
      assertEquals(result.argsArray[0], undefined);
    });

    it("should handle one operation", async () => {
      const stream = new StringStream("Q");
      const result = await runOperatorListCheck(
        partialEvaluator,
        stream,
        new ResourcesMock(),
      );
      assert(!!result.fnArray && !!result.argsArray);
      assertEquals(result.fnArray.length, 1);
      assertEquals(result.fnArray[0], OPS.restore);
    });

    it("should handle two glued operations", async () => {
      const imgDict = new Dict();
      imgDict.set("Subtype", Name.get("Image"));
      imgDict.set("Width", 1);
      imgDict.set("Height", 1);

      const imgStream = new Stream([0]);
      imgStream.dict = imgDict;

      const xObject = new Dict();
      xObject.set("Res1", imgStream);

      const resources = new ResourcesMock();
      resources.XObject = xObject;

      const stream = new StringStream("/Res1 DoQ");
      const result = await runOperatorListCheck(
        partialEvaluator,
        stream,
        resources,
      );
      assertEquals(result.fnArray.length, 3);
      assertEquals(result.fnArray[0], OPS.dependency);
      assertEquals(result.fnArray[1], OPS.paintImageXObject);
      assertEquals(result.fnArray[2], OPS.restore);
      assertEquals(result.argsArray.length, 3);
      assertEquals(result.argsArray[0], ["img_p0_1"]);
      assertEquals(result.argsArray[1], ["img_p0_1", 1, 1]);
      assertEquals(result.argsArray[2], undefined);
    });

    it("should handle three glued operations", async () => {
      const stream = new StringStream("fff");
      const result = await runOperatorListCheck(
        partialEvaluator,
        stream,
        new ResourcesMock(),
      );
      assert(!!result.fnArray && !!result.argsArray);
      assertEquals(result.fnArray.length, 3);
      assertEquals(result.fnArray[0], OPS.fill);
      assertEquals(result.fnArray[1], OPS.fill);
      assertEquals(result.fnArray[2], OPS.fill);
    });

    it("should handle three glued operations #2", async () => {
      const resources = new ResourcesMock();
      resources.Res1 = {};
      const stream = new StringStream("B*Bf*");
      const result = await runOperatorListCheck(
        partialEvaluator,
        stream,
        resources,
      );
      assert(!!result.fnArray && !!result.argsArray);
      assertEquals(result.fnArray.length, 3);
      assertEquals(result.fnArray[0], OPS.eoFillStroke);
      assertEquals(result.fnArray[1], OPS.fillStroke);
      assertEquals(result.fnArray[2], OPS.eoFill);
    });

    it("should handle glued operations and operands", async () => {
      const stream = new StringStream("f5 Ts");
      const result = await runOperatorListCheck(
        partialEvaluator,
        stream,
        new ResourcesMock(),
      );
      assert(!!result.fnArray && !!result.argsArray);
      assertEquals(result.fnArray.length, 2);
      assertEquals(result.fnArray[0], OPS.fill);
      assertEquals(result.fnArray[1], OPS.setTextRise);
      assertEquals(result.argsArray.length, 2);
      assertEquals(result.argsArray[1], [5]);
    });

    it("should handle glued operations and literals", async () => {
      const stream = new StringStream("trueifalserinulln");
      const result = await runOperatorListCheck(
        partialEvaluator,
        stream,
        new ResourcesMock(),
      );
      assert(!!result.fnArray && !!result.argsArray);
      assertEquals(result.fnArray.length, 3);
      assertEquals(result.fnArray[0], OPS.setFlatness);
      assertEquals(result.fnArray[1], OPS.setRenderingIntent);
      assertEquals(result.fnArray[2], OPS.endPath);
      assertEquals(result.argsArray.length, 3);
      assertEquals(result.argsArray[0], [true]);
      assertEquals(result.argsArray[1], [false]);
      assertEquals(result.argsArray[2], undefined);
    });
  });

  describe("validateNumberOfArgs", () => {
    it("should execute if correct number of arguments", async () => {
      const stream = new StringStream("5 1 d0");
      const result = await runOperatorListCheck(
        partialEvaluator,
        stream,
        new ResourcesMock(),
      );
      assertEquals(result.argsArray[0], [5, 1]);
      // assertEquals( result.argsArray[0][0] === 5 );
      // assertEquals( result.argsArray[0][1] === 1 );
      assertEquals(result.fnArray[0], OPS.setCharWidth);
    });

    it("should execute if too many arguments", async () => {
      const stream = new StringStream("5 1 4 d0");
      const result = await runOperatorListCheck(
        partialEvaluator,
        stream,
        new ResourcesMock(),
      );
      assertEquals(result.argsArray[0], [1, 4]);
      // assertEquals( result.argsArray[0][0]).toEqual(1);
      // assertEquals( result.argsArray[0][1]).toEqual(4);
      assertEquals(result.fnArray[0], OPS.setCharWidth);
    });

    it("should execute if nested commands", async () => {
      const gState = new Dict();
      gState.set("LW", 2);
      gState.set("CA", 0.5);

      const extGState = new Dict();
      extGState.set("GS2", gState);

      const resources = new ResourcesMock();
      resources.ExtGState = extGState;

      const stream = new StringStream("/F2 /GS2 gs 5.711 Tf");
      const result = await runOperatorListCheck(
        partialEvaluator,
        stream,
        resources,
      );
      assertEquals(result.fnArray.length, 3);
      assertEquals(result.fnArray[0], OPS.setGState);
      assertEquals(result.fnArray[1], OPS.dependency);
      assertEquals(result.fnArray[2], OPS.setFont);
      assertEquals(result.argsArray.length, 3);
      assertEquals(result.argsArray[0], [[
        ["LW", 2],
        ["CA", 0.5],
      ]]);
      assertEquals(result.argsArray[1], ["g_font_error"]);
      assertEquals(result.argsArray[2], ["g_font_error", 5.711]);
    });

    it("should skip if too few arguments", async () => {
      const stream = new StringStream("5 d0");
      const result = await runOperatorListCheck(
        partialEvaluator,
        stream,
        new ResourcesMock(),
      );
      assertEquals(result.argsArray, []);
      assertEquals(result.fnArray, []);
    });

    it("should error if (many) path operators have too few arguments (bug 1443140)", async () => {
      const NUM_INVALID_OPS = 25;

      // Non-path operators, should be ignored.
      const invalidMoveText = "10 Td\n".repeat(NUM_INVALID_OPS);
      const moveTextStream = new StringStream(invalidMoveText);
      const result = await runOperatorListCheck(
        partialEvaluator,
        moveTextStream,
        new ResourcesMock(),
      );
      assertEquals(result.argsArray, []);
      assertEquals(result.fnArray, []);

      // Path operators, should throw error.
      const invalidLineTo = "20 l\n".repeat(NUM_INVALID_OPS);
      const lineToStream = new StringStream(invalidLineTo);

      try {
        await runOperatorListCheck(
          partialEvaluator,
          lineToStream,
          new ResourcesMock(),
        );

        fail("Shouldn't get here.");
      } catch (reason) {
        assert(reason instanceof FormatError);
        assertEquals(
          reason.message,
          "Invalid command l: expected 2 args, but received 1 args.",
        );
      }
    });

    it("should close opened saves", async () => {
      const stream = new StringStream("qq");
      const result = await runOperatorListCheck(
        partialEvaluator,
        stream,
        new ResourcesMock(),
      );
      assert(!!result.fnArray && !!result.argsArray);
      assertEquals(result.fnArray.length, 4);
      assertEquals(result.fnArray[0], OPS.save);
      assertEquals(result.fnArray[1], OPS.save);
      assertEquals(result.fnArray[2], OPS.restore);
      assertEquals(result.fnArray[3], OPS.restore);
    });

    it("should error on paintXObject if name is missing", async () => {
      const stream = new StringStream("/ Do");

      try {
        await runOperatorListCheck(
          partialEvaluator,
          stream,
          new ResourcesMock(),
        );

        fail("Shouldn't get here.");
      } catch (reason) {
        assert(reason instanceof FormatError);
        assertEquals(reason.message, "XObject should be a stream");
      }
    });

    it("should skip paintXObject if subtype is PS", async () => {
      const xobjStreamDict = new Dict();
      xobjStreamDict.set("Subtype", Name.get("PS"));
      const xobjStream = new Stream([], 0, 0, xobjStreamDict);

      const xobjs = new Dict();
      xobjs.set("Res1", xobjStream);

      const resources = new Dict();
      resources.set("XObject", xobjs);

      const stream = new StringStream("/Res1 Do");
      const result = await runOperatorListCheck(
        partialEvaluator,
        stream,
        resources,
      );
      assertEquals(result.argsArray, []);
      assertEquals(result.fnArray, []);
    });
  });

  describe("thread control", () => {
    it("should abort operator list parsing", async () => {
      const stream = new StringStream("qqQQ");
      const resources = new ResourcesMock();
      const result = new OperatorList();
      const task = new WorkerTask("OperatorListAbort");
      task.terminate();

      try {
        await partialEvaluator.getOperatorList({
          stream,
          task,
          resources: resources as any,
          operatorList: result,
        });

        fail("Shouldn't get here.");
      } catch {
        assert(!!result.fnArray && !!result.argsArray);
        assertEquals(result.fnArray.length, 0);
      }
    });

    it("should abort text content parsing", async () => {
      const resources = new ResourcesMock();
      const stream = new StringStream("qqQQ");
      const task = new WorkerTask("TextContentAbort");
      task.terminate();

      try {
        await partialEvaluator.getTextContent({
          stream,
          task,
          resources,
        } as any);

        fail("Shouldn't get here.");
      } catch {}
    });
  });

  describe("operator list", () => {
    class StreamSinkMock {
      enqueue() {}
    }

    it("should get correct total length after flushing", () => {
      const operatorList = new OperatorList(
        undefined,
        new StreamSinkMock() as any,
      );
      operatorList.addOp(OPS.save);
      operatorList.addOp(OPS.restore);

      assertEquals(operatorList.totalLength, 2);
      assertEquals(operatorList.length, 2);

      operatorList.flush();

      assertEquals(operatorList.totalLength, 2);
      assertEquals(operatorList.length, 0);
    });
  });
});
/*80--------------------------------------------------------------------------*/
