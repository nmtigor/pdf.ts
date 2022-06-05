import { PDFDocumentProxy } from "../pdf.ts-src/display/api.js";
import { OptionalContentConfig } from "../pdf.ts-src/display/optional_content_config.js";
import { BaseTreeViewer, type BaseTreeViewerCtorP } from "./base_tree_viewer.js";
import { type IL10n } from "./interfaces.js";
interface PDFLayerViewerOptions extends BaseTreeViewerCtorP {
    /**
     * Localization service.
     */
    l10n?: IL10n;
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
    l10n?: IL10n | undefined;
    static create(options: PDFLayerViewerOptions): PDFLayerViewer;
    private constructor();
    reset(): void;
    /** @implements */
    protected _dispatchEvent(layersCount: number): void;
    /** @implements */
    protected _bindLink(element: HTMLAnchorElement, { groupId, input }: {
        groupId: string;
        input: HTMLInputElement;
    }): void;
    protected toggleAllTreeItems$(): void;
    /** @implements */
    render({ optionalContentConfig, pdfDocument }: _PDFLayerViewerRenderP): void;
}
export {};
//# sourceMappingURL=pdf_layer_viewer.d.ts.map