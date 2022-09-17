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

import { html } from "../../lib/dom.ts";
import { FontFaceObject, OpListIR, OPS, OPSName } from "../pdf.ts-src/pdf.ts";
/*80--------------------------------------------------------------------------*/

interface _PdfjsLib {
  OPS: typeof OPS;
}

type _Tool = typeof _FontInspector | typeof _StepperManager | typeof _Stats;

let opMap: Record<OPS, OPSName>;

namespace _FontInspector {
  let fonts: HTMLDivElement;
  let _active = false;
  const fontAttribute = "data-font-name";
  function removeSelection() {
    const divs = document.querySelectorAll(`span[${fontAttribute}]`);
    for (const div of divs) {
      div.className = "";
    }
  }
  function resetSelection() {
    const divs = document.querySelectorAll(`span[${fontAttribute}]`);
    for (const div of divs) {
      div.className = "debuggerHideText";
    }
  }
  function selectFont(fontName: string, show: boolean) {
    const divs = document.querySelectorAll(
      `span[${fontAttribute}=${fontName}]`,
    );
    for (const div of divs) {
      div.className = show ? "debuggerShowText" : "debuggerHideText";
    }
  }
  function textLayerClick(e: MouseEvent) {
    if (
      !(<HTMLElement> e.target).dataset.fontName ||
      (<HTMLElement> e.target).tagName.toUpperCase() !== "SPAN"
    ) {
      return;
    }
    const fontName = (<HTMLElement> e.target).dataset.fontName;
    const selects = document.getElementsByTagName("input");
    for (const select of selects) {
      if (select.dataset.fontName !== fontName) {
        continue;
      }
      select.checked = !select.checked;
      selectFont(fontName!, select.checked);
      select.scrollIntoView();
    }
  }

  // Properties/functions needed by PDFBug.
  export const id = "FontInspector";
  export const name = "Font Inspector";
  export let panel: HTMLDivElement;
  export let manager: typeof PDFBug;
  export function init(pdfjsLib: _PdfjsLib) {
    const panel = _FontInspector.panel;
    const tmp = html("button");
    tmp.addEventListener("click", resetSelection);
    tmp.textContent = "Refresh";
    panel.append(tmp);

    fonts = html("div");
    panel.append(fonts);
  }
  export function cleanup() {
    fonts.textContent = "";
  }
  export let enabled = false;
  export declare let active: boolean;
  Object.defineProperty(_FontInspector, "active", {
    set: function (value: boolean) {
      _active = value;
      if (_active) {
        document.body.addEventListener("click", textLayerClick, true);
        resetSelection();
      } else {
        document.body.removeEventListener("click", textLayerClick, true);
        removeSelection();
      }
    },
    get: () => _active,
  });
  // FontInspector specific functions.
  export function fontAdded(fontObj: FontFaceObject, url?: string) {
    function properties(obj: FontFaceObject, list: string[]) {
      const moreInfo = html("table");
      for (const entry of list) {
        const tr = html("tr");
        const td1 = html("td");
        td1.textContent = entry;
        tr.append(td1);
        const td2 = html("td");
        td2.textContent = obj[<keyof FontFaceObject> entry]!.toString();
        tr.append(td2);
        moreInfo.append(tr);
      }
      return moreInfo;
    }
    const moreInfo = properties(fontObj, ["name", "type"]);
    const fontName = fontObj.loadedName!;
    const font = html("div");
    const name = html("span");
    name.textContent = fontName;
    const download = html("a");
    if (url) {
      download.href = (/url\(['"]?([^)"']+)/.exec(url)!)[1];
    } else if (fontObj.data) {
      download.href = URL.createObjectURL(
        new Blob([fontObj.data], { type: fontObj.mimetype! }),
      );
    }
    download.textContent = "Download";
    const logIt = html("a");
    logIt.href = "";
    logIt.textContent = "Log";
    logIt.addEventListener("click", (event) => {
      event.preventDefault();
      console.log(fontObj);
    });
    const select = html("input");
    select.setAttribute("type", "checkbox");
    select.dataset.fontName = fontName;
    select.addEventListener("click", () => {
      selectFont(fontName, select.checked);
    });
    font.append(select, name, " ", download, " ", logIt, moreInfo);
    fonts.append(font);
    // Somewhat of a hack, should probably add a hook for when the text layer
    // is done rendering.
    setTimeout(() => {
      if (_FontInspector.active) {
        resetSelection();
      }
    }, 2000);
  }
}

// Manages all the page steppers.
namespace _StepperManager {
  let steppers: Stepper[] = [];
  let stepperDiv: HTMLDivElement;
  let stepperControls: HTMLDivElement;
  let stepperChooser: HTMLSelectElement;
  let breakPoints: Record<number, number[]> = Object.create(null);

  // Properties/functions needed by PDFBug.
  export const id = "Stepper";
  export const name = "Stepper";
  export let panel: HTMLDivElement;
  export let manager: typeof PDFBug;
  export function init(pdfjsLib: _PdfjsLib) {
    stepperControls = html("div");
    stepperChooser = html("select");
    stepperChooser.addEventListener("change", function (event) {
      _StepperManager.selectStepper(+this.value);
    });
    stepperControls.append(stepperChooser);
    stepperDiv = html("div");
    _StepperManager.panel.append(stepperControls);
    _StepperManager.panel.append(stepperDiv);
    if (sessionStorage.getItem("pdfjsBreakPoints")) {
      breakPoints = JSON.parse(sessionStorage.getItem("pdfjsBreakPoints")!);
    }

    opMap = Object.create(null);
    for (const key in pdfjsLib.OPS) {
      opMap[pdfjsLib.OPS[<OPSName> key]] = <OPSName> key;
    }
  }
  export function cleanup() {
    stepperChooser.textContent = "";
    stepperDiv.textContent = "";
    steppers = [];
  }
  export let enabled = false;
  export let active = false;
  // Stepper specific functions.
  export function create(pageIndex: number) {
    const debug = html("div");
    debug.id = "stepper" + pageIndex;
    debug.hidden = true;
    debug.className = "stepper";
    stepperDiv.append(debug);
    const b = html("option");
    b.textContent = "Page " + (pageIndex + 1);
    b.value = <any> pageIndex;
    stepperChooser.append(b);
    const initBreakPoints = breakPoints[pageIndex] || [];
    const stepper = new Stepper(debug, pageIndex, initBreakPoints);
    steppers.push(stepper);
    if (steppers.length === 1) {
      _StepperManager.selectStepper(pageIndex, false);
    }
    return stepper;
  }
  export function selectStepper(pageIndex: number, selectPanel?: boolean) {
    pageIndex |= 0;
    if (selectPanel) {
      _StepperManager.manager.selectPanel(_StepperManager);
    }
    for (const stepper of steppers) {
      stepper.panel.hidden = stepper.pageIndex !== pageIndex;
    }
    for (const option of stepperChooser.options) {
      option.selected = (+option.value | 0) === pageIndex;
    }
  }
  export function saveBreakPoints(pageIndex: number, bps: number[]) {
    breakPoints[pageIndex] = bps;
    sessionStorage.setItem("pdfjsBreakPoints", JSON.stringify(breakPoints));
  }
}

// The stepper for each page's operatorList.
namespace NsStepper {
  function simplifyArgs(args: any): any {
    if (typeof args === "string") {
      const MAX_STRING_LENGTH = 75;
      return args.length <= MAX_STRING_LENGTH
        ? args
        : args.substring(0, MAX_STRING_LENGTH) + "...";
    }
    if (typeof args !== "object" || args === undefined) {
      return args;
    }
    if ("length" in args) {
      // array
      const MAX_ITEMS = 10,
        simpleArgs = [];
      let i, ii;
      for (i = 0, ii = Math.min(MAX_ITEMS, args.length); i < ii; i++) {
        simpleArgs.push(simplifyArgs(args[i]));
      }
      if (i < args.length) {
        simpleArgs.push("...");
      }
      return simpleArgs;
    }
    const simpleObj: Record<string, any> = {};
    for (const key in args) {
      simpleObj[key] = simplifyArgs(args[key]);
    }
    return simpleObj;
  }

  // eslint-disable-next-line no-shadow
  export class Stepper {
    panel;
    breakPoint;
    nextBreakPoint: number | undefined;
    pageIndex;
    breakPoints;
    currentIdx;
    operatorListIdx;
    indentLevel;

    table!: HTMLTableElement;

    constructor(
      panel: HTMLDivElement,
      pageIndex: number,
      initialBreakPoints: number[],
    ) {
      this.panel = panel;
      this.breakPoint = 0;
      this.pageIndex = pageIndex;
      this.breakPoints = initialBreakPoints;
      this.currentIdx = -1;
      this.operatorListIdx = 0;
      this.indentLevel = 0;
    }

    init(operatorList: OpListIR) {
      const panel = this.panel;
      const content = html("div", "c=continue, s=step");
      const table = html("table");
      content.append(table);
      table.cellSpacing = <any> 0;
      const headerRow = html("tr");
      table.append(headerRow);
      headerRow.append(
        html("th", "Break"),
        html("th", "Idx"),
        html("th", "fn"),
        html("th", "args"),
      );
      panel.append(content);
      this.table = table;
      this.updateOperatorList(operatorList);
    }

    updateOperatorList(operatorList: OpListIR) {
      const self = this;

      function cboxOnClick(this: HTMLInputElement, ev: MouseEvent) {
        const x = +this.dataset.idx!;
        if (this.checked) {
          self.breakPoints.push(x);
        } else {
          self.breakPoints.splice(self.breakPoints.indexOf(x), 1);
        }
        _StepperManager.saveBreakPoints(self.pageIndex, self.breakPoints);
      }

      const MAX_OPERATORS_COUNT = 15000;
      if (this.operatorListIdx > MAX_OPERATORS_COUNT) {
        return;
      }

      const chunk = document.createDocumentFragment();
      const operatorsToDisplay = Math.min(
        MAX_OPERATORS_COUNT,
        operatorList.fnArray.length,
      );
      for (let i = this.operatorListIdx; i < operatorsToDisplay; i++) {
        const line = html("tr");
        line.className = "line";
        line.dataset.idx = <any> i;
        chunk.append(line);
        const checked = this.breakPoints.includes(i);
        const args = operatorList.argsArray[i] || [];

        const breakCell = html("td");
        const cbox = html("input");
        cbox.type = "checkbox";
        cbox.className = "points";
        cbox.checked = checked;
        cbox.dataset.idx = <any> i;
        cbox.onclick = <typeof cbox.onclick> cboxOnClick;

        breakCell.append(cbox);
        line.append(breakCell, html("td", i.toString()));
        const fn = opMap[operatorList.fnArray[i]];
        let decArgs: any[] | Uint8ClampedArray | HTMLElement = args;
        if (fn === "showText") {
          const glyphs = args[0];
          const charCodeRow = html("tr");
          const fontCharRow = html("tr");
          const unicodeRow = html("tr");
          for (const glyph of glyphs) {
            if (typeof glyph === "object" && glyph !== null) {
              charCodeRow.append(html("td", glyph.originalCharCode));
              fontCharRow.append(html("td", glyph.fontChar));
              unicodeRow.append(html("td", glyph.unicode));
            } else {
              // null or number
              const advanceEl = html("td", glyph);
              advanceEl.classList.add("advance");
              charCodeRow.append(advanceEl);
              fontCharRow.append(html("td"));
              unicodeRow.append(html("td"));
            }
          }
          decArgs = html("td");
          const table = html("table");
          table.classList.add("showText");
          decArgs.append(table);
          table.append(charCodeRow);
          table.append(fontCharRow);
          table.append(unicodeRow);
        } else if (fn === "restore") {
          this.indentLevel--;
        }
        line.append(html("td", " ".repeat(this.indentLevel * 2) + fn));
        if (fn === "save") {
          this.indentLevel++;
        }

        if (decArgs instanceof HTMLElement) {
          line.append(decArgs);
        } else {
          line.append(html("td", JSON.stringify(simplifyArgs(decArgs))));
        }
      }
      if (operatorsToDisplay < operatorList.fnArray.length) {
        const lastCell = html("td", "...");
        lastCell.colSpan = 4;
        chunk.append(lastCell);
      }
      this.operatorListIdx = operatorList.fnArray.length;
      this.table.append(chunk);
    }

    getNextBreakPoint() {
      this.breakPoints.sort((a, b) => a - b);
      for (const breakPoint of this.breakPoints) {
        if (breakPoint > this.currentIdx) {
          return breakPoint;
        }
      }
      return undefined;
    }

    breakIt(idx: number, callback: () => void) {
      _StepperManager.selectStepper(this.pageIndex, true);
      this.currentIdx = idx;

      const listener = (evt: KeyboardEvent) => {
        switch (evt.keyCode) {
          case 83: // step
            document.removeEventListener("keydown", listener);
            this.nextBreakPoint = this.currentIdx + 1;
            this.goTo(-1);
            callback();
            break;
          case 67: // continue
            document.removeEventListener("keydown", listener);
            this.nextBreakPoint = this.getNextBreakPoint();
            this.goTo(-1);
            callback();
            break;
        }
      };
      document.addEventListener("keydown", listener);
      this.goTo(idx);
    }

    goTo(idx: number) {
      const allRows = <HTMLCollectionOf<SVGLineElement>> this.panel
        .getElementsByClassName("line");
      for (const row of allRows) {
        if ((<any> row.dataset.idx | 0) === idx) {
          row.style.backgroundColor = "rgb(251,250,207)";
          row.scrollIntoView();
        } else {
          row.style.backgroundColor = <any> undefined;
        }
      }
    }
  }
}
export import Stepper = NsStepper.Stepper;

namespace _Stats {
  interface _Stat {
    pageNumber: number;
    div: HTMLDivElement;
  }

  let stats: _Stat[] = [];
  function clear(node: HTMLDivElement) {
    node.textContent = ""; // Remove any `node` contents from the DOM.
  }
  function getStatIndex(pageNumber: number) {
    for (const [i, stat] of stats.entries()) {
      if (stat.pageNumber === pageNumber) {
        return i;
      }
    }
    return false;
  }

  // Properties/functions needed by PDFBug.
  export const id = "Stats";
  export const name = "Stats";
  export let panel: HTMLDivElement;
  export let manager: typeof PDFBug;
  export function init(pdfjsLib: _PdfjsLib) {}
  export let enabled = false;
  export let active = false;
  // Stats specific functions.
  export function add(pageNumber: number, stat: _Stat) {
    if (!stat) {
      return;
    }
    const statsIndex = getStatIndex(pageNumber);
    if (statsIndex !== false) {
      stats[statsIndex].div.remove();
      stats.splice(statsIndex, 1);
    }
    const wrapper = html("div");
    wrapper.className = "stats";
    const title = html("div");
    title.className = "title";
    title.textContent = "Page: " + pageNumber;
    const statsDiv = html("div");
    statsDiv.textContent = stat.toString();
    wrapper.append(title, statsDiv);
    stats.push({ pageNumber, div: wrapper });
    stats.sort((a, b) => a.pageNumber - b.pageNumber);
    clear(_Stats.panel);
    for (const entry of stats) {
      _Stats.panel.append(entry.div);
    }
  }
  export function cleanup() {
    stats = [];
    clear(_Stats.panel);
  }
}

// Manages all the debugging tools.
export namespace PDFBug {
  const panelWidth = 300;
  const buttons: HTMLButtonElement[] = [];
  let activePanel: number;

  export const tools = [
    _FontInspector,
    _StepperManager,
    _Stats,
  ];
  export function enable(ids: string[]) {
    const all = ids.length === 1 && ids[0] === "all";
    for (const tool of tools) {
      if (all || ids.includes(tool.id)) {
        tool.enabled = true;
      }
    }
    if (!all) {
      // Sort the tools by the order they are enabled.
      tools.sort((a, b) => {
        let indexA = ids.indexOf(a.id);
        indexA = indexA < 0 ? tools.length : indexA;
        let indexB = ids.indexOf(b.id);
        indexB = indexB < 0 ? tools.length : indexB;
        return indexA - indexB;
      });
    }
  }
  export function init(
    pdfjsLib: _PdfjsLib,
    container: HTMLDivElement,
    ids: string[],
  ) {
    loadCSS();
    enable(ids);
    /*
      * Basic Layout:
      * PDFBug
      *  Controls
      *  Panels
      *    Panel
      *    Panel
      *    ...
      */
    const ui = html("div");
    ui.id = "PDFBug";

    const controls = html("div");
    controls.setAttribute("class", "controls");
    ui.append(controls);

    const panels = html("div");
    panels.setAttribute("class", "panels");
    ui.append(panels);

    container.append(ui);
    container.style.right = panelWidth + "px";

    // Initialize all the debugging tools.
    for (const tool of tools) {
      const panel = html("div");
      const panelButton = html("button");
      panelButton.textContent = tool.name;
      panelButton.addEventListener("click", (event) => {
        event.preventDefault();
        PDFBug.selectPanel(tool);
      });
      controls.append(panelButton);
      panels.append(panel);
      tool.panel = panel;
      tool.manager = PDFBug;
      if (tool.enabled) {
        tool.init(pdfjsLib);
      } else {
        panel.textContent =
          `${tool.name} is disabled. To enable add "${tool.id}" to ` +
          "the pdfBug parameter and refresh (separate multiple by commas).";
      }
      buttons.push(panelButton);
    }
    PDFBug.selectPanel(0);
  }
  export function loadCSS() {
    const { url } = import.meta;

    const link = html("link");
    link.rel = "stylesheet";
    link.href = url.replace(/.js$/, ".css");

    document.head.append(link);
  }
  export function cleanup() {
    for (const tool of PDFBug.tools) {
      if (tool.enabled) {
        tool.cleanup();
      }
    }
  }
  export function selectPanel(index: number | _Tool) {
    if (typeof index !== "number") {
      index = PDFBug.tools.indexOf(index);
    }
    if (index === activePanel) {
      return;
    }
    activePanel = index;
    for (const [j, tool] of PDFBug.tools.entries()) {
      const isActive = j === index;
      buttons[j].classList.toggle("active", isActive);
      tool.active = isActive;
      tool.panel.hidden = !isActive;
    }
  }
}

declare global {
  var FontInspector: typeof _FontInspector;
  var StepperManager: typeof _StepperManager;
  var Stats: typeof _Stats;
}
(<any> globalThis).FontInspector = _FontInspector;
(<any> globalThis).StepperManager = _StepperManager;
(<any> globalThis).Stats = _Stats;
/*80--------------------------------------------------------------------------*/
