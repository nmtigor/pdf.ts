/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
 */

/* Copyright 2015 Mozilla Foundation
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

import { html } from "../../../lib/dom.js";
import { assert } from "../../../lib/util/trace.js";
import { XFAElObj } from "../core/xfa/alias.js";
import {
  BaseException,
  CMapCompressionType,
  matrix_t,
  point_t,
  rect_t,
  removeNullCharacters,
  shadow,
  stringToBytes,
  Util,
  warn,
} from "../shared/util.js";
import { 
  BaseCanvasFactory, 
  BaseCMapReaderFactory, 
  BaseStandardFontDataFactory, 
  BaseSVGFactory
} from "./base_factory.js";
/*81---------------------------------------------------------------------------*/

export const DEFAULT_LINK_REL = "noopener noreferrer nofollow";
const SVG_NS = "http://www.w3.org/2000/svg";

export const PixelsPerInch = {
  CSS: 96.0,
  PDF: 72.0,

  get PDF_TO_CSS_UNITS():number
  {
    return shadow(this, "PDF_TO_CSS_UNITS", this.CSS / this.PDF);
  },
};

export class DOMCanvasFactory extends BaseCanvasFactory 
{
  _document:Document;
  
  constructor({ ownerDocument=globalThis.document } = {}) 
  {
    super();

    this._document = ownerDocument;
  }

  /** @implements */
  _createCanvas( width:number, height:number )
  {
    const canvas = this._document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
}

async function fetchData( url:string, asTypedArray=false )
{
  const rn_ = async() => {
    const response = await fetch(url);
    if( !response.ok )
    {
      throw new Error(response.statusText);
    }
    return asTypedArray
      ? new Uint8Array(await response.arrayBuffer())
      : stringToBytes(await response.text());
  }
  // #if MOZCENTRAL
    return await rn_();
  // #endif
  if( isValidFetchUrl(url, document.baseURI) ) 
    return await rn_();

  // The Fetch API is not supported.
  return new Promise<Uint8Array>( (resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("GET", url, /* asTypedArray = */ true);

    if (asTypedArray) {
      request.responseType = "arraybuffer";
    }
    request.onreadystatechange = () => {
      if( request.readyState !== XMLHttpRequest.DONE ) return;

      if (request.status === 200 || request.status === 0) 
      {
        let data;
        if (asTypedArray && request.response) 
        {
          data = new Uint8Array(request.response);
        } 
        else if (!asTypedArray && request.responseText) 
        {
          data = stringToBytes(request.responseText);
        }
        if (data) 
        {
          resolve(data);
          return;
        }
      }
      reject(new Error(request.statusText));
    };

    request.send(null);
  });
}

export class DOMCMapReaderFactory extends BaseCMapReaderFactory
{
  /** @implements */
  _fetchData( url:string, compressionType:CMapCompressionType )
  {
    return fetchData(url, /* asTypedArray = */ this.isCompressed).then(data => {
      return { cMapData: data, compressionType };
    });
  }
}

export class DOMStandardFontDataFactory extends BaseStandardFontDataFactory
{
  /** @implements */
  _fetchData( url:string )
  {
    return fetchData(url, /* asTypedArray = */ true);
  }
}

export class DOMSVGFactory extends BaseSVGFactory
{
  /** @implements */
  _createSVG( type:keyof SVGElementTagNameMap )
  {
    return document.createElementNS(SVG_NS, type);
  }
}

interface PageViewportParms
{
  /**
   * The xMin, yMin, xMax and yMax coordinates.
   */
  viewBox:number[];

  /**
   * The scale of the viewport.
   */
  scale:number;

  /**
   * The rotation, in degrees, of the viewport.
   */
  rotation:number;

  /**
   * The horizontal, i.e. x-axis, offset. 
   * The default value is `0`.
   */
  offsetX?:number;

  /**
   * The vertical, i.e. y-axis, offset. 
   * The default value is `0`.
   */
  offsetY?:number;

  /**
   * If true, the y-axis will not be flipped. 
   * The default value is `false`.
   */
  dontFlip?:boolean;
}

interface PageViewportCloneParms
{
  /**
   * The scale, overriding the one in the cloned
   * viewport. The default value is `this.scale`.
   */
  scale?:number;

  /**
   * The rotation, in degrees, overriding the one
   * in the cloned viewport. The default value is `this.rotation`.
   */
  rotation?:number;

  /**
   * The horizontal, i.e. x-axis, offset. 
   * The default value is `this.offsetX`.
   */
  offsetX?:number;

  /**
   * The vertical, i.e. y-axis, offset.
   * The default value is `this.offsetY`.
   */
  offsetY?:number;

  /**
   * If true, the x-axis will not be flipped.
   * The default value is `false`.
   */
  dontFlip?:boolean;
}

/**
 * PDF page viewport created based on scale, rotation and offset.
 */
export class PageViewport 
{
  viewBox:number[];
  scale:number;
  rotation:number;
  offsetX:number;
  offsetY:number;

  transform:matrix_t;

  width:number;
  height:number;

  constructor({
    viewBox,
    scale,
    rotation,
    offsetX=0,
    offsetY=0,
    dontFlip=false,
  }:PageViewportParms )
  {
    this.viewBox = viewBox;
    this.scale = scale;
    this.rotation = rotation;
    this.offsetX = offsetX;
    this.offsetY = offsetY;

    // creating transform to convert pdf coordinate system to the normal
    // canvas like coordinates taking in account scale and rotation
    const centerX = (viewBox[2] + viewBox[0]) / 2;
    const centerY = (viewBox[3] + viewBox[1]) / 2;
    let rotateA, rotateB, rotateC, rotateD;
    // Normalize the rotation, by clamping it to the [0, 360) range.
    rotation %= 360;
    if( rotation < 0 ) rotation += 360;
    switch (rotation) 
    {
      case 180:
        rotateA = -1;
        rotateB = 0;
        rotateC = 0;
        rotateD = 1;
        break;
      case 90:
        rotateA = 0;
        rotateB = 1;
        rotateC = 1;
        rotateD = 0;
        break;
      case 270:
        rotateA = 0;
        rotateB = -1;
        rotateC = -1;
        rotateD = 0;
        break;
      case 0:
        rotateA = 1;
        rotateB = 0;
        rotateC = 0;
        rotateD = -1;
        break;
      default:
        throw new Error(
          "PageViewport: Invalid rotation, must be a multiple of 90 degrees."
        );
    }

    if (dontFlip) 
    {
      rotateC = -rotateC;
      rotateD = -rotateD;
    }

    let offsetCanvasX, offsetCanvasY;
    let width, height;
    if (rotateA === 0) 
    {
      offsetCanvasX = Math.abs(centerY - viewBox[1]) * scale + offsetX;
      offsetCanvasY = Math.abs(centerX - viewBox[0]) * scale + offsetY;
      width = Math.abs(viewBox[3] - viewBox[1]) * scale;
      height = Math.abs(viewBox[2] - viewBox[0]) * scale;
    }
    else {
      offsetCanvasX = Math.abs(centerX - viewBox[0]) * scale + offsetX;
      offsetCanvasY = Math.abs(centerY - viewBox[1]) * scale + offsetY;
      width = Math.abs(viewBox[2] - viewBox[0]) * scale;
      height = Math.abs(viewBox[3] - viewBox[1]) * scale;
    }
    // creating transform for the following operations:
    // translate(-centerX, -centerY), rotate and flip vertically,
    // scale, and translate(offsetCanvasX, offsetCanvasY)
    this.transform = [
      rotateA * scale,
      rotateB * scale,
      rotateC * scale,
      rotateD * scale,
      offsetCanvasX - rotateA * scale * centerX - rotateC * scale * centerY,
      offsetCanvasY - rotateB * scale * centerX - rotateD * scale * centerY,
    ];

    this.width = width;
    this.height = height;
  }

  /**
   * Clones viewport, with optional additional properties.
   * @return Cloned viewport.
   */
  clone({
    scale=this.scale,
    rotation=this.rotation,
    offsetX=this.offsetX,
    offsetY=this.offsetY,
    dontFlip=false,
  }:PageViewportCloneParms={}
  ):PageViewport {
    return new PageViewport({
      viewBox: this.viewBox.slice(),
      scale,
      rotation,
      offsetX,
      offsetY,
      dontFlip,
    });
  }

  /**
   * Converts PDF point to the viewport coordinates. For examples, useful for
   * converting PDF location into canvas pixel coordinates.
   * @param x The x-coordinate.
   * @param y The y-coordinate.
   * @return Object containing `x` and `y` properties of the
   *   point in the viewport coordinate space.
   * @see {@link convertToPdfPoint}
   * @see {@link convertToViewportRectangle}
   */
  convertToViewportPoint( x:number, y:number )
  {
    return Util.applyTransform([x, y], this.transform);
  }

  /**
   * Converts PDF rectangle to the viewport coordinates.
   * @param rect The xMin, yMin, xMax and yMax coordinates.
   * @return Array containing corresponding coordinates of the
   *   rectangle in the viewport coordinate space.
   * @see {@link convertToViewportPoint}
   */
  convertToViewportRectangle( rect:rect_t ):rect_t
  {
    const topLeft = Util.applyTransform([rect[0], rect[1]], this.transform);
    const bottomRight = Util.applyTransform([rect[2], rect[3]], this.transform);
    return [topLeft[0], topLeft[1], bottomRight[0], bottomRight[1]];
  }

  /**
   * Converts viewport coordinates to the PDF location. For examples, useful
   * for converting canvas pixel location into PDF one.
   * @param x The x-coordinate.
   * @param y The y-coordinate.
   * @return Object containing `x` and `y` properties of the
   *   point in the PDF coordinate space.
   * @see {@link convertToViewportPoint}
   */
  convertToPdfPoint( x:number, y:number ):point_t
  {
    return Util.applyInverseTransform([x, y], this.transform);
  }
}

export class RenderingCancelledException extends BaseException 
{
  constructor( msg:string, public type:string ) 
  {
    super(msg, "RenderingCancelledException");
  }
}

export const enum LinkTarget {
  NONE = 0, // Default value.
  SELF = 1,
  BLANK = 2,
  PARENT = 3,
  TOP = 4,
}

interface ExternalLinkParms
{
  /**
   * An absolute URL.
   */
  url:string;

  /**
   * The link target. The default value is `LinkTarget.NONE`.
   */
  target?:LinkTarget | undefined;

  /**
   * The link relationship. The default value is `DEFAULT_LINK_REL`.
   */
  rel?:string | undefined;

  /**
   * Whether the link should be enabled. The default value is true.
   */
  enabled?:boolean;
}

/**
 * Adds various attributes (href, title, target, rel) to hyperlinks.
 * @param link The link element.
 */
export function addLinkAttributes( link:HTMLAnchorElement, 
  { url, target, rel, enabled=true }=<ExternalLinkParms>{}
) {
  assert(
    url && typeof url === "string",
    'addLinkAttributes: A valid "url" parameter must provided.'
  );

  const urlNullRemoved = removeNullCharacters(url);
  if (enabled) {
    link.href = link.title = urlNullRemoved;
  }
  else {
    link.href = "";
    link.title = `Disabled: ${urlNullRemoved}`;
    link.onclick = () => {
      return false;
    };
  }

  let targetStr = ""; // LinkTarget.NONE
  switch (target) {
    case LinkTarget.NONE:
      break;
    case LinkTarget.SELF:
      targetStr = "_self";
      break;
    case LinkTarget.BLANK:
      targetStr = "_blank";
      break;
    case LinkTarget.PARENT:
      targetStr = "_parent";
      break;
    case LinkTarget.TOP:
      targetStr = "_top";
      break;
  }
  link.target = targetStr;

  link.rel = typeof rel === "string" ? rel : DEFAULT_LINK_REL;
}

export function isDataScheme( url:string )
{
  const ii = url.length;
  let i = 0;
  while (i < ii && url[i].trim() === "") {
    i++;
  }
  return url.substring(i, i + 5).toLowerCase() === "data:";
}

export function isPdfFile( filename:unknown )
{
  return typeof filename === "string" && /\.pdf$/i.test(filename);
}

/**
 * Gets the filename from a given URL.
 */
export function getFilenameFromUrl( url:string ) 
{
  const anchor = url.indexOf("#");
  const query = url.indexOf("?");
  const end = Math.min(
    anchor > 0 ? anchor : url.length,
    query > 0 ? query : url.length
  );
  return url.substring(url.lastIndexOf("/", end) + 1, end);
}

/**
 * Returns the filename or guessed filename from the url (see issue 3455).
 * @param url The original PDF location.
 * @param defaultFilename The value returned if the filename is
 *   unknown, or the protocol is unsupported.
 * @return Guessed PDF filename.
 */
export function getPdfFilenameFromUrl( url:unknown, defaultFilename="document.pdf" )
{
  if( typeof url !== "string" ) return defaultFilename;

  if( isDataScheme(url) )
  {
    warn('getPdfFilenameFromUrl: ignore "data:"-URL for performance reasons.');
    return defaultFilename;
  }
  const reURI = /^(?:(?:[^:]+:)?\/\/[^/]+)?([^?#]*)(\?[^#]*)?(#.*)?$/;
  //              SCHEME        HOST        1.PATH  2.QUERY   3.REF
  // Pattern to get last matching NAME.pdf
  const reFilename = /[^/?#=]+\.pdf\b(?!.*\.pdf\b)/i;
  const splitURI = reURI.exec(url);
  let suggestedFilename:RegExpExecArray | string | null =
    reFilename.exec( splitURI![1] ) ||
    reFilename.exec( splitURI![2] ) ||
    reFilename.exec( splitURI![3] );
  if (suggestedFilename) {
    suggestedFilename = suggestedFilename[0];
    if (suggestedFilename.includes("%")) {
      // URL-encoded %2Fpath%2Fto%2Ffile.pdf should be file.pdf
      try {
        suggestedFilename = reFilename.exec(
          decodeURIComponent(suggestedFilename)
        )![0];
      } catch (ex) {
        // Possible (extremely rare) errors:
        // URIError "Malformed URI", e.g. for "%AA.pdf"
        // TypeError "null has no properties", e.g. for "%2F.pdf"
      }
    }
  }
  return suggestedFilename || defaultFilename;
}

interface StatTime
{
  name:string;
  start:number;
  end:number;
}

export class StatTimer 
{
  started = Object.create(null);
  times:StatTime[] = [];

  time( name:string ) 
  {
    if (name in this.started) 
    {
      warn(`Timer is already running for ${name}`);
    }
    this.started[name] = Date.now();
  }

  timeEnd( name:string ) 
  {
    if (!(name in this.started)) 
    {
      warn(`Timer has not been started for ${name}`);
    }
    this.times.push({
      name,
      start: this.started[name],
      end: Date.now(),
    });
    // Remove timer from started so it can be called again.
    delete this.started[name];
  }

  toString() 
  {
    // Find the longest name for padding purposes.
    const outBuf = [];
    let longest = 0;
    for (const time of this.times) 
    {
      const name = time.name;
      if (name.length > longest) 
      {
        longest = name.length;
      }
    }
    for (const time of this.times) 
    {
      const duration = time.end - time.start;
      outBuf.push(`${time.name.padEnd(longest)} ${duration}ms\n`);
    }
    return outBuf.join("");
  }
}

export function isValidFetchUrl( url:string | URL | undefined, baseUrl?:string|URL ) 
{
  try {
    const { protocol } = baseUrl 
      ? new URL( url!, baseUrl ) 
      : new URL( url! );
    // The Fetch API only supports the http/https protocols, and not file/ftp.
    return protocol === "http:" || protocol === "https:";
  } catch (ex) {
    return false; // `new URL()` will throw on incorrect data.
  }
}

export function loadScript( src:string, removeScriptElement=false )
{
  return new Promise<Event>((resolve, reject) => {
    const script = html("script");
    script.src = src;

    script.onload = ( evt:Event ) => {
      if (removeScriptElement) {
        script.remove();
      }
      resolve(evt);
    };
    script.onerror = () => {
      reject(new Error(`Cannot load script at: ${script.src}`));
    };
    (document.head || document.documentElement).appendChild(script);
  });
}

// Deprecated API function -- display regardless of the `verbosity` setting.
export function deprecated( details:string )
{
  console.log("Deprecated API usage: " + details);
}

let pdfDateStringRegex:RegExp;

export class PDFDateString 
{
  /**
   * Convert a PDF date string to a JavaScript `Date` object.
   *
   * The PDF date string format is described in section 7.9.4 of the official
   * PDF 32000-1:2008 specification. However, in the PDF 1.7 reference (sixth
   * edition) Adobe describes the same format including a trailing apostrophe.
   * This syntax in incorrect, but Adobe Acrobat creates PDF files that contain
   * them. We ignore all apostrophes as they are not necessary for date parsing.
   *
   * Moreover, Adobe Acrobat doesn't handle changing the date to universal time
   * and doesn't use the user's time zone (effectively ignoring the HH' and mm'
   * parts of the date string).
   */
  static toDateObject( input:string )
  {
    if( !input || !(typeof input === "string") ) return null;

    // Lazily initialize the regular expression.
    if (!pdfDateStringRegex) {
      pdfDateStringRegex = new RegExp(
        "^D:" + // Prefix (required)
        "(\\d{4})" + // Year (required)
        "(\\d{2})?" + // Month (optional)
        "(\\d{2})?" + // Day (optional)
        "(\\d{2})?" + // Hour (optional)
        "(\\d{2})?" + // Minute (optional)
        "(\\d{2})?" + // Second (optional)
        "([Z|+|-])?" + // Universal time relation (optional)
        "(\\d{2})?" + // Offset hour (optional)
        "'?" + // Splitting apostrophe (optional)
        "(\\d{2})?" + // Offset minute (optional)
          "'?" // Trailing apostrophe (optional)
      );
    }

    // Optional fields that don't satisfy the requirements from the regular
    // expression (such as incorrect digit counts or numbers that are out of
    // range) will fall back the defaults from the specification.
    const matches = pdfDateStringRegex.exec(input);
    if (!matches) {
      return null;
    }

    // JavaScript's `Date` object expects the month to be between 0 and 11
    // instead of 1 and 12, so we have to correct for that.
    const year = parseInt(matches[1], 10);
    let month = parseInt(matches[2], 10);
    month = month >= 1 && month <= 12 ? month - 1 : 0;
    let day = parseInt(matches[3], 10);
    day = day >= 1 && day <= 31 ? day : 1;
    let hour = parseInt(matches[4], 10);
    hour = hour >= 0 && hour <= 23 ? hour : 0;
    let minute = parseInt(matches[5], 10);
    minute = minute >= 0 && minute <= 59 ? minute : 0;
    let second = parseInt(matches[6], 10);
    second = second >= 0 && second <= 59 ? second : 0;
    const universalTimeRelation = matches[7] || "Z";
    let offsetHour = parseInt(matches[8], 10);
    offsetHour = offsetHour >= 0 && offsetHour <= 23 ? offsetHour : 0;
    let offsetMinute = parseInt(matches[9], 10) || 0;
    offsetMinute = offsetMinute >= 0 && offsetMinute <= 59 ? offsetMinute : 0;

    // Universal time relation 'Z' means that the local time is equal to the
    // universal time, whereas the relations '+'/'-' indicate that the local
    // time is later respectively earlier than the universal time. Every date
    // is normalized to universal time.
    if (universalTimeRelation === "-") {
      hour += offsetHour;
      minute += offsetMinute;
    }
    else if (universalTimeRelation === "+") {
      hour -= offsetHour;
      minute -= offsetMinute;
    }

    return new Date(Date.UTC(year, month, day, hour, minute, second));
  }
}

/**
 * NOTE: This is (mostly) intended to support printing of XFA forms.
 */
export function getXfaPageViewport( xfaPage:XFAElObj, { scale = 1, rotation = 0 }) 
{
  const { width, height } = <{width:string;height:string;}>xfaPage.attributes!.style;
  const viewBox = [0, 0, parseInt(width), parseInt(height)];

  return new PageViewport({
    viewBox,
    scale,
    rotation,
  });
}

/*81---------------------------------------------------------------------------*/
