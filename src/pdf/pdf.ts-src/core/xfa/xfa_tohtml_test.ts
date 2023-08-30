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

import {
  assertEquals,
  assertNotEquals,
} from "https://deno.land/std@0.195.0/testing/asserts.ts";
import { describe, it } from "https://deno.land/std@0.195.0/testing/bdd.ts";
import { XFAData } from "../document.ts";
import { XFAElObj, XFAHTMLAttrs, XFAHTMLObj } from "./alias.ts";
import { XFAFactory, XFAPages } from "./factory.ts";
/*80--------------------------------------------------------------------------*/

describe("XFAFactory", () => {
  function searchHtmlNode(
    root: XFAPages,
    name: "xfaName" | "name",
    value: string,
    byAttributes = false,
    nth = [0],
  ): XFAHTMLObj | undefined {
    if (
      (!byAttributes && root[name] === value) ||
      (byAttributes && root.attributes && root.attributes[name] === value)
    ) {
      if (nth[0]-- === 0) {
        return root;
      }
    }
    if (!root.children) {
      return undefined;
    }
    for (const child of root.children) {
      const node = searchHtmlNode(
        child as XFAPages,
        name,
        value,
        byAttributes,
        nth,
      );
      if (node) {
        return node;
      }
    }
    return undefined;
  }

  describe("toHTML", () => {
    it("should convert some basic properties to CSS", async () => {
      const xml = `
<?xml version="1.0"?>
<xdp:xdp xmlns:xdp="http://ns.adobe.com/xdp/">
  <template xmlns="http://www.xfa.org/schema/xfa-template/3.3">
    <subform name="root" mergeMode="matchTemplate">
      <pageSet>
        <pageArea>
          <contentArea x="123pt" w="456pt" h="789pt"/>
          <medium stock="default" short="456pt" long="789pt"/>
          <draw y="1pt" w="11pt" h="22pt" rotate="90" x="2pt">
            <assist><toolTip>A tooltip !!</toolTip></assist>
            <font size="7pt" typeface="FooBar" baselineShift="2pt">
              <fill>
                <color value="12,23,34"/>
                <solid/>
              </fill>
            </font>
            <value/>
            <margin topInset="1pt" bottomInset="2pt" leftInset="3pt" rightInset="4pt"/>
            <para spaceAbove="1pt" spaceBelow="2pt" textIndent="3pt" marginLeft="4pt" marginRight="5pt"/>
          </draw>
        </pageArea>
      </pageSet>
      <subform name="second">
        <breakBefore targetType="pageArea" startNew="1"/>
        <subform>
          <draw w="1pt" h="1pt"><value><text>foo</text></value></draw>
        </subform>
      </subform>
      <subform name="third">
        <breakBefore targetType="pageArea" startNew="1"/>
        <subform>
          <draw w="1pt" h="1pt"><value><text>bar</text></value></draw>
        </subform>
      </subform>
    </subform>
  </template>
  <xfa:datasets xmlns:xfa="http://www.xfa.org/schema/xfa-data/1.0/">
    <xfa:data>
    </xfa:data>
  </xfa:datasets>
</xdp:xdp>
      `;
      const factory = new XFAFactory({ "xdp:xdp": xml } as XFAData);
      factory.setFonts([]);

      //kkkk
      // assertEquals(await factory.getNumPages(), 2);

      //kkkk
      // const pages = await factory.getPages();
      // const page1 = pages.children[0];
      // assertEquals(page1.attributes!.style, {
      //   height: "789px",
      //   width: "456px",
      // });

      // assertEquals(page1.children!.length, 2);
      // const container = page1.children![1] as XFAElObj;
      // assertEquals(container.attributes!.class, ["xfaContentarea"]);
      // assertEquals(container.attributes!.style, {
      //   height: "789px",
      //   width: "456px",
      //   left: "123px",
      //   top: "0px",
      // });

      // const wrapper = page1.children![0] as XFAElObj;
      // const draw = wrapper.children![0] as XFAElObj;

      // assertEquals(wrapper.attributes!.class, ["xfaWrapper"]);
      // assertEquals(wrapper.attributes!.style, {
      //   alignSelf: "start",
      //   height: "22px",
      //   left: "2px",
      //   position: "absolute",
      //   top: "1px",
      //   transform: "rotate(-90deg)",
      //   transformOrigin: "top left",
      //   width: "11px",
      // });

      // assertEquals(draw.attributes!.class, [
      //   "xfaDraw",
      //   "xfaFont",
      //   "xfaWrapped",
      // ]);
      // assertEquals((draw.attributes as XFAHTMLAttrs).title, "A tooltip !!");
      // assertEquals(draw.attributes!.style, {
      //   color: "#0c1722",
      //   fontFamily: '"FooBar"',
      //   fontKerning: "none",
      //   letterSpacing: "0px",
      //   fontStyle: "normal",
      //   fontWeight: "normal",
      //   fontSize: "6.93px",
      //   padding: "1px 4px 2px 3px",
      //   verticalAlign: "2px",
      // });

      // // draw element must be on each page.
      // assertEquals(
      //   draw.attributes!.style,
      //   ((pages.children[1].children![0] as XFAElObj).children![0] as XFAElObj)
      //     .attributes!.style,
      // );
    });

    it("should have an alt attribute from toolTip", async () => {
      // if (isNodeJS) {
      //   pending("Image is not supported in Node.js.");
      // }
      const xml = `
<?xml version="1.0"?>
<xdp:xdp xmlns:xdp="http://ns.adobe.com/xdp/">
  <template xmlns="http://www.xfa.org/schema/xfa-template/3.3">
    <subform name="root" mergeMode="matchTemplate">
      <pageSet>
        <pageArea>
          <contentArea x="0pt" w="456pt" h="789pt"/>
          <draw name="BA-Logo" y="5.928mm" x="128.388mm" w="71.237mm" h="9.528mm">
            <value>
              <image contentType="image/png">iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=</image>
            </value>
            <assist><toolTip>alt text</toolTip></assist>
          </draw>
        </pageArea>
      </pageSet>
    </subform>
  </template>
  <xfa:datasets xmlns:xfa="http://www.xfa.org/schema/xfa-data/1.0/">
    <xfa:data>
    </xfa:data>
  </xfa:datasets>
</xdp:xdp>
      `;
      const factory = new XFAFactory({ "xdp:xdp": xml } as XFAData);

      //kkkk
      // assertEquals(await factory.getNumPages(), 1);

      //kkkk
      // const pages = await factory.getPages();
      // const field = searchHtmlNode(pages, "name", "img")!;

      // assertEquals(field.attributes!.alt, "alt text");
    });

    it("should have a aria heading role and level", async () => {
      const xml = `
<?xml version="1.0"?>
<xdp:xdp xmlns:xdp="http://ns.adobe.com/xdp/">
  <template xmlns="http://www.xfa.org/schema/xfa-template/3.3">
    <subform name="root" mergeMode="matchTemplate">
      <pageSet>
        <pageArea>
          <contentArea x="0pt" w="456pt" h="789pt"/>
          <medium stock="default" short="456pt" long="789pt"/>
          <draw name="BA-Logo" y="5.928mm" x="128.388mm" w="71.237mm" h="9.528mm">
            <value><text>foo</text></value>
            <assist role="H2"></assist>
          </draw>
        </pageArea>
      </pageSet>
    </subform>
  </template>
  <xfa:datasets xmlns:xfa="http://www.xfa.org/schema/xfa-data/1.0/">
    <xfa:data>
    </xfa:data>
  </xfa:datasets>
</xdp:xdp>
      `;
      const factory = new XFAFactory({ "xdp:xdp": xml } as XFAData);

      //kkkk
      // assertEquals(await factory.getNumPages(), 1);

      //kkkk
      // const pages = await factory.getPages();
      // const page1 = pages.children[0];
      // const wrapper = page1.children![0] as XFAElObj;
      // const draw = wrapper.children![0] as XFAElObj;

      // assertEquals((draw.attributes as XFAHTMLAttrs).role, "heading");
      // assertEquals((draw.attributes as XFAHTMLAttrs)["aria-level"], "2");
    });

    it("should have aria table role", async () => {
      const xml = `
<?xml version="1.0"?>
<xdp:xdp xmlns:xdp="http://ns.adobe.com/xdp/">
  <template xmlns="http://www.xfa.org/schema/xfa-template/3.3">
    <subform name="root" mergeMode="matchTemplate">
      <pageSet>
        <pageArea>
          <contentArea x="0pt" w="456pt" h="789pt"/>
          <medium stock="default" short="456pt" long="789pt"/>
          <font size="7pt" typeface="FooBar" baselineShift="2pt">
          </font>
        </pageArea>
      </pageSet>
      <subform name="table" mergeMode="matchTemplate" layout="table">
        <subform layout="row" name="row1">
          <assist role="TH"></assist>
          <draw name="header1" y="5.928mm" x="128.388mm" w="71.237mm" h="9.528mm">
            <value><text>Header Col 1</text></value>
          </draw>
          <draw name="header2" y="5.928mm" x="128.388mm" w="71.237mm" h="9.528mm">
            <value><text>Header Col 2</text></value>
          </draw>
        </subform>
        <subform layout="row" name="row2">
          <draw name="cell1" y="5.928mm" x="128.388mm" w="71.237mm" h="9.528mm">
            <value><text>Cell 1</text></value>
          </draw>
          <draw name="cell2" y="5.928mm" x="128.388mm" w="71.237mm" h="9.528mm">
            <value><text>Cell 2</text></value>
          </draw>
        </subform>
      </subform>
    </subform>
  </template>
  <xfa:datasets xmlns:xfa="http://www.xfa.org/schema/xfa-data/1.0/">
    <xfa:data>
    </xfa:data>
  </xfa:datasets>
</xdp:xdp>
      `;
      const factory = new XFAFactory({ "xdp:xdp": xml } as XFAData);
      factory.setFonts([]);

      //kkkk
      // assertEquals(await factory.getNumPages(), 1);

      //kkkk
      // const pages = await factory.getPages();
      // const table = searchHtmlNode(
      //   pages,
      //   "xfaName",
      //   "table",
      //   /* byAttributes */ true,
      // )!;
      // assertEquals(table.attributes!.role, "table");
      // const headerRow = searchHtmlNode(
      //   pages,
      //   "xfaName",
      //   "row1",
      //   /* byAttributes */ true,
      // )!;
      // assertEquals(headerRow.attributes!.role, "row");
      // const headerCell = searchHtmlNode(
      //   pages,
      //   "xfaName",
      //   "header2",
      //   /* byAttributes */ true,
      // )!;
      // assertEquals(headerCell.attributes!.role, "columnheader");
      // const row = searchHtmlNode(
      //   pages,
      //   "xfaName",
      //   "row2",
      //   /* byAttributes */ true,
      // )!;
      // assertEquals(row.attributes!.role, "row");
      // const cell = searchHtmlNode(
      //   pages,
      //   "xfaName",
      //   "cell2",
      //   /* byAttributes */ true,
      // )!;
      // assertEquals(cell.attributes!.role, "cell");
    });

    it("should have a maxLength property", async () => {
      const xml = `
<?xml version="1.0"?>
<xdp:xdp xmlns:xdp="http://ns.adobe.com/xdp/">
  <template xmlns="http://www.xfa.org/schema/xfa-template/3.3">
    <subform name="root" mergeMode="matchTemplate">
      <pageSet>
        <pageArea>
          <contentArea x="0pt" w="456pt" h="789pt"/>
          <medium stock="default" short="456pt" long="789pt"/>
          <field y="1pt" w="11pt" h="22pt" x="2pt">
            <ui>
              <textEdit multiLine="0"/>
            </ui>
            <value>
              <text maxChars="123"/>
            </value>
          </field>
        </pageArea>
      </pageSet>
      <subform name="first">
        <draw w="1pt" h="1pt"><value><text>foo</text></value></draw>
      </subform>
    </subform>
  </template>
  <xfa:datasets xmlns:xfa="http://www.xfa.org/schema/xfa-data/1.0/">
    <xfa:data>
    </xfa:data>
  </xfa:datasets>
</xdp:xdp>
      `;
      const factory = new XFAFactory({ "xdp:xdp": xml } as XFAData);

      //kkkk
      // assertEquals(await factory.getNumPages(), 1);

      //kkkk
      // const pages = await factory.getPages();
      // const field = searchHtmlNode(pages, "name", "input")!;

      // assertEquals(field.attributes!.maxLength, 123);
    });

    it("should have an aria-label property from speak", async () => {
      const xml = `
<?xml version="1.0"?>
<xdp:xdp xmlns:xdp="http://ns.adobe.com/xdp/">
  <template xmlns="http://www.xfa.org/schema/xfa-template/3.3">
    <subform name="root" mergeMode="matchTemplate">
      <pageSet>
        <pageArea>
          <contentArea x="0pt" w="456pt" h="789pt"/>
          <medium stock="default" short="456pt" long="789pt"/>
          <field y="1pt" w="11pt" h="22pt" x="2pt">
            <assist><speak>Screen Reader</speak></assist>
            <ui>
              <textEdit multiLine="0"/>
            </ui>
            <value>
              <text maxChars="123"/>
            </value>
          </field>
        </pageArea>
      </pageSet>
      <subform name="first">
        <draw w="1pt" h="1pt"><value><text>foo</text></value></draw>
      </subform>
    </subform>
  </template>
  <xfa:datasets xmlns:xfa="http://www.xfa.org/schema/xfa-data/1.0/">
    <xfa:data>
    </xfa:data>
  </xfa:datasets>
</xdp:xdp>
      `;
      const factory = new XFAFactory({ "xdp:xdp": xml } as XFAData);

      //kkkk
      // assertEquals(await factory.getNumPages(), 1);

      //kkkk
      // const pages = await factory.getPages();
      // const field = searchHtmlNode(pages, "name", "input")!;

      // assertEquals(field.attributes!["aria-label"], "Screen Reader");
    });

    it("should have an aria-label property from toolTip", async () => {
      const xml = `
<?xml version="1.0"?>
<xdp:xdp xmlns:xdp="http://ns.adobe.com/xdp/">
  <template xmlns="http://www.xfa.org/schema/xfa-template/3.3">
    <subform name="root" mergeMode="matchTemplate">
      <pageSet>
        <pageArea>
          <contentArea x="0pt" w="456pt" h="789pt"/>
          <medium stock="default" short="456pt" long="789pt"/>
          <field y="1pt" w="11pt" h="22pt" x="2pt">
            <assist><toolTip>Screen Reader</toolTip></assist>
            <ui>
              <textEdit multiLine="0"/>
            </ui>
            <value>
              <text maxChars="123"/>
            </value>
          </field>
        </pageArea>
      </pageSet>
      <subform name="first">
        <draw w="1pt" h="1pt"><value><text>foo</text></value></draw>
      </subform>
    </subform>
  </template>
  <xfa:datasets xmlns:xfa="http://www.xfa.org/schema/xfa-data/1.0/">
    <xfa:data>
    </xfa:data>
  </xfa:datasets>
</xdp:xdp>
      `;
      const factory = new XFAFactory({ "xdp:xdp": xml } as XFAData);

      //kkkk
      // assertEquals(await factory.getNumPages(), 1);

      //kkkk
      // const pages = await factory.getPages();
      // const field = searchHtmlNode(pages, "name", "input")!;

      // assertEquals(field.attributes!["aria-label"], "Screen Reader");
    });

    it("should have an input or textarea", async () => {
      const xml = `
<?xml version="1.0"?>
<xdp:xdp xmlns:xdp="http://ns.adobe.com/xdp/">
  <template xmlns="http://www.xfa.org/schema/xfa-template/3.3">
    <subform name="root" mergeMode="matchTemplate">
      <pageSet>
        <pageArea>
          <contentArea x="123pt" w="456pt" h="789pt"/>
          <medium stock="default" short="456pt" long="789pt"/>
          <field y="1pt" w="11pt" h="22pt" x="2pt">
            <ui>
              <textEdit/>
            </ui>
          </field>
          <field y="1pt" w="11pt" h="22pt" x="2pt">
            <ui>
              <textEdit multiLine="1"/>
            </ui>
          </field>
        </pageArea>
      </pageSet>
      <subform name="first">
        <draw w="1pt" h="1pt"><value><text>foo</text></value></draw>
      </subform>
    </subform>
  </template>
  <xfa:datasets xmlns:xfa="http://www.xfa.org/schema/xfa-data/1.0/">
    <xfa:data>
    </xfa:data>
  </xfa:datasets>
</xdp:xdp>
      `;
      const factory = new XFAFactory({ "xdp:xdp": xml } as XFAData);

      //kkkk
      // assertEquals(await factory.getNumPages(), 1);

      //kkkk
      // const pages = await factory.getPages();
      // const field1 = searchHtmlNode(pages, "name", "input");
      // assertNotEquals(field1, undefined);

      // const field2 = searchHtmlNode(pages, "name", "textarea");
      // assertNotEquals(field2, undefined);
    });
  });

  it("should have an input or textarea", async () => {
    const xml = `
<?xml version="1.0"?>
<xdp:xdp xmlns:xdp="http://ns.adobe.com/xdp/">
  <template xmlns="http://www.xfa.org/schema/xfa-template/3.3">
    <subform name="root" mergeMode="matchTemplate">
      <pageSet>
        <pageArea>
          <contentArea x="123pt" w="456pt" h="789pt"/>
          <medium stock="default" short="456pt" long="789pt"/>
          <field y="1pt" w="11pt" h="22pt" x="2pt">
            <ui>
              <textEdit multiLine="1"/>
            </ui>
          </field>
        </pageArea>
      </pageSet>
      <subform name="first">
        <field y="1pt" w="11pt" h="22pt" x="2pt" name="hello">
          <ui>
            <textEdit/>
          </ui>
          <value>
            <integer/>
          </value>
        </field>
      </subform>
    </subform>
  </template>
  <xfa:datasets xmlns:xfa="http://www.xfa.org/schema/xfa-data/1.0/">
    <xfa:data>
      <toto>
        <first>
          <hello>123
          </hello>
        </first>
      </toto>
    </xfa:data>
  </xfa:datasets>
</xdp:xdp>
    `;
    const factory = new XFAFactory({ "xdp:xdp": xml } as XFAData);

    //kkkk
    // assertEquals(await factory.getNumPages(), 1);

    //kkkk
    // const pages = await factory.getPages();
    // const field1 = searchHtmlNode(pages, "name", "input")!;
    // assertNotEquals(field1, undefined);
    // assertEquals(field1.attributes!.value, "123");
  });

  it("should parse URLs correctly", async () => {
    function getXml(href: string) {
      return `
<?xml version="1.0"?>
<xdp:xdp xmlns:xdp="http://ns.adobe.com/xdp/">
  <template xmlns="http://www.xfa.org/schema/xfa-template/3.3">
    <subform name="root" mergeMode="matchTemplate">
      <pageSet>
        <pageArea>
          <contentArea x="0pt" w="456pt" h="789pt"/>
          <medium stock="default" short="456pt" long="789pt"/>
          <draw name="url" y="5.928mm" x="128.388mm" w="71.237mm" h="9.528mm">
            <value>
              <exData contentType="text/html">
                <body xmlns="http://www.w3.org/1999/xhtml">
                  <a href="${href}">${href}</a>
                </body>
              </exData>
            </value>
          </draw>
        </pageArea>
      </pageSet>
    </subform>
  </template>
  <xfa:datasets xmlns:xfa="http://www.xfa.org/schema/xfa-data/1.0/">
    <xfa:data>
    </xfa:data>
  </xfa:datasets>
</xdp:xdp>
      `;
    }
    let factory, pages, a;

    // A valid, and complete, URL.
    factory = new XFAFactory(
      { "xdp:xdp": getXml("https://www.example.com/") } as XFAData,
    );
    //kkkk
    // assertEquals(await factory.getNumPages(), 1);

    //kkkk
    // pages = await factory.getPages();
    // a = searchHtmlNode(pages, "name", "a")!;
    // assertEquals(a.value, "https://www.example.com/");
    // assertEquals(a.attributes!.href, "https://www.example.com/");

    // A valid, but incomplete, URL.
    factory = new XFAFactory(
      { "xdp:xdp": getXml("www.example.com/") } as XFAData,
    );
    //kkkk
    // assertEquals(await factory.getNumPages(), 1);

    //kkkk
    // pages = await factory.getPages();
    // a = searchHtmlNode(pages, "name", "a")!;
    // assertEquals(a.value, "www.example.com/");
    // assertEquals(a.attributes!.href, "http://www.example.com/");

    // A valid email-address.
    factory = new XFAFactory(
      { "xdp:xdp": getXml("mailto:test@example.com") } as XFAData,
    );
    //kkkk
    // assertEquals(await factory.getNumPages(), 1);

    //kkkk
    // pages = await factory.getPages();
    // a = searchHtmlNode(pages, "name", "a")!;
    // assertEquals(a.value, "mailto:test@example.com");
    // assertEquals(a.attributes!.href, "mailto:test@example.com");

    // Not a valid URL.
    factory = new XFAFactory({ "xdp:xdp": getXml("qwerty/") } as XFAData);
    //kkkk
    // assertEquals(await factory.getNumPages(), 1);

    //kkkk
    // pages = await factory.getPages();
    // a = searchHtmlNode(pages, "name", "a")!;
    // assertEquals(a.value, "qwerty/");
    // assertEquals(a.attributes!.href, "");
  });

  it("should replace button with an URL by a link", async () => {
    const xml = `
<?xml version="1.0"?>
<xdp:xdp xmlns:xdp="http://ns.adobe.com/xdp/">
  <template xmlns="http://www.xfa.org/schema/xfa-template/3.3">
    <subform name="root" mergeMode="matchTemplate">
      <pageSet>
        <pageArea>
          <contentArea x="123pt" w="456pt" h="789pt"/>
          <medium stock="default" short="456pt" long="789pt"/>
        </pageArea>
      </pageSet>
      <subform name="first">
        <field y="1pt" w="11pt" h="22pt" x="2pt">
          <ui>
            <button/>
          </ui>
          <event activity="click" name="event__click">
            <script contentType="application/x-javascript">
              app.launchURL("https://github.com/mozilla/pdf.js", true);
            </script>
          </event>
        </field>
        <field y="1pt" w="11pt" h="22pt" x="2pt">
          <ui>
            <button/>
          </ui>
          <event activity="click" name="event__click">
            <script contentType="application/x-javascript">
              xfa.host.gotoURL("https://github.com/allizom/pdf.js");
            </script>
          </event>
        </field>
      </subform>
    </subform>
  </template>
  <xfa:datasets xmlns:xfa="http://www.xfa.org/schema/xfa-data/1.0/">
    <xfa:data>
    </xfa:data>
  </xfa:datasets>
</xdp:xdp>
    `;
    const factory = new XFAFactory({ "xdp:xdp": xml } as XFAData);

    //kkkk
    // assertEquals(await factory.getNumPages(), 1);

    //kkkk
    // const pages = await factory.getPages();
    // let a = searchHtmlNode(pages, "name", "a")!;
    // assertEquals(a.attributes!.href, "https://github.com/mozilla/pdf.js");
    // assertEquals(a.attributes!.newWindow, true);

    // a = searchHtmlNode(pages, "name", "a", false, [1])!;
    // assertEquals(a.attributes!.href, "https://github.com/allizom/pdf.js");
    // assertEquals(a.attributes!.newWindow, false);
  });
});
