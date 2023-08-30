import type { C2D } from "../../../lib/alias.js";
import { FontExpotDataEx } from "../core/fonts.js";
import type { CmdArgs } from "../core/font_renderer.js";
import type { SubstitutionInfo } from "../core/font_substitutions.js";
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
    loadSystemFont(info: SubstitutionInfo): Promise<void>;
    bind(font: FontFaceObject): Promise<void>;
    get isFontLoadingAPISupported(): boolean;
    get isSyncFontLoadingSupported(): boolean;
    _queueLoadingCallback(callback: (request: Request) => void): Request;
    get _loadTestFont(): string;
    _prepareFontLoadEvent(font: FontFaceObject, request: Request): void;
}
interface FFOCtorP_ {
    isEvalSupported: boolean | undefined;
    disableFontFace: boolean | undefined;
    ignoreErrors: boolean | undefined;
    inspectFont: ((font: FontFaceObject, url?: string) => void) | undefined;
}
export type AddToPath = (c: C2D, size: number) => void;
export declare class FontFaceObject extends FontExpotDataEx {
    compiledGlyphs: Record<string, AddToPath>;
    isEvalSupported: boolean;
    disableFontFace: boolean;
    ignoreErrors: boolean;
    _inspectFont: ((font: FontFaceObject, url?: string | undefined) => void) | undefined;
    attached?: boolean;
    constructor(translatedData: FontExpotDataEx, { isEvalSupported, disableFontFace, ignoreErrors, inspectFont, }: FFOCtorP_);
    createNativeFontFace(): FontFace | null;
    createFontFaceRule(): string | undefined;
    getPathGenerator(objs: PDFObjects<CmdArgs[] | FontFaceObject>, character: string): AddToPath;
}
export {};
//# sourceMappingURL=font_loader.d.ts.map