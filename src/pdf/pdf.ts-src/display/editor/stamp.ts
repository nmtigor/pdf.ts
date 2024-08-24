/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/display/editor/stamp.ts
 * @license Apache-2.0
 ******************************************************************************/

/* Copyright 2022 Mozilla Foundation
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
import { html } from "@fe-lib/dom.ts";
import type { IL10n } from "@fe-pdf.ts-web/interfaces.ts";
import { PDFJSDev, TESTING } from "@fe-src/global.ts";
import { AnnotationEditorType, shadow } from "../../shared/util.ts";
import type {
  AccessibilityData,
  AnnotStorageValue,
} from "../annotation_layer.ts";
import { StampAnnotationElement } from "../annotation_layer.ts";
import { PixelsPerInch } from "../display_utils.ts";
import type { AnnotationEditorLayer } from "./annotation_editor_layer.ts";
import type { AltTextData, AnnotationEditorP } from "./editor.ts";
import { AnnotationEditor } from "./editor.ts";
import type { AnnotationEditorUIManager, BitmapData } from "./tools.ts";
/*80--------------------------------------------------------------------------*/

export interface StampEditorP extends AnnotationEditorP {
  name: "stampEditor";
  bitmapUrl?: string;
  bitmapFile?: File;
}

export interface StampEditorSerialized extends AnnotStorageValue {
  bitmapUrl?: string;
}

/**
 * Basic text editor in order to create a FreeTex annotation.
 */
export class StampEditor extends AnnotationEditor {
  static override readonly _type = "stamp";
  static override readonly _editorType = AnnotationEditorType.STAMP;

  #bitmap: HTMLImageElement | ImageBitmap | undefined;
  #bitmapId: string | undefined;
  #bitmapPromise: Promise<void> | undefined;
  #bitmapUrl: string | undefined;
  #bitmapFile;
  #bitmapFileName = "";

  #canvas: HTMLCanvasElement | undefined;
  override getImageForAltText() {
    return this.#canvas;
  }

  #hasMLBeenQueried = false;
  #observer: ResizeObserver | undefined;
  #resizeTimeoutId: number | undefined;
  #isSvg: boolean | undefined = false;
  #hasBeenAddedInUndoStack = false;

  constructor(params: StampEditorP) {
    super({ ...params, name: "stampEditor" });
    this.#bitmapUrl = params.bitmapUrl;
    this.#bitmapFile = params.bitmapFile;
  }

  static override initialize(
    l10n: IL10n,
    uiManager: AnnotationEditorUIManager,
  ) {
    AnnotationEditor.initialize(l10n, uiManager);
  }

  static get supportedTypes() {
    // See https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types
    // to know which types are supported by the browser.
    const types = [
      "apng",
      "avif",
      "bmp",
      "gif",
      "jpeg",
      "png",
      "svg+xml",
      "webp",
      "x-icon",
    ];
    return shadow(
      this,
      "supportedTypes",
      types.map((type) => `image/${type}`),
    );
  }

  static get supportedTypesStr() {
    return shadow(this, "supportedTypesStr", this.supportedTypes.join(","));
  }

  static override isHandlingMimeForPasting(mime: string) {
    return this.supportedTypes.includes(mime);
  }

  static override paste(item: DataTransferItem, parent: AnnotationEditorLayer) {
    parent.pasteEditor(AnnotationEditorType.STAMP, {
      bitmapFile: item.getAsFile(),
    });
  }

  #getBitmapFetched(data?: BitmapData, fromId = false) {
    if (!data) {
      this.remove();
      return;
    }
    this.#bitmap = data.bitmap;
    if (!fromId) {
      this.#bitmapId = data.id;
      this.#isSvg = data.isSvg;
    }
    if (data.file) {
      this.#bitmapFileName = data.file.name;
    }
    this.#createCanvas();
  }

  #getBitmapDone() {
    this.#bitmapPromise = undefined;
    this._uiManager.enableWaiting(false);
    if (this.#canvas) {
      this.div!.focus();
    }
  }

  #getBitmap() {
    if (this.#bitmapId) {
      this._uiManager.enableWaiting(true);
      this._uiManager.imageManager
        .getFromId(this.#bitmapId)
        .then((data) => this.#getBitmapFetched(data, /* fromId = */ true))
        .finally(() => this.#getBitmapDone());
      return;
    }

    if (this.#bitmapUrl) {
      const url = this.#bitmapUrl;
      this.#bitmapUrl = undefined;
      this._uiManager.enableWaiting(true);
      this.#bitmapPromise = this._uiManager.imageManager
        .getFromUrl(url)
        .then((data) => this.#getBitmapFetched(data))
        .finally(() => this.#getBitmapDone());
      return;
    }

    if (this.#bitmapFile) {
      const file = this.#bitmapFile;
      this.#bitmapFile = undefined;
      this._uiManager.enableWaiting(true);
      this.#bitmapPromise = this._uiManager.imageManager
        .getFromFile(file)
        .then((data) => this.#getBitmapFetched(data))
        .finally(() => this.#getBitmapDone());
      return;
    }

    const input = html("input");
    /*#static*/ if (TESTING) {
      input.hidden = true;
      input.id = "stampEditorFileInput";
      document.body.append(input);
    }
    input.type = "file";
    input.accept = StampEditor.supportedTypesStr;
    const signal = this._uiManager._signal;
    this.#bitmapPromise = new Promise<void>((resolve) => {
      input.on("change", async () => {
        this.#bitmapPromise = undefined;
        if (!input.files || input.files.length === 0) {
          this.remove();
        } else {
          this._uiManager.enableWaiting(true);
          const data = await this._uiManager.imageManager.getFromFile(
            input.files[0],
          );
          this.#getBitmapFetched(data);
        }
        /*#static*/ if (TESTING) {
          input.remove();
        }
        resolve();
      }, { signal });
      input.on("cancel", () => {
        this.remove();
        resolve();
      }, { signal });
    }).finally(() => this.#getBitmapDone());
    /*#static*/ if (PDFJSDev || !TESTING) {
      input.click();
    }
  }

  override remove() {
    if (this.#bitmapId) {
      this.#bitmap = undefined;
      this._uiManager.imageManager.deleteId(this.#bitmapId);
      this.#canvas?.remove();
      this.#canvas = undefined;
      this.#observer?.disconnect();
      this.#observer = undefined;
      if (this.#resizeTimeoutId) {
        clearTimeout(this.#resizeTimeoutId);
        this.#resizeTimeoutId = undefined;
      }
    }
    super.remove();
  }

  override rebuild() {
    if (!this.parent) {
      // It's possible to have to rebuild an editor which is not on a visible
      // page.
      if (this.#bitmapId) {
        this.#getBitmap();
      }
      return;
    }
    super.rebuild();
    if (this.div === undefined) {
      return;
    }

    if (this.#bitmapId && this.#canvas === undefined) {
      this.#getBitmap();
    }

    if (!this.isAttachedToDOM) {
      // At some point this editor was removed and we're rebuilting it,
      // hence we must add it to its parent.
      this.parent!.add(this);
    }
  }

  override onceAdded() {
    this._isDraggable = true;
    this.div!.focus();
  }

  override isEmpty() {
    return !(
      this.#bitmapPromise ||
      this.#bitmap ||
      this.#bitmapUrl ||
      this.#bitmapFile ||
      this.#bitmapId
    );
  }

  override get isResizable() {
    return true;
  }

  override render() {
    if (this.div) {
      return this.div;
    }

    let baseX: number, baseY: number;
    if (this.width) {
      baseX = this.x;
      baseY = this.y;
    }

    super.render();
    this.div!.hidden = true;

    this.addAltTextButton();

    if (this.#bitmap) {
      this.#createCanvas();
    } else {
      this.#getBitmap();
    }

    if (this.width) {
      // This editor was created in using copy (ctrl+c).
      const [parentWidth, parentHeight] = this.parentDimensions;
      this.setAt(
        baseX! * parentWidth,
        baseY! * parentHeight,
        this.width * parentWidth,
        this.height! * parentHeight,
      );
    }

    return this.div!;
  }

  #createCanvas() {
    const { div } = this;
    let { width, height } = this.#bitmap!;
    const [pageWidth, pageHeight] = this.pageDimensions;
    const MAX_RATIO = 0.75;
    if (this.width) {
      width = this.width * pageWidth;
      height = this.height! * pageHeight;
    } else if (
      width > MAX_RATIO * pageWidth ||
      height > MAX_RATIO * pageHeight
    ) {
      // If the the image is too big compared to the page dimensions
      // (more than MAX_RATIO) then we scale it down.
      const factor = Math.min(
        (MAX_RATIO * pageWidth) / width,
        (MAX_RATIO * pageHeight) / height,
      );
      width *= factor;
      height *= factor;
    }
    const [parentWidth, parentHeight] = this.parentDimensions;
    this.setDims(
      (width * parentWidth) / pageWidth,
      (height * parentHeight) / pageHeight,
    );

    this._uiManager.enableWaiting(false);
    const canvas = (this.#canvas = html("canvas"));
    div!.append(canvas);
    div!.hidden = false;
    this.#drawBitmap(width, height);
    this.#createObserver();
    if (!this.#hasBeenAddedInUndoStack) {
      this.parent!.addUndoableEditor(this);
      this.#hasBeenAddedInUndoStack = true;
    }

    // There are multiple ways to add an image to the page, so here we just
    // count the number of times an image is added to the page whatever the way
    // is.
    this._reportTelemetry({
      action: "inserted_image",
    });

    if (this.#bitmapFileName) {
      canvas.setAttribute("aria-label", this.#bitmapFileName);
    }
  }

  /**
   * When the dimensions of the div change the inner canvas must
   * renew its dimensions, hence it must redraw its own contents.
   * @param width the new width of the div
   * @param height the new height of the div
   * @return
   */
  #setDimensions(width: number, height: number) {
    const [parentWidth, parentHeight] = this.parentDimensions;
    this.width = width / parentWidth;
    this.height = height / parentHeight;
    this.setDims(width, height);
    if (this._initialOptions?.isCentered) {
      this.center();
    } else {
      this.fixAndSetPosition();
    }
    this._initialOptions = undefined as any;
    if (this.#resizeTimeoutId !== undefined) {
      clearTimeout(this.#resizeTimeoutId);
    }
    // When the user is resizing the editor we just use CSS to scale the image
    // to avoid redrawing it too often.
    // And once the user stops resizing the editor we redraw the image in
    // rescaling it correctly (see this.#scaleBitmap).
    const TIME_TO_WAIT = 200;
    this.#resizeTimeoutId = setTimeout(() => {
      this.#resizeTimeoutId = undefined;
      this.#drawBitmap(width, height);
    }, TIME_TO_WAIT);
  }

  #scaleBitmap(width: number, height: number) {
    const { width: bitmapWidth, height: bitmapHeight } = this.#bitmap!;

    let newWidth = bitmapWidth;
    let newHeight = bitmapHeight;
    let bitmap = this.#bitmap;
    while (newWidth > 2 * width || newHeight > 2 * height) {
      const prevWidth = newWidth;
      const prevHeight = newHeight;

      if (newWidth > 2 * width) {
        // See bug 1820511 (Windows specific bug).
        // TODO: once the above bug is fixed we could revert to:
        // newWidth = Math.ceil(newWidth / 2);
        newWidth = newWidth >= 16384
          ? Math.floor(newWidth / 2) - 1
          : Math.ceil(newWidth / 2);
      }
      if (newHeight > 2 * height) {
        newHeight = newHeight >= 16384
          ? Math.floor(newHeight / 2) - 1
          : Math.ceil(newHeight / 2);
      }

      const offscreen = new OffscreenCanvas(newWidth, newHeight);
      const ctx = offscreen.getContext("2d") as OC2D;
      ctx.drawImage(
        bitmap!,
        0,
        0,
        prevWidth,
        prevHeight,
        0,
        0,
        newWidth,
        newHeight,
      );
      bitmap = offscreen.transferToImageBitmap();
    }

    return bitmap;
  }

  async #mlGuessAltText(
    bitmap: ImageBitmap | HTMLImageElement,
    width: number,
    height: number,
  ) {
    if (this.#hasMLBeenQueried) {
      return;
    }
    this.#hasMLBeenQueried = true;
    const isMLEnabled = await this._uiManager.isMLEnabledFor("altText");
    if (!isMLEnabled || this.hasAltText()) {
      return;
    }
    const offscreen = new OffscreenCanvas(width, height);
    const ctx = offscreen.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(
      bitmap,
      0,
      0,
      bitmap.width,
      bitmap.height,
      0,
      0,
      width,
      height,
    );
    const response = await this._uiManager.mlGuess({
      service: "moz-image-to-text",
      request: {
        data: ctx.getImageData(0, 0, width, height).data,
        width,
        height,
        channels: 4,
      },
    });
    const altText = (response as any)?.output || "";
    if (this.parent && altText && !this.hasAltText()) {
      this.altTextData = { altText, decorative: false };
    }
  }

  #drawBitmap(width: number, height: number) {
    width = Math.ceil(width);
    height = Math.ceil(height);
    const canvas = this.#canvas;
    if (!canvas || (canvas.width === width && canvas.height === height)) {
      return;
    }
    canvas.width = width;
    canvas.height = height;
    const bitmap: ImageBitmap | HTMLImageElement = this.#isSvg
      ? this.#bitmap!
      : this.#scaleBitmap(width, height)!;

    this.#mlGuessAltText(bitmap, width, height);

    const ctx = canvas.getContext("2d")!;
    ctx.filter = this._uiManager.hcmFilter;
    ctx.drawImage(
      bitmap!,
      0,
      0,
      bitmap!.width,
      bitmap!.height,
      0,
      0,
      width,
      height,
    );
  }

  #serializeBitmap(toUrl: boolean): string | ImageBitmap {
    if (toUrl) {
      if (this.#isSvg) {
        const url = this._uiManager.imageManager.getSvgUrl(this.#bitmapId!);
        if (url) {
          return url;
        }
      }
      // We convert to a data url because it's sync and the url can live in the
      // clipboard.
      const canvas = html("canvas");
      ({ width: canvas.width, height: canvas.height } = this.#bitmap!);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(this.#bitmap!, 0, 0);

      return canvas.toDataURL();
    }

    if (this.#isSvg) {
      const [pageWidth, pageHeight] = this.pageDimensions;
      // Multiply by PixelsPerInch.PDF_TO_CSS_UNITS in order to increase the
      // image resolution when rasterizing it.
      const width = Math.round(
        this.width! * pageWidth * PixelsPerInch.PDF_TO_CSS_UNITS,
      );
      const height = Math.round(
        this.height! * pageHeight * PixelsPerInch.PDF_TO_CSS_UNITS,
      );
      const offscreen = new OffscreenCanvas(width, height);
      const ctx = offscreen.getContext("2d") as OC2D;
      ctx.drawImage(
        this.#bitmap!,
        0,
        0,
        this.#bitmap!.width,
        this.#bitmap!.height,
        0,
        0,
        width,
        height,
      );
      return offscreen.transferToImageBitmap();
    }

    return structuredClone(this.#bitmap as ImageBitmap);
  }

  /**
   * Create the resize observer.
   */
  #createObserver() {
    if (!this._uiManager._signal) {
      // This method is called after the canvas has been created but the canvas
      // creation is async, so it's possible that the viewer has been closed.
      return;
    }
    this.#observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      if (rect.width && rect.height) {
        this.#setDimensions(rect.width, rect.height);
      }
    });
    this.#observer.observe(this.div!);
    this._uiManager._signal.on("abort", () => {
      this.#observer?.disconnect();
      this.#observer = undefined;
    }, { once: true });
  }

  static override deserialize(
    data: StampEditorSerialized,
    parent: AnnotationEditorLayer,
    uiManager: AnnotationEditorUIManager,
  ): StampEditor | undefined {
    if (data instanceof StampAnnotationElement) {
      return undefined;
    }
    const editor = super.deserialize(data, parent, uiManager)! as StampEditor;
    const { rect, bitmapUrl, bitmapId, isSvg, accessibilityData } = data;
    if (bitmapId && uiManager.imageManager.isValidId(bitmapId)) {
      editor.#bitmapId = bitmapId;
    } else {
      editor.#bitmapUrl = bitmapUrl;
    }
    editor.#isSvg = isSvg;

    const [parentWidth, parentHeight] = editor.pageDimensions;
    editor.width = (rect![2] - rect![0]) / parentWidth;
    editor.height = (rect![3] - rect![1]) / parentHeight;

    if (accessibilityData) {
      editor.altTextData = accessibilityData as AltTextData;
    }

    return editor;
  }

  /** @implement */
  serialize(
    isForCopying = false,
    context?: Record<keyof any, any>,
  ): StampEditorSerialized | undefined {
    if (this.isEmpty()) {
      return undefined;
    }

    const serialized: StampEditorSerialized = {
      annotationType: AnnotationEditorType.STAMP,
      bitmapId: this.#bitmapId,
      pageIndex: this.pageIndex,
      rect: this.getRect(0, 0),
      rotation: this.rotation,
      isSvg: this.#isSvg,
      structTreeParentId: this._structTreeParentId,
    };

    if (isForCopying) {
      // We don't know what's the final destination (this pdf or another one)
      // of this annotation and the clipboard doesn't support ImageBitmaps,
      // hence we serialize the bitmap to a data url.
      serialized.bitmapUrl = this.#serializeBitmap(
        /* toUrl = */ true,
      ) as string;
      serialized.accessibilityData = this.altTextData as AccessibilityData;
      return serialized;
    }

    const { decorative, altText } = this.altTextData!;
    if (!decorative && altText) {
      serialized.accessibilityData = { type: "Figure", alt: altText };
    }

    if (context === undefined) {
      return serialized;
    }

    context.stamps ||= new Map();
    const area = this.#isSvg
      ? (serialized.rect![2] - serialized.rect![0]) *
        (serialized.rect![3] - serialized.rect![1])
      : undefined;
    if (!context.stamps.has(this.#bitmapId)) {
      // We don't want to have multiple copies of the same bitmap in the
      // annotationMap, hence we only add the bitmap the first time we meet it.
      context.stamps.set(this.#bitmapId, { area, serialized });
      serialized.bitmap = this.#serializeBitmap(
        /* toUrl = */ false,
      ) as ImageBitmap;
    } else if (this.#isSvg) {
      // If we have multiple copies of the same svg but with different sizes,
      // then we want to keep the biggest one.
      const prevData = context.stamps.get(this.#bitmapId);
      if (area! > prevData.area) {
        prevData.area = area;
        prevData.serialized.bitmap.close();
        prevData.serialized.bitmap = this.#serializeBitmap(/* toUrl = */ false);
      }
    }
    return serialized;
  }
}
/*80--------------------------------------------------------------------------*/
