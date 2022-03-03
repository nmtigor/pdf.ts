/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
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

/** @typedef {import("./api").PDFPageProxy} PDFPageProxy */
/** @typedef {import("./display_utils").PageViewport} PageViewport */
/** @typedef {import("./interfaces").IDownloadManager} IDownloadManager */
/** @typedef {import("../../web/interfaces").IPDFLinkService} IPDFLinkService */

import { 
  div, 
  html, 
  span, 
  type HSElement, 
  svg as createSVG, 
  textnode 
} from "../../../lib/dom.js";
import { assert } from "../../../lib/util/trace.js";
import { DownloadManager } from "../../pdf.ts-web/download_manager.js";
import { IDownloadManager, type IPDFLinkService, type MouseState } from "../../pdf.ts-web/interfaces.js";
import {
  DOMSVGFactory, 
  getFilenameFromUrl, 
  PageViewport, 
  PDFDateString,
} from "./display_utils.js";
import {
  type ActionEventType,
  AnnotationBorderStyleType,
  AnnotationType,
  shadow,
  stringToPDFString,
  Util,
  warn,
  matrix_t,
  rect_t,
} from "../shared/util.js";
import { AnnotationStorage } from "./annotation_storage.js";
import { PDFPageProxy } from "./api.js";
import { type AnnotationData, type FieldObject, type RichText } from "../core/annotation.js";
import { ColorConverters, type CSTag } from "../shared/scripting_utils.js";
import { type Destination } from "../core/catalog.js";
import { type BidiText } from "../core/bidi.js";
import { XfaLayer } from "./xfa_layer.js";
/*81---------------------------------------------------------------------------*/

const DEFAULT_TAB_INDEX = 1000;
const GetElementsByNameSet = new WeakSet();

type HTMLSectionElement = HTMLElement;

function getRectDims( rect:rect_t )
{
  return {
    width: rect[2] - rect[0],
    height: rect[3] - rect[1],
  };
}

interface AnnotationElementParms 
{
  data:AnnotationData;
  layer:HTMLDivElement;
  page:PDFPageProxy;
  viewport:PageViewport;
  linkService:IPDFLinkService;
  downloadManager:IDownloadManager | undefined;

  /**
   * Path for image resources, mainly
   * for annotation icons. Include trailing slash.
   */
  imageResourcesPath?:string;

  renderForms:boolean;
  svgFactory:DOMSVGFactory;
  annotationStorage:AnnotationStorage;

  enableScripting?:boolean;
  hasJSActions?:boolean;
  fieldObjects:Record<string, FieldObject[]> | undefined;
  mouseState?:MouseState;
}

class AnnotationElementFactory 
{
  static create( parameters:AnnotationElementParms )
  {
    const subtype = parameters.data.annotationType;

    switch( subtype )
    {
      case AnnotationType.LINK:
        return new LinkAnnotationElement(parameters);

      case AnnotationType.TEXT:
        return new TextAnnotationElement(parameters);

      case AnnotationType.WIDGET:
        const fieldType = parameters.data.fieldType;

        switch (fieldType) 
        {
          case "Tx":
            return new TextWidgetAnnotationElement(parameters);
          case "Btn":
            if (parameters.data.radioButton) 
            {
              return new RadioButtonWidgetAnnotationElement(parameters);
            } 
            else if (parameters.data.checkBox) 
            {
              return new CheckboxWidgetAnnotationElement(parameters);
            }
            return new PushButtonWidgetAnnotationElement(parameters);
          case "Ch":
            return new ChoiceWidgetAnnotationElement(parameters);
        }
        return new WidgetAnnotationElement(parameters);

      case AnnotationType.POPUP:
        return new PopupAnnotationElement(parameters);

      case AnnotationType.FREETEXT:
        return new FreeTextAnnotationElement(parameters);

      case AnnotationType.LINE:
        return new LineAnnotationElement(parameters);

      case AnnotationType.SQUARE:
        return new SquareAnnotationElement(parameters);

      case AnnotationType.CIRCLE:
        return new CircleAnnotationElement(parameters);

      case AnnotationType.POLYLINE:
        return new PolylineAnnotationElement(parameters);

      case AnnotationType.CARET:
        return new CaretAnnotationElement(parameters);

      case AnnotationType.INK:
        return new InkAnnotationElement(parameters);

      case AnnotationType.POLYGON:
        return new PolygonAnnotationElement(parameters);

      case AnnotationType.HIGHLIGHT:
        return new HighlightAnnotationElement(parameters);

      case AnnotationType.UNDERLINE:
        return new UnderlineAnnotationElement(parameters);

      case AnnotationType.SQUIGGLY:
        return new SquigglyAnnotationElement(parameters);

      case AnnotationType.STRIKEOUT:
        return new StrikeOutAnnotationElement(parameters);

      case AnnotationType.STAMP:
        return new StampAnnotationElement(parameters);

      case AnnotationType.FILEATTACHMENT:
        return new FileAttachmentAnnotationElement(parameters);

      default:
        return new AnnotationElement(parameters);
    }
  }
}

export class AnnotationElement 
{
  isRenderable;
  data;
  layer;
  page;
  viewport;
  linkService;
  downloadManager;
  imageResourcesPath;
  renderForms;
  svgFactory;
  annotationStorage;
  enableScripting;
  hasJSActions;
  _fieldObjects;
  _mouseState;

  container?:HTMLSectionElement;

  quadrilaterals?:HTMLSectionElement[] | undefined;

  constructor(
    parameters:AnnotationElementParms,
    {
      isRenderable=false,
      ignoreBorder=false,
      createQuadrilaterals=false,
    }={}
  ) {
    this.isRenderable = isRenderable;
    this.data = parameters.data;
    this.layer = parameters.layer;
    this.page = parameters.page;
    this.viewport = parameters.viewport;
    this.linkService = parameters.linkService;
    this.downloadManager = parameters.downloadManager;
    this.imageResourcesPath = parameters.imageResourcesPath;
    this.renderForms = parameters.renderForms;
    this.svgFactory = parameters.svgFactory;
    this.annotationStorage = parameters.annotationStorage;
    this.enableScripting = parameters.enableScripting;
    this.hasJSActions = parameters.hasJSActions;
    this._fieldObjects = parameters.fieldObjects;
    this._mouseState = parameters.mouseState;

    if( isRenderable ) 
    {
      this.container = this.#createContainer(ignoreBorder);
    }
    if( createQuadrilaterals )
    {
      this.quadrilaterals = this.#createQuadrilaterals(ignoreBorder);
    }
  }

  /**
   * Create an empty container for the annotation's HTML element.
   */
  #createContainer( ignoreBorder=false ):HTMLSectionElement
  {
    const data = this.data;
    const page = this.page;
    const viewport = this.viewport;
    const container = html( "section" );
    let { width, height } = getRectDims(data.rect);

    container.setAttribute("data-annotation-id", data.id);

    // Do *not* modify `data.rect`, since that will corrupt the annotation
    // position on subsequent calls to `#createContainer` (see issue 6804).
    const rect = Util.normalizeRect([
      data.rect[0],
      page.view[3] - data.rect[1] + page.view[1],
      data.rect[2],
      page.view[3] - data.rect[3] + page.view[1],
    ]);

    if (data.hasOwnCanvas) 
    {
      const transform = <matrix_t>viewport.transform.slice();
      const [scaleX, scaleY] = Util.singularValueDecompose2dScale(transform);
      width = Math.ceil(width * scaleX);
      height = Math.ceil(height * scaleY);
      rect[0] *= scaleX;
      rect[1] *= scaleY;
      // Reset the scale part of the transform matrix (which must be diagonal
      // or anti-diagonal) in order to avoid to rescale the canvas.
      // The canvas for the annotation is correctly scaled when it is drawn
      // (see `beginAnnotation` in canvas.js).
      for (let i = 0; i < 4; i++) {
        transform[i] = Math.sign(transform[i]);
      }
      container.style.transform = `matrix(${transform.join(",")})`;
    } 
    else {
      container.style.transform = `matrix(${viewport.transform.join(",")})`;
    }

    container.style.transformOrigin = `${-rect[0]}px ${-rect[1]}px`;

    if( !ignoreBorder && data.borderStyle.width > 0 )
    {
      container.style.borderWidth = `${data.borderStyle.width}px`;
      if (data.borderStyle.style !== AnnotationBorderStyleType.UNDERLINE) {
        // Underline styles only have a bottom border, so we do not need
        // to adjust for all borders. This yields a similar result as
        // Adobe Acrobat/Reader.
        width -= 2 * data.borderStyle.width;
        height -= 2 * data.borderStyle.width;
      }

      const horizontalRadius = data.borderStyle.horizontalCornerRadius;
      const verticalRadius = data.borderStyle.verticalCornerRadius;
      if (horizontalRadius > 0 || verticalRadius > 0) 
      {
        const radius = `${horizontalRadius}px / ${verticalRadius}px`;
        container.style.borderRadius = radius;
      }

      switch (data.borderStyle.style) 
      {
        case AnnotationBorderStyleType.SOLID:
          container.style.borderStyle = "solid";
          break;

        case AnnotationBorderStyleType.DASHED:
          container.style.borderStyle = "dashed";
          break;

        case AnnotationBorderStyleType.BEVELED:
          warn("Unimplemented border style: beveled");
          break;

        case AnnotationBorderStyleType.INSET:
          warn("Unimplemented border style: inset");
          break;

        case AnnotationBorderStyleType.UNDERLINE:
          container.style.borderBottomStyle = "solid";
          break;

        default:
          break;
      }

      const borderColor = data.borderColor || data.color || undefined;
      if( borderColor )
      {
        container.style.borderColor = Util.makeHexColor(
          data.color![0] | 0,
          data.color![1] | 0,
          data.color![2] | 0
        );
      } 
      else {
        // Transparent (invisible) border, so do not draw it at all.
        container.style.borderWidth = <any>undefined;
      }
    }

    container.style.left = `${rect[0]}px`;
    container.style.top = `${rect[1]}px`;

    if( data.hasOwnCanvas ) 
    {
      container.style.width = container.style.height = "auto";
    }
    else {
      container.style.width = `${width}px`;
      container.style.height = `${height}px`;
    }
    return container;
  }

  /**
   * Create quadrilaterals from the annotation's quadpoints.
   */
  #createQuadrilaterals( ignoreBorder=false )
  {
    if( !this.data.quadPoints ) return undefined;

    const quadrilaterals:HTMLSectionElement[] = [];
    const savedRect = this.data.rect;
    for( const quadPoint of this.data.quadPoints )
    {
      this.data.rect = [
        quadPoint[2].x,
        quadPoint[2].y,
        quadPoint[1].x,
        quadPoint[1].y,
      ];
      quadrilaterals.push( this.#createContainer(ignoreBorder) );
    }
    this.data.rect = savedRect;
    return quadrilaterals;
  }

  /**
   * Create a popup for the annotation's HTML element. This is used for
   * annotations that do not have a Popup entry in the dictionary, but
   * are of a type that works with popups (such as Highlight annotations).
   */
  protected _createPopup( trigger_x:HTMLOrSVGElement | undefined, data:AnnotationData )
  {
    let container = this.container!;
    let trigger:HTMLOrSVGElement | HTMLElement[] | undefined = trigger_x;
    if( this.quadrilaterals )
    {
      trigger = trigger || this.quadrilaterals;
      container = this.quadrilaterals[0];
    }

    // If no trigger element is specified, create it.
    if( !trigger )
    {
      trigger = div();
      (<HTMLDivElement>trigger).style.height = container.style.height;
      (<HTMLDivElement>trigger).style.width = container.style.width;
      container.appendChild( <HTMLDivElement>trigger );
    }

    const popupElement = new PopupElement({
      container,
      trigger,
      color: data.color,
      titleObj: data.titleObj,
      modificationDate: data.modificationDate,
      contentsObj: data.contentsObj,
      richText: data.richText,
      hideWrapper: true,
    });
    const popup = popupElement.render();

    // Position the popup next to the annotation's container.
    popup.style.left = container.style.width;

    container.appendChild(popup);
  }

  /**
   * Render the quadrilaterals of the annotation.
   */
  protected _renderQuadrilaterals( className:string )
  {
    // #if !PRODUCTION || TESTING
      assert(this.quadrilaterals, "Missing quadrilaterals during rendering");
    // #endif

    for( const quadrilateral of this.quadrilaterals! )
    {
      quadrilateral.className = className;
    }
    return this.quadrilaterals!;
  }

  /**
   * Render the annotation's HTML element(s).
   */
  render():HTMLSectionElement | HTMLSectionElement[]
  {
    assert( 0, "Abstract method `AnnotationElement.render` called" );
    return <any>undefined;
  }

  /**
   * @private
   * @return {Array}
   */
  _getElementsByName( name:string, skipId?:string ) 
  {
    const fields = [];

    if (this._fieldObjects) 
    {
      const fieldObj = this._fieldObjects[name];
      if (fieldObj) 
      {
        for( const { page, id, exportValues } of fieldObj )
        {
          if (page === -1) continue;

          if (id === skipId) continue;

          const exportValue =
            typeof exportValues === "string" ? exportValues : undefined;

          const domElement = document.getElementById(id);
          if (domElement && !GetElementsByNameSet.has(domElement)) 
          {
            warn(`_getElementsByName - element not allowed: ${id}`);
            continue;
          }
          fields.push({ id, exportValue, domElement });
        }
      }
      return fields;
    }
    // Fallback to a regular DOM lookup, to ensure that the standalone
    // viewer components won't break.
    for( const domElement of document.getElementsByName(name) )
    {
      const { id, exportValue } = <any>domElement;
      if (id === skipId) continue;

      if (!GetElementsByNameSet.has(domElement)) continue;

      fields.push({ id, exportValue, domElement });
    }
    return fields;
  }

  static get platform() 
  {
    const platform = typeof navigator !== "undefined" ? navigator.platform : "";

    return shadow(this, "platform", {
      isWin: platform.includes("Win"),
      isMac: platform.includes("Mac"),
    });
  }
}

export interface ResetForm
{
  fields:string[];
  refs:string[];
  include:boolean;
}

class LinkAnnotationElement extends AnnotationElement
{
  constructor( parameters:AnnotationElementParms, 
    options?:{ ignoreBorder:boolean }
  ) {
    const isRenderable = !!(
      parameters.data.url ||
      parameters.data.dest ||
      parameters.data.action ||
      parameters.data.isTooltipOnly ||
      parameters.data.resetForm ||
      (parameters.data.actions &&
        (parameters.data.actions.Action ||
          parameters.data.actions["Mouse Up"] ||
          parameters.data.actions["Mouse Down"]))
    );
    super(parameters, {
      isRenderable,
      ignoreBorder: !!options?.ignoreBorder,
      createQuadrilaterals: true,
    });
  }

  override render()
  {
    const { data, linkService } = this;
    const link = html( "a" );

    if( data.url )
    {
      // #if GENERIC
        if( !linkService.addLinkAttributes )
        {
          warn(
            "LinkAnnotationElement.render - missing `addLinkAttributes`-method on the `linkService`-instance."
          );
        }
      // #endif
      linkService.addLinkAttributes?.(link, data.url, data.newWindow);
    } 
    else if( data.action )
    {
      this.#bindNamedAction(link, data.action);
    } 
    else if( data.dest )
    {
      this.#bindLink(link, data.dest);
    } 
    else { 
      let hasClickAction = false;
      if( data.actions 
       &&
        (data.actions.Action ||
          data.actions["Mouse Up"] ||
          data.actions["Mouse Down"])
       && this.enableScripting
       && this.hasJSActions
      ) {
        hasClickAction = true;
        this.#bindJSAction( link, data );
      } 

      if( data.resetForm )
      {
        this.#bindResetFormAction( link, data.resetForm );
      } 
      else if (!hasClickAction) 
      {
        this.#bindLink( link, "" );
      }
    }

    if (this.quadrilaterals) 
    {
      return this._renderQuadrilaterals("linkAnnotation").map(
        (quadrilateral, index) => {
          const linkElement = index === 0 ? link : link.cloneNode();
          quadrilateral.appendChild(linkElement);
          return quadrilateral;
        }
      );
    }

    this.container!.className = "linkAnnotation";
    this.container!.appendChild(link);
    return this.container!;
  }

  /**
   * Bind internal links to the link element.
   */
  #bindLink( link:HTMLAnchorElement, destination?:Destination )
  {
    link.href = this.linkService.getDestinationHash(destination);
    link.onclick = () => {
      if( destination )
      {
        this.linkService.goToDestination(destination);
      }
      return false;
    };
    if( destination || destination === /* isTooltipOnly = */ "" ) 
    {
      link.className = "internalLink";
    }
  }

  /**
   * Bind named actions to the link element.
   */
  #bindNamedAction( link:HTMLAnchorElement, action:string )
  {
    link.href = this.linkService.getAnchorUrl("");
    link.onclick = () => {
      this.linkService.executeNamedAction(action);
      return false;
    };
    link.className = "internalLink";
  }

  /**
   * Bind JS actions to the link element.
   */
  #bindJSAction( link:HTMLAnchorElement, data:AnnotationData )
  {
    link.href = this.linkService.getAnchorUrl("");
    const map = new Map([
      ["Action", "onclick"],
      ["Mouse Up", "onmouseup"],
      ["Mouse Down", "onmousedown"],
    ]);
    for( const name of Object.keys(data.actions!) )
    {
      const jsName = map.get(name);
      if( !jsName ) continue;

      (<any>link)[jsName] = () => {
        this.linkService.eventBus?.dispatch("dispatcheventinsandbox", {
          source: this,
          detail: {
            id: data.id,
            name,
          },
        });
        return false;
      };
    }

    if(!link.onclick )
    {
      link.onclick = () => false;
    }
    link.className = "internalLink";
  }

  #bindResetFormAction( link:HTMLAnchorElement, resetForm:ResetForm ) 
  {
    const otherClickAction = link.onclick;
    if( !otherClickAction )
    {
      link.href = this.linkService.getAnchorUrl("");
    }
    link.className = "internalLink";

    if( !this._fieldObjects )
    {
      warn(
        `#bindResetFormAction - "resetForm" action not supported, ` +
        "ensure that the `fieldObjects` parameter is provided."
      );
      if (!otherClickAction) 
      {
        link.onclick = () => false;
      }
      return;
    }

    link.onclick = () => {
      if (otherClickAction) 
      {
        (<any>otherClickAction)();
      }

      const {
        fields: resetFormFields,
        refs: resetFormRefs,
        include,
      } = resetForm;

      const allFields = [];
      if (resetFormFields.length !== 0 || resetFormRefs.length !== 0) 
      {
        const fieldIds = new Set(resetFormRefs);
        for (const fieldName of resetFormFields) 
        {
          const fields = this._fieldObjects![fieldName] || [];
          for (const { id } of fields) 
          {
            fieldIds.add(id);
          }
        }
        for( const fields of Object.values(this._fieldObjects!) )
        {
          for (const field of fields) 
          {
            if (fieldIds.has(field.id) === include) 
            {
              allFields.push(field);
            }
          }
        }
      } 
      else {
        for( const fields of Object.values(this._fieldObjects!) ) 
        {
          allFields.push(...fields);
        }
      }

      const storage = this.annotationStorage;
      const allIds = [];
      for (const field of allFields) 
      {
        const { id } = field;
        allIds.push(id);
        switch (field.type) 
        {
          case "text": {
            const value = field.defaultValue || "";
            storage.setValue(id, { value, valueAsString: value });
            break;
          }
          case "checkbox":
          case "radiobutton": {
            const value = field.defaultValue === field.exportValues;
            storage.setValue(id, { value });
            break;
          }
          case "combobox":
          case "listbox": {
            const value = field.defaultValue || "";
            storage.setValue(id, { value });
            break;
          }
          default:
            continue;
        }
        const domElement = document.getElementById(id);
        if (!domElement || !GetElementsByNameSet.has(domElement)) 
        {
          continue;
        }
        domElement.dispatchEvent(new Event("resetform"));
      }

      if (this.enableScripting) 
      {
        // Update the values in the sandbox.
        this.linkService.eventBus?.dispatch("dispatcheventinsandbox", {
          source: this,
          detail: {
            id: "app",
            ids: allIds,
            name: "ResetForm",
          },
        });
      }

      return false;
    };
  }
}

class TextAnnotationElement extends AnnotationElement 
{
  constructor( parameters:AnnotationElementParms ) 
  {
    const isRenderable = !!(
      parameters.data.hasPopup ||
      parameters.data.titleObj?.str ||
      parameters.data.contentsObj?.str ||
      parameters.data.richText?.str
    );
    super( parameters, { isRenderable });
  }

  override render()
  {
    this.container!.className = "textAnnotation";

    const image = html( "img" );
    image.style.height = this.container!.style.height;
    image.style.width = this.container!.style.width;
    image.src =
      this.imageResourcesPath +
      "annotation-" +
      this.data.name!.toLowerCase() +
      ".svg";
    image.alt = "[{{type}} Annotation]";
    image.dataset.l10nId = "text_annotation_type";
    image.dataset.l10nArgs = JSON.stringify({ type: this.data.name });

    if (!this.data.hasPopup) 
    {
      this._createPopup(image, this.data);
    }

    this.container!.appendChild(image);
    return this.container!;
  }
}

type Action = ( event:CustomEvent ) => void;
interface Actions
{
  value:Action;

  clear?:Action;
  editable?:Action;
  indices?:Action;
  insert?:Action;
  items?:Action;
  multipleSelection?:Action;
  remove?:Action;
  selRange?:Action;
  valueAsString?:Action;
}
type ActionNames = keyof Actions;

class WidgetAnnotationElement extends AnnotationElement 
{
  override render()
  {
    // Show only the container for unsupported field types.
    if (this.data.alternativeText) 
    {
      this.container!.title = this.data.alternativeText;
    }

    return this.container!;
  }

  #getKeyModifier( event:MouseEvent )
  {
    const { isWin, isMac } = AnnotationElement.platform;
    return (isWin && event.ctrlKey) || (isMac && event.metaKey);
  }

  #setEventListener( element:HTMLElement, baseName:string, eventName:string, 
    valueGetter:( event:Event ) => string | number | boolean 
  ) {
    if( baseName.includes("mouse") )
    {
      // Mouse events
      element.addEventListener( baseName, ( event:Event ) => {
        this.linkService.eventBus?.dispatch("dispatcheventinsandbox", {
          source: this,
          detail: {
            id: this.data.id,
            name: eventName,
            value: valueGetter(event),
            shift: (<MouseEvent>event).shiftKey,
            modifier: this.#getKeyModifier(<MouseEvent>event),
          },
        });
      });
    } 
    else {
      // Non mouse event
      element.addEventListener(baseName, ( event:Event ) => {
        this.linkService.eventBus?.dispatch("dispatcheventinsandbox", {
          source: this,
          detail: {
            id: this.data.id,
            name: eventName,
            value: valueGetter(event),
          },
        });
      });
    }
  }

  _setEventListeners( element:HTMLElement, names:[string,string][], 
    getter:( event:Event ) => string | number | boolean
  ) {
    for( const [baseName, eventName] of names )
    {
      if( eventName === "Action" 
       || this.data.actions?.[ <ActionEventType>eventName ]
      ) {
        this.#setEventListener( element, baseName, eventName, getter );
      }
    }
  }

  _setBackgroundColor( element:HTMLElement ) 
  {
    const color = this.data.backgroundColor || undefined;
    element.style.backgroundColor =
      color === undefined
        ? "transparent"
        : Util.makeHexColor(color[0], color[1], color[2]);
  }

  _dispatchEventFromSandbox( actions:Actions, jsEvent:CustomEvent )
  {
    const setColor = ( jsName:string, styleName:string, event:CustomEvent ) => {
      const color = event.detail[jsName];
      (<any>(<HSElement>event.target).style)[styleName] = ColorConverters[`${<CSTag>color[0]}_HTML`](
        color.slice(1)
      );
    };

    const commonActions = {
      display: ( event:CustomEvent ) => {
        const hidden = event.detail.display % 2 === 1;
        (<HSElement>event.target).style.visibility = hidden ? "hidden" : "visible";
        this.annotationStorage.setValue( this.data.id, {
          hidden,
          print: event.detail.display === 0 || event.detail.display === 3,
        });
      },
      print: ( event:CustomEvent ) => {
        this.annotationStorage.setValue( this.data.id, {
          print: event.detail.print,
        });
      },
      hidden: ( event:CustomEvent ) => {
        (<HSElement>event.target).style.visibility = event.detail.hidden
          ? "hidden"
          : "visible";
        this.annotationStorage.setValue(this.data.id, {
          hidden: event.detail.hidden,
        });
      },
      focus: ( event:CustomEvent ) => {
        setTimeout(() => (<HSElement>event.target).focus({ preventScroll: false }), 0);
      },
      userName: ( event:CustomEvent ) => {
        // tooltip
        (<HTMLElement>event.target).title = event.detail.userName;
      },
      readonly: ( event:CustomEvent ) => {
        if (event.detail.readonly) 
        {
          (<Element>event.target).setAttribute("readonly", "");
        } 
        else {
          (<Element>event.target).removeAttribute("readonly");
        }
      },
      required: ( event:CustomEvent ) => {
        if (event.detail.required) 
        {
          (<Element>event.target).setAttribute("required", "");
        } 
        else {
          (<Element>event.target).removeAttribute("required");
        }
      },
      bgColor: ( event:CustomEvent ) => {
        setColor("bgColor", "backgroundColor", event);
      },
      fillColor: ( event:CustomEvent ) => {
        setColor("fillColor", "backgroundColor", event);
      },
      fgColor: ( event:CustomEvent ) => {
        setColor("fgColor", "color", event);
      },
      textColor: ( event:CustomEvent ) => {
        setColor("textColor", "color", event);
      },
      borderColor: ( event:CustomEvent ) => {
        setColor("borderColor", "borderColor", event);
      },
      strokeColor: ( event:CustomEvent ) => {
        setColor("strokeColor", "borderColor", event);
      },
    };

    for( const name of Object.keys(jsEvent.detail) ) 
    {
      const action:Action = (<any>actions)[name] || (<any>commonActions)[name];
      if( action ) 
      {
        action( jsEvent );
      }
    }
  }
}

class TextWidgetAnnotationElement extends WidgetAnnotationElement 
{
  constructor( parameters:AnnotationElementParms ) 
  {
    const isRenderable =
      parameters.renderForms ||
      (!parameters.data.hasAppearance && !!parameters.data.fieldValue);
    super(parameters, { isRenderable });
  }

  setPropertyOnSiblings( base:HTMLTextAreaElement | HTMLInputElement,
    key:string, value:string, keyInStorage:string )
  {
    const storage = this.annotationStorage;
    for( const element of this._getElementsByName(
      base.name,
      /* skipId = */ base.id
    )) {
      if( element.domElement )
      {
        (<any>element.domElement)[key] = value;
      }
      storage.setValue( element.id, { [keyInStorage]: value } );
    }
  }

  override render()
  {
    const storage = this.annotationStorage!;
    const id = this.data.id;

    this.container!.className = "textWidgetAnnotation";

    let element:HTMLElement;
    if( this.renderForms )
    {
      // NOTE: We cannot set the values using `element.value` below, since it
      //       prevents the AnnotationLayer rasterizer in `test/driver.js`
      //       from parsing the elements correctly for the reference tests.
      const storedData = storage.getValue( id, {
        value: this.data.fieldValue,
        valueAsString: this.data.fieldValue,
      });
      const textContent = storedData.valueAsString || storedData.value || "";
      const elementData:{
        userValue:string;
        formattedValue:string;
      } = Object.create(null);

      if( this.data.multiLine )
      {
        element = html( "textarea" );
        element.textContent = textContent.toString();
      } 
      else {
        element = html( "input" );
        (<HTMLInputElement>element).type = "text";
        element.setAttribute( "value", textContent.toString() );
      }
      type El = HTMLTextAreaElement | HTMLInputElement;
      GetElementsByNameSet.add(element);
      (<El>element).disabled = this.data.readOnly!;
      (<El>element).name = this.data.fieldName!;
      element.tabIndex = DEFAULT_TAB_INDEX;

      elementData.userValue = textContent.toString();
      element.setAttribute("id", id);

      element.addEventListener("input", event => {
        storage.setValue(id, { value: (<El>event.target).value });
        this.setPropertyOnSiblings(
          <HTMLTextAreaElement | HTMLInputElement>element,
          "value",
          (<El>event.target).value,
          "value"
        );
      });

      element.addEventListener("resetform", event => {
        const defaultValue = <string>this.data.defaultFieldValue || "";
        (<El>element).value = elementData.userValue = defaultValue;
        delete (<any>elementData).formattedValue;
      });

      let blurListener = ( event:FocusEvent ) => {
        if (elementData.formattedValue) {
          (<El>event.target).value = elementData.formattedValue;
        }
        // Reset the cursor position to the start of the field (issue 12359).
        (<El>event.target).scrollLeft = 0;
      };

      if( this.enableScripting && this.hasJSActions )
      {
        element.addEventListener("focus", event => {
          if( elementData.userValue )
          {
            (<El>event.target).value = elementData.userValue;
          }
        });

        element.addEventListener("updatefromsandbox", ( jsEvent:Event ) => {
          const actions:Actions = {
            value( event ) {
              elementData.userValue = event.detail.value || "";
              storage.setValue(id, { value: elementData.userValue?.toString() });
              if (!elementData.formattedValue) {
                (<El>event.target).value = elementData.userValue!;
              }
            },
            valueAsString( event ) {
              elementData.formattedValue = event.detail.valueAsString || "";
              if (event.target !== document.activeElement) 
              {
                // Input hasn't the focus so display formatted string
                (<El>event.target).value = <string>elementData.formattedValue;
              }
              storage.setValue( id, {
                formattedValue: elementData.formattedValue,
              });
            },
            selRange( event ) {
              const [selStart, selEnd] = event.detail.selRange;
              if (selStart >= 0 && selEnd < (<El>event.target).value.length) 
              {
                (<El>event.target).setSelectionRange(selStart, selEnd);
              }
            },
          };
          this._dispatchEventFromSandbox( actions, <CustomEvent>jsEvent );
        });

        // Even if the field hasn't any actions
        // leaving it can still trigger some actions with Calculate
        element.addEventListener("keydown", event => {
          // if the key is one of Escape, Enter or Tab
          // then the data are committed
          let commitKey = -1;
          if (event.key === "Escape") 
          {
            commitKey = 0;
          } 
          else if (event.key === "Enter") 
          {
            commitKey = 2;
          } 
          else if (event.key === "Tab") 
          {
            commitKey = 3;
          }
          if( commitKey === -1 ) return;

          // Save the entered value
          elementData.userValue = (<El>event.target).value;
          this.linkService.eventBus?.dispatch("dispatcheventinsandbox", {
            source: this,
            detail: {
              id,
              name: "Keystroke",
              value: (<El>event.target).value,
              willCommit: true,
              commitKey,
              selStart: (<El>event.target).selectionStart,
              selEnd: (<El>event.target).selectionEnd,
            },
          });
        });
        const _blurListener = blurListener;
        blurListener = <any>undefined;
        element.addEventListener("blur", event => {
          elementData.userValue = (<El>event.target).value;
          if( this._mouseState!.isDown )
          {
            // Focus out using the mouse: data are committed
            this.linkService.eventBus?.dispatch("dispatcheventinsandbox", {
              source: this,
              detail: {
                id,
                name: "Keystroke",
                value: (<El>event.target).value,
                willCommit: true,
                commitKey: 1,
                selStart: (<El>event.target).selectionStart,
                selEnd: (<El>event.target).selectionEnd,
              },
            });
          }
          _blurListener(event);
        });

        if( this.data.actions?.Keystroke )
        {
          element.addEventListener("beforeinput", event => {
            elementData.formattedValue = "";
            const { data, target } = event;
            const { value, selectionStart, selectionEnd } = <El>target;
            this.linkService.eventBus?.dispatch("dispatcheventinsandbox", {
              source: this,
              detail: {
                id,
                name: "Keystroke",
                value,
                change: data,
                willCommit: false,
                selStart: selectionStart,
                selEnd: selectionEnd,
              },
            });
          });
        }

        this._setEventListeners(
          element,
          [
            ["focus", "Focus"],
            ["blur", "Blur"],
            ["mousedown", "Mouse Down"],
            ["mouseenter", "Mouse Enter"],
            ["mouseleave", "Mouse Exit"],
            ["mouseup", "Mouse Up"],
          ],
          event => (<El>event.target).value
        );
      }

      if( blurListener )
      {
        element.addEventListener("blur", blurListener);
      }

      if( this.data.maxLen !== undefined )
      {
        (<El>element).maxLength = this.data.maxLen;
      }

      if( this.data.comb )
      {
        const fieldWidth = this.data.rect[2] - this.data.rect[0];
        const combWidth = fieldWidth / this.data.maxLen!;

        element.classList.add("comb");
        element.style.letterSpacing = `calc(${combWidth}px - 1ch)`;
      }
    } 
    else {
      element = div();
      element.textContent = <string>this.data.fieldValue;
      element.style.verticalAlign = "middle";
      element.style.display = "table-cell";
    }

    this.#setTextStyle(element);
    this._setBackgroundColor(element);

    this.container!.appendChild(element);
    return this.container!;
  }

  /**
   * Apply text styles to the text in the element.
   */
  #setTextStyle( element:HTMLElement )
  {
    const TEXT_ALIGNMENT = ["left", "center", "right"];
    const { fontSize, fontColor } = this.data.defaultAppearanceData!;
    const style = element.style;

    // TODO: If the font-size is zero, calculate it based on the height and
    //       width of the element.
    // Not setting `style.fontSize` will use the default font-size for now.
    if (fontSize) 
    {
      style.fontSize = `${fontSize}px`;
    }

    style.color = Util.makeHexColor(fontColor[0], fontColor[1], fontColor[2]);

    if( this.data.textAlignment !== undefined ) 
    {
      style.textAlign = TEXT_ALIGNMENT[ this.data.textAlignment! ];
    }
  }
}

class CheckboxWidgetAnnotationElement extends WidgetAnnotationElement 
{
  constructor( parameters:AnnotationElementParms ) 
  {
    super( parameters, { isRenderable: parameters.renderForms });
  }

  override render()
  {
    const storage = this.annotationStorage!;
    const data = this.data;
    const id = data.id;
    let value = storage.getValue( id, {
      value: data.exportValue === data.fieldValue,
    }).value;
    if (typeof value === "string") 
    {
      // The value has been changed through js and set in annotationStorage.
      value = value !== "Off";
      storage.setValue(id, { value });
    }

    this.container!.className = "buttonWidgetAnnotation checkBox";

    const element = html( "input" );
    type El = typeof element;
    GetElementsByNameSet.add(element);
    element.disabled = data.readOnly!;
    element.type = "checkbox";
    element.name = data.fieldName!;
    if (value) 
    {
      element.setAttribute( "checked", <any>true );
    }
    element.setAttribute("id", id);
    element.setAttribute("exportValue", data.exportValue!);
    element.tabIndex = DEFAULT_TAB_INDEX;

    element.addEventListener("change", event => {
      const { name, checked } = <El>event.target;
      for( const checkbox of this._getElementsByName(name, /* skipId = */ id) )
      {
        const curChecked = checked && checkbox.exportValue === data.exportValue;
        if( checkbox.domElement )
        {
          (<El>checkbox.domElement).checked = curChecked;
        }
        storage.setValue(checkbox.id, { value: curChecked });
      }
      storage.setValue(id, { value: checked });
    });

    element.addEventListener("resetform", event => {
      const defaultValue = data.defaultFieldValue || "Off";
      (<El>event.target).checked = defaultValue === data.exportValue;
    });

    if( this.enableScripting && this.hasJSActions )
    {
      element.addEventListener("updatefromsandbox", ( jsEvent:Event ) => {
        const actions:Actions = {
          value( event ) {
            (<El>event.target).checked = event.detail.value !== "Off";
            storage.setValue(id, { value: (<El>event.target).checked });
          },
        };
        this._dispatchEventFromSandbox( actions, <CustomEvent>jsEvent );
      });

      this._setEventListeners(
        element,
        [
          ["change", "Validate"],
          ["change", "Action"],
          ["focus", "Focus"],
          ["blur", "Blur"],
          ["mousedown", "Mouse Down"],
          ["mouseenter", "Mouse Enter"],
          ["mouseleave", "Mouse Exit"],
          ["mouseup", "Mouse Up"],
        ],
        event => (<El>event.target).checked
      );
    }

    this._setBackgroundColor(element);

    this.container!.appendChild(element);
    return this.container!;
  }
}

class RadioButtonWidgetAnnotationElement extends WidgetAnnotationElement 
{
  constructor( parameters:AnnotationElementParms ) 
  {
    super( parameters, { isRenderable: parameters.renderForms });
  }

  override render()
  {
    this.container!.className = "buttonWidgetAnnotation radioButton";
    const storage = this.annotationStorage!;
    const data = this.data;
    const id = data.id;
    let value = storage.getValue(id, {
      value: data.fieldValue === data.buttonValue,
    }).value;
    if (typeof value === "string") 
    {
      // The value has been changed through js and set in annotationStorage.
      value = value !== data.buttonValue;
      storage.setValue(id, { value });
    }

    const element = html( "input" );
    type El = typeof element;
    GetElementsByNameSet.add(element);
    element.disabled = data.readOnly!;
    element.type = "radio";
    element.name = data.fieldName!;
    if (value) 
    {
      element.setAttribute( "checked", <any>true );
    }
    element.setAttribute( "id", id );
    element.tabIndex = DEFAULT_TAB_INDEX;

    element.addEventListener("change", event => {
      const { name, checked } = <El>event.target;
      for (const radio of this._getElementsByName(name, /* skipId = */ id)) 
      {
        storage.setValue(radio.id, { value: false });
      }
      storage.setValue(id, { value: checked });
    });

    element.addEventListener("resetform", event => {
      const defaultValue = data.defaultFieldValue;
      (<El>event.target).checked =
        defaultValue !== null &&
        defaultValue !== undefined &&
        defaultValue === data.buttonValue;
    });

    if( this.enableScripting && this.hasJSActions )
    {
      const pdfButtonValue = data.buttonValue;
      element.addEventListener("updatefromsandbox", ( jsEvent:Event ) => {
        const actions:Actions = {
          value: event => {
            const checked = pdfButtonValue === event.detail.value;
            for( const radio of this._getElementsByName((<El>event.target).name) ) 
            {
              const curChecked = checked && radio.id === id;
              if (radio.domElement) 
              {
                (<HTMLInputElement>radio.domElement).checked = curChecked;
              }
              storage.setValue(radio.id, { value: curChecked });
            }
          },
        };
        this._dispatchEventFromSandbox( actions, <CustomEvent>jsEvent );
      });

      this._setEventListeners(
        element,
        [
          ["change", "Validate"],
          ["change", "Action"],
          ["focus", "Focus"],
          ["blur", "Blur"],
          ["mousedown", "Mouse Down"],
          ["mouseenter", "Mouse Enter"],
          ["mouseleave", "Mouse Exit"],
          ["mouseup", "Mouse Up"],
        ],
        event => (<El>event.target).checked
      );
    }

    this._setBackgroundColor(element);

    this.container!.appendChild(element);
    return this.container!;
  }
}

class PushButtonWidgetAnnotationElement extends LinkAnnotationElement 
{
  constructor( parameters:AnnotationElementParms )
  {
    super(parameters, { ignoreBorder: parameters.data.hasAppearance });
  }

  override render()
  {
    // The rendering and functionality of a push button widget annotation is
    // equal to that of a link annotation, but may have more functionality, such
    // as performing actions on form fields (resetting, submitting, et cetera).
    const container = <HTMLElement>super.render();
    container.className = "buttonWidgetAnnotation pushButton";

    if( this.data.alternativeText )
    {
      container.title = this.data.alternativeText;
    }

    return container;
  }
}

interface Item
{
  displayValue:string | null;
  exportValue:string;
}

class ChoiceWidgetAnnotationElement extends WidgetAnnotationElement 
{
  constructor( parameters:AnnotationElementParms ) 
  {
    super( parameters, { 
      isRenderable: parameters.renderForms 
    });
  }

  override render()
  {
    this.container!.className = "choiceWidgetAnnotation";
    const storage = this.annotationStorage!;
    const id = this.data.id;

    // For printing/saving we currently only support choice widgets with one
    // option selection. Therefore, listboxes (#12189) and comboboxes (#12224)
    // are not properly printed/saved yet, so we only store the first item in
    // the field value array instead of the entire array. Once support for those
    // two field types is implemented, we should use the same pattern as the
    // other interactive widgets where the return value of `getValue`
    // is used and the full array of field values is stored.
    storage.getValue( id, {
      value:
        this.data.fieldValue!.length > 0 ? this.data.fieldValue![0] : undefined,
    });

    let { fontSize } = this.data.defaultAppearanceData!;
    if (!fontSize) 
    {
      fontSize = 9;
    }
    const fontSizeStyle = `calc(${fontSize}px * var(--zoom-factor))`;

    const selectElement = html( "select" );
    type El = typeof selectElement;
    GetElementsByNameSet.add(selectElement);
    selectElement.disabled = this.data.readOnly!;
    selectElement.name = this.data.fieldName!;
    selectElement.setAttribute("id", id);
    selectElement.tabIndex = DEFAULT_TAB_INDEX;

    selectElement.style.fontSize = `${fontSize}px`;

    if( !this.data.combo )
    {
      // List boxes have a size and (optionally) multiple selection.
      selectElement.size = this.data.options!.length;
      if (this.data.multiSelect) {
        selectElement.multiple = true;
      }
    }

    selectElement.addEventListener("resetform", event => {
      const defaultValue = this.data.defaultFieldValue;
      for (const option of selectElement.options) 
      {
        option.selected = option.value === defaultValue;
      }
    });

    // Insert the options into the choice field.
    for( const option of this.data.options! )
    {
      const optionElement = html( "option" );
      optionElement.textContent = <string>option.displayValue;
      optionElement.value = <string>option.exportValue;
      if (this.data.combo) 
      {
        optionElement.style.fontSize = fontSizeStyle;
      }
      if( this.data.fieldValue!.includes(<string>option.exportValue) )
      {
        optionElement.setAttribute( "selected", <any>true );
      }
      selectElement.appendChild(optionElement);
    }

    const getValue = ( event:Event, isExport?:boolean ) => {
      const name = isExport ? "value" : "textContent";
      const options = (<El>event.target).options;
      if( !(<El>event.target).multiple )
      {
        return options.selectedIndex === -1
          ? null
          : options[options.selectedIndex][name];
      }
      return Array.prototype.filter
        .call(options, ( option:HTMLOptionElement ) => option.selected)
        .map( ( option:HTMLOptionElement ) => option[name]! );
    };

    const getItems = ( event:Event ) => {
      const options = (<El>event.target).options;
      return <Item[]>Array.prototype.map.call( options, ( option:HTMLOptionElement ) => {
        return { displayValue: option.textContent, exportValue: option.value };
      });
    };

    if( this.enableScripting && this.hasJSActions )
    {
      selectElement.addEventListener("updatefromsandbox", ( jsEvent:Event ) => {
        const actions:Actions = {
          value( event ) {
            const value = event.detail.value;
            const values = new Set(Array.isArray(value) ? value : [value]);
            for (const option of selectElement.options) {
              option.selected = values.has(option.value);
            }
            storage.setValue(id, {
              value: getValue(event, /* isExport */ true),
            });
          },
          multipleSelection( event ) {
            selectElement.multiple = true;
          },
          remove( event ) {
            const options = selectElement.options;
            const index = event.detail.remove;
            options[index].selected = false;
            selectElement.remove(index);
            if (options.length > 0) {
              const i = Array.prototype.findIndex.call(
                options,
                option => option.selected
              );
              if (i === -1) {
                options[0].selected = true;
              }
            }
            storage.setValue(id, {
              value: getValue(event, /* isExport */ true),
              items: getItems(event),
            });
          },
          clear( event ) {
            while (selectElement.length !== 0) {
              selectElement.remove(0);
            }
            storage.setValue(id, { value: null, items: [] });
          },
          insert( event ) {
            const { index, displayValue, exportValue } = event.detail.insert;
            const optionElement = html("option");
            optionElement.textContent = displayValue;
            optionElement.value = exportValue;
            selectElement.insertBefore(
              optionElement,
              selectElement.children[index]
            );
            storage.setValue(id, {
              value: getValue(event, /* isExport */ true),
              items: getItems(event),
            });
          },
          items( event ) {
            const { items } = event.detail;
            while (selectElement.length !== 0) 
            {
              selectElement.remove(0);
            }
            for (const item of items) 
            {
              const { displayValue, exportValue } = item;
              const optionElement = html("option");
              optionElement.textContent = displayValue;
              optionElement.value = exportValue;
              selectElement.appendChild(optionElement);
            }
            if (selectElement.options.length > 0) 
            {
              selectElement.options[0].selected = true;
            }
            storage.setValue( id, {
              value: getValue(event, /* isExport */ true),
              items: getItems(event),
            });
          },
          indices( event ) {
            const indices = new Set(event.detail.indices);
            for( const option of (<El>event.target).options )
            {
              option.selected = indices.has(option.index);
            }
            storage.setValue(id, {
              value: getValue(event, /* isExport */ true),
            });
          },
          editable( event ) {
            (<El>event.target).disabled = !event.detail.editable;
          },
        };
        this._dispatchEventFromSandbox( actions, <CustomEvent>jsEvent );
      });

      selectElement.addEventListener("input", event => {
        const exportValue = getValue(event, /* isExport */ true);
        const value = getValue(event, /* isExport */ false);
        storage.setValue(id, { value: exportValue });

        this.linkService.eventBus?.dispatch("dispatcheventinsandbox", {
          source: this,
          detail: {
            id,
            name: "Keystroke",
            value,
            changeEx: exportValue,
            willCommit: true,
            commitKey: 1,
            keyDown: false,
          },
        });
      });

      this._setEventListeners(
        selectElement,
        [
          ["focus", "Focus"],
          ["blur", "Blur"],
          ["mousedown", "Mouse Down"],
          ["mouseenter", "Mouse Enter"],
          ["mouseleave", "Mouse Exit"],
          ["mouseup", "Mouse Up"],
          ["input", "Action"],
        ],
        event => (<any>event.target).checked //kkkk bug?
        // event => (<El>event.target).selectedIndex
      );
    } 
    else {
      selectElement.addEventListener("input", event => {
        storage.setValue(id, { value: getValue(event) });
      });
    }

    this._setBackgroundColor(selectElement);

    this.container!.appendChild(selectElement);
    return this.container!;
  }
}

class PopupAnnotationElement extends AnnotationElement 
{
  constructor( parameters:AnnotationElementParms ) 
  {
    const isRenderable = !!(
      parameters.data.titleObj?.str ||
      parameters.data.contentsObj?.str ||
      parameters.data.richText?.str
    );
    super(parameters, { isRenderable });
  }

  override render()
  {
    // Do not render popup annotations for parent elements with these types as
    // they create the popups themselves (because of custom trigger divs).
    const IGNORE_TYPES = [
      "Line",
      "Square",
      "Circle",
      "PolyLine",
      "Polygon",
      "Ink",
    ];

    this.container!.className = "popupAnnotation";

    if( IGNORE_TYPES.includes(this.data.parentType!) )
    {
      return this.container!;
    }

    const selector = `[data-annotation-id="${this.data.parentId}"]`;
    const parentElements = this.layer.querySelectorAll(selector);
    if( parentElements.length === 0 )
    {
      return this.container!;
    }

    const popup = new PopupElement({
      container: this.container!,
      trigger: Array.from(parentElements),
      color: this.data.color,
      titleObj: this.data.titleObj,
      modificationDate: this.data.modificationDate,
      contentsObj: this.data.contentsObj,
      richText: this.data.richText,
    });

    // Position the popup next to the parent annotation's container.
    // PDF viewers ignore a popup annotation's rectangle.
    const page = this.page;
    const rect = Util.normalizeRect([
      this.data.parentRect![0],
      page.view[3] - this.data.parentRect![1] + page.view[1],
      this.data.parentRect![2],
      page.view[3] - this.data.parentRect![3] + page.view[1],
    ]);
    const popupLeft =
      rect[0] + this.data.parentRect![2] - this.data.parentRect![0];
    const popupTop = rect[1];

    this.container!.style.transformOrigin = `${-popupLeft}px ${-popupTop}px`;
    this.container!.style.left = `${popupLeft}px`;
    this.container!.style.top = `${popupTop}px`;

    this.container!.appendChild(popup.render());
    return this.container!;
  }
}

interface PopupElementCtorParms
{
  container:HTMLElement;
  trigger:Element[] | HTMLOrSVGElement;
  color?:Uint8ClampedArray | undefined;
  titleObj:BidiText | undefined;
  modificationDate?:string | undefined;
  contentsObj:BidiText;
  richText:RichText | undefined;
  hideWrapper?:boolean;
}

class PopupElement 
{
  container;
  trigger;
  color;
  titleObj;
  modificationDate;
  contentsObj;
  richText;
  hideWrapper;

  pinned = false;

  hideElement?:HTMLElement;

  constructor( parameters:PopupElementCtorParms ) 
  {
    this.container = parameters.container;
    this.trigger = parameters.trigger;
    this.color = parameters.color;
    this.titleObj = parameters.titleObj;
    this.modificationDate = parameters.modificationDate;
    this.contentsObj = parameters.contentsObj;
    this.richText = parameters.richText;
    this.hideWrapper = parameters.hideWrapper || false;
  }

  /** @override */
  render()
  {
    const BACKGROUND_ENLIGHT = 0.7;

    const wrapper = div();
    wrapper.className = "popupWrapper";

    // For Popup annotations we hide the entire section because it contains
    // only the popup. However, for Text annotations without a separate Popup
    // annotation, we cannot hide the entire container as the image would
    // disappear too. In that special case, hiding the wrapper suffices.
    this.hideElement = this.hideWrapper ? wrapper : this.container;
    this.hideElement.hidden = true;

    const popup = div();
    popup.className = "popup";

    const color = this.color;
    if( color )
    {
      // Enlighten the color.
      const r = BACKGROUND_ENLIGHT * (255 - color[0]) + color[0];
      const g = BACKGROUND_ENLIGHT * (255 - color[1]) + color[1];
      const b = BACKGROUND_ENLIGHT * (255 - color[2]) + color[2];
      popup.style.backgroundColor = Util.makeHexColor(r | 0, g | 0, b | 0);
    }

    const title = html( "h1" );
    title.dir = this.titleObj!.dir;
    title.textContent = this.titleObj!.str;
    popup.appendChild(title);

    // The modification date is shown in the popup instead of the creation
    // date if it is available and can be parsed correctly, which is
    // consistent with other viewers such as Adobe Acrobat.
    const dateObject = PDFDateString.toDateObject( this.modificationDate! );
    if( dateObject )
    {
      const modificationDate = span();
      modificationDate.className = "popupDate";
      modificationDate.textContent = "{{date}}, {{time}}";
      modificationDate.dataset.l10nId = "annotation_date_string";
      modificationDate.dataset.l10nArgs = JSON.stringify({
        date: dateObject.toLocaleDateString(),
        time: dateObject.toLocaleTimeString(),
      });
      popup.appendChild(modificationDate);
    }

    if( this.richText?.str
     && (!this.contentsObj?.str || this.contentsObj.str === this.richText.str)
    ) {
      XfaLayer.render({
        xfaHtml: this.richText.html,
        intent: "richText",
        div: popup,
      });
      (<Element>popup.lastChild).className = "richText popupContent";
    } 
    else {
      const contents = this.#formatContents(this.contentsObj);
      popup.appendChild(contents);
    }

    if( !Array.isArray(this.trigger) )
    {
      this.trigger = [ <HTMLElement>this.trigger ];
    }

    // Attach the event listeners to the trigger element.
    for (const element of this.trigger) {
      element.addEventListener( "click", this.#toggle );
      element.addEventListener("mouseover", this.#show.bind(this, false) );
      element.addEventListener("mouseout", this.#hide.bind(this, false) );
    }
    popup.addEventListener( "click", this.#hide.bind(this, true) );

    wrapper.appendChild(popup);
    return wrapper;
  }

  /**
   * Format the contents of the popup by adding newlines where necessary.
   */
  #formatContents( { str, dir }:BidiText )
  {
    const p = html( "p" );
    p.className = "popupContent";
    p.dir = dir;
    const lines = str.split(/(?:\r\n?|\n)/);
    for (let i = 0, ii = lines.length; i < ii; ++i) 
    {
      const line = lines[i];
      p.appendChild( textnode(line) );
      if (i < ii - 1) 
      {
        p.appendChild( html("br") );
      }
    }
    return p;
  }

  /**
   * Toggle the visibility of the popup.
   */
  #toggle = () => 
  {
    if (this.pinned) {
      this.#hide(true);
    } 
    else {
      this.#show(true);
    }
  }

  /**
   * Show the popup.
   */
  #show( pin=false )
  {
    if (pin) {
      this.pinned = true;
    }
    if( this.hideElement!.hidden )
    {
      this.hideElement!.hidden = false;
      this.container.style.zIndex += 1;
    }
  }

  /**
   * Hide the popup.
   */
  #hide( unpin=true )
  {
    if (unpin) 
    {
      this.pinned = false;
    }
    if( !this.hideElement!.hidden && !this.pinned )
    {
      this.hideElement!.hidden = true;
      (<any>this.container.style).zIndex -= 1;
    }
  }
}

class FreeTextAnnotationElement extends AnnotationElement 
{
  constructor( parameters:AnnotationElementParms ) 
  {
    const isRenderable = !!(
      parameters.data.hasPopup ||
      parameters.data.titleObj?.str ||
      parameters.data.contentsObj?.str ||
      parameters.data.richText?.str
    );
    super( parameters, { isRenderable, ignoreBorder: true });
  }

  /**
   * Render the free text annotation's HTML element in the empty container.
   */
  override render()
  {
    this.container!.className = "freeTextAnnotation";

    if (!this.data.hasPopup) 
    {
      this._createPopup( undefined, this.data );
    }
    return this.container!;
  }
}

class LineAnnotationElement extends AnnotationElement 
{
  constructor( parameters:AnnotationElementParms ) 
  {
    const isRenderable = !!(
      parameters.data.hasPopup ||
      parameters.data.titleObj?.str ||
      parameters.data.contentsObj?.str ||
      parameters.data.richText?.str
    );
    super( parameters, { isRenderable,  ignoreBorder: true });
  }

  override render()
  {
    this.container!.className = "lineAnnotation";

    // Create an invisible line with the same starting and ending coordinates
    // that acts as the trigger for the popup. Only the line itself should
    // trigger the popup, not the entire container.
    const data = this.data;
    const { width, height } = getRectDims(data.rect);
    const svg = this.svgFactory.create(width, height);

    // PDF coordinates are calculated from a bottom left origin, so transform
    // the line coordinates to a top left origin for the SVG element.
    const line = createSVG("line");
    line.setAttribute("x1", (data.rect[2] - data.lineCoordinates![0]).toString());
    line.setAttribute("y1", (data.rect[3] - data.lineCoordinates![1]).toString());
    line.setAttribute("x2", (data.rect[2] - data.lineCoordinates![2]).toString());
    line.setAttribute("y2", (data.rect[3] - data.lineCoordinates![3]).toString());
    // Ensure that the 'stroke-width' is always non-zero, since otherwise it
    // won't be possible to open/close the popup (note e.g. issue 11122).
    line.setAttribute( "stroke-width", (data.borderStyle.width || 1).toString() );
    line.setAttribute( "stroke", "transparent" );
    line.setAttribute( "fill", "transparent" );

    svg.appendChild(line);
    this.container!.append(svg);

    // Create the popup ourselves so that we can bind it to the line instead
    // of to the entire container (which is the default).
    this._createPopup( line, data );

    return this.container!;
  }
}

class SquareAnnotationElement extends AnnotationElement 
{
  constructor( parameters:AnnotationElementParms ) 
  {
    const isRenderable = !!(
      parameters.data.hasPopup ||
      parameters.data.titleObj?.str ||
      parameters.data.contentsObj?.str ||
      parameters.data.richText?.str
    );
    super( parameters, { isRenderable,  ignoreBorder: true });
  }

  override render()
  {
    this.container!.className = "squareAnnotation";

    // Create an invisible square with the same rectangle that acts as the
    // trigger for the popup. Only the square itself should trigger the
    // popup, not the entire container.
    const data = this.data;
    const { width, height } = getRectDims(data.rect);
    const svg = this.svgFactory.create(width, height);

    // The browser draws half of the borders inside the square and half of
    // the borders outside the square by default. This behavior cannot be
    // changed programmatically, so correct for that here.
    const borderWidth = data.borderStyle.width;
    const square = createSVG("rect");
    square.setAttribute("x", (borderWidth / 2).toString());
    square.setAttribute("y", (borderWidth / 2).toString());
    square.setAttribute("width", (width - borderWidth).toString());
    square.setAttribute("height", (height - borderWidth).toString());
    // Ensure that the 'stroke-width' is always non-zero, since otherwise it
    // won't be possible to open/close the popup (note e.g. issue 11122).
    square.setAttribute("stroke-width", (borderWidth || 1).toString());
    square.setAttribute("stroke", "transparent");
    square.setAttribute("fill", "transparent");

    svg.appendChild(square);
    this.container!.append(svg);

    // Create the popup ourselves so that we can bind it to the square instead
    // of to the entire container (which is the default).
    this._createPopup(square, data);

    return this.container!;
  }
}

class CircleAnnotationElement extends AnnotationElement 
{
  constructor( parameters:AnnotationElementParms ) 
  {
    const isRenderable = !!(
      parameters.data.hasPopup ||
      parameters.data.titleObj?.str ||
      parameters.data.contentsObj?.str ||
      parameters.data.richText?.str
    );
    super( parameters, { isRenderable,  ignoreBorder: true });
  }

  override render()
  {
    this.container!.className = "circleAnnotation";

    // Create an invisible circle with the same ellipse that acts as the
    // trigger for the popup. Only the circle itself should trigger the
    // popup, not the entire container.
    const data = this.data;
    const { width, height } = getRectDims(data.rect);
    const svg = this.svgFactory.create(width, height);

    // The browser draws half of the borders inside the circle and half of
    // the borders outside the circle by default. This behavior cannot be
    // changed programmatically, so correct for that here.
    const borderWidth = data.borderStyle.width;
    const circle = createSVG("ellipse");
    circle.setAttribute( "cx", (width / 2).toString() );
    circle.setAttribute( "cy", (height / 2).toString() );
    circle.setAttribute( "rx", (width / 2 - borderWidth / 2).toString() );
    circle.setAttribute( "ry", (height / 2 - borderWidth / 2).toString() );
    // Ensure that the 'stroke-width' is always non-zero, since otherwise it
    // won't be possible to open/close the popup (note e.g. issue 11122).
    circle.setAttribute( "stroke-width", (borderWidth || 1).toString() );
    circle.setAttribute( "stroke", "transparent" );
    circle.setAttribute("fill", "transparent");

    svg.appendChild(circle);
    this.container!.append(svg);

    // Create the popup ourselves so that we can bind it to the circle instead
    // of to the entire container (which is the default).
    this._createPopup(circle, data);

    return this.container!;
  }
}

class PolylineAnnotationElement extends AnnotationElement 
{
  containerClassName = "polylineAnnotation";
  svgElementName:keyof SVGElementTagNameMap = "polyline";

  constructor( parameters:AnnotationElementParms ) 
  {
    const isRenderable = !!(
      parameters.data.hasPopup ||
      parameters.data.titleObj?.str ||
      parameters.data.contentsObj?.str ||
      parameters.data.richText?.str
    );
    super(parameters, { isRenderable, ignoreBorder: true });
  }

  override render()
  {
    this.container!.className = this.containerClassName;

    // Create an invisible polyline with the same points that acts as the
    // trigger for the popup. Only the polyline itself should trigger the
    // popup, not the entire container.
    const data = this.data;
    const { width, height } = getRectDims(data.rect);
    const svg = this.svgFactory.create(width, height);

    // Convert the vertices array to a single points string that the SVG
    // polyline element expects ("x1,y1 x2,y2 ..."). PDF coordinates are
    // calculated from a bottom left origin, so transform the polyline
    // coordinates to a top left origin for the SVG element.
    let points:string | string[] = [];
    for( const coordinate of data.vertices! )
    {
      const x = coordinate.x - data.rect[0];
      const y = data.rect[3] - coordinate.y;
      points.push( `${x},${y}` );
    }
    points = points.join(" ");

    const polyline = createSVG( this.svgElementName );
    polyline.setAttribute("points", points);
    // Ensure that the 'stroke-width' is always non-zero, since otherwise it
    // won't be possible to open/close the popup (note e.g. issue 11122).
    polyline.setAttribute( "stroke-width", <any>(data.borderStyle.width || 1) );
    polyline.setAttribute( "stroke", "transparent" );
    polyline.setAttribute( "fill", "transparent" );

    svg.appendChild(polyline);
    this.container!.append(svg);

    // Create the popup ourselves so that we can bind it to the polyline
    // instead of to the entire container (which is the default).
    this._createPopup(polyline, data);

    return this.container!;
  }
}

class PolygonAnnotationElement extends PolylineAnnotationElement 
{
  override containerClassName = "polygonAnnotation";
  override svgElementName = <const>"polygon";

  constructor( parameters:AnnotationElementParms )
  {
    // Polygons are specific forms of polylines, so reuse their logic.
    super( parameters );
  }
}

class CaretAnnotationElement extends AnnotationElement 
{
  constructor( parameters:AnnotationElementParms ) 
  {
    const isRenderable = !!(
      parameters.data.hasPopup ||
      parameters.data.titleObj?.str ||
      parameters.data.contentsObj?.str ||
      parameters.data.richText?.str
    );
    super( parameters, { isRenderable,  ignoreBorder: true });
  }

  override render()
  {
    this.container!.className = "caretAnnotation";

    if (!this.data.hasPopup) {
      this._createPopup( undefined, this.data );
    }
    return this.container!;
  }
}

class InkAnnotationElement extends AnnotationElement 
{
  containerClassName = "inkAnnotation";

  /**
   * Use the polyline SVG element since it allows us to use coordinates
   * directly and to draw both straight lines and curves.
   */
  readonly svgElementName = "polyline";

  constructor( parameters:AnnotationElementParms ) 
  {
    const isRenderable = !!(
      parameters.data.hasPopup ||
      parameters.data.titleObj?.str ||
      parameters.data.contentsObj?.str ||
      parameters.data.richText?.str
    );
    super(parameters, { isRenderable, ignoreBorder: true });
  }

  override render()
  {
    this.container!.className = this.containerClassName;

    // Create an invisible polyline with the same points that acts as the
    // trigger for the popup.
    const data = this.data;
    const { width, height } = getRectDims(data.rect);
    const svg = this.svgFactory.create(width, height);

    for( const inkList of data.inkLists! )
    {
      // Convert the ink list to a single points string that the SVG
      // polyline element expects ("x1,y1 x2,y2 ..."). PDF coordinates are
      // calculated from a bottom left origin, so transform the polyline
      // coordinates to a top left origin for the SVG element.
      let points:string | string[] = [];
      for (const coordinate of inkList) 
      {
        const x = coordinate.x - data.rect[0];
        const y = data.rect[3] - coordinate.y;
        points.push(`${x},${y}`);
      }
      points = points.join(" ");

      const polyline = createSVG( this.svgElementName );
      polyline.setAttribute("points", points);
      // Ensure that the 'stroke-width' is always non-zero, since otherwise it
      // won't be possible to open/close the popup (note e.g. issue 11122).
      polyline.setAttribute( "stroke-width", (data.borderStyle.width || 1).toString() );
      polyline.setAttribute( "stroke", "transparent" );
      polyline.setAttribute( "fill", "transparent" );

      // Create the popup ourselves so that we can bind it to the polyline
      // instead of to the entire container (which is the default).
      this._createPopup(polyline, data);

      svg.appendChild(polyline);
    }

    this.container!.append(svg);
    return this.container!;
  }
}

class HighlightAnnotationElement extends AnnotationElement 
{
  constructor( parameters:AnnotationElementParms ) 
  {
    const isRenderable = !!(
      parameters.data.hasPopup ||
      parameters.data.titleObj?.str ||
      parameters.data.contentsObj?.str ||
      parameters.data.richText?.str
    );
    super( parameters, {
      isRenderable,
      ignoreBorder: true,
      createQuadrilaterals: true,
    });
  }

  override render()
  {
    if (!this.data.hasPopup) {
      this._createPopup( undefined, this.data );
    }

    if (this.quadrilaterals) {
      return this._renderQuadrilaterals("highlightAnnotation");
    }

    this.container!.className = "highlightAnnotation";
    return this.container!;
  }
}

class UnderlineAnnotationElement extends AnnotationElement 
{
  constructor( parameters:AnnotationElementParms ) 
  {
    const isRenderable = !!(
      parameters.data.hasPopup ||
      parameters.data.titleObj?.str ||
      parameters.data.contentsObj?.str ||
      parameters.data.richText?.str
    );
    super( parameters, {
      isRenderable,
      ignoreBorder: true,
      createQuadrilaterals: true,
    });
  }

  override render() 
  {
    if( !this.data.hasPopup )
    {
      this._createPopup( undefined, this.data );
    }

    if( this.quadrilaterals )
    {
      return this._renderQuadrilaterals("underlineAnnotation");
    }

    this.container!.className = "underlineAnnotation";
    return this.container!;
  }
}

class SquigglyAnnotationElement extends AnnotationElement 
{
  constructor( parameters:AnnotationElementParms ) 
  {
    const isRenderable = !!(
      parameters.data.hasPopup ||
      parameters.data.titleObj?.str ||
      parameters.data.contentsObj?.str ||
      parameters.data.richText?.str
    );
    super(parameters, {
      isRenderable,
      ignoreBorder: true,
      createQuadrilaterals: true,
    });
  }

  override render()
  {
    if (!this.data.hasPopup) {
      this._createPopup( undefined, this.data );
    }

    if (this.quadrilaterals) {
      return this._renderQuadrilaterals("squigglyAnnotation");
    }

    this.container!.className = "squigglyAnnotation";
    return this.container!;
  }
}

class StrikeOutAnnotationElement extends AnnotationElement 
{
  constructor( parameters:AnnotationElementParms ) 
  {
    const isRenderable = !!(
      parameters.data.hasPopup ||
      parameters.data.titleObj?.str ||
      parameters.data.contentsObj?.str ||
      parameters.data.richText?.str
    );
    super( parameters, {
      isRenderable,
      ignoreBorder: true,
      createQuadrilaterals: true,
    });
  }

  override render()
  {
    if (!this.data.hasPopup) 
    {
      this._createPopup( undefined, this.data );
    }

    if (this.quadrilaterals) 
    {
      return this._renderQuadrilaterals("strikeoutAnnotation");
    }

    this.container!.className = "strikeoutAnnotation";
    return this.container!;
  }
}

class StampAnnotationElement extends AnnotationElement 
{
  constructor( parameters:AnnotationElementParms ) 
  {
    const isRenderable = !!(
      parameters.data.hasPopup ||
      parameters.data.titleObj?.str ||
      parameters.data.contentsObj?.str ||
      parameters.data.richText?.str
    );
    super( parameters, { isRenderable,  ignoreBorder: true });
  }

  override render()
  {
    this.container!.className = "stampAnnotation";

    if (!this.data.hasPopup) 
    {
      this._createPopup( undefined, this.data );
    }
    return this.container!;
  }
}

export class FileAttachmentAnnotationElement extends AnnotationElement 
{
  filename;
  content;

  constructor( parameters:AnnotationElementParms ) 
  {
    super( parameters, { isRenderable: true } );

    const { filename, content } = this.data.file!;
    this.filename = getFilenameFromUrl( filename );
    this.content = content;

    this.linkService.eventBus?.dispatch("fileattachmentannotation", {
      source: this,
      id: stringToPDFString(filename),
      filename,
      content,
    });
  }

  override render()
  {
    this.container!.className = "fileAttachmentAnnotation";

    const trigger = div();
    trigger.style.height = this.container!.style.height;
    trigger.style.width = this.container!.style.width;
    trigger.addEventListener( "dblclick", this.#download );

    if( !this.data.hasPopup
     && (this.data.titleObj?.str ||
      this.data.contentsObj?.str ||
      this.data.richText)
    ) {
      this._createPopup(trigger, this.data);
    }

    this.container!.appendChild(trigger);
    return this.container!;
  }

  /**
   * Download the file attachment associated with this annotation.
   */
  #download = () => 
  {
    this.downloadManager?.openOrDownloadData(
      this.container!,
      this.content,
      this.filename
    );
  }
}
/*81---------------------------------------------------------------------------*/

interface AnnotationLayerParms 
{
  viewport:PageViewport;
  div:HTMLDivElement;
  annotations:AnnotationData[];
  page:PDFPageProxy;

  /**
   * Path for image resources, mainly
   * for annotation icons. Include trailing slash.
   */
  imageResourcesPath?:string | undefined;

  renderForms:boolean;
  linkService:IPDFLinkService;
  downloadManager:IDownloadManager | undefined;
  annotationStorage?:AnnotationStorage | undefined;

  /**
   * Enable embedded script execution.
   */
  enableScripting:boolean;

  /**
   * Some fields have JS actions.
   * The default value is `false`.
   */
  hasJSActions:boolean;

  fieldObjects:Record<string, FieldObject[]> | undefined;
  
  mouseState?:MouseState | undefined;

  annotationCanvasMap?:Map<string, HTMLCanvasElement>;
}

export interface AnnotStorageValue
{
  value?:string | string[] | number | boolean | null | undefined;
  valueAsString?:string | string[] | undefined;
  formattedValue?:string | undefined;
  hidden?:boolean;
  items?:Item[];
  print?:boolean;
}
export type ASVKey = keyof AnnotStorageValue;
export type AnnotStorageRecord = Map<string, AnnotStorageValue>;

export class AnnotationLayer 
{
  /**
   * Render a new annotation layer with all annotation elements.
   */
  static render( parameters:AnnotationLayerParms ) 
  {
    const sortedAnnotations:AnnotationData[] = [];
    const popupAnnotations:AnnotationData[] = [];
    // Ensure that Popup annotations are handled last, since they're dependant
    // upon the parent annotation having already been rendered (please refer to
    // the `PopupAnnotationElement.render` method); fixes issue 11362.
    for( const data of parameters.annotations )
    {
      if( !data ) continue;

      const { width, height } = getRectDims(data.rect);
      if( width <= 0 || height <= 0 ) continue;

      if( data.annotationType === AnnotationType.POPUP )
      {
        popupAnnotations.push(data);
        continue;
      }
      sortedAnnotations.push(data);
    }
    if (popupAnnotations.length) 
    {
      sortedAnnotations.push(...popupAnnotations);
    }

    const div = parameters.div;

    for( const data of sortedAnnotations )
    {
      const element = AnnotationElementFactory.create({
        data,
        layer: div,
        page: parameters.page,
        viewport: parameters.viewport,
        linkService: parameters.linkService,
        downloadManager: parameters.downloadManager,
        imageResourcesPath: parameters.imageResourcesPath || "",
        renderForms: parameters.renderForms !== false,
        svgFactory: new DOMSVGFactory(),
        annotationStorage:
          parameters.annotationStorage || new AnnotationStorage(),
        enableScripting: parameters.enableScripting,
        hasJSActions: parameters.hasJSActions,
        fieldObjects: parameters.fieldObjects,
        mouseState: parameters.mouseState || { isDown: false },
      });
      if( element.isRenderable )
      {
        const rendered = element.render();
        if( data.hidden )
        {
          (<HSElement>rendered).style.visibility = "hidden";
        }
        if( Array.isArray(rendered) )
        {
          for (const renderedElement of rendered) 
          {
            div.appendChild(renderedElement);
          }
        } 
        else {
          if( element instanceof PopupAnnotationElement )
          {
            // Popup annotation elements should not be on top of other
            // annotation elements to prevent interfering with mouse events.
            div.prepend(rendered);
          } 
          else {
            div.appendChild(rendered);
          }
        }
      }
    }

    this.#setAnnotationCanvasMap(div, parameters.annotationCanvasMap);
  }

  /**
   * Update the annotation elements on existing annotation layer.
   */
  static update( parameters:AnnotationLayerParms ) 
  {
    const { page, viewport, annotations, annotationCanvasMap, div } =
      parameters;
    const transform = viewport.transform;
    const matrix = `matrix(${transform.join(",")})`;

    let scale:number, ownMatrix;
    for (const data of annotations) 
    {
      const elements = div.querySelectorAll(
        `[data-annotation-id="${data.id}"]`
      );
      if( elements )
      {
        for (const element of elements) 
        {
          if( data.hasOwnCanvas )
          {
            const rect = Util.normalizeRect([
              data.rect[0],
              page.view[3] - data.rect[1] + page.view[1],
              data.rect[2],
              page.view[3] - data.rect[3] + page.view[1],
            ]);

            if( !ownMatrix )
            {
              // When an annotation has its own canvas, then
              // the scale has been already applied to the canvas,
              // so we musn't scale it twice.
              scale = Math.abs(transform[0] || transform[1]);
              const ownTransform = transform.slice();
              for (let i = 0; i < 4; i++) 
              {
                ownTransform[i] = Math.sign(ownTransform[i]);
              }
              ownMatrix = `matrix(${ownTransform.join(",")})`;
            }

            const left = rect[0] * scale!;
            const top = rect[1] * scale!;
            (<HTMLElement>element).style.left = `${left}px`;
            (<HTMLElement>element).style.top = `${top}px`;
            (<HTMLElement>element).style.transformOrigin = `${-left}px ${-top}px`;
            (<HTMLElement>element).style.transform = ownMatrix;
          } 
          else {
            (<HTMLElement>element).style.transform = matrix;
          }
        }
      }
    }

    this.#setAnnotationCanvasMap(div, annotationCanvasMap);
    div.hidden = false;
  }

  static #setAnnotationCanvasMap( 
    div:HTMLDivElement, annotationCanvasMap?:Map<string, HTMLCanvasElement> )
  {
    if( !annotationCanvasMap ) return;
    
    for (const [id, canvas] of annotationCanvasMap) 
    {
      const element = div.querySelector(`[data-annotation-id="${id}"]`);
      if( !element ) continue;
      
      const { firstChild } = <HTMLElement>element;
      if( firstChild!.nodeName === "CANVAS" )
      {
        element.replaceChild( canvas, firstChild! );
      } 
      else {
        element.insertBefore(canvas, firstChild);
      }
    }
    annotationCanvasMap.clear();
  }
}
/*81---------------------------------------------------------------------------*/
