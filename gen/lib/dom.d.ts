/** 80**************************************************************************
 * @module lib/dom
 * @license Apache-2.0
 ******************************************************************************/
import type { CSSStyle, llen_t } from "./alias.js";
import type { Vuu } from "./cv.js";
import { $cssstylesheet, $loff, $ovlap, $tail_ignored } from "./symbols.js";
declare global {
    interface EventMap extends ElementEventMap, GlobalEventHandlersEventMap, WindowEventHandlersEventMap, DocumentEventMap, HTMLVideoElementEventMap, OfflineAudioContextEventMap, ServiceWorkerEventMap, WindowEventMap, WorkerEventMap {
    }
    type EventName = keyof EventMap;
    type EventHandler<E extends EventName> = (ev: EventMap[E]) => any;
    interface Event {
        _canceled: boolean | undefined;
        canceled: boolean;
        targetPocudVu?: Vuu;
    }
    interface WheelEvent {
        _repr(): {
            deltaMode: string;
            deltaX: number;
            deltaY: number;
        };
    }
}
export declare const enum MouseButton {
    Main = 0,
    Auxiliary = 1,
    Secondary = 2,
    Back = 3,
    Forward = 4
}
declare global {
    interface EventTarget {
        on<E extends EventName>(type: E, listener: EventHandler<E>, options?: AddEventListenerOptions | boolean): void;
        off<E extends EventName>(type: E, listener: EventHandler<E>, options?: EventListenerOptions | boolean): void;
    }
}
export declare const ClickHoldTo = 10000;
declare global {
    interface Node {
        readonly isText: boolean;
        readonly secondChild: Node | null;
        removeAllChild: () => this;
        /** @deprecated */
        assert_eq: (rhs: object) => void | never;
    }
}
declare global {
    interface Document {
        /**
         * Used for adding CSS pseudo-element like `::-webkit-scrollbar`
         */
        [$cssstylesheet]: CSSStyleSheet;
    }
}
declare global {
    interface Element {
        assignAttro(attr_o: Record<string, string | number>): this;
        readonly scrollRight: number;
        readonly scrollBottom: number;
        cyName: string;
    }
}
declare global {
    interface HTMLElement {
        assignStylo(styl_o: CSSStyle): this;
        /**
         * Return previous visible _HTMLElement_
         * jjjj cf. pdf/pdf.ts-web/ui_utils.getVisibleElements()
         */
        readonly prevVisible?: HTMLElement;
        readonly viewLeft: number;
        readonly viewRight: number;
        readonly viewTop: number;
        readonly viewBottom: number;
    }
}
declare global {
    interface SVGElement {
        assignStylo(styl_o: CSSStyle): this;
    }
}
declare global {
    interface CSSStyleDeclaration {
        assignPropo(prop_o: Record<string, string | number>): void;
    }
}
declare global {
    interface HTMLCollection {
        indexOf(element: Element): number;
    }
}
export type HSElement = HTMLElement | SVGElement;
declare global {
    interface DOMRect {
        contain(x_x: number, y_x: number): boolean;
        [$ovlap]: boolean;
    }
    interface Range {
        /**
         * @out @param rec_a_x
         * @const @param ovlap_x
         */
        getSticka(rec_a_x: DOMRect[], ovlap_x?: boolean): void;
        reset(): void;
    }
}
declare global {
    interface Text {
        [$loff]?: llen_t;
        [$tail_ignored]?: boolean;
    }
}
/**
 * @const @param text_x
 * @const @param loff_x
 * @const @param tail_ignored_x
 */
export declare function textnode(text_x: string, loff_x?: llen_t, tail_ignored_x?: boolean): Text;
type HTMLRet_<NN extends string> = NN extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[NN] : HTMLElement;
export declare function html<NN extends string>(nodeName_x: NN, innerHTML_x?: string, doc_x?: Document): HTMLRet_<NN>;
export declare function div(innerHTML_x?: string, doc_x?: Document): HTMLDivElement;
export declare function span(innerHTML_x?: string, doc_x?: Document): HTMLSpanElement;
type SVGRet_<NN extends string> = NN extends keyof SVGElementTagNameMap ? SVGElementTagNameMap[NN] : SVGElement;
export declare function svg<NN extends string>(nodeName: NN, doc?: Document): SVGRet_<NN>;
declare global {
    interface OnProgressP {
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