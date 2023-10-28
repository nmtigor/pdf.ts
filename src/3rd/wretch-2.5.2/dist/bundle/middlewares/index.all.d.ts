import { setErrorType, setOptions, setPolyfills } from "./config.js";
import * as Addons from "./addons/index.js";
declare function factory(
  _url?: string,
  _options?: {},
):
  & Addons.AbortWretch
  & Addons.FormDataAddon
  & Addons.FormUrlAddon
  & Addons.QueryStringAddon
  & import("./types.js").Wretch<
    & Addons.AbortWretch
    & Addons.FormDataAddon
    & Addons.FormUrlAddon
    & Addons.QueryStringAddon,
    Addons.AbortResolver & Addons.PerfsAddon & Addons.ProgressResolver,
    undefined
  >;
declare namespace factory {
  var options: typeof setOptions;
  var errorType: typeof setErrorType;
  var polyfills: typeof setPolyfills;
  var WretchError: typeof import("./resolver.js").WretchError;
}
export default factory;
