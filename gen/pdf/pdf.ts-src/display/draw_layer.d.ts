import type { id_t, Ratio, uint } from "../../../lib/alias.js";
import type { Cssc } from "../../../lib/color/alias.js";
import { DOMSVGFactory } from "./display_utils.js";
import type { Box, Outlines } from "../alias.js";
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
    highlight({ outlines, box }: Outlines, color: Cssc, opacity: Ratio): {
        id: number;
        clipPathId: string;
    };
    highlightOutline({ outlines, box }: Outlines): number;
    updateBox(id: id_t, box: Box): void;
    rotate(id: id_t, angle: number): void;
    changeColor(id: id_t, color: Cssc): void;
    changeOpacity(id: id_t, opacity: Ratio): void;
    addClass(id: id_t, className: string): void;
    removeClass(id: id_t, className: string): void;
    remove(id: id_t): void;
    destroy(): void;
}
//# sourceMappingURL=draw_layer.d.ts.map