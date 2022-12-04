The purpose of this project is to help learning PDF format and developing PDF tools.

It is

* based on [pdf.js@v3.1.81](https://github.com/mozilla/pdf.js/tree/v3.1.81),

* **transpiled using [TypeScript@mymain](https://github.com/nmtigor/TypeScript/tree/mymain/PRs)!**

--------------------------------------------------------------------------------

### viewer.html

* Extract [TypeScript@mymain](https://github.com/nmtigor/TypeScript) onto <ins>/path_to/TypeScript</ins>.
* Extract this project onto <ins>/path_to/pdf.ts</ins>.
  * In vscode, in the workspace setting, add `"typescript.tsdk": "/path_to/TypeScript/lib"`.
* 
  ```bash
  cd /path_to/pdf.ts
  npm i
  ```
* In global.ts, change `DENO`, `TESTING` to `false`.
* 
  ```bash
  /path_to/TypeScript/bin/tsc
  ```
* Start a local web server for <ins>/path_to/pdf.ts</ins> at <ins>h</ins><ins>ttp://localhost:8000</ins>.
* Visit <ins>h</ins><ins>ttp://localhost:8000/src/pdf/pdf.ts-web/viewer.html</ins>.

--------------------------------------------------------------------------------

### deno test

* In app_options.ts:66, change `D_base`  to `"file:///path_to/pdf.ts"`;
* In global.ts, change `DENO`, `TESTING` to `true`.
* 
  ```bash
  cd /path_to/pdf.ts/src/test
  deno test --allow-read --allow-net ../pdf/pdf.ts-src/core # 30 passed (648 steps)
  deno test ../pdf/pdf.ts-src/shared # 2 passed (16 steps)
  ```

--------------------------------------------------------------------------------

### Current States - TODO

* Sync tests.
* `GENERIC` build.
* On browsers.
