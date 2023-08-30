import type { XFAAttrs } from "./alias.js";
import { $buildXFAObject } from "./namespaces.js";
import { $content, $finalize } from "./symbol_utils.js";
import { ContentObject, IntegerObject, Option01, Option10, OptionObject, StringObject, XFAObject, XFAObjectArray } from "./xfa_object.js";
declare class Acrobat extends XFAObject {
    acrobat7: unknown;
    autoSave: unknown;
    common: unknown;
    validate: unknown;
    validateApprovalSignatures: unknown;
    submitUrl: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
declare class Acrobat7 extends XFAObject {
    dynamicRender: unknown;
    constructor(attributes: XFAAttrs);
}
declare class ADBE_JSConsole extends OptionObject {
    constructor(attributes: XFAAttrs);
}
declare class ADBE_JSDebugger extends OptionObject {
    constructor(attributes: XFAAttrs);
}
declare class AddSilentPrint extends Option01 {
    constructor(attributes: XFAAttrs);
}
declare class AddViewerPreferences extends Option01 {
    constructor(attributes: XFAAttrs);
}
declare class AdjustData extends Option10 {
    constructor(attributes: XFAAttrs);
}
declare class AdobeExtensionLevel extends IntegerObject {
    constructor(attributes: XFAAttrs);
}
declare class Agent extends XFAObject {
    common: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
declare class AlwaysEmbed extends ContentObject {
    constructor(attributes: XFAAttrs);
}
declare class Amd extends StringObject {
    constructor(attributes: XFAAttrs);
}
declare class Area extends XFAObject {
    level: number;
    constructor(attributes: XFAAttrs);
}
declare class Attributes extends OptionObject {
    constructor(attributes: XFAAttrs);
}
declare class AutoSave extends OptionObject {
    constructor(attributes: XFAAttrs);
}
declare class Base extends StringObject {
    constructor(attributes: XFAAttrs);
}
declare class BatchOutput extends XFAObject {
    format: string;
    constructor(attributes: XFAAttrs);
}
declare class BehaviorOverride extends ContentObject {
    [$content]: string | Map<string, string>;
    constructor(attributes: XFAAttrs);
    [$finalize](): void;
}
declare class Cache extends XFAObject {
    templateCache: unknown;
    constructor(attributes: XFAAttrs);
}
declare class Change extends Option01 {
    constructor(attributes: XFAAttrs);
}
declare class Common extends XFAObject {
    data: unknown;
    locale: unknown;
    localeSet: unknown;
    messaging: unknown;
    suppressBanner: unknown;
    template: unknown;
    validationMessaging: unknown;
    versionControl: unknown;
    log: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
declare class Compress extends XFAObject {
    scope: string;
    constructor(attributes: XFAAttrs);
}
declare class CompressLogicalStructure extends Option01 {
    constructor(attributes: XFAAttrs);
}
declare class CompressObjectStream extends Option10 {
    constructor(attributes: XFAAttrs);
}
declare class Compression extends XFAObject {
    compressLogicalStructure: unknown;
    compressObjectStream: unknown;
    level: unknown;
    type: unknown;
    constructor(attributes: XFAAttrs);
}
export declare class Config extends XFAObject {
    acrobat: unknown;
    present: unknown;
    trace: unknown;
    agent: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
declare class Conformance extends OptionObject {
    constructor(attributes: XFAAttrs);
}
declare class ContentCopy extends Option01 {
    constructor(attributes: XFAAttrs);
}
declare class Copies extends IntegerObject {
    constructor(attributes: XFAAttrs);
}
declare class Creator extends StringObject {
    constructor(attributes: XFAAttrs);
}
declare class CurrentPage extends IntegerObject {
    constructor(attributes: XFAAttrs);
}
declare class Data extends XFAObject {
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
    excludeNS: XFAObjectArray;
    transform: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
declare class Debug extends XFAObject {
    uri: unknown;
    constructor(attributes: XFAAttrs);
}
declare class DefaultTypeface extends ContentObject {
    writingScript: string;
    constructor(attributes: XFAAttrs);
}
declare class Destination extends OptionObject {
    constructor(attributes: XFAAttrs);
}
declare class DocumentAssembly extends Option01 {
    constructor(attributes: XFAAttrs);
}
declare class Driver extends XFAObject {
    fontInfo: unknown;
    xdc: unknown;
    constructor(attributes: XFAAttrs);
}
declare class DuplexOption extends OptionObject {
    constructor(attributes: XFAAttrs);
}
declare class DynamicRender extends OptionObject {
    constructor(attributes: XFAAttrs);
}
declare class Embed extends Option01 {
    constructor(attributes: XFAAttrs);
}
declare class Encrypt extends Option01 {
    constructor(attributes: XFAAttrs);
}
declare class Encryption extends XFAObject {
    encrypt: unknown;
    encryptionLevel: unknown;
    permissions: unknown;
    constructor(attributes: XFAAttrs);
}
declare class EncryptionLevel extends OptionObject {
    constructor(attributes: XFAAttrs);
}
declare class Enforce extends StringObject {
    constructor(attributes: XFAAttrs);
}
declare class Equate extends XFAObject {
    force: number;
    from: string;
    to: string;
    constructor(attributes: XFAAttrs);
}
declare class EquateRange extends XFAObject {
    from: string;
    to: string;
    _unicodeRange: string;
    constructor(attributes: XFAAttrs);
    get unicodeRange(): [number, number][];
}
declare class Exclude extends ContentObject {
    [$content]: string | string[];
    constructor(attributes: XFAAttrs);
    [$finalize](): void;
}
declare class ExcludeNS extends StringObject {
    constructor(attributes: XFAAttrs);
}
declare class FlipLabel extends OptionObject {
    constructor(attributes: XFAAttrs);
}
declare class FontInfo extends XFAObject {
    embed: unknown;
    map: unknown;
    subsetBelow: unknown;
    alwaysEmbed: XFAObjectArray;
    defaultTypeface: XFAObjectArray;
    neverEmbed: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
declare class FormFieldFilling extends Option01 {
    constructor(attributes: XFAAttrs);
}
declare class GroupParent extends StringObject {
    constructor(attributes: XFAAttrs);
}
declare class IfEmpty extends OptionObject {
    constructor(attributes: XFAAttrs);
}
declare class IncludeXDPContent extends StringObject {
    constructor(attributes: XFAAttrs);
}
declare class IncrementalLoad extends OptionObject {
    constructor(attributes: XFAAttrs);
}
declare class IncrementalMerge extends Option01 {
    constructor(attributes: XFAAttrs);
}
declare class Interactive extends Option01 {
    constructor(attributes: XFAAttrs);
}
declare class Jog extends OptionObject {
    constructor(attributes: XFAAttrs);
}
declare class LabelPrinter extends XFAObject {
    batchOutput: unknown;
    flipLabel: unknown;
    fontInfo: unknown;
    xdc: unknown;
    constructor(attributes: XFAAttrs);
}
declare class Layout extends OptionObject {
    constructor(attributes: XFAAttrs);
}
declare class Level extends IntegerObject {
    constructor(attributes: XFAAttrs);
}
declare class Linearized extends Option01 {
    constructor(attributes: XFAAttrs);
}
declare class Locale extends StringObject {
    constructor(attributes: XFAAttrs);
}
declare class LocaleSet extends StringObject {
    constructor(attributes: XFAAttrs);
}
declare class Log extends XFAObject {
    mode: unknown;
    threshold: unknown;
    to: unknown;
    uri: unknown;
    constructor(attributes: XFAAttrs);
}
declare class MapElement extends XFAObject {
    equate: XFAObjectArray;
    equateRange: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
declare class MediumInfo extends XFAObject {
    map: unknown;
    constructor(attributes: XFAAttrs);
}
declare class Message extends XFAObject {
    msgId: unknown;
    severity: unknown;
    constructor(attributes: XFAAttrs);
}
declare class Messaging extends XFAObject {
    message: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
declare class Mode extends OptionObject {
    constructor(attributes: XFAAttrs);
}
declare class ModifyAnnots extends Option01 {
    constructor(attributes: XFAAttrs);
}
declare class MsgId extends IntegerObject {
    constructor(attributes: XFAAttrs);
}
declare class NameAttr extends StringObject {
    constructor(attributes: XFAAttrs);
}
declare class NeverEmbed extends ContentObject {
    constructor(attributes: XFAAttrs);
}
declare class NumberOfCopies extends IntegerObject {
    constructor(attributes: XFAAttrs);
}
declare class OpenAction extends XFAObject {
    destination: unknown;
    constructor(attributes: XFAAttrs);
}
declare class Output extends XFAObject {
    to: unknown;
    type: unknown;
    uri: unknown;
    constructor(attributes: XFAAttrs);
}
declare class OutputBin extends StringObject {
    constructor(attributes: XFAAttrs);
}
declare class OutputXSL extends XFAObject {
    uri: unknown;
    constructor(attributes: XFAAttrs);
}
declare class Overprint extends OptionObject {
    constructor(attributes: XFAAttrs);
}
declare class Packets extends StringObject {
    [$content]: string | Date | string[];
    constructor(attributes: XFAAttrs);
    [$finalize](): void;
}
declare class PageOffset extends XFAObject {
    x: number;
    y: number;
    constructor(attributes: XFAAttrs);
}
declare class PageRange extends StringObject {
    [$content]: string | [number, number][];
    constructor(attributes: XFAAttrs);
    [$finalize](): void;
}
declare class Pagination extends OptionObject {
    constructor(attributes: XFAAttrs);
}
declare class PaginationOverride extends OptionObject {
    constructor(attributes: XFAAttrs);
}
declare class Part extends IntegerObject {
    constructor(attributes: XFAAttrs);
}
declare class Pcl extends XFAObject {
    batchOutput: unknown;
    fontInfo: unknown;
    jog: unknown;
    mediumInfo: unknown;
    outputBin: unknown;
    pageOffset: unknown;
    staple: unknown;
    xdc: unknown;
    constructor(attributes: XFAAttrs);
}
declare class Pdf extends XFAObject {
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
    constructor(attributes: XFAAttrs);
}
declare class Pdfa extends XFAObject {
    amd: unknown;
    conformance: unknown;
    includeXDPContent: unknown;
    part: unknown;
    constructor(attributes: XFAAttrs);
}
declare class Permissions extends XFAObject {
    accessibleContent: unknown;
    change: unknown;
    contentCopy: unknown;
    documentAssembly: unknown;
    formFieldFilling: unknown;
    modifyAnnots: unknown;
    plaintextMetadata: unknown;
    print: unknown;
    printHighQuality: unknown;
    constructor(attributes: XFAAttrs);
}
declare class PickTrayByPDFSize extends Option01 {
    constructor(attributes: XFAAttrs);
}
declare class Picture extends StringObject {
    constructor(attributes: XFAAttrs);
}
declare class PlaintextMetadata extends Option01 {
    constructor(attributes: XFAAttrs);
}
declare class Presence extends OptionObject {
    constructor(attributes: XFAAttrs);
}
declare class Present extends XFAObject {
    behaviorOverride: unknown;
    cache: unknown;
    common: unknown;
    copies: unknown;
    destination: unknown;
    incrementalMerge: unknown;
    layout: string | undefined;
    output: unknown;
    overprint: unknown;
    pagination: unknown;
    paginationOverride: unknown;
    script: unknown;
    validate: unknown;
    xdp: unknown;
    driver: XFAObjectArray;
    labelPrinter: XFAObjectArray;
    pcl: XFAObjectArray;
    pdf: XFAObjectArray;
    ps: XFAObjectArray;
    submitUrl: XFAObjectArray;
    webClient: XFAObjectArray;
    zpl: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
declare class Print extends Option01 {
    constructor(attributes: XFAAttrs);
}
declare class PrintHighQuality extends Option01 {
    constructor(attributes: XFAAttrs);
}
declare class PrintScaling extends OptionObject {
    constructor(attributes: XFAAttrs);
}
declare class PrinterName extends StringObject {
    constructor(attributes: XFAAttrs);
}
declare class Producer extends StringObject {
    constructor(attributes: XFAAttrs);
}
declare class Ps extends XFAObject {
    batchOutput: unknown;
    fontInfo: unknown;
    jog: unknown;
    mediumInfo: unknown;
    outputBin: unknown;
    staple: unknown;
    xdc: unknown;
    constructor(attributes: XFAAttrs);
}
declare class Range extends ContentObject {
    [$content]: string | [number, number][];
    constructor(attributes: XFAAttrs);
    [$finalize](): void;
}
declare class Record extends ContentObject {
    [$content]: string;
    constructor(attributes: XFAAttrs);
    [$finalize](): void;
}
declare class Relevant extends ContentObject {
    [$content]: string | string[];
    constructor(attributes: XFAAttrs);
    [$finalize](): void;
}
declare class Rename extends ContentObject {
    [$content]: string;
    constructor(attributes: XFAAttrs);
    [$finalize](): void;
}
declare class RenderPolicy extends OptionObject {
    constructor(attributes: XFAAttrs);
}
declare class RunScripts extends OptionObject {
    constructor(attributes: XFAAttrs);
}
declare class Script extends XFAObject {
    currentPage: unknown;
    exclude: unknown;
    runScripts: unknown;
    constructor(attributes: XFAAttrs);
}
declare class ScriptModel extends OptionObject {
    constructor(attributes: XFAAttrs);
}
declare class Severity extends OptionObject {
    constructor(attributes: XFAAttrs);
}
declare class SilentPrint extends XFAObject {
    addSilentPrint: unknown;
    printerName: unknown;
    constructor(attributes: XFAAttrs);
}
declare class Staple extends XFAObject {
    mode: string;
    constructor(attributes: XFAAttrs);
}
declare class StartNode extends StringObject {
    constructor(attributes: XFAAttrs);
}
declare class StartPage extends IntegerObject {
    constructor(attributes: XFAAttrs);
}
declare class SubmitFormat extends OptionObject {
    constructor(attributes: XFAAttrs);
}
declare class SubmitUrl extends StringObject {
    constructor(attributes: XFAAttrs);
}
declare class SubsetBelow extends IntegerObject {
    constructor(attributes: XFAAttrs);
}
declare class SuppressBanner extends Option01 {
    constructor(attributes: XFAAttrs);
}
declare class Tagged extends Option01 {
    constructor(attributes: XFAAttrs);
}
/** @final */
declare class Template extends XFAObject {
    base: unknown;
    relevant: unknown;
    startPage: unknown;
    uri: unknown;
    xsl: unknown;
    constructor(attributes: XFAAttrs);
}
declare class Threshold extends OptionObject {
    constructor(attributes: XFAAttrs);
}
declare class To extends OptionObject {
    constructor(attributes: XFAAttrs);
}
declare class TemplateCache extends XFAObject {
    maxEntries: number;
    constructor(attributes: XFAAttrs);
}
declare class Trace extends XFAObject {
    area: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
declare class Transform extends XFAObject {
    groupParent: unknown;
    ifEmpty: unknown;
    nameAttr: unknown;
    picture: unknown;
    presence: string | undefined;
    rename: unknown;
    whitespace: unknown;
    constructor(attributes: XFAAttrs);
}
declare class Type extends OptionObject {
    constructor(attributes: XFAAttrs);
}
declare class Uri extends StringObject {
    constructor(attributes: XFAAttrs);
}
declare class Validate extends OptionObject {
    constructor(attributes: XFAAttrs);
}
declare class ValidateApprovalSignatures extends ContentObject {
    [$content]: string | string[];
    constructor(attributes: XFAAttrs);
    [$finalize](): void;
}
declare class ValidationMessaging extends OptionObject {
    constructor(attributes: XFAAttrs);
}
declare class Version extends OptionObject {
    constructor(attributes: XFAAttrs);
}
declare class VersionControl extends XFAObject {
    outputBelow: string;
    sourceAbove: string;
    sourceBelow: string;
    constructor(attributes: XFAAttrs);
}
declare class ViewerPreferences extends XFAObject {
    ADBE_JSConsole: unknown;
    ADBE_JSDebugger: unknown;
    addViewerPreferences: unknown;
    duplexOption: unknown;
    enforce: unknown;
    numberOfCopies: unknown;
    pageRange: unknown;
    pickTrayByPDFSize: unknown;
    printScaling: unknown;
    constructor(attributes: XFAAttrs);
}
declare class WebClient extends XFAObject {
    fontInfo: unknown;
    xdc: unknown;
    constructor(attributes: XFAAttrs);
}
declare class Whitespace extends OptionObject {
    constructor(attributes: XFAAttrs);
}
declare class Window extends ContentObject {
    [$content]: string | [number, number];
    constructor(attributes: XFAAttrs);
    [$finalize](): void;
}
declare class Xdc extends XFAObject {
    uri: XFAObjectArray;
    xsl: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
declare class Xdp extends XFAObject {
    packets: unknown;
    constructor(attributes: XFAAttrs);
}
declare class Xsl extends XFAObject {
    debug: unknown;
    uri: unknown;
    constructor(attributes: XFAAttrs);
}
declare class Zpl extends XFAObject {
    batchOutput: unknown;
    flipLabel: unknown;
    fontInfo: unknown;
    xdc: unknown;
    constructor(attributes: XFAAttrs);
}
export type XFANsConfig = typeof ConfigNamespace;
export declare const ConfigNamespace: {
    [$buildXFAObject](name: string, attributes: XFAAttrs): Acrobat | Acrobat7 | ADBE_JSConsole | ADBE_JSDebugger | AddSilentPrint | AddViewerPreferences | AdjustData | AdobeExtensionLevel | Agent | AlwaysEmbed | Amd | Area | Attributes | AutoSave | Base | BatchOutput | BehaviorOverride | Cache | Change | Common | Compress | CompressLogicalStructure | CompressObjectStream | Compression | Config | Conformance | ContentCopy | Copies | Creator | CurrentPage | Data | Debug | DefaultTypeface | Destination | DocumentAssembly | Driver | DuplexOption | DynamicRender | Embed | Encrypt | Encryption | EncryptionLevel | Enforce | Equate | EquateRange | Exclude | ExcludeNS | FlipLabel | FontInfo | FormFieldFilling | GroupParent | IfEmpty | IncludeXDPContent | IncrementalLoad | IncrementalMerge | Interactive | Jog | LabelPrinter | Layout | Level | Linearized | Locale | LocaleSet | Log | MapElement | MediumInfo | Message | Messaging | Mode | ModifyAnnots | MsgId | NameAttr | NeverEmbed | NumberOfCopies | OpenAction | Output | OutputBin | OutputXSL | Overprint | Packets | PageOffset | PageRange | Pagination | PaginationOverride | Part | Pcl | Pdf | Pdfa | Permissions | PickTrayByPDFSize | Picture | PlaintextMetadata | Presence | Present | Print | PrintHighQuality | PrintScaling | PrinterName | Producer | Ps | Range | Record | Relevant | Rename | RenderPolicy | RunScripts | Script | ScriptModel | Severity | SilentPrint | Staple | StartNode | StartPage | SubmitFormat | SubmitUrl | SubsetBelow | SuppressBanner | Tagged | Template | Threshold | To | TemplateCache | Trace | Transform | Type | Uri | Validate | ValidateApprovalSignatures | ValidationMessaging | Version | VersionControl | ViewerPreferences | WebClient | Whitespace | Window | Xdc | Xdp | Xsl | Zpl | undefined;
    acrobat(attrs: XFAAttrs): Acrobat;
    acrobat7(attrs: XFAAttrs): Acrobat7;
    ADBE_JSConsole(attrs: XFAAttrs): ADBE_JSConsole;
    ADBE_JSDebugger(attrs: XFAAttrs): ADBE_JSDebugger;
    addSilentPrint(attrs: XFAAttrs): AddSilentPrint;
    addViewerPreferences(attrs: XFAAttrs): AddViewerPreferences;
    adjustData(attrs: XFAAttrs): AdjustData;
    adobeExtensionLevel(attrs: XFAAttrs): AdobeExtensionLevel;
    agent(attrs: XFAAttrs): Agent;
    alwaysEmbed(attrs: XFAAttrs): AlwaysEmbed;
    amd(attrs: XFAAttrs): Amd;
    area(attrs: XFAAttrs): Area;
    attributes(attrs: XFAAttrs): Attributes;
    autoSave(attrs: XFAAttrs): AutoSave;
    base(attrs: XFAAttrs): Base;
    batchOutput(attrs: XFAAttrs): BatchOutput;
    behaviorOverride(attrs: XFAAttrs): BehaviorOverride;
    cache(attrs: XFAAttrs): Cache;
    change(attrs: XFAAttrs): Change;
    common(attrs: XFAAttrs): Common;
    compress(attrs: XFAAttrs): Compress;
    compressLogicalStructure(attrs: XFAAttrs): CompressLogicalStructure;
    compressObjectStream(attrs: XFAAttrs): CompressObjectStream;
    compression(attrs: XFAAttrs): Compression;
    config(attrs: XFAAttrs): Config;
    conformance(attrs: XFAAttrs): Conformance;
    contentCopy(attrs: XFAAttrs): ContentCopy;
    copies(attrs: XFAAttrs): Copies;
    creator(attrs: XFAAttrs): Creator;
    currentPage(attrs: XFAAttrs): CurrentPage;
    data(attrs: XFAAttrs): Data;
    debug(attrs: XFAAttrs): Debug;
    defaultTypeface(attrs: XFAAttrs): DefaultTypeface;
    destination(attrs: XFAAttrs): Destination;
    documentAssembly(attrs: XFAAttrs): DocumentAssembly;
    driver(attrs: XFAAttrs): Driver;
    duplexOption(attrs: XFAAttrs): DuplexOption;
    dynamicRender(attrs: XFAAttrs): DynamicRender;
    embed(attrs: XFAAttrs): Embed;
    encrypt(attrs: XFAAttrs): Encrypt;
    encryption(attrs: XFAAttrs): Encryption;
    encryptionLevel(attrs: XFAAttrs): EncryptionLevel;
    enforce(attrs: XFAAttrs): Enforce;
    equate(attrs: XFAAttrs): Equate;
    equateRange(attrs: XFAAttrs): EquateRange;
    exclude(attrs: XFAAttrs): Exclude;
    excludeNS(attrs: XFAAttrs): ExcludeNS;
    flipLabel(attrs: XFAAttrs): FlipLabel;
    fontInfo(attrs: XFAAttrs): FontInfo;
    formFieldFilling(attrs: XFAAttrs): FormFieldFilling;
    groupParent(attrs: XFAAttrs): GroupParent;
    ifEmpty(attrs: XFAAttrs): IfEmpty;
    includeXDPContent(attrs: XFAAttrs): IncludeXDPContent;
    incrementalLoad(attrs: XFAAttrs): IncrementalLoad;
    incrementalMerge(attrs: XFAAttrs): IncrementalMerge;
    interactive(attrs: XFAAttrs): Interactive;
    jog(attrs: XFAAttrs): Jog;
    labelPrinter(attrs: XFAAttrs): LabelPrinter;
    layout(attrs: XFAAttrs): Layout;
    level(attrs: XFAAttrs): Level;
    linearized(attrs: XFAAttrs): Linearized;
    locale(attrs: XFAAttrs): Locale;
    localeSet(attrs: XFAAttrs): LocaleSet;
    log(attrs: XFAAttrs): Log;
    map(attrs: XFAAttrs): MapElement;
    mediumInfo(attrs: XFAAttrs): MediumInfo;
    message(attrs: XFAAttrs): Message;
    messaging(attrs: XFAAttrs): Messaging;
    mode(attrs: XFAAttrs): Mode;
    modifyAnnots(attrs: XFAAttrs): ModifyAnnots;
    msgId(attrs: XFAAttrs): MsgId;
    nameAttr(attrs: XFAAttrs): NameAttr;
    neverEmbed(attrs: XFAAttrs): NeverEmbed;
    numberOfCopies(attrs: XFAAttrs): NumberOfCopies;
    openAction(attrs: XFAAttrs): OpenAction;
    output(attrs: XFAAttrs): Output;
    outputBin(attrs: XFAAttrs): OutputBin;
    outputXSL(attrs: XFAAttrs): OutputXSL;
    overprint(attrs: XFAAttrs): Overprint;
    packets(attrs: XFAAttrs): Packets;
    pageOffset(attrs: XFAAttrs): PageOffset;
    pageRange(attrs: XFAAttrs): PageRange;
    pagination(attrs: XFAAttrs): Pagination;
    paginationOverride(attrs: XFAAttrs): PaginationOverride;
    part(attrs: XFAAttrs): Part;
    pcl(attrs: XFAAttrs): Pcl;
    pdf(attrs: XFAAttrs): Pdf;
    pdfa(attrs: XFAAttrs): Pdfa;
    permissions(attrs: XFAAttrs): Permissions;
    pickTrayByPDFSize(attrs: XFAAttrs): PickTrayByPDFSize;
    picture(attrs: XFAAttrs): Picture;
    plaintextMetadata(attrs: XFAAttrs): PlaintextMetadata;
    presence(attrs: XFAAttrs): Presence;
    present(attrs: XFAAttrs): Present;
    print(attrs: XFAAttrs): Print;
    printHighQuality(attrs: XFAAttrs): PrintHighQuality;
    printScaling(attrs: XFAAttrs): PrintScaling;
    printerName(attrs: XFAAttrs): PrinterName;
    producer(attrs: XFAAttrs): Producer;
    ps(attrs: XFAAttrs): Ps;
    range(attrs: XFAAttrs): Range;
    record(attrs: XFAAttrs): Record;
    relevant(attrs: XFAAttrs): Relevant;
    rename(attrs: XFAAttrs): Rename;
    renderPolicy(attrs: XFAAttrs): RenderPolicy;
    runScripts(attrs: XFAAttrs): RunScripts;
    script(attrs: XFAAttrs): Script;
    scriptModel(attrs: XFAAttrs): ScriptModel;
    severity(attrs: XFAAttrs): Severity;
    silentPrint(attrs: XFAAttrs): SilentPrint;
    staple(attrs: XFAAttrs): Staple;
    startNode(attrs: XFAAttrs): StartNode;
    startPage(attrs: XFAAttrs): StartPage;
    submitFormat(attrs: XFAAttrs): SubmitFormat;
    submitUrl(attrs: XFAAttrs): SubmitUrl;
    subsetBelow(attrs: XFAAttrs): SubsetBelow;
    suppressBanner(attrs: XFAAttrs): SuppressBanner;
    tagged(attrs: XFAAttrs): Tagged;
    template(attrs: XFAAttrs): Template;
    templateCache(attrs: XFAAttrs): TemplateCache;
    threshold(attrs: XFAAttrs): Threshold;
    to(attrs: XFAAttrs): To;
    trace(attrs: XFAAttrs): Trace;
    transform(attrs: XFAAttrs): Transform;
    type(attrs: XFAAttrs): Type;
    uri(attrs: XFAAttrs): Uri;
    validate(attrs: XFAAttrs): Validate;
    validateApprovalSignatures(attrs: XFAAttrs): ValidateApprovalSignatures;
    validationMessaging(attrs: XFAAttrs): ValidationMessaging;
    version(attrs: XFAAttrs): Version;
    versionControl(attrs: XFAAttrs): VersionControl;
    viewerPreferences(attrs: XFAAttrs): ViewerPreferences;
    webClient(attrs: XFAAttrs): WebClient;
    whitespace(attrs: XFAAttrs): Whitespace;
    window(attrs: XFAAttrs): Window;
    xdc(attrs: XFAAttrs): Xdc;
    xdp(attrs: XFAAttrs): Xdp;
    xsl(attrs: XFAAttrs): Xsl;
    zpl(attrs: XFAAttrs): Zpl;
};
export {};
//# sourceMappingURL=config.d.ts.map