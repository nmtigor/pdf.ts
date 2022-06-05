import { type SaveData } from "./annotation.js";
import { CipherTransform } from "./crypto.js";
import { Dict, Ref } from "./primitives.js";
import { type XRefInfo } from "./worker.js";
import { XRef } from "./xref.js";
export declare function writeDict(dict: Dict, buffer: string[], transform?: CipherTransform): void;
interface _IncrementalUpdateP {
    originalData: Uint8Array;
    xrefInfo: XRefInfo;
    newRefs: SaveData[];
    xref?: XRef;
    acroForm?: Dict | undefined;
    acroFormRef?: Ref | undefined;
    hasXfa?: boolean;
    hasXfaDatasetsEntry?: boolean;
    xfaData?: string | undefined;
    xfaDatasetsRef?: Ref | undefined;
}
export declare function incrementalUpdate({ originalData, xrefInfo, newRefs, xref, hasXfa, xfaDatasetsRef, hasXfaDatasetsEntry, acroFormRef, acroForm, xfaData, }: _IncrementalUpdateP): Uint8Array;
export {};
//# sourceMappingURL=writer.d.ts.map