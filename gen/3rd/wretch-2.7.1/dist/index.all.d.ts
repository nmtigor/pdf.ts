export default factory;
declare function factory(_url?: string, _options?: {}): Addons.AbortWretch & Addons.FormDataAddon & Addons.FormUrlAddon & Addons.QueryStringAddon & import("./types.js").Wretch<Addons.AbortWretch & Addons.FormDataAddon & Addons.FormUrlAddon & Addons.QueryStringAddon, Addons.AbortResolver & Addons.PerfsAddon & Addons.ProgressResolver, undefined>;
declare namespace factory {
    export { factory as default };
    export { setOptions as options };
    export { setErrorType as errorType };
    export { setPolyfills as polyfills };
    export { WretchError };
}
import * as Addons from "./addons/index.js";
import { setOptions } from "./config.js";
import { setErrorType } from "./config.js";
import { setPolyfills } from "./config.js";
import { WretchError } from "./resolver.js";
//# sourceMappingURL=index.all.d.ts.map