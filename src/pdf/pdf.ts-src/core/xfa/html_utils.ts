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

import {
  createValidAbsoluteUrl,
  type rect_t,
  warn,
} from "../../shared/util.ts";
import {
  type AvailableSpace,
  type XFAElObj,
  type XFAExtra,
  type XFAFontBase,
  type XFAHTMLObj,
  type XFAMargin,
  type XFAStyleData,
} from "./alias.ts";
import { FontFinder, selectFont } from "./fonts.ts";
import {
  Area,
  Border,
  Caption,
  ContentArea,
  Draw,
  ExclGroup,
  Field,
  Margin,
  Subform,
} from "./template.ts";
import { TextMeasure } from "./text.ts";
import { getMeasurement, stripQuotes } from "./utils.ts";
import {
  $content,
  $extra,
  $getParent,
  $getSubformParent,
  $getTemplateRoot,
  $globalData,
  $nodeName,
  $pushGlyphs,
  $text,
  $toStyle,
  XFAObject,
} from "./xfa_object.ts";
import { XhtmlObject } from "./xhtml.ts";
/*80--------------------------------------------------------------------------*/

export function measureToString(m: string | number) {
  if (typeof m === "string") return "0px";

  return Number.isInteger(m) ? `${m}px` : `${m.toFixed(2)}px`;
}

type ConverterName = keyof typeof converters;
const converters = {
  anchorType(node: XFAObject, style: XFAStyleData) {
    const parent = node[$getSubformParent]();
    if (!parent || (parent.layout && parent.layout !== "position")) {
      // anchorType is only used in a positioned layout.
      return;
    }

    if (!("transform" in style)) {
      style.transform = "";
    }
    switch (node.anchorType) {
      case "bottomCenter":
        style.transform += "translate(-50%, -100%)";
        break;
      case "bottomLeft":
        style.transform += "translate(0,-100%)";
        break;
      case "bottomRight":
        style.transform += "translate(-100%,-100%)";
        break;
      case "middleCenter":
        style.transform += "translate(-50%,-50%)";
        break;
      case "middleLeft":
        style.transform += "translate(0,-50%)";
        break;
      case "middleRight":
        style.transform += "translate(-100%,-50%)";
        break;
      case "topCenter":
        style.transform += "translate(-50%,0)";
        break;
      case "topRight":
        style.transform += "translate(-100%,0)";
        break;
    }
  },
  dimensions(node: XFAObject, style: XFAStyleData) {
    const parent = node[$getSubformParent]()!;
    let width = <string | number> node.w;
    const height = <string | number> node.h;
    if (parent.layout?.includes("row")) {
      const extra = <XFAExtra> parent[$extra];
      const colSpan = node.colSpan;
      let w;
      if (colSpan === -1) {
        w = extra.columnWidths!
          .slice(extra.currentColumn)
          .reduce((a, x) => a + x, 0);
        extra.currentColumn = 0;
      } else {
        w = extra.columnWidths!
          .slice(extra.currentColumn, extra.currentColumn! + colSpan!)
          .reduce((a, x) => a + x, 0);
        extra.currentColumn = (extra.currentColumn! + node.colSpan!) %
          extra.columnWidths!.length;
      }

      if (!isNaN(w)) {
        width = node.w = w;
      }
    }

    if (width !== "") {
      style.width = measureToString(width);
    } else {
      style.width = "auto";
    }

    if (height !== "") {
      style.height = measureToString(height);
    } else {
      style.height = "auto";
    }
  },
  position(node: XFAObject, style: XFAStyleData) {
    const parent = node[$getSubformParent]();
    if (parent && parent.layout && parent.layout !== "position") {
      // IRL, we've some x/y in tb layout.
      // Specs say x/y is only used in positioned layout.
      return;
    }

    style.position = "absolute";
    style.left = measureToString(node.x!);
    style.top = measureToString(node.y!);
  },
  rotate(node: XFAObject, style: XFAStyleData) {
    if (node.rotate) {
      if (!("transform" in style)) {
        style.transform = "";
      }
      style.transform += `rotate(-${node.rotate}deg)`;
      style.transformOrigin = "top left";
    }
  },
  presence(node: XFAObject, style: XFAStyleData) {
    switch (node.presence) {
      case "invisible":
        style.visibility = "hidden";
        break;
      case "hidden":
      case "inactive":
        style.display = "none";
        break;
    }
  },
  hAlign(node: XFAObject, style: XFAStyleData) {
    if (node[$nodeName] === "para") {
      switch (node.hAlign) {
        case "justifyAll":
          style.textAlign = "justify-all";
          break;
        case "radix":
          // TODO: implement this correctly !
          style.textAlign = "left";
          break;
        default:
          style.textAlign = node.hAlign!;
      }
    } else {
      switch (node.hAlign) {
        case "left":
          style.alignSelf = "start";
          break;
        case "center":
          style.alignSelf = "center";
          break;
        case "right":
          style.alignSelf = "end";
          break;
      }
    }
  },
  margin(node: XFAObject, style: XFAStyleData) {
    if (node.margin) {
      style.margin = (<Margin> node.margin)[$toStyle]().margin;
    }
  },
};

export function setMinMaxDimensions(node: Draw | Field, style: XFAStyleData) {
  const parent = node[$getSubformParent]()!;
  if (parent.layout === "position") {
    if (node.minW > 0) {
      style.minWidth = measureToString(node.minW);
    }
    if (node.maxW > 0) {
      style.maxWidth = measureToString(node.maxW);
    }
    if (node.minH > 0) {
      style.minHeight = measureToString(node.minH);
    }
    if (node.maxH > 0) {
      style.maxHeight = measureToString(node.maxH);
    }
  }
}

function layoutText(
  text: string | XhtmlObject,
  xfaFont: XFAFontBase | undefined,
  margin: XFAMargin | undefined,
  lineHeight: string | number | undefined,
  fontFinder: FontFinder | undefined,
  width: number,
) {
  const measure = new TextMeasure(xfaFont, margin, lineHeight, fontFinder);
  if (typeof text === "string") {
    measure.addString(text);
  } else {
    text[$pushGlyphs](measure);
  }

  return measure.compute(width);
}

export interface XFALayoutMode {
  w: number | undefined;
  h: number | undefined;
  isBroken: boolean;
}

export function layoutNode(
  node: Caption | Draw | Field,
  availableSpace: AvailableSpace,
): XFALayoutMode {
  let height: number | undefined;
  let width: number | undefined;
  let isBroken = false;

  if ((!node.w || !node.h) && node.value) {
    let marginH = 0;
    let marginV = 0;
    if (node.margin) {
      marginH = node.margin.leftInset + node.margin.rightInset;
      marginV = node.margin.topInset + node.margin.bottomInset;
    }

    let lineHeight: string | number | undefined;
    let margin: XFAMargin | undefined;
    if (node.para) {
      margin = <XFAMargin> Object.create(null);
      lineHeight = node.para.lineHeight === ""
        ? undefined
        : node.para.lineHeight;
      margin.top = node.para.spaceAbove === "" ? 0 : node.para.spaceAbove;
      margin.bottom = node.para.spaceBelow === "" ? 0 : node.para.spaceBelow;
      margin.left = node.para.marginLeft === "" ? 0 : node.para.marginLeft;
      margin.right = node.para.marginRight === "" ? 0 : node.para.marginRight;
    }

    let font = node.font;
    if (!font) {
      const root = node[$getTemplateRoot]();
      let parent = node[$getParent]();
      while (parent && parent !== root) {
        if ((<any> parent).font) {
          font = (<any> parent).font;
          break;
        }
        parent = parent![$getParent]();
      }
    }

    const maxWidth = (node.w || availableSpace.width) - marginH;
    const fontFinder = node[$globalData]!.fontFinder;
    if (
      node.value.exData &&
      node.value.exData[$content] &&
      node.value.exData.contentType === "text/html"
    ) {
      const res = layoutText(
        node.value.exData[$content],
        font,
        margin,
        lineHeight,
        fontFinder,
        maxWidth,
      );
      width = res.width;
      height = res.height;
      isBroken = res.isBroken;
    } else {
      const text = node.value[$text]();
      if (text) {
        const res = layoutText(
          text,
          font,
          margin,
          lineHeight,
          fontFinder,
          maxWidth,
        );
        width = res.width;
        height = res.height;
        isBroken = res.isBroken;
      }
    }

    if (width !== undefined && !node.w) {
      width += marginH;
    }

    if (height !== undefined && !node.h) {
      height += marginV;
    }
  }
  return { w: width, h: height, isBroken };
}

export function computeBbox(
  node: Draw | Field,
  html: XFAHTMLObj,
  availableSpace?: AvailableSpace,
) {
  let bbox: rect_t;
  if (node.w !== "" && node.h !== "") {
    bbox = [node.x, node.y, node.w, node.h];
  } else {
    if (!availableSpace) {
      return undefined;
    }
    let width = node.w;
    if (width === "") {
      if (node.maxW === 0) {
        const parent = <ExclGroup | Subform> node[$getSubformParent]();
        if (parent.layout === "position" && parent.w !== "") {
          width = 0;
        } else {
          width = node.minW;
        }
      } else {
        width = Math.min(node.maxW, availableSpace.width);
      }
      html.attributes!.style!.width = measureToString(width);
    }

    let height = node.h;
    if (height === "") {
      if (node.maxH === 0) {
        const parent = <ExclGroup | Subform> node[$getSubformParent]();
        if (parent.layout === "position" && parent.h !== "") {
          height = 0;
        } else {
          height = node.minH;
        }
      } else {
        height = Math.min(node.maxH, availableSpace.height);
      }
      html.attributes!.style!.height = measureToString(height);
    }

    bbox = [node.x, node.y, width, height];
  }
  return bbox;
}

export function fixDimensions(node: XFAObject) {
  const parent = node[$getSubformParent]()!;
  if (parent?.layout?.includes("row")) {
    const extra = <XFAExtra> parent[$extra];
    const colSpan = node.colSpan;
    let width;
    if (colSpan === -1) {
      width = extra.columnWidths!
        .slice(extra.currentColumn)
        .reduce((a, w) => a + w, 0);
    } else {
      width = extra.columnWidths!
        .slice(extra.currentColumn, extra.currentColumn! + colSpan!)
        .reduce((a, w) => a + w, 0);
    }
    if (!isNaN(width)) {
      node.w = width;
    }
  }

  if (parent.layout && parent.layout !== "position") {
    // Useless in this context.
    node.x = node.y = 0;
  }

  if (node.layout === "table") {
    if (node.w === "" && Array.isArray(node.columnWidths)) {
      node.w = node.columnWidths.reduce((a, x) => a + x, 0);
    }
  }
}

export function layoutClass(node: XFAObject) {
  switch (node.layout) {
    case "position":
      return "xfaPosition";
    case "lr-tb":
      return "xfaLrTb";
    case "rl-row":
      return "xfaRlRow";
    case "rl-tb":
      return "xfaRlTb";
    case "row":
      return "xfaRow";
    case "table":
      return "xfaTable";
    case "tb":
      return "xfaTb";
    default:
      return "xfaPosition";
  }
}

export function toStyle(node: XFAObject, ...names: string[]) {
  const style: XFAStyleData = Object.create(null);
  for (const name of names) {
    const value = (<any> node)[name];
    if (value === null || value === undefined) {
      continue;
    }
    if (Object.hasOwn(converters, name)) {
      converters[<ConverterName> name](node, style);
      continue;
    }

    if (value instanceof XFAObject) {
      const newStyle = value[$toStyle]();
      if (newStyle) {
        Object.assign(style, newStyle);
      } else {
        warn(`(DEBUG) - XFA - style for ${name} not implemented yet`);
      }
    }
  }
  return style;
}

export function createWrapper(
  node: Draw | ExclGroup | Field | Subform,
  html: XFAElObj,
) {
  const { attributes } = html;
  const { style } = attributes!;

  const wrapper = <XFAHTMLObj> {
    name: "div",
    attributes: {
      class: ["xfaWrapper"],
      style: Object.create(null),
    },
    children: [],
  };

  attributes!.class!.push("xfaWrapped");

  if (node.border) {
    const { widths, insets } = node.border[$extra]!;
    let width, height;
    let top = insets![0];
    let left = insets![3];
    const insetsH = insets![0] + insets![2];
    const insetsW = insets![1] + insets![3];
    switch (node.border!.hand) {
      case "even":
        top -= widths![0] / 2;
        left -= widths![3] / 2;
        width = `calc(100% + ${(widths![1] + widths![3]) / 2 - insetsW}px)`;
        height = `calc(100% + ${(widths![0] + widths![2]) / 2 - insetsH}px)`;
        break;
      case "left":
        top -= widths![0];
        left -= widths![3];
        width = `calc(100% + ${widths![1] + widths![3] - insetsW}px)`;
        height = `calc(100% + ${widths![0] + widths![2] - insetsH}px)`;
        break;
      case "right":
        width = insetsW ? `calc(100% - ${insetsW}px)` : "100%";
        height = insetsH ? `calc(100% - ${insetsH}px)` : "100%";
        break;
    }
    const classNames = ["xfaBorder"];
    if (isPrintOnly(node.border)) {
      classNames.push("xfaPrintOnly");
    }

    const border = <XFAHTMLObj> {
      name: "div",
      attributes: {
        class: classNames,
        style: {
          top: `${top}px`,
          left: `${left}px`,
          width,
          height,
        },
      },
      children: [],
    };

    for (
      const key of [
        "border",
        "borderWidth",
        "borderColor",
        "borderRadius",
        "borderStyle",
      ]
    ) {
      if (style![key] !== undefined) {
        border.attributes!.style![key] = style![key];
        delete (<any> style)[key];
      }
    }
    wrapper.children!.push(border, html);
  } else {
    wrapper.children!.push(html);
  }

  for (
    const key of [
      "background",
      "backgroundClip",
      "top",
      "left",
      "width",
      "height",
      "minWidth",
      "minHeight",
      "maxWidth",
      "maxHeight",
      "transform",
      "transformOrigin",
      "visibility",
    ]
  ) {
    if (style![key] !== undefined) {
      wrapper.attributes!.style![key] = style![key];
      delete (<any> style)[key];
    }
  }

  if (style!.position === "absolute") {
    wrapper.attributes!.style!.position = "absolute";
  } else {
    wrapper.attributes!.style!.position = "relative";
  }
  delete (<any> style).position;

  if (style!.alignSelf) {
    wrapper.attributes!.style!.alignSelf = style!.alignSelf;
    delete (<any> style).alignSelf;
  }

  return wrapper;
}

export function fixTextIndent(styles: XFAStyleData) {
  const indent = getMeasurement(styles.textIndent, "0px");
  if (indent >= 0) return;

  // If indent is negative then it's a hanging indent.
  const align = styles.textAlign === "right" ? "right" : "left";
  const name = "padding" + (align === "left" ? "Left" : "Right");
  const padding = getMeasurement(styles[name], "0px");
  styles[name] = `${padding - indent}px`;
}

export function setAccess(
  node: ExclGroup | Field | Subform,
  classNames: string[],
) {
  switch (node.access) {
    case "nonInteractive":
      classNames.push("xfaNonInteractive");
      break;
    case "readOnly":
      classNames.push("xfaReadOnly");
      break;
    case "protected":
      classNames.push("xfaDisabled");
      break;
  }
}

export function isPrintOnly(
  node: Area | Border | ContentArea | Draw | ExclGroup | Field,
) {
  return (
    node.relevant.length > 0 &&
    !node.relevant[0].excluded &&
    node.relevant[0].viewname === "print"
  );
}

function getCurrentPara(node: XFAObject) {
  const stack = node[$getTemplateRoot]()![$extra].paraStack!;
  return stack.length ? stack.at(-1) : undefined;
}

export function setPara(
  node: Caption | Draw,
  nodeStyle: XFAStyleData | undefined,
  value: XFAElObj,
) {
  if (value.attributes?.class?.includes("xfaRich")) {
    if (nodeStyle) {
      if (node.h === "") {
        nodeStyle.height = "auto";
      }
      if (node.w === "") {
        nodeStyle.width = "auto";
      }
    }

    const para = getCurrentPara(node);
    if (para) {
      // By definition exData are external data so para
      // has no effect on it.
      const valueStyle = value.attributes.style!;
      valueStyle.display = "flex";
      valueStyle.flexDirection = "column";
      switch (para.vAlign) {
        case "top":
          valueStyle.justifyContent = "start";
          break;
        case "bottom":
          valueStyle.justifyContent = "end";
          break;
        case "middle":
          valueStyle.justifyContent = "center";
          break;
      }

      const paraStyle = para[$toStyle]();
      for (const [key, val] of Object.entries(paraStyle)) {
        if (!(key in valueStyle)) {
          valueStyle[key] = val;
        }
      }
    }
  }
}

export function setFontFamily(
  xfaFont: XFAFontBase,
  node: XFAObject,
  fontFinder: FontFinder,
  style: XFAStyleData,
) {
  if (!fontFinder) {
    // The font cannot be found in the pdf so use the default one.
    delete style.fontFamily;
    return;
  }

  const name = stripQuotes(xfaFont.typeface!);
  style.fontFamily = `"${name}"`;

  const typeface = fontFinder.find(name);
  if (typeface) {
    const { fontFamily } = typeface.regular!.cssFontInfo!;
    if (fontFamily !== name) {
      style.fontFamily = `"${fontFamily}"`;
    }

    const para = getCurrentPara(node);
    if (para && para.lineHeight !== "") return;

    if (style.lineHeight) {
      // Already something so don't overwrite.
      return;
    }

    const pdfFont = selectFont(xfaFont, typeface);
    if (pdfFont) {
      style.lineHeight = <any> Math.max(1.2, pdfFont.lineHeight!);
    }
  }
}

export function fixURL(str: string) {
  const absoluteUrl = createValidAbsoluteUrl(str, /* baseUrl = */ undefined, {
    addDefaultProtocol: true,
    tryConvertEncoding: true,
  });
  return absoluteUrl ? absoluteUrl.href : undefined;
}
/*80--------------------------------------------------------------------------*/
