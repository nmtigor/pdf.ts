/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/pdf_link_service.ts
 * @license Apache-2.0
 ******************************************************************************/

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

import type { uint } from "@fe-lib/alias.ts";
import { isObjectLike } from "@fe-lib/jslang.ts";
import { MOZCENTRAL, PDFJSDev } from "@fe-src/global.ts";
import type {
  Destination,
  ExplicitDest,
  PDFDocumentProxy,
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

//kkkk TOCLEANUP
// interface ExternalLinkP_ {
//   /**
//    * An absolute URL.
//    */
//   url: string;

//   /**
//    * The link target. The default value is `LinkTarget.NONE`.
//    */
//   target?: LinkTarget | undefined;

//   /**
//    * The link relationship. The default value is `DEFAULT_LINK_REL`.
//    */
//   rel?: string | undefined;

//   /**
//    * Whether the link should be enabled. The default value is true.
//    */
//   enabled?: boolean;
// }

// /**
//  * Adds various attributes (href, title, target, rel) to hyperlinks.
//  * @param link The link element.
//  */
// function addLinkAttributes(
//   link: HTMLAnchorElement,
//   { url, target, rel, enabled = true } = {} as ExternalLinkP_,
// ) {
//   if (!url || typeof url !== "string") {
//     throw new Error('A valid "url" parameter must provided.');
//   }

//   if (enabled) {
//     link.href = link.title = url;
//   } else {
//     link.href = "";
//     link.title = `Disabled: ${url}`;
//     link.onclick = () => false;
//   }

//   let targetStr = ""; // LinkTarget.NONE
//   switch (target) {
//     case LinkTarget.NONE:
//       break;
//     case LinkTarget.SELF:
//       targetStr = "_self";
//       break;
//     case LinkTarget.BLANK:
//       targetStr = "_blank";
//       break;
//     case LinkTarget.PARENT:
//       targetStr = "_parent";
//       break;
//     case LinkTarget.TOP:
//       targetStr = "_top";
//       break;
//   }
//   link.target = targetStr;

//   link.rel = typeof rel === "string" ? rel : DEFAULT_LINK_REL;
// }

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

  constructor({
    eventBus,
    externalLinkTarget,
    externalLinkRel,
    ignoreDestinationZoom = false,
  } = {} as PDFLinkServiceOptions) {
    this.eventBus = eventBus;
    this.externalLinkTarget = externalLinkTarget;
    this.externalLinkRel = externalLinkRel;
    this.#ignoreDestinationZoom = ignoreDestinationZoom;
  }

  setDocument(pdfDocument?: PDFDocumentProxy, baseUrl?: string) {
    this.baseUrl = baseUrl;
    this.pdfDocument = pdfDocument;
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
  get page(): uint {
    return this.pdfDocument ? this.pdfViewer!.currentPageNumber : 1;
  }
  set page(value: uint) {
    if (this.pdfDocument) {
      this.pdfViewer!.currentPageNumber = value;
    }
  }

  /** @implement */
  get rotation(): number {
    return this.pdfDocument ? this.pdfViewer!.pagesRotation : 0;
  }
  set rotation(value: number) {
    if (this.pdfDocument) {
      this.pdfViewer!.pagesRotation = value;
    }
  }

  /** @implement */
  get isInPresentationMode() {
    return this.pdfDocument ? this.pdfViewer!.isInPresentationMode : false;
  }

  /**
   * This method will, when available, also update the browser history.
   * @implement
   * @param dest The named, or explicit, PDF destination.
   */
  async goToDestination(dest: string | ExplicitDest) {
    if (!this.pdfDocument) {
      return;
    }
    let namedDest, explicitDest, pageNumber;
    if (typeof dest === "string") {
      namedDest = dest;
      explicitDest = await this.pdfDocument.getDestination(dest);
    } else {
      namedDest = undefined;
      explicitDest = await dest;
    }
    if (!Array.isArray(explicitDest)) {
      console.error(
        `goToDestination: "${explicitDest}" is not a valid destination array, for dest="${dest}".`,
      );
      return;
    }
    // Dest array looks like that: <page-ref> </XYZ|/FitXXX> <args..>
    const [destRef] = explicitDest;

    if (isObjectLike(destRef)) {
      pageNumber = this.pdfDocument.cachedPageNumber(destRef);

      if (!pageNumber) {
        // Fetch the page reference if it's not yet available. This could
        // only occur during loading, before all pages have been resolved.
        try {
          pageNumber = (await this.pdfDocument.getPageIndex(destRef)) + 1;
        } catch {
          console.error(
            `goToDestination: "${destRef}" is not a valid page reference, for dest="${dest}".`,
          );
          return;
        }
      }
    } else if (Number.isInteger(destRef)) {
      pageNumber = destRef! + 1;
    }
    if (!pageNumber || pageNumber < 1 || pageNumber > this.pagesCount) {
      console.error(
        `goToDestination: "${pageNumber}" is not a valid page number, for dest="${dest}".`,
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
   * Adds various attributes (href, title, target, rel) to hyperlinks.
   * @implement
   */
  addLinkAttributes(link: HTMLAnchorElement, url: string, newWindow = false) {
    if (!url || typeof url !== "string") {
      throw new Error('A valid "url" parameter must provided.');
    }
    const target = newWindow ? LinkTarget.BLANK : this.externalLinkTarget,
      rel = this.externalLinkRel;

    if (this.externalLinkEnabled) {
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
    let pageNumber, dest: ExplicitDest | string;
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
            zoomArgNumber ? zoomArgNumber / 100 : zoomArg as any,
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
          destArray: dest as ExplicitDest,
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

      /*#static*/ if (PDFJSDev || !MOZCENTRAL) {
        return;
      }
      // Support opening of PDF attachments in the Firefox PDF Viewer,
      // which uses a couple of non-standard hash parameters; refer to
      // `DownloadManager.openOrDownloadData` in the firefoxcom.js file.
      if (!params.has("filename") || !params.has("filedest")) {
        return;
      }
      hash = params.get("filedest")!;
    }

    // Named (or explicit) destination.
    dest = unescape(hash);
    try {
      dest = JSON.parse(dest);

      if (!Array.isArray(dest)) {
        // Avoid incorrectly rejecting a valid named destination, such as
        // e.g. "4.3" or "true", because `JSON.parse` converted its type.
        dest = dest.toString();
      }
    } catch {}

    if (typeof dest === "string" || PDFLinkService.#isValidExplicitDest(dest)) {
      this.goToDestination(dest);
      return;
    }
    console.error(
      `PDFLinkService.setHash: "${unescape(hash)}" is not a valid destination.`,
    );
  }

  /** @implement */
  executeNamedAction(action: string) {
    if (!this.pdfDocument) {
      return;
    }
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
    if (!this.pdfDocument) {
      return;
    }
    const pdfDocument = this.pdfDocument,
      optionalContentConfig = await this.pdfViewer!
        .optionalContentConfigPromise;

    if (pdfDocument !== this.pdfDocument) {
      return; // The document was closed while the optional content resolved.
    }
    optionalContentConfig!.setOCGState(action);

    this.pdfViewer!.optionalContentConfigPromise = Promise.resolve(
      optionalContentConfig,
    );
  }

  static #isValidExplicitDest(dest: ExplicitDest) {
    if (!Array.isArray(dest) || dest.length < 2) {
      return false;
    }
    const [page, zoom, ...args] = dest;
    if (
      !(
        typeof page === "object" &&
        Number.isInteger(page?.num) &&
        Number.isInteger(page?.gen)
      ) &&
      !Number.isInteger(page)
    ) {
      return false;
    }
    if (!(typeof zoom === "object" && typeof zoom?.name === "string")) {
      return false;
    }
    const argsLen = args.length;
    let allowNull = true;
    switch (zoom.name) {
      case "XYZ":
        if (argsLen < 2 || argsLen > 3) {
          return false;
        }
        break;
      case "Fit":
      case "FitB":
        return argsLen === 0;
      case "FitH":
      case "FitBH":
      case "FitV":
      case "FitBV":
        if (argsLen > 1) {
          return false;
        }
        break;
      case "FitR":
        if (argsLen !== 4) {
          return false;
        }
        allowNull = false;
        break;
      default:
        return false;
    }
    for (const arg of args) {
      if (!(typeof arg === "number" || (allowNull && arg == undefined))) {
        return false;
      }
    }
    return true;
  }
}

export class SimpleLinkService extends PDFLinkService {
  override setDocument(pdfDocument?: PDFDocumentProxy, baseUrl?: string) {}
}
/*80--------------------------------------------------------------------------*/
