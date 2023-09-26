import type { rect_t } from "../../../lib/alias.js";
import { PageLayout, PageMode } from "../../pdf.ts-web/ui_utils.js";
import type { ResetForm } from "../display/annotation_layer.js";
import type { OutlineNode } from "../display/api.js";
import type { CMapData } from "../display/base_factory.js";
import { MessageHandler, Thread } from "../shared/message_handler.js";
import { PermissionFlag } from "../shared/util.js";
import { TranslatedFont } from "./evaluator.js";
import { Attachment } from "./file_spec.js";
import type { SubstitutionInfo } from "./font_substitutions.js";
import { GlobalImageCache } from "./image_utils.js";
import { BasePdfManager } from "./pdf_manager.js";
import type { Obj } from "./primitives.js";
import { Dict, Name, Ref, RefSet, RefSetCache } from "./primitives.js";
import { StructTreeRoot } from "./struct_tree.js";
import { XRef } from "./xref.js";
type DestPage = Ref | number | null;
export type ExplicitDest = [
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
export type Destination = ExplicitDest | Name | string;
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
interface ParseDestDictionaryP_ {
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
    docBaseUrl?: string | undefined;
    /**
     * The document attachments (may not exist in most PDF documents).
     */
    docAttachments?: Attachments | undefined;
}
export interface OpenAction {
    dest?: Destination;
    action?: string;
}
export type Order = (string | {
    name: string | undefined;
    order: Order;
})[];
type OptionalContentGroupData_ = {
    id: string;
    name: string | undefined;
    intent: string | undefined;
};
export type OptionalContentConfigData = {
    name: string | undefined;
    creator: string | undefined;
    baseState: string | undefined;
    on: string[];
    off: string[];
    order: Order | undefined;
    groups: OptionalContentGroupData_[];
};
type ViewerPrefValue = string | number | number[] | boolean;
export type ViewerPref = Record<string, ViewerPrefValue>;
/**
 * Table 321
 */
export interface MarkInfo {
    Marked: boolean;
    UserProperties: boolean;
    Suspects: boolean;
}
type AllPageDicts = Map<number, [
    Dict | Error,
    Ref | undefined
] | [Error, undefined]>;
export type Attachments = Record<string, Attachment>;
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
    systemFontCache: Map<string, SubstitutionInfo>;
    constructor(pdfManager: BasePdfManager, xref: XRef);
    get version(): string | undefined;
    get lang(): string | undefined;
    /**
     * @return `true` for pure XFA documents,
     *   `false` for XFA Foreground documents.
     */
    get needsRendering(): boolean;
    get collection(): Dict | undefined;
    get acroForm(): Dict | undefined;
    get acroFormRef(): Ref | undefined;
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
    get xfaImages(): Dict | undefined;
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
    static parseDestDictionary(params: ParseDestDictionaryP_): void;
}
export {};
//# sourceMappingURL=catalog.d.ts.map