import { ScrollMode, SidebarView, SpreadMode } from "./ui_utils.js";
export interface MultipleStored {
    page: number | undefined;
    zoom?: string | number | undefined;
    scrollLeft: number;
    scrollTop: number;
    rotation: number | undefined;
    sidebarView?: SidebarView;
    scrollMode?: ScrollMode;
    spreadMode?: SpreadMode;
}
/**
 * View History - This is a utility for saving various view parameters for
 *                recently opened files.
 *
 * The way that the view parameters are stored depends on how PDF.js is built,
 * for 'gulp <flag>' the following cases exist:
 *  - MOZCENTRAL        - uses sessionStorage.
 *  - GENERIC or CHROME - uses localStorage, if it is available.
 */
export declare class ViewHistory {
    fingerprint: string;
    cacheSize: number;
    _initializedPromise: Promise<unknown>;
    file: Record<string, string | number>;
    database: unknown;
    constructor(fingerprint: string, cacheSize?: number);
    _writeToStorage(): Promise<void>;
    _readFromStorage(): Promise<string | null>;
    set(name: string, val: SidebarView | ScrollMode | SpreadMode): Promise<void>;
    setMultiple(properties: MultipleStored): Promise<void>;
    get(name: string, defaultValue: SidebarView | ScrollMode | SpreadMode): Promise<string | number>;
    getMultiple(properties: MultipleStored): Promise<MultipleStored>;
}
//# sourceMappingURL=view_history.d.ts.map