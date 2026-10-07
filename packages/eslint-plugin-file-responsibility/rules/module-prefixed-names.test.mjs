/**
 * @fileoverview RuleTester spec for `module-prefixed-names`.
 *
 * In `packages/headless/src/modules/<module>/`, every file other than
 * `index.ts` starts with `<module>.` or `use`; sub-folders and other packages
 * are out of scope.
 *
 * Run: node --test rules/module-prefixed-names.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./module-prefixed-names.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const dir = "/repo/packages/headless/src/modules/basket";
const code = `export const a = 1;`;

test("module-prefixed-names", () => {
  ruleTester.run("module-prefixed-names", rule, {
    valid: [
      { code, filename: `${dir}/basket.machine.ts` },
      { code, filename: `${dir}/basket.actions.client.ts` },
      { code, filename: `${dir}/useBasket.ts` },
      { code, filename: `${dir}/index.ts` },
      { code, filename: `${dir}/__tests__/helpers.ts` },
      { code, filename: `${dir}/docs/notes.ts` },
      { code, filename: "/repo/packages/modules-card/src/helpers.ts" },
      { code, filename: "/repo/packages/headless/src/utils/helpers.ts" }
    ],
    invalid: [
      {
        code,
        filename: `${dir}/helpers.ts`,
        errors: [
          {
            messageId: "modulePrefix",
            data: { file: "helpers.ts", module: "basket" }
          }
        ]
      },
      {
        code,
        filename: `${dir}/machine.ts`,
        errors: [{ messageId: "modulePrefix" }]
      },
      {
        code,
        filename: `${dir}/basketHelpers.ts`,
        errors: [{ messageId: "modulePrefix" }]
      },
      {
        code,
        filename: `${dir}/other.machine.ts`,
        errors: [{ messageId: "modulePrefix" }]
      }
    ]
  });
});
