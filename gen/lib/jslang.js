/** 80**************************************************************************
 * @module lib/jslang
 * @license Apache-2.0
 ******************************************************************************/
import { INOUT } from "../global.js";
import { assert } from "./util/trace.js";
/** Ref. https://lodash.com/docs/4.17.15#isObjectLike */
export function isObjectLike(value) {
    return value != null && typeof value === "object";
}
let valve_ = 0;
/**
 * ! Compare deeply Object, Array only.
 * ! Compare enumerable own string-properties only.
 *
 * @headconst @param lhs_x
 * @headconst @param rhs_x
 */
function eq_impl(lhs_x, rhs_x) {
    /*#static*/ if (INOUT) {
        assert(valve_--, "There is element referencing its ancestor.");
    }
    if (lhs_x === rhs_x ||
        Number.isNaN(lhs_x) && Number.isNaN(rhs_x) //! Notice, `NaN === NaN` is false.
    ) {
        return true;
    }
    if (Array.isArray(lhs_x)) {
        if (!Array.isArray(rhs_x))
            return false;
        if (lhs_x.length !== rhs_x.length)
            return false;
        if (!lhs_x.length && !rhs_x.length)
            return true;
        for (let i = lhs_x.length; i--;) {
            if (!eq_impl(lhs_x[i], rhs_x[i])) {
                return false;
            }
        }
        return true;
    }
    if (lhs_x instanceof Int8Array ||
        lhs_x instanceof Uint8Array ||
        lhs_x instanceof Uint8ClampedArray ||
        lhs_x instanceof Int16Array ||
        lhs_x instanceof Uint16Array ||
        lhs_x instanceof Int32Array ||
        lhs_x instanceof Uint32Array ||
        lhs_x instanceof Float32Array ||
        lhs_x instanceof Float64Array) {
        return lhs_x.eq(rhs_x);
    }
    if (isObjectLike(lhs_x)) {
        if (!isObjectLike(rhs_x) || Array.isArray(rhs_x))
            return false;
        const keys_lhs = Object.keys(lhs_x);
        const keys_rhs = Object.keys(rhs_x);
        if (keys_lhs.length !== keys_rhs.length)
            return false;
        if (!keys_lhs.length && !keys_rhs.length)
            return true;
        for (const key of keys_lhs) {
            if (!Object.hasOwn(rhs_x, key) ||
                !eq_impl(lhs_x[key], rhs_x[key])) {
                return false;
            }
        }
        return true;
    }
    return false;
}
export function eq(lhs_x, rhs_x, valve_x = 100) {
    valve_ = valve_x;
    return eq_impl(lhs_x, rhs_x);
}
/**
 * @headconst @param rhs
 * @const @param valve_x
 */
Reflect.defineProperty(Object.prototype, "eq", {
    value(rhs_x, valve_x = 100) {
        valve_ = valve_x;
        return eq_impl(this, rhs_x);
    },
});
Reflect.defineProperty(Array.prototype, "last", {
    get() {
        return this[this.length - 1];
    },
});
Reflect.defineProperty(Array.prototype, "eq", {
    value(rhs_x, valve_x = 100) {
        valve_ = valve_x;
        return eq_impl(this, rhs_x);
    },
});
Reflect.defineProperty(Array.prototype, "fillArray", {
    value(ary_x) {
        /*#static*/ if (INOUT) {
            assert(ary_x.length <= this.length);
        }
        for (let i = 0, LEN = this.length; i < LEN; ++i) {
            this[i] = ary_x[i];
        }
        return this;
    },
});
Reflect.defineProperty(Array.prototype, "fillArrayBack", {
    value(ary_x) {
        /*#static*/ if (INOUT) {
            assert(ary_x.length <= this.length);
        }
        for (let i = this.length; i--;) {
            this[i] = ary_x[i];
        }
        return this;
    },
});
Reflect.defineProperty(Array.prototype, "become", {
    value(ary_x) {
        this.length = ary_x.length;
        return this.fillArrayBack(ary_x);
    },
});
Reflect.defineProperty(Array.prototype, "swap", {
    value(i_x, j_x) {
        const t_ = this[j_x];
        this[j_x] = this[i_x];
        this[i_x] = t_;
        return this;
    },
});
/*80--------------------------------------------------------------------------*/
/**
 * @const @param cp Code Point returned by `string.charCodeAt()`
 */
export function isDecimalDigit(cp) {
    return 0x30 <= cp && cp <= 0x39;
}
export function isHexDigit(cp) {
    return (0x30 <= cp && cp <= 0x39) || // 0..9
        (0x41 <= cp && cp <= 0x46) || // A..F
        (0x61 <= cp && cp <= 0x66); // a..f
}
export function isOctalDigit(cp) {
    return (0x30 <= cp && cp <= 0x37); // 0..7
}
export function isASCIIUpLetter(cp) {
    return (0x41 <= cp && cp <= 0x5A); // A..Z
}
export function isASCIILoLetter(cp) {
    return (0x61 <= cp && cp <= 0x7A); // a..z
}
export function isASCIILetter(cp) {
    return isASCIIUpLetter(cp) || isASCIILoLetter(cp);
}
const Tolerance_ = 2 ** -30; // ~= 0.000_000_001
Number.apxE = (f0, f1) => Math.abs(f0 - f1) <= Tolerance_;
Number.apxS = (f0, f1) => f0 < f1 - Tolerance_;
Number.apxSE = (f0, f1) => f0 <= f1 + Tolerance_;
Number.apxG = (f0, f1) => f0 > f1 + Tolerance_;
Number.apxGE = (f0, f1) => f0 >= f1 - Tolerance_;
Number.getRandom = (max, min = 0, fixto = 0) => min + (Math.random() * (max - min)).fixTo(fixto);
// Number.normalize = (in_x, to_x) => {
//   if (!to_x) return -1;
//   let ret = in_x % to_x;
//   if (ret < 0) ret += to_x;
//   return ret;
// };
Number.normalize = (in_x, to_x) => {
    let ret = Math.clamp(-to_x, in_x, to_x);
    if (ret < 0)
        ret += to_x;
    return ret;
};
Number.prototype.fixTo = function (digits = 0) {
    const mul = 10 ** digits;
    return Math.round(this.valueOf() * mul) / mul;
};
Number.prototype.reprRatio = function (fixTo_x = 2) {
    let x_ = this.valueOf();
    const n_ = Number.apxS(x_, 0);
    x_ = Math.abs(x_);
    const f_ = Number.apxG(x_, 0) && Number.apxS(x_, 1);
    let ret = x_.fixTo(fixTo_x).toString();
    if (f_)
        ret = ret.slice(1);
    if (n_)
        ret = `-${ret}`;
    return ret;
};
/*81-----------------------------------------------------------------------------
 * TypedArray
** ---------- */
function iaEq_impl(lhs_x, rhs_x) {
    if (rhs_x.length !== lhs_x.length)
        return false;
    for (let i = lhs_x.length; i--;) {
        if (rhs_x[i] !== lhs_x[i])
            return false;
    }
    return true;
}
function faEq_impl(lhs_x, rhs_x) {
    if (rhs_x.length !== lhs_x.length)
        return false;
    for (let i = lhs_x.length; i--;) {
        if (!Number.apxE(rhs_x[i], lhs_x[i]))
            return false;
    }
    return true;
}
Reflect.defineProperty(Int8Array.prototype, "eq", {
    value(rhs_x) {
        if (!(rhs_x instanceof Int8Array))
            return false;
        return iaEq_impl(this, rhs_x);
    },
});
Reflect.defineProperty(Uint8Array.prototype, "eq", {
    value(rhs_x) {
        if (!(rhs_x instanceof Uint8Array))
            return false;
        return iaEq_impl(this, rhs_x);
    },
});
Reflect.defineProperty(Uint8ClampedArray.prototype, "eq", {
    value(rhs_x) {
        if (!(rhs_x instanceof Uint8ClampedArray))
            return false;
        return iaEq_impl(this, rhs_x);
    },
});
Reflect.defineProperty(Int16Array.prototype, "eq", {
    value(rhs_x) {
        if (!(rhs_x instanceof Int16Array))
            return false;
        return iaEq_impl(this, rhs_x);
    },
});
Reflect.defineProperty(Uint16Array.prototype, "eq", {
    value(rhs_x) {
        if (!(rhs_x instanceof Uint16Array))
            return false;
        return iaEq_impl(this, rhs_x);
    },
});
Reflect.defineProperty(Int32Array.prototype, "eq", {
    value(rhs_x) {
        if (!(rhs_x instanceof Int32Array))
            return false;
        return iaEq_impl(this, rhs_x);
    },
});
Reflect.defineProperty(Uint32Array.prototype, "eq", {
    value(rhs_x) {
        if (!(rhs_x instanceof Uint32Array))
            return false;
        return iaEq_impl(this, rhs_x);
    },
});
Reflect.defineProperty(Float32Array.prototype, "eq", {
    value(rhs_x) {
        if (!(rhs_x instanceof Float32Array))
            return false;
        return faEq_impl(this, rhs_x);
    },
});
Reflect.defineProperty(Float64Array.prototype, "eq", {
    value(rhs_x) {
        if (!(rhs_x instanceof Float64Array))
            return false;
        return faEq_impl(this, rhs_x);
    },
});
Date.prototype.myformat = function () {
    // let month_s;
    // switch( this.getMonth() )
    // {
    // case 0: month_s = "Jan"; break;
    // case 1: month_s = "Feb"; break;
    // case 2: month_s = "Mar"; break;
    // case 3: month_s = "Apr"; break;
    // case 4: month_s = "May"; break;
    // case 5: month_s = "Jun"; break;
    // case 6: month_s = "Jul"; break;
    // case 7: month_s = "Aug"; break;
    // case 8: month_s = "Sep"; break;
    // case 9: month_s = "Oct"; break;
    // case 10: month_s = "Nov"; break;
    // default: month_s = "Dec"; break;
    // }
    // const _0 = ( v ) => `${v<10?"0":""}${v}`;
    const tz = this.getTimezoneOffset();
    return [
        [
            `${this.getFullYear()}`,
            `${this.getMonth() + 1}`.padStart(2, "0"),
            `${this.getDate()}`.padStart(2, "0"),
        ].join("-"),
        [
            `${this.getHours()}`.padStart(2, "0"),
            `${this.getMinutes()}`.padStart(2, "0"),
            `${this.getSeconds()}`.padStart(2, "0"),
        ].join(":"),
        [
            `${tz <= 0 ? "+" : "-"}`,
            `${Math.floor(Math.abs(tz) / 60)}`.padStart(2, "0"),
            `${Math.abs(tz) % 60}`.padStart(2, "0"),
        ].join(""),
    ].join(" ");
};
Date.prototype.getShiChen = function () {
    switch (this.getHours()) {
        case 23:
        case 0:
            return "子";
        case 1:
        case 2:
            return "丑";
        case 3:
        case 4:
            return "寅";
        case 5:
        case 6:
            return "卯";
        case 7:
        case 8:
            return "辰";
        case 9:
        case 10:
            return "巳";
        case 11:
        case 12:
            return "午";
        case 13:
        case 14:
            return "未";
        case 15:
        case 16:
            return "申";
        case 17:
        case 18:
            return "酉";
        case 19:
        case 20:
            return "戌";
        default:
            return "亥";
    }
};
Date.date = new Date();
Date.setHours = (refdate, hours, min, sec, ms) => {
    Date.date.setTime(refdate.getTime());
    if (ms !== undefined) {
        return Date.date.setHours(hours, min, sec, ms);
    }
    else if (sec !== undefined) {
        return Date.date.setHours(hours, min, sec);
    }
    else if (min !== undefined) {
        return Date.date.setHours(hours, min);
    }
    else {
        return Date.date.setHours(hours);
    }
};
Date.setDate = (refdate, date) => {
    Date.date.setTime(refdate.getTime());
    return Date.date.setDate(date);
};
Date.setMonth = (refdate, month, date) => {
    Date.date.setTime(refdate.getTime());
    if (date !== undefined) {
        return Date.date.setMonth(month, date);
    }
    else {
        return Date.date.setMonth(month);
    }
};
Date.setFullYear = (refdate, year, month, date) => {
    Date.date.setTime(refdate.getTime());
    if (date !== undefined) {
        return Date.date.setFullYear(year, month, date);
    }
    else if (month !== undefined) {
        return Date.date.setFullYear(year, month);
    }
    else {
        return Date.date.setFullYear(year);
    }
};
Math.clamp = (min_x, val_x, max_x) => Math.max(min_x, Math.min(val_x, max_x));
// Math.minn = ( ...values ) =>
// {
//   let ret:number|bigint = Infinity;
//   values.forEach( v => {
//     if( v < ret ) ret = v;
//   })
//   return ret;
// }
// Math.maxn = ( ...values ) =>
// {
//   let ret:number|bigint = -Infinity;
//   values.forEach( v => {
//     if( v > ret ) ret = v;
//   })
//   return ret;
// }
/*80--------------------------------------------------------------------------*/
/**
 * class X extends mix( Y, Z )
 * ! Should always companion with an interface declaration
 *
 * @param mixins_x
 *  Laat element has the highest precedence, and so on.
 */
export function mix(Base_x, ...mixins_x) {
    class Mix extends Base_x {
    }
    // console.log( Mix );
    function copyProperties(source, target) {
        // console.log( target );
        // console.log( source );
        for (const key of Reflect.ownKeys(source)) {
            // console.log( key );
            if (key in target) {
                // console.log( `${key} in ${target}` );
                continue;
            }
            if (key !== "constructor" &&
                key !== "prototype" &&
                key !== "name") {
                const desc = Object.getOwnPropertyDescriptor(source, key);
                if (desc !== undefined)
                    Object.defineProperty(target, key, desc);
            }
        }
    }
    function deepcopyProperties(source, target) {
        let o = source;
        while (o) {
            copyProperties(o, target);
            o = Reflect.getPrototypeOf(o);
        }
    }
    for (let i = mixins_x.length; i--;) {
        deepcopyProperties(mixins_x[i].prototype, Mix.prototype);
        deepcopyProperties(mixins_x[i], Mix); // Add static stuff
    }
    return Mix;
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=jslang.js.map