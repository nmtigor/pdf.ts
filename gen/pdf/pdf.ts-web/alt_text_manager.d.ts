/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2023
 *
 * @module pdf/pdf.ts-web/alt_text_manager.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { AnnotationEditor } from "../pdf.ts-src/display/editor/editor.js";
import type { AnnotationEditorUIManager } from "../pdf.ts-src/pdf.js";
import type { EventBus } from "./event_utils.js";
import type { OverlayManager } from "./overlay_manager.js";
import type { ViewerConfiguration } from "./viewer.js";
export declare class AltTextManager {
    #private;
    constructor({ dialog, optionDescription, optionDecorative, textarea, cancelButton, saveButton, }: ViewerConfiguration["altTextDialog"], container: HTMLDivElement, overlayManager: OverlayManager, eventBus: EventBus);
    get _elements(): (HTMLInputElement | HTMLButtonElement | HTMLTextAreaElement)[];
    editAltText(uiManager: AnnotationEditorUIManager, editor?: AnnotationEditor): Promise<void>;
    destroy(): void;
}
//# sourceMappingURL=alt_text_manager.d.ts.map