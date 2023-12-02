/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
/* Copyright 2017 Mozilla Foundation
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
import { CHROME } from "../../global.js";
import { isObjectLike } from "../../lib/jslang.js";
import { waitOnEventOrTimeout } from "./event_utils.js";
import { isValidRotation, parseQueryString } from "./ui_utils.js";
/*80--------------------------------------------------------------------------*/
// Heuristic value used when force-resetting `this.#blockHashChange`.
const HASH_CHANGE_TIMEOUT = 1000; // milliseconds
// Heuristic value used when adding the current position to the browser history.
const POSITION_UPDATED_THRESHOLD = 50;
// Heuristic value used when adding a temporary position to the browser history.
const UPDATE_VIEWAREA_TIMEOUT = 1000; // milliseconds
function getCurrentHash() {
    return document.location.hash;
}
export class PDFHistory {
    linkService;
    eventBus;
    #initialized = false;
    #fingerprint = "";
    #updateUrl;
    _popStateInProgress;
    #blockHashChange;
    _currentHash;
    #numPositionUpdates;
    #uid;
    #maxUid;
    #destination;
    #position;
    #initialRotation;
    get initialRotation() {
        return this.#initialized ? this.#initialRotation : undefined;
    }
    #initialBookmark = null;
    get initialBookmark() {
        return this.#initialized ? this.#initialBookmark : null;
    }
    _boundEvents;
    _isPagesLoaded;
    #updateViewareaTimeout;
    constructor({ linkService, eventBus }) {
        this.linkService = linkService;
        this.eventBus = eventBus;
        this.reset();
        // Ensure that we don't miss a "pagesinit" event,
        // by registering the listener immediately.
        this.eventBus._on("pagesinit", () => {
            this._isPagesLoaded = false;
            this.eventBus._on("pagesloaded", (evt) => {
                this._isPagesLoaded = !!evt.pagesCount;
            }, { once: true });
        });
    }
    /**
     * Initialize the history for the PDF document, using either the current
     * browser history entry or the document hash, whichever is present.
     */
    initialize({ fingerprint, resetHistory = false, updateUrl = false, }) {
        if (!fingerprint || typeof fingerprint !== "string") {
            console.error('PDFHistory.initialize: The "fingerprint" must be a non-empty string.');
            return;
        }
        // Ensure that any old state is always reset upon initialization.
        if (this.#initialized) {
            this.reset();
        }
        const reInitialized = this.#fingerprint !== "" &&
            this.#fingerprint !== fingerprint;
        this.#fingerprint = fingerprint;
        this.#updateUrl = updateUrl === true;
        this.#initialized = true;
        this.#bindEvents();
        const state = window.history.state;
        this._popStateInProgress = false;
        this.#blockHashChange = 0;
        this._currentHash = getCurrentHash();
        this.#numPositionUpdates = 0;
        this.#uid = this.#maxUid = 0;
        this.#destination = undefined;
        this.#position = undefined;
        if (!this.#isValidState(state, /* checkReload = */ true) || resetHistory) {
            const { hash, page, rotation } = this.#parseCurrentHash(
            /* checkNameddest = */ true);
            if (!hash || reInitialized || resetHistory) {
                // Ensure that the browser history is reset on PDF document load.
                this.#pushOrReplaceState(undefined, /* forceReplace = */ true);
                return;
            }
            // Ensure that the browser history is initialized correctly when
            // the document hash is present on PDF document load.
            this.#pushOrReplaceState({ hash, page, rotation }, 
            /* forceReplace = */ true);
            return;
        }
        // The browser history contains a valid entry, ensure that the history is
        // initialized correctly on PDF document load.
        const destination = state.destination;
        this.#updateInternalState(destination, state.uid, 
        /* removeTemporary = */ true);
        if (destination.rotation !== undefined) {
            this.#initialRotation = destination.rotation;
        }
        if (destination.dest) {
            this.#initialBookmark = JSON.stringify(destination.dest);
            // If the history is updated, e.g. through the user changing the hash,
            // before the initial destination has become visible, then we do *not*
            // want to potentially add `this.#position` to the browser history.
            this.#destination.page = undefined;
        }
        else if (destination.hash) {
            this.#initialBookmark = destination.hash;
        }
        else if (destination.page) {
            // Fallback case; shouldn't be necessary, but better safe than sorry.
            this.#initialBookmark = `page=${destination.page}`;
        }
    }
    /**
     * Reset the current `PDFHistory` instance, and consequently prevent any
     * further updates and/or navigation of the browser history.
     */
    reset() {
        if (this.#initialized) {
            this.#pageHide(); // Simulate a 'pagehide' event when resetting.
            this.#initialized = false;
            this.#unbindEvents();
        }
        if (this.#updateViewareaTimeout) {
            clearTimeout(this.#updateViewareaTimeout);
            this.#updateViewareaTimeout = undefined;
        }
        this.#initialBookmark = null;
        this.#initialRotation = undefined;
    }
    /**
     * Push an internal destination to the browser history.
     */
    push({ namedDest, explicitDest, pageNumber, }) {
        if (!this.#initialized) {
            return;
        }
        if (namedDest && typeof namedDest !== "string") {
            console.error(`PDFHistory.push: "${namedDest}" is not a valid namedDest parameter.`);
            return;
        }
        else if (!Array.isArray(explicitDest)) {
            console.error(`PDFHistory.push: "${explicitDest}" is not a valid explicitDest parameter.`);
            return;
        }
        else if (!this.#isValidPage(pageNumber)) {
            // Allow an unset `pageNumber` if and only if the history is still empty;
            // please refer to the `this.#destination.page = null;` comment above.
            if (pageNumber !== undefined || this.#destination) {
                console.error(`PDFHistory.push: "${pageNumber}" is not a valid pageNumber parameter.`);
                return;
            }
        }
        const hash = namedDest || JSON.stringify(explicitDest);
        if (!hash) {
            // The hash *should* never be undefined, but if that were to occur,
            // avoid any possible issues by not updating the browser history.
            return;
        }
        let forceReplace = false;
        if (this.#destination &&
            (isDestHashesEqual(this.#destination.hash, hash) ||
                isDestArraysEqual(this.#destination.dest, explicitDest))) {
            // When the new destination is identical to `this.#destination`, and
            // its `page` is undefined, replace the current browser history entry.
            // NOTE: This can only occur if `this.#destination` was set either:
            //  - through the document hash being specified on load.
            //  - through the user changing the hash of the document.
            if (this.#destination.page) {
                return;
            }
            forceReplace = true;
        }
        if (this._popStateInProgress && !forceReplace) {
            return;
        }
        this.#pushOrReplaceState({
            dest: explicitDest,
            hash,
            page: pageNumber,
            rotation: this.linkService.rotation,
        }, forceReplace);
        if (!this._popStateInProgress) {
            // Prevent the browser history from updating while the new destination is
            // being scrolled into view, to avoid potentially inconsistent state.
            this._popStateInProgress = true;
            // We defer the resetting of `this._popStateInProgress`, to account for
            // e.g. zooming occurring when the new destination is being navigated to.
            Promise.resolve().then(() => {
                this._popStateInProgress = false;
            });
        }
    }
    /**
     * Push a page to the browser history; generally the `push` method should be
     * used instead.
     */
    pushPage(pageNumber) {
        if (!this.#initialized) {
            return;
        }
        if (!this.#isValidPage(pageNumber)) {
            console.error(`PDFHistory.pushPage: "${pageNumber}" is not a valid page number.`);
            return;
        }
        if (this.#destination?.page === pageNumber) {
            // When the new page is identical to the one in `this._destination`, we
            // don't want to add a potential duplicate entry in the browser history.
            return;
        }
        if (this._popStateInProgress) {
            return;
        }
        this.#pushOrReplaceState({
            // Simulate an internal destination, for `this._tryPushCurrentPosition`:
            // dest: null,
            hash: `page=${pageNumber}`,
            page: pageNumber,
            rotation: this.linkService.rotation,
        });
        if (!this._popStateInProgress) {
            // Prevent the browser history from updating while the new page is
            // being scrolled into view, to avoid potentially inconsistent state.
            this._popStateInProgress = true;
            // We defer the resetting of `this._popStateInProgress`, to account for
            // e.g. zooming occurring when the new page is being navigated to.
            Promise.resolve().then(() => {
                this._popStateInProgress = false;
            });
        }
    }
    /**
     * Push the current position to the browser history.
     */
    pushCurrentPosition() {
        if (!this.#initialized || this._popStateInProgress) {
            return;
        }
        this.#tryPushCurrentPosition();
    }
    /**
     * Go back one step in the browser history.
     * NOTE: Avoids navigating away from the document, useful for "named actions".
     */
    back() {
        if (!this.#initialized || this._popStateInProgress) {
            return;
        }
        const state = window.history.state;
        if (this.#isValidState(state) && state.uid > 0) {
            window.history.back();
        }
    }
    /**
     * Go forward one step in the browser history.
     * NOTE: Avoids navigating away from the document, useful for "named actions".
     */
    forward() {
        if (!this.#initialized || this._popStateInProgress) {
            return;
        }
        const state = window.history.state;
        if (this.#isValidState(state) && state.uid < this.#maxUid) {
            window.history.forward();
        }
    }
    /**
     * @return Indicating if the user is currently moving through the
     *   browser history, useful e.g. for skipping the next 'hashchange' event.
     */
    get popStateInProgress() {
        return (this.#initialized &&
            (this._popStateInProgress || this.#blockHashChange > 0));
    }
    #pushOrReplaceState(destination, forceReplace = false) {
        const shouldReplace = forceReplace || !this.#destination;
        const newState = {
            fingerprint: this.#fingerprint,
            uid: shouldReplace ? this.#uid : this.#uid + 1,
            destination,
        };
        /*#static*/ 
        this.#updateInternalState(destination, newState.uid);
        let newUrl;
        if (this.#updateUrl && destination?.hash) {
            const baseUrl = document.location.href.split("#")[0];
            // Prevent errors in Firefox.
            if (!baseUrl.startsWith("file://")) {
                newUrl = `${baseUrl}#${destination.hash}`;
            }
        }
        if (shouldReplace) {
            window.history.replaceState(newState, "", newUrl);
        }
        else {
            window.history.pushState(newState, "", newUrl);
        }
        /*#static*/ 
    }
    #tryPushCurrentPosition = (temporary = false) => {
        if (!this.#position) {
            return;
        }
        let position = this.#position;
        if (temporary) {
            position = Object.assign(Object.create(null), this.#position);
            position.temporary = true;
        }
        if (!this.#destination) {
            this.#pushOrReplaceState(position);
            return;
        }
        if (this.#destination.temporary) {
            // Always replace a previous *temporary* position.
            this.#pushOrReplaceState(position, /* forceReplace = */ true);
            return;
        }
        if (this.#destination.hash === position.hash) {
            // The current document position has not changed.
            return;
        }
        if (!this.#destination.page &&
            (POSITION_UPDATED_THRESHOLD <= 0 ||
                this.#numPositionUpdates <= POSITION_UPDATED_THRESHOLD)) {
            // `this.#destination` was set through the user changing the hash of
            // the document. Do not add `this.#position` to the browser history,
            // to avoid "flooding" it with lots of (nearly) identical entries,
            // since we cannot ensure that the document position has changed.
            return;
        }
        let forceReplace = false;
        if (this.#destination.page >= position.first &&
            this.#destination.page <= position.page) {
            // When the `page` of `this.#destination` is still visible, do not
            // update the browsing history when `this.#destination` either:
            //  - contains an internal destination, since in this case we
            //    cannot ensure that the document position has actually changed.
            //  - was set through the user changing the hash of the document.
            if (this.#destination.dest !== undefined || !this.#destination.first) {
                return;
            }
            // To avoid "flooding" the browser history, replace the current entry.
            forceReplace = true;
        }
        this.#pushOrReplaceState(position, forceReplace);
    };
    #isValidPage(val) {
        return (Number.isInteger(val) && val > 0 && val <= this.linkService.pagesCount);
    }
    #isValidState(state, checkReload = false) {
        if (!state) {
            return false;
        }
        if (state.fingerprint !== this.#fingerprint) {
            if (checkReload) {
                // Potentially accept the history entry, even if the fingerprints don't
                // match, when the viewer was reloaded (see issue 6847).
                if (typeof state.fingerprint !== "string" ||
                    state.fingerprint.length !== this.#fingerprint.length) {
                    return false;
                }
                const [perfEntry] = performance.getEntriesByType("navigation");
                if (perfEntry?.type !== "reload") {
                    return false;
                }
            } // This should only occur in viewers with support for opening more than
            // one PDF document, e.g. the GENERIC viewer.
            else {
                return false;
            }
        }
        if (!Number.isInteger(state.uid) || state.uid < 0) {
            return false;
        }
        if (!isObjectLike(state.destination)) {
            return false;
        }
        return true;
    }
    #updateInternalState(destination, uid, removeTemporary = false) {
        if (this.#updateViewareaTimeout) {
            // When updating `this.#destination`, make sure that we always wait for
            // the next 'updateviewarea' event before (potentially) attempting to
            // push the current position to the browser history.
            clearTimeout(this.#updateViewareaTimeout);
            this.#updateViewareaTimeout = undefined;
        }
        if (removeTemporary && destination?.temporary) {
            // When the `destination` comes from the browser history,
            // we no longer treat it as a *temporary* position.
            delete destination.temporary;
        }
        this.#destination = destination;
        this.#uid = uid;
        this.#maxUid = Math.max(this.#maxUid, uid);
        // This should always be reset when `this.#destination` is updated.
        this.#numPositionUpdates = 0;
    }
    #parseCurrentHash(checkNameddest = false) {
        const hash = unescape(getCurrentHash()).substring(1);
        const params = parseQueryString(hash);
        const nameddest = params.get("nameddest") || "";
        let page = +params.get("page") | 0;
        if (!this.#isValidPage(page) || (checkNameddest && nameddest.length > 0)) {
            page = undefined;
        }
        return { hash, page, rotation: this.linkService.rotation };
    }
    #updateViewarea = ({ location }) => {
        if (this.#updateViewareaTimeout) {
            clearTimeout(this.#updateViewareaTimeout);
            this.#updateViewareaTimeout = undefined;
        }
        this.#position = {
            hash: location.pdfOpenParams.substring(1),
            page: this.linkService.page,
            first: location.pageNumber,
            rotation: location.rotation,
        };
        if (this._popStateInProgress) {
            return;
        }
        if (POSITION_UPDATED_THRESHOLD > 0 &&
            this._isPagesLoaded &&
            this.#destination &&
            !this.#destination.page) {
            // If the current destination was set through the user changing the hash
            // of the document, we will usually not try to push the current position
            // to the browser history; see `this.#tryPushCurrentPosition()`.
            //
            // To prevent `this.#tryPushCurrentPosition()` from effectively being
            // reduced to a no-op in this case, we will assume that the position
            // *did* in fact change if the 'updateviewarea' event was dispatched
            // more than `POSITION_UPDATED_THRESHOLD` times.
            this.#numPositionUpdates++;
        }
        if (UPDATE_VIEWAREA_TIMEOUT > 0) {
            // When closing the browser, a 'pagehide' event will be dispatched which
            // *should* allow us to push the current position to the browser history.
            // In practice, it seems that the event is arriving too late in order for
            // the session history to be successfully updated.
            // (For additional details, please refer to the discussion in
            //  https://bugzilla.mozilla.org/show_bug.cgi?id=1153393.)
            //
            // To workaround this we attempt to *temporarily* add the current position
            // to the browser history only when the viewer is *idle*,
            // i.e. when scrolling and/or zooming does not occur.
            //
            // PLEASE NOTE: It's absolutely imperative that the browser history is
            // *not* updated too often, since that would render the viewer more or
            // less unusable. Hence the use of a timeout to delay the update until
            // the viewer has been idle for `UPDATE_VIEWAREA_TIMEOUT` milliseconds.
            this.#updateViewareaTimeout = setTimeout(() => {
                if (!this._popStateInProgress) {
                    this.#tryPushCurrentPosition(/* temporary = */ true);
                }
                this.#updateViewareaTimeout = undefined;
            }, UPDATE_VIEWAREA_TIMEOUT);
        }
    };
    #popState = ({ state }) => {
        const newHash = getCurrentHash(), hashChanged = this._currentHash !== newHash;
        this._currentHash = newHash;
        if (CHROME && state?.chromecomState && !this.#isValidState(state) || !state) {
            // This case corresponds to the user changing the hash of the document.
            this.#uid++;
            const { hash, page, rotation } = this.#parseCurrentHash();
            this.#pushOrReplaceState({ hash, page, rotation }, 
            /* forceReplace = */ true);
            return;
        }
        if (!this.#isValidState(state)) {
            // This should only occur in viewers with support for opening more than
            // one PDF document, e.g. the GENERIC viewer.
            return;
        }
        // Prevent the browser history from updating until the new destination,
        // as stored in the browser history, has been scrolled into view.
        this._popStateInProgress = true;
        if (hashChanged) {
            // When the hash changed, implying that the 'popstate' event will be
            // followed by a 'hashchange' event, then we do *not* want to update the
            // browser history when handling the 'hashchange' event (in web/app.js)
            // since that would *overwrite* the new destination navigated to below.
            //
            // To avoid accidentally disabling all future user-initiated hash changes,
            // if there's e.g. another 'hashchange' listener that stops the event
            // propagation, we make sure to always force-reset `this.#blockHashChange`
            // after `HASH_CHANGE_TIMEOUT` milliseconds have passed.
            this.#blockHashChange++;
            waitOnEventOrTimeout({
                target: window,
                name: "hashchange",
                delay: HASH_CHANGE_TIMEOUT,
            }).then(() => {
                this.#blockHashChange--;
            });
        }
        // Navigate to the new destination.
        const destination = state.destination;
        this.#updateInternalState(destination, state.uid, 
        /* removeTemporary = */ true);
        if (isValidRotation(destination.rotation)) {
            this.linkService.rotation = destination.rotation;
        }
        if (destination.dest) {
            this.linkService.goToDestination(destination.dest);
        }
        else if (destination.hash) {
            this.linkService.setHash(destination.hash);
        }
        else if (destination.page) {
            // Fallback case; shouldn't be necessary, but better safe than sorry.
            this.linkService.page = destination.page;
        }
        // Since `PDFLinkService.goToDestination` is asynchronous, we thus defer the
        // resetting of `this._popStateInProgress` slightly.
        Promise.resolve().then(() => {
            this._popStateInProgress = false;
        });
    };
    #pageHide = () => {
        // Attempt to push the `this.#position` into the browser history when
        // navigating away from the document. This is *only* done if the history
        // is empty/temporary, since otherwise an existing browser history entry
        // will end up being overwritten (given that new entries cannot be pushed
        // into the browser history when the 'unload' event has already fired).
        if (!this.#destination || this.#destination.temporary) {
            this.#tryPushCurrentPosition();
        }
    };
    #bindEvents = () => {
        if (this._boundEvents) {
            // The event listeners were already added.
            return;
        }
        this._boundEvents = {
            updateViewarea: this.#updateViewarea,
            popState: this.#popState,
            pageHide: this.#pageHide,
        };
        this.eventBus._on("updateviewarea", this._boundEvents.updateViewarea);
        window.on("popstate", this._boundEvents.popState);
        window.on("pagehide", this._boundEvents.pageHide);
    };
    #unbindEvents = () => {
        if (!this._boundEvents) {
            // The event listeners were already removed.
            return;
        }
        this.eventBus._off("updateviewarea", this._boundEvents.updateViewarea);
        window.off("popstate", this._boundEvents.popState);
        window.off("pagehide", this._boundEvents.pageHide);
        this._boundEvents = undefined;
    };
}
export function isDestHashesEqual(destHash, pushHash) {
    if (typeof destHash !== "string" || typeof pushHash !== "string") {
        return false;
    }
    if (destHash === pushHash) {
        return true;
    }
    const nameddest = parseQueryString(destHash).get("nameddest");
    if (nameddest === pushHash) {
        return true;
    }
    return false;
}
export function isDestArraysEqual(firstDest, secondDest) {
    function isEntryEqual(first, second) {
        if (typeof first !== typeof second) {
            return false;
        }
        if (Array.isArray(first) || Array.isArray(second)) {
            return false;
        }
        if (isObjectLike(first) && second !== null) {
            if (Object.keys(first).length !== Object.keys(second).length) {
                return false;
            }
            for (const key in first) {
                if (!isEntryEqual(first[key], second[key])) {
                    return false;
                }
            }
            return true;
        }
        return first === second || (Number.isNaN(first) && Number.isNaN(second));
    }
    if (!(Array.isArray(firstDest) && Array.isArray(secondDest))) {
        return false;
    }
    if (firstDest.length !== secondDest.length) {
        return false;
    }
    for (let i = 0, ii = firstDest.length; i < ii; i++) {
        if (!isEntryEqual(firstDest[i], secondDest[i])) {
            return false;
        }
    }
    return true;
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=pdf_history.js.map