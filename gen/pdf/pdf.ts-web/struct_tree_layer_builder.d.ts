import { StructTreeNode } from "../pdf.ts-src/display/api.js";
import { PDFPageProxy } from "../pdf.ts-src/pdf.js";
interface StructTreeLayerBuilderOptions {
    pdfPage: PDFPageProxy;
}
export declare class StructTreeLayerBuilder {
    #private;
    pdfPage: PDFPageProxy;
    constructor({ pdfPage }: StructTreeLayerBuilderOptions);
    render(structTree: StructTreeNode): HTMLSpanElement | undefined;
    _walk(node?: StructTreeNode): HTMLSpanElement | undefined;
}
export {};
//# sourceMappingURL=struct_tree_layer_builder.d.ts.map