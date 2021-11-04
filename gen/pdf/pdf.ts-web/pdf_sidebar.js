/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
 */
import { RenderingStates } from "./pdf_rendering_queue.js";
/*81---------------------------------------------------------------------------*/
const UI_NOTIFICATION_CLASS = "pdfSidebarNotification";
export class PDFSidebar {
    isOpen = false;
    active = 1 /* THUMBS */;
    isInitialViewSet = false;
    /**
     * Callback used when the sidebar has been opened/closed, to ensure that
     * the viewers (PDFViewer/PDFThumbnailViewer) are updated correctly.
     */
    onToggled;
    pdfViewer;
    pdfThumbnailViewer;
    outerContainer;
    viewerContainer;
    toggleButton;
    thumbnailButton;
    outlineButton;
    attachmentsButton;
    layersButton;
    thumbnailView;
    outlineView;
    attachmentsView;
    layersView;
    _outlineOptionsContainer;
    _currentOutlineItemButton;
    eventBus;
    l10n;
    constructor({ elements, pdfViewer, pdfThumbnailViewer, eventBus, l10n, }) {
        this.pdfViewer = pdfViewer;
        this.pdfThumbnailViewer = pdfThumbnailViewer;
        this.outerContainer = elements.outerContainer;
        this.viewerContainer = elements.viewerContainer;
        this.toggleButton = elements.toggleButton;
        this.thumbnailButton = elements.thumbnailButton;
        this.outlineButton = elements.outlineButton;
        this.attachmentsButton = elements.attachmentsButton;
        this.layersButton = elements.layersButton;
        this.thumbnailView = elements.thumbnailView;
        this.outlineView = elements.outlineView;
        this.attachmentsView = elements.attachmentsView;
        this.layersView = elements.layersView;
        this._outlineOptionsContainer = elements.outlineOptionsContainer;
        this._currentOutlineItemButton = elements.currentOutlineItemButton;
        this.eventBus = eventBus;
        this.l10n = l10n;
        this.#addEventListeners();
    }
    reset() {
        this.isInitialViewSet = false;
        this.#hideUINotification(/* reset = */ true);
        this.switchView(1 /* THUMBS */);
        this.outlineButton.disabled = false;
        this.attachmentsButton.disabled = false;
        this.layersButton.disabled = false;
        this._currentOutlineItemButton.disabled = true;
    }
    /**
     * @return One of the values in {SidebarView}.
     */
    get visibleView() {
        return this.isOpen ? this.active : 0 /* NONE */;
    }
    get isThumbnailViewVisible() {
        return this.isOpen && this.active === 1 /* THUMBS */;
    }
    get isOutlineViewVisible() {
        return this.isOpen && this.active === 2 /* OUTLINE */;
    }
    get isAttachmentsViewVisible() {
        return this.isOpen && this.active === 3 /* ATTACHMENTS */;
    }
    get isLayersViewVisible() {
        return this.isOpen && this.active === 4 /* LAYERS */;
    }
    /**
     * @param view The sidebar view that should become visible,
     *  must be one of the values in {SidebarView}.
     */
    setInitialView(view = 0 /* NONE */) {
        if (this.isInitialViewSet)
            return;
        this.isInitialViewSet = true;
        // If the user has already manually opened the sidebar, immediately closing
        // it would be bad UX; also ignore the "unknown" sidebar view value.
        if (view === 0 /* NONE */ || view === -1 /* UNKNOWN */) {
            this._dispatchEvent();
            return;
        }
        // Prevent dispatching two back-to-back `sidebarviewchanged` events,
        // since `this.#switchView` dispatched the event if the view changed.
        if (!this.#switchView(view, /* forceOpen */ true)) {
            this._dispatchEvent();
        }
    }
    /**
     * @param view - The sidebar view that should be switched to,
     *  must be one of the values in {SidebarView}.
     * @param forceOpen - Ensure that the sidebar is open. The default value is `false`.
     */
    switchView(view, forceOpen = false) {
        this.#switchView(view, forceOpen);
    }
    /**
     * @return Indicating if `this._dispatchEvent` was called.
     */
    #switchView(view, forceOpen = false) {
        const isViewChanged = view !== this.active;
        let shouldForceRendering = false;
        switch (view) {
            case 0 /* NONE */:
                if (this.isOpen) {
                    this.close();
                    return true; // Closing will trigger rendering and dispatch the event.
                }
                return false;
            case 1 /* THUMBS */:
                if (this.isOpen && isViewChanged) {
                    shouldForceRendering = true;
                }
                break;
            case 2 /* OUTLINE */:
                if (this.outlineButton.disabled) {
                    return false;
                }
                break;
            case 3 /* ATTACHMENTS */:
                if (this.attachmentsButton.disabled) {
                    return false;
                }
                break;
            case 4 /* LAYERS */:
                if (this.layersButton.disabled) {
                    return false;
                }
                break;
            default:
                console.error(`PDFSidebar.#switchView: "${view}" is not a valid view.`);
                return false;
        }
        // Update the active view *after* it has been validated above,
        // in order to prevent setting it to an invalid state.
        this.active = view;
        // Update the CSS classes, for all buttons...
        this.thumbnailButton.classList.toggle("toggled", view === 1 /* THUMBS */);
        this.outlineButton.classList.toggle("toggled", view === 2 /* OUTLINE */);
        this.attachmentsButton.classList.toggle("toggled", view === 3 /* ATTACHMENTS */);
        this.layersButton.classList.toggle("toggled", view === 4 /* LAYERS */);
        // ... and for all views.
        this.thumbnailView.classList.toggle("hidden", view !== 1 /* THUMBS */);
        this.outlineView.classList.toggle("hidden", view !== 2 /* OUTLINE */);
        this.attachmentsView.classList.toggle("hidden", view !== 3 /* ATTACHMENTS */);
        this.layersView.classList.toggle("hidden", view !== 4 /* LAYERS */);
        // Finally, update view-specific CSS classes.
        this._outlineOptionsContainer.classList.toggle("hidden", view !== 2 /* OUTLINE */);
        if (forceOpen && !this.isOpen) {
            this.open();
            return true; // Opening will trigger rendering and dispatch the event.
        }
        if (shouldForceRendering) {
            this.#updateThumbnailViewer();
            this.#forceRendering();
        }
        if (isViewChanged) {
            this._dispatchEvent();
        }
        return isViewChanged;
    }
    open() {
        if (this.isOpen)
            return;
        this.isOpen = true;
        this.toggleButton.classList.add("toggled");
        this.toggleButton.setAttribute("aria-expanded", "true");
        this.outerContainer.classList.add("sidebarMoving", "sidebarOpen");
        if (this.active === 1 /* THUMBS */) {
            this.#updateThumbnailViewer();
        }
        this.#forceRendering();
        this._dispatchEvent();
        this.#hideUINotification();
    }
    close() {
        if (!this.isOpen)
            return;
        this.isOpen = false;
        this.toggleButton.classList.remove("toggled");
        this.toggleButton.setAttribute("aria-expanded", "false");
        this.outerContainer.classList.add("sidebarMoving");
        this.outerContainer.classList.remove("sidebarOpen");
        this.#forceRendering();
        this._dispatchEvent();
    }
    toggle() {
        if (this.isOpen) {
            this.close();
        }
        else {
            this.open();
        }
    }
    _dispatchEvent() {
        this.eventBus.dispatch("sidebarviewchanged", {
            source: this,
            view: this.visibleView,
        });
    }
    #forceRendering() {
        if (this.onToggled) {
            this.onToggled();
        }
        else {
            // Fallback
            this.pdfViewer.forceRendering();
            this.pdfThumbnailViewer.forceRendering();
        }
    }
    #updateThumbnailViewer = () => {
        const { pdfViewer, pdfThumbnailViewer } = this;
        // Use the rendered pages to set the corresponding thumbnail images.
        const pagesCount = pdfViewer.pagesCount;
        for (let pageIndex = 0; pageIndex < pagesCount; pageIndex++) {
            const pageView = pdfViewer.getPageView(pageIndex);
            if (pageView?.renderingState === RenderingStates.FINISHED) {
                const thumbnailView = pdfThumbnailViewer.getThumbnail(pageIndex);
                thumbnailView.setImage(pageView);
            }
        }
        pdfThumbnailViewer.scrollThumbnailIntoView(pdfViewer.currentPageNumber);
    };
    #showUINotification = () => {
        this.l10n.get("toggle_sidebar_notification2.title").then(msg => {
            this.toggleButton.title = msg;
        });
        if (!this.isOpen) {
            // Only show the notification on the `toggleButton` if the sidebar is
            // currently closed, to avoid unnecessarily bothering the user.
            this.toggleButton.classList.add(UI_NOTIFICATION_CLASS);
        }
    };
    #hideUINotification(reset = false) {
        if (this.isOpen || reset) {
            // Only hide the notification on the `toggleButton` if the sidebar is
            // currently open, or when the current PDF document is being closed.
            this.toggleButton.classList.remove(UI_NOTIFICATION_CLASS);
        }
        if (reset) {
            this.l10n.get("toggle_sidebar.title").then(msg => {
                this.toggleButton.title = msg;
            });
        }
    }
    #addEventListeners = () => {
        this.viewerContainer.addEventListener("transitionend", evt => {
            if (evt.target === this.viewerContainer) {
                this.outerContainer.classList.remove("sidebarMoving");
            }
        });
        this.toggleButton.addEventListener("click", () => {
            this.toggle();
        });
        // Buttons for switching views.
        this.thumbnailButton.addEventListener("click", () => {
            this.switchView(1 /* THUMBS */);
        });
        this.outlineButton.addEventListener("click", () => {
            this.switchView(2 /* OUTLINE */);
        });
        this.outlineButton.addEventListener("dblclick", () => {
            this.eventBus.dispatch("toggleoutlinetree", { source: this });
        });
        this.attachmentsButton.addEventListener("click", () => {
            this.switchView(3 /* ATTACHMENTS */);
        });
        this.layersButton.addEventListener("click", () => {
            this.switchView(4 /* LAYERS */);
        });
        this.layersButton.addEventListener("dblclick", () => {
            this.eventBus.dispatch("resetlayers", { source: this });
        });
        // Buttons for view-specific options.
        this._currentOutlineItemButton.addEventListener("click", () => {
            this.eventBus.dispatch("currentoutlineitem", { source: this });
        });
        // Disable/enable views.
        const onTreeLoaded = (count, button, view) => {
            button.disabled = !count;
            if (count) {
                this.#showUINotification();
            }
            else if (this.active === view) {
                // If the `view` was opened by the user during document load,
                // switch away from it if it turns out to be empty.
                this.switchView(1 /* THUMBS */);
            }
        };
        this.eventBus._on("outlineloaded", evt => {
            onTreeLoaded(evt.outlineCount, this.outlineButton, 2 /* OUTLINE */);
            evt.currentOutlineItemPromise.then(enabled => {
                if (!this.isInitialViewSet) {
                    return;
                }
                this._currentOutlineItemButton.disabled = !enabled;
            });
        });
        this.eventBus._on("attachmentsloaded", evt => {
            onTreeLoaded(evt.attachmentsCount, this.attachmentsButton, 3 /* ATTACHMENTS */);
        });
        this.eventBus._on("layersloaded", evt => {
            onTreeLoaded(evt.layersCount, this.layersButton, 4 /* LAYERS */);
        });
        // Update the thumbnailViewer, if visible, when exiting presentation mode.
        this.eventBus._on("presentationmodechanged", evt => {
            if (evt.state === 1 /* NORMAL */ &&
                this.isThumbnailViewVisible) {
                this.#updateThumbnailViewer();
            }
        });
    };
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=pdf_sidebar.js.map