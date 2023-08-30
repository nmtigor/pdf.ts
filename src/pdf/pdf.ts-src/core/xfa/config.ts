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

import { shadow, warn } from "../../shared/util.ts";
import type { XFAAttrs } from "./alias.ts";
import { $buildXFAObject, NamespaceIds } from "./namespaces.ts";
import { getInteger, getStringOption } from "./utils.ts";
import { $content, $finalize } from "./symbol_utils.ts";
import {
  ContentObject,
  IntegerObject,
  Option01,
  Option10,
  OptionObject,
  StringObject,
  XFAObject,
  XFAObjectArray,
} from "./xfa_object.ts";
/*80--------------------------------------------------------------------------*/

const CONFIG_NS_ID = NamespaceIds.config.id;

class Acrobat extends XFAObject {
  acrobat7: unknown;
  autoSave: unknown;
  common: unknown;
  validate: unknown;
  validateApprovalSignatures: unknown;
  submitUrl = new XFAObjectArray();

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "acrobat", /* hasChildren = */ true);
  }
}

class Acrobat7 extends XFAObject {
  dynamicRender: unknown;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "acrobat7", /* hasChildren = */ true);
  }
}

class ADBE_JSConsole extends OptionObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "ADBE_JSConsole", ["delegate", "Enable", "Disable"]);
  }
}

class ADBE_JSDebugger extends OptionObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "ADBE_JSDebugger", ["delegate", "Enable", "Disable"]);
  }
}

class AddSilentPrint extends Option01 {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "addSilentPrint");
  }
}

class AddViewerPreferences extends Option01 {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "addViewerPreferences");
  }
}

class AdjustData extends Option10 {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "adjustData");
  }
}

class AdobeExtensionLevel extends IntegerObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "adobeExtensionLevel", 0, (n) => n >= 1 && n <= 8);
  }
}

class Agent extends XFAObject {
  common = new XFAObjectArray();

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "agent", /* hasChildren = */ true);
    this.name = attributes.name ? attributes.name.trim() : "";
  }
}

class AlwaysEmbed extends ContentObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "alwaysEmbed");
  }
}

class Amd extends StringObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "amd");
  }
}

class Area extends XFAObject {
  level;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "area");
    this.level = getInteger({
      data: attributes.level,
      defaultValue: 0,
      validate: (n) => n >= 1 && n <= 3,
    });
    this.name = getStringOption(attributes.name, [
      "",
      "barcode",
      "coreinit",
      "deviceDriver",
      "font",
      "general",
      "layout",
      "merge",
      "script",
      "signature",
      "sourceSet",
      "templateCache",
    ]);
  }
}

class Attributes extends OptionObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "attributes", ["preserve", "delegate", "ignore"]);
  }
}

class AutoSave extends OptionObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "autoSave", ["disabled", "enabled"]);
  }
}

class Base extends StringObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "base");
  }
}

class BatchOutput extends XFAObject {
  format;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "batchOutput");
    this.format = getStringOption(attributes.format, [
      "none",
      "concat",
      "zip",
      "zipCompress",
    ]);
  }
}

class BehaviorOverride extends ContentObject {
  override [$content]!: string | Map<string, string>;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "behaviorOverride");
  }

  override [$finalize]() {
    this[$content] = new Map(
      (<string> this[$content])
        .trim()
        .split(/\s+/)
        .filter((x) => x.includes(":"))
        .map((x) => <[string, string]> x.split(":", 2)),
    );
  }
}

class Cache extends XFAObject {
  templateCache: unknown;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "cache", /* hasChildren = */ true);
  }
}

class Change extends Option01 {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "change");
  }
}

class Common extends XFAObject {
  data: unknown;
  locale: unknown;
  localeSet: unknown;
  messaging: unknown;
  suppressBanner: unknown;
  override template: unknown = undefined;
  validationMessaging: unknown;
  versionControl: unknown;
  log = new XFAObjectArray();

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "common", /* hasChildren = */ true);
  }
}

class Compress extends XFAObject {
  scope;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "compress");
    this.scope = getStringOption(attributes.scope, ["imageOnly", "document"]);
  }
}

class CompressLogicalStructure extends Option01 {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "compressLogicalStructure");
  }
}

class CompressObjectStream extends Option10 {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "compressObjectStream");
  }
}

class Compression extends XFAObject {
  compressLogicalStructure: unknown;
  compressObjectStream: unknown;
  level: unknown;
  type: unknown;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "compression", /* hasChildren = */ true);
  }
}

export class Config extends XFAObject {
  acrobat: unknown;
  present: unknown;
  trace: unknown;
  agent = new XFAObjectArray();

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "config", /* hasChildren = */ true);
  }
}

class Conformance extends OptionObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "conformance", ["A", "B"]);
  }
}

class ContentCopy extends Option01 {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "contentCopy");
  }
}

class Copies extends IntegerObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "copies", 1, (n) => n >= 1);
  }
}

class Creator extends StringObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "creator");
  }
}

class CurrentPage extends IntegerObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "currentPage", 0, (n) => n >= 0);
  }
}

class Data extends XFAObject {
  adjustData: unknown;
  attributes: unknown;
  incrementalLoad: unknown;
  outputXSL: unknown;
  range: unknown;
  record: unknown;
  startNode: unknown;
  uri: unknown;
  window: unknown;
  xsl: unknown;
  excludeNS = new XFAObjectArray();
  transform = new XFAObjectArray();

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "data", /* hasChildren = */ true);
  }
}

class Debug extends XFAObject {
  uri: unknown;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "debug", /* hasChildren = */ true);
  }
}

class DefaultTypeface extends ContentObject {
  writingScript;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "defaultTypeface");
    this.writingScript = getStringOption(attributes.writingScript, [
      "*",
      "Arabic",
      "Cyrillic",
      "EastEuropeanRoman",
      "Greek",
      "Hebrew",
      "Japanese",
      "Korean",
      "Roman",
      "SimplifiedChinese",
      "Thai",
      "TraditionalChinese",
      "Vietnamese",
    ]);
  }
}

class Destination extends OptionObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "destination", [
      "pdf",
      "pcl",
      "ps",
      "webClient",
      "zpl",
    ]);
  }
}

class DocumentAssembly extends Option01 {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "documentAssembly");
  }
}

class Driver extends XFAObject {
  fontInfo: unknown;
  xdc: unknown;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "driver", /* hasChildren = */ true);
    this.name = attributes.name ? attributes.name.trim() : "";
  }
}

class DuplexOption extends OptionObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "duplexOption", [
      "simplex",
      "duplexFlipLongEdge",
      "duplexFlipShortEdge",
    ]);
  }
}

class DynamicRender extends OptionObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "dynamicRender", ["forbidden", "required"]);
  }
}

class Embed extends Option01 {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "embed");
  }
}

class Encrypt extends Option01 {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "encrypt");
  }
}

class Encryption extends XFAObject {
  encrypt: unknown;
  encryptionLevel: unknown;
  permissions: unknown;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "encryption", /* hasChildren = */ true);
  }
}

class EncryptionLevel extends OptionObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "encryptionLevel", ["40bit", "128bit"]);
  }
}

class Enforce extends StringObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "enforce");
  }
}

class Equate extends XFAObject {
  force;
  from;
  to;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "equate");

    this.force = getInteger({
      data: attributes.force,
      defaultValue: 1,
      validate: (n) => n === 0,
    });

    this.from = attributes.from || "";
    this.to = attributes.to || "";
  }
}

class EquateRange extends XFAObject {
  from;
  to;
  _unicodeRange;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "equateRange");

    this.from = attributes.from || "";
    this.to = attributes.to || "";
    this._unicodeRange = attributes.unicodeRange || "";
  }

  get unicodeRange() {
    const ranges: [number, number][] = [];
    const unicodeRegex = /U\+([0-9a-fA-F]+)/;
    const unicodeRange = this._unicodeRange;
    for (
      let range of unicodeRange
        .split(",")
        .map((x) => x.trim())
        .filter((x) => !!x)
    ) {
      const range_1 = range.split("-", 2).map((x) => {
        const found = x.match(unicodeRegex);
        if (!found) {
          return 0;
        }
        return parseInt(found[1], 16);
      });
      if (range_1.length === 1) {
        range_1.push(range_1[0]);
      }
      ranges.push(<[number, number]> range_1);
    }
    return shadow(this, "unicodeRange", ranges);
  }
}

class Exclude extends ContentObject {
  override [$content]!: string | string[];

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "exclude");
  }

  override [$finalize]() {
    this[$content] = (<string> this[$content])
      .trim()
      .split(/\s+/)
      .filter(
        (x) =>
          x &&
          [
            "calculate",
            "close",
            "enter",
            "exit",
            "initialize",
            "ready",
            "validate",
          ].includes(x),
      );
  }
}

class ExcludeNS extends StringObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "excludeNS");
  }
}

class FlipLabel extends OptionObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "flipLabel", ["usePrinterSetting", "on", "off"]);
  }
}

class FontInfo extends XFAObject {
  embed: unknown;
  map: unknown;
  subsetBelow: unknown;
  alwaysEmbed = new XFAObjectArray();
  defaultTypeface = new XFAObjectArray();
  neverEmbed = new XFAObjectArray();

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "fontInfo", /* hasChildren = */ true);
  }
}

class FormFieldFilling extends Option01 {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "formFieldFilling");
  }
}

class GroupParent extends StringObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "groupParent");
  }
}

class IfEmpty extends OptionObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "ifEmpty", [
      "dataValue",
      "dataGroup",
      "ignore",
      "remove",
    ]);
  }
}

class IncludeXDPContent extends StringObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "includeXDPContent");
  }
}

class IncrementalLoad extends OptionObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "incrementalLoad", ["none", "forwardOnly"]);
  }
}

class IncrementalMerge extends Option01 {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "incrementalMerge");
  }
}

class Interactive extends Option01 {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "interactive");
  }
}

class Jog extends OptionObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "jog", ["usePrinterSetting", "none", "pageSet"]);
  }
}

class LabelPrinter extends XFAObject {
  batchOutput: unknown;
  flipLabel: unknown;
  fontInfo: unknown;
  xdc: unknown;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "labelPrinter", /* hasChildren = */ true);
    this.name = getStringOption(attributes.name, ["zpl", "dpl", "ipl", "tcpl"]);
  }
}

class Layout extends OptionObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "layout", ["paginate", "panel"]);
  }
}

class Level extends IntegerObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "level", 0, (n) => n > 0);
  }
}

class Linearized extends Option01 {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "linearized");
  }
}

class Locale extends StringObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "locale");
  }
}

class LocaleSet extends StringObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "localeSet");
  }
}

class Log extends XFAObject {
  mode: unknown;
  threshold: unknown;
  to: unknown;
  uri: unknown;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "log", /* hasChildren = */ true);
  }
}

// Renamed in MapElement to avoid confusion with usual js Map.
class MapElement extends XFAObject {
  equate = new XFAObjectArray();
  equateRange = new XFAObjectArray();

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "map", /* hasChildren = */ true);
  }
}

class MediumInfo extends XFAObject {
  map: unknown;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "mediumInfo", /* hasChildren = */ true);
  }
}

class Message extends XFAObject {
  msgId: unknown;
  severity: unknown;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "message", /* hasChildren = */ true);
  }
}

class Messaging extends XFAObject {
  message = new XFAObjectArray();

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "messaging", /* hasChildren = */ true);
  }
}

class Mode extends OptionObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "mode", ["append", "overwrite"]);
  }
}

class ModifyAnnots extends Option01 {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "modifyAnnots");
  }
}

class MsgId extends IntegerObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "msgId", 1, (n) => n >= 1);
  }
}

class NameAttr extends StringObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "nameAttr");
  }
}

class NeverEmbed extends ContentObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "neverEmbed");
  }
}

class NumberOfCopies extends IntegerObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "numberOfCopies", 0, (n) => n >= 2 && n <= 5);
  }
}

class OpenAction extends XFAObject {
  destination: unknown;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "openAction", /* hasChildren = */ true);
  }
}

class Output extends XFAObject {
  to: unknown;
  type: unknown;
  uri: unknown;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "output", /* hasChildren = */ true);
  }
}

class OutputBin extends StringObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "outputBin");
  }
}

class OutputXSL extends XFAObject {
  uri: unknown;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "outputXSL", /* hasChildren = */ true);
  }
}

class Overprint extends OptionObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "overprint", ["none", "both", "draw", "field"]);
  }
}

class Packets extends StringObject {
  override [$content]!: string | Date | string[];

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "packets");
  }

  override [$finalize]() {
    if (this[$content] === "*") {
      return;
    }
    this[$content] = (<string> this[$content])
      .trim()
      .split(/\s+/)
      .filter((x) =>
        ["config", "datasets", "template", "xfdf", "xslt"].includes(x)
      );
  }
}

class PageOffset extends XFAObject {
  override x;
  override y;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "pageOffset");
    this.x = getInteger({
      data: attributes.x,
      defaultValue: "useXDCSetting",
      validate: (n) => true,
    });
    this.y = getInteger({
      data: attributes.y,
      defaultValue: "useXDCSetting",
      validate: (n) => true,
    });
  }
}

class PageRange extends StringObject {
  override [$content]!: string | [number, number][];

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "pageRange");
  }

  override [$finalize]() {
    const numbers = (<string> this[$content])
      .trim()
      .split(/\s+/)
      .map((x) => parseInt(x, 10));
    const ranges = [];
    for (let i = 0, ii = numbers.length; i < ii; i += 2) {
      ranges.push(<[number, number]> numbers.slice(i, i + 2));
    }
    this[$content] = ranges;
  }
}

class Pagination extends OptionObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "pagination", [
      "simplex",
      "duplexShortEdge",
      "duplexLongEdge",
    ]);
  }
}

class PaginationOverride extends OptionObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "paginationOverride", [
      "none",
      "forceDuplex",
      "forceDuplexLongEdge",
      "forceDuplexShortEdge",
      "forceSimplex",
    ]);
  }
}

class Part extends IntegerObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "part", 1, (n) => false);
  }
}

class Pcl extends XFAObject {
  batchOutput: unknown;
  fontInfo: unknown;
  jog: unknown;
  mediumInfo: unknown;
  outputBin: unknown;
  pageOffset: unknown;
  staple: unknown;
  xdc: unknown;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "pcl", /* hasChildren = */ true);
    this.name = attributes.name || "";
  }
}

class Pdf extends XFAObject {
  adobeExtensionLevel: unknown;
  batchOutput: unknown;
  compression: unknown;
  creator: unknown;
  encryption: unknown;
  fontInfo: unknown;
  interactive: unknown;
  linearized: unknown;
  openAction: unknown;
  pdfa: unknown;
  producer: unknown;
  renderPolicy: unknown;
  scriptModel: unknown;
  silentPrint: unknown;
  submitFormat: unknown;
  tagged: unknown;
  version: unknown;
  viewerPreferences: unknown;
  xdc: unknown;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "pdf", /* hasChildren = */ true);
    this.name = attributes.name || "";
  }
}

class Pdfa extends XFAObject {
  amd: unknown;
  conformance: unknown;
  includeXDPContent: unknown;
  part: unknown;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "pdfa", /* hasChildren = */ true);
  }
}

class Permissions extends XFAObject {
  accessibleContent: unknown;
  change: unknown;
  contentCopy: unknown;
  documentAssembly: unknown;
  formFieldFilling: unknown;
  modifyAnnots: unknown;
  plaintextMetadata: unknown;
  print: unknown;
  printHighQuality: unknown;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "permissions", /* hasChildren = */ true);
  }
}

class PickTrayByPDFSize extends Option01 {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "pickTrayByPDFSize");
  }
}

class Picture extends StringObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "picture");
  }

  // TODO: check the validity of the picture clause.
  // See page 1150 in the spec.
}

class PlaintextMetadata extends Option01 {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "plaintextMetadata");
  }
}

class Presence extends OptionObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "presence", [
      "preserve",
      "dissolve",
      "dissolveStructure",
      "ignore",
      "remove",
    ]);
  }
}

class Present extends XFAObject {
  behaviorOverride: unknown;
  cache: unknown;
  common: unknown;
  copies: unknown;
  destination: unknown;
  incrementalMerge: unknown;
  override layout: string | undefined = undefined;
  output: unknown;
  overprint: unknown;
  pagination: unknown;
  paginationOverride: unknown;
  script: unknown;
  validate: unknown;
  xdp: unknown;
  driver = new XFAObjectArray();
  labelPrinter = new XFAObjectArray();
  pcl = new XFAObjectArray();
  pdf = new XFAObjectArray();
  ps = new XFAObjectArray();
  submitUrl = new XFAObjectArray();
  webClient = new XFAObjectArray();
  zpl = new XFAObjectArray();

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "present", /* hasChildren = */ true);
  }
}

class Print extends Option01 {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "print");
  }
}

class PrintHighQuality extends Option01 {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "printHighQuality");
  }
}

class PrintScaling extends OptionObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "printScaling", ["appdefault", "noScaling"]);
  }
}

class PrinterName extends StringObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "printerName");
  }
}

class Producer extends StringObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "producer");
  }
}

class Ps extends XFAObject {
  batchOutput: unknown;
  fontInfo: unknown;
  jog: unknown;
  mediumInfo: unknown;
  outputBin: unknown;
  staple: unknown;
  xdc: unknown;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "ps", /* hasChildren = */ true);
    this.name = attributes.name || "";
  }
}

class Range extends ContentObject {
  override [$content]!: string | [number, number][];

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "range");
  }

  override [$finalize]() {
    this[$content] = (<string> this[$content])
      .trim()
      .split(/\s*,\s*/, 2)
      .map((range) => range.split("-").map((x) => parseInt(x.trim(), 10)))
      .filter((range) => range.every((x) => !isNaN(x)))
      .map((range) => {
        if (range.length === 1) {
          range.push(range[0]);
        }
        return <[number, number]> range;
      });
  }
}

class Record extends ContentObject {
  override [$content]!: string;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "record");
  }

  override [$finalize]() {
    this[$content] = (<string> this[$content]).trim();
    const n = parseInt(this[$content], 10);
    if (!isNaN(n) && n >= 0) {
      this[$content] = <any> n;
    }
  }
}

class Relevant extends ContentObject {
  override [$content]!: string | string[];

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "relevant");
  }

  override [$finalize]() {
    this[$content] = (<string> this[$content]).trim().split(/\s+/);
  }
}

class Rename extends ContentObject {
  override [$content]!: string;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "rename");
  }

  override [$finalize]() {
    this[$content] = this[$content].trim();
    // String must be a XFA name: same as XML one except that there
    // is no colon.
    if (
      this[$content].toLowerCase().startsWith("xml") ||
      new RegExp("[\\p{L}_][\\p{L}\\d._\\p{M}-]*", "u").test(this[$content])
    ) {
      warn("XFA - Rename: invalid XFA name");
    }
  }
}

class RenderPolicy extends OptionObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "renderPolicy", ["server", "client"]);
  }
}

class RunScripts extends OptionObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "runScripts", ["both", "client", "none", "server"]);
  }
}

class Script extends XFAObject {
  currentPage: unknown;
  exclude: unknown;
  runScripts: unknown;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "script", /* hasChildren = */ true);
  }
}

class ScriptModel extends OptionObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "scriptModel", ["XFA", "none"]);
  }
}

class Severity extends OptionObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "severity", [
      "ignore",
      "error",
      "information",
      "trace",
      "warning",
    ]);
  }
}

class SilentPrint extends XFAObject {
  addSilentPrint: unknown;
  printerName: unknown;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "silentPrint", /* hasChildren = */ true);
  }
}

class Staple extends XFAObject {
  mode;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "staple");
    this.mode = getStringOption(attributes.mode, [
      "usePrinterSetting",
      "on",
      "off",
    ]);
  }
}

class StartNode extends StringObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "startNode");
  }
}

class StartPage extends IntegerObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "startPage", 0, (n) => true);
  }
}

class SubmitFormat extends OptionObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "submitFormat", [
      "html",
      "delegate",
      "fdf",
      "xml",
      "pdf",
    ]);
  }
}

class SubmitUrl extends StringObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "submitUrl");
  }
}

class SubsetBelow extends IntegerObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "subsetBelow", 100, (n) => n >= 0 && n <= 100);
  }
}

class SuppressBanner extends Option01 {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "suppressBanner");
  }
}

class Tagged extends Option01 {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "tagged");
  }
}

/** @final */
class Template extends XFAObject {
  base: unknown;
  relevant: unknown;
  startPage: unknown;
  uri: unknown;
  xsl: unknown;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "template", /* hasChildren = */ true);
  }
}

class Threshold extends OptionObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "threshold", [
      "trace",
      "error",
      "information",
      "warning",
    ]);
  }
}

class To extends OptionObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "to", [
      "null",
      "memory",
      "stderr",
      "stdout",
      "system",
      "uri",
    ]);
  }
}

class TemplateCache extends XFAObject {
  maxEntries;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "templateCache");

    this.maxEntries = getInteger({
      data: attributes.maxEntries,
      defaultValue: 5,
      validate: (n) => n >= 0,
    });
  }
}

class Trace extends XFAObject {
  area = new XFAObjectArray();

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "trace", /* hasChildren = */ true);
  }
}

class Transform extends XFAObject {
  groupParent: unknown;
  ifEmpty: unknown;
  nameAttr: unknown;
  picture: unknown;
  override presence: string | undefined = undefined;
  rename: unknown;
  whitespace: unknown;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "transform", /* hasChildren = */ true);
  }
}

class Type extends OptionObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "type", [
      "none",
      "ascii85",
      "asciiHex",
      "ccittfax",
      "flate",
      "lzw",
      "runLength",
      "native",
      "xdp",
      "mergedXDP",
    ]);
  }
}

class Uri extends StringObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "uri");
  }
}

class Validate extends OptionObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "validate", [
      "preSubmit",
      "prePrint",
      "preExecute",
      "preSave",
    ]);
  }
}

class ValidateApprovalSignatures extends ContentObject {
  override [$content]!: string | string[];

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "validateApprovalSignatures");
  }

  override [$finalize]() {
    this[$content] = (<string> this[$content])
      .trim()
      .split(/\s+/)
      .filter((x) => ["docReady", "postSign"].includes(x));
  }
}

class ValidationMessaging extends OptionObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "validationMessaging", [
      "allMessagesIndividually",
      "allMessagesTogether",
      "firstMessageOnly",
      "noMessages",
    ]);
  }
}

class Version extends OptionObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "version", ["1.7", "1.6", "1.5", "1.4", "1.3", "1.2"]);
  }
}

class VersionControl extends XFAObject {
  outputBelow;
  sourceAbove;
  sourceBelow;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "VersionControl");
    this.outputBelow = getStringOption(attributes.outputBelow, [
      "warn",
      "error",
      "update",
    ]);
    this.sourceAbove = getStringOption(attributes.sourceAbove, [
      "warn",
      "error",
    ]);
    this.sourceBelow = getStringOption(attributes.sourceBelow, [
      "update",
      "maintain",
    ]);
  }
}

class ViewerPreferences extends XFAObject {
  ADBE_JSConsole: unknown;
  ADBE_JSDebugger: unknown;
  addViewerPreferences: unknown;
  duplexOption: unknown;
  enforce: unknown;
  numberOfCopies: unknown;
  pageRange: unknown;
  pickTrayByPDFSize: unknown;
  printScaling: unknown;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "viewerPreferences", /* hasChildren = */ true);
  }
}

class WebClient extends XFAObject {
  fontInfo: unknown;
  xdc: unknown;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "webClient", /* hasChildren = */ true);
    this.name = attributes.name ? attributes.name.trim() : "";
  }
}

class Whitespace extends OptionObject {
  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "whitespace", [
      "preserve",
      "ltrim",
      "normalize",
      "rtrim",
      "trim",
    ]);
  }
}

class Window extends ContentObject {
  override [$content]!: string | [number, number];

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "window");
  }

  override [$finalize]() {
    const pair = (<string> this[$content])
      .trim()
      .split(/\s*,\s*/, 2)
      .map((x) => parseInt(x, 10));
    if (pair.some((x) => isNaN(x))) {
      this[$content] = [0, 0];
      return;
    }
    if (pair.length === 1) {
      pair.push(pair[0]);
    }
    this[$content] = <[number, number]> pair;
  }
}

class Xdc extends XFAObject {
  uri = new XFAObjectArray();
  xsl = new XFAObjectArray();

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "xdc", /* hasChildren = */ true);
  }
}

class Xdp extends XFAObject {
  packets: unknown;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "xdp", /* hasChildren = */ true);
  }
}

class Xsl extends XFAObject {
  debug: unknown;
  uri: unknown;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "xsl", /* hasChildren = */ true);
  }
}

class Zpl extends XFAObject {
  batchOutput: unknown;
  flipLabel: unknown;
  fontInfo: unknown;
  xdc: unknown;

  constructor(attributes: XFAAttrs) {
    super(CONFIG_NS_ID, "zpl", /* hasChildren = */ true);
    this.name = attributes.name ? attributes.name.trim() : "";
  }
}

export type XFANsConfig = typeof ConfigNamespace;
type Exclude_1<T, U> = T extends U ? never : T;
type ConfigName = Exclude_1<keyof XFANsConfig, symbol>;
export const ConfigNamespace = {
  [$buildXFAObject](name: string, attributes: XFAAttrs) {
    if (Object.hasOwn(ConfigNamespace, name)) {
      return ConfigNamespace[<ConfigName> name](attributes);
    }
    return undefined;
  },

  acrobat(attrs: XFAAttrs) {
    return new Acrobat(attrs);
  },
  acrobat7(attrs: XFAAttrs) {
    return new Acrobat7(attrs);
  },
  ADBE_JSConsole(attrs: XFAAttrs) {
    return new ADBE_JSConsole(attrs);
  },
  ADBE_JSDebugger(attrs: XFAAttrs) {
    return new ADBE_JSDebugger(attrs);
  },
  addSilentPrint(attrs: XFAAttrs) {
    return new AddSilentPrint(attrs);
  },
  addViewerPreferences(attrs: XFAAttrs) {
    return new AddViewerPreferences(attrs);
  },
  adjustData(attrs: XFAAttrs) {
    return new AdjustData(attrs);
  },
  adobeExtensionLevel(attrs: XFAAttrs) {
    return new AdobeExtensionLevel(attrs);
  },
  agent(attrs: XFAAttrs) {
    return new Agent(attrs);
  },
  alwaysEmbed(attrs: XFAAttrs) {
    return new AlwaysEmbed(attrs);
  },
  amd(attrs: XFAAttrs) {
    return new Amd(attrs);
  },
  area(attrs: XFAAttrs) {
    return new Area(attrs);
  },
  attributes(attrs: XFAAttrs) {
    return new Attributes(attrs);
  },
  autoSave(attrs: XFAAttrs) {
    return new AutoSave(attrs);
  },
  base(attrs: XFAAttrs) {
    return new Base(attrs);
  },
  batchOutput(attrs: XFAAttrs) {
    return new BatchOutput(attrs);
  },
  behaviorOverride(attrs: XFAAttrs) {
    return new BehaviorOverride(attrs);
  },
  cache(attrs: XFAAttrs) {
    return new Cache(attrs);
  },
  change(attrs: XFAAttrs) {
    return new Change(attrs);
  },
  common(attrs: XFAAttrs) {
    return new Common(attrs);
  },
  compress(attrs: XFAAttrs) {
    return new Compress(attrs);
  },
  compressLogicalStructure(attrs: XFAAttrs) {
    return new CompressLogicalStructure(attrs);
  },
  compressObjectStream(attrs: XFAAttrs) {
    return new CompressObjectStream(attrs);
  },
  compression(attrs: XFAAttrs) {
    return new Compression(attrs);
  },
  config(attrs: XFAAttrs) {
    return new Config(attrs);
  },
  conformance(attrs: XFAAttrs) {
    return new Conformance(attrs);
  },
  contentCopy(attrs: XFAAttrs) {
    return new ContentCopy(attrs);
  },
  copies(attrs: XFAAttrs) {
    return new Copies(attrs);
  },
  creator(attrs: XFAAttrs) {
    return new Creator(attrs);
  },
  currentPage(attrs: XFAAttrs) {
    return new CurrentPage(attrs);
  },
  data(attrs: XFAAttrs) {
    return new Data(attrs);
  },
  debug(attrs: XFAAttrs) {
    return new Debug(attrs);
  },
  defaultTypeface(attrs: XFAAttrs) {
    return new DefaultTypeface(attrs);
  },
  destination(attrs: XFAAttrs) {
    return new Destination(attrs);
  },
  documentAssembly(attrs: XFAAttrs) {
    return new DocumentAssembly(attrs);
  },
  driver(attrs: XFAAttrs) {
    return new Driver(attrs);
  },
  duplexOption(attrs: XFAAttrs) {
    return new DuplexOption(attrs);
  },
  dynamicRender(attrs: XFAAttrs) {
    return new DynamicRender(attrs);
  },
  embed(attrs: XFAAttrs) {
    return new Embed(attrs);
  },
  encrypt(attrs: XFAAttrs) {
    return new Encrypt(attrs);
  },
  encryption(attrs: XFAAttrs) {
    return new Encryption(attrs);
  },
  encryptionLevel(attrs: XFAAttrs) {
    return new EncryptionLevel(attrs);
  },
  enforce(attrs: XFAAttrs) {
    return new Enforce(attrs);
  },
  equate(attrs: XFAAttrs) {
    return new Equate(attrs);
  },
  equateRange(attrs: XFAAttrs) {
    return new EquateRange(attrs);
  },
  exclude(attrs: XFAAttrs) {
    return new Exclude(attrs);
  },
  excludeNS(attrs: XFAAttrs) {
    return new ExcludeNS(attrs);
  },
  flipLabel(attrs: XFAAttrs) {
    return new FlipLabel(attrs);
  },
  fontInfo(attrs: XFAAttrs) {
    return new FontInfo(attrs);
  },
  formFieldFilling(attrs: XFAAttrs) {
    return new FormFieldFilling(attrs);
  },
  groupParent(attrs: XFAAttrs) {
    return new GroupParent(attrs);
  },
  ifEmpty(attrs: XFAAttrs) {
    return new IfEmpty(attrs);
  },
  includeXDPContent(attrs: XFAAttrs) {
    return new IncludeXDPContent(attrs);
  },
  incrementalLoad(attrs: XFAAttrs) {
    return new IncrementalLoad(attrs);
  },
  incrementalMerge(attrs: XFAAttrs) {
    return new IncrementalMerge(attrs);
  },
  interactive(attrs: XFAAttrs) {
    return new Interactive(attrs);
  },
  jog(attrs: XFAAttrs) {
    return new Jog(attrs);
  },
  labelPrinter(attrs: XFAAttrs) {
    return new LabelPrinter(attrs);
  },
  layout(attrs: XFAAttrs) {
    return new Layout(attrs);
  },
  level(attrs: XFAAttrs) {
    return new Level(attrs);
  },
  linearized(attrs: XFAAttrs) {
    return new Linearized(attrs);
  },
  locale(attrs: XFAAttrs) {
    return new Locale(attrs);
  },
  localeSet(attrs: XFAAttrs) {
    return new LocaleSet(attrs);
  },
  log(attrs: XFAAttrs) {
    return new Log(attrs);
  },
  map(attrs: XFAAttrs) {
    return new MapElement(attrs);
  },
  mediumInfo(attrs: XFAAttrs) {
    return new MediumInfo(attrs);
  },
  message(attrs: XFAAttrs) {
    return new Message(attrs);
  },
  messaging(attrs: XFAAttrs) {
    return new Messaging(attrs);
  },
  mode(attrs: XFAAttrs) {
    return new Mode(attrs);
  },
  modifyAnnots(attrs: XFAAttrs) {
    return new ModifyAnnots(attrs);
  },
  msgId(attrs: XFAAttrs) {
    return new MsgId(attrs);
  },
  nameAttr(attrs: XFAAttrs) {
    return new NameAttr(attrs);
  },
  neverEmbed(attrs: XFAAttrs) {
    return new NeverEmbed(attrs);
  },
  numberOfCopies(attrs: XFAAttrs) {
    return new NumberOfCopies(attrs);
  },
  openAction(attrs: XFAAttrs) {
    return new OpenAction(attrs);
  },
  output(attrs: XFAAttrs) {
    return new Output(attrs);
  },
  outputBin(attrs: XFAAttrs) {
    return new OutputBin(attrs);
  },
  outputXSL(attrs: XFAAttrs) {
    return new OutputXSL(attrs);
  },
  overprint(attrs: XFAAttrs) {
    return new Overprint(attrs);
  },
  packets(attrs: XFAAttrs) {
    return new Packets(attrs);
  },
  pageOffset(attrs: XFAAttrs) {
    return new PageOffset(attrs);
  },
  pageRange(attrs: XFAAttrs) {
    return new PageRange(attrs);
  },
  pagination(attrs: XFAAttrs) {
    return new Pagination(attrs);
  },
  paginationOverride(attrs: XFAAttrs) {
    return new PaginationOverride(attrs);
  },
  part(attrs: XFAAttrs) {
    return new Part(attrs);
  },
  pcl(attrs: XFAAttrs) {
    return new Pcl(attrs);
  },
  pdf(attrs: XFAAttrs) {
    return new Pdf(attrs);
  },
  pdfa(attrs: XFAAttrs) {
    return new Pdfa(attrs);
  },
  permissions(attrs: XFAAttrs) {
    return new Permissions(attrs);
  },
  pickTrayByPDFSize(attrs: XFAAttrs) {
    return new PickTrayByPDFSize(attrs);
  },
  picture(attrs: XFAAttrs) {
    return new Picture(attrs);
  },
  plaintextMetadata(attrs: XFAAttrs) {
    return new PlaintextMetadata(attrs);
  },
  presence(attrs: XFAAttrs) {
    return new Presence(attrs);
  },
  present(attrs: XFAAttrs) {
    return new Present(attrs);
  },
  print(attrs: XFAAttrs) {
    return new Print(attrs);
  },
  printHighQuality(attrs: XFAAttrs) {
    return new PrintHighQuality(attrs);
  },
  printScaling(attrs: XFAAttrs) {
    return new PrintScaling(attrs);
  },
  printerName(attrs: XFAAttrs) {
    return new PrinterName(attrs);
  },
  producer(attrs: XFAAttrs) {
    return new Producer(attrs);
  },
  ps(attrs: XFAAttrs) {
    return new Ps(attrs);
  },
  range(attrs: XFAAttrs) {
    return new Range(attrs);
  },
  record(attrs: XFAAttrs) {
    return new Record(attrs);
  },
  relevant(attrs: XFAAttrs) {
    return new Relevant(attrs);
  },
  rename(attrs: XFAAttrs) {
    return new Rename(attrs);
  },
  renderPolicy(attrs: XFAAttrs) {
    return new RenderPolicy(attrs);
  },
  runScripts(attrs: XFAAttrs) {
    return new RunScripts(attrs);
  },
  script(attrs: XFAAttrs) {
    return new Script(attrs);
  },
  scriptModel(attrs: XFAAttrs) {
    return new ScriptModel(attrs);
  },
  severity(attrs: XFAAttrs) {
    return new Severity(attrs);
  },
  silentPrint(attrs: XFAAttrs) {
    return new SilentPrint(attrs);
  },
  staple(attrs: XFAAttrs) {
    return new Staple(attrs);
  },
  startNode(attrs: XFAAttrs) {
    return new StartNode(attrs);
  },
  startPage(attrs: XFAAttrs) {
    return new StartPage(attrs);
  },
  submitFormat(attrs: XFAAttrs) {
    return new SubmitFormat(attrs);
  },
  submitUrl(attrs: XFAAttrs) {
    return new SubmitUrl(attrs);
  },
  subsetBelow(attrs: XFAAttrs) {
    return new SubsetBelow(attrs);
  },
  suppressBanner(attrs: XFAAttrs) {
    return new SuppressBanner(attrs);
  },
  tagged(attrs: XFAAttrs) {
    return new Tagged(attrs);
  },
  template(attrs: XFAAttrs) {
    return new Template(attrs);
  },
  templateCache(attrs: XFAAttrs) {
    return new TemplateCache(attrs);
  },
  threshold(attrs: XFAAttrs) {
    return new Threshold(attrs);
  },
  to(attrs: XFAAttrs) {
    return new To(attrs);
  },
  trace(attrs: XFAAttrs) {
    return new Trace(attrs);
  },
  transform(attrs: XFAAttrs) {
    return new Transform(attrs);
  },
  type(attrs: XFAAttrs) {
    return new Type(attrs);
  },
  uri(attrs: XFAAttrs) {
    return new Uri(attrs);
  },
  validate(attrs: XFAAttrs) {
    return new Validate(attrs);
  },
  validateApprovalSignatures(attrs: XFAAttrs) {
    return new ValidateApprovalSignatures(attrs);
  },
  validationMessaging(attrs: XFAAttrs) {
    return new ValidationMessaging(attrs);
  },
  version(attrs: XFAAttrs) {
    return new Version(attrs);
  },
  versionControl(attrs: XFAAttrs) {
    return new VersionControl(attrs);
  },
  viewerPreferences(attrs: XFAAttrs) {
    return new ViewerPreferences(attrs);
  },
  webClient(attrs: XFAAttrs) {
    return new WebClient(attrs);
  },
  whitespace(attrs: XFAAttrs) {
    return new Whitespace(attrs);
  },
  window(attrs: XFAAttrs) {
    return new Window(attrs);
  },
  xdc(attrs: XFAAttrs) {
    return new Xdc(attrs);
  },
  xdp(attrs: XFAAttrs) {
    return new Xdp(attrs);
  },
  xsl(attrs: XFAAttrs) {
    return new Xsl(attrs);
  },
  zpl(attrs: XFAAttrs) {
    return new Zpl(attrs);
  },
};
/*80--------------------------------------------------------------------------*/
