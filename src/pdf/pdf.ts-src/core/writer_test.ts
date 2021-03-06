/*81*****************************************************************************
 * writer_test
** ----------- */

import "../../../lib/jslang.js";
import { css_1, css_2 } from "../../../test/alias.js";
import { bytesToString } from "../shared/util.js";
import { type SaveData } from "./annotation.js";
import { Dict, Name, Ref } from "./primitives.js";
import { StringStream } from "./stream.js";
import { type XRefInfo } from "./worker.js";
import { incrementalUpdate, writeDict } from "./writer.js";
import { XRef } from "./xref.js";

const strttime = performance.now();
/*81---------------------------------------------------------------------------*/

console.log("%c>>>>>>> test Incremental update >>>>>>>",`color:${css_1}`);
{
  console.log("it should update a file with new objects...");
  {
    const originalData = new Uint8Array();
    const newRefs = [
      { ref: Ref.get(123, 0x2d), data: "abc\n" },
      { ref: Ref.get(456, 0x4e), data: "defg\n" },
    ];
    const xrefInfo:XRefInfo = {
      newRef: Ref.get(789, 0),
      startXRef: 314,
      fileIds: ["id", ""],
      // rootRef: null,
      // infoRef: null,
      // encryptRef: null,
      filename: "foo.pdf",
      info: {},
    };

    let data:Uint8Array | string = 
      incrementalUpdate({ originalData, xrefInfo, newRefs });
    data = bytesToString(data);

    const expected =
      "\nabc\n" +
      "defg\n" +
      "789 0 obj\n" +
      "<< /Size 790 /Prev 314 /Type /XRef /Index [0 1 123 1 456 1 789 1] " +
      "/ID [(id) (\x01#Eg\x89\xab\xcd\xef\xfe\xdc\xba\x98vT2\x10)] " +
      "/W [1 1 2] /Length 16>> stream\n" +
      "\x00\x01\xff\xff" +
      "\x01\x01\x00\x2d" +
      "\x01\x05\x00\x4e" +
      "\x01\x0a\x00\x00\n" +
      "endstream\n" +
      "endobj\n" +
      "startxref\n" +
      "10\n" +
      "%%EOF\n";

    console.assert( data === expected );
  }

  console.log("it should update a file, missing the /ID-entry, with new objects...");
  {
    const originalData = new Uint8Array();
    const newRefs = [{ ref: Ref.get(123, 0x2d), data: "abc\n" }];
    const xrefInfo:XRefInfo = {
      newRef: Ref.get(789, 0),
      startXRef: 314,
      // fileIds: null,
      // rootRef: null,
      // infoRef: null,
      // encryptRef: null,
      filename: "foo.pdf",
      info: {},
    };

    let data:Uint8Array | string = incrementalUpdate({ originalData, xrefInfo, newRefs });
    data = bytesToString(data);

    const expected =
      "\nabc\n" +
      "789 0 obj\n" +
      "<< /Size 790 /Prev 314 /Type /XRef /Index [0 1 123 1 789 1] " +
      "/W [1 1 2] /Length 12>> stream\n" +
      "\x00\x01\xff\xff" +
      "\x01\x01\x00\x2d" +
      "\x01\x05\x00\x00\n" +
      "endstream\n" +
      "endobj\n" +
      "startxref\n" +
      "5\n" +
      "%%EOF\n";

    console.assert( data === expected );
  }
}

console.log("%c>>>>>>> test writeDict() >>>>>>>",`color:${css_1}`);
{
  console.log("it should write a Dict...");
  {
    const dict = new Dict();
    dict.set("A", Name.get("B"));
    dict.set("B", Ref.get(123, 456));
    dict.set("C", 789);
    dict.set("D", "hello world");
    dict.set("E", "(hello\\world)");
    dict.set("F", [1.23001, 4.50001, 6]);

    const gdict = new Dict();
    gdict.set("H", 123.00001);
    const string = "a stream";
    const stream = new StringStream(string);
    stream.dict = new Dict();
    stream.dict.set("Length", string.length);
    gdict.set("I", stream);

    dict.set("G", gdict);
    dict.set("J", true);
    dict.set("K", false);

    dict.set("NullArr", [null, 10]);
    dict.set("NullVal", null);

    const buffer:string[] = [];
    writeDict( dict, buffer );

    const expected =
      "<< /A /B /B 123 456 R /C 789 /D (hello world) " +
      "/E (\\(hello\\\\world\\)) /F [1.23 4.5 6] " +
      "/G << /H 123 /I << /Length 8>> stream\n" +
      "a stream\n" +
      "endstream\n>> /J true /K false " +
      "/NullArr [null 10] /NullVal null>>";

    console.assert( buffer.join("") === expected );
  }

  console.log("it should write a Dict in escaping PDF names...");
  {
    const dict = new Dict();
    dict.set("\xfeA#", Name.get("hello"));
    dict.set("B", Name.get("#hello"));
    dict.set("C", Name.get("he\xfello\xff"));

    const buffer:string[] = [];
    writeDict( dict, buffer );

    const expected = "<< /#feA#23 /hello /B /#23hello /C /he#fello#ff>>";

    console.assert( buffer.join("") === expected );
  }
}

console.log("%c>>>>>>> test XFA >>>>>>>",`color:${css_1}`);
{
  console.log("it should update AcroForm when no datasets in XFA array...");
  {
    const originalData = new Uint8Array();
    const newRefs:SaveData[] = [];

    const acroForm = new Dict();
    acroForm.set("XFA", [
      "preamble",
      Ref.get(123, 0),
      "postamble",
      Ref.get(456, 0),
    ]);
    const acroFormRef = Ref.get(789, 0);
    const xfaDatasetsRef = Ref.get(101112, 0);
    const xfaData = "<hello>world</hello>";

    const xrefInfo:XRefInfo = {
      newRef: Ref.get(131415, 0),
      startXRef: 314,
      // fileIds: null,
      // rootRef: null,
      // infoRef: null,
      // encryptRef: null,
      filename: "foo.pdf",
      info: {},
    };

    let data:Uint8Array | string = incrementalUpdate({
      originalData,
      xrefInfo,
      newRefs,
      hasXfa: true,
      xfaDatasetsRef,
      hasXfaDatasetsEntry: false,
      acroFormRef,
      acroForm,
      xfaData,
      xref: <XRef>{},
    });
    data = bytesToString(data);

    const expected =
      "\n" +
      "789 0 obj\n" +
      "<< /XFA [(preamble) 123 0 R (datasets) 101112 0 R (postamble) 456 0 R]>>\n" +
      "101112 0 obj\n" +
      "<< /Type /EmbeddedFile /Length 20>>\n" +
      "stream\n" +
      "<hello>world</hello>\n" +
      "endstream\n" +
      "endobj\n" +
      "131415 0 obj\n" +
      "<< /Size 131416 /Prev 314 /Type /XRef /Index [0 1 789 1 101112 1 131415 1] /W [1 1 2] /Length 16>> stream\n" +
      "\u0000\u0001????\u0001\u0001\u0000\u0000\u0001T\u0000\u0000\u0001??\u0000\u0000\n" +
      "endstream\n" +
      "endobj\n" +
      "startxref\n" +
      "178\n" +
      "%%EOF\n";

    console.assert( data === expected );
  }
}
/*81---------------------------------------------------------------------------*/

console.log(`%c:pdf/pdf.ts-src/core/writer_test ${(performance.now()-strttime).toFixed(2)} ms`,`color:${css_2}`);
globalThis.ntestfile = globalThis.ntestfile ? globalThis.ntestfile+1 : 1;
