/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

/* Copyright 2021 Mozilla Foundation
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

/** @typedef {import("./event_utils").EventBus} EventBus */

import { createPromiseCap, PromiseCap } from "../../lib/promisecap.js";
import { PDFDocumentProxy } from "../pdf.ts-src/display/api.js";
import { shadow } from "../pdf.ts-src/shared/util.js";
import { DefaultExternalServices, type ScriptingDocProperties } from "./app.js";
import { EventBus, EventMap } from "./event_utils.js";
import { IScripting, type MouseState } from "./interfaces.js";
import { PDFViewer } from "./pdf_viewer.js";
import { apiPageLayoutToViewerModes, PageLayout, RenderingStates } from "./ui_utils.js";
/*81---------------------------------------------------------------------------*/

interface PDFScriptingManagerOptions
{
  /**
   * The application event bus.
   */
  eventBus:EventBus;

  /**
   * The path and filename of the scripting bundle.
   */
  sandboxBundleSrc:string | undefined;

  /**
   * The factory that is used when
   * initializing scripting; must contain a `createScripting` method.
   * PLEASE NOTE: Primarily intended for the default viewer use-case.
   */
  scriptingFactory?:DefaultExternalServices;

  /**
   * The function that is used to
   * lookup the necessary document properties.
   */
  docPropertiesLookup?:( pdfDocument?:PDFDocumentProxy ) => Promise<ScriptingDocProperties | null>;
}

type InternalEventName =
  | "updatefromsandbox"
  | "dispatcheventinsandbox"
  | "pagechanging"
  | "pagerendered"
  | "pagesdestroy"
;

type InternalListenerMap = {
  [EN in InternalEventName]:( evt:EventMap[EN] ) => void;
}

export class PDFScriptingManager
{
  #pdfDocument?:PDFDocumentProxy | undefined;

  #pdfViewer?:PDFViewer;
  setViewer( pdfViewer:PDFViewer ) { this.#pdfViewer = pdfViewer; }
  
  #closeCapability?:PromiseCap | undefined;

  #destroyCapability?:PromiseCap;
  get destroyPromise() { return this.#destroyCapability?.promise || undefined; }

  _scripting:IScripting | undefined;

  #mouseState:MouseState = Object.create(null);
  get mouseState() { return this.#mouseState; }

  _ready = false;

  #eventBus;
  #sandboxBundleSrc;
  #scriptingFactory;
  #docPropertiesLookup;
  
  constructor({
    eventBus,
    sandboxBundleSrc,
    scriptingFactory,
    docPropertiesLookup,
  }:PDFScriptingManagerOptions) {
    this.#eventBus = eventBus;
    this.#sandboxBundleSrc = sandboxBundleSrc;
    this.#scriptingFactory = scriptingFactory;
    this.#docPropertiesLookup = docPropertiesLookup;

    // The default viewer already handles adding/removing of DOM events,
    // hence limit this to only the viewer components.
    // #if COMPONENTS
      if( !this.#scriptingFactory )
      {
        window.addEventListener("updatefromsandbox", event => {
          this.#eventBus.dispatch("updatefromsandbox", {
            source: window,
            detail: (<CustomEvent>event).detail,
          });
        });
      }
    // #endif
  }

  async setDocument( pdfDocument?:PDFDocumentProxy )
  {
    if (this.#pdfDocument) 
    {
      await this.#destroyScripting();
    }
    this.#pdfDocument = pdfDocument;

    if( !pdfDocument ) return;

    const [objects, calculationOrder, docActions] = await Promise.all([
      pdfDocument.getFieldObjects(),
      pdfDocument.getCalculationOrderIds(),
      pdfDocument.getJSActions(),
    ]);

    if (!objects && !docActions) 
    {
      // No FieldObjects or JavaScript actions were found in the document.
      await this.#destroyScripting();
      return;
    }

    // The document was closed while the data resolved.
    if( pdfDocument !== this.#pdfDocument ) return; 

    try {
      this._scripting = this.#createScripting();
    } catch (error) {
      console.error(`PDFScriptingManager.setDocument: "${(<any>error)?.message}".`);

      await this.#destroyScripting();
      return;
    }

    this.#internalEvents.set("updatefromsandbox", ( event:EventMap["updatefromsandbox"] ) => {
      if( event?.source !== window) return;

      this.#updateFromSandbox( event.detail );
    });
    this.#internalEvents.set("dispatcheventinsandbox", ( event:EventMap["dispatcheventinsandbox"] ) => {
      this._scripting?.dispatchEventInSandbox(event.detail);
    });

    this.#internalEvents.set("pagechanging", ({ pageNumber, previous }:EventMap["pagechanging"]) => {
      // The current page didn't change.
      if( pageNumber === previous ) return;
      
      this.#dispatchPageClose(previous);
      this.#dispatchPageOpen(pageNumber);
    });
    this.#internalEvents.set("pagerendered", ({ pageNumber }:EventMap["pagerendered"]) => {
      // No pending "PageOpen" event for the newly rendered page.
      if( !this.#pageOpenPending.has(pageNumber) ) return;

      // The newly rendered page is no longer the current one.
      if( pageNumber !== this.#pdfViewer!.currentPageNumber ) return;

      this.#dispatchPageOpen(pageNumber);
    });
    this.#internalEvents.set("pagesdestroy", async ( event:EventMap["pagesdestroy"] ) => {
      await this.#dispatchPageClose( this.#pdfViewer!.currentPageNumber );

      await this._scripting?.dispatchEventInSandbox({
        id: "doc",
        name: "WillClose",
      });

      this.#closeCapability?.resolve();
    });

    this.#domEvents.set("mousedown", ( event:MouseEvent ) => {
      this.#mouseState.isDown = true;
    });
    this.#domEvents.set("mouseup", ( event:MouseEvent ) => {
      this.#mouseState.isDown = false;
    });

    for( const [name, listener] of this.#internalEvents ) 
    {
      this.#eventBus._on( name, listener );
    }
    for( const [name, listener] of this.#domEvents ) 
    {
      window.addEventListener( name, listener, true );
    }

    try {
      const docProperties = await this.#getDocProperties();
      if (pdfDocument !== this.#pdfDocument) 
        // The document was closed while the properties resolved.
        return; 

      await this._scripting?.createSandbox({
        objects,
        calculationOrder,
        appInfo: {
          platform: navigator.platform,
          language: navigator.language,
        },
        docInfo: {
          ...docProperties,
          actions: docActions,
        },
      });

      this.#eventBus.dispatch("sandboxcreated", { source: this });
    } catch (error) {
      console.error(`PDFScriptingManager.setDocument: "${(<any>error)?.message}".`);

      await this.#destroyScripting();
      return;
    }

    await this._scripting?.dispatchEventInSandbox({
      id: "doc",
      name: "Open",
    });
    await this.#dispatchPageOpen(
      this.#pdfViewer!.currentPageNumber,
      /* initialize = */ true
    );

    // Defer this slightly, to ensure that scripting is *fully* initialized.
    Promise.resolve().then(() => {
      if (pdfDocument === this.#pdfDocument) 
      {
        this._ready = true;
      }
    });
  }

  async dispatchWillSave( detail?:unknown )
  {
    return this._scripting?.dispatchEventInSandbox({
      id: "doc",
      name: "WillSave",
    });
  }

  async dispatchDidSave( detail?:unknown )
  {
    return this._scripting?.dispatchEventInSandbox({
      id: "doc",
      name: "DidSave",
    });
  }

  async dispatchWillPrint( detail?:unknown )
  {
    return this._scripting?.dispatchEventInSandbox({
      id: "doc",
      name: "WillPrint",
    });
  }

  async dispatchDidPrint( detail?:unknown )
  {
    return this._scripting?.dispatchEventInSandbox({
      id: "doc",
      name: "DidPrint",
    });
  }

  get ready() { return this._ready; }

  get #internalEvents() 
  {
    return shadow( this, "#internalEvents", 
      new Map<InternalEventName, InternalListenerMap[InternalEventName]>()
    );
  }

  get #domEvents() 
  {
    return shadow( this, "#domEvents", 
      new Map<"mousedown"|"mouseup", ( event:MouseEvent ) => void>()
    );
  }

  get #pageOpenPending() 
  {
    return shadow(this, "#pageOpenPending", new Set<number>());
  }

  get #visitedPages()
  {
    return shadow( this, "#visitedPages", new Map<number, Promise<void> | null>() );
  }

  async #updateFromSandbox( detail:EventMap["updatefromsandbox"]["detail"] )
  {
    // Ignore some events, see below, that don't make sense in PresentationMode.
    const isInPresentationMode =
      this.#pdfViewer!.isInPresentationMode ||
      this.#pdfViewer!.isChangingPresentationMode;

    const { id, siblings, command, value } = detail;
    if (!id) 
    {
      switch( command )
      {
        case "clear":
          console.clear();
          break;
        case "error":
          console.error(value);
          break;
        case "layout":
          if( isInPresentationMode ) return;

          const modes = apiPageLayoutToViewerModes( <PageLayout>value );
          this.#pdfViewer!.spreadMode = modes.spreadMode;
          break;
        case "page-num":
          this.#pdfViewer!.currentPageNumber = <number>value + 1;
          break;
        case "print":
          await this.#pdfViewer!.pagesPromise;
          this.#eventBus.dispatch("print", { source: this });
          break;
        case "println":
          console.log(value);
          break;
        case "zoom":
          if( isInPresentationMode ) return;

          this.#pdfViewer!.currentScaleValue = <string>value;
          break;
        case "SaveAs":
          this.#eventBus.dispatch("save", { source: this });
          break;
        case "FirstPage":
          this.#pdfViewer!.currentPageNumber = 1;
          break;
        case "LastPage":
          this.#pdfViewer!.currentPageNumber = this.#pdfViewer!.pagesCount;
          break;
        case "NextPage":
          this.#pdfViewer!.nextPage();
          break;
        case "PrevPage":
          this.#pdfViewer!.previousPage();
          break;
        case "ZoomViewIn":
          if( isInPresentationMode ) return;

          this.#pdfViewer!.increaseScale();
          break;
        case "ZoomViewOut":
          if( isInPresentationMode ) return;

          this.#pdfViewer!.decreaseScale();
          break;
      }
      return;
    }

    if (isInPresentationMode) 
    {
      if( detail.focus ) return;
    }
    delete detail.id;
    delete detail.siblings;

    const ids = siblings ? [id, ...siblings] : [id];
    for (const elementId of ids) 
    {
      const element = document.getElementById(elementId);
      if (element) 
      {
        element.dispatchEvent(new CustomEvent("updatefromsandbox", { detail }));
      } 
      else {
        // The element hasn't been rendered yet, use the AnnotationStorage.
        this.#pdfDocument?.annotationStorage.setValue(elementId, detail);
      }
    }
  }

  async #dispatchPageOpen( pageNumber:number, initialize=false )
  {
    const pdfDocument = this.#pdfDocument,
      visitedPages = this.#visitedPages;

    if (initialize) 
    {
      this.#closeCapability = createPromiseCap();
    }

    // Scripting isn't fully initialized yet.
    if( !this.#closeCapability ) return; 

    const pageView = this.#pdfViewer!.getPageView( /* index = */ pageNumber - 1 );

    if (pageView?.renderingState !== RenderingStates.FINISHED) 
    {
      this.#pageOpenPending.add(pageNumber);
      return; // Wait for the page to finish rendering.
    }
    this.#pageOpenPending.delete(pageNumber);

    const actionsPromise = (async() => {
      // Avoid sending, and thus serializing, the `actions` data more than once.
      const actions = await (!visitedPages.has(pageNumber)
        ? pageView.pdfPage?.getJSActions()
        : null);

      // The document was closed while the actions resolved.
      if( pdfDocument !== this.#pdfDocument ) return; 

      await this._scripting?.dispatchEventInSandbox({
        id: "page",
        name: "PageOpen",
        pageNumber,
        actions,
      });
    })();
    visitedPages.set(pageNumber, actionsPromise);
  }

  async #dispatchPageClose( pageNumber:number )
  {
    const pdfDocument = this.#pdfDocument,
      visitedPages = this.#visitedPages;

    // Scripting isn't fully initialized yet.
    if( !this.#closeCapability ) return; 

    // The page is still rendering; no "PageOpen" event dispatched.
    if( this.#pageOpenPending.has(pageNumber) ) return; 

    const actionsPromise = visitedPages.get(pageNumber);
    // The "PageClose" event must be preceded by a "PageOpen" event.
    if( !actionsPromise ) return; 

    visitedPages.set(pageNumber, null);

    // Ensure that the "PageOpen" event is dispatched first.
    await actionsPromise;
    // The document was closed while the actions resolved.
    if( pdfDocument !== this.#pdfDocument ) return; 

    await this._scripting?.dispatchEventInSandbox({
      id: "page",
      name: "PageClose",
      pageNumber,
    });
  }

  /**
   * @return {Promise<Object>} A promise that is resolved with an {Object}
   *   containing the necessary document properties; please find the expected
   *   format in `PDFViewerApplication._scriptingDocProperties`.
   * @private
   */
  #getDocProperties = async() =>
  {
    if( this.#docPropertiesLookup )
    {
      return this.#docPropertiesLookup(this.#pdfDocument);
    }
    // #if COMPONENTS
      const { docPropertiesLookup } = require("./generic_scripting.js");

      return docPropertiesLookup(this.#pdfDocument);
    // #endif
    throw new Error("#getDocProperties: Unable to lookup properties.");
  }

  #createScripting = () =>
  {
    this.#destroyCapability = createPromiseCap();

    if (this._scripting) 
    {
      throw new Error("#createScripting: Scripting already exists.");
    }
    if( this.#scriptingFactory )
    {
      return this.#scriptingFactory.createScripting({
        sandboxBundleSrc: this.#sandboxBundleSrc,
      });
    }
    // #if COMPONENTS
      const { GenericScripting } = require("./generic_scripting.js");

      return new GenericScripting( this.#sandboxBundleSrc );
    // #endif
    throw new Error("#createScripting: Cannot create scripting.");
  }

  async #destroyScripting()
  {
    if (!this._scripting) 
    {
      this.#pdfDocument = undefined;

      this.#destroyCapability?.resolve();
      return;
    }
    if( this.#closeCapability )
    {
      await Promise.race([
        this.#closeCapability.promise,
        new Promise(resolve => {
          // Avoid the scripting/sandbox-destruction hanging indefinitely.
          setTimeout(resolve, 1000);
        }),
      ]).catch(reason => {
        // Ignore any errors, to ensure that the sandbox is always destroyed.
      });
      this.#closeCapability = undefined;
    }
    this.#pdfDocument = undefined;

    try {
      await this._scripting.destroySandbox();
    } catch (ex) {}

    for( const [name, listener] of this.#internalEvents )
    {
      this.#eventBus._off(name, listener);
    }
    this.#internalEvents.clear();

    for( const [name, listener] of this.#domEvents )
    {
      window.removeEventListener( name, listener, true );
    }
    this.#domEvents.clear();

    this.#pageOpenPending.clear();
    this.#visitedPages.clear();

    this._scripting = undefined;
    delete this.#mouseState.isDown;
    this._ready = false;

    this.#destroyCapability?.resolve();
  }
}
/*81---------------------------------------------------------------------------*/
