/** 80**************************************************************************
 * @module pdf/pdf.ts-src/alias
 * @license Apache-2.0
 ******************************************************************************/

export {};
/*80--------------------------------------------------------------------------*/

export type Dot = {
  x: number;
  y: number;
};

export type Box = Dot & {
  width: number;
  height: number;
  lastPoint?: number[];
};

//kkkk TOCLEANUP
// export type Outlines = {
//   outlines: dot2d_t[];
//   box: Box;
//   free;
// };
/*80--------------------------------------------------------------------------*/
