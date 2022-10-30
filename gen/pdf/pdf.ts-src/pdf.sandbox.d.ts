import { EventInSandBox } from "../pdf.ts-web/interfaces.js";
import { SandboxSupportBase } from "./pdf.sandbox.external.js";
declare class SandboxSupport extends SandboxSupportBase {
    exportValueToSandbox(val: object): string;
    importValueFromSandbox(val: object): object;
    createErrorForSandbox(errorMessage: string): Error;
}
export declare class Sandbox {
    support: SandboxSupport;
    _module: unknown;
    /**
     * 0 to display error using console.error
     * else display error using window.alert
     */
    _alertOnError: number;
    constructor(win: typeof window, module: unknown);
    create(data: unknown): void;
    dispatchEvent(event: EventInSandBox): void;
    dumpMemoryUse(): void;
    nukeSandbox(): void;
    evalForTesting(code: unknown, key: unknown): void;
}
export declare function QuickJSSandbox(): Promise<Sandbox>;
export {};
//# sourceMappingURL=pdf.sandbox.d.ts.map