/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2023
 */

/* Copyright 2023 Mozilla Foundation
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

import type { EventBus, EventName } from "./event_utils.ts";
import type { NimbusExperimentData } from "./firefoxcom.ts";
import type { IL10n } from "./interfaces.ts";
/*80--------------------------------------------------------------------------*/

type ToolbarOptions = {
  /**
   * Main container.
   */
  mainContainer: HTMLDivElement;

  /**
   * Container for the toolbar.
   */
  container: HTMLDivElement;

  /**
   * Button to download the document.
   */
  download: HTMLButtonElement;

  openInApp: HTMLElement;
};

type Button_ = {
  element: HTMLElement;
  eventName: EventName;
  eventDetails?: unknown;
  nimbusName: keyof NimbusExperimentData;
};

export class Toolbar {
  #buttons;

  #eventBus;

  /**
   * @param _l10n Localization service.
   * @param nimbusData Nimbus configuration.
   * @param externalServices Interface for external services.
   */
  constructor(
    options: ToolbarOptions,
    eventBus: EventBus,
    _l10n: IL10n,
    nimbusData: NimbusExperimentData | undefined,
  ) {
    this.#eventBus = eventBus;
    const buttons: Button_[] = [
      {
        element: options.download,
        eventName: "download",
        nimbusName: "download-button",
      },
      {
        element: options.openInApp,
        eventName: "openinexternalapp",
        nimbusName: "open-in-app-button",
      },
    ];

    if (nimbusData) {
      this.#buttons = [];
      for (const button of buttons) {
        if (nimbusData[button.nimbusName]) {
          this.#buttons.push(button);
        } else {
          button.element.remove();
        }
      }
      if (this.#buttons.length > 0) {
        options.container.classList.add("show");
      } else {
        options.container.remove();
        options.mainContainer.classList.add("noToolbar");
      }
    } else {
      options.container.classList.add("show");
      this.#buttons = buttons;
    }

    // Bind the event listeners for click and various other actions.
    this.#bindListeners(options);
  }

  setPageNumber(pageNumber: number, pageLabel?: string) {}

  setPagesCount(pagesCount: number, hasPageLabels: boolean) {}

  setPageScale(
    pageScaleValue: string | number | undefined,
    pageScale: number,
  ) {}

  reset() {}

  #bindListeners(options: ToolbarOptions) {
    // The buttons within the toolbar.
    for (const { element, eventName, eventDetails } of this.#buttons) {
      element.on("click", (evt) => {
        if (eventName !== null) {
          this.#eventBus.dispatch(
            eventName,
            { source: this, ...eventDetails as any },
          );
          this.#eventBus.dispatch("reporttelemetry", {
            source: this,
            details: {
              type: "gv-buttons",
              data: { id: `${element.id}_tapped` },
            },
          });
        }
      });
    }
  }

  updateLoadingIndicatorState(loading = false) {}
}
/*80--------------------------------------------------------------------------*/
