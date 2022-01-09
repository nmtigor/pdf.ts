import { EventBus } from "./event_utils.js";
import { type IL10n } from "./interfaces.js";
import { type ViewerConfiguration } from "./viewer.js";
export declare class PDFSidebarResizer {
    #private;
    isRTL: boolean;
    sidebarOpen: boolean;
    doc: HTMLElement;
    _width?: number;
    _outerContainerWidth?: number | undefined;
    _boundEvents: any;
    outerContainer: HTMLDivElement;
    resizer: HTMLDivElement;
    eventBus: EventBus;
    /**
     * @param eventBus The application event bus.
     * @param l10n Localization service.
     */
    constructor(options: ViewerConfiguration['sidebarResizer'], eventBus: EventBus, l10n: IL10n);
    get outerContainerWidth(): number;
}
//# sourceMappingURL=pdf_sidebar_resizer.d.ts.map