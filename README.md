The purpose of this project is to help learning PDF format and developing PDF tools.

It is

* based on [pdf.js@v3.4.120](https://github.com/mozilla/pdf.js/tree/v3.4.120),

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
* 
  ```bash
  cd /path_to/pdf.ts/src/test
  deno run --allow-net --allow-read test_server.ts # Start a local file server at port 8000
  ```
* Visit <ins>h</ins><ins>ttp://localhost:8000/src/pdf/pdf.ts-web/viewer.html</ins>.

--------------------------------------------------------------------------------

### deno test

* In global.ts, change `DENO`, `TESTING` to `true`.
* 
  ```bash
  cd /path_to/pdf.ts/src/test
  deno run --allow-net --allow-read test_server.ts # Start a local file server at port 8000
  ```
* 
  ```bash
  cd /path_to/pdf.ts/src/test
  deno test --allow-net --allow-read ../pdf # 50 passed (1015 steps)
  ```

--------------------------------------------------------------------------------

### Current States - TODO

* Sync tests.
* `GENERIC` build.
* On browsers.