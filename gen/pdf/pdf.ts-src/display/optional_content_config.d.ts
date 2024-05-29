/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/display/optional_content_config.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { OptionalContentConfigData, OptionalContentGroupData, Order, SetOCGState } from "../core/catalog.js";
import type { MarkedContentProps } from "../core/evaluator.js";
import { RenderingIntentFlag } from "../shared/util.js";
declare const INTERNAL: unique symbol;
declare class OptionalContentGroup {
    #private;
    name: string | undefined;
    intent: import("./api.js").Intent[] | undefined;
    usage: {
        print?: {
            printState: "ON" | "OFF";
        };
        view?: {
            viewState: "ON" | "OFF";
        };
    };
    get visible(): boolean;
    /** @ignore */
    _setVisible(internal: typeof INTERNAL, visible: boolean, userSet?: boolean): void;
    constructor(renderingIntent: RenderingIntentFlag, { name, intent, usage }: OptionalContentGroupData);
}
export declare class OptionalContentConfig {
    #private;
    renderingIntent: RenderingIntentFlag;
    name?: string | undefined;
    creator?: string | undefined;
    constructor(data?: OptionalContentConfigData, renderingIntent?: RenderingIntentFlag);
    isVisible(group: MarkedContentProps): boolean;
    setVisibility(id: string, visible?: boolean): void;
    setOCGState({ state, preserveRB }: SetOCGState): void;
    get hasInitialVisibility(): boolean;
    getOrder(): (string | {
        name: string | undefined;
        order: Order;
    })[] | undefined;
    getGroups(): Record<string, OptionalContentGroup> | undefined;
    getGroup(id: string): OptionalContentGroup | undefined;
    getHash(): string;
}
export {};
//# sourceMappingURL=optional_content_config.d.ts.map