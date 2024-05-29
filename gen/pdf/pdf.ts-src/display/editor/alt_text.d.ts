/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2024
 *
 * @module pdf/pdf.ts-src/display/editor/alt_text.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { AltTextData, AnnotationEditor } from "./editor.js";
export declare class AltText {
    #private;
    static _l10nPromise: Map<string, Promise<string>>;
    constructor(editor: AnnotationEditor);
    static initialize(l10nPromise: Map<string, Promise<string>>): void;
    render(): Promise<HTMLButtonElement>;
    finish(): void;
    isEmpty(): boolean;
    get data(): AltTextData;
    /**
     * Set the alt text data.
     */
    set data({ altText, decorative }: AltTextData);
    toggle(enabled?: boolean): void;
    destroy(): void;
}
//# sourceMappingURL=alt_text.d.ts.map