/*80****************************************************************************
 * synbols
** ------- */

/**
 * document[ $cssstylesheet ] { Function }
 * Getter of document[ $cssstylesheet_ ]
 */
export const $cssstylesheet = Symbol("$cssstylesheet");
/**
 * document[ $cssstylesheet_ ] { CSSStyleSheet }
 */
export const $cssstylesheet_ = Symbol("$cssstylesheet_");

/**
 * Text[ $tail_ignored ]:boolean
 */
export const $tail_ignored = Symbol("$tail_ignored");

/**
 * Node[ $facil_node ] { boolean }
 */
export const $facil_node = Symbol("$facil_node");

/**
 * Window[ features_sym ] { Object } - ref. detector.js
 */
// export const features_sym = Symbol("features_sym");

/**
 * indent_el[ $indent_blockline ] { BlockLine }
 */
export const $indent_blockline = Symbol("$indent_blockline");

/**
 * General usage
 */
export const $inuse = Symbol("$inuse");

/**
 * BlockVuu.el[ $lidx ] { lnum_t }
 * First line index of the `Element`
 */
export const $lidx = Symbol("$lidx");
/**
 * BlockVuu.el[ $lidx1 ] { lnum_t }
 * Last line index of the `Element`
 */
export const $lidx1 = Symbol("$lidx1");
/**
 * SpanVuu.el[ $loff ]:loff_t
 * Start offset of the `Element` or `Text` in the `Line`
 */
export const $loff = Symbol("$loff");
/**
 * SpanVuu.el[ $loff1 ] { loff_t }
 * Stop offset of the `Element` in the `Line`
 */
export const $loff1 = Symbol("$loff1");

/**
 * document[ $theme_modified ] { {} }
 */
export const $theme_modified = Symbol("$theme_modified");

/**
 * DOMRect[ $ovlap ] { boolean }
 * Node[ $ovlap ] { boolean }
 */
export const $ovlap = Symbol("$ovlap");

/**
 * document[ $palename ] { {} }
 */
export const $palename = Symbol("$palename");

/**
 * Where focus is redirected for `Node` should not getting focused
 */
export const $redirect_focus = Symbol("$redirect_focus");

/**
 * Array of DOMRect with unix timestamp
 */
export const $rec_utx_a = Symbol("$rec_utx_a");

/**
 * document[ $selectionvu ] { HTMLVuu }
 * Used in document.onSelectionchange callback
 */
export const $selectionvu = Symbol("$selectionvu");

/**
 * For testing only
 * HTMLImageElement[ $src ] { String }
 * To replace `src` to prevent console error messages
 */
export const $src = Symbol("$src");

/**
 * Selection[ $sync_eran ] { boolean }
 * @deprecated
 */
export const $sync_eran = Symbol("$sync_eran");

/**
 * document[ $theme ] { Object }
 */
export const $theme = Symbol("$theme");

/**
 * Reference to test `===`
 * For testing only
 */
// export const $ref_test = Symbol("$ref_test");
/**
 * Test reference?
 * For testing only
 */
// export const test_ref_sym = Symbol("test_ref_sym");

// export const valve_selectionchange_sym = Symbol("valve_selectionchange_sym");

/**
 * DOMRect[ $uts ] { boolean }
 */
export const $uts = Symbol("$uts");

/**
 * this.el$[ $vuu ] { Vuu }
 */
export const $vuu = Symbol("$vuu");
/**
 * this.el$[ $Vuu ] { Constructor<Vuu> }
 */
export const $Vuu = Symbol("$Vuu");
