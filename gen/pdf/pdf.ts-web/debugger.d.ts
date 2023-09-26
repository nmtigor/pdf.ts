import type { FontFaceObject, OpListIR } from "../pdf.ts-src/pdf.js";
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
    function fontAdded(fontObj: FontFaceObject, url?: string): void;
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
declare namespace NsStepper {
    class Stepper {
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
}
export import Stepper = NsStepper.Stepper;
declare namespace Stats_ {
    interface _Stat {
        pageNumber: number;
        div: HTMLDivElement;
    }
    export const id = "Stats";
    export const name = "Stats";
    export let panel: HTMLDivElement;
    export let manager: typeof PDFBug;
    export function init(): void;
    export let enabled: boolean;
    export let active: boolean;
    export function add(pageNumber: number, stat: _Stat): void;
    export function cleanup(): void;
    export {};
}
export declare namespace PDFBug {
    const tools: (typeof FontInspector_ | typeof StepperManager_ | typeof Stats_)[];
    function enable(ids: string[]): void;
    function init(container: HTMLDivElement, ids: string[]): void;
    function loadCSS(): void;
    function cleanup(): void;
    function selectPanel(index: number | Tool_): void;
}
declare global {
    var FontInspector: typeof FontInspector_;
    var StepperManager: typeof StepperManager_;
    var Stats: typeof Stats_;
}
export {};
//# sourceMappingURL=debugger.d.ts.map