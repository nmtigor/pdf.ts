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
import { shadow, warn } from "../../shared/util.js";
import { $buildXFAObject, NamespaceIds } from "./namespaces.js";
import { getInteger, getStringOption } from "./utils.js";
import { $content, $finalize, ContentObject, IntegerObject, Option01, Option10, OptionObject, StringObject, XFAObject, XFAObjectArray, } from "./xfa_object.js";
/*80--------------------------------------------------------------------------*/
const CONFIG_NS_ID = NamespaceIds.config.id;
class Acrobat extends XFAObject {
    acrobat7;
    autoSave;
    common;
    validate;
    validateApprovalSignatures;
    submitUrl = new XFAObjectArray();
    constructor(attributes) {
        super(CONFIG_NS_ID, "acrobat", /* hasChildren = */ true);
    }
}
class Acrobat7 extends XFAObject {
    dynamicRender;
    constructor(attributes) {
        super(CONFIG_NS_ID, "acrobat7", /* hasChildren = */ true);
    }
}
class ADBE_JSConsole extends OptionObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "ADBE_JSConsole", ["delegate", "Enable", "Disable"]);
    }
}
class ADBE_JSDebugger extends OptionObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "ADBE_JSDebugger", ["delegate", "Enable", "Disable"]);
    }
}
class AddSilentPrint extends Option01 {
    constructor(attributes) {
        super(CONFIG_NS_ID, "addSilentPrint");
    }
}
class AddViewerPreferences extends Option01 {
    constructor(attributes) {
        super(CONFIG_NS_ID, "addViewerPreferences");
    }
}
class AdjustData extends Option10 {
    constructor(attributes) {
        super(CONFIG_NS_ID, "adjustData");
    }
}
class AdobeExtensionLevel extends IntegerObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "adobeExtensionLevel", 0, (n) => n >= 1 && n <= 8);
    }
}
class Agent extends XFAObject {
    common = new XFAObjectArray();
    constructor(attributes) {
        super(CONFIG_NS_ID, "agent", /* hasChildren = */ true);
        this.name = attributes.name ? attributes.name.trim() : "";
    }
}
class AlwaysEmbed extends ContentObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "alwaysEmbed");
    }
}
class Amd extends StringObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "amd");
    }
}
class Area extends XFAObject {
    level;
    constructor(attributes) {
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
    constructor(attributes) {
        super(CONFIG_NS_ID, "attributes", ["preserve", "delegate", "ignore"]);
    }
}
class AutoSave extends OptionObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "autoSave", ["disabled", "enabled"]);
    }
}
class Base extends StringObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "base");
    }
}
class BatchOutput extends XFAObject {
    format;
    constructor(attributes) {
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
    [$content];
    constructor(attributes) {
        super(CONFIG_NS_ID, "behaviorOverride");
    }
    [$finalize]() {
        this[$content] = new Map(this[$content]
            .trim()
            .split(/\s+/)
            .filter((x) => x.includes(":"))
            .map((x) => x.split(":", 2)));
    }
}
class Cache extends XFAObject {
    templateCache;
    constructor(attributes) {
        super(CONFIG_NS_ID, "cache", /* hasChildren = */ true);
    }
}
class Change extends Option01 {
    constructor(attributes) {
        super(CONFIG_NS_ID, "change");
    }
}
class Common extends XFAObject {
    data;
    locale;
    localeSet;
    messaging;
    suppressBanner;
    template = undefined;
    validationMessaging;
    versionControl;
    log = new XFAObjectArray();
    constructor(attributes) {
        super(CONFIG_NS_ID, "common", /* hasChildren = */ true);
    }
}
class Compress extends XFAObject {
    scope;
    constructor(attributes) {
        super(CONFIG_NS_ID, "compress");
        this.scope = getStringOption(attributes.scope, ["imageOnly", "document"]);
    }
}
class CompressLogicalStructure extends Option01 {
    constructor(attributes) {
        super(CONFIG_NS_ID, "compressLogicalStructure");
    }
}
class CompressObjectStream extends Option10 {
    constructor(attributes) {
        super(CONFIG_NS_ID, "compressObjectStream");
    }
}
class Compression extends XFAObject {
    compressLogicalStructure;
    compressObjectStream;
    level;
    type;
    constructor(attributes) {
        super(CONFIG_NS_ID, "compression", /* hasChildren = */ true);
    }
}
export class Config extends XFAObject {
    acrobat;
    present;
    trace;
    agent = new XFAObjectArray();
    constructor(attributes) {
        super(CONFIG_NS_ID, "config", /* hasChildren = */ true);
    }
}
class Conformance extends OptionObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "conformance", ["A", "B"]);
    }
}
class ContentCopy extends Option01 {
    constructor(attributes) {
        super(CONFIG_NS_ID, "contentCopy");
    }
}
class Copies extends IntegerObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "copies", 1, (n) => n >= 1);
    }
}
class Creator extends StringObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "creator");
    }
}
class CurrentPage extends IntegerObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "currentPage", 0, (n) => n >= 0);
    }
}
class Data extends XFAObject {
    adjustData;
    attributes;
    incrementalLoad;
    outputXSL;
    range;
    record;
    startNode;
    uri;
    window;
    xsl;
    excludeNS = new XFAObjectArray();
    transform = new XFAObjectArray();
    constructor(attributes) {
        super(CONFIG_NS_ID, "data", /* hasChildren = */ true);
    }
}
class Debug extends XFAObject {
    uri;
    constructor(attributes) {
        super(CONFIG_NS_ID, "debug", /* hasChildren = */ true);
    }
}
class DefaultTypeface extends ContentObject {
    writingScript;
    constructor(attributes) {
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
    constructor(attributes) {
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
    constructor(attributes) {
        super(CONFIG_NS_ID, "documentAssembly");
    }
}
class Driver extends XFAObject {
    fontInfo;
    xdc;
    constructor(attributes) {
        super(CONFIG_NS_ID, "driver", /* hasChildren = */ true);
        this.name = attributes.name ? attributes.name.trim() : "";
    }
}
class DuplexOption extends OptionObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "duplexOption", [
            "simplex",
            "duplexFlipLongEdge",
            "duplexFlipShortEdge",
        ]);
    }
}
class DynamicRender extends OptionObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "dynamicRender", ["forbidden", "required"]);
    }
}
class Embed extends Option01 {
    constructor(attributes) {
        super(CONFIG_NS_ID, "embed");
    }
}
class Encrypt extends Option01 {
    constructor(attributes) {
        super(CONFIG_NS_ID, "encrypt");
    }
}
class Encryption extends XFAObject {
    encrypt;
    encryptionLevel;
    permissions;
    constructor(attributes) {
        super(CONFIG_NS_ID, "encryption", /* hasChildren = */ true);
    }
}
class EncryptionLevel extends OptionObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "encryptionLevel", ["40bit", "128bit"]);
    }
}
class Enforce extends StringObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "enforce");
    }
}
class Equate extends XFAObject {
    force;
    from;
    to;
    constructor(attributes) {
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
    constructor(attributes) {
        super(CONFIG_NS_ID, "equateRange");
        this.from = attributes.from || "";
        this.to = attributes.to || "";
        this._unicodeRange = attributes.unicodeRange || "";
    }
    get unicodeRange() {
        const ranges = [];
        const unicodeRegex = /U\+([0-9a-fA-F]+)/;
        const unicodeRange = this._unicodeRange;
        for (let range of unicodeRange
            .split(",")
            .map((x) => x.trim())
            .filter((x) => !!x)) {
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
            ranges.push(range_1);
        }
        return shadow(this, "unicodeRange", ranges);
    }
}
class Exclude extends ContentObject {
    [$content];
    constructor(attributes) {
        super(CONFIG_NS_ID, "exclude");
    }
    [$finalize]() {
        this[$content] = this[$content]
            .trim()
            .split(/\s+/)
            .filter((x) => x &&
            [
                "calculate",
                "close",
                "enter",
                "exit",
                "initialize",
                "ready",
                "validate",
            ].includes(x));
    }
}
class ExcludeNS extends StringObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "excludeNS");
    }
}
class FlipLabel extends OptionObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "flipLabel", ["usePrinterSetting", "on", "off"]);
    }
}
class FontInfo extends XFAObject {
    embed;
    map;
    subsetBelow;
    alwaysEmbed = new XFAObjectArray();
    defaultTypeface = new XFAObjectArray();
    neverEmbed = new XFAObjectArray();
    constructor(attributes) {
        super(CONFIG_NS_ID, "fontInfo", /* hasChildren = */ true);
    }
}
class FormFieldFilling extends Option01 {
    constructor(attributes) {
        super(CONFIG_NS_ID, "formFieldFilling");
    }
}
class GroupParent extends StringObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "groupParent");
    }
}
class IfEmpty extends OptionObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "ifEmpty", [
            "dataValue",
            "dataGroup",
            "ignore",
            "remove",
        ]);
    }
}
class IncludeXDPContent extends StringObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "includeXDPContent");
    }
}
class IncrementalLoad extends OptionObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "incrementalLoad", ["none", "forwardOnly"]);
    }
}
class IncrementalMerge extends Option01 {
    constructor(attributes) {
        super(CONFIG_NS_ID, "incrementalMerge");
    }
}
class Interactive extends Option01 {
    constructor(attributes) {
        super(CONFIG_NS_ID, "interactive");
    }
}
class Jog extends OptionObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "jog", ["usePrinterSetting", "none", "pageSet"]);
    }
}
class LabelPrinter extends XFAObject {
    batchOutput;
    flipLabel;
    fontInfo;
    xdc;
    constructor(attributes) {
        super(CONFIG_NS_ID, "labelPrinter", /* hasChildren = */ true);
        this.name = getStringOption(attributes.name, ["zpl", "dpl", "ipl", "tcpl"]);
    }
}
class Layout extends OptionObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "layout", ["paginate", "panel"]);
    }
}
class Level extends IntegerObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "level", 0, (n) => n > 0);
    }
}
class Linearized extends Option01 {
    constructor(attributes) {
        super(CONFIG_NS_ID, "linearized");
    }
}
class Locale extends StringObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "locale");
    }
}
class LocaleSet extends StringObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "localeSet");
    }
}
class Log extends XFAObject {
    mode;
    threshold;
    to;
    uri;
    constructor(attributes) {
        super(CONFIG_NS_ID, "log", /* hasChildren = */ true);
    }
}
// Renamed in MapElement to avoid confusion with usual js Map.
class MapElement extends XFAObject {
    equate = new XFAObjectArray();
    equateRange = new XFAObjectArray();
    constructor(attributes) {
        super(CONFIG_NS_ID, "map", /* hasChildren = */ true);
    }
}
class MediumInfo extends XFAObject {
    map;
    constructor(attributes) {
        super(CONFIG_NS_ID, "mediumInfo", /* hasChildren = */ true);
    }
}
class Message extends XFAObject {
    msgId;
    severity;
    constructor(attributes) {
        super(CONFIG_NS_ID, "message", /* hasChildren = */ true);
    }
}
class Messaging extends XFAObject {
    message = new XFAObjectArray();
    constructor(attributes) {
        super(CONFIG_NS_ID, "messaging", /* hasChildren = */ true);
    }
}
class Mode extends OptionObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "mode", ["append", "overwrite"]);
    }
}
class ModifyAnnots extends Option01 {
    constructor(attributes) {
        super(CONFIG_NS_ID, "modifyAnnots");
    }
}
class MsgId extends IntegerObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "msgId", 1, (n) => n >= 1);
    }
}
class NameAttr extends StringObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "nameAttr");
    }
}
class NeverEmbed extends ContentObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "neverEmbed");
    }
}
class NumberOfCopies extends IntegerObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "numberOfCopies", 0, (n) => n >= 2 && n <= 5);
    }
}
class OpenAction extends XFAObject {
    destination;
    constructor(attributes) {
        super(CONFIG_NS_ID, "openAction", /* hasChildren = */ true);
    }
}
class Output extends XFAObject {
    to;
    type;
    uri;
    constructor(attributes) {
        super(CONFIG_NS_ID, "output", /* hasChildren = */ true);
    }
}
class OutputBin extends StringObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "outputBin");
    }
}
class OutputXSL extends XFAObject {
    uri;
    constructor(attributes) {
        super(CONFIG_NS_ID, "outputXSL", /* hasChildren = */ true);
    }
}
class Overprint extends OptionObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "overprint", ["none", "both", "draw", "field"]);
    }
}
class Packets extends StringObject {
    [$content];
    constructor(attributes) {
        super(CONFIG_NS_ID, "packets");
    }
    [$finalize]() {
        if (this[$content] === "*") {
            return;
        }
        this[$content] = this[$content]
            .trim()
            .split(/\s+/)
            .filter((x) => ["config", "datasets", "template", "xfdf", "xslt"].includes(x));
    }
}
class PageOffset extends XFAObject {
    x;
    y;
    constructor(attributes) {
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
    [$content];
    constructor(attributes) {
        super(CONFIG_NS_ID, "pageRange");
    }
    [$finalize]() {
        const numbers = this[$content]
            .trim()
            .split(/\s+/)
            .map((x) => parseInt(x, 10));
        const ranges = [];
        for (let i = 0, ii = numbers.length; i < ii; i += 2) {
            ranges.push(numbers.slice(i, i + 2));
        }
        this[$content] = ranges;
    }
}
class Pagination extends OptionObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "pagination", [
            "simplex",
            "duplexShortEdge",
            "duplexLongEdge",
        ]);
    }
}
class PaginationOverride extends OptionObject {
    constructor(attributes) {
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
    constructor(attributes) {
        super(CONFIG_NS_ID, "part", 1, (n) => false);
    }
}
class Pcl extends XFAObject {
    batchOutput;
    fontInfo;
    jog;
    mediumInfo;
    outputBin;
    pageOffset;
    staple;
    xdc;
    constructor(attributes) {
        super(CONFIG_NS_ID, "pcl", /* hasChildren = */ true);
        this.name = attributes.name || "";
    }
}
class Pdf extends XFAObject {
    adobeExtensionLevel;
    batchOutput;
    compression;
    creator;
    encryption;
    fontInfo;
    interactive;
    linearized;
    openAction;
    pdfa;
    producer;
    renderPolicy;
    scriptModel;
    silentPrint;
    submitFormat;
    tagged;
    version;
    viewerPreferences;
    xdc;
    constructor(attributes) {
        super(CONFIG_NS_ID, "pdf", /* hasChildren = */ true);
        this.name = attributes.name || "";
    }
}
class Pdfa extends XFAObject {
    amd;
    conformance;
    includeXDPContent;
    part;
    constructor(attributes) {
        super(CONFIG_NS_ID, "pdfa", /* hasChildren = */ true);
    }
}
class Permissions extends XFAObject {
    accessibleContent;
    change;
    contentCopy;
    documentAssembly;
    formFieldFilling;
    modifyAnnots;
    plaintextMetadata;
    print;
    printHighQuality;
    constructor(attributes) {
        super(CONFIG_NS_ID, "permissions", /* hasChildren = */ true);
    }
}
class PickTrayByPDFSize extends Option01 {
    constructor(attributes) {
        super(CONFIG_NS_ID, "pickTrayByPDFSize");
    }
}
class Picture extends StringObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "picture");
    }
}
class PlaintextMetadata extends Option01 {
    constructor(attributes) {
        super(CONFIG_NS_ID, "plaintextMetadata");
    }
}
class Presence extends OptionObject {
    constructor(attributes) {
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
    behaviorOverride;
    cache;
    common;
    copies;
    destination;
    incrementalMerge;
    layout = undefined;
    output;
    overprint;
    pagination;
    paginationOverride;
    script;
    validate;
    xdp;
    driver = new XFAObjectArray();
    labelPrinter = new XFAObjectArray();
    pcl = new XFAObjectArray();
    pdf = new XFAObjectArray();
    ps = new XFAObjectArray();
    submitUrl = new XFAObjectArray();
    webClient = new XFAObjectArray();
    zpl = new XFAObjectArray();
    constructor(attributes) {
        super(CONFIG_NS_ID, "present", /* hasChildren = */ true);
    }
}
class Print extends Option01 {
    constructor(attributes) {
        super(CONFIG_NS_ID, "print");
    }
}
class PrintHighQuality extends Option01 {
    constructor(attributes) {
        super(CONFIG_NS_ID, "printHighQuality");
    }
}
class PrintScaling extends OptionObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "printScaling", ["appdefault", "noScaling"]);
    }
}
class PrinterName extends StringObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "printerName");
    }
}
class Producer extends StringObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "producer");
    }
}
class Ps extends XFAObject {
    batchOutput;
    fontInfo;
    jog;
    mediumInfo;
    outputBin;
    staple;
    xdc;
    constructor(attributes) {
        super(CONFIG_NS_ID, "ps", /* hasChildren = */ true);
        this.name = attributes.name || "";
    }
}
class Range extends ContentObject {
    [$content];
    constructor(attributes) {
        super(CONFIG_NS_ID, "range");
    }
    [$finalize]() {
        this[$content] = this[$content]
            .trim()
            .split(/\s*,\s*/, 2)
            .map((range) => range.split("-").map((x) => parseInt(x.trim(), 10)))
            .filter((range) => range.every((x) => !isNaN(x)))
            .map((range) => {
            if (range.length === 1) {
                range.push(range[0]);
            }
            return range;
        });
    }
}
class Record extends ContentObject {
    [$content];
    constructor(attributes) {
        super(CONFIG_NS_ID, "record");
    }
    [$finalize]() {
        this[$content] = this[$content].trim();
        const n = parseInt(this[$content], 10);
        if (!isNaN(n) && n >= 0) {
            this[$content] = n;
        }
    }
}
class Relevant extends ContentObject {
    [$content];
    constructor(attributes) {
        super(CONFIG_NS_ID, "relevant");
    }
    [$finalize]() {
        this[$content] = this[$content].trim().split(/\s+/);
    }
}
class Rename extends ContentObject {
    [$content];
    constructor(attributes) {
        super(CONFIG_NS_ID, "rename");
    }
    [$finalize]() {
        this[$content] = this[$content].trim();
        // String must be a XFA name: same as XML one except that there
        // is no colon.
        if (this[$content].toLowerCase().startsWith("xml") ||
            this[$content].match(new RegExp("[\\p{L}_][\\p{L}\\d._\\p{M}-]*", "u"))) {
            warn("XFA - Rename: invalid XFA name");
        }
    }
}
class RenderPolicy extends OptionObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "renderPolicy", ["server", "client"]);
    }
}
class RunScripts extends OptionObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "runScripts", ["both", "client", "none", "server"]);
    }
}
class Script extends XFAObject {
    currentPage;
    exclude;
    runScripts;
    constructor(attributes) {
        super(CONFIG_NS_ID, "script", /* hasChildren = */ true);
    }
}
class ScriptModel extends OptionObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "scriptModel", ["XFA", "none"]);
    }
}
class Severity extends OptionObject {
    constructor(attributes) {
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
    addSilentPrint;
    printerName;
    constructor(attributes) {
        super(CONFIG_NS_ID, "silentPrint", /* hasChildren = */ true);
    }
}
class Staple extends XFAObject {
    mode;
    constructor(attributes) {
        super(CONFIG_NS_ID, "staple");
        this.mode = getStringOption(attributes.mode, [
            "usePrinterSetting",
            "on",
            "off",
        ]);
    }
}
class StartNode extends StringObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "startNode");
    }
}
class StartPage extends IntegerObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "startPage", 0, (n) => true);
    }
}
class SubmitFormat extends OptionObject {
    constructor(attributes) {
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
    constructor(attributes) {
        super(CONFIG_NS_ID, "submitUrl");
    }
}
class SubsetBelow extends IntegerObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "subsetBelow", 100, (n) => n >= 0 && n <= 100);
    }
}
class SuppressBanner extends Option01 {
    constructor(attributes) {
        super(CONFIG_NS_ID, "suppressBanner");
    }
}
class Tagged extends Option01 {
    constructor(attributes) {
        super(CONFIG_NS_ID, "tagged");
    }
}
/** @final */
class Template extends XFAObject {
    base;
    relevant;
    startPage;
    uri;
    xsl;
    constructor(attributes) {
        super(CONFIG_NS_ID, "template", /* hasChildren = */ true);
    }
}
class Threshold extends OptionObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "threshold", [
            "trace",
            "error",
            "information",
            "warning",
        ]);
    }
}
class To extends OptionObject {
    constructor(attributes) {
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
    constructor(attributes) {
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
    constructor(attributes) {
        super(CONFIG_NS_ID, "trace", /* hasChildren = */ true);
    }
}
class Transform extends XFAObject {
    groupParent;
    ifEmpty;
    nameAttr;
    picture;
    presence = undefined;
    rename;
    whitespace;
    constructor(attributes) {
        super(CONFIG_NS_ID, "transform", /* hasChildren = */ true);
    }
}
class Type extends OptionObject {
    constructor(attributes) {
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
    constructor(attributes) {
        super(CONFIG_NS_ID, "uri");
    }
}
class Validate extends OptionObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "validate", [
            "preSubmit",
            "prePrint",
            "preExecute",
            "preSave",
        ]);
    }
}
class ValidateApprovalSignatures extends ContentObject {
    [$content];
    constructor(attributes) {
        super(CONFIG_NS_ID, "validateApprovalSignatures");
    }
    [$finalize]() {
        this[$content] = this[$content]
            .trim()
            .split(/\s+/)
            .filter((x) => ["docReady", "postSign"].includes(x));
    }
}
class ValidationMessaging extends OptionObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "validationMessaging", [
            "allMessagesIndividually",
            "allMessagesTogether",
            "firstMessageOnly",
            "noMessages",
        ]);
    }
}
class Version extends OptionObject {
    constructor(attributes) {
        super(CONFIG_NS_ID, "version", ["1.7", "1.6", "1.5", "1.4", "1.3", "1.2"]);
    }
}
class VersionControl extends XFAObject {
    outputBelow;
    sourceAbove;
    sourceBelow;
    constructor(attributes) {
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
    ADBE_JSConsole;
    ADBE_JSDebugger;
    addViewerPreferences;
    duplexOption;
    enforce;
    numberOfCopies;
    pageRange;
    pickTrayByPDFSize;
    printScaling;
    constructor(attributes) {
        super(CONFIG_NS_ID, "viewerPreferences", /* hasChildren = */ true);
    }
}
class WebClient extends XFAObject {
    fontInfo;
    xdc;
    constructor(attributes) {
        super(CONFIG_NS_ID, "webClient", /* hasChildren = */ true);
        this.name = attributes.name ? attributes.name.trim() : "";
    }
}
class Whitespace extends OptionObject {
    constructor(attributes) {
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
    [$content];
    constructor(attributes) {
        super(CONFIG_NS_ID, "window");
    }
    [$finalize]() {
        const pair = this[$content]
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
        this[$content] = pair;
    }
}
class Xdc extends XFAObject {
    uri = new XFAObjectArray();
    xsl = new XFAObjectArray();
    constructor(attributes) {
        super(CONFIG_NS_ID, "xdc", /* hasChildren = */ true);
    }
}
class Xdp extends XFAObject {
    packets;
    constructor(attributes) {
        super(CONFIG_NS_ID, "xdp", /* hasChildren = */ true);
    }
}
class Xsl extends XFAObject {
    debug;
    uri;
    constructor(attributes) {
        super(CONFIG_NS_ID, "xsl", /* hasChildren = */ true);
    }
}
class Zpl extends XFAObject {
    batchOutput;
    flipLabel;
    fontInfo;
    xdc;
    constructor(attributes) {
        super(CONFIG_NS_ID, "zpl", /* hasChildren = */ true);
        this.name = attributes.name ? attributes.name.trim() : "";
    }
}
export const ConfigNamespace = {
    [$buildXFAObject](name, attributes) {
        if (Object.hasOwn(ConfigNamespace, name)) {
            return ConfigNamespace[name](attributes);
        }
        return undefined;
    },
    acrobat(attrs) {
        return new Acrobat(attrs);
    },
    acrobat7(attrs) {
        return new Acrobat7(attrs);
    },
    ADBE_JSConsole(attrs) {
        return new ADBE_JSConsole(attrs);
    },
    ADBE_JSDebugger(attrs) {
        return new ADBE_JSDebugger(attrs);
    },
    addSilentPrint(attrs) {
        return new AddSilentPrint(attrs);
    },
    addViewerPreferences(attrs) {
        return new AddViewerPreferences(attrs);
    },
    adjustData(attrs) {
        return new AdjustData(attrs);
    },
    adobeExtensionLevel(attrs) {
        return new AdobeExtensionLevel(attrs);
    },
    agent(attrs) {
        return new Agent(attrs);
    },
    alwaysEmbed(attrs) {
        return new AlwaysEmbed(attrs);
    },
    amd(attrs) {
        return new Amd(attrs);
    },
    area(attrs) {
        return new Area(attrs);
    },
    attributes(attrs) {
        return new Attributes(attrs);
    },
    autoSave(attrs) {
        return new AutoSave(attrs);
    },
    base(attrs) {
        return new Base(attrs);
    },
    batchOutput(attrs) {
        return new BatchOutput(attrs);
    },
    behaviorOverride(attrs) {
        return new BehaviorOverride(attrs);
    },
    cache(attrs) {
        return new Cache(attrs);
    },
    change(attrs) {
        return new Change(attrs);
    },
    common(attrs) {
        return new Common(attrs);
    },
    compress(attrs) {
        return new Compress(attrs);
    },
    compressLogicalStructure(attrs) {
        return new CompressLogicalStructure(attrs);
    },
    compressObjectStream(attrs) {
        return new CompressObjectStream(attrs);
    },
    compression(attrs) {
        return new Compression(attrs);
    },
    config(attrs) {
        return new Config(attrs);
    },
    conformance(attrs) {
        return new Conformance(attrs);
    },
    contentCopy(attrs) {
        return new ContentCopy(attrs);
    },
    copies(attrs) {
        return new Copies(attrs);
    },
    creator(attrs) {
        return new Creator(attrs);
    },
    currentPage(attrs) {
        return new CurrentPage(attrs);
    },
    data(attrs) {
        return new Data(attrs);
    },
    debug(attrs) {
        return new Debug(attrs);
    },
    defaultTypeface(attrs) {
        return new DefaultTypeface(attrs);
    },
    destination(attrs) {
        return new Destination(attrs);
    },
    documentAssembly(attrs) {
        return new DocumentAssembly(attrs);
    },
    driver(attrs) {
        return new Driver(attrs);
    },
    duplexOption(attrs) {
        return new DuplexOption(attrs);
    },
    dynamicRender(attrs) {
        return new DynamicRender(attrs);
    },
    embed(attrs) {
        return new Embed(attrs);
    },
    encrypt(attrs) {
        return new Encrypt(attrs);
    },
    encryption(attrs) {
        return new Encryption(attrs);
    },
    encryptionLevel(attrs) {
        return new EncryptionLevel(attrs);
    },
    enforce(attrs) {
        return new Enforce(attrs);
    },
    equate(attrs) {
        return new Equate(attrs);
    },
    equateRange(attrs) {
        return new EquateRange(attrs);
    },
    exclude(attrs) {
        return new Exclude(attrs);
    },
    excludeNS(attrs) {
        return new ExcludeNS(attrs);
    },
    flipLabel(attrs) {
        return new FlipLabel(attrs);
    },
    fontInfo(attrs) {
        return new FontInfo(attrs);
    },
    formFieldFilling(attrs) {
        return new FormFieldFilling(attrs);
    },
    groupParent(attrs) {
        return new GroupParent(attrs);
    },
    ifEmpty(attrs) {
        return new IfEmpty(attrs);
    },
    includeXDPContent(attrs) {
        return new IncludeXDPContent(attrs);
    },
    incrementalLoad(attrs) {
        return new IncrementalLoad(attrs);
    },
    incrementalMerge(attrs) {
        return new IncrementalMerge(attrs);
    },
    interactive(attrs) {
        return new Interactive(attrs);
    },
    jog(attrs) {
        return new Jog(attrs);
    },
    labelPrinter(attrs) {
        return new LabelPrinter(attrs);
    },
    layout(attrs) {
        return new Layout(attrs);
    },
    level(attrs) {
        return new Level(attrs);
    },
    linearized(attrs) {
        return new Linearized(attrs);
    },
    locale(attrs) {
        return new Locale(attrs);
    },
    localeSet(attrs) {
        return new LocaleSet(attrs);
    },
    log(attrs) {
        return new Log(attrs);
    },
    map(attrs) {
        return new MapElement(attrs);
    },
    mediumInfo(attrs) {
        return new MediumInfo(attrs);
    },
    message(attrs) {
        return new Message(attrs);
    },
    messaging(attrs) {
        return new Messaging(attrs);
    },
    mode(attrs) {
        return new Mode(attrs);
    },
    modifyAnnots(attrs) {
        return new ModifyAnnots(attrs);
    },
    msgId(attrs) {
        return new MsgId(attrs);
    },
    nameAttr(attrs) {
        return new NameAttr(attrs);
    },
    neverEmbed(attrs) {
        return new NeverEmbed(attrs);
    },
    numberOfCopies(attrs) {
        return new NumberOfCopies(attrs);
    },
    openAction(attrs) {
        return new OpenAction(attrs);
    },
    output(attrs) {
        return new Output(attrs);
    },
    outputBin(attrs) {
        return new OutputBin(attrs);
    },
    outputXSL(attrs) {
        return new OutputXSL(attrs);
    },
    overprint(attrs) {
        return new Overprint(attrs);
    },
    packets(attrs) {
        return new Packets(attrs);
    },
    pageOffset(attrs) {
        return new PageOffset(attrs);
    },
    pageRange(attrs) {
        return new PageRange(attrs);
    },
    pagination(attrs) {
        return new Pagination(attrs);
    },
    paginationOverride(attrs) {
        return new PaginationOverride(attrs);
    },
    part(attrs) {
        return new Part(attrs);
    },
    pcl(attrs) {
        return new Pcl(attrs);
    },
    pdf(attrs) {
        return new Pdf(attrs);
    },
    pdfa(attrs) {
        return new Pdfa(attrs);
    },
    permissions(attrs) {
        return new Permissions(attrs);
    },
    pickTrayByPDFSize(attrs) {
        return new PickTrayByPDFSize(attrs);
    },
    picture(attrs) {
        return new Picture(attrs);
    },
    plaintextMetadata(attrs) {
        return new PlaintextMetadata(attrs);
    },
    presence(attrs) {
        return new Presence(attrs);
    },
    present(attrs) {
        return new Present(attrs);
    },
    print(attrs) {
        return new Print(attrs);
    },
    printHighQuality(attrs) {
        return new PrintHighQuality(attrs);
    },
    printScaling(attrs) {
        return new PrintScaling(attrs);
    },
    printerName(attrs) {
        return new PrinterName(attrs);
    },
    producer(attrs) {
        return new Producer(attrs);
    },
    ps(attrs) {
        return new Ps(attrs);
    },
    range(attrs) {
        return new Range(attrs);
    },
    record(attrs) {
        return new Record(attrs);
    },
    relevant(attrs) {
        return new Relevant(attrs);
    },
    rename(attrs) {
        return new Rename(attrs);
    },
    renderPolicy(attrs) {
        return new RenderPolicy(attrs);
    },
    runScripts(attrs) {
        return new RunScripts(attrs);
    },
    script(attrs) {
        return new Script(attrs);
    },
    scriptModel(attrs) {
        return new ScriptModel(attrs);
    },
    severity(attrs) {
        return new Severity(attrs);
    },
    silentPrint(attrs) {
        return new SilentPrint(attrs);
    },
    staple(attrs) {
        return new Staple(attrs);
    },
    startNode(attrs) {
        return new StartNode(attrs);
    },
    startPage(attrs) {
        return new StartPage(attrs);
    },
    submitFormat(attrs) {
        return new SubmitFormat(attrs);
    },
    submitUrl(attrs) {
        return new SubmitUrl(attrs);
    },
    subsetBelow(attrs) {
        return new SubsetBelow(attrs);
    },
    suppressBanner(attrs) {
        return new SuppressBanner(attrs);
    },
    tagged(attrs) {
        return new Tagged(attrs);
    },
    template(attrs) {
        return new Template(attrs);
    },
    templateCache(attrs) {
        return new TemplateCache(attrs);
    },
    threshold(attrs) {
        return new Threshold(attrs);
    },
    to(attrs) {
        return new To(attrs);
    },
    trace(attrs) {
        return new Trace(attrs);
    },
    transform(attrs) {
        return new Transform(attrs);
    },
    type(attrs) {
        return new Type(attrs);
    },
    uri(attrs) {
        return new Uri(attrs);
    },
    validate(attrs) {
        return new Validate(attrs);
    },
    validateApprovalSignatures(attrs) {
        return new ValidateApprovalSignatures(attrs);
    },
    validationMessaging(attrs) {
        return new ValidationMessaging(attrs);
    },
    version(attrs) {
        return new Version(attrs);
    },
    versionControl(attrs) {
        return new VersionControl(attrs);
    },
    viewerPreferences(attrs) {
        return new ViewerPreferences(attrs);
    },
    webClient(attrs) {
        return new WebClient(attrs);
    },
    whitespace(attrs) {
        return new Whitespace(attrs);
    },
    window(attrs) {
        return new Window(attrs);
    },
    xdc(attrs) {
        return new Xdc(attrs);
    },
    xdp(attrs) {
        return new Xdp(attrs);
    },
    xsl(attrs) {
        return new Xsl(attrs);
    },
    zpl(attrs) {
        return new Zpl(attrs);
    },
};
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=config.js.map