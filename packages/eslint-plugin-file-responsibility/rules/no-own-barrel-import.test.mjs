/**
 * @fileoverview RuleTester spec for `no-own-barrel-import`.
 *
 * Inside a module, a file never imports or re-exports its own `index.ts`:
 *   - `import` and `export ... from` of the own barrel are errors;
 *   - sibling files, another module's barrel, packages and the barrel's own
 *     re-exports stay legal.
 *
 * Run: node --test rules/no-own-barrel-import.test.mjs
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./no-own-barrel-import.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const root = mkdtempSync(join(tmpdir(), "no-own-barrel-import-"));
function touch(relPath) {
  const abs = join(root, relPath);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, "export const x = 1;\n", "utf8");
  return abs;
}
process.on("exit", () => rmSync(root, { recursive: true, force: true }));

const barrel = touch("modules/account/index.ts");
const file = touch("modules/account/useAccount.ts");
const nested = touch("modules/account/sub/helper.ts");
touch("modules/account/account.utils.ts");
touch("modules/other/index.ts");
touch("modules/other/other.utils.ts");

test("no-own-barrel-import", () => {
  ruleTester.run("no-own-barrel-import", rule, {
    valid: [
      { code: `import { x } from "./account.utils";`, filename: file },
      { code: `import { x } from "../other";`, filename: file },
      { code: `import { x } from "../other/index";`, filename: file },
      { code: `import { x } from "../other/other.utils";`, filename: file },
      { code: `import { ref } from "vue";`, filename: file },
      { code: `import { x } from "@/modules/account";`, filename: file },
      { code: `export { x } from "./account.utils";`, filename: file },
      { code: `import { x } from "../account.utils";`, filename: nested },
      { code: `export * from "./useAccount";`, filename: barrel },
      { code: `export { x } from "./account.utils";`, filename: barrel },
      {
        code: `import { x } from "./index";`,
        filename: "/repo/packages/headless/src/lib/thing.ts"
      }
    ],
    invalid: [
      {
        code: `import { x } from "./index";`,
        filename: file,
        errors: [{ messageId: "ownBarrel", data: { source: "./index" } }]
      },
      {
        code: `import { x } from ".";`,
        filename: file,
        errors: [{ messageId: "ownBarrel", data: { source: "." } }]
      },
      {
        code: `import { x } from "./";`,
        filename: file,
        errors: [{ messageId: "ownBarrel" }]
      },
      {
        code: `import type { T } from "./index";`,
        filename: file,
        errors: [{ messageId: "ownBarrel" }]
      },
      {
        code: `import "./index";`,
        filename: file,
        errors: [{ messageId: "ownBarrel" }]
      },
      {
        code: `export { x } from "./index";`,
        filename: file,
        errors: [{ messageId: "ownBarrel" }]
      },
      {
        code: `export * from "./index";`,
        filename: file,
        errors: [{ messageId: "ownBarrel" }]
      },
      {
        code: `import { x } from "../index";`,
        filename: nested,
        errors: [{ messageId: "ownBarrel", data: { source: "../index" } }]
      },
      {
        code: `import { x } from "..";`,
        filename: nested,
        errors: [{ messageId: "ownBarrel" }]
      }
    ]
  });
});
