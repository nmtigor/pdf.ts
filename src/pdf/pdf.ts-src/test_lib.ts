/*81*****************************************************************************
 * test_lib
** -------- */

import { isObjectLike } from "../../lib/jslang.js";
import { assert } from "../../lib/util/trace.js";
import { Dict, Obj, Ref } from "./core/primitives.js";
import { StringStream } from "./core/stream.js";
import { Page, PDFDocument } from "./core/document.js";
import { PDFWorker } from "./pdf.js";
import { BasePdfManager } from "./core/pdf_manager.js";
/*81---------------------------------------------------------------------------*/

const D_root = "/pdf.ts";
const D_pdf = `${D_root}/res/pdf`;
const D_external = `${D_pdf}/pdf.ts-external`;

export const TEST_PDFS_PATH = `${D_pdf}/test/pdfs/`;
// const TEST_PDFS_PATH = isNodeJS ? "./test/pdfs/" : "../pdfs/";

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

interface BuildGetDocumentParamsOptions
{
  disableFontFace?:boolean;
  docBaseUrl?:string;
  ownerDocument?:unknown;
  password?:string;
  pdfBug?:boolean;
  stopAtErrors?:boolean;
  worker?:PDFWorker;
}

export function buildGetDocumentParams( filename:string, options?:BuildGetDocumentParamsOptions )
{
  const params = Object.create(null);
  params.url = new URL(TEST_PDFS_PATH + filename, <any>window.location).href;
  // params.url = isNodeJS
  //   ? TEST_PDFS_PATH + filename
  //   : new URL(TEST_PDFS_PATH + filename, window.location).href;
  params.standardFontDataUrl = STANDARD_FONT_DATA_URL;

  for( const option in options )
  {
    params[option] = options[<keyof BuildGetDocumentParamsOptions>option];
  }
  return params;
}

interface XRefMockCtorParms
{
  ref:Ref;
  data:string | Dict;
}

export class XRefMock
{
  #map:Record<string, XRefMockCtorParms["data"]> = Object.create(null);
  stats = {
    streamTypes: Object.create(null),
    fontTypes: Object.create(null),
  };
  #newRefNum?:number;

  newRef?:Ref | undefined;

  constructor( array?:XRefMockCtorParms[] ) 
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
    if( !(obj instanceof Ref) ) return obj;

    return this.fetch(obj);
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
/*81---------------------------------------------------------------------------*/
