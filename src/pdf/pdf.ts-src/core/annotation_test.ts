/*81*****************************************************************************
 * annotation_test
** --------------- */

// #if TESTING && TEST_ALL
import "../../../lib/jslang.js";
import { css_1, css_2 } from "../../../test/alias.js";
import { Dict, Name, Ref, RefSetCache } from "./primitives.js";
import { 
  CMAP_PARAMS, 
  createIdFactory, 
  STANDARD_FONT_DATA_URL, 
  XRefMock 
} from "../../test_utils.js";
import { DefaultCMapReaderFactory, DefaultStandardFontDataFactory } from "../display/api.js";
import { PartialEvaluator } from "./evaluator.js";
import { CMapData } from "../display/base_factory.js";
import { AnnotationFactory, getQuadPoints } from "./annotation.js";
import { AnnotationType, rect_t } from "../shared/util.js";

const strttime = performance.now();
/*81---------------------------------------------------------------------------*/

class PDFManagerMock 
{
  docBaseUrl;
  pdfDocument;

  constructor( params:{ docBaseUrl:string | undefined }) 
  {
    this.docBaseUrl = params.docBaseUrl || undefined;
    this.pdfDocument = {
      catalog: {
        acroForm: new Dict(),
      },
    };
  }

  ensure( obj:unknown, prop:string, args:unknown ) 
  {
    return new Promise( resolve => {
      const value = (<any>obj)[prop];
      if( typeof value === "function") 
      {
        resolve( value.apply(obj, args) );
      } 
      else {
        resolve( value );
      }
    });
  }

  ensureCatalog( prop:string, args:unknown )
  {
    return this.ensure( this.pdfDocument.catalog, prop, args );
  }

  ensureDoc( prop:string, args:unknown ) 
  {
    return this.ensure(this.pdfDocument, prop, args);
  }
}

const fontDataReader = new DefaultStandardFontDataFactory({
  baseUrl: STANDARD_FONT_DATA_URL,
});

class HandlerMock
{
  inputs:{ name:string; data:unknown; }[] = [];
  
  send( name:string, data:unknown )
  {
    this.inputs.push({ name, data });
  }

  sendWithPromise( name:string, data:unknown )
  {
    if (name !== "FetchStandardFontData") 
    {
      return Promise.reject(new Error(`Unsupported mock ${name}.`));
    }
    return fontDataReader.fetch( <any>data );
  }
}

let pdfManagerMock = new PDFManagerMock({
  docBaseUrl: undefined,
});

const CMapReaderFactory = new DefaultCMapReaderFactory({
  baseUrl: CMAP_PARAMS.cMapUrl,
  isCompressed: CMAP_PARAMS.cMapPacked,
});

const builtInCMapCache = new Map<string, CMapData>();
builtInCMapCache.set(
  "UniJIS-UTF16-H",
  await CMapReaderFactory.fetch({ name: "UniJIS-UTF16-H" })
);
builtInCMapCache.set(
  "Adobe-Japan1-UCS2",
  await CMapReaderFactory.fetch({ name: "Adobe-Japan1-UCS2" })
);

let idFactoryMock = createIdFactory(/* pageIndex = */ 0);
let partialEvaluator = new PartialEvaluator({
  xref: <any>new XRefMock(),
  handler: <any>new HandlerMock(),
  pageIndex: 0,
  idFactory: createIdFactory(/* pageIndex = */ 0),
  fontCache: new RefSetCache(),
  builtInCMapCache,
  standardFontDataCache: new Map(),
});

console.log("%c>>>>>>> test AnnotationFactory >>>>>>>",`color:${css_1}`);
{
  console.log("it should get id for annotation...");
  {
    const annotationDict = new Dict();
    annotationDict.set("Type", Name.get("Annot"));
    annotationDict.set("Subtype", Name.get("Link"));

    const annotationRef = Ref.get(10, 0);
    const xref = new XRefMock([{ ref: annotationRef, data: annotationDict }]);

    const { data } = (await AnnotationFactory.create(
      <any>xref,
      annotationRef,
      <any>pdfManagerMock,
      idFactoryMock
    ))!;
    console.assert( data.annotationType === AnnotationType.LINK );
    console.assert( data.id === "10R" );
  }

  console.log("it should handle, and get fallback IDs for, annotations that are not indirect objects (issue 7569)...");
  {
    const annotationDict = new Dict();
    annotationDict.set("Type", Name.get("Annot"));
    annotationDict.set("Subtype", Name.get("Link"));

    const xref = new XRefMock();
    const idFactory = createIdFactory(/* pageIndex = */ 0);

    const annotation1 = (<Promise<any>>AnnotationFactory.create(
      <any>xref,
      <any>annotationDict,
      <any>pdfManagerMock,
      idFactory
    )).then(({ data }) => {
      console.assert( data.annotationType === AnnotationType.LINK );
      console.assert( data.id === "annot_p0_1" );
    });

    const annotation2 = (<Promise<any>>AnnotationFactory.create(
      <any>xref,
      <any>annotationDict,
      <any>pdfManagerMock,
      idFactory
    )).then(({ data }) => {
      console.assert( data.annotationType === AnnotationType.LINK );
      console.assert( data.id === "annot_p0_2" );
    });

    await Promise.all([annotation1, annotation2]);
  }

  console.log("it should handle missing /Subtype...");
  {
    const annotationDict = new Dict();
    annotationDict.set("Type", Name.get("Annot"));

    const annotationRef = Ref.get(1, 0);
    const xref = new XRefMock([{ ref: annotationRef, data: annotationDict }]);

    const { data } = (await AnnotationFactory.create(
      <any>xref,
      annotationRef,
      <any>pdfManagerMock,
      idFactoryMock
    ))!;
    console.assert( data.annotationType === undefined );
  }
}

console.log("%c>>>>>>> test getQuadPoints() >>>>>>>",`color:${css_1}`);
{
  let dict!:Dict, 
    rect:rect_t | undefined;
  function beforeEach()
  {
    dict = new Dict();
  }
  function afterEach()
  {
    dict = <any>undefined;
    rect = undefined;
  }

  console.log("it should ignore missing quadpoints...");
  beforeEach();
  {
    console.assert( getQuadPoints(dict, <any>[]) === undefined );
  }
  afterEach()

  console.log("it should ignore non-array values...");
  beforeEach();
  {
    dict.set("QuadPoints", "foo");
    console.assert( getQuadPoints(dict, <any>[]) === undefined );
  }
  afterEach();

  console.log("it should ignore arrays where the length is not a multiple of eight...");
  beforeEach();
  {
    dict.set("QuadPoints", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    console.assert( getQuadPoints(dict, <any>[]) === undefined );
  }
  afterEach();

  console.log("it should ignore quadpoints if one coordinate lies outside the rectangle...");
  beforeEach();
  {
    rect = [10, 10, 20, 20];
    const inputs = [
      [11, 11, 12, 12, 9, 13, 14, 14], // Smaller than lower x coordinate.
      [11, 11, 12, 12, 13, 9, 14, 14], // Smaller than lower y coordinate.
      [11, 11, 12, 12, 21, 13, 14, 14], // Larger than upper x coordinate.
      [11, 11, 12, 12, 13, 21, 14, 14], // Larger than upper y coordinate.
    ];
    for( const input of inputs )
    {
      dict.set("QuadPoints", input);
      console.assert( getQuadPoints(dict, rect) === undefined );
    }
  }
  afterEach();

  console.log("it should process quadpoints in the standard order...");
  beforeEach();
  {
    rect = [10, 10, 20, 20];
    dict.set(
      "QuadPoints",
      [10, 20, 20, 20, 10, 10, 20, 10, 11, 19, 19, 19, 11, 11, 19, 11]
    );
    console.assert( getQuadPoints(dict, rect)!.eq([
      [
        { x: 10, y: 20 },
        { x: 20, y: 20 },
        { x: 10, y: 10 },
        { x: 20, y: 10 },
      ],
      [
        { x: 11, y: 19 },
        { x: 19, y: 19 },
        { x: 11, y: 11 },
        { x: 19, y: 11 },
      ],
    ]));
  }
  afterEach();

  console.log("it should normalize and process quadpoints in non-standard orders...");
  beforeEach();
  {
    rect = [10, 10, 20, 20];
    const nonStandardOrders = [
      // Bottom left, bottom right, top right and top left.
      [10, 20, 20, 20, 20, 10, 10, 10],

      // Top left, top right, bottom left and bottom right.
      [10, 10, 20, 10, 10, 20, 20, 20],

      // Top left, top right, bottom right and bottom left.
      [10, 10, 20, 10, 20, 20, 10, 20],
    ];

    for (const nonStandardOrder of nonStandardOrders) 
    {
      dict.set("QuadPoints", nonStandardOrder);
      console.assert( getQuadPoints(dict, rect)!.eq([
        [
          { x: 10, y: 20 },
          { x: 20, y: 20 },
          { x: 10, y: 10 },
          { x: 20, y: 10 },
        ],
      ]));
    }
  }
  afterEach();
}

console.log("%c>>>>>>> test Annotation >>>>>>>",`color:${css_1}`);
{
  //
}

pdfManagerMock = <any>undefined;
idFactoryMock = <any>undefined;
partialEvaluator = <any>undefined;
/*81---------------------------------------------------------------------------*/

console.log(`%cpdf/pdf.ts-src/core/annotation_test: ${(performance.now()-strttime).toFixed(2)} ms`,`color:${css_2}`);
globalThis.ntestfile = globalThis.ntestfile ? globalThis.ntestfile+1 : 1;
// #endif
