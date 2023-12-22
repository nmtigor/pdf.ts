/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
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

import type { C2D, dot2d_t, rect_t, uint } from "@fe-lib/alias.ts";
import type { red_t, rgb_t } from "@fe-lib/color/alias.ts";
import { div as createDiv, html, svg as createSVG } from "@fe-lib/dom.ts";
import { MOZCENTRAL } from "@fe-src/global.ts";
import type { XFAElObj } from "../core/xfa/alias.ts";
import type { matrix_t } from "../shared/util.ts";
import {
  BaseException,
  CMapCompressionType,
  FeatureTest,
  shadow,
  stringToBytes,
  Util,
  warn,
} from "../shared/util.ts";
import {
  BaseCanvasFactory,
  BaseCMapReaderFactory,
  BaseFilterFactory,
  BaseStandardFontDataFactory,
  BaseSVGFactory,
} from "./base_factory.ts";
/*80--------------------------------------------------------------------------*/

const SVG_NS = "http://www.w3.org/2000/svg";

export class PixelsPerInch {
  static CSS = 96.0;

  static PDF = 72.0;

  static PDF_TO_CSS_UNITS = this.CSS / this.PDF;
}

type DOMFilterFactoryCtorP_ = {
  docId?: string;
  ownerDocument?: Document;
};

/**
 * FilterFactory aims to create some SVG filters we can use when drawing an
 * image (or whatever) on a canvas.
 * Filters aren't applied with ctx.putImageData because it just overwrites the
 * underlying pixels.
 * With these filters, it's possible for example to apply some transfer maps on
 * an image without the need to apply them on the pixel arrays: the renderer
 * does the magic for us.
 */
export class DOMFilterFactory extends BaseFilterFactory {
  #_cache: Map<number[][] | string, string> | undefined;
  #_defs: SVGDefsElement | undefined;
  #docId;
  #document;
  #hcmFilter: SVGFilterElement | undefined;
  #hcmKey: string | undefined;
  #hcmUrl: string | undefined;
  #hcmHighlightFilter?: SVGFilterElement;
  #hcmHighlightKey?: string;
  #hcmHighlightUrl?: string;
  #id = 0;

  constructor(
    { docId, ownerDocument = globalThis.document }: DOMFilterFactoryCtorP_ = {},
  ) {
    super();
    this.#docId = docId;
    this.#document = ownerDocument;
  }

  get #cache() {
    return (this.#_cache ||= new Map<number[][] | string, string>());
  }

  get #defs() {
    if (!this.#_defs) {
      const div = createDiv(undefined, this.#document);
      div.assignStylo({
        visibility: "hidden",
        contain: "strict",
        width: 0,
        height: 0,
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: -1,
      });

      const svg = createSVG("svg", this.#document);
      svg.assignAttro({
        width: 0,
        height: 0,
      });
      this.#_defs = createSVG("defs", this.#document);
      div.append(svg);
      svg.append(this.#_defs);
      this.#document.body.append(div);
    }
    return this.#_defs;
  }

  override addFilter(maps?: number[][]): string {
    if (!maps) {
      return "none";
    }

    // When a page is zoomed the page is re-drawn but the maps are likely
    // the same.
    let value = this.#cache.get(maps);
    if (value) {
      return value;
    }

    let tableR, tableG, tableB, key: string;
    if (maps.length === 1) {
      const mapR = maps[0];
      const buffer = new Array(256);
      for (let i = 0; i < 256; i++) {
        buffer[i] = mapR[i] / 255;
      }
      key =
        tableR =
        tableG =
        tableB =
          buffer.join(",");
    } else {
      const [mapR, mapG, mapB] = maps;
      const bufferR = new Array(256);
      const bufferG = new Array(256);
      const bufferB = new Array(256);
      for (let i = 0; i < 256; i++) {
        bufferR[i] = mapR[i] / 255;
        bufferG[i] = mapG[i] / 255;
        bufferB[i] = mapB[i] / 255;
      }
      tableR = bufferR.join(",");
      tableG = bufferG.join(",");
      tableB = bufferB.join(",");
      key = `${tableR}${tableG}${tableB}`;
    }

    value = this.#cache.get(key);
    if (value) {
      this.#cache.set(maps, value);
      return value;
    }

    // We create a SVG filter: feComponentTransferElement
    //  https://www.w3.org/TR/SVG11/filters.html#feComponentTransferElement

    const id = `g_${this.#docId}_transfer_map_${this.#id++}`;
    const url = `url(#${id})`;
    this.#cache.set(maps, url);
    this.#cache.set(key, url);

    const filter = this.#createFilter(id);
    this.#addTransferMapConversion(tableR, tableG, tableB, filter);

    return url;
  }

  override addHCMFilter(fgColor: string, bgColor: string): string {
    const key = `${fgColor}-${bgColor}`;
    if (this.#hcmKey === key) {
      return this.#hcmUrl!;
    }

    this.#hcmKey = key;
    this.#hcmUrl = "none";
    this.#hcmFilter?.remove();

    if (!fgColor || !bgColor) {
      return this.#hcmUrl!;
    }

    const fgRGB = this.#getRGB(fgColor);
    fgColor = Util.makeHexColor(...fgRGB);
    const bgRGB = this.#getRGB(bgColor);
    bgColor = Util.makeHexColor(...bgRGB);
    this.#defs.style.color = "";

    if (
      (fgColor === "#000000" && bgColor === "#ffffff") ||
      fgColor === bgColor
    ) {
      return this.#hcmUrl;
    }

    // https://developer.mozilla.org/en-US/docs/Web/Accessibility/Understanding_Colors_and_Luminance
    //
    // Relative luminance:
    // https://www.w3.org/TR/WCAG20/#relativeluminancedef
    //
    // We compute the rounded luminance of the default background color.
    // Then for every color in the pdf, if its rounded luminance is the
    // same as the background one then it's replaced by the new
    // background color else by the foreground one.
    const map = new Array(256);
    for (let i = 0; i <= 255; i++) {
      const x = i / 255;
      map[i] = x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    }
    const table = map.join(",");

    const id = `g_${this.#docId}_hcm_filter`;
    const filter = (this.#hcmHighlightFilter = this.#createFilter(id));
    this.#addTransferMapConversion(table, table, table, filter);
    this.#addGrayConversion(filter);

    const getSteps = (c: uint, n: uint) => {
      const start = fgRGB[c] / 255;
      const end = bgRGB[c] / 255;
      const arr = new Array(n + 1);
      for (let i = 0; i <= n; i++) {
        arr[i] = start + (i / n) * (end - start);
      }
      return arr.join(",");
    };
    this.#addTransferMapConversion(
      getSteps(0, 5),
      getSteps(1, 5),
      getSteps(2, 5),
      filter,
    );

    this.#hcmUrl = `url(#${id})`;
    return this.#hcmUrl;
  }

  override addHighlightHCMFilter(
    fgColor: string,
    bgColor: string,
    newFgColor: string,
    newBgColor: string,
  ): string {
    const key = `${fgColor}-${bgColor}-${newFgColor}-${newBgColor}`;
    if (this.#hcmHighlightKey === key) {
      return this.#hcmHighlightUrl!;
    }

    this.#hcmHighlightKey = key;
    this.#hcmHighlightUrl = "none";
    this.#hcmHighlightFilter?.remove();

    if (!fgColor || !bgColor) {
      return this.#hcmHighlightUrl;
    }

    const [fgRGB, bgRGB] = [fgColor, bgColor].map(this.#getRGB.bind(this));
    let fgGray = Math.round(
      0.2126 * fgRGB[0] + 0.7152 * fgRGB[1] + 0.0722 * fgRGB[2],
    );
    let bgGray = Math.round(
      0.2126 * bgRGB[0] + 0.7152 * bgRGB[1] + 0.0722 * bgRGB[2],
    );
    let [newFgRGB, newBgRGB] = [newFgColor, newBgColor].map(
      this.#getRGB.bind(this),
    );
    if (bgGray < fgGray) {
      [fgGray, bgGray, newFgRGB, newBgRGB] = [
        bgGray,
        fgGray,
        newBgRGB,
        newFgRGB,
      ];
    }
    this.#defs.style.color = "";

    // Now we can create the filters to highlight some canvas parts.
    // The colors in the pdf will almost be Canvas and CanvasText, hence we
    // want to filter them to finally get Highlight and HighlightText.
    // Since we're in HCM the background color and the foreground color should
    // be really different when converted to grayscale (if they're not then it
    // means that we've a poor contrast). Once the canvas colors are converted
    // to grayscale we can easily map them on their new colors.
    // The grayscale step is important because if we've something like:
    //   fgColor = #FF....
    //   bgColor = #FF....
    //   then we are enable to map the red component on the new red components
    //   which can be different.

    const getSteps = (fg: red_t, bg: red_t, n: uint) => {
      const arr = new Array(256);
      const step = (bgGray - fgGray) / n;
      const newStart = fg / 255;
      const newStep = (bg - fg) / (255 * n);
      let prev = 0;
      for (let i = 0; i <= n; i++) {
        const k = Math.round(fgGray + i * step);
        const value = newStart + i * newStep;
        for (let j = prev; j <= k; j++) {
          arr[j] = value;
        }
        prev = k + 1;
      }
      for (let i = prev; i < 256; i++) {
        arr[i] = arr[prev - 1];
      }
      return arr.join(",");
    };

    const id = `g_${this.#docId}_hcm_highlight_filter`;
    const filter = (this.#hcmHighlightFilter = this.#createFilter(id));

    this.#addGrayConversion(filter);
    this.#addTransferMapConversion(
      getSteps(newFgRGB[0], newBgRGB[0], 5),
      getSteps(newFgRGB[1], newBgRGB[1], 5),
      getSteps(newFgRGB[2], newBgRGB[2], 5),
      filter,
    );

    this.#hcmHighlightUrl = `url(#${id})`;
    return this.#hcmHighlightUrl;
  }

  override destroy(keepHCM = false) {
    if (keepHCM && (this.#hcmUrl || this.#hcmHighlightUrl)) {
      return;
    }
    if (this.#_defs) {
      (this.#_defs.parentNode!.parentNode as Element).remove();
      this.#_defs = undefined;
    }
    if (this.#_cache) {
      this.#_cache.clear();
      this.#_cache = undefined;
    }
    this.#id = 0;
  }

  #addGrayConversion(filter: SVGFilterElement) {
    const feColorMatrix = createSVG("feColorMatrix", this.#document);
    feColorMatrix.assignAttro({
      typs: "matrix",
      values:
        "0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0",
    });
    filter.append(feColorMatrix);
  }

  #createFilter(id: string) {
    const filter = createSVG("filter", this.#document);
    filter.assignAttro({
      "color-interpolation-filters": "sRGB",
      id,
    });
    this.#defs.append(filter);

    return filter;
  }

  #appendFeFunc(
    feComponentTransfer: SVGFEComponentTransferElement,
    func: "feFuncR" | "feFuncG" | "feFuncB",
    table: string,
  ) {
    const feFunc = createSVG(func, this.#document);
    feFunc.assignAttro({
      type: "discrete",
      tableValues: table,
    });
    feComponentTransfer.append(feFunc);
  }

  #addTransferMapConversion(
    rTable: string,
    gTable: string,
    bTable: string,
    filter: SVGFilterElement,
  ) {
    const feComponentTransfer = createSVG(
      "feComponentTransfer",
      this.#document,
    );
    filter.append(feComponentTransfer);
    this.#appendFeFunc(feComponentTransfer, "feFuncR", rTable);
    this.#appendFeFunc(feComponentTransfer, "feFuncG", gTable);
    this.#appendFeFunc(feComponentTransfer, "feFuncB", bTable);
  }

  #getRGB(color: string) {
    this.#defs.style.color = color;
    return getRGB(getComputedStyle(this.#defs).getPropertyValue("color"));
  }
}

export class DOMCanvasFactory extends BaseCanvasFactory {
  _document: Document;

  constructor({ ownerDocument = globalThis.document } = {}) {
    super();

    this._document = ownerDocument;
  }

  /**
   * @ignore
   * @implement
   */
  _createCanvas(width: number, height: number) {
    const canvas = html("canvas", undefined, this._document);
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
}

export async function fetchData(
  url: string | URL,
  type: "arraybuffer" | "blob" | "json" | "text" = "text",
) {
  if (MOZCENTRAL || isValidFetchUrl(url, globalThis.document?.baseURI)) {
    const response = await fetch(url);
    if (!response.ok) {
      response.body?.cancel();
      throw new Error(response.statusText);
    }
    // switch (type) {
    //   case "arraybuffer":
    //     return response.arrayBuffer();
    //   case "blob":
    //     return response.blob();
    //   case "json":
    //     return response.json();
    // }
    // return response.text();
    return /* final switch */ {
      arraybuffer: () => response.arrayBuffer(),
      blob: () => response.blob(),
      json: () => response.json(),
      text: () => response.text(),
    }[type]();
  }

  // The Fetch API is not supported.
  return new Promise<Uint8Array>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("GET", url, /* async = */ true);
    request.responseType = type;

    request.onreadystatechange = () => {
      if (request.readyState !== XMLHttpRequest.DONE) return;

      if (request.status === 200 || request.status === 0) {
        let data;
        switch (type) {
          case "arraybuffer":
          case "blob":
          case "json":
            data = request.response;
            break;
          default:
            data = request.responseText;
            break;
        }
        if (data) {
          resolve(data);
          return;
        }
      }
      reject(new Error(request.statusText));
    };

    request.send(null);
  });
}

export class DOMCMapReaderFactory extends BaseCMapReaderFactory {
  /**
   * @ignore
   * @implement
   */
  _fetchData(url: string, compressionType: CMapCompressionType) {
    return fetchData(
      url,
      /* type = */ this.isCompressed ? "arraybuffer" : "text",
    ).then((data) => {
      return {
        cMapData: data instanceof ArrayBuffer
          ? new Uint8Array(data)
          : stringToBytes(data),
        compressionType,
      };
    });
  }
}

export class DOMStandardFontDataFactory extends BaseStandardFontDataFactory {
  /**
   * @ignore
   * @implement
   */
  _fetchData(url: string) {
    return fetchData(url, /* type = */ "arraybuffer").then((data) => {
      return new Uint8Array(data);
    });
  }
}

export class DOMSVGFactory extends BaseSVGFactory {
  /**
   * @ignore
   * @implement
   */
  _createSVG(type: keyof SVGElementTagNameMap) {
    return document.createElementNS(SVG_NS, type);
  }
}

interface PageViewportP_ {
  /**
   * The xMin, yMin, xMax and yMax coordinates.
   */
  viewBox: rect_t;

  /**
   * The scale of the viewport.
   */
  scale: number;

  /**
   * The rotation, in degrees, of the viewport.
   */
  rotation: number;

  /**
   * The horizontal, i.e. x-axis, offset.
   * The default value is `0`.
   */
  offsetX?: number;

  /**
   * The vertical, i.e. y-axis, offset.
   * The default value is `0`.
   */
  offsetY?: number;

  /**
   * If true, the y-axis will not be flipped.
   * The default value is `false`.
   */
  dontFlip?: boolean;
}

interface PageViewportCloneP_ {
  /**
   * The scale, overriding the one in the cloned
   * viewport. The default value is `this.scale`.
   */
  scale?: number;

  /**
   * The rotation, in degrees, overriding the one
   * in the cloned viewport. The default value is `this.rotation`.
   */
  rotation?: number;

  /**
   * The horizontal, i.e. x-axis, offset.
   * The default value is `this.offsetX`.
   */
  offsetX?: number;

  /**
   * The vertical, i.e. y-axis, offset.
   * The default value is `this.offsetY`.
   */
  offsetY?: number;

  /**
   * If true, the x-axis will not be flipped.
   * The default value is `false`.
   */
  dontFlip?: boolean;
}

/**
 * PDF page viewport created based on scale, rotation and offset.
 */
export class PageViewport {
  /**
   * In PDF unit.
   */
  viewBox: rect_t;

  /**
   * To CSS unit.
   */
  scale: number;

  rotation: number;

  /**
   * In CSS unit.
   */
  offsetX: number;
  offsetY: number;

  transform: matrix_t;

  width: number;
  height: number;

  constructor({
    viewBox,
    scale,
    rotation,
    offsetX = 0,
    offsetY = 0,
    dontFlip = false,
  }: PageViewportP_) {
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
    if (rotation < 0) rotation += 360;
    switch (rotation) // clockwise, with flip first
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
          "PageViewport: Invalid rotation, must be a multiple of 90 degrees.",
        );
    }

    if (dontFlip) {
      rotateC = -rotateC;
      rotateD = -rotateD;
    }

    let offsetCanvasX, offsetCanvasY;
    let width, height;
    if (rotateA === 0) {
      offsetCanvasX = Math.abs(centerY - viewBox[1]) * scale + offsetX;
      offsetCanvasY = Math.abs(centerX - viewBox[0]) * scale + offsetY;
      width = (viewBox[3] - viewBox[1]) * scale;
      height = (viewBox[2] - viewBox[0]) * scale;
    } else {
      offsetCanvasX = Math.abs(centerX - viewBox[0]) * scale + offsetX;
      offsetCanvasY = Math.abs(centerY - viewBox[1]) * scale + offsetY;
      width = (viewBox[2] - viewBox[0]) * scale;
      height = (viewBox[3] - viewBox[1]) * scale;
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
   * The original, un-scaled, viewport dimensions.
   * @type {Object}
   */
  get rawDims() {
    const { viewBox } = this;
    return shadow(this, "rawDims", {
      pageWidth: viewBox[2] - viewBox[0],
      pageHeight: viewBox[3] - viewBox[1],
      pageX: viewBox[0],
      pageY: viewBox[1],
    });
  }

  /**
   * Clones viewport, with optional additional properties.
   * @return Cloned viewport.
   */
  clone({
    scale = this.scale,
    rotation = this.rotation,
    offsetX = this.offsetX,
    offsetY = this.offsetY,
    dontFlip = false,
  }: PageViewportCloneP_ = {}): PageViewport {
    return new PageViewport({
      viewBox: <rect_t> this.viewBox.slice(),
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
   * @return Array containing `x`- and `y`-coordinates of the
   *   point in the viewport coordinate space.
   * @see {@link convertToPdfPoint}
   * @see {@link convertToViewportRectangle}
   */
  convertToViewportPoint(x: number, y: number): dot2d_t {
    return Util.applyTransform([x, y], this.transform);
  }

  /**
   * Converts PDF rectangle to the viewport coordinates.
   * @param rect The xMin, yMin, xMax and yMax coordinates.
   * @return Array containing corresponding coordinates of the
   *   rectangle in the viewport coordinate space.
   * @see {@link convertToViewportPoint}
   */
  convertToViewportRectangle(rect: rect_t): rect_t {
    const topLeft = Util.applyTransform([rect[0], rect[1]], this.transform);
    const bottomRight = Util.applyTransform([rect[2], rect[3]], this.transform);
    return [topLeft[0], topLeft[1], bottomRight[0], bottomRight[1]];
  }

  /**
   * Converts viewport coordinates to the PDF location. For examples, useful
   * for converting canvas pixel location into PDF one.
   * @param x The x-coordinate.
   * @param y The y-coordinate.
   * @return Array containing `x`- and `y`-coordinates of the
   *   point in the PDF coordinate space.
   * @see {@link convertToViewportPoint}
   */
  convertToPdfPoint(x: number, y: number): dot2d_t {
    return Util.applyInverseTransform([x, y], this.transform);
  }
}

export class RenderingCancelledException extends BaseException {
  constructor(msg: string, public extraDelay = 0) {
    super(msg, "RenderingCancelledException");
  }
}

export function isDataScheme(url: string) {
  const ii = url.length;
  let i = 0;
  while (i < ii && url[i].trim() === "") {
    i++;
  }
  return url.substring(i, i + 5).toLowerCase() === "data:";
}

export function isPdfFile(filename: unknown) {
  return typeof filename === "string" && /\.pdf$/i.test(filename);
}

/**
 * Gets the filename from a given URL.
 */
export function getFilenameFromUrl(url: string, onlyStripPath = false): string {
  if (!onlyStripPath) {
    [url] = url.split(/[#?]/, 1);
  }
  return url.substring(url.lastIndexOf("/") + 1);
}

/**
 * Returns the filename or guessed filename from the url (see issue 3455).
 * @param url The original PDF location.
 * @param defaultFilename The value returned if the filename is
 *   unknown, or the protocol is unsupported.
 * @return Guessed PDF filename.
 */
export function getPdfFilenameFromUrl(
  url: unknown,
  defaultFilename = "document.pdf",
) {
  if (typeof url !== "string") return defaultFilename;

  if (isDataScheme(url)) {
    warn('getPdfFilenameFromUrl: ignore "data:"-URL for performance reasons.');
    return defaultFilename;
  }
  const reURI = /^(?:(?:[^:]+:)?\/\/[^/]+)?([^?#]*)(\?[^#]*)?(#.*)?$/;
  //              SCHEME        HOST        1.PATH  2.QUERY   3.REF
  // Pattern to get last matching NAME.pdf
  const reFilename = /[^/?#=]+\.pdf\b(?!.*\.pdf\b)/i;
  const splitURI = reURI.exec(url);
  let suggestedFilename: RegExpExecArray | string | null =
    reFilename.exec(splitURI![1]) ||
    reFilename.exec(splitURI![2]) ||
    reFilename.exec(splitURI![3]);
  if (suggestedFilename) {
    suggestedFilename = suggestedFilename[0];
    if (suggestedFilename.includes("%")) {
      // URL-encoded %2Fpath%2Fto%2Ffile.pdf should be file.pdf
      try {
        suggestedFilename = reFilename.exec(
          decodeURIComponent(suggestedFilename),
        )![0];
      } catch {
        // Possible (extremely rare) errors:
        // URIError "Malformed URI", e.g. for "%AA.pdf"
        // TypeError "null has no properties", e.g. for "%2F.pdf"
      }
    }
  }
  return suggestedFilename || defaultFilename;
}

interface StatTime {
  name: string;
  start: number;
  end: number;
}

export class StatTimer {
  started = Object.create(null);
  times: StatTime[] = [];

  time(name: string) {
    if (name in this.started) {
      warn(`Timer is already running for ${name}`);
    }
    this.started[name] = Date.now();
  }

  timeEnd(name: string) {
    if (!(name in this.started)) {
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

  toString() {
    // Find the longest name for padding purposes.
    const outBuf = [];
    let longest = 0;
    for (const { name } of this.times) {
      longest = Math.max(name.length, longest);
    }
    for (const { name, start, end } of this.times) {
      outBuf.push(`${name.padEnd(longest)} ${end - start}ms\n`);
    }
    return outBuf.join("");
  }
}

export function isValidFetchUrl(
  url: string | URL | undefined,
  baseUrl?: string | URL,
) {
  /*#static*/ if (MOZCENTRAL) {
    throw new Error("Not implemented: isValidFetchUrl");
  }
  try {
    const { protocol } = baseUrl ? new URL(url!, baseUrl) : new URL(url!);
    // The Fetch API only supports the http/https protocols, and not file/ftp.
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false; // `new URL()` will throw on incorrect data.
  }
}

// export function loadScript(src: string, removeScriptElement = false) {
//   return new Promise<Event>((resolve, reject) => {
//     const script = html("script");
//     script.src = src;

//     script.onload = (evt: Event) => {
//       if (removeScriptElement) {
//         script.remove();
//       }
//       resolve(evt);
//     };
//     script.onerror = () => {
//       reject(new Error(`Cannot load script at: ${script.src}`));
//     };
//     (document.head || document.documentElement).append(script);
//   });
// }

// Deprecated API function -- display regardless of the `verbosity` setting.
export function deprecated(details: string) {
  console.log("Deprecated API usage: " + details);
}

let pdfDateStringRegex: RegExp;

export class PDFDateString {
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
  static toDateObject(input: string | undefined): Date | undefined {
    if (!input || !(typeof input === "string")) return undefined;

    // Lazily initialize the regular expression.
    pdfDateStringRegex ||= new RegExp(
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
        "'?", // Trailing apostrophe (optional)
    );

    // Optional fields that don't satisfy the requirements from the regular
    // expression (such as incorrect digit counts or numbers that are out of
    // range) will fall back the defaults from the specification.
    const matches = pdfDateStringRegex.exec(input);
    if (!matches) {
      return undefined;
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
    } else if (universalTimeRelation === "+") {
      hour -= offsetHour;
      minute -= offsetMinute;
    }

    return new Date(Date.UTC(year, month, day, hour, minute, second));
  }
}

/**
 * NOTE: This is (mostly) intended to support printing of XFA forms.
 */
export function getXfaPageViewport(
  xfaPage: XFAElObj,
  { scale = 1, rotation = 0 },
) {
  const { width, height } = <{ width: string; height: string }> xfaPage
    .attributes!.style;
  const viewBox: rect_t = [0, 0, parseInt(width), parseInt(height)];

  return new PageViewport({
    viewBox,
    scale,
    rotation,
  });
}

export function getRGB(color: string): rgb_t {
  if (color.startsWith("#")) {
    const colorRGB = parseInt(color.slice(1), 16);
    return [
      (colorRGB & 0xff0000) >> 16,
      (colorRGB & 0x00ff00) >> 8,
      colorRGB & 0x0000ff,
    ];
  }

  if (color.startsWith("rgb(")) {
    // getComputedStyle(...).color returns a `rgb(R, G, B)` color.
    return color
      .slice(/* "rgb(".length */ 4, -1) // Strip out "rgb(" and ")".
      .split(",")
      .map((x) => parseInt(x)) as rgb_t;
  }

  if (color.startsWith("rgba(")) {
    return color
      .slice(/* "rgba(".length */ 5, -1) // Strip out "rgba(" and ")".
      .split(",")
      .map((x) => parseInt(x))
      .slice(0, 3) as rgb_t;
  }

  warn(`Not a valid color format: "${color}"`);
  return [0, 0, 0];
}

export function getColorValues(colors: Map<string, rgb_t | undefined>) {
  const span = html("span");
  span.style.visibility = "hidden";
  document.body.append(span);
  for (const name of colors.keys()) {
    span.style.color = name;
    const computedColor = window.getComputedStyle(span).color;
    colors.set(name, getRGB(computedColor));
  }
  span.remove();
}

export function getCurrentTransform(ctx: C2D): matrix_t {
  const { a, b, c, d, e, f } = ctx.getTransform();
  return [a, b, c, d, e, f];
}

export function getCurrentTransformInverse(ctx: C2D): matrix_t {
  const { a, b, c, d, e, f } = ctx.getTransform().invertSelf();
  return [a, b, c, d, e, f];
}

export function setLayerDimensions(
  div: HTMLElement,
  viewport: PageViewport | { rotation: number },
  mustFlip = false,
  mustRotate = true,
) {
  if (viewport instanceof PageViewport) {
    const { pageWidth, pageHeight } = viewport.rawDims;
    const { style } = div;
    const useRound = FeatureTest.isCSSRoundSupported;

    const w = `var(--scale-factor) * ${pageWidth}px`,
      h = `var(--scale-factor) * ${pageHeight}px`;
    const widthStr = useRound ? `round(${w}, 1px)` : `calc(${w})`,
      heightStr = useRound ? `round(${h}, 1px)` : `calc(${h})`;

    if (!mustFlip || viewport.rotation % 180 === 0) {
      style.width = widthStr;
      style.height = heightStr;
    } else {
      style.width = heightStr;
      style.height = widthStr;
    }
  }

  if (mustRotate) {
    div.setAttribute("data-main-rotation", viewport.rotation as any);
  }
}
/*80--------------------------------------------------------------------------*/
