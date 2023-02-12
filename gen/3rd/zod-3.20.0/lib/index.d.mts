export function addIssueToContext(ctx: any, issueData: any): void;
declare function anyType(params: any): ZodAny;
declare function arrayType(schema: any, params: any): ZodArray;
declare function bigIntType(params: any): ZodBigInt;
declare function booleanType(params: any): ZodBoolean;
export const BRAND: unique symbol;
export namespace coerce {
    function string(arg: any): ZodString;
    function number(arg: any): ZodNumber;
    function boolean(arg: any): ZodBoolean;
    function bigint(arg: any): ZodBigInt;
    function date(arg: any): ZodDate;
}
export function custom(check: any, params: {} | undefined, fatal: any): ZodAny | ZodEffects;
declare function dateType(params: any): ZodDate;
export function DIRTY(value: any): {
    status: string;
    value: any;
};
/**
 * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
 * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
 * have a different value for each object in the union.
 * @param discriminator the name of the discriminator property
 * @param types an array of object schemas
 * @param params
 */
declare function discriminatedUnionType(discriminator: any, options: any, params: any): ZodDiscriminatedUnion;
declare function effectsType(schema: any, effect: any, params: any): ZodEffects;
export const EMPTY_PATH: any[];
declare function enumType(values: any, params: any): ZodEnum;
declare function errorMap(issue: any, _ctx: any): {
    message: any;
};
declare function functionType(args: any, returns: any, params: any): ZodFunction;
export function getErrorMap(): (issue: any, _ctx: any) => {
    message: any;
};
export function getParsedType(data: any): any;
declare function instanceOfType(cls: any, params?: {
    message: string;
}): ZodAny | ZodEffects;
declare function intersectionType(left: any, right: any, params: any): ZodIntersection;
export const INVALID: Readonly<{
    status: "aborted";
}>;
export function isAborted(x: any): boolean;
export function isAsync(x: any): boolean;
export function isDirty(x: any): boolean;
export function isValid(x: any): boolean;
export namespace late {
    import object = ZodObject.lazycreate;
    export { object };
}
declare function lazyType(getter: any, params: any): ZodLazy;
declare function literalType(value: any, params: any): ZodLiteral;
export function makeIssue(params: any): any;
declare function mapType(keyType: any, valueType: any, params: any): ZodMap;
declare var mod: Readonly<{
    __proto__: null;
    defaultErrorMap: (issue: any, _ctx: any) => {
        message: any;
    };
    setErrorMap: typeof setErrorMap;
    getErrorMap: typeof getErrorMap;
    makeIssue: (params: any) => any;
    EMPTY_PATH: any[];
    addIssueToContext: typeof addIssueToContext;
    ParseStatus: typeof ParseStatus;
    INVALID: Readonly<{
        status: "aborted";
    }>;
    DIRTY: (value: any) => {
        status: string;
        value: any;
    };
    OK: (value: any) => {
        status: string;
        value: any;
    };
    isAborted: (x: any) => boolean;
    isDirty: (x: any) => boolean;
    isValid: (x: any) => boolean;
    isAsync: (x: any) => boolean;
    readonly util: any;
    ZodParsedType: any;
    getParsedType: (data: any) => any;
    ZodType: typeof ZodType;
    ZodString: typeof ZodString;
    ZodNumber: typeof ZodNumber;
    ZodBigInt: typeof ZodBigInt;
    ZodBoolean: typeof ZodBoolean;
    ZodDate: typeof ZodDate;
    ZodSymbol: typeof ZodSymbol;
    ZodUndefined: typeof ZodUndefined;
    ZodNull: typeof ZodNull;
    ZodAny: typeof ZodAny;
    ZodUnknown: typeof ZodUnknown;
    ZodNever: typeof ZodNever;
    ZodVoid: typeof ZodVoid;
    ZodArray: typeof ZodArray;
    readonly objectUtil: any;
    ZodObject: typeof ZodObject;
    ZodUnion: typeof ZodUnion;
    ZodDiscriminatedUnion: typeof ZodDiscriminatedUnion;
    ZodIntersection: typeof ZodIntersection;
    ZodTuple: typeof ZodTuple;
    ZodRecord: typeof ZodRecord;
    ZodMap: typeof ZodMap;
    ZodSet: typeof ZodSet;
    ZodFunction: typeof ZodFunction;
    ZodLazy: typeof ZodLazy;
    ZodLiteral: typeof ZodLiteral;
    ZodEnum: typeof ZodEnum;
    ZodNativeEnum: typeof ZodNativeEnum;
    ZodPromise: typeof ZodPromise;
    ZodEffects: typeof ZodEffects;
    ZodTransformer: typeof ZodEffects;
    ZodOptional: typeof ZodOptional;
    ZodNullable: typeof ZodNullable;
    ZodDefault: typeof ZodDefault;
    ZodCatch: typeof ZodCatch;
    ZodNaN: typeof ZodNaN;
    BRAND: typeof BRAND;
    ZodBranded: typeof ZodBranded;
    ZodPipeline: typeof ZodPipeline;
    custom: (check: any, params: {} | undefined, fatal: any) => ZodAny | ZodEffects;
    Schema: typeof ZodType;
    ZodSchema: typeof ZodType;
    late: {
        object: (shape: any, params: any) => ZodObject;
    };
    readonly ZodFirstPartyTypeKind: any;
    coerce: {
        string: (arg: any) => ZodString;
        number: (arg: any) => ZodNumber;
        boolean: (arg: any) => ZodBoolean;
        bigint: (arg: any) => ZodBigInt;
        date: (arg: any) => ZodDate;
    };
    any: (params: any) => ZodAny;
    array: (schema: any, params: any) => ZodArray;
    bigint: (params: any) => ZodBigInt;
    boolean: (params: any) => ZodBoolean;
    date: (params: any) => ZodDate;
    discriminatedUnion: typeof ZodDiscriminatedUnion.create;
    effect: (schema: any, effect: any, params: any) => ZodEffects;
    enum: typeof createZodEnum;
    function: typeof ZodFunction.create;
    instanceof: (cls: any, params?: {
        message: string;
    }) => ZodAny | ZodEffects;
    intersection: (left: any, right: any, params: any) => ZodIntersection;
    lazy: (getter: any, params: any) => ZodLazy;
    literal: (value: any, params: any) => ZodLiteral;
    map: (keyType: any, valueType: any, params: any) => ZodMap;
    nan: (params: any) => ZodNaN;
    nativeEnum: (values: any, params: any) => ZodNativeEnum;
    never: (params: any) => ZodNever;
    null: (params: any) => ZodNull;
    nullable: (type: any, params: any) => ZodNullable;
    number: (params: any) => ZodNumber;
    object: (shape: any, params: any) => ZodObject;
    oboolean: () => ZodOptional;
    onumber: () => ZodOptional;
    optional: (type: any, params: any) => ZodOptional;
    ostring: () => ZodOptional;
    pipeline: typeof ZodPipeline.create;
    preprocess: (preprocess: any, schema: any, params: any) => ZodEffects;
    promise: (schema: any, params: any) => ZodPromise;
    record: typeof ZodRecord.create;
    set: (valueType: any, params: any) => ZodSet;
    strictObject: (shape: any, params: any) => ZodObject;
    string: (params: any) => ZodString;
    symbol: (params: any) => ZodSymbol;
    transformer: (schema: any, effect: any, params: any) => ZodEffects;
    tuple: (schemas: any, params: any) => ZodTuple;
    undefined: (params: any) => ZodUndefined;
    union: (types: any, params: any) => ZodUnion;
    unknown: (params: any) => ZodUnknown;
    void: (params: any) => ZodVoid;
    NEVER: Readonly<{
        status: "aborted";
    }>;
    ZodIssueCode: any;
    quotelessJson: (obj: any) => string;
    ZodError: typeof ZodError;
}>;
declare function nanType(params: any): ZodNaN;
declare function nativeEnumType(values: any, params: any): ZodNativeEnum;
export const NEVER: Readonly<{
    status: "aborted";
}>;
declare function neverType(params: any): ZodNever;
declare function nullableType(type: any, params: any): ZodNullable;
declare function nullType(params: any): ZodNull;
declare function numberType(params: any): ZodNumber;
declare function objectType(shape: any, params: any): ZodObject;
export var objectUtil: any;
export function oboolean(): ZodOptional;
export function OK(value: any): {
    status: string;
    value: any;
};
export function onumber(): ZodOptional;
declare function optionalType(type: any, params: any): ZodOptional;
export function ostring(): ZodOptional;
export class ParseStatus {
    static mergeArray(status: any, results: any): Readonly<{
        status: "aborted";
    }> | {
        status: any;
        value: any[];
    };
    static mergeObjectAsync(status: any, pairs: any): Promise<Readonly<{
        status: "aborted";
    }> | {
        status: any;
        value: {};
    }>;
    static mergeObjectSync(status: any, pairs: any): Readonly<{
        status: "aborted";
    }> | {
        status: any;
        value: {};
    };
    value: string;
    dirty(): void;
    abort(): void;
}
declare function pipelineType(a: any, b: any): ZodPipeline;
declare function preprocessType(preprocess: any, schema: any, params: any): ZodEffects;
declare function promiseType(schema: any, params: any): ZodPromise;
export function quotelessJson(obj: any): string;
declare function recordType(first: any, second: any, third: any): ZodRecord;
export function setErrorMap(map: any): void;
declare function setType(valueType: any, params: any): ZodSet;
declare function strictObjectType(shape: any, params: any): ZodObject;
declare function stringType(params: any): ZodString;
declare function symbolType(params: any): ZodSymbol;
declare function tupleType(schemas: any, params: any): ZodTuple;
declare function undefinedType(params: any): ZodUndefined;
declare function unionType(types: any, params: any): ZodUnion;
declare function unknownType(params: any): ZodUnknown;
export var util: any;
declare function voidType(params: any): ZodVoid;
export class ZodAny extends ZodType {
    constructor(...args: any[]);
    _any: boolean;
    _parse(input: any): {
        status: string;
        value: any;
    };
}
export namespace ZodAny {
    function create(params: any): ZodAny;
}
export class ZodArray extends ZodType {
    _parse(input: any): Readonly<{
        status: "aborted";
    }> | {
        status: any;
        value: any[];
    } | Promise<Readonly<{
        status: "aborted";
    }> | {
        status: any;
        value: any[];
    }>;
    get element(): any;
    min(minLength: any, message: any): ZodArray;
    max(maxLength: any, message: any): ZodArray;
    length(len: any, message: any): ZodArray;
    nonempty(message: any): ZodArray;
}
export namespace ZodArray {
    function create(schema: any, params: any): ZodArray;
}
export class ZodBigInt extends ZodType {
    _parse(input: any): Readonly<{
        status: "aborted";
    }> | {
        status: string;
        value: any;
    };
}
export namespace ZodBigInt {
    function create(params: any): ZodBigInt;
}
export class ZodBoolean extends ZodType {
    _parse(input: any): Readonly<{
        status: "aborted";
    }> | {
        status: string;
        value: any;
    };
}
export namespace ZodBoolean {
    function create(params: any): ZodBoolean;
}
export class ZodBranded extends ZodType {
    _parse(input: any): any;
    unwrap(): any;
}
export class ZodCatch extends ZodType {
    _parse(input: any): any;
    removeDefault(): any;
}
export namespace ZodCatch {
    function create(type: any, params: any): ZodCatch;
}
export class ZodDate extends ZodType {
    _parse(input: any): Readonly<{
        status: "aborted";
    }> | {
        status: string;
        value: Date;
    };
    _addCheck(check: any): ZodDate;
    min(minDate: any, message: any): ZodDate;
    max(maxDate: any, message: any): ZodDate;
    get minDate(): Date | null;
    get maxDate(): Date | null;
}
export namespace ZodDate {
    function create(params: any): ZodDate;
}
export class ZodDefault extends ZodType {
    _parse(input: any): any;
    removeDefault(): any;
}
export namespace ZodDefault {
    function create(type: any, params: any): ZodDefault;
}
export class ZodDiscriminatedUnion extends ZodType {
    /**
     * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
     * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
     * have a different value for each object in the union.
     * @param discriminator the name of the discriminator property
     * @param types an array of object schemas
     * @param params
     */
    static create(discriminator: any, options: any, params: any): ZodDiscriminatedUnion;
    _parse(input: any): any;
    get discriminator(): any;
    get options(): any;
    get optionsMap(): any;
}
export class ZodEffects extends ZodType {
    innerType(): any;
    sourceType(): any;
    _parse(input: any): any;
}
export namespace ZodEffects {
    function create(schema: any, effect: any, params: any): ZodEffects;
    function createWithPreprocess(preprocess: any, schema: any, params: any): ZodEffects;
}
export class ZodEnum extends ZodType {
    _parse(input: any): Readonly<{
        status: "aborted";
    }> | {
        status: string;
        value: any;
    };
    get options(): any;
    get enum(): {};
    get Values(): {};
    get Enum(): {};
}
export namespace ZodEnum {
    export { createZodEnum as create };
}
export class ZodError extends Error {
    constructor(issues: any);
    issues: any;
    addIssue: (sub: any) => void;
    addIssues: (subs?: any[]) => void;
    __proto__: any;
    get errors(): any;
    format(_mapper: any): {
        _errors: never[];
    };
    get message(): string;
    get isEmpty(): boolean;
    flatten(mapper?: (issue: any) => any): {
        formErrors: any[];
        fieldErrors: {};
    };
    get formErrors(): {
        formErrors: any[];
        fieldErrors: {};
    };
}
export namespace ZodError {
    function create(issues: any): ZodError;
}
export var ZodFirstPartyTypeKind: any;
export class ZodFunction extends ZodType {
    static create(args: any, returns: any, params: any): ZodFunction;
    constructor(...args: any[]);
    validate: (func: any) => any;
    _parse(input: any): Readonly<{
        status: "aborted";
    }> | {
        status: string;
        value: any;
    };
    parameters(): any;
    returnType(): any;
    args(...items: any[]): ZodFunction;
    returns(returnType: any): ZodFunction;
    implement(func: any): any;
    strictImplement(func: any): any;
}
export class ZodIntersection extends ZodType {
    _parse(input: any): Readonly<{
        status: "aborted";
    }> | {
        status: string;
        value: any;
    } | Promise<Readonly<{
        status: "aborted";
    }> | {
        status: string;
        value: any;
    }>;
}
export namespace ZodIntersection {
    function create(left: any, right: any, params: any): ZodIntersection;
}
export const ZodIssueCode: any;
export class ZodLazy extends ZodType {
    get schema(): any;
    _parse(input: any): any;
}
export namespace ZodLazy {
    function create(getter: any, params: any): ZodLazy;
}
export class ZodLiteral extends ZodType {
    _parse(input: any): Readonly<{
        status: "aborted";
    }> | {
        status: string;
        value: any;
    };
    get value(): any;
}
export namespace ZodLiteral {
    function create(value: any, params: any): ZodLiteral;
}
export class ZodMap extends ZodType {
    _parse(input: any): Readonly<{
        status: "aborted";
    }> | Promise<Readonly<{
        status: "aborted";
    }> | {
        status: string;
        value: Map<any, any>;
    }> | {
        status: string;
        value: Map<any, any>;
    };
}
export namespace ZodMap {
    function create(keyType: any, valueType: any, params: any): ZodMap;
}
export class ZodNaN extends ZodType {
    _parse(input: any): Readonly<{
        status: "aborted";
    }> | {
        status: string;
        value: any;
    };
}
export namespace ZodNaN {
    function create(params: any): ZodNaN;
}
export class ZodNativeEnum extends ZodType {
    _parse(input: any): Readonly<{
        status: "aborted";
    }> | {
        status: string;
        value: any;
    };
    get enum(): any;
}
export namespace ZodNativeEnum {
    function create(values: any, params: any): ZodNativeEnum;
}
export class ZodNever extends ZodType {
    _parse(input: any): Readonly<{
        status: "aborted";
    }>;
}
export namespace ZodNever {
    function create(params: any): ZodNever;
}
export class ZodNull extends ZodType {
    _parse(input: any): Readonly<{
        status: "aborted";
    }> | {
        status: string;
        value: any;
    };
}
export namespace ZodNull {
    function create(params: any): ZodNull;
}
export class ZodNullable extends ZodType {
    _parse(input: any): any;
    unwrap(): any;
}
export namespace ZodNullable {
    function create(type: any, params: any): ZodNullable;
}
export class ZodNumber extends ZodType {
    constructor(...args: any[]);
    min: (value: any, message: any) => ZodNumber;
    max: (value: any, message: any) => ZodNumber;
    step: (value: any, message: any) => ZodNumber;
    _parse(input: any): Readonly<{
        status: "aborted";
    }> | {
        status: string;
        value: any;
    };
    gte(value: any, message: any): ZodNumber;
    gt(value: any, message: any): ZodNumber;
    lte(value: any, message: any): ZodNumber;
    lt(value: any, message: any): ZodNumber;
    setLimit(kind: any, value: any, inclusive: any, message: any): ZodNumber;
    _addCheck(check: any): ZodNumber;
    int(message: any): ZodNumber;
    positive(message: any): ZodNumber;
    negative(message: any): ZodNumber;
    nonpositive(message: any): ZodNumber;
    nonnegative(message: any): ZodNumber;
    multipleOf(value: any, message: any): ZodNumber;
    finite(message: any): ZodNumber;
    get minValue(): any;
    get maxValue(): any;
    get isInt(): boolean;
}
export namespace ZodNumber {
    function create(params: any): ZodNumber;
}
export class ZodObject extends ZodType {
    constructor(...args: any[]);
    _cached: {
        shape: any;
        keys: any;
    } | null;
    /**
     * @deprecated In most cases, this is no longer needed - unknown properties are now silently stripped.
     * If you want to pass through unknown properties, use `.passthrough()` instead.
     */
    nonstrict: () => ZodObject;
    augment: (augmentation: any) => ZodObject;
    extend: (augmentation: any) => ZodObject;
    _getCached(): {
        shape: any;
        keys: any;
    };
    _parse(input: any): Readonly<{
        status: "aborted";
    }> | {
        status: any;
        value: {};
    } | Promise<Readonly<{
        status: "aborted";
    }> | {
        status: any;
        value: {};
    }>;
    get shape(): any;
    strict(message: any): ZodObject;
    strip(): ZodObject;
    passthrough(): ZodObject;
    setKey(key: any, schema: any): ZodObject;
    /**
     * Prior to zod@1.0.12 there was a bug in the
     * inferred type of merged objects. Please
     * upgrade if you are experiencing issues.
     */
    merge(merging: any): ZodObject;
    catchall(index: any): ZodObject;
    pick(mask: any): ZodObject;
    omit(mask: any): ZodObject;
    deepPartial(): any;
    partial(mask: any): ZodObject;
    required(mask: any): ZodObject;
    keyof(): ZodEnum;
}
export namespace ZodObject {
    function create(shape: any, params: any): ZodObject;
    function strictCreate(shape: any, params: any): ZodObject;
    function lazycreate(shape: any, params: any): ZodObject;
}
export class ZodOptional extends ZodType {
    _parse(input: any): any;
    unwrap(): any;
}
export namespace ZodOptional {
    function create(type: any, params: any): ZodOptional;
}
export const ZodParsedType: any;
export class ZodPipeline extends ZodType {
    static create(a: any, b: any): ZodPipeline;
    _parse(input: any): any;
}
export class ZodPromise extends ZodType {
    _parse(input: any): Readonly<{
        status: "aborted";
    }> | {
        status: string;
        value: any;
    };
}
export namespace ZodPromise {
    function create(schema: any, params: any): ZodPromise;
}
export class ZodRecord extends ZodType {
    static create(first: any, second: any, third: any): ZodRecord;
    get keySchema(): any;
    get valueSchema(): any;
    _parse(input: any): Readonly<{
        status: "aborted";
    }> | {
        status: any;
        value: {};
    } | Promise<Readonly<{
        status: "aborted";
    }> | {
        status: any;
        value: {};
    }>;
    get element(): any;
}
export class ZodSet extends ZodType {
    _parse(input: any): Readonly<{
        status: "aborted";
    }> | {
        status: string;
        value: Set<any>;
    } | Promise<Readonly<{
        status: "aborted";
    }> | {
        status: string;
        value: Set<any>;
    }>;
    min(minSize: any, message: any): ZodSet;
    max(maxSize: any, message: any): ZodSet;
    size(size: any, message: any): ZodSet;
    nonempty(message: any): ZodSet;
}
export namespace ZodSet {
    function create(valueType: any, params: any): ZodSet;
}
export class ZodString extends ZodType {
    constructor(...args: any[]);
    _regex: (regex: any, validation: any, message: any) => ZodEffects;
    /**
     * @deprecated Use z.string().min(1) instead.
     * @see {@link ZodString.min}
     */
    nonempty: (message: any) => ZodString;
    trim: () => ZodString;
    _parse(input: any): Readonly<{
        status: "aborted";
    }> | {
        status: string;
        value: any;
    };
    _addCheck(check: any): ZodString;
    email(message: any): ZodString;
    url(message: any): ZodString;
    uuid(message: any): ZodString;
    cuid(message: any): ZodString;
    datetime(options: any): ZodString;
    regex(regex: any, message: any): ZodString;
    startsWith(value: any, message: any): ZodString;
    endsWith(value: any, message: any): ZodString;
    min(minLength: any, message: any): ZodString;
    max(maxLength: any, message: any): ZodString;
    length(len: any, message: any): ZodString;
    isDatetime(): boolean;
    get isEmail(): boolean;
    get isURL(): boolean;
    get isUUID(): boolean;
    get isCUID(): boolean;
    get minLength(): any;
    get maxLength(): any;
}
export namespace ZodString {
    function create(params: any): ZodString;
}
export class ZodSymbol extends ZodType {
    _parse(input: any): Readonly<{
        status: "aborted";
    }> | {
        status: string;
        value: any;
    };
}
export namespace ZodSymbol {
    function create(params: any): ZodSymbol;
}
export class ZodTuple extends ZodType {
    _parse(input: any): Readonly<{
        status: "aborted";
    }> | {
        status: any;
        value: any[];
    } | Promise<Readonly<{
        status: "aborted";
    }> | {
        status: any;
        value: any[];
    }>;
    get items(): any;
    rest(rest: any): ZodTuple;
}
export namespace ZodTuple {
    function create(schemas: any, params: any): ZodTuple;
}
export class ZodType {
    constructor(def: any);
    /** Alias of safeParseAsync */
    spa: (data: any, params: any) => Promise<{
        success: boolean;
        data: any;
        error?: never;
    } | {
        success: boolean;
        error: ZodError;
        data?: never;
    }>;
    _def: any;
    parse(data: any, params: any): any;
    safeParse(data: any, params: any): {
        success: boolean;
        data: any;
        error?: never;
    } | {
        success: boolean;
        error: ZodError;
        data?: never;
    };
    parseAsync(data: any, params: any): Promise<any>;
    safeParseAsync(data: any, params: any): Promise<{
        success: boolean;
        data: any;
        error?: never;
    } | {
        success: boolean;
        error: ZodError;
        data?: never;
    }>;
    refine(check: any, message: any): ZodEffects;
    refinement(check: any, refinementData: any): ZodEffects;
    superRefine(refinement: any): ZodEffects;
    optional(): ZodOptional;
    nullable(): ZodNullable;
    nullish(): ZodNullable;
    array(): ZodArray;
    promise(): ZodPromise;
    or(option: any): ZodUnion;
    and(incoming: any): ZodIntersection;
    transform(transform: any): ZodEffects;
    brand(): ZodBranded;
    default(def: any): ZodDefault;
    catch(def: any): ZodCatch;
    describe(description: any): any;
    pipe(target: any): ZodPipeline;
    isNullable(): boolean;
    isOptional(): boolean;
    get description(): any;
    _getType(input: any): any;
    _getOrReturnCtx(input: any, ctx: any): any;
    _processInputParams(input: any): {
        status: ParseStatus;
        ctx: {
            common: any;
            data: any;
            parsedType: any;
            schemaErrorMap: any;
            path: any;
            parent: any;
        };
    };
    _parseSync(input: any): any;
    _parseAsync(input: any): Promise<any>;
    _refinement(refinement: any): ZodEffects;
}
export class ZodUndefined extends ZodType {
    _parse(input: any): Readonly<{
        status: "aborted";
    }> | {
        status: string;
        value: any;
    };
}
export namespace ZodUndefined {
    function create(params: any): ZodUndefined;
}
export class ZodUnion extends ZodType {
    _parse(input: any): any;
    get options(): any;
}
export namespace ZodUnion {
    function create(types: any, params: any): ZodUnion;
}
export class ZodUnknown extends ZodType {
    constructor(...args: any[]);
    _unknown: boolean;
    _parse(input: any): {
        status: string;
        value: any;
    };
}
export namespace ZodUnknown {
    function create(params: any): ZodUnknown;
}
export class ZodVoid extends ZodType {
    _parse(input: any): Readonly<{
        status: "aborted";
    }> | {
        status: string;
        value: any;
    };
}
export namespace ZodVoid {
    function create(params: any): ZodVoid;
}
declare function createZodEnum(values: any, params: any): ZodEnum;
export { anyType as any, arrayType as array, bigIntType as bigint, booleanType as boolean, dateType as date, discriminatedUnionType as discriminatedUnion, effectsType as effect, effectsType as transformer, enumType as enum, _enum as enum, errorMap as defaultErrorMap, functionType as function, _function as function, instanceOfType as instanceof, _instanceof as instanceof, intersectionType as intersection, lazyType as lazy, literalType as literal, mapType as map, mod as default, mod as z, nanType as nan, nativeEnumType as nativeEnum, neverType as never, nullableType as nullable, nullType as null, _null as null, numberType as number, objectType as object, optionalType as optional, pipelineType as pipeline, preprocessType as preprocess, promiseType as promise, recordType as record, setType as set, strictObjectType as strictObject, stringType as string, symbolType as symbol, tupleType as tuple, undefinedType as undefined, unionType as union, unknownType as unknown, voidType as void, _void as void, ZodEffects as ZodTransformer, ZodType as Schema, ZodType as ZodSchema };
//# sourceMappingURL=index.d.mts.map