/** 80**************************************************************************
 * @module pdf/test_utils
 * @license Apache-2.0
 ******************************************************************************/

import { DENO } from "@fe-src/global.ts";
import wretch from "@wretch";
import { D_base } from "./alias.ts";
import { BaseStream } from "./pdf.ts-src/core/base_stream.ts";
import { Page, PDFDocument } from "./pdf.ts-src/core/document.ts";
import { BasePdfManager } from "./pdf.ts-src/core/pdf_manager.ts";
import { Dict, Name, type Obj, Ref } from "./pdf.ts-src/core/primitives.ts";
import { NullStream, StringStream } from "./pdf.ts-src/core/stream.ts";
import { DocumentInitP } from "./pdf.ts-src/display/api.ts";
import type { PDFDocumentLoadingTask } from "./pdf.ts-src/pdf.ts";
import { getDocument, PDFWorker } from "./pdf.ts-src/pdf.ts";
import { isNodeJS } from "./pdf.ts-src/shared/util.ts";
/*80--------------------------------------------------------------------------*/

// let fs;
// if (isNodeJS) {
//   // Native packages.
//   fs = await __non_webpack_import__("fs");
// }

export const D_pdf = `${D_base}/res/pdf`;
const D_external = `${D_pdf}/pdf.ts-external`;

// const TEST_PDFS_PATH = isNodeJS ? "./test/pdfs/" : "../pdfs/";
export const TEST_PDFS_PATH = `${D_pdf}/test/pdfs/`;
export const TEST_IMAGES_PATH = `${D_pdf}/test/images/`;

// export const CMAP_URL = isNodeJS ? "./external/bcmaps/" : "../../external/bcmaps/";
export const CMAP_URL = `${D_external}/bcmaps/`;

// const STANDARD_FONT_DATA_URL = isNodeJS
//   ? "./external/standard_fonts/"
//   : "../../external/standard_fonts/";
export const STANDARD_FONT_DATA_URL = `${D_external}/standard_fonts/`;

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
  pdfBug?: boolean;
  stopAtErrors?: boolean;
  rangeChunkSize?: number;
  useWorkerFetch?: boolean;
  withCredentials?: boolean;
  worker?: PDFWorker;
};

const urlOf = (filename_x: string) => {
  return isNodeJS
    ? TEST_PDFS_PATH + filename_x
    : new URL(TEST_PDFS_PATH + filename_x, window.location as any).href;
};

export function buildGetDocumentParams(
  filename: string,
  options?: BuildGetDocumentParamsOptions,
) {
  const params = Object.create(null);
  params.url = urlOf(filename);
  params.standardFontDataUrl = STANDARD_FONT_DATA_URL;

  for (const option in options) {
    params[option] = options[option as keyof BuildGetDocumentParamsOptions];
  }
  return params as DocumentInitP;
}

/** @throw */
export async function getPDF(
  filename_x: string,
  options_x?: BuildGetDocumentParamsOptions,
): Promise<PDFDocumentLoadingTask> {
  const loadingTask = getDocument(
    buildGetDocumentParams(filename_x, options_x),
  );
  try {
    await loadingTask.promise;
    return loadingTask;
  } catch (err: any) {
    if (err.name === "MissingPDFException") {
      await loadingTask.destroy(); //!

      const link = await wretch(urlOf(`${filename_x}.link`)).get().text();
      return wretch(link)
        .get()
        .arrayBuffer((ab_y: ArrayBuffer) => {
          /*#static*/ if (DENO) {
            const Deno = (globalThis as any).Deno;
            const D_pdfs = `${Deno.cwd()}/../../res/pdf/test/pdfs`;
            const permission = Deno.permissions.querySync({
              name: "write",
              path: D_pdfs,
            });
            if (permission.state === "granted") {
              Deno.writeFileSync(
                `${D_pdfs}/${filename_x}`,
                new Uint8Array(ab_y),
              );
            }
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

// export function getNodeVersion() {
//   if (!isNodeJS) {
//     throw new Error("getNodeVersion - only valid in Node.js environments.");
//   }
//   const [major, minor, patch] = process.versions.node
//     .split(".")
//     .map(parseFloat);
//   return { major, minor, patch };
// }
/*80--------------------------------------------------------------------------*/
