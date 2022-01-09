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
  $acceptWhitespace,
  $addHTML,
  $appendChild,
  $childrenToHTML,
  $clean,
  $cleanPage,
  $content,
  $data,
  $extra,
  $finalize,
  $flushHTML,
  $getAvailableSpace,
  $getChildren,
  $getContainedChildren,
  $getExtra,
  $getNextPage,
  $getParent,
  $getSubformParent,
  $getTemplateRoot,
  $globalData,
  $hasSettableValue,
  $ids,
  $isBindable,
  $isCDATAXml,
  $isSplittable,
  $isThereMoreWidth,
  $isTransparent,
  $isUsable,
  $namespaceId,
  $nodeName,
  $onChild,
  $onText,
  $popPara,
  $pushPara,
  $removeChild,
  $searchNode,
  $setSetAttributes,
  $setValue,
  $tabIndex,
  $text,
  $toHTML,
  $toPages,
  $toStyle,
  $uid,
  ContentObject,
  Option01,
  OptionObject,
  StringObject,
  XFAObject,
  XFAObjectArray,
  XmlObject,
} from "./xfa_object.js";
import { $buildXFAObject, NamespaceIds } from "./namespaces.js";
import {
  addHTML,
  checkDimensions,
  flushHTML,
  getAvailableSpace,
} from "./layout.js";
import {
  computeBbox,
  createWrapper,
  fixDimensions,
  fixTextIndent,
  fixURL,
  isPrintOnly,
  layoutClass,
  layoutNode,
  measureToString,
  setAccess,
  setFontFamily,
  setMinMaxDimensions,
  setPara,
  toStyle,
  type XFALayoutMode,
} from "./html_utils.js";
import {
  type AvailableSpace,
  type XFAHTMLAttrs,
  type XFASVGAttrs,
  type XFAAttrs,
  type XFAFontBase,
  type XFAElData,
  type XFAHTMLObj,
  type XFAStyleData,
  type XFAValue,
  type XFASVGObj,
  type XFAIds,
  type XFAElObjBase,
  type XFAElObj,
  type XFAExtra,
} from "./alias.js";
import {
  getBBox,
  getColor,
  getFloat,
  getInteger,
  getKeyword,
  getMeasurement,
  getRatio,
  getRelevant,
  getStringOption,
  type XFAColor,
  HTMLResult,
} from "./utils.js";
import { type rect_t, stringToBytes, Util, warn } from "../../shared/util.js";
import { getMetrics } from "./fonts.js";
import { searchNode } from "./som.js";
import { Builder } from "./builder.js";
import { XhtmlObject } from "./xhtml.js";
import { recoverJsURL } from "../core_utils.js";
/*81---------------------------------------------------------------------------*/

const TEMPLATE_NS_ID = NamespaceIds.template.id;
const SVG_NS = "http://www.w3.org/2000/svg";

// In case of lr-tb (and rl-tb) layouts, we try:
//  - to put the container at the end of a line
//  - and if it fails we try on the next line.
// If both tries failed then it's up to the parent
// to handle the situation.
const MAX_ATTEMPTS_FOR_LRTB_LAYOUT = 2;

// It's possible to have a bug in the layout and so as
// a consequence we could loop for ever in Template::toHTML()
// so in order to avoid that (and avoid a OOM crash) we break
// the loop after having MAX_EMPTY_PAGES empty pages.
const MAX_EMPTY_PAGES = 3;

// Default value to start with for the tabIndex property.
const DEFAULT_TAB_INDEX = 5000;

const HEADING_PATTERN = /^H(\d+)$/;

// Allowed mime types for images
const MIMES = new Set([
  "image/gif",
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/apng",
  "image/x-png",
  "image/bmp",
  "image/x-ms-bmp",
  "image/tiff",
  "image/tif",
  "application/octet-stream",
]);

const IMAGES_HEADERS:[number[], string][] = [
  [[0x42, 0x4d], "image/bmp"],
  [[0xff, 0xd8, 0xff], "image/jpeg"],
  [[0x49, 0x49, 0x2a, 0x00], "image/tiff"],
  [[0x4d, 0x4d, 0x00, 0x2a], "image/tiff"],
  [[0x47, 0x49, 0x46, 0x38, 0x39, 0x61], "image/gif"],
  [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], "image/png"],
];

interface BorderDims
{
  w:number;
  h:number;
}

function getBorderDims( node?:XFAObject ):BorderDims
{
  if (!node || !node.border) 
  {
    return { w: 0, h: 0 };
  }

  const borderExtra = (<Border>node.border)[$getExtra]();
  if (!borderExtra) 
  {
    return { w: 0, h: 0 };
  }

  return {
    w:
      borderExtra.widths![0] +
      borderExtra.widths![2] +
      borderExtra.insets![0] +
      borderExtra.insets![2],
    h:
      borderExtra.widths![1] +
      borderExtra.widths![3] +
      borderExtra.insets![1] +
      borderExtra.insets![3],
  };
}

function hasMargin( node:XFAObject )
{
  return (
    node.margin &&
    ((<Margin>node.margin).topInset ||
      (<Margin>node.margin).rightInset ||
      (<Margin>node.margin).bottomInset ||
      (<Margin>node.margin).leftInset)
  );
}

function _setValue( templateNode:Caption | Draw | Field, value:XFAValue )
{
  if( !templateNode.value )
  {
    const nodeValue = new Value({});
    templateNode[$appendChild](nodeValue);
    templateNode.value = nodeValue;
  }
  templateNode.value[$setValue]( value );
}

function* getContainedChildren( node:Area | Subform | SubformSet ):Generator<XFAObject>
{
  for( const child of node[$getChildren]()) 
  {
    if( child instanceof SubformSet ) 
    {
      yield* child[$getContainedChildren]();
      continue;
    }
    yield child;
  }
}

function setTabIndex( node:XFAObject )
{
  while( node ) 
  {
    if (!node.traversal) 
    {
      node[$tabIndex] = node[$getParent]()![$tabIndex];
      return;
    }

    if( node[$tabIndex] ) return;

    let next:XFAObject | undefined;
    for( const child of (<Traversal>node.traversal)[$getChildren]() ) 
    {
      if (child.operation === "next") 
      {
        next = child;
        break;
      }
    }

    if( !next || !next.ref ) 
    {
      node[$tabIndex] = node[$getParent]()![$tabIndex];
      return;
    }

    const root = node[$getTemplateRoot]()!;
    node[$tabIndex] = ++root[$tabIndex]!;

    const ref = root[$searchNode]( <string>next.ref, node );
    if (!ref) return;

    node = ref[0];
  }
}

function applyAssist( obj:Draw | ExclGroup | Field | Subform, attributes:XFAHTMLAttrs ) 
{
  const assist = obj.assist;
  if (assist) 
  {
    const assistTitle = assist[$toHTML]();
    if (assistTitle) 
    {
      attributes.title = assistTitle;
    }
    const role = assist.role;
    const match = role.match(HEADING_PATTERN);
    if (match) 
    {
      const ariaRole = "heading";
      const ariaLevel = match[1];
      attributes.role = ariaRole;
      attributes["aria-level"] = ariaLevel;
    }
  }
  // XXX: We could end up in a situation where the obj has a heading role and
  // is also a table. For now prioritize the table role.
  if (obj.layout === "table") 
  {
    attributes.role = "table";
  } 
  else if (obj.layout === "row") 
  {
    attributes.role = "row";
  } 
  else {
    const parent = obj[$getParent]()!;
    if( parent.layout === "row" ) 
    {
      if( parent.assist && (<Assist>parent.assist).role === "TH" ) 
      {
        attributes.role = "columnheader";
      } 
      else {
        attributes.role = "cell";
      }
    }
  }
}

function ariaLabel( obj:Field )
{
  if( !obj.assist ) return undefined;

  const assist = obj.assist;
  if (assist.speak && assist.speak[$content] !== "") 
  {
    return <string | undefined>assist.speak[$content];
  }
  if (assist.toolTip) 
  {
    return <string | undefined>assist.toolTip[$content];
  }
  // TODO: support finding the related caption element. See xfa_bug1718037.pdf
  // for an example.
  return undefined;
}

function valueToHtml( value:string )
{
  return HTMLResult.success({
    name: "div",
    attributes: {
      class: ["xfaRich"],
      style: Object.create(null),
    },
    children: [
      {
        name: "span",
        attributes: {
          style: Object.create(null),
        },
        value,
      },
    ],
  });
}

function setFirstUnsplittable( node:Draw | ExclGroup | Field | Subform )
{
  const root = node[$getTemplateRoot]()!;
  if( root[$extra].firstUnsplittable === undefined ) 
  {
    root[$extra].firstUnsplittable = node;
    root[$extra].noLayoutFailure = true;
  }
}

function unsetFirstUnsplittable( node:Draw | ExclGroup | Field | Subform )
{
  const root = node[$getTemplateRoot]()!;
  if( root[$extra].firstUnsplittable === node ) 
  {
    root[$extra].noLayoutFailure = false;
  }
}

function handleBreak( node:BreakAfter | BreakBefore )
{
  if( node[$extra] ) return false;

  node[$extra] = Object.create(null);

  if( node.targetType === "auto" ) return false;

  const root = node[$getTemplateRoot]()!;
  let target:XFAObject | undefined;
  if( node.target ) 
  {
    const target_a = root[$searchNode]( node.target, node[$getParent]() );
    if( !target_a ) return false;

    target = target_a[0];
  }

  const { currentPageArea, currentContentArea } = root[$extra];

  if (node.targetType === "pageArea") 
  {
    if( !(target instanceof PageArea) ) 
    {
      target = undefined;
    }

    if( node.startNew ) 
    {
      (<XFAExtra>node[$extra]).target = target || currentPageArea;
      return true;
    } 
    else if( target && target !== currentPageArea )
    {
      (<XFAExtra>node[$extra]).target = target;
      return true;
    }

    return false;
  }

  if( !(target instanceof ContentArea) ) 
  {
    target = undefined;
  }

  const pageArea = <PageArea | undefined>target?.[$getParent]();

  let index;
  let nextPageArea = pageArea;
  if (node.startNew) 
  {
    // startNew === 1 so we must create a new container (pageArea or
    // contentArea).
    if (target) 
    {
      const contentAreas = pageArea!.contentArea.children;
      const indexForCurrent = contentAreas.indexOf( currentContentArea! );
      const indexForTarget = contentAreas.indexOf(target);
      if (indexForCurrent !== -1 && indexForCurrent < indexForTarget) 
      {
        // The next container is after the current container so
        // we can stay on the same page.
        nextPageArea = undefined;
      }
      index = indexForTarget - 1;
    } 
    else {
      index = currentPageArea!.contentArea.children.indexOf( currentContentArea! );
    }
  } 
  else if( target && target !== currentContentArea )
  {
    const contentAreas = pageArea!.contentArea.children;
    index = contentAreas.indexOf(target) - 1;
    nextPageArea = pageArea === currentPageArea ? undefined : pageArea;
  } 
  else {
    return false;
  }

  (<XFAExtra>node[$extra]).target = nextPageArea;
  (<XFAExtra>node[$extra]).index = index;
  return true;
}

function handleOverflow( node:Subform, extraNode:XFAObject, space?:AvailableSpace )
{
  const root = node[$getTemplateRoot]()!;
  const saved = root[$extra].noLayoutFailure;
  const savedMethod = extraNode[$getSubformParent];

  // Replace $getSubformParent to emulate that extraNode is just
  // under node.
  extraNode[$getSubformParent] = () => node;

  root[$extra].noLayoutFailure = true;
  const res = <HTMLResult>extraNode[$toHTML](space);
  node[$addHTML]( res.html!, res.bbox! );
  root[$extra].noLayoutFailure = saved;
  extraNode[$getSubformParent] = savedMethod;
}

class AppearanceFilter extends StringObject
{
  type;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "appearanceFilter" );
    this.id = attributes.id || "";
    this.type = getStringOption(attributes.type, ["optional", "required"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

class Arc extends XFAObject
{
  circular;
  hand;
  startAngle;
  sweepAngle;
  edge?:Edge;
  fill?:Fill;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "arc", /* hasChildren = */ true );
    this.circular = getInteger({
      data: attributes.circular,
      defaultValue: 0,
      validate: x => x === 1,
    });
    this.hand = getStringOption(attributes.hand, ["even", "left", "right"]);
    this.id = attributes.id || "";
    this.startAngle = getFloat({
      data: attributes.startAngle,
      defaultValue: 0,
      validate: x => true,
    });
    this.sweepAngle = getFloat({
      data: attributes.sweepAngle,
      defaultValue: 360,
      validate: x => true,
    });
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  override [$toHTML]()
  {
    const edge = this.edge ? this.edge : new Edge({});
    const edgeStyle = edge[$toStyle]();
    const style = Object.create(null);
    if (this.fill && this.fill.presence === "visible") {
      Object.assign(style, this.fill[$toStyle]());
    } 
    else {
      style.fill = "transparent";
    }
    style.strokeWidth = measureToString(
      edge.presence === "visible" ? edge.thickness : 0
    );
    style.stroke = edgeStyle.color;
    let arc:XFAHTMLObj;
    const attributes:XFASVGAttrs = {
      xmlns: SVG_NS,
      style: {
        width: "100%",
        height: "100%",
        overflow: "visible",
      },
    };

    if (this.sweepAngle === 360) 
    {
      arc = {
        name: "ellipse",
        attributes: <XFASVGAttrs>{
          xmlns: SVG_NS,
          cx: "50%",
          cy: "50%",
          rx: "50%",
          ry: "50%",
          style,
        },
      };
    } 
    else {
      const startAngle = (this.startAngle * Math.PI) / 180;
      const sweepAngle = (this.sweepAngle * Math.PI) / 180;
      const largeArc = this.sweepAngle > 180 ? 1 : 0;
      const [x1, y1, x2, y2] = [
        50 * (1 + Math.cos(startAngle)),
        50 * (1 - Math.sin(startAngle)),
        50 * (1 + Math.cos(startAngle + sweepAngle)),
        50 * (1 - Math.sin(startAngle + sweepAngle)),
      ];

      arc = {
        name: "path",
        attributes: <XFASVGAttrs>{
          xmlns: SVG_NS,
          d: `M ${x1} ${y1} A 50 50 0 ${largeArc} 0 ${x2} ${y2}`,
          vectorEffect: "non-scaling-stroke",
          style,
        },
      };

      Object.assign(attributes, {
        viewBox: "0 0 100 100",
        preserveAspectRatio: "none",
      });
    }

    const svg:XFASVGObj = {
      name: "svg",
      children: [arc],
      attributes,
    };

    const parent = this[$getParent]()![$getParent]()!;
    if( hasMargin(parent) )
    {
      return HTMLResult.success({
        name: "div",
        attributes: {
          style: {
            display: "inline",
            width: "100%",
            height: "100%",
          },
        },
        children: [svg],
      });
    }

    svg.attributes!.style!.position = "absolute";
    return HTMLResult.success(svg);
  }
}

export class Area extends XFAObject
{
  override colSpan;
  relevant;
  override x;
  override y;
  desc:unknown;
  extras:unknown;
  area = new XFAObjectArray();
  draw = new XFAObjectArray();
  exObject = new XFAObjectArray();
  exclGroup = new XFAObjectArray();
  field = new XFAObjectArray();
  subform = new XFAObjectArray();
  subformSet = new XFAObjectArray();

  override [$extra]:XFAExtra;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "area", /* hasChildren = */ true );
    this.colSpan = getInteger({
      data: attributes.colSpan,
      defaultValue: 1,
      validate: n => n >= 1 || n === -1,
    });
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.relevant = getRelevant(attributes.relevant);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.x = getMeasurement(attributes.x, "0pt");
    this.y = getMeasurement(attributes.y, "0pt");
  }

  override *[$getContainedChildren]() 
  {
    // This function is overriden in order to fake that subforms under
    // this set are in fact under parent subform.
    yield* getContainedChildren(this);
  }

  override [$isTransparent]() { return true; }

  override [$isBindable]() { return true; }

  override [$addHTML]( html:XFAElData, bbox:rect_t )
  {
    const [x, y, w, h] = bbox;
    this[$extra].width = Math.max( this[$extra].width!, x + w );
    this[$extra].height = Math.max( this[$extra].height!, y + h );

    this[$extra].children!.push(html);
  }

  override [$getAvailableSpace]()
  {
    return this[$extra].availableSpace;
  }

  override [$toHTML]( availableSpace?:AvailableSpace )
  {
    // TODO: incomplete.
    const style = toStyle(this, "position");
    const attributes:XFAHTMLAttrs = {
      style,
      id: this[$uid],
      class: ["xfaArea"],
    };

    if( isPrintOnly(this) )
    {
      attributes.class!.push("xfaPrintOnly");
    }

    if( this.name )
    {
      attributes.xfaName = this.name;
    }

    const children:XFAElData[] = [];
    this[$extra] = {
      children,
      width: 0,
      height: 0,
      availableSpace,
    };

    const result = this[$childrenToHTML]({
      filter: new Set([
        "area",
        "draw",
        "field",
        "exclGroup",
        "subform",
        "subformSet",
      ]),
      include: true,
    });

    if( !result.success )
    {
      if( result.isBreak() )
      {
        return result;
      }
      // Nothing to propose for the element which doesn't fit the
      // available space.
      delete (<any>this)[$extra];
      return HTMLResult.FAILURE;
    }

    style.width = measureToString( this[$extra].width! );
    style.height = measureToString( this[$extra].height! );

    const html = {
      name: "div",
      attributes,
      children,
    };

    const bbox:rect_t = [this.x, this.y, this[$extra].width!, this[$extra].height!];
    delete (<any>this)[$extra];

    return HTMLResult.success(html, bbox);
  }
}

class Assist extends XFAObject
{
  role;
  speak:Speak | undefined = undefined;
  toolTip:ToolTip | undefined = undefined;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "assist", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.role = attributes.role || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  override [$toHTML]()
  {
    return this.toolTip?.[$content];
  }
}

class Barcode extends XFAObject
{
  charEncoding;
  checksum;
  dataColumnCount;
  dataLength;
  dataPrep;
  dataRowCount;
  endChar;
  errorCorrectionLevel;
  moduleHeight;
  moduleWidth;
  printCheckDigit;
  rowColumnRatio;
  startChar;
  textLocation;
  truncate;
  type;
  upsMode;
  wideNarrowRatio;
  encrypt:unknown;
  extras:unknown;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "barcode", /* hasChildren = */ true );
    this.charEncoding = getKeyword({
      data: attributes.charEncoding
        ? attributes.charEncoding.toLowerCase()
        : "",
      defaultValue: "",
      validate: k =>
        [
          "utf-8",
          "big-five",
          "fontspecific",
          "gbk",
          "gb-18030",
          "gb-2312",
          "ksc-5601",
          "none",
          "shift-jis",
          "ucs-2",
          "utf-16",
        ].includes(k) || !!k.match(/iso-8859-\d{2}/),
    });
    this.checksum = getStringOption(attributes.checksum, [
      "none",
      "1mod10",
      "1mod10_1mod11",
      "2mod10",
      "auto",
    ]);
    this.dataColumnCount = getInteger({
      data: attributes.dataColumnCount,
      defaultValue: -1,
      validate: x => x >= 0,
    });
    this.dataLength = getInteger({
      data: attributes.dataLength,
      defaultValue: -1,
      validate: x => x >= 0,
    });
    this.dataPrep = getStringOption(attributes.dataPrep, [
      "none",
      "flateCompress",
    ]);
    this.dataRowCount = getInteger({
      data: attributes.dataRowCount,
      defaultValue: -1,
      validate: x => x >= 0,
    });
    this.endChar = attributes.endChar || "";
    this.errorCorrectionLevel = getInteger({
      data: attributes.errorCorrectionLevel,
      defaultValue: -1,
      validate: x => x >= 0 && x <= 8,
    });
    this.id = attributes.id || "";
    this.moduleHeight = getMeasurement(attributes.moduleHeight, "5mm");
    this.moduleWidth = getMeasurement(attributes.moduleWidth, "0.25mm");
    this.printCheckDigit = getInteger({
      data: attributes.printCheckDigit,
      defaultValue: 0,
      validate: x => x === 1,
    });
    this.rowColumnRatio = getRatio(attributes.rowColumnRatio);
    this.startChar = attributes.startChar || "";
    this.textLocation = getStringOption(attributes.textLocation, [
      "below",
      "above",
      "aboveEmbedded",
      "belowEmbedded",
      "none",
    ]);
    this.truncate = getInteger({
      data: attributes.truncate,
      defaultValue: 0,
      validate: x => x === 1,
    });
    this.type = getStringOption(
      attributes.type ? attributes.type.toLowerCase() : "",
      [
        "aztec",
        "codabar",
        "code2of5industrial",
        "code2of5interleaved",
        "code2of5matrix",
        "code2of5standard",
        "code3of9",
        "code3of9extended",
        "code11",
        "code49",
        "code93",
        "code128",
        "code128a",
        "code128b",
        "code128c",
        "code128sscc",
        "datamatrix",
        "ean8",
        "ean8add2",
        "ean8add5",
        "ean13",
        "ean13add2",
        "ean13add5",
        "ean13pwcd",
        "fim",
        "logmars",
        "maxicode",
        "msi",
        "pdf417",
        "pdf417macro",
        "plessey",
        "postauscust2",
        "postauscust3",
        "postausreplypaid",
        "postausstandard",
        "postukrm4scc",
        "postusdpbc",
        "postusimb",
        "postusstandard",
        "postus5zip",
        "qrcode",
        "rfid",
        "rss14",
        "rss14expanded",
        "rss14limited",
        "rss14stacked",
        "rss14stackedomni",
        "rss14truncated",
        "telepen",
        "ucc128",
        "ucc128random",
        "ucc128sscc",
        "upca",
        "upcaadd2",
        "upcaadd5",
        "upcapwcd",
        "upce",
        "upceadd2",
        "upceadd5",
        "upcean2",
        "upcean5",
        "upsmaxicode",
      ]
    );
    this.upsMode = getStringOption(attributes.upsMode, [
      "usCarrier",
      "internationalCarrier",
      "secureSymbol",
      "standardSymbol",
    ]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.wideNarrowRatio = getRatio(attributes.wideNarrowRatio);
  }
}

class Bind extends XFAObject
{
  match;
  override ref;
  picture?:Picture;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "bind", /* hasChildren = */ true );
    this.match = getStringOption(attributes.match, [
      "once",
      "dataRef",
      "global",
      "none",
    ]);
    this.ref = attributes.ref || "";
  }
}

export class BindItems extends XFAObject
{
  connection;
  labelRef;
  override ref;
  valueRef;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "bindItems" );
    this.connection = attributes.connection || "";
    this.labelRef = attributes.labelRef || "";
    this.ref = attributes.ref || "";
    this.valueRef = attributes.valueRef || "";
  }
}

class Bookend extends XFAObject
{
  leader;
  trailer;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "bookend" );
    this.id = attributes.id || "";
    this.leader = attributes.leader || "";
    this.trailer = attributes.trailer || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

class BooleanElement extends Option01
{
  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "boolean" );
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  override [$toHTML]( availableSpace?:AvailableSpace )
  {
    return valueToHtml(this[$content] === 1 ? "1" : "0");
  }
}

export interface BorderExtra
{
  widths:number[];
  insets:rect_t;
  edges:Edge[];
}

export class Border extends XFAObject
{
  break;
  hand;
  override presence;
  relevant;
  corner = new XFAObjectArray(4);
  edge = new XFAObjectArray(4);
  extras:unknown; //?:Extras;
  fill?:Fill;
  override margin:Margin | undefined = undefined;

  override [$extra]:BorderExtra | undefined;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "border", /* hasChildren = */ true );
    this.break = getStringOption(attributes.break, ["close", "open"]);
    this.hand = getStringOption(attributes.hand, ["even", "left", "right"]);
    this.id = attributes.id || "";
    this.presence = getStringOption(attributes.presence, [
      "visible",
      "hidden",
      "inactive",
      "invisible",
    ]);
    this.relevant = getRelevant(attributes.relevant);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  [$getExtra]():BorderExtra
  {
    if( !this[$extra] )
    {
      const edges = <Edge[]>this.edge.children.slice();
      if (edges.length < 4) 
      {
        const defaultEdge = edges[edges.length - 1] || new Edge({});
        for (let i = edges.length; i < 4; i++) 
        {
          edges.push(defaultEdge);
        }
      }

      const widths = edges.map( edge => edge.thickness );
      const insets:rect_t = [0, 0, 0, 0];
      if (this.margin) 
      {
        insets[0] = this.margin.topInset;
        insets[1] = this.margin.rightInset;
        insets[2] = this.margin.bottomInset;
        insets[3] = this.margin.leftInset;
      }
      this[$extra] = { widths, insets, edges };
    }
    return this[$extra]!;
  }

  override [$toStyle]()
  {
    // TODO: incomplete (hand).
    const { edges } = this[$getExtra]();
    const edgeStyles = edges!.map(node => {
      const style = node[$toStyle]();
      style.color = style.color || "#000000";
      return style;
    });

    const style:XFAStyleData = Object.create(null);
    if( this.margin )
    {
      Object.assign( style, this.margin[$toStyle]() );
    }

    if( this.fill?.presence === "visible" )
    {
      Object.assign( style, this.fill[$toStyle]() );
    }

    if( this.corner.children.some(node => (<Corner>node).radius !== 0) ) 
    {
      const cornerStyles = this.corner.children.map(node => node[$toStyle]());
      if( cornerStyles.length === 2 || cornerStyles.length === 3 )
      {
        const last = cornerStyles[cornerStyles.length - 1];
        for( let i = cornerStyles.length; i < 4; i++ )
        {
          cornerStyles.push(last);
        }
      }

      style.borderRadius = cornerStyles.map(s => (<XFAStyleData>s).radius).join(" ");
    }

    switch( this.presence )
    {
      case "invisible":
      case "hidden":
        style.borderStyle = "";
        break;
      case "inactive":
        style.borderStyle = "none";
        break;
      default:
        style.borderStyle = edgeStyles.map(s => s.style).join(" ");
        break;
    }

    style.borderWidth = edgeStyles.map(s => s.width).join(" ");
    style.borderColor = edgeStyles.map(s => s.color).join(" ");

    return style;
  }
}

class Break extends XFAObject
{
  after;
  afterTarget;
  before;
  beforeTarget;
  bookendLeader;
  bookendTrailer;
  overflowLeader;
  overflowTarget;
  overflowTrailer;
  startNew;
  extras:unknown;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "break", /* hasChildren = */ true );
    this.after = getStringOption(attributes.after, [
      "auto",
      "contentArea",
      "pageArea",
      "pageEven",
      "pageOdd",
    ]);
    this.afterTarget = attributes.afterTarget || "";
    this.before = getStringOption(attributes.before, [
      "auto",
      "contentArea",
      "pageArea",
      "pageEven",
      "pageOdd",
    ]);
    this.beforeTarget = attributes.beforeTarget || "";
    this.bookendLeader = attributes.bookendLeader || "";
    this.bookendTrailer = attributes.bookendTrailer || "";
    this.id = attributes.id || "";
    this.overflowLeader = attributes.overflowLeader || "";
    this.overflowTarget = attributes.overflowTarget || "";
    this.overflowTrailer = attributes.overflowTrailer || "";
    this.startNew = getInteger({
      data: attributes.startNew,
      defaultValue: 0,
      validate: x => x === 1,
    });
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

export class BreakAfter extends XFAObject
{
  leader;
  startNew;
  target;
  targetType;
  trailer;
  script:unknown; //?:Script

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "breakAfter", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.leader = attributes.leader || "";
    this.startNew = getInteger({
      data: attributes.startNew,
      defaultValue: 0,
      validate: x => x === 1,
    });
    this.target = attributes.target || "";
    this.targetType = getStringOption(attributes.targetType, [
      "auto",
      "contentArea",
      "pageArea",
    ]);
    this.trailer = attributes.trailer || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

export class BreakBefore extends XFAObject
{
  leader;
  startNew;
  target;
  targetType;
  trailer;
  script:unknown; //?:Script

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "breakBefore", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.leader = attributes.leader || "";
    this.startNew = getInteger({
      data: attributes.startNew,
      defaultValue: 0,
      validate: x => x === 1,
    });
    this.target = attributes.target || "";
    this.targetType = getStringOption(attributes.targetType, [
      "auto",
      "contentArea",
      "pageArea",
    ]);
    this.trailer = attributes.trailer || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  override [$toHTML]( availableSpace?:AvailableSpace )
  {
    this[$extra] = {};
    return HTMLResult.FAILURE;
  }
}

class Button extends XFAObject
{
  highlight;
  extras:unknown; //?:Extras;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "button", /* hasChildren = */ true );
    this.highlight = getStringOption(attributes.highlight, [
      "inverted",
      "none",
      "outline",
      "push",
    ]);
    this.id = attributes.id || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  override [$toHTML]( availableSpace?:AvailableSpace )
  {
    // TODO: highlight.

    const parent = this[$getParent]()!;
    const grandpa = <ExclGroup | Field | Subform>parent[$getParent]();
    const htmlButton = {
      name: "button",
      attributes: {
        id: this[$uid],
        class: ["xfaButton"],
        style: {},
      },
      children: <XFAElObj[]>[],
    };

    for( const event of grandpa.event.children )
    {
      // if (true) break;
      if( (<Event>event).activity !== "click" || !(<Event>event).script ) continue;

      const jsURL = recoverJsURL( <string>(<Event>event).script![$content] );
      if( !jsURL ) continue;

      const href = fixURL( jsURL.url );
      if( !href ) continue;

      // we've an url so generate a <a>
      htmlButton.children.push({
        name: "a",
        attributes: {
          id: "link" + this[$uid],
          href,
          newWindow: jsURL.newWindow,
          class: ["xfaLink"],
          style: {},
        },
        children: [],
      });
    }

    return HTMLResult.success(htmlButton);
  }
}

class Calculate extends XFAObject
{
  override;
  extras:unknown; //?:Extras;
  message:unknown; //?:Message;
  script:unknown; //?:Script

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "calculate", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.override = getStringOption(attributes.override, [
      "disabled",
      "error",
      "ignore",
      "warning",
    ]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

export class Caption extends XFAObject
{
  placement;
  override presence;
  reserve;
  extras:unknown; //?:Extras;
  font?:Font;
  override margin:Margin | undefined = undefined;
  override para:Para | undefined = undefined
  value?:Value;

  override [$extra]:XFALayoutMode | undefined;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "caption", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.placement = getStringOption(attributes.placement, [
      "left",
      "bottom",
      "inline",
      "right",
      "top",
    ]);
    this.presence = getStringOption(attributes.presence, [
      "visible",
      "hidden",
      "inactive",
      "invisible",
    ]);
    this.reserve = Math.ceil(getMeasurement(attributes.reserve));
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  override [$setValue]( value:XFAValue )
  {
    _setValue( this, value );
  }

  [$getExtra]( availableSpace?:AvailableSpace ):XFALayoutMode
  {
    if( !this[$extra] )
    {
      let { width, height } = availableSpace!;
      switch (this.placement) 
      {
        case "left":
        case "right":
        case "inline":
          width = this.reserve <= 0 ? width : this.reserve;
          break;
        case "top":
        case "bottom":
          height = this.reserve <= 0 ? height : this.reserve;
          break;
      }

      this[$extra] = layoutNode( this, { width, height } );
    }
    return this[$extra]!;
  }

  override [$toHTML]( availableSpace?:AvailableSpace )
  {
    // TODO: incomplete.
    if( !this.value ) return HTMLResult.EMPTY;

    this[$pushPara]();
    const value = (<HTMLResult>this.value[$toHTML]( availableSpace )).html;

    if( !value ) 
    {
      this[$popPara]();
      return HTMLResult.EMPTY;
    }

    const savedReserve = this.reserve;
    if( this.reserve <= 0 )
    {
      const { w, h } = this[$getExtra]( availableSpace );
      switch (this.placement) {
        case "left":
        case "right":
        case "inline":
          this.reserve = w!;
          break;
        case "top":
        case "bottom":
          this.reserve = h!;
          break;
      }
    }

    const children:XFAElData[] = [];
    if( typeof value === "string" )
    {
      children.push({
        name: "#text",
        value,
      });
    } 
    else {
      children.push(value);
    }

    const style = toStyle( this, "font", "margin", "visibility" );
    switch( this.placement )
    {
      case "left":
      case "right":
        if (this.reserve > 0) {
          style.width = measureToString(this.reserve);
        }
        break;
      case "top":
      case "bottom":
        if (this.reserve > 0) {
          style.height = measureToString(this.reserve);
        }
        break;
    }

    setPara( this, undefined, <XFAElObj>value );
    this[$popPara]();

    this.reserve = savedReserve;

    return HTMLResult.success({
      name: "div",
      attributes: {
        style,
        class: ["xfaCaption"],
      },
      children,
    });
  }
}

class Certificate extends StringObject
{
  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "certificate" );
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

class Certificates extends XFAObject
{
  credentialServerPolicy;
  url;
  urlPolicy;
  encryption:unknown;
  issuers:unknown;
  keyUsage:unknown;
  oids:unknown;
  signing:unknown;
  subjectDNs:unknown;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "certificates", /* hasChildren = */ true );
    this.credentialServerPolicy = getStringOption(
      attributes.credentialServerPolicy,
      ["optional", "required"]
    );
    this.id = attributes.id || "";
    this.url = attributes.url || "";
    this.urlPolicy = attributes.urlPolicy || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

class CheckButton extends XFAObject 
{
  mark;
  shape;
  size;
  override border:unknown | undefined = undefined; //?:Border;
  extras:unknown; //?:Extras;
  override margin:Margin | undefined = undefined;

  constructor( attributes:XFAAttrs ) 
  {
    super( TEMPLATE_NS_ID, "checkButton", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.mark = getStringOption(attributes.mark, [
      "default",
      "check",
      "circle",
      "cross",
      "diamond",
      "square",
      "star",
    ]);
    this.shape = getStringOption(attributes.shape, ["square", "round"]);
    this.size = getMeasurement(attributes.size, "10pt");
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  override [$toHTML]( availableSpace?:AvailableSpace )
  {
    // TODO: border, shape and mark.

    const style = toStyle( this.margin! );
    const size = measureToString(this.size);

    style.width = style.height = size;

    let type;
    let className;
    let groupId;
    const field = <Field>this[$getParent]()![$getParent]();
    const items =
      (field.items.children.length &&
        (<HTMLResult>field.items.children[0][$toHTML]()).html) ||
      [];
    const exportedValue = {
      on: ((<any>items)[0] !== undefined ? (<any>items)[0] : "on").toString(),
      off: ((<any>items)[1] !== undefined ? (<any>items)[1] : "off").toString(),
    };

    const value = (field.value && field.value[$text]()) || "off";
    const checked = value === exportedValue.on || undefined;
    const container = field[$getSubformParent]();
    const fieldId = field[$uid];
    let dataId;

    if( container instanceof ExclGroup ) 
    {
      groupId = container[$uid];
      type = "radio";
      className = "xfaRadio";
      dataId = container[$data]?.[$uid] || container[$uid];
    } 
    else {
      type = "checkbox";
      className = "xfaCheckbox";
      dataId = field[$data]?.[$uid] || field[$uid];
    }

    const input:XFAHTMLObj = {
      name: "input",
      attributes: <XFAHTMLAttrs>{
        class: [className],
        style,
        fieldId,
        dataId,
        type,
        checked,
        xfaOn: exportedValue.on,
        xfaOff: exportedValue.off,
        "aria-label": ariaLabel(field),
      },
    };

    if( groupId )
    {
      input.attributes!.name = groupId;
    }

    return HTMLResult.success({
      name: "label",
      attributes: {
        class: ["xfaLabel"],
      },
      children: [input],
    });
  }
}

class ChoiceList extends XFAObject 
{
  commitOn;
  open;
  textEntry;
  override border:unknown | undefined = undefined; //?:Border;
  extras:unknown; //?:Extras;
  override margin = undefined;

  constructor( attributes:XFAAttrs ) 
  {
    super( TEMPLATE_NS_ID, "choiceList", /* hasChildren = */ true );
    this.commitOn = getStringOption(attributes.commitOn, ["select", "exit"]);
    this.id = attributes.id || "";
    this.open = getStringOption(attributes.open, [
      "userControl",
      "always",
      "multiSelect",
      "onEntry",
    ]);
    this.textEntry = getInteger({
      data: attributes.textEntry,
      defaultValue: 0,
      validate: x => x === 1,
    });
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  override [$toHTML]( availableSpace?:AvailableSpace )
  {
    // TODO: incomplete.
    const style = toStyle(this, "border", "margin");
    const ui = this[$getParent]()!;
    const field = <Field>ui[$getParent]();
    const fontSize = (field.font && field.font.size) || 10;
    const optionStyle = {
      fontSize: `calc(${fontSize}px * var(--zoom-factor))`,
    };
    const children = [];

    if( field.items.children.length > 0 )
    {
      const items = field.items;
      let displayedIndex:string | number = 0;
      let saveIndex = 0;
      if( items.children.length === 2 )
      {
        displayedIndex = (<Items>items.children[0]).save;
        saveIndex = 1 - displayedIndex;
      }
      const displayed = (<HTMLResult>items.children[displayedIndex][$toHTML]()).html;
      const values = (<HTMLResult>items.children[saveIndex][$toHTML]()).html;

      let selected = false;
      const value = field.value?.[$text]() || "";
      for (let i = 0, ii = (<any>displayed).length; i < ii; i++) 
      {
        const option = {
          name: "option",
          attributes: <XFAHTMLAttrs>{
            value: (<any>values)[i] || (<any>displayed)[i],
            style: optionStyle,
          },
          value: (<any>displayed)[i],
        };
        if ((<any>values)[i] === value) 
        {
          option.attributes.selected = selected = true;
        }
        children.push(option);
      }

      if (!selected) 
      {
        children.splice(0, 0, {
          name: "option",
          attributes: {
            hidden: true,
            selected: true,
          },
          value: " ",
        });
      }
    }

    const selectAttributes:XFAHTMLAttrs = {
      class: ["xfaSelect"],
      fieldId: field[$uid],
      dataId: field[$data]?.[$uid] || field[$uid],
      style,
      "aria-label": ariaLabel(field),
    };

    if( this.open === "multiSelect" ) 
    {
      selectAttributes.multiple = true;
    }

    return HTMLResult.success({
      name: "label",
      attributes: {
        class: ["xfaLabel"],
      },
      children: [
        {
          name: "select",
          children,
          attributes: selectAttributes,
        },
      ],
    });
  }
}

class Color extends XFAObject 
{
  cSpace;
  value;
  extras:unknown; //?:Extras;

  constructor( attributes:XFAAttrs ) 
  {
    super( TEMPLATE_NS_ID, "color", /* hasChildren = */ true );
    this.cSpace = getStringOption(attributes.cSpace, ["SRGB"]);
    this.id = attributes.id || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.value = attributes.value ? getColor(attributes.value) : <const>"";
  }

  override [$hasSettableValue]() {
    return false;
  }

  override [$toStyle]()
  {
    return this.value
      ? Util.makeHexColor(this.value.r, this.value.g, this.value.b)
      : undefined;
  }
}

class Comb extends XFAObject 
{
  numberOfCells;

  constructor( attributes:XFAAttrs ) 
  {
    super( TEMPLATE_NS_ID, "comb" );
    this.id = attributes.id || "";
    this.numberOfCells = getInteger({
      data: attributes.numberOfCells,
      defaultValue: 0,
      validate: x => x >= 0,
    });
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

class Connect extends XFAObject 
{
  connection;
  override ref;
  usage;
  picture:unknown //?:Picture;

  constructor( attributes:XFAAttrs ) 
  {
    super( TEMPLATE_NS_ID, "connect", /* hasChildren = */ true );
    this.connection = attributes.connection || "";
    this.id = attributes.id || "";
    this.ref = attributes.ref || "";
    this.usage = getStringOption(attributes.usage, [
      "exportAndImport",
      "exportOnly",
      "importOnly",
    ]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

export class ContentArea extends XFAObject 
{
  override h;
  relevant
  override w;
  override x;
  override y;
  desc:unknown; //?:Desc;
  extras:unknown; //?:Extras;

  constructor( attributes:XFAAttrs ) 
  {
    super( TEMPLATE_NS_ID, "contentArea", /* hasChildren = */ true );
    this.h = getMeasurement(attributes.h);
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.relevant = getRelevant(attributes.relevant);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.w = getMeasurement(attributes.w);
    this.x = getMeasurement(attributes.x, "0pt");
    this.y = getMeasurement(attributes.y, "0pt");
  }

  override [$toHTML]( availableSpace?:AvailableSpace )
  {
    // TODO: incomplete.
    const left = measureToString(this.x);
    const top = measureToString(this.y);

    const style = {
      left,
      top,
      width: measureToString(this.w),
      height: measureToString(this.h),
    };

    const classNames = ["xfaContentarea"];

    if (isPrintOnly(this)) {
      classNames.push("xfaPrintOnly");
    }

    return HTMLResult.success({
      name: "div",
      children: [],
      attributes: {
        style,
        class: classNames,
        id: this[$uid],
      },
    });
  }
}

class Corner extends XFAObject 
{
  inverted;
  join;
  override presence;
  radius;
  stroke;
  thickness;
  color:unknown; //?:Color;
  extras:unknown; //?:Extras;

  constructor( attributes:XFAAttrs ) 
  {
    super( TEMPLATE_NS_ID, "corner", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.inverted = getInteger({
      data: attributes.inverted,
      defaultValue: 0,
      validate: x => x === 1,
    });
    this.join = getStringOption(attributes.join, ["square", "round"]);
    this.presence = getStringOption(attributes.presence, [
      "visible",
      "hidden",
      "inactive",
      "invisible",
    ]);
    this.radius = getMeasurement(attributes.radius);
    this.stroke = getStringOption(attributes.stroke, [
      "solid",
      "dashDot",
      "dashDotDot",
      "dashed",
      "dotted",
      "embossed",
      "etched",
      "lowered",
      "raised",
    ]);
    this.thickness = getMeasurement(attributes.thickness, "0.5pt");
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  override [$toStyle]()
  {
    // In using CSS it's only possible to handle radius
    // (at least with basic css).
    // Is there a real use (interest ?) of all these properties ?
    // Maybe it's possible to implement them using svg and border-image...
    // TODO: implement all the missing properties.
    const style = toStyle(this, "visibility");
    style.radius = measureToString(this.join === "square" ? 0 : this.radius);
    return style;
  }
}

class DateElement extends ContentObject 
{
  override [$content]:string | Date;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "date" );
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  override [$finalize]() 
  {
    const date = (<string>this[$content]).trim();
    this[$content] = date ? new Date(date) : "";
  }

  override [$toHTML]( availableSpace?:AvailableSpace )
  {
    return valueToHtml( this[$content] ? this[$content].toString() : "" );
  }
}

class DateTime extends ContentObject 
{
  override [$content]:string | Date;

  constructor( attributes:XFAAttrs ) 
  {
    super( TEMPLATE_NS_ID, "dateTime" );
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  override [$finalize]()
  {
    const date = (<string>this[$content]).trim();
    this[$content] = date ? new Date(date) : "";
  }

  override [$toHTML]( availableSpace?:AvailableSpace )
  {
    return valueToHtml( this[$content] ? this[$content].toString() : "" );
  }
}

class DateTimeEdit extends XFAObject 
{
  hScrollPolicy;
  picker;
  override border:unknown | undefined = undefined; //?:Border;
  comb:unknown; //?:Comb;
  extras:unknown; //?:Extras;
  override margin = undefined;

  constructor( attributes:XFAAttrs ) 
  {
    super( TEMPLATE_NS_ID, "dateTimeEdit", /* hasChildren = */ true );
    this.hScrollPolicy = getStringOption(attributes.hScrollPolicy, [
      "auto",
      "off",
      "on",
    ]);
    this.id = attributes.id || "";
    this.picker = getStringOption(attributes.picker, ["host", "none"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  override [$toHTML]( availableSpace?:AvailableSpace )
  {
    // TODO: incomplete.
    // When the picker is host we should use type=date for the input
    // but we need to put the buttons outside the text-field.
    const style = toStyle(this, "border", "font", "margin");
    const field = <Field>this[$getParent]()![$getParent]();
    const html = {
      name: "input",
      attributes: {
        type: "text",
        fieldId: field[$uid],
        dataId: field[$data]?.[$uid] || field[$uid],
        class: ["xfaTextfield"],
        style,
        "aria-label": ariaLabel(field),
      },
    };

    return HTMLResult.success({
      name: "label",
      attributes: {
        class: ["xfaLabel"],
      },
      children: [html],
    });
  }
}

class Decimal extends ContentObject 
{
  override [$content]:string | number;

  fracDigits;
  leadDigits;

  constructor( attributes:XFAAttrs ) 
  {
    super( TEMPLATE_NS_ID, "decimal" );
    this.fracDigits = getInteger({
      data: attributes.fracDigits,
      defaultValue: 2,
      validate: x => true,
    });
    this.id = attributes.id || "";
    this.leadDigits = getInteger({
      data: attributes.leadDigits,
      defaultValue: -1,
      validate: x => true,
    });
    this.name = attributes.name || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  override [$finalize]()
  {
    const number = parseFloat( (<string>this[$content]).trim() );
    this[$content] = isNaN(number) ? "" : number;
  }

  override [$toHTML]( availableSpace?:AvailableSpace ) 
  {
    return valueToHtml(
      this[$content] !== null ? this[$content].toString() : ""
    );
  }
}

class DefaultUi extends XFAObject 
{
  extras:unknown; //?:Extras;

  constructor( attributes:XFAAttrs ) 
  {
    super( TEMPLATE_NS_ID, "defaultUi", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

class Desc extends XFAObject 
{
  boolean = new XFAObjectArray();
  date = new XFAObjectArray();
  dateTime = new XFAObjectArray();
  decimal = new XFAObjectArray();
  exData = new XFAObjectArray();
  float = new XFAObjectArray();
  image = new XFAObjectArray();
  integer = new XFAObjectArray();
  text = new XFAObjectArray();
  time = new XFAObjectArray();

  constructor( attributes:XFAAttrs ) 
  {
    super( TEMPLATE_NS_ID, "desc", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

class DigestMethod extends OptionObject 
{
  constructor( attributes:XFAAttrs ) 
  {
    super( TEMPLATE_NS_ID, "digestMethod", [
      "",
      "SHA1",
      "SHA256",
      "SHA512",
      "RIPEMD160",
    ]);
    this.id = attributes.id || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

class DigestMethods extends XFAObject 
{
  type;
  digestMethod = new XFAObjectArray();

  constructor( attributes:XFAAttrs ) 
  {
    super( TEMPLATE_NS_ID, "digestMethods", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.type = getStringOption(attributes.type, ["optional", "required"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

export class Draw extends XFAObject 
{
  override anchorType;
  override colSpan;
  override h;
  override hAlign;
  locale;
  maxH;
  maxW;
  minH;
  minW;
  override presence;
  relevant;
  override rotate;
  override w;
  override x;
  override y;
  override assist:Assist | undefined = undefined;
  override border:Border | undefined = undefined;
  caption:unknown; //?:Caption;
  desc:unknown; //?:Desc;
  extras:unknown; //?:Extras;
  font?:Font;
  keep:unknown; //?:Keep;
  override margin:Margin | undefined = undefined;
  override para:Para | undefined = undefined;
  override traversal = undefined; //?:Traversal;
  ui:unknown; //?:Ui;
  value?:Value;
  setProperty = new XFAObjectArray();

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "draw", /* hasChildren = */ true );
    this.anchorType = getStringOption(attributes.anchorType, [
      "topLeft",
      "bottomCenter",
      "bottomLeft",
      "bottomRight",
      "middleCenter",
      "middleLeft",
      "middleRight",
      "topCenter",
      "topRight",
    ]);
    this.colSpan = getInteger({
      data: attributes.colSpan,
      defaultValue: 1,
      validate: n => n >= 1 || n === -1,
    });
    this.h = attributes.h ? getMeasurement(attributes.h) : <const>"";
    this.hAlign = getStringOption(attributes.hAlign, [
      "left",
      "center",
      "justify",
      "justifyAll",
      "radix",
      "right",
    ]);
    this.id = attributes.id || "";
    this.locale = attributes.locale || "";
    this.maxH = getMeasurement(attributes.maxH, "0pt");
    this.maxW = getMeasurement(attributes.maxW, "0pt");
    this.minH = getMeasurement(attributes.minH, "0pt");
    this.minW = getMeasurement(attributes.minW, "0pt");
    this.name = attributes.name || "";
    this.presence = getStringOption(attributes.presence, [
      "visible",
      "hidden",
      "inactive",
      "invisible",
    ]);
    this.relevant = getRelevant(attributes.relevant);
    this.rotate = getInteger({
      data: attributes.rotate,
      defaultValue: 0,
      validate: x => x % 90 === 0,
    });
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.w = attributes.w ? getMeasurement(attributes.w) : <const>"";
    this.x = getMeasurement(attributes.x, "0pt");
    this.y = getMeasurement(attributes.y, "0pt");
  }

  override [$setValue]( value:XFAValue )
  {
    _setValue(this, value);
  }

  override [$toHTML]( availableSpace:AvailableSpace )
  {
    setTabIndex(this);

    if (this.presence === "hidden" || this.presence === "inactive") 
    {
      return HTMLResult.EMPTY;
    }

    fixDimensions(this);
    this[$pushPara]();

    // If at least one dimension is missing and we've a text
    // then we can guess it in laying out the text.
    const savedW = this.w;
    const savedH = this.h;
    const { w, h, isBroken } = layoutNode(this, availableSpace);
    if (w && this.w === "") {
      // If the parent layout is lr-tb with a w=100 and we already have a child
      // which takes 90 on the current line.
      // If we have a text with a length (in px) equal to 100 then it'll be
      // splitted into almost 10 chunks: so it won't be nice.
      // So if we've potentially more width to provide in some parent containers
      // let's increase it to give a chance to have a better rendering.
      if( isBroken && this[$getSubformParent]()![$isThereMoreWidth]() )
      {
        this[$popPara]();
        return HTMLResult.FAILURE;
      }

      this.w = w;
    }
    if( h && this.h === "" )
    {
      this.h = h;
    }

    setFirstUnsplittable(this);
    if( !checkDimensions(this, availableSpace) )
    {
      this.w = savedW;
      this.h = savedH;
      this[$popPara]();
      return HTMLResult.FAILURE;
    }
    unsetFirstUnsplittable(this);

    const style = toStyle(
      this,
      "font",
      "hAlign",
      "dimensions",
      "position",
      "presence",
      "rotate",
      "anchorType",
      "border",
      "margin"
    );

    setMinMaxDimensions(this, style);

    if (style.margin) {
      style.padding = style.margin;
      delete style.margin;
    }

    const classNames = ["xfaDraw"];
    if (this.font) {
      classNames.push("xfaFont");
    }
    if (isPrintOnly(this)) {
      classNames.push("xfaPrintOnly");
    }

    const attributes:XFAHTMLAttrs = {
      style,
      id: this[$uid],
      class: classNames,
    };

    if (this.name) {
      attributes.xfaName = this.name;
    }

    const html = {
      name: "div",
      attributes,
      children: <XFAElData[]>[],
    };

    applyAssist(this, attributes);

    const bbox = computeBbox(this, html, availableSpace);

    const value = this.value ? (<HTMLResult>this.value[$toHTML](availableSpace)).html : undefined;
    if( value === undefined )
    {
      this.w = savedW;
      this.h = savedH;
      this[$popPara]();
      return HTMLResult.success( createWrapper(this, html), bbox );
    }

    html.children.push( value );
    setPara( this, style, <XFAElObj>value );

    this.w = savedW;
    this.h = savedH;

    this[$popPara]();
    return HTMLResult.success( createWrapper(this, html), bbox );
  }
}

export class Edge extends XFAObject 
{
  cap;
  override presence;
  stroke;
  thickness;
  color?:Color;
  extras:unknown; //?:Extras;

  constructor( attributes:XFAAttrs ) 
  {
    super( TEMPLATE_NS_ID, "edge", /* hasChildren = */ true );
    this.cap = getStringOption(attributes.cap, ["square", "butt", "round"]);
    this.id = attributes.id || "";
    this.presence = getStringOption(attributes.presence, [
      "visible",
      "hidden",
      "inactive",
      "invisible",
    ]);
    this.stroke = getStringOption(attributes.stroke, [
      "solid",
      "dashDot",
      "dashDotDot",
      "dashed",
      "dotted",
      "embossed",
      "etched",
      "lowered",
      "raised",
    ]);
    this.thickness = getMeasurement(attributes.thickness, "0.5pt");
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  override [$toStyle]()
  {
    // TODO: dashDot & dashDotDot.
    const style = toStyle(this, "visibility");
    Object.assign(style, {
      linecap: this.cap,
      width: measureToString(this.thickness),
      color: this.color ? this.color[$toStyle]() : "#000000",
      style: "",
    });

    if (this.presence !== "visible") {
      style.style = "none";
    } 
    else {
      switch (this.stroke) {
        case "solid":
          style.style = "solid";
          break;
        case "dashDot":
          style.style = "dashed";
          break;
        case "dashDotDot":
          style.style = "dashed";
          break;
        case "dashed":
          style.style = "dashed";
          break;
        case "dotted":
          style.style = "dotted";
          break;
        case "embossed":
          style.style = "ridge";
          break;
        case "etched":
          style.style = "groove";
          break;
        case "lowered":
          style.style = "inset";
          break;
        case "raised":
          style.style = "outset";
          break;
      }
    }
    return style;
  }
}

class Encoding extends OptionObject
{
  constructor( attributes:XFAAttrs ) 
  {
    super( TEMPLATE_NS_ID, "encoding", [
      "adbe.x509.rsa_sha1",
      "adbe.pkcs7.detached",
      "adbe.pkcs7.sha1",
    ]);
    this.id = attributes.id || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

class Encodings extends XFAObject 
{
  type;
  encoding = new XFAObjectArray();

  constructor( attributes:XFAAttrs ) 
  {
    super( TEMPLATE_NS_ID, "encodings", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.type = getStringOption(attributes.type, ["optional", "required"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

class Encrypt extends XFAObject 
{
  certificate:unknown;

  constructor( attributes:XFAAttrs ) 
  {
    super( TEMPLATE_NS_ID, "encrypt", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

class EncryptData extends XFAObject 
{
  override operation;
  target;
  filter:unknown; //?:Filter
  manifest:unknown; //?:Manifest

  constructor( attributes:XFAAttrs ) 
  {
    super( TEMPLATE_NS_ID, "encryptData", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.operation = getStringOption(attributes.operation, [
      "encrypt",
      "decrypt",
    ]);
    this.target = attributes.target || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

class Encryption extends XFAObject 
{
  type;
  certificate = new XFAObjectArray();

  constructor( attributes:XFAAttrs ) 
  {
    super( TEMPLATE_NS_ID, "encryption", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.type = getStringOption(attributes.type, ["optional", "required"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

class EncryptionMethod extends OptionObject 
{
  constructor( attributes:XFAAttrs ) 
  {
    super( TEMPLATE_NS_ID, "encryptionMethod", [
      "",
      "AES256-CBC",
      "TRIPLEDES-CBC",
      "AES128-CBC",
      "AES192-CBC",
    ]);
    this.id = attributes.id || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

class EncryptionMethods extends XFAObject 
{
  type;
  encryptionMethod = new XFAObjectArray();

  constructor( attributes:XFAAttrs ) 
  {
    super( TEMPLATE_NS_ID, "encryptionMethods", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.type = getStringOption(attributes.type, ["optional", "required"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

class Event extends XFAObject 
{
  activity;
  listen;
  override ref;
  extras:unknown; //?:Extras;

  // One-of properties
  encryptData:unknown;
  execute:unknown;
  script:Script | undefined = undefined;
  signData:unknown;
  submit:unknown;
  
  constructor( attributes:XFAAttrs ) 
  {
    super( TEMPLATE_NS_ID, "event", /* hasChildren = */ true );
    this.activity = getStringOption(attributes.activity, [
      "click",
      "change",
      "docClose",
      "docReady",
      "enter",
      "exit",
      "full",
      "indexChange",
      "initialize",
      "mouseDown",
      "mouseEnter",
      "mouseExit",
      "mouseUp",
      "postExecute",
      "postOpen",
      "postPrint",
      "postSave",
      "postSign",
      "postSubmit",
      "preExecute",
      "preOpen",
      "prePrint",
      "preSave",
      "preSign",
      "preSubmit",
      "ready",
      "validationState",
    ]);
    this.id = attributes.id || "";
    this.listen = getStringOption(attributes.listen, [
      "refOnly",
      "refAndDescendents",
    ]);
    this.name = attributes.name || "";
    this.ref = attributes.ref || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

class ExData extends ContentObject 
{
  override [$content]:XhtmlObject | string;

  contentType;
  href;
  maxLength;
  rid;
  transferEncoding;

  constructor( attributes:XFAAttrs ) 
  {
    super( TEMPLATE_NS_ID, "exData" );
    this.contentType = attributes.contentType || "";
    this.href = attributes.href || "";
    this.id = attributes.id || "";
    this.maxLength = getInteger({
      data: attributes.maxLength,
      defaultValue: -1,
      validate: x => x >= -1,
    });
    this.name = attributes.name || "";
    this.rid = attributes.rid || "";
    this.transferEncoding = getStringOption(attributes.transferEncoding, [
      "none",
      "base64",
      "package",
    ]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  override [$isCDATAXml]() { return this.contentType === "text/html"; }

  override [$onChild]( child:XFAObject )
  {
    if( this.contentType === "text/html" 
     && child[$namespaceId] === NamespaceIds.xhtml.id
    ) {
      this[$content] = <XhtmlObject>child;
      return true;
    }

    if( this.contentType === "text/xml" )
    {
      this[$content] = <XhtmlObject>child;
      return true;
    }

    return false;
  }

  override [$toHTML]( availableSpace?:AvailableSpace )
  {
    if (this.contentType !== "text/html" || !this[$content]) 
    {
      // TODO: fix other cases.
      return HTMLResult.EMPTY;
    }

    return (<XhtmlObject>this[$content])[$toHTML]( availableSpace );
  }
}

class ExObject extends XFAObject 
{
  archive;
  classId;
  codeBase;
  codeType;
  extras:unknown; //?:Extras;
  boolean = new XFAObjectArray();
  date = new XFAObjectArray();
  dateTime = new XFAObjectArray();
  decimal = new XFAObjectArray();
  exData = new XFAObjectArray();
  exObject = new XFAObjectArray();
  float = new XFAObjectArray();
  image = new XFAObjectArray();
  integer = new XFAObjectArray();
  text = new XFAObjectArray();
  time = new XFAObjectArray();

  constructor( attributes:XFAAttrs ) 
  {
    super( TEMPLATE_NS_ID, "exObject", /* hasChildren = */ true );
    this.archive = attributes.archive || "";
    this.classId = attributes.classId || "";
    this.codeBase = attributes.codeBase || "";
    this.codeType = attributes.codeType || "";
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

export class ExclGroup extends XFAObject 
{
  access;
  accessKey;
  override anchorType;
  override colSpan;
  override h;
  override hAlign;
  override layout;
  maxH;
  maxW;
  minH;
  minW;
  override presence;
  relevant;
  override w;
  override x;
  override y;
  override assist:Assist | undefined = undefined;
  bind?:Bind;
  override border:Border | undefined = undefined;
  calculate:unknown; //?:Calculate;
  caption:unknown; //?:Caption;
  desc:unknown; //?:Desc;
  extras:unknown; //?:Extras;
  override margin:Margin | undefined = undefined;
  override para:unknown | undefined = undefined; //?:Para;
  override traversal = undefined; //?:Traversal;
  validate:unknown; //?:Validate;
  connect = new XFAObjectArray();
  event = new XFAObjectArray();
  field = new XFAObjectArray();
  setProperty = new XFAObjectArray();

  override [$extra]:XFAExtra;
  [$data]?:XFAObject;
  occur:Occur | undefined;

  constructor( attributes:XFAAttrs ) 
  {
    super( TEMPLATE_NS_ID, "exclGroup", /* hasChildren = */ true );
    this.access = getStringOption(attributes.access, [
      "open",
      "nonInteractive",
      "protected",
      "readOnly",
    ]);
    this.accessKey = attributes.accessKey || "";
    this.anchorType = getStringOption(attributes.anchorType, [
      "topLeft",
      "bottomCenter",
      "bottomLeft",
      "bottomRight",
      "middleCenter",
      "middleLeft",
      "middleRight",
      "topCenter",
      "topRight",
    ]);
    this.colSpan = getInteger({
      data: attributes.colSpan,
      defaultValue: 1,
      validate: n => n >= 1 || n === -1,
    });
    this.h = attributes.h ? getMeasurement(attributes.h) : <const>"";
    this.hAlign = getStringOption(attributes.hAlign, [
      "left",
      "center",
      "justify",
      "justifyAll",
      "radix",
      "right",
    ]);
    this.id = attributes.id || "";
    this.layout = getStringOption(attributes.layout, [
      "position",
      "lr-tb",
      "rl-row",
      "rl-tb",
      "row",
      "table",
      "tb",
    ]);
    this.maxH = getMeasurement(attributes.maxH, "0pt");
    this.maxW = getMeasurement(attributes.maxW, "0pt");
    this.minH = getMeasurement(attributes.minH, "0pt");
    this.minW = getMeasurement(attributes.minW, "0pt");
    this.name = attributes.name || "";
    this.presence = getStringOption(attributes.presence, [
      "visible",
      "hidden",
      "inactive",
      "invisible",
    ]);
    this.relevant = getRelevant(attributes.relevant);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.w = attributes.w ? getMeasurement(attributes.w) : <const>"";
    this.x = getMeasurement(attributes.x, "0pt");
    this.y = getMeasurement(attributes.y, "0pt");
  }

  override [$isBindable]() { return true; }

  override [$hasSettableValue]() { return true; }

  override [$setValue]( value:XFAValue )
  {
    for( const field of this.field.children )
    {
      if( !(<Field>field).value )
      {
        const nodeValue = new Value({});
        field[$appendChild](nodeValue);
        (<Field>field).value = nodeValue;
      }

      (<Field>field).value![$setValue]( value );
    }
  }

  override [$isThereMoreWidth]()
  {
    return (
      (this.layout.endsWith("-tb") &&
        this[$extra].attempt === 0 &&
        this[$extra].numberInLine! > 0) ||
      this[$getParent]()![$isThereMoreWidth]()
    );
  }

  override [$isSplittable]()
  {
    // We cannot cache the result here because the contentArea can change.
    const parent = this[$getSubformParent]()!;
    if( !parent[$isSplittable]() ) return false;

    if( this[$extra]._isSplittable !== undefined )
    {
      return this[$extra]._isSplittable!;
    }

    if( this.layout === "position" || this.layout.includes("row") )
    {
      this[$extra]._isSplittable = false;
      return false;
    }

    if( parent.layout?.endsWith("-tb")
     && (<XFAExtra>parent[$extra]).numberInLine !== 0
    ) {
      // See comment in Subform::[$isSplittable] for an explanation.
      return false;
    }

    this[$extra]._isSplittable = true;
    return true;
  }

  override [$flushHTML]() { return flushHTML(this); }

  override [$addHTML]( html:XFAElData, bbox:rect_t )
  {
    addHTML(this, html, bbox);
  }

  override [$getAvailableSpace]()
  {
    return getAvailableSpace( this );
  }

  override [$toHTML]( availableSpace:AvailableSpace )
  {
    setTabIndex(this);
    if( this.presence === "hidden"
     || this.presence === "inactive"
     || this.h === 0
     || this.w === 0
    ) {
      return HTMLResult.EMPTY;
    }

    fixDimensions(this);

    const children:XFAElData[] = [];
    const attributes:XFAHTMLAttrs = {
      id: this[$uid],
      class: [],
    };

    setAccess( this, attributes.class! );

    if (!this[$extra]) 
    {
      this[$extra] = Object.create(null);
    }

    Object.assign(this[$extra], {
      children,
      attributes,
      attempt: 0,
      line: null,
      numberInLine: 0,
      availableSpace: {
        width: Math.min(this.w || Infinity, availableSpace.width),
        height: Math.min(this.h || Infinity, availableSpace.height),
      },
      width: 0,
      height: 0,
      prevHeight: 0,
      currentWidth: 0,
    });

    const isSplittable = this[$isSplittable]();
    if (!isSplittable) 
    {
      setFirstUnsplittable(this);
    }

    if (!checkDimensions(this, availableSpace)) 
    {
      return HTMLResult.FAILURE;
    }
    const filter = new Set(["field"]);

    if( this.layout.includes("row") )
    {
      const columnWidths = (<Subform>this[$getSubformParent]()).columnWidths;
      if( Array.isArray(columnWidths) && columnWidths.length > 0 )
      {
        this[$extra].columnWidths = columnWidths;
        this[$extra].currentColumn = 0;
      }
    }

    const style = toStyle(
      this,
      "anchorType",
      "dimensions",
      "position",
      "presence",
      "border",
      "margin",
      "hAlign"
    );
    const classNames = ["xfaExclgroup"];
    const cl = layoutClass(this);
    if (cl) 
    {
      classNames.push(cl);
    }

    if (isPrintOnly(this)) 
    {
      classNames.push("xfaPrintOnly");
    }

    attributes.style = style;
    attributes.class = classNames;

    if (this.name) 
    {
      attributes.xfaName = this.name;
    }

    this[$pushPara]();
    const isLrTb = this.layout === "lr-tb" || this.layout === "rl-tb";
    const maxRun = isLrTb ? MAX_ATTEMPTS_FOR_LRTB_LAYOUT : 1;
    for(; this[$extra].attempt! < maxRun; this[$extra].attempt!++ ) 
    {
      if (isLrTb && this[$extra].attempt === MAX_ATTEMPTS_FOR_LRTB_LAYOUT - 1) 
      {
        // If the layout is lr-tb then having attempt equals to
        // MAX_ATTEMPTS_FOR_LRTB_LAYOUT-1 means that we're trying to layout
        // on the next line so this on is empty.
        this[$extra].numberInLine = 0;
      }
      const result = this[$childrenToHTML]({
        filter,
        include: true,
      });
      if (result.success) 
      {
        break;
      }
      if (result.isBreak()) 
      {
        this[$popPara]();
        return result;
      }
      if (
        isLrTb &&
        this[$extra].attempt === 0 &&
        this[$extra].numberInLine === 0 &&
        !this[$getTemplateRoot]()![$extra].noLayoutFailure
      ) {
        // See comment in Subform::[$toHTML].
        this[$extra].attempt = maxRun;
        break;
      }
    }

    this[$popPara]();

    if (!isSplittable) 
    {
      unsetFirstUnsplittable(this);
    }

    if (this[$extra].attempt === maxRun) 
    {
      if (!isSplittable) 
      {
        delete (<any>this)[$extra];
      }
      return HTMLResult.FAILURE;
    }

    let marginH = 0;
    let marginV = 0;
    if (this.margin) 
    {
      marginH = this.margin.leftInset + this.margin.rightInset;
      marginV = this.margin.topInset + this.margin.bottomInset;
    }

    const width = Math.max( this[$extra].width! + marginH, this.w || 0 );
    const height = Math.max( this[$extra].height! + marginV, this.h || 0 );
    const bbox:rect_t = [this.x, this.y, width, height];

    if (this.w === "") 
    {
      style.width = measureToString(width);
    }
    if (this.h === "") 
    {
      style.height = measureToString(height);
    }

    const html = {
      name: "div",
      attributes,
      children,
    };

    applyAssist(this, attributes);

    delete (<any>this)[$extra];

    return HTMLResult.success( createWrapper(this, html), bbox );
  }
}

class Execute extends XFAObject 
{
  connection;
  executeType;
  runAt;

  constructor( attributes:XFAAttrs ) 
  {
    super( TEMPLATE_NS_ID, "execute" );
    this.connection = attributes.connection || "";
    this.executeType = getStringOption(attributes.executeType, [
      "import",
      "remerge",
    ]);
    this.id = attributes.id || "";
    this.runAt = getStringOption(attributes.runAt, [
      "client",
      "both",
      "server",
    ]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

class Extras extends XFAObject 
{
  boolean = new XFAObjectArray();
  date = new XFAObjectArray();
  dateTime = new XFAObjectArray();
  decimal = new XFAObjectArray();
  exData = new XFAObjectArray();
  extras = new XFAObjectArray();
  float = new XFAObjectArray();
  image = new XFAObjectArray();
  integer = new XFAObjectArray();
  text = new XFAObjectArray();
  time = new XFAObjectArray();

  constructor( attributes:XFAAttrs ) 
  {
    super( TEMPLATE_NS_ID, "extras", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  // (Spec) The XFA template grammar defines the extras and desc elements,
  // which can be used to add human-readable or machine-readable
  // data to a template.
}

export class Field extends XFAObject 
{
  access;
  accessKey;
  override anchorType;
  override colSpan;
  override h;
  override hAlign;
  locale;
  maxH;
  maxW;
  minH;
  minW;
  override presence;
  relevant;
  override rotate;
  override w;
  override x;
  override y;
  override assist:Assist | undefined = undefined;
  bind?:Bind;
  override border:Border | undefined = undefined;
  calculate:unknown; //?:Calculate;
  caption?:Caption;
  desc:unknown; //?:Desc;
  extras:unknown; //?:Extras;
  font?:Font;
  format:unknown; //?:Format;
  // For a choice list, one list is used to have display entries
  // and the other for the exported values
  items = new XFAObjectArray(2);
  keep:unknown; //?:Keep;
  override margin:Margin | undefined = undefined;
  override para:Para | undefined = undefined;
  override traversal:Traversal | undefined = undefined;
  ui?:Ui;
  validate:unknown; //?:Validate;
  value?:Value;
  bindItems = new XFAObjectArray();
  connect = new XFAObjectArray();
  event = new XFAObjectArray();
  setProperty = new XFAObjectArray();

  [$data]?:XFAObject;
  occur?:Occur;

  constructor( attributes:XFAAttrs ) 
  {
    super( TEMPLATE_NS_ID, "field", /* hasChildren = */ true );
    this.access = getStringOption(attributes.access, [
      "open",
      "nonInteractive",
      "protected",
      "readOnly",
    ]);
    this.accessKey = attributes.accessKey || "";
    this.anchorType = getStringOption(attributes.anchorType, [
      "topLeft",
      "bottomCenter",
      "bottomLeft",
      "bottomRight",
      "middleCenter",
      "middleLeft",
      "middleRight",
      "topCenter",
      "topRight",
    ]);
    this.colSpan = getInteger({
      data: attributes.colSpan,
      defaultValue: 1,
      validate: n => n >= 1 || n === -1,
    });
    this.h = attributes.h ? getMeasurement(attributes.h) : <const>"";
    this.hAlign = getStringOption(attributes.hAlign, [
      "left",
      "center",
      "justify",
      "justifyAll",
      "radix",
      "right",
    ]);
    this.id = attributes.id || "";
    this.locale = attributes.locale || "";
    this.maxH = getMeasurement(attributes.maxH, "0pt");
    this.maxW = getMeasurement(attributes.maxW, "0pt");
    this.minH = getMeasurement(attributes.minH, "0pt");
    this.minW = getMeasurement(attributes.minW, "0pt");
    this.name = attributes.name || "";
    this.presence = getStringOption(attributes.presence, [
      "visible",
      "hidden",
      "inactive",
      "invisible",
    ]);
    this.relevant = getRelevant(attributes.relevant);
    this.rotate = getInteger({
      data: attributes.rotate,
      defaultValue: 0,
      validate: x => x % 90 === 0,
    });
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.w = attributes.w ? getMeasurement(attributes.w) : <const>"";
    this.x = getMeasurement(attributes.x, "0pt");
    this.y = getMeasurement(attributes.y, "0pt");
  }

  override [$isBindable]() { return true; }

  override [$setValue]( value:XFAValue ) { _setValue(this, value); }

  override [$toHTML]( availableSpace:AvailableSpace )
  {
    setTabIndex(this);

    if( !this.ui )
    {
      // It's allowed to not have an ui, specs say:
      //   If the UI element contains no children or is not present,
      //   the application chooses a default user interface for the
      //   container, based on the type of the container's content.

      this.ui = new Ui({});
      this.ui[$globalData] = this[$globalData];
      this[$appendChild](this.ui);
      let node:XFAObject;

      // The items element can have 2 element max and
      // according to the items specs it's likely a good
      // way to guess the correct ui type.
      switch (this.items.children.length) 
      {
        case 0:
          node = new TextEdit({});
          this.ui.textEdit = <TextEdit>node;
          break;
        case 1:
          node = new CheckButton({});
          this.ui.checkButton = <CheckButton>node;
          break;
        case 2:
          node = new ChoiceList({});
          this.ui.choiceList = <ChoiceList>node;
          break;
      }
      this.ui[$appendChild]( node! );
    }

    if( !this.ui
     || this.presence === "hidden"
     || this.presence === "inactive"
     || this.h === 0
     || this.w === 0
    ) {
      return HTMLResult.EMPTY;
    }

    if (this.caption) 
    {
      // Maybe we already tried to layout this field with
      // another availableSpace, so to avoid to use the cached
      // value just delete it.
      delete (<any>this.caption)[$extra];
    }

    this[$pushPara]();

    const caption = this.caption
      ? <XFAHTMLObj>this.caption[$toHTML]( availableSpace ).html
      : undefined;
    const savedW = this.w;
    const savedH = this.h;
    let marginH = 0;
    let marginV = 0;
    if (this.margin) 
    {
      marginH = this.margin.leftInset + this.margin.rightInset;
      marginV = this.margin.topInset + this.margin.bottomInset;
    }

    let borderDims;
    if (this.w === "" || this.h === "") 
    {
      let width:number;
      let height:number;

      let uiW = 0;
      let uiH = 0;
      if (this.ui.checkButton) 
      {
        uiW = uiH = this.ui.checkButton.size;
      } 
      else {
        const { w, h } = layoutNode( this, availableSpace );
        if( w !== undefined ) 
        {
          uiW = w;
          uiH = h!;
        } 
        else {
          uiH = getMetrics( this.font, /* real = */ true ).lineNoGap!;
        }
      }

      borderDims = getBorderDims( this.ui[$getExtra]() );
      uiW += borderDims.w;
      uiH += borderDims.h;

      if( this.caption ) 
      {
        const { w, h, isBroken } = this.caption[$getExtra]( availableSpace );
        // See comment in Draw::[$toHTML] to have an explanation
        // about this line.
        if( isBroken && this[$getSubformParent]()![$isThereMoreWidth]() )
        {
          this[$popPara]();
          return HTMLResult.FAILURE;
        }

        width = w!;
        height = h!;

        switch (this.caption.placement) 
        {
          case "left":
          case "right":
          case "inline":
            width += uiW;
            break;
          case "top":
          case "bottom":
            height += uiH;
            break;
        }
      }
      else {
        width = uiW;
        height = uiH;
      }

      if( width && this.w === "" )
      {
        width += marginH;
        this.w = Math.min(
          this.maxW <= 0 ? Infinity : this.maxW,
          this.minW + 1 < width ? width : this.minW
        );
      }

      if( height && this.h === "")
      {
        height += marginV;
        this.h = Math.min(
          this.maxH <= 0 ? Infinity : this.maxH,
          this.minH + 1 < height ? height : this.minH
        );
      }
    }

    this[$popPara]();

    fixDimensions(this);

    setFirstUnsplittable(this);
    if( !checkDimensions(this, availableSpace) ) 
    {
      this.w = savedW;
      this.h = savedH;
      this[$popPara]();
      return HTMLResult.FAILURE;
    }
    unsetFirstUnsplittable(this);

    const style = toStyle(
      this,
      "font",
      "dimensions",
      "position",
      "rotate",
      "anchorType",
      "presence",
      "margin",
      "hAlign"
    );

    setMinMaxDimensions(this, style);

    const classNames = ["xfaField"];
    // If no font, font properties are inherited.
    if (this.font) 
    {
      classNames.push("xfaFont");
    }

    if (isPrintOnly(this)) 
    {
      classNames.push("xfaPrintOnly");
    }

    const attributes:XFAHTMLAttrs = {
      style,
      id: this[$uid],
      class: classNames,
    };

    if (style.margin) 
    {
      style.padding = style.margin;
      delete style.margin;
    }

    setAccess( this, classNames );

    if (this.name) 
    {
      attributes.xfaName = this.name;
    }

    const children:XFAElData[] = [];
    const html = {
      name: "div",
      attributes,
      children,
    };

    applyAssist(this, attributes);

    const borderStyle = this.border ? this.border[$toStyle]() : undefined;
    const bbox = computeBbox(this, html, availableSpace);
    const ui = <XFAHTMLObj | undefined>(<HTMLResult>this.ui[$toHTML]()).html;
    if( !ui )
    {
      Object.assign(style, borderStyle);
      return HTMLResult.success( createWrapper(this, html), bbox );
    }

    if( this[$tabIndex] )
    {
      if( ui.children?.[0] )
      {
        (<XFAHTMLObj>ui.children[0]).attributes!.tabindex = this[$tabIndex];
      } 
      else {
        ui.attributes!.tabindex = this[$tabIndex];
      }
    }

    if( !ui.attributes!.style ) 
    {
      ui.attributes!.style = Object.create(null);
    }

    let aElement;

    if( this.ui.button ) 
    {
      if( ui.children!.length === 1 )
      {
        [aElement] = ui.children!.splice(0, 1);
      }
      Object.assign( ui.attributes!.style, borderStyle );
    } 
    else {
      Object.assign(style, borderStyle);
    }

    children.push(ui);

    if (this.value) 
    {
      if( this.ui.imageEdit )
      {
        ui.children!.push( (<HTMLResult>this.value[$toHTML]()).html! );
      } 
      else if( !this.ui.button ) 
      {
        let value:string | number | undefined = "";
        if( this.value.exData ) 
        {
          value = this.value.exData[$text]();
        } 
        else if (this.value.text) 
        {
          value = this.value.text[$getExtra]();
        }
        else {
          const htmlValue = (<HTMLResult>this.value[$toHTML]()).html;
          if( htmlValue !== undefined )
          {
            value = (<XFAHTMLObj>(<XFAHTMLObj>htmlValue).children![0]).value;
          }
        }
        if( this.ui.textEdit && this.value.text?.maxChars )
        {
          (<XFAHTMLObj>ui.children![0]).attributes!.maxLength = this.value.text.maxChars;
        }

        if( value ) 
        {
          if (this.ui.numericEdit) 
          {
            value = parseFloat(<string>value);
            value = isNaN(value) ? "" : value.toString();
          }

          if( (<XFAHTMLObj>ui.children![0]).name === "textarea" ) 
          {
            (<XFAHTMLObj>ui.children![0]).attributes!.textContent = <string>value;
          } 
          else {
            (<XFAHTMLObj>ui.children![0]).attributes!.value = <string>value;
          }
        }
      }
    }

    if (!this.ui.imageEdit && ui.children && ui.children[0] && this.h) 
    {
      borderDims = borderDims || getBorderDims( this.ui[$getExtra]() );

      let captionHeight = 0;
      if (this.caption && ["top", "bottom"].includes(this.caption.placement)) 
      {
        captionHeight = this.caption.reserve;
        if (captionHeight <= 0) 
        {
          captionHeight = this.caption[$getExtra](availableSpace).h!;
        }
        const inputHeight = this.h - captionHeight - marginV - borderDims.h;
        (<XFAElObj>ui.children[0]).attributes!.style!.height = measureToString(inputHeight);
      } 
      else {
        (<XFAElObj>ui.children[0]).attributes!.style!.height = "100%";
      }
    }

    if (aElement) 
    {
      ui.children!.push(aElement);
    }

    if( !caption ) 
    {
      if( ui.attributes!.class )
      {
        // Even if no caption this class will help to center the ui.
        ui.attributes!.class.push("xfaLeft");
      }
      this.w = savedW;
      this.h = savedH;

      return HTMLResult.success( createWrapper(this, html), bbox );
    }

    if( this.ui.button )
    {
      if( style.padding )
      {
        delete style.padding;
      }
      if( caption.name === "div" )
      {
        caption.name = "span";
      }
      ui.children!.push( caption );
      return HTMLResult.success( html, bbox );
    } 
    else if (this.ui.checkButton) 
    {
      caption.attributes!.class![0] = "xfaCaptionForCheckButton";
    }

    if( !ui.attributes!.class )
    {
      ui.attributes!.class = [];
    }

    ui.children!.splice(0, 0, caption);

    switch( this.caption!.placement ) 
    {
      case "left":
        ui.attributes!.class.push("xfaLeft");
        break;
      case "right":
        ui.attributes!.class.push("xfaRight");
        break;
      case "top":
        ui.attributes!.class.push("xfaTop");
        break;
      case "bottom":
        ui.attributes!.class.push("xfaBottom");
        break;
      case "inline":
        // TODO;
        ui.attributes!.class.push("xfaLeft");
        break;
    }

    this.w = savedW;
    this.h = savedH;
    return HTMLResult.success( createWrapper(this, html), bbox );
  }
}

class Fill extends XFAObject 
{
  override presence;
  color?:Color;
  extras:unknown; //?:Extras;

  // One-of properties or none
  linear:unknown;
  pattern:unknown;
  radial:unknown;
  solid:unknown;
  stipple:unknown;

  constructor( attributes:XFAAttrs ) 
  {
    super( TEMPLATE_NS_ID, "fill", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.presence = getStringOption(attributes.presence, [
      "visible",
      "hidden",
      "inactive",
      "invisible",
    ]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  override [$toStyle]() 
  {
    const parent = this[$getParent]()!;
    const grandpa = parent[$getParent]()!;
    const ggrandpa = grandpa[$getParent]();
    const style = Object.create(null);

    // Use for color, i.e. #...
    let propName = "color";

    // Use for non-color, i.e. gradient, radial-gradient...
    let altPropName = propName;

    if (parent instanceof Border) 
    {
      propName = "background-color";
      altPropName = "background";
      if (ggrandpa instanceof Ui) 
      {
        // The default fill color is white.
        style.backgroundColor = "white";
      }
    }
    if (parent instanceof Rectangle || parent instanceof Arc) 
    {
      propName = altPropName = "fill";
      style.fill = "white";
    }

    for( const name of Object.getOwnPropertyNames(this) )
    {
      if( name === "extras" || name === "color" ) continue;

      const obj = (<any>this)[name];
      if( !(obj instanceof XFAObject) ) continue;

      const color = <string>obj[$toStyle]( this.color );
      if( color )
      {
        style[color.startsWith("#") ? propName : altPropName] = color;
      }
      return style;
    }

    if (this.color && this.color.value) 
    {
      const color = <string>this.color[$toStyle]();
      style[ color.startsWith("#") ? propName : altPropName ] = color;
    }

    return style;
  }
}

class Filter extends XFAObject 
{
  addRevocationInfo;
  version;
  appearanceFilter:unknown;
  certificates:unknown;
  digestMethods:unknown;
  encodings:unknown;
  encryptionMethods:unknown;
  handler:unknown;
  lockDocument:unknown;
  mdp:unknown;
  reasons:unknown;
  timeStamp:unknown;

  constructor( attributes:XFAAttrs ) 
  {
    super( TEMPLATE_NS_ID, "filter", /* hasChildren = */ true );
    this.addRevocationInfo = getStringOption(attributes.addRevocationInfo, [
      "",
      "required",
      "optional",
      "none",
    ]);
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.version = getInteger({
      data: (<any>this).version,
      defaultValue: 5,
      validate: x => x >= 1 && x <= 5,
    });
  }
}

class Float extends ContentObject 
{
  override [$content]:string | number;

  constructor( attributes:XFAAttrs ) 
  {
    super( TEMPLATE_NS_ID, "float" );
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  override [$finalize]()
  {
    const number = parseFloat( (<string>this[$content]).trim() );
    this[$content] = isNaN(number) ? "" : number;
  }

  override [$toHTML]( availableSpace?:AvailableSpace )
  {
    return valueToHtml(
      this[$content] !== "" ? this[$content].toString() : ""
    );
  }
}

export class Font extends XFAObject implements XFAFontBase
{
  baselineShift;
  fontHorizontalScale;
  fontVerticalScale;
  kerningMode;
  letterSpacing;
  lineThrough;
  lineThroughPeriod;
  overline;
  overlinePeriod;
  posture;
  size;
  typeface;
  underline;
  underlinePeriod;
  weight;
  extras:unknown; //?:Extras;
  fill:unknown; //?:Fill;

  constructor( attributes:XFAAttrs ) 
  {
    super( TEMPLATE_NS_ID, "font", /* hasChildren = */ true );
    this.baselineShift = getMeasurement(attributes.baselineShift);
    this.fontHorizontalScale = getFloat({
      data: attributes.fontHorizontalScale,
      defaultValue: 100,
      validate: x => x >= 0,
    });
    this.fontVerticalScale = getFloat({
      data: attributes.fontVerticalScale,
      defaultValue: 100,
      validate: x => x >= 0,
    });
    this.id = attributes.id || "";
    this.kerningMode = getStringOption(attributes.kerningMode, [
      "none",
      "pair",
    ]);
    this.letterSpacing = getMeasurement(attributes.letterSpacing, "0");
    this.lineThrough = getInteger({
      data: attributes.lineThrough,
      defaultValue: 0,
      validate: x => x === 1 || x === 2,
    });
    this.lineThroughPeriod = getStringOption(attributes.lineThroughPeriod, [
      "all",
      "word",
    ]);
    this.overline = getInteger({
      data: attributes.overline,
      defaultValue: 0,
      validate: x => x === 1 || x === 2,
    });
    this.overlinePeriod = getStringOption(attributes.overlinePeriod, [
      "all",
      "word",
    ]);
    this.posture = getStringOption(attributes.posture, ["normal", "italic"]);
    this.size = getMeasurement(attributes.size, "10pt");
    this.typeface = attributes.typeface || "Courier";
    this.underline = getInteger({
      data: attributes.underline,
      defaultValue: 0,
      validate: x => x === 1 || x === 2,
    });
    this.underlinePeriod = getStringOption(attributes.underlinePeriod, [
      "all",
      "word",
    ]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.weight = getStringOption(attributes.weight, ["normal", "bold"]);
  }

  override [$clean]( builder:Builder )
  {
    super[$clean](builder);
    this[$globalData].usedTypefaces.add( this.typeface );
  }

  override [$toStyle]()
  {
    const style = toStyle(this, "fill");
    const color = style.color;
    if (color) {
      if (color === "#000000") {
        // Default font color.
        delete style.color;
      } 
      else if (!color.startsWith("#")) {
        // We've a gradient which is not possible for a font color
        // so use a workaround.
        style.background = color;
        style.backgroundClip = "text";
        style.color = "transparent";
      }
    }

    if (this.baselineShift) {
      style.verticalAlign = measureToString(this.baselineShift);
    }

    // TODO: fontHorizontalScale
    // TODO: fontVerticalScale

    style.fontKerning = this.kerningMode === "none" ? "none" : "normal";
    style.letterSpacing = measureToString(this.letterSpacing);

    if (this.lineThrough !== 0) {
      style.textDecoration = "line-through";
      if (this.lineThrough === 2) {
        style.textDecorationStyle = "double";
      }
    }

    // TODO: lineThroughPeriod

    if (this.overline !== 0) {
      style.textDecoration = "overline";
      if (this.overline === 2) {
        style.textDecorationStyle = "double";
      }
    }

    // TODO: overlinePeriod

    style.fontStyle = this.posture;
    style.fontSize = measureToString(0.99 * this.size);

    setFontFamily(this, this, this[$globalData].fontFinder!, style);

    if (this.underline !== 0) {
      style.textDecoration = "underline";
      if (this.underline === 2) {
        style.textDecorationStyle = "double";
      }
    }

    // TODO: underlinePeriod

    style.fontWeight = this.weight;

    return style;
  }
}

class Format extends XFAObject 
{
  extras:unknown; //?:Extras;
  picture:unknown; //?:Picture;

  constructor( attributes:XFAAttrs ) 
  {
    super( TEMPLATE_NS_ID, "format", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

class Handler extends StringObject 
{
  type;

  constructor( attributes:XFAAttrs ) 
  {
    super( TEMPLATE_NS_ID, "handler" );
    this.id = attributes.id || "";
    this.type = getStringOption(attributes.type, ["optional", "required"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

class Hyphenation extends XFAObject 
{
  excludeAllCaps;
  excludeInitialCap;
  hyphenate;
  pushCharacterCount;
  remainCharacterCount;
  wordCharacterCount;

  constructor( attributes:XFAAttrs ) 
  {
    super( TEMPLATE_NS_ID, "hyphenation" );
    this.excludeAllCaps = getInteger({
      data: attributes.excludeAllCaps,
      defaultValue: 0,
      validate: x => x === 1,
    });
    this.excludeInitialCap = getInteger({
      data: attributes.excludeInitialCap,
      defaultValue: 0,
      validate: x => x === 1,
    });
    this.hyphenate = getInteger({
      data: attributes.hyphenate,
      defaultValue: 0,
      validate: x => x === 1,
    });
    this.id = attributes.id || "";
    this.pushCharacterCount = getInteger({
      data: attributes.pushCharacterCount,
      defaultValue: 3,
      validate: x => x >= 0,
    });
    this.remainCharacterCount = getInteger({
      data: attributes.remainCharacterCount,
      defaultValue: 3,
      validate: x => x >= 0,
    });
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.wordCharacterCount = getInteger({
      data: attributes.wordCharacterCount,
      defaultValue: 7,
      validate: x => x >= 0,
    });
  }
}

class Image extends StringObject 
{
  override [$content]:string;

  aspect;
  contentType;
  href;
  transferEncoding;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "image" );
    this.aspect = getStringOption(attributes.aspect, [
      "fit",
      "actual",
      "height",
      "none",
      "width",
    ]);
    this.contentType = attributes.contentType || "";
    this.href = attributes.href || "";
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.transferEncoding = getStringOption(attributes.transferEncoding, [
      "base64",
      "none",
      "package",
    ]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  override [$toHTML]( availableSpace?:AvailableSpace )
  {
    if (this.contentType && !MIMES.has(this.contentType.toLowerCase())) 
    {
      return HTMLResult.EMPTY;
    }

    let buffer = this[$globalData].images?.get( this.href );
    if( !buffer && (this.href || !this[$content]) )
    {
      // In general, we don't get remote data and use what we have
      // in the pdf itself, so no picture for non null href.
      return HTMLResult.EMPTY;
    }

    if( !buffer && this.transferEncoding === "base64" )
    {
      buffer = stringToBytes( atob(this[$content]) );
    }

    if( !buffer ) return HTMLResult.EMPTY;

    if( !this.contentType )
    {
      for( const [header, type] of IMAGES_HEADERS )
      {
        if( buffer.length > header.length
         && header.every( (x, i) => x === buffer![i] )
        ) {
          this.contentType = type;
          break;
        }
      }
      if (!this.contentType) 
      {
        return HTMLResult.EMPTY;
      }
    }

    // TODO: Firefox doesn't support natively tiff (and tif) format.
    const blob = new Blob([buffer], { type: this.contentType });
    let style;
    switch( this.aspect )
    {
      case "fit":
      case "actual":
        // TODO: check what to do with actual.
        // Normally we should return {auto, auto} for it but
        // it implies some wrong rendering (see xfa_bug1716816.pdf).
        break;
      case "height":
        style = {
          height: "100%",
          objectFit: "fill",
        };
        break;
      case "none":
        style = {
          width: "100%",
          height: "100%",
          objectFit: "fill",
        };
        break;
      case "width":
        style = {
          width: "100%",
          objectFit: "fill",
        };
        break;
    }
    const parent = this[$getParent]();
    return HTMLResult.success({
      name: "img",
      attributes: <XFAHTMLAttrs>{
        class: ["xfaImage"],
        style,
        src: URL.createObjectURL(blob),
        alt: parent ? ariaLabel( <Field>parent[$getParent]() ) : undefined,
      },
    });
  }
}

class ImageEdit extends XFAObject 
{
  data;
  override border:unknown | undefined = undefined; //?:Border;
  extras:unknown; //?:Extras;
  override margin = undefined; //?:Margin;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "imageEdit", /* hasChildren = */ true );
    this.data = getStringOption(attributes.data, ["link", "embed"]);
    this.id = attributes.id || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  override [$toHTML]( availableSpace?:AvailableSpace )
  {
    if( this.data === "embed" )
    {
      return HTMLResult.success({
        name: "div",
        children: [],
        attributes: {},
      });
    }

    return HTMLResult.EMPTY;
  }
}

class Integer extends ContentObject 
{
  override [$content]:string | number;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "integer" );
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  override [$finalize]()
  {
    const number = parseInt( (<string>this[$content]).trim(), 10 );
    this[$content] = isNaN(number) ? "" : number;
  }

  override [$toHTML]( availableSpace?:AvailableSpace )
  {
    return valueToHtml(
      this[$content] !== "" ? this[$content].toString() : ""
    );
  }
}

class Issuers extends XFAObject 
{
  type;
  certificate = new XFAObjectArray();

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "issuers", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.type = getStringOption(attributes.type, ["optional", "required"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

export class Items extends XFAObject 
{
  override presence;
  override ref;
  save;
  boolean = new XFAObjectArray();
  date = new XFAObjectArray();
  dateTime = new XFAObjectArray();
  decimal = new XFAObjectArray();
  exData = new XFAObjectArray();
  float = new XFAObjectArray();
  image = new XFAObjectArray();
  integer = new XFAObjectArray();
  text = new XFAObjectArray();
  time = new XFAObjectArray();

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "items", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.presence = getStringOption(attributes.presence, [
      "visible",
      "hidden",
      "inactive",
      "invisible",
    ]);
    this.ref = attributes.ref || "";
    this.save = getInteger({
      data: attributes.save,
      defaultValue: 0,
      validate: x => x === 1,
    });
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  override [$toHTML]( availableSpace?:AvailableSpace )
  {
    const output = [];
    for( const child of this[$getChildren]() )
    {
      output.push( child[$text]() );
    }
    return HTMLResult.success( <any>output );
  }
}

class Keep extends XFAObject 
{
  intact;
  next;
  previous;
  extras:unknown; //?:Extras

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "keep", /* hasChildren = */ true );
    this.id = attributes.id || "";
    const options = ["none", "contentArea", "pageArea"];
    this.intact = getStringOption(attributes.intact, options);
    this.next = getStringOption(attributes.next, options);
    this.previous = getStringOption(attributes.previous, options);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

class KeyUsage extends XFAObject 
{
  crlSign;
  dataEncipherment;
  decipherOnly;
  digitalSignature;
  encipherOnly;
  keyAgreement;
  keyCertSign;
  keyEncipherment;
  nonRepudiation;
  type;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "keyUsage" );
    const options = ["", "yes", "no"];
    this.crlSign = getStringOption(attributes.crlSign, options);
    this.dataEncipherment = getStringOption(
      attributes.dataEncipherment,
      options
    );
    this.decipherOnly = getStringOption(attributes.decipherOnly, options);
    this.digitalSignature = getStringOption(
      attributes.digitalSignature,
      options
    );
    this.encipherOnly = getStringOption(attributes.encipherOnly, options);
    this.id = attributes.id || "";
    this.keyAgreement = getStringOption(attributes.keyAgreement, options);
    this.keyCertSign = getStringOption(attributes.keyCertSign, options);
    this.keyEncipherment = getStringOption(attributes.keyEncipherment, options);
    this.nonRepudiation = getStringOption(attributes.nonRepudiation, options);
    this.type = getStringOption(attributes.type, ["optional", "required"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

class Line extends XFAObject 
{
  hand;
  slope;
  edge?:Edge

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "line", /* hasChildren = */ true );
    this.hand = getStringOption(attributes.hand, ["even", "left", "right"]);
    this.id = attributes.id || "";
    this.slope = getStringOption(attributes.slope, ["\\", "/"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  override [$toHTML]( availableSpace?:AvailableSpace )
  {
    const parent = this[$getParent]()![$getParent]()!;
    const edge = this.edge ? this.edge : new Edge({});
    const edgeStyle = edge[$toStyle]();
    const style = Object.create(null);
    const thickness = edge.presence === "visible" ? edge.thickness : 0;
    style.strokeWidth = measureToString(thickness);
    style.stroke = edgeStyle.color;
    let x1, y1, x2, y2;
    let width = "100%";
    let height = "100%";

    if( <number>parent.w <= thickness )
    {
      [x1, y1, x2, y2] = ["50%", 0, "50%", "100%"];
      width = style.strokeWidth;
    } 
    else if( <number>parent.h <= thickness ) 
    {
      [x1, y1, x2, y2] = [0, "50%", "100%", "50%"];
      height = style.strokeWidth;
    } 
    else {
      if (this.slope === "\\") {
        [x1, y1, x2, y2] = [0, 0, "100%", "100%"];
      } 
      else {
        [x1, y1, x2, y2] = [0, "100%", "100%", 0];
      }
    }

    const line = {
      name: "line",
      attributes: {
        xmlns: SVG_NS,
        x1,
        y1,
        x2,
        y2,
        style,
      },
    };

    const svg = {
      name: "svg",
      children: [line],
      attributes: <XFASVGAttrs>{
        xmlns: SVG_NS,
        width,
        height,
        style: {
          overflow: "visible",
        },
      },
    };

    if (hasMargin(parent)) 
    {
      return HTMLResult.success({
        name: "div",
        attributes: {
          style: {
            display: "inline",
            width: "100%",
            height: "100%",
          },
        },
        children: [svg],
      });
    }

    svg.attributes.style!.position = "absolute";
    return HTMLResult.success(svg);
  }
}

class Linear extends XFAObject 
{
  type;
  color?:Color;
  extras:unknown; //?:Extras;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "linear", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.type = getStringOption(attributes.type, [
      "toRight",
      "toBottom",
      "toLeft",
      "toTop",
    ]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";

  }

  override [$toStyle]( startColor?:Color )
  {
    const startColor_s = startColor ? startColor[$toStyle]() : "#FFFFFF";
    const transf = this.type.replace(/([RBLT])/, " $1").toLowerCase();
    const endColor_s = this.color ? this.color[$toStyle]() : "#000000";
    return `linear-gradient(${transf}, ${startColor_s}, ${endColor_s})`;
  }
}

class LockDocument extends ContentObject 
{
  override [$content]:string;

  type;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "lockDocument" );
    this.id = attributes.id || "";
    this.type = getStringOption(attributes.type, ["optional", "required"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  override [$finalize]() 
  {
    this[$content] = getStringOption( this[$content], ["auto", "0", "1"] );
  }
}

class Manifest extends XFAObject 
{
  action;
  extras:unknown; //?:Extras;
  override ref = new XFAObjectArray();

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "manifest", /* hasChildren = */ true );
    this.action = getStringOption(attributes.action, [
      "include",
      "all",
      "exclude",
    ]);
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

export class Margin extends XFAObject
{
  bottomInset;
  leftInset;
  rightInset;
  topInset;
  extras:unknown; //?:Extras;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "margin", /* hasChildren = */ true );
    this.bottomInset = getMeasurement(attributes.bottomInset, "0");
    this.id = attributes.id || "";
    this.leftInset = getMeasurement(attributes.leftInset, "0");
    this.rightInset = getMeasurement(attributes.rightInset, "0");
    this.topInset = getMeasurement(attributes.topInset, "0");
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  override [$toStyle]()
  {
    return {
      margin:
        measureToString(this.topInset) +
        " " +
        measureToString(this.rightInset) +
        " " +
        measureToString(this.bottomInset) +
        " " +
        measureToString(this.leftInset),
    };
  }
}

class Mdp extends XFAObject 
{
  permissions;
  signatureType;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "mdp" );
    this.id = attributes.id || "";
    this.permissions = getInteger({
      data: attributes.permissions,
      defaultValue: 2,
      validate: x => x === 1 || x === 3,
    });
    this.signatureType = getStringOption(attributes.signatureType, [
      "filler",
      "author",
    ]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

class Medium extends XFAObject 
{
  imagingBBox;
  long;
  orientation;
  short;
  stock;
  trayIn;
  trayOut;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "medium" );
    this.id = attributes.id || "";
    this.imagingBBox = getBBox(attributes.imagingBBox);
    this.long = getMeasurement(attributes.long);
    this.orientation = getStringOption(attributes.orientation, [
      "portrait",
      "landscape",
    ]);
    this.short = getMeasurement(attributes.short);
    this.stock = attributes.stock || "";
    this.trayIn = getStringOption(attributes.trayIn, [
      "auto",
      "delegate",
      "pageFront",
    ]);
    this.trayOut = getStringOption(attributes.trayOut, ["auto", "delegate"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

class Message extends XFAObject 
{
  text = new XFAObjectArray();

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "message", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

class NumericEdit extends XFAObject 
{
  hScrollPolicy;
  override border:unknown | undefined = undefined; //?:Border;
  comb:unknown; //?:Comb;
  extras:unknown; //?:Extras;
  override margin = undefined; //?:Margin;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "numericEdit", /* hasChildren = */ true );
    this.hScrollPolicy = getStringOption(attributes.hScrollPolicy, [
      "auto",
      "off",
      "on",
    ]);
    this.id = attributes.id || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  override [$toHTML]( availableSpace?:AvailableSpace )
  {
    // TODO: incomplete.
    const style = toStyle(this, "border", "font", "margin");
    const field = <Field>this[$getParent]()![$getParent]();
    const html = {
      name: "input",
      attributes: {
        type: "text",
        fieldId: field[$uid],
        dataId: field[$data]?.[$uid] || field[$uid],
        class: ["xfaTextfield"],
        style,
        "aria-label": ariaLabel(field),
      },
    };

    return HTMLResult.success({
      name: "label",
      attributes: {
        class: ["xfaLabel"],
      },
      children: [html],
    });
  }
}

class Occur extends XFAObject 
{
  initial;
  max;
  min;
  extras:unknown; //?:Extras;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "occur", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.initial =
      attributes.initial !== ""
        ? getInteger({
            data: attributes.initial,
            defaultValue: "",
            validate: x => true,
          })
        : "";
    this.max =
      attributes.max !== ""
        ? getInteger({
            data: attributes.max,
            defaultValue: 1,
            validate: x => true,
          })
        : "";
    this.min =
      attributes.min !== ""
        ? getInteger({
            data: attributes.min,
            defaultValue: 1,
            validate: x => true,
          })
        : "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  override [$clean]() 
  {
    const parent = this[$getParent]();
    const originalMin = this.min;

    if (this.min === "") 
    {
      this.min =
        parent instanceof PageArea || parent instanceof PageSet ? 0 : 1;
    }
    if (this.max === "") 
    {
      if (originalMin === "") 
      {
        this.max =
          parent instanceof PageArea || parent instanceof PageSet ? -1 : 1;
      } 
      else {
        this.max = this.min;
      }
    }

    if (this.max !== -1 && this.max < this.min) 
    {
      this.max = this.min;
    }

    if (this.initial === "") 
    {
      this.initial = parent instanceof Template ? 1 : this.min;
    }
  }
}

class Oid extends StringObject 
{
  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "oid" );
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

class Oids extends XFAObject 
{
  type;
  oid = new XFAObjectArray();

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "oids", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.type = getStringOption(attributes.type, ["optional", "required"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

export interface OverflowExtra
{
  target:XFAObject | undefined;
  leader:XFAObject | undefined;
  trailer:XFAObject | undefined;
  addLeader:boolean;
  addTrailer:boolean;
}

export class Overflow extends XFAObject 
{
  leader;
  target;
  trailer;

  override [$extra]:OverflowExtra | undefined;
  
  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "overflow" );
    this.id = attributes.id || "";
    this.leader = attributes.leader || "";
    this.target = attributes.target || "";
    this.trailer = attributes.trailer || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  [$getExtra]():OverflowExtra 
  {
    if( !this[$extra] )
    {
      const parent = this[$getParent]();
      const root = this[$getTemplateRoot]()!;
      const target = root[$searchNode]( this.target, parent );
      const leader = root[$searchNode]( this.leader, parent );
      const trailer = root[$searchNode]( this.trailer, parent );
      this[$extra] = {
        target: target?.[0],
        leader: leader?.[0],
        trailer: trailer?.[0],
        addLeader: false,
        addTrailer: false,
      };
    }
    return this[$extra]!;
  }
}

export class PageArea extends XFAObject 
{
  blankOrNotBlank;
  initialNumber;
  numbered;
  oddOrEven;
  pagePosition;
  relevant;
  desc:unknown; //?:Desc;
  extras:unknown; //?:Extras;
  medium?:Medium;
  occur?:Occur;
  area = new XFAObjectArray();
  contentArea = new XFAObjectArray();
  draw = new XFAObjectArray();
  exclGroup = new XFAObjectArray();
  field = new XFAObjectArray();
  subform = new XFAObjectArray();

  override [$extra]:XFAExtra | undefined;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "pageArea", /* hasChildren = */ true );
    this.blankOrNotBlank = getStringOption(attributes.blankOrNotBlank, [
      "any",
      "blank",
      "notBlank",
    ]);
    this.id = attributes.id || "";
    this.initialNumber = getInteger({
      data: attributes.initialNumber,
      defaultValue: 1,
      validate: x => true,
    });
    this.name = attributes.name || "";
    this.numbered = getInteger({
      data: attributes.numbered,
      defaultValue: 1,
      validate: x => true,
    });
    this.oddOrEven = getStringOption(attributes.oddOrEven, [
      "any",
      "even",
      "odd",
    ]);
    this.pagePosition = getStringOption(attributes.pagePosition, [
      "any",
      "first",
      "last",
      "only",
      "rest",
    ]);
    this.relevant = getRelevant(attributes.relevant);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

   [$isUsable]()
  {
    if( !this[$extra] )
    {
      this[$extra] = {
        numberOfUse: 0,
      };
      return true;
    }
    return (
      !this.occur ||
      this.occur.max === -1 ||
      this[$extra]!.numberOfUse! < this.occur.max
    );
  }

  [$cleanPage]() { delete (<any>this)[$extra]; }

  [$getNextPage]():PageArea
  {
    if (!this[$extra]) 
    {
      this[$extra] = {
        numberOfUse: 0,
      };
    }

    const parent = <PageSet>this[$getParent]();
    if( parent.relation === "orderedOccurrence" ) 
    {
      if (this[$isUsable]()) 
      {
        this[$extra]!.numberOfUse! += 1;
        return this;
      }
    }

    return parent[$getNextPage]();
  }

  override [$getAvailableSpace]()
  {
    return this[$extra]!.space || { width: 0, height: 0 };
  }

  override [$toHTML]( availableSpace?:AvailableSpace )
  {
    // TODO: incomplete.
    if( !this[$extra] )
    {
      this[$extra] = {
        numberOfUse: 1,
      };
    }

    const children:XFAElData[] = [];
    this[$extra]!.children = children;

    const style = Object.create(null);
    if( this.medium?.short && this.medium?.long ) 
    {
      style.width = measureToString(this.medium.short);
      style.height = measureToString(this.medium.long);
      this[$extra]!.space = {
        width: this.medium.short,
        height: this.medium.long,
      };
      if (this.medium.orientation === "landscape") 
      {
        const x = style.width;
        style.width = style.height;
        style.height = x;
        this[$extra]!.space = {
          width: this.medium.long,
          height: this.medium.short,
        };
      }
    } 
    else {
      warn("XFA - No medium specified in pageArea: please file a bug.");
    }

    this[$childrenToHTML]({
      filter: new Set(["area", "draw", "field", "subform"]),
      include: true,
    });

    // contentarea must be the last container to be sure it is
    // on top of the others.
    this[$childrenToHTML]({
      filter: new Set(["contentArea"]),
      include: true,
    });

    return HTMLResult.success({
      name: "div",
      children,
      attributes: <XFAHTMLAttrs>{
        class: ["xfaPage"],
        id: this[$uid],
        style,
        xfaName: this.name,
      },
    });
  }
}

class PageSet extends XFAObject 
{
  duplexImposition;
  relation;
  relevant;
  extras:unknown; //?:Extras;
  occur?:Occur;
  pageArea = new XFAObjectArray();
  pageSet = new XFAObjectArray();

  override [$extra]:XFAExtra | undefined;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "pageSet", /* hasChildren = */ true );
    this.duplexImposition = getStringOption(attributes.duplexImposition, [
      "longEdge",
      "shortEdge",
    ]);
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.relation = getStringOption(attributes.relation, [
      "orderedOccurrence",
      "duplexPaginated",
      "simplexPaginated",
    ]);
    this.relevant = getRelevant(attributes.relevant);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  [$cleanPage]() 
  {
    for( const page of this.pageArea.children )
    {
      (<PageArea>page)[$cleanPage]();
    }
    for( const page of this.pageSet.children )
    {
      (<PageSet>page)[$cleanPage]();
    }
  }

  [$isUsable]() 
  {
    return (
      !this.occur ||
      this.occur.max === -1 ||
      this[$extra]!.numberOfUse! < this.occur.max
    );
  }

  [$getNextPage]():PageArea
  {
    if( !this[$extra] ) 
    {
      this[$extra] = {
        numberOfUse: 1,
        pageIndex: -1,
        pageSetIndex: -1,
      };
    }

    if( this.relation === "orderedOccurrence" ) 
    {
      if( this[$extra]!.pageIndex! + 1 < this.pageArea.children.length ) 
      {
        this[$extra]!.pageIndex! += 1;
        const pageArea = <PageArea>this.pageArea.children[ this[$extra]!.pageIndex! ];
        return pageArea[$getNextPage]();
      }

      if( this[$extra]!.pageSetIndex! + 1 < this.pageSet.children.length ) 
      {
        this[$extra]!.pageSetIndex! += 1;
        const pageSet = <PageSet>this.pageSet.children[ this[$extra]!.pageSetIndex! ]; 
        return pageSet[$getNextPage]();
      }

      if( this[$isUsable]() ) 
      {
        this[$extra]!.numberOfUse! += 1;
        this[$extra]!.pageIndex = -1;
        this[$extra]!.pageSetIndex = -1;
        return this[$getNextPage]();
      }

      const parent = this[$getParent]();
      if (parent instanceof PageSet) {
        return parent[$getNextPage]();
      }

      this[$cleanPage]();
      return this[$getNextPage]();
    }
    const pageNumber = this[$getTemplateRoot]()![$extra].pageNumber!;
    const parity = pageNumber % 2 === 0 ? "even" : "odd";
    const position = pageNumber === 0 ? "first" : "rest";

    let page = <PageArea | undefined>this.pageArea.children.find(
      p => (<PageArea>p).oddOrEven === parity && (<PageArea>p).pagePosition === position
    );
    if (page) return page;

    page = <PageArea | undefined>this.pageArea.children.find(
      p => (<PageArea>p).oddOrEven === "any" && (<PageArea>p).pagePosition === position
    );
    if (page) return page;

    page = <PageArea | undefined>this.pageArea.children.find(
      p => (<PageArea>p).oddOrEven === "any" && (<PageArea>p).pagePosition === "any"
    );
    if (page) return page;

    return <PageArea>this.pageArea.children[0];
  }
}

export class Para extends XFAObject 
{
  lineHeight;
  marginLeft;
  marginRight;
  orphans;
  preserve;
  radixOffset;
  spaceAbove;
  spaceBelow;
  tabDefault:string | number | undefined = undefined;
  tabStops;
  textIndent;
  override hAlign;
  vAlign;
  widows;
  hyphenation:unknown; //?:Hyphenation;

  hyphenatation?:XFAObject;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "para", /* hasChildren = */ true );
    this.hAlign = getStringOption(attributes.hAlign, [
      "left",
      "center",
      "justify",
      "justifyAll",
      "radix",
      "right",
    ]);
    this.id = attributes.id || <const>"";
    this.lineHeight = attributes.lineHeight
      ? getMeasurement(attributes.lineHeight, "0pt")
      : <const>"";
    this.marginLeft = attributes.marginLeft
      ? getMeasurement(attributes.marginLeft, "0pt")
      : <const>"";
    this.marginRight = attributes.marginRight
      ? getMeasurement(attributes.marginRight, "0pt")
      : <const>"";
    this.orphans = getInteger({
      data: attributes.orphans,
      defaultValue: 0,
      validate: x => x >= 0,
    });
    this.preserve = attributes.preserve || "";
    this.radixOffset = attributes.radixOffset
      ? getMeasurement(attributes.radixOffset, "0pt")
      : <const>"";
    this.spaceAbove = attributes.spaceAbove
      ? getMeasurement(attributes.spaceAbove, "0pt")
      : <const>"";
    this.spaceBelow = attributes.spaceBelow
      ? getMeasurement(attributes.spaceBelow, "0pt")
      : <const>"";
    this.tabDefault = attributes.tabDefault
      ? getMeasurement( <string | undefined>this.tabDefault )
      : <const>"";
    this.tabStops = (attributes.tabStops || "")
      .trim()
      .split(/\s+/)
      .map((x, i) => (i % 2 === 1 ? getMeasurement(x) : x));
    this.textIndent = attributes.textIndent
      ? getMeasurement(attributes.textIndent, "0pt")
      : <const>"";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.vAlign = getStringOption(attributes.vAlign, [
      "top",
      "bottom",
      "middle",
    ]);
    this.widows = getInteger({
      data: attributes.widows,
      defaultValue: 0,
      validate: x => x >= 0,
    });
  }

  override [$toStyle]()
  {
    const style = toStyle(this, "hAlign");
    if (this.marginLeft !== "") {
      style.paddingLeft = measureToString(this.marginLeft);
    }
    if (this.marginRight !== "") {
      style.paddingight = measureToString(this.marginRight);
    }
    if (this.spaceAbove !== "") {
      style.paddingTop = measureToString(this.spaceAbove);
    }
    if (this.spaceBelow !== "") {
      style.paddingBottom = measureToString(this.spaceBelow);
    }
    if (this.textIndent !== "") {
      style.textIndent = measureToString(this.textIndent);
      fixTextIndent( style );
    }

    if (this.lineHeight > 0) {
      style.lineHeight = measureToString(this.lineHeight);
    }

    if (this.tabDefault !== "") {
      style.tabSize = measureToString( this.tabDefault! );
    }

    if (this.tabStops.length > 0) {
      // TODO
    }

    if( this.hyphenatation )
    {
      Object.assign(style, this.hyphenatation[$toStyle]());
    }

    return style;
  }
}

class PasswordEdit extends XFAObject 
{
  hScrollPolicy;
  passwordChar;
  override border:unknown | undefined = undefined; //?:Border;
  extras:unknown; //?:Extras;
  override margin = undefined; //?:Margin;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "passwordEdit", /* hasChildren = */ true );
    this.hScrollPolicy = getStringOption(attributes.hScrollPolicy, [
      "auto",
      "off",
      "on",
    ]);
    this.id = attributes.id || "";
    this.passwordChar = attributes.passwordChar || "*";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

class Pattern extends XFAObject 
{
  type;
  color?:Color;
  extras:unknown; //?:Extras;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "pattern", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.type = getStringOption(attributes.type, [
      "crossHatch",
      "crossDiagonal",
      "diagonalLeft",
      "diagonalRight",
      "horizontal",
      "vertical",
    ]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  override [$toStyle]( startColor?:Color )
  {
    const startColor_s = startColor ? startColor[$toStyle]() : "#FFFFFF";
    const endColor_s = this.color ? this.color[$toStyle]() : "#000000";
    const width = 5;
    const cmd = "repeating-linear-gradient";
    const colors = `${startColor_s},${startColor_s} ${width}px,${endColor_s} ${width}px,${endColor_s} ${
      2 * width
    }px`;
    switch( this.type)
    {
      case "crossHatch": return `${cmd}(to top,${colors}) ${cmd}(to right,${colors})`;
      case "crossDiagonal": return `${cmd}(45deg,${colors}) ${cmd}(-45deg,${colors})`;
      case "diagonalLeft": return `${cmd}(45deg,${colors})`;
      case "diagonalRight": return `${cmd}(-45deg,${colors})`;
      case "horizontal": return `${cmd}(to top,${colors})`;
      case "vertical": return `${cmd}(to right,${colors})`;
    }

    return "";
  }
}

class Picture extends StringObject 
{
  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "picture" );
    this.id = attributes.id || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

class Proto extends XFAObject 
{
  appearanceFilter = new XFAObjectArray();
  arc = new XFAObjectArray();
  area = new XFAObjectArray();
  override assist = new XFAObjectArray();
  barcode = new XFAObjectArray();
  bindItems = new XFAObjectArray();
  bookend = new XFAObjectArray();
  boolean = new XFAObjectArray();
  override border = new XFAObjectArray();
  break = new XFAObjectArray();
  breakAfter = new XFAObjectArray();
  breakBefore = new XFAObjectArray();
  button = new XFAObjectArray();
  calculate = new XFAObjectArray();
  caption = new XFAObjectArray();
  certificate = new XFAObjectArray();
  certificates = new XFAObjectArray();
  checkButton = new XFAObjectArray();
  choiceList = new XFAObjectArray();
  color = new XFAObjectArray();
  comb = new XFAObjectArray();
  connect = new XFAObjectArray();
  contentArea = new XFAObjectArray();
  corner = new XFAObjectArray();
  date = new XFAObjectArray();
  dateTime = new XFAObjectArray();
  dateTimeEdit = new XFAObjectArray();
  decimal = new XFAObjectArray();
  defaultUi = new XFAObjectArray();
  desc = new XFAObjectArray();
  digestMethod = new XFAObjectArray();
  digestMethods = new XFAObjectArray();
  draw = new XFAObjectArray();
  edge = new XFAObjectArray();
  encoding = new XFAObjectArray();
  encodings = new XFAObjectArray();
  encrypt = new XFAObjectArray();
  encryptData = new XFAObjectArray();
  encryption = new XFAObjectArray();
  encryptionMethod = new XFAObjectArray();
  encryptionMethods = new XFAObjectArray();
  event = new XFAObjectArray();
  exData = new XFAObjectArray();
  exObject = new XFAObjectArray();
  exclGroup = new XFAObjectArray();
  execute = new XFAObjectArray();
  extras = new XFAObjectArray();
  field = new XFAObjectArray();
  fill = new XFAObjectArray();
  filter = new XFAObjectArray();
  float = new XFAObjectArray();
  font = new XFAObjectArray();
  format = new XFAObjectArray();
  handler = new XFAObjectArray();
  hyphenation = new XFAObjectArray();
  image = new XFAObjectArray();
  imageEdit = new XFAObjectArray();
  integer = new XFAObjectArray();
  issuers = new XFAObjectArray();
  items = new XFAObjectArray();
  keep = new XFAObjectArray();
  keyUsage = new XFAObjectArray();
  line = new XFAObjectArray();
  linear = new XFAObjectArray();
  lockDocument = new XFAObjectArray();
  manifest = new XFAObjectArray();
  override margin = new XFAObjectArray();
  mdp = new XFAObjectArray();
  medium = new XFAObjectArray();
  message = new XFAObjectArray();
  numericEdit = new XFAObjectArray();
  occur = new XFAObjectArray();
  oid = new XFAObjectArray();
  oids = new XFAObjectArray();
  overflow = new XFAObjectArray();
  pageArea = new XFAObjectArray();
  pageSet = new XFAObjectArray();
  override para = new XFAObjectArray();
  passwordEdit = new XFAObjectArray();
  pattern = new XFAObjectArray();
  picture = new XFAObjectArray();
  radial = new XFAObjectArray();
  reason = new XFAObjectArray();
  reasons = new XFAObjectArray();
  rectangle = new XFAObjectArray();
  override ref = new XFAObjectArray();
  script = new XFAObjectArray();
  setProperty = new XFAObjectArray();
  signData = new XFAObjectArray();
  signature = new XFAObjectArray();
  signing = new XFAObjectArray();
  solid = new XFAObjectArray();
  speak = new XFAObjectArray();
  stipple = new XFAObjectArray();
  subform = new XFAObjectArray();
  subformSet = new XFAObjectArray();
  subjectDN = new XFAObjectArray();
  subjectDNs = new XFAObjectArray();
  submit = new XFAObjectArray();
  text = new XFAObjectArray();
  textEdit = new XFAObjectArray();
  time = new XFAObjectArray();
  timeStamp = new XFAObjectArray();
  toolTip = new XFAObjectArray();
  override traversal = new XFAObjectArray();
  traverse = new XFAObjectArray();
  ui = new XFAObjectArray();
  validate = new XFAObjectArray();
  value = new XFAObjectArray();
  variables = new XFAObjectArray();

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "proto", /* hasChildren = */ true );
  }
}

class Radial extends XFAObject 
{
  type;
  color?:Color;
  extras:unknown; //?:Extras;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "radial", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.type = getStringOption(attributes.type, ["toEdge", "toCenter"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  override [$toStyle]( startColor?:Color )
  {
    const startColor_s = startColor ? startColor[$toStyle]() : "#FFFFFF";
    const endColor_s = this.color ? this.color[$toStyle]() : "#000000";
    const colors =
      this.type === "toEdge"
        ? `${startColor_s},${endColor_s}`
        : `${endColor_s},${startColor_s}`;
    return `radial-gradient(circle at center, ${colors})`;
  }
}

class Reason extends StringObject 
{
  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "reason" );
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

class Reasons extends XFAObject 
{
  type;
  reason = new XFAObjectArray();

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "reasons", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.type = getStringOption(attributes.type, ["optional", "required"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

class Rectangle extends XFAObject 
{
  hand;
  corner = new XFAObjectArray(4);
  edge = new XFAObjectArray(4);
  fill?:Fill;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "rectangle", /* hasChildren = */ true );
    this.hand = getStringOption(attributes.hand, ["even", "left", "right"]);
    this.id = attributes.id || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  override [$toHTML]( availableSpace?:AvailableSpace )
  {
    const edge = this.edge.children.length
      ? <Edge>this.edge.children[0]
      : new Edge({});
    const edgeStyle = edge[$toStyle]();
    const style = Object.create(null);
    if (this.fill && this.fill.presence === "visible") 
    {
      Object.assign(style, this.fill[$toStyle]());
    } 
    else {
      style.fill = "transparent";
    }
    style.strokeWidth = measureToString(
      edge.presence === "visible" ? edge.thickness : 0
    );
    style.stroke = edgeStyle.color;

    const corner = this.corner.children.length
      ? this.corner.children[0]
      : new Corner({});
    const cornerStyle = <XFAStyleData>corner[$toStyle]();

    const rect = {
      name: "rect",
      attributes: {
        xmlns: SVG_NS,
        width: "100%",
        height: "100%",
        x: 0,
        y: 0,
        rx: cornerStyle.radius,
        ry: cornerStyle.radius,
        style,
      },
    };

    const svg = {
      name: "svg",
      children: [rect],
      attributes: <XFASVGAttrs>{
        xmlns: SVG_NS,
        style: {
          overflow: "visible",
        },
        width: "100%",
        height: "100%",
      },
    };

    const parent = this[$getParent]()![$getParent]()!;
    if( hasMargin(parent) ) 
    {
      return HTMLResult.success({
        name: "div",
        attributes: {
          style: {
            display: "inline",
            width: "100%",
            height: "100%",
          },
        },
        children: [svg],
      });
    }

    svg.attributes.style!.position = "absolute";
    return HTMLResult.success(svg);
  }
}

class RefElement extends StringObject 
{
  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "ref" );
    this.id = attributes.id || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

class Script extends StringObject 
{
  binding;
  contentType;
  runAt;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "script" );
    this.binding = attributes.binding || "";
    this.contentType = attributes.contentType || "";
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.runAt = getStringOption(attributes.runAt, [
      "client",
      "both",
      "server",
    ]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

export class SetProperty extends XFAObject 
{
  connection;
  override ref;
  target;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "setProperty" );
    this.connection = attributes.connection || "";
    this.ref = attributes.ref || "";
    this.target = attributes.target || "";
  }
}

class SignData extends XFAObject 
{
  override operation;
  override ref;
  target;
  filter:unknown; //?:Filter
  manifest:unknown; //?:Manifest

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "signData", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.operation = getStringOption(attributes.operation, [
      "sign",
      "clear",
      "verify",
    ]);
    this.ref = attributes.ref || "";
    this.target = attributes.target || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

class Signature extends XFAObject 
{
  type;
  override border:unknown | undefined = undefined; //?:Border;
  extras:unknown; //?:Extras;
  filter:unknown; //?:Filter;
  manifest:unknown; //?:Manifest;
  override margin = undefined; //?:Margin;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "signature", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.type = getStringOption(attributes.type, ["PDF1.3", "PDF1.6"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

class Signing extends XFAObject 
{
  type;
  certificate = new XFAObjectArray();

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "signing", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.type = getStringOption(attributes.type, ["optional", "required"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

class Solid extends XFAObject 
{
  extras:unknown; //?:Extras;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "solid", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  override [$toStyle]( startColor?:Color )
  {
    return startColor ? startColor[$toStyle]() : "#FFFFFF";
  }
}

class Speak extends StringObject 
{
  disable;
  priority;
  rid;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "speak" );
    this.disable = getInteger({
      data: attributes.disable,
      defaultValue: 0,
      validate: x => x === 1,
    });
    this.id = attributes.id || "";
    this.priority = getStringOption(attributes.priority, [
      "custom",
      "caption",
      "name",
      "toolTip",
    ]);
    this.rid = attributes.rid || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

class Stipple extends XFAObject 
{
  rate;
  color:unknown; //?:Color;
  extras:unknown; //?:Extras;

  value?:XFAColor;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "stipple", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.rate = getInteger({
      data: attributes.rate,
      defaultValue: 50,
      validate: x => x >= 0 && x <= 100,
    });
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  override [$toStyle]( bgColor:Color )
  {
    const alpha = this.rate / 100;
    return Util.makeHexColor(
      Math.round( (<XFAColor>bgColor.value).r * (1 - alpha) + this.value!.r * alpha),
      Math.round( (<XFAColor>bgColor.value).g * (1 - alpha) + this.value!.g * alpha),
      Math.round( (<XFAColor>bgColor.value).b * (1 - alpha) + this.value!.b * alpha)
    );
  }
}

export class Subform extends XFAObject 
{
  access;
  allowMacro;
  override anchorType;
  override colSpan;
  override columnWidths;
  override h;
  override hAlign;
  override layout;
  locale;
  maxH;
  maxW;
  mergeMode;
  minH;
  minW;
  override presence;
  relevant;
  restoreState;
  scope;
  override w;
  override x;
  override y;
  override assist:Assist | undefined = undefined;
  bind?:Bind;
  bookend:unknown;
  override border:Border | undefined = undefined;
  break?:Break | undefined;
  calculate:unknown;
  desc:unknown;
  extras:unknown;
  keep?:Keep;
  override margin:Margin | undefined = undefined;
  occur?:Occur;
  overflow?:Overflow;
  pageSet?:PageSet;
  override para:unknown | undefined = undefined;
  override traversal:unknown | undefined = undefined;
  validate:unknown;
  variables:unknown;
  area = new XFAObjectArray();
  breakAfter = new XFAObjectArray();
  breakBefore = new XFAObjectArray();
  connect = new XFAObjectArray();
  draw = new XFAObjectArray();
  event = new XFAObjectArray();
  exObject = new XFAObjectArray();
  exclGroup = new XFAObjectArray();
  field = new XFAObjectArray();
  proto = new XFAObjectArray();
  setProperty = new XFAObjectArray();
  subform = new XFAObjectArray();
  subformSet = new XFAObjectArray();

  [$data]?:XmlObject;
  override [$extra]:XFAExtra;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "subform", /* hasChildren = */ true );
    this.access = getStringOption(attributes.access, [
      "open",
      "nonInteractive",
      "protected",
      "readOnly",
    ]);
    this.allowMacro = getInteger({
      data: attributes.allowMacro,
      defaultValue: 0,
      validate: x => x === 1,
    });
    this.anchorType = getStringOption(attributes.anchorType, [
      "topLeft",
      "bottomCenter",
      "bottomLeft",
      "bottomRight",
      "middleCenter",
      "middleLeft",
      "middleRight",
      "topCenter",
      "topRight",
    ]);
    this.colSpan = getInteger({
      data: attributes.colSpan,
      defaultValue: 1,
      validate: n => n >= 1 || n === -1,
    });
    this.columnWidths = (attributes.columnWidths || "")
      .trim()
      .split(/\s+/)
      .map(x => (x === "-1" ? -1 : getMeasurement(x)));
    this.h = attributes.h ? getMeasurement(attributes.h) : <const>"";
    this.hAlign = getStringOption(attributes.hAlign, [
      "left",
      "center",
      "justify",
      "justifyAll",
      "radix",
      "right",
    ]);
    this.id = attributes.id || "";
    this.layout = getStringOption(attributes.layout, [
      "position",
      "lr-tb",
      "rl-row",
      "rl-tb",
      "row",
      "table",
      "tb",
    ]);
    this.locale = attributes.locale || "";
    this.maxH = getMeasurement(attributes.maxH, "0pt");
    this.maxW = getMeasurement(attributes.maxW, "0pt");
    this.mergeMode = getStringOption(attributes.mergeMode, [
      "consumeData",
      "matchTemplate",
    ]);
    this.minH = getMeasurement(attributes.minH, "0pt");
    this.minW = getMeasurement(attributes.minW, "0pt");
    this.name = attributes.name || "";
    this.presence = getStringOption(attributes.presence, [
      "visible",
      "hidden",
      "inactive",
      "invisible",
    ]);
    this.relevant = getRelevant(attributes.relevant);
    this.restoreState = getStringOption(attributes.restoreState, [
      "manual",
      "auto",
    ]);
    this.scope = getStringOption(attributes.scope, ["name", "none"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.w = attributes.w ? getMeasurement(attributes.w) : <const>"";
    this.x = getMeasurement(attributes.x, "0pt");
    this.y = getMeasurement(attributes.y, "0pt");
  }

  override [$getSubformParent]():Subform
  {
    const parent = this[$getParent]();
    if( parent instanceof SubformSet )
    {
      return parent[$getSubformParent]();
    }
    return <Subform>parent;
  }

  override [$isBindable]() { return true; }

  override [$isThereMoreWidth]()
  {
    return (
      (this.layout.endsWith("-tb") &&
        this[$extra].attempt === 0 &&
        this[$extra].numberInLine! > 0) ||
      this[$getParent]()![$isThereMoreWidth]()
    );
  }

  override *[$getContainedChildren]()
  {
    // This function is overriden in order to fake that subforms under
    // this set are in fact under parent subform.
    yield* getContainedChildren(this);
  }

  override [$flushHTML]() { return flushHTML(this); }

  override [$addHTML]( html:XFAElData, bbox:rect_t ) { addHTML(this, html, bbox); }

  override [$getAvailableSpace]() { return getAvailableSpace(this); }

  override [$isSplittable]()
  {
    // We cannot cache the result here because the contentArea
    // can change.
    const parent = this[$getSubformParent]();
    if( !parent[$isSplittable]() ) return false;

    if( this[$extra]._isSplittable !== undefined )
    {
      return this[$extra]._isSplittable!;
    }

    if (this.layout === "position" || this.layout.includes("row")) 
    {
      this[$extra]._isSplittable = false;
      return false;
    }

    if (this.keep && this.keep.intact !== "none") 
    {
      this[$extra]._isSplittable = false;
      return false;
    }

    if( parent.layout?.endsWith("-tb") 
     && parent[$extra].numberInLine !== 0
    ) {
      // If parent can fit in w=100 and there's already an element which takes
      // 90 then we've 10 for this element. Suppose this element has a tb layout
      // and 5 elements have a width of 7 and the 6th has a width of 20:
      // then this element (and all its content) must move on the next line.
      // If this element is splittable then the first 5 children will stay
      // at the end of the line: we don't want that.
      return false;
    }

    this[$extra]._isSplittable = true;

    return true;
  }

  override [$toHTML]( availableSpace?:AvailableSpace )
  {
    setTabIndex(this);

    if (this.break) 
    {
      // break element is deprecated so plug it on one of its replacement
      // breakBefore or breakAfter.
      if (this.break.after !== "auto" || this.break.afterTarget !== "") {
        const node = new BreakAfter({
          targetType: this.break.after,
          target: this.break.afterTarget,
          startNew: this.break.startNew.toString(),
        });
        node[$globalData] = this[$globalData];
        this[$appendChild](node);
        this.breakAfter.push(node);
      }

      if (this.break.before !== "auto" || this.break.beforeTarget !== "") {
        const node = new BreakBefore({
          targetType: this.break.before,
          target: this.break.beforeTarget,
          startNew: this.break.startNew.toString(),
        });
        node[$globalData] = this[$globalData];
        this[$appendChild](node);
        this.breakBefore.push(node);
      }

      if (this.break.overflowTarget !== "") {
        const node = new Overflow({
          target: this.break.overflowTarget,
          leader: this.break.overflowLeader,
          trailer: this.break.overflowTrailer,
        });
        node[$globalData] = this[$globalData];
        this[$appendChild](node);
        (<any>this.overflow).push(node);
      }

      this[$removeChild](this.break);
      this.break = undefined;
    }

    if (this.presence === "hidden" || this.presence === "inactive") {
      return HTMLResult.EMPTY;
    }

    if( this.breakBefore.children.length > 1
     || this.breakAfter.children.length > 1
    ) {
      // Specs are always talking about the breakBefore element
      // and it doesn't really make sense to have several ones.
      warn(
        "XFA - Several breakBefore or breakAfter in subforms: please file a bug."
      );
    }

    if (this.breakBefore.children.length >= 1) 
    {
      const breakBefore = <BreakBefore>this.breakBefore.children[0];
      if( handleBreak(breakBefore) ) 
      {
        return HTMLResult.breakNode(breakBefore);
      }
    }

    if( this[$extra] && this[$extra].afterBreakAfter ) 
    {
      return HTMLResult.EMPTY;
    }

    // TODO: incomplete.
    fixDimensions(this);
    const children:XFAElData[] = [];
    const attributes:XFAHTMLAttrs = {
      id: this[$uid],
      class: [],
    };

    setAccess( this, attributes.class! );

    if (!this[$extra]) {
      this[$extra] = Object.create(null);
    }

    Object.assign( this[$extra], {
      children,
      line: null,
      attributes,
      attempt: 0,
      numberInLine: 0,
      availableSpace: {
        width: Math.min(this.w || Infinity, availableSpace!.width),
        height: Math.min(this.h || Infinity, availableSpace!.height),
      },
      width: 0,
      height: 0,
      prevHeight: 0,
      currentWidth: 0,
    });

    const root = this[$getTemplateRoot]()!;
    const savedNoLayoutFailure = root[$extra].noLayoutFailure;

    const isSplittable = this[$isSplittable]();
    if (!isSplittable) 
    {
      setFirstUnsplittable(this);
    }

    if( !checkDimensions(this, availableSpace!) )
    {
      return HTMLResult.FAILURE;
    }

    const filter = new Set([
      "area",
      "draw",
      "exclGroup",
      "field",
      "subform",
      "subformSet",
    ]);

    if (this.layout.includes("row")) 
    {
      const columnWidths = this[$getSubformParent]().columnWidths;
      if (Array.isArray(columnWidths) && columnWidths.length > 0) 
      {
        this[$extra].columnWidths = columnWidths;
        this[$extra].currentColumn = 0;
      }
    }

    const style = toStyle(
      this,
      "anchorType",
      "dimensions",
      "position",
      "presence",
      "border",
      "margin",
      "hAlign"
    );
    const classNames = ["xfaSubform"];
    const cl = layoutClass(this);
    if (cl) {
      classNames.push(cl);
    }

    attributes.style = style;
    attributes.class = classNames;

    if (this.name) 
    {
      attributes.xfaName = this.name;
    }

    if( this.overflow )
    {
      const overflowExtra = this.overflow[$getExtra]();
      if( overflowExtra.addLeader )
      {
        overflowExtra.addLeader = false;
        handleOverflow(this, overflowExtra.leader!, availableSpace);
      }
    }

    this[$pushPara]();
    const isLrTb = this.layout === "lr-tb" || this.layout === "rl-tb";
    const maxRun = isLrTb ? MAX_ATTEMPTS_FOR_LRTB_LAYOUT : 1;
    for(; this[$extra].attempt! < maxRun; this[$extra].attempt!++ )
    {
      if (isLrTb && this[$extra].attempt === MAX_ATTEMPTS_FOR_LRTB_LAYOUT - 1) 
      {
        // If the layout is lr-tb then having attempt equals to
        // MAX_ATTEMPTS_FOR_LRTB_LAYOUT-1 means that we're trying to layout
        // on the next line so this on is empty.
        this[$extra].numberInLine = 0;
      }
      const result = this[$childrenToHTML]({
        filter,
        include: true,
      });
      if (result.success) 
      {
        break;
      }
      if (result.isBreak()) 
      {
        this[$popPara]();
        return result;
      }
      if( isLrTb
       && this[$extra].attempt === 0
       && this[$extra].numberInLine === 0
       && !root[$extra].noLayoutFailure
      ) {
        // We're failing to put the first element on the line so no
        // need to test on the next line.
        // The goal is not only to avoid some useless checks but to avoid
        // bugs too: if a descendant managed to put a node and failed
        // on the next one, going to the next step here will imply to
        // visit the descendant again, clear [$extra].children and restart
        // on the failing node, consequently the first node just disappears
        // because it has never been flushed.
        this[$extra].attempt = maxRun;
        break;
      }
    }

    this[$popPara]();
    if (!isSplittable) 
    {
      unsetFirstUnsplittable(this);
    }
    root[$extra].noLayoutFailure = savedNoLayoutFailure;

    if (this[$extra].attempt === maxRun) 
    {
      if( this.overflow )
      {
        this[$getTemplateRoot]()![$extra].overflowNode = this.overflow;
      }

      if (!isSplittable) 
      {
        // Since a new try will happen in a new container with maybe
        // new dimensions, we invalidate already layed out components.
        delete (<any>this)[$extra];
      }
      return HTMLResult.FAILURE;
    }

    if (this.overflow) 
    {
      const overflowExtra = this.overflow[$getExtra]();
      if (overflowExtra.addTrailer) 
      {
        overflowExtra.addTrailer = false;
        handleOverflow(this, overflowExtra.trailer!, availableSpace);
      }
    }

    let marginH = 0;
    let marginV = 0;
    if (this.margin) {
      marginH = this.margin.leftInset + this.margin.rightInset;
      marginV = this.margin.topInset + this.margin.bottomInset;
    }

    const width = Math.max( this[$extra].width! + marginH, this.w || 0 );
    const height = Math.max( this[$extra].height! + marginV, this.h || 0 );
    const bbox:rect_t = [this.x, this.y, width, height];

    if (this.w === "") {
      style.width = measureToString(width);
    }
    if (this.h === "") {
      style.height = measureToString(height);
    }

    if( (style.width === "0px" || style.height === "0px")
     && children.length === 0
    ) {
      return HTMLResult.EMPTY;
    }

    const html = {
      name: "div",
      attributes,
      children,
    };

    applyAssist(this, attributes);

    const result = HTMLResult.success( createWrapper(this, html), bbox );

    if (this.breakAfter.children.length >= 1) 
    {
      const breakAfter = <BreakAfter>this.breakAfter.children[0];
      if( handleBreak(breakAfter) ) 
      {
        this[$extra].afterBreakAfter = result;
        return HTMLResult.breakNode(breakAfter);
      }
    }

    delete (<any>this)[$extra];

    return result;
  }
}

class SubformSet extends XFAObject 
{
  relation;
  relevant;
  bookend:unknown; //?:Bookend;
  break?:Break;
  desc:unknown; //?:Desc;
  extras:unknown; //?:Extras;
  occur:unknown; //?:Occur;
  overflow:unknown;
  breakAfter = new XFAObjectArray();
  breakBefore = new XFAObjectArray();
  subform = new XFAObjectArray();
  subformSet = new XFAObjectArray();

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "subformSet", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.relation = getStringOption(attributes.relation, [
      "ordered",
      "choice",
      "unordered",
    ]);
    this.relevant = getRelevant(attributes.relevant);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";

    // TODO: need to handle break stuff and relation.
  }

  override *[$getContainedChildren]()
  {
    // This function is overriden in order to fake that subforms under
    // this set are in fact under parent subform.
    yield* getContainedChildren(this);
  }

  override [$getSubformParent]():Subform
  {
    let parent = this[$getParent]();
    while( !(parent instanceof Subform) )
    {
      parent = parent![$getParent]();
    }
    return parent;
  }

  override [$isBindable]() { return true; }
}

class SubjectDN extends ContentObject 
{
  override [$content]:string | Map<string, string>;

  delimiter;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "subjectDN" );
    this.delimiter = attributes.delimiter || ",";
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  override [$finalize]() 
  {
    this[$content] = new Map(
      (<string>this[$content]).split(this.delimiter).map(kv => {
        const kv_a = <[string,string]>kv.split("=", 2);
        kv_a[0] = kv_a[0].trim();
        return kv_a;
      })
    );
  }
}

class SubjectDNs extends XFAObject 
{
  type;
  subjectDN = new XFAObjectArray();

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "subjectDNs", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.type = getStringOption(attributes.type, ["optional", "required"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

class Submit extends XFAObject 
{
  embedPDF;
  format;
  target;
  textEncoding;
  xdpContent;
  encrypt:unknown; //?:Encrypt;
  encryptData = new XFAObjectArray();
  signData = new XFAObjectArray();

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "submit", /* hasChildren = */ true );
    this.embedPDF = getInteger({
      data: attributes.embedPDF,
      defaultValue: 0,
      validate: x => x === 1,
    });
    this.format = getStringOption(attributes.format, [
      "xdp",
      "formdata",
      "pdf",
      "urlencoded",
      "xfd",
      "xml",
    ]);
    this.id = attributes.id || "";
    this.target = attributes.target || "";
    this.textEncoding = getKeyword({
      data: attributes.textEncoding
        ? attributes.textEncoding.toLowerCase()
        : "",
      defaultValue: "",
      validate: k =>
        [
          "utf-8",
          "big-five",
          "fontspecific",
          "gbk",
          "gb-18030",
          "gb-2312",
          "ksc-5601",
          "none",
          "shift-jis",
          "ucs-2",
          "utf-16",
        ].includes(k) || !!k.match(/iso-8859-\d{2}/),
      });
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.xdpContent = attributes.xdpContent || "";
  }
}

/** @final */
export class Template extends XFAObject 
{
  baseProfile;
  extras:unknown; //?:Extras;

  // Spec is unclear:
  //  A container element that describes a single subform capable of
  //  enclosing other containers.
  // Can we have more than one subform ?
  subform = new XFAObjectArray();

  override [$extra]:XFAExtra;
  [$ids]?:XFAIds;
  leader?:string;
  occur?:Occur;
  trailer?:string;
  targetType?:string;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "template", /* hasChildren = */ true );
    this.baseProfile = getStringOption(attributes.baseProfile, [
      "full",
      "interactiveForms",
    ]);
  }

  override [$finalize]() 
  {
    if (this.subform.children.length === 0) 
    {
      warn("XFA - No subforms in template node.");
    }
    if (this.subform.children.length >= 2) 
    {
      warn("XFA - Several subforms in template node: please file a bug.");
    }
    this[$tabIndex] = DEFAULT_TAB_INDEX;
  }

  override [$isSplittable]() { return true; }

  [$searchNode]( expr:string, container?:XFAObject )
  {
    if( expr.startsWith("#") ) 
    {
      // This is an id.
      return [ this[$ids]!.get(expr.slice(1))! ];
    }
    return <XFAObject[] | undefined>searchNode( this, container, expr, true, true );
  }

  /**
   * This function is a generator because the conversion into
   * pages is done asynchronously and we want to save the state
   * of the function where we were in the previous iteration.
   */
  *[$toPages]()
  {
    if( !this.subform.children.length )
    {
      return HTMLResult.success({
        name: "div",
        children: [],
      });
    }
    this[$extra] = {
      overflowNode: undefined,
      firstUnsplittable: undefined,
      currentContentArea: undefined,
      currentPageArea: undefined,
      noLayoutFailure: false,
      pageNumber: 1,
      pagePosition: "first",
      oddOrEven: "odd",
      blankOrNotBlank: "nonBlank",
      paraStack: [],
    };

    const root = <Subform>this.subform.children[0];
    root.pageSet![$cleanPage]();

    const pageAreas = <PageArea[]>root.pageSet!.pageArea.children;
    const mainHtml = {
      name: "div",
      children: <XFAElData[]>[],
    };

    let pageArea:PageArea | undefined;
    let breakBefore:BreakBefore | Break | undefined;
    let breakBeforeTarget:string | undefined;
    if( root.breakBefore.children.length >= 1 ) 
    {
      breakBefore = <BreakBefore>root.breakBefore.children[0];
      breakBeforeTarget = breakBefore.target;
    } 
    else if( root.subform.children.length >= 1 
     && (<Subform | SubformSet>root.subform.children[0]).breakBefore.children.length >= 1
    ) {
      breakBefore = <BreakBefore>(<Subform | SubformSet>root.subform.children[0]).breakBefore.children[0];
      breakBeforeTarget = breakBefore.target;
    } 
    else if( root.break?.beforeTarget ) 
    {
      breakBefore = root.break;
      breakBeforeTarget = breakBefore.beforeTarget;
    } 
    else if ( root.subform.children.length >= 1 
      && (<Subform | SubformSet>root.subform.children[0]).break?.beforeTarget
    ) {
      breakBefore = (<Subform | SubformSet>root.subform.children[0]).break!;
      breakBeforeTarget = breakBefore.beforeTarget;
    }

    if( breakBefore )
    {
      const target = this[$searchNode](
        breakBeforeTarget!,
        breakBefore[$getParent]()
      );
      if( target?.[0] instanceof PageArea ) 
      {
        pageArea = target[0];
        // Consume breakBefore.
        breakBefore[$extra] = {};
      }
    }

    if( !pageArea )
    {
      pageArea = pageAreas[0];
    }

    pageArea[$extra] = {
      numberOfUse: 1,
    };

    const pageAreaParent = <PageSet>pageArea[$getParent]();
    pageAreaParent[$extra] = {
      numberOfUse: 1,
      pageIndex: pageAreaParent.pageArea.children.indexOf( pageArea ),
      pageSetIndex: 0,
    };

    let targetPageArea;
    let leader:XFAObject | undefined;
    let trailer:XFAObject | undefined;
    let hasSomething = true;
    let hasSomethingCounter = 0;
    let startIndex = 0;

    while(true)
    {
      if( !hasSomething )
      {
        mainHtml.children.pop();
        // Nothing has been added in the previous page
        if( ++hasSomethingCounter === MAX_EMPTY_PAGES )
        {
          warn("XFA - Something goes wrong: please file a bug.");
          // return new HTMLResult( false, mainHtml, undefined, this );
          return mainHtml;
        }
      } 
      else {
        hasSomethingCounter = 0;
      }

      targetPageArea = undefined;
      this[$extra].currentPageArea = pageArea;
      const page = <XFAElObjBase>pageArea![$toHTML]().html;
      mainHtml.children.push( page );

      if( leader ) 
      {
        this[$extra].noLayoutFailure = true;
        page.children!.push( (<HTMLResult>leader[$toHTML]( pageArea![$extra]!.space )).html! );
        leader = undefined;
      }

      if( trailer ) 
      {
        this[$extra].noLayoutFailure = true;
        page.children!.push( (<HTMLResult>trailer[$toHTML]( pageArea![$extra]!.space )).html! );
        trailer = undefined;
      }

      const contentAreas = <ContentArea[]>pageArea!.contentArea.children;
      const htmlContentAreas = <XFAElObj[]>page.children!.filter( node =>
        (<XFAElObj>node).attributes!.class!.includes("xfaContentarea")
      );

      hasSomething = false;
      this[$extra].firstUnsplittable = undefined;
      this[$extra].noLayoutFailure = false;

      const flush = ( index:number ) => {
        const html = root[$flushHTML]();
        if( html )
        {
          hasSomething =
            hasSomething || !!(html.children && html.children.length !== 0);
          htmlContentAreas[index].children!.push(html);
        }
      };

      for( let i = startIndex, ii = contentAreas.length; i < ii; i++ )
      {
        const contentArea = (this[$extra].currentContentArea = contentAreas[i]);
        const space = <AvailableSpace>{ width: contentArea.w, height: contentArea.h };
        startIndex = 0;

        if( leader ) 
        {
          htmlContentAreas[i].children!.push( (<HTMLResult>leader[$toHTML](space)).html! );
          leader = undefined;
        }

        if( trailer ) 
        {
          htmlContentAreas[i].children!.push( (<HTMLResult>trailer[$toHTML](space)).html! );
          trailer = undefined;
        }

        const html = root[$toHTML](space);
        if (html.success) 
        {
          if (html.html) 
          {
            hasSomething =
              hasSomething ||
              !!((<XFAElObj>html.html).children 
              && (<XFAElObj>html.html).children!.length !== 0);
            htmlContentAreas[i].children!.push(html.html);
          } 
          else if (!hasSomething && mainHtml.children.length > 1) 
          {
            mainHtml.children.pop();
          }
          // return HTMLResult.success( mainHtml );
          return mainHtml;
        }

        if (html.isBreak()) 
        {
          const node = html.breakNode!;
          flush(i);

          if( node.targetType === "auto" ) continue;

          if( node.leader ) 
          {
            const leader_a = this[$searchNode]( node.leader, node[$getParent]() );
            leader = leader_a ? leader_a[0] : undefined;
          }

          if( node.trailer ) 
          {
            const trailer_a = this[$searchNode]( node.trailer, node[$getParent]() );
            trailer = trailer_a ? trailer_a[0] : undefined;
          }

          if( node.targetType === "pageArea" )
          {
            targetPageArea = (<XFAExtra>node[$extra]).target;
            i = Infinity;
          } 
          else if( !(<XFAExtra>node[$extra]).target ) 
          {
            // We stay on the same page.
            i = (<XFAExtra>node[$extra]).index!;
          } 
          else {
            targetPageArea = (<XFAExtra>node[$extra]).target;
            startIndex = (<XFAExtra>node[$extra]).index! + 1;
            i = Infinity;
          }

          continue;
        }

        if( this[$extra].overflowNode ) 
        {
          const node = this[$extra].overflowNode!;
          this[$extra].overflowNode = undefined;

          const overflowExtra = node[$getExtra]();
          const target = overflowExtra.target;
          overflowExtra.addLeader = overflowExtra.leader !== undefined;
          overflowExtra.addTrailer = overflowExtra.trailer !== undefined;

          flush(i);

          const currentIndex = i;

          i = Infinity;
          if( target instanceof PageArea )
          {
            // We must stop the contentAreas filling and go to the next page.
            targetPageArea = target;
          } 
          else if( target instanceof ContentArea )
          {
            const index = contentAreas.findIndex(e => e === target);
            if( index !== -1 )
            {
              if( index > currentIndex )
              {
                // In the next loop iteration `i` will be incremented, note the
                // `continue` just below, hence we need to subtract one here.
                i = index - 1;
              }
              else {
                // The targetted contentArea has already been filled
                // so create a new page.
                startIndex = index;
              }
            } 
            else {
              targetPageArea = <PageArea>target[$getParent]();
              startIndex = targetPageArea.contentArea.children.findIndex(
                e => e === target
              );
            }
          }
          continue;
        }

        flush(i);
      }

      this[$extra].pageNumber! += 1;
      if( targetPageArea )
      {
        if( (<PageArea>targetPageArea)[$isUsable]() ) 
        {
          (<PageArea>targetPageArea)[$extra]!.numberOfUse! += 1;
        } 
        else {
          targetPageArea = undefined;
        }
      }
      pageArea = <PageArea | undefined>targetPageArea || pageArea![$getNextPage]();
      yield null;
    }
  }
}

export class Text extends ContentObject implements XFAValue
{
  override [$content]:string | XFAObject;

  maxChars;
  rid;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "text" );
    this.id = attributes.id || "";
    this.maxChars = getInteger({
      data: attributes.maxChars,
      defaultValue: 0,
      validate: x => x >= 0,
    });
    this.name = attributes.name || "";
    this.rid = attributes.rid || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  override [$acceptWhitespace]() { return true; }

  override [$onChild]( child:XFAObject )
  {
    if( child[$namespaceId] === NamespaceIds.xhtml.id ) 
    {
      this[$content] = child;
      return true;
    }
    warn(`XFA - Invalid content in Text: ${child[$nodeName]}.`);
    return false;
  }

  override [$onText]( str:string )
  {
    if( this[$content] instanceof XFAObject ) return;

    super[$onText](str);
  }

  override [$finalize]() 
  {
    if( typeof this[$content] === "string" )
    {
      this[$content] = (<string>this[$content]).replace(/\r\n/g, "\n");
    }
  }

  [$getExtra]() 
  {
    if (typeof this[$content] === "string") 
    {
      return (<string>this[$content])
        .split(/[\u2029\u2028\n]/)
        .reduce((acc, line) => {
          if (line) 
          {
            acc.push(line);
          }
          return acc;
        }, <string[]>[])
        .join("\n");
    }
    return (<XFAObject>this[$content])[$text]();
  }

  override [$toHTML]( availableSpace?:AvailableSpace )
  {
    if (typeof this[$content] === "string") 
    {
      // \u2028 is a line separator.
      // \u2029 is a paragraph separator.
      const html = <XFAElObj>valueToHtml( <string>this[$content] ).html;

      if( (<string>this[$content]).includes("\u2029") ) 
      {
        // We've plain text containing a paragraph separator
        // so convert it into a set of <p>.
        html.name = "div";
        html.children = [];
        (<string>this[$content])
          .split("\u2029")
          .map(para =>
            // Convert a paragraph into a set of <span> (for lines)
            // separated by <br>.
            para.split(/[\u2028\n]/).reduce((acc, line) => {
              acc.push(
                {
                  name: "span",
                  value: line,
                },
                {
                  name: "br",
                }
              );
              return acc;
            }, <{name:string;value?:string;}[]>[])
          )
          .forEach(lines => {
            html.children!.push({
              name: "p",
              children: lines,
            });
          });
      } 
      else if( /[\u2028\n]/.test(<string>this[$content]) ) 
      {
        html.name = "div";
        html.children = [];
        // Convert plain text into a set of <span> (for lines)
        // separated by <br>.
        (<string>this[$content]).split(/[\u2028\n]/).forEach( line => {
          html.children!.push(
            {
              name: "span",
              value: line,
            },
            {
              name: "br",
            }
          );
        });
      }

      return HTMLResult.success(html);
    }

    return (<XFAObject>this[$content])[$toHTML]( availableSpace );
  }
}

class TextEdit extends XFAObject 
{
  allowRichText;
  hScrollPolicy;
  multiLine:string | number;
  vScrollPolicy
  override border:unknown | undefined = undefined; //?:Border;
  comb:unknown; //?:Comb;
  extras:unknown; //?:Extras;
  override margin = undefined; //?:Margin;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "textEdit", /* hasChildren = */ true );
    this.allowRichText = getInteger({
      data: attributes.allowRichText,
      defaultValue: 0,
      validate: x => x === 1,
    });
    this.hScrollPolicy = getStringOption(attributes.hScrollPolicy, [
      "auto",
      "off",
      "on",
    ]);
    this.id = attributes.id || "";
    this.multiLine = getInteger({
      data: attributes.multiLine,
      defaultValue: "",
      validate: x => x === 0 || x === 1,
    });
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.vScrollPolicy = getStringOption(attributes.vScrollPolicy, [
      "auto",
      "off",
      "on",
    ]);
  }

  override [$toHTML]( availableSpace?:AvailableSpace )
  {
    // TODO: incomplete.
    const style = toStyle(this, "border", "font", "margin");
    let html;
    const field = <Field>this[$getParent]()![$getParent]();
    if (this.multiLine === "") 
    {
      this.multiLine = field instanceof Draw ? 1 : 0;
    }
    if (this.multiLine === 1) 
    {
      html = {
        name: "textarea",
        attributes: {
          dataId: field[$data]?.[$uid] || field[$uid],
          fieldId: field[$uid],
          class: ["xfaTextfield"],
          style,
          "aria-label": ariaLabel( <Field>field ),
        },
      };
    } 
    else {
      html = {
        name: "input",
        attributes: {
          type: "text",
          dataId: field[$data]?.[$uid] || field[$uid],
          fieldId: field[$uid],
          class: ["xfaTextfield"],
          style,
          "aria-label": ariaLabel( <Field>field ),
        },
      };
    }

    return HTMLResult.success(<XFAHTMLObj>{
      name: "label",
      attributes: {
        class: ["xfaLabel"],
      },
      children: [html],
    });
  }
}

class Time extends StringObject 
{
  override [$content]:string | Date;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "time" );
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  override [$finalize]() 
  {
    // TODO: need to handle the string as a time and not as a date.
    const date = (<string>this[$content]).trim();
    this[$content] = date ? new Date(date) : "";
  }

  override [$toHTML]( availableSpace?:AvailableSpace )
  {
    return valueToHtml(this[$content] ? this[$content].toString() : "");
  }
}

class TimeStamp extends XFAObject 
{
  server;
  type;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "timeStamp" );
    this.id = attributes.id || "";
    this.server = attributes.server || "";
    this.type = getStringOption(attributes.type, ["optional", "required"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

class ToolTip extends StringObject 
{
  override [$content]:string;

  rid;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "toolTip" );
    this.id = attributes.id || "";
    this.rid = attributes.rid || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

class Traversal extends XFAObject 
{
  extras:unknown; //?:Extras;
  traverse = new XFAObjectArray();

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "traversal", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

class Traverse extends XFAObject 
{
  override operation;
  override ref;
  extras:unknown; //?:Extras;
  script:unknown; //?:Script

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "traverse", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.operation = getStringOption(attributes.operation, [
      "next",
      "back",
      "down",
      "first",
      "left",
      "right",
      "up",
    ]);
    this.ref = attributes.ref || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";

    // SOM expression: see page 94
    Reflect.defineProperty( this, "name", {
      get:() => this.operation,
    });
  }

  override [$isTransparent]() { return false; }
}

class Ui extends XFAObject 
{
  extras:unknown; //?:Extras;
  picture:unknown; //?:Picture;

  // One-of properties
  barcode:unknown;
  button?:Button;
  checkButton?:CheckButton;
  choiceList?:ChoiceList;
  dateTimeEdit:unknown;
  defaultUi:unknown;
  imageEdit:unknown;
  numericEdit:unknown;
  passwordEdit:unknown;
  signature:unknown;
  textEdit?:TextEdit;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "ui", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  [$getExtra]():XFAObject | undefined
  {
    if( this[$extra] === undefined )
    {
      for( const name of Object.getOwnPropertyNames(this) )
      {
        if (name === "extras" || name === "picture") continue;

        const obj = (<any>this)[name];
        if( !(obj instanceof XFAObject) ) continue;

        this[$extra] = obj;
        return obj;
      }
      this[$extra] = undefined;
    }
    return <XFAObject | undefined>this[$extra];
  }

  override [$toHTML]( availableSpace?:AvailableSpace )
  {
    // TODO: picture.
    const obj = this[$getExtra]();
    if( obj )
    {
      return obj[$toHTML]( availableSpace );
    }
    return HTMLResult.EMPTY;
  }
}

class Validate extends XFAObject 
{
  formatTest;
  nullTest;
  scriptTest;
  extras:unknown; //?:Extras;
  message:unknown; //?:Message;
  picture:unknown; //?:Picture;
  script:unknown; //?:Script

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "validate", /* hasChildren = */ true );
    this.formatTest = getStringOption(attributes.formatTest, [
      "warning",
      "disabled",
      "error",
    ]);
    this.id = attributes.id || "";
    this.nullTest = getStringOption(attributes.nullTest, [
      "disabled",
      "error",
      "warning",
    ]);
    this.scriptTest = getStringOption(attributes.scriptTest, [
      "error",
      "disabled",
      "warning",
    ]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}

export class Value extends XFAObject 
{
  override;
  relevant;

  // One-of properties
  arc:unknown;
  boolean:unknown;
  date:unknown;
  dateTime:unknown;
  decimal:unknown;
  exData?:ExData
  float:unknown;
  image?:Image;
  integer:unknown;
  line:unknown;
  rectangle:unknown;
  text?:Text;
  time:unknown;

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "value", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.override = getInteger({
      data: attributes.override,
      defaultValue: 0,
      validate: x => x === 1,
    });
    this.relevant = getRelevant(attributes.relevant);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  override [$setValue]( value:XFAValue )
  {
    const parent = this[$getParent]();
    if( parent instanceof Field )
    {
      if( parent.ui && parent.ui.imageEdit )
      {
        if( !this.image )
        {
          this.image = new Image({});
          this[$appendChild](this.image);
        }
        this.image[$content] = <string>value[$content];
        return;
      }
    }

    const valueName = value[$nodeName];
    if( (<any>this)[valueName] !== null 
     && (<any>this)[valueName] !== undefined
    ) {
      (<any>this)[valueName][$content] = value[$content];
      return;
    }

    // Reset all the properties.
    for( const name of Object.getOwnPropertyNames(this) )
    {
      const obj = (<any>this)[name];
      if( obj instanceof XFAObject )
      {
        (<any>this)[name] = undefined;
        this[$removeChild](obj);
      }
    }

    (<any>this)[value[$nodeName]] = value;
    this[$appendChild](value);
  }

  override [$text]()
  {
    if( this.exData )
    {
      if( typeof this.exData[$content] === "string" )
      {
        return (<string>this.exData[$content]).trim();
      }
      return (<XhtmlObject>this.exData[$content])[$text]()!.trim();
    }
    for( const name of Object.getOwnPropertyNames(this) )
    {
      if (name === "image") continue;

      const obj = (<any>this)[name];
      if( obj instanceof XFAObject )
      {
        return (obj[$content] || "").toString().trim();
      }
    }
    return undefined;
  }

  override [$toHTML]( availableSpace?:AvailableSpace )
  {
    for (const name of Object.getOwnPropertyNames(this)) {
      const obj = (<any>this)[name];
      if (!(obj instanceof XFAObject)) {
        continue;
      }

      return obj[$toHTML](availableSpace);
    }

    return HTMLResult.EMPTY;
  }
}

class Variables extends XFAObject 
{
  boolean = new XFAObjectArray();
  date = new XFAObjectArray();
  dateTime = new XFAObjectArray();
  decimal = new XFAObjectArray();
  exData = new XFAObjectArray();
  float = new XFAObjectArray();
  image = new XFAObjectArray();
  integer = new XFAObjectArray();
  manifest = new XFAObjectArray();
  script = new XFAObjectArray();
  text = new XFAObjectArray();
  time = new XFAObjectArray();

  constructor( attributes:XFAAttrs )
  {
    super( TEMPLATE_NS_ID, "variables", /* hasChildren = */ true );
    this.id = attributes.id || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }

  override [$isTransparent]() { return true; }
}

export type XFANsTemplate = typeof TemplateNamespace;
type TemplateName = Exclude<keyof XFANsTemplate, symbol>;
export const TemplateNamespace = 
{
  [$buildXFAObject]( name:string, attributes:XFAAttrs )
  {
    if( TemplateNamespace.hasOwnProperty(name) ) 
    {
      const node = TemplateNamespace[<TemplateName>name]( attributes );
      node[$setSetAttributes]( attributes );
      return node;
    }
    return undefined;
  },
  
  appearanceFilter( attrs:XFAAttrs ) { return new AppearanceFilter(attrs); },
  arc( attrs:XFAAttrs ) { return new Arc(attrs); },
  area( attrs:XFAAttrs ) { return new Area(attrs); },
  assist( attrs:XFAAttrs ) { return new Assist(attrs); },
  barcode( attrs:XFAAttrs ) { return new Barcode(attrs); },
  bind( attrs:XFAAttrs ) { return new Bind(attrs); },
  bindItems( attrs:XFAAttrs ) { return new BindItems(attrs); },
  bookend( attrs:XFAAttrs ) { return new Bookend(attrs); },
  boolean( attrs:XFAAttrs ) { return new BooleanElement(attrs); },
  border( attrs:XFAAttrs ) { return new Border(attrs); },
  break( attrs:XFAAttrs ) { return new Break(attrs); },
  breakAfter( attrs:XFAAttrs ) { return new BreakAfter(attrs); },
  breakBefore( attrs:XFAAttrs ) { return new BreakBefore(attrs); },
  button( attrs:XFAAttrs ) { return new Button(attrs); },
  calculate( attrs:XFAAttrs ) { return new Calculate(attrs); },
  caption( attrs:XFAAttrs ) { return new Caption(attrs); },
  certificate( attrs:XFAAttrs ) { return new Certificate(attrs); },
  certificates( attrs:XFAAttrs ) { return new Certificates(attrs); },
  checkButton( attrs:XFAAttrs ) { return new CheckButton(attrs); },
  choiceList( attrs:XFAAttrs ) { return new ChoiceList(attrs); },
  color( attrs:XFAAttrs ) { return new Color(attrs); },
  comb( attrs:XFAAttrs ) { return new Comb(attrs); },
  connect( attrs:XFAAttrs ) { return new Connect(attrs); },
  contentArea( attrs:XFAAttrs ) { return new ContentArea(attrs); },
  corner( attrs:XFAAttrs ) { return new Corner(attrs); },
  date( attrs:XFAAttrs ) { return new DateElement(attrs); },
  dateTime( attrs:XFAAttrs ) { return new DateTime(attrs); },
  dateTimeEdit( attrs:XFAAttrs ) { return new DateTimeEdit(attrs); },
  decimal( attrs:XFAAttrs ) { return new Decimal(attrs); },
  defaultUi( attrs:XFAAttrs ) { return new DefaultUi(attrs); },
  desc( attrs:XFAAttrs ) { return new Desc(attrs); },
  digestMethod( attrs:XFAAttrs ) { return new DigestMethod(attrs); },
  digestMethods( attrs:XFAAttrs ) { return new DigestMethods(attrs); },
  draw( attrs:XFAAttrs ) { return new Draw(attrs); },
  edge( attrs:XFAAttrs ) { return new Edge(attrs); },
  encoding( attrs:XFAAttrs ) { return new Encoding(attrs); },
  encodings( attrs:XFAAttrs ) { return new Encodings(attrs); },
  encrypt( attrs:XFAAttrs ) { return new Encrypt(attrs); },
  encryptData( attrs:XFAAttrs ) { return new EncryptData(attrs); },
  encryption( attrs:XFAAttrs ) { return new Encryption(attrs); },
  encryptionMethod( attrs:XFAAttrs ) { return new EncryptionMethod(attrs); },
  encryptionMethods( attrs:XFAAttrs ) { return new EncryptionMethods(attrs); },
  event( attrs:XFAAttrs ) { return new Event(attrs); },
  exData( attrs:XFAAttrs ) { return new ExData(attrs); },
  exObject( attrs:XFAAttrs ) { return new ExObject(attrs); },
  exclGroup( attrs:XFAAttrs ) { return new ExclGroup(attrs); },
  execute( attrs:XFAAttrs ) { return new Execute(attrs); },
  extras( attrs:XFAAttrs ) { return new Extras(attrs); },
  field( attrs:XFAAttrs ) { return new Field(attrs); },
  fill( attrs:XFAAttrs ) { return new Fill(attrs); },
  filter( attrs:XFAAttrs ) { return new Filter(attrs); },
  float( attrs:XFAAttrs ) { return new Float(attrs); },
  font( attrs:XFAAttrs ) { return new Font(attrs); },
  format( attrs:XFAAttrs ) { return new Format(attrs); },
  handler( attrs:XFAAttrs ) { return new Handler(attrs); },
  hyphenation( attrs:XFAAttrs ) { return new Hyphenation(attrs); },
  image( attrs:XFAAttrs ) { return new Image(attrs); },
  imageEdit( attrs:XFAAttrs ) { return new ImageEdit(attrs); },
  integer( attrs:XFAAttrs ) { return new Integer(attrs); },
  issuers( attrs:XFAAttrs ) { return new Issuers(attrs); },
  items( attrs:XFAAttrs ) { return new Items(attrs); },
  keep( attrs:XFAAttrs ) { return new Keep(attrs); },
  keyUsage( attrs:XFAAttrs ) { return new KeyUsage(attrs); },
  line( attrs:XFAAttrs ) { return new Line(attrs); },
  linear( attrs:XFAAttrs ) { return new Linear(attrs); },
  lockDocument( attrs:XFAAttrs ) { return new LockDocument(attrs); },
  manifest( attrs:XFAAttrs ) { return new Manifest(attrs); },
  margin( attrs:XFAAttrs ) { return new Margin(attrs); },
  mdp( attrs:XFAAttrs ) { return new Mdp(attrs); },
  medium( attrs:XFAAttrs ) { return new Medium(attrs); },
  message( attrs:XFAAttrs ) { return new Message(attrs); },
  numericEdit( attrs:XFAAttrs ) { return new NumericEdit(attrs); },
  occur( attrs:XFAAttrs ) { return new Occur(attrs); },
  oid( attrs:XFAAttrs ) { return new Oid(attrs); },
  oids( attrs:XFAAttrs ) { return new Oids(attrs); },
  overflow( attrs:XFAAttrs ) { return new Overflow(attrs); },
  pageArea( attrs:XFAAttrs ) { return new PageArea(attrs); },
  pageSet( attrs:XFAAttrs ) { return new PageSet(attrs); },
  para( attrs:XFAAttrs ) { return new Para(attrs); },
  passwordEdit( attrs:XFAAttrs ) { return new PasswordEdit(attrs); },
  pattern( attrs:XFAAttrs ) { return new Pattern(attrs); },
  picture( attrs:XFAAttrs ) { return new Picture(attrs); },
  proto( attrs:XFAAttrs ) { return new Proto(attrs); },
  radial( attrs:XFAAttrs ) { return new Radial(attrs); },
  reason( attrs:XFAAttrs ) { return new Reason(attrs); },
  reasons( attrs:XFAAttrs ) { return new Reasons(attrs); },
  rectangle( attrs:XFAAttrs ) { return new Rectangle(attrs); },
  ref( attrs:XFAAttrs ) { return new RefElement(attrs); },
  script( attrs:XFAAttrs ) { return new Script(attrs); },
  setProperty( attrs:XFAAttrs ) { return new SetProperty(attrs); },
  signData( attrs:XFAAttrs ) { return new SignData(attrs); },
  signature( attrs:XFAAttrs ) { return new Signature(attrs); },
  signing( attrs:XFAAttrs ) { return new Signing(attrs); },
  solid( attrs:XFAAttrs ) { return new Solid(attrs); },
  speak( attrs:XFAAttrs ) { return new Speak(attrs); },
  stipple( attrs:XFAAttrs ) { return new Stipple(attrs); },
  subform( attrs:XFAAttrs ) { return new Subform(attrs); },
  subformSet( attrs:XFAAttrs ) { return new SubformSet(attrs); },
  subjectDN( attrs:XFAAttrs ) { return new SubjectDN(attrs); },
  subjectDNs( attrs:XFAAttrs ) { return new SubjectDNs(attrs); },
  submit( attrs:XFAAttrs ) { return new Submit(attrs); },
  template( attrs:XFAAttrs ) { return new Template(attrs); },
  text( attrs:XFAAttrs ) { return new Text(attrs); },
  textEdit( attrs:XFAAttrs ) { return new TextEdit(attrs); },
  time( attrs:XFAAttrs ) { return new Time(attrs); },
  timeStamp( attrs:XFAAttrs ) { return new TimeStamp(attrs); },
  toolTip( attrs:XFAAttrs ) { return new ToolTip(attrs); },
  traversal( attrs:XFAAttrs ) { return new Traversal(attrs); },
  traverse( attrs:XFAAttrs ) { return new Traverse(attrs); },
  ui( attrs:XFAAttrs ) { return new Ui(attrs); },
  validate( attrs:XFAAttrs ) { return new Validate(attrs); },
  value( attrs:XFAAttrs ) { return new Value(attrs); },
  variables( attrs:XFAAttrs ) { return new Variables(attrs); },
}
/*81---------------------------------------------------------------------------*/
