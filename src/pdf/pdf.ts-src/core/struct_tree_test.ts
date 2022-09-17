/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

/* Copyright 2021 Mozilla Foundation
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

import { assertEquals } from "https://deno.land/std@0.154.0/testing/asserts.ts";
import { describe, it } from "https://deno.land/std@0.154.0/testing/bdd.ts";
import { getDocument, StructTreeNode } from "../display/api.ts";
import { buildGetDocumentParams } from "../shared/test_utils.ts";
/*80--------------------------------------------------------------------------*/

function equalTrees(rootA: StructTreeNode, rootB: StructTreeNode) {
  function walk(a: any, b: any) {
    assertEquals(a.role, b.role);
    assertEquals(a.lang, b.lang);
    assertEquals(a.type, b.type);
    assertEquals("children" in a, "children" in b);
    if (!a.children) {
      return;
    }
    assertEquals(a.children.length, b.children.length);
    for (let i = 0; i < rootA.children.length; i++) {
      walk(a.children[i], b.children[i]);
    }
  }
  return walk(rootA, rootB);
}

describe("struct tree", () => {
  describe("getStructTree", () => {
    it("parses basic structure", async () => {
      const filename = "structure_simple.pdf";
      const params = buildGetDocumentParams(filename);
      const loadingTask = getDocument(params);
      const doc = await loadingTask.promise;
      const page = await doc.getPage(1);
      const struct = (await page.getStructTree())!;
      equalTrees(
        {
          role: "Root",
          children: [
            {
              role: "Document",
              lang: "en-US",
              children: [
                {
                  role: "H1",
                  children: [
                    { role: "NonStruct", children: [{ type: "content" }] },
                  ],
                },
                {
                  role: "P",
                  children: [
                    { role: "NonStruct", children: [{ type: "content" }] },
                  ],
                },
                {
                  role: "H2",
                  children: [
                    { role: "NonStruct", children: [{ type: "content" }] },
                  ],
                },
                {
                  role: "P",
                  children: [
                    { role: "NonStruct", children: [{ type: "content" }] },
                  ],
                },
              ],
            },
          ],
        },
        struct,
      );
      await loadingTask.destroy();
    });

    it("parses structure with marked content reference", async () => {
      const filename = "issue6782.pdf";
      const params = buildGetDocumentParams(filename);
      const loadingTask = getDocument(params);
      const doc = await loadingTask.promise;
      const page = await doc.getPage(1);
      const struct = (await page.getStructTree())!;
      equalTrees(
        {
          role: "Root",
          children: [
            {
              role: "Part",
              children: [
                { role: "P", children: Array(27).fill({ type: "content" }) },
              ],
            },
          ],
        },
        struct,
      );
      await loadingTask.destroy();
    });
  });
});
/*80--------------------------------------------------------------------------*/
