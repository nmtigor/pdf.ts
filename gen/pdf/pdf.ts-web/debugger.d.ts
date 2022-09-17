import { FontFaceObject, OpListIR, OPS } from "../pdf.ts-src/pdf.js";
interface _PdfjsLib {
    OPS: typeof OPS;
}
declare type _Tool = typeof _FontInspector | typeof _StepperManager | typeof _Stats;
declare namespace _FontInspector {
    const id = "FontInspector";
    const name = "Font Inspector";
    let panel: HTMLDivElement;
    let manager: typeof PDFBug;
    function init(pdfjsLib: _PdfjsLib): void;
    function cleanup(): void;
    let enabled: boolean;
    let active: boolean;
    function fontAdded(fontObj: FontFaceObject, url?: string): void;
}
declare namespace _StepperManager {
    const id = "Stepper";
    const name = "Stepper";
    let panel: HTMLDivElement;
    let manager: typeof PDFBug;
    function init(pdfjsLib: _PdfjsLib): void;
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
declare namespace _Stats {
    interface _Stat {
        pageNumber: number;
        div: HTMLDivElement;
    }
    export const id = "Stats";
    export const name = "Stats";
    export let panel: HTMLDivElement;
    export let manager: typeof PDFBug;
    export function init(pdfjsLib: _PdfjsLib): void;
    export let enabled: boolean;
    export let active: boolean;
    export function add(pageNumber: number, stat: _Stat): void;
    export function cleanup(): void;
    export {};
}
export declare namespace PDFBug {
    const tools: (typeof _FontInspector | typeof _StepperManager | typeof _Stats)[];
    function enable(ids: string[]): void;
    function init(pdfjsLib: _PdfjsLib, container: HTMLDivElement, ids: string[]): void;
    function loadCSS(): void;
    function cleanup(): void;
    function selectPanel(index: number | _Tool): void;
}
declare global {
    var FontInspector: typeof _FontInspector;
    var StepperManager: typeof _StepperManager;
    var Stats: typeof _Stats;
}
export {};
//# sourceMappingURL=debugger.d.ts.map