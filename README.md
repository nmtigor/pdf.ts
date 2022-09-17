The purpose of this project is to help learning PDF format and developing PDF tools.

It is

* based on [pdf.js@v2.15.349](https://github.com/mozilla/pdf.js/tree/v2.15.349),

* **transpiled using [TypeScript@mymain](https://github.com/nmtigor/TypeScript/tree/mymain/PRs)!**

---

### viewer.html

* Extract [TypeScript@mymain](https://github.com/nmtigor/TypeScript) onto <ins>/path_to/TypeScript</ins>.
* Extract this project onto <ins>/path_to/pdf.ts</ins>.
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
* Start a local server for <ins>/path_to/pdf.ts</ins> at <ins>h</ins><ins>ttp://localhost:8000</ins>.
* Visit <ins>h</ins><ins>ttp://localhost:8000/src/pdf/pdf.ts-web/viewer.html</ins>.

---

### deno test

* In app_options.ts:67, change `D_base`  to `"file:///path_to/pdf.ts"`;
* In global.ts, change `DENO`, `TESTING` to `true`.
* 
  ```bash
  cd /path_to/pdf.ts/src/test
  deno test  --allow-read ../pdf/pdf.ts-src/core
  ```

---

### Current States - TODO

* Sync tests.
* `GENERIC` build.
* On browsers.
