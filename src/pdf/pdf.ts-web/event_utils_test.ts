/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

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
  fail,
} from "https://deno.land/std@0.170.0/testing/asserts.ts";
import {
  afterAll,
  beforeAll,
  describe,
  it,
} from "https://deno.land/std@0.170.0/testing/bdd.ts";
import { EventBus, waitOnEventOrTimeout, WaitOnType } from "./event_utils.ts";
import { html } from "../../lib/dom.ts";
/*80--------------------------------------------------------------------------*/

describe("event_utils", () => {
  describe("EventBus", () => {
    it("dispatch event", () => {
      const eventBus = new EventBus();
      let count = 0;
      eventBus.on("test", (evt) => {
        assertEquals(evt, undefined);
        count++;
      });
      (eventBus as any).dispatch("test");
      assertEquals(count, 1);
    });
    it("dispatch event with arguments", () => {
      const eventBus = new EventBus();
      let count = 0;
      eventBus.on("test", (evt) => {
        assertEquals(evt, { abc: 123 });
        count++;
      });
      eventBus.dispatch("test", {
        abc: 123,
      });
      assertEquals(count, 1);
    });
    it("dispatch different event", () => {
      const eventBus = new EventBus();
      let count = 0;
      eventBus.on("test", () => {
        count++;
      });
      (eventBus as any).dispatch("nottest");
      assertEquals(count, 0);
    });
    it("dispatch event multiple times", () => {
      const eventBus = new EventBus();
      let count = 0;
      (eventBus as any).dispatch("test");
      eventBus.on("test", () => {
        count++;
      });
      (eventBus as any).dispatch("test");
      (eventBus as any).dispatch("test");
      assertEquals(count, 2);
    });
    it("dispatch event to multiple handlers", () => {
      const eventBus = new EventBus();
      let count = 0;
      eventBus.on("test", () => {
        count++;
      });
      eventBus.on("test", () => {
        count++;
      });
      (eventBus as any).dispatch("test");
      assertEquals(count, 2);
    });
    it("dispatch to detached", () => {
      const eventBus = new EventBus();
      let count = 0;
      const listener = () => {
        count++;
      };
      eventBus.on("test", listener);
      (eventBus as any).dispatch("test");
      eventBus.off("test", listener);
      (eventBus as any).dispatch("test");
      assertEquals(count, 1);
    });
    it("dispatch to wrong detached", () => {
      const eventBus = new EventBus();
      let count = 0;
      eventBus.on("test", () => {
        count++;
      });
      (eventBus as any).dispatch("test");
      eventBus.off("test", () => {
        count++;
      });
      (eventBus as any).dispatch("test");
      assertEquals(count, 2);
    });
    it("dispatch to detached during handling", () => {
      const eventBus = new EventBus();
      let count = 0;
      const listener1 = () => {
        eventBus.off("test", listener2);
        count++;
      };
      const listener2 = () => {
        eventBus.off("test", listener1);
        count++;
      };
      eventBus.on("test", listener1);
      eventBus.on("test", listener2);
      (eventBus as any).dispatch("test");
      (eventBus as any).dispatch("test");
      assertEquals(count, 2);
    });

    it("dispatch event to handlers with/without 'once' option", () => {
      const eventBus = new EventBus();
      let multipleCount = 0,
        onceCount = 0;

      eventBus.on("test", () => {
        multipleCount++;
      });
      eventBus.on(
        "test",
        () => {
          onceCount++;
        },
        { once: true },
      );

      (eventBus as any).dispatch("test");
      (eventBus as any).dispatch("test");
      (eventBus as any).dispatch("test");

      assertEquals(multipleCount, 3);
      assertEquals(onceCount, 1);
    });

    //kkkk "ReferenceError: document is not defined"
    it.ignore("should not re-dispatch to DOM", async () => {
      // if (isNodeJS) {
      //   pending("Document is not supported in Node.js.");
      // }
      const eventBus = new EventBus();
      let count = 0;
      eventBus.on("test", (evt) => {
        assertEquals(evt, undefined);
        count++;
      });
      function domEventListener() {
        fail("Shouldn't get here.");
      }
      document.addEventListener("test", domEventListener);

      (eventBus as any).dispatch("test");

      await Promise.resolve();
      assertEquals(count, 1);

      document.removeEventListener("test", domEventListener);
    });
  });

  describe("waitOnEventOrTimeout", () => {
    let eventBus: EventBus;

    beforeAll(() => {
      eventBus = new EventBus();
    });

    afterAll(() => {
      eventBus = undefined as any;
    });

    it("should reject invalid parameters", async () => {
      const invalidTarget = waitOnEventOrTimeout({
        target: "window",
        name: "DOMContentLoaded",
      } as any).then(
        () => {
          fail("Shouldn't get here.");
        },
        (reason) => {
          assertInstanceOf(reason, Error);
        },
      );

      const invalidName = waitOnEventOrTimeout({
        target: eventBus,
        name: "",
      } as any).then(
        () => {
          fail("Shouldn't get here.");
        },
        (reason) => {
          assertInstanceOf(reason, Error);
        },
      );

      const invalidDelay = waitOnEventOrTimeout({
        target: eventBus,
        name: "pagerendered",
        delay: -1000,
      }).then(
        () => {
          fail("Shouldn't get here.");
        },
        (reason) => {
          assertInstanceOf(reason, Error);
        },
      );

      await Promise.all([invalidTarget, invalidName, invalidDelay]);
    });

    //kkkk "ReferenceError: document is not defined"
    it.ignore("should resolve on event, using the DOM", async () => {
      // if (isNodeJS) {
      //   pending("Document is not supported in Node.js.");
      // }
      const button = html("button");

      const buttonClicked = waitOnEventOrTimeout({
        target: button,
        name: "click",
        delay: 10000,
      } as any);
      // Immediately dispatch the expected event.
      button.click();

      const type = await buttonClicked;
      assertEquals(type, WaitOnType.EVENT);
    });

    //kkkk "ReferenceError: document is not defined"
    it.ignore("should resolve on timeout, using the DOM", async () => {
      // if (isNodeJS) {
      //   pending("Document is not supported in Node.js.");
      // }
      const button = html("button");

      const buttonClicked = waitOnEventOrTimeout({
        target: button,
        name: "click",
        delay: 10,
      } as any);
      // Do *not* dispatch the event, and wait for the timeout.

      const type = await buttonClicked;
      assertEquals(type, WaitOnType.TIMEOUT);
    });

    it("should resolve on event, using the EventBus", async () => {
      const pageRendered = waitOnEventOrTimeout({
        target: eventBus,
        name: "pagerendered",
        delay: 10000,
      });
      // Immediately dispatch the expected event.
      (eventBus as any).dispatch("pagerendered");

      const type = await pageRendered;
      assertEquals(type, WaitOnType.EVENT);
    });

    it("should resolve on timeout, using the EventBus", async () => {
      const pageRendered = waitOnEventOrTimeout({
        target: eventBus,
        name: "pagerendered",
        delay: 10,
      });
      // Do *not* dispatch the event, and wait for the timeout.

      const type = await pageRendered;
      assertEquals(type, WaitOnType.TIMEOUT);
    });
  });
});
/*80--------------------------------------------------------------------------*/
