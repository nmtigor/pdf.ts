import type { StructTreeNode } from "../pdf.ts-src/display/api.js";
export declare class StructTreeLayerBuilder {
    #private;
    get renderingDone(): boolean;
    render(structTree: StructTreeNode | undefined): HTMLSpanElement | undefined;
    hide(): void;
    show(): void;
}
//# sourceMappingURL=struct_tree_layer_builder.d.ts.map