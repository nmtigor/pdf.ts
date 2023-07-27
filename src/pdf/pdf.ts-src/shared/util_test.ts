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
  assertThrows,
} from "https://deno.land/std@0.190.0/testing/asserts.ts";
import { describe, it } from "https://deno.land/std@0.190.0/testing/bdd.ts";
import { PromiseCap } from "../../../lib/util/PromiseCap.ts";
import {
  bytesToString,
  createValidAbsoluteUrl,
  getModificationDate,
  isArrayBuffer,
  string32,
  stringToBytes,
  stringToPDFString,
} from "./util.ts";
/*80--------------------------------------------------------------------------*/

describe("util", () => {
  describe("bytesToString", () => {
    it("handles non-array arguments", () => {
      assertThrows(
        () => {
          bytesToString(null as any);
        },
        Error,
        "Invalid argument for bytesToString",
      );
    });

    it("handles array arguments with a length not exceeding the maximum", () => {
      assertEquals(bytesToString(new Uint8Array([])), "");
      assertEquals(bytesToString(new Uint8Array([102, 111, 111])), "foo");
    });

    it("handles array arguments with a length exceeding the maximum", () => {
      const length = 10000; // Larger than MAX_ARGUMENT_COUNT = 8192.

      // Create an array with `length` 'a' character codes.
      const bytes = new Uint8Array(length);
      for (let i = 0; i < length; i++) {
        bytes[i] = "a".charCodeAt(0);
      }

      // Create a string with `length` 'a' characters.
      const string = "a".repeat(length);

      assertEquals(bytesToString(bytes), string);
    });
  });

  describe("isArrayBuffer", () => {
    it("handles array buffer values", () => {
      assertEquals(isArrayBuffer(new ArrayBuffer(0)), true);
      assertEquals(isArrayBuffer(new Uint8Array(0)), true);
    });

    it("handles non-array buffer values", () => {
      assertEquals(isArrayBuffer("true"), false);
      assertEquals(isArrayBuffer(1), false);
      assertEquals(isArrayBuffer(null), false);
      assertEquals(isArrayBuffer(undefined), false);
    });
  });

  describe("string32", () => {
    it("converts unsigned 32-bit integers to strings", () => {
      assertEquals(string32(0x74727565), "true");
      assertEquals(string32(0x74797031), "typ1");
      assertEquals(string32(0x4f54544f), "OTTO");
    });
  });

  describe("stringToBytes", () => {
    it("handles non-string arguments", () => {
      assertThrows(
        () => {
          stringToBytes(null as any);
        },
        Error,
        "Invalid argument for stringToBytes",
      );
    });

    it("handles string arguments", () => {
      assertEquals(stringToBytes(""), new Uint8Array([]));
      assertEquals(stringToBytes("foo"), new Uint8Array([102, 111, 111]));
    });
  });

  describe("stringToPDFString", () => {
    it("handles ISO Latin 1 strings", () => {
      const str = "\x8Dstring\x8E";
      assertEquals(stringToPDFString(str), "\u201Cstring\u201D");
    });

    it("handles UTF-16 big-endian strings", () => {
      const str = "\xFE\xFF\x00\x73\x00\x74\x00\x72\x00\x69\x00\x6E\x00\x67";
      assertEquals(stringToPDFString(str), "string");
    });

    it("handles UTF-16 little-endian strings", () => {
      const str = "\xFF\xFE\x73\x00\x74\x00\x72\x00\x69\x00\x6E\x00\x67\x00";
      assertEquals(stringToPDFString(str), "string");
    });

    it("handles UTF-8 strings", () => {
      const simpleStr = "\xEF\xBB\xBF\x73\x74\x72\x69\x6E\x67";
      assertEquals(stringToPDFString(simpleStr), "string");

      const complexStr =
        "\xEF\xBB\xBF\xE8\xA1\xA8\xE3\x83\x9D\xE3\x81\x82\x41\xE9\xB7\x97" +
        "\xC5\x92\xC3\xA9\xEF\xBC\xA2\xE9\x80\x8D\xC3\x9C\xC3\x9F\xC2\xAA" +
        "\xC4\x85\xC3\xB1\xE4\xB8\x82\xE3\x90\x80\xF0\xA0\x80\x80";
      assertEquals(stringToPDFString(complexStr), "表ポあA鷗ŒéＢ逍Üßªąñ丂㐀𠀀");
    });

    it("handles empty strings", () => {
      // ISO Latin 1
      const str1 = "";
      assertEquals(stringToPDFString(str1), "");

      // UTF-16BE
      const str2 = "\xFE\xFF";
      assertEquals(stringToPDFString(str2), "");

      // UTF-16LE
      const str3 = "\xFF\xFE";
      assertEquals(stringToPDFString(str3), "");

      // UTF-8
      const str4 = "\xEF\xBB\xBF";
      assertEquals(stringToPDFString(str4), "");
    });
  });

  describe("ReadableStream", () => {
    it("should return an Object", () => {
      const readable = new ReadableStream();
      assertEquals(typeof readable, "object");
    });

    it("should have property getReader", () => {
      const readable = new ReadableStream();
      assertEquals(typeof readable.getReader, "function");
    });
  });

  describe("URL", () => {
    it("should return an Object", () => {
      const url = new URL("https://example.com");
      assertEquals(typeof url, "object");
    });

    it("should have property `href`", () => {
      const url = new URL("https://example.com");
      assertEquals(typeof url.href, "string");
    });
  });

  describe("createValidAbsoluteUrl", () => {
    it("handles invalid URLs", () => {
      assertEquals(createValidAbsoluteUrl(undefined as any, undefined), null);
      assertEquals(createValidAbsoluteUrl(null as any, null as any), null);
      assertEquals(createValidAbsoluteUrl("/foo", "/bar"), null);
    });

    it("handles URLs that do not use an allowed protocol", () => {
      assertEquals(createValidAbsoluteUrl("magnet:?foo"), null);
    });

    it("correctly creates a valid URL for allowed protocols", () => {
      // `http` protocol
      assertEquals(
        createValidAbsoluteUrl("http://www.mozilla.org/foo"),
        new URL("http://www.mozilla.org/foo"),
      );
      assertEquals(
        createValidAbsoluteUrl("/foo", "http://www.mozilla.org"),
        new URL("http://www.mozilla.org/foo"),
      );

      // `https` protocol
      assertEquals(
        createValidAbsoluteUrl("https://www.mozilla.org/foo"),
        new URL("https://www.mozilla.org/foo"),
      );
      assertEquals(
        createValidAbsoluteUrl("/foo", "https://www.mozilla.org"),
        new URL("https://www.mozilla.org/foo"),
      );

      // `ftp` protocol
      assertEquals(
        createValidAbsoluteUrl("ftp://www.mozilla.org/foo"),
        new URL("ftp://www.mozilla.org/foo"),
      );
      assertEquals(
        createValidAbsoluteUrl("/foo", "ftp://www.mozilla.org"),
        new URL("ftp://www.mozilla.org/foo"),
      );

      // `mailto` protocol (base URLs have no meaning and should yield `null`)
      assertEquals(
        createValidAbsoluteUrl("mailto:foo@bar.baz"),
        new URL("mailto:foo@bar.baz"),
      );
      assertEquals(createValidAbsoluteUrl("/foo", "mailto:foo@bar.baz"), null);

      // `tel` protocol (base URLs have no meaning and should yield `null`)
      assertEquals(
        createValidAbsoluteUrl("tel:+0123456789"),
        new URL("tel:+0123456789"),
      );
      assertEquals(createValidAbsoluteUrl("/foo", "tel:0123456789"), null);
    });
  });

  describe("PromiseCap", () => {
    it("should resolve with correct data", async () => {
      const promiseCapability = new PromiseCap<{ test: string }>();
      assertEquals(promiseCapability.settled, false);

      promiseCapability.resolve({ test: "abc" });

      const data = await promiseCapability.promise;
      assertEquals(promiseCapability.settled, true);
      assertEquals(data, { test: "abc" });
    });

    it("should reject with correct reason", async () => {
      const promiseCapability = new PromiseCap();
      assertEquals(promiseCapability.settled, false);

      promiseCapability.reject(new Error("reason"));

      try {
        await promiseCapability.promise;

        assertEquals(false, true);
      } catch (reason) {
        assertEquals(promiseCapability.settled, true);
        assertInstanceOf(reason, Error);
        assertEquals(reason.message, "reason");
      }
    });
  });

  describe("getModificationDate", () => {
    it("should get a correctly formatted date", () => {
      const date = new Date(Date.UTC(3141, 5, 9, 2, 6, 53));
      assertEquals(getModificationDate(date), "31410609020653");
    });
  });
});
/*80--------------------------------------------------------------------------*/
