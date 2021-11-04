/**
 * This code was forked from https://github.com/notmasteryet/jpgjs.
 * The original version was created by GitHub user notmasteryet.
 *
 * - The JPEG specification can be found in the ITU CCITT Recommendation T.81
 *   (www.w3.org/Graphics/JPEG/itu-t81.pdf)
 * - The JFIF specification can be found in the JPEG File Interchange Format
 *   (www.w3.org/Graphics/JPEG/jfif3.pdf)
 * - The Adobe Application-Specific JPEG markers in the
 *   Supporting the DCT Filters in PostScript Level 2, Technical Note #5116
 *   (partners.adobe.com/public/developer/en/ps/sdk/5116.DCT_Filter.pdf)
 */
declare namespace NsJpegImage {
    export interface JpegOptions {
        decodeTransform?: Int32Array | undefined;
        colorTransform?: number | undefined;
    }
    interface JpegData {
        width: number;
        height: number;
        forceRGB: boolean | undefined;
        isSourcePDF?: boolean;
    }
    interface Jfif {
        version: {
            major: number;
            minor: number;
        };
        densityUnits: number;
        xDensity: number;
        yDensity: number;
        thumbWidth: number;
        thumbHeight: number;
        thumbData: Uint8Array | Uint8ClampedArray;
    }
    interface Adobe {
        version: number;
        flags0: number;
        flags1: number;
        transformCode: number;
    }
    interface JpegComponent {
        index: number;
        output: Int16Array;
        scaleX: number;
        scaleY: number;
        blocksPerLine: number;
        blocksPerColumn: number;
    }
    export class JpegImage {
        #private;
        width?: number;
        height?: number;
        jfif?: Jfif | undefined;
        adobe?: Adobe | undefined;
        components?: JpegComponent[];
        numComponents?: number;
        constructor({ decodeTransform, colorTransform }?: JpegOptions);
        parse(data: Uint8Array | Uint8ClampedArray, { dnlScanLines }?: {
            dnlScanLines?: number;
        }): undefined;
        getData({ width, height, forceRGB, isSourcePDF }: JpegData): Uint8ClampedArray;
    }
    export {};
}
export import JpegImage = NsJpegImage.JpegImage;
export import JpegOptions = NsJpegImage.JpegOptions;
export {};
//# sourceMappingURL=jpg.d.ts.map