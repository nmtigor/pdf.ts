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

import { CMapCompressionType } from "../shared/util.js";
/*81---------------------------------------------------------------------------*/

export interface CanvasEntry
{
  canvas:HTMLCanvasElement;
  context:CanvasRenderingContext2D;
  savedCtx?:CanvasRenderingContext2D;
}

export abstract class BaseCanvasFactory
{
  /** @final */
  create( width:number, height:number ):CanvasEntry
  {
    if (width <= 0 || height <= 0) 
    {
      throw new Error("Invalid canvas size");
    }
    const canvas = this._createCanvas(width, height);
    return {
      canvas,
      context: canvas.getContext("2d")!,
    };
  }

  /** @final */
  reset( canvasAndContext:CanvasEntry, width:number, height:number )
  {
    if (!canvasAndContext.canvas) {
      throw new Error("Canvas is not specified");
    }
    if (width <= 0 || height <= 0) {
      throw new Error("Invalid canvas size");
    }
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }

  /** @final */
  destroy( canvasAndContext:CanvasEntry )
  {
    if (!canvasAndContext.canvas) {
      throw new Error("Canvas is not specified");
    }
    // Zeroing the width and height cause Firefox to release graphics
    // resources immediately, which can greatly reduce memory consumption.
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    (<any>canvasAndContext).canvas = null;
    (<any>canvasAndContext).context = null;
  }

  /**
   * @ignore
   */
  protected abstract _createCanvas( width:number, height:number ):HTMLCanvasElement
}

interface _BaseCMapReaderFactoryCtorP
{
  baseUrl:string | undefined;
  isCompressed:boolean | undefined;
}

export interface CMapData
{
  cMapData:Uint8Array;
  compressionType:CMapCompressionType;
}
export type FetchBuiltInCMap = ( name:string ) => Promise<CMapData>;

export abstract class BaseCMapReaderFactory
{
  baseUrl;
  isCompressed;

  constructor({ baseUrl, isCompressed=false }:_BaseCMapReaderFactoryCtorP )
  {
    this.baseUrl = baseUrl;
    this.isCompressed = isCompressed;
  }

  /** @final */
  async fetch({ name }:{ name:string })
  {
    if (!this.baseUrl) 
    {
      throw new Error(
        'The CMap "baseUrl" parameter must be specified, ensure that ' +
          'the "cMapUrl" and "cMapPacked" API parameters are provided.'
      );
    }
    if (!name) 
    {
      throw new Error("CMap name must be specified.");
    }
    const url = this.baseUrl + name + (this.isCompressed ? ".bcmap" : "");
    const compressionType = this.isCompressed
      ? CMapCompressionType.BINARY
      : CMapCompressionType.NONE;

    return this._fetchData(url, compressionType).catch(reason => {
      throw new Error(
        `Unable to load ${this.isCompressed ? "binary " : ""}CMap at: ${url}`
      );
    });
  }

  /**
   * @ignore
   */
  protected abstract _fetchData( url:string, compressionType:CMapCompressionType ):Promise<CMapData>;
}

export abstract class BaseStandardFontDataFactory
{
  baseUrl;

  constructor({ baseUrl }:{ baseUrl?:string | undefined })
  {
    this.baseUrl = baseUrl;
  }

  async fetch({ filename }:{ filename:string })
  {
    if (!this.baseUrl) 
    {
      throw new Error(
        'The standard font "baseUrl" parameter must be specified, ensure that ' +
          'the "standardFontDataUrl" API parameter is provided.'
      );
    }
    if (!filename) 
    {
      throw new Error("Font filename must be specified.");
    }
    const url = `${this.baseUrl}${filename}`;

    return this._fetchData(url).catch(reason => {
      throw new Error(`Unable to load font data at: ${url}`);
    });
  }

  /**
   * @ignore
   */
  protected abstract _fetchData( url:string ):Promise<Uint8Array>;
}

export abstract class BaseSVGFactory
{
  /** @final */
  create( width:number, height:number )
  {
    if (width <= 0 || height <= 0) {
      throw new Error("Invalid SVG dimensions");
    }
    const svg = this._createSVG("svg:svg");
    svg.setAttribute("version", "1.1");
    svg.setAttribute("width", `${width}px`);
    svg.setAttribute("height", `${height}px`);
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    return svg;
  }

  /** @final */
  createElement( type:string )
  {
    if (typeof type !== "string") {
      throw new Error("Invalid SVG element type");
    }
    return this._createSVG(type);
  }

  /**
   * @ignore
   */
  protected abstract _createSVG( type:string ):SVGElement
}
/*81---------------------------------------------------------------------------*/
