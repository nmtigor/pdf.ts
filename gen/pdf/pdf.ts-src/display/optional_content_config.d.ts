import type { OptionalContentConfigData, Order } from "../core/catalog.js";
import type { MarkedContentProps } from "../core/evaluator.js";
declare const INTERNAL: unique symbol;
declare class OptionalContentGroup {
    #private;
    name: string | undefined;
    intent: string | undefined;
    get visible(): boolean;
    /** @ignore */
    _setVisible(internal: typeof INTERNAL, visible: boolean): void;
    constructor(name?: string, intent?: string);
}
export declare class OptionalContentConfig {
    #private;
    name?: string | undefined;
    creator?: string | undefined;
    constructor(data?: OptionalContentConfigData);
    isVisible(group: MarkedContentProps): boolean;
    setVisibility(id: string, visible?: boolean): void;
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