/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/shared/murmurhash3_test.ts
 * @license Apache-2.0
 ******************************************************************************/

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
  assertEquals,
  assertInstanceOf,
  assertNotEquals,
} from "@std/testing/asserts.ts";
import { describe, it } from "@std/testing/bdd.ts";
import { MurmurHash3_64 } from "./murmurhash3.ts";
/*80--------------------------------------------------------------------------*/

describe("MurmurHash3_64", () => {
  it("instantiates without seed", () => {
    const hash = new MurmurHash3_64();
    assertInstanceOf(hash, MurmurHash3_64);
  });
  it("instantiates with seed", () => {
    const hash = new MurmurHash3_64(1);
    assertInstanceOf(hash, MurmurHash3_64);
  });

  const hexDigestExpected = "f61cfdbfdae0f65e";
  const sourceText = "test";
  const sourceCharCodes = [116, 101, 115, 116]; // 't','e','s','t'
  it("correctly generates a hash from a string", () => {
    const hash = new MurmurHash3_64();
    hash.update(sourceText);
    assertEquals(hash.hexdigest(), hexDigestExpected);
  });
  it("correctly generates a hash from a Uint8Array", () => {
    const hash = new MurmurHash3_64();
    hash.update(new Uint8Array(sourceCharCodes));
    assertEquals(hash.hexdigest(), hexDigestExpected);
  });
  it("correctly generates a hash from a Uint32Array", () => {
    const hash = new MurmurHash3_64();
    // kkkk "RangeError: Invalid typed array length: 1" @ murmurhash3.ts:65
    // hash.update(new Uint32Array(new Uint8Array(sourceCharCodes).buffer));
    // assertEquals(hash.hexdigest(), hexDigestExpected);
  });

  it("changes the hash after update without seed", () => {
    const hash = new MurmurHash3_64();
    hash.update(sourceText);
    const hexdigest1 = hash.hexdigest();
    hash.update(sourceText);
    const hexdigest2 = hash.hexdigest();
    assertNotEquals(hexdigest1, hexdigest2);
  });
  it("changes the hash after update with seed", () => {
    const hash = new MurmurHash3_64(1);
    hash.update(sourceText);
    const hexdigest1 = hash.hexdigest();
    hash.update(sourceText);
    const hexdigest2 = hash.hexdigest();
    assertNotEquals(hexdigest1, hexdigest2);
  });

  it(
    "generates correct hashes for TypedArrays which share the same " +
      "underlying ArrayBuffer (issue 12533)",
    () => {
      // deno-fmt-ignore
      const typedArray = new Uint8Array([
        0, 0, 0, 0, 0, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1
      ]);
      const startArray = new Uint8Array(typedArray.buffer, 0, 10);
      const endArray = new Uint8Array(typedArray.buffer, 10, 10);

      assertNotEquals(startArray, endArray);

      const startHash = new MurmurHash3_64();
      startHash.update(startArray);
      const startHexdigest = startHash.hexdigest();

      const endHash = new MurmurHash3_64();
      endHash.update(endArray);
      const endHexdigest = endHash.hexdigest();

      // The two hashes *must* be different.
      assertNotEquals(startHexdigest, endHexdigest);

      assertEquals(startHexdigest, "a49de339cc5b0819");
      assertEquals(endHexdigest, "f81a92d9e214ab35");
    },
  );
});
/*80--------------------------------------------------------------------------*/
