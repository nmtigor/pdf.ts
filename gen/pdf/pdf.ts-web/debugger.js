/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/debugger.ts
 * @license Apache-2.0
 ******************************************************************************/
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
import { html } from "../../lib/dom.js";
import { isObjectLike } from "../../lib/jslang.js";
import { OPS } from "../pdf.ts-src/pdf.js";
/*80--------------------------------------------------------------------------*/
// const { OPS } = (globalThis as any).pdfjsLib || (await import("../pdf.ts-src/pdf.ts"));
const opMap = Object.create(null);
for (const key in OPS) {
    opMap[OPS[key]] = key;
}
var FontInspector_;
(function (FontInspector_) {
    let fonts;
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
    function selectFont(fontName, show) {
        const divs = document.querySelectorAll(`span[${fontAttribute}=${fontName}]`);
        for (const div of divs) {
            div.className = show ? "debuggerShowText" : "debuggerHideText";
        }
    }
    function textLayerClick(e) {
        if (!e.target.dataset.fontName ||
            e.target.tagName.toUpperCase() !== "SPAN") {
            return;
        }
        const fontName = e.target.dataset.fontName;
        const selects = document.getElementsByTagName("input");
        for (const select of selects) {
            if (select.dataset.fontName !== fontName) {
                continue;
            }
            select.checked = !select.checked;
            selectFont(fontName, select.checked);
            select.scrollIntoView();
        }
    }
    // Properties/functions needed by PDFBug.
    FontInspector_.id = "FontInspector";
    FontInspector_.name = "Font Inspector";
    function init() {
        const panel = FontInspector_.panel;
        const tmp = html("button");
        tmp.on("click", resetSelection);
        tmp.textContent = "Refresh";
        panel.append(tmp);
        fonts = html("div");
        panel.append(fonts);
    }
    FontInspector_.init = init;
    function cleanup() {
        fonts.textContent = "";
    }
    FontInspector_.cleanup = cleanup;
    FontInspector_.enabled = false;
    Object.defineProperty(FontInspector_, "active", {
        set: function (value) {
            _active = value;
            if (_active) {
                document.body.on("click", textLayerClick, true);
                resetSelection();
            }
            else {
                document.body.off("click", textLayerClick, true);
                removeSelection();
            }
        },
        get: () => _active,
    });
    // FontInspector specific functions.
    function fontAdded(fontObj, url) {
        function properties(obj, list) {
            const moreInfo = html("table");
            for (const entry of list) {
                const tr = html("tr");
                const td1 = html("td");
                td1.textContent = entry;
                tr.append(td1);
                const td2 = html("td");
                td2.textContent = obj[entry].toString();
                tr.append(td2);
                moreInfo.append(tr);
            }
            return moreInfo;
        }
        const moreInfo = fontObj.css
            ? properties(fontObj, ["baseFontName"])
            : properties(fontObj, ["name", "type"]);
        const fontName = fontObj.loadedName;
        const font = html("div");
        const name = html("span");
        name.textContent = fontName;
        let download;
        if (!fontObj.css) {
            download = html("a");
            if (url) {
                download.href = (/url\(['"]?([^)"']+)/.exec(url))[1];
            }
            else if (fontObj.data) {
                download.href = URL.createObjectURL(new Blob([fontObj.data], { type: fontObj.mimetype }));
            }
            download.textContent = "Download";
        }
        const logIt = html("a");
        logIt.href = "";
        logIt.textContent = "Log";
        logIt.on("click", (event) => {
            event.preventDefault();
            console.log(fontObj);
        });
        const select = html("input");
        select.setAttribute("type", "checkbox");
        select.dataset.fontName = fontName;
        select.on("click", () => {
            selectFont(fontName, select.checked);
        });
        if (download) {
            font.append(select, name, " ", download, " ", logIt, moreInfo);
        }
        else {
            font.append(select, name, " ", logIt, moreInfo);
        }
        fonts.append(font);
        // Somewhat of a hack, should probably add a hook for when the text layer
        // is done rendering.
        setTimeout(() => {
            if (FontInspector_.active) {
                resetSelection();
            }
        }, 2000);
    }
    FontInspector_.fontAdded = fontAdded;
})(FontInspector_ || (FontInspector_ = {}));
// Manages all the page steppers.
var StepperManager_;
(function (StepperManager_) {
    let steppers = [];
    let stepperDiv;
    let stepperControls;
    let stepperChooser;
    let breakPoints = Object.create(null);
    // Properties/functions needed by PDFBug.
    StepperManager_.id = "Stepper";
    StepperManager_.name = "Stepper";
    function init() {
        stepperControls = html("div");
        stepperChooser = html("select");
        stepperChooser.on("change", function () {
            StepperManager_.selectStepper(this.value);
        });
        stepperControls.append(stepperChooser);
        stepperDiv = html("div");
        StepperManager_.panel.append(stepperControls);
        StepperManager_.panel.append(stepperDiv);
        if (sessionStorage.getItem("pdfjsBreakPoints")) {
            breakPoints = JSON.parse(sessionStorage.getItem("pdfjsBreakPoints"));
        }
    }
    StepperManager_.init = init;
    function cleanup() {
        stepperChooser.textContent = "";
        stepperDiv.textContent = "";
        steppers = [];
    }
    StepperManager_.cleanup = cleanup;
    StepperManager_.enabled = false;
    StepperManager_.active = false;
    // Stepper specific functions.
    function create(pageIndex) {
        const debug = html("div");
        debug.id = "stepper" + pageIndex;
        debug.hidden = true;
        debug.className = "stepper";
        stepperDiv.append(debug);
        const b = html("option");
        b.textContent = "Page " + (pageIndex + 1);
        b.value = pageIndex;
        stepperChooser.append(b);
        const initBreakPoints = breakPoints[pageIndex] || [];
        const stepper = new Stepper(debug, pageIndex, initBreakPoints);
        steppers.push(stepper);
        if (steppers.length === 1) {
            StepperManager_.selectStepper(pageIndex, false);
        }
        return stepper;
    }
    StepperManager_.create = create;
    function selectStepper(pageIndex, selectPanel) {
        pageIndex |= 0;
        if (selectPanel) {
            StepperManager_.manager.selectPanel(StepperManager_);
        }
        for (const stepper of steppers) {
            stepper.panel.hidden = stepper.pageIndex !== pageIndex;
        }
        for (const option of stepperChooser.options) {
            option.selected = option.value === pageIndex;
        }
    }
    StepperManager_.selectStepper = selectStepper;
    function saveBreakPoints(pageIndex, bps) {
        breakPoints[pageIndex] = bps;
        sessionStorage.setItem("pdfjsBreakPoints", JSON.stringify(breakPoints));
    }
    StepperManager_.saveBreakPoints = saveBreakPoints;
})(StepperManager_ || (StepperManager_ = {}));
/**
 * The stepper for each page's operatorList.
 */
export class Stepper {
    /**
     * Shorter way to create element and optionally set textContent.
     */
    #c(tag, textContent) {
        const d = html(tag);
        if (textContent) {
            d.textContent = textContent;
        }
        return d;
    }
    #simplifyArgs(args) {
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
            const MAX_ITEMS = 10, simpleArgs = [];
            let i, ii;
            for (i = 0, ii = Math.min(MAX_ITEMS, args.length); i < ii; i++) {
                simpleArgs.push(this.#simplifyArgs(args[i]));
            }
            if (i < args.length) {
                simpleArgs.push("...");
            }
            return simpleArgs;
        }
        const simpleObj = {};
        for (const key in args) {
            simpleObj[key] = this.#simplifyArgs(args[key]);
        }
        return simpleObj;
    }
    panel;
    breakPoint;
    nextBreakPoint;
    pageIndex;
    breakPoints;
    currentIdx;
    operatorListIdx;
    indentLevel;
    table;
    constructor(panel, pageIndex, initialBreakPoints) {
        this.panel = panel;
        const content = this.#c("div", "c=continue, s=step");
        const table = this.#c("table");
        this.breakPoint = 0;
        this.pageIndex = pageIndex;
        this.breakPoints = initialBreakPoints;
        this.currentIdx = -1;
        this.operatorListIdx = 0;
        this.indentLevel = 0;
    }
    init(operatorList) {
        const panel = this.panel;
        const content = this.#c("div", "c=continue, s=step");
        const table = this.#c("table");
        content.append(table);
        table.cellSpacing = 0;
        const headerRow = this.#c("tr");
        table.append(headerRow);
        headerRow.append(this.#c("th", "Break"), this.#c("th", "Idx"), this.#c("th", "fn"), this.#c("th", "args"));
        panel.append(content);
        this.table = table;
        this.updateOperatorList(operatorList);
    }
    updateOperatorList(operatorList) {
        const self = this;
        function cboxOnClick(ev) {
            const x = +this.dataset.idx;
            if (this.checked) {
                self.breakPoints.push(x);
            }
            else {
                self.breakPoints.splice(self.breakPoints.indexOf(x), 1);
            }
            StepperManager_.saveBreakPoints(self.pageIndex, self.breakPoints);
        }
        const MAX_OPERATORS_COUNT = 15000;
        if (this.operatorListIdx > MAX_OPERATORS_COUNT) {
            return;
        }
        const chunk = document.createDocumentFragment();
        const operatorsToDisplay = Math.min(MAX_OPERATORS_COUNT, operatorList.fnArray.length);
        for (let i = this.operatorListIdx; i < operatorsToDisplay; i++) {
            const line = this.#c("tr");
            line.className = "line";
            line.dataset.idx = i;
            chunk.append(line);
            const checked = this.breakPoints.includes(i);
            const args = operatorList.argsArray[i] || [];
            const breakCell = this.#c("td");
            const cbox = this.#c("input");
            cbox.type = "checkbox";
            cbox.className = "points";
            cbox.checked = checked;
            cbox.dataset.idx = i;
            cbox.onclick = cboxOnClick;
            breakCell.append(cbox);
            line.append(breakCell, this.#c("td", i.toString()));
            const fn = opMap[operatorList.fnArray[i]];
            let decArgs = args;
            if (fn === "showText") {
                const glyphs = args[0];
                const charCodeRow = this.#c("tr");
                const fontCharRow = this.#c("tr");
                const unicodeRow = this.#c("tr");
                for (const glyph of glyphs) {
                    if (isObjectLike(glyph)) {
                        charCodeRow.append(this.#c("td", glyph.originalCharCode));
                        fontCharRow.append(this.#c("td", glyph.fontChar));
                        unicodeRow.append(this.#c("td", glyph.unicode));
                    }
                    else {
                        // null or number
                        const advanceEl = this.#c("td", glyph);
                        advanceEl.classList.add("advance");
                        charCodeRow.append(advanceEl);
                        fontCharRow.append(this.#c("td"));
                        unicodeRow.append(this.#c("td"));
                    }
                }
                decArgs = this.#c("td");
                const table = this.#c("table");
                table.classList.add("showText");
                decArgs.append(table);
                table.append(charCodeRow);
                table.append(fontCharRow);
                table.append(unicodeRow);
            }
            else if (fn === "restore" && this.indentLevel > 0) {
                this.indentLevel--;
            }
            line.append(this.#c("td", " ".repeat(this.indentLevel * 2) + fn));
            if (fn === "save") {
                this.indentLevel++;
            }
            if (decArgs instanceof HTMLElement) {
                line.append(decArgs);
            }
            else {
                line.append(this.#c("td", JSON.stringify(this.#simplifyArgs(decArgs))));
            }
        }
        if (operatorsToDisplay < operatorList.fnArray.length) {
            const lastCell = this.#c("td", "...");
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
    breakIt(idx, callback) {
        StepperManager_.selectStepper(this.pageIndex, true);
        this.currentIdx = idx;
        const listener = (evt) => {
            switch (evt.keyCode) {
                case 83: // step
                    document.off("keydown", listener);
                    this.nextBreakPoint = this.currentIdx + 1;
                    this.goTo(-1);
                    callback();
                    break;
                case 67: // continue
                    document.off("keydown", listener);
                    this.nextBreakPoint = this.getNextBreakPoint();
                    this.goTo(-1);
                    callback();
                    break;
            }
        };
        document.on("keydown", listener);
        this.goTo(idx);
    }
    goTo(idx) {
        const allRows = this.panel
            .getElementsByClassName("line");
        for (const row of allRows) {
            if (row.dataset.idx === idx) {
                row.style.backgroundColor = "rgb(251,250,207)";
                row.scrollIntoView();
            }
            else {
                row.style.backgroundColor = undefined;
            }
        }
    }
}
var Stats_;
(function (Stats_) {
    let stats = [];
    function clear(node) {
        node.textContent = ""; // Remove any `node` contents from the DOM.
    }
    function getStatIndex(pageNumber) {
        for (const [i, stat] of stats.entries()) {
            if (stat.pageNumber === pageNumber) {
                return i;
            }
        }
        return false;
    }
    // Properties/functions needed by PDFBug.
    Stats_.id = "Stats";
    Stats_.name = "Stats";
    function init() { }
    Stats_.init = init;
    Stats_.enabled = false;
    Stats_.active = false;
    // Stats specific functions.
    function add(pageNumber, stat) {
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
        clear(Stats_.panel);
        for (const entry of stats) {
            Stats_.panel.append(entry.div);
        }
    }
    Stats_.add = add;
    function cleanup() {
        stats = [];
        clear(Stats_.panel);
    }
    Stats_.cleanup = cleanup;
})(Stats_ || (Stats_ = {}));
/**
 * Manages all the debugging tools.
 */
export class PDFBug {
    static #buttons = [];
    static #activePanel;
    static tools = [
        FontInspector_,
        StepperManager_,
        Stats_,
    ];
    static enable(ids) {
        const all = ids.length === 1 && ids[0] === "all";
        const tools = this.tools;
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
    static init(container, ids) {
        this.loadCSS();
        this.enable(ids);
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
        container.style.right = "var(--panel-width)";
        // Initialize all the debugging tools.
        for (const tool of this.tools) {
            const panel = html("div");
            const panelButton = html("button");
            panelButton.textContent = tool.name;
            panelButton.on("click", (event) => {
                event.preventDefault();
                this.selectPanel(tool);
            });
            controls.append(panelButton);
            panels.append(panel);
            tool.panel = panel;
            tool.manager = PDFBug;
            if (tool.enabled) {
                tool.init();
            }
            else {
                panel.textContent =
                    `${tool.name} is disabled. To enable add "${tool.id}" to ` +
                        "the pdfBug parameter and refresh (separate multiple by commas).";
            }
            this.#buttons.push(panelButton);
        }
        this.selectPanel(0);
    }
    static loadCSS() {
        const { url } = import.meta;
        const link = html("link");
        link.rel = "stylesheet";
        link.href = url.replace(/\.mjs$/, ".css");
        document.head.append(link);
    }
    static cleanup() {
        for (const tool of this.tools) {
            if (tool.enabled) {
                tool.cleanup();
            }
        }
    }
    static selectPanel(index) {
        if (typeof index !== "number") {
            index = PDFBug.tools.indexOf(index);
        }
        if (index === this.#activePanel) {
            return;
        }
        this.#activePanel = index;
        for (const [j, tool] of PDFBug.tools.entries()) {
            const isActive = j === index;
            this.#buttons[j].classList.toggle("active", isActive);
            tool.active = isActive;
            tool.panel.hidden = !isActive;
        }
    }
}
globalThis.FontInspector = FontInspector_;
globalThis.StepperManager = StepperManager_;
globalThis.Stats = Stats_;
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=debugger.js.map