/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/display/network_utils_test.ts
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

import { assertEquals, assertThrows } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { HttpStatusCode } from "../../../lib/HttpStatusCode.ts";
import {
  MissingPDFException,
  UnexpectedResponseException,
} from "../shared/util.ts";
import {
  createResponseStatusError,
  extractFilenameFromHeader,
  validateRangeRequestCapabilities,
  validateResponseStatus,
  type VRRC_P_,
} from "./network_utils.ts";
/*80--------------------------------------------------------------------------*/

describe("network_utils", () => {
  describe("validateRangeRequestCapabilities", () => {
    it("rejects invalid rangeChunkSize", () => {
      assertThrows(
        () => {
          validateRangeRequestCapabilities(
            { rangeChunkSize: "abc" as any } as VRRC_P_,
          );
        },
        Error,
        "rangeChunkSize must be an integer larger than zero.",
      );

      assertThrows(
        () => {
          validateRangeRequestCapabilities({ rangeChunkSize: 0 } as VRRC_P_);
        },
        Error,
        "rangeChunkSize must be an integer larger than zero.",
      );
    });

    it("rejects disabled or non-HTTP range requests", () => {
      assertEquals(
        validateRangeRequestCapabilities({
          disableRange: true,
          isHttp: true,
          getResponseHeader: (headerName) => {
            if (headerName === "Content-Length") {
              return 8 as any;
            }
            throw new Error(`Unexpected headerName: ${headerName}`);
          },
          rangeChunkSize: 64,
        }),
        {
          allowRangeRequests: false,
          suggestedLength: 8,
        },
      );

      assertEquals(
        validateRangeRequestCapabilities({
          disableRange: false,
          isHttp: false,
          getResponseHeader: (headerName) => {
            if (headerName === "Content-Length") {
              return 8 as any;
            }
            throw new Error(`Unexpected headerName: ${headerName}`);
          },
          rangeChunkSize: 64,
        }),
        {
          allowRangeRequests: false,
          suggestedLength: 8,
        },
      );
    });

    it("rejects invalid Accept-Ranges header values", () => {
      assertEquals(
        validateRangeRequestCapabilities({
          disableRange: false,
          isHttp: true,
          getResponseHeader: (headerName) => {
            if (headerName === "Accept-Ranges") {
              return "none";
            } else if (headerName === "Content-Length") {
              return 8 as any;
            }
            throw new Error(`Unexpected headerName: ${headerName}`);
          },
          rangeChunkSize: 64,
        }),
        {
          allowRangeRequests: false,
          suggestedLength: 8,
        },
      );
    });

    it("rejects invalid Content-Encoding header values", () => {
      assertEquals(
        validateRangeRequestCapabilities({
          disableRange: false,
          isHttp: true,
          getResponseHeader: (headerName) => {
            if (headerName === "Accept-Ranges") {
              return "bytes";
            } else if (headerName === "Content-Encoding") {
              return "gzip";
            } else if (headerName === "Content-Length") {
              return 8 as any;
            }
            throw new Error(`Unexpected headerName: ${headerName}`);
          },
          rangeChunkSize: 64,
        }),
        {
          allowRangeRequests: false,
          suggestedLength: 8,
        },
      );
    });

    it("rejects invalid Content-Length header values", () => {
      assertEquals(
        validateRangeRequestCapabilities({
          disableRange: false,
          isHttp: true,
          getResponseHeader: (headerName) => {
            if (headerName === "Accept-Ranges") {
              return "bytes";
            } else if (headerName === "Content-Encoding") {
              return null;
            } else if (headerName === "Content-Length") {
              return "eight";
            }
            throw new Error(`Unexpected headerName: ${headerName}`);
          },
          rangeChunkSize: 64,
        }),
        {
          allowRangeRequests: false,
          // suggestedLength: undefined,
        },
      );
    });

    it("rejects file sizes that are too small for range requests", () => {
      assertEquals(
        validateRangeRequestCapabilities({
          disableRange: false,
          isHttp: true,
          getResponseHeader: (headerName) => {
            if (headerName === "Accept-Ranges") {
              return "bytes";
            } else if (headerName === "Content-Encoding") {
              return null;
            } else if (headerName === "Content-Length") {
              return 8 as any;
            }
            throw new Error(`Unexpected headerName: ${headerName}`);
          },
          rangeChunkSize: 64,
        }),
        {
          allowRangeRequests: false,
          suggestedLength: 8,
        },
      );
    });

    it("accepts file sizes large enough for range requests", () => {
      assertEquals(
        validateRangeRequestCapabilities({
          disableRange: false,
          isHttp: true,
          getResponseHeader: (headerName) => {
            if (headerName === "Accept-Ranges") {
              return "bytes";
            } else if (headerName === "Content-Encoding") {
              return null;
            } else if (headerName === "Content-Length") {
              return 8192 as any;
            }
            throw new Error(`Unexpected headerName: ${headerName}`);
          },
          rangeChunkSize: 64,
        }),
        {
          allowRangeRequests: true,
          suggestedLength: 8192,
        },
      );
    });
  });

  describe("extractFilenameFromHeader", () => {
    it("returns null when content disposition header is blank", () => {
      assertEquals(
        extractFilenameFromHeader((headerName) => {
          if (headerName === "Content-Disposition") {
            return null;
          }
          throw new Error(`Unexpected headerName: ${headerName}`);
        }),
        undefined,
      );

      assertEquals(
        extractFilenameFromHeader((headerName) => {
          if (headerName === "Content-Disposition") {
            return null;
          }
          throw new Error(`Unexpected headerName: ${headerName}`);
        }),
        undefined,
      );

      assertEquals(
        extractFilenameFromHeader((headerName) => {
          if (headerName === "Content-Disposition") {
            return "";
          }
          throw new Error(`Unexpected headerName: ${headerName}`);
        }),
        undefined,
      );
    });

    it("gets the filename from the response header", () => {
      assertEquals(
        extractFilenameFromHeader((headerName) => {
          if (headerName === "Content-Disposition") {
            return "inline";
          }
          throw new Error(`Unexpected headerName: ${headerName}`);
        }),
        undefined,
      );

      assertEquals(
        extractFilenameFromHeader((headerName) => {
          if (headerName === "Content-Disposition") {
            return "attachment";
          }
          throw new Error(`Unexpected headerName: ${headerName}`);
        }),
        undefined,
      );

      assertEquals(
        extractFilenameFromHeader((headerName) => {
          if (headerName === "Content-Disposition") {
            return 'attachment; filename="filename.pdf"';
          }
          throw new Error(`Unexpected headerName: ${headerName}`);
        }),
        "filename.pdf",
      );

      assertEquals(
        extractFilenameFromHeader((headerName) => {
          if (headerName === "Content-Disposition") {
            return 'attachment; filename="filename.pdf and spaces.pdf"';
          }
          throw new Error(`Unexpected headerName: ${headerName}`);
        }),
        "filename.pdf and spaces.pdf",
      );

      assertEquals(
        extractFilenameFromHeader((headerName) => {
          if (headerName === "Content-Disposition") {
            return 'attachment; filename="tl;dr.pdf"';
          }
          throw new Error(`Unexpected headerName: ${headerName}`);
        }),
        "tl;dr.pdf",
      );

      assertEquals(
        extractFilenameFromHeader((headerName) => {
          if (headerName === "Content-Disposition") {
            return "attachment; filename=filename.pdf";
          }
          throw new Error(`Unexpected headerName: ${headerName}`);
        }),
        "filename.pdf",
      );

      assertEquals(
        extractFilenameFromHeader((headerName) => {
          if (headerName === "Content-Disposition") {
            return "attachment; filename=filename.pdf someotherparam";
          }
          throw new Error(`Unexpected headerName: ${headerName}`);
        }),
        "filename.pdf",
      );

      assertEquals(
        extractFilenameFromHeader((headerName) => {
          if (headerName === "Content-Disposition") {
            return 'attachment; filename="%e4%b8%ad%e6%96%87.pdf"';
          }
          throw new Error(`Unexpected headerName: ${headerName}`);
        }),
        "中文.pdf",
      );

      assertEquals(
        extractFilenameFromHeader((headerName) => {
          if (headerName === "Content-Disposition") {
            return 'attachment; filename="100%.pdf"';
          }
          throw new Error(`Unexpected headerName: ${headerName}`);
        }),
        "100%.pdf",
      );
    });

    it("gets the filename from the response header (RFC 6266)", () => {
      assertEquals(
        extractFilenameFromHeader((headerName) => {
          if (headerName === "Content-Disposition") {
            return "attachment; filename*=filename.pdf";
          }
          throw new Error(`Unexpected headerName: ${headerName}`);
        }),
        "filename.pdf",
      );

      assertEquals(
        extractFilenameFromHeader((headerName) => {
          if (headerName === "Content-Disposition") {
            return "attachment; filename*=''filename.pdf";
          }
          throw new Error(`Unexpected headerName: ${headerName}`);
        }),
        "filename.pdf",
      );

      assertEquals(
        extractFilenameFromHeader((headerName) => {
          if (headerName === "Content-Disposition") {
            return "attachment; filename*=utf-8''filename.pdf";
          }
          throw new Error(`Unexpected headerName: ${headerName}`);
        }),
        "filename.pdf",
      );

      assertEquals(
        extractFilenameFromHeader((headerName) => {
          if (headerName === "Content-Disposition") {
            return "attachment; filename=no.pdf; filename*=utf-8''filename.pdf";
          }
          throw new Error(`Unexpected headerName: ${headerName}`);
        }),
        "filename.pdf",
      );

      assertEquals(
        extractFilenameFromHeader((headerName) => {
          if (headerName === "Content-Disposition") {
            return "attachment; filename*=utf-8''filename.pdf; filename=no.pdf";
          }
          throw new Error(`Unexpected headerName: ${headerName}`);
        }),
        "filename.pdf",
      );
    });

    it("gets the filename from the response header (RFC 2231)", () => {
      // Tests continuations (RFC 2231 section 3, via RFC 5987 section 3.1).
      assertEquals(
        extractFilenameFromHeader((headerName) => {
          if (headerName === "Content-Disposition") {
            return "attachment; filename*0=filename; filename*1=.pdf";
          }
          throw new Error(`Unexpected headerName: ${headerName}`);
        }),
        "filename.pdf",
      );
    });

    it("only extracts filename with pdf extension", () => {
      assertEquals(
        extractFilenameFromHeader((headerName) => {
          if (headerName === "Content-Disposition") {
            return 'attachment; filename="filename.png"';
          }
          throw new Error(`Unexpected headerName: ${headerName}`);
        }),
        undefined,
      );
    });

    it("extension validation is case insensitive", () => {
      assertEquals(
        extractFilenameFromHeader((headerName) => {
          if (headerName === "Content-Disposition") {
            return 'form-data; name="fieldName"; filename="file.PdF"';
          }
          throw new Error(`Unexpected headerName: ${headerName}`);
        }),
        "file.PdF",
      );
    });
  });

  describe("createResponseStatusError", () => {
    it("handles missing PDF file responses", () => {
      assertEquals(
        createResponseStatusError(404, "https://foo.com/bar.pdf"),
        new MissingPDFException('Missing PDF "https://foo.com/bar.pdf".'),
      );

      assertEquals(
        createResponseStatusError(0, "file://foo.pdf"),
        new MissingPDFException('Missing PDF "file://foo.pdf".'),
      );
    });

    it("handles unexpected responses", () => {
      assertEquals(
        createResponseStatusError(302, "https://foo.com/bar.pdf"),
        new UnexpectedResponseException(
          "Unexpected server response (302) while retrieving PDF " +
            '"https://foo.com/bar.pdf".',
          302,
        ),
      );

      assertEquals(
        createResponseStatusError(0, "https://foo.com/bar.pdf"),
        new UnexpectedResponseException(
          "Unexpected server response (0) while retrieving PDF " +
            '"https://foo.com/bar.pdf".',
          HttpStatusCode._0,
        ),
      );
    });
  });

  describe("validateResponseStatus", () => {
    it("accepts valid response statuses", () => {
      assertEquals(validateResponseStatus(200), true);
      assertEquals(validateResponseStatus(206), true);
    });

    it("rejects invalid response statuses", () => {
      assertEquals(validateResponseStatus(302), false);
      assertEquals(validateResponseStatus(404), false);
      assertEquals(validateResponseStatus(null as any), false);
      assertEquals(validateResponseStatus(undefined as any), false);
    });
  });
});
/*80--------------------------------------------------------------------------*/
