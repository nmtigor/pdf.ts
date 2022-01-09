import { type Constructor } from "./alias.js";
import { $vuu, $Vuu } from "./symbols.js";
import { type ReportedError } from "./util/trace.js";
/**
 * Inwards API, i.e., API called from outside of `Coo`.
 */
export interface CooInterface {
    reportError?: (error: Error) => void | Promise<void>;
}
/**
 * Only has access to other Coo's through `ci`.
 * Notice, a in Coo contained Coo also only has access to other Coo's.
 *
 * @final
 */
export declare abstract class Coo<CI extends CooInterface = CooInterface> {
    abstract get ci(): CI;
}
declare global {
    interface Node {
        [$vuu]?: Vuu;
        [$Vuu]?: Constructor<Vuu>;
    }
}
/**
 * Wrapper of DOM
 */
export declare abstract class Vuu<C extends Coo = Coo, E extends Element = Element> {
    protected coo$: C;
    get coo(): C;
    protected el$: E;
    get el(): E;
    /**
     * @param { headconst } coo_x
     * @param { headconst } el_x
     */
    constructor(coo_x: C, el_x: E);
    get parentvuu1(): Vuu | undefined;
    /**
     * @param { headconst } node_x
     */
    static vuuOf(node_x: Node): Vuu<Coo<CooInterface>, Element> | undefined;
    /**
     * @param { headconst } ret_x
     * @param { headconst } refvuu
     * @param { headconst } el_x
     */
    attachBefore<V extends Vuu<C>>(ret_x: V, refvuu?: Vuu, el_x?: E): V;
    /**
     * @param { headconst } ret_x
     * @param { headconst } el_x
     */
    detach<V extends Vuu<C>>(ret_x: V, el_x?: E): V;
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
export interface HTMLVCoo<CI extends CooInterface = CooInterface, E extends HTMLElement = HTMLElement> extends HTMLVuu<Coo<CI>, E>, Coo<CI> {
}
declare const HTMLVCoo_base: import("./alias.js").AbstractConstructor<object>;
export declare abstract class HTMLVCoo<CI extends CooInterface, E extends HTMLElement> extends HTMLVCoo_base {
    #private;
    /** @implements */
    get ci(): CI;
    /**
     * @param { headconst } el_x
     */
    constructor(el_x: E);
    showReportedError?(re_x: ReportedError): void;
}
/**
 * It is a Coo functionally.
 */
export interface SVGVCoo<CI extends CooInterface = CooInterface, E extends SVGElement = SVGElement> extends SVGVuu<Coo<CI>, E>, Coo<CI> {
}
declare const SVGVCoo_base: import("./alias.js").AbstractConstructor<object>;
export declare abstract class SVGVCoo<CI extends CooInterface, E extends SVGElement> extends SVGVCoo_base {
    #private;
    /** @implements */
    get ci(): CI;
    /**
     * @param { headconst } el_x
     */
    constructor(el_x: E);
}
export declare class SVGViewbox<CI extends CooInterface = CooInterface> extends SVGVCoo<CI> {
    /**
     * @param { headconst } coo_x
     * @param { const } viewBox_x
     */
    constructor(viewBox_x?: string);
}
export declare type MooEq<T> = (a: T, b: T) => boolean;
export declare type MooHandler<T, D = any> = (newval: T, oldval?: T, data?: D) => void;
export declare class Moo<T, D = any> {
    #private;
    get val(): T;
    get newval(): T;
    get _len(): number;
    set data(data_x: D);
    /**
     * @param { headconst } val_x
     * @param { headocnst } eq_x
     * @param { const } force
     */
    constructor(val_x: T, eq_x?: (a: T, b: T) => boolean, force_x?: "force");
    reset(): this;
    /**
     * Without invoking any callbacks.
     */
    set(val: T): void;
    /** @final */
    registHandler(handler_x: MooHandler<T, D>, newval_x?: T, oldval_x?: T, force_x?: "force", index_x?: number): void;
    /** @final */
    removeHandler(handler_x: MooHandler<T, D>, newval_x?: T, oldval_x?: T): void;
    /** @final */
    registOnceHandler(handler_x: MooHandler<T, D>, newval_x?: T, oldval_x?: T, force_x?: "force", index_x?: number): void;
    /** @final */
    on(newval_x: T, handler_x: MooHandler<T, D>, force_x?: "force", index_x?: number): void;
    /** @final */
    off(newval_x: T, handler_x: MooHandler<T, D>): void;
    /** @final */
    once(newval_x: T, handler_x: MooHandler<T, D>, force_x?: "force", index_x?: number): void;
    shareHandlerTo(rhs: Moo<T>): void;
    set forceOnce(force: boolean);
    force(): this;
    refresh(): void;
    set val(val_x: T);
}
export {};
//# sourceMappingURL=mv.d.ts.map