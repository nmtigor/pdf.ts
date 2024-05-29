/** 80**************************************************************************
 * @module pdf/pdf.ts-web/alias
 * @license Apache-2.0
 ******************************************************************************/

import type { AnnotationEditorType } from "../pdf.ts-src/pdf.ts";
import type { NimbusExperimentData } from "./firefoxcom.ts";
import type { CursorTool, ScrollMode, SpreadMode } from "./ui_utils.ts";
/*80--------------------------------------------------------------------------*/

export type CaretPosition = {
  offsetNode: Node;
  offset: number;
};
/*64----------------------------------------------------------*/

export interface Anchor {
  element: HTMLAnchorElement;
  /**
   * For the case (Button | Anchor)[]
   * @see SecondaryToolbar.#bindListeners()
   */
  eventName?: undefined;
  close: boolean;
  eventDetails?: undefined;
}

type ButtonEventName =
  | "documentproperties"
  | "download"
  | "firstpage"
  | "lastpage"
  | "nextpage"
  | "openfile"
  | "previouspage"
  | "presentationmode"
  | "print"
  | "rotatecw"
  | "rotateccw"
  | "switchscrollmode"
  | "switchcursortool"
  | "switchannotationeditormode"
  | "switchspreadmode"
  | "zoomin"
  | "zoomout";
export interface Button {
  element: HTMLButtonElement;
  eventName: ButtonEventName;
  close?: boolean;
  eventDetails?: {
    tool?: CursorTool;
    mode?: ScrollMode | SpreadMode | AnnotationEditorType;
  };
  nimbusName?: keyof NimbusExperimentData;
}

/*80--------------------------------------------------------------------------*/
