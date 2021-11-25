/*81*****************************************************************************
 * xml_parser_test
** --------------- */

import { css_1, css_2 } from "../../../test/alias.js";
import "../../../lib/jslang.js";
import { parseXFAPath } from "./core_utils.js";
import { SimpleXMLParser, XMLParserBase } from "./xml_parser.js";

const strttime = performance.now();
/*81---------------------------------------------------------------------------*/

console.log("%c>>>>>>> test searchNode() >>>>>>>",`color:${css_1}`);
{
  console.log("it should search a node with a given path in xml tree...");
  {
    const xml = `
    <a>
        <b>
            <c a="123"/>
            <d/>
            <e>
                <f>
                    <g a="321"/>
                </f>
            </e>
            <c a="456"/>
            <c a="789"/>
            <h/>
            <c a="101112"/>
        </b>
        <h>
            <i/>
            <j/>
            <k>
                <g a="654"/>
            </k>
        </h>
        <b>
            <g a="987"/>
            <h/>
            <g a="121110"/>
        </b>
    </a>`;
    const root = new SimpleXMLParser({ hasAttributes: true }).parseFromString(
      xml
    )!.documentElement;
    function getAttr( path:string ) 
    {
      return root.searchNode(parseXFAPath(path), 0)!.attributes![0].value;
    }

    console.assert( getAttr("b.g") === "321" );
    console.assert( getAttr("e.f.g") === "321" );
    console.assert( getAttr("e.g") === "321" );
    console.assert( getAttr("g") === "321" );
    console.assert( getAttr("h.g") === "654" );
    console.assert( getAttr("b[0].g") === "321" );
    console.assert( getAttr("b[1].g") === "987" );
    console.assert( getAttr("b[1].g[0]") === "987" );
    console.assert( getAttr("b[1].g[1]") === "121110" );
    console.assert( getAttr("c") === "123" );
    console.assert( getAttr("c[1]") === "456" );
    console.assert( getAttr("c[2]") === "789" );
    console.assert( getAttr("c[3]") === "101112" );
  }

  console.log("it should dump a xml tree...");
  {
    const xml = `
    <a>
        <b>
            <c a="123"/>
            <d>hello</d>
            <e>
                <f>
                    <g a="321"/>
                </f>
            </e>
            <c a="456"/>
            <c a="789"/>
            <h/>
            <c a="101112"/>
        </b>
        <h>
            <i/>
            <j/>
            <k>&#xA;W&#x1F602;rld&#xA;<g a="654"/>
            </k>
        </h>
        <b>
            <g a="987"/>
            <h/>
            <g a="121110"/>
        </b>
    </a>`;
    const root = new SimpleXMLParser({ hasAttributes: true }).parseFromString(
      xml
    )!.documentElement;
    const buffer:string[] = [];
    root.dump(buffer);

    console.assert( 
      buffer.join("").replace(/\s+/g, "") === xml.replace(/\s+/g, "")
    );
  }

  console.log("it should parse processing instructions..");
  {
    const xml = `
      <a>
          <?foo bar?>
          <?foo bar oof?>
          <?foo?>
      </a>`;
    const pi:[string, string][] = [];

    class MyParser extends XMLParserBase 
    {      
      override onPi( name:string, value:string ) 
      {
        pi.push([name, value]);
      }

      onCdata() {}
      onText() {}
      onBeginElement() {}
      onEndElement() {}
      onError() {}
    }

    new MyParser().parseXml(xml);

    console.assert( pi.eq([
      ["foo", "bar"],
      ["foo", "bar oof"],
      ["foo", ""],
    ]));
  }
}
/*81---------------------------------------------------------------------------*/

console.log(`%c:pdf/pdf.ts-src/core/xml_parser_test ${(performance.now()-strttime).toFixed(2)} ms`,`color:${css_2}`);
globalThis.ntestfile = globalThis.ntestfile ? globalThis.ntestfile+1 : 1;
