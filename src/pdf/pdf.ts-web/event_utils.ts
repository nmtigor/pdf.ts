/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

/* Copyright 2012 Mozilla Foundation
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

import { MOZCENTRAL } from "../../global.ts";
import {
  AnnotationEditorParamsType,
  AnnotationEditorType,
  AnnotationEditorUIManager,
  AnnotationElement,
  DispatchUpdateStatesP,
  FileAttachmentAnnotationElement,
  OptionalContentConfig,
  PropertyToUpdate,
  ScriptingActionName,
} from "../pdf.ts-src/pdf.ts";
import { AnnotationEditorParams } from "./annotation_editor_params.ts";
import { ErrorMoreInfo, PDFViewerApplication } from "./app.ts";
import { PDFAttachmentViewer } from "./pdf_attachment_viewer.ts";
import { CursorTool, PDFCursorTools } from "./pdf_cursor_tools.ts";
import { PDFFindBar } from "./pdf_find_bar.ts";
import {
  FindCtrlState,
  FindState,
  MatchesCount,
  PDFFindController,
} from "./pdf_find_controller.ts";
import { PDFLayerViewer } from "./pdf_layer_viewer.ts";
import { PDFLinkService } from "./pdf_link_service.ts";
import { PDFOutlineViewer } from "./pdf_outline_viewer.ts";
import { PDFPageView } from "./pdf_page_view.ts";
import { PDFPresentationMode } from "./pdf_presentation_mode.ts";
import { PDFScriptingManager } from "./pdf_scripting_manager.ts";
import { PDFSidebar } from "./pdf_sidebar.ts";
import { PDFSidebarResizer } from "./pdf_sidebar_resizer.ts";
import { PDFLocation, PDFViewer } from "./pdf_viewer.ts";
import { SecondaryToolbar } from "./secondary_toolbar.ts";
import { TextLayerBuilder } from "./text_layer_builder.ts";
import { Toolbar } from "./toolbar.ts";
import {
  PageLayout,
  PresentationModeState,
  ScrollMode,
  SidebarView,
  SpreadMode,
} from "./ui_utils.ts";
/*80--------------------------------------------------------------------------*/

export const enum WaitOnType {
  EVENT = "event",
  TIMEOUT = "timeout",
}

interface _WaitOnEventOrTimeoutP {
  /**
   * The event target, can for example be:
   * `window`, `document`, a DOM element, or an {EventBus} instance.
   */
  target: EventBus | typeof window;

  /**
   * The name of the event.
   */
  name: EventName;

  /**
   * The delay, in milliseconds, after which the
   * timeout occurs (if the event wasn't already dispatched).
   */
  delay: number;
  // delay?:number;
}

/**
 * Allows waiting for an event or a timeout, whichever occurs first.
 * Can be used to ensure that an action always occurs, even when an event
 * arrives late or not at all.
 *
= * @return A promise that is resolved with a {WaitOnType} value.
 */
export function waitOnEventOrTimeout({
  target,
  name,
  delay = 0,
}: _WaitOnEventOrTimeoutP): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (
      typeof target !== "object" ||
      !(name && typeof name === "string") ||
      !(Number.isInteger(delay) && delay >= 0)
    ) {
      throw new Error("waitOnEventOrTimeout - invalid parameters.");
    }

    function handler(type: WaitOnType) {
      if (target instanceof EventBus) {
        target._off(name, eventHandler);
      } else {
        target.removeEventListener(name, eventHandler);
      }

      if (timeout) {
        clearTimeout(timeout);
      }
      resolve(type);
    }

    const eventHandler = handler.bind(null, WaitOnType.EVENT);
    if (target instanceof EventBus) {
      target._on(name, eventHandler);
    } else {
      target.addEventListener(name, eventHandler);
    }

    const timeoutHandler = handler.bind(null, WaitOnType.TIMEOUT);
    const timeout = setTimeout(timeoutHandler, delay);
  });
}
/*64----------------------------------------------------------*/

export interface EventMap {
  afterprint: {};
  annotationeditorlayerrendered: {
    source: PDFPageView;
    pageNumber: number;
    error: unknown;
  };
  annotationeditormodechanged: {
    source: PDFViewer;
    mode: AnnotationEditorType;
  };
  annotationeditorparamschanged: {
    source: AnnotationEditorUIManager;
    details: PropertyToUpdate[];
  };
  annotationeditorstateschanged: {
    source: AnnotationEditorUIManager;
    details: DispatchUpdateStatesP;
  };
  annotationlayerrendered: {
    source: PDFPageView;
    pageNumber: number;
    error: unknown | undefined;
  };
  attachmentsloaded: {
    source: PDFAttachmentViewer;
    attachmentsCount: number;
  };
  baseviewerinit: {
    source: PDFViewer;
  };
  beforeprint: {
    source: typeof window;
  };
  currentoutlineitem: {
    source: PDFSidebar;
  };
  cursortoolchanged: {
    source: PDFCursorTools;
    tool: CursorTool;
  };
  dispatcheventinsandbox: {
    source: AnnotationElement;
    detail: {
      id: string;
      ids?: string[];
      name: ScriptingActionName;

      value?: string | string[] | number | boolean | undefined;
      shift?: boolean;
      modifier?: boolean;

      willCommit?: boolean;
      commitKey?: number;
      selStart?: number | null;
      selEnd?: number | null;

      change?: unknown;
      changeEx?: unknown;
      keyDown?: boolean;
    };
  };
  documenterror: {
    source: PDFViewerApplication;
    message: string;
    reason: string | undefined;
  };
  documentinit: {
    source: PDFViewerApplication;
  };
  documentloaded: {
    source: PDFViewerApplication;
  };
  documentproperties: {};
  download: {
    source: typeof window | PDFScriptingManager;
  };
  editingaction: {
    source: typeof window;
    name: string;
  };
  find: FindCtrlState & {
    source: typeof window | PDFFindBar | PDFLinkService;
  };
  findbarclose: {
    source: typeof window | PDFFindBar;
  };
  findfromurlhash: {
    source: PDFLinkService;
    query: string;
    phraseSearch: boolean;
  };
  fileattachmentannotation: {
    source: FileAttachmentAnnotationElement;
    filename: string;
    content?: Uint8Array | Uint8ClampedArray | undefined;
  };
  fileinputchange: {
    source: HTMLInputElement | HTMLDivElement;
    fileInput: EventTarget | DataTransfer | null;
  };
  firstpage: {
    source: PDFPresentationMode;
  };
  hashchange: {
    source: typeof window;
    hash: string;
  };
  lastpage: {
    source: PDFPresentationMode;
  };
  layersloaded: {
    source: PDFLayerViewer;
    layersCount: number;
  };
  localized: {
    source: PDFViewerApplication;
  };
  metadataloaded: {
    source: PDFViewerApplication;
  };
  namedaction: {
    source: PDFLinkService;
    action: string;
  };
  nextpage: {};
  openfile: {
    source: typeof window;
  };
  optionalcontentconfig: {
    source: PDFLayerViewer;
    promise: Promise<OptionalContentConfig | undefined>;
  };
  optionalcontentconfigchanged: {
    source: PDFViewer;
    promise: Promise<OptionalContentConfig | undefined>;
  };
  outlineloaded: {
    source: PDFOutlineViewer;
    outlineCount: number;
    currentOutlineItemPromise: Promise<boolean>;
  };
  pagechanging: {
    source: PDFViewer;
    pageNumber: number;
    pageLabel?: string | undefined;
    previous: number;
  };
  pageclose: {
    source: PDFViewer;
    pageNumber: number;
  };
  pagemode: {
    source: PDFLinkService;
    mode: string;
  };
  pagenumberchanged: {
    source: Toolbar;
    value: string;
  };
  pageopen: {
    source: PDFViewer;
    pageNumber: number;
    actionsPromise?: Promise<object>;
  };
  pagerender: {
    source: PDFPageView;
    pageNumber: number;
  };
  pagerendered: {
    source: PDFPageView;
    pageNumber: number;
    cssTransform: boolean;
    timestamp: number;
    error?: ErrorMoreInfo | undefined;
  };
  pagesdestroy: {
    source: PDFViewer;
  };
  pagesinit: {
    source: PDFViewer;
  };
  pagesloaded: {
    source: PDFViewer;
    pagesCount: number;
  };
  presentationmode: {};
  presentationmodechanged: {
    source: PDFPresentationMode;
    state: PresentationModeState;
    active?: boolean;
    switchInProgress?: boolean;
  };
  previouspage: {};
  print: {};
  resetlayers: {
    source: PDFSidebar;
  };
  resize: {
    source: typeof window | HTMLDivElement | PDFSidebarResizer;
  };
  rotatecw: {
    source: PDFPresentationMode;
  };
  rotateccw: {
    source: PDFPresentationMode;
  };
  rotationchanging: {
    source: PDFViewer;
    pagesRotation: number;
    pageNumber: number;
  };
  sandboxcreated: {
    source: PDFViewerApplication | PDFScriptingManager;
  };
  save: {};
  secondarytoolbarreset: {
    source: SecondaryToolbar;
  };
  scalechanging: {
    source: PDFViewer;
    scale: number;
    presetValue?: number | string | undefined;
  };
  scalechanged: {
    source: Toolbar;
    value: string;
  };
  sidebarviewchanged: {
    source: PDFSidebar;
    view: SidebarView;
  };
  scrollmodechanged: {
    source?: PDFViewer;
    mode: ScrollMode;
  };
  spreadmodechanged: {
    source: PDFViewer;
    mode: SpreadMode;
  };
  switchannotationeditormode: {
    source: AnnotationEditorUIManager;
    mode: AnnotationEditorType;
  };
  switchannotationeditorparams: {
    source: AnnotationEditorParams;
    type: AnnotationEditorParamsType;
    value: string | number;
  };
  switchcursortool: {
    tool: CursorTool;
  };
  switchscrollmode: {
    mode: ScrollMode;
  };
  switchspreadmode: {
    mode: SpreadMode;
  };
  textlayerrendered: {
    source: TextLayerBuilder;
    pageNumber: number;
    numTextDivs: number;
  };
  togglelayerstree: {};
  toggleoutlinetree: {
    source: PDFSidebar;
  };
  toolbarreset: {
    source: Toolbar;
  };
  updatefindcontrolstate: {
    source: PDFFindController;
    state: FindState;
    previous?: boolean | undefined;
    matchesCount: MatchesCount;
    rawQuery: string | null;
  };
  updatefindmatchescount: {
    source: PDFFindController;
    matchesCount: MatchesCount;
  };
  updatefromsandbox: {
    source: Window & typeof globalThis;
    detail:
      & {
        id?: string;
        focus?: boolean;
        siblings?: string[];
      }
      & ({
        command: "layout";
        value: PageLayout;
      } | {
        command: string;
        value: number | string;
      });
  };
  updatetextlayermatches: {
    source: PDFFindController;
    pageIndex: number;
  };
  updateviewarea: {
    source: PDFViewer;
    location?: PDFLocation | undefined;
  };
  xfalayerrendered: {
    source: PDFPageView;
    pageNumber: number;
    error: unknown;
  };
  zoomin: {};
  zoomout: {};
  zoomreset: {};
}
export type EventName = keyof EventMap;

export type ListenerMap = {
  [EN in EventName]: (evt: EventMap[EN]) => void;
};

type Listener1 = (evt: Record<string, unknown>) => void;
type Listener1Ex = {
  listener: Listener1;
  external: boolean;
  once: boolean;
};
/*49-------------------------------------------*/

/**
 * Simple event bus for an application. Listeners are attached using the `on`
 * and `off` methods. To raise an event, the `dispatch` method shall be used.
 */
export class EventBus {
  #listeners: Record<EventName, Listener1Ex[]> = Object.create(null);

  on<EN extends EventName>(
    eventName: EN,
    listener: ListenerMap[EN],
    options?: { once: boolean },
  ) {
    this._on(eventName, listener, {
      external: true,
      once: options?.once,
    });
  }

  off<EN extends EventName>(eventName: EN, listener: ListenerMap[EN]) {
    this._off(eventName, listener);
  }

  dispatch<EN extends EventName>(eventName: EN, data: EventMap[EN]) {
    const eventListeners = this.#listeners[eventName];
    if (!eventListeners || eventListeners.length === 0) {
      return;
    }
    let externalListeners: Listener1[] | undefined;
    // Making copy of the listeners array in case if it will be modified
    // during dispatch.
    for (const { listener, external, once } of eventListeners.slice(0)) {
      if (once) {
        this._off(eventName, listener);
      }
      if (external) {
        (externalListeners ||= []).push(listener);
        continue;
      }
      listener(data);
    }
    // Dispatch any "external" listeners *after* the internal ones, to give the
    // viewer components time to handle events and update their state first.
    if (externalListeners) {
      for (const listener of externalListeners) {
        listener(data);
      }
      externalListeners = undefined;
    }
  }

  /**
   * @ignore
   */
  _on<EN extends EventName>(
    eventName: EN,
    listener: ListenerMap[EN],
    options?: { external?: boolean; once?: boolean | undefined },
  ) {
    const eventListeners = (this.#listeners[eventName] ||= []);
    eventListeners.push({
      listener,
      external: options?.external === true,
      once: options?.once === true,
    } as Listener1Ex);
  }

  /**
   * @ignore
   */
  _off<EN extends EventName>(eventName: EN, listener: ListenerMap[EN]) {
    const eventListeners = this.#listeners[eventName];
    if (!eventListeners) {
      return;
    }
    for (let i = 0, ii = eventListeners.length; i < ii; i++) {
      if (eventListeners[i].listener === listener) {
        eventListeners.splice(i, 1);
        return;
      }
    }
  }
}

/**
 * NOTE: Only used to support various PDF viewer tests in `mozilla-central`.
 */
export class AutomationEventBus extends EventBus {
  override dispatch<EN extends EventName>(eventName: EN, data: EventMap[EN]) {
    /*#static*/ if (!MOZCENTRAL) {
      throw new Error("Not implemented: AutomationEventBus.dispatch");
    }
    super.dispatch(eventName, data);

    const details = Object.create(null);
    if (data) {
      for (const key in data) {
        const value = data[key];
        if (key === "source") {
          if (<unknown> value === window || <unknown> value === document) {
            // No need to re-dispatch (already) global events.
            return;
          }
          continue; // Ignore the `source` property.
        }
        details[key] = value;
      }
    }
    // const event = document.createEvent("CustomEvent");
    // event.initCustomEvent(eventName, true, true, details);
    const event = new CustomEvent(eventName, {
      bubbles: true,
      cancelable: true,
      detail: details,
    });
    document.dispatchEvent(event);
  }
}
/*80--------------------------------------------------------------------------*/
