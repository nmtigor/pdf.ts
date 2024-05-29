/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/xfa/layout.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { rect_t } from "../../../../lib/alias.js";
import type { AvailableSpace, XFAElData, XFAHTMLObj } from "./alias.js";
import type { Draw, ExclGroup, Field, Subform } from "./template.js";
export declare function flushHTML(node: ExclGroup | Subform): XFAHTMLObj | undefined;
export declare function addHTML(node: ExclGroup | Subform, html: XFAElData, bbox: rect_t): void;
export declare function getAvailableSpace(node: ExclGroup | Subform): AvailableSpace;
/**
 * Returning true means that the node will be layed out
 * else the layout will go to its next step (changing of line
 * in case of lr-tb or changing content area...).
 */
export declare function checkDimensions(node: Draw | ExclGroup | Field | Subform, space: AvailableSpace): boolean;
//# sourceMappingURL=layout.d.ts.map