export declare type BidiDir = "ltr" | "rtl" | "ttb";
export interface BidiText {
    str: string;
    dir: BidiDir;
}
export declare function bidi(str: string, startLevel?: number, vertical?: boolean): BidiText;
//# sourceMappingURL=bidi.d.ts.map