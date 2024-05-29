The purpose of this project is to help learning PDF format and developing PDF
tools.

It is

- based on [pdf.js-4.1.392](https://github.com/mozilla/pdf.js/tree/v4.1.392),

- **transpiled using
  TypeScript-5.2.2[@mymain](https://github.com/nmtigor/TypeScript/tree/mymain/PRs)!**

---

- Extract [@mymain](https://github.com/nmtigor/TypeScript) onto
  <ins>/path_to/TypeScript</ins>
- ```bash
  cd /path_to/TypeScript
  npm i
  hereby LKG
  ```
- Extract this project onto <ins>/path_to/pdf.ts</ins>
  - In vscode, in the workspace setting, add
    `"typescript.tsdk": "/path_to/TypeScript/lib"`.

### deno test

- ```bash
  cd /path_to/pdf.ts/src/test
  deno run --allow-read --allow-run test.ts --tsc "/path_to/TypeScript/bin/tsc"
  # Deno-1.43.6: 54 passed (1086 steps)
  ```

### viewer.html

- ```bash
  cd /path_to/pdf.ts/src/test
  # Start a local file server
  deno run --allow-net --allow-read --allow-write=../baseurl.mjs test_server.ts
  ```
- ```bash
  cd /path_to/pdf.ts
  /path_to/TypeScript/bin/tsc --preprocessorNames ~DENO,~TESTING
  ```
- Visit
  <ins>h</ins><ins>ttp://localhost:9071/src/pdf/viewer.html</ins>

---

### Current States

- `GENERIC` build
- On browsers
