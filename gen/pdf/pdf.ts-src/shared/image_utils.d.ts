interface _ApplyMaskImageDataP {
    src: Uint8Array | Uint8ClampedArray;
    srcPos?: number;
    dest: Uint8ClampedArray | Uint32Array;
    destPos?: number;
    width: number;
    height: number;
    inverseDecode?: boolean;
}
export declare function applyMaskImageData({ src, srcPos, dest, destPos, width, height, inverseDecode, }: _ApplyMaskImageDataP): {
    srcPos: number;
    destPos: number;
};
export {};
//# sourceMappingURL=image_utils.d.ts.map