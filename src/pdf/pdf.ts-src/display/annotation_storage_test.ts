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

import { assertEquals } from "https://deno.land/std@0.190.0/testing/asserts.ts";
import { describe, it } from "https://deno.land/std@0.190.0/testing/bdd.ts";
import { AnnotationStorage } from "./annotation_storage.ts";
/*80--------------------------------------------------------------------------*/

describe("AnnotationStorage", () => {
  describe("GetOrDefaultValue", () => {
    it("should get and set a new value in the annotation storage", () => {
      const annotationStorage = new AnnotationStorage();
      let value = annotationStorage.getValue("123A", {
        value: "hello world",
      }).value;
      assertEquals(value, "hello world");

      annotationStorage.setValue("123A", { value: "hello world" });

      // the second argument is the default value to use
      // if the key isn't in the storage
      value =
        annotationStorage.getValue("123A", { value: "an other string" }).value;
      assertEquals(value, "hello world");
    });

    it("should get set values and default ones in the annotation storage", () => {
      const annotationStorage = new AnnotationStorage();
      annotationStorage.setValue(
        "123A",
        {
          value: "hello world",
          hello: "world",
        } as any,
      );

      const result = annotationStorage.getValue(
        "123A",
        {
          value: "an other string",
          world: "hello",
        } as any,
      );
      assertEquals(result, {
        value: "hello world",
        hello: "world",
        world: "hello",
      } as any);
    });
  });

  describe("SetValue", () => {
    it("should set a new value in the annotation storage", () => {
      const annotationStorage = new AnnotationStorage();
      annotationStorage.setValue("123A", { value: "an other string" });
      const value = annotationStorage.getAll()!["123A"].value;
      console.assert(value === "an other string");
    });

    it("should call onSetModified() if value is changed", () => {
      const annotationStorage = new AnnotationStorage();
      let called = false;
      const callback = () => {
        called = true;
      };
      annotationStorage.onSetModified = callback;

      annotationStorage.setValue("asdf", { value: "original" });
      assertEquals(called, true);

      // changing value
      annotationStorage.setValue("asdf", { value: "modified" });
      assertEquals(called, true);

      // not changing value
      called = false;
      annotationStorage.setValue("asdf", { value: "modified" });
      assertEquals(called, false);
    });
  });

  describe("ResetModified", () => {
    it("should call onResetModified() if set", () => {
      const annotationStorage = new AnnotationStorage();
      let called = false;
      const callback = () => {
        called = true;
      };
      annotationStorage.onResetModified = callback;
      annotationStorage.setValue("asdf", { value: "original" });
      annotationStorage.resetModified();
      assertEquals(called, true);
      called = false;

      // not changing value
      annotationStorage.setValue("asdf", { value: "original" });
      annotationStorage.resetModified();
      assertEquals(called, false);

      // changing value
      annotationStorage.setValue("asdf", { value: "modified" });
      annotationStorage.resetModified();
      assertEquals(called, true);
    });
  });
});
/*80--------------------------------------------------------------------------*/
