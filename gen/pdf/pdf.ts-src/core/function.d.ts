import { Dict, type ObjNoRef, Ref } from "./primitives.js";
import { LocalFunctionCache } from "./image_utils.js";
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
    const enum FunctionType {
        CONSTRUCT_SAMPLED = 0,
        CONSTRUCT_INTERPOLATED = 2,
        CONSTRUCT_STICHED = 3,
        CONSTRUCT_POSTSCRIPT = 4
    }
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
    type IRData_Sampled = readonly [
        _: FunctionType.CONSTRUCT_SAMPLED,
        inputSize: number,
        domain: (readonly [
            number,
            number
        ])[],
        encode: (readonly [
            number,
            number
        ])[],
        decode: (readonly [
            number,
            number
        ])[],
        samples: number[],
        size: number[],
        outputSize: number,
        _: number,
        range: (readonly [
            number,
            number
        ])[]
    ];
    type IRData_Interpolated = readonly [
        _: FunctionType.CONSTRUCT_INTERPOLATED,
        c0: number[],
        diff: number[],
        n: number
    ];
    type IRData_Stiched = readonly [
        _: FunctionType.CONSTRUCT_STICHED,
        domain: number[],
        bounds: number[],
        encode: number[],
        fns: ParsedFunction[]
    ];
    type IRData_Postscript = readonly [
        _: FunctionType.CONSTRUCT_POSTSCRIPT,
        domain: number[],
        range: number[],
        code: (number | string | null)[]
    ];
    type IRData = IRData_Sampled | IRData_Interpolated | IRData_Stiched | IRData_Postscript;
    interface ConstructFromIR<T extends IRData> {
        xref: XRef;
        isEvalSupported: boolean;
        IR: T;
    }
    type ParsedFunction = (src: Float32Array | number[], srcOffset: number, dest: Float32Array, destOffset: number) => void;
    const PDFFunction = {
        getSampleArray(size: number[], outputSize: number, bps: number, stream: BaseStream) {
            let i, ii;
            let length = 1;
            for (i = 0, ii = size.length; i < ii; i++) {
                length *= size[i];
            }
            length *= outputSize;
            const array = new Array(length);
            let codeSize = 0;
            let codeBuf = 0;
            const sampleMul = 1.0 / (2.0 ** bps - 1);
            const strBytes = stream.getBytes((length * bps + 7) / 8);
            let strIdx = 0;
            for (i = 0; i < length; i++) {
                while (codeSize < bps) {
                    codeBuf <<= 8;
                    codeBuf |= strBytes[strIdx++];
                    codeSize += 8;
                }
                codeSize -= bps;
                array[i] = (codeBuf >> codeSize) * sampleMul;
                codeBuf &= (1 << codeSize) - 1;
            }
            return array;
        },
        parse({ xref, isEvalSupported, fn }: ParseParms): ParsedFunction {
            const dict = (<BaseStream>fn).dict || <Dict>fn;
            const typeNum = dict.get("FunctionType");
            switch (typeNum) {
                case FunctionType.CONSTRUCT_SAMPLED:
                    return PDFFunction.constructSampled({ xref, isEvalSupported, fn: <BaseStream>fn, dict });
                case 1:
                    break;
                case FunctionType.CONSTRUCT_INTERPOLATED:
                    return PDFFunction.constructInterpolated({ xref, isEvalSupported, dict });
                case FunctionType.CONSTRUCT_STICHED:
                    return PDFFunction.constructStiched({ xref, isEvalSupported, dict });
                case FunctionType.CONSTRUCT_POSTSCRIPT:
                    return PDFFunction.constructPostScript({ xref, isEvalSupported, fn: <BaseStream>fn, dict });
            }
            throw new FormatError("Unknown type of function");
        },
        parseArray({ xref, isEvalSupported, fnObj }: {
            xref: XRef;
            isEvalSupported: boolean;
            fnObj: ObjNoRef;
        }): ParsedFunction {
            if (!Array.isArray(fnObj)) {
                return this.parse({ xref, isEvalSupported, fn: <Dict | BaseStream>fnObj });
            }
            const fnArray: ParsedFunction[] = [];
            for (let j = 0, jj = fnObj.length; j < jj; j++) {
                fnArray.push(this.parse({ xref, isEvalSupported, fn: <BaseStream | Dict>xref.fetchIfRef(fnObj[j]) }));
            }
            return function (src, srcOffset, dest, destOffset) {
                for (let i = 0, ii = fnArray.length; i < ii; i++) {
                    fnArray[i](src, srcOffset, dest, destOffset + i);
                }
            };
        },
        /**
         * 7.10.2
         */
        constructSampled({ xref, isEvalSupported, fn, dict }: TypeFnParms) {
            function toMultiArray(arr: number[]) {
                const inputLength = arr.length;
                const out = [];
                let index = 0;
                for (let i = 0; i < inputLength; i += 2) {
                    out[index++] = <const>[arr[i], arr[i + 1]];
                }
                return out;
            }
            function interpolate(x: number, xmin: number, xmax: number, ymin: number, ymax: number) {
                return ymin + (x - xmin) * ((ymax - ymin) / (xmax - xmin));
            }
            let domain: null | number[] | (readonly [
                number,
                number
            ])[] = toNumberArray(dict.getArray("Domain"));
            let range: null | number[] | (readonly [
                number,
                number
            ])[] = toNumberArray(dict.getArray("Range"));
            if (!domain || !range) {
                throw new FormatError("No domain or range");
            }
            const inputSize = domain.length / 2;
            const outputSize = range.length / 2;
            domain = toMultiArray(domain);
            range = toMultiArray(range);
            const size = toNumberArray(dict.getArray("Size"))!;
            const bps = <number>dict.get("BitsPerSample");
            const order = <number>dict.get("Order") || 1;
            if (order !== 1) {
                info("No support for cubic spline interpolation: " + order);
            }
            let encode: null | number[] | (readonly [
                number,
                number
            ])[] = toNumberArray(dict.getArray("Encode"));
            if (!encode) {
                encode = <[
                    number,
                    number
                ][]>[];
                for (let i = 0; i < inputSize; ++i) {
                    encode.push([0, size[i] - 1]);
                }
            }
            else {
                encode = toMultiArray(encode);
            }
            let decode: null | number[] | (readonly [
                number,
                number
            ])[] = toNumberArray(dict.getArray("Decode"));
            if (!decode) {
                decode = range;
            }
            else {
                decode = toMultiArray(decode);
            }
            const samples = this.getSampleArray(size, outputSize, bps, fn!);
            return function constructSampledFn(src: Float32Array | number[], srcOffset: number, dest: Float32Array, destOffset: number) {
                const cubeVertices = 1 << inputSize;
                const cubeN = new Float64Array(cubeVertices);
                const cubeVertex = new Uint32Array(cubeVertices);
                let i, j;
                for (j = 0; j < cubeVertices; j++) {
                    cubeN[j] = 1;
                }
                let k = outputSize, pos = 1;
                for (i = 0; i < inputSize; ++i) {
                    const domain_2i = (<[
                        number,
                        number
                    ][]>domain)[i][0];
                    const domain_2i_1 = (<[
                        number,
                        number
                    ][]>domain)[i][1];
                    const xi = Math.min(Math.max(src[srcOffset + i], domain_2i), domain_2i_1);
                    let e = interpolate(xi, domain_2i, domain_2i_1, (<[
                        number,
                        number
                    ][]>encode)[i][0], (<[
                        number,
                        number
                    ][]>encode)[i][1]);
                    const size_i = size[i];
                    e = Math.min(Math.max(e, 0), size_i - 1);
                    const e0 = e < size_i - 1 ? Math.floor(e) : e - 1;
                    const n0 = e0 + 1 - e;
                    const n1 = e - e0;
                    const offset0 = e0 * k;
                    const offset1 = offset0 + k;
                    for (j = 0; j < cubeVertices; j++) {
                        if (j & pos) {
                            cubeN[j] *= n1;
                            cubeVertex[j] += offset1;
                        }
                        else {
                            cubeN[j] *= n0;
                            cubeVertex[j] += offset0;
                        }
                    }
                    k *= size_i;
                    pos <<= 1;
                }
                for (j = 0; j < outputSize; ++j) {
                    let rj = 0;
                    for (i = 0; i < cubeVertices; i++) {
                        rj += samples[cubeVertex[i] + j] * cubeN[i];
                    }
                    rj = interpolate(rj, 0, 1, (<[
                        number,
                        number
                    ][]>decode)[j][0], (<[
                        number,
                        number
                    ][]>decode)[j][1]);
                    dest[destOffset + j] = Math.min(Math.max(rj, (<[
                        number,
                        number
                    ][]>range)[j][0]), (<[
                        number,
                        number
                    ][]>range)[j][1]);
                }
            };
        },
        constructInterpolated({ xref, isEvalSupported, dict }: TypeParms) {
            const c0 = toNumberArray(dict.getArray("C0")) || [0];
            const c1 = toNumberArray(dict.getArray("C1")) || [1];
            const n = <number>dict.get("N");
            const diff: number[] = [];
            for (let i = 0, ii = c0.length; i < ii; ++i) {
                diff.push(c1[i] - c0[i]);
            }
            const length = diff.length;
            return function constructInterpolatedFn(src: Float32Array | number[], srcOffset: number, dest: Float32Array, destOffset: number) {
                const x = n === 1 ? src[srcOffset] : src[srcOffset] ** n;
                for (let j = 0; j < length; ++j) {
                    dest[destOffset + j] = c0[j] + x * diff[j];
                }
            };
        },
        constructStiched({ xref, isEvalSupported, dict }: TypeParms) {
            const domain = toNumberArray(dict.getArray("Domain"));
            if (!domain) {
                throw new FormatError("No domain");
            }
            const inputSize = domain.length / 2;
            if (inputSize !== 1) {
                throw new FormatError("Bad domain for stiched function");
            }
            const fnRefs = <Obj[]>dict.get("Functions");
            const fns: ParsedFunction[] = [];
            for (let i = 0, ii = fnRefs.length; i < ii; ++i) {
                fns.push(this.parse({ xref, isEvalSupported, fn: <BaseStream | Dict>xref.fetchIfRef(fnRefs[i]) }));
            }
            const bounds = toNumberArray(dict.getArray("Bounds"))!;
            const encode = toNumberArray(dict.getArray("Encode"))!;
            const tmpBuf = new Float32Array(1);
            return function constructStichedFn(src: Float32Array | number[], srcOffset: number, dest: Float32Array, destOffset: number) {
                const clip = function constructStichedFromIRClip(v: number, min: number, max: number) {
                    if (v > max) {
                        v = max;
                    }
                    else if (v < min) {
                        v = min;
                    }
                    return v;
                };
                const v = clip(src[srcOffset], domain[0], domain[1]);
                const length = bounds.length;
                let i;
                for (i = 0; i < length; ++i) {
                    if (v < bounds[i])
                        break;
                }
                let dmin = domain[0];
                if (i > 0) {
                    dmin = bounds[i - 1];
                }
                let dmax = domain[1];
                if (i < bounds.length) {
                    dmax = bounds[i];
                }
                const rmin = encode[2 * i];
                const rmax = encode[2 * i + 1];
                tmpBuf[0] =
                    dmin === dmax
                        ? rmin
                        : rmin + ((v - dmin) * (rmax - rmin)) / (dmax - dmin);
                fns[i](tmpBuf, 0, dest, destOffset);
            };
        },
        constructPostScript({ xref, isEvalSupported, fn, dict }: TypeFnParms) {
            const domain = toNumberArray(dict.getArray("Domain"));
            const range = toNumberArray(dict.getArray("Range"));
            if (!domain) {
                throw new FormatError("No domain.");
            }
            if (!range) {
                throw new FormatError("No range.");
            }
            const lexer = new PostScriptLexer(fn);
            const parser = new PostScriptParser(lexer);
            const code = parser.parse();
            if (isEvalSupported && IsEvalSupportedCached.value) {
                const compiled = new PostScriptCompiler().compile(code, domain, range);
                if (compiled) {
                    return <ParsedFunction>new Function("src", "srcOffset", "dest", "destOffset", compiled);
                }
            }
            info("Unable to compile PS function");
            const numOutputs = range.length >> 1;
            const numInputs = domain.length >> 1;
            const evaluator = new PostScriptEvaluator(code);
            const cache = Object.create(null);
            const MAX_CACHE_SIZE = 2048 * 4;
            let cache_available = MAX_CACHE_SIZE;
            const tmpBuf = new Float32Array(numInputs);
            return function constructPostScriptFn(src: Float32Array | number[], srcOffset: number, dest: Float32Array, destOffset: number) {
                let i, value;
                let key = "";
                const input = tmpBuf;
                for (i = 0; i < numInputs; i++) {
                    value = src[srcOffset + i];
                    input[i] = value;
                    key += value + "_";
                }
                const cachedValue = cache[key];
                if (cachedValue !== undefined) {
                    dest.set(cachedValue, destOffset);
                    return;
                }
                const output = new Float32Array(numOutputs);
                const stack = evaluator.execute(input);
                const stackIndex = stack.length - numOutputs;
                for (i = 0; i < numOutputs; i++) {
                    value = stack[stackIndex + i];
                    let bound = range[i * 2];
                    if (value < bound) {
                        value = bound;
                    }
                    else {
                        bound = range[i * 2 + 1];
                        if (value > bound) {
                            value = bound;
                        }
                    }
                    output[i] = <number>value;
                }
                if (cache_available > 0) {
                    cache_available--;
                    cache[key] = output;
                }
                dest.set(output, destOffset);
            };
        },
    };
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
export import PostScriptCompiler = NsPostScriptCompiler.PostScriptCompiler;
import { XRef } from "./xref.js";
import { BaseStream } from "./base_stream.js";
export {};
//# sourceMappingURL=function.d.ts.map