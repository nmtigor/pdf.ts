import type { EventBus } from "./event_utils.js";
import type { IL10n } from "./interfaces.js";
import { SidebarView } from "./ui_utils.js";
import type { ViewerConfiguration } from "./viewer.js";
interface PDFSidebarOptions {
    /**
     * The DOM elements.
     */
    elements: ViewerConfiguration["sidebar"];
    /**
     * The application event bus.
     */
    eventBus: EventBus;
    /**
     * The localization service.
     */
    l10n: IL10n;
}
export declare class PDFSidebar {
    #private;
    isOpen: boolean;
    active: SidebarView;
    isInitialViewSet: boolean;
    isInitialEventDispatched: boolean;
    /**
     * Callback used when the sidebar has been opened/closed, to ensure that
     * the viewers (PDFViewer/PDFThumbnailViewer) are updated correctly.
     */
    onToggled?: () => void;
    onUpdateThumbnails?: () => void;
    outerContainer: HTMLDivElement;
    sidebarContainer: HTMLDivElement;
    toggleButton: HTMLButtonElement;
    resizer: HTMLDivElement;
    thumbnailButton: HTMLButtonElement;
    outlineButton: HTMLButtonElement;
    attachmentsButton: HTMLButtonElement;
    layersButton: HTMLButtonElement;
    thumbnailView: HTMLDivElement;
    outlineView: HTMLDivElement;
    attachmentsView: HTMLDivElement;
    layersView: HTMLDivElement;
    _outlineOptionsContainer: HTMLDivElement;
    _currentOutlineItemButton: HTMLButtonElement;
    eventBus: EventBus;
    constructor({ elements, eventBus, l10n, }: PDFSidebarOptions);
    reset(): void;
    /**
     * @return One of the values in {SidebarView}.
     */
    get visibleView(): number;
    /**
     * @param view The sidebar view that should become visible,
     *  must be one of the values in {SidebarView}.
     */
    setInitialView(view?: SidebarView): void;
    /**
     * @param view The sidebar view that should be switched to,
     *  must be one of the values in {SidebarView}.
     * @param forceOpen Ensure that the sidebar is open. The default value is `false`.
     */
    switchView(view: SidebarView, forceOpen?: boolean): false | undefined;
    open(): void;
    close(): void;
    toggle(): void;
    get outerContainerWidth(): number;
}
export {};
//# sourceMappingURL=pdf_sidebar.d.ts.map