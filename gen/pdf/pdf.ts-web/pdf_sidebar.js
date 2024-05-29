/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/pdf_sidebar.ts
 * @license Apache-2.0
 ******************************************************************************/
import { docStyle, PresentationModeState, SidebarView, toggleCheckedBtn, toggleExpandedBtn, } from "./ui_utils.js";
/*80--------------------------------------------------------------------------*/
const SIDEBAR_WIDTH_VAR = "--sidebar-width";
const SIDEBAR_MIN_WIDTH = 200; // pixels
const SIDEBAR_RESIZING_CLASS = "sidebarResizing";
const UI_NOTIFICATION_CLASS = "pdfSidebarNotification";
export class PDFSidebar {
    #isRTL = false;
    #outerContainerWidth;
    #width;
    isOpen = false;
    active = SidebarView.THUMBS;
    isInitialViewSet = false;
    isInitialEventDispatched = false;
    /**
     * Callback used when the sidebar has been opened/closed, to ensure that
     * the viewers (PDFViewer/PDFThumbnailViewer) are updated correctly.
     */
    onToggled;
    onUpdateThumbnails;
    outerContainer;
    sidebarContainer;
    toggleButton;
    resizer;
    thumbnailButton;
    outlineButton;
    attachmentsButton;
    layersButton;
    thumbnailView;
    outlineView;
    attachmentsView;
    layersView;
    _currentOutlineItemButton;
    eventBus;
    constructor({ elements, eventBus, l10n, }) {
        this.outerContainer = elements.outerContainer;
        this.sidebarContainer = elements.sidebarContainer;
        this.toggleButton = elements.toggleButton;
        this.resizer = elements.resizer;
        this.thumbnailButton = elements.thumbnailButton;
        this.outlineButton = elements.outlineButton;
        this.attachmentsButton = elements.attachmentsButton;
        this.layersButton = elements.layersButton;
        this.thumbnailView = elements.thumbnailView;
        this.outlineView = elements.outlineView;
        this.attachmentsView = elements.attachmentsView;
        this.layersView = elements.layersView;
        this._currentOutlineItemButton = elements.currentOutlineItemButton;
        this.eventBus = eventBus;
        this.#isRTL = l10n.getDirection() === "rtl";
        this.#addEventListeners();
    }
    reset() {
        this.isInitialViewSet = false;
        this.isInitialEventDispatched = false;
        this.#hideUINotification(/* reset = */ true);
        this.switchView(SidebarView.THUMBS);
        this.outlineButton.disabled = false;
        this.attachmentsButton.disabled = false;
        this.layersButton.disabled = false;
        this._currentOutlineItemButton.disabled = true;
    }
    /**
     * @return One of the values in {SidebarView}.
     */
    get visibleView() {
        return this.isOpen ? this.active : SidebarView.NONE;
    }
    /**
     * @param view The sidebar view that should become visible,
     *  must be one of the values in {SidebarView}.
     */
    setInitialView(view = SidebarView.NONE) {
        if (this.isInitialViewSet)
            return;
        this.isInitialViewSet = true;
        // If the user has already manually opened the sidebar, immediately closing
        // it would be bad UX; also ignore the "unknown" sidebar view value.
        if (view === SidebarView.NONE || view === SidebarView.UNKNOWN) {
            this.#dispatchEvent();
            return;
        }
        this.switchView(view, /* forceOpen = */ true);
        // Prevent dispatching two back-to-back "sidebarviewchanged" events,
        // since `this.switchView` dispatched the event if the view changed.
        if (!this.isInitialEventDispatched) {
            this.#dispatchEvent();
        }
    }
    /**
     * @param view The sidebar view that should be switched to,
     *  must be one of the values in {SidebarView}.
     * @param forceOpen Ensure that the sidebar is open. The default value is `false`.
     */
    switchView(view, forceOpen = false) {
        const isViewChanged = view !== this.active;
        let forceRendering = false;
        switch (view) {
            case SidebarView.NONE:
                if (this.isOpen) {
                    this.close();
                }
                return undefined; // Closing will trigger rendering and dispatch the event.
            case SidebarView.THUMBS:
                if (this.isOpen && isViewChanged) {
                    forceRendering = true;
                }
                break;
            case SidebarView.OUTLINE:
                if (this.outlineButton.disabled) {
                    return false;
                }
                break;
            case SidebarView.ATTACHMENTS:
                if (this.attachmentsButton.disabled) {
                    return false;
                }
                break;
            case SidebarView.LAYERS:
                if (this.layersButton.disabled) {
                    return false;
                }
                break;
            default:
                console.error(`PDFSidebar.switchView: "${view}" is not a valid view.`);
                return undefined;
        }
        // Update the active view *after* it has been validated above,
        // in order to prevent setting it to an invalid state.
        this.active = view;
        // Update the CSS classes (and aria attributes), for all buttons and views.
        toggleCheckedBtn(this.thumbnailButton, view === SidebarView.THUMBS, this.thumbnailView);
        toggleCheckedBtn(this.outlineButton, view === SidebarView.OUTLINE, this.outlineView);
        toggleCheckedBtn(this.attachmentsButton, view === SidebarView.ATTACHMENTS, this.attachmentsView);
        toggleCheckedBtn(this.layersButton, view === SidebarView.LAYERS, this.layersView);
        if (forceOpen && !this.isOpen) {
            this.open();
            return; // Opening will trigger rendering and dispatch the event.
        }
        if (forceRendering) {
            this.onUpdateThumbnails();
            this.onToggled();
        }
        if (isViewChanged) {
            this.#dispatchEvent();
        }
        return;
    }
    open() {
        if (this.isOpen) {
            return;
        }
        this.isOpen = true;
        toggleExpandedBtn(this.toggleButton, true);
        this.outerContainer.classList.add("sidebarMoving", "sidebarOpen");
        if (this.active === SidebarView.THUMBS) {
            this.onUpdateThumbnails();
        }
        this.onToggled();
        this.#dispatchEvent();
        this.#hideUINotification();
    }
    close(evt) {
        if (!this.isOpen) {
            return;
        }
        this.isOpen = false;
        toggleExpandedBtn(this.toggleButton, false);
        this.outerContainer.classList.add("sidebarMoving");
        this.outerContainer.classList.remove("sidebarOpen");
        this.onToggled();
        this.#dispatchEvent();
        if (evt?.detail > 0) {
            // Remove focus from the toggleButton if it's clicked (see issue 17361).
            this.toggleButton.blur();
        }
    }
    toggle(evt) {
        if (this.isOpen) {
            this.close(evt);
        }
        else {
            this.open();
        }
    }
    #dispatchEvent() {
        if (this.isInitialViewSet) {
            this.isInitialEventDispatched ||= true;
        }
        this.eventBus.dispatch("sidebarviewchanged", {
            source: this,
            view: this.visibleView,
        });
    }
    #showUINotification() {
        this.toggleButton.setAttribute("data-l10n-id", "pdfjs-toggle-sidebar-notification-button");
        if (!this.isOpen) {
            // Only show the notification on the `toggleButton` if the sidebar is
            // currently closed, to avoid unnecessarily bothering the user.
            this.toggleButton.classList.add(UI_NOTIFICATION_CLASS);
        }
    }
    #hideUINotification(reset = false) {
        if (this.isOpen || reset) {
            // Only hide the notification on the `toggleButton` if the sidebar is
            // currently open, or when the current PDF document is being closed.
            this.toggleButton.classList.remove(UI_NOTIFICATION_CLASS);
        }
        if (reset) {
            this.toggleButton.setAttribute("data-l10n-id", "pdfjs-toggle-sidebar-button");
        }
    }
    #addEventListeners() {
        this.sidebarContainer.on("transitionend", (evt) => {
            if (evt.target === this.sidebarContainer) {
                this.outerContainer.classList.remove("sidebarMoving");
                // Ensure that rendering is triggered after opening/closing the sidebar.
                this.eventBus.dispatch("resize", { source: this });
            }
        });
        this.toggleButton.on("click", (evt) => {
            this.toggle(evt);
        });
        // Buttons for switching views.
        this.thumbnailButton.on("click", () => {
            this.switchView(SidebarView.THUMBS);
        });
        this.outlineButton.on("click", () => {
            this.switchView(SidebarView.OUTLINE);
        });
        this.outlineButton.on("dblclick", () => {
            this.eventBus.dispatch("toggleoutlinetree", { source: this });
        });
        this.attachmentsButton.on("click", () => {
            this.switchView(SidebarView.ATTACHMENTS);
        });
        this.layersButton.on("click", () => {
            this.switchView(SidebarView.LAYERS);
        });
        this.layersButton.on("dblclick", () => {
            this.eventBus.dispatch("resetlayers", { source: this });
        });
        // Buttons for view-specific options.
        this._currentOutlineItemButton.on("click", () => {
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
                this.switchView(SidebarView.THUMBS);
            }
        };
        this.eventBus._on("outlineloaded", (evt) => {
            onTreeLoaded(evt.outlineCount, this.outlineButton, SidebarView.OUTLINE);
            evt.currentOutlineItemPromise.then((enabled) => {
                if (!this.isInitialViewSet)
                    return;
                this._currentOutlineItemButton.disabled = !enabled;
            });
        });
        this.eventBus._on("attachmentsloaded", (evt) => {
            onTreeLoaded(evt.attachmentsCount, this.attachmentsButton, SidebarView.ATTACHMENTS);
        });
        this.eventBus._on("layersloaded", (evt) => {
            onTreeLoaded(evt.layersCount, this.layersButton, SidebarView.LAYERS);
        });
        // Update the thumbnailViewer, if visible, when exiting presentation mode.
        this.eventBus._on("presentationmodechanged", (evt) => {
            if (evt.state === PresentationModeState.NORMAL &&
                this.visibleView === SidebarView.THUMBS) {
                this.onUpdateThumbnails();
            }
        });
        // Handle resizing of the sidebar.
        this.resizer.on("mousedown", (evt) => {
            if (evt.button !== 0) {
                return;
            }
            // Disable the `transition-duration` rules when sidebar resizing begins,
            // in order to improve responsiveness and to avoid visual glitches.
            this.outerContainer.classList.add(SIDEBAR_RESIZING_CLASS);
            window.on("mousemove", this.#mouseMove);
            window.on("mouseup", this.#mouseUp);
        });
        this.eventBus._on("resize", (evt) => {
            // When the *entire* viewer is resized, such that it becomes narrower,
            // ensure that the sidebar doesn't end up being too wide.
            if (evt.source !== window) {
                return;
            }
            // Always reset the cached width when the viewer is resized.
            this.#outerContainerWidth = undefined;
            if (!this.#width) {
                // The sidebar hasn't been resized, hence no need to adjust its width.
                return;
            }
            // NOTE: If the sidebar is closed, we don't need to worry about
            //       visual glitches nor ensure that rendering is triggered.
            if (!this.isOpen) {
                this.#updateWidth(this.#width);
                return;
            }
            this.outerContainer.classList.add(SIDEBAR_RESIZING_CLASS);
            const updated = this.#updateWidth(this.#width);
            Promise.resolve().then(() => {
                this.outerContainer.classList.remove(SIDEBAR_RESIZING_CLASS);
                // Trigger rendering if the sidebar width changed, to avoid
                // depending on the order in which 'resize' events are handled.
                if (updated) {
                    this.eventBus.dispatch("resize", { source: this });
                }
            });
        });
    }
    get outerContainerWidth() {
        return (this.#outerContainerWidth ||= this.outerContainer.clientWidth);
    }
    /**
     * returns {boolean} Indicating if the sidebar width was updated.
     */
    #updateWidth(width = 0) {
        // Prevent the sidebar from becoming too narrow, or from occupying more
        // than half of the available viewer width.
        const maxWidth = Math.floor(this.outerContainerWidth / 2);
        if (width > maxWidth) {
            width = maxWidth;
        }
        if (width < SIDEBAR_MIN_WIDTH) {
            width = SIDEBAR_MIN_WIDTH;
        }
        // Only update the UI when the sidebar width did in fact change.
        if (width === this.#width) {
            return false;
        }
        this.#width = width;
        docStyle.setProperty(SIDEBAR_WIDTH_VAR, `${width}px`);
        return true;
    }
    #mouseMove = (evt) => {
        let width = evt.clientX;
        // For sidebar resizing to work correctly in RTL mode, invert the width.
        if (this.#isRTL) {
            width = this.outerContainerWidth - width;
        }
        this.#updateWidth(width);
    };
    #mouseUp = (evt) => {
        // Re-enable the `transition-duration` rules when sidebar resizing ends...
        this.outerContainer.classList.remove(SIDEBAR_RESIZING_CLASS);
        // ... and ensure that rendering will always be triggered.
        this.eventBus.dispatch("resize", { source: this });
        window.off("mousemove", this.#mouseMove);
        window.off("mouseup", this.#mouseUp);
    };
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=pdf_sidebar.js.map