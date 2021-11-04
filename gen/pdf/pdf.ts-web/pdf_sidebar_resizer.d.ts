import { IL10n } from "./interfaces.js";
import { EventBus } from "./ui_utils.js";
import { ViewerConfiguration } from "./viewer.js";
export declare class PDFSidebarResizer {
    #private;
    eventBus: EventBus;
    isRTL: boolean;
    sidebarOpen: boolean;
    doc: HTMLElement;
    _width?: number;
    _outerContainerWidth?: number | undefined;
    _boundEvents: any;
    outerContainer: HTMLDivElement;
    resizer: HTMLDivElement;
    /**
     * @param eventBus The application event bus.
     * @param l10n Localization service.
     */
    constructor(options: ViewerConfiguration['sidebarResizer'], eventBus: EventBus, l10n: IL10n);
    get outerContainerWidth(): number;
}
//# sourceMappingURL=pdf_sidebar_resizer.d.ts.map