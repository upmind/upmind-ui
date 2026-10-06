/**
 * @fileoverview RuleTester spec for `barrel-only-reexports`.
 *
 * A module `index.ts` holds curated re-exports only:
 *   - a declaration of any kind is an error;
 *   - `export *` from outside the module folder is an error;
 *   - a named re-export of an @internal file is an error;
 *   - `export * from "./x.types"` inside the module stays legal.
 *
 * Run: node --test rules/barrel-only-reexports.test.mjs
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./barrel-only-reexports.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const root = mkdtempSync(join(tmpdir(), "barrel-only-reexports-"));
function touch(relPath) {
  const abs = join(root, relPath);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, "export const x = 1;\n", "utf8");
  return abs;
}
process.on("exit", () => rmSync(root, { recursive: true, force: true }));

const barrel = touch("modules/account/index.ts");
const plainFile = touch("modules/account/useAccount.ts");
touch("modules/account/account.types.ts");
touch("modules/account/account.utils.ts");
touch("modules/account/account.machine.ts");
touch("modules/account/account.services.ts");
touch("modules/account/account.services.client.ts");
touch("modules/account/account.mappers.ts");
touch("modules/account/account.schemas.ts");
touch("modules/account/session-store.ts");
touch("modules/other/index.ts");
touch("modules/other/other.types.ts");

test("barrel-only-reexports", () => {
  ruleTester.run("barrel-only-reexports", rule, {
    valid: [
      { code: `export { useAccount } from "./useAccount";`, filename: barrel },
      {
        code: `export { useAccount, type UseAccount } from "./useAccount";`,
        filename: barrel
      },
      { code: `export * from "./account.types";`, filename: barrel },
      { code: `export * from "./account.utils";`, filename: barrel },
      { code: `export { helper } from "./account.utils";`, filename: barrel },
      {
        code: `export { default as thing } from "./account.utils";`,
        filename: barrel
      },
      {
        code: `import { useAccount } from "./useAccount";\nexport { useAccount };`,
        filename: barrel
      },
      { code: `export const x = 1;`, filename: plainFile },
      {
        code: `export function f() {}`,
        filename: "/repo/packages/headless/src/index.ts"
      }
    ],
    invalid: [
      {
        code: `export const x = 1;`,
        filename: barrel,
        errors: [{ messageId: "declaration" }]
      },
      {
        code: `const x = 1;`,
        filename: barrel,
        errors: [{ messageId: "declaration" }]
      },
      {
        code: `export function f() {}`,
        filename: barrel,
        errors: [{ messageId: "declaration" }]
      },
      {
        code: `function f() {}`,
        filename: barrel,
        errors: [{ messageId: "declaration" }]
      },
      {
        code: `export class A {}`,
        filename: barrel,
        errors: [{ messageId: "declaration" }]
      },
      {
        code: `class A {}`,
        filename: barrel,
        errors: [{ messageId: "declaration" }]
      },
      {
        code: `export type T = string;`,
        filename: barrel,
        errors: [{ messageId: "declaration" }]
      },
      {
        code: `type T = string;`,
        filename: barrel,
        errors: [{ messageId: "declaration" }]
      },
      {
        code: `export interface I { id: string }`,
        filename: barrel,
        errors: [{ messageId: "declaration" }]
      },
      {
        code: `interface I { id: string }`,
        filename: barrel,
        errors: [{ messageId: "declaration" }]
      },
      {
        code: `export enum E { A }`,
        filename: barrel,
        errors: [{ messageId: "declaration" }]
      },
      {
        code: `enum E { A }`,
        filename: barrel,
        errors: [{ messageId: "declaration" }]
      },
      {
        code: `export default 1;`,
        filename: barrel,
        errors: [{ messageId: "declaration" }]
      },
      {
        code: `export * from "../other";`,
        filename: barrel,
        errors: [{ messageId: "siblingWildcard", data: { source: "../other" } }]
      },
      {
        code: `export * from "../other/other.types";`,
        filename: barrel,
        errors: [{ messageId: "siblingWildcard" }]
      },
      {
        code: `export * from "../unknown/unknown.types";`,
        filename: barrel,
        errors: [{ messageId: "siblingWildcard" }]
      },
      {
        code: `export { machine } from "./account.machine";`,
        filename: barrel,
        errors: [
          {
            messageId: "internalReexport",
            data: { source: "./account.machine" }
          }
        ]
      },
      {
        code: `export { fetchAccount } from "./account.services";`,
        filename: barrel,
        errors: [{ messageId: "internalReexport" }]
      },
      {
        code: `export { fetchAccount } from "./account.services.client";`,
        filename: barrel,
        errors: [{ messageId: "internalReexport" }]
      },
      {
        code: `export { mapAccount } from "./account.mappers";`,
        filename: barrel,
        errors: [{ messageId: "internalReexport" }]
      },
      {
        code: `export { accountSchema } from "./account.schemas";`,
        filename: barrel,
        errors: [{ messageId: "internalReexport" }]
      },
      {
        code: `export { store } from "./session-store";`,
        filename: barrel,
        errors: [{ messageId: "internalReexport" }]
      }
    ]
  });
});
