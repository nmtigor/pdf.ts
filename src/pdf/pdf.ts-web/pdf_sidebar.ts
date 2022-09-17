/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

/* Copyright 2016 Mozilla Foundation
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

import { EventBus } from "./event_utils.ts";
import { type IL10n } from "./interfaces.ts";
import { PDFThumbnailViewer } from "./pdf_thumbnail_viewer.ts";
import { PDFViewer } from "./pdf_viewer.ts";
import {
  PresentationModeState,
  RenderingStates,
  SidebarView,
} from "./ui_utils.ts";
import { type ViewerConfiguration } from "./viewer.ts";
/*80--------------------------------------------------------------------------*/

const UI_NOTIFICATION_CLASS = "pdfSidebarNotification";

interface PDFSidebarOptions {
  /**
   * The DOM elements.
   */
  elements: ViewerConfiguration["sidebar"];

  /**
   * The document viewer.
   */
  pdfViewer: PDFViewer;

  /**
   * The thumbnail viewer.
   */
  pdfThumbnailViewer: PDFThumbnailViewer;

  /**
   * The application event bus.
   */
  eventBus: EventBus;

  /**
   * The localization service.
   */
  l10n: IL10n;
}

export class PDFSidebar {
  isOpen = false;
  active = SidebarView.THUMBS;
  isInitialViewSet = false;
  isInitialEventDispatched = false;

  /**
   * Callback used when the sidebar has been opened/closed, to ensure that
   * the viewers (PDFViewer/PDFThumbnailViewer) are updated correctly.
   */
  onToggled?: () => void;

  pdfViewer;
  pdfThumbnailViewer;

  outerContainer;
  sidebarContainer;
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

  constructor({
    elements,
    pdfViewer,
    pdfThumbnailViewer,
    eventBus,
    l10n,
  }: PDFSidebarOptions) {
    this.pdfViewer = pdfViewer;
    this.pdfThumbnailViewer = pdfThumbnailViewer;

    this.outerContainer = elements.outerContainer;
    this.sidebarContainer = elements.sidebarContainer;
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
  get visibleView(): number {
    return this.isOpen ? this.active : SidebarView.NONE;
  }

  /**
   * @param view The sidebar view that should become visible,
   *  must be one of the values in {SidebarView}.
   */
  setInitialView(view = SidebarView.NONE) {
    if (this.isInitialViewSet) return;

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
  switchView(view: number, forceOpen = false) {
    const isViewChanged = view !== this.active;
    let shouldForceRendering = false;

    switch (view) {
      case SidebarView.NONE:
        if (this.isOpen) {
          this.close();
        }
        return undefined; // Closing will trigger rendering and dispatch the event.
      case SidebarView.THUMBS:
        if (this.isOpen && isViewChanged) {
          shouldForceRendering = true;
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

    const isThumbs = view === SidebarView.THUMBS,
      isOutline = view === SidebarView.OUTLINE,
      isAttachments = view === SidebarView.ATTACHMENTS,
      isLayers = view === SidebarView.LAYERS;

    // Update the CSS classes (and aria attributes), for all buttons...
    this.thumbnailButton.classList.toggle("toggled", isThumbs);
    this.outlineButton.classList.toggle("toggled", isOutline);
    this.attachmentsButton.classList.toggle("toggled", isAttachments);
    this.layersButton.classList.toggle("toggled", isLayers);

    this.thumbnailButton.setAttribute("aria-checked", <any> isThumbs);
    this.outlineButton.setAttribute("aria-checked", <any> isOutline);
    this.attachmentsButton.setAttribute("aria-checked", <any> isAttachments);
    this.layersButton.setAttribute("aria-checked", <any> isLayers);
    // ... and for all views.
    this.thumbnailView.classList.toggle("hidden", !isThumbs);
    this.outlineView.classList.toggle("hidden", !isOutline);
    this.attachmentsView.classList.toggle("hidden", !isAttachments);
    this.layersView.classList.toggle("hidden", !isLayers);

    // Finally, update view-specific CSS classes.
    this._outlineOptionsContainer.classList.toggle("hidden", !isOutline);

    if (forceOpen && !this.isOpen) {
      this.open();
      return undefined; // Opening will trigger rendering and dispatch the event.
    }
    if (shouldForceRendering) {
      this.#updateThumbnailViewer();
      this.#forceRendering();
    }
    if (isViewChanged) {
      this.#dispatchEvent();
    }
    return undefined;
  }

  open() {
    if (this.isOpen) {
      return;
    }
    this.isOpen = true;
    this.toggleButton.classList.add("toggled");
    this.toggleButton.setAttribute("aria-expanded", "true");

    this.outerContainer.classList.add("sidebarMoving", "sidebarOpen");

    if (this.active === SidebarView.THUMBS) {
      this.#updateThumbnailViewer();
    }
    this.#forceRendering();
    this.#dispatchEvent();

    this.#hideUINotification();
  }

  close() {
    if (!this.isOpen) {
      return;
    }
    this.isOpen = false;
    this.toggleButton.classList.remove("toggled");
    this.toggleButton.setAttribute("aria-expanded", "false");

    this.outerContainer.classList.add("sidebarMoving");
    this.outerContainer.classList.remove("sidebarOpen");

    this.#forceRendering();
    this.#dispatchEvent();
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  #dispatchEvent() {
    this.eventBus.dispatch("sidebarviewchanged", {
      source: this,
      view: this.visibleView,
    });
  }

  #forceRendering() {
    if (this.onToggled) {
      this.onToggled();
    } else {
      // Fallback
      this.pdfViewer.forceRendering();
      this.pdfThumbnailViewer.forceRendering();
    }
  }

  #updateThumbnailViewer() {
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
  }

  #showUINotification() {
    this.l10n.get("toggle_sidebar_notification2.title").then((msg) => {
      this.toggleButton.title = msg;
    });

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
      this.l10n.get("toggle_sidebar.title").then((msg) => {
        this.toggleButton.title = msg;
      });
    }
  }

  #addEventListeners() {
    this.sidebarContainer.addEventListener("transitionend", (evt) => {
      if (evt.target === this.sidebarContainer) {
        this.outerContainer.classList.remove("sidebarMoving");
      }
    });

    this.toggleButton.addEventListener("click", () => {
      this.toggle();
    });

    // Buttons for switching views.
    this.thumbnailButton.addEventListener("click", () => {
      this.switchView(SidebarView.THUMBS);
    });

    this.outlineButton.addEventListener("click", () => {
      this.switchView(SidebarView.OUTLINE);
    });
    this.outlineButton.addEventListener("dblclick", () => {
      this.eventBus.dispatch("toggleoutlinetree", { source: this });
    });

    this.attachmentsButton.addEventListener("click", () => {
      this.switchView(SidebarView.ATTACHMENTS);
    });

    this.layersButton.addEventListener("click", () => {
      this.switchView(SidebarView.LAYERS);
    });
    this.layersButton.addEventListener("dblclick", () => {
      this.eventBus.dispatch("resetlayers", { source: this });
    });

    // Buttons for view-specific options.
    this._currentOutlineItemButton.addEventListener("click", () => {
      this.eventBus.dispatch("currentoutlineitem", { source: this });
    });

    // Disable/enable views.
    const onTreeLoaded = (
      count: number,
      button: HTMLButtonElement,
      view: SidebarView,
    ) => {
      button.disabled = !count;

      if (count) {
        this.#showUINotification();
      } else if (this.active === view) {
        // If the `view` was opened by the user during document load,
        // switch away from it if it turns out to be empty.
        this.switchView(SidebarView.THUMBS);
      }
    };

    this.eventBus._on("outlineloaded", (evt) => {
      onTreeLoaded(evt.outlineCount, this.outlineButton, SidebarView.OUTLINE);

      evt.currentOutlineItemPromise.then((enabled) => {
        if (!this.isInitialViewSet) return;

        this._currentOutlineItemButton.disabled = !enabled;
      });
    });

    this.eventBus._on("attachmentsloaded", (evt) => {
      onTreeLoaded(
        evt.attachmentsCount,
        this.attachmentsButton,
        SidebarView.ATTACHMENTS,
      );
    });

    this.eventBus._on("layersloaded", (evt) => {
      onTreeLoaded(evt.layersCount, this.layersButton, SidebarView.LAYERS);
    });

    // Update the thumbnailViewer, if visible, when exiting presentation mode.
    this.eventBus._on("presentationmodechanged", (evt) => {
      if (
        evt.state === PresentationModeState.NORMAL &&
        this.visibleView === SidebarView.THUMBS
      ) {
        this.#updateThumbnailViewer();
      }
    });
  }
}
/*80--------------------------------------------------------------------------*/
