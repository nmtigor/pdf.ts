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
import { _PDFDEV } from "../../../global.js";
import { div, html, span, svg as createSVG, textnode, } from "../../../lib/dom.js";
import { assert } from "../../../lib/util/trace.js";
import { ColorConverters, } from "../shared/scripting_utils.js";
import { AnnotationBorderStyleType, AnnotationType, FeatureTest, LINE_FACTOR, shadow, Util, warn, } from "../shared/util.js";
import { AnnotationStorage } from "./annotation_storage.js";
import { AnnotationPrefix, DOMSVGFactory, getFilenameFromUrl, PDFDateString, setLayerDimensions, } from "./display_utils.js";
import { XfaLayer } from "./xfa_layer.js";
/*80--------------------------------------------------------------------------*/
const DEFAULT_TAB_INDEX = 1000;
const DEFAULT_FONT_SIZE = 9;
const GetElementsByNameSet = new WeakSet();
function getRectDims(rect) {
    return {
        width: rect[2] - rect[0],
        height: rect[3] - rect[1],
    };
}
class AnnotationElementFactory {
    static create(parameters) {
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
                        }
                        else if (parameters.data.checkBox) {
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
export class AnnotationElement {
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
    container;
    quadrilaterals;
    constructor(parameters, { isRenderable = false, ignoreBorder = false, createQuadrilaterals = false, } = {}) {
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
        if (isRenderable) {
            this.container = this.#createContainer(ignoreBorder);
        }
        if (createQuadrilaterals) {
            this.quadrilaterals = this.#createQuadrilaterals(ignoreBorder);
        }
    }
    /**
     * Create an empty container for the annotation's HTML element.
     * @return A section element.
     */
    #createContainer(ignoreBorder = false) {
        const { data, page, viewport } = this;
        const container = html("section");
        container.setAttribute("data-annotation-id", data.id);
        const { pageWidth, pageHeight, pageX, pageY } = viewport.rawDims;
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
                const radius = `calc(${horizontalRadius}px * var(--scale-factor)) / calc(${verticalRadius}px * var(--scale-factor))`;
                container.style.borderRadius = radius;
            }
            else if (this instanceof RadioButtonWidgetAnnotationElement) {
                const radius = `calc(${width}px * var(--scale-factor)) / calc(${height}px * var(--scale-factor))`;
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
                container.style.borderColor = Util.makeHexColor(borderColor[0] | 0, borderColor[1] | 0, borderColor[2] | 0);
            }
            else {
                // Transparent (invisible) border, so do not draw it at all.
                container.style.borderWidth = undefined;
            }
        }
        container.style.left = `${(100 * (rect[0] - pageX)) / pageWidth}%`;
        container.style.top = `${(100 * (rect[1] - pageY)) / pageHeight}%`;
        const { rotation } = data;
        if (data.hasOwnCanvas || rotation === 0) {
            container.style.width = `${(100 * width) / pageWidth}%`;
            container.style.height = `${(100 * height) / pageHeight}%`;
        }
        else {
            this.setRotation(rotation, container);
        }
        return container;
    }
    setRotation(angle, container = this.container) {
        const { pageWidth, pageHeight } = this.viewport.rawDims;
        const { width, height } = getRectDims(this.data.rect);
        let elementWidth, elementHeight;
        if (angle % 180 === 0) {
            elementWidth = (100 * width) / pageWidth;
            elementHeight = (100 * height) / pageHeight;
        }
        else {
            elementWidth = (100 * height) / pageWidth;
            elementHeight = (100 * width) / pageHeight;
        }
        container.style.width = `${elementWidth}%`;
        container.style.height = `${elementHeight}%`;
        container.setAttribute("data-main-rotation", (360 - angle) % 360);
    }
    get _commonActions() {
        const setColor = (jsName, styleName, event) => {
            const color = event.detail[jsName];
            event.target.style[styleName] =
                ColorConverters[`${color[0]}_HTML`](color.slice(1));
        };
        return shadow(this, "_commonActions", {
            display: (event) => {
                const hidden = event.detail.display % 2 === 1;
                this.container.style.visibility = hidden ? "hidden" : "visible";
                this.annotationStorage.setValue(this.data.id, {
                    hidden,
                    print: event.detail.display === 0 || event.detail.display === 3,
                });
            },
            print: (event) => {
                this.annotationStorage.setValue(this.data.id, {
                    print: event.detail.print,
                });
            },
            hidden: (event) => {
                this.container.style.visibility = event.detail.hidden
                    ? "hidden"
                    : "visible";
                this.annotationStorage.setValue(this.data.id, {
                    hidden: event.detail.hidden,
                });
            },
            focus: (event) => {
                setTimeout(() => event.target.focus({ preventScroll: false }), 0);
            },
            userName: (event) => {
                // tooltip
                event.target.title = event.detail.userName;
            },
            readonly: (event) => {
                if (event.detail.readonly) {
                    event.target.setAttribute("readonly", "");
                }
                else {
                    event.target.removeAttribute("readonly");
                }
            },
            required: (event) => {
                this._setRequired(event.target, event.detail.required);
            },
            bgColor: (event) => {
                setColor("bgColor", "backgroundColor", event);
            },
            fillColor: (event) => {
                setColor("fillColor", "backgroundColor", event);
            },
            fgColor: (event) => {
                setColor("fgColor", "color", event);
            },
            textColor: (event) => {
                setColor("textColor", "color", event);
            },
            borderColor: (event) => {
                setColor("borderColor", "borderColor", event);
            },
            strokeColor: (event) => {
                setColor("strokeColor", "borderColor", event);
            },
            rotation: (event) => {
                const angle = event.detail.rotation;
                this.setRotation(angle);
                this.annotationStorage.setValue(this.data.id, {
                    rotation: angle,
                });
            },
        });
    }
    _dispatchEventFromSandbox(actions, jsEvent) {
        const commonActions = this._commonActions;
        for (const name of Object.keys(jsEvent.detail)) {
            const action = actions[name] ||
                commonActions[name];
            action?.(jsEvent);
        }
    }
    _setDefaultPropertiesFromJS(element) {
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
            const action = commonActions[actionName];
            if (action) {
                const eventProxy = {
                    detail: {
                        [actionName]: detail,
                    },
                    target: element,
                };
                action(eventProxy);
                // The action has been consumed: no need to keep it.
                delete storedData[actionName];
            }
        }
    }
    /**
     * Create quadrilaterals from the annotation's quadpoints.
     * @return An array of section elements.
     */
    #createQuadrilaterals(ignoreBorder = false) {
        if (!this.data.quadPoints) {
            return undefined;
        }
        const quadrilaterals = [];
        const savedRect = this.data.rect;
        for (const quadPoint of this.data.quadPoints) {
            this.data.rect = [
                quadPoint[2].x,
                quadPoint[2].y,
                quadPoint[1].x,
                quadPoint[1].y,
            ];
            quadrilaterals.push(this.#createContainer(ignoreBorder));
        }
        this.data.rect = savedRect;
        return quadrilaterals;
    }
    /**
     * Create a popup for the annotation's HTML element. This is used for
     * annotations that do not have a Popup entry in the dictionary, but
     * are of a type that works with popups (such as Highlight annotations).
     */
    _createPopup(trigger_x, data) {
        let container = this.container;
        let trigger = trigger_x;
        if (this.quadrilaterals) {
            trigger = trigger || this.quadrilaterals;
            container = this.quadrilaterals[0];
        }
        // If no trigger element is specified, create it.
        if (!trigger) {
            trigger = div();
            trigger.className = "popupTriggerArea";
            container.append(trigger);
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
        popup.style.left = "100%";
        container.append(popup);
    }
    /**
     * Render the quadrilaterals of the annotation.
     * @return An array of section elements.
     */
    _renderQuadrilaterals(className) {
        /*#static*/  {
            assert(this.quadrilaterals, "Missing quadrilaterals during rendering");
        }
        for (const quadrilateral of this.quadrilaterals) {
            quadrilateral.className = className;
        }
        return this.quadrilaterals;
    }
    /**
     * Render the annotation's HTML element(s).
     * @return A section element or an array of section elements.
     */
    render() {
        assert(0, "Abstract method `AnnotationElement.render` called");
        return undefined;
    }
    _getElementsByName(name, skipId) {
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
                    const domElement = document.querySelector(`[data-element-id="${id}"]`);
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
            const { exportValue } = domElement;
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
    _setRequired(lement, isRequired) {
        assert(0);
    }
}
class LinkAnnotationElement extends AnnotationElement {
    isTooltipOnly;
    constructor(parameters, options) {
        super(parameters, {
            isRenderable: true,
            ignoreBorder: !!options?.ignoreBorder,
            createQuadrilaterals: true,
        });
        this.isTooltipOnly = parameters.data.isTooltipOnly;
    }
    render() {
        const { data, linkService } = this;
        const link = html("a");
        link.setAttribute("data-element-id", data.id);
        let isBound = false;
        if (data.url) {
            linkService.addLinkAttributes(link, data.url, data.newWindow);
            isBound = true;
        }
        else if (data.action) {
            this.#bindNamedAction(link, data.action);
            isBound = true;
        }
        else if (data.attachment) {
            this._bindAttachment(link, data.attachment);
            isBound = true;
        }
        else if (data.setOCGState) {
            this.#bindSetOCGState(link, data.setOCGState);
            isBound = true;
        }
        else if (data.dest) {
            this.#bindLink(link, data.dest);
            isBound = true;
        }
        else {
            if (data.actions &&
                (data.actions.Action ||
                    data.actions["Mouse Up"] ||
                    data.actions["Mouse Down"]) &&
                this.enableScripting &&
                this.hasJSActions) {
                this.#bindJSAction(link, data);
                isBound = true;
            }
            if (data.resetForm) {
                this.#bindResetFormAction(link, data.resetForm);
                isBound = true;
            }
            else if (this.isTooltipOnly && !isBound) {
                this.#bindLink(link, "");
                isBound = true;
            }
        }
        if (this.quadrilaterals) {
            return this._renderQuadrilaterals("linkAnnotation").map((quadrilateral, index) => {
                const linkElement = index === 0 ? link : link.cloneNode();
                quadrilateral.append(linkElement);
                return quadrilateral;
            });
        }
        this.container.className = "linkAnnotation";
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
    #bindLink(link, destination) {
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
    #bindNamedAction(link, action) {
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
    _bindAttachment(link, attachment) {
        link.href = this.linkService.getAnchorUrl("");
        link.onclick = () => {
            this.downloadManager?.openOrDownloadData(this.container, attachment.content, attachment.filename);
            return false;
        };
        this.#setInternalLink();
    }
    /**
     * Bind SetOCGState actions to the link element.
     */
    #bindSetOCGState(link, action) {
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
    #bindJSAction(link, data) {
        link.href = this.linkService.getAnchorUrl("");
        const map = new Map([
            ["Action", "onclick"],
            ["Mouse Up", "onmouseup"],
            ["Mouse Down", "onmousedown"],
        ]);
        for (const name of Object.keys(data.actions)) {
            const jsName = map.get(name);
            if (!jsName) {
                continue;
            }
            link[jsName] = () => {
                this.linkService.eventBus?.dispatch("dispatcheventinsandbox", {
                    source: this,
                    detail: {
                        id: data.id,
                        name: name,
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
    #bindResetFormAction(link, resetForm) {
        const otherClickAction = link.onclick;
        if (!otherClickAction) {
            link.href = this.linkService.getAnchorUrl("");
        }
        this.#setInternalLink();
        if (!this._fieldObjects) {
            warn(`#bindResetFormAction - "resetForm" action not supported, ` +
                "ensure that the `fieldObjects` parameter is provided.");
            if (!otherClickAction) {
                link.onclick = () => false;
            }
            return;
        }
        link.onclick = () => {
            otherClickAction?.();
            const { fields: resetFormFields, refs: resetFormRefs, include, } = resetForm;
            const allFields = [];
            if (resetFormFields.length !== 0 || resetFormRefs.length !== 0) {
                const fieldIds = new Set(resetFormRefs);
                for (const fieldName of resetFormFields) {
                    const fields = this._fieldObjects[fieldName] || [];
                    for (const { id } of fields) {
                        fieldIds.add(id);
                    }
                }
                for (const fields of Object.values(this._fieldObjects)) {
                    for (const field of fields) {
                        if (fieldIds.has(field.id) === include) {
                            allFields.push(field);
                        }
                    }
                }
            }
            else {
                for (const fields of Object.values(this._fieldObjects)) {
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
                }
                else if (!GetElementsByNameSet.has(domElement)) {
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
    constructor(parameters) {
        const isRenderable = !!(parameters.data.hasPopup ||
            parameters.data.titleObj?.str ||
            parameters.data.contentsObj?.str ||
            parameters.data.richText?.str);
        super(parameters, { isRenderable });
    }
    render() {
        this.container.className = "textAnnotation";
        const image = html("img");
        image.src = this.imageResourcesPath +
            "annotation-" +
            this.data.name.toLowerCase() +
            ".svg";
        image.alt = "[{{type}} Annotation]";
        image.dataset.l10nId = "text_annotation_type";
        image.dataset.l10nArgs = JSON.stringify({ type: this.data.name });
        if (!this.data.hasPopup) {
            this._createPopup(image, this.data);
        }
        this.container.append(image);
        return this.container;
    }
}
class WidgetAnnotationElement extends AnnotationElement {
    render() {
        // Show only the container for unsupported field types.
        if (this.data.alternativeText) {
            this.container.title = this.data.alternativeText;
        }
        return this.container;
    }
    #getKeyModifier(event) {
        const { isWin, isMac } = FeatureTest.platform;
        return (isWin && event.ctrlKey) || (isMac && event.metaKey);
    }
    #setEventListener(element, baseName, eventName, valueGetter) {
        if (baseName.includes("mouse")) {
            // Mouse events
            element.addEventListener(baseName, (event) => {
                this.linkService.eventBus?.dispatch("dispatcheventinsandbox", {
                    source: this,
                    detail: {
                        id: this.data.id,
                        name: eventName,
                        value: valueGetter(event),
                        shift: event.shiftKey,
                        modifier: this.#getKeyModifier(event),
                    },
                });
            });
        }
        else {
            // Non mouse event
            element.addEventListener(baseName, (event) => {
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
    _setEventListeners(element, names, getter) {
        for (const [baseName, eventName] of names) {
            if (eventName === "Action" ||
                this.data.actions?.[eventName]) {
                this.#setEventListener(element, baseName, eventName, getter);
            }
        }
    }
    _setBackgroundColor(element) {
        const color = this.data.backgroundColor || undefined;
        element.style.backgroundColor = color === undefined
            ? "transparent"
            : Util.makeHexColor(color[0], color[1], color[2]);
    }
    /**
     * Apply text styles to the text in the element.
     */
    _setTextStyle(element) {
        const TEXT_ALIGNMENT = ["left", "center", "right"];
        const { fontColor } = this.data.defaultAppearanceData;
        const fontSize = this.data.defaultAppearanceData.fontSize ||
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
        const roundToOneDecimal = (x) => Math.round(10 * x) / 10;
        if (this.data.multiLine) {
            const height = Math.abs(this.data.rect[3] - this.data.rect[1] - BORDER_SIZE);
            const numberOfLines = Math.round(height / (LINE_FACTOR * fontSize)) || 1;
            const lineHeight = height / numberOfLines;
            computedFontSize = Math.min(fontSize, roundToOneDecimal(lineHeight / LINE_FACTOR));
        }
        else {
            const height = Math.abs(this.data.rect[3] - this.data.rect[1] - BORDER_SIZE);
            computedFontSize = Math.min(fontSize, roundToOneDecimal(height / LINE_FACTOR));
        }
        style.fontSize = `calc(${computedFontSize}px * var(--scale-factor))`;
        style.color = Util.makeHexColor(fontColor[0], fontColor[1], fontColor[2]);
        if (this.data.textAlignment !== null) {
            style.textAlign = TEXT_ALIGNMENT[this.data.textAlignment];
        }
    }
    _setRequired(element, isRequired) {
        if (isRequired) {
            element.setAttribute("required", true);
        }
        else {
            element.removeAttribute("required");
        }
        element.setAttribute("aria-required", isRequired);
    }
}
class TextWidgetAnnotationElement extends WidgetAnnotationElement {
    constructor(parameters) {
        const isRenderable = parameters.renderForms ||
            (!parameters.data.hasAppearance && !!parameters.data.fieldValue);
        super(parameters, { isRenderable });
    }
    setPropertyOnSiblings(base, key, value, keyInStorage) {
        const storage = this.annotationStorage;
        for (const element of this._getElementsByName(base.name, 
        /* skipId = */ base.id)) {
            if (element.domElement) {
                element.domElement[key] = value;
            }
            storage.setValue(element.id, { [keyInStorage]: value });
        }
    }
    render() {
        const storage = this.annotationStorage;
        const id = this.data.id;
        this.container.className = "textWidgetAnnotation";
        let element;
        if (this.renderForms) {
            // NOTE: We cannot set the values using `element.value` below, since it
            //       prevents the AnnotationLayer rasterizer in `test/driver.js`
            //       from parsing the elements correctly for the reference tests.
            const storedData = storage.getValue(id, {
                value: this.data.fieldValue,
            });
            // const textContent = storedData.formattedValue || storedData.value || "";
            let textContent = storedData.formattedValue ||
                storedData.value || "";
            const maxLen = storage.getValue(id, {
                charLimit: this.data.maxLen,
            }).charLimit;
            if (maxLen && textContent.length > maxLen) {
                textContent = textContent.slice(0, maxLen);
            }
            const elementData = {
                userValue: textContent,
                commitKey: 1,
            };
            if (this.data.multiLine) {
                element = html("textarea");
                element.textContent = textContent.toString();
                if (this.data.doNotScroll) {
                    element.style.overflowY = "hidden";
                }
            }
            else {
                element = html("input");
                element.type = "text";
                element.setAttribute("value", textContent.toString());
                if (this.data.doNotScroll) {
                    element.style.overflowX = "hidden";
                }
            }
            GetElementsByNameSet.add(element);
            element.setAttribute("data-element-id", id);
            element.disabled = this.data.readOnly;
            element.name = this.data.fieldName;
            element.tabIndex = DEFAULT_TAB_INDEX;
            this._setRequired(element, this.data.required);
            if (maxLen) {
                element.maxLength = maxLen;
            }
            element.addEventListener("input", (event) => {
                storage.setValue(id, { value: event.target.value });
                this.setPropertyOnSiblings(element, "value", event.target.value, "value");
            });
            element.addEventListener("resetform", (event) => {
                const defaultValue = this.data.defaultFieldValue ?? "";
                element.value = elementData.userValue = defaultValue;
                elementData.formattedValue = undefined;
            });
            let blurListener = (event) => {
                const { formattedValue } = elementData;
                if (formattedValue !== null && formattedValue !== undefined) {
                    event.target.value = formattedValue;
                }
                // Reset the cursor position to the start of the field (issue 12359).
                event.target.scrollLeft = 0;
            };
            if (this.enableScripting && this.hasJSActions) {
                element.addEventListener("focus", (event) => {
                    const { target } = event;
                    if (elementData.userValue) {
                        target.value = elementData.userValue;
                    }
                    elementData.lastCommittedValue = target.value;
                    elementData.commitKey = 1;
                });
                element.addEventListener("updatefromsandbox", (jsEvent) => {
                    const actions = {
                        value(event) {
                            elementData.userValue = event.detail.value ?? "";
                            storage.setValue(id, {
                                value: elementData.userValue.toString(),
                            });
                            event.target.value = elementData.userValue;
                        },
                        formattedValue(event) {
                            const { formattedValue } = event.detail;
                            elementData.formattedValue = formattedValue;
                            if (formattedValue !== null &&
                                formattedValue !== undefined &&
                                event.target !== document.activeElement) {
                                // Input hasn't the focus so display formatted string
                                event.target.value = formattedValue;
                            }
                            storage.setValue(id, {
                                formattedValue,
                            });
                        },
                        selRange(event) {
                            event.target.setSelectionRange(...event.detail.selRange);
                        },
                        charLimit: (event) => {
                            const { charLimit } = event.detail;
                            const { target } = event;
                            if (charLimit === 0) {
                                target.removeAttribute("maxLength");
                                return;
                            }
                            target.setAttribute("maxLength", charLimit);
                            let value = elementData.userValue;
                            if (!value || value.length <= charLimit) {
                                return;
                            }
                            value = value.slice(0, charLimit);
                            target.value = elementData.userValue = value;
                            storage.setValue(id, { value });
                            this.linkService.eventBus?.dispatch("dispatcheventinsandbox", {
                                source: this,
                                detail: {
                                    id,
                                    name: "Keystroke",
                                    value,
                                    willCommit: true,
                                    commitKey: 1,
                                    selStart: target.selectionStart,
                                    selEnd: target.selectionEnd,
                                },
                            });
                        },
                    };
                    this._dispatchEventFromSandbox(actions, jsEvent);
                });
                // Even if the field hasn't any actions
                // leaving it can still trigger some actions with Calculate
                element.addEventListener("keydown", (event) => {
                    elementData.commitKey = 1;
                    // If the key is one of Escape, Enter then the data are committed.
                    // If we've a Tab then data will be committed on blur.
                    let commitKey = -1;
                    if (event.key === "Escape") {
                        commitKey = 0;
                    }
                    else if (event.key === "Enter" && !this.data.multiLine) {
                        // When we've a multiline field, "Enter" key is a key as the other
                        // hence we don't commit the data (Acrobat behaves the same way)
                        // (see issue #15627).
                        commitKey = 2;
                    }
                    else if (event.key === "Tab") {
                        elementData.commitKey = 3;
                    }
                    if (commitKey === -1) {
                        return;
                    }
                    const { value } = event.target;
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
                            selStart: event.target.selectionStart,
                            selEnd: event.target.selectionEnd,
                        },
                    });
                });
                const _blurListener = blurListener;
                blurListener = undefined;
                element.addEventListener("blur", (event) => {
                    const { value } = event.target;
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
                                selStart: event.target.selectionStart,
                                selEnd: event.target.selectionEnd,
                            },
                        });
                    }
                    _blurListener(event);
                });
                if (this.data.actions?.Keystroke) {
                    element.addEventListener("beforeinput", (event) => {
                        elementData.lastCommittedValue = undefined;
                        const { data, target } = event;
                        const { value, selectionStart, selectionEnd } = target;
                        let selStart = selectionStart, selEnd = selectionEnd;
                        switch (event.inputType) {
                            // https://rawgit.com/w3c/input-events/v1/index.html#interface-InputEvent-Attributes
                            case "deleteWordBackward": {
                                const match = value
                                    .substring(0, selectionStart)
                                    .match(/\w*[^\w]*$/);
                                if (match) {
                                    selStart -= match[0].length;
                                }
                                break;
                            }
                            case "deleteWordForward": {
                                const match = value
                                    .substring(selectionStart)
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
                this._setEventListeners(element, [
                    ["focus", "Focus"],
                    ["blur", "Blur"],
                    ["mousedown", "Mouse Down"],
                    ["mouseenter", "Mouse Enter"],
                    ["mouseleave", "Mouse Exit"],
                    ["mouseup", "Mouse Up"],
                ], (event) => event.target.value);
            }
            if (blurListener) {
                element.addEventListener("blur", blurListener);
            }
            if (this.data.comb) {
                const fieldWidth = this.data.rect[2] - this.data.rect[0];
                const combWidth = fieldWidth / maxLen;
                element.classList.add("comb");
                element.style.letterSpacing = `calc(${combWidth}px - 1ch)`;
            }
        }
        else {
            element = div();
            element.textContent = this.data.fieldValue;
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
class CheckboxWidgetAnnotationElement extends WidgetAnnotationElement {
    constructor(parameters) {
        super(parameters, { isRenderable: parameters.renderForms });
    }
    render() {
        const storage = this.annotationStorage;
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
        this.container.className = "buttonWidgetAnnotation checkBox";
        const element = html("input");
        GetElementsByNameSet.add(element);
        element.setAttribute("data-element-id", id);
        element.disabled = data.readOnly;
        this._setRequired(element, this.data.required);
        element.type = "checkbox";
        element.name = data.fieldName;
        if (value) {
            element.setAttribute("checked", true);
        }
        element.setAttribute("exportValue", data.exportValue);
        element.tabIndex = DEFAULT_TAB_INDEX;
        element.addEventListener("change", (event) => {
            const { name, checked } = event.target;
            for (const checkbox of this._getElementsByName(name, /* skipId = */ id)) {
                const curChecked = checked && checkbox.exportValue === data.exportValue;
                if (checkbox.domElement) {
                    checkbox.domElement.checked = curChecked;
                }
                storage.setValue(checkbox.id, { value: curChecked });
            }
            storage.setValue(id, { value: checked });
        });
        element.addEventListener("resetform", (event) => {
            const defaultValue = data.defaultFieldValue || "Off";
            event.target.checked = defaultValue === data.exportValue;
        });
        if (this.enableScripting && this.hasJSActions) {
            element.addEventListener("updatefromsandbox", (jsEvent) => {
                const actions = {
                    value(event) {
                        event.target.checked = event.detail.value !== "Off";
                        storage.setValue(id, { value: event.target.checked });
                    },
                };
                this._dispatchEventFromSandbox(actions, jsEvent);
            });
            this._setEventListeners(element, [
                ["change", "Validate"],
                ["change", "Action"],
                ["focus", "Focus"],
                ["blur", "Blur"],
                ["mousedown", "Mouse Down"],
                ["mouseenter", "Mouse Enter"],
                ["mouseleave", "Mouse Exit"],
                ["mouseup", "Mouse Up"],
            ], (event) => event.target.checked);
        }
        this._setBackgroundColor(element);
        this._setDefaultPropertiesFromJS(element);
        this.container.append(element);
        return this.container;
    }
}
class RadioButtonWidgetAnnotationElement extends WidgetAnnotationElement {
    constructor(parameters) {
        super(parameters, { isRenderable: parameters.renderForms });
    }
    render() {
        this.container.className = "buttonWidgetAnnotation radioButton";
        const storage = this.annotationStorage;
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
        GetElementsByNameSet.add(element);
        element.setAttribute("data-element-id", id);
        element.disabled = data.readOnly;
        this._setRequired(element, this.data.required);
        element.type = "radio";
        element.name = data.fieldName;
        if (value) {
            element.setAttribute("checked", true);
        }
        element.tabIndex = DEFAULT_TAB_INDEX;
        element.addEventListener("change", (event) => {
            const { name, checked } = event.target;
            for (const radio of this._getElementsByName(name, /* skipId = */ id)) {
                storage.setValue(radio.id, { value: false });
            }
            storage.setValue(id, { value: checked });
        });
        element.addEventListener("resetform", (event) => {
            const defaultValue = data.defaultFieldValue;
            event.target.checked = defaultValue !== null &&
                defaultValue !== undefined &&
                defaultValue === data.buttonValue;
        });
        if (this.enableScripting && this.hasJSActions) {
            const pdfButtonValue = data.buttonValue;
            element.addEventListener("updatefromsandbox", (jsEvent) => {
                const actions = {
                    value: (event) => {
                        const checked = pdfButtonValue === event.detail.value;
                        for (const radio of this._getElementsByName(event.target.name)) {
                            const curChecked = checked && radio.id === id;
                            if (radio.domElement) {
                                radio.domElement.checked = curChecked;
                            }
                            storage.setValue(radio.id, { value: curChecked });
                        }
                    },
                };
                this._dispatchEventFromSandbox(actions, jsEvent);
            });
            this._setEventListeners(element, [
                ["change", "Validate"],
                ["change", "Action"],
                ["focus", "Focus"],
                ["blur", "Blur"],
                ["mousedown", "Mouse Down"],
                ["mouseenter", "Mouse Enter"],
                ["mouseleave", "Mouse Exit"],
                ["mouseup", "Mouse Up"],
            ], (event) => event.target.checked);
        }
        this._setBackgroundColor(element);
        this._setDefaultPropertiesFromJS(element);
        this.container.append(element);
        return this.container;
    }
}
class PushButtonWidgetAnnotationElement extends LinkAnnotationElement {
    constructor(parameters) {
        super(parameters, { ignoreBorder: parameters.data.hasAppearance });
    }
    render() {
        // The rendering and functionality of a push button widget annotation is
        // equal to that of a link annotation, but may have more functionality, such
        // as performing actions on form fields (resetting, submitting, et cetera).
        const container = super.render();
        container.className = "buttonWidgetAnnotation pushButton";
        if (this.data.alternativeText) {
            container.title = this.data.alternativeText;
        }
        const linkElement = container.lastChild;
        if (this.enableScripting && this.hasJSActions && linkElement) {
            this._setDefaultPropertiesFromJS(linkElement);
            linkElement.addEventListener("updatefromsandbox", (jsEvent) => {
                this._dispatchEventFromSandbox({}, jsEvent);
            });
        }
        return container;
    }
}
class ChoiceWidgetAnnotationElement extends WidgetAnnotationElement {
    constructor(parameters) {
        super(parameters, {
            isRenderable: parameters.renderForms,
        });
    }
    render() {
        this.container.className = "choiceWidgetAnnotation";
        const storage = this.annotationStorage;
        const id = this.data.id;
        const storedData = storage.getValue(id, {
            value: this.data.fieldValue,
        });
        const selectElement = html("select");
        GetElementsByNameSet.add(selectElement);
        selectElement.setAttribute("data-element-id", id);
        selectElement.disabled = this.data.readOnly;
        this._setRequired(selectElement, this.data.required);
        selectElement.name = this.data.fieldName;
        selectElement.tabIndex = DEFAULT_TAB_INDEX;
        let addAnEmptyEntry = this.data.combo && this.data.options.length > 0;
        if (!this.data.combo) {
            // List boxes have a size and (optionally) multiple selection.
            selectElement.size = this.data.options.length;
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
        for (const option of this.data.options) {
            const optionElement = html("option");
            optionElement.textContent = option.displayValue;
            optionElement.value = option.exportValue;
            if (storedData.value.includes(option.exportValue)) {
                optionElement.setAttribute("selected", true);
                addAnEmptyEntry = false;
            }
            selectElement.append(optionElement);
        }
        let removeEmptyEntry;
        if (addAnEmptyEntry) {
            const noneOptionElement = html("option");
            noneOptionElement.value = " ";
            noneOptionElement.setAttribute("hidden", true);
            noneOptionElement.setAttribute("selected", true);
            selectElement.prepend(noneOptionElement);
            removeEmptyEntry = () => {
                noneOptionElement.remove();
                selectElement.removeEventListener("input", removeEmptyEntry);
                removeEmptyEntry = undefined;
            };
            selectElement.addEventListener("input", removeEmptyEntry);
        }
        const getValue = (isExport) => {
            const name = isExport ? "value" : "textContent";
            const { options, multiple } = selectElement;
            if (!multiple) {
                return options.selectedIndex === -1
                    ? undefined
                    : options[options.selectedIndex][name] ?? undefined;
            }
            return Array.prototype.filter
                .call(options, (option) => option.selected)
                .map((option) => option[name]);
        };
        let selectedValues = getValue(/* isExport */ false);
        const getItems = (event) => {
            const options = event.target.options;
            return Array.prototype.map.call(options, (option) => {
                return {
                    displayValue: option.textContent,
                    exportValue: option.value,
                };
            });
        };
        if (this.enableScripting && this.hasJSActions) {
            selectElement.addEventListener("updatefromsandbox", (jsEvent) => {
                const actions = {
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
                            const i = Array.prototype.findIndex.call(options, (option) => option.selected);
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
                        }
                        else {
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
                        for (const option of event.target.options) {
                            option.selected = indices.has(option.index);
                        }
                        storage.setValue(id, {
                            value: getValue(/* isExport */ true),
                        });
                        selectedValues = getValue(/* isExport */ false);
                    },
                    editable(event) {
                        event.target.disabled = !event.detail.editable;
                    },
                };
                this._dispatchEventFromSandbox(actions, jsEvent);
            });
            selectElement.addEventListener("input", (event) => {
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
            this._setEventListeners(selectElement, [
                ["focus", "Focus"],
                ["blur", "Blur"],
                ["mousedown", "Mouse Down"],
                ["mouseenter", "Mouse Enter"],
                ["mouseleave", "Mouse Exit"],
                ["mouseup", "Mouse Up"],
                ["input", "Action"],
                ["input", "Validate"],
            ], (event) => event.target.value);
        }
        else {
            selectElement.addEventListener("input", (event) => {
                storage.setValue(id, { value: getValue(/* isExport */ true) });
            });
        }
        if (this.data.combo) {
            this._setTextStyle(selectElement);
        }
        else {
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
    // Do not render popup annotations for parent elements with these types as
    // they create the popups themselves (because of custom trigger divs).
    static IGNORE_TYPES = new Set([
        "Line",
        "Square",
        "Circle",
        "PolyLine",
        "Polygon",
        "Ink",
    ]);
    constructor(parameters) {
        // const isRenderable = !!(
        //   parameters.data.titleObj?.str ||
        //   parameters.data.contentsObj?.str ||
        //   parameters.data.richText?.str
        // );
        // super(parameters, { isRenderable });
        const { data } = parameters;
        const isRenderable = !PopupAnnotationElement.IGNORE_TYPES.has(data.parentType) &&
            !!(data.titleObj?.str || data.contentsObj?.str || data.richText?.str);
        super(parameters, { isRenderable });
    }
    render() {
        this.container.className = "popupAnnotation";
        const parentElements = this.layer.querySelectorAll(`[data-annotation-id="${this.data.parentId}"]`);
        if (parentElements.length === 0) {
            return this.container;
        }
        const popup = new PopupElement({
            container: this.container,
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
            this.data.parentRect[0],
            page.view[3] - this.data.parentRect[1] + page.view[1],
            this.data.parentRect[2],
            page.view[3] - this.data.parentRect[3] + page.view[1],
        ]);
        const popupLeft = rect[0] + this.data.parentRect[2] -
            this.data.parentRect[0];
        const popupTop = rect[1];
        const { pageWidth, pageHeight, pageX, pageY } = this.viewport.rawDims;
        this.container.style.left = `${(100 * (popupLeft - pageX)) / pageWidth}%`;
        this.container.style.top = `${(100 * (popupTop - pageY)) / pageHeight}%`;
        this.container.append(popup.render());
        return this.container;
    }
}
class PopupElement {
    container;
    trigger;
    color;
    titleObj;
    modificationDate;
    contentsObj;
    richText;
    hideWrapper;
    pinned = false;
    hideElement;
    constructor(parameters) {
        this.container = parameters.container;
        this.trigger = parameters.trigger;
        this.color = parameters.color;
        this.titleObj = parameters.titleObj;
        this.modificationDate = parameters.modificationDate;
        this.contentsObj = parameters.contentsObj;
        this.richText = parameters.richText;
        this.hideWrapper = parameters.hideWrapper || false;
    }
    /** @implement */
    render() {
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
        if (color) {
            // Enlighten the color.
            const r = BACKGROUND_ENLIGHT * (255 - color[0]) + color[0];
            const g = BACKGROUND_ENLIGHT * (255 - color[1]) + color[1];
            const b = BACKGROUND_ENLIGHT * (255 - color[2]) + color[2];
            popup.style.backgroundColor = Util.makeHexColor(r | 0, g | 0, b | 0);
        }
        const title = html("h1");
        title.dir = this.titleObj.dir;
        title.textContent = this.titleObj.str;
        popup.append(title);
        // The modification date is shown in the popup instead of the creation
        // date if it is available and can be parsed correctly, which is
        // consistent with other viewers such as Adobe Acrobat.
        const dateObject = PDFDateString.toDateObject(this.modificationDate);
        if (dateObject) {
            const modificationDate = span();
            modificationDate.className = "popupDate";
            modificationDate.textContent = "{{date}}, {{time}}";
            modificationDate.dataset.l10nId = "annotation_date_string";
            modificationDate.dataset.l10nArgs = JSON.stringify({
                date: dateObject.toLocaleDateString(),
                time: dateObject.toLocaleTimeString(),
            });
            popup.append(modificationDate);
        }
        if (this.richText?.str &&
            (!this.contentsObj?.str || this.contentsObj.str === this.richText.str)) {
            XfaLayer.render({
                xfaHtml: this.richText.html,
                intent: "richText",
                div: popup,
            });
            popup.lastChild.className = "richText popupContent";
        }
        else {
            const contents = this.#formatContents(this.contentsObj);
            popup.append(contents);
        }
        if (!Array.isArray(this.trigger)) {
            this.trigger = [this.trigger];
        }
        // Attach the event listeners to the trigger element.
        for (const element of this.trigger) {
            element.addEventListener("click", this.#toggle);
            element.addEventListener("mouseover", this.#show.bind(this, false));
            element.addEventListener("mouseout", this.#hide.bind(this, false));
        }
        popup.addEventListener("click", this.#hide.bind(this, true));
        wrapper.append(popup);
        return wrapper;
    }
    /**
     * Format the contents of the popup by adding newlines where necessary.
     */
    #formatContents({ str, dir }) {
        const p = html("p");
        p.className = "popupContent";
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
    /**
     * Toggle the visibility of the popup.
     */
    #toggle = () => {
        if (this.pinned) {
            this.#hide(true);
        }
        else {
            this.#show(true);
        }
    };
    /**
     * Show the popup.
     */
    #show(pin = false) {
        if (pin) {
            this.pinned = true;
        }
        if (this.hideElement.hidden) {
            this.hideElement.hidden = false;
            this.container.style.zIndex = parseInt(this.container.style.zIndex) +
                1000;
        }
    }
    /**
     * Hide the popup.
     */
    #hide(unpin = true) {
        if (unpin) {
            this.pinned = false;
        }
        if (!this.hideElement.hidden && !this.pinned) {
            this.hideElement.hidden = true;
            this.container.style.zIndex = parseInt(this.container.style.zIndex) -
                1000;
        }
    }
}
class FreeTextAnnotationElement extends AnnotationElement {
    textContent;
    constructor(parameters) {
        const isRenderable = !!(parameters.data.hasPopup ||
            parameters.data.titleObj?.str ||
            parameters.data.contentsObj?.str ||
            parameters.data.richText?.str);
        super(parameters, { isRenderable, ignoreBorder: true });
        this.textContent = parameters.data.textContent;
    }
    /**
     * Render the free text annotation's HTML element in the empty container.
     */
    render() {
        this.container.className = "freeTextAnnotation";
        if (this.textContent) {
            const content = document.createElement("div");
            content.className = "annotationTextContent";
            content.setAttribute("role", "comment");
            for (const line of this.textContent) {
                const lineSpan = document.createElement("span");
                lineSpan.textContent = line;
                content.append(lineSpan);
            }
            this.container.append(content);
        }
        if (!this.data.hasPopup) {
            this._createPopup(undefined, this.data);
        }
        return this.container;
    }
}
class LineAnnotationElement extends AnnotationElement {
    constructor(parameters) {
        const isRenderable = !!(parameters.data.hasPopup ||
            parameters.data.titleObj?.str ||
            parameters.data.contentsObj?.str ||
            parameters.data.richText?.str);
        super(parameters, { isRenderable, ignoreBorder: true });
    }
    render() {
        this.container.className = "lineAnnotation";
        // Create an invisible line with the same starting and ending coordinates
        // that acts as the trigger for the popup. Only the line itself should
        // trigger the popup, not the entire container.
        const data = this.data;
        const { width, height } = getRectDims(data.rect);
        const svg = this.svgFactory.create(width, height, 
        /* skipDimensions = */ true);
        // PDF coordinates are calculated from a bottom left origin, so transform
        // the line coordinates to a top left origin for the SVG element.
        const line = createSVG("line");
        line.setAttribute("x1", (data.rect[2] - data.lineCoordinates[0]).toString());
        line.setAttribute("y1", (data.rect[3] - data.lineCoordinates[1]).toString());
        line.setAttribute("x2", (data.rect[2] - data.lineCoordinates[2]).toString());
        line.setAttribute("y2", (data.rect[3] - data.lineCoordinates[3]).toString());
        // Ensure that the 'stroke-width' is always non-zero, since otherwise it
        // won't be possible to open/close the popup (note e.g. issue 11122).
        line.setAttribute("stroke-width", (data.borderStyle.width || 1).toString());
        line.setAttribute("stroke", "transparent");
        line.setAttribute("fill", "transparent");
        svg.append(line);
        this.container.append(svg);
        // Create the popup ourselves so that we can bind it to the line instead
        // of to the entire container (which is the default).
        this._createPopup(line, data);
        return this.container;
    }
}
class SquareAnnotationElement extends AnnotationElement {
    constructor(parameters) {
        const isRenderable = !!(parameters.data.hasPopup ||
            parameters.data.titleObj?.str ||
            parameters.data.contentsObj?.str ||
            parameters.data.richText?.str);
        super(parameters, { isRenderable, ignoreBorder: true });
    }
    render() {
        this.container.className = "squareAnnotation";
        // Create an invisible square with the same rectangle that acts as the
        // trigger for the popup. Only the square itself should trigger the
        // popup, not the entire container.
        const data = this.data;
        const { width, height } = getRectDims(data.rect);
        const svg = this.svgFactory.create(width, height, 
        /* skipDimensions = */ true);
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
        svg.append(square);
        this.container.append(svg);
        // Create the popup ourselves so that we can bind it to the square instead
        // of to the entire container (which is the default).
        this._createPopup(square, data);
        return this.container;
    }
}
class CircleAnnotationElement extends AnnotationElement {
    constructor(parameters) {
        const isRenderable = !!(parameters.data.hasPopup ||
            parameters.data.titleObj?.str ||
            parameters.data.contentsObj?.str ||
            parameters.data.richText?.str);
        super(parameters, { isRenderable, ignoreBorder: true });
    }
    render() {
        this.container.className = "circleAnnotation";
        // Create an invisible circle with the same ellipse that acts as the
        // trigger for the popup. Only the circle itself should trigger the
        // popup, not the entire container.
        const data = this.data;
        const { width, height } = getRectDims(data.rect);
        const svg = this.svgFactory.create(width, height, 
        /* skipDimensions = */ true);
        // The browser draws half of the borders inside the circle and half of
        // the borders outside the circle by default. This behavior cannot be
        // changed programmatically, so correct for that here.
        const borderWidth = data.borderStyle.width;
        const circle = createSVG("ellipse");
        circle.setAttribute("cx", (width / 2).toString());
        circle.setAttribute("cy", (height / 2).toString());
        circle.setAttribute("rx", (width / 2 - borderWidth / 2).toString());
        circle.setAttribute("ry", (height / 2 - borderWidth / 2).toString());
        // Ensure that the 'stroke-width' is always non-zero, since otherwise it
        // won't be possible to open/close the popup (note e.g. issue 11122).
        circle.setAttribute("stroke-width", (borderWidth || 1).toString());
        circle.setAttribute("stroke", "transparent");
        circle.setAttribute("fill", "transparent");
        svg.append(circle);
        this.container.append(svg);
        // Create the popup ourselves so that we can bind it to the circle instead
        // of to the entire container (which is the default).
        this._createPopup(circle, data);
        return this.container;
    }
}
class PolylineAnnotationElement extends AnnotationElement {
    containerClassName = "polylineAnnotation";
    svgElementName = "polyline";
    constructor(parameters) {
        const isRenderable = !!(parameters.data.hasPopup ||
            parameters.data.titleObj?.str ||
            parameters.data.contentsObj?.str ||
            parameters.data.richText?.str);
        super(parameters, { isRenderable, ignoreBorder: true });
    }
    render() {
        this.container.className = this.containerClassName;
        // Create an invisible polyline with the same points that acts as the
        // trigger for the popup. Only the polyline itself should trigger the
        // popup, not the entire container.
        const data = this.data;
        const { width, height } = getRectDims(data.rect);
        const svg = this.svgFactory.create(width, height, 
        /* skipDimensions = */ true);
        // Convert the vertices array to a single points string that the SVG
        // polyline element expects ("x1,y1 x2,y2 ..."). PDF coordinates are
        // calculated from a bottom left origin, so transform the polyline
        // coordinates to a top left origin for the SVG element.
        let points = [];
        for (const coordinate of data.vertices) {
            const x = coordinate.x - data.rect[0];
            const y = data.rect[3] - coordinate.y;
            points.push(`${x},${y}`);
        }
        points = points.join(" ");
        const polyline = createSVG(this.svgElementName);
        polyline.setAttribute("points", points);
        // Ensure that the 'stroke-width' is always non-zero, since otherwise it
        // won't be possible to open/close the popup (note e.g. issue 11122).
        polyline.setAttribute("stroke-width", (data.borderStyle.width || 1));
        polyline.setAttribute("stroke", "transparent");
        polyline.setAttribute("fill", "transparent");
        svg.append(polyline);
        this.container.append(svg);
        // Create the popup ourselves so that we can bind it to the polyline
        // instead of to the entire container (which is the default).
        this._createPopup(polyline, data);
        return this.container;
    }
}
class PolygonAnnotationElement extends PolylineAnnotationElement {
    containerClassName = "polygonAnnotation";
    svgElementName = "polygon";
    constructor(parameters) {
        // Polygons are specific forms of polylines, so reuse their logic.
        super(parameters);
    }
}
class CaretAnnotationElement extends AnnotationElement {
    constructor(parameters) {
        const isRenderable = !!(parameters.data.hasPopup ||
            parameters.data.titleObj?.str ||
            parameters.data.contentsObj?.str ||
            parameters.data.richText?.str);
        super(parameters, { isRenderable, ignoreBorder: true });
    }
    render() {
        this.container.className = "caretAnnotation";
        if (!this.data.hasPopup) {
            this._createPopup(undefined, this.data);
        }
        return this.container;
    }
}
class InkAnnotationElement extends AnnotationElement {
    containerClassName = "inkAnnotation";
    /**
     * Use the polyline SVG element since it allows us to use coordinates
     * directly and to draw both straight lines and curves.
     */
    svgElementName = "polyline";
    constructor(parameters) {
        const isRenderable = !!(parameters.data.hasPopup ||
            parameters.data.titleObj?.str ||
            parameters.data.contentsObj?.str ||
            parameters.data.richText?.str);
        super(parameters, { isRenderable, ignoreBorder: true });
    }
    render() {
        this.container.className = this.containerClassName;
        // Create an invisible polyline with the same points that acts as the
        // trigger for the popup.
        const data = this.data;
        const { width, height } = getRectDims(data.rect);
        const svg = this.svgFactory.create(width, height, 
        /* skipDimensions = */ true);
        for (const inkList of data.inkLists) {
            // Convert the ink list to a single points string that the SVG
            // polyline element expects ("x1,y1 x2,y2 ..."). PDF coordinates are
            // calculated from a bottom left origin, so transform the polyline
            // coordinates to a top left origin for the SVG element.
            let points = [];
            for (const coordinate of inkList) {
                const x = coordinate.x - data.rect[0];
                const y = data.rect[3] - coordinate.y;
                points.push(`${x},${y}`);
            }
            points = points.join(" ");
            const polyline = createSVG(this.svgElementName);
            polyline.setAttribute("points", points);
            // Ensure that the 'stroke-width' is always non-zero, since otherwise it
            // won't be possible to open/close the popup (note e.g. issue 11122).
            polyline.setAttribute("stroke-width", (data.borderStyle.width || 1).toString());
            polyline.setAttribute("stroke", "transparent");
            polyline.setAttribute("fill", "transparent");
            // Create the popup ourselves so that we can bind it to the polyline
            // instead of to the entire container (which is the default).
            this._createPopup(polyline, data);
            svg.append(polyline);
        }
        this.container.append(svg);
        return this.container;
    }
}
class HighlightAnnotationElement extends AnnotationElement {
    constructor(parameters) {
        const isRenderable = !!(parameters.data.hasPopup ||
            parameters.data.titleObj?.str ||
            parameters.data.contentsObj?.str ||
            parameters.data.richText?.str);
        super(parameters, {
            isRenderable,
            ignoreBorder: true,
            createQuadrilaterals: true,
        });
    }
    render() {
        if (!this.data.hasPopup) {
            this._createPopup(undefined, this.data);
        }
        if (this.quadrilaterals) {
            return this._renderQuadrilaterals("highlightAnnotation");
        }
        this.container.className = "highlightAnnotation";
        return this.container;
    }
}
class UnderlineAnnotationElement extends AnnotationElement {
    constructor(parameters) {
        const isRenderable = !!(parameters.data.hasPopup ||
            parameters.data.titleObj?.str ||
            parameters.data.contentsObj?.str ||
            parameters.data.richText?.str);
        super(parameters, {
            isRenderable,
            ignoreBorder: true,
            createQuadrilaterals: true,
        });
    }
    render() {
        if (!this.data.hasPopup) {
            this._createPopup(undefined, this.data);
        }
        if (this.quadrilaterals) {
            return this._renderQuadrilaterals("underlineAnnotation");
        }
        this.container.className = "underlineAnnotation";
        return this.container;
    }
}
class SquigglyAnnotationElement extends AnnotationElement {
    constructor(parameters) {
        const isRenderable = !!(parameters.data.hasPopup ||
            parameters.data.titleObj?.str ||
            parameters.data.contentsObj?.str ||
            parameters.data.richText?.str);
        super(parameters, {
            isRenderable,
            ignoreBorder: true,
            createQuadrilaterals: true,
        });
    }
    render() {
        if (!this.data.hasPopup) {
            this._createPopup(undefined, this.data);
        }
        if (this.quadrilaterals) {
            return this._renderQuadrilaterals("squigglyAnnotation");
        }
        this.container.className = "squigglyAnnotation";
        return this.container;
    }
}
class StrikeOutAnnotationElement extends AnnotationElement {
    constructor(parameters) {
        const isRenderable = !!(parameters.data.hasPopup ||
            parameters.data.titleObj?.str ||
            parameters.data.contentsObj?.str ||
            parameters.data.richText?.str);
        super(parameters, {
            isRenderable,
            ignoreBorder: true,
            createQuadrilaterals: true,
        });
    }
    render() {
        if (!this.data.hasPopup) {
            this._createPopup(undefined, this.data);
        }
        if (this.quadrilaterals) {
            return this._renderQuadrilaterals("strikeoutAnnotation");
        }
        this.container.className = "strikeoutAnnotation";
        return this.container;
    }
}
class StampAnnotationElement extends AnnotationElement {
    constructor(parameters) {
        const isRenderable = !!(parameters.data.hasPopup ||
            parameters.data.titleObj?.str ||
            parameters.data.contentsObj?.str ||
            parameters.data.richText?.str);
        super(parameters, { isRenderable, ignoreBorder: true });
    }
    render() {
        this.container.className = "stampAnnotation";
        if (!this.data.hasPopup) {
            this._createPopup(undefined, this.data);
        }
        return this.container;
    }
}
export class FileAttachmentAnnotationElement extends AnnotationElement {
    filename;
    content;
    constructor(parameters) {
        super(parameters, { isRenderable: true });
        const { filename, content } = this.data.file;
        this.filename = getFilenameFromUrl(filename, /* onlyStripPath = */ true);
        this.content = content;
        this.linkService.eventBus?.dispatch("fileattachmentannotation", {
            source: this,
            filename,
            content,
        });
    }
    render() {
        this.container.className = "fileAttachmentAnnotation";
        // const trigger = div();
        let trigger;
        if (this.data.hasAppearance) {
            trigger = div();
        }
        else {
            // Unfortunately it seems that it's not clearly specified exactly what
            // names are actually valid, since Table 184 contains:
            //   Conforming readers shall provide predefined icon appearances for at
            //   least the following standard names: GraphPushPin, PaperclipTag.
            //   Additional names may be supported as well. Default value: PushPin.
            trigger = html("img");
            trigger.src = `${this.imageResourcesPath}annotation-${/paperclip/i.test(this.data.name) ? "paperclip" : "pushpin"}.svg`;
        }
        trigger.className = "popupTriggerArea";
        trigger.addEventListener("dblclick", this.#download);
        if (!this.data.hasPopup &&
            (this.data.titleObj?.str ||
                this.data.contentsObj?.str ||
                this.data.richText)) {
            this._createPopup(trigger, this.data);
        }
        this.container.append(trigger);
        return this.container;
    }
    /**
     * Download the file attachment associated with this annotation.
     */
    #download = () => {
        this.downloadManager?.openOrDownloadData(this.container, this.content, this.filename);
    };
}
export class AnnotationLayer {
    static #appendElement(element, id, div, accessibilityManager) {
        const contentElement = element.firstChild || element;
        contentElement.id = `${AnnotationPrefix}${id}`;
        div.append(element);
        accessibilityManager?.moveElementInDOM(div, element, contentElement, 
        /* isRemovable = */ false);
    }
    /**
     * Render a new annotation layer with all annotation elements.
     */
    static render(params) {
        const { annotations, div, viewport, accessibilityManager } = params;
        setLayerDimensions(div, viewport);
        const elementParams = {
            layer: div,
            page: params.page,
            viewport,
            linkService: params.linkService,
            downloadManager: params.downloadManager,
            imageResourcesPath: params.imageResourcesPath || "",
            renderForms: params.renderForms !== false,
            svgFactory: new DOMSVGFactory(),
            annotationStorage: params.annotationStorage || new AnnotationStorage(),
            enableScripting: params.enableScripting === true,
            hasJSActions: params.hasJSActions,
            fieldObjects: params.fieldObjects,
        };
        let zIndex = 0;
        for (const data of params.annotations) {
            if (data.annotationType !== AnnotationType.POPUP) {
                const { width, height } = getRectDims(data.rect);
                if (width <= 0 || height <= 0) {
                    continue; // Ignore empty annotations.
                }
            }
            elementParams.data = data;
            const element = AnnotationElementFactory.create(elementParams);
            if (!element.isRenderable) {
                continue;
            }
            const rendered = element.render();
            if (data.hidden) {
                rendered.style.visibility = "hidden";
            }
            if (Array.isArray(rendered)) {
                for (const renderedElement of rendered) {
                    renderedElement.style.zIndex = zIndex++;
                    AnnotationLayer.#appendElement(renderedElement, data.id, div, accessibilityManager);
                }
            }
            else {
                // The accessibility manager will move the annotation in the DOM in
                // order to match the visual ordering.
                // But if an annotation is above an other one, then we must draw it
                // after the other one whatever the order is in the DOM, hence the
                // use of the z-index.
                rendered.style.zIndex = zIndex++;
                if (element instanceof PopupAnnotationElement) {
                    // Popup annotation elements should not be on top of other
                    // annotation elements to prevent interfering with mouse events.
                    div.prepend(rendered);
                }
                else {
                    AnnotationLayer.#appendElement(rendered, data.id, div, accessibilityManager);
                }
            }
        }
        this.#setAnnotationCanvasMap(div, params.annotationCanvasMap);
    }
    /**
     * Update the annotation elements on existing annotation layer.
     */
    static update(params) {
        const { annotationCanvasMap, div, viewport } = params;
        setLayerDimensions(div, { rotation: viewport.rotation });
        this.#setAnnotationCanvasMap(div, annotationCanvasMap);
        div.hidden = false;
    }
    static #setAnnotationCanvasMap(div, annotationCanvasMap) {
        if (!annotationCanvasMap) {
            return;
        }
        for (const [id, canvas] of annotationCanvasMap) {
            const element = div.querySelector(`[data-annotation-id="${id}"]`);
            if (!element) {
                continue;
            }
            const { firstChild } = element;
            if (!firstChild) {
                element.append(canvas);
            }
            else if (firstChild.nodeName === "CANVAS") {
                firstChild.replaceWith(canvas);
            }
            else {
                firstChild.before(canvas);
            }
        }
        annotationCanvasMap.clear();
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=annotation_layer.js.map