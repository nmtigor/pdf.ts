/*81*****************************************************************************
 * cff_parser_test
** --------------- */

// #if TESTING && TEST_ALL
import { css_1, css_2 } from "../../../test/alias.js";
import "../../../lib/jslang.js";
import { bidi } from "./bidi.js";
import { Stream } from "./stream.js";
import { CFF, CFFParser } from "./cff_parser.js";
import { SEAC_ANALYSIS_ENABLED } from "./fonts_utils.js";

const strttime = performance.now();
/*81---------------------------------------------------------------------------*/

console.log("%c>>>>>>> test CFFParser >>>>>>>",`color:${css_1}`);
{
  function createWithNullProto( obj:Record<number, number> )
  {
    const result = Object.create(null);
    for (const i in obj) 
    {
      result[i] = obj[i];
    }
    return result;
  }

  // Stub that returns `0` for any privateDict key.
  const privateDictStub = {
    getByName( name:string ) { return 0; },
  };

  let parser!:CFFParser, 
    cff!:CFF;

  // This example font comes from the CFF spec:
  // http://www.adobe.com/content/dam/Adobe/en/devnet/font/pdfs/5176.CFF.pdf
  const exampleFont =
    "0100040100010101134142434445462b" +
    "54696d65732d526f6d616e000101011f" +
    "f81b00f81c02f81d03f819041c6f000d" +
    "fb3cfb6efa7cfa1605e911b8f1120003" +
    "01010813183030312e30303754696d65" +
    "7320526f6d616e54696d657300000002" +
    "010102030e0e7d99f92a99fb7695f773" +
    "8b06f79a93fc7c8c077d99f85695f75e" +
    "9908fb6e8cf87393f7108b09a70adf0b" +
    "f78e14";
  const fontArr = [];
  for( let i = 0, ii = exampleFont.length; i < ii; i += 2 )
  {
    const hex = exampleFont.substring(i, i + 2);
    fontArr.push(parseInt(hex, 16));
  }
  let fontData = new Stream(fontArr);

  function beforeEach() 
  {
    parser = new CFFParser(fontData, <any>{}, SEAC_ANALYSIS_ENABLED);
    cff = parser.parse();
  }

  function afterEach() 
  {
    parser = cff = <any>undefined;
  }

  console.log("it parses header...");
  beforeEach();
  {
    const header = cff.header!;
    console.assert( header.major === 1 );
    console.assert( header.minor === 0 );
    console.assert( header.hdrSize === 4 );
    console.assert( header.offSize === 1 );
  }
  afterEach();

  console.log("it parses name index...");
  beforeEach();
  {
    //
  }
  afterEach();

  // TODO fdArray

  fontData = <any>undefined;
}

console.log("%c>>>>>>> test CFFCompiler >>>>>>>",`color:${css_1}`);
{
  //
}
/*81---------------------------------------------------------------------------*/

console.log(`%cpdf/pdf.ts-src/core/cff_parser_test: ${(performance.now()-strttime).toFixed(2)} ms`,`color:${css_2}`);
globalThis.ntestfile = globalThis.ntestfile ? globalThis.ntestfile+1 : 1;
// #endif
