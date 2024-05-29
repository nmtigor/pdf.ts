/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2024
 *
 * @module pdf/pdf.ts-web/external_services.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { FindControlState } from "./app.js";
import type { EventMap } from "./event_utils.js";
import type { NimbusExperimentData } from "./firefoxcom.js";
import type { IScripting } from "./interfaces.js";
import type { L10n } from "./l10n.js";
import type { MatchesCount } from "./pdf_find_controller.js";
export declare abstract class BaseExternalServices {
    updateFindControlState(data: FindControlState): void;
    updateFindMatchesCount(data: MatchesCount): void;
    initPassiveLoading(): void;
    reportTelemetry(data: EventMap["reporttelemetry"]["details"]): void;
    abstract createL10n(): Promise<L10n>;
    abstract createScripting(): IScripting;
    updateEditorStates(data: EventMap["annotationeditorstateschanged"]): void;
    getNimbusExperimentData(): Promise<NimbusExperimentData | undefined>;
}
//# sourceMappingURL=external_services.d.ts.map