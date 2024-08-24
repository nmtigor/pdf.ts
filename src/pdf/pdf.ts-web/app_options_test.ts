/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2024
 *
 * @module pdf/pdf.ts-web/app_options_test.ts
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

import { see_ui_testing } from "@fe-pdf.ts-test/alias.ts";
import { describe, it } from "@std/testing/bdd";
/*80--------------------------------------------------------------------------*/

describe("AppOptions", () => {
  it("checks that getAll returns data, for every OptionKind", see_ui_testing);

  it(
    'checks that the number of "PREFERENCE" options does *not* exceed the maximum in mozilla-central',
    see_ui_testing,
  );
});
/*80--------------------------------------------------------------------------*/
