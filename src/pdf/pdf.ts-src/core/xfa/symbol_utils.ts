/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2023
 *
 * @module pdf/pdf.ts-src/core/xfa/symbol_utils.ts
 * @license Apache-2.0
 ******************************************************************************/

/* Copyright 2021 Mozilla Foundation
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
/*80--------------------------------------------------------------------------*/

// We use these symbols to avoid name conflict between tags
// and properties/methods names.
export const $acceptWhitespace = Symbol();
export const $addHTML = Symbol();
export const $appendChild = Symbol();
export const $childrenToHTML = Symbol();
export const $clean = Symbol();
export const $cleanPage = Symbol();
export const $cleanup = Symbol();
export const $clone = Symbol();
export const $consumed = Symbol();
export const $content = Symbol("content");
export const $data = Symbol("data");
export const $dump = Symbol();
export const $extra = Symbol("extra");
export const $finalize = Symbol();
export const $flushHTML = Symbol();
export const $getAttributeIt = Symbol();
export const $getAttributes = Symbol();
export const $getAvailableSpace = Symbol();
export const $getChildrenByClass = Symbol();
export const $getChildrenByName = Symbol();
export const $getChildrenByNameIt = Symbol();
export const $getDataValue = Symbol();
export const $getExtra = Symbol();
export const $getRealChildrenByNameIt = Symbol();
export const $getChildren = Symbol();
export const $getContainedChildren = Symbol();
export const $getNextPage = Symbol();
export const $getSubformParent = Symbol();
export const $getParent = Symbol();
export const $getTemplateRoot = Symbol();
export const $globalData = Symbol();
export const $hasSettableValue = Symbol();
export const $ids = Symbol();
export const $indexOf = Symbol();
export const $insertAt = Symbol();
export const $isCDATAXml = Symbol();
export const $isBindable = Symbol();
export const $isDataValue = Symbol();
export const $isDescendent = Symbol();
export const $isNsAgnostic = Symbol();
export const $isSplittable = Symbol();
export const $isThereMoreWidth = Symbol();
export const $isTransparent = Symbol();
export const $isUsable = Symbol();
export const $lastAttribute = Symbol();
export const $namespaceId = Symbol("namespaceId");
export const $nodeName = Symbol("nodeName");
export const $nsAttributes = Symbol();
export const $onChild = Symbol();
export const $onChildCheck = Symbol();
export const $onText = Symbol();
export const $pushGlyphs = Symbol();
export const $popPara = Symbol();
export const $pushPara = Symbol();
export const $removeChild = Symbol();
export const $root = Symbol("root");
export const $resolvePrototypes = Symbol();
export const $searchNode = Symbol();
export const $setId = Symbol();
export const $setSetAttributes = Symbol();
export const $setValue = Symbol();
export const $tabIndex = Symbol();
export const $text = Symbol();
export const $toPages = Symbol();
export const $toHTML = Symbol();
export const $toString = Symbol();
export const $toStyle = Symbol();
export const $uid = Symbol("uid");
/*80--------------------------------------------------------------------------*/
