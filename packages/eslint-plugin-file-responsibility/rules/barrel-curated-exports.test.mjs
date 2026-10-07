/**
 * @fileoverview RuleTester spec for `barrel-curated-exports`.
 *
 * In an `index.ts`:
 *   - `export *` from an @internal file is an error;
 *   - an unrenamed default re-export is an error;
 *   - a renamed default re-export and `export *` of a public file are legal.
 *
 * Run: node --test rules/barrel-curated-exports.test.mjs
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./barrel-curated-exports.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const root = mkdtempSync(join(tmpdir(), "barrel-curated-exports-"));
function touch(relPath) {
  const abs = join(root, relPath);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, "export const x = 1;\n", "utf8");
  return abs;
}
process.on("exit", () => rmSync(root, { recursive: true, force: true }));

const barrel = touch("modules/billing/index.ts");
const plainFile = touch("modules/billing/useBilling.ts");
touch("modules/billing/billing.types.ts");
touch("modules/billing/billing.utils.ts");
touch("modules/billing/billing.machine.ts");
touch("modules/billing/billing.services.ts");
touch("modules/billing/billing.services.client.ts");
touch("modules/billing/billing.mappers.ts");
touch("modules/billing/billing.schemas.ts");
touch("modules/billing/session-store.ts");

test("barrel-curated-exports", () => {
  ruleTester.run("barrel-curated-exports", rule, {
    valid: [
      {
        code: `export { default as billingMachine } from "./billing.machine";`,
        filename: barrel
      },
      { code: `export * from "./billing.types";`, filename: barrel },
      { code: `export * from "./billing.utils";`, filename: barrel },
      {
        code: `export { fetchBilling } from "./billing.services";`,
        filename: barrel
      },
      {
        code: `export { default as thing, other } from "./billing.utils";`,
        filename: barrel
      },
      { code: `export * from "./billing.machine";`, filename: plainFile },
      {
        code: `export { default } from "./billing.utils";`,
        filename: plainFile
      }
    ],
    invalid: [
      {
        code: `export * from "./billing.machine";`,
        filename: barrel,
        errors: [
          {
            messageId: "wildcardInternal",
            data: { source: "./billing.machine" }
          }
        ]
      },
      {
        code: `export * from "./billing.services";`,
        filename: barrel,
        errors: [{ messageId: "wildcardInternal" }]
      },
      {
        code: `export * from "./billing.services.client";`,
        filename: barrel,
        errors: [{ messageId: "wildcardInternal" }]
      },
      {
        code: `export * from "./billing.mappers";`,
        filename: barrel,
        errors: [{ messageId: "wildcardInternal" }]
      },
      {
        code: `export * from "./billing.schemas";`,
        filename: barrel,
        errors: [{ messageId: "wildcardInternal" }]
      },
      {
        code: `export * from "./session-store";`,
        filename: barrel,
        errors: [{ messageId: "wildcardInternal" }]
      },
      {
        code: `export { default } from "./billing.utils";`,
        filename: barrel,
        errors: [
          { messageId: "unnamedDefault", data: { source: "./billing.utils" } }
        ]
      },
      {
        code: `export { default, other } from "./billing.utils";`,
        filename: barrel,
        errors: [{ messageId: "unnamedDefault" }]
      },
      {
        code: `export { default } from "./billing.machine";`,
        filename: barrel,
        errors: [{ messageId: "unnamedDefault" }]
      }
    ]
  });
});
