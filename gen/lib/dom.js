/*81*****************************************************************************
 * dom
** --- */
import { tail_ignored_sy, loff_sym, ovlap_sy } from "./symbols.js";
EventTarget.prototype.on = function (type, listener, options) {
    this.addEventListener(type, listener, options);
};
EventTarget.prototype.off = function (type, listener, options) {
    this.removeEventListener(type, listener, options);
};
Reflect.defineProperty(Event.prototype, "canceled", {
    get() { return this.canceled_ ?? false; },
    set(canceled_x) { this.canceled_ = canceled_x; },
});
Reflect.defineProperty(Node.prototype, "isText", {
    get() {
        return this.nodeType === Node.TEXT_NODE;
    },
});
Reflect.defineProperty(Node.prototype, "secondChild", {
    get() {
        return this.firstChild ? this.firstChild.nextSibling : null;
    },
});
Node.prototype.removeAllChild = function () {
    while (this.firstChild)
        this.removeChild(this.lastChild);
    return this;
};
// /**
//  * @deprecated - Use Node.isConnected property
//  * @return { Boolean }
//  */
// Node.prototype.attached = function()
// {
//   let ret = false;
//   let el = this;
//   let valve = 1000+1;
//   while( el && --valve )
//   {
//     if( el === document.body )
//     {
//       ret = true;
//       break;
//     }
//     el = el.parentNode;
//   }
//   assert(valve);
//   return ret;
// }
/**
 * Only test properties in `rhs`
 * @param { headconst } rhs
 */
Node.prototype.assert_eq = function (rhs) {
    // if( rhs && rhs[ref_test_sym] )
    // {
    //   console.assert( this === rhs[ref_test_sym] );
    //   return;
    // }
    if (this === rhs)
        return;
    for (const key of Reflect.ownKeys(rhs)) {
        if (key === "childNodes")
            continue;
        const rhsval = rhs[key];
        const zisval = this[key];
        if (Array.isArray(rhsval))
            console.assert(rhsval.eq(zisval));
        else
            console.assert(rhsval === zisval);
    }
    if (rhs.childNodes) {
        const childNodes = rhs.childNodes;
        console.assert(childNodes.length === this.childNodes.length);
        for (let i = childNodes.length; i--;)
            this.childNodes[i].assert_eq(childNodes[i]);
    }
    // if( rhs && rhs[test_ref_sym] ) rhs[ ref_test_sym ] = this;
};
Element.prototype.setAttrs = function (attrs_o) {
    for (const key in attrs_o) {
        this.setAttribute(key, attrs_o[key]);
    }
    return this;
};
Reflect.defineProperty(Element.prototype, "scrollRight", {
    get() {
        return this.scrollLeft + this.clientWidth;
    },
});
Reflect.defineProperty(Element.prototype, "scrollBottom", {
    get() {
        return this.scrollTop + this.clientHeight;
    },
});
Reflect.defineProperty(HTMLElement.prototype, "prevVisible", {
    get() {
        let ret = this.previousSibling;
        while (ret) {
            if (!(ret instanceof HTMLElement))
                continue;
            if (ret.style.display !== "none")
                break;
            ret = ret.previousSibling;
        }
        ret ??= undefined;
        return ret;
    },
});
Reflect.defineProperty(HTMLElement.prototype, "pageX", {
    get() {
        let ret = 0;
        let el = this;
        do {
            ret += el?.offsetLeft ?? 0;
            ret += el?.clientLeft ?? 0;
            ret -= el?.scrollLeft ?? 0;
        } while (el = el.offsetParent);
        return ret;
    },
});
Reflect.defineProperty(HTMLElement.prototype, "pageY", {
    get() {
        let ret = 0;
        let el = this;
        do {
            ret += el?.offsetTop ?? 0;
            ret += el?.clientTop ?? 0;
            ret -= el?.scrollTop ?? 0;
        } while (el = el.offsetParent);
        return ret;
    },
});
HTMLCollection.prototype.indexOf = function (element) {
    for (let i = 0; i < this.length; ++i) {
        if (this.item(i) === element)
            return i;
    }
    return -1;
};
Range.prototype.getReca = function (rec_a, ovlap = false) {
    const recs = this.getClientRects();
    if (recs.length) {
        for (let i = 0; i < recs.length; i++) {
            const rec = recs[i];
            if (rec.width === 0)
                rec.width = rec.height * .1;
            rec[ovlap_sy] = ovlap;
            rec_a.push(rec);
        }
    }
    else {
        const rec = this.getBoundingClientRect();
        rec.width = rec.height * .1;
        rec[ovlap_sy] = ovlap;
        rec_a.push(rec);
    }
};
Range.prototype.reset = function () {
    this.setEnd(document, 0);
    this.collapse();
};
/**
 * @param { const } text_x
 * @param { const } loff_x
 * @param { const } tail_ignored_x
 */
export function textnode(text_x, loff_x, tail_ignored_x) {
    const ret = document.createTextNode(text_x);
    if (loff_x !== undefined)
        ret[loff_sym] = loff_x;
    if (tail_ignored_x !== undefined)
        ret[tail_ignored_sy] = tail_ignored_x;
    return ret;
}
export function html(nodeName, innerHTML, doc = document) {
    let ret = doc.createElement(nodeName);
    if (innerHTML)
        ret.innerHTML = innerHTML;
    return ret;
}
export function div(innerHTML, doc = document) { return html("div", innerHTML, doc); }
export function span(innerHTML, doc = document) { return html("span", innerHTML, doc); }
export function svg(nodeName, doc = document) {
    return doc.createElementNS("http://www.w3.org/2000/svg", nodeName);
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=dom.js.map