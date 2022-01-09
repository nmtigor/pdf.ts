/*81*****************************************************************************
 * progressbar
** ----------- */

import { Cssc } from "../colr.js";
import { div } from "../dom.js";
import { Coo } from "../mv.js";
import { HTMLAnvuu } from "../an/anvuu.js";
import { Anprogress } from "../an/anprogress.js";
/*81---------------------------------------------------------------------------*/

export class Progressbar<C extends Coo=Coo> extends HTMLAnvuu<C, HTMLDivElement>
{
  readonly higt:number;

  protected readonly slider_el$ = div();

  readonly anp;

  /**
   * @param { headconst } coo_x
   * @param { const } higt_x
   * @param { const } bg_cssc_x
   * @param { const } fg_cssc_x
   * @param { const } min_x in milliseconds  
   * @param { const } max_x in milliseconds  
   */
  constructor( coo_x:C, higt_x:number, 
    bg_cssc_x:Cssc, fg_cssc_x:Cssc, min_x:number, max_x:number 
  ) {
    super( coo_x, div() );

    this.higt = higt_x;
    
    Object.assign( this.el$.style, {
      height: `${higt_x}px`,
      backgroundColor: bg_cssc_x,
    });

    Object.assign( this.slider_el$.style, {
      width: "0%",
      height: "100%",
      backgroundColor: fg_cssc_x,
    });
    
    this.el$.append( this.slider_el$ );

    this.anp = new Anprogress( min_x, max_x, this );
  }

  override set anval( anval_x:number ) 
  { 
    // console.log(">>>>>>> Progressbar.anval() >>>>>>>");
    this.slider_el$.style.width = 
      `${(anval_x - this.anmin$) / (this.delta$) * 100}%`;
  }

  set fgcolr( fg_cssc_x:Cssc )
  {
    this.slider_el$.style.backgroundColor = fg_cssc_x;
  }
}
/*81---------------------------------------------------------------------------*/

export class HoldIndicatr<C extends Coo=Coo> extends Progressbar<C>
{
  #idle = true;
  /**
   * ! Can not detect by `this.anp.st & Anprogress_ST.stop`,
   * ! b/c `anp.st` could change in the next tick, not immediately.
   */
  get idle() { return this.#idle; }

  /**
   * @param { headconst } coo_x
   * @param { const } cssc_x
   * @param { const } zIndex_x
   */
  constructor( coo_x:C, fg_cssc_x:Cssc, bottom_x:number, zIndex_x=1000 )
  {
    super( coo_x, 3, "transparent", fg_cssc_x, 0, 1 );

    Object.assign( this.el$.style, {
      display: "none",
      width: "100%",
      position: "absolute",
      bottom: `${bottom_x}px`,
      zIndex: zIndex_x,
    });

    // this.anp.st_mo.registHandler( newval => {
    //   if( newval & Anprogress_ST.stop )
    //   {
    //     this.slider_el$.style.backgroundColor = fg_stop_cssc_x;
    //   }
    //   else if( newval & Anprogress_ST.strt )
    //   {
    //     this.slider_el$.style.backgroundColor = fg_cssc_x;
    //   }
    // });
  }

  stop()
  {
    this.anp.stop();
    this.el$.style.display = "none";
    this.#idle = true;
  }

  /**
   * @param { const } max_x >0, in milliseconds  
   */
  play( max_x:number )
  {
    this.#idle = false;
    this.el$.style.display = "unset";
    this.anp.reset( 0, max_x ).play();
  }
}
/*81---------------------------------------------------------------------------*/
