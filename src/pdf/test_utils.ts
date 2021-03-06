/*81*****************************************************************************
 * test_lib
** -------- */

import { isObjectLike } from "../lib/jslang.js";
import { assert } from "../lib/util/trace.js";
import { BaseStream } from "./pdf.ts-src/core/base_stream.js";
import { DocStats } from "./pdf.ts-src/core/core_utils.js";
import { Page, PDFDocument } from "./pdf.ts-src/core/document.js";
import { BasePdfManager } from "./pdf.ts-src/core/pdf_manager.js";
import { Dict, Name, Ref, type Obj } from "./pdf.ts-src/core/primitives.js";
import { StringStream } from "./pdf.ts-src/core/stream.js";
import { DocumentInitP } from "./pdf.ts-src/display/api.js";
import { GlobalWorkerOptions, PDFWorker } from "./pdf.ts-src/pdf.js";
/*81---------------------------------------------------------------------------*/

const D_base = "";
const D_pdf = `${D_base}/res/pdf`;
const D_external = `${D_pdf}/pdf.ts-external`;

// const TEST_PDFS_PATH = isNodeJS ? "./test/pdfs/" : "../pdfs/";
export const TEST_PDFS_PATH = `${D_pdf}/test/pdfs/`;

export const CMAP_PARAMS = {
  cMapUrl: `${D_external}/bcmaps/`,
  // cMapUrl: isNodeJS ? "./external/bcmaps/" : "../../external/bcmaps/",
  cMapPacked: true,
};

export const STANDARD_FONT_DATA_URL = `${D_external}/standard_fonts/`;
// const STANDARD_FONT_DATA_URL = isNodeJS
//   ? "./external/standard_fonts/"
//   : "../../external/standard_fonts/";

class DOMFileReaderFactory 
{
  static async fetch( params:{ path:string }) 
  {
    const response = await fetch(params.path);
    if( !response.ok ) 
    {
      throw new Error(response.statusText);
    }
    return new Uint8Array( await response.arrayBuffer() );
  }
}

// class NodeFileReaderFactory 
// {
//   static async fetch(params) 
//   {
//     const fs = require("fs");

//     return new Promise((resolve, reject) => {
//       fs.readFile(params.path, (error, data) => {
//         if (error || !data) 
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

export interface BuildGetDocumentParamsOptions
{
  disableFontFace?:boolean;
  docBaseUrl?:string;
  ownerDocument?:unknown;
  password?:string;
  pdfBug?:boolean;
  stopAtErrors?:boolean;
  rangeChunkSize?:number;
  withCredentials?:boolean;
  worker?:PDFWorker;
}

export function buildGetDocumentParams( filename:string, options?:BuildGetDocumentParamsOptions )
{
  const params = Object.create(null);
  // params.url = isNodeJS
  //   ? TEST_PDFS_PATH + filename
  //   : new URL(TEST_PDFS_PATH + filename, window.location).href;
  params.url = new URL(TEST_PDFS_PATH + filename, <any>window.location).href;
  params.standardFontDataUrl = STANDARD_FONT_DATA_URL;

  for( const option in options )
  {
    params[option] = options[<keyof BuildGetDocumentParamsOptions>option];
  }
  return <DocumentInitP>params;
}

interface _XRefMockCtorP
{
  ref:Ref;
  data:string | Name | Dict | BaseStream | [Name, Dict];
}

export class XRefMock
{
  #map:Record< string, _XRefMockCtorP["data"]> = Object.create(null);
  stats = new DocStats( <any>{ send: () => {} });
  #newRefNum?:number;

  newRef?:Ref | undefined;

  constructor( array?:_XRefMockCtorP[] ) 
  {
    for( const key in array! )
    {
      const obj = array[key];
      this.#map[ obj.ref.toString() ] = obj.data;
    }
  }

  getNewRef() 
  {
    if (this.#newRefNum === undefined) 
    {
      this.#newRefNum = Object.keys(this.#map).length;
    }
    return Ref.get( this.#newRefNum++, 0 );
  }

  resetNewRef() 
  {
    this.newRef = undefined;
  }

  fetch( ref:Ref ) 
  {
    return this.#map[ ref.toString() ];
  }

  async fetchAsync( ref:Ref ) 
  {
    return this.fetch(ref);
  }

  fetchIfRef( obj:Obj ) 
  {
    if( obj instanceof Ref ) 
      return this.fetch(obj);
    return obj;
  }

  async fetchIfRefAsync( obj:Obj ) 
  {
    return this.fetchIfRef(obj);
  }
}

export function createIdFactory( pageIndex:number ) 
{
  const pdfManager = <BasePdfManager>{
    get docId() { return "d0"; },
  };
  const stream = new StringStream("Dummy_PDF_data");
  const pdfDocument = new PDFDocument( pdfManager, stream );

  const page = new Page({
    pdfManager: pdfDocument.pdfManager,
    xref: pdfDocument.xref,
    pageIndex,
    pageDict: <any>undefined,
    ref: undefined,
    globalIdFactory: pdfDocument._globalIdFactory,
    fontCache: <any>undefined,
    builtInCMapCache: <any>undefined,
    standardFontDataCache: <any>undefined,
    globalImageCache: <any>undefined,
    nonBlendModesSet: <any>undefined,
  });
  return page._localIdFactory;
}

export function isEmptyObj( obj:object ) 
{
  assert( isObjectLike(obj),
    "isEmptyObj - invalid argument.", import.meta
  );
  return Object.keys(obj).length === 0;
}

GlobalWorkerOptions.workerSrc = `${D_base}/gen/pdf/pdf.ts-src/pdf.worker.js`;
/*81---------------------------------------------------------------------------*/
