import { Dict, Ref } from "./primitives.js";
import { CipherTransform } from "./crypto.js";
import { XRefInfo } from "./worker.js";
import { SaveData } from "./annotation.js";
import { XRef } from "./xref.js";
export declare function writeDict(dict: Dict, buffer: string[], transform: CipherTransform | null): void;
interface IncrementalUpdateParms {
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
export declare function incrementalUpdate({ originalData, xrefInfo, newRefs, xref, hasXfa, xfaDatasetsRef, hasXfaDatasetsEntry, acroFormRef, acroForm, xfaData, }: IncrementalUpdateParms): Uint8Array;
export {};
//# sourceMappingURL=writer.d.ts.map