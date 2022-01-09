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
import { div, html, span, svg as createSVG, textnode } from "../../../lib/dom.js";
import { assert } from "../../../lib/util/trace.js";
import { DOMSVGFactory, getFilenameFromUrl, PDFDateString, } from "./display_utils.js";
import { AnnotationBorderStyleType, AnnotationType, shadow, stringToPDFString, Util, warn, } from "../shared/util.js";
import { AnnotationStorage } from "./annotation_storage.js";
import { ColorConverters } from "../shared/scripting_utils.js";
import { XfaLayer } from "./xfa_layer.js";
/*81---------------------------------------------------------------------------*/
const DEFAULT_TAB_INDEX = 1000;
const GetElementsByNameSet = new WeakSet();
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
    _mouseState;
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
        this._mouseState = parameters.mouseState;
        if (isRenderable) {
            this.container = this.#createContainer(ignoreBorder);
        }
        if (createQuadrilaterals) {
            this.quadrilaterals = this.#createQuadrilaterals(ignoreBorder);
        }
    }
    /**
     * Create an empty container for the annotation's HTML element.
     */
    #createContainer(ignoreBorder = false) {
        const data = this.data;
        const page = this.page;
        const viewport = this.viewport;
        const container = html("section");
        let width = data.rect[2] - data.rect[0];
        let height = data.rect[3] - data.rect[1];
        container.setAttribute("data-annotation-id", data.id);
        // Do *not* modify `data.rect`, since that will corrupt the annotation
        // position on subsequent calls to `#createContainer` (see issue 6804).
        const rect = Util.normalizeRect([
            data.rect[0],
            page.view[3] - data.rect[1] + page.view[1],
            data.rect[2],
            page.view[3] - data.rect[3] + page.view[1],
        ]);
        if (data.hasOwnCanvas) {
            const transform = viewport.transform.slice();
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
        if (!ignoreBorder && data.borderStyle.width > 0) {
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
            if (horizontalRadius > 0 || verticalRadius > 0) {
                const radius = `${horizontalRadius}px / ${verticalRadius}px`;
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
            const borderColor = data.borderColor || data.color || undefined;
            if (borderColor) {
                container.style.borderColor = Util.makeHexColor(data.color[0] | 0, data.color[1] | 0, data.color[2] | 0);
            }
            else {
                // Transparent (invisible) border, so do not draw it at all.
                container.style.borderWidth = undefined;
            }
        }
        container.style.left = `${rect[0]}px`;
        container.style.top = `${rect[1]}px`;
        if (data.hasOwnCanvas) {
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
    #createQuadrilaterals(ignoreBorder = false) {
        if (!this.data.quadPoints)
            return undefined;
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
            trigger.style.height = container.style.height;
            trigger.style.width = container.style.width;
            container.appendChild(trigger);
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
    _renderQuadrilaterals(className) {
        assert(this.quadrilaterals, "Missing quadrilaterals during rendering");
        for (const quadrilateral of this.quadrilaterals) {
            quadrilateral.className = className;
        }
        return this.quadrilaterals;
    }
    /**
     * Render the annotation's HTML element(s).
     */
    render() {
        assert(0, "Abstract method `AnnotationElement.render` called");
        return undefined;
    }
    /**
     * @private
     * @return {Array}
     */
    _getElementsByName(name, skipId) {
        const fields = [];
        if (this._fieldObjects) {
            const fieldObj = this._fieldObjects[name];
            if (fieldObj) {
                for (const { page, id, exportValues } of fieldObj) {
                    if (page === -1)
                        continue;
                    if (id === skipId)
                        continue;
                    const exportValue = typeof exportValues === "string" ? exportValues : undefined;
                    const domElement = document.getElementById(id);
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
            const { id, exportValue } = domElement;
            if (id === skipId)
                continue;
            if (!GetElementsByNameSet.has(domElement))
                continue;
            fields.push({ id, exportValue, domElement });
        }
        return fields;
    }
    static get platform() {
        const platform = typeof navigator !== "undefined" ? navigator.platform : "";
        return shadow(this, "platform", {
            isWin: platform.includes("Win"),
            isMac: platform.includes("Mac"),
        });
    }
}
class LinkAnnotationElement extends AnnotationElement {
    constructor(parameters, options) {
        const isRenderable = !!(parameters.data.url ||
            parameters.data.dest ||
            parameters.data.action ||
            parameters.data.isTooltipOnly ||
            parameters.data.resetForm ||
            (parameters.data.actions &&
                (parameters.data.actions.Action ||
                    parameters.data.actions["Mouse Up"] ||
                    parameters.data.actions["Mouse Down"])));
        super(parameters, {
            isRenderable,
            ignoreBorder: !!options?.ignoreBorder,
            createQuadrilaterals: true,
        });
    }
    render() {
        const { data, linkService } = this;
        const link = html("a");
        if (data.url) {
            if (!linkService.addLinkAttributes) {
                warn("LinkAnnotationElement.render - missing `addLinkAttributes`-method on the `linkService`-instance.");
            }
            linkService.addLinkAttributes?.(link, data.url, data.newWindow);
        }
        else if (data.action) {
            this.#bindNamedAction(link, data.action);
        }
        else if (data.dest) {
            this.#bindLink(link, data.dest);
        }
        else {
            let hasClickAction = false;
            if (data.actions
                &&
                    (data.actions.Action ||
                        data.actions["Mouse Up"] ||
                        data.actions["Mouse Down"])
                && this.enableScripting
                && this.hasJSActions) {
                hasClickAction = true;
                this.#bindJSAction(link, data);
            }
            if (data.resetForm) {
                this.#bindResetFormAction(link, data.resetForm);
            }
            else if (!hasClickAction) {
                this.#bindLink(link, "");
            }
        }
        if (this.quadrilaterals) {
            return this._renderQuadrilaterals("linkAnnotation").map((quadrilateral, index) => {
                const linkElement = index === 0 ? link : link.cloneNode();
                quadrilateral.appendChild(linkElement);
                return quadrilateral;
            });
        }
        this.container.className = "linkAnnotation";
        this.container.appendChild(link);
        return this.container;
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
            link.className = "internalLink";
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
        link.className = "internalLink";
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
            if (!jsName)
                continue;
            link[jsName] = () => {
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
        if (!link.onclick) {
            link.onclick = () => false;
        }
        link.className = "internalLink";
    }
    #bindResetFormAction(link, resetForm) {
        const otherClickAction = link.onclick;
        if (!otherClickAction) {
            link.href = this.linkService.getAnchorUrl("");
        }
        link.className = "internalLink";
        if (!this._fieldObjects) {
            warn(`#bindResetFormAction - "resetForm" action not supported, ` +
                "ensure that the `fieldObjects` parameter is provided.");
            if (!otherClickAction) {
                link.onclick = () => false;
            }
            return;
        }
        link.onclick = () => {
            if (otherClickAction) {
                otherClickAction();
            }
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
                if (!domElement || !GetElementsByNameSet.has(domElement)) {
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
        image.style.height = this.container.style.height;
        image.style.width = this.container.style.width;
        image.src =
            this.imageResourcesPath +
                "annotation-" +
                this.data.name.toLowerCase() +
                ".svg";
        image.alt = "[{{type}} Annotation]";
        image.dataset.l10nId = "text_annotation_type";
        image.dataset.l10nArgs = JSON.stringify({ type: this.data.name });
        if (!this.data.hasPopup) {
            this._createPopup(image, this.data);
        }
        this.container.appendChild(image);
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
        const { isWin, isMac } = AnnotationElement.platform;
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
                        value: event.target.checked,
                    },
                });
            });
        }
    }
    _setEventListeners(element, names, getter) {
        for (const [baseName, eventName] of names) {
            if (eventName === "Action"
                || this.data.actions?.[eventName]) {
                this.#setEventListener(element, baseName, eventName, getter);
            }
        }
    }
    _setBackgroundColor(element) {
        const color = this.data.backgroundColor || undefined;
        element.style.backgroundColor =
            color === undefined
                ? "transparent"
                : Util.makeHexColor(color[0], color[1], color[2]);
    }
    _dispatchEventFromSandbox(actions, jsEvent) {
        const setColor = (jsName, styleName, event) => {
            const color = event.detail[jsName];
            event.target.style[styleName] = ColorConverters[`${color[0]}_HTML`](color.slice(1));
        };
        const commonActions = {
            display: (event) => {
                const hidden = event.detail.display % 2 === 1;
                event.target.style.visibility = hidden ? "hidden" : "visible";
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
                event.target.style.visibility = event.detail.hidden
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
                if (event.detail.required) {
                    event.target.setAttribute("required", "");
                }
                else {
                    event.target.removeAttribute("required");
                }
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
        };
        for (const name of Object.keys(jsEvent.detail)) {
            const action = actions[name] || commonActions[name];
            if (action) {
                action(jsEvent);
            }
        }
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
                valueAsString: this.data.fieldValue,
            });
            const textContent = storedData.valueAsString || storedData.value || "";
            const elementData = Object.create(null);
            if (this.data.multiLine) {
                element = html("textarea");
                element.textContent = textContent.toString();
            }
            else {
                element = html("input");
                element.type = "text";
                element.setAttribute("value", textContent.toString());
            }
            GetElementsByNameSet.add(element);
            element.disabled = this.data.readOnly;
            element.name = this.data.fieldName;
            element.tabIndex = DEFAULT_TAB_INDEX;
            elementData.userValue = textContent.toString();
            element.setAttribute("id", id);
            element.addEventListener("input", event => {
                storage.setValue(id, { value: event.target.value });
                this.setPropertyOnSiblings(element, "value", event.target.value, "value");
            });
            element.addEventListener("resetform", event => {
                const defaultValue = this.data.defaultFieldValue || "";
                element.value = elementData.userValue = defaultValue;
                delete elementData.formattedValue;
            });
            let blurListener = (event) => {
                if (elementData.formattedValue) {
                    event.target.value = elementData.formattedValue;
                }
                // Reset the cursor position to the start of the field (issue 12359).
                event.target.scrollLeft = 0;
                elementData.beforeInputSelectionRange = undefined;
            };
            if (this.enableScripting && this.hasJSActions) {
                element.addEventListener("focus", event => {
                    if (elementData.userValue) {
                        event.target.value = elementData.userValue;
                    }
                });
                element.addEventListener("updatefromsandbox", (jsEvent) => {
                    const actions = {
                        value(event) {
                            elementData.userValue = event.detail.value || "";
                            storage.setValue(id, { value: elementData.userValue?.toString() });
                            if (!elementData.formattedValue) {
                                event.target.value = elementData.userValue;
                            }
                        },
                        valueAsString(event) {
                            elementData.formattedValue = event.detail.valueAsString || "";
                            if (event.target !== document.activeElement) {
                                // Input hasn't the focus so display formatted string
                                event.target.value = elementData.formattedValue;
                            }
                            storage.setValue(id, {
                                formattedValue: elementData.formattedValue,
                            });
                        },
                        selRange(event) {
                            const [selStart, selEnd] = event.detail.selRange;
                            if (selStart >= 0 && selEnd < event.target.value.length) {
                                event.target.setSelectionRange(selStart, selEnd);
                            }
                        },
                    };
                    this._dispatchEventFromSandbox(actions, jsEvent);
                });
                // Even if the field hasn't any actions
                // leaving it can still trigger some actions with Calculate
                element.addEventListener("keydown", event => {
                    elementData.beforeInputValue = event.target.value;
                    // if the key is one of Escape, Enter or Tab
                    // then the data are committed
                    let commitKey = -1;
                    if (event.key === "Escape") {
                        commitKey = 0;
                    }
                    else if (event.key === "Enter") {
                        commitKey = 2;
                    }
                    else if (event.key === "Tab") {
                        commitKey = 3;
                    }
                    if (commitKey === -1)
                        return;
                    // Save the entered value
                    elementData.userValue = event.target.value;
                    this.linkService.eventBus?.dispatch("dispatcheventinsandbox", {
                        source: this,
                        detail: {
                            id,
                            name: "Keystroke",
                            value: event.target.value,
                            willCommit: true,
                            commitKey,
                            selStart: event.target.selectionStart,
                            selEnd: event.target.selectionEnd,
                        },
                    });
                });
                const _blurListener = blurListener;
                blurListener = undefined;
                element.addEventListener("blur", event => {
                    if (this._mouseState.isDown) {
                        // Focus out using the mouse: data are committed
                        elementData.userValue = event.target.value;
                        this.linkService.eventBus?.dispatch("dispatcheventinsandbox", {
                            source: this,
                            detail: {
                                id,
                                name: "Keystroke",
                                value: event.target.value,
                                willCommit: true,
                                commitKey: 1,
                                selStart: event.target.selectionStart,
                                selEnd: event.target.selectionEnd,
                            },
                        });
                    }
                    _blurListener(event);
                });
                element.addEventListener("mousedown", event => {
                    elementData.beforeInputValue = event.target.value;
                    elementData.beforeInputSelectionRange = undefined;
                });
                element.addEventListener("keyup", event => {
                    // keyup is triggered after input
                    if (event.target.selectionStart === event.target.selectionEnd) {
                        elementData.beforeInputSelectionRange = undefined;
                    }
                });
                element.addEventListener("select", event => {
                    elementData.beforeInputSelectionRange = [
                        event.target.selectionStart,
                        event.target.selectionEnd,
                    ];
                });
                if (this.data.actions?.Keystroke) {
                    // We should use beforeinput but this
                    // event isn't available in Firefox
                    element.addEventListener("input", event => {
                        let selStart = -1;
                        let selEnd = -1;
                        if (elementData.beforeInputSelectionRange) {
                            [selStart, selEnd] = elementData.beforeInputSelectionRange;
                        }
                        this.linkService.eventBus?.dispatch("dispatcheventinsandbox", {
                            source: this,
                            detail: {
                                id,
                                name: "Keystroke",
                                value: elementData.beforeInputValue,
                                change: event.data,
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
                ], event => event.target.value);
            }
            if (blurListener) {
                element.addEventListener("blur", blurListener);
            }
            if (this.data.maxLen !== undefined) {
                element.maxLength = this.data.maxLen;
            }
            if (this.data.comb) {
                const fieldWidth = this.data.rect[2] - this.data.rect[0];
                const combWidth = fieldWidth / this.data.maxLen;
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
        this.#setTextStyle(element);
        this._setBackgroundColor(element);
        this.container.appendChild(element);
        return this.container;
    }
    /**
     * Apply text styles to the text in the element.
     */
    #setTextStyle(element) {
        const TEXT_ALIGNMENT = ["left", "center", "right"];
        const { fontSize, fontColor } = this.data.defaultAppearanceData;
        const style = element.style;
        // TODO: If the font-size is zero, calculate it based on the height and
        //       width of the element.
        // Not setting `style.fontSize` will use the default font-size for now.
        if (fontSize) {
            style.fontSize = `${fontSize}px`;
        }
        style.color = Util.makeHexColor(fontColor[0], fontColor[1], fontColor[2]);
        if (this.data.textAlignment !== undefined) {
            style.textAlign = TEXT_ALIGNMENT[this.data.textAlignment];
        }
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
        element.disabled = data.readOnly;
        element.type = "checkbox";
        element.name = data.fieldName;
        if (value) {
            element.setAttribute("checked", true);
        }
        element.setAttribute("id", id);
        element.setAttribute("exportValue", data.exportValue);
        element.tabIndex = DEFAULT_TAB_INDEX;
        element.addEventListener("change", event => {
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
        element.addEventListener("resetform", event => {
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
            ], event => event.target.checked);
        }
        this._setBackgroundColor(element);
        this.container.appendChild(element);
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
        element.disabled = data.readOnly;
        element.type = "radio";
        element.name = data.fieldName;
        if (value) {
            element.setAttribute("checked", true);
        }
        element.setAttribute("id", id);
        element.tabIndex = DEFAULT_TAB_INDEX;
        element.addEventListener("change", event => {
            const { name, checked } = event.target;
            for (const radio of this._getElementsByName(name, /* skipId = */ id)) {
                storage.setValue(radio.id, { value: false });
            }
            storage.setValue(id, { value: checked });
        });
        element.addEventListener("resetform", event => {
            const defaultValue = data.defaultFieldValue;
            event.target.checked =
                defaultValue !== null &&
                    defaultValue !== undefined &&
                    defaultValue === data.buttonValue;
        });
        if (this.enableScripting && this.hasJSActions) {
            const pdfButtonValue = data.buttonValue;
            element.addEventListener("updatefromsandbox", (jsEvent) => {
                const actions = {
                    value: event => {
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
            ], event => event.target.checked);
        }
        this._setBackgroundColor(element);
        this.container.appendChild(element);
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
        return container;
    }
}
class ChoiceWidgetAnnotationElement extends WidgetAnnotationElement {
    constructor(parameters) {
        super(parameters, {
            isRenderable: parameters.renderForms
        });
    }
    render() {
        this.container.className = "choiceWidgetAnnotation";
        const storage = this.annotationStorage;
        const id = this.data.id;
        // For printing/saving we currently only support choice widgets with one
        // option selection. Therefore, listboxes (#12189) and comboboxes (#12224)
        // are not properly printed/saved yet, so we only store the first item in
        // the field value array instead of the entire array. Once support for those
        // two field types is implemented, we should use the same pattern as the
        // other interactive widgets where the return value of `getValue`
        // is used and the full array of field values is stored.
        storage.getValue(id, {
            value: this.data.fieldValue.length > 0 ? this.data.fieldValue[0] : undefined,
        });
        let { fontSize } = this.data.defaultAppearanceData;
        if (!fontSize) {
            fontSize = 9;
        }
        const fontSizeStyle = `calc(${fontSize}px * var(--zoom-factor))`;
        const selectElement = html("select");
        GetElementsByNameSet.add(selectElement);
        selectElement.disabled = this.data.readOnly;
        selectElement.name = this.data.fieldName;
        selectElement.setAttribute("id", id);
        selectElement.tabIndex = DEFAULT_TAB_INDEX;
        selectElement.style.fontSize = `${fontSize}px`;
        if (!this.data.combo) {
            // List boxes have a size and (optionally) multiple selection.
            selectElement.size = this.data.options.length;
            if (this.data.multiSelect) {
                selectElement.multiple = true;
            }
        }
        selectElement.addEventListener("resetform", event => {
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
            if (this.data.combo) {
                optionElement.style.fontSize = fontSizeStyle;
            }
            if (this.data.fieldValue.includes(option.exportValue)) {
                optionElement.setAttribute("selected", true);
            }
            selectElement.appendChild(optionElement);
        }
        const getValue = (event, isExport) => {
            const name = isExport ? "value" : "textContent";
            const options = event.target.options;
            if (!event.target.multiple) {
                return options.selectedIndex === -1
                    ? null
                    : options[options.selectedIndex][name];
            }
            return Array.prototype.filter
                .call(options, (option) => option.selected)
                .map((option) => option[name]);
        };
        const getItems = (event) => {
            const options = event.target.options;
            return Array.prototype.map.call(options, (option) => {
                return { displayValue: option.textContent, exportValue: option.value };
            });
        };
        if (this.enableScripting && this.hasJSActions) {
            selectElement.addEventListener("updatefromsandbox", (jsEvent) => {
                const actions = {
                    value(event) {
                        const value = event.detail.value;
                        const values = new Set(Array.isArray(value) ? value : [value]);
                        for (const option of selectElement.options) {
                            option.selected = values.has(option.value);
                        }
                        storage.setValue(id, {
                            value: getValue(event, /* isExport */ true),
                        });
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
                            const i = Array.prototype.findIndex.call(options, option => option.selected);
                            if (i === -1) {
                                options[0].selected = true;
                            }
                        }
                        storage.setValue(id, {
                            value: getValue(event, /* isExport */ true),
                            items: getItems(event),
                        });
                    },
                    clear(event) {
                        while (selectElement.length !== 0) {
                            selectElement.remove(0);
                        }
                        storage.setValue(id, { value: null, items: [] });
                    },
                    insert(event) {
                        const { index, displayValue, exportValue } = event.detail.insert;
                        const optionElement = html("option");
                        optionElement.textContent = displayValue;
                        optionElement.value = exportValue;
                        selectElement.insertBefore(optionElement, selectElement.children[index]);
                        storage.setValue(id, {
                            value: getValue(event, /* isExport */ true),
                            items: getItems(event),
                        });
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
                            selectElement.appendChild(optionElement);
                        }
                        if (selectElement.options.length > 0) {
                            selectElement.options[0].selected = true;
                        }
                        storage.setValue(id, {
                            value: getValue(event, /* isExport */ true),
                            items: getItems(event),
                        });
                    },
                    indices(event) {
                        const indices = new Set(event.detail.indices);
                        for (const option of event.target.options) {
                            option.selected = indices.has(option.index);
                        }
                        storage.setValue(id, {
                            value: getValue(event, /* isExport */ true),
                        });
                    },
                    editable(event) {
                        event.target.disabled = !event.detail.editable;
                    },
                };
                this._dispatchEventFromSandbox(actions, jsEvent);
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
            this._setEventListeners(selectElement, [
                ["focus", "Focus"],
                ["blur", "Blur"],
                ["mousedown", "Mouse Down"],
                ["mouseenter", "Mouse Enter"],
                ["mouseleave", "Mouse Exit"],
                ["mouseup", "Mouse Up"],
                ["input", "Action"],
            ], event => event.target.checked //kkkk bug?
            // event => (<El>event.target).selectedIndex
            );
        }
        else {
            selectElement.addEventListener("input", event => {
                storage.setValue(id, { value: getValue(event) });
            });
        }
        this._setBackgroundColor(selectElement);
        this.container.appendChild(selectElement);
        return this.container;
    }
}
class PopupAnnotationElement extends AnnotationElement {
    constructor(parameters) {
        const isRenderable = !!(parameters.data.titleObj?.str ||
            parameters.data.contentsObj?.str ||
            parameters.data.richText?.str);
        super(parameters, { isRenderable });
    }
    render() {
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
        this.container.className = "popupAnnotation";
        if (IGNORE_TYPES.includes(this.data.parentType)) {
            return this.container;
        }
        const selector = `[data-annotation-id="${this.data.parentId}"]`;
        const parentElements = this.layer.querySelectorAll(selector);
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
        const popupLeft = rect[0] + this.data.parentRect[2] - this.data.parentRect[0];
        const popupTop = rect[1];
        this.container.style.transformOrigin = `${-popupLeft}px ${-popupTop}px`;
        this.container.style.left = `${popupLeft}px`;
        this.container.style.top = `${popupTop}px`;
        this.container.appendChild(popup.render());
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
    /** @override */
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
        popup.appendChild(title);
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
            popup.appendChild(modificationDate);
        }
        if (this.richText?.str
            && (!this.contentsObj?.str || this.contentsObj.str === this.richText.str)) {
            XfaLayer.render({
                xfaHtml: this.richText.html,
                intent: "richText",
                div: popup,
            });
            popup.lastChild.className = "richText popupContent";
        }
        else {
            const contents = this.#formatContents(this.contentsObj);
            popup.appendChild(contents);
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
        wrapper.appendChild(popup);
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
            p.appendChild(textnode(line));
            if (i < ii - 1) {
                p.appendChild(html("br"));
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
            this.container.style.zIndex += 1;
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
            this.container.style.zIndex -= 1;
        }
    }
}
class FreeTextAnnotationElement extends AnnotationElement {
    constructor(parameters) {
        const isRenderable = !!(parameters.data.hasPopup ||
            parameters.data.titleObj?.str ||
            parameters.data.contentsObj?.str ||
            parameters.data.richText?.str);
        super(parameters, { isRenderable, ignoreBorder: true });
    }
    /**
     * Render the free text annotation's HTML element in the empty container.
     */
    render() {
        this.container.className = "freeTextAnnotation";
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
        const width = data.rect[2] - data.rect[0];
        const height = data.rect[3] - data.rect[1];
        const svg = this.svgFactory.create(width, height);
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
        svg.appendChild(line);
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
        const width = data.rect[2] - data.rect[0];
        const height = data.rect[3] - data.rect[1];
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
        const width = data.rect[2] - data.rect[0];
        const height = data.rect[3] - data.rect[1];
        const svg = this.svgFactory.create(width, height);
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
        svg.appendChild(circle);
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
        const width = data.rect[2] - data.rect[0];
        const height = data.rect[3] - data.rect[1];
        const svg = this.svgFactory.create(width, height);
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
        svg.appendChild(polyline);
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
        const width = data.rect[2] - data.rect[0];
        const height = data.rect[3] - data.rect[1];
        const svg = this.svgFactory.create(width, height);
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
            svg.appendChild(polyline);
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
        this.filename = getFilenameFromUrl(filename);
        this.content = content;
        this.linkService.eventBus?.dispatch("fileattachmentannotation", {
            source: this,
            id: stringToPDFString(filename),
            filename,
            content,
        });
    }
    render() {
        this.container.className = "fileAttachmentAnnotation";
        const trigger = div();
        trigger.style.height = this.container.style.height;
        trigger.style.width = this.container.style.width;
        trigger.addEventListener("dblclick", this.#download);
        if (!this.data.hasPopup
            && (this.data.titleObj?.str ||
                this.data.contentsObj?.str ||
                this.data.richText)) {
            this._createPopup(trigger, this.data);
        }
        this.container.appendChild(trigger);
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
    /**
     * Render a new annotation layer with all annotation elements.
     */
    static render(parameters) {
        const sortedAnnotations = [];
        const popupAnnotations = [];
        // Ensure that Popup annotations are handled last, since they're dependant
        // upon the parent annotation having already been rendered (please refer to
        // the `PopupAnnotationElement.render` method); fixes issue 11362.
        for (const data of parameters.annotations) {
            if (!data)
                continue;
            if (data.annotationType === AnnotationType.POPUP) {
                popupAnnotations.push(data);
                continue;
            }
            sortedAnnotations.push(data);
        }
        if (popupAnnotations.length) {
            sortedAnnotations.push(...popupAnnotations);
        }
        const div = parameters.div;
        for (const data of sortedAnnotations) {
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
                annotationStorage: parameters.annotationStorage || new AnnotationStorage(),
                enableScripting: parameters.enableScripting,
                hasJSActions: parameters.hasJSActions,
                fieldObjects: parameters.fieldObjects,
                mouseState: parameters.mouseState || { isDown: false },
            });
            if (element.isRenderable) {
                const rendered = element.render();
                if (data.hidden) {
                    rendered.style.visibility = "hidden";
                }
                if (Array.isArray(rendered)) {
                    for (const renderedElement of rendered) {
                        div.appendChild(renderedElement);
                    }
                }
                else {
                    if (element instanceof PopupAnnotationElement) {
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
    static update(parameters) {
        const { page, viewport, annotations, annotationCanvasMap, div } = parameters;
        const transform = viewport.transform;
        const matrix = `matrix(${transform.join(",")})`;
        let scale, ownMatrix;
        for (const data of annotations) {
            const elements = div.querySelectorAll(`[data-annotation-id="${data.id}"]`);
            if (elements) {
                for (const element of elements) {
                    if (data.hasOwnCanvas) {
                        const rect = Util.normalizeRect([
                            data.rect[0],
                            page.view[3] - data.rect[1] + page.view[1],
                            data.rect[2],
                            page.view[3] - data.rect[3] + page.view[1],
                        ]);
                        if (!ownMatrix) {
                            // When an annotation has its own canvas, then
                            // the scale has been already applied to the canvas,
                            // so we musn't scale it twice.
                            scale = Math.abs(transform[0] || transform[1]);
                            const ownTransform = transform.slice();
                            for (let i = 0; i < 4; i++) {
                                ownTransform[i] = Math.sign(ownTransform[i]);
                            }
                            ownMatrix = `matrix(${ownTransform.join(",")})`;
                        }
                        const left = rect[0] * scale;
                        const top = rect[1] * scale;
                        element.style.left = `${left}px`;
                        element.style.top = `${top}px`;
                        element.style.transformOrigin = `${-left}px ${-top}px`;
                        element.style.transform = ownMatrix;
                    }
                    else {
                        element.style.transform = matrix;
                    }
                }
            }
        }
        this.#setAnnotationCanvasMap(div, annotationCanvasMap);
        div.hidden = false;
    }
    static #setAnnotationCanvasMap(div, annotationCanvasMap) {
        if (!annotationCanvasMap)
            return;
        for (const [id, canvas] of annotationCanvasMap) {
            const element = div.querySelector(`[data-annotation-id="${id}"]`);
            if (!element)
                continue;
            const { firstChild } = element;
            if (firstChild.nodeName === "CANVAS") {
                element.replaceChild(canvas, firstChild);
            }
            else {
                element.insertBefore(canvas, firstChild);
            }
        }
        annotationCanvasMap.clear();
    }
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=annotation_layer.js.map