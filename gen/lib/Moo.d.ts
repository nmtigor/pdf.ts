/** 80**************************************************************************
 * @module lib/Moo
 * @license Apache-2.0
 ******************************************************************************/
import type { int, Runr as IRunr } from "./alias.js";
export type MooEq<T extends {} | null> = (a: T, b: T) => boolean;
export type MooHandler<T extends {} | null, D = any> = (newval: T, oldval: T, data?: D) => void;
type MooCtorP_<T extends {} | null> = {
    val: T;
    eq_?: MooEq<T>;
    active?: boolean;
    forcing?: boolean;
    _name?: string;
};
export declare const frstCb_i = -100;
export declare const lastCb_i = 100;
type RegistHandlerO_<T extends {} | null> = {
    /** Match new value */
    n?: T | undefined;
    /** Match old value */
    o?: T | undefined;
    /** Forcing or not */
    f?: boolean | undefined;
    /** Inddex [frstCb_i, lastCb_i] */
    i?: int;
};
type RemoveHandlerO_<T extends {} | null> = {
    /** Match new value */
    n?: T | undefined;
    /** Match old value */
    o?: T | undefined;
};
type OnO_ = {
    /** Forcing or not */
    f?: boolean | undefined;
    /** Inddex [frstCb_i, lastCb_i] */
    i?: int;
};
/**
 * `Moo` instance concerns about one value, whether it changes or not.\
 * `Moo` instance stores many callbacks.
 */
export declare class Moo<T extends {} | null, D = any> {
    #private;
    readonly id: number;
    readonly name: string | undefined;
    get val(): T;
    get newval(): T;
    get nCb(): number;
    set forceOnce(forcing_x: boolean);
    force(): this;
    set data(data_x: D);
    setData(data_x: D): this;
    constructor({ val, eq_, active, forcing, _name, }: MooCtorP_<T>);
    /**
     * Not invoking any callbacks
     */
    set(val: T): this;
    /** @final */
    reset(): this;
    /**
     * Small index callbacks will be called first
     * Same index callbacks will be called by adding order
     * @final
     */
    registHandler(h_x: MooHandler<T, D>, { n, o, f, i }?: RegistHandlerO_<T>): void;
    /** @final */
    removeHandler(h_x: MooHandler<T, D>, { n, o }?: RemoveHandlerO_<T>): void;
    /**
     * @final
     * @headconst @param h_x
     * @h2ndconst @param o_x
     */
    registOnceHandler(h_x: MooHandler<T, D>, o_x?: RegistHandlerO_<T>): void;
    /**
     * Force `match_n_x`, ignore `match_o_x`
     * @final
     */
    on(n_x: T, h_x: MooHandler<T, D>, { f, i }?: OnO_): void;
    /**
     * Force `match_n_x`, ignore `match_o_x`
     * @final
     */
    off(n_x: T, h_x: MooHandler<T, D>): void;
    /**
     * Force `match_n_x`, ignore `match_o_x`
     * @final
     */
    once(n_x: T, h_x: MooHandler<T, D>, { f, i }?: OnO_): void;
    static _count: number;
    set val(n_x: T);
    refresh(): void;
    shareHandlerTo(rhs: Moo<T, D>): void;
}
/** @final */
export declare class Runr<D = any> implements IRunr {
    #private;
    set data(data_x: D);
    add(_x: (n_y: boolean, o_y: boolean, d_y?: D) => void): void;
    del(_x: (n_y: boolean, o_y: boolean, d_y?: D) => void): void;
    /** @implement */
    run(): void;
}
/** @final */
export declare class Boor<D = any> {
    #private;
    get val(): boolean;
    force(): this;
    set val(_x: boolean);
    tru(): void;
    fos(): void;
    set data(data_x: D);
    constructor(forcing_x?: boolean);
    onTru(_x: (n_y: boolean, o_y: boolean, d_y?: D) => void): void;
    offTru(_x: (n_y: boolean, o_y: boolean, d_y?: D) => void): void;
    onFos(_x: (n_y: boolean, o_y: boolean, d_y?: D) => void): void;
    offFos(_x: (n_y: boolean, o_y: boolean, d_y?: D) => void): void;
}
export {};
//# sourceMappingURL=Moo.d.ts.map