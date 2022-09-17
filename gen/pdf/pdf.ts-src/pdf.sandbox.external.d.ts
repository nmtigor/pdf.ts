import { EventInSandBox } from "../pdf.ts-web/interfaces.js";
export declare class SandboxSupportBase {
    win: Window & typeof globalThis;
    timeoutIds: Map<number, number>;
    /**
     * Will be assigned after the sandbox is initialized
     */
    commFun: ((name: string, args: string) => void) | undefined;
    constructor(win: typeof window);
    destroy(): void;
    /**
     * @param val Export a value in the sandbox.
     */
    exportValueToSandbox(val: object): string;
    /**
     * @param val Import a value from the sandbox.
     */
    importValueFromSandbox(val: object): void;
    /**
     * @param errorMessage Create an error in the sandbox.
     */
    createErrorForSandbox(errorMessage: string): void;
    /**
     * @param {String} name - Name of the function to call in the sandbox
     * @param {Array<Object>} args - Arguments of the function.
     */
    callSandboxFunction(name: string, args: {
        callbackId: number;
        nMilliseconds?: number;
        interval?: boolean;
    } | EventInSandBox): void;
    createSandboxExternals(): (name: "confirm" | "alert" | "clearInterval" | "clearTimeout" | "prompt" | "send" | "setInterval" | "setTimeout" | "parseURL", args: unknown[]) => string;
}
//# sourceMappingURL=pdf.sandbox.external.d.ts.map