import { type rect_t } from "../../shared/util.js";
import { type AvailableSpace, type XFAAttrs, type XFAElData, type XFAExtra, type XFAFontBase, type XFAHTMLObj, type XFAIds, type XFAStyleData, type XFAValue } from "./alias.js";
import { Builder } from "./builder.js";
import { type XFALayoutMode } from "./html_utils.js";
import { $buildXFAObject } from "./namespaces.js";
import { HTMLResult, type XFAColor } from "./utils.js";
import { $acceptWhitespace, $addHTML, $clean, $cleanPage, $content, $data, $extra, $finalize, $flushHTML, $getAvailableSpace, $getContainedChildren, $getExtra, $getNextPage, $getSubformParent, $hasSettableValue, $ids, $isBindable, $isCDATAXml, $isSplittable, $isThereMoreWidth, $isTransparent, $isUsable, $onChild, $onText, $searchNode, $setValue, $text, $toHTML, $toPages, $toStyle, ContentObject, Option01, OptionObject, StringObject, XFAObject, XFAObjectArray, XmlObject } from "./xfa_object.js";
import { XhtmlObject } from "./xhtml.js";
declare class AppearanceFilter extends StringObject {
    type: string;
    constructor(attributes: XFAAttrs);
}
declare class Arc extends XFAObject {
    circular: number;
    hand: string;
    startAngle: number;
    sweepAngle: number;
    edge?: Edge;
    fill?: Fill;
    constructor(attributes: XFAAttrs);
    [$toHTML](): HTMLResult;
}
export declare class Area extends XFAObject {
    colSpan: number;
    relevant: {
        excluded: boolean;
        viewname: string;
    }[];
    x: number;
    y: number;
    desc: unknown;
    extras: unknown;
    area: XFAObjectArray;
    draw: XFAObjectArray;
    exObject: XFAObjectArray;
    exclGroup: XFAObjectArray;
    field: XFAObjectArray;
    subform: XFAObjectArray;
    subformSet: XFAObjectArray;
    [$extra]: XFAExtra;
    constructor(attributes: XFAAttrs);
    [$getContainedChildren](): Generator<XFAObject, void, unknown>;
    [$isTransparent](): boolean;
    [$isBindable](): boolean;
    [$addHTML](html: XFAElData, bbox: rect_t): void;
    [$getAvailableSpace](): AvailableSpace | undefined;
    [$toHTML](availableSpace?: AvailableSpace): HTMLResult;
}
declare class Assist extends XFAObject {
    role: string;
    speak: Speak | undefined;
    toolTip: ToolTip | undefined;
    constructor(attributes: XFAAttrs);
    [$toHTML](): string | undefined;
}
declare class Barcode extends XFAObject {
    charEncoding: string;
    checksum: string;
    dataColumnCount: number;
    dataLength: number;
    dataPrep: string;
    dataRowCount: number;
    endChar: string;
    errorCorrectionLevel: number;
    moduleHeight: number;
    moduleWidth: number;
    printCheckDigit: number;
    rowColumnRatio: {
        num: number;
        den: number;
    };
    startChar: string;
    textLocation: string;
    truncate: number;
    type: string;
    upsMode: string;
    wideNarrowRatio: {
        num: number;
        den: number;
    };
    encrypt: unknown;
    extras: unknown;
    constructor(attributes: XFAAttrs);
}
declare class Bind extends XFAObject {
    match: string;
    ref: string;
    picture?: Picture;
    constructor(attributes: XFAAttrs);
}
export declare class BindItems extends XFAObject {
    connection: string;
    labelRef: string;
    ref: string;
    valueRef: string;
    constructor(attributes: XFAAttrs);
}
declare class Bookend extends XFAObject {
    leader: string;
    trailer: string;
    constructor(attributes: XFAAttrs);
}
declare class BooleanElement extends Option01 {
    constructor(attributes: XFAAttrs);
    [$toHTML](availableSpace?: AvailableSpace): HTMLResult;
}
export interface BorderExtra {
    widths: number[];
    insets: rect_t;
    edges: Edge[];
}
export declare class Border extends XFAObject {
    break: string;
    hand: string;
    presence: string;
    relevant: {
        excluded: boolean;
        viewname: string;
    }[];
    corner: XFAObjectArray;
    edge: XFAObjectArray;
    extras: unknown;
    fill?: Fill;
    margin: Margin | undefined;
    [$extra]: BorderExtra | undefined;
    constructor(attributes: XFAAttrs);
    [$getExtra](): BorderExtra;
    [$toStyle](): XFAStyleData;
}
declare class Break extends XFAObject {
    after: string;
    afterTarget: string;
    before: string;
    beforeTarget: string;
    bookendLeader: string;
    bookendTrailer: string;
    overflowLeader: string;
    overflowTarget: string;
    overflowTrailer: string;
    startNew: number;
    extras: unknown;
    constructor(attributes: XFAAttrs);
}
export declare class BreakAfter extends XFAObject {
    leader: string;
    startNew: number;
    target: string;
    targetType: string;
    trailer: string;
    script: unknown;
    constructor(attributes: XFAAttrs);
}
export declare class BreakBefore extends XFAObject {
    leader: string;
    startNew: number;
    target: string;
    targetType: string;
    trailer: string;
    script: unknown;
    constructor(attributes: XFAAttrs);
    [$toHTML](availableSpace?: AvailableSpace): HTMLResult;
}
declare class Button extends XFAObject {
    highlight: string;
    extras: unknown;
    constructor(attributes: XFAAttrs);
    [$toHTML](availableSpace?: AvailableSpace): HTMLResult;
}
declare class Calculate extends XFAObject {
    override: string;
    extras: unknown;
    message: unknown;
    script: unknown;
    constructor(attributes: XFAAttrs);
}
export declare class Caption extends XFAObject {
    placement: string;
    presence: string;
    reserve: number;
    extras: unknown;
    font?: Font;
    margin: Margin | undefined;
    para: Para | undefined;
    value?: Value;
    [$extra]: XFALayoutMode | undefined;
    constructor(attributes: XFAAttrs);
    [$setValue](value: XFAValue): void;
    [$getExtra](availableSpace?: AvailableSpace): XFALayoutMode;
    [$toHTML](availableSpace?: AvailableSpace): HTMLResult;
}
declare class Certificate extends StringObject {
    constructor(attributes: XFAAttrs);
}
declare class Certificates extends XFAObject {
    credentialServerPolicy: string;
    url: string;
    urlPolicy: string;
    encryption: unknown;
    issuers: unknown;
    keyUsage: unknown;
    oids: unknown;
    signing: unknown;
    subjectDNs: unknown;
    constructor(attributes: XFAAttrs);
}
declare class CheckButton extends XFAObject {
    mark: string;
    shape: string;
    size: number;
    border: unknown | undefined;
    extras: unknown;
    margin: Margin | undefined;
    constructor(attributes: XFAAttrs);
    [$toHTML](availableSpace?: AvailableSpace): HTMLResult;
}
declare class ChoiceList extends XFAObject {
    commitOn: string;
    open: string;
    textEntry: number;
    border: unknown | undefined;
    extras: unknown;
    margin: undefined;
    constructor(attributes: XFAAttrs);
    [$toHTML](availableSpace?: AvailableSpace): HTMLResult;
}
declare class Color extends XFAObject {
    cSpace: string;
    value: "" | XFAColor;
    extras: unknown;
    constructor(attributes: XFAAttrs);
    [$hasSettableValue](): boolean;
    [$toStyle](): string | undefined;
}
declare class Comb extends XFAObject {
    numberOfCells: number;
    constructor(attributes: XFAAttrs);
}
declare class Connect extends XFAObject {
    connection: string;
    ref: string;
    usage: string;
    picture: unknown;
    constructor(attributes: XFAAttrs);
}
export declare class ContentArea extends XFAObject {
    h: number;
    relevant: {
        excluded: boolean;
        viewname: string;
    }[];
    w: number;
    x: number;
    y: number;
    desc: unknown;
    extras: unknown;
    constructor(attributes: XFAAttrs);
    [$toHTML](availableSpace?: AvailableSpace): HTMLResult;
}
declare class Corner extends XFAObject {
    inverted: number;
    join: string;
    presence: string;
    radius: number;
    stroke: string;
    thickness: number;
    color: unknown;
    extras: unknown;
    constructor(attributes: XFAAttrs);
    [$toStyle](): XFAStyleData;
}
declare class DateElement extends ContentObject {
    [$content]: string | Date | undefined;
    constructor(attributes: XFAAttrs);
    [$finalize](): void;
    [$toHTML](availableSpace?: AvailableSpace): HTMLResult;
}
declare class DateTime extends ContentObject {
    [$content]: string | Date | undefined;
    constructor(attributes: XFAAttrs);
    [$finalize](): void;
    [$toHTML](availableSpace?: AvailableSpace): HTMLResult;
}
declare class DateTimeEdit extends XFAObject {
    hScrollPolicy: string;
    picker: string;
    border: unknown | undefined;
    comb: unknown;
    extras: unknown;
    margin: undefined;
    constructor(attributes: XFAAttrs);
    [$toHTML](availableSpace?: AvailableSpace): HTMLResult;
}
declare class Decimal extends ContentObject {
    [$content]: string | number | undefined;
    fracDigits: number;
    leadDigits: number;
    constructor(attributes: XFAAttrs);
    [$finalize](): void;
    [$toHTML](availableSpace?: AvailableSpace): HTMLResult;
}
declare class DefaultUi extends XFAObject {
    extras: unknown;
    constructor(attributes: XFAAttrs);
}
declare class Desc extends XFAObject {
    boolean: XFAObjectArray;
    date: XFAObjectArray;
    dateTime: XFAObjectArray;
    decimal: XFAObjectArray;
    exData: XFAObjectArray;
    float: XFAObjectArray;
    image: XFAObjectArray;
    integer: XFAObjectArray;
    text: XFAObjectArray;
    time: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
declare class DigestMethod extends OptionObject {
    constructor(attributes: XFAAttrs);
}
declare class DigestMethods extends XFAObject {
    type: string;
    digestMethod: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
export declare class Draw extends XFAObject {
    anchorType: string;
    colSpan: number;
    hAlign: string;
    locale: string;
    maxH: number;
    maxW: number;
    minH: number;
    minW: number;
    presence: string;
    relevant: {
        excluded: boolean;
        viewname: string;
    }[];
    rotate: number;
    x: number;
    y: number;
    assist: Assist | undefined;
    border: Border | undefined;
    caption: unknown;
    desc: unknown;
    extras: unknown;
    font?: Font;
    keep: unknown;
    margin: Margin | undefined;
    para: Para | undefined;
    traversal: undefined;
    ui: unknown;
    value?: Value;
    setProperty: XFAObjectArray;
    constructor(attributes: XFAAttrs);
    [$setValue](value: XFAValue): void;
    [$toHTML](availableSpace: AvailableSpace): HTMLResult;
}
export declare class Edge extends XFAObject {
    cap: string;
    presence: string;
    stroke: string;
    thickness: number;
    color?: Color;
    extras: unknown;
    constructor(attributes: XFAAttrs);
    [$toStyle](): XFAStyleData;
}
declare class Encoding extends OptionObject {
    constructor(attributes: XFAAttrs);
}
declare class Encodings extends XFAObject {
    type: string;
    encoding: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
declare class Encrypt extends XFAObject {
    certificate: unknown;
    constructor(attributes: XFAAttrs);
}
declare class EncryptData extends XFAObject {
    operation: string;
    target: string;
    filter: unknown;
    manifest: unknown;
    constructor(attributes: XFAAttrs);
}
declare class Encryption extends XFAObject {
    type: string;
    certificate: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
declare class EncryptionMethod extends OptionObject {
    constructor(attributes: XFAAttrs);
}
declare class EncryptionMethods extends XFAObject {
    type: string;
    encryptionMethod: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
declare class Event extends XFAObject {
    activity: string;
    listen: string;
    ref: string;
    extras: unknown;
    encryptData: unknown;
    execute: unknown;
    script: Script | undefined;
    signData: unknown;
    submit: unknown;
    constructor(attributes: XFAAttrs);
}
declare class ExData extends ContentObject {
    [$content]: XhtmlObject | string;
    contentType: string;
    href: string;
    maxLength: number;
    rid: string;
    transferEncoding: string;
    constructor(attributes: XFAAttrs);
    [$isCDATAXml](): boolean;
    [$onChild](child: XFAObject): boolean;
    [$toHTML](availableSpace?: AvailableSpace): HTMLResult;
}
declare class ExObject extends XFAObject {
    archive: string;
    classId: string;
    codeBase: string;
    codeType: string;
    extras: unknown;
    boolean: XFAObjectArray;
    date: XFAObjectArray;
    dateTime: XFAObjectArray;
    decimal: XFAObjectArray;
    exData: XFAObjectArray;
    exObject: XFAObjectArray;
    float: XFAObjectArray;
    image: XFAObjectArray;
    integer: XFAObjectArray;
    text: XFAObjectArray;
    time: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
export declare class ExclGroup extends XFAObject {
    access: string;
    accessKey: string;
    anchorType: string;
    colSpan: number;
    h: number | "";
    hAlign: string;
    layout: string;
    maxH: number;
    maxW: number;
    minH: number;
    minW: number;
    presence: string;
    relevant: {
        excluded: boolean;
        viewname: string;
    }[];
    w: number | "";
    x: number;
    y: number;
    assist: Assist | undefined;
    bind?: Bind;
    border: Border | undefined;
    calculate: unknown;
    caption: unknown;
    desc: unknown;
    extras: unknown;
    margin: Margin | undefined;
    para: unknown | undefined;
    traversal: undefined;
    validate: unknown;
    connect: XFAObjectArray;
    event: XFAObjectArray;
    field: XFAObjectArray;
    setProperty: XFAObjectArray;
    [$extra]: XFAExtra;
    [$data]?: XFAObject;
    occur: Occur | undefined;
    constructor(attributes: XFAAttrs);
    [$isBindable](): boolean;
    [$hasSettableValue](): boolean;
    [$setValue](value: XFAValue): void;
    [$isThereMoreWidth](): boolean;
    [$isSplittable](): boolean;
    [$flushHTML](): XFAHTMLObj | undefined;
    [$addHTML](html: XFAElData, bbox: rect_t): void;
    [$getAvailableSpace](): AvailableSpace;
    [$toHTML](availableSpace: AvailableSpace): HTMLResult;
}
declare class Execute extends XFAObject {
    connection: string;
    executeType: string;
    runAt: string;
    constructor(attributes: XFAAttrs);
}
declare class Extras extends XFAObject {
    boolean: XFAObjectArray;
    date: XFAObjectArray;
    dateTime: XFAObjectArray;
    decimal: XFAObjectArray;
    exData: XFAObjectArray;
    extras: XFAObjectArray;
    float: XFAObjectArray;
    image: XFAObjectArray;
    integer: XFAObjectArray;
    text: XFAObjectArray;
    time: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
export declare class Field extends XFAObject {
    access: string;
    accessKey: string;
    anchorType: string;
    colSpan: number;
    hAlign: string;
    locale: string;
    maxH: number;
    maxW: number;
    minH: number;
    minW: number;
    presence: string;
    relevant: {
        excluded: boolean;
        viewname: string;
    }[];
    rotate: number;
    x: number;
    y: number;
    assist: Assist | undefined;
    bind?: Bind;
    border: Border | undefined;
    calculate: unknown;
    caption?: Caption;
    desc: unknown;
    extras: unknown;
    font?: Font;
    format: unknown;
    items: XFAObjectArray;
    keep: unknown;
    margin: Margin | undefined;
    para: Para | undefined;
    traversal: Traversal | undefined;
    ui?: Ui;
    validate?: Validate;
    value?: Value;
    bindItems: XFAObjectArray;
    connect: XFAObjectArray;
    event: XFAObjectArray;
    setProperty: XFAObjectArray;
    [$data]?: XFAObject;
    occur?: Occur;
    constructor(attributes: XFAAttrs);
    [$isBindable](): boolean;
    [$setValue](value: XFAValue): void;
    [$toHTML](availableSpace: AvailableSpace): HTMLResult;
}
declare class Fill extends XFAObject {
    presence: string;
    color?: Color;
    extras: unknown;
    linear: unknown;
    pattern: unknown;
    radial: unknown;
    solid: unknown;
    stipple: unknown;
    constructor(attributes: XFAAttrs);
    [$toStyle](): any;
}
declare class Filter extends XFAObject {
    addRevocationInfo: string;
    version: number;
    appearanceFilter: unknown;
    certificates: unknown;
    digestMethods: unknown;
    encodings: unknown;
    encryptionMethods: unknown;
    handler: unknown;
    lockDocument: unknown;
    mdp: unknown;
    reasons: unknown;
    timeStamp: unknown;
    constructor(attributes: XFAAttrs);
}
declare class Float extends ContentObject {
    [$content]: string | number | undefined;
    constructor(attributes: XFAAttrs);
    [$finalize](): void;
    [$toHTML](availableSpace?: AvailableSpace): HTMLResult;
}
export declare class Font extends XFAObject implements XFAFontBase {
    baselineShift: number;
    fontHorizontalScale: number;
    fontVerticalScale: number;
    kerningMode: string;
    letterSpacing: number;
    lineThrough: number;
    lineThroughPeriod: string;
    overline: number;
    overlinePeriod: string;
    posture: string;
    size: number;
    typeface: string;
    underline: number;
    underlinePeriod: string;
    weight: string;
    extras: unknown;
    fill: unknown;
    constructor(attributes: XFAAttrs);
    [$clean](builder: Builder): void;
    [$toStyle](): XFAStyleData;
}
declare class Format extends XFAObject {
    extras: unknown;
    picture: unknown;
    constructor(attributes: XFAAttrs);
}
declare class Handler extends StringObject {
    type: string;
    constructor(attributes: XFAAttrs);
}
declare class Hyphenation extends XFAObject {
    excludeAllCaps: number;
    excludeInitialCap: number;
    hyphenate: number;
    pushCharacterCount: number;
    remainCharacterCount: number;
    wordCharacterCount: number;
    constructor(attributes: XFAAttrs);
}
declare class Image extends StringObject {
    [$content]: string;
    aspect: string;
    contentType: string;
    href: string;
    transferEncoding: string;
    constructor(attributes: XFAAttrs);
    [$toHTML](availableSpace?: AvailableSpace): HTMLResult;
}
declare class ImageEdit extends XFAObject {
    data: string;
    border: unknown | undefined;
    extras: unknown;
    margin: undefined;
    constructor(attributes: XFAAttrs);
    [$toHTML](availableSpace?: AvailableSpace): HTMLResult;
}
declare class Integer extends ContentObject {
    [$content]: string | number | undefined;
    constructor(attributes: XFAAttrs);
    [$finalize](): void;
    [$toHTML](availableSpace?: AvailableSpace): HTMLResult;
}
declare class Issuers extends XFAObject {
    type: string;
    certificate: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
export declare class Items extends XFAObject {
    presence: string;
    ref: string;
    save: number;
    boolean: XFAObjectArray;
    date: XFAObjectArray;
    dateTime: XFAObjectArray;
    decimal: XFAObjectArray;
    exData: XFAObjectArray;
    float: XFAObjectArray;
    image: XFAObjectArray;
    integer: XFAObjectArray;
    text: XFAObjectArray;
    time: XFAObjectArray;
    constructor(attributes: XFAAttrs);
    [$toHTML](availableSpace?: AvailableSpace): HTMLResult;
}
declare class Keep extends XFAObject {
    intact: string;
    next: string;
    previous: string;
    extras: unknown;
    constructor(attributes: XFAAttrs);
}
declare class KeyUsage extends XFAObject {
    crlSign: string;
    dataEncipherment: string;
    decipherOnly: string;
    digitalSignature: string;
    encipherOnly: string;
    keyAgreement: string;
    keyCertSign: string;
    keyEncipherment: string;
    nonRepudiation: string;
    type: string;
    constructor(attributes: XFAAttrs);
}
declare class Line extends XFAObject {
    hand: string;
    slope: string;
    edge?: Edge;
    constructor(attributes: XFAAttrs);
    [$toHTML](availableSpace?: AvailableSpace): HTMLResult;
}
declare class Linear extends XFAObject {
    type: string;
    color?: Color;
    extras: unknown;
    constructor(attributes: XFAAttrs);
    [$toStyle](startColor?: Color): string;
}
declare class LockDocument extends ContentObject {
    [$content]: string;
    type: string;
    constructor(attributes: XFAAttrs);
    [$finalize](): void;
}
declare class Manifest extends XFAObject {
    action: string;
    extras: unknown;
    ref: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
export declare class Margin extends XFAObject {
    bottomInset: number;
    leftInset: number;
    rightInset: number;
    topInset: number;
    extras: unknown;
    constructor(attributes: XFAAttrs);
    [$toStyle](): {
        margin: string;
    };
}
declare class Mdp extends XFAObject {
    permissions: number;
    signatureType: string;
    constructor(attributes: XFAAttrs);
}
declare class Medium extends XFAObject {
    imagingBBox: import("./utils.js").XFABBox;
    long: number;
    orientation: string;
    short: number;
    stock: string;
    trayIn: string;
    trayOut: string;
    constructor(attributes: XFAAttrs);
}
declare class Message extends XFAObject {
    text: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
declare class NumericEdit extends XFAObject {
    hScrollPolicy: string;
    border: unknown | undefined;
    comb: unknown;
    extras: unknown;
    margin: undefined;
    constructor(attributes: XFAAttrs);
    [$toHTML](availableSpace?: AvailableSpace): HTMLResult;
}
declare class Occur extends XFAObject {
    initial: string | number;
    max: string | number;
    min: string | number;
    extras: unknown;
    constructor(attributes: XFAAttrs);
    [$clean](): void;
}
declare class Oid extends StringObject {
    constructor(attributes: XFAAttrs);
}
declare class Oids extends XFAObject {
    type: string;
    oid: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
export interface OverflowExtra {
    target: XFAObject | undefined;
    leader: XFAObject | undefined;
    trailer: XFAObject | undefined;
    addLeader: boolean;
    addTrailer: boolean;
}
export declare class Overflow extends XFAObject {
    leader: string;
    target: string;
    trailer: string;
    [$extra]: OverflowExtra | undefined;
    constructor(attributes: XFAAttrs);
    [$getExtra](): OverflowExtra;
}
export declare class PageArea extends XFAObject {
    blankOrNotBlank: string;
    initialNumber: number;
    numbered: number;
    oddOrEven: string;
    pagePosition: string;
    relevant: {
        excluded: boolean;
        viewname: string;
    }[];
    desc: unknown;
    extras: unknown;
    medium?: Medium;
    occur?: Occur;
    area: XFAObjectArray;
    contentArea: XFAObjectArray;
    draw: XFAObjectArray;
    exclGroup: XFAObjectArray;
    field: XFAObjectArray;
    subform: XFAObjectArray;
    [$extra]: XFAExtra | undefined;
    constructor(attributes: XFAAttrs);
    [$isUsable](): boolean;
    [$cleanPage](): void;
    [$getNextPage](): PageArea;
    [$getAvailableSpace](): AvailableSpace;
    [$toHTML](availableSpace?: AvailableSpace): HTMLResult;
}
declare class PageSet extends XFAObject {
    duplexImposition: string;
    relation: string;
    relevant: {
        excluded: boolean;
        viewname: string;
    }[];
    extras: unknown;
    occur?: Occur;
    pageArea: XFAObjectArray;
    pageSet: XFAObjectArray;
    [$extra]: XFAExtra | undefined;
    constructor(attributes: XFAAttrs);
    [$cleanPage](): void;
    [$isUsable](): boolean;
    [$getNextPage](): PageArea;
}
export declare class Para extends XFAObject {
    lineHeight: number | "";
    marginLeft: number | "";
    marginRight: number | "";
    orphans: number;
    preserve: string;
    radixOffset: number | "";
    spaceAbove: number | "";
    spaceBelow: number | "";
    tabDefault: string | number | undefined;
    tabStops: (string | number)[];
    textIndent: number | "";
    hAlign: string;
    vAlign: string;
    widows: number;
    hyphenation: unknown;
    hyphenatation?: XFAObject;
    constructor(attributes: XFAAttrs);
    [$toStyle](): XFAStyleData;
}
declare class PasswordEdit extends XFAObject {
    hScrollPolicy: string;
    passwordChar: string;
    border: unknown | undefined;
    extras: unknown;
    margin: undefined;
    constructor(attributes: XFAAttrs);
}
declare class Pattern extends XFAObject {
    type: string;
    color?: Color;
    extras: unknown;
    constructor(attributes: XFAAttrs);
    [$toStyle](startColor?: Color): string;
}
declare class Picture extends StringObject {
    constructor(attributes: XFAAttrs);
}
declare class Proto extends XFAObject {
    appearanceFilter: XFAObjectArray;
    arc: XFAObjectArray;
    area: XFAObjectArray;
    assist: XFAObjectArray;
    barcode: XFAObjectArray;
    bindItems: XFAObjectArray;
    bookend: XFAObjectArray;
    boolean: XFAObjectArray;
    border: XFAObjectArray;
    break: XFAObjectArray;
    breakAfter: XFAObjectArray;
    breakBefore: XFAObjectArray;
    button: XFAObjectArray;
    calculate: XFAObjectArray;
    caption: XFAObjectArray;
    certificate: XFAObjectArray;
    certificates: XFAObjectArray;
    checkButton: XFAObjectArray;
    choiceList: XFAObjectArray;
    color: XFAObjectArray;
    comb: XFAObjectArray;
    connect: XFAObjectArray;
    contentArea: XFAObjectArray;
    corner: XFAObjectArray;
    date: XFAObjectArray;
    dateTime: XFAObjectArray;
    dateTimeEdit: XFAObjectArray;
    decimal: XFAObjectArray;
    defaultUi: XFAObjectArray;
    desc: XFAObjectArray;
    digestMethod: XFAObjectArray;
    digestMethods: XFAObjectArray;
    draw: XFAObjectArray;
    edge: XFAObjectArray;
    encoding: XFAObjectArray;
    encodings: XFAObjectArray;
    encrypt: XFAObjectArray;
    encryptData: XFAObjectArray;
    encryption: XFAObjectArray;
    encryptionMethod: XFAObjectArray;
    encryptionMethods: XFAObjectArray;
    event: XFAObjectArray;
    exData: XFAObjectArray;
    exObject: XFAObjectArray;
    exclGroup: XFAObjectArray;
    execute: XFAObjectArray;
    extras: XFAObjectArray;
    field: XFAObjectArray;
    fill: XFAObjectArray;
    filter: XFAObjectArray;
    float: XFAObjectArray;
    font: XFAObjectArray;
    format: XFAObjectArray;
    handler: XFAObjectArray;
    hyphenation: XFAObjectArray;
    image: XFAObjectArray;
    imageEdit: XFAObjectArray;
    integer: XFAObjectArray;
    issuers: XFAObjectArray;
    items: XFAObjectArray;
    keep: XFAObjectArray;
    keyUsage: XFAObjectArray;
    line: XFAObjectArray;
    linear: XFAObjectArray;
    lockDocument: XFAObjectArray;
    manifest: XFAObjectArray;
    margin: XFAObjectArray;
    mdp: XFAObjectArray;
    medium: XFAObjectArray;
    message: XFAObjectArray;
    numericEdit: XFAObjectArray;
    occur: XFAObjectArray;
    oid: XFAObjectArray;
    oids: XFAObjectArray;
    overflow: XFAObjectArray;
    pageArea: XFAObjectArray;
    pageSet: XFAObjectArray;
    para: XFAObjectArray;
    passwordEdit: XFAObjectArray;
    pattern: XFAObjectArray;
    picture: XFAObjectArray;
    radial: XFAObjectArray;
    reason: XFAObjectArray;
    reasons: XFAObjectArray;
    rectangle: XFAObjectArray;
    ref: XFAObjectArray;
    script: XFAObjectArray;
    setProperty: XFAObjectArray;
    signData: XFAObjectArray;
    signature: XFAObjectArray;
    signing: XFAObjectArray;
    solid: XFAObjectArray;
    speak: XFAObjectArray;
    stipple: XFAObjectArray;
    subform: XFAObjectArray;
    subformSet: XFAObjectArray;
    subjectDN: XFAObjectArray;
    subjectDNs: XFAObjectArray;
    submit: XFAObjectArray;
    text: XFAObjectArray;
    textEdit: XFAObjectArray;
    time: XFAObjectArray;
    timeStamp: XFAObjectArray;
    toolTip: XFAObjectArray;
    traversal: XFAObjectArray;
    traverse: XFAObjectArray;
    ui: XFAObjectArray;
    validate: XFAObjectArray;
    value: XFAObjectArray;
    variables: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
declare class Radial extends XFAObject {
    type: string;
    color?: Color;
    extras: unknown;
    constructor(attributes: XFAAttrs);
    [$toStyle](startColor?: Color): string;
}
declare class Reason extends StringObject {
    constructor(attributes: XFAAttrs);
}
declare class Reasons extends XFAObject {
    type: string;
    reason: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
declare class Rectangle extends XFAObject {
    hand: string;
    corner: XFAObjectArray;
    edge: XFAObjectArray;
    fill?: Fill;
    constructor(attributes: XFAAttrs);
    [$toHTML](availableSpace?: AvailableSpace): HTMLResult;
}
declare class RefElement extends StringObject {
    constructor(attributes: XFAAttrs);
}
declare class Script extends StringObject {
    binding: string;
    contentType: string;
    runAt: string;
    constructor(attributes: XFAAttrs);
}
export declare class SetProperty extends XFAObject {
    connection: string;
    ref: string;
    target: string;
    constructor(attributes: XFAAttrs);
}
declare class SignData extends XFAObject {
    operation: string;
    ref: string;
    target: string;
    filter: unknown;
    manifest: unknown;
    constructor(attributes: XFAAttrs);
}
declare class Signature extends XFAObject {
    type: string;
    border: unknown | undefined;
    extras: unknown;
    filter: unknown;
    manifest: unknown;
    margin: undefined;
    constructor(attributes: XFAAttrs);
}
declare class Signing extends XFAObject {
    type: string;
    certificate: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
declare class Solid extends XFAObject {
    extras: unknown;
    constructor(attributes: XFAAttrs);
    [$toStyle](startColor?: Color): string | undefined;
}
declare class Speak extends StringObject {
    disable: number;
    priority: string;
    rid: string;
    constructor(attributes: XFAAttrs);
}
declare class Stipple extends XFAObject {
    rate: number;
    color: unknown;
    extras: unknown;
    value?: XFAColor;
    constructor(attributes: XFAAttrs);
    [$toStyle](bgColor: Color): string;
}
export declare class Subform extends XFAObject {
    access: string;
    allowMacro: number;
    anchorType: string;
    colSpan: number;
    columnWidths: number[];
    h: number | "";
    hAlign: string;
    layout: string;
    locale: string;
    maxH: number;
    maxW: number;
    mergeMode: string;
    minH: number;
    minW: number;
    presence: string;
    relevant: {
        excluded: boolean;
        viewname: string;
    }[];
    restoreState: string;
    scope: string;
    w: number | "";
    x: number;
    y: number;
    assist: Assist | undefined;
    bind?: Bind;
    bookend: unknown;
    border: Border | undefined;
    break?: Break | undefined;
    calculate: unknown;
    desc: unknown;
    extras: unknown;
    keep?: Keep;
    margin: Margin | undefined;
    occur?: Occur;
    overflow?: Overflow;
    pageSet?: PageSet;
    para: unknown | undefined;
    traversal: unknown | undefined;
    validate: unknown;
    variables: unknown;
    area: XFAObjectArray;
    breakAfter: XFAObjectArray;
    breakBefore: XFAObjectArray;
    connect: XFAObjectArray;
    draw: XFAObjectArray;
    event: XFAObjectArray;
    exObject: XFAObjectArray;
    exclGroup: XFAObjectArray;
    field: XFAObjectArray;
    proto: XFAObjectArray;
    setProperty: XFAObjectArray;
    subform: XFAObjectArray;
    subformSet: XFAObjectArray;
    [$data]?: XmlObject;
    [$extra]: XFAExtra;
    constructor(attributes: XFAAttrs);
    [$getSubformParent](): Subform;
    [$isBindable](): boolean;
    [$isThereMoreWidth](): boolean;
    [$getContainedChildren](): Generator<XFAObject, void, unknown>;
    [$flushHTML](): XFAHTMLObj | undefined;
    [$addHTML](html: XFAElData, bbox: rect_t): void;
    [$getAvailableSpace](): AvailableSpace;
    [$isSplittable](): boolean;
    [$toHTML](availableSpace?: AvailableSpace): HTMLResult;
}
declare class SubformSet extends XFAObject {
    relation: string;
    relevant: {
        excluded: boolean;
        viewname: string;
    }[];
    bookend: unknown;
    break?: Break;
    desc: unknown;
    extras: unknown;
    occur: unknown;
    overflow: unknown;
    breakAfter: XFAObjectArray;
    breakBefore: XFAObjectArray;
    subform: XFAObjectArray;
    subformSet: XFAObjectArray;
    constructor(attributes: XFAAttrs);
    [$getContainedChildren](): Generator<XFAObject, void, unknown>;
    [$getSubformParent](): Subform;
    [$isBindable](): boolean;
}
declare class SubjectDN extends ContentObject {
    [$content]: string | Map<string, string>;
    delimiter: string;
    constructor(attributes: XFAAttrs);
    [$finalize](): void;
}
declare class SubjectDNs extends XFAObject {
    type: string;
    subjectDN: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
declare class Submit extends XFAObject {
    embedPDF: number;
    format: string;
    target: string;
    textEncoding: string;
    xdpContent: string;
    encrypt: unknown;
    encryptData: XFAObjectArray;
    signData: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
/** @final */
export declare class Template extends XFAObject {
    baseProfile: string;
    extras: unknown;
    subform: XFAObjectArray;
    [$extra]: XFAExtra;
    [$ids]?: XFAIds;
    leader?: string;
    occur?: Occur;
    trailer?: string;
    targetType?: string;
    constructor(attributes: XFAAttrs);
    [$finalize](): void;
    [$isSplittable](): boolean;
    [$searchNode](expr: string, container?: XFAObject): XFAObject[] | undefined;
    /**
     * This function is a generator because the conversion into
     * pages is done asynchronously and we want to save the state
     * of the function where we were in the previous iteration.
     */
    [$toPages](): Generator<undefined, HTMLResult | {
        name: string;
        children: XFAElData[];
    }, unknown>;
}
export declare class Text extends ContentObject implements XFAValue {
    [$content]: string | XFAObject;
    maxChars: number;
    rid: string;
    constructor(attributes: XFAAttrs);
    [$acceptWhitespace](): boolean;
    [$onChild](child: XFAObject): boolean;
    [$onText](str: string): void;
    [$finalize](): void;
    [$getExtra](): string | undefined;
    [$toHTML](availableSpace?: AvailableSpace): string | HTMLResult | undefined;
}
declare class TextEdit extends XFAObject {
    allowRichText: number;
    hScrollPolicy: string;
    multiLine: string | number;
    vScrollPolicy: string;
    border: unknown | undefined;
    comb: unknown;
    extras: unknown;
    margin: undefined;
    constructor(attributes: XFAAttrs);
    [$toHTML](availableSpace?: AvailableSpace): HTMLResult;
}
declare class Time extends StringObject {
    [$content]: string | Date | undefined;
    constructor(attributes: XFAAttrs);
    [$finalize](): void;
    [$toHTML](availableSpace?: AvailableSpace): HTMLResult;
}
declare class TimeStamp extends XFAObject {
    server: string;
    type: string;
    constructor(attributes: XFAAttrs);
}
declare class ToolTip extends StringObject {
    [$content]: string;
    rid: string;
    constructor(attributes: XFAAttrs);
}
declare class Traversal extends XFAObject {
    extras: unknown;
    traverse: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
declare class Traverse extends XFAObject {
    operation: string;
    ref: string;
    extras: unknown;
    script: unknown;
    constructor(attributes: XFAAttrs);
    [$isTransparent](): boolean;
}
declare class Ui extends XFAObject {
    extras: unknown;
    picture: unknown;
    barcode: unknown;
    button?: Button;
    checkButton?: CheckButton;
    choiceList?: ChoiceList;
    dateTimeEdit: unknown;
    defaultUi: unknown;
    imageEdit: unknown;
    numericEdit: unknown;
    passwordEdit: unknown;
    signature: unknown;
    textEdit?: TextEdit;
    constructor(attributes: XFAAttrs);
    [$getExtra](): XFAObject | undefined;
    [$toHTML](availableSpace?: AvailableSpace): string | HTMLResult | undefined;
}
declare class Validate extends XFAObject {
    formatTest: string;
    nullTest: string;
    scriptTest: string;
    extras: unknown;
    message: unknown;
    picture: unknown;
    script: unknown;
    constructor(attributes: XFAAttrs);
}
export declare class Value extends XFAObject {
    override: number;
    relevant: {
        excluded: boolean;
        viewname: string;
    }[];
    arc: unknown;
    boolean: unknown;
    date: unknown;
    dateTime: unknown;
    decimal: unknown;
    exData?: ExData;
    float: unknown;
    image?: Image;
    integer: unknown;
    line: unknown;
    rectangle: unknown;
    text?: Text;
    time: unknown;
    constructor(attributes: XFAAttrs);
    [$setValue](value: XFAValue): void;
    [$text](): string | undefined;
    [$toHTML](availableSpace?: AvailableSpace): string | HTMLResult | undefined;
}
declare class Variables extends XFAObject {
    boolean: XFAObjectArray;
    date: XFAObjectArray;
    dateTime: XFAObjectArray;
    decimal: XFAObjectArray;
    exData: XFAObjectArray;
    float: XFAObjectArray;
    image: XFAObjectArray;
    integer: XFAObjectArray;
    manifest: XFAObjectArray;
    script: XFAObjectArray;
    text: XFAObjectArray;
    time: XFAObjectArray;
    constructor(attributes: XFAAttrs);
    [$isTransparent](): boolean;
}
export type XFANsTemplate = typeof TemplateNamespace;
export declare const TemplateNamespace: {
    [$buildXFAObject](name: string, attributes: XFAAttrs): Template | BreakAfter | BreakBefore | Para | Draw | Field | Caption | Value | Margin | Font | Occur | ExData | ExclGroup | Subform | Assist | Border | Area | ContentArea | AppearanceFilter | Arc | Barcode | Bind | BindItems | Bookend | BooleanElement | Break | Button | Calculate | Certificate | Certificates | CheckButton | ChoiceList | Color | Comb | Connect | Corner | DateElement | DateTime | DateTimeEdit | Decimal | DefaultUi | Desc | DigestMethod | DigestMethods | Edge | Encoding | Encodings | Encrypt | EncryptData | Encryption | EncryptionMethod | EncryptionMethods | Event | ExObject | Execute | Extras | Fill | Filter | Float | Format | Handler | Hyphenation | Image | ImageEdit | Integer | Issuers | Items | Keep | KeyUsage | Line | Linear | LockDocument | Manifest | Mdp | Medium | Message | NumericEdit | Oid | Oids | Overflow | PageArea | PageSet | PasswordEdit | Pattern | Picture | Proto | Radial | Reason | Reasons | Rectangle | RefElement | Script | SetProperty | SignData | Signature | Signing | Solid | Speak | Stipple | SubformSet | SubjectDN | SubjectDNs | Submit | Text | TextEdit | Time | TimeStamp | ToolTip | Traversal | Traverse | Ui | Validate | Variables | undefined;
    appearanceFilter(attrs: XFAAttrs): AppearanceFilter;
    arc(attrs: XFAAttrs): Arc;
    area(attrs: XFAAttrs): Area;
    assist(attrs: XFAAttrs): Assist;
    barcode(attrs: XFAAttrs): Barcode;
    bind(attrs: XFAAttrs): Bind;
    bindItems(attrs: XFAAttrs): BindItems;
    bookend(attrs: XFAAttrs): Bookend;
    boolean(attrs: XFAAttrs): BooleanElement;
    border(attrs: XFAAttrs): Border;
    break(attrs: XFAAttrs): Break;
    breakAfter(attrs: XFAAttrs): BreakAfter;
    breakBefore(attrs: XFAAttrs): BreakBefore;
    button(attrs: XFAAttrs): Button;
    calculate(attrs: XFAAttrs): Calculate;
    caption(attrs: XFAAttrs): Caption;
    certificate(attrs: XFAAttrs): Certificate;
    certificates(attrs: XFAAttrs): Certificates;
    checkButton(attrs: XFAAttrs): CheckButton;
    choiceList(attrs: XFAAttrs): ChoiceList;
    color(attrs: XFAAttrs): Color;
    comb(attrs: XFAAttrs): Comb;
    connect(attrs: XFAAttrs): Connect;
    contentArea(attrs: XFAAttrs): ContentArea;
    corner(attrs: XFAAttrs): Corner;
    date(attrs: XFAAttrs): DateElement;
    dateTime(attrs: XFAAttrs): DateTime;
    dateTimeEdit(attrs: XFAAttrs): DateTimeEdit;
    decimal(attrs: XFAAttrs): Decimal;
    defaultUi(attrs: XFAAttrs): DefaultUi;
    desc(attrs: XFAAttrs): Desc;
    digestMethod(attrs: XFAAttrs): DigestMethod;
    digestMethods(attrs: XFAAttrs): DigestMethods;
    draw(attrs: XFAAttrs): Draw;
    edge(attrs: XFAAttrs): Edge;
    encoding(attrs: XFAAttrs): Encoding;
    encodings(attrs: XFAAttrs): Encodings;
    encrypt(attrs: XFAAttrs): Encrypt;
    encryptData(attrs: XFAAttrs): EncryptData;
    encryption(attrs: XFAAttrs): Encryption;
    encryptionMethod(attrs: XFAAttrs): EncryptionMethod;
    encryptionMethods(attrs: XFAAttrs): EncryptionMethods;
    event(attrs: XFAAttrs): Event;
    exData(attrs: XFAAttrs): ExData;
    exObject(attrs: XFAAttrs): ExObject;
    exclGroup(attrs: XFAAttrs): ExclGroup;
    execute(attrs: XFAAttrs): Execute;
    extras(attrs: XFAAttrs): Extras;
    field(attrs: XFAAttrs): Field;
    fill(attrs: XFAAttrs): Fill;
    filter(attrs: XFAAttrs): Filter;
    float(attrs: XFAAttrs): Float;
    font(attrs: XFAAttrs): Font;
    format(attrs: XFAAttrs): Format;
    handler(attrs: XFAAttrs): Handler;
    hyphenation(attrs: XFAAttrs): Hyphenation;
    image(attrs: XFAAttrs): Image;
    imageEdit(attrs: XFAAttrs): ImageEdit;
    integer(attrs: XFAAttrs): Integer;
    issuers(attrs: XFAAttrs): Issuers;
    items(attrs: XFAAttrs): Items;
    keep(attrs: XFAAttrs): Keep;
    keyUsage(attrs: XFAAttrs): KeyUsage;
    line(attrs: XFAAttrs): Line;
    linear(attrs: XFAAttrs): Linear;
    lockDocument(attrs: XFAAttrs): LockDocument;
    manifest(attrs: XFAAttrs): Manifest;
    margin(attrs: XFAAttrs): Margin;
    mdp(attrs: XFAAttrs): Mdp;
    medium(attrs: XFAAttrs): Medium;
    message(attrs: XFAAttrs): Message;
    numericEdit(attrs: XFAAttrs): NumericEdit;
    occur(attrs: XFAAttrs): Occur;
    oid(attrs: XFAAttrs): Oid;
    oids(attrs: XFAAttrs): Oids;
    overflow(attrs: XFAAttrs): Overflow;
    pageArea(attrs: XFAAttrs): PageArea;
    pageSet(attrs: XFAAttrs): PageSet;
    para(attrs: XFAAttrs): Para;
    passwordEdit(attrs: XFAAttrs): PasswordEdit;
    pattern(attrs: XFAAttrs): Pattern;
    picture(attrs: XFAAttrs): Picture;
    proto(attrs: XFAAttrs): Proto;
    radial(attrs: XFAAttrs): Radial;
    reason(attrs: XFAAttrs): Reason;
    reasons(attrs: XFAAttrs): Reasons;
    rectangle(attrs: XFAAttrs): Rectangle;
    ref(attrs: XFAAttrs): RefElement;
    script(attrs: XFAAttrs): Script;
    setProperty(attrs: XFAAttrs): SetProperty;
    signData(attrs: XFAAttrs): SignData;
    signature(attrs: XFAAttrs): Signature;
    signing(attrs: XFAAttrs): Signing;
    solid(attrs: XFAAttrs): Solid;
    speak(attrs: XFAAttrs): Speak;
    stipple(attrs: XFAAttrs): Stipple;
    subform(attrs: XFAAttrs): Subform;
    subformSet(attrs: XFAAttrs): SubformSet;
    subjectDN(attrs: XFAAttrs): SubjectDN;
    subjectDNs(attrs: XFAAttrs): SubjectDNs;
    submit(attrs: XFAAttrs): Submit;
    template(attrs: XFAAttrs): Template;
    text(attrs: XFAAttrs): Text;
    textEdit(attrs: XFAAttrs): TextEdit;
    time(attrs: XFAAttrs): Time;
    timeStamp(attrs: XFAAttrs): TimeStamp;
    toolTip(attrs: XFAAttrs): ToolTip;
    traversal(attrs: XFAAttrs): Traversal;
    traverse(attrs: XFAAttrs): Traverse;
    ui(attrs: XFAAttrs): Ui;
    validate(attrs: XFAAttrs): Validate;
    value(attrs: XFAAttrs): Value;
    variables(attrs: XFAAttrs): Variables;
};
export {};
//# sourceMappingURL=template.d.ts.map