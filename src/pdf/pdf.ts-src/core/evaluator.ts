/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

/* Copyright 2012 Mozilla Foundation
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
/* eslint-disable no-var */

import type { rect_t } from "@fe-lib/alias.ts";
import { PromiseCap } from "@fe-lib/util/PromiseCap.ts";
import { assert } from "@fe-lib/util/trace.ts";
import { TESTING } from "@fe-src/global.ts";
import type { TextItem, TextMarkedContent, TextStyle } from "../display/api.ts";
import type { CMapData } from "../display/base_factory.ts";
import type { GroupOptions } from "../display/canvas.ts";
import type {
  MActionMap,
  MessageHandler,
  StreamSink,
  Thread,
} from "../shared/message_handler.ts";
import { MurmurHash3_64 } from "../shared/murmurhash3.ts";
import type { ImageKind, matrix_t } from "../shared/util.ts";
import {
  AbortException,
  CMapCompressionType,
  FONT_IDENTITY_MATRIX,
  FormatError,
  IDENTITY_MATRIX,
  info,
  normalizeUnicode,
  OPS,
  shadow,
  stringToPDFString,
  TextRenderingMode,
  Util,
  warn,
} from "../shared/util.ts";
import { BaseStream } from "./base_stream.ts";
import { bidi } from "./bidi.ts";
import { type CMap, CMapFactory, IdentityCMap } from "./cmap.ts";
import { ColorSpace } from "./colorspace.ts";
import { MissingDataException } from "./core_utils.ts";
import { DecodeStream, type ImageStream } from "./decode_stream.ts";
import type { CssFontInfo, GlobalIdFactory } from "./document.ts";
import {
  getEncoding,
  MacRomanEncoding,
  StandardEncoding,
  SymbolSetEncoding,
  WinAnsiEncoding,
  ZapfDingbatsEncoding,
} from "./encodings.ts";
import type { SubstitutionInfo } from "./font_substitutions.ts";
import { getFontSubstitution } from "./font_substitutions.ts";
import type { Glyph, Seac } from "./fonts.ts";
import { ErrorFont, Font } from "./fonts.ts";
import { FontFlags } from "./fonts_utils.ts";
import { isPDFFunction, PDFFunctionFactory } from "./function.ts";
import { getGlyphsUnicode } from "./glyphlist.ts";
import { PDFImage } from "./image.ts";
import { ImageResizer } from "./image_resizer.ts";
import type { LGS_CData, LI_CData } from "./image_utils.ts";
import {
  type GlobalImageCache,
  LocalColorSpaceCache,
  LocalGStateCache,
  LocalImageCache,
  LocalTilingPatternCache,
  RegionalImageCache,
} from "./image_utils.ts";
import { getMetrics } from "./metrics.ts";
import { OperatorList } from "./operator_list.ts";
import { Lexer, Parser } from "./parser.ts";
import type { ShadingPatternIR } from "./pattern.ts";
import { getTilingPatternIR, Pattern } from "./pattern.ts";
import type { EvaluatorOptions } from "./pdf_manager.ts";
import type { Obj, ObjNoCmd } from "./primitives.ts";
import {
  Cmd,
  Dict,
  EOF,
  FontDict,
  isName,
  Name,
  Ref,
  RefSet,
  type RefSetCache,
} from "./primitives.ts";
import {
  getFontNameToFileMap,
  getSerifFonts,
  getStandardFontName,
  getStdFontMap,
  getSymbolsFonts,
  isKnownFontName,
} from "./standard_fonts.ts";
import { NullStream, Stream } from "./stream.ts";
import { IdentityToUnicodeMap, ToUnicodeMap } from "./to_unicode_map.ts";
import type { PrivateData } from "./type1_parser.ts";
import { getUnicodeForGlyph } from "./unicode.ts";
import type { WorkerTask } from "./worker.ts";
import { getXfaFontDict, getXfaFontName } from "./xfa_fonts.ts";
import type { XRef } from "./xref.ts";
/*80--------------------------------------------------------------------------*/

const DefaultPartialEvaluatorOptions = Object.freeze({
  maxImageSize: -1,
  disableFontFace: false,
  ignoreErrors: false,
  isEvalSupported: true,
  isOffscreenCanvasSupported: false,
  canvasMaxAreaInBytes: -1,
  fontExtraProperties: false,
  useSystemFonts: true,
  cMapUrl: undefined,
  standardFontDataUrl: undefined,
});

const enum PatternType {
  TILING = 1,
  SHADING = 2,
}

// Optionally avoid sending individual, or very few, text chunks to reduce
// `postMessage` overhead with ReadableStream (see issue 13962).
//
// PLEASE NOTE: This value should *not* be too large (it's used as a lower limit
// in `enqueueChunk`), since that would cause streaming of textContent to become
// essentially useless in practice by sending all (or most) chunks at once.
// Also, a too large value would (indirectly) affect the main-thread `textLayer`
// building negatively by forcing all textContent to be handled at once, which
// could easily end up hurting *overall* performance (e.g. rendering as well).
const TEXT_CHUNK_BATCH_SIZE = 10;

const deferred = Promise.resolve();

type BMValue = Name | BMValue[];

// Convert PDF blend mode names to HTML5 blend mode names.
function normalizeBlendMode(
  value: BMValue,
  parsingArray = false,
): string | undefined {
  if (Array.isArray(value)) {
    // Use the first *supported* BM value in the Array (fixes issue11279.pdf).
    for (const val of value) {
      const maybeBM = normalizeBlendMode(val, /* parsingArray = */ true);
      if (maybeBM) {
        return maybeBM;
      }
    }
    warn(`Unsupported blend mode Array: ${value}`);
    return "source-over";
  }

  if (!(value instanceof Name)) {
    if (parsingArray) {
      return undefined;
    }
    return "source-over";
  }
  switch (value.name) {
    case "Normal":
    case "Compatible":
      return "source-over";
    case "Multiply":
      return "multiply";
    case "Screen":
      return "screen";
    case "Overlay":
      return "overlay";
    case "Darken":
      return "untone";
    case "Lighten":
      return "lighten";
    case "ColorDodge":
      return "color-dodge";
    case "ColorBurn":
      return "color-burn";
    case "HardLight":
      return "hard-light";
    case "SoftLight":
      return "soft-light";
    case "Difference":
      return "difference";
    case "Exclusion":
      return "exclusion";
    case "Hue":
      return "hue";
    case "Saturation":
      return "saturation";
    case "Color":
      return "color";
    case "Luminosity":
      return "luminosity";
  }
  if (parsingArray) {
    return undefined;
  }
  warn(`Unsupported blend mode: ${value.name}`);
  return "source-over";
}

function incrementCachedImageMaskCount(data: LI_CData) {
  if (data.fn === OPS.paintImageMaskXObject && data.args[0]?.count as any > 0) {
    data.args[0].count!++;
  }
}

/**
 * Trying to minimize Date.now() usage and check every 100 time.
 */
class TimeSlotManager {
  static readonly TIME_SLOT_DURATION_MS = 20;

  static readonly CHECK_TIME_EVERY = 100;

  endTime!: number;
  checked!: number;

  constructor() {
    this.reset();
  }

  check() {
    if (++this.checked < TimeSlotManager.CHECK_TIME_EVERY) {
      return false;
    }
    this.checked = 0;
    return this.endTime <= Date.now();
  }

  reset() {
    this.endTime = Date.now() + TimeSlotManager.TIME_SLOT_DURATION_MS;
    this.checked = 0;
  }
}

interface PartialEvaluatorCtorP_ {
  xref: XRef;
  handler: MessageHandler<Thread.worker>;
  pageIndex: number;
  idFactory: GlobalIdFactory;
  fontCache: RefSetCache<Promise<TranslatedFont>>;
  builtInCMapCache: Map<string, CMapData>;
  standardFontDataCache: Map<string, Uint8Array | ArrayBuffer>;
  globalImageCache?: GlobalImageCache;
  systemFontCache?: Map<string, SubstitutionInfo>;
  options?: EvaluatorOptions;
}

export interface ImgData {
  width?: number | undefined;
  height?: number | undefined;

  interpolate?: boolean | undefined;

  bitmap?: ImageBitmap;
  data?: string | Uint8Array | Uint8ClampedArray | undefined;
  count?: number | undefined;

  cached?: boolean;
  kind?: ImageKind;
  transform?: matrix_t;

  isSingleOpaquePixel?: boolean;
}

interface BuildPaintImageXObjectP_ {
  resources: Dict;
  image: BaseStream;
  isInline?: boolean;
  operatorList: OperatorList;
  cacheKey: string | undefined;
  localImageCache: LocalImageCache;
  localColorSpaceCache: LocalColorSpaceCache;
}

interface GetOperatorListP_ {
  stream: BaseStream;
  task: WorkerTask;
  resources?: Dict | undefined;
  operatorList: OperatorList;
  initialState?: Partial<EvalState> | undefined;
  fallbackFontDict?: Dict | undefined;
}

interface _SetGStateP {
  resources: Dict;
  gState: Dict;
  operatorList: OperatorList;
  cacheKey: string;
  task: WorkerTask;
  stateManager: StateManager<EvalState>;
  localGStateCache: LocalGStateCache;
  localColorSpaceCache: LocalColorSpaceCache;
}

interface GetTextContentP_ {
  stream: BaseStream;
  task: WorkerTask;
  resources: Dict | undefined;
  stateManager?: StateManager<TextState>;
  normalizeWhitespace?: boolean;
  combineTextItems?: boolean;
  includeMarkedContent?: boolean;
  disableNormalization?: boolean;
  sink: StreamSink<Thread.main, "GetTextContent">;
  seenStyles?: Set<string>;
  viewBox: rect_t;
  markedContentData?: { level: number } | undefined;
}

interface CIDSystemInfo {
  registry: string;
  ordering: string;
  supplement: number;
}

export interface FontfileType {
  type: string;
  subtype?: string | undefined;
  composite?: boolean;
}

//kkkk `FontProps` vs `FontExpotData`?
export interface FontProps extends FontfileType {
  name: string;
  file?: BaseStream | undefined;
  length1?: number | undefined;
  length2?: number | undefined;
  length3?: number | undefined;
  loadedName: string | undefined;
  fixedPitch?: boolean;
  fontMatrix?: matrix_t;
  firstChar: number;
  lastChar: number;
  bbox?: rect_t | undefined;

  ascent?: number | undefined;
  descent?: number | undefined;
  ascentScaled?: boolean;

  xHeight: number | undefined;
  capHeight: number | undefined;
  isSimulatedFlags?: boolean;
  flags: FontFlags;
  italicAngle?: number;
  isType3Font?: boolean;
  cidEncoding?: string;

  // from extractDataStructures()
  defaultEncoding?: string[] | undefined;
  differences?: string[];
  baseEncodingName?: string | undefined;
  hasEncoding?: boolean;
  dict?: FontDict;
  toUnicode:
    | BaseStream
    | Name
    | IdentityToUnicodeMap
    | ToUnicodeMap
    | undefined;
  hasIncludedToUnicodeMap?: boolean;

  isStandardFont?: boolean;

  // from buildToUnicode()
  isInternalFont?: boolean;
  fallbackToUnicode?: string[];

  // for composite fonts
  cidSystemInfo?: CIDSystemInfo;
  cidToGidMap?: number[];
  cMap?: CMap;
  vertical?: boolean;

  // from extractWidths()
  defaultWidth?: number;
  widths?: Record<string | number, number>;
  defaultVMetrics?: VMetric;
  vmetrics?: VMetric[];

  // from convert()
  seacMap?: Seac[];

  // from Type1Parser
  builtInEncoding?: string[] | undefined;
  privateData?: PrivateData;

  // from checkAndRepair()
  glyphNames?: string[] | undefined;

  cssFontInfo?: CssFontInfo | undefined;
  scaleFactors?: number[] | undefined;
  systemFontInfo?: SubstitutionInfo | undefined;
}

interface PreEvaluatedFont {
  descriptor: FontDict | undefined;
  dict: FontDict;
  baseDict: FontDict;
  composite: boolean;
  type: string;
  firstChar: number;
  lastChar: number;
  toUnicode: BaseStream | Name | undefined;
  hash: string;
  cssFontInfo?: CssFontInfo | undefined;
}

interface TextContentItem_ {
  initialized: boolean;
  str: string[];
  totalWidth: number;
  totalHeight: number;
  width: number;
  height: number;
  vertical: boolean;
  lastAdvanceWidth?: number;
  lastAdvanceHeight?: number;
  prevTransform?: matrix_t;
  textAdvanceScale: number;
  spaceInFlowMin: number;
  spaceInFlowMax: number;
  fakeSpaceMin?: number;
  fakeMultiSpaceMin?: number;
  fakeMultiSpaceMax?: number;
  trackingSpaceMin: number;
  negativeSpaceMax: number;
  notASpace: number;
  transform?: matrix_t;
  fontName?: string;
  hasEOL: boolean;
}

interface _ParseColorSpaceP {
  cs: Name | Ref;
  resources: Dict;
  localColorSpaceCache: LocalColorSpaceCache;
}

type FontArgs = [fontName: Name | string, fontSize: number]; // Table 105 Tf

export type VMetric = [number, number, number];

export type VisibilityExpressionResult =
  (string | VisibilityExpressionResult)[];

export interface MarkedContentProps {
  type: string;
  id?: string | undefined;
  ids?: (string | undefined)[];
  policy?: string | undefined;
  expression?: VisibilityExpressionResult | undefined;
}
// export type MarkedContentProps = { type:string; } &
// ({
//   id?:string;
// } | {
//   ids:(string | undefined)[];
//   policy?:string;
//   expression?:VisibilityExpressionResult;
// });

export interface SmaskOptions {
  subtype: string;
  backdrop: number[] | Uint8ClampedArray | undefined;
  transferMap?: Uint8Array;
}

interface _ParseShadingP {
  shading: Dict | BaseStream;
  resources: Dict;
  localColorSpaceCache: LocalColorSpaceCache;
  localShadingPatternCache: Map<Dict | BaseStream, string>;
}

interface _BuildTextContentItemP {
  chars: string;
  extraSpacing: number;
}

/** @final */
export class PartialEvaluator {
  xref;
  handler;
  pageIndex;
  idFactory;
  fontCache;
  builtInCMapCache;
  standardFontDataCache;
  globalImageCache;
  systemFontCache;
  options: EvaluatorOptions;
  parsingType3Font = false;
  _regionalImageCache;
  type3FontRefs?: RefSet;

  constructor({
    xref,
    handler,
    pageIndex,
    idFactory,
    fontCache,
    builtInCMapCache,
    standardFontDataCache,
    globalImageCache,
    systemFontCache,
    options,
  }: PartialEvaluatorCtorP_) {
    this.xref = xref;
    this.handler = handler;
    this.pageIndex = pageIndex;
    this.idFactory = idFactory;
    this.fontCache = fontCache;
    this.builtInCMapCache = builtInCMapCache;
    this.standardFontDataCache = standardFontDataCache;
    this.globalImageCache = globalImageCache;
    this.systemFontCache = systemFontCache;
    this.options = options || DefaultPartialEvaluatorOptions;

    this._regionalImageCache = new RegionalImageCache();
    ImageResizer.setMaxArea(this.options.canvasMaxAreaInBytes);
  }

  /**
   * Since Functions are only cached (locally) by reference, we can share one
   * `PDFFunctionFactory` instance within this `PartialEvaluator` instance.
   */
  get _pdfFunctionFactory() {
    const pdfFunctionFactory = new PDFFunctionFactory({
      xref: this.xref,
      isEvalSupported: this.options.isEvalSupported,
    });
    return shadow(this, "_pdfFunctionFactory", pdfFunctionFactory);
  }

  /**
   * ! Because of this method, use private method "private _method" instead of
   * ! "#methos"
   */
  clone(newOptions?: Partial<EvaluatorOptions>): PartialEvaluator {
    const newEvaluator = Object.create(this);
    newEvaluator.options = Object.assign(
      Object.create(null),
      this.options,
      newOptions,
    );
    return newEvaluator;
  }

  hasBlendModes(resources: Dict, nonBlendModesSet: RefSet) {
    if (!(resources instanceof Dict)) {
      return false;
    }
    if (resources.objId && nonBlendModesSet.has(resources.objId!)) {
      return false;
    }

    const processed = new RefSet(nonBlendModesSet);
    if (resources.objId) {
      processed.put(resources.objId!);
    }

    const nodes = [resources],
      xref = this.xref;
    while (nodes.length) {
      const node = nodes.shift()!;
      // First check the current resources for blend modes.
      const graphicStates = node.get("ExtGState");
      if (graphicStates instanceof Dict) {
        for (let graphicState of graphicStates.getRawValues()) {
          if (graphicState instanceof Ref) {
            if (processed.has(graphicState)) {
              continue; // The ExtGState has already been processed.
            }
            try {
              graphicState = xref.fetch(graphicState);
            } catch (ex) {
              // Avoid parsing a corrupt ExtGState more than once.
              processed.put(<Ref> graphicState);

              info(`hasBlendModes - ignoring ExtGState: "${ex}".`);
              continue;
            }
          }
          if (!(graphicState instanceof Dict)) {
            continue;
          }
          if (graphicState.objId) {
            processed.put(graphicState.objId);
          }

          const bm = graphicState.get("BM");
          if (bm instanceof Name) {
            if (bm.name !== "Normal") {
              return true;
            }
            continue;
          }
          if (bm !== undefined && Array.isArray(bm)) {
            for (const element of bm) {
              if (element instanceof Name && element.name !== "Normal") {
                return true;
              }
            }
          }
        }
      }
      // Descend into the XObjects to look for more resources and blend modes.
      const xObjects = node.get("XObject");
      if (!(xObjects instanceof Dict)) {
        continue;
      }
      for (let xObject of xObjects.getRawValues()) {
        if (xObject instanceof Ref) {
          if (processed.has(xObject)) {
            // The XObject has already been processed, and by avoiding a
            // redundant `xref.fetch` we can *significantly* reduce the load
            // time for badly generated PDF files (fixes issue6961.pdf).
            continue;
          }
          try {
            xObject = xref.fetch(xObject);
          } catch (ex) {
            if (ex instanceof MissingDataException) {
              throw ex;
            }
            // Avoid parsing a corrupt XObject more than once.
            processed.put(<Ref> xObject);

            info(`hasBlendModes - ignoring XObject: "${ex}".`);
            continue;
          }
        }
        if (!(xObject instanceof BaseStream)) {
          continue;
        }
        if (xObject.dict!.objId) {
          processed.put(xObject.dict!.objId!);
        }
        const xResources = xObject.dict!.get("Resources");
        if (!(xResources instanceof Dict)) {
          continue;
        }
        // Checking objId to detect an infinite loop.
        if (xResources.objId && processed.has(xResources.objId)) {
          continue;
        }

        nodes.push(xResources);
        if (xResources.objId) {
          processed.put(xResources.objId);
        }
      }
    }

    // When no blend modes exist, there's no need re-fetch/re-parse any of the
    // processed `Ref`s again for subsequent pages. This helps reduce redundant
    // `XRef.fetch` calls for some documents (e.g. issue6961.pdf).
    for (const ref of processed) {
      nonBlendModesSet.put(ref);
    }
    return false;
  }

  fetchBuiltInCMap = async (name: string) => {
    const cachedData = this.builtInCMapCache.get(name);
    if (cachedData) {
      return cachedData;
    }
    let data;

    if (this.options.cMapUrl !== undefined) {
      // Only compressed CMaps are (currently) supported here.
      const url = `${this.options.cMapUrl}${name}.bcmap`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `fetchBuiltInCMap: failed to fetch file "${url}" with "${response.statusText}".`,
        );
      }
      data = {
        cMapData: new Uint8Array(await response.arrayBuffer()),
        compressionType: CMapCompressionType.BINARY,
      };
    } else {
      // Get the data on the main-thread instead.
      data = await this.handler.sendWithPromise("FetchBuiltInCMap", { name });
    }

    if (data.compressionType !== CMapCompressionType.NONE) {
      // Given the size of uncompressed CMaps, only cache compressed ones.
      this.builtInCMapCache.set(name, data);
    }
    return data;
  };

  async fetchStandardFontData(name: string) {
    const cachedData = this.standardFontDataCache.get(name);
    if (cachedData) {
      return new Stream(cachedData);
    }

    // The symbol fonts are not consistent across platforms, always load the
    // standard font data for them.
    if (
      this.options.useSystemFonts &&
      name !== "Symbol" &&
      name !== "ZapfDingbats"
    ) {
      return undefined;
    }

    const standardFontNameToFileName = getFontNameToFileMap(),
      filename = standardFontNameToFileName[name];
    let data: Uint8Array | undefined;

    if (this.options.standardFontDataUrl !== undefined) {
      const url = `${this.options.standardFontDataUrl}${filename}`;
      const response = await fetch(url);
      if (!response.ok) {
        warn(
          `fetchStandardFontData: failed to fetch file "${url}" with "${response.statusText}".`,
        );
      } else {
        data = new Uint8Array(await response.arrayBuffer());
      }
    } else {
      // Get the data on the main-thread instead.
      try {
        data = await this.handler.sendWithPromise("FetchStandardFontData", {
          filename,
        });
      } catch (e) {
        warn(
          `fetchStandardFontData: failed to fetch file "${filename}" with "${e}".`,
        );
      }
    }

    if (!data) {
      return undefined;
    }
    // Cache the "raw" standard font data, to avoid fetching it repeatedly
    // (see e.g. issue 11399).
    this.standardFontDataCache.set(name, data);

    return new Stream(data);
  }

  async buildFormXObject(
    resources: Dict,
    xobj: BaseStream,
    smask: SmaskOptions | undefined,
    operatorList: OperatorList,
    task: WorkerTask,
    initialState: Partial<EvalState | TextState>,
    localColorSpaceCache: LocalColorSpaceCache,
  ) {
    const dict = xobj.dict!;
    const matrix = dict.getArray("Matrix") as matrix_t | undefined;
    let bbox = dict.getArray("BBox") as rect_t | undefined;
    bbox = Array.isArray(bbox) && bbox.length === 4
      ? Util.normalizeRect(bbox)
      : undefined;

    let optionalContent: MarkedContentProps | undefined,
      groupOptions: GroupOptions;

    if (dict.has("OC")) {
      optionalContent = await this.parseMarkedContentProps(
        <Dict | Name> dict.get("OC"),
        resources,
      );
    }
    if (optionalContent !== undefined) {
      operatorList.addOp(OPS.beginMarkedContentProps, ["OC", optionalContent]);
    }
    const group = <Dict | undefined> dict.get("Group");
    if (group) {
      groupOptions = {
        matrix,
        bbox,
        smask,
        isolated: false,
        knockout: false,
      };
      const groupSubtype = group.get("S");
      let colorSpace: ColorSpace | undefined;
      if (isName(groupSubtype, "Transparency")) {
        groupOptions.isolated = <boolean | undefined> group.get("I") || false;
        groupOptions.knockout = <boolean | undefined> group.get("K") || false;
        if (group.has("CS")) {
          const cs = <Name | Ref> group.getRaw("CS");

          const cachedColorSpace = ColorSpace.getCached(
            cs,
            this.xref,
            localColorSpaceCache,
          );
          if (cachedColorSpace) {
            colorSpace = cachedColorSpace;
          } else {
            colorSpace = await this.parseColorSpace({
              cs,
              resources,
              localColorSpaceCache,
            });
          }
        }
      }

      if (smask?.backdrop) {
        colorSpace ||= ColorSpace.singletons.rgb;
        smask.backdrop = colorSpace.getRgb(<number[]> smask.backdrop, 0);
      }

      operatorList.addOp(OPS.beginGroup, [groupOptions]);
    }

    // If it's a group, a new canvas will be created that is the size of the
    // bounding box and translated to the correct position so we don't need to
    // apply the bounding box to it.
    const args = group ? [matrix, null] : [matrix, bbox];
    operatorList.addOp(OPS.paintFormXObjectBegin, args);

    return this.getOperatorList({
      stream: xobj,
      task,
      resources: <Dict | undefined> dict.get("Resources") || resources,
      operatorList,
      initialState: <Partial<EvalState>> initialState,
    }).then(() => {
      operatorList.addOp(OPS.paintFormXObjectEnd, []);

      if (group) {
        operatorList.addOp(OPS.endGroup, [groupOptions]);
      }

      if (optionalContent !== undefined) {
        operatorList.addOp(OPS.endMarkedContent, []);
      }
    });
  }

  private _sendImgData(
    objId: string,
    imgData?: ImgData,
    cacheGlobally = false,
  ) {
    const transfers = imgData
      ? [imgData.bitmap || (<Uint8Array> imgData.data).buffer]
      : undefined;

    if (this.parsingType3Font || cacheGlobally) {
      return this.handler.send(
        "commonobj",
        [objId, "Image", imgData],
        transfers,
      );
    }
    return this.handler.send(
      "obj",
      [objId, this.pageIndex, "Image", imgData],
      transfers,
    );
  }

  async buildPaintImageXObject({
    resources,
    image,
    isInline = false,
    operatorList,
    cacheKey,
    localImageCache,
    localColorSpaceCache,
  }: BuildPaintImageXObjectP_) {
    const dict = image.dict!; // Table 89
    const imageRef = dict.objId;
    const w = dict.get("W", "Width");
    const h = dict.get("H", "Height");

    if (
      !(w && (typeof w === "number")) ||
      !(h && (typeof h === "number"))
    ) {
      warn("Image dimensions are missing, or not numbers.");
      return;
    }
    const maxImageSize = this.options.maxImageSize!;
    if (maxImageSize !== -1 && w * h > maxImageSize) {
      const msg = "Image exceeded maximum allowed size and was removed.";

      if (this.options.ignoreErrors) {
        warn(msg);
        return;
      }
      throw new Error(msg);
    }

    let optionalContent: MarkedContentProps | undefined;
    if (dict.has("OC")) {
      optionalContent = await this.parseMarkedContentProps(
        <Dict | Name> dict.get("OC"),
        resources,
      );
    }

    const imageMask = dict.get("IM", "ImageMask") as boolean || false;
    let imgData: ImgData,
      args: [ImgData] | [string, number, number];
    // let args:[string,number,number] | [ImgData];
    if (imageMask) {
      // This depends on a tmpCanvas being filled with the
      // current fillStyle, such that processing the pixel
      // data can't be done here. Instead of creating a
      // complete PDFImage, only read the information needed
      // for later.
      const interpolate = dict.get("I", "Interpolate") as boolean | undefined;
      const bitStrideLength = (w + 7) >> 3;
      const imgArray = image.getBytes(bitStrideLength * h);
      const decode = dict.getArray("D", "Decode") as number[] | undefined;

      if (this.parsingType3Font) {
        imgData = PDFImage.createRawMask({
          imgArray,
          width: w,
          height: h,
          imageIsFromDecodeStream: image instanceof DecodeStream,
          inverseDecode: !!decode && decode[0] > 0,
          interpolate,
        });

        imgData.cached = !!cacheKey;
        args = [imgData];

        operatorList.addImageOps(
          OPS.paintImageMaskXObject,
          args,
          optionalContent,
        );

        if (cacheKey) {
          const cacheData = {
            fn: OPS.paintImageMaskXObject,
            args,
            optionalContent,
          } as const;
          localImageCache.set(cacheKey, imageRef, cacheData);

          if (imageRef) {
            this._regionalImageCache.set(
              /* name = */ undefined,
              imageRef,
              cacheData,
            );
          }
        }
        return;
      }

      imgData = await PDFImage.createMask({
        imgArray,
        width: w,
        height: h,
        imageIsFromDecodeStream: image instanceof DecodeStream,
        inverseDecode: decode?.[0] as any > 0,
        interpolate,
        isOffscreenCanvasSupported: this.options.isOffscreenCanvasSupported,
      });

      if (imgData.isSingleOpaquePixel) {
        // Handles special case of mainly LaTeX documents which use image
        // masks to draw lines with the current fill style.
        operatorList.addImageOps(
          OPS.paintSolidColorImageMask,
          [],
          optionalContent,
        );

        if (cacheKey) {
          const cacheData = {
            fn: OPS.paintSolidColorImageMask,
            args: [] as ImgData[],
            optionalContent,
          } as const;
          localImageCache.set(cacheKey, imageRef, cacheData);

          if (imageRef) {
            this._regionalImageCache.set(
              /* name = */ undefined,
              imageRef,
              cacheData,
            );
          }
        }
        return;
      }

      const objId = `mask_${this.idFactory.createObjId!()}`;
      operatorList.addDependency(objId);
      this._sendImgData(objId, imgData);

      args = [
        {
          data: objId,
          width: imgData.width,
          height: imgData.height,
          interpolate: imgData.interpolate,
          count: 1,
        },
      ];
      operatorList.addImageOps(
        OPS.paintImageMaskXObject,
        args,
        optionalContent,
      );

      if (cacheKey) {
        const cacheData = {
          fn: OPS.paintImageMaskXObject,
          args,
          optionalContent,
        } as const;
        localImageCache.set(cacheKey, imageRef, cacheData);

        if (imageRef) {
          this._regionalImageCache.set(
            /* name = */ undefined,
            imageRef,
            cacheData,
          );
        }
      }
      return;
    }

    const SMALL_IMAGE_DIMENSIONS = 200;
    // Inlining small images into the queue as RGB data
    if (
      isInline &&
      !dict.has("SMask") &&
      !dict.has("Mask") &&
      w + h < SMALL_IMAGE_DIMENSIONS
    ) {
      const imageObj = new PDFImage({
        xref: this.xref,
        res: resources,
        image: image as ImageStream,
        isInline,
        pdfFunctionFactory: this._pdfFunctionFactory,
        localColorSpaceCache,
      });
      // We force the use of RGBA_32BPP images here, because we can't handle
      // any other kind.
      imgData = await imageObj.createImageData(
        /* forceRGBA = */ true,
        /* isOffscreenCanvasSupported = */ false,
      );
      operatorList.isOffscreenCanvasSupported = !!this.options
        .isOffscreenCanvasSupported;
      operatorList.addImageOps(
        OPS.paintInlineImageXObject,
        [imgData],
        optionalContent,
      );
      return;
    }

    // If there is no imageMask, create the PDFImage and a lot
    // of image processing can be done here.
    let objId = `img_${this.idFactory.createObjId!()}`;
    let cacheGlobally = false;

    if (this.parsingType3Font) {
      objId = `${this.idFactory.getDocId()}_type3_${objId}`;
    } else if (imageRef) {
      cacheGlobally = this.globalImageCache!.shouldCache(
        imageRef,
        this.pageIndex,
      );

      if (cacheGlobally) {
        objId = `${this.idFactory.getDocId()}_${objId}`;
      }
    }

    // Ensure that the dependency is added before the image is decoded.
    operatorList.addDependency(objId);
    args = [objId, w, h] as [string, number, number];

    PDFImage.buildImage({
      xref: this.xref,
      res: resources,
      image: image as ImageStream,
      isInline,
      pdfFunctionFactory: this._pdfFunctionFactory,
      localColorSpaceCache,
    })
      .then(async (imageObj) => {
        imgData = await imageObj.createImageData(
          /* forceRGBA = */ false,
          /* isOffscreenCanvasSupported = */ this.options
            .isOffscreenCanvasSupported,
        );

        if (cacheKey && imageRef && cacheGlobally) {
          const length = imgData.bitmap
            ? imgData.width! * imgData.height! * 4
            : imgData.data!.length;
          this.globalImageCache!.addByteSize(imageRef, length);
        }

        return this._sendImgData(objId, imgData, cacheGlobally);
      })
      .catch((reason) => {
        warn(`Unable to decode image "${objId}": "${reason}".`);

        return this._sendImgData(
          objId,
          /* imgData = */ undefined,
          cacheGlobally,
        );
      });

    operatorList.addImageOps(OPS.paintImageXObject, args, optionalContent);

    if (cacheKey) {
      const cacheData = {
        fn: OPS.paintImageXObject,
        args,
        optionalContent,
      } as const;
      localImageCache.set(cacheKey, imageRef, cacheData);

      if (imageRef) {
        this._regionalImageCache.set(
          /* name = */ undefined,
          imageRef,
          cacheData,
        );

        if (cacheGlobally) {
          assert(!isInline, "Cannot cache an inline image globally.");

          this.globalImageCache!.setData(imageRef, {
            objId,
            fn: OPS.paintImageXObject,
            args,
            optionalContent,
            byteSize: 0, // Temporary entry, note `addByteSize` above.
          });
        }
      }
    }
  }

  handleSMask(
    smask: Dict,
    resources: Dict,
    operatorList: OperatorList,
    task: WorkerTask,
    stateManager: StateManager<EvalState>,
    localColorSpaceCache: LocalColorSpaceCache,
  ) {
    const smaskContent = smask.get("G") as BaseStream;
    const smaskOptions: SmaskOptions = {
      subtype: (<Name> smask.get("S")).name,
      backdrop: <number[] | undefined> smask.get("BC"),
    };

    // The SMask might have a alpha/luminosity value transfer function --
    // we will build a map of integer values in range 0..255 to be fast.
    const transferObj = smask.get("TR");
    if (isPDFFunction(transferObj)) {
      const transferFn = this._pdfFunctionFactory.create(
        transferObj as BaseStream | Dict,
      );
      const transferMap = new Uint8Array(256);
      const tmp = new Float32Array(1);
      for (let i = 0; i < 256; i++) {
        tmp[0] = i / 255;
        transferFn(tmp, 0, tmp, 0);
        transferMap[i] = (tmp[0] * 255) | 0;
      }
      smaskOptions.transferMap = transferMap;
    }

    return this.buildFormXObject(
      resources,
      smaskContent,
      smaskOptions,
      operatorList,
      task,
      stateManager.state.clone!(),
      localColorSpaceCache,
    );
  }

  handleTransferFunction(tr?: Obj) {
    let transferArray;
    if (Array.isArray(tr)) {
      transferArray = tr;
    } else if (isPDFFunction(tr)) {
      transferArray = [tr];
    } // Not a valid transfer function entry.
    else {
      return null;
    }

    const transferMaps = [];
    let numFns = 0;
    let numEffectfulFns = 0;
    for (const entry of <Obj[]> transferArray) {
      const transferObj = this.xref.fetchIfRef(entry);
      numFns++;

      if (isName(transferObj, "Identity")) {
        transferMaps.push(null);
        continue;
      } else if (!isPDFFunction(transferObj)) {
        // Not a valid transfer function object.
        return null;
      }

      const transferFn = this._pdfFunctionFactory.create(
        transferObj as BaseStream | Dict,
      );
      const transferMap = new Uint8Array(256),
        tmp = new Float32Array(1);
      for (let j = 0; j < 256; j++) {
        tmp[0] = j / 255;
        transferFn(tmp, 0, tmp, 0);
        transferMap[j] = (tmp[0] * 255) | 0;
      }
      transferMaps.push(transferMap);
      numEffectfulFns++;
    }

    if (!(numFns === 1 || numFns === 4)) {
      // Only 1 or 4 functions are supported, by the specification.
      return null;
    }
    if (numEffectfulFns === 0) {
      // Only /Identity transfer functions found, which are no-ops.
      return null;
    }
    return transferMaps;
  }

  handleTilingType(
    fn: OPS,
    color: Uint8ClampedArray | undefined,
    resources: Dict,
    pattern: BaseStream,
    patternDict: Dict,
    operatorList: OperatorList,
    task: WorkerTask,
    localTilingPatternCache: LocalTilingPatternCache,
  ) {
    // Create an IR of the pattern code.
    const tilingOpList = new OperatorList();
    // Merge the available resources, to prevent issues when the patternDict
    // is missing some /Resources entries (fixes issue6541.pdf).
    const patternResources = Dict.merge({
      xref: this.xref,
      dictArray: [<Dict | undefined> patternDict.get("Resources"), resources],
    });

    return this.getOperatorList({
      stream: pattern,
      task,
      resources: patternResources,
      operatorList: tilingOpList,
    })
      .then(() => {
        const operatorListIR = tilingOpList.getIR();
        const tilingPatternIR = getTilingPatternIR(
          operatorListIR,
          patternDict,
          color,
        );
        // Add the dependencies to the parent operator list so they are
        // resolved before the sub operator list is executed synchronously.
        operatorList.addDependencies(tilingOpList.dependencies);
        operatorList.addOp(fn, tilingPatternIR);

        if (patternDict.objId) {
          localTilingPatternCache.set(
            /* name = */ undefined,
            patternDict.objId,
            {
              operatorListIR,
              dict: patternDict,
            },
          );
        }
      })
      .catch((reason) => {
        if (reason instanceof AbortException) {
          return;
        }
        if (this.options.ignoreErrors) {
          warn(`handleTilingType - ignoring pattern: "${reason}".`);
          return;
        }
        throw reason;
      });
  }

  handleSetFont(
    resources: Dict,
    fontArgs: FontArgs | undefined,
    fontRef: Ref | undefined,
    operatorList: OperatorList,
    task: WorkerTask,
    state: Partial<EvalState | TextState>,
    fallbackFontDict?: FontDict,
    cssFontInfo?: CssFontInfo,
  ) {
    const fontName = fontArgs?.[0] instanceof Name
      ? fontArgs[0].name
      : undefined;

    return this.loadFont(
      fontName,
      fontRef,
      resources,
      fallbackFontDict,
      cssFontInfo,
    )
      .then((translated) => {
        if (!translated.font.isType3Font) {
          return translated;
        }
        return translated
          .loadType3Data(this, resources, task)
          .then(() => {
            // Add the dependencies to the parent operatorList so they are
            // resolved before Type3 operatorLists are executed synchronously.
            operatorList.addDependencies(translated.type3Dependencies!);

            return translated;
          })
          .catch((reason) => {
            return new TranslatedFont({
              loadedName: "g_font_error",
              font: new ErrorFont(`Type3 font load error: ${reason}`),
              dict: translated.font as any,
              evaluatorOptions: this.options,
            });
          });
      })
      .then((translated) => {
        state.font = translated.font;
        translated.send(this.handler);
        return translated.loadedName;
      });
  }

  handleText(chars: string, state: Partial<EvalState>) {
    const font = state.font!;
    const glyphs = font.charsToGlyphs(chars);

    if (font.data) {
      const isAddToPathSet = !!(
        state.textRenderingMode! & TextRenderingMode.ADD_TO_PATH_FLAG
      );
      if (
        isAddToPathSet ||
        state.fillColorSpace!.name === "Pattern" ||
        (font as Font).disableFontFace ||
        this.options.disableFontFace
      ) {
        PartialEvaluator.buildFontPaths(
          font as Font,
          glyphs,
          this.handler,
          this.options,
        );
      }
    }
    return glyphs;
  }

  ensureStateFont(state: Partial<EvalState | TextState>) {
    if (state.font) {
      return;
    }
    const reason = new FormatError(
      "Missing setFont (Tf) operator before text rendering operator.",
    );

    if (this.options.ignoreErrors) {
      warn(`ensureStateFont: "${reason}".`);
      return;
    }
    throw reason;
  }

  async setGState({
    resources,
    gState,
    operatorList,
    cacheKey,
    task,
    stateManager,
    localGStateCache,
    localColorSpaceCache,
  }: _SetGStateP) {
    const gStateRef = gState.objId;
    let isSimpleGState = true;
    // This array holds the converted/processed state data.
    const gStateObj: LGS_CData = [];
    let promise = Promise.resolve();
    for (const key of gState.getKeys()) {
      const value = gState.get(key);
      switch (key) {
        case "Type":
          break;
        case "LW":
        case "LC":
        case "LJ":
        case "ML":
        case "D":
        case "RI":
        case "FL":
        case "CA":
        case "ca":
          gStateObj.push([key, value!]);
          break;
        case "Font":
          isSimpleGState = false;

          promise = promise.then(() => {
            return this.handleSetFont(
              resources,
              undefined,
              <Ref | undefined> (<any> value)[0],
              operatorList,
              task,
              stateManager.state,
            ).then((loadedName) => {
              operatorList.addDependency(loadedName);
              gStateObj.push([key, [loadedName, <Obj> (<any> value)[1]]]);
            });
          });
          break;
        case "BM": // Table 58
          gStateObj.push([key, normalizeBlendMode(<BMValue> value)!]);
          break;
        case "SMask":
          if (isName(value, "None")) {
            gStateObj.push([key, false]);
            break;
          }
          if (value instanceof Dict) {
            isSimpleGState = false;

            promise = promise.then(() => {
              return this.handleSMask(
                value,
                resources,
                operatorList,
                task,
                stateManager,
                localColorSpaceCache,
              );
            });
            gStateObj.push([key, true]);
          } else {
            warn("Unsupported SMask type");
          }
          break;
        case "TR":
          const transferMaps = this.handleTransferFunction(value);
          gStateObj.push([key, transferMaps]);
          break;
        // Only generate info log messages for the following since
        // they are unlikely to have a big impact on the rendering.
        case "OP":
        case "op":
        case "OPM":
        case "BG":
        case "BG2":
        case "UCR":
        case "UCR2":
        case "TR2":
        case "HT":
        case "SM":
        case "SA":
        case "AIS":
        case "TK":
          // TODO implement these operators.
          info("graphic state operator " + key);
          break;
        default:
          info("Unknown graphic state operator " + key);
          break;
      }
    }
    return promise.then(() => {
      if (gStateObj.length > 0) {
        operatorList.addOp(OPS.setGState, [gStateObj]);
      }

      if (isSimpleGState) {
        localGStateCache.set(cacheKey, gStateRef, gStateObj);
      }
    });
  }

  loadFont(
    fontName: string | undefined,
    font: Ref | undefined,
    resources: Dict,
    fallbackFontDict?: FontDict,
    cssFontInfo?: CssFontInfo,
  ) {
    const errorFont = async (font_y?: FontDict) => {
      return new TranslatedFont({
        loadedName: "g_font_error",
        font: new ErrorFont(`Font "${fontName}" is not available.`),
        dict: font_y,
        evaluatorOptions: this.options,
      });
    };

    let fontRef: Ref | undefined | FontDict;
    if (font) {
      // Loading by ref.
      if (font instanceof Ref) {
        fontRef = font;
      }
    } else {
      // Loading by name.
      const fontRes = resources.get("Font") as Dict | undefined;
      if (fontRes) {
        fontRef = fontRes.getRaw(fontName!) as Ref | undefined;
      }
    }
    let fontDict: FontDict | Ref | undefined = font;
    if (fontRef) {
      if (this.parsingType3Font && this.type3FontRefs!.has(fontRef as Ref)) {
        return errorFont();
      }

      if (this.fontCache.has(fontRef as Ref)) {
        return this.fontCache.get(fontRef as Ref)!;
      }

      // Table 111,
      fontDict = this.xref.fetchIfRef(fontRef) as FontDict;
    }

    if (!(fontDict instanceof Dict)) {
      if (!this.options.ignoreErrors && !this.parsingType3Font) {
        warn(`Font "${fontName}" is not available.`);
        return errorFont();
      }
      warn(
        `Font "${fontName}" is not available -- attempting to fallback to a default font.`,
      );

      // Falling back to a default font to avoid completely broken rendering,
      // but note that there're no guarantees that things will look "correct".
      fontDict = fallbackFontDict || PartialEvaluator.fallbackFontDict;
    }

    // We are holding `fontDict.cacheKey` references only for `fontRef`s that
    // are not actually `Ref`s, but rather `Dict`s. See explanation below.
    if (fontDict.cacheKey && this.fontCache.has(fontDict.cacheKey)) {
      return this.fontCache.get(fontDict.cacheKey)!;
    }

    const fontCapability = new PromiseCap<TranslatedFont>();

    let preEvaluatedFont: PreEvaluatedFont;
    try {
      preEvaluatedFont = this.preEvaluateFont(fontDict);
      preEvaluatedFont.cssFontInfo = cssFontInfo;
    } catch (reason) {
      warn(`loadFont - preEvaluateFont failed: "${reason}".`);
      return errorFont(fontDict);
    }
    const { descriptor, hash } = preEvaluatedFont;

    const fontRefIsRef = fontRef instanceof Ref;
    let fontID: string | undefined;

    if (hash && descriptor instanceof Dict) {
      const fontAliases = (descriptor.fontAliases ||= Object.create(null));

      if (fontAliases[hash]) {
        const aliasFontRef = fontAliases[hash].aliasRef;
        if (fontRefIsRef && aliasFontRef && this.fontCache.has(aliasFontRef)) {
          this.fontCache.putAlias(<Ref> fontRef, aliasFontRef);
          return this.fontCache.get(<Ref> fontRef)!;
        }
      } else {
        fontAliases[hash] = {
          fontID: this.idFactory.createFontId(),
        };
      }

      if (fontRefIsRef) {
        fontAliases[hash].aliasRef = <Ref> fontRef;
      }
      fontID = fontAliases[hash].fontID;
    } else {
      fontID = this.idFactory.createFontId();
    }
    assert(
      fontID?.startsWith("f"),
      'The "fontID" must be (correctly) defined.',
    );

    // Workaround for bad PDF generators that reference fonts incorrectly,
    // where `fontRef` is a `Dict` rather than a `Ref` (fixes bug946506.pdf).
    // In this case we cannot put the font into `this.fontCache` (which is
    // a `RefSetCache`), since it's not possible to use a `Dict` as a key.
    //
    // However, if we don't cache the font it's not possible to remove it
    // when `cleanup` is triggered from the API, which causes issues on
    // subsequent rendering operations (see issue7403.pdf) and would force us
    // to unnecessarily load the same fonts over and over.
    //
    // Instead, we cheat a bit by using a modified `fontID` as a key in
    // `this.fontCache`, to allow the font to be cached.
    // NOTE: This works because `RefSetCache` calls `toString()` on provided
    //       keys. Also, since `fontRef` is used when getting cached fonts,
    //       we'll not accidentally match fonts cached with the `fontID`.
    if (fontRefIsRef) {
      this.fontCache.put(fontRef as Ref, fontCapability.promise);
    } else {
      fontDict.cacheKey = `cacheKey_${fontID}`;
      this.fontCache.put(fontDict.cacheKey, fontCapability.promise);
    }

    // Keep track of each font we translated so the caller can
    // load them asynchronously before calling display on a page.
    fontDict.loadedName = `${this.idFactory.getDocId()}_${fontID}`;

    this.translateFont(preEvaluatedFont)
      .then((translatedFont) => {
        fontCapability.resolve(
          new TranslatedFont({
            loadedName: (fontDict as FontDict).loadedName!,
            font: translatedFont,
            dict: fontDict as FontDict,
            evaluatorOptions: this.options,
          }),
        );
      })
      .catch((reason) => {
        // TODO fontCapability.reject?
        warn(`loadFont - translateFont failed: "${reason}".`);

        fontCapability.resolve(
          new TranslatedFont({
            loadedName: (fontDict as FontDict).loadedName!,
            font: new ErrorFont(
              reason instanceof Error ? reason.message : reason,
            ),
            dict: fontDict as FontDict,
            evaluatorOptions: this.options,
          }),
        );
      });
    return fontCapability.promise;
  }

  buildPath(
    operatorList: OperatorList,
    fn: OPS,
    args?: number[],
    parsingText = false,
  ) {
    const lastIndex = operatorList.length - 1;
    if (!args) {
      args = [];
    }
    if (
      lastIndex < 0 ||
      operatorList.fnArray[lastIndex] !== OPS.constructPath
    ) {
      // Handle corrupt PDF documents that contains path operators inside of
      // text objects, which may shift subsequent text, by enclosing the path
      // operator in save/restore operators (fixes issue10542_reduced.pdf).
      //
      // Note that this will effectively disable the optimization in the
      // `else` branch below, but given that this type of corruption is
      // *extremely* rare that shouldn't really matter much in practice.
      if (parsingText) {
        warn(`Encountered path operator "${fn}" inside of a text object.`);
        operatorList.addOp(OPS.save, null);
      }

      let minMax: rect_t;
      switch (fn) {
        case OPS.rectangle:
          const x = args[0] + args[2];
          const y = args[1] + args[3];
          minMax = [
            Math.min(args[0], x),
            Math.max(args[0], x),
            Math.min(args[1], y),
            Math.max(args[1], y),
          ];
          break;
        case OPS.moveTo:
        case OPS.lineTo:
          minMax = [args[0], args[0], args[1], args[1]];
          break;
        default:
          minMax = [Infinity, -Infinity, Infinity, -Infinity];
          break;
      }
      operatorList.addOp(OPS.constructPath, [[fn], args, minMax]);

      if (parsingText) {
        operatorList.addOp(OPS.restore, null);
      }
    } else {
      const opArgs = operatorList.argsArray[lastIndex]!;
      (opArgs[0] as OPS[]).push(fn);
      (opArgs[1] as number[]).push(...args);
      const minMax = opArgs[2] as rect_t;

      // Compute min/max in the worker instead of the main thread.
      // If the current matrix (when drawing) is a scaling one
      // then min/max can be easily computed in using those values.
      // Only rectangle, lineTo and moveTo are handled here since
      // Bezier stuff requires to have the starting point.
      switch (fn) {
        case OPS.rectangle:
          const x = args[0] + args[2];
          const y = args[1] + args[3];
          minMax[0] = Math.min(minMax[0], args[0], x);
          minMax[1] = Math.max(minMax[1], args[0], x);
          minMax[2] = Math.min(minMax[2], args[1], y);
          minMax[3] = Math.max(minMax[3], args[1], y);
          break;
        case OPS.moveTo:
        case OPS.lineTo:
          minMax[0] = Math.min(minMax[0], args[0]);
          minMax[1] = Math.max(minMax[1], args[0]);
          minMax[2] = Math.min(minMax[2], args[1]);
          minMax[3] = Math.max(minMax[3], args[1]);
          break;
      }
    }
  }

  parseColorSpace({
    cs,
    resources,
    localColorSpaceCache,
  }: _ParseColorSpaceP) {
    return ColorSpace.parseAsync({
      cs,
      xref: this.xref,
      resources,
      pdfFunctionFactory: this._pdfFunctionFactory,
      localColorSpaceCache,
    }).catch((reason) => {
      if (reason instanceof AbortException) {
        return undefined;
      }
      if (this.options.ignoreErrors) {
        warn(`parseColorSpace - ignoring ColorSpace: "${reason}".`);
        return undefined;
      }
      throw reason;
    });
  }

  parseShading({
    shading,
    resources,
    localColorSpaceCache,
    localShadingPatternCache,
  }: _ParseShadingP) {
    // Shadings and patterns may be referenced by the same name but the resource
    // dictionary could be different so we can't use the name for the cache key.
    let id = localShadingPatternCache.get(shading);
    if (!id) {
      const shadingFill = Pattern.parseShading(
        shading,
        this.xref,
        resources,
        this._pdfFunctionFactory,
        localColorSpaceCache,
      );
      const patternIR: ShadingPatternIR = shadingFill.getIR();
      id = `pattern_${this.idFactory.createObjId!()}`;
      if (this.parsingType3Font) {
        id = `${this.idFactory.getDocId()}_type3_${id}`;
      }
      localShadingPatternCache.set(shading, id);

      if (this.parsingType3Font) {
        this.handler.send("commonobj", [id, "Pattern", patternIR]);
      } else {
        this.handler.send("obj", [id, this.pageIndex, "Pattern", patternIR]);
      }
    }
    return id;
  }

  handleColorN(
    operatorList: OperatorList,
    fn: OPS,
    args: [Name, ...number[]],
    cs: ColorSpace,
    patterns: Dict,
    resources: Dict,
    task: WorkerTask,
    localColorSpaceCache: LocalColorSpaceCache,
    localTilingPatternCache: LocalTilingPatternCache,
    localShadingPatternCache: Map<Dict | BaseStream, string>,
  ) {
    // compile tiling patterns
    const patternName = args.pop();
    // SCN/scn applies patterns along with normal colors
    if (patternName instanceof Name) {
      const rawPattern = patterns.getRaw(patternName.name);

      const localTilingPattern = rawPattern instanceof Ref &&
        localTilingPatternCache.getByRef(rawPattern);
      if (localTilingPattern) {
        try {
          const color = cs.base
            ? cs.base.getRgb(<number[]> args, 0)
            : undefined;
          const tilingPatternIR = getTilingPatternIR(
            localTilingPattern.operatorListIR,
            localTilingPattern.dict,
            color,
          );
          operatorList.addOp(fn, tilingPatternIR);
          return undefined;
        } catch {
          // Handle any errors during normal TilingPattern parsing.
        }
      }

      const pattern = <BaseStream | Dict | undefined> this.xref.fetchIfRef(
        rawPattern!,
      );
      if (pattern) {
        const dict = pattern instanceof BaseStream ? pattern.dict! : pattern;
        const typeNum = <PatternType> dict.get("PatternType");

        if (typeNum === PatternType.TILING) {
          const color = cs.base
            ? cs.base.getRgb(<number[]> args, 0)
            : undefined;
          return this.handleTilingType(
            fn,
            color,
            resources,
            <BaseStream> pattern,
            dict,
            operatorList,
            task,
            localTilingPatternCache,
          );
        } else if (typeNum === PatternType.SHADING) {
          const shading = <Dict | BaseStream> dict.get("Shading"); // Table 76
          const matrix = <matrix_t | undefined> dict.getArray("Matrix");
          const objId = this.parseShading({
            shading,
            resources,
            localColorSpaceCache,
            localShadingPatternCache,
          });
          operatorList.addOp(fn, ["Shading", objId, matrix]);
          return undefined;
        }
        throw new FormatError(`Unknown PatternType: ${typeNum}`);
      }
    }
    throw new FormatError(`Unknown PatternName: ${patternName}`);
  }

  private _parseVisibilityExpression(
    array: (Obj | undefined)[],
    nestingCounter: number,
    currentResult: VisibilityExpressionResult,
  ) {
    const MAX_NESTING = 10;
    if (++nestingCounter > MAX_NESTING) {
      warn("Visibility expression is too deeply nested");
      return;
    }
    const length = array.length;
    const operator = this.xref.fetchIfRef(array[0]);
    if (length < 2 || !(operator instanceof Name)) {
      warn("Invalid visibility expression");
      return;
    }
    switch (operator.name) {
      case "And":
      case "Or":
      case "Not":
        currentResult.push(operator.name);
        break;
      default:
        warn(`Invalid operator ${operator.name} in visibility expression`);
        return;
    }
    for (let i = 1; i < length; i++) {
      const raw = array[i];
      const object = this.xref.fetchIfRef(raw);
      if (Array.isArray(object)) {
        const nestedResult: VisibilityExpressionResult = [];
        currentResult.push(nestedResult);
        // Recursively parse a subarray.
        this._parseVisibilityExpression(object, nestingCounter, nestedResult);
      } else if (raw instanceof Ref) {
        // Reference to an OCG dictionary.
        currentResult.push((<Ref> raw).toString());
      }
    }
  }

  async parseMarkedContentProps(
    contentProperties: Dict | Name,
    resources: Dict | undefined,
  ): Promise<MarkedContentProps | undefined> {
    let optionalContent: Dict;
    if (contentProperties instanceof Name) {
      const properties = <Dict> resources!.get("Properties");
      optionalContent = <Dict> properties.get(contentProperties.name);
    } else if (contentProperties instanceof Dict) {
      optionalContent = contentProperties;
    } else {
      throw new FormatError("Optional content properties malformed.");
    }

    const optionalContentType = (optionalContent.get("Type") as Name)?.name;
    if (optionalContentType === "OCG") {
      return {
        type: optionalContentType,
        id: optionalContent.objId,
      };
    } else if (optionalContentType === "OCMD") {
      const expression = optionalContent.get("VE");
      if (Array.isArray(expression)) {
        const result: VisibilityExpressionResult = [];
        this._parseVisibilityExpression(expression, 0, result);
        if (result.length > 0) {
          return {
            type: "OCMD",
            expression: result,
          };
        }
      }

      const optionalContentGroups = optionalContent.get("OCGs");
      if (
        Array.isArray(optionalContentGroups) ||
        optionalContentGroups instanceof Dict
      ) {
        const groupIds: string[] = [];
        if (Array.isArray(optionalContentGroups)) {
          for (const ocg of <Dict[]> optionalContentGroups) {
            groupIds.push(ocg.toString());
          }
        } else {
          // Dictionary, just use the obj id.
          groupIds.push(optionalContentGroups.objId!);
        }

        const v = optionalContent.get("P");
        return {
          type: optionalContentType,
          ids: groupIds,
          policy: v instanceof Name ? v.name : undefined,
        };
      } else if (optionalContentGroups instanceof Ref) {
        return {
          type: optionalContentType,
          id: optionalContentGroups.toString(),
        };
      }
    }
    return undefined;
  }

  getOperatorList({
    stream,
    task,
    resources,
    operatorList,
    initialState,
    fallbackFontDict,
  }: GetOperatorListP_) {
    // Ensure that `resources`/`initialState` is correctly initialized,
    // even if the provided parameter is e.g. `null`.
    resources ||= Dict.empty;
    initialState ||= new EvalState();

    if (!operatorList) {
      throw new Error('getOperatorList: missing "operatorList" parameter');
    }

    const self = this;
    const xref = this.xref;
    let parsingText = false;
    const localImageCache = new LocalImageCache();
    const localColorSpaceCache = new LocalColorSpaceCache();
    const localGStateCache = new LocalGStateCache();
    const localTilingPatternCache = new LocalTilingPatternCache();
    const localShadingPatternCache = new Map<Dict | Stream, string>();

    const xobjs = resources.get("XObject") as Dict ?? Dict.empty;
    const patterns = resources.get("Pattern") as Dict ?? Dict.empty;
    const stateManager = new StateManager(initialState);
    const preprocessor = new EvaluatorPreprocessor(stream, xref, stateManager);
    const timeSlotManager = new TimeSlotManager();

    function closePendingRestoreOPS() {
      for (let i = 0, ii = preprocessor.savedStatesDepth; i < ii; i++) {
        operatorList.addOp(OPS.restore, []);
      }
    }

    return new Promise<void>(function promiseBody(resolve, reject) {
      const next = (promise?: Promise<void>) => {
        Promise.all([promise, operatorList.ready]).then(() => {
          try {
            promiseBody(resolve, reject);
          } catch (ex) {
            reject(ex);
          }
        }, reject);
      };
      task.ensureNotTerminated();
      timeSlotManager.reset();

      const operation = {} as Operation;
      let stop: boolean,
        cs,
        name: string,
        isValidName: boolean;
      while (!(stop = timeSlotManager.check())) {
        // The arguments parsed by read() are used beyond this loop, so we
        // cannot reuse the same array on each iteration. Therefore we pass
        // in |null| as the initial value (see the comment on
        // EvaluatorPreprocessor_read() for why).
        operation.args = null as OpArgs;
        if (!preprocessor.read(operation)) {
          break;
        }
        let args = operation.args;
        let fn = operation.fn;

        switch (fn | 0) {
          case OPS.paintXObject:
            // eagerly compile XForm objects
            isValidName = args![0] instanceof Name;
            name = args![0].name;

            if (isValidName) {
              const localImage = localImageCache.getByName(name) as LI_CData;
              if (localImage) {
                operatorList.addImageOps(
                  localImage.fn,
                  localImage.args,
                  localImage.optionalContent,
                );

                incrementCachedImageMaskCount(localImage);
                args = null;
                continue;
              }
            }

            next(
              new Promise<void>((resolveXObject, rejectXObject) => {
                if (!isValidName) {
                  throw new FormatError("XObject must be referred to by name.");
                }

                let xobj = xobjs.getRaw(name);
                if (xobj instanceof Ref) {
                  // const localImage =  localImageCache.getByRef(xobj);
                  const localImage =
                    localImageCache.getByRef(xobj) as LI_CData ||
                    self._regionalImageCache.getByRef(xobj);
                  if (localImage) {
                    operatorList.addImageOps(
                      localImage.fn,
                      localImage.args,
                      localImage.optionalContent,
                    );

                    incrementCachedImageMaskCount(localImage);
                    resolveXObject();
                    return;
                  }

                  const globalImage = self.globalImageCache!.getData(
                    xobj,
                    self.pageIndex,
                  );
                  if (globalImage) {
                    operatorList.addDependency(globalImage.objId);
                    operatorList.addImageOps(
                      globalImage.fn,
                      globalImage.args,
                      globalImage.optionalContent,
                    );

                    resolveXObject();
                    return;
                  }

                  xobj = xref.fetch(xobj);
                }

                if (!(xobj instanceof BaseStream)) {
                  throw new FormatError("XObject should be a stream");
                }

                const type = xobj.dict!.get("Subtype");
                if (!(type instanceof Name)) {
                  throw new FormatError("XObject should have a Name subtype");
                }

                if (type.name === "Form") {
                  stateManager.save();
                  self
                    .buildFormXObject(
                      resources!,
                      xobj,
                      undefined,
                      operatorList,
                      task,
                      stateManager.state.clone!(),
                      localColorSpaceCache,
                    )
                    .then(() => {
                      stateManager.restore();
                      resolveXObject();
                    }, rejectXObject);
                  return;
                } else if (type.name === "Image") {
                  self
                    .buildPaintImageXObject({
                      resources: resources!,
                      image: xobj,
                      operatorList,
                      cacheKey: name,
                      localImageCache,
                      localColorSpaceCache,
                    })
                    .then(resolveXObject, rejectXObject);
                  return;
                } else if (type.name === "PS") {
                  // PostScript XObjects are unused when viewing documents.
                  // See section 4.7.1 of Adobe's PDF reference.
                  info("Ignored XObject subtype PS");
                } else {
                  throw new FormatError(
                    `Unhandled XObject subtype ${type.name}`,
                  );
                }
                resolveXObject();
              }).catch((reason) => {
                if (reason instanceof AbortException) {
                  return;
                }
                if (self.options.ignoreErrors) {
                  warn(`getOperatorList - ignoring XObject: "${reason}".`);
                  return;
                }
                throw reason;
              }),
            );
            return;
          case OPS.setFont:
            const fontSize = (args as FontArgs)[1];
            // eagerly collect all fonts
            next(
              self
                .handleSetFont(
                  resources!,
                  args as FontArgs,
                  undefined,
                  operatorList,
                  task,
                  stateManager.state,
                  fallbackFontDict,
                )
                .then((loadedName) => {
                  operatorList.addDependency(loadedName);
                  operatorList.addOp(OPS.setFont, [loadedName, fontSize]);
                }),
            );
            return;
          case OPS.beginText:
            parsingText = true;
            break;
          case OPS.endText:
            parsingText = false;
            break;
          case OPS.endInlineImage:
            const cacheKey = (<BaseStream> args![0]).cacheKey;
            if (cacheKey) {
              const localImage = <LI_CData> localImageCache.getByName(cacheKey);
              if (localImage) {
                operatorList.addImageOps(
                  localImage.fn,
                  localImage.args,
                  localImage.optionalContent,
                );

                incrementCachedImageMaskCount(localImage);
                args = null;
                continue;
              }
            }
            next(
              self.buildPaintImageXObject({
                resources: resources!,
                image: <BaseStream> args![0],
                isInline: true,
                operatorList,
                cacheKey,
                localImageCache,
                localColorSpaceCache,
              }),
            );
            return;
          case OPS.showText:
            if (!stateManager.state.font) {
              self.ensureStateFont(stateManager.state);
              continue;
            }
            args![0] = self.handleText(args![0] as string, stateManager.state);
            break;
          case OPS.showSpacedText:
            if (!stateManager.state.font) {
              self.ensureStateFont(stateManager.state);
              continue;
            }
            const combinedGlyphs: (number | Glyph)[] = [];
            const state = stateManager.state;
            for (const arrItem of args![0]) {
              if (typeof arrItem === "string") {
                combinedGlyphs.push(...self.handleText(arrItem, state));
              } else if (typeof arrItem === "number") {
                combinedGlyphs.push(arrItem);
              }
            }
            args![0] = combinedGlyphs;
            fn = OPS.showText;
            break;
          case OPS.nextLineShowText:
            if (!stateManager.state.font) {
              self.ensureStateFont(stateManager.state);
              continue;
            }
            operatorList.addOp(OPS.nextLine);
            args![0] = self.handleText(<string> args![0], stateManager.state);
            fn = OPS.showText;
            break;
          case OPS.nextLineSetSpacingShowText:
            if (!stateManager.state.font) {
              self.ensureStateFont(stateManager.state);
              continue;
            }
            operatorList.addOp(OPS.nextLine);
            operatorList.addOp(OPS.setWordSpacing, [
              (<unknown[]> args).shift()!,
            ]);
            operatorList.addOp(OPS.setCharSpacing, [
              (<unknown[]> args).shift()!,
            ]);
            args![0] = self.handleText(args![0] as string, stateManager.state);
            fn = OPS.showText;
            break;
          case OPS.setTextRenderingMode:
            stateManager.state.textRenderingMode =
              args![0] as TextRenderingMode;
            break;

          case OPS.setFillColorSpace: {
            const cachedColorSpace = ColorSpace.getCached(
              <Name | Ref> args![0],
              xref,
              localColorSpaceCache,
            );
            if (cachedColorSpace) {
              stateManager.state.fillColorSpace = cachedColorSpace;
              continue;
            }

            next(
              self
                .parseColorSpace({
                  cs: <Name | Ref> args![0],
                  resources: resources!,
                  localColorSpaceCache,
                })
                .then((colorSpace) => {
                  if (colorSpace) {
                    stateManager.state.fillColorSpace = colorSpace;
                  }
                }),
            );
            return;
          }
          case OPS.setStrokeColorSpace: {
            const cachedColorSpace = ColorSpace.getCached(
              <Name | Ref> args![0],
              xref,
              localColorSpaceCache,
            );
            if (cachedColorSpace) {
              stateManager.state.strokeColorSpace = cachedColorSpace;
              continue;
            }

            next(
              self
                .parseColorSpace({
                  cs: <Name | Ref> args![0],
                  resources: resources!,
                  localColorSpaceCache,
                })
                .then((colorSpace) => {
                  if (colorSpace) {
                    stateManager.state.strokeColorSpace = colorSpace;
                  }
                }),
            );
            return;
          }
          case OPS.setFillColor:
            cs = stateManager.state.fillColorSpace!;
            args = cs.getRgb(<number[]> args, 0);
            fn = OPS.setFillRGBColor;
            break;
          case OPS.setStrokeColor:
            cs = stateManager.state.strokeColorSpace!;
            args = cs.getRgb(<number[]> args, 0);
            fn = OPS.setStrokeRGBColor;
            break;
          case OPS.setFillGray:
            stateManager.state.fillColorSpace = ColorSpace.singletons.gray;
            args = ColorSpace.singletons.gray.getRgb(<number[]> args, 0);
            fn = OPS.setFillRGBColor;
            break;
          case OPS.setStrokeGray:
            stateManager.state.strokeColorSpace = ColorSpace.singletons.gray;
            args = ColorSpace.singletons.gray.getRgb(<number[]> args, 0);
            fn = OPS.setStrokeRGBColor;
            break;
          case OPS.setFillCMYKColor:
            stateManager.state.fillColorSpace = ColorSpace.singletons.cmyk;
            args = ColorSpace.singletons.cmyk.getRgb(<number[]> args, 0);
            fn = OPS.setFillRGBColor;
            break;
          case OPS.setStrokeCMYKColor:
            stateManager.state.strokeColorSpace = ColorSpace.singletons.cmyk;
            args = ColorSpace.singletons.cmyk.getRgb(<number[]> args, 0);
            fn = OPS.setStrokeRGBColor;
            break;
          case OPS.setFillRGBColor:
            stateManager.state.fillColorSpace = ColorSpace.singletons.rgb;
            args = ColorSpace.singletons.rgb.getRgb(<number[]> args, 0);
            break;
          case OPS.setStrokeRGBColor:
            stateManager.state.strokeColorSpace = ColorSpace.singletons.rgb;
            args = ColorSpace.singletons.rgb.getRgb(<number[]> args, 0);
            break;
          case OPS.setFillColorN:
            cs = stateManager.state.fillColorSpace!;
            if (cs.name === "Pattern") {
              next(
                self.handleColorN(
                  operatorList,
                  OPS.setFillColorN,
                  <[Name, ...number[]]> args,
                  cs,
                  patterns,
                  resources!,
                  task,
                  localColorSpaceCache,
                  localTilingPatternCache,
                  localShadingPatternCache,
                ),
              );
              return;
            }
            args = cs.getRgb(<number[]> args, 0);
            fn = OPS.setFillRGBColor;
            break;
          case OPS.setStrokeColorN:
            cs = stateManager.state.strokeColorSpace!;
            if (cs.name === "Pattern") {
              next(
                self.handleColorN(
                  operatorList,
                  OPS.setStrokeColorN,
                  <[Name, ...number[]]> args,
                  cs,
                  patterns,
                  resources!,
                  task,
                  localColorSpaceCache,
                  localTilingPatternCache,
                  localShadingPatternCache,
                ),
              );
              return;
            }
            args = cs.getRgb(<number[]> args, 0);
            fn = OPS.setStrokeRGBColor;
            break;

          case OPS.shadingFill:
            const shadingRes = <Dict> resources!.get("Shading");
            if (!shadingRes) {
              throw new FormatError("No shading resource found");
            }

            const shading = <Dict | BaseStream> shadingRes.get(
              (<Name> args![0]).name,
            );
            if (!shading) {
              throw new FormatError("No shading object found");
            }
            const patternId = self.parseShading({
              shading,
              resources: resources!,
              localColorSpaceCache,
              localShadingPatternCache,
            });
            args = [patternId];
            fn = OPS.shadingFill;
            break;
          case OPS.setGState:
            isValidName = args![0] instanceof Name;
            name = args![0].name;

            if (isValidName) {
              const localGStateObj = localGStateCache.getByName(name);
              if (localGStateObj) {
                if ((<LGS_CData> localGStateObj).length > 0) {
                  operatorList.addOp(OPS.setGState, [localGStateObj]);
                }
                args = null;
                continue;
              }
            }

            next(
              new Promise<void>((resolveGState, rejectGState) => {
                if (!isValidName) {
                  throw new FormatError("GState must be referred to by name.");
                }

                const extGState = resources!.get("ExtGState") as Dict;
                if (!(extGState instanceof Dict)) {
                  throw new FormatError("ExtGState should be a dictionary.");
                }

                const gState = extGState.get(name) as Dict;
                // TODO: Attempt to lookup cached GStates by reference as well,
                //       if and only if there are PDF documents where doing so
                //       would significantly improve performance.
                if (!(gState instanceof Dict)) {
                  throw new FormatError("GState should be a dictionary.");
                }

                self
                  .setGState({
                    resources: resources!,
                    gState,
                    operatorList,
                    cacheKey: name,
                    task,
                    stateManager,
                    localGStateCache,
                    localColorSpaceCache,
                  })
                  .then(resolveGState, rejectGState);
              }).catch((reason) => {
                if (reason instanceof AbortException) {
                  return;
                }
                if (self.options.ignoreErrors) {
                  warn(`getOperatorList - ignoring ExtGState: "${reason}".`);
                  return;
                }
                throw reason;
              }),
            );
            return;
          case OPS.moveTo:
          case OPS.lineTo:
          case OPS.curveTo:
          case OPS.curveTo2:
          case OPS.curveTo3:
          case OPS.closePath:
          case OPS.rectangle:
            self.buildPath(
              operatorList,
              fn,
              <number[] | undefined> args,
              parsingText,
            );
            continue;
          case OPS.markPoint:
          case OPS.markPointProps:
          case OPS.beginCompat:
          case OPS.endCompat:
            // Ignore operators where the corresponding handlers are known to
            // be no-op in CanvasGraphics (display/canvas.js). This prevents
            // serialization errors and is also a bit more efficient.
            // We could also try to serialize all objects in a general way,
            // e.g. as done in https://github.com/mozilla/pdf.js/pull/6266,
            // but doing so is meaningless without knowing the semantics.
            continue;
          case OPS.beginMarkedContentProps:
            if (!(args![0] instanceof Name)) {
              warn(
                `Expected name for beginMarkedContentProps arg0=${<any> args![
                  0
                ]}`,
              );
              continue;
            }
            if (args![0].name === "OC") {
              next(
                self
                  .parseMarkedContentProps(<Dict | Name> args![1], resources)
                  .then((data) => {
                    operatorList.addOp(OPS.beginMarkedContentProps, [
                      "OC",
                      data,
                    ]);
                  })
                  .catch((reason) => {
                    if (reason instanceof AbortException) {
                      return;
                    }
                    if (self.options.ignoreErrors) {
                      warn(
                        `getOperatorList - ignoring beginMarkedContentProps: "${reason}".`,
                      );
                      return;
                    }
                    throw reason;
                  }),
              );
              return;
            }
            // Other marked content types aren't supported yet.
            args = [
              (args![0] as Name).name,
              args![1] instanceof Dict ? args![1].get("MCID") : null,
            ] as ObjNoCmd[];

            break;
          case OPS.beginMarkedContent:
          case OPS.endMarkedContent:
          default:
            // Note: Ignore the operator if it has `Dict` arguments, since
            // those are non-serializable, otherwise postMessage will throw
            // "An object could not be cloned.".
            if (args !== null) {
              let i, ii;
              for (i = 0, ii = args.length; i < ii; i++) {
                if (args[i] instanceof Dict) {
                  break;
                }
              }
              if (i < ii) {
                warn("getOperatorList - ignoring operator: " + fn);
                continue;
              }
            }
        }
        operatorList.addOp(fn, args);
      }
      if (stop) {
        next(deferred);
        return;
      }
      // Some PDFs don't close all restores inside object/form.
      // Closing those for them.
      closePendingRestoreOPS();
      resolve();
    }).catch((reason) => {
      if (reason instanceof AbortException) {
        return;
      }
      if (this.options.ignoreErrors) {
        warn(
          `getOperatorList - ignoring errors during "${task.name}" ` +
            `task: "${reason}".`,
        );

        closePendingRestoreOPS();
        return;
      }
      throw reason;
    });
  }

  getTextContent({
    stream,
    task,
    resources,
    stateManager,
    includeMarkedContent = false,
    disableNormalization = false,
    sink,
    seenStyles = new Set(),
    viewBox,
    markedContentData = undefined,
  }: GetTextContentP_) {
    // Ensure that `resources`/`stateManager` is correctly initialized,
    // even if the provided parameter is e.g. `null`.
    resources ||= Dict.empty;
    stateManager ||= new StateManager(new TextState());

    if (includeMarkedContent) {
      markedContentData ||= { level: 0 };
    }

    const textContent = {
      items: [] as (TextItem | TextMarkedContent)[],
      styles: Object.create(null) as Record<string, TextStyle>,
    };
    const textContentItem: TextContentItem_ = {
      initialized: false,
      str: [],
      totalWidth: 0,
      totalHeight: 0,
      width: 0,
      height: 0,
      vertical: false,
      textAdvanceScale: 0,
      spaceInFlowMin: 0,
      spaceInFlowMax: 0,
      trackingSpaceMin: Infinity,
      negativeSpaceMax: -Infinity,
      notASpace: -Infinity,
      hasEOL: false,
    };

    // Use a circular buffer (length === 2) to save the last chars in the
    // text stream.
    // This implementation of the circular buffer is using a fixed array
    // and the position of the next element:
    // function addElement(x) {
    //   buffer[pos] = x;
    //   pos = (pos + 1) % buffer.length;
    // }
    // It's a way faster than:
    // function addElement(x) {
    //   buffer.push(x);
    //   buffer.shift();
    // }
    //
    // It's useful to know when we need to add a whitespace in the
    // text chunk.
    const twoLastChars = [" ", " "];
    let twoLastCharsPos = 0;

    /**
     * Save the last char.
     * @return true when the two last chars before adding the new one
     * are a non-whitespace followed by a whitespace.
     */
    function saveLastChar(char: string) {
      const nextPos = (twoLastCharsPos + 1) % 2;
      const ret = twoLastChars[twoLastCharsPos] !== " " &&
        twoLastChars[nextPos] === " ";
      twoLastChars[twoLastCharsPos] = char;
      twoLastCharsPos = nextPos;

      return ret;
    }

    function shouldAddWhitepsace() {
      return (
        twoLastChars[twoLastCharsPos] !== " " &&
        twoLastChars[(twoLastCharsPos + 1) % 2] === " "
      );
    }

    function resetLastChars() {
      twoLastChars[0] = twoLastChars[1] = " ";
      twoLastCharsPos = 0;
    }

    // Used in addFakeSpaces.

    // A white <= fontSize * TRACKING_SPACE_FACTOR is a tracking space
    // so it doesn't count as a space.
    const TRACKING_SPACE_FACTOR = 0.102;

    // When a white <= fontSize * NOT_A_SPACE_FACTOR, there is no space
    // even if one is present in the text stream.
    const NOT_A_SPACE_FACTOR = 0.03;

    // A negative white < fontSize * NEGATIVE_SPACE_FACTOR induces
    // a break (a new chunk of text is created).
    // It doesn't change anything when the text is copied but
    // it improves potential mismatch between text layer and canvas.
    const NEGATIVE_SPACE_FACTOR = -0.2;

    // A white with a width in [fontSize * MIN_FACTOR; fontSize * MAX_FACTOR]
    // is a space which will be inserted in the current flow of words.
    // If the width is outside of this range then the flow is broken
    // (which means a new span in the text layer).
    // It's useful to adjust the best as possible the span in the layer
    // to what is displayed in the canvas.
    const SPACE_IN_FLOW_MIN_FACTOR = 0.102;
    const SPACE_IN_FLOW_MAX_FACTOR = 0.6;

    // If a char is too high/too low compared to the previous we just create
    // a new chunk.
    // If the advance isn't in the +/-VERTICAL_SHIFT_RATIO * height range then
    // a new chunk is created.
    const VERTICAL_SHIFT_RATIO = 0.25;

    const self = this;
    const xref = this.xref;
    const showSpacedTextBuffer: string[] = [];

    // The xobj is parsed iff it's needed, e.g. if there is a `DO` cmd.
    let xobjs: Dict | undefined;
    const emptyXObjectCache = new LocalImageCache();
    const emptyGStateCache = new LocalGStateCache();

    const preprocessor = new EvaluatorPreprocessor(stream, xref, stateManager!);

    let textState: TextState;

    function pushWhitespace({
      width = 0,
      height = 0,
      transform = textContentItem.prevTransform!,
      fontName = textContentItem.fontName,
    }) {
      textContent.items.push({
        str: " ",
        dir: "ltr",
        width,
        height,
        transform,
        fontName,
        hasEOL: false,
      });
    }

    function getCurrentTextTransform() {
      // 9.4.4 Text Space Details
      const font = textState.font!;
      const tsm: matrix_t = [
        textState.fontSize * textState.textHScale,
        0,
        0,
        textState.fontSize,
        0,
        textState.textRise,
      ];

      if (
        font.isType3Font &&
        (textState.fontSize <= 1 || (font as Font).isCharBBox) &&
        !textState.fontMatrix.eq(FONT_IDENTITY_MATRIX)
      ) {
        const glyphHeight = font.bbox![3] - font.bbox![1];
        if (glyphHeight > 0) {
          tsm[3] *= glyphHeight * textState.fontMatrix[3];
        }
      }

      return Util.transform(
        textState.ctm,
        Util.transform(textState.textMatrix, tsm),
      );
    }

    function ensureTextContentItem() {
      if (textContentItem.initialized) {
        return textContentItem;
      }
      const { font, loadedName } = textState;
      if (!seenStyles.has(loadedName!)) {
        seenStyles.add(loadedName!);
        textContent.styles[loadedName!] = {
          fontFamily: font!.fallbackName,
          ascent: font!.ascent,
          descent: font!.descent,
          vertical: font!.vertical,
        };
        if (self.options.fontExtraProperties && font!.systemFontInfo) {
          const style = textContent.styles[loadedName!];
          style.fontSubstitution = font!.systemFontInfo.css;
          style.fontSubstitutionLoadedName = font!.systemFontInfo.loadedName;
        }
      }
      textContentItem.fontName = loadedName!;

      const trm = (textContentItem.transform = getCurrentTextTransform());
      if (!font!.vertical) {
        textContentItem.width = textContentItem.totalWidth = 0;
        textContentItem.height = textContentItem.totalHeight = Math.hypot(
          trm[2],
          trm[3],
        );
        textContentItem.vertical = false;
      } else {
        textContentItem.width = textContentItem.totalWidth = Math.hypot(
          trm[0],
          trm[1],
        );
        textContentItem.height = textContentItem.totalHeight = 0;
        textContentItem.vertical = true;
      }

      const scaleLineX = Math.hypot(
        textState.textLineMatrix[0],
        textState.textLineMatrix[1],
      );
      const scaleCtmX = Math.hypot(textState.ctm[0], textState.ctm[1]);
      textContentItem.textAdvanceScale = scaleCtmX * scaleLineX;

      const { fontSize } = textState;
      textContentItem.trackingSpaceMin = fontSize * TRACKING_SPACE_FACTOR;
      textContentItem.notASpace = fontSize * NOT_A_SPACE_FACTOR;
      textContentItem.negativeSpaceMax = fontSize * NEGATIVE_SPACE_FACTOR;
      textContentItem.spaceInFlowMin = fontSize * SPACE_IN_FLOW_MIN_FACTOR;
      textContentItem.spaceInFlowMax = fontSize * SPACE_IN_FLOW_MAX_FACTOR;
      textContentItem.hasEOL = false;

      textContentItem.initialized = true;
      return textContentItem;
    }

    function updateAdvanceScale() {
      if (!textContentItem.initialized) {
        return;
      }

      const scaleLineX = Math.hypot(
        textState.textLineMatrix[0],
        textState.textLineMatrix[1],
      );
      const scaleCtmX = Math.hypot(textState.ctm[0], textState.ctm[1]);
      const scaleFactor = scaleCtmX * scaleLineX;
      if (scaleFactor === textContentItem.textAdvanceScale) {
        return;
      }

      if (!textContentItem.vertical) {
        textContentItem.totalWidth += textContentItem.width *
          textContentItem.textAdvanceScale;
        textContentItem.width = 0;
      } else {
        textContentItem.totalHeight += textContentItem.height *
          textContentItem.textAdvanceScale;
        textContentItem.height = 0;
      }

      textContentItem.textAdvanceScale = scaleFactor;
    }

    function runBidiTransform(
      textChunk: TextContentItem_,
    ): TextItem {
      let text = textChunk.str.join("");
      if (!disableNormalization) {
        text = normalizeUnicode(text);
      }
      const bidiResult = bidi(text, -1, textChunk.vertical);
      return {
        str: bidiResult.str,
        dir: bidiResult.dir,
        width: Math.abs(textChunk.totalWidth),
        height: Math.abs(textChunk.totalHeight),
        transform: textChunk.transform!,
        fontName: textChunk.fontName,
        hasEOL: textChunk.hasEOL,
      };
    }

    function handleSetFont(fontName?: string, fontRef?: Ref) {
      return self
        .loadFont(fontName, fontRef, resources!)
        .then((translated) => {
          if (!translated.font.isType3Font) {
            return translated;
          }
          return translated
            .loadType3Data(self, resources!, task)
            .catch(() => {
              // Ignore Type3-parsing errors, since we only use `loadType3Data`
              // here to ensure that we'll always obtain a useful /FontBBox.
            })
            .then(() => translated);
        })
        .then((translated) => {
          textState.loadedName = translated.loadedName;
          textState.font = translated.font;
          textState.fontMatrix = translated.font.fontMatrix ||
            FONT_IDENTITY_MATRIX;
        });
    }

    function applyInverseRotation(x: number, y: number, matrix: matrix_t) {
      const scale = Math.hypot(matrix[0], matrix[1]);
      return [
        (matrix[0] * x + matrix[1] * y) / scale,
        (matrix[2] * x + matrix[3] * y) / scale,
      ];
    }

    function compareWithLastPosition(glyphWidth: number) {
      const currentTransform = getCurrentTextTransform();
      let posX = currentTransform[4];
      let posY = currentTransform[5];

      // Check if the glyph is in the viewbox.
      if (textState.font?.vertical) {
        if (
          posX < viewBox[0] ||
          posX > viewBox[2] ||
          posY + glyphWidth < viewBox[1] ||
          posY > viewBox[3]
        ) {
          return false;
        }
      } else if (
        posX + glyphWidth < viewBox[0] ||
        posX > viewBox[2] ||
        posY < viewBox[1] ||
        posY > viewBox[3]
      ) {
        return false;
      }

      if (!textState.font || !textContentItem.prevTransform) {
        return true;
      }

      let lastPosX = textContentItem.prevTransform[4];
      let lastPosY = textContentItem.prevTransform[5];

      if (lastPosX === posX && lastPosY === posY) {
        return true;
      }

      let rotate = -1;
      // Take into account the rotation is the current transform.
      if (
        currentTransform[0] &&
        currentTransform[1] === 0 &&
        currentTransform[2] === 0
      ) {
        rotate = currentTransform[0] > 0 ? 0 : 180;
      } else if (
        currentTransform[1] &&
        currentTransform[0] === 0 &&
        currentTransform[3] === 0
      ) {
        rotate = currentTransform[1] > 0 ? 90 : 270;
      }

      switch (rotate) {
        case 0:
          break;
        case 90:
          [posX, posY] = [posY, posX];
          [lastPosX, lastPosY] = [lastPosY, lastPosX];
          break;
        case 180:
          [posX, posY, lastPosX, lastPosY] = [
            -posX,
            -posY,
            -lastPosX,
            -lastPosY,
          ];
          break;
        case 270:
          [posX, posY] = [-posY, -posX];
          [lastPosX, lastPosY] = [-lastPosY, -lastPosX];
          break;
        default:
          // This is not a 0, 90, 180, 270 rotation so:
          //  - remove the scale factor from the matrix to get a rotation matrix
          //  - apply the inverse (which is the transposed) to the positions
          // and we can then compare positions of the glyphes to detect
          // a whitespace.
          [posX, posY] = applyInverseRotation(posX, posY, currentTransform);
          [lastPosX, lastPosY] = applyInverseRotation(
            lastPosX,
            lastPosY,
            textContentItem.prevTransform,
          );
      }

      if (textState.font.vertical) {
        const advanceY = (lastPosY - posY) / textContentItem.textAdvanceScale;
        const advanceX = posX - lastPosX;

        // When the total height of the current chunk is negative
        // then we're writing from bottom to top.
        const textOrientation = Math.sign(textContentItem.height);
        if (advanceY < textOrientation * textContentItem.negativeSpaceMax) {
          if (
            Math.abs(advanceX) >
              0.5 * textContentItem.width /* not the same column */
          ) {
            appendEOL();
            return true;
          }

          resetLastChars();
          flushTextContentItem();
          return true;
        }

        if (Math.abs(advanceX) > textContentItem.width) {
          appendEOL();
          return true;
        }

        if (advanceY <= textOrientation * textContentItem.notASpace) {
          // The real spacing between 2 consecutive chars is thin enough to be
          // considered a non-space.
          resetLastChars();
        }

        if (advanceY <= textOrientation * textContentItem.trackingSpaceMin) {
          if (shouldAddWhitepsace()) {
            // The space is very thin, hence it deserves to have its own span in
            // order to avoid too much shift between the canvas and the text
            // layer.
            resetLastChars();
            flushTextContentItem();
            pushWhitespace({ height: Math.abs(advanceY) });
          } else {
            textContentItem.height += advanceY;
          }
        } else if (
          !addFakeSpaces(
            advanceY,
            textContentItem.prevTransform,
            textOrientation,
          )
        ) {
          if (textContentItem.str.length === 0) {
            resetLastChars();
            pushWhitespace({ height: Math.abs(advanceY) });
          } else {
            textContentItem.height += advanceY;
          }
        }

        if (Math.abs(advanceX) > textContentItem.width * VERTICAL_SHIFT_RATIO) {
          flushTextContentItem();
        }

        return true;
      }

      const advanceX = (posX - lastPosX) / textContentItem.textAdvanceScale;
      const advanceY = posY - lastPosY;

      // When the total width of the current chunk is negative
      // then we're writing from right to left.
      const textOrientation = Math.sign(textContentItem.width);
      if (advanceX < textOrientation * textContentItem.negativeSpaceMax) {
        if (
          Math.abs(advanceY) >
            0.5 * textContentItem.height /* not the same line */
        ) {
          appendEOL();
          return true;
        }

        // We're moving back so in case the last char was a whitespace
        // we cancel it: it doesn't make sense to insert it.
        resetLastChars();
        flushTextContentItem();
        return true;
      }

      if (Math.abs(advanceY) > textContentItem.height) {
        appendEOL();
        return true;
      }

      if (advanceX <= textOrientation * textContentItem.notASpace) {
        // The real spacing between 2 consecutive chars is thin enough to be
        // considered a non-space.
        resetLastChars();
      }

      if (advanceX <= textOrientation * textContentItem.trackingSpaceMin) {
        if (shouldAddWhitepsace()) {
          // The space is very thin, hence it deserves to have its own span in
          // order to avoid too much shift between the canvas and the text
          // layer.
          resetLastChars();
          flushTextContentItem();
          pushWhitespace({ width: Math.abs(advanceX) });
        } else {
          textContentItem.width += advanceX;
        }
      } else if (
        !addFakeSpaces(advanceX, textContentItem.prevTransform, textOrientation)
      ) {
        if (textContentItem.str.length === 0) {
          resetLastChars();
          pushWhitespace({ width: Math.abs(advanceX) });
        } else {
          textContentItem.width += advanceX;
        }
      }

      if (Math.abs(advanceY) > textContentItem.height * VERTICAL_SHIFT_RATIO) {
        flushTextContentItem();
      }

      return true;
    }

    function buildTextContentItem(
      { chars, extraSpacing }: _BuildTextContentItemP,
    ) {
      const font = textState.font!;
      if (!chars) {
        // Just move according to the space we have.
        const charSpacing = textState.charSpacing + extraSpacing;
        if (charSpacing) {
          if (!font.vertical) {
            textState.translateTextMatrix(
              charSpacing * textState.textHScale,
              0,
            );
          } else {
            textState.translateTextMatrix(0, -charSpacing);
          }
        }

        return;
      }

      const glyphs = font.charsToGlyphs(chars);
      const scale = textState.fontMatrix[0] * textState.fontSize;

      for (let i = 0, ii = glyphs.length; i < ii; i++) {
        const glyph = glyphs[i];
        const { category } = glyph;

        if (category.isInvisibleFormatMark) {
          continue;
        }
        let charSpacing = textState.charSpacing +
          (i + 1 === ii ? extraSpacing : 0);

        let glyphWidth = glyph.width;
        if (font.vertical) {
          glyphWidth = glyph.vmetric ? glyph.vmetric[0] : -glyphWidth!;
        }
        let scaledDim = glyphWidth! * scale;

        if (category.isWhitespace) {
          // Don't push a " " in the textContentItem
          // (except when it's between two non-spaces chars),
          // it will be done (if required) in next call to
          // compareWithLastPosition.
          // This way we can merge real spaces and spaces due to cursor moves.
          if (!font.vertical) {
            charSpacing += scaledDim + textState.wordSpacing;
            textState.translateTextMatrix(
              charSpacing * textState.textHScale,
              0,
            );
          } else {
            charSpacing += -scaledDim + textState.wordSpacing;
            textState.translateTextMatrix(0, -charSpacing);
          }
          saveLastChar(" ");
          continue;
        }

        if (
          !category.isZeroWidthDiacritic &&
          !compareWithLastPosition(scaledDim)
        ) {
          // The glyph is not in page so just skip it but move the cursor.
          if (!font.vertical) {
            textState.translateTextMatrix(scaledDim * textState.textHScale, 0);
          } else {
            textState.translateTextMatrix(0, scaledDim);
          }
          continue;
        }

        // Must be called after compareWithLastPosition because
        // the textContentItem could have been flushed.
        const textChunk = ensureTextContentItem();
        if (category.isZeroWidthDiacritic) {
          scaledDim = 0;
        }

        if (!font.vertical) {
          scaledDim *= textState.textHScale;
          textState.translateTextMatrix(scaledDim, 0);
          textChunk.width += scaledDim;
        } else {
          textState.translateTextMatrix(0, scaledDim);
          scaledDim = Math.abs(scaledDim);
          textChunk.height += scaledDim;
        }

        if (scaledDim) {
          // Save the position of the last visible character.
          textChunk.prevTransform = getCurrentTextTransform();
        }

        const glyphUnicode = glyph.unicode;
        if (saveLastChar(glyphUnicode)) {
          // The two last chars are a non-whitespace followed by a whitespace
          // and then this non-whitespace, so we insert a whitespace here.
          // Replaces all whitespaces with standard spaces (0x20), to avoid
          // alignment issues between the textLayer and the canvas if the text
          // contains e.g. tabs (fixes issue6612.pdf).
          textChunk.str.push(" ");
        }
        textChunk.str.push(glyphUnicode);

        if (charSpacing) {
          if (!font.vertical) {
            textState.translateTextMatrix(
              charSpacing * textState.textHScale,
              0,
            );
          } else {
            textState.translateTextMatrix(0, -charSpacing);
          }
        }
      }
    }

    function appendEOL() {
      resetLastChars();
      if (textContentItem.initialized) {
        textContentItem.hasEOL = true;
        flushTextContentItem();
      } else {
        textContent.items.push({
          str: "",
          dir: "ltr",
          width: 0,
          height: 0,
          transform: getCurrentTextTransform(),
          fontName: textState.loadedName,
          hasEOL: true,
        });
      }
    }

    function addFakeSpaces(
      width: number,
      transf: matrix_t | undefined,
      textOrientation: number,
    ) {
      if (
        textOrientation * textContentItem.spaceInFlowMin <= width &&
        width <= textOrientation * textContentItem.spaceInFlowMax
      ) {
        if (textContentItem.initialized) {
          resetLastChars();
          textContentItem.str.push(" ");
        }
        return false;
      }

      const fontName = textContentItem.fontName;

      let height = 0;
      if (textContentItem.vertical) {
        height = width;
        width = 0;
      }

      flushTextContentItem();
      resetLastChars();
      pushWhitespace({
        width: Math.abs(width),
        height: Math.abs(height),
        transform: transf || getCurrentTextTransform(),
        fontName,
      });

      return true;
    }

    function flushTextContentItem() {
      if (!textContentItem.initialized || !textContentItem.str) {
        return;
      }

      // Do final text scaling.
      if (!textContentItem.vertical) {
        textContentItem.totalWidth += textContentItem.width *
          textContentItem.textAdvanceScale;
      } else {
        textContentItem.totalHeight += textContentItem.height *
          textContentItem.textAdvanceScale;
      }

      textContent.items.push(runBidiTransform(textContentItem));
      textContentItem.initialized = false;
      textContentItem.str.length = 0;
    }

    function enqueueChunk(batch = false) {
      const length = textContent.items.length;
      if (length === 0) {
        return;
      }
      if (batch && length < TEXT_CHUNK_BATCH_SIZE) {
        return;
      }
      sink.enqueue(textContent, length);
      textContent.items = [];
      textContent.styles = Object.create(null);
    }

    const timeSlotManager = new TimeSlotManager();

    return new Promise<void>(function promiseBody(resolve, reject) {
      const next = (promise?: Promise<void>) => {
        enqueueChunk(/* batch = */ true);
        Promise.all([promise, sink.ready]).then(() => {
          try {
            promiseBody(resolve, reject);
          } catch (ex) {
            reject(ex);
          }
        }, reject);
      };
      task.ensureNotTerminated();
      timeSlotManager.reset();

      const operation = <Operation> {};
      let stop,
        args: ObjNoCmd[] = [],
        name: string,
        isValidName: boolean;
      while (!(stop = timeSlotManager.check())) {
        // The arguments parsed by read() are not used beyond this loop, so
        // we can reuse the same array on every iteration, thus avoiding
        // unnecessary allocations.
        args.length = 0;
        operation.args = args;
        if (!preprocessor.read(operation)) {
          break;
        }

        const previousState = textState;
        textState = stateManager!.state as TextState;
        const fn = operation.fn;
        args = operation.args;

        switch (fn | 0) {
          case OPS.setFont:
            // Optimization to ignore multiple identical Tf commands.
            const fontNameArg = (args[0] as Name).name,
              fontSizeArg = args[1] as number;
            if (
              textState.font &&
              fontNameArg === textState.fontName &&
              fontSizeArg === textState.fontSize
            ) {
              break;
            }

            flushTextContentItem();
            textState.fontName = fontNameArg;
            textState.fontSize = fontSizeArg;
            next(handleSetFont(fontNameArg));
            return;
          case OPS.setTextRise:
            textState.textRise = args[0] as number;
            break;
          case OPS.setHScale:
            textState.textHScale = args[0] as number / 100;
            break;
          case OPS.setLeading:
            textState.leading = args[0] as number;
            break;
          case OPS.moveText:
            textState.translateTextLineMatrix(
              args[0] as number,
              args[1] as number,
            );
            textState.textMatrix = textState.textLineMatrix.slice() as matrix_t;
            break;
          case OPS.setLeadingMoveText:
            textState.leading = -(args[1] as number);
            textState.translateTextLineMatrix(
              args[0] as number,
              args[1] as number,
            );
            textState.textMatrix = textState.textLineMatrix.slice() as matrix_t;
            break;
          case OPS.nextLine:
            textState.carriageReturn();
            break;
          case OPS.setTextMatrix:
            textState.setTextMatrix(
              args[0] as number,
              args[1] as number,
              args[2] as number,
              args[3] as number,
              args[4] as number,
              args[5] as number,
            );
            textState.setTextLineMatrix(
              args[0] as number,
              args[1] as number,
              args[2] as number,
              args[3] as number,
              args[4] as number,
              args[5] as number,
            );
            updateAdvanceScale();
            break;
          case OPS.setCharSpacing:
            textState.charSpacing = args[0] as number;
            break;
          case OPS.setWordSpacing:
            textState.wordSpacing = args[0] as number;
            break;
          case OPS.beginText:
            textState.textMatrix = IDENTITY_MATRIX.slice() as matrix_t;
            textState.textLineMatrix = IDENTITY_MATRIX.slice() as matrix_t;
            break;
          case OPS.showSpacedText:
            if (!stateManager!.state.font) {
              self.ensureStateFont(stateManager!.state);
              continue;
            }

            const spaceFactor =
              ((textState.font!.vertical ? 1 : -1) * textState.fontSize) / 1000;
            const elements = args[0] as (number | string)[];
            for (let i = 0, ii = elements.length; i < ii; i++) {
              const item = elements[i];
              if (typeof item === "string") {
                showSpacedTextBuffer.push(item);
              } else if (typeof item === "number" && item !== 0) {
                // PDF Specification 5.3.2 states:
                // The number is expressed in thousandths of a unit of text
                // space.
                // This amount is subtracted from the current horizontal or
                // vertical coordinate, depending on the writing mode.
                // In the default coordinate system, a positive adjustment
                // has the effect of moving the next glyph painted either to
                // the left or down by the given amount.
                const str = showSpacedTextBuffer.join("");
                showSpacedTextBuffer.length = 0;
                buildTextContentItem({
                  chars: str,
                  extraSpacing: item * spaceFactor,
                });
              }
            }

            if (showSpacedTextBuffer.length > 0) {
              const str = showSpacedTextBuffer.join("");
              showSpacedTextBuffer.length = 0;
              buildTextContentItem({
                chars: str,
                extraSpacing: 0,
              });
            }
            break;
          case OPS.showText:
            if (!stateManager!.state.font) {
              self.ensureStateFont(stateManager!.state);
              continue;
            }
            buildTextContentItem({
              chars: args[0] as string,
              extraSpacing: 0,
            });
            break;
          case OPS.nextLineShowText:
            if (!stateManager!.state.font) {
              self.ensureStateFont(stateManager!.state);
              continue;
            }
            textState.carriageReturn();
            buildTextContentItem({
              chars: args[0] as string,
              extraSpacing: 0,
            });
            break;
          case OPS.nextLineSetSpacingShowText:
            if (!stateManager!.state.font) {
              self.ensureStateFont(stateManager!.state);
              continue;
            }
            textState.wordSpacing = <number> args[0];
            textState.charSpacing = <number> args[1];
            textState.carriageReturn();
            buildTextContentItem({
              chars: args[2] as string,
              extraSpacing: 0,
            });
            break;
          case OPS.paintXObject:
            flushTextContentItem();
            if (!xobjs) {
              xobjs = resources!.get("XObject") as Dict || Dict.empty;
            }

            isValidName = args[0] instanceof Name;
            name = (args[0] as Name).name;

            if (isValidName && emptyXObjectCache.getByName(name)) {
              break;
            }

            next(
              new Promise<void>((resolveXObject, rejectXObject) => {
                if (!isValidName) {
                  throw new FormatError("XObject must be referred to by name.");
                }

                let xobj = xobjs!.getRaw(name);
                if (xobj instanceof Ref) {
                  if (emptyXObjectCache.getByRef(xobj)) {
                    resolveXObject();
                    return;
                  }

                  const globalImage = self.globalImageCache!.getData(
                    xobj,
                    self.pageIndex,
                  );
                  if (globalImage) {
                    resolveXObject();
                    return;
                  }

                  xobj = xref.fetch(xobj);
                }

                if (!(xobj instanceof BaseStream)) {
                  throw new FormatError("XObject should be a stream");
                }

                const type = xobj.dict!.get("Subtype");
                if (!(type instanceof Name)) {
                  throw new FormatError("XObject should have a Name subtype");
                }

                if (type.name !== "Form") {
                  emptyXObjectCache.set(name, xobj.dict!.objId, true);

                  resolveXObject();
                  return;
                }

                // Use a new `StateManager` to prevent incorrect positioning
                // of textItems *after* the Form XObject, since errors in the
                // data can otherwise prevent `restore` operators from
                // executing.
                // NOTE: Only an issue when `options.ignoreErrors === true`.
                const currentState = stateManager!.state.clone!();
                const xObjStateManager = new StateManager(currentState);

                const matrix = xobj.dict!.getArray("Matrix");
                if (Array.isArray(matrix) && matrix.length === 6) {
                  xObjStateManager.transform(<matrix_t> matrix);
                }

                // Enqueue the `textContent` chunk before parsing the /Form
                // XObject.
                enqueueChunk();
                const sinkWrapper = {
                  enqueueInvoked: false,

                  enqueue(
                    chunk: MActionMap["GetTextContent"]["Sinkchunk"],
                    size?: number,
                  ) {
                    this.enqueueInvoked = true;
                    sink.enqueue(chunk, size);
                  },

                  get desiredSize() {
                    return sink.desiredSize;
                  },

                  get ready() {
                    return sink.ready;
                  },
                };

                self.getTextContent({
                  stream: xobj,
                  task,
                  resources: <Dict> xobj.dict!.get("Resources") || resources,
                  stateManager: xObjStateManager,
                  includeMarkedContent,
                  sink: sinkWrapper,
                  seenStyles,
                  viewBox,
                  markedContentData,
                  disableNormalization,
                })
                  .then(() => {
                    if (!sinkWrapper.enqueueInvoked) {
                      emptyXObjectCache.set(
                        name,
                        (xobj as BaseStream).dict!.objId,
                        true,
                      );
                    }
                    resolveXObject();
                  }, rejectXObject);
              }).catch((reason) => {
                if (reason instanceof AbortException) {
                  return;
                }
                if (self.options.ignoreErrors) {
                  // Error(s) in the XObject -- allow text-extraction to
                  // continue.
                  warn(`getTextContent - ignoring XObject: "${reason}".`);
                  return;
                }
                throw reason;
              }),
            );
            return;
          case OPS.setGState:
            isValidName = args[0] instanceof Name;
            name = (args[0] as Name).name;

            if (isValidName && emptyGStateCache.getByName(name)) {
              break;
            }

            next(
              new Promise<void>((resolveGState, rejectGState) => {
                if (!isValidName) {
                  throw new FormatError("GState must be referred to by name.");
                }

                const extGState = resources!.get("ExtGState");
                if (!(extGState instanceof Dict)) {
                  throw new FormatError("ExtGState should be a dictionary.");
                }

                const gState = extGState.get(name);
                // TODO: Attempt to lookup cached GStates by reference as well,
                //       if and only if there are PDF documents where doing so
                //       would significantly improve performance.
                if (!(gState instanceof Dict)) {
                  throw new FormatError("GState should be a dictionary.");
                }

                const gStateFont = gState.get("Font") as [Ref, number];
                if (!gStateFont) {
                  emptyGStateCache.set(name, gState.objId, true);

                  resolveGState();
                  return;
                }
                flushTextContentItem();

                textState.fontName = undefined;
                textState.fontSize = gStateFont[1];
                handleSetFont(undefined, gStateFont[0]).then(
                  resolveGState,
                  rejectGState,
                );
              }).catch((reason) => {
                if (reason instanceof AbortException) {
                  return;
                }
                if (self.options.ignoreErrors) {
                  // Error(s) in the ExtGState -- allow text-extraction to
                  // continue.
                  warn(`getTextContent - ignoring ExtGState: "${reason}".`);
                  return;
                }
                throw reason;
              }),
            );
            return;
          case OPS.beginMarkedContent:
            flushTextContentItem();
            if (includeMarkedContent) {
              markedContentData!.level++;

              textContent.items.push({
                type: "beginMarkedContent",
                tag: args[0] instanceof Name ? args[0].name : undefined,
              });
            }
            break;
          case OPS.beginMarkedContentProps:
            flushTextContentItem();
            if (includeMarkedContent) {
              markedContentData!.level++;

              let mcid;
              if (args[1] instanceof Dict) {
                mcid = args[1].get("MCID");
              }
              textContent.items.push({
                type: "beginMarkedContentProps",
                id: Number.isInteger(mcid)
                  ? `${self.idFactory.getPageObjId()}_mc${mcid as number}`
                  : undefined,
                tag: args[0] instanceof Name ? args[0].name : undefined,
              });
            }
            break;
          case OPS.endMarkedContent:
            flushTextContentItem();
            if (includeMarkedContent) {
              if (markedContentData!.level === 0) {
                // Handle unbalanced beginMarkedContent/endMarkedContent
                // operators (fixes issue15629.pdf).
                break;
              }
              markedContentData!.level--;

              textContent.items.push({
                type: "endMarkedContent",
              });
            }
            break;
          case OPS.restore:
            if (
              previousState &&
              (previousState.font !== textState.font ||
                previousState.fontSize !== textState.fontSize ||
                previousState.fontName !== textState.fontName)
            ) {
              flushTextContentItem();
            }
            break;
        } // switch
        if (textContent.items.length >= sink.desiredSize!) {
          // Wait for ready, if we reach highWaterMark.
          stop = true;
          break;
        }
      } // while
      if (stop) {
        next(deferred);
        return;
      }
      flushTextContentItem();
      enqueueChunk();
      resolve();
    }).catch((reason) => {
      if (reason instanceof AbortException) {
        return;
      }
      if (this.options.ignoreErrors) {
        // Error(s) in the TextContent -- allow text-extraction to continue.
        warn(
          `getTextContent - ignoring errors during "${task.name}" task: "${reason}".`,
        );

        flushTextContentItem();
        enqueueChunk();
        return;
      }
      throw reason;
    });
  }

  extractDataStructures(
    dict: FontDict,
    baseDict: FontDict,
    properties: FontProps,
  ) {
    const xref = this.xref;
    let cidToGidBytes: Uint8Array | Uint8ClampedArray;
    // 9.10.2
    const toUnicodePromise = this.readToUnicode(
      (
        properties.toUnicode || dict.get("ToUnicode") ||
        baseDict.get("ToUnicode")
      ) as Name | DecodeStream | undefined,
    );

    if (properties.composite) {
      // CIDSystemInfo helps to match CID to glyphs
      const cidSystemInfo = dict.get("CIDSystemInfo"); // Table 116
      if (cidSystemInfo instanceof Dict) {
        properties.cidSystemInfo = {
          registry: stringToPDFString(
            (cidSystemInfo as Dict).get("Registry") as string,
          ),
          ordering: stringToPDFString(
            (cidSystemInfo as Dict).get("Ordering") as string,
          ),
          supplement: (cidSystemInfo as Dict).get("Supplement") as number,
        };
      }

      try {
        const cidToGidMap = dict.get("CIDToGIDMap");
        if ((cidToGidMap instanceof BaseStream)) {
          cidToGidBytes = cidToGidMap.getBytes();
        }
      } catch (ex) {
        if (!this.options.ignoreErrors) {
          throw ex;
        }
        warn(`extractDataStructures - ignoring CIDToGIDMap data: "${ex}".`);
      }
    }

    // Based on 9.6.6 of the spec the encoding can come from multiple places
    // and depends on the font type. The base encoding and differences are
    // read here, but the encoding that is actually used is chosen during
    // glyph mapping in the font.
    // TODO: Loading the built in encoding in the font would allow the
    // differences to be merged in here not require us to hold on to it.
    const differences: string[] = [];
    let baseEncodingName: Name | string | undefined;
    let encoding;
    if (dict.has("Encoding")) {
      encoding = dict.get("Encoding") as Dict | Name;
      if (encoding instanceof Dict) {
        baseEncodingName = encoding.get("BaseEncoding") as Name | undefined;
        baseEncodingName = baseEncodingName instanceof Name
          ? baseEncodingName.name
          : undefined;
        // Load the differences between the base and original
        if (encoding.has("Differences")) {
          const diffEncoding = encoding.get("Differences") as Obj[];
          let index = 0;
          for (const entry of diffEncoding) {
            const data = xref.fetchIfRef(entry);
            if (typeof data === "number") {
              index = data;
            } else if (data instanceof Name) {
              differences[index++] = data.name;
            } else {
              throw new FormatError(
                `Invalid entry in 'Differences' array: ${data as any}`,
              );
            }
          }
        }
      } else if (encoding instanceof Name) {
        baseEncodingName = encoding.name;
      } else {
        const msg = "Encoding is not a Name nor a Dict";

        if (!this.options.ignoreErrors) {
          throw new FormatError(msg);
        }
        warn(msg);
      }
      // According to table 114 if the encoding is a named encoding it must be
      // one of these predefined encodings.
      if (
        baseEncodingName !== "MacRomanEncoding" &&
        baseEncodingName !== "MacExpertEncoding" &&
        baseEncodingName !== "WinAnsiEncoding"
      ) {
        baseEncodingName = undefined;
      }
    }

    const nonEmbeddedFont = !properties.file || properties.isInternalFont,
      isSymbolsFontName = getSymbolsFonts()[properties.name];
    // Ignore an incorrectly specified named encoding for non-embedded
    // symbol fonts (fixes issue16464.pdf).
    if (baseEncodingName && nonEmbeddedFont && isSymbolsFontName) {
      baseEncodingName = undefined;
    }

    if (baseEncodingName) {
      properties.defaultEncoding = getEncoding(baseEncodingName as string);
    } else {
      const isSymbolicFont = !!(properties.flags & FontFlags.Symbolic);
      const isNonsymbolicFont = !!(properties.flags & FontFlags.Nonsymbolic);
      // According to "Table 114" in section "9.6.6.1 General" (under
      // "9.6.6 Character Encoding") of the PDF specification, a Nonsymbolic
      // font should use the `StandardEncoding` if no encoding is specified.
      encoding = StandardEncoding;
      if (properties.type === "TrueType" && !isNonsymbolicFont) {
        encoding = WinAnsiEncoding;
      }
      // The Symbolic attribute can be misused for regular fonts
      // Heuristic: we have to check if the font is a standard one also
      if (isSymbolicFont || isSymbolsFontName) {
        encoding = MacRomanEncoding;
        if (nonEmbeddedFont) {
          if (/Symbol/i.test(properties.name)) {
            encoding = SymbolSetEncoding;
          } else if (/Dingbats/i.test(properties.name)) {
            encoding = ZapfDingbatsEncoding;
          } else if (/Wingdings/i.test(properties.name)) {
            encoding = WinAnsiEncoding;
          }
        }
      }
      properties.defaultEncoding = encoding;
    }

    properties.differences = differences;
    properties.baseEncodingName = baseEncodingName as string | undefined;
    properties.hasEncoding = !!baseEncodingName || differences.length > 0;
    properties.dict = dict;
    return toUnicodePromise
      .then((readToUnicode) => {
        properties.toUnicode = readToUnicode;
        return this.buildToUnicode(properties);
      })
      .then((builtToUnicode) => {
        properties.toUnicode = builtToUnicode;
        if (cidToGidBytes) {
          properties.cidToGidMap = this.readCidToGidMap(
            cidToGidBytes,
            builtToUnicode,
          );
        }
        return properties;
      });
  }

  private _simpleFontToUnicode(
    properties: FontProps,
    forceGlyphs = false,
  ): string[] {
    assert(!properties.composite, "Must be a simple font.");

    const toUnicode: string[] = [];
    const encoding = properties.defaultEncoding!.slice();
    const baseEncodingName = properties.baseEncodingName;
    // Merge in the differences array.
    const differences = properties.differences;
    for (const charcode in differences) {
      const glyphName = differences[+charcode];
      if (glyphName === ".notdef") {
        // Skip .notdef to prevent rendering errors, e.g. boxes appearing
        // where there should be spaces (fixes issue5256.pdf).
        continue;
      }
      encoding[+charcode] = glyphName;
    }
    const glyphsUnicodeMap = getGlyphsUnicode();
    for (const charcode in encoding) {
      // a) Map the character code to a character name.
      let glyphName = encoding[charcode];
      if (glyphName === "") {
        continue;
      }
      // b) Look up the character name in the Adobe Glyph List (see the
      //    Bibliography) to obtain the corresponding Unicode value.
      let unicode: number = glyphsUnicodeMap[glyphName];
      if (unicode !== undefined) {
        toUnicode[charcode] = String.fromCharCode(unicode);
        continue;
      }
      // (undocumented) c) Few heuristics to recognize unknown glyphs
      // NOTE: Adobe Reader does not do this step, but OSX Preview does
      let code = 0;
      switch (glyphName[0]) {
        case "G": // Gxx glyph
          if (glyphName.length === 3) {
            code = parseInt(glyphName.substring(1), 16);
          }
          break;
        case "g": // g00xx glyph
          if (glyphName.length === 5) {
            code = parseInt(glyphName.substring(1), 16);
          }
          break;
        case "C": // Cdd{d} glyph
        case "c": // cdd{d} glyph
          if (glyphName.length >= 3 && glyphName.length <= 4) {
            const codeStr = glyphName.substring(1);

            if (forceGlyphs) {
              code = parseInt(codeStr, 16);
              break;
            }
            // Normally the Cdd{d}/cdd{d} glyphName format will contain
            // regular, i.e. base 10, charCodes (see issue4550.pdf)...
            code = +codeStr;

            // ... however some PDF generators violate that assumption by
            // containing glyph, i.e. base 16, codes instead.
            // In that case we need to re-parse the *entire* encoding to
            // prevent broken text-selection (fixes issue9655_reduced.pdf).
            if (Number.isNaN(code) && Number.isInteger(parseInt(codeStr, 16))) {
              return this._simpleFontToUnicode(
                properties,
                /* forceGlyphs */ true,
              );
            }
          }
          break;
        case "u": // 'uniXXXX'/'uXXXX{XX}' glyphs
          unicode = getUnicodeForGlyph(glyphName, glyphsUnicodeMap);
          if (unicode !== -1) {
            code = unicode;
          }
          break;
        default:
          // Support (some) non-standard ligatures.
          switch (glyphName) {
            case "f_h":
            case "f_t":
            case "T_h":
              toUnicode[charcode] = glyphName.replaceAll("_", "");
              continue;
          }
          break;
      }
      if (code > 0 && code <= 0x10ffff && Number.isInteger(code)) {
        // If `baseEncodingName` is one the predefined encodings, and `code`
        // equals `charcode`, using the glyph defined in the baseEncoding
        // seems to yield a better `toUnicode` mapping (fixes issue 5070).
        if (baseEncodingName && code === +charcode) {
          const baseEncoding = getEncoding(baseEncodingName);
          if (baseEncoding && (glyphName = baseEncoding[charcode])) {
            toUnicode[charcode] = String.fromCharCode(
              +glyphsUnicodeMap[glyphName],
            );
            continue;
          }
        }
        toUnicode[charcode] = String.fromCodePoint(code);
      }
    }
    return toUnicode;
  }

  /**
   * Builds a char code to unicode map based on section 9.10 of the spec.
   * @param properties Font properties object.
   * @return A Promise that is resolved with a
   *   {ToUnicodeMap|IdentityToUnicodeMap} object.
   */
  async buildToUnicode(properties: FontProps) {
    properties.hasIncludedToUnicodeMap = !!properties.toUnicode &&
      (properties.toUnicode as IdentityToUnicodeMap | ToUnicodeMap).length > 0;

    // Section 9.10.2 Mapping Character Codes to Unicode Values
    if (properties.hasIncludedToUnicodeMap) {
      // Some fonts contain incomplete ToUnicode data, causing issues with
      // text-extraction. For simple fonts, containing encoding information,
      // use a fallback ToUnicode map to improve this (fixes issue8229.pdf).
      if (!properties.composite && properties.hasEncoding) {
        properties.fallbackToUnicode = this._simpleFontToUnicode(properties);
      }
      return properties.toUnicode as IdentityToUnicodeMap | ToUnicodeMap;
    }

    // According to the spec if the font is a simple font we should only map
    // to unicode if the base encoding is MacRoman, MacExpert, or WinAnsi or
    // the differences array only contains adobe standard or symbol set names,
    // in pratice it seems better to always try to create a toUnicode map
    // based of the default encoding.
    if (!properties.composite /* is simple font */) {
      return new ToUnicodeMap(this._simpleFontToUnicode(properties));
    }

    // If the font is a composite font that uses one of the predefined CMaps
    // listed in Table 118 (except Identity–H and Identity–V) or whose
    // descendant CIDFont uses the Adobe-GB1, Adobe-CNS1, Adobe-Japan1, or
    // Adobe-Korea1 character collection:
    if (
      properties.composite &&
      ((properties.cMap!.builtInCMap &&
        !(properties.cMap instanceof IdentityCMap)) ||
        (properties.cidSystemInfo!.registry === "Adobe" &&
          (properties.cidSystemInfo!.ordering === "GB1" ||
            properties.cidSystemInfo!.ordering === "CNS1" ||
            properties.cidSystemInfo!.ordering === "Japan1" ||
            properties.cidSystemInfo!.ordering === "Korea1")))
    ) {
      // Then:
      // a) Map the character code to a character identifier (CID) according
      // to the font’s CMap.
      // b) Obtain the registry and ordering of the character collection used
      // by the font’s CMap (for example, Adobe and Japan1) from its
      // CIDSystemInfo dictionary.
      const { registry, ordering } = properties.cidSystemInfo!;
      // c) Construct a second CMap name by concatenating the registry and
      // ordering obtained in step (b) in the format registry–ordering–UCS2
      // (for example, Adobe–Japan1–UCS2).
      const ucs2CMapName = Name.get(`${registry}-${ordering}-UCS2`);
      // d) Obtain the CMap with the name constructed in step (c) (available
      // from the ASN Web site; see the Bibliography).
      const ucs2CMap = await CMapFactory.create({
        encoding: ucs2CMapName,
        fetchBuiltInCMap: this.fetchBuiltInCMap,
        // useCMap: null,
      });

      const toUnicode: string[] = [],
        buf: number[] = [];
      properties.cMap!.forEach((charcode, cid) => {
        if (cid as number > 0xffff) {
          throw new FormatError("Max size of CID is 65,535");
        }
        // e) Map the CID obtained in step (a) according to the CMap
        // obtained in step (d), producing a Unicode value.
        const ucs2 = ucs2CMap.lookup(cid as number);
        if (ucs2) {
          // toUnicode[charcode] = String.fromCharCode(
          //   ((<string> ucs2).charCodeAt(0) << 8) +
          //     (<string> ucs2).charCodeAt(1),
          // );
          buf.length = 0;
          // Support multi-byte entries (fixes issue16176.pdf).
          for (let i = 0, ii = (ucs2 as string).length; i < ii; i += 2) {
            buf.push(
              ((ucs2 as string).charCodeAt(i) << 8) +
                (ucs2 as string).charCodeAt(i + 1),
            );
          }
          toUnicode[charcode] = String.fromCharCode(...buf);
        }
      });
      return new ToUnicodeMap(toUnicode);
    }

    // The viewer's choice, just use an identity map.
    return new IdentityToUnicodeMap(properties.firstChar, properties.lastChar);
  }

  readToUnicode(cmapObj?: Name | DecodeStream) {
    if (!cmapObj) {
      return Promise.resolve(undefined);
    }
    if (cmapObj instanceof Name) {
      return CMapFactory.create({
        encoding: cmapObj,
        fetchBuiltInCMap: this.fetchBuiltInCMap,
        // useCMap: null,
      }).then((cmap) => {
        if (cmap instanceof IdentityCMap) {
          return new IdentityToUnicodeMap(0, 0xffff);
        }
        return new ToUnicodeMap(cmap.getMap());
      });
    } else if (cmapObj instanceof BaseStream) {
      return CMapFactory.create({
        encoding: cmapObj,
        fetchBuiltInCMap: this.fetchBuiltInCMap,
        // useCMap: null,
      }).then((cmap) => {
        if (cmap instanceof IdentityCMap) {
          return new IdentityToUnicodeMap(0, 0xffff);
        }
        const map = new Array(cmap.length);
        // Convert UTF-16BE
        // NOTE: cmap can be a sparse array, so use forEach instead of
        // `for( ;;)` to iterate over all keys.
        cmap.forEach((charCode, token) => {
          // Some cmaps contain *only* CID characters (fixes issue9367.pdf).
          if (typeof token === "number") {
            map[charCode] = String.fromCodePoint(token);
            return;
          }
          const str = [];
          for (let k = 0; k < (token as string).length; k += 2) {
            const w1 = ((token as string).charCodeAt(k) << 8) |
              (token as string).charCodeAt(k + 1);
            if ((w1 & 0xf800) !== 0xd800) {
              // w1 < 0xD800 || w1 > 0xDFFF
              str.push(w1);
              continue;
            }
            k += 2;
            const w2 = ((token as string).charCodeAt(k) << 8) |
              (token as string).charCodeAt(k + 1);
            str.push(((w1 & 0x3ff) << 10) + (w2 & 0x3ff) + 0x10000);
          }
          map[charCode] = String.fromCodePoint(...str);
        });
        return new ToUnicodeMap(map);
      }, (reason) => {
        if (reason instanceof AbortException) {
          return undefined;
        }
        if (this.options.ignoreErrors) {
          warn(`readToUnicode - ignoring ToUnicode data: "${reason}".`);
          return undefined;
        }
        throw reason;
      });
    }
    return Promise.resolve(undefined);
  }

  readCidToGidMap(
    glyphsData: Uint8Array | Uint8ClampedArray,
    toUnicode: IdentityToUnicodeMap | ToUnicodeMap,
  ) {
    // Extract the encoding from the CIDToGIDMap

    // Set encoding 0 to later verify the font has an encoding
    const result = [];
    for (let j = 0, jj = glyphsData.length; j < jj; j++) {
      const glyphID = (glyphsData[j++] << 8) | glyphsData[j];
      const code = j >> 1;
      if (glyphID === 0 && !toUnicode.has(code)) {
        continue;
      }
      result[code] = glyphID;
    }
    return result;
  }

  extractWidths(dict: FontDict, descriptor: FontDict, properties: FontProps) {
    const xref = this.xref;
    let glyphsWidths: Record<number, number> = [];
    let defaultWidth = 0;
    const glyphsVMetrics: VMetric[] = [];
    let defaultVMetrics: VMetric;
    let i, ii, j, jj, start: number, code, widths;
    if (properties.composite) {
      defaultWidth = dict.has("DW") ? <number> dict.get("DW") : 1000;

      widths = <(number | number[] | Ref)[]> dict.get("W"); // 9.7.4.3
      if (widths) {
        for (i = 0, ii = widths.length; i < ii; i++) {
          start = <number> xref.fetchIfRef(widths[i++]);
          code = xref.fetchIfRef(widths[i]);
          if (Array.isArray(code)) {
            for (j = 0, jj = code.length; j < jj; j++) {
              glyphsWidths[start++] = <number> xref.fetchIfRef(code[j]);
            }
          } else {
            const width = <number> xref.fetchIfRef(widths[++i]);
            for (j = start; j <= <number> code; j++) {
              glyphsWidths[j] = width;
            }
          }
        }
      }

      if (properties.vertical) {
        const vmetrics_ = <[number, number]> dict.getArray("DW2") ??
          [880, -1000];
        defaultVMetrics = [vmetrics_[1], defaultWidth * 0.5, vmetrics_[0]];
        const vmetrics = <(number | number[] | Ref)[]> dict.get("W2"); // 9.7.4.3
        if (vmetrics) {
          for (i = 0, ii = vmetrics.length; i < ii; i++) {
            start = <number> xref.fetchIfRef(vmetrics[i++]);
            code = xref.fetchIfRef(vmetrics[i]);
            if (Array.isArray(code)) {
              for (j = 0, jj = code.length; j < jj; j++) {
                glyphsVMetrics[start++] = <VMetric> [
                  xref.fetchIfRef(code[j++]),
                  xref.fetchIfRef(code[j++]),
                  xref.fetchIfRef(code[j]),
                ];
              }
            } else {
              const vmetric = <VMetric> [
                xref.fetchIfRef(vmetrics[++i]),
                xref.fetchIfRef(vmetrics[++i]),
                xref.fetchIfRef(vmetrics[++i]),
              ];
              for (j = start; j <= <number> code; j++) {
                glyphsVMetrics[j] = vmetric;
              }
            }
          }
        }
      }
    } else {
      const firstChar = properties.firstChar;
      widths = <(number | Ref)[] | undefined> dict.get("Widths");
      if (widths) {
        j = firstChar;
        for (i = 0, ii = widths.length; i < ii; i++) {
          glyphsWidths[j++] = <number> xref.fetchIfRef(widths[i]);
        }
        defaultWidth = parseFloat(<any> descriptor.get("MissingWidth")) || 0;
      } else {
        // Trying get the BaseFont metrics (see comment above).
        const baseFontName = dict.get("BaseFont");
        if (baseFontName instanceof Name) {
          const metrics = this.getBaseFontMetrics(baseFontName.name);

          glyphsWidths = this.buildCharCodeToWidth(metrics.widths, properties);
          defaultWidth = metrics.defaultWidth;
        }
      }
    }

    // Heuristic: detection of monospace font by checking all non-zero widths
    let isMonospace = true;
    let firstWidth = defaultWidth;
    for (const glyph in glyphsWidths) {
      const glyphWidth = glyphsWidths[glyph];
      if (!glyphWidth) {
        continue;
      }
      if (!firstWidth) {
        firstWidth = glyphWidth;
        continue;
      }
      if (firstWidth !== glyphWidth) {
        isMonospace = false;
        break;
      }
    }
    if (isMonospace) {
      properties.flags |= FontFlags.FixedPitch;
    } else {
      // Clear the flag.
      properties.flags &= ~FontFlags.FixedPitch;
    }

    properties.defaultWidth = defaultWidth;
    properties.widths = glyphsWidths;
    properties.defaultVMetrics = defaultVMetrics!;
    properties.vmetrics = glyphsVMetrics;
  }

  isSerifFont(baseFontName: string) {
    // Simulating descriptor flags attribute
    const fontNameWoStyle = baseFontName.split("-")[0];
    return (
      fontNameWoStyle in getSerifFonts() || /serif/gi.test(fontNameWoStyle)
    );
  }

  getBaseFontMetrics(name: string) {
    let defaultWidth = 0;
    let widths: Record<string, number> = Object.create(null);
    let monospace = false;
    const stdFontMap = getStdFontMap();
    let lookupName = stdFontMap[name] || name;
    const Metrics = getMetrics();

    if (!(lookupName in Metrics)) {
      // Use default fonts for looking up font metrics if the passed
      // font is not a base font
      lookupName = this.isSerifFont(name) ? "Times-Roman" : "Helvetica";
    }
    const glyphWidths = Metrics[lookupName];

    if (typeof glyphWidths === "number") {
      defaultWidth = glyphWidths;
      monospace = true;
    } else {
      widths = glyphWidths(); // expand lazy widths array
    }

    return {
      defaultWidth,
      monospace,
      widths,
    };
  }

  buildCharCodeToWidth(
    widthsByGlyphName: Record<string, number>,
    properties: FontProps,
  ) {
    const widths: Record<number, number> = Object.create(null);
    const differences = properties.differences!;
    const encoding = properties.defaultEncoding!;
    for (let charCode = 0; charCode < 256; charCode++) {
      if (charCode in differences && widthsByGlyphName[differences[charCode]]) {
        widths[charCode] = widthsByGlyphName[differences[charCode]];
        continue;
      }
      if (charCode in encoding && widthsByGlyphName[encoding[charCode]]) {
        widths[charCode] = widthsByGlyphName[encoding[charCode]];
        continue;
      }
    }
    return widths;
  }

  preEvaluateFont(dict: FontDict): PreEvaluatedFont {
    const baseDict = dict;
    let type = dict.get("Subtype");
    if (!(type instanceof Name)) {
      throw new FormatError("invalid font Subtype");
    }

    let composite = false;
    let hash: MurmurHash3_64 | undefined,
      toUnicode;
    if (type.name === "Type0") {
      // If font is a composite
      //  - get the descendant font
      //  - set the type according to the descendant font
      //  - get the FontDescriptor from the descendant font
      const df = dict.get("DescendantFonts");
      if (!df) {
        throw new FormatError("Descendant fonts are not specified");
      }
      dict = (Array.isArray(df) ? this.xref.fetchIfRef(df[0]) : df) as FontDict;

      if (!(dict instanceof Dict)) {
        throw new FormatError("Descendant font is not a dictionary.");
      }
      type = dict.get("Subtype");
      if (!(type instanceof Name)) {
        throw new FormatError("invalid font Subtype");
      }
      composite = true;
    }

    const firstChar = dict.get("FirstChar") as number || 0,
      lastChar = dict.get("LastChar") as number || (composite ? 0xffff : 0xff);
    // Table 122
    const descriptor = dict.get("FontDescriptor") as FontDict | undefined;
    if (descriptor) {
      hash = new MurmurHash3_64();

      const encoding = baseDict.getRaw("Encoding");
      if (encoding instanceof Name) {
        hash.update(encoding.name);
      } else if (encoding instanceof Ref) {
        hash.update(encoding.toString());
      } else if (encoding instanceof Dict) {
        for (const entry of encoding.getRawValues()) {
          if (entry instanceof Name) {
            hash.update(entry.name);
          } else if (entry instanceof Ref) {
            hash.update(entry.toString());
          } else if (Array.isArray(entry)) {
            // 'Differences' array (fixes bug1157493.pdf).
            const diffLength = entry.length,
              diffBuf = new Array(diffLength);

            for (let j = 0; j < diffLength; j++) {
              const diffEntry = entry[j];
              if (diffEntry instanceof Name) {
                diffBuf[j] = diffEntry.name;
              } else if (
                typeof diffEntry === "number" ||
                diffEntry instanceof Ref
              ) {
                diffBuf[j] = diffEntry.toString();
              }
            }
            hash.update(diffBuf.join());
          }
        }
      }

      hash.update(`${firstChar}-${lastChar}`); // Fixes issue10665_reduced.pdf

      toUnicode = <
        | BaseStream
        | Name
        | undefined
      > (dict.get("ToUnicode") || baseDict.get("ToUnicode"));
      if (toUnicode instanceof BaseStream) {
        const stream = (<DecodeStream> toUnicode).str || toUnicode;
        const uint8array = (<DecodeStream> stream).buffer
          ? new Uint8Array(
            (<DecodeStream> stream).buffer.buffer,
            0,
            (<DecodeStream> stream).bufferLength,
          )
          : new Uint8Array(
            (<Stream> stream).bytes.buffer,
            (<Stream> stream).start,
            (<Stream> stream).end - (<Stream> stream).start,
          );
        hash.update(uint8array);
      } else if (toUnicode instanceof Name) {
        hash.update(toUnicode.name);
      }

      const widths = dict.get("Widths") || baseDict.get("Widths");
      if (Array.isArray(widths)) {
        const widthsBuf = [];
        for (const entry of widths) {
          if (typeof entry === "number" || entry instanceof Ref) {
            widthsBuf.push(entry.toString());
          }
        }
        hash.update(widthsBuf.join());
      }

      if (composite) {
        hash.update("compositeFont");

        const compositeWidths = dict.get("W") || baseDict.get("W");
        if (Array.isArray(compositeWidths)) {
          const widthsBuf = [];
          for (const entry of compositeWidths) {
            if (typeof entry === "number" || entry instanceof Ref) {
              widthsBuf.push((<number | Ref> entry).toString());
            } else if (Array.isArray(entry)) {
              const subWidthsBuf = [];
              for (const element of entry) {
                if (typeof element === "number" || element instanceof Ref) {
                  subWidthsBuf.push(element.toString());
                }
              }
              widthsBuf.push(`[${subWidthsBuf.join()}]`);
            }
          }
          hash.update(widthsBuf.join());
        }

        const cidToGidMap = dict.getRaw("CIDToGIDMap") ||
          baseDict.getRaw("CIDToGIDMap");
        if (cidToGidMap instanceof Name) {
          hash.update(cidToGidMap.name);
        } else if (cidToGidMap instanceof Ref) {
          hash.update(cidToGidMap.toString());
        } else if (cidToGidMap instanceof BaseStream) {
          hash.update(cidToGidMap.peekBytes());
        }
      }
    }

    return {
      descriptor,
      dict,
      baseDict,
      composite,
      type: type.name,
      firstChar,
      lastChar,
      toUnicode,
      hash: hash ? hash.hexdigest() : "",
    };
  }

  async translateFont({
    descriptor,
    dict,
    baseDict,
    composite,
    type,
    firstChar,
    lastChar,
    toUnicode,
    cssFontInfo,
  }: PreEvaluatedFont) {
    const isType3Font = type === "Type3";
    let properties: FontProps;

    if (!descriptor) {
      if (isType3Font) {
        // FontDescriptor is only required for Type3 fonts when the document
        // is a tagged pdf. Create a barbebones one to get by.
        descriptor = new Dict();
        descriptor.set("FontName", Name.get(type));
        descriptor.set("FontBBox", dict.getArray("FontBBox") || [0, 0, 0, 0]);
      } else {
        // Before PDF 1.5 if the font was one of the base 14 fonts, having a
        // FontDescriptor was not required.
        // This case is here for compatibility.
        let baseFontName = dict.get("BaseFont");
        if (!(baseFontName instanceof Name)) {
          throw new FormatError("Base font is not specified");
        }

        // Using base font name as a font name.
        baseFontName = baseFontName.name.replaceAll(/[,_]/g, "-");
        const metrics = this.getBaseFontMetrics(baseFontName);

        // Simulating descriptor flags attribute
        const fontNameWoStyle = baseFontName.split("-")[0];
        const flags =
          (this.isSerifFont(fontNameWoStyle) ? FontFlags.Serif : 0) |
          (metrics.monospace ? FontFlags.FixedPitch : 0) |
          (getSymbolsFonts()[fontNameWoStyle]
            ? FontFlags.Symbolic
            : FontFlags.Nonsymbolic);

        properties = {
          type,
          name: baseFontName,
          loadedName: baseDict.loadedName,
          widths: metrics.widths,
          defaultWidth: metrics.defaultWidth,
          isSimulatedFlags: true,
          flags,
          firstChar,
          lastChar,
          toUnicode,
          xHeight: 0,
          capHeight: 0,
          italicAngle: 0,
          isType3Font,
        };
        const widths = dict.get("Widths") as (number | Ref)[] | undefined;

        const standardFontName = getStandardFontName(baseFontName);
        let file: Stream | undefined;
        if (standardFontName) {
          file = await this.fetchStandardFontData(standardFontName);
          properties.isInternalFont = !!file;
        }
        if (!properties.isInternalFont && this.options.useSystemFonts) {
          properties.systemFontInfo = getFontSubstitution(
            this.systemFontCache!,
            this.idFactory,
            this.options.standardFontDataUrl,
            baseFontName,
            standardFontName,
          );
        }
        return this.extractDataStructures(dict, dict, properties).then(
          (newProperties) => {
            if (widths) {
              const glyphWidths: Record<number, number> = [];
              let j = firstChar;
              for (const width of widths) {
                glyphWidths[j++] = this.xref.fetchIfRef(width) as number;
              }
              newProperties.widths = glyphWidths;
            } else {
              newProperties.widths = this.buildCharCodeToWidth(
                metrics.widths,
                newProperties,
              );
            }
            return new Font(baseFontName as string, file, newProperties);
          },
        );
      }
    }

    // According to the spec if 'FontDescriptor' is declared, 'FirstChar',
    // 'LastChar' and 'Widths' should exist too, but some PDF encoders seem
    // to ignore this rule when a variant of a standard font is used.
    // TODO Fill the width array depending on which of the base font this is
    // a variant.

    let fontName = <Name | string | undefined> descriptor.get("FontName");
    let baseFont = <Name | string | undefined> dict.get("BaseFont");
    // Some bad PDFs have a string as the font name.
    if (typeof fontName === "string") {
      fontName = Name.get(fontName);
    }
    if (typeof baseFont === "string") {
      baseFont = Name.get(baseFont);
    }

    const fontNameStr = fontName?.name;
    const baseFontStr = baseFont?.name;
    if (!isType3Font && fontNameStr !== baseFontStr) {
      info(
        `The FontDescriptor's FontName is "${fontNameStr}" but ` +
          `should be the same as the Font's BaseFont "${baseFontStr}".`,
      );
      // - Workaround for cases where e.g. fontNameStr = 'Arial' and
      //   baseFontStr = 'Arial,Bold' (needed when no font file is embedded).
      //
      // - Workaround for cases where e.g. fontNameStr = 'wg09np' and
      //   baseFontStr = 'Wingdings-Regular' (fixes issue7454.pdf).
      if (
        fontNameStr &&
        baseFontStr &&
        (baseFontStr.startsWith(fontNameStr) ||
          (!isKnownFontName(fontNameStr) && isKnownFontName(baseFontStr)))
      ) {
        fontName = undefined;
      }
    }
    fontName ||= baseFont;

    if (!(fontName instanceof Name)) {
      throw new FormatError("invalid font name");
    }

    let fontFile: Stream | NullStream | undefined,
      subtype: string | undefined,
      length1: number | undefined,
      length2: number | undefined,
      length3: number | undefined;
    try {
      fontFile = descriptor.get(
        "FontFile",
        "FontFile2",
        "FontFile3",
      ) as Stream | undefined;
    } catch (ex) {
      if (!this.options.ignoreErrors) {
        throw ex;
      }
      warn(`translateFont - fetching "${fontName.name}" font file: "${ex}".`);
      fontFile = new NullStream();
    }
    let isInternalFont = false;
    let glyphScaleFactors: number[] | undefined;
    let systemFontInfo: SubstitutionInfo | undefined;
    if (fontFile) {
      if (fontFile.dict) { // Table 127
        const subtypeEntry = fontFile.dict.get("Subtype");
        if (subtypeEntry instanceof Name) {
          subtype = subtypeEntry.name;
        }
        length1 = fontFile.dict.get("Length1") as number | undefined;
        length2 = fontFile.dict.get("Length2") as number | undefined;
        length3 = fontFile.dict.get("Length3") as number | undefined;
      }
    } else if (cssFontInfo) {
      // We've a missing XFA font.
      const standardFontName = getXfaFontName(fontName.name);
      if (standardFontName) {
        cssFontInfo.fontFamily = `${cssFontInfo.fontFamily}-PdfJS-XFA`;
        cssFontInfo.metrics = standardFontName.metrics || undefined;
        glyphScaleFactors = standardFontName.factors || undefined;
        fontFile = await this.fetchStandardFontData(standardFontName.name);
        isInternalFont = !!fontFile;

        // We're using a substitution font but for example widths (if any)
        // are related to the glyph positions in the font.
        // So we overwrite everything here to be sure that widths are
        // correct.
        baseDict = dict = getXfaFontDict(fontName.name);
        composite = true;
      }
    } else if (!isType3Font) {
      const standardFontName = getStandardFontName(fontName.name);
      if (standardFontName) {
        fontFile = await this.fetchStandardFontData(standardFontName);
        isInternalFont = !!fontFile;
      }
      if (!isInternalFont && this.options.useSystemFonts) {
        systemFontInfo = getFontSubstitution(
          this.systemFontCache!,
          this.idFactory,
          this.options.standardFontDataUrl,
          fontName.name,
          standardFontName,
        );
      }
    }

    properties = {
      type,
      name: fontName.name,
      subtype,
      file: fontFile,
      length1,
      length2,
      length3,
      isInternalFont,
      loadedName: baseDict.loadedName,
      composite,
      fixedPitch: false,
      fontMatrix: dict.getArray("FontMatrix") as matrix_t ||
        FONT_IDENTITY_MATRIX,
      firstChar,
      lastChar,
      toUnicode,
      bbox: (descriptor.getArray("FontBBox") || dict.getArray("FontBBox")) as
        | rect_t
        | undefined,
      ascent: descriptor.get("Ascent") as number | undefined,
      descent: descriptor.get("Descent") as number | undefined,
      xHeight: descriptor.get("XHeight") as number || 0,
      capHeight: descriptor.get("CapHeight") as number || 0,
      flags: descriptor.get("Flags") as FontFlags,
      italicAngle: descriptor.get("ItalicAngle") as number || 0,
      isType3Font,
      cssFontInfo,
      scaleFactors: glyphScaleFactors,
      systemFontInfo,
    };

    if (composite) {
      const cidEncoding = <Name | BaseStream> baseDict.get("Encoding");
      if (cidEncoding instanceof Name) {
        properties.cidEncoding = cidEncoding.name;
      }
      const cMap = await CMapFactory.create({
        encoding: cidEncoding,
        fetchBuiltInCMap: this.fetchBuiltInCMap,
        // useCMap: null,
      });
      properties.cMap = cMap;
      properties.vertical = properties.cMap.vertical;
    }

    return this.extractDataStructures(dict, baseDict, properties).then(
      (newProperties) => {
        this.extractWidths(dict, descriptor!, newProperties);

        return new Font(
          (fontName as Name).name,
          fontFile as Stream | undefined,
          newProperties,
        );
      },
    );
  }

  static buildFontPaths(
    font: Font,
    glyphs: Glyph[],
    handler: MessageHandler<Thread.worker>,
    evaluatorOptions: EvaluatorOptions,
  ) {
    function buildPath(fontChar: string) {
      const glyphName = `${font.loadedName}_path_${fontChar}`;
      try {
        if (font.renderer.hasBuiltPath(fontChar)) {
          return;
        }
        handler.send("commonobj", [
          glyphName,
          "FontPath",
          font.renderer.getPathJs(fontChar),
        ]);
      } catch (reason) {
        if (evaluatorOptions.ignoreErrors) {
          warn(`buildFontPaths - ignoring ${glyphName} glyph: "${reason}".`);
          return;
        }
        throw reason;
      }
    }

    for (const glyph of glyphs) {
      buildPath(glyph.fontChar);

      // If the glyph has an accent we need to build a path for its
      // fontChar too, otherwise CanvasGraphics_paintChar will fail.
      const accent = glyph.accent;
      if (accent?.fontChar) {
        buildPath(accent.fontChar);
      }
    }
  }

  static get fallbackFontDict() {
    const dict = new FontDict();
    dict.set("BaseFont", Name.get("Helvetica"));
    dict.set("Type", Name.get("FallbackType"));
    dict.set("Subtype", Name.get("FallbackType"));
    dict.set("Encoding", Name.get("WinAnsiEncoding"));

    return shadow(this, "fallbackFontDict", dict);
  }
}

interface TranslatedFontCtorP_ {
  loadedName: string;
  font: Font | ErrorFont;
  dict: FontDict | undefined;
  evaluatorOptions: EvaluatorOptions | undefined;
}

export class TranslatedFont {
  loadedName: string;
  font;
  dict;
  _evaluatorOptions;
  type3Loaded?: Promise<void>;
  type3Dependencies;
  sent = false;

  _bbox?: rect_t;

  constructor(
    { loadedName, font, dict, evaluatorOptions }: TranslatedFontCtorP_,
  ) {
    this.loadedName = loadedName;
    this.font = font;
    this.dict = dict;
    this._evaluatorOptions = evaluatorOptions || DefaultPartialEvaluatorOptions;
    this.type3Dependencies = font.isType3Font ? new Set<string>() : undefined;
  }

  send(handler: MessageHandler<Thread.worker>) {
    if (this.sent) {
      return;
    }
    this.sent = true;

    handler.send("commonobj", [
      this.loadedName,
      "Font",
      this.font.exportData(this._evaluatorOptions.fontExtraProperties),
    ]);
  }

  fallback(handler: MessageHandler<Thread.worker>) {
    if (!this.font.data) {
      return;
    }
    // When font loading failed, fall back to the built-in font renderer.
    (this.font as Font).disableFontFace = true;
    // An arbitrary number of text rendering operators could have been
    // encountered between the point in time when the 'Font' message was sent
    // to the main-thread, and the point in time when the 'FontFallback'
    // message was received on the worker-thread.
    // To ensure that all 'FontPath's are available on the main-thread, when
    // font loading failed, attempt to resend *all* previously parsed glyphs.
    PartialEvaluator.buildFontPaths(
      this.font as Font,
      /* glyphs = */ (this.font as Font).glyphCacheValues,
      handler,
      this._evaluatorOptions,
    );
  }

  loadType3Data(
    evaluator: PartialEvaluator,
    resources: Dict,
    task: WorkerTask,
  ) {
    if (this.type3Loaded) {
      return this.type3Loaded;
    }
    if (!this.font.isType3Font) {
      throw new Error("Must be a Type3 font.");
    }
    // When parsing Type3 glyphs, always ignore them if there are errors.
    // Compared to the parsing of e.g. an entire page, it doesn't really
    // make sense to only be able to render a Type3 glyph partially.
    const type3Evaluator = evaluator.clone({ ignoreErrors: false });
    type3Evaluator.parsingType3Font = true;
    // Prevent circular references in Type3 fonts.
    const type3FontRefs = new RefSet(evaluator.type3FontRefs);
    if (this.dict!.objId && !type3FontRefs.has(this.dict!.objId)) {
      type3FontRefs.put(this.dict!.objId);
    }
    type3Evaluator.type3FontRefs = type3FontRefs;

    const translatedFont = this.font,
      type3Dependencies = this.type3Dependencies;
    let loadCharProcsPromise = Promise.resolve();
    const charProcs = this.dict!.get("CharProcs") as Dict;
    const fontResources = this.dict!.get("Resources") as Dict || resources;
    const charProcOperatorList = Object.create(null);

    const fontBBox = Util.normalizeRect(translatedFont.bbox || [0, 0, 0, 0]),
      width = fontBBox[2] - fontBBox[0],
      height = fontBBox[3] - fontBBox[1];
    const fontBBoxSize = Math.hypot(width, height);

    for (const key of charProcs.getKeys()) {
      loadCharProcsPromise = loadCharProcsPromise.then(() => {
        const glyphStream = charProcs.get(key) as BaseStream;
        const operatorList = new OperatorList();
        return type3Evaluator
          .getOperatorList({
            stream: glyphStream,
            task,
            resources: fontResources,
            operatorList,
          })
          .then(() => {
            // According to the PDF specification, section "9.6.5 Type 3 Fonts"
            // and "Table 113":
            //  "A glyph description that begins with the d1 operator should
            //   not execute any operators that set the colour (or other
            //   colour-related parameters) in the graphics state;
            //   any use of such operators shall be ignored."
            if (operatorList.fnArray[0] === OPS.setCharWidthAndBounds) {
              this.#removeType3ColorOperators(operatorList, fontBBoxSize);
            }
            charProcOperatorList[key] = operatorList.getIR();

            for (const dependency of operatorList.dependencies) {
              type3Dependencies!.add(dependency);
            }
          })
          .catch((reason: any) => {
            warn(`Type3 font resource "${key}" is not available.`);
            const dummyOperatorList = new OperatorList();
            charProcOperatorList[key] = dummyOperatorList.getIR();
          });
      });
    }
    this.type3Loaded = loadCharProcsPromise.then(() => {
      translatedFont.charProcOperatorList = charProcOperatorList;
      if (this._bbox) {
        (<Font> translatedFont).isCharBBox = true;
        translatedFont.bbox = this._bbox;
      }
    });
    return this.type3Loaded;
  }

  #removeType3ColorOperators(operatorList: OperatorList, fontBBoxSize = NaN) {
    /*#static*/ if (TESTING) {
      assert(
        operatorList.fnArray[0] === OPS.setCharWidthAndBounds,
        "Type3 glyph shall start with the d1 operator.",
      );
    }
    const charBBox = Util.normalizeRect(
        (operatorList.argsArray[0] as any[]).slice(2) as rect_t,
      ),
      width = charBBox[2] - charBBox[0],
      height = charBBox[3] - charBBox[1];
    const charBBoxSize = Math.hypot(width, height);

    if (width === 0 || height === 0) {
      // Skip the d1 operator when its bounds are bogus (fixes issue14953.pdf).
      operatorList.fnArray.splice(0, 1);
      operatorList.argsArray.splice(0, 1);
    } else if (
      fontBBoxSize === 0 ||
      Math.round(charBBoxSize / fontBBoxSize) >= 10
    ) {
      // Override the fontBBox when it's undefined/empty, or when it's at least
      // (approximately) one order of magnitude smaller than the charBBox
      // (fixes issue14999_reduced.pdf).
      if (!this._bbox) {
        this._bbox = [Infinity, Infinity, -Infinity, -Infinity];
      }
      this._bbox[0] = Math.min(this._bbox[0], charBBox[0]);
      this._bbox[1] = Math.min(this._bbox[1], charBBox[1]);
      this._bbox[2] = Math.max(this._bbox[2], charBBox[2]);
      this._bbox[3] = Math.max(this._bbox[3], charBBox[3]);
    }

    let i = 0,
      ii = operatorList.length;
    while (i < ii) {
      switch (operatorList.fnArray[i]) {
        case OPS.setCharWidthAndBounds:
          break; // Handled above.
        case OPS.setStrokeColorSpace:
        case OPS.setFillColorSpace:
        case OPS.setStrokeColor:
        case OPS.setStrokeColorN:
        case OPS.setFillColor:
        case OPS.setFillColorN:
        case OPS.setStrokeGray:
        case OPS.setFillGray:
        case OPS.setStrokeRGBColor:
        case OPS.setFillRGBColor:
        case OPS.setStrokeCMYKColor:
        case OPS.setFillCMYKColor:
        case OPS.shadingFill:
        case OPS.setRenderingIntent:
          operatorList.fnArray.splice(i, 1);
          operatorList.argsArray.splice(i, 1);
          ii--;
          continue;

        case OPS.setGState:
          const [gStateObj] = operatorList.argsArray[i]!;
          let j = 0;
          let jj = gStateObj.length;
          while (j < jj) {
            const [gStateKey] = gStateObj[j];
            switch (gStateKey) {
              case "TR":
              case "TR2":
              case "HT":
              case "BG":
              case "BG2":
              case "UCR":
              case "UCR2":
                gStateObj.splice(j, 1);
                jj--;
                continue;
            }
            j++;
          }
          break;
      }
      i++;
    }
  }
}

class StateManager<S extends EvalState | TextState> {
  state: Partial<S>;
  stateStack: Partial<S>[] = [];

  constructor(initialState: Partial<S>) {
    this.state = initialState;
  }

  save() {
    const old = this.state;
    this.stateStack.push(this.state);
    this.state = <Partial<S>> old.clone!();
  }

  restore() {
    const prev = this.stateStack.pop();
    if (prev) {
      this.state = prev;
    }
  }

  transform(args: matrix_t) {
    this.state.ctm = Util.transform(this.state.ctm!, args);
  }
}

class TextState {
  ctm = IDENTITY_MATRIX;
  fontName: string | undefined;
  fontSize = 0;
  loadedName: string | undefined;
  font?: Font | ErrorFont;
  fontMatrix = FONT_IDENTITY_MATRIX;
  textMatrix = IDENTITY_MATRIX.slice() as matrix_t;
  textLineMatrix = IDENTITY_MATRIX.slice() as matrix_t;
  charSpacing = 0;
  wordSpacing = 0;
  leading = 0;
  textHScale = 1;
  textRise = 0;

  setTextMatrix(
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
  ) {
    const m = this.textMatrix;
    m[0] = a;
    m[1] = b;
    m[2] = c;
    m[3] = d;
    m[4] = e;
    m[5] = f;
  }

  setTextLineMatrix(
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
  ) {
    const m = this.textLineMatrix;
    m[0] = a;
    m[1] = b;
    m[2] = c;
    m[3] = d;
    m[4] = e;
    m[5] = f;
  }

  translateTextMatrix(x: number, y: number) {
    const m = this.textMatrix;
    m[4] = m[0] * x + m[2] * y + m[4];
    m[5] = m[1] * x + m[3] * y + m[5];
  }

  translateTextLineMatrix(x: number, y: number) {
    const m = this.textLineMatrix;
    m[4] = m[0] * x + m[2] * y + m[4];
    m[5] = m[1] * x + m[3] * y + m[5];
  }

  carriageReturn() {
    this.translateTextLineMatrix(0, -this.leading);
    this.textMatrix = <matrix_t> this.textLineMatrix.slice();
  }

  clone(): Partial<TextState> {
    const clone = Object.create(this);
    clone.textMatrix = this.textMatrix.slice();
    clone.textLineMatrix = this.textLineMatrix.slice();
    clone.fontMatrix = this.fontMatrix.slice();
    return clone;
  }
}

export class EvalState {
  ctm = IDENTITY_MATRIX;
  // ctm = new Float32Array(IDENTITY_MATRIX);
  font?: Font | ErrorFont;
  fontSize = 0;
  fontName?: string;
  textRenderingMode = TextRenderingMode.FILL;
  fillColorSpace: ColorSpace = ColorSpace.singletons.gray;
  strokeColorSpace = ColorSpace.singletons.gray;

  clone(): Partial<EvalState> {
    return Object.create(this);
  }
}

interface OpInfo {
  id: OPS;
  numArgs: number;
  variableArgs: boolean;
}
export type OpMap = Record<string, OpInfo | null>;

// export type OpArgs = (ObjNoCmd | Glyph[] | GroupOptions | MarkedContentProps)[] | null;
export type OpArgs = any[] | Uint8ClampedArray | null;
export interface Operation {
  fn: OPS;
  args: OpArgs;
}

export class EvaluatorPreprocessor {
  static get opMap(): OpMap {
    // Specifies properties for each command
    //
    // If variableArgs === true: [0, `numArgs`] expected
    // If variableArgs === false: exactly `numArgs` expected
    return shadow(this, "opMap", {
      // Graphic state
      w: { id: OPS.setLineWidth, numArgs: 1, variableArgs: false },
      J: { id: OPS.setLineCap, numArgs: 1, variableArgs: false },
      j: { id: OPS.setLineJoin, numArgs: 1, variableArgs: false },
      M: { id: OPS.setMiterLimit, numArgs: 1, variableArgs: false },
      d: { id: OPS.setDash, numArgs: 2, variableArgs: false },
      ri: { id: OPS.setRenderingIntent, numArgs: 1, variableArgs: false },
      i: { id: OPS.setFlatness, numArgs: 1, variableArgs: false },
      gs: { id: OPS.setGState, numArgs: 1, variableArgs: false },
      q: { id: OPS.save, numArgs: 0, variableArgs: false },
      Q: { id: OPS.restore, numArgs: 0, variableArgs: false },
      cm: { id: OPS.transform, numArgs: 6, variableArgs: false },

      // Path
      m: { id: OPS.moveTo, numArgs: 2, variableArgs: false },
      l: { id: OPS.lineTo, numArgs: 2, variableArgs: false },
      c: { id: OPS.curveTo, numArgs: 6, variableArgs: false },
      v: { id: OPS.curveTo2, numArgs: 4, variableArgs: false },
      y: { id: OPS.curveTo3, numArgs: 4, variableArgs: false },
      h: { id: OPS.closePath, numArgs: 0, variableArgs: false },
      re: { id: OPS.rectangle, numArgs: 4, variableArgs: false },
      S: { id: OPS.stroke, numArgs: 0, variableArgs: false },
      s: { id: OPS.closeStroke, numArgs: 0, variableArgs: false },
      f: { id: OPS.fill, numArgs: 0, variableArgs: false },
      F: { id: OPS.fill, numArgs: 0, variableArgs: false },
      "f*": { id: OPS.eoFill, numArgs: 0, variableArgs: false },
      B: { id: OPS.fillStroke, numArgs: 0, variableArgs: false },
      "B*": { id: OPS.eoFillStroke, numArgs: 0, variableArgs: false },
      b: { id: OPS.closeFillStroke, numArgs: 0, variableArgs: false },
      "b*": { id: OPS.closeEOFillStroke, numArgs: 0, variableArgs: false },
      n: { id: OPS.endPath, numArgs: 0, variableArgs: false },

      // Clipping
      W: { id: OPS.clip, numArgs: 0, variableArgs: false },
      "W*": { id: OPS.eoClip, numArgs: 0, variableArgs: false },

      // Text
      BT: { id: OPS.beginText, numArgs: 0, variableArgs: false },
      ET: { id: OPS.endText, numArgs: 0, variableArgs: false },
      Tc: { id: OPS.setCharSpacing, numArgs: 1, variableArgs: false },
      Tw: { id: OPS.setWordSpacing, numArgs: 1, variableArgs: false },
      Tz: { id: OPS.setHScale, numArgs: 1, variableArgs: false },
      TL: { id: OPS.setLeading, numArgs: 1, variableArgs: false },
      Tf: { id: OPS.setFont, numArgs: 2, variableArgs: false },
      Tr: { id: OPS.setTextRenderingMode, numArgs: 1, variableArgs: false },
      Ts: { id: OPS.setTextRise, numArgs: 1, variableArgs: false },
      Td: { id: OPS.moveText, numArgs: 2, variableArgs: false },
      TD: { id: OPS.setLeadingMoveText, numArgs: 2, variableArgs: false },
      Tm: { id: OPS.setTextMatrix, numArgs: 6, variableArgs: false },
      "T*": { id: OPS.nextLine, numArgs: 0, variableArgs: false },
      Tj: { id: OPS.showText, numArgs: 1, variableArgs: false },
      TJ: { id: OPS.showSpacedText, numArgs: 1, variableArgs: false },
      "'": { id: OPS.nextLineShowText, numArgs: 1, variableArgs: false },
      '"': {
        id: OPS.nextLineSetSpacingShowText,
        numArgs: 3,
        variableArgs: false,
      },

      // Type3 fonts
      d0: { id: OPS.setCharWidth, numArgs: 2, variableArgs: false },
      d1: {
        id: OPS.setCharWidthAndBounds,
        numArgs: 6,
        variableArgs: false,
      },

      // Color
      CS: { id: OPS.setStrokeColorSpace, numArgs: 1, variableArgs: false },
      cs: { id: OPS.setFillColorSpace, numArgs: 1, variableArgs: false },
      SC: { id: OPS.setStrokeColor, numArgs: 4, variableArgs: true },
      SCN: { id: OPS.setStrokeColorN, numArgs: 33, variableArgs: true },
      sc: { id: OPS.setFillColor, numArgs: 4, variableArgs: true },
      scn: { id: OPS.setFillColorN, numArgs: 33, variableArgs: true },
      G: { id: OPS.setStrokeGray, numArgs: 1, variableArgs: false },
      g: { id: OPS.setFillGray, numArgs: 1, variableArgs: false },
      RG: { id: OPS.setStrokeRGBColor, numArgs: 3, variableArgs: false },
      rg: { id: OPS.setFillRGBColor, numArgs: 3, variableArgs: false },
      K: { id: OPS.setStrokeCMYKColor, numArgs: 4, variableArgs: false },
      k: { id: OPS.setFillCMYKColor, numArgs: 4, variableArgs: false },

      // Shading
      sh: { id: OPS.shadingFill, numArgs: 1, variableArgs: false },

      // Images
      BI: { id: OPS.beginInlineImage, numArgs: 0, variableArgs: false },
      ID: { id: OPS.beginImageData, numArgs: 0, variableArgs: false },
      EI: { id: OPS.endInlineImage, numArgs: 1, variableArgs: false },

      // XObjects
      Do: { id: OPS.paintXObject, numArgs: 1, variableArgs: false },
      MP: { id: OPS.markPoint, numArgs: 1, variableArgs: false },
      DP: { id: OPS.markPointProps, numArgs: 2, variableArgs: false },
      BMC: { id: OPS.beginMarkedContent, numArgs: 1, variableArgs: false },
      BDC: {
        id: OPS.beginMarkedContentProps,
        numArgs: 2,
        variableArgs: false,
      },
      EMC: { id: OPS.endMarkedContent, numArgs: 0, variableArgs: false },

      // Compatibility
      BX: { id: OPS.beginCompat, numArgs: 0, variableArgs: false },
      EX: { id: OPS.endCompat, numArgs: 0, variableArgs: false },

      // (reserved partial commands for the lexer)
      BM: null,
      BD: null,
      true: null,
      fa: null,
      fal: null,
      fals: null,
      false: null,
      nu: null,
      nul: null,
      null: null,
    });
  }

  static readonly MAX_INVALID_PATH_OPS = 10;

  parser: Parser;
  stateManager;

  nonProcessedArgs: any[] = [];
  _isPathOp = false;
  #numInvalidPathOPS = 0;

  constructor(
    stream: BaseStream,
    xref?: XRef,
    stateManager: StateManager<EvalState | TextState> = new StateManager(
      new EvalState(),
    ),
  ) {
    // TODO(mduan): pass array of knownCommands rather than this.opMap dictionary
    this.parser = new Parser({
      lexer: new Lexer(stream, EvaluatorPreprocessor.opMap),
      xref,
    });
    this.stateManager = stateManager;
  }

  get savedStatesDepth() {
    return this.stateManager.stateStack.length;
  }

  // |operation| is an object with two fields:
  //
  // - |fn| is an out param.
  //
  // - |args| is an inout param. On entry, it should have one of two values.
  //
  //   - An empty array. This indicates that the caller is providing the
  //     array in which the args will be stored in. The caller should use
  //     this value if it can reuse a single array for each call to read().
  //
  //   - |null|. This indicates that the caller needs this function to create
  //     the array in which any args are stored in. If there are zero args,
  //     this function will leave |operation.args| as |null| (thus avoiding
  //     allocations that would occur if we used an empty array to represent
  //     zero arguments). Otherwise, it will replace |null| with a new array
  //     containing the arguments. The caller should use this value if it
  //     cannot reuse an array for each call to read().
  //
  // These two modes are present because this function is very hot and so
  // avoiding allocations where possible is worthwhile.
  //
  read(operation: Operation) {
    let args = operation.args;
    while (true) {
      const obj = this.parser.getObj();
      if (obj instanceof Cmd) {
        const cmd = obj.cmd;
        // Check that the command is valid
        const opSpec = EvaluatorPreprocessor.opMap[cmd];
        if (!opSpec) {
          warn(`Unknown command "${cmd}".`);
          continue;
        }

        const fn = opSpec.id;
        const numArgs = opSpec.numArgs;
        let argsLength = args !== null ? args.length : 0;

        // If the *previous* command wasn't a path operator, reset the heuristic
        // used with incomplete path operators below (fixes issue14917.pdf).
        if (!this._isPathOp) {
          this.#numInvalidPathOPS = 0;
        }
        this._isPathOp = fn >= OPS.moveTo && fn <= OPS.endPath;

        if (!opSpec.variableArgs) {
          // Postscript commands can be nested, e.g. /F2 /GS2 gs 5.711 Tf
          if (argsLength !== numArgs) {
            const nonProcessedArgs = this.nonProcessedArgs;
            while (argsLength > numArgs) {
              nonProcessedArgs.push((args as any[]).shift()!);
              argsLength--;
            }
            while (argsLength < numArgs && nonProcessedArgs.length !== 0) {
              if (args === null) {
                args = [];
              }
              (args as any[]).unshift(nonProcessedArgs.pop());
              argsLength++;
            }
          }

          if (argsLength < numArgs) {
            const partialMsg = `command ${cmd}: expected ${numArgs} args, ` +
              `but received ${argsLength} args.`;

            // Incomplete path operators, in particular, can result in fairly
            // chaotic rendering artifacts. Hence the following heuristics is
            // used to error, rather than just warn, once a number of invalid
            // path operators have been encountered (fixes bug1443140.pdf).
            if (
              this._isPathOp &&
              ++this.#numInvalidPathOPS >
                EvaluatorPreprocessor.MAX_INVALID_PATH_OPS
            ) {
              throw new FormatError(`Invalid ${partialMsg}`);
            }
            // If we receive too few arguments, it's not possible to execute
            // the command, hence we skip the command.
            warn(`Skipping ${partialMsg}`);
            if (args !== null) {
              (args as any[]).length = 0;
            }
            continue;
          }
        } else if (argsLength > numArgs) {
          info(
            `Command ${cmd}: expected [0, ${numArgs}] args, but received ${argsLength} args.`,
          );
        }

        // TODO figure out how to type-check vararg functions
        this.preprocessCommand(fn, args);

        operation.fn = fn;
        operation.args = args;
        return true;
      }
      if (obj === EOF) {
        // no more commands
        return false;
      }
      // argument
      if (obj !== null) {
        if (args === null) {
          args = [];
        }
        (args as any[]).push(obj);
        if (args.length > 33) {
          throw new FormatError("Too many arguments");
        }
      }
    }
  }

  preprocessCommand(fn: OPS, args: OpArgs) {
    switch (fn | 0) {
      case OPS.save:
        this.stateManager.save();
        break;
      case OPS.restore:
        this.stateManager.restore();
        break;
      case OPS.transform:
        this.stateManager.transform(<matrix_t> args);
        break;
    }
  }
}
/*80--------------------------------------------------------------------------*/
