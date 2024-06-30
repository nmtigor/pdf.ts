/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/display/font_loader.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { C2D } from "../../../lib/alias.js";
import type { Cmds } from "../core/font_renderer.js";
import type { SubstitutionInfo } from "../core/font_substitutions.js";
import { FontExpotDataEx } from "../core/fonts.js";
import type { PDFObjects } from "./api.js";
interface BaseFontLoaderCtorP_ {
    ownerDocument: Document | undefined;
    styleElement?: HTMLStyleElement | undefined;
}
export interface Request {
    done: boolean;
    complete: () => void;
    callback: (request: Request) => void;
}
type SystemFont_ = {
    systemFontInfo: SubstitutionInfo | undefined;
    _inspectFont?: ((info: SubstitutionInfo) => void) | undefined;
};
export declare class FontLoader {
    #private;
    _document: Document;
    nativeFontFaces: Set<FontFace>;
    styleElement: HTMLStyleElement | undefined;
    loadingRequests: Request[] | undefined;
    loadTestFontId: number;
    constructor({ ownerDocument, styleElement, }: BaseFontLoaderCtorP_);
    addNativeFontFace(nativeFontFace: FontFace): void;
    removeNativeFontFace(nativeFontFace: FontFace): void;
    insertRule(rule: string): void;
    clear(): void;
    loadSystemFont({ systemFontInfo: info, _inspectFont }: SystemFont_): Promise<void>;
    bind(font: FontFaceObject): Promise<void>;
    get isFontLoadingAPISupported(): boolean;
    get isSyncFontLoadingSupported(): boolean;
    _queueLoadingCallback(callback: (request: Request) => void): Request;
    get _loadTestFont(): string;
    _prepareFontLoadEvent(font: FontFaceObject, request: Request): void;
}
interface FFOCtorP_ {
    disableFontFace: boolean | undefined;
    inspectFont: ((font: FontFaceObject, url?: string) => void) | undefined;
}
export type AddToPath = (c: C2D, size: number) => void;
export declare class FontFaceObject extends FontExpotDataEx {
    compiledGlyphs: Record<string, AddToPath>;
    disableFontFace: boolean;
    _inspectFont: ((font: FontFaceObject, url?: string | undefined) => void) | undefined;
    attached?: boolean;
    constructor(translatedData: FontExpotDataEx, { disableFontFace, inspectFont }: FFOCtorP_);
    createNativeFontFace(): FontFace | null;
    createFontFaceRule(): string | undefined;
    getPathGenerator(objs: PDFObjects<Cmds | FontFaceObject>, character: string): AddToPath;
}
export {};
//# sourceMappingURL=font_loader.d.ts.map