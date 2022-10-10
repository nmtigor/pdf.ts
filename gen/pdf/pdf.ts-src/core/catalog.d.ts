import { PageLayout, PageMode } from "../../../pdf/pdf.ts-web/ui_utils.js";
import { type ResetForm } from "../display/annotation_layer.js";
import { type OutlineNode } from "../display/api.js";
import { type CMapData } from "../display/base_factory.js";
import { MessageHandler, Thread } from "../shared/message_handler.js";
import { PermissionFlag, type rect_t } from "../shared/util.js";
import { TranslatedFont } from "./evaluator.js";
import { Attachment } from "./file_spec.js";
import { GlobalImageCache } from "./image_utils.js";
import { BasePdfManager } from "./pdf_manager.js";
import { Dict, Name, type Obj, Ref, RefSet, RefSetCache } from "./primitives.js";
import { StructTreeRoot } from "./struct_tree.js";
import { XRef } from "./xref.js";
declare type DestPage = Ref | number | null;
export declare type ExplicitDest = [
    DestPage,
    {
        name: "XYZ";
    },
    number | null,
    number | null,
    number | string | null
] | [DestPage, {
    name: "Fit" | "FitB";
}] | [DestPage, {
    name: "FitH" | "FitBH" | "FitV" | "FitBV";
}, number | null] | [DestPage, {
    name: "FitR";
}, ...rect_t];
export declare type Destination = ExplicitDest | Name | string;
export interface SetOCGState {
    state: string[];
    preserveRB: boolean;
}
export interface CatParseDestDictRes {
    action?: string;
    attachment?: Attachment;
    dest?: ExplicitDest | string;
    newWindow?: boolean;
    resetForm?: ResetForm;
    setOCGState?: SetOCGState;
    unsafeUrl?: string;
    url?: string;
}
interface _ParseDestDictionaryP {
    /**
     * The dictionary containing the destination.
     */
    destDict: Dict;
    /**
     * The object where the parsed destination properties will be placed.
     */
    resultObj: CatParseDestDictRes;
    /**
     * The document base URL that is used when
     * attempting to recover valid absolute URLs from relative ones.
     */
    docBaseUrl?: string | URL | undefined;
    /**
     * The document attachments (may not exist in most PDF documents).
     */
    docAttachments?: Attachments | undefined;
}
export interface OpenAction {
    dest?: Destination;
    action?: string;
}
export declare type Order = (string | {
    name: string | null;
    order: Order;
})[];
interface OptionalContentGroupData {
    id: string;
    name: string | null;
    intent: string | null;
}
export interface OptionalContentConfigData {
    name: string | null;
    creator: string | null;
    baseState: string | null;
    on: string[];
    off: string[];
    order: Order | null;
    groups: OptionalContentGroupData[];
}
declare type ViewerPrefValue = string | number | number[] | boolean;
export declare type ViewerPref = Record<string, ViewerPrefValue>;
/**
 * Table 321
 */
export interface MarkInfo {
    Marked: boolean;
    UserProperties: boolean;
    Suspects: boolean;
}
declare type AllPageDicts = Map<number, [Dict, Ref | undefined] | [Error, undefined]>;
export declare type Attachments = Record<string, Attachment>;
/**
 * Table 28
 */
export declare class Catalog {
    #private;
    pdfManager: BasePdfManager;
    xref: XRef;
    _actualNumPages: number | undefined;
    fontCache: RefSetCache<Promise<TranslatedFont>>;
    builtInCMapCache: Map<string, CMapData>;
    standardFontDataCache: Map<string, Uint8Array | ArrayBuffer>;
    globalImageCache: GlobalImageCache;
    pageKidsCountCache: RefSetCache<number>;
    pageIndexCache: RefSetCache<Obj>;
    nonBlendModesSet: RefSet;
    constructor(pdfManager: BasePdfManager, xref: XRef);
    get version(): string | undefined;
    get lang(): string | undefined;
    /**
     * @return `true` for pure XFA documents,
     *   `false` for XFA Foreground documents.
     */
    get needsRendering(): boolean;
    get collection(): Dict | null;
    get acroForm(): Dict | undefined;
    get acroFormRef(): import("./primitives.js").NsRef.Ref | undefined;
    get metadata(): import("./metadata_parser.js").SerializedMetadata | undefined;
    get markInfo(): MarkInfo | undefined;
    get structTreeRoot(): StructTreeRoot | undefined;
    get toplevelPagesDict(): Dict;
    get documentOutline(): OutlineNode[] | undefined;
    get permissions(): PermissionFlag[] | undefined;
    /**
     * Table 100
     */
    get optionalContentConfig(): OptionalContentConfigData | undefined;
    setActualNumPages(num?: number): void;
    get hasActualNumPages(): boolean;
    get _pagesCount(): number;
    get numPages(): number;
    get destinations(): Record<string, ExplicitDest>;
    getDestination(id: string): ExplicitDest | undefined;
    get pageLabels(): string[] | undefined;
    get pageLayout(): PageLayout | undefined;
    get pageMode(): PageMode;
    get viewerPreferences(): ViewerPref | undefined;
    get openAction(): OpenAction | undefined;
    get attachments(): Attachments | undefined;
    get xfaImages(): Dict | null;
    get javaScript(): string[] | undefined;
    get jsActions(): import("./core_utils.js").AnnotActions | undefined;
    fontFallback(id: string, handler: MessageHandler<Thread.worker>): Promise<void>;
    cleanup(manuallyTriggered?: boolean): Promise<void>;
    /**
     * Dict: Ref. 7.7.3.3 Page Objects
     */
    getPageDict(pageIndex: number): Promise<[Dict, Ref | undefined]>;
    /**
     * Eagerly fetches the entire /Pages-tree; should ONLY be used as a fallback.
     */
    getAllPageDicts(recoveryMode?: boolean): Promise<AllPageDicts>;
    getPageIndex(pageRef: Ref): Promise<number>;
    get baseUrl(): string | undefined;
    /**
     * Helper function used to parse the contents of destination dictionaries.
     */
    static parseDestDictionary(params: _ParseDestDictionaryP): void;
}
export {};
//# sourceMappingURL=catalog.d.ts.map