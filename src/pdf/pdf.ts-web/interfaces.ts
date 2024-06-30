/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/interfaces.ts
 * @license Apache-2.0
 ******************************************************************************/

/* Copyright 2018 Mozilla Foundation
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

import type { Locale } from "@fe-lib/Locale.ts";
import type {
  AnnotActions,
  AppInfo,
  Destination,
  DocInfo,
  ExplicitDest,
  FieldObject,
  PDFDocumentProxy,
  PrintAnnotationStorage,
  RefProxy,
  ScriptingActionName,
  SetOCGState,
} from "../pdf.ts-src/pdf.ts";
import type { EventBus } from "./event_utils.ts";
import type { LinkTarget } from "./pdf_link_service.ts";
import type { RenderingStates } from "./ui_utils.ts";
import type { FluentMessageArgs } from "@fe-3rd/fluent/dom/esm/localization.ts";
import type { PDFViewerApplication } from "./app.ts";
import type { PageOverview } from "./pdf_viewer.ts";
import type { uint } from "@fe-lib/alias.ts";
/*80--------------------------------------------------------------------------*/

export interface IPDFLinkService {
  eventBus?: EventBus;

  get pagesCount(): number;

  get page(): uint;
  set page(value: uint);

  get rotation(): number;
  set rotation(value: number);

  get isInPresentationMode(): boolean;

  externalLinkTarget: LinkTarget | undefined;

  externalLinkRel: string | undefined;

  get externalLinkEnabled(): boolean;
  set externalLinkEnabled(value: boolean);

  /**
   * @param dest The named, or explicit, PDF destination.
   */
  goToDestination(dest: Destination): Promise<void>;

  /**
   * @param val The page number, or page label.
   */
  goToPage(val: number | string): void;

  /**
   * @param newWindow=false
   */
  addLinkAttributes(
    link: HTMLAnchorElement,
    url: string,
    newWindow?: boolean,
  ): void;

  /**
   * @param dest The PDF destination object.
   * @return The hyperlink to the PDF object.
   */
  getDestinationHash(dest?: Destination): string;

  /**
   * @param hash The PDF parameters/hash.
   * @return The hyperlink to the PDF object.
   */
  getAnchorUrl(hash: string): string;

  setHash(hash: string): void;

  executeNamedAction(action: string): void;

  executeSetOCGState(action: SetOCGState): void;
}

export interface HistoryInitP {
  /**
   * The PDF document's unique fingerprint.
   */
  fingerprint: string;

  /**
   * Reset the browsing history.
   */
  resetHistory?: boolean;

  /**
   * Attempt to update the document URL, with
   * the current hash, when pushing/replacing browser history entries.
   */
  updateUrl: boolean | undefined;
}

export interface HistoryPushP {
  /**
   * The named destination. If absent, a
   * stringified version of `explicitDest` is used.
   */
  namedDest: string | undefined;

  /**
   * The explicit destination array.
   */
  explicitDest: ExplicitDest;

  /**
   * The page to which the destination points.
   */
  pageNumber?: number;
}

export interface IRenderableView {
  /**
   * Unique ID for rendering queue.
   */
  readonly renderingId: string;

  renderingState: RenderingStates;

  /**
   * @return Resolved on draw completion.
   */
  draw(): Promise<void>;

  resume: (() => void) | undefined;
}

export interface IVisibleView extends IRenderableView {
  readonly id: number;

  readonly div: HTMLDivElement;
}

export interface IDownloadManager {
  downloadUrl(url: string, filename: string, _options?: object): void;

  downloadData(
    data: Uint8Array | Uint8ClampedArray,
    filename: string,
    contentType: string,
  ): void;

  /**
   * @return Indicating if the data was opened.
   */
  openOrDownloadData(
    data: Uint8Array | Uint8ClampedArray,
    filename: string,
    dest?: string,
  ): boolean;

  download(blob: Blob, url: string, filename: string, _options?: object): void;
}

export interface IL10n {
  /**
   * @return The current locale.
   */
  getLanguage(): Locale;

  getDirection(): "rtl" | "ltr";

  /**
   * Translates text identified by the key and adds/formats data using the args
   * property bag. If the key was not found, translation falls back to the
   * fallback text.
   */
  get<S extends string | string[]>(
    ids: S,
    args?: FluentMessageArgs,
    fallback?: string,
  ): Promise<S>;

  /**
   * Translates HTML element.
   */
  translate(element: HTMLElement): Promise<void>;

  /**
   * Pause the localization.
   */
  pause(): void;

  /**
   * Resume the localization.
   */
  resume(): void;
}

export type CreatePrintServiceP = {
  pdfDocument: PDFDocumentProxy;
  pagesOverview: PageOverview[];
  printContainer: HTMLDivElement;
  printResolution: number;
  printAnnotationStoragePromise?: Promise<PrintAnnotationStorage | undefined>;
};

export abstract class IPDFPrintServiceFactory {
  static initGlobals(app: PDFViewerApplication) {}

  static get supportsPrinting() {
    return false;
  }

  static createPrintService(params: CreatePrintServiceP) {
    throw new Error("Not implemented: createPrintService");
  }
}

export type CreateSandboxP = {
  objects: Record<string, FieldObject[]>;
  calculationOrder: string[] | undefined;
  appInfo: AppInfo;
  docInfo: DocInfo;
};

export interface EventInSandBox {
  id?: string;
  name: ScriptingActionName;
  pageNumber?: number;
  actions?: AnnotActions | undefined;
}

export abstract class IScripting {
  abstract createSandbox(data: CreateSandboxP): Promise<void>;

  abstract dispatchEventInSandbox(event: EventInSandBox): Promise<void>;

  abstract destroySandbox(): Promise<void>;
}
/*80--------------------------------------------------------------------------*/
