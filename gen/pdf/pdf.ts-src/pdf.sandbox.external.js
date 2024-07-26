/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/pdf.sandbox.external.ts
 * @license Apache-2.0
 ******************************************************************************/
/*80--------------------------------------------------------------------------*/
export class SandboxSupportBase {
    win;
    timeoutIds = new Map();
    /**
     * Will be assigned after the sandbox is initialized
     */
    commFun;
    constructor(win) {
        this.win = win;
    }
    destroy() {
        this.commFun = undefined;
        for (const id of this.timeoutIds.values()) {
            this.win.clearTimeout(id);
        }
        this.timeoutIds = undefined;
    }
    /**
     * @param val Export a value in the sandbox.
     */
    exportValueToSandbox(val) {
        throw new Error("Not implemented");
    }
    /**
     * @param val Import a value from the sandbox.
     */
    importValueFromSandbox(val) {
        throw new Error("Not implemented");
    }
    /**
     * @param errorMessage Create an error in the sandbox.
     */
    createErrorForSandbox(errorMessage) {
        throw new Error("Not implemented");
    }
    /**
     * @param name Name of the function to call in the sandbox
     * @param args Arguments of the function.
     */
    callSandboxFunction(name, args) {
        if (!this.commFun) {
            return;
        }
        try {
            const args_ = this.exportValueToSandbox(args);
            this.commFun(name, args_);
        }
        catch (e) {
            this.win.console.error(e);
        }
    }
    createSandboxExternals() {
        // All the functions in externals object are called
        // from the sandbox.
        const externals = {
            setTimeout: (callbackId, nMilliseconds) => {
                if (typeof callbackId !== "number" ||
                    typeof nMilliseconds !== "number") {
                    return;
                }
                if (callbackId === 0) {
                    // This callbackId corresponds to the one used for userActivation.
                    // So here, we cancel the last userActivation.
                    this.win.clearTimeout(this.timeoutIds.get(callbackId));
                }
                const id = this.win.setTimeout(() => {
                    this.timeoutIds.delete(callbackId);
                    this.callSandboxFunction("timeoutCb", {
                        callbackId,
                        interval: false,
                    });
                }, nMilliseconds);
                this.timeoutIds.set(callbackId, id);
            },
            clearTimeout: (callbackId) => {
                this.win.clearTimeout(this.timeoutIds.get(callbackId));
                this.timeoutIds.delete(callbackId);
            },
            setInterval: (callbackId, nMilliseconds) => {
                if (typeof callbackId !== "number" ||
                    typeof nMilliseconds !== "number") {
                    return;
                }
                const id = this.win.setInterval(() => {
                    this.callSandboxFunction("timeoutCb", {
                        callbackId,
                        interval: true,
                    });
                }, nMilliseconds);
                this.timeoutIds.set(callbackId, id);
            },
            clearInterval: (callbackId) => {
                this.win.clearInterval(this.timeoutIds.get(callbackId));
                this.timeoutIds.delete(callbackId);
            },
            alert: (cMsg) => {
                if (typeof cMsg !== "string") {
                    return;
                }
                this.win.alert(cMsg);
            },
            confirm: (cMsg) => {
                if (typeof cMsg !== "string") {
                    return false;
                }
                return this.win.confirm(cMsg);
            },
            prompt: (cQuestion, cDefault) => {
                if (typeof cQuestion !== "string" || typeof cDefault !== "string") {
                    return undefined;
                }
                return this.win.prompt(cQuestion, cDefault);
            },
            parseURL: (cUrl) => {
                const url = new this.win.URL(cUrl);
                const props = [
                    "hash",
                    "host",
                    "hostname",
                    "href",
                    "origin",
                    "password",
                    "pathname",
                    "port",
                    "protocol",
                    "search",
                    "searchParams",
                    "username",
                ];
                return Object.fromEntries(props.map((name) => [name, url[name].toString()]));
            },
            send: (data) => {
                if (!data) {
                    return;
                }
                const event = new this.win.CustomEvent("updatefromsandbox", {
                    detail: this.importValueFromSandbox(data),
                });
                this.win.dispatchEvent(event);
            },
        };
        Object.setPrototypeOf(externals, null);
        return (name, args) => {
            try {
                const result = externals[name](...args);
                return this.exportValueToSandbox(result);
            }
            catch (error) {
                throw this.createErrorForSandbox(error?.toString() ?? "");
            }
        };
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=pdf.sandbox.external.js.map