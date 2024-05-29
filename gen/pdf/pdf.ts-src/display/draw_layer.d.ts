/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/display/draw_layer.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { id_t, Ratio, uint } from "../../../lib/alias.js";
import type { Cssc } from "../../../lib/color/alias.js";
import type { Box } from "../alias.js";
import { DOMSVGFactory } from "./display_utils.js";
import type { FreeHighlightOutline, HighlightOutline, Outline } from "./editor/outliner.js";
/**
 * Manage the SVGs drawn on top of the page canvas.
 * It's important to have them directly on top of the canvas because we want to
 * be able to use mix-blend-mode for some of them.
 */
export declare class DrawLayer {
    #private;
    pageIndex: number;
    constructor({ pageIndex }: {
        pageIndex: uint;
    });
    setParent(parent: Element): void;
    static get _svgFactory(): DOMSVGFactory;
    highlight(outlines: Outline, color: Cssc, opacity: Ratio, isPathUpdatable?: boolean): {
        id: number;
        clipPathId: string;
    };
    highlightOutline(outlines: Outline): id_t;
    finalizeLine(id: id_t, line: HighlightOutline): void;
    updateLine(id: id_t, line: HighlightOutline): void;
    removeFreeHighlight(id: id_t): void;
    updatePath(id: id_t, line: FreeHighlightOutline): void;
    updateBox(id: id_t, box: Box): void;
    show(id: id_t, visible?: boolean): void;
    rotate(id: id_t, angle: number): void;
    changeColor(id: id_t, color: Cssc): void;
    changeOpacity(id: id_t, opacity: Ratio): void;
    addClass(id: id_t, className: string): void;
    removeClass(id: id_t, className: string): void;
    remove(id: id_t): void;
    destroy(): void;
}
//# sourceMappingURL=draw_layer.d.ts.map