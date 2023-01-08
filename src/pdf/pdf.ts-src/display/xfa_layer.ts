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

import { html as createHTML, textnode } from "../../../lib/dom.ts";
import { type IPDFLinkService } from "../../pdf.ts-web/interfaces.ts";
import { type XFAElObj, type XFAHTMLObj } from "../core/xfa/alias.ts";
import { AnnotationStorage } from "./annotation_storage.ts";
import { type AnnotIntent, PDFPageProxy } from "./api.ts";
import { PageViewport } from "./display_utils.ts";
import { XfaText } from "./xfa_text.ts";
/*80--------------------------------------------------------------------------*/

interface _XfaLayerP {
  viewport?: PageViewport;
  div: HTMLDivElement;
  xfaHtml: XFAElObj;
  // xfaHtml:XFAElObj | undefined;
  page?: PDFPageProxy | undefined;
  annotationStorage?: AnnotationStorage | undefined;
  linkService?: IPDFLinkService;

  /**
   * (default value is 'display').
   */
  intent: AnnotIntent;
}

interface _SetAttributesP {
  html: Element;
  element: XFAElObj;
  storage?: AnnotationStorage | undefined;
  intent?: AnnotIntent;
  linkService: IPDFLinkService;
}

export abstract class XfaLayer {
  static setupStorage(
    html: Element,
    id: string,
    element: XFAElObj,
    storage: AnnotationStorage,
    intent?: AnnotIntent,
  ) {
    const storedData = storage.getValue(id, { value: undefined });
    switch (element.name) {
      case "textarea":
        if (storedData.value !== undefined && storedData.value !== undefined) {
          html.textContent = <any> storedData.value;
        }
        if (intent === "print") {
          break;
        }

        html.addEventListener("input", (event) => {
          storage.setValue(id, {
            value: (<HTMLTextAreaElement> event.target).value,
          });
        });
        break;
      case "input":
        if (
          (<XFAHTMLObj> element).attributes!.type === "radio" ||
          (<XFAHTMLObj> element).attributes!.type === "checkbox"
        ) {
          if (storedData.value === element.attributes!.xfaOn) {
            html.setAttribute("checked", <any> true);
          } else if (storedData.value === element.attributes!.xfaOff) {
            // The checked attribute may have been set when opening the file,
            // unset through the UI and we're here because of printing.
            html.removeAttribute("checked");
          }
          if (intent === "print") {
            break;
          }
          html.addEventListener("change", (event) => {
            storage.setValue(id, {
              value: (<any> event.target).checked
                ? (<Element> event.target).getAttribute("xfaOn") ?? undefined
                : (<Element> event.target).getAttribute("xfaOff") ?? undefined,
            });
          });
          html.addEventListener("change", (event) => {
            storage.setValue(id, {
              value: (<Element> event.target).getAttribute("xfaOn")!,
            });
          });
        } else {
          if (storedData.value !== null && storedData.value !== undefined) {
            html.setAttribute("value", <any> storedData.value);
          }
          if (intent === "print") {
            break;
          }
          html.addEventListener("input", (event) => {
            storage.setValue(id, {
              value: (<HTMLInputElement> event.target).value,
            });
          });
        }
        break;
      case "select":
        if (storedData.value !== null && storedData.value !== undefined) {
          for (const option of element.children!) {
            if ((<XFAHTMLObj> option).attributes!.value === storedData.value) {
              (<XFAHTMLObj> option).attributes!.selected = true;
            }
          }
        }
        html.addEventListener("input", (event) => {
          const options = (<HTMLSelectElement> event.target).options;
          const value = options.selectedIndex === -1
            ? ""
            : options[options.selectedIndex].value;
          storage.setValue(id, { value });
        });
        break;
    }
  }

  static setAttributes(
    { html, element, storage, intent, linkService }: _SetAttributesP,
  ) {
    const { attributes } = element;
    const isHTMLAnchorElement = html instanceof HTMLAnchorElement;

    if (attributes!.type === "radio") {
      // Avoid to have a radio group when printing with the same as one
      // already displayed.
      attributes!.name = `${attributes!.name}-${intent}`;
    }
    for (const [key, value] of Object.entries(attributes!)) {
      if (value === null || value === undefined) {
        continue;
      }

      switch (key) {
        case "class":
          if (value.length) {
            html.setAttribute(key, value.join(" "));
          }
          break;
        case "dataId":
          // We don't need to add dataId in the html object but it can
          // be useful to know its value when writing printing tests:
          // in this case, don't skip dataId to have its value.
          break;
        case "id":
          html.setAttribute("data-element-id", value);
          break;
        case "style":
          Object.assign((html as HTMLElement).style, value);
          break;
        case "textContent":
          html.textContent = value;
          break;
        default:
          if (!isHTMLAnchorElement || (key !== "href" && key !== "newWindow")) {
            html.setAttribute(key, value);
          }
      }
    }

    if (isHTMLAnchorElement) {
      linkService.addLinkAttributes(
        html,
        attributes!.href!,
        attributes!.newWindow,
      );
    }

    // Set the value after the others to be sure to overwrite any other values.
    if (storage && attributes!.dataId) {
      this.setupStorage(html, attributes!.dataId, element, storage);
    }
  }

  /**
   * Render the XFA layer.
   */
  static render(parameters: _XfaLayerP) {
    const storage = parameters.annotationStorage;
    const linkService = parameters.linkService!;
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
    const stack = [<[XFAElObj, number, Element]> [root, -1, rootHtml]];

    const rootDiv = parameters.div;
    rootDiv.append(rootHtml);

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
      const [parent, i, html] = stack.at(-1)!;
      if (i + 1 === parent.children!.length) {
        stack.pop();
        continue;
      }

      const child = <XFAElObj> parent.children![++stack.at(-1)![1]];
      if (child === undefined) {
        continue;
      }

      const { name } = child;
      if (name === "#text") {
        const node = textnode((<XFAHTMLObj> child).value!);
        textDivs.push(node);
        html.append(node);
        continue;
      }

      let childHtml;
      if (child?.attributes?.xmlns) {
        childHtml = document.createElementNS(child.attributes.xmlns, name);
      } else {
        childHtml = createHTML(name);
      }

      html.append(childHtml);
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
      } else if (child.value) {
        const node = textnode(child.value);
        if (XfaText.shouldBuildText(name)) {
          textDivs.push(node);
        }
        childHtml.append(node);
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

    for (
      const el of rootDiv.querySelectorAll(
        ".xfaNonInteractive input, .xfaNonInteractive textarea",
      )
    ) {
      el.setAttribute("readOnly", <any> true);
    }

    return {
      textDivs,
    };
  }

  /**
   * Update the XFA layer.
   */
  static update(parameters: _XfaLayerP) {
    const transform = `matrix(${parameters.viewport!.transform.join(",")})`;
    parameters.div.style.transform = transform;
    parameters.div.hidden = false;
  }
}
/*80--------------------------------------------------------------------------*/
