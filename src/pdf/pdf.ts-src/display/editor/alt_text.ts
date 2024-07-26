/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2024
 *
 * @module pdf/pdf.ts-src/display/editor/alt_text.ts
 * @license Apache-2.0
 ******************************************************************************/

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

import { html, span } from "@fe-lib/dom.ts";
import { noContextMenu } from "@fe-lib/util/general.ts";
import type { AltTextData, AnnotationEditor } from "./editor.ts";
/*80--------------------------------------------------------------------------*/

export class AltText {
  #altText = "";
  #altTextDecorative = false;
  #altTextButton: HTMLButtonElement | undefined;
  #altTextTooltip: HTMLSpanElement | undefined;
  #altTextTooltipTimeout: number | undefined;
  #altTextWasFromKeyBoard = false;
  #editor;

  static _l10nPromise: Map<string, Promise<string>>;

  constructor(editor: AnnotationEditor) {
    this.#editor = editor;
  }

  static initialize(l10nPromise: Map<string, Promise<string>>) {
    AltText._l10nPromise ||= l10nPromise;
  }

  async render() {
    const altText = (this.#altTextButton = html("button"));
    altText.className = "altText";
    const msg = await AltText._l10nPromise.get(
      "pdfjs-editor-alt-text-button-label",
    )!;
    altText.textContent = msg;
    altText.setAttribute("aria-label", msg);
    altText.tabIndex = 0;
    const signal = this.#editor._uiManager._signal;
    altText.on("contextmenu", noContextMenu, { signal });
    altText.on("pointerdown", (event) => event.stopPropagation(), { signal });

    const onClick = (event: MouseEvent | KeyboardEvent) => {
      event.preventDefault();
      this.#editor._uiManager.editAltText(this.#editor);
    };
    altText.on("click", onClick, { capture: true, signal });
    altText.on("keydown", (event) => {
      if (event.target === altText && event.key === "Enter") {
        this.#altTextWasFromKeyBoard = true;
        onClick(event);
      }
    }, { signal });
    await this.#setState();

    return altText;
  }

  finish() {
    if (!this.#altTextButton) {
      return;
    }
    this.#altTextButton.focus(
      { focusVisible: this.#altTextWasFromKeyBoard } as FocusOptions,
    );
    this.#altTextWasFromKeyBoard = false;
  }

  isEmpty() {
    return !this.#altText && !this.#altTextDecorative;
  }

  get data(): AltTextData {
    return {
      altText: this.#altText,
      decorative: this.#altTextDecorative,
    };
  }

  /**
   * Set the alt text data.
   */
  set data({ altText, decorative }) {
    if (this.#altText === altText && this.#altTextDecorative === decorative) {
      return;
    }
    this.#altText = altText;
    this.#altTextDecorative = decorative;
    this.#setState();
  }

  toggle(enabled = false) {
    if (!this.#altTextButton) {
      return;
    }
    if (!enabled && this.#altTextTooltipTimeout) {
      clearTimeout(this.#altTextTooltipTimeout);
      this.#altTextTooltipTimeout = undefined;
    }
    this.#altTextButton.disabled = !enabled;
  }

  destroy() {
    this.#altTextButton?.remove();
    this.#altTextButton = undefined;
    this.#altTextTooltip = undefined;
  }

  async #setState() {
    const button = this.#altTextButton;
    if (!button) {
      return;
    }
    if (!this.#altText && !this.#altTextDecorative) {
      button.classList.remove("done");
      this.#altTextTooltip?.remove();
      return;
    }
    button.classList.add("done");

    AltText._l10nPromise
      .get("pdfjs-editor-alt-text-edit-button-label")!
      .then((msg) => {
        button.setAttribute("aria-label", msg);
      });
    let tooltip = this.#altTextTooltip;
    if (!tooltip) {
      this.#altTextTooltip = tooltip = span();
      tooltip.className = "tooltip";
      tooltip.setAttribute("role", "tooltip");
      const id = (tooltip.id = `alt-text-tooltip-${this.#editor.id}`);
      button.setAttribute("aria-describedby", id);

      const DELAY_TO_SHOW_TOOLTIP = 100;
      const signal = this.#editor._uiManager._signal;
      signal.on("abort", () => {
        clearTimeout(this.#altTextTooltipTimeout);
        this.#altTextTooltipTimeout = undefined;
      }, { once: true });
      button.on("mouseenter", () => {
        this.#altTextTooltipTimeout = setTimeout(() => {
          this.#altTextTooltipTimeout = undefined;
          this.#altTextTooltip!.classList.add("show");
          this.#editor._reportTelemetry({
            action: "alt_text_tooltip",
          });
        }, DELAY_TO_SHOW_TOOLTIP);
      }, { signal });
      button.on("mouseleave", () => {
        if (this.#altTextTooltipTimeout) {
          clearTimeout(this.#altTextTooltipTimeout);
          this.#altTextTooltipTimeout = undefined;
        }
        this.#altTextTooltip?.classList.remove("show");
      }, { signal });
    }
    tooltip.innerText = this.#altTextDecorative
      ? await AltText._l10nPromise.get(
        "pdfjs-editor-alt-text-decorative-tooltip",
      )!
      : this.#altText;

    if (!tooltip.parentNode) {
      button.append(tooltip);
    }

    const element = this.#editor.getImageForAltText();
    element?.setAttribute("aria-describedby", tooltip.id);
  }
}
/*80--------------------------------------------------------------------------*/
