/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

/* Copyright 2022 Mozilla Foundation
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

import { AnnotationEditorParamsType } from "../pdf.ts-src/pdf.ts";
import type { EventBus } from "./event_utils.ts";
import type { ViewerConfiguration } from "./viewer.ts";
/*80--------------------------------------------------------------------------*/

export class AnnotationEditorParams {
  eventBus;

  constructor(
    options: ViewerConfiguration["annotationEditorParams"],
    eventBus: EventBus,
  ) {
    this.eventBus = eventBus;
    this.#bindListeners(options);
  }

  #bindListeners({
    editorFreeTextFontSize,
    editorFreeTextColor,
    editorInkColor,
    editorInkThickness,
    editorInkOpacity,
    editorStampAddImage,
  }: ViewerConfiguration["annotationEditorParams"]) {
    const dispatchEvent = (
      typeStr: AnnotationEditorParamsType,
      value?: string | number,
    ) => {
      this.eventBus.dispatch("switchannotationeditorparams", {
        source: this,
        type: typeStr,
        value,
      });
    };
    editorFreeTextFontSize.on("input", function (this: HTMLInputElement) {
      dispatchEvent(
        AnnotationEditorParamsType.FREETEXT_SIZE,
        this.valueAsNumber,
      );
    });
    editorFreeTextColor.on("input", function (this: HTMLInputElement) {
      dispatchEvent(AnnotationEditorParamsType.FREETEXT_COLOR, this.value);
    });
    editorInkColor.on("input", function (this: HTMLInputElement) {
      dispatchEvent(AnnotationEditorParamsType.INK_COLOR, this.value);
    });
    editorInkThickness.on("input", function (this: HTMLInputElement) {
      dispatchEvent(
        AnnotationEditorParamsType.INK_THICKNESS,
        this.valueAsNumber,
      );
    });
    editorInkOpacity.on("input", function (this: HTMLInputElement) {
      dispatchEvent(AnnotationEditorParamsType.INK_OPACITY, this.valueAsNumber);
    });
    editorStampAddImage.on("click", () => {
      dispatchEvent(AnnotationEditorParamsType.CREATE);
    });

    this.eventBus._on("annotationeditorparamschanged", (evt) => {
      for (const [type, value] of evt.details) {
        switch (type) {
          case AnnotationEditorParamsType.FREETEXT_SIZE:
            editorFreeTextFontSize.value = <string> value;
            break;
          case AnnotationEditorParamsType.FREETEXT_COLOR:
            editorFreeTextColor.value = <string> value;
            break;
          case AnnotationEditorParamsType.INK_COLOR:
            editorInkColor.value = <string> value;
            break;
          case AnnotationEditorParamsType.INK_THICKNESS:
            editorInkThickness.value = <string> value;
            break;
          case AnnotationEditorParamsType.INK_OPACITY:
            editorInkOpacity.value = <string> value;
            break;
        }
      }
    });
  }
}
/*80--------------------------------------------------------------------------*/
