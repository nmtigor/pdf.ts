/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2024
 *
 * @module pdf/pdf.ts-test/driver.ts
 * @license Apache-2.0
 ******************************************************************************/

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
/* globals pdfjsLib, pdfjsViewer */

import { filter_tasks } from "./util.ts";
import {
  D_res_pdf,
  D_rp_web,
  D_rpe_cmap,
  D_rpe_sfont,
  D_sp_test,
} from "@fe-src/alias.ts";
import { HttpStatusCode } from "@fe-lib/HttpStatusCode.ts";
import { Locale } from "@fe-lib/Locale.ts";
import type { uint } from "@fe-lib/alias.ts";
import { hexcolr, randomRRGGBB } from "@fe-lib/color/Colr.ts";
import type { Cssc } from "@fe-lib/color/alias.ts";
import type { Coo } from "@fe-lib/cv.ts";
import { HTMLVuu } from "@fe-lib/cv.ts";
import { html, svg as createSVG } from "@fe-lib/dom.ts";
import { PromiseCap } from "@fe-lib/util/PromiseCap.ts";
import type { StatTime } from "@fe-pdf.ts-src/display/display_utils.ts";
import type {
  T_browser,
  T_info,
  T_task_results,
} from "@fe-src/test/pdf.ts/alias.ts";
import wretch from "@wretch";
import type { FieldObjectsPromise } from "../alias.ts";
import type { AnnotationData } from "../pdf.ts-src/core/annotation.ts";
import type {
  AnnotationLayerP,
} from "../pdf.ts-src/display/annotation_layer.ts";
import type {
  AnnotationStorage,
  DocumentInitP,
  OptionalContentConfig,
  PageViewport,
  PDFDocumentProxy,
  PDFPageProxy,
  RenderP,
  TextContent,
  TextItem,
  XFAElObj,
} from "../pdf.ts-src/pdf.ts";
import {
  AnnotationLayer,
  AnnotationMode,
  DrawLayer,
  getDocument,
  GlobalWorkerOptions,
  Outliner,
  PixelsPerInch,
  shadow,
  TextLayer,
  XfaLayer,
} from "../pdf.ts-src/pdf.ts";
import { GenericL10n } from "../pdf.ts-web/genericl10n.ts";
import type { IPDFLinkService } from "../pdf.ts-web/interfaces.ts";
import { SimpleLinkService } from "../pdf.ts-web/pdf_link_service.ts";
import { parseQueryString } from "../pdf.ts-web/ui_utils.ts";
import type { TestFilter, TestTask } from "./alias.ts";
/*80--------------------------------------------------------------------------*/

const WAITING_TIME = 100; // ms
// const CMAP_URL = "/build/generic/web/cmaps/";
const CMAP_URL = `/${D_rpe_cmap}/`;
// const STANDARD_FONT_DATA_URL = "/build/generic/web/standard_fonts/";
const STANDARD_FONT_DATA_URL = `/${D_rpe_sfont}/`;
// const IMAGE_RESOURCES_PATH = "/web/images/";
const IMAGE_RESOURCES_PATH = `/${D_rp_web}/images/`;
// const VIEWER_CSS = "../build/components/pdf_viewer.css";
const VIEWER_CSS = `/${D_rp_web}/pdf_viewer.css`;
const VIEWER_LOCALE = Locale.en_US;
// const WORKER_SRC = "../build/generic/build/pdf.worker.mjs";
const WORKER_SRC = "/gen/pdf/pdf.ts-src/pdf.worker.js";
const RENDER_TASK_ON_CONTINUE_DELAY = 5; // ms

const md5FileMap = new Map<string, string>();

function loadStyles(styles: string[]) {
  const promises = [];

  for (const file of styles) {
    promises.push(
      fetch(file)
        .then((response) => {
          if (!response.ok) {
            throw new Error(response.statusText);
          }
          return response.text();
        })
        .catch((reason) => {
          throw new Error(`Error fetching style (${file}): ${reason}`);
        }),
    );
  }

  return Promise.all(promises);
}

function loadImage(svg_xml: string, ctx: CanvasRenderingContext2D | undefined) {
  return new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.src = "data:image/svg+xml;base64," + btoa(svg_xml);
    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      resolve();
    };
    img.onerror = (e) => {
      reject(new Error(`Error rasterizing SVG: ${e}`));
    };
  });
}

async function writeSVG(svgElement: SVGElement, ctx: CanvasRenderingContext2D) {
  // We need to have UTF-8 encoded XML.
  const svg_xml = unescape(
    encodeURIComponent(new XMLSerializer().serializeToString(svgElement)),
  );
  if (svg_xml.includes("background-image: url(&quot;data:image")) {
    // Workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=1844414
    // we load the image two times.
    await loadImage(svg_xml, undefined);
    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });
  }
  return loadImage(svg_xml, ctx);
}

async function inlineImages(node: HTMLDivElement, silentErrors = false) {
  const promises = [];

  for (const image of node.getElementsByTagName("img")) {
    const url = image.src;

    promises.push(
      fetch(url)
        .then((response) => {
          if (!response.ok) {
            throw new Error(response.statusText);
          }
          return response.blob();
        })
        // eslint-disable-next-line arrow-body-style
        .then((blob) => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve(reader.result as string);
            };
            reader.onerror = reject;

            reader.readAsDataURL(blob);
          });
        })
        // eslint-disable-next-line arrow-body-style
        .then((dataUrl) => {
          return new Promise<Event | void>((resolve, reject) => {
            image.onload = resolve;
            image.onerror = (evt) => {
              if (silentErrors) {
                resolve();
                return;
              }
              reject(evt);
            };

            image.src = dataUrl;
          });
        })
        .catch((reason) => {
          throw new Error(`Error inlining image (${url}): ${reason}`);
        }),
    );
  }

  await Promise.all(promises);
}

async function convertCanvasesToImages(
  annotationCanvasMap: Map<string, HTMLCanvasElement>,
  outputScale: number,
) {
  const results = new Map<string, HTMLImageElement>();
  const promises = [];
  for (const [key, canvas] of annotationCanvasMap) {
    promises.push(
      new Promise<void>((resolve) => {
        canvas.toBlob((blob) => {
          const image = html("img");
          image.classList.add("wasCanvas");
          image.onload = () => {
            image.style.width = Math.floor(image.width / outputScale) + "px";
            resolve();
          };
          results.set(key, image);
          image.src = URL.createObjectURL(blob!);
        });
      }),
    );
  }
  await Promise.all(promises);
  return results;
}

class Rasterize {
  /**
   * For the reference tests, the full content of the various layers must be
   * visible. To achieve this, we load the common styles as used by the viewer
   * and extend them with a set of overrides to make all elements visible.
   *
   * Note that we cannot simply use `@import` to import the common styles in
   * the overrides file because the browser does not resolve that when the
   * styles are inserted via XHR. Therefore, we load and combine them here.
   */
  static get annotationStylePromise() {
    const styles = [VIEWER_CSS, "./annotation_layer_builder_overrides.css"];
    return shadow(this, "annotationStylePromise", loadStyles(styles));
  }

  static get textStylePromise() {
    const styles = [VIEWER_CSS, "./text_layer_test.css"];
    return shadow(this, "textStylePromise", loadStyles(styles));
  }

  static get drawLayerStylePromise() {
    const styles = [VIEWER_CSS, "./draw_layer_test.css"];
    return shadow(this, "drawLayerStylePromise", loadStyles(styles));
  }

  static get xfaStylePromise() {
    const styles = [VIEWER_CSS, "./xfa_layer_builder_overrides.css"];
    return shadow(this, "xfaStylePromise", loadStyles(styles));
  }

  static createContainer(viewport: PageViewport) {
    const svg = createSVG("svg");
    svg.setAttribute("width", `${viewport.width}px`);
    svg.setAttribute("height", `${viewport.height}px`);

    const foreignObject = createSVG("foreignObject");
    foreignObject.setAttribute("x", "0");
    foreignObject.setAttribute("y", "0");
    foreignObject.setAttribute("width", `${viewport.width}px`);
    foreignObject.setAttribute("height", `${viewport.height}px`);

    const style = html("style");
    foreignObject.append(style);

    const div = html("div");
    foreignObject.append(div);

    return { svg, foreignObject, style, div };
  }

  static async annotationLayer(
    ctx: CanvasRenderingContext2D,
    viewport: PageViewport,
    outputScale: number,
    annotations: AnnotationData[],
    annotationCanvasMap: Map<string, HTMLCanvasElement>,
    annotationStorage: AnnotationStorage,
    fieldObjects: Awaited<FieldObjectsPromise>,
    page: PDFPageProxy,
    imageResourcesPath: string,
    renderForms = false,
  ) {
    try {
      const { svg, foreignObject, style, div } = this.createContainer(viewport);
      div.className = "annotationLayer";

      const [common, overrides] = await this.annotationStylePromise;
      style.textContent = `${common}\n${overrides}\n` +
        `:root { --scale-factor: ${viewport.scale} }`;

      const annotationViewport = viewport.clone({ dontFlip: true });
      const annotationImageMap = await convertCanvasesToImages(
        annotationCanvasMap,
        outputScale,
      );

      // Rendering annotation layer as HTML.
      const parameters = {
        annotations,
        linkService: new SimpleLinkService() as IPDFLinkService,
        imageResourcesPath,
        renderForms,
        annotationStorage,
        fieldObjects,
      } as AnnotationLayerP;

      // Ensure that the annotationLayer gets translated.
      document.l10n.connectRoot(div);

      const annotationLayer = new AnnotationLayer({
        div,
        annotationCanvasMap: annotationImageMap as any,
        page,
        viewport: annotationViewport,
      } as AnnotationLayerP);
      await annotationLayer.render(parameters);
      await annotationLayer.showPopups();

      // With Fluent, the translations are triggered by the MutationObserver
      // hence the translations could be not finished when we rasterize the div.
      // So in order to be sure that all translations are done, we wait for
      // them here.
      await document.l10n.translateRoots();

      // All translation should be complete here.
      document.l10n.disconnectRoot(div);

      // Inline SVG images from text annotations.
      await inlineImages(div);
      foreignObject.append(div);
      svg.append(foreignObject);

      await writeSVG(svg, ctx);
    } catch (reason) {
      throw new Error(
        `Rasterize.annotationLayer: "${(reason as any)?.message}".`,
      );
    }
  }

  static async textLayer(
    ctx: CanvasRenderingContext2D,
    viewport: PageViewport,
    textContent: TextContent,
  ) {
    try {
      const { svg, foreignObject, style, div } = this.createContainer(viewport);
      div.className = "textLayer";

      // Items are transformed to have 1px font size.
      svg.setAttribute("font-size", 1 as any);

      const [common, overrides] = await this.textStylePromise;
      style.textContent = `${common}\n${overrides}\n` +
        `:root { --scale-factor: ${viewport.scale} }`;

      // Rendering text layer as HTML.
      const textLayer = new TextLayer({
        textContentSource: textContent,
        container: div,
        viewport,
      });

      await textLayer.render();

      svg.append(foreignObject);

      await writeSVG(svg, ctx);
    } catch (reason) {
      throw new Error(`Rasterize.textLayer: "${(reason as any)?.message}".`);
    }
  }

  static async highlightLayer(
    ctx: CanvasRenderingContext2D,
    viewport: PageViewport,
    textContent: TextContent,
  ) {
    try {
      const { svg, foreignObject, style, div } = this.createContainer(viewport);
      const dummyParent = html("div");

      // Items are transformed to have 1px font size.
      svg.setAttribute("font-size", 1 as any);

      const [common, overrides] = await this.drawLayerStylePromise;
      style.textContent = `${common}\n${overrides}` +
        `:root { --scale-factor: ${viewport.scale} }`;

      // Rendering text layer as HTML.
      const textLayer = new TextLayer({
        textContentSource: textContent,
        container: dummyParent,
        viewport,
      });
      await textLayer.render();

      const { pageWidth, pageHeight, textDivs } = textLayer;
      const boxes = [];
      let j = 0,
        posRegex;
      for (
        const { width, height, type } of textContent
          .items as (TextItem & { type: unknown })[]
      ) {
        if (type) {
          continue;
        }
        const { top, left } = textDivs[j++].style;
        let x = parseFloat(left) / 100;
        let y = parseFloat(top) / 100;
        if (isNaN(x)) {
          posRegex ||= /^calc\(var\(--scale-factor\)\*(.*)px\)$/;
          // The element is tagged so we've to extract the position from the
          // string, e.g. `calc(var(--scale-factor)*66.32px)`.
          let match = left.match(posRegex);
          if (match) {
            x = parseFloat(match[1]) / pageWidth;
          }

          match = top.match(posRegex);
          if (match) {
            y = parseFloat(match[1]) / pageHeight;
          }
        }
        if (width === 0 || height === 0) {
          continue;
        }
        boxes.push({
          x,
          y,
          width: width / pageWidth,
          height: height / pageHeight,
        });
      }
      // We set the borderWidth to 0.001 to slighly increase the size of the
      // boxes so that they can be merged together.
      const outliner = new Outliner(boxes, /* borderWidth = */ 0.001);
      // We set the borderWidth to 0.0025 in order to have an outline which is
      // slightly bigger than the highlight itself.
      // We must add an inner margin to avoid to have a partial outline.
      const outlinerForOutline = new Outliner(
        boxes,
        /* borderWidth = */ 0.0025,
        /* innerMargin = */ 0.001,
      );
      const drawLayer = new DrawLayer({ pageIndex: 0 });
      drawLayer.setParent(div);
      drawLayer.highlight(outliner.getOutlines(), "orange", 0.4);
      drawLayer.highlightOutline(outlinerForOutline.getOutlines());

      svg.append(foreignObject);

      await writeSVG(svg, ctx);

      drawLayer.destroy();
    } catch (reason) {
      throw new Error(
        `Rasterize.highlightLayer: "${(reason as any)?.message}".`,
      );
    }
  }

  static async xfaLayer(
    ctx: CanvasRenderingContext2D,
    viewport: PageViewport,
    xfaHtml: XFAElObj,
    fontRules: string | undefined,
    annotationStorage: AnnotationStorage,
    isPrint: boolean | undefined,
  ) {
    try {
      const { svg, foreignObject, style, div } = this.createContainer(viewport);

      const [common, overrides] = await this.xfaStylePromise;
      style.textContent = `${common}\n${overrides}\n${fontRules}`;

      // Rendering XFA layer as HTML.
      XfaLayer.render({
        viewport: viewport.clone({ dontFlip: true }),
        div,
        xfaHtml,
        annotationStorage,
        linkService: new SimpleLinkService(),
        intent: isPrint ? "print" : "display",
      });

      // Some unsupported type of images (e.g. tiff) lead to errors.
      await inlineImages(div, /* silentErrors = */ true);
      svg.append(foreignObject);

      await writeSVG(svg, ctx);
    } catch (reason) {
      throw new Error(`Rasterize.xfaLayer: "${(reason as any)?.message}".`);
    }
  }
}

class Snapshot_ extends HTMLVuu<Coo, HTMLDivElement> {
  static #bg: Cssc = "#fff";
  static nextTaskBg() {
    this.#bg = hexcolr(randomRRGGBB()).setTone(95).cssc;
  }

  constructor(tr_x: Omit<T_task_results, "snapshot">, snapshot: string) {
    super(undefined as any, html("div"));

    this.assignStylo({
      display: "grid",
      gridTemplateRows: "1fr 100px",
      gridTemplateColumns: "200px",
      placeItems: "stretch",

      width: "200px",
      height: "200px",
    });

    const info_el = html("textarea").assignAttro({
      readOnly: true,
      spellcheck: false,
    }).assignStylo({
      gridRow: "1 / span 1",
      gridColumn: "1 / span 1",
      overflow: "scroll",

      backgroundColor: Snapshot_.#bg,

      whiteSpace: "pre",

      resize: "none",
    });
    info_el.textContent = JSON.stringify(tr_x, undefined, "  ");

    const snapshop_el = html("object").assignAttro({
      type: "image/png",
      data: snapshot,
    }).assignStylo({
      objectFit: "contain",
      gridRow: "2 / span 1",
      gridColumn: "1 / span 1",
    });

    this.el$.append(info_el, snapshop_el);
  }
}

type DriverOptions_ = {
  /**
   * Field displaying the number of inflight requests.
   */
  inflight: HTMLSpanElement;

  /**
   * Checkbox to disable automatic scrolling of the output container.
   */
  disableScrolling: HTMLInputElement;

  /**
   * Container for all output messages.
   */
  output: HTMLPreElement;

  /**
   * Container for all snapshots.
   */
  snapshot: HTMLPreElement;

  /**
   * Container for a completion message.
   */
  end: HTMLDivElement;
};

interface TaskData_ extends TestTask {
  /** 0-based */
  round: uint;
  /** 1-based */
  pageNum: uint;
  stats: { times: StatTime[] };
  fontRules?: string;
  pdfDoc?: PDFDocumentProxy;
  optionalContentConfigPromise?: Promise<OptionalContentConfig>;
  fieldObjects?: Awaited<FieldObjectsPromise>;
  viewportWidth?: uint;
  viewportHeight?: uint;
  renderPrint?: boolean;
}

export class Driver {
  _l10n;

  inflight;
  disableScrolling;
  output;
  snapshot;
  end;

  browser;
  manifestFile;
  filterFile;
  delay;
  inFlightRequests;
  testFilter!: TestFilter;

  canvas;
  textLayerCanvas?: HTMLCanvasElement;
  annotationLayerCanvas?: HTMLCanvasElement;

  manifest!: TaskData_[];
  currentTask!: uint;

  constructor(options: DriverOptions_) {
    // Configure the global worker options.
    GlobalWorkerOptions.workerSrc = WORKER_SRC;

    // We only need to initialize the `L10n`-instance here, since translation is
    // triggered by a `MutationObserver`; see e.g. `Rasterize.annotationLayer`.
    this._l10n = new GenericL10n(VIEWER_LOCALE);

    // Set the passed options
    this.inflight = options.inflight;
    this.disableScrolling = options.disableScrolling;
    this.output = options.output;
    this.snapshot = options.snapshot;
    this.end = options.end;

    // Set parameters from the query string
    const params = parseQueryString(window.location.search.substring(1));
    this.browser = params.get("browser") as T_browser ?? "chrome";
    // this.manifestFile = params.get("manifestfile");
    this.manifestFile = `/${D_sp_test}/test_manifest.json`;
    this.filterFile = `/${D_sp_test}/test_filter.json`;
    this.delay = params.get("delay") as any | 0;
    this.inFlightRequests = 0;
    // this.testFilter = JSON.parse(params.get("testfilter") || "[]");
    // this.xfaOnly = params.get("xfaonly") === "true";

    // Create a working canvas
    this.canvas = html("canvas");
  }

  run() {
    window.onerror = (message, source, line, column, error) => {
      this._info(
        `Error: ${message} Script: ${source} Line: ${line} Column: ${column} StackTrace: ${error}`,
      );
    };
    this._info(`User agent: ${navigator.userAgent}`);
    this._log(`Harness thinks this browser is ${this.browser}\n`);

    if (this.delay > 0) {
      this._log(`\nDelaying for ${this.delay} ms...\n`);
    }
    // When gathering the stats the numbers seem to be more reliable
    // if the browser is given more time to start.
    setTimeout(async () => {
      this._log(`Fetching manifest "${this.manifestFile}"... `);
      let response = await fetch(this.manifestFile);
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      this._log("done\n");
      this.manifest = await response.json();

      if (this.filterFile) {
        this._log(`Fetching filter "${this.filterFile}"... `);
        response = await fetch(this.filterFile);
        if (!response.ok) {
          throw new Error(response.statusText);
        }
        this._log("done\n");
        this.testFilter = await response.json();
      } else {
        this.testFilter = { only: [], skip: [], limit: 0 };
      }

      this.manifest = filter_tasks(this.manifest, this.testFilter);

      this._send("/setup");

      this.currentTask = 0;
      this._nextTask();
    }, this.delay);
  }

  /**
   * A debugging tool to log to the terminal while tests are running.
   * XXX: This isn't currently referenced, but it's useful for debugging so
   * do not remove it.
   *
   * @param msg The message to log, it will be prepended with the
   *    current PDF ID if there is one.
   */
  log(msg: string) {
    let id = this.browser;
    const task = this.manifest[this.currentTask];
    if (task) {
      id += `-${task.id}`;
    }

    this._info(`${id}: ${msg}`);
  }

  _nextTask() {
    let failure = "";

    this._cleanup().then(() => {
      if (this.currentTask === this.manifest.length) {
        this._done();
        return;
      }
      Snapshot_.nextTaskBg();
      const task = this.manifest[this.currentTask];
      task.round = 0;
      task.pageNum = task.firstPage || 1;
      task.stats = { times: [] };
      task.enableXfa = task.enableXfa === true;

      const prevFile = md5FileMap.get(task.md5);
      if (prevFile) {
        if (task.file !== prevFile) {
          this._nextPage(
            task,
            `The "${task.file}" file is identical to the previously used "${prevFile}" file.`,
          );
          return;
        }
      } else {
        md5FileMap.set(task.md5, task.file);
      }

      // Support *linked* test-cases for the other suites, e.g. unit- and
      // integration-tests, without needing to run them as reference-tests.
      if (task.type === "other") {
        this._log(`Skipping file "${task.file}"\n`);

        if (!task.link) {
          this._nextPage(task, 'Expected "other" test-case to be linked.');
          return;
        }
        this.currentTask++;
        this._nextTask();
        return;
      }

      this._log(`Loading file "${task.file}"\n`);

      try {
        let xfaStyleElement: HTMLStyleElement | undefined;
        if (task.enableXfa) {
          // Need to get the font definitions to inject them in the SVG.
          // So we create this element and those definitions will be
          // appended in font_loader.js.
          xfaStyleElement = html("style");
          document.documentElement
            .getElementsByTagName("head")[0]
            .append(xfaStyleElement);
        }
        const isOffscreenCanvasSupported =
          task.isOffscreenCanvasSupported === false ? false : undefined;

        const loadingTask = getDocument({
          url: new URL(
            `/${D_res_pdf}/test/${task.file}`,
            window.location as any,
          ),
          password: task.password,
          cMapUrl: CMAP_URL,
          standardFontDataUrl: STANDARD_FONT_DATA_URL,
          disableAutoFetch: !task.enableAutoFetch,
          pdfBug: true,
          useSystemFonts: task.useSystemFonts,
          useWorkerFetch: task.useWorkerFetch,
          enableXfa: task.enableXfa,
          isOffscreenCanvasSupported,
          styleElement: xfaStyleElement,
        } as DocumentInitP);
        let promise = loadingTask.promise;

        if (task.annotationStorage) {
          for (const annotation of Object.values(task.annotationStorage)) {
            const { bitmapName } = annotation;
            if (bitmapName) {
              promise = promise.then(async (doc) => {
                const response = await fetch(
                  new URL(`./images/${bitmapName}`, window.location as any),
                );
                const blob = await response.blob();
                if (bitmapName.endsWith(".svg")) {
                  const image = new Image();
                  const url = URL.createObjectURL(blob);
                  const imagePromise = new Promise<void>((resolve, reject) => {
                    image.onload = () => {
                      const canvas = new OffscreenCanvas(
                        image.width,
                        image.height,
                      );
                      const ctx = canvas.getContext("2d")!;
                      ctx.drawImage(image, 0, 0);
                      annotation.bitmap = canvas.transferToImageBitmap();
                      URL.revokeObjectURL(url);
                      resolve();
                    };
                    image.onerror = reject;
                  });
                  image.src = url;
                  await imagePromise;
                } else {
                  annotation.bitmap = await createImageBitmap(blob);
                }

                return doc;
              });
            }
          }
        }

        if (task.save) {
          promise = promise.then(async (doc) => {
            if (!task.annotationStorage) {
              throw new Error("Missing `annotationStorage` entry.");
            }
            if (task.loadAnnotations) {
              for (let num = 1; num <= doc.numPages; num++) {
                const page = await doc.getPage(num);
                await page.getAnnotations({ intent: "display" });
              }
            }
            doc.annotationStorage.setAll(task.annotationStorage);

            const data = await doc.saveDocument();
            await loadingTask.destroy();
            delete task.annotationStorage;

            return getDocument(data).promise;
          });
        }

        promise.then(
          async (doc) => {
            if (task.enableXfa) {
              task.fontRules = "";
              for (const rule of xfaStyleElement!.sheet!.cssRules) {
                task.fontRules += rule.cssText + "\n";
              }
            }

            task.pdfDoc = doc;
            task.optionalContentConfigPromise = doc.getOptionalContentConfig({
              intent: task.print ? "print" : "display",
            });

            if (task.optionalContent) {
              const entries = Object.entries(task.optionalContent),
                optionalContentConfig = await task.optionalContentConfigPromise;
              for (const [id, visible] of entries) {
                optionalContentConfig.setVisibility(id, visible);
              }
            }

            if (task.forms) {
              task.fieldObjects = await doc.getFieldObjects();
            }

            this._nextPage(task, failure);
          },
          (err) => {
            failure = "Loading PDF document: " + err;
            this._nextPage(task, failure);
          },
        );
        return;
      } catch (e) {
        failure = "Loading PDF document: " + this._exceptionToString(e);
      }
      this._nextPage(task, failure);
    });
  }

  _cleanup() {
    // Clear out all the stylesheets since a new one is created for each font.
    while (document.styleSheets.length > 0) {
      const styleSheet = document.styleSheets[0];
      while (styleSheet.cssRules.length > 0) {
        styleSheet.deleteRule(0);
      }
      styleSheet.ownerNode!.remove();
    }
    const body = document.body;
    while (body.lastChild !== this.end) {
      body.lastChild!.remove();
    }

    const destroyedPromises = [];
    // Wipe out the link to the pdfdoc so it can be GC'ed.
    for (let i = 0; i < this.manifest.length; i++) {
      if (this.manifest[i].pdfDoc) {
        destroyedPromises.push(this.manifest[i].pdfDoc!.destroy());
        delete this.manifest[i].pdfDoc;
      }
    }
    return Promise.all(destroyedPromises);
  }

  _exceptionToString(e: unknown) {
    if (typeof e !== "object") {
      return String(e);
    }
    if (!("message" in e!)) {
      return JSON.stringify(e);
    }
    return e.message +
      ("stack" in e ? " at " + (e.stack as string).split("\n", 1)[0] : "");
  }

  _getLastPageNumber(task: TaskData_): uint {
    if (!task.pdfDoc) {
      return task.firstPage || 1;
    }
    return task.lastPage || task.pdfDoc.numPages;
  }

  _nextPage(task: TaskData_, loadError?: string) {
    let failure = loadError || "";
    let ctx: CanvasRenderingContext2D;

    if (!task.pdfDoc) {
      const dataUrl = this.canvas.toDataURL("image/png");
      this._sendResult(dataUrl, task, failure).then(() => {
        this._log(`done${failure ? ` (failed !: ${failure})` : ""}\n`);
        this.currentTask++;
        this._nextTask();
      });
      return;
    }

    if (task.pageNum > this._getLastPageNumber(task)) {
      if (++task.round < task.rounds) {
        this._log(` Round ${1 + task.round}\n`);
        task.pageNum = task.firstPage || 1;
      } else {
        this.currentTask++;
        this._nextTask();
        return;
      }
    }

    if (task.skipPages && task.skipPages.includes(task.pageNum)) {
      this._log(` Skipping page ${task.pageNum}/${task.pdfDoc.numPages}...\n`);
      task.pageNum++;
      this._nextPage(task);
      return;
    }

    if (!failure) {
      try {
        this._log(` Loading page ${task.pageNum}/${task.pdfDoc.numPages}... `);
        ctx = this.canvas.getContext("2d", { alpha: false })!;
        task.pdfDoc.getPage(task.pageNum).then(
          (page) => {
            // Default to creating the test images at the devices pixel ratio,
            // unless the test explicitly specifies an output scale.
            const outputScale = task.outputScale || window.devicePixelRatio;
            let viewport = page.getViewport({
              scale: PixelsPerInch.PDF_TO_CSS_UNITS,
            });
            if (task.rotation) {
              viewport = viewport.clone({ rotation: task.rotation });
            }
            // Restrict the test from creating a canvas that is too big.
            const MAX_CANVAS_PIXEL_DIMENSION = 4096;
            const largestDimension = Math.max(viewport.width, viewport.height);
            if (
              Math.floor(largestDimension * outputScale) >
                MAX_CANVAS_PIXEL_DIMENSION
            ) {
              const rescale = MAX_CANVAS_PIXEL_DIMENSION / largestDimension;
              viewport = viewport.clone({
                scale: PixelsPerInch.PDF_TO_CSS_UNITS * rescale,
              });
            }
            const pixelWidth = Math.floor(viewport.width * outputScale);
            const pixelHeight = Math.floor(viewport.height * outputScale);
            task.viewportWidth = Math.floor(viewport.width);
            task.viewportHeight = Math.floor(viewport.height);
            task.outputScale = outputScale;
            this.canvas.width = pixelWidth;
            this.canvas.height = pixelHeight;
            this.canvas.style.width = Math.floor(viewport.width) + "px";
            this.canvas.style.height = Math.floor(viewport.height) + "px";
            this._clearCanvas();

            const transform = outputScale !== 1
              ? [outputScale, 0, 0, outputScale, 0, 0]
              : undefined;

            // Initialize various `eq` test subtypes, see comment below.
            let renderAnnotations = false,
              renderForms = false,
              renderPrint = false,
              renderXfa = false,
              annotationCanvasMap: Map<string, HTMLCanvasElement> | undefined,
              pageColors:
                | { background: string; foreground: string }
                | undefined;

            if (task.annotationStorage) {
              task.pdfDoc!.annotationStorage.setAll(task.annotationStorage);
            }

            let textLayerCanvas: HTMLCanvasElement | undefined,
              annotationLayerCanvas: HTMLCanvasElement | undefined,
              annotationLayerContext: CanvasRenderingContext2D;
            let initPromise;
            if (task.type === "text" || task.type === "highlight") {
              // Using a dummy canvas for PDF context drawing operations
              textLayerCanvas = this.textLayerCanvas;
              if (!textLayerCanvas) {
                textLayerCanvas = html("canvas");
                this.textLayerCanvas = textLayerCanvas;
              }
              textLayerCanvas.width = pixelWidth;
              textLayerCanvas.height = pixelHeight;
              const textLayerContext = textLayerCanvas.getContext("2d")!;
              textLayerContext.clearRect(
                0,
                0,
                textLayerCanvas.width,
                textLayerCanvas.height,
              );
              textLayerContext.scale(outputScale, outputScale);
              // The text builder will draw its content on the test canvas
              initPromise = page
                .getTextContent({
                  includeMarkedContent: true,
                  disableNormalization: true,
                })
                .then((textContent) => {
                  return task.type === "text"
                    ? Rasterize.textLayer(
                      textLayerContext,
                      viewport,
                      textContent,
                    )
                    : Rasterize.highlightLayer(
                      textLayerContext,
                      viewport,
                      textContent,
                    );
                });
            } else {
              textLayerCanvas = undefined;
              // We fetch the `eq` specific test subtypes here, to avoid
              // accidentally changing the behaviour for other types of tests.
              renderAnnotations = !!task.annotations;
              renderForms = !!task.forms;
              renderPrint = !!task.print;
              renderXfa = !!task.enableXfa;
              pageColors = task.pageColors;

              // Render the annotation layer if necessary.
              if (renderAnnotations || renderForms || renderXfa) {
                // Create a dummy canvas for the drawing operations.
                annotationLayerCanvas = this.annotationLayerCanvas;
                if (!annotationLayerCanvas) {
                  annotationLayerCanvas = html("canvas");
                  this.annotationLayerCanvas = annotationLayerCanvas;
                }
                annotationLayerCanvas.width = pixelWidth;
                annotationLayerCanvas.height = pixelHeight;
                annotationLayerContext = annotationLayerCanvas.getContext(
                  "2d",
                )!;
                annotationLayerContext.clearRect(
                  0,
                  0,
                  annotationLayerCanvas.width,
                  annotationLayerCanvas.height,
                );
                annotationLayerContext.scale(outputScale, outputScale);

                if (!renderXfa) {
                  // The annotation builder will draw its content
                  // on the canvas.
                  initPromise = page.getAnnotations({ intent: "display" });
                  annotationCanvasMap = new Map<string, HTMLCanvasElement>();
                } else {
                  initPromise = page.getXfa().then((xfaHtml) => {
                    return Rasterize.xfaLayer(
                      annotationLayerContext,
                      viewport,
                      xfaHtml as XFAElObj,
                      task.fontRules,
                      task.pdfDoc!.annotationStorage,
                      task.renderPrint,
                    );
                  });
                }
              } else {
                annotationLayerCanvas = undefined;
                initPromise = Promise.resolve();
              }
            }
            const renderContext = {
              canvasContext: ctx,
              viewport,
              optionalContentConfigPromise: task.optionalContentConfigPromise,
              annotationCanvasMap,
              pageColors,
              transform,
            } as RenderP;
            if (renderForms) {
              renderContext.annotationMode = AnnotationMode.ENABLE_FORMS;
            } else if (renderPrint) {
              if (task.annotationStorage) {
                renderContext.annotationMode = AnnotationMode.ENABLE_STORAGE;
              }
              renderContext.intent = "print";
            }

            const completeRender = (error: string | false) => {
              // if text layer is present, compose it on top of the page
              if (textLayerCanvas) {
                if (task.type === "text") {
                  ctx.save();
                  ctx.globalCompositeOperation = "screen";
                  ctx.fillStyle = "rgb(128, 255, 128)"; // making it green
                  ctx.fillRect(0, 0, pixelWidth, pixelHeight);
                  ctx.restore();
                  ctx.drawImage(textLayerCanvas, 0, 0);
                } else if (task.type === "highlight") {
                  ctx.save();
                  ctx.globalCompositeOperation = "multiply";
                  ctx.drawImage(textLayerCanvas, 0, 0);
                  ctx.restore();
                }
              }
              // If we have annotation layer, compose it on top of the page.
              if (annotationLayerCanvas) {
                ctx.drawImage(annotationLayerCanvas, 0, 0);
              }
              if (page.stats) {
                // Get the page stats *before* running cleanup.
                task.stats = page.stats;
              }
              page.cleanup(/* resetStats = */ true);
              this._snapshot(task, error);
            };
            initPromise
              .then((data) => {
                const renderTask = page.render(renderContext);

                if (task.renderTaskOnContinue) {
                  renderTask.onContinue = (cont) => {
                    // Slightly delay the continued rendering.
                    setTimeout(cont, RENDER_TASK_ON_CONTINUE_DELAY);
                  };
                }
                return renderTask.promise.then(() => {
                  if (annotationCanvasMap) {
                    Rasterize.annotationLayer(
                      annotationLayerContext,
                      viewport,
                      outputScale,
                      data as AnnotationData[],
                      annotationCanvasMap,
                      task.pdfDoc!.annotationStorage,
                      task.fieldObjects,
                      page,
                      IMAGE_RESOURCES_PATH,
                      renderForms,
                    ).then(() => {
                      completeRender(false);
                    });
                  } else {
                    completeRender(false);
                  }
                });
              })
              .catch((error) => {
                completeRender("render : " + error);
              });
          },
          (error) => {
            this._snapshot(task, "render : " + error);
          },
        );
      } catch (e) {
        failure = "page setup : " + this._exceptionToString(e);
        this._snapshot(task, failure);
      }
    }
  }

  _clearCanvas() {
    const ctx = this.canvas.getContext("2d", { alpha: false })!;
    ctx.beginPath();
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  _snapshot(task: TaskData_, failure: string | false) {
    this._log("Snapshotting... ");

    const dataUrl = this.canvas.toDataURL("image/png");
    this._sendResult(dataUrl, task, failure).then(() => {
      this._log(`done${failure ? ` (failed !: ${failure})` : ""}\n`);
      task.pageNum++;
      this._nextPage(task);
    });
  }

  _quit() {
    this._log("Done !");
    this.end.textContent = "Tests finished. Close this window!";

    this._send("/tellMeToQuit", { browser: this.browser });
  }

  _info(message: string) {
    this._send(
      "/info",
      { browser: this.browser, message },
    );
  }

  _log(message: string) {
    // Using insertAdjacentHTML yields a large performance gain and
    // reduces runtime significantly.
    if (this.output.insertAdjacentHTML) {
      // eslint-disable-next-line no-unsanitized/method
      this.output.insertAdjacentHTML("beforeend", message);
    } else {
      this.output.textContent += message;
    }

    if (message.lastIndexOf("\n") >= 0 && !this.disableScrolling.checked) {
      // Scroll to the bottom of the page
      this.output.scrollTop = this.output.scrollHeight;
    }
  }

  _done() {
    if (this.inFlightRequests > 0) {
      this.inflight.textContent = this.inFlightRequests as any;
      setTimeout(this._done.bind(this), WAITING_TIME);
    } else {
      setTimeout(this._quit.bind(this), WAITING_TIME);
    }
  }

  async _sendResult(
    snapshot: string,
    task: TaskData_,
    failure: string | false,
  ) {
    const result = {
      browser: this.browser,
      id: task.id,
      numPages: task.pdfDoc ? task.lastPage || task.pdfDoc.numPages : 0,
      lastPageNum: this._getLastPageNumber(task),
      failure,
      file: task.file,
      round: task.round,
      page: task.pageNum,
      stats: task.stats.times,
      viewportWidth: task.viewportWidth,
      viewportHeight: task.viewportHeight,
      outputScale: task.outputScale,
    } as T_task_results;
    this.snapshot.append(new Snapshot_(result, snapshot).el);
    result.snapshot = snapshot;
    return this._send("/submit_task_results", result);
  }

  _send(
    url: string,
    message?: T_info | T_task_results | { browser: T_browser },
  ) {
    const { promise, resolve } = new PromiseCap();
    this.inflight.textContent = this.inFlightRequests++ as any;

    wretch(url)
      .post(message)
      .res((res) => {
        // Retry until successful.
        if (
          !(res.status === HttpStatusCode.OK ||
            res.status === HttpStatusCode.NO_CONTENT)
        ) {
          throw new Error(res.statusText);
        }

        this.inFlightRequests--;
        resolve();
      })
      .catch((reason) => {
        console.warn(`Driver._send failed (${url}): ${reason}`);

        this.inFlightRequests--;
        resolve();

        // this._send(url, message);
      });

    return promise;
  }
}
/*80--------------------------------------------------------------------------*/
