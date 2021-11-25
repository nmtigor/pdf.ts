/*81*****************************************************************************
 * jslang
** ------ */
import { assert } from "./util/trace.js";
/*81---------------------------------------------------------------------------*/
// Ref. https://lodash.com/docs/4.17.15#isObjectLike
export function isObjectLike(value) {
    return value != null && typeof value == "object";
}
let valve = 0;
/**
 * ! Compare deeply Object, Array only.
 * ! Compare enumerable own string-properties only.
 *
 * @param { headconst } lhs_x
 * @param { headconst } rhs_x
 */
function eq_impl(lhs_x, rhs_x) {
    assert(valve--, "There is element referencing its ancestor.", import.meta);
    if (lhs_x === rhs_x)
        return true;
    if (Array.isArray(lhs_x)) {
        if (!Array.isArray(rhs_x))
            return false;
        if (lhs_x.length !== rhs_x.length)
            return false;
        if (!lhs_x.length && !rhs_x.length)
            return true;
        let ret = false;
        for (let i = lhs_x.length; i--;) {
            ret = eq_impl(lhs_x[i], rhs_x[i]);
            if (!ret)
                break;
        }
        return ret;
    }
    if (lhs_x instanceof Int8Array
        || lhs_x instanceof Uint8Array
        || lhs_x instanceof Uint8ClampedArray
        || lhs_x instanceof Int16Array
        || lhs_x instanceof Uint16Array
        || lhs_x instanceof Int32Array
        || lhs_x instanceof Uint32Array
        || lhs_x instanceof Float32Array
        || lhs_x instanceof Float64Array)
        return lhs_x.eq(rhs_x);
    if (isObjectLike(lhs_x)) {
        if (!isObjectLike(rhs_x) || Array.isArray(rhs_x))
            return false;
        const keys_lhs = Object.keys(lhs_x);
        const keys_rhs = Object.keys(rhs_x);
        if (keys_lhs.length !== keys_rhs.length)
            return false;
        if (!keys_lhs.length && !keys_rhs.length)
            return true;
        let ret = false;
        for (const key of keys_lhs) {
            if (rhs_x.hasOwnProperty)
                ret ||= rhs_x.hasOwnProperty(key);
            else
                ret ||= key in rhs_x; //! rhs_x could be Object without proto.
            ret &&= eq_impl(lhs_x[key], rhs_x[key]);
            if (!ret)
                break;
        }
        return ret;
    }
    return false;
}
export function eq(lhs_x, rhs_x, valve_x = 100) {
    valve = valve_x;
    return eq_impl(lhs_x, rhs_x);
}
/**
 * @param { headconst } rhs
 * @param { const } valve_x
 */
Reflect.defineProperty(Object.prototype, "eq", {
    value(rhs_x, valve_x = 100) {
        valve = valve_x;
        return eq_impl(this, rhs_x);
    }
});
Reflect.defineProperty(Array.prototype, "last", {
    get() { return this[this.length - 1]; }
});
Reflect.defineProperty(Array.prototype, "eq", {
    value(rhs_x, valve_x = 100) {
        valve = valve_x;
        return eq_impl(this, rhs_x);
    }
});
/**
 * @param { const } ary
 */
Reflect.defineProperty(Array.prototype, "fillArray", {
    value(ary) {
        assert(ary.length <= this.length);
        for (let i = 0, LEN = this.length; i < LEN; ++i) {
            this[i] = ary[i];
        }
        return this;
    }
});
Reflect.defineProperty(Array.prototype, "fillArrayBack", {
    value(ary) {
        assert(ary.length <= this.length);
        for (let i = this.length; i--;) {
            this[i] = ary[i];
        }
        return this;
    }
});
/*81---------------------------------------------------------------------------*/
/**
 * @param { const } cp Code Point returned by `string.charCodeAt()`
 */
export function isDecimalDigit(cp) {
    return 0x30 <= cp && cp <= 0x39;
}
export function isHexDigit(cp) {
    return (0x30 <= cp && cp <= 0x39) // 0..9
        || (0x41 <= cp && cp <= 0x46) // A..F
        || (0x61 <= cp && cp <= 0x66); // a..f
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
Number.apxE = (f0, f1) => Math.abs(f0 - f1) <= Number.EPSILON;
Number.apxS = function (f0, f1) { return f0 < f1 - Number.EPSILON; };
Number.apxSE = function (f0, f1) { return f0 <= f1 + Number.EPSILON; };
Number.apxG = function (f0, f1) { return f0 > f1 + Number.EPSILON; };
Number.apxGE = function (f0, f1) { return f0 >= f1 - Number.EPSILON; };
Number.getRandom = function (max, min = 0, fixto = 0) {
    return min + (Math.random() * (max - min)).fixTo(fixto);
};
Number.prototype.fixTo = function (digits = 0) {
    const mul = 10 ** digits;
    return Math.round(this.valueOf() * mul) / mul;
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
    }
});
Reflect.defineProperty(Uint8Array.prototype, "eq", {
    value(rhs_x) {
        if (!(rhs_x instanceof Uint8Array))
            return false;
        return iaEq_impl(this, rhs_x);
    }
});
Reflect.defineProperty(Uint8ClampedArray.prototype, "eq", {
    value(rhs_x) {
        if (!(rhs_x instanceof Uint8ClampedArray))
            return false;
        return iaEq_impl(this, rhs_x);
    }
});
Reflect.defineProperty(Int16Array.prototype, "eq", {
    value(rhs_x) {
        if (!(rhs_x instanceof Int16Array))
            return false;
        return iaEq_impl(this, rhs_x);
    }
});
Reflect.defineProperty(Uint16Array.prototype, "eq", {
    value(rhs_x) {
        if (!(rhs_x instanceof Uint16Array))
            return false;
        return iaEq_impl(this, rhs_x);
    }
});
Reflect.defineProperty(Int32Array.prototype, "eq", {
    value(rhs_x) {
        if (!(rhs_x instanceof Int32Array))
            return false;
        return iaEq_impl(this, rhs_x);
    }
});
Reflect.defineProperty(Uint32Array.prototype, "eq", {
    value(rhs_x) {
        if (!(rhs_x instanceof Uint32Array))
            return false;
        return iaEq_impl(this, rhs_x);
    }
});
Reflect.defineProperty(Float32Array.prototype, "eq", {
    value(rhs_x) {
        if (!(rhs_x instanceof Float32Array))
            return false;
        return faEq_impl(this, rhs_x);
    }
});
Reflect.defineProperty(Float64Array.prototype, "eq", {
    value(rhs_x) {
        if (!(rhs_x instanceof Float64Array))
            return false;
        return faEq_impl(this, rhs_x);
    }
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
        [`${this.getFullYear()}`,
            `${this.getMonth() + 1}`.padStart(2, "0"),
            `${this.getDate()}`.padStart(2, "0")
        ].join("-"),
        [`${this.getHours()}`.padStart(2, "0"),
            `${this.getMinutes()}`.padStart(2, "0"),
            `${this.getSeconds()}`.padStart(2, "0")
        ].join(":"),
        [`${tz <= 0 ? "+" : "-"}`,
            `${Math.floor(Math.abs(tz) / 60)}`.padStart(2, "0"),
            `${Math.abs(tz) % 60}`.padStart(2, "0")
        ].join(""),
    ].join(" ");
};
Date.prototype.getShiChen = function () {
    switch (this.getHours()) {
        case 23:
        case 0: return "子";
        case 1:
        case 2: return "丑";
        case 3:
        case 4: return "寅";
        case 5:
        case 6: return "卯";
        case 7:
        case 8: return "辰";
        case 9:
        case 10: return "巳";
        case 11:
        case 12: return "午";
        case 13:
        case 14: return "未";
        case 15:
        case 16: return "申";
        case 17:
        case 18: return "酉";
        case 19:
        case 20: return "戌";
        default: return "亥";
    }
};
Date.date = new Date;
Date.setHours = function (refdate, hours, min, sec, ms) {
    Date.date.setTime(refdate.getTime());
    if (ms !== undefined)
        return Date.date.setHours(hours, min, sec, ms);
    else if (sec !== undefined)
        return Date.date.setHours(hours, min, sec);
    else if (min !== undefined)
        return Date.date.setHours(hours, min);
    else
        return Date.date.setHours(hours);
};
Date.setDate = function (refdate, date) {
    Date.date.setTime(refdate.getTime());
    return Date.date.setDate(date);
};
Date.setMonth = function (refdate, month, date) {
    Date.date.setTime(refdate.getTime());
    if (date !== undefined)
        return Date.date.setMonth(month, date);
    else
        return Date.date.setMonth(month);
};
Date.setFullYear = function (refdate, year, month, date) {
    Date.date.setTime(refdate.getTime());
    if (date !== undefined)
        return Date.date.setFullYear(year, month, date);
    else if (month !== undefined)
        return Date.date.setFullYear(year, month);
    else
        return Date.date.setFullYear(year);
};
/*81---------------------------------------------------------------------------*/
// declare global 
// {
//   interface Math
//   {
//     minn( ...values:(number|bigint)[] ):number|bigint;
//     maxn( ...values:(number|bigint)[] ):number|bigint;
//   }
// }
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
/*81---------------------------------------------------------------------------*/
/**
 * class X extends mix( Y, Z )
 * ! should always companion with an `interface` declaration.
 *
 * @param mixins First element has highest precedence, and so on.
 */
export function mix(...mixins) {
    assert(mixins.length);
    class Mix extends mixins[0] {
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
            if (key !== "constructor"
                && key !== "prototype"
                && key !== "name") {
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
    for (let i = 1; i < mixins.length; i++) {
        deepcopyProperties(mixins[i].prototype, Mix.prototype);
        deepcopyProperties(mixins[i], Mix); // add static stuff
    }
    return Mix;
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=jslang.js.map