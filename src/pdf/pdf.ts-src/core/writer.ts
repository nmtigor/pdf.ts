/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/writer.ts
 * @license Apache-2.0
 ******************************************************************************/

/* Copyright 2020 Mozilla Foundation
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

import type { TypedArray } from "@fe-lib/alias.ts";
import { bytesToString, info, warn } from "../shared/util.ts";
import type { AnnotSaveData } from "./annotation.ts";
import { BaseStream } from "./base_stream.ts";
import {
  escapePDFName,
  escapeString,
  getSizeInBytes,
  numberToString,
  parseXFAPath,
} from "./core_utils.ts";
import type { CipherTransform, CipherTransformFactory } from "./crypto.ts";
import { calculateMD5 } from "./crypto.ts";
import { Dict, isName, Name, type Obj, Ref } from "./primitives.ts";
import { Stream } from "./stream.ts";
import type { XRefInfo } from "./worker.ts";
import { SimpleDOMNode, SimpleXMLParser } from "./xml_parser.ts";
import type { XRef } from "./xref.ts";
/*80--------------------------------------------------------------------------*/

export async function writeObject(
  ref: Ref,
  obj: Dict | BaseStream | (number | Ref)[],
  buffer: string[],
  { encrypt = undefined }: { encrypt?: CipherTransformFactory },
) {
  const transform = encrypt?.createCipherTransform(ref.num, ref.gen);
  buffer.push(`${ref.num} ${ref.gen} obj\n`);
  if (obj instanceof Dict) {
    await writeDict(obj, buffer, transform);
  } else if (obj instanceof BaseStream) {
    await writeStream(obj, buffer, transform);
  } else if (Array.isArray(obj) || ArrayBuffer.isView(obj)) {
    await writeArray(obj, buffer, transform);
  }
  buffer.push("\nendobj\n");
}

export async function writeDict(
  dict: Dict,
  buffer: string[],
  transform?: CipherTransform,
) {
  buffer.push("<<");
  for (const key of dict.getKeys()) {
    buffer.push(` /${escapePDFName(key)} `);
    await writeValue(dict.getRaw(key), buffer, transform);
  }
  buffer.push(">>");
}

async function writeStream(
  stream: BaseStream,
  buffer: string[],
  transform?: CipherTransform,
) {
  let bytes = stream.getBytes();
  const { dict } = stream;

  // Table 5
  const [filter, params] = await Promise.all([
    dict!.getAsync("Filter") as Promise<Name | Name[]>,
    dict!.getAsync("DecodeParms") as Promise<Dict | Dict[]>,
  ]);

  const filterZero = Array.isArray(filter)
    ? await dict!.xref!.fetchIfRefAsync(filter[0]!)
    : filter;
  const isFilterZeroFlateDecode = isName(filterZero, "FlateDecode");

  // If the string is too small there is no real benefit in compressing it.
  // The number 256 is arbitrary, but it should be reasonable.
  const MIN_LENGTH_FOR_COMPRESSING = 256;

  if (
    typeof (globalThis as any).CompressionStream !== "undefined" &&
    (bytes.length >= MIN_LENGTH_FOR_COMPRESSING || isFilterZeroFlateDecode)
  ) {
    try {
      const cs = new (globalThis as any).CompressionStream("deflate");
      const writer = cs.writable.getWriter();
      writer.write(bytes);
      writer.close();

      // Response::text doesn't return the correct data.
      const buf = await new Response(cs.readable).arrayBuffer();
      bytes = new Uint8Array(buf);

      let newFilter: Name | Name[] | undefined, newParams;
      if (!filter) {
        newFilter = Name.get("FlateDecode");
      } else if (!isFilterZeroFlateDecode) {
        newFilter = Array.isArray(filter)
          ? [Name.get("FlateDecode"), ...filter]
          : [Name.get("FlateDecode"), filter];
        if (params) {
          newParams = Array.isArray(params)
            ? [null, ...params]
            : [null, params];
        }
      }
      if (newFilter) {
        dict!.set("Filter", newFilter);
      }
      if (newParams) {
        dict!.set("DecodeParms", newParams);
      }
    } catch (ex) {
      info(`writeStream - cannot compress data: "${ex}".`);
    }
  }

  let string = bytesToString(bytes);
  if (transform) {
    string = transform.encryptString(string);
  }

  dict!.set("Length", string.length);
  await writeDict(dict!, buffer, transform);
  buffer.push(" stream\n", string, "\nendstream");
}

async function writeArray(
  array: TypedArray | (Obj | undefined)[],
  buffer: string[],
  transform?: CipherTransform,
) {
  buffer.push("[");
  let first = true;
  for (const val of array) {
    if (!first) {
      buffer.push(" ");
    } else {
      first = false;
    }
    await writeValue(val, buffer, transform);
  }
  buffer.push("]");
}

async function writeValue(
  value: Obj | undefined,
  buffer: string[],
  transform?: CipherTransform,
) {
  if (value instanceof Name) {
    buffer.push(`/${escapePDFName(value.name)}`);
  } else if ((value instanceof Ref)) {
    buffer.push(`${value.num} ${value.gen} R`);
  } else if (Array.isArray(value) || ArrayBuffer.isView(value)) {
    await writeArray(value, buffer, transform);
  } else if (typeof value === "string") {
    if (transform) {
      value = transform.encryptString(value);
    }
    buffer.push(`(${escapeString(value)})`);
  } else if (typeof value === "number") {
    buffer.push(numberToString(value));
  } else if (typeof value === "boolean") {
    buffer.push(value.toString());
  } else if (value instanceof Dict) {
    await writeDict(value, buffer, transform);
  } else if (value instanceof BaseStream) {
    await writeStream(value, buffer, transform);
  } else if (value === null || value === undefined) {
    buffer.push("null");
  } else {
    warn(`Unhandled value in writer: ${typeof value}, please file a bug.`);
  }
}

function writeInt(
  number: number,
  size: number,
  offset: number,
  buffer: Uint8Array,
) {
  for (let i = size + offset - 1; i > offset - 1; i--) {
    buffer[i] = number & 0xff;
    number >>= 8;
  }
  return offset + size;
}

function writeString(string: string, offset: number, buffer: Uint8Array) {
  for (let i = 0, len = string.length; i < len; i++) {
    buffer[offset + i] = string.charCodeAt(i) & 0xff;
  }
}

function computeMD5(filesize: number, xrefInfo: XRefInfo) {
  const time = Math.floor(Date.now() / 1000);
  const filename = xrefInfo.filename || "";
  const md5Buffer = [time.toString(), filename, filesize.toString()];
  let md5BufferLen = md5Buffer.reduce((a, str) => a + str.length, 0);
  for (const value of Object.values(xrefInfo.info)) {
    md5Buffer.push(value);
    md5BufferLen += value.length;
  }

  const array = new Uint8Array(md5BufferLen);
  let offset = 0;
  for (const str of md5Buffer) {
    writeString(str, offset, array);
    offset += str.length;
  }
  return bytesToString(calculateMD5(array));
}

function writeXFADataForAcroform(str: string, newRefs: AnnotSaveData[]) {
  const xml = new SimpleXMLParser({ hasAttributes: true }).parseFromString(
    str,
  )!;

  for (const { xfa } of newRefs) {
    if (!xfa) {
      continue;
    }
    const { path, value } = xfa;
    if (!path) {
      continue;
    }
    const nodePath = parseXFAPath(path);
    let node = xml.documentElement.searchNode(nodePath, 0);
    if (!node && nodePath.length > 1) {
      // If we're lucky the last element in the path will identify the node.
      node = xml.documentElement.searchNode([nodePath.at(-1)!], 0);
    }
    if (node) {
      node.childNodes = Array.isArray(value)
        ? value.map((val) => new SimpleDOMNode("value", val))
        : [new SimpleDOMNode("#text", value)];
    } else {
      warn(`Node not found for path: ${path}`);
    }
  }
  const buffer: string[] = [];
  xml.documentElement.dump(buffer);
  return buffer.join("");
}

interface UpdateAcroformP_ {
  xref: XRef | undefined;
  acroForm: Dict | undefined;
  acroFormRef: Ref | undefined;
  hasXfa?: boolean;
  hasXfaDatasetsEntry?: boolean;
  xfaDatasetsRef: Ref | undefined;
  needAppearances: boolean | undefined;
  newRefs: AnnotSaveData[];
}
async function updateAcroform({
  xref,
  acroForm,
  acroFormRef,
  hasXfa,
  hasXfaDatasetsEntry,
  xfaDatasetsRef,
  needAppearances,
  newRefs,
}: UpdateAcroformP_) {
  if (hasXfa && !hasXfaDatasetsEntry && !xfaDatasetsRef) {
    warn("XFA - Cannot save it");
  }

  if (!needAppearances && (!hasXfa || !xfaDatasetsRef || hasXfaDatasetsEntry)) {
    return;
  }

  const dict = acroForm!.clone();

  if (hasXfa && !hasXfaDatasetsEntry) {
    // We've a XFA array which doesn't contain a datasets entry.
    // So we'll update the AcroForm dictionary to have an XFA containing
    // the datasets.
    const newXfa = (acroForm!.get("XFA") as Obj[]).slice();
    newXfa.splice(2, 0, "datasets");
    newXfa.splice(3, 0, xfaDatasetsRef!);

    dict.set("XFA", newXfa);
  }

  if (needAppearances) {
    dict.set("NeedAppearances", true);
  }

  const buffer: string[] = [];
  await writeObject(acroFormRef!, dict, buffer, xref!);

  newRefs.push({ ref: acroFormRef!, data: buffer.join("") });
}

interface UpdateXFAP_ {
  xfaData: string | undefined;
  xfaDatasetsRef: Ref | undefined;
  newRefs: AnnotSaveData[];
  xref: XRef | undefined;
}
function updateXFA({ xfaData, xfaDatasetsRef, newRefs, xref }: UpdateXFAP_) {
  if (xfaData === undefined) {
    const datasets = xref!.fetchIfRef(xfaDatasetsRef!) as BaseStream;
    xfaData = writeXFADataForAcroform(datasets.getString(), newRefs);
  }

  const encrypt = xref!.encrypt;
  if (encrypt) {
    const transform = encrypt.createCipherTransform(
      xfaDatasetsRef!.num,
      xfaDatasetsRef!.gen,
    );
    xfaData = transform.encryptString(xfaData);
  }
  const data = `${xfaDatasetsRef!.num} ${xfaDatasetsRef!.gen} obj\n` +
    `<< /Type /EmbeddedFile /Length ${xfaData.length}>>\nstream\n` +
    xfaData +
    "\nendstream\nendobj\n";

  newRefs.push({ ref: xfaDatasetsRef!, data });
}

async function getXRefTable(
  xrefInfo: XRefInfo,
  baseOffset: number,
  newRefs: AnnotSaveData[],
  newXref: Dict,
  buffer: string[],
) {
  buffer.push("xref\n");
  const indexes = getIndexes(newRefs);
  let indexesPosition = 0;
  for (const { ref, data } of newRefs) {
    if (ref.num === indexes[indexesPosition]) {
      buffer.push(
        `${indexes[indexesPosition]} ${indexes[indexesPosition + 1]}\n`,
      );
      indexesPosition += 2;
    }
    // The EOL is \r\n to make sure that every entry is exactly 20 bytes long.
    // (see 7.5.4 - Cross-Reference Table).
    buffer.push(
      `${baseOffset.toString().padStart(10, "0")} ${
        Math.min(ref.gen, 0xffff).toString().padStart(5, "0")
      } n\r\n`,
    );
    baseOffset += data.length;
  }
  computeIDs(baseOffset, xrefInfo, newXref);
  buffer.push("trailer\n");
  await writeDict(newXref, buffer);
  buffer.push("\nstartxref\n", baseOffset.toString(), "\n%%EOF\n");
}

function getIndexes(newRefs: AnnotSaveData[]) {
  const indexes: number[] = [];
  for (const { ref } of newRefs) {
    if (ref.num === indexes.at(-2)! + indexes.at(-1)!) {
      indexes[indexes.length - 1] += 1;
    } else {
      indexes.push(ref.num, 1);
    }
  }
  return indexes;
}

async function getXRefStreamTable(
  xrefInfo: XRefInfo,
  baseOffset: number,
  newRefs: AnnotSaveData[],
  newXref: Dict,
  buffer: string[],
) {
  const xrefTableData = [];
  let maxOffset = 0;
  let maxGen = 0;
  for (const { ref, data } of newRefs) {
    maxOffset = Math.max(maxOffset, baseOffset);
    const gen = Math.min(ref.gen, 0xffff);
    maxGen = Math.max(maxGen, gen);
    xrefTableData.push([1, baseOffset, gen]);
    baseOffset += data.length;
  }
  newXref.set("Index", getIndexes(newRefs));
  const offsetSize = getSizeInBytes(maxOffset);
  const maxGenSize = getSizeInBytes(maxGen);
  const sizes = [1, offsetSize, maxGenSize];
  newXref.set("W", sizes);
  computeIDs(baseOffset, xrefInfo, newXref);

  const structSize = sizes.reduce((a, x) => a + x, 0);
  const data = new Uint8Array(structSize * xrefTableData.length);
  const stream = new Stream(data);
  stream.dict = newXref;

  let offset = 0;
  for (const [type, objOffset, gen] of xrefTableData) {
    offset = writeInt(type, sizes[0], offset, data);
    offset = writeInt(objOffset, sizes[1], offset, data);
    offset = writeInt(gen, sizes[2], offset, data);
  }

  await writeObject(xrefInfo.newRef, stream, buffer, {});
  buffer.push("startxref\n", baseOffset.toString(), "\n%%EOF\n");
}

function computeIDs(baseOffset: number, xrefInfo: XRefInfo, newXref: Dict) {
  if (Array.isArray(xrefInfo.fileIds) && xrefInfo.fileIds.length > 0) {
    const md5 = computeMD5(baseOffset, xrefInfo);
    newXref.set("ID", [xrefInfo.fileIds[0], md5]);
  }
}

function getTrailerDict(
  xrefInfo: XRefInfo,
  newRefs: AnnotSaveData[],
  useXrefStream: boolean,
) {
  const newXref = new Dict();
  newXref.set("Prev", xrefInfo.startXRef);
  const refForXrefTable = xrefInfo.newRef;
  if (useXrefStream) {
    newRefs.push({ ref: refForXrefTable, data: "" });
    newXref.set("Size", refForXrefTable.num + 1);
    newXref.set("Type", Name.get("XRef"));
  } else {
    newXref.set("Size", refForXrefTable.num);
  }
  if (xrefInfo.rootRef !== undefined) {
    newXref.set("Root", xrefInfo.rootRef);
  }
  if (xrefInfo.infoRef !== undefined) {
    newXref.set("Info", xrefInfo.infoRef);
  }
  if (xrefInfo.encryptRef !== undefined) {
    newXref.set("Encrypt", xrefInfo.encryptRef);
  }
  return newXref;
}

interface IncrementalUpdateP_ {
  originalData: Uint8Array;
  xrefInfo: XRefInfo;
  newRefs: AnnotSaveData[];
  xref?: XRef;

  acroForm?: Dict | undefined;
  acroFormRef?: Ref | undefined;

  hasXfa?: boolean;
  hasXfaDatasetsEntry?: boolean;

  needAppearances?: boolean | undefined;

  xfaData?: string | undefined;
  xfaDatasetsRef?: Ref | undefined;

  useXrefStream: boolean;
}
export async function incrementalUpdate({
  originalData,
  xrefInfo,
  newRefs,
  xref,
  hasXfa = false,
  xfaDatasetsRef,
  hasXfaDatasetsEntry = false,
  needAppearances,
  acroFormRef,
  acroForm,
  xfaData,
  useXrefStream = false,
}: IncrementalUpdateP_) {
  await updateAcroform({
    xref,
    acroForm,
    acroFormRef,
    hasXfa,
    hasXfaDatasetsEntry,
    xfaDatasetsRef,
    needAppearances,
    newRefs,
  });

  if (hasXfa) {
    updateXFA({
      xfaData,
      xfaDatasetsRef,
      newRefs,
      xref,
    });
  }

  let buffer: string[], baseOffset;
  const lastByte = originalData.at(-1);
  if (lastByte === /* \n */ 0x0a || lastByte === /* \r */ 0x0d) {
    buffer = [];
    baseOffset = originalData.length;
  } else {
    // Avoid to concatenate %%EOF with an object definition
    buffer = ["\n"];
    baseOffset = originalData.length + 1;
  }

  const newXref = getTrailerDict(xrefInfo, newRefs, useXrefStream);
  newRefs = newRefs.sort(
    (a, b) => /* compare the refs */ a.ref.num - b.ref.num,
  );
  for (const { data } of newRefs) {
    buffer.push(data);
  }

  await (useXrefStream
    ? getXRefStreamTable(xrefInfo, baseOffset, newRefs, newXref, buffer)
    : getXRefTable(xrefInfo, baseOffset, newRefs, newXref, buffer));

  const totalLength = buffer.reduce(
    (a, str) => a + str.length,
    originalData.length,
  );
  const array = new Uint8Array(totalLength);

  // Original data
  array.set(originalData);
  let offset = originalData.length;

  // New data
  for (const str of buffer) {
    writeString(str, offset, array);
    offset += str.length;
  }

  return array;
}
/*80--------------------------------------------------------------------------*/
