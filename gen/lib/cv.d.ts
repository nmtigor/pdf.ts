/** 80**************************************************************************
 * @module lib/cv
 * @license Apache-2.0
 ******************************************************************************/
import type { CSSStyle } from "./alias.js";
import { $vuu } from "./symbols.js";
import type { ReportedError } from "./util/trace.js";
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
 * Wrapper of DOM\
 * Vuu ⊆ Coo
 */
export declare abstract class Vuu<C extends Coo = Coo, E extends Element = Element> {
    protected coo$: C;
    get coo(): C;
    protected el$: E;
    get el(): E;
    /**
     * ! If any, not call in the `constructor()`
     */
    protected observeTheme$?(): void;
    protected unobserveTheme$?(): void;
    /**
     * @headconst @param coo_x
     * @headconst @param el_x
     */
    constructor(coo_x: C, el_x: E);
    get parentVuu_1(): Vuu | undefined;
    /**
     * @headconst @param node_x
     */
    static of(node_x: Node): Vuu | undefined;
    /**
     * @deprecated
     * @headconst @param ret_x
     * @headconst @param refvuu_x
     */
    attachBefore<V extends Vuu<C>>(ret_x: V, refvuu_x?: Vuu): V;
    /**
     * @deprecated
     * @headconst @param ret_x
     */
    detach<V extends Vuu<C>>(ret_x: V): V;
    on<E extends EventName>(type: E, listener: EventHandler<E>, options?: AddEventListenerOptions | boolean): void;
    off<E extends EventName>(type: E, listener: EventHandler<E>, options?: EventListenerOptions | boolean): void;
    assignAttro(attr_o: Record<string, string | number>): this;
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
export type ViewBox = `${number} ${number} ${number} ${number}`;
export declare class SVGViewbox<CI extends CooInterface = CooInterface> extends SVGVCo<CI, SVGSVGElement> {
    /**
     * @headconst @param coo_x
     * @const @param viewBox_x
     */
    constructor(viewBox_x?: ViewBox);
}
export {};
//# sourceMappingURL=cv.d.ts.map