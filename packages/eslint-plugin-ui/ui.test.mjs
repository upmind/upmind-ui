/**
 * @fileoverview RuleTester specs for the `ui` plugin (composed-component laws).
 *
 * Every rule covers both directions — a valid case and an invalid case per
 * discriminator — so a gutted rule turns a spec red.
 *
 * Run: node --test packages/eslint-plugin-ui/ui.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import noLodashInComponents from "./rules/no-lodash-in-components.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

// ---------------------------------------------------------------------------
test("no-lodash-in-components", () => {
  ruleTester.run("no-lodash-in-components", noLodashInComponents, {
    valid: [
      // Native methods — the components' idiom.
      { code: `const ids = items.map(i => i.id);` },
      // The local helper the ban forces components to use.
      { code: `import { omit } from "../../lib/utils.ts";` },
      // A non-lodash package is fine.
      { code: `import { computed } from "vue";` },
      // A package whose name merely contains "lodash" is not lodash.
      { code: `import x from "not-lodash-thing";` }
    ],
    invalid: [
      {
        code: `import { map } from "lodash-es";`,
        errors: [{ messageId: "lodashImport" }]
      },
      {
        code: `import get from "lodash-es/get";`,
        errors: [{ messageId: "lodashImport" }]
      },
      {
        code: `import { filter } from "lodash";`,
        errors: [{ messageId: "lodashImport" }]
      },
      {
        code: `export { merge } from "lodash-es";`,
        errors: [{ messageId: "lodashImport" }]
      },
      {
        code: `const _ = require("lodash-es");`,
        errors: [{ messageId: "lodashImport" }]
      },
      {
        code: `const m = await import("lodash-es");`,
        errors: [{ messageId: "lodashImport" }]
      }
    ]
  });
});
