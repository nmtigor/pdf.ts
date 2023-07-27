/** 80**************************************************************************
 * @module pdf/pdf.ts-src/shared/test_utils
 * @license Apache-2.0
 ******************************************************************************/

import { DENO } from "../../../global.ts";
import { D_base } from "../../pdf.ts-web/app_options.ts";
import { BaseStream } from "../core/base_stream.ts";
import { Page, PDFDocument } from "../core/document.ts";
import { BasePdfManager } from "../core/pdf_manager.ts";
import { Dict, Name, type Obj, Ref } from "../core/primitives.ts";
import { NullStream, StringStream } from "../core/stream.ts";
import { DocumentInitP } from "../display/api.ts";
import { GlobalWorkerOptions } from "../display/worker_options.ts";
import { PDFWorker } from "../pdf.ts";
/*80--------------------------------------------------------------------------*/

const D_pdf = `${D_base}/res/pdf`;
const D_external = `${D_pdf}/pdf.ts-external`;

// const TEST_PDFS_PATH = isNodeJS ? "./test/pdfs/" : "../pdfs/";
export const TEST_PDFS_PATH = `${D_pdf}/test/pdfs/`;

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

// class NodeFileReaderFactory
// {
//   static async fetch(params)
//   {
//     const fs = require("fs");

//     return new Promise((resolve, reject) => {
//       fs.readFile(params.path, (error, data) => {
//         if( error || !data)
//         {
//           reject(error || new Error(`Empty file for: ${params.path}`));
//           return;
//         }
//         resolve(new Uint8Array(data));
//       });
//     });
//   }
// }

export const DefaultFileReaderFactory = DOMFileReaderFactory;
// const DefaultFileReaderFactory = isNodeJS
//   ? NodeFileReaderFactory
//   : DOMFileReaderFactory;

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

export function buildGetDocumentParams(
  filename: string,
  options?: BuildGetDocumentParamsOptions,
) {
  const params = Object.create(null);
  params.url = /*#static*/ DENO
    ? TEST_PDFS_PATH + filename
    : new URL(TEST_PDFS_PATH + filename, window.location as any).href;
  params.standardFontDataUrl = STANDARD_FONT_DATA_URL;

  for (const option in options) {
    params[option] = options[option as keyof BuildGetDocumentParamsOptions];
  }
  return params as DocumentInitP;
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
    nonBlendModesSet: undefined as any,
  });
  return page._localIdFactory;
}

GlobalWorkerOptions.workerSrc = `${D_base}/gen/pdf/pdf.ts-src/pdf.worker.js`;
/*80--------------------------------------------------------------------------*/
