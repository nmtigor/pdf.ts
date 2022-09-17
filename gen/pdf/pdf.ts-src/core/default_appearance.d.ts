export interface DefaultAppearanceData {
    fontSize: number;
    fontName: string;
    fontColor: Uint8ClampedArray;
}
export declare function parseDefaultAppearance(str: string): {
    fontSize: number;
    fontName: string;
    fontColor: Uint8ClampedArray;
};
export declare function getPdfColor(color: Uint8ClampedArray, isFill: boolean): string;
export declare function createDefaultAppearance({ fontSize, fontName, fontColor }: DefaultAppearanceData): string;
//# sourceMappingURL=default_appearance.d.ts.map