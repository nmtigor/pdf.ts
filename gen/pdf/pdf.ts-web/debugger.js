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
import { html } from "../../lib/dom.js";
let opMap;
var _FontInspector;
(function (_FontInspector) {
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
    _FontInspector.id = "FontInspector";
    _FontInspector.name = "Font Inspector";
    function init(pdfjsLib) {
        const panel = _FontInspector.panel;
        const tmp = html("button");
        tmp.addEventListener("click", resetSelection);
        tmp.textContent = "Refresh";
        panel.append(tmp);
        fonts = html("div");
        panel.append(fonts);
    }
    _FontInspector.init = init;
    function cleanup() {
        fonts.textContent = "";
    }
    _FontInspector.cleanup = cleanup;
    _FontInspector.enabled = false;
    Object.defineProperty(_FontInspector, "active", {
        set: function (value) {
            _active = value;
            if (_active) {
                document.body.addEventListener("click", textLayerClick, true);
                resetSelection();
            }
            else {
                document.body.removeEventListener("click", textLayerClick, true);
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
        const moreInfo = properties(fontObj, ["name", "type"]);
        const fontName = fontObj.loadedName;
        const font = html("div");
        const name = html("span");
        name.textContent = fontName;
        const download = html("a");
        if (url) {
            download.href = (/url\(['"]?([^)"']+)/.exec(url))[1];
        }
        else if (fontObj.data) {
            download.href = URL.createObjectURL(new Blob([fontObj.data], { type: fontObj.mimetype }));
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
    _FontInspector.fontAdded = fontAdded;
})(_FontInspector || (_FontInspector = {}));
// Manages all the page steppers.
var _StepperManager;
(function (_StepperManager) {
    let steppers = [];
    let stepperDiv;
    let stepperControls;
    let stepperChooser;
    let breakPoints = Object.create(null);
    // Properties/functions needed by PDFBug.
    _StepperManager.id = "Stepper";
    _StepperManager.name = "Stepper";
    function init(pdfjsLib) {
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
            breakPoints = JSON.parse(sessionStorage.getItem("pdfjsBreakPoints"));
        }
        opMap = Object.create(null);
        for (const key in pdfjsLib.OPS) {
            opMap[pdfjsLib.OPS[key]] = key;
        }
    }
    _StepperManager.init = init;
    function cleanup() {
        stepperChooser.textContent = "";
        stepperDiv.textContent = "";
        steppers = [];
    }
    _StepperManager.cleanup = cleanup;
    _StepperManager.enabled = false;
    _StepperManager.active = false;
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
            _StepperManager.selectStepper(pageIndex, false);
        }
        return stepper;
    }
    _StepperManager.create = create;
    function selectStepper(pageIndex, selectPanel) {
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
    _StepperManager.selectStepper = selectStepper;
    function saveBreakPoints(pageIndex, bps) {
        breakPoints[pageIndex] = bps;
        sessionStorage.setItem("pdfjsBreakPoints", JSON.stringify(breakPoints));
    }
    _StepperManager.saveBreakPoints = saveBreakPoints;
})(_StepperManager || (_StepperManager = {}));
// The stepper for each page's operatorList.
var NsStepper;
(function (NsStepper) {
    function simplifyArgs(args) {
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
                simpleArgs.push(simplifyArgs(args[i]));
            }
            if (i < args.length) {
                simpleArgs.push("...");
            }
            return simpleArgs;
        }
        const simpleObj = {};
        for (const key in args) {
            simpleObj[key] = simplifyArgs(args[key]);
        }
        return simpleObj;
    }
    // eslint-disable-next-line no-shadow
    class Stepper {
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
            this.breakPoint = 0;
            this.pageIndex = pageIndex;
            this.breakPoints = initialBreakPoints;
            this.currentIdx = -1;
            this.operatorListIdx = 0;
            this.indentLevel = 0;
        }
        init(operatorList) {
            const panel = this.panel;
            const content = html("div", "c=continue, s=step");
            const table = html("table");
            content.append(table);
            table.cellSpacing = 0;
            const headerRow = html("tr");
            table.append(headerRow);
            headerRow.append(html("th", "Break"), html("th", "Idx"), html("th", "fn"), html("th", "args"));
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
                _StepperManager.saveBreakPoints(self.pageIndex, self.breakPoints);
            }
            const MAX_OPERATORS_COUNT = 15000;
            if (this.operatorListIdx > MAX_OPERATORS_COUNT) {
                return;
            }
            const chunk = document.createDocumentFragment();
            const operatorsToDisplay = Math.min(MAX_OPERATORS_COUNT, operatorList.fnArray.length);
            for (let i = this.operatorListIdx; i < operatorsToDisplay; i++) {
                const line = html("tr");
                line.className = "line";
                line.dataset.idx = i;
                chunk.append(line);
                const checked = this.breakPoints.includes(i);
                const args = operatorList.argsArray[i] || [];
                const breakCell = html("td");
                const cbox = html("input");
                cbox.type = "checkbox";
                cbox.className = "points";
                cbox.checked = checked;
                cbox.dataset.idx = i;
                cbox.onclick = cboxOnClick;
                breakCell.append(cbox);
                line.append(breakCell, html("td", i.toString()));
                const fn = opMap[operatorList.fnArray[i]];
                let decArgs = args;
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
                        }
                        else {
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
                }
                else if (fn === "restore" && this.indentLevel > 0) {
                    this.indentLevel--;
                }
                line.append(html("td", " ".repeat(this.indentLevel * 2) + fn));
                if (fn === "save") {
                    this.indentLevel++;
                }
                if (decArgs instanceof HTMLElement) {
                    line.append(decArgs);
                }
                else {
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
        breakIt(idx, callback) {
            _StepperManager.selectStepper(this.pageIndex, true);
            this.currentIdx = idx;
            const listener = (evt) => {
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
        goTo(idx) {
            const allRows = this.panel
                .getElementsByClassName("line");
            for (const row of allRows) {
                if ((row.dataset.idx | 0) === idx) {
                    row.style.backgroundColor = "rgb(251,250,207)";
                    row.scrollIntoView();
                }
                else {
                    row.style.backgroundColor = undefined;
                }
            }
        }
    }
    NsStepper.Stepper = Stepper;
})(NsStepper || (NsStepper = {}));
export var Stepper = NsStepper.Stepper;
var _Stats;
(function (_Stats) {
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
    _Stats.id = "Stats";
    _Stats.name = "Stats";
    function init(pdfjsLib) { }
    _Stats.init = init;
    _Stats.enabled = false;
    _Stats.active = false;
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
        clear(_Stats.panel);
        for (const entry of stats) {
            _Stats.panel.append(entry.div);
        }
    }
    _Stats.add = add;
    function cleanup() {
        stats = [];
        clear(_Stats.panel);
    }
    _Stats.cleanup = cleanup;
})(_Stats || (_Stats = {}));
// Manages all the debugging tools.
export var PDFBug;
(function (PDFBug) {
    const panelWidth = 300;
    const buttons = [];
    let activePanel;
    PDFBug.tools = [
        _FontInspector,
        _StepperManager,
        _Stats,
    ];
    function enable(ids) {
        const all = ids.length === 1 && ids[0] === "all";
        for (const tool of PDFBug.tools) {
            if (all || ids.includes(tool.id)) {
                tool.enabled = true;
            }
        }
        if (!all) {
            // Sort the tools by the order they are enabled.
            PDFBug.tools.sort((a, b) => {
                let indexA = ids.indexOf(a.id);
                indexA = indexA < 0 ? PDFBug.tools.length : indexA;
                let indexB = ids.indexOf(b.id);
                indexB = indexB < 0 ? PDFBug.tools.length : indexB;
                return indexA - indexB;
            });
        }
    }
    PDFBug.enable = enable;
    function init(pdfjsLib, container, ids) {
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
        for (const tool of PDFBug.tools) {
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
            }
            else {
                panel.textContent =
                    `${tool.name} is disabled. To enable add "${tool.id}" to ` +
                        "the pdfBug parameter and refresh (separate multiple by commas).";
            }
            buttons.push(panelButton);
        }
        PDFBug.selectPanel(0);
    }
    PDFBug.init = init;
    function loadCSS() {
        const { url } = import.meta;
        const link = html("link");
        link.rel = "stylesheet";
        link.href = url.replace(/.js$/, ".css");
        document.head.append(link);
    }
    PDFBug.loadCSS = loadCSS;
    function cleanup() {
        for (const tool of PDFBug.tools) {
            if (tool.enabled) {
                tool.cleanup();
            }
        }
    }
    PDFBug.cleanup = cleanup;
    function selectPanel(index) {
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
    PDFBug.selectPanel = selectPanel;
})(PDFBug || (PDFBug = {}));
globalThis.FontInspector = _FontInspector;
globalThis.StepperManager = _StepperManager;
globalThis.Stats = _Stats;
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=debugger.js.map