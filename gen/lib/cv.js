/** 80**************************************************************************
 * @module lib/cv
 * @license Apache-2.0
 ******************************************************************************/
import { svg } from "./dom.js";
import { mix } from "./jslang.js";
import { $vuu } from "./symbols.js";
/**
 * Access rule like scope:
 * Only has access to sibling or child `Coo`'s through `ci`.
 * Child `Coo` accessing parent `Coo` has no such restriction.
 */
export class Coo {
}
/**
 * Wrapper of DOM
 * Vuu ⊆ Coo
 */
export class Vuu {
    coo$;
    get coo() {
        return this.coo$;
    }
    el$;
    get el() {
        return this.el$;
    }
    /**
     * @headconst @param coo_x
     * @headconst @param el_x
     */
    constructor(coo_x, el_x) {
        this.coo$ = coo_x;
        this.el$ = el_x;
        this.el$[$vuu] = this;
        // this.el$[$Vuu] = Vuu;
    }
    get parentVuu_1() {
        let node = this.el$.parentNode;
        while (node && !node[$vuu])
            node = node.parentNode;
        return node?.[$vuu];
    }
    /**
     * @headconst @param node_x
     */
    static of(node_x) {
        let node = node_x;
        while (node && !node[$vuu])
            node = node.parentNode;
        return node?.[$vuu];
    }
    // /**
    //  * @deprecated - use DOM's `append()` directly
    //  * @headconst @param { Vuu } ret_x
    //  * @param { Element } el_x
    //  * @return { Vuu } - return ret_x
    //  */
    // append( ret_x, el_x = this.el )
    // {
    //   el_x.appendChild( ret_x.el );
    //   return ret_x;
    // }
    // /**
    //  * @headconst @param ret_x
    //  * @headconst @param el_x
    //  */
    // prepend<V extends Vuu>( ret_x:V, el_x=this.el$ ):V
    // {
    //   el_x.insertBefore( ret_x.el$, el_x.firstChild );
    //   return ret_x;
    // }
    /**
     * @deprecated
     * @headconst @param ret_x
     * @headconst @param refvuu_x
     */
    attachBefore(ret_x, refvuu_x) {
        if (refvuu_x) {
            this.el$.insertBefore(ret_x.el$, refvuu_x.el$);
        }
        else {
            this.el$.append(ret_x.el$);
        }
        return ret_x;
    }
    /**
     * @deprecated
     * @headconst @param ret_x
     */
    detach(ret_x) {
        this.el$.removeChild(ret_x.el$);
        return ret_x;
    }
    // /**
    //  * @param { Vuu } vuu_x
    //  * @return { Boolean }
    //  */
    // attachedTo( vuu_x )
    // {
    //   return vuu_x && this.el$.parentNode === vuu_x.el;
    // }
    on(type, listener, options) {
        return this.el$.on(type, listener, options);
    }
    off(type, listener, options) {
        return this.el$.off(type, listener, options);
    }
    assignAttro(attr_o) {
        this.el$.assignAttro(attr_o);
        return this;
    }
}
// Vuu.def = "def";
export class HTMLVuu extends Vuu {
    // /**
    //  * @headconst @param coo_x
    //  * @headconst @param el_x
    //  */
    // constructor( coo_x:C, el_x:E )
    // {
    //   super( coo_x, el_x );
    // }
    assignStylo(styl_o) {
        this.el$.assignStylo(styl_o);
        return this;
    }
}
export class SVGVuu extends Vuu {
    // /**
    //  * @headconst @param coo_x
    //  * @const @param viewBox_x
    //  */
    // constructor( coo_x:C, el_x:E )
    // {
    //   super( coo_x, el_x );
    // }
    assignStylo(styl_o) {
        this.el$.assignStylo(styl_o);
        return this;
    }
}
export class HTMLVCo extends mix(HTMLVuu, Coo) {
    // override coo$: Coo<CI>;
    #ci = Object.create(null);
    /** @implement */
    get ci() {
        return this.#ci;
    }
    /**
     * @headconst @param el_x
     */
    constructor(el_x) {
        super(undefined, el_x);
        this.coo$ = this;
    }
}
export class SVGVCo extends mix(SVGVuu, Coo) {
    #ci = Object.create(null);
    /** @implement */
    get ci() {
        return this.#ci;
    }
    /**
     * @headconst @param el_x
     */
    constructor(el_x) {
        super(undefined, el_x);
        this.coo$ = this;
    }
}
export class SVGViewbox extends SVGVCo {
    /**
     * @headconst @param coo_x
     * @const @param viewBox_x
     */
    constructor(viewBox_x = "0 0 100 100") {
        super(svg("svg"));
        this.el$.setAttribute("viewBox", viewBox_x);
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=cv.js.map