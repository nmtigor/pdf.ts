/** 80**************************************************************************
 * @module pdf/demo
 * @license Apache-2.0
 ******************************************************************************/

import { fontFamilyMono, LOG_cssc } from "../alias.ts";
import { div } from "../lib/dom.ts";
import { getDocument } from "./pdf.ts-src/display/api.ts";
import { buildGetDocumentParams } from "./test_utils.ts";
/*80--------------------------------------------------------------------------*/

document.body.assignStylo({
  backgroundColor: "#333",

  whiteSpace: "pre",
  lineBreak: "anywhere",
  fontFamily: fontFamilyMono,
  fontSize: `24px`,
});

const log_el = div().assignStylo({
  color: "#fff",
});
const err_el = div().assignStylo({
  color: "#f00",
});

document.body.append(log_el, err_el);
/*64----------------------------------------------------------*/

const log = (_x: string) => {
  log_el.textContent += _x;
};

const err = (_x: string) => {
  err_el.textContent += _x;
};
/*80--------------------------------------------------------------------------*/

{
  await using loadingTask = getDocument(
    buildGetDocumentParams("issue10272.pdf"),
  );
  const pdfDoc = await loadingTask.promise;
  const destinations = await pdfDoc.getDestination("link_1");
  console.log(JSON.stringify(destinations, undefined, 4));
}

console.log(`%crun here: `, `color:${LOG_cssc.runhere}`);
/*80--------------------------------------------------------------------------*/
