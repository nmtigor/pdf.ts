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

// eslint-disable-next-line max-len
/** @typedef {import("./annotation_storage").AnnotationStorage} AnnotationStorage */
/** @typedef {import("./display_utils").PageViewport} PageViewport */
/** @typedef {import("../../web/interfaces").IPDFLinkService} IPDFLinkService */

import { html as createHTML, textnode } from "@fe-lib/dom.ts";
import type { IPDFLinkService } from "@pdf.ts-web/interfaces.ts";
import type { XFAElObj, XFAHTMLObj } from "../core/xfa/alias.ts";
import type { AnnotationStorage } from "./annotation_storage.ts";
import type { AnnotIntent, PDFPageProxy } from "./api.ts";
import type { PageViewport } from "./display_utils.ts";
import { XfaText } from "./xfa_text.ts";
/*80--------------------------------------------------------------------------*/

interface XfaLayerP_ {
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

        html.on("input", (event) => {
          storage.setValue(id, {
            value: (event.target as HTMLTextAreaElement).value,
          });
        });
        break;
      case "input":
        if (
          (element as XFAHTMLObj).attributes!.type === "radio" ||
          (element as XFAHTMLObj).attributes!.type === "checkbox"
        ) {
          if (storedData.value === element.attributes!.xfaOn) {
            html.setAttribute("checked", true as any);
          } else if (storedData.value === element.attributes!.xfaOff) {
            // The checked attribute may have been set when opening the file,
            // unset through the UI and we're here because of printing.
            html.removeAttribute("checked");
          }
          if (intent === "print") {
            break;
          }
          html.on("change", (event) => {
            storage.setValue(id, {
              value: (event.target as any).checked
                ? (event.target as Element).getAttribute("xfaOn") ?? undefined
                : (event.target as Element).getAttribute("xfaOff") ?? undefined,
            });
          });
          html.on("change", (event) => {
            storage.setValue(id, {
              value: (event.target as Element).getAttribute("xfaOn")!,
            });
          });
        } else {
          if (storedData.value !== null && storedData.value !== undefined) {
            html.setAttribute("value", storedData.value as any);
          }
          if (intent === "print") {
            break;
          }
          html.on("input", (event) => {
            storage.setValue(id, {
              value: (event.target as HTMLInputElement).value,
            });
          });
        }
        break;
      case "select":
        if (storedData.value !== undefined) {
          html.setAttribute("value", storedData.value as any);
          for (const option of element.children!) {
            if ((option as XFAHTMLObj).attributes!.value === storedData.value) {
              (option as XFAHTMLObj).attributes!.selected = true;
            } else if (
              (option as XFAHTMLObj).attributes!.hasOwnProperty("selected")
            ) {
              delete (option as XFAHTMLObj).attributes!.selected;
            }
          }
        }
        html.on("input", (event) => {
          const options = (event.target as HTMLSelectElement).options;
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
  static render(parameters: XfaLayerP_) {
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

      const child = parent.children![++stack.at(-1)![1]] as XFAElObj;
      if (child === undefined) {
        continue;
      }

      const { name } = child;
      if (name === "#text") {
        const node = textnode((child as XFAHTMLObj).value!);
        textDivs.push(node);
        html.append(node);
        continue;
      }

      const childHtml = child?.attributes?.xmlns
        ? document.createElementNS(child.attributes.xmlns, name)
        : createHTML(name);

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
      el.setAttribute("readOnly", true as any);
    }

    return {
      textDivs,
    };
  }

  /**
   * Update the XFA layer.
   */
  static update(parameters: XfaLayerP_) {
    const transform = `matrix(${parameters.viewport!.transform.join(",")})`;
    parameters.div.style.transform = transform;
    parameters.div.hidden = false;
  }
}
/*80--------------------------------------------------------------------------*/
