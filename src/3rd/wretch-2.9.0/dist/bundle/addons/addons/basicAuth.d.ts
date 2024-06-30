import type { Wretch, WretchAddon } from "../types.js";
export interface BasicAuthAddon {
  /**
   * Sets the `Authorization` header to `Basic ` + <base64 encoded credentials>.
   * Additionally, allows using URLs with credentials in them.
   *
   * ```js
   * const user = "user"
   * const pass = "pass"
   *
   * // Automatically sets the Authorization header to "Basic " + <base64 encoded credentials>
   * wretch("...").addon(BasicAuthAddon).basicAuth(user, pass).get()
   *
   * // Allows using URLs with credentials in them
   * wretch(`https://${user}:${pass}@...`).addon(BasicAuthAddon).get()
   * ```
   *
   * @param input - The credentials to use for the basic auth.
   */
  basicAuth<T extends BasicAuthAddon, C, R>(
    this: T & Wretch<T, C, R>,
    username: string,
    password: string,
  ): this;
}
/**
 * Adds the ability to use basic auth with the `Authorization` header.
 *
 * ```js
 * import BasicAuthAddon from "wretch/addons/basicAuth"
 *
 * wretch().addon(BasicAuthAddon)
 * ```
 */
declare const basicAuth: WretchAddon<BasicAuthAddon>;
export default basicAuth;
