/* Copyright 2014 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/*81---------------------------------------------------------------------------*/
export class OverlayManager {
    _overlays = {};
    _active = null;
    get active() { return this._active; }
    /**
     * @param name The name of the overlay that is registered.
     * @param element The overlay's DOM element.
     * @param callerCloseMethod The method that, if present, calls
     *  `OverlayManager.close` from the object registering the
     *  overlay. Access to this method is necessary in order to
     *  run cleanup code when e.g. the overlay is force closed.
     *  The default is `null`.
     * @param canForceClose Indicates if opening the overlay closes
     *  an active overlay. The default is `false`.
     * @return A promise that is resolved when the overlay has been registered.
     */
    async register(name, element, callerCloseMethod, canForceClose = false) {
        let container;
        if (!name || !element || !(container = element.parentNode)) {
            throw new Error("Not enough parameters.");
        }
        else if (this._overlays[name]) {
            throw new Error("The overlay is already registered.");
        }
        this._overlays[name] = {
            element,
            container,
            callerCloseMethod,
            canForceClose,
        };
    }
    /**
     * @param name - The name of the overlay that is unregistered.
     * @return A promise that is resolved when the overlay has been unregistered.
     */
    async unregister(name) {
        if (!this._overlays[name]) {
            throw new Error("The overlay does not exist.");
        }
        else if (this._active === name) {
            throw new Error("The overlay cannot be removed while it is active.");
        }
        delete this._overlays[name];
    }
    /**
     * @param name - The name of the overlay that should be opened.
     * @return A promise that is resolved when the overlay has been opened.
     */
    async open(name) {
        if (!this._overlays[name]) {
            throw new Error("The overlay does not exist.");
        }
        else if (this._active) {
            if (this._overlays[name].canForceClose) {
                this.#closeThroughCaller();
            }
            else if (this._active === name) {
                throw new Error("The overlay is already active.");
            }
            else {
                throw new Error("Another overlay is currently active.");
            }
        }
        this._active = name;
        this._overlays[this._active].element.classList.remove("hidden");
        this._overlays[this._active].container.classList.remove("hidden");
        window.addEventListener("keydown", this.#keyDown);
    }
    /**
     * @param name The name of the overlay that should be closed.
     * @return A promise that is resolved when the overlay has been closed.
     */
    async close(name) {
        if (!this._overlays[name]) {
            throw new Error("The overlay does not exist.");
        }
        else if (!this._active) {
            throw new Error("The overlay is currently not active.");
        }
        else if (this._active !== name) {
            throw new Error("Another overlay is currently active.");
        }
        this._overlays[this._active].container.classList.add("hidden");
        this._overlays[this._active].element.classList.add("hidden");
        this._active = null;
        window.removeEventListener("keydown", this.#keyDown);
    }
    #keyDown = (evt) => {
        if (this._active && evt.keyCode === /* Esc = */ 27) {
            this.#closeThroughCaller();
            evt.preventDefault();
        }
    };
    #closeThroughCaller = () => {
        if (this._overlays[this._active].callerCloseMethod) {
            this._overlays[this._active].callerCloseMethod();
        }
        if (this._active) {
            this.close(this._active);
        }
    };
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=overlay_manager.js.map