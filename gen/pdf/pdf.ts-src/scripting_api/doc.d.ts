import { ScriptingDocProperties } from "../../pdf.ts-web/app.js";
import { AnnotActions } from "../core/core_utils.js";
import { Name } from "../core/primitives.js";
import { FieldWrapped } from "./app.js";
import { ScriptingActionName, ScriptingActions } from "./common.js";
import { EventDispatcher } from "./event.js";
import { PDFObject, ScriptingData, SendData } from "./pdf_object.js";
import { PrintParams } from "./print_params.js";
interface _Info {
    title: string;
    author: string;
    authors: string | string[];
    subject: string;
    keywords: string;
    creator: string;
    producer: string;
    creationdate: Date | string | undefined;
    moddate: Date | string | undefined;
    trapped: Name | "Unknown";
}
interface _SendDocData extends SendData {
    command?: string;
    end?: number;
    formattedValue?: undefined;
    selRange?: [number, number];
    siblings?: unknown;
    start?: number;
    value?: string | number;
}
export interface DocInfo extends ScriptingDocProperties {
    actions: AnnotActions;
}
interface _ScriptingDocData extends ScriptingData<_SendDocData>, DocInfo {
    globalEval(code: string): unknown;
    docID?: [string, string];
    layout?: string;
    pageNum?: number;
    zoom?: number;
}
interface _PrintP {
    firstPage: number;
    lastPage: number;
}
interface _UI {
    nStart: number;
    nEnd: number;
    bSilent: boolean;
    bShrinkToFit: boolean;
    bPrintAsImage: boolean;
    bReverse: boolean;
    bAnnotations: boolean;
    printParams: _PrintP;
    bUI: boolean | _UI;
}
export declare class Doc extends PDFObject<_SendDocData> {
    _baseURL: string;
    _calculate: boolean;
    _delay: boolean;
    get delay(): boolean;
    set delay(delay: boolean);
    _dirty: boolean;
    get dirty(): boolean;
    set dirty(dirty: boolean);
    _disclosed: boolean;
    get disclosed(): boolean;
    set disclosed(disclosed: boolean);
    _media: unknown;
    get media(): unknown;
    set media(media: unknown);
    _metadata: string;
    get metadata(): string;
    set metadata(metadata: string);
    _noautocomplete: unknown;
    get noautocomplete(): unknown;
    set noautocomplete(noautocomplete: unknown);
    _nocache: unknown;
    get nocache(): unknown;
    set nocache(nocache: unknown);
    _spellDictionaryOrder: unknown[];
    get spellDictionaryOrder(): unknown[];
    set spellDictionaryOrder(spellDictionaryOrder: unknown[]);
    _spellLanguageOrder: unknown[];
    get spellLanguageOrder(): unknown[];
    set spellLanguageOrder(spellLanguageOrder: unknown[]);
    _printParams?: PrintParams;
    getPrintParams(): PrintParams;
    _fields: Map<string, FieldWrapped>;
    _fieldNames: string[];
    _event: unknown;
    _author: string;
    _creator: string;
    get creator(): string;
    set creator(_: string);
    _creationDate: string | Date | undefined;
    _docID: [string, string];
    get docID(): [string, string];
    set docID(_: [string, string]);
    _documentFileName: string;
    get documentFileName(): string;
    set documentFileName(_: string);
    _filesize: number;
    get filesize(): number;
    set filesize(_: number);
    _keywords: string;
    _layout: string;
    _modDate: string | Date | undefined;
    get modDate(): string | Date | undefined;
    set modDate(_: string | Date | undefined);
    _numFields: number;
    _numPages: number;
    get pageNum(): number;
    set pageNum(value: number);
    _pageNum: number;
    _producer: string;
    _securityHandler: string | undefined;
    get securityHandler(): string | undefined;
    set securityHandler(_: string | undefined);
    _subject: string;
    get subject(): string;
    set subject(_: string);
    _title: string;
    get title(): string;
    set title(_: string);
    _URL: string;
    get URL(): string;
    set URL(_: string);
    _info: _Info;
    _zoomType: string;
    _zoom: number;
    get zoom(): number;
    set zoom(value: number);
    _actions: ScriptingActions;
    _globalEval: (code: string) => unknown;
    _pageActions: Map<number, ScriptingActions>;
    _userActivation: boolean;
    _disablePrinting: boolean;
    _disableSaving: boolean;
    _xfa: unknown;
    get xfa(): unknown;
    set xfa(_: unknown);
    _eventDispatcher?: EventDispatcher;
    constructor(data: _ScriptingDocData);
    _dispatchDocEvent(name: ScriptingActionName): void;
    _dispatchPageEvent(name: ScriptingActionName, actions: AnnotActions, pageNumber: number): void;
    _runActions(name: ScriptingActionName): void;
    _addField(name: string, field: FieldWrapped): void;
    _getDate(date?: string): string | Date | undefined;
    get author(): string;
    set author(_: string);
    get baseURL(): string;
    set baseURL(baseURL: string);
    get bookmarkRoot(): undefined;
    set bookmarkRoot(_: undefined);
    get calculate(): boolean;
    set calculate(calculate: boolean);
    get dataObjects(): never[];
    set dataObjects(_: never[]);
    get dynamicXFAForm(): boolean;
    set dynamicXFAForm(_: boolean);
    get external(): boolean;
    set external(_: boolean);
    get hidden(): boolean;
    set hidden(_: boolean);
    get hostContainer(): undefined;
    set hostContainer(_: undefined);
    get icons(): undefined;
    set icons(_: undefined);
    get info(): _Info;
    set info(_: _Info);
    get innerAppWindowRect(): number[];
    set innerAppWindowRect(_: number[]);
    get innerDocWindowRect(): number[];
    set innerDocWindowRect(_: number[]);
    get isModal(): boolean;
    set isModal(_: boolean);
    get keywords(): string;
    set keywords(_: string);
    get layout(): string;
    set layout(value: string);
    get mouseX(): number;
    set mouseX(_: number);
    get mouseY(): number;
    set mouseY(_: number);
    get numFields(): number;
    set numFields(_: number);
    get numPages(): number;
    set numPages(_: number);
    get numTemplates(): number;
    set numTemplates(_: number);
    get outerAppWindowRect(): number[];
    set outerAppWindowRect(_: number[]);
    get outerDocWindowRect(): number[];
    set outerDocWindowRect(_: number[]);
    get pageWindowRect(): number[];
    set pageWindowRect(_: number[]);
    get path(): string;
    set path(_: string);
    get permStatusReady(): boolean;
    set permStatusReady(_: boolean);
    get producer(): string;
    set producer(_: string);
    get requiresFullSave(): boolean;
    set requiresFullSave(_: boolean);
    get selectedAnnots(): never[];
    set selectedAnnots(_: never[]);
    get sounds(): never[];
    set sounds(_: never[]);
    get templates(): never[];
    set templates(_: never[]);
    get viewState(): undefined;
    set viewState(_: undefined);
    get XFAForeground(): boolean;
    set XFAForeground(_: boolean);
    get zoomType(): string;
    set zoomType(type: string);
    addAnnot(): void;
    addField(): void;
    addIcon(): void;
    addLink(): void;
    addRecipientListCryptFilter(): void;
    addRequirement(): void;
    addScript(): void;
    addThumbnails(): void;
    addWatermarkFromFile(): void;
    addWatermarkFromText(): void;
    addWeblinks(): void;
    bringToFront(): void;
    calculateNow(): void;
    closeDoc(): void;
    colorConvertPage(): void;
    createDataObject(): void;
    createTemplate(): void;
    deletePages(): void;
    deleteSound(): void;
    embedDocAsDataObject(): void;
    embedOutputIntent(): void;
    encryptForRecipients(): void;
    encryptUsingPolicy(): void;
    exportAsFDF(): void;
    exportAsFDFStr(): void;
    exportAsText(): void;
    exportAsXFDF(): void;
    exportAsXFDFStr(): void;
    exportDataObject(): void;
    exportXFAData(): void;
    extractPages(): void;
    flattenPages(): void;
    getAnnot(): void;
    getAnnots(): void;
    getAnnot3D(): void;
    getAnnots3D(): void;
    getColorConvertAction(): void;
    getDataObject(): void;
    getDataObjectContents(): void;
    _getField(cName: string | {
        cName: string;
    }): FieldWrapped | undefined;
    getField(cName: string): import("./field.js").Field | undefined;
    _getChildren(fieldName: string): FieldWrapped[];
    _getTerminalChildren(fieldName: string): import("./field.js").Field[];
    getIcon(): void;
    getLegalWarnings(): void;
    getLinks(): void;
    getNthFieldName(nIndex: number | {
        nIndex: number;
    }): string | null;
    getNthTemplate(): null;
    getOCGs(): void;
    getOCGOrder(): void;
    getPageBox(): void;
    getPageLabel(): void;
    getPageNthWord(): void;
    getPageNthWordQuads(): void;
    getPageNumWords(): void;
    getPageRotation(): void;
    getPageTransition(): void;
    getSound(): void;
    getTemplate(): void;
    getURL(): void;
    gotoNamedDest(): void;
    importAnFDF(): void;
    importAnXFDF(): void;
    importDataObject(): void;
    importIcon(): void;
    importSound(): void;
    importTextData(): void;
    importXFAData(): void;
    insertPages(): void;
    mailDoc(): void;
    mailForm(): void;
    movePage(): void;
    newPage(): void;
    openDataObject(): void;
    print(bUI?: boolean | _UI, nStart?: number, nEnd?: number, bSilent?: boolean, bShrinkToFit?: boolean, bPrintAsImage?: boolean, bReverse?: boolean, bAnnotations?: boolean, printParams?: _PrintP): void;
    removeDataObject(): void;
    removeField(): void;
    removeIcon(): void;
    removeLinks(): void;
    removeRequirement(): void;
    removeScript(): void;
    removeTemplate(): void;
    removeThumbnails(): void;
    removeWeblinks(): void;
    replacePages(): void;
    resetForm(aFields?: string | string[] | {
        aFields?: string | string[];
    }): void;
    saveAs(): void;
    scroll(): void;
    selectPageNthWord(): void;
    setAction(): void;
    setDataObjectContents(): void;
    setOCGOrder(): void;
    setPageAction(): void;
    setPageBoxes(): void;
    setPageLabels(): void;
    setPageRotations(): void;
    setPageTabOrder(): void;
    setPageTransitions(): void;
    spawnPageFromTemplate(): void;
    submitForm(): void;
    syncAnnotScan(): void;
}
export {};
//# sourceMappingURL=doc.d.ts.map