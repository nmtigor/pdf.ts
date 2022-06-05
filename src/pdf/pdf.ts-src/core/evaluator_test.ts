/*81*****************************************************************************
 * evaluator_test
** --------------- */

import { eq } from "../../../lib/jslang.js";
import { css_1, css_2 } from "../../../test/alias.js";
import { createIdFactory, XRefMock } from "../../test_utils.js";
import { FormatError, OPS } from "../shared/util.js";
import { BaseStream } from "./base_stream.js";
import { PartialEvaluator } from "./evaluator.js";
import { OperatorList } from "./operator_list.js";
import { Dict, Name } from "./primitives.js";
import { Stream, StringStream } from "./stream.js";
import { WorkerTask } from "./worker.js";

const strttime = performance.now();
/*81---------------------------------------------------------------------------*/

class HandlerMock
{
  inputs:{
    name:string;
    data:unknown;
  }[] = [];

  send( name:string, data:unknown ) 
  {
    this.inputs.push({ name, data });
  }
}

class ResourcesMock
{
  [ name:string ]:unknown;

  get( name:string ) 
  {
    return this[name];
  }
}

async function runOperatorListCheck( evaluator:PartialEvaluator, 
  stream:BaseStream, resources:Dict | ResourcesMock
) {
  const operatorList = new OperatorList();
  const task = new WorkerTask("OperatorListCheck");
  await evaluator.getOperatorList({
    stream,
    task,
    resources: <any>resources,
    operatorList,
  });
  return operatorList;
}

let partialEvaluator = new PartialEvaluator(<any>{
  xref: new XRefMock(),
  handler: new HandlerMock(),
  pageIndex: 0,
  idFactory: createIdFactory(/* pageIndex = */ 0),
});

console.log("%c>>>>>>> test splitCombinedOperations >>>>>>>",`color:${css_1}`);
{
  console.log("it should reject unknown operations...");
  {
    const stream = new StringStream("fTT");
    const result = await runOperatorListCheck(
      partialEvaluator,
      stream,
      new ResourcesMock()
    );
    console.assert( !!result.fnArray && !!result.argsArray );
    console.assert( result.fnArray.length === 1 );
    console.assert( result.fnArray[0] === OPS.fill );
    console.assert( result.argsArray[0] === null );
  }

  console.log("it should handle one operation...");
  {
    const stream = new StringStream("Q");
    const result = await runOperatorListCheck(
      partialEvaluator,
      stream,
      new ResourcesMock()
    );
    console.assert( !!result.fnArray && !!result.argsArray )
    console.assert( result.fnArray.length === 1 );
    console.assert( result.fnArray[0] === OPS.restore );
  }

  console.log("it should handle two glued operations...");
  {
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
      resources
    );
    console.assert( result.fnArray.length === 3 );
    console.assert( result.fnArray[0] === OPS.dependency );
    console.assert( result.fnArray[1] === OPS.paintImageXObject );
    console.assert( result.fnArray[2] === OPS.restore );
    console.assert( result.argsArray.length === 3 );
    console.assert( eq( result.argsArray[0], ["img_p0_1"] ));
    console.assert( eq( result.argsArray[1], ["img_p0_1", 1, 1] ));
    console.assert( result.argsArray[2] === null );
  }

  console.log("it should handle three glued operations...");
  {
    const stream = new StringStream("fff");
    const result = await runOperatorListCheck(
      partialEvaluator,
      stream,
      new ResourcesMock()
    );
    console.assert( !!result.fnArray && !!result.argsArray );
    console.assert( result.fnArray.length === 3 );
    console.assert( result.fnArray[0] === OPS.fill );
    console.assert( result.fnArray[1] === OPS.fill );
    console.assert( result.fnArray[2] === OPS.fill );
  }

  console.log("it should handle three glued operations #2...");
  {
    const resources = new ResourcesMock();
    resources.Res1 = {};
    const stream = new StringStream("B*Bf*");
    const result = await runOperatorListCheck(
      partialEvaluator,
      stream,
      resources
    );
    console.assert( !!result.fnArray && !!result.argsArray );
    console.assert( result.fnArray.length === 3 );
    console.assert( result.fnArray[0] === OPS.eoFillStroke );
    console.assert( result.fnArray[1] === OPS.fillStroke );
    console.assert( result.fnArray[2] === OPS.eoFill );
  }

  console.log("it should handle glued operations and operands...");
  {
    const stream = new StringStream("f5 Ts");
    const result = await runOperatorListCheck(
      partialEvaluator,
      stream,
      new ResourcesMock()
    );
    console.assert( !!result.fnArray && !!result.argsArray );
    console.assert( result.fnArray.length === 2 );
    console.assert( result.fnArray[0] === OPS.fill );
    console.assert( result.fnArray[1] === OPS.setTextRise );
    console.assert( result.argsArray.length === 2 );
    console.assert( eq( result.argsArray[1], [5] ));
    // console.assert( (<any>result.argsArray[1]).length === 1 );
    // console.assert( (<any>result.argsArray[1])[0] === 5 );
  }

  console.log("it should handle glued operations and literals...");
  {
    const stream = new StringStream("trueifalserinulln");
    const result = await runOperatorListCheck(
      partialEvaluator,
      stream,
      new ResourcesMock()
    );
    console.assert( !!result.fnArray && !!result.argsArray );
    console.assert( result.fnArray.length === 3 );
    console.assert( result.fnArray[0] === OPS.setFlatness );
    console.assert( result.fnArray[1] === OPS.setRenderingIntent );
    console.assert( result.fnArray[2] === OPS.endPath );
    console.assert( result.argsArray.length === 3 );
    console.assert( eq( result.argsArray[0], [true] ));
    // console.assert( result.argsArray[0].length).toEqual(1);
    // console.assert( result.argsArray[0][0]).toEqual(true);
    console.assert( eq( result.argsArray[1], [false] ));
    // console.assert( result.argsArray[1].length).toEqual(1);
    // console.assert( result.argsArray[1][0]).toEqual(false);
    console.assert( result.argsArray[2] === null );
  }
}

console.log("%c>>>>>>> test validateNumberOfArgs >>>>>>>",`color:${css_1}`);
{
  console.log("it should execute if correct number of arguments...");
  {
    const stream = new StringStream("5 1 d0");
    const result = await runOperatorListCheck(
      partialEvaluator,
      stream,
      new ResourcesMock()
    );
    console.assert( eq( result.argsArray[0], [5,1] ));
    // console.assert( result.argsArray[0][0] === 5 );
    // console.assert( result.argsArray[0][1] === 1 );
    console.assert( result.fnArray[0] === OPS.setCharWidth );
  }

  console.log("it should execute if too many arguments...");
  {
    const stream = new StringStream("5 1 4 d0");
    const result = await runOperatorListCheck(
      partialEvaluator,
      stream,
      new ResourcesMock()
    );
    console.assert( eq( result.argsArray[0], [1,4] ));
    // console.assert( result.argsArray[0][0]).toEqual(1);
    // console.assert( result.argsArray[0][1]).toEqual(4);
    console.assert( result.fnArray[0] === OPS.setCharWidth );
  }

  console.log("it should execute if nested commands...");
  {
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
      resources
    );
    console.assert( result.fnArray.length === 3 );
    console.assert( result.fnArray[0] === OPS.setGState );
    console.assert( result.fnArray[1] === OPS.dependency );
    console.assert( result.fnArray[2] === OPS.setFont );
    console.assert( result.argsArray.length === 3 );
    console.assert( eq( result.argsArray[0],[
      [
        ["LW", 2],
        ["CA", 0.5],
      ],
    ]));
    console.assert( eq( result.argsArray[1], ["g_font_error"] ));
    console.assert( eq( result.argsArray[2], ["g_font_error", 5.711] ));
  }

  console.log("it should skip if too few arguments...");
  {
    const stream = new StringStream("5 d0");
    const result = await runOperatorListCheck(
      partialEvaluator,
      stream,
      new ResourcesMock()
    );
    console.assert( result.argsArray.eq([]) );
    console.assert( result.fnArray.eq([]) );
  }

  console.log("it should error if (many) path operators have too few arguments (bug 1443140)...");
  {
    const NUM_INVALID_OPS = 25;

    // Non-path operators, should be ignored.
    const invalidMoveText = "10 Td\n".repeat(NUM_INVALID_OPS);
    const moveTextStream = new StringStream(invalidMoveText);
    const result = await runOperatorListCheck(
      partialEvaluator,
      moveTextStream,
      new ResourcesMock()
    );
    console.assert( result.argsArray.eq([]) );
    console.assert( result.fnArray.eq([]) );

    // Path operators, should throw error.
    const invalidLineTo = "20 l\n".repeat(NUM_INVALID_OPS);
    const lineToStream = new StringStream(invalidLineTo);

    try {
      await runOperatorListCheck(
        partialEvaluator,
        lineToStream,
        new ResourcesMock()
      );
      console.assert( !!0, "Shouldn't get here.");
    } catch (reason) {
      console.assert( reason instanceof FormatError );
      console.assert( (<FormatError>reason).message ===
        "Invalid command l: expected 2 args, but received 1 args."
      );
    }
  }

  console.log("it should close opened saves...");
  {
    const stream = new StringStream("qq");
    const result = await runOperatorListCheck(
      partialEvaluator,
      stream,
      new ResourcesMock()
    );
    console.assert( !!result.fnArray && !!result.argsArray );
    console.assert( result.fnArray.length === 4 );
    console.assert( result.fnArray[0] === OPS.save );
    console.assert( result.fnArray[1] === OPS.save );
    console.assert( result.fnArray[2] === OPS.restore );
    console.assert( result.fnArray[3] === OPS.restore );
  }

  console.log("it should error on paintXObject if name is missing...");
  {
    const stream = new StringStream("/ Do");

    try {
      await runOperatorListCheck(
        partialEvaluator,
        stream,
        new ResourcesMock()
      );
      console.assert( !!0, "Shouldn't get here.");
    } catch (reason) {
      console.assert( reason instanceof FormatError );
      console.assert( (<FormatError>reason).message === "XObject should be a stream" );
    }
  }

  console.log("it should skip paintXObject if subtype is PS...");
  {
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
      resources
    );
    console.assert( result.argsArray.eq([]) );
    console.assert( result.fnArray.eq([]) );
  }
}

console.log("%c>>>>>>> test thread control >>>>>>>",`color:${css_1}`);
{
  console.log("it should abort operator list parsing...");
  {
    const stream = new StringStream("qqQQ");
    const resources = new ResourcesMock();
    const result = new OperatorList();
    const task = new WorkerTask("OperatorListAbort");
    task.terminate();

    try {
      await partialEvaluator.getOperatorList({
        stream,
        task,
        resources: <any>resources,
        operatorList: result,
      });
      console.assert( !!0, "Shouldn't get here.");
    } catch (_) {
      console.assert( !!result.fnArray && !!result.argsArray );
      console.assert( result.fnArray.length === 0 );
    }
  }

  console.log("it should abort text content parsing...");
  {
    const resources = new ResourcesMock();
    const stream = new StringStream("qqQQ");
    const task = new WorkerTask("TextContentAbort");
    task.terminate();

    try {
      await partialEvaluator.getTextContent(<any>{
        stream,
        task,
        resources,
      });
      console.assert( !!0, "Shouldn't get here.");
    } catch (_) {}
  }
}

console.log("%c>>>>>>> test operator list >>>>>>>",`color:${css_1}`);
{
  class StreamSinkMock 
  {
    enqueue() {}
  }
  
  console.log("it should get correct total length after flushing...");
  {
    const operatorList = new OperatorList(undefined, <any>new StreamSinkMock());
    operatorList.addOp(OPS.save, null);
    operatorList.addOp(OPS.restore, null);

    console.assert( operatorList.totalLength === 2 );
    console.assert( operatorList.length === 2 );

    operatorList.flush();

    console.assert( operatorList.totalLength === 2 );
    console.assert( operatorList.length === 0 );
  }
}

partialEvaluator = <any>undefined;
/*81---------------------------------------------------------------------------*/

console.log(`%c:pdf/pdf.ts-src/core/evaluator_test ${(performance.now()-strttime).toFixed(2)} ms`,`color:${css_2}`);
globalThis.ntestfile = globalThis.ntestfile ? globalThis.ntestfile+1 : 1;
