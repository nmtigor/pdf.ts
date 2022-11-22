import { FontExpotDataEx } from "../core/fonts.js";
import { type CmdArgs } from "../core/font_renderer.js";
import { UNSUPPORTED_FEATURES } from "../shared/util.js";
import { PDFObjects } from "./api.js";
interface _BaseFontLoaderCtorP {
    onUnsupportedFeature: (_: {
        featureId: UNSUPPORTED_FEATURES;
    }) => void;
    ownerDocument: Document | undefined;
    styleElement?: HTMLStyleElement | undefined;
}
export interface Request {
    done: boolean;
    complete: () => void;
    callback: (request: Request) => void;
}
export declare class FontLoader {
    _onUnsupportedFeature: (_: {
        featureId: UNSUPPORTED_FEATURES;
    }) => void;
    _document: Document;
    nativeFontFaces: FontFace[];
    styleElement: HTMLStyleElement | undefined;
    loadingRequests: Request[] | undefined;
    loadTestFontId: number;
    constructor({ onUnsupportedFeature, ownerDocument, styleElement, }: _BaseFontLoaderCtorP);
    addNativeFontFace(nativeFontFace: FontFace): void;
    insertRule(rule: string): void;
    clear(): void;
    bind(font: FontFaceObject): Promise<void>;
    get isFontLoadingAPISupported(): boolean;
    get isSyncFontLoadingSupported(): boolean;
    _queueLoadingCallback(callback: (request: Request) => void): Request;
    get _loadTestFont(): string;
    _prepareFontLoadEvent(font: FontFaceObject, request: Request): void;
}
interface _FFOCtorP {
    isEvalSupported: boolean | undefined;
    disableFontFace: boolean | undefined;
    ignoreErrors: boolean | undefined;
    onUnsupportedFeature: (_: {
        featureId: UNSUPPORTED_FEATURES;
    }) => void;
    fontRegistry: {
        registerFont(font: FontFaceObject, url?: string): void;
    } | undefined;
}
export type AddToPath = (c: CanvasRenderingContext2D, size: number) => void;
export declare class FontFaceObject extends FontExpotDataEx {
    compiledGlyphs: Record<string, AddToPath>;
    isEvalSupported: boolean;
    disableFontFace: boolean;
    ignoreErrors: boolean;
    _onUnsupportedFeature: (_: {
        featureId: UNSUPPORTED_FEATURES;
    }) => void;
    fontRegistry: {
        registerFont(font: FontFaceObject, url?: string | undefined): void;
    } | undefined;
    attached?: boolean;
    constructor(translatedData: FontExpotDataEx, { isEvalSupported, disableFontFace, ignoreErrors, onUnsupportedFeature, fontRegistry, }: _FFOCtorP);
    createNativeFontFace(): FontFace | null;
    createFontFaceRule(): string | null;
    getPathGenerator(objs: PDFObjects<CmdArgs[] | FontFaceObject>, character: string): AddToPath;
}
export {};
//# sourceMappingURL=font_loader.d.ts.map