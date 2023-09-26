/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
/* Copyright 2013 Rob Wu <rob@robwu.nl>
 * https://github.com/Rob--W/grab-to-pan.js
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
import { html } from "../../lib/dom.js";
/*80--------------------------------------------------------------------------*/
// Class name of element which can be grabbed.
const CSS_CLASS_GRAB = "grab-to-pan-grab";
export class GrabToPan {
    element;
    document;
    onActiveChanged;
    overlay;
    active;
    scrollLeftStart;
    scrollTopStart;
    clientXStart;
    clientYStart;
    /**
     * Construct a GrabToPan instance for a given HTML element.
     */
    constructor({ element }) {
        this.element = element;
        this.document = element.ownerDocument;
        // This overlay will be inserted in the document when the mouse moves during
        // a grab operation, to ensure that the cursor has the desired appearance.
        const overlay = (this.overlay = html("div"));
        overlay.className = "grab-to-pan-grabbing";
    }
    /**
     * Bind a mousedown event to the element to enable grab-detection.
     */
    activate = () => {
        if (!this.active) {
            this.active = true;
            this.element.on("mousedown", this.#onMouseDown, true);
            this.element.classList.add(CSS_CLASS_GRAB);
        }
    };
    /**
     * Removes all events. Any pending pan session is immediately stopped.
     */
    deactivate = () => {
        if (this.active) {
            this.active = false;
            this.element.off("mousedown", this.#onMouseDown, true);
            this.#endPan();
            this.element.classList.remove(CSS_CLASS_GRAB);
        }
    };
    toggle = () => {
        if (this.active) {
            this.deactivate();
        }
        else
            this.activate();
    };
    /**
     * Whether to not pan if the target element is clicked.
     * Override this method to change the default behaviour.
     *
     * @param node The target of the event.
     * @return Whether to not react to the click event.
     */
    ignoreTarget = (node) => {
        // Check whether the clicked element is, a child of, an input element/link.
        return node.matches("a[href], a[href] *, input, textarea, button, button *, select, option");
    };
    #onMouseDown = (event) => {
        if (event.button !== 0 || this.ignoreTarget(event.target)) {
            return;
        }
        if (event.originalTarget) {
            try {
                // eslint-disable-next-line no-unused-expressions
                event.originalTarget.tagName;
            }
            catch {
                // Mozilla-specific: element is a scrollbar (XUL element)
                return;
            }
        }
        this.scrollLeftStart = this.element.scrollLeft;
        this.scrollTopStart = this.element.scrollTop;
        this.clientXStart = event.clientX;
        this.clientYStart = event.clientY;
        this.document.on("mousemove", this.#onMouseMove, true);
        this.document.on("mouseup", this.#endPan, true);
        // When a scroll event occurs before a mousemove, assume that the user
        // dragged a scrollbar (necessary for Opera Presto, Safari and IE)
        // (not needed for Chrome/Firefox)
        this.element.on("scroll", this.#endPan, true);
        event.preventDefault();
        event.stopPropagation();
        const focusedElement = document.activeElement;
        if (focusedElement && !focusedElement.contains(event.target)) {
            focusedElement.blur();
        }
    };
    #onMouseMove = (event) => {
        this.element.off("scroll", this.#endPan, true);
        if (!(event.buttons & 1)) {
            // The left mouse button is released.
            this.#endPan();
            return;
        }
        const xDiff = event.clientX - this.clientXStart;
        const yDiff = event.clientY - this.clientYStart;
        this.element.scrollTo({
            top: this.scrollTopStart - yDiff,
            left: this.scrollLeftStart - xDiff,
            behavior: "instant",
        });
        if (!this.overlay.parentNode) {
            document.body.append(this.overlay);
        }
    };
    #endPan = () => {
        this.element.off("scroll", this.#endPan, true);
        this.document.off("mousemove", this.#onMouseMove, true);
        this.document.off("mouseup", this.#endPan, true);
        // Note: ChildNode.remove doesn't throw if the parentNode is undefined.
        this.overlay.remove();
    };
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=grab_to_pan.js.map