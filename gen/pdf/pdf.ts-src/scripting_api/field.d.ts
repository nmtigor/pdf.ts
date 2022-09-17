import { FieldObject } from "../core/annotation.js";
import { AnnotActions } from "../core/core_utils.js";
import { CMYK, RGB } from "../shared/scripting_utils.js";
import { DocWrapped, FieldWrapped } from "./app.js";
import { CorrectColor } from "./color.js";
import { ScriptingActionName } from "./common.js";
import { Event } from "./event.js";
import { PDFObject, ScriptingData, SendData } from "./pdf_object.js";
interface _Item {
    displayValue: string;
    exportValue: string;
}
export interface SendFieldData extends SendData {
    indices?: number[];
    clear?: undefined;
    remove?: number;
    insert?: {
        index: number;
    } & _Item;
    focus?: boolean;
    items?: _Item[];
    value?: string | number;
    selRange?: [number, number];
    formattedValue?: string | undefined;
    siblings?: unknown;
}
export interface ScriptingFieldData extends ScriptingData<SendFieldData> {
    alignment?: string;
    borderStyle?: string;
    buttonAlignX?: number;
    buttonAlignY?: number;
    buttonFitBounds: unknown;
    buttonPosition: unknown;
    buttonScaleHow: unknown;
    buttonScaleWhen: unknown;
    calcOrderIndex: unknown;
    charLimit: unknown;
    comb: unknown;
    commitOnSelChange: unknown;
    currentValueIndices?: number | number[];
    defaultStyle: unknown;
    defaultValue: string;
    doNotScroll: unknown;
    doNotSpellCheck: unknown;
    delay: unknown;
    display: unknown;
    doc: DocWrapped;
    editable: unknown;
    exportValues: string | string[];
    fileSelect: unknown;
    hidden: unknown;
    highlight: unknown;
    lineWidth: unknown;
    multiline: unknown;
    multipleSelection?: boolean;
    name: string;
    password: unknown;
    print: unknown;
    radiosInUnison: unknown;
    readonly: unknown;
    rect: unknown;
    required: unknown;
    richText: unknown;
    richValue: unknown;
    rotation?: number;
    style: unknown;
    submitName: unknown;
    textFont: unknown;
    textSize: unknown;
    type: unknown;
    userName: unknown;
    actions?: AnnotActions;
    browseForFileToSubmit?: () => void;
    fieldPath: string;
    fillColor?: CorrectColor;
    items?: _Item[];
    page?: number;
    strokeColor?: [string, number];
    textColor?: [string, ...([number] | RGB | CMYK)];
    value?: string | string[];
    kidIds?: string[];
    siblings?: unknown;
    globalEval: (code: string) => unknown;
    appObjects: Record<string, FieldWrapped>;
}
export declare class Field extends PDFObject<SendFieldData> {
    alignment: string;
    borderStyle: string;
    buttonAlignX: number;
    buttonAlignY: number;
    buttonFitBounds: unknown;
    buttonPosition: unknown;
    buttonScaleHow: unknown;
    buttonScaleWhen: unknown;
    calcOrderIndex: unknown;
    charLimit: unknown;
    comb: unknown;
    commitOnSelChange: unknown;
    defaultStyle: unknown;
    defaultValue: string;
    doNotScroll: unknown;
    doNotSpellCheck: unknown;
    delay: unknown;
    display: unknown;
    doc: import("./doc.js").Doc;
    editable: unknown;
    exportValues: string | string[];
    fileSelect: unknown;
    hidden: unknown;
    highlight: unknown;
    lineWidth: unknown;
    multiline: unknown;
    multipleSelection: boolean;
    name: string;
    password: unknown;
    print: unknown;
    radiosInUnison: unknown;
    readonly: unknown;
    rect: unknown;
    required: unknown;
    richText: unknown;
    richValue: unknown;
    style: unknown;
    submitName: unknown;
    textFont: unknown;
    textSize: unknown;
    type: unknown;
    userName: unknown;
    _actions: import("./common.js").ScriptingActions;
    _browseForFileToSubmit: (() => void) | undefined;
    browseForFileToSubmit(): void;
    _buttonCaption?: [string, string, string];
    buttonGetCaption(nFace?: number): string;
    buttonSetCaption(cCaption: string, nFace?: number): void;
    _buttonIcon?: [unknown | undefined, unknown | undefined, unknown | undefined];
    buttonGetIcon(nFace?: number): unknown;
    buttonSetIcon(oIcon: unknown, nFace?: number): void;
    _children?: Field[];
    _currentValueIndices: number | number[];
    _document: DocWrapped;
    _fieldPath: string;
    _fillColor: CorrectColor;
    get fillColor(): CorrectColor;
    set fillColor(color: CorrectColor);
    get bgColor(): CorrectColor;
    set bgColor(color: CorrectColor);
    _isChoice: boolean;
    _items: _Item[];
    get numItems(): number;
    set numItems(_: number);
    _page: number;
    get page(): number;
    set page(_: number);
    _strokeColor: [string, number];
    get strokeColor(): [string, number];
    set strokeColor(color: [string, number]);
    _textColor: [string, number] | [string, number, number, number] | [string, number, number, number, number];
    get textColor(): [string, number] | [string, number, number, number] | [string, number, number, number, number];
    set textColor(color: [string, number] | [string, number, number, number] | [string, number, number, number, number]);
    _value: string | string[];
    get valueAsString(): string;
    set valueAsString(_: string);
    _kidIds: string[] | undefined;
    _fieldType: number;
    _siblings: unknown;
    _rotation: number;
    get rotation(): number;
    set rotation(angle: number);
    _globalEval: (code: string) => unknown;
    _appObjects: Record<string, FieldWrapped>;
    constructor(data: ScriptingFieldData);
    get currentValueIndices(): number | (number | undefined)[] | undefined;
    set currentValueIndices(indices: number | (number | undefined)[] | undefined);
    get borderColor(): [string, number];
    set borderColor(color: [string, number]);
    get fgColor(): [string, number] | [string, number, number, number] | [string, number, number, number, number];
    set fgColor(color: [string, number] | [string, number, number, number] | [string, number, number, number, number]);
    get value(): string | string[];
    set value(value: string | string[]);
    buttonImportIcon(cPath?: undefined, nPave?: number): void;
    checkThisBox(nWidget: number, bCheckIt?: boolean): void;
    clearItems(): void;
    deleteItemAt(nIdx?: number): void;
    getItemAt(nIdx?: number, bExportValue?: boolean): string;
    getArray(): Field[];
    getLock(): undefined;
    isBoxChecked(nWidget: number): boolean;
    isDefaultChecked(nWidget: number): boolean;
    insertItemAt(cName: string, cExport?: string, nIdx?: number): void;
    setAction(cTrigger: ScriptingActionName, cScript: string): void;
    setFocus(): void;
    setItems(oArray: (unknown | unknown[])[]): void;
    setLock(): void;
    signatureGetModifications(): void;
    signatureGetSeedValue(): void;
    signatureInfo(): void;
    signatureSetSeedValue(): void;
    signatureSign(): void;
    signatureValidate(): void;
    _isButton(): boolean;
    _reset(): void;
    _getExportValue(state: string | number): string;
    _runActions(event: Event): boolean;
}
export declare class RadioButtonField extends Field {
    _radioIds: (string | undefined)[];
    _radioActions: import("./common.js").ScriptingActions[];
    constructor(otherButtons: FieldObject[], data: ScriptingFieldData);
    get value(): string | string[];
    set value(value: string | string[]);
    checkThisBox(nWidget: number, bCheckIt?: boolean): void;
    isBoxChecked(nWidget: number): boolean;
    isDefaultChecked(nWidget: number): boolean;
    _getExportValue(state: string | number): string;
    _runActions(event: Event): boolean;
    _isButton(): boolean;
}
export declare class CheckboxField extends RadioButtonField {
    get value(): string | string[];
    set value(value: string | string[]);
    _getExportValue(state: string | number): string;
    isBoxChecked(nWidget: number): boolean;
    isDefaultChecked(nWidget: number): boolean;
    checkThisBox(nWidget: number, bCheckIt?: boolean): void;
}
export {};
//# sourceMappingURL=field.d.ts.map