import { PDFDocumentProxy } from "../pdf.ts-src/pdf.js";
import { EventBus } from "./event_utils.js";
export interface BaseTreeViewerCtorP {
    /**
     * The viewer element.
     */
    container: HTMLDivElement;
    /**
     * The application event bus.
     */
    eventBus: EventBus;
}
export declare abstract class BaseTreeViewer {
    #private;
    container: HTMLDivElement;
    eventBus: EventBus;
    protected _pdfDocument: PDFDocumentProxy | undefined;
    constructor(options: BaseTreeViewerCtorP);
    reset(): void;
    protected abstract _dispatchEvent(count?: number): void;
    protected abstract _bindLink(element: HTMLAnchorElement, params: object): void;
    protected _normalizeTextContent(str: string): string;
    /**
     * Prepend a button before a tree item which allows the user to collapse or
     * expand all tree items at that level; see `#toggleTreeItem`.
     */
    protected _addToggleButton(div: HTMLDivElement, hidden?: boolean): void;
    /**
     * Collapse or expand all subtrees of the `container`.
     */
    protected toggleAllTreeItems$(): void;
    /** @final */
    protected finishRendering$(fragment: DocumentFragment, count: number, hasAnyNesting?: boolean): void;
    abstract render(params: object): void;
    protected _updateCurrentTreeItem(treeItem?: HTMLElement | null): void;
    protected _scrollToCurrentTreeItem(treeItem: HTMLElement | null): void;
}
//# sourceMappingURL=base_tree_viewer.d.ts.map