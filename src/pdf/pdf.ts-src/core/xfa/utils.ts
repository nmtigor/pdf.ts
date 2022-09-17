/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

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

import { type rect_t, shadow } from "../../shared/util.ts";
import { type XFAElData } from "./alias.ts";
import { BreakAfter, BreakBefore, Template } from "./template.ts";
/*80--------------------------------------------------------------------------*/

const dimConverters = {
  pt: (x: number) => x,
  cm: (x: number) => (x / 2.54) * 72,
  mm: (x: number) => (x / (10 * 2.54)) * 72,
  in: (x: number) => x * 72,
  px: (x: number) => x,
};
const measurementPattern = /([+-]?\d+\.?\d*)(.*)/;

export function stripQuotes(str: string) {
  if (str.startsWith("'") || str.startsWith('"')) {
    return str.slice(1, str.length - 1);
  }
  return str;
}

interface _GetIntegerP {
  data?: string;
  defaultValue: number | string;
  validate: (x: number) => boolean;
}
export function getInteger({ data, defaultValue, validate }: _GetIntegerP) {
  if (!data) {
    return <number> defaultValue;
  }
  data = data.trim();
  const n = parseInt(data, 10);
  if (!isNaN(n) && validate(n)) {
    return n;
  }
  return <number> defaultValue;
}

interface _GetFloatP {
  data?: string;
  defaultValue: number;
  validate: (x: number) => boolean;
}
export function getFloat({ data, defaultValue, validate }: _GetFloatP) {
  if (!data) {
    return defaultValue;
  }
  data = data.trim();
  const n = parseFloat(data);
  if (!isNaN(n) && validate(n)) {
    return n;
  }
  return defaultValue;
}

interface _GetKeywordP {
  data?: string | undefined;
  defaultValue: string;
  validate: (k: string) => boolean;
}
export function getKeyword({ data, defaultValue, validate }: _GetKeywordP) {
  if (!data) {
    return defaultValue;
  }
  data = data.trim();
  if (validate(data)) {
    return data;
  }
  return defaultValue;
}

export function getStringOption(data: string | undefined, options: string[]) {
  return getKeyword({
    data,
    defaultValue: options[0],
    validate: (k: string) => options.includes(k),
  });
}

export function getMeasurement(str: string | undefined, def = "0"): number {
  def = def || "0";
  if (!str) {
    return getMeasurement(def);
  }
  const match = str.trim().match(measurementPattern);
  if (!match) {
    return getMeasurement(def);
  }
  const [, valueStr, unit] = match;
  const value = parseFloat(valueStr);
  if (isNaN(value)) {
    return getMeasurement(def);
  }

  if (value === 0) {
    return 0;
  }

  const conv = dimConverters[<keyof typeof dimConverters> unit];
  if (conv) {
    return conv(value);
  }

  return value;
}

export function getRatio(data?: string) {
  if (!data) {
    return { num: 1, den: 1 };
  }
  const ratio = data
    .trim()
    .split(/\s*:\s*/)
    .map((x) => parseFloat(x))
    .filter((x) => !isNaN(x));
  if (ratio.length === 1) {
    ratio.push(1);
  }

  if (ratio.length === 0) {
    return { num: 1, den: 1 };
  }

  const [num, den] = ratio;
  return { num, den };
}

export function getRelevant(data?: string) {
  if (!data) {
    return [];
  }
  return data
    .trim()
    .split(/\s+/)
    .map((e) => {
      return {
        excluded: e[0] === "-",
        viewname: e.substring(1),
      };
    });
}

export interface XFAColor {
  r: number;
  g: number;
  b: number;
}
export function getColor(data?: string, def = [0, 0, 0]) {
  let [r, g, b] = def;
  if (!data) {
    return { r, g, b };
  }
  const color = data
    .trim()
    .split(/\s*,\s*/)
    .map((c) => Math.min(Math.max(0, parseInt(c.trim(), 10)), 255))
    .map((c) => (isNaN(c) ? 0 : c));

  if (color.length < 3) {
    return { r, g, b };
  }

  [r, g, b] = color;
  return <XFAColor> { r, g, b };
}

export interface XFABBox {
  x: number;
  y: number;
  width: number;
  height: number;
}
export function getBBox(data?: string): XFABBox {
  const def = -1;
  if (!data) {
    return { x: def, y: def, width: def, height: def };
  }
  const bbox = data
    .trim()
    .split(/\s*,\s*/)
    .map((m) => getMeasurement(m, "-1"));
  if (bbox.length < 4 || bbox[2] < 0 || bbox[3] < 0) {
    return { x: def, y: def, width: def, height: def };
  }

  const [x, y, width, height] = bbox;
  return { x, y, width, height };
}

export class HTMLResult {
  static get FAILURE() {
    return shadow(this, "FAILURE", new HTMLResult(false));
  }

  static get EMPTY() {
    return shadow(this, "EMPTY", new HTMLResult(true));
  }

  success;
  html;
  bbox;

  breakNode;
  isBreak() {
    return !!this.breakNode;
  }

  constructor(
    success: boolean,
    html?: XFAElData,
    bbox?: rect_t,
    breakNode?: BreakAfter | BreakBefore | Template,
  ) {
    this.success = success;
    this.html = html;
    this.bbox = bbox;
    this.breakNode = breakNode;
  }

  static breakNode(node: BreakAfter | BreakBefore) {
    return new HTMLResult(false, undefined, undefined, node);
  }

  static success(html: XFAElData, bbox?: rect_t) {
    return new HTMLResult(true, html, bbox);
  }
}
/*80--------------------------------------------------------------------------*/
