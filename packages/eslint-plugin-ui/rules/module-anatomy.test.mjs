import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./module-anatomy.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const code = `export const a = 1;`;
const src = "/repo/packages/modules-card/src";
const foundation = "/repo/packages/modules-foundation/src";

test("module-anatomy", () => {
  ruleTester.run("module-anatomy", rule, {
    valid: [
      { code, filename: `${src}/index.ts` },
      { code, filename: `${src}/types.ts` },
      { code, filename: `${src}/variants.ts` },
      { code, filename: `${src}/card.utils.ts` },
      { code, filename: `${src}/components/Card.ts` },
      { code, filename: `${src}/components/nested/deep/Card.ts` },
      { code, filename: `${src}/renderers/Text.ts` },
      { code, filename: `${src}/__tests__/card.test.ts` },
      { code, filename: "/repo/apps/web/src/helpers.ts" },
      { code, filename: "/repo/packages/headless/src/card.styles.ts" },
      { code, filename: `${foundation}/index.ts` },
      { code, filename: `${foundation}/auth/index.ts` },
      { code, filename: `${foundation}/auth/types.ts` },
      { code, filename: `${foundation}/auth/login.utils.ts` },
      { code, filename: `${foundation}/auth/components/Login.ts` },
      {
        code,
        filename: "/repo/packages/modules-other/src/auth/index.ts",
        options: [{ featurePackages: ["modules-other"] }]
      }
    ],
    invalid: [
      {
        code,
        filename: `${src}/helpers.ts`,
        errors: [{ messageId: "outsideAnatomy", data: { path: "helpers.ts" } }]
      },
      {
        code,
        filename: `${src}/hooks/useX.ts`,
        errors: [
          { messageId: "outsideAnatomy", data: { path: "hooks/useX.ts" } }
        ]
      },
      {
        code,
        filename: `${src}/card.styles.ts`,
        errors: [{ messageId: "styleFile", data: { path: "card.styles.ts" } }]
      },
      {
        code,
        filename: `${src}/components/Card.styles.ts`,
        errors: [{ messageId: "styleFile" }]
      },
      {
        code,
        filename: `${src}/components/Card.variants.ts`,
        errors: [{ messageId: "styleFile" }]
      },
      {
        code,
        filename: `${src}/card.variants.ts`,
        errors: [{ messageId: "styleFile" }]
      },
      {
        code,
        filename: `${foundation}/helpers.ts`,
        errors: [{ messageId: "outsideAnatomy" }]
      },
      {
        code,
        filename: `${foundation}/auth/helpers.ts`,
        errors: [{ messageId: "outsideAnatomy" }]
      },
      {
        code,
        filename: `${foundation}/auth/hooks/useX.ts`,
        errors: [{ messageId: "outsideAnatomy" }]
      },
      {
        code,
        filename: `${foundation}/auth/login.styles.ts`,
        errors: [{ messageId: "styleFile" }]
      },
      {
        code,
        filename: `${foundation}/auth/index.ts`,
        options: [{ featurePackages: ["modules-other"] }],
        errors: [{ messageId: "outsideAnatomy" }]
      }
    ]
  });
});
