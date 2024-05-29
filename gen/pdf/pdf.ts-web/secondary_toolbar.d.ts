/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/secondary_toolbar.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { EventBus } from "./event_utils.js";
import type { ViewerConfiguration } from "./viewer.js";
export declare class SecondaryToolbar {
    #private;
    mainContainer?: HTMLDivElement;
    eventBus: EventBus;
    opened: boolean;
    get isOpen(): boolean;
    containerHeight?: number;
    previousContainerHeight?: number;
    pagesCount?: number;
    pageNumber?: number;
    constructor(options: ViewerConfiguration["secondaryToolbar"], eventBus: EventBus);
    setPageNumber(pageNumber: number): void;
    setPagesCount(pagesCount: number): void;
    reset(): void;
    open(): void;
    close(): void;
    toggle(): void;
}
//# sourceMappingURL=secondary_toolbar.d.ts.map