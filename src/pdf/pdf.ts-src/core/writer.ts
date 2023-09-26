/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

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

import { bytesToString, info, stringToBytes, warn } from "../shared/util.ts";
import type { SaveData } from "./annotation.ts";
import { BaseStream } from "./base_stream.ts";
import {
  escapePDFName,
  escapeString,
  numberToString,
  parseXFAPath,
} from "./core_utils.ts";
import { calculateMD5, type CipherTransform } from "./crypto.ts";
import { Dict, isName, Name, type Obj, Ref } from "./primitives.ts";
import type { XRefInfo } from "./worker.ts";
import { SimpleDOMNode, SimpleXMLParser } from "./xml_parser.ts";
import type { XRef } from "./xref.ts";
/*80--------------------------------------------------------------------------*/

export async function writeObject(
  ref: Ref,
  obj: Dict | BaseStream,
  buffer: string[],
  transform: CipherTransform | undefined,
) {
  buffer.push(`${ref.num} ${ref.gen} obj\n`);
  if (obj instanceof Dict) {
    await writeDict(obj, buffer, transform);
  } else if (obj instanceof BaseStream) {
    await writeStream(obj, buffer, transform);
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
  let string = stream.getString();
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
    (string.length >= MIN_LENGTH_FOR_COMPRESSING || isFilterZeroFlateDecode)
  ) {
    try {
      const byteArray = stringToBytes(string);
      const cs = new (globalThis as any).CompressionStream("deflate");
      const writer = cs.writable.getWriter();
      writer.write(byteArray);
      writer.close();

      // Response::text doesn't return the correct data.
      const buf = await new Response(cs.readable).arrayBuffer();
      string = bytesToString(new Uint8Array(buf));

      let newFilter, newParams;
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

  if (transform !== undefined) {
    string = transform.encryptString(string);
  }

  dict!.set("Length", string.length);
  await writeDict(dict!, buffer, transform);
  buffer.push(" stream\n", string, "\nendstream");
}

async function writeArray(
  array: (Obj | undefined)[],
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
  } else if (Array.isArray(value)) {
    await writeArray(value, buffer, transform);
  } else if (typeof value === "string") {
    if (transform !== undefined) {
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

function writeXFADataForAcroform(str: string, newRefs: SaveData[]) {
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
  newRefs: SaveData[];
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

  // Clone the acroForm.
  const dict = new Dict(xref);
  for (const key of acroForm!.getKeys()) {
    dict.set(key, acroForm!.getRaw(key));
  }

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

  const encrypt = xref!.encrypt;
  let transform: CipherTransform | undefined;
  if (encrypt) {
    transform = encrypt.createCipherTransform(
      acroFormRef!.num,
      acroFormRef!.gen,
    );
  }

  const buffer: string[] = [];
  await writeObject(acroFormRef!, dict, buffer, transform);

  newRefs.push({ ref: acroFormRef!, data: buffer.join("") });
}

interface UpdateXFAP_ {
  xfaData: string | undefined;
  xfaDatasetsRef: Ref | undefined;
  newRefs: SaveData[];
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

interface IncrementalUpdateP_ {
  originalData: Uint8Array;
  xrefInfo: XRefInfo;
  newRefs: SaveData[];
  xref?: XRef;

  acroForm?: Dict | undefined;
  acroFormRef?: Ref | undefined;

  hasXfa?: boolean;
  hasXfaDatasetsEntry?: boolean;

  needAppearances: boolean | undefined;

  xfaData?: string | undefined;
  xfaDatasetsRef?: Ref | undefined;
}
export async function incrementalUpdate({
  originalData,
  xrefInfo,
  newRefs,
  xref,
  hasXfa = false,
  hasXfaDatasetsEntry = false,
  xfaDatasetsRef,
  needAppearances,
  acroFormRef,
  acroForm,
  xfaData,
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

  const newXref = new Dict();
  const refForXrefTable = xrefInfo.newRef;

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

  newXref.set("Size", refForXrefTable.num + 1);
  newXref.set("Prev", xrefInfo.startXRef);
  newXref.set("Type", Name.get("XRef"));

  if (xrefInfo.rootRef !== undefined) {
    newXref.set("Root", xrefInfo.rootRef);
  }
  if (xrefInfo.infoRef !== undefined) {
    newXref.set("Info", xrefInfo.infoRef);
  }
  if (xrefInfo.encryptRef !== undefined) {
    newXref.set("Encrypt", xrefInfo.encryptRef);
  }

  // Add a ref for the new xref and sort them
  newRefs.push({ ref: refForXrefTable, data: "" });
  newRefs = newRefs.sort((a, b) => {
    // compare the refs
    return a.ref.num - b.ref.num;
  });

  const xrefTableData = [[0, 1, 0xffff]];
  const indexes = [0, 1];
  let maxOffset = 0;
  for (const { ref, data } of newRefs) {
    maxOffset = Math.max(maxOffset, baseOffset);
    xrefTableData.push([1, baseOffset, Math.min(ref.gen, 0xffff)]);
    baseOffset += data.length;
    indexes.push(ref.num, 1);
    buffer.push(data);
  }

  newXref.set("Index", indexes);

  if (Array.isArray(xrefInfo.fileIds) && xrefInfo.fileIds.length > 0) {
    const md5 = computeMD5(baseOffset, xrefInfo);
    newXref.set("ID", [xrefInfo.fileIds[0], md5]);
  }

  const offsetSize = Math.ceil(Math.log2(maxOffset) / 8);
  const sizes = [1, offsetSize, 2];
  const structSize = sizes[0] + sizes[1] + sizes[2];
  const tableLength = structSize * xrefTableData.length;
  newXref.set("W", sizes);
  newXref.set("Length", tableLength);

  buffer.push(`${refForXrefTable.num} ${refForXrefTable.gen} obj\n`);
  await writeDict(newXref, buffer);
  buffer.push(" stream\n");

  const bufferLen = buffer.reduce((a, str) => a + str.length, 0);
  const footer = `\nendstream\nendobj\nstartxref\n${baseOffset}\n%%EOF\n`;
  const array = new Uint8Array(
    originalData.length + bufferLen + tableLength + footer.length,
  );

  // Original data
  array.set(originalData);
  let offset = originalData.length;

  // New data
  for (const str of buffer) {
    writeString(str, offset, array);
    offset += str.length;
  }

  // New xref table
  for (const [type, objOffset, gen] of xrefTableData) {
    offset = writeInt(type, sizes[0], offset, array);
    offset = writeInt(objOffset, sizes[1], offset, array);
    offset = writeInt(gen, sizes[2], offset, array);
  }

  // Add the footer
  writeString(footer, offset, array);

  return array;
}
/*80--------------------------------------------------------------------------*/
