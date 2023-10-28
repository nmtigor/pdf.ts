import type { AnnotSaveData } from "./annotation.js";
import { BaseStream } from "./base_stream.js";
import type { CipherTransform, CipherTransformFactory } from "./crypto.js";
import { Dict, Ref } from "./primitives.js";
import type { XRefInfo } from "./worker.js";
import type { XRef } from "./xref.js";
export declare function writeObject(ref: Ref, obj: Dict | BaseStream | (number | Ref)[], buffer: string[], { encrypt }: {
    encrypt?: CipherTransformFactory;
}): Promise<void>;
export declare function writeDict(dict: Dict, buffer: string[], transform?: CipherTransform): Promise<void>;
interface IncrementalUpdateP_ {
    originalData: Uint8Array;
    xrefInfo: XRefInfo;
    newRefs: AnnotSaveData[];
    xref?: XRef;
    acroForm?: Dict | undefined;
    acroFormRef?: Ref | undefined;
    hasXfa?: boolean;
    hasXfaDatasetsEntry?: boolean;
    needAppearances: boolean | undefined;
    xfaData?: string | undefined;
    xfaDatasetsRef?: Ref | undefined;
}
export declare function incrementalUpdate({ originalData, xrefInfo, newRefs, xref, hasXfa, xfaDatasetsRef, hasXfaDatasetsEntry, needAppearances, acroFormRef, acroForm, xfaData, }: IncrementalUpdateP_): Promise<Uint8Array>;
export {};
//# sourceMappingURL=writer.d.ts.map