import { AbstractConstructor } from "./alias.js";
import { $Vuu, $vuu } from "./symbols.js";
import { type ReportedError } from "./util/trace.js";
/**
 * Inwards API, i.e., API called from outside of `Coo`.
 */
export interface CooInterface {
    reportError?: (error: unknown) => void | Promise<void>;
}
/**
 * Access rule like scope:
 * Only has access to sibling or child Coo's through `ci`.
 * Child Coo accessing parent Coo has no such restriction.
 */
export declare abstract class Coo<CI extends CooInterface = CooInterface> {
    abstract get ci(): CI;
    getParentCoo?<PC extends Coo>(): PC;
}
declare global {
    interface Node {
        [$vuu]?: Vuu;
        [$Vuu]?: AbstractConstructor<Vuu>;
    }
}
/**
 * Wrapper of DOM.
 * Vuu ⊆ Coo
 */
export declare abstract class Vuu<C extends Coo = Coo, E extends Element = Element> {
    protected coo$: C;
    get coo(): C;
    protected el$: E;
    get el(): E;
    /**
     * @headconst @param coo_x
     * @headconst @param el_x
     */
    constructor(coo_x: C, el_x: E);
    get parentVuu1(): Vuu | undefined;
    /**
     * @headconst @param node_x
     */
    static of(node_x: Node): Vuu | undefined;
    /**
     * @headconst @param ret_x
     * @headconst @param refvuu
     */
    attachBefore<V extends Vuu<C>>(ret_x: V, refvuu?: Vuu): V;
    /**
     * @headconst @param ret_x
     */
    detach<V extends Vuu<C>>(ret_x: V): V;
    on(...args: [string, any, any?]): void;
    off(...args: [string, any, any?]): void;
}
export declare class HTMLVuu<C extends Coo = Coo, E extends HTMLElement = HTMLElement> extends Vuu<C, E> {
}
export declare class SVGVuu<C extends Coo = Coo, E extends SVGElement = SVGElement> extends Vuu<C, E> {
}
/**
 * It is a `Coo` functionally.
 */
export interface HTMLVCo<CI extends CooInterface = CooInterface, E extends HTMLElement = HTMLElement> extends HTMLVuu<Coo<CI>, E>, Coo<CI> {
}
declare const HTMLVCo_base: AbstractConstructor<object>;
export declare abstract class HTMLVCo<CI extends CooInterface, E extends HTMLElement> extends HTMLVCo_base {
    #private;
    /** @implement */
    get ci(): CI;
    /**
     * @headconst @param el_x
     */
    constructor(el_x: E);
    showReportedError?(re_x: ReportedError): void;
}
/**
 * It is a Coo functionally.
 */
export interface SVGVCo<CI extends CooInterface = CooInterface, E extends SVGElement = SVGElement> extends SVGVuu<Coo<CI>, E>, Coo<CI> {
}
declare const SVGVCo_base: AbstractConstructor<object>;
export declare abstract class SVGVCo<CI extends CooInterface, E extends SVGElement> extends SVGVCo_base {
    #private;
    /** @implement */
    get ci(): CI;
    /**
     * @headconst @param el_x
     */
    constructor(el_x: E);
}
export declare class SVGViewbox<CI extends CooInterface = CooInterface> extends SVGVCo<CI> {
    /**
     * @headconst @param coo_x
     * @const @param viewBox_x
     */
    constructor(viewBox_x?: string);
}
export type MooEq<T extends {} | null> = (a: T, b: T) => boolean;
export type MooHandler<T extends {} | null, D = any> = (newval: T, oldval?: T, data?: D) => void;
export declare class Moo<T extends {} | null, D = any> {
    #private;
    get val(): T;
    get newval(): T;
    get _len(): number;
    set forceOnce(force: boolean);
    force(): this;
    set data(data_x: D);
    /**
     * @headconst @param val_x
     * @headconst @param eq_x
     * @const @param force
     */
    constructor(val_x: T, eq_x?: (a: T, b: T) => boolean, force_x?: "force");
    /**
     * Without invoking any callbacks.
     */
    set(val: T): void;
    reset(): this;
    /** @final */
    registHandler(handler_x: MooHandler<T, D>, match_newval_x?: T, match_oldval_x?: T, force_x?: "force", index_x?: number): void;
    /** @final */
    removeHandler(handler_x: MooHandler<T, D>, match_newval_x?: T, match_oldval_x?: T): void;
    /** @final */
    registOnceHandler(handler_x: MooHandler<T, D>, match_newval_x?: T, match_oldval_x?: T, force_x?: "force", index_x?: number): void;
    /** @final */
    on(newval_x: T, handler_x: MooHandler<T, D>, force_x?: "force", index_x?: number): void;
    /** @final */
    off(newval_x: T, handler_x: MooHandler<T, D>): void;
    /** @final */
    once(newval_x: T, handler_x: MooHandler<T, D>, force_x?: "force", index_x?: number): void;
    set val(val_x: T);
    refresh(): void;
    shareHandlerTo(rhs: Moo<T, D>): void;
}
export {};
//# sourceMappingURL=mv.d.ts.map