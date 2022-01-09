/*81*****************************************************************************
 * colr
** ---- */

import { assert } from "./util/trace.js";
import { uint8, Ratio } from "./alias.js";
/*81---------------------------------------------------------------------------*/

type CsscHex  = string; /** "#123" or "#1234" or "#123456" or "#12345678" */
type CsscRGB  = string; /** "rgb(25, 55, 55)" */
type CsscRGBA = string; /** "rgb(25, 55, 55, .3)" */
type CsscHSL  = string; /** "hsl(120, 60%, 10%)" */
type CsscHSLA = string; /** "hsl(120, 60%, 10%, .7)" */

type ColrTyp =
  | "hex"
  | "rgb"
  | "rgba"
  | "hsl"
  | "hsla"
  | "name"
;

export type X_t = CsscHex; /** normalized CsscHex, i.e., "#12abc6" or "#12abc678" */
function normalize_CsscHex( csschex:CsscHex ):X_t
{
  let ret:X_t = "";
  csschex = csschex.toLowerCase();
  switch( csschex.length )
  {
  case 4: // "#123"
    ret = `#${csschex[1]}${csschex[1]}${csschex[2]}${csschex[2]}${csschex[3]}${csschex[3]}`; 
    break;
  case 5: // "#1234"
    if( csschex.endsWith("f") )
         ret = `#${csschex[1]}${csschex[1]}${csschex[2]}${csschex[2]}${csschex[3]}${csschex[3]}`; 
    else ret = `#${csschex[1]}${csschex[1]}${csschex[2]}${csschex[2]}${csschex[3]}${csschex[3]}${csschex[4]}${csschex[4]}`; 
    break;
  case 7: // "#123456"
    ret = csschex;
    break;
  case 9: // "#12345678"
    if( csschex.endsWith("ff") )
         ret = csschex.slice( 0, 7 );
    else ret = csschex;
    break;
  default: assert(0);
  }
  return ret;
}
type R_t = uint8;
type G_t = uint8;
type B_t = uint8;
type H_t = number; /* [0,360) */
type S_t = number; /* [0,100] */
type L_t = number; /* [0,100] */
type A_t = Ratio;

// const R = UInt8;
// const G = UInt8;
// const B = UInt8;

/**
 * css color string excluding `currentcolor`
 * ref. https://www.w3schools.com/cssref/css_colors_legal.asp
 */
export type Cssc = CsscHex | CsscRGB | CsscRGBA | CsscHSL | CsscHSLA | CsscName;

/** @final */
export class Colr
{
  #x:X_t | undefined;
  #r:R_t | undefined; #g:G_t | undefined; #b:B_t | undefined;
  #h:H_t | undefined; #s:S_t | undefined; #l:L_t | undefined;
  #a:A_t | undefined;

  #name:CsscName | undefined;

  /**
   * @param { const } typ_x
   * @param { const } dat_x
   */
  constructor( typ_x?:ColrTyp, 
    ...dat_x:[ (CsscHex|R_t|H_t|CsscName)?, (G_t|S_t)?, (B_t|L_t)?, A_t? ] 
  ) {
    switch( typ_x ) 
    {
    case "hex":
      // assert( dat_x.length == 1 );
      /**
       * @var s
       * "123" or "#123" or
       * "1234" or "#1234" or
       * "123456" or "#123456" or
       * "12345678" or "#12345678" or
       */
      const s = <CsscHex>dat_x[0];
      this.#x = normalize_CsscHex( s.startsWith("#") ? s : `#${s}` );
      break;
    case "rgb":
      // assert( dat_x.length == 3 );
      this.#r = <R_t>dat_x[0];
      this.#g = <G_t>dat_x[1];
      this.#b = <B_t>dat_x[2];
      break;
    case "rgba":
      // assert( dat_x.length == 4 );
      this.#r = <R_t>dat_x[0];
      this.#g = <G_t>dat_x[1];
      this.#b = <B_t>dat_x[2];
      this.#a = <A_t>dat_x[3];
      break;
    case "hsl":
      // assert( dat_x.length == 3 );
      this.#h = <H_t>dat_x[0];
      this.#s = <S_t>dat_x[1];
      this.#l = <L_t>dat_x[2];
      break;
    case "hsla":
      // assert( dat_x.length == 4 );
      this.#h = <H_t>dat_x[0];
      this.#s = <S_t>dat_x[1];
      this.#l = <L_t>dat_x[2];
      this.#a = <A_t>dat_x[3];
      break;
    case "name":
      this.#name = <CsscName>dat_x[0];
      break;
    }
  }

  /**
   * in( isValidCssc(cssc) );
   * @param { const } cssc 
   */
  set_by_s( cssc:Cssc )
  {
    if( cssc.startsWith("#") ) 
    {
      this.#x = normalize_CsscHex( cssc );

      this.#r = this.#g = this.#b =
      this.#h = this.#s = this.#l =
      this.#a =
      this.#name = undefined;
    }
    else if( csscname_m.hasN(cssc) )
    {
      this.#name = <CsscName>cssc;
      
      this.#x = 
      this.#r = this.#g = this.#b =
      this.#h = this.#s = this.#l =
      this.#a = undefined;
    }
    else {
      const compo_a = cssc
        .replace(/[^\.\d,]/g,"")
        .split(",")
        .map( s => parseFloat(s) );
      if( cssc.startsWith("rgba") )
      {
        this.#r = compo_a[0];
        this.#g = compo_a[1];
        this.#b = compo_a[2];
        this.#a = compo_a[3];

        this.#x =
        this.#h = this.#s = this.#l = 
        this.#name = undefined;
      }
      else if( cssc.startsWith("hsla") )
      {
        this.#h = compo_a[0];
        this.#s = compo_a[1];
        this.#l = compo_a[2];
        this.#a = compo_a[3];

        this.#x =
        this.#r = this.#g = this.#b = 
        this.#name = undefined;
      }
      else if( cssc.startsWith("rgb") )
      {
        this.#r = compo_a[0];
        this.#g = compo_a[1];
        this.#b = compo_a[2];

        this.#x =
        this.#h = this.#s = this.#l =
        this.#a =
        this.#name = undefined
      }
      else if( cssc.startsWith("hsl") )
      {
        this.#h = compo_a[0];
        this.#s = compo_a[1];
        this.#l = compo_a[2];

        this.#x =
        this.#r = this.#g = this.#b =
        this.#a = 
        this.#name = undefined;
      }
      else assert(0);
    }
    return this;
  }

  /**
   * in( colr );
   * @param { const } colr 
   */
  set_by_c( colr:Colr )
  {
    this.#x = colr.#x;
    this.#r = colr.#r;
    this.#g = colr.#g;
    this.#b = colr.#b;
    this.#h = colr.#h;
    this.#s = colr.#s;
    this.#l = colr.#l;
    this.#a = colr.#a;
    this.#name = colr.#name;
    return this;
  }
  
  dup() { return (new Colr()).set_by_c( this ); }

  get x():X_t
  {
    if( this.#x !== undefined ) return this.#x;

    if( this.#name !== undefined )
    {
      this.#x = csscname_m.getX( this.#name );
    }
    else {
      const xr = this.r.toString(16).padStart(2,"0");
      const xg = this.g.toString(16).padStart(2,"0");
      const xb = this.b.toString(16).padStart(2,"0");
      this.#x = `#${xr}${xg}${xb}`.toLowerCase();
    }
    
    assert( this.#x && this.#x.length === 7 );
    if( this.a < 1 )
    {
      const xa = Math.round( this.a * 0xff ).toString(16).padStart(2,"0").toLowerCase();
      if( xa !== "ff" ) this.#x += xa;
    }

    return <X_t>this.#x;
  }
  eq( rhs:Colr ) { return rhs === this || rhs.x === this.x; }

  /**
   * in( this.#x !== undefined )
   */
  #byX()
  {
    let i = parseInt( this.#x!.slice(1), 16 );
    switch( this.#x!.length )
    {
    case 7:
      this.#r = (i >> 16) & 0xFF;
      this.#g = (i >> 8) & 0xFF;
      this.#b = i & 0xFF;
      this.#a = 1;
      break;
    case 9:
      this.#r = (i >> 24) & 0xFF;
      this.#g = (i >> 16) & 0xFF;
      this.#b = (i >> 8) & 0xFF;
      this.#a = (i & 0xFF) / 0xFF;
      break;
    default: assert(0);
    }
  }
  get r():R_t
  {
    if( this.#r !== undefined ) return this.#r;

    if( this.#x !== undefined ) this.#byX();
    else if( this.#name !== undefined ) { this.x; this.#byX(); }
    else if( this.#h !== undefined )
    {
      let h = <H_t>this.#h / 360; // do not use this.h to prevent protential infinite loop
      let s = <S_t>this.#s / 100; // ditto
      let l = <L_t>this.#l / 100; // ditto

      if( s === 0 ) this.#r = this.#g = this.#b = Math.round( l * 255 );
      else {
        let t2;
        if( l < 0.5 ) 
             t2 = l * (1 + s);
        else t2 = l + s - l * s;

        let t1 = 2 * l - t2;

        let rgb = [0, 0, 0];
        for( let i = 0; i < 3; i++ ) 
        {
          let t3 = h + 1 / 3 * -(i - 1);
          if( t3 < 0 ) t3++;
          if (t3 > 1) t3--;

          let val;
          if( 6 * t3 < 1 ) val = t1 + (t2 - t1) * 6 * t3;
          else if( 2 * t3 < 1 ) val = t2;
          else if( 3 * t3 < 2 ) val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
          else val = t1;

          rgb[i] = Math.min( Math.round( val*255 ), 255 );
        }
        this.#r = rgb[0];
        this.#g = rgb[1];
        this.#b = rgb[2];
      }
    }
    else assert(0);
    return <R_t>this.#r;
  }
  get g():G_t
  {
    if( this.#g !== undefined ) return this.#g;

    this.r;
    assert( this.#g !== undefined );
    return <G_t><unknown>this.#g;
  }
  get b():B_t
  {
    if( this.#b !== undefined ) return this.#b;

    this.r;
    assert( this.#b !== undefined );
    return <B_t><unknown>this.#b;
  }

  get h():H_t
  {
    if( this.#h !== undefined ) return this.#h;

    let r = Number(this.r) / 255;
    let g = Number(this.g) / 255;
    let b = Number(this.b) / 255;
    let min = Math.min( r, g, b );
    let max = Math.max( r, g, b );
    let delta = max - min;
    let h,s,l;

    if( max === min ) h = 0;
    else if( r === max ) h = (g - b) / delta;
    else if( g === max ) h = 2 + (b - r) / delta;
    else if( b === max ) h = 4 + (r - g) / delta;

    h = Math.min( <number>h * 60, 360 );

    if( h < 0 ) h += 360;

    l = (min + max) / 2;

    if (max === min) s = 0;
    else if( l <= 0.5 ) s = delta / (max + min);
    else s = delta / (2 - max - min);

    this.#h = h;
    this.#s = s * 100;
    this.#l = l * 100;
    // console.log( `rgb=(${this.#r},${this.#g},${this.#b})` );
    // console.log( `hsl=(${this.#h},${this.#s},${this.#l})` );
    return this.#h;
  }
  get s():S_t
  {
    if( this.#s !== undefined ) return this.#s;

    this.h;
    assert( this.#s !== undefined );
    return <S_t><unknown>this.#s;
  }
  get l():L_t
  {
    if( this.#l !== undefined ) return this.#l;

    this.h;
    assert( this.#l !== undefined );
    return <L_t><unknown>this.#l;
  }

  get a():A_t { return this.#a === undefined ? 1 : this.#a; }

  get name():CsscName|undefined
  {
    if( this.#name !== undefined ) return this.#name;

    return csscname_m.getN( this.x );
  }
  
  /**
   * "n"
   */
  negate()
  {
    this.#r = 255 - this.r;
    this.#g = 255 - this.g;
    this.#b = 255 - this.b;

    this.#x =
    this.#h = this.#s = this.#l =
    this.#name = undefined; //!

    return this;
  }

  // ref. YIQ equation from http://24ways.org/2010/calculating-color-contrast
  get isdark() 
  { 
    return ( (
      Number(this.r)*299 + 
      Number(this.g)*587 + 
      Number(this.b)*114) / 1000 ) < 128; 
  }
  // get isdark() { return this.l < 50; }
  get isligt() { return !this.isdark; }

  /**
   * "l+.5"
   * @param { const } ratio_x
   */
  ligten( ratio_x:Ratio )
  {
    if( ratio_x === 0 ) return this;

    this.#l = this.l + (100 - this.l) * ratio_x;

    this.#x =
    this.#r = this.#g = this.#b = 
    this.#name = undefined; //!

    return this;
  }
  /**
   * "l-.5"
   * @param { const } ratio_x
   */
  darken( ratio_x:Ratio )
  {
    if( ratio_x === 0 ) return this;

    this.#l = this.l - this.l * ratio_x;

    this.#x =
    this.#r = this.#g = this.#b =
    this.#name = undefined; //!

    return this;
  }

  /**
   * "s+.5"
   * @param { const } ratio_x
   */
  saturate( ratio_x:Ratio )
  {
    if( ratio_x === 0 ) return this;

    // console.log( `before desaturate: ${Math.round(this.s)}%` );
    this.#s = this.s + (100 - this.s) * ratio_x;
    // console.log( `after desaturate:  ${Math.round(this.s)}%` );

    this.#x =
    this.#r = this.#g = this.#b =
    this.#name = undefined; //!
    
    return this;
  }
  /**
   * "s-.5"
   * @param { const } ratio_x
   */
  desaturate( ratio_x:Ratio )
  {
    if( ratio_x === 0 ) return this;

    // console.log( `before desaturate: ${Math.round(this.s)}%` );
    this.#s = this.s - this.s * ratio_x;
    // console.log( `after desaturate:  ${Math.round(this.s)}%` );

    this.#x =
    this.#r = this.#g = this.#b =
    this.#name = undefined; //!

    return this;
  }

  /**
   * "r50"
   * in( 0 <= val_x && val_x < 256 )
   * @param { const } val_x - [0,255]
   */
  setR( val_x:R_t )
  { 
    this.r;

    this.#x =
    this.#h = this.#s = this.#l =
    this.#name = undefined; //!

    this.#r = val_x; 
    
    return this; 
  }
  /**
   * "g50"
   * in( 0 <= val_x && val_x < 256 )
   * @param { const } val_x - [0,255]
   */
  setG( val_x:G_t )
  { 
    this.g;

    this.#x =
    this.#h = this.#s = this.#l = 
    this.#name = undefined; //!

    this.#g = val_x; 
    
    return this; 
  }
  /**
   * "b50"
   * in( 0 <= val_x && val_x < 256 )
   * @param { const } val_x - [0,255]
   */
  setB( val_x:B_t )
  { 
    this.b;

    this.#x =
    this.#h = this.#s = this.#l = 
    this.#name = undefined; //!

    this.#b = val_x; 
    
    return this; 
  }

  /**
   * "h50"
   * in( 0 <= val_x && val_x < 360 )
   * @param { const } val_x - [0,360)
   */
  setH( val_x:H_t )
  { 
    this.h;

    this.#x =
    this.#r = this.#g = this.#b = 
    this.#name = undefined; //!

    this.#h = val_x; 
    
    return this; 
  }
  /**
   * "s50"
   * in( 0 <= val_x && val_x <= 100 )
   * @param { const } val_x - [0,100]
   */
  setS( val_x:S_t )
  { 
    this.s;

    this.#x =
    this.#r = this.#g = this.#b = 
    this.#name = undefined; //!

    this.#s = val_x; 
    
    return this; 
  }
  /**
   * "l50"
   * in( 0 <= val_x && val_x <= 100 )
   * @param { const } val_x - [0,100]
   */
  setL( val_x:L_t )
  { 
    this.l;

    this.#x =
    this.#r = this.#g = this.#b = 
    this.#name = undefined; //!

    this.#l = val_x; 
    
    return this; 
  }

  /**
   * "a.5"
   * in( 0 <= val_x && val_x <= 1 )
   * @param { const } val_x
   */
  setA( val_x:A_t )
  { 
    if( this.#r === undefined && this.#h === undefined ) 
      this.r;

    this.#x = undefined; //!

    this.#a = val_x; 

    return this; 
  }

  get cssc():Cssc
  {
    if( this.#x !== undefined ) return this.#x;
    else if( this.#r !== undefined ) 
    {
      if( this.#a === undefined || this.#a === 1 ) 
           return `rgb(${this.#r},${this.#g},${this.#b})`;
      else return `rgba(${this.#r},${this.#g},${this.#b},${this.#a})`;
    }
    else if( this.#h !== undefined ) 
    {
      if( this.#a === undefined || this.#a === 1 ) 
           return `hsl(${this.#h},${this.#s}%,${this.#l}%)`;
      else return `hsla(${this.#h},${this.#s}%,${this.#l}%,${this.#a})`;
    }
    else {
      assert( this.#name );
      return <CsscName>this.#name;
    }
  }
} // class Colr

export function isColr( obj:Object ) { return obj.constructor === Colr; }

/**
 * (L1 + 0.05) / (L2 + 0.05)
 * Ref. "contrast ratio" in https://www.w3.org/TR/WCAG20/#glossary
 * in( isColr(colr1) )
 * in( isColr(colr2) )
 * @param { headconst } colr1 
 * @param { headconst } colr2 
 * @return (0,1]
 */
export function contrastRatioOf( colr1:Colr, colr2:Colr )
{
  let ligt1 = colr1.l;
  let ligt2 = colr2.l;
  if( ligt1 < ligt2 )
  {
    const ligt = ligt1;
    ligt1 = ligt2;
    ligt2 = ligt;
  }
  return (ligt1 + .05) / (ligt2 + .05);
}

const style_ = (new Option()).style;
/**
 * @param { const } cssc 
 */
export function isValidCssc( cssc:string ):Cssc|false
{
  if( cssc === "currentcolor" ) return false;

  style_.color = "";
  style_.color = cssc;
  // console.log( style_.color );
  return !!style_.color ? <Cssc>cssc : false;
}
// console.log( isValidCssc("#23202F") );

export function hexcolr( hexstr:CsscHex          ) { return new Colr( "hex", hexstr ); }
export function rgb(  r:R_t, g:G_t, b:B_t        ) { return new Colr( "rgb", r, g, b ); }
export function rgba( r:R_t, g:G_t, b:B_t, a:A_t ) { return new Colr( "rgba", r, g, b, a ); }
export function hsl(  h:H_t, s:S_t, l:L_t        ) { return new Colr( "hsl", h, s, l ); }
export function hsla( h:H_t, s:S_t, l:L_t, a:A_t ) { return new Colr( "hsla", h, s, l, a ); }
export function csscname( cn:CsscName            ) { return new Colr( "name", cn ); }
/**
 * in( isValidCssc(cssc) )
 * @param { const } cssc 
 */
export function createColr( cssc?:Cssc ):Colr
{
  const ret = new Colr();
  if( cssc ) ret.set_by_s( cssc );
  return ret;
}
/*81---------------------------------------------------------------------------*/

/**
 * Ref. https://www.w3schools.com/colors/colors_groups.asp
 */
type CsscName = 
  /* Pink Colors */
  | "pink"                 | "lightpink"            | "hotpink"
  | "deeppink"             | "palevioletred"        | "mediumvioletred"
  /* Purple Colors */
  | "lavender"             | "thistle"              | "plum"
  | "orchid"               | "violet"               | "fuchsia"
  | "magenta"              | "mediumorchid"         | "darkorchid"
  | "darkviolet"           | "blueviolet"           | "darkmagenta"
  | "purple"               | "mediumpurple"         | "mediumslateblue"
  | "slateblue"            | "darkslateblue"        | "rebeccapurple"
  | "indigo"
  /* Red Colors */
  | "lightsalmon"          | "salmon"               | "darksalmon"
  | "lightcoral"           | "indianred"            | "crimson"
  | "red"                  | "firebrick"            | "darkred"
  /* Orange Colors */
  | "orange"               | "darkorange"           | "coral"
  | "tomato"               | "orangered"
  /* Yellow Colors */
  | "gold"                 | "yellow"               | "lightyellow"
  | "lemonchiffon"         | "lightgoldenrodyellow" | "papayawhip"
  | "moccasin"             | "peachpuff"            | "palegoldenrod"
  | "khaki"                | "darkkhaki"
  /* Green Colors */
  | "greenyellow"          | "chartreuse"           | "lawngreen"
  | "lime"                 | "limegreen"            | "palegreen"
  | "lightgreen"           | "mediumspringgreen"    | "springgreen"
  | "mediumseagreen"       | "seagreen"             | "forestgreen"
  | "green"                | "darkgreen"            | "yellowgreen"
  | "olivedrab"            | "darkolivegreen"       | "mediumaquamarine"
  | "darkseagreen"         | "lightseagreen"        | "darkcyan"
  | "teal"
  /* Cyan Colors*/
  | "aqua"                 | "cyan"                 | "lightcyan"
  | "paleturquoise"        | "aquamarine"           | "turquoise"
  | "mediumturquoise"      | "darkturquoise"
  /* Blue Colors*/
  | "cadetblue"            | "steelblue"            | "lightsteelblue"
  | "lightblue"            | "powderblue"           | "lightskyblue"
  | "skyblue"              | "cornflowerblue"       | "deepskyblue"
  | "dodgerblue"           | "royalblue"            | "blue"
  | "mediumblue"           | "darkblue"             | "navy"
  | "midnightblue"
  /* Brown Colors*/
  | "cornsilk"             | "blanchedalmond"       | "bisque"
  | "navajowhite"          | "wheat"                | "burlywood"
  | "tan"                  | "rosybrown"            | "sandybrown"
  | "goldenrod"            | "darkgoldenrod"        | "peru"
  | "chocolate"            | "olive"                | "saddlebrown"
  | "sienna"               | "brown"                | "maroon"
  /* White Colors*/
  | "white"                | "snow"                 | "honeydew"
  | "mintcream"            | "azure"                | "aliceblue"
  | "ghostwhite"           | "whitesmoke"           | "seashell"
  | "beige"                | "oldlace"              | "floralwhite"
  | "ivory"                | "antiquewhite"         | "linen"
  | "lavenderblush"        | "mistyrose"
  /* Grey Colors*/
  | "gainsboro"            | "lightgray"            | "silver"
  | "darkgray"             | "dimgray"              | "gray"
  | "lightslategray"       | "slategray"            | "darkslategray"
  | "black"
;

/** @final */
class CsscNameMap
{
  #map:ReadonlyMap< CsscName, X_t >;
  #revmap:Map< X_t, CsscName >;

  constructor( marg:any )
  {
    this.#map = new Map( marg );

    this.#revmap = new Map();
    for( const [k,v] of this.#map ) this.#revmap.set( v, k );
  }

  hasN( key:string ) 
  { 
    return this.#map.has( <CsscName>key ); 
  }

  getX( key:CsscName ):X_t|undefined { return this.#map.get(key); }

  getN( key:CsscHex ):CsscName|undefined
  {
    return this.#revmap.get( normalize_CsscHex(key).slice(0,7) );
  }
}

export const csscname_m = new CsscNameMap([
  /* Pink Colors */
  ["pink","#ffc0cb"],                 ["lightpink","#ffb6c1"],            ["hotpink","#ff69b4"],
  ["deeppink","#ff1493"],             ["palevioletred","#db7093"],        ["mediumvioletred","#c71585"],
  /* Purple Colors */
  ["lavender","#e6e6fa"],             ["thistle","#d8bfd8"],              ["plum","#dda0dd"],
  ["orchid","#da70d6"],               ["violet","#ee82ee"],               ["fuchsia","#ff00ff"],
  ["magenta","#ff00ff"],              ["mediumorchid","#ba55d3"],         ["darkorchid","#9932cc"],
  ["darkviolet","#9400d3"],           ["blueviolet","#8a2be2"],           ["darkmagenta","#8b008b"],
  ["purple","#800080"],               ["mediumpurple","#9370db"],         ["mediumslateblue","#7b68ee"],
  ["slateblue","#6a5acd"],            ["darkslateblue","#483d8b"],        ["rebeccapurple","#663399"],
  ["indigo","#4b0082"],
  /* Red Colors */
  ["lightsalmon","#ffa07a"],          ["salmon","#fa8072"],               ["darksalmon","#e9967a"],
  ["lightcoral","#f08080"],           ["indianred","#cd5c5c"],            ["crimson","#dc143c"],
  ["red","#ff0000"],                  ["firebrick","#b22222"],            ["darkred","#8b0000"],
  /* Orange Colors */
  ["orange","#ffa500"],               ["darkorange","#ff8c00"],           ["coral","#ff7f50"],
  ["tomato","#ff6347"],               ["orangered","#ff4500"],
  /* Yellow Colors */
  ["gold","#ffd700"],                 ["yellow","#ffff00"],               ["lightyellow","#ffffe0"],
  ["lemonchiffon","#fffacd"],         ["lightgoldenrodyellow","#fafad2"], ["papayawhip","#ffefd5"],
  ["moccasin","#ffe4b5"],             ["peachpuff","#ffdab9"],            ["palegoldenrod","#eee8aa"],
  ["khaki","#f0e68c"],                ["darkkhaki","#bdb76b"],
  /* Green Colors */
  ["greenyellow","#adff2f"],          ["chartreuse","#7fff00"],           ["lawngreen","#7cfc00"],
  ["lime","#00ff00"],                 ["limegreen","#32cd32"],            ["palegreen","#98fb98"],
  ["lightgreen","#90ee90"],           ["mediumspringgreen","#00fa9a"],    ["springgreen","#00ff7f"],
  ["mediumseagreen","#3cb371"],       ["seagreen","#2e8b57"],             ["forestgreen","#228b22"],
  ["green","#008000"],                ["darkgreen","#006400"],            ["yellowgreen","#9acd32"],
  ["olivedrab","#6b8e23"],            ["darkolivegreen","#556b2f"],       ["mediumaquamarine","#66cdaa"],
  ["darkseagreen","#8fbc8f"],         ["lightseagreen","#20b2aa"],        ["darkcyan","#008b8b"],
  ["teal","#008080"],
  /* Cyan Colors */
  ["aqua","#00ffff"],                 ["cyan","#00ffff"],                 ["lightcyan","#e0ffff"],
  ["paleturquoise","#afeeee"],        ["aquamarine","#7fffd4"],           ["turquoise","#40e0d0"],
  ["mediumturquoise","#48d1cc"],      ["darkturquoise","#00ced1"],
  /* Blue Colors */
  ["cadetblue","#5f9ea0"],            ["steelblue","#4682b4"],            ["lightsteelblue","#b0c4de"],
  ["lightblue","#add8e6"],            ["powderblue","#b0e0e6"],           ["lightskyblue","#87cefa"],
  ["skyblue","#87ceeb"],              ["cornflowerblue","#6495ed"],       ["deepskyblue","#00bfff"],
  ["dodgerblue","#1e90ff"],           ["royalblue","#4169e1"],            ["blue","#0000ff"],
  ["mediumblue","#0000cd"],           ["darkblue","#00008b"],             ["navy","#000080"],
  ["midnightblue","#191970"],
  /* Brown Colors */
  ["cornsilk","#fff8dc"],             ["blanchedalmond","#ffebcd"],       ["bisque","#ffe4c4"],
  ["navajowhite","#ffdead"],          ["wheat","#f5deb3"],                ["burlywood","#deb887"],
  ["tan","#d2b48c"],                  ["rosybrown","#bc8f8f"],            ["sandybrown","#f4a460"],
  ["goldenrod","#daa520"],            ["darkgoldenrod","#b8860b"],        ["peru","#cd853f"],
  ["chocolate","#d2691e"],            ["olive","#808000"],                ["saddlebrown","#8b4513"],
  ["sienna","#a0522d"],               ["brown","#a52a2a"],                ["maroon","#800000"],
  /* White Colors */
  ["white","#ffffff"],                ["snow","#fffafa"],                 ["honeydew","#f0fff0"],
  ["mintcream","#f5fffa"],            ["azure","#f0ffff"],                ["aliceblue","#f0f8ff"],
  ["ghostwhite","#f8f8ff"],           ["whitesmoke","#f5f5f5"],           ["seashell","#fff5ee"],
  ["beige","#f5f5dc"],                ["oldlace","#fdf5e6"],              ["floralwhite","#fffaf0"],
  ["ivory","#fffff0"],                ["antiquewhite","#faebd7"],         ["linen","#faf0e6"],
  ["lavenderblush","#fff0f5"],        ["mistyrose","#ffe4e1"],
  /* Grey Colors */
  ["gainsboro","#dcdcdc"],            ["lightgray","#d3d3d3"],            ["silver","#c0c0c0"],
  ["darkgray","#a9a9a9"],             ["dimgray","#696969"],              ["gray","#808080"],
  ["lightslategray","#778899"],       ["slategray","#708090"],            ["darkslategray","#2f4f4f"],
  ["black","#000000"],
]);
/*81---------------------------------------------------------------------------*/

// /**
//  * @param { Number } n0
//  * @param { const Array } colrpool_x 
//  * @return { String } - "#112233"
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

// const CalendarBgcolr_a = [
//   0x558,
//   0x48b,
//   0x234,
//   0x458,
//   0x579,
//   0x969,
//   0x068,
//   0x48a,
//   0x354,
//   0x875,
//   0x476,
//   0x145,
//   0x346,
//   0x069,
//   0x36a,
//   0x967,
//   0x766,
//   0x744,
//   0x047,
//   0xa61,
//   // 0x124,
//   0xa66,
//   0x48d,
//   0xc63,
//   0x443,
//   0x321,
//   0x756,
//   0x058,
//   0x877,
//   0x247,
//   0x67b,
//   0x586,
//   0x824,
//   0x29c,
//   0x786,
//   0x755,
//   0x662,
//   0x664,
//   0x944,
//   0x446,
//   0x278,
//   0x467,
//   0x835,
//   0x577,
//   0x37a,
//   0x652,
//   0x657,
//   0x542,
//   0x67a,
//   0xa44,
//   0xa68,
//   0x653,
//   0x869,
//   0x981,
//   0x843,
//   0x674,
//   0x943,
//   0x658,
//   0xc26,
//   0x367, 
//   0x573,
//   0x466,
//   0x847,
//   0x325,
//   0xa53,
//   0xb57,
//   0x279,
//   0x289,
//   0x27a,
//   0x342,
//   0x545,
//   0x55a,
//   0x656,
//   0x29b,
//   0x456,
//   0x39b,
//   0x344,
//   0xa67,
//   0x0ad,
//   0x675,
//   0x468,
//   0x689,
//   0x765,
//   0x945,
//   0x855,
//   0x753,
//   0x378,
//   0x257,
//   0xa54,
//   0x389,
//   0xc54,
//   0x135,
//   0x57c,
//   0x453,
//   0x344,
//   0x168,
//   0xb51,
//   0x28a,
//   0x457,
//   0x956,
//   0x876,
  
//   // 0xac7,
//   // 0x572,
//   // 0x887,
//   // 0xb65,
//   // 0x66a,
//   // 0x553,
//   // 0x645,
//   // 0x533,
//   // 0x08b,
//   // 0x26b,
//   // 0x637,
//   // 0x17a,
//   // 0x378,
//   // 0x574,
//   // 0x655,
//   // 0x222,
//   // 0x533,
//   // 0x488,
//   // 0x389,
//   // 0x454,
//   // 0x77a,
//   // 0x876,
//   // 0x123,
//   // 0xb63,
//   // 0x48b,
//   // 0x321,
//   // 0xfff,
//   // 0x532,
//   // 0x477,
//   // 0x058,
//   // 0xbcc,
//   // 0x665,
//   // 0x545,
//   // 0x544,
//   // 0x357,
//   // 0x644,
//   // 0x555,
//   // 0x874,
//   // 0x588,
//   // 0x38d,
//   // 0xb47,
//   // 0x479,
//   // 0x688,
//   // 0x671,
//   // 0x956,
//   // 0x57a,
//   // 0x469,
//   // 0x533,
//   // 0x556,
//   // 0x559,
//   // 0xbbb,
//   // 0x58b,
//   // 0x333,
//   // 0x677,
//   // 0x386,
//   // 0x834,
//   // 0x379,
//   // 0x339,
//   // 0x557,
//   // 0x499,
//   // 0x358,
//   // 0x566,
//   // 0x857,
//   // 0x546,
//   // 0x338,
//   // 0x576,
//   // 0x38b,
//   // 0x47b,
//   // 0x791,
//   // 0x775,
//   // 0x654,
//   // 0x634,
//   // 0x256,
//   // 0x445,
//   // 0x564,
//   // 0x56a,
//   // 0x435,
//   // 0x09d,
//   // 0x931,
//   // 0x335,
//   // 0x66c,
//   // 0x643,
//   // 0x589,
//   // 0x111,
//   // 0xb64,
//   // 0xa63,
//   // 0x485,
//   // 0x543,
//   // 0x864,
//   // 0x17b,
//   // 0x673,
//   // 0x478,
//   // 0xc53,
//   // 0x866,
//   // 0x684,
//   // 0x781,
//   // 0x933,
//   // 0x157,
//   // 0x38e,
//   // 0x28e,
//   // 0x353,
//   // 0x397,
//   // 0x25a,
//   // 0x089,
//   // 0x635,
//   // 0x377,
//   // 0xb13,
//   // 0x16a,
//   // 0x632,
//   // 0x465,
//   // 0x777,
//   // 0x934,
  
//   // 0x225,
//   // 0x761,
//   // 0x177,
//   // 0x752,
//   // 0x19a,
//   // 0x463,
//   // 0x047,
//   // 0x06a,
//   // 0xffd,
//   // 0x023,
//   // 0x987,
//   // 0x223,
//   // 0x823,
//   // 0x26a,
//   // 0xa9a,
//   // 0xa52,
// ];
/////////////////////////////////////////////////////////////////////////////////
