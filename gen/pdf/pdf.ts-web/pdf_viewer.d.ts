import { BaseViewer } from "./base_viewer.js";
import { SpreadMode, ScrollMode } from "./ui_utils.js";
export declare class PDFViewer extends BaseViewer {
}
export declare class PDFSinglePageViewer extends BaseViewer {
    _resetView(): void;
    set scrollMode(mode: ScrollMode);
    _updateScrollMode(): void;
    set spreadMode(mode: SpreadMode);
    _updateSpreadMode(): void;
}
//# sourceMappingURL=pdf_viewer.d.ts.map