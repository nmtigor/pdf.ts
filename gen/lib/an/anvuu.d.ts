import { Ratio } from "../alias.js";
import { Coo, HTMLVuu, SVGVuu } from "../mv.js";
/**
 * Can act as static `Vuu`
 */
export declare class HTMLAnvuu<C extends Coo = Coo, E extends HTMLElement = HTMLElement> extends HTMLVuu<C, E> {
    protected readonly anmin$: number;
    protected readonly anmax$: number;
    protected readonly delta$: number;
    /**
     * @headconst @param coo_x
     * @headconst @param el_x
     * @const @param anmin
     * @const @param anmax
     */
    constructor(coo_x: C, el_x: E, anmin?: number, anmax?: number);
    /**
     * @const @param anval_x
     */
    set anval(anval_x: number);
    /** @final */
    init(): void;
    fina(): void;
    /**
     * @final
     * @const @param ratio_x
     */
    setByRatio(ratio_x: Ratio): void;
}
export declare class SVGYAnvuu extends SVGVuu {
}
export declare class TransX extends HTMLAnvuu {
    x0: number;
    x1: number;
    dx: number;
    set x0dx(val_x: number);
    set x1dx(val_x: number);
    set anval(anval_x: number);
}
export declare class Translate extends HTMLAnvuu {
    x0: number;
    x1: number;
    y0: number;
    y1: number;
    dx: number;
    dy: number;
    set x0dx(val_x: number);
    set x1dx(val_x: number);
    set y0dy(val_x: number);
    set y1dy(val_x: number);
    set anval(anval_x: number);
}
export declare class Transwidt extends HTMLAnvuu {
    w0: number;
    w1: number;
    dw: number;
    set w0dw(val_x: number);
    set w1dw(val_x: number);
    set anval(anval_x: number);
}
export declare class Transhigt extends HTMLAnvuu {
    h0: number;
    h1: number;
    dh: number;
    set h0dh(val_x: number);
    set h1dh(val_x: number);
    set anval(anval_x: number);
}
export declare class Transsize extends HTMLAnvuu {
    w0: number;
    w1: number;
    h0: number;
    h1: number;
    dw: number;
    dh: number;
    set w0dw(val_x: number);
    set w1dw(val_x: number);
    set h0dh(val_x: number);
    set h1dh(val_x: number);
    set anval(anval_x: number);
}
export declare class Transopac extends HTMLAnvuu {
    a0: number;
    a1: number;
    da: number;
    set a0da(val_x: number);
    set a1da(val_x: number);
    set anval(anval_x: number);
}
//# sourceMappingURL=anvuu.d.ts.map