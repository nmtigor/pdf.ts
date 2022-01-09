import { type StructTree } from "../pdf.ts-src/core/struct_tree.js";
import { PDFPageProxy } from "../pdf.ts-src/display/api.js";
interface StructTreeLayerBuilderOptions {
    pdfPage: PDFPageProxy;
}
export declare class StructTreeLayerBuilder {
    #private;
    pdfPage: PDFPageProxy;
    constructor({ pdfPage }: StructTreeLayerBuilderOptions);
    render(structTree?: StructTree): HTMLSpanElement | null;
    _walk(node?: StructTree): HTMLSpanElement | null;
}
export {};
//# sourceMappingURL=struct_tree_layer_builder.d.ts.map