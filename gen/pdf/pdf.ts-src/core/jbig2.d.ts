/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/jbig2.ts
 * @license Apache-2.0
 ******************************************************************************/
import { BaseException } from "../shared/util.js";
export declare class Jbig2Error extends BaseException {
    constructor(msg: string);
}
export interface Chunk {
    data: Uint8Array | Uint8ClampedArray;
    start: number;
    end: number;
}
interface LineData extends Array<number | string | undefined> {
    0: number;
    1: number;
    2?: number;
    3?: number;
    4?: string;
}
declare namespace NsJbig2Image {
    class HuffmanLine {
        isOOB: boolean;
        rangeLow: number;
        prefixLength: number;
        rangeLength: number;
        prefixCode: number;
        isLowerRange: boolean;
        constructor(lineData: LineData);
    }
    class HuffmanTreeNode {
        children: HuffmanTreeNode[];
        isLeaf: boolean;
        rangeLength?: number;
        rangeLow?: number;
        isLowerRange?: boolean;
        isOOB?: boolean;
        constructor(line?: HuffmanLine);
        buildTree(line: HuffmanLine, shift: number): void;
        decodeNode(reader: Reader): number | undefined;
    }
    export class HuffmanTable {
        rootNode: HuffmanTreeNode;
        constructor(lines: HuffmanLine[], prefixCodesDone: boolean);
        decode(reader: Reader): number | undefined;
        assignPrefixCodes(lines: HuffmanLine[]): void;
    }
    class Reader {
        data: Uint8Array | Uint8ClampedArray;
        start: number;
        end: number;
        position: number;
        shift: number;
        currentByte: number;
        constructor(data: Uint8Array | Uint8ClampedArray, start: number, end: number);
        readBit(): number;
        readBits(numBits: number): number;
        byteAlign(): void;
        next(): number;
    }
    export class Jbig2Image {
        width?: number;
        height?: number | undefined;
        parseChunks(chunks: Chunk[]): Uint8ClampedArray | undefined;
        parse(data: Uint8Array | Uint8ClampedArray): Uint8ClampedArray;
    }
    export {};
}
export import Jbig2Image = NsJbig2Image.Jbig2Image;
export {};
//# sourceMappingURL=jbig2.d.ts.map