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

import { assertEquals } from "https://deno.land/std@0.155.0/testing/asserts.ts";
import { describe, it } from "https://deno.land/std@0.155.0/testing/bdd.ts";
import { parseXFAPath } from "./core_utils.ts";
import { SimpleXMLParser, XMLParserBase } from "./xml_parser.ts";
/*80--------------------------------------------------------------------------*/

describe("XML", () => {
  describe("searchNode", () => {
    it("should search a node with a given path in xml tree", () => {
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
        xml,
      )!.documentElement;
      function getAttr(path: string) {
        return root.searchNode(parseXFAPath(path), 0)!.attributes![0].value;
      }

      assertEquals(getAttr("b.g"), "321");
      assertEquals(getAttr("e.f.g"), "321");
      assertEquals(getAttr("e.g"), "321");
      assertEquals(getAttr("g"), "321");
      assertEquals(getAttr("h.g"), "654");
      assertEquals(getAttr("b[0].g"), "321");
      assertEquals(getAttr("b[1].g"), "987");
      assertEquals(getAttr("b[1].g[0]"), "987");
      assertEquals(getAttr("b[1].g[1]"), "121110");
      assertEquals(getAttr("c"), "123");
      assertEquals(getAttr("c[1]"), "456");
      assertEquals(getAttr("c[2]"), "789");
      assertEquals(getAttr("c[3]"), "101112");
    });

    it("should dump a xml tree", () => {
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
        xml,
      )!.documentElement;
      const buffer: string[] = [];
      root.dump(buffer);

      assertEquals(
        buffer.join("").replace(/\s+/g, ""),
        xml.replace(/\s+/g, ""),
      );
    });
  });

  it("should parse processing instructions", () => {
    const xml = `
      <a>
          <?foo bar?>
          <?foo bar oof?>
          <?foo?>
      </a>`;
    const pi: [string, string][] = [];

    class MyParser extends XMLParserBase {
      override onPi(name: string, value: string) {
        pi.push([name, value]);
      }

      onCdata() {}
      onText() {}
      onBeginElement() {}
      onEndElement() {
        return undefined;
      }
      onError() {}
    }

    new MyParser().parseXml(xml);

    assertEquals(pi, [
      ["foo", "bar"],
      ["foo", "bar oof"],
      ["foo", ""],
    ]);
  });
});
/*80--------------------------------------------------------------------------*/
