/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/pdf_layer_viewer.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { OptionalContentConfig, PDFDocumentProxy } from "../pdf.ts-src/pdf.js";
import type { BaseTreeViewerCtorP } from "./base_tree_viewer.js";
import { BaseTreeViewer } from "./base_tree_viewer.js";
interface PDFLayerViewerOptions extends BaseTreeViewerCtorP {
}
interface _PDFLayerViewerRenderP {
    /**
     * An {OptionalContentConfig} instance.
     */
    optionalContentConfig: OptionalContentConfig | undefined;
    /**
     * A {PDFDocument} instance.
     */
    pdfDocument: PDFDocumentProxy;
}
export declare class PDFLayerViewer extends BaseTreeViewer {
    #private;
    static create(options: PDFLayerViewerOptions): PDFLayerViewer;
    private constructor();
    reset(): void;
    /** @implement */
    protected _dispatchEvent(layersCount: number): void;
    /** @implement */
    protected _bindLink(element: HTMLAnchorElement, { groupId, input }: {
        groupId: string;
        input: HTMLInputElement;
    }): void;
    protected toggleAllTreeItems$(): void;
    /** @implement */
    render({ optionalContentConfig, pdfDocument }: _PDFLayerViewerRenderP): void;
}
export {};
//# sourceMappingURL=pdf_layer_viewer.d.ts.map