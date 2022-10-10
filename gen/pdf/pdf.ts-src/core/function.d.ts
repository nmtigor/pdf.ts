import { BaseStream } from "./base_stream.js";
import { LocalFunctionCache } from "./image_utils.js";
import { Dict, type ObjNoRef, Ref } from "./primitives.js";
import { XRef } from "./xref.js";
export declare class PDFFunctionFactory {
    #private;
    xref: XRef;
    isEvalSupported: boolean;
    constructor({ xref, isEvalSupported }: {
        xref: XRef;
        isEvalSupported: boolean | undefined;
    });
    create(fn: Ref | BaseStream | Dict): NsPDFFunction.ParsedFunction;
    createFromArray(fnObj: Ref | Dict | BaseStream): NsPDFFunction.ParsedFunction;
    getCached(cacheKey: Ref | Dict | BaseStream): NsPDFFunction.ParsedFunction | null;
    get _localFunctionCache(): LocalFunctionCache;
}
declare namespace NsPDFFunction {
    interface _ParseP {
        xref: XRef;
        isEvalSupported: boolean;
        fn: Dict | BaseStream;
    }
    interface _TypeP {
        xref: XRef;
        isEvalSupported: boolean;
        dict: Dict;
    }
    interface _TypeFnP extends _TypeP {
        fn: BaseStream;
    }
    export type ParsedFunction = (src: Float32Array | number[], srcOffset: number, dest: Float32Array, destOffset: number) => void;
    export const PDFFunction: {
        getSampleArray(size: number[], outputSize: number, bps: number, stream: BaseStream): any[];
        parse({ xref, isEvalSupported, fn }: _ParseP): ParsedFunction;
        parseArray({ xref, isEvalSupported, fnObj }: {
            xref: XRef;
            isEvalSupported: boolean;
            fnObj: ObjNoRef;
        }): ParsedFunction;
        /**
         * 7.10.2
         */
        constructSampled({ xref, isEvalSupported, fn, dict }: _TypeFnP): (src: Float32Array | number[], srcOffset: number, dest: Float32Array, destOffset: number) => void;
        constructInterpolated({ xref, isEvalSupported, dict }: _TypeP): (src: Float32Array | number[], srcOffset: number, dest: Float32Array, destOffset: number) => void;
        constructStiched({ xref, isEvalSupported, dict }: _TypeP): (src: Float32Array | number[], srcOffset: number, dest: Float32Array, destOffset: number) => void;
        constructPostScript({ xref, isEvalSupported, fn, dict }: _TypeFnP): ParsedFunction;
    };
    export {};
}
export declare type ParsedFunction = NsPDFFunction.ParsedFunction;
export declare function isPDFFunction(v: unknown): boolean;
export declare class PostScriptEvaluator {
    operators: (string | number | null)[];
    constructor(operators: (number | string | null)[]);
    execute(initialStack: Float32Array): (number | boolean)[];
}
declare namespace NsPostScriptCompiler {
    class PostScriptCompiler {
        compile(code: (number | string | null)[], domain: number[], range: number[]): string | null;
    }
}
export declare type PostScriptCompiler = NsPostScriptCompiler.PostScriptCompiler;
export declare var PostScriptCompiler: typeof NsPostScriptCompiler.PostScriptCompiler;
export {};
//# sourceMappingURL=function.d.ts.map