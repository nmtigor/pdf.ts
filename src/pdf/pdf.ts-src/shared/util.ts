/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/shared/util.ts
 * @license Apache-2.0
 ******************************************************************************/

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
/* globals process */

import type { HttpStatusCode } from "@fe-lib/HttpStatusCode.ts";
import type { dot2d_t, rect_t, TupleOf } from "@fe-lib/alias.ts";
import { isObjectLike } from "@fe-lib/jslang.ts";
import { assert, ErrorJ, warn as warn_0 } from "@fe-lib/util/trace.ts";
import { GENERIC, MOZCENTRAL, PDFJSDev, TESTING } from "@fe-src/global.ts";
/*80--------------------------------------------------------------------------*/

// NW.js / Electron is a browser context, but copies some Node.js objects; see
// http://docs.nwjs.io/en/latest/For%20Users/Advanced/JavaScript%20Contexts%20in%20NW.js/#access-nodejs-and-nwjs-api-in-browser-context
// https://www.electronjs.org/docs/api/process#processversionselectron-readonly
// https://www.electronjs.org/docs/api/process#processtype-readonly
export const isNodeJS = (PDFJSDev || GENERIC) &&
  typeof (globalThis as any).process === "object" &&
  (globalThis as any).process + "" === "[object process]" &&
  !(globalThis as any).process.versions.nw &&
  !((globalThis as any).process.versions.electron &&
    (globalThis as any).process.type &&
    (globalThis as any).process.type !== "browser");

export const IDENTITY_MATRIX: matrix_t = [1, 0, 0, 1, 0, 0];
export const FONT_IDENTITY_MATRIX: matrix_t = [0.001, 0, 0, 0.001, 0, 0];

export const MAX_IMAGE_SIZE_TO_CACHE = 10e6; // Ten megabytes.

// Represent the percentage of the height of a single-line field over
// the font size. Acrobat seems to use this value.
export const LINE_FACTOR = 1.35;
export const LINE_DESCENT_FACTOR = 0.35;
export const BASELINE_FACTOR = LINE_DESCENT_FACTOR / LINE_FACTOR;

/**
 * Refer to the `WorkerTransport.getRenderingIntent`-method in the API, to see
 * how these flags are being used:
 *  - ANY, DISPLAY, and PRINT are the normal rendering intents, note the
 *    `PDFPageProxy.{render, getOperatorList, getAnnotations}`-methods.
 *  - SAVE is used, on the worker-thread, when saving modified annotations.
 *  - ANNOTATIONS_FORMS, ANNOTATIONS_STORAGE, ANNOTATIONS_DISABLE control which
 *    annotations are rendered onto the canvas (i.e. by being included in the
 *    operatorList), note the `PDFPageProxy.{render, getOperatorList}`-methods
 *    and their `annotationMode`-option.
 *  - IS_EDITING is used when editing is active in the viewer.
 *  - OPLIST is used with the `PDFPageProxy.getOperatorList`-method, note the
 *    `OperatorList`-constructor (on the worker-thread).
 */
export const enum RenderingIntentFlag {
  _0 = 0,
  ANY = 0x01,
  DISPLAY = 0x02,
  PRINT = 0x04,
  SAVE = 0x08,
  ANNOTATIONS_FORMS = 0x10,
  ANNOTATIONS_STORAGE = 0x20,
  ANNOTATIONS_DISABLE = 0x40,
  IS_EDITING = 0x80,
  OPLIST = 0x100,
}

export enum AnnotationMode {
  DISABLE = 0,
  ENABLE = 1,
  ENABLE_FORMS = 2,
  ENABLE_STORAGE = 3,
}

export const AnnotationEditorPrefix = "pdfjs_internal_editor_";

export type AnnotationEditorName = "freetext" | "highlight" | "stamp" | "ink";
export enum AnnotationEditorType {
  DISABLE = -1,
  NONE = 0,
  FREETEXT = 3,
  HIGHLIGHT = 9,
  STAMP = 13,
  INK = 15,
}

export enum AnnotationEditorParamsType {
  RESIZE = 1,
  CREATE = 2,
  FREETEXT_SIZE = 11,
  FREETEXT_COLOR = 12,
  FREETEXT_OPACITY = 13,
  INK_COLOR = 21,
  INK_THICKNESS = 22,
  INK_OPACITY = 23,
  HIGHLIGHT_COLOR = 31,
  HIGHLIGHT_DEFAULT_COLOR = 32,
  HIGHLIGHT_THICKNESS = 33,
  HIGHLIGHT_FREE = 34,
  HIGHLIGHT_SHOW_ALL = 35,
}

// Permission flags from Table 22, Section 7.6.3.2 of the PDF specification.
export enum PermissionFlag {
  PRINT = 0x04,
  MODIFY_CONTENTS = 0x08,
  COPY = 0x10,
  MODIFY_ANNOTATIONS = 0x20,
  FILL_INTERACTIVE_FORMS = 0x100,
  COPY_FOR_ACCESSIBILITY = 0x200,
  ASSEMBLE = 0x400,
  PRINT_HIGH_QUALITY = 0x800,
}

export const enum TextRenderingMode {
  FILL = 0,
  STROKE = 1,
  FILL_STROKE = 2,
  INVISIBLE = 3,
  FILL_ADD_TO_PATH = 4,
  STROKE_ADD_TO_PATH = 5,
  FILL_STROKE_ADD_TO_PATH = 6,
  ADD_TO_PATH = 7,
  FILL_STROKE_MASK = 3,
  ADD_TO_PATH_FLAG = 4,
}

export enum ImageKind {
  GRAYSCALE_1BPP = 1,
  RGB_24BPP = 2,
  RGBA_32BPP = 3,
}

export const enum AnnotationType {
  TEXT = 1,
  LINK,
  FREETEXT,
  LINE,
  SQUARE,
  CIRCLE,
  POLYGON,
  POLYLINE,
  HIGHLIGHT,
  UNDERLINE,
  SQUIGGLY,
  STRIKEOUT,
  STAMP,
  CARET,
  INK,
  POPUP,
  FILEATTACHMENT,
  SOUND,
  MOVIE,
  WIDGET,
  SCREEN,
  PRINTERMARK,
  TRAPNET,
  WATERMARK,
  THREED,
  REDACT,
}

export const enum AnnotationReplyType {
  GROUP = "Group",
  REPLY = "R",
}

// PDF 1.7 Table 165
// deno-fmt-ignore
export const enum AnnotationFlag {
  UNDEFINED      = 0,
  INVISIBLE      = 0b00_0000_0001,
  HIDDEN         = 0b00_0000_0010,
  PRINT          = 0b00_0000_0100,
  NOZOOM         = 0b00_0000_1000,
  NOROTATE       = 0b00_0001_0000,
  NOVIEW         = 0b00_0010_0000,
  READONLY       = 0b00_0100_0000,
  LOCKED         = 0b00_1000_0000,
  TOGGLENOVIEW   = 0b01_0000_0000,
  LOCKEDCONTENTS = 0b10_0000_0000,
}

export const enum AnnotationFieldFlag {
  READONLY = 0x0000001,
  REQUIRED = 0x0000002,
  NOEXPORT = 0x0000004,
  MULTILINE = 0x0001000,
  PASSWORD = 0x0002000,
  NOTOGGLETOOFF = 0x0004000,
  RADIO = 0x0008000,
  PUSHBUTTON = 0x0010000,
  COMBO = 0x0020000,
  EDIT = 0x0040000,
  SORT = 0x0080000,
  FILESELECT = 0x0100000,
  MULTISELECT = 0x0200000,
  DONOTSPELLCHECK = 0x0400000,
  DONOTSCROLL = 0x0800000,
  COMB = 0x1000000,
  RICHTEXT = 0x2000000,
  RADIOSINUNISON = 0x2000000,
  COMMITONSELCHANGE = 0x4000000,
}

/**
 * PDF 1.7 Table 166 S
 */
export const enum AnnotationBorderStyleType {
  SOLID = 1,
  DASHED = 2,
  BEVELED = 3,
  INSET = 4,
  UNDERLINE = 5,
}

export const AnnotationActionEventType = {
  E: "Mouse Enter",
  X: "Mouse Exit",
  D: "Mouse Down",
  U: "Mouse Up",
  Fo: "Focus",
  Bl: "Blur",
  PO: "PageOpen",
  PC: "PageClose",
  PV: "PageVisible",
  PI: "PageInvisible",
  K: "Keystroke",
  F: "Format",
  V: "Validate",
  C: "Calculate",
} as const;
export const DocumentActionEventType = {
  WC: "WillClose",
  WS: "WillSave",
  DS: "DidSave",
  WP: "WillPrint",
  DP: "DidPrint",
} as const;
export const PageActionEventType = {
  O: "PageOpen",
  C: "PageClose",
} as const;
// export const _ActionEventType = <const>{
//   ...AnnotationActionEventType,
//   ...DocumentActionEventType,
//   ...PageActionEventType,
// }
// export type ActionEventTypeType = typeof _ActionEventType;
export type ActionEventTypeType =
  | typeof AnnotationActionEventType
  | typeof DocumentActionEventType
  | typeof PageActionEventType;
export type ActionEventType =
  | keyof typeof AnnotationActionEventType
  | keyof typeof DocumentActionEventType
  | keyof typeof PageActionEventType;
export type ActionEventName =
  | (typeof AnnotationActionEventType)[keyof typeof AnnotationActionEventType]
  | (typeof DocumentActionEventType)[keyof typeof DocumentActionEventType]
  | (typeof PageActionEventType)[keyof typeof PageActionEventType]
  | "OpenAction"
  | "Action";

// export enum StreamType {
//   UNKNOWN = "UNKNOWN",
//   FLATE = "FLATE",
//   LZW = "LZW",
//   DCT = "DCT",
//   JPX = "JPX",
//   JBIG = "JBIG",
//   A85 = "A85",
//   AHX = "AHX",
//   CCF = "CCF",
//   RLX = "RLX", // PDF short name is 'RL', but telemetry requires three chars.
// }

// export enum FontType {
//   UNKNOWN = "UNKNOWN",
//   TYPE1 = "TYPE1",
//   TYPE1STANDARD = "TYPE1STANDARD",
//   TYPE1C = "TYPE1C",
//   CIDFONTTYPE0 = "CIDFONTTYPE0",
//   CIDFONTTYPE0C = "CIDFONTTYPE0C",
//   TRUETYPE = "TRUETYPE",
//   CIDFONTTYPE2 = "CIDFONTTYPE2",
//   TYPE3 = "TYPE3",
//   OPENTYPE = "OPENTYPE",
//   TYPE0 = "TYPE0",
//   MMTYPE1 = "MMTYPE1",
// }

export enum VerbosityLevel {
  ERRORS = 0,
  WARNINGS = 1,
  INFOS = 5,
}

export enum CMapCompressionType {
  NONE = 0,
  BINARY = 1,
}

/** All the possible operations for an operator list. */
export enum OPS {
  // Intentionally start from 1 so it is easy to spot bad operators that will be
  // 0's.
  // PLEASE NOTE: We purposely keep any removed operators commented out, since
  //              re-numbering the list would risk breaking third-party users.
  dependency = 1,
  setLineWidth = 2,
  setLineCap = 3,
  setLineJoin = 4,
  setMiterLimit = 5,
  setDash = 6,
  setRenderingIntent = 7,
  setFlatness = 8,
  setGState = 9,
  save = 10,
  restore = 11,
  transform = 12,
  moveTo = 13,
  lineTo = 14,
  curveTo = 15,
  curveTo2 = 16,
  curveTo3 = 17,
  closePath = 18,
  rectangle = 19,
  stroke = 20,
  closeStroke = 21,
  fill = 22,
  eoFill = 23,
  fillStroke = 24,
  eoFillStroke = 25,
  closeFillStroke = 26,
  closeEOFillStroke = 27,
  endPath = 28,
  clip = 29,
  eoClip = 30,
  beginText = 31,
  endText = 32,
  setCharSpacing = 33,
  setWordSpacing = 34,
  setHScale = 35,
  setLeading = 36,
  setFont = 37,
  setTextRenderingMode = 38,
  setTextRise = 39,
  moveText = 40,
  setLeadingMoveText = 41,
  setTextMatrix = 42,
  nextLine = 43,
  showText = 44,
  showSpacedText = 45,
  nextLineShowText = 46,
  nextLineSetSpacingShowText = 47,
  setCharWidth = 48,
  setCharWidthAndBounds = 49,
  setStrokeColorSpace = 50,
  setFillColorSpace = 51,
  setStrokeColor = 52,
  setStrokeColorN = 53,
  setFillColor = 54,
  setFillColorN = 55,
  setStrokeGray = 56,
  setFillGray = 57,
  setStrokeRGBColor = 58,
  setFillRGBColor = 59,
  setStrokeCMYKColor = 60,
  setFillCMYKColor = 61,
  shadingFill = 62,
  beginInlineImage = 63,
  beginImageData = 64,
  endInlineImage = 65,
  paintXObject = 66,
  markPoint = 67,
  markPointProps = 68,
  beginMarkedContent = 69,
  beginMarkedContentProps = 70,
  endMarkedContent = 71,
  beginCompat = 72,
  endCompat = 73,
  paintFormXObjectBegin = 74,
  paintFormXObjectEnd = 75,
  beginGroup = 76,
  endGroup = 77,
  // beginAnnotations: 78,
  // endAnnotations: 79,
  beginAnnotation = 80,
  endAnnotation = 81,
  // paintJpegXObject: 82,
  paintImageMaskXObject = 83,
  paintImageMaskXObjectGroup = 84,
  paintImageXObject = 85,
  paintInlineImageXObject = 86,
  paintInlineImageXObjectGroup = 87,
  paintImageXObjectRepeat = 88,
  paintImageMaskXObjectRepeat = 89,
  paintSolidColorImageMask = 90,
  constructPath = 91,
  setStrokeTransparent = 92,
  setFillTransparent = 93,
  //kkkk TOCLEANUP
  // group = 92,
}
export type OPSName = keyof typeof OPS;
// export type OPSValu = (typeof OPS)[OPSName];

export enum PasswordResponses {
  NEED_PASSWORD = 1,
  INCORRECT_PASSWORD = 2,
}

let verbosity = VerbosityLevel.WARNINGS;
export function setVerbosityLevel(level: VerbosityLevel) {
  verbosity = level;
}
export function getVerbosityLevel() {
  return verbosity;
}

/**
 * A notice for devs. These are good for things that are helpful to devs, such
 * as warning that Workers were disabled, which is important to devs but not
 * end users.
 */
export function info(msg: string) {
  if (verbosity >= VerbosityLevel.INFOS) {
    console.log(`Info: ${msg}`);
  }
}

/**
 * Non-fatal warnings.
 */
export function warn(msg: string, meta?: { url: string }) {
  if (verbosity >= VerbosityLevel.WARNINGS) {
    warn_0(`Warning: ${msg}`, meta);
  }
}

// function unreachable(msg) {
//   throw new Error(msg);
// }

// Checks if URLs use one of the allowed protocols, e.g. to avoid XSS.
function _isValidProtocol(url: URL) {
  switch (url?.protocol) {
    case "http:":
    case "https:":
    case "ftp:":
    case "mailto:":
    case "tel:":
      return true;
    default:
      return false;
  }
}

interface _CreateValidAbsoluteUrlP {
  addDefaultProtocol?: boolean;
  tryConvertEncoding: boolean;
}

/**
 * Attempts to create a valid absolute URL.
 *
 * @param url An absolute, or relative, URL.
 * @param baseUrl An absolute URL.
 * @return Either a valid {URL}, or `null` otherwise.
 */
export function createValidAbsoluteUrl(
  url: URL | string,
  baseUrl?: URL | string | undefined,
  options?: _CreateValidAbsoluteUrlP,
): URL | null {
  if (!url) {
    return null;
  }

  try {
    if (options && typeof url === "string") {
      // Let URLs beginning with "www." default to using the "http://" protocol.
      if (options.addDefaultProtocol && url.startsWith("www.")) {
        const dots = url.match(/\./g);
        // Avoid accidentally matching a *relative* URL pointing to a file named
        // e.g. "www.pdf" or similar.
        if ((dots?.length as any) >= 2) {
          url = `http://${url}`;
        }
      }

      // According to ISO 32000-1:2008, section 12.6.4.7, URIs should be encoded
      // in 7-bit ASCII. Some bad PDFs use UTF-8 encoding; see bug 1122280.
      if (options.tryConvertEncoding) {
        try {
          url = stringToUTF8String(url);
        } catch {}
      }
    }

    const absoluteUrl = baseUrl ? new URL(url, baseUrl) : new URL(url);
    if (_isValidProtocol(absoluteUrl)) {
      return absoluteUrl;
    }
  } catch {
    /* `new URL()` will throw on incorrect data. */
  }
  return null;
}

export function shadow<T>(
  obj: any,
  prop: string | symbol,
  value: T,
  nonSerializable = false,
): T {
  /*#static*/ if (PDFJSDev || TESTING) {
    assert(
      prop in obj,
      `shadow: Property "${prop && prop.toString()}" not found in object.`,
    );
  }
  Object.defineProperty(obj, prop, {
    value,
    enumerable: !nonSerializable,
    configurable: true,
    writable: false,
  });
  return value;
}

export abstract class BaseException extends Error {
  constructor(message: string | undefined, name: string) {
    super(message);
    this.name = name;
  }
}

export interface PasswordExceptionJ extends ErrorJ {
  code: number;
}
export class PasswordException extends BaseException {
  constructor(msg: string, public code: number) {
    super(msg, "PasswordException");
  }

  override toJ(): PasswordExceptionJ {
    const ret = super.toJ() as PasswordExceptionJ;
    ret.code = this.code;
    return ret;
  }
}

export class InvalidPDFException extends BaseException {
  constructor(msg: string) {
    super(msg, "InvalidPDFException");
  }
}

export class MissingPDFException extends BaseException {
  constructor(msg: string) {
    super(msg, "MissingPDFException");
  }
}

export interface UnexpectedResponseExceptionJ extends ErrorJ {
  status: HttpStatusCode;
}
export class UnexpectedResponseException extends BaseException {
  constructor(msg: string, public status: HttpStatusCode) {
    super(msg, "UnexpectedResponseException");
  }

  override toJ(): UnexpectedResponseExceptionJ {
    const ret = super.toJ() as UnexpectedResponseExceptionJ;
    ret.status = this.status;
    return ret;
  }
}

export interface UnknownErrorExceptionJ extends ErrorJ {
  details: string | undefined;
}
export class UnknownErrorException extends BaseException {
  constructor(msg: string, public details?: string) {
    super(msg, "UnknownErrorException");
  }

  override toJ(): UnknownErrorExceptionJ {
    const ret = super.toJ() as UnknownErrorExceptionJ;
    ret.details = this.details;
    return ret;
  }
}

/**
 * Error caused during parsing PDF data.
 */
export class FormatError extends BaseException {
  constructor(msg: string) {
    super(msg, "FormatError");
  }
}

/**
 * Error used to indicate task cancellation.
 */
export class AbortException extends BaseException {
  constructor(msg: string) {
    super(msg, "AbortException");
  }
}

export function bytesToString(bytes: Uint8Array | Uint8ClampedArray) {
  assert(
    isObjectLike(bytes) && bytes.length !== undefined,
    "Invalid argument for bytesToString",
  );
  const length = bytes.length;
  const MAX_ARGUMENT_COUNT = 8192;
  if (length < MAX_ARGUMENT_COUNT) {
    return String.fromCharCode.apply(null, bytes as any);
  }
  const strBuf = [];
  for (let i = 0; i < length; i += MAX_ARGUMENT_COUNT) {
    const chunkEnd = Math.min(i + MAX_ARGUMENT_COUNT, length);
    const chunk = bytes.subarray(i, chunkEnd);
    strBuf.push(String.fromCharCode.apply(null, chunk as any));
  }
  return strBuf.join("");
}

export function stringToBytes(str: string) {
  assert(typeof str === "string", "Invalid argument for stringToBytes");

  const length = str.length;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; ++i) {
    bytes[i] = str.charCodeAt(i) & 0xff;
  }
  return bytes;
}

export function string32(value: number) {
  /*#static*/ if (PDFJSDev || TESTING) {
    assert(
      typeof value === "number" && Math.abs(value) < 2 ** 32,
      `string32: Unexpected input "${value}".`,
    );
  }
  return String.fromCharCode(
    (value >> 24) & 0xff,
    (value >> 16) & 0xff,
    (value >> 8) & 0xff,
    value & 0xff,
  );
}

export function objectSize(obj: {}) {
  return Object.keys(obj).length;
}

// Ensure that the returned Object has a `null` prototype; hence why
// `Object.fromEntries(...)` is not used.
export function objectFromMap<K extends string | number, V>(
  map: Iterable<readonly [K, V]>,
) {
  const obj: Record<K, V> = Object.create(null);
  for (const [key, value] of map) {
    obj[key] = value;
  }
  return obj;
}

// Checks the endianness of the platform.
function isLittleEndian() {
  const buffer8 = new Uint8Array(4);
  buffer8[0] = 1;
  const view32 = new Uint32Array(buffer8.buffer, 0, 1);
  return view32[0] === 1;
}

// Checks if it's possible to eval JS expressions.
function isEvalSupported() {
  try {
    new Function(""); // eslint-disable-line no-new, no-new-func
    return true;
  } catch {
    return false;
  }
}

export class FeatureTest {
  static get isLittleEndian() {
    return shadow(this, "isLittleEndian", isLittleEndian());
  }

  static get isEvalSupported() {
    return shadow(this, "isEvalSupported", isEvalSupported());
  }

  static get isOffscreenCanvasSupported() {
    return shadow(
      this,
      "isOffscreenCanvasSupported",
      !!(globalThis as any).OffscreenCanvas,
    );
  }

  static get platform() {
    if (
      MOZCENTRAL ||
      (typeof navigator !== "undefined" &&
        typeof navigator?.platform === "string")
    ) {
      return shadow(this, "platform", {
        isMac: navigator.platform.includes("Mac"),
      });
    }
    return shadow(this, "platform", { isMac: false });
  }

  static get isCSSRoundSupported() {
    return shadow(
      this,
      "isCSSRoundSupported",
      globalThis.CSS?.supports?.("width: round(1.5px, 1px)"),
    );
  }
}

export type point3d_t = [number, number, number];
export type matrix_t = TupleOf<number, 6>;
export type matrix3d_t = TupleOf<number, 9>;

const hexNumbers = Array.from(
  Array(256).keys(),
  (n) => n.toString(16).padStart(2, "0"),
);

export class Util {
  static makeHexColor(r: number, g: number, b: number) {
    return `#${hexNumbers[r]}${hexNumbers[g]}${hexNumbers[b]}`;
  }

  /**
   * Apply a scaling matrix to some min/max values.
   * If a scaling factor is negative then min and max must be
   * swapped.
   */
  static scaleMinMax(transform: matrix_t, minMax: rect_t) {
    let temp;
    if (transform[0]) {
      if (transform[0] < 0) {
        temp = minMax[0];
        minMax[0] = minMax[2];
        minMax[2] = temp;
      }
      minMax[0] *= transform[0];
      minMax[2] *= transform[0];

      if (transform[3] < 0) {
        temp = minMax[1];
        minMax[1] = minMax[3];
        minMax[3] = temp;
      }
      minMax[1] *= transform[3];
      minMax[3] *= transform[3];
    } else {
      temp = minMax[0];
      minMax[0] = minMax[1];
      minMax[1] = temp;
      temp = minMax[2];
      minMax[2] = minMax[3];
      minMax[3] = temp;

      if (transform[1] < 0) {
        temp = minMax[1];
        minMax[1] = minMax[3];
        minMax[3] = temp;
      }
      minMax[1] *= transform[1];
      minMax[3] *= transform[1];

      if (transform[2] < 0) {
        temp = minMax[0];
        minMax[0] = minMax[2];
        minMax[2] = temp;
      }
      minMax[0] *= transform[2];
      minMax[2] *= transform[2];
    }
    minMax[0] += transform[4];
    minMax[1] += transform[5];
    minMax[2] += transform[4];
    minMax[3] += transform[5];
  }

  // Concatenates two transformation matrices together and returns the result.
  static transform(m1: matrix_t, m2: matrix_t): matrix_t {
    return [
      m1[0] * m2[0] + m1[2] * m2[1],
      m1[1] * m2[0] + m1[3] * m2[1],
      m1[0] * m2[2] + m1[2] * m2[3],
      m1[1] * m2[2] + m1[3] * m2[3],
      m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
      m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
    ];
  }

  // For 2d affine transforms
  static applyTransform(p: dot2d_t, m: matrix_t): dot2d_t {
    const xt = p[0] * m[0] + p[1] * m[2] + m[4];
    const yt = p[0] * m[1] + p[1] * m[3] + m[5];
    return [xt, yt];
  }

  static applyInverseTransform(p: dot2d_t, m: matrix_t): dot2d_t {
    const d = m[0] * m[3] - m[1] * m[2];
    const xt = (p[0] * m[3] - p[1] * m[2] + m[2] * m[5] - m[4] * m[3]) / d;
    const yt = (-p[0] * m[1] + p[1] * m[0] + m[4] * m[1] - m[5] * m[0]) / d;
    return [xt, yt];
  }

  // Applies the transform to the rectangle and finds the minimum axially
  // aligned bounding box.
  static getAxialAlignedBoundingBox(r: rect_t, m: matrix_t): rect_t {
    const p1 = this.applyTransform(r as unknown as dot2d_t, m);
    const p2 = this.applyTransform(r.slice(2, 4) as dot2d_t, m);
    const p3 = this.applyTransform([r[0], r[3]], m);
    const p4 = this.applyTransform([r[2], r[1]], m);
    return [
      Math.min(p1[0], p2[0], p3[0], p4[0]),
      Math.min(p1[1], p2[1], p3[1], p4[1]),
      Math.max(p1[0], p2[0], p3[0], p4[0]),
      Math.max(p1[1], p2[1], p3[1], p4[1]),
    ];
  }

  static inverseTransform(m: matrix_t): matrix_t {
    const d = m[0] * m[3] - m[1] * m[2];
    return [
      m[3] / d,
      -m[1] / d,
      -m[2] / d,
      m[0] / d,
      (m[2] * m[5] - m[4] * m[3]) / d,
      (m[4] * m[1] - m[5] * m[0]) / d,
    ];
  }

  // This calculation uses Singular Value Decomposition.
  // The SVD can be represented with formula A = USV. We are interested in the
  // matrix S here because it represents the scale values.
  static singularValueDecompose2dScale(m: matrix_t) {
    const transpose = [m[0], m[2], m[1], m[3]];

    // Multiply matrix m with its transpose.
    const a = m[0] * transpose[0] + m[1] * transpose[2];
    const b = m[0] * transpose[1] + m[1] * transpose[3];
    const c = m[2] * transpose[0] + m[3] * transpose[2];
    const d = m[2] * transpose[1] + m[3] * transpose[3];

    // Solve the second degree polynomial to get roots.
    const first = (a + d) / 2;
    const second = Math.sqrt((a + d) ** 2 - 4 * (a * d - c * b)) / 2;
    const sx = first + second || 1;
    const sy = first - second || 1;

    // Scale values are the square roots of the eigenvalues.
    return [Math.sqrt(sx), Math.sqrt(sy)];
  }

  // Normalize rectangle rect=[x1, y1, x2, y2] so that (x1,y1) < (x2,y2)
  // For coordinate systems whose origin lies in the bottom-left, this
  // means normalization to (BL,TR) ordering. For systems with origin in the
  // top-left, this means (TL,BR) ordering.
  static normalizeRect(rect: rect_t): rect_t {
    const r = rect.slice(0) as rect_t; // clone rect
    if (rect[0] > rect[2]) {
      r[0] = rect[2];
      r[2] = rect[0];
    }
    if (rect[1] > rect[3]) {
      r[1] = rect[3];
      r[3] = rect[1];
    }
    return r;
  }

  // Returns a rectangle [x1, y1, x2, y2] corresponding to the
  // intersection of rect1 and rect2. If no intersection, returns 'undefined'
  // The rectangle coordinates of rect1, rect2 should be [x1, y1, x2, y2]
  static intersect(rect1: rect_t, rect2: rect_t): rect_t | undefined {
    const xLow = Math.max(
      Math.min(rect1[0], rect1[2]),
      Math.min(rect2[0], rect2[2]),
    );
    const xHigh = Math.min(
      Math.max(rect1[0], rect1[2]),
      Math.max(rect2[0], rect2[2]),
    );
    if (xLow > xHigh) return undefined;

    const yLow = Math.max(
      Math.min(rect1[1], rect1[3]),
      Math.min(rect2[1], rect2[3]),
    );
    const yHigh = Math.min(
      Math.max(rect1[1], rect1[3]),
      Math.max(rect2[1], rect2[3]),
    );
    if (yLow > yHigh) return undefined;

    return [xLow, yLow, xHigh, yHigh];
  }

  static #getExtremumOnCurve(
    x0: number,
    x1: number,
    x2: number,
    x3: number,
    y0: number,
    y1: number,
    y2: number,
    y3: number,
    t: number,
    minMax: rect_t,
  ) {
    if (t <= 0 || t >= 1) {
      return;
    }
    const mt = 1 - t;
    const tt = t * t;
    const ttt = tt * t;
    const x = mt * (mt * (mt * x0 + 3 * t * x1) + 3 * tt * x2) + ttt * x3;
    const y = mt * (mt * (mt * y0 + 3 * t * y1) + 3 * tt * y2) + ttt * y3;
    minMax[0] = Math.min(minMax[0], x);
    minMax[1] = Math.min(minMax[1], y);
    minMax[2] = Math.max(minMax[2], x);
    minMax[3] = Math.max(minMax[3], y);
  }

  static #getExtremum(
    x0: number,
    x1: number,
    x2: number,
    x3: number,
    y0: number,
    y1: number,
    y2: number,
    y3: number,
    a: number,
    b: number,
    c: number,
    minMax: rect_t,
  ) {
    if (Math.abs(a) < 1e-12) {
      if (Math.abs(b) >= 1e-12) {
        this.#getExtremumOnCurve(
          x0,
          x1,
          x2,
          x3,
          y0,
          y1,
          y2,
          y3,
          -c / b,
          minMax,
        );
      }
      return;
    }

    const delta = b ** 2 - 4 * c * a;
    if (delta < 0) {
      return;
    }
    const sqrtDelta = Math.sqrt(delta);
    const a2 = 2 * a;
    this.#getExtremumOnCurve(
      x0,
      x1,
      x2,
      x3,
      y0,
      y1,
      y2,
      y3,
      (-b + sqrtDelta) / a2,
      minMax,
    );
    this.#getExtremumOnCurve(
      x0,
      x1,
      x2,
      x3,
      y0,
      y1,
      y2,
      y3,
      (-b - sqrtDelta) / a2,
      minMax,
    );
  }

  // From https://github.com/adobe-webplatform/Snap.svg/blob/b365287722a72526000ac4bfcf0ce4cac2faa015/src/path.js#L852
  static bezierBoundingBox(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    minMax?: rect_t,
  ): rect_t {
    if (minMax) {
      minMax[0] = Math.min(minMax[0], x0, x3);
      minMax[1] = Math.min(minMax[1], y0, y3);
      minMax[2] = Math.max(minMax[2], x0, x3);
      minMax[3] = Math.max(minMax[3], y0, y3);
    } else {
      minMax = [
        Math.min(x0, x3),
        Math.min(y0, y3),
        Math.max(x0, x3),
        Math.max(y0, y3),
      ];
    }
    this.#getExtremum(
      x0,
      x1,
      x2,
      x3,
      y0,
      y1,
      y2,
      y3,
      3 * (-x0 + 3 * (x1 - x2) + x3),
      6 * (x0 - 2 * x1 + x2),
      3 * (x1 - x0),
      minMax,
    );
    this.#getExtremum(
      x0,
      x1,
      x2,
      x3,
      y0,
      y1,
      y2,
      y3,
      3 * (-y0 + 3 * (y1 - y2) + y3),
      6 * (y0 - 2 * y1 + y2),
      3 * (y1 - y0),
      minMax,
    );
    return minMax;
  }
}

// deno-fmt-ignore
const PDFStringTranslateTable = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x2d8,
  0x2c7, 0x2c6, 0x2d9, 0x2dd, 0x2db, 0x2da, 0x2dc, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0x2022, 0x2020, 0x2021, 0x2026, 0x2014, 0x2013, 0x192,
  0x2044, 0x2039, 0x203a, 0x2212, 0x2030, 0x201e, 0x201c, 0x201d, 0x2018,
  0x2019, 0x201a, 0x2122, 0xfb01, 0xfb02, 0x141, 0x152, 0x160, 0x178, 0x17d,
  0x131, 0x142, 0x153, 0x161, 0x17e, 0, 0x20ac,
];

export function stringToPDFString(str: string) {
  // See section 7.9.2.2 Text String Type.
  // The string can contain some language codes bracketed with 0x0b,
  // so we must remove them.
  if (str[0] >= "\xEF") {
    let encoding;
    if (str[0] === "\xFE" && str[1] === "\xFF") {
      encoding = "utf-16be";
      if (str.length % 2 === 1) {
        str = str.slice(0, -1);
      }
    } else if (str[0] === "\xFF" && str[1] === "\xFE") {
      encoding = "utf-16le";
      if (str.length % 2 === 1) {
        str = str.slice(0, -1);
      }
    } else if (str[0] === "\xEF" && str[1] === "\xBB" && str[2] === "\xBF") {
      encoding = "utf-8";
    }

    if (encoding) {
      try {
        const decoder = new TextDecoder(encoding, { fatal: true });
        const buffer = stringToBytes(str);
        const decoded = decoder.decode(buffer);
        if (!decoded.includes("\x1b")) {
          return decoded;
        }
        return decoded.replaceAll(/\x1b[^\x1b]*(?:\x1b|$)/g, "");
      } catch (ex) {
        warn(`stringToPDFString: "${ex}".`);
      }
    }
  }
  // ISO Latin 1
  const strBuf = [];
  for (let i = 0, ii = str.length; i < ii; i++) {
    const charCode = str.charCodeAt(i);
    if (charCode === 0x1b) {
      // eslint-disable-next-line no-empty
      while (++i < ii && str.charCodeAt(i) !== 0x1b) {}
      continue;
    }
    const code = PDFStringTranslateTable[charCode];
    strBuf.push(code ? String.fromCharCode(code) : str.charAt(i));
  }
  return strBuf.join("");
}

export function stringToUTF8String(str: string) {
  return decodeURIComponent(escape(str));
}

export function utf8StringToString(str: string) {
  return unescape(encodeURIComponent(str));
}

export function getModificationDate(date = new Date()) {
  const buffer = [
    date.getUTCFullYear().toString(),
    (date.getUTCMonth() + 1).toString().padStart(2, "0"),
    date.getUTCDate().toString().padStart(2, "0"),
    date.getUTCHours().toString().padStart(2, "0"),
    date.getUTCMinutes().toString().padStart(2, "0"),
    date.getUTCSeconds().toString().padStart(2, "0"),
  ];

  return buffer.join("");
}

let NormalizeRegex: RegExp | undefined;
let NormalizationMap: Map<string, string> | undefined;
export function normalizeUnicode(str: string) {
  if (!NormalizeRegex) {
    // In order to generate the following regex:
    //  - create a PDF containing all the chars in the range 0000-FFFF with
    //    a NFKC which is different of the char.
    //  - copy and paste all those chars and get the ones where NFKC is
    //    required.
    // It appears that most the chars here contain some ligatures.
    NormalizeRegex =
      /([\u00a0\u00b5\u037e\u0eb3\u2000-\u200a\u202f\u2126\ufb00-\ufb04\ufb06\ufb20-\ufb36\ufb38-\ufb3c\ufb3e\ufb40-\ufb41\ufb43-\ufb44\ufb46-\ufba1\ufba4-\ufba9\ufbae-\ufbb1\ufbd3-\ufbdc\ufbde-\ufbe7\ufbea-\ufbf8\ufbfc-\ufbfd\ufc00-\ufc5d\ufc64-\ufcf1\ufcf5-\ufd3d\ufd88\ufdf4\ufdfa-\ufdfb\ufe71\ufe77\ufe79\ufe7b\ufe7d]+)|(\ufb05+)/gu;
    NormalizationMap = new Map([["ﬅ", "ſt"]]);
  }
  return str.replaceAll(
    NormalizeRegex,
    (_, p1, p2) => p1 ? p1.normalize("NFKC") : NormalizationMap!.get(p2),
  );
}

export function getUuid() {
  if (
    MOZCENTRAL ||
    (typeof crypto !== "undefined" && typeof crypto?.randomUUID === "function")
  ) {
    return crypto.randomUUID();
  }
  const buf = new Uint8Array(32);
  if (
    typeof crypto !== "undefined" &&
    typeof crypto?.getRandomValues === "function"
  ) {
    crypto.getRandomValues(buf);
  } else {
    for (let i = 0; i < 32; i++) {
      buf[i] = Math.floor(Math.random() * 255);
    }
  }
  return bytesToString(buf);
}

export const AnnotationPrefix = "pdfjs_internal_id_";

export const enum FontRenderOps {
  BEZIER_CURVE_TO = 0,
  MOVE_TO = 1,
  LINE_TO = 2,
  QUADRATIC_CURVE_TO = 3,
  RESTORE = 4,
  SAVE = 5,
  SCALE = 6,
  TRANSFORM = 7,
  TRANSLATE = 8,
}
/*80--------------------------------------------------------------------------*/
