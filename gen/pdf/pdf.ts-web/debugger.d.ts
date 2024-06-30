/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/debugger.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { FontFaceObject, OpListIR, StatTimer } from "../pdf.ts-src/pdf.js";
type Tool_ = typeof FontInspector_ | typeof StepperManager_ | typeof Stats_;
declare namespace FontInspector_ {
    const id = "FontInspector";
    const name = "Font Inspector";
    let panel: HTMLDivElement;
    let manager: typeof PDFBug;
    function init(): void;
    function cleanup(): void;
    let enabled: boolean;
    let active: boolean;
    function fontAdded(fontObj: FontFaceObject & {
        css?: string;
    }, url?: string): void;
}
declare namespace StepperManager_ {
    const id = "Stepper";
    const name = "Stepper";
    let panel: HTMLDivElement;
    let manager: typeof PDFBug;
    function init(): void;
    function cleanup(): void;
    let enabled: boolean;
    let active: boolean;
    function create(pageIndex: number): Stepper;
    function selectStepper(pageIndex: number, selectPanel?: boolean): void;
    function saveBreakPoints(pageIndex: number, bps: number[]): void;
}
/**
 * The stepper for each page's operatorList.
 */
export declare class Stepper {
    #private;
    panel: HTMLDivElement;
    breakPoint: number;
    nextBreakPoint: number | undefined;
    pageIndex: number;
    breakPoints: number[];
    currentIdx: number;
    operatorListIdx: number;
    indentLevel: number;
    table: HTMLTableElement;
    constructor(panel: HTMLDivElement, pageIndex: number, initialBreakPoints: number[]);
    init(operatorList: OpListIR): void;
    updateOperatorList(operatorList: OpListIR): void;
    getNextBreakPoint(): number | undefined;
    breakIt(idx: number, callback: () => void): void;
    goTo(idx: number): void;
}
declare namespace Stats_ {
    const id = "Stats";
    const name = "Stats";
    let panel: HTMLDivElement;
    let manager: typeof PDFBug;
    function init(): void;
    let enabled: boolean;
    let active: boolean;
    function add(pageNumber: number, stat?: StatTimer): void;
    function cleanup(): void;
}
/**
 * Manages all the debugging tools.
 */
export declare class PDFBug {
    #private;
    static readonly tools: (typeof FontInspector_ | typeof StepperManager_ | typeof Stats_)[];
    static enable(ids: string[]): void;
    static init(container: HTMLDivElement, ids: string[]): void;
    static loadCSS(): void;
    static cleanup(): void;
    static selectPanel(index: number | Tool_): void;
}
declare global {
    var FontInspector: typeof FontInspector_;
    var StepperManager: typeof StepperManager_;
    var Stats: typeof Stats_;
}
export {};
//# sourceMappingURL=debugger.d.ts.map