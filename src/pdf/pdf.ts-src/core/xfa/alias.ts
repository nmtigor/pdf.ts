/* Copyright 2021 Mozilla Foundation
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

import { FontFinder } from "./fonts.ts";
import { type XFALayoutMode } from "./html_utils.ts";
import {
  type BorderExtra,
  ContentArea,
  Overflow,
  type OverflowExtra,
  PageArea,
  Para,
  Template,
} from "./template.ts";
import { HTMLResult } from "./utils.ts";
import { $content, $nsAttributes, XFAObject } from "./xfa_object.ts";
/*80--------------------------------------------------------------------------*/

export interface XFAAttrs {
  [key: string]: string;
}
export interface XFANsAttrs extends XFAAttrs {
  [$nsAttributes]?: {
    xfa: {
      dataNode?: "dataGroup" | "dataValue";
    };
  } & {
    [key: string]: XFAAttrs;
  };
}

export type XFAStyleData = Record<string, string>;

export interface AvailableSpace {
  width: number;
  height: number;
}

interface CommonAttrsData {
  class?: string[];
  dataId?: string;
  href?: string;
  id?: string;
  name?: string;
  newWindow?: boolean;
  style?: Record<string, string | undefined>;
  tabindex?: number | undefined;
  textContent?: string;
  type?: string;
  xfaOn?: string;
  xfaOff?: string;
  xmlns?: string;
}
export interface XFAHTMLAttrs extends CommonAttrsData {
  alt?: string | undefined;
  "aria-label"?: string | undefined;
  "aria-level"?: string;
  "aria-required"?: boolean;
  checked?: boolean;
  dir?: string;
  fieldId?: string;
  hidden?: boolean;
  mark?: string;
  maxLength?: number;
  multiple?: boolean;
  role?: string;
  required?: boolean;
  selected?: boolean;
  src?: URL | string;
  title?: string;
  value?: string;
  xfaName?: string;
}
export interface XFASVGAttrs extends CommonAttrsData {
  xmlns: "http://www.w3.org/2000/svg";

  viewBox?: string;
  preserveAspectRatio?: string;

  cx?: string;
  cy?: string;
  rx?: string;
  ry?: string;
  d?: string;
  vectorEffect?: string;
}

export interface XFAElObjBase {
  name: string;
  value?: string;
  children?: (XFAElData | undefined)[];
}

export interface XFAHTMLObj extends XFAElObjBase {
  attributes?: XFAHTMLAttrs;
}
// export type XFAHTMLData = XFAHTMLObj | string | boolean;

export interface XFASVGObj extends XFAElObjBase {
  attributes?: XFASVGAttrs;
}
// export type XFASVGData = XFASVGObj | string | boolean;

export type XFAElObj = XFAHTMLObj | XFASVGObj;
export type XFAElData = XFAElObj | string | boolean;

export type XFAIds = Map<string | symbol, XFAObject>;

export type XFAExtra =
  & {
    afterBreakAfter?: HTMLResult;
    children?: XFAElData[];
    currentWidth?: number;
    height?: number;
    line?: XFAHTMLObj | undefined;
    numberInLine?: number;
    prevHeight?: number | undefined;
    width?: number;

    availableSpace?: AvailableSpace | undefined;

    columnWidths?: number[];
    currentColumn?: number;

    /* Template[$toHTML]() */
    overflowNode?: Overflow | undefined;
    firstUnsplittable?: unknown;
    currentContentArea?: ContentArea | undefined;
    currentPageArea?: PageArea | undefined;
    noLayoutFailure?: boolean | undefined;
    pageNumber?: number;
    pagePosition?: string;
    oddOrEven?: string;
    blankOrNotBlank?: string;
    paraStack?: Para[];
    /* ~ */

    /* Template[$toHTML]() */
    numberOfUse?: number;
    pageIndex?: number;
    pageSetIndex?: number;
    space?: AvailableSpace;
    /* ~ */

    index?: number;
    target?: XFAObject | undefined;

    attempt?: number;
    attributes?: XFAHTMLAttrs | XFASVGAttrs;
    generator?: Generator<HTMLResult> | undefined;
    failingNode?: XFAObject;
    _isSplittable?: boolean;
  }
  & Partial<BorderExtra>
  & Partial<OverflowExtra>
  & Partial<XFALayoutMode>;

export interface XFAValue extends XFAObject {
  value?: { toString(): string };
  [$content]: string | XFAObject;
}

export interface XFAGlobalData {
  usedTypefaces: Set<string>;
  template?: Template;
  fontFinder?: FontFinder;
  images?: Map<string, Uint8Array | Uint8ClampedArray>;
}

export interface XFAFontBase {
  typeface?: string;
  size?: number;
  weight?: string;
  posture?: string;
  letterSpacing?: number | undefined;
}

export interface XFAMargin {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface XFAPrefix {
  prefix: string;
  value: string;
}
export interface XFACleanup {
  hasNamespace: boolean;
  prefixes: XFAPrefix[] | undefined;
  nsAgnostic: boolean;
}
/*80--------------------------------------------------------------------------*/
