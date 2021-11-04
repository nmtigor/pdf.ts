/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
 */

/* Copyright 2012 Mozilla Foundation
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

import { assert }      from "../../../lib/util/trace.js";
import {
  AnnotationActionEventType,
  AnnotationBorderStyleType,
  AnnotationFieldFlag,
  AnnotationFlag,
  AnnotationReplyType,
  AnnotationType,
  escapeString,
  getModificationDate,
  isAscii,
  matrix_t,
  OPS,
  rect_t,
  shadow,
  stringToPDFString,
  stringToUTF16BEString,
  Util,
  warn,
} from "../shared/util.js";
import { Dict, Name, Obj, Ref, RefSet } from "./primitives.js";
import { ColorSpace } from "./colorspace.js";
import { OperatorList } from "./operator_list.js";
import { StringStream } from "./stream.js";
import { writeDict } from "./writer.js";
import { BasePdfManager } from "./pdf_manager.js";
import { LocalIdFactory } from "./document.js";
import { EvalState, PartialEvaluator } from "./evaluator.js";
import { WorkerTask } from "./worker.js";
import { TupleOf } from "../../../lib/alias.js";
import { ErrorFont, Font } from "./fonts.js";
import { AnnotActions, collectActions, getInheritableProperty } from "./core_utils.js";
import { 
  createDefaultAppearance,
  DefaultAppearanceData, 
  parseDefaultAppearance,
} from "./default_appearance.js";
import { AnnotStorageRecord } from "../display/annotation_layer.js";
import { Catalog, CatParseDestDictRes } from "./catalog.js";
import { FileSpec, Serializable } from "./file_spec.js";
import { ObjectLoader } from "./object_loader.js";
import { XRef } from "./xref.js";
import { BaseStream } from "./base_stream.js";
import { bidi, BidiText } from "./bidi.js";
import { XFAFactory } from "./xfa/factory.js";
import { XFAElObj, XFAHTMLObj } from "./xfa/alias.js";
/*81---------------------------------------------------------------------------*/

type AnnotType =
  | "Caret"
  | "Circle"
  | "FileAttachment"
  | "FreeText"
  | "Ink"
  | "Line"
  | "Link"
  | "Highlight"
  | "Polygon"
  | "PolyLine"
  | "Popup"
  | "Stamp"
  | "Square"
  | "Squiggly"
  | "StrikeOut"
  | "Text"
  | "Underline"
  | "Widget"
;

export class AnnotationFactory 
{
  /**
   * Create an `Annotation` object of the correct type for the given reference
   * to an annotation dictionary. This yields a promise that is resolved when
   * the `Annotation` object is constructed.
   *
   * @return A promise that is resolved with an {Annotation} instance.
   */
  static create( xref:XRef, ref:Ref, pdfManager:BasePdfManager, idFactory:LocalIdFactory, 
     collectFields/* #if TESTING */?/* #endif */:boolean 
  ) {
    return Promise.all([
      pdfManager.ensureCatalog("acroForm"),
      collectFields ? this._getPageIndex(xref, ref, pdfManager) : -1,
    ]).then(([ acroForm, pageIndex ]) =>
      pdfManager.ensure(this, "_create", [
        xref,
        ref,
        pdfManager,
        idFactory,
        acroForm,
        collectFields,
        pageIndex,
      ])
    );
  }

  /**
   * @private
   */
  static _create( xref:XRef, ref:Ref, 
    pdfManager:BasePdfManager, idFactory:LocalIdFactory, 
    acroForm:Dict | undefined, collectFields:boolean, pageIndex=-1
  ):Annotation | undefined {
    const dict = <Dict>xref.fetchIfRef(ref); // Table 164
    if( !(dict instanceof Dict) ) return undefined;

    const id = (ref instanceof Ref) ? ref.toString() : `annot_${idFactory.createObjId()}`;

    // Determine the annotation's subtype.
    const subtypename = dict.get("Subtype");
    const subtype = (subtypename instanceof Name) ? <AnnotType>subtypename.name : undefined;

    // Return the right annotation object based on the subtype and field type.
    const parameters:AnnotationCtorParms = {
      xref,
      ref,
      dict,
      subtype,
      id,
      pdfManager,
      acroForm: acroForm instanceof Dict ? acroForm : Dict.empty,
      collectFields,
      pageIndex,
    };

    switch( subtype )
    {
      case "Link":
        return new LinkAnnotation(parameters);

      case "Text":
        return new TextAnnotation(parameters);

      case "Widget":
        let fieldType = getInheritableProperty({ dict, key: "FT" });
        fieldType = (fieldType instanceof Name) ? fieldType.name : undefined;

        switch (fieldType) {
          case "Tx":
            return new TextWidgetAnnotation(parameters);
          case "Btn":
            return new ButtonWidgetAnnotation(parameters);
          case "Ch":
            return new ChoiceWidgetAnnotation(parameters);
          case "Sig":
            return new SignatureWidgetAnnotation(parameters);
        }
        warn(
          `Unimplemented widget field type "${fieldType}", ` +
            "falling back to base field type."
        );
        return new WidgetAnnotation(parameters);

      case "Popup":
        return new PopupAnnotation(parameters);

      case "FreeText":
        return new FreeTextAnnotation(parameters);

      case "Line":
        return new LineAnnotation(parameters);

      case "Square":
        return new SquareAnnotation(parameters);

      case "Circle":
        return new CircleAnnotation(parameters);

      case "PolyLine":
        return new PolylineAnnotation(parameters);

      case "Polygon":
        return new PolygonAnnotation(parameters);

      case "Caret":
        return new CaretAnnotation(parameters);

      case "Ink":
        return new InkAnnotation(parameters);

      case "Highlight":
        return new HighlightAnnotation(parameters);

      case "Underline":
        return new UnderlineAnnotation(parameters);

      case "Squiggly":
        return new SquigglyAnnotation(parameters);

      case "StrikeOut":
        return new StrikeOutAnnotation(parameters);

      case "Stamp":
        return new StampAnnotation(parameters);

      case "FileAttachment":
        return new FileAttachmentAnnotation(parameters);

      default:
        if( !collectFields )
        {
          if (!subtype) {
            warn("Annotation is missing the required /Subtype.");
          } 
          else {
            warn(
              `Unimplemented annotation type "${subtype}", ` +
                "falling back to base annotation."
            );
          }
        }
        return new Annotation(parameters);
    }
  }

  static async _getPageIndex( xref:XRef, ref:Ref, pdfManager:BasePdfManager )
  {
    try {
      const annotDict = await xref.fetchIfRefAsync(ref);
      if( !(annotDict instanceof Dict) ) return -1;

      const pageRef = annotDict.getRaw("P");
      if( !(pageRef instanceof Ref) ) return -1;

      const pageIndex = await pdfManager.ensureCatalog("getPageIndex", [
        pageRef,
      ]);
      return pageIndex;
    } catch (ex) {
      warn(`_getPageIndex: "${ex}".`);
      return -1;
    }
  }
}

function getRgbColor( color:number[], defaultColor=new Uint8ClampedArray(3) )
{
  if( !Array.isArray(color) ) return defaultColor;

  const rgbColor = defaultColor || new Uint8ClampedArray(3);
  switch( color.length )
  {
    case 0: // Transparent, which we indicate with a null value
      return undefined;

    case 1: // Convert grayscale to RGB
      ColorSpace.singletons.gray.getRgbItem(color, 0, rgbColor, 0);
      return rgbColor;

    case 3: // Convert RGB percentages to RGB
      ColorSpace.singletons.rgb.getRgbItem(color, 0, rgbColor, 0);
      return rgbColor;

    case 4: // Convert CMYK to RGB
      ColorSpace.singletons.cmyk.getRgbItem(color, 0, rgbColor, 0);
      return rgbColor;

    default:
      return defaultColor;
  }
}

export function getQuadPoints( dict:Dict, rect?:rect_t
):TupleOf<AnnotPoint,4>[] | undefined {
  if( !dict.has("QuadPoints") ) return undefined;

  // The region is described as a number of quadrilaterals.
  // Each quadrilateral must consist of eight coordinates.
  const quadPoints = <number[]>dict.getArray("QuadPoints");
  if( !Array.isArray(quadPoints) 
   || quadPoints.length === 0 
   || quadPoints.length % 8 > 0
  ) {
    return undefined;
  }

  const quadPointsLists:AnnotPoint[][] = [];
  for (let i = 0, ii = quadPoints.length / 8; i < ii; i++) 
  {
    // Each series of eight numbers represents the coordinates for one
    // quadrilateral in the order [x1, y1, x2, y2, x3, y3, x4, y4].
    // Convert this to an array of objects with x and y coordinates.
    quadPointsLists.push([]);
    for (let j = i * 8, jj = i * 8 + 8; j < jj; j += 2) 
    {
      const x = quadPoints[j];
      const y = quadPoints[j + 1];

      // The quadpoints should be ignored if any coordinate in the array
      // lies outside the region specified by the rectangle. The rectangle
      // can be `null` for markup annotations since their rectangle may be
      // incorrect (fixes bug 1538111).
      if( rect !== undefined 
       && (x < rect[0] || x > rect[2] || y < rect[1] || y > rect[3])
      ) {
        return undefined;
      }
      quadPointsLists[i].push({ x, y });
    }
  }

  // The PDF specification states in section 12.5.6.10 (figure 64) that the
  // order of the quadpoints should be bottom left, bottom right, top right
  // and top left. However, in practice PDF files use a different order,
  // namely bottom left, bottom right, top left and top right (this is also
  // mentioned on https://github.com/highkite/pdfAnnotate#QuadPoints), so
  // this is the actual order we should work with. However, the situation is
  // even worse since Adobe's own applications and other applications violate
  // the specification and create annotations with other orders, namely top
  // left, top right, bottom left and bottom right or even top left, top right,
  // bottom right and bottom left. To avoid inconsistency and broken rendering,
  // we normalize all lists to put the quadpoints in the same standard order
  // (see https://stackoverflow.com/a/10729881).
  return quadPointsLists.map( quadPointsList => {
    const [minX, maxX, minY, maxY] = quadPointsList.reduce(
      ([mX, MX, mY, MY], quadPoint) => [
        Math.min(mX, quadPoint.x),
        Math.max(MX, quadPoint.x),
        Math.min(mY, quadPoint.y),
        Math.max(MY, quadPoint.y),
      ],
      [Number.MAX_VALUE, Number.MIN_VALUE, Number.MAX_VALUE, Number.MIN_VALUE]
    );
    return [
      { x: minX, y: maxY },
      { x: maxX, y: maxY },
      { x: minX, y: minY },
      { x: maxX, y: minY },
    ];
  });
}

function getTransformMatrix( rect:rect_t, bbox:rect_t, matrix:matrix_t ) 
{
  // 12.5.5: Algorithm: Appearance streams
  const [minX, minY, maxX, maxY] = Util.getAxialAlignedBoundingBox(
    bbox,
    matrix
  );
  if (minX === maxX || minY === maxY) {
    // From real-life file, bbox was [0, 0, 0, 0]. In this case,
    // just apply the transform for rect
    return [1, 0, 0, 1, rect[0], rect[1]];
  }

  const xRatio = (rect[2] - rect[0]) / (maxX - minX);
  const yRatio = (rect[3] - rect[1]) / (maxY - minY);
  return [
    xRatio,
    0,
    0,
    yRatio,
    rect[0] - minX * xRatio,
    rect[1] - minY * yRatio,
  ];
}

interface AnnotationCtorParms
{
  xref:XRef;
  ref:Ref;
  dict:Dict; // Table 164
  subtype?:AnnotType | undefined;
  id:string;
  pdfManager:BasePdfManager;
  acroForm:Dict;
  collectFields:boolean;
  pageIndex:number;
}

export interface RichText
{
  str:string | undefined;
  html:XFAHTMLObj;
}

export type AnnotationData = {
  annotationFlags:AnnotationFlag;
  backgroundColor:Uint8ClampedArray | undefined;
  borderStyle:AnnotationBorderStyle;
  borderColor:Uint8ClampedArray | undefined;
  color:Uint8ClampedArray | undefined;
  contentsObj:BidiText;
  richText?:RichText | undefined;
  hasAppearance:boolean;
  id:string;
  modificationDate:string | undefined;
  rect:rect_t;
  subtype?:AnnotType | undefined;

  kidIds?:string[];
  actions?:AnnotActions | undefined;
  fieldName?:string;
  pageIndex?:number;

  annotationType?:AnnotationType,

  name?:string;
  state?:string | undefined;
  stateModel?:string | undefined;

  quadPoints?:TupleOf<AnnotPoint,4>[] | undefined;

  /* WidgetAnnotation */
  fieldValue?:string | string[] | undefined;
  defaultFieldValue?:string | string[] | undefined;
  alternativeText?:string;
  defaultAppearance?:string;
  defaultAppearanceData?:DefaultAppearanceData;
  fieldType?:string | undefined;
  fieldFlags?:AnnotationFieldFlag;
  readOnly?:boolean;
  hidden?:boolean;
  /* ~ */

    /* TextWidgetAnnotation */
    textAlignment?:number | undefined;
    maxLen?:number | undefined;
    multiLine?:boolean;
    comb?:boolean;
    /* ~ */

    /* ButtonWidgetAnnotation */
    checkBox?:boolean;
    radioButton?:boolean;
    pushButton?:boolean;
    isTooltipOnly?:boolean;
    exportValue?:string;
    buttonValue?:string | undefined;
    /* ~ */

    /* ChoiceWidgetAnnotation */
    options?:{
      exportValue?:string | string[] | undefined;
      displayValue?:string | string[] | undefined;
    }[];
    combo?:boolean;
    multiSelect?:boolean;
    /* ~ */

  /* MarkupAnnotation */
  inReplyTo?:string | undefined;
  replyType?:AnnotationReplyType;
  titleObj?:BidiText;
  creationDate?:string | undefined;
  hasPopup?:boolean;
  /* ~ */

    lineCoordinates?:rect_t; /* LineAnnotation */

    vertices?:AnnotPoint[]; /* PolylineAnnotation */

    inkLists?:AnnotPoint[][]; /* InkAnnotation */

    //
    
    file?:Serializable; /* FileAttachmentAnnotation */

  /* PopupAnnotation */
  parentType?:string | undefined;
  parentId?:string | undefined;
  parentRect?:rect_t;
  /* ~ */
} 
& CatParseDestDictRes;

/**
 * PDF 1.7 Table 56
 */
export type DashArray = [number,number] | [number] | [];

export type SaveData = {
  ref:Ref;
  data:string;
  xfa?:{
    path:string;
    value:string;
  }
}
export type SaveReturn = null | TupleOf<SaveData, 1|2>;

export interface FieldObject
{
  id:string;
  type:string;

  value?:string | string[] | undefined;
  defaultValue?:string | string[];
  editable?:boolean;
  rect?:rect_t;
  name?:string;
  hidden?:boolean;
  actions?:AnnotActions;
  kidIds?:string[];
  page?:number;

  multiline?:boolean;
  password?:boolean;
  charLimit?:number;
  comb?:boolean;

  exportValues?:string;

  numItems?:number;
  multipleSelection?:boolean;
}

export class Annotation 
{
  _streams:BaseStream[] = [];

  data:AnnotationData;

  _fallbackFontDict?:Dict;

  /* flags */
  flags!:AnnotationFlag;

  /**
   * Set the flags.
   *
   * @param flags - Unsigned 32-bit integer specifying annotation characteristics
   * @see {@link shared/util.js}
   */
  setFlags( flags:unknown ) 
  {
    this.flags = Number.isInteger(flags) && <number>flags > 0 ? <number>flags : 0;
  }

  protected _hasFlag( flags:AnnotationFlag, flag:AnnotationFlag )
  {
    return !!(flags & flag);
  }
  /**
   * Check if a provided flag is set.
   *
   * @param flag - Hexadecimal representation for an annotation characteristic
   * @see {@link shared/util.js}
   */
  hasFlag( flag:AnnotationFlag ) 
  {
    return this._hasFlag(this.flags, flag);
  }

  protected _isViewable( flags:AnnotationFlag )
  {
    return !this._hasFlag(flags, AnnotationFlag.INVISIBLE)
        && !this._hasFlag(flags, AnnotationFlag.NOVIEW);
  }
  get viewable() {
    if( this.data.quadPoints === undefined )
    {
      return false;
    }
    if( <number>this.flags === 0 )
    {
      return true;
    }
    return this._isViewable(this.flags);
  }
  /**
   * Check if the annotation must be displayed by taking into account
   * the value found in the annotationStorage which may have been set
   * through JS.
   *
   * @param annotationStorage Storage for annotation
   */
  mustBeViewed( annotationStorage?:AnnotStorageRecord )
  {
    const storageEntry =
      annotationStorage && annotationStorage.get(this.data.id);
    if( storageEntry && storageEntry.hidden !== undefined )
    {
      return !storageEntry.hidden;
    }
    return this.viewable && !this._hasFlag(this.flags, AnnotationFlag.HIDDEN);
  }

  #isPrintable( flags:AnnotationFlag )
  {
    return this._hasFlag(flags, AnnotationFlag.PRINT)
      && !this._hasFlag(flags, AnnotationFlag.INVISIBLE);
  }
  get printable()
  {
    if( this.data.quadPoints === undefined ) return false;

    if( <number>this.flags === 0 ) return false;

    return this.#isPrintable( this.flags );
  }
  /**
   * Check if the annotation must be printed by taking into account
   * the value found in the annotationStorage which may have been set
   * through JS.
   *
   * @param annotationStorage Storage for annotation
   */
  mustBePrinted( annotationStorage?:AnnotStorageRecord )
  {
    const storageEntry =
      annotationStorage && annotationStorage.get(this.data.id);
    if( storageEntry && storageEntry.print !== undefined )
    {
      return storageEntry.print;
    }
    return this.printable;
  }
  /* ~ */

  color:Uint8ClampedArray | undefined;
  borderStyle!:AnnotationBorderStyle;
  borderColor:Uint8ClampedArray | undefined;
  backgroundColor:Uint8ClampedArray | undefined;

  /* _title */
  _title!:BidiText;

  /**
   * Set the title.
   *
   * @final
   * @param The title of the annotation, used e.g. with
   *   PopupAnnotations.
   */
  setTitle( title:unknown )
  {
    this._title = this.#parseStringHelper(title);
  }
  /* ~ */

  /* contents */
  _contents!:BidiText;

  /**
   * Set the contents.
   *
   * @param contents Text to display for the annotation or, if the
   *  type of annotation does not display text, a
   *  description of the annotation's contents
   */
  setContents( contents?:string )
  {
    this._contents = this.#parseStringHelper(contents);
  }
  /* ~ */

  appearance?:BaseStream | undefined;

  /* modificationDate */
  modificationDate:string | undefined;

  /**
   * Set the modification date.
   *
   * @param modificationDate - PDF date string that indicates when the
   *  annotation was last modified
   */
  setModificationDate( modificationDate:unknown ) 
  {
    this.modificationDate = (typeof modificationDate === "string")
      ? modificationDate
      : undefined;
  }
  /* ~ */

  /* rectangle */
  rectangle!:rect_t;

  /**
   * Set the rectangle.
   *
   * @param rectangle - The rectangle array with exactly four entries
   */
  setRectangle( rectangle:unknown )
  {
    if (Array.isArray(rectangle) && rectangle.length === 4) {
      this.rectangle = Util.normalizeRect( <rect_t>rectangle );
    } 
    else {
      this.rectangle = [0, 0, 0, 0];
    }
  }
  /* ~ */

  constructor( params:AnnotationCtorParms ) 
  {
    const dict = params.dict; // Table 164

    this.setTitle( dict.get("T") );
    this.setContents( <string | undefined>dict.get("Contents") );
    this.setModificationDate( dict.get("M") );
    this.setFlags( dict.get("F") );
    this.setRectangle( dict.getArray("Rect") );
    this.setColor( <number[]>dict.getArray("C") );
    this.setBorderStyle( dict );
    this.setAppearance( dict );
    this.setBorderAndBackgroundColors( dict.get("MK") );

    if (this.appearance) 
    {
      this._streams.push(this.appearance);
    }

    // Expose public properties using a data object.
    this.data = {
      annotationFlags: this.flags,
      borderStyle: this.borderStyle,
      color: this.color,
      backgroundColor: this.backgroundColor,
      borderColor: this.borderColor,
      contentsObj: this._contents,
      hasAppearance: !!this.appearance,
      id: params.id,
      modificationDate: this.modificationDate,
      rect: this.rectangle,
      subtype: params.subtype,
    }

    if( params.collectFields )
    {
      // Fields can act as container for other fields and have
      // some actions even if no Annotation inherit from them.
      // Those fields can be referenced by CO (calculation order).
      const kids = dict.get("Kids");
      if( Array.isArray(kids) )
      {
        const kidIds = [];
        for( const kid of kids )
        {
          if( (kid instanceof Ref) )
          {
            kidIds.push( kid.toString() );
          }
        }
        if( kidIds.length !== 0 )
        {
          this.data.kidIds = kidIds;
        }
      }

      this.data.actions = collectActions(
        params.xref,
        dict,
        AnnotationActionEventType
      );
      this.data.fieldName = this.constructFieldName$(dict);
      this.data.pageIndex = params.pageIndex;
    }
  }

  #parseStringHelper( data:unknown ):BidiText
  {
    const str = typeof data === "string" ? stringToPDFString(data) : "";
    const dir = str && bidi(str).dir === "rtl" ? "rtl" : "ltr";

    return { str, dir };
  }

  /**
   * Set the border style (as AnnotationBorderStyle object).
   *
   * @param borderStyle - The border style dictionary
   */
  setBorderStyle( borderStyle:Dict ) 
  {
    // #if !PRODUCTION || TESTING
    // if (
    //   typeof PDFJSDev === "undefined" ||
    //   PDFJSDev.test("!PRODUCTION || TESTING")
    // ) {
    assert(this.rectangle, "setRectangle must have been called previously.");
    // }
    // #endif

    this.borderStyle = new AnnotationBorderStyle();
    if( !(borderStyle instanceof Dict) ) return;

    if (borderStyle.has("BS")) 
    {
      const dict = <Dict>borderStyle.get("BS");
      const dictType = dict.get("Type");

      if( !dictType || (dictType instanceof Name && dictType.name === "Border") ) 
      {
        this.borderStyle.setWidth( <number | undefined>dict.get("W"), this.rectangle );
        this.borderStyle.setStyle( <Name | undefined>dict.get("S") );
        this.borderStyle.setDashArray( <DashArray | undefined>dict.getArray("D") );
      }
    } 
    else if( borderStyle.has("Border") )
    {
      const array = <[number,number,number,DashArray | undefined]>borderStyle.getArray("Border");
      if (Array.isArray(array) && array.length >= 3) 
      {
        this.borderStyle.setHorizontalCornerRadius(array[0]);
        this.borderStyle.setVerticalCornerRadius(array[1]);
        this.borderStyle.setWidth(array[2], this.rectangle);

        if (array.length === 4) 
        {
          // Dash array available
          this.borderStyle.setDashArray( array[3], /* forceStyle = */ true );
        }
      }
    } 
    else {
      // There are no border entries in the dictionary. According to the
      // specification, we should draw a solid border of width 1 in that
      // case, but Adobe Reader did not implement that part of the
      // specification and instead draws no border at all, so we do the same.
      // See also https://github.com/mozilla/pdf.js/issues/6179.
      this.borderStyle.setWidth(0);
    }
  }

  /**
   * Set the color and take care of color space conversion.
   * The default value is black, in RGB color space.
   *
   * @param color The color array containing either 0
   *  (transparent), 1 (grayscale), 3 (RGB) or 4 (CMYK) elements
   */
  setColor( color:number[] )
  {
    this.color = getRgbColor(color);
  }

  /**
   * Set the (normal) appearance.
   *
   * @param dict The annotation's data dictionary
   */
  setAppearance( dict:Dict ) 
  {
    this.appearance = undefined;

    const appearanceStates = dict.get("AP");
    if( !(appearanceStates instanceof Dict) ) return;

    // In case the normal appearance is a stream, then it is used directly.
    const normalAppearanceState = appearanceStates.get("N");
    if( normalAppearanceState instanceof BaseStream )
    {
      this.appearance = normalAppearanceState;
      return;
    }
    if( !(normalAppearanceState instanceof Dict) ) return;

    // In case the normal appearance is a dictionary, the `AS` entry provides
    // the key of the stream in this dictionary.
    const as = dict.get("AS");
    if( !(as instanceof Name) || !normalAppearanceState.has(as.name) ) 
      return;

    this.appearance = <BaseStream>normalAppearanceState.get( as.name );
  }

  /**
   * Set the color for background and border if any.
   * The default values are transparent.
   *
   * @param mk The MK dictionary
   */
  setBorderAndBackgroundColors( mk:unknown ) 
  {
    if (mk instanceof Dict ) 
    {
      this.borderColor = getRgbColor( <number[]>mk.getArray("BC") );
      this.backgroundColor = getRgbColor( <number[]>mk.getArray("BG") );
    } 
    else {
      this.borderColor = this.backgroundColor = undefined;
    }
  }

  loadResources( keys:string[] ) 
  {
    return this.appearance!.dict!.getAsync<Dict>("Resources").then(resources => {
      if( !resources ) return undefined;

      const objectLoader = new ObjectLoader( resources, keys, resources.xref! );
      return objectLoader.load().then(function () {
        return resources;
      });
    });
  }

  getOperatorList( evaluator:PartialEvaluator, task:WorkerTask, 
    renderForms?:boolean, annotationStorage?:AnnotStorageRecord
  ) {
    if (!this.appearance) 
    {
      return Promise.resolve(new OperatorList());
    }

    const appearance = this.appearance;
    const data = this.data;
    const appearanceDict = appearance.dict!;
    const resourcesPromise = this.loadResources([
      "ExtGState",
      "ColorSpace",
      "Pattern",
      "Shading",
      "XObject",
      "Font",
    ]);
    const bbox = <rect_t>appearanceDict.getArray("BBox") ?? [0, 0, 1, 1];
    const matrix = <matrix_t>appearanceDict.getArray("Matrix") ?? [1, 0, 0, 1, 0, 0];
    const transform = getTransformMatrix(data.rect, bbox, matrix);

    return resourcesPromise.then(resources => {
      const opList = new OperatorList();
      opList.addOp(OPS.beginAnnotation, [
        data.id,
        data.rect, 
        transform, 
        matrix,
      ]);
      return evaluator
        .getOperatorList({
          stream: appearance,
          task,
          resources,
          operatorList: opList,
          fallbackFontDict: this._fallbackFontDict,
        })
        .then(() => {
          opList.addOp(OPS.endAnnotation, []);
          this.reset();
          return opList;
        });
    });
  }

  async save( evaluator:PartialEvaluator, task:WorkerTask, 
    annotationStorage?:AnnotStorageRecord
  ):Promise<SaveReturn> 
  {
    return null;
  }

  /**
   * Get field data for usage in JS sandbox.
   *
   * Field object is defined here:
   * https://www.adobe.com/content/dam/acom/en/devnet/acrobat/pdfs/js_api_reference.pdf#page=16
   */
  getFieldObject()
  {
    if( this.data.kidIds )
    {
      return <FieldObject>{
        id: this.data.id,
        actions: this.data.actions,
        name: this.data.fieldName,
        strokeColor: this.data.borderColor,
        fillColor: this.data.backgroundColor,
        type: "",
        kidIds: this.data.kidIds,
        page: this.data.pageIndex,
      };
    }
    return undefined;
  }

  /**
   * Reset the annotation.
   *
   * This involves resetting the various streams that are either cached on the
   * annotation instance or created during its construction.
   */
  reset()
  {
    // #if !PRODUCTION || TESTING"
    // if (
    //   (typeof PDFJSDev === "undefined" ||
    //     PDFJSDev.test("!PRODUCTION || TESTING")) &&
    //   this.appearance &&
    //   !this._streams.includes(this.appearance)
    // ) {
    if( this.appearance
     && !this._streams.includes(this.appearance)
    ) {
      assert(0,"The appearance stream should always be reset.");
    }
    // #endif

    for (const stream of this._streams) {
      stream.reset();
    }
  }

  /**
   * Construct the (fully qualified) field name from the (partial) field
   * names of the field and its ancestors.
   *
   * @param dict Complete widget annotation dictionary
   */
   protected constructFieldName$( dict:Dict )
   {
    // Both the `Parent` and `T` fields are optional. While at least one of
    // them should be provided, bad PDF generators may fail to do so.
    if( !dict.has("T") && !dict.has("Parent") )
    {
      warn("Unknown field name, falling back to empty field name.");
      return "";
    }

    // If no parent exists, the partial and fully qualified names are equal.
    if( !dict.has("Parent") )
    {
      return stringToPDFString( <string>dict.get("T") );
    }

    // Form the fully qualified field name by appending the partial name to
    // the parent's fully qualified name, separated by a period.
    const fieldName = [];
    if (dict.has("T")) {
      fieldName.unshift(stringToPDFString( <string>dict.get("T")) );
    }

    let loopDict = dict;
    const visited = new RefSet();
    if( dict.objId )
    {
      visited.put(dict.objId);
    }
    while( loopDict.has("Parent") )
    {
      loopDict = <Dict>loopDict.get("Parent");
      if( !(loopDict instanceof Dict)
       || (loopDict.objId && visited.has(loopDict.objId))
      ) {
        // Even though it is not allowed according to the PDF specification,
        // bad PDF generators may provide a `Parent` entry that is not a
        // dictionary, but `null` for example (issue 8143).
        //
        // If parent has been already visited, it means that we're
        // in an infinite loop.
        break;
      }
      if (loopDict.objId) {
        visited.put(loopDict.objId);
      }

      if (loopDict.has("T")) {
        fieldName.unshift(stringToPDFString( <string>loopDict.get("T")) );
      }
    }
    return fieldName.join(".");
  }
}

/**
 * Contains all data regarding an annotation's border style.
 */
export class AnnotationBorderStyle 
{
  width = 1;
  style = AnnotationBorderStyleType.SOLID;
  dashArray = [3];
  horizontalCornerRadius = 0;
  verticalCornerRadius = 0;

  /**
   * Set the width.
   *
   * @param width The width.
   * @param rect The annotation `Rect` entry.
   */
  setWidth( width?:number | Name, rect:rect_t=[0, 0, 0, 0] )
  {
    // #if !PRODUCTION || TESTING
      assert(
        Array.isArray(rect) && rect.length === 4,
        "A valid `rect` parameter must be provided."
      );
    // #endif

    // Some corrupt PDF generators may provide the width as a `Name`,
    // rather than as a number (fixes issue 10385).
    if( width instanceof Name ) 
    {
      this.width = 0; // This is consistent with the behaviour in Adobe Reader.
      return;
    }
    if (Number.isInteger(width)) 
    {
      if (width! > 0) {
        const maxWidth = (rect[2] - rect[0]) / 2;
        const maxHeight = (rect[3] - rect[1]) / 2;

        // Ignore large `width`s, since they lead to the Annotation overflowing
        // the size set by the `Rect` entry thus causing the `annotationLayer`
        // to render it over the surrounding document (fixes bug1552113.pdf).
        if (
          maxWidth > 0 &&
          maxHeight > 0 &&
          (width! > maxWidth || width! > maxHeight)
        ) {
          warn(`AnnotationBorderStyle.setWidth - ignoring width: ${width}`);
          width = 1;
        }
      }
      this.width = width!;
    }
  }

  /**
   * Set the style.
   *
   * @param style The annotation style.
   * @see {@link shared/util.js}
   */
  setStyle( style?:Name )
  {
    if( !(style instanceof Name) ) return;

    switch(style.name )
    {
      case "S":
        this.style = AnnotationBorderStyleType.SOLID;
        break;

      case "D":
        this.style = AnnotationBorderStyleType.DASHED;
        break;

      case "B":
        this.style = AnnotationBorderStyleType.BEVELED;
        break;

      case "I":
        this.style = AnnotationBorderStyleType.INSET;
        break;

      case "U":
        this.style = AnnotationBorderStyleType.UNDERLINE;
        break;

      default:
        break;
    }
  }

  /**
   * Set the dash array.
   *
   * @param dashArray The dash array with at least one element
   */
  setDashArray( dashArray?:DashArray, forceStyle=false ) 
  {
    // We validate the dash array, but we do not use it because CSS does not
    // allow us to change spacing of dashes. For more information, visit
    // http://www.w3.org/TR/css3-background/#the-border-style.
    if (Array.isArray(dashArray) && dashArray.length > 0) 
    {
      // According to the PDF specification: the elements in `dashArray`
      // shall be numbers that are nonnegative and not all equal to zero.
      let isValid = true;
      let allZeros = true;
      for (const element of dashArray) {
        const validNumber = +element >= 0;
        if (!validNumber) {
          isValid = false;
          break;
        } 
        else if (element > 0) {
          allZeros = false;
        }
      }
      if (isValid && !allZeros) 
      {
        this.dashArray = dashArray;

        if (forceStyle) 
        {
          // Even though we cannot use the dash array in the display layer,
          // at least ensure that we use the correct border-style.
          this.setStyle(Name.get("D"));
        }
      } 
      else {
        this.width = 0; // Adobe behavior when the array is invalid.
      }
    } 
    else if (dashArray) 
    {
      this.width = 0; // Adobe behavior when the array is invalid.
    }
  }

  /**
   * Set the horizontal corner radius (from a Border dictionary).
   *
   * @param radius - The horizontal corner radius.
   */
  setHorizontalCornerRadius( radius:number ) 
  {
    if (Number.isInteger(radius)) {
      this.horizontalCornerRadius = radius;
    }
  }

  /**
   * Set the vertical corner radius (from a Border dictionary).
   *
   * @param radius - The vertical corner radius.
   */
  setVerticalCornerRadius( radius:number ) 
  {
    if (Number.isInteger(radius)) {
      this.verticalCornerRadius = radius;
    }
  }
}

export interface AnnotPoint
{
  x:number;
  y:number;
}

type AColor = TupleOf< number, 0|1|3|4 >; // Table 164 C

interface SetDefaultAppearanceParms
{
  xref:XRef;
  extra?:string;
  strokeColor?:AColor;
  strokeAlpha?:number | undefined;
  fillColor?:AColor | undefined;
  fillAlpha?:number | undefined;
  blendMode?:string;
  pointsCallback:( buffer:string[], points:TupleOf<AnnotPoint,4> ) => rect_t;
}

/**
 * 12.5.6.2
 */
export class MarkupAnnotation extends Annotation 
{
  /* creationDate */
  creationDate?:string | undefined;
  
  /**
   * Set the creation date.
   *
   * @param creationDate - PDF date string that indicates when the
   *  annotation was originally created
   */
  setCreationDate( creationDate:unknown ) 
  {
    this.creationDate = (typeof creationDate === "string") 
      ? creationDate 
      : undefined;
  }
  /* ~ */

  constructor( parameters:AnnotationCtorParms )
  {
    super(parameters);

    const dict = parameters.dict; // Table 170

    if( dict.has("IRT") )
    {
      const rawIRT = dict.getRaw("IRT");
      this.data.inReplyTo = (rawIRT instanceof Ref) ? rawIRT.toString() : undefined;

      const rt = dict.get("RT");
      this.data.replyType = (rt instanceof Name) ? <AnnotationReplyType>rt.name : AnnotationReplyType.REPLY;
    }

    if( this.data.replyType === AnnotationReplyType.GROUP )
    {
      // Subordinate annotations in a group should inherit
      // the group attributes from the primary annotation.
      const parent = <Dict>dict.get("IRT");

      this.setTitle( parent.get("T") );
      this.data.titleObj = this._title;

      this.setContents( <string | undefined>parent.get("Contents") );
      this.data.contentsObj = this._contents;

      if( !parent.has("CreationDate") )
      {
        this.data.creationDate = undefined;
      } 
      else {
        this.setCreationDate(parent.get("CreationDate"));
        this.data.creationDate = this.creationDate;
      }

      if (!parent.has("M")) 
      {
        this.data.modificationDate = undefined;
      } 
      else {
        this.setModificationDate(parent.get("M"));
        this.data.modificationDate = this.modificationDate;
      }

      this.data.hasPopup = parent.has("Popup");

      if( !parent.has("C") )
      {
        // Fall back to the default background color.
        this.data.color = undefined;
      } 
      else {
        this.setColor( <number[]>parent.getArray("C") );
        this.data.color = this.color;
      }
    } 
    else {
      this.data.titleObj = this._title;

      this.setCreationDate( dict.get("CreationDate") );
      this.data.creationDate = this.creationDate;

      this.data.hasPopup = dict.has("Popup");

      if (!dict.has("C")) 
      {
        // Fall back to the default background color.
        this.data.color = undefined;
      }
    }

    if (dict.has("RC")) 
    {
      this.data.richText = XFAFactory.getRichTextAsHtml( <string>dict.get("RC") );
    }
  }

  /** @final */
  protected setDefaultAppearance$({
    xref,
    extra,
    strokeColor,
    fillColor,
    blendMode,
    strokeAlpha,
    fillAlpha,
    pointsCallback,
  }:SetDefaultAppearanceParms ) {
    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    let maxX = Number.MIN_VALUE;
    let maxY = Number.MIN_VALUE;

    const buffer = ["q"];
    if (extra) {
      buffer.push(extra);
    }
    if (strokeColor) {
      buffer.push(`${strokeColor[0]} ${strokeColor[1]} ${strokeColor[2]} RG`);
    }
    if (fillColor) {
      buffer.push(`${fillColor[0]} ${fillColor[1]} ${fillColor[2]} rg`);
    }

    let pointsArray = this.data.quadPoints;
    if( !pointsArray )
    {
      // If there are no quadpoints, the rectangle should be used instead.
      // Convert the rectangle definition to a points array similar to how the
      // quadpoints are defined.
      pointsArray = [
        [
          { x: this.rectangle[0], y: this.rectangle[3] },
          { x: this.rectangle[2], y: this.rectangle[3] },
          { x: this.rectangle[0], y: this.rectangle[1] },
          { x: this.rectangle[2], y: this.rectangle[1] },
        ],
      ];
    }

    for( const points of pointsArray )
    {
      const [mX, MX, mY, MY] = pointsCallback( buffer, <TupleOf<AnnotPoint,4>>points );
      minX = Math.min(minX, mX);
      maxX = Math.max(maxX, MX);
      minY = Math.min(minY, mY);
      maxY = Math.max(maxY, MY);
    }
    buffer.push("Q");

    const formDict = new Dict(xref);
    const appearanceStreamDict = new Dict(xref);
    appearanceStreamDict.set("Subtype", Name.get("Form"));

    const appearanceStream = new StringStream(buffer.join(" "));
    appearanceStream.dict = appearanceStreamDict;
    formDict.set("Fm0", appearanceStream);

    const gsDict = new Dict(xref);
    if (blendMode) 
    {
      gsDict.set("BM", Name.get(blendMode));
    }
    if (typeof strokeAlpha === "number") 
    {
      gsDict.set("CA", strokeAlpha);
    }
    if (typeof fillAlpha === "number") 
    {
      gsDict.set("ca", fillAlpha);
    }

    const stateDict = new Dict(xref);
    stateDict.set("GS0", gsDict);

    const resources = new Dict(xref);
    resources.set("ExtGState", stateDict);
    resources.set("XObject", formDict);

    const appearanceDict = new Dict(xref);
    appearanceDict.set("Resources", resources);
    const bbox = (this.data.rect = [minX, minY, maxX, maxY]);
    appearanceDict.set("BBox", bbox);

    this.appearance = new StringStream("/GS0 gs /Fm0 Do");
    this.appearance.dict = appearanceDict;

    // This method is only called if there is no appearance for the annotation,
    // so `this.appearance` is not pushed yet in the `Annotation` constructor.
    this._streams.push(this.appearance, appearanceStream);
  }
}

interface FieldResources
{
  localResources?:Dict | undefined;
  acroFormResources?:Dict | undefined;
  appearanceResources?:Dict | undefined;
  mergedResources:Dict;
}

class WidgetAnnotation extends Annotation 
{
  ref:Ref;

  _defaultAppearance:string;
  _fieldResources:FieldResources;

  protected _hasText?:boolean;

  constructor( params:AnnotationCtorParms )
  {
    super(params);

    const dict = params.dict;
    const data = this.data;
    this.ref = params.ref;

    data.annotationType = AnnotationType.WIDGET;
    if( data.fieldName === undefined )
    {
      data.fieldName = this.constructFieldName$(dict);
    }
    if( data.actions === undefined )
    {
      data.actions = collectActions(
        params.xref,
        dict,
        AnnotationActionEventType
      );
    }

    const fieldValue = getInheritableProperty({
      dict,
      key: "V",
      getArray: true,
    });
    data.fieldValue = this._decodeFormValue( fieldValue );

    const defaultFieldValue = getInheritableProperty({
      dict,
      key: "DV",
      getArray: true,
    });
    data.defaultFieldValue = this._decodeFormValue( defaultFieldValue );

    // When no "V" entry exists, let the fieldValue fallback to the "DV" entry
    // (fixes issue13823.pdf).
    if( fieldValue === undefined && data.defaultFieldValue !== undefined ) 
    {
      data.fieldValue = data.defaultFieldValue;
    }

    data.alternativeText = stringToPDFString( <string>dict.get("TU") ?? "" );

    const defaultAppearance =
      getInheritableProperty({ dict, key: "DA" }) || params.acroForm.get("DA");
    this._defaultAppearance = (typeof defaultAppearance === "string")
      ? defaultAppearance
      : "";
    data.defaultAppearanceData = parseDefaultAppearance(
      this._defaultAppearance
    );

    const fieldType = getInheritableProperty({ dict, key: "FT" });
    data.fieldType = (fieldType instanceof Name) ? fieldType.name : undefined;

    const localResources = <Dict | undefined>getInheritableProperty({ dict, key: "DR" });
    const acroFormResources = <Dict | undefined>params.acroForm.get("DR");
    const appearanceResources = <Dict | undefined>this.appearance?.dict!.get("Resources");

    this._fieldResources = {
      localResources,
      acroFormResources,
      appearanceResources,
      mergedResources: Dict.merge({
        xref: params.xref,
        dictArray: [localResources, appearanceResources, acroFormResources],
        mergeSubDicts: true,
      }),
    };

    data.fieldFlags = <AnnotationFieldFlag>getInheritableProperty({ dict, key: "Ff" });
    if( !Number.isInteger(data.fieldFlags) || data.fieldFlags < 0 )
    {
      data.fieldFlags = 0;
    }

    data.readOnly = this.hasFieldFlag( AnnotationFieldFlag.READONLY );
    data.hidden = this._hasFlag( data.annotationFlags, AnnotationFlag.HIDDEN );
  }

  /**
   * Decode the given form value.
   *
   * @param formValue The (possibly encoded) form value.
   */
  protected _decodeFormValue( formValue:unknown )
  {
    if( Array.isArray(formValue) )
    {
      return formValue
        .filter( item => typeof item === "string" )
        .map(item => stringToPDFString(item));
    } 
    else if( formValue instanceof Name )
    {
      return stringToPDFString( formValue.name );
    }
    else if( typeof formValue === "string" )
    {
      return stringToPDFString( formValue );
    }
    return undefined;
  }

  /**
   * Check if a provided field flag is set.
   *
   * @param flag Hexadecimal representation for an annotation field characteristic
   * @see {@link shared/util.js}
   */
  hasFieldFlag( flag:AnnotationFieldFlag ) 
  {
    return !!(this.data.fieldFlags! & flag);
  }

  override getOperatorList( evaluator:PartialEvaluator, task:WorkerTask, 
    renderForms?:boolean, annotationStorage?:AnnotStorageRecord
  ) {
    // Do not render form elements on the canvas when interactive forms are
    // enabled. The display layer is responsible for rendering them instead.
    if (renderForms && !(this instanceof SignatureWidgetAnnotation)) 
    {
      return Promise.resolve(new OperatorList());
    }

    if (!this._hasText) {
      return super.getOperatorList(
        evaluator,
        task,
        renderForms,
        annotationStorage
      );
    }

    return this._getAppearance(evaluator, task, annotationStorage).then(
      content => {
        if( this.appearance && content === undefined )
        {
          return super.getOperatorList(
            evaluator,
            task,
            renderForms,
            annotationStorage
          );
        }

        const operatorList = new OperatorList();

        // Even if there is an appearance stream, ignore it. This is the
        // behaviour used by Adobe Reader.
        if( !this._defaultAppearance || content === undefined )
        {
          return operatorList;
        }

        const matrix:matrix_t = [1, 0, 0, 1, 0, 0];
        const bbox:rect_t = [
          0,
          0,
          this.data.rect[2] - this.data.rect[0],
          this.data.rect[3] - this.data.rect[1],
        ];

        const transform = getTransformMatrix(this.data.rect, bbox, matrix);
        operatorList.addOp(OPS.beginAnnotation, [
          this.data.id,
          this.data.rect,
          transform,
          matrix,
        ]);

        const stream = new StringStream( content );
        return evaluator
          .getOperatorList({
            stream,
            task,
            resources: this._fieldResources.mergedResources,
            operatorList,
          })
          .then(function () {
            operatorList.addOp(OPS.endAnnotation, []);
            return operatorList;
          });
      }
    );
  }

  override async save( evaluator:PartialEvaluator, task:WorkerTask, 
    annotationStorage?:AnnotStorageRecord
  ):Promise<SaveReturn> {
    if( !annotationStorage ) return null;

    const storageEntry = annotationStorage.get(this.data.id);
    const value = storageEntry?.value;
    if (value === this.data.fieldValue || value === undefined) {
      return null;
    }

    let appearance = await this._getAppearance(
      evaluator,
      task,
      annotationStorage
    );
    if (appearance === undefined) {
      return null;
    }
    const { xref } = evaluator;

    const dict = <Dict>xref.fetchIfRef(this.ref);
    if( !(dict instanceof Dict) ) return null;

    const bbox = [
      0,
      0,
      this.data.rect[2] - this.data.rect[0],
      this.data.rect[3] - this.data.rect[1],
    ];

    const xfa = {
      path: stringToPDFString( <string>dict.get("T") ?? "" ),
      value: <string>value,
    };

    const newRef = xref.getNewRef();
    const AP = new Dict(xref);
    AP.set("N", newRef);

    const encrypt = xref.encrypt;
    let originalTransform = null;
    let newTransform = null;
    if (encrypt) {
      originalTransform = encrypt.createCipherTransform(
        this.ref.num,
        this.ref.gen
      );
      newTransform = encrypt.createCipherTransform(newRef.num, newRef.gen);
      appearance = newTransform.encryptString(appearance);
    }

    dict.set("V", isAscii(<string>value) ? <string>value : stringToUTF16BEString(<string>value));
    dict.set("AP", AP);
    dict.set("M", `D:${getModificationDate()}`);

    const appearanceDict = new Dict(xref);
    appearanceDict.set("Length", appearance.length);
    appearanceDict.set("Subtype", Name.get("Form"));
    appearanceDict.set("Resources", this._getSaveFieldResources(xref));
    appearanceDict.set("BBox", bbox);

    const bufferOriginal = [`${this.ref.num} ${this.ref.gen} obj\n`];
    writeDict(dict, bufferOriginal, originalTransform);
    bufferOriginal.push("\nendobj\n");

    const bufferNew = [`${newRef.num} ${newRef.gen} obj\n`];
    writeDict(appearanceDict, bufferNew, newTransform);
    bufferNew.push(" stream\n", appearance, "\nendstream\nendobj\n");

    return [
      // data for the original object
      // V field changed + reference for new AP
      { ref: this.ref, data: bufferOriginal.join(""), xfa },
      // data for the new AP
      { ref: newRef, data: bufferNew.join("") },
    ];
  }

  _getCombAppearance( defaultAppearance:string, font:Font | ErrorFont, 
    text:string, width:number, hPadding:number, vPadding:number
  ) {
    return "";
  }

  _getMultilineAppearance(
    defaultAppearance:string,
    text:string,
    font:Font | ErrorFont,
    fontSize:number,
    width:number,
    height:number,
    alignment:number,
    hPadding:number,
    vPadding:number
  ) {
    return "";
  }

  async _getAppearance( evaluator:PartialEvaluator, task:WorkerTask, 
    annotationStorage?:AnnotStorageRecord
  ) {
    const isPassword = this.hasFieldFlag(AnnotationFieldFlag.PASSWORD);
    if( !annotationStorage || isPassword ) return undefined;

    const storageEntry = annotationStorage.get(this.data.id);
    let value = storageEntry?.value;
    if( value === undefined )
    {
      // The annotation hasn't been rendered so use the appearance
      return undefined;
    }

    value = (<string>value).trim();

    if (value === "") {
      // the field is empty: nothing to render
      return "";
    }

    let lineCount = -1;
    if( this.data.multiLine )
    {
      lineCount = value.split(/\r\n|\r|\n/).length;
    }

    const defaultPadding = 2;
    const hPadding = defaultPadding;
    const totalHeight = this.data.rect[3] - this.data.rect[1];
    const totalWidth = this.data.rect[2] - this.data.rect[0];

    if( !this._defaultAppearance )
    {
      // The DA is required and must be a string.
      // If there is no font named Helvetica in the resource dictionary,
      // the evaluator will fall back to a default font.
      // Doing so prevents exceptions and allows saving/printing
      // the file as expected.
      this.data.defaultAppearanceData = parseDefaultAppearance(
        (this._defaultAppearance = "/Helvetica 0 Tf 0 g")
      );
    }

    const [defaultAppearance, fontSize] = this.#computeFontSize(
      totalHeight,
      lineCount
    );

    const font = await this._getFontData( evaluator, task );

    let descent = font.descent;
    if( isNaN(descent) ) 
    {
      descent = 0;
    }

    const vPadding = defaultPadding + Math.abs(descent) * +fontSize;
    const alignment = this.data.textAlignment!;

    if( this.data.multiLine )
    {
      return this._getMultilineAppearance(
        defaultAppearance,
        value,
        font,
        fontSize,
        totalWidth,
        totalHeight,
        alignment,
        hPadding,
        vPadding
      );
    }

    // TODO: need to handle chars which are not in the font.
    const encodedString = font.encodeString(value).join("");

    if( this.data.comb )
    {
      return this._getCombAppearance(
        defaultAppearance,
        font,
        encodedString,
        totalWidth,
        hPadding,
        vPadding
      );
    }

    if (alignment === 0 || alignment > 2) {
      // Left alignment: nothing to do
      return (
        "/Tx BMC q BT " +
        defaultAppearance +
        ` 1 0 0 1 ${hPadding} ${vPadding} Tm (${escapeString(
          encodedString
        )}) Tj` +
        " ET Q EMC"
      );
    }

    const renderedText = this._renderText(
      encodedString,
      font,
      fontSize,
      totalWidth,
      alignment,
      hPadding,
      vPadding
    );
    return (
      "/Tx BMC q BT " +
      defaultAppearance +
      ` 1 0 0 1 0 0 Tm ${renderedText}` +
      " ET Q EMC"
    );
  }

  async _getFontData( evaluator:PartialEvaluator, task:WorkerTask ) {
    const operatorList = new OperatorList();
    const initialState:Partial<EvalState> = {
      clone() { return this; },
    };

    const { fontName, fontSize } = this.data.defaultAppearanceData!;
    await evaluator.handleSetFont(
      this._fieldResources.mergedResources,
      [fontName && Name.get(fontName), fontSize],
      /* fontRef = */ undefined,
      operatorList,
      task,
      initialState,
      // /* fallbackFontDict = */ null
    );

    return initialState.font!;
  }

  #computeFontSize( height:number, lineCount:number )
  {
    let { fontSize } = this.data.defaultAppearanceData!;
    if( !fontSize )
    {
      // A zero value for size means that the font shall be auto-sized:
      // its size shall be computed as a function of the height of the
      // annotation rectangle (see 12.7.3.3).

      const roundWithOneDigit = (x:number) => Math.round(x * 10) / 10;

      // Represent the percentage of the font size over the height
      // of a single-line field.
      const FONT_FACTOR = 0.8;
      if( lineCount === -1 )
      {
        fontSize = roundWithOneDigit(FONT_FACTOR * height);
      }
      else {
        // Hard to guess how many lines there are.
        // The field may have been sized to have 10 lines
        // and the user entered only 1 so if we get font size from
        // height and number of lines then we'll get something too big.
        // So we compute a fake number of lines based on height and
        // a font size equal to 10.
        // Then we'll adjust font size to what we have really.
        fontSize = 10;
        let lineHeight = fontSize / FONT_FACTOR;
        let numberOfLines = Math.round(height / lineHeight);
        numberOfLines = Math.max(numberOfLines, lineCount);
        lineHeight = height / numberOfLines;
        fontSize = roundWithOneDigit(FONT_FACTOR * lineHeight);
      }

      const { fontName, fontColor } = this.data.defaultAppearanceData!;
      this._defaultAppearance = createDefaultAppearance({
        fontSize,
        fontName,
        fontColor,
      });
    }
    return <[string,number]>[this._defaultAppearance, fontSize];
  }

  _renderText( text:string, font:Font | ErrorFont, fontSize:number, 
    totalWidth:number, alignment:number, hPadding:number, vPadding:number
  ) {
    // We need to get the width of the text in order to align it correctly
    const glyphs = font.charsToGlyphs(text);
    const scale = fontSize / 1000;
    let width = 0;
    for( const glyph of glyphs )
    {
      width += glyph.width! * scale;
    }

    let shift;
    if (alignment === 1) {
      // Center
      shift = (totalWidth - width) / 2;
    } 
    else if (alignment === 2) {
      // Right
      shift = totalWidth - width - hPadding;
    } 
    else {
      shift = hPadding;
    }
    shift = shift.toFixed(2);
    // vPadding = vPadding.toFixed(2);

    return `${shift} ${vPadding.toFixed(2)} Td (${escapeString(text)}) Tj`;
  }

  _getSaveFieldResources( xref:XRef )
  {
    // #if !PRODUCTION || TESTING
      // if (
      //   typeof PDFJSDev === "undefined" ||
      //   PDFJSDev.test("!PRODUCTION || TESTING")
      // ) {
      assert(
        this.data.defaultAppearanceData,
        "Expected `_defaultAppearanceData` to have been set."
      );
      // }
    // #endif
    const { localResources, appearanceResources, acroFormResources } =
      this._fieldResources;

    const fontName =
      this.data.defaultAppearanceData &&
      this.data.defaultAppearanceData.fontName;
    if( !fontName )
    {
      return localResources || Dict.empty;
    }

    for( const resources of [localResources, appearanceResources] )
    {
      if (resources instanceof Dict) {
        const localFont = resources.get("Font");
        if( localFont instanceof Dict && localFont.has(fontName) )
        {
          return resources;
        }
      }
    }
    if( acroFormResources instanceof Dict )
    {
      const acroFormFont = acroFormResources.get("Font");
      if( acroFormFont instanceof Dict && acroFormFont.has(fontName) )
      {
        const subFontDict = new Dict(xref);
        subFontDict.set( fontName, acroFormFont.getRaw(fontName)! );

        const subResourcesDict = new Dict(xref);
        subResourcesDict.set("Font", subFontDict);

        return Dict.merge({
          xref,
          dictArray: [subResourcesDict, localResources],
          mergeSubDicts: true,
        });
      }
    }
    return localResources || Dict.empty;
  }

  override getFieldObject():FieldObject| undefined
  {
    return undefined;
  }
}

class TextWidgetAnnotation extends WidgetAnnotation 
{
  constructor( params:AnnotationCtorParms )
  {
    super(params);

    this._hasText = true;

    const dict = params.dict;

    // The field value is always a string.
    if( !(typeof this.data.fieldValue === "string") ) 
    {
      this.data.fieldValue = "";
    }

    // Determine the alignment of text in the field.
    let alignment = getInheritableProperty({ dict, key: "Q" });
    if( !Number.isInteger(alignment) || <number>alignment < 0 || <number>alignment > 2 )
    {
      alignment = undefined;
    }
    this.data.textAlignment = <number | undefined>alignment;

    // Determine the maximum length of text in the field.
    let maximumLength = getInheritableProperty({ dict, key: "MaxLen" });
    if( !Number.isInteger(maximumLength) || <number>maximumLength < 0 )
    {
      maximumLength = undefined;
    }
    this.data.maxLen = <number | undefined>maximumLength;

    // Process field flags for the display layer.
    this.data.multiLine = this.hasFieldFlag( AnnotationFieldFlag.MULTILINE );
    this.data.comb =
      this.hasFieldFlag(AnnotationFieldFlag.COMB) &&
      !this.hasFieldFlag(AnnotationFieldFlag.MULTILINE) &&
      !this.hasFieldFlag(AnnotationFieldFlag.PASSWORD) &&
      !this.hasFieldFlag(AnnotationFieldFlag.FILESELECT) &&
      this.data.maxLen !== null;
  }

  override _getCombAppearance( defaultAppearance:string, font:Font | ErrorFont, 
    text:string, width:number, hPadding:number, vPadding:number
  ) {
    const combWidth = (width / this.data.maxLen!).toFixed(2);
    const buf = [];
    const positions = font.getCharPositions(text);
    for (const [start, end] of positions) 
    {
      buf.push(`(${escapeString(text.substring(start, end))}) Tj`);
    }

    const renderedComb = buf.join(` ${combWidth} 0 Td `);
    return (
      "/Tx BMC q BT " +
      defaultAppearance +
      ` 1 0 0 1 ${hPadding} ${vPadding} Tm ${renderedComb}` +
      " ET Q EMC"
    );
  }

  override _getMultilineAppearance(
    defaultAppearance:string,
    text:string,
    font:Font | ErrorFont,
    fontSize:number,
    width:number,
    height:number,
    alignment:number,
    hPadding:number,
    vPadding:number
  ) {
    const lines = text.split(/\r\n|\r|\n/);
    const buf = [];
    const totalWidth = width - 2 * hPadding;
    for (const line of lines) 
    {
      const chunks = this._splitLine(line, font, fontSize, totalWidth);
      for( const chunk of chunks )
      {
        const padding:number = buf.length === 0 ? hPadding : 0;
        buf.push(
          this._renderText(
            chunk,
            font,
            fontSize,
            width,
            alignment,
            padding,
            -fontSize // <0 because a line is below the previous one
          )
        );
      }
    }

    const renderedText = buf.join("\n");
    return (
      "/Tx BMC q BT " +
      defaultAppearance +
      ` 1 0 0 1 0 ${height} Tm ${renderedText}` +
      " ET Q EMC"
    );
  }

  _splitLine( line:string, font:Font | ErrorFont, fontSize:number, width:number )
  {
    // TODO: need to handle chars which are not in the font.
    line = font.encodeString(line).join("");

    const glyphs = font.charsToGlyphs(line);

    if (glyphs.length <= 1) 
    {
      // Nothing to split
      return [line];
    }

    const positions = font.getCharPositions(line);
    const scale = fontSize / 1000;
    const chunks = [];

    let lastSpacePosInStringStart = -1,
      lastSpacePosInStringEnd = -1,
      lastSpacePos = -1,
      startChunk = 0,
      currentWidth = 0;

    for (let i = 0, ii = glyphs.length; i < ii; i++) 
    {
      const [start, end] = positions[i];
      const glyph = glyphs[i];
      const glyphWidth = glyph.width! * scale;
      if (glyph.unicode === " ") {
        if (currentWidth + glyphWidth > width) {
          // We can break here
          chunks.push(line.substring(startChunk, start));
          startChunk = start;
          currentWidth = glyphWidth;
          lastSpacePosInStringStart = -1;
          lastSpacePos = -1;
        } 
        else {
          currentWidth += glyphWidth;
          lastSpacePosInStringStart = start;
          lastSpacePosInStringEnd = end;
          lastSpacePos = i;
        }
      } 
      else {
        if (currentWidth + glyphWidth > width) {
          // We must break to the last white position (if available)
          if (lastSpacePosInStringStart !== -1) {
            chunks.push(line.substring(startChunk, lastSpacePosInStringEnd));
            startChunk = lastSpacePosInStringEnd;
            i = lastSpacePos + 1;
            lastSpacePosInStringStart = -1;
            currentWidth = 0;
          } 
          else {
            // Just break in the middle of the word
            chunks.push(line.substring(startChunk, start));
            startChunk = start;
            currentWidth = glyphWidth;
          }
        } 
        else {
          currentWidth += glyphWidth;
        }
      }
    }

    if (startChunk < line.length) {
      chunks.push(line.substring(startChunk, line.length));
    }

    return chunks;
  }

  override getFieldObject()
  {
    return <FieldObject>{
      id: this.data.id,
      value: this.data.fieldValue,
      defaultValue: this.data.defaultFieldValue,
      multiline: this.data.multiLine,
      password: this.hasFieldFlag(AnnotationFieldFlag.PASSWORD),
      charLimit: this.data.maxLen,
      comb: this.data.comb,
      editable: !this.data.readOnly,
      hidden: this.data.hidden,
      name: this.data.fieldName,
      rect: this.data.rect,
      actions: this.data.actions,
      page: this.data.pageIndex,
      strokeColor: this.data.borderColor,
      fillColor: this.data.backgroundColor,
      type: "text",
    };
  }
}

class ButtonWidgetAnnotation extends WidgetAnnotation 
{
  checkedAppearance?:BaseStream | undefined;
  uncheckedAppearance?:BaseStream | undefined;

  parent?:Ref | Dict;

  constructor( params:AnnotationCtorParms )
  {
    super(params);

    this.data.checkBox =
      !this.hasFieldFlag(AnnotationFieldFlag.RADIO) &&
      !this.hasFieldFlag(AnnotationFieldFlag.PUSHBUTTON);
    this.data.radioButton =
      this.hasFieldFlag(AnnotationFieldFlag.RADIO) &&
      !this.hasFieldFlag(AnnotationFieldFlag.PUSHBUTTON);
    this.data.pushButton = this.hasFieldFlag(AnnotationFieldFlag.PUSHBUTTON);
    this.data.isTooltipOnly = false;

    if( this.data.checkBox ) this._processCheckBox(params);
    else if( this.data.radioButton ) this._processRadioButton(params);
    else if( this.data.pushButton ) this._processPushButton(params);
    else warn("Invalid field flags for button widget annotation");
  }

  override async getOperatorList( evaluator:PartialEvaluator, task:WorkerTask, 
    renderForms?:boolean, annotationStorage?:AnnotStorageRecord
  ) {
    if( this.data.pushButton )
    {
      return super.getOperatorList(
        evaluator,
        task,
        false, // we use normalAppearance to render the button
        annotationStorage
      );
    }

    let value;
    if (annotationStorage) 
    {
      const storageEntry = annotationStorage.get(this.data.id);
      value = storageEntry ? storageEntry.value : undefined;
    }

    if( value === undefined ) 
    {
      // Nothing in the annotationStorage.
      if (this.appearance) 
      {
        // But we've a default appearance so use it.
        return super.getOperatorList(
          evaluator,
          task,
          renderForms,
          annotationStorage
        );
      }

      // There is no default appearance so use the one derived
      // from the field value.
      if (this.data.checkBox) 
      {
        value = this.data.fieldValue === this.data.exportValue;
      } 
      else {
        value = this.data.fieldValue === this.data.buttonValue;
      }
    }

    const appearance = value
      ? this.checkedAppearance
      : this.uncheckedAppearance;
    if (appearance) 
    {
      const savedAppearance = this.appearance;
      this.appearance = appearance;
      const operatorList = super.getOperatorList(
        evaluator,
        task,
        renderForms,
        annotationStorage
      );
      this.appearance = savedAppearance;
      return operatorList;
    }

    // No appearance
    return new OperatorList();
  }

  override async save( evaluator:PartialEvaluator, task:WorkerTask, 
    annotationStorage?:AnnotStorageRecord
  ):Promise<SaveReturn> {
    if( this.data.checkBox )
    {
      return this._saveCheckbox(evaluator, task, annotationStorage);
    }

    if( this.data.radioButton )
    {
      return this._saveRadioButton(evaluator, task, annotationStorage);
    }

    // Nothing to save
    return null;
  }

  async _saveCheckbox( evaluator:PartialEvaluator, task:WorkerTask, 
    annotationStorage?:AnnotStorageRecord
  ):Promise<SaveReturn> {
    if( !annotationStorage ) return null;

    const storageEntry = annotationStorage.get( this.data.id );
    const value = storageEntry && storageEntry.value;
    if( value === undefined ) return null;

    const defaultValue = this.data.fieldValue === this.data.exportValue;
    if (defaultValue === value) 
    {
      return null;
    }

    const dict = evaluator.xref.fetchIfRef(this.ref);
    if( !(dict instanceof Dict) ) return null;

    const xfa = {
      path: stringToPDFString( <string>dict.get("T") ?? "" ),
      value: value ? this.data.exportValue! : "",
    };

    const name = Name.get(value ? this.data.exportValue! : "Off");
    dict.set("V", name);
    dict.set("AS", name);
    dict.set("M", `D:${getModificationDate()}`);

    const encrypt = evaluator.xref.encrypt;
    let originalTransform = null;
    if (encrypt) 
    {
      originalTransform = encrypt.createCipherTransform(
        this.ref.num,
        this.ref.gen
      );
    }

    const buffer = [`${this.ref.num} ${this.ref.gen} obj\n`];
    writeDict(dict, buffer, originalTransform);
    buffer.push("\nendobj\n");

    return [{ ref: this.ref, data: buffer.join(""), xfa }];
  }

  async _saveRadioButton( evaluator:PartialEvaluator, task:WorkerTask, 
    annotationStorage?:AnnotStorageRecord
  ):Promise<SaveReturn> {
    if( !annotationStorage ) return null;

    const storageEntry = annotationStorage.get( this.data.id );
    const value = storageEntry && storageEntry.value;
    if( value === undefined ) return null;

    const defaultValue = this.data.fieldValue === this.data.buttonValue;
    if( defaultValue === value ) return null;

    const dict = <Dict>evaluator.xref.fetchIfRef(this.ref);
    if( !(dict instanceof Dict) ) return null;

    const xfa = {
      path: stringToPDFString( <string>dict.get("T") ?? "" ),
      value: value ? this.data.buttonValue! : "",
    };

    const name = Name.get(value ? this.data.buttonValue! : "Off");
    let parentBuffer = null;
    const encrypt = evaluator.xref.encrypt;

    if( value )
    {
      if( (this.parent instanceof Ref) )
      {
        const parent = <Dict>evaluator.xref.fetch( this.parent );
        let parentTransform = null;
        if (encrypt) 
        {
          parentTransform = encrypt.createCipherTransform(
            this.parent.num,
            this.parent.gen
          );
        }
        parent.set("V", name);
        parentBuffer = [`${this.parent.num} ${this.parent.gen} obj\n`];
        writeDict(parent, parentBuffer, parentTransform);
        parentBuffer.push("\nendobj\n");
      } 
      else if( (this.parent instanceof Dict) )
      {
        this.parent.set("V", name);
      }
    }

    dict.set("AS", name);
    dict.set("M", `D:${getModificationDate()}`);

    let originalTransform = null;
    if (encrypt) 
    {
      originalTransform = encrypt.createCipherTransform(
        this.ref.num,
        this.ref.gen
      );
    }

    const buffer = [`${this.ref.num} ${this.ref.gen} obj\n`];
    writeDict(dict, buffer, originalTransform);
    buffer.push("\nendobj\n");

    const newRefs:SaveReturn = [{ ref: this.ref, data: buffer.join(""), xfa }];
    if( parentBuffer !== null )
    {
      newRefs!.push({
        ref: <Ref>this.parent,
        data: parentBuffer.join(""),
        // xfa: null,
      });
    }

    return newRefs;
  }

  _getDefaultCheckedAppearance( params:AnnotationCtorParms, type:"check" | "disc" ) 
  {
    const width = this.data.rect[2] - this.data.rect[0];
    const height = this.data.rect[3] - this.data.rect[1];
    const bbox = [0, 0, width, height];

    // Ratio used to have a mark slightly smaller than the bbox.
    const FONT_RATIO = 0.8;
    const fontSize = Math.min(width, height) * FONT_RATIO;

    // Char Metrics
    // Widths came from widths for ZapfDingbats.
    // Heights are guessed with Fontforge and FoxitDingbats.pfb.
    let metrics:{ width:number; height:number; }, 
      char;
    if (type === "check") 
    {
      // Char 33 (2713 in unicode)
      metrics = {
        width: 0.755 * fontSize,
        height: 0.705 * fontSize,
      };
      char = "\x33";
    } 
    else if (type === "disc") 
    {
      // Char 6C (25CF in unicode)
      metrics = {
        width: 0.791 * fontSize,
        height: 0.705 * fontSize,
      };
      char = "\x6C";
    } 
    else {
      assert( 0,`_getDefaultCheckedAppearance - unsupported type: ${type}`);
    }

    // Values to center the glyph in the bbox.
    const xShift = (width - metrics!.width) / 2;
    const yShift = (height - metrics!.height) / 2;

    const appearance = `q BT /PdfJsZaDb ${fontSize} Tf 0 g ${xShift} ${yShift} Td (${char}) Tj ET Q`;

    const appearanceStreamDict = new Dict(params.xref);
    appearanceStreamDict.set("FormType", 1);
    appearanceStreamDict.set("Subtype", Name.get("Form"));
    appearanceStreamDict.set("Type", Name.get("XObject"));
    appearanceStreamDict.set("BBox", bbox);
    appearanceStreamDict.set("Matrix", [1, 0, 0, 1, 0, 0]);
    appearanceStreamDict.set("Length", appearance.length);

    const resources = new Dict(params.xref);
    const font = new Dict(params.xref);
    font.set("PdfJsZaDb", this.fallbackFontDict);
    resources.set("Font", font);

    appearanceStreamDict.set("Resources", resources);

    this.checkedAppearance = new StringStream(appearance);
    this.checkedAppearance.dict = appearanceStreamDict;

    this._streams.push(this.checkedAppearance);
  }

  _processCheckBox( params:AnnotationCtorParms ) 
  {
    const customAppearance = params.dict.get("AP");
    if( !(customAppearance instanceof Dict) ) return;

    const normalAppearance = customAppearance.get("N"); // Table 168
    if( !(normalAppearance instanceof Dict) ) return;

    // See https://bugzilla.mozilla.org/show_bug.cgi?id=1722036.
    // If we've an AS and a V then take AS.
    const asValue = this._decodeFormValue(params.dict.get("AS"));
    if (typeof asValue === "string") 
    {
      this.data.fieldValue = asValue;
    }

    const yes =
      this.data.fieldValue !== null && this.data.fieldValue !== "Off"
        ? <string>this.data.fieldValue
        : "Yes";

    const exportValues = normalAppearance.getKeys();
    if (exportValues.length === 0) 
    {
      exportValues.push("Off", yes);
    } 
    else if (exportValues.length === 1) 
    {
      if (exportValues[0] === "Off") 
      {
        exportValues.push(yes);
      } 
      else {
        exportValues.unshift("Off");
      }
    } 
    else if (exportValues.includes(yes)) 
    {
      exportValues.length = 0;
      exportValues.push("Off", yes);
    } 
    else {
      const otherYes = exportValues.find(v => v !== "Off")!;
      exportValues.length = 0;
      exportValues.push("Off", otherYes);
    }

    // Don't use a "V" entry pointing to a non-existent appearance state,
    // see e.g. bug1720411.pdf where it's an *empty* Name-instance.
    if (!exportValues.includes(<string>this.data.fieldValue)) 
    {
      this.data.fieldValue = "Off";
    }

    this.data.exportValue = exportValues[1];

    this.checkedAppearance =
      <BaseStream>normalAppearance.get(this.data.exportValue) || undefined;
    this.uncheckedAppearance = <BaseStream>normalAppearance.get("Off") || undefined;

    if (this.checkedAppearance) 
    {
      this._streams.push(this.checkedAppearance);
    } 
    else {
      this._getDefaultCheckedAppearance(params, "check");
    }
    if (this.uncheckedAppearance) 
    {
      this._streams.push(this.uncheckedAppearance);
    }
    this._fallbackFontDict = this.fallbackFontDict;
  }

  _processRadioButton( params:AnnotationCtorParms )
  {
    this.data.fieldValue = this.data.buttonValue = undefined;

    // The parent field's `V` entry holds a `Name` object with the appearance
    // state of whichever child field is currently in the "on" state.
    const fieldParent = params.dict.get("Parent");
    if( (fieldParent instanceof Dict) )
    {
      this.parent = <Dict | Ref>params.dict.getRaw("Parent");
      const fieldParentValue = fieldParent.get("V");
      if( fieldParentValue instanceof Name )
      {
        this.data.fieldValue = this._decodeFormValue( fieldParentValue );
      }
    }

    // The button's value corresponds to its appearance state.
    const appearanceStates = params.dict.get("AP");
    if( !(appearanceStates instanceof Dict) ) return;

    const normalAppearance = appearanceStates.get("N");
    if( !(normalAppearance instanceof Dict) ) return;

    for( const key of normalAppearance.getKeys() )
    {
      if (key !== "Off") {
        this.data.buttonValue = <string>this._decodeFormValue(key);
        break;
      }
    }

    this.checkedAppearance = <BaseStream>normalAppearance.get( this.data.buttonValue! ) || undefined;
    this.uncheckedAppearance = <BaseStream>normalAppearance.get("Off") || undefined;

    if (this.checkedAppearance) 
    {
      this._streams.push(this.checkedAppearance);
    } 
    else {
      this._getDefaultCheckedAppearance(params, "disc");
    }
    if (this.uncheckedAppearance) 
    {
      this._streams.push(this.uncheckedAppearance);
    }
    this._fallbackFontDict = this.fallbackFontDict;
  }

  _processPushButton( params:AnnotationCtorParms )
  {
    if (
      !params.dict.has("A") &&
      !params.dict.has("AA") &&
      !this.data.alternativeText
    ) {
      warn("Push buttons without action dictionaries are not supported");
      return;
    }

    this.data.isTooltipOnly = !params.dict.has("A") && !params.dict.has("AA");

    Catalog.parseDestDictionary({
      destDict: params.dict,
      resultObj: this.data,
      docBaseUrl: params.pdfManager.docBaseUrl,
    });
  }

  override getFieldObject()
  {
    let type = "button";
    let exportValues;
    if( this.data.checkBox )
    {
      type = "checkbox";
      exportValues = this.data.exportValue;
    } 
    else if (this.data.radioButton) {
      type = "radiobutton";
      exportValues = this.data.buttonValue;
    }
    return <FieldObject>{
      id: this.data.id,
      value: this.data.fieldValue || "Off",
      defaultValue: this.data.defaultFieldValue,
      exportValues,
      editable: !this.data.readOnly,
      name: this.data.fieldName,
      rect: this.data.rect,
      hidden: this.data.hidden,
      actions: this.data.actions,
      page: this.data.pageIndex,
      strokeColor: this.data.borderColor,
      fillColor: this.data.backgroundColor,
      type,
    };
  }

  get fallbackFontDict() {
    const dict = new Dict();
    dict.set("BaseFont", Name.get("ZapfDingbats"));
    dict.set("Type", Name.get("FallbackType"));
    dict.set("Subtype", Name.get("FallbackType"));
    dict.set("Encoding", Name.get("ZapfDingbatsEncoding"));

    return shadow(this, "fallbackFontDict", dict);
  }
}

class ChoiceWidgetAnnotation extends WidgetAnnotation 
{
  constructor( params:AnnotationCtorParms )
  {
    super(params);

    // Determine the options. The options array may consist of strings or
    // arrays. If the array consists of arrays, then the first element of
    // each array is the export value and the second element of each array is
    // the display value. If the array consists of strings, then these
    // represent both the export and display value. In this case, we convert
    // it to an array of arrays as well for convenience in the display layer.
    // Note that the specification does not state that the `Opt` field is
    // inheritable, but in practice PDF generators do make annotations
    // inherit the options from a parent annotation (issue 8094).
    this.data.options = [];

    const options = getInheritableProperty(
      { dict: params.dict, key: "Opt" }); // Table 246
    if( Array.isArray(options) )
    {
      const xref = params.xref;
      for( let i = 0, ii = options.length; i < ii; i++ )
      {
        const option = xref.fetchIfRef( options[i] );
        const isOptionArray = Array.isArray( option );

        this.data.options[i] = {
          exportValue: this._decodeFormValue(
            isOptionArray ? xref.fetchIfRef( (<Obj[]>option)[0] ) : option ),
          displayValue: this._decodeFormValue(
            isOptionArray ? xref.fetchIfRef( (<Obj[]>option)[1]) : option ),
        };
      }
    }

    // The field value can be `null` if no item is selected, a string if one
    // item is selected or an array of strings if multiple items are selected.
    // For consistency in the API and convenience in the display layer, we
    // always make the field value an array with zero, one or multiple items.
    if( typeof this.data.fieldValue === "string" )
    {
      this.data.fieldValue = [ <string>this.data.fieldValue ];
    } 
    else if( !this.data.fieldValue )
    {
      this.data.fieldValue = [];
    }

    // Process field flags for the display layer.
    this.data.combo = this.hasFieldFlag(AnnotationFieldFlag.COMBO);
    this.data.multiSelect = this.hasFieldFlag(AnnotationFieldFlag.MULTISELECT);
    this._hasText = true;
  }

  override getFieldObject()
  {
    const type = this.data.combo ? "combobox" : "listbox";
    const value =
      this.data.fieldValue!.length > 0 ? this.data.fieldValue![0] : undefined;
    return <FieldObject>{
      id: this.data.id,
      value,
      defaultValue: this.data.defaultFieldValue,
      editable: !this.data.readOnly,
      name: this.data.fieldName,
      rect: this.data.rect,
      numItems: this.data.fieldValue!.length,
      multipleSelection: this.data.multiSelect,
      hidden: this.data.hidden,
      actions: this.data.actions,
      items: this.data.options,
      page: this.data.pageIndex,
      strokeColor: this.data.borderColor,
      fillColor: this.data.backgroundColor,
      type,
    };
  }
}

class SignatureWidgetAnnotation extends WidgetAnnotation
{
  constructor( params:AnnotationCtorParms )
  {
    super(params);

    // Unset the fieldValue since it's (most likely) a `Dict` which is
    // non-serializable and will thus cause errors when sending annotations
    // to the main-thread (issue 10347).
    this.data.fieldValue = undefined;
  }

  override getFieldObject() {
    return <FieldObject>{
      id: this.data.id,
      page: this.data.pageIndex,
      type: "signature",
    };
  }
}

class TextAnnotation extends MarkupAnnotation 
{
  constructor( parameters:AnnotationCtorParms )
  {
    const DEFAULT_ICON_SIZE = 22; // px

    super(parameters);

    const dict = parameters.dict;
    this.data.annotationType = AnnotationType.TEXT;

    if (this.data.hasAppearance) 
    {
      this.data.name = "NoIcon";
    } 
    else {
      this.data.rect[1] = this.data.rect[3] - DEFAULT_ICON_SIZE;
      this.data.rect[2] = this.data.rect[0] + DEFAULT_ICON_SIZE;
      this.data.name = dict.has("Name") ? (<Name>dict.get("Name")).name : "Note";
    }

    if (dict.has("State")) 
    {
      this.data.state = <string | undefined>dict.get("State");
      this.data.stateModel = <string | undefined>dict.get("StateModel");
    } 
    else {
      this.data.state = undefined;
      this.data.stateModel = undefined;
    }
  }
}

class LinkAnnotation extends Annotation 
{
  constructor( params:AnnotationCtorParms )
  {
    super(params);

    this.data.annotationType = AnnotationType.LINK;

    const quadPoints = getQuadPoints(params.dict, this.rectangle);
    if( quadPoints )
    {
      this.data.quadPoints = quadPoints;
    }

    Catalog.parseDestDictionary({
      destDict: params.dict,
      resultObj: this.data,
      docBaseUrl: params.pdfManager.docBaseUrl,
    });
  }
}

class PopupAnnotation extends Annotation 
{
  constructor( parameters:AnnotationCtorParms )
  {
    super(parameters);

    this.data.annotationType = AnnotationType.POPUP;

    let parentItem = <Dict>parameters.dict.get("Parent");
    if (!parentItem) 
    {
      warn("Popup annotation has a missing or invalid parent annotation.");
      return;
    }

    const parentSubtype = parentItem.get("Subtype");
    this.data.parentType = (parentSubtype instanceof Name) ? parentSubtype.name : undefined;
    const rawParent = parameters.dict.getRaw("Parent");
    this.data.parentId = (rawParent instanceof Ref) ? rawParent.toString() : undefined;

    const parentRect = parentItem.getArray("Rect");
    if (Array.isArray(parentRect) && parentRect.length === 4) 
    {
      this.data.parentRect = Util.normalizeRect( <rect_t>parentRect );
    } 
    else {
      this.data.parentRect = [0, 0, 0, 0];
    }

    const rt = parentItem.get("RT");
    if( rt instanceof Name && rt.name === AnnotationReplyType.GROUP )
    {
      // Subordinate annotations in a group should inherit
      // the group attributes from the primary annotation.
      parentItem = <Dict>parentItem.get("IRT");
    }

    if (!parentItem.has("M")) 
    {
      this.data.modificationDate = undefined;
    } 
    else {
      this.setModificationDate(parentItem.get("M"));
      this.data.modificationDate = this.modificationDate;
    }

    if (!parentItem.has("C")) 
    {
      // Fall back to the default background color.
      this.data.color = undefined;
    } 
    else {
      this.setColor( <number[]>parentItem.getArray("C") );
      this.data.color = this.color;
    }

    // If the Popup annotation is not viewable, but the parent annotation is,
    // that is most likely a bug. Fallback to inherit the flags from the parent
    // annotation (this is consistent with the behaviour in Adobe Reader).
    if (!this.viewable) 
    {
      const parentFlags = <AnnotationFlag>parentItem.get("F");
      if (this._isViewable(parentFlags)) 
      {
        this.setFlags(parentFlags);
      }
    }

    this.setTitle( parentItem.get("T") );
    this.data.titleObj = this._title;

    this.setContents( <string>parentItem.get("Contents") );
    this.data.contentsObj = this._contents;

    if (parentItem.has("RC")) 
    {
      this.data.richText = XFAFactory.getRichTextAsHtml( <string>parentItem.get("RC") );
    }
  }
}

class FreeTextAnnotation extends MarkupAnnotation 
{
  constructor( parameters:AnnotationCtorParms )
  {
    super(parameters);

    this.data.annotationType = AnnotationType.FREETEXT;
  }
}

class LineAnnotation extends MarkupAnnotation 
{
  constructor( parameters:AnnotationCtorParms )
  {
    super(parameters);

    this.data.annotationType = AnnotationType.LINE;

    const lineCoordinates = <rect_t>parameters.dict.getArray("L");
    this.data.lineCoordinates = Util.normalizeRect(lineCoordinates);

    if( !this.appearance )
    {
      // The default stroke color is black.
      const strokeColor = this.color
        ? <AColor>Array.from(this.color).map(c => c / 255)
        : <AColor>[0, 0, 0];
      const strokeAlpha = <number | undefined>parameters.dict.get("CA");

      // The default fill color is transparent. Setting the fill colour is
      // necessary if/when we want to add support for non-default line endings.
      let fillColor:AColor | undefined,
        interiorColor = <number[] | undefined>parameters.dict.getArray("IC");
      if (interiorColor) 
      {
        const interiorColor_1 = getRgbColor( interiorColor );
        fillColor = interiorColor_1
          ? <AColor>Array.from(interiorColor_1).map(c => c / 255)
          : undefined;
      }
      const fillAlpha = fillColor ? strokeAlpha : undefined;

      const borderWidth = this.borderStyle.width || 1,
        borderAdjust = 2 * borderWidth;

      // If the /Rect-entry is empty/wrong, create a fallback rectangle so that
      // we get similar rendering/highlighting behaviour as in Adobe Reader.
      const bbox:rect_t = [
        this.data.lineCoordinates[0] - borderAdjust,
        this.data.lineCoordinates[1] - borderAdjust,
        this.data.lineCoordinates[2] + borderAdjust,
        this.data.lineCoordinates[3] + borderAdjust,
      ];
      if (!Util.intersect(this.rectangle, bbox)) {
        this.rectangle = bbox;
      }

      this.setDefaultAppearance$({
        xref: parameters.xref,
        extra: `${borderWidth} w`,
        strokeColor,
        fillColor,
        strokeAlpha,
        fillAlpha,
        pointsCallback: (buffer, points) => {
          buffer.push(
            `${lineCoordinates[0]} ${lineCoordinates[1]} m`,
            `${lineCoordinates[2]} ${lineCoordinates[3]} l`,
            "S"
          );
          return [
            points[0].x - borderWidth,
            points[1].x + borderWidth,
            points[3].y - borderWidth,
            points[1].y + borderWidth,
          ];
        },
      });
    }
  }
}

class SquareAnnotation extends MarkupAnnotation 
{
  constructor( parameters:AnnotationCtorParms )
  {
    super(parameters);

    this.data.annotationType = AnnotationType.SQUARE;

    if( !this.appearance )
    {
      // The default stroke color is black.
      const strokeColor = this.color
        ? <AColor>Array.from(this.color).map(c => c / 255)
        : <AColor>[0, 0, 0];
      const strokeAlpha = <number | undefined>parameters.dict.get("CA");

      // The default fill color is transparent.
      let fillColor:AColor | undefined,
        interiorColor:number[] | Uint8ClampedArray | undefined = <number[]>parameters.dict.getArray("IC");
      if( interiorColor )
      {
        interiorColor = getRgbColor(interiorColor);
        fillColor = interiorColor
          ? <AColor>Array.from(interiorColor).map(c => c / 255)
          : undefined;
      }
      const fillAlpha = fillColor ? strokeAlpha : undefined;

      if( this.borderStyle.width === 0 && !fillColor )
      {
        // Prevent rendering a "hairline" border (fixes issue14164.pdf).
        return;
      }

      this.setDefaultAppearance$({
        xref: parameters.xref,
        extra: `${this.borderStyle.width} w`,
        strokeColor,
        fillColor,
        strokeAlpha,
        fillAlpha,
        pointsCallback: (buffer, points) => {
          const x = points[2].x + this.borderStyle.width / 2;
          const y = points[2].y + this.borderStyle.width / 2;
          const width = points[3].x - points[2].x - this.borderStyle.width;
          const height = points[1].y - points[3].y - this.borderStyle.width;
          buffer.push(`${x} ${y} ${width} ${height} re`);
          if (fillColor) {
            buffer.push("B");
          }
          else {
            buffer.push("S");
          }
          return [points[0].x, points[1].x, points[3].y, points[1].y];
        },
      });
    }
  }
}

class CircleAnnotation extends MarkupAnnotation 
{
  constructor( parameters:AnnotationCtorParms )
  {
    super(parameters);

    this.data.annotationType = AnnotationType.CIRCLE;

    if( !this.appearance )
    {
      // The default stroke color is black.
      const strokeColor = this.color
        ? <AColor>Array.from(this.color).map(c => c / 255)
        : <AColor>[0, 0, 0];
      const strokeAlpha = <number | undefined>parameters.dict.get("CA");

      // The default fill color is transparent.
      let fillColor:AColor | undefined;
      let interiorColor:number[] | Uint8ClampedArray | undefined = <number[]>parameters.dict.getArray("IC");
      if( interiorColor )
      {
        interiorColor = getRgbColor(interiorColor);
        fillColor = interiorColor
          ? <AColor>Array.from(interiorColor).map(c => c / 255)
          : undefined;
      }
      const fillAlpha = fillColor ? strokeAlpha : undefined;

      if( this.borderStyle.width === 0 && !fillColor )
      {
        // Prevent rendering a "hairline" border (fixes issue14164.pdf).
        return;
      }

      // Circles are approximated by Bézier curves with four segments since
      // there is no circle primitive in the PDF specification. For the control
      // points distance, see https://stackoverflow.com/a/27863181.
      const controlPointsDistance = (4 / 3) * Math.tan(Math.PI / (2 * 4));

      this.setDefaultAppearance$({
        xref: parameters.xref,
        extra: `${this.borderStyle.width} w`,
        strokeColor,
        fillColor,
        strokeAlpha,
        fillAlpha,
        pointsCallback: (buffer, points) => {
          const x0 = points[0].x + this.borderStyle.width / 2;
          const y0 = points[0].y - this.borderStyle.width / 2;
          const x1 = points[3].x - this.borderStyle.width / 2;
          const y1 = points[3].y + this.borderStyle.width / 2;
          const xMid = x0 + (x1 - x0) / 2;
          const yMid = y0 + (y1 - y0) / 2;
          const xOffset = ((x1 - x0) / 2) * controlPointsDistance;
          const yOffset = ((y1 - y0) / 2) * controlPointsDistance;

          buffer.push(
            `${xMid} ${y1} m`,
            `${xMid + xOffset} ${y1} ${x1} ${yMid + yOffset} ${x1} ${yMid} c`,
            `${x1} ${yMid - yOffset} ${xMid + xOffset} ${y0} ${xMid} ${y0} c`,
            `${xMid - xOffset} ${y0} ${x0} ${yMid - yOffset} ${x0} ${yMid} c`,
            `${x0} ${yMid + yOffset} ${xMid - xOffset} ${y1} ${xMid} ${y1} c`,
            "h"
          );
          if (fillColor) {
            buffer.push("B");
          } else {
            buffer.push("S");
          }
          return [points[0].x, points[1].x, points[3].y, points[1].y];
        },
      });
    }
  }
}

class PolylineAnnotation extends MarkupAnnotation 
{
  constructor( parameters:AnnotationCtorParms )
  {
    super(parameters);

    this.data.annotationType = AnnotationType.POLYLINE;
    this.data.vertices = [];

    // The vertices array is an array of numbers representing the alternating
    // horizontal and vertical coordinates, respectively, of each vertex.
    // Convert this to an array of objects with x and y coordinates.
    const rawVertices = <number[]>parameters.dict.getArray("Vertices");
    if( !Array.isArray(rawVertices) )
    {
      return;
    }
    for (let i = 0, ii = rawVertices.length; i < ii; i += 2) {
      this.data.vertices.push({
        x: rawVertices[i],
        y: rawVertices[i + 1],
      });
    }

    if (!this.appearance) 
    {
      // The default stroke color is black.
      const strokeColor = this.color
        ? <AColor>Array.from(this.color).map(c => c / 255)
        : <AColor>[0, 0, 0];
      const strokeAlpha = <number | undefined>parameters.dict.get("CA");

      const borderWidth = this.borderStyle.width || 1,
        borderAdjust = 2 * borderWidth;

      // If the /Rect-entry is empty/wrong, create a fallback rectangle so that
      // we get similar rendering/highlighting behaviour as in Adobe Reader.
      const bbox:rect_t = [Infinity, Infinity, -Infinity, -Infinity];
      for (const vertex of this.data.vertices) {
        bbox[0] = Math.min(bbox[0], vertex.x - borderAdjust);
        bbox[1] = Math.min(bbox[1], vertex.y - borderAdjust);
        bbox[2] = Math.max(bbox[2], vertex.x + borderAdjust);
        bbox[3] = Math.max(bbox[3], vertex.y + borderAdjust);
      }
      if (!Util.intersect(this.rectangle, bbox)) {
        this.rectangle = bbox;
      }

      this.setDefaultAppearance$({
        xref: parameters.xref,
        extra: `${borderWidth} w`,
        strokeColor,
        strokeAlpha,
        pointsCallback: (buffer, points) => {
          const vertices = this.data.vertices!;
          for (let i = 0, ii = vertices.length; i < ii; i++) {
            buffer.push(
              `${vertices[i].x} ${vertices[i].y} ${i === 0 ? "m" : "l"}`
            );
          }
          buffer.push("S");
          return [points[0].x, points[1].x, points[3].y, points[1].y];
        },
      });
    }
  }
}

class PolygonAnnotation extends PolylineAnnotation 
{
  constructor( parameters:AnnotationCtorParms )
  {
    // Polygons are specific forms of polylines, so reuse their logic.
    super(parameters);

    this.data.annotationType = AnnotationType.POLYGON;
  }
}

class CaretAnnotation extends MarkupAnnotation 
{
  constructor( parameters:AnnotationCtorParms )
  {
    super(parameters);

    this.data.annotationType = AnnotationType.CARET;
  }
}

class InkAnnotation extends MarkupAnnotation 
{
  constructor( parameters:AnnotationCtorParms )
  {
    super(parameters);

    this.data.annotationType = AnnotationType.INK;
    this.data.inkLists = [];

    const rawInkLists = <(number|Ref)[][]>parameters.dict.getArray("InkList");
    if (!Array.isArray(rawInkLists)) {
      return;
    }
    const xref = parameters.xref;
    for (let i = 0, ii = rawInkLists.length; i < ii; ++i) {
      // The raw ink lists array contains arrays of numbers representing
      // the alternating horizontal and vertical coordinates, respectively,
      // of each vertex. Convert this to an array of objects with x and y
      // coordinates.
      this.data.inkLists.push([]);
      for (let j = 0, jj = rawInkLists[i].length; j < jj; j += 2) {
        this.data.inkLists[i].push({
          x: <number>xref.fetchIfRef(rawInkLists[i][j]),
          y: <number>xref.fetchIfRef(rawInkLists[i][j + 1]),
        });
      }
    }

    if (!this.appearance) 
    {
      // The default stroke color is black.
      const strokeColor = this.color
        ? <AColor>Array.from(this.color).map(c => c / 255)
        : <AColor>[0, 0, 0];
      const strokeAlpha = <number | undefined>parameters.dict.get("CA");

      const borderWidth = this.borderStyle.width || 1,
        borderAdjust = 2 * borderWidth;

      // If the /Rect-entry is empty/wrong, create a fallback rectangle so that
      // we get similar rendering/highlighting behaviour as in Adobe Reader.
      const bbox:rect_t = [Infinity, Infinity, -Infinity, -Infinity];
      for (const inkLists of this.data.inkLists) {
        for (const vertex of inkLists) {
          bbox[0] = Math.min(bbox[0], vertex.x - borderAdjust);
          bbox[1] = Math.min(bbox[1], vertex.y - borderAdjust);
          bbox[2] = Math.max(bbox[2], vertex.x + borderAdjust);
          bbox[3] = Math.max(bbox[3], vertex.y + borderAdjust);
        }
      }
      if (!Util.intersect(this.rectangle, bbox)) {
        this.rectangle = bbox;
      }

      this.setDefaultAppearance$({
        xref: parameters.xref,
        extra: `${borderWidth} w`,
        strokeColor,
        strokeAlpha,
        pointsCallback: (buffer, points) => {
          // According to the specification, see "12.5.6.13 Ink Annotations":
          //   When drawn, the points shall be connected by straight lines or
          //   curves in an implementation-dependent way.
          // In order to simplify things, we utilize straight lines for now.
          for (const inkList of this.data.inkLists!) {
            for (let i = 0, ii = inkList.length; i < ii; i++) {
              buffer.push(
                `${inkList[i].x} ${inkList[i].y} ${i === 0 ? "m" : "l"}`
              );
            }
            buffer.push("S");
          }
          return [points[0].x, points[1].x, points[3].y, points[1].y];
        },
      });
    }
  }
}

class HighlightAnnotation extends MarkupAnnotation 
{
  constructor( parameters:AnnotationCtorParms )
  {
    super(parameters);

    this.data.annotationType = AnnotationType.HIGHLIGHT;
    const quadPoints = (this.data.quadPoints = getQuadPoints( parameters.dict ));
    if (quadPoints) 
    {
      const resources = <Dict | undefined>this.appearance?.dict!.get("Resources");

      if( !this.appearance || !resources?.has("ExtGState") )
      {
        if( this.appearance )
        {
          // Workaround for cases where there's no /ExtGState-entry directly
          // available, e.g. when the appearance stream contains a /XObject of
          // the /Form-type, since that causes the highlighting to completely
          // obsure the PDF content below it (fixes issue13242.pdf).
          warn("HighlightAnnotation - ignoring built-in appearance stream.");
        }
        // Default color is yellow in Acrobat Reader
        const fillColor = this.color
          ? <AColor>Array.from(this.color).map(c => c / 255)
          : <AColor>[1, 1, 0];
        const fillAlpha = <number | undefined>parameters.dict.get("CA");

        this.setDefaultAppearance$({
          xref: parameters.xref,
          fillColor,
          fillAlpha,
          blendMode: "Multiply",
          pointsCallback: (buffer, points) => {
            buffer.push(
              `${points[0].x} ${points[0].y} m`,
              `${points[1].x} ${points[1].y} l`,
              `${points[3].x} ${points[3].y} l`,
              `${points[2].x} ${points[2].y} l`,
              "f"
            );
            return [points[0].x, points[1].x, points[3].y, points[1].y];
          },
        });
      }
    } 
    else {
      this.data.hasPopup = false;
    }
  }
}

class UnderlineAnnotation extends MarkupAnnotation 
{
  constructor( parameters:AnnotationCtorParms )
  {
    super(parameters);

    this.data.annotationType = AnnotationType.UNDERLINE;
    const quadPoints = (this.data.quadPoints = getQuadPoints( parameters.dict ));
    if( quadPoints )
    {
      if (!this.appearance) {
        // Default color is black
        const strokeColor = this.color
          ? <[number,number,number]>Array.from(this.color).map(c => c / 255)
          : <[number,number,number]>[0, 0, 0];
        const strokeAlpha = <number | undefined>parameters.dict.get("CA");

        this.setDefaultAppearance$({
          xref: parameters.xref,
          extra: "[] 0 d 1 w",
          strokeColor,
          strokeAlpha,
          pointsCallback: (buffer, points) => {
            buffer.push(
              `${points[2].x} ${points[2].y} m`,
              `${points[3].x} ${points[3].y} l`,
              "S"
            );
            return [points[0].x, points[1].x, points[3].y, points[1].y];
          },
        });
      }
    } 
    else {
      this.data.hasPopup = false;
    }
  }
}

class SquigglyAnnotation extends MarkupAnnotation 
{
  constructor( parameters:AnnotationCtorParms )
  {
    super(parameters);

    this.data.annotationType = AnnotationType.SQUIGGLY;

    const quadPoints = (this.data.quadPoints = getQuadPoints( parameters.dict ));
    if( quadPoints )
    {
      if (!this.appearance) {
        // Default color is black
        const strokeColor = this.color
          ? <[number,number,number]>Array.from(this.color).map(c => c / 255)
          : <[number,number,number]>[0, 0, 0];
        const strokeAlpha = <number | undefined>parameters.dict.get("CA");

        this.setDefaultAppearance$({
          xref: parameters.xref,
          extra: "[] 0 d 1 w",
          strokeColor,
          strokeAlpha,
          pointsCallback: (buffer, points) => {
            const dy = (points[0].y - points[2].y) / 6;
            let shift = dy;
            let x = points[2].x;
            const y = points[2].y;
            const xEnd = points[3].x;
            buffer.push(`${x} ${y + shift} m`);
            do {
              x += 2;
              shift = shift === 0 ? dy : 0;
              buffer.push(`${x} ${y + shift} l`);
            } while (x < xEnd);
            buffer.push("S");
            return [points[2].x, xEnd, y - 2 * dy, y + 2 * dy];
          },
        });
      }
    } 
    else {
      this.data.hasPopup = false;
    }
  }
}

class StrikeOutAnnotation extends MarkupAnnotation 
{
  constructor( parameters:AnnotationCtorParms )
  {
    super(parameters);

    this.data.annotationType = AnnotationType.STRIKEOUT;

    const quadPoints = (this.data.quadPoints = getQuadPoints( parameters.dict ));
    if( quadPoints )
    {
      if (!this.appearance) {
        // Default color is black
        const strokeColor = this.color
          ? <[number,number,number]>Array.from(this.color).map(c => c / 255)
          : <[number,number,number]>[0, 0, 0];
        const strokeAlpha = <number | undefined>parameters.dict.get("CA");

        this.setDefaultAppearance$({
          xref: parameters.xref,
          extra: "[] 0 d 1 w",
          strokeColor,
          strokeAlpha,
          pointsCallback: (buffer, points) => {
            buffer.push(
              `${(points[0].x + points[2].x) / 2} ` +
                `${(points[0].y + points[2].y) / 2} m`,
              `${(points[1].x + points[3].x) / 2} ` +
                `${(points[1].y + points[3].y) / 2} l`,
              "S"
            );
            return [points[0].x, points[1].x, points[3].y, points[1].y];
          },
        });
      }
    } 
    else {
      this.data.hasPopup = false;
    }
  }
}

class StampAnnotation extends MarkupAnnotation 
{
  constructor( parameters:AnnotationCtorParms )
  {
    super(parameters);

    this.data.annotationType = AnnotationType.STAMP;
  }
}

class FileAttachmentAnnotation extends MarkupAnnotation
{
  constructor( parameters:AnnotationCtorParms )
  {
    super(parameters);

    const file = new FileSpec( <Dict>parameters.dict.get("FS"), parameters.xref );

    this.data.annotationType = AnnotationType.FILEATTACHMENT;
    this.data.file = file.serializable;
  }
}
/*81---------------------------------------------------------------------------*/
