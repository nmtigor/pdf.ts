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

import type { SerializedMetadata } from "../core/metadata_parser.ts";
import { objectFromMap } from "../shared/util.ts";
/*80--------------------------------------------------------------------------*/

export class Metadata {
  #metadataMap;

  #data;
  getRaw() {
    return this.#data;
  }

  constructor({ parsedData, rawData }: SerializedMetadata) {
    this.#metadataMap = parsedData;
    this.#data = rawData;
  }

  get(name: string) {
    return this.#metadataMap.get(name) ?? undefined;
  }

  getAll() {
    return objectFromMap(this.#metadataMap);
  }

  has(name: string) {
    return this.#metadataMap.has(name);
  }
}
/*80--------------------------------------------------------------------------*/
