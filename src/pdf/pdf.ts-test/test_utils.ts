/** 80**************************************************************************
 * @module pdf/pdf.ts-test/test_utils
 * @license Apache-2.0
 ******************************************************************************/

import {
  D_rp_images,
  D_rp_pdfs,
  D_rpe_cmap,
  D_rpe_sfont,
} from "@fe-src/alias.ts";
import { TESTING } from "@fe-src/global.ts";
import { assert } from "@std/assert";
import { serveDir } from "@std/http";
import wretch from "@wretch";
import { BaseStream } from "../pdf.ts-src/core/base_stream.ts";
import { Page, PDFDocument } from "../pdf.ts-src/core/document.ts";
import { BasePdfManager } from "../pdf.ts-src/core/pdf_manager.ts";
import { Dict, Name, type Obj, Ref } from "../pdf.ts-src/core/primitives.ts";
import { NullStream, StringStream } from "../pdf.ts-src/core/stream.ts";
import { DocumentInitP } from "../pdf.ts-src/display/api.ts";
import type { PDFDocumentLoadingTask } from "../pdf.ts-src/pdf.ts";
import { getDocument, PDFWorker } from "../pdf.ts-src/pdf.ts";
/*80--------------------------------------------------------------------------*/

// let fs, http;
// if (isNodeJS) {
//   // Native packages.
//   fs = await __non_webpack_import__("fs");
//   http = await __non_webpack_import__("http");
// }

export const D_base = (ts: TestServer) => `http://${ts!.hostname}:${ts!.port}`;

// const TEST_PDFS_PATH = isNodeJS ? "./test/pdfs/" : "../pdfs/";
export const TEST_PDFS_PATH = (ts: TestServer) => `${D_base(ts)}/${D_rp_pdfs}/`;
export const TEST_IMAGES_PATH = (ts: TestServer) =>
  `${D_base(ts)}/${D_rp_images}/`;

// const CMAP_URL = isNodeJS ? "./external/bcmaps/" : "../../external/bcmaps/";
export const CMAP_URL = (ts: TestServer) => `${D_base(ts)}/${D_rpe_cmap}/`;

// const STANDARD_FONT_DATA_URL = isNodeJS
//   ? "./external/standard_fonts/"
//   : "../../external/standard_fonts/";
export const STANDARD_FONT_DATA_URL = (ts: TestServer) =>
  `${D_base(ts)}/${D_rpe_sfont}/`;

class DOMFileReaderFactory {
  static async fetch(params: { path: string }) {
    const response = await fetch(params.path);
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return new Uint8Array(await response.arrayBuffer());
  }
}

// class NodeFileReaderFactory {
//   static async fetch(params) {
//     return new Promise((resolve, reject) => {
//       fs.readFile(params.path, (error, data) => {
//         if (error || !data) {
//           reject(error || new Error(`Empty file for: ${params.path}`));
//           return;
//         }
//         resolve(new Uint8Array(data));
//       });
//     });
//   }
// }

// const DefaultFileReaderFactory = isNodeJS
//   ? NodeFileReaderFactory
//   : DOMFileReaderFactory;
export const DefaultFileReaderFactory = DOMFileReaderFactory;

export type BuildGetDocumentParamsOptions = {
  cMapUrl?: string;
  disableFontFace?: boolean;
  docBaseUrl?: string;
  isOffscreenCanvasSupported?: boolean;
  ownerDocument?: unknown;
  password?: string;
  enableXfa?: boolean;
  disableAutoFetch?: boolean;
  pdfBug?: boolean;
  stopAtErrors?: boolean;
  rangeChunkSize?: number;
  useWorkerFetch?: boolean;
  withCredentials?: boolean;
  worker?: PDFWorker;
};

const urlOf_ = (ts: TestServer, filename: string) =>
  TEST_PDFS_PATH(ts) + filename;

export function buildGetDocumentParams(
  ts: TestServer,
  filename: string,
  options?: BuildGetDocumentParamsOptions,
) {
  const params = Object.create(null);
  // params.url = isNodeJS
  //   ? TEST_PDFS_PATH + filename
  //   : new URL(TEST_PDFS_PATH + filename, window.location).href;
  params.url = urlOf_(ts, filename);
  params.standardFontDataUrl = STANDARD_FONT_DATA_URL(ts);

  for (const option in options) {
    params[option] = options[option as keyof BuildGetDocumentParamsOptions];
  }
  return params as DocumentInitP;
}

/** @throw */
export async function getPDF(
  ts_x: TestServer,
  filename_x: string,
  options_x?: BuildGetDocumentParamsOptions,
): Promise<PDFDocumentLoadingTask> {
  const loadingTask = getDocument(
    buildGetDocumentParams(ts_x, filename_x, options_x),
  );
  try {
    await loadingTask.promise;
    return loadingTask;
  } catch (err: any) {
    if (err.name === "MissingPDFException") {
      await loadingTask.destroy(); //!

      const link = await wretch(urlOf_(ts_x, `${filename_x}.link`))
        .get()
        .text();
      return wretch(link)
        .get()
        .arrayBuffer((ab_y: ArrayBuffer) => {
          const D_pdfs_ = `${Deno.cwd()}/../../${D_rp_pdfs}`;
          const permission = Deno.permissions.querySync({
            name: "write",
            path: D_pdfs_,
          });
          if (permission.state === "granted") {
            Deno.writeFileSync(
              `${D_pdfs_}/${filename_x}`,
              new Uint8Array(ab_y),
            );
          }

          return getDocument(ab_y);
        });
    } else {
      throw err;
    }
  }
}

type XRefMockCtorP_ = {
  ref: Ref;
  data: string | number | Name | Dict | BaseStream | [Name, Dict] | [
    string,
    Ref,
  ];
};

export class XRefMock {
  #map: Record<string, XRefMockCtorP_["data"]> = Object.create(null);
  #newTemporaryRefNum: number | undefined;
  #newPersistentRefNum?: number;
  stream = new NullStream();

  newRef?: Ref | undefined;

  constructor(array?: XRefMockCtorP_[]) {
    for (const key in array!) {
      const obj = array[key];
      this.#map[obj.ref.toString()] = obj.data;
    }
  }

  getNewPersistentRef(obj: StringStream | Dict) {
    if (this.#newPersistentRefNum === undefined) {
      this.#newPersistentRefNum = Object.keys(this.#map).length || 1;
    }
    const ref = Ref.get(this.#newPersistentRefNum++, 0);
    this.#map[ref.toString()] = obj;
    return ref;
  }

  getNewTemporaryRef() {
    if (this.#newTemporaryRefNum === undefined) {
      this.#newTemporaryRefNum = Object.keys(this.#map).length || 1;
    }
    return Ref.get(this.#newTemporaryRefNum++, 0);
  }

  resetNewTemporaryRef() {
    this.#newTemporaryRefNum = undefined;
  }

  fetch(ref: Ref) {
    return this.#map[ref.toString()];
  }

  async fetchAsync(ref: Ref) {
    return this.fetch(ref);
  }

  fetchIfRef(obj: Obj) {
    if (obj instanceof Ref) {
      return this.fetch(obj);
    }
    return obj;
  }

  async fetchIfRefAsync(obj: Obj) {
    return this.fetchIfRef(obj);
  }
}

export function createIdFactory(pageIndex: number) {
  const pdfManager = {
    get docId() {
      return "d0";
    },
  } as BasePdfManager;
  const stream = new StringStream("Dummy_PDF_data");
  const pdfDocument = new PDFDocument(pdfManager, stream);

  const page = new Page({
    pdfManager: pdfDocument.pdfManager,
    xref: pdfDocument.xref,
    pageIndex,
    pageDict: undefined as any,
    ref: undefined,
    globalIdFactory: pdfDocument._globalIdFactory,
    fontCache: undefined as any,
    builtInCMapCache: undefined as any,
    standardFontDataCache: undefined as any,
    globalImageCache: undefined as any,
    systemFontCache: undefined as any,
    nonBlendModesSet: undefined as any,
  });
  return page._localIdFactory;
}
/*64----------------------------------------------------------*/

// export function createTemporaryNodeServer() {
//   assert(isNodeJS, "Should only be used in Node.js environments.");

//   // Create http server to serve pdf data for tests.
//   const server = http
//     .createServer((request, response) => {
//       const filePath = process.cwd() + "/test/pdfs" + request.url;
//       fs.lstat(filePath, (error, stat) => {
//         if (error) {
//           response.writeHead(404);
//           response.end(`File ${request.url} not found!`);
//           return;
//         }
//         if (!request.headers.range) {
//           const contentLength = stat.size;
//           const stream = fs.createReadStream(filePath);
//           response.writeHead(200, {
//             "Content-Type": "application/pdf",
//             "Content-Length": contentLength,
//             "Accept-Ranges": "bytes",
//           });
//           stream.pipe(response);
//         } else {
//           const [start, end] = request.headers.range
//             .split("=")[1]
//             .split("-")
//             .map((x) => Number(x));
//           const stream = fs.createReadStream(filePath, { start, end });
//           response.writeHead(206, {
//             "Content-Type": "application/pdf",
//           });
//           stream.pipe(response);
//         }
//       });
//     })
//     .listen(0); /* Listen on a random free port */

//   return {
//     server,
//     port: server.address().port,
//   };
// }

export type TestServer = {
  server: Deno.HttpServer<Deno.NetAddr>;
  hostname: string;
  port: number;
};
/**
 * Create http server for tests.
 */
export function createTemporaryDenoServer(): TestServer {
  assert(TESTING, "Should only be used in DENO && TESTING environments.");

  const server = Deno.serve(async (req: Request) =>
    serveDir(req, { fsRoot: "../.." })
  );

  return {
    server,
    hostname: server.addr.hostname,
    port: server.addr.port,
  };
}
/*80--------------------------------------------------------------------------*/
