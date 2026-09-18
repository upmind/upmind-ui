/**
 * @fileoverview RuleTester spec for `ui/no-parts-import` (CC-C, FE-3247 Lint 6).
 *
 * The rule decides from two strings: the linted file's OWN path and each import
 * specifier. Both directions are driven by two real filenames via `filename` —
 * an app consumer OUTSIDE the components tree (held to the barrier) and an
 * INTERNAL component file (free to wire parts to parts).
 *
 * Run: node --test packages/eslint-plugin-ui/rules/no-parts-import.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import noPartsImport from "./no-parts-import.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

// Two filenames drive both directions: an app consumer (outside the components
// tree) is held to the barrier; an internal component file is not.
const APP = "/repo/apps/cart/src/pages/ServicePage.vue";
const INTERNAL =
  "/repo/design-system/packages/ui/src/components/tabs/parts/TabsHeader.vue";

test("no-parts-import", () => {
  ruleTester.run("no-parts-import", noPartsImport, {
    valid: [
      // App file importing the folder barrel — the sanctioned path.
      {
        code: `import { Tabs } from "@upmind/ui/components/tabs";`,
        filename: APP
      },
      // App file importing a non-parts deep path is not this rule's concern.
      {
        code: `import { thing } from "@upmind/ui/components/tabs/types";`,
        filename: APP
      },
      // An INTERNAL component file may wire parts to parts freely.
      {
        code: `import TabsList from "../../components/tabs/parts/TabsList.vue";`,
        filename: INTERNAL
      }
    ],
    invalid: [
      // App file deep-linking a part — static import.
      {
        code: `import TabsList from "@upmind/ui/components/tabs/parts/TabsList.vue";`,
        filename: APP,
        errors: [{ messageId: "partsImport" }]
      },
      // Re-export deep-link.
      {
        code: `export { TabsList } from "@upmind/ui/components/tabs/parts/TabsList.vue";`,
        filename: APP,
        errors: [{ messageId: "partsImport" }]
      },
      // require() deep-link.
      {
        code: `const L = require("@upmind/ui/components/tabs/parts/TabsList.vue");`,
        filename: APP,
        errors: [{ messageId: "partsImport" }]
      },
      // dynamic import() deep-link.
      {
        code: `const L = await import("@upmind/ui/components/tabs/parts/TabsList.vue");`,
        filename: APP,
        errors: [{ messageId: "partsImport" }]
      }
    ]
  });
});
