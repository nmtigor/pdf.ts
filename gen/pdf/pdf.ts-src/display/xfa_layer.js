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
/** @typedef {import("./display_utils").PageViewport} PageViewport */
/** @typedef {import("../../web/interfaces").IPDFLinkService} IPDFLinkService */
import { html as createHTML, textnode } from "../../../lib/dom.js";
import { warn } from "../shared/util.js";
import { XfaText } from "./xfa_text.js";
export class XfaLayer {
    static setupStorage(html, id, element, storage, intent) {
        const storedData = storage.getValue(id, { value: null });
        switch (element.name) {
            case "textarea":
                if (storedData.value !== null && storedData.value !== undefined) {
                    html.textContent = storedData.value;
                }
                if (intent === "print")
                    break;
                html.addEventListener("input", event => {
                    storage.setValue(id, { value: event.target.value });
                });
                break;
            case "input":
                if (element.attributes.type === "radio"
                    || element.attributes.type === "checkbox") {
                    if (storedData.value === element.attributes.xfaOn) {
                        html.setAttribute("checked", true);
                    }
                    else if (storedData.value === element.attributes.xfaOff) {
                        // The checked attribute may have been set when opening the file,
                        // unset through the UI and we're here because of printing.
                        html.removeAttribute("checked");
                    }
                    if (intent === "print")
                        break;
                    html.addEventListener("change", event => {
                        storage.setValue(id, {
                            value: event.target.checked
                                ? event.target.getAttribute("xfaOn")
                                : event.target.getAttribute("xfaOff"),
                        });
                    });
                    html.addEventListener("change", event => {
                        storage.setValue(id, { value: event.target.getAttribute("xfaOn") });
                    });
                }
                else {
                    if (storedData.value !== null && storedData.value !== undefined) {
                        html.setAttribute("value", storedData.value);
                    }
                    if (intent === "print")
                        break;
                    html.addEventListener("input", event => {
                        storage.setValue(id, { value: event.target.value });
                    });
                }
                break;
            case "select":
                if (storedData.value !== null && storedData.value !== undefined) {
                    for (const option of element.children) {
                        if (option.attributes.value === storedData.value) {
                            option.attributes.selected = true;
                        }
                    }
                }
                html.addEventListener("input", event => {
                    const options = event.target.options;
                    const value = options.selectedIndex === -1
                        ? ""
                        : options[options.selectedIndex].value;
                    storage.setValue(id, { value });
                });
                break;
        }
    }
    static setAttributes({ html, element, storage, intent, linkService }) {
        const { attributes } = element;
        const isHTMLAnchorElement = html instanceof HTMLAnchorElement;
        if (attributes.type === "radio") {
            // Avoid to have a radio group when printing with the same as one
            // already displayed.
            attributes.name = `${attributes.name}-${intent}`;
        }
        for (const [key, value] of Object.entries(attributes)) {
            // We don't need to add dataId in the html object but it can
            // be useful to know its value when writing printing tests:
            // in this case, don't skip dataId to have its value.
            if (value === null || value === undefined || key === "dataId")
                continue;
            if (key !== "style") {
                if (key === "textContent") {
                    html.textContent = value;
                }
                else if (key === "class") {
                    if (value.length) {
                        html.setAttribute(key, value.join(" "));
                    }
                }
                else {
                    if (isHTMLAnchorElement && (key === "href" || key === "newWindow")) {
                        continue; // Handled below.
                    }
                    html.setAttribute(key, value);
                }
            }
            else {
                Object.assign(html.style, value);
            }
        }
        if (isHTMLAnchorElement) {
            if (!linkService.addLinkAttributes) {
                warn("XfaLayer.setAttribute - missing `addLinkAttributes`-method on the `linkService`-instance.");
            }
            linkService.addLinkAttributes?.(html, attributes.href, attributes.newWindow);
        }
        // Set the value after the others to be sure overwrite
        // any other values.
        if (storage && attributes.dataId) {
            this.setupStorage(html, attributes.dataId, element, storage);
        }
    }
    /**
     * Render the XFA layer.
     */
    static render(parameters) {
        const storage = parameters.annotationStorage;
        const linkService = parameters.linkService;
        const root = parameters.xfaHtml;
        const intent = parameters.intent || "display";
        const rootHtml = createHTML(root.name);
        if (root.attributes) {
            this.setAttributes({
                html: rootHtml,
                element: root,
                intent,
                linkService,
            });
        }
        const stack = [[root, -1, rootHtml]];
        const rootDiv = parameters.div;
        rootDiv.appendChild(rootHtml);
        if (parameters.viewport) {
            const transform = `matrix(${parameters.viewport.transform.join(",")})`;
            rootDiv.style.transform = transform;
        }
        // Set defaults.
        if (intent !== "richText") {
            rootDiv.setAttribute("class", "xfaLayer xfaFont");
        }
        // Text nodes used for the text highlighter.
        const textDivs = [];
        while (stack.length > 0) {
            const [parent, i, html] = stack[stack.length - 1];
            if (i + 1 === parent.children.length) {
                stack.pop();
                continue;
            }
            const child = parent.children[++stack[stack.length - 1][1]];
            if (child === undefined)
                continue;
            const { name } = child;
            if (name === "#text") {
                const node = textnode(child.value);
                textDivs.push(node);
                html.appendChild(node);
                continue;
            }
            let childHtml;
            if (child?.attributes?.xmlns) {
                childHtml = document.createElementNS(child.attributes.xmlns, name);
            }
            else {
                childHtml = createHTML(name);
            }
            html.appendChild(childHtml);
            if (child.attributes) {
                this.setAttributes({
                    html: childHtml,
                    element: child,
                    storage,
                    intent,
                    linkService,
                });
            }
            if (child.children && child.children.length > 0) {
                stack.push([child, -1, childHtml]);
            }
            else if (child.value) {
                const node = textnode(child.value);
                if (XfaText.shouldBuildText(name)) {
                    textDivs.push(node);
                }
                childHtml.appendChild(node);
            }
        }
        /**
         * TODO: re-enable that stuff once we've JS implementation.
         * See https://bugzilla.mozilla.org/show_bug.cgi?id=1719465.
         *
         * for (const el of rootDiv.querySelectorAll(
         * ".xfaDisabled input, .xfaDisabled textarea"
         * )) {
         * el.setAttribute("disabled", true);
         * }
         * for (const el of rootDiv.querySelectorAll(
         * ".xfaReadOnly input, .xfaReadOnly textarea"
         * )) {
         * el.setAttribute("readOnly", true);
         * }
         */
        for (const el of rootDiv.querySelectorAll(".xfaNonInteractive input, .xfaNonInteractive textarea")) {
            el.setAttribute("readOnly", true);
        }
        return {
            textDivs,
        };
    }
    /**
     * Update the XFA layer.
     */
    static update(parameters) {
        const transform = `matrix(${parameters.viewport.transform.join(",")})`;
        parameters.div.style.transform = transform;
        parameters.div.hidden = false;
    }
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=xfa_layer.js.map