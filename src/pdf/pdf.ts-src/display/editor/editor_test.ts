/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

/* Copyright 2022 Mozilla Foundation
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

import { assertEquals } from "@std/assert/mod.ts";
import { describe, it } from "@std/testing/bdd.ts";
import { CommandManager } from "./tools.ts";
/*80--------------------------------------------------------------------------*/

describe("editor", function () {
  describe("Command Manager", function () {
    it("should check undo/redo", function () {
      const manager = new CommandManager(4);
      let x = 0;
      const makeDoUndo = (n: number) => ({
        cmd: () => (x += n),
        undo: () => (x -= n),
      });

      manager.add({ ...makeDoUndo(1), mustExec: true });
      assertEquals(x, 1);

      manager.add({ ...makeDoUndo(2), mustExec: true });
      assertEquals(x, 3);

      manager.add({ ...makeDoUndo(3), mustExec: true });
      assertEquals(x, 6);

      manager.undo();
      assertEquals(x, 3);

      manager.undo();
      assertEquals(x, 1);

      manager.undo();
      assertEquals(x, 0);

      manager.undo();
      assertEquals(x, 0);

      manager.redo();
      assertEquals(x, 1);

      manager.redo();
      assertEquals(x, 3);

      manager.redo();
      assertEquals(x, 6);

      manager.redo();
      assertEquals(x, 6);

      manager.undo();
      assertEquals(x, 3);

      manager.redo();
      assertEquals(x, 6);
    });
  });

  it("should hit the limit of the manager", function () {
    const manager = new CommandManager(3);
    let x = 0;
    const makeDoUndo = (n: number) => ({
      cmd: () => (x += n),
      undo: () => (x -= n),
    });

    manager.add({ ...makeDoUndo(1), mustExec: true }); // 1
    manager.add({ ...makeDoUndo(2), mustExec: true }); // 3
    manager.add({ ...makeDoUndo(3), mustExec: true }); // 6
    manager.add({ ...makeDoUndo(4), mustExec: true }); // 10
    assertEquals(x, 10);

    manager.undo();
    manager.undo();
    assertEquals(x, 3);

    manager.undo();
    assertEquals(x, 1);

    manager.undo();
    assertEquals(x, 1);

    manager.redo();
    manager.redo();
    assertEquals(x, 6);
    manager.add({ ...makeDoUndo(5), mustExec: true });
    assertEquals(x, 11);
  });
});
/*80--------------------------------------------------------------------------*/
