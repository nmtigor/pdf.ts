/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
import { AnnotationLayer, } from "../pdf.ts-src/pdf.js";
import { NullL10n } from "./l10n_utils.js";
import { PresentationModeState } from "./ui_utils.js";
export class AnnotationLayerBuilder {
    pageDiv;
    pdfPage;
    linkService;
    downloadManager;
    imageResourcesPath;
    renderForms;
    l10n;
    annotationStorage;
    enableScripting;
    _hasJSActionsPromise;
    _fieldObjectsPromise;
    _annotationCanvasMap;
    _accessibilityManager;
    div;
    _cancelled = false;
    _eventBus;
    #numAnnotations = 0;
    #onPresentationModeChanged;
    constructor({ pageDiv, pdfPage, linkService, downloadManager, annotationStorage, imageResourcesPath = "", renderForms = true, l10n = NullL10n, enableScripting = false, hasJSActionsPromise, fieldObjectsPromise, annotationCanvasMap, accessibilityManager, }) {
        this.pageDiv = pageDiv;
        this.pdfPage = pdfPage;
        this.linkService = linkService;
        this.downloadManager = downloadManager;
        this.imageResourcesPath = imageResourcesPath;
        this.renderForms = renderForms;
        this.l10n = l10n;
        this.annotationStorage = annotationStorage;
        this.enableScripting = enableScripting;
        this._hasJSActionsPromise = hasJSActionsPromise || Promise.resolve(false);
        this._fieldObjectsPromise = fieldObjectsPromise ||
            Promise.resolve(undefined);
        this._annotationCanvasMap = annotationCanvasMap;
        this._accessibilityManager = accessibilityManager;
        this._eventBus = linkService.eventBus;
    }
    /**
     * @param viewport
     * @param intent (default value is 'display')
     * @return A promise that is resolved when rendering of the
     *   annotations is complete.
     */
    async render(viewport, intent = "display") {
        if (this.div) {
            if (this._cancelled || this.#numAnnotations === 0) {
                return;
            }
            // If an annotationLayer already exists, refresh its children's
            // transformation matrices.
            AnnotationLayer.update({
                viewport: viewport.clone({ dontFlip: true }),
                div: this.div,
                annotationCanvasMap: this._annotationCanvasMap,
            });
            return;
        }
        const [annotations, hasJSActions, fieldObjects] = await Promise.all([
            this.pdfPage.getAnnotations({ intent }),
            this._hasJSActionsPromise,
            this._fieldObjectsPromise,
        ]);
        if (this._cancelled) {
            return;
        }
        this.#numAnnotations = annotations.length;
        // Create an annotation layer div and render the annotations
        // if there is at least one annotation.
        this.div = document.createElement("div");
        this.div.className = "annotationLayer";
        this.pageDiv.append(this.div);
        if (this.#numAnnotations === 0) {
            this.hide();
            return;
        }
        AnnotationLayer.render({
            viewport: viewport.clone({ dontFlip: true }),
            div: this.div,
            annotations,
            page: this.pdfPage,
            imageResourcesPath: this.imageResourcesPath,
            renderForms: this.renderForms,
            linkService: this.linkService,
            downloadManager: this.downloadManager,
            annotationStorage: this.annotationStorage,
            enableScripting: this.enableScripting,
            hasJSActions,
            fieldObjects,
            annotationCanvasMap: this._annotationCanvasMap,
            accessibilityManager: this._accessibilityManager,
        });
        this.l10n.translate(this.div);
        // Ensure that interactive form elements in the annotationLayer are
        // disabled while PresentationMode is active (see issue 12232).
        if (this.linkService.isInPresentationMode) {
            this.#updatePresentationModeState(PresentationModeState.FULLSCREEN);
        }
        if (!this.#onPresentationModeChanged) {
            this.#onPresentationModeChanged = (evt) => {
                this.#updatePresentationModeState(evt.state);
            };
            this._eventBus?._on("presentationmodechanged", this.#onPresentationModeChanged);
        }
    }
    cancel() {
        this._cancelled = true;
        if (this.#onPresentationModeChanged) {
            this._eventBus?._off("presentationmodechanged", this.#onPresentationModeChanged);
            this.#onPresentationModeChanged = undefined;
        }
    }
    hide() {
        if (!this.div)
            return;
        this.div.hidden = true;
    }
    #updatePresentationModeState(state) {
        if (!this.div) {
            return;
        }
        let disableFormElements = false;
        switch (state) {
            case PresentationModeState.FULLSCREEN:
                disableFormElements = true;
                break;
            case PresentationModeState.NORMAL:
                break;
            default:
                return;
        }
        for (const section of this.div.childNodes) {
            if (section.hasAttribute("data-internal-link")) {
                continue;
            }
            section.inert = disableFormElements;
        }
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=annotation_layer_builder.js.map