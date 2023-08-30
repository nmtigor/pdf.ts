/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

/* Copyright 2012 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { FeatureTest, FormatError, info, shadow } from "../shared/util.ts";
import { BaseStream } from "./base_stream.ts";
import { LocalFunctionCache } from "./image_utils.ts";
import type { Obj, ObjNoRef } from "./primitives.ts";
import { Dict, Ref } from "./primitives.ts";
import { PostScriptLexer, PostScriptParser } from "./ps_parser.ts";
import type { XRef } from "./xref.ts";
/*80--------------------------------------------------------------------------*/

export class PDFFunctionFactory {
  xref;
  isEvalSupported: boolean;

  constructor({ xref, isEvalSupported = true }: {
    xref: XRef;
    isEvalSupported: boolean | undefined;
  }) {
    this.xref = xref;
    this.isEvalSupported = isEvalSupported !== false;
  }

  create(fn: Ref | BaseStream | Dict) {
    const cachedFunction = this.getCached(fn);
    if (cachedFunction) {
      return cachedFunction;
    }
    const parsedFunction = PDFFunction.parse({
      xref: this.xref,
      isEvalSupported: this.isEvalSupported,
      fn: fn instanceof Ref ? this.xref.fetch(fn) as BaseStream | Dict : fn,
    });

    // Attempt to cache the parsed Function, by reference.
    this.#cache(fn, parsedFunction);

    return parsedFunction;
  }

  createFromArray(fnObj: Ref | Dict | BaseStream) {
    const cachedFunction = this.getCached(fnObj);
    if (cachedFunction) {
      return cachedFunction;
    }
    const parsedFunction = PDFFunction.parseArray({
      xref: this.xref,
      isEvalSupported: this.isEvalSupported,
      fnObj: fnObj instanceof Ref ? this.xref.fetch(fnObj) : fnObj,
    });

    // Attempt to cache the parsed Function, by reference.
    this.#cache(fnObj, parsedFunction);

    return parsedFunction;
  }

  getCached(cacheKey: Ref | Dict | BaseStream) {
    let fnRef;
    if (cacheKey instanceof Ref) {
      fnRef = cacheKey;
    } else if (cacheKey instanceof Dict) {
      fnRef = cacheKey.objId;
    } else if (cacheKey instanceof BaseStream) {
      fnRef = cacheKey.dict?.objId;
    }
    if (fnRef) {
      const localFunction = this._localFunctionCache.getByRef(fnRef);
      if (localFunction) {
        return localFunction;
      }
    }
    return null;
  }

  #cache(cacheKey: Ref | BaseStream | Dict, parsedFunction: ParsedFunction) {
    if (!parsedFunction) {
      throw new Error(
        'PDFFunctionFactory.#cache - expected "parsedFunction" argument.',
      );
    }
    let fnRef;
    if (cacheKey instanceof Ref) {
      fnRef = cacheKey;
    } else if (cacheKey instanceof Dict) {
      fnRef = cacheKey.objId;
    } else if (cacheKey instanceof BaseStream) {
      fnRef = cacheKey.dict?.objId;
    }
    if (fnRef) {
      this._localFunctionCache.set(
        /* name = */ undefined,
        fnRef,
        parsedFunction,
      );
    }
  }

  get _localFunctionCache() {
    return shadow(this, "_localFunctionCache", new LocalFunctionCache());
  }
}

function toNumberArray(arr: unknown): number[] | null {
  if (!Array.isArray(arr)) {
    return null;
  }
  const length = arr.length;
  for (let i = 0; i < length; i++) {
    if (typeof arr[i] !== "number") {
      // Non-number is found -- convert all items to numbers.
      const result = new Array(length);
      for (let j = 0; j < length; j++) {
        result[j] = +arr[j];
      }
      return result;
    }
  }
  return arr;
}

namespace NsPDFFunction {
  const enum FunctionType {
    CONSTRUCT_SAMPLED = 0,
    CONSTRUCT_INTERPOLATED = 2,
    CONSTRUCT_STICHED = 3,
    CONSTRUCT_POSTSCRIPT = 4,
  }

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

  type IRData_Sampled = readonly [
    _: FunctionType.CONSTRUCT_SAMPLED,
    inputSize: number,
    domain: (readonly [number, number])[],
    encode: (readonly [number, number])[],
    decode: (readonly [number, number])[],
    samples: number[],
    size: number[],
    outputSize: number,
    _: number,
    range: (readonly [number, number])[],
  ];
  type IRData_Interpolated = readonly [
    _: FunctionType.CONSTRUCT_INTERPOLATED,
    c0: number[],
    diff: number[],
    n: number,
  ];
  type IRData_Stiched = readonly [
    _: FunctionType.CONSTRUCT_STICHED,
    domain: number[],
    bounds: number[],
    encode: number[],
    fns: ParsedFunction[],
  ];
  type IRData_Postscript = readonly [
    _: FunctionType.CONSTRUCT_POSTSCRIPT,
    domain: number[],
    range: number[],
    code: (number | string | null)[],
  ];
  type IRData =
    | IRData_Sampled
    | IRData_Interpolated
    | IRData_Stiched
    | IRData_Postscript;

  interface ConstructFromIR<T extends IRData> {
    xref: XRef;
    isEvalSupported: boolean;
    IR: T;
  }

  export type ParsedFunction = (
    src: Float32Array | number[],
    srcOffset: number,
    dest: Float32Array,
    destOffset: number,
  ) => void;

  export const PDFFunction = {
    getSampleArray(
      size: number[],
      outputSize: number,
      bps: number,
      stream: BaseStream,
    ) {
      let i, ii;
      let length = 1;
      for (i = 0, ii = size.length; i < ii; i++) {
        length *= size[i];
      }
      length *= outputSize;

      const array = new Array(length);
      let codeSize = 0;
      let codeBuf = 0;
      // 32 is a valid bps so shifting won't work
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

    parse({ xref, isEvalSupported, fn }: _ParseP): ParsedFunction {
      const dict = (<BaseStream> fn).dict || <Dict> fn;
      const typeNum = dict.get("FunctionType");

      switch (typeNum) {
        case FunctionType.CONSTRUCT_SAMPLED:
          return PDFFunction.constructSampled({
            xref,
            isEvalSupported,
            fn: <BaseStream> fn,
            dict,
          });
        case 1:
          break;
        case FunctionType.CONSTRUCT_INTERPOLATED:
          return PDFFunction.constructInterpolated({
            xref,
            isEvalSupported,
            dict,
          });
        case FunctionType.CONSTRUCT_STICHED:
          return PDFFunction.constructStiched({ xref, isEvalSupported, dict });
        case FunctionType.CONSTRUCT_POSTSCRIPT:
          return PDFFunction.constructPostScript({
            xref,
            isEvalSupported,
            fn: <BaseStream> fn,
            dict,
          });
      }
      throw new FormatError("Unknown type of function");
    },

    parseArray({ xref, isEvalSupported, fnObj }: {
      xref: XRef;
      isEvalSupported: boolean;
      fnObj: ObjNoRef;
    }): ParsedFunction {
      if (!Array.isArray(fnObj)) {
        // not an array -- parsing as regular function
        return this.parse({
          xref,
          isEvalSupported,
          fn: <Dict | BaseStream> fnObj,
        });
      }

      const fnArray: ParsedFunction[] = [];
      for (const fn of fnObj) {
        fnArray.push(
          this.parse({
            xref,
            isEvalSupported,
            fn: xref.fetchIfRef(fn) as BaseStream | Dict,
          }),
        );
      }
      return (src, srcOffset, dest, destOffset) => {
        for (let i = 0, ii = fnArray.length; i < ii; i++) {
          fnArray[i](src, srcOffset, dest, destOffset + i);
        }
      };
    },

    /**
     * 7.10.2
     */
    constructSampled({ xref, isEvalSupported, fn, dict }: _TypeFnP) {
      function toMultiArray(arr: number[]) {
        const inputLength = arr.length;
        const out = [];
        let index = 0;
        for (let i = 0; i < inputLength; i += 2) {
          out[index++] = [arr[i], arr[i + 1]] as const;
        }
        return out;
      }
      // See chapter 3, page 109 of the PDF reference
      function interpolate(
        x: number,
        xmin: number,
        xmax: number,
        ymin: number,
        ymax: number,
      ) {
        return ymin + (x - xmin) * ((ymax - ymin) / (xmax - xmin));
      }

      let domain: null | number[] | (readonly [number, number])[] =
        toNumberArray(dict.getArray("Domain"));
      let range: null | number[] | (readonly [number, number])[] =
        toNumberArray(
          dict.getArray("Range"),
        );

      if (!domain || !range) {
        throw new FormatError("No domain or range");
      }

      const inputSize = domain.length / 2;
      const outputSize = range.length / 2;

      domain = toMultiArray(domain);
      range = toMultiArray(range);

      const size = toNumberArray(dict.getArray("Size"))!;
      const bps = dict.get("BitsPerSample") as number;
      const order = dict.get("Order") as number || 1;
      if (order !== 1) {
        // No description how cubic spline interpolation works in PDF32000:2008
        // As in poppler, ignoring order, linear interpolation may work as good
        info("No support for cubic spline interpolation: " + order);
      }

      let encode: null | number[] | (readonly [number, number])[] =
        toNumberArray(dict.getArray("Encode"));
      if (!encode) {
        encode = <[number, number][]> [];
        for (let i = 0; i < inputSize; ++i) {
          encode.push([0, size[i] - 1]);
        }
      } else {
        encode = toMultiArray(encode);
      }

      let decode: null | number[] | (readonly [number, number])[] =
        toNumberArray(dict.getArray("Decode"));
      if (!decode) {
        decode = range;
      } else {
        decode = toMultiArray(decode);
      }

      const samples = this.getSampleArray(size, outputSize, bps, fn!);
      // const mask = 2 ** bps - 1;

      return /* constructSampledFn */ (
        src: Float32Array | number[],
        srcOffset: number,
        dest: Float32Array,
        destOffset: number,
      ) => {
        // See chapter 3, page 110 of the PDF reference.

        // Building the cube vertices: its part and sample index
        // http://rjwagner49.com/Mathematics/Interpolation.pdf
        const cubeVertices = 1 << inputSize;
        const cubeN = new Float64Array(cubeVertices);
        const cubeVertex = new Uint32Array(cubeVertices);
        let i, j;
        for (j = 0; j < cubeVertices; j++) {
          cubeN[j] = 1;
        }

        let k = outputSize,
          pos = 1;
        // Map x_i to y_j for 0 <= i < m using the sampled function.
        for (i = 0; i < inputSize; ++i) {
          // x_i' = min(max(x_i, Domain_2i), Domain_2i+1)
          const domain_2i = (<[number, number][]> domain)[i][0];
          const domain_2i_1 = (<[number, number][]> domain)[i][1];
          const xi = Math.min(
            Math.max(src[srcOffset + i], domain_2i),
            domain_2i_1,
          );

          // e_i = Interpolate(x_i', Domain_2i, Domain_2i+1,
          //                   Encode_2i, Encode_2i+1)
          let e = interpolate(
            xi,
            domain_2i,
            domain_2i_1,
            (<[number, number][]> encode)[i][0],
            (<[number, number][]> encode)[i][1],
          );

          // e_i' = min(max(e_i, 0), Size_i - 1)
          const size_i = size[i];
          e = Math.min(Math.max(e, 0), size_i - 1);

          // Adjusting the cube: N and vertex sample index
          const e0 = e < size_i - 1 ? Math.floor(e) : e - 1; // e1 = e0 + 1;
          const n0 = e0 + 1 - e; // (e1 - e) / (e1 - e0);
          const n1 = e - e0; // (e - e0) / (e1 - e0);
          const offset0 = e0 * k;
          const offset1 = offset0 + k; // e1 * k
          for (j = 0; j < cubeVertices; j++) {
            if (j & pos) {
              cubeN[j] *= n1;
              cubeVertex[j] += offset1;
            } else {
              cubeN[j] *= n0;
              cubeVertex[j] += offset0;
            }
          }

          k *= size_i;
          pos <<= 1;
        }

        for (j = 0; j < outputSize; ++j) {
          // Sum all cube vertices' samples portions
          let rj = 0;
          for (i = 0; i < cubeVertices; i++) {
            rj += samples[cubeVertex[i] + j] * cubeN[i];
          }

          // r_j' = Interpolate(r_j, 0, 2^BitsPerSample - 1,
          //                    Decode_2j, Decode_2j+1)
          rj = interpolate(
            rj,
            0,
            1,
            (<[number, number][]> decode)[j][0],
            (<[number, number][]> decode)[j][1],
          );

          // y_j = min(max(r_j, range_2j), range_2j+1)
          dest[destOffset + j] = Math.min(
            Math.max(rj, (<[number, number][]> range)[j][0]),
            (<[number, number][]> range)[j][1],
          );
        }
      };
    },

    constructInterpolated({ xref, isEvalSupported, dict }: _TypeP) {
      const c0 = toNumberArray(dict.getArray("C0")) || [0];
      const c1 = toNumberArray(dict.getArray("C1")) || [1];
      const n = dict.get("N") as number;

      const diff: number[] = [];
      for (let i = 0, ii = c0.length; i < ii; ++i) {
        diff.push(c1[i] - c0[i]);
      }
      const length = diff.length;

      return /* constructInterpolatedFn */ (
        src: Float32Array | number[],
        srcOffset: number,
        dest: Float32Array,
        destOffset: number,
      ) => {
        const x = n === 1 ? src[srcOffset] : src[srcOffset] ** n;

        for (let j = 0; j < length; ++j) {
          dest[destOffset + j] = c0[j] + x * diff[j];
        }
      };
    },

    // /**
    //  * 7.10.3
    //  */
    // constructInterpolatedFromIR({ xref, isEvalSupported, IR }:ConstructFromIR< IRData_Interpolated >
    // ):ParsedFunction {
    //   const c0 = IR[1];
    //   const diff = IR[2];
    //   const n = IR[3];

    //   const length = diff.length;

    //   return ( src, srcOffset, dest, destOffset )=>
    //   {
    //     const x = n === 1 ? src[srcOffset] : src[srcOffset] ** n;

    //     for( let j = 0; j < length; ++j )
    //     {
    //       dest[destOffset + j] = c0[j] + x * diff[j];
    //     }
    //   };
    // },

    constructStiched({ xref, isEvalSupported, dict }: _TypeP) {
      const domain = toNumberArray(dict.getArray("Domain"));

      if (!domain) {
        throw new FormatError("No domain");
      }

      const inputSize = domain.length / 2;
      if (inputSize !== 1) {
        throw new FormatError("Bad domain for stiched function");
      }

      const fns: ParsedFunction[] = [];
      for (const fn of dict.get("Functions") as Obj[]) {
        fns.push(
          this.parse({
            xref,
            isEvalSupported,
            fn: xref.fetchIfRef(fn) as BaseStream | Dict,
          }),
        );
      }

      const bounds = toNumberArray(dict.getArray("Bounds"))!;
      const encode = toNumberArray(dict.getArray("Encode"))!;
      const tmpBuf = new Float32Array(1);

      return /* constructStichedFn */ (
        src: Float32Array | number[],
        srcOffset: number,
        dest: Float32Array,
        destOffset: number,
      ) => {
        const clip = (
          v: number,
          min: number,
          max: number,
        ) => {
          if (v > max) {
            v = max;
          } else if (v < min) {
            v = min;
          }
          return v;
        };

        // clip to domain
        const v = clip(src[srcOffset], domain[0], domain[1]);
        // calculate which bound the value is in
        const length = bounds.length;
        let i;
        for (i = 0; i < length; ++i) {
          if (v < bounds[i]) {
            break;
          }
        }

        // encode value into domain of function
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

        // Prevent the value from becoming NaN as a result
        // of division by zero (fixes issue6113.pdf).
        tmpBuf[0] = dmin === dmax
          ? rmin
          : rmin + ((v - dmin) * (rmax - rmin)) / (dmax - dmin);

        // call the appropriate function
        fns[i](tmpBuf, 0, dest, destOffset);
      };
    },

    constructPostScript({ xref, isEvalSupported, fn, dict }: _TypeFnP) {
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

      if (isEvalSupported && FeatureTest.isEvalSupported) {
        const compiled = new PostScriptCompiler().compile(code, domain, range);
        if (compiled) {
          // Compiled function consists of simple expressions such as addition,
          // subtraction, Math.max, and also contains 'var' and 'return'
          // statements. See the generation in the PostScriptCompiler below.
          // eslint-disable-next-line no-new-func
          return <ParsedFunction> new Function(
            "src",
            "srcOffset",
            "dest",
            "destOffset",
            compiled,
          );
        }
      }
      info("Unable to compile PS function");

      const numOutputs = range.length >> 1;
      const numInputs = domain.length >> 1;
      const evaluator = new PostScriptEvaluator(code);
      // Cache the values for a big speed up, the cache size is limited though
      // since the number of possible values can be huge from a PS function.
      const cache = Object.create(null);
      // The MAX_CACHE_SIZE is set to ~4x the maximum number of distinct values
      // seen in our tests.
      const MAX_CACHE_SIZE = 2048 * 4;
      let cache_available = MAX_CACHE_SIZE;
      const tmpBuf = new Float32Array(numInputs);

      return /* constructPostScriptFn */ (
        src: Float32Array | number[],
        srcOffset: number,
        dest: Float32Array,
        destOffset: number,
      ) => {
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
          if (value as number < bound) {
            value = bound;
          } else {
            bound = range[i * 2 + 1];
            if (value as number > bound) {
              value = bound;
            }
          }
          output[i] = value as number;
        }
        if (cache_available > 0) {
          cache_available--;
          cache[key] = output;
        }
        dest.set(output, destOffset);
      };
    },
    // /**
    //  * 7.10.5
    //  */
    // constructPostScriptFromIR({ xref, isEvalSupported, IR }:ConstructFromIR< IRData_Postscript >
    // ):ParsedFunction {
    //   const domain = IR[1];
    //   const range = IR[2];
    //   const code = IR[3];

    //   if( isEvalSupported && IsEvalSupportedCached.value )
    //   {
    //     const compiled = new PostScriptCompiler().compile(code, domain, range);
    //     if( compiled )
    //     {
    //       // Compiled function consists of simple expressions such as addition,
    //       // subtraction, Math.max, and also contains 'const' and 'return'
    //       // statements. See the generation in the PostScriptCompiler below.
    //       // eslint-disable-next-line no-new-func
    //       return < ParsedFunction >new Function(
    //         "src",
    //         "srcOffset",
    //         "dest",
    //         "destOffset",
    //         compiled
    //       );
    //     }
    //   }
    //   info("Unable to compile PS function");

    //   const numOutputs = range.length >> 1;
    //   const numInputs = domain.length >> 1;
    //   const evaluator = new PostScriptEvaluator(code);
    //   // Cache the values for a big speed up, the cache size is limited though
    //   // since the number of possible values can be huge from a PS function.
    //   const cache = Object.create(null);
    //   // The MAX_CACHE_SIZE is set to ~4x the maximum number of distinct values
    //   // seen in our tests.
    //   const MAX_CACHE_SIZE = 2048 * 4;
    //   let cache_available = MAX_CACHE_SIZE;
    //   const tmpBuf = new Float32Array(numInputs);

    //   return ( src, srcOffset, dest, destOffset )=>
    //   {
    //     let i, value;
    //     let key = "";
    //     const input = tmpBuf;
    //     for (i = 0; i < numInputs; i++) {
    //       value = src[srcOffset + i];
    //       input[i] = value;
    //       key += value + "_";
    //     }

    //     const cachedValue = cache[key];
    //     if (cachedValue !== undefined) {
    //       dest.set(cachedValue, destOffset);
    //       return;
    //     }

    //     const output = new Float32Array(numOutputs);
    //     const stack = evaluator.execute(input);
    //     const stackIndex = stack.length - numOutputs;
    //     for( i = 0; i < numOutputs; i++ )
    //     {
    //       value = <number>stack[stackIndex + i];
    //       let bound = range[i * 2];
    //       if (value < bound) {
    //         value = bound;
    //       }
    //       else {
    //         bound = range[i * 2 + 1];
    //         if (value > bound) {
    //           value = bound;
    //         }
    //       }
    //       output[i] = value;
    //     }
    //     if (cache_available > 0) {
    //       cache_available--;
    //       cache[key] = output;
    //     }
    //     dest.set(output, destOffset);
    //   };
    // },
  };
}
export type ParsedFunction = NsPDFFunction.ParsedFunction;
// Hoisting for deno.
var PDFFunction = NsPDFFunction.PDFFunction;

export function isPDFFunction(v: unknown) {
  let fnDict;
  if (v instanceof Dict) {
    fnDict = v;
  } else if (v instanceof BaseStream) {
    fnDict = v.dict!;
  } else {
    return false;
  }
  return fnDict.has("FunctionType");
}

export class PostScriptStack {
  static MAX_STACK_SIZE = 100;

  stack: (number | boolean)[];

  constructor(initialStack?: Float32Array) {
    this.stack = initialStack ? Array.from(initialStack) : [];
  }

  push(value: number | boolean) {
    if (this.stack.length >= PostScriptStack.MAX_STACK_SIZE) {
      throw new Error("PostScript function stack overflow.");
    }
    this.stack.push(value);
  }

  pop() {
    if (this.stack.length <= 0) {
      throw new Error("PostScript function stack underflow.");
    }
    return this.stack.pop()!;
  }

  copy(n: number) {
    if (this.stack.length + n >= PostScriptStack.MAX_STACK_SIZE) {
      throw new Error("PostScript function stack overflow.");
    }
    const stack = this.stack;
    for (let i = stack.length - n, j = n - 1; j >= 0; j--, i++) {
      stack.push(stack[i]);
    }
  }

  index(n: number) {
    this.push(this.stack[this.stack.length - n - 1]);
  }

  /**
   * rotate the last n stack elements p times
   */
  roll(n: number, p: number) {
    const stack = this.stack;
    const l = stack.length - n;
    const r = stack.length - 1;
    const c = l + (p - Math.floor(p / n) * n);

    for (let i = l, j = r; i < j; i++, j--) {
      const t = stack[i];
      stack[i] = stack[j];
      stack[j] = t;
    }
    for (let i = l, j = c - 1; i < j; i++, j--) {
      const t = stack[i];
      stack[i] = stack[j];
      stack[j] = t;
    }
    for (let i = c, j = r; i < j; i++, j--) {
      const t = stack[i];
      stack[i] = stack[j];
      stack[j] = t;
    }
  }
}

export class PostScriptEvaluator {
  operators;

  constructor(operators: (number | string | null)[]) {
    this.operators = operators;
  }

  execute(initialStack: Float32Array) {
    const stack = new PostScriptStack(initialStack);
    let counter = 0;
    const operators = this.operators;
    const length = operators.length;
    let operator, a, b;
    while (counter < length) {
      operator = operators[counter++];
      if (typeof operator === "number") {
        // Operator is really an operand and should be pushed to the stack.
        stack.push(operator);
        continue;
      }
      switch (operator) {
        // non standard ps operators
        case "jz": // jump if false
          b = stack.pop();
          a = stack.pop();
          if (!a) {
            counter = b as number;
          }
          break;
        case "j": // jump
          a = stack.pop();
          counter = a as number;
          break;

        // all ps operators in alphabetical order (excluding if/ifelse)

        case "abs":
          a = stack.pop();
          stack.push(Math.abs(a as number));
          break;
        case "add":
          b = stack.pop() as number;
          a = stack.pop() as number;
          stack.push(a + b);
          break;
        case "and":
          b = stack.pop();
          a = stack.pop();
          if (typeof a === "boolean" && typeof b === "boolean") {
            stack.push(a && b);
          } else {
            stack.push((a as number) & (b as number));
          }
          break;
        case "atan":
          b = stack.pop();
          a = stack.pop();
          a = (Math.atan2(a as number, b as number) / Math.PI) * 180;
          if (a < 0) {
            a += 360;
          }
          stack.push(a);
          break;
        case "bitshift":
          b = stack.pop() as number;
          a = stack.pop() as number;
          if (a > 0) {
            stack.push(a << b);
          } else {
            stack.push(a >> b);
          }
          break;
        case "ceiling":
          a = stack.pop();
          stack.push(Math.ceil(a as number));
          break;
        case "copy":
          a = stack.pop();
          stack.copy(a as number);
          break;
        case "cos":
          a = stack.pop();
          stack.push(Math.cos(((a as number % 360) / 180) * Math.PI));
          break;
        case "cvi":
          a = +stack.pop() | 0;
          stack.push(a);
          break;
        case "cvr":
          // noop
          break;
        case "div":
          b = stack.pop() as number;
          a = stack.pop() as number;
          stack.push(a / b);
          break;
        case "dup":
          stack.copy(1);
          break;
        case "eq":
          b = stack.pop();
          a = stack.pop();
          stack.push(a === b);
          break;
        case "exch":
          stack.roll(2, 1);
          break;
        case "exp":
          b = stack.pop() as number;
          a = stack.pop() as number;
          stack.push(a ** b);
          break;
        case "false":
          stack.push(false);
          break;
        case "floor":
          a = stack.pop();
          stack.push(Math.floor(a as number));
          break;
        case "ge":
          b = stack.pop();
          a = stack.pop();
          stack.push(a >= b);
          break;
        case "gt":
          b = stack.pop();
          a = stack.pop();
          stack.push(a > b);
          break;
        case "idiv":
          b = stack.pop() as number;
          a = stack.pop() as number;
          stack.push((a / b) | 0);
          break;
        case "index":
          a = stack.pop();
          stack.index(a as number);
          break;
        case "le":
          b = stack.pop();
          a = stack.pop();
          stack.push(a <= b);
          break;
        case "ln":
          a = stack.pop();
          stack.push(Math.log(a as number));
          break;
        case "log":
          a = stack.pop();
          stack.push(Math.log(a as number) / Math.LN10);
          break;
        case "lt":
          b = stack.pop();
          a = stack.pop();
          stack.push(a < b);
          break;
        case "mod":
          b = stack.pop() as number;
          a = stack.pop() as number;
          stack.push(a % b);
          break;
        case "mul":
          b = stack.pop() as number;
          a = stack.pop() as number;
          stack.push(a * b);
          break;
        case "ne":
          b = stack.pop();
          a = stack.pop();
          stack.push(a !== b);
          break;
        case "neg":
          a = stack.pop();
          stack.push(-a);
          break;
        case "not":
          a = stack.pop();
          if (typeof a === "boolean") {
            stack.push(!a);
          } else {
            stack.push(~a);
          }
          break;
        case "or":
          b = stack.pop();
          a = stack.pop();
          if (typeof a === "boolean" && typeof b === "boolean") {
            stack.push(a || b);
          } else {
            stack.push((a as number) | (b as number));
          }
          break;
        case "pop":
          stack.pop();
          break;
        case "roll":
          b = stack.pop();
          a = stack.pop();
          stack.roll(a as number, b as number);
          break;
        case "round":
          a = stack.pop();
          stack.push(Math.round(a as number));
          break;
        case "sin":
          a = stack.pop();
          stack.push(Math.sin(((a as number % 360) / 180) * Math.PI));
          break;
        case "sqrt":
          a = stack.pop();
          stack.push(Math.sqrt(a as number));
          break;
        case "sub":
          b = stack.pop() as number;
          a = stack.pop() as number;
          stack.push(a - b);
          break;
        case "true":
          stack.push(true);
          break;
        case "truncate":
          a = stack.pop() as number;
          a = a < 0 ? Math.ceil(a) : Math.floor(a);
          stack.push(a);
          break;
        case "xor":
          b = stack.pop();
          a = stack.pop();
          if (typeof a === "boolean" && typeof b === "boolean") {
            stack.push(a !== b);
          } else {
            stack.push((a as number) ^ (b as number));
          }
          break;
        default:
          throw new FormatError(`Unknown operator ${operator}`);
      }
    }
    return stack.stack;
  }
}

namespace NsPostScriptCompiler {
  const enum AstNodeType {
    args,
    binary,
    definition,
    literal,
    max,
    var,
  }

  abstract class AstNode {
    constructor(public type: AstNodeType) {
    }

    abstract visit(visitor: ExpressionBuilderVisitor): void;
  }

  class AstArgument extends AstNode {
    constructor(public index: number, public min: number, public max: number) {
      super(AstNodeType.args);
    }

    /** @implement */
    visit(visitor: ExpressionBuilderVisitor) {
      visitor.visitArgument(this);
    }
  }

  class AstLiteral extends AstNode {
    min;
    max;

    constructor(public number: number) {
      super(AstNodeType.literal);

      this.min = number;
      this.max = number;
    }

    /** @implement */
    visit(visitor: ExpressionBuilderVisitor) {
      visitor.visitLiteral(this);
    }
  }

  class AstBinaryOperation extends AstNode {
    constructor(
      public op: string,
      public arg1: AstMinMax,
      public arg2: AstMinMax,
      public min: number,
      public max: number,
    ) {
      super(AstNodeType.binary);
    }

    /** @implement */
    visit(visitor: ExpressionBuilderVisitor) {
      visitor.visitBinaryOperation(this);
    }
  }

  class AstMin extends AstNode {
    min: number;

    constructor(public arg: AstMinMax, public max: number) {
      super(AstNodeType.max);

      this.min = arg.min;
    }

    /** @implement */
    visit(visitor: ExpressionBuilderVisitor) {
      visitor.visitMin(this);
    }
  }

  class AstVariable extends AstNode {
    constructor(public index: number, public min: number, public max: number) {
      super(AstNodeType.var);
    }

    /** @implement */
    visit(visitor: ExpressionBuilderVisitor) {
      visitor.visitVariable(this);
    }
  }

  class AstVariableDefinition extends AstNode {
    constructor(public variable: AstVariable, public arg: AstNode) {
      super(AstNodeType.definition);
    }

    /** @implement */
    visit(visitor: ExpressionBuilderVisitor) {
      visitor.visitVariableDefinition(this);
    }
  }

  type AstMinMax =
    | AstArgument
    | AstLiteral
    | AstBinaryOperation
    | AstMin
    | AstVariable;

  class ExpressionBuilderVisitor {
    parts: (number | string)[] = [];

    visitArgument(arg: AstArgument) {
      this.parts.push(
        "Math.max(",
        arg.min,
        ", Math.min(",
        arg.max,
        ", src[srcOffset + ",
        arg.index,
        "]))",
      );
    }

    visitVariable(variable: AstVariable) {
      this.parts.push("v", variable.index);
    }

    visitLiteral(literal: AstLiteral) {
      this.parts.push(literal.number);
    }

    visitBinaryOperation(operation: AstBinaryOperation) {
      this.parts.push("(");
      operation.arg1.visit(this);
      this.parts.push(" ", operation.op, " ");
      operation.arg2.visit(this);
      this.parts.push(")");
    }

    visitVariableDefinition(definition: AstVariableDefinition) {
      this.parts.push("var ");
      definition.variable.visit(this);
      this.parts.push(" = ");
      definition.arg.visit(this);
      this.parts.push(";");
    }

    visitMin(max: AstMin) {
      this.parts.push("Math.min(");
      max.arg.visit(this);
      this.parts.push(", ", max.max, ")");
    }

    toString() {
      return this.parts.join("");
    }
  }

  function buildAddOperation(num1: AstMinMax, num2: AstMinMax) {
    if (num2.type === AstNodeType.literal && (<AstLiteral> num2).number === 0) {
      // optimization: second operand is 0
      return num1;
    }
    if (num1.type === AstNodeType.literal && (<AstLiteral> num1).number === 0) {
      // optimization: first operand is 0
      return num2;
    }
    if (
      num2.type === AstNodeType.literal && num1.type === AstNodeType.literal
    ) {
      // optimization: operands operand are literals
      return new AstLiteral(
        (<AstLiteral> num1).number + (<AstLiteral> num2).number,
      );
    }
    return new AstBinaryOperation(
      "+",
      num1,
      num2,
      num1.min + num2.min,
      num1.max + num2.max,
    );
  }

  function buildMulOperation(num1: AstMinMax, num2: AstMinMax) {
    if (num2.type === AstNodeType.literal) {
      // optimization: second operands is a literal...
      if ((<AstLiteral> num2).number === 0) {
        return new AstLiteral(0); // and it's 0
      } else if ((<AstLiteral> num2).number === 1) {
        return num1; // and it's 1
      } else if (num1.type === AstNodeType.literal) {
        // ... and first operands is a literal too
        return new AstLiteral(
          (<AstLiteral> num1).number * (<AstLiteral> num2).number,
        );
      }
    }
    if (num1.type === AstNodeType.literal) {
      // optimization: first operands is a literal...
      if ((<AstLiteral> num1).number === 0) {
        return new AstLiteral(0); // and it's 0
      } else if ((<AstLiteral> num1).number === 1) {
        return num2; // and it's 1
      }
    }
    const min = Math.min(
      num1.min * num2.min,
      num1.min * num2.max,
      num1.max * num2.min,
      num1.max * num2.max,
    );
    const max = Math.max(
      num1.min * num2.min,
      num1.min * num2.max,
      num1.max * num2.min,
      num1.max * num2.max,
    );
    return new AstBinaryOperation("*", num1, num2, min, max);
  }

  function buildSubOperation(num1: AstMinMax, num2: AstMinMax) {
    if (num2.type === AstNodeType.literal) {
      // optimization: second operands is a literal...
      if ((<AstLiteral> num2).number === 0) {
        return num1; // ... and it's 0
      } else if (num1.type === AstNodeType.literal) {
        // ... and first operands is a literal too
        return new AstLiteral(
          (<AstLiteral> num1).number - (<AstLiteral> num2).number,
        );
      }
    }
    if (
      num2.type === AstNodeType.binary &&
      (<AstBinaryOperation> num2).op === "-" &&
      num1.type === AstNodeType.literal && (<AstLiteral> num1).number === 1 &&
      (<AstBinaryOperation> num2).arg1.type === AstNodeType.literal &&
      (<AstLiteral> (<AstBinaryOperation> num2).arg1).number === 1
    ) {
      // optimization for case: 1 - (1 - x)
      return (<AstBinaryOperation> num2).arg2;
    }
    return new AstBinaryOperation(
      "-",
      num1,
      num2,
      num1.min - num2.max,
      num1.max - num2.min,
    );
  }

  function buildMinOperation(num1: AstMinMax, max: number) {
    if (num1.min >= max) {
      // optimization: num1 min value is not less than required max
      return new AstLiteral(max); // just returning max
    } else if (num1.max <= max) {
      // optimization: num1 max value is not greater than required max
      return num1; // just returning an argument
    }
    return new AstMin(num1, max);
  }

  // Most of the PDFs functions consist of simple operations such as:
  //   roll, exch, sub, cvr, pop, index, dup, mul, if, gt, add.
  //
  // We can compile most of such programs, and at the same moment, we can
  // optimize some expressions using basic math properties. Keeping track of
  // min/max values will allow us to avoid extra Math.min/Math.max calls.
  export class PostScriptCompiler {
    compile(
      code: (number | string | null)[],
      domain: number[],
      range: number[],
    ) {
      const stack: AstNode[] = [];
      const instructions = [];
      const inputSize = domain.length >> 1,
        outputSize = range.length >> 1;
      let lastRegister = 0;
      let n, j;
      let num1, num2, ast1, ast2, tmpVar, item;
      for (let i = 0; i < inputSize; i++) {
        stack.push(new AstArgument(i, domain[i * 2], domain[i * 2 + 1]));
      }

      for (let i = 0, ii = code.length; i < ii; i++) {
        item = code[i];
        if (typeof item === "number") {
          stack.push(new AstLiteral(item));
          continue;
        }

        switch (item) {
          case "add":
            if (stack.length < 2) {
              return null;
            }
            num2 = stack.pop();
            num1 = stack.pop();
            stack.push(buildAddOperation(num1 as AstMinMax, num2 as AstMinMax));
            break;
          case "cvr":
            if (stack.length < 1) {
              return null;
            }
            break;
          case "mul":
            if (stack.length < 2) {
              return null;
            }
            num2 = stack.pop();
            num1 = stack.pop();
            stack.push(buildMulOperation(num1 as AstMinMax, num2 as AstMinMax));
            break;
          case "sub":
            if (stack.length < 2) {
              return null;
            }
            num2 = stack.pop();
            num1 = stack.pop();
            stack.push(buildSubOperation(num1 as AstMinMax, num2 as AstMinMax));
            break;
          case "exch":
            if (stack.length < 2) {
              return null;
            }
            ast1 = stack.pop()!;
            ast2 = stack.pop()!;
            stack.push(ast1, ast2);
            break;
          case "pop":
            if (stack.length < 1) {
              return null;
            }
            stack.pop();
            break;
          case "index":
            if (stack.length < 1) {
              return null;
            }
            num1 = stack.pop()!;
            if (num1.type !== AstNodeType.literal) {
              return null;
            }
            n = (<AstLiteral> num1).number;
            if (n < 0 || !Number.isInteger(n) || stack.length < n) {
              return null;
            }
            ast1 = stack[stack.length - n - 1];
            if (
              ast1.type === AstNodeType.literal || ast1.type === AstNodeType.var
            ) {
              stack.push(ast1);
              break;
            }
            tmpVar = new AstVariable(
              lastRegister++,
              (ast1 as AstMinMax).min,
              (ast1 as AstMinMax).max,
            );
            stack[stack.length - n - 1] = tmpVar;
            stack.push(tmpVar);
            instructions.push(new AstVariableDefinition(tmpVar, ast1));
            break;
          case "dup":
            if (stack.length < 1) {
              return null;
            }
            if (
              typeof code[i + 1] === "number" &&
              code[i + 2] === "gt" &&
              code[i + 3] === i + 7 &&
              code[i + 4] === "jz" &&
              code[i + 5] === "pop" &&
              code[i + 6] === code[i + 1]
            ) {
              // special case of the commands sequence for the min operation
              num1 = stack.pop();
              stack.push(
                buildMinOperation(num1 as AstMinMax, code[i + 1] as number),
              );
              i += 6;
              break;
            }
            ast1 = stack.at(-1)!;
            if (
              ast1.type === AstNodeType.literal || ast1.type === AstNodeType.var
            ) {
              // we don't have to save into intermediate variable a literal or
              // variable.
              stack.push(ast1);
              break;
            }
            tmpVar = new AstVariable(
              lastRegister++,
              (ast1 as AstMinMax).min,
              (ast1 as AstMinMax).max,
            );
            stack[stack.length - 1] = tmpVar;
            stack.push(tmpVar);
            instructions.push(new AstVariableDefinition(tmpVar, ast1));
            break;
          case "roll":
            if (stack.length < 2) {
              return null;
            }
            num2 = stack.pop()!;
            num1 = stack.pop()!;
            if (
              num2.type !== AstNodeType.literal ||
              num1.type !== AstNodeType.literal
            ) {
              // both roll operands must be numbers
              return null;
            }
            j = (<AstLiteral> num2).number;
            n = (<AstLiteral> num1).number;
            if (
              n <= 0 ||
              !Number.isInteger(n) ||
              !Number.isInteger(j) ||
              stack.length < n
            ) {
              // ... and integers
              return null;
            }
            j = ((j % n) + n) % n;
            if (j === 0) {
              break; // just skipping -- there are nothing to rotate
            }
            stack.push(...stack.splice(stack.length - n, n - j));
            break;
          default:
            return null; // unsupported operator
        }
      }

      if (stack.length !== outputSize) {
        return null;
      }

      const result: string[] = [];
      for (const instruction of instructions) {
        const statementBuilder = new ExpressionBuilderVisitor();
        instruction.visit(statementBuilder);
        result.push(statementBuilder.toString());
      }
      for (let i = 0, ii = stack.length; i < ii; i++) {
        const expr = stack[i],
          statementBuilder = new ExpressionBuilderVisitor();
        expr.visit(statementBuilder);
        const min = range[i * 2],
          max = range[i * 2 + 1];
        const out: (number | string)[] = [statementBuilder.toString()];
        if (min > (expr as AstMinMax).min) {
          out.unshift("Math.max(", min, ", ");
          out.push(")");
        }
        if (max < (expr as AstMinMax).max) {
          out.unshift("Math.min(", max, ", ");
          out.push(")");
        }
        out.unshift("dest[destOffset + ", i, "] = ");
        out.push(";");
        result.push(out.join(""));
      }
      return result.join("\n");
    }
  }
}
export type PostScriptCompiler = NsPostScriptCompiler.PostScriptCompiler;
// Hoisting for deno.
export var PostScriptCompiler = NsPostScriptCompiler.PostScriptCompiler;
/*80--------------------------------------------------------------------------*/
