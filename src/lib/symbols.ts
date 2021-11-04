/*81*****************************************************************************
 * synbols
** ------- */

/**
 * document[ cssstylesheet_sy ] { Function }
 * Getter of document[ cssstylesheet_sy_ ]
 */
export const cssstylesheet_sy = Symbol("cssstylesheet_sy");
/**
 * document[ cssstylesheet_sy_ ] { CSSStyleSheet }
 */
export const cssstylesheet_sy_ = Symbol("cssstylesheet_sy_");

/**
 * Text[ tail_ignored_sy ]:boolean
 */
export const tail_ignored_sy = Symbol( "tail_ignored_sy" );

/**
 * Node[ facil_node_sy ] { boolean }
 */
export const facil_node_sy = Symbol( "facil_node_sy" );

/**
 * Window[ features_sym ] { Object } - ref. detector.js
 */
// export const features_sym = Symbol("features_sym");

/**
 * indent_el[ indent_blockline_sym ] { BlockLine }
 */
export const indent_blockline_sym = Symbol( "indent_blockline_sym" );

/**
 * General usage
 */
export const inuse_sym = Symbol( "inuse_sym" );

/**
 * BlockVuu.el[ lidx_sym ] { lnum_t }
 * First line index of the `Element`
 */
export const lidx_sym = Symbol( "lidx_sym" );
/**
 * BlockVuu.el[ lidx1_sym ] { lnum_t }
 * Last line index of the `Element`
 */
export const lidx1_sym = Symbol( "lidx1_sym" );
/**
 * SpanVuu.el[ loff_sym ]:loff_t
 * Start offset of the `Element` or `Text` in the `Line`
 */
export const loff_sym = Symbol( "loff_sym" );
/**
 * SpanVuu.el[ loff1_sym ] { loff_t }
 * Stop offset of the `Element` in the `Line`
 */
export const loff1_sym = Symbol( "loff1_sym" );

/**
 * document[ theme_modified_sym ] { {} }
 */
export const theme_modified_sym = Symbol( "theme_modified_sym" );

/**
 * DOMRect[ ovlap_sy ] { boolean }
 * Node[ ovlap_sy ] { boolean }
 */
export const ovlap_sy = Symbol( "ovlap_sy" );

/**
 * document[ palename_sym ] { {} }
 */
export const palename_sym = Symbol( "palename_sym" );

/**
 * Where focus is redirected for `Node` should not getting focused
 */
export const redirect_focus_sym = Symbol("redirect_focus_sym");

/**
 * Array of DOMRect with unix timestamp
 */
export const rec_utx_a_sy = Symbol("rec_utx_a_sy");

/**
 * document[ selectionvu_sy ] { HTMLVuu }
 * Used in document.onSelectionchange callback
 */
export const selectionvu_sy = Symbol( "selectionvu_sy" );

/**
 * For test only
 * HTMLImageElement[ src_sym ] { String }
 * To replace `src` to prevent console error messages
 */
export const src_sym = Symbol("src_sym");

/**
 * Selection[ sync_eran_sym ] { boolean }
 * @deprecated
 */
export const sync_eran_sym = Symbol( "sync_eran_sym" );

/**
 * document[ theme_sym ] { Object }
 */
export const theme_sym = Symbol( "theme_sym" );

/**
 * Reference to test `===`
 * For test only
 */
// export const ref_test_sym = Symbol("ref_test_sym");
/**
 * Test reference?
 * For test only
 */
// export const test_ref_sym = Symbol("test_ref_sym");

// export const valve_selectionchange_sym = Symbol("valve_selectionchange_sym");

/**
 * DOMRect[ uts_sy ] { boolean }
 */
export const uts_sy = Symbol("uts_sy");

/**
 * this.el$[ vuu_sy ] { Vuu }
 */
export const vuu_sy:unique symbol = Symbol( "vuu_sy" );
/**
 * this.el$[ Vuu_sym_t ] { constructor }
 */
export const Vuu_sym_t = Symbol("Vuu_sym_t");
