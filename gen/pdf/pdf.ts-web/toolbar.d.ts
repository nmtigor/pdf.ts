/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/toolbar.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { EventBus } from "./event_utils.js";
import type { ViewerConfiguration } from "./viewer.js";
export declare class Toolbar {
    #private;
    eventBus: EventBus;
    pageNumber: number;
    pageLabel?: string | undefined;
    hasPageLabels: boolean;
    pagesCount: number;
    pageScaleValue: string;
    pageScale: number;
    constructor(options: ViewerConfiguration["toolbar"], eventBus: EventBus);
    setPageNumber(pageNumber: number, pageLabel?: string): void;
    setPagesCount(pagesCount: number, hasPageLabels: boolean): void;
    setPageScale(pageScaleValue: string | number | undefined, pageScale: number): void;
    reset(): void;
    updateLoadingIndicatorState(loading?: boolean): void;
}
//# sourceMappingURL=toolbar.d.ts.map