/*81*****************************************************************************
 * mv
 * -- */
import { mix } from "./jslang.js";
import { svg } from "./dom.js";
import { $vuu, $Vuu } from "./symbols.js";
import { assert } from "./util/trace.js";
/**
 * Only has access to other Coo's through `ci`.
 * Notice, a in Coo contained Coo also only has access to other Coo's.
 *
 * @final
 */
export class Coo {
}
/**
 * Wrapper of DOM
 */
export class Vuu {
    coo$;
    get coo() { return this.coo$; }
    el$;
    get el() { return this.el$; }
    ;
    /**
     * @param { headconst } coo_x
     * @param { headconst } el_x
     */
    constructor(coo_x, el_x) {
        this.coo$ = coo_x;
        this.el$ = el_x;
        //jjjj is this not always Vuu? check!
        this.el$[$vuu] = this;
        this.el$[$Vuu] = this.constructor;
    }
    get parentvuu1() {
        let node = this.el$.parentNode;
        while (node && !node[$vuu])
            node = node.parentNode;
        return node ? node[$vuu] : undefined;
    }
    /**
     * @param { headconst } node_x
     */
    static vuuOf(node_x) {
        let node = node_x;
        while (node && !node[$vuu])
            node = node.parentNode;
        return node ? node[$vuu] : undefined;
    }
    // /**
    //  * @deprecated - use DOM's `append()` directly
    //  * @param { headconst Vuu } ret_x
    //  * @param { Element } el_x
    //  * @return { Vuu } - return ret_x
    //  */
    // append( ret_x, el_x = this.el )
    // {
    //   el_x.appendChild( ret_x.el );
    //   return ret_x;
    // }
    // /**
    //  * @param { headconst } ret_x
    //  * @param { headconst } el_x
    //  */
    // prepend<V extends Vuu>( ret_x:V, el_x=this.el$ ):V
    // {
    //   el_x.insertBefore( ret_x.el$, el_x.firstChild );
    //   return ret_x;
    // }
    /**
     * @param { headconst } ret_x
     * @param { headconst } refvuu
     * @param { headconst } el_x
     */
    attachBefore(ret_x, refvuu, el_x = this.el$) {
        if (refvuu)
            el_x.insertBefore(ret_x.el$, refvuu.el$);
        else
            el_x.append(ret_x.el$);
        return ret_x;
    }
    /**
     * @param { headconst } ret_x
     * @param { headconst } el_x
     */
    detach(ret_x, el_x = this.el$) {
        el_x.removeChild(ret_x.el$);
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
    on(...args) { this.el$.on(...args); }
    off(...args) { this.el$.off(...args); }
}
// Vuu.def = "def";
export class HTMLVuu extends Vuu {
}
export class SVGVuu extends Vuu {
}
export class HTMLVCoo extends mix(HTMLVuu, Coo) {
    #ci = Object.create(null);
    /** @implements */
    get ci() { return this.#ci; }
    /**
     * @param { headconst } el_x
     */
    constructor(el_x) {
        super(undefined, el_x);
        this.coo$ = this;
    }
}
export class SVGVCoo extends mix(SVGVuu, Coo) {
    #ci = Object.create(null);
    /** @implements */
    get ci() { return this.#ci; }
    /**
     * @param { headconst } el_x
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
export class SVGViewbox extends SVGVCoo {
    /**
     * @param { headconst } coo_x
     * @param { const } viewBox_x
     */
    constructor(viewBox_x = "0 0 100 100") {
        super(svg("svg"));
        this.el$.setAttribute("viewBox", viewBox_x);
    }
}
class MooHandlerDB {
    #eq;
    #_a = [];
    get empty() { return this.#_a.length === 0; }
    #nforce = 0;
    get force() { return this.#nforce > 0; }
    #newval;
    #oldval;
    #got = [];
    #invalidate_cache = () => { this.#newval = undefined; };
    /**
     * @param { headocnst } eq_x
     */
    constructor(eq_x) {
        this.#eq = eq_x;
    }
    /**
     * @param { headconst } handler_x
     * @param { headconst } newval
     * @param { headconst } oldval
     * @param { const } force
     * @return `true` if added, `false` if not
     */
    add(handler_x, newval, oldval, force = false, index = 0) {
        let ret = true;
        if (this.#_a.some(_ => _.handler === handler_x))
            ret = false;
        if (ret) {
            if (force)
                ++this.#nforce;
            let i = this.#_a.findIndex(ext => index < ext.index);
            if (i < 0)
                i = this.#_a.length;
            this.#_a.splice(i, 0, {
                handler: handler_x,
                newval,
                oldval,
                force,
                index,
            });
            this.#invalidate_cache(); //!
        }
        return ret;
    }
    /**
     * @param { headconst } handler_x
     * @param { headconst } newval
     * @param { headconst } oldval
     * @return `true` if deleted, `false` if not
     */
    del(handler_x, newval, oldval) {
        let ret = true;
        const i = this.#_a.findIndex(ext => ext.handler === handler_x);
        if (i < 0)
            ret = false;
        if (ret && newval !== undefined) {
            if (this.#_a[i].newval === undefined
                || !this.#eq(newval, this.#_a[i].newval))
                ret = false;
        }
        if (ret && oldval !== undefined) {
            if (this.#_a[i].oldval === undefined
                || !this.#eq(oldval, this.#_a[i].oldval))
                ret = false;
        }
        if (ret) {
            if (this.#_a[i].force)
                --this.#nforce;
            this.#_a.splice(i, 1);
            this.#invalidate_cache(); //!
        }
        return ret;
    }
    get(newval, oldval, gforce) {
        if (this.#newval !== undefined && this.#eq(newval, this.#newval)
            && this.#oldval !== undefined && this.#eq(oldval, this.#oldval))
            return this.#got;
        const nochange = this.#eq(newval, oldval);
        this.#got.length = 0;
        this.#_a.forEach(ext => {
            let got_ = true;
            if (ext.newval !== undefined
                && !this.#eq(newval, ext.newval))
                got_ = false;
            if (got_
                && ext.oldval !== undefined
                && !this.#eq(oldval, ext.oldval))
                got_ = false;
            if (got_
                && !(gforce || ext.force) && nochange)
                got_ = false;
            if (got_)
                this.#got.push(ext.handler);
        });
        return this.#got;
    }
    clear() {
        this.#_a.length = 0;
        this.#nforce = 0;
        this.#invalidate_cache();
    }
}
export class Moo {
    #initval;
    #eq;
    #force;
    #val;
    get val() { return this.#val; }
    #newval;
    get newval() { return this.#newval; }
    // #handler_db = new Set< MooHandler<T> >();
    #handler_db;
    #forceOnce = false;
    #data;
    set data(data_x) {
        // // #if INOUT
        //   assert( this.#data === undefined );
        // // #endif
        this.#data = data_x;
    }
    /**
     * @param { headconst } val_x
     * @param { headocnst } eq_x
     * @param { const } force
     */
    constructor(val_x, eq_x = (a, b) => a === b, force_x) {
        this.#initval = val_x;
        this.#eq = eq_x;
        this.#force = force_x === undefined ? false : true;
        this.reset();
    }
    reset() {
        this.#val = this.#initval;
        this.#newval = this.#initval;
        if (!this.#handler_db?.empty)
            this.#handler_db = new MooHandlerDB(this.#eq);
        //! not `#handler_db.clear()` b/c `#handler_db` could be shared
        // if( !this.#handler_db ) this.#handler_db = new MooHandlerDB( this.#eq );
        // this.#handler_db.clear();
        this.#forceOnce = this.#force;
        return this;
    }
    /**
     * Without invoking any callbacks.
     */
    set(val) { this.#val = this.#newval = val; }
    /** @final */
    registHandler(handler_x, newval, oldval, force, index = 0) {
        this.#handler_db.add(handler_x, newval, oldval, force !== undefined, index);
        // console.log( `this.#handler_db.size=${this.#handler_db.size}` );
    }
    /** @final */
    removeHandler(handler_x, newval, oldval) {
        this.#handler_db.del(handler_x, newval, oldval);
        // console.log( `this.#handler_db.size=${this.#handler_db.size}` );
    }
    /** @final */
    on(newval, handler_x, force, index = 0) {
        this.registHandler(handler_x, newval, undefined, force, index);
    }
    /** @final */
    off(newval, handler_x) {
        this.removeHandler(handler_x, newval);
    }
    shareHandlerTo(rhs) {
        assert(rhs.#handler_db.empty || rhs.#handler_db === this.#handler_db);
        // console.log( rhs.#handler_db );
        rhs.#handler_db = this.#handler_db;
    }
    set forceOnce(force) { this.#forceOnce = force; }
    force() { this.#forceOnce = true; return this; }
    refresh() { this.force().val = this.#val; }
    set val(val_x) {
        if (this.#eq(val_x, this.#val)
            && !this.#force
            && !this.#forceOnce
            && !this.#handler_db.force)
            return;
        this.#newval = val_x;
        this.#handler_db.get(val_x, this.#val, this.#force || this.#forceOnce)
            .forEach(handler_y => handler_y(val_x, this.#val, this.#data));
        // for( const handler_y of this.#handler_db ) 
        // {
        //   handler_y( val_x, this.#val, this );
        // }
        this.#val = val_x;
        this.#forceOnce = this.#force;
        this.#data = undefined; // it is used once
        // if( this.once_ ) this.#handler_db.clear();
    }
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=mv.js.map