/** 80**************************************************************************
 * @module lib/dom
 * @license Apache-2.0
 ******************************************************************************/
import { $cssstylesheet, $loff, $ovlap, $tail_ignored } from "./symbols.js";
if (globalThis.Event) {
    Reflect.defineProperty(Event.prototype, "canceled", {
        get() {
            return this._canceled ?? false;
        },
        set(canceled_x) {
            this._canceled = canceled_x;
        },
    });
    // console.log(Event.prototype.canceled);
}
if (globalThis.WheelEvent) {
    Reflect.defineProperty(WheelEvent.prototype, "_repr", {
        get() {
            const m_ = /* final switch */ {
                [WheelEvent.DOM_DELTA_PIXEL]: "DOM_DELTA_PIXEL",
                [WheelEvent.DOM_DELTA_LINE]: "DOM_DELTA_LINE",
                [WheelEvent.DOM_DELTA_PAGE]: "DOM_DELTA_PAGE",
            }[this.deltaMode];
            return {
                deltaMode: m_,
                deltaX: this.deltaX,
                deltaY: this.deltaY,
            };
        },
    });
}
/*64----------------------------------------------------------*/
export var MouseButton;
(function (MouseButton) {
    MouseButton[MouseButton["Main"] = 0] = "Main";
    MouseButton[MouseButton["Auxiliary"] = 1] = "Auxiliary";
    MouseButton[MouseButton["Secondary"] = 2] = "Secondary";
    MouseButton[MouseButton["Back"] = 3] = "Back";
    MouseButton[MouseButton["Forward"] = 4] = "Forward";
})(MouseButton || (MouseButton = {}));
if (globalThis.EventTarget) {
    EventTarget.prototype.on = function (type, listener, options) {
        return this.addEventListener(type, listener, options);
    };
    EventTarget.prototype.onWheel = function (listener, options) {
        return this.addEventListener("wheel", listener, Object.assign({ passive: true }, options));
    };
    EventTarget.prototype.off = function (type, listener, options) {
        return this.removeEventListener(type, listener, options);
    };
}
if (globalThis.Node) {
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
    /**
     * Only test properties in `rhs`
     * @headconst @param rhs
     */
    Node.prototype.assert_eq = function (rhs) {
        // if( rhs && rhs[$ref_test] )
        // {
        //   console.assert( this === rhs[$ref_test] );
        //   return;
        // }
        if (this === rhs)
            return;
        for (const key of Reflect.ownKeys(rhs)) {
            if (key === "childNodes")
                continue;
            const rhsval = rhs[key];
            const zisval = this[key];
            if (Array.isArray(rhsval)) {
                console.assert(rhsval.eq(zisval));
            }
            else {
                console.assert(rhsval === zisval);
            }
        }
        if (rhs.childNodes) {
            const childNodes = rhs.childNodes;
            console.assert(childNodes.length === this.childNodes.length);
            for (let i = childNodes.length; i--;) {
                this.childNodes[i].assert_eq(childNodes[i]);
            }
        }
        // if( rhs && rhs[test_ref_sym] ) rhs[ $ref_test ] = this;
    };
}
if (globalThis.Document) {
    let cssstylesheet_;
    Reflect.defineProperty(Document.prototype, $cssstylesheet, {
        get() {
            cssstylesheet_ ??= this.head.appendChild(html("style")).sheet;
            return cssstylesheet_;
        },
    });
}
if (globalThis.Element) {
    Element.prototype.assignAttro = function (attr_o) {
        for (const [key, val] of Object.entries(attr_o)) {
            this.setAttribute(key, val);
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
    Reflect.defineProperty(Element.prototype, "cyName", {
        get() {
            return this.getAttribute("data-cy");
        },
        set(name_x) {
            this.setAttribute("data-cy", name_x);
        },
    });
}
if (globalThis.HTMLElement) {
    HTMLElement.prototype.assignStylo = function (styl_o) {
        Object.assign(this.style, styl_o);
        return this;
    };
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
    // Reflect.defineProperty(HTMLElement.prototype, "pageX", {
    //   get(this: HTMLElement) {
    //     let ret = 0;
    //     let el = this as any;
    //     do {
    //       ret += el?.offsetLeft ?? 0;
    //       ret += el?.clientLeft ?? 0;
    //       ret -= el?.scrollLeft ?? 0;
    //     } while (el = el.offsetParent);
    //     return ret;
    //   },
    // });
    // Reflect.defineProperty(HTMLElement.prototype, "pageY", {
    //   get(this: HTMLElement) {
    //     let ret = 0;
    //     let el = this as any;
    //     do {
    //       ret += el?.offsetTop ?? 0;
    //       ret += el?.clientTop ?? 0;
    //       ret -= el?.scrollTop ?? 0;
    //     } while (el = el.offsetParent);
    //     return ret;
    //   },
    // });
    Reflect.defineProperty(HTMLElement.prototype, "viewLeft", {
        get() {
            return this.offsetLeft + this.clientLeft;
        },
    });
    Reflect.defineProperty(HTMLElement.prototype, "viewRight", {
        get() {
            return this.viewLeft + this.clientWidth;
        },
    });
    Reflect.defineProperty(HTMLElement.prototype, "viewTop", {
        get() {
            return this.offsetTop + this.clientTop;
        },
    });
    Reflect.defineProperty(HTMLElement.prototype, "viewBottom", {
        get() {
            return this.viewTop + this.clientHeight;
        },
    });
}
if (globalThis.SVGElement) {
    SVGElement.prototype.assignStylo = function (styl_o) {
        Object.assign(this.style, styl_o);
        return this;
    };
}
if (globalThis.CSSStyleDeclaration) {
    CSSStyleDeclaration.prototype.assignPropo = function (prop_o) {
        for (const [key, val] of Object.entries(prop_o)) {
            this.setProperty(key, val);
        }
    };
}
if (globalThis.HTMLCollection) {
    HTMLCollection.prototype.indexOf = function (element) {
        for (let i = 0; i < this.length; ++i) {
            if (this.item(i) === element)
                return i;
        }
        return -1;
    };
}
if (globalThis.DOMRect) {
    DOMRect.prototype.contain = function (x_x, y_x) {
        return this.left <= x_x && x_x < this.right &&
            this.top <= y_x && y_x < this.bottom;
    };
}
if (globalThis.Range) {
    Range.prototype.getSticka = function (out_a_x, ovlap_x = false) {
        const recs = this.getClientRects();
        if (recs.length) {
            for (const rec of recs) {
                if (rec.width === 0)
                    rec.width = rec.height * .1;
                rec[$ovlap] = ovlap_x;
                out_a_x.push(rec);
            }
        }
        else {
            const rec = this.getBoundingClientRect();
            rec.width = rec.height * .1;
            rec[$ovlap] = ovlap_x;
            out_a_x.push(rec);
        }
    };
    Range.prototype.reset = function () {
        this.setEnd(document, 0);
        this.collapse();
    };
}
/**
 * @const @param text_x
 * @const @param loff_x
 * @const @param tail_ignored_x
 */
export const textnode = (text_x, loff_x = 0, tail_ignored_x) => {
    const ret = document.createTextNode(text_x);
    ret[$loff] = loff_x;
    if (tail_ignored_x !== undefined)
        ret[$tail_ignored] = tail_ignored_x;
    return ret;
};
if (globalThis.Text) {
    Text.prototype.loff = function (offs_x) {
        return this[$loff] + offs_x;
    };
    Reflect.defineProperty(Text.prototype, "strtLoff", {
        get() {
            return this.loff(0);
        },
    });
    Reflect.defineProperty(Text.prototype, "stopLoff", {
        get() {
            return this.loff(this.length);
        },
    });
}
export function html(nodeName_x, innerHTML_x, doc_x = document) {
    let ret = doc_x.createElement(nodeName_x);
    if (innerHTML_x)
        ret.innerHTML = innerHTML_x;
    return ret;
}
export function div(innerHTML_x, doc_x = document) {
    return html("div", innerHTML_x, doc_x);
}
export function span(innerHTML_x, doc_x = document) {
    return html("span", innerHTML_x, doc_x);
}
export function svg(nodeName, doc = document) {
    return doc.createElementNS("http://www.w3.org/2000/svg", nodeName);
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=dom.js.map