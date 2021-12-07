import { type XFAElObj } from "../core/xfa/alias.js";
import { BaseException, CMapCompressionType, type matrix_t, type point_t, type rect_t } from "../shared/util.js";
import { BaseCanvasFactory, BaseCMapReaderFactory, BaseStandardFontDataFactory, BaseSVGFactory } from "./base_factory.js";
export declare const DEFAULT_LINK_REL = "noopener noreferrer nofollow";
export declare const PixelsPerInch: {
    CSS: number;
    PDF: number;
    readonly PDF_TO_CSS_UNITS: number;
};
export declare class DOMCanvasFactory extends BaseCanvasFactory {
    _document: Document;
    constructor({ ownerDocument }?: {
        ownerDocument?: Document | undefined;
    });
    /** @implements */
    _createCanvas(width: number, height: number): HTMLCanvasElement;
}
export declare class DOMCMapReaderFactory extends BaseCMapReaderFactory {
    /** @implements */
    _fetchData(url: string, compressionType: CMapCompressionType): Promise<{
        cMapData: Uint8Array;
        compressionType: CMapCompressionType;
    }>;
}
export declare class DOMStandardFontDataFactory extends BaseStandardFontDataFactory {
    /** @implements */
    _fetchData(url: string): Promise<Uint8Array>;
}
export declare class DOMSVGFactory extends BaseSVGFactory {
    /** @implements */
    _createSVG(type: keyof SVGElementTagNameMap): SVGSymbolElement | SVGFilterElement | SVGAElement | SVGScriptElement | SVGStyleElement | SVGTitleElement | SVGAnimateElement | SVGAnimateMotionElement | SVGAnimateTransformElement | SVGCircleElement | SVGClipPathElement | SVGDefsElement | SVGDescElement | SVGEllipseElement | SVGFEBlendElement | SVGFEColorMatrixElement | SVGFEComponentTransferElement | SVGFECompositeElement | SVGFEConvolveMatrixElement | SVGFEDiffuseLightingElement | SVGFEDisplacementMapElement | SVGFEDistantLightElement | SVGFEDropShadowElement | SVGFEFloodElement | SVGFEFuncAElement | SVGFEFuncBElement | SVGFEFuncGElement | SVGFEFuncRElement | SVGFEGaussianBlurElement | SVGFEImageElement | SVGFEMergeElement | SVGFEMergeNodeElement | SVGFEMorphologyElement | SVGFEOffsetElement | SVGFEPointLightElement | SVGFESpecularLightingElement | SVGFESpotLightElement | SVGFETileElement | SVGFETurbulenceElement | SVGForeignObjectElement | SVGGElement | SVGImageElement | SVGLineElement | SVGLinearGradientElement | SVGMarkerElement | SVGMaskElement | SVGMetadataElement | SVGMPathElement | SVGPathElement | SVGPatternElement | SVGPolygonElement | SVGPolylineElement | SVGRadialGradientElement | SVGRectElement | SVGSetElement | SVGStopElement | SVGSVGElement | SVGSwitchElement | SVGTextElement | SVGTextPathElement | SVGTSpanElement | SVGUseElement | SVGViewElement;
}
interface PageViewportParms {
    /**
     * The xMin, yMin, xMax and yMax coordinates.
     */
    viewBox: rect_t;
    /**
     * The scale of the viewport.
     */
    scale: number;
    /**
     * The rotation, in degrees, of the viewport.
     */
    rotation: number;
    /**
     * The horizontal, i.e. x-axis, offset.
     * The default value is `0`.
     */
    offsetX?: number;
    /**
     * The vertical, i.e. y-axis, offset.
     * The default value is `0`.
     */
    offsetY?: number;
    /**
     * If true, the y-axis will not be flipped.
     * The default value is `false`.
     */
    dontFlip?: boolean;
}
interface PageViewportCloneParms {
    /**
     * The scale, overriding the one in the cloned
     * viewport. The default value is `this.scale`.
     */
    scale?: number;
    /**
     * The rotation, in degrees, overriding the one
     * in the cloned viewport. The default value is `this.rotation`.
     */
    rotation?: number;
    /**
     * The horizontal, i.e. x-axis, offset.
     * The default value is `this.offsetX`.
     */
    offsetX?: number;
    /**
     * The vertical, i.e. y-axis, offset.
     * The default value is `this.offsetY`.
     */
    offsetY?: number;
    /**
     * If true, the x-axis will not be flipped.
     * The default value is `false`.
     */
    dontFlip?: boolean;
}
/**
 * PDF page viewport created based on scale, rotation and offset.
 */
export declare class PageViewport {
    /**
     * In PDF unit.
     */
    viewBox: rect_t;
    /**
     * To CSS unit.
     */
    scale: number;
    rotation: number;
    /**
     * In CSS unit.
     */
    offsetX: number;
    offsetY: number;
    transform: matrix_t;
    width: number;
    height: number;
    constructor({ viewBox, scale, rotation, offsetX, offsetY, dontFlip, }: PageViewportParms);
    /**
     * Clones viewport, with optional additional properties.
     * @return Cloned viewport.
     */
    clone({ scale, rotation, offsetX, offsetY, dontFlip, }?: PageViewportCloneParms): PageViewport;
    /**
     * Converts PDF point to the viewport coordinates. For examples, useful for
     * converting PDF location into canvas pixel coordinates.
     * @param x The x-coordinate.
     * @param y The y-coordinate.
     * @return Object containing `x` and `y` properties of the
     *   point in the viewport coordinate space.
     * @see {@link convertToPdfPoint}
     * @see {@link convertToViewportRectangle}
     */
    convertToViewportPoint(x: number, y: number): point_t;
    /**
     * Converts PDF rectangle to the viewport coordinates.
     * @param rect The xMin, yMin, xMax and yMax coordinates.
     * @return Array containing corresponding coordinates of the
     *   rectangle in the viewport coordinate space.
     * @see {@link convertToViewportPoint}
     */
    convertToViewportRectangle(rect: rect_t): rect_t;
    /**
     * Converts viewport coordinates to the PDF location. For examples, useful
     * for converting canvas pixel location into PDF one.
     * @param x The x-coordinate.
     * @param y The y-coordinate.
     * @return Object containing `x` and `y` properties of the
     *   point in the PDF coordinate space.
     * @see {@link convertToViewportPoint}
     */
    convertToPdfPoint(x: number, y: number): point_t;
}
export declare class RenderingCancelledException extends BaseException {
    type: string;
    constructor(msg: string, type: string);
}
export declare const enum LinkTarget {
    NONE = 0,
    SELF = 1,
    BLANK = 2,
    PARENT = 3,
    TOP = 4
}
interface ExternalLinkParms {
    /**
     * An absolute URL.
     */
    url: string;
    /**
     * The link target. The default value is `LinkTarget.NONE`.
     */
    target?: LinkTarget | undefined;
    /**
     * The link relationship. The default value is `DEFAULT_LINK_REL`.
     */
    rel?: string | undefined;
    /**
     * Whether the link should be enabled. The default value is true.
     */
    enabled?: boolean;
}
/**
 * Adds various attributes (href, title, target, rel) to hyperlinks.
 * @param link The link element.
 */
export declare function addLinkAttributes(link: HTMLAnchorElement, { url, target, rel, enabled }?: ExternalLinkParms): void;
export declare function isDataScheme(url: string): boolean;
export declare function isPdfFile(filename: unknown): boolean;
/**
 * Gets the filename from a given URL.
 */
export declare function getFilenameFromUrl(url: string): string;
/**
 * Returns the filename or guessed filename from the url (see issue 3455).
 * @param url The original PDF location.
 * @param defaultFilename The value returned if the filename is
 *   unknown, or the protocol is unsupported.
 * @return Guessed PDF filename.
 */
export declare function getPdfFilenameFromUrl(url: unknown, defaultFilename?: string): string;
interface StatTime {
    name: string;
    start: number;
    end: number;
}
export declare class StatTimer {
    started: any;
    times: StatTime[];
    time(name: string): void;
    timeEnd(name: string): void;
    toString(): string;
}
export declare function isValidFetchUrl(url: string | URL | undefined, baseUrl?: string | URL): boolean;
export declare function loadScript(src: string, removeScriptElement?: boolean): Promise<Event>;
export declare function deprecated(details: string): void;
export declare class PDFDateString {
    /**
     * Convert a PDF date string to a JavaScript `Date` object.
     *
     * The PDF date string format is described in section 7.9.4 of the official
     * PDF 32000-1:2008 specification. However, in the PDF 1.7 reference (sixth
     * edition) Adobe describes the same format including a trailing apostrophe.
     * This syntax in incorrect, but Adobe Acrobat creates PDF files that contain
     * them. We ignore all apostrophes as they are not necessary for date parsing.
     *
     * Moreover, Adobe Acrobat doesn't handle changing the date to universal time
     * and doesn't use the user's time zone (effectively ignoring the HH' and mm'
     * parts of the date string).
     */
    static toDateObject(input: string): Date | null;
}
/**
 * NOTE: This is (mostly) intended to support printing of XFA forms.
 */
export declare function getXfaPageViewport(xfaPage: XFAElObj, { scale, rotation }: {
    scale?: number | undefined;
    rotation?: number | undefined;
}): PageViewport;
export {};
//# sourceMappingURL=display_utils.d.ts.map