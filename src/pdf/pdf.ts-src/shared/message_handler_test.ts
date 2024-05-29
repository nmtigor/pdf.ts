/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/shared/message_handler_test.ts
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

import { PromiseCap } from "@fe-lib/util/PromiseCap.ts";
import { assertEquals, fail } from "@std/assert/mod.ts";
import { describe, it } from "@std/testing/bdd.ts";
import { LoopbackPort } from "../display/api.ts";
import { MessageHandler, type Thread } from "../shared/message_handler.ts";
import { AbortException } from "./util.ts";
/*80--------------------------------------------------------------------------*/

describe("message_handler", () => {
  // Sleep function to wait for sometime, similar to setTimeout but faster.
  function sleep(ticks: number): Promise<number> {
    return Promise.resolve().then(() => ticks && sleep(ticks - 1));
  }

  describe("sendWithStream", () => {
    it("should return a ReadableStream", () => {
      const port = new LoopbackPort();
      const messageHandler1 = new MessageHandler<Thread.main>(
        "main",
        "worker",
        port,
      );
      const readable = (messageHandler1 as any).sendWithStream("fakeHandler");
      // Check if readable is an instance of ReadableStream.
      assertEquals(typeof readable, "object");
      assertEquals(typeof readable.getReader, "function");
    });

    it("should read using a reader", async () => {
      let log = "";
      const port = new LoopbackPort();
      const messageHandler1 = new MessageHandler<Thread.main>(
        "main",
        "worker",
        port,
      );
      const messageHandler2 = new MessageHandler<Thread.worker>(
        "worker",
        "main",
        port,
      );
      messageHandler2.on("fakeHandler", (data, sink) => {
        sink.onPull = () => {
          log += "p";
        };
        sink.onCancel = (reason) => {
          log += "c";
        };
        sink.ready
          .then(() => {
            sink.enqueue("hi");
            return sink.ready;
          })
          .then(() => {
            sink.close?.();
          });
        return sleep(5);
      });
      const readable = messageHandler1.sendWithStream(
        "fakeHandler",
        {},
        {
          highWaterMark: 1,
          size() {
            return 1;
          },
        },
      );

      const reader = readable.getReader();
      await sleep(10);
      assertEquals(log, "");

      let result = await reader.read();
      assertEquals(log, "p");
      assertEquals(result.value, "hi");
      assertEquals(result.done, false);

      await sleep(10);
      result = await reader.read();
      assertEquals(result.value, undefined);
      assertEquals(result.done, true);
    });

    it("should not read any data when cancelled", async () => {
      let log = "";
      const port = new LoopbackPort();
      const messageHandler2 = new MessageHandler<Thread.worker>(
        "worker",
        "main",
        port,
      );
      messageHandler2.on("fakeHandler", (data, sink) => {
        sink.onPull = () => {
          log += "p";
        };
        sink.onCancel = (reason) => {
          log += "c";
        };
        log += "0";
        sink.ready
          .then(() => {
            log += "1";
            sink.enqueue([1, 2, 3, 4], 4);
            return sink.ready;
          })
          .then(() => {
            log += "2";
            sink.enqueue([5, 6, 7, 8], 4);
            return sink.ready;
          })
          .then(
            () => {
              log += "3";
              sink.close?.();
            },
            () => {
              log += "4";
            },
          );
      });
      const messageHandler1 = new MessageHandler<Thread.main>(
        "main",
        "worker",
        port,
      );
      const readable = messageHandler1.sendWithStream(
        "fakeHandler",
        {},
        {
          highWaterMark: 4,
          size(arr) {
            return arr.length;
          },
        },
      );

      const reader = readable.getReader();
      await sleep(10);
      assertEquals(log, "01");

      const result = await reader.read();
      assertEquals(result.value, [1, 2, 3, 4]);
      assertEquals(result.done, false);

      await sleep(10);
      assertEquals(log, "01p2");

      await reader.cancel(new AbortException("reader cancelled."));
      assertEquals(log, "01p2c4");
    });

    it("should not read when errored", async () => {
      let log = "";
      const port = new LoopbackPort();
      const messageHandler2 = new MessageHandler<Thread.worker>(
        "worker",
        "main",
        port,
      );
      messageHandler2.on("fakeHandler", (data, sink) => {
        sink.onPull = () => {
          log += "p";
        };
        sink.onCancel = (reason) => {
          log += "c";
        };
        log += "0";
        sink.ready
          .then(() => {
            log += "1";
            sink.enqueue([1, 2, 3, 4], 4);
            return sink.ready;
          })
          .then(() => {
            log += "e";
            sink.error?.(new Error("should not read when errored"));
          });
      });
      const messageHandler1 = new MessageHandler("main", "worker", port);
      const readable = messageHandler1.sendWithStream(
        "fakeHandler",
        {},
        {
          highWaterMark: 4,
          size(arr) {
            return arr.length;
          },
        },
      );

      const reader = readable.getReader();
      await sleep(10);
      assertEquals(log, "01");

      const result = await reader.read();
      assertEquals(result.value, [1, 2, 3, 4]);
      assertEquals(result.done, false);

      try {
        await reader.read();

        fail("Shouldn't get here.");
      } catch (reason) {
        assertEquals(log, "01pe");
        // assertInstanceOf(reason, UnknownErrorException);
        assertEquals(reason?.name, "UnknownErrorException");
        assertEquals(reason.message, "should not read when errored");
      }
    });

    it("should read data with blocking promise", async () => {
      let log = "";
      const port = new LoopbackPort();
      const messageHandler2 = new MessageHandler<Thread.worker>(
        "worker",
        "main",
        port,
      );
      messageHandler2.on("fakeHandler", (data, sink) => {
        sink.onPull = () => {
          log += "p";
        };
        sink.onCancel = (reason) => {
          log += "c";
        };
        log += "0";
        sink.ready
          .then(() => {
            log += "1";
            sink.enqueue([1, 2, 3, 4], 4);
            return sink.ready;
          })
          .then(() => {
            log += "2";
            sink.enqueue([5, 6, 7, 8], 4);
            return sink.ready;
          })
          .then(() => {
            sink.close?.();
          });
      });

      const messageHandler1 = new MessageHandler<Thread.main>(
        "main",
        "worker",
        port,
      );
      const readable = messageHandler1.sendWithStream(
        "fakeHandler",
        {},
        {
          highWaterMark: 4,
          size(arr) {
            return arr.length;
          },
        },
      );

      const reader = readable.getReader();
      // Sleep for 10ms, so that read() is not unblocking the ready promise.
      // Chain all read() to stream in sequence.
      await sleep(10);
      assertEquals(log, "01");

      let result = await reader.read();
      assertEquals(result.value, [1, 2, 3, 4]);
      assertEquals(result.done, false);

      await sleep(10);
      assertEquals(log, "01p2");

      result = await reader.read();
      assertEquals(result.value, [5, 6, 7, 8]);
      assertEquals(result.done, false);

      await sleep(10);
      assertEquals(log, "01p2p");

      result = await reader.read();
      assertEquals(result.value, undefined);
      assertEquals(result.done, true);
    });

    it(
      "should read data with blocking promise and buffer whole data" +
        " into stream",
      async () => {
        let log = "";
        const port = new LoopbackPort();
        const messageHandler2 = new MessageHandler<Thread.worker>(
          "worker",
          "main",
          port,
        );
        messageHandler2.on("fakeHandler", (data, sink) => {
          sink.onPull = () => {
            log += "p";
          };
          sink.onCancel = (reason) => {
            log += "c";
          };
          log += "0";
          sink.ready
            .then(() => {
              log += "1";
              sink.enqueue([1, 2, 3, 4], 4);
              return sink.ready;
            })
            .then(() => {
              log += "2";
              sink.enqueue([5, 6, 7, 8], 4);
              return sink.ready;
            })
            .then(() => {
              sink.close?.();
            });
          return sleep(10);
        });

        const messageHandler1 = new MessageHandler<Thread.main>(
          "main",
          "worker",
          port,
        );
        const readable = messageHandler1.sendWithStream(
          "fakeHandler",
          {},
          {
            highWaterMark: 8,
            size(arr) {
              return arr.length;
            },
          },
        );

        const reader = readable.getReader();
        await sleep(10);
        assertEquals(log, "012");

        let result = await reader.read();
        assertEquals(result.value, [1, 2, 3, 4]);
        assertEquals(result.done, false);

        await sleep(10);
        assertEquals(log, "012p");

        result = await reader.read();
        assertEquals(result.value, [5, 6, 7, 8]);
        assertEquals(result.done, false);

        await sleep(10);
        assertEquals(log, "012p");

        result = await reader.read();
        assertEquals(result.value, undefined);
        assertEquals(result.done, true);
      },
    );

    it("should ignore any pull after close is called", async () => {
      let log = "";
      const port = new LoopbackPort();
      const { promise, resolve } = new PromiseCap();
      const messageHandler2 = new MessageHandler<Thread.worker>(
        "worker",
        "main",
        port,
      );
      messageHandler2.on("fakeHandler", (data, sink) => {
        sink.onPull = () => {
          log += "p";
        };
        sink.onCancel = (reason) => {
          log += "c";
        };
        log += "0";
        sink.ready.then(() => {
          log += "1";
          sink.enqueue([1, 2, 3, 4], 4);
        });
        return promise.then(() => {
          sink.close?.();
        }) as any;
      });

      const messageHandler1 = new MessageHandler<Thread.main>(
        "main",
        "worker",
        port,
      );
      const readable = messageHandler1.sendWithStream(
        "fakeHandler",
        {},
        {
          highWaterMark: 10,
          size(arr) {
            return arr.length;
          },
        },
      );

      const reader = readable.getReader();
      await sleep(10);
      assertEquals(log, "01");

      resolve();
      await promise;

      let result = await reader.read();
      assertEquals(result.value, [1, 2, 3, 4]);
      assertEquals(result.done, false);

      await sleep(10);
      assertEquals(log, "01");

      result = await reader.read();
      assertEquals(result.value, undefined);
      assertEquals(result.done, true);
    });
  });
});
/*80--------------------------------------------------------------------------*/
