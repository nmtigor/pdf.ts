The purpose of this project is to help learning PDF format and developing PDF tools.

It is

* based on [pdf.js-3.11.174](https://github.com/mozilla/pdf.js/tree/v3.11.174),

* **transpiled using TypeScript-5.2.2[@mymain](https://github.com/nmtigor/TypeScript/tree/mymain/PRs)!**

--------------------------------------------------------------------------------

* Extract [@mymain](https://github.com/nmtigor/TypeScript) onto <ins>/path_to/TypeScript</ins>.
* 
  ```bash
  cd /path_to/TypeScript
  npm i
  hereby LKG
  ```
* Extract this project onto <ins>/path_to/pdf.ts</ins>.
  * In vscode, in the workspace setting, add `"typescript.tsdk": "/path_to/TypeScript/lib"`.
* 
  ```bash
  cd /path_to/pdf.ts/src/test
  # Start a local file server at port 8001
  deno run --allow-net --allow-read test_server.ts 
  ```

### viewer.html

* 
  ```bash
  cd /path_to/pdf.ts
  npm i
  /path_to/TypeScript/bin/tsc --preprocessorNames ~DENO,~TESTING
  ```
* Visit <ins>h</ins><ins>ttp://localhost:8001/src/pdf/pdf.ts-web/viewer.html</ins>.

### deno test

* 
  ```bash
  cd /path_to/pdf.ts
  # Bundle "pdf.worker.js" for "api_test.ts"
  /path_to/TypeScript/bin/tsc && deno run --allow-read --allow-sys --allow-env --allow-run util/bundle.ts gen/pdf/pdf.ts-src/pdf.worker.js
  cd src/test
  deno test --allow-net --allow-read --allow-write --reporter=dot ../pdf
  # Deno-1.37.2: 53 passed (1068 steps)
  # `--allow-write` is optional. If provided, tested PDFs will be downloaded
  # into "/path_to/pdf.ts/res/pdf/test/pdfs". (see "test_utils.ts:123")
  ```

--------------------------------------------------------------------------------

### Current States - TODO

* Sync tests.
* `GENERIC` build.
* On browsers.