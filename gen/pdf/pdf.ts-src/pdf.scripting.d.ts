import { initSandbox } from "./scripting_api/initialization.js";
declare global {
    var pdfjsScripting: {
        initSandbox: typeof initSandbox;
    };
}
//# sourceMappingURL=pdf.scripting.d.ts.map