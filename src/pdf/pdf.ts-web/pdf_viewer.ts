/* Copyright 2014 Mozilla Foundation
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

import { BaseViewer } from "./base_viewer.js";
import { SpreadMode, ScrollMode } from "./ui_utils.js";
/*81---------------------------------------------------------------------------*/

export class PDFViewer extends BaseViewer {}

export class PDFSinglePageViewer extends BaseViewer 
{
  override _resetView() 
  {
    super._resetView();
    this._scrollMode = ScrollMode.PAGE;
    this._spreadMode = SpreadMode.NONE;
  }

  // eslint-disable-next-line accessor-pairs
  override set scrollMode( mode:ScrollMode ) {}

  override _updateScrollMode() {}

  // eslint-disable-next-line accessor-pairs
  override set spreadMode( mode:SpreadMode ) {}

  override _updateSpreadMode() {}
}
/*81---------------------------------------------------------------------------*/
