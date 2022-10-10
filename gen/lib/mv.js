/*80****************************************************************************
 * mv
 * -- */
import { INOUT } from "../global.js";
import { svg } from "./dom.js";
import { mix } from "./jslang.js";
import { $Vuu, $vuu } from "./symbols.js";
import { assert } from "./util/trace.js";
/**
 * Access rule like scope:
 * Only has access to sibling or child Coo's through `ci`.
 * Child Coo accessing parent Coo has no such restriction.
 */
export class Coo {
}
/**
 * Wrapper of DOM.
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
        this.el$[$Vuu] = Vuu;
    }
    get parentVuu1() {
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
     * @headconst @param ret_x
     * @headconst @param refvuu
     */
    attachBefore(ret_x, refvuu) {
        if (refvuu) {
            this.el$.insertBefore(ret_x.el$, refvuu.el$);
        }
        else {
            this.el$.append(ret_x.el$);
        }
        return ret_x;
    }
    /**
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
    // /**
    //  * @deprecated - Use `this.el$.attr = 123;` directly
    //  */
    // attr( ...args ) { this.el$.setAttribute( ...args ); }
    // on< EN extends keyof GlobalEventHandlersEventMap >( type:EN,
    //   listener:MyEventListener< GlobalEventHandlersEventMap[EN] >
    //          | MyEventListenerObject< GlobalEventHandlersEventMap[EN] >
    //          | null,
    //   options?:boolean | AddEventListenerOptions
    // ) {
    //   this.el$.on( type, <EventListenerOrEventListenerObject|null>listener, options );
    // }
    on(...args) {
        this.el$.on(...args);
    }
    off(...args) {
        this.el$.off(...args);
    }
}
// Vuu.def = "def";
export class HTMLVuu extends Vuu {
}
export class SVGVuu extends Vuu {
}
export class HTMLVCo extends mix(HTMLVuu, Coo) {
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
// console.log( VCoo );
// console.log( VCoo.def );
// console.log( VCoo.abc );
// let vcoo = new VCoo();
// vcoo.Coofn1111111();
// console.log( vcoo instanceof Vuu ); // true
// console.log( vcoo instanceof Coo1 ); // false
// console.log( vcoo instanceof Coo ); // false
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
class MooHandlerDB {
    #eq;
    #_a = [];
    get len_$() {
        return this.#_a.length;
    }
    get empty() {
        return this.#_a.length === 0;
    }
    #nforce = 0;
    get force() {
        return this.#nforce > 0;
    }
    /**
     * @headconst @param eq_x
     */
    constructor(eq_x) {
        this.#eq = eq_x;
    }
    /**
     * @headconst @param handler_x
     * @headconst @param match_newval_x
     * @headconst @param match_oldval_x
     * @const @param force_x
     * @const @param index_x
     * @return `true` if added, `false` if not.
     */
    add(handler_x, match_newval_x, match_oldval_x, force_x = false, index_x = 0) {
        if (this.#_a.some((_) => _.handler === handler_x))
            return false;
        if (force_x)
            ++this.#nforce;
        let i = this.#_a.findIndex((ext_y) => index_x < ext_y.index);
        if (i < 0)
            i = this.#_a.length;
        this.#_a.splice(i, 0, {
            handler: handler_x,
            match_newval: match_newval_x,
            match_oldval: match_oldval_x,
            force: force_x,
            index: index_x,
        });
        this.#got.length = 0; //!
        return true;
    }
    /**
     * @primaryconst
     * Not `@const` because `#eq()` could cause non-primary changes, which happens
     * in elements of `#_a`.
     */
    #strict_eq(v0_x, v1_x) {
        return v0_x === undefined && v1_x === undefined ||
            v0_x !== undefined && v1_x !== undefined && this.#eq(v0_x, v1_x);
    }
    /**
     * @headconst @param handler_x
     * @headconst @param match_newval_x
     * @headconst @param match_oldval_x
     * @return `true` if deleted, `false` if not
     */
    del(handler_x, match_newval_x, match_oldval_x) {
        const i = this.#_a.findIndex((ext) => ext.handler === handler_x);
        if (i < 0)
            return false;
        const toDel = this.#_a[i];
        const del_ = this.#strict_eq(toDel.match_newval, match_newval_x) &&
            this.#strict_eq(toDel.match_oldval, match_oldval_x);
        if (del_) {
            if (toDel.force)
                --this.#nforce;
            this.#_a.splice(i, 1);
            this.#got.length = 0; //!
        }
        return del_;
    }
    /** @primaryconst */
    #match(v0_x, v1_x) {
        return v0_x === undefined || this.#eq(v0_x, v1_x);
    }
    #newval;
    #oldval;
    #gforce;
    #got = [];
    get(newval_x, oldval_x, gforce_x) {
        if (this.#newval !== undefined && this.#eq(this.#newval, newval_x) &&
            this.#oldval !== undefined && this.#eq(this.#oldval, oldval_x) &&
            this.#gforce === gforce_x) {
            return this.#got;
        }
        this.#newval = newval_x;
        this.#oldval = oldval_x;
        this.#gforce = gforce_x;
        this.#got.length = 0;
        const changed_ = !this.#eq(newval_x, oldval_x);
        this.#_a.forEach((ext) => {
            if (this.#match(ext.match_newval, newval_x) &&
                this.#match(ext.match_oldval, oldval_x) &&
                (changed_ || gforce_x || ext.force)) {
                this.#got.push(ext.handler);
            }
        });
        return this.#got;
    }
    clear() {
        this.#_a.length = 0;
        this.#got.length = 0;
        this.#nforce = 0;
    }
}
export class Moo {
    #initval;
    #eq;
    #force;
    #val;
    get val() {
        return this.#val;
    }
    #newval;
    get newval() {
        return this.#newval;
    }
    // #handler_db = new Set< MooHandler<T> >();
    #handler_db;
    get _len() {
        return this.#handler_db.len_$;
    }
    #forceOnce = false;
    set forceOnce(force) {
        this.#forceOnce = force;
    }
    force() {
        this.#forceOnce = true;
        return this;
    }
    get #forced() {
        return this.#force || this.#forceOnce;
    }
    #data;
    set data(data_x) {
        // // #if INOUT
        //   assert( this.#data === undefined );
        // // #endif
        this.#data = data_x;
    }
    /**
     * @headconst @param val_x
     * @headconst @param eq_x
     * @const @param force
     */
    constructor(val_x, eq_x = (a, b) => a === b, force_x) {
        this.#initval = val_x;
        this.#eq = eq_x;
        this.#force = force_x === undefined ? false : true;
        this.reset();
    }
    /**
     * Without invoking any callbacks.
     */
    set(val) {
        this.#val = this.#newval = val;
    }
    reset() {
        this.set(this.#initval);
        if (!this.#handler_db?.empty) {
            this.#handler_db = new MooHandlerDB(this.#eq);
        }
        //! Not `#handler_db.clear()` because `#handler_db` could be shared.
        // if( !this.#handler_db ) this.#handler_db = new MooHandlerDB( this.#eq );
        // this.#handler_db.clear();
        this.#forceOnce = this.#force;
        return this;
    }
    /** @final */
    registHandler(handler_x, match_newval_x, match_oldval_x, force_x, index_x = 0) {
        this.#handler_db.add(handler_x, match_newval_x, match_oldval_x, force_x !== undefined, index_x);
        // console.log( `this.#handler_db.size=${this.#handler_db.size}` );
    }
    /** @final */
    removeHandler(handler_x, match_newval_x, match_oldval_x) {
        this.#handler_db.del(handler_x, match_newval_x, match_oldval_x);
        // console.log( `this.#handler_db.size=${this.#handler_db.size}` );
    }
    /** @final */
    registOnceHandler(handler_x, match_newval_x, match_oldval_x, force_x, index_x = 0) {
        const wrap_ = (newval_y, oldval_y, data_y) => {
            handler_x(newval_y, oldval_y, data_y);
            this.removeHandler(wrap_, match_newval_x, match_oldval_x);
        };
        this.registHandler(wrap_, match_newval_x, match_oldval_x, force_x, index_x);
    }
    /** @final */
    on(newval_x, handler_x, force_x, index_x = 0) {
        this.registHandler(handler_x, newval_x, undefined, force_x, index_x);
    }
    /** @final */
    off(newval_x, handler_x) {
        this.removeHandler(handler_x, newval_x);
    }
    /** @final */
    once(newval_x, handler_x, force_x, index_x = 0) {
        this.registOnceHandler(handler_x, newval_x, undefined, force_x, index_x);
    }
    set val(val_x) {
        if (this.#eq(val_x, this.#val) &&
            !this.#forced &&
            !this.#handler_db.force) {
            return;
        }
        this.#newval = val_x;
        this.#handler_db.get(val_x, this.#val, this.#forced)
            .forEach((handler_y) => handler_y(val_x, this.#val, this.#data));
        // for( const handler_y of this.#handler_db )
        // {
        //   handler_y( val_x, this.#val, this );
        // }
        this.#val = val_x;
        this.#forceOnce = this.#force;
        this.#data = undefined; // it is used once
        // if( this.once_ ) this.#handler_db.clear();
    }
    refresh() {
        this.force().val = this.#val;
    }
    shareHandlerTo(rhs) {
        /*#static*/ if (INOUT) {
            assert(rhs.#handler_db.empty || rhs.#handler_db === this.#handler_db);
        }
        // console.log( rhs.#handler_db );
        rhs.#handler_db = this.#handler_db;
    }
}
// new Moo(undefined); // error
// new Moo(null); // ok
// new Moo(2); // ok
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=mv.js.map