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
export interface Request {
    id: string;
    done: boolean;
    complete: () => void;
    callback: (request: Request) => void;
}
export declare let FontLoader: {
    new ({ docId, onUnsupportedFeature, ownerDocument, styleElement, }: _BaseFontLoaderCtorP): {
        /** @implement */
        readonly isSyncFontLoadingSupported: boolean;
        docId: string;
        _onUnsupportedFeature: (_: {
            featureId: UNSUPPORTED_FEATURES;
        }) => void;
        _document: Document;
        nativeFontFaces: FontFace[];
        styleElement: HTMLStyleElement | undefined;
        addNativeFontFace(nativeFontFace: FontFace): void;
        insertRule(rule: string): void;
        clear(): void;
        bind(font: FontFaceObject): Promise<void>;
        _queueLoadingCallback(callback: (request: Request) => void): any;
        readonly isFontLoadingAPISupported: boolean;
        readonly _loadTestFont: string;
        _prepareFontLoadEvent(rules: string[], fontsToLoad: FontFaceObject[], request: Request): void;
    };
};
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