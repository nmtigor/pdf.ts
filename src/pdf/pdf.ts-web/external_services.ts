/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2024
 *
 * @module pdf/pdf.ts-web/external_services.ts
 * @license Apache-2.0
 ******************************************************************************/

/* Copyright 2024 Mozilla Foundation
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

import type { FindControlState } from "./app.ts";
import type { EventMap, EventName } from "./event_utils.ts";
import type { NimbusExperimentData } from "./firefoxcom.ts";
import type { IScripting } from "./interfaces.ts";
import type { L10n } from "./l10n.ts";
import type { MatchesCount } from "./pdf_find_controller.ts";
/*80--------------------------------------------------------------------------*/

export type GlobalEvent<EN extends EventName> = {
  eventName: EN;
  detail: EventMap[EN];
};

export abstract class BaseExternalServices {
  updateFindControlState(data: FindControlState) {}

  updateFindMatchesCount(data: MatchesCount) {}

  initPassiveLoading() {}

  reportTelemetry(data: EventMap["reporttelemetry"]["details"]) {}

  abstract createL10n(): Promise<L10n>;

  abstract createScripting(): IScripting;

  updateEditorStates(data: EventMap["annotationeditorstateschanged"]) {
    throw new Error("Not implemented: updateEditorStates");
  }

  //kkkk TOCLEANUP
  // async getNimbusExperimentData(): Promise<NimbusExperimentData | undefined> {
  //   return undefined;
  // }

  //kkkk TOCLEANUP
  // async getGlobalEventNames(): Promise<Set<EventName> | undefined> {
  //   return undefined;
  // }

  dispatchGlobalEvent<EN extends EventName>(_event: GlobalEvent<EN>) {}
}
/*80--------------------------------------------------------------------------*/
