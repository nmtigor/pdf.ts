import { FontExpotDataEx } from "../core/fonts.js";
import { type CmdArgs } from "../core/font_renderer.js";
import { UNSUPPORTED_FEATURES } from "../shared/util.js";
import { PDFObjects } from "./api.js";
interface _BaseFontLoaderCtorP {
    docId: string;
    onUnsupportedFeature: (_: {
        featureId: UNSUPPORTED_FEATURES;
    }) => void;
    ownerDocument: Document | undefined;
    styleElement?: HTMLStyleElement | undefined;
}
interface Request {
    id: string;
    done: boolean;
    complete: () => void;
    callback: (request: Request) => void;
}
declare abstract class BaseFontLoader {
    docId: string;
    _onUnsupportedFeature: (_: {
        featureId: UNSUPPORTED_FEATURES;
    }) => void;
    _document: Document;
    nativeFontFaces: FontFace[];
    styleElement: HTMLStyleElement | undefined;
    constructor({ docId, onUnsupportedFeature, ownerDocument, styleElement, }: _BaseFontLoaderCtorP);
    addNativeFontFace(nativeFontFace: FontFace): void;
    insertRule(rule: string): void;
    clear(): void;
    bind(font: FontFaceObject): Promise<void>;
    protected queueLoadingCallback$(callback: (request: Request) => void): Request;
    get isFontLoadingAPISupported(): boolean;
    abstract get isSyncFontLoadingSupported(): boolean;
    get _loadTestFont(): string;
    protected prepareFontLoadEvent$(rules: string[], fontsToLoad: FontFaceObject[], request: Request): void;
}
export declare class FontLoader extends BaseFontLoader {
    loadingContext: {
        requests: Request[];
        nextRequestId: number;
    };
    loadTestFontId: number;
    /** @implements */
    get isSyncFontLoadingSupported(): boolean;
    protected queueLoadingCallback$(callback: (request: Request) => void): Request;
    get _loadTestFont(): string;
    protected prepareFontLoadEvent$(rules: string[], fonts: FontFaceObject[], request: Request): void;
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
export declare type AddToPath = (c: CanvasRenderingContext2D, size: number) => void;
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