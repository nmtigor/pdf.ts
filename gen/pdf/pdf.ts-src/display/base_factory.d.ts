/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/display/base_factory.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { C2D } from "../../../lib/alias.js";
import { CMapCompressionType } from "../shared/util.js";
export declare abstract class BaseFilterFactory {
    addFilter(maps?: number[][]): string;
    addHCMFilter(fgColor: string, bgColor: string): string;
    addHighlightHCMFilter(filterName: string, fgColor: string, bgColor: string, newFgColor: string, newBgColor: string): string;
    destroy(keepHCM?: boolean): void;
}
export interface CanvasEntry {
    canvas: HTMLCanvasElement;
    context: C2D;
    savedCtx?: C2D;
}
export declare abstract class BaseCanvasFactory {
    /** @final */
    create(width: number, height: number): CanvasEntry;
    /** @final */
    reset(canvasAndContext: CanvasEntry, width: number, height: number): void;
    /** @final */
    destroy(canvasAndContext: CanvasEntry): void;
    /**
     * @ignore
     */
    protected abstract _createCanvas(width: number, height: number): HTMLCanvasElement;
}
interface BaseCMapReaderFactoryCtorP_ {
    baseUrl: string | undefined;
    isCompressed?: boolean | undefined;
}
export interface CMapData {
    cMapData: Uint8Array;
    compressionType: CMapCompressionType;
}
export type FetchBuiltInCMap = (name: string) => Promise<CMapData>;
export declare abstract class BaseCMapReaderFactory {
    baseUrl: string | undefined;
    isCompressed: boolean;
    constructor({ baseUrl, isCompressed }: BaseCMapReaderFactoryCtorP_);
    /** @final */
    fetch({ name }: {
        name: string;
    }): Promise<CMapData>;
    /**
     * @ignore
     */
    protected abstract _fetchData(url: string, compressionType: CMapCompressionType): Promise<CMapData>;
}
export declare abstract class BaseStandardFontDataFactory {
    baseUrl: string | undefined;
    constructor({ baseUrl }: {
        baseUrl?: string | undefined;
    });
    fetch({ filename }: {
        filename: string;
    }): Promise<Uint8Array>;
    /**
     * @ignore
     */
    protected abstract _fetchData(url: string): Promise<Uint8Array>;
}
export declare abstract class BaseSVGFactory {
    /** @final */
    create(width: number, height: number, skipDimensions?: boolean): SVGSVGElement;
    /** @final */
    createElement(type: string): SVGElement;
    /**
     * @ignore
     */
    protected abstract _createSVG(type: string): SVGElement;
}
export {};
//# sourceMappingURL=base_factory.d.ts.map