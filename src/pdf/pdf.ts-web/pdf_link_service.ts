/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

/* Copyright 2015 Mozilla Foundation
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

import { isObjectLike } from "@fe-lib/jslang.ts";
import { assert } from "@fe-lib/util/trace.ts";
import type {
  Destination,
  ExplicitDest,
  PDFDocumentProxy,
  Ref,
  RefProxy,
  SetOCGState,
} from "../pdf.ts-src/pdf.ts";
import type { EventBus } from "./event_utils.ts";
import type { IPDFLinkService } from "./interfaces.ts";
import type { PDFHistory } from "./pdf_history.ts";
import type { PDFViewer } from "./pdf_viewer.ts";
import { parseQueryString } from "./ui_utils.ts";
/*80--------------------------------------------------------------------------*/

const DEFAULT_LINK_REL = "noopener noreferrer nofollow";

export const enum LinkTarget {
  NONE = 0, // Default value.
  SELF = 1,
  BLANK = 2,
  PARENT = 3,
  TOP = 4,
}

interface ExternalLinkP_ {
  /**
   * An absolute URL.
   */
  url: string;

  /**
   * The link target. The default value is `LinkTarget.NONE`.
   */
  target?: LinkTarget | undefined;

  /**
   * The link relationship. The default value is `DEFAULT_LINK_REL`.
   */
  rel?: string | undefined;

  /**
   * Whether the link should be enabled. The default value is true.
   */
  enabled?: boolean;
}

/**
 * Adds various attributes (href, title, target, rel) to hyperlinks.
 * @param link The link element.
 */
function addLinkAttributes(
  link: HTMLAnchorElement,
  { url, target, rel, enabled = true } = {} as ExternalLinkP_,
) {
  if (!url || typeof url !== "string") {
    throw new Error('A valid "url" parameter must provided.');
  }

  if (enabled) {
    link.href = link.title = url;
  } else {
    link.href = "";
    link.title = `Disabled: ${url}`;
    link.onclick = () => false;
  }

  let targetStr = ""; // LinkTarget.NONE
  switch (target) {
    case LinkTarget.NONE:
      break;
    case LinkTarget.SELF:
      targetStr = "_self";
      break;
    case LinkTarget.BLANK:
      targetStr = "_blank";
      break;
    case LinkTarget.PARENT:
      targetStr = "_parent";
      break;
    case LinkTarget.TOP:
      targetStr = "_top";
      break;
  }
  link.target = targetStr;

  link.rel = typeof rel === "string" ? rel : DEFAULT_LINK_REL;
}

interface PDFLinkServiceOptions {
  /**
   * The application event bus.
   */
  eventBus: EventBus;

  /**
   * Specifies the `target` attribute
   * for external links. Must use one of the values from {LinkTarget}.
   * Defaults to using no target.
   */
  externalLinkTarget: LinkTarget | undefined;

  /**
   * Specifies the `rel` attribute for
   * external links. Defaults to stripping the referrer.
   */
  externalLinkRel: string | undefined;

  /**
   * Ignores the zoom argument,
   * thus preserving the current zoom level in the viewer, when navigating
   * to internal destinations. The default value is `false`.
   */
  ignoreDestinationZoom: boolean | undefined;
}

/**
 * Performs navigation functions inside PDF, such as opening specified page,
 * or destination.
 */
export class PDFLinkService implements IPDFLinkService {
  /** @implement */
  eventBus: EventBus;

  /** @implement */
  externalLinkTarget: LinkTarget | undefined;
  /** @implement */
  externalLinkRel: string | undefined;
  /** @implement */
  externalLinkEnabled = true;
  #ignoreDestinationZoom: boolean;

  baseUrl: string | undefined;
  pdfDocument: PDFDocumentProxy | undefined;
  pdfViewer?: PDFViewer;
  pdfHistory?: PDFHistory;

  #pagesRefCache = new Map<string, number>();

  constructor({
    eventBus,
    externalLinkTarget,
    externalLinkRel,
    ignoreDestinationZoom = false,
  }: PDFLinkServiceOptions) {
    this.eventBus = eventBus;
    this.externalLinkTarget = externalLinkTarget;
    this.externalLinkRel = externalLinkRel;
    this.#ignoreDestinationZoom = ignoreDestinationZoom;
  }

  setDocument(pdfDocument?: PDFDocumentProxy, baseUrl?: string) {
    this.baseUrl = baseUrl;
    this.pdfDocument = pdfDocument;
    this.#pagesRefCache.clear();
  }

  setViewer(pdfViewer: PDFViewer) {
    this.pdfViewer = pdfViewer;
  }

  setHistory(pdfHistory: PDFHistory) {
    this.pdfHistory = pdfHistory;
  }

  /** @implement */
  get pagesCount(): number {
    return this.pdfDocument ? this.pdfDocument.numPages : 0;
  }

  /** @implement */
  get page(): number {
    return this.pdfViewer!.currentPageNumber;
  }
  set page(value: number) {
    this.pdfViewer!.currentPageNumber = value;
  }

  /** @implement */
  get rotation(): number {
    return this.pdfViewer!.pagesRotation;
  }
  set rotation(value: number) {
    this.pdfViewer!.pagesRotation = value;
  }

  /** @implement */
  get isInPresentationMode() {
    return this.pdfViewer!.isInPresentationMode;
  }

  #goToDestinationHelper(
    rawDest: string | ExplicitDest,
    namedDest: string | undefined,
    explicitDest: ExplicitDest,
  ) {
    // Dest array looks like that: <page-ref> </XYZ|/FitXXX> <args..>
    const destRef = explicitDest[0];
    let pageNumber;

    if (isObjectLike(destRef)) {
      pageNumber = this._cachedPageNumber(destRef);

      if (pageNumber) {
        // Fetch the page reference if it's not yet available. This could
        // only occur during loading, before all pages have been resolved.
        this.pdfDocument!
          .getPageIndex(destRef as Ref)
          .then((pageIndex) => {
            this.cachePageRef(pageIndex + 1, destRef as Ref);
            this.#goToDestinationHelper(rawDest, namedDest, explicitDest);
          })
          .catch(() => {
            console.error(
              `PDFLinkService.#goToDestinationHelper: "${destRef}" is not ` +
                `a valid page reference, for dest="${rawDest}".`,
            );
          });
        return;
      }
    } else if (Number.isInteger(destRef)) {
      pageNumber = <number> destRef + 1;
    } else {
      console.error(
        `PDFLinkService.#goToDestinationHelper: "${destRef}" is not ` +
          `a valid destination reference, for dest="${rawDest}".`,
      );
      return;
    }
    if (!pageNumber || pageNumber < 1 || pageNumber > this.pagesCount) {
      console.error(
        `PDFLinkService.#goToDestinationHelper: "${pageNumber}" is not ` +
          `a valid page number, for dest="${rawDest}".`,
      );
      return;
    }

    if (this.pdfHistory) {
      // Update the browser history before scrolling the new destination into
      // view, to be able to accurately capture the current document position.
      this.pdfHistory.pushCurrentPosition();
      this.pdfHistory.push({ namedDest, explicitDest, pageNumber });
    }

    this.pdfViewer!.scrollPageIntoView({
      pageNumber,
      destArray: explicitDest,
      ignoreDestinationZoom: this.#ignoreDestinationZoom,
    });
  }

  /**
   * This method will, when available, also update the browser history.
   * @implement
   * @param dest The named, or explicit, PDF destination.
   */
  async goToDestination(dest: string | ExplicitDest) {
    if (!this.pdfDocument) return;

    let namedDest, explicitDest;
    if (typeof dest === "string") {
      namedDest = dest;
      explicitDest = await this.pdfDocument.getDestination(dest);
    } else {
      namedDest = undefined;
      explicitDest = await dest;
    }
    if (!Array.isArray(explicitDest)) {
      console.error(
        `PDFLinkService.goToDestination: "${explicitDest}" is not ` +
          `a valid destination array, for dest="${dest}".`,
      );
      return;
    }
    this.#goToDestinationHelper(dest, namedDest, explicitDest);
  }

  /**
   * This method will, when available, also update the browser history.
   *
   * @implement
   * @param val The page number, or page label.
   */
  goToPage(val: number | string) {
    if (!this.pdfDocument) return;

    const pageNumber =
      (typeof val === "string" && this.pdfViewer!.pageLabelToPageNumber(val)) ||
      +val | 0;
    if (
      !(Number.isInteger(pageNumber) &&
        pageNumber > 0 &&
        pageNumber <= this.pagesCount)
    ) {
      console.error(`PDFLinkService.goToPage: "${val}" is not a valid page.`);
      return;
    }

    if (this.pdfHistory) {
      // Update the browser history before scrolling the new page into view,
      // to be able to accurately capture the current document position.
      this.pdfHistory.pushCurrentPosition();
      this.pdfHistory.pushPage(pageNumber);
    }

    this.pdfViewer!.scrollPageIntoView({ pageNumber });
  }

  /**
   * Wrapper around the `addLinkAttributes` helper function.
   * @implement
   */
  addLinkAttributes(link: HTMLAnchorElement, url: string, newWindow = false) {
    addLinkAttributes(link, {
      url,
      target: newWindow ? LinkTarget.BLANK : this.externalLinkTarget,
      rel: this.externalLinkRel,
      enabled: this.externalLinkEnabled,
    });
  }

  /**
   * @implement
   * @param dest The PDF destination object.
   * @return The hyperlink to the PDF object.
   */
  getDestinationHash(dest?: Destination) {
    if (typeof dest === "string") {
      if (dest.length > 0) {
        return this.getAnchorUrl("#" + escape(dest));
      }
    } else if (Array.isArray(dest)) {
      const str = JSON.stringify(dest);
      if (str.length > 0) {
        return this.getAnchorUrl("#" + escape(str));
      }
    }
    return this.getAnchorUrl("");
  }

  /**
   * Prefix the full url on anchor links to make sure that links are resolved
   * relative to the current URL instead of the one defined in <base href>.
   * @implement
   * @param anchor The anchor hash, including the #.
   * @return The hyperlink to the PDF object.
   */
  getAnchorUrl(anchor: string): string {
    return this.baseUrl ? this.baseUrl + anchor : anchor;
  }

  /** @implement */
  setHash(hash: string) {
    if (!this.pdfDocument) {
      return;
    }
    let pageNumber, dest: ExplicitDest;
    if (hash.includes("=")) {
      const params = parseQueryString(hash);
      if (params.has("search")) {
        const query = params.get("search")!.replaceAll('"', ""),
          phrase = params.get("phrase") === "true";

        this.eventBus.dispatch("findfromurlhash", {
          source: this,
          query: phrase ? query : query.match(/\S+/g),
        });
      }
      // borrowing syntax from "Parameters for Opening PDF Files"
      if (params.has("page")) {
        pageNumber = +params.get("page")! | 0 || 1;
      }
      if (params.has("zoom")) {
        // Build the destination array.
        const zoomArgs = params.get("zoom")!.split(","); // scale,left,top
        const zoomArg = zoomArgs[0];
        const zoomArgNumber = parseFloat(zoomArg);

        if (!zoomArg.includes("Fit")) {
          // If the zoomArg is a number, it has to get divided by 100. If it's
          // a string, it should stay as it is.
          dest = [
            null,
            { name: "XYZ" },
            zoomArgs.length > 1 ? +zoomArgs[1] | 0 : null,
            zoomArgs.length > 2 ? +zoomArgs[2] | 0 : null,
            zoomArgNumber ? zoomArgNumber / 100 : zoomArg,
          ];
        } else if (zoomArg === "Fit" || zoomArg === "FitB") {
          dest = [null, { name: zoomArg }];
        } else if (
          zoomArg === "FitH" ||
          zoomArg === "FitBH" ||
          zoomArg === "FitV" ||
          zoomArg === "FitBV"
        ) {
          dest = [
            null,
            { name: zoomArg },
            zoomArgs.length > 1 ? +zoomArgs[1] | 0 : null,
          ];
        } else if (zoomArg === "FitR") {
          if (zoomArgs.length !== 5) {
            console.error(
              'PDFLinkService.setHash: Not enough parameters for "FitR".',
            );
          } else {
            dest = [
              null,
              { name: zoomArg },
              +zoomArgs[1] | 0,
              +zoomArgs[2] | 0,
              +zoomArgs[3] | 0,
              +zoomArgs[4] | 0,
            ];
          }
        } else {
          console.error(
            `PDFLinkService.setHash: "${zoomArg}" is not a valid zoom value.`,
          );
        }
      }
      if (dest!) {
        this.pdfViewer!.scrollPageIntoView({
          pageNumber: pageNumber || this.page,
          destArray: dest,
          allowNegativeOffset: true,
        });
      } else if (pageNumber) {
        this.page = pageNumber; // simple page
      }
      if (params.has("pagemode")) {
        this.eventBus.dispatch("pagemode", {
          source: this,
          mode: params.get("pagemode")!,
        });
      }
      // Ensure that this parameter is *always* handled last, in order to
      // guarantee that it won't be overridden (e.g. by the "page" parameter).
      if (params.has("nameddest")) {
        this.goToDestination(params.get("nameddest")!);
      }
    } else {
      // Named (or explicit) destination.
      let dest = unescape(hash);
      try {
        dest = JSON.parse(dest);

        if (!Array.isArray(dest)) {
          // Avoid incorrectly rejecting a valid named destination, such as
          // e.g. "4.3" or "true", because `JSON.parse` converted its type.
          dest = dest.toString();
        }
      } catch {}

      if (
        typeof dest === "string" ||
        PDFLinkService.#isValidExplicitDestination(dest)
      ) {
        this.goToDestination(dest);
        return;
      }
      console.error(
        `PDFLinkService.setHash: "${
          unescape(hash)
        }" is not a valid destination.`,
      );
    }
  }

  /** @implement */
  executeNamedAction(action: string) {
    // See PDF reference, table 8.45 - Named action
    switch (action) {
      case "GoBack":
        this.pdfHistory?.back();
        break;

      case "GoForward":
        this.pdfHistory?.forward();
        break;

      case "NextPage":
        this.pdfViewer!.nextPage();
        break;

      case "PrevPage":
        this.pdfViewer!.previousPage();
        break;

      case "LastPage":
        this.page = this.pagesCount;
        break;

      case "FirstPage":
        this.page = 1;
        break;

      default:
        break; // No action according to spec
    }

    this.eventBus.dispatch("namedaction", {
      source: this,
      action,
    });
  }

  async executeSetOCGState(action: SetOCGState) {
    const pdfDocument = this.pdfDocument;
    const optionalContentConfig = await this.pdfViewer!
      .optionalContentConfigPromise;

    if (pdfDocument !== this.pdfDocument) {
      return; // The document was closed while the optional content resolved.
    }
    let operator;

    for (const elem of action.state) {
      switch (elem) {
        case "ON":
        case "OFF":
        case "Toggle":
          operator = elem;
          continue;
      }
      switch (operator) {
        case "ON":
          optionalContentConfig!.setVisibility(elem, true);
          break;
        case "OFF":
          optionalContentConfig!.setVisibility(elem, false);
          break;
        case "Toggle":
          const group = optionalContentConfig!.getGroup(elem);
          if (group) {
            optionalContentConfig!.setVisibility(elem, !group.visible);
          }
          break;
      }
    }

    this.pdfViewer!.optionalContentConfigPromise = Promise.resolve(
      optionalContentConfig,
    );
  }

  /**
   * @implement
   * @param pageNum page number.
   * @param pageRef reference to the page.
   */
  cachePageRef(pageNum: number, pageRef: RefProxy | undefined) {
    if (!pageRef) return;

    const refStr = pageRef.gen === 0
      ? `${pageRef.num}R`
      : `${pageRef.num}R${pageRef.gen}`;
    this.#pagesRefCache.set(refStr, pageNum);
  }

  /** @implement */
  _cachedPageNumber(pageRef: RefProxy | undefined) {
    if (!pageRef) return undefined;

    const refStr = pageRef.gen === 0
      ? `${pageRef.num}R`
      : `${pageRef.num}R${pageRef.gen}`;
    return this.#pagesRefCache.get(refStr) || undefined;
  }

  static #isValidExplicitDestination(dest: unknown) {
    if (!Array.isArray(dest)) return false;

    const destLength = dest.length;
    if (destLength < 2) return false;

    const page = dest[0];
    if (
      !(
        typeof page === "object" &&
        Number.isInteger(page.num) &&
        Number.isInteger(page.gen)
      ) &&
      !(Number.isInteger(page) && page >= 0)
    ) {
      return false;
    }
    const zoom = dest[1];
    if (!(typeof zoom === "object" && typeof zoom.name === "string")) {
      return false;
    }

    let allowNull = true;
    switch (zoom.name) {
      case "XYZ":
        if (destLength !== 5) return false;
        break;
      case "Fit":
      case "FitB":
        return destLength === 2;
      case "FitH":
      case "FitBH":
      case "FitV":
      case "FitBV":
        if (destLength !== 3) return false;
        break;
      case "FitR":
        if (destLength !== 6) return false;

        allowNull = false;
        break;
      default:
        return false;
    }
    for (let i = 2; i < destLength; i++) {
      const param = dest[i];
      if (!(typeof param === "number" || (allowNull && param === null))) {
        return false;
      }
    }
    return true;
  }
}

export class SimpleLinkService implements IPDFLinkService {
  /** @implement */
  externalLinkTarget: LinkTarget | undefined;
  /** @implement */
  externalLinkRel: string | undefined;
  /** @implement */
  externalLinkEnabled = true;

  /** @implement */
  get pagesCount() {
    return 0;
  }

  /** @implement */
  get page() {
    return 0;
  }
  set page(value: number) {}

  /** @implement */
  get rotation() {
    return 0;
  }
  set rotation(value: number) {}

  /** @implement */
  get isInPresentationMode() {
    return false;
  }

  /**
   * @param dest The named, or explicit, PDF destination.
   */
  async goToDestination(dest: Destination) {}

  /**
   * @param val The page number, or page label.
   */
  goToPage(val: number | string) {}

  /** @implement */
  addLinkAttributes(link: HTMLAnchorElement, url: string, newWindow = false) {
    addLinkAttributes(link, { url, enabled: this.externalLinkEnabled });
  }

  /**
   * @param dest The PDF destination object.
   * @return The hyperlink to the PDF object.
   */
  getDestinationHash(dest?: Destination) {
    return "#";
  }

  /**
   * @implement
   * @param hash The PDF parameters/hash.
   * @return The hyperlink to the PDF object.
   */
  getAnchorUrl(hash: string) {
    return "#";
  }

  /** @implement */
  setHash(hash: string) {}

  /** @implement */
  executeNamedAction(action: string) {}

  /**
   * @param {Object} action
   */
  executeSetOCGState(action: SetOCGState) {}

  /**
   * @implement
   * @param pageNum page number.
   * @param pageRef reference to the page.
   */
  cachePageRef(pageNum: number, pageRef: RefProxy | undefined) {}

  /** @implement */
  _cachedPageNumber(pageRef: RefProxy) {
    assert(0);
    return undefined;
  }
}
/*80--------------------------------------------------------------------------*/
