/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2024
 *
 * @module pdf/pdf.ts-web/caret_browsing.ts
 * @license Apache-2.0
 ******************************************************************************/
var _a;
import { MOZCENTRAL, PDFJSDev } from "../../global.js";
/*80--------------------------------------------------------------------------*/
// Used to compare floats: there is no exact equality due to rounding errors.
const PRECISION = 1e-1;
export class CaretBrowsingMode {
    #mainContainer;
    #toolBarHeight;
    #viewerContainer;
    constructor(mainContainer, viewerContainer, toolbarContainer) {
        this.#mainContainer = mainContainer;
        this.#viewerContainer = viewerContainer;
        this.#toolBarHeight = toolbarContainer?.getBoundingClientRect().height ?? 0;
    }
    /**
     * Return true if the two rectangles are on the same line.
     */
    #isOnSameLine(rect1, rect2) {
        const top1 = rect1.y;
        const bot1 = rect1.bottom;
        const mid1 = rect1.y + rect1.height / 2;
        const top2 = rect2.y;
        const bot2 = rect2.bottom;
        const mid2 = rect2.y + rect2.height / 2;
        return (top1 <= mid2 && mid2 <= bot1) || (top2 <= mid1 && mid1 <= bot2);
    }
    /**
     * Return `true` if the rectangle is:
     *  - under the caret when `isUp === false`.
     *  - over the caret when `isUp === true`.
     */
    #isUnderOver(rect, x, y, isUp) {
        const midY = rect.y + rect.height / 2;
        return ((isUp ? y >= midY : y <= midY) &&
            rect.x - PRECISION <= x &&
            x <= rect.right + PRECISION);
    }
    /**
     * Check if the rectangle is visible.
     */
    #isVisible(rect) {
        return (rect.top >= this.#toolBarHeight &&
            rect.left >= 0 &&
            rect.bottom <=
                (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth));
    }
    /**
     * Get the position of the caret.
     */
    #getCaretPosition(selection, isUp) {
        const { focusNode, focusOffset } = selection;
        const range = document.createRange();
        range.setStart(focusNode, focusOffset);
        range.setEnd(focusNode, focusOffset);
        const rect = range.getBoundingClientRect();
        return [rect.x, isUp ? rect.top : rect.bottom];
    }
    static #caretPositionFromPoint(x, y) {
        /*#static*/  {
            if (!document.caretPositionFromPoint) {
                const { startContainer: offsetNode, startOffset: offset } = document
                    .caretRangeFromPoint(x, y);
                return { offsetNode, offset };
            }
        }
        return document.caretPositionFromPoint(x, y);
    }
    #setCaretPositionHelper(selection, caretX, select, element, rect) {
        rect ||= element.getBoundingClientRect();
        if (caretX <= rect.x + PRECISION) {
            if (select) {
                selection.extend(element.firstChild, 0);
            }
            else {
                selection.setPosition(element.firstChild, 0);
            }
            return;
        }
        if (rect.right - PRECISION <= caretX) {
            const { lastChild } = element;
            if (select) {
                selection.extend(lastChild, lastChild.length);
            }
            else {
                selection.setPosition(lastChild, lastChild.length);
            }
            return;
        }
        const midY = rect.y + rect.height / 2;
        let caretPosition = _a.#caretPositionFromPoint(caretX, midY);
        let parentElement = caretPosition.offsetNode?.parentElement;
        if (parentElement && parentElement !== element) {
            // There is an element on top of the one in the text layer, so we
            // need to hide all the elements (except the one in the text layer)
            // at this position in order to get the correct caret position.
            const elementsAtPoint = document.elementsFromPoint(caretX, midY);
            const savedVisibilities = [];
            for (const el of elementsAtPoint) {
                if (el === element) {
                    break;
                }
                const { style } = el;
                savedVisibilities.push([el, style.visibility]);
                style.visibility = "hidden";
            }
            caretPosition = _a.#caretPositionFromPoint(caretX, midY);
            parentElement = caretPosition.offsetNode?.parentElement;
            for (const [el, visibility] of savedVisibilities) {
                el.style.visibility = visibility;
            }
        }
        if (parentElement !== element) {
            // The element targeted by caretPositionFromPoint isn't in the text
            // layer.
            if (select) {
                selection.extend(element.firstChild, 0);
            }
            else {
                selection.setPosition(element.firstChild, 0);
            }
            return;
        }
        if (select) {
            selection.extend(caretPosition.offsetNode, caretPosition.offset);
        }
        else {
            selection.setPosition(caretPosition.offsetNode, caretPosition.offset);
        }
    }
    /**
     * Set the caret position or extend the selection (it depends on the select
     * parameter).
     */
    #setCaretPosition(select, selection, newLineElement, newLineElementRect, caretX) {
        if (this.#isVisible(newLineElementRect)) {
            this.#setCaretPositionHelper(selection, caretX, select, newLineElement, newLineElementRect);
            return;
        }
        this.#mainContainer.on("scrollend", this.#setCaretPositionHelper.bind(this, selection, caretX, select, newLineElement, undefined), { once: true });
        newLineElement.scrollIntoView();
    }
    /**
     * Get the node on the next page.
     */
    #getNodeOnNextPage(textLayer, isUp) {
        while (true) {
            const page = textLayer.closest(".page");
            const pageNumber = parseInt(page.getAttribute("data-page-number"));
            const nextPage = isUp ? pageNumber - 1 : pageNumber + 1;
            textLayer = this.#viewerContainer.querySelector(`.page[data-page-number="${nextPage}"] .textLayer`);
            if (!textLayer) {
                return undefined;
            }
            const walker = document.createTreeWalker(textLayer, NodeFilter.SHOW_TEXT);
            const node = isUp ? walker.lastChild() : walker.firstChild();
            if (node) {
                return node;
            }
        }
    }
    /**
     * Move the caret in the given direction.
     */
    moveCaret(isUp, select) {
        const selection = document.getSelection();
        if (selection.rangeCount === 0) {
            return;
        }
        const { focusNode } = selection;
        const focusElement = focusNode.nodeType !== Node.ELEMENT_NODE
            ? focusNode.parentElement
            : focusNode;
        const root = focusElement.closest(".textLayer");
        if (!root) {
            return;
        }
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        walker.currentNode = focusNode;
        // Move to the next element which is not on the same line as the focus
        // element.
        const focusRect = focusElement.getBoundingClientRect();
        let newLineElement = null;
        const nodeIterator = (isUp ? walker.previousSibling : walker.nextSibling).bind(walker);
        while (nodeIterator()) {
            const element = walker.currentNode.parentElement;
            if (!this.#isOnSameLine(focusRect, element.getBoundingClientRect())) {
                newLineElement = element;
                break;
            }
        }
        if (!newLineElement) {
            // Need to find the next line on the next page.
            const node = this.#getNodeOnNextPage(root, isUp);
            if (!node) {
                return;
            }
            if (select) {
                const lastNode = (isUp ? walker.firstChild() : walker.lastChild()) ||
                    focusNode;
                selection.extend(lastNode, isUp ? 0 : lastNode.length);
                const range = document.createRange();
                range.setStart(node, isUp ? node.length : 0);
                range.setEnd(node, isUp ? node.length : 0);
                selection.addRange(range);
                return;
            }
            const [caretX] = this.#getCaretPosition(selection, isUp);
            const { parentElement } = node;
            this.#setCaretPosition(select, selection, parentElement, parentElement.getBoundingClientRect(), caretX);
            return;
        }
        // We've a candidate for the next line now we want to find the first element
        // which is under/over the caret.
        const [caretX, caretY] = this.#getCaretPosition(selection, isUp);
        const newLineElementRect = newLineElement.getBoundingClientRect();
        // Maybe the element on the new line is a valid candidate.
        if (this.#isUnderOver(newLineElementRect, caretX, caretY, isUp)) {
            this.#setCaretPosition(select, selection, newLineElement, newLineElementRect, caretX);
            return;
        }
        while (nodeIterator()) {
            // Search an element on the same line as newLineElement
            // which could be under/over the caret.
            const element = walker.currentNode.parentElement;
            const elementRect = element.getBoundingClientRect();
            if (!this.#isOnSameLine(newLineElementRect, elementRect)) {
                break;
            }
            if (this.#isUnderOver(elementRect, caretX, caretY, isUp)) {
                // We found the element.
                this.#setCaretPosition(select, selection, element, elementRect, caretX);
                return;
            }
        }
        // No element has been found so just put the caret on the element on the new
        // line.
        this.#setCaretPosition(select, selection, newLineElement, newLineElementRect, caretX);
    }
}
_a = CaretBrowsingMode;
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=caret_browsing.js.map