import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./no-nuxt-auto-import.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const names = [{ names: ["ref", "computed", "Ref"] }];

test("no-nuxt-auto-import", () => {
  ruleTester.run("no-nuxt-auto-import", rule, {
    valid: [
      { code: `import type { Ref } from "vue";`, options: names },
      { code: `import { h } from "vue";`, options: names },
      { code: `import { type Ref, h } from "vue";`, options: names },
      { code: `import { ref } from "./local";`, options: names },
      { code: `import { ref } from "lodash-es";`, options: names },
      { code: `import { ref } from "vue";` },
      { code: `import Vue from "vue";`, options: names }
    ],
    invalid: [
      {
        code: `import { ref, computed } from "vue";`,
        options: names,
        errors: [
          { messageId: "autoImported", data: { name: "ref" } },
          { messageId: "autoImported", data: { name: "computed" } }
        ]
      },
      {
        code: `import { ref } from "#imports";`,
        options: names,
        errors: [{ messageId: "autoImported", data: { name: "ref" } }]
      },
      {
        code: `import { ref as r } from "vue";`,
        options: names,
        errors: [{ messageId: "autoImported", data: { name: "ref" } }]
      },
      {
        code: `import { type Ref, ref, h } from "vue";`,
        options: names,
        errors: [{ messageId: "autoImported", data: { name: "ref" } }]
      }
    ]
  });
});
