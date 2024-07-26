/** 80**************************************************************************
 * @module lib/color/Colr
 * @license Apache-2.0
 ******************************************************************************/
import { INOUT } from "../../global.js";
import "../jslang.js";
import { Moo } from "../Moo.js";
import { assert, fail } from "../util/trace.js";
import { csscNameMapData } from "./alias.js";
import { argbFromRgb, blueFromArgb, greenFromArgb, redFromArgb, } from "./color_utils.js";
import { Hct } from "./hct.js";
import { HctSolver } from "./hct_solver.js";
function normalizeCsscHex_(csschex) {
    let ret = "";
    csschex = csschex.toLowerCase();
    switch (csschex.length) {
        case 4: // "#123"
            ret = `#${csschex[1]}${csschex[1]}${csschex[2]}${csschex[2]}${csschex[3]}${csschex[3]}`;
            break;
        case 5: // "#1234"
            if (csschex.endsWith("f")) {
                ret = `#${csschex[1]}${csschex[1]}${csschex[2]}${csschex[2]}${csschex[3]}${csschex[3]}`;
            }
            else {
                ret = `#${csschex[1]}${csschex[1]}${csschex[2]}${csschex[2]}${csschex[3]}${csschex[3]}${csschex[4]}${csschex[4]}`;
            }
            break;
        case 7: // "#123456"
            ret = csschex;
            break;
        case 9: // "#12345678"
            if (csschex.endsWith("ff")) {
                ret = csschex.slice(0, 7);
            }
            else
                ret = csschex;
            break;
        default:
            fail();
    }
    return ret;
}
/** @final */
export class Colr {
    static #ID = 0;
    id = ++Colr.#ID;
    #hex;
    #red;
    #green;
    #blue;
    #hct;
    #alpha;
    /** @const */
    get #alphaInt() {
        if (this.#alpha === undefined)
            return undefined;
        else {
            const a_ = Math.clamp(0, this.#alpha, 1);
            return Math.round(a_ * 0xff);
        }
    }
    #name;
    #cssc;
    #mo;
    get mo$() {
        return this.#mo ??= new Moo({
            val: this,
            _name: `Colr_${this.id}.#mo`,
        });
    }
    /**
     * @const @param typ_x
     * @const @param dat_x
     */
    constructor(typ_x, ...dat_x) {
        if (typ_x) {
            /* final switch */ ({
                ["hex"]: () => {
                    // assert( dat_x.length == 1 );
                    /**
                     * @var s
                     *   "123" or "#123" or
                     *   "1234" or "#1234" or
                     *   "123456" or "#123456" or
                     *   "12345678" or "#12345678" or
                     */
                    const s = dat_x[0];
                    this.#hex = normalizeCsscHex_(s.startsWith("#") ? s : `#${s}`);
                },
                ["rgb"]: () => {
                    // assert( dat_x.length == 3 );
                    this.#red = dat_x[0];
                    this.#green = dat_x[1];
                    this.#blue = dat_x[2];
                },
                ["rgba"]: () => {
                    // assert( dat_x.length == 4 );
                    this.#red = dat_x[0];
                    this.#green = dat_x[1];
                    this.#blue = dat_x[2];
                    this.#alpha = dat_x[3];
                },
                ["hct"]: () => {
                    // assert( dat_x.length == 3 );
                    this.#hct = Hct.from(dat_x[0], dat_x[1], dat_x[2]);
                },
                ["hcta"]: () => {
                    // assert( dat_x.length == 4 );
                    this.#hct = Hct.from(dat_x[0], dat_x[1], dat_x[2]);
                    this.#alpha = dat_x[3];
                },
                ["name"]: () => {
                    this.#name = dat_x[0];
                },
            }[typ_x])();
        }
    }
    /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/
    /**
     * Assign `#red`, `#green`, `#blue`, `#alpha`\
     * `in( this.#hex !== undefined )`
     */
    #byHex() {
        const i_ = parseInt(this.#hex.slice(1), 16);
        switch (this.#hex.length) {
            case 7:
                this.#red = redFromArgb(i_);
                this.#green = greenFromArgb(i_);
                this.#blue = blueFromArgb(i_);
                this.#alpha = 1;
                break;
            case 9:
                this.#red = (i_ >> 24) & 0xFF;
                this.#green = (i_ >> 16) & 0xFF;
                this.#blue = (i_ >> 8) & 0xFF;
                this.#alpha = (i_ & 0xFF) / 0xFF;
                break;
            default:
                fail();
        }
    }
    /**
     * Assign `#red`, `#green`, `#blue`\
     * `in( this.#hct?.valid )`
     */
    #byHCT() {
        const argb_ = this.#hct.toInt();
        this.#red = redFromArgb(argb_);
        this.#green = greenFromArgb(argb_);
        this.#blue = blueFromArgb(argb_);
        //! Alpha channel of `#hct` is ignored
        // this.#alpha = alphaFromArgb(argb_) / 0xff;
    }
    /**
     * Assign `#red`, `#green`, `#blue`, `#alpha`
     * @const @param h_x From CSS "hsl(...)"
     * @const @param s_x ditto
     * @const @param l_x ditto
     * @const @param a_x ditto
     */
    #byHSL(h_x, s_x, l_x, a_x) {
        let h_ = h_x / 360;
        let s_ = s_x / 100;
        let l_ = l_x / 100;
        if (s_ === 0) {
            this.#red = this.#green = this.#blue = Math.round(l_ * 255);
        }
        else {
            let t2;
            if (l_ < 0.5) {
                t2 = l_ * (1 + s_);
            }
            else {
                t2 = l_ + s_ - l_ * s_;
            }
            let t1 = 2 * l_ - t2;
            let rgb = [0, 0, 0];
            for (let i = 0; i < 3; i++) {
                let t3 = h_ + 1 / 3 * -(i - 1);
                if (t3 < 0)
                    t3++;
                if (t3 > 1)
                    t3--;
                let val;
                if (6 * t3 < 1)
                    val = t1 + (t2 - t1) * 6 * t3;
                else if (2 * t3 < 1)
                    val = t2;
                else if (3 * t3 < 2)
                    val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
                else
                    val = t1;
                rgb[i] = Math.min(Math.round(val * 255), 255);
            }
            this.#red = rgb[0];
            this.#green = rgb[1];
            this.#blue = rgb[2];
        }
        this.#alpha = a_x;
    }
    /**
     * `in( isValidCssc(cssc_x) )`
     * @const @param cssc_x
     *    Notice, e.g. "rgb(25,55,55,.3)" rather than "rgb(25 55 55 /.3)"
     */
    setByCssc(cssc_x) {
        if (cssc_x.startsWith("#")) {
            this.#hex = normalizeCsscHex_(cssc_x);
            this.#red = this.#green = this.#blue = undefined;
            this.#alpha = undefined;
            this.#name = undefined;
        }
        else if (csscNameMap.hasN(cssc_x)) {
            this.#name = cssc_x;
            this.#hex = undefined;
            this.#red = this.#green = this.#blue = undefined;
            this.#alpha = undefined;
        }
        else {
            const compo_a = cssc_x
                .replace(/[^\.\d,]/g, "")
                .split(",")
                .map((s) => parseFloat(s));
            if (cssc_x.startsWith("rgb")) {
                this.#red = compo_a[0];
                this.#green = compo_a[1];
                this.#blue = compo_a[2];
                this.#alpha = compo_a[3];
            }
            else if (cssc_x.startsWith("hsl")) {
                this.#byHSL(...compo_a);
            }
            else {
                assert(0);
            }
            this.#hex = undefined;
            this.#name = undefined;
        }
        this.#hct?.invalidate();
        this.#cssc = undefined;
        return this;
    }
    setByCsscMo(cssc_x) {
        this.setByCssc(cssc_x);
        this.#mo?.refresh();
        return this;
    }
    /**
     * @const @param colr_x
     */
    setByColr(colr_x) {
        this.#hex = colr_x.#hex;
        this.#red = colr_x.#red;
        this.#green = colr_x.#green;
        this.#blue = colr_x.#blue;
        if (colr_x.#hct?.valid) {
            if (this.#hct) {
                this.#hct.setInternalState(colr_x.#hct.toInt());
            }
            else {
                this.#hct = Hct.fromInt(colr_x.#hct.toInt());
            }
        }
        else {
            this.#hct?.invalidate();
        }
        this.#alpha = colr_x.#alpha;
        this.#name = colr_x.#name;
        this.#cssc = colr_x.#cssc;
        return this;
    }
    setByColrMo(colr_x) {
        this.setByColr(colr_x);
        this.#mo?.refresh();
        return this;
    }
    dup() {
        return (new Colr()).setByColr(this);
    }
    #getHex(valve_x = 10) {
        if (this.#hex !== undefined)
            return this.#hex;
        /*#static*/  {
            assert(valve_x--, "Cycle call!");
        }
        let hex_;
        if (this.#name !== undefined) {
            hex_ = csscNameMap.getX(this.#name);
        }
        else {
            const xr = this.#getRed(valve_x).toString(16).padStart(2, "0");
            const xg = this.#getGreen(valve_x).toString(16).padStart(2, "0");
            const xb = this.#getBlue(valve_x).toString(16).padStart(2, "0");
            hex_ = `#${xr}${xg}${xb}`;
        }
        assert(hex_ && hex_.length === 7);
        if (this.#alpha !== undefined) {
            hex_ += this.#alphaInt.toString(16).padStart(2, "0");
        }
        return this.#hex = hex_.toLowerCase();
    }
    get hex() {
        return this.#getHex();
    }
    eq(rhs) {
        return rhs === this || rhs.hex === this.hex;
    }
    #getRed(valve_x = 10) {
        if (this.#red !== undefined)
            return this.#red;
        /*#static*/  {
            assert(valve_x--, "Cycle call!");
        }
        if (this.#hex !== undefined) {
            this.#byHex();
        }
        else if (this.#hct?.valid) {
            this.#byHCT();
        }
        else if (this.#name !== undefined) {
            this.#getHex(valve_x);
            this.#byHex();
        }
        else {
            assert(0);
        }
        return this.#red;
    }
    get red() {
        return this.#getRed();
    }
    #getGreen(valve_x = 10) {
        if (this.#green !== undefined)
            return this.#green;
        /*#static*/  {
            assert(valve_x--, "Cycle call!");
        }
        this.#getRed(valve_x);
        assert(this.#green !== undefined);
        return this.#green;
    }
    get green() {
        return this.#getGreen();
    }
    #getBlue(valve_x = 10) {
        if (this.#blue !== undefined)
            return this.#blue;
        /*#static*/  {
            assert(valve_x--, "Cycle call!");
        }
        this.#getRed(valve_x);
        assert(this.#blue !== undefined);
        return this.#blue;
    }
    get blue() {
        return this.#getBlue();
    }
    #getARGB(valve_x = 10) {
        if (this.#hct?.valid)
            return this.#hct.toInt();
        /*#static*/  {
            assert(valve_x--, "Cycle call!");
        }
        if (this.#hex !== undefined) {
            this.#byHex();
        }
        else if (this.#red !== undefined) {
        }
        else if (this.#name !== undefined) {
            this.#getHex(valve_x);
            this.#byHex();
        }
        else {
            assert(0);
        }
        let ret = argbFromRgb(this.#red, this.#green, this.#blue);
        if (this.#alpha !== undefined) {
            ret &= 16777215;
            ret |= this.#alphaInt << 24;
        }
        return ret;
    }
    #getHCT(valve_x = 10) {
        if (this.#hct?.valid)
            return this.#hct;
        /*#static*/  {
            assert(valve_x--, "Cycle call!");
        }
        if (this.#hct)
            this.#hct.setInternalState(this.#getARGB(valve_x));
        else
            this.#hct = Hct.fromInt(this.#getARGB(valve_x));
        return this.#hct;
    }
    get hue() {
        return this.#getHCT().hue;
    }
    get chroma() {
        return this.#getHCT().chroma;
    }
    get tone() {
        return this.#getHCT().tone;
    }
    // get hue(): hue_t {
    //   if (this.#hue !== undefined) return this.#hue;
    //   let r_ = this.red / 255;
    //   let g_ = this.green / 255;
    //   let b_ = this.blue / 255;
    //   let min = Math.min(r_, g_, b_);
    //   let max = Math.max(r_, g_, b_);
    //   let delta = max - min;
    //   let h_: hue_t, s_, l_;
    //   if (max === min) h_ = 0;
    //   else if (r_ === max) h_ = (g_ - b_) / delta;
    //   else if (g_ === max) h_ = 2 + (b_ - r_) / delta;
    //   /* if (b === max) */ else h_ = 4 + (r_ - g_) / delta;
    //   h_ = Math.min(h_ * 60, 360);
    //   if (h_ < 0) h_ += 360;
    //   l_ = (min + max) / 2;
    //   if (max === min) s_ = 0;
    //   else if (l_ <= 0.5) s_ = delta / (max + min);
    //   else s_ = delta / (2 - max - min);
    //   this.#hue = h_;
    //   this.#s = s_ * 100;
    //   this.#l = l_ * 100;
    //   // console.log( `rgb=(${this.#red},${this.#green},${this.#blue})` );
    //   // console.log( `hsl=(${this.#hue},${this.#s},${this.#l})` );
    //   return this.#hue;
    // }
    // /** @deprecated */
    // get s(): s_t {
    //   if (this.#s !== undefined) return this.#s;
    //   this.hue;
    //   assert(this.#s !== undefined);
    //   return this.#s as unknown as s_t;
    // }
    // /** @deprecated */
    // get l(): l_t {
    //   if (this.#l !== undefined) return this.#l;
    //   this.hue;
    //   assert(this.#l !== undefined);
    //   return this.#l as unknown as l_t;
    // }
    #getAlpha(valve_x = 10) {
        if (this.#alpha !== undefined)
            return this.#alpha;
        /*#static*/  {
            assert(valve_x--, "Cycle call!");
        }
        if (!this.#hex || this.#hex.length === 7) {
            this.#alpha = 1;
        }
        else {
            const i_ = parseInt(this.#hex.slice(1), 16);
            this.#alpha = (i_ & 0xFF) / 0xFF;
        }
        return this.#alpha;
    }
    get alpha() {
        return this.#getAlpha();
    }
    #getName(valve_x = 10) {
        if (this.#name !== undefined)
            return this.#name;
        /*#static*/  {
            assert(valve_x--, "Cycle call!");
        }
        return this.#name = csscNameMap.getN(this.#getHex(valve_x));
    }
    /**
     * ! Alpha channel is ignored
     */
    get name() {
        return this.#getName();
    }
    // /**
    //  * "n"
    //  * @deprecated
    //  */
    // negate() {
    //   this.#red = 255 - this.red;
    //   this.#green = 255 - this.green;
    //   this.#blue = 255 - this.blue;
    //   this.#hex =
    //     this.#hue =
    //     this.#s =
    //     this.#l =
    //     this.#name =
    //       undefined; //!
    //   return this;
    // }
    // /**
    //  * ref. YIQ equation from http://24ways.org/2010/calculating-color-contrast
    //  * @deprecated
    //  */
    // get isDark() {
    //   return ((this.red * 299 + this.green * 587 + this.blue * 114) / 1000) < 128;
    // }
    // // get isDark() { return this.l < 50; }
    // /** @deprecated */
    // get isLigt() {
    //   return !this.isDark;
    // }
    /**
     * "r50"\
     * Keep `#alpha` unchanged\
     * `in( zRed.parse(val_x) )`
     * @const @param val_x
     */
    setRed(val_x) {
        this.#getRed();
        this.#red = val_x;
        this.#hex = undefined;
        this.#hct?.invalidate();
        this.#name = undefined;
        this.#cssc = undefined;
        return this;
    }
    setRedMo(val_x) {
        this.setRed(val_x);
        this.#mo?.refresh();
        return this;
    }
    SetRed(val_x) {
        return this.dup().setRed(val_x);
    }
    /**
     * "g50"\
     * Keep `#alpha` unchanged\
     * `in( zRed.parse(val_x) )`
     * @const @param val_x
     */
    setGreen(val_x) {
        this.#getGreen();
        this.#green = val_x;
        this.#hex = undefined;
        this.#hct?.invalidate();
        this.#name = undefined;
        this.#cssc = undefined;
        return this;
    }
    setGreenMo(val_x) {
        this.setGreen(val_x);
        this.#mo?.refresh();
        return this;
    }
    SetGreen(val_x) {
        return this.dup().setGreen(val_x);
    }
    /**
     * "b50"\
     * Keep `#alpha` unchanged\
     * `in( zRed.parse(val_x) )`
     * @const @param val_x
     */
    setBlue(val_x) {
        this.#getBlue();
        this.#blue = val_x;
        this.#hex = undefined;
        this.#hct?.invalidate();
        this.#name = undefined;
        this.#cssc = undefined;
        return this;
    }
    setBlueMo(val_x) {
        this.setBlue(val_x);
        this.#mo?.refresh();
        return this;
    }
    SetBlue(val_x) {
        return this.dup().setBlue(val_x);
    }
    /**
     * "h50"\
     * Keep `#alpha` unchanged\
     * `in( zHue.parse(val_x) )`
     * @const @param val_x
     */
    setHue(val_x) {
        this.#getHCT();
        // const c_ = this.chroma;
        this.#hct.hue = val_x;
        // assert(Number.apxE(c_, this.chroma)); //! could affect `chroma`
        this.#hex = undefined;
        this.#red = this.#green = this.#blue = undefined;
        this.#name = undefined;
        this.#cssc = undefined;
        return this;
    }
    setHueMo(val_x) {
        this.setHue(val_x);
        this.#mo?.refresh();
        return this;
    }
    SetHue(val_x) {
        return this.dup().setHue(val_x);
    }
    /**
     * "c50"\
     * Keep `#alpha` unchanged\
     * `in( zChroma.parse(val_x) )`
     * @const @param val_x
     */
    setChroma(val_x) {
        this.#getHCT().chroma = val_x;
        this.#hex = undefined;
        this.#red = this.#green = this.#blue = undefined;
        this.#name = undefined;
        this.#cssc = undefined;
        return this;
    }
    setChromaMo(val_x) {
        this.setChroma(val_x);
        this.#mo?.refresh();
        return this;
    }
    SetChroma(val_x) {
        return this.dup().setChroma(val_x);
    }
    /**
     * "t50"\
     * Keep `#alpha` unchanged\
     * `in( zTone.parse(val_x) )`
     * @const @param val_x
     */
    setTone(val_x) {
        this.#getHCT();
        this.#hct.tone = val_x;
        this.#hex = undefined;
        this.#red = this.#green = this.#blue = undefined;
        this.#name = undefined;
        this.#cssc = undefined;
        return this;
    }
    setToneMo(val_x) {
        this.setTone(val_x);
        this.#mo?.refresh();
        return this;
    }
    SetTone(val_x) {
        return this.dup().setTone(val_x);
    }
    /**
     * ! Set hue or chroma or tone alone could change the other two.
     * @const @param h_x
     * @const @param c_x
     * @const @param t_x
     */
    setHCT(h_x, c_x, t_x) {
        this.#getHCT().setInternalState(HctSolver.solveToInt(h_x, c_x, t_x));
        this.#hex = undefined;
        this.#red = this.#green = this.#blue = undefined;
        this.#name = undefined;
        this.#cssc = undefined;
        return this;
    }
    setHCTMo(h_x, c_x, t_x) {
        this.setHCT(h_x, c_x, t_x);
        this.#mo?.refresh();
        return this;
    }
    SetHCT(h_x, c_x, t_x) {
        return this.dup().setHCT(h_x, c_x, t_x);
    }
    // /**
    //  * "s50"\
    //  * `in( 0 <= val_x && val_x <= 100 )`
    //  * @deprecated
    //  * @const @param val_x [0,100]
    //  */
    // setS(val_x: s_t) {
    //   this.s;
    //   this.#hex =
    //     this.#red =
    //     this.#green =
    //     this.#blue =
    //     this.#name =
    //       undefined; //!
    //   this.#s = val_x;
    //   return this;
    // }
    // /**
    //  * "l50"\
    //  * `in( 0 <= val_x && val_x <= 100 )`
    //  * @deprecated
    //  * @const @param val_x [0,100]
    //  */
    // setL(val_x: l_t) {
    //   this.l;
    //   this.#hex =
    //     this.#red =
    //     this.#green =
    //     this.#blue =
    //     this.#name =
    //       undefined; //!
    //   this.#l = val_x;
    //   return this;
    // }
    /**
     * "a.5"\
     * ! `#name` is not affected\
     * `in( zAlpha.parse(val_x) )`
     * @const @param val_x
     */
    setAlpha(val_x) {
        this.#getRed();
        this.#alpha = val_x;
        this.#hex = undefined;
        this.#cssc = undefined;
        return this;
    }
    setAlphaMo(val_x) {
        this.setAlpha(val_x);
        this.#mo?.refresh();
        return this;
    }
    SetAlpha(val_x) {
        return this.dup().setAlpha(val_x);
    }
    /**
     * "c+.5"
     * Keep `#alpha` unchanged
     * @const @param ratio_x
     */
    enchroma(ratio_x) {
        if (ratio_x === 0)
            return this;
        // console.log( `before unchroma: ${Math.round(this.s)}%` );
        const chroma_ = this.chroma;
        this.setChroma(chroma_ + (100 - chroma_) * ratio_x);
        // console.log( `after unchroma:  ${Math.round(this.s)}%` );
        return this;
    }
    Enchroma(ratio_x) {
        return this.dup().enchroma(ratio_x);
    }
    /**
     * "c-.5"
     * Keep `#alpha` unchanged
     * @const @param ratio_x
     */
    unchroma(ratio_x) {
        if (ratio_x === 0)
            return this;
        // console.log( `before unchroma: ${Math.round(this.s)}%` );
        const chroma_ = this.chroma;
        this.setChroma(chroma_ - chroma_ * ratio_x);
        // console.log( `after unchroma:  ${Math.round(this.s)}%` );
        return this;
    }
    Unchroma(ratio_x) {
        return this.dup().unchroma(ratio_x);
    }
    /**
     * "t+.5"
     * Keep `#alpha` unchanged
     * @const @param ratio_x
     */
    entone(ratio_x) {
        if (ratio_x === 0)
            return this;
        const tone_ = this.tone;
        this.setTone(tone_ + (100 - tone_) * ratio_x);
        return this;
    }
    Entone(ratio_x) {
        return this.dup().entone(ratio_x);
    }
    /**
     * "t-.5"
     * Keep `#alpha` unchanged
     * @const @param ratio_x
     */
    untone(ratio_x) {
        if (ratio_x === 0)
            return this;
        const tone_ = this.tone;
        this.setTone(tone_ - tone_ * ratio_x);
        return this;
    }
    Untone(ratio_x) {
        return this.dup().untone(ratio_x);
    }
    get cssc() {
        if (this.#cssc !== undefined)
            return this.#cssc;
        if (this.#hex !== undefined) {
            this.#cssc = this.#hex;
        }
        else if (this.#red !== undefined) {
            this.#getAlpha();
            this.#cssc =
                `rgb(${this.#red},${this.#green},${this.#blue},${this.#alpha})`;
        }
        else if (this.#hct?.valid) {
            this.#getHex();
            this.#cssc = this.#hex;
        }
        else {
            assert(this.#name);
            this.#cssc = this.#name;
        }
        return this.#cssc;
    }
    repr(typ_x) {
        let ret;
        // Alpha channel of `#hex` and `#alpha` could be inconsistent
        this.#getAlpha();
        /* final switch */ ({
            ["hex"]: () => {
                ret = this.hex;
            },
            ["rgb"]: () => {
                if (Number.apxE(this.#alpha, 1)) {
                    ret = `rgb(${this.red} ${this.green} ${this.blue})`;
                }
                else {
                    ret = `rgb(${this.red} ${this.green} ${this.blue} /${this.#alpha.reprRatio()})`;
                }
            },
            ["hct"]: () => {
                if (Number.apxE(this.#alpha, 1)) {
                    ret = `hct(${this.hue.fixTo(1)} ${this.chroma.fixTo(1)} ${this.tone.fixTo(1)})`;
                }
                else {
                    ret = `hct(${this.hue.fixTo(1)} ${this.chroma.fixTo(1)} ${this.tone.fixTo(1)} /${this.#alpha.reprRatio()})`;
                }
            },
        }[typ_x])();
        return ret;
    }
    registHandler(handler_x) {
        this.mo$.registHandler(handler_x);
    }
    removeHandler(handler_x) {
        this.mo$.removeHandler(handler_x);
    }
    refresh() {
        this.#mo?.refresh();
    }
} // class Colr
export function isColr(obj) {
    return obj.constructor === Colr;
}
// /**
//  * (L1 + 0.05) / (L2 + 0.05)
//  * Ref. "contrast ratio" in https://www.w3.org/TR/WCAG20/#glossary
//  * `in( isColr(colr1) )`
//  * `in( isColr(colr2) )`
//  * @deprecated
//  * @headconst @param colr1
//  * @headconst @param colr2
//  * @return (0,1]
//  */
// export function contrastRatioOf(colr1: Colr, colr2: Colr) {
//   let ligt1 = colr1.l;
//   let ligt2 = colr2.l;
//   if (ligt1 < ligt2) {
//     const ligt = ligt1;
//     ligt1 = ligt2;
//     ligt2 = ligt;
//   }
//   return (ligt1 + .05) / (ligt2 + .05);
// }
export function hexcolr(hexstr_x) {
    return new Colr("hex", hexstr_x);
}
export function rgb(r_x, g_x, b_x) {
    return new Colr("rgb", r_x, g_x, b_x);
}
export function rgba(r_x, g_x, b_x, a_x) {
    return new Colr("rgba", r_x, g_x, b_x, a_x);
}
export function hct(h_x, c_x, t_x) {
    return new Colr("hct", h_x, c_x, t_x);
}
export function hcta(h_x, c_x, t_x, a_x) {
    return new Colr("hcta", h_x, c_x, t_x, a_x);
}
export function csscname(cn_x) {
    return new Colr("name", cn_x);
}
/**
 * `in( isValidCssc(cssc_x) )`
 * @const @param cssc_x
 */
export function createColr(cssc_x = "#00000000") {
    const ret = new Colr();
    if (cssc_x)
        ret.setByCssc(cssc_x);
    return ret;
}
export function randomRed() {
    return Math.clamp(0, Math.round(Math.random() * 0x100), 0xff);
}
export function randomCsscRRR() {
    const r_ = randomRed();
    return `rgb(${r_}, ${r_}, ${r_})`;
}
export function randomCsscRGB() {
    return `rgb(${randomRed()}, ${randomRed()}, ${randomRed()})`;
}
export function randomRRGGBB() {
    const xr = randomRed().toString(16).padStart(2, "0");
    const xg = randomRed().toString(16).padStart(2, "0");
    const xb = randomRed().toString(16).padStart(2, "0");
    return `#${xr}${xg}${xb}`;
}
/*80--------------------------------------------------------------------------*/
export const csscNameMap = new class {
    #map;
    #revmap;
    constructor() {
        this.#map = new Map(csscNameMapData);
        this.#revmap = new Map();
        for (const [k, v] of this.#map)
            this.#revmap.set(v, k);
    }
    hasN(key) {
        return this.#map.has(key);
    }
    getX(key) {
        return this.#map.get(key);
    }
    getN(key) {
        return this.#revmap.get(normalizeCsscHex_(key).slice(0, 7));
    }
}();
/*80--------------------------------------------------------------------------*/
let colr_a_, colr_b_;
export function csscLess(a_x, b_x) {
    colr_a_ ??= createColr();
    colr_b_ ??= createColr();
    colr_a_.setByCssc(a_x);
    colr_b_.setByCssc(b_x);
    if (colr_a_.red === colr_b_.red) {
        if (colr_a_.green === colr_b_.green) {
            if (colr_a_.blue === colr_b_.blue) {
                if (Number.apxE(colr_a_.alpha, colr_b_.alpha)) {
                    return colr_a_.id < colr_b_.id;
                }
                else {
                    return Number.apxS(colr_a_.alpha, colr_b_.alpha);
                }
            }
            else {
                return colr_a_.blue < colr_b_.blue;
            }
        }
        else {
            return colr_a_.green < colr_b_.green;
        }
    }
    else {
        return colr_a_.red < colr_b_.red;
    }
}
/*80--------------------------------------------------------------------------*/
// /**
//  * @param { Number } n0
//  * @const @param { Array } colrpool_x
//  * @return { String } "#112233"
//  */
// export const genColrhex = ( n0=Date.now(), colrpool_x = CalendarBgcolr_a ) =>
// {
//   n0 = Math.abs( Math.floor(n0) );
//   const hexstr = colrpool_x[ n0 % colrpool_x.length ].toString(16);
//   // console.log( `hexstr=${hexstr}` );
//   let r,g,b;
//   switch( hexstr.length )
//   {
//   case 1: r = 0;         g = 0;         b = hexstr[0]; break;
//   case 2: r = 0;         g = hexstr[0]; b = hexstr[1]; break;
//   case 3: r = hexstr[0]; g = hexstr[1]; b = hexstr[2]; break;
//   default: assert(0);
//   }
//   return `#${r}${r}${g}${g}${b}${b}`;
// }
/*80--------------------------------------------------------------------------*/
/**
 * Ref. https://github.com/material-foundation/material-color-utilities/blob/main/typescript/palettes/core_palette.ts
 * Ref. https://m3.material.io/styles/color/static/baseline
 */
export class M3KeyColrs {
    /** Primary */
    a1;
    /** Secondary */
    a2;
    /** Tertiary */
    a3;
    /** Neutral */
    n1;
    /** Neutral variant */
    n2;
    /** Error */
    error;
    /**
     * @const @param src_x
     */
    constructor(src_x) {
        this.a1 = src_x.dup().setTone(40);
        this.a2 = src_x.dup().setChroma(src_x.chroma / 3).setTone(40);
        this.a3 = src_x.dup()
            .setHue((src_x.hue + 60) % 360).setChroma(src_x.chroma / 2).setTone(40);
        this.n1 = src_x.dup().setChroma(Math.min(src_x.chroma / 12, 4)).setTone(98);
        this.n2 = src_x.dup().setChroma(Math.min(src_x.chroma / 6, 8)).setTone(90);
        this.error = src_x.dup().setHue(25).setChroma(84).setTone(40);
    }
    toJSON() {
        return {
            a1: this.a1.hex,
            a2: this.a2.hex,
            a3: this.a3.hex,
            n1: this.n1.hex,
            n2: this.n2.hex,
            error: this.error.hex,
        };
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=Colr.js.map