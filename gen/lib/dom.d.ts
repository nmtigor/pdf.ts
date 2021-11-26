import { type loff_t } from "./alias.js";
import { $tail_ignored, $loff, $ovlap } from "./symbols.js";
declare global {
    interface EventTarget {
        on(type: string, listener: any, options?: any): void;
        off(type: string, listener: any, options?: any): void;
    }
}
declare global {
    interface Event {
        canceled_?: boolean;
        canceled: boolean;
    }
}
declare global {
    interface Node {
        readonly isText: boolean;
        readonly secondChild: Node | null;
        removeAllChild: () => this;
        assert_eq: (rhs: object) => void | never;
    }
}
declare global {
    interface Element {
        setAttrs(attrs_o: Record<string, string>): this;
        readonly scrollRight: number;
        readonly scrollBottom: number;
    }
}
declare global {
    interface HTMLElement {
        /**
         * Return previous visible _HTMLElement_.
         */
        readonly prevVisible?: HTMLElement;
        readonly pageX: number;
        readonly pageY: number;
    }
}
declare global {
    interface HTMLCollection {
        indexOf(element: Element): number;
    }
}
export declare type HSElement = HTMLElement | SVGElement;
declare global {
    interface DOMRect {
        [$ovlap]: boolean;
    }
    interface Range {
        /**
         * @param { out } rec_a
         * @param { const } ovlap
         */
        getReca(rec_a: DOMRect[], ovlap?: boolean): void;
        reset(): void;
    }
}
declare global {
    interface Text {
        [$loff]: loff_t;
        [$tail_ignored]: boolean;
    }
}
/**
 * @param { const } text_x
 * @param { const } loff_x
 * @param { const } tail_ignored_x
 */
export declare function textnode(text_x: string, loff_x?: loff_t, tail_ignored_x?: boolean): Text;
declare type HTMLRet<NN extends string> = NN extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[NN] : HTMLElement;
export declare function html<NN extends string>(nodeName: NN, innerHTML?: string, doc?: Document): HTMLRet<NN>;
export declare function div(innerHTML?: string, doc?: Document): HTMLDivElement;
export declare function span(innerHTML?: string, doc?: Document): HTMLSpanElement;
declare type SVGRet<NN extends string> = NN extends keyof SVGElementTagNameMap ? SVGElementTagNameMap[NN] : SVGElement;
export declare function svg<NN extends string>(nodeName: NN, doc?: Document): SVGRet<NN>;
declare global {
    interface OnProgressParms {
        /**
         * Currently loaded number of bytes.
         */
        loaded: number;
        /**
         * Total number of bytes in the PDF file.
         */
        total: number;
    }
}
export {};
//# sourceMappingURL=dom.d.ts.map