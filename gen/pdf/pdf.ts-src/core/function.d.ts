import { Dict, NoRef, Ref } from "./primitives.js";
export declare class PDFFunctionFactory {
    #private;
    xref: XRef;
    isEvalSupported: boolean;
    constructor({ xref, isEvalSupported }: {
        xref: XRef;
        isEvalSupported: boolean | undefined;
    });
    create(fn: Ref | BaseStream | Dict): ParsedFunction;
    createFromArray(fnObj: Ref | Dict | BaseStream): ParsedFunction;
    getCached(cacheKey: Ref | Dict | BaseStream): ParsedFunction | null;
}
declare namespace NsPDFFunction {
    interface ParseParms {
        xref: XRef;
        isEvalSupported: boolean;
        fn: Dict | BaseStream;
    }
    interface TypeParms {
        xref: XRef;
        isEvalSupported: boolean;
        dict: Dict;
    }
    interface TypeFnParms extends TypeParms {
        fn: BaseStream;
    }
    export type ParsedFunction = (src: Float32Array | number[], srcOffset: number, dest: Float32Array, destOffset: number) => void;
    export const PDFFunction: {
        getSampleArray(size: number[], outputSize: number, bps: number, stream: BaseStream): any[];
        parse({ xref, isEvalSupported, fn }: ParseParms): ParsedFunction;
        parseArray({ xref, isEvalSupported, fnObj }: {
            xref: XRef;
            isEvalSupported: boolean;
            fnObj: NoRef;
        }): ParsedFunction;
        /**
         * 7.10.2
         */
        constructSampled({ xref, isEvalSupported, fn, dict }: TypeFnParms): (src: Float32Array | number[], srcOffset: number, dest: Float32Array, destOffset: number) => void;
        constructInterpolated({ xref, isEvalSupported, dict }: TypeParms): (src: Float32Array | number[], srcOffset: number, dest: Float32Array, destOffset: number) => void;
        constructStiched({ xref, isEvalSupported, dict }: TypeParms): (src: Float32Array | number[], srcOffset: number, dest: Float32Array, destOffset: number) => void;
        constructPostScript({ xref, isEvalSupported, fn, dict }: TypeFnParms): ParsedFunction;
    };
    export {};
}
export import ParsedFunction = NsPDFFunction.ParsedFunction;
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
export import PostScriptCompiler = NsPostScriptCompiler.PostScriptCompiler;
import { XRef } from "./xref.js";
import { BaseStream } from "./base_stream.js";
export {};
//# sourceMappingURL=function.d.ts.map