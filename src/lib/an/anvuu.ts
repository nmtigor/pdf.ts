/*80****************************************************************************
 * anvuu
** ----- */

import { Ratio } from "../alias.ts";
import { Coo, HTMLVuu, SVGVuu } from "../mv.ts";
/*80--------------------------------------------------------------------------*/

/**
 * Can act as static `Vuu`
 */
export class HTMLAnvuu<C extends Coo = Coo, E extends HTMLElement = HTMLElement>
  extends HTMLVuu<C, E> {
  protected readonly anmin$: number;
  protected readonly anmax$: number;
  protected readonly delta$: number;

  /**
   * @headconst @param coo_x
   * @headconst @param el_x
   * @const @param anmin
   * @const @param anmax
   */
  constructor(coo_x: C, el_x: E, anmin = 0, anmax = 100) {
    super(coo_x, el_x);

    this.anmin$ = anmin;
    this.anmax$ = anmax;
    this.delta$ = anmax - anmin;

    // this.anval$ = anmin; /** @member { Number } */
  }

  // get anmin() { return this.anmin$; }
  // get anmax() { return this.anmax$; }

  /**
   * @const @param anval_x
   */
  set anval(anval_x: number) {}

  /** @final */
  init() {
    this.anval = this.anmin$;
  }
  fina() {
    this.anval = this.anmax$;
  }

  /**
   * @final
   * @const @param ratio_x
   */
  setByRatio(ratio_x: Ratio) {
    this.anval = this.anmin$ + this.delta$ * ratio_x;
  }
}

export class SVGYAnvuu extends SVGVuu {
  //jjjj
}
/*80--------------------------------------------------------------------------*/

export class TransX extends HTMLAnvuu {
  x0 = 0;
  x1 = 0;
  dx = this.x1 - this.x0;

  set x0dx(val_x: number) {
    this.x0 = val_x;
    this.dx = this.x1 - val_x;
  }
  set x1dx(val_x: number) {
    this.x1 = val_x;
    this.dx = val_x - this.x0;
  }

  override set anval(anval_x: number) {
    const ratio = (anval_x - this.anmin$) / this.delta$;
    // console.log( this.x0 + this.dx * ratio );
    Object.assign(this.el.style, {
      left: `${this.x0 + this.dx * ratio}px`,
    });
  }
}

export class Translate extends HTMLAnvuu {
  x0 = 0;
  x1 = 0;
  y0 = 0;
  y1 = 0;
  dx = this.x1 - this.x0;
  dy = this.y1 - this.y0;

  set x0dx(val_x: number) {
    this.x0 = val_x;
    this.dx = this.x1 - val_x;
  }
  set x1dx(val_x: number) {
    this.x1 = val_x;
    this.dx = val_x - this.x0;
  }
  set y0dy(val_x: number) {
    this.y0 = val_x;
    this.dy = this.y1 - val_x;
  }
  set y1dy(val_x: number) {
    this.y1 = val_x;
    this.dy = val_x - this.y0;
  }

  override set anval(anval_x: number) {
    const ratio = (anval_x - this.anmin$) / this.delta$;
    // console.log( this.x0 + this.dx * ratio );
    Object.assign(this.el.style, {
      left: `${this.x0 + this.dx * ratio}px`,
      top: `${this.y0 + this.dy * ratio}px`,
    });
  }
}
/*80--------------------------------------------------------------------------*/

export class Transwidt extends HTMLAnvuu {
  w0 = 0;
  w1 = 0;
  dw = this.w1 - this.w0;

  set w0dw(val_x: number) {
    this.w0 = val_x;
    this.dw = this.w1 - val_x;
  }
  set w1dw(val_x: number) {
    this.w1 = val_x;
    this.dw = val_x - this.w0;
  }

  override set anval(anval_x: number) {
    const ratio = (anval_x - this.anmin$) / this.delta$;
    Object.assign(this.el.style, {
      width: `${this.w0 + this.dw * ratio}px`,
    });
  }
}

export class Transhigt extends HTMLAnvuu {
  h0 = 0;
  h1 = 0;
  dh = this.h1 - this.h0;

  set h0dh(val_x: number) {
    this.h0 = val_x;
    this.dh = this.h1 - val_x;
  }
  set h1dh(val_x: number) {
    this.h1 = val_x;
    this.dh = val_x - this.h0;
  }

  override set anval(anval_x: number) {
    const ratio = (anval_x - this.anmin$) / this.delta$;
    Object.assign(this.el.style, {
      height: `${this.h0 + this.dh * ratio}px`,
    });
  }
}

export class Transsize extends HTMLAnvuu {
  w0 = 0;
  w1 = 0;
  h0 = 0;
  h1 = 0;
  dw = this.w1 - this.w0;
  dh = this.h1 - this.h0;

  set w0dw(val_x: number) {
    this.w0 = val_x;
    this.dw = this.w1 - val_x;
  }
  set w1dw(val_x: number) {
    this.w1 = val_x;
    this.dw = val_x - this.w0;
  }
  set h0dh(val_x: number) {
    this.h0 = val_x;
    this.dh = this.h1 - val_x;
  }
  set h1dh(val_x: number) {
    this.h1 = val_x;
    this.dh = val_x - this.h0;
  }

  override set anval(anval_x: number) {
    const ratio = (anval_x - this.anmin$) / this.delta$;
    // console.log( this.w0 + this.dw * ratio );
    Object.assign(this.el.style, {
      width: `${this.w0 + this.dw * ratio}px`,
      height: `${this.h0 + this.dh * ratio}px`,
    });
  }
}
/*80--------------------------------------------------------------------------*/

export class Transopac extends HTMLAnvuu {
  a0 = 0;
  a1 = 0;
  da = this.a1 - this.a0;

  set a0da(val_x: number) {
    this.a0 = val_x;
    this.da = this.a1 - val_x;
  }
  set a1da(val_x: number) {
    this.a1 = val_x;
    this.da = val_x - this.a0;
  }

  override set anval(anval_x: number) {
    const ratio = (anval_x - this.anmin$) / this.delta$;
    // console.log( this.a0 + this.da * ratio );
    Object.assign(this.el.style, {
      opacity: `${this.a0 + this.da * ratio}`,
    });
  }
}
/*80--------------------------------------------------------------------------*/
