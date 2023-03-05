/** 80**************************************************************************
 * @module lib/mv
 * @license Apache-2.0
 ******************************************************************************/
import { CSSStyle } from "./alias.js";
import { $vuu } from "./symbols.js";
import { type ReportedError } from "./util/trace.js";
/**
 * Inwards API, i.e., API called from outside of `Coo`.
 */
export interface CooInterface {
    reportError?(error: unknown): void | Promise<void>;
}
/**
 * Access rule like scope:
 * Only has access to sibling or child `Coo`'s through `ci`.
 * Child `Coo` accessing parent `Coo` has no such restriction.
 */
export declare abstract class Coo<CI extends CooInterface = CooInterface> {
    abstract get ci(): CI;
    getParentCoo?<PC extends Coo>(): PC;
}
declare global {
    interface Node {
        [$vuu]?: Vuu;
    }
}
/**
 * Wrapper of DOM
 * Vuu ⊆ Coo
 */
export declare abstract class Vuu<C extends Coo = Coo, E extends Element = Element> {
    protected coo$: C;
    get coo(): C;
    protected el$: E;
    get el(): E;
    protected observeTheme$?(): void;
    protected unobserveTheme$?(): void;
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
    on<E extends EventName>(type: E, listener: EventHandler<E>, options?: AddEventListenerOptions | boolean): void;
    off<E extends EventName>(type: E, listener: EventHandler<E>, options?: EventListenerOptions | boolean): void;
    assignAttro(attr_o: Record<string, string | number>): this;
    set cyName(name_x: string);
}
export declare class HTMLVuu<C extends Coo = Coo, E extends HTMLElement = HTMLElement> extends Vuu<C, E> {
    assignStylo(styl_o: CSSStyle): this;
}
export declare class SVGVuu<C extends Coo = Coo, E extends SVGElement = SVGElement> extends Vuu<C, E> {
    assignStylo(styl_o: CSSStyle): this;
}
/**
 * It is a `Coo` functionally.
 */
export interface HTMLVCo<CI extends CooInterface = CooInterface, E extends HTMLElement = HTMLElement> extends HTMLVuu<Coo<CI>, E>, Coo<CI> {
}
declare const HTMLVCo_base: any;
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
declare const SVGVCo_base: any;
export declare abstract class SVGVCo<CI extends CooInterface, E extends SVGElement> extends SVGVCo_base {
    #private;
    /** @implement */
    get ci(): CI;
    /**
     * @headconst @param el_x
     */
    constructor(el_x: E);
}
export declare class SVGViewbox<CI extends CooInterface = CooInterface> extends SVGVCo<CI, SVGSVGElement> {
    /**
     * @headconst @param coo_x
     * @const @param viewBox_x
     */
    constructor(viewBox_x?: string);
}
export type MooEq<T extends {} | null> = (a: T, b: T) => boolean;
export type MooHandler<T extends {} | null, D = any> = (newval: T, oldval: T, data?: D) => void;
type MooCtorP_<T extends {} | null> = {
    val: T;
    eq_?: MooEq<T>;
    active?: boolean;
    forcing?: boolean;
    name?: string;
};
/**
 * `Moo` instance concerns about one value, whether it changes or not.
 * `Moo` instance stores many callbacks.
 */
export declare class Moo<T extends {} | null, D = any> {
    #private;
    readonly id: number;
    readonly name: string | undefined;
    get val(): T;
    get newval(): T;
    get _nCb(): number;
    set forceOnce(forcing_x: boolean);
    force(): this;
    set data(data_x: D);
    constructor({ val, eq_, active, forcing, name, }: MooCtorP_<T>);
    /**
     * Not invoking any callbacks
     */
    set(val: T): void;
    /** @final */
    reset(): this;
    /**
     * Small index callbacks will be called first
     * Same index callbacks will be called by adding order
     *
     * @final
     */
    registHandler(handler_x: MooHandler<T, D>, match_newval_x?: T, match_oldval_x?: T, forcing_x?: boolean, index_x?: number): void;
    /** @final */
    removeHandler(handler_x: MooHandler<T, D>, match_newval_x?: T, match_oldval_x?: T): void;
    /** @final */
    registOnceHandler(handler_x: MooHandler<T, D>, match_newval_x?: T, match_oldval_x?: T, forcing_x?: boolean, index_x?: number): void;
    /**
     * Force `match_newval_x`, ignore `match_oldval_x`
     * @final
     */
    on(newval_x: T, handler_x: MooHandler<T, D>, forcing_x?: boolean, index_x?: number): void;
    /**
     * Force `match_newval_x`, ignore `match_oldval_x`
     * @final
     */
    off(newval_x: T, handler_x: MooHandler<T, D>): void;
    /**
     * Force `match_newval_x`, ignore `match_oldval_x`
     * @final
     */
    once(newval_x: T, handler_x: MooHandler<T, D>, forcing_x?: boolean, index_x?: number): void;
    static _count: number;
    set val(newval_x: T);
    refresh(): void;
    shareHandlerTo(rhs: Moo<T, D>): void;
}
export {};
//# sourceMappingURL=mv.d.ts.map