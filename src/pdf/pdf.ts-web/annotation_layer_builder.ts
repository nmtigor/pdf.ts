/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
 */

/* Copyright 2014 Mozilla Foundation
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

// eslint-disable-next-line max-len
/** @typedef {import("./interfaces").IPDFAnnotationLayerFactory} IPDFAnnotationLayerFactory */

import { AnnotationLayer } from "../pdf.ts-src/pdf.js";
import { SimpleLinkService } from "./pdf_link_service.js";
import { AnnotationStorage } from "../pdf.ts-src/display/annotation_storage.js";
import { 
  type IL10n, 
  type IPDFAnnotationLayerFactory, 
  type IPDFLinkService, 
  type MouseState 
} from "./interfaces.js";
import { DownloadManager } from "./download_manager.js";
import { PageViewport } from '../pdf.ts-src/display/display_utils.js';
import { type AnnotIntent, PDFPageProxy } from '../pdf.ts-src/display/api.js';
import { NullL10n } from "./l10n_utils.js";
import { html } from "../../lib/dom.js";
import { type FieldObject } from "../pdf.ts-src/core/annotation.js";
/*81---------------------------------------------------------------------------*/

interface AnnotationLayerBuilderOptions
{
  pageDiv:HTMLDivElement;
  pdfPage:PDFPageProxy;
  annotationStorage?:AnnotationStorage | undefined;

  /**
   * Path for image resources, mainly for annotation icons. Include trailing slash.
   */
  imageResourcesPath?:string;

  renderForms:boolean;
  linkService:IPDFLinkService;
  downloadManager?:DownloadManager | undefined;

  /**
   * Localization service.
   */
  l10n:IL10n;

  enableScripting?:boolean;
  hasJSActionsPromise?:Promise<boolean> | undefined;
  fieldObjectsPromise:Promise< Record<string, FieldObject[]> | undefined > | undefined;
  mouseState?:MouseState | undefined;
}

export class AnnotationLayerBuilder
{
  pageDiv:HTMLDivElement;
  pdfPage:PDFPageProxy;
  linkService:IPDFLinkService;
  downloadManager?:DownloadManager | undefined;
  imageResourcesPath?:string;
  renderForms:boolean;
  l10n:IL10n;
  annotationStorage?:AnnotationStorage | undefined;
  enableScripting:boolean;
  _hasJSActionsPromise;
  _fieldObjectsPromise;
  _mouseState;

  div?:HTMLDivElement;
  _cancelled = false;

  constructor({
    pageDiv,
    pdfPage,
    linkService,
    downloadManager,
    annotationStorage,
    imageResourcesPath="",
    renderForms=true,
    l10n=NullL10n,
    enableScripting=false,
    hasJSActionsPromise,
    fieldObjectsPromise,
    mouseState,
  }:AnnotationLayerBuilderOptions ) 
  {
    this.pageDiv = pageDiv;
    this.pdfPage = pdfPage;
    this.linkService = linkService;
    this.downloadManager = downloadManager;
    this.imageResourcesPath = imageResourcesPath;
    this.renderForms = renderForms;
    this.l10n = l10n;
    this.annotationStorage = annotationStorage;
    this.enableScripting = enableScripting;
    this._hasJSActionsPromise = hasJSActionsPromise;
    this._fieldObjectsPromise = fieldObjectsPromise;
    this._mouseState = mouseState;
  }

  /**
   * @param viewport
   * @param intent (default value is 'display')
   * @return A promise that is resolved when rendering of the
   *   annotations is complete.
   */
  async render( viewport:PageViewport, intent:AnnotIntent="display" )
  {
    const [annotations, hasJSActions=false, fieldObjects] =
      await Promise.all([
        this.pdfPage.getAnnotations({ intent }),
        this._hasJSActionsPromise,
        this._fieldObjectsPromise,
      ]);

    if( this._cancelled || annotations.length === 0 ) return;

    const parameters = {
      viewport: viewport.clone({ dontFlip: true }),
      div: this.div!,
      annotations,
      page: this.pdfPage,
      imageResourcesPath: this.imageResourcesPath,
      renderForms: this.renderForms,
      linkService: this.linkService,
      downloadManager: this.downloadManager,
      annotationStorage: this.annotationStorage,
      enableScripting: this.enableScripting,
      hasJSActions,
      fieldObjects,
      mouseState: this._mouseState,
    };

    if( this.div )
    {
      // If an annotationLayer already exists, refresh its children's
      // transformation matrices.
      AnnotationLayer.update( parameters );
    } 
    else {
      // Create an annotation layer div and render the annotations
      // if there is at least one annotation.
      this.div = html("div");
      this.div.className = "annotationLayer";
      this.pageDiv.appendChild(this.div);
      parameters.div = this.div;

      AnnotationLayer.render( parameters );
      this.l10n.translate(this.div);
    }
  }

  cancel() {
    this._cancelled = true;
  }

  hide()
  {
    if( !this.div ) return;

    this.div.hidden = true;
  }
}

export class DefaultAnnotationLayerFactory implements IPDFAnnotationLayerFactory
{
  /** @implements */
  createAnnotationLayerBuilder(
    pageDiv:HTMLDivElement,
    pdfPage:PDFPageProxy,
    annotationStorage?:AnnotationStorage,
    imageResourcesPath="",
    renderForms=true,
    l10n=NullL10n,
    enableScripting=false,
    hasJSActionsPromise?:Promise<boolean>,
    mouseState?:MouseState,
    fieldObjectsPromise?:Promise< Record<string, FieldObject[]> | undefined >,
  ) {
    return new AnnotationLayerBuilder({
      pageDiv,
      pdfPage,
      imageResourcesPath,
      renderForms,
      linkService: new SimpleLinkService(),
      l10n,
      annotationStorage,
      enableScripting,
      hasJSActionsPromise,
      fieldObjectsPromise,
      mouseState,
    });
  }
}
/*81---------------------------------------------------------------------------*/
