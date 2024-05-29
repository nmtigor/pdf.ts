/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/operator_list.ts
 * @license Apache-2.0
 ******************************************************************************/

/* Copyright 2017 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { OC2D } from "@fe-lib/alias.ts";
import type { StreamSink, Thread } from "../shared/message_handler.ts";
import type { matrix_t } from "../shared/util.ts";
import { ImageKind, OPS, RenderingIntentFlag, warn } from "../shared/util.ts";
import type { ImgData, MarkedContentProps, OpArgs } from "./evaluator.ts";
/*80--------------------------------------------------------------------------*/

namespace NsQueueOptimizer {
  interface QueueOptimizerContext {
    iCurr: number;
    fnArray: OPS[];
    // argsArray:([] | null)[];
    argsArray: unknown[];
    isOffscreenCanvasSupported: boolean;
  }

  type CheckFn = (context: QueueOptimizerContext) => boolean;
  type IterateFn = (context: QueueOptimizerContext, i: number) => boolean;
  type ProcessFn = (context: QueueOptimizerContext, i: number) => number;

  interface Match {
    checkFn: CheckFn | undefined;
    iterateFn: IterateFn;
    processFn: ProcessFn;
  }

  //jjjj
  // https://github.com/microsoft/TypeScript/issues/1778#issuecomment-505323108
  // https://github.com/microsoft/TypeScript/issues/37448
  type State = {
    [fn in OPS]: State | Match;
  };

  function addState(
    parentState: State,
    pattern: OPS[],
    checkFn: CheckFn | undefined,
    iterateFn: IterateFn,
    processFn: ProcessFn,
  ) {
    let state = parentState;
    for (let i = 0, ii = pattern.length - 1; i < ii; i++) {
      const item = pattern[i];
      state = (state[item] as State) ||= [] as unknown as State;
    }
    state[pattern.at(-1)!] = {
      checkFn,
      iterateFn,
      processFn,
    };
  }

  const InitialState = <State> <unknown> [];

  // This replaces (save, transform, paintInlineImageXObject, restore)+
  // sequences with one |paintInlineImageXObjectGroup| operation.
  addState(
    InitialState,
    [OPS.save, OPS.transform, OPS.paintInlineImageXObject, OPS.restore],
    undefined,
    function iterateInlineImageGroup(context, i) {
      const fnArray = context.fnArray;
      const iFirstSave = context.iCurr - 3;
      const pos = (i - iFirstSave) % 4;
      switch (pos) {
        case 0:
          return fnArray[i] === OPS.save;
        case 1:
          return fnArray[i] === OPS.transform;
        case 2:
          return fnArray[i] === OPS.paintInlineImageXObject;
        case 3:
          return fnArray[i] === OPS.restore;
      }
      throw new Error(`iterateInlineImageGroup - invalid pos: ${pos}`);
    },
    function foundInlineImageGroup(context, i) {
      const MIN_IMAGES_IN_INLINE_IMAGES_BLOCK = 10;
      const MAX_IMAGES_IN_INLINE_IMAGES_BLOCK = 200;
      const MAX_WIDTH = 1000;
      const IMAGE_PADDING = 1;

      const fnArray = context.fnArray;
      const argsArray = context.argsArray;
      const curr = context.iCurr;
      const iFirstSave = curr - 3;
      const iFirstTransform = curr - 2;
      const iFirstPIIXO = curr - 1;

      const count = Math.min(
        Math.floor((i - iFirstSave) / 4),
        MAX_IMAGES_IN_INLINE_IMAGES_BLOCK,
      );
      if (count < MIN_IMAGES_IN_INLINE_IMAGES_BLOCK) {
        return i - ((i - iFirstSave) % 4);
      }

      // assuming that heights of those image is too small (~1 pixel)
      // packing as much as possible by lines
      let maxX = 0;
      const map = [];
      let maxLineHeight = 0;
      let currentX = IMAGE_PADDING,
        currentY = IMAGE_PADDING;
      for (let q = 0; q < count; q++) {
        const transform = argsArray[iFirstTransform + (q << 2)];
        const img = (<any> argsArray[iFirstPIIXO + (q << 2)])[0];
        if (currentX + img.width > MAX_WIDTH) {
          // starting new line
          maxX = Math.max(maxX, currentX);
          currentY += maxLineHeight + 2 * IMAGE_PADDING;
          currentX = 0;
          maxLineHeight = 0;
        }
        map.push({
          transform,
          x: currentX,
          y: currentY,
          w: img.width,
          h: img.height,
        });
        currentX += img.width + 2 * IMAGE_PADDING;
        maxLineHeight = Math.max(maxLineHeight, img.height);
      }
      const imgWidth = Math.max(maxX, currentX) + IMAGE_PADDING;
      const imgHeight = currentY + maxLineHeight + IMAGE_PADDING;
      const imgData = new Uint8Array(imgWidth * imgHeight * 4);
      const imgRowSize = imgWidth << 2;
      for (let q = 0; q < count; q++) {
        const data = (<any> argsArray[iFirstPIIXO + (q << 2)])[0].data;
        // Copy image by lines and extends pixels into padding.
        const rowSize = map[q].w << 2;
        let dataOffset = 0;
        let offset = (map[q].x + map[q].y * imgWidth) << 2;
        imgData.set(data.subarray(0, rowSize), offset - imgRowSize);
        for (let k = 0, kk = map[q].h; k < kk; k++) {
          imgData.set(data.subarray(dataOffset, dataOffset + rowSize), offset);
          dataOffset += rowSize;
          offset += imgRowSize;
        }
        imgData.set(data.subarray(dataOffset - rowSize, dataOffset), offset);
        while (offset >= 0) {
          data[offset - 4] = data[offset];
          data[offset - 3] = data[offset + 1];
          data[offset - 2] = data[offset + 2];
          data[offset - 1] = data[offset + 3];
          data[offset + rowSize] = data[offset + rowSize - 4];
          data[offset + rowSize + 1] = data[offset + rowSize - 3];
          data[offset + rowSize + 2] = data[offset + rowSize - 2];
          data[offset + rowSize + 3] = data[offset + rowSize - 1];
          offset -= imgRowSize;
        }
      }

      const img = {
        width: imgWidth,
        height: imgHeight,
      } as ImgData;
      if (context.isOffscreenCanvasSupported) {
        const canvas = new OffscreenCanvas(imgWidth, imgHeight);
        const ctx = canvas.getContext("2d") as OC2D;
        ctx.putImageData(
          new ImageData(
            new Uint8ClampedArray(imgData.buffer),
            imgWidth,
            imgHeight,
          ),
          0,
          0,
        );
        img.bitmap = canvas.transferToImageBitmap();
        img.data = undefined;
      } else {
        img.kind = ImageKind.RGBA_32BPP;
        img.data = imgData;
      }

      // Replace queue items.
      fnArray.splice(iFirstSave, count * 4, OPS.paintInlineImageXObjectGroup);
      argsArray.splice(iFirstSave, count * 4, [img, map]);

      return iFirstSave + 1;
    },
  );

  // This replaces (save, transform, paintImageMaskXObject, restore)+
  // sequences with one |paintImageMaskXObjectGroup| or one
  // |paintImageMaskXObjectRepeat| operation.
  addState(
    InitialState,
    [OPS.save, OPS.transform, OPS.paintImageMaskXObject, OPS.restore],
    undefined,
    function iterateImageMaskGroup(context, i) {
      const fnArray = context.fnArray;
      const iFirstSave = context.iCurr - 3;
      const pos = (i - iFirstSave) % 4;
      switch (pos) {
        case 0:
          return fnArray[i] === OPS.save;
        case 1:
          return fnArray[i] === OPS.transform;
        case 2:
          return fnArray[i] === OPS.paintImageMaskXObject;
        case 3:
          return fnArray[i] === OPS.restore;
      }
      throw new Error(`iterateImageMaskGroup - invalid pos: ${pos}`);
    },
    function foundImageMaskGroup(context, i) {
      const MIN_IMAGES_IN_MASKS_BLOCK = 10;
      const MAX_IMAGES_IN_MASKS_BLOCK = 100;
      const MAX_SAME_IMAGES_IN_MASKS_BLOCK = 1000;

      const fnArray = context.fnArray;
      const argsArray = context.argsArray;
      const curr = context.iCurr;
      const iFirstSave = curr - 3;
      const iFirstTransform = curr - 2;
      const iFirstPIMXO = curr - 1;

      // At this point, i is the index of the first op past the last valid
      // quartet.
      let count = Math.floor((i - iFirstSave) / 4);
      if (count < MIN_IMAGES_IN_MASKS_BLOCK) {
        return i - ((i - iFirstSave) % 4);
      }

      let isSameImage = false;
      let iTransform, transformArgs;
      const firstPIMXOArg0: ImgData = (<any> argsArray[iFirstPIMXO])[0];
      const firstTransformArg0: number = (<any> argsArray[iFirstTransform])[0],
        firstTransformArg1: number | undefined =
          (<any> argsArray[iFirstTransform])[1],
        firstTransformArg2: number | undefined =
          (<any> argsArray[iFirstTransform])[2],
        firstTransformArg3: number = (<any> argsArray[iFirstTransform])[3];

      if (firstTransformArg1 === firstTransformArg2) {
        isSameImage = true;
        iTransform = iFirstTransform + 4;
        let iPIMXO = iFirstPIMXO + 4;
        for (let q = 1; q < count; q++, iTransform += 4, iPIMXO += 4) {
          transformArgs = <matrix_t> argsArray[iTransform];
          if (
            <ImgData> (<any> argsArray[iPIMXO])[0] !== firstPIMXOArg0 ||
            transformArgs[0] !== firstTransformArg0 ||
            transformArgs[1] !== firstTransformArg1 ||
            transformArgs[2] !== firstTransformArg2 ||
            transformArgs[3] !== firstTransformArg3
          ) {
            if (q < MIN_IMAGES_IN_MASKS_BLOCK) {
              isSameImage = false;
            } else {
              count = q;
            }
            break; // different image or transform
          }
        }
      }

      if (isSameImage) {
        count = Math.min(count, MAX_SAME_IMAGES_IN_MASKS_BLOCK);
        const positions = new Float32Array(count * 2);
        iTransform = iFirstTransform;
        for (let q = 0; q < count; q++, iTransform += 4) {
          transformArgs = <matrix_t> argsArray[iTransform];
          positions[q << 1] = transformArgs[4];
          positions[(q << 1) + 1] = transformArgs[5];
        }

        // Replace queue items.
        fnArray.splice(iFirstSave, count * 4, OPS.paintImageMaskXObjectRepeat);
        argsArray.splice(iFirstSave, count * 4, [
          firstPIMXOArg0,
          firstTransformArg0,
          firstTransformArg1,
          firstTransformArg2,
          firstTransformArg3,
          positions,
        ]);
      } else {
        count = Math.min(count, MAX_IMAGES_IN_MASKS_BLOCK);
        const images: ImgData[] = [];
        for (let q = 0; q < count; q++) {
          transformArgs = <matrix_t> argsArray[iFirstTransform + (q << 2)];
          const maskParams =
            <ImgData> (<any> argsArray[iFirstPIMXO + (q << 2)])[0];
          images.push({
            data: maskParams.data,
            width: maskParams.width,
            height: maskParams.height,
            interpolate: maskParams.interpolate,
            count: maskParams.count,
            transform: transformArgs,
          });
        }

        // Replace queue items.
        fnArray.splice(iFirstSave, count * 4, OPS.paintImageMaskXObjectGroup);
        argsArray.splice(iFirstSave, count * 4, [images]);
      }

      return iFirstSave + 1;
    },
  );

  // This replaces (save, transform, paintImageXObject, restore)+ sequences
  // with one paintImageXObjectRepeat operation, if the |transform| and
  // |paintImageXObjectRepeat| ops are appropriate.
  addState(
    InitialState,
    [OPS.save, OPS.transform, OPS.paintImageXObject, OPS.restore],
    (context) => {
      const argsArray = context.argsArray;
      const iFirstTransform = context.iCurr - 2;
      return (
        (<any> argsArray[iFirstTransform])[1] === 0 &&
        (<any> argsArray[iFirstTransform])[2] === 0
      );
    },
    /* iterateImageGroup */ (context, i) => {
      const fnArray = context.fnArray;
      const argsArray = context.argsArray;
      const iFirstSave = context.iCurr - 3;
      const pos = (i - iFirstSave) % 4;
      switch (pos) {
        case 0:
          return fnArray[i] === OPS.save;
        case 1:
          if (fnArray[i] !== OPS.transform) {
            return false;
          }
          const iFirstTransform = context.iCurr - 2;
          const firstTransformArg0 = (<any> argsArray[iFirstTransform])[0];
          const firstTransformArg3 = (<any> argsArray[iFirstTransform])[3];
          if (
            (<any> argsArray[i])[0] !== firstTransformArg0 ||
            (<any> argsArray[i])[1] !== 0 ||
            (<any> argsArray[i])[2] !== 0 ||
            (<any> argsArray[i])[3] !== firstTransformArg3
          ) {
            return false; // transforms don't match
          }
          return true;
        case 2:
          if (fnArray[i] !== OPS.paintImageXObject) {
            return false;
          }
          const iFirstPIXO = context.iCurr - 1;
          const firstPIXOArg0 = (<any> argsArray[iFirstPIXO])[0];
          if ((<any> argsArray[i])[0] !== firstPIXOArg0) {
            return false; // images don't match
          }
          return true;
        case 3:
          return fnArray[i] === OPS.restore;
      }
      throw new Error(`iterateImageGroup - invalid pos: ${pos}`);
    },
    (context, i) => {
      const MIN_IMAGES_IN_BLOCK = 3;
      const MAX_IMAGES_IN_BLOCK = 1000;

      const fnArray = context.fnArray,
        argsArray = context.argsArray;
      const curr = context.iCurr;
      const iFirstSave = curr - 3;
      const iFirstTransform = curr - 2;
      const iFirstPIXO = curr - 1;
      const firstPIXOArg0 = (<any> argsArray[iFirstPIXO])[0];
      const firstTransformArg0 = (<any> argsArray[iFirstTransform])[0];
      const firstTransformArg3 = (<any> argsArray[iFirstTransform])[3];

      // At this point, i is the index of the first op past the last valid
      // quartet.
      const count = Math.min(
        Math.floor((i - iFirstSave) / 4),
        MAX_IMAGES_IN_BLOCK,
      );
      if (count < MIN_IMAGES_IN_BLOCK) {
        return i - ((i - iFirstSave) % 4);
      }

      // Extract the (x,y) positions from all of the matching transforms.
      const positions = new Float32Array(count * 2);
      let iTransform = iFirstTransform;
      for (let q = 0; q < count; q++, iTransform += 4) {
        const transformArgs = <matrix_t> argsArray[iTransform];
        positions[q << 1] = transformArgs[4];
        positions[(q << 1) + 1] = transformArgs[5];
      }

      // Replace queue items.
      const args = [
        firstPIXOArg0,
        firstTransformArg0,
        firstTransformArg3,
        positions,
      ];
      fnArray.splice(iFirstSave, count * 4, OPS.paintImageXObjectRepeat);
      argsArray.splice(iFirstSave, count * 4, args);

      return iFirstSave + 1;
    },
  );

  // This replaces (beginText, setFont, setTextMatrix, showText, endText)+
  // sequences with (beginText, setFont, (setTextMatrix, showText)+, endText)+
  // sequences, if the font for each one is the same.
  addState(
    InitialState,
    [OPS.beginText, OPS.setFont, OPS.setTextMatrix, OPS.showText, OPS.endText],
    undefined,
    function iterateShowTextGroup(context, i) {
      const fnArray = context.fnArray,
        argsArray = context.argsArray;
      const iFirstSave = context.iCurr - 4;
      const pos = (i - iFirstSave) % 5;
      switch (pos) {
        case 0:
          return fnArray[i] === OPS.beginText;
        case 1:
          return fnArray[i] === OPS.setFont;
        case 2:
          return fnArray[i] === OPS.setTextMatrix;
        case 3:
          if (fnArray[i] !== OPS.showText) {
            return false;
          }
          const iFirstSetFont = context.iCurr - 3;
          const firstSetFontArg0 = (<any> argsArray[iFirstSetFont])[0];
          const firstSetFontArg1 = (<any> argsArray[iFirstSetFont])[1];
          if (
            (<any> argsArray[i])[0] !== firstSetFontArg0 ||
            (<any> argsArray[i])[1] !== firstSetFontArg1
          ) {
            return false; // fonts don't match
          }
          return true;
        case 4:
          return fnArray[i] === OPS.endText;
      }
      throw new Error(`iterateShowTextGroup - invalid pos: ${pos}`);
    },
    (context, i) => {
      const MIN_CHARS_IN_BLOCK = 3;
      const MAX_CHARS_IN_BLOCK = 1000;

      const fnArray = context.fnArray,
        argsArray = context.argsArray;
      const curr = context.iCurr;
      const iFirstBeginText = curr - 4;
      const iFirstSetFont = curr - 3;
      const iFirstSetTextMatrix = curr - 2;
      const iFirstShowText = curr - 1;
      const iFirstEndText = curr;
      const firstSetFontArg0 = (<any> argsArray[iFirstSetFont])[0];
      const firstSetFontArg1 = (<any> argsArray[iFirstSetFont])[1];

      // At this point, i is the index of the first op past the last valid
      // quintet.
      let count = Math.min(
        Math.floor((i - iFirstBeginText) / 5),
        MAX_CHARS_IN_BLOCK,
      );
      if (count < MIN_CHARS_IN_BLOCK) {
        return i - ((i - iFirstBeginText) % 5);
      }

      // If the preceding quintet is (<something>, setFont, setTextMatrix,
      // showText, endText), include that as well. (E.g. <something> might be
      // |dependency|.)
      let iFirst = iFirstBeginText;
      if (
        iFirstBeginText >= 4 &&
        fnArray[iFirstBeginText - 4] === fnArray[iFirstSetFont] &&
        fnArray[iFirstBeginText - 3] === fnArray[iFirstSetTextMatrix] &&
        fnArray[iFirstBeginText - 2] === fnArray[iFirstShowText] &&
        fnArray[iFirstBeginText - 1] === fnArray[iFirstEndText] &&
        (<any> argsArray[iFirstBeginText - 4])[0] === firstSetFontArg0 &&
        (<any> argsArray[iFirstBeginText - 4])[1] === firstSetFontArg1
      ) {
        count++;
        iFirst -= 5;
      }

      // Remove (endText, beginText, setFont) trios.
      let iEndText = iFirst + 4;
      for (let q = 1; q < count; q++) {
        fnArray.splice(iEndText, 3);
        argsArray.splice(iEndText, 3);
        iEndText += 2;
      }

      return iEndText + 1;
    },
  );

  export class NullOptimizer {
    queue;

    constructor(queue: OperatorList) {
      this.queue = queue;
    }

    set isOffscreenCanvasSupported(value: boolean) {
    }

    _optimize() {}

    push(fn: OPS, args?: OpArgs) {
      this.queue.fnArray.push(fn);
      this.queue.argsArray.push(args);
      this._optimize();
    }

    flush() {}

    reset() {}
  }

  export class QueueOptimizer extends NullOptimizer {
    state: State | undefined;
    context: QueueOptimizerContext;
    match: Match | undefined;
    lastProcessed = 0;

    constructor(queue: OperatorList) {
      super(queue);

      this.context = {
        iCurr: 0,
        fnArray: queue.fnArray,
        argsArray: queue.argsArray,
        isOffscreenCanvasSupported: false,
      };
    }

    // eslint-disable-next-line accessor-pairs
    override set isOffscreenCanvasSupported(value: boolean) {
      this.context.isOffscreenCanvasSupported = value;
    }

    override _optimize() {
      // Process new fnArray item(s) chunk.
      const fnArray = this.queue.fnArray;
      let i = this.lastProcessed;
      let ii = fnArray.length;
      let state: State | Match | undefined = this.state;
      let match = this.match;
      if (!state && !match && i + 1 === ii && !InitialState[fnArray[i]]) {
        // Micro-optimization for the common case: last item is not
        // optimizable, just skipping it.
        this.lastProcessed = ii;
        return;
      }

      const context = this.context;
      while (i < ii) {
        if (match) {
          // Already find a block of potentially optimizable items, iterating...
          const iterate = match.iterateFn(context, i);
          if (iterate) {
            i++;
            continue;
          }
          // Found last items for the block, processing...
          i = match.processFn(context, i + 1);
          ii = fnArray.length;
          match = undefined;
          state = undefined;
          if (i >= ii) {
            break;
          }
        }
        // Find the potentially optimizable items.
        state = (<State> state || InitialState)[fnArray[i]];
        if (!state || Array.isArray(state)) {
          i++;
          continue;
        }
        // Found a start of the block based on addState rules.
        context.iCurr = i;
        i++;
        if (!(<Match> state).checkFn?.(context)) {
          // Check failed, continue search...
          state = undefined;
          continue;
        }
        match = <Match> state;
        state = undefined;
      }
      this.state = <State | undefined> state;
      this.match = match;
      this.lastProcessed = i;
    }

    override flush() {
      while (this.match) {
        const length = this.queue.fnArray.length;
        this.lastProcessed = this.match.processFn(this.context, length);
        this.match = undefined;
        this.state = undefined;
        // Repeat optimization until all chunks are exhausted.
        this._optimize();
      }
    }

    override reset() {
      this.state = undefined;
      this.match = undefined;
      this.lastProcessed = 0;
    }
  }
}
import QueueOptimizer = NsQueueOptimizer.QueueOptimizer;
import NullOptimizer = NsQueueOptimizer.NullOptimizer;

/**
 * PDF page operator list.
 */
export interface OpListIR {
  /**
   * Array containing the operator functions.
   */
  fnArray: OPS[];

  /**
   * Array containing the arguments of the functions.
   */
  // argsArray:(Uint8ClampedArray | OpArgs | undefined)[];
  argsArray: (OpArgs | undefined)[];

  length?: number;
  lastChunk: boolean | undefined;
  separateAnnots: {
    form: boolean;
    canvas: boolean;
  } | undefined;
}

/** @final */
export class OperatorList {
  static CHUNK_SIZE = 1000;

  // Close to chunk size.
  static CHUNK_SIZE_ABOUT = this.CHUNK_SIZE - 5;

  #streamSink;
  fnArray: OPS[] = [];

  // argsArray:(unknown[] | Uint8ClampedArray | null | undefined)[] = [];
  // argsArray:(Uint8ClampedArray | OpArgs | undefined)[] = [];
  argsArray: (OpArgs | undefined)[] = [];
  get length() {
    return this.argsArray.length;
  }

  optimizer: NullOptimizer;
  dependencies = new Set<string>();

  #totalLength = 0;
  /**
   * @return The total length of the entire operator list, since
   *  `this.length === 0` after flushing.
   */
  get totalLength() {
    return this.#totalLength + this.length;
  }

  weight = 0;
  #resolved: Promise<void> | undefined;

  constructor(
    intent: RenderingIntentFlag = 0,
    streamSink?: StreamSink<Thread.main, "GetOperatorList">,
  ) {
    this.#streamSink = streamSink;
    this.optimizer = streamSink && !(intent & RenderingIntentFlag.OPLIST)
      ? new QueueOptimizer(this)
      : new NullOptimizer(this);
    this.#resolved = streamSink ? undefined : Promise.resolve();
  }

  // eslint-disable-next-line accessor-pairs
  set isOffscreenCanvasSupported(value: boolean) {
    this.optimizer.isOffscreenCanvasSupported = value;
  }

  get ready() {
    return this.#resolved || this.#streamSink!.ready;
  }

  // args?:Uint8ClampedArray | OpArgs | [ImgData]
  // args?:unknown[] | Uint8ClampedArray | null
  addOp(fn: OPS, args?: OpArgs) {
    this.optimizer.push(fn, args);
    this.weight++;
    if (this.#streamSink) {
      if (this.weight >= OperatorList.CHUNK_SIZE) {
        this.flush();
      } else if (
        this.weight >= OperatorList.CHUNK_SIZE_ABOUT &&
        (fn === OPS.restore || fn === OPS.endText)
      ) {
        // Heuristic to flush on boundary of restore or endText.
        this.flush();
      }
    }
  }

  addImageOps(
    fn: OPS,
    args: OpArgs | undefined,
    optionalContent: MarkedContentProps | undefined,
  ) {
    if (optionalContent !== undefined) {
      this.addOp(OPS.beginMarkedContentProps, ["OC", optionalContent]);
    }

    this.addOp(fn, args);

    if (optionalContent !== undefined) {
      this.addOp(OPS.endMarkedContent, []);
    }
  }

  addDependency(dependency: string) {
    if (this.dependencies.has(dependency)) {
      return;
    }
    this.dependencies.add(dependency);
    this.addOp(OPS.dependency, [dependency]);
  }

  addDependencies(dependencies: Set<string>) {
    for (const dependency of dependencies) {
      this.addDependency(dependency);
    }
  }

  addOpList(opList: OperatorList) {
    if (!(opList instanceof OperatorList)) {
      warn('addOpList - ignoring invalid "opList" parameter.');
      return;
    }
    for (const dependency of opList.dependencies) {
      this.dependencies.add(dependency);
    }
    for (let i = 0, ii = opList.length; i < ii; i++) {
      this.addOp(opList.fnArray[i], opList.argsArray[i]);
    }
  }

  getIR() {
    return <OpListIR> {
      fnArray: this.fnArray,
      argsArray: this.argsArray,
      length: this.length,
    };
  }

  get _transfers() {
    const transfers = [];
    const { fnArray, argsArray, length } = this;
    for (let i = 0; i < length; i++) {
      switch (fnArray[i]) {
        case OPS.paintInlineImageXObject:
        case OPS.paintInlineImageXObjectGroup:
        case OPS.paintImageMaskXObject:
          const arg = (<any> argsArray[i])[0]; // First parameter in imgData.
          if (!arg.cached && arg.data?.buffer instanceof ArrayBuffer) {
            transfers.push(arg.data.buffer);
          }
          break;
      }
    }
    return transfers;
  }

  flush(
    lastChunk = false,
    separateAnnots?: { form: boolean; canvas: boolean },
  ) {
    this.optimizer.flush();
    const length = this.length;
    this.#totalLength += length;

    this.#streamSink!.enqueue(
      {
        fnArray: this.fnArray,
        argsArray: this.argsArray,
        lastChunk,
        separateAnnots,
        length,
      },
      1,
      this._transfers,
    );

    this.dependencies.clear();
    this.fnArray.length = 0;
    this.argsArray.length = 0;
    this.weight = 0;
    this.optimizer.reset();
  }
}
/*80--------------------------------------------------------------------------*/
