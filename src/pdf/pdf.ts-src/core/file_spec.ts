/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/file_spec.ts
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

import { shadow, stringToPDFString, warn } from "../shared/util.ts";
import { BaseStream } from "./base_stream.ts";
import { Dict } from "./primitives.ts";
import { XRef } from "./xref.ts";
/*80--------------------------------------------------------------------------*/

function pickPlatformItem(dict: unknown): string | undefined {
  if (!(dict instanceof Dict)) {
    return undefined;
  }
  // Look for the filename in this order:
  // UF, F, Unix, Mac, DOS
  if (dict.has("UF")) return dict.get("UF") as string;
  else if (dict.has("F")) return dict.get("F") as string;
  else if (dict.has("Unix")) return dict.get("Unix") as string;
  else if (dict.has("Mac")) return dict.get("Mac") as string;
  else if (dict.has("DOS")) return dict.get("DOS") as string;
  return undefined;
}

function stripPath(str: string): string {
  return str.substring(str.lastIndexOf("/") + 1);
}

export type Attachment = {
  rawFilename: string;
  filename: string;
  content?: Uint8Array | Uint8ClampedArray | undefined;
  description: string;
};

/**
 * "A PDF file can refer to the contents of another file by using a File
 * Specification (PDF 1.1)", see the spec (7.11) for more details.
 * NOTE: Only embedded files are supported (as part of the attachments support)
 * TODO: support the 'URL' file system (with caching if !/V), portable
 * collections attributes and related files (/RF)
 */
export class FileSpec {
  xref;
  root;
  fs;
  #contentAvailable = false;

  _contentRef?: string | undefined;

  constructor(root: Dict, xref?: XRef, skipContent = false) {
    if (!(root instanceof Dict)) {
      return;
    }
    this.xref = xref;
    this.root = root;
    if (root.has("FS")) {
      this.fs = root.get("FS");
    }
    if (root.has("RF")) {
      warn("Related file specifications are not supported");
    }
    if (!skipContent) {
      if (root.has("EF")) {
        this.#contentAvailable = true;
      } else {
        warn("Non-embedded file specifications are not supported");
      }
    }
  }

  get filename() {
    let filename = "";

    const item = pickPlatformItem(this.root);
    if (item && typeof item === "string") {
      filename = stringToPDFString(item)
        .replaceAll("\\\\", "\\")
        .replaceAll("\\/", "/")
        .replaceAll("\\", "/");
    }
    return shadow(this, "filename", filename || "unnamed");
  }

  get content() {
    if (!this.#contentAvailable) {
      return undefined;
    }
    this._contentRef ||= pickPlatformItem(this.root?.get("EF"));

    let content = undefined;
    if (this._contentRef) {
      const fileObj = this.xref!.fetchIfRef(this._contentRef);
      if (fileObj instanceof BaseStream) {
        content = fileObj.getBytes();
      } else {
        warn(
          "Embedded file specification points to non-existing/invalid " +
            "content",
        );
      }
    } else {
      warn("Embedded file specification does not have any content");
    }
    return content;
  }

  get description() {
    let description = "";

    const desc = this.root?.get("Desc");
    if (desc && typeof desc === "string") {
      description = stringToPDFString(desc);
    }
    return shadow(this, "description", description);
  }

  get serializable(): Attachment {
    return {
      rawFilename: this.filename,
      filename: stripPath(this.filename),
      content: this.content,
      description: this.description,
    };
  }
}
/*80--------------------------------------------------------------------------*/
