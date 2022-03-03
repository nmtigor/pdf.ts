/*81*****************************************************************************
 * annotation_test
** --------------- */

import { css_1, css_2 } from "../../../test/alias.js";
import "../../../lib/jslang.js";
import { Dict, Name, Ref, RefSetCache } from "./primitives.js";
import { 
  CMAP_PARAMS, 
  createIdFactory, 
  STANDARD_FONT_DATA_URL, 
  XRefMock 
} from "../../test_utils.js";
import { DefaultCMapReaderFactory, DefaultStandardFontDataFactory } from "../display/api.js";
import { PartialEvaluator } from "./evaluator.js";
import { type CMapData } from "../display/base_factory.js";
import { 
  Annotation, 
  AnnotationBorderStyle, 
  AnnotationFactory, 
  getQuadPoints, 
  MarkupAnnotation 
} from "./annotation.js";
import { 
  AnnotationBorderStyleType, 
  AnnotationFlag, 
  AnnotationType, 
  type rect_t 
} from "../shared/util.js";
import { BasePdfManager } from "./pdf_manager.js";

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
    console.assert( getQuadPoints(dict, <any>[]) === null );
  }
  afterEach()

  console.log("it should ignore non-array values...");
  beforeEach();
  {
    dict.set("QuadPoints", "foo");
    console.assert( getQuadPoints(dict, <any>[]) === null );
  }
  afterEach();

  console.log("it should ignore arrays where the length is not a multiple of eight...");
  beforeEach();
  {
    dict.set("QuadPoints", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    console.assert( getQuadPoints(dict, <any>[]) === null );
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
      console.assert( getQuadPoints(dict, rect) === null );
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
  let dict = new Dict();
  let ref = Ref.get(1, 0);

  console.log("it should set and get valid contents...");
  {
    const annotation = new Annotation(<any>{ dict, ref });
    annotation.setContents("Foo bar baz");

    console.assert( annotation._contents.eq({ str: "Foo bar baz", dir: "ltr" }) );
  }

  console.log("it should not set and get invalid contents...");
  {
    const annotation = new Annotation(<any>{ dict, ref });
    annotation.setContents(undefined);

    console.assert( annotation._contents.eq({ str: "", dir: "ltr" }) );
  }

  console.log("it should set and get a valid modification date...");
  {
    const annotation = new Annotation(<any>{ dict, ref });
    annotation.setModificationDate("D:20190422");

    console.assert( annotation.modificationDate === "D:20190422" );
  }

  console.log("it should not set and get an invalid modification date...");
  {
    const annotation = new Annotation(<any>{ dict, ref });
    annotation.setModificationDate(undefined);

    console.assert( annotation.modificationDate === undefined );
  }

  console.log("it should set and get flags...");
  {
    const annotation = new Annotation(<any>{ dict, ref });
    annotation.setFlags(13);

    console.assert( annotation.hasFlag(AnnotationFlag.INVISIBLE) );
    console.assert( annotation.hasFlag(AnnotationFlag.NOZOOM) );
    console.assert( annotation.hasFlag(AnnotationFlag.PRINT) );
    console.assert( !annotation.hasFlag(AnnotationFlag.READONLY) );
    console.assert( !annotation.hasFlag(AnnotationFlag.HIDDEN) );
  }

  console.log("it should be viewable and not printable by default...");
  {
    const annotation = new Annotation(<any>{ dict, ref });

    console.assert( annotation.viewable );
    console.assert( !annotation.printable );
  }

  console.log("it should set and get a valid rectangle...");
  {
    const annotation = new Annotation(<any>{ dict, ref });
    annotation.setRectangle([117, 694, 164.298, 720]);

    console.assert( annotation.rectangle.eq([117, 694, 164.298, 720]) );
  }

  console.log("it should not set and get an invalid rectangle...");
  {
    const annotation = new Annotation(<any>{ dict, ref });
    annotation.setRectangle([117, 694, 164.298]);

    console.assert( annotation.rectangle.eq([0, 0, 0, 0]) );
  }

  console.log("it should reject a color if it is not an array...");
  {
    const annotation = new Annotation(<any>{ dict, ref });
    annotation.setColor(<any>"red");

    console.assert( annotation.color!.eq(new Uint8ClampedArray([0, 0, 0])) );
  }

  console.log("it should set and get a transparent color...");
  {
    const annotation = new Annotation(<any>{ dict, ref });
    annotation.setColor([]);

    console.assert( annotation.color === undefined );
  }

  console.log("it should set and get a grayscale color...");
  {
    const annotation = new Annotation(<any>{ dict, ref });
    annotation.setColor([0.4]);

    console.assert( annotation.color!.eq(new Uint8ClampedArray([102, 102, 102])) );
  }

  console.log("it should set and get an RGB color...");
  {
    const annotation = new Annotation(<any>{ dict, ref });
    annotation.setColor([0, 0, 1]);

    console.assert( annotation.color!.eq(new Uint8ClampedArray([0, 0, 255])) );
  }

  console.log("it should set and get a CMYK color...");
  {
    const annotation = new Annotation(<any>{ dict, ref });
    annotation.setColor([0.1, 0.92, 0.84, 0.02]);

    console.assert( annotation.color!.eq(new Uint8ClampedArray([234, 59, 48])) );
  }

  console.log("it should not set and get an invalid color...");
  {
    const annotation = new Annotation(<any>{ dict, ref });
    annotation.setColor([0.4, 0.6]);

    console.assert( annotation.color!.eq(new Uint8ClampedArray([0, 0, 0])) );
}

  dict = ref = <any>undefined;
}

console.log("%c>>>>>>> test AnnotationBorderStyle >>>>>>>",`color:${css_1}`);
{
  console.log("it should set and get a valid width...");
  {
    const borderStyleInt = new AnnotationBorderStyle();
    borderStyleInt.setWidth(3);
    const borderStyleNum = new AnnotationBorderStyle();
    borderStyleNum.setWidth(2.5);

    console.assert( borderStyleInt.width === 3 );
    console.assert( borderStyleNum.width === 2.5 );
  }

  console.log("it should not set and get an invalid width...");
  {
    const borderStyle = new AnnotationBorderStyle();
    borderStyle.setWidth(<any>"three");

    console.assert( borderStyle.width === 1 );
  }

  console.log("it should set the width to zero, when the input is a `Name` (issue 10385)...");
  {
    const borderStyleZero = new AnnotationBorderStyle();
    borderStyleZero.setWidth(Name.get("0"));
    const borderStyleFive = new AnnotationBorderStyle();
    borderStyleFive.setWidth(Name.get("5"));

    console.assert( borderStyleZero.width === 0 );
    console.assert( borderStyleFive.width === 0 );
  }

  console.log("it should set and get a valid style...");
  {
    const borderStyle = new AnnotationBorderStyle();
    borderStyle.setStyle(Name.get("D"));

    console.assert( borderStyle.style === AnnotationBorderStyleType.DASHED );
  }

  console.log("it should not set and get an invalid style...");
  {
    const borderStyle = new AnnotationBorderStyle();
    borderStyle.setStyle(<any>"Dashed");

    console.assert( borderStyle.style === AnnotationBorderStyleType.SOLID );
  }

  console.log("it should set and get a valid dash array...");
  {
    const borderStyle = new AnnotationBorderStyle();
    borderStyle.setDashArray([1, 2, 3]);

    console.assert( borderStyle.dashArray.eq([1, 2, 3]) );
  }

  console.log("it should not set and get an invalid dash array...");
  {
    const borderStyle = new AnnotationBorderStyle();
    borderStyle.setDashArray([0, 0]);

    console.assert( borderStyle.dashArray.eq([3]) );
  }

  console.log("it should set and get a valid horizontal corner radius...");
  {
    const borderStyle = new AnnotationBorderStyle();
    borderStyle.setHorizontalCornerRadius(3);

    console.assert( borderStyle.horizontalCornerRadius === 3 );
  }

  console.log("it should not set and get an invalid horizontal corner radius...");
  {
    const borderStyle = new AnnotationBorderStyle();
    borderStyle.setHorizontalCornerRadius(<any>"three");

    console.assert( borderStyle.horizontalCornerRadius === 0 );
  }

  console.log("it should set and get a valid vertical corner radius...");
  {
    const borderStyle = new AnnotationBorderStyle();
    borderStyle.setVerticalCornerRadius(3);

    console.assert( borderStyle.verticalCornerRadius === 3 );
  }

  console.log("it should not set and get an invalid vertical corner radius...");
  {
    const borderStyle = new AnnotationBorderStyle();
    borderStyle.setVerticalCornerRadius(<any>"three");

    console.assert( borderStyle.verticalCornerRadius === 0 );
  }
}

console.log("%c>>>>>>> test MarkupAnnotation >>>>>>>",`color:${css_1}`);
{
  let dict = new Dict();
  let ref = Ref.get(1, 0);

  console.log("it should set and get a valid creation date...");
  {
    const markupAnnotation = new MarkupAnnotation(<any>{ dict, ref });
    markupAnnotation.setCreationDate("D:20190422");

    console.assert( markupAnnotation.creationDate === "D:20190422" );
  }

  console.log("it should not set and get an invalid creation date...");
  {
    const markupAnnotation = new MarkupAnnotation(<any>{ dict, ref });
    markupAnnotation.setCreationDate(undefined);

    console.assert( markupAnnotation.creationDate === undefined );
  }

  console.log("it should not parse IRT/RT when not defined...");
  {
    dict.set("Type", Name.get("Annot"));
    dict.set("Subtype", Name.get("Text"));

    const xref = new XRefMock([{ ref, data: dict }]);
    const { data } = (await AnnotationFactory.create(
      <any>xref,
      ref,
      <BasePdfManager>pdfManagerMock,
      idFactoryMock
    ))!;
    console.assert( data.inReplyTo === undefined );
    console.assert( data.replyType === undefined );
  }

  console.log("it should parse IRT and set default RT when not defined...");
  {
    const annotationRef = Ref.get(819, 0);
    const annotationDict = new Dict();
    annotationDict.set("Type", Name.get("Annot"));
    annotationDict.set("Subtype", Name.get("Text"));

    const replyRef = Ref.get(820, 0);
    const replyDict = new Dict();
    replyDict.set("Type", Name.get("Annot"));
    replyDict.set("Subtype", Name.get("Text"));
    replyDict.set("IRT", annotationRef);

    const xref = new XRefMock([
      { ref: annotationRef, data: annotationDict },
      { ref: replyRef, data: replyDict },
    ]);
    annotationDict.assignXref( <any>xref );
    replyDict.assignXref( <any>xref );

    const { data } = (await AnnotationFactory.create(
      <any>xref,
      replyRef,
      <BasePdfManager>pdfManagerMock,
      idFactoryMock
    ))!;
    console.assert( data.inReplyTo === annotationRef.toString() );
    console.assert( data.replyType === "R" );
  }

  console.log("it should parse IRT/RT for a group type...");
  {
    const annotationRef = Ref.get(819, 0);
    const annotationDict = new Dict();
    annotationDict.set("Type", Name.get("Annot"));
    annotationDict.set("Subtype", Name.get("Text"));
    annotationDict.set("T", "ParentTitle");
    annotationDict.set("Contents", "ParentText");
    annotationDict.set("CreationDate", "D:20180423");
    annotationDict.set("M", "D:20190423");
    annotationDict.set("C", [0, 0, 1]);

    const popupRef = Ref.get(820, 0);
    const popupDict = new Dict();
    popupDict.set("Type", Name.get("Annot"));
    popupDict.set("Subtype", Name.get("Popup"));
    popupDict.set("Parent", annotationRef);
    annotationDict.set("Popup", popupRef);

    const replyRef = Ref.get(821, 0);
    const replyDict = new Dict();
    replyDict.set("Type", Name.get("Annot"));
    replyDict.set("Subtype", Name.get("Text"));
    replyDict.set("IRT", annotationRef);
    replyDict.set("RT", Name.get("Group"));
    replyDict.set("T", "ReplyTitle");
    replyDict.set("Contents", "ReplyText");
    replyDict.set("CreationDate", "D:20180523");
    replyDict.set("M", "D:20190523");
    replyDict.set("C", [0.4]);

    const xref = new XRefMock([
      { ref: annotationRef, data: annotationDict },
      { ref: popupRef, data: popupDict },
      { ref: replyRef, data: replyDict },
    ]);
    annotationDict.assignXref( <any>xref );
    popupDict.assignXref( <any>xref );
    replyDict.assignXref( <any>xref );

    const { data } = (await AnnotationFactory.create(
      <any>xref,
      replyRef,
      <BasePdfManager>pdfManagerMock,
      idFactoryMock
    ))!;
    console.assert( data.inReplyTo === annotationRef.toString() );
    console.assert( data.replyType === "Group" );
    console.assert( data.titleObj!.eq({ str: "ParentTitle", dir: "ltr" }) );
    console.assert( data.contentsObj.eq({ str: "ParentText", dir: "ltr" }) );
    console.assert( data.creationDate === "D:20180423" );
    console.assert( data.modificationDate === "D:20190423" );
    console.assert( data.color!.eq(new Uint8ClampedArray([0, 0, 255])) );
    console.assert( data.hasPopup );
  }

  console.log("it should parse IRT/RT for a reply type...");
  {
    const annotationRef = Ref.get(819, 0);
    const annotationDict = new Dict();
    annotationDict.set("Type", Name.get("Annot"));
    annotationDict.set("Subtype", Name.get("Text"));
    annotationDict.set("T", "ParentTitle");
    annotationDict.set("Contents", "ParentText");
    annotationDict.set("CreationDate", "D:20180423");
    annotationDict.set("M", "D:20190423");
    annotationDict.set("C", [0, 0, 1]);

    const popupRef = Ref.get(820, 0);
    const popupDict = new Dict();
    popupDict.set("Type", Name.get("Annot"));
    popupDict.set("Subtype", Name.get("Popup"));
    popupDict.set("Parent", annotationRef);
    annotationDict.set("Popup", popupRef);

    const replyRef = Ref.get(821, 0);
    const replyDict = new Dict();
    replyDict.set("Type", Name.get("Annot"));
    replyDict.set("Subtype", Name.get("Text"));
    replyDict.set("IRT", annotationRef);
    replyDict.set("RT", Name.get("R"));
    replyDict.set("T", "ReplyTitle");
    replyDict.set("Contents", "ReplyText");
    replyDict.set("CreationDate", "D:20180523");
    replyDict.set("M", "D:20190523");
    replyDict.set("C", [0.4]);

    const xref = new XRefMock([
      { ref: annotationRef, data: annotationDict },
      { ref: popupRef, data: popupDict },
      { ref: replyRef, data: replyDict },
    ]);
    annotationDict.assignXref( <any>xref );
    popupDict.assignXref( <any>xref );
    replyDict.assignXref( <any>xref );

    const { data } = (await AnnotationFactory.create(
      <any>xref,
      replyRef,
      <BasePdfManager>pdfManagerMock,
      idFactoryMock
    ))!;
    console.assert( data.inReplyTo === annotationRef.toString() );
    console.assert( data.replyType === "R" );
    console.assert( data.titleObj!.eq({ str: "ReplyTitle", dir: "ltr" }) );
    console.assert( data.contentsObj.eq({ str: "ReplyText", dir: "ltr" }) );
    console.assert( data.creationDate === "D:20180523" );
    console.assert( data.modificationDate === "D:20190523" );
    console.assert( data.color!.eq(new Uint8ClampedArray([102, 102, 102])) );
    console.assert( !data.hasPopup );
  }

  dict = ref = <any>undefined;
}

console.log("%c>>>>>>> test TextAnnotation >>>>>>>",`color:${css_1}`);
{
  console.log("it should not parse state model and state when not defined...");
  {
    const annotationRef = Ref.get(819, 0);
    const annotationDict = new Dict();
    annotationDict.set("Type", Name.get("Annot"));
    annotationDict.set("Subtype", Name.get("Text"));
    annotationDict.set("Contents", "TestText");

    const replyRef = Ref.get(820, 0);
    const replyDict = new Dict();
    replyDict.set("Type", Name.get("Annot"));
    replyDict.set("Subtype", Name.get("Text"));
    replyDict.set("IRT", annotationRef);
    replyDict.set("RT", Name.get("R"));
    replyDict.set("Contents", "ReplyText");

    const xref = new XRefMock([
      { ref: annotationRef, data: annotationDict },
      { ref: replyRef, data: replyDict },
    ]);
    annotationDict.assignXref( <any>xref );
    replyDict.assignXref( <any>xref );

    const { data } = (await AnnotationFactory.create(
      <any>xref,
      replyRef,
      <BasePdfManager>pdfManagerMock,
      idFactoryMock
    ))!;
    console.assert( data.stateModel === undefined );
    console.assert( data.state === undefined );
  }

  console.log("it should correctly parse state model and state when defined...");
  {
    const annotationRef = Ref.get(819, 0);
    const annotationDict = new Dict();
    annotationDict.set("Type", Name.get("Annot"));
    annotationDict.set("Subtype", Name.get("Text"));

    const replyRef = Ref.get(820, 0);
    const replyDict = new Dict();
    replyDict.set("Type", Name.get("Annot"));
    replyDict.set("Subtype", Name.get("Text"));
    replyDict.set("IRT", annotationRef);
    replyDict.set("RT", Name.get("R"));
    replyDict.set("StateModel", "Review");
    replyDict.set("State", "Rejected");

    const xref = new XRefMock([
      { ref: annotationRef, data: annotationDict },
      { ref: replyRef, data: replyDict },
    ]);
    annotationDict.assignXref( <any>xref );
    replyDict.assignXref( <any>xref );

    const { data } = (await AnnotationFactory.create(
      <any>xref,
      replyRef,
      <BasePdfManager>pdfManagerMock,
      idFactoryMock
    ))!;
    console.assert( data.stateModel === "Review" );
    console.assert( data.state === "Rejected" );
  }
}

//

pdfManagerMock = <any>undefined;
idFactoryMock = <any>undefined;
partialEvaluator = <any>undefined;
/*81---------------------------------------------------------------------------*/

console.log(`%c:pdf/pdf.ts-src/core/annotation_test ${(performance.now()-strttime).toFixed(2)} ms`,`color:${css_2}`);
globalThis.ntestfile = globalThis.ntestfile ? globalThis.ntestfile+1 : 1;
