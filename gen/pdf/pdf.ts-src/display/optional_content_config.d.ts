import { type OptionalContentConfigData, type Order } from "../core/catalog.js";
import { type MarkedContentProps } from "../core/evaluator.js";
declare class OptionalContentGroup {
    name: string | null;
    intent: string | null;
    visible: boolean;
    constructor(name: string | null, intent: string | null);
}
export declare class OptionalContentConfig {
    #private;
    name: string | null;
    creator: string | null;
    constructor(data?: OptionalContentConfigData);
    isVisible(group: MarkedContentProps): boolean;
    setVisibility(id: string, visible?: boolean): void;
    getOrder(): (string | {
        name: string | null;
        order: Order;
    })[] | null;
    getGroups(): Record<string, OptionalContentGroup> | null;
    getGroup(id: string): OptionalContentGroup | null;
}
export {};
//# sourceMappingURL=optional_content_config.d.ts.map