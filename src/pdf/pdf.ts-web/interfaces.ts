/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

/* Copyright 2018 Mozilla Foundation
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
/* eslint-disable getter-return */

/** @typedef {import("../src/display/api").PDFPageProxy} PDFPageProxy */
// eslint-disable-next-line max-len
/** @typedef {import("../src/display/display_utils").PageViewport} PageViewport */
// eslint-disable-next-line max-len
/** @typedef {import("./annotation_layer_builder").AnnotationLayerBuilder} AnnotationLayerBuilder */
/** @typedef {import("./event_utils").EventBus} EventBus */
// eslint-disable-next-line max-len
/** @typedef {import("./struct_tree_builder").StructTreeLayerBuilder} StructTreeLayerBuilder */
/** @typedef {import("./text_highlighter").TextHighlighter} TextHighlighter */
// eslint-disable-next-line max-len
/** @typedef {import("./text_layer_builder").TextLayerBuilder} TextLayerBuilder */
/** @typedef {import("./ui_utils").RenderingStates} RenderingStates */
/** @typedef {import("./xfa_layer_builder").XfaLayerBuilder} XfaLayerBuilder */

import { LinkTarget, PageViewport } from "../pdf.ts-src/display/display_utils.js";
import { AnnotationStorage } from "../pdf.ts-src/display/annotation_storage.js";
import { TextLayerBuilder } from "./text_layer_builder.js";
import { AnnotationLayerBuilder } from "./annotation_layer_builder.js";
import { PDFPageProxy, type RefProxy } from "../pdf.ts-src/display/api.js";
import { type Locale_1, type WebL10nArgs } from "../../lib/l10n.js";
import { XfaLayerBuilder } from "./xfa_layer_builder.js";
import { type Destination, type ExplicitDest } from "../pdf.ts-src/core/catalog.js";
import { StructTreeLayerBuilder } from "./struct_tree_layer_builder.js";
import { type XFAElData } from "../pdf.ts-src/core/xfa/alias.js";
import { TextHighlighter } from "./text_highlighter.js";
import { type FieldObject } from "../pdf.ts-src/core/annotation.js";
import { EventBus } from "./event_utils.js";
import { RenderingStates } from "./ui_utils.js";
/*81---------------------------------------------------------------------------*/

export interface IPDFLinkService 
{
  readonly pagesCount:number;

  page:number;

  rotation:number;

  externalLinkTarget:LinkTarget | undefined;

  externalLinkRel:string | undefined

  externalLinkEnabled:boolean;

  /**
   * @param dest The named, or explicit, PDF destination.
   */
  goToDestination( dest:Destination ):Promise<void>;

  /**
   * @param val The page number, or page label.
   */
  goToPage( val:number | string ):void;

  /**
   * @param newWindow=false 
   */
  addLinkAttributes( link:HTMLAnchorElement, url:string, newWindow?:boolean):void;

  /**
   * @param dest The PDF destination object.
   * @return The hyperlink to the PDF object.
   */
  getDestinationHash( dest?:Destination ):string;

  /**
   * @param hash The PDF parameters/hash.
   * @return The hyperlink to the PDF object.
   */
  getAnchorUrl( hash:string ):string;

  setHash( hash:string ):void;

  executeNamedAction( action:string ):void;

  /**
   * @param pageNum page number.
   * @param pageRef reference to the page.
   */
  cachePageRef( pageNum:number, pageRef:RefProxy | undefined ):void;
  
  _cachedPageNumber( pageRef:RefProxy | undefined ):number | undefined;

  isPageVisible( pageNumber:number ):boolean;

  isPageCached( pageNumber:number ):boolean;

  eventBus?:EventBus;
}

export interface HistoryInitParms
{
  /**
   * The PDF document's unique fingerprint.
   */
  fingerprint:string;

  /**
   * Reset the browsing history.
   */
  resetHistory?:boolean;

  /**
   * Attempt to update the document URL, with
   * the current hash, when pushing/replacing browser history entries.
   */
  updateUrl:boolean | undefined;
}

export interface HistoryPushParms
{
  /**
   * The named destination. If absent, a
   * stringified version of `explicitDest` is used.
   */
  namedDest:string | undefined;

  /**
   * The explicit destination array.
   */
  explicitDest:ExplicitDest;

  /**
   * The page to which the destination points.
   */
  pageNumber?:number;
}

export interface IRenderableView 
{
  /**
   * Unique ID for rendering queue.
   */
  readonly renderingId:string;

  renderingState:RenderingStates;

  /**
   * @return Resolved on draw completion.
   */
  draw():Promise<void>;

  resume?():void;
}

export interface IVisibleView extends IRenderableView
{
  readonly id:number;
  
  readonly div:HTMLDivElement;
}

export interface IPDFTextLayerFactory 
{
  /**
   * @param enhanceTextSelection=false 
   */
  createTextLayerBuilder(
    textLayerDiv:HTMLDivElement,
    pageIndex:number,
    viewport:PageViewport,
    enhanceTextSelection:boolean,
    eventBus:EventBus,
    highlighter:TextHighlighter | undefined,
  ):TextLayerBuilder;
}


export interface MouseState
{
  isDown?:boolean;
}

export interface IPDFAnnotationLayerFactory 
{
  /**
   * @param annotationStorage Storage for annotation data in forms.
   * @param imageResourcesPath="" Path for image resources, mainly
   *   for annotation icons. Include trailing slash.
   * @param renderForms=true
   * @param annotationCanvasMap Map some
   *   annotation ids with canvases used to render them.
   */
  createAnnotationLayerBuilder(
    pageDiv:HTMLDivElement,
    pdfPage:PDFPageProxy,
    annotationStorage?:AnnotationStorage,
    imageResourcesPath?:string,
    renderForms?:boolean,
    l10n?:IL10n,
    enableScripting?:boolean,
    hasJSActionsPromise?:Promise<boolean>,
    mouseState?:MouseState,
    fieldObjectsPromise?:Promise<Record<string, FieldObject[]> | undefined>,
    annotationCanvasMap?:Map<string, HTMLCanvasElement>
  ):AnnotationLayerBuilder;
}

export interface IPDFXfaLayerFactory
{
  createXfaLayerBuilder( 
    pageDiv:HTMLDivElement, 
    pdfPage:PDFPageProxy,
    annotationStorage?:AnnotationStorage,
    xfaHtml?:XFAElData,
  ):XfaLayerBuilder;
}

export interface  IPDFStructTreeLayerFactory
{
  createStructTreeLayerBuilder( pdfPage:PDFPageProxy ):StructTreeLayerBuilder;
}

export interface IDownloadManager 
{
  downloadUrl( url:string, filename:string ):void;

  downloadData( data:Uint8Array, filename:string, contentType:string ):void;

  /**
   * @return Indicating if the data was opened.
   */
  openOrDownloadData( element:HTMLElement, 
    data:Uint8Array | Uint8ClampedArray | undefined, filename:string ):boolean;

  /**
   * @param sourceEventType="download"
   */
  download( blob:Blob, url:string, filename:string, sourceEventType?:string ):void;
}

export interface IL10n 
{
  getLanguage():Promise<Lowercase<Locale_1> | "">;

  getDirection():Promise<"rtl"|"ltr">;

  /**
   * Translates text identified by the key and adds/formats data using the args
   * property bag. If the key was not found, translation falls back to the
   * fallback text.
   */
  get( key:string, args?:WebL10nArgs, fallback?:string ):Promise<string>;

  /**
   * Translates HTML element.
   */
  translate( element:HTMLElement ):Promise<void>;
}

export abstract class IScripting
{
  abstract createSandbox( data:unknown ):Promise<void>;

  abstract dispatchEventInSandbox( event:unknown ):Promise<void>;

  abstract destroySandbox():Promise<void>;
}
/*81---------------------------------------------------------------------------*/
