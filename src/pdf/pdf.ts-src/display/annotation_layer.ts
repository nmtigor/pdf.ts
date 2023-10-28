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
// eslint-disable-next-line max-len
/** @typedef {import("../../web/text_accessibility.js").TextAccessibilityManager} TextAccessibilityManager */
// eslint-disable-next-line max-len
/** @typedef {import("../../web/interfaces").IDownloadManager} IDownloadManager */
/** @typedef {import("../../web/interfaces").IPDFLinkService} IPDFLinkService */

import type { CSSStyleName, rect_t } from "@fe-lib/alias.ts";
import type { red_t, rgb_t } from "@fe-lib/color/alias.ts";
import type { HSElement } from "@fe-lib/dom.ts";
import { div, html, span, svg as createSVG, textnode } from "@fe-lib/dom.ts";
import { assert, fail } from "@fe-lib/util/trace.ts";
import { GENERIC, MOZCENTRAL, TESTING } from "@fe-src/global.ts";
import type {
  IDownloadManager,
  IL10n,
  IPDFLinkService,
} from "@pdf.ts-web/interfaces.ts";
import type { TextAccessibilityManager } from "@pdf.ts-web/text_accessibility.ts";
import type {
  AnnotationData,
  FieldObject,
  RichText,
} from "../core/annotation.ts";
import type { BidiText } from "../core/bidi.ts";
import type { Destination, SetOCGState } from "../core/catalog.ts";
import type { Attachment } from "../core/file_spec.ts";
import type { Ref } from "../pdf.ts";
import type { ScriptingActionName } from "../scripting_api/common.ts";
import { ColorConverters, type CSTag } from "../shared/scripting_utils.ts";
import type { ActionEventName } from "../shared/util.ts";
import {
  AnnotationBorderStyleType,
  AnnotationEditorType,
  AnnotationPrefix,
  AnnotationType,
  FeatureTest,
  LINE_FACTOR,
  shadow,
  Util,
  warn,
} from "../shared/util.ts";
import { AnnotationStorage } from "./annotation_storage.ts";
import type { MetadataEx, PDFPageProxy } from "./api.ts";
import type { PageViewport } from "./display_utils.ts";
import {
  DOMSVGFactory,
  getFilenameFromUrl,
  PDFDateString,
  setLayerDimensions,
} from "./display_utils.ts";
import { XfaLayer } from "./xfa_layer.ts";
import { Dict } from "../core/primitives.ts";

// Ref. gulpfile.mjs of pdf.js
const { NullL10n } = /*#static*/ GENERIC
  ? await import("@pdf.ts-web/l10n_utils.ts")
  : await import("./stubs.ts");
/*80--------------------------------------------------------------------------*/

const DEFAULT_TAB_INDEX = 1000;
const DEFAULT_FONT_SIZE = 9;
const GetElementsByNameSet = new WeakSet();

function getRectDims(rect: rect_t) {
  return {
    width: rect[2] - rect[0],
    height: rect[3] - rect[1],
  };
}

type Parent_ = {
  page: PDFPageProxy;
  viewport: PageViewport;
  zIndex: number;
  div: HTMLDivElement;
  l10n: IL10n;
  popupShow: (() => void | Promise<void>)[];
};

type AnnotationElementCtorP_ = {
  data: AnnotationData;
  layer?: HTMLDivElement;
  linkService?: IPDFLinkService;
  downloadManager?: IDownloadManager | undefined;

  /**
   * Path for image resources, mainly
   * for annotation icons. Include trailing slash.
   */
  imageResourcesPath?: string;

  renderForms?: boolean;
  svgFactory?: DOMSVGFactory;
  annotationStorage?: AnnotationStorage;

  enableScripting?: boolean;
  hasJSActions?: boolean;
  fieldObjects?: Record<string, FieldObject[]> | undefined;

  parent: Parent_;
  elements: AnnotationElement[];
};

class AnnotationElementFactory {
  static create(parameters: AnnotationElementCtorP_) {
    const subtype = parameters.data.annotationType;

    switch (subtype) {
      case AnnotationType.LINK:
        return new LinkAnnotationElement(parameters);

      case AnnotationType.TEXT:
        return new TextAnnotationElement(parameters);

      case AnnotationType.WIDGET:
        const fieldType = parameters.data.fieldType;

        switch (fieldType) {
          case "Tx":
            return new TextWidgetAnnotationElement(parameters);
          case "Btn":
            if (parameters.data.radioButton) {
              return new RadioButtonWidgetAnnotationElement(parameters);
            } else if (parameters.data.checkBox) {
              return new CheckboxWidgetAnnotationElement(parameters);
            }
            return new PushButtonWidgetAnnotationElement(parameters);
          case "Ch":
            return new ChoiceWidgetAnnotationElement(parameters);
          case "Sig":
            return new SignatureWidgetAnnotationElement(parameters);
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

type ColorConvertersDetail_ = Record<string, [CSTag, ...number[]]>;

export class AnnotationElement {
  isRenderable;
  data;
  layer;
  linkService;
  downloadManager;
  imageResourcesPath;
  renderForms;
  svgFactory;
  annotationStorage;
  enableScripting;
  hasJSActions;
  _fieldObjects;
  parent;
  container!: HTMLElement;
  popup?: PopupElement;
  annotationEditorType?: AnnotationEditorType;

  #hasBorder = false;

  constructor(
    parameters: AnnotationElementCtorP_,
    {
      isRenderable = false,
      ignoreBorder = false,
      createQuadrilaterals = false,
    } = {},
  ) {
    this.isRenderable = isRenderable;
    this.data = parameters.data;
    this.layer = parameters.layer;
    this.linkService = parameters.linkService!;
    this.downloadManager = parameters.downloadManager;
    this.imageResourcesPath = parameters.imageResourcesPath;
    this.renderForms = parameters.renderForms;
    this.svgFactory = parameters.svgFactory!;
    this.annotationStorage = parameters.annotationStorage!;
    this.enableScripting = parameters.enableScripting;
    this.hasJSActions = parameters.hasJSActions;
    this._fieldObjects = parameters.fieldObjects;
    this.parent = parameters.parent;

    if (isRenderable) {
      this.container = this.#createContainer(ignoreBorder);
    }
    if (createQuadrilaterals) {
      this.#createQuadrilaterals();
    }
  }

  static _hasPopupData({ titleObj, contentsObj, richText }: AnnotationData) {
    return !!(titleObj?.str || contentsObj?.str || richText?.str);
  }

  get hasPopupData() {
    return AnnotationElement._hasPopupData(this.data);
  }

  /**
   * Create an empty container for the annotation's HTML element.
   * @return A section element.
   */
  #createContainer(ignoreBorder = false): HTMLElement {
    const { data, parent: { page, viewport } } = this;

    const container = html("section");
    container.setAttribute("data-annotation-id", data.id);
    if (!(this instanceof WidgetAnnotationElement)) {
      container.tabIndex = DEFAULT_TAB_INDEX;
    }

    // The accessibility manager will move the annotation in the DOM in
    // order to match the visual ordering.
    // But if an annotation is above an other one, then we must draw it
    // after the other one whatever the order is in the DOM, hence the
    // use of the z-index.
    container.style.zIndex = this.parent.zIndex++ as any;

    if (this.data.popupRef) {
      container.setAttribute("aria-haspopup", "dialog");
    }

    if (data.noRotate) {
      container.classList.add("norotate");
    }

    const { pageWidth, pageHeight, pageX, pageY } = viewport.rawDims;

    if (!data.rect || this instanceof PopupAnnotationElement) {
      const { rotation } = data;
      if (!data.hasOwnCanvas && rotation !== 0) {
        this.setRotation(rotation, container);
      }
      return container;
    }

    const { width, height } = getRectDims(data.rect);

    // Do *not* modify `data.rect`, since that will corrupt the annotation
    // position on subsequent calls to `#createContainer` (see issue 6804).
    const rect = Util.normalizeRect([
      data.rect[0],
      page.view[3] - data.rect[1] + page.view[1],
      data.rect[2],
      page.view[3] - data.rect[3] + page.view[1],
    ]);

    if (!ignoreBorder && data.borderStyle.width > 0) {
      container.style.borderWidth = `${data.borderStyle.width}px`;

      const horizontalRadius = data.borderStyle.horizontalCornerRadius;
      const verticalRadius = data.borderStyle.verticalCornerRadius;
      if (horizontalRadius > 0 || verticalRadius > 0) {
        const radius =
          `calc(${horizontalRadius}px * var(--scale-factor)) / calc(${verticalRadius}px * var(--scale-factor))`;
        container.style.borderRadius = radius;
      } else if (this instanceof RadioButtonWidgetAnnotationElement) {
        const radius =
          `calc(${width}px * var(--scale-factor)) / calc(${height}px * var(--scale-factor))`;
        container.style.borderRadius = radius;
      }

      switch (data.borderStyle.style) {
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

      const borderColor = data.borderColor || undefined;
      if (borderColor) {
        this.#hasBorder = true;
        container.style.borderColor = Util.makeHexColor(
          borderColor[0] | 0,
          borderColor[1] | 0,
          borderColor[2] | 0,
        );
      } else {
        // Transparent (invisible) border, so do not draw it at all.
        container.style.borderWidth = <any> undefined;
      }
    }

    container.style.left = `${(100 * (rect[0] - pageX)) / pageWidth}%`;
    container.style.top = `${(100 * (rect[1] - pageY)) / pageHeight}%`;

    const { rotation } = data;
    if (data.hasOwnCanvas || rotation === 0) {
      container.style.width = `${(100 * width) / pageWidth}%`;
      container.style.height = `${(100 * height) / pageHeight}%`;
    } else {
      this.setRotation(rotation, container);
    }

    return container;
  }

  setRotation(angle: number, container = this.container) {
    if (!this.data.rect) {
      return;
    }
    const { pageWidth, pageHeight } = this.parent.viewport.rawDims;
    const { width, height } = getRectDims(this.data.rect!);

    let elementWidth, elementHeight;
    if (angle % 180 === 0) {
      elementWidth = (100 * width) / pageWidth;
      elementHeight = (100 * height) / pageHeight;
    } else {
      elementWidth = (100 * height) / pageWidth;
      elementHeight = (100 * width) / pageHeight;
    }

    container.style.width = `${elementWidth}%`;
    container.style.height = `${elementHeight}%`;

    container.setAttribute("data-main-rotation", (360 - angle) % 360 as any);
  }

  get _commonActions() {
    const setColor = (
      jsName: string,
      styleName: CSSStyleName,
      event: CustomEvent<ColorConvertersDetail_>,
    ) => {
      const color = event.detail[jsName];
      const colorType = color[0];
      const colorArray = color.slice(1);
      (event.target as HSElement).style[styleName] = ColorConverters
        [`${colorType}_HTML`](colorArray as any);
      this.annotationStorage.setValue(this.data.id, {
        [styleName]: ColorConverters[`${colorType}_rgb`](colorArray as any),
      });
    };

    return shadow(this, "_commonActions", {
      display: (event: CustomEvent) => {
        const { display } = event.detail;
        // See scripting/constants.js for the values of `Display`.
        // 0 = visible, 1 = hidden, 2 = noPrint and 3 = noView.
        const hidden = display % 2 === 1;
        this.container.style.visibility = hidden ? "hidden" : "visible";
        this.annotationStorage.setValue(this.data.id, {
          noView: hidden,
          noPrint: display === 1 || display === 2,
        });
      },
      print: (event: CustomEvent) => {
        this.annotationStorage.setValue(this.data.id, {
          noPrint: !event.detail.print,
        });
      },
      hidden: (event: CustomEvent) => {
        const { hidden } = event.detail;
        this.container.style.visibility = hidden ? "hidden" : "visible";
        this.annotationStorage.setValue(this.data.id, {
          noPrint: hidden,
          noView: hidden,
        });
      },
      focus: (event: CustomEvent) => {
        setTimeout(
          () => (<HSElement> event.target).focus({ preventScroll: false }),
          0,
        );
      },
      userName: (event: CustomEvent) => {
        // tooltip
        (event.target as HTMLElement).title = event.detail.userName;
      },
      readonly: (event: CustomEvent<{ readonly: boolean }>) => {
        (event.target as any).disabled = event.detail.readonly;
      },
      required: (event: CustomEvent<{ required: boolean }>) => {
        this._setRequired(event.target as HTMLElement, event.detail.required);
      },
      bgColor: (event: CustomEvent<ColorConvertersDetail_>) => {
        setColor("bgColor", "backgroundColor", event);
      },
      fillColor: (event: CustomEvent<ColorConvertersDetail_>) => {
        setColor("fillColor", "backgroundColor", event);
      },
      fgColor: (event: CustomEvent<ColorConvertersDetail_>) => {
        setColor("fgColor", "color", event);
      },
      textColor: (event: CustomEvent<ColorConvertersDetail_>) => {
        setColor("textColor", "color", event);
      },
      borderColor: (event: CustomEvent<ColorConvertersDetail_>) => {
        setColor("borderColor", "borderColor", event);
      },
      strokeColor: (event: CustomEvent<ColorConvertersDetail_>) => {
        setColor("strokeColor", "borderColor", event);
      },
      rotation: (event: CustomEvent<{ rotation: number }>) => {
        const angle = event.detail.rotation;
        this.setRotation(angle);
        this.annotationStorage.setValue(this.data.id, {
          rotation: angle,
        });
      },
    });
  }

  _dispatchEventFromSandbox(actions: Actions, jsEvent: CustomEvent) {
    const commonActions = this._commonActions;
    for (const name of Object.keys(jsEvent.detail)) {
      const action = actions[<keyof Actions> name] ||
        commonActions[<CommonActionNames> name];
      action?.(jsEvent);
    }
  }

  _setDefaultPropertiesFromJS(element: HTMLElement) {
    if (!this.enableScripting) {
      return;
    }

    // Some properties may have been updated thanks to JS.
    const storedData = this.annotationStorage.getRawValue(this.data.id);
    if (!storedData) {
      return;
    }

    const commonActions = this._commonActions;
    for (const [actionName, detail] of Object.entries(storedData)) {
      const action = commonActions[actionName as CommonActionNames];
      if (action) {
        const eventProxy = {
          detail: {
            [actionName]: detail,
          },
          target: element,
        };
        action(eventProxy as any);
        // The action has been consumed: no need to keep it.
        delete (storedData as any)[actionName];
      }
    }
  }

  /**
   * Create quadrilaterals from the annotation's quadpoints.
   */
  #createQuadrilaterals(): void {
    // if (!this.data.quadPoints) {
    //   return undefined;
    // }

    // const quadrilaterals: HTMLElement[] = [];
    // const savedRect = this.data.rect;
    // let firstQuadRect: rect_t | undefined;
    // for (const quadPoint of this.data.quadPoints) {
    //   this.data.rect = [
    //     quadPoint[2].x,
    //     quadPoint[2].y,
    //     quadPoint[1].x,
    //     quadPoint[1].y,
    //   ];
    //   quadrilaterals.push(this.#createContainer(ignoreBorder));
    //   firstQuadRect ||= this.data.rect;
    // }
    // this.data.rect = savedRect;
    // this.firstQuadRect = firstQuadRect;
    // return quadrilaterals;

    if (!this.container) {
      return;
    }
    const { quadPoints } = this.data;
    if (!quadPoints) {
      return;
    }

    const [rectBlX, rectBlY, rectTrX, rectTrY] = this.data.rect!;

    if (quadPoints.length === 1) {
      const [, { x: trX, y: trY }, { x: blX, y: blY }] = quadPoints[0];
      if (
        rectTrX === trX &&
        rectTrY === trY &&
        rectBlX === blX &&
        rectBlY === blY
      ) {
        // The quadpoints cover the whole annotation rectangle, so no need to
        // create a quadrilateral.
        return;
      }
    }

    const { style } = this.container;
    let svgBuffer: string[] | undefined;
    if (this.#hasBorder) {
      const { borderColor, borderWidth } = style;
      style.borderWidth = 0 as any;
      svgBuffer = [
        "url('data:image/svg+xml;utf8,",
        `<svg xmlns="http://www.w3.org/2000/svg"`,
        ` preserveAspectRatio="none" viewBox="0 0 1 1">`,
        `<g fill="transparent" stroke="${borderColor}" stroke-width="${borderWidth}">`,
      ];
      this.container.classList.add("hasBorder");
    }

    /*#static*/ if (TESTING) {
      this.container.classList.add("hasClipPath");
    }

    const width = rectTrX - rectBlX;
    const height = rectTrY - rectBlY;

    // const { svgFactory } = this;
    const svg = createSVG("svg");
    svg.classList.add("quadrilateralsContainer");
    svg.assignAttro({
      width: 0,
      height: 0,
    });
    const defs = createSVG("defs");
    svg.append(defs);
    const clipPath = createSVG("clipPath");
    const id = `clippath_${this.data.id}`;
    clipPath.assignAttro({
      id,
      clipPathUnits: "objectBoundingBox",
    });
    defs.append(clipPath);

    for (const [, { x: trX, y: trY }, { x: blX, y: blY }] of quadPoints) {
      const rect = createSVG("rect");
      const x = (blX - rectBlX) / width;
      const y = (rectTrY - trY) / height;
      const rectWidth = (trX - blX) / width;
      const rectHeight = (trY - blY) / height;
      rect.assignAttro({
        x: x,
        y: y,
        width: rectWidth,
        height: rectHeight,
      });
      clipPath.append(rect);
      svgBuffer?.push(
        `<rect vector-effect="non-scaling-stroke" x="${x}" y="${y}" width="${rectWidth}" height="${rectHeight}"/>`,
      );
    }

    if (this.#hasBorder) {
      svgBuffer!.push(`</g></svg>')`);
      style.backgroundImage = svgBuffer!.join("");
    }

    this.container.append(svg);
    this.container.style.clipPath = `url(#${id})`;
  }

  /**
   * Create a popup for the annotation's HTML element. This is used for
   * annotations that do not have a Popup entry in the dictionary, but
   * are of a type that works with popups (such as Highlight annotations).
   */
  protected _createPopup() {
    const { container, data } = this;
    container.setAttribute("aria-haspopup", "dialog");

    const popup = new PopupAnnotationElement({
      data: {
        color: data.color,
        titleObj: data.titleObj,
        modificationDate: data.modificationDate,
        contentsObj: data.contentsObj,
        richText: data.richText,
        parentRect: data.rect,
        // borderStyle: 0,
        id: `popup_${data.id}`,
        rotation: data.rotation,
      } as AnnotationData,
      parent: this.parent,
      elements: [this],
    });
    this.parent.div.append(popup.render());
  }

  /**
   * Render the annotation's HTML element(s).
   *
   * @return A section element or an array of section elements.
   */
  render(): HTMLElement | HTMLElement[] | undefined {
    fail("Abstract method `AnnotationElement.render` called");
  }

  protected _getElementsByName(name: string, skipId?: string) {
    const fields = [];

    if (this._fieldObjects) {
      const fieldObj = this._fieldObjects[name];
      if (fieldObj) {
        for (const { page, id, exportValues } of fieldObj) {
          if (page === -1) {
            continue;
          }
          if (id === skipId) {
            continue;
          }
          const exportValue = typeof exportValues === "string"
            ? exportValues
            : undefined;

          const domElement = document.querySelector(
            `[data-element-id="${id}"]`,
          );
          if (domElement && !GetElementsByNameSet.has(domElement)) {
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
    for (const domElement of document.getElementsByName(name)) {
      const { exportValue } = domElement as any;
      const id = domElement.getAttribute("data-element-id");
      if (id === skipId) {
        continue;
      }
      if (!GetElementsByNameSet.has(domElement)) {
        continue;
      }
      fields.push({ id, exportValue, domElement });
    }
    return fields;
  }

  _setRequired(lement: HTMLElement, isRequired: boolean) {
    assert(0);
  }

  show() {
    if (this.container) {
      this.container.hidden = false;
    }
    this.popup?.maybeShow();
  }

  hide() {
    if (this.container) {
      this.container.hidden = true;
    }
    this.popup?.forceHide();
  }

  /**
   * Get the HTML element(s) which can trigger a popup when clicked or hovered.
   *
   * @return An array of elements or an element.
   */
  getElementsToTriggerPopup(): HSElement[] | HSElement {
    return this.container;
  }

  addHighlightArea() {
    const triggers = this.getElementsToTriggerPopup();
    if (Array.isArray(triggers)) {
      for (const element of triggers) {
        element.classList.add("highlightArea");
      }
    } else {
      triggers.classList.add("highlightArea");
    }
  }

  protected editOnDoubleClick$() {
    const {
      annotationEditorType: mode,
      data: { id: editId },
    } = this;
    this.container.on("dblclick", () => {
      this.linkService.eventBus?.dispatch("switchannotationeditormode", {
        source: this,
        mode,
        editId,
      });
    });
  }
}

type CommonActionNames =
  keyof typeof AnnotationElement.prototype._commonActions;

export interface ResetForm {
  fields: string[];
  refs: string[];
  include: boolean;
}

class LinkAnnotationElement extends AnnotationElement {
  isTooltipOnly;

  constructor(
    parameters: AnnotationElementCtorP_,
    options?: { ignoreBorder: boolean },
  ) {
    super(parameters, {
      isRenderable: true,
      ignoreBorder: !!options?.ignoreBorder,
      createQuadrilaterals: true,
    });
    this.isTooltipOnly = parameters.data.isTooltipOnly;
  }

  override render() {
    const { data, linkService } = this;
    const link = html("a");
    link.setAttribute("data-element-id", data.id);
    let isBound = false;

    if (data.url) {
      linkService.addLinkAttributes(link, data.url, data.newWindow);
      isBound = true;
    } else if (data.action) {
      this.#bindNamedAction(link, data.action);
      isBound = true;
    } else if (data.attachment) {
      this._bindAttachment(link, data.attachment);
      isBound = true;
    } else if (data.setOCGState) {
      this.#bindSetOCGState(link, data.setOCGState);
      isBound = true;
    } else if (data.dest) {
      this.#bindLink(link, data.dest);
      isBound = true;
    } else {
      if (
        data.actions &&
        (data.actions.Action ||
          data.actions["Mouse Up"] ||
          data.actions["Mouse Down"]) &&
        this.enableScripting &&
        this.hasJSActions
      ) {
        this.#bindJSAction(link, data);
        isBound = true;
      }

      if (data.resetForm) {
        this.#bindResetFormAction(link, data.resetForm);
        isBound = true;
      } else if (this.isTooltipOnly && !isBound) {
        this.#bindLink(link, "");
        isBound = true;
      }
    }

    this.container.classList.add("linkAnnotation");
    if (isBound) {
      this.container.append(link);
    }

    return this.container;
  }

  #setInternalLink() {
    this.container.setAttribute("data-internal-link", "");
  }

  /**
   * Bind internal links to the link element.
   */
  #bindLink(link: HTMLAnchorElement, destination?: Destination) {
    link.href = this.linkService.getDestinationHash(destination);
    link.onclick = () => {
      if (destination) {
        this.linkService.goToDestination(destination);
      }
      return false;
    };
    if (destination || destination === /* isTooltipOnly = */ "") {
      this.#setInternalLink();
    }
  }

  /**
   * Bind named actions to the link element.
   */
  #bindNamedAction(link: HTMLAnchorElement, action: string) {
    link.href = this.linkService.getAnchorUrl("");
    link.onclick = () => {
      this.linkService.executeNamedAction(action);
      return false;
    };
    this.#setInternalLink();
  }

  /**
   * Bind attachments to the link element.
   */
  _bindAttachment(link: HTMLAnchorElement, attachment: Attachment) {
    link.href = this.linkService.getAnchorUrl("");
    link.onclick = () => {
      this.downloadManager?.openOrDownloadData(
        this.container,
        attachment.content!,
        attachment.filename,
      );
      return false;
    };
    this.#setInternalLink();
  }

  /**
   * Bind SetOCGState actions to the link element.
   */
  #bindSetOCGState(link: HTMLAnchorElement, action: SetOCGState) {
    link.href = this.linkService.getAnchorUrl("");
    link.onclick = () => {
      this.linkService.executeSetOCGState(action);
      return false;
    };
    this.#setInternalLink();
  }

  /**
   * Bind JS actions to the link element.
   */
  #bindJSAction(link: HTMLAnchorElement, data: AnnotationData) {
    link.href = this.linkService.getAnchorUrl("");
    const map = new Map([
      ["Action", "onclick"],
      ["Mouse Up", "onmouseup"],
      ["Mouse Down", "onmousedown"],
    ]);
    for (const name of Object.keys(data.actions!)) {
      const jsName = map.get(name);
      if (!jsName) {
        continue;
      }
      (link as any)[jsName] = () => {
        this.linkService.eventBus?.dispatch("dispatcheventinsandbox", {
          source: this,
          detail: {
            id: data.id,
            name: name as ActionEventName,
          },
        });
        return false;
      };
    }

    if (!link.onclick) {
      link.onclick = () => false;
    }
    this.#setInternalLink();
  }

  #bindResetFormAction(link: HTMLAnchorElement, resetForm: ResetForm) {
    const otherClickAction = link.onclick as () => void;
    if (!otherClickAction) {
      link.href = this.linkService.getAnchorUrl("");
    }
    this.#setInternalLink();

    if (!this._fieldObjects) {
      warn(
        `#bindResetFormAction - "resetForm" action not supported, ` +
          "ensure that the `fieldObjects` parameter is provided.",
      );
      if (!otherClickAction) {
        link.onclick = () => false;
      }
      return;
    }

    link.onclick = () => {
      otherClickAction?.();

      const {
        fields: resetFormFields,
        refs: resetFormRefs,
        include,
      } = resetForm;

      const allFields = [];
      if (resetFormFields.length !== 0 || resetFormRefs.length !== 0) {
        const fieldIds = new Set(resetFormRefs);
        for (const fieldName of resetFormFields) {
          const fields = this._fieldObjects![fieldName] || [];
          for (const { id } of fields) {
            fieldIds.add(id);
          }
        }
        for (const fields of Object.values(this._fieldObjects!)) {
          for (const field of fields) {
            if (fieldIds.has(field.id) === include) {
              allFields.push(field);
            }
          }
        }
      } else {
        for (const fields of Object.values(this._fieldObjects!)) {
          allFields.push(...fields);
        }
      }

      const storage = this.annotationStorage;
      const allIds = [];
      for (const field of allFields) {
        const { id } = field;
        allIds.push(id);
        switch (field.type) {
          case "text": {
            const value = field.defaultValue || "";
            storage.setValue(id, { value });
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

        const domElement = document.querySelector(`[data-element-id="${id}"]`);
        if (!domElement) {
          continue;
        } else if (!GetElementsByNameSet.has(domElement)) {
          warn(`_bindResetFormAction - element not allowed: ${id}`);
          continue;
        }
        domElement.dispatchEvent(new Event("resetform"));
      }

      if (this.enableScripting) {
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

class TextAnnotationElement extends AnnotationElement {
  constructor(parameters: AnnotationElementCtorP_) {
    super(parameters, { isRenderable: true });
  }

  override render() {
    this.container.classList.add("textAnnotation");

    const image = html("img");
    image.src = this.imageResourcesPath +
      "annotation-" +
      this.data.name!.toLowerCase() +
      ".svg";
    image.alt = "[{{type}} Annotation]";
    image.dataset.l10nId = "text_annotation_type";
    image.dataset.l10nArgs = JSON.stringify({ type: this.data.name });

    if (!this.data.popupRef && this.hasPopupData) {
      this._createPopup();
    }

    this.container.append(image);
    return this.container;
  }
}

type Action = (event: CustomEvent) => void;
interface Actions {
  value: Action;

  charLimit?: Action;
  clear?: Action;
  editable?: Action;
  formattedValue?: Action;
  indices?: Action;
  insert?: Action;
  items?: Action;
  multipleSelection?: Action;
  remove?: Action;
  selRange?: Action;
}

class WidgetAnnotationElement extends AnnotationElement {
  override render() {
    // Show only the container for unsupported field types.
    if (this.data.alternativeText) {
      this.container.title = this.data.alternativeText;
    }

    return this.container;
  }

  showElementAndHideCanvas(element: HTMLElement) {
    if (this.data.hasOwnCanvas) {
      if (element.previousSibling?.nodeName === "CANVAS") {
        (element.previousSibling as HTMLElement).hidden = true;
      }
      element.hidden = false;
    }
  }

  #getKeyModifier(event: MouseEvent) {
    const { isWin, isMac } = FeatureTest.platform;
    return (isWin && event.ctrlKey) || (isMac && event.metaKey);
  }

  #setEventListener(
    element: HTMLElement,
    elementData: { focused: boolean },
    baseName: string,
    eventName: ScriptingActionName,
    valueGetter?: (event: Event) => string | number | boolean,
  ) {
    if (baseName.includes("mouse")) {
      // Mouse events
      element.addEventListener(baseName, (event: Event) => {
        this.linkService.eventBus?.dispatch("dispatcheventinsandbox", {
          source: this,
          detail: {
            id: this.data.id,
            name: eventName,
            value: valueGetter!(event),
            shift: (event as MouseEvent).shiftKey,
            modifier: this.#getKeyModifier(event as MouseEvent),
          },
        });
      });
    } else {
      // Non-mouse events
      element.addEventListener(baseName, (event: Event) => {
        if (baseName === "blur") {
          if (!elementData.focused || !(event as FocusEvent).relatedTarget) {
            return;
          }
          elementData.focused = false;
        } else if (baseName === "focus") {
          if (elementData.focused) {
            return;
          }
          elementData.focused = true;
        }

        if (!valueGetter) {
          return;
        }

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

  _setEventListeners(
    element: HTMLElement,
    elementData: { focused: boolean } | undefined,
    names: [string, string][],
    getter: (event: Event) => string | number | boolean,
  ) {
    for (const [baseName, eventName] of names) {
      if (
        eventName === "Action" ||
        this.data.actions?.[eventName as ActionEventName]
      ) {
        if (eventName === "Focus" || eventName === "Blur") {
          elementData ||= { focused: false };
        }
        this.#setEventListener(
          element,
          elementData!,
          baseName,
          eventName as ScriptingActionName,
          getter,
        );
        if (eventName === "Focus" && !this.data.actions?.Blur) {
          // Ensure that elementData will have the correct value.
          this.#setEventListener(element, elementData!, "blur", "Blur");
        } else if (eventName === "Blur" && !this.data.actions?.Focus) {
          this.#setEventListener(element, elementData!, "focus", "Focus");
        }
      }
    }
  }

  _setBackgroundColor(element: HTMLElement) {
    const color = this.data.backgroundColor || undefined;
    element.style.backgroundColor = color === undefined
      ? "transparent"
      : Util.makeHexColor(color[0], color[1], color[2]);
  }

  /**
   * Apply text styles to the text in the element.
   */
  protected _setTextStyle(element: HTMLElement) {
    const TEXT_ALIGNMENT = ["left", "center", "right"];
    const { fontColor } = this.data.defaultAppearanceData!;
    const fontSize = this.data.defaultAppearanceData!.fontSize ||
      DEFAULT_FONT_SIZE;

    const style = element.style;

    // TODO: If the font-size is zero, calculate it based on the height and
    //       width of the element.
    // Not setting `style.fontSize` will use the default font-size for now.

    // We don't use the font, as specified in the PDF document, for the <input>
    // element. Hence using the original `fontSize` could look bad, which is why
    // it's instead based on the field height.
    // If the height is "big" then it could lead to a too big font size
    // so in this case use the one we've in the pdf (hence the min).
    let computedFontSize;
    const BORDER_SIZE = 2;
    const roundToOneDecimal = (x: number) => Math.round(10 * x) / 10;
    if (this.data.multiLine) {
      const height = Math.abs(
        this.data.rect![3] - this.data.rect![1] - BORDER_SIZE,
      );
      const numberOfLines = Math.round(height / (LINE_FACTOR * fontSize)) || 1;
      const lineHeight = height / numberOfLines;
      computedFontSize = Math.min(
        fontSize,
        roundToOneDecimal(lineHeight / LINE_FACTOR),
      );
    } else {
      const height = Math.abs(
        this.data.rect![3] - this.data.rect![1] - BORDER_SIZE,
      );
      computedFontSize = Math.min(
        fontSize,
        roundToOneDecimal(height / LINE_FACTOR),
      );
    }
    style.fontSize = `calc(${computedFontSize}px * var(--scale-factor))`;

    style.color = Util.makeHexColor(
      fontColor![0],
      fontColor![1],
      fontColor![2],
    );

    if (this.data.textAlignment !== undefined) {
      style.textAlign = TEXT_ALIGNMENT[this.data.textAlignment!];
    }
  }

  override _setRequired(
    element: HTMLTextAreaElement | HTMLInputElement | HTMLSelectElement,
    isRequired: boolean,
  ) {
    if (isRequired) {
      element.setAttribute("required", true as any);
    } else {
      element.removeAttribute("required");
    }
    element.setAttribute("aria-required", isRequired as any);
  }
}

type ElementData_ = {
  userValue: string;
  formattedValue: string | undefined;
  lastCommittedValue?: string | undefined;
  commitKey: number;
  focused: boolean;
};

class TextWidgetAnnotationElement extends WidgetAnnotationElement {
  constructor(parameters: AnnotationElementCtorP_) {
    const isRenderable = parameters.renderForms ||
      (!parameters.data.hasAppearance && !!parameters.data.fieldValue);
    super(parameters, { isRenderable });
  }

  setPropertyOnSiblings(
    base: HTMLTextAreaElement | HTMLInputElement,
    key: string,
    value: string,
    keyInStorage: string,
  ) {
    const storage = this.annotationStorage;
    for (
      const element of this._getElementsByName(
        base.name,
        /* skipId = */ base.id,
      )
    ) {
      if (element.domElement) {
        (element.domElement as any)[key] = value;
      }
      storage.setValue(element.id!, { [keyInStorage]: value });
    }
  }

  override render() {
    const storage = this.annotationStorage!;
    const id = this.data.id;

    this.container.classList.add("textWidgetAnnotation");

    let element: HTMLElement;
    if (this.renderForms) {
      // NOTE: We cannot set the values using `element.value` below, since it
      //       prevents the AnnotationLayer rasterizer in `test/driver.js`
      //       from parsing the elements correctly for the reference tests.
      const storedData = storage.getValue(id, {
        value: this.data.fieldValue,
      });
      let textContent = storedData.value as string || "";
      const maxLen = storage.getValue(id, {
        charLimit: this.data.maxLen,
      }).charLimit;
      if (maxLen && textContent.length > maxLen) {
        textContent = textContent.slice(0, maxLen);
      }

      let fieldFormattedValues = storedData.formattedValue ||
        this.data.textContent?.join("\n") || undefined;
      if (fieldFormattedValues && this.data.comb) {
        fieldFormattedValues = fieldFormattedValues.replaceAll(/\s+/g, "");
      }

      const elementData: ElementData_ = {
        userValue: textContent,
        formattedValue: fieldFormattedValues,
        commitKey: 1,
        focused: false,
      };

      if (this.data.multiLine) {
        element = html("textarea");
        element.textContent = fieldFormattedValues ?? textContent;
        if (this.data.doNotScroll) {
          element.style.overflowY = "hidden";
        }
      } else {
        element = html("input");
        (element as HTMLInputElement).type = "text";
        element.setAttribute("value", fieldFormattedValues ?? textContent);
        if (this.data.doNotScroll) {
          element.style.overflowX = "hidden";
        }
      }
      type El = HTMLTextAreaElement | HTMLInputElement;
      if (this.data.hasOwnCanvas) {
        element.hidden = true;
      }
      GetElementsByNameSet.add(element);
      element.setAttribute("data-element-id", id);

      (element as El).disabled = this.data.readOnly!;
      (element as El).name = this.data.fieldName!;
      element.tabIndex = DEFAULT_TAB_INDEX;

      this._setRequired(element as El, this.data.required!);

      if (maxLen) {
        (element as El).maxLength = maxLen;
      }

      element.on("input", (event) => {
        storage.setValue(id, { value: (event.target as El).value });
        this.setPropertyOnSiblings(
          <HTMLTextAreaElement | HTMLInputElement> element,
          "value",
          (event.target as El).value,
          "value",
        );
        elementData.formattedValue = undefined;
      });

      element.addEventListener("resetform", (event) => {
        const defaultValue = this.data.defaultFieldValue as string ?? "";
        (element as El).value = elementData.userValue = defaultValue;
        elementData.formattedValue = undefined;
      });

      let blurListener = (event: FocusEvent) => {
        const { formattedValue } = elementData;
        if (formattedValue !== null && formattedValue !== undefined) {
          (event.target as El).value = formattedValue;
        }
        // Reset the cursor position to the start of the field (issue 12359).
        (event.target as El).scrollLeft = 0;
      };

      if (this.enableScripting && this.hasJSActions) {
        element.on("focus", (event) => {
          if (elementData.focused) {
            return;
          }
          const { target } = event;
          if (elementData.userValue) {
            (target as El).value = elementData.userValue;
          }
          elementData.lastCommittedValue = (target as El).value;
          elementData.commitKey = 1;
          elementData.focused = true;
        });

        element.addEventListener("updatefromsandbox", (jsEvent: Event) => {
          this.showElementAndHideCanvas(jsEvent.target as HTMLElement);
          const actions: Actions = {
            value(event) {
              elementData.userValue = event.detail.value ?? "";
              storage.setValue(id, {
                value: elementData.userValue!.toString(),
              });
              (event.target as El).value = elementData.userValue!;
            },
            formattedValue(event) {
              const { formattedValue } = event.detail;
              elementData.formattedValue = formattedValue;
              if (
                formattedValue !== null &&
                formattedValue !== undefined &&
                event.target !== document.activeElement
              ) {
                // Input hasn't the focus so display formatted string
                (event.target as El).value = formattedValue;
              }
              storage.setValue(id, {
                formattedValue,
              });
            },
            selRange(event) {
              (event.target as El).setSelectionRange(
                ...<[any, any]> event.detail.selRange,
              );
            },
            charLimit: (event) => {
              const { charLimit } = event.detail;
              const { target } = event;
              if (charLimit === 0) {
                (target as El).removeAttribute("maxLength");
                return;
              }

              (target as El).setAttribute("maxLength", charLimit);
              let value = elementData.userValue;
              if (!value || value.length <= charLimit) {
                return;
              }
              value = value.slice(0, charLimit);
              (target as El).value = elementData.userValue = value;
              storage.setValue(id, { value });

              this.linkService.eventBus?.dispatch("dispatcheventinsandbox", {
                source: this,
                detail: {
                  id,
                  name: "Keystroke",
                  value,
                  willCommit: true,
                  commitKey: 1,
                  selStart: (target as El).selectionStart,
                  selEnd: (target as El).selectionEnd,
                },
              });
            },
          };
          this._dispatchEventFromSandbox(actions, <CustomEvent> jsEvent);
        });

        // Even if the field hasn't any actions
        // leaving it can still trigger some actions with Calculate
        element.on("keydown", (event) => {
          elementData.commitKey = 1;
          // If the key is one of Escape, Enter then the data are committed.
          // If we've a Tab then data will be committed on blur.
          let commitKey = -1;
          if (event.key === "Escape") {
            commitKey = 0;
          } else if (event.key === "Enter" && !this.data.multiLine) {
            // When we've a multiline field, "Enter" key is a key as the other
            // hence we don't commit the data (Acrobat behaves the same way)
            // (see issue #15627).
            commitKey = 2;
          } else if (event.key === "Tab") {
            elementData.commitKey = 3;
          }
          if (commitKey === -1) {
            return;
          }
          const { value } = event.target as El;
          if (elementData.lastCommittedValue === value) {
            return;
          }
          elementData.lastCommittedValue = value;
          // Save the entered value
          elementData.userValue = value;
          this.linkService.eventBus?.dispatch("dispatcheventinsandbox", {
            source: this,
            detail: {
              id,
              name: "Keystroke",
              value,
              willCommit: true,
              commitKey,
              selStart: (event.target as El).selectionStart,
              selEnd: (event.target as El).selectionEnd,
            },
          });
        });
        const _blurListener = blurListener;
        blurListener = undefined as any;
        element.on("blur", (event) => {
          if (!elementData.focused || !event.relatedTarget) {
            return;
          }
          elementData.focused = false;
          const { value } = event.target as El;
          elementData.userValue = value;
          if (elementData.lastCommittedValue !== value) {
            this.linkService.eventBus?.dispatch("dispatcheventinsandbox", {
              source: this,
              detail: {
                id,
                name: "Keystroke",
                value,
                willCommit: true,
                commitKey: elementData.commitKey,
                selStart: (event.target as El).selectionStart,
                selEnd: (event.target as El).selectionEnd,
              },
            });
          }
          _blurListener(event);
        });

        if (this.data.actions?.Keystroke) {
          element.on("beforeinput", (event) => {
            elementData.lastCommittedValue = undefined;
            const { data, target } = event;
            const { value, selectionStart, selectionEnd } = target as El;

            let selStart = selectionStart!,
              selEnd = selectionEnd!;

            switch (event.inputType) {
              // https://rawgit.com/w3c/input-events/v1/index.html#interface-InputEvent-Attributes
              case "deleteWordBackward": {
                const match = value
                  .substring(0, selectionStart!)
                  .match(/\w*[^\w]*$/);
                if (match) {
                  selStart -= match[0].length;
                }
                break;
              }
              case "deleteWordForward": {
                const match = value
                  .substring(selectionStart!)
                  .match(/^[^\w]*\w*/);
                if (match) {
                  selEnd += match[0].length;
                }
                break;
              }
              case "deleteContentBackward":
                if (selectionStart === selectionEnd) {
                  selStart -= 1;
                }
                break;
              case "deleteContentForward":
                if (selectionStart === selectionEnd) {
                  selEnd += 1;
                }
                break;
            }

            // We handle the event ourselves.
            event.preventDefault();
            this.linkService.eventBus?.dispatch("dispatcheventinsandbox", {
              source: this,
              detail: {
                id,
                name: "Keystroke",
                value,
                change: data || "",
                willCommit: false,
                selStart,
                selEnd,
              },
            });
          });
        }

        this._setEventListeners(
          element,
          elementData,
          [
            ["focus", "Focus"],
            ["blur", "Blur"],
            ["mousedown", "Mouse Down"],
            ["mouseenter", "Mouse Enter"],
            ["mouseleave", "Mouse Exit"],
            ["mouseup", "Mouse Up"],
          ],
          (event) => (event.target as El).value,
        );
      }

      if (blurListener) {
        element.on("blur", blurListener);
      }

      if (this.data.comb) {
        const fieldWidth = this.data.rect![2] - this.data.rect![0];
        const combWidth = fieldWidth / maxLen!;

        element.classList.add("comb");
        element.style.letterSpacing = `calc(${combWidth}px - 1ch)`;
      }
    } else {
      element = div();
      element.textContent = this.data.fieldValue as string;
      element.style.verticalAlign = "middle";
      element.style.display = "table-cell";
    }

    this._setTextStyle(element);
    this._setBackgroundColor(element);
    this._setDefaultPropertiesFromJS(element);

    this.container.append(element);
    return this.container;
  }
}

class SignatureWidgetAnnotationElement extends WidgetAnnotationElement {
  constructor(parameters: AnnotationElementCtorP_) {
    super(parameters, { isRenderable: !!parameters.data.hasOwnCanvas });
  }
}

class CheckboxWidgetAnnotationElement extends WidgetAnnotationElement {
  constructor(parameters: AnnotationElementCtorP_) {
    super(parameters, { isRenderable: parameters.renderForms });
  }

  override render() {
    const storage = this.annotationStorage!;
    const data = this.data;
    const id = data.id;
    let value = storage.getValue(id, {
      value: data.exportValue === data.fieldValue,
    }).value;
    if (typeof value === "string") {
      // The value has been changed through js and set in annotationStorage.
      value = value !== "Off";
      storage.setValue(id, { value });
    }

    this.container.classList.add("buttonWidgetAnnotation", "checkBox");

    const element = html("input");
    type El = typeof element;
    GetElementsByNameSet.add(element);
    element.setAttribute("data-element-id", id);

    element.disabled = data.readOnly!;
    this._setRequired(element, this.data.required!);
    element.type = "checkbox";
    element.name = data.fieldName!;
    if (value) {
      element.setAttribute("checked", true as any);
    }
    element.setAttribute("exportValue", data.exportValue!);
    element.tabIndex = DEFAULT_TAB_INDEX;

    element.on("change", (event) => {
      const { name, checked } = event.target as El;
      for (const checkbox of this._getElementsByName(name, /* skipId = */ id)) {
        const curChecked = checked && checkbox.exportValue === data.exportValue;
        if (checkbox.domElement) {
          (checkbox.domElement as El).checked = curChecked;
        }
        storage.setValue(checkbox.id!, { value: curChecked });
      }
      storage.setValue(id, { value: checked });
    });

    element.addEventListener("resetform", (event) => {
      const defaultValue = data.defaultFieldValue || "Off";
      (event.target as El).checked = defaultValue === data.exportValue;
    });

    if (this.enableScripting && this.hasJSActions) {
      element.addEventListener("updatefromsandbox", (jsEvent: Event) => {
        const actions: Actions = {
          value(event) {
            (event.target as El).checked = event.detail.value !== "Off";
            storage.setValue(id, { value: (event.target as El).checked });
          },
        };
        this._dispatchEventFromSandbox(actions, <CustomEvent> jsEvent);
      });

      this._setEventListeners(
        element,
        undefined,
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
        (event) => (event.target as El).checked,
      );
    }

    this._setBackgroundColor(element);
    this._setDefaultPropertiesFromJS(element);

    this.container.append(element);
    return this.container;
  }
}

class RadioButtonWidgetAnnotationElement extends WidgetAnnotationElement {
  constructor(parameters: AnnotationElementCtorP_) {
    super(parameters, { isRenderable: parameters.renderForms });
  }

  override render() {
    this.container.classList.add("buttonWidgetAnnotation", "radioButton");
    const storage = this.annotationStorage!;
    const data = this.data;
    const id = data.id;
    let value = storage.getValue(id, {
      value: data.fieldValue === data.buttonValue,
    }).value;
    if (typeof value === "string") {
      // The value has been changed through js and set in annotationStorage.
      value = value !== data.buttonValue;
      storage.setValue(id, { value });
    }

    const element = html("input");
    type El = typeof element;
    GetElementsByNameSet.add(element);
    element.setAttribute("data-element-id", id);

    element.disabled = data.readOnly!;
    this._setRequired(element, this.data.required!);
    element.type = "radio";
    element.name = data.fieldName!;
    if (value) {
      element.setAttribute("checked", true as any);
    }
    element.tabIndex = DEFAULT_TAB_INDEX;

    element.on("change", (event) => {
      const { name, checked } = event.target as El;
      for (const radio of this._getElementsByName(name, /* skipId = */ id)) {
        storage.setValue(radio.id!, { value: false });
      }
      storage.setValue(id, { value: checked });
    });

    element.addEventListener("resetform", (event) => {
      const defaultValue = data.defaultFieldValue;
      (event.target as El).checked = defaultValue !== null &&
        defaultValue !== undefined &&
        defaultValue === data.buttonValue;
    });

    if (this.enableScripting && this.hasJSActions) {
      const pdfButtonValue = data.buttonValue;
      element.addEventListener("updatefromsandbox", (jsEvent: Event) => {
        const actions: Actions = {
          value: (event) => {
            const checked = pdfButtonValue === event.detail.value;
            for (
              const radio of this._getElementsByName((event.target as El).name)
            ) {
              const curChecked = checked && radio.id === id;
              if (radio.domElement) {
                (radio.domElement as HTMLInputElement).checked = curChecked;
              }
              storage.setValue(radio.id!, { value: curChecked });
            }
          },
        };
        this._dispatchEventFromSandbox(actions, <CustomEvent> jsEvent);
      });

      this._setEventListeners(
        element,
        undefined,
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
        (event) => (event.target as El).checked,
      );
    }

    this._setBackgroundColor(element);
    this._setDefaultPropertiesFromJS(element);

    this.container.append(element);
    return this.container;
  }
}

class PushButtonWidgetAnnotationElement extends LinkAnnotationElement {
  constructor(parameters: AnnotationElementCtorP_) {
    super(parameters, { ignoreBorder: parameters.data.hasAppearance });
  }

  override render() {
    // The rendering and functionality of a push button widget annotation is
    // equal to that of a link annotation, but may have more functionality, such
    // as performing actions on form fields (resetting, submitting, et cetera).
    const container = super.render() as HTMLElement;
    container.classList.add("buttonWidgetAnnotation", "pushButton");

    if (this.data.alternativeText) {
      container.title = this.data.alternativeText;
    }

    const linkElement = container.lastChild;
    if (this.enableScripting && this.hasJSActions && linkElement) {
      this._setDefaultPropertiesFromJS(linkElement as HTMLElement);

      linkElement.addEventListener("updatefromsandbox", (jsEvent) => {
        this._dispatchEventFromSandbox({} as Actions, jsEvent as CustomEvent);
      });
    }

    return container;
  }
}

interface Item {
  displayValue: string | null;
  exportValue: string;
}

class ChoiceWidgetAnnotationElement extends WidgetAnnotationElement {
  constructor(parameters: AnnotationElementCtorP_) {
    super(parameters, {
      isRenderable: parameters.renderForms,
    });
  }

  override render() {
    this.container.classList.add("choiceWidgetAnnotation");
    const storage = this.annotationStorage!;
    const id = this.data.id;

    const storedData = storage.getValue(id, {
      value: this.data.fieldValue,
    });

    const selectElement = html("select");
    type El = typeof selectElement;
    GetElementsByNameSet.add(selectElement);
    selectElement.setAttribute("data-element-id", id);

    selectElement.disabled = this.data.readOnly!;
    this._setRequired(selectElement, this.data.required!);
    selectElement.name = this.data.fieldName!;
    selectElement.tabIndex = DEFAULT_TAB_INDEX;

    let addAnEmptyEntry = this.data.combo && this.data.options!.length > 0;

    if (!this.data.combo) {
      // List boxes have a size and (optionally) multiple selection.
      selectElement.size = this.data.options!.length;
      if (this.data.multiSelect) {
        selectElement.multiple = true;
      }
    }

    selectElement.addEventListener("resetform", (event) => {
      const defaultValue = this.data.defaultFieldValue;
      for (const option of selectElement.options) {
        option.selected = option.value === defaultValue;
      }
    });

    // Insert the options into the choice field.
    for (const option of this.data.options!) {
      const optionElement = html("option");
      optionElement.textContent = option.displayValue as string;
      optionElement.value = option.exportValue as string;
      if (
        (storedData.value as string[]).includes(option.exportValue as string)
      ) {
        optionElement.setAttribute("selected", true as any);
        addAnEmptyEntry = false;
      }
      selectElement.append(optionElement);
    }

    let removeEmptyEntry: (() => void) | undefined;
    if (addAnEmptyEntry) {
      const noneOptionElement = html("option");
      noneOptionElement.value = " ";
      noneOptionElement.setAttribute("hidden", true as any);
      noneOptionElement.setAttribute("selected", true as any);
      selectElement.prepend(noneOptionElement);

      removeEmptyEntry = () => {
        noneOptionElement.remove();
        selectElement.off("input", removeEmptyEntry!);
        removeEmptyEntry = undefined;
      };
      selectElement.on("input", removeEmptyEntry);
    }

    const getValue = (isExport?: boolean) => {
      const name = isExport ? "value" : "textContent";
      const { options, multiple } = selectElement;
      if (!multiple) {
        return options.selectedIndex === -1
          ? undefined
          : options[options.selectedIndex][name] ?? undefined;
      }
      return Array.prototype.filter
        .call(options, (option: HTMLOptionElement) => option.selected)
        .map((option: HTMLOptionElement) => option[name]!);
    };

    let selectedValues = getValue(/* isExport */ false);

    const getItems = (event: Event) => {
      const options = (event.target as El).options;
      return <Item[]> Array.prototype.map.call(
        options,
        (option: HTMLOptionElement) => {
          return {
            displayValue: option.textContent,
            exportValue: option.value,
          };
        },
      );
    };

    if (this.enableScripting && this.hasJSActions) {
      selectElement.addEventListener("updatefromsandbox", (jsEvent: Event) => {
        const actions: Actions = {
          value(event) {
            removeEmptyEntry?.();
            const value = event.detail.value;
            const values = new Set(Array.isArray(value) ? value : [value]);
            for (const option of selectElement.options) {
              option.selected = values.has(option.value);
            }
            storage.setValue(id, {
              value: getValue(/* isExport */ true),
            });
            selectedValues = getValue(/* isExport */ false);
          },
          multipleSelection(event) {
            selectElement.multiple = true;
          },
          remove(event) {
            const options = selectElement.options;
            const index = event.detail.remove;
            options[index].selected = false;
            selectElement.remove(index);
            if (options.length > 0) {
              const i = Array.prototype.findIndex.call(
                options,
                (option) => option.selected,
              );
              if (i === -1) {
                options[0].selected = true;
              }
            }
            storage.setValue(id, {
              value: getValue(/* isExport */ true),
              items: getItems(event),
            });
            selectedValues = getValue(/* isExport */ false);
          },
          clear(event) {
            while (selectElement.length !== 0) {
              selectElement.remove(0);
            }
            storage.setValue(id, { value: undefined, items: [] });
            selectedValues = getValue(/* isExport */ false);
          },
          insert(event) {
            const { index, displayValue, exportValue } = event.detail.insert;
            const selectChild = selectElement.children[index];
            const optionElement = html("option");
            optionElement.textContent = displayValue;
            optionElement.value = exportValue;

            if (selectChild) {
              selectChild.before(optionElement);
            } else {
              selectElement.append(optionElement);
            }
            storage.setValue(id, {
              value: getValue(/* isExport */ true),
              items: getItems(event),
            });
            selectedValues = getValue(/* isExport */ false);
          },
          items(event) {
            const { items } = event.detail;
            while (selectElement.length !== 0) {
              selectElement.remove(0);
            }
            for (const item of items) {
              const { displayValue, exportValue } = item;
              const optionElement = html("option");
              optionElement.textContent = displayValue;
              optionElement.value = exportValue;
              selectElement.append(optionElement);
            }
            if (selectElement.options.length > 0) {
              selectElement.options[0].selected = true;
            }
            storage.setValue(id, {
              value: getValue(/* isExport */ true),
              items: getItems(event),
            });
            selectedValues = getValue(/* isExport */ false);
          },
          indices(event) {
            const indices = new Set(event.detail.indices);
            for (const option of (event.target as El).options) {
              option.selected = indices.has(option.index);
            }
            storage.setValue(id, {
              value: getValue(/* isExport */ true),
            });
            selectedValues = getValue(/* isExport */ false);
          },
          editable(event) {
            (event.target as El).disabled = !event.detail.editable;
          },
        };
        this._dispatchEventFromSandbox(actions, <CustomEvent> jsEvent);
      });

      selectElement.on("input", (event) => {
        const exportValue = getValue(/* isExport */ true);
        storage.setValue(id, { value: exportValue });

        event.preventDefault();

        this.linkService.eventBus?.dispatch("dispatcheventinsandbox", {
          source: this,
          detail: {
            id,
            name: "Keystroke",
            value: selectedValues,
            changeEx: exportValue,
            willCommit: false,
            commitKey: 1,
            keyDown: false,
          },
        });
      });

      this._setEventListeners(
        selectElement,
        undefined,
        [
          ["focus", "Focus"],
          ["blur", "Blur"],
          ["mousedown", "Mouse Down"],
          ["mouseenter", "Mouse Enter"],
          ["mouseleave", "Mouse Exit"],
          ["mouseup", "Mouse Up"],
          ["input", "Action"],
          ["input", "Validate"],
        ],
        (event) => (event.target as El).value,
      );
    } else {
      selectElement.on("input", (event) => {
        storage.setValue(id, { value: getValue(/* isExport */ true) });
      });
    }

    if (this.data.combo) {
      this._setTextStyle(selectElement);
    } else {
      // Just use the default font size...
      // it's a bit hard to guess what is a good size.
    }
    this._setBackgroundColor(selectElement);
    this._setDefaultPropertiesFromJS(selectElement);

    this.container.append(selectElement);
    return this.container;
  }
}

class PopupAnnotationElement extends AnnotationElement {
  elements;

  constructor(parameters: AnnotationElementCtorP_) {
    const { data, elements } = parameters;
    super(parameters, { isRenderable: AnnotationElement._hasPopupData(data) });
    this.elements = elements;
  }

  override render() {
    this.container.classList.add("popupAnnotation");

    const popup = new PopupElement({
      container: this.container,
      color: this.data.color,
      titleObj: this.data.titleObj,
      modificationDate: this.data.modificationDate,
      contentsObj: this.data.contentsObj,
      richText: this.data.richText,
      rect: this.data.rect,
      parentRect: this.data.parentRect,
      parent: this.parent,
      elements: this.elements,
      open: this.data.open,
    });

    const elementIds = [];
    for (const element of this.elements) {
      element.popup = popup;
      elementIds.push(element.data.id);
      element.addHighlightArea();
    }

    this.container.setAttribute(
      "aria-controls",
      elementIds.map((id) => `${AnnotationPrefix}${id}`).join(","),
    );

    return this.container;
  }
}

interface PopupElementCtorP_ {
  container: HTMLElement;
  color: Uint8ClampedArray | undefined;
  titleObj: BidiText | undefined;
  modificationDate: string | undefined;
  contentsObj: BidiText;
  richText: RichText | undefined;
  rect: rect_t | undefined;
  parentRect: rect_t | undefined;
  parent: Parent_;
  elements: AnnotationElement[];
  open: boolean | undefined;
}

class PopupElement {
  #dateTimePromise;
  #color;
  #container;
  #contentsObj;
  #elements;
  #parent;
  #parentRect;
  #pinned = false;
  #popup: HTMLDivElement | undefined;
  #rect;
  #richText;
  #titleObj;
  #wasVisible = false;

  trigger;

  constructor({
    container,
    color,
    elements,
    titleObj,
    modificationDate,
    contentsObj,
    richText,
    parent,
    rect,
    parentRect,
    open,
  }: PopupElementCtorP_) {
    this.#container = container;
    this.#titleObj = titleObj;
    this.#contentsObj = contentsObj;
    this.#richText = richText;
    this.#parent = parent;
    this.#color = color;
    this.#rect = rect;
    this.#parentRect = parentRect;
    this.#elements = elements;

    const dateObject = PDFDateString.toDateObject(modificationDate);
    if (dateObject) {
      // The modification date is shown in the popup instead of the creation
      // date if it is available and can be parsed correctly, which is
      // consistent with other viewers such as Adobe Acrobat.
      this.#dateTimePromise = parent.l10n.get("annotation_date_string", {
        date: dateObject.toLocaleDateString(),
        time: dateObject.toLocaleTimeString(),
      });
    }

    this.trigger = elements.flatMap((e) => e.getElementsToTriggerPopup());
    // Attach the event listeners to the trigger element.
    for (const element of this.trigger) {
      element.on("click", this.#toggle);
      element.on("mouseenter", this.#show);
      element.on("mouseleave", this.#hide);
      element.classList.add("popupTriggerArea");
    }

    // Attach the event listener to toggle the popup with the keyboard.
    for (const element of elements) {
      element.container?.on("keydown", this.#keyDown);
    }

    this.#container.hidden = true;
    if (open) {
      this.#toggle();
    }

    /*#static*/ if (TESTING) {
      // Since the popup is lazily created, we need to ensure that it'll be
      // created and displayed during reference tests.
      this.#parent.popupShow.push(async () => {
        if (this.#container.hidden) {
          this.#show();
        }
        if (this.#dateTimePromise) {
          await this.#dateTimePromise;
        }
      });
    }
  }

  /** @implement */
  render() {
    if (this.#popup) {
      return;
    }

    const {
      page: { view },
      viewport: {
        rawDims: { pageWidth, pageHeight, pageX, pageY },
      },
    } = this.#parent;
    const popup = (this.#popup = div());
    popup.className = "popup";

    if (this.#color) {
      const baseColor = (popup.style.outlineColor = Util.makeHexColor(
        // ...this.#color,
        this.#color[0],
        this.#color[1],
        this.#color[2],
      ));
      if (
        MOZCENTRAL ||
        CSS.supports("background-color", "color-mix(in srgb, red 30%, white)")
      ) {
        popup.style.backgroundColor =
          `color-mix(in srgb, ${baseColor} 30%, white)`;
      } else {
        // color-mix isn't supported in some browsers hence this version.
        // See https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix#browser_compatibility
        // TODO: Use color-mix when it's supported everywhere.
        // Enlighten the color.
        const BACKGROUND_ENLIGHT = 0.7;
        const rgb_: red_t[] = [];
        for (const c of this.#color) {
          rgb_.push(Math.floor(BACKGROUND_ENLIGHT * (255 - c) + c));
        }
        popup.style.backgroundColor = Util.makeHexColor(...rgb_ as rgb_t);
      }
    }

    const header = span();
    header.className = "header";
    const title = html("h1");
    header.append(title);
    ({ dir: title.dir, str: title.textContent } = this.#titleObj!);
    popup.append(header);

    if (this.#dateTimePromise) {
      const modificationDate = span();
      modificationDate.classList.add("popupDate");
      this.#dateTimePromise.then((localized) => {
        modificationDate.textContent = localized;
      });
      header.append(modificationDate);
    }

    const contentsObj = this.#contentsObj;
    const richText = this.#richText;
    if (
      richText?.str &&
      (!contentsObj?.str || contentsObj.str === richText.str)
    ) {
      XfaLayer.render({
        xfaHtml: richText.html,
        intent: "richText",
        div: popup,
      });
      (popup.lastChild as HTMLElement).classList.add(
        "richText",
        "popupContent",
      );
    } else {
      const contents = this.#formatContents(contentsObj);
      popup.append(contents);
    }

    let useParentRect = !!this.#parentRect;
    let rect = useParentRect ? this.#parentRect : this.#rect;
    for (const element of this.#elements) {
      if (!rect || Util.intersect(element.data.rect!, rect) !== null) {
        rect = element.data.rect;
        useParentRect = true;
        break;
      }
    }

    const normalizedRect = Util.normalizeRect([
      rect![0],
      view[3] - rect![1] + view[1],
      rect![2],
      view[3] - rect![3] + view[1],
    ]);

    const HORIZONTAL_SPACE_AFTER_ANNOTATION = 5;
    const parentWidth = useParentRect
      ? rect![2] - rect![0] + HORIZONTAL_SPACE_AFTER_ANNOTATION
      : 0;
    const popupLeft = normalizedRect[0] + parentWidth;
    const popupTop = normalizedRect[1];

    const { style } = this.#container;
    style.left = `${(100 * (popupLeft - pageX)) / pageWidth}%`;
    style.top = `${(100 * (popupTop - pageY)) / pageHeight}%`;

    this.#container.append(popup);
  }

  /**
   * Format the contents of the popup by adding newlines where necessary.
   */
  #formatContents({ str, dir }: BidiText): HTMLParagraphElement {
    const p = html("p");
    p.classList.add("popupContent");
    p.dir = dir;
    const lines = str.split(/(?:\r\n?|\n)/);
    for (let i = 0, ii = lines.length; i < ii; ++i) {
      const line = lines[i];
      p.append(textnode(line));
      if (i < ii - 1) {
        p.append(html("br"));
      }
    }
    return p;
  }

  #keyDown(event: KeyboardEvent) {
    if (event.altKey || event.shiftKey || event.ctrlKey || event.metaKey) {
      return;
    }

    if (event.key === "Enter" || (event.key === "Escape" && this.#pinned)) {
      this.#toggle();
    }
  }

  /**
   * Toggle the visibility of the popup.
   */
  #toggle = () => {
    this.#pinned = !this.#pinned;
    if (this.#pinned) {
      this.#show();
      this.#container.on("click", this.#toggle);
      this.#container.on("keydown", this.#keyDown);
    } else {
      this.#hide();
      this.#container.off("click", this.#toggle);
      this.#container.off("keydown", this.#keyDown);
    }
  };

  /**
   * Show the popup.
   */
  #show = () => {
    if (!this.#popup) {
      this.render();
    }
    if (!this.isVisible) {
      this.#container.hidden = false;
      this.#container.style
        .zIndex = parseInt(this.#container.style.zIndex) + 1000 as any;
    } else if (this.#pinned) {
      this.#container.classList.add("focused");
    }
  };

  /**
   * Hide the popup.
   */
  #hide = () => {
    this.#container.classList.remove("focused");
    if (this.#pinned || !this.isVisible) {
      return;
    }
    this.#container.hidden = true;
    this.#container.style
      .zIndex = parseInt(this.#container.style.zIndex) - 1000 as any;
  };

  forceHide() {
    this.#wasVisible = this.isVisible;
    if (!this.#wasVisible) {
      return;
    }
    this.#container.hidden = true;
  }

  maybeShow() {
    if (!this.#wasVisible) {
      return;
    }
    this.#wasVisible = false;
    this.#container.hidden = false;
  }

  get isVisible() {
    return this.#container.hidden === false;
  }
}

export class FreeTextAnnotationElement extends AnnotationElement {
  textContent;
  textPosition;

  constructor(parameters: AnnotationElementCtorP_) {
    super(parameters, { isRenderable: true, ignoreBorder: true });
    this.textContent = parameters.data.textContent;
    this.textPosition = parameters.data.textPosition;
    this.annotationEditorType = AnnotationEditorType.FREETEXT;
  }

  override render() {
    this.container.classList.add("freeTextAnnotation");

    if (this.textContent) {
      const content = div();
      content.classList.add("annotationTextContent");
      content.setAttribute("role", "comment");
      for (const line of this.textContent) {
        const lineSpan = span();
        lineSpan.textContent = line;
        content.append(lineSpan);
      }
      this.container.append(content);
    }

    if (!this.data.popupRef && this.hasPopupData) {
      this._createPopup();
    }

    this.editOnDoubleClick$();

    return this.container;
  }
}

class LineAnnotationElement extends AnnotationElement {
  #line!: SVGLineElement;

  constructor(parameters: AnnotationElementCtorP_) {
    super(parameters, { isRenderable: true, ignoreBorder: true });
  }

  override render() {
    this.container.classList.add("lineAnnotation");

    // Create an invisible line with the same starting and ending coordinates
    // that acts as the trigger for the popup. Only the line itself should
    // trigger the popup, not the entire container.
    const data = this.data;
    const { width, height } = getRectDims(data.rect!);
    const svg = this.svgFactory.create(
      width,
      height,
      /* skipDimensions = */ true,
    );

    // PDF coordinates are calculated from a bottom left origin, so transform
    // the line coordinates to a top left origin for the SVG element.
    const line = (this.#line = createSVG("line"));
    line.assignAttro({
      x1: data.rect![2] - data.lineCoordinates![0],
      y1: data.rect![3] - data.lineCoordinates![1],
      x2: data.rect![2] - data.lineCoordinates![2],
      y2: data.rect![3] - data.lineCoordinates![3],
      // Ensure that the 'stroke-width' is always non-zero, since otherwise it
      // won't be possible to open/close the popup (note e.g. issue 11122).
      "stroke-width": data.borderStyle.width || 1,
      stroke: "transparent",
      fill: "transparent",
    });

    svg.append(line);
    this.container.append(svg);

    // Create the popup ourselves so that we can bind it to the line instead
    // of to the entire container (which is the default).
    if (!data.popupRef && this.hasPopupData) {
      this._createPopup();
    }

    return this.container;
  }

  override getElementsToTriggerPopup() {
    return this.#line;
  }

  override addHighlightArea() {
    this.container.classList.add("highlightArea");
  }
}

class SquareAnnotationElement extends AnnotationElement {
  #square!: SVGRectElement;

  constructor(parameters: AnnotationElementCtorP_) {
    super(parameters, { isRenderable: true, ignoreBorder: true });
  }

  override render() {
    this.container.classList.add("squareAnnotation");

    // Create an invisible square with the same rectangle that acts as the
    // trigger for the popup. Only the square itself should trigger the
    // popup, not the entire container.
    const data = this.data;
    const { width, height } = getRectDims(data.rect!);
    const svg = this.svgFactory.create(
      width,
      height,
      /* skipDimensions = */ true,
    );

    // The browser draws half of the borders inside the square and half of
    // the borders outside the square by default. This behavior cannot be
    // changed programmatically, so correct for that here.
    const borderWidth = data.borderStyle.width;
    const square = (this.#square = createSVG("rect"));
    square.assignAttro({
      x: borderWidth / 2,
      y: borderWidth / 2,
      width: width - borderWidth,
      height: height - borderWidth,
      // Ensure that the 'stroke-width' is always non-zero, since otherwise it
      // won't be possible to open/close the popup (note e.g. issue 11122).
      "stroke-width": borderWidth || 1,
      stroke: "transparent",
      fill: "transparent",
    });

    svg.append(square);
    this.container.append(svg);

    // Create the popup ourselves so that we can bind it to the square instead
    // of to the entire container (which is the default).
    if (!data.popupRef && this.hasPopupData) {
      this._createPopup();
    }

    return this.container;
  }

  override getElementsToTriggerPopup() {
    return this.#square;
  }

  override addHighlightArea() {
    this.container.classList.add("highlightArea");
  }
}

class CircleAnnotationElement extends AnnotationElement {
  #circle!: SVGEllipseElement;

  constructor(parameters: AnnotationElementCtorP_) {
    super(parameters, { isRenderable: true, ignoreBorder: true });
  }

  override render() {
    this.container.classList.add("circleAnnotation");

    // Create an invisible circle with the same ellipse that acts as the
    // trigger for the popup. Only the circle itself should trigger the
    // popup, not the entire container.
    const data = this.data;
    const { width, height } = getRectDims(data.rect!);
    const svg = this.svgFactory.create(
      width,
      height,
      /* skipDimensions = */ true,
    );

    // The browser draws half of the borders inside the circle and half of
    // the borders outside the circle by default. This behavior cannot be
    // changed programmatically, so correct for that here.
    const borderWidth = data.borderStyle.width;
    const circle = (this.#circle = createSVG("ellipse"));
    circle.assignAttro({
      cx: width / 2,
      cy: height / 2,
      rx: width / 2 - borderWidth / 2,
      ry: height / 2 - borderWidth / 2,
      // Ensure that the 'stroke-width' is always non-zero, since otherwise it
      // won't be possible to open/close the popup (note e.g. issue 11122).
      "stroke-width": borderWidth || 1,
      stroke: "transparent",
      fill: "transparent",
    });

    svg.append(circle);
    this.container.append(svg);

    // Create the popup ourselves so that we can bind it to the circle instead
    // of to the entire container (which is the default).
    if (!data.popupRef && this.hasPopupData) {
      this._createPopup();
    }

    return this.container;
  }

  override getElementsToTriggerPopup() {
    return this.#circle;
  }

  override addHighlightArea() {
    this.container.classList.add("highlightArea");
  }
}

class PolylineAnnotationElement extends AnnotationElement {
  protected readonly containerClassName:
    | "polygonAnnotation"
    | "polylineAnnotation" = "polylineAnnotation";
  protected readonly svgElementName: "polygon" | "polyline" = "polyline";

  #polyline: SVGPolylineElement | undefined;

  constructor(parameters: AnnotationElementCtorP_) {
    super(parameters, { isRenderable: true, ignoreBorder: true });
  }

  override render() {
    this.container.classList.add(this.containerClassName);

    // Create an invisible polyline with the same points that acts as the
    // trigger for the popup. Only the polyline itself should trigger the
    // popup, not the entire container.
    const data = this.data;
    const { width, height } = getRectDims(data.rect!);
    const svg = this.svgFactory.create(
      width,
      height,
      /* skipDimensions = */ true,
    );

    // Convert the vertices array to a single points string that the SVG
    // polyline element expects ("x1,y1 x2,y2 ..."). PDF coordinates are
    // calculated from a bottom left origin, so transform the polyline
    // coordinates to a top left origin for the SVG element.
    let points: string | string[] = [];
    for (const coordinate of data.vertices!) {
      const x = coordinate.x - data.rect![0];
      const y = data.rect![3] - coordinate.y;
      points.push(`${x},${y}`);
    }
    points = points.join(" ");

    const polyline = (this.#polyline = createSVG(this.svgElementName));
    polyline.assignAttro({
      points,
      // Ensure that the 'stroke-width' is always non-zero, since otherwise it
      // won't be possible to open/close the popup (note e.g. issue 11122).
      "stroke-width": data.borderStyle.width || 1,
      stroke: "transparent",
      fill: "transparent",
    });

    svg.append(polyline);
    this.container.append(svg);

    // Create the popup ourselves so that we can bind it to the polyline
    // instead of to the entire container (which is the default).
    if (!data.popupRef && this.hasPopupData) {
      this._createPopup();
    }

    return this.container;
  }

  override getElementsToTriggerPopup() {
    return this.#polyline!;
  }

  override addHighlightArea() {
    this.container.classList.add("highlightArea");
  }
}

class PolygonAnnotationElement extends PolylineAnnotationElement {
  protected override readonly containerClassName = "polygonAnnotation";
  protected override readonly svgElementName = "polygon";

  constructor(parameters: AnnotationElementCtorP_) {
    // Polygons are specific forms of polylines, so reuse their logic.
    super(parameters);
  }
}

class CaretAnnotationElement extends AnnotationElement {
  constructor(parameters: AnnotationElementCtorP_) {
    super(parameters, { isRenderable: true, ignoreBorder: true });
  }

  override render() {
    this.container.classList.add("caretAnnotation");

    if (!this.data.popupRef && this.hasPopupData) {
      this._createPopup();
    }
    return this.container;
  }
}

export class InkAnnotationElement extends AnnotationElement {
  containerClassName = "inkAnnotation";

  /**
   * Use the polyline SVG element since it allows us to use coordinates
   * directly and to draw both straight lines and curves.
   */
  readonly svgElementName = "polyline";

  #polylines: SVGPolylineElement[] = [];

  constructor(parameters: AnnotationElementCtorP_) {
    super(parameters, { isRenderable: true, ignoreBorder: true });
    this.annotationEditorType = AnnotationEditorType.INK;
  }

  override render() {
    this.container.classList.add(this.containerClassName);

    // Create an invisible polyline with the same points that acts as the
    // trigger for the popup.
    const data = this.data;
    const { width, height } = getRectDims(data.rect!);
    const svg = this.svgFactory.create(
      width,
      height,
      /* skipDimensions = */ true,
    );

    for (const inkList of data.inkLists!) {
      // Convert the ink list to a single points string that the SVG
      // polyline element expects ("x1,y1 x2,y2 ..."). PDF coordinates are
      // calculated from a bottom left origin, so transform the polyline
      // coordinates to a top left origin for the SVG element.
      let points: string | string[] = [];
      for (const coordinate of inkList) {
        const x = coordinate.x - data.rect![0];
        const y = data.rect![3] - coordinate.y;
        points.push(`${x},${y}`);
      }
      points = points.join(" ");

      const polyline = createSVG(this.svgElementName);
      this.#polylines.push(polyline);
      polyline.assignAttro({
        points,
        // Ensure that the 'stroke-width' is always non-zero, since otherwise it
        // won't be possible to open/close the popup (note e.g. issue 11122).
        "stroke-width": data.borderStyle.width || 1,
        stroke: "transparent",
        fill: "transparent",
      });

      // Create the popup ourselves so that we can bind it to the polyline
      // instead of to the entire container (which is the default).
      if (!data.popupRef && this.hasPopupData) {
        this._createPopup();
      }

      svg.append(polyline);
    }

    this.container.append(svg);
    return this.container;
  }

  override getElementsToTriggerPopup() {
    return this.#polylines;
  }

  override addHighlightArea() {
    this.container.classList.add("highlightArea");
  }
}

class HighlightAnnotationElement extends AnnotationElement {
  constructor(parameters: AnnotationElementCtorP_) {
    super(parameters, {
      isRenderable: true,
      ignoreBorder: true,
      createQuadrilaterals: true,
    });
  }

  override render() {
    if (!this.data.popupRef && this.hasPopupData) {
      this._createPopup();
    }

    this.container.classList.add("highlightAnnotation");
    return this.container;
  }
}

class UnderlineAnnotationElement extends AnnotationElement {
  constructor(parameters: AnnotationElementCtorP_) {
    super(parameters, {
      isRenderable: true,
      ignoreBorder: true,
      createQuadrilaterals: true,
    });
  }

  override render() {
    if (!this.data.popupRef && this.hasPopupData) {
      this._createPopup();
    }

    this.container.classList.add("underlineAnnotation");
    return this.container;
  }
}

class SquigglyAnnotationElement extends AnnotationElement {
  constructor(parameters: AnnotationElementCtorP_) {
    super(parameters, {
      isRenderable: true,
      ignoreBorder: true,
      createQuadrilaterals: true,
    });
  }

  override render() {
    if (!this.data.popupRef && this.hasPopupData) {
      this._createPopup();
    }

    this.container.classList.add("squigglyAnnotation");
    return this.container;
  }
}

class StrikeOutAnnotationElement extends AnnotationElement {
  constructor(parameters: AnnotationElementCtorP_) {
    super(parameters, {
      isRenderable: true,
      ignoreBorder: true,
      createQuadrilaterals: true,
    });
  }

  override render() {
    if (!this.data.popupRef && this.hasPopupData) {
      this._createPopup();
    }

    this.container.classList.add("strikeoutAnnotation");
    return this.container;
  }
}

export class StampAnnotationElement extends AnnotationElement {
  constructor(parameters: AnnotationElementCtorP_) {
    super(parameters, { isRenderable: true, ignoreBorder: true });
  }

  override render() {
    this.container.classList.add("stampAnnotation");

    if (!this.data.popupRef && this.hasPopupData) {
      this._createPopup();
    }
    return this.container;
  }
}

export class FileAttachmentAnnotationElement extends AnnotationElement {
  filename;
  content;

  #trigger!: HTMLDivElement;

  constructor(parameters: AnnotationElementCtorP_) {
    super(parameters, { isRenderable: true });

    const { filename, content } = this.data.file!;
    this.filename = getFilenameFromUrl(filename, /* onlyStripPath = */ true);
    this.content = content;

    this.linkService.eventBus?.dispatch("fileattachmentannotation", {
      source: this,
      filename,
      content,
    });
  }

  override render() {
    this.container.classList.add("fileAttachmentAnnotation");

    const { container, data } = this;
    let trigger;
    if (data.hasAppearance || data.fillAlpha === 0) {
      trigger = div();
    } else {
      // Unfortunately it seems that it's not clearly specified exactly what
      // names are actually valid, since Table 184 contains:
      //   Conforming readers shall provide predefined icon appearances for at
      //   least the following standard names: GraphPushPin, PaperclipTag.
      //   Additional names may be supported as well. Default value: PushPin.
      trigger = html("img");
      trigger.src = `${this.imageResourcesPath}annotation-${
        /paperclip/i.test(data.name!) ? "paperclip" : "pushpin"
      }.svg`;

      if (data.fillAlpha && data.fillAlpha < 1) {
        // trigger.style = `filter: opacity(${Math.round(
        //   data.fillAlpha * 100
        // )}%);`;
        trigger.style.filter = `opacity(${Math.round(data.fillAlpha * 100)}%)`;

        /*#static*/ if (TESTING) {
          this.container.classList.add("hasFillAlpha");
        }
      }
    }
    trigger.on("dblclick", this.#download);
    this.#trigger = trigger;

    const { isMac } = FeatureTest.platform;
    container.on("keydown", (evt) => {
      if (evt.key === "Enter" && (isMac ? evt.metaKey : evt.ctrlKey)) {
        this.#download();
      }
    });

    if (!data.popupRef && this.hasPopupData) {
      this._createPopup();
    } else {
      trigger.classList.add("popupTriggerArea");
    }

    container.append(trigger);
    return container;
  }

  override getElementsToTriggerPopup() {
    return this.#trigger;
  }

  override addHighlightArea() {
    this.container.classList.add("highlightArea");
  }

  /**
   * Download the file attachment associated with this annotation.
   */
  #download = () => {
    this.downloadManager?.openOrDownloadData(
      this.container,
      this.content!,
      this.filename,
    );
  };
}
/*80--------------------------------------------------------------------------*/

export type AnnotationLayerP = {
  viewport: PageViewport;
  div: HTMLDivElement;
  l10n: IL10n;
  annotations: AnnotationData[];
  page: PDFPageProxy;

  /**
   * Path for image resources, mainly
   * for annotation icons. Include trailing slash.
   */
  imageResourcesPath?: string | undefined;

  renderForms: boolean;
  linkService: IPDFLinkService;
  downloadManager: IDownloadManager | undefined;
  annotationStorage?: AnnotationStorage | undefined;

  /**
   * Enable embedded script execution.
   */
  enableScripting: boolean;

  /**
   * Some fields have JS actions.
   * The default value is `false`.
   */
  hasJSActions: boolean;

  fieldObjects:
    | boolean
    | Record<string, FieldObject[]>
    | MetadataEx
    | undefined;

  annotationCanvasMap: Map<string, HTMLCanvasElement> | undefined;
  accessibilityManager?: TextAccessibilityManager | undefined;
};

export type AccessibilityData = {
  type: "Figure";
  title?: string;
  lang?: string;
  alt: string;
  expanded?: string;
  actualText?: string;
  altText?: string;
  decorative?: boolean;
};

export type StructTreeParent = {
  ref: Ref;
  dict: Dict;
};

export interface AnnotStorageValue {
  accessibilityData?: AccessibilityData;
  annotationType?: AnnotationEditorType;
  annotationEditorType?: AnnotationEditorType;
  bitmap?: ImageBitmap;
  bitmapId?: string | undefined;
  charLimit?: number | undefined;
  color?: Uint8ClampedArray | rgb_t;
  deleted?: boolean;
  formattedValue?: string | undefined;
  fontSize?: number;
  hidden?: boolean;
  id?: string | undefined;
  items?: Item[];
  noPrint?: unknown;
  noView?: unknown;
  opacity?: number;
  pageIndex?: number;
  parentTreeId?: number;
  structTreeParent?: StructTreeParent;
  paths?: {
    bezier: number[];
    points: number[];
  }[];
  print?: boolean;
  rect?: rect_t | undefined;
  ref?: Ref;
  rotation?: number;
  structTreeParentId?: string | undefined;
  thickness?: number;
  user?: string;
  value?: string | string[] | number | boolean | undefined;
  valueAsString?: string | string[] | undefined;
}
export type ASVKey = keyof AnnotStorageValue;
export type AnnotStorageRecord = Map<string, AnnotStorageValue>;

/**
 * Manage the layer containing all the annotations.
 */
export class AnnotationLayer {
  div;
  #accessibilityManager;
  #annotationCanvasMap;
  l10n;
  page;
  viewport;
  zIndex = 0;

  popupShow?: (() => void | Promise<void>)[];

  #editableAnnotations = new Map<string, AnnotationElement>();

  constructor({
    div,
    accessibilityManager,
    annotationCanvasMap,
    l10n,
    page,
    viewport,
  }: AnnotationLayerP) {
    this.div = div;
    this.#accessibilityManager = accessibilityManager;
    this.#annotationCanvasMap = annotationCanvasMap;
    this.l10n = l10n;
    this.page = page;
    this.viewport = viewport;

    /*#static*/ if (GENERIC && !TESTING) {
      this.l10n ||= NullL10n;
    }
    /*#static*/ if (TESTING) {
      // For testing purposes.
      Object.defineProperty(this, "showPopups", {
        value: async () => {
          for (const show of this.popupShow!) {
            await show();
          }
        },
      });
      this.popupShow = [];
    }
  }

  #appendElement(element: HTMLDivElement, id: string) {
    const contentElement = element.firstChild as HTMLDivElement || element;
    contentElement.id = `${AnnotationPrefix}${id}`;

    this.div.append(element);
    this.#accessibilityManager?.moveElementInDOM(
      this.div,
      element,
      contentElement,
      /* isRemovable = */ false,
    );
  }

  /**
   * Render a new annotation layer with all annotation elements.
   */
  async render(params: AnnotationLayerP) {
    const { annotations } = params;
    const layer = this.div;
    setLayerDimensions(layer, this.viewport);

    const popupToElements = new Map<string, AnnotationElement[]>();
    const elementParams = {
      layer,
      linkService: params.linkService,
      downloadManager: params.downloadManager,
      imageResourcesPath: params.imageResourcesPath || "",
      renderForms: params.renderForms !== false,
      svgFactory: new DOMSVGFactory(),
      annotationStorage: params.annotationStorage || new AnnotationStorage(),
      enableScripting: params.enableScripting === true,
      hasJSActions: params.hasJSActions,
      fieldObjects: params.fieldObjects,
    } as AnnotationElementCtorP_;

    for (const data of params.annotations) {
      if (data.noHTML) {
        continue;
      }
      const isPopupAnnotation = data.annotationType === AnnotationType.POPUP;
      if (!isPopupAnnotation) {
        const { width, height } = getRectDims(data.rect!);
        if (width <= 0 || height <= 0) {
          continue; // Ignore empty annotations.
        }
      } else {
        const elements = popupToElements.get(data.id);
        if (!elements) {
          // Ignore popup annotations without a corresponding annotation.
          continue;
        }
        elementParams.elements = elements;
      }
      elementParams.data = data;
      const element = AnnotationElementFactory.create(elementParams);

      if (!element.isRenderable) {
        continue;
      }

      if (!isPopupAnnotation && data.popupRef) {
        const elements = popupToElements.get(data.popupRef);
        if (!elements) {
          popupToElements.set(data.popupRef, [element]);
        } else {
          elements.push(element);
        }
      }

      if (element.annotationEditorType as any > 0) {
        this.#editableAnnotations.set(element.data.id, element);
      }

      const rendered = element.render();
      if (data.hidden) {
        (rendered as HSElement).style.visibility = "hidden";
      }
      this.#appendElement(rendered as HTMLDivElement, data.id);
    }

    this.#setAnnotationCanvasMap();

    await this.l10n!.translate(layer);
  }

  /**
   * Update the annotation elements on existing annotation layer.
   */
  update({ viewport }: AnnotationLayerP) {
    const layer = this.div;
    this.viewport = viewport;
    setLayerDimensions(layer, { rotation: viewport.rotation });

    this.#setAnnotationCanvasMap();
    layer.hidden = false;
  }

  #setAnnotationCanvasMap(
    // div: HTMLDivElement,
    // annotationCanvasMap?: Map<string, HTMLCanvasElement>,
  ) {
    if (!this.#annotationCanvasMap) {
      return;
    }
    const layer = this.div;
    for (const [id, canvas] of this.#annotationCanvasMap) {
      const element = layer.querySelector(`[data-annotation-id="${id}"]`);
      if (!element) {
        continue;
      }

      const { firstChild } = element as HTMLElement;
      if (!firstChild) {
        element.append(canvas);
      } else if (firstChild.nodeName === "CANVAS") {
        firstChild.replaceWith(canvas);
      } else {
        firstChild.before(canvas);
      }
    }
    this.#annotationCanvasMap.clear();
  }

  getEditableAnnotations() {
    return Array.from(this.#editableAnnotations.values());
  }

  getEditableAnnotation(id: string) {
    return this.#editableAnnotations.get(id);
  }
}
/*80--------------------------------------------------------------------------*/
