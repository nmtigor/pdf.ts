/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/struct_tree_layer_builder.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { StructTreeNode } from "../pdf.ts-src/display/api.js";
export declare class StructTreeLayerBuilder {
    #private;
    get renderingDone(): boolean;
    render(structTree: StructTreeNode | undefined): HTMLSpanElement | undefined;
    hide(): void;
    show(): void;
}
//# sourceMappingURL=struct_tree_layer_builder.d.ts.map